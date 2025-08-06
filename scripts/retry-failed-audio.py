#!/usr/bin/env python3

import os
import csv
import sys
import time
from pathlib import Path
from hume import HumeClient
from hume.tts.types import PostedUtterance, PostedUtteranceVoiceWithId, FormatWav

def retry_failed_audio(filename, output_dir="public/audio/love-notes", voice_id="e61bbb66-9084-40b7-a4dc-ddd0c62592c9", max_retries=3):
    """
    Retry generating a failed audio file with better error handling
    """
    print(f"🎵 Retrying failed audio generation: {filename}")
    print(f"📁 Output directory: {output_dir}")
    print(f"🎤 Using voice ID: {voice_id}")
    print("")
    
    # Initialize Hume client
    api_key = os.getenv('HUME_API_KEY', '5sMy54ZASUGzlDJv8f2nOIliS5AqEJmYyhECrA6VqiwZVIFx')
    client = HumeClient(api_key=api_key)
    
    # Create output directory
    Path(output_dir).mkdir(parents=True, exist_ok=True)
    
    # Extract year from filename
    year = filename.split('-')[1]
    csv_file = f"data/{year}-david-love-notes-for-audio.csv"
    
    # Read CSV file to get text
    with open(csv_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        rows = {row['filename']: row for row in reader}
    
    if filename not in rows:
        print(f"❌ File {filename} not found in CSV")
        return False
    
    row = rows[filename]
    text = row.get('text', '').strip()
    
    if not text:
        print(f"❌ Empty text for {filename}")
        return False
    
    print(f"🎤 Generating audio: {filename}")
    print(f"   📊 Text length: {len(text)} characters, {len(text.split())} words")
    print(f"   📅 Date: {row.get('date', 'Unknown')}")
    print(f"   📝 Preview: {text[:100]}...")
    
    # Configure voice
    voice = PostedUtteranceVoiceWithId(id=voice_id)
    
    for attempt in range(max_retries):
        try:
            print(f"   🔄 Attempt {attempt + 1}/{max_retries}...")
            
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
            return True
            
        except Exception as e:
            print(f"   ❌ Error (attempt {attempt + 1}): {e}")
            if attempt < max_retries - 1:
                wait_time = (2 ** attempt) * 5  # Exponential backoff: 5s, 10s, 20s
                print(f"   ⏳ Waiting {wait_time}s before retry...")
                time.sleep(wait_time)
            else:
                print(f"   ❌ Failed after {max_retries} attempts")
                return False
    
    return False

def main():
    print("🎵 Failed Audio Retry Generator")
    print("=" * 50)
    
    # Failed files to retry
    failed_files = [
        'david-2024-love-note-77950.wav'
    ]
    
    output_dir = "public/audio/love-notes"
    
    success_count = 0
    error_count = 0
    
    for filename in failed_files:
        if retry_failed_audio(filename, output_dir):
            success_count += 1
        else:
            error_count += 1
    
    print("")
    print("🎉 Retry generation complete!")
    print(f"✅ Successfully generated: {success_count} files")
    print(f"❌ Errors: {error_count} files")
    
    if success_count > 0:
        print(f"\n🎯 Next steps:")
        print(f"1. Verify all 2022-2024 files are complete")
        print(f"2. Move on to generating 2015-2021 files")
        print(f"3. Continue improving the mobile-messages page")

if __name__ == "__main__":
    main() 