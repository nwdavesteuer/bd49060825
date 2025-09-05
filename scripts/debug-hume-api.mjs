#!/usr/bin/env node

console.log('🔍 Debugging Hume API...')

const HUME_API_KEY = '5sMy54ZASUGzlDJv8f2nOIliS5AqEJmYyhECrA6VqiwZVIFx'
const BASE_URL = 'https://api.hume.ai/v0'

async function testHumeAPI() {
  try {
    console.log('📡 Testing Hume API connection...')
    
    // Test 1: Check if we can reach the API
    const response = await fetch(`${BASE_URL}/voices`, {
      headers: {
        'X-Hume-Api-Key': HUME_API_KEY,
      },
    })

    console.log(`Status: ${response.status}`)
    
    if (response.ok) {
      const voices = await response.json()
      console.log('✅ Voices API working')
      console.log(`Available voices: ${voices.length}`)
      console.log('First few voices:', voices.slice(0, 3).map(v => ({ id: v.voice_id, name: v.name })))
    } else {
      console.log('❌ Voices API failed')
      const error = await response.text()
      console.log('Error:', error)
    }

    // Test 2: Try a simple TTS request
    console.log('\n🎤 Testing TTS API...')
    
    const ttsResponse = await fetch(`${BASE_URL}/text-to-speech`, {
      method: 'POST',
      headers: {
        'X-Hume-Api-Key': HUME_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: 'Hello world, this is a test.',
        model_id: 'eleven_turbo_v2',
        voice_id: 'pNInz6obpgDQGcFmaJgB',
        speed: 1.0,
        stability: 0.5,
        similarity_boost: 0.75,
        style: 0.0,
        use_speaker_boost: true,
      }),
    })

    console.log(`TTS Status: ${ttsResponse.status}`)
    
    if (ttsResponse.ok) {
      const result = await ttsResponse.json()
      console.log('✅ TTS API working')
      console.log(`Audio length: ${result.audio ? result.audio.length : 0} characters`)
      console.log(`Duration: ${result.duration}s`)
    } else {
      console.log('❌ TTS API failed')
      const error = await ttsResponse.text()
      console.log('Error:', error)
    }

  } catch (error) {
    console.error('❌ Network error:', error.message)
  }
}

testHumeAPI().catch(console.error) 