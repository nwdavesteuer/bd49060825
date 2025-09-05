import { createClient } from '@supabase/supabase-js'

// Supabase configuration
const supabaseUrl = 'https://fblwndzprmvjajayxjln.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZibHduZHpwcm12amFqYXl4amxuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk0MjEwODAsImV4cCI6MjA2NDk5NzA4MH0.kUJ2La2IkvcX86_bnBbgI17VvqLvoKEhiTgqQrxF6zY'
const supabase = createClient(supabaseUrl, supabaseKey)

const TABLE_NAME = 'fulldata_set'

async function checkEmotionSchema() {
  console.log('🔍 Checking emotion schema in database...')
  
  try {
    // Test 1: Get a single record to see all available fields
    console.log('📋 Testing field availability...')
    const { data: sampleRecord, error: sampleError } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .limit(1)
    
    if (sampleError) {
      console.error('❌ Error fetching sample record:', sampleError)
      return
    }
    
    if (sampleRecord && sampleRecord.length > 0) {
      const record = sampleRecord[0]
      console.log('✅ Sample record fields:')
      console.log('   All keys:', Object.keys(record))
      
      // Check for emotion fields
      const emotionFields = ['primary_emotion', 'emotion_confidence', 'secondary_emotions', 'emotion_intensity', 'emotion_context', 'emotion_triggers', 'relationship_impact']
      
      console.log('\n🎭 Emotion field check:')
      emotionFields.forEach(field => {
        const hasField = field in record
        const value = record[field]
        console.log(`   ${field}: ${hasField ? '✅ EXISTS' : '❌ MISSING'} (value: ${value})`)
      })
    }
    
    // Test 2: Try explicit emotion field selection
    console.log('\n📥 Testing explicit emotion field selection...')
    const { data: emotionData, error: emotionError } = await supabase
      .from(TABLE_NAME)
      .select('message_id, text, primary_emotion, emotion_confidence')
      .limit(3)
    
    if (emotionError) {
      console.error('❌ Error with explicit emotion selection:', emotionError)
      return
    }
    
    if (emotionData && emotionData.length > 0) {
      console.log('✅ Explicit emotion selection results:')
      emotionData.forEach((msg, index) => {
        console.log(`   Message ${index + 1}:`, {
          id: msg.message_id,
          text: msg.text?.substring(0, 30),
          primary_emotion: msg.primary_emotion,
          emotion_confidence: msg.emotion_confidence
        })
      })
    }
    
  } catch (error) {
    console.error('❌ Fatal error:', error)
  }
}

// Run the check
checkEmotionSchema().catch(console.error) 