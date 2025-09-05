#!/usr/bin/env python3
"""
Extract messages from David's backup drive
"""

import sqlite3
import json
import os
from datetime import datetime
from pathlib import Path

def extract_from_backup_db(db_path, source_name):
    """Extract messages from a specific backup database"""
    
    if not os.path.exists(db_path):
        print(f"❌ Database not found: {db_path}")
        return []
    
    print(f"🔍 Extracting from {source_name}...")
    print(f"📁 Database: {db_path}")
    
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
               OR c.chat_identifier = '+19172390518'
               OR c.chat_identifier LIKE '%david%'
               OR c.chat_identifier LIKE '%steuer%')
               AND c.chat_identifier NOT LIKE 'chat%'
               AND (c.display_name IS NULL OR c.display_name = '')
            GROUP BY c.ROWID, c.guid, c.chat_identifier, c.display_name, c.is_archived
            ORDER BY message_count DESC
        """)
        
        nitzan_chats = cursor.fetchall()
        print(f"📱 Found {len(nitzan_chats)} direct Nitzan/David chats")
        
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
                    'source': source_name,
                    'chat_identifier': chat_identifier
                }
                
                all_messages.append(message_data)
        
        conn.close()
        print(f"📊 Extracted {len(all_messages)} messages from {source_name}")
        return all_messages
        
    except Exception as e:
        print(f"❌ Error extracting from {source_name}: {e}")
        return []

def main():
    """Main extraction function"""
    print("🔍 EXTRACTING MESSAGES FROM DAVID'S BACKUP")
    print("=" * 60)
    
    # Define the backup databases we found
    backup_databases = [
        {
            'path': "/Volumes/davids backup/Backups.backupdb/Ayanna's MacBook/Latest/Macintosh HD/Users/Ayanna/Library/Messages/chat.db",
            'name': "Ayanna_MacBook_2019"
        },
        {
            'path': "/Volumes/davids backup/Backups.backupdb/SF-006355-AP/Latest/Macintosh HD/Users/administrator/Library/Messages/chat.db",
            'name': "SF_Administrator_2020"
        },
        {
            'path': "/Volumes/davids backup/Backups.backupdb/SF-006355-AP/Latest/Macintosh HD/Users/david.steuer/Library/Messages/chat.db",
            'name': "SF_DavidSteuer_2020"
        }
    ]
    
    all_messages = []
    
    for db_info in backup_databases:
        messages = extract_from_backup_db(db_info['path'], db_info['name'])
        all_messages.extend(messages)
    
    if all_messages:
        # Analyze by year
        print(f"\n📅 ANALYZING EXTRACTED MESSAGES")
        print("=" * 50)
        
        year_counts = {}
        source_counts = {}
        sender_counts = {}
        
        for msg in all_messages:
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
        
        print(f"📊 Total messages extracted: {len(all_messages)}")
        
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
        
        # Save results
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_file = f"davids_backup_messages_{timestamp}.json"
        
        with open(output_file, 'w') as f:
            json.dump(all_messages, f, indent=2)
        
        print(f"\n💾 Saved {len(all_messages)} messages to: {output_file}")
        
        # Also save as CSV
        csv_file = f"davids_backup_messages_{timestamp}.csv"
        import csv
        
        fieldnames = [
            'message_id', 'guid', 'text', 'date', 'date_read', 'is_from_me',
            'sender', 'recipient', 'emojis', 'links', 'service', 'account',
            'contact_id', 'readable_date', 'apple_date', 'apple_date_read'
        ]
        
        with open(csv_file, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            
            for msg in all_messages:
                row = {}
                for field in fieldnames:
                    row[field] = msg.get(field, None)
                writer.writerow(row)
        
        print(f"📄 Saved CSV version to: {csv_file}")
        
    else:
        print("❌ No messages found in any of the backup databases")

if __name__ == "__main__":
    main() 