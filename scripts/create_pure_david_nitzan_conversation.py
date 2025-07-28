#!/usr/bin/env python3
"""
Create a pure David-Nitzan conversation dataset with only direct messages between them
"""

import json
from datetime import datetime

def create_pure_david_nitzan_conversation():
    """Create a pure David-Nitzan conversation dataset"""
    
    print("💬 CREATING PURE DAVID-NITZAN CONVERSATION")
    print("=" * 50)
    
    # Load the corrected dataset
    try:
        with open("correct_david_nitzan_messages.json", 'r') as f:
            data = json.load(f)
    except FileNotFoundError:
        print("❌ Correct dataset not found")
        return
    
    print(f"📊 Total messages to filter: {len(data)}")
    
    # Define Nitzan's known identifiers
    nitzan_identifiers = [
        '+19172390518',  # Primary phone number
        'nitzan.pelman@gmail.com',
        'nitzanpelman@icloud.com',
        '+19179513387',  # Secondary phone number
        'nitzanpelman@me.com',
        'nitzanpelman@mac.com'
    ]
    
    # Filter for ONLY direct David-Nitzan conversations
    pure_conversation = []
    excluded_messages = []
    
    for msg in data:
        chat_identifier = msg.get('chat_identifier', '')
        display_name = msg.get('display_name', '')
        
        # Skip group chats (chat_identifier starts with 'chat' or has display_name)
        if chat_identifier.startswith('chat'):
            excluded_messages.append(msg)
            continue
            
        if display_name and display_name != '':
            excluded_messages.append(msg)
            continue
        
        # Check if this is a direct conversation with Nitzan
        is_nitzan_chat = False
        for identifier in nitzan_identifiers:
            if identifier in chat_identifier:
                is_nitzan_chat = True
                break
        
        if is_nitzan_chat:
            # Verify both David and Nitzan are in this conversation
            # This message should be from either David or Nitzan
            sender = msg.get('is_from_me', 'Unknown')
            if sender in ['David', 'Nitzan'] or sender in [True, False, 1, 0]:
                pure_conversation.append(msg)
            else:
                excluded_messages.append(msg)
        else:
            excluded_messages.append(msg)
    
    print(f"✅ Pure David-Nitzan messages: {len(pure_conversation)}")
    print(f"❌ Excluded messages (group chats/others): {len(excluded_messages)}")
    
    # Analyze excluded messages to understand what was filtered out
    print(f"\n📋 ANALYSIS OF EXCLUDED MESSAGES:")
    print("=" * 40)
    
    excluded_by_reason = {
        'group_chat': 0,
        'display_name': 0,
        'not_nitzan': 0,
        'unknown_sender': 0
    }
    
    for msg in excluded_messages:
        chat_identifier = msg.get('chat_identifier', '')
        display_name = msg.get('display_name', '')
        sender = msg.get('is_from_me', 'Unknown')
        
        if chat_identifier.startswith('chat'):
            excluded_by_reason['group_chat'] += 1
        elif display_name and display_name != '':
            excluded_by_reason['display_name'] += 1
        else:
            # Check if it's not a Nitzan chat
            is_nitzan_chat = False
            for identifier in nitzan_identifiers:
                if identifier in chat_identifier:
                    is_nitzan_chat = True
                    break
            
            if not is_nitzan_chat:
                excluded_by_reason['not_nitzan'] += 1
            else:
                excluded_by_reason['unknown_sender'] += 1
    
    for reason, count in excluded_by_reason.items():
        if count > 0:
            print(f"  {reason}: {count} messages")
    
    # Show examples of excluded messages
    print(f"\n🔍 EXAMPLES OF EXCLUDED MESSAGES:")
    print("=" * 40)
    
    for i, msg in enumerate(excluded_messages[:10], 1):
        chat_id = msg.get('chat_identifier', 'Unknown')
        display_name = msg.get('display_name', '')
        sender = msg.get('is_from_me', 'Unknown')
        text = msg.get('text', '')[:50]
        date = msg.get('readable_date', 'Unknown')
        
        reason = "group_chat" if chat_id.startswith('chat') else "display_name" if display_name else "not_nitzan"
        print(f"{i}. [{reason}] {chat_id} | {sender} | {date}: {text}...")
    
    # Sort messages chronologically
    print(f"\n📅 SORTING MESSAGES CHRONOLOGICALLY")
    print("=" * 40)
    
    # Parse dates and sort
    sorted_messages = []
    for msg in pure_conversation:
        date_str = msg.get('readable_date', '')
        if date_str:
            try:
                if 'T' in date_str:
                    date_obj = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
                else:
                    date_obj = datetime.strptime(date_str, '%Y-%m-%d %H:%M:%S')
                sorted_messages.append((date_obj, msg))
            except:
                # If we can't parse the date, skip it
                continue
    
    sorted_messages.sort(key=lambda x: x[0])
    
    # Extract just the messages in chronological order
    chronological_messages = [msg for date, msg in sorted_messages]
    
    print(f"✅ Chronologically sorted messages: {len(chronological_messages)}")
    
    # Analyze the pure conversation
    print(f"\n📊 ANALYSIS OF PURE CONVERSATION:")
    print("=" * 40)
    
    # Count by year
    by_year = {}
    for msg in chronological_messages:
        year = msg.get('year')
        if year:
            if year not in by_year:
                by_year[year] = 0
            by_year[year] += 1
    
    print("📅 Messages by year:")
    for year in sorted(by_year.keys()):
        count = by_year[year]
        print(f"  {year}: {count} messages")
    
    # Count by sender
    david_count = 0
    nitzan_count = 0
    for msg in chronological_messages:
        sender = msg.get('is_from_me', 'Unknown')
        if sender == 'David' or sender == True or sender == 1:
            david_count += 1
        else:
            nitzan_count += 1
    
    print(f"\n👥 Sender breakdown:")
    print(f"  David: {david_count} messages")
    print(f"  Nitzan: {nitzan_count} messages")
    
    # Show first few messages
    print(f"\n📱 FIRST FEW MESSAGES (Chronological):")
    print("=" * 45)
    
    for i, msg in enumerate(chronological_messages[:10], 1):
        date = msg.get('readable_date', 'Unknown')
        sender = "David" if msg.get('is_from_me') in ['David', True, 1] else "Nitzan"
        text = msg.get('text', '')[:50]
        print(f"{i}. [{sender}] {date}: {text}...")
    
    # Show last few messages
    print(f"\n📱 LAST FEW MESSAGES (Chronological):")
    print("=" * 45)
    
    for i, msg in enumerate(chronological_messages[-10:], 1):
        date = msg.get('readable_date', 'Unknown')
        sender = "David" if msg.get('is_from_me') in ['David', True, 1] else "Nitzan"
        text = msg.get('text', '')[:50]
        print(f"{len(chronological_messages) - 10 + i}. [{sender}] {date}: {text}...")
    
    # Create the final dataset
    print(f"\n💾 CREATING FINAL DATASET")
    print("=" * 30)
    
    # Save the pure chronological conversation
    output_filename = "pure_david_nitzan_conversation.json"
    with open(output_filename, 'w') as f:
        json.dump(chronological_messages, f, indent=2)
    
    print(f"✅ Saved {len(chronological_messages)} messages to {output_filename}")
    
    # Create Supabase-ready files
    csv_filename = "pure_david_nitzan_conversation.csv"
    with open(csv_filename, 'w', newline='', encoding='utf-8') as f:
        import csv
        writer = csv.writer(f)
        
        # Write header
        writer.writerow([
            'message_id', 'guid', 'text', 'date', 'date_read', 'is_from_me',
            'sender', 'recipient', 'emojis', 'links', 'service', 'account',
            'contact_id', 'readable_date', 'apple_date', 'apple_date_read'
        ])
        
        # Write data
        for msg in chronological_messages:
            writer.writerow([
                msg.get('message_id', ''),
                msg.get('guid', ''),
                msg.get('text', ''),
                msg.get('date', ''),
                msg.get('date_read', ''),
                msg.get('is_from_me', ''),
                msg.get('sender', ''),
                msg.get('recipient', ''),
                msg.get('emojis', ''),
                msg.get('links', ''),
                msg.get('service', ''),
                msg.get('account', ''),
                msg.get('contact_id', ''),
                msg.get('readable_date', ''),
                msg.get('apple_date', ''),
                msg.get('apple_date_read', '')
            ])
    
    print(f"✅ Created Supabase CSV: {csv_filename}")
    
    # Create JSON for Supabase
    supabase_json_filename = "pure_david_nitzan_conversation_supabase.json"
    supabase_data = []
    
    for msg in chronological_messages:
        supabase_msg = {
            'message_id': msg.get('message_id'),
            'guid': msg.get('guid'),
            'text': msg.get('text'),
            'date': msg.get('date'),
            'date_read': msg.get('date_read'),
            'is_from_me': msg.get('is_from_me'),
            'sender': msg.get('sender'),
            'recipient': msg.get('recipient'),
            'emojis': msg.get('emojis'),
            'links': msg.get('links'),
            'service': msg.get('service'),
            'account': msg.get('account'),
            'contact_id': msg.get('contact_id'),
            'readable_date': msg.get('readable_date'),
            'apple_date': msg.get('apple_date'),
            'apple_date_read': msg.get('apple_date_read')
        }
        supabase_data.append(supabase_msg)
    
    with open(supabase_json_filename, 'w') as f:
        json.dump(supabase_data, f, indent=2)
    
    print(f"✅ Created Supabase JSON: {supabase_json_filename}")
    
    print(f"\n🎉 FINAL SUMMARY:")
    print("=" * 20)
    print(f"✅ Pure David-Nitzan conversation: {len(chronological_messages)} messages")
    print(f"📅 Date range: {chronological_messages[0].get('readable_date')} to {chronological_messages[-1].get('readable_date')}")
    print(f"👥 David: {david_count} messages | Nitzan: {nitzan_count} messages")
    print(f"📁 Files created:")
    print(f"  - {output_filename}")
    print(f"  - {csv_filename}")
    print(f"  - {supabase_json_filename}")
    print(f"✅ All messages are chronological and direct David-Nitzan conversations only!")

if __name__ == "__main__":
    create_pure_david_nitzan_conversation() 