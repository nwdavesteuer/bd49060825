#!/usr/bin/env python3

import os
import csv
import sys
from pathlib import Path
from hume import HumeClient
from hume.tts.types import PostedUtterance, PostedUtteranceVoiceWithId, FormatWav

def find_david5_voice():
    """
    Find the David5 voice ID and test it with a sample
    """
    print("🔍 Finding David5 voice...")
    
    # Initialize Hume client
    api_key = os.getenv('HUME_API_KEY', '5sMy54ZASUGzlDJv8f2nOIliS5AqEJmYyhECrA6VqiwZVIFx')
    client = HumeClient(api_key=api_key)
    
    try:
        # Get available voices - try different methods
        voices = []
        try:
            voices = client.tts.list_voices()
        except AttributeError:
            try:
                voices = client.tts.voices()
            except AttributeError:
                print("⚠️  Could not list voices directly, testing with known voice ID")
                # Test with the current working voice ID
                test_david5_voice("e61bbb66-9084-40b7-a4dc-ddd0c62592c9")
                return "e61bbb66-9084-40b7-a4dc-ddd0c62592c9"
        
        print(f"📝 Found {len(voices)} voices")
        
        # Look for David5 voice
        david5_voice = None
        for voice in voices:
            if hasattr(voice, 'name') and voice.name and 'david5' in voice.name.lower():
                david5_voice = voice
                break
        
        if david5_voice:
            print(f"✅ Found David5 voice!")
            print(f"   Name: {david5_voice.name}")
            print(f"   ID: {david5_voice.id}")
            print(f"   Model: {david5_voice.model_id}")
            
            # Test with a sample from 2022
            test_david5_voice(david5_voice.id)
            
            return david5_voice.id
        else:
            print("❌ David5 voice not found")
            print("Available voices:")
            for voice in voices:
                voice_name = getattr(voice, 'name', 'Unnamed')
                voice_id = getattr(voice, 'id', 'Unknown')
                print(f"   - {voice_name} (ID: {voice_id})")
            
            # Try the current working voice ID
            print(f"\n🔄 Testing current working voice ID: e61bbb66-9084-40b7-a4dc-ddd0c62592c9")
            test_david5_voice("e61bbb66-9084-40b7-a4dc-ddd0c62592c9")
            
            return "e61bbb66-9084-40b7-a4dc-ddd0c62592c9"
            
    except Exception as e:
        print(f"❌ Error finding voices: {e}")
        # Fallback to testing the known working voice ID
        print(f"\n🔄 Testing fallback voice ID: e61bbb66-9084-40b7-a4dc-ddd0c62592c9")
        test_david5_voice("e61bbb66-9084-40b7-a4dc-ddd0c62592c9")
        return "e61bbb66-9084-40b7-a4dc-ddd0c62592c9"

def test_david5_voice(voice_id):
    """
    Test the David5 voice with a sample from 2022 love notes
    """
    print(f"\n🎤 Testing voice ID: {voice_id}")
    
    # Initialize Hume client
    api_key = os.getenv('HUME_API_KEY', '5sMy54ZASUGzlDJv8f2nOIliS5AqEJmYyhECrA6VqiwZVIFx')
    client = HumeClient(api_key=api_key)
    
    # Read a sample from 2022
    csv_file = "data/2022-david-love-notes-for-audio.csv"
    with open(csv_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        rows = list(reader)
    
    if rows:
        sample = rows[0]  # First note from 2022
        text = sample['text']
        filename = sample['filename']
        
        print(f"📝 Testing with text: {text[:100]}...")
        print(f"📊 Text length: {len(text)} characters")
        print(f"📊 Word count: {len(text.split())} words")
        
        try:
            # Configure voice
            voice = PostedUtteranceVoiceWithId(id=voice_id)
            
            # Generate audio
            utterance = PostedUtterance(
                text=text,
                voice=voice
            )
            
            audio_data = client.tts.synthesize_json(
                utterances=[utterance],
                format=FormatWav()
            )
            
            # Save test audio file
            output_dir = "public/audio/love-notes"
            Path(output_dir).mkdir(parents=True, exist_ok=True)
            
            output_path = os.path.join(output_dir, f"test-david5-{filename}")
            import base64
            audio_bytes = base64.b64decode(audio_data.generations[0].audio)
            with open(output_path, 'wb') as f:
                f.write(audio_bytes)
            
            print(f"✅ Test audio generated: {output_path}")
            print(f"⏱️  Duration: {audio_data.generations[0].duration:.2f}s")
            print(f"🎤 Voice ID used: {voice_id}")
            
            return True
            
        except Exception as e:
            print(f"❌ Error generating test audio: {e}")
            return False
    
    return False

def main():
    print("🎵 David5 Voice Finder and Tester")
    print("=" * 50)
    
    voice_id = find_david5_voice()
    
    if voice_id:
        print(f"\n🎯 Recommended voice ID for David5: {voice_id}")
        print("\n📋 To use this voice ID:")
        print("1. Update scripts/generate-audio-python.py")
        print("2. Change the voice_id parameter to:", voice_id)
        print("3. Run: python3 scripts/generate-audio-python.py data/2022-david-love-notes-for-audio.csv public/audio/love-notes")
    else:
        print("\n❌ Could not find or test David5 voice")

if __name__ == "__main__":
    main() 