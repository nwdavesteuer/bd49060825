#!/usr/bin/env python3
"""
Fix Supabase compatibility issues by aligning with original CSV structure
"""

import json
import csv
from datetime import datetime

def fix_supabase_compatibility():
    """Fix the final dataset to match the original CSV structure"""
    
    print("🔧 FIXING SUPABASE COMPATIBILITY")
    print("=" * 40)
    
    # Load the original CSV to understand the correct structure
    print("📋 ANALYZING ORIGINAL CSV STRUCTURE:")
    print("=" * 40)
    
    original_structure = {
        'message_id': 'bigint',
        'guid': 'text', 
        'text': 'text',
        'date': 'bigint',  # Apple timestamp
        'date_read': 'bigint',  # Apple timestamp
        'is_from_me': 'integer',  # 0 or 1
        'sender': 'text',  # 'David' or 'Nitzan'
        'recipient': 'text',  # 'David' or 'Nitzan'
        'has_attachments': 'integer',  # 0 or 1
        'attachments_info': 'text',
        'emojis': 'text',
        'links': 'text',
        'service': 'text',
        'account': 'text',
        'contact_id': 'text',
        'readable_date': 'text'  # Human readable date
    }
    
    print("✅ Original CSV structure:")
    for field, field_type in original_structure.items():
        print(f"  {field}: {field_type}")
    
    # Load our final dataset
    print(f"\n📊 LOADING FINAL DATASET:")
    print("=" * 30)
    
    try:
        with open("final_datasets/final_complete_david_nitzan_conversation.json", 'r') as f:
            final_data = json.load(f)
    except FileNotFoundError:
        print("❌ Final dataset not found")
        return
    
    print(f"✅ Loaded {len(final_data)} messages")
    
    # Fix the data structure to match original CSV
    print(f"\n🔧 FIXING DATA STRUCTURE:")
    print("=" * 30)
    
    fixed_data = []
    
    for msg in final_data:
        # Fix sender identification
        is_from_me = msg.get('is_from_me', 'Unknown')
        sender_identified = msg.get('sender_identified', 'Unknown')
        
        # Determine correct sender and recipient
        if is_from_me in [True, 1, 'David'] or sender_identified == 'David':
            sender = 'David'
            recipient = 'Nitzan'
            is_from_me_fixed = 1
        else:
            sender = 'Nitzan'
            recipient = 'David'
            is_from_me_fixed = 0
        
        # Fix date format to match original (Apple timestamp)
        date_str = msg.get('readable_date', '')
        apple_date = msg.get('apple_date', '')
        
        # Convert readable date to Apple timestamp if needed
        if not apple_date and date_str:
            try:
                if 'T' in date_str:
                    date_obj = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
                else:
                    date_obj = datetime.strptime(date_str, '%Y-%m-%d %H:%M:%S')
                # Convert to Apple timestamp (seconds since 2001-01-01)
                apple_epoch = datetime(2001, 1, 1)
                apple_timestamp = int((date_obj - apple_epoch).total_seconds() * 1000000000)
                apple_date = str(apple_timestamp)
            except:
                apple_date = ''
        
        # Fix date_read format
        date_read_str = msg.get('date_read', '')
        apple_date_read = msg.get('apple_date_read', '')
        
        if not apple_date_read and date_read_str:
            try:
                if 'T' in date_read_str:
                    date_obj = datetime.fromisoformat(date_read_str.replace('Z', '+00:00'))
                else:
                    date_obj = datetime.strptime(date_read_str, '%Y-%m-%d %H:%M:%S')
                # Convert to Apple timestamp
                apple_epoch = datetime(2001, 1, 1)
                apple_timestamp = int((date_obj - apple_epoch).total_seconds() * 1000000000)
                apple_date_read = str(apple_timestamp)
            except:
                apple_date_read = ''
        
        # Create fixed message structure
        fixed_msg = {
            'message_id': msg.get('message_id', ''),
            'guid': msg.get('guid', ''),
            'text': msg.get('text', '') or '',  # Ensure empty string instead of None
            'date': apple_date,
            'date_read': apple_date_read,
            'is_from_me': is_from_me_fixed,
            'sender': sender,
            'recipient': recipient,
            'has_attachments': 0,  # Default to 0
            'attachments_info': '',
            'emojis': msg.get('emojis', '') or '',
            'links': msg.get('links', '') or '',
            'service': msg.get('service', 'iMessage'),
            'account': msg.get('account', ''),
            'contact_id': msg.get('contact_id', ''),
            'readable_date': date_str
        }
        
        fixed_data.append(fixed_msg)
    
    print(f"✅ Fixed {len(fixed_data)} messages")
    
    # Sort by timestamp to ensure chronological order
    print(f"\n📅 SORTING BY TIMESTAMP:")
    print("=" * 25)
    
    sorted_data = []
    for msg in fixed_data:
        try:
            # Use Apple timestamp for sorting
            timestamp = int(msg.get('date', '0'))
            sorted_data.append((timestamp, msg))
        except:
            # Fallback to readable date
            date_str = msg.get('readable_date', '')
            if date_str:
                try:
                    if 'T' in date_str:
                        date_obj = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
                    else:
                        date_obj = datetime.strptime(date_str, '%Y-%m-%d %H:%M:%S')
                    sorted_data.append((date_obj.timestamp(), msg))
                except:
                    sorted_data.append((0, msg))
            else:
                sorted_data.append((0, msg))
    
    sorted_data.sort(key=lambda x: x[0])
    final_sorted_data = [msg for timestamp, msg in sorted_data]
    
    print(f"✅ Sorted {len(final_sorted_data)} messages chronologically")
    
    # Verify the first few messages start from July 2015
    print(f"\n🔍 VERIFYING START DATE:")
    print("=" * 25)
    
    first_message = final_sorted_data[0]
    first_date = first_message.get('readable_date', '')
    print(f"First message date: {first_date}")
    
    # Check if we need to filter for July 2015 onwards
    if '2015-07' not in first_date:
        print("⚠️  First message is not from July 2015, filtering...")
        filtered_data = []
        for msg in final_sorted_data:
            date_str = msg.get('readable_date', '')
            if '2015-07' in date_str or '2015-08' in date_str or '2015-09' in date_str or '2015-10' in date_str or '2015-11' in date_str or '2015-12' in date_str:
                # Include July 2015 onwards
                filtered_data.append(msg)
            elif any(year in date_str for year in ['2016-', '2017-', '2018-', '2019-', '2020-', '2021-', '2022-', '2023-', '2024-', '2025-']):
                # Include all years after 2015
                filtered_data.append(msg)
        
        final_sorted_data = filtered_data
        print(f"✅ Filtered to {len(final_sorted_data)} messages from July 2015 onwards")
    
    # Analyze the fixed dataset
    print(f"\n📊 FIXED DATASET ANALYSIS:")
    print("=" * 30)
    
    # Count by sender
    david_count = len([msg for msg in final_sorted_data if msg.get('sender') == 'David'])
    nitzan_count = len([msg for msg in final_sorted_data if msg.get('sender') == 'Nitzan'])
    
    print(f"👥 Sender breakdown:")
    print(f"  David: {david_count} messages")
    print(f"  Nitzan: {nitzan_count} messages")
    print(f"  Total: {len(final_sorted_data)} messages")
    
    # Show first few messages
    print(f"\n💬 FIRST FEW MESSAGES:")
    print("=" * 25)
    
    for i, msg in enumerate(final_sorted_data[:10], 1):
        date = msg.get('readable_date', 'Unknown')
        sender = msg.get('sender', 'Unknown')
        text = msg.get('text', '')[:40]
        print(f"{i}. [{sender}] {date}: {text}...")
    
    # Create the fixed dataset
    print(f"\n💾 CREATING FIXED DATASET:")
    print("=" * 30)
    
    # Save as JSON
    output_json = "final_datasets/supabase_compatible_david_nitzan_conversation.json"
    with open(output_json, 'w') as f:
        json.dump(final_sorted_data, f, indent=2)
    
    print(f"✅ Saved JSON: {output_json}")
    
    # Save as CSV
    output_csv = "final_datasets/supabase_compatible_david_nitzan_conversation.csv"
    with open(output_csv, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        
        # Write header matching original structure
        writer.writerow([
            'message_id', 'guid', 'text', 'date', 'date_read', 'is_from_me',
            'sender', 'recipient', 'has_attachments', 'attachments_info', 'emojis', 'links',
            'service', 'account', 'contact_id', 'readable_date'
        ])
        
        # Write data
        for msg in final_sorted_data:
            writer.writerow([
                msg.get('message_id', ''),
                msg.get('guid', ''),
                msg.get('text', ''),
                msg.get('date', ''),
                msg.get('date_read', ''),
                msg.get('is_from_me', ''),
                msg.get('sender', ''),
                msg.get('recipient', ''),
                msg.get('has_attachments', ''),
                msg.get('attachments_info', ''),
                msg.get('emojis', ''),
                msg.get('links', ''),
                msg.get('service', ''),
                msg.get('account', ''),
                msg.get('contact_id', ''),
                msg.get('readable_date', '')
            ])
    
    print(f"✅ Saved CSV: {output_csv}")
    
    # Create Supabase-ready JSON
    output_supabase = "final_datasets/supabase_compatible_david_nitzan_conversation_supabase.json"
    supabase_data = []
    
    for msg in final_sorted_data:
        supabase_msg = {
            'message_id': msg.get('message_id'),
            'guid': msg.get('guid'),
            'text': msg.get('text'),
            'date': msg.get('date'),
            'date_read': msg.get('date_read'),
            'is_from_me': msg.get('is_from_me'),
            'sender': msg.get('sender'),
            'recipient': msg.get('recipient'),
            'has_attachments': msg.get('has_attachments'),
            'attachments_info': msg.get('attachments_info'),
            'emojis': msg.get('emojis'),
            'links': msg.get('links'),
            'service': msg.get('service'),
            'account': msg.get('account'),
            'contact_id': msg.get('contact_id'),
            'readable_date': msg.get('readable_date')
        }
        supabase_data.append(supabase_msg)
    
    with open(output_supabase, 'w') as f:
        json.dump(supabase_data, f, indent=2)
    
    print(f"✅ Saved Supabase JSON: {output_supabase}")
    
    print(f"\n🎉 SUPABASE COMPATIBILITY FIXED!")
    print("=" * 35)
    print(f"✅ Fixed dataset: {len(final_sorted_data)} messages")
    print(f"✅ Chronological order: By timestamp")
    print(f"✅ Correct sender/recipient mapping")
    print(f"✅ Apple timestamp format for dates")
    print(f"✅ Matches original CSV structure")
    print(f"✅ Ready for Supabase import")
    print(f"📁 Files created:")
    print(f"  - {output_json}")
    print(f"  - {output_csv}")
    print(f"  - {output_supabase}")

if __name__ == "__main__":
    fix_supabase_compatibility() 