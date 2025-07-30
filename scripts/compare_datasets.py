#!/usr/bin/env python3
"""
Compare the original david_nitzan_all_messages.csv with our new supabase_compatible dataset
"""

import json
import csv
from datetime import datetime

def compare_datasets():
    """Compare original dataset with our new dataset to ensure no entries were lost"""
    
    print("🔍 COMPARING DATASETS")
    print("=" * 40)
    
    # Load the original dataset
    print("📋 LOADING ORIGINAL DATASET:")
    print("=" * 35)
    
    original_messages = []
    try:
        with open("backups/david_nitzan_all_messages.csv", 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                original_messages.append(row)
    except FileNotFoundError:
        print("❌ Original dataset not found")
        return
    
    print(f"✅ Loaded {len(original_messages)} messages from original dataset")
    
    # Load our new dataset
    print(f"\n📋 LOADING NEW DATASET:")
    print("=" * 30)
    
    new_messages = []
    try:
        with open("final_datasets/supabase_compatible_david_nitzan_conversation.csv", 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                new_messages.append(row)
    except FileNotFoundError:
        print("❌ New dataset not found")
        return
    
    print(f"✅ Loaded {len(new_messages)} messages from new dataset")
    
    # Create sets of GUIDs for comparison
    print(f"\n🔍 COMPARING BY GUID:")
    print("=" * 25)
    
    original_guids = set()
    new_guids = set()
    
    for msg in original_messages:
        guid = msg.get('guid', '')
        if guid:
            original_guids.add(guid)
    
    for msg in new_messages:
        guid = msg.get('guid', '')
        if guid:
            new_guids.add(guid)
    
    print(f"📊 Original dataset unique GUIDs: {len(original_guids)}")
    print(f"📊 New dataset unique GUIDs: {len(new_guids)}")
    
    # Find missing and extra GUIDs
    missing_guids = original_guids - new_guids
    extra_guids = new_guids - original_guids
    
    print(f"❌ Missing from new dataset: {len(missing_guids)} GUIDs")
    print(f"➕ Extra in new dataset: {len(extra_guids)} GUIDs")
    
    # Analyze missing messages
    if missing_guids:
        print(f"\n🔍 MISSING MESSAGES FROM ORIGINAL:")
        print("=" * 40)
        
        missing_messages = []
        for msg in original_messages:
            guid = msg.get('guid', '')
            if guid in missing_guids:
                missing_messages.append(msg)
        
        # Show first 10 missing messages
        for i, msg in enumerate(missing_messages[:10], 1):
            date = msg.get('readable_date', 'Unknown')
            sender = msg.get('sender', 'Unknown')
            text = msg.get('text', '')[:50]
            print(f"{i}. [{sender}] {date}: {text}...")
        
        if len(missing_messages) > 10:
            print(f"  ... and {len(missing_messages) - 10} more")
        
        # Analyze missing messages by date
        print(f"\n📅 MISSING MESSAGES BY DATE:")
        print("=" * 35)
        
        missing_by_date = {}
        for msg in missing_messages:
            date_str = msg.get('readable_date', '')
            if date_str:
                year = date_str[:4] if len(date_str) >= 4 else 'Unknown'
                if year not in missing_by_date:
                    missing_by_date[year] = 0
                missing_by_date[year] += 1
        
        for year in sorted(missing_by_date.keys()):
            count = missing_by_date[year]
            print(f"  {year}: {count} messages")
    
    # Analyze extra messages
    if extra_guids:
        print(f"\n🔍 EXTRA MESSAGES IN NEW DATASET:")
        print("=" * 40)
        
        extra_messages = []
        for msg in new_messages:
            guid = msg.get('guid', '')
            if guid in extra_guids:
                extra_messages.append(msg)
        
        # Show first 10 extra messages
        for i, msg in enumerate(extra_messages[:10], 1):
            date = msg.get('readable_date', 'Unknown')
            sender = msg.get('sender', 'Unknown')
            text = msg.get('text', '')[:50]
            print(f"{i}. [{sender}] {date}: {text}...")
        
        if len(extra_messages) > 10:
            print(f"  ... and {len(extra_messages) - 10} more")
    
    # Compare by date range
    print(f"\n📅 DATE RANGE COMPARISON:")
    print("=" * 30)
    
    # Original dataset date range
    original_dates = []
    for msg in original_messages:
        date_str = msg.get('readable_date', '')
        if date_str:
            try:
                if 'T' in date_str:
                    date_obj = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
                else:
                    date_obj = datetime.strptime(date_str, '%Y-%m-%d %H:%M:%S')
                original_dates.append(date_obj)
            except:
                continue
    
    if original_dates:
        original_earliest = min(original_dates)
        original_latest = max(original_dates)
        print(f"📊 Original dataset: {original_earliest} to {original_latest}")
    
    # New dataset date range
    new_dates = []
    for msg in new_messages:
        date_str = msg.get('readable_date', '')
        if date_str:
            try:
                if 'T' in date_str:
                    date_obj = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
                else:
                    date_obj = datetime.strptime(date_str, '%Y-%m-%d %H:%M:%S')
                new_dates.append(date_obj)
            except:
                continue
    
    if new_dates:
        new_earliest = min(new_dates)
        new_latest = max(new_dates)
        print(f"📊 New dataset: {new_earliest} to {new_latest}")
    
    # Compare sender breakdown
    print(f"\n👥 SENDER BREAKDOWN COMPARISON:")
    print("=" * 35)
    
    # Original dataset sender breakdown
    original_david = len([msg for msg in original_messages if msg.get('sender') == 'David'])
    original_nitzan = len([msg for msg in original_messages if msg.get('sender') == 'Nitzan'])
    print(f"📊 Original dataset:")
    print(f"  David: {original_david} messages")
    print(f"  Nitzan: {original_nitzan} messages")
    print(f"  Total: {len(original_messages)} messages")
    
    # New dataset sender breakdown
    new_david = len([msg for msg in new_messages if msg.get('sender') == 'David'])
    new_nitzan = len([msg for msg in new_messages if msg.get('sender') == 'Nitzan'])
    print(f"📊 New dataset:")
    print(f"  David: {new_david} messages")
    print(f"  Nitzan: {new_nitzan} messages")
    print(f"  Total: {len(new_messages)} messages")
    
    # Summary
    print(f"\n🎯 COMPARISON SUMMARY:")
    print("=" * 25)
    
    if len(missing_guids) == 0 and len(extra_guids) == 0:
        print("✅ PERFECT MATCH!")
        print("✅ All original messages are included in the new dataset")
        print("✅ No extra messages added")
        print("✅ Datasets are identical in content")
    elif len(missing_guids) == 0:
        print("✅ ALL ORIGINAL MESSAGES PRESENT!")
        print(f"⚠️  {len(extra_guids)} extra messages added to new dataset")
        print("✅ No messages were lost")
    elif len(extra_guids) == 0:
        print("❌ MISSING MESSAGES!")
        print(f"❌ {len(missing_guids)} messages from original dataset are missing")
        print("❌ Need to investigate and add missing messages")
    else:
        print("⚠️  PARTIAL MATCH!")
        print(f"❌ {len(missing_guids)} messages from original dataset are missing")
        print(f"➕ {len(extra_guids)} extra messages added to new dataset")
        print("⚠️  Need to investigate both missing and extra messages")
    
    # If there are missing messages, create a script to add them
    if missing_guids:
        print(f"\n🔧 CREATING FIX SCRIPT:")
        print("=" * 25)
        
        # Save missing messages to a separate file for analysis
        missing_file = "final_datasets/missing_messages.json"
        with open(missing_file, 'w') as f:
            json.dump(missing_messages, f, indent=2)
        
        print(f"✅ Saved missing messages to {missing_file}")
        print("📋 Review the missing messages to determine if they should be included")
    
    return len(missing_guids) == 0

if __name__ == "__main__":
    compare_datasets() 