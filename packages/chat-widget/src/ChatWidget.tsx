import React, { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { Message, ChatWidgetProps } from './types';
import './ChatWidget.css';

// Vietnamese localization
const vietnameseTexts = {
  chatSupport: 'Hỗ Trợ Chat',
  welcome: 'Chào mừng! Chúng tôi có thể giúp gì cho bạn hôm nay?',
  typeMessage: 'Nhập tin nhắn của bạn...',
  connecting: 'Đang kết nối...',
  send: 'Gửi',
  online: 'Trực tuyến',
  reconnecting: 'Đang kết nối lại...',
  connectionError: 'Lỗi kết nối',
  retryConnection: 'Thử lại kết nối',
  loadingMessages: 'Đang tải thêm tin nhắn...',
  loadMoreMessages: 'Tải thêm tin nhắn cũ',
  noMoreMessages: 'Không còn tin nhắn cũ',
  statusSent: 'Đã gửi',
  statusDelivered: 'Đã nhận',
  statusRead: 'Đã xem'
};

export const ChatWidget: React.FC<ChatWidgetProps> = ({
  email,
  serverUrl = 'http://localhost:3001',
  primaryColor = '#007bff',
  position = 'bottom-right'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [forceScrollToBottom, setForceScrollToBottom] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [messageOffset, setMessageOffset] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);

  const connectToServer = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    const socket = io(serverUrl, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: maxReconnectAttempts,
      reconnectionDelay: 1000,
      timeout: 20000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Connected to chat server');
      setIsConnected(true);
      setConnectionError(null);
      setIsReconnecting(false);
      reconnectAttempts.current = 0;
      
      // Clear previous state to fix message isolation bug
      setMessages([]);
      setConversationId(null);
      setMessageOffset(0);
      setHasMoreMessages(true);
      setUnreadCount(0);
      
      socket.emit('join-user', { email });
    });

    socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      setIsConnected(false);
      setConnectionError('Failed to connect to chat server');
    });

    socket.on('disconnect', (reason) => {
      console.log('Disconnected from chat server:', reason);
      setIsConnected(false);
      
      if (reason === 'io server disconnect') {
        setConnectionError('Server disconnected');
      }
    });

    socket.on('reconnect_attempt', (attemptNumber) => {
      console.log(`Reconnection attempt ${attemptNumber}`);
      setIsReconnecting(true);
      reconnectAttempts.current = attemptNumber;
    });

    socket.on('reconnect', (attemptNumber) => {
      console.log(`Reconnected after ${attemptNumber} attempts`);
      setIsReconnecting(false);
      setConnectionError(null);
    });

    socket.on('reconnect_failed', () => {
      console.error('Failed to reconnect after maximum attempts');
      setIsReconnecting(false);
      setConnectionError('Unable to reconnect to chat server');
    });

    socket.on('conversation-joined', (data: { conversationId: string; messages: Message[] }) => {
      console.log('🔍 [WIDGET] Received conversation-joined:', {
        conversationId: data.conversationId,
        messageCount: data.messages.length,
        messages: data.messages.slice(0, 3).map(m => `[${m.sender_type}] ${m.content.substring(0, 30)}...`)
      });
      
      setConversationId(data.conversationId);
      // Server now sends exactly 5 most recent messages initially, no client-side slicing needed
      setMessages(data.messages);
      setMessageOffset(data.messages.length);
      // For initial load, assume there might be more messages if we got exactly 5
      setHasMoreMessages(data.messages.length === 5);
      
      // If widget is closed, count unread admin messages
      if (!isOpen) {
        const unreadAdminMessages = data.messages.filter(
          msg => msg.sender_type === 'admin' && !msg.read_at
        ).length;
        setUnreadCount(unreadAdminMessages);
      }
    });

    socket.on('message-received', (message: Message) => {
      setMessages(prev => [...prev, message]);
      
      // Handle admin messages
      if (message.sender_type === 'admin') {
        if (isOpen) {
          // Mark as read immediately when widget is open
          socket.emit('mark-message-read', { messageId: message.id });
          // Force scroll to bottom for new admin messages when widget is open
          setForceScrollToBottom(true);
        } else {
          // Increment unread count when widget is closed
          setUnreadCount(prev => prev + 1);
        }
      }
      
      // For user messages, also auto-scroll if near bottom
      if (message.sender_type === 'user') {
        // Auto-scroll user's own messages
        setForceScrollToBottom(true);
      }
    });

    socket.on('message-read', (data: { messageId: string; readBy: string; readAt: string }) => {
      // Update message status
      setMessages(prev => prev.map(msg => 
        msg.id === data.messageId 
          ? { ...msg, read_at: data.readAt, read_status: { ...msg.read_status, [data.readBy]: data.readAt } }
          : msg
      ));
    });

    socket.on('conversation-read', (data: { conversationId: string; readBy: string; readAt: string }) => {
      // Update all admin messages as read
      setMessages(prev => prev.map(msg => 
        msg.sender_type === 'admin' && data.readBy === 'user'
          ? { ...msg, read_at: data.readAt, read_status: { ...msg.read_status, [data.readBy]: data.readAt } }
          : msg
      ));
    });

    socket.on('error', (error: { message: string }) => {
      console.error('Chat error:', error.message);
      setConnectionError(error.message);
    });
  }, [email, serverUrl, isOpen]);

  useEffect(() => {
    // Clear all state on component mount to ensure clean start
    setMessages([]);
    setConversationId(null);
    setMessageOffset(0);
    setHasMoreMessages(true);
    setUnreadCount(0);
    setIsLoadingHistory(false);
    
    // Clear any browser storage that might persist messages
    try {
      localStorage.removeItem('chat-widget-messages');
      localStorage.removeItem('chat-widget-conversation');
      sessionStorage.clear();
    } catch (e) {
      // Ignore storage errors
    }
    
    connectToServer();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      // Clear state on unmount
      setMessages([]);
      setConversationId(null);
    };
  }, [connectToServer]);

  useEffect(() => {
    if (shouldAutoScroll || forceScrollToBottom) {
      scrollToBottom();
      // Reset force scroll flag after scrolling
      if (forceScrollToBottom) {
        setForceScrollToBottom(false);
      }
    }
  }, [messages, shouldAutoScroll, forceScrollToBottom]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadMoreMessages = async () => {
    if (!conversationId || isLoadingHistory || !hasMoreMessages) return;

    setIsLoadingHistory(true);
    try {
      const response = await fetch(
        `${serverUrl}/api/conversations/${conversationId}/messages?offset=${messageOffset}&limit=10&direction=desc`
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

  const handleScroll = () => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
      
      // Auto-scroll if user is within 150px of bottom (increased threshold for better UX)
      setShouldAutoScroll(distanceFromBottom < 150);
      
      // Note: Removed automatic scroll-to-load. Users now click "Load More" button instead
    }
  };

  const sendMessage = () => {
    if (!newMessage.trim() || !conversationId || !socketRef.current) return;

    socketRef.current.emit('user-message', {
      conversationId,
      content: newMessage.trim(),
      email
    });

    setNewMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (timestamp: string | Date) => {
    const date = new Date(timestamp);
    // Format time for GMT+7 timezone (Asia/Bangkok)
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      timeZone: 'Asia/Bangkok',
      hour12: false
    });
  };


  const getMessageStatus = (message: Message) => {
    if (message.sender_type === 'admin') return null; // Admin messages don't show status for user
    
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
        <div className="no-more-messages" data-testid="no-more-messages">
          <p>{vietnameseTexts.noMoreMessages}</p>
        </div>
      );
    }

    if (!hasMoreMessages) return null;

    return (
      <div className="load-more-container" data-testid="load-more-container">
        <button 
          className="load-more-button" 
          onClick={loadMoreMessages}
          disabled={isLoadingHistory}
          data-testid="load-more-button"
        >
          {isLoadingHistory ? vietnameseTexts.loadingMessages : vietnameseTexts.loadMoreMessages}
        </button>
      </div>
    );
  };

  const toggleChat = () => {
    const newIsOpen = !isOpen;
    setIsOpen(newIsOpen);
    
    // When opening the widget, scroll to bottom to show latest messages
    if (newIsOpen) {
      // Clear unread count when widget opens
      setUnreadCount(0);
      
      // Mark all unread admin messages as read
      if (socketRef.current && conversationId) {
        socketRef.current.emit('mark-conversation-read', { conversationId });
      }
      
      // Use setTimeout to ensure DOM is updated before scrolling
      setTimeout(() => {
        setForceScrollToBottom(true);
      }, 100);
    }
  };

  const retryConnection = () => {
    setConnectionError(null);
    connectToServer();
  };

  const getConnectionStatus = () => {
    if (isReconnecting) return vietnameseTexts.reconnecting;
    if (connectionError) return vietnameseTexts.connectionError;
    if (isConnected) return vietnameseTexts.online;
    return vietnameseTexts.connecting;
  };

  const positionClass = position === 'bottom-left' ? 'chat-widget-left' : 'chat-widget-right';

  return (
    <div className={`chat-widget ${positionClass}`} style={{ '--primary-color': primaryColor } as React.CSSProperties}>
      {/* Chat Button */}
      <button
        className={`chat-toggle-btn ${isOpen ? 'open' : ''}`}
        onClick={toggleChat}
        style={{ backgroundColor: primaryColor }}
        data-testid="chat-toggle-button"
      >
        {isOpen ? '✕' : '💬'}
        {!isConnected && <span className={`connection-indicator ${isReconnecting ? 'reconnecting' : 'offline'}`} />}
        {!isOpen && unreadCount > 0 && (
          <span className="unread-badge" data-testid="unread-badge">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="chat-window" data-testid="chat-window">
          {/* Header */}
          <div className="chat-header" style={{ backgroundColor: primaryColor }}>
            <h3>{vietnameseTexts.chatSupport}</h3>
            <div className={`status ${isConnected ? 'online' : connectionError ? 'error' : 'offline'}`}>
              {getConnectionStatus()}
            </div>
          </div>

          {/* Connection Error */}
          {connectionError && (
            <div className="connection-error" data-testid="connection-error">
              <p>{connectionError}</p>
              <button onClick={retryConnection} className="retry-button">
                {vietnameseTexts.retryConnection}
              </button>
            </div>
          )}

          {/* Messages */}
          <div 
            className="chat-messages" 
            data-testid="chat-messages"
            ref={messagesContainerRef}
            onScroll={handleScroll}
          >
            {/* Load More Button at the top */}
            <LoadMoreButton />
            
            {messages.length === 0 ? (
              <div className="welcome-message">
                <p>{vietnameseTexts.welcome}</p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`message ${message.sender_type === 'user' ? 'user' : 'admin'}`}
                  data-testid={`message-${message.sender_type}`}
                >
                  <div className="message-content">
                    {message.content}
                  </div>
                  <div className="message-time">
                    {formatTime(message.created_at)}
                    <MessageStatusIndicator message={message} />
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="chat-input">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={!isConnected ? vietnameseTexts.connecting : vietnameseTexts.typeMessage}
              rows={1}
              disabled={!isConnected}
              data-testid="message-input"
            />
            <button
              onClick={sendMessage}
              disabled={!newMessage.trim() || !isConnected}
              style={{ backgroundColor: primaryColor }}
              data-testid="send-button"
            >
              {vietnameseTexts.send}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};