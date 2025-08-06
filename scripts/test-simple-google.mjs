#!/usr/bin/env node

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

console.log('🧪 Testing Basic Google API Access')
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

async function testBasicGoogleAPIs() {
  try {
    // Test 1: Google User Info API (should work with any valid token)
    console.log('🔍 Test 1: Google User Info API...')
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    })
    
    console.log(`   Status: ${userResponse.status}`)
    if (userResponse.ok) {
      const userData = await userResponse.json()
      console.log(`   ✅ SUCCESS! User: ${userData.email}`)
    } else {
      const error = await userResponse.text()
      console.log(`   ❌ Failed: ${error}`)
    }
    
    console.log('')
    
    // Test 2: Google Drive API (if we have Drive scope)
    console.log('🔍 Test 2: Google Drive API...')
    const driveResponse = await fetch('https://www.googleapis.com/drive/v3/about', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    })
    
    console.log(`   Status: ${driveResponse.status}`)
    if (driveResponse.ok) {
      console.log('   ✅ SUCCESS! Drive API works!')
    } else {
      console.log('   ❌ Drive API failed (expected - no Drive scope)')
    }
    
    console.log('')
    console.log('💡 If User Info API works, our authentication is fine.')
    console.log('💡 The issue is specific to Google Photos Library API.')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

testBasicGoogleAPIs() 