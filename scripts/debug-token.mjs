#!/usr/bin/env node

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

console.log('🔍 Debugging Token Authentication')
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
console.log(`📊 Token length: ${accessToken.length} characters`)
console.log(`📊 Token starts with: ${accessToken.substring(0, 20)}...`)
console.log('')

async function debugToken() {
  try {
    // Test with explicit Authorization header
    console.log('🔍 Testing with explicit Authorization header...')
    
    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
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
    
    if (response.ok) {
      console.log('✅ SUCCESS! Token is working!')
    } else {
      console.log('❌ Token authentication failed')
      console.log('')
      console.log('🔧 Possible issues:')
      console.log('1. Token might be malformed')
      console.log('2. Token might be expired')
      console.log('3. There might be an issue with the OAuth flow')
      console.log('4. The client credentials might be incorrect')
    }
    
  } catch (error) {
    console.error('❌ Network error:', error.message)
  }
}

debugToken() 