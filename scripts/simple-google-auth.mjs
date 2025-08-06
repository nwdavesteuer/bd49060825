#!/usr/bin/env node

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import readline from 'readline'
import { exec } from 'child_process'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

console.log('🔐 Simple Google Photos Authentication')
console.log('')

const credentialsFile = path.join(__dirname, '../data/google-credentials.json')
const tokenFile = path.join(__dirname, '../data/google-photos-token.json')

if (!fs.existsSync(credentialsFile)) {
  console.log('❌ Google credentials file not found')
  console.log('Please copy your Google credentials file to: data/google-credentials.json')
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

console.log('🔗 Opening browser for authentication...')
console.log('')

// Generate authorization URL
const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=http://localhost&scope=https://www.googleapis.com/auth/photoslibrary.readonly&response_type=code&access_type=offline`

// Open browser
exec(`open "${authUrl}"`, (error) => {
  if (error) {
    console.log('❌ Could not open browser automatically')
    console.log('')
    console.log('📋 Please manually visit this URL in your browser:')
    console.log(authUrl)
  } else {
    console.log('✅ Browser opened for authentication')
  }
  
  console.log('')
  console.log('📋 After authorization, you will be redirected to localhost')
  console.log('📋 Copy the "code" parameter from the URL')
  console.log('📋 Example: http://localhost/?code=4/0AfJohXn1234567890abcdefghijklmnopqrstuvwxyz')
  console.log('')
  console.log('📋 Paste just the code part (without "code=") below:')
  
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
      console.log('📸 You can now fetch photos from Google Photos:')
      console.log('   node scripts/google-photos-service.mjs fetch')
      
    } catch (error) {
      console.error('❌ Error during authentication:', error.message)
    }
    
    rl.close()
  })
}) 