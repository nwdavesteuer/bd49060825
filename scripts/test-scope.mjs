#!/usr/bin/env node

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

console.log('🔍 Testing Google Photos OAuth Scopes')
console.log('')

const tokenFile = path.join(__dirname, '../data/google-photos-token.json')

if (!fs.existsSync(tokenFile)) {
  console.log('❌ No token file found')
  process.exit(1)
}

const tokenData = JSON.parse(fs.readFileSync(tokenFile, 'utf8'))
const accessToken = tokenData.access_token

console.log('✅ Found access token')
console.log('')

// Test different scopes
const scopes = [
  'https://www.googleapis.com/auth/photoslibrary',
  'https://www.googleapis.com/auth/photoslibrary.readonly',
  'https://www.googleapis.com/auth/photoslibrary.sharing',
  'https://www.googleapis.com/auth/photoslibrary.appendonly'
]

async function testScope(scope) {
  console.log(`🔍 Testing scope: ${scope}`)
  
  try {
    const response = await fetch('https://photoslibrary.googleapis.com/v1/albums', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    })
    
    console.log(`Status: ${response.status}`)
    
    if (response.ok) {
      const data = await response.json()
      console.log(`✅ SUCCESS! Found ${data.albums?.length || 0} albums`)
      return true
    } else {
      const error = await response.text()
      console.log(`❌ Failed:`, error)
      return false
    }
  } catch (error) {
    console.log(`❌ Error:`, error.message)
    return false
  }
}

// Check what scopes we actually have
console.log('📋 Current token scopes:')
console.log('Token data:', JSON.stringify(tokenData, null, 2))
console.log('')

// Test the current token
console.log('🔍 Testing current token...')
await testScope('current')

console.log('')
console.log('💡 The issue might be that we need to re-authenticate with the correct scope.')
console.log('💡 Let\'s try re-authenticating with the full scope...') 