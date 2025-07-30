#!/usr/bin/env python3
"""
Generate a list of table columns for sharing with v0
"""

def generate_table_columns():
    """Generate table column information"""
    
    print("📊 GENERATING TABLE COLUMN LIST")
    print("=" * 35)
    
    # Table structure based on the original CSV and Supabase table
    columns = [
        {
            'name': 'message_id',
            'type': 'bigint',
            'description': 'Unique message identifier',
            'example': '177106'
        },
        {
            'name': 'guid',
            'type': 'text',
            'description': 'Apple message GUID',
            'example': '89049CBC-314E-4297-9271-50DF5D92FB56'
        },
        {
            'name': 'text',
            'type': 'text',
            'description': 'Message content',
            'example': 'Deliriously tired would be an understatement at this point'
        },
        {
            'name': 'date',
            'type': 'bigint',
            'description': 'Apple timestamp (nanoseconds since 2001-01-01)',
            'example': '459390373000000000'
        },
        {
            'name': 'date_read',
            'type': 'bigint',
            'description': 'When message was read (Apple timestamp)',
            'example': '459390757000000000'
        },
        {
            'name': 'is_from_me',
            'type': 'integer',
            'description': '0 = received, 1 = sent',
            'example': '0'
        },
        {
            'name': 'sender',
            'type': 'text',
            'description': 'Message sender (David or Nitzan)',
            'example': 'Nitzan'
        },
        {
            'name': 'recipient',
            'type': 'text',
            'description': 'Message recipient (David or Nitzan)',
            'example': 'David'
        },
        {
            'name': 'has_attachments',
            'type': 'integer',
            'description': '0 = no attachments, 1 = has attachments',
            'example': '0'
        },
        {
            'name': 'attachments_info',
            'type': 'text',
            'description': 'Details about attachments',
            'example': ''
        },
        {
            'name': 'emojis',
            'type': 'text',
            'description': 'Emoji content in message',
            'example': ''
        },
        {
            'name': 'links',
            'type': 'text',
            'description': 'URLs found in message',
            'example': ''
        },
        {
            'name': 'service',
            'type': 'text',
            'description': 'Message service (iMessage/SMS)',
            'example': 'iMessage'
        },
        {
            'name': 'account',
            'type': 'text',
            'description': 'Account identifier',
            'example': ''
        },
        {
            'name': 'contact_id',
            'type': 'text',
            'description': 'Contact identifier',
            'example': 'nitzanpelman@icloud.com'
        },
        {
            'name': 'readable_date',
            'type': 'text',
            'description': 'Human readable date/time',
            'example': '2015-07-23T17:26:13'
        }
    ]
    
    print("📋 TABLE COLUMNS FOR V0:")
    print("=" * 30)
    
    for i, col in enumerate(columns, 1):
        print(f"{i:2d}. {col['name']:<20} ({col['type']:<10}) - {col['description']}")
        print(f"    Example: {col['example']}")
        print()
    
    # Create a simple list for easy copying
    print("📋 SIMPLE COLUMN LIST:")
    print("=" * 25)
    column_names = [col['name'] for col in columns]
    print(", ".join(column_names))
    
    # Create a formatted list for documentation
    print(f"\n📋 FORMATTED FOR DOCUMENTATION:")
    print("=" * 35)
    print("Table: david_nitzan_all_messages")
    print("Columns:")
    for col in columns:
        print(f"- {col['name']} ({col['type']}): {col['description']}")
    
    # Create SQL-like format
    print(f"\n📋 SQL FORMAT:")
    print("=" * 15)
    print("CREATE TABLE david_nitzan_all_messages (")
    for i, col in enumerate(columns):
        comma = "," if i < len(columns) - 1 else ""
        print(f"    {col['name']} {col['type']}{comma}")
    print(");")
    
    # Create a summary
    print(f"\n📊 SUMMARY:")
    print("=" * 15)
    print(f"Total columns: {len(columns)}")
    print(f"Data types: {', '.join(set(col['type'] for col in columns))}")
    print(f"Primary key: message_id")
    print(f"Text fields: text, guid, sender, recipient, attachments_info, emojis, links, service, account, contact_id, readable_date")
    print(f"Numeric fields: message_id, date, date_read, is_from_me, has_attachments")
    
    return columns

if __name__ == "__main__":
    generate_table_columns() 