#!/usr/bin/env python3
"""
Analyze Years 2017, 2018, 2019
Analyzes the extracted data to verify we have the correct messages for these years.
"""

import json
from collections import defaultdict


def analyze_years(json_file):
    """Analyze messages by year, focusing on 2017-2019."""
    print("📊 Analyzing messages by year...")
    
    with open(json_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    messages = data['messages']
    
    # Group by year
    years = defaultdict(lambda: {'from_david': 0, 'to_david': 0, 'total': 0, 'chats': set()})
    
    for msg in messages:
        if not msg['readable_date']:
            continue  # Skip messages without dates
        year = msg['readable_date'][:4]
        years[year]['total'] += 1
        if msg['contact_id']:
            years[year]['chats'].add(msg['contact_id'])
        
        if msg['is_from_me'] == '1':
            years[year]['from_david'] += 1
        else:
            years[year]['to_david'] += 1
    
    print("\n📅 Messages by Year:")
    print("-" * 80)
    print("Year | Total | From David | To David | Balance | Chats")
    print("-" * 80)
    
    total_from_david = 0
    total_to_david = 0
    total_messages = 0
    
    for year in sorted(years.keys()):
        stats = years[year]
        balance = stats['from_david'] - stats['to_david']
        chat_list = ', '.join(sorted(stats['chats']))
        
        print(f"{year} | {stats['total']:5d} | {stats['from_david']:10d} | {stats['to_david']:8d} | {balance:+7d} | {chat_list}")
        
        total_from_david += stats['from_david']
        total_to_david += stats['to_david']
        total_messages += stats['total']
    
    print("-" * 80)
    print(f"TOTAL | {total_messages:5d} | {total_from_david:10d} | {total_to_david:8d} | {total_from_david - total_to_david:+7d} |")
    
    # Focus on 2017-2019
    print(f"\n🔍 FOCUS ON 2017-2019:")
    print("=" * 50)
    
    for year in ['2017', '2018', '2019']:
        if year in years:
            stats = years[year]
            print(f"\n{year}:")
            print(f"  Total messages: {stats['total']}")
            print(f"  From David: {stats['from_david']}")
            print(f"  To David: {stats['to_david']}")
            print(f"  Chats: {stats['chats']}")
            
            # Show sample messages
            year_messages = [msg for msg in messages if msg['readable_date'].startswith(year)]
            print(f"  Sample messages:")
            for i, msg in enumerate(year_messages[:3]):
                direction = "FROM David" if msg['is_from_me'] == '1' else "TO David"
                print(f"    {i+1}. {msg['readable_date']} - {direction} - {msg['text'][:50]}...")
        else:
            print(f"\n{year}: NO MESSAGES FOUND")
    
    # Check for missing years
    all_years = sorted(years.keys())
    print(f"\n📊 Year Range: {min(all_years)} to {max(all_years)}")
    
    # Check for gaps in 2015-2025
    expected_years = [str(year) for year in range(2015, 2026)]
    missing_years = [year for year in expected_years if year not in all_years]
    
    if missing_years:
        print(f"⚠️  Missing years: {missing_years}")
    else:
        print("✅ No missing years in the range 2015-2025")
    
    return years, data


def main():
    json_file = 'supabase_nitzan_messages_20250724_154625.json'
    
    try:
        analyze_years(json_file)
        
    except FileNotFoundError:
        print(f"❌ File not found: {json_file}")
    except Exception as e:
        print(f"❌ Error: {e}")


if __name__ == "__main__":
    main() 