#!/usr/bin/env python3
"""
Analyze Messages - David Steuer.csv for 2024-2025 data (FIXED VERSION)
"""

import csv
import json
import os
from datetime import datetime
from pathlib import Path

def analyze_csv_2024_2025_fixed():
    """Analyze the CSV file for 2024-2025 messages with proper sender identification"""
    
    csv_path = "/Users/davidsteuer/Documents/Messages - David Steuer.csv"
    
    if not os.path.exists(csv_path):
        print(f"❌ CSV file not found: {csv_path}")
        return
    
    print("🔍 ANALYZING MESSAGES - DAVID STEUER.CSV (FIXED VERSION)")
    print("=" * 70)
    print(f"📁 File: {csv_path}")
    
    try:
        with open(csv_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            
            messages = []
            year_counts = {}
            sender_counts = {}
            service_counts = {}
            type_counts = {}
            
            for row in reader:
                # Parse message date
                message_date = row.get('Message Date', '')
                if message_date:
                    try:
                        date_obj = datetime.fromisoformat(message_date.replace('Z', '+00:00'))
                        year = date_obj.year
                        month = date_obj.month
                    except:
                        year = None
                        month = None
                else:
                    year = None
                    month = None
                
                # Get message information
                message_type = row.get('Type', '')
                sender_name = row.get('Sender Name', '')
                sender_id = row.get('Sender ID', '')
                service = row.get('Service', '')
                text = row.get('Text', '')
                attachment = row.get('Attachment', '')
                
                # Determine sender based on Type field
                if message_type.lower() == 'outgoing':
                    sender = 'David'
                elif message_type.lower() == 'incoming':
                    sender = 'Nitzan'
                else:
                    sender = 'Unknown'
                
                # Count by year
                if year:
                    if year not in year_counts:
                        year_counts[year] = {'David': 0, 'Nitzan': 0, 'Unknown': 0}
                    year_counts[year][sender] += 1
                
                # Count by sender
                sender_counts[sender] = sender_counts.get(sender, 0) + 1
                
                # Count by service
                service_counts[service] = service_counts.get(service, 0) + 1
                
                # Count by type
                type_counts[message_type] = type_counts.get(message_type, 0) + 1
                
                # Store message data
                message_data = {
                    'message_date': message_date,
                    'message_type': message_type,
                    'sender': sender,
                    'sender_name': sender_name,
                    'sender_id': sender_id,
                    'service': service,
                    'text': text,
                    'attachment': attachment,
                    'year': year,
                    'month': month
                }
                
                messages.append(message_data)
            
            print(f"📊 Total messages in CSV: {len(messages)}")
            
            # Show year breakdown
            print(f"\n📅 Messages by Year:")
            for year in sorted(year_counts.keys()):
                david_count = year_counts[year].get('David', 0)
                nitzan_count = year_counts[year].get('Nitzan', 0)
                unknown_count = year_counts[year].get('Unknown', 0)
                total = david_count + nitzan_count + unknown_count
                print(f"  {year}: {total} total ({david_count} from David, {nitzan_count} from Nitzan, {unknown_count} unknown)")
            
            # Show sender breakdown
            print(f"\n👤 Messages by Sender:")
            for sender, count in sender_counts.items():
                print(f"  {sender}: {count} messages")
            
            # Show type breakdown
            print(f"\n📤 Messages by Type:")
            for msg_type, count in type_counts.items():
                print(f"  {msg_type}: {count} messages")
            
            # Show service breakdown
            print(f"\n📱 Messages by Service:")
            for service, count in service_counts.items():
                print(f"  {service}: {count} messages")
            
            # Show attachment info
            attachment_count = sum(1 for msg in messages if msg['attachment'])
            print(f"\n📎 Messages with attachments: {attachment_count}")
            
            # Find date range
            messages_with_dates = [msg for msg in messages if msg['message_date']]
            if messages_with_dates:
                earliest = min(messages_with_dates, key=lambda x: x['message_date'])
                latest = max(messages_with_dates, key=lambda x: x['message_date'])
                
                print(f"\n📅 Date Range:")
                print(f"  Earliest: {earliest['message_date']} ({earliest['sender']})")
                print(f"  Latest: {latest['message_date']} ({latest['sender']})")
            
            # Filter for 2024-2025 only
            messages_2024_2025 = [msg for msg in messages if msg.get('year') in [2024, 2025]]
            print(f"\n🎯 2024-2025 Messages: {len(messages_2024_2025)}")
            
            if messages_2024_2025:
                year_2024_2025_counts = {}
                for msg in messages_2024_2025:
                    year = msg['year']
                    sender = msg['sender']
                    if year not in year_2024_2025_counts:
                        year_2024_2025_counts[year] = {'David': 0, 'Nitzan': 0, 'Unknown': 0}
                    year_2024_2025_counts[year][sender] += 1
                
                print(f"📅 2024-2025 Breakdown:")
                for year in sorted(year_2024_2025_counts.keys()):
                    david_count = year_2024_2025_counts[year].get('David', 0)
                    nitzan_count = year_2024_2025_counts[year].get('Nitzan', 0)
                    unknown_count = year_2024_2025_counts[year].get('Unknown', 0)
                    total = david_count + nitzan_count + unknown_count
                    print(f"  {year}: {total} total ({david_count} from David, {nitzan_count} from Nitzan, {unknown_count} unknown)")
            
            return messages_2024_2025
            
    except Exception as e:
        print(f"❌ Error analyzing CSV: {e}")
        return []

def convert_csv_to_supabase_format_fixed(csv_messages):
    """Convert CSV messages to Supabase format with proper sender identification"""
    
    print(f"\n🔄 CONVERTING TO SUPABASE FORMAT")
    print("=" * 50)
    
    supabase_messages = []
    
    for i, msg in enumerate(csv_messages):
        # Generate a unique message_id
        message_id = i + 1
        
        # Parse date
        readable_date = None
        apple_date = None
        if msg['message_date']:
            try:
                date_obj = datetime.fromisoformat(msg['message_date'].replace('Z', '+00:00'))
                readable_date = date_obj.isoformat()
                apple_date = int((date_obj.timestamp() - 978307200) * 1000000000)
            except:
                pass
        
        # Determine is_from_me based on sender
        is_from_me = "David" if msg['sender'] == 'David' else "Nitzan"
        
        # Determine sender/recipient
        if msg['sender'] == 'David':
            sender = "David"
            recipient = "Nitzan"
        else:
            sender = "Nitzan"
            recipient = "David"
        
        supabase_message = {
            'message_id': message_id,
            'guid': f"csv_{message_id}",  # Generate a unique GUID
            'text': msg['text'] or "",
            'date': readable_date,
            'date_read': None,  # Not available in CSV
            'is_from_me': is_from_me,
            'sender': sender,
            'recipient': recipient,
            'emojis': None,
            'links': None,
            'service': msg['service'],
            'account': None,
            'contact_id': msg['sender'],
            'readable_date': readable_date,
            'apple_date': apple_date,
            'apple_date_read': None
        }
        
        supabase_messages.append(supabase_message)
    
    # Save as JSON and CSV
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    
    json_file = f"csv_2024_2025_supabase_fixed_{timestamp}.json"
    with open(json_file, 'w') as f:
        json.dump(supabase_messages, f, indent=2)
    
    csv_file = f"csv_2024_2025_supabase_fixed_{timestamp}.csv"
    fieldnames = [
        'message_id', 'guid', 'text', 'date', 'date_read', 'is_from_me',
        'sender', 'recipient', 'emojis', 'links', 'service', 'account',
        'contact_id', 'readable_date', 'apple_date', 'apple_date_read'
    ]
    
    with open(csv_file, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        
        for msg in supabase_messages:
            row = {}
            for field in fieldnames:
                row[field] = msg.get(field, None)
            writer.writerow(row)
    
    print(f"💾 Saved {len(supabase_messages)} messages:")
    print(f"  JSON: {json_file}")
    print(f"  CSV: {csv_file}")
    
    return supabase_messages

def main():
    """Main analysis function"""
    # Analyze CSV with fixed sender identification
    csv_messages_2024_2025 = analyze_csv_2024_2025_fixed()
    
    if csv_messages_2024_2025:
        # Convert to Supabase format
        supabase_messages = convert_csv_to_supabase_format_fixed(csv_messages_2024_2025)
        
        print(f"\n✅ Analysis complete! Found {len(csv_messages_2024_2025)} messages from 2024-2025 in the CSV file.")
        print(f"📊 This CSV contains a complete conversation between David and Nitzan for 2024-2025.")
    else:
        print("❌ No 2024-2025 messages found in CSV file")

if __name__ == "__main__":
    main() 