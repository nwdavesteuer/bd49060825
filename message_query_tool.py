#!/usr/bin/env python3
"""
Message Query Tool for iMessage Gift Projects
Allows searching and analyzing extracted messages with various query options.
"""

import sqlite3
import json
import argparse
from datetime import datetime, timedelta
import pandas as pd


class MessageQueryTool:
    def __init__(self, db_file):
        self.db_file = db_file
        self.conn = None
        
    def connect(self):
        """Connect to the searchable database."""
        try:
            self.conn = sqlite3.connect(self.db_file)
            print(f"Connected to database: {self.db_file}")
        except Exception as e:
            print(f"Error connecting to database: {e}")
            return False
        return True
    
    def disconnect(self):
        """Disconnect from the database."""
        if self.conn:
            self.conn.close()
    
    def search_messages(self, query, limit=50):
        """Search messages using full-text search."""
        if not self.conn:
            return None
        
        try:
            cursor = self.conn.cursor()
            
            # Use FTS5 for full-text search
            sql = """
            SELECT m.*, a.filename, a.mime_type, a.file_path
            FROM messages m
            LEFT JOIN attachments a ON m.message_id = a.message_id
            WHERE m.message_id IN (
                SELECT rowid FROM messages_fts WHERE messages_fts MATCH ?
            )
            ORDER BY m.date DESC
            LIMIT ?
            """
            
            cursor.execute(sql, (query, limit))
            results = cursor.fetchall()
            
            return results
            
        except Exception as e:
            print(f"Error searching messages: {e}")
            return None
    
    def get_conversation_stats(self):
        """Get overall conversation statistics."""
        if not self.conn:
            return None
        
        try:
            cursor = self.conn.cursor()
            
            # Basic stats
            cursor.execute("SELECT COUNT(*) FROM messages")
            total_messages = cursor.fetchone()[0]
            
            cursor.execute("SELECT COUNT(*) FROM messages WHERE is_from_me = 1")
            sent_messages = cursor.fetchone()[0]
            
            cursor.execute("SELECT COUNT(*) FROM messages WHERE is_from_me = 0")
            received_messages = cursor.fetchone()[0]
            
            cursor.execute("SELECT COUNT(*) FROM messages WHERE has_attachments = 1")
            messages_with_attachments = cursor.fetchone()[0]
            
            # Date range
            cursor.execute("SELECT MIN(readable_date), MAX(readable_date) FROM messages")
            date_range = cursor.fetchone()
            
            # Daily message counts
            cursor.execute("""
                SELECT DATE(readable_date) as date, COUNT(*) as count
                FROM messages
                GROUP BY DATE(readable_date)
                ORDER BY date DESC
                LIMIT 30
            """)
            daily_counts = cursor.fetchall()
            
            return {
                'total_messages': total_messages,
                'sent_messages': sent_messages,
                'received_messages': received_messages,
                'messages_with_attachments': messages_with_attachments,
                'date_range': date_range,
                'daily_counts': daily_counts
            }
            
        except Exception as e:
            print(f"Error getting stats: {e}")
            return None
    
    def get_messages_by_date_range(self, start_date, end_date):
        """Get messages within a date range."""
        if not self.conn:
            return None
        
        try:
            cursor = self.conn.cursor()
            
            sql = """
            SELECT m.*, a.filename, a.mime_type, a.file_path
            FROM messages m
            LEFT JOIN attachments a ON m.message_id = a.message_id
            WHERE DATE(m.readable_date) BETWEEN ? AND ?
            ORDER BY m.date ASC
            """
            
            cursor.execute(sql, (start_date, end_date))
            results = cursor.fetchall()
            
            return results
            
        except Exception as e:
            print(f"Error getting messages by date: {e}")
            return None
    
    def get_messages_with_attachments(self):
        """Get all messages that have attachments."""
        if not self.conn:
            return None
        
        try:
            cursor = self.conn.cursor()
            
            sql = """
            SELECT m.*, a.filename, a.mime_type, a.file_path, a.thumbnail_data
            FROM messages m
            JOIN attachments a ON m.message_id = a.message_id
            ORDER BY m.date DESC
            """
            
            cursor.execute(sql)
            results = cursor.fetchall()
            
            return results
            
        except Exception as e:
            print(f"Error getting messages with attachments: {e}")
            return None
    
    def get_most_active_days(self, limit=10):
        """Get the most active days in the conversation."""
        if not self.conn:
            return None
        
        try:
            cursor = self.conn.cursor()
            
            sql = """
            SELECT DATE(readable_date) as date, COUNT(*) as message_count
            FROM messages
            GROUP BY DATE(readable_date)
            ORDER BY message_count DESC
            LIMIT ?
            """
            
            cursor.execute(sql, (limit,))
            results = cursor.fetchall()
            
            return results
            
        except Exception as e:
            print(f"Error getting active days: {e}")
            return None
    
    def get_longest_messages(self, limit=20):
        """Get the longest messages in the conversation."""
        if not self.conn:
            return None
        
        try:
            cursor = self.conn.cursor()
            
            sql = """
            SELECT m.*, LENGTH(m.text) as text_length
            FROM messages m
            WHERE m.text IS NOT NULL AND m.text != ''
            ORDER BY LENGTH(m.text) DESC
            LIMIT ?
            """
            
            cursor.execute(sql, (limit,))
            results = cursor.fetchall()
            
            return results
            
        except Exception as e:
            print(f"Error getting longest messages: {e}")
            return None
    
    def export_to_json(self, output_file, data):
        """Export query results to JSON."""
        try:
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            print(f"Results exported to: {output_file}")
        except Exception as e:
            print(f"Error exporting to JSON: {e}")
    
    def print_message(self, message_data):
        """Print a formatted message."""
        direction = "→" if message_data[4] else "←"
        date_str = message_data[11]
        text = message_data[2] or ""
        
        print(f"{direction} {date_str}: {text[:100]}{'...' if len(text) > 100 else ''}")
        
        # Show attachment info if present
        if message_data[5]:  # has_attachments
            print(f"   📎 Has attachment")


def main():
    parser = argparse.ArgumentParser(description="Query tool for extracted iMessages")
    parser.add_argument("database", help="Path to the SQLite database file")
    parser.add_argument("--search", "-s", help="Search for messages containing text")
    parser.add_argument("--stats", action="store_true", help="Show conversation statistics")
    parser.add_argument("--date-range", nargs=2, metavar=('START', 'END'), 
                       help="Get messages within date range (YYYY-MM-DD)")
    parser.add_argument("--attachments", action="store_true", help="Show messages with attachments")
    parser.add_argument("--active-days", type=int, default=10, help="Show most active days")
    parser.add_argument("--longest", type=int, default=20, help="Show longest messages")
    parser.add_argument("--export", "-e", help="Export results to JSON file")
    parser.add_argument("--limit", "-l", type=int, default=50, help="Limit number of results")
    
    args = parser.parse_args()
    
    # Initialize query tool
    query_tool = MessageQueryTool(args.database)
    
    if not query_tool.connect():
        return
    
    try:
        results = None
        
        if args.stats:
            print("=== Conversation Statistics ===")
            stats = query_tool.get_conversation_stats()
            if stats:
                print(f"Total messages: {stats['total_messages']}")
                print(f"Sent by you: {stats['sent_messages']}")
                print(f"Received: {stats['received_messages']}")
                print(f"With attachments: {stats['messages_with_attachments']}")
                print(f"Date range: {stats['date_range'][0]} to {stats['date_range'][1]}")
                
                print(f"\nMost active days:")
                for date, count in stats['daily_counts'][:10]:
                    print(f"  {date}: {count} messages")
        
        elif args.search:
            print(f"=== Searching for: '{args.search}' ===")
            results = query_tool.search_messages(args.search, args.limit)
            if results:
                print(f"Found {len(results)} messages:")
                for msg in results:
                    query_tool.print_message(msg)
        
        elif args.date_range:
            print(f"=== Messages from {args.date_range[0]} to {args.date_range[1]} ===")
            results = query_tool.get_messages_by_date_range(args.date_range[0], args.date_range[1])
            if results:
                print(f"Found {len(results)} messages:")
                for msg in results:
                    query_tool.print_message(msg)
        
        elif args.attachments:
            print("=== Messages with Attachments ===")
            results = query_tool.get_messages_with_attachments()
            if results:
                print(f"Found {len(results)} messages with attachments:")
                for msg in results:
                    query_tool.print_message(msg)
        
        elif args.active_days:
            print(f"=== Top {args.active_days} Most Active Days ===")
            active_days = query_tool.get_most_active_days(args.active_days)
            if active_days:
                for date, count in active_days:
                    print(f"{date}: {count} messages")
        
        elif args.longest:
            print(f"=== Top {args.longest} Longest Messages ===")
            results = query_tool.get_longest_messages(args.longest)
            if results:
                for msg in results:
                    query_tool.print_message(msg)
        
        else:
            print("No query specified. Use --help for options.")
            return
        
        # Export results if requested
        if args.export and results:
            query_tool.export_to_json(args.export, results)
    
    finally:
        query_tool.disconnect()


if __name__ == "__main__":
    main() 