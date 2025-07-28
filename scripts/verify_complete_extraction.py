#!/usr/bin/env python3
"""
Verify complete extraction of all David-Nitzan messages from all data sources
"""

import json
from datetime import datetime
import os

def verify_complete_extraction():
    """Verify we have all correct David-Nitzan messages from all sources"""
    
    print("🔍 VERIFYING COMPLETE EXTRACTION")
    print("=" * 50)
    
    # Define Nitzan's CORRECT identifiers (no Jonathan)
    nitzan_identifiers = [
        '+19172390518',  # Primary phone number
        'nitzan.pelman@gmail.com',
        'nitzanpelman@icloud.com',
        'nitzanpelman@me.com',
        'nitzanpelman@mac.com'
    ]
    
    # Jonathan's number (to exclude)
    jonathan_number = '+19179513387'
    
    # Load our final dataset
    try:
        with open("pure_david_nitzan_no_jonathan.json", 'r') as f:
            final_data = json.load(f)
    except FileNotFoundError:
        print("❌ Final dataset not found")
        return
    
    print(f"📊 Current final dataset: {len(final_data)} messages")
    
    # Check all available data sources
    data_sources = [
        "final_direct_david_nitzan_20250727_210753.json",
        "correct_david_nitzan_messages.json", 
        "direct_david_nitzan_messages_20250727_210719.json",
        "ultimate_comprehensive_all_20250727_205541.json",
        "comprehensive_contact_search_20250727_210406.json"
    ]
    
    all_potential_messages = []
    source_analysis = {}
    
    print(f"\n📋 CHECKING ALL DATA SOURCES:")
    print("=" * 40)
    
    for source_file in data_sources:
        if os.path.exists(source_file):
            try:
                with open(source_file, 'r') as f:
                    source_data = json.load(f)
                
                print(f"\n📁 {source_file}: {len(source_data)} messages")
                
                # Filter for David-Nitzan messages from this source
                nitzan_messages = []
                for msg in source_data:
                    chat_identifier = msg.get('chat_identifier', '')
                    display_name = msg.get('display_name', '')
                    
                    # Skip group chats
                    if chat_identifier.startswith('chat'):
                        continue
                    if display_name and display_name != '':
                        continue
                    
                    # Skip Jonathan's number
                    if jonathan_number in chat_identifier:
                        continue
                    
                    # Check if this is a Nitzan chat
                    is_nitzan_chat = False
                    for identifier in nitzan_identifiers:
                        if identifier in chat_identifier:
                            is_nitzan_chat = True
                            break
                    
                    if is_nitzan_chat:
                        nitzan_messages.append(msg)
                
                source_analysis[source_file] = {
                    'total': len(source_data),
                    'nitzan_messages': len(nitzan_messages),
                    'messages': nitzan_messages
                }
                
                all_potential_messages.extend(nitzan_messages)
                
                print(f"  ✅ David-Nitzan messages: {len(nitzan_messages)}")
                
            except Exception as e:
                print(f"  ❌ Error reading {source_file}: {e}")
        else:
            print(f"  ❌ {source_file}: File not found")
    
    print(f"\n📊 SUMMARY OF ALL SOURCES:")
    print("=" * 35)
    
    total_potential = len(all_potential_messages)
    print(f"📊 Total potential David-Nitzan messages across all sources: {total_potential}")
    
    for source, data in source_analysis.items():
        print(f"  {source}: {data['nitzan_messages']} messages")
    
    # Deduplicate based on GUID
    print(f"\n🔍 DEDUPLICATING MESSAGES:")
    print("=" * 30)
    
    unique_messages = {}
    for msg in all_potential_messages:
        guid = msg.get('guid')
        if guid:
            unique_messages[guid] = msg
    
    print(f"✅ Unique messages (by GUID): {len(unique_messages)}")
    
    # Sort chronologically
    print(f"\n📅 SORTING CHRONOLOGICALLY:")
    print("=" * 30)
    
    sorted_messages = []
    for msg in unique_messages.values():
        date_str = msg.get('readable_date', '')
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
    complete_dataset = [msg for date, msg in sorted_messages]
    
    print(f"✅ Chronologically sorted: {len(complete_dataset)} messages")
    
    # Compare with our current dataset
    print(f"\n🔍 COMPARING WITH CURRENT DATASET:")
    print("=" * 40)
    
    current_guids = set()
    for msg in final_data:
        guid = msg.get('guid')
        if guid:
            current_guids.add(guid)
    
    complete_guids = set()
    for msg in complete_dataset:
        guid = msg.get('guid')
        if guid:
            complete_guids.add(guid)
    
    missing_guids = complete_guids - current_guids
    extra_guids = current_guids - complete_guids
    
    print(f"📊 Current dataset: {len(current_guids)} unique messages")
    print(f"📊 Complete dataset: {len(complete_guids)} unique messages")
    print(f"❌ Missing from current: {len(missing_guids)} messages")
    print(f"❌ Extra in current: {len(extra_guids)} messages")
    
    if missing_guids:
        print(f"\n🔍 MISSING MESSAGES:")
        print("=" * 25)
        
        missing_messages = [msg for msg in complete_dataset if msg.get('guid') in missing_guids]
        
        for i, msg in enumerate(missing_messages[:10], 1):
            date = msg.get('readable_date', 'Unknown')
            sender = msg.get('sender_identified', 'Unknown')
            text = msg.get('text', '')[:50]
            print(f"{i}. [{sender}] {date}: {text}...")
        
        if len(missing_messages) > 10:
            print(f"  ... and {len(missing_messages) - 10} more")
    
    # Analyze by year
    print(f"\n📊 COMPLETE DATASET BY YEAR:")
    print("=" * 35)
    
    by_year = {}
    for msg in complete_dataset:
        year = msg.get('year')
        if year:
            if year not in by_year:
                by_year[year] = {'David': 0, 'Nitzan': 0}
            sender = msg.get('sender_identified', 'Unknown')
            if sender in ['David', 'Nitzan']:
                by_year[year][sender] += 1
    
    for year in sorted(by_year.keys()):
        counts = by_year[year]
        total = sum(counts.values())
        print(f"  {year}: {total} messages (David: {counts['David']}, Nitzan: {counts['Nitzan']})")
    
    # Count by sender
    david_count = len([msg for msg in complete_dataset if msg.get('sender_identified') == 'David'])
    nitzan_count = len([msg for msg in complete_dataset if msg.get('sender_identified') == 'Nitzan'])
    
    print(f"\n👥 Sender breakdown:")
    print(f"  David: {david_count} messages")
    print(f"  Nitzan: {nitzan_count} messages")
    print(f"  Total: {len(complete_dataset)} messages")
    
    # Create the complete dataset if there are missing messages
    if missing_guids:
        print(f"\n💾 CREATING COMPLETE DATASET:")
        print("=" * 35)
        
        # Save the complete dataset
        output_filename = "complete_david_nitzan_conversation.json"
        with open(output_filename, 'w') as f:
            json.dump(complete_dataset, f, indent=2)
        
        print(f"✅ Saved {len(complete_dataset)} messages to {output_filename}")
        
        # Create Supabase-ready files
        csv_filename = "complete_david_nitzan_conversation.csv"
        with open(csv_filename, 'w', newline='', encoding='utf-8') as f:
            import csv
            writer = csv.writer(f)
            
            # Write header
            writer.writerow([
                'message_id', 'guid', 'text', 'date', 'date_read', 'is_from_me',
                'sender_identified', 'recipient', 'emojis', 'links', 'service', 'account',
                'contact_id', 'readable_date', 'apple_date', 'apple_date_read'
            ])
            
            # Write data
            for msg in complete_dataset:
                writer.writerow([
                    msg.get('message_id', ''),
                    msg.get('guid', ''),
                    msg.get('text', ''),
                    msg.get('date', ''),
                    msg.get('date_read', ''),
                    msg.get('is_from_me', ''),
                    msg.get('sender_identified', ''),
                    msg.get('recipient', ''),
                    msg.get('emojis', ''),
                    msg.get('links', ''),
                    msg.get('service', ''),
                    msg.get('account', ''),
                    msg.get('contact_id', ''),
                    msg.get('readable_date', ''),
                    msg.get('apple_date', ''),
                    msg.get('apple_date_read', '')
                ])
        
        print(f"✅ Created Supabase CSV: {csv_filename}")
        
        # Create JSON for Supabase
        supabase_json_filename = "complete_david_nitzan_conversation_supabase.json"
        supabase_data = []
        
        for msg in complete_dataset:
            supabase_msg = {
                'message_id': msg.get('message_id'),
                'guid': msg.get('guid'),
                'text': msg.get('text'),
                'date': msg.get('date'),
                'date_read': msg.get('date_read'),
                'is_from_me': msg.get('is_from_me'),
                'sender_identified': msg.get('sender_identified'),
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
            supabase_data.append(supabase_msg)
        
        with open(supabase_json_filename, 'w') as f:
            json.dump(supabase_data, f, indent=2)
        
        print(f"✅ Created Supabase JSON: {supabase_json_filename}")
        
        print(f"\n🎉 COMPLETE DATASET SUMMARY:")
        print("=" * 30)
        print(f"✅ Complete David-Nitzan conversation: {len(complete_dataset)} messages")
        print(f"📅 Date range: {complete_dataset[0].get('readable_date')} to {complete_dataset[-1].get('readable_date')}")
        print(f"👥 David: {david_count} messages | Nitzan: {nitzan_count} messages")
        print(f"📊 Balance: {david_count/len(complete_dataset)*100:.1f}% David, {nitzan_count/len(complete_dataset)*100:.1f}% Nitzan")
        print(f"📁 Files created:")
        print(f"  - {output_filename}")
        print(f"  - {csv_filename}")
        print(f"  - {supabase_json_filename}")
        print(f"✅ This is the complete dataset from all sources!")
    else:
        print(f"\n✅ VERIFICATION COMPLETE:")
        print("=" * 25)
        print(f"✅ Current dataset is complete!")
        print(f"✅ No missing messages found")
        print(f"✅ All sources have been checked")

if __name__ == "__main__":
    verify_complete_extraction() 