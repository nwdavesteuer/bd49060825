-- Create helpful views for analysis
CREATE OR REPLACE VIEW message_stats AS
SELECT 
  sender,
  COUNT(*) as total_messages,
  MIN(date_sent) as first_message,
  MAX(date_sent) as last_message,
  AVG(LENGTH(content)) as avg_message_length
FROM messages 
WHERE content IS NOT NULL
GROUP BY sender;

-- Create yearly summary view
CREATE OR REPLACE VIEW yearly_summary AS
SELECT 
  year,
  sender,
  COUNT(*) as message_count,
  COUNT(CASE WHEN message_type = 'image' THEN 1 END) as image_count,
  AVG(LENGTH(content)) as avg_length
FROM messages 
WHERE year IS NOT NULL
GROUP BY year, sender
ORDER BY year, sender;

-- Create monthly activity view
CREATE OR REPLACE VIEW monthly_activity AS
SELECT 
  year,
  month,
  COUNT(*) as total_messages,
  COUNT(CASE WHEN sender = 'you' THEN 1 END) as your_messages,
  COUNT(CASE WHEN sender = 'nitzan' THEN 1 END) as nitzan_messages
FROM messages 
WHERE year IS NOT NULL AND month IS NOT NULL
GROUP BY year, month
ORDER BY year, month;
