#!/usr/bin/env node

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

console.log('🧪 Testing Google Photos API v2')
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

// Test 1: Try with different endpoint
async function testMediaItems() {
  console.log('🔍 Testing mediaItems endpoint...')
  
  try {
    const response = await fetch('https://photoslibrary.googleapis.com/v1/mediaItems?pageSize=10', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    })
    
    console.log(`Status: ${response.status}`)
    
    if (response.ok) {
      const data = await response.json()
      console.log(`✅ MediaItems API works! Found ${data.mediaItems?.length || 0} items`)
      return true
    } else {
      const error = await response.text()
      console.log(`❌ MediaItems API failed:`, error)
      return false
    }
  } catch (error) {
    console.log(`❌ MediaItems API error:`, error.message)
    return false
  }
}

// Test 2: Try search with minimal parameters
async function testSearch() {
  console.log('')
  console.log('🔍 Testing search endpoint with minimal parameters...')
  
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
      return true
    } else {
      const error = await response.text()
      console.log(`❌ Search API failed:`, error)
      return false
    }
  } catch (error) {
    console.log(`❌ Search API error:`, error.message)
    return false
  }
}

// Test 3: Try with date filter
async function testDateSearch() {
  console.log('')
  console.log('🔍 Testing search with date filter...')
  
  try {
    const response = await fetch('https://photoslibrary.googleapis.com/v1/mediaItems:search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        filters: {
          dateFilter: {
            ranges: [{
              startDate: {
                year: 2024,
                month: 1,
                day: 1
              },
              endDate: {
                year: 2024,
                month: 12,
                day: 31
              }
            }]
          }
        },
        pageSize: 10
      })
    })
    
    console.log(`Status: ${response.status}`)
    
    if (response.ok) {
      const data = await response.json()
      console.log(`✅ Date search works! Found ${data.mediaItems?.length || 0} items`)
      return true
    } else {
      const error = await response.text()
      console.log(`❌ Date search failed:`, error)
      return false
    }
  } catch (error) {
    console.log(`❌ Date search error:`, error.message)
    return false
  }
}

// Run tests
async function runTests() {
  await testMediaItems()
  await testSearch()
  await testDateSearch()
  
  console.log('')
  console.log('🏁 Tests complete!')
}

runTests() 