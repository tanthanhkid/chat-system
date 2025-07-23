import React, { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { Conversation, Message, UserStatus } from './types';
import { notificationService } from './services/NotificationService';
import './App.css';

// Vietnamese localization for admin interface
const vietnameseTexts = {
  chatAdminDashboard: 'Bảng Điều Khiển Admin Chat',
  notificationsOn: 'Thông báo Bật',
  notificationsOff: 'Thông báo Tắt',
  enableNotifications: 'Bật Thông báo',
  unreadMessages: 'Tin nhắn chưa đọc',
  noUnreadMessages: 'Không có tin nhắn chưa đọc',
  showMore: 'Hiển thị thêm',
  connected: 'Đã kết nối',
  connecting: 'Đang kết nối...',
  reconnecting: 'Đang kết nối lại...',
  connectionError: 'Lỗi kết nối',
  retry: 'Thử lại',
  broadcastMessage: 'Tin nhắn Phát sóng',
  broadcastPlaceholder: 'Gửi tin nhắn đến tất cả người dùng...',
  broadcast: 'Phát sóng',
  conversations: 'Cuộc trò chuyện',
  online: 'Trực tuyến',
  offline: 'Ngoại tuyến',
  admin: 'Admin',
  started: 'Bắt đầu',
  selectConversation: 'Chọn một cuộc trò chuyện để bắt đầu chat',
  selectConversationDesc: 'Chọn một cuộc trò chuyện từ thanh bên để xem tin nhắn và trả lời người dùng.',
  typeReply: 'Nhập phản hồi của bạn...',
  send: 'Gửi',
  userInfo: 'Thông tin người dùng',
  searchInConversation: 'Tìm kiếm trong cuộc trò chuyện',
  isTyping: 'đang nhập',
  areTyping: 'đang nhập',
  loadingMoreMessages: 'Đang tải thêm tin nhắn...'
};

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
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [messageOffset, setMessageOffset] = useState(0);
  const [isAutoScrolling, setIsAutoScrolling] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState<any[]>([]);
  const [showUnreadDropdown, setShowUnreadDropdown] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
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
      
      // Refresh unread messages list
      fetchUnreadMessages();
    });

    socket.on('new-admin-message', (message: Message) => {

      // Replace optimistic message with real message from server
      setMessages(prev => {
        // Find if there's an optimistic message with similar content and timestamp
        const optimisticIndex = prev.findIndex(msg => 
          msg.sender_type === 'admin' && 
          msg.id.startsWith('temp-') &&
          msg.content === message.content &&
          Math.abs(new Date(msg.created_at).getTime() - new Date(message.created_at).getTime()) < 10000 // Within 10 seconds (increased from 5)
        );
        
        // Also check for exact content match within last 3 admin messages
        const recentAdminIndex = prev.slice(-5).findIndex((msg, index, arr) => 
          msg.sender_type === 'admin' && 
          msg.id.startsWith('temp-') &&
          msg.content === message.content
        );
        
        
        // Use the optimistic index if found, otherwise use recent admin index
        const replaceIndex = optimisticIndex !== -1 ? optimisticIndex : 
                            (recentAdminIndex !== -1 ? prev.length - 5 + recentAdminIndex : -1);
        
        if (replaceIndex !== -1) {
          // Replace optimistic message with real one
          const newMessages = [...prev];
          newMessages[replaceIndex] = message;
          return newMessages;
        } else {
          // Check for duplicates first
          const isDuplicate = prev.some(msg => 
            msg.content === message.content && 
            msg.sender_type === 'admin' && 
            !msg.id.startsWith('temp-') &&
            Math.abs(new Date(msg.created_at).getTime() - new Date(message.created_at).getTime()) < 1000
          );
          
          if (isDuplicate) {
            return prev;
          }
          
          // No optimistic message found, add normally
          return [...prev, message];
        }
      });
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

    socket.on('message-read', (data: { messageId: string; readBy: string; readAt: string }) => {
      // Update message status in current messages
      setMessages(prev => prev.map(msg => 
        msg.id === data.messageId 
          ? { ...msg, read_at: data.readAt, read_status: { ...msg.read_status, [data.readBy]: data.readAt } }
          : msg
      ));
    });

    socket.on('conversation-read', (data: { conversationId: string; readBy: string; readAt: string }) => {
      // Update all messages in the conversation as read
      if (selectedConversationRef.current === data.conversationId) {
        setMessages(prev => prev.map(msg => 
          msg.sender_type === 'user' 
            ? { ...msg, read_at: data.readAt, read_status: { ...msg.read_status, [data.readBy]: data.readAt } }
            : msg
        ));
      }
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

  // Fetch unread messages on component mount and periodically
  useEffect(() => {
    fetchUnreadMessages();
    const interval = setInterval(fetchUnreadMessages, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

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

  const fetchMessages = async (conversationId: string, reset: boolean = true) => {
    try {
      if (reset) {
        // Load initial 5 messages for new conversation (consistent with widget)
        const response = await fetch(`${SERVER_URL}/api/conversations/${conversationId}/messages?offset=0&limit=5&direction=desc`);
        const data = await response.json();
        
        if (data.messages) {
          setMessages(data.messages);
          setMessageOffset(5);
          setHasMoreMessages(data.pagination?.hasMore || data.messages.length === 5);
        } else {
          // Fallback for legacy API response
          setMessages(data.slice(-5));
          setMessageOffset(5);
          setHasMoreMessages(data.length > 5);
        }
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const loadMoreMessages = async () => {
    if (!selectedConversation || isLoadingHistory || !hasMoreMessages) return;

    setIsLoadingHistory(true);
    try {
      const response = await fetch(
        `${SERVER_URL}/api/conversations/${selectedConversation}/messages?offset=${messageOffset}&limit=10&direction=desc`
      );
      const data = await response.json();
      
      if (data.messages && data.messages.length > 0) {
        setMessages(prev => [...data.messages, ...prev]);
        setMessageOffset(prev => prev + data.messages.length);
        setHasMoreMessages(data.pagination?.hasMore || false);
      } else {
        setHasMoreMessages(false);
      }
    } catch (error) {
      console.error('Error loading more messages:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const scrollToBottom = () => {
    setIsAutoScrolling(true);
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    
    // Clear auto-scrolling flag after scroll completes
    setTimeout(() => {
      setIsAutoScrolling(false);
    }, 1000); // Give enough time for smooth scroll to complete
  };

  const handleMessagesScroll = () => {
    if (messagesContainerRef.current && !isAutoScrolling) {
      const { scrollTop } = messagesContainerRef.current;
      
      // Load more messages if user manually scrolls to top
      if (scrollTop < 50 && hasMoreMessages && !isLoadingHistory) {
        loadMoreMessages();
      }
    }
  };

  const sendMessage = () => {
    if (!newMessage.trim() || !selectedConversation || !socketRef.current) return;

    const messageContent = newMessage.trim();

    // Stop typing indicator
    if (isTyping) {
      socketRef.current.emit('admin-stopped-typing', {
        conversationId: selectedConversation
      });
      setIsTyping(false);
    }

    // Optimistic update - immediately show the admin message
    const optimisticMessage: Message = {
      id: `temp-${Date.now()}`, // Temporary ID
      conversation_id: selectedConversation,
      content: messageContent,
      sender_type: 'admin',
      created_at: new Date().toISOString(),
      delivered_at: null,
      read_at: null,
      read_status: {}
    };

    // Add message to UI immediately
    setMessages(prev => [...prev, optimisticMessage]);

    // Force scroll to bottom after optimistic update
    setTimeout(() => {
      scrollToBottom();
    }, 100);

    socketRef.current.emit('admin-message', {
      conversationId: selectedConversation,
      content: messageContent
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
    
    // Reset pagination state for new conversation
    setMessageOffset(0);
    setHasMoreMessages(true);
    setIsLoadingHistory(false);
    
    fetchMessages(conversationId);
    
    // Mark conversation as read when admin selects it
    if (socketRef.current) {
      socketRef.current.emit('mark-conversation-read', { conversationId });
    }
    
    // Clear unread count for this conversation
    if (document.hasFocus()) {
      setUnreadCount(0);
      notificationService.clearBadge();
    }
  };

  const formatTime = (timestamp: string | Date) => {
    const date = new Date(timestamp);
    // Format time for GMT+7 timezone (Asia/Bangkok) - same as widget
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      timeZone: 'Asia/Bangkok',
      hour12: false
    });
  };

  const formatTimeWithTimezone = (timestamp: string | Date) => {
    const date = new Date(timestamp);
    // Show full time with timezone indicator for GMT+7 user
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      timeZone: 'Asia/Bangkok',
      hour12: false
    }) + ' GMT+7';
  };

  const formatDate = (timestamp: string | Date) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      timeZone: 'Asia/Bangkok'
    });
  };

  const fetchUnreadMessages = async () => {
    try {
      const response = await fetch(`${SERVER_URL}/api/unread-messages?limit=10`);
      const data = await response.json();
      setUnreadMessages(data);
    } catch (error) {
      console.error('Error fetching unread messages:', error);
    }
  };

  const retryConnection = () => {
    setConnectionError(null);
    connectToServer();
  };

  const getConnectionStatus = () => {
    if (isReconnecting) return vietnameseTexts.reconnecting;
    if (connectionError) return vietnameseTexts.connectionError;
    if (isConnected) return vietnameseTexts.connected;
    return vietnameseTexts.connecting;
  };

  const getMessageStatus = (message: Message) => {
    if (message.sender_type === 'user') return null; // User messages don't show status
    
    if (message.read_at) {
      return 'read'; // Double blue tick
    } else if (message.delivered_at) {
      return 'delivered'; // Double gray tick  
    } else {
      return 'sent'; // Single gray tick
    }
  };

  const MessageStatusIndicator: React.FC<{ message: Message }> = ({ message }) => {
    const status = getMessageStatus(message);
    
    if (!status) return null;
    
    return (
      <span className={`message-status ${status}`}>
        {status === 'sent' && '✓'}
        {status === 'delivered' && '✓✓'}
        {status === 'read' && '✓✓'}
      </span>
    );
  };

  const selectedConv = conversations.find(c => c.id === selectedConversation);

  return (
    <div className="admin-app" data-testid="admin-app">
      <header className="admin-header">
        <h1>{vietnameseTexts.chatAdminDashboard}</h1>
        <div className="header-controls">
          <div className="notification-controls">
            <div className={`notification-status ${notificationsEnabled ? 'enabled' : 'disabled'}`}>
              {notificationsEnabled ? '🔔' : '🔕'} 
              {notificationsEnabled ? vietnameseTexts.notificationsOn : vietnameseTexts.notificationsOff}
            </div>
            {!notificationsEnabled && (
              <button 
                className="enable-notifications-btn"
                onClick={async () => {
                  const granted = await notificationService.requestPermission();
                  setNotificationsEnabled(granted);
                }}
                title="Enable browser notifications"
              >
                {vietnameseTexts.enableNotifications}
              </button>
            )}
          </div>
          <div className="unread-notifications">
            <button 
              className={`unread-btn ${unreadCount > 0 ? 'has-unread' : ''}`}
              onClick={() => setShowUnreadDropdown(!showUnreadDropdown)}
              title="Unread messages"
            >
              🔔
              {unreadCount > 0 && (
                <span className="unread-badge">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>
            
            {showUnreadDropdown && (
              <div className="unread-dropdown">
                <div className="unread-dropdown-header">
                  <h4>{vietnameseTexts.unreadMessages} ({unreadMessages.length})</h4>
                  <button 
                    className="close-dropdown"
                    onClick={() => setShowUnreadDropdown(false)}
                  >
                    ✕
                  </button>
                </div>
                <div className="unread-messages-list">
                  {unreadMessages.length === 0 ? (
                    <div className="no-unread">{vietnameseTexts.noUnreadMessages}</div>
                  ) : (
                    unreadMessages.map((msg, index) => (
                      <div 
                        key={msg.id || index}
                        className="unread-message-item"
                        onClick={() => {
                          selectConversation(msg.conversation_id);
                          setShowUnreadDropdown(false);
                        }}
                      >
                        <div className="unread-msg-header">
                          <span className="user-email">{msg.user_email}</span>
                          <span className="msg-time">{formatTime(msg.created_at)}</span>
                        </div>
                        <div className="unread-msg-content">
                          {msg.content.substring(0, 60)}
                          {msg.content.length > 60 ? '...' : ''}
                        </div>
                      </div>
                    ))
                  )}
                  {unreadMessages.length >= 10 && (
                    <div className="show-more-unread">
                      <button onClick={() => fetchUnreadMessages()}>{vietnameseTexts.showMore}</button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          <div className={`connection-status ${isConnected ? 'connected' : connectionError ? 'error' : 'disconnected'}`}>
            {getConnectionStatus()}
            {connectionError && (
              <button onClick={retryConnection} className="retry-connection-btn">
                {vietnameseTexts.retry}
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="admin-content">
        {/* Sidebar */}
        <div className="sidebar">
          <div className="sidebar-section">
            <h3>{vietnameseTexts.broadcastMessage}</h3>
            <div className="broadcast-section">
              <textarea
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
                placeholder={vietnameseTexts.broadcastPlaceholder}
                rows={3}
                data-testid="broadcast-input"
              />
              <button 
                onClick={sendBroadcast}
                disabled={!broadcastMessage.trim() || !isConnected}
                className="broadcast-btn"
                data-testid="broadcast-button"
              >
                {vietnameseTexts.broadcast}
              </button>
            </div>
          </div>

          <div className="sidebar-section">
            <div className="conversations-header">
              <h3>{vietnameseTexts.conversations} ({conversations.length})</h3>
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
                            {userStatus?.isOnline ? vietnameseTexts.online : vietnameseTexts.offline}
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
                          {conversation.latest_message.sender_type === 'admin' ? `${vietnameseTexts.admin}: ` : ''}
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
                        `🟢 ${vietnameseTexts.online}` : 
                        `${vietnameseTexts.started}: ${selectedConv && formatDate(selectedConv.created_at)}`
                      }
                    </span>
                  </div>
                </div>
                <div className="chat-actions">
                  <button className="chat-action-btn" title={vietnameseTexts.userInfo}>
                    ℹ️
                  </button>
                  <button className="chat-action-btn" title={vietnameseTexts.searchInConversation}>
                    🔍
                  </button>
                </div>
              </div>

              <div 
                className="messages-container" 
                data-testid="admin-messages"
                ref={messagesContainerRef}
                onScroll={handleMessagesScroll}
              >
                {isLoadingHistory && (
                  <div className="loading-history">
                    <div className="loading-spinner"></div>
                    <p>{vietnameseTexts.loadingMoreMessages}</p>
                  </div>
                )}
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
                          {message.sender_type === 'admin' ? vietnameseTexts.admin : selectedConv?.user_email}
                        </span>
                        <div className="time-and-status">
                          <span className="time">{formatTime(message.created_at)}</span>
                          <MessageStatusIndicator message={message} />
                        </div>
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
                      {Array.from(typingUsers).join(', ')} {typingUsers.size === 1 ? vietnameseTexts.isTyping : vietnameseTexts.areTyping}...
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
                  placeholder={vietnameseTexts.typeReply}
                  rows={2}
                  data-testid="admin-message-input"
                />
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || !isConnected}
                  data-testid="admin-send-button"
                >
                  {vietnameseTexts.send}
                </button>
              </div>
            </>
          ) : (
            <div className="no-conversation">
              <h2>{vietnameseTexts.selectConversation}</h2>
              <p>{vietnameseTexts.selectConversationDesc}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;