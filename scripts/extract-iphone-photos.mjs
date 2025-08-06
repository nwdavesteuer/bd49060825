#!/usr/bin/env node

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Configuration
const OUTPUT_DIR = path.join(__dirname, '../extracted-photos')
const METADATA_FILE = path.join(OUTPUT_DIR, 'photo-metadata.json')

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })
}

console.log('📱 iPhone Photo Extraction Tool')
console.log('================================')
console.log('')
console.log('This tool will help you extract photos from your iPhone and save them locally.')
console.log('The photos will be organized by date to match your message timeline.')
console.log('')

// Instructions for manual extraction
console.log('📋 Instructions:')
console.log('1. Connect your iPhone to your computer via USB')
console.log('2. Open Finder (Mac) or File Explorer (Windows)')
console.log('3. Navigate to your iPhone > Photos')
console.log('4. Select the photos you want to extract')
console.log('5. Copy them to a folder on your computer')
console.log('6. Run this script to organize them by date')
console.log('')

// Function to organize photos by date
function organizePhotosByDate(sourceDir) {
  console.log('🔄 Organizing photos by date...')
  
  const photos = []
  const dateFolders = new Map()
  
  // Read all files in source directory
  const files = fs.readdirSync(sourceDir)
  
  for (const file of files) {
    if (file.match(/\.(jpg|jpeg|png|heic|mov|mp4)$/i)) {
      const filePath = path.join(sourceDir, file)
      const stats = fs.statSync(filePath)
      
      // Get creation date
      const date = new Date(stats.birthtime)
      const dateStr = date.toISOString().split('T')[0]
      
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
        path: newFilePath,
        size: stats.size,
        createdAt: date.toISOString(),
        description: file.replace(/\.[^/.]+$/, ''), // Remove extension for description
        tags: []
      })
      
      // Track date folders
      if (!dateFolders.has(dateStr)) {
        dateFolders.set(dateStr, [])
      }
      dateFolders.get(dateStr).push(newFileName)
    }
  }
  
  // Save metadata
  const metadata = {
    extractedAt: new Date().toISOString(),
    totalPhotos: photos.length,
    dateFolders: Object.fromEntries(dateFolders),
    photos: photos
  }
  
  fs.writeFileSync(METADATA_FILE, JSON.stringify(metadata, null, 2))
  
  console.log(`✅ Organized ${photos.length} photos into ${dateFolders.size} date folders`)
  console.log(`📁 Output directory: ${OUTPUT_DIR}`)
  console.log(`📄 Metadata file: ${METADATA_FILE}`)
  
  return metadata
}

// Function to generate import script
function generateImportScript(metadata) {
  const importScript = `
// Generated import script for photo timeline
// Run this in your browser console or add to your app

const photoData = ${JSON.stringify(metadata, null, 2)};

// Function to import photos into your app
function importPhotos() {
  const photos = photoData.photos.map(photo => ({
    id: photo.id,
    url: '/extracted-photos/' + photo.date + '/' + photo.fileName,
    date: photo.date,
    description: photo.description,
    tags: photo.tags,
    messageId: null // Will be matched with messages later
  }));
  
  console.log('📸 Importing', photos.length, 'photos...');
  return photos;
}

// Usage:
// const photos = importPhotos();
// Then add to your photo timeline component
`;

  const importScriptPath = path.join(OUTPUT_DIR, 'import-script.js')
  fs.writeFileSync(importScriptPath, importScript)
  console.log(`📝 Import script generated: ${importScriptPath}`)
}

// Main execution
async function main() {
  console.log('🔍 Looking for photos to organize...')
  
  // Check if user provided source directory
  const sourceDir = process.argv[2]
  
  if (!sourceDir) {
    console.log('❌ Please provide the source directory containing your iPhone photos:')
    console.log('   node scripts/extract-iphone-photos.mjs /path/to/your/photos')
    console.log('')
    console.log('Example:')
    console.log('   node scripts/extract-iphone-photos.mjs ~/Downloads/iPhone_Photos')
    process.exit(1)
  }
  
  if (!fs.existsSync(sourceDir)) {
    console.log(`❌ Source directory not found: ${sourceDir}`)
    process.exit(1)
  }
  
  try {
    const metadata = organizePhotosByDate(sourceDir)
    generateImportScript(metadata)
    
    console.log('')
    console.log('🎉 Photo extraction complete!')
    console.log('')
    console.log('Next steps:')
    console.log('1. Copy the extracted photos to your app\'s public folder')
    console.log('2. Use the generated import script to load them into your app')
    console.log('3. The photos will be organized by date to match your messages')
    
  } catch (error) {
    console.error('❌ Error organizing photos:', error)
    process.exit(1)
  }
}

// Run the script
main().catch(console.error) 