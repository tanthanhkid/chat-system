export interface Message {
  id: string;
  conversation_id: string;
  sender_type: 'user' | 'admin';
  content: string;
  created_at: Date | string;
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