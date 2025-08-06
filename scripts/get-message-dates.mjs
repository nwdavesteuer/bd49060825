#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Use the same Supabase credentials as the main app
const supabaseUrl = "https://fblwndzprmvjajayxjln.supabase.co"
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZibHduZHpwcm12amFqYXl4amxuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk0MjEwODAsImV4cCI6MjA2NDk5NzA4MH0.kUJ2La2IkvcX86_bnBbgI17VvqLvoKEhiTgqQrxF6zY"

const supabase = createClient(supabaseUrl, supabaseKey)

async function getMessageDates() {
  try {
    console.log('📅 Fetching message dates from Supabase database...')
    
    // Query the database for unique message dates
    const { data: messages, error } = await supabase
      .from('fulldata_set')
      .select('date')
      .not('date', 'is', null)
      .order('date', { ascending: true })
    
    if (error) {
      console.error('❌ Error fetching messages:', error)
      return new Set()
    }
    
    // Extract unique dates
    const uniqueDates = [...new Set(messages.map(msg => {
      try {
        // Handle different date formats
        let date
        if (typeof msg.date === 'string') {
          date = new Date(msg.date)
        } else if (typeof msg.date === 'number') {
          // Handle Apple timestamp format (nanoseconds since 2001-01-01)
          if (msg.date > 1000000000000000) {
            // Apple timestamp: convert from nanoseconds to milliseconds
            const appleEpoch = new Date('2001-01-01T00:00:00Z').getTime()
            const milliseconds = Math.floor(msg.date / 1000000)
            date = new Date(appleEpoch + milliseconds)
          } else if (msg.date > 1000000000000) {
            // Unix timestamp in milliseconds
            date = new Date(msg.date)
          } else {
            // Unix timestamp in seconds
            date = new Date(msg.date * 1000)
          }
        } else {
          date = new Date(msg.date)
        }
        
        // Check if date is valid
        if (isNaN(date.getTime())) {
          console.log(`⚠️  Invalid date: ${msg.date}`)
          return null
        }
        
        return date.toISOString().split('T')[0] // YYYY-MM-DD format
      } catch (error) {
        console.log(`⚠️  Error processing date: ${msg.date}`, error)
        return null
      }
    }).filter(date => date !== null))]
    
    console.log(`✅ Found ${uniqueDates.length} unique dates with messages`)
    
    // Save message dates to file for the photo organization script
    const messageDatesFile = path.join(__dirname, '../data/message-dates.json')
    const messageDatesData = {
      extractedAt: new Date().toISOString(),
      totalDates: uniqueDates.length,
      dates: uniqueDates
    }
    
    fs.writeFileSync(messageDatesFile, JSON.stringify(messageDatesData, null, 2))
    console.log(`📄 Message dates saved to: ${messageDatesFile}`)
    
    return new Set(uniqueDates)
  } catch (error) {
    console.error('❌ Error fetching message dates:', error)
    return new Set()
  }
}

async function main() {
  const messageDates = await getMessageDates()
  
  if (messageDates.size === 0) {
    console.log('❌ No message dates found in database')
    process.exit(1)
  }
  
  console.log('\n📊 Message dates found:')
  const sortedDates = Array.from(messageDates).sort()
  sortedDates.forEach(date => {
    console.log(`   ${date}`)
  })
  
  console.log('\n✅ Message dates extraction complete!')
  console.log('You can now run the photo organization script:')
  console.log('   node scripts/organize-photos.mjs /path/to/your/photos')
}

main().catch(console.error) 