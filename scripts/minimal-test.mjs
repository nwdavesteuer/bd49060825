#!/usr/bin/env node

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

console.log('🧪 Minimal Google Photos API Test')
console.log('')

// Check if token exists
const tokenFile = path.join(__dirname, '../data/google-photos-token.json')
if (!fs.existsSync(tokenFile)) {
  console.log('❌ No token file found')
  console.log('💡 Run: node scripts/setup-google-auth.mjs')
  process.exit(1)
}

const tokenData = JSON.parse(fs.readFileSync(tokenFile, 'utf8'))
const accessToken = tokenData.access_token

console.log('✅ Found access token')
console.log('')

async function minimalTest() {
  try {
    // Try the simplest possible endpoint
    console.log('🔍 Testing /mediaItems endpoint...')
    
    const response = await fetch('https://photoslibrary.googleapis.com/v1/mediaItems', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    })
    
    console.log(`📊 Status: ${response.status}`)
    
    if (response.ok) {
      const data = await response.json()
      console.log('✅ SUCCESS! API is working!')
      console.log(`📸 Found ${data.mediaItems?.length || 0} media items`)
    } else {
      const errorText = await response.text()
      console.log(`❌ Error: ${errorText}`)
      
      // Try a different approach - maybe the issue is with the albums endpoint specifically
      console.log('')
      console.log('🔍 Trying /sharedAlbums endpoint...')
      
      const sharedResponse = await fetch('https://photoslibrary.googleapis.com/v1/sharedAlbums', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      })
      
      console.log(`📊 Shared Albums Status: ${sharedResponse.status}`)
      
      if (sharedResponse.ok) {
        const sharedData = await sharedResponse.json()
        console.log('✅ SUCCESS! Shared albums endpoint works!')
        console.log(`📸 Found ${sharedData.sharedAlbums?.length || 0} shared albums`)
      } else {
        const sharedError = await sharedResponse.text()
        console.log(`❌ Shared albums error: ${sharedError}`)
      }
    }
    
  } catch (error) {
    console.error('❌ Network error:', error.message)
  }
}

minimalTest() 