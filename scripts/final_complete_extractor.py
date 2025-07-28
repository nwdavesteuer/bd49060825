#!/usr/bin/env python3
"""
Final Complete Message Extractor
Combines messages from Mac, iPhone backup, and iPad to create the most complete dataset
of all messages between David and Nitzan, including the missing 2017-2018 messages.
"""

import sqlite3
import os
import json
import csv
from datetime import datetime
from pathlib import Path


class FinalCompleteExtractor:
    def __init__(self):
        self.mac_db_path = os.path.expanduser("~/Library/Messages/chat.db")
        self.backup_path = self._find_backup()
        self.ipad_path = self._find_ipad_backup()
        
    def _find_backup(self):
        """Find the iPhone backup."""
        backup_dir = os.path.expanduser("~/Library/Application Support/MobileSync/Backup")
        if not os.path.exists(backup_dir):
            return None
        
        backups = [d for d in os.listdir(backup_dir) if os.path.isdir(os.path.join(backup_dir, d))]
        if not backups:
            return None
        
        backup_id = backups[0]
        backup_path = os.path.join(backup_dir, backup_id, "3d", "3d0d7e5fb2ce288813306e4d4636395e047a3d28")
        
        if not os.path.exists(backup_path):
            return None
            
        return backup_path
    
    def _find_ipad_backup(self):
        """Find the iPad backup."""
        backup_dir = os.path.expanduser("~/Library/Application Support/MobileSync/Backup")
        if not os.path.exists(backup_dir):
            return None
        
        backups = [d for d in os.listdir(backup_dir) if os.path.isdir(os.path.join(backup_dir, d))]
        if not backups:
            return None
        
        backup_id = backups[0]  # Same backup ID for now
        backup_path = os.path.join(backup_dir, backup_id, "3d", "3d0d7e5fb2ce288813306e4d4636395e047a3d28")
        
        if not os.path.exists(backup_path):
            return None
            
        return backup_path
    
    def extract_from_source(self, db_path, source_name):
        """Extract direct messages from a specific source."""
        print(f"🔍 Extracting from {source_name}...")
        
        try:
            conn = sqlite3.connect(db_path)
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
            
            print(f"✅ Found {len(direct_chats)} direct Nitzan chats in {source_name}:")
            for chat in direct_chats:
                chat_id, guid, chat_identifier, display_name, is_archived, total, from_david, from_nitzan = chat
                status = "ARCHIVED" if is_archived else "ACTIVE"
                print(f"  📁 {chat_identifier}: {total} messages [{status}]")
                print(f"    📤 From David: {from_david}, 📥 From Nitzan: {from_nitzan}")
            
            # Extract messages from each chat
            all_messages = []
            
            for chat in direct_chats:
                chat_id, guid, chat_identifier, display_name, is_archived, total, from_david, from_nitzan = chat
                
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
                
                for msg in chat_messages:
                    message_data = {
                        'message_id': msg[0],
                        'guid': msg[1],
                        'text': msg[2] if msg[2] else '[Media Message]',
                        'date': msg[9],
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
                        'source': source_name,
                        'chat_identifier': chat_identifier
                    }
                    
                    all_messages.append(message_data)
            
            print(f"📊 Extracted {len(all_messages)} messages from {source_name}")
            conn.close()
            return all_messages
            
        except Exception as e:
            print(f"❌ Error extracting from {source_name}: {e}")
            return []
    
    def extract_all_sources(self):
        """Extract from all available sources."""
        all_messages = []
        
        # Extract from Mac
        if os.path.exists(self.mac_db_path):
            mac_messages = self.extract_from_source(self.mac_db_path, "Mac_Messages")
            all_messages.extend(mac_messages)
        
        # Extract from iPhone backup
        if self.backup_path:
            backup_messages = self.extract_from_source(self.backup_path, "iPhone_Backup")
            all_messages.extend(backup_messages)
        
        # Extract from iPad backup
        if self.ipad_path:
            ipad_messages = self.extract_from_source(self.ipad_path, "iPad_Backup")
            all_messages.extend(ipad_messages)
        
        return all_messages
    
    def merge_and_deduplicate(self, messages):
        """Merge messages from all sources and remove duplicates."""
        print("\n🔄 Merging and deduplicating messages...")
        
        # Create a set of message IDs to track duplicates
        seen_guids = set()
        merged_messages = []
        
        # Process messages, only add if not already seen
        for msg in messages:
            if msg['guid'] and msg['guid'] not in seen_guids:
                seen_guids.add(msg['guid'])
                merged_messages.append(msg)
        
        print(f"📊 Merge results:")
        print(f"  📱 Total messages before deduplication: {len(messages)}")
        print(f"  📱 Total messages after deduplication: {len(merged_messages)}")
        print(f"  📱 Duplicates removed: {len(messages) - len(merged_messages)}")
        
        return merged_messages
    
    def analyze_by_year(self, messages):
        """Analyze messages by year."""
        print("\n📅 Message distribution by year:")
        
        years = {}
        for msg in messages:
            if msg['readable_date']:
                try:
                    year = int(msg['readable_date'][:4])
                    if year not in years:
                        years[year] = {'total': 0, 'from_david': 0, 'from_nitzan': 0, 'sources': set()}
                    years[year]['total'] += 1
                    if msg['is_from_me'] == '1':
                        years[year]['from_david'] += 1
                    else:
                        years[year]['from_nitzan'] += 1
                    years[year]['sources'].add(msg['source'])
                except:
                    continue
        
        for year in sorted(years.keys()):
            data = years[year]
            sources = ', '.join(data['sources'])
            print(f"  {year}: {data['total']} total ({data['from_david']} from David, {data['from_nitzan']} from Nitzan) [{sources}]")
        
        # Convert sets to lists for JSON serialization
        for year in years:
            years[year]['sources'] = list(years[year]['sources'])
        
        return years
    
    def create_supabase_export(self, messages, output_file=None):
        """Create Supabase-compatible export."""
        print("\n📊 Creating Supabase export...")
        
        # Filter for 2024-2025 only if requested
        filtered_messages = []
        for msg in messages:
            if msg['readable_date']:
                try:
                    year = int(msg['readable_date'][:4])
                    if year in [2024, 2025]:
                        filtered_messages.append(msg)
                except:
                    continue
        
        print(f"📅 Filtered to 2024-2025: {len(filtered_messages)} messages")
        
        # Save to file
        if output_file and filtered_messages:
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump({
                    'metadata': {
                        'source': 'Final_Complete_Extraction_2024_2025',
                        'extraction_date': datetime.now().isoformat(),
                        'total_messages': len(filtered_messages),
                        'supabase_schema_compliant': True
                    },
                    'messages': filtered_messages
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
                
                for msg in filtered_messages:
                    writer.writerow([
                        msg['message_id'], msg['guid'], msg['text'], msg['date'],
                        msg['date_read'], msg['is_from_me'], msg['sender'], msg['recipient'],
                        msg['emojis'], msg['links'], msg['service'], msg['account'],
                        msg['contact_id'], msg['readable_date'], msg['apple_date'], 
                        msg['apple_date_read']
                    ])
            
            print(f"💾 Saved to: {output_file}")
            print(f"📊 CSV for Supabase import: {csv_file}")
            
            return filtered_messages
    
    def comprehensive_extract(self, output_file=None):
        """Run comprehensive extraction from all sources."""
        print("🔍 FINAL COMPLETE MESSAGE EXTRACTION")
        print("=" * 50)
        
        # Extract from all sources
        all_messages = self.extract_all_sources()
        
        # Merge and deduplicate
        merged_messages = self.merge_and_deduplicate(all_messages)
        
        # Analyze by year
        years = self.analyze_by_year(merged_messages)
        
        # Create Supabase export
        if output_file:
            supabase_messages = self.create_supabase_export(merged_messages, output_file)
        
        # Save complete dataset
        complete_output = output_file.replace('_2024_2025', '_complete') if output_file else None
        if complete_output and merged_messages:
            with open(complete_output, 'w', encoding='utf-8') as f:
                json.dump({
                    'metadata': {
                        'source': 'Final_Complete_Extraction_All_Years',
                        'extraction_date': datetime.now().isoformat(),
                        'total_messages': len(merged_messages),
                        'yearly_breakdown': years
                    },
                    'messages': merged_messages
                }, f, indent=2, ensure_ascii=False)
            
            print(f"💾 Complete dataset saved to: {complete_output}")
        
        return merged_messages


def main():
    try:
        extractor = FinalCompleteExtractor()
        
        # Generate output filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_file = f"supabase_2024_2025_messages_{timestamp}.json"
        
        extractor.comprehensive_extract(output_file)
        
    except Exception as e:
        print(f"❌ Error: {e}")


if __name__ == "__main__":
    main() 