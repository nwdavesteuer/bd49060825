#!/usr/bin/env python3
"""
Check whose phone number +19179513387 belongs to
"""

import json
from datetime import datetime

def check_phone_owner():
    """Check the details of +19179513387"""
    
    # Load the direct messages
    try:
        with open("direct_david_nitzan_messages_20250727_210719.json", 'r') as f:
            direct_messages = json.load(f)
    except FileNotFoundError:
        print("❌ Direct messages file not found")
        return
    
    print("🔍 ANALYZING PHONE NUMBER +19179513387")
    print("=" * 50)
    
    # Filter messages for this phone number
    phone_messages = []
    for msg in direct_messages:
        if msg.get('chat_identifier') == '+19179513387':
            phone_messages.append(msg)
    
    print(f"📊 Found {len(phone_messages)} messages for +19179513387")
    
    if not phone_messages:
        print("❌ No messages found for this phone number")
        return
    
    # Analyze sender breakdown
    david_count = 0
    nitzan_count = 0
    other_count = 0
    
    # Sample messages to check
    sample_messages = []
    
    for msg in phone_messages:
        sender = msg.get('is_from_me', 'Unknown')
        if sender == 'David':
            david_count += 1
        elif sender != 'David':
            nitzan_count += 1
        else:
            other_count += 1
        
        # Collect sample messages
        if len(sample_messages) < 10:
            sample_messages.append({
                'sender': sender,
                'text': msg.get('text', '')[:100],
                'date': msg.get('readable_date'),
                'source': msg.get('source')
            })
    
    print(f"\n📱 SENDER BREAKDOWN:")
    print(f"  David: {david_count} messages")
    print(f"  Nitzan: {nitzan_count} messages")
    print(f"  Other: {other_count} messages")
    
    # Check years
    years = set()
    for msg in phone_messages:
        year = msg.get('year')
        if year:
            years.add(year)
    
    print(f"\n📅 YEARS: {sorted(list(years))}")
    
    # Check sources
    sources = set()
    for msg in phone_messages:
        source = msg.get('source', 'Unknown')
        sources.add(source)
    
    print(f"\n📂 SOURCES: {', '.join(sources)}")
    
    # Show sample messages
    print(f"\n💬 SAMPLE MESSAGES:")
    print("=" * 30)
    
    for i, msg in enumerate(sample_messages, 1):
        print(f"{i}. [{msg['sender']}] {msg['date']}: {msg['text']}...")
        print(f"   Source: {msg['source']}")
        print()
    
    # Check if this looks like David's or Nitzan's phone
    print(f"\n🔍 ANALYSIS:")
    print("=" * 20)
    
    if david_count > nitzan_count:
        print("📱 This appears to be DAVID'S phone number")
        print(f"   - David sent {david_count} messages")
        print(f"   - Nitzan sent {nitzan_count} messages")
        print(f"   - David sent {david_count/(david_count+nitzan_count)*100:.1f}% of messages")
    elif nitzan_count > david_count:
        print("📱 This appears to be NITZAN'S phone number")
        print(f"   - David sent {david_count} messages")
        print(f"   - Nitzan sent {nitzan_count} messages")
        print(f"   - Nitzan sent {nitzan_count/(david_count+nitzan_count)*100:.1f}% of messages")
    else:
        print("📱 This appears to be a shared or family phone number")
        print(f"   - David sent {david_count} messages")
        print(f"   - Nitzan sent {nitzan_count} messages")
    
    # Check for any patterns in the messages
    print(f"\n📊 MESSAGE PATTERNS:")
    print("=" * 25)
    
    # Look for any identifying text patterns
    david_texts = []
    nitzan_texts = []
    
    for msg in phone_messages:
        text = msg.get('text', '').lower()
        sender = msg.get('is_from_me', 'Unknown')
        
        if sender == 'David' and len(david_texts) < 5:
            david_texts.append(msg.get('text', '')[:200])
        elif sender != 'David' and len(nitzan_texts) < 5:
            nitzan_texts.append(msg.get('text', '')[:200])
    
    if david_texts:
        print("David's sample messages:")
        for i, text in enumerate(david_texts, 1):
            print(f"  {i}. {text}")
        print()
    
    if nitzan_texts:
        print("Nitzan's sample messages:")
        for i, text in enumerate(nitzan_texts, 1):
            print(f"  {i}. {text}")
        print()

if __name__ == "__main__":
    check_phone_owner() 