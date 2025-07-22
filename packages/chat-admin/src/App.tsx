import React, { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { Conversation, Message, UserStatus } from './types';
import { notificationService } from './services/NotificationService';
import './App.css';

const SERVER_URL = 'http://localhost:3001';

function App() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<Map<string, UserStatus>>(new Map());
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const selectedConversationRef = useRef<string | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const connectToServer = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    const socket = io(SERVER_URL, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: maxReconnectAttempts,
      reconnectionDelay: 1000,
      timeout: 20000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Admin connected to chat server');
      setIsConnected(true);
      setConnectionError(null);
      setIsReconnecting(false);
      reconnectAttempts.current = 0;
      socket.emit('join-admin');
      fetchConversations();
    });

    socket.on('connect_error', (error) => {
      console.error('Admin connection error:', error);
      setIsConnected(false);
      setConnectionError('Failed to connect to chat server');
    });

    socket.on('disconnect', (reason) => {
      console.log('Admin disconnected from chat server:', reason);
      setIsConnected(false);
      
      if (reason === 'io server disconnect') {
        setConnectionError('Server disconnected');
      }
    });

    socket.on('reconnect_attempt', (attemptNumber) => {
      console.log(`Admin reconnection attempt ${attemptNumber}`);
      setIsReconnecting(true);
      reconnectAttempts.current = attemptNumber;
    });

    socket.on('reconnect', (attemptNumber) => {
      console.log(`Admin reconnected after ${attemptNumber} attempts`);
      setIsReconnecting(false);
      setConnectionError(null);
    });

    socket.on('reconnect_failed', () => {
      console.error('Admin failed to reconnect after maximum attempts');
      setIsReconnecting(false);
      setConnectionError('Unable to reconnect to chat server');
    });

    socket.on('admin-joined', () => {
      console.log('Admin joined successfully');
    });

    socket.on('user-online', (data: { email: string; conversationId: string }) => {
      setOnlineUsers(prev => new Map(prev.set(data.email, {
        email: data.email,
        conversationId: data.conversationId,
        isOnline: true
      })));
    });

    socket.on('user-offline', (data: { email: string }) => {
      setOnlineUsers(prev => {
        const newMap = new Map(prev);
        const user = newMap.get(data.email);
        if (user) {
          newMap.set(data.email, { ...user, isOnline: false });
        }
        return newMap;
      });
    });

    socket.on('new-user-message', (message: Message & { userEmail: string }) => {
      const currentSelectedConversation = selectedConversationRef.current;
      console.log('🔍 ADMIN: New user message received:', {
        messageConvId: message.conversation_id,
        currentSelectedConversation,
        userEmail: message.userEmail,
        content: message.content.substring(0, 20) + '...',
        willAddToMainChat: message.conversation_id === currentSelectedConversation
      });
      
      // Only add to main chat window if message belongs to currently selected conversation
      if (message.conversation_id === currentSelectedConversation) {
        console.log('✅ ADMIN: Adding message to main chat window');
        setMessages(prev => [...prev, message]);
      } else {
        console.log('❌ ADMIN: NOT adding message to main chat (different conversation)');
      }
      
      setConversations(prev => {
        const existingConv = prev.find(conv => conv.id === message.conversation_id);
        if (existingConv) {
          // Update existing conversation
          return prev.map(conv => 
            conv.id === message.conversation_id 
              ? { ...conv, latest_message: message, updated_at: new Date().toISOString() }
              : conv
          );
        } else {
          // Add new conversation
          const newConversation = {
            id: message.conversation_id,
            user_email: message.userEmail,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            latest_message: message
          };
          return [newConversation, ...prev];
        }
      });

      // Show notification for new user message
      if (notificationsEnabled) {
        const isCurrentConversation = selectedConversation === message.conversation_id;
        const isWindowFocused = document.hasFocus();
        
        if (!isCurrentConversation || !isWindowFocused) {
          notificationService.showNotification({
            title: `New message from ${message.userEmail || 'User'}`,
            body: message.content.length > 50 
              ? message.content.substring(0, 50) + '...'
              : message.content,
            icon: '/favicon.ico',
            data: {
              conversationId: message.conversation_id,
              userEmail: message.userEmail,
              url: '/',
              timestamp: Date.now()
            },
            actions: [
              { action: 'open', title: 'Open Chat' },
              { action: 'reply', title: 'Quick Reply' }
            ]
          });
        }
      }

      // Update unread count
      if (selectedConversation !== message.conversation_id || !document.hasFocus()) {
        setUnreadCount(prev => prev + 1);
      }
    });

    socket.on('new-admin-message', (message: Message) => {
      setMessages(prev => [...prev, message]);
    });

    socket.on('user-typing', (data: { email: string, conversationId: string }) => {
      if (data.conversationId === selectedConversation) {
        setTypingUsers(prev => new Set([...prev, data.email]));
        // Remove typing indicator after 3 seconds
        setTimeout(() => {
          setTypingUsers(prev => {
            const newSet = new Set(prev);
            newSet.delete(data.email);
            return newSet;
          });
        }, 3000);
      }
    });

    socket.on('user-stopped-typing', (data: { email: string }) => {
      setTypingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(data.email);
        return newSet;
      });
    });

    socket.on('broadcast-sent', (data: { content: string }) => {
      console.log('Broadcast sent:', data.content);
      setBroadcastMessage('');
    });

    socket.on('error', (error: { message: string }) => {
      console.error('Admin socket error:', error.message);
      setConnectionError(error.message);
    });
  }, []);

  useEffect(() => {
    connectToServer();
    initializeNotifications();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [connectToServer]);

  // Initialize notifications
  const initializeNotifications = async () => {
    const granted = await notificationService.requestPermission();
    setNotificationsEnabled(granted);

    // Handle notification clicks
    notificationService.onNotificationClickHandler((data) => {
      console.log('Notification clicked:', data);
      if (data.conversationId) {
        selectConversation(data.conversationId);
        // Clear notification-related unread count
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Update badge count when unread messages change
  useEffect(() => {
    notificationService.updateBadge(unreadCount);
  }, [unreadCount]);

  // Clear unread count when conversation is selected and window is focused
  useEffect(() => {
    if (selectedConversation && document.hasFocus()) {
      setUnreadCount(0);
      notificationService.clearBadge();
    }
  }, [selectedConversation]);

  // Handle window focus to clear notifications
  useEffect(() => {
    const handleFocus = () => {
      if (selectedConversation) {
        setUnreadCount(0);
        notificationService.clearBadge();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [selectedConversation]);

  const fetchConversations = async () => {
    try {
      const response = await fetch(`${SERVER_URL}/api/conversations`);
      const data = await response.json();
      setConversations(data);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    try {
      const response = await fetch(`${SERVER_URL}/api/conversations/${conversationId}/messages`);
      const data = await response.json();
      setMessages(data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = () => {
    if (!newMessage.trim() || !selectedConversation || !socketRef.current) return;

    // Stop typing indicator
    if (isTyping) {
      socketRef.current.emit('admin-stopped-typing', {
        conversationId: selectedConversation
      });
      setIsTyping(false);
    }

    socketRef.current.emit('admin-message', {
      conversationId: selectedConversation,
      content: newMessage.trim()
    });

    setNewMessage('');
  };

  const handleTyping = (value: string) => {
    setNewMessage(value);

    if (!selectedConversation || !socketRef.current) return;

    // Send typing indicator
    if (value.trim() && !isTyping) {
      socketRef.current.emit('admin-typing', {
        conversationId: selectedConversation
      });
      setIsTyping(true);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      if (socketRef.current && isTyping) {
        socketRef.current.emit('admin-stopped-typing', {
          conversationId: selectedConversation
        });
        setIsTyping(false);
      }
    }, 2000);
  };

  const sendBroadcast = () => {
    if (!broadcastMessage.trim() || !socketRef.current) return;

    socketRef.current.emit('admin-broadcast', {
      content: broadcastMessage.trim()
    });
  };

  const selectConversation = (conversationId: string) => {
    console.log('🔄 ADMIN: Selecting conversation:', {
      oldConversation: selectedConversation,
      newConversation: conversationId
    });
    setSelectedConversation(conversationId);
    selectedConversationRef.current = conversationId; // Update ref for socket handlers
    fetchMessages(conversationId);
    // Clear unread count for this conversation
    if (document.hasFocus()) {
      setUnreadCount(0);
      notificationService.clearBadge();
    }
  };

  const formatTime = (timestamp: string | Date) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (timestamp: string | Date) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString();
  };

  const retryConnection = () => {
    setConnectionError(null);
    connectToServer();
  };

  const getConnectionStatus = () => {
    if (isReconnecting) return 'Reconnecting...';
    if (connectionError) return 'Connection Error';
    if (isConnected) return 'Connected';
    return 'Connecting...';
  };

  const selectedConv = conversations.find(c => c.id === selectedConversation);

  return (
    <div className="admin-app" data-testid="admin-app">
      <header className="admin-header">
        <h1>Chat Admin Dashboard</h1>
        <div className="header-controls">
          <div className={`notification-status ${notificationsEnabled ? 'enabled' : 'disabled'}`}>
            {notificationsEnabled ? '🔔' : '🔕'} 
            {notificationsEnabled ? 'Notifications On' : 'Notifications Off'}
          </div>
          {unreadCount > 0 && (
            <div className="unread-badge">
              {unreadCount > 99 ? '99+' : unreadCount}
            </div>
          )}
          <div className={`connection-status ${isConnected ? 'connected' : connectionError ? 'error' : 'disconnected'}`}>
            {getConnectionStatus()}
            {connectionError && (
              <button onClick={retryConnection} className="retry-connection-btn">
                Retry
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="admin-content">
        {/* Sidebar */}
        <div className="sidebar">
          <div className="sidebar-section">
            <h3>Broadcast Message</h3>
            <div className="broadcast-section">
              <textarea
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
                placeholder="Send message to all users..."
                rows={3}
                data-testid="broadcast-input"
              />
              <button 
                onClick={sendBroadcast}
                disabled={!broadcastMessage.trim() || !isConnected}
                className="broadcast-btn"
                data-testid="broadcast-button"
              >
                Broadcast
              </button>
            </div>
          </div>

          <div className="sidebar-section">
            <div className="conversations-header">
              <h3>Conversations ({conversations.length})</h3>
              <button 
                className="refresh-conversations-btn"
                onClick={fetchConversations}
                title="Refresh conversations"
              >
                🔄
              </button>
            </div>
            <div className="conversations-list" data-testid="conversations-list">
              {conversations.map((conversation) => {
                const userStatus = onlineUsers.get(conversation.user_email);
                return (
                  <div
                    key={conversation.id}
                    className={`conversation-item ${selectedConversation === conversation.id ? 'selected' : ''} ${conversation.latest_message && conversation.latest_message.sender_type === 'user' && selectedConversation !== conversation.id ? 'unread' : ''}`}
                    onClick={() => selectConversation(conversation.id)}
                    data-testid={`conversation-${conversation.user_email}`}
                  >
                    <div className="conversation-header">
                      <div className="user-info">
                        <div className="user-avatar">
                          {conversation.user_email.charAt(0).toUpperCase()}
                        </div>
                        <div className="user-details">
                          <span className="user-email">{conversation.user_email}</span>
                          <span className={`status-text ${userStatus?.isOnline ? 'online' : 'offline'}`}>
                            {userStatus?.isOnline ? 'Online' : 'Offline'}
                          </span>
                        </div>
                      </div>
                      <div className="conversation-meta">
                        <span className={`status-indicator ${userStatus?.isOnline ? 'online' : 'offline'}`}>
                          {userStatus?.isOnline ? '🟢' : '⚫'}
                        </span>
                        {conversation.latest_message && conversation.latest_message.sender_type === 'user' && selectedConversation !== conversation.id && (
                          <div className="unread-indicator">•</div>
                        )}
                      </div>
                    </div>
                    {conversation.latest_message && (
                      <div className="latest-message">
                        <span className="message-preview">
                          {conversation.latest_message.sender_type === 'admin' ? 'Admin: ' : ''}
                          {conversation.latest_message.content.substring(0, 50)}
                          {conversation.latest_message.content.length > 50 ? '...' : ''}
                        </span>
                        <span className="message-time">
                          {formatTime(conversation.latest_message.created_at)}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="main-chat">
          {selectedConversation ? (
            <>
              <div className="chat-header">
                <div className="chat-header-info">
                  <div className="chat-user-avatar">
                    {selectedConv?.user_email.charAt(0).toUpperCase()}
                  </div>
                  <div className="chat-user-details">
                    <h2>{selectedConv?.user_email}</h2>
                    <span className="conversation-date">
                      {onlineUsers.get(selectedConv?.user_email || '')?.isOnline ? 
                        '🟢 Online' : 
                        `Started: ${selectedConv && formatDate(selectedConv.created_at)}`
                      }
                    </span>
                  </div>
                </div>
                <div className="chat-actions">
                  <button className="chat-action-btn" title="User Info">
                    ℹ️
                  </button>
                  <button className="chat-action-btn" title="Search in conversation">
                    🔍
                  </button>
                </div>
              </div>

              <div className="messages-container" data-testid="admin-messages">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`message ${message.sender_type}`}
                    data-testid={`admin-message-${message.sender_type}`}
                  >
                    <div className="message-content">
                      <div className="message-text">{message.content}</div>
                      <div className="message-meta">
                        <span className="sender">
                          {message.sender_type === 'admin' ? 'Admin' : selectedConv?.user_email}
                        </span>
                        <span className="time">{formatTime(message.created_at)}</span>
                      </div>
                    </div>
                  </div>
                ))}
                {typingUsers.size > 0 && (
                  <div className="typing-indicator">
                    <div className="typing-dots">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                    <span className="typing-text">
                      {Array.from(typingUsers).join(', ')} {typingUsers.size === 1 ? 'is' : 'are'} typing...
                    </span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="message-input">
                <textarea
                  value={newMessage}
                  onChange={(e) => handleTyping(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder="Type your reply..."
                  rows={2}
                  data-testid="admin-message-input"
                />
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || !isConnected}
                  data-testid="admin-send-button"
                >
                  Send
                </button>
              </div>
            </>
          ) : (
            <div className="no-conversation">
              <h2>Select a conversation to start chatting</h2>
              <p>Choose a conversation from the sidebar to view messages and reply to users.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;