import React, { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { Conversation, Message, UserStatus } from './types';
import { notificationService } from './services/NotificationService';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Toaster } from '@/components/ui/toast';
import { Menu, Bell, Settings, User, Wifi, WifiOff } from 'lucide-react';

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
 const [unreadMessages, setUnreadMessages] = useState<any[]>([]);
 const [showUnreadDropdown, setShowUnreadDropdown] = useState(false);
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

 const fetchUnreadMessages = useCallback(async () => {
  if (!token) {
   console.warn('No token available for fetching unread messages');
   return;
  }
  
  try {
   const response = await fetch(`${SERVER_URL}/api/unread-messages?limit=10`, {
    headers: {
     'Authorization': `Bearer ${token}`,
     'Content-Type': 'application/json',
    },
   });
   
   if (response.ok) {
    const data = await response.json();
    setUnreadMessages(data);
   } else {
    console.error('Failed to fetch unread messages:', response.status, response.statusText);
   }
  } catch (error) {
   console.error('Error fetching unread messages:', error);
  }
 }, [token]);

 // Fetch conversations when token becomes available
 useEffect(() => {
  if (token) {
   fetchConversations();
  }
 }, [token, fetchConversations]);

 // Fetch unread messages on component mount and periodically
 useEffect(() => {
  if (token) {
   fetchUnreadMessages();
   const interval = setInterval(fetchUnreadMessages, 30000); // Refresh every 30 seconds
   return () => clearInterval(interval);
  }
 }, [token, fetchUnreadMessages]);

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


 const formatDate = (timestamp: string | Date) => {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', {
   timeZone: 'Asia/Bangkok'
  });
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
  
  const getStatusTooltip = (status: string) => {
   switch (status) {
    case 'sent': return vietnameseTexts.statusSent || 'Đã gửi';
    case 'delivered': return vietnameseTexts.statusDelivered || 'Đã nhận';
    case 'read': return vietnameseTexts.statusRead || 'Đã xem';
    default: return '';
   }
  };
  
  const getStatusIcon = (status: string) => {
   switch (status) {
    case 'sent':
     return (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
       <polyline points="20,6 9,17 4,12" />
      </svg>
     );
    case 'delivered':
     return (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
       <polyline points="20,6 9,17 4,12" />
       <polyline points="24,6 13,17 8,12" strokeOpacity="0.6" />
      </svg>
     );
    case 'read':
     return (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
       <polyline points="20,6 9,17 4,12" />
       <polyline points="24,6 13,17 8,12" />
      </svg>
     );
    default:
     return null;
   }
  };
  
  return (
   <span 
    className={`message-status ${status}`}
    title={getStatusTooltip(status)}
   >
    {getStatusIcon(status)}
   </span>
  );
 };

 const LoadMoreButton: React.FC = () => {
  if (!hasMoreMessages && messages.length > 0) {
   return (
    <div className="flex justify-center p-4" data-testid="no-more-messages">
     <Badge variant="outline" className="text-muted-foreground">
      {vietnameseTexts.noMoreMessages}
     </Badge>
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

 // Mobile sidebar component
 const MobileSidebar = () => (
  <Sheet open={isMobileSidebarOpen} onOpenChange={setIsMobileSidebarOpen}>
   <SheetContent side="left" className="w-full p-0 glass-morphism" style={{maxWidth: '400px'}}>
    <SheetHeader className="p-6 pb-4">
     <SheetTitle className="text-left northern-text-glow">
      {vietnameseTexts.chatAdminDashboard}
     </SheetTitle>
    </SheetHeader>
    
    {/* Broadcast Section */}
    <div className="px-6 pb-4">
     <Card className="glass-morphism border-primary/20">
      <CardHeader className="pb-3">
       <CardTitle className="text-sm font-medium">{vietnameseTexts.broadcastMessage}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
       <Textarea
        value={broadcastMessage}
        onChange={(e) => setBroadcastMessage(e.target.value)}
        placeholder={vietnameseTexts.broadcastPlaceholder}
        rows={2}
        data-testid="broadcast-input"
        className="resize-none text-sm glass-morphism"
       />
       <Button 
        onClick={sendBroadcast}
        disabled={!broadcastMessage.trim() || !isConnected}
        className="w-full touch-target bg-primary text-primary-foreground"
        data-testid="broadcast-button"
        size="sm"
       >
        {vietnameseTexts.broadcast}
       </Button>
      </CardContent>
     </Card>
    </div>

    {/* Conversations */}
    <div className="flex-1 px-6">
     <div className="flex items-center justify-between mb-4">
      <h3 className="text-sm font-medium">{vietnameseTexts.conversations} ({conversations.length})</h3>
      <Button 
       variant="ghost"
       size="sm"
       onClick={fetchConversations}
       className="touch-target"
      >
       🔄
      </Button>
     </div>
     
     <ScrollArea className="h-96">
      <div className="space-y-2" data-testid="conversations-list">
       {conversations.map((conversation) => {
        const userStatus = onlineUsers.get(conversation.user_email);
        const isSelected = selectedConversation === conversation.id;
        const hasUnread = conversation.latest_message && 
         conversation.latest_message.sender_type === 'user' && 
         selectedConversation !== conversation.id;
        
        return (
         <div
          key={conversation.id}
          className={`
           cursor-pointer rounded-lg border p-3 transition-all hover:bg-accent/50 touch-target            ${isSelected ? 'bg-primary/20 border-primary ' : 'border-border/50'}
           ${hasUnread ? 'bg-accent/30' : ''}
          `}
          onClick={() => {
           selectConversation(conversation.id);
           setIsMobileSidebarOpen(false);
          }}
          data-testid={`conversation-${conversation.user_email}`}
         >
          <div className="flex items-center gap-3 mb-2">
           <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
             {conversation.user_email.charAt(0).toUpperCase()}
            </AvatarFallback>
           </Avatar>
           <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{conversation.user_email}</p>
            <div className="flex items-center gap-1">
             <div className={`w-2 h-2 rounded-full ${userStatus?.isOnline ? 'bg-green-400' : 'bg-gray-400'}`} />
             <span className={`text-xs ${userStatus?.isOnline ? 'text-green-600' : 'text-muted-foreground'}`}>
              {userStatus?.isOnline ? vietnameseTexts.online : vietnameseTexts.offline}
             </span>
            </div>
           </div>
           {hasUnread && (
            <Badge variant="destructive" className="h-2 w-2 p-0 rounded-full animate-pulse" />
           )}
          </div>
          {conversation.latest_message && (
           <div className="flex justify-between items-end text-xs text-muted-foreground">
            <span className="truncate flex-1 mr-2">
             {conversation.latest_message.sender_type === 'admin' ? `${vietnameseTexts.admin}: ` : ''}
             {conversation.latest_message.content.substring(0, 40)}
             {conversation.latest_message.content.length > 40 ? '...' : ''}
            </span>
            <span className="whitespace-nowrap">
             {formatTime(conversation.latest_message.created_at)}
            </span>
           </div>
          )}
         </div>
        );
       })}
      </div>
     </ScrollArea>
    </div>
   </SheetContent>
  </Sheet>
 );

 return (
  <div className="min-h-screen bg-background" data-testid="admin-app">
   <Toaster />
   
   {/* Mobile-First Header */}
   <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
    <div className="mobile-container flex h-16 items-center justify-between">
     {/* Left side - Logo and hamburger */}
     <div className="flex items-center gap-4">
      <Sheet open={isMobileSidebarOpen} onOpenChange={setIsMobileSidebarOpen}>
       <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden touch-target">
         <Menu className="h-5 w-5" />
        </Button>
       </SheetTrigger>
      </Sheet>
      
      <h1 className="text-lg sm:text-xl font-bold northern-text-glow hidden sm:block">
       {vietnameseTexts.chatAdminDashboard}
      </h1>
      <h1 className="text-base font-bold northern-text-glow sm:hidden">
       Admin Chat
      </h1>
     </div>

     {/* Right side - Actions */}
     <div className="flex items-center gap-2">
      {/* Notifications Badge */}
      <Badge variant={notificationsEnabled ? "default" : "secondary"} className="hidden sm:flex gap-1 text-xs glass-morphism">
       {notificationsEnabled ? <Bell className="h-3 w-3" /> : '🔕'} 
       <span className="hidden md:inline">
        {notificationsEnabled ? vietnameseTexts.notificationsOn : vietnameseTexts.notificationsOff}
       </span>
      </Badge>

      {/* Unread Messages */}
      <DropdownMenu open={showUnreadDropdown} onOpenChange={setShowUnreadDropdown}>
       <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className={`relative touch-target ${unreadCount > 0 ? 'animate-pulse' : ''}`}>
         <Bell className="h-4 w-4" />
         {unreadCount > 0 && (
          <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center">
           {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
         )}
        </Button>
       </DropdownMenuTrigger>
       <DropdownMenuContent align="end" className="glass-morphism " style={{width: '20rem'}}>
        <div className="p-4 border-b">
         <h4 className="font-medium">{vietnameseTexts.unreadMessages} ({unreadMessages.length})</h4>
        </div>
        <ScrollArea className="max-h-64" style={{maxHeight: '16rem'}}>
         {unreadMessages.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground text-sm">
           {vietnameseTexts.noUnreadMessages}
          </div>
         ) : (
          unreadMessages.map((msg, index) => (
           <DropdownMenuItem
            key={msg.id || index}
            className="p-4 cursor-pointer touch-target"
            onClick={() => {
             selectConversation(msg.conversation_id);
             setShowUnreadDropdown(false);
            }}
           >
            <div className="w-full">
             <div className="flex justify-between items-center mb-1">
              <span className="font-medium text-sm">{msg.user_email}</span>
              <span className="text-xs text-muted-foreground">{formatTime(msg.created_at)}</span>
             </div>
             <p className="text-sm text-muted-foreground line-clamp-2">
              {msg.content.substring(0, 60)}
              {msg.content.length > 60 ? '...' : ''}
             </p>
            </div>
           </DropdownMenuItem>
          ))
         )}
        </ScrollArea>
       </DropdownMenuContent>
      </DropdownMenu>

      {/* Connection Status */}
      <Badge 
       variant={isConnected ? "default" : connectionError ? "destructive" : "secondary"}
       className="gap-1 text-xs glass-morphism"
      >
       {isConnected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
       <span className="hidden sm:inline">{getConnectionStatus()}</span>
      </Badge>

      {/* Settings */}
      <DropdownMenu>
       <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="touch-target">
         <Settings className="h-4 w-4" />
        </Button>
       </DropdownMenuTrigger>
       <DropdownMenuContent align="end" className="glass-morphism ">
        {!notificationsEnabled && (
         <DropdownMenuItem
          onClick={async () => {
           const granted = await notificationService.requestPermission();
           setNotificationsEnabled(granted);
          }}
          className="touch-target"
         >
          <Bell className="h-4 w-4 mr-2" />
          {vietnameseTexts.enableNotifications}
         </DropdownMenuItem>
        )}
        {connectionError && (
         <DropdownMenuItem onClick={retryConnection} className="touch-target">
          <Wifi className="h-4 w-4 mr-2" />
          {vietnameseTexts.retry}
         </DropdownMenuItem>
        )}
       </DropdownMenuContent>
      </DropdownMenu>
     </div>
    </div>
   </header>

   <MobileSidebar />

   {/* Main Content */}
   <div className="flex" style={{height: 'calc(100vh - 4rem)'}}>
    {/* Desktop Sidebar */}
    <aside className="hidden lg:flex border-r bg-sidebar/50 glass-morphism" style={{width: '24rem'}}>
     <div className="flex flex-col w-full">
      {/* Broadcast Section */}
      <div className="p-6">
       <Card className="glass-morphism border-primary/20">
        <CardHeader>
         <CardTitle className="text-lg">{vietnameseTexts.broadcastMessage}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
         <Textarea
          value={broadcastMessage}
          onChange={(e) => setBroadcastMessage(e.target.value)}
          placeholder={vietnameseTexts.broadcastPlaceholder}
          rows={3}
          data-testid="broadcast-input"
          className="resize-none glass-morphism"
         />
         <Button 
          onClick={sendBroadcast}
          disabled={!broadcastMessage.trim() || !isConnected}
          className="w-full bg-primary text-primary-foreground"
          data-testid="broadcast-button"
         >
          {vietnameseTexts.broadcast}
         </Button>
        </CardContent>
       </Card>
      </div>

      {/* Conversations */}
      <div className="flex-1 px-6">
       <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium">{vietnameseTexts.conversations} ({conversations.length})</h3>
        <Button 
         variant="ghost"
         size="icon"
         onClick={fetchConversations}
         title="Refresh conversations"
        >
         🔄
        </Button>
       </div>
       
       <ScrollArea className="h-96">
        <div className="space-y-2" data-testid="conversations-list">
         {conversations.map((conversation) => {
          const userStatus = onlineUsers.get(conversation.user_email);
          const isSelected = selectedConversation === conversation.id;
          const hasUnread = conversation.latest_message && 
           conversation.latest_message.sender_type === 'user' && 
           selectedConversation !== conversation.id;
          
          return (
           <div
            key={conversation.id}
            className={`
             cursor-pointer rounded-lg border p-4 transition-all hover:bg-accent/50              ${isSelected ? 'bg-primary/20 border-primary ' : 'border-border/50'}
             ${hasUnread ? 'bg-accent/30' : ''}
            `}
            onClick={() => selectConversation(conversation.id)}
            data-testid={`conversation-${conversation.user_email}`}
           >
            <div className="flex items-center gap-3 mb-2">
             <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
               {conversation.user_email.charAt(0).toUpperCase()}
              </AvatarFallback>
             </Avatar>
             <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{conversation.user_email}</p>
              <div className="flex items-center gap-1">
               <div className={`w-2 h-2 rounded-full ${userStatus?.isOnline ? 'bg-green-400' : 'bg-gray-400'}`} />
               <span className={`text-xs ${userStatus?.isOnline ? 'text-green-600' : 'text-muted-foreground'}`}>
                {userStatus?.isOnline ? vietnameseTexts.online : vietnameseTexts.offline}
               </span>
              </div>
             </div>
             {hasUnread && (
              <Badge variant="destructive" className="h-2 w-2 p-0 rounded-full animate-pulse" />
             )}
            </div>
            {conversation.latest_message && (
             <div className="flex justify-between items-end text-xs text-muted-foreground">
              <span className="truncate flex-1 mr-2">
               {conversation.latest_message.sender_type === 'admin' ? `${vietnameseTexts.admin}: ` : ''}
               {conversation.latest_message.content.substring(0, 50)}
               {conversation.latest_message.content.length > 50 ? '...' : ''}
              </span>
              <span className="whitespace-nowrap">
               {formatTime(conversation.latest_message.created_at)}
              </span>
             </div>
            )}
           </div>
          );
         })}
        </div>
       </ScrollArea>
      </div>
     </div>
    </aside>

    {/* Chat Area */}
    <main className="flex-1 flex flex-col">
     {selectedConversation ? (
      <>
       {/* Chat Header */}
       <div className="border-b bg-background/50 p-4 glass-morphism">
        <div className="flex items-center gap-4">
         <Avatar className="h-12 w-12">
          <AvatarFallback className="bg-primary text-primary-foreground text-lg font-bold">
           {selectedConv?.user_email.charAt(0).toUpperCase()}
          </AvatarFallback>
         </Avatar>
         <div className="flex-1 min-w-0">
          <h2 className="text-lg sm:text-xl font-semibold truncate">{selectedConv?.user_email}</h2>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
           {onlineUsers.get(selectedConv?.user_email || '')?.isOnline ? (
            <>
             <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
             <span className="text-green-600">{vietnameseTexts.online}</span>
            </>
           ) : (
            <span>{vietnameseTexts.started}: {selectedConv && formatDate(selectedConv.created_at)}</span>
           )}
          </div>
         </div>
         <div className="flex gap-2">
          <Button variant="ghost" size="icon" title={vietnameseTexts.userInfo} className="touch-target">
           <User className="h-4 w-4" />
          </Button>
         </div>
        </div>
       </div>

       {/* Messages */}
       <ScrollArea 
        className="flex-1 p-4"
        ref={messagesContainerRef}
        onScroll={handleMessagesScroll}
       >
        <div className="space-y-4 max-w-4xl mx-auto" data-testid="admin-messages">
         <LoadMoreButton />
         
         {messages.map((message) => {
          const isAdmin = message.sender_type === 'admin';
          return (
           <div
            key={message.id}
            className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}
            data-testid={`admin-message-${message.sender_type}`}
           >
            <div className={`
             max-w-[85%] sm:max-w-[80%] rounded-lg p-3 space-y-1              ${isAdmin 
              ? 'bg-primary text-primary-foreground ml-8 sm:ml-12' 
              : 'bg-muted/80 mr-8 sm:mr-12'
             }
            `}>
             <div className="mobile-text">{message.content}</div>
             <div className="flex items-center justify-between gap-2 text-xs opacity-70">
              <span>
               {isAdmin ? vietnameseTexts.admin : selectedConv?.user_email}
              </span>
              <div className="flex items-center gap-1">
               <span>{formatTime(message.created_at)}</span>
               <MessageStatusIndicator message={message} />
              </div>
             </div>
            </div>
           </div>
          );
         })}
         
         {typingUsers.size > 0 && (
          <div className="flex justify-start">
           <div className="bg-muted/80 rounded-lg p-3 max-w-[200px] glass-morphism">
            <div className="flex items-center gap-2">
             <div className="flex gap-1">
              <div className="w-1 h-1 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-1 h-1 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-1 h-1 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
             </div>
             <span className="text-xs text-muted-foreground">
              {Array.from(typingUsers).join(', ')} {typingUsers.size === 1 ? vietnameseTexts.isTyping : vietnameseTexts.areTyping}...
             </span>
            </div>
           </div>
          </div>
         )}
         <div ref={messagesEndRef} />
        </div>
       </ScrollArea>

       {/* Message Input */}
       <div className="border-t bg-background/50 p-4 glass-morphism">
        <div className="flex gap-2 sm:gap-4 items-end max-w-4xl mx-auto">
         <div className="flex-1">
          <Textarea
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
           className="resize-none glass-morphism touch-target"
          />
         </div>
         <Button
          onClick={sendMessage}
          disabled={!newMessage.trim() || !isConnected}
          data-testid="admin-send-button"
          className="px-4 sm:px-6 bg-primary text-primary-foreground touch-target"
         >
          {vietnameseTexts.send}
         </Button>
        </div>
       </div>
      </>
     ) : (
      <div className="flex flex-col items-center justify-center h-full text-center p-8 glass-morphism">
       <div className="text-6xl mb-4">💬</div>
       <h2 className="text-xl font-semibold mb-2 northern-text-glow">{vietnameseTexts.selectConversation}</h2>
       <p className="text-muted-foreground max-w-md mobile-text">{vietnameseTexts.selectConversationDesc}</p>
       <Button 
        onClick={() => setIsMobileSidebarOpen(true)}
        className="mt-4 lg:hidden bg-primary text-primary-foreground touch-target"
       >
        <Menu className="h-4 w-4 mr-2" />
        {vietnameseTexts.conversations}
       </Button>
      </div>
     )}
    </main>
   </div>
  </div>
 );
}

export default App;