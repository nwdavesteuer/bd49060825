#!/usr/bin/env python3
"""
Fix the CSV text field issue by properly escaping text content
"""

import json
import csv
from datetime import datetime

def fix_csv_text_field():
    """Fix the CSV text field issue by properly escaping text content"""
    
    print("🔧 FIXING CSV TEXT FIELD ISSUE")
    print("=" * 40)
    
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
    
    # Create properly formatted CSV
    print(f"\n💾 CREATING FIXED CSV:")
    print("=" * 25)
    
    output_csv = "final_datasets/supabase_compatible_david_nitzan_conversation_fixed.csv"
    
    with open(output_csv, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f, quoting=csv.QUOTE_ALL)  # Quote all fields
        
        # Write header
        writer.writerow([
            'message_id', 'guid', 'text', 'date', 'date_read', 'is_from_me',
            'sender', 'recipient', 'has_attachments', 'attachments_info', 'emojis', 'links',
            'service', 'account', 'contact_id', 'readable_date'
        ])
        
        # Write data with proper escaping
        for msg in data:
            # Clean and escape text field
            text = msg.get('text', '')
            if text is None:
                text = ''
            
            # Replace any problematic characters
            text = text.replace('\n', ' ').replace('\r', ' ').replace('\t', ' ')
            
            writer.writerow([
                msg.get('message_id', ''),
                msg.get('guid', ''),
                text,  # This will be properly quoted
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
    
    print(f"✅ Created fixed CSV: {output_csv}")
    
    # Also create a version with minimal quoting for better compatibility
    print(f"\n💾 CREATING MINIMAL QUOTE VERSION:")
    print("=" * 35)
    
    output_csv_minimal = "final_datasets/supabase_compatible_david_nitzan_conversation_minimal.csv"
    
    with open(output_csv_minimal, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f, quoting=csv.QUOTE_MINIMAL)  # Only quote when necessary
        
        # Write header
        writer.writerow([
            'message_id', 'guid', 'text', 'date', 'date_read', 'is_from_me',
            'sender', 'recipient', 'has_attachments', 'attachments_info', 'emojis', 'links',
            'service', 'account', 'contact_id', 'readable_date'
        ])
        
        # Write data with minimal quoting
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
    
    print(f"✅ Created minimal quote CSV: {output_csv_minimal}")
    
    # Test the first few lines of the fixed CSV
    print(f"\n🔍 TESTING FIXED CSV:")
    print("=" * 25)
    
    with open(output_csv, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        header = next(reader)
        print(f"Header: {header}")
        
        for i, row in enumerate(reader, 1):
            if i <= 3:
                print(f"Row {i}: {row[:3]}...")  # Show first 3 fields
            else:
                break
    
    print(f"\n🎉 CSV TEXT FIELD FIXED!")
    print("=" * 25)
    print(f"✅ Created properly escaped CSV files")
    print(f"✅ Text fields will now import correctly")
    print(f"📁 Files created:")
    print(f"  - {output_csv} (all fields quoted)")
    print(f"  - {output_csv_minimal} (minimal quoting)")
    print(f"✅ Try importing the fixed CSV files")

if __name__ == "__main__":
    fix_csv_text_field() 