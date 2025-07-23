-- Chat System Database Schema with Timezone Awareness

-- Set timezone to UTC explicitly for consistent timestamps
SET timezone TO 'UTC';

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table with timezone-aware timestamps
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Conversations table with timezone-aware timestamps
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_email VARCHAR(255) NOT NULL REFERENCES users(email),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    -- Add unique constraint to prevent multiple conversations per user
    CONSTRAINT conversations_user_email_unique UNIQUE (user_email)
);

-- Messages table with timezone-aware timestamps
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_type VARCHAR(10) NOT NULL CHECK (sender_type IN ('user', 'admin')),
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    delivered_at TIMESTAMP WITH TIME ZONE,
    read_at TIMESTAMP WITH TIME ZONE,
    read_status JSONB DEFAULT '{}'::jsonb
);

-- Indexes for better performance
CREATE INDEX idx_conversations_user_email ON conversations(user_email);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
-- Partial indexes for nullable timestamp columns (more efficient)
CREATE INDEX idx_messages_delivered_at ON messages(delivered_at) WHERE delivered_at IS NOT NULL;
CREATE INDEX idx_messages_read_at ON messages(read_at) WHERE read_at IS NOT NULL;

-- Function to update updated_at timestamp with timezone awareness
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP AT TIME ZONE 'UTC';
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-update updated_at in conversations
CREATE TRIGGER update_conversations_updated_at
    BEFORE UPDATE ON conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Additional composite indexes for common queries
CREATE INDEX idx_messages_conversation_sender ON messages(conversation_id, sender_type);
CREATE INDEX idx_messages_read_status ON messages(conversation_id, read_at) WHERE read_at IS NOT NULL;