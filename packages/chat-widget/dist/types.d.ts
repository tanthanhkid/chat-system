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
export interface ChatWidgetProps {
    email: string;
    serverUrl?: string;
    primaryColor?: string;
    position?: 'bottom-right' | 'bottom-left';
}
