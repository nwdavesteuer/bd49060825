#!/usr/bin/env python3
"""
Analyze and Prepare Supabase Import
Analyzes the comprehensive Nitzan messages extraction by year,
verifies message labeling, and prepares a Supabase-ready table structure.
"""

import json
import csv
from datetime import datetime
from collections import defaultdict


def analyze_messages_by_year(json_file):
    """Analyze messages by year and verify labeling."""
    print("📊 Analyzing messages by year...")
    
    with open(json_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    messages = data['messages']
    
    # Group by year
    years = defaultdict(lambda: {'from_david': 0, 'to_david': 0, 'total': 0, 'chats': set()})
    
    for msg in messages:
        year = msg['readable_date'][:4]
        years[year]['total'] += 1
        years[year]['chats'].add(msg['chat_identifier'])
        
        if msg['is_from_me']:
            years[year]['from_david'] += 1
        else:
            years[year]['to_david'] += 1
    
    print("\n📅 Messages by Year:")
    print("-" * 80)
    print("Year | Total | From David | To David | Balance | Chats")
    print("-" * 80)
    
    total_from_david = 0
    total_to_david = 0
    total_messages = 0
    
    for year in sorted(years.keys()):
        stats = years[year]
        balance = stats['from_david'] - stats['to_david']
        chat_list = ', '.join(sorted(stats['chats']))
        
        print(f"{year} | {stats['total']:5d} | {stats['from_david']:10d} | {stats['to_david']:8d} | {balance:+7d} | {chat_list}")
        
        total_from_david += stats['from_david']
        total_to_david += stats['to_david']
        total_messages += stats['total']
    
    print("-" * 80)
    print(f"TOTAL | {total_messages:5d} | {total_from_david:10d} | {total_to_david:8d} | {total_from_david - total_to_david:+7d} |")
    
    return years, data


def verify_message_labeling(data):
    """Verify that message labeling is consistent and logical."""
    print("\n🔍 Verifying message labeling...")
    
    messages = data['messages']
    
    # Check for potential issues
    issues = []
    
    # Check for empty messages
    empty_messages = [msg for msg in messages if not msg['text'].strip()]
    if empty_messages:
        issues.append(f"Found {len(empty_messages)} empty messages")
    
    # Check for very long messages (potential data corruption)
    long_messages = [msg for msg in messages if len(msg['text']) > 10000]
    if long_messages:
        issues.append(f"Found {len(long_messages)} very long messages (>10k chars)")
    
    # Check for messages with missing dates
    missing_dates = [msg for msg in messages if not msg['readable_date']]
    if missing_dates:
        issues.append(f"Found {len(missing_dates)} messages with missing dates")
    
    # Check for messages with missing contact info
    missing_contact = [msg for msg in messages if not msg['contact_id']]
    if missing_contact:
        issues.append(f"Found {len(missing_contact)} messages with missing contact info")
    
    if issues:
        print("⚠️  Potential issues found:")
        for issue in issues:
            print(f"  - {issue}")
    else:
        print("✅ No obvious labeling issues found")
    
    return issues


def create_supabase_structure(data, output_file):
    """Create a Supabase-ready table structure."""
    print(f"\n🗄️  Creating Supabase-ready structure: {output_file}")
    
    messages = data['messages']
    
    # Define Supabase table structure
    supabase_messages = []
    
    for msg in messages:
        # Convert to Supabase-friendly format
        supabase_msg = {
            'id': msg['message_id'],  # Primary key
            'guid': msg['guid'],
            'text': msg['text'],
            'date': msg['date'],
            'date_read': msg['date_read'],
            'is_from_me': msg['is_from_me'],
            'has_attachments': msg['has_attachments'],
            'contact_id': msg['contact_id'],
            'service': msg['service'],
            'readable_date': msg['readable_date'],
            'chat_id': msg['chat_id'],
            'chat_identifier': msg['chat_identifier'],
            'chat_display_name': msg['chat_display_name'],
            'year': msg['readable_date'][:4] if msg['readable_date'] else None,
            'month': msg['readable_date'][:7] if msg['readable_date'] else None,
            'created_at': datetime.now().isoformat(),
            'updated_at': datetime.now().isoformat()
        }
        
        supabase_messages.append(supabase_msg)
    
    # Save as JSON
    supabase_data = {
        'table_name': 'nitzan_messages',
        'total_records': len(supabase_messages),
        'columns': [
            {'name': 'id', 'type': 'bigint', 'primary_key': True},
            {'name': 'guid', 'type': 'text'},
            {'name': 'text', 'type': 'text'},
            {'name': 'date', 'type': 'bigint'},
            {'name': 'date_read', 'type': 'bigint'},
            {'name': 'is_from_me', 'type': 'boolean'},
            {'name': 'has_attachments', 'type': 'boolean'},
            {'name': 'contact_id', 'type': 'text'},
            {'name': 'service', 'type': 'text'},
            {'name': 'readable_date', 'type': 'timestamp'},
            {'name': 'chat_id', 'type': 'bigint'},
            {'name': 'chat_identifier', 'type': 'text'},
            {'name': 'chat_display_name', 'type': 'text'},
            {'name': 'year', 'type': 'text'},
            {'name': 'month', 'type': 'text'},
            {'name': 'created_at', 'type': 'timestamp'},
            {'name': 'updated_at', 'type': 'timestamp'}
        ],
        'data': supabase_messages
    }
    
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(supabase_data, f, indent=2, ensure_ascii=False)
    
    # Also create CSV for easy import
    csv_file = output_file.replace('.json', '.csv')
    with open(csv_file, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        
        # Write header
        writer.writerow([
            'id', 'guid', 'text', 'date', 'date_read', 'is_from_me',
            'has_attachments', 'contact_id', 'service', 'readable_date',
            'chat_id', 'chat_identifier', 'chat_display_name', 'year', 'month',
            'created_at', 'updated_at'
        ])
        
        # Write data
        for msg in supabase_messages:
            writer.writerow([
                msg['id'], msg['guid'], msg['text'], msg['date'],
                msg['date_read'], msg['is_from_me'], msg['has_attachments'],
                msg['contact_id'], msg['service'], msg['readable_date'],
                msg['chat_id'], msg['chat_identifier'], msg['chat_display_name'],
                msg['year'], msg['month'], msg['created_at'], msg['updated_at']
            ])
    
    print(f"✅ Supabase structure created:")
    print(f"  📄 JSON: {output_file}")
    print(f"  📊 CSV: {csv_file}")
    print(f"  📊 Total records: {len(supabase_messages)}")
    
    return supabase_data


def generate_supabase_sql(data, output_file):
    """Generate SQL for creating the Supabase table."""
    print(f"\n🔧 Generating Supabase SQL: {output_file}")
    
    sql = """
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
"""
    
    with open(output_file, 'w') as f:
        f.write(sql)
    
    print(f"✅ SQL file created: {output_file}")


def main():
    json_file = 'comprehensive_nitzan_messages_20250724_152207.json'
    
    try:
        # Analyze by year
        years, data = analyze_messages_by_year(json_file)
        
        # Verify labeling
        issues = verify_message_labeling(data)
        
        # Create Supabase structure
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        supabase_file = f"supabase_nitzan_messages_{timestamp}.json"
        supabase_data = create_supabase_structure(data, supabase_file)
        
        # Generate SQL
        sql_file = f"supabase_nitzan_messages_{timestamp}.sql"
        generate_supabase_sql(data, sql_file)
        
        print(f"\n🎉 Analysis complete!")
        print(f"📁 Files created:")
        print(f"  - {supabase_file} (Supabase JSON)")
        print(f"  - {supabase_file.replace('.json', '.csv')} (Supabase CSV)")
        print(f"  - {sql_file} (Supabase SQL)")
        
        if issues:
            print(f"\n⚠️  Review the issues above before importing to Supabase")
        
    except FileNotFoundError:
        print(f"❌ File not found: {json_file}")
        print("Please run the comprehensive extractor first")
    except Exception as e:
        print(f"❌ Error: {e}")


if __name__ == "__main__":
    main() 