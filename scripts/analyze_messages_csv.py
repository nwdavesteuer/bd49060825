#!/usr/bin/env python3
"""
Analyze Messages - David Steuer.csv and compare with extracted data
"""

import csv
import json
from datetime import datetime
import os

def analyze_csv_messages():
    """Analyze the Messages - David Steuer.csv file"""
    csv_path = "/Users/davidsteuer/Documents/Messages - David Steuer.csv"
    
    if not os.path.exists(csv_path):
        print(f"❌ CSV file not found: {csv_path}")
        return
    
    messages = []
    years = set()
    
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            # Extract date and year
            message_date = row.get('Message Date', '')
            if message_date:
                try:
                    date_obj = datetime.strptime(message_date, '%Y-%m-%d %H:%M:%S')
                    year = date_obj.year
                    years.add(year)
                    
                    messages.append({
                        'date': message_date,
                        'year': year,
                        'text': row.get('Text', ''),
                        'sender': row.get('Sender Name', ''),
                        'type': row.get('Type', ''),
                        'service': row.get('Service', ''),
                        'attachment': row.get('Attachment', '')
                    })
                except ValueError:
                    print(f"⚠️  Could not parse date: {message_date}")
    
    # Analyze by year
    year_counts = {}
    for msg in messages:
        year = msg['year']
        if year not in year_counts:
            year_counts[year] = {'total': 0, 'from_david': 0, 'from_nitzan': 0}
        
        year_counts[year]['total'] += 1
        
        # Determine sender (David or Nitzan)
        if msg['type'] == 'Outgoing':
            year_counts[year]['from_david'] += 1
        elif msg['type'] == 'Incoming':
            year_counts[year]['from_nitzan'] += 1
    
    print("📊 ANALYSIS OF 'Messages - David Steuer.csv'")
    print("=" * 50)
    print(f"📅 Date range: {min(years)} - {max(years)}")
    print(f"📱 Total messages: {len(messages)}")
    print(f"📅 Years found: {sorted(years)}")
    print()
    
    print("📈 Messages by year:")
    for year in sorted(year_counts.keys()):
        counts = year_counts[year]
        print(f"  {year}: {counts['total']} total ({counts['from_david']} from David, {counts['from_nitzan']} from Nitzan)")
    
    return messages, year_counts

def compare_with_extracted_data():
    """Compare CSV data with our extracted data"""
    # Load our latest extracted data
    extracted_files = [
        'supabase_complete_messages_20250727_195358.json',
        'supabase_2024_2025_messages_20250727_195358.json'
    ]
    
    extracted_data = {}
    
    for file_path in extracted_files:
        if os.path.exists(file_path):
            with open(file_path, 'r') as f:
                data = json.load(f)
                if isinstance(data, list):
                    for msg in data:
                        # Extract year from readable_date
                        year = 'unknown'
                        if msg.get('readable_date'):
                            try:
                                date_obj = datetime.fromisoformat(msg['readable_date'].replace('Z', '+00:00'))
                                year = date_obj.year
                            except:
                                pass
                        elif msg.get('date'):
                            try:
                                date_obj = datetime.fromisoformat(msg['date'].replace('Z', '+00:00'))
                                year = date_obj.year
                            except:
                                pass
                        
                        if year not in extracted_data:
                            extracted_data[year] = []
                        extracted_data[year].append(msg)
    
    print("\n🔄 COMPARISON WITH EXTRACTED DATA")
    print("=" * 50)
    
    # Compare 2024-2025 data
    csv_messages, csv_year_counts = analyze_csv_messages()
    
    print("\n📊 2024-2025 Comparison:")
    for year in [2024, 2025]:
        csv_count = csv_year_counts.get(year, {}).get('total', 0)
        extracted_count = len(extracted_data.get(year, []))
        
        print(f"  {year}:")
        print(f"    CSV: {csv_count} messages")
        print(f"    Extracted: {extracted_count} messages")
        print(f"    Difference: {extracted_count - csv_count}")
    
    # Check for potential duplicates
    print("\n🔍 Checking for duplicates...")
    csv_texts = set()
    for msg in csv_messages:
        if msg['text']:
            csv_texts.add(msg['text'].strip())
    
    extracted_texts = set()
    for year_data in extracted_data.values():
        for msg in year_data:
            if msg.get('text'):
                extracted_texts.add(msg['text'].strip())
    
    duplicates = csv_texts.intersection(extracted_texts)
    print(f"  Potential text duplicates found: {len(duplicates)}")
    
    if duplicates:
        print("  Sample duplicates:")
        for i, text in enumerate(list(duplicates)[:5]):
            print(f"    {i+1}. {text[:50]}...")

if __name__ == "__main__":
    analyze_csv_messages()
    compare_with_extracted_data() 