#!/usr/bin/env python3

import os
import csv
import sys
from pathlib import Path
from hume import HumeClient
from hume.tts.types import PostedUtterance, PostedUtteranceVoiceWithId, FormatWav

def generate_2022_audio(csv_file="data/2022-david-love-notes-for-audio.csv", output_dir="public/audio/love-notes", voice_id="e61bbb66-9084-40b7-a4dc-ddd0c62592c9"):
    """
    Generate audio files from 2022 love notes CSV using Hume TTS
    """
    print(f"🎵 Generating 2022 love notes audio...")
    print(f"📁 Input CSV: {csv_file}")
    print(f"📁 Output directory: {output_dir}")
    print(f"🎤 Using voice ID: {voice_id}")
    print("")
    
    # Initialize Hume client
    api_key = os.getenv('HUME_API_KEY', '5sMy54ZASUGzlDJv8f2nOIliS5AqEJmYyhECrA6VqiwZVIFx')
    client = HumeClient(api_key=api_key)
    
    # Create output directory
    Path(output_dir).mkdir(parents=True, exist_ok=True)
    
    # Read CSV file
    with open(csv_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        rows = list(reader)
    
    print(f"📝 Found {len(rows)} love notes in 2022")
    print("")
    
    # Configure voice
    voice = PostedUtteranceVoiceWithId(id=voice_id)
    
    success_count = 0
    error_count = 0
    
    for i, row in enumerate(rows):
        text = row.get('text', '').strip()
        filename = row.get('filename', f'david-2022-love-note-{i+1}.wav')
        
        if not text:
            print(f"⚠️  Skipping row {i+1}: empty text")
            continue
        
        print(f"🎤 Generating audio {i+1}/{len(rows)}: {filename}")
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
    print("🎉 2022 Audio generation complete!")
    print(f"✅ Successfully generated: {success_count} files")
    print(f"❌ Errors: {error_count} files")
    print(f"📁 Output directory: {output_dir}")
    
    return success_count, error_count

def main():
    print("🎵 2022 Love Notes Audio Generator")
    print("=" * 50)
    
    csv_file = "data/2022-david-love-notes-for-audio.csv"
    output_dir = "public/audio/love-notes"
    
    if not os.path.exists(csv_file):
        print(f"❌ CSV file not found: {csv_file}")
        sys.exit(1)
    
    # Check if we want to limit the number of files for testing
    if len(sys.argv) > 1 and sys.argv[1] == "--test":
        print("🧪 Running in test mode (first 3 files only)")
        # Modify the CSV to only process first 3 entries
        with open(csv_file, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            rows = list(reader)
        
        test_csv = "data/2022-david-love-notes-test.csv"
        with open(test_csv, 'w', encoding='utf-8', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=reader.fieldnames)
            writer.writeheader()
            writer.writerows(rows[:3])
        
        csv_file = test_csv
        print(f"📝 Created test CSV with first 3 entries: {test_csv}")
    
    success_count, error_count = generate_2022_audio(csv_file, output_dir)
    
    if success_count > 0:
        print(f"\n🎯 Next steps:")
        print(f"1. Listen to the generated audio files in: {output_dir}")
        print(f"2. If quality is good, run without --test to generate all 78 files")
        print(f"3. Then proceed with other years (2023, 2021, etc.)")

if __name__ == "__main__":
    main() 