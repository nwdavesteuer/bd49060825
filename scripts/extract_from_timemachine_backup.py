#!/usr/bin/env python3
"""
Extract messages from Time Machine backup chat.db on Extreme SSD
"""

import sqlite3
import json
from datetime import datetime
import os

def extract_from_timemachine_backup():
    """Extract messages from the Time Machine backup chat.db"""
    
    # Path to the Time Machine backup chat.db
    backup_db_path = "/Volumes/Extreme SSD/2024-09-05-112619.previous/Data/Users/dsteuer/Library/Messages/chat.db"
    
    if not os.path.exists(backup_db_path):
        print(f"❌ Backup database not found: {backup_db_path}")
        return
    
    print("🔍 EXTRACTING FROM TIME MACHINE BACKUP")
    print("=" * 50)
    print(f"📁 Database: {backup_db_path}")
    
    try:
        conn = sqlite3.connect(backup_db_path)
        cursor = conn.cursor()
        
        # First, let's see what chats are available
        print("\n📊 Available chats in backup:")
        cursor.execute("""
            SELECT 
                c.ROWID as chat_id,
                c.guid,
                c.chat_identifier,
                c.display_name,
                c.is_archived,
                COUNT(m.ROWID) as message_count
            FROM chat c
            LEFT JOIN chat_message_join cmj ON c.ROWID = cmj.chat_id
            LEFT JOIN message m ON cmj.message_id = m.ROWID
            GROUP BY c.ROWID, c.guid, c.chat_identifier, c.display_name, c.is_archived
            ORDER BY message_count DESC
            LIMIT 20
        """)
        
        chats = cursor.fetchall()
        for chat in chats:
            chat_id, guid, chat_identifier, display_name, is_archived, message_count = chat
            print(f"  📁 {chat_identifier}: {message_count} messages")
        
        # Find Nitzan-related chats
        print("\n🔍 Finding Nitzan-related chats...")
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
               AND c.chat_identifier NOT LIKE 'chat%'  -- Exclude group chats
               AND (c.display_name IS NULL OR c.display_name = '')  -- Exclude chats with display names (group chats)
            GROUP BY c.ROWID, c.guid, c.chat_identifier, c.display_name, c.is_archived
            ORDER BY message_count DESC
        """)
        
        nitzan_chats = cursor.fetchall()
        print(f"✅ Found {len(nitzan_chats)} direct Nitzan chats in backup:")
        
        all_messages = []
        
        for chat in nitzan_chats:
            chat_id, guid, chat_identifier, display_name, is_archived, message_count, from_david, from_nitzan = chat
            print(f"  📁 {chat_identifier}: {message_count} messages [{'ARCHIVED' if is_archived else 'ACTIVE'}]")
            print(f"    📤 From David: {from_david}, 📥 From Nitzan: {from_nitzan}")
            
            # Extract messages from this chat
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
            print(f"    📊 Extracted {len(chat_messages)} messages from {chat_identifier}")
            
            for msg in chat_messages:
                message_id, guid, text, date, date_read, is_from_me, service, account, handle_id = msg
                
                # Convert Apple timestamp to readable date
                if date:
                    readable_date = datetime.fromtimestamp(date / 1000000000 + 978307200).isoformat()
                else:
                    readable_date = None
                
                # Determine sender and recipient
                if is_from_me:
                    sender = "David"
                    recipient = "Nitzan"
                else:
                    sender = "Nitzan"
                    recipient = "David"
                
                message_data = {
                    'message_id': message_id,
                    'guid': guid,
                    'text': text or '',
                    'date': readable_date,
                    'date_read': date_read,
                    'is_from_me': "1" if is_from_me else "0",
                    'sender': sender,
                    'recipient': recipient,
                    'emojis': None,
                    'links': None,
                    'service': service,
                    'account': account,
                    'contact_id': "David" if is_from_me else handle_id,
                    'readable_date': readable_date,
                    'apple_date': date,
                    'apple_date_read': date_read,
                    'chat_identifier': chat_identifier,
                    'source': 'TimeMachine_Backup'
                }
                
                all_messages.append(message_data)
        
        print(f"\n📊 Total messages extracted from backup: {len(all_messages)}")
        
        # Analyze by year
        year_counts = {}
        for msg in all_messages:
            if msg['readable_date']:
                try:
                    year = datetime.fromisoformat(msg['readable_date'].replace('Z', '+00:00')).year
                    if year not in year_counts:
                        year_counts[year] = {'total': 0, 'from_david': 0, 'from_nitzan': 0}
                    
                    year_counts[year]['total'] += 1
                    if msg['is_from_me'] == "1":
                        year_counts[year]['from_david'] += 1
                    else:
                        year_counts[year]['from_nitzan'] += 1
                except:
                    pass
        
        print("\n📅 Message distribution by year:")
        for year in sorted(year_counts.keys()):
            counts = year_counts[year]
            print(f"  {year}: {counts['total']} total ({counts['from_david']} from David, {counts['from_nitzan']} from Nitzan)")
        
        # Save to file
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_file = f"timemachine_backup_messages_{timestamp}.json"
        
        with open(output_file, 'w') as f:
            json.dump(all_messages, f, indent=2)
        
        print(f"\n💾 Saved to: {output_file}")
        
        conn.close()
        
        return all_messages
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return []

if __name__ == "__main__":
    extract_from_timemachine_backup() 