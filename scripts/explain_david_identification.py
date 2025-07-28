#!/usr/bin/env python3
"""
Explain how we identify David's messages and ensure they're in conversation with Nitzan
"""

import json
from datetime import datetime

def explain_david_identification():
    """Explain the David identification process"""
    
    print("🔍 HOW WE IDENTIFY DAVID'S MESSAGES")
    print("=" * 50)
    
    # Load a sample of direct messages
    try:
        with open("direct_david_nitzan_messages_20250727_210719.json", 'r') as f:
            direct_messages = json.load(f)
    except FileNotFoundError:
        print("❌ Direct messages file not found")
        return
    
    print("📊 PROCESS EXPLANATION:")
    print("=" * 30)
    
    print("1. DATABASE FIELD: 'is_from_me'")
    print("   - This is a boolean field in the Messages database")
    print("   - True (1) = Message sent by the current user (David)")
    print("   - False (0) = Message received from someone else")
    print()
    
    print("2. CHAT IDENTIFICATION:")
    print("   - We look for chat_identifiers that contain Nitzan's info:")
    print("     * Phone numbers: +19172390518, +19179513387, etc.")
    print("     * Emails: nitzan.pelman@gmail.com, nitzanpelman@icloud.com")
    print()
    
    print("3. CONVERSATION VERIFICATION:")
    print("   - We ensure both David AND Nitzan are in the same chat")
    print("   - David's messages: is_from_me = True")
    print("   - Nitzan's messages: is_from_me = False")
    print()
    
    # Show examples
    print("📱 EXAMPLE MESSAGES:")
    print("=" * 25)
    
    # Get sample messages from the primary conversation
    primary_chat_messages = []
    for msg in direct_messages:
        if msg.get('chat_identifier') == '+19172390518':
            primary_chat_messages.append(msg)
    
    # Show first 10 messages
    for i, msg in enumerate(primary_chat_messages[:10], 1):
        sender = "David" if msg.get('is_from_me') == 'David' else "Nitzan"
        text = msg.get('text', '')[:50]
        date = msg.get('readable_date', 'Unknown')
        print(f"{i}. [{sender}] {date}: {text}...")
    
    print()
    
    # Analyze the identification process
    print("🔍 IDENTIFICATION ANALYSIS:")
    print("=" * 30)
    
    # Count David vs Nitzan messages
    david_count = 0
    nitzan_count = 0
    
    for msg in direct_messages:
        if msg.get('is_from_me') == 'David':
            david_count += 1
        else:
            nitzan_count += 1
    
    print(f"Total messages: {len(direct_messages)}")
    print(f"David's messages: {david_count}")
    print(f"Nitzan's messages: {nitzan_count}")
    print(f"David's percentage: {david_count/len(direct_messages)*100:.1f}%")
    
    # Check by chat identifier
    print(f"\n📱 BY CHAT IDENTIFIER:")
    print("=" * 25)
    
    chat_breakdown = {}
    for msg in direct_messages:
        chat_id = msg.get('chat_identifier', 'Unknown')
        if chat_id not in chat_breakdown:
            chat_breakdown[chat_id] = {'David': 0, 'Nitzan': 0}
        
        if msg.get('is_from_me') == 'David':
            chat_breakdown[chat_id]['David'] += 1
        else:
            chat_breakdown[chat_id]['Nitzan'] += 1
    
    for chat_id, counts in chat_breakdown.items():
        total = counts['David'] + counts['Nitzan']
        david_pct = counts['David'] / total * 100 if total > 0 else 0
        print(f"{chat_id}: {total} total ({counts['David']} David, {counts['Nitzan']} Nitzan) - David: {david_pct:.1f}%")
    
    # Check for potential issues
    print(f"\n⚠️  POTENTIAL ISSUES:")
    print("=" * 25)
    
    issues_found = False
    
    for chat_id, counts in chat_breakdown.items():
        if counts['David'] == 0:
            print(f"❌ {chat_id}: No David messages")
            issues_found = True
        elif counts['Nitzan'] == 0:
            print(f"❌ {chat_id}: No Nitzan messages")
            issues_found = True
        elif counts['David'] < 10 and counts['Nitzan'] < 10:
            print(f"⚠️  {chat_id}: Very few messages ({counts['David']} David, {counts['Nitzan']} Nitzan)")
            issues_found = True
    
    if not issues_found:
        print("✅ All conversations have both David and Nitzan messages")
    
    # Explain the process
    print(f"\n📋 IDENTIFICATION PROCESS:")
    print("=" * 30)
    print("1. Extract messages from chat.db databases")
    print("2. Filter for chat_identifiers containing Nitzan's contact info")
    print("3. Use 'is_from_me' field to identify sender:")
    print("   - True = David (current user)")
    print("   - False = Nitzan (other person)")
    print("4. Verify both David and Nitzan are in the same conversation")
    print("5. Exclude group chats (chat_identifier starts with 'chat')")
    print("6. Exclude conversations with display names (group chats)")

if __name__ == "__main__":
    explain_david_identification() 