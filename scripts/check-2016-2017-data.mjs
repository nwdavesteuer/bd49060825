#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://fblwndzprmvjajayxjln.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZibHduZHpwcm12amFqYXl4amxuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk0MjEwODAsImV4cCI6MjA2NDk5NzA4MH0.kUJ2La2IkvcX86_bnBbgI17VvqLvoKEhiTgqQrxF6zY'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkData() {
  console.log('🔍 Checking 2016 and 2017 data availability')
  console.log('=' * 50)
  
  for (const year of [2016, 2017]) {
    console.log(`\n📅 Checking ${year}...`)
    
    const startDate = `${year}-01-01`
    const endDate = `${year}-12-31`
    
    try {
      // Check all messages first
      const { data: allMessages, error: allError } = await supabase
        .from('fulldata_set')
        .select('*')
        .gte('readable_date', startDate)
        .lte('readable_date', endDate)
        .limit(5)
      
      if (allError) {
        console.error(`❌ Error querying ${year}:`, allError)
        continue
      }
      
      console.log(`📊 Total messages in ${year}: ${allMessages.length} (sampled)`)
      
      if (allMessages.length > 0) {
        console.log('📝 Sample messages:')
        allMessages.forEach((msg, i) => {
          console.log(`   ${i + 1}. Date: ${msg.readable_date}`)
          console.log(`      From: ${msg.is_from_me ? 'David' : 'Other'}`)
          console.log(`      Text: ${(msg.text || '').substring(0, 50)}...`)
        })
      }
      
      // Check David's messages specifically
      const { data: davidMessages, error: davidError } = await supabase
        .from('fulldata_set')
        .select('*')
        .eq('is_from_me', true)
        .gte('readable_date', startDate)
        .lte('readable_date', endDate)
        .limit(5)
      
      if (davidError) {
        console.error(`❌ Error querying David's messages in ${year}:`, davidError)
        continue
      }
      
      console.log(`📊 David's messages in ${year}: ${davidMessages.length} (sampled)`)
      
      if (davidMessages.length > 0) {
        console.log('📝 Sample David messages:')
        davidMessages.forEach((msg, i) => {
          console.log(`   ${i + 1}. Date: ${msg.readable_date}`)
          console.log(`      Text: ${(msg.text || '').substring(0, 100)}...`)
        })
      }
      
      // Check date range
      const { data: dateRange, error: rangeError } = await supabase
        .from('fulldata_set')
        .select('readable_date')
        .gte('readable_date', startDate)
        .lte('readable_date', endDate)
        .order('readable_date', { ascending: true })
        .limit(1)
      
      if (!rangeError && dateRange.length > 0) {
        console.log(`📅 Earliest date in ${year}: ${dateRange[0].readable_date}`)
      }
      
    } catch (error) {
      console.error(`❌ Error processing ${year}:`, error.message)
    }
  }
  
  console.log('\n🔍 Checking table structure...')
  
  try {
    // Check what columns are available
    const { data: sample, error } = await supabase
      .from('fulldata_set')
      .select('*')
      .limit(1)
    
    if (!error && sample.length > 0) {
      console.log('📋 Available columns:', Object.keys(sample[0]))
    }
    
  } catch (error) {
    console.error('❌ Error checking table structure:', error.message)
  }
}

checkData().catch(console.error) 