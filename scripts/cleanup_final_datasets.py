#!/usr/bin/env python3
"""
Clean up final_datasets to keep only the most recent and important files
"""

import os
import shutil
from datetime import datetime

def cleanup_final_datasets():
    """Clean up final_datasets directory"""
    
    print("🧹 CLEANING UP FINAL_DATASETS")
    print("=" * 40)
    
    # Create organized archive directories
    archive_dirs = {
        'supabase_exports': 'archive/supabase_exports',
        'csv_versions': 'archive/csv_versions', 
        'json_versions': 'archive/json_versions',
        'sql_versions': 'archive/sql_versions',
        'old_datasets': 'archive/old_datasets'
    }
    
    for dir_name, dir_path in archive_dirs.items():
        os.makedirs(dir_path, exist_ok=True)
        print(f"✅ Created: {dir_path}")
    
    # Define what to keep in final_datasets (most recent/important)
    keep_in_final = [
        'supabase_exact_match.csv',  # Most recent attempt to match original format
        'supabase_exact_match_minimal.csv',  # Minimal version
        'supabase_import_ready.json',  # Clean JSON for import
        'supabase_json_import.json',  # JSON import file
        'supabase_minimal_json.json',  # Minimal JSON
        'final_complete_david_nitzan_conversation.json',  # Complete dataset
        'final_complete_david_nitzan_conversation.csv',  # Complete CSV
        'final_complete_david_nitzan_conversation_supabase.json',  # Supabase format
        'README.md'  # Documentation
    ]
    
    # Define what to move where
    move_to_supabase_exports = [
        'supabase_working_v1.csv',
        'supabase_working_v2.csv', 
        'supabase_working_v3.tsv',
        'supabase_working_v4.csv',
        'supabase_clean_import.csv',
        'supabase_minimal_import.csv',
        'supabase_compatible_david_nitzan_conversation_pipe.csv',
        'supabase_compatible_david_nitzan_conversation_simple.csv',
        'supabase_compatible_david_nitzan_conversation.tsv',
        'supabase_compatible_david_nitzan_conversation_minimal.csv',
        'supabase_compatible_david_nitzan_conversation_fixed.csv',
        'supabase_compatible_david_nitzan_conversation.csv',
        'supabase_compatible_david_nitzan_conversation_supabase.json',
        'supabase_compatible_david_nitzan_conversation.json'
    ]
    
    move_to_csv_versions = [
        'pure_david_nitzan_no_jonathan.csv'
    ]
    
    move_to_json_versions = [
        'pure_david_nitzan_no_jonathan.json',
        'pure_david_nitzan_no_jonathan_supabase.json'
    ]
    
    move_to_sql_versions = [
        'supabase_import.sql',
        'supabase_simple_import.sql',
        'run_all_chunks.sh'
    ]
    
    move_to_old_datasets = [
        'missing_messages_overlap_period.json',
        'missing_messages.json'
    ]
    
    # Process files in final_datasets
    final_datasets_path = 'final_datasets'
    
    print(f"\n📁 PROCESSING FILES IN {final_datasets_path}:")
    print("=" * 50)
    
    files_processed = 0
    files_kept = 0
    files_moved = 0
    
    for filename in os.listdir(final_datasets_path):
        file_path = os.path.join(final_datasets_path, filename)
        
        if os.path.isfile(file_path):
            files_processed += 1
            
            if filename in keep_in_final:
                print(f"✅ KEEPING: {filename}")
                files_kept += 1
                
            elif filename in move_to_supabase_exports:
                dest = os.path.join(archive_dirs['supabase_exports'], filename)
                shutil.move(file_path, dest)
                print(f"📦 MOVED TO SUPABASE_EXPORTS: {filename}")
                files_moved += 1
                
            elif filename in move_to_csv_versions:
                dest = os.path.join(archive_dirs['csv_versions'], filename)
                shutil.move(file_path, dest)
                print(f"📦 MOVED TO CSV_VERSIONS: {filename}")
                files_moved += 1
                
            elif filename in move_to_json_versions:
                dest = os.path.join(archive_dirs['json_versions'], filename)
                shutil.move(file_path, dest)
                print(f"📦 MOVED TO JSON_VERSIONS: {filename}")
                files_moved += 1
                
            elif filename in move_to_sql_versions:
                dest = os.path.join(archive_dirs['sql_versions'], filename)
                shutil.move(file_path, dest)
                print(f"📦 MOVED TO SQL_VERSIONS: {filename}")
                files_moved += 1
                
            elif filename in move_to_old_datasets:
                dest = os.path.join(archive_dirs['old_datasets'], filename)
                shutil.move(file_path, dest)
                print(f"📦 MOVED TO OLD_DATASETS: {filename}")
                files_moved += 1
                
            else:
                # Move unknown files to old_datasets
                dest = os.path.join(archive_dirs['old_datasets'], filename)
                shutil.move(file_path, dest)
                print(f"❓ UNKNOWN FILE MOVED TO OLD_DATASETS: {filename}")
                files_moved += 1
    
    # Handle directories in final_datasets
    print(f"\n📁 PROCESSING DIRECTORIES IN {final_datasets_path}:")
    print("=" * 50)
    
    for item in os.listdir(final_datasets_path):
        item_path = os.path.join(final_datasets_path, item)
        
        if os.path.isdir(item_path):
            if item in ['sql_chunks', 'simple_sql_chunks']:
                # Move SQL chunks to sql_versions
                dest = os.path.join(archive_dirs['sql_versions'], item)
                shutil.move(item_path, dest)
                print(f"📦 MOVED DIRECTORY TO SQL_VERSIONS: {item}")
            else:
                # Move unknown directories to old_datasets
                dest = os.path.join(archive_dirs['old_datasets'], item)
                shutil.move(item_path, dest)
                print(f"❓ UNKNOWN DIRECTORY MOVED TO OLD_DATASETS: {item}")
    
    # Create a summary of what's left in final_datasets
    print(f"\n📊 CLEANUP SUMMARY:")
    print("=" * 25)
    print(f"Files processed: {files_processed}")
    print(f"Files kept in final_datasets: {files_kept}")
    print(f"Files moved to archive: {files_moved}")
    
    print(f"\n📁 FINAL_DATASETS CONTENTS AFTER CLEANUP:")
    print("=" * 45)
    
    remaining_files = os.listdir(final_datasets_path)
    for item in sorted(remaining_files):
        item_path = os.path.join(final_datasets_path, item)
        if os.path.isfile(item_path):
            size = os.path.getsize(item_path)
            print(f"📄 {item} ({size:,} bytes)")
        else:
            print(f"📁 {item}/")
    
    # Create a new README for final_datasets
    print(f"\n📝 CREATING UPDATED README:")
    print("=" * 30)
    
    readme_content = f"""# Final Datasets

This directory contains the most recent and important datasets for the David-Nitzan conversation project.

## Current Files

### Primary Datasets
- `final_complete_david_nitzan_conversation.json` - Complete conversation dataset (34MB)
- `final_complete_david_nitzan_conversation.csv` - Complete conversation in CSV format (11MB)
- `final_complete_david_nitzan_conversation_supabase.json` - Supabase-compatible format (26MB)

### Supabase Import Files
- `supabase_exact_match.csv` - CSV matching original format exactly (9.4MB)
- `supabase_exact_match_minimal.csv` - Minimal version of exact match (9.3MB)
- `supabase_import_ready.json` - Clean JSON for Supabase import (23MB)
- `supabase_json_import.json` - Full JSON import file (23MB)
- `supabase_minimal_json.json` - Minimal JSON import file (11MB)

## Archive Locations

Old versions and experimental files have been moved to:
- `archive/supabase_exports/` - Various Supabase export attempts
- `archive/csv_versions/` - Different CSV format versions
- `archive/json_versions/` - Different JSON format versions
- `archive/sql_versions/` - SQL import files and chunks
- `archive/old_datasets/` - Previous dataset versions

## Usage

For Supabase import, try these files in order:
1. `supabase_exact_match.csv` (matches original format)
2. `supabase_json_import.json` (JSON format)
3. `supabase_import_ready.json` (clean JSON)

Last updated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
"""
    
    with open('final_datasets/README.md', 'w') as f:
        f.write(readme_content)
    
    print(f"✅ Updated README.md in final_datasets")
    
    print(f"\n🎉 CLEANUP COMPLETE!")
    print("=" * 25)
    print(f"✅ Final_datasets now contains only the most important files")
    print(f"✅ All other files organized in archive subdirectories")
    print(f"✅ Project structure is now clean and organized")

if __name__ == "__main__":
    cleanup_final_datasets() 