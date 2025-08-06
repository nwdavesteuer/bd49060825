#!/usr/bin/env node

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

console.log('📅 Checking available photo dates in Photos library...')
console.log('')

const sourceDir = process.argv[2] || '~/Pictures/Photos Library.photoslibrary/originals'
const expandedSourceDir = sourceDir.replace(/^~/, process.env.HOME)

if (!fs.existsSync(expandedSourceDir)) {
  console.log(`❌ Source directory not found: ${expandedSourceDir}`)
  process.exit(1)
}

console.log(`🔍 Scanning: ${expandedSourceDir}`)
console.log('')

// Get all files recursively
function getAllFiles(dir) {
  const files = []
  const items = fs.readdirSync(dir)
  for (const item of items) {
    const fullPath = path.join(dir, item)
    const stat = fs.statSync(fullPath)
    if (stat.isDirectory()) {
      files.push(...getAllFiles(fullPath))
    } else {
      files.push(fullPath)
    }
  }
  return files
}

const allFiles = getAllFiles(expandedSourceDir)
console.log(`📸 Found ${allFiles.length} total files`)

// Check file extensions and get dates
const photoExtensions = ['.jpg', '.jpeg', '.png', '.heic', '.mov', '.mp4']
const dateCounts = new Map()

let photoCount = 0
for (const filePath of allFiles) {
  const ext = path.extname(filePath).toLowerCase()
  if (photoExtensions.includes(ext)) {
    photoCount++
    const stats = fs.statSync(filePath)
    const date = new Date(stats.birthtime)
    const dateStr = date.toISOString().split('T')[0]
    
    if (!dateCounts.has(dateStr)) {
      dateCounts.set(dateStr, 0)
    }
    dateCounts.set(dateStr, dateCounts.get(dateStr) + 1)
  }
}

console.log(`📸 Found ${photoCount} photo/video files`)
console.log('')

// Show date distribution
const sortedDates = Array.from(dateCounts.entries()).sort((a, b) => a[0].localeCompare(b[0]))

console.log('📅 Photo date distribution:')
console.log('Date\t\tCount')
console.log('----\t\t-----')

let totalPhotos = 0
for (const [date, count] of sortedDates) {
  console.log(`${date}\t${count}`)
  totalPhotos += count
}

console.log('')
console.log(`📊 Total photos: ${totalPhotos}`)
console.log(`📊 Date range: ${sortedDates[0]?.[0]} to ${sortedDates[sortedDates.length - 1]?.[0]}`)
console.log('')

// Check overlap with message dates
const messageDatesFile = path.join(__dirname, '../data/message-dates.json')
if (fs.existsSync(messageDatesFile)) {
  const messageDates = JSON.parse(fs.readFileSync(messageDatesFile, 'utf8'))
  const messageDatesSet = new Set(messageDates)
  
  let matchingPhotos = 0
  const matchingDates = []
  
  for (const [date, count] of sortedDates) {
    if (messageDatesSet.has(date)) {
      matchingPhotos += count
      matchingDates.push({ date, count })
    }
  }
  
  console.log('🎯 Overlap with message dates:')
  if (matchingDates.length > 0) {
    console.log('Date\t\tPhotos\tMessages')
    console.log('----\t\t------\t--------')
    for (const { date, count } of matchingDates) {
      console.log(`${date}\t${count}\t✅`)
    }
    console.log(`\n📸 Total matching photos: ${matchingPhotos}`)
  } else {
    console.log('❌ No photos found from message dates')
    console.log('This means your Photos library contains photos from different dates than your message dates')
  }
} 