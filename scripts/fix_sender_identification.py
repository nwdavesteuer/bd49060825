#!/usr/bin/env python3
"""
Fix sender identification to properly capture both David and Nitzan's messages
"""

import json
from datetime import datetime

def fix_sender_identification():
    """Fix sender identification to get both David and Nitzan's messages"""
    
    print("🔧 FIXING SENDER IDENTIFICATION")
    print("=" * 40)
    
    # Load the corrected dataset
    try:
        with open("correct_david_nitzan_messages.json", 'r') as f:
            data = json.load(f)
    except FileNotFoundError:
        print("❌ Correct dataset not found")
        return
    
    print(f"📊 Total messages to analyze: {len(data)}")
    
    # Define Nitzan's known identifiers
    nitzan_identifiers = [
        '+19172390518',  # Primary phone number
        'nitzan.pelman@gmail.com',
        'nitzanpelman@icloud.com',
        '+19179513387',  # Secondary phone number
        'nitzanpelman@me.com',
        'nitzanpelman@mac.com'
    ]
    
    # Analyze all messages to understand sender patterns
    print(f"\n📋 ANALYZING SENDER PATTERNS:")
    print("=" * 35)
    
    sender_counts = {}
    nitzan_chats = []
    
    for msg in data:
        chat_identifier = msg.get('chat_identifier', '')
        display_name = msg.get('display_name', '')
        sender = msg.get('is_from_me', 'Unknown')
        
        # Check if this is a Nitzan chat
        is_nitzan_chat = False
        for identifier in nitzan_identifiers:
            if identifier in chat_identifier:
                is_nitzan_chat = True
                break
        
        if is_nitzan_chat and not chat_identifier.startswith('chat') and not display_name:
            nitzan_chats.append(msg)
            
            # Count sender types
            if sender not in sender_counts:
                sender_counts[sender] = 0
            sender_counts[sender] += 1
    
    print(f"✅ Nitzan chats found: {len(nitzan_chats)}")
    print(f"📊 Sender breakdown:")
    for sender, count in sorted(sender_counts.items()):
        print(f"  {sender}: {count} messages")
    
    # Show examples of different sender types
    print(f"\n🔍 EXAMPLES BY SENDER TYPE:")
    print("=" * 35)
    
    for sender_type in sorted(sender_counts.keys()):
        examples = [msg for msg in nitzan_chats if msg.get('is_from_me') == sender_type]
        if examples:
            print(f"\n📱 {sender_type} messages:")
            for i, msg in enumerate(examples[:3], 1):
                date = msg.get('readable_date', 'Unknown')
                text = msg.get('text', '')[:50]
                print(f"  {i}. {date}: {text}...")
    
    # Now create the proper conversation with correct sender identification
    print(f"\n💬 CREATING PROPER CONVERSATION:")
    print("=" * 35)
    
    conversation = []
    
    for msg in nitzan_chats:
        sender = msg.get('is_from_me', 'Unknown')
        
        # Determine if it's David or Nitzan
        if sender in [True, 1, 'David']:
            msg['sender_identified'] = 'David'
        elif sender in [False, 0, 'Nitzan']:
            msg['sender_identified'] = 'Nitzan'
        else:
            # For unknown senders, we need to investigate
            msg['sender_identified'] = 'Unknown'
        
        conversation.append(msg)
    
    # Count the properly identified messages
    david_count = len([msg for msg in conversation if msg.get('sender_identified') == 'David'])
    nitzan_count = len([msg for msg in conversation if msg.get('sender_identified') == 'Nitzan'])
    unknown_count = len([msg for msg in conversation if msg.get('sender_identified') == 'Unknown'])
    
    print(f"✅ David messages: {david_count}")
    print(f"✅ Nitzan messages: {nitzan_count}")
    print(f"❓ Unknown sender: {unknown_count}")
    
    # Show examples of unknown senders
    if unknown_count > 0:
        print(f"\n❓ EXAMPLES OF UNKNOWN SENDERS:")
        print("=" * 35)
        unknown_messages = [msg for msg in conversation if msg.get('sender_identified') == 'Unknown']
        for i, msg in enumerate(unknown_messages[:5], 1):
            date = msg.get('readable_date', 'Unknown')
            text = msg.get('text', '')[:50]
            original_sender = msg.get('is_from_me', 'Unknown')
            print(f"{i}. [{original_sender}] {date}: {text}...")
    
    # Sort chronologically
    print(f"\n📅 SORTING CHRONOLOGICALLY:")
    print("=" * 30)
    
    sorted_conversation = []
    for msg in conversation:
        date_str = msg.get('readable_date', '')
        if date_str:
            try:
                if 'T' in date_str:
                    date_obj = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
                else:
                    date_obj = datetime.strptime(date_str, '%Y-%m-%d %H:%M:%S')
                sorted_conversation.append((date_obj, msg))
            except:
                continue
    
    sorted_conversation.sort(key=lambda x: x[0])
    final_conversation = [msg for date, msg in sorted_conversation]
    
    print(f"✅ Chronologically sorted: {len(final_conversation)} messages")
    
    # Analyze by year
    print(f"\n📊 CONVERSATION BY YEAR:")
    print("=" * 25)
    
    by_year = {}
    for msg in final_conversation:
        year = msg.get('year')
        if year:
            if year not in by_year:
                by_year[year] = {'David': 0, 'Nitzan': 0, 'Unknown': 0}
            sender = msg.get('sender_identified', 'Unknown')
            by_year[year][sender] += 1
    
    for year in sorted(by_year.keys()):
        counts = by_year[year]
        total = sum(counts.values())
        print(f"  {year}: {total} messages (David: {counts['David']}, Nitzan: {counts['Nitzan']}, Unknown: {counts['Unknown']})")
    
    # Show conversation flow
    print(f"\n💬 CONVERSATION FLOW (First 20 messages):")
    print("=" * 45)
    
    for i, msg in enumerate(final_conversation[:20], 1):
        date = msg.get('readable_date', 'Unknown')
        sender = msg.get('sender_identified', 'Unknown')
        text = msg.get('text', '')[:40]
        print(f"{i:2d}. [{sender}] {date}: {text}...")
    
    # Create the final dataset
    print(f"\n💾 CREATING FINAL DATASET:")
    print("=" * 30)
    
    # Save the conversation
    output_filename = "david_nitzan_conversation_fixed.json"
    with open(output_filename, 'w') as f:
        json.dump(final_conversation, f, indent=2)
    
    print(f"✅ Saved {len(final_conversation)} messages to {output_filename}")
    
    # Create Supabase-ready files
    csv_filename = "david_nitzan_conversation_fixed.csv"
    with open(csv_filename, 'w', newline='', encoding='utf-8') as f:
        import csv
        writer = csv.writer(f)
        
        # Write header
        writer.writerow([
            'message_id', 'guid', 'text', 'date', 'date_read', 'is_from_me',
            'sender_identified', 'recipient', 'emojis', 'links', 'service', 'account',
            'contact_id', 'readable_date', 'apple_date', 'apple_date_read'
        ])
        
        # Write data
        for msg in final_conversation:
            writer.writerow([
                msg.get('message_id', ''),
                msg.get('guid', ''),
                msg.get('text', ''),
                msg.get('date', ''),
                msg.get('date_read', ''),
                msg.get('is_from_me', ''),
                msg.get('sender_identified', ''),
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
    supabase_json_filename = "david_nitzan_conversation_fixed_supabase.json"
    supabase_data = []
    
    for msg in final_conversation:
        supabase_msg = {
            'message_id': msg.get('message_id'),
            'guid': msg.get('guid'),
            'text': msg.get('text'),
            'date': msg.get('date'),
            'date_read': msg.get('date_read'),
            'is_from_me': msg.get('is_from_me'),
            'sender_identified': msg.get('sender_identified'),
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
    print(f"✅ Total conversation messages: {len(final_conversation)}")
    print(f"📅 Date range: {final_conversation[0].get('readable_date')} to {final_conversation[-1].get('readable_date')}")
    print(f"👥 David: {david_count} | Nitzan: {nitzan_count} | Unknown: {unknown_count}")
    print(f"📁 Files created:")
    print(f"  - {output_filename}")
    print(f"  - {csv_filename}")
    print(f"  - {supabase_json_filename}")

if __name__ == "__main__":
    fix_sender_identification() 