"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = exports.Database = void 0;
const pg_1 = require("pg");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const pool = new pg_1.Pool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
});
class Database {
    async createUser(email) {
        const query = `
      INSERT INTO users (email) 
      VALUES ($1) 
      ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email
      RETURNING *
    `;
        const result = await pool.query(query, [email]);
        return result.rows[0];
    }
    async getOrCreateConversation(userEmail) {
        console.log(`🔍 [DEBUG] getOrCreateConversation called for: ${userEmail}`);
        let query = 'SELECT * FROM conversations WHERE user_email = $1';
        let result = await pool.query(query, [userEmail]);
        console.log(`🔍 [DEBUG] Found ${result.rows.length} existing conversations for ${userEmail}`);
        if (result.rows.length === 0) {
            console.log(`🔍 [DEBUG] Creating new conversation for ${userEmail}`);
            query = `
        INSERT INTO conversations (user_email) 
        VALUES ($1) 
        RETURNING *
      `;
            result = await pool.query(query, [userEmail]);
            console.log(`🔍 [DEBUG] Created conversation ${result.rows[0].id} for ${userEmail}`);
        }
        else {
            console.log(`🔍 [DEBUG] Using existing conversation ${result.rows[0].id} for ${userEmail}`);
        }
        const conversation = result.rows[0];
        console.log(`🔍 [DEBUG] Returning conversation: ID=${conversation.id}, User=${conversation.user_email}`);
        return conversation;
    }
    async saveMessage(conversationId, senderType, content) {
        const query = `
      INSERT INTO messages (conversation_id, sender_type, content, delivered_at)
      VALUES ($1, $2, $3, CURRENT_TIMESTAMP AT TIME ZONE 'UTC')
      RETURNING *,
        created_at AT TIME ZONE 'UTC' as created_at_utc,
        delivered_at AT TIME ZONE 'UTC' as delivered_at_utc
    `;
        const result = await pool.query(query, [conversationId, senderType, content]);
        return result.rows[0];
    }
    async getMessages(conversationId, limit = 5) {
        console.log(`🔍 [DEBUG] getMessages called for conversation: ${conversationId}, limit: ${limit}`);
        // Use same logic as getMessagesWithPagination for consistency
        return this.getMessagesWithPagination(conversationId, 0, limit, 'asc');
    }
    async getMessagesWithPagination(conversationId, offset = 0, limit = 10, direction = 'desc') {
        console.log(`🔍 [DEBUG] getMessagesWithPagination: conv=${conversationId}, offset=${offset}, limit=${limit}, direction=${direction}`);
        const query = `
      SELECT *,
        created_at AT TIME ZONE 'UTC' as created_at_utc,
        delivered_at AT TIME ZONE 'UTC' as delivered_at_utc,
        read_at AT TIME ZONE 'UTC' as read_at_utc
      FROM messages 
      WHERE conversation_id = $1 
      ORDER BY created_at ${direction.toUpperCase()} 
      LIMIT $2 OFFSET $3
    `;
        const result = await pool.query(query, [conversationId, limit, offset]);
        console.log(`🔍 [DEBUG] Found ${result.rows.length} messages for conversation ${conversationId}`);
        // For DESC queries, reverse to get chronological order (oldest first)
        const messages = direction === 'desc' ? result.rows.reverse() : result.rows;
        // Validate all messages belong to the correct conversation
        const wrongConvMessages = messages.filter(msg => msg.conversation_id !== conversationId);
        if (wrongConvMessages.length > 0) {
            console.log(`🚨 [BUG FOUND] ${wrongConvMessages.length} messages have wrong conversation_id!`);
            wrongConvMessages.forEach(msg => {
                console.log(`  - Message ${msg.id} has conv_id ${msg.conversation_id} (should be ${conversationId})`);
            });
        }
        return messages;
    }
    async getUnreadMessages(userEmail, limit = 10) {
        let query = `
      SELECT m.*, c.user_email 
      FROM messages m
      JOIN conversations c ON m.conversation_id = c.id
      WHERE m.sender_type = 'user' AND m.read_at IS NULL
    `;
        const params = [];
        if (userEmail) {
            query += ` AND c.user_email = $1`;
            params.push(userEmail);
        }
        query += ` ORDER BY m.created_at DESC LIMIT $${params.length + 1}`;
        params.push(limit);
        const result = await pool.query(query, params);
        return result.rows;
    }
    async markMessageAsRead(messageId, readBy) {
        const readTimestamp = new Date().toISOString();
        const query = `
      UPDATE messages 
      SET read_at = CURRENT_TIMESTAMP AT TIME ZONE 'UTC', 
          read_status = read_status || $2::jsonb
      WHERE id = $1
      RETURNING *,
        created_at AT TIME ZONE 'UTC' as created_at_utc,
        delivered_at AT TIME ZONE 'UTC' as delivered_at_utc,
        read_at AT TIME ZONE 'UTC' as read_at_utc
    `;
        const readStatus = JSON.stringify({ [readBy]: readTimestamp });
        const result = await pool.query(query, [messageId, readStatus]);
        return result.rows[0];
    }
    async markConversationAsRead(conversationId, readBy) {
        const readTimestamp = new Date().toISOString();
        const query = `
      UPDATE messages 
      SET read_at = CURRENT_TIMESTAMP AT TIME ZONE 'UTC', 
          read_status = read_status || $2::jsonb
      WHERE conversation_id = $1 AND read_at IS NULL
      RETURNING id
    `;
        const readStatus = JSON.stringify({ [readBy]: readTimestamp });
        const result = await pool.query(query, [conversationId, readStatus]);
        return result.rowCount || 0;
    }
    async getMessageCount(conversationId) {
        const query = `SELECT COUNT(*) as count FROM messages WHERE conversation_id = $1`;
        const result = await pool.query(query, [conversationId]);
        return parseInt(result.rows[0].count);
    }
    async getAllConversations() {
        const query = `
      SELECT 
        c.*,
        m.content as latest_message_content,
        m.sender_type as latest_message_sender,
        m.created_at as latest_message_time
      FROM conversations c
      LEFT JOIN LATERAL (
        SELECT * FROM messages 
        WHERE conversation_id = c.id 
        ORDER BY created_at DESC 
        LIMIT 1
      ) m ON true
      ORDER BY COALESCE(m.created_at, c.created_at) DESC
    `;
        const result = await pool.query(query);
        return result.rows.map(row => ({
            id: row.id,
            user_email: row.user_email,
            created_at: row.created_at,
            updated_at: row.updated_at,
            latest_message: row.latest_message_content ? {
                id: '',
                conversation_id: row.id,
                sender_type: row.latest_message_sender,
                content: row.latest_message_content,
                created_at: row.latest_message_time,
                delivered_at: row.latest_message_time,
                read_at: undefined,
                read_status: {}
            } : undefined
        }));
    }
}
exports.Database = Database;
exports.db = new Database();
