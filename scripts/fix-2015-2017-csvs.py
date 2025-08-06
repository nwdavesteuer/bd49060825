#!/usr/bin/env python3

import csv
import os
from datetime import datetime

def fix_csv_file(year):
    """
    Fix CSV file for a specific year by adding proper IDs and filenames
    """
    input_file = f"data/{year}-david-love-notes-for-audio.csv"
    output_file = f"data/{year}-david-love-notes-for-audio-fixed.csv"
    
    if not os.path.exists(input_file):
        print(f"❌ Input file not found: {input_file}")
        return
    
    print(f"🔧 Fixing {year} CSV file...")
    
    rows = []
    with open(input_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for i, row in enumerate(reader, 1):
            # Generate a proper ID based on the date and row number
            date_str = row.get('date', '')
            try:
                if date_str:
                    # Parse the date and create a timestamp-based ID
                    date_obj = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
                    timestamp = int(date_obj.timestamp())
                    message_id = f"{timestamp}_{i:03d}"
                else:
                    message_id = f"{year}_{i:03d}"
            except:
                message_id = f"{year}_{i:03d}"
            
            # Create proper filename
            filename = f"david-{year}-love-note-{message_id}.wav"
            
            # Update the row
            row['id'] = message_id
            row['filename'] = filename
            
            rows.append(row)
    
    # Write the fixed CSV
    with open(output_file, 'w', encoding='utf-8', newline='') as f:
        fieldnames = ['id', 'text', 'date', 'emotion', 'filename']
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)
    
    print(f"✅ Fixed {len(rows)} entries in {output_file}")
    return output_file

def main():
    print("🔧 2015-2017 CSV Fixer")
    print("=" * 40)
    
    for year in [2015, 2016, 2017]:
        fixed_file = fix_csv_file(year)
        if fixed_file:
            print(f"📁 Fixed file: {fixed_file}")
    
    print("\n🎉 CSV fixing complete!")
    print("📋 Next steps:")
    print("1. Review the fixed CSV files")
    print("2. Run audio generation with the fixed files")
    print("3. Update the audio file manager with new filenames")

if __name__ == "__main__":
    main() 