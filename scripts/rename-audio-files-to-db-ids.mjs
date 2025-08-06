#!/usr/bin/env node

import fs from 'fs'
import path from 'path'
import { createClient } from '@supabase/supabase-js'

// Supabase configuration
const supabaseUrl = 'https://fblwndzprmvjajayxjln.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZibHduZHpwcm12amFqYXl4amxuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk0MjEwODAsImV4cCI6MjA2NDk5NzA4MH0.kUJ2La2IkvcX86_bnBbgI17VvqLvoKEhiTgqQrxF6zY'
const supabase = createClient(supabaseUrl, supabaseKey)

/**
 * Rename audio files to use actual database message_id values
 */
async function renameAudioFilesToDbIds() {
  try {
    console.log('🎵 Starting audio file renaming to database IDs...')
    
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
      const match = file.match(/david-(\d{4})-love-note-(\d+)\.wav/)
      if (match) {
        const year = parseInt(match[1])
        const sequenceId = parseInt(match[2])
        
        if (!filesByYear[year]) {
          filesByYear[year] = []
        }
        filesByYear[year].push({
          filename: file,
          sequenceId,
          year
        })
      }
    })
    
    console.log('📊 Files grouped by year:')
    Object.keys(filesByYear).forEach(year => {
      console.log(`  ${year}: ${filesByYear[year].length} files`)
    })
    
    // For each year, get the actual database message_ids for David's messages
    for (const year of Object.keys(filesByYear)) {
      console.log(`\n🔍 Processing year ${year}...`)
      
      // Get David's messages for this year from the database
      const startDate = `${year}-01-01T00:00:00`
      const endDate = `${year}-12-31T23:59:59`
      
      const { data: messages, error } = await supabase
        .from('fulldata_set')
        .select('message_id, readable_date, is_from_me')
        .eq('is_from_me', '1')
        .gte('readable_date', startDate)
        .lte('readable_date', endDate)
        .order('readable_date', { ascending: true })
      
      if (error) {
        console.error(`❌ Error fetching messages for ${year}:`, error)
        continue
      }
      
      console.log(`📊 Found ${messages.length} David messages in ${year}`)
      
      if (messages.length === 0) {
        console.log(`⚠️ No David messages found for ${year}, skipping...`)
        continue
      }
      
      // Sort files by sequence ID
      const yearFiles = filesByYear[year].sort((a, b) => a.sequenceId - b.sequenceId)
      
      // Rename files to use actual database message_ids
      for (let i = 0; i < Math.min(yearFiles.length, messages.length); i++) {
        const file = yearFiles[i]
        const message = messages[i]
        const newFilename = `david-${year}-love-note-${message.message_id}.wav`
        const oldPath = path.join(audioDir, file.filename)
        const newPath = path.join(audioDir, newFilename)
        
        try {
          if (fs.existsSync(oldPath)) {
            fs.renameSync(oldPath, newPath)
            console.log(`✅ Renamed: ${file.filename} → ${newFilename} (message_id: ${message.message_id})`)
          } else {
            console.error(`❌ File not found: ${oldPath}`)
          }
        } catch (renameError) {
          console.error(`❌ Error renaming ${file.filename}:`, renameError)
        }
      }
      
      // Check if we have more files than messages
      if (yearFiles.length > messages.length) {
        console.log(`⚠️ Warning: ${yearFiles.length - messages.length} extra files for ${year} (more audio files than database messages)`)
      } else if (messages.length > yearFiles.length) {
        console.log(`⚠️ Warning: ${messages.length - yearFiles.length} more database messages than audio files for ${year}`)
      }
    }
    
    console.log('\n🎉 Audio file renaming completed!')
    console.log('✅ All files renamed to use actual database message_id values')
    
  } catch (error) {
    console.error('❌ Error during renaming:', error)
  }
}

// Run the script
renameAudioFilesToDbIds() 