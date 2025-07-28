#!/usr/bin/env python3
"""
Fix CSV structure to match Supabase table schema exactly
"""

import csv
import json
from datetime import datetime

def fix_supabase_structure():
    """Fix the CSV structure to match the Supabase table schema"""
    
    input_file = "ultimate_supabase_2024_2025_messages_20250727_201359.csv"
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    output_file = f"supabase_ready_2024_2025_messages_{timestamp}.csv"
    
    # Supabase table columns in exact order
    supabase_columns = [
        'message_id',
        'guid', 
        'text',
        'date',
        'date_read',
        'is_from_me',
        'sender',
        'recipient',
        'emojis',
        'links',
        'service',
        'account',
        'contact_id',
        'readable_date',
        'apple_date',
        'apple_date_read'
    ]
    
    print("🔧 FIXING CSV STRUCTURE FOR SUPABASE")
    print("=" * 50)
    print(f"📁 Input: {input_file}")
    print(f"📁 Output: {output_file}")
    
    fixed_rows = []
    
    with open(input_file, 'r') as f:
        reader = csv.DictReader(f)
        
        for row in reader:
            # Create new row with only the columns that match Supabase schema
            fixed_row = {}
            
            for col in supabase_columns:
                if col in row:
                    # Handle specific data type conversions
                    if col == 'message_id':
                        # Ensure message_id is a bigint
                        try:
                            fixed_row[col] = int(row[col])
                        except:
                            fixed_row[col] = 0
                    elif col == 'apple_date':
                        # Ensure apple_date is a bigint
                        try:
                            fixed_row[col] = int(row[col]) if row[col] else None
                        except:
                            fixed_row[col] = None
                    elif col in ['date', 'readable_date']:
                        # Ensure timestamp format
                        if row[col]:
                            # Convert to proper timestamp format
                            try:
                                dt = datetime.fromisoformat(row[col].replace('Z', '+00:00'))
                                fixed_row[col] = dt.isoformat()
                            except:
                                fixed_row[col] = row[col]
                        else:
                            fixed_row[col] = None
                    else:
                        # All other columns as text
                        fixed_row[col] = row[col] if row[col] else None
                else:
                    # Column not in original data, set to None
                    fixed_row[col] = None
            
            fixed_rows.append(fixed_row)
    
    # Write the fixed CSV
    with open(output_file, 'w', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=supabase_columns)
        writer.writeheader()
        writer.writerows(fixed_rows)
    
    print(f"✅ Fixed CSV structure:")
    print(f"  📊 Total rows: {len(fixed_rows)}")
    print(f"  📋 Columns: {len(supabase_columns)}")
    print(f"  📁 Saved to: {output_file}")
    
    # Show sample of first row
    if fixed_rows:
        print(f"\n📋 Sample row structure:")
        sample = fixed_rows[0]
        for col in supabase_columns:
            value = sample.get(col, 'None')
            if isinstance(value, str) and len(value) > 50:
                value = value[:50] + "..."
            print(f"  {col}: {value}")
    
    return output_file

if __name__ == "__main__":
    fix_supabase_structure() 