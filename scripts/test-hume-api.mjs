import fs from 'fs'
import path from 'path'

// Test different API key sources
const API_KEYS = [
  process.env.HUME_API_KEY,
  '5sMy54ZASUGzlDJv8f2nOIliS5AqEJmYyhECrA6VqiwZVIFx', // Fallback key
]

const HUME_BASE_URL = 'https://api.hume.ai/v0'

async function testAPIKey(apiKey, keyName) {
  if (!apiKey) {
    console.log(`❌ ${keyName}: No API key provided`)
    return false
  }

  try {
    console.log(`🔑 Testing ${keyName}...`)
    
    const response = await fetch(`${HUME_BASE_URL}/voices`, {
      headers: {
        'X-Hume-Api-Key': apiKey,
      },
    })

    if (response.ok) {
      const voices = await response.json()
      console.log(`✅ ${keyName}: API key is valid!`)
      console.log(`   Found ${voices.length} voices`)
      
      // Look for David2 voice
      const david2Voice = voices.find(voice => 
        voice.name === 'David2' || 
        voice.voice_id.includes('david2') || 
        voice.voice_id.includes('David2')
      )
      
      if (david2Voice) {
        console.log(`🎯 Found David2 voice: ${david2Voice.voice_id}`)
        
        // Save the working configuration
        const config = {
          working_api_key: apiKey,
          david2_voice_id: david2Voice.voice_id,
          david2_name: david2Voice.name,
          found_at: new Date().toISOString()
        }
        
        const configPath = path.join(process.cwd(), 'data', 'hume-config.json')
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2))
        console.log(`💾 Configuration saved to: ${configPath}`)
        
        return { success: true, voiceId: david2Voice.voice_id }
      } else {
        console.log(`⚠️  David2 voice not found in available voices`)
        console.log('Available voices:')
        voices.forEach(voice => {
          console.log(`   - ${voice.name || 'Unnamed'} (${voice.voice_id})`)
        })
        return { success: true, voiceId: null }
      }
    } else {
      console.log(`❌ ${keyName}: API key is invalid (${response.status})`)
      return false
    }
  } catch (error) {
    console.log(`❌ ${keyName}: Error testing API key - ${error.message}`)
    return false
  }
}

async function main() {
  console.log('🔍 Testing Hume AI API connection...')
  console.log('')
  
  let workingKey = null
  let david2VoiceId = null
  
  for (const [index, apiKey] of API_KEYS.entries()) {
    const keyName = index === 0 ? 'Environment Variable (HUME_API_KEY)' : 'Fallback Key'
    const result = await testAPIKey(apiKey, keyName)
    
    if (result && result.success) {
      workingKey = apiKey
      david2VoiceId = result.voiceId
      break
    }
    
    console.log('')
  }
  
  console.log('')
  console.log('📋 Summary:')
  
  if (workingKey) {
    console.log('✅ Found working API key')
    if (david2VoiceId) {
      console.log(`✅ Found David2 voice: ${david2VoiceId}`)
      console.log('')
      console.log('🎯 Next steps:')
      console.log('1. Run: node scripts/generate-audio-from-csv.mjs')
      console.log('2. The script will automatically use your David2 voice')
    } else {
      console.log('⚠️  David2 voice not found')
      console.log('')
      console.log('🔍 To find your David2 voice:')
      console.log('1. Go to https://app.hume.ai/')
      console.log('2. Check your voice library')
      console.log('3. Make sure the voice is named "David2"')
    }
  } else {
    console.log('❌ No working API key found')
    console.log('')
    console.log('🔧 To fix this:')
    console.log('1. Go to https://app.hume.ai/')
    console.log('2. Get your API key from the settings')
    console.log('3. Set it as an environment variable:')
    console.log('   export HUME_API_KEY="your-api-key-here"')
    console.log('4. Or create a .env file with:')
    console.log('   HUME_API_KEY=your-api-key-here')
  }
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}

export { testAPIKey } 