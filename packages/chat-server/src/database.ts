import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

export interface User {
  id: string;
  email: string;
  created_at: Date;
}

export interface Conversation {
  id: string;
  user_email: string;
  created_at: Date;
  updated_at: Date;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_type: 'user' | 'admin';
  content: string;
  created_at: Date;
}

export class Database {
  async createUser(email: string): Promise<User> {
    const query = `
      INSERT INTO users (email) 
      VALUES ($1) 
      ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email
      RETURNING *
    `;
    const result = await pool.query(query, [email]);
    return result.rows[0];
  }

  async getOrCreateConversation(userEmail: string): Promise<Conversation> {
    let query = 'SELECT * FROM conversations WHERE user_email = $1';
    let result = await pool.query(query, [userEmail]);
    
    if (result.rows.length === 0) {
      query = `
        INSERT INTO conversations (user_email) 
        VALUES ($1) 
        RETURNING *
      `;
      result = await pool.query(query, [userEmail]);
    }
    
    return result.rows[0];
  }

  async saveMessage(conversationId: string, senderType: 'user' | 'admin', content: string): Promise<Message> {
    const query = `
      INSERT INTO messages (conversation_id, sender_type, content)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    const result = await pool.query(query, [conversationId, senderType, content]);
    return result.rows[0];
  }

  async getMessages(conversationId: string, limit: number = 50): Promise<Message[]> {
    const query = `
      SELECT * FROM messages 
      WHERE conversation_id = $1 
      ORDER BY created_at ASC 
      LIMIT $2
    `;
    const result = await pool.query(query, [conversationId, limit]);
    return result.rows;
  }

  async getAllConversations(): Promise<(Conversation & { latest_message?: Message })[]> {
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
        created_at: row.latest_message_time
      } : undefined
    }));
  }
}

export const db = new Database();