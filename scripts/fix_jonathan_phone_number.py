#!/usr/bin/env python3
"""
Fix the phone number issue - remove Jonathan's number and create pure David-Nitzan conversation
"""

import json
from datetime import datetime

def fix_jonathan_phone_number():
    """Remove Jonathan's phone number and create pure David-Nitzan conversation"""
    
    print("🔧 FIXING JONATHAN'S PHONE NUMBER ISSUE")
    print("=" * 50)
    
    # Load the final conversation
    try:
        with open("final_david_nitzan_conversation.json", 'r') as f:
            data = json.load(f)
    except FileNotFoundError:
        print("❌ Final conversation not found")
        return
    
    print(f"📊 Total messages to check: {len(data)}")
    
    # Define Nitzan's CORRECT identifiers (removing Jonathan's number)
    nitzan_identifiers = [
        '+19172390518',  # Primary phone number
        'nitzan.pelman@gmail.com',
        'nitzanpelman@icloud.com',
        'nitzanpelman@me.com',
        'nitzanpelman@mac.com'
    ]
    
    # Jonathan's number (to exclude)
    jonathan_number = '+19179513387'
    
    # Filter for ONLY direct David-Nitzan conversations
    pure_conversation = []
    jonathan_messages = []
    other_messages = []
    
    for msg in data:
        chat_identifier = msg.get('chat_identifier', '')
        display_name = msg.get('display_name', '')
        
        # Skip group chats
        if chat_identifier.startswith('chat'):
            other_messages.append(msg)
            continue
            
        if display_name and display_name != '':
            other_messages.append(msg)
            continue
        
        # Check if this is Jonathan's number
        if jonathan_number in chat_identifier:
            jonathan_messages.append(msg)
            continue
        
        # Check if this is a direct conversation with Nitzan (correct identifiers only)
        is_nitzan_chat = False
        for identifier in nitzan_identifiers:
            if identifier in chat_identifier:
                is_nitzan_chat = True
                break
        
        if is_nitzan_chat:
            pure_conversation.append(msg)
        else:
            other_messages.append(msg)
    
    print(f"✅ Pure David-Nitzan messages: {len(pure_conversation)}")
    print(f"❌ Jonathan messages (excluded): {len(jonathan_messages)}")
    print(f"❌ Other messages (excluded): {len(other_messages)}")
    
    # Analyze Jonathan's messages to confirm they're not Nitzan
    print(f"\n📋 ANALYSIS OF JONATHAN'S MESSAGES:")
    print("=" * 40)
    
    if jonathan_messages:
        # Show examples of Jonathan's messages
        print(f"🔍 EXAMPLES OF JONATHAN'S MESSAGES:")
        for i, msg in enumerate(jonathan_messages[:10], 1):
            date = msg.get('readable_date', 'Unknown')
            sender = msg.get('sender_identified', 'Unknown')
            text = msg.get('text', '')[:50]
            print(f"{i}. [{sender}] {date}: {text}...")
        
        # Count by year
        jonathan_by_year = {}
        for msg in jonathan_messages:
            year = msg.get('year')
            if year:
                if year not in jonathan_by_year:
                    jonathan_by_year[year] = 0
                jonathan_by_year[year] += 1
        
        print(f"\n📅 Jonathan's messages by year:")
        for year in sorted(jonathan_by_year.keys()):
            count = jonathan_by_year[year]
            print(f"  {year}: {count} messages")
    
    # Sort the pure conversation chronologically
    print(f"\n📅 SORTING PURE CONVERSATION CHRONOLOGICALLY:")
    print("=" * 45)
    
    sorted_conversation = []
    for msg in pure_conversation:
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
    final_pure_conversation = [msg for date, msg in sorted_conversation]
    
    print(f"✅ Chronologically sorted: {len(final_pure_conversation)} messages")
    
    # Analyze the pure conversation
    print(f"\n📊 PURE CONVERSATION ANALYSIS:")
    print("=" * 35)
    
    # Count by year
    by_year = {}
    for msg in final_pure_conversation:
        year = msg.get('year')
        if year:
            if year not in by_year:
                by_year[year] = {'David': 0, 'Nitzan': 0}
            sender = msg.get('sender_identified', 'Unknown')
            if sender in ['David', 'Nitzan']:
                by_year[year][sender] += 1
    
    print("📅 Messages by year:")
    for year in sorted(by_year.keys()):
        counts = by_year[year]
        total = sum(counts.values())
        print(f"  {year}: {total} messages (David: {counts['David']}, Nitzan: {counts['Nitzan']})")
    
    # Count by sender
    david_count = len([msg for msg in final_pure_conversation if msg.get('sender_identified') == 'David'])
    nitzan_count = len([msg for msg in final_pure_conversation if msg.get('sender_identified') == 'Nitzan'])
    
    print(f"\n👥 Sender breakdown:")
    print(f"  David: {david_count} messages")
    print(f"  Nitzan: {nitzan_count} messages")
    print(f"  Total: {len(final_pure_conversation)} messages")
    
    # Show conversation flow
    print(f"\n💬 CONVERSATION FLOW (First 20 messages):")
    print("=" * 45)
    
    for i, msg in enumerate(final_pure_conversation[:20], 1):
        date = msg.get('readable_date', 'Unknown')
        sender = msg.get('sender_identified', 'Unknown')
        text = msg.get('text', '')[:40]
        print(f"{i:2d}. [{sender}] {date}: {text}...")
    
    # Show conversation flow (last 20 messages)
    print(f"\n💬 CONVERSATION FLOW (Last 20 messages):")
    print("=" * 45)
    
    for i, msg in enumerate(final_pure_conversation[-20:], 1):
        date = msg.get('readable_date', 'Unknown')
        sender = msg.get('sender_identified', 'Unknown')
        text = msg.get('text', '')[:40]
        print(f"{len(final_pure_conversation) - 20 + i:2d}. [{sender}] {date}: {text}...")
    
    # Create the corrected dataset
    print(f"\n💾 CREATING CORRECTED DATASET:")
    print("=" * 35)
    
    # Save the pure conversation
    output_filename = "pure_david_nitzan_no_jonathan.json"
    with open(output_filename, 'w') as f:
        json.dump(final_pure_conversation, f, indent=2)
    
    print(f"✅ Saved {len(final_pure_conversation)} messages to {output_filename}")
    
    # Create Supabase-ready files
    csv_filename = "pure_david_nitzan_no_jonathan.csv"
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
        for msg in final_pure_conversation:
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
    supabase_json_filename = "pure_david_nitzan_no_jonathan_supabase.json"
    supabase_data = []
    
    for msg in final_pure_conversation:
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
    print(f"✅ Pure David-Nitzan conversation (no Jonathan): {len(final_pure_conversation)} messages")
    print(f"📅 Date range: {final_pure_conversation[0].get('readable_date')} to {final_pure_conversation[-1].get('readable_date')}")
    print(f"👥 David: {david_count} messages | Nitzan: {nitzan_count} messages")
    print(f"📊 Balance: {david_count/len(final_pure_conversation)*100:.1f}% David, {nitzan_count/len(final_pure_conversation)*100:.1f}% Nitzan")
    print(f"❌ Jonathan messages excluded: {len(jonathan_messages)}")
    print(f"📁 Files created:")
    print(f"  - {output_filename}")
    print(f"  - {csv_filename}")
    print(f"  - {supabase_json_filename}")
    print(f"✅ Now truly only David-Nitzan conversations!")

if __name__ == "__main__":
    fix_jonathan_phone_number() 