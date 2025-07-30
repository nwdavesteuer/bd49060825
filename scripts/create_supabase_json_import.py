#!/usr/bin/env python3
"""
Create JSON and CSV files specifically formatted for Supabase import
"""

import json
import csv
from datetime import datetime

def create_supabase_json_import():
    """Create JSON and CSV files specifically for Supabase import"""
    
    print("📊 CREATING SUPABASE-SPECIFIC IMPORTS")
    print("=" * 45)
    
    # Load the JSON data
    print("📋 LOADING JSON DATA:")
    print("=" * 25)
    
    try:
        with open("final_datasets/supabase_compatible_david_nitzan_conversation.json", 'r') as f:
            data = json.load(f)
    except FileNotFoundError:
        print("❌ JSON file not found")
        return
    
    print(f"✅ Loaded {len(data)} messages")
    
    # Create JSON for direct Supabase import
    print(f"\n💾 CREATING JSON FOR SUPABASE:")
    print("=" * 35)
    
    supabase_json = []
    
    for msg in data:
        # Clean and prepare text field
        text = msg.get('text', '')
        if text is None:
            text = ''
        
        # Clean text of problematic characters
        text = text.replace('\n', ' ').replace('\r', ' ').replace('\t', ' ')
        text = text.replace('"', "'").replace('\\', '/')  # Replace problematic characters
        
        # Create Supabase-ready record
        supabase_record = {
            'message_id': int(msg.get('message_id', 0)),
            'guid': msg.get('guid', ''),
            'text': text,
            'date': msg.get('date', ''),
            'date_read': msg.get('date_read', ''),
            'is_from_me': int(msg.get('is_from_me', 0)),
            'sender': msg.get('sender', ''),
            'recipient': msg.get('recipient', ''),
            'has_attachments': int(msg.get('has_attachments', 0)),
            'attachments_info': msg.get('attachments_info', ''),
            'emojis': msg.get('emojis', ''),
            'links': msg.get('links', ''),
            'service': msg.get('service', 'iMessage'),
            'account': msg.get('account', ''),
            'contact_id': msg.get('contact_id', ''),
            'readable_date': msg.get('readable_date', '')
        }
        
        supabase_json.append(supabase_record)
    
    # Save JSON file
    output_json = "final_datasets/supabase_import_ready.json"
    with open(output_json, 'w') as f:
        json.dump(supabase_json, f, indent=2)
    
    print(f"✅ Created JSON: {output_json}")
    
    # Create CSV with pipe delimiter (less common, should avoid conflicts)
    print(f"\n💾 CREATING PIPE-DELIMITED CSV:")
    print("=" * 35)
    
    output_pipe = "final_datasets/supabase_compatible_david_nitzan_conversation_pipe.csv"
    
    with open(output_pipe, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f, delimiter='|')
        
        # Write header
        writer.writerow([
            'message_id', 'guid', 'text', 'date', 'date_read', 'is_from_me',
            'sender', 'recipient', 'has_attachments', 'attachments_info', 'emojis', 'links',
            'service', 'account', 'contact_id', 'readable_date'
        ])
        
        # Write data
        for msg in data:
            # Clean text field
            text = msg.get('text', '')
            if text is None:
                text = ''
            
            # Clean text thoroughly
            text = text.replace('\n', ' ').replace('\r', ' ').replace('\t', ' ')
            text = text.replace('|', ' ').replace('"', "'").replace('\\', '/')
            
            writer.writerow([
                msg.get('message_id', ''),
                msg.get('guid', ''),
                text,
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
    
    print(f"✅ Created pipe-delimited CSV: {output_pipe}")
    
    # Create a minimal CSV with only essential fields
    print(f"\n💾 CREATING MINIMAL CSV:")
    print("=" * 25)
    
    output_minimal = "final_datasets/supabase_minimal_import.csv"
    
    with open(output_minimal, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f, quoting=csv.QUOTE_ALL)
        
        # Write minimal header
        writer.writerow([
            'message_id', 'guid', 'text', 'sender', 'recipient', 'readable_date'
        ])
        
        # Write minimal data
        for msg in data:
            # Clean text field
            text = msg.get('text', '')
            if text is None:
                text = ''
            
            # Clean text thoroughly
            text = text.replace('\n', ' ').replace('\r', ' ').replace('\t', ' ')
            text = text.replace('"', "'").replace('\\', '/')
            
            writer.writerow([
                msg.get('message_id', ''),
                msg.get('guid', ''),
                text,
                msg.get('sender', ''),
                msg.get('recipient', ''),
                msg.get('readable_date', '')
            ])
    
    print(f"✅ Created minimal CSV: {output_minimal}")
    
    # Test the files
    print(f"\n🔍 TESTING FILES:")
    print("=" * 20)
    
    # Test JSON
    print("📄 JSON file sample:")
    with open(output_json, 'r') as f:
        json_data = json.load(f)
        sample = json_data[0]
        print(f"  message_id: {sample['message_id']}")
        print(f"  text: {sample['text'][:50]}...")
        print(f"  sender: {sample['sender']}")
    
    # Test pipe CSV
    print("\n📄 Pipe CSV sample:")
    with open(output_pipe, 'r', encoding='utf-8') as f:
        reader = csv.reader(f, delimiter='|')
        header = next(reader)
        row = next(reader)
        print(f"  message_id: {row[0]}")
        print(f"  text: {row[2][:50]}...")
        print(f"  sender: {row[6]}")
    
    print(f"\n🎉 SUPABASE IMPORT FILES CREATED!")
    print("=" * 40)
    print(f"✅ JSON file for direct import: {output_json}")
    print(f"✅ Pipe-delimited CSV: {output_pipe}")
    print(f"✅ Minimal CSV: {output_minimal}")
    print(f"📋 Try importing the JSON file first - it should work best!")
    print(f"📋 If JSON doesn't work, try the pipe-delimited CSV")

if __name__ == "__main__":
    create_supabase_json_import() 