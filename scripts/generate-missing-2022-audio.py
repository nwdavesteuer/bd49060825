#!/usr/bin/env python3

import os
import csv
import sys
from pathlib import Path
from hume import HumeClient
from hume.tts.types import PostedUtterance, PostedUtteranceVoiceWithId, FormatWav

def generate_missing_2022_audio(missing_files, output_dir="public/audio/love-notes", voice_id="e61bbb66-9084-40b7-a4dc-ddd0c62592c9"):
    """
    Generate audio files for missing 2022 love notes
    """
    print(f"🎵 Generating missing 2022 love notes audio...")
    print(f"📁 Output directory: {output_dir}")
    print(f"🎤 Using voice ID: {voice_id}")
    print(f"📝 Missing files: {len(missing_files)}")
    print("")
    
    # Initialize Hume client
    api_key = os.getenv('HUME_API_KEY', '5sMy54ZASUGzlDJv8f2nOIliS5AqEJmYyhECrA6VqiwZVIFx')
    client = HumeClient(api_key=api_key)
    
    # Create output directory
    Path(output_dir).mkdir(parents=True, exist_ok=True)
    
    # Read CSV file to get text for missing files
    csv_file = "data/2022-david-love-notes-for-audio.csv"
    with open(csv_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        rows = {row['filename']: row for row in reader}
    
    # Configure voice
    voice = PostedUtteranceVoiceWithId(id=voice_id)
    
    success_count = 0
    error_count = 0
    
    for filename in missing_files:
        if filename not in rows:
            print(f"⚠️  Skipping {filename}: not found in CSV")
            continue
            
        row = rows[filename]
        text = row.get('text', '').strip()
        
        if not text:
            print(f"⚠️  Skipping {filename}: empty text")
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
            output_path = os.path.join(output_dir, filename)
            import base64
            audio_bytes = base64.b64decode(audio_data.generations[0].audio)
            with open(output_path, 'wb') as f:
                f.write(audio_bytes)
            
            print(f"   ✅ Generated: {filename} ({audio_data.generations[0].duration:.2f}s)")
            success_count += 1
            
            # Add a small delay to avoid rate limiting
            import time
            time.sleep(0.1)
            
        except Exception as e:
            print(f"   ❌ Error: {e}")
            error_count += 1
    
    print("")
    print("🎉 Missing 2022 Audio generation complete!")
    print(f"✅ Successfully generated: {success_count} files")
    print(f"❌ Errors: {error_count} files")
    print(f"📁 Output directory: {output_dir}")
    
    return success_count, error_count

def main():
    print("🎵 Missing 2022 Love Notes Audio Generator")
    print("=" * 50)
    
    # Missing files identified earlier
    missing_files = [
        'david-2022-love-note-42043.wav',
        'david-2022-love-note-46101.wav', 
        'david-2022-love-note-47449.wav'
    ]
    
    output_dir = "public/audio/love-notes"
    
    success_count, error_count = generate_missing_2022_audio(missing_files, output_dir)
    
    if success_count > 0:
        print(f"\n🎯 Next steps:")
        print(f"1. Verify all 2022 files are complete")
        print(f"2. Move on to generating missing 2023 and 2024 files")
        print(f"3. Then work on 2015-2021 files")

if __name__ == "__main__":
    main() 