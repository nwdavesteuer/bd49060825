#!/usr/bin/env python3
"""
Check what sources we're using for David's messages
"""

import json
from datetime import datetime

def check_david_sources():
    """Check the sources for David's messages"""
    
    # Load the direct messages
    try:
        with open("direct_david_nitzan_messages_20250727_210719.json", 'r') as f:
            direct_messages = json.load(f)
    except FileNotFoundError:
        print("❌ Direct messages file not found")
        return
    
    print("🔍 ANALYZING DAVID'S MESSAGE SOURCES")
    print("=" * 50)
    
    # Separate David and Nitzan messages
    david_messages = []
    nitzan_messages = []
    
    for msg in direct_messages:
        sender = msg.get('is_from_me', 'Unknown')
        if sender == 'David':
            david_messages.append(msg)
        else:
            nitzan_messages.append(msg)
    
    print(f"📊 Total messages: {len(direct_messages)}")
    print(f"📊 David's messages: {len(david_messages)}")
    print(f"📊 Nitzan's messages: {len(nitzan_messages)}")
    
    # Analyze David's message sources
    david_sources = {}
    david_chat_identifiers = {}
    
    for msg in david_messages:
        source = msg.get('source', 'Unknown')
        chat_id = msg.get('chat_identifier', 'Unknown')
        year = msg.get('year')
        
        if source not in david_sources:
            david_sources[source] = {
                'count': 0,
                'years': set(),
                'chat_identifiers': set()
            }
        
        david_sources[source]['count'] += 1
        if year:
            david_sources[source]['years'].add(year)
        david_sources[source]['chat_identifiers'].add(chat_id)
        
        # Track chat identifiers for David
        if chat_id not in david_chat_identifiers:
            david_chat_identifiers[chat_id] = 0
        david_chat_identifiers[chat_id] += 1
    
    print(f"\n📂 DAVID'S MESSAGE SOURCES:")
    print("=" * 35)
    
    for source, info in david_sources.items():
        years = sorted(list(info['years']))
        chat_ids = list(info['chat_identifiers'])
        print(f"\n📱 {source}: {info['count']} messages")
        print(f"   Years: {years}")
        print(f"   Chat identifiers: {chat_ids}")
    
    # Analyze Nitzan's message sources
    nitzan_sources = {}
    
    for msg in nitzan_messages:
        source = msg.get('source', 'Unknown')
        year = msg.get('year')
        
        if source not in nitzan_sources:
            nitzan_sources[source] = {
                'count': 0,
                'years': set()
            }
        
        nitzan_sources[source]['count'] += 1
        if year:
            nitzan_sources[source]['years'].add(year)
    
    print(f"\n📂 NITZAN'S MESSAGE SOURCES:")
    print("=" * 35)
    
    for source, info in nitzan_sources.items():
        years = sorted(list(info['years']))
        print(f"\n📱 {source}: {info['count']} messages")
        print(f"   Years: {years}")
    
    # Check what databases we're using
    print(f"\n🗄️  DATABASES USED:")
    print("=" * 25)
    
    all_sources = set()
    for msg in direct_messages:
        source = msg.get('source', 'Unknown')
        all_sources.add(source)
    
    for source in sorted(all_sources):
        print(f"  - {source}")
    
    # Check for any issues with David's messages
    print(f"\n🔍 DAVID'S MESSAGE ANALYSIS:")
    print("=" * 35)
    
    # Check if David's messages are properly attributed
    david_attribution_issues = []
    for msg in david_messages:
        chat_id = msg.get('chat_identifier', '')
        # Check if this looks like it should be David's phone
        if any(keyword in chat_id.lower() for keyword in ['david', 'steuer']):
            david_attribution_issues.append(msg)
    
    if david_attribution_issues:
        print(f"⚠️  Found {len(david_attribution_issues)} messages that might be misattributed to David")
        for msg in david_attribution_issues[:5]:
            print(f"  - {msg.get('chat_identifier')}: {msg.get('text', '')[:50]}...")
    else:
        print("✅ No obvious attribution issues found")
    
    # Check David's primary phone number
    print(f"\n📱 DAVID'S PRIMARY PHONE ANALYSIS:")
    print("=" * 35)
    
    # Look for the primary David-Nitzan conversation
    primary_chat = None
    max_messages = 0
    
    for chat_id in david_chat_identifiers:
        if david_chat_identifiers[chat_id] > max_messages:
            max_messages = david_chat_identifiers[chat_id]
            primary_chat = chat_id
    
    if primary_chat:
        print(f"Primary David-Nitzan chat: {primary_chat}")
        print(f"David's messages in this chat: {max_messages}")
        
        # Check if this is David's phone or Nitzan's phone
        total_messages_in_chat = 0
        for msg in direct_messages:
            if msg.get('chat_identifier') == primary_chat:
                total_messages_in_chat += 1
        
        david_percentage = (max_messages / total_messages_in_chat) * 100 if total_messages_in_chat > 0 else 0
        print(f"David's percentage in this chat: {david_percentage:.1f}%")
        
        if david_percentage > 60:
            print("📱 This appears to be DAVID'S phone number")
        elif david_percentage < 40:
            print("📱 This appears to be NITZAN'S phone number")
        else:
            print("📱 This appears to be a shared or family phone")

if __name__ == "__main__":
    check_david_sources() 