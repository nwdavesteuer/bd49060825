#!/usr/bin/env node

import fs from 'fs'
import path from 'path'
import { createClient } from '@supabase/supabase-js'

// Supabase configuration
const supabaseUrl = 'https://fblwndzprmvjajayxjln.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZibHduZHpwcm12amFqYXl4amxuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk0MjEwODAsImV4cCI6MjA2NDk5NzA4MH0.kUJ2La2IkvcX86_bnBbgI17VvqLvoKEhiTgqQrxF6zY'
const supabase = createClient(supabaseUrl, supabaseKey)

/**
 * Test that all audio files match their corresponding messages in the database
 */
async function testAudioMessageMapping() {
  try {
    console.log('🧪 Testing audio file to message mapping...')
    
    const audioDir = path.join(process.cwd(), 'public', 'audio', 'love-notes')
    
    if (!fs.existsSync(audioDir)) {
      console.error('❌ Audio directory not found:', audioDir)
      return
    }
    
    // Get all audio files
    const files = fs.readdirSync(audioDir).filter(file => file.endsWith('.wav'))
    console.log(`📁 Found ${files.length} audio files to test`)
    
    // Group files by year
    const filesByYear = {}
    
    files.forEach(file => {
      const match = file.match(/david-(\d{4})-love-note-(\d+)\.wav/)
      if (match) {
        const year = parseInt(match[1])
        const messageId = parseInt(match[2])
        
        if (!filesByYear[year]) {
          filesByYear[year] = []
        }
        filesByYear[year].push({
          filename: file,
          messageId,
          year
        })
      }
    })
    
    console.log('📊 Files grouped by year:')
    Object.keys(filesByYear).forEach(year => {
      console.log(`  ${year}: ${filesByYear[year].length} files`)
    })
    
    let totalTests = 0
    let passedTests = 0
    let failedTests = 0
    const failedMappings = []
    
    // Test each year
    for (const year of Object.keys(filesByYear)) {
      console.log(`\n🔍 Testing year ${year}...`)
      
      const yearFiles = filesByYear[year]
      
      for (const file of yearFiles) {
        totalTests++
        
        try {
          // Query the database for this specific message_id
          const { data: messages, error } = await supabase
            .from('fulldata_set')
            .select('message_id, text, readable_date, is_from_me')
            .eq('message_id', file.messageId)
            .eq('is_from_me', '1')
            .limit(1)
          
          if (error) {
            console.error(`❌ Database error for message_id ${file.messageId}:`, error)
            failedTests++
            failedMappings.push({
              filename: file.filename,
              messageId: file.messageId,
              error: 'Database error',
              details: error.message
            })
            continue
          }
          
          if (!messages || messages.length === 0) {
            console.error(`❌ No message found for message_id ${file.messageId} (${file.filename})`)
            failedTests++
            failedMappings.push({
              filename: file.filename,
              messageId: file.messageId,
              error: 'No message found',
              details: 'Message does not exist in database'
            })
            continue
          }
          
          const message = messages[0]
          
          // Verify the message is from David (is_from_me = '1')
          if (message.is_from_me !== '1') {
            console.error(`❌ Message ${file.messageId} is not from David (is_from_me: ${message.is_from_me})`)
            failedTests++
            failedMappings.push({
              filename: file.filename,
              messageId: file.messageId,
              error: 'Not from David',
              details: `is_from_me: ${message.is_from_me}`
            })
            continue
          }
          
          // Verify the message date matches the year
          const messageYear = new Date(message.readable_date).getFullYear()
          if (messageYear !== parseInt(year)) {
            console.error(`❌ Message ${file.messageId} year mismatch: expected ${year}, got ${messageYear}`)
            failedTests++
            failedMappings.push({
              filename: file.filename,
              messageId: file.messageId,
              error: 'Year mismatch',
              details: `Expected: ${year}, Got: ${messageYear}`
            })
            continue
          }
          
          // Verify the message has content
          if (!message.text || message.text.trim().length === 0) {
            console.error(`❌ Message ${file.messageId} has no content`)
            failedTests++
            failedMappings.push({
              filename: file.filename,
              messageId: file.messageId,
              error: 'No content',
              details: 'Message text is empty'
            })
            continue
          }
          
          passedTests++
          console.log(`✅ ${file.filename} → message_id ${file.messageId} (${message.text.substring(0, 50)}...)`)
          
        } catch (error) {
          console.error(`❌ Error testing ${file.filename}:`, error)
          failedTests++
          failedMappings.push({
            filename: file.filename,
            messageId: file.messageId,
            error: 'Test error',
            details: error.message
          })
        }
      }
    }
    
    // Summary
    console.log('\n🎯 TESTING SUMMARY')
    console.log('==================')
    console.log(`📊 Total tests: ${totalTests}`)
    console.log(`✅ Passed: ${passedTests}`)
    console.log(`❌ Failed: ${failedTests}`)
    console.log(`📈 Success rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`)
    
    if (failedTests > 0) {
      console.log('\n❌ FAILED MAPPINGS:')
      console.log('==================')
      failedMappings.forEach(failure => {
        console.log(`  ${failure.filename} (message_id: ${failure.messageId})`)
        console.log(`    Error: ${failure.error}`)
        console.log(`    Details: ${failure.details}`)
        console.log('')
      })
    } else {
      console.log('\n🎉 ALL TESTS PASSED!')
      console.log('✅ All audio files correctly map to their corresponding messages')
    }
    
  } catch (error) {
    console.error('❌ Error during testing:', error)
  }
}

// Run the test
testAudioMessageMapping() 