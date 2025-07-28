#!/usr/bin/env python3
"""
Contact Finder for iMessage
Helps find the exact format of contacts in the Messages database.
"""

import sqlite3
import os
import sys

def find_contacts(search_term=None):
    """Find contacts in the Messages database."""
    home = os.path.expanduser("~")
    db_path = os.path.join(home, "Library", "Messages", "chat.db")
    
    if not os.path.exists(db_path):
        print("❌ Messages database not found!")
        return None
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        if search_term:
            # Search for specific contact
            query = """
            SELECT DISTINCT h.id, h.country, h.service, COUNT(m.ROWID) as message_count
            FROM handle h
            JOIN message m ON h.ROWID = m.handle_id
            WHERE h.id LIKE ?
            GROUP BY h.id, h.country, h.service
            ORDER BY message_count DESC
            """
            cursor.execute(query, (f"%{search_term}%",))
        else:
            # Get all contacts with message counts
            query = """
            SELECT DISTINCT h.id, h.country, h.service, COUNT(m.ROWID) as message_count
            FROM handle h
            JOIN message m ON h.ROWID = m.handle_id
            GROUP BY h.id, h.country, h.service
            ORDER BY message_count DESC
            LIMIT 50
            """
            cursor.execute(query)
        
        results = cursor.fetchall()
        conn.close()
        
        return results
        
    except sqlite3.Error as e:
        print(f"❌ Database error: {e}")
        return None
    except PermissionError:
        print("❌ Permission denied. Please grant Terminal 'Full Disk Access' in System Preferences.")
        return None

def print_contacts(contacts, search_term=None):
    """Print contact information."""
    if not contacts:
        if search_term:
            print(f"No contacts found matching '{search_term}'")
        else:
            print("No contacts found in the database")
        return
    
    if search_term:
        print(f"=== Contacts matching '{search_term}' ===")
    else:
        print("=== Top 50 Contacts by Message Count ===")
    
    print()
    print("Format: Contact ID | Country | Service | Message Count")
    print("-" * 60)
    
    for i, (contact_id, country, service, message_count) in enumerate(contacts, 1):
        print(f"{i:2d}. {contact_id} | {country or 'N/A'} | {service or 'N/A'} | {message_count} messages")

def main():
    if len(sys.argv) > 1:
        search_term = sys.argv[1]
        print(f"🔍 Searching for contacts containing: '{search_term}'")
        contacts = find_contacts(search_term)
    else:
        print("📋 Listing all contacts in Messages database...")
        contacts = find_contacts()
    
    print_contacts(contacts, sys.argv[1] if len(sys.argv) > 1 else None)
    
    if contacts:
        print("\n💡 Tips:")
        print("- Use the exact 'Contact ID' format for extraction")
        print("- Try different search terms: 'nitzan', 'pelman', '917', etc.")
        print("- Phone numbers may be stored without formatting")
        print("- Email addresses are stored as-is")

if __name__ == "__main__":
    main() 