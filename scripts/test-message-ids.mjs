#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://fblwndzprmvjajayxjln.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZibHduZHpwcm12amFqYXl4amxuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk0MjEwODAsImV4cCI6MjA2NDk5NzA4MH0.kUJ2La2IkvcX86_bnBbgI17VvqLvoKEhiTgqQrxF6zY'
const supabase = createClient(supabaseUrl, supabaseKey)

async function testMessageIds() {
  console.log('🔍 Testing message IDs in database...\n')
  
  // Get some messages from 2015
  const { data, error } = await supabase
    .from('fulldata_set')
    .select('message_id, text, readable_date, is_from_me')
    .eq('is_from_me', '1')
    .gte('readable_date', '2015-07-01')
    .lte('readable_date', '2015-07-31')
    .not('text', 'is', null)
    .order('readable_date', { ascending: true })
    .limit(20)
  
  if (error) {
    console.error('Error:', error)
    return
  }
  
  console.log(`Found ${data.length} messages from July 2015\n`)
  
  // Check which ones have audio files
  const audioIds = [176274, 176305, 176307, 176312, 176322]
  
  console.log('Messages with audio files:')
  data.forEach(msg => {
    const hasAudio = audioIds.includes(msg.message_id)
    const emoji = hasAudio ? '✅' : '❌'
    console.log(`${emoji} ID: ${msg.message_id}, Date: ${msg.readable_date.substring(0, 10)}, Text: ${msg.text?.substring(0, 40)}...`)
  })
  
  console.log('\n📊 Summary:')
  const withAudio = data.filter(msg => audioIds.includes(msg.message_id))
  console.log(`- Messages with audio: ${withAudio.length}`)
  console.log(`- Total messages: ${data.length}`)
  
  if (withAudio.length > 0) {
    console.log('\n🎵 Audio file names for these messages:')
    withAudio.forEach(msg => {
      const year = new Date(msg.readable_date).getFullYear()
      console.log(`  david-${year}-love-note-${msg.message_id}.wav`)
    })
  }
}

testMessageIds()