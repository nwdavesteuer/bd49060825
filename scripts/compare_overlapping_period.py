#!/usr/bin/env python3
"""
Compare the overlapping time period between original CSV and new dataset
"""

import json
import csv
from datetime import datetime

def compare_overlapping_period():
    """Compare only the overlapping time period between datasets"""
    
    print("🔍 COMPARING OVERLAPPING TIME PERIOD")
    print("=" * 45)
    
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
    
    # Find the overlapping time period
    print(f"\n📅 FINDING OVERLAPPING TIME PERIOD:")
    print("=" * 35)
    
    # Get date ranges
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
    
    if original_dates and new_dates:
        original_earliest = min(original_dates)
        original_latest = max(original_dates)
        new_earliest = min(new_dates)
        new_latest = max(new_dates)
        
        # Find overlapping period
        overlap_start = max(original_earliest, new_earliest)
        overlap_end = min(original_latest, new_latest)
        
        print(f"📊 Original dataset: {original_earliest} to {original_latest}")
        print(f"📊 New dataset: {new_earliest} to {new_latest}")
        print(f"📊 Overlapping period: {overlap_start} to {overlap_end}")
        
        # Filter messages to overlapping period
        print(f"\n🔍 FILTERING TO OVERLAPPING PERIOD:")
        print("=" * 40)
        
        original_overlap = []
        for msg in original_messages:
            date_str = msg.get('readable_date', '')
            if date_str:
                try:
                    if 'T' in date_str:
                        date_obj = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
                    else:
                        date_obj = datetime.strptime(date_str, '%Y-%m-%d %H:%M:%S')
                    if overlap_start <= date_obj <= overlap_end:
                        original_overlap.append(msg)
                except:
                    continue
        
        new_overlap = []
        for msg in new_messages:
            date_str = msg.get('readable_date', '')
            if date_str:
                try:
                    if 'T' in date_str:
                        date_obj = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
                    else:
                        date_obj = datetime.strptime(date_str, '%Y-%m-%d %H:%M:%S')
                    if overlap_start <= date_obj <= overlap_end:
                        new_overlap.append(msg)
                except:
                    continue
        
        print(f"✅ Original dataset in overlap period: {len(original_overlap)} messages")
        print(f"✅ New dataset in overlap period: {len(new_overlap)} messages")
        
        # Compare GUIDs in overlapping period
        print(f"\n🔍 COMPARING OVERLAPPING PERIOD BY GUID:")
        print("=" * 45)
        
        original_overlap_guids = set()
        new_overlap_guids = set()
        
        for msg in original_overlap:
            guid = msg.get('guid', '')
            if guid:
                original_overlap_guids.add(guid)
        
        for msg in new_overlap:
            guid = msg.get('guid', '')
            if guid:
                new_overlap_guids.add(guid)
        
        print(f"📊 Original dataset unique GUIDs in overlap: {len(original_overlap_guids)}")
        print(f"📊 New dataset unique GUIDs in overlap: {len(new_overlap_guids)}")
        
        # Find missing and extra GUIDs in overlap period
        missing_in_overlap = original_overlap_guids - new_overlap_guids
        extra_in_overlap = new_overlap_guids - original_overlap_guids
        
        print(f"❌ Missing from new dataset in overlap: {len(missing_in_overlap)} GUIDs")
        print(f"➕ Extra in new dataset in overlap: {len(extra_in_overlap)} GUIDs")
        
        # Analyze missing messages in overlap period
        if missing_in_overlap:
            print(f"\n🔍 MISSING MESSAGES IN OVERLAP PERIOD:")
            print("=" * 45)
            
            missing_in_overlap_messages = []
            for msg in original_overlap:
                guid = msg.get('guid', '')
                if guid in missing_in_overlap:
                    missing_in_overlap_messages.append(msg)
            
            # Show first 10 missing messages
            for i, msg in enumerate(missing_in_overlap_messages[:10], 1):
                date = msg.get('readable_date', 'Unknown')
                sender = msg.get('sender', 'Unknown')
                text = msg.get('text', '')[:50]
                print(f"{i}. [{sender}] {date}: {text}...")
            
            if len(missing_in_overlap_messages) > 10:
                print(f"  ... and {len(missing_in_overlap_messages) - 10} more")
            
            # Analyze missing messages by year in overlap
            print(f"\n📅 MISSING MESSAGES BY YEAR (OVERLAP PERIOD):")
            print("=" * 50)
            
            missing_by_year = {}
            for msg in missing_in_overlap_messages:
                date_str = msg.get('readable_date', '')
                if date_str:
                    year = date_str[:4] if len(date_str) >= 4 else 'Unknown'
                    if year not in missing_by_year:
                        missing_by_year[year] = 0
                    missing_by_year[year] += 1
            
            for year in sorted(missing_by_year.keys()):
                count = missing_by_year[year]
                print(f"  {year}: {count} messages")
        
        # Analyze extra messages in overlap period
        if extra_in_overlap:
            print(f"\n🔍 EXTRA MESSAGES IN OVERLAP PERIOD:")
            print("=" * 45)
            
            extra_in_overlap_messages = []
            for msg in new_overlap:
                guid = msg.get('guid', '')
                if guid in extra_in_overlap:
                    extra_in_overlap_messages.append(msg)
            
            # Show first 10 extra messages
            for i, msg in enumerate(extra_in_overlap_messages[:10], 1):
                date = msg.get('readable_date', 'Unknown')
                sender = msg.get('sender', 'Unknown')
                text = msg.get('text', '')[:50]
                print(f"{i}. [{sender}] {date}: {text}...")
            
            if len(extra_in_overlap_messages) > 10:
                print(f"  ... and {len(extra_in_overlap_messages) - 10} more")
        
        # Compare sender breakdown in overlap period
        print(f"\n👥 SENDER BREAKDOWN IN OVERLAP PERIOD:")
        print("=" * 45)
        
        # Original dataset sender breakdown in overlap
        original_david_overlap = len([msg for msg in original_overlap if msg.get('sender') == 'David'])
        original_nitzan_overlap = len([msg for msg in original_overlap if msg.get('sender') == 'Nitzan'])
        print(f"📊 Original dataset in overlap:")
        print(f"  David: {original_david_overlap} messages")
        print(f"  Nitzan: {original_nitzan_overlap} messages")
        print(f"  Total: {len(original_overlap)} messages")
        
        # New dataset sender breakdown in overlap
        new_david_overlap = len([msg for msg in new_overlap if msg.get('sender') == 'David'])
        new_nitzan_overlap = len([msg for msg in new_overlap if msg.get('sender') == 'Nitzan'])
        print(f"📊 New dataset in overlap:")
        print(f"  David: {new_david_overlap} messages")
        print(f"  Nitzan: {new_nitzan_overlap} messages")
        print(f"  Total: {len(new_overlap)} messages")
        
        # Summary for overlap period
        print(f"\n🎯 OVERLAP PERIOD SUMMARY:")
        print("=" * 30)
        
        if len(missing_in_overlap) == 0 and len(extra_in_overlap) == 0:
            print("✅ PERFECT MATCH IN OVERLAP PERIOD!")
            print("✅ All original messages in overlap period are included")
            print("✅ No extra messages added in overlap period")
        elif len(missing_in_overlap) == 0:
            print("✅ ALL ORIGINAL MESSAGES PRESENT IN OVERLAP!")
            print(f"➕ {len(extra_in_overlap)} extra messages added in overlap period")
            print("✅ No messages were lost in overlap period")
        elif len(extra_in_overlap) == 0:
            print("❌ MISSING MESSAGES IN OVERLAP PERIOD!")
            print(f"❌ {len(missing_in_overlap)} messages from original dataset are missing")
            print("❌ Need to investigate and add missing messages")
        else:
            print("⚠️  PARTIAL MATCH IN OVERLAP PERIOD!")
            print(f"❌ {len(missing_in_overlap)} messages from original dataset are missing")
            print(f"➕ {len(extra_in_overlap)} extra messages added in overlap period")
            print("⚠️  Need to investigate both missing and extra messages")
        
        # If there are missing messages in overlap, save them for analysis
        if missing_in_overlap:
            print(f"\n🔧 SAVING MISSING MESSAGES FROM OVERLAP:")
            print("=" * 45)
            
            missing_overlap_file = "final_datasets/missing_messages_overlap_period.json"
            with open(missing_overlap_file, 'w') as f:
                json.dump(missing_in_overlap_messages, f, indent=2)
            
            print(f"✅ Saved missing messages from overlap period to {missing_overlap_file}")
            print("📋 Review these messages to determine if they should be included")
        
        return len(missing_in_overlap) == 0
    else:
        print("❌ Could not determine overlapping period")
        return False

if __name__ == "__main__":
    compare_overlapping_period() 