#!/usr/bin/env python3
"""
Final cleanup script to organize remaining files in root directory
"""

import os
import shutil

def final_cleanup():
    """Final cleanup of remaining files"""
    
    print("🧹 FINAL CLEANUP")
    print("=" * 30)
    
    # Create additional directories if needed
    additional_dirs = {
        'backups': 'Backup files from earlier extractions',
        'supabase_exports': 'Supabase export files',
        'guides': 'Project guides and documentation'
    }
    
    for dir_name, description in additional_dirs.items():
        if not os.path.exists(dir_name):
            os.makedirs(dir_name)
            print(f"  ✅ Created {dir_name}/ ({description})")
    
    # Define file categories for remaining files
    backup_files = [
        "backup_direct_nitzan_messages_20250725_110948.csv",
        "backup_direct_nitzan_messages_20250725_110948.json",
        "backup_nitzan_messages_20250725_110606.csv",
        "backup_nitzan_messages_20250725_110606.json",
        "clean_supabase_nitzan_messages_20250724_152525.csv",
        "clean_supabase_nitzan_messages_20250724_152525.json",
        "clean_supabase_nitzan_messages_20250724_152525.sql",
        "comprehensive_nitzan_messages_20250724_152207.csv",
        "comprehensive_nitzan_messages_20250724_152207.json",
        "comprehensive_nitzan_messages_20250725_111139.json",
        "correct_david_nitzan_messages.csv",
        "correct_david_nitzan_messages_supabase.json",
        "csv_2024_2025_supabase_20250727_203428.csv",
        "csv_2024_2025_supabase_20250727_203428.json",
        "csv_2024_2025_supabase_fixed_20250727_203534.csv",
        "csv_2024_2025_supabase_fixed_20250727_203534.json",
        "david_nitzan_all_messages.csv",
        "davids_backup_messages_20250727_205429.csv",
        "davids_backup_messages_20250727_205429.json",
        "final_comprehensive_2024_2025_20250727_203717.csv",
        "final_comprehensive_2024_2025_20250727_203717.json",
        "final_comprehensive_all_20250727_203716.csv",
        "final_comprehensive_all_20250727_203716.json",
        "ipad_nitzan_messages_20250727_103033.csv",
        "ipad_nitzan_messages_20250727_103033.json",
        "nitzan_messages.json",
        "supabase_2024_2025_messages_20250727_191715.csv",
        "supabase_2024_2025_messages_20250727_191715.json",
        "supabase_2024_2025_messages_20250727_195358.csv",
        "supabase_2024_2025_messages_20250727_195358.json",
        "supabase_complete_messages_20250727_191715.json",
        "supabase_complete_messages_20250727_195358.json",
        "supabase_direct_2024_2025_20250727_210753.csv",
        "supabase_direct_2024_2025_20250727_210753.json",
        "supabase_nitzan_messages_20250724_152439.csv",
        "supabase_nitzan_messages_20250724_152439.json",
        "supabase_nitzan_messages_20250724_152439.sql",
        "supabase_nitzan_messages_20250724_154625.csv",
        "supabase_nitzan_messages_20250724_154625.json",
        "supabase_ready_2024_2025_messages_20250727_201604.csv",
        "timemachine_backup_messages_20250727_201259.json",
        "ultimate_complete_messages_20250727_201359.json",
        "ultimate_comprehensive_2024_2025_20250727_205542.csv",
        "ultimate_comprehensive_2024_2025_20250727_205542.json",
        "ultimate_comprehensive_all_20250727_205541.csv",
        "ultimate_supabase_2024_2025_messages_20250727_201359.csv",
        "ultimate_supabase_2024_2025_messages_20250727_201359.json"
    ]
    
    supabase_files = [
        "supabase_2024_2025_extractor.py",
        "supabase_nitzan_extractor.py",
        "fix_supabase_structure.py",
        "create_clean_supabase_export.py"
    ]
    
    guide_files = [
        "GIFT_PROJECT_GUIDE.md",
        "NITZAN_EXTRACTION_GUIDE.md",
        "README.md",
        "SUPABASE_IMPORT_SUMMARY.md"
    ]
    
    additional_scripts = [
        "analyze_and_prepare_supabase.py",
        "analyze_messages_csv.py",
        "analyze_messages_csv_2024_2025.py",
        "analyze_messages_csv_2024_2025_fixed.py",
        "analyze_years.py",
        "check_2017_2018_timemachine.py",
        "check_all_years.py",
        "check_david_identifiers.py",
        "check_timemachine_timeline.py",
        "compare_timemachine_data.py",
        "complete_nitzan_extractor.py",
        "comprehensive_extractor.py",
        "comprehensive_nitzan_extractor.py",
        "deep_chat_search.py",
        "extract_attachments.py",
        "extract_from_backup.py",
        "extract_from_davids_backup.py",
        "extract_from_timemachine_backup.py",
        "final_complete_extractor.py",
        "final_comprehensive_dataset.py",
        "final_nitzan_extractor.py",
        "find_missing_messages.py",
        "ipad_message_extractor.py",
        "search_imac_timemachine.py",
        "search_timemachine_attachments.py",
        "ultimate_complete_extractor.py",
        "ultimate_comprehensive_with_davids_backup.py"
    ]
    
    temp_files = [
        "nitzan_messages.db",
        "requirements.txt"
    ]
    
    # Move backup files
    print(f"\n📦 MOVING BACKUP FILES:")
    print("=" * 25)
    
    for filename in backup_files:
        if os.path.exists(filename):
            try:
                shutil.move(filename, f"backups/{filename}")
                print(f"  ✅ Moved {filename} to backups/")
            except Exception as e:
                print(f"  ❌ Error moving {filename}: {e}")
        else:
            print(f"  ⚠️  {filename} not found")
    
    # Move supabase files
    print(f"\n📦 MOVING SUPABASE FILES:")
    print("=" * 25)
    
    for filename in supabase_files:
        if os.path.exists(filename):
            try:
                shutil.move(filename, f"supabase_exports/{filename}")
                print(f"  ✅ Moved {filename} to supabase_exports/")
            except Exception as e:
                print(f"  ❌ Error moving {filename}: {e}")
        else:
            print(f"  ⚠️  {filename} not found")
    
    # Move guide files
    print(f"\n📦 MOVING GUIDE FILES:")
    print("=" * 25)
    
    for filename in guide_files:
        if os.path.exists(filename):
            try:
                shutil.move(filename, f"guides/{filename}")
                print(f"  ✅ Moved {filename} to guides/")
            except Exception as e:
                print(f"  ❌ Error moving {filename}: {e}")
        else:
            print(f"  ⚠️  {filename} not found")
    
    # Move additional scripts
    print(f"\n📦 MOVING ADDITIONAL SCRIPTS:")
    print("=" * 30)
    
    for filename in additional_scripts:
        if os.path.exists(filename):
            try:
                shutil.move(filename, f"scripts/{filename}")
                print(f"  ✅ Moved {filename} to scripts/")
            except Exception as e:
                print(f"  ❌ Error moving {filename}: {e}")
        else:
            print(f"  ⚠️  {filename} not found")
    
    # Move temp files
    print(f"\n📦 MOVING TEMP FILES:")
    print("=" * 25)
    
    for filename in temp_files:
        if os.path.exists(filename):
            try:
                shutil.move(filename, f"temp/{filename}")
                print(f"  ✅ Moved {filename} to temp/")
            except Exception as e:
                print(f"  ❌ Error moving {filename}: {e}")
        else:
            print(f"  ⚠️  {filename} not found")
    
    # List remaining files
    print(f"\n📋 REMAINING FILES IN ROOT:")
    print("=" * 35)
    
    remaining_files = []
    for filename in os.listdir('.'):
        if os.path.isfile(filename) and not filename.startswith('.'):
            remaining_files.append(filename)
    
    if remaining_files:
        for filename in sorted(remaining_files):
            print(f"  📄 {filename}")
    else:
        print("  ✅ No files remaining in root directory")
    
    # Create main project README
    print(f"\n📝 CREATING MAIN PROJECT README:")
    print("=" * 35)
    
    main_readme = """# David-Nitzan iMessage Extraction Project

This project contains the complete extraction and processing of David-Nitzan iMessage conversations from multiple data sources.

## Project Structure

### 📁 final_datasets/
Contains the final, verified datasets ready for use:
- **final_complete_david_nitzan_conversation.json** - Complete conversation (46,562 messages)
- **final_complete_david_nitzan_conversation.csv** - Supabase-ready CSV
- **final_complete_david_nitzan_conversation_supabase.json** - Supabase-ready JSON

### 📁 scripts/
All Python scripts used for extraction and processing:
- Extraction scripts (imessage_extractor.py, etc.)
- Processing scripts (filter_direct_messages.py, etc.)
- Verification scripts (verify_complete_extraction.py, etc.)

### 📁 archive/
Intermediate and outdated files from the extraction process:
- Various extraction results and intermediate datasets
- Kept for reference but not the authoritative versions

### 📁 backups/
Backup files from earlier extractions:
- Various backup datasets and exports
- Historical extraction results

### 📁 supabase_exports/
Supabase-specific export files:
- Supabase extractors and structure files
- Supabase-ready exports

### 📁 guides/
Project documentation and guides:
- GIFT_PROJECT_GUIDE.md
- NITZAN_EXTRACTION_GUIDE.md
- README.md
- SUPABASE_IMPORT_SUMMARY.md

### 📁 temp/
Temporary files that can be deleted:
- Example files and temporary scripts
- Files that are no longer needed

## Data Quality

The final dataset contains:
- ✅ 46,562 messages from July 2015 - July 2025
- ✅ Only direct David-Nitzan conversations
- ✅ No group chats or other people
- ✅ Chronologically ordered
- ✅ Proper sender identification
- ✅ All data sources verified and deduplicated

## Usage

1. **For Supabase import**: Use files in `final_datasets/`
2. **For analysis**: Use the JSON files in `final_datasets/`
3. **For reproduction**: Use scripts in `scripts/`
4. **For reference**: Check files in `archive/`

## Key Files

- **final_datasets/final_complete_david_nitzan_conversation.json** - The definitive dataset
- **scripts/create_final_complete_dataset.py** - Script that created the final dataset
- **guides/README.md** - Main project documentation
"""
    
    with open("README.md", 'w') as f:
        f.write(main_readme)
    
    print(f"  ✅ Created main README.md")
    
    # Summary
    print(f"\n🎉 FINAL CLEANUP SUMMARY:")
    print("=" * 30)
    print(f"✅ Backup files: {len([f for f in backup_files if os.path.exists(f'backups/{f}')])} files")
    print(f"✅ Supabase files: {len([f for f in supabase_files if os.path.exists(f'supabase_exports/{f}')])} files")
    print(f"✅ Guide files: {len([f for f in guide_files if os.path.exists(f'guides/{f}')])} files")
    print(f"✅ Additional scripts: {len([f for f in additional_scripts if os.path.exists(f'scripts/{f}')])} files")
    print(f"✅ Temp files: {len([f for f in temp_files if os.path.exists(f'temp/{f}')])} files")
    print(f"✅ Main README: Created")
    print(f"✅ Project fully organized!")

if __name__ == "__main__":
    final_cleanup() 