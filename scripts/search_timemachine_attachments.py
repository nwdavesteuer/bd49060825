#!/usr/bin/env python3
"""
Search for attachments in Time Machine backup
"""

import sqlite3
import json
import os
import shutil
from datetime import datetime
from pathlib import Path

def search_timemachine_attachments():
    """Search for attachments in Time Machine backup"""
    
    # Path to Time Machine backup
    backup_db_path = "/Volumes/Extreme SSD/2024-09-05-112619.previous/Data/Users/dsteuer/Library/Messages/chat.db"
    backup_attachments_dir = "/Volumes/Extreme SSD/2024-09-05-112619.previous/Data/Users/dsteuer/Library/Messages/Attachments"
    
    if not os.path.exists(backup_db_path):
        print(f"❌ Time Machine backup database not found: {backup_db_path}")
        return
    
    print("🔍 SEARCHING FOR ATTACHMENTS IN TIME MACHINE BACKUP")
    print("=" * 60)
    print(f"📁 Database: {backup_db_path}")
    print(f"📁 Attachments directory: {backup_attachments_dir}")
    
    # Create output directory
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    output_dir = f"timemachine_attachments_{timestamp}"
    os.makedirs(output_dir, exist_ok=True)
    
    try:
        conn = sqlite3.connect(backup_db_path)
        cursor = conn.cursor()
        
        # Get attachment information from Time Machine backup
        cursor.execute("""
            SELECT 
                a.ROWID as attachment_id,
                a.guid,
                a.filename,
                a.mime_type,
                a.total_bytes,
                a.created_date,
                m.ROWID as message_id,
                m.text,
                m.date,
                m.is_from_me,
                c.chat_identifier
            FROM attachment a
            JOIN message_attachment_join maj ON a.ROWID = maj.attachment_id
            JOIN message m ON maj.message_id = m.ROWID
            JOIN chat_message_join cmj ON m.ROWID = cmj.message_id
            JOIN chat c ON cmj.chat_id = c.ROWID
            WHERE (c.chat_identifier LIKE '%nitzan%'
               OR c.chat_identifier LIKE '%pelman%'
               OR c.chat_identifier LIKE '%917%239%0518%'
               OR c.chat_identifier = '+19172390518')
               AND c.chat_identifier NOT LIKE 'chat%'
               AND (c.display_name IS NULL OR c.display_name = '')
            ORDER BY a.created_date DESC
        """)
        
        attachments = cursor.fetchall()
        print(f"✅ Found {len(attachments)} attachments in Time Machine backup")
        
        attachment_data = []
        found_files = 0
        total_size = 0
        
        for att in attachments:
            attachment_id, guid, filename, mime_type, total_bytes, created_date, message_id, text, date, is_from_me, chat_identifier = att
            
            # Convert Apple timestamp to readable date
            if created_date:
                readable_date = datetime.fromtimestamp(created_date / 1000000000 + 978307200).isoformat()
                year = datetime.fromtimestamp(created_date / 1000000000 + 978307200).year
            else:
                readable_date = None
                year = 'unknown'
            
            # Determine sender
            sender = "David" if is_from_me else "Nitzan"
            
            attachment_info = {
                'attachment_id': attachment_id,
                'guid': guid,
                'filename': filename,
                'mime_type': mime_type,
                'total_bytes': total_bytes,
                'created_date': readable_date,
                'year': year,
                'message_id': message_id,
                'message_text': text,
                'sender': sender,
                'chat_identifier': chat_identifier,
                'source': 'TimeMachine_Backup'
            }
            
            attachment_data.append(attachment_info)
            
            # Try to find and copy the actual file
            if filename and os.path.exists(backup_attachments_dir):
                # Look for the file in the backup Attachments directory
                possible_paths = [
                    os.path.join(backup_attachments_dir, filename),
                    os.path.join(backup_attachments_dir, guid),
                    os.path.join(backup_attachments_dir, f"{guid}/{filename}"),
                    os.path.join(backup_attachments_dir, f"{guid}.{filename.split('.')[-1] if '.' in filename else ''}")
                ]
                
                # Also search recursively in subdirectories
                for root, dirs, files in os.walk(backup_attachments_dir):
                    for file in files:
                        if file == filename or file.startswith(guid):
                            possible_paths.append(os.path.join(root, file))
                
                for file_path in possible_paths:
                    if os.path.exists(file_path):
                        # Create output directory structure
                        output_subdir = os.path.join(output_dir, str(year))
                        os.makedirs(output_subdir, exist_ok=True)
                        
                        # Copy file with unique name
                        output_filename = f"{attachment_id}_{filename}"
                        output_path = os.path.join(output_subdir, output_filename)
                        
                        try:
                            shutil.copy2(file_path, output_path)
                            attachment_info['local_path'] = output_path
                            attachment_info['file_size'] = os.path.getsize(file_path)
                            found_files += 1
                            total_size += os.path.getsize(file_path)
                            print(f"  📎 Found & copied: {filename} -> {output_path}")
                        except Exception as e:
                            print(f"  ❌ Failed to copy {filename}: {e}")
                        break
                else:
                    print(f"  ⚠️  File not found: {filename}")
        
        conn.close()
        
        # Save metadata
        metadata_file = os.path.join(output_dir, "timemachine_attachments_metadata.json")
        with open(metadata_file, 'w') as f:
            json.dump(attachment_data, f, indent=2)
        
        # Analyze results
        print(f"\n📊 TIME MACHINE ATTACHMENT ANALYSIS:")
        print(f"  📎 Total attachments found: {len(attachment_data)}")
        print(f"  📁 Files successfully copied: {found_files}")
        print(f"  💾 Total size copied: {total_size / (1024*1024):.2f} MB")
        
        # By type
        mime_types = {}
        for att in attachment_data:
            mime_type = att.get('mime_type', 'unknown')
            mime_types[mime_type] = mime_types.get(mime_type, 0) + 1
        
        print(f"  📋 By type:")
        for mime_type, count in sorted(mime_types.items(), key=lambda x: x[1], reverse=True):
            print(f"    {mime_type}: {count}")
        
        # By year
        years = {}
        for att in attachment_data:
            year = att.get('year', 'unknown')
            years[year] = years.get(year, 0) + 1
        
        print(f"  📅 By year:")
        for year in sorted(years.keys()):
            print(f"    {year}: {years[year]}")
        
        # By sender
        senders = {}
        for att in attachment_data:
            sender = att.get('sender', 'unknown')
            senders[sender] = senders.get(sender, 0) + 1
        
        print(f"  👤 By sender:")
        for sender, count in senders.items():
            print(f"    {sender}: {count}")
        
        print(f"\n💾 Metadata saved to: {metadata_file}")
        print(f"📁 Attachments saved to: {output_dir}")
        
        return attachment_data, output_dir
        
    except Exception as e:
        print(f"❌ Error searching Time Machine backup: {e}")
        return [], None

if __name__ == "__main__":
    search_timemachine_attachments() 