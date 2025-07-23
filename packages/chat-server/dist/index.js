"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const web_push_1 = __importDefault(require("web-push"));
const database_1 = require("./database");
dotenv_1.default.config();
const app = (0, express_1.default)();
const server = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    },
    pingTimeout: 60000,
    pingInterval: 25000,
    upgradeTimeout: 30000,
    allowEIO3: true
});
app.use((0, cors_1.default)());
app.use(express_1.default.json());
const PORT = process.env.PORT || 3001;
// Store active connections
const userConnections = new Map(); // email -> socketId
const adminConnections = new Set(); // admin socket IDs
const adminPushSubscriptions = new Map(); // admin socketId -> push subscription
// Web Push Configuration
web_push_1.default.setVapidDetails('mailto:admin@chatapp.com', 'BLVXH6ipGcknKngbsLMRZDUBpjT5o8sbz4Y1o921zlOpCsQTGEr1GGhBx6-aLsnIu5qM-J21ZuR1eXCWfbwB3Kw', // Public Key
'Ry2zi3_jRr5cktypiztT2YuQ3sM6e_1mr6QOIL7SAAw' // Private Key - Should be from environment
);
// REST API Routes
app.get('/api/conversations', async (req, res) => {
    try {
        const conversations = await database_1.db.getAllConversations();
        res.json(conversations);
    }
    catch (error) {
        console.error('Error fetching conversations:', error);
        res.status(500).json({ error: 'Failed to fetch conversations' });
    }
});
app.get('/api/conversations/:id/messages', async (req, res) => {
    try {
        const { id } = req.params;
        const { offset = 0, limit = 10, direction = 'desc' } = req.query;
        // Use pagination if query params provided, otherwise use legacy method
        if (req.query.offset !== undefined || req.query.limit !== undefined) {
            const messages = await database_1.db.getMessagesWithPagination(id, parseInt(offset), parseInt(limit), direction);
            const totalCount = await database_1.db.getMessageCount(id);
            res.json({
                messages,
                pagination: {
                    offset: parseInt(offset),
                    limit: parseInt(limit),
                    total: totalCount,
                    hasMore: (parseInt(offset) + parseInt(limit)) < totalCount
                }
            });
        }
        else {
            // Legacy endpoint behavior
            const messages = await database_1.db.getMessages(id);
            res.json(messages);
        }
    }
    catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
});
// Get unread messages for admin notifications
app.get('/api/unread-messages', async (req, res) => {
    try {
        const { limit = 10, userEmail } = req.query;
        const unreadMessages = await database_1.db.getUnreadMessages(userEmail, parseInt(limit));
        res.json(unreadMessages);
    }
    catch (error) {
        console.error('Error fetching unread messages:', error);
        res.status(500).json({ error: 'Failed to fetch unread messages' });
    }
});
// Mark message as read
app.post('/api/messages/:id/read', async (req, res) => {
    try {
        const { id } = req.params;
        const { readBy = 'admin' } = req.body;
        const updatedMessage = await database_1.db.markMessageAsRead(id, readBy);
        // Emit read status update to relevant clients
        io.emit('message-read', {
            messageId: id,
            readBy,
            readAt: updatedMessage.read_at
        });
        res.json({ success: true, message: updatedMessage });
    }
    catch (error) {
        console.error('Error marking message as read:', error);
        res.status(500).json({ error: 'Failed to mark message as read' });
    }
});
// Mark conversation as read
app.post('/api/conversations/:id/read', async (req, res) => {
    try {
        const { id } = req.params;
        const { readBy = 'admin' } = req.body;
        const updatedCount = await database_1.db.markConversationAsRead(id, readBy);
        // Emit conversation read status update
        io.emit('conversation-read', {
            conversationId: id,
            readBy,
            updatedCount
        });
        res.json({ success: true, updatedCount });
    }
    catch (error) {
        console.error('Error marking conversation as read:', error);
        res.status(500).json({ error: 'Failed to mark conversation as read' });
    }
});
// Push notification subscription endpoint
app.post('/api/admin/push/subscribe', (req, res) => {
    try {
        const subscription = req.body;
        console.log('Admin subscribed to push notifications:', subscription.endpoint);
        // Store subscription (in production, save to database)
        // For now, we'll broadcast to all connected admins
        adminConnections.forEach(adminSocketId => {
            adminPushSubscriptions.set(adminSocketId, subscription);
        });
        res.status(201).json({ success: true });
    }
    catch (error) {
        console.error('Error subscribing to push notifications:', error);
        res.status(500).json({ error: 'Failed to subscribe' });
    }
});
// Send push notification helper function
const sendPushNotification = async (subscription, payload) => {
    try {
        await web_push_1.default.sendNotification(subscription, JSON.stringify(payload));
        console.log('Push notification sent successfully');
    }
    catch (error) {
        console.error('Error sending push notification:', error);
    }
};
// Test push notification endpoint
app.post('/api/admin/test-push', async (req, res) => {
    try {
        const { title, body, data } = req.body;
        const payload = {
            title: title || 'Test Notification',
            body: body || 'This is a test push notification',
            icon: '/favicon.ico',
            data: data || { test: true }
        };
        // Send to all subscribed admins
        const promises = Array.from(adminPushSubscriptions.values()).map(subscription => sendPushNotification(subscription, payload));
        await Promise.allSettled(promises);
        res.json({
            success: true,
            message: `Test push sent to ${adminPushSubscriptions.size} subscribers`
        });
    }
    catch (error) {
        console.error('Error sending test push:', error);
        res.status(500).json({ error: 'Failed to send test push' });
    }
});
// Socket.IO Events
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
    // Handle connection errors
    socket.on('error', (error) => {
        console.error('Socket error for', socket.id, ':', error);
    });
    // User joins chat
    socket.on('join-user', async (data) => {
        try {
            console.log('Received join-user event:', data);
            const { email } = data;
            // Create user if doesn't exist
            await database_1.db.createUser(email);
            // Get or create conversation
            const conversation = await database_1.db.getOrCreateConversation(email);
            console.log('Created/found conversation:', conversation.id, 'for email:', email);
            // Join conversation room
            socket.join(`conversation-${conversation.id}`);
            userConnections.set(email, socket.id);
            // Send conversation info and message history
            // Use consistent pagination logic - load most recent 20 messages like admin
            const messages = await database_1.db.getMessagesWithPagination(conversation.id, 0, 20, 'desc');
            console.log('Sending conversation-joined event with', messages.length, 'messages');
            console.log(`🔍 [DEBUG] Messages for ${email} (conversation ${conversation.id}):`);
            messages.slice(0, 3).forEach((msg, index) => {
                console.log(`  ${index + 1}. [${msg.sender_type}] ${msg.content.substring(0, 30)}... at ${msg.created_at}`);
            });
            socket.emit('conversation-joined', {
                conversationId: conversation.id,
                messages
            });
            // Notify admins about user joining
            adminConnections.forEach(adminSocketId => {
                io.to(adminSocketId).emit('user-online', { email, conversationId: conversation.id });
            });
        }
        catch (error) {
            console.error('Error joining user:', error);
            socket.emit('error', { message: 'Failed to join chat' });
        }
    });
    // Admin joins
    socket.on('join-admin', () => {
        adminConnections.add(socket.id);
        socket.emit('admin-joined');
        console.log('Admin connected:', socket.id);
    });
    // User sends message
    socket.on('user-message', async (data) => {
        try {
            console.log('Received user-message:', { email: data.email, conversationId: data.conversationId, content: data.content.substring(0, 50) + '...' });
            const { conversationId, content, email } = data;
            // Save message to database
            const message = await database_1.db.saveMessage(conversationId, 'user', content);
            // Broadcast to conversation room
            io.to(`conversation-${conversationId}`).emit('new-message', message);
            // Notify all admins via Socket.IO
            console.log('Notifying', adminConnections.size, 'admins about new user message');
            adminConnections.forEach(adminSocketId => {
                io.to(adminSocketId).emit('new-user-message', {
                    ...message,
                    userEmail: email
                });
            });
            // Send push notifications to all subscribed admins
            adminPushSubscriptions.forEach(async (subscription, adminSocketId) => {
                const payload = {
                    title: `New message from ${email}`,
                    body: content.length > 50 ? content.substring(0, 50) + '...' : content,
                    icon: '/favicon.ico',
                    data: {
                        conversationId,
                        userEmail: email,
                        url: '/',
                        timestamp: Date.now()
                    }
                };
                await sendPushNotification(subscription, payload);
            });
        }
        catch (error) {
            console.error('Error sending user message:', error);
            socket.emit('error', { message: 'Failed to send message' });
        }
    });
    // Admin sends message
    socket.on('admin-message', async (data) => {
        try {
            const { conversationId, content } = data;
            // Save message to database
            const message = await database_1.db.saveMessage(conversationId, 'admin', content);
            // Broadcast to conversation room
            io.to(`conversation-${conversationId}`).emit('new-message', message);
            // Notify other admins
            adminConnections.forEach(adminSocketId => {
                if (adminSocketId !== socket.id) {
                    io.to(adminSocketId).emit('new-admin-message', message);
                }
            });
        }
        catch (error) {
            console.error('Error sending admin message:', error);
            socket.emit('error', { message: 'Failed to send message' });
        }
    });
    // Admin broadcast to all users
    socket.on('admin-broadcast', async (data) => {
        try {
            const { content } = data;
            // Get all conversations and send broadcast message
            const conversations = await database_1.db.getAllConversations();
            for (const conversation of conversations) {
                const message = await database_1.db.saveMessage(conversation.id, 'admin', content);
                io.to(`conversation-${conversation.id}`).emit('new-message', message);
            }
            // Notify all admins about the broadcast
            adminConnections.forEach(adminSocketId => {
                io.to(adminSocketId).emit('broadcast-sent', { content });
            });
        }
        catch (error) {
            console.error('Error broadcasting message:', error);
            socket.emit('error', { message: 'Failed to broadcast message' });
        }
    });
    // Handle typing indicators
    socket.on('user-typing', (data) => {
        // Notify admins that user is typing
        adminConnections.forEach(adminSocketId => {
            io.to(adminSocketId).emit('user-typing', {
                conversationId: data.conversationId,
                email: data.email
            });
        });
    });
    socket.on('user-stopped-typing', (data) => {
        // Notify admins that user stopped typing
        adminConnections.forEach(adminSocketId => {
            io.to(adminSocketId).emit('user-stopped-typing', {
                email: data.email
            });
        });
    });
    socket.on('admin-typing', (data) => {
        // Notify users in conversation that admin is typing
        socket.to(`conversation-${data.conversationId}`).emit('admin-typing');
    });
    socket.on('admin-stopped-typing', (data) => {
        // Notify users in conversation that admin stopped typing
        socket.to(`conversation-${data.conversationId}`).emit('admin-stopped-typing');
    });
    // Handle message read status
    socket.on('mark-conversation-read', async (data) => {
        try {
            const readBy = adminConnections.has(socket.id) ? 'admin' : 'user';
            await database_1.db.markConversationAsRead(data.conversationId, readBy);
            // Emit read status to all clients in the conversation
            io.to(`conversation-${data.conversationId}`).emit('conversation-read', {
                conversationId: data.conversationId,
                readBy,
                readAt: new Date()
            });
            // Notify admins about read status update
            adminConnections.forEach(adminSocketId => {
                io.to(adminSocketId).emit('conversation-read', {
                    conversationId: data.conversationId,
                    readBy,
                    readAt: new Date()
                });
            });
        }
        catch (error) {
            console.error('Error marking conversation as read:', error);
        }
    });
    socket.on('mark-message-read', async (data) => {
        try {
            const readBy = adminConnections.has(socket.id) ? 'admin' : 'user';
            const updatedMessage = await database_1.db.markMessageAsRead(data.messageId, readBy);
            // Emit read status to relevant clients
            io.emit('message-read', {
                messageId: data.messageId,
                readBy,
                readAt: updatedMessage.read_at
            });
        }
        catch (error) {
            console.error('Error marking message as read:', error);
        }
    });
    // Handle disconnection
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        // Remove from user connections
        for (const [email, socketId] of userConnections.entries()) {
            if (socketId === socket.id) {
                userConnections.delete(email);
                // Notify admins about user going offline
                adminConnections.forEach(adminSocketId => {
                    io.to(adminSocketId).emit('user-offline', { email });
                });
                break;
            }
        }
        // Remove from admin connections
        adminConnections.delete(socket.id);
    });
});
server.listen(PORT, () => {
    console.log(`Chat server running on port ${PORT}`);
});
