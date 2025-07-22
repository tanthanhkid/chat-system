export interface Message {
  id: string;
  conversation_id: string;
  sender_type: 'user' | 'admin';
  content: string;
  created_at: Date | string;
  delivered_at?: Date | string;
  read_at?: Date | string;
  read_status?: Record<string, any>;
}

export interface Conversation {
  id: string;
  user_email: string;
  created_at: Date | string;
  updated_at: Date | string;
  latest_message?: Message;
}

export interface UserStatus {
  email: string;
  conversationId: string;
  isOnline: boolean;
}