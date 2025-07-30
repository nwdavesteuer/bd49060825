#!/usr/bin/env python3
"""
Clean up root directory by moving old extraction directories to archive
"""

import os
import shutil

def cleanup_root_directory():
    """Clean up root directory"""
    
    print("🧹 CLEANING UP ROOT DIRECTORY")
    print("=" * 40)
    
    # Create archive directory for old extraction folders
    archive_extractions = 'archive/extractions'
    os.makedirs(archive_extractions, exist_ok=True)
    print(f"✅ Created: {archive_extractions}")
    
    # Directories to move to archive
    directories_to_move = [
        'imac_timemachine_messages_20250727_202550',
        'timemachine_attachments_20250727_202104', 
        'attachments_20250727_201732'
    ]
    
    print(f"\n📁 MOVING OLD EXTRACTION DIRECTORIES:")
    print("=" * 45)
    
    for dir_name in directories_to_move:
        if os.path.exists(dir_name):
            source = dir_name
            dest = os.path.join(archive_extractions, dir_name)
            
            try:
                shutil.move(source, dest)
                print(f"📦 MOVED: {dir_name} -> archive/extractions/")
            except Exception as e:
                print(f"❌ ERROR moving {dir_name}: {e}")
        else:
            print(f"⚠️  NOT FOUND: {dir_name}")
    
    # Show what's left in root
    print(f"\n📁 REMAINING ROOT DIRECTORY CONTENTS:")
    print("=" * 40)
    
    root_items = os.listdir('.')
    for item in sorted(root_items):
        if os.path.isdir(item):
            print(f"📁 {item}/")
        else:
            size = os.path.getsize(item)
            print(f"📄 {item} ({size:,} bytes)")
    
    print(f"\n🎉 ROOT DIRECTORY CLEANUP COMPLETE!")
    print("=" * 35)
    print(f"✅ Old extraction directories moved to archive/extractions/")
    print(f"✅ Root directory is now clean and organized")

if __name__ == "__main__":
    cleanup_root_directory() 