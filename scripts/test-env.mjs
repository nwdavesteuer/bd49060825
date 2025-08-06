#!/usr/bin/env node

console.log('🔍 Testing environment variables')
console.log('=' * 40)

console.log('HUME_API_KEY:', process.env.HUME_API_KEY)
console.log('HUME_SECRET_KEY:', process.env.HUME_SECRET_KEY)
console.log('AUTH_TRUST_HOST:', process.env.AUTH_TRUST_HOST)

// Test direct API call with the key
const HUME_API_KEY = process.env.HUME_API_KEY || '5sMy54ZASUGzlDJv8f2nOIliS5AqEJmYyhECrA6VqiwZVIFx'
const BASE_URL = 'https://api.hume.ai/v0'

console.log('\n🎤 Testing Hume API directly...')
console.log('Using API Key:', HUME_API_KEY)

async function testAPI() {
  try {
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
    } else {
      console.log('❌ Voices API failed')
      const error = await response.text()
      console.log('Error:', error)
    }
  } catch (error) {
    console.error('❌ Network error:', error.message)
  }
}

testAPI() 