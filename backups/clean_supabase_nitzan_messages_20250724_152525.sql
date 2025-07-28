
-- Create nitzan_messages table for Supabase
-- Generated from comprehensive extraction on 2025-07-24 15:25:25
-- Total records: 8439

CREATE TABLE IF NOT EXISTS nitzan_messages (
    id BIGINT PRIMARY KEY,
    guid TEXT,
    text TEXT,
    date BIGINT,
    date_read BIGINT,
    is_from_me BOOLEAN,
    has_attachments BOOLEAN,
    contact_id TEXT,
    service TEXT,
    readable_date TIMESTAMP,
    chat_id BIGINT,
    chat_identifier TEXT,
    chat_display_name TEXT,
    year TEXT,
    month TEXT,
    is_media_message BOOLEAN,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_nitzan_messages_date ON nitzan_messages(date);
CREATE INDEX IF NOT EXISTS idx_nitzan_messages_readable_date ON nitzan_messages(readable_date);
CREATE INDEX IF NOT EXISTS idx_nitzan_messages_is_from_me ON nitzan_messages(is_from_me);
CREATE INDEX IF NOT EXISTS idx_nitzan_messages_year ON nitzan_messages(year);
CREATE INDEX IF NOT EXISTS idx_nitzan_messages_month ON nitzan_messages(month);
CREATE INDEX IF NOT EXISTS idx_nitzan_messages_chat_id ON nitzan_messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_nitzan_messages_is_media ON nitzan_messages(is_media_message);

-- Create full-text search index for message content
CREATE INDEX IF NOT EXISTS idx_nitzan_messages_text_gin ON nitzan_messages USING gin(to_tsvector('english', text));

-- Enable Row Level Security (RLS)
ALTER TABLE nitzan_messages ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users to read
CREATE POLICY "Allow authenticated users to read nitzan_messages" ON nitzan_messages
    FOR SELECT USING (auth.role() = 'authenticated');

-- Create policy for authenticated users to insert
CREATE POLICY "Allow authenticated users to insert nitzan_messages" ON nitzan_messages
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Create policy for authenticated users to update
CREATE POLICY "Allow authenticated users to update nitzan_messages" ON nitzan_messages
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Create policy for authenticated users to delete
CREATE POLICY "Allow authenticated users to delete nitzan_messages" ON nitzan_messages
    FOR DELETE USING (auth.role() = 'authenticated');

-- Create view for easy querying by year
CREATE OR REPLACE VIEW nitzan_messages_by_year AS
SELECT 
    year,
    COUNT(*) as total_messages,
    SUM(CASE WHEN is_from_me THEN 1 ELSE 0 END) as messages_from_david,
    SUM(CASE WHEN NOT is_from_me THEN 1 ELSE 0 END) as messages_to_david,
    SUM(CASE WHEN is_media_message THEN 1 ELSE 0 END) as media_messages
FROM nitzan_messages
GROUP BY year
ORDER BY year;

-- Create view for conversation summary
CREATE OR REPLACE VIEW nitzan_conversation_summary AS
SELECT 
    COUNT(*) as total_messages,
    SUM(CASE WHEN is_from_me THEN 1 ELSE 0 END) as messages_from_david,
    SUM(CASE WHEN NOT is_from_me THEN 1 ELSE 0 END) as messages_to_david,
    SUM(CASE WHEN is_media_message THEN 1 ELSE 0 END) as media_messages,
    MIN(readable_date) as conversation_start,
    MAX(readable_date) as conversation_end
FROM nitzan_messages;
