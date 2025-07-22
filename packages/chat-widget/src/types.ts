export interface Message {
  id: string;
  conversation_id: string;
  sender_type: 'user' | 'admin';
  content: string;
  created_at: Date | string;
}

export interface ChatWidgetProps {
  email: string;
  serverUrl?: string;
  primaryColor?: string;
  position?: 'bottom-right' | 'bottom-left';
}