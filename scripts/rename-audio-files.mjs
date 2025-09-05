#!/usr/bin/env node

import fs from 'fs'
import path from 'path'

/**
 * Rename audio files to use consistent pattern: david-{year}-love-note-{messageId}.wav
 */
async function renameAudioFiles() {
  try {
    console.log('🎵 Starting audio file renaming process...')
    
    const audioDir = path.join(process.cwd(), 'public', 'audio', 'love-notes')
    
    if (!fs.existsSync(audioDir)) {
      console.error('❌ Audio directory not found:', audioDir)
      return
    }
    
    // Get all audio files
    const files = fs.readdirSync(audioDir).filter(file => file.endsWith('.wav'))
    console.log(`📁 Found ${files.length} audio files to rename`)
    
    // Group files by year
    const filesByYear = {}
    
    files.forEach(file => {
      const match = file.match(/david-(\d{4})-love-note-(.+)\.wav/)
      if (match) {
        const year = parseInt(match[1])
        const messageId = match[2]
        
        if (!filesByYear[year]) {
          filesByYear[year] = []
        }
        
        filesByYear[year].push({
          oldName: file,
          year,
          messageId
        })
      }
    })
    
    console.log('\n📊 Files by year:')
    Object.keys(filesByYear).sort().forEach(year => {
      console.log(`  ${year}: ${filesByYear[year].length} files`)
    })
    
    // Rename files by year
    let totalRenamed = 0
    
    for (const year of Object.keys(filesByYear).sort()) {
      console.log(`\n🔄 Processing year ${year}...`)
      
      const yearFiles = filesByYear[year]
      
      // Sort files by their original messageId to maintain order
      yearFiles.sort((a, b) => {
        // For 2015-2017, sort by timestamp (numeric part before underscore)
        if (year >= 2015 && year <= 2017) {
          const aTimestamp = parseInt(a.messageId.split('_')[0])
          const bTimestamp = parseInt(b.messageId.split('_')[0])
          return aTimestamp - bTimestamp
        }
        // For 2018+, sort by messageId (numeric)
        return parseInt(a.messageId) - parseInt(b.messageId)
      })
      
      // Rename files with sequential IDs
      for (let i = 0; i < yearFiles.length; i++) {
        const file = yearFiles[i]
        const newMessageId = (i + 1).toString()
        const newName = `david-${year}-love-note-${newMessageId}.wav`
        
        const oldPath = path.join(audioDir, file.oldName)
        const newPath = path.join(audioDir, newName)
        
        try {
          // Check if new file already exists
          if (fs.existsSync(newPath)) {
            console.log(`⚠️  Skipping ${file.oldName} -> ${newName} (already exists)`)
            continue
          }
          
          // Rename the file
          fs.renameSync(oldPath, newPath)
          console.log(`✅ ${file.oldName} -> ${newName}`)
          totalRenamed++
        } catch (error) {
          console.error(`❌ Error renaming ${file.oldName}:`, error.message)
        }
      }
    }
    
    console.log(`\n🎉 Renaming complete!`)
    console.log(`📊 Total files renamed: ${totalRenamed}`)
    console.log(`📁 Check the audio directory for the renamed files`)
    
  } catch (error) {
    console.error('❌ Error during renaming process:', error)
  }
}

// Run the script
renameAudioFiles() 