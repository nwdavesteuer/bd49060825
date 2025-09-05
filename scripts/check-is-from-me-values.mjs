#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://fblwndzprmvjajayxjln.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZibHduZHpwcm12amFqYXl4amxuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk0MjEwODAsImV4cCI6MjA2NDk5NzA4MH0.kUJ2La2IkvcX86_bnBbgI17VvqLvoKEhiTgqQrxF6zY'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkIsFromMeValues() {
  console.log('🔍 Checking is_from_me field values')
  console.log('=' * 40)
  
  for (const year of [2016, 2017]) {
    console.log(`\n📅 Checking ${year}...`)
    
    const startDate = `${year}-01-01`
    const endDate = `${year}-12-31`
    
    try {
      // Get all messages and check is_from_me values
      const { data: messages, error } = await supabase
        .from('fulldata_set')
        .select('is_from_me, text, readable_date')
        .gte('readable_date', startDate)
        .lte('readable_date', endDate)
        .limit(10)
      
      if (error) {
        console.error(`❌ Error querying ${year}:`, error)
        continue
      }
      
      console.log(`📊 Found ${messages.length} messages in ${year}`)
      
      // Check unique values
      const uniqueValues = [...new Set(messages.map(m => m.is_from_me))]
      console.log(`🔍 Unique is_from_me values:`, uniqueValues)
      
      // Show sample messages
      console.log('📝 Sample messages:')
      messages.forEach((msg, i) => {
        console.log(`   ${i + 1}. is_from_me: "${msg.is_from_me}" (${typeof msg.is_from_me})`)
        console.log(`      Date: ${msg.readable_date}`)
        console.log(`      Text: ${(msg.text || '').substring(0, 50)}...`)
      })
      
    } catch (error) {
      console.error(`❌ Error processing ${year}:`, error.message)
    }
  }
}

checkIsFromMeValues().catch(console.error) 