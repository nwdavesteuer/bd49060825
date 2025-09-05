#!/usr/bin/env node

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

console.log('📅 Extracting message dates from CSV file...')
console.log('')

// Read the CSV file
const csvFile = path.join(__dirname, '../final_david_nitzan_conversation.csv')
const csvContent = fs.readFileSync(csvFile, 'utf8')

// Parse CSV and extract unique dates
const lines = csvContent.split('\n')
const dates = new Set()

// Skip header line
for (let i = 1; i < lines.length; i++) {
  const line = lines[i].trim()
  if (!line) continue
  
  // Split by comma, but handle quoted fields
  const fields = line.split(',')
  if (fields.length >= 14) { // readable_date is at index 13
    const readableDate = fields[13]
    // Check if it's a valid date format (YYYY-MM-DDTHH:MM:SS)
    if (readableDate && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(readableDate)) {
      // Extract just the date part (YYYY-MM-DD)
      const dateOnly = readableDate.split('T')[0]
      dates.add(dateOnly)
    }
  }
}

// Convert to sorted array
const uniqueDates = Array.from(dates).sort()

console.log(`✅ Found ${uniqueDates.length} unique dates with messages`)
console.log('')

// Save to message dates file
const messageDatesFile = path.join(__dirname, '../data/message-dates.json')
fs.writeFileSync(messageDatesFile, JSON.stringify(uniqueDates, null, 2))

console.log(`📄 Message dates saved to: ${messageDatesFile}`)
console.log('')

// Show first 20 dates as preview
console.log('📅 First 20 dates:')
uniqueDates.slice(0, 20).forEach(date => {
  console.log(`   ${date}`)
})

if (uniqueDates.length > 20) {
  console.log(`   ... and ${uniqueDates.length - 20} more dates`)
}

console.log('')
console.log('🎉 Date extraction complete!')
console.log('Now you can run the photo organization script:')
console.log('   node scripts/organize-photos.mjs ~/Pictures/Photos\\ Library.photoslibrary/originals') 