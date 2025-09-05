#!/usr/bin/env node

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

console.log('📱 Photo Organization Tool')
console.log('=========================')
console.log('')
console.log('This tool will organize your iPhone photos by date')
console.log('and create metadata for your message timeline app.')
console.log('Only extracts photos from dates with messages (max 10 per day).')
console.log('')

// Configuration
const OUTPUT_DIR = path.join(__dirname, '../public/extracted-photos')
const METADATA_FILE = path.join(__dirname, '../data/photo-metadata.json')
const MAX_PHOTOS_PER_DAY = 10

// Ensure directories exist
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })
}

const dataDir = path.dirname(METADATA_FILE)
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

// Function to get message dates from database
async function getMessageDates() {
  try {
    console.log('📅 Loading message dates from database...')
    
    // Try to load from the message dates file first
    const messageDatesFile = path.join(__dirname, '../data/message-dates.json')
    
    if (fs.existsSync(messageDatesFile)) {
      const messageDatesData = JSON.parse(fs.readFileSync(messageDatesFile, 'utf8'))
      console.log(`✅ Loaded ${messageDatesData.length} message dates from file`)
      return new Set(messageDatesData)
    } else {
      console.log('❌ Message dates file not found. Please run:')
      console.log('   node scripts/get-message-dates.mjs')
      console.log('')
      console.log('Or use mock dates for testing...')
      
      // Fallback to mock dates for testing
      const mockMessageDates = [
        '2023-08-15',
        '2023-08-20', 
        '2023-09-01',
        '2023-09-10',
        '2023-09-15',
        '2023-10-05',
        '2023-10-12',
        '2023-11-01',
        '2023-11-15',
        '2023-12-01'
      ]
      
      console.log(`✅ Using ${mockMessageDates.length} mock dates for testing`)
      return new Set(mockMessageDates)
    }
  } catch (error) {
    console.error('❌ Error loading message dates:', error)
    return new Set()
  }
}

function organizePhotos(sourceDir, messageDates) {
  console.log('🔄 Organizing photos by date...')
  
  const photos = []
  const dateFolders = new Map()
  const photosPerDate = new Map()
  
  // Read all files in source directory recursively
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
  
  const allFiles = getAllFiles(sourceDir)
  console.log(`🔍 Found ${allFiles.length} total files`)
  
  for (const filePath of allFiles) {
    const file = path.basename(filePath)
    if (file.match(/\.(jpg|jpeg|png|heic|mov|mp4)$/i)) {
      const stats = fs.statSync(filePath)
      
      // Get creation date
      const date = new Date(stats.birthtime)
      const dateStr = date.toISOString().split('T')[0]
      
      console.log(`📸 Found photo: ${file} - Date: ${dateStr}`)
      
      // Only process photos from dates with messages
      if (!messageDates.has(dateStr)) {
        console.log(`⏭️  Skipping photo from ${dateStr} (no messages on this date)`)
        continue
      }
      
      // Check if we've reached the limit for this date
      const currentCount = photosPerDate.get(dateStr) || 0
      if (currentCount >= MAX_PHOTOS_PER_DAY) {
        console.log(`⏭️  Skipping photo from ${dateStr} (max ${MAX_PHOTOS_PER_DAY} photos per day reached)`)
        continue
      }
      
      // Create date folder if it doesn't exist
      const dateFolder = path.join(OUTPUT_DIR, dateStr)
      if (!fs.existsSync(dateFolder)) {
        fs.mkdirSync(dateFolder, { recursive: true })
      }
      
      // Copy file to date folder
      const newFileName = `${dateStr}_${file}`
      const newFilePath = path.join(dateFolder, newFileName)
      fs.copyFileSync(filePath, newFilePath)
      
      // Store metadata
      photos.push({
        id: `photo_${dateStr}_${Date.now()}`,
        originalName: file,
        fileName: newFileName,
        date: dateStr,
        url: `/extracted-photos/${dateStr}/${newFileName}`,
        size: stats.size,
        createdAt: date.toISOString(),
        description: file.replace(/\.[^/.]+$/, ''), // Remove extension for description
        tags: [],
        messageDate: dateStr // Link to message date
      })
      
      // Track date folders and photo counts
      if (!dateFolders.has(dateStr)) {
        dateFolders.set(dateStr, [])
      }
      dateFolders.get(dateStr).push(newFileName)
      photosPerDate.set(dateStr, currentCount + 1)
      
      console.log(`✅ Added photo from ${dateStr} (${currentCount + 1}/${MAX_PHOTOS_PER_DAY})`)
    }
  }
  
  // Save metadata
  const metadata = {
    extractedAt: new Date().toISOString(),
    totalPhotos: photos.length,
    dateFolders: Object.fromEntries(dateFolders),
    photos: photos,
    messageDates: Array.from(messageDates),
    maxPhotosPerDay: MAX_PHOTOS_PER_DAY
  }
  
  fs.writeFileSync(METADATA_FILE, JSON.stringify(metadata, null, 2))
  
  console.log(`✅ Organized ${photos.length} photos into ${dateFolders.size} date folders`)
  console.log(`📁 Output directory: ${OUTPUT_DIR}`)
  console.log(`📄 Metadata file: ${METADATA_FILE}`)
  
  // Show summary by date
  console.log('\n📊 Summary by date:')
  for (const [date, count] of photosPerDate) {
    console.log(`   ${date}: ${count} photos`)
  }
  
  return metadata
}

function generateImportCode(metadata) {
  const importCode = `
// Generated photo import code
// Copy this into your photo timeline component

const extractedPhotos = ${JSON.stringify(metadata.photos, null, 2)};

// Function to load extracted photos
function loadExtractedPhotos() {
  return extractedPhotos.map(photo => ({
    id: photo.id,
    url: photo.url,
    date: photo.date,
    description: photo.description,
    tags: photo.tags,
    messageId: null // Will be matched with messages later
  }));
}

// Usage in your component:
// const photos = loadExtractedPhotos();
// setPhotos(prev => [...prev, ...photos]);
`;

  const importCodePath = path.join(__dirname, '../data/photo-import-code.js')
  fs.writeFileSync(importCodePath, importCode)
  console.log(`📝 Import code generated: ${importCodePath}`)
}

async function main() {
  const sourceDir = process.argv[2]
  
  if (!sourceDir) {
    console.log('❌ Please provide the source directory containing your iPhone photos:')
    console.log('   node scripts/organize-photos.mjs /path/to/your/photos')
    console.log('')
    console.log('Example:')
    console.log('   node scripts/organize-photos.mjs ~/Downloads/iPhone_Photos')
    process.exit(1)
  }
  
  if (!fs.existsSync(sourceDir)) {
    console.log(`❌ Source directory not found: ${sourceDir}`)
    process.exit(1)
  }
  
  try {
    // Get message dates from database
    const messageDates = await getMessageDates()
    
    if (messageDates.size === 0) {
      console.log('❌ No message dates found. Please check your database connection.')
      process.exit(1)
    }
    
    const metadata = organizePhotos(sourceDir, messageDates)
    generateImportCode(metadata)
    
    console.log('')
    console.log('🎉 Photo organization complete!')
    console.log('')
    console.log('Next steps:')
    console.log('1. The photos are now in: public/extracted-photos/')
    console.log('2. The metadata is in: data/photo-metadata.json')
    console.log('3. Use the generated import code in your photo timeline component')
    console.log('4. The photos will be organized by date to match your messages')
    console.log(`5. Only photos from dates with messages were extracted (max ${MAX_PHOTOS_PER_DAY} per day)`)
    
  } catch (error) {
    console.error('❌ Error organizing photos:', error)
    process.exit(1)
  }
}

main().catch(console.error) 