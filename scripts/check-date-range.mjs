#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'

// Create Supabase client
const supabaseUrl = 'https://fblwndzprmvjajayxjln.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZibHduZHpwcm12amFqYXl4amxuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk0MjEwODAsImV4cCI6MjA2NDk5NzA4MH0.kUJ2La2IkvcX86_bnBbgI17VvqLvoKEhiTgqQrxF6zY'
const supabase = createClient(supabaseUrl, supabaseKey)

console.log('📅 Checking Date Range in Database')
console.log('')

async function checkDateRange() {
  try {
    // Check all messages from David to Nitzan
    const { data: messages, error } = await supabase
      .from('fulldata_set')
      .select('readable_date, text')
      .eq('is_from_me', '1')
      .eq('recipient', 'Nitzan')
      .not('text', 'is', null)
      .not('text', 'eq', '')
      .order('readable_date', { ascending: true })

    if (error) {
      console.error('❌ Database error:', error)
      return
    }

    console.log(`📊 Found ${messages.length} messages from David to Nitzan`)
    
    if (messages.length > 0) {
      const dates = messages.map(m => new Date(m.readable_date))
      const earliest = new Date(Math.min(...dates))
      const latest = new Date(Math.max(...dates))
      
      console.log(`📅 Date range: ${earliest.toLocaleDateString()} to ${latest.toLocaleDateString()}`)
      console.log(`📅 Earliest message: ${earliest.toISOString()}`)
      console.log(`📅 Latest message: ${latest.toISOString()}`)
      
      // Show some sample messages from different years
      console.log('\n📝 Sample messages by year:')
      const byYear = {}
      messages.forEach(msg => {
        const year = new Date(msg.readable_date).getFullYear()
        if (!byYear[year]) byYear[year] = []
        byYear[year].push(msg)
      })
      
      Object.keys(byYear).sort().forEach(year => {
        console.log(`${year}: ${byYear[year].length} messages`)
        if (byYear[year].length > 0) {
          const sample = byYear[year][0]
          console.log(`   Sample: ${sample.text.substring(0, 80)}...`)
        }
      })
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

checkDateRange() 