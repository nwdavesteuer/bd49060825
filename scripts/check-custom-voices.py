#!/usr/bin/env python3

import os
from hume import HumeClient

def check_custom_voices():
    print("🔍 Checking for custom voices...")
    
    # Get API key from environment
    api_key = os.getenv('HUME_API_KEY', '5sMy54ZASUGzlDJv8f2nOIliS5AqEJmYyhECrA6VqiwZVIFx')
    print(f"🔑 Using API key: {api_key[:10]}...")
    
    try:
        # Initialize the client
        client = HumeClient(api_key=api_key)
        print("✅ Client initialized successfully")
        
        # Check custom voices
        print("\n🔍 Checking custom voices...")
        custom_voices = list(client.tts.voices.list(provider="CUSTOM_VOICE"))
        print(f"✅ Found {len(custom_voices)} custom voices:")
        
        for i, voice in enumerate(custom_voices):
            print(f"   {i+1}. {voice.name} (ID: {voice.id})")
            
            # Look for David2 voice
            if voice.name == 'David2' or 'david2' in voice.name.lower():
                print(f"   🎯 Found David2 voice: {voice.id}")
        
        # Also check Hume AI voices for David2
        print("\n🔍 Checking Hume AI voices for David2...")
        hume_voices = list(client.tts.voices.list(provider="HUME_AI"))
        
        david2_found = False
        for voice in hume_voices:
            if voice.name == 'David2' or 'david2' in voice.name.lower():
                print(f"   🎯 Found David2 voice: {voice.id}")
                david2_found = True
        
        if not david2_found:
            print("   ❌ David2 voice not found in any provider")
            print("\n📋 Available voice names containing 'david':")
            all_voices = custom_voices + hume_voices
            for voice in all_voices:
                if 'david' in voice.name.lower():
                    print(f"   - {voice.name} (ID: {voice.id})")
        
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def main():
    success = check_custom_voices()
    
    if success:
        print("\n🎉 Voice check complete!")
    else:
        print("\n❌ Voice check failed")

if __name__ == "__main__":
    main() 