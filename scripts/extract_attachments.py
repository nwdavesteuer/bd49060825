#!/usr/bin/env python3
"""
Extract and download attachments from Messages database
"""

import sqlite3
import json
import os
import shutil
from datetime import datetime
from pathlib import Path

def extract_attachments_from_source(db_path, source_name, output_dir):
    """Extract attachment information and copy files"""
    
    if not os.path.exists(db_path):
        print(f"❌ Database not found: {db_path}")
        return []
    
    print(f"🔍 Extracting attachments from {source_name}...")
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Get attachment information
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
        print(f"✅ Found {len(attachments)} attachments in {source_name}")
        
        attachment_data = []
        
        for att in attachments:
            attachment_id, guid, filename, mime_type, total_bytes, created_date, message_id, text, date, is_from_me, chat_identifier = att
            
            # Convert Apple timestamp to readable date
            if created_date:
                readable_date = datetime.fromtimestamp(created_date / 1000000000 + 978307200).isoformat()
            else:
                readable_date = None
            
            # Determine sender
            sender = "David" if is_from_me else "Nitzan"
            
            attachment_info = {
                'attachment_id': attachment_id,
                'guid': guid,
                'filename': filename,
                'mime_type': mime_type,
                'total_bytes': total_bytes,
                'created_date': readable_date,
                'message_id': message_id,
                'message_text': text,
                'sender': sender,
                'chat_identifier': chat_identifier,
                'source': source_name
            }
            
            attachment_data.append(attachment_info)
            
            # Try to copy the actual file
            if filename:
                # Look for the file in the Attachments directory
                attachments_dir = os.path.join(os.path.dirname(db_path), 'Attachments')
                possible_paths = [
                    os.path.join(attachments_dir, filename),
                    os.path.join(attachments_dir, guid),
                    os.path.join(attachments_dir, f"{guid}/{filename}"),
                    os.path.join(attachments_dir, f"{guid}.{filename.split('.')[-1] if '.' in filename else ''}")
                ]
                
                for file_path in possible_paths:
                    if os.path.exists(file_path):
                        # Create output directory structure
                        output_subdir = os.path.join(output_dir, source_name, str(datetime.fromtimestamp(created_date / 1000000000 + 978307200).year) if created_date else 'unknown')
                        os.makedirs(output_subdir, exist_ok=True)
                        
                        # Copy file with unique name
                        output_filename = f"{attachment_id}_{filename}"
                        output_path = os.path.join(output_subdir, output_filename)
                        
                        try:
                            shutil.copy2(file_path, output_path)
                            attachment_info['local_path'] = output_path
                            print(f"  📎 Copied: {filename} -> {output_path}")
                        except Exception as e:
                            print(f"  ❌ Failed to copy {filename}: {e}")
                        break
                else:
                    print(f"  ⚠️  File not found: {filename}")
        
        conn.close()
        return attachment_data
        
    except Exception as e:
        print(f"❌ Error extracting attachments from {source_name}: {e}")
        return []

def extract_all_attachments():
    """Extract attachments from all available sources"""
    
    print("🔍 EXTRACTING ATTACHMENTS FROM ALL SOURCES")
    print("=" * 50)
    
    # Define sources
    sources = {
        'Mac_Messages': '~/Library/Messages/chat.db',
        'TimeMachine_Backup': '/Volumes/Extreme SSD/2024-09-05-112619.previous/Data/Users/dsteuer/Library/Messages/chat.db'
    }
    
    # Create output directory
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    output_dir = f"attachments_{timestamp}"
    os.makedirs(output_dir, exist_ok=True)
    
    all_attachments = []
    
    for source_name, db_path in sources.items():
        expanded_path = os.path.expanduser(db_path)
        attachments = extract_attachments_from_source(expanded_path, source_name, output_dir)
        all_attachments.extend(attachments)
    
    # Save attachment metadata
    metadata_file = os.path.join(output_dir, "attachments_metadata.json")
    with open(metadata_file, 'w') as f:
        json.dump(all_attachments, f, indent=2)
    
    # Analyze by type and year
    print(f"\n📊 ATTACHMENT ANALYSIS:")
    print(f"  📎 Total attachments: {len(all_attachments)}")
    
    # By type
    mime_types = {}
    for att in all_attachments:
        mime_type = att.get('mime_type', 'unknown')
        mime_types[mime_type] = mime_types.get(mime_type, 0) + 1
    
    print(f"  📋 By type:")
    for mime_type, count in sorted(mime_types.items(), key=lambda x: x[1], reverse=True):
        print(f"    {mime_type}: {count}")
    
    # By year
    years = {}
    for att in all_attachments:
        if att.get('created_date'):
            try:
                year = datetime.fromisoformat(att['created_date'].replace('Z', '+00:00')).year
                years[year] = years.get(year, 0) + 1
            except:
                pass
    
    print(f"  📅 By year:")
    for year in sorted(years.keys()):
        print(f"    {year}: {years[year]}")
    
    # By sender
    senders = {}
    for att in all_attachments:
        sender = att.get('sender', 'unknown')
        senders[sender] = senders.get(sender, 0) + 1
    
    print(f"  👤 By sender:")
    for sender, count in senders.items():
        print(f"    {sender}: {count}")
    
    print(f"\n💾 Metadata saved to: {metadata_file}")
    print(f"📁 Attachments saved to: {output_dir}")
    
    return all_attachments, output_dir

if __name__ == "__main__":
    extract_all_attachments() 