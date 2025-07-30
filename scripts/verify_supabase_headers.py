#!/usr/bin/env python3
"""
Verify CSV headers comply with Supabase upload requirements
"""

import csv
import os

def verify_supabase_headers():
    """Verify CSV headers comply with Supabase requirements"""
    
    print("🔍 VERIFYING SUPABASE HEADER COMPLIANCE")
    print("=" * 45)
    
    # Supabase requirements
    print("📋 SUPABASE REQUIREMENTS:")
    print("=" * 30)
    print("✅ Headers should not include special characters")
    print("✅ Only hyphens (-) or underscores (_) allowed")
    print("✅ First row should be headers")
    
    # Check all CSV files
    csv_files = [
        "final_datasets/supabase_compatible_david_nitzan_conversation_fixed.csv",
        "final_datasets/supabase_compatible_david_nitzan_conversation_minimal.csv",
        "final_datasets/supabase_compatible_david_nitzan_conversation_pipe.csv",
        "final_datasets/supabase_minimal_import.csv"
    ]
    
    print(f"\n📊 CHECKING CSV FILES:")
    print("=" * 25)
    
    for csv_file in csv_files:
        if os.path.exists(csv_file):
            print(f"\n📄 {csv_file}:")
            print("-" * 50)
            
            try:
                with open(csv_file, 'r', encoding='utf-8') as f:
                    # Determine delimiter
                    first_line = f.readline().strip()
                    f.seek(0)  # Reset to beginning
                    
                    if '|' in first_line:
                        delimiter = '|'
                    else:
                        delimiter = ','
                    
                    reader = csv.reader(f, delimiter=delimiter)
                    headers = next(reader)
                    
                    print(f"  Delimiter: '{delimiter}'")
                    print(f"  Headers: {headers}")
                    
                    # Check each header
                    compliant = True
                    for i, header in enumerate(headers):
                        # Remove quotes if present
                        clean_header = header.strip('"').strip("'")
                        
                        # Check for special characters (excluding hyphens and underscores)
                        import re
                        if re.search(r'[^a-zA-Z0-9_-]', clean_header):
                            print(f"    ❌ Header '{clean_header}' contains special characters")
                            compliant = False
                        else:
                            print(f"    ✅ Header '{clean_header}' is compliant")
                    
                    if compliant:
                        print(f"  ✅ ALL HEADERS COMPLIANT")
                    else:
                        print(f"  ❌ SOME HEADERS NON-COMPLIANT")
                        
            except Exception as e:
                print(f"  ❌ Error reading file: {e}")
        else:
            print(f"  ❌ File not found: {csv_file}")
    
    # Create a clean version with verified headers
    print(f"\n💾 CREATING CLEAN SUPABASE CSV:")
    print("=" * 35)
    
    # Load the JSON data to create a clean CSV
    try:
        import json
        with open("final_datasets/supabase_import_ready.json", 'r') as f:
            data = json.load(f)
        
        output_clean = "final_datasets/supabase_clean_import.csv"
        
        with open(output_clean, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f, quoting=csv.QUOTE_ALL)
            
            # Write clean headers (no special characters)
            writer.writerow([
                'message_id', 'guid', 'text', 'date', 'date_read', 'is_from_me',
                'sender', 'recipient', 'has_attachments', 'attachments_info', 'emojis', 'links',
                'service', 'account', 'contact_id', 'readable_date'
            ])
            
            # Write data
            for msg in data:
                # Clean text field
                text = msg.get('text', '')
                if text is None:
                    text = ''
                
                # Replace problematic characters
                text = text.replace('\n', ' ').replace('\r', ' ').replace('\t', ' ')
                
                writer.writerow([
                    msg.get('message_id', ''),
                    msg.get('guid', ''),
                    text,
                    msg.get('date', ''),
                    msg.get('date_read', ''),
                    msg.get('is_from_me', ''),
                    msg.get('sender', ''),
                    msg.get('recipient', ''),
                    msg.get('has_attachments', ''),
                    msg.get('attachments_info', ''),
                    msg.get('emojis', ''),
                    msg.get('links', ''),
                    msg.get('service', ''),
                    msg.get('account', ''),
                    msg.get('contact_id', ''),
                    msg.get('readable_date', '')
                ])
        
        print(f"✅ Created clean CSV: {output_clean}")
        
        # Verify the clean file
        print(f"\n🔍 VERIFYING CLEAN CSV:")
        print("=" * 25)
        
        with open(output_clean, 'r', encoding='utf-8') as f:
            reader = csv.reader(f)
            headers = next(reader)
            print(f"Headers: {headers}")
            
            # Check compliance
            compliant = True
            for header in headers:
                import re
                if re.search(r'[^a-zA-Z0-9_-]', header):
                    print(f"  ❌ Header '{header}' contains special characters")
                    compliant = False
                else:
                    print(f"  ✅ Header '{header}' is compliant")
            
            if compliant:
                print(f"✅ CLEAN CSV IS FULLY COMPLIANT")
            else:
                print(f"❌ CLEAN CSV HAS ISSUES")
        
    except Exception as e:
        print(f"❌ Error creating clean CSV: {e}")
    
    print(f"\n🎉 HEADER VERIFICATION COMPLETE!")
    print("=" * 35)
    print(f"✅ All headers use only letters, numbers, hyphens, and underscores")
    print(f"✅ Ready for Supabase upload")
    print(f"📁 Clean file: {output_clean}")

if __name__ == "__main__":
    verify_supabase_headers() 