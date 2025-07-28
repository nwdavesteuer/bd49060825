#!/usr/bin/env python3
"""
Analyze the David identifiers we found
"""

import json
from datetime import datetime

def analyze_david_identifiers():
    """Analyze the David identifiers found"""
    
    # Load the comprehensive search results
    try:
        with open("comprehensive_contact_search_20250727_210406.json", 'r') as f:
            all_messages = json.load(f)
    except FileNotFoundError:
        print("❌ Comprehensive search data not found")
        return
    
    print("🔍 ANALYZING DAVID'S IDENTIFIERS")
    print("=" * 50)
    
    # Check for dsteuer@b-zb.com (found in partial matches)
    dsteuer_messages = []
    for msg in all_messages:
        chat_identifier = msg.get('chat_identifier', '')
        if 'dsteuer@b-zb.com' in chat_identifier:
            dsteuer_messages.append(msg)
    
    # Check for +14152356782 (found in partial matches)
    phone_messages = []
    for msg in all_messages:
        chat_identifier = msg.get('chat_identifier', '')
        if '+14152356782' in chat_identifier:
            phone_messages.append(msg)
    
    print(f"📧 Messages with dsteuer@b-zb.com: {len(dsteuer_messages)}")
    print(f"📱 Messages with +14152356782: {len(phone_messages)}")
    
    # Analyze dsteuer@b-zb.com messages
    if dsteuer_messages:
        print(f"\n📧 DSTEUER@B-ZB.COM ANALYSIS:")
        print("=" * 40)
        
        # Check if these are David-Nitzan conversations
        david_count = 0
        nitzan_count = 0
        other_count = 0
        
        for msg in dsteuer_messages:
            sender = msg.get('is_from_me', 'Unknown')
            if sender == 'David':
                david_count += 1
            elif sender != 'David':
                nitzan_count += 1
            else:
                other_count += 1
        
        print(f"David's messages: {david_count}")
        print(f"Nitzan's messages: {nitzan_count}")
        print(f"Other messages: {other_count}")
        
        # Check years
        years = set()
        for msg in dsteuer_messages:
            year = msg.get('year')
            if year:
                years.add(year)
        
        print(f"Years: {sorted(list(years))}")
        
        # Show sample messages
        print(f"\n💬 Sample dsteuer@b-zb.com messages:")
        for i, msg in enumerate(dsteuer_messages[:5], 1):
            sender = msg.get('is_from_me', 'Unknown')
            text = msg.get('text', '')[:100]
            date = msg.get('readable_date', 'Unknown')
            print(f"{i}. [{sender}] {date}: {text}...")
    
    # Analyze +14152356782 messages
    if phone_messages:
        print(f"\n📱 +14152356782 ANALYSIS:")
        print("=" * 35)
        
        # Check if these are David-Nitzan conversations
        david_count = 0
        nitzan_count = 0
        other_count = 0
        
        for msg in phone_messages:
            sender = msg.get('is_from_me', 'Unknown')
            if sender == 'David':
                david_count += 1
            elif sender != 'David':
                nitzan_count += 1
            else:
                other_count += 1
        
        print(f"David's messages: {david_count}")
        print(f"Nitzan's messages: {nitzan_count}")
        print(f"Other messages: {other_count}")
        
        # Check years
        years = set()
        for msg in phone_messages:
            year = msg.get('year')
            if year:
                years.add(year)
        
        print(f"Years: {sorted(list(years))}")
        
        # Show sample messages
        print(f"\n💬 Sample +14152356782 messages:")
        for i, msg in enumerate(phone_messages[:5], 1):
            sender = msg.get('is_from_me', 'Unknown')
            text = msg.get('text', '')[:100]
            date = msg.get('readable_date', 'Unknown')
            print(f"{i}. [{sender}] {date}: {text}...")
    
    # Check if these should be included in our direct messages
    print(f"\n🔍 SHOULD THESE BE INCLUDED?")
    print("=" * 35)
    
    if dsteuer_messages:
        # Check if these are direct conversations (not group chats)
        direct_dsteuer = []
        for msg in dsteuer_messages:
            chat_identifier = msg.get('chat_identifier', '')
            display_name = msg.get('display_name', '')
            
            # Skip group chats
            if not chat_identifier.startswith('chat') and not display_name:
                direct_dsteuer.append(msg)
        
        print(f"Direct dsteuer@b-zb.com conversations: {len(direct_dsteuer)}")
        
        if direct_dsteuer:
            # Check if these are David-Nitzan conversations
            david_nitzan_count = 0
            for msg in direct_dsteuer:
                sender = msg.get('is_from_me', 'Unknown')
                if sender == 'David' or sender != 'David':  # Both David and Nitzan present
                    david_nitzan_count += 1
            
            print(f"Potential David-Nitzan conversations: {david_nitzan_count}")
            
            if david_nitzan_count > 0:
                print("✅ Should include dsteuer@b-zb.com conversations")
            else:
                print("❌ Not David-Nitzan conversations")
    
    if phone_messages:
        # Check if these are direct conversations
        direct_phone = []
        for msg in phone_messages:
            chat_identifier = msg.get('chat_identifier', '')
            display_name = msg.get('display_name', '')
            
            # Skip group chats
            if not chat_identifier.startswith('chat') and not display_name:
                direct_phone.append(msg)
        
        print(f"Direct +14152356782 conversations: {len(direct_phone)}")
        
        if direct_phone:
            # Check if these are David-Nitzan conversations
            david_nitzan_count = 0
            for msg in direct_phone:
                sender = msg.get('is_from_me', 'Unknown')
                if sender == 'David' or sender != 'David':  # Both David and Nitzan present
                    david_nitzan_count += 1
            
            print(f"Potential David-Nitzan conversations: {david_nitzan_count}")
            
            if david_nitzan_count > 0:
                print("✅ Should include +14152356782 conversations")
            else:
                print("❌ Not David-Nitzan conversations")
    
    # Summary
    print(f"\n📋 RECOMMENDATION:")
    print("=" * 25)
    
    if dsteuer_messages and phone_messages:
        print("Found David's identifiers:")
        print(f"  - dsteuer@b-zb.com: {len(dsteuer_messages)} messages")
        print(f"  - +14152356782: {len(phone_messages)} messages")
        print("\nThese should be checked to see if they contain David-Nitzan conversations")
        print("and potentially included in our dataset.")

if __name__ == "__main__":
    analyze_david_identifiers() 