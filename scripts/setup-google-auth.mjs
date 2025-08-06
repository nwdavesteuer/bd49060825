#!/usr/bin/env node

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import readline from 'readline'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

console.log('🔐 Google Photos API Authentication Setup')
console.log('')

const credentialsFile = path.join(__dirname, '../data/google-credentials.json')
const tokenFile = path.join(__dirname, '../data/google-photos-token.json')

if (!fs.existsSync(credentialsFile)) {
  console.log('❌ Google credentials file not found')
  console.log('')
  console.log('📋 Please follow these steps:')
  console.log('')
  console.log('1. Go to https://console.developers.google.com/')
  console.log('2. Create a new project or select an existing one')
  console.log('3. Enable the Google Photos Library API:')
  console.log('   - Go to "APIs & Services" > "Library"')
  console.log('   - Search for "Google Photos Library API"')
  console.log('   - Click "Enable"')
  console.log('')
  console.log('4. Create OAuth 2.0 credentials:')
  console.log('   - Go to "APIs & Services" > "Credentials"')
  console.log('   - Click "Create Credentials" > "OAuth 2.0 Client IDs"')
  console.log('   - Choose "Desktop application"')
  console.log('   - Download the JSON file')
  console.log('')
  console.log('5. Save the downloaded file as: data/google-credentials.json')
  console.log('')
  console.log('6. Run this script again: node scripts/setup-google-auth.mjs')
  process.exit(1)
}

console.log('✅ Found credentials file')
console.log('')

// Read credentials
const credentials = JSON.parse(fs.readFileSync(credentialsFile, 'utf8'))
const clientId = credentials.installed?.client_id || credentials.web?.client_id
const clientSecret = credentials.installed?.client_secret || credentials.web?.client_secret

if (!clientId || !clientSecret) {
  console.log('❌ Invalid credentials file format')
  process.exit(1)
}

console.log('🔗 Starting OAuth flow...')
console.log('')

// Generate authorization URL
const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
authUrl.searchParams.set('client_id', clientId)
authUrl.searchParams.set('redirect_uri', 'http://localhost')
authUrl.searchParams.set('scope', 'https://www.googleapis.com/auth/photoslibrary https://www.googleapis.com/auth/photoslibrary.readonly')
authUrl.searchParams.set('response_type', 'code')
authUrl.searchParams.set('access_type', 'offline')

console.log('📋 Please visit this URL in your browser:')
console.log('')
console.log(authUrl.toString())
console.log('')
console.log('After authorization, you will get a code. Please paste it below:')

// Read authorization code
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

rl.question('Authorization code: ', async (authCode) => {
  try {
    console.log('')
    console.log('🔄 Exchanging code for tokens...')
    
    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
              body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          code: authCode,
          grant_type: 'authorization_code',
          redirect_uri: 'http://localhost'
        })
    })

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text()
      console.log('❌ Error exchanging code:', error)
      rl.close()
      return
    }

    const tokenData = await tokenResponse.json()
    
    // Save token data
    const tokenInfo = {
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_in: tokenData.expires_in,
      token_type: tokenData.token_type,
      client_id: clientId,
      client_secret: clientSecret
    }
    
    fs.writeFileSync(tokenFile, JSON.stringify(tokenInfo, null, 2))
    
    console.log('✅ Authentication successful!')
    console.log('')
    console.log('🔍 Testing API access...')
    
    // Test the API access
    const testResponse = await fetch('https://photoslibrary.googleapis.com/v1/albums', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`
      }
    })
    
    if (testResponse.ok) {
      console.log('✅ Google Photos API is working!')
      console.log('')
      console.log('📸 You can now fetch photos from Google Photos:')
      console.log('   node scripts/google-photos-service.mjs fetch')
    } else {
      console.log('❌ Google Photos API test failed')
      console.log('')
      console.log('🔧 Please ensure the Google Photos Library API is enabled:')
      console.log('1. Go to https://console.developers.google.com/')
      console.log('2. Select your project (bd060825)')
      console.log('3. Go to "APIs & Services" > "Library"')
      console.log('4. Search for "Google Photos Library API"')
      console.log('5. Click "Enable" if not already enabled')
      console.log('6. Try running the fetch script again')
    }
    
  } catch (error) {
    console.error('❌ Error during authentication:', error.message)
  }
  
  rl.close()
}) 