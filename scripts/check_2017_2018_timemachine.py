#!/usr/bin/env python3
"""
Check for 2017-2018 messages in Time Machine backup
"""

import sqlite3
import json
import os
from datetime import datetime
from pathlib import Path

def check_2017_2018_timemachine():
    """Check for messages from 2017-2018 in Time Machine backup"""
    
    backup_db_path = "/Volumes/Extreme SSD/2024-09-05-112619.previous/Data/Users/dsteuer/Library/Messages/chat.db"
    
    if not os.path.exists(backup_db_path):
        print(f"❌ Time Machine backup not found: {backup_db_path}")
        return
    
    print("🔍 CHECKING FOR 2017-2018 MESSAGES IN TIME MACHINE BACKUP")
    print("=" * 60)
    print(f"📁 Database: {backup_db_path}")
    
    try:
        conn = sqlite3.connect(backup_db_path)
        cursor = conn.cursor()
        
        # Define date ranges for 2017 and 2018 (Apple timestamps)
        # 2017: Jan 1, 2017 to Dec 31, 2017
        start_2017 = (datetime(2017, 1, 1).timestamp() - 978307200) * 1000000000
        end_2017 = (datetime(2017, 12, 31, 23, 59, 59).timestamp() - 978307200) * 1000000000
        
        # 2018: Jan 1, 2018 to Dec 31, 2018
        start_2018 = (datetime(2018, 1, 1).timestamp() - 978307200) * 1000000000
        end_2018 = (datetime(2018, 12, 31, 23, 59, 59).timestamp() - 978307200) * 1000000000
        
        print(f"📅 2017 date range: {start_2017} to {end_2017}")
        print(f"📅 2018 date range: {start_2018} to {end_2018}")
        
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
        
        all_2017_2018_messages = []
        
        for chat in nitzan_chats:
            chat_id, guid, chat_identifier, display_name, is_archived = chat
            
            print(f"\n💬 Chat {chat_id}: {chat_identifier}")
            
            # Check for 2017 messages
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
                WHERE cmj.chat_id = ? AND m.date BETWEEN ? AND ?
                ORDER BY m.date
            """, (chat_id, start_2017, end_2017))
            
            messages_2017 = cursor.fetchall()
            print(f"  2017: {len(messages_2017)} messages")
            
            # Check for 2018 messages
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
                WHERE cmj.chat_id = ? AND m.date BETWEEN ? AND ?
                ORDER BY m.date
            """, (chat_id, start_2018, end_2018))
            
            messages_2018 = cursor.fetchall()
            print(f"  2018: {len(messages_2018)} messages")
            
            # Process 2017 messages
            for msg in messages_2017:
                message_id, guid, text, date, date_read, is_from_me, service, account, handle_id = msg
                
                # Convert Apple timestamp to readable date
                if date:
                    apple_date = int(date)
                    readable_date = datetime.fromtimestamp(apple_date / 1000000000 + 978307200).isoformat()
                    year = datetime.fromtimestamp(apple_date / 1000000000 + 978307200).year
                else:
                    apple_date = None
                    readable_date = None
                    year = None
                
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
                    'chat_identifier': chat_identifier,
                    'year': year
                }
                
                all_2017_2018_messages.append(message_data)
            
            # Process 2018 messages
            for msg in messages_2018:
                message_id, guid, text, date, date_read, is_from_me, service, account, handle_id = msg
                
                # Convert Apple timestamp to readable date
                if date:
                    apple_date = int(date)
                    readable_date = datetime.fromtimestamp(apple_date / 1000000000 + 978307200).isoformat()
                    year = datetime.fromtimestamp(apple_date / 1000000000 + 978307200).year
                else:
                    apple_date = None
                    readable_date = None
                    year = None
                
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
                    'chat_identifier': chat_identifier,
                    'year': year
                }
                
                all_2017_2018_messages.append(message_data)
        
        conn.close()
        
        # Analyze results
        print(f"\n📊 RESULTS:")
        print(f"=" * 40)
        print(f"📱 Total 2017-2018 messages: {len(all_2017_2018_messages)}")
        
        if all_2017_2018_messages:
            # Group by year
            year_counts = {}
            sender_counts = {}
            
            for msg in all_2017_2018_messages:
                year = msg.get('year')
                sender = msg.get('is_from_me')
                
                if year:
                    if year not in year_counts:
                        year_counts[year] = {'David': 0, 'Nitzan': 0}
                    year_counts[year][sender] += 1
                
                sender_counts[sender] = sender_counts.get(sender, 0) + 1
            
            print(f"\n📅 Messages by Year:")
            for year in sorted(year_counts.keys()):
                david_count = year_counts[year]['David']
                nitzan_count = year_counts[year]['Nitzan']
                total = david_count + nitzan_count
                print(f"  {year}: {total} total ({david_count} from David, {nitzan_count} from Nitzan)")
            
            print(f"\n👤 Messages by Sender:")
            for sender, count in sender_counts.items():
                print(f"  {sender}: {count} messages")
            
            # Save results
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            output_file = f"timemachine_2017_2018_messages_{timestamp}.json"
            
            with open(output_file, 'w') as f:
                json.dump(all_2017_2018_messages, f, indent=2)
            
            print(f"\n💾 Saved {len(all_2017_2018_messages)} messages to: {output_file}")
            
            # Also save as CSV
            csv_file = f"timemachine_2017_2018_messages_{timestamp}.csv"
            import csv
            
            fieldnames = [
                'message_id', 'guid', 'text', 'date', 'date_read', 'is_from_me',
                'sender', 'recipient', 'emojis', 'links', 'service', 'account',
                'contact_id', 'readable_date', 'apple_date', 'apple_date_read'
            ]
            
            with open(csv_file, 'w', newline='', encoding='utf-8') as f:
                writer = csv.DictWriter(f, fieldnames=fieldnames)
                writer.writeheader()
                
                for msg in all_2017_2018_messages:
                    row = {}
                    for field in fieldnames:
                        row[field] = msg.get(field, None)
                    writer.writerow(row)
            
            print(f"📄 Saved CSV version to: {csv_file}")
            
        else:
            print("❌ No messages found from 2017-2018 in Time Machine backup")
        
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    check_2017_2018_timemachine() 