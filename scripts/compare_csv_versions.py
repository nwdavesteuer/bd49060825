#!/usr/bin/env python3
"""
Compare different CSV versions to show what data might be missing
"""

import json
import csv

def compare_csv_versions():
    """Compare different CSV versions to show data differences"""
    
    print("🔍 COMPARING CSV VERSIONS")
    print("=" * 35)
    
    # Load the original JSON data
    print("📋 LOADING ORIGINAL DATA:")
    print("=" * 25)
    
    try:
        with open("final_datasets/supabase_import_ready.json", 'r') as f:
            original_data = json.load(f)
    except FileNotFoundError:
        print("❌ JSON file not found")
        return
    
    print(f"✅ Loaded {len(original_data)} messages from original data")
    
    # Define the different versions
    versions = {
        'full': {
            'file': 'final_datasets/supabase_compatible_david_nitzan_conversation_fixed.csv',
            'fields': ['message_id', 'guid', 'text', 'date', 'date_read', 'is_from_me', 'sender', 'recipient', 'has_attachments', 'attachments_info', 'emojis', 'links', 'service', 'account', 'contact_id', 'readable_date'],
            'description': 'Full version with all fields'
        },
        'clean': {
            'file': 'final_datasets/supabase_clean_import.csv',
            'fields': ['message_id', 'guid', 'text', 'date', 'date_read', 'is_from_me', 'sender', 'recipient', 'has_attachments', 'attachments_info', 'emojis', 'links', 'service', 'account', 'contact_id', 'readable_date'],
            'description': 'Clean version (same as full)'
        },
        'minimal': {
            'file': 'final_datasets/supabase_minimal_import.csv',
            'fields': ['message_id', 'guid', 'text', 'sender', 'recipient', 'readable_date'],
            'description': 'Minimal version with essential fields only'
        }
    }
    
    print(f"\n📊 VERSION COMPARISON:")
    print("=" * 25)
    
    for version_name, version_info in versions.items():
        print(f"\n📄 {version_name.upper()} VERSION:")
        print("-" * 30)
        print(f"Description: {version_info['description']}")
        print(f"Fields: {len(version_info['fields'])}")
        print(f"Field list: {version_info['fields']}")
        
        # Check if file exists
        if os.path.exists(version_info['file']):
            print(f"✅ File exists: {version_info['file']}")
        else:
            print(f"❌ File missing: {version_info['file']}")
    
    # Show what you'd miss with minimal version
    print(f"\n🔍 WHAT YOU'D MISS WITH MINIMAL VERSION:")
    print("=" * 45)
    
    full_fields = set(versions['full']['fields'])
    minimal_fields = set(versions['minimal']['fields'])
    missing_fields = full_fields - minimal_fields
    
    print(f"📊 Missing fields ({len(missing_fields)}):")
    for field in sorted(missing_fields):
        print(f"  ❌ {field}")
    
    print(f"\n📊 Kept fields ({len(minimal_fields)}):")
    for field in sorted(minimal_fields):
        print(f"  ✅ {field}")
    
    # Analyze the missing data
    print(f"\n📊 ANALYSIS OF MISSING DATA:")
    print("=" * 35)
    
    missing_analysis = {
        'date': 'Apple timestamp - useful for sorting and filtering',
        'date_read': 'When message was read - useful for analytics',
        'is_from_me': '0/1 flag - useful for identifying sender',
        'has_attachments': 'Whether message has media - useful for filtering',
        'attachments_info': 'Details about attachments - useful for media messages',
        'emojis': 'Emoji content - useful for sentiment analysis',
        'links': 'URLs in messages - useful for link tracking',
        'service': 'iMessage/SMS - useful for service type filtering',
        'account': 'Account identifier - useful for multi-device support',
        'contact_id': 'Contact identifier - useful for contact management'
    }
    
    for field in sorted(missing_fields):
        if field in missing_analysis:
            print(f"  📋 {field}: {missing_analysis[field]}")
        else:
            print(f"  📋 {field}: Additional metadata")
    
    # Show sample data to illustrate
    print(f"\n💬 SAMPLE DATA COMPARISON:")
    print("=" * 35)
    
    if original_data:
        sample = original_data[0]
        print(f"📄 Sample message:")
        print(f"  message_id: {sample.get('message_id')}")
        print(f"  text: {sample.get('text', '')[:50]}...")
        print(f"  sender: {sample.get('sender')}")
        print(f"  date: {sample.get('date')}")
        print(f"  is_from_me: {sample.get('is_from_me')}")
        print(f"  service: {sample.get('service')}")
        print(f"  contact_id: {sample.get('contact_id')}")
    
    # Recommendations
    print(f"\n🎯 RECOMMENDATIONS:")
    print("=" * 25)
    
    print(f"✅ FULL VERSION (recommended):")
    print(f"  - Contains all {len(full_fields)} fields")
    print(f"  - No data loss")
    print(f"  - Maximum functionality")
    print(f"  - Best for future analysis")
    
    print(f"\n⚠️  MINIMAL VERSION:")
    print(f"  - Contains only {len(minimal_fields)} essential fields")
    print(f"  - Loses {len(missing_fields)} fields of metadata")
    print(f"  - Simpler but less functional")
    print(f"  - Good for basic conversation display")
    
    print(f"\n📋 CLEAN VERSION:")
    print(f"  - Same as full version")
    print(f"  - Just verified headers")
    print(f"  - No data loss")
    
    print(f"\n💡 CHOICE GUIDE:")
    print("=" * 20)
    print(f"🎯 Choose FULL/CLEAN if you want:")
    print(f"  - Complete conversation history")
    print(f"  - All metadata preserved")
    print(f"  - Future analysis capabilities")
    print(f"  - Maximum functionality")
    
    print(f"\n🎯 Choose MINIMAL if you want:")
    print(f"  - Simple conversation display")
    print(f"  - Faster import")
    print(f"  - Basic functionality only")
    print(f"  - Smaller file size")

if __name__ == "__main__":
    import os
    compare_csv_versions() 