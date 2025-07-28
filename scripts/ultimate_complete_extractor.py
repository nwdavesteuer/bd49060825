#!/usr/bin/env python3
"""
Ultimate Complete Message Extractor - Combines all sources
"""

import sqlite3
import json
from datetime import datetime
import os

def extract_from_source(db_path, source_name):
    """Extract messages from a specific database source"""
    
    if not os.path.exists(db_path):
        print(f"❌ Database not found: {db_path}")
        return []
    
    print(f"🔍 Extracting from {source_name}...")
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Find Nitzan-related chats
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
        print(f"✅ Found {len(nitzan_chats)} direct Nitzan chats in {source_name}:")
        
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
                    'source': source_name
                }
                
                all_messages.append(message_data)
        
        print(f"📊 Extracted {len(all_messages)} messages from {source_name}")
        conn.close()
        return all_messages
        
    except Exception as e:
        print(f"❌ Error extracting from {source_name}: {e}")
        return []

def merge_and_deduplicate(all_sources_messages):
    """Merge messages from all sources and remove duplicates based on guid"""
    
    print("\n🔄 Merging and deduplicating messages...")
    
    # Create a dictionary to track unique messages by guid
    unique_messages = {}
    
    for source_name, messages in all_sources_messages.items():
        print(f"  📱 Processing {source_name}: {len(messages)} messages")
        for msg in messages:
            guid = msg.get('guid')
            if guid and guid not in unique_messages:
                unique_messages[guid] = msg
            elif guid:
                # If duplicate found, keep the one with more complete data
                existing = unique_messages[guid]
                if not existing.get('text') and msg.get('text'):
                    unique_messages[guid] = msg
    
    final_messages = list(unique_messages.values())
    
    print(f"📊 Merge results:")
    print(f"  📱 Total messages before deduplication: {sum(len(msgs) for msgs in all_sources_messages.values())}")
    print(f"  📱 Total messages after deduplication: {len(final_messages)}")
    print(f"  📱 Duplicates removed: {sum(len(msgs) for msgs in all_sources_messages.values()) - len(final_messages)}")
    
    return final_messages

def analyze_by_year(messages):
    """Analyze messages by year"""
    
    print("\n📅 Message distribution by year:")
    
    year_counts = {}
    sources_by_year = {}
    
    for msg in messages:
        if msg['readable_date']:
            try:
                year = datetime.fromisoformat(msg['readable_date'].replace('Z', '+00:00')).year
                if year not in year_counts:
                    year_counts[year] = {'total': 0, 'from_david': 0, 'from_nitzan': 0}
                    sources_by_year[year] = set()
                
                year_counts[year]['total'] += 1
                if msg['is_from_me'] == "1":
                    year_counts[year]['from_david'] += 1
                else:
                    year_counts[year]['from_nitzan'] += 1
                
                sources_by_year[year].add(msg['source'])
            except:
                pass
    
    for year in sorted(year_counts.keys()):
        counts = year_counts[year]
        sources = list(sources_by_year[year])
        print(f"  {year}: {counts['total']} total ({counts['from_david']} from David, {counts['from_nitzan']} from Nitzan) {sources}")

def create_supabase_export(messages, start_year=2024, end_year=2025):
    """Create Supabase-compliant export for specific years"""
    
    print(f"\n📊 Creating Supabase export for {start_year}-{end_year}...")
    
    filtered_messages = []
    for msg in messages:
        if msg['readable_date']:
            try:
                year = datetime.fromisoformat(msg['readable_date'].replace('Z', '+00:00')).year
                if start_year <= year <= end_year:
                    filtered_messages.append(msg)
            except:
                pass
    
    print(f"📅 Filtered to {start_year}-{end_year}: {len(filtered_messages)} messages")
    
    # Save JSON
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    json_file = f"ultimate_supabase_{start_year}_{end_year}_messages_{timestamp}.json"
    
    with open(json_file, 'w') as f:
        json.dump(filtered_messages, f, indent=2)
    
    # Save CSV
    csv_file = f"ultimate_supabase_{start_year}_{end_year}_messages_{timestamp}.csv"
    with open(csv_file, 'w', newline='') as f:
        if filtered_messages:
            writer = csv.DictWriter(f, fieldnames=filtered_messages[0].keys())
            writer.writeheader()
            writer.writerows(filtered_messages)
    
    print(f"💾 Saved to: {json_file}")
    print(f"📊 CSV for Supabase import: {csv_file}")
    
    return filtered_messages

def ultimate_extract():
    """Main extraction function"""
    
    print("🔍 ULTIMATE COMPLETE MESSAGE EXTRACTION")
    print("=" * 50)
    
    # Define all sources
    sources = {
        'Mac_Messages': '~/Library/Messages/chat.db',
        'iPhone_Backup': '~/Library/Application Support/MobileSync/Backup/*/3d/3d0d7e5fb2ce288813306e4d4636395e047a3d28',
        'TimeMachine_Backup': '/Volumes/Extreme SSD/2024-09-05-112619.previous/Data/Users/dsteuer/Library/Messages/chat.db'
    }
    
    all_sources_messages = {}
    
    # Extract from each source
    for source_name, db_path in sources.items():
        expanded_path = os.path.expanduser(db_path)
        
        # Handle iPhone backup path with wildcard
        if '*' in expanded_path:
            import glob
            backup_files = glob.glob(expanded_path)
            if backup_files:
                expanded_path = backup_files[0]
            else:
                print(f"⚠️  No iPhone backup found at: {expanded_path}")
                continue
        
        messages = extract_from_source(expanded_path, source_name)
        if messages:
            all_sources_messages[source_name] = messages
    
    # Merge and deduplicate
    final_messages = merge_and_deduplicate(all_sources_messages)
    
    # Analyze by year
    analyze_by_year(final_messages)
    
    # Create Supabase exports
    supabase_2024_2025 = create_supabase_export(final_messages, 2024, 2025)
    
    # Save complete dataset
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    complete_file = f"ultimate_complete_messages_{timestamp}.json"
    
    with open(complete_file, 'w') as f:
        json.dump(final_messages, f, indent=2)
    
    print(f"\n💾 Complete dataset saved to: {complete_file}")
    
    return final_messages

if __name__ == "__main__":
    import csv
    ultimate_extract() 