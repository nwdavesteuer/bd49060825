#!/usr/bin/env python3
"""
Verify contact methods and ensure only direct David-Nitzan messages
"""

import json
from datetime import datetime

def analyze_contact_methods():
    """Analyze the contact methods in our dataset"""
    
    # Load the filtered direct messages
    try:
        with open("direct_david_nitzan_messages_20250727_210719.json", 'r') as f:
            direct_messages = json.load(f)
    except FileNotFoundError:
        print("❌ Direct messages file not found")
        return
    
    print("🔍 ANALYZING CONTACT METHODS")
    print("=" * 50)
    
    # Analyze chat identifiers
    chat_identifier_counts = {}
    chat_identifier_details = {}
    
    for msg in direct_messages:
        chat_id = msg.get('chat_identifier', 'Unknown')
        source = msg.get('source', 'Unknown')
        year = msg.get('year')
        sender = msg.get('is_from_me', 'Unknown')
        
        if chat_id not in chat_identifier_counts:
            chat_identifier_counts[chat_id] = 0
            chat_identifier_details[chat_id] = {
                'count': 0,
                'sources': set(),
                'years': set(),
                'david_count': 0,
                'nitzan_count': 0
            }
        
        chat_identifier_counts[chat_id] += 1
        chat_identifier_details[chat_id]['count'] += 1
        chat_identifier_details[chat_id]['sources'].add(source)
        if year:
            chat_identifier_details[chat_id]['years'].add(year)
        
        if sender == 'David':
            chat_identifier_details[chat_id]['david_count'] += 1
        else:
            chat_identifier_details[chat_id]['nitzan_count'] += 1
    
    print(f"📊 Found {len(chat_identifier_counts)} unique chat identifiers")
    print(f"📊 Total messages: {len(direct_messages)}")
    
    print(f"\n💬 CHAT IDENTIFIERS ANALYSIS:")
    print("=" * 40)
    
    # Sort by message count
    sorted_chats = sorted(chat_identifier_counts.items(), key=lambda x: x[1], reverse=True)
    
    for chat_id, count in sorted_chats:
        details = chat_identifier_details[chat_id]
        years = sorted(list(details['years']))
        sources = list(details['sources'])
        david_count = details['david_count']
        nitzan_count = details['nitzan_count']
        
        print(f"\n📱 {chat_id}")
        print(f"   Messages: {count} total")
        print(f"   David: {david_count}, Nitzan: {nitzan_count}")
        print(f"   Years: {years}")
        print(f"   Sources: {', '.join(sources)}")
        
        # Check if this looks like a David-Nitzan conversation
        if david_count > 0 and nitzan_count > 0:
            print(f"   ✅ CONFIRMED: Both David and Nitzan messages present")
        elif david_count > 0:
            print(f"   ⚠️  WARNING: Only David messages")
        elif nitzan_count > 0:
            print(f"   ⚠️  WARNING: Only Nitzan messages")
        else:
            print(f"   ❌ ERROR: No sender information")
    
    # Check for potential issues
    print(f"\n🔍 POTENTIAL ISSUES:")
    print("=" * 30)
    
    issues_found = False
    
    for chat_id, details in chat_identifier_details.items():
        # Check for one-sided conversations
        if details['david_count'] > 0 and details['nitzan_count'] == 0:
            print(f"⚠️  {chat_id}: Only David messages ({details['david_count']} messages)")
            issues_found = True
        elif details['nitzan_count'] > 0 and details['david_count'] == 0:
            print(f"⚠️  {chat_id}: Only Nitzan messages ({details['nitzan_count']} messages)")
            issues_found = True
        
        # Check for suspicious identifiers
        if not any(keyword in chat_id.lower() for keyword in ['nitzan', 'pelman', '917', '1917', '@']):
            print(f"❓ {chat_id}: Unknown identifier pattern")
            issues_found = True
    
    if not issues_found:
        print("✅ No issues found - all conversations appear to be David-Nitzan")
    
    return chat_identifier_details

def verify_against_previous_dataset():
    """Compare with previous dataset to ensure we're not duplicating"""
    
    print(f"\n🔄 COMPARING WITH PREVIOUS DATASET")
    print("=" * 40)
    
    # Load previous dataset
    try:
        with open("ultimate_comprehensive_all_20250727_205541.json", 'r') as f:
            previous_data = json.load(f)
    except FileNotFoundError:
        print("❌ Previous dataset not found")
        return
    
    # Load current direct messages
    try:
        with open("direct_david_nitzan_messages_20250727_210719.json", 'r') as f:
            current_data = json.load(f)
    except FileNotFoundError:
        print("❌ Current direct messages not found")
        return
    
    # Get GUIDs from both datasets
    previous_guids = set()
    for msg in previous_data:
        guid = msg.get('guid')
        if guid:
            previous_guids.add(guid)
    
    current_guids = set()
    for msg in current_data:
        guid = msg.get('guid')
        if guid:
            current_guids.add(guid)
    
    # Find new GUIDs
    new_guids = current_guids - previous_guids
    overlapping_guids = current_guids & previous_guids
    
    print(f"📊 Previous dataset GUIDs: {len(previous_guids)}")
    print(f"📊 Current direct messages GUIDs: {len(current_guids)}")
    print(f"📊 New GUIDs: {len(new_guids)}")
    print(f"📊 Overlapping GUIDs: {len(overlapping_guids)}")
    
    if new_guids:
        print(f"\n🆕 NEW MESSAGES FOUND:")
        print("=" * 25)
        
        # Analyze new messages by chat identifier
        new_chat_counts = {}
        for msg in current_data:
            guid = msg.get('guid')
            if guid in new_guids:
                chat_id = msg.get('chat_identifier', 'Unknown')
                new_chat_counts[chat_id] = new_chat_counts.get(chat_id, 0) + 1
        
        for chat_id, count in sorted(new_chat_counts.items(), key=lambda x: x[1], reverse=True):
            print(f"  {chat_id}: {count} new messages")
    
    return new_guids

def main():
    """Verify contact methods and check for new messages"""
    
    print("🔍 VERIFYING CONTACT METHODS AND NEW MESSAGES")
    print("=" * 60)
    
    # Analyze contact methods
    chat_details = analyze_contact_methods()
    
    # Verify against previous dataset
    new_guids = verify_against_previous_dataset()
    
    print(f"\n📋 SUMMARY")
    print("=" * 20)
    print("Contact methods found:")
    for chat_id in chat_details.keys():
        print(f"  - {chat_id}")
    
    if new_guids:
        print(f"\n✅ {len(new_guids)} new messages found that weren't in previous dataset")
    else:
        print(f"\n⚠️  No new messages found - all messages already in previous dataset")

if __name__ == "__main__":
    main() 