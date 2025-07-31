import { createClient } from '@supabase/supabase-js'

// Supabase configuration
const supabaseUrl = 'https://fblwndzprmvjajayxjln.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZibHduZHpwcm12amFqYXl4amxuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk0MjEwODAsImV4cCI6MjA2NDk5NzA4MH0.kUJ2La2IkvcX86_bnBbgI17VvqLvoKEhiTgqQrxF6zY'
const supabase = createClient(supabaseUrl, supabaseKey)

const TABLE_NAME = 'fulldata_set'

async function debugMobileEmotions() {
  console.log('🔍 Debugging mobile app emotion data loading...')
  
  try {
    // Use the exact same query as the mobile app
    console.log('📊 Fetching data with mobile app query...')
    
    const { data: pageData, error: fetchError } = await supabase
      .from(TABLE_NAME)
      .select('message_id, text, readable_date, is_from_me, sender, recipient, has_attachments, attachments_info, emojis, links, service, account, contact_id, date, date_read, guid, primary_emotion, emotion_confidence, secondary_emotions, emotion_intensity, emotion_context, emotion_triggers, relationship_impact')
      .order("readable_date", { ascending: true })
      .range(0, 999) // First 1000 records
    
    if (fetchError) {
      console.error('❌ Fetch error:', fetchError)
      return
    }
    
    if (!pageData || pageData.length === 0) {
      console.log('❌ No data returned')
      return
    }
    
    console.log(`✅ Fetched ${pageData.length} messages`)
    
    // Debug first few messages
    console.log('\n🔍 First 5 messages:')
    pageData.slice(0, 5).forEach((msg, index) => {
      console.log(`\n${index + 1}. Message ID: ${msg.message_id}`)
      console.log(`   Text: "${msg.text?.substring(0, 50)}..."`)
      console.log(`   Date: ${msg.readable_date}`)
      console.log(`   Has primary_emotion field: ${'primary_emotion' in msg}`)
      console.log(`   Primary emotion: ${msg.primary_emotion || 'null'}`)
      console.log(`   Emotion confidence: ${msg.emotion_confidence || 'null'}`)
      console.log(`   All emotion fields: ${Object.keys(msg).filter(key => key.includes('emotion'))}`)
    })
    
    // Check emotion distribution
    const emotionStats = {}
    let totalWithEmotions = 0
    let neutralCount = 0
    
    pageData.forEach(msg => {
      if (msg.primary_emotion) {
        totalWithEmotions++
        if (msg.primary_emotion === 'neutral') {
          neutralCount++
        } else {
          emotionStats[msg.primary_emotion] = (emotionStats[msg.primary_emotion] || 0) + 1
        }
      }
    })
    
    console.log('\n📊 Emotion Analysis:')
    console.log(`Total messages: ${pageData.length}`)
    console.log(`Messages with emotions: ${totalWithEmotions}`)
    console.log(`Neutral messages: ${neutralCount}`)
    console.log(`Non-neutral emotions: ${Object.keys(emotionStats).length} types`)
    
    console.log('\n🎭 Emotion distribution:')
    Object.entries(emotionStats)
      .sort(([,a], [,b]) => b - a)
      .forEach(([emotion, count]) => {
        console.log(`  ${emotion}: ${count}`)
      })
    
    // Test emotion count calculation (same as mobile app)
    console.log('\n🧮 Testing emotion count calculation:')
    const counts = {
      love: 0, joy: 0, sweet: 0, support: 0, celebration: 0,
      deepTalks: 0, fights: 0, anxiety: 0, excitement: 0,
      sadness: 0, gratitude: 0, sexiness: 0, flirtation: 0,
      intimacy: 0, jealousy: 0, nostalgia: 0, surprise: 0,
      confusion: 0, relief: 0, longing: 0, playfulness: 0, neutral: 0
    }
    
    pageData.forEach(msg => {
      if (msg.primary_emotion && msg.primary_emotion in counts) {
        counts[msg.primary_emotion]++
      }
    })
    
    console.log('Final emotion counts:')
    Object.entries(counts).forEach(([emotion, count]) => {
      if (count > 0) {
        console.log(`  ${emotion}: ${count}`)
      }
    })
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

debugMobileEmotions().catch(console.error) 