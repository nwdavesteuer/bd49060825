#!/usr/bin/env python3
"""
Create JSON import file for Supabase
"""

import json

def create_json_import():
    """Create JSON file for Supabase import"""
    
    print("📊 CREATING JSON IMPORT FOR SUPABASE")
    print("=" * 40)
    
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
    
    # Create JSON import file
    print(f"\n💾 CREATING JSON IMPORT:")
    print("=" * 25)
    
    output_json = "final_datasets/supabase_json_import.json"
    
    # Create a clean JSON structure for Supabase
    supabase_data = []
    
    for msg in data:
        # Clean text field
        text = msg.get('text', '')
        if text is None:
            text = ''
        
        # Clean text thoroughly
        text = text.replace('\n', ' ').replace('\r', ' ').replace('\t', ' ')
        text = text.replace('"', "'").replace('\\', '/')
        
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
        
        supabase_data.append(supabase_record)
    
    # Save JSON file
    with open(output_json, 'w') as f:
        json.dump(supabase_data, f, indent=2)
    
    print(f"✅ Created JSON: {output_json}")
    
    # Also create a minimal JSON version
    print(f"\n💾 CREATING MINIMAL JSON:")
    print("=" * 25)
    
    output_minimal_json = "final_datasets/supabase_minimal_json.json"
    
    minimal_data = []
    
    for msg in data:
        # Clean text field
        text = msg.get('text', '')
        if text is None:
            text = ''
        
        # Clean text thoroughly
        text = text.replace('\n', ' ').replace('\r', ' ').replace('\t', ' ')
        text = text.replace('"', "'").replace('\\', '/')
        
        # Create minimal record
        minimal_record = {
            'message_id': int(msg.get('message_id', 0)),
            'guid': msg.get('guid', ''),
            'text': text,
            'sender': msg.get('sender', ''),
            'recipient': msg.get('recipient', ''),
            'readable_date': msg.get('readable_date', '')
        }
        
        minimal_data.append(minimal_record)
    
    # Save minimal JSON file
    with open(output_minimal_json, 'w') as f:
        json.dump(minimal_data, f, indent=2)
    
    print(f"✅ Created minimal JSON: {output_minimal_json}")
    
    # Test the files
    print(f"\n🔍 TESTING JSON FILES:")
    print("=" * 25)
    
    # Test full JSON
    print(f"📄 {output_json}:")
    try:
        with open(output_json, 'r') as f:
            json_data = json.load(f)
            sample = json_data[0]
            print(f"  Sample message_id: {sample['message_id']}")
            print(f"  Sample text: {sample['text'][:50]}...")
            print(f"  Sample sender: {sample['sender']}")
            print(f"  Total records: {len(json_data)}")
    except Exception as e:
        print(f"  ❌ Error: {e}")
    
    # Test minimal JSON
    print(f"\n📄 {output_minimal_json}:")
    try:
        with open(output_minimal_json, 'r') as f:
            json_data = json.load(f)
            sample = json_data[0]
            print(f"  Sample message_id: {sample['message_id']}")
            print(f"  Sample text: {sample['text'][:50]}...")
            print(f"  Sample sender: {sample['sender']}")
            print(f"  Total records: {len(json_data)}")
    except Exception as e:
        print(f"  ❌ Error: {e}")
    
    print(f"\n🎉 JSON IMPORT FILES CREATED!")
    print("=" * 35)
    print(f"✅ Full JSON: {output_json}")
    print(f"✅ Minimal JSON: {output_minimal_json}")
    print(f"📋 Try importing the JSON files to Supabase")
    print(f"📋 JSON should work better than CSV for text fields")

if __name__ == "__main__":
    create_json_import() 