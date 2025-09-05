import fs from 'fs'
import path from 'path'

const HUME_API_KEY = process.env.HUME_API_KEY || '5sMy54ZASUGzlDJv8f2nOIliS5AqEJmYyhECrA6VqiwZVIFx'
const HUME_SECRET_KEY = process.env.HUME_SECRET_KEY || 'aUmPBUKTxozkrSd2dP3wG1vIuiK1kZGRpXjzZ5YSQuX9g5Ke9MFNFe9dz6g97XYI'

async function testEndpoint(baseUrl, endpoint, method = 'GET', body = null) {
  try {
    const url = `${baseUrl}${endpoint}`
    console.log(`🔍 Testing: ${method} ${url}`)
    
    const options = {
      method,
      headers: {
        'X-Hume-Api-Key': HUME_API_KEY,
        'Content-Type': 'application/json',
      },
    }
    
    if (body) {
      options.body = JSON.stringify(body)
    }
    
    const response = await fetch(url, options)
    console.log(`   Status: ${response.status}`)
    
    if (response.ok) {
      const data = await response.json()
      console.log(`   ✅ Success!`)
      return { success: true, data }
    } else {
      const errorText = await response.text()
      console.log(`   ❌ Failed: ${errorText}`)
      return { success: false, error: errorText }
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`)
    return { success: false, error: error.message }
  }
}

async function checkEndpoints() {
  console.log('🔍 Testing different Hume AI API endpoints...')
  console.log('')
  
  const baseUrls = [
    'https://api.hume.ai/v0',
    'https://api.hume.ai/v1', 
    'https://api.hume.ai',
    'https://api.hume.ai/api',
  ]
  
  const testEndpoints = [
    '/voices',
    '/text-to-speech',
    '/models',
    '/health',
    '/status',
    '/api/voices',
    '/api/text-to-speech',
  ]
  
  for (const baseUrl of baseUrls) {
    console.log(`\n📡 Testing base URL: ${baseUrl}`)
    
    for (const endpoint of testEndpoints) {
      const result = await testEndpoint(baseUrl, endpoint)
      if (result.success) {
        console.log(`   🎯 Found working endpoint: ${endpoint}`)
        
        // Save working configuration
        const config = {
          working_base_url: baseUrl,
          working_endpoint: endpoint,
          api_key: HUME_API_KEY,
          found_at: new Date().toISOString()
        }
        
        const configPath = path.join(process.cwd(), 'data', 'working-endpoint-config.json')
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2))
        console.log(`   💾 Working config saved to: ${configPath}`)
        
        return { success: true, baseUrl, endpoint }
      }
    }
  }
  
  console.log('\n❌ No working endpoints found')
  return { success: false }
}

async function main() {
  const result = await checkEndpoints()
  
  if (result.success) {
    console.log('')
    console.log('🎉 Found working endpoint!')
    console.log(`   Base URL: ${result.baseUrl}`)
    console.log(`   Endpoint: ${result.endpoint}`)
    console.log('')
    console.log('🎯 Next steps:')
    console.log('1. Update the audio generation script with the working endpoint')
    console.log('2. Run: node scripts/generate-audio-from-csv.mjs')
  } else {
    console.log('')
    console.log('❌ No working endpoints found')
    console.log('')
    console.log('🔧 Possible solutions:')
    console.log('1. Check if you\'re using the correct Hume AI service')
    console.log('2. Verify your API keys are for the right service')
    console.log('3. Check the Hume AI documentation for the correct endpoints')
    console.log('4. Try accessing the Hume AI dashboard to verify your account')
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main()
} 