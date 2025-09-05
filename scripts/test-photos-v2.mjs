#!/usr/bin/env node

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

console.log('🧪 Testing Google Photos API - Alternative Methods')
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

async function testAlternativeMethods() {
  try {
    // Test 1: Try with different headers
    console.log('🔍 Test 1: Different headers...')
    const response1 = await fetch('https://photoslibrary.googleapis.com/v1/albums', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    })
    
    console.log(`   Status: ${response1.status}`)
    if (response1.ok) {
      console.log('   ✅ Success with different headers!')
    } else {
      console.log('   ❌ Still failed')
    }
    
    console.log('')
    
    // Test 2: Try a different endpoint
    console.log('🔍 Test 2: /mediaItems endpoint...')
    const response2 = await fetch('https://photoslibrary.googleapis.com/v1/mediaItems', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    })
    
    console.log(`   Status: ${response2.status}`)
    if (response2.ok) {
      console.log('   ✅ Success with mediaItems!')
    } else {
      console.log('   ❌ Still failed')
    }
    
    console.log('')
    
    // Test 3: Try with a POST request
    console.log('🔍 Test 3: POST request to search...')
    const response3 = await fetch('https://photoslibrary.googleapis.com/v1/mediaItems:search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        pageSize: 1
      })
    })
    
    console.log(`   Status: ${response3.status}`)
    if (response3.ok) {
      console.log('   ✅ Success with POST search!')
    } else {
      const error3 = await response3.text()
      console.log(`   ❌ POST search failed: ${error3}`)
    }
    
    console.log('')
    console.log('💡 If all tests fail, the issue might be:')
    console.log('1. The OAuth consent screen scopes are not properly configured')
    console.log('2. The user account has restrictions')
    console.log('3. The API requires additional setup')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

testAlternativeMethods() 