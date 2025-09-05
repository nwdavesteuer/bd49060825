import { createClient } from '@supabase/supabase-js'

// Supabase configuration
const supabaseUrl = 'https://fblwndzprmvjajayxjln.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZibHduZHpwcm12amFqYXl4amxuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk0MjEwODAsImV4cCI6MjA2NDk5NzA4MH0.kUJ2La2IkvcX86_bnBbgI17VvqLvoKEhiTgqQrxF6zY'
const supabase = createClient(supabaseUrl, supabaseKey)

const TABLE_NAME = 'fulldata_set'

async function debugEmotions() {
  console.log('🔍 Debugging emotion data in database...')
  
  try {
    // Check total count
    const { count: totalCount, error: countError } = await supabase
      .from(TABLE_NAME)
      .select("*", { count: "exact", head: true })
    
    if (countError) {
      console.error('❌ Error getting total count:', countError)
      return
    }
    
    console.log(`📊 Total messages in database: ${totalCount}`)
    
    // Check messages with emotion data
    const { data: emotionData, error: emotionError } = await supabase
      .from(TABLE_NAME)
      .select('message_id, text, primary_emotion, emotion_confidence, secondary_emotions')
      .not('primary_emotion', 'is', null)
      .limit(10)
    
    if (emotionError) {
      console.error('❌ Error fetching emotion data:', emotionError)
      return
    }
    
    console.log(`📝 Messages with emotion data: ${emotionData?.length || 0}`)
    
    if (emotionData && emotionData.length > 0) {
      console.log('\n🔍 Sample messages with emotions:')
      emotionData.forEach((msg, index) => {
        console.log(`\n   Sample ${index + 1}:`)
        console.log(`   ID: ${msg.message_id}`)
        console.log(`   Text: "${msg.text?.substring(0, 50)}..."`)
        console.log(`   Primary: ${msg.primary_emotion} (${Math.round(msg.emotion_confidence * 100)}%)`)
        console.log(`   Secondary: [${msg.secondary_emotions?.join(', ')}]`)
      })
    }
    
    // Count emotions
    const { data: emotionCounts, error: countError2 } = await supabase
      .from(TABLE_NAME)
      .select('primary_emotion')
      .not('primary_emotion', 'is', null)
    
    if (countError2) {
      console.error('❌ Error counting emotions:', countError2)
      return
    }
    
    if (emotionCounts) {
      const emotionStats = {}
      emotionCounts.forEach(msg => {
        const emotion = msg.primary_emotion
        emotionStats[emotion] = (emotionStats[emotion] || 0) + 1
      })
      
      console.log('\n📈 Emotion distribution:')
      Object.entries(emotionStats)
        .sort(([,a], [,b]) => b - a)
        .forEach(([emotion, count]) => {
          console.log(`   ${emotion}: ${count} messages`)
        })
    }
    
    // Check for specific emotions
    const emotionsToCheck = ['love', 'joy', 'sweet', 'support', 'celebration', 'fights', 'anxiety', 'excitement', 'sadness', 'gratitude', 'sexiness', 'flirtation', 'intimacy', 'jealousy', 'nostalgia', 'surprise', 'confusion', 'relief', 'longing', 'playfulness']
    
    console.log('\n🔍 Checking specific emotions:')
    for (const emotion of emotionsToCheck) {
      const { count, error } = await supabase
        .from(TABLE_NAME)
        .select('*', { count: 'exact', head: true })
        .eq('primary_emotion', emotion)
      
      if (error) {
        console.log(`   ${emotion}: Error - ${error.message}`)
      } else {
        console.log(`   ${emotion}: ${count} messages`)
      }
    }
    
  } catch (error) {
    console.error('❌ Fatal error:', error)
  }
}

// Run the debug
debugEmotions().catch(console.error) 