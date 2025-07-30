#!/usr/bin/env python3
"""
Create a TSV version of the dataset to avoid CSV parsing issues
"""

import json
import csv

def create_tsv_version():
    """Create a TSV version of the dataset"""
    
    print("📊 CREATING TSV VERSION")
    print("=" * 30)
    
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
    
    # Create TSV version
    print(f"\n💾 CREATING TSV FILE:")
    print("=" * 25)
    
    output_tsv = "final_datasets/supabase_compatible_david_nitzan_conversation.tsv"
    
    with open(output_tsv, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f, delimiter='\t')
        
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
            
            # Replace problematic characters
            text = text.replace('\n', ' ').replace('\r', ' ').replace('\t', ' ')
            
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
    
    print(f"✅ Created TSV: {output_tsv}")
    
    # Also create a simple CSV without quotes
    print(f"\n💾 CREATING SIMPLE CSV:")
    print("=" * 25)
    
    output_simple = "final_datasets/supabase_compatible_david_nitzan_conversation_simple.csv"
    
    with open(output_simple, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f, quoting=csv.QUOTE_NONE, escapechar='\\')
        
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
            
            # Replace problematic characters
            text = text.replace('\n', ' ').replace('\r', ' ').replace('\t', ' ')
            text = text.replace(',', ' ').replace('"', "'")  # Replace commas and quotes
            
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
    
    print(f"✅ Created simple CSV: {output_simple}")
    
    # Test the TSV file
    print(f"\n🔍 TESTING TSV FILE:")
    print("=" * 25)
    
    with open(output_tsv, 'r', encoding='utf-8') as f:
        reader = csv.reader(f, delimiter='\t')
        header = next(reader)
        print(f"Header: {header}")
        
        for i, row in enumerate(reader, 1):
            if i <= 3:
                print(f"Row {i}: {row[:3]}...")  # Show first 3 fields
            else:
                break
    
    print(f"\n🎉 ALTERNATIVE FORMATS CREATED!")
    print("=" * 35)
    print(f"✅ Created TSV file (tab-separated)")
    print(f"✅ Created simple CSV (no quotes, no commas in text)")
    print(f"📁 Files created:")
    print(f"  - {output_tsv}")
    print(f"  - {output_simple}")
    print(f"✅ Try importing the TSV file or simple CSV")

if __name__ == "__main__":
    create_tsv_version() 