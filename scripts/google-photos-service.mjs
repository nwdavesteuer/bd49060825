#!/usr/bin/env node

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

console.log('📸 Google Photos Service for Message Timeline')
console.log('')

// Google Photos API configuration
const GOOGLE_PHOTOS_API_BASE = 'https://photoslibrary.googleapis.com/v1'

class GooglePhotosService {
  constructor() {
    this.accessToken = null
    this.messageDates = []
  }

  async initialize() {
    console.log('🔐 Initializing Google Photos service...')
    
    // Load message dates
    const messageDatesFile = path.join(__dirname, '../data/message-dates.json')
    if (fs.existsSync(messageDatesFile)) {
      this.messageDates = JSON.parse(fs.readFileSync(messageDatesFile, 'utf8'))
      console.log(`✅ Loaded ${this.messageDates.length} message dates`)
    } else {
      console.log('❌ Message dates file not found')
      return false
    }

    // Check for access token
    const tokenFile = path.join(__dirname, '../data/google-photos-token.json')
    if (fs.existsSync(tokenFile)) {
      const tokenData = JSON.parse(fs.readFileSync(tokenFile, 'utf8'))
      this.accessToken = tokenData.access_token
      console.log('✅ Found existing access token')
      return true
    } else {
      console.log('❌ No access token found')
      console.log('')
      console.log('📋 To get started:')
      console.log('1. Go to https://console.developers.google.com/')
      console.log('2. Create a new project or select existing one')
      console.log('3. Enable the Google Photos Library API')
      console.log('4. Create OAuth 2.0 credentials')
      console.log('5. Download the credentials and save as data/google-credentials.json')
      console.log('6. Run: node scripts/setup-google-auth.mjs')
      return false
    }
  }

  async getPhotosForDate(date) {
    if (!this.accessToken) {
      console.log('❌ No access token available')
      return []
    }

    try {
      // Create date range for the specific date
      const startDate = new Date(date + 'T00:00:00Z')
      const endDate = new Date(date + 'T23:59:59Z')
      
      const response = await fetch(`${GOOGLE_PHOTOS_API_BASE}/mediaItems:search`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          filters: {
            dateFilter: {
              ranges: [{
                startDate: {
                  year: startDate.getUTCFullYear(),
                  month: startDate.getUTCMonth() + 1,
                  day: startDate.getUTCDate()
                },
                endDate: {
                  year: endDate.getUTCFullYear(),
                  month: endDate.getUTCMonth() + 1,
                  day: endDate.getUTCDate()
                }
              }]
            }
          },
          pageSize: 100
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      return data.mediaItems || []
    } catch (error) {
      console.error(`❌ Error fetching photos for ${date}:`, error.message)
      return []
    }
  }

  async getPhotosForMessageDates() {
    console.log('📸 Fetching photos for message dates...')
    console.log('')

    const results = {}
    let totalPhotos = 0

    for (const date of this.messageDates.slice(0, 10)) { // Start with first 10 dates for testing
      console.log(`🔍 Checking photos for ${date}...`)
      const photos = await this.getPhotosForDate(date)
      
      if (photos.length > 0) {
        results[date] = photos
        totalPhotos += photos.length
        console.log(`✅ Found ${photos.length} photos for ${date}`)
      } else {
        console.log(`⏭️  No photos found for ${date}`)
      }
    }

    console.log('')
    console.log(`📊 Summary: Found ${totalPhotos} total photos across ${Object.keys(results).length} dates`)
    
    // Save results
    const resultsFile = path.join(__dirname, '../data/google-photos-results.json')
    fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2))
    console.log(`💾 Results saved to: ${resultsFile}`)

    return results
  }

  async refreshToken() {
    console.log('🔄 Refreshing access token...')
    
    const tokenFile = path.join(__dirname, '../data/google-photos-token.json')
    if (!fs.existsSync(tokenFile)) {
      console.log('❌ No token file found')
      return false
    }

    const tokenData = JSON.parse(fs.readFileSync(tokenFile, 'utf8'))
    
    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          client_id: tokenData.client_id,
          client_secret: tokenData.client_secret,
          refresh_token: tokenData.refresh_token,
          grant_type: 'refresh_token'
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const newTokenData = await response.json()
      
      // Update token file
      const updatedTokenData = {
        ...tokenData,
        access_token: newTokenData.access_token,
        expires_in: newTokenData.expires_in,
        token_type: newTokenData.token_type
      }
      
      fs.writeFileSync(tokenFile, JSON.stringify(updatedTokenData, null, 2))
      this.accessToken = newTokenData.access_token
      
      console.log('✅ Token refreshed successfully')
      return true
    } catch (error) {
      console.error('❌ Error refreshing token:', error.message)
      return false
    }
  }
}

export const googlePhotosService = new GooglePhotosService()

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const service = new GooglePhotosService()
  
  const command = process.argv[2]
  
  switch (command) {
    case 'init':
      await service.initialize()
      break
      
    case 'fetch':
      await service.initialize()
      if (service.accessToken) {
        await service.getPhotosForMessageDates()
      }
      break
      
    case 'refresh':
      await service.refreshToken()
      break
      
    default:
      console.log('Usage:')
      console.log('  node scripts/google-photos-service.mjs init    - Initialize service')
      console.log('  node scripts/google-photos-service.mjs fetch   - Fetch photos for message dates')
      console.log('  node scripts/google-photos-service.mjs refresh - Refresh access token')
      break
  }
} 