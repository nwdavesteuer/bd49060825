#!/usr/bin/env node

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

console.log('🧪 Testing Google Photos API Access')
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

// Test 1: Simple API call to list albums
async function testAlbums() {
  console.log('🔍 Testing albums endpoint...')
  
  try {
    const response = await fetch('https://photoslibrary.googleapis.com/v1/albums', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    })
    
    console.log(`Status: ${response.status}`)
    console.log(`Headers:`, Object.fromEntries(response.headers.entries()))
    
    if (response.ok) {
      const data = await response.json()
      console.log(`✅ Albums API works! Found ${data.albums?.length || 0} albums`)
    } else {
      const error = await response.text()
      console.log(`❌ Albums API failed:`, error)
    }
  } catch (error) {
    console.log(`❌ Albums API error:`, error.message)
  }
}

// Test 2: Simple media items call
async function testMediaItems() {
  console.log('')
  console.log('🔍 Testing mediaItems endpoint...')
  
  try {
    const response = await fetch('https://photoslibrary.googleapis.com/v1/mediaItems', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    })
    
    console.log(`Status: ${response.status}`)
    
    if (response.ok) {
      const data = await response.json()
      console.log(`✅ MediaItems API works! Found ${data.mediaItems?.length || 0} items`)
    } else {
      const error = await response.text()
      console.log(`❌ MediaItems API failed:`, error)
    }
  } catch (error) {
    console.log(`❌ MediaItems API error:`, error.message)
  }
}

// Test 3: Search endpoint
async function testSearch() {
  console.log('')
  console.log('🔍 Testing search endpoint...')
  
  try {
    const response = await fetch('https://photoslibrary.googleapis.com/v1/mediaItems:search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        pageSize: 10
      })
    })
    
    console.log(`Status: ${response.status}`)
    
    if (response.ok) {
      const data = await response.json()
      console.log(`✅ Search API works! Found ${data.mediaItems?.length || 0} items`)
    } else {
      const error = await response.text()
      console.log(`❌ Search API failed:`, error)
    }
  } catch (error) {
    console.log(`❌ Search API error:`, error.message)
  }
}

// Run tests
async function runTests() {
  await testAlbums()
  await testMediaItems()
  await testSearch()
  
  console.log('')
  console.log('🏁 Tests complete!')
}

runTests() 