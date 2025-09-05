#!/usr/bin/env node

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

console.log('📸 Extracting Local Photos for Message Timeline')
console.log('')

// Load message dates
const messageDatesFile = path.join(__dirname, '../data/message-dates.json')
if (!fs.existsSync(messageDatesFile)) {
  console.log('❌ Message dates file not found')
  console.log('Please run: node scripts/extract-csv-dates.mjs')
  process.exit(1)
}

const messageDates = JSON.parse(fs.readFileSync(messageDatesFile, 'utf8'))
console.log(`✅ Loaded ${messageDates.length} message dates`)

// Filter to recent dates (2024-2025) where we have photos
const recentDates = messageDates.filter(date => {
  const year = parseInt(date.split('-')[0])
  return year >= 2024
})

console.log(`📅 Found ${recentDates.length} recent dates (2024-2025)`)
console.log('')

// Create mock photos for these dates
const photos = []
const photoExtensions = ['.jpg', '.jpeg', '.png', '.heic', '.mov', '.mp4']

for (const date of recentDates.slice(0, 20)) { // Limit to first 20 dates
  const photoCount = Math.floor(Math.random() * 5) + 1 // 1-5 photos per date
  
  for (let i = 0; i < photoCount; i++) {
    const photoId = `local_${date}_${i + 1}`
    const photoUrl = `/api/mock-photo?date=${date}&id=${photoId}`
    
    photos.push({
      id: photoId,
      url: photoUrl,
      date: date,
      description: `Photo from ${date}`,
      tags: ['local', 'message-date'],
      source: 'local-photos',
      location: {
        latitude: 37.7749 + (Math.random() - 0.5) * 0.1,
        longitude: -122.4194 + (Math.random() - 0.5) * 0.1,
        name: 'San Francisco Area'
      }
    })
  }
}

// Save photos to data file
const photosFile = path.join(__dirname, '../data/local-photos.json')
fs.writeFileSync(photosFile, JSON.stringify(photos, null, 2))

console.log(`📸 Generated ${photos.length} mock photos for ${recentDates.slice(0, 20).length} dates`)
console.log(`💾 Saved to: ${photosFile}`)
console.log('')

// Show sample photos
console.log('📋 Sample photos:')
photos.slice(0, 10).forEach(photo => {
  console.log(`   ${photo.date}: ${photo.description}`)
})

console.log('')
console.log('✅ Local photos ready! You can now view them in the Photo Timeline.')
console.log('   The photos will be displayed as mock images with real dates.') 