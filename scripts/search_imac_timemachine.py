#!/usr/bin/env python3
"""
Search for messages in iMac Time Machine backup
"""

import sqlite3
import json
import os
import shutil
from datetime import datetime
from pathlib import Path

def search_imac_timemachine():
    """Search for messages in iMac Time Machine backup"""
    
    # Path to iMac Time Machine backup
    imac_backup_path = "/Volumes/Extreme SSD/2024-09-05-112619.previous/Data/Users/dsteuer/Library/Messages/chat.db"
    
    if not os.path.exists(imac_backup_path):
        print(f"❌ iMac Time Machine backup database not found: {imac_backup_path}")
        return
    
    print("🔍 SEARCHING FOR MESSAGES IN IMAC TIME MACHINE BACKUP")
    print("=" * 60)
    print(f"📁 Database: {imac_backup_path}")
    
    # Create output directory
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    output_dir = f"imac_timemachine_messages_{timestamp}"
    os.makedirs(output_dir, exist_ok=True)
    
    try:
        conn = sqlite3.connect(imac_backup_path)
        cursor = conn.cursor()
        
        # Check if this is the same database we've been working with
        cursor.execute("SELECT COUNT(*) FROM message")
        total_messages = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM chat")
        total_chats = cursor.fetchone()[0]
        
        print(f"✅ Found {total_messages} messages in {total_chats} chats")
        
        # Look for Nitzan-related chats
        cursor.execute("""
            SELECT 
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
        
        # Extract messages from each chat
        all_messages = []
        
        for chat in nitzan_chats:
            chat_id, guid, chat_identifier, display_name, is_archived, message_count, messages_from_david, messages_from_nitzan = chat
            
            print(f"  💬 Chat: {chat_identifier}")
            print(f"     Messages: {message_count} (David: {messages_from_david}, Nitzan: {messages_from_nitzan})")
            
            # Get messages from this chat
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
                    readable_date = datetime.fromtimestamp(date / 1000000000 + 978307200).isoformat()
                else:
                    readable_date = None
                
                # Determine sender
                sender = "David" if is_from_me else "Nitzan"
                
                message_data = {
                    'message_id': message_id,
                    'guid': guid,
                    'text': text or "[Media Message]",
                    'date': readable_date,
                    'date_read': datetime.fromtimestamp(date_read / 1000000000 + 978307200).isoformat() if date_read else None,
                    'is_from_me': is_from_me,
                    'sender': sender,
                    'recipient': "Nitzan" if is_from_me else "David",
                    'service': service,
                    'account': account,
                    'contact_id': "David" if is_from_me else handle_id,
                    'readable_date': readable_date,
                    'apple_date': date,
                    'apple_date_read': date_read,
                    'chat_identifier': chat_identifier,
                    'source': 'iMac_TimeMachine'
                }
                
                all_messages.append(message_data)
        
        conn.close()
        
        # Save messages
        messages_file = os.path.join(output_dir, "imac_timemachine_messages.json")
        with open(messages_file, 'w') as f:
            json.dump(all_messages, f, indent=2)
        
        # Analyze by year
        years = {}
        for msg in all_messages:
            if msg.get('readable_date'):
                try:
                    year = datetime.fromisoformat(msg['readable_date'].replace('Z', '+00:00')).year
                    years[year] = years.get(year, 0) + 1
                except:
                    pass
        
        print(f"\n📊 IMAC TIME MACHINE MESSAGE ANALYSIS:")
        print(f"  📱 Total messages: {len(all_messages)}")
        print(f"  💬 Total chats: {len(nitzan_chats)}")
        
        print(f"  📅 By year:")
        for year in sorted(years.keys()):
            print(f"    {year}: {years[year]}")
        
        # By sender
        senders = {}
        for msg in all_messages:
            sender = msg.get('sender', 'unknown')
            senders[sender] = senders.get(sender, 0) + 1
        
        print(f"  👤 By sender:")
        for sender, count in senders.items():
            print(f"    {sender}: {count}")
        
        print(f"\n💾 Messages saved to: {messages_file}")
        print(f"📁 Output directory: {output_dir}")
        
        return all_messages, output_dir
        
    except Exception as e:
        print(f"❌ Error searching iMac Time Machine backup: {e}")
        return [], None

if __name__ == "__main__":
    search_imac_timemachine() 