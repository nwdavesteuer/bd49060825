#!/usr/bin/env python3

import os
from hume import HumeClient

def test_hume_simple():
    print("🎤 Testing Hume TTS with simple approach...")
    
    # Get API key from environment
    api_key = os.getenv('HUME_API_KEY', '5sMy54ZASUGzlDJv8f2nOIliS5AqEJmYyhECrA6VqiwZVIFx')
    print(f"🔑 Using API key: {api_key[:10]}...")
    
    try:
        # Initialize the client
        client = HumeClient(api_key=api_key)
        print("✅ Client initialized successfully")
        
        # Test getting available voices
        print("\n🔍 Testing voice list...")
        voices_pager = client.tts.voices.list(provider="HUME_AI")
        voices = list(voices_pager)
        print(f"✅ Found {len(voices)} voices:")
        
        for i, voice in enumerate(voices):
            print(f"   {i+1}. {voice.name} (ID: {voice.id})")
            
            # Look for David2 voice
            if voice.name == 'David2' or 'david2' in voice.name.lower():
                print(f"   🎯 Found David2 voice: {voice.id}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def main():
    success = test_hume_simple()
    
    if success:
        print("\n🎉 Hume TTS is working!")
        print("🎯 Next steps:")
        print("1. Create a Python script to process the CSV")
        print("2. Generate audio files for each love note")
    else:
        print("\n❌ Hume TTS test failed")
        print("🔧 Possible solutions:")
        print("1. Check your API key")
        print("2. Verify TTS permissions in your Hume account")

if __name__ == "__main__":
    main() 