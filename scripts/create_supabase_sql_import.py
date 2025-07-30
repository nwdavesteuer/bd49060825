#!/usr/bin/env python3
"""
Create SQL INSERT statements for Supabase import
"""

import json
import csv

def create_sql_import():
    """Create SQL INSERT statements for Supabase"""
    
    print("📊 CREATING SQL IMPORT STATEMENTS")
    print("=" * 40)
    
    # Load the JSON data
    print("📋 LOADING JSON DATA:")
    print("=" * 25)
    
    try:
        with open("final_datasets/supabase_import_ready.json", 'r') as f:
            data = json.load(f)
    except FileNotFoundError:
        print("❌ JSON file not found")
        return
    
    print(f"✅ Loaded {len(data)} messages")
    
    # Create SQL file
    print(f"\n💾 CREATING SQL FILE:")
    print("=" * 25)
    
    output_sql = "final_datasets/supabase_import.sql"
    
    with open(output_sql, 'w') as f:
        # Write header
        f.write("-- Supabase Import SQL\n")
        f.write("-- Generated for david_nitzan_all_messages table\n\n")
        
        # Write INSERT statements in batches
        batch_size = 1000
        total_batches = (len(data) + batch_size - 1) // batch_size
        
        for batch_num in range(total_batches):
            start_idx = batch_num * batch_size
            end_idx = min(start_idx + batch_size, len(data))
            batch_data = data[start_idx:end_idx]
            
            f.write(f"-- Batch {batch_num + 1} of {total_batches}\n")
            f.write("INSERT INTO david_nitzan_all_messages (\n")
            f.write("    message_id, guid, text, date, date_read, is_from_me,\n")
            f.write("    sender, recipient, has_attachments, attachments_info, emojis, links,\n")
            f.write("    service, account, contact_id, readable_date\n")
            f.write(") VALUES\n")
            
            values = []
            for msg in batch_data:
                # Escape text properly for SQL
                text = msg.get('text', '').replace("'", "''").replace('\\', '\\\\')
                
                value = f"({msg.get('message_id', 0)}, '{msg.get('guid', '')}', '{text}', '{msg.get('date', '')}', '{msg.get('date_read', '')}', {msg.get('is_from_me', 0)}, '{msg.get('sender', '')}', '{msg.get('recipient', '')}', {msg.get('has_attachments', 0)}, '{msg.get('attachments_info', '')}', '{msg.get('emojis', '')}', '{msg.get('links', '')}', '{msg.get('service', 'iMessage')}', '{msg.get('account', '')}', '{msg.get('contact_id', '')}', '{msg.get('readable_date', '')}')"
                values.append(value)
            
            f.write(",\n".join(values))
            f.write(";\n\n")
    
    print(f"✅ Created SQL file: {output_sql}")
    
    # Also create a simple version with just essential fields
    print(f"\n💾 CREATING SIMPLE SQL:")
    print("=" * 25)
    
    output_simple_sql = "final_datasets/supabase_simple_import.sql"
    
    with open(output_simple_sql, 'w') as f:
        f.write("-- Simple Supabase Import SQL\n")
        f.write("-- Essential fields only\n\n")
        
        for batch_num in range(total_batches):
            start_idx = batch_num * batch_size
            end_idx = min(start_idx + batch_size, len(data))
            batch_data = data[start_idx:end_idx]
            
            f.write(f"-- Batch {batch_num + 1} of {total_batches}\n")
            f.write("INSERT INTO david_nitzan_all_messages (\n")
            f.write("    message_id, guid, text, sender, recipient, readable_date\n")
            f.write(") VALUES\n")
            
            values = []
            for msg in batch_data:
                text = msg.get('text', '').replace("'", "''").replace('\\', '\\\\')
                value = f"({msg.get('message_id', 0)}, '{msg.get('guid', '')}', '{text}', '{msg.get('sender', '')}', '{msg.get('recipient', '')}', '{msg.get('readable_date', '')}')"
                values.append(value)
            
            f.write(",\n".join(values))
            f.write(";\n\n")
    
    print(f"✅ Created simple SQL: {output_simple_sql}")
    
    # Show sample of SQL
    print(f"\n🔍 SQL SAMPLE:")
    print("=" * 15)
    
    with open(output_sql, 'r') as f:
        lines = f.readlines()
        for i, line in enumerate(lines[:20]):
            print(f"  {line.rstrip()}")
        print("  ...")
    
    print(f"\n🎉 SQL IMPORT FILES CREATED!")
    print("=" * 35)
    print(f"✅ Full SQL: {output_sql}")
    print(f"✅ Simple SQL: {output_simple_sql}")
    print(f"📋 Copy and paste the SQL into Supabase SQL Editor")
    print(f"📋 Or use the JSON file in the Table Editor")

if __name__ == "__main__":
    create_sql_import() 