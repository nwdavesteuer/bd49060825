import fs from 'fs'
import path from 'path'

const HUME_API_KEY = process.env.HUME_API_KEY || '5sMy54ZASUGzlDJv8f2nOIliS5AqEJmYyhECrA6VqiwZVIFx'
const HUME_SECRET_KEY = process.env.HUME_SECRET_KEY || 'aUmPBUKTxozkrSd2dP3wG1vIuiK1kZGRpXjzZ5YSQuX9g5Ke9MFNFe9dz6g97XYI'
const HUME_BASE_URL = 'https://api.hume.ai/v0'

async function testWithSecretKey() {
  try {
    console.log('🔑 Testing Hume AI with both API key and secret key...')
    console.log(`API Key: ${HUME_API_KEY.substring(0, 10)}...`)
    console.log(`Secret Key: ${HUME_SECRET_KEY.substring(0, 10)}...`)
    console.log('')
    
    // Try different authentication methods
    const authMethods = [
      {
        name: 'API Key Only',
        headers: {
          'X-Hume-Api-Key': HUME_API_KEY,
        }
      },
      {
        name: 'API Key + Secret',
        headers: {
          'X-Hume-Api-Key': HUME_API_KEY,
          'X-Hume-Secret-Key': HUME_SECRET_KEY,
        }
      },
      {
        name: 'Authorization Bearer',
        headers: {
          'Authorization': `Bearer ${HUME_API_KEY}`,
        }
      },
      {
        name: 'API Key + Authorization',
        headers: {
          'X-Hume-Api-Key': HUME_API_KEY,
          'Authorization': `Bearer ${HUME_SECRET_KEY}`,
        }
      }
    ]
    
    for (const method of authMethods) {
      console.log(`🔍 Testing: ${method.name}`)
      
      try {
        const response = await fetch(`${HUME_BASE_URL}/voices`, {
          headers: {
            ...method.headers,
            'Content-Type': 'application/json',
          },
        })
        
        console.log(`   Status: ${response.status}`)
        
        if (response.ok) {
          const voices = await response.json()
          console.log(`   ✅ Success! Found ${voices.length} voices`)
          
          // Look for David2 voice
          const david2Voice = voices.find(voice => 
            voice.name === 'David2' || 
            voice.voice_id.includes('david2') || 
            voice.voice_id.includes('David2')
          )
          
          if (david2Voice) {
            console.log(`   🎯 Found David2 voice: ${david2Voice.voice_id}`)
          }
          
          // Save working configuration
          const config = {
            working_auth_method: method.name,
            working_headers: method.headers,
            david2_voice_id: david2Voice?.voice_id,
            found_at: new Date().toISOString()
          }
          
          const configPath = path.join(process.cwd(), 'data', 'working-hume-config.json')
          fs.writeFileSync(configPath, JSON.stringify(config, null, 2))
          console.log(`   💾 Working config saved to: ${configPath}`)
          
          return { success: true, method: method.name, voices: voices }
        } else {
          const errorText = await response.text()
          console.log(`   ❌ Failed: ${errorText}`)
        }
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`)
      }
      
      console.log('')
    }
    
    console.log('❌ No authentication method worked')
    return { success: false }
    
  } catch (error) {
    console.error('❌ Error testing authentication:', error)
    return { success: false }
  }
}

async function main() {
  const result = await testWithSecretKey()
  
  if (result.success) {
    console.log('')
    console.log('🎉 Found working authentication method!')
    console.log(`   Method: ${result.method}`)
    console.log('')
    console.log('🎯 Next steps:')
    console.log('1. Update the audio generation script with the working auth method')
    console.log('2. Run: node scripts/generate-audio-from-csv.mjs')
  } else {
    console.log('')
    console.log('❌ No authentication method worked')
    console.log('')
    console.log('🔧 Possible solutions:')
    console.log('1. Check if the API endpoint has changed')
    console.log('2. Verify your Hume AI account has TTS permissions')
    console.log('3. Try accessing the Hume AI dashboard to check API status')
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main()
} 