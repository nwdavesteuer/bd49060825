#!/usr/bin/env python3
"""
Check if David uses nwdave@b-zb.com and 4152356782
"""

import json
from datetime import datetime

def check_david_identifiers():
    """Check for David's email and phone number"""
    
    # Load the comprehensive search results to check all possible identifiers
    try:
        with open("comprehensive_contact_search_20250727_210406.json", 'r') as f:
            all_messages = json.load(f)
    except FileNotFoundError:
        print("❌ Comprehensive search data not found")
        return
    
    print("🔍 CHECKING FOR DAVID'S IDENTIFIERS")
    print("=" * 50)
    
    # Search for the specific identifiers
    david_email = "nwdave@b-zb.com"
    david_phone = "4152356782"
    
    # Check for email
    email_messages = []
    for msg in all_messages:
        chat_identifier = msg.get('chat_identifier', '')
        if david_email in chat_identifier:
            email_messages.append(msg)
    
    # Check for phone number
    phone_messages = []
    for msg in all_messages:
        chat_identifier = msg.get('chat_identifier', '')
        if david_phone in chat_identifier:
            phone_messages.append(msg)
    
    print(f"📧 Messages with {david_email}: {len(email_messages)}")
    print(f"📱 Messages with {david_phone}: {len(phone_messages)}")
    
    # Analyze email messages
    if email_messages:
        print(f"\n📧 EMAIL MESSAGES ANALYSIS:")
        print("=" * 35)
        
        # Check sender breakdown
        david_count = 0
        other_count = 0
        
        for msg in email_messages:
            sender = msg.get('is_from_me', 'Unknown')
            if sender == 'David':
                david_count += 1
            else:
                other_count += 1
        
        print(f"David's messages: {david_count}")
        print(f"Other messages: {other_count}")
        
        # Show sample messages
        print(f"\n💬 Sample email messages:")
        for i, msg in enumerate(email_messages[:5], 1):
            sender = msg.get('is_from_me', 'Unknown')
            text = msg.get('text', '')[:100]
            date = msg.get('readable_date', 'Unknown')
            print(f"{i}. [{sender}] {date}: {text}...")
    
    # Analyze phone messages
    if phone_messages:
        print(f"\n📱 PHONE MESSAGES ANALYSIS:")
        print("=" * 35)
        
        # Check sender breakdown
        david_count = 0
        other_count = 0
        
        for msg in phone_messages:
            sender = msg.get('is_from_me', 'Unknown')
            if sender == 'David':
                david_count += 1
            else:
                other_count += 1
        
        print(f"David's messages: {david_count}")
        print(f"Other messages: {other_count}")
        
        # Show sample messages
        print(f"\n💬 Sample phone messages:")
        for i, msg in enumerate(phone_messages[:5], 1):
            sender = msg.get('is_from_me', 'Unknown')
            text = msg.get('text', '')[:100]
            date = msg.get('readable_date', 'Unknown')
            print(f"{i}. [{sender}] {date}: {text}...")
    
    # Search for any variations of these identifiers
    print(f"\n🔍 SEARCHING FOR VARIATIONS:")
    print("=" * 30)
    
    # Check for partial matches
    partial_email_matches = []
    partial_phone_matches = []
    
    for msg in all_messages:
        chat_identifier = msg.get('chat_identifier', '')
        
        # Check for email variations
        if 'nwdave' in chat_identifier.lower() or 'b-zb.com' in chat_identifier.lower():
            partial_email_matches.append(msg)
        
        # Check for phone variations
        if '4152356782' in chat_identifier or '415-235-6782' in chat_identifier:
            partial_phone_matches.append(msg)
    
    print(f"Partial email matches: {len(partial_email_matches)}")
    print(f"Partial phone matches: {len(partial_phone_matches)}")
    
    if partial_email_matches:
        print(f"\n📧 Partial email matches:")
        for msg in partial_email_matches[:3]:
            print(f"  - {msg.get('chat_identifier')}: {msg.get('text', '')[:50]}...")
    
    if partial_phone_matches:
        print(f"\n📱 Partial phone matches:")
        for msg in partial_phone_matches[:3]:
            print(f"  - {msg.get('chat_identifier')}: {msg.get('text', '')[:50]}...")
    
    # Check if these identifiers are in our direct messages
    try:
        with open("direct_david_nitzan_messages_20250727_210719.json", 'r') as f:
            direct_messages = json.load(f)
        
        print(f"\n🔍 CHECKING DIRECT MESSAGES:")
        print("=" * 30)
        
        direct_email_matches = []
        direct_phone_matches = []
        
        for msg in direct_messages:
            chat_identifier = msg.get('chat_identifier', '')
            
            if david_email in chat_identifier:
                direct_email_matches.append(msg)
            
            if david_phone in chat_identifier:
                direct_phone_matches.append(msg)
        
        print(f"Direct messages with email: {len(direct_email_matches)}")
        print(f"Direct messages with phone: {len(direct_phone_matches)}")
        
        if direct_email_matches or direct_phone_matches:
            print("✅ Found David's identifiers in direct messages!")
        else:
            print("❌ David's identifiers not found in direct messages")
    
    except FileNotFoundError:
        print("❌ Direct messages file not found")
    
    # Summary
    print(f"\n📋 SUMMARY:")
    print("=" * 20)
    print(f"Email {david_email}: {'Found' if email_messages else 'Not found'}")
    print(f"Phone {david_phone}: {'Found' if phone_messages else 'Not found'}")
    
    if not email_messages and not phone_messages:
        print("\n💡 SUGGESTION: These identifiers might not be in the Messages database")
        print("   They could be from a different service (email, WhatsApp, etc.)")
        print("   Or they might be stored in a different location")

if __name__ == "__main__":
    check_david_identifiers() 