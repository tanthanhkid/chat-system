import React, { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { Conversation, Message, UserStatus } from './types';
import { notificationService } from './services/NotificationService';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Toaster } from '@/components/ui/toast';
import { Menu, Minimize2, Maximize2, X } from 'lucide-react';

// Vietnamese localization for admin interface
const vietnameseTexts = {
 chatAdminDashboard: 'SYSTEM ACCESS',
 terminalTitle: 'CYBERPUNK ADMIN TERMINAL',
 systemPrompt: 'admin@terminal',
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
 broadcast: 'Gửi tất cả',
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
 loadingMoreMessages: 'Đang tải thêm tin nhắn...',
 loadMoreMessages: 'Tải thêm tin nhắn cũ',
 noMoreMessages: 'Không còn tin nhắn cũ',
 statusSent: 'Đã gửi',
 statusDelivered: 'Đã nhận',
 statusRead: 'Đã xem'
};

const SERVER_URL = 'http://localhost:3001';

function App() {
 const { token } = useAuth();
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
 const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
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
   // fetchConversations will be called when token is available via useEffect
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
    const recentAdminIndex = prev.slice(-5).findIndex((msg) => 
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

 // Define API fetch functions before useEffect hooks to avoid hoisting issues
 const fetchConversations = useCallback(async () => {
  if (!token) {
   console.warn('No token available for fetching conversations');
   return;
  }
  
  try {
   const response = await fetch(`${SERVER_URL}/api/conversations`, {
    headers: {
     'Authorization': `Bearer ${token}`,
     'Content-Type': 'application/json',
    },
   });
   
   if (response.ok) {
    const data = await response.json();
    setConversations(data);
   } else {
    console.error('Failed to fetch conversations:', response.status, response.statusText);
   }
  } catch (error) {
   console.error('Error fetching conversations:', error);
  }
 }, [token]);


 // Fetch conversations when token becomes available
 useEffect(() => {
  if (token) {
   fetchConversations();
  }
 }, [token, fetchConversations]);


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

 const fetchMessages = async (conversationId: string, reset: boolean = true) => {
  if (!token) {
   console.warn('No token available for fetching messages');
   return;
  }
  
  try {
   if (reset) {
    // Load initial 5 messages for new conversation (consistent with widget)
    const response = await fetch(`${SERVER_URL}/api/conversations/${conversationId}/messages?offset=0&limit=5&direction=desc`, {
     headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
     },
    });
    
    if (response.ok) {
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
    } else {
     console.error('Failed to fetch messages:', response.status, response.statusText);
    }
   }
  } catch (error) {
   console.error('Error fetching messages:', error);
  }
 };

 const loadMoreMessages = async () => {
  if (!selectedConversation || isLoadingHistory || !hasMoreMessages || !token) return;

  setIsLoadingHistory(true);
  try {
   const response = await fetch(
    `${SERVER_URL}/api/conversations/${selectedConversation}/messages?offset=${messageOffset}&limit=10&direction=desc`,
    {
     headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
     },
    }
   );
   
   if (response.ok) {
    const data = await response.json();
    
    if (data.messages && data.messages.length > 0) {
     setMessages(prev => [...data.messages, ...prev]);
     setMessageOffset(prev => prev + data.messages.length);
     setHasMoreMessages(data.pagination?.hasMore || false);
    } else {
     setHasMoreMessages(false);
    }
   } else {
    console.error('Failed to load more messages:', response.status, response.statusText);
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
   // Note: Removed automatic scroll-to-load. Users now click "Load More" button instead
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
   delivered_at: undefined,
   read_at: undefined,
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



 const getConnectionStatus = () => {
  if (isReconnecting) return vietnameseTexts.reconnecting;
  if (connectionError) return vietnameseTexts.connectionError;
  if (isConnected) return vietnameseTexts.connected;
  return vietnameseTexts.connecting;
 };



 const LoadMoreButton: React.FC = () => {
  if (!hasMoreMessages && messages.length > 0) {
   return (
    <div className="flex justify-center p-4" data-testid="no-more-messages">
     <div className="text-muted-foreground text-sm border rounded px-3 py-1">
      {vietnameseTexts.noMoreMessages}
     </div>
    </div>
   );
  }

  if (!hasMoreMessages) return null;

  return (
   <div className="flex justify-center p-4" data-testid="load-more-container">
    <Button 
     variant="outline"
     size="sm"
     onClick={loadMoreMessages}
     disabled={isLoadingHistory}
     data-testid="load-more-button"
     className="gap-2"
    >
     {isLoadingHistory && <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />}
     {isLoadingHistory ? vietnameseTexts.loadingMoreMessages : vietnameseTexts.loadMoreMessages}
    </Button>
   </div>
  );
 };

 const selectedConv = conversations.find(c => c.id === selectedConversation);

 // Cyberpunk Conversation Drawer
 const ConversationDrawer = () => (
  <>
   {/* Backdrop */}
   <div 
    className={`cyberpunk-backdrop ${isMobileSidebarOpen ? 'active' : ''}`} 
    onClick={() => setIsMobileSidebarOpen(false)}
   />
   
   {/* Drawer */}
   <div className={`cyberpunk-drawer ${isMobileSidebarOpen ? 'open' : ''} cyberpunk-scroll`}>
    {/* Close Button */}
    <button 
     className="cyberpunk-drawer-close"
     onClick={() => setIsMobileSidebarOpen(false)}
     aria-label="Close"
    >
     <X className="w-6 h-6" />
    </button>

    {/* Terminal Prompt */}
    <div className="cyberpunk-prompt">
     <span className="cyberpunk-prompt-symbol">▸</span>
     <span className="cyberpunk-prompt-path">{vietnameseTexts.systemPrompt}:/conversations</span>
    </div>

    {/* Conversation List */}
    <div className="cyberpunk-conversation-list" data-testid="conversations-list">
     {conversations.map((conversation) => {
      const userStatus = onlineUsers.get(conversation.user_email);
      const isSelected = selectedConversation === conversation.id;
      const hasUnread = conversation.latest_message && 
       conversation.latest_message.sender_type === 'user' && 
       selectedConversation !== conversation.id;
      
      return (
       <div
        key={conversation.id}
        className={`cyberpunk-conversation-entry ${
         isSelected ? 'active' : ''
        } ${
         userStatus?.isOnline ? 'online' : 'offline'
        }`}
        onClick={() => {
         selectConversation(conversation.id);
         setIsMobileSidebarOpen(false);
        }}
        data-testid={`conversation-${conversation.user_email}`}
       >
        <div className="cyberpunk-file-icon">📁</div>
        <div className="cyberpunk-user-name">{conversation.user_email}</div>
        {hasUnread && (
         <div className="cyberpunk-unread-count">!</div>
        )}
       </div>
      );
     })}
    </div>
   </div>
  </>
 );

 return (
  <div className="cyberpunk-body cyberpunk-background" data-testid="admin-app">
   <Toaster />
   
   {/* Terminal Header */}
   <header className="cyberpunk-header">
    {/* Menu Toggle Button */}
    <Button 
     variant="ghost" 
     size="icon" 
     className="cyberpunk-menu-toggle"
     onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
     data-testid="menu-toggle"
    >
     <Menu className="w-6 h-6" />
    </Button>

    {/* Terminal Tabs */}
    <div className="cyberpunk-tabs">
     <div className="cyberpunk-tab active">{vietnameseTexts.terminalTitle}</div>
    </div>

    {/* Terminal Controls */}
    <div className="cyberpunk-controls">
     <button className="cyberpunk-control minimize" aria-label="Minimize">
      <Minimize2 className="w-3 h-3" />
     </button>
     <button className="cyberpunk-control maximize" aria-label="Maximize">
      <Maximize2 className="w-3 h-3" />
     </button>
     <button className="cyberpunk-control close" aria-label="Close">
      <X className="w-3 h-3" />
     </button>
    </div>
   </header>

   <ConversationDrawer />

   {/* Main Terminal Workspace */}
   <div className="cyberpunk-terminal-workspace" style={{height: 'calc(100dvh - clamp(35px, 8vh, 45px))'}}>
    <div className="cyberpunk-chat-terminal">
     {selectedConversation ? (
      <>
       {/* Chat Header */}
       <div className="cyberpunk-chat-header">
        <div className="cyberpunk-terminal-title">
         {selectedConv?.user_email || 'SYSTEM TERMINAL'}
        </div>
        <div className="cyberpunk-connection-status">
         {getConnectionStatus()}
        </div>
       </div>

       {/* Message Output */}
       <div 
        className="cyberpunk-message-output cyberpunk-scroll"
        ref={messagesContainerRef}
        onScroll={handleMessagesScroll}
        data-testid="admin-messages"
       >
        <LoadMoreButton />
        
        {messages.map((message) => {
         const isAdmin = message.sender_type === 'admin';
         return (
          <div
           key={message.id}
           className={`cyberpunk-log-entry ${isAdmin ? 'admin' : 'user'} cyberpunk-selectable`}
           data-testid={`admin-message-${message.sender_type}`}
          >
           <div className="cyberpunk-timestamp">
            {formatTime(message.created_at)}
           </div>
           <div className="cyberpunk-sender">
            {isAdmin ? 'ADMIN' : 'USER'}
           </div>
           <div className="cyberpunk-content">
            {message.content}
           </div>
          </div>
         );
        })}
        
        {typingUsers.size > 0 && (
         <div className="cyberpunk-log-entry user">
          <div className="cyberpunk-timestamp">{formatTime(new Date())}</div>
          <div className="cyberpunk-sender">USER</div>
          <div className="cyberpunk-content cyberpunk-loading-dots">
           {Array.from(typingUsers).join(', ')} {typingUsers.size === 1 ? vietnameseTexts.isTyping : vietnameseTexts.areTyping}
          </div>
         </div>
        )}
        <div ref={messagesEndRef} />
       </div>

       {/* Command Input */}
       <div className="cyberpunk-command-input">
        <div className="cyberpunk-input-prompt">
         {vietnameseTexts.systemPrompt}▸
        </div>
        <input
         type="text"
         value={newMessage}
         onChange={(e) => handleTyping(e.target.value)}
         onKeyPress={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
           e.preventDefault();
           sendMessage();
          }
         }}
         placeholder={vietnameseTexts.typeReply}
         data-testid="admin-message-input"
         className="cyberpunk-terminal-input"
         disabled={!isConnected}
        />
        <button
         onClick={sendMessage}
         disabled={!newMessage.trim() || !isConnected}
         data-testid="admin-send-button"
         className="cyberpunk-send-button"
        >
         SEND
        </button>
       </div>
      </>
     ) : (
      <>
       {/* Chat Header */}
       <div className="cyberpunk-chat-header">
        <div className="cyberpunk-terminal-title">
         {vietnameseTexts.terminalTitle}
        </div>
        <div className="cyberpunk-connection-status">
         {getConnectionStatus()}
        </div>
       </div>

       {/* Default Terminal View */}
       <div className="cyberpunk-message-output cyberpunk-scroll">
        <div className="cyberpunk-system-message">
         SYSTEM READY - {conversations.length} ACTIVE CONNECTIONS
        </div>
        <div className="cyberpunk-system-message">
         SELECT CONVERSATION TO BEGIN COMMUNICATION
        </div>
       </div>

       {/* Broadcast Input */}
       <div className="cyberpunk-command-input">
        <div className="cyberpunk-input-prompt">
         BROADCAST▸
        </div>
        <input
         type="text"
         value={broadcastMessage}
         onChange={(e) => setBroadcastMessage(e.target.value)}
         onKeyPress={(e) => {
          if (e.key === 'Enter') {
           e.preventDefault();
           sendBroadcast();
          }
         }}
         placeholder={vietnameseTexts.broadcastPlaceholder}
         data-testid="broadcast-input"
         className="cyberpunk-terminal-input"
         disabled={!isConnected}
        />
        <button
         onClick={sendBroadcast}
         disabled={!broadcastMessage.trim() || !isConnected}
         data-testid="broadcast-button"
         className="cyberpunk-send-button"
        >
         BROADCAST
        </button>
       </div>
      </>
     )}
    </div>
   </div>
  </div>
 );
}

export default App;