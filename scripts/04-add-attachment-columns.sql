-- Add missing attachment-related columns to the messages table
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS has_attachments BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS attachment_type TEXT,
ADD COLUMN IF NOT EXISTS attachment_path TEXT,
ADD COLUMN IF NOT EXISTS attachment_filename TEXT;

-- Create index for attachment queries
CREATE INDEX IF NOT EXISTS idx_messages_has_attachments ON messages(has_attachments);
CREATE INDEX IF NOT EXISTS idx_messages_attachment_type ON messages(attachment_type);

-- Update existing records to set has_attachments based on message_type
UPDATE messages 
SET has_attachments = TRUE 
WHERE message_type IN ('image', 'video', 'audio') AND has_attachments IS NULL;

-- Add a check constraint for attachment_type
ALTER TABLE messages 
ADD CONSTRAINT check_attachment_type 
CHECK (attachment_type IS NULL OR attachment_type IN ('image', 'video', 'audio', 'document', 'other'));
