#!/usr/bin/env python3
"""
Create Clean Supabase Export
Creates a clean, Supabase-ready export that properly handles:
- Empty messages (media messages)
- Missing contact info (messages from David)
- Consistent data types
"""

import json
import csv
from datetime import datetime


def create_clean_supabase_export(input_file, output_file):
    """Create a clean Supabase export with proper data handling."""
    print(f"🧹 Creating clean Supabase export...")
    
    with open(input_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    messages = data['messages']
    
    # Clean and prepare messages for Supabase
    clean_messages = []
    
    for msg in messages:
        # Handle missing contact_id for David's messages
        contact_id = msg['contact_id']
        if not contact_id and msg['is_from_me']:
            contact_id = 'david@steuer.com'  # Placeholder for David's messages
        
        # Handle empty text (media messages)
        text = msg['text'] or ''
        if not text.strip():
            text = '[Media Message]'  # Placeholder for media messages
        
        # Create clean message record
        clean_msg = {
            'id': msg['message_id'],
            'guid': msg['guid'],
            'text': text,
            'date': msg['date'],
            'date_read': msg['date_read'],
            'is_from_me': msg['is_from_me'],
            'has_attachments': msg['has_attachments'],
            'contact_id': contact_id,
            'service': msg['service'],
            'readable_date': msg['readable_date'],
            'chat_id': msg['chat_id'],
            'chat_identifier': msg['chat_identifier'],
            'chat_display_name': msg['chat_display_name'],
            'year': msg['readable_date'][:4] if msg['readable_date'] else None,
            'month': msg['readable_date'][:7] if msg['readable_date'] else None,
            'is_media_message': not msg['text'].strip() if msg['text'] else True,
            'created_at': datetime.now().isoformat(),
            'updated_at': datetime.now().isoformat()
        }
        
        clean_messages.append(clean_msg)
    
    # Create Supabase-ready structure
    supabase_data = {
        'table_name': 'nitzan_messages',
        'total_records': len(clean_messages),
        'extraction_metadata': {
            'original_total': len(messages),
            'cleaned_total': len(clean_messages),
            'empty_messages_handled': len([msg for msg in messages if not msg['text'].strip()]),
            'missing_contact_handled': len([msg for msg in messages if not msg['contact_id'] and msg['is_from_me']]),
            'date_range': {
                'start': min(msg['readable_date'] for msg in clean_messages) if clean_messages else None,
                'end': max(msg['readable_date'] for msg in clean_messages) if clean_messages else None
            }
        },
        'columns': [
            {'name': 'id', 'type': 'bigint', 'primary_key': True, 'description': 'Message ID from iMessage database'},
            {'name': 'guid', 'type': 'text', 'description': 'Unique message GUID'},
            {'name': 'text', 'type': 'text', 'description': 'Message text content'},
            {'name': 'date', 'type': 'bigint', 'description': 'Raw date timestamp'},
            {'name': 'date_read', 'type': 'bigint', 'description': 'Date when message was read'},
            {'name': 'is_from_me', 'type': 'boolean', 'description': 'True if message is from David'},
            {'name': 'has_attachments', 'type': 'boolean', 'description': 'True if message has attachments'},
            {'name': 'contact_id', 'type': 'text', 'description': 'Contact identifier (email/phone)'},
            {'name': 'service', 'type': 'text', 'description': 'Message service (iMessage/SMS)'},
            {'name': 'readable_date', 'type': 'timestamp', 'description': 'Human-readable date'},
            {'name': 'chat_id', 'type': 'bigint', 'description': 'Chat ID from iMessage database'},
            {'name': 'chat_identifier', 'type': 'text', 'description': 'Chat identifier'},
            {'name': 'chat_display_name', 'type': 'text', 'description': 'Chat display name'},
            {'name': 'year', 'type': 'text', 'description': 'Year extracted from date'},
            {'name': 'month', 'type': 'text', 'description': 'Year-month extracted from date'},
            {'name': 'is_media_message', 'type': 'boolean', 'description': 'True if message contains only media'},
            {'name': 'created_at', 'type': 'timestamp', 'description': 'Record creation timestamp'},
            {'name': 'updated_at', 'type': 'timestamp', 'description': 'Record update timestamp'}
        ],
        'data': clean_messages
    }
    
    # Save JSON
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(supabase_data, f, indent=2, ensure_ascii=False)
    
    # Save CSV
    csv_file = output_file.replace('.json', '.csv')
    with open(csv_file, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        
        # Write header
        writer.writerow([
            'id', 'guid', 'text', 'date', 'date_read', 'is_from_me',
            'has_attachments', 'contact_id', 'service', 'readable_date',
            'chat_id', 'chat_identifier', 'chat_display_name', 'year', 'month',
            'is_media_message', 'created_at', 'updated_at'
        ])
        
        # Write data
        for msg in clean_messages:
            writer.writerow([
                msg['id'], msg['guid'], msg['text'], msg['date'],
                msg['date_read'], msg['is_from_me'], msg['has_attachments'],
                msg['contact_id'], msg['service'], msg['readable_date'],
                msg['chat_id'], msg['chat_identifier'], msg['chat_display_name'],
                msg['year'], msg['month'], msg['is_media_message'],
                msg['created_at'], msg['updated_at']
            ])
    
    # Generate SQL
    sql_file = output_file.replace('.json', '.sql')
    sql = f"""
-- Create nitzan_messages table for Supabase
-- Generated from comprehensive extraction on {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
-- Total records: {len(clean_messages)}

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
"""
    
    with open(sql_file, 'w') as f:
        f.write(sql)
    
    # Print summary
    print(f"✅ Clean Supabase export created:")
    print(f"  📄 JSON: {output_file}")
    print(f"  📊 CSV: {csv_file}")
    print(f"  🔧 SQL: {sql_file}")
    print(f"  📊 Total records: {len(clean_messages)}")
    
    # Print data quality summary
    from_david = sum(1 for msg in clean_messages if msg['is_from_me'])
    to_david = len(clean_messages) - from_david
    media_messages = sum(1 for msg in clean_messages if msg['is_media_message'])
    
    print(f"\n📊 Data Quality Summary:")
    print(f"  📤 Messages from David: {from_david}")
    print(f"  📥 Messages to David: {to_david}")
    print(f"  📷 Media messages: {media_messages}")
    print(f"  📅 Date range: {supabase_data['extraction_metadata']['date_range']['start']} to {supabase_data['extraction_metadata']['date_range']['end']}")
    
    return supabase_data


def main():
    input_file = 'comprehensive_nitzan_messages_20250724_152207.json'
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    output_file = f"clean_supabase_nitzan_messages_{timestamp}.json"
    
    try:
        create_clean_supabase_export(input_file, output_file)
        print(f"\n🎉 Clean export ready for Supabase import!")
        
    except FileNotFoundError:
        print(f"❌ File not found: {input_file}")
        print("Please run the comprehensive extractor first")
    except Exception as e:
        print(f"❌ Error: {e}")


if __name__ == "__main__":
    main() 