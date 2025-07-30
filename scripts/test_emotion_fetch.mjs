import { createClient } from '@supabase/supabase-js'

// Supabase configuration
const supabaseUrl = 'https://fblwndzprmvjajayxjln.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZibHduZHpwcm12amFqYXl4amxuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk0MjEwODAsImV4cCI6MjA2NDk5NzA4MH0.kUJ2La2IkvcX86_bnBbgI17VvqLvoKEhiTgqQrxF6zY'
const supabase = createClient(supabaseUrl, supabaseKey)

const TABLE_NAME = 'fulldata_set'

async function testEmotionFetch() {
  console.log('🧪 Testing emotion data fetch...')
  
  try {
    // Test the exact same query as the mobile app
    console.log('📥 Fetching messages with select("*")...')
    const { data: messages, error } = await supabase
      .from(TABLE_NAME)
      .select("*")
      .order("readable_date", { ascending: true })
      .limit(10)
    
    if (error) {
      console.error('❌ Error fetching messages:', error)
      return
    }
    
    console.log(`✅ Fetched ${messages?.length || 0} messages`)
    
    if (messages && messages.length > 0) {
      console.log('\n🔍 Checking first 5 messages for emotion data:')
      messages.slice(0, 5).forEach((msg, index) => {
        console.log(`\n   Message ${index + 1}:`)
        console.log(`   ID: ${msg.message_id}`)
        console.log(`   Text: "${msg.text?.substring(0, 50)}..."`)
        console.log(`   Primary emotion: ${msg.primary_emotion || 'undefined'}`)
        console.log(`   Emotion confidence: ${msg.emotion_confidence || 'undefined'}`)
        console.log(`   Secondary emotions: ${JSON.stringify(msg.secondary_emotions) || 'undefined'}`)
        console.log(`   All emotion fields:`, {
          primary_emotion: msg.primary_emotion,
          emotion_confidence: msg.emotion_confidence,
          secondary_emotions: msg.secondary_emotions,
          emotion_intensity: msg.emotion_intensity,
          emotion_context: msg.emotion_context,
          emotion_triggers: msg.emotion_triggers,
          relationship_impact: msg.relationship_impact
        })
      })
      
      // Count messages with emotion data
      const withEmotions = messages.filter(msg => msg.primary_emotion && msg.primary_emotion !== 'neutral')
      console.log(`\n📊 Messages with emotions (excluding neutral): ${withEmotions.length}/${messages.length}`)
      
      if (withEmotions.length > 0) {
        console.log('\n🎯 Sample emotional messages:')
        withEmotions.slice(0, 3).forEach((msg, index) => {
          console.log(`   ${index + 1}. "${msg.text?.substring(0, 50)}..." -> ${msg.primary_emotion}`)
        })
      }
    }
    
  } catch (error) {
    console.error('❌ Fatal error:', error)
  }
}

// Run the test
testEmotionFetch().catch(console.error) 