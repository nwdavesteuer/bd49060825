#!/usr/bin/env node

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

console.log('🧪 Testing Google Photos API Access')
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

// Test basic API access
async function testAPI() {
  try {
    console.log('🔍 Testing basic API access...')
    
    // First, try to get user info
    const userResponse = await fetch('https://photoslibrary.googleapis.com/v1/albums', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    })
    
    console.log(`📊 Response status: ${userResponse.status}`)
    console.log(`📊 Response headers:`, Object.fromEntries(userResponse.headers.entries()))
    
    if (!userResponse.ok) {
      const errorText = await userResponse.text()
      console.log(`❌ Error response: ${errorText}`)
    } else {
      const data = await userResponse.json()
      console.log(`✅ Success! Found ${data.albums?.length || 0} albums`)
    }
    
  } catch (error) {
    console.error('❌ Error testing API:', error.message)
  }
}

testAPI() 