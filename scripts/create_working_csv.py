#!/usr/bin/env python3
"""
Create a working CSV that definitely imports text fields correctly
"""

import json
import csv

def create_working_csv():
    """Create a CSV that definitely works with Supabase text fields"""
    
    print("🔧 CREATING WORKING CSV FOR SUPABASE")
    print("=" * 45)
    
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
    
    # Create multiple versions with different approaches
    print(f"\n💾 CREATING MULTIPLE VERSIONS:")
    print("=" * 35)
    
    # Version 1: No quotes, simple approach
    print(f"📄 Creating version 1: No quotes")
    output1 = "final_datasets/supabase_working_v1.csv"
    
    with open(output1, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f, quoting=csv.QUOTE_NONE, escapechar='\\')
        
        # Write header
        writer.writerow([
            'message_id', 'guid', 'text', 'date', 'date_read', 'is_from_me',
            'sender', 'recipient', 'has_attachments', 'attachments_info', 'emojis', 'links',
            'service', 'account', 'contact_id', 'readable_date'
        ])
        
        # Write data
        for msg in data:
            # Clean text field thoroughly
            text = msg.get('text', '')
            if text is None:
                text = ''
            
            # Replace all problematic characters
            text = text.replace('\n', ' ').replace('\r', ' ').replace('\t', ' ')
            text = text.replace(',', ' ').replace('"', "'").replace('\\', '/')
            text = text.replace('|', ' ').replace(';', ' ')
            
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
    
    print(f"✅ Created: {output1}")
    
    # Version 2: Minimal fields only
    print(f"\n📄 Creating version 2: Minimal fields")
    output2 = "final_datasets/supabase_working_v2.csv"
    
    with open(output2, 'w', newline='', encoding='utf-8') as f:
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
            
            # Replace problematic characters
            text = text.replace('\n', ' ').replace('\r', ' ').replace('\t', ' ')
            text = text.replace('"', "'")
            
            writer.writerow([
                msg.get('message_id', ''),
                msg.get('guid', ''),
                text,
                msg.get('sender', ''),
                msg.get('recipient', ''),
                msg.get('readable_date', '')
            ])
    
    print(f"✅ Created: {output2}")
    
    # Version 3: Tab-separated with minimal fields
    print(f"\n📄 Creating version 3: Tab-separated minimal")
    output3 = "final_datasets/supabase_working_v3.tsv"
    
    with open(output3, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f, delimiter='\t')
        
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
            
            # Replace problematic characters
            text = text.replace('\n', ' ').replace('\r', ' ').replace('\t', ' ')
            
            writer.writerow([
                msg.get('message_id', ''),
                msg.get('guid', ''),
                text,
                msg.get('sender', ''),
                msg.get('recipient', ''),
                msg.get('readable_date', '')
            ])
    
    print(f"✅ Created: {output3}")
    
    # Version 4: Pipe-separated with minimal fields
    print(f"\n📄 Creating version 4: Pipe-separated minimal")
    output4 = "final_datasets/supabase_working_v4.csv"
    
    with open(output4, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f, delimiter='|')
        
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
            
            # Replace problematic characters
            text = text.replace('\n', ' ').replace('\r', ' ').replace('\t', ' ')
            text = text.replace('|', ' ')
            
            writer.writerow([
                msg.get('message_id', ''),
                msg.get('guid', ''),
                text,
                msg.get('sender', ''),
                msg.get('recipient', ''),
                msg.get('readable_date', '')
            ])
    
    print(f"✅ Created: {output4}")
    
    # Test the files
    print(f"\n🔍 TESTING FILES:")
    print("=" * 20)
    
    test_files = [output1, output2, output3, output4]
    
    for test_file in test_files:
        print(f"\n📄 {test_file}:")
        try:
            with open(test_file, 'r', encoding='utf-8') as f:
                if test_file.endswith('.tsv'):
                    reader = csv.reader(f, delimiter='\t')
                elif 'pipe' in test_file:
                    reader = csv.reader(f, delimiter='|')
                else:
                    reader = csv.reader(f)
                
                header = next(reader)
                row = next(reader)
                
                print(f"  Header: {header}")
                print(f"  Sample text: {row[2][:50]}...")
                print(f"  Text field length: {len(row[2])}")
                
        except Exception as e:
            print(f"  ❌ Error: {e}")
    
    print(f"\n🎉 WORKING CSV FILES CREATED!")
    print("=" * 35)
    print(f"✅ Version 1: No quotes, all fields - {output1}")
    print(f"✅ Version 2: Minimal fields, quoted - {output2}")
    print(f"✅ Version 3: Tab-separated minimal - {output3}")
    print(f"✅ Version 4: Pipe-separated minimal - {output4}")
    print(f"📋 Try importing these files in order until one works!")
    print(f"📋 Start with Version 2 (minimal fields)")

if __name__ == "__main__":
    create_working_csv() 