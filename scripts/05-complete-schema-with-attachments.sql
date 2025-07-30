-- This script creates a complete messages table with all attachment columns
-- Run this in your Supabase SQL editor to ensure all columns exist

-- First, let's check if we need to add attachment columns
DO $$
BEGIN
    -- Add has_attachments column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'messages' AND column_name = 'has_attachments') THEN
        ALTER TABLE messages ADD COLUMN has_attachments BOOLEAN DEFAULT FALSE;
    END IF;

    -- Add attachment_type column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'messages' AND column_name = 'attachment_type') THEN
        ALTER TABLE messages ADD COLUMN attachment_type TEXT;
    END IF;

    -- Add attachment_path column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'messages' AND column_name = 'attachment_path') THEN
        ALTER TABLE messages ADD COLUMN attachment_path TEXT;
    END IF;

    -- Add attachment_filename column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'messages' AND column_name = 'attachment_filename') THEN
        ALTER TABLE messages ADD COLUMN attachment_filename TEXT;
    END IF;
    
    -- Add attachment_size column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'messages' AND column_name = 'attachment_size') THEN
        ALTER TABLE messages ADD COLUMN attachment_size INTEGER;
    END IF;
    
    -- Add import_batch column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'messages' AND column_name = 'import_batch') THEN
        ALTER TABLE messages ADD COLUMN import_batch TEXT;
    END IF;
END $$;

-- Create index on has_attachments for faster queries
CREATE INDEX IF NOT EXISTS idx_messages_attachments ON messages(has_attachments);

-- Create index on attachment_type for faster queries
CREATE INDEX IF NOT EXISTS idx_messages_attachment_type ON messages(attachment_type);

-- Output the current schema for verification
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'messages'
ORDER BY ordinal_position;
