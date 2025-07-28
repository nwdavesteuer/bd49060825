#!/usr/bin/env python3
"""
Compare iMac Time Machine backup with previously extracted data
"""

import sqlite3
import json
import os
from datetime import datetime
from pathlib import Path

def load_previous_data():
    """Load previously extracted data"""
    previous_files = [
        "ultimate_complete_messages_20250727_201359.json",
        "supabase_complete_messages_20250727_195358.json",
        "supabase_2024_2025_messages_20250727_195358.json"
    ]
    
    all_previous_messages = []
    
    for file_path in previous_files:
        if os.path.exists(file_path):
            print(f"📂 Loading: {file_path}")
            try:
                with open(file_path, 'r') as f:
                    data = json.load(f)
                    if isinstance(data, list):
                        all_previous_messages.extend(data)
                    else:
                        print(f"⚠️  Unexpected format in {file_path}")
            except Exception as e:
                print(f"❌ Error loading {file_path}: {e}")
    
    print(f"📊 Loaded {len(all_previous_messages)} previous messages")
    return all_previous_messages

def extract_timemachine_messages():
    """Extract messages from iMac Time Machine backup"""
    backup_db_path = "/Volumes/Extreme SSD/2024-09-05-112619.previous/Data/Users/dsteuer/Library/Messages/chat.db"
    
    if not os.path.exists(backup_db_path):
        print(f"❌ Time Machine backup not found: {backup_db_path}")
        return []
    
    print("🔍 Extracting messages from iMac Time Machine backup...")
    
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
                c.is_archived,
                COUNT(m.ROWID) as message_count,
                SUM(CASE WHEN m.is_from_me = 1 THEN 1 ELSE 0 END) as messages_from_david,
                SUM(CASE WHEN m.is_from_me = 0 THEN 1 ELSE 0 END) as messages_from_nitzan
            FROM chat c
            JOIN chat_message_join cmj ON c.ROWID = cmj.chat_id
            JOIN message m ON cmj.message_id = m.ROWID
            WHERE (c.chat_identifier LIKE '%nitzan%'
               OR c.chat_identifier LIKE '%pelman%'
               OR c.chat_identifier LIKE '%917%239%0518%'
               OR c.chat_identifier = '+19172390518')
               AND c.chat_identifier NOT LIKE 'chat%'
               AND (c.display_name IS NULL OR c.display_name = '')
            GROUP BY c.ROWID, c.guid, c.chat_identifier, c.display_name, c.is_archived
            ORDER BY message_count DESC
        """)
        
        nitzan_chats = cursor.fetchall()
        print(f"📱 Found {len(nitzan_chats)} direct Nitzan chats")
        
        all_messages = []
        
        for chat in nitzan_chats:
            chat_id, guid, chat_identifier, display_name, is_archived, message_count, messages_from_david, messages_from_nitzan = chat
            
            print(f"💬 Chat {chat_id}: {chat_identifier} ({message_count} messages)")
            
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

def compare_messages(timemachine_messages, previous_messages):
    """Compare messages to find new ones"""
    
    # Create sets of GUIDs for comparison
    previous_guids = set()
    for msg in previous_messages:
        if msg.get('guid'):
            previous_guids.add(msg['guid'])
    
    timemachine_guids = set()
    for msg in timemachine_messages:
        if msg.get('guid'):
            timemachine_guids.add(msg['guid'])
    
    # Find new messages
    new_guids = timemachine_guids - previous_guids
    new_messages = [msg for msg in timemachine_messages if msg.get('guid') in new_guids]
    
    # Find overlapping messages
    overlapping_guids = timemachine_guids & previous_guids
    overlapping_messages = [msg for msg in timemachine_messages if msg.get('guid') in overlapping_guids]
    
    print(f"\n📊 COMPARISON RESULTS:")
    print(f"=" * 50)
    print(f"📱 Time Machine messages: {len(timemachine_messages)}")
    print(f"📂 Previous messages: {len(previous_messages)}")
    print(f"🆕 New messages: {len(new_messages)}")
    print(f"🔄 Overlapping messages: {len(overlapping_messages)}")
    
    return new_messages, overlapping_messages

def analyze_new_messages(new_messages):
    """Analyze the new messages by year and sender"""
    if not new_messages:
        print("❌ No new messages found")
        return
    
    print(f"\n📅 NEW MESSAGES ANALYSIS:")
    print(f"=" * 50)
    
    # Group by year
    year_counts = {}
    sender_counts = {}
    
    for msg in new_messages:
        if msg.get('readable_date'):
            try:
                year = datetime.fromisoformat(msg['readable_date'].replace('Z', '+00:00')).year
                if year not in year_counts:
                    year_counts[year] = {'David': 0, 'Nitzan': 0}
                sender = msg.get('is_from_me', 'Unknown')
                year_counts[year][sender] += 1
            except:
                pass
        
        sender = msg.get('is_from_me', 'Unknown')
        sender_counts[sender] = sender_counts.get(sender, 0) + 1
    
    # Print year breakdown
    print("📅 Messages by Year:")
    for year in sorted(year_counts.keys()):
        david_count = year_counts[year]['David']
        nitzan_count = year_counts[year]['Nitzan']
        total = david_count + nitzan_count
        print(f"  {year}: {total} total ({david_count} from David, {nitzan_count} from Nitzan)")
    
    # Print sender breakdown
    print(f"\n👤 Messages by Sender:")
    for sender, count in sender_counts.items():
        print(f"  {sender}: {count} messages")

def main():
    """Main comparison function"""
    print("🔍 COMPARING TIMEMACHINE BACKUP WITH PREVIOUS DATA")
    print("=" * 60)
    
    # Load previous data
    previous_messages = load_previous_data()
    
    # Extract Time Machine messages
    timemachine_messages = extract_timemachine_messages()
    
    if not timemachine_messages:
        print("❌ No Time Machine messages found")
        return
    
    # Compare messages
    new_messages, overlapping_messages = compare_messages(timemachine_messages, previous_messages)
    
    # Analyze new messages
    analyze_new_messages(new_messages)
    
    # Save new messages
    if new_messages:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_file = f"new_timemachine_messages_{timestamp}.json"
        
        with open(output_file, 'w') as f:
            json.dump(new_messages, f, indent=2)
        
        print(f"\n💾 Saved {len(new_messages)} new messages to: {output_file}")
        
        # Also save as CSV for Supabase
        csv_file = f"new_timemachine_messages_{timestamp}.csv"
        import csv
        
        if new_messages:
            fieldnames = [
                'message_id', 'guid', 'text', 'date', 'date_read', 'is_from_me',
                'sender', 'recipient', 'emojis', 'links', 'service', 'account',
                'contact_id', 'readable_date', 'apple_date', 'apple_date_read'
            ]
            
            with open(csv_file, 'w', newline='', encoding='utf-8') as f:
                writer = csv.DictWriter(f, fieldnames=fieldnames)
                writer.writeheader()
                
                for msg in new_messages:
                    # Ensure all fields are present
                    row = {}
                    for field in fieldnames:
                        row[field] = msg.get(field, None)
                    writer.writerow(row)
            
            print(f"📄 Saved CSV version to: {csv_file}")

if __name__ == "__main__":
    main() 