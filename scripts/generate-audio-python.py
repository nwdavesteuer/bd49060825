#!/usr/bin/env python3

import os
import csv
import sys
from pathlib import Path
from hume import HumeClient
from hume.tts.types import PostedUtterance, PostedUtteranceVoiceWithId, FormatWav

def generate_audio_from_csv(csv_file, output_dir, voice_id="e61bbb66-9084-40b7-a4dc-ddd0c62592c9"):
    """
    Generate audio files from CSV using Hume TTS
    """
    print(f"🎵 Generating audio from CSV: {csv_file}")
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
    
    print(f"📝 Found {len(rows)} entries in CSV")
    print("")
    
    # Configure voice
    voice = PostedUtteranceVoiceWithId(
        id=voice_id
    )
    
    success_count = 0
    error_count = 0
    
    for i, row in enumerate(rows):
        text = row.get('text', '').strip()
        filename = row.get('filename', f'audio-{i+1}.wav')
        
        if not text:
            print(f"⚠️  Skipping row {i+1}: empty text")
            continue
        
        print(f"🎤 Generating audio {i+1}/{len(rows)}: {filename}")
        print(f"   Text: {text[:100]}{'...' if len(text) > 100 else ''}")
        
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
    print("🎉 Audio generation complete!")
    print(f"✅ Successfully generated: {success_count} files")
    print(f"❌ Errors: {error_count} files")
    print(f"📁 Output directory: {output_dir}")
    
    return success_count, error_count

def main():
    csv_file = "data/2015-david-love-notes-for-audio.csv"
    output_dir = "public/audio/love-notes"
    
    if not os.path.exists(csv_file):
        print(f"❌ CSV file not found: {csv_file}")
        sys.exit(1)
    
    success_count, error_count = generate_audio_from_csv(csv_file, output_dir)
    
    if success_count > 0:
        print("")
        print("🎯 Next steps:")
        print("1. Check the generated audio files in the output directory")
        print("2. Test a few files to ensure quality meets your expectations")
        print("3. Update your application to use the new audio files")
    else:
        print("")
        print("❌ No audio files were generated successfully")
        print("🔧 Please check the error messages above")

if __name__ == "__main__":
    main() 