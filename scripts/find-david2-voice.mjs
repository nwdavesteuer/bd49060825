import fs from 'fs'
import path from 'path'

// Hume AI API configuration
const HUME_API_KEY = process.env.HUME_API_KEY || '5sMy54ZASUGzlDJv8f2nOIliS5AqEJmYyhECrA6VqiwZVIFx'
const HUME_BASE_URL = 'https://api.hume.ai/v0'

async function getAvailableVoices() {
  const response = await fetch(`${HUME_BASE_URL}/voices`, {
    headers: {
      'X-Hume-Api-Key': HUME_API_KEY,
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch voices: ${response.status}`)
  }

  return response.json()
}

async function findDavid2Voice() {
  try {
    console.log('🔍 Searching for David2 voice in your Hume AI account...')
    
    const voices = await getAvailableVoices()
    
    console.log(`📝 Found ${voices.length} available voices:`)
    console.log('')
    
    let david2Voice = null
    
    voices.forEach((voice, index) => {
      console.log(`${index + 1}. Name: ${voice.name || 'Unnamed'}`)
      console.log(`   ID: ${voice.voice_id}`)
      console.log(`   Model: ${voice.model_id || 'Unknown'}`)
      console.log(`   Type: ${voice.voice_type || 'Unknown'}`)
      console.log('')
      
      // Check if this is the David2 voice
      if (voice.name === 'David2' || voice.voice_id.includes('david2') || voice.voice_id.includes('David2')) {
        david2Voice = voice
      }
    })
    
    if (david2Voice) {
      console.log('✅ Found David2 voice!')
      console.log(`   Name: ${david2Voice.name}`)
      console.log(`   ID: ${david2Voice.voice_id}`)
      console.log(`   Model: ${david2Voice.model_id}`)
      console.log('')
      console.log('📋 Copy this voice ID to use in your audio generation script:')
      console.log(`   ${david2Voice.voice_id}`)
      
      // Save the voice ID to a file for easy access
      const voiceConfig = {
        david2_voice_id: david2Voice.voice_id,
        david2_name: david2Voice.name,
        david2_model: david2Voice.model_id,
        found_at: new Date().toISOString()
      }
      
      const configPath = path.join(process.cwd(), 'data', 'david2-voice-config.json')
      fs.writeFileSync(configPath, JSON.stringify(voiceConfig, null, 2))
      console.log(`💾 Voice configuration saved to: ${configPath}`)
      
      return david2Voice.voice_id
    } else {
      console.log('❌ David2 voice not found in the available voices.')
      console.log('')
      console.log('🔍 Please check:')
      console.log('1. That the voice is properly uploaded to your Hume AI account')
      console.log('2. That the voice name is exactly "David2"')
      console.log('3. That your API key has access to this voice')
      console.log('')
      console.log('📝 Available voice names:')
      voices.forEach(voice => {
        console.log(`   - ${voice.name || 'Unnamed'}`)
      })
      
      return null
    }
    
  } catch (error) {
    console.error('❌ Error finding David2 voice:', error)
    throw error
  }
}

// Main execution
async function main() {
  try {
    const david2VoiceId = await findDavid2Voice()
    
    if (david2VoiceId) {
      console.log('')
      console.log('🎯 Next steps:')
      console.log('1. Use the voice ID above in your audio generation script')
      console.log('2. Run: node scripts/generate-audio-from-csv.mjs')
      console.log('3. The script will automatically use David2 voice')
    }
    
  } catch (error) {
    console.error('❌ Script failed:', error)
    process.exit(1)
  }
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}

export { findDavid2Voice, getAvailableVoices } 