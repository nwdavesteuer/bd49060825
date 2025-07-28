#!/usr/bin/env python3
"""
Example usage of the iMessageExtractor class
This script demonstrates how to use the extractor programmatically
"""

from imessage_extractor import iMessageExtractor
import pandas as pd

def main():
    try:
        # Initialize the extractor
        extractor = iMessageExtractor()
        
        print("=== iMessage Extractor Example ===\n")
        
        # Example 1: List recent contacts
        print("1. Listing recent contacts:")
        extractor.list_contacts(limit=10)
        print()
        
        # Example 2: Extract messages for a specific contact
        print("2. Extracting messages for a contact:")
        contact_identifier = input("Enter contact name, phone number, or email: ").strip()
        
        if contact_identifier:
            # Extract messages (limit to 20 for demo)
            messages_df = extractor.extract_messages(
                contact_identifier, 
                output_file=None,  # Don't save to file for this example
                limit=20
            )
            
            if messages_df is not None:
                print(f"\nExtracted {len(messages_df)} messages")
                
                # Example 3: Analyze the data
                print("\n3. Basic analysis:")
                print(f"Total messages: {len(messages_df)}")
                print(f"Messages sent by you: {messages_df['is_from_me'].sum()}")
                print(f"Messages received: {(~messages_df['is_from_me']).sum()}")
                print(f"Messages with attachments: {messages_df['cache_has_attachments'].sum()}")
                
                # Show message frequency by date
                messages_df['date_only'] = messages_df['date'].dt.date
                daily_counts = messages_df.groupby('date_only').size()
                print(f"\nMessages per day (last 5 days):")
                print(daily_counts.tail())
                
                # Example 4: Save to CSV with custom filename
                output_filename = f"messages_{contact_identifier.replace(' ', '_')}.csv"
                messages_df.to_csv(output_filename, index=False)
                print(f"\nMessages saved to: {output_filename}")
                
                # Example 5: Show recent conversation
                print(f"\n4. Recent conversation preview:")
                recent_messages = messages_df.head(10).sort_values('date')
                for _, msg in recent_messages.iterrows():
                    direction = "→" if msg['is_from_me'] else "←"
                    date_str = msg['readable_date']
                    text_preview = msg['text'][:50] + "..." if len(msg['text']) > 50 else msg['text']
                    print(f"{direction} {date_str}: {text_preview}")
        
        # Example 6: Batch extraction for multiple contacts
        print("\n5. Batch extraction example:")
        contacts_to_extract = [
            "john@example.com",
            "+1234567890",
            "Jane Doe"
        ]
        
        all_extracted_messages = []
        
        for contact in contacts_to_extract:
            print(f"Extracting messages for: {contact}")
            try:
                messages = extractor.extract_messages(contact, limit=10)
                if messages is not None:
                    all_extracted_messages.append(messages)
                    print(f"  ✓ Found {len(messages)} messages")
                else:
                    print(f"  ✗ No messages found")
            except Exception as e:
                print(f"  ✗ Error: {e}")
        
        if all_extracted_messages:
            # Combine all messages
            combined_df = pd.concat(all_extracted_messages, ignore_index=True)
            combined_df = combined_df.sort_values('date', ascending=False)
            
            # Save combined data
            combined_df.to_csv("all_contacts_messages.csv", index=False)
            print(f"\nCombined {len(combined_df)} messages from all contacts saved to: all_contacts_messages.csv")
        
    except FileNotFoundError as e:
        print(f"Error: {e}")
        print("Make sure you're running this on a Mac with Messages enabled.")
    except Exception as e:
        print(f"Unexpected error: {e}")

if __name__ == "__main__":
    main() 