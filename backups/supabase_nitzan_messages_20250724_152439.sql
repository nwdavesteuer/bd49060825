
-- Create nitzan_messages table for Supabase
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

-- Create full-text search index
CREATE INDEX IF NOT EXISTS idx_nitzan_messages_text_gin ON nitzan_messages USING gin(to_tsvector('english', text));

-- Enable Row Level Security (RLS)
ALTER TABLE nitzan_messages ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users (adjust as needed)
CREATE POLICY "Allow authenticated users to read nitzan_messages" ON nitzan_messages
    FOR SELECT USING (auth.role() = 'authenticated');

-- Create policy for authenticated users to insert (adjust as needed)
CREATE POLICY "Allow authenticated users to insert nitzan_messages" ON nitzan_messages
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Create policy for authenticated users to update (adjust as needed)
CREATE POLICY "Allow authenticated users to update nitzan_messages" ON nitzan_messages
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Create policy for authenticated users to delete (adjust as needed)
CREATE POLICY "Allow authenticated users to delete nitzan_messages" ON nitzan_messages
    FOR DELETE USING (auth.role() = 'authenticated');
