#!/usr/bin/env node

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

console.log('🔍 Debugging Google Photos API Access')
console.log('')

// Load token
const tokenFile = path.join(__dirname, '../data/google-photos-token.json')
if (!fs.existsSync(tokenFile)) {
  console.log('❌ No token file found')
  process.exit(1)
}

const tokenData = JSON.parse(fs.readFileSync(tokenFile, 'utf8'))
const accessToken = tokenData.access_token

console.log('✅ Found access token')
console.log('')

async function debugAPI() {
  try {
    console.log('🔍 Testing with detailed error reporting...')
    
    // Test the API with detailed error info
    const response = await fetch('https://photoslibrary.googleapis.com/v1/albums', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    })
    
    console.log(`📊 Response Status: ${response.status}`)
    console.log(`📊 Response Status Text: ${response.statusText}`)
    console.log(`📊 Response Headers:`)
    for (const [key, value] of response.headers.entries()) {
      console.log(`   ${key}: ${value}`)
    }
    
    const responseText = await response.text()
    console.log(`📊 Response Body: ${responseText}`)
    
    if (!response.ok) {
      console.log('')
      console.log('🔧 Troubleshooting Steps:')
      console.log('')
      console.log('1. Check OAuth Consent Screen:')
      console.log('   - Go to: https://console.cloud.google.com/apis/credentials/consent?project=bd060825')
      console.log('   - Make sure "Google Photos Library API" is listed in the scopes')
      console.log('   - If not, add: https://www.googleapis.com/auth/photoslibrary')
      console.log('')
      console.log('2. Check API Enablement:')
      console.log('   - Go to: https://console.cloud.google.com/apis/library/photoslibrary.googleapis.com?project=bd060825')
      console.log('   - Make sure the API is enabled')
      console.log('')
      console.log('3. Check Credentials:')
      console.log('   - Go to: https://console.cloud.google.com/apis/credentials?project=bd060825')
      console.log('   - Verify your OAuth 2.0 client ID is configured correctly')
      console.log('')
      console.log('4. Test with a different endpoint:')
      console.log('   - Try: https://photoslibrary.googleapis.com/v1/sharedAlbums')
      console.log('   - Or: https://photoslibrary.googleapis.com/v1/mediaItems')
    } else {
      console.log('✅ API is working!')
    }
    
  } catch (error) {
    console.error('❌ Network error:', error.message)
  }
}

debugAPI() 