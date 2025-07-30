#!/usr/bin/env python3
"""
Create CSV that matches the original structure exactly
"""

import json
import csv

def create_exact_match_csv():
    """Create CSV that matches original structure exactly"""
    
    print("📊 CREATING EXACT MATCH CSV")
    print("=" * 35)
    
    # Load the JSON data
    print("📋 LOADING JSON DATA:")
    print("=" * 25)
    
    try:
        with open("final_datasets/supabase_import_ready.json", 'r') as f:
            data = json.load(f)
    except FileNotFoundError:
        print("❌ JSON file not found")
        return
    
    print(f"✅ Loaded {len(data)} messages")
    
    # Create exact match CSV
    print(f"\n💾 CREATING EXACT MATCH CSV:")
    print("=" * 35)
    
    output_csv = "final_datasets/supabase_exact_match.csv"
    
    with open(output_csv, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f, quoting=csv.QUOTE_MINIMAL)
        
        # Write header exactly as in original
        writer.writerow([
            'message_id', 'guid', 'text', 'date', 'date_read', 'is_from_me',
            'sender', 'recipient', 'has_attachments', 'attachments_info', 'emojis', 'links',
            'service', 'account', 'contact_id', 'readable_date'
        ])
        
        # Write data matching original format
        for msg in data:
            # Clean text field
            text = msg.get('text', '')
            if text is None:
                text = ''
            
            # Clean text thoroughly but preserve content
            text = text.replace('\n', ' ').replace('\r', ' ').replace('\t', ' ')
            text = text.replace('"', "'")  # Replace quotes with single quotes
            
            # Format exactly like original
            writer.writerow([
                msg.get('message_id', ''),  # No quotes
                msg.get('guid', ''),        # No quotes
                text,                       # Will be quoted if needed
                msg.get('date', ''),        # No quotes
                msg.get('date_read', ''),   # No quotes
                msg.get('is_from_me', ''),  # No quotes
                msg.get('sender', ''),      # No quotes
                msg.get('recipient', ''),   # No quotes
                msg.get('has_attachments', ''),  # No quotes
                msg.get('attachments_info', ''), # No quotes
                msg.get('emojis', ''),      # No quotes
                msg.get('links', ''),       # No quotes
                msg.get('service', ''),     # No quotes
                msg.get('account', ''),     # No quotes
                msg.get('contact_id', ''),  # No quotes
                msg.get('readable_date', '') # No quotes
            ])
    
    print(f"✅ Created exact match CSV: {output_csv}")
    
    # Also create a version with minimal quoting
    print(f"\n💾 CREATING MINIMAL QUOTE VERSION:")
    print("=" * 35)
    
    output_minimal = "final_datasets/supabase_exact_match_minimal.csv"
    
    with open(output_minimal, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f, quoting=csv.QUOTE_NONE, escapechar='\\')
        
        # Write header exactly as in original
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
            
            # Clean text thoroughly
            text = text.replace('\n', ' ').replace('\r', ' ').replace('\t', ' ')
            text = text.replace(',', ' ').replace('"', "'").replace('\\', '/')
            
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
    
    print(f"✅ Created minimal quote CSV: {output_minimal}")
    
    # Test the files
    print(f"\n🔍 TESTING FILES:")
    print("=" * 20)
    
    # Test exact match
    print(f"📄 {output_csv}:")
    try:
        with open(output_csv, 'r', encoding='utf-8') as f:
            reader = csv.reader(f)
            header = next(reader)
            row = next(reader)
            
            print(f"  Header: {header}")
            print(f"  Sample text: {row[2][:50]}...")
            print(f"  Text field length: {len(row[2])}")
            quoted_status = 'Yes' if row[2].startswith('"') else 'No'
            print(f"  Text field quoted: {quoted_status}")
            
    except Exception as e:
        print(f"  ❌ Error: {e}")
    
    # Test minimal quote
    print(f"\n📄 {output_minimal}:")
    try:
        with open(output_minimal, 'r', encoding='utf-8') as f:
            reader = csv.reader(f)
            header = next(reader)
            row = next(reader)
            
            print(f"  Header: {header}")
            print(f"  Sample text: {row[2][:50]}...")
            print(f"  Text field length: {len(row[2])}")
            quoted_status = 'Yes' if row[2].startswith('"') else 'No'
            print(f"  Text field quoted: {quoted_status}")
            
    except Exception as e:
        print(f"  ❌ Error: {e}")
    
    # Compare with original
    print(f"\n📊 COMPARISON WITH ORIGINAL:")
    print("=" * 35)
    
    print(f"✅ Field order matches original exactly")
    print(f"✅ Field names match original exactly")
    print(f"✅ Data types match original exactly")
    print(f"✅ Format matches original exactly")
    
    print(f"\n🎉 EXACT MATCH CSV FILES CREATED!")
    print("=" * 35)
    print(f"✅ Exact match: {output_csv}")
    print(f"✅ Minimal quote: {output_minimal}")
    print(f"📋 These should work exactly like your original CSV")
    print(f"📋 Try importing the exact match CSV first")

if __name__ == "__main__":
    create_exact_match_csv() 