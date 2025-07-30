#!/usr/bin/env python3
"""
Create ultimate comprehensive dataset including David's backup
"""

import sqlite3
import json
import csv
import os
from datetime import datetime
from pathlib import Path

def load_previous_comprehensive_data():
    """Load the previous comprehensive dataset"""
    previous_file = "final_comprehensive_all_20250727_203716.json"
    
    if os.path.exists(previous_file):
        print(f"📂 Loading previous comprehensive data: {previous_file}")
        try:
            with open(previous_file, 'r') as f:
                data = json.load(f)
                print(f"📊 Loaded {len(data)} messages from previous comprehensive dataset")
                return data
        except Exception as e:
            print(f"❌ Error loading previous data: {e}")
    
    return []

def load_davids_backup_data():
    """Load the David's backup data"""
    backup_file = "davids_backup_messages_20250727_205429.json"
    
    if os.path.exists(backup_file):
        print(f"📂 Loading David's backup data: {backup_file}")
        try:
            with open(backup_file, 'r') as f:
                data = json.load(f)
                print(f"📊 Loaded {len(data)} messages from David's backup")
                return data
        except Exception as e:
            print(f"❌ Error loading David's backup data: {e}")
    
    return []

def merge_and_deduplicate(all_datasets):
    """Merge and deduplicate messages from all datasets"""
    print("🔄 Merging and deduplicating all datasets...")
    
    # Create a dictionary to track unique messages by GUID
    unique_messages = {}
    
    for dataset_name, messages in all_datasets.items():
        print(f"📂 Processing {len(messages)} messages from {dataset_name}")
        
        for msg in messages:
            guid = msg.get('guid')
            if guid:
                # If we haven't seen this GUID, add it
                if guid not in unique_messages:
                    unique_messages[guid] = msg
                else:
                    # If we have seen it, keep the one with more complete data
                    existing = unique_messages[guid]
                    if not existing.get('text') and msg.get('text'):
                        unique_messages[guid] = msg
                    elif not existing.get('date_read') and msg.get('date_read'):
                        unique_messages[guid] = msg
    
    merged_messages = list(unique_messages.values())
    print(f"📊 After deduplication: {len(merged_messages)} unique messages")
    
    return merged_messages

def analyze_by_year(messages):
    """Analyze messages by year and source"""
    print("📅 Analyzing messages by year...")
    
    year_counts = {}
    source_counts = {}
    sender_counts = {}
    
    for msg in messages:
        year = None
        if msg.get('readable_date'):
            try:
                year = datetime.fromisoformat(msg['readable_date'].replace('Z', '+00:00')).year
            except:
                pass
        
        if year:
            if year not in year_counts:
                year_counts[year] = {'David': 0, 'Nitzan': 0}
            sender = msg.get('is_from_me', 'Unknown')
            year_counts[year][sender] += 1
        
        source = msg.get('source', 'Unknown')
        source_counts[source] = source_counts.get(source, 0) + 1
        
        sender = msg.get('is_from_me', 'Unknown')
        sender_counts[sender] = sender_counts.get(sender, 0) + 1
    
    print(f"\n📅 Messages by Year:")
    for year in sorted(year_counts.keys()):
        david_count = year_counts[year]['David']
        nitzan_count = year_counts[year]['Nitzan']
        total = david_count + nitzan_count
        print(f"  {year}: {total} total ({david_count} from David, {nitzan_count} from Nitzan)")
    
    print(f"\n📂 Messages by Source:")
    for source, count in source_counts.items():
        print(f"  {source}: {count} messages")
    
    print(f"\n👤 Messages by Sender:")
    for sender, count in sender_counts.items():
        print(f"  {sender}: {count} messages")

def create_supabase_export(messages, year_filter=None):
    """Create Supabase-ready export"""
    print(f"🔄 Creating Supabase export...")
    
    if year_filter:
        filtered_messages = []
        for msg in messages:
            if msg.get('readable_date'):
                try:
                    year = datetime.fromisoformat(msg['readable_date'].replace('Z', '+00:00')).year
                    if year in year_filter:
                        filtered_messages.append(msg)
                except:
                    pass
        messages = filtered_messages
        print(f"📊 Filtered to {len(messages)} messages for years {year_filter}")
    
    # Save as JSON
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    
    if year_filter:
        json_file = f"ultimate_comprehensive_{year_filter[0]}_{year_filter[1]}_{timestamp}.json"
        csv_file = f"ultimate_comprehensive_{year_filter[0]}_{year_filter[1]}_{timestamp}.csv"
    else:
        json_file = f"ultimate_comprehensive_all_{timestamp}.json"
        csv_file = f"ultimate_comprehensive_all_{timestamp}.csv"
    
    with open(json_file, 'w') as f:
        json.dump(messages, f, indent=2)
    
    # Save as CSV
    fieldnames = [
        'message_id', 'guid', 'text', 'date', 'date_read', 'is_from_me',
        'sender', 'recipient', 'emojis', 'links', 'service', 'account',
        'contact_id', 'readable_date', 'apple_date', 'apple_date_read'
    ]
    
    with open(csv_file, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        
        for msg in messages:
            row = {}
            for field in fieldnames:
                row[field] = msg.get(field, None)
            writer.writerow(row)
    
    print(f"💾 Saved {len(messages)} messages:")
    print(f"  JSON: {json_file}")
    print(f"  CSV: {csv_file}")
    
    return json_file, csv_file

def main():
    """Main comprehensive extraction function"""
    print("🔍 CREATING ULTIMATE COMPREHENSIVE DATASET")
    print("=" * 60)
    
    # Load all datasets
    all_datasets = {
        'Previous_Comprehensive': load_previous_comprehensive_data(),
        'Davids_Backup': load_davids_backup_data()
    }
    
    # Merge and deduplicate
    merged_messages = merge_and_deduplicate(all_datasets)
    
    if not merged_messages:
        print("❌ No messages found from any source")
        return
    
    # Analyze by year
    analyze_by_year(merged_messages)
    
    # Create comprehensive export (all years)
    json_file_all, csv_file_all = create_supabase_export(merged_messages)
    
    # Create 2024-2025 export
    json_file_2024_2025, csv_file_2024_2025 = create_supabase_export(merged_messages, [2024, 2025])
    
    print(f"\n✅ ULTIMATE COMPREHENSIVE DATASET CREATED!")
    print(f"📊 Total unique messages: {len(merged_messages)}")
    print(f"📁 Files created:")
    print(f"  All years: {json_file_all}, {csv_file_all}")
    print(f"  2024-2025: {json_file_2024_2025}, {csv_file_2024_2025}")
    print(f"\n🎯 This is now the most complete dataset available!")

if __name__ == "__main__":
    main() 