#!/usr/bin/env python3
"""
iMessage Extractor for Mac
Extracts iMessages from the Mac Messages database for a specific contact.

Usage:
    python imessage_extractor.py --contact "John Doe"
    python imessage_extractor.py --contact "john@example.com"
    python imessage_extractor.py --contact "John Doe" --output messages.csv
"""

import sqlite3
import pandas as pd
import os
import sys
import argparse
from datetime import datetime
import shutil
from pathlib import Path


class iMessageExtractor:
    def __init__(self):
        self.messages_db_path = self._get_messages_db_path()
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
    
    def _get_contact_name(self, contact_id):
        """Get the contact name from the database."""
        try:
            conn = sqlite3.connect(self.messages_db_path)
            cursor = conn.cursor()
            
            query = """
            SELECT DISTINCT id, country, service
            FROM handle
            WHERE id = ?
            """
            
            cursor.execute(query, (contact_id,))
            result = cursor.fetchone()
            
            conn.close()
            return result[0] if result else contact_id
            
        except sqlite3.Error as e:
            print(f"Database error: {e}")
            return contact_id
    
    def extract_messages(self, contact_identifier, output_file=None, limit=None):
        """
        Extract messages for a specific contact.
        
        Args:
            contact_identifier (str): Phone number, email, or name to search for
            output_file (str): Optional output file path for CSV export
            limit (int): Optional limit on number of messages to extract
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
                ORDER BY m.date DESC
                """
                
                if limit:
                    query += f" LIMIT {limit}"
                
                df = pd.read_sql_query(query, conn, params=(contact_id,))
                conn.close()
                
                if not df.empty:
                    # Convert date columns
                    df['date'] = pd.to_datetime(df['date'], unit='ns')
                    df['date_read'] = pd.to_datetime(df['date_read'], unit='ns')
                    
                    # Add contact name
                    df['contact_name'] = self._get_contact_name(contact_id)
                    
                    # Clean up text column
                    df['text'] = df['text'].fillna('')
                    
                    all_messages.append(df)
                    print(f"Found {len(df)} messages for {contact_id}")
                else:
                    print(f"No messages found for {contact_id}")
                    
            except sqlite3.Error as e:
                print(f"Database error for {contact_id}: {e}")
                continue
        
        if not all_messages:
            print("No messages found for any matching contacts.")
            return None
        
        # Combine all messages
        combined_df = pd.concat(all_messages, ignore_index=True)
        combined_df = combined_df.sort_values('date', ascending=False)
        
        # Display summary
        print(f"\nTotal messages extracted: {len(combined_df)}")
        print(f"Date range: {combined_df['date'].min()} to {combined_df['date'].max()}")
        
        # Show sample messages
        print("\nSample messages:")
        for idx, row in combined_df.head(5).iterrows():
            direction = "→" if row['is_from_me'] else "←"
            print(f"{direction} {row['readable_date']}: {row['text'][:100]}...")
        
        # Save to file if requested
        if output_file:
            try:
                combined_df.to_csv(output_file, index=False)
                print(f"\nMessages saved to: {output_file}")
            except Exception as e:
                print(f"Error saving to file: {e}")
        
        return combined_df
    
    def list_contacts(self, limit=20):
        """List recent contacts from the database."""
        try:
            conn = sqlite3.connect(self.messages_db_path)
            
            query = """
            SELECT DISTINCT h.id, h.service, COUNT(m.ROWID) as message_count
            FROM handle h
            JOIN message m ON h.ROWID = m.handle_id
            GROUP BY h.id, h.service
            ORDER BY message_count DESC
            LIMIT ?
            """
            
            df = pd.read_sql_query(query, conn, params=(limit,))
            conn.close()
            
            if not df.empty:
                print(f"\nTop {len(df)} contacts by message count:")
                for idx, row in df.iterrows():
                    print(f"{idx+1}. {row['id']} ({row['service']}) - {row['message_count']} messages")
            else:
                print("No contacts found in the database.")
                
        except sqlite3.Error as e:
            print(f"Database error: {e}")


def main():
    parser = argparse.ArgumentParser(description="Extract iMessages from Mac Messages database")
    parser.add_argument("--contact", "-c", required=True, 
                       help="Contact identifier (phone number, email, or name)")
    parser.add_argument("--output", "-o", 
                       help="Output CSV file path")
    parser.add_argument("--limit", "-l", type=int, 
                       help="Limit number of messages to extract")
    parser.add_argument("--list-contacts", action="store_true",
                       help="List recent contacts instead of extracting messages")
    
    args = parser.parse_args()
    
    try:
        extractor = iMessageExtractor()
        
        if args.list_contacts:
            extractor.list_contacts()
        else:
            # Generate default output filename if not provided
            if not args.output:
                safe_contact = "".join(c for c in args.contact if c.isalnum() or c in (' ', '-', '_')).rstrip()
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                args.output = f"imessages_{safe_contact}_{timestamp}.csv"
            
            extractor.extract_messages(args.contact, args.output, args.limit)
            
    except FileNotFoundError as e:
        print(f"Error: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"Unexpected error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main() 