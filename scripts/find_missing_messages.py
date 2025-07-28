#!/usr/bin/env python3
"""
Find Missing Messages Tool
Searches for missing messages from 2017-2018 and other years in multiple sources:
- iCloud Messages
- iPhone Backups
- Different Apple IDs
- SMS vs iMessage
- Archived/Deleted chats
"""

import sqlite3
import os
import sys
from datetime import datetime
from pathlib import Path


class MissingMessagesFinder:
    def __init__(self):
        self.messages_db_path = self._get_messages_db_path()
        
    def _get_messages_db_path(self):
        """Get the path to the Messages database on Mac."""
        home = os.path.expanduser("~")
        db_path = os.path.join(home, "Library", "Messages", "chat.db")
        
        if not os.path.exists(db_path):
            raise FileNotFoundError(f"Messages database not found at {db_path}")
        return db_path
    
    def check_icloud_messages(self):
        """Check for iCloud Messages."""
        print("🔍 Checking iCloud Messages...")
        
        # Check if iCloud Messages is enabled
        icloud_path = os.path.expanduser("~/Library/Messages/icloud_messages.db")
        if os.path.exists(icloud_path):
            print(f"✅ iCloud Messages database found: {icloud_path}")
            return icloud_path
        else:
            print("❌ iCloud Messages database not found")
            return None
    
    def check_iphone_backups(self):
        """Check for iPhone backups."""
        print("\n📱 Checking iPhone Backups...")
        
        # Check iTunes backups
        itunes_backup_path = os.path.expanduser("~/Library/Application Support/MobileSync/Backup")
        if os.path.exists(itunes_backup_path):
            backups = [d for d in os.listdir(itunes_backup_path) if os.path.isdir(os.path.join(itunes_backup_path, d))]
            print(f"✅ Found {len(backups)} iTunes backups")
            for backup in backups:
                backup_path = os.path.join(itunes_backup_path, backup)
                print(f"  📁 {backup}")
                
                # Look for Messages database in backup
                messages_path = os.path.join(backup_path, "3d", "3d0d7e5fb2ce288813306e4d4636395e047a3d28")
                if os.path.exists(messages_path):
                    print(f"    ✅ Messages database found")
                    return messages_path
                else:
                    print(f"    ❌ Messages database not found")
        else:
            print("❌ iTunes backup directory not found")
        
        # Check iCloud backups
        icloud_backup_path = os.path.expanduser("~/Library/Application Support/MobileSync/Backup")
        if os.path.exists(icloud_backup_path):
            print("✅ iCloud backup directory found")
        else:
            print("❌ iCloud backup directory not found")
        
        return None
    
    def check_different_apple_ids(self):
        """Check for messages under different Apple IDs."""
        print("\n🍎 Checking Different Apple IDs...")
        
        try:
            conn = sqlite3.connect(self.messages_db_path)
            cursor = conn.cursor()
            
            # Check for different Apple IDs in the database
            cursor.execute("""
                SELECT DISTINCT h.id, h.service, COUNT(m.ROWID) as message_count
                FROM handle h
                JOIN message m ON h.ROWID = m.handle_id
                WHERE h.id LIKE '%@%'
                GROUP BY h.id, h.service
                ORDER BY message_count DESC
            """)
            
            apple_ids = cursor.fetchall()
            print(f"✅ Found {len(apple_ids)} Apple IDs in database:")
            for apple_id, service, count in apple_ids[:10]:  # Show top 10
                print(f"  📧 {apple_id} ({service}): {count} messages")
            
            conn.close()
            return apple_ids
            
        except Exception as e:
            print(f"❌ Error checking Apple IDs: {e}")
            return []
    
    def check_sms_vs_imessage(self):
        """Check for SMS vs iMessage differences."""
        print("\n💬 Checking SMS vs iMessage...")
        
        try:
            conn = sqlite3.connect(self.messages_db_path)
            cursor = conn.cursor()
            
            # Check service distribution
            cursor.execute("""
                SELECT h.service, COUNT(m.ROWID) as message_count
                FROM handle h
                JOIN message m ON h.ROWID = m.handle_id
                WHERE h.id LIKE '%nitzan%' OR h.id LIKE '%pelman%' OR h.id LIKE '%917%239%0518%'
                GROUP BY h.service
                ORDER BY message_count DESC
            """)
            
            services = cursor.fetchall()
            print("✅ Service distribution:")
            for service, count in services:
                print(f"  📱 {service}: {count} messages")
            
            conn.close()
            return services
            
        except Exception as e:
            print(f"❌ Error checking services: {e}")
            return []
    
    def check_archived_deleted_chats(self):
        """Check for archived or deleted chats."""
        print("\n🗂️ Checking Archived/Deleted Chats...")
        
        try:
            conn = sqlite3.connect(self.messages_db_path)
            cursor = conn.cursor()
            
            # Check for archived chats
            cursor.execute("""
                SELECT c.chat_identifier, c.display_name, c.is_archived, COUNT(m.ROWID) as message_count
                FROM chat c
                JOIN chat_message_join cmj ON c.ROWID = cmj.chat_id
                JOIN message m ON cmj.message_id = m.ROWID
                WHERE c.is_archived = 1
                GROUP BY c.chat_identifier, c.display_name, c.is_archived
                ORDER BY message_count DESC
            """)
            
            archived = cursor.fetchall()
            print(f"✅ Found {len(archived)} archived chats:")
            for chat_id, display_name, archived_flag, count in archived:
                print(f"  📁 {chat_id} ({display_name or 'None'}): {count} messages")
            
            # Check for chats with Nitzan that might be archived
            cursor.execute("""
                SELECT c.chat_identifier, c.display_name, c.is_archived, COUNT(m.ROWID) as message_count
                FROM chat c
                JOIN chat_message_join cmj ON c.ROWID = cmj.chat_id
                JOIN message m ON cmj.message_id = m.ROWID
                WHERE (c.chat_identifier LIKE '%nitzan%' OR c.chat_identifier LIKE '%pelman%' OR c.chat_identifier LIKE '%917%239%0518%')
                GROUP BY c.chat_identifier, c.display_name, c.is_archived
                ORDER BY message_count DESC
            """)
            
            nitzan_chats = cursor.fetchall()
            print(f"\n✅ All Nitzan-related chats (including archived):")
            for chat_id, display_name, archived_flag, count in nitzan_chats:
                status = "ARCHIVED" if archived_flag else "ACTIVE"
                print(f"  📁 {chat_id} ({display_name or 'None'}): {count} messages [{status}]")
            
            conn.close()
            return archived, nitzan_chats
            
        except Exception as e:
            print(f"❌ Error checking archived chats: {e}")
            return [], []
    
    def check_message_gaps(self):
        """Analyze message gaps by year."""
        print("\n📊 Analyzing Message Gaps by Year...")
        
        try:
            conn = sqlite3.connect(self.messages_db_path)
            cursor = conn.cursor()
            
            # Check for any messages in missing years
            for year in [2017, 2018, 2020, 2021, 2023]:
                start_date = int(datetime(year, 1, 1).timestamp() * 1000000000 + 978307200000000000)
                end_date = int(datetime(year, 12, 31).timestamp() * 1000000000 + 978307200000000000)
                
                cursor.execute("""
                    SELECT COUNT(*) FROM message 
                    WHERE date BETWEEN ? AND ?
                """, (start_date, end_date))
                
                total = cursor.fetchone()[0]
                print(f"  {year}: {total} total messages")
                
                if total > 0:
                    # Check if any are from/to Nitzan
                    cursor.execute("""
                        SELECT COUNT(*) FROM message m
                        JOIN handle h ON m.handle_id = h.ROWID
                        WHERE m.date BETWEEN ? AND ?
                        AND (h.id LIKE '%nitzan%' OR h.id LIKE '%pelman%' OR h.id LIKE '%917%239%0518%')
                    """, (start_date, end_date))
                    
                    nitzan_count = cursor.fetchone()[0]
                    print(f"    📧 Nitzan-related: {nitzan_count} messages")
            
            conn.close()
            
        except Exception as e:
            print(f"❌ Error analyzing gaps: {e}")
    
    def comprehensive_search(self):
        """Run comprehensive search for missing messages."""
        print("🔍 COMPREHENSIVE SEARCH FOR MISSING MESSAGES")
        print("=" * 60)
        
        # Check all sources
        icloud_db = self.check_icloud_messages()
        backup_db = self.check_iphone_backups()
        apple_ids = self.check_different_apple_ids()
        services = self.check_sms_vs_imessage()
        archived, nitzan_chats = self.check_archived_deleted_chats()
        self.check_message_gaps()
        
        print("\n📋 SUMMARY OF FINDINGS:")
        print("=" * 40)
        
        if icloud_db:
            print("✅ iCloud Messages database found - may contain missing messages")
        else:
            print("❌ iCloud Messages not found")
        
        if backup_db:
            print("✅ iPhone backup found - may contain missing messages")
        else:
            print("❌ iPhone backup not found")
        
        if len(apple_ids) > 0:
            print(f"✅ Found {len(apple_ids)} Apple IDs - check for different accounts")
        
        if len(archived) > 0:
            print(f"✅ Found {len(archived)} archived chats - may contain missing messages")
        
        print("\n💡 RECOMMENDATIONS:")
        print("1. Check iCloud Messages on your iPhone")
        print("2. Look for iPhone backups in iTunes/Finder")
        print("3. Check if you used different Apple IDs")
        print("4. Check archived chats in Messages app")
        print("5. Verify if messages were SMS vs iMessage")


def main():
    try:
        finder = MissingMessagesFinder()
        finder.comprehensive_search()
        
    except Exception as e:
        print(f"❌ Error: {e}")


if __name__ == "__main__":
    main() 