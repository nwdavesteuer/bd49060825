#!/usr/bin/env python3
"""
Create the final complete dataset with proper sender identification
"""

import json
from datetime import datetime

def create_final_complete_dataset():
    """Create the final complete dataset with proper sender identification"""
    
    print("🎯 CREATING FINAL COMPLETE DATASET")
    print("=" * 45)
    
    # Load the complete dataset
    try:
        with open("complete_david_nitzan_conversation.json", 'r') as f:
            data = json.load(f)
    except FileNotFoundError:
        print("❌ Complete dataset not found")
        return
    
    print(f"📊 Total messages to process: {len(data)}")
    
    # Filter out messages from 2000 (wrong data) and fix sender identification
    print(f"\n🔧 FILTERING AND FIXING SENDER IDENTIFICATION:")
    print("=" * 50)
    
    filtered_messages = []
    
    for msg in data:
        date_str = msg.get('readable_date', '')
        
        # Skip messages from 2000 (wrong data)
        if '2000-12-31' in date_str:
            continue
            
        # Fix sender identification
        sender = msg.get('is_from_me', 'Unknown')
        
        if sender in [True, 1, 'David']:
            msg['sender_identified'] = 'David'
        elif sender in [False, 0, 'Nitzan', 'Other']:
            msg['sender_identified'] = 'Nitzan'
        else:
            # For any other unknown senders, assume they're from Nitzan if not David
            msg['sender_identified'] = 'Nitzan'
        
        filtered_messages.append(msg)
    
    print(f"✅ Filtered messages: {len(filtered_messages)}")
    
    # Sort chronologically
    print(f"\n📅 SORTING CHRONOLOGICALLY:")
    print("=" * 30)
    
    sorted_messages = []
    for msg in filtered_messages:
        date_str = msg.get('readable_date', '')
        if date_str:
            try:
                if 'T' in date_str:
                    date_obj = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
                else:
                    date_obj = datetime.strptime(date_str, '%Y-%m-%d %H:%M:%S')
                sorted_messages.append((date_obj, msg))
            except:
                continue
    
    sorted_messages.sort(key=lambda x: x[0])
    final_complete_dataset = [msg for date, msg in sorted_messages]
    
    print(f"✅ Chronologically sorted: {len(final_complete_dataset)} messages")
    
    # Analyze the complete dataset
    print(f"\n📊 COMPLETE DATASET ANALYSIS:")
    print("=" * 35)
    
    # Count by year
    by_year = {}
    for msg in final_complete_dataset:
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
    david_count = len([msg for msg in final_complete_dataset if msg.get('sender_identified') == 'David'])
    nitzan_count = len([msg for msg in final_complete_dataset if msg.get('sender_identified') == 'Nitzan'])
    
    print(f"\n👥 Sender breakdown:")
    print(f"  David: {david_count} messages")
    print(f"  Nitzan: {nitzan_count} messages")
    print(f"  Total: {len(final_complete_dataset)} messages")
    
    # Show conversation flow
    print(f"\n💬 CONVERSATION FLOW (First 20 messages):")
    print("=" * 45)
    
    for i, msg in enumerate(final_complete_dataset[:20], 1):
        date = msg.get('readable_date', 'Unknown')
        sender = msg.get('sender_identified', 'Unknown')
        text = msg.get('text', '')[:40]
        print(f"{i:2d}. [{sender}] {date}: {text}...")
    
    # Show conversation flow (last 20 messages)
    print(f"\n💬 CONVERSATION FLOW (Last 20 messages):")
    print("=" * 45)
    
    for i, msg in enumerate(final_complete_dataset[-20:], 1):
        date = msg.get('readable_date', 'Unknown')
        sender = msg.get('sender_identified', 'Unknown')
        text = msg.get('text', '')[:40]
        print(f"{len(final_complete_dataset) - 20 + i:2d}. [{sender}] {date}: {text}...")
    
    # Verify this is a proper back-and-forth conversation
    print(f"\n🔍 VERIFYING CONVERSATION QUALITY:")
    print("=" * 40)
    
    # Check for conversation patterns
    david_first = 0
    nitzan_first = 0
    max_consecutive_david = 0
    max_consecutive_nitzan = 0
    
    current_david_streak = 0
    current_nitzan_streak = 0
    
    for i, msg in enumerate(final_complete_dataset):
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
    print(f"  David messages: {david_count} ({david_count/len(final_complete_dataset)*100:.1f}%)")
    print(f"  Nitzan messages: {nitzan_count} ({nitzan_count/len(final_complete_dataset)*100:.1f}%)")
    
    # Create the final complete dataset
    print(f"\n💾 CREATING FINAL COMPLETE DATASET:")
    print("=" * 40)
    
    # Save the complete dataset
    output_filename = "final_complete_david_nitzan_conversation.json"
    with open(output_filename, 'w') as f:
        json.dump(final_complete_dataset, f, indent=2)
    
    print(f"✅ Saved {len(final_complete_dataset)} messages to {output_filename}")
    
    # Create Supabase-ready files
    csv_filename = "final_complete_david_nitzan_conversation.csv"
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
        for msg in final_complete_dataset:
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
    supabase_json_filename = "final_complete_david_nitzan_conversation_supabase.json"
    supabase_data = []
    
    for msg in final_complete_dataset:
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
    
    print(f"\n🎉 FINAL COMPLETE DATASET SUMMARY:")
    print("=" * 35)
    print(f"✅ Complete David-Nitzan conversation: {len(final_complete_dataset)} messages")
    print(f"📅 Date range: {final_complete_dataset[0].get('readable_date')} to {final_complete_dataset[-1].get('readable_date')}")
    print(f"👥 David: {david_count} messages | Nitzan: {nitzan_count} messages")
    print(f"📊 Balance: {david_count/len(final_complete_dataset)*100:.1f}% David, {nitzan_count/len(final_complete_dataset)*100:.1f}% Nitzan")
    print(f"📁 Files created:")
    print(f"  - {output_filename}")
    print(f"  - {csv_filename}")
    print(f"  - {supabase_json_filename}")
    print(f"✅ This is the complete dataset from all sources with proper sender identification!")

if __name__ == "__main__":
    create_final_complete_dataset() 