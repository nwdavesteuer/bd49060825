#!/usr/bin/env python3
"""
Filter comprehensive search results to only include direct David-Nitzan messages
"""

import json
from datetime import datetime

def filter_direct_messages(messages):
    """Filter to only direct David-Nitzan conversations"""
    
    # Known Nitzan identifiers
    nitzan_identifiers = [
        '+19172390518',  # Primary phone number
        'nitzan.pelman@gmail.com',
        'nitzanpelman@icloud.com',
        '+19179513387',
        '+19179722297',
        '+19174468822',
        '+19174391069',
        '+19179039761',
        '+19176530720',
        '+19178557246',
        '+19176157865',
        '+19175333330',
        '+19178223790',
        '+19176230464',
        '+19176789024'
    ]
    
    direct_messages = []
    
    for msg in messages:
        chat_identifier = msg.get('chat_identifier', '')
        display_name = msg.get('display_name', '')
        
        # Skip group chats (chat identifiers starting with 'chat')
        if chat_identifier.startswith('chat'):
            continue
        
        # Skip if display name indicates a group chat
        if display_name and display_name != '':
            continue
        
        # Check if this is a direct conversation with Nitzan
        is_nitzan_chat = False
        for identifier in nitzan_identifiers:
            if identifier in chat_identifier:
                is_nitzan_chat = True
                break
        
        if is_nitzan_chat:
            direct_messages.append(msg)
    
    return direct_messages

def analyze_filtered_results(messages):
    """Analyze the filtered direct messages"""
    
    print(f"📊 Found {len(messages)} direct David-Nitzan messages")
    
    # Analyze by year
    year_counts = {}
    source_counts = {}
    chat_identifier_counts = {}
    
    for msg in messages:
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
    
    print(f"\n📅 Direct Messages by Year:")
    for year in sorted(year_counts.keys()):
        david_count = year_counts[year]['David']
        other_count = year_counts[year]['Other']
        total = david_count + other_count
        print(f"  {year}: {total} total ({david_count} from David, {other_count} from Nitzan)")
    
    print(f"\n📂 Messages by Source:")
    for source, count in source_counts.items():
        print(f"  {source}: {count} messages")
    
    print(f"\n💬 Chat Identifiers (Direct Only):")
    sorted_chats = sorted(chat_identifier_counts.items(), key=lambda x: x[1], reverse=True)
    for chat_id, count in sorted_chats:
        print(f"  {chat_id}: {count} messages")
    
    return year_counts

def main():
    """Filter comprehensive search results"""
    
    print("🔍 FILTERING FOR DIRECT DAVID-NITZAN MESSAGES")
    print("=" * 60)
    
    # Load comprehensive search results
    try:
        with open("comprehensive_contact_search_20250727_210406.json", 'r') as f:
            all_messages = json.load(f)
    except FileNotFoundError:
        print("❌ Comprehensive search data not found")
        return
    
    print(f"📊 Total messages in search: {len(all_messages)}")
    
    # Filter for direct messages only
    direct_messages = filter_direct_messages(all_messages)
    
    # Analyze filtered results
    year_counts = analyze_filtered_results(direct_messages)
    
    # Save filtered results
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    output_file = f"direct_david_nitzan_messages_{timestamp}.json"
    
    with open(output_file, 'w') as f:
        json.dump(direct_messages, f, indent=2)
    
    print(f"\n💾 Saved direct messages: {output_file}")
    
    # Check 2017-2019 specifically
    messages_2017_2019 = [msg for msg in direct_messages if msg.get('year') and 2017 <= msg.get('year') <= 2019]
    print(f"\n🎯 2017-2019 Direct Messages: {len(messages_2017_2019)}")
    
    if messages_2017_2019:
        david_2017_2019 = sum(1 for msg in messages_2017_2019 if msg.get('is_from_me') == 'David')
        nitzan_2017_2019 = sum(1 for msg in messages_2017_2019 if msg.get('is_from_me') != 'David')
        print(f"2017-2019 breakdown: {david_2017_2019} from David, {nitzan_2017_2019} from Nitzan")
        
        # Show by year
        for year in [2017, 2018, 2019]:
            year_messages = [msg for msg in messages_2017_2019 if msg.get('year') == year]
            david_count = sum(1 for msg in year_messages if msg.get('is_from_me') == 'David')
            nitzan_count = sum(1 for msg in year_messages if msg.get('is_from_me') != 'David')
            print(f"  {year}: {len(year_messages)} total ({david_count} from David, {nitzan_count} from Nitzan)")
    else:
        print("❌ No direct messages found for 2017-2019")

if __name__ == "__main__":
    main() 