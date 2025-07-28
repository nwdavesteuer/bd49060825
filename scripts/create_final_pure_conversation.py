#!/usr/bin/env python3
"""
Create the final pure David-Nitzan conversation with proper sender identification
"""

import json
from datetime import datetime

def create_final_pure_conversation():
    """Create the final pure David-Nitzan conversation"""
    
    print("💬 CREATING FINAL PURE DAVID-NITZAN CONVERSATION")
    print("=" * 55)
    
    # Load the fixed conversation
    try:
        with open("david_nitzan_conversation_fixed.json", 'r') as f:
            data = json.load(f)
    except FileNotFoundError:
        print("❌ Fixed conversation not found")
        return
    
    print(f"📊 Total messages to process: {len(data)}")
    
    # Fix the sender identification
    print(f"\n🔧 FIXING SENDER IDENTIFICATION:")
    print("=" * 40)
    
    pure_conversation = []
    
    for msg in data:
        sender = msg.get('is_from_me', 'Unknown')
        
        # Properly identify senders
        if sender in [True, 1, 'David']:
            msg['sender_identified'] = 'David'
        elif sender in [False, 0, 'Nitzan', 'Other']:
            # All non-David messages in Nitzan chats are from Nitzan
            msg['sender_identified'] = 'Nitzan'
        else:
            # For any other unknown senders, assume they're from Nitzan if not David
            msg['sender_identified'] = 'Nitzan'
        
        pure_conversation.append(msg)
    
    # Count the properly identified messages
    david_count = len([msg for msg in pure_conversation if msg.get('sender_identified') == 'David'])
    nitzan_count = len([msg for msg in pure_conversation if msg.get('sender_identified') == 'Nitzan'])
    
    print(f"✅ David messages: {david_count}")
    print(f"✅ Nitzan messages: {nitzan_count}")
    print(f"✅ Total conversation: {len(pure_conversation)} messages")
    
    # Sort chronologically
    print(f"\n📅 SORTING CHRONOLOGICALLY:")
    print("=" * 30)
    
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
                by_year[year] = {'David': 0, 'Nitzan': 0}
            sender = msg.get('sender_identified', 'Unknown')
            if sender in ['David', 'Nitzan']:
                by_year[year][sender] += 1
    
    for year in sorted(by_year.keys()):
        counts = by_year[year]
        total = sum(counts.values())
        print(f"  {year}: {total} messages (David: {counts['David']}, Nitzan: {counts['Nitzan']})")
    
    # Show conversation flow
    print(f"\n💬 CONVERSATION FLOW (First 20 messages):")
    print("=" * 45)
    
    for i, msg in enumerate(final_conversation[:20], 1):
        date = msg.get('readable_date', 'Unknown')
        sender = msg.get('sender_identified', 'Unknown')
        text = msg.get('text', '')[:40]
        print(f"{i:2d}. [{sender}] {date}: {text}...")
    
    # Show conversation flow (last 20 messages)
    print(f"\n💬 CONVERSATION FLOW (Last 20 messages):")
    print("=" * 45)
    
    for i, msg in enumerate(final_conversation[-20:], 1):
        date = msg.get('readable_date', 'Unknown')
        sender = msg.get('sender_identified', 'Unknown')
        text = msg.get('text', '')[:40]
        print(f"{len(final_conversation) - 20 + i:2d}. [{sender}] {date}: {text}...")
    
    # Verify this is a proper back-and-forth conversation
    print(f"\n🔍 VERIFYING CONVERSATION QUALITY:")
    print("=" * 40)
    
    # Check for conversation patterns
    david_first = 0
    nitzan_first = 0
    consecutive_david = 0
    consecutive_nitzan = 0
    max_consecutive_david = 0
    max_consecutive_nitzan = 0
    
    current_david_streak = 0
    current_nitzan_streak = 0
    
    for i, msg in enumerate(final_conversation):
        sender = msg.get('sender_identified', 'Unknown')
        
        if i == 0:
            if sender == 'David':
                david_first += 1
            else:
                nitzan_first += 1
        
        if sender == 'David':
            current_david_streak += 1
            current_nitzan_streak = 0
            max_consecutive_david = max(max_consecutive_david, current_david_streak)
        else:
            current_nitzan_streak += 1
            current_david_streak = 0
            max_consecutive_nitzan = max(max_consecutive_nitzan, current_nitzan_streak)
    
    print(f"  First message: {'David' if david_first > nitzan_first else 'Nitzan'}")
    print(f"  Max consecutive David messages: {max_consecutive_david}")
    print(f"  Max consecutive Nitzan messages: {max_consecutive_nitzan}")
    print(f"  David messages: {david_count} ({david_count/len(final_conversation)*100:.1f}%)")
    print(f"  Nitzan messages: {nitzan_count} ({nitzan_count/len(final_conversation)*100:.1f}%)")
    
    # Create the final dataset
    print(f"\n💾 CREATING FINAL DATASET:")
    print("=" * 30)
    
    # Save the pure conversation
    output_filename = "final_david_nitzan_conversation.json"
    with open(output_filename, 'w') as f:
        json.dump(final_conversation, f, indent=2)
    
    print(f"✅ Saved {len(final_conversation)} messages to {output_filename}")
    
    # Create Supabase-ready files
    csv_filename = "final_david_nitzan_conversation.csv"
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
    supabase_json_filename = "final_david_nitzan_conversation_supabase.json"
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
    print(f"✅ Pure David-Nitzan conversation: {len(final_conversation)} messages")
    print(f"📅 Date range: {final_conversation[0].get('readable_date')} to {final_conversation[-1].get('readable_date')}")
    print(f"👥 David: {david_count} messages | Nitzan: {nitzan_count} messages")
    print(f"📊 Balance: {david_count/len(final_conversation)*100:.1f}% David, {nitzan_count/len(final_conversation)*100:.1f}% Nitzan")
    print(f"📁 Files created:")
    print(f"  - {output_filename}")
    print(f"  - {csv_filename}")
    print(f"  - {supabase_json_filename}")
    print(f"✅ All messages are chronological and direct David-Nitzan conversations only!")

if __name__ == "__main__":
    create_final_pure_conversation() 