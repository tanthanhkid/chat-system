import React, { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { Message, ChatWidgetProps } from './types';
import './ChatWidget.css';

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
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [messageOffset, setMessageOffset] = useState(0);

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
      setConversationId(data.conversationId);
      // Only load initial 10 messages
      const initialMessages = data.messages.slice(-10);
      setMessages(initialMessages);
      setMessageOffset(initialMessages.length);
      setHasMoreMessages(data.messages.length > 10);
    });

    socket.on('new-message', (message: Message) => {
      setMessages(prev => [...prev, message]);
      
      // Mark admin messages as read automatically when received
      if (message.sender_type === 'admin' && isOpen) {
        socket.emit('mark-message-read', { messageId: message.id });
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
    connectToServer();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [connectToServer]);

  useEffect(() => {
    if (shouldAutoScroll) {
      scrollToBottom();
    }
  }, [messages, shouldAutoScroll]);

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
      
      // Auto-scroll if user is within 100px of bottom
      setShouldAutoScroll(distanceFromBottom < 100);
      
      // Load more messages if user scrolls to top
      if (scrollTop < 50 && hasMoreMessages && !isLoadingHistory) {
        loadMoreMessages();
      }
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
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
    
    return (
      <span className={`message-status ${status}`}>
        {status === 'sent' && '✓'}
        {status === 'delivered' && '✓✓'}
        {status === 'read' && '✓✓'}
      </span>
    );
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  const retryConnection = () => {
    setConnectionError(null);
    connectToServer();
  };

  const getConnectionStatus = () => {
    if (isReconnecting) return 'Reconnecting...';
    if (connectionError) return 'Connection Error';
    if (isConnected) return 'Online';
    return 'Connecting...';
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
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="chat-window" data-testid="chat-window">
          {/* Header */}
          <div className="chat-header" style={{ backgroundColor: primaryColor }}>
            <h3>Chat Support</h3>
            <div className={`status ${isConnected ? 'online' : connectionError ? 'error' : 'offline'}`}>
              {getConnectionStatus()}
            </div>
          </div>

          {/* Connection Error */}
          {connectionError && (
            <div className="connection-error" data-testid="connection-error">
              <p>{connectionError}</p>
              <button onClick={retryConnection} className="retry-button">
                Retry Connection
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
            {isLoadingHistory && (
              <div className="loading-history">
                <div className="loading-spinner"></div>
                <p>Loading more messages...</p>
              </div>
            )}
            {messages.length === 0 ? (
              <div className="welcome-message">
                <p>Welcome! How can we help you today?</p>
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
              placeholder={!isConnected ? "Connecting..." : "Type your message..."}
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
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
};