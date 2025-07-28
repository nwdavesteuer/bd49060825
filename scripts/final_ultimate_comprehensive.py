#!/usr/bin/env python3
"""
Create the final ultimate comprehensive dataset
"""

import json
import os
from datetime import datetime

def load_previous_ultimate_data():
    """Load the previous ultimate comprehensive dataset"""
    try:
        with open("ultimate_comprehensive_all_20250727_205541.json", 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        print("❌ Previous ultimate dataset not found")
        return []

def load_comprehensive_search_data():
    """Load the comprehensive search results"""
    try:
        with open("comprehensive_contact_search_20250727_210406.json", 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        print("❌ Comprehensive search data not found")
        return []

def merge_and_deduplicate(previous_data, comprehensive_data):
    """Merge and deduplicate messages based on GUID"""
    
    print("🔄 Merging datasets...")
    
    # Create a dictionary to track unique messages by GUID
    unique_messages = {}
    
    # Add previous data
    for msg in previous_data:
        guid = msg.get('guid')
        if guid:
            unique_messages[guid] = msg
    
    # Add comprehensive data (will overwrite if same GUID)
    for msg in comprehensive_data:
        guid = msg.get('guid')
        if guid:
            unique_messages[guid] = msg
    
    merged_data = list(unique_messages.values())
    
    print(f"📊 Previous dataset: {len(previous_data)} messages")
    print(f"📊 Comprehensive search: {len(comprehensive_data)} messages")
    print(f"📊 Merged unique messages: {len(merged_data)} messages")
    
    return merged_data

def analyze_by_year(messages):
    """Analyze messages by year"""
    
    year_counts = {}
    source_counts = {}
    
    for msg in messages:
        year = msg.get('year')
        source = msg.get('source', 'Unknown')
        
        if year:
            if year not in year_counts:
                year_counts[year] = {'David': 0, 'Other': 0}
            sender = msg.get('is_from_me', 'Unknown')
            year_counts[year][sender] += 1
        
        source_counts[source] = source_counts.get(source, 0) + 1
    
    print(f"\n📅 Messages by Year:")
    for year in sorted(year_counts.keys()):
        david_count = year_counts[year]['David']
        other_count = year_counts[year]['Other']
        total = david_count + other_count
        print(f"  {year}: {total} total ({david_count} from David, {other_count} from others)")
    
    print(f"\n📂 Messages by Source:")
    for source, count in source_counts.items():
        print(f"  {source}: {count} messages")
    
    return year_counts

def create_supabase_export(messages, year_filter=None):
    """Create Supabase-compliant export"""
    
    if year_filter:
        filtered_messages = []
        for msg in messages:
            year = msg.get('year')
            if year and year in year_filter:
                filtered_messages.append(msg)
        messages = filtered_messages
    
    # Convert to Supabase format
    supabase_messages = []
    
    for msg in messages:
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
        supabase_messages.append(supabase_msg)
    
    return supabase_messages

def main():
    """Create the final ultimate comprehensive dataset"""
    
    print("🚀 CREATING FINAL ULTIMATE COMPREHENSIVE DATASET")
    print("=" * 60)
    
    # Load datasets
    previous_data = load_previous_ultimate_data()
    comprehensive_data = load_comprehensive_search_data()
    
    if not previous_data and not comprehensive_data:
        print("❌ No data found to merge")
        return
    
    # Merge and deduplicate
    merged_data = merge_and_deduplicate(previous_data, comprehensive_data)
    
    # Analyze by year
    year_counts = analyze_by_year(merged_data)
    
    # Create timestamp
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    
    # Save comprehensive dataset
    output_file = f"final_ultimate_comprehensive_{timestamp}.json"
    with open(output_file, 'w') as f:
        json.dump(merged_data, f, indent=2)
    
    print(f"\n💾 Saved comprehensive dataset: {output_file}")
    
    # Create 2024-2025 export for Supabase
    supabase_2024_2025 = create_supabase_export(merged_data, [2024, 2025])
    
    supabase_file = f"supabase_ready_2024_2025_{timestamp}.json"
    with open(supabase_file, 'w') as f:
        json.dump(supabase_2024_2025, f, indent=2)
    
    print(f"💾 Saved Supabase 2024-2025 export: {supabase_file}")
    
    # Create CSV for Supabase
    import csv
    csv_file = f"supabase_ready_2024_2025_{timestamp}.csv"
    
    if supabase_2024_2025:
        fieldnames = [
            'message_id', 'guid', 'text', 'date', 'date_read', 'is_from_me',
            'sender', 'recipient', 'emojis', 'links', 'service', 'account',
            'contact_id', 'readable_date', 'apple_date', 'apple_date_read'
        ]
        
        with open(csv_file, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            for msg in supabase_2024_2025:
                writer.writerow(msg)
        
        print(f"💾 Saved Supabase 2024-2025 CSV: {csv_file}")
    
    # Summary
    print(f"\n🎉 FINAL SUMMARY")
    print("=" * 30)
    print(f"Total unique messages: {len(merged_data)}")
    print(f"2024-2025 messages: {len(supabase_2024_2025)}")
    
    # Check 2017-2019 specifically
    messages_2017_2019 = [msg for msg in merged_data if msg.get('year') and 2017 <= msg.get('year') <= 2019]
    print(f"2017-2019 messages: {len(messages_2017_2019)}")
    
    # Count David vs Nitzan for 2017-2019
    david_2017_2019 = sum(1 for msg in messages_2017_2019 if msg.get('is_from_me') == 'David')
    nitzan_2017_2019 = sum(1 for msg in messages_2017_2019 if msg.get('is_from_me') != 'David')
    print(f"2017-2019 breakdown: {david_2017_2019} from David, {nitzan_2017_2019} from Nitzan")

if __name__ == "__main__":
    main() 