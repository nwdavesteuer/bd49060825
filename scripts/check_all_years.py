#!/usr/bin/env python3
"""
Check All Years in Nitzan Messages
Identifies all years present in the data and checks for missing years.
"""

import json
from collections import defaultdict


def check_all_years(json_file):
    """Check all years present in the data."""
    print("🔍 Checking all years in the data...")
    
    with open(json_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    messages = data['messages']
    
    # Group by year
    years = defaultdict(lambda: {'from_david': 0, 'to_david': 0, 'total': 0, 'chats': set(), 'sample_dates': []})
    
    for msg in messages:
        year = msg['readable_date'][:4]
        years[year]['total'] += 1
        years[year]['chats'].add(msg['chat_identifier'])
        
        # Keep track of sample dates for verification
        if len(years[year]['sample_dates']) < 3:
            years[year]['sample_dates'].append(msg['readable_date'])
        
        if msg['is_from_me']:
            years[year]['from_david'] += 1
        else:
            years[year]['to_david'] += 1
    
    print("\n📅 ALL YEARS FOUND:")
    print("-" * 100)
    print("Year | Total | From David | To David | Balance | Chats | Sample Dates")
    print("-" * 100)
    
    total_from_david = 0
    total_to_david = 0
    total_messages = 0
    
    for year in sorted(years.keys()):
        stats = years[year]
        balance = stats['from_david'] - stats['to_david']
        chat_list = ', '.join(sorted(stats['chats']))
        sample_dates = ', '.join(stats['sample_dates'])
        
        print(f"{year} | {stats['total']:5d} | {stats['from_david']:10d} | {stats['to_david']:8d} | {balance:+7d} | {chat_list} | {sample_dates}")
        
        total_from_david += stats['from_david']
        total_to_david += stats['to_david']
        total_messages += stats['total']
    
    print("-" * 100)
    print(f"TOTAL | {total_messages:5d} | {total_from_david:10d} | {total_to_david:8d} | {total_from_david - total_to_david:+7d} |")
    
    # Check for missing years
    all_years = sorted(years.keys())
    print(f"\n📊 Year Range: {min(all_years)} to {max(all_years)}")
    
    # Check for gaps
    expected_years = []
    for year in range(int(min(all_years)), int(max(all_years)) + 1):
        expected_years.append(str(year))
    
    missing_years = [year for year in expected_years if year not in all_years]
    if missing_years:
        print(f"⚠️  Missing years: {missing_years}")
    else:
        print("✅ No missing years in the range")
    
    # Check for suspicious data
    print(f"\n🔍 Data Quality Check:")
    for year in all_years:
        stats = years[year]
        if stats['total'] < 10:
            print(f"⚠️  {year}: Only {stats['total']} messages (suspiciously low)")
        if stats['from_david'] == 0 and stats['total'] > 0:
            print(f"⚠️  {year}: {stats['total']} messages but none from David")
        if stats['to_david'] == 0 and stats['total'] > 0:
            print(f"⚠️  {year}: {stats['total']} messages but none to David")
    
    return years, data


def check_specific_year(json_file, target_year):
    """Check details for a specific year."""
    print(f"\n🔍 Checking details for year {target_year}...")
    
    with open(json_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    messages = data['messages']
    
    year_messages = [msg for msg in messages if msg['readable_date'].startswith(target_year)]
    
    if not year_messages:
        print(f"❌ No messages found for year {target_year}")
        return
    
    print(f"📊 {target_year} Details:")
    print(f"  Total messages: {len(year_messages)}")
    
    from_david = [msg for msg in year_messages if msg['is_from_me']]
    to_david = [msg for msg in year_messages if not msg['is_from_me']]
    
    print(f"  From David: {len(from_david)}")
    print(f"  To David: {len(to_david)}")
    
    # Show sample messages
    print(f"\n📝 Sample messages from {target_year}:")
    for i, msg in enumerate(year_messages[:5]):
        direction = "FROM David" if msg['is_from_me'] else "TO David"
        print(f"  {i+1}. {msg['readable_date']} - {direction} - {msg['text'][:50]}...")
    
    # Check chats
    chats = set(msg['chat_identifier'] for msg in year_messages)
    print(f"\n💬 Chats involved: {chats}")


def main():
    json_file = 'comprehensive_nitzan_messages_20250724_152207.json'
    
    try:
        # Check all years
        years, data = check_all_years(json_file)
        
        # Check specific years that might be missing
        for year in ['2017', '2018']:
            check_specific_year(json_file, year)
        
    except FileNotFoundError:
        print(f"❌ File not found: {json_file}")
    except Exception as e:
        print(f"❌ Error: {e}")


if __name__ == "__main__":
    main() 