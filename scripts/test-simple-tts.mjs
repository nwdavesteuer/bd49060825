import fs from 'fs'
import path from 'path'

const HUME_API_KEY = process.env.HUME_API_KEY || '5sMy54ZASUGzlDJv8f2nOIliS5AqEJmYyhECrA6VqiwZVIFx'
const HUME_BASE_URL = 'https://api.hume.ai/v0'

async function testSimpleTTS() {
  try {
    console.log('🎤 Testing simple TTS request...')
    console.log(`🔑 Using API key: ${HUME_API_KEY.substring(0, 10)}...`)
    
    const response = await fetch(`${HUME_BASE_URL}/text-to-speech`, {
      method: 'POST',
      headers: {
        'X-Hume-Api-Key': HUME_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: 'Hello, this is a test.',
        model_id: 'eleven_turbo_v2',
        voice_id: 'pNInz6obpgDQGcFmaJgB',
        speed: 1.0,
        stability: 0.5,
        similarity_boost: 0.75,
        style: 0.0,
        use_speaker_boost: true,
      }),
    })

    console.log(`📡 Response status: ${response.status}`)
    
    if (response.ok) {
      const data = await response.json()
      console.log('✅ TTS request successful!')
      console.log(`   Duration: ${data.duration}s`)
      console.log(`   Model: ${data.model_id}`)
      console.log(`   Voice: ${data.voice_id}`)
      
      // Save a test audio file
      const testAudioPath = path.join(process.cwd(), 'data', 'test-audio.wav')
      const audioBuffer = Buffer.from(data.audio, 'base64')
      fs.writeFileSync(testAudioPath, audioBuffer)
      console.log(`💾 Test audio saved to: ${testAudioPath}`)
      
      return true
    } else {
      const errorText = await response.text()
      console.log(`❌ TTS request failed: ${response.status}`)
      console.log(`   Error: ${errorText}`)
      return false
    }
    
  } catch (error) {
    console.error('❌ Error testing TTS:', error)
    return false
  }
}

async function main() {
  const success = await testSimpleTTS()
  
  if (success) {
    console.log('')
    console.log('🎉 API is working! Now let\'s find your David2 voice...')
    console.log('Run: node scripts/find-david2-voice.mjs')
  } else {
    console.log('')
    console.log('❌ API is not working. Please check:')
    console.log('1. Your API key is correct and active')
    console.log('2. You have TTS permissions in your Hume account')
    console.log('3. The API endpoint is accessible')
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main()
} 