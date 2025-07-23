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
const validation_1 = require("./validation");
const auth_1 = require("./auth");
const health_1 = require("./health");
dotenv_1.default.config();
const app = (0, express_1.default)();
const server = (0, http_1.createServer)(app);
// CORS configuration with environment-based allowed origins
const allowedOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
    : [
        'http://localhost:3000', // Admin interface
        'http://localhost:5500', // Test server
        'http://localhost:5173', // Widget dev server
        'https://your-production-domain.com' // Production domain
    ];
const corsOptions = {
    origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, server-to-server, etc.)
        if (!origin)
            return callback(null, true);
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        }
        else {
            console.warn(`CORS blocked request from origin: ${origin}`);
            callback(new Error('Not allowed by CORS'), false);
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-requested-with'],
    credentials: true,
    optionsSuccessStatus: 200
};
const io = new socket_io_1.Server(server, {
    cors: {
        origin: allowedOrigins,
        methods: ["GET", "POST"],
        allowedHeaders: ["Content-Type", "Authorization"],
        credentials: true
    },
    pingTimeout: 60000,
    pingInterval: 25000,
    upgradeTimeout: 30000,
    allowEIO3: true
});
app.use((0, cors_1.default)(corsOptions));
app.use(express_1.default.json({ limit: '10mb' })); // Add payload size limit
const PORT = process.env.PORT || 3001;
// Store active connections
const userConnections = new Map(); // email -> socketId
const adminConnections = new Set(); // admin socket IDs
const adminPushSubscriptions = new Map(); // admin socketId -> push subscription
// Web Push Configuration
web_push_1.default.setVapidDetails('mailto:admin@chatapp.com', 'BLVXH6ipGcknKngbsLMRZDUBpjT5o8sbz4Y1o921zlOpCsQTGEr1GGhBx6-aLsnIu5qM-J21ZuR1eXCWfbwB3Kw', // Public Key
'Ry2zi3_jRr5cktypiztT2YuQ3sM6e_1mr6QOIL7SAAw' // Private Key - Should be from environment
);
// Authentication Routes
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password required' });
        }
        const auth = await (0, auth_1.authenticateAdmin)(username, password);
        if (!auth) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        res.json({ token: auth.token, message: 'Login successful' });
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
app.post('/api/auth/verify', auth_1.requireAuth, (req, res) => {
    res.json({
        valid: true,
        user: {
            username: req.user.username,
            role: req.user.role
        }
    });
});
// Protected admin routes
app.get('/api/conversations', auth_1.requireAuth, auth_1.requireAdmin, async (req, res) => {
    try {
        const conversations = await database_1.db.getAllConversations();
        res.json(conversations);
    }
    catch (error) {
        console.error('Error fetching conversations:', error);
        res.status(500).json({ error: 'Failed to fetch conversations' });
    }
});
app.get('/api/conversations/:id/messages', auth_1.requireAuth, auth_1.requireAdmin, (0, validation_1.validate)(validation_1.validationSchemas.getMessages), async (req, res) => {
    try {
        const { id } = req.params;
        const { offset, limit, direction } = req.query;
        // Check rate limiting
        const clientId = req.ip || 'unknown';
        if (!(0, validation_1.checkRateLimit)(`messages:${clientId}`, 200, 15 * 60 * 1000)) {
            return res.status(429).json({
                error: 'Rate limit exceeded',
                message: 'Too many message requests. Please try again later.'
            });
        }
        // Use pagination if query params provided, otherwise use legacy method
        if (req.query.offset !== undefined || req.query.limit !== undefined) {
            const messages = await database_1.db.getMessagesWithPagination(validation_1.sanitize.uuid(id), offset, limit, direction);
            const totalCount = await database_1.db.getMessageCount(validation_1.sanitize.uuid(id));
            res.json({
                messages,
                pagination: {
                    offset,
                    limit,
                    total: totalCount,
                    hasMore: (offset + limit) < totalCount
                }
            });
        }
        else {
            // Legacy endpoint behavior
            const messages = await database_1.db.getMessages(validation_1.sanitize.uuid(id));
            res.json(messages);
        }
    }
    catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
});
// Get unread messages for admin notifications
app.get('/api/unread-messages', (0, validation_1.validate)(validation_1.validationSchemas.getUnreadMessages), async (req, res) => {
    try {
        const { limit, userEmail } = req.query;
        // Check rate limiting
        const clientId = req.ip || 'unknown';
        if (!(0, validation_1.checkRateLimit)(`unread:${clientId}`, 100, 15 * 60 * 1000)) {
            return res.status(429).json({
                error: 'Rate limit exceeded',
                message: 'Too many unread message requests. Please try again later.'
            });
        }
        const unreadMessages = await database_1.db.getUnreadMessages(userEmail ? validation_1.sanitize.email(userEmail) : undefined, limit);
        res.json(unreadMessages);
    }
    catch (error) {
        console.error('Error fetching unread messages:', error);
        res.status(500).json({ error: 'Failed to fetch unread messages' });
    }
});
// Mark message as read
app.post('/api/messages/:id/read', auth_1.requireAuth, auth_1.requireAdmin, (0, validation_1.validate)(validation_1.validationSchemas.markMessageRead), async (req, res) => {
    try {
        const { id } = req.params;
        const { readBy } = req.body;
        // Check rate limiting
        const clientId = req.ip || 'unknown';
        if (!(0, validation_1.checkRateLimit)(`read:${clientId}`, 500, 15 * 60 * 1000)) {
            return res.status(429).json({
                error: 'Rate limit exceeded',
                message: 'Too many read requests. Please try again later.'
            });
        }
        const updatedMessage = await database_1.db.markMessageAsRead(validation_1.sanitize.uuid(id), readBy);
        // Emit read status update to relevant clients
        io.emit('message-read', {
            messageId: validation_1.sanitize.uuid(id),
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
app.post('/api/conversations/:id/read', auth_1.requireAuth, auth_1.requireAdmin, (0, validation_1.validate)(validation_1.validationSchemas.markConversationRead), async (req, res) => {
    try {
        const { id } = req.params;
        const { readBy } = req.body;
        // Check rate limiting
        const clientId = req.ip || 'unknown';
        if (!(0, validation_1.checkRateLimit)(`read:${clientId}`, 500, 15 * 60 * 1000)) {
            return res.status(429).json({
                error: 'Rate limit exceeded',
                message: 'Too many read requests. Please try again later.'
            });
        }
        const updatedCount = await database_1.db.markConversationAsRead(validation_1.sanitize.uuid(id), readBy);
        // Emit conversation read status update
        io.emit('conversation-read', {
            conversationId: validation_1.sanitize.uuid(id),
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
app.post('/api/admin/push/subscribe', auth_1.requireAuth, auth_1.requireAdmin, (0, validation_1.validate)(validation_1.validationSchemas.pushSubscribe), (req, res) => {
    try {
        const subscription = req.body;
        // Check rate limiting
        const clientId = req.ip || 'unknown';
        if (!(0, validation_1.checkRateLimit)(`push-subscribe:${clientId}`, 10, 15 * 60 * 1000)) {
            return res.status(429).json({
                error: 'Rate limit exceeded',
                message: 'Too many subscription requests. Please try again later.'
            });
        }
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
app.post('/api/admin/test-push', auth_1.requireAuth, auth_1.requireAdmin, (0, validation_1.validate)(validation_1.validationSchemas.testPush), async (req, res) => {
    try {
        const { title, body, data } = req.body;
        // Check rate limiting
        const clientId = req.ip || 'unknown';
        if (!(0, validation_1.checkRateLimit)(`test-push:${clientId}`, 5, 15 * 60 * 1000)) {
            return res.status(429).json({
                error: 'Rate limit exceeded',
                message: 'Too many test push requests. Please try again later.'
            });
        }
        const payload = {
            title: validation_1.sanitize.content(title),
            body: validation_1.sanitize.content(body),
            icon: '/favicon.ico',
            data: data
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
            // Validate input data
            const validation = (0, validation_1.validateSocketData)(validation_1.validationSchemas.socketEvents.joinUser, data);
            if (!validation.isValid) {
                console.warn(`❌ Invalid join-user data from ${socket.id}:`, validation.error);
                socket.emit('error', { message: `Invalid data: ${validation.error}` });
                return;
            }
            console.log('Received join-user event:', data);
            const { email } = validation.value;
            // Create user if doesn't exist
            await database_1.db.createUser(validation_1.sanitize.email(email));
            // Get or create conversation
            const conversation = await database_1.db.getOrCreateConversation(email);
            console.log('Created/found conversation:', conversation.id, 'for email:', email);
            // Join conversation room
            socket.join(`conversation-${conversation.id}`);
            userConnections.set(email, socket.id);
            // Send conversation info and message history
            // Load only 5 most recent messages initially, user can scroll to load more
            const messages = await database_1.db.getMessagesWithPagination(conversation.id, 0, 5, 'desc');
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
            // Validate input data
            const validation = (0, validation_1.validateSocketData)(validation_1.validationSchemas.socketEvents.userMessage, data);
            if (!validation.isValid) {
                console.warn(`❌ Invalid user-message data from ${socket.id}:`, validation.error);
                socket.emit('error', { message: `Invalid message data: ${validation.error}` });
                return;
            }
            const { conversationId, content, email } = validation.value;
            console.log('Received user-message:', { email, conversationId, content: content.substring(0, 50) + '...' });
            // Save message to database with sanitized content
            const message = await database_1.db.saveMessage(validation_1.sanitize.uuid(conversationId), 'user', validation_1.sanitize.content(content));
            // Broadcast to conversation room (widget)
            io.to(`conversation-${conversationId}`).emit('message-received', message);
            // Notify all admins via Socket.IO with consistent event name
            console.log('Notifying', adminConnections.size, 'admins about new user message');
            adminConnections.forEach(adminSocketId => {
                io.to(adminSocketId).emit('new-user-message', {
                    ...message,
                    userEmail: email,
                    messageType: 'user-message'
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
            // Broadcast to conversation room (widget) with consistent event name
            io.to(`conversation-${conversationId}`).emit('message-received', message);
            // Notify other admins with consistent event name
            adminConnections.forEach(adminSocketId => {
                if (adminSocketId !== socket.id) {
                    io.to(adminSocketId).emit('new-admin-message', {
                        ...message,
                        messageType: 'admin-message'
                    });
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
                io.to(`conversation-${conversation.id}`).emit('message-received', message);
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
// Health check endpoints
app.get('/health', health_1.healthCheck);
app.get('/health/ready', health_1.readinessCheck);
app.get('/health/live', health_1.livenessCheck);
server.listen(PORT, () => {
    console.log(`Chat server running on port ${PORT}`);
    console.log(`Health check available at http://localhost:${PORT}/health`);
});
