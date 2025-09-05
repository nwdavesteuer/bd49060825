#!/usr/bin/env python3

import os
import sys
from hume import HumeClient
from hume.models.config import TTSConfig

def test_hume_tts():
    print("🎤 Testing Hume TTS with Python client...")
    
    # Get API key from environment
    api_key = os.getenv('HUME_API_KEY', '5sMy54ZASUGzlDJv8f2nOIliS5AqEJmYyhECrA6VqiwZVIFx')
    print(f"🔑 Using API key: {api_key[:10]}...")
    
    try:
        # Initialize the client
        client = HumeClient(api_key)
        
        print("✅ Client initialized successfully")
        
        # Test getting available voices
        print("\n🔍 Testing voice list...")
        voices = client.tts.list_voices()
        print(f"✅ Found {len(voices)} voices:")
        
        for i, voice in enumerate(voices):
            print(f"   {i+1}. {voice.name} (ID: {voice.voice_id})")
            
            # Look for David2 voice
            if voice.name == 'David2' or 'david2' in voice.name.lower():
                print(f"   🎯 Found David2 voice: {voice.voice_id}")
        
        # Test TTS generation
        print("\n🎤 Testing TTS generation...")
        config = TTSConfig(
            voice_id=voices[0].voice_id if voices else "pNInz6obpgDQGcFmaJgB",
            model_id="eleven_turbo_v2"
        )
        
        text = "Hello, this is a test of the Hume TTS API."
        print(f"   Text: {text}")
        
        # Generate audio
        audio_data = client.tts.generate_text(text, config)
        
        print(f"✅ TTS generation successful!")
        print(f"   Duration: {audio_data.duration} seconds")
        
        # Save test audio
        with open("data/test-tts-output.wav", "wb") as f:
            f.write(audio_data.audio)
        
        print("💾 Test audio saved to: data/test-tts-output.wav")
        
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def main():
    success = test_hume_tts()
    
    if success:
        print("\n🎉 Hume TTS is working!")
        print("🎯 Next steps:")
        print("1. Update the audio generation script to use the Python client")
        print("2. Run the CSV processing script")
    else:
        print("\n❌ Hume TTS test failed")
        print("🔧 Possible solutions:")
        print("1. Check your API key")
        print("2. Verify TTS permissions in your Hume account")
        print("3. Check the Hume AI documentation")

if __name__ == "__main__":
    main() 