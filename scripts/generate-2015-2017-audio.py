#!/usr/bin/env python3

import os
import csv
import sys
import time
from pathlib import Path
from hume import HumeClient
from hume.tts.types import PostedUtterance, PostedUtteranceVoiceWithId, FormatWav

def generate_year_audio(year, output_dir="public/audio/love-notes", voice_id="e61bbb66-9084-40b7-a4dc-ddd0c62592c9"):
    """
    Generate audio files for a specific year
    """
    print(f"🎵 Generating {year} Love Notes Audio")
    print(f"📁 Output directory: {output_dir}")
    print(f"🎤 Using voice ID: {voice_id}")
    print("")
    
    # Initialize Hume client
    api_key = os.getenv('HUME_API_KEY', '5sMy54ZASUGzlDJv8f2nOIliS5AqEJmYyhECrA6VqiwZVIFx')
    client = HumeClient(api_key=api_key)
    
    # Create output directory
    Path(output_dir).mkdir(parents=True, exist_ok=True)
    
    # CSV file path
    csv_file = f"data/{year}-david-love-notes-for-audio.csv"
    
    if not os.path.exists(csv_file):
        print(f"❌ CSV file not found: {csv_file}")
        return 0, 0
    
    # Read CSV file
    with open(csv_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        rows = list(reader)
    
    print(f"📝 Found {len(rows)} entries in {csv_file}")
    
    # Configure voice
    voice = PostedUtteranceVoiceWithId(id=voice_id)
    
    success_count = 0
    error_count = 0
    
    for i, row in enumerate(rows, 1):
        filename = row.get('filename', '').strip()
        text = row.get('text', '').strip()
        
        if not filename or not text:
            print(f"⚠️  Skipping row {i}: missing filename or text")
            continue
        
        # Check if file already exists
        output_path = os.path.join(output_dir, filename)
        if os.path.exists(output_path):
            print(f"⏭️  Skipping {filename} (already exists)")
            continue
        
        print(f"🎤 Generating audio: {filename}")
        print(f"   📊 Text length: {len(text)} characters, {len(text.split())} words")
        print(f"   📅 Date: {row.get('date', 'Unknown')}")
        print(f"   📝 Preview: {text[:100]}...")
        
        try:
            # Generate audio
            utterance = PostedUtterance(
                text=text,
                voice=voice
            )
            
            audio_data = client.tts.synthesize_json(
                utterances=[utterance],
                format=FormatWav()
            )
            
            # Save audio file
            import base64
            audio_bytes = base64.b64decode(audio_data.generations[0].audio)
            with open(output_path, 'wb') as f:
                f.write(audio_bytes)
            
            print(f"   ✅ Generated: {filename} ({audio_data.generations[0].duration:.2f}s)")
            success_count += 1
            
            # Small delay to avoid rate limiting
            time.sleep(1)
            
        except Exception as e:
            print(f"   ❌ Error: {e}")
            error_count += 1
    
    return success_count, error_count

def main():
    print("🎵 2015-2017 Love Notes Audio Generator")
    print("=" * 50)
    
    output_dir = "public/audio/love-notes"
    voice_id = "e61bbb66-9084-40b7-a4dc-ddd0c62592c9"
    
    total_success = 0
    total_errors = 0
    
    for year in [2015, 2016, 2017]:
        print(f"\n🎯 Processing {year}...")
        success, errors = generate_year_audio(year, output_dir, voice_id)
        total_success += success
        total_errors += errors
        print(f"✅ {year}: {success} generated, {errors} errors")
    
    print("\n" + "=" * 50)
    print("🎉 2015-2017 Audio generation complete!")
    print(f"✅ Total successfully generated: {total_success} files")
    print(f"❌ Total errors: {total_errors} files")
    print(f"📁 Output directory: {output_dir}")
    
    if total_success > 0:
        print(f"\n🎯 Next steps:")
        print(f"1. Verify all 2015-2017 files are complete")
        print(f"2. Wait for 2018-2021 generation to complete")
        print(f"3. Update the mobile-messages page with all audio files")
        print(f"4. Test the enhanced audio player with complete dataset")

if __name__ == "__main__":
    main() 