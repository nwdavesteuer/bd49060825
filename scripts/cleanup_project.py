#!/usr/bin/env python3
"""
Clean up the project by organizing files and keeping only the most important ones
"""

import os
import shutil
import json
from datetime import datetime

def cleanup_project():
    """Clean up the project by organizing files"""
    
    print("🧹 CLEANING UP PROJECT")
    print("=" * 40)
    
    # Create directories
    directories = {
        'final_datasets': 'Final, verified datasets ready for use',
        'archive': 'Old/outdated files for reference',
        'scripts': 'Python scripts used for extraction and processing',
        'temp': 'Temporary files that can be deleted'
    }
    
    print("📁 Creating directories:")
    for dir_name, description in directories.items():
        if not os.path.exists(dir_name):
            os.makedirs(dir_name)
            print(f"  ✅ Created {dir_name}/ ({description})")
        else:
            print(f"  📁 {dir_name}/ already exists")
    
    # Define file categories
    final_files = [
        "final_complete_david_nitzan_conversation.json",
        "final_complete_david_nitzan_conversation.csv", 
        "final_complete_david_nitzan_conversation_supabase.json",
        "pure_david_nitzan_no_jonathan.json",
        "pure_david_nitzan_no_jonathan.csv",
        "pure_david_nitzan_no_jonathan_supabase.json"
    ]
    
    archive_files = [
        "final_direct_david_nitzan_20250727_210753.json",
        "correct_david_nitzan_messages.json",
        "direct_david_nitzan_messages_20250727_210719.json",
        "ultimate_comprehensive_all_20250727_205541.json",
        "comprehensive_contact_search_20250727_210406.json",
        "complete_david_nitzan_conversation.json",
        "complete_david_nitzan_conversation.csv",
        "complete_david_nitzan_conversation_supabase.json",
        "final_david_nitzan_conversation.json",
        "final_david_nitzan_conversation.csv",
        "final_david_nitzan_conversation_supabase.json",
        "david_nitzan_conversation_fixed.json",
        "david_nitzan_conversation_fixed.csv",
        "david_nitzan_conversation_fixed_supabase.json",
        "pure_david_nitzan_conversation.json",
        "pure_david_nitzan_conversation.csv",
        "pure_david_nitzan_conversation_supabase.json"
    ]
    
    script_files = [
        "imessage_extractor.py",
        "enhanced_imessage_extractor.py",
        "contact_finder.py",
        "message_query_tool.py",
        "permission_helper.py",
        "comprehensive_contact_search.py",
        "analyze_comprehensive_search.py",
        "final_ultimate_comprehensive.py",
        "filter_direct_messages.py",
        "create_final_direct_dataset.py",
        "verify_contact_methods.py",
        "check_phone_owner.py",
        "check_david_sources.py",
        "analyze_david_identifiers.py",
        "explain_david_identification.py",
        "check_final_dataset.py",
        "check_actual_dates.py",
        "filter_correct_david_nitzan.py",
        "create_pure_david_nitzan_conversation.py",
        "fix_sender_identification.py",
        "create_final_pure_conversation.py",
        "fix_jonathan_phone_number.py",
        "verify_complete_extraction.py",
        "create_final_complete_dataset.py",
        "cleanup_project.py"
    ]
    
    temp_files = [
        "example_usage.py",
        "check_july_messages.py"
    ]
    
    # Move final files
    print(f"\n📦 MOVING FINAL FILES:")
    print("=" * 25)
    
    for filename in final_files:
        if os.path.exists(filename):
            try:
                shutil.move(filename, f"final_datasets/{filename}")
                print(f"  ✅ Moved {filename} to final_datasets/")
            except Exception as e:
                print(f"  ❌ Error moving {filename}: {e}")
        else:
            print(f"  ⚠️  {filename} not found")
    
    # Move archive files
    print(f"\n📦 MOVING ARCHIVE FILES:")
    print("=" * 25)
    
    for filename in archive_files:
        if os.path.exists(filename):
            try:
                shutil.move(filename, f"archive/{filename}")
                print(f"  ✅ Moved {filename} to archive/")
            except Exception as e:
                print(f"  ❌ Error moving {filename}: {e}")
        else:
            print(f"  ⚠️  {filename} not found")
    
    # Move script files
    print(f"\n📦 MOVING SCRIPT FILES:")
    print("=" * 25)
    
    for filename in script_files:
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
    
    # Create README for final datasets
    print(f"\n📝 CREATING DOCUMENTATION:")
    print("=" * 30)
    
    readme_content = """# David-Nitzan Conversation Dataset

## Final Datasets

This directory contains the final, verified David-Nitzan conversation datasets ready for use.

### Files:

1. **final_complete_david_nitzan_conversation.json** - Complete conversation dataset (46,562 messages)
   - Date range: July 23, 2015 - July 27, 2025
   - David: 17,388 messages (37.3%)
   - Nitzan: 29,174 messages (62.7%)
   - All sources verified and deduplicated

2. **final_complete_david_nitzan_conversation.csv** - Supabase-ready CSV format
   - Same data as JSON but in CSV format for database import

3. **final_complete_david_nitzan_conversation_supabase.json** - Supabase-ready JSON format
   - Optimized JSON structure for Supabase import

4. **pure_david_nitzan_no_jonathan.json/csv/supabase.json** - Alternative versions
   - Same data but from different processing steps

## Usage

These files are ready for:
- Supabase database import
- Analysis and processing
- Backup and archival

## Data Quality

- ✅ Only direct David-Nitzan conversations
- ✅ No group chats or other people
- ✅ Chronologically ordered
- ✅ Proper sender identification
- ✅ Complete 10-year span
- ✅ All data sources verified
"""
    
    with open("final_datasets/README.md", 'w') as f:
        f.write(readme_content)
    
    print(f"  ✅ Created final_datasets/README.md")
    
    # Create archive README
    archive_readme = """# Archive Files

This directory contains intermediate and outdated files from the extraction process.

## Files:

- **final_direct_david_nitzan_20250727_210753.json** - Initial comprehensive dataset
- **correct_david_nitzan_messages.json** - Corrected dataset (July 2015 onwards)
- **direct_david_nitzan_messages_20250727_210719.json** - Direct messages only
- **ultimate_comprehensive_all_20250727_205541.json** - Ultimate comprehensive dataset
- **comprehensive_contact_search_20250727_210406.json** - Broad search results
- **complete_david_nitzan_conversation.json** - Complete dataset before filtering
- **final_david_nitzan_conversation.json** - Final dataset before complete verification
- **david_nitzan_conversation_fixed.json** - Fixed sender identification
- **pure_david_nitzan_conversation.json** - Pure conversation before Jonathan fix

## Note

These files are kept for reference but the final datasets in the parent directory are the authoritative versions.
"""
    
    with open("archive/README.md", 'w') as f:
        f.write(archive_readme)
    
    print(f"  ✅ Created archive/README.md")
    
    # Create scripts README
    scripts_readme = """# Processing Scripts

This directory contains all the Python scripts used for data extraction and processing.

## Key Scripts:

### Extraction Scripts:
- **imessage_extractor.py** - Basic iMessage extraction
- **enhanced_imessage_extractor.py** - Enhanced extraction with more features
- **contact_finder.py** - Contact identification and analysis
- **message_query_tool.py** - Message querying and filtering

### Processing Scripts:
- **comprehensive_contact_search.py** - Broad search across all sources
- **filter_direct_messages.py** - Filter for direct conversations only
- **fix_jonathan_phone_number.py** - Remove Jonathan's messages
- **verify_complete_extraction.py** - Verify all sources are included

### Final Processing:
- **create_final_complete_dataset.py** - Create the final complete dataset
- **cleanup_project.py** - This cleanup script

## Usage

These scripts can be run to reproduce the extraction process or modify the datasets.
"""
    
    with open("scripts/README.md", 'w') as f:
        f.write(scripts_readme)
    
    print(f"  ✅ Created scripts/README.md")
    
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
    
    # Summary
    print(f"\n🎉 CLEANUP SUMMARY:")
    print("=" * 25)
    print(f"✅ Final datasets: {len([f for f in final_files if os.path.exists(f'final_datasets/{f}')])} files")
    print(f"✅ Archive files: {len([f for f in archive_files if os.path.exists(f'archive/{f}')])} files")
    print(f"✅ Script files: {len([f for f in script_files if os.path.exists(f'scripts/{f}')])} files")
    print(f"✅ Temp files: {len([f for f in temp_files if os.path.exists(f'temp/{f}')])} files")
    print(f"✅ Documentation: 3 README files created")
    print(f"✅ Project organized and cleaned!")

if __name__ == "__main__":
    cleanup_project() 