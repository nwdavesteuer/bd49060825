#!/usr/bin/env python3
"""
Analyze the comprehensive search results for 2017-2019
"""

import json
from datetime import datetime

def analyze_comprehensive_results():
    """Analyze the comprehensive search results"""
    
    # Load the comprehensive search results
    with open("comprehensive_contact_search_20250727_210406.json", 'r') as f:
        all_messages = json.load(f)
    
    print("🔍 ANALYZING COMPREHENSIVE SEARCH RESULTS")
    print("=" * 60)
    
    # Filter for 2017-2019 messages
    messages_2017_2019 = []
    for msg in all_messages:
        year = msg.get('year')
        if year and 2017 <= year <= 2019:
            messages_2017_2019.append(msg)
    
    print(f"📊 Found {len(messages_2017_2019)} messages from 2017-2019")
    
    # Analyze by year
    year_breakdown = {}
    for msg in messages_2017_2019:
        year = msg.get('year')
        if year not in year_breakdown:
            year_breakdown[year] = {'David': 0, 'Other': 0, 'sources': set()}
        
        sender = msg.get('is_from_me', 'Unknown')
        source = msg.get('source', 'Unknown')
        
        year_breakdown[year][sender] += 1
        year_breakdown[year]['sources'].add(source)
    
    print(f"\n📅 2017-2019 Breakdown:")
    for year in sorted(year_breakdown.keys()):
        david_count = year_breakdown[year]['David']
        other_count = year_breakdown[year]['Other']
        total = david_count + other_count
        sources = list(year_breakdown[year]['sources'])
        print(f"  {year}: {total} total ({david_count} from David, {other_count} from others)")
        print(f"    Sources: {', '.join(sources)}")
    
    # Analyze by chat identifier
    chat_breakdown = {}
    for msg in messages_2017_2019:
        chat_id = msg.get('chat_identifier', 'Unknown')
        if chat_id not in chat_breakdown:
            chat_breakdown[chat_id] = {'count': 0, 'years': set(), 'sources': set()}
        
        chat_breakdown[chat_id]['count'] += 1
        chat_breakdown[chat_id]['years'].add(msg.get('year'))
        chat_breakdown[chat_id]['sources'].add(msg.get('source', 'Unknown'))
    
    print(f"\n💬 Top Chat Identifiers (2017-2019):")
    sorted_chats = sorted(chat_breakdown.items(), key=lambda x: x[1]['count'], reverse=True)
    for chat_id, info in sorted_chats[:15]:
        years = sorted(list(info['years']))
        sources = list(info['sources'])
        print(f"  {chat_id}: {info['count']} messages")
        print(f"    Years: {years}")
        print(f"    Sources: {', '.join(sources)}")
    
    # Check for known Nitzan identifiers
    nitzan_chats = []
    for chat_id, info in chat_breakdown.items():
        if any(keyword in chat_id.lower() for keyword in ['nitzan', 'pelman', '917', '1917']):
            nitzan_chats.append((chat_id, info))
    
    print(f"\n🎯 Potential Nitzan Chats (2017-2019):")
    for chat_id, info in nitzan_chats:
        years = sorted(list(info['years']))
        sources = list(info['sources'])
        print(f"  {chat_id}: {info['count']} messages")
        print(f"    Years: {years}")
        print(f"    Sources: {', '.join(sources)}")
    
    # Compare with our previous comprehensive dataset
    print(f"\n📈 COMPARISON WITH PREVIOUS DATASET")
    print("=" * 40)
    
    # Load previous comprehensive data
    try:
        with open("ultimate_comprehensive_with_davids_backup_20250727_201359.json", 'r') as f:
            previous_data = json.load(f)
        
        # Filter previous data for 2017-2019
        previous_2017_2019 = []
        for msg in previous_data:
            year = msg.get('year')
            if year and 2017 <= year <= 2019:
                previous_2017_2019.append(msg)
        
        print(f"Previous dataset 2017-2019: {len(previous_2017_2019)} messages")
        print(f"Comprehensive search 2017-2019: {len(messages_2017_2019)} messages")
        print(f"Difference: +{len(messages_2017_2019) - len(previous_2017_2019)} messages")
        
        # Check for new chat identifiers
        previous_chat_ids = set()
        for msg in previous_2017_2019:
            chat_id = msg.get('chat_identifier', 'Unknown')
            previous_chat_ids.add(chat_id)
        
        new_chat_ids = set()
        for msg in messages_2017_2019:
            chat_id = msg.get('chat_identifier', 'Unknown')
            if chat_id not in previous_chat_ids:
                new_chat_ids.add(chat_id)
        
        print(f"New chat identifiers found: {len(new_chat_ids)}")
        for chat_id in sorted(new_chat_ids):
            print(f"  {chat_id}")
        
    except FileNotFoundError:
        print("Previous comprehensive dataset not found for comparison")

if __name__ == "__main__":
    analyze_comprehensive_results() 