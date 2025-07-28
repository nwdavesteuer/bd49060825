#!/usr/bin/env python3
"""
Create final comprehensive dataset combining all sources
"""

import sqlite3
import json
import csv
import os
from datetime import datetime
from pathlib import Path

def extract_from_mac():
    """Extract messages from current Mac Messages database"""
    db_path = os.path.expanduser("~/Library/Messages/chat.db")
    
    if not os.path.exists(db_path):
        print(f"❌ Mac database not found: {db_path}")
        return []
    
    print("🔍 Extracting from current Mac Messages database...")
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Find direct Nitzan chats
        cursor.execute("""
            SELECT DISTINCT
                c.ROWID as chat_id,
                c.guid,
                c.chat_identifier,
                c.display_name,
                c.is_archived
            FROM chat c
            WHERE (c.chat_identifier LIKE '%nitzan%'
               OR c.chat_identifier LIKE '%pelman%'
               OR c.chat_identifier LIKE '%917%239%0518%'
               OR c.chat_identifier = '+19172390518')
               AND c.chat_identifier NOT LIKE 'chat%'
               AND (c.display_name IS NULL OR c.display_name = '')
        """)
        
        nitzan_chats = cursor.fetchall()
        print(f"📱 Found {len(nitzan_chats)} direct Nitzan chats")
        
        all_messages = []
        
        for chat in nitzan_chats:
            chat_id, guid, chat_identifier, display_name, is_archived = chat
            
            # Get messages for this chat
            cursor.execute("""
                SELECT 
                    m.ROWID as message_id,
                    m.guid,
                    m.text,
                    m.date,
                    m.date_read,
                    m.is_from_me,
                    m.service,
                    m.account,
                    h.id as handle_id
                FROM message m
                JOIN chat_message_join cmj ON m.ROWID = cmj.message_id
                LEFT JOIN handle h ON m.handle_id = h.ROWID
                WHERE cmj.chat_id = ?
                ORDER BY m.date
            """, (chat_id,))
            
            chat_messages = cursor.fetchall()
            
            for msg in chat_messages:
                message_id, guid, text, date, date_read, is_from_me, service, account, handle_id = msg
                
                # Convert Apple timestamp to readable date
                if date:
                    apple_date = int(date)
                    readable_date = datetime.fromtimestamp(apple_date / 1000000000 + 978307200).isoformat()
                else:
                    apple_date = None
                    readable_date = None
                
                # Convert read date
                if date_read:
                    apple_date_read = int(date_read)
                    readable_date_read = datetime.fromtimestamp(apple_date_read / 1000000000 + 978307200).isoformat()
                else:
                    apple_date_read = None
                    readable_date_read = None
                
                # Determine contact_id
                if is_from_me:
                    contact_id = "David"
                    sender = "David"
                    recipient = handle_id if handle_id else "Nitzan"
                else:
                    contact_id = handle_id if handle_id else "Nitzan"
                    sender = handle_id if handle_id else "Nitzan"
                    recipient = "David"
                
                message_data = {
                    'message_id': message_id,
                    'guid': guid,
                    'text': text or "",
                    'date': readable_date,
                    'date_read': readable_date_read,
                    'is_from_me': "David" if is_from_me else "Nitzan",
                    'sender': sender,
                    'recipient': recipient,
                    'emojis': None,
                    'links': None,
                    'service': service,
                    'account': account,
                    'contact_id': contact_id,
                    'readable_date': readable_date,
                    'apple_date': apple_date,
                    'apple_date_read': apple_date_read,
                    'source': 'Mac_Current',
                    'chat_identifier': chat_identifier
                }
                
                all_messages.append(message_data)
        
        conn.close()
        print(f"📊 Extracted {len(all_messages)} messages from Mac")
        return all_messages
        
    except Exception as e:
        print(f"❌ Error extracting from Mac: {e}")
        return []

def extract_from_timemachine():
    """Extract messages from Time Machine backup"""
    backup_db_path = "/Volumes/Extreme SSD/2024-09-05-112619.previous/Data/Users/dsteuer/Library/Messages/chat.db"
    
    if not os.path.exists(backup_db_path):
        print(f"❌ Time Machine backup not found: {backup_db_path}")
        return []
    
    print("🔍 Extracting from Time Machine backup...")
    
    try:
        conn = sqlite3.connect(backup_db_path)
        cursor = conn.cursor()
        
        # Find direct Nitzan chats
        cursor.execute("""
            SELECT DISTINCT
                c.ROWID as chat_id,
                c.guid,
                c.chat_identifier,
                c.display_name,
                c.is_archived
            FROM chat c
            WHERE (c.chat_identifier LIKE '%nitzan%'
               OR c.chat_identifier LIKE '%pelman%'
               OR c.chat_identifier LIKE '%917%239%0518%'
               OR c.chat_identifier = '+19172390518')
               AND c.chat_identifier NOT LIKE 'chat%'
               AND (c.display_name IS NULL OR c.display_name = '')
        """)
        
        nitzan_chats = cursor.fetchall()
        print(f"📱 Found {len(nitzan_chats)} direct Nitzan chats")
        
        all_messages = []
        
        for chat in nitzan_chats:
            chat_id, guid, chat_identifier, display_name, is_archived = chat
            
            # Get messages for this chat
            cursor.execute("""
                SELECT 
                    m.ROWID as message_id,
                    m.guid,
                    m.text,
                    m.date,
                    m.date_read,
                    m.is_from_me,
                    m.service,
                    m.account,
                    h.id as handle_id
                FROM message m
                JOIN chat_message_join cmj ON m.ROWID = cmj.message_id
                LEFT JOIN handle h ON m.handle_id = h.ROWID
                WHERE cmj.chat_id = ?
                ORDER BY m.date
            """, (chat_id,))
            
            chat_messages = cursor.fetchall()
            
            for msg in chat_messages:
                message_id, guid, text, date, date_read, is_from_me, service, account, handle_id = msg
                
                # Convert Apple timestamp to readable date
                if date:
                    apple_date = int(date)
                    readable_date = datetime.fromtimestamp(apple_date / 1000000000 + 978307200).isoformat()
                else:
                    apple_date = None
                    readable_date = None
                
                # Convert read date
                if date_read:
                    apple_date_read = int(date_read)
                    readable_date_read = datetime.fromtimestamp(apple_date_read / 1000000000 + 978307200).isoformat()
                else:
                    apple_date_read = None
                    readable_date_read = None
                
                # Determine contact_id
                if is_from_me:
                    contact_id = "David"
                    sender = "David"
                    recipient = handle_id if handle_id else "Nitzan"
                else:
                    contact_id = handle_id if handle_id else "Nitzan"
                    sender = handle_id if handle_id else "Nitzan"
                    recipient = "David"
                
                message_data = {
                    'message_id': message_id,
                    'guid': guid,
                    'text': text or "",
                    'date': readable_date,
                    'date_read': readable_date_read,
                    'is_from_me': "David" if is_from_me else "Nitzan",
                    'sender': sender,
                    'recipient': recipient,
                    'emojis': None,
                    'links': None,
                    'service': service,
                    'account': account,
                    'contact_id': contact_id,
                    'readable_date': readable_date,
                    'apple_date': apple_date,
                    'apple_date_read': apple_date_read,
                    'source': 'TimeMachine_Backup',
                    'chat_identifier': chat_identifier
                }
                
                all_messages.append(message_data)
        
        conn.close()
        print(f"📊 Extracted {len(all_messages)} messages from Time Machine backup")
        return all_messages
        
    except Exception as e:
        print(f"❌ Error extracting from Time Machine backup: {e}")
        return []

def extract_from_csv():
    """Extract messages from CSV file"""
    csv_path = "/Users/davidsteuer/Documents/Messages - David Steuer.csv"
    
    if not os.path.exists(csv_path):
        print(f"❌ CSV file not found: {csv_path}")
        return []
    
    print("🔍 Extracting from CSV file...")
    
    try:
        with open(csv_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            
            messages = []
            
            for i, row in enumerate(reader):
                # Parse message date
                message_date = row.get('Message Date', '')
                if message_date:
                    try:
                        date_obj = datetime.fromisoformat(message_date.replace('Z', '+00:00'))
                        readable_date = date_obj.isoformat()
                        apple_date = int((date_obj.timestamp() - 978307200) * 1000000000)
                    except:
                        readable_date = None
                        apple_date = None
                else:
                    readable_date = None
                    apple_date = None
                
                # Get message information
                message_type = row.get('Type', '')
                sender_name = row.get('Sender Name', '')
                service = row.get('Service', '')
                text = row.get('Text', '')
                
                # Determine sender based on Type field
                if message_type.lower() == 'outgoing':
                    sender = 'David'
                    is_from_me = 'David'
                    recipient = 'Nitzan'
                elif message_type.lower() == 'incoming':
                    sender = 'Nitzan'
                    is_from_me = 'Nitzan'
                    recipient = 'David'
                else:
                    continue  # Skip notifications
                
                message_data = {
                    'message_id': i + 1,
                    'guid': f"csv_{i + 1}",
                    'text': text or "",
                    'date': readable_date,
                    'date_read': None,
                    'is_from_me': is_from_me,
                    'sender': sender,
                    'recipient': recipient,
                    'emojis': None,
                    'links': None,
                    'service': service,
                    'account': None,
                    'contact_id': sender,
                    'readable_date': readable_date,
                    'apple_date': apple_date,
                    'apple_date_read': None,
                    'source': 'CSV_Export',
                    'chat_identifier': 'David Steuer'
                }
                
                messages.append(message_data)
            
            print(f"📊 Extracted {len(messages)} messages from CSV")
            return messages
            
    except Exception as e:
        print(f"❌ Error extracting from CSV: {e}")
        return []

def merge_and_deduplicate(all_sources):
    """Merge and deduplicate messages from all sources"""
    print("🔄 Merging and deduplicating messages...")
    
    # Create a dictionary to track unique messages by GUID
    unique_messages = {}
    
    for source_name, messages in all_sources.items():
        print(f"📂 Processing {len(messages)} messages from {source_name}")
        
        for msg in messages:
            guid = msg.get('guid')
            if guid:
                # If we haven't seen this GUID, add it
                if guid not in unique_messages:
                    unique_messages[guid] = msg
                else:
                    # If we have seen it, keep the one with more complete data
                    existing = unique_messages[guid]
                    if not existing.get('text') and msg.get('text'):
                        unique_messages[guid] = msg
                    elif not existing.get('date_read') and msg.get('date_read'):
                        unique_messages[guid] = msg
    
    merged_messages = list(unique_messages.values())
    print(f"📊 After deduplication: {len(merged_messages)} unique messages")
    
    return merged_messages

def analyze_by_year(messages):
    """Analyze messages by year and source"""
    print("📅 Analyzing messages by year...")
    
    year_counts = {}
    source_counts = {}
    sender_counts = {}
    
    for msg in messages:
        year = None
        if msg.get('readable_date'):
            try:
                year = datetime.fromisoformat(msg['readable_date'].replace('Z', '+00:00')).year
            except:
                pass
        
        if year:
            if year not in year_counts:
                year_counts[year] = {'David': 0, 'Nitzan': 0}
            sender = msg.get('is_from_me', 'Unknown')
            year_counts[year][sender] += 1
        
        source = msg.get('source', 'Unknown')
        source_counts[source] = source_counts.get(source, 0) + 1
        
        sender = msg.get('is_from_me', 'Unknown')
        sender_counts[sender] = sender_counts.get(sender, 0) + 1
    
    print(f"\n📅 Messages by Year:")
    for year in sorted(year_counts.keys()):
        david_count = year_counts[year]['David']
        nitzan_count = year_counts[year]['Nitzan']
        total = david_count + nitzan_count
        print(f"  {year}: {total} total ({david_count} from David, {nitzan_count} from Nitzan)")
    
    print(f"\n📂 Messages by Source:")
    for source, count in source_counts.items():
        print(f"  {source}: {count} messages")
    
    print(f"\n👤 Messages by Sender:")
    for sender, count in sender_counts.items():
        print(f"  {sender}: {count} messages")

def create_supabase_export(messages, year_filter=None):
    """Create Supabase-ready export"""
    print(f"🔄 Creating Supabase export...")
    
    if year_filter:
        filtered_messages = []
        for msg in messages:
            if msg.get('readable_date'):
                try:
                    year = datetime.fromisoformat(msg['readable_date'].replace('Z', '+00:00')).year
                    if year in year_filter:
                        filtered_messages.append(msg)
                except:
                    pass
        messages = filtered_messages
        print(f"📊 Filtered to {len(messages)} messages for years {year_filter}")
    
    # Save as JSON
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    
    if year_filter:
        json_file = f"final_comprehensive_{year_filter[0]}_{year_filter[1]}_{timestamp}.json"
        csv_file = f"final_comprehensive_{year_filter[0]}_{year_filter[1]}_{timestamp}.csv"
    else:
        json_file = f"final_comprehensive_all_{timestamp}.json"
        csv_file = f"final_comprehensive_all_{timestamp}.csv"
    
    with open(json_file, 'w') as f:
        json.dump(messages, f, indent=2)
    
    # Save as CSV
    fieldnames = [
        'message_id', 'guid', 'text', 'date', 'date_read', 'is_from_me',
        'sender', 'recipient', 'emojis', 'links', 'service', 'account',
        'contact_id', 'readable_date', 'apple_date', 'apple_date_read'
    ]
    
    with open(csv_file, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        
        for msg in messages:
            row = {}
            for field in fieldnames:
                row[field] = msg.get(field, None)
            writer.writerow(row)
    
    print(f"💾 Saved {len(messages)} messages:")
    print(f"  JSON: {json_file}")
    print(f"  CSV: {csv_file}")
    
    return json_file, csv_file

def main():
    """Main comprehensive extraction function"""
    print("🔍 CREATING FINAL COMPREHENSIVE DATASET")
    print("=" * 60)
    
    # Extract from all sources
    all_sources = {
        'Mac_Current': extract_from_mac(),
        'TimeMachine_Backup': extract_from_timemachine(),
        'CSV_Export': extract_from_csv()
    }
    
    # Merge and deduplicate
    merged_messages = merge_and_deduplicate(all_sources)
    
    if not merged_messages:
        print("❌ No messages found from any source")
        return
    
    # Analyze by year
    analyze_by_year(merged_messages)
    
    # Create comprehensive export (all years)
    json_file_all, csv_file_all = create_supabase_export(merged_messages)
    
    # Create 2024-2025 export
    json_file_2024_2025, csv_file_2024_2025 = create_supabase_export(merged_messages, [2024, 2025])
    
    print(f"\n✅ FINAL COMPREHENSIVE DATASET CREATED!")
    print(f"📊 Total unique messages: {len(merged_messages)}")
    print(f"📁 Files created:")
    print(f"  All years: {json_file_all}, {csv_file_all}")
    print(f"  2024-2025: {json_file_2024_2025}, {csv_file_2024_2025}")
    print(f"\n🎯 Ready for Supabase import!")

if __name__ == "__main__":
    main() 