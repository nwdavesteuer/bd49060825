#!/usr/bin/env python3
"""
Create chunked SQL import files for Supabase
"""

import json
import os

def create_chunked_sql_import():
    """Create SQL import files in small chunks"""
    
    print("📊 CREATING CHUNKED SQL IMPORTS")
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
    
    # Create chunks directory
    chunks_dir = "final_datasets/sql_chunks"
    os.makedirs(chunks_dir, exist_ok=True)
    
    # Create chunked SQL files
    print(f"\n💾 CREATING CHUNKED SQL FILES:")
    print("=" * 35)
    
    chunk_size = 200  # Small enough for Supabase SQL editor
    total_chunks = (len(data) + chunk_size - 1) // chunk_size
    
    print(f"📦 Creating {total_chunks} chunks of {chunk_size} records each")
    
    for chunk_num in range(total_chunks):
        start_idx = chunk_num * chunk_size
        end_idx = min(start_idx + chunk_size, len(data))
        chunk_data = data[start_idx:end_idx]
        
        # Create SQL file for this chunk
        output_file = f"{chunks_dir}/chunk_{chunk_num + 1:03d}_of_{total_chunks:03d}.sql"
        
        with open(output_file, 'w') as f:
            f.write(f"-- Supabase Import Chunk {chunk_num + 1} of {total_chunks}\n")
            f.write(f"-- Records {start_idx + 1} to {end_idx} of {len(data)}\n\n")
            
            f.write("INSERT INTO david_nitzan_all_messages (\n")
            f.write("    message_id, guid, text, date, date_read, is_from_me,\n")
            f.write("    sender, recipient, has_attachments, attachments_info, emojis, links,\n")
            f.write("    service, account, contact_id, readable_date\n")
            f.write(") VALUES\n")
            
            values = []
            for msg in chunk_data:
                # Escape text properly for SQL
                text = msg.get('text', '').replace("'", "''").replace('\\', '\\\\')
                
                value = f"({msg.get('message_id', 0)}, '{msg.get('guid', '')}', '{text}', '{msg.get('date', '')}', '{msg.get('date_read', '')}', {msg.get('is_from_me', 0)}, '{msg.get('sender', '')}', '{msg.get('recipient', '')}', {msg.get('has_attachments', 0)}, '{msg.get('attachments_info', '')}', '{msg.get('emojis', '')}', '{msg.get('links', '')}', '{msg.get('service', 'iMessage')}', '{msg.get('account', '')}', '{msg.get('contact_id', '')}', '{msg.get('readable_date', '')}')"
                values.append(value)
            
            f.write(",\n".join(values))
            f.write(";\n")
        
        print(f"✅ Created: {output_file} ({len(chunk_data)} records)")
    
    # Create a simple version with just essential fields
    print(f"\n💾 CREATING SIMPLE CHUNKED FILES:")
    print("=" * 40)
    
    simple_chunks_dir = "final_datasets/simple_sql_chunks"
    os.makedirs(simple_chunks_dir, exist_ok=True)
    
    for chunk_num in range(total_chunks):
        start_idx = chunk_num * chunk_size
        end_idx = min(start_idx + chunk_size, len(data))
        chunk_data = data[start_idx:end_idx]
        
        # Create simple SQL file for this chunk
        output_file = f"{simple_chunks_dir}/simple_chunk_{chunk_num + 1:03d}_of_{total_chunks:03d}.sql"
        
        with open(output_file, 'w') as f:
            f.write(f"-- Simple Supabase Import Chunk {chunk_num + 1} of {total_chunks}\n")
            f.write(f"-- Records {start_idx + 1} to {end_idx} of {len(data)}\n\n")
            
            f.write("INSERT INTO david_nitzan_all_messages (\n")
            f.write("    message_id, guid, text, sender, recipient, readable_date\n")
            f.write(") VALUES\n")
            
            values = []
            for msg in chunk_data:
                text = msg.get('text', '').replace("'", "''").replace('\\', '\\\\')
                value = f"({msg.get('message_id', 0)}, '{msg.get('guid', '')}', '{text}', '{msg.get('sender', '')}', '{msg.get('recipient', '')}', '{msg.get('readable_date', '')}')"
                values.append(value)
            
            f.write(",\n".join(values))
            f.write(";\n")
        
        print(f"✅ Created: {output_file} ({len(chunk_data)} records)")
    
    # Create a batch script
    print(f"\n💾 CREATING BATCH SCRIPT:")
    print("=" * 30)
    
    batch_script = "final_datasets/run_all_chunks.sh"
    
    with open(batch_script, 'w') as f:
        f.write("#!/bin/bash\n")
        f.write("# Batch script to run all SQL chunks\n")
        f.write("# Copy and paste each command into Supabase SQL Editor\n\n")
        
        for chunk_num in range(total_chunks):
            f.write(f"# Chunk {chunk_num + 1} of {total_chunks}\n")
            f.write(f"# Copy the contents of: sql_chunks/chunk_{chunk_num + 1:03d}_of_{total_chunks:03d}.sql\n")
            f.write(f"# Then paste and run in Supabase SQL Editor\n\n")
    
    print(f"✅ Created batch script: {batch_script}")
    
    # Show file sizes
    print(f"\n📊 FILE SIZES:")
    print("=" * 15)
    
    for i in range(min(5, total_chunks)):
        chunk_file = f"{chunks_dir}/chunk_{i + 1:03d}_of_{total_chunks:03d}.sql"
        if os.path.exists(chunk_file):
            size = os.path.getsize(chunk_file)
            print(f"  {chunk_file}: {size:,} bytes")
    
    print(f"\n🎉 CHUNKED SQL FILES CREATED!")
    print("=" * 35)
    print(f"✅ {total_chunks} chunks created in: {chunks_dir}")
    print(f"✅ {total_chunks} simple chunks in: {simple_chunks_dir}")
    print(f"✅ Each chunk has ~{chunk_size} records")
    print(f"📋 Run chunks one at a time in Supabase SQL Editor")
    print(f"📋 Start with chunk_001_of_{total_chunks:03d}.sql")

if __name__ == "__main__":
    create_chunked_sql_import() 