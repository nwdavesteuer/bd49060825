#!/usr/bin/env python3
"""
Filter out messages from the wrong David and keep only actual David-Nitzan conversations
"""

import json
from datetime import datetime

def filter_correct_david_nitzan():
    """Filter out messages from the wrong David and keep only actual David-Nitzan conversations"""
    
    print("🔍 FILTERING CORRECT DAVID-NITZAN MESSAGES")
    print("=" * 50)
    
    # Load the final dataset
    try:
        with open("final_direct_david_nitzan_20250727_210753.json", 'r') as f:
            data = json.load(f)
    except FileNotFoundError:
        print("❌ Final dataset not found")
        return
    
    print(f"📊 Original total messages: {len(data)}")
    
    # Filter for messages from July 2015 onwards
    correct_messages = []
    wrong_messages = []
    
    for msg in data:
        date_str = msg.get('readable_date', '')
        if not date_str:
            continue
            
        try:
            # Parse the date
            if 'T' in date_str:
                # ISO format
                date_obj = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
            else:
                # Try other formats
                date_obj = datetime.strptime(date_str, '%Y-%m-%d %H:%M:%S')
            
            # Check if it's from July 2015 onwards
            if date_obj >= datetime(2015, 7, 1):
                correct_messages.append(msg)
            else:
                wrong_messages.append(msg)
                
        except:
            # If we can't parse the date, skip it
            continue
    
    print(f"✅ Correct messages (July 2015 onwards): {len(correct_messages)}")
    print(f"❌ Wrong messages (before July 2015): {len(wrong_messages)}")
    
    # Analyze the wrong messages to confirm they're from different people
    print(f"\n📋 ANALYSIS OF WRONG MESSAGES:")
    print("=" * 40)
    
    # Group wrong messages by year
    wrong_by_year = {}
    for msg in wrong_messages:
        year = msg.get('year')
        if year:
            if year not in wrong_by_year:
                wrong_by_year[year] = []
            wrong_by_year[year].append(msg)
    
    for year in sorted(wrong_by_year.keys()):
        messages = wrong_by_year[year]
        print(f"\n📅 {year} ({len(messages)} messages):")
        
        # Show first few messages from each year
        for i, msg in enumerate(messages[:5], 1):
            date = msg.get('readable_date', 'Unknown')
            text = msg.get('text', '')[:60]
            sender = "David" if msg.get('is_from_me') == 'David' else "Nitzan"
            print(f"  {i}. [{sender}] {date}: {text}...")
        
        if len(messages) > 5:
            print(f"  ... and {len(messages) - 5} more messages")
    
    # Show some examples of the wrong messages to confirm they're different people
    print(f"\n🔍 EXAMPLES OF WRONG MESSAGES (Different David):")
    print("=" * 55)
    
    for msg in wrong_messages[:10]:
        date = msg.get('readable_date', 'Unknown')
        text = msg.get('text', '')[:80]
        sender = "David" if msg.get('is_from_me') == 'David' else "Nitzan"
        print(f"  [{sender}] {date}: {text}...")
    
    # Create the corrected dataset
    print(f"\n💾 CREATING CORRECTED DATASET")
    print("=" * 35)
    
    # Save the correct messages
    output_filename = "correct_david_nitzan_messages.json"
    with open(output_filename, 'w') as f:
        json.dump(correct_messages, f, indent=2)
    
    print(f"✅ Saved {len(correct_messages)} correct messages to {output_filename}")
    
    # Analyze the correct messages
    print(f"\n📊 ANALYSIS OF CORRECT MESSAGES:")
    print("=" * 40)
    
    # Count by year
    correct_by_year = {}
    for msg in correct_messages:
        year = msg.get('year')
        if year:
            if year not in correct_by_year:
                correct_by_year[year] = 0
            correct_by_year[year] += 1
    
    print("📅 Messages by year:")
    for year in sorted(correct_by_year.keys()):
        count = correct_by_year[year]
        print(f"  {year}: {count} messages")
    
    # Count by sender
    david_count = 0
    nitzan_count = 0
    for msg in correct_messages:
        sender = msg.get('is_from_me', 'Unknown')
        if sender == 'David':
            david_count += 1
        else:
            nitzan_count += 1
    
    print(f"\n👥 Sender breakdown:")
    print(f"  David: {david_count} messages")
    print(f"  Nitzan: {nitzan_count} messages")
    
    # Show first few correct messages
    print(f"\n📱 FIRST FEW CORRECT MESSAGES:")
    print("=" * 35)
    
    # Sort by date
    sorted_correct = []
    for msg in correct_messages:
        date_str = msg.get('readable_date')
        if date_str:
            try:
                if 'T' in date_str:
                    date_obj = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
                else:
                    date_obj = datetime.strptime(date_str, '%Y-%m-%d %H:%M:%S')
                sorted_correct.append((date_obj, msg))
            except:
                continue
    
    sorted_correct.sort(key=lambda x: x[0])
    
    for i, (date, msg) in enumerate(sorted_correct[:10], 1):
        sender = "David" if msg.get('is_from_me') == 'David' else "Nitzan"
        text = msg.get('text', '')[:50]
        print(f"{i}. [{sender}] {date}: {text}...")
    
    # Create Supabase-ready files
    print(f"\n🗄️  CREATING SUPABASE-READY FILES")
    print("=" * 35)
    
    # Create CSV for Supabase
    csv_filename = "correct_david_nitzan_messages.csv"
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
        for msg in correct_messages:
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
    supabase_json_filename = "correct_david_nitzan_messages_supabase.json"
    supabase_data = []
    
    for msg in correct_messages:
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
    
    print(f"\n🎉 SUMMARY:")
    print("=" * 20)
    print(f"✅ Correct David-Nitzan messages: {len(correct_messages)}")
    print(f"❌ Wrong messages filtered out: {len(wrong_messages)}")
    print(f"📅 Date range: July 2015 onwards")
    print(f"📁 Files created:")
    print(f"  - {output_filename}")
    print(f"  - {csv_filename}")
    print(f"  - {supabase_json_filename}")

if __name__ == "__main__":
    filter_correct_david_nitzan() 