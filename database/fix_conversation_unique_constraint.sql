-- Fix conversation isolation bug by adding UNIQUE constraint on user_email
-- This ensures only one conversation exists per user

-- First, let's see how many duplicate conversations exist
SELECT user_email, COUNT(*) as conversation_count 
FROM conversations 
GROUP BY user_email 
HAVING COUNT(*) > 1;

-- Clean up duplicate conversations (keep the oldest one for each user)
WITH numbered_conversations AS (
    SELECT id, user_email, created_at,
           ROW_NUMBER() OVER (PARTITION BY user_email ORDER BY created_at ASC) as rn
    FROM conversations
),
conversations_to_delete AS (
    SELECT id FROM numbered_conversations WHERE rn > 1
)
DELETE FROM conversations 
WHERE id IN (SELECT id FROM conversations_to_delete);

-- Now add the UNIQUE constraint
ALTER TABLE conversations 
ADD CONSTRAINT conversations_user_email_unique UNIQUE (user_email);

-- Verify the fix
SELECT 'Fixed: Only one conversation per user' as status,
       user_email, COUNT(*) as conversation_count 
FROM conversations 
GROUP BY user_email 
ORDER BY user_email;