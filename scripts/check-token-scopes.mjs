#!/usr/bin/env node

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

console.log('🔍 Checking Token Scopes and API Access')
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

// Test different scopes and endpoints
async function testScopes() {
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
      console.log(`   ✅ User Info works! Email: ${userData.email}`)
    } else {
      const error = await userResponse.text()
      console.log(`   ❌ User Info failed: ${error}`)
    }
    
    console.log('')
    
    // Test 2: Google Photos Library API - albums endpoint
    console.log('🔍 Test 2: Google Photos Library API (albums)...')
    const albumsResponse = await fetch('https://photoslibrary.googleapis.com/v1/albums', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    })
    
    console.log(`   Status: ${albumsResponse.status}`)
    if (albumsResponse.ok) {
      const albumsData = await albumsResponse.json()
      console.log(`   ✅ Albums API works! Found ${albumsData.albums?.length || 0} albums`)
    } else {
      const error = await albumsResponse.text()
      console.log(`   ❌ Albums API failed: ${error}`)
    }
    
    console.log('')
    
    // Test 3: Google Photos Library API - mediaItems endpoint
    console.log('🔍 Test 3: Google Photos Library API (mediaItems)...')
    const mediaResponse = await fetch('https://photoslibrary.googleapis.com/v1/mediaItems', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    })
    
    console.log(`   Status: ${mediaResponse.status}`)
    if (mediaResponse.ok) {
      const mediaData = await mediaResponse.json()
      console.log(`   ✅ Media Items API works! Found ${mediaData.mediaItems?.length || 0} items`)
    } else {
      const error = await mediaResponse.text()
      console.log(`   ❌ Media Items API failed: ${error}`)
    }
    
    console.log('')
    
    // Test 4: Check what scopes we actually have
    console.log('🔍 Test 4: Checking token scopes...')
    const tokenInfoResponse = await fetch('https://www.googleapis.com/oauth2/v1/tokeninfo', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    })
    
    console.log(`   Status: ${tokenInfoResponse.status}`)
    if (tokenInfoResponse.ok) {
      const tokenInfo = await tokenInfoResponse.json()
      console.log(`   ✅ Token info: ${JSON.stringify(tokenInfo, null, 2)}`)
    } else {
      const error = await tokenInfoResponse.text()
      console.log(`   ❌ Token info failed: ${error}`)
    }
    
  } catch (error) {
    console.error('❌ Error testing scopes:', error.message)
  }
}

testScopes() 