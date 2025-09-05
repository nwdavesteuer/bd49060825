-- Option 1: Clear existing data completely (safest for full replacement)
-- Uncomment the line below if you want to start fresh
-- DELETE FROM messages;

-- Option 2: Clear data from specific date range
-- Replace these dates with your actual conversation date range
DELETE FROM messages 
WHERE date_sent >= '2014-01-01' 
AND date_sent <= '2024-12-31';

-- Option 3: Clear data that matches your import source
-- This removes data that was imported from CSV (has specific metadata)
DELETE FROM messages 
WHERE metadata->>'source' = 'csv_import' 
OR original_id LIKE 'import_%';

-- Reset the sequence if you cleared all data
-- Uncomment if you deleted everything
-- ALTER SEQUENCE messages_id_seq RESTART WITH 1;

-- Add an index to speed up duplicate detection during import
CREATE INDEX IF NOT EXISTS idx_messages_original_id ON messages(original_id);
CREATE INDEX IF NOT EXISTS idx_messages_date_content ON messages(date_sent, content);
