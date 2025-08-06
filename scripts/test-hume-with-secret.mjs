#!/usr/bin/env node

console.log('🔍 Testing Hume API with secret key')
console.log('=' * 40)

const HUME_SECRET_KEY = 'aUmPBUKTxozkrSd2dP3wG1vIuiK1kZGRpXjzZ5YSQuX9g5Ke9MFNFe9dz6g97XYI'
const BASE_URL = 'https://api.hume.ai/v0'

console.log('Using Secret Key:', HUME_SECRET_KEY)

async function testAPI() {
  try {
    // Try with secret key instead of API key
    const response = await fetch(`${BASE_URL}/voices`, {
      headers: {
        'X-Hume-Secret-Key': HUME_SECRET_KEY,
      },
    })

    console.log(`Status: ${response.status}`)
    
    if (response.ok) {
      const voices = await response.json()
      console.log('✅ Voices API working with secret key')
      console.log(`Available voices: ${voices.length}`)
    } else {
      console.log('❌ Voices API failed with secret key')
      const error = await response.text()
      console.log('Error:', error)
    }
  } catch (error) {
    console.error('❌ Network error:', error.message)
  }
}

testAPI() 