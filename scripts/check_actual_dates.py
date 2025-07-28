#!/usr/bin/env python3
"""
Check the actual date range of our messages
"""

import json
from datetime import datetime

def check_actual_dates():
    """Check the actual date range of our messages"""
    
    print("📅 CHECKING ACTUAL DATE RANGE")
    print("=" * 40)
    
    # Load the final dataset
    try:
        with open("final_direct_david_nitzan_20250727_210753.json", 'r') as f:
            data = json.load(f)
    except FileNotFoundError:
        print("❌ Final dataset not found")
        return
    
    print(f"📊 Total messages: {len(data)}")
    
    # Find earliest and latest dates
    dates = []
    for msg in data:
        date_str = msg.get('readable_date')
        if date_str:
            try:
                # Parse the date
                if 'T' in date_str:
                    # ISO format
                    date_obj = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
                else:
                    # Try other formats
                    date_obj = datetime.strptime(date_str, '%Y-%m-%d %H:%M:%S')
                dates.append(date_obj)
            except:
                continue
    
    if dates:
        earliest = min(dates)
        latest = max(dates)
        
        print(f"📅 Earliest message: {earliest}")
        print(f"📅 Latest message: {latest}")
        print(f"📅 Date range: {earliest.date()} to {latest.date()}")
        
        # Calculate actual years
        year_diff = latest.year - earliest.year
        print(f"📅 Actual years: {year_diff} years")
        
        # Check for July 2015 specifically
        july_2015_messages = []
        for msg in data:
            date_str = msg.get('readable_date', '')
            if '2015-07' in date_str:
                july_2015_messages.append(msg)
        
        print(f"📅 July 2015 messages: {len(july_2015_messages)}")
        
        if july_2015_messages:
            print(f"📅 First July 2015 message: {july_2015_messages[0].get('readable_date')}")
            print(f"📅 Last July 2015 message: {july_2015_messages[-1].get('readable_date')}")
    
    # Check by year breakdown
    print(f"\n📊 MESSAGES BY YEAR:")
    print("=" * 25)
    
    year_counts = {}
    for msg in data:
        year = msg.get('year')
        if year:
            if year not in year_counts:
                year_counts[year] = 0
            year_counts[year] += 1
    
    for year in sorted(year_counts.keys()):
        count = year_counts[year]
        print(f"  {year}: {count} messages")
    
    # Check for any messages before 2015
    pre_2015_messages = []
    for msg in data:
        year = msg.get('year')
        if year and year < 2015:
            pre_2015_messages.append(msg)
    
    if pre_2015_messages:
        print(f"\n⚠️  MESSAGES BEFORE 2015:")
        print("=" * 30)
        for msg in pre_2015_messages:
            date = msg.get('readable_date', 'Unknown')
            text = msg.get('text', '')[:50]
            sender = "David" if msg.get('is_from_me') == 'David' else "Nitzan"
            print(f"  [{sender}] {date}: {text}...")
    else:
        print(f"\n✅ No messages before 2015 found")
    
    # Check the first few messages chronologically
    print(f"\n📱 FIRST FEW MESSAGES:")
    print("=" * 25)
    
    # Sort by date
    sorted_messages = []
    for msg in data:
        date_str = msg.get('readable_date')
        if date_str:
            try:
                if 'T' in date_str:
                    date_obj = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
                else:
                    date_obj = datetime.strptime(date_str, '%Y-%m-%d %H:%M:%S')
                sorted_messages.append((date_obj, msg))
            except:
                continue
    
    sorted_messages.sort(key=lambda x: x[0])
    
    for i, (date, msg) in enumerate(sorted_messages[:10], 1):
        sender = "David" if msg.get('is_from_me') == 'David' else "Nitzan"
        text = msg.get('text', '')[:50]
        print(f"{i}. [{sender}] {date}: {text}...")

if __name__ == "__main__":
    check_actual_dates() 