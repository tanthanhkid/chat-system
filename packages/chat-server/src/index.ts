import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import webpush from 'web-push';
import { db } from './database';
import { validate, validationSchemas, validateSocketData, sanitize, checkRateLimit } from './validation';
import { authenticateAdmin, requireAuth, requireAdmin, AuthenticatedRequest } from './auth';
import { healthCheck, readinessCheck, livenessCheck } from './health';

dotenv.config();

const app = express();
const server = createServer(app);
// CORS configuration with environment-based allowed origins
const allowedOrigins = process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
  : [
      'http://localhost:3000',  // Admin interface
      'http://localhost:5500',  // Test server
      'http://localhost:5173',  // Widget dev server
      'https://your-production-domain.com'  // Production domain
    ];

const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (mobile apps, server-to-server, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked request from origin: ${origin}`);
      callback(new Error('Not allowed by CORS'), false);
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-requested-with'],
  credentials: true,
  optionsSuccessStatus: 200
};

const io = new Server(server, {
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

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' })); // Add payload size limit

const PORT = process.env.PORT || 3001;

// Store active connections
const userConnections = new Map<string, string>(); // email -> socketId
const adminConnections = new Set<string>(); // admin socket IDs
const adminPushSubscriptions = new Map<string, any>(); // admin socketId -> push subscription

// Web Push Configuration
webpush.setVapidDetails(
  'mailto:admin@chatapp.com',
  'BLVXH6ipGcknKngbsLMRZDUBpjT5o8sbz4Y1o921zlOpCsQTGEr1GGhBx6-aLsnIu5qM-J21ZuR1eXCWfbwB3Kw', // Public Key
  'Ry2zi3_jRr5cktypiztT2YuQ3sM6e_1mr6QOIL7SAAw' // Private Key - Should be from environment
);

// Authentication Routes
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }
    
    const auth = await authenticateAdmin(username, password);
    if (!auth) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    res.json({ token: auth.token, message: 'Login successful' });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/verify', requireAuth, (req: AuthenticatedRequest, res) => {
  res.json({ 
    valid: true, 
    user: {
      username: req.user!.username,
      role: req.user!.role
    }
  });
});

// Protected admin routes
app.get('/api/conversations', requireAuth, requireAdmin, async (req, res) => {
  try {
    const conversations = await db.getAllConversations();
    res.json(conversations);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

app.get('/api/conversations/:id/messages', requireAuth, requireAdmin, validate(validationSchemas.getMessages), async (req, res) => {
  try {
    const { id } = req.params;
    const { offset, limit, direction } = req.query as any;
    
    // Check rate limiting
    const clientId = req.ip || 'unknown';
    if (!checkRateLimit(`messages:${clientId}`, 200, 15 * 60 * 1000)) {
      return res.status(429).json({ 
        error: 'Rate limit exceeded',
        message: 'Too many message requests. Please try again later.'
      });
    }
    
    // Use pagination if query params provided, otherwise use legacy method
    if (req.query.offset !== undefined || req.query.limit !== undefined) {
      const messages = await db.getMessagesWithPagination(
        sanitize.uuid(id), 
        offset, 
        limit,
        direction
      );
      const totalCount = await db.getMessageCount(sanitize.uuid(id));
      res.json({
        messages,
        pagination: {
          offset,
          limit,
          total: totalCount,
          hasMore: (offset + limit) < totalCount
        }
      });
    } else {
      // Legacy endpoint behavior
      const messages = await db.getMessages(sanitize.uuid(id));
      res.json(messages);
    }
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Get unread messages for admin notifications
app.get('/api/unread-messages', validate(validationSchemas.getUnreadMessages), async (req, res) => {
  try {
    const { limit, userEmail } = req.query as any;
    
    // Check rate limiting
    const clientId = req.ip || 'unknown';
    if (!checkRateLimit(`unread:${clientId}`, 100, 15 * 60 * 1000)) {
      return res.status(429).json({ 
        error: 'Rate limit exceeded',
        message: 'Too many unread message requests. Please try again later.'
      });
    }
    
    const unreadMessages = await db.getUnreadMessages(
      userEmail ? sanitize.email(userEmail) : undefined, 
      limit
    );
    res.json(unreadMessages);
  } catch (error) {
    console.error('Error fetching unread messages:', error);
    res.status(500).json({ error: 'Failed to fetch unread messages' });
  }
});

// Mark message as read
app.post('/api/messages/:id/read', requireAuth, requireAdmin, validate(validationSchemas.markMessageRead), async (req, res) => {
  try {
    const { id } = req.params;
    const { readBy } = req.body as { readBy: string };
    
    // Check rate limiting
    const clientId = req.ip || 'unknown';
    if (!checkRateLimit(`read:${clientId}`, 500, 15 * 60 * 1000)) {
      return res.status(429).json({ 
        error: 'Rate limit exceeded',
        message: 'Too many read requests. Please try again later.'
      });
    }
    
    const updatedMessage = await db.markMessageAsRead(sanitize.uuid(id), readBy);
    
    // Emit read status update to relevant clients
    io.emit('message-read', {
      messageId: sanitize.uuid(id),
      readBy,
      readAt: updatedMessage.read_at
    });
    
    res.json({ success: true, message: updatedMessage });
  } catch (error) {
    console.error('Error marking message as read:', error);
    res.status(500).json({ error: 'Failed to mark message as read' });
  }
});

// Mark conversation as read
app.post('/api/conversations/:id/read', requireAuth, requireAdmin, validate(validationSchemas.markConversationRead), async (req, res) => {
  try {
    const { id } = req.params;
    const { readBy } = req.body as { readBy: string };
    
    // Check rate limiting
    const clientId = req.ip || 'unknown';
    if (!checkRateLimit(`read:${clientId}`, 500, 15 * 60 * 1000)) {
      return res.status(429).json({ 
        error: 'Rate limit exceeded',
        message: 'Too many read requests. Please try again later.'
      });
    }
    
    const updatedCount = await db.markConversationAsRead(sanitize.uuid(id), readBy);
    
    // Emit conversation read status update
    io.emit('conversation-read', {
      conversationId: sanitize.uuid(id),
      readBy,
      updatedCount
    });
    
    res.json({ success: true, updatedCount });
  } catch (error) {
    console.error('Error marking conversation as read:', error);
    res.status(500).json({ error: 'Failed to mark conversation as read' });
  }
});

// Push notification subscription endpoint
app.post('/api/admin/push/subscribe', requireAuth, requireAdmin, validate(validationSchemas.pushSubscribe), (req, res) => {
  try {
    const subscription = req.body;
    
    // Check rate limiting
    const clientId = req.ip || 'unknown';
    if (!checkRateLimit(`push-subscribe:${clientId}`, 10, 15 * 60 * 1000)) {
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
  } catch (error) {
    console.error('Error subscribing to push notifications:', error);
    res.status(500).json({ error: 'Failed to subscribe' });
  }
});

// Send push notification helper function
const sendPushNotification = async (subscription: any, payload: any) => {
  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload));
    console.log('Push notification sent successfully');
  } catch (error) {
    console.error('Error sending push notification:', error);
  }
};

// Test push notification endpoint
app.post('/api/admin/test-push', requireAuth, requireAdmin, validate(validationSchemas.testPush), async (req, res) => {
  try {
    const { title, body, data } = req.body as { title: string; body: string; data: any };
    
    // Check rate limiting
    const clientId = req.ip || 'unknown';
    if (!checkRateLimit(`test-push:${clientId}`, 5, 15 * 60 * 1000)) {
      return res.status(429).json({ 
        error: 'Rate limit exceeded',
        message: 'Too many test push requests. Please try again later.'
      });
    }
    
    const payload = {
      title: sanitize.content(title),
      body: sanitize.content(body),
      icon: '/favicon.ico',
      data: data
    };
    
    // Send to all subscribed admins
    const promises = Array.from(adminPushSubscriptions.values()).map(subscription => 
      sendPushNotification(subscription, payload)
    );
    
    await Promise.allSettled(promises);
    
    res.json({ 
      success: true, 
      message: `Test push sent to ${adminPushSubscriptions.size} subscribers` 
    });
  } catch (error) {
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
  socket.on('join-user', async (data: { email: string }) => {
    try {
      // Validate input data
      const validation = validateSocketData(validationSchemas.socketEvents.joinUser, data);
      if (!validation.isValid) {
        console.warn(`❌ Invalid join-user data from ${socket.id}:`, validation.error);
        socket.emit('error', { message: `Invalid data: ${validation.error}` });
        return;
      }
      
      console.log('Received join-user event:', data);
      const { email } = validation.value;
      
      // Create user if doesn't exist
      await db.createUser(sanitize.email(email));
      
      // Get or create conversation
      const conversation = await db.getOrCreateConversation(email);
      console.log('Created/found conversation:', conversation.id, 'for email:', email);
      
      // Join conversation room
      socket.join(`conversation-${conversation.id}`);
      userConnections.set(email, socket.id);
      
      // Send conversation info and message history
      // Load only 5 most recent messages initially, user can scroll to load more
      const messages = await db.getMessagesWithPagination(conversation.id, 0, 5, 'desc');
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
      
    } catch (error) {
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
  socket.on('user-message', async (data: { conversationId: string, content: string, email: string }) => {
    try {
      // Validate input data
      const validation = validateSocketData(validationSchemas.socketEvents.userMessage, data);
      if (!validation.isValid) {
        console.warn(`❌ Invalid user-message data from ${socket.id}:`, validation.error);
        socket.emit('error', { message: `Invalid message data: ${validation.error}` });
        return;
      }
      
      const { conversationId, content, email } = validation.value;
      console.log('Received user-message:', { email, conversationId, content: content.substring(0, 50) + '...' });
      
      // Save message to database with sanitized content
      const message = await db.saveMessage(
        sanitize.uuid(conversationId), 
        'user', 
        sanitize.content(content)
      );
      
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
      
    } catch (error) {
      console.error('Error sending user message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // Admin sends message
  socket.on('admin-message', async (data: { conversationId: string, content: string }) => {
    try {
      const { conversationId, content } = data;
      
      // Save message to database
      const message = await db.saveMessage(conversationId, 'admin', content);
      
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
      
    } catch (error) {
      console.error('Error sending admin message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // Admin broadcast to all users
  socket.on('admin-broadcast', async (data: { content: string }) => {
    try {
      const { content } = data;
      
      // Get all conversations and send broadcast message
      const conversations = await db.getAllConversations();
      
      for (const conversation of conversations) {
        const message = await db.saveMessage(conversation.id, 'admin', content);
        io.to(`conversation-${conversation.id}`).emit('message-received', message);
      }
      
      // Notify all admins about the broadcast
      adminConnections.forEach(adminSocketId => {
        io.to(adminSocketId).emit('broadcast-sent', { content });
      });
      
    } catch (error) {
      console.error('Error broadcasting message:', error);
      socket.emit('error', { message: 'Failed to broadcast message' });
    }
  });

  // Handle typing indicators
  socket.on('user-typing', (data: { conversationId: string, email: string }) => {
    // Notify admins that user is typing
    adminConnections.forEach(adminSocketId => {
      io.to(adminSocketId).emit('user-typing', {
        conversationId: data.conversationId,
        email: data.email
      });
    });
  });

  socket.on('user-stopped-typing', (data: { conversationId: string, email: string }) => {
    // Notify admins that user stopped typing
    adminConnections.forEach(adminSocketId => {
      io.to(adminSocketId).emit('user-stopped-typing', {
        email: data.email
      });
    });
  });

  socket.on('admin-typing', (data: { conversationId: string }) => {
    // Notify users in conversation that admin is typing
    socket.to(`conversation-${data.conversationId}`).emit('admin-typing');
  });

  socket.on('admin-stopped-typing', (data: { conversationId: string }) => {
    // Notify users in conversation that admin stopped typing
    socket.to(`conversation-${data.conversationId}`).emit('admin-stopped-typing');
  });

  // Handle message read status
  socket.on('mark-conversation-read', async (data: { conversationId: string }) => {
    try {
      const readBy = adminConnections.has(socket.id) ? 'admin' : 'user';
      await db.markConversationAsRead(data.conversationId, readBy);
      
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
    } catch (error) {
      console.error('Error marking conversation as read:', error);
    }
  });

  socket.on('mark-message-read', async (data: { messageId: string }) => {
    try {
      const readBy = adminConnections.has(socket.id) ? 'admin' : 'user';
      const updatedMessage = await db.markMessageAsRead(data.messageId, readBy);
      
      // Emit read status to relevant clients
      io.emit('message-read', {
        messageId: data.messageId,
        readBy,
        readAt: updatedMessage.read_at
      });
    } catch (error) {
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
app.get('/health', healthCheck);
app.get('/health/ready', readinessCheck);
app.get('/health/live', livenessCheck);

server.listen(PORT, () => {
  console.log(`Chat server running on port ${PORT}`);
  console.log(`Health check available at http://localhost:${PORT}/health`);
});