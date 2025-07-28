#!/usr/bin/env python3
"""
Check for messages between July 1-24, 2015
"""

import json
from datetime import datetime

def check_july_messages():
    with open('nitzan_messages.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    messages = data['messages']
    
    # Check for messages between July 1-24, 2015
    july_messages = []
    
    for msg in messages:
        date_str = msg.get('readable_date', '')
        if date_str:
            try:
                # Parse the date
                msg_date = datetime.strptime(date_str, '%Y-%m-%d %H:%M:%S')
                
                # Check if it's between July 1-24, 2015
                if msg_date.year == 2015 and msg_date.month == 7 and 1 <= msg_date.day <= 24:
                    july_messages.append(msg)
            except ValueError:
                continue
    
    print(f"Found {len(july_messages)} messages between July 1-24, 2015")
    print()
    
    if july_messages:
        print("Messages from July 1-24, 2015:")
        print("=" * 50)
        
        for i, msg in enumerate(july_messages, 1):
            direction = "→" if msg['is_from_me'] else "←"
            date_str = msg['readable_date']
            text = msg.get('text', '') or ""
            
            print(f"{i:2d}. {direction} {date_str}")
            print(f"    {text[:100]}{'...' if len(text) > 100 else ''}")
            print()
    else:
        print("No messages found between July 1-24, 2015")
        
        # Show the earliest messages instead
        print("\nEarliest messages in the conversation:")
        print("=" * 40)
        
        earliest_messages = sorted(messages, key=lambda x: x.get('readable_date', ''))[:10]
        
        for i, msg in enumerate(earliest_messages, 1):
            direction = "→" if msg['is_from_me'] else "←"
            date_str = msg['readable_date']
            text = msg.get('text', '') or ""
            
            print(f"{i:2d}. {direction} {date_str}")
            print(f"    {text[:100]}{'...' if len(text) > 100 else ''}")
            print()

if __name__ == "__main__":
    check_july_messages() 