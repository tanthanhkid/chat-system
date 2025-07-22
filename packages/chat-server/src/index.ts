import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import webpush from 'web-push';
import { db } from './database';

dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  },
  pingTimeout: 60000,
  pingInterval: 25000,
  upgradeTimeout: 30000,
  allowEIO3: true
});

app.use(cors());
app.use(express.json());

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

// REST API Routes
app.get('/api/conversations', async (req, res) => {
  try {
    const conversations = await db.getAllConversations();
    res.json(conversations);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

app.get('/api/conversations/:id/messages', async (req, res) => {
  try {
    const { id } = req.params;
    const messages = await db.getMessages(id);
    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
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
      console.log('Received join-user event:', data);
      const { email } = data;
      
      // Create user if doesn't exist
      await db.createUser(email);
      
      // Get or create conversation
      const conversation = await db.getOrCreateConversation(email);
      console.log('Created/found conversation:', conversation.id, 'for email:', email);
      
      // Join conversation room
      socket.join(`conversation-${conversation.id}`);
      userConnections.set(email, socket.id);
      
      // Send conversation info and message history
      const messages = await db.getMessages(conversation.id);
      console.log('Sending conversation-joined event with', messages.length, 'messages');
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
      console.log('Received user-message:', { email: data.email, conversationId: data.conversationId, content: data.content.substring(0, 50) + '...' });
      const { conversationId, content, email } = data;
      
      // Save message to database
      const message = await db.saveMessage(conversationId, 'user', content);
      
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
      
      // Broadcast to conversation room
      io.to(`conversation-${conversationId}`).emit('new-message', message);
      
      // Notify other admins
      adminConnections.forEach(adminSocketId => {
        if (adminSocketId !== socket.id) {
          io.to(adminSocketId).emit('new-admin-message', message);
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
        io.to(`conversation-${conversation.id}`).emit('new-message', message);
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