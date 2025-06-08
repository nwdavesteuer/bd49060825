#!/usr/bin/env python3
"""
Permission Helper for iMessage Extraction
Checks and helps resolve permission issues for accessing the Messages database.
"""

import os
import sys
from pathlib import Path

def check_permissions():
    """Check if we have permission to access the Messages database."""
    home = os.path.expanduser("~")
    messages_dir = os.path.join(home, "Library", "Messages")
    chat_db = os.path.join(messages_dir, "chat.db")
    
    print("=== iMessage Database Permission Check ===\n")
    
    # Check if Messages directory exists
    if not os.path.exists(messages_dir):
        print("❌ Messages directory not found!")
        print(f"Expected location: {messages_dir}")
        print("Make sure you're running this on a Mac with Messages enabled.")
        return False
    
    print(f"✅ Messages directory found: {messages_dir}")
    
    # Check if chat.db exists
    if not os.path.exists(chat_db):
        print("❌ Messages database not found!")
        print(f"Expected location: {chat_db}")
        print("Make sure Messages app is set up and has conversations.")
        return False
    
    print(f"✅ Messages database found: {chat_db}")
    
    # Check read permissions
    try:
        with open(chat_db, 'rb') as f:
            f.read(1024)  # Try to read a small amount
        print("✅ Read permission granted to Messages database")
        return True
    except PermissionError:
        print("❌ Permission denied accessing Messages database")
        return False
    except Exception as e:
        print(f"❌ Error accessing database: {e}")
        return False

def print_permission_instructions():
    """Print instructions for granting permissions."""
    print("\n=== How to Grant Terminal Access to Messages ===")
    print("Follow these steps to allow Terminal to access your Messages:")
    print()
    print("1. Open System Preferences (or System Settings on newer macOS)")
    print("2. Go to 'Security & Privacy' (or 'Privacy & Security')")
    print("3. Click on 'Privacy' tab")
    print("4. Select 'Full Disk Access' from the left sidebar")
    print("5. Click the lock icon 🔒 and enter your password")
    print("6. Click the '+' button to add an application")
    print("7. Navigate to Applications > Utilities > Terminal")
    print("8. Select Terminal and click 'Open'")
    print("9. Make sure Terminal is checked in the list")
    print("10. Close System Preferences")
    print()
    print("Alternative: If you're using a different terminal app (like iTerm2):")
    print("- Add your specific terminal application instead of Terminal")
    print()
    print("After granting permissions:")
    print("- Close the Messages app completely")
    print("- Wait a few seconds")
    print("- Try running the extraction script again")

def suggest_alternative_approaches():
    """Suggest alternative approaches if permissions can't be granted."""
    print("\n=== Alternative Approaches ===")
    print("If you can't or don't want to grant full disk access:")
    print()
    print("1. **Use Messages Export Feature**:")
    print("   - Open Messages app")
    print("   - Select your conversation with Nitzan")
    print("   - Use File > Export Chat... (if available)")
    print()
    print("2. **Use Time Machine Backup**:")
    print("   - Restore Messages database from Time Machine")
    print("   - Extract from the backup location")
    print()
    print("3. **Use Third-Party Tools**:")
    print("   - Consider using established iMessage backup tools")
    print("   - These often have better permission handling")
    print()
    print("4. **Manual Export**:")
    print("   - Take screenshots of important conversations")
    print("   - Copy and paste messages manually")
    print("   - Save images separately")

def main():
    print("🔍 Checking iMessage database permissions...\n")
    
    if check_permissions():
        print("\n🎉 Great! You have permission to access the Messages database.")
        print("You should be able to run the extraction script successfully.")
        print("\nTry running:")
        print("python3 enhanced_imessage_extractor.py --contact \"Nitzan\" --output nitzan_messages.json")
    else:
        print_permission_instructions()
        suggest_alternative_approaches()
        
        print("\n=== Quick Test ===")
        print("After granting permissions, run this command to test:")
        print("python3 permission_helper.py")

if __name__ == "__main__":
    main() 