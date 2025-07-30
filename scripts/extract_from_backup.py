#!/usr/bin/env python3
"""
Extract Messages from iPhone Backup
Extracts ONLY direct messages between David and Nitzan from the iPhone backup.
Excludes group chats to ensure we only get 1-on-1 conversations.
"""

import sqlite3
import os
import json
import csv
from datetime import datetime
from pathlib import Path


class BackupMessageExtractor:
    def __init__(self):
        self.backup_path = self._find_backup()
        
    def _find_backup(self):
        """Find the iPhone backup."""
        backup_dir = os.path.expanduser("~/Library/Application Support/MobileSync/Backup")
        if not os.path.exists(backup_dir):
            raise FileNotFoundError("Backup directory not found")
        
        backups = [d for d in os.listdir(backup_dir) if os.path.isdir(os.path.join(backup_dir, d))]
        if not backups:
            raise FileNotFoundError("No backups found")
        
        # Use the first backup found
        backup_id = backups[0]
        backup_path = os.path.join(backup_dir, backup_id)
        
        # Check for Messages database
        messages_path = os.path.join(backup_path, "3d", "3d0d7e5fb2ce288813306e4d4636395e047a3d28")
        if not os.path.exists(messages_path):
            raise FileNotFoundError(f"Messages database not found in backup: {messages_path}")
        
        print(f"✅ Found backup: {backup_id}")
        print(f"📁 Messages database: {messages_path}")
        
        return messages_path
    
    def find_direct_nitzan_chats(self):
        """Find only DIRECT chats with Nitzan (excludes group chats)."""
        print("🔍 Finding direct Nitzan chats in backup...")
        
        try:
            conn = sqlite3.connect(self.backup_path)
            cursor = conn.cursor()
            
            # Find direct chats with Nitzan (excludes group chats)
            query = """
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
            """
            
            cursor.execute(query)
            direct_chats = cursor.fetchall()
            
            print(f"✅ Found {len(direct_chats)} direct Nitzan chats in backup:")
            for chat in direct_chats:
                chat_id, guid, chat_identifier, display_name, is_archived, total, from_david, from_nitzan = chat
                status = "ARCHIVED" if is_archived else "ACTIVE"
                print(f"  📁 {chat_identifier} ({display_name or 'None'}): {total} messages [{status}]")
                print(f"    📤 From David: {from_david}, 📥 From Nitzan: {from_nitzan}")
            
            conn.close()
            return direct_chats
            
        except Exception as e:
            print(f"❌ Error finding direct chats: {e}")
            return []
    
    def extract_direct_nitzan_messages(self, output_file=None):
        """Extract ONLY direct messages between David and Nitzan from the backup."""
        print("🔍 Extracting direct Nitzan messages from iPhone backup...")
        
        try:
            conn = sqlite3.connect(self.backup_path)
            cursor = conn.cursor()
            
            # First find direct chats
            direct_chats = self.find_direct_nitzan_chats()
            
            if not direct_chats:
                print("❌ No direct Nitzan chats found in backup")
                return None
            
            # Extract messages from each direct chat
            all_messages = []
            
            for chat in direct_chats:
                chat_id, guid, chat_identifier, display_name, is_archived, total, from_david, from_nitzan = chat
                
                print(f"\n📥 Extracting from chat: {chat_identifier} ({total} messages)")
                
                # Get messages from this specific chat
                query = """
                SELECT 
                    m.ROWID,
                    m.guid,
                    m.text,
                    m.date,
                    m.date_read,
                    m.is_from_me,
                    m.cache_has_attachments,
                    h.id as contact_id,
                    h.service,
                    datetime(m.date/1000000000 + strftime('%s', '2001-01-01'), 'unixepoch', 'localtime') as readable_date
                FROM message m
                JOIN chat_message_join cmj ON m.ROWID = cmj.message_id
                LEFT JOIN handle h ON m.handle_id = h.ROWID
                WHERE cmj.chat_id = ?
                ORDER BY m.date ASC
                """
                
                cursor.execute(query, (chat_id,))
                chat_messages = cursor.fetchall()
                
                print(f"  ✅ Extracted {len(chat_messages)} messages from this chat")
                
                # Convert to our format
                for msg in chat_messages:
                    message_data = {
                        'message_id': msg[0],
                        'guid': msg[1],
                        'text': msg[2] if msg[2] else '[Media Message]',  # Handle empty text
                        'date': msg[9],  # readable_date
                        'date_read': msg[4],
                        'is_from_me': str(msg[5]),
                        'sender': 'David' if msg[5] else 'Nitzan',
                        'recipient': 'Nitzan' if msg[5] else 'David',
                        'emojis': None,
                        'links': None,
                        'service': msg[8],
                        'account': msg[7] if msg[7] else ('david@steuer.com' if msg[5] else None),
                        'contact_id': msg[7] if msg[7] else ('david@steuer.com' if msg[5] else None),
                        'readable_date': msg[9],
                        'apple_date': msg[3],
                        'apple_date_read': msg[4],
                        'source': 'iPhone_Backup',
                        'chat_identifier': chat_identifier
                    }
                    
                    all_messages.append(message_data)
            
            print(f"\n📊 Total direct messages extracted: {len(all_messages)}")
            
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
            
            # Save to file
            if output_file and all_messages:
                with open(output_file, 'w', encoding='utf-8') as f:
                    json.dump({
                        'metadata': {
                            'source': 'iPhone_Backup_Direct_Only',
                            'extraction_date': datetime.now().isoformat(),
                            'total_messages': len(all_messages),
                            'backup_path': self.backup_path,
                            'direct_chats_found': len(direct_chats),
                            'yearly_breakdown': years
                        },
                        'messages': all_messages
                    }, f, indent=2, ensure_ascii=False)
                
                # Also create CSV
                csv_file = output_file.replace('.json', '.csv')
                with open(csv_file, 'w', newline='', encoding='utf-8') as f:
                    writer = csv.writer(f)
                    writer.writerow([
                        'message_id', 'guid', 'text', 'date', 'date_read', 'is_from_me',
                        'sender', 'recipient', 'emojis', 'links', 'service', 'account',
                        'contact_id', 'readable_date', 'apple_date', 'apple_date_read', 'source', 'chat_identifier'
                    ])
                    
                    for msg in all_messages:
                        writer.writerow([
                            msg['message_id'], msg['guid'], msg['text'], msg['date'],
                            msg['date_read'], msg['is_from_me'], msg['sender'], msg['recipient'],
                            msg['emojis'], msg['links'], msg['service'], msg['account'],
                            msg['contact_id'], msg['readable_date'], msg['apple_date'], 
                            msg['apple_date_read'], msg['source'], msg['chat_identifier']
                        ])
                
                print(f"\n💾 Saved to: {output_file}")
                print(f"📊 CSV saved to: {csv_file}")
                
                return all_messages
            
            conn.close()
            
        except Exception as e:
            print(f"❌ Error extracting messages: {e}")
            return None


def main():
    try:
        extractor = BackupMessageExtractor()
        
        # Generate output filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_file = f"backup_direct_nitzan_messages_{timestamp}.json"
        
        extractor.extract_direct_nitzan_messages(output_file)
        
    except Exception as e:
        print(f"❌ Error: {e}")


if __name__ == "__main__":
    main() 