import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const supabaseUrl = 'https://fblwndzprmvjajayxjln.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZibHduZHpwcm12amFqYXl4amxuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk0MjEwODAsImV4cCI6MjA2NDk5NzA4MH0.kUJ2La2IkvcX86_bnBbgI17VvqLvoKEhiTgqQrxF6zY'
const supabase = createClient(supabaseUrl, supabaseKey)

async function verifyAudioMapping() {
  console.log('🔍 Verifying audio file mapping...\n')

  // Get all audio files
  const audioDir = path.join(__dirname, '..', 'public', 'audio', 'love-notes')
  const audioFiles = fs.readdirSync(audioDir).filter(f => f.endsWith('.wav'))
  
  console.log(`📁 Found ${audioFiles.length} audio files\n`)

  // Parse audio files to extract year and message ID
  const audioMap = {}
  audioFiles.forEach(filename => {
    const match = filename.match(/david-(\d{4})-love-note-(\d+)\.wav/)
    if (match) {
      const year = match[1]
      const messageId = match[2]
      if (!audioMap[year]) audioMap[year] = []
      audioMap[year].push(parseInt(messageId))
    }
  })

  // Check each year
  for (const year of Object.keys(audioMap).sort()) {
    console.log(`\n📅 Year ${year}: ${audioMap[year].length} audio files`)
    
    // Get first 5 message IDs for this year
    const sampleIds = audioMap[year].slice(0, 5)
    console.log(`Sample message IDs with audio: ${sampleIds.join(', ')}`)
    
    // Query database for these specific messages
    const { data: messages, error } = await supabase
      .from('fulldata_set')
      .select('message_id, readable_date, is_from_me, text')
      .in('message_id', sampleIds)
      .order('readable_date', { ascending: true })
    
    if (error) {
      console.error(`Error querying year ${year}:`, error)
      continue
    }
    
    console.log(`Found ${messages.length} of ${sampleIds.length} messages in database`)
    
    // Show what we found
    messages.forEach(msg => {
      const audioFile = `david-${year}-love-note-${msg.message_id}.wav`
      const exists = audioFiles.includes(audioFile)
      console.log(`  ID ${msg.message_id}: ${exists ? '✅' : '❌'} ${msg.readable_date.substring(0, 10)} - "${msg.text?.substring(0, 40)}..."`)
    })
    
    // Check for missing messages
    const foundIds = messages.map(m => m.message_id)
    const missingIds = sampleIds.filter(id => !foundIds.includes(id))
    if (missingIds.length > 0) {
      console.log(`  ⚠️  Message IDs not found in database: ${missingIds.join(', ')}`)
    }
  }
  
  // Now test a specific date range where we know there should be audio
  console.log('\n\n🎯 Testing July 28, 2015 (where we expect audio files):')
  
  const { data: july2015, error: julyError } = await supabase
    .from('fulldata_set')
    .select('message_id, readable_date, is_from_me, text')
    .eq('is_from_me', '1')
    .gte('readable_date', '2015-07-28T00:00:00Z')
    .lte('readable_date', '2015-07-28T23:59:59Z')
    .order('readable_date', { ascending: true })
  
  if (julyError) {
    console.error('Error:', julyError)
  } else {
    console.log(`Found ${july2015.length} messages from David on July 28, 2015`)
    
    july2015.forEach(msg => {
      const audioFile = `david-2015-love-note-${msg.message_id}.wav`
      const exists = audioFiles.includes(audioFile)
      console.log(`  ID ${msg.message_id}: ${exists ? '✅ Has audio' : '❌ No audio'} - "${msg.text?.substring(0, 50)}..."`)
    })
  }
}

verifyAudioMapping()