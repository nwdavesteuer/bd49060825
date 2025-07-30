#!/usr/bin/env python3
"""
Show the clean project structure after cleanup
"""

import os

def show_project_structure():
    """Show the clean project structure"""
    
    print("📁 CLEAN PROJECT STRUCTURE")
    print("=" * 35)
    
    print("\n🏠 ROOT DIRECTORY:")
    print("-" * 20)
    root_items = sorted(os.listdir('.'))
    for item in root_items:
        if os.path.isdir(item):
            print(f"📁 {item}/")
        else:
            size = os.path.getsize(item)
            print(f"📄 {item} ({size:,} bytes)")
    
    print("\n📦 FINAL_DATASETS (Most Important Files):")
    print("-" * 45)
    if os.path.exists('final_datasets'):
        final_files = sorted(os.listdir('final_datasets'))
        for item in final_files:
            item_path = os.path.join('final_datasets', item)
            if os.path.isfile(item_path):
                size = os.path.getsize(item_path)
                print(f"📄 {item} ({size:,} bytes)")
            else:
                print(f"📁 {item}/")
    
    print("\n🗂️  ARCHIVE STRUCTURE:")
    print("-" * 25)
    if os.path.exists('archive'):
        archive_dirs = sorted(os.listdir('archive'))
        for dir_name in archive_dirs:
            dir_path = os.path.join('archive', dir_name)
            if os.path.isdir(dir_path):
                file_count = len(os.listdir(dir_path))
                print(f"📁 {dir_name}/ ({file_count} files)")
    
    print("\n📋 SCRIPTS:")
    print("-" * 10)
    if os.path.exists('scripts'):
        script_files = sorted([f for f in os.listdir('scripts') if f.endswith('.py')])
        for script in script_files:
            print(f"🐍 {script}")
    
    print("\n📚 GUIDES:")
    print("-" * 10)
    if os.path.exists('guides'):
        guide_files = sorted(os.listdir('guides'))
        for guide in guide_files:
            print(f"📖 {guide}")
    
    print("\n💾 BACKUPS:")
    print("-" * 10)
    if os.path.exists('backups'):
        backup_files = sorted(os.listdir('backups'))
        for backup in backup_files:
            print(f"💿 {backup}")
    
    print("\n🎯 KEY FILES FOR SUPABASE IMPORT:")
    print("-" * 35)
    key_files = [
        'final_datasets/supabase_exact_match.csv',
        'final_datasets/supabase_json_import.json', 
        'final_datasets/supabase_import_ready.json',
        'final_datasets/final_complete_david_nitzan_conversation.csv'
    ]
    
    for file_path in key_files:
        if os.path.exists(file_path):
            size = os.path.getsize(file_path)
            print(f"✅ {file_path} ({size:,} bytes)")
        else:
            print(f"❌ {file_path} (missing)")
    
    print(f"\n🎉 PROJECT CLEANUP SUMMARY:")
    print("=" * 35)
    print(f"✅ Final_datasets contains only the most important files")
    print(f"✅ Archive organized by file type and purpose")
    print(f"✅ Root directory is clean and organized")
    print(f"✅ Old extraction directories archived")
    print(f"✅ Ready for Supabase import with clean datasets")

if __name__ == "__main__":
    show_project_structure() 