#!/usr/bin/env python3
"""
Final Nitzan Message Extractor
Extracts ALL messages between David and Nitzan by looking at chat context,
ensuring we capture the complete conversation from all sources.
"""

import sqlite3
import json
import os
import sys
from datetime import datetime
from pathlib import Path


class FinalNitzanExtractor:
    def __init__(self):
        self.messages_db_path = self._get_messages_db_path()
        
    def _get_messages_db_path(self):
        """Get the path to the Messages database on Mac."""
        home = os.path.expanduser("~")
        db_path = os.path.join(home, "Library", "Messages", "chat.db")
        
        if not os.path.exists(db_path):
            raise FileNotFoundError(
                f"Messages database not found at {db_path}. "
                "Make sure you're running this on a Mac and have Messages enabled."
            )
        return db_path
    
    def find_nitzan_chats(self):
        """Find all chats involving Nitzan."""
        try:
            conn = sqlite3.connect(self.messages_db_path)
            cursor = conn.cursor()
            
            # Find all chats that involve Nitzan
            query = """
            SELECT DISTINCT 
                c.ROWID as chat_id,
                c.guid,
                c.chat_identifier,
                c.display_name,
                c.is_archived,
                COUNT(m.ROWID) as message_count,
                SUM(CASE WHEN m.is_from_me = 1 THEN 1 ELSE 0 END) as messages_from_david,
                SUM(CASE WHEN m.is_from_me = 0 THEN 1 ELSE 0 END) as messages_to_david
            FROM chat c
            JOIN chat_message_join cmj ON c.ROWID = cmj.chat_id
            JOIN message m ON cmj.message_id = m.ROWID
            WHERE c.chat_identifier LIKE '%nitzan%' 
               OR c.chat_identifier LIKE '%pelman%'
               OR c.chat_identifier LIKE '%917%239%0518%'
               OR c.chat_identifier = '+19172390518'
               OR c.display_name LIKE '%nitzan%'
               OR c.display_name LIKE '%Nitzan%'
            GROUP BY c.ROWID, c.guid, c.chat_identifier, c.display_name, c.is_archived
            ORDER BY message_count DESC
            """
            
            cursor.execute(query)
            chats = cursor.fetchall()
            conn.close()
            
            return chats
            
        except sqlite3.Error as e:
            print(f"Database error: {e}")
            return []
    
    def extract_messages_from_chat(self, chat_id, chat_info):
        """Extract messages from a specific chat."""
        try:
            conn = sqlite3.connect(self.messages_db_path)
            cursor = conn.cursor()
            
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
            messages = cursor.fetchall()
            conn.close()
            
            extracted_messages = []
            for message in messages:
                message_data = {
                    'message_id': message[0],
                    'guid': message[1],
                    'text': message[2] or '',
                    'date': message[3],
                    'date_read': message[4],
                    'is_from_me': bool(message[5]),
                    'has_attachments': bool(message[6]),
                    'contact_id': message[7],
                    'service': message[8],
                    'readable_date': message[9],
                    'chat_id': chat_id,
                    'chat_identifier': chat_info[2],
                    'chat_display_name': chat_info[3]
                }
                extracted_messages.append(message_data)
            
            return extracted_messages
            
        except sqlite3.Error as e:
            print(f"Error extracting from chat {chat_id}: {e}")
            return []
    
    def extract_all_nitzan_messages(self, output_file=None):
        """Extract ALL messages between David and Nitzan from all chats."""
        print("🔍 Finding all Nitzan chats...")
        
        chats = self.find_nitzan_chats()
        
        if not chats:
            print("❌ No chats found involving Nitzan")
            return None
        
        print(f"\n📋 Found {len(chats)} chats involving Nitzan:")
        print("-" * 80)
        print("Chat ID | Messages | From David | To David | Chat Identifier | Display Name")
        print("-" * 80)
        
        for chat in chats:
            chat_id, guid, identifier, display_name, archived, total, from_david, to_david = chat
            print(f"{chat_id:7d} | {total:8d} | {from_david:10d} | {to_david:8d} | {identifier:20s} | {display_name or 'None'}")
        
        print("\n📥 Extracting messages from each chat...")
        
        all_messages = []
        chat_summaries = []
        
        for chat in chats:
            chat_id, guid, identifier, display_name, archived, total, from_david, to_david = chat
            
            print(f"\nExtracting from chat {chat_id} ({identifier}): {total} messages")
            messages = self.extract_messages_from_chat(chat_id, chat)
            
            if messages:
                all_messages.extend(messages)
                
                # Calculate actual stats for this chat
                actual_from_david = sum(1 for msg in messages if msg['is_from_me'])
                actual_to_david = sum(1 for msg in messages if not msg['is_from_me'])
                
                chat_summary = {
                    'chat_id': chat_id,
                    'chat_identifier': identifier,
                    'display_name': display_name,
                    'total_messages': len(messages),
                    'messages_from_david': actual_from_david,
                    'messages_to_david': actual_to_david,
                    'date_range': {
                        'start': min(msg['readable_date'] for msg in messages) if messages else None,
                        'end': max(msg['readable_date'] for msg in messages) if messages else None
                    }
                }
                chat_summaries.append(chat_summary)
                
                print(f"  ✅ Extracted {len(messages)} messages")
                print(f"  📤 From David: {actual_from_david}")
                print(f"  📥 To David: {actual_to_david}")
                print(f"  📅 Date range: {chat_summary['date_range']['start']} to {chat_summary['date_range']['end']}")
        
        if not all_messages:
            print("❌ No messages found in any chat")
            return None
        
        # Remove duplicates based on message_id
        unique_messages = {}
        for msg in all_messages:
            unique_messages[msg['message_id']] = msg
        
        all_messages = list(unique_messages.values())
        
        # Sort messages chronologically
        all_messages.sort(key=lambda x: x['date'])
        
        # Calculate overall statistics
        total_messages = len(all_messages)
        total_from_david = sum(1 for msg in all_messages if msg['is_from_me'])
        total_to_david = total_messages - total_from_david
        
        # Create the final data structure
        export_data = {
            'metadata': {
                'extraction_date': datetime.now().isoformat(),
                'total_messages': total_messages,
                'messages_from_david': total_from_david,
                'messages_to_david': total_to_david,
                'chats_analyzed': len(chat_summaries),
                'duplicates_removed': len(unique_messages) - len(all_messages),
                'date_range': {
                    'start': min(msg['readable_date'] for msg in all_messages) if all_messages else None,
                    'end': max(msg['readable_date'] for msg in all_messages) if all_messages else None
                }
            },
            'chat_summaries': chat_summaries,
            'messages': all_messages
        }
        
        # Display final summary
        print(f"\n🎉 FINAL EXTRACTION COMPLETE")
        print("=" * 60)
        print(f"Total messages: {total_messages}")
        print(f"From David: {total_from_david}")
        print(f"To David: {total_to_david}")
        print(f"Chats analyzed: {len(chat_summaries)}")
        print(f"Duplicates removed: {export_data['metadata']['duplicates_removed']}")
        print(f"Date range: {export_data['metadata']['date_range']['start']} to {export_data['metadata']['date_range']['end']}")
        
        # Save to file if requested
        if output_file:
            try:
                with open(output_file, 'w', encoding='utf-8') as f:
                    json.dump(export_data, f, indent=2, ensure_ascii=False)
                print(f"\n💾 Messages saved to: {output_file}")
                
                # Also create CSV for easy analysis
                csv_file = output_file.replace('.json', '.csv')
                self._create_csv_export(all_messages, csv_file)
                print(f"📊 CSV export created: {csv_file}")
                
            except Exception as e:
                print(f"❌ Error saving to file: {e}")
        
        return export_data
    
    def _create_csv_export(self, messages, csv_file):
        """Create a CSV export of the messages."""
        import csv
        
        with open(csv_file, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            
            # Write header
            writer.writerow([
                'message_id', 'guid', 'text', 'date', 'date_read', 'is_from_me',
                'has_attachments', 'contact_id', 'service', 'readable_date',
                'chat_id', 'chat_identifier', 'chat_display_name'
            ])
            
            # Write messages
            for msg in messages:
                writer.writerow([
                    msg['message_id'], msg['guid'], msg['text'], msg['date'],
                    msg['date_read'], msg['is_from_me'], msg['has_attachments'],
                    msg['contact_id'], msg['service'], msg['readable_date'],
                    msg['chat_id'], msg['chat_identifier'], msg['chat_display_name']
                ])


def main():
    try:
        extractor = FinalNitzanExtractor()
        
        # Generate output filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_file = f"final_nitzan_messages_{timestamp}.json"
        
        extractor.extract_all_nitzan_messages(output_file)
            
    except FileNotFoundError as e:
        print(f"❌ Error: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main() 