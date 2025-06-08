#!/usr/bin/env python3
"""
Enhanced iMessage Extractor for Mac
Extracts iMessages with images and metadata to JSON format for gift projects.

Usage:
    python enhanced_imessage_extractor.py --contact "1 (917) 239-0518" --output nitzan_messages.json
"""

import sqlite3
import json
import os
import sys
import argparse
from datetime import datetime
import shutil
from pathlib import Path
import base64
from PIL import Image
import io


class EnhancediMessageExtractor:
    def __init__(self):
        self.messages_db_path = self._get_messages_db_path()
        self.attachments_db_path = self._get_attachments_db_path()
        self.backup_db_path = None
        
    def _get_messages_db_path(self):
        """Get the path to the Messages database on Mac."""
        home = os.path.expanduser("~")
        db_path = os.path.join(home, "Library", "Messages", "chat.db")
        
        if not os.path.exists(db_path):
            raise FileNotFoundError(
                f"Messages database not found at {db_path}. "
                "Make sure you're running this on a Mac and have Messages enabled."
            )
        return db_path
    
    def _get_attachments_db_path(self):
        """Get the path to the Attachments database on Mac."""
        home = os.path.expanduser("~")
        db_path = os.path.join(home, "Library", "Messages", "Attachments")
        return db_path
    
    def _create_backup(self):
        """Create a backup of the Messages database."""
        backup_dir = Path.home() / "Desktop" / "iMessage_Backup"
        backup_dir.mkdir(exist_ok=True)
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        self.backup_db_path = backup_dir / f"chat_backup_{timestamp}.db"
        
        try:
            shutil.copy2(self.messages_db_path, self.backup_db_path)
            print(f"Backup created at: {self.backup_db_path}")
        except Exception as e:
            print(f"Warning: Could not create backup: {e}")
            self.backup_db_path = None
    
    def _get_contact_id(self, contact_identifier):
        """Get the contact ID from the database using phone number or email."""
        try:
            conn = sqlite3.connect(self.messages_db_path)
            cursor = conn.cursor()
            
            # Try to find the contact by phone number or email
            query = """
            SELECT DISTINCT id, country, service
            FROM handle
            WHERE id LIKE ? OR id LIKE ?
            """
            
            # Add % wildcards for partial matching
            phone_pattern = f"%{contact_identifier}%"
            email_pattern = f"%{contact_identifier}%"
            
            cursor.execute(query, (phone_pattern, email_pattern))
            results = cursor.fetchall()
            
            if not results:
                # Try exact match
                cursor.execute(query, (contact_identifier, contact_identifier))
                results = cursor.fetchall()
            
            conn.close()
            
            if results:
                return results
            else:
                return None
                
        except sqlite3.Error as e:
            print(f"Database error: {e}")
            return None
    
    def _get_attachments_for_message(self, message_id):
        """Get attachments for a specific message."""
        try:
            conn = sqlite3.connect(self.messages_db_path)
            cursor = conn.cursor()
            
            query = """
            SELECT 
                a.ROWID,
                a.guid,
                a.filename,
                a.mime_type,
                a.total_bytes,
                a.creation_date,
                a.attribution_info
            FROM attachment a
            JOIN message_attachment_join maj ON a.ROWID = maj.attachment_id
            WHERE maj.message_id = ?
            """
            
            cursor.execute(query, (message_id,))
            attachments = cursor.fetchall()
            conn.close()
            
            attachment_data = []
            for attachment in attachments:
                attachment_info = {
                    'attachment_id': attachment[0],
                    'guid': attachment[1],
                    'filename': attachment[2],
                    'mime_type': attachment[3],
                    'size_bytes': attachment[4],
                    'creation_date': attachment[5],
                    'attribution_info': attachment[6],
                    'file_path': None,
                    'thumbnail_data': None
                }
                
                # Try to find the actual file
                if attachment[2]:  # filename exists
                    file_path = self._find_attachment_file(attachment[2])
                    if file_path and os.path.exists(file_path):
                        attachment_info['file_path'] = str(file_path)
                        
                        # Create thumbnail for images
                        if attachment[3] and attachment[3].startswith('image/'):
                            try:
                                thumbnail = self._create_thumbnail(file_path)
                                if thumbnail:
                                    attachment_info['thumbnail_data'] = thumbnail
                            except Exception as e:
                                print(f"Could not create thumbnail for {file_path}: {e}")
                
                attachment_data.append(attachment_info)
            
            return attachment_data
            
        except sqlite3.Error as e:
            print(f"Error getting attachments: {e}")
            return []
    
    def _find_attachment_file(self, filename):
        """Find the actual attachment file in the Attachments directory."""
        attachments_dir = Path(self.attachments_db_path)
        
        # Search recursively for the file
        for file_path in attachments_dir.rglob(filename):
            if file_path.is_file():
                return file_path
        
        # Try without extension
        name_without_ext = Path(filename).stem
        for file_path in attachments_dir.rglob(f"{name_without_ext}.*"):
            if file_path.is_file():
                return file_path
        
        return None
    
    def _create_thumbnail(self, image_path, max_size=(200, 200)):
        """Create a thumbnail of an image and return as base64."""
        try:
            with Image.open(image_path) as img:
                # Convert to RGB if necessary
                if img.mode in ('RGBA', 'LA', 'P'):
                    img = img.convert('RGB')
                
                # Create thumbnail
                img.thumbnail(max_size, Image.Resampling.LANCZOS)
                
                # Convert to base64
                buffer = io.BytesIO()
                img.save(buffer, format='JPEG', quality=85)
                buffer.seek(0)
                
                return base64.b64encode(buffer.getvalue()).decode('utf-8')
        except Exception as e:
            print(f"Error creating thumbnail: {e}")
            return None
    
    def extract_messages(self, contact_identifier, output_file=None, limit=None, chronological=True):
        """
        Extract messages for a specific contact with full metadata and images.
        
        Args:
            contact_identifier (str): Phone number, email, or name to search for
            output_file (str): Optional output file path for JSON export
            limit (int): Optional limit on number of messages to extract
            chronological (bool): Sort messages chronologically (True) or reverse (False)
        """
        print(f"Searching for contact: {contact_identifier}")
        
        # Create backup
        self._create_backup()
        
        # Get contact IDs
        contact_ids = self._get_contact_id(contact_identifier)
        
        if not contact_ids:
            print(f"No contact found matching: {contact_identifier}")
            print("Try using a phone number, email address, or partial name.")
            return None
        
        all_messages = []
        
        for contact_id, country, service in contact_ids:
            print(f"Found contact: {contact_id} (Service: {service})")
            
            try:
                conn = sqlite3.connect(self.messages_db_path)
                
                # Query to get messages for this contact
                query = """
                SELECT 
                    m.ROWID,
                    m.guid,
                    m.text,
                    m.date,
                    m.date_read,
                    m.is_from_me,
                    m.cache_has_attachments,
                    h.id as contact_id,
                    h.service,
                    datetime(m.date/1000000000 + strftime('%s', '2001-01-01'), 'unixepoch', 'localtime') as readable_date
                FROM message m
                JOIN handle h ON m.handle_id = h.ROWID
                WHERE h.id = ?
                """
                
                if chronological:
                    query += " ORDER BY m.date ASC"
                else:
                    query += " ORDER BY m.date DESC"
                
                if limit:
                    query += f" LIMIT {limit}"
                
                cursor = conn.cursor()
                cursor.execute(query, (contact_id,))
                messages = cursor.fetchall()
                conn.close()
                
                if messages:
                    print(f"Found {len(messages)} messages for {contact_id}")
                    
                    for message in messages:
                        message_data = {
                            'message_id': message[0],
                            'guid': message[1],
                            'text': message[2] or '',
                            'date': message[3],
                            'date_read': message[4],
                            'is_from_me': bool(message[5]),
                            'has_attachments': bool(message[6]),
                            'contact_id': message[7],
                            'service': message[8],
                            'readable_date': message[9],
                            'attachments': [],
                            'conversation_stats': {}
                        }
                        
                        # Get attachments for this message
                        if message_data['has_attachments']:
                            attachments = self._get_attachments_for_message(message[0])
                            message_data['attachments'] = attachments
                            print(f"  Found {len(attachments)} attachments for message {message[0]}")
                        
                        all_messages.append(message_data)
                else:
                    print(f"No messages found for {contact_id}")
                    
            except sqlite3.Error as e:
                print(f"Database error for {contact_id}: {e}")
                continue
        
        if not all_messages:
            print("No messages found for any matching contacts.")
            return None
        
        # Sort messages chronologically if requested
        if chronological:
            all_messages.sort(key=lambda x: x['date'])
        
        # Add conversation statistics
        conversation_stats = self._calculate_conversation_stats(all_messages)
        
        # Create the final data structure
        export_data = {
            'metadata': {
                'contact_identifier': contact_identifier,
                'extraction_date': datetime.now().isoformat(),
                'total_messages': len(all_messages),
                'date_range': {
                    'start': min(msg['readable_date'] for msg in all_messages) if all_messages else None,
                    'end': max(msg['readable_date'] for msg in all_messages) if all_messages else None
                },
                'conversation_stats': conversation_stats
            },
            'messages': all_messages
        }
        
        # Display summary
        print(f"\nTotal messages extracted: {len(all_messages)}")
        print(f"Date range: {export_data['metadata']['date_range']['start']} to {export_data['metadata']['date_range']['end']}")
        print(f"Messages with attachments: {sum(1 for msg in all_messages if msg['has_attachments'])}")
        
        # Save to file if requested
        if output_file:
            try:
                with open(output_file, 'w', encoding='utf-8') as f:
                    json.dump(export_data, f, indent=2, ensure_ascii=False)
                print(f"\nMessages saved to: {output_file}")
                
                # Also create a searchable SQLite database
                db_file = output_file.replace('.json', '.db')
                self._create_searchable_database(export_data, db_file)
                print(f"Searchable database created: {db_file}")
                
            except Exception as e:
                print(f"Error saving to file: {e}")
        
        return export_data
    
    def _calculate_conversation_stats(self, messages):
        """Calculate conversation statistics."""
        if not messages:
            return {}
        
        total_messages = len(messages)
        sent_messages = sum(1 for msg in messages if msg['is_from_me'])
        received_messages = total_messages - sent_messages
        messages_with_attachments = sum(1 for msg in messages if msg['has_attachments'])
        
        # Calculate daily message counts
        daily_counts = {}
        for msg in messages:
            date = msg['readable_date'][:10]  # Get just the date part
            daily_counts[date] = daily_counts.get(date, 0) + 1
        
        return {
            'total_messages': total_messages,
            'sent_messages': sent_messages,
            'received_messages': received_messages,
            'messages_with_attachments': messages_with_attachments,
            'daily_message_counts': daily_counts,
            'most_active_day': max(daily_counts.items(), key=lambda x: x[1]) if daily_counts else None
        }
    
    def _create_searchable_database(self, data, db_file):
        """Create a searchable SQLite database from the extracted data."""
        try:
            conn = sqlite3.connect(db_file)
            cursor = conn.cursor()
            
            # Create messages table
            cursor.execute('''
                CREATE TABLE messages (
                    message_id INTEGER PRIMARY KEY,
                    guid TEXT,
                    text TEXT,
                    date INTEGER,
                    date_read INTEGER,
                    is_from_me BOOLEAN,
                    has_attachments BOOLEAN,
                    contact_id TEXT,
                    service TEXT,
                    readable_date TEXT,
                    room_name TEXT
                )
            ''')
            
            # Create attachments table
            cursor.execute('''
                CREATE TABLE attachments (
                    attachment_id INTEGER PRIMARY KEY,
                    message_id INTEGER,
                    guid TEXT,
                    filename TEXT,
                    mime_type TEXT,
                    size_bytes INTEGER,
                    creation_date INTEGER,
                    file_path TEXT,
                    thumbnail_data TEXT,
                    FOREIGN KEY (message_id) REFERENCES messages (message_id)
                )
            ''')
            
            # Create full-text search index
            cursor.execute('''
                CREATE VIRTUAL TABLE messages_fts USING fts5(
                    text,
                    content='messages',
                    content_rowid='message_id'
                )
            ''')
            
            # Insert messages
            for msg in data['messages']:
                cursor.execute('''
                    INSERT INTO messages VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    msg['message_id'], msg['guid'], msg['text'], msg['date'],
                    msg['date_read'], msg['is_from_me'], msg['has_attachments'],
                    msg['contact_id'], msg['service'], msg['readable_date'], msg['room_name']
                ))
                
                # Insert attachments
                for attachment in msg['attachments']:
                    cursor.execute('''
                        INSERT INTO attachments VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ''', (
                        attachment['attachment_id'], msg['message_id'],
                        attachment['guid'], attachment['filename'],
                        attachment['mime_type'], attachment['size_bytes'],
                        attachment['creation_date'], attachment['file_path'],
                        attachment['thumbnail_data']
                    ))
            
            # Populate FTS index
            cursor.execute('INSERT INTO messages_fts SELECT message_id, text FROM messages')
            
            conn.commit()
            conn.close()
            
        except Exception as e:
            print(f"Error creating searchable database: {e}")


def main():
    parser = argparse.ArgumentParser(description="Enhanced iMessage Extractor with JSON export and image support")
    parser.add_argument("--contact", "-c", required=True, 
                       help="Contact identifier (phone number, email, or name)")
    parser.add_argument("--output", "-o", 
                       help="Output JSON file path")
    parser.add_argument("--limit", "-l", type=int, 
                       help="Limit number of messages to extract")
    parser.add_argument("--reverse", action="store_true",
                       help="Sort messages in reverse chronological order")
    
    args = parser.parse_args()
    
    try:
        extractor = EnhancediMessageExtractor()
        
        # Generate default output filename if not provided
        if not args.output:
            safe_contact = "".join(c for c in args.contact if c.isalnum() or c in (' ', '-', '_')).rstrip()
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            args.output = f"imessages_{safe_contact}_{timestamp}.json"
        
        extractor.extract_messages(
            args.contact, 
            args.output, 
            args.limit, 
            chronological=not args.reverse
        )
            
    except FileNotFoundError as e:
        print(f"Error: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"Unexpected error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main() 