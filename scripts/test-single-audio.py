#!/usr/bin/env python3

import os
import base64
from pathlib import Path
from hume import HumeClient
from hume.tts.types import PostedUtterance, PostedUtteranceVoiceWithId, FormatWav

def test_single_audio():
    print("🎤 Testing single audio generation...")
    
    # Initialize Hume client
    api_key = os.getenv('HUME_API_KEY', '5sMy54ZASUGzlDJv8f2nOIliS5AqEJmYyhECrA6VqiwZVIFx')
    client = HumeClient(api_key=api_key)
    
    # Configure voice
    voice = PostedUtteranceVoiceWithId(
        id="e61bbb66-9084-40b7-a4dc-ddd0c62592c9"  # David2 voice
    )
    
    # Test text
    text = "Hello, this is a test of the David2 voice. I love you so much."
    
    try:
        # Generate audio
        utterance = PostedUtterance(
            text=text,
            voice=voice
        )
        
        print(f"🎤 Generating audio for: {text}")
        audio_data = client.tts.synthesize_json(
            utterances=[utterance],
            format=FormatWav()
        )
        
        # Save audio file
        output_dir = "public/audio/love-notes"
        Path(output_dir).mkdir(parents=True, exist_ok=True)
        
        output_path = os.path.join(output_dir, "test-david2-voice.wav")
        audio_bytes = base64.b64decode(audio_data.generations[0].audio)
        
        with open(output_path, 'wb') as f:
            f.write(audio_bytes)
        
        print(f"✅ Generated: test-david2-voice.wav ({audio_data.generations[0].duration:.2f}s)")
        print(f"📁 Saved to: {output_path}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def main():
    success = test_single_audio()
    
    if success:
        print("\n🎉 Single audio test successful!")
        print("🎯 Ready to generate all audio files from CSV")
    else:
        print("\n❌ Single audio test failed")

if __name__ == "__main__":
    main() 