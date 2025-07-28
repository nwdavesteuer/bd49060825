#!/usr/bin/env python3
"""
Deep Chat Database Search
Thoroughly searches the local chat.db for missing messages from 2017-2018
using multiple search strategies and queries.
"""

import sqlite3
import os
import json
from datetime import datetime
from pathlib import Path


class DeepChatSearch:
    def __init__(self):
        self.db_path = os.path.expanduser("~/Library/Messages/chat.db")
        
    def search_all_contacts(self):
        """Search for ALL contacts that might be Nitzan."""
        print("🔍 Searching for ALL possible Nitzan contacts...")
        
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Search for any contact that might be Nitzan
            query = """
            SELECT DISTINCT h.id, h.country, h.service, COUNT(m.ROWID) as message_count,
                   MIN(datetime(m.date/1000000000 + strftime('%s', '2001-01-01'), 'unixepoch', 'localtime')) as first_message,
                   MAX(datetime(m.date/1000000000 + strftime('%s', '2001-01-01'), 'unixepoch', 'localtime')) as last_message
            FROM handle h
            JOIN message m ON h.ROWID = m.handle_id
            WHERE h.id LIKE '%nitzan%' 
               OR h.id LIKE '%pelman%'
               OR h.id LIKE '%917%'
               OR h.id LIKE '%1917%'
               OR h.id LIKE '%239%'
               OR h.id LIKE '%0518%'
               OR h.id LIKE '%@gmail%'
               OR h.id LIKE '%@icloud%'
            GROUP BY h.id, h.country, h.service
            ORDER BY message_count DESC
            """
            
            cursor.execute(query)
            contacts = cursor.fetchall()
            
            print(f"✅ Found {len(contacts)} potential Nitzan contacts:")
            for contact in contacts:
                contact_id, country, service, count, first_msg, last_msg = contact
                print(f"  📧 {contact_id} ({service}): {count} messages")
                print(f"    📅 Range: {first_msg} to {last_msg}")
            
            conn.close()
            return contacts
            
        except Exception as e:
            print(f"❌ Error searching contacts: {e}")
            return []
    
    def search_by_date_range(self):
        """Search for ANY messages in 2017-2018 date range."""
        print("\n📅 Searching for ANY messages in 2017-2018...")
        
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Convert 2017-2018 to Apple timestamps
            start_date = int(datetime(2017, 1, 1).timestamp() * 1000000000 + 978307200000000000)
            end_date = int(datetime(2018, 12, 31).timestamp() * 1000000000 + 978307200000000000)
            
            # Search for any messages in this date range
            query = """
            SELECT COUNT(*) as total_messages,
                   SUM(CASE WHEN m.is_from_me = 1 THEN 1 ELSE 0 END) as from_me,
                   SUM(CASE WHEN m.is_from_me = 0 THEN 1 ELSE 0 END) as to_me
            FROM message m
            WHERE m.date BETWEEN ? AND ?
            """
            
            cursor.execute(query, (start_date, end_date))
            result = cursor.fetchone()
            total, from_me, to_me = result
            
            print(f"📊 Total messages in 2017-2018: {total}")
            print(f"  📤 From David: {from_me}")
            print(f"  📥 To David: {to_me}")
            
            if total > 0:
                # Get sample messages to see what we're dealing with
                query = """
                SELECT m.ROWID, m.text, m.is_from_me, h.id as contact_id,
                       datetime(m.date/1000000000 + strftime('%s', '2001-01-01'), 'unixepoch', 'localtime') as readable_date
                FROM message m
                LEFT JOIN handle h ON m.handle_id = h.ROWID
                WHERE m.date BETWEEN ? AND ?
                ORDER BY m.date ASC
                LIMIT 10
                """
                
                cursor.execute(query, (start_date, end_date))
                samples = cursor.fetchall()
                
                print(f"\n📝 Sample messages from 2017-2018:")
                for sample in samples:
                    msg_id, text, is_from_me, contact_id, date = sample
                    sender = "David" if is_from_me else f"Contact: {contact_id}"
                    text_preview = text[:50] + "..." if text and len(text) > 50 else text
                    print(f"  📅 {date} | {sender}: {text_preview}")
            
            conn.close()
            return total
            
        except Exception as e:
            print(f"❌ Error searching by date: {e}")
            return 0
    
    def search_chat_identifiers(self):
        """Search for any chat identifiers that might contain Nitzan messages."""
        print("\n💬 Searching for chat identifiers...")
        
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Search for any chat that might be related to Nitzan
            query = """
            SELECT DISTINCT
                c.chat_identifier,
                c.display_name,
                c.is_archived,
                COUNT(m.ROWID) as message_count,
                MIN(datetime(m.date/1000000000 + strftime('%s', '2001-01-01'), 'unixepoch', 'localtime')) as first_message,
                MAX(datetime(m.date/1000000000 + strftime('%s', '2001-01-01'), 'unixepoch', 'localtime')) as last_message
            FROM chat c
            JOIN chat_message_join cmj ON c.ROWID = cmj.chat_id
            JOIN message m ON cmj.message_id = m.ROWID
            WHERE c.chat_identifier LIKE '%nitzan%'
               OR c.chat_identifier LIKE '%pelman%'
               OR c.chat_identifier LIKE '%917%'
               OR c.chat_identifier LIKE '%1917%'
               OR c.chat_identifier LIKE '%239%'
               OR c.chat_identifier LIKE '%0518%'
               OR c.chat_identifier LIKE '%@gmail%'
               OR c.chat_identifier LIKE '%@icloud%'
            GROUP BY c.chat_identifier, c.display_name, c.is_archived
            ORDER BY message_count DESC
            """
            
            cursor.execute(query)
            chats = cursor.fetchall()
            
            print(f"✅ Found {len(chats)} potential Nitzan chats:")
            for chat in chats:
                chat_id, display_name, is_archived, count, first_msg, last_msg = chat
                status = "ARCHIVED" if is_archived else "ACTIVE"
                print(f"  📁 {chat_id} ({display_name or 'None'}): {count} messages [{status}]")
                print(f"    📅 Range: {first_msg} to {last_msg}")
            
            conn.close()
            return chats
            
        except Exception as e:
            print(f"❌ Error searching chat identifiers: {e}")
            return []
    
    def search_missing_years(self):
        """Search for messages in all missing years (2017, 2018, 2020, 2021, 2023)."""
        print("\n📅 Searching for messages in missing years...")
        
        missing_years = [2017, 2018, 2020, 2021, 2023]
        
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            for year in missing_years:
                start_date = int(datetime(year, 1, 1).timestamp() * 1000000000 + 978307200000000000)
                end_date = int(datetime(year, 12, 31).timestamp() * 1000000000 + 978307200000000000)
                
                # Count total messages for this year
                cursor.execute("""
                    SELECT COUNT(*) FROM message 
                    WHERE date BETWEEN ? AND ?
                """, (start_date, end_date))
                
                total = cursor.fetchone()[0]
                print(f"  {year}: {total} total messages")
                
                if total > 0:
                    # Check if any are from/to Nitzan contacts
                    cursor.execute("""
                        SELECT COUNT(*) FROM message m
                        JOIN handle h ON m.handle_id = h.ROWID
                        WHERE m.date BETWEEN ? AND ?
                        AND (h.id LIKE '%nitzan%' OR h.id LIKE '%pelman%' OR h.id LIKE '%917%239%0518%')
                    """, (start_date, end_date))
                    
                    nitzan_count = cursor.fetchone()[0]
                    print(f"    📧 Nitzan-related: {nitzan_count} messages")
                    
                    if nitzan_count > 0:
                        # Get sample Nitzan messages from this year
                        cursor.execute("""
                            SELECT m.text, m.is_from_me, h.id, 
                                   datetime(m.date/1000000000 + strftime('%s', '2001-01-01'), 'unixepoch', 'localtime') as readable_date
                            FROM message m
                            JOIN handle h ON m.handle_id = h.ROWID
                            WHERE m.date BETWEEN ? AND ?
                            AND (h.id LIKE '%nitzan%' OR h.id LIKE '%pelman%' OR h.id LIKE '%917%239%0518%')
                            ORDER BY m.date ASC
                            LIMIT 3
                        """, (start_date, end_date))
                        
                        samples = cursor.fetchall()
                        print(f"    📝 Sample messages:")
                        for text, is_from_me, contact_id, date in samples:
                            sender = "David" if is_from_me else f"Nitzan ({contact_id})"
                            text_preview = text[:50] + "..." if text and len(text) > 50 else text
                            print(f"      📅 {date} | {sender}: {text_preview}")
            
            conn.close()
            
        except Exception as e:
            print(f"❌ Error searching missing years: {e}")
    
    def search_archived_chats(self):
        """Search for archived chats that might contain missing messages."""
        print("\n🗂️ Searching for archived chats...")
        
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Find all archived chats
            query = """
            SELECT DISTINCT
                c.chat_identifier,
                c.display_name,
                COUNT(m.ROWID) as message_count,
                MIN(datetime(m.date/1000000000 + strftime('%s', '2001-01-01'), 'unixepoch', 'localtime')) as first_message,
                MAX(datetime(m.date/1000000000 + strftime('%s', '2001-01-01'), 'unixepoch', 'localtime')) as last_message
            FROM chat c
            JOIN chat_message_join cmj ON c.ROWID = cmj.chat_id
            JOIN message m ON cmj.message_id = m.ROWID
            WHERE c.is_archived = 1
            GROUP BY c.chat_identifier, c.display_name
            ORDER BY message_count DESC
            LIMIT 20
            """
            
            cursor.execute(query)
            archived = cursor.fetchall()
            
            print(f"✅ Found {len(archived)} archived chats:")
            for chat in archived:
                chat_id, display_name, count, first_msg, last_msg = chat
                print(f"  📁 {chat_id} ({display_name or 'None'}): {count} messages")
                print(f"    📅 Range: {first_msg} to {last_msg}")
            
            conn.close()
            return archived
            
        except Exception as e:
            print(f"❌ Error searching archived chats: {e}")
            return []
    
    def comprehensive_search(self):
        """Run all search strategies."""
        print("🔍 DEEP CHAT DATABASE SEARCH")
        print("=" * 50)
        
        # Run all searches
        contacts = self.search_all_contacts()
        total_2017_2018 = self.search_by_date_range()
        chats = self.search_chat_identifiers()
        self.search_missing_years()
        archived = self.search_archived_chats()
        
        print("\n📋 SEARCH SUMMARY:")
        print("=" * 30)
        print(f"📧 Potential Nitzan contacts: {len(contacts)}")
        print(f"📅 Total messages in 2017-2018: {total_2017_2018}")
        print(f"💬 Potential Nitzan chats: {len(chats)}")
        print(f"🗂️ Archived chats: {len(archived)}")
        
        if total_2017_2018 > 0:
            print("\n💡 FOUND MESSAGES IN 2017-2018!")
            print("The messages exist but may be under different contact identifiers.")
        else:
            print("\n❌ NO MESSAGES FOUND IN 2017-2018")
            print("Messages may be in iCloud or on a different device.")


def main():
    try:
        searcher = DeepChatSearch()
        searcher.comprehensive_search()
        
    except Exception as e:
        print(f"❌ Error: {e}")


if __name__ == "__main__":
    main() 