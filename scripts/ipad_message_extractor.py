#!/usr/bin/env python3
"""
iPad Message Extractor
Helps extract messages from Nitzan's iPad to find missing 2017-2018 messages.
"""

import sqlite3
import os
import json
import csv
from datetime import datetime
from pathlib import Path


class IPadMessageExtractor:
    def __init__(self):
        self.possible_paths = self._get_possible_ipad_paths()
        
    def _get_possible_ipad_paths(self):
        """Get possible paths where iPad backup might be located."""
        paths = []
        
        # Check common backup locations
        home = os.path.expanduser("~")
        
        # iTunes/Finder backups
        itunes_backup = os.path.join(home, "Library", "Application Support", "MobileSync", "Backup")
        if os.path.exists(itunes_backup):
            paths.append(itunes_backup)
        
        # iCloud backups (if any)
        icloud_backup = os.path.join(home, "Library", "Mobile Documents", "com~apple~CloudDocs")
        if os.path.exists(icloud_backup):
            paths.append(icloud_backup)
        
        # Check for any .db files that might be iPad Messages
        for root, dirs, files in os.walk(home):
            for file in files:
                if file == "chat.db" and "iPad" in root:
                    paths.append(root)
                elif file == "chat.db" and "Messages" in root:
                    paths.append(root)
        
        return paths
    
    def find_ipad_backups(self):
        """Find all iPad backups on the system."""
        print("🔍 Searching for iPad backups...")
        
        all_backups = []
        
        for base_path in self.possible_paths:
            if os.path.exists(base_path):
                print(f"📁 Checking: {base_path}")
                
                if os.path.isdir(base_path):
                    # Look for backup directories
                    for item in os.listdir(base_path):
                        item_path = os.path.join(base_path, item)
                        if os.path.isdir(item_path):
                            # Check if this looks like a backup directory
                            if len(item) > 20 and not item.startswith('.'):  # Typical backup ID format
                                all_backups.append(item_path)
                                print(f"  📱 Found potential backup: {item}")
                
                # Also check for direct chat.db files
                chat_db_path = os.path.join(base_path, "chat.db")
                if os.path.exists(chat_db_path):
                    all_backups.append(chat_db_path)
                    print(f"  📱 Found direct chat.db: {chat_db_path}")
        
        return all_backups
    
    def check_backup_for_messages(self, backup_path):
        """Check if a backup contains Messages database."""
        print(f"\n🔍 Checking backup: {backup_path}")
        
        # Look for Messages database in typical locations
        possible_messages_paths = [
            os.path.join(backup_path, "3d", "3d0d7e5fb2ce288813306e4d4636395e047a3d28"),  # Messages database
            os.path.join(backup_path, "chat.db"),  # Direct chat.db
            os.path.join(backup_path, "Messages", "chat.db"),  # Messages folder
        ]
        
        for path in possible_messages_paths:
            if os.path.exists(path):
                print(f"✅ Found Messages database: {path}")
                return path
        
        # If not found in typical locations, search recursively
        print("🔍 Searching recursively for Messages database...")
        for root, dirs, files in os.walk(backup_path):
            for file in files:
                if file == "chat.db":
                    full_path = os.path.join(root, file)
                    print(f"✅ Found Messages database: {full_path}")
                    return full_path
        
        print("❌ No Messages database found in this backup")
        return None
    
    def extract_nitzan_messages_from_ipad(self, messages_path):
        """Extract Nitzan messages from iPad Messages database."""
        print(f"\n📥 Extracting messages from: {messages_path}")
        
        try:
            conn = sqlite3.connect(messages_path)
            cursor = conn.cursor()
            
            # First, let's see what tables are available
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
            tables = cursor.fetchall()
            print(f"📋 Tables found: {[table[0] for table in tables]}")
            
            # Look for messages table
            messages_table = None
            for table in tables:
                if 'message' in table[0].lower():
                    messages_table = table[0]
                    break
            
            if not messages_table:
                print("❌ No messages table found")
                return None
            
            print(f"✅ Using messages table: {messages_table}")
            
            # Check table structure
            cursor.execute(f"PRAGMA table_info({messages_table})")
            columns = cursor.fetchall()
            print(f"📊 Table columns: {[col[1] for col in columns]}")
            
            # Look for handle table
            handle_table = None
            for table in tables:
                if 'handle' in table[0].lower():
                    handle_table = table[0]
                    break
            
            if not handle_table:
                print("❌ No handle table found")
                return None
            
            print(f"✅ Using handle table: {handle_table}")
            
            # Search for Nitzan contacts
            cursor.execute(f"""
                SELECT h.id, h.service, COUNT(m.ROWID) as message_count,
                       MIN(datetime(m.date/1000000000 + strftime('%s', '2001-01-01'), 'unixepoch', 'localtime')) as first_message,
                       MAX(datetime(m.date/1000000000 + strftime('%s', '2001-01-01'), 'unixepoch', 'localtime')) as last_message
                FROM {handle_table} h
                JOIN {messages_table} m ON h.ROWID = m.handle_id
                WHERE h.id LIKE '%nitzan%' 
                   OR h.id LIKE '%pelman%'
                   OR h.id LIKE '%917%239%0518%'
                   OR h.id LIKE '%david%'
                   OR h.id LIKE '%steuer%'
                GROUP BY h.id, h.service
                ORDER BY message_count DESC
            """)
            
            contacts = cursor.fetchall()
            print(f"\n✅ Found {len(contacts)} relevant contacts:")
            
            for contact in contacts:
                contact_id, service, count, first_msg, last_msg = contact
                print(f"  📧 {contact_id} ({service}): {count} messages")
                print(f"    📅 Range: {first_msg} to {last_msg}")
            
            # Extract messages from each contact
            all_messages = []
            
            for contact in contacts:
                contact_id, service, count, first_msg, last_msg = contact
                
                print(f"\n📥 Extracting from {contact_id} ({count} messages)")
                
                # Get messages from this contact
                cursor.execute(f"""
                    SELECT 
                        m.ROWID,
                        m.guid,
                        m.text,
                        m.date,
                        m.date_read,
                        m.is_from_me,
                        h.id as contact_id,
                        h.service,
                        datetime(m.date/1000000000 + strftime('%s', '2001-01-01'), 'unixepoch', 'localtime') as readable_date
                    FROM {messages_table} m
                    JOIN {handle_table} h ON m.handle_id = h.ROWID
                    WHERE h.id = ?
                    ORDER BY m.date ASC
                """, (contact_id,))
                
                contact_messages = cursor.fetchall()
                
                for msg in contact_messages:
                    message_data = {
                        'message_id': msg[0],
                        'guid': msg[1],
                        'text': msg[2] if msg[2] else '[Media Message]',
                        'date': msg[8],  # readable_date
                        'date_read': msg[4],
                        'is_from_me': str(msg[5]),
                        'sender': 'David' if msg[5] else 'Nitzan',
                        'recipient': 'Nitzan' if msg[5] else 'David',
                        'emojis': None,
                        'links': None,
                        'service': msg[7],
                        'account': msg[6],
                        'contact_id': msg[6],
                        'readable_date': msg[8],
                        'apple_date': msg[3],
                        'apple_date_read': msg[4],
                        'source': 'iPad_Backup',
                        'contact_identifier': contact_id
                    }
                    
                    all_messages.append(message_data)
            
            print(f"\n📊 Total messages extracted: {len(all_messages)}")
            
            # Analyze by year
            print("\n📅 Message distribution by year:")
            years = {}
            for msg in all_messages:
                if msg['readable_date']:
                    try:
                        year = int(msg['readable_date'][:4])
                        if year not in years:
                            years[year] = {'total': 0, 'from_david': 0, 'from_nitzan': 0}
                        years[year]['total'] += 1
                        if msg['is_from_me'] == '1':
                            years[year]['from_david'] += 1
                        else:
                            years[year]['from_nitzan'] += 1
                    except:
                        continue
            
            for year in sorted(years.keys()):
                data = years[year]
                print(f"  {year}: {data['total']} total ({data['from_david']} from David, {data['from_nitzan']} from Nitzan)")
            
            conn.close()
            return all_messages
            
        except Exception as e:
            print(f"❌ Error extracting messages: {e}")
            return None
    
    def comprehensive_ipad_search(self):
        """Run comprehensive search for iPad messages."""
        print("🔍 COMPREHENSIVE IPAD MESSAGE SEARCH")
        print("=" * 50)
        
        # Find all iPad backups
        backups = self.find_ipad_backups()
        
        if not backups:
            print("❌ No iPad backups found")
            print("\n💡 To find iPad backups:")
            print("1. Connect the iPad to this Mac")
            print("2. Open Finder and look for the iPad")
            print("3. Check if there are any backups in iTunes/Finder")
            print("4. Look for any .db files that might be Messages databases")
            return None
        
        print(f"\n✅ Found {len(backups)} potential iPad backups")
        
        # Check each backup for messages
        all_extracted_messages = []
        
        for backup in backups:
            messages_path = self.check_backup_for_messages(backup)
            if messages_path:
                messages = self.extract_nitzan_messages_from_ipad(messages_path)
                if messages:
                    all_extracted_messages.extend(messages)
        
        if all_extracted_messages:
            # Save to file
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            output_file = f"ipad_nitzan_messages_{timestamp}.json"
            
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump({
                    'metadata': {
                        'source': 'iPad_Backup_Search',
                        'extraction_date': datetime.now().isoformat(),
                        'total_messages': len(all_extracted_messages),
                        'backups_searched': len(backups)
                    },
                    'messages': all_extracted_messages
                }, f, indent=2, ensure_ascii=False)
            
            # Also create CSV
            csv_file = output_file.replace('.json', '.csv')
            with open(csv_file, 'w', newline='', encoding='utf-8') as f:
                writer = csv.writer(f)
                writer.writerow([
                    'message_id', 'guid', 'text', 'date', 'date_read', 'is_from_me',
                    'sender', 'recipient', 'emojis', 'links', 'service', 'account',
                    'contact_id', 'readable_date', 'apple_date', 'apple_date_read', 'source', 'contact_identifier'
                ])
                
                for msg in all_extracted_messages:
                    writer.writerow([
                        msg['message_id'], msg['guid'], msg['text'], msg['date'],
                        msg['date_read'], msg['is_from_me'], msg['sender'], msg['recipient'],
                        msg['emojis'], msg['links'], msg['service'], msg['account'],
                        msg['contact_id'], msg['readable_date'], msg['apple_date'], 
                        msg['apple_date_read'], msg['source'], msg['contact_identifier']
                    ])
            
            print(f"\n💾 Saved to: {output_file}")
            print(f"📊 CSV saved to: {csv_file}")
            
            return all_extracted_messages
        else:
            print("\n❌ No messages found in iPad backups")
            return None


def main():
    try:
        extractor = IPadMessageExtractor()
        extractor.comprehensive_ipad_search()
        
    except Exception as e:
        print(f"❌ Error: {e}")


if __name__ == "__main__":
    main() 