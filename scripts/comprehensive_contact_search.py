#!/usr/bin/env python3
"""
Comprehensive search for all possible contact methods and sources
"""

import sqlite3
import json
import os
from datetime import datetime

def search_all_contacts_in_db(db_path, source_name):
    """Search for ALL possible contact methods in a database"""
    
    if not os.path.exists(db_path):
        print(f"❌ Database not found: {db_path}")
        return []
    
    print(f"🔍 Searching ALL contacts in {source_name}...")
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Get ALL chats to see what we might be missing
        cursor.execute("""
            SELECT DISTINCT
                c.ROWID as chat_id,
                c.guid,
                c.chat_identifier,
                c.display_name,
                c.is_archived,
                COUNT(m.ROWID) as message_count,
                SUM(CASE WHEN m.is_from_me = 1 THEN 1 ELSE 0 END) as messages_from_me,
                SUM(CASE WHEN m.is_from_me = 0 THEN 1 ELSE 0 END) as messages_from_other
            FROM chat c
            JOIN chat_message_join cmj ON c.ROWID = cmj.chat_id
            JOIN message m ON cmj.message_id = m.ROWID
            GROUP BY c.ROWID, c.guid, c.chat_identifier, c.display_name, c.is_archived
            ORDER BY message_count DESC
        """)
        
        all_chats = cursor.fetchall()
        print(f"📱 Found {len(all_chats)} total chats")
        
        # Look for any chats that might be David-Nitzan conversations
        potential_chats = []
        
        for chat in all_chats:
            chat_id, guid, chat_identifier, display_name, is_archived, message_count, messages_from_me, messages_from_other = chat
            
            # Check if this might be a David-Nitzan conversation
            is_potential = False
            reason = ""
            
            # Check for known identifiers
            if any(keyword in chat_identifier.lower() for keyword in ['nitzan', 'pelman', 'david', 'steuer', '917', '1917']):
                is_potential = True
                reason = "Known identifier"
            
            # Check for email patterns
            elif '@' in chat_identifier and any(keyword in chat_identifier.lower() for keyword in ['nitzan', 'pelman', 'david', 'steuer']):
                is_potential = True
                reason = "Email pattern"
            
            # Check for phone number patterns
            elif any(char.isdigit() for char in chat_identifier) and len(chat_identifier) >= 10:
                is_potential = True
                reason = "Phone number pattern"
            
            # Check display name
            elif display_name and any(keyword in display_name.lower() for keyword in ['nitzan', 'pelman', 'david', 'steuer']):
                is_potential = True
                reason = "Display name match"
            
            if is_potential:
                potential_chats.append((chat, reason))
                print(f"💬 Potential chat: {chat_identifier} ({display_name}) - {message_count} messages - {reason}")
        
        # Now extract messages from potential chats
        all_messages = []
        
        for (chat, reason) in potential_chats:
            chat_id, guid, chat_identifier, display_name, is_archived, message_count, messages_from_me, messages_from_other = chat
            
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
                    recipient = handle_id if handle_id else "Other"
                else:
                    contact_id = handle_id if handle_id else "Other"
                    sender = handle_id if handle_id else "Other"
                    recipient = "David"
                
                message_data = {
                    'message_id': message_id,
                    'guid': guid,
                    'text': text or "",
                    'date': readable_date,
                    'date_read': readable_date_read,
                    'is_from_me': "David" if is_from_me else "Other",
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
                    'chat_identifier': chat_identifier,
                    'display_name': display_name,
                    'year': year,
                    'reason': reason
                }
                
                all_messages.append(message_data)
        
        conn.close()
        print(f"📊 Extracted {len(all_messages)} messages from {source_name}")
        return all_messages
        
    except Exception as e:
        print(f"❌ Error searching {source_name}: {e}")
        return []

def main():
    """Search all databases comprehensively"""
    print("🔍 COMPREHENSIVE CONTACT SEARCH")
    print("=" * 60)
    
    # Define all databases to search
    databases = [
        {
            'path': os.path.expanduser("~/Library/Messages/chat.db"),
            'name': "Current_Mac"
        },
        {
            'path': "/Volumes/Extreme SSD/2024-09-05-112619.previous/Data/Users/dsteuer/Library/Messages/chat.db",
            'name': "TimeMachine_Backup"
        },
        {
            'path': "/Volumes/davids backup/Backups.backupdb/Ayanna's MacBook/Latest/Macintosh HD/Users/Ayanna/Library/Messages/chat.db",
            'name': "Davids_Backup_Ayanna"
        },
        {
            'path': "/Volumes/davids backup/Backups.backupdb/SF-006355-AP/Latest/Macintosh HD/Users/david.steuer/Library/Messages/chat.db",
            'name': "Davids_Backup_DavidSteuer"
        },
        {
            'path': "/Volumes/davids backup/Backups.backupdb/SF-006355-AP/Latest/Macintosh HD/Users/administrator/Library/Messages/chat.db",
            'name': "Davids_Backup_Administrator"
        }
    ]
    
    all_messages = []
    
    for db_info in databases:
        messages = search_all_contacts_in_db(db_info['path'], db_info['name'])
        all_messages.extend(messages)
    
    if all_messages:
        # Analyze by year and source
        print(f"\n📅 ANALYZING ALL POTENTIAL MESSAGES")
        print("=" * 50)
        
        year_counts = {}
        source_counts = {}
        chat_identifier_counts = {}
        
        for msg in all_messages:
            year = msg.get('year')
            source = msg.get('source', 'Unknown')
            chat_identifier = msg.get('chat_identifier', 'Unknown')
            
            if year:
                if year not in year_counts:
                    year_counts[year] = {'David': 0, 'Other': 0}
                sender = msg.get('is_from_me', 'Unknown')
                year_counts[year][sender] += 1
            
            source_counts[source] = source_counts.get(source, 0) + 1
            chat_identifier_counts[chat_identifier] = chat_identifier_counts.get(chat_identifier, 0) + 1
        
        print(f"📊 Total potential messages: {len(all_messages)}")
        
        print(f"\n📅 Messages by Year:")
        for year in sorted(year_counts.keys()):
            david_count = year_counts[year]['David']
            other_count = year_counts[year]['Other']
            total = david_count + other_count
            print(f"  {year}: {total} total ({david_count} from David, {other_count} from others)")
        
        print(f"\n📂 Messages by Source:")
        for source, count in source_counts.items():
            print(f"  {source}: {count} messages")
        
        print(f"\n💬 Top Chat Identifiers:")
        sorted_chats = sorted(chat_identifier_counts.items(), key=lambda x: x[1], reverse=True)
        for chat_id, count in sorted_chats[:10]:
            print(f"  {chat_id}: {count} messages")
        
        # Save results
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_file = f"comprehensive_contact_search_{timestamp}.json"
        
        with open(output_file, 'w') as f:
            json.dump(all_messages, f, indent=2)
        
        print(f"\n💾 Saved {len(all_messages)} messages to: {output_file}")
        
    else:
        print("❌ No messages found in any database")

if __name__ == "__main__":
    main() 