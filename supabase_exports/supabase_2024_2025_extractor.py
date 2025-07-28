#!/usr/bin/env python3
"""
Supabase 2024-2025 Message Extractor
Extracts ONLY messages from 2024-2025 between David and Nitzan
and formats them exactly according to the Supabase table schema.
"""

import sqlite3
import os
import json
import csv
from datetime import datetime
from pathlib import Path


class Supabase2024_2025Extractor:
    def __init__(self):
        self.mac_db_path = os.path.expanduser("~/Library/Messages/chat.db")
        
    def extract_2024_2025_messages(self, output_file=None):
        """Extract ONLY 2024-2025 messages formatted for Supabase."""
        print("🔍 Extracting 2024-2025 messages for Supabase...")
        
        try:
            conn = sqlite3.connect(self.mac_db_path)
            cursor = conn.cursor()
            
            # Find direct chats with Nitzan
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
               AND c.chat_identifier NOT LIKE 'chat%'
               AND (c.display_name IS NULL OR c.display_name = '')
            GROUP BY c.ROWID, c.guid, c.chat_identifier, c.display_name, c.is_archived
            ORDER BY message_count DESC
            """
            
            cursor.execute(query)
            direct_chats = cursor.fetchall()
            
            print(f"✅ Found {len(direct_chats)} direct Nitzan chats:")
            for chat in direct_chats:
                chat_id, guid, chat_identifier, display_name, is_archived, total, from_david, from_nitzan = chat
                status = "ARCHIVED" if is_archived else "ACTIVE"
                print(f"  📁 {chat_identifier}: {total} messages [{status}]")
                print(f"    📤 From David: {from_david}, 📥 From Nitzan: {from_nitzan}")
            
            # Extract messages from each chat, filtering for 2024-2025 only
            all_messages = []
            
            for chat in direct_chats:
                chat_id, guid, chat_identifier, display_name, is_archived, total, from_david, from_nitzan = chat
                
                # Get messages from this specific chat, filtered for 2024-2025
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
                AND m.date BETWEEN ? AND ?
                ORDER BY m.date ASC
                """
                
                # Convert 2024-01-01 and 2025-12-31 to Apple timestamps
                start_date = int(datetime(2024, 1, 1).timestamp() * 1000000000 + 978307200000000000)
                end_date = int(datetime(2025, 12, 31).timestamp() * 1000000000 + 978307200000000000)
                
                cursor.execute(query, (chat_id, start_date, end_date))
                chat_messages = cursor.fetchall()
                
                print(f"  📥 {chat_identifier}: {len(chat_messages)} messages from 2024-2025")
                
                # Convert to Supabase format
                for msg in chat_messages:
                    # Format exactly according to Supabase schema
                    message_data = {
                        'message_id': msg[0],  # bigint not null
                        'guid': msg[1],  # text null
                        'text': msg[2] if msg[2] else '[Media Message]',  # text null
                        'date': msg[9],  # timestamp with time zone null
                        'date_read': msg[4],  # text null
                        'is_from_me': str(msg[5]),  # text null (converted to string)
                        'sender': 'David' if msg[5] else 'Nitzan',  # text null
                        'recipient': 'Nitzan' if msg[5] else 'David',  # text null
                        'emojis': None,  # text null
                        'links': None,  # text null
                        'service': msg[8],  # text null
                        'account': msg[7] if msg[7] else ('david@steuer.com' if msg[5] else None),  # text null
                        'contact_id': msg[7] if msg[7] else ('david@steuer.com' if msg[5] else None),  # text null
                        'readable_date': msg[9],  # timestamp with time zone null
                        'apple_date': msg[3],  # bigint null
                        'apple_date_read': msg[4]  # text null
                    }
                    
                    all_messages.append(message_data)
            
            print(f"\n📊 Total 2024-2025 messages: {len(all_messages)}")
            
            # Analyze by year
            print("\n📅 2024-2025 breakdown:")
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
                            'source': 'Supabase_2024_2025_Extraction',
                            'extraction_date': datetime.now().isoformat(),
                            'total_messages': len(all_messages),
                            'yearly_breakdown': years,
                            'supabase_schema_compliant': True
                        },
                        'messages': all_messages
                    }, f, indent=2, ensure_ascii=False)
                
                # Create CSV for Supabase import
                csv_file = output_file.replace('.json', '.csv')
                with open(csv_file, 'w', newline='', encoding='utf-8') as f:
                    writer = csv.writer(f)
                    # Headers matching Supabase schema exactly
                    writer.writerow([
                        'message_id', 'guid', 'text', 'date', 'date_read', 'is_from_me',
                        'sender', 'recipient', 'emojis', 'links', 'service', 'account',
                        'contact_id', 'readable_date', 'apple_date', 'apple_date_read'
                    ])
                    
                    for msg in all_messages:
                        writer.writerow([
                            msg['message_id'], msg['guid'], msg['text'], msg['date'],
                            msg['date_read'], msg['is_from_me'], msg['sender'], msg['recipient'],
                            msg['emojis'], msg['links'], msg['service'], msg['account'],
                            msg['contact_id'], msg['readable_date'], msg['apple_date'], 
                            msg['apple_date_read']
                        ])
                
                print(f"\n💾 Saved to: {output_file}")
                print(f"📊 CSV for Supabase import: {csv_file}")
                
                return all_messages
            
            conn.close()
            
        except Exception as e:
            print(f"❌ Error extracting messages: {e}")
            return None


def main():
    try:
        extractor = Supabase2024_2025Extractor()
        
        # Generate output filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_file = f"supabase_2024_2025_messages_{timestamp}.json"
        
        extractor.extract_2024_2025_messages(output_file)
        
    except Exception as e:
        print(f"❌ Error: {e}")


if __name__ == "__main__":
    main() 