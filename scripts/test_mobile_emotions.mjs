import { createClient } from '@supabase/supabase-js'

// Supabase configuration
const supabaseUrl = 'https://fblwndzprmvjajayxjln.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZibHduZHpwcm12amFqYXl4amxuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk0MjEwODAsImV4cCI6MjA2NDk5NzA4MH0.kUJ2La2IkvcX86_bnBbgI17VvqLvoKEhiTgqQrxF6zY'
const supabase = createClient(supabaseUrl, supabaseKey)

const TABLE_NAME = 'fulldata_set'

async function testMobileEmotions() {
  console.log('🧠 Testing mobile messages emotion data...')
  
  try {
    // Fetch a sample of messages with the same query as mobile app
    console.log('📊 Fetching messages with emotion data...')
    
    const { data: messages, error } = await supabase
      .from(TABLE_NAME)
      .select('message_id, text, readable_date, is_from_me, sender, recipient, has_attachments, attachments_info, emojis, links, service, account, contact_id, date, date_read, guid, primary_emotion, emotion_confidence, secondary_emotions, emotion_intensity, emotion_context, emotion_triggers, relationship_impact')
      .order("readable_date", { ascending: true })
      .limit(100)
    
    if (error) {
      console.error('❌ Error fetching data:', error)
      return
    }
    
    if (!messages || messages.length === 0) {
      console.log('❌ No messages found')
      return
    }
    
    console.log(`✅ Fetched ${messages.length} messages`)
    
    // Analyze emotion data
    const emotionStats = {
      total: messages.length,
      withEmotions: 0,
      withHighConfidence: 0,
      emotionDistribution: {},
      confidenceDistribution: { low: 0, medium: 0, high: 0 },
      sampleMessages: []
    }
    
    messages.forEach((msg, index) => {
      // Check for emotion data
      if (msg.primary_emotion) {
        emotionStats.withEmotions++
        
        // Count emotion types
        const emotion = msg.primary_emotion
        emotionStats.emotionDistribution[emotion] = (emotionStats.emotionDistribution[emotion] || 0) + 1
        
        // Check confidence levels
        const confidence = msg.emotion_confidence || 0
        if (confidence > 0.3) {
          emotionStats.withHighConfidence++
        }
        
        if (confidence < 0.1) emotionStats.confidenceDistribution.low++
        else if (confidence < 0.3) emotionStats.confidenceDistribution.medium++
        else emotionStats.confidenceDistribution.high++
        
        // Store sample messages with emotions
        if (emotionStats.sampleMessages.length < 5) {
          emotionStats.sampleMessages.push({
            id: msg.message_id,
            text: msg.text?.substring(0, 50),
            emotion: msg.primary_emotion,
            confidence: msg.emotion_confidence,
            intensity: msg.emotion_intensity
          })
        }
      }
    })
    
    // Display results
    console.log('\n📊 Emotion Analysis Results:')
    console.log(`Total messages: ${emotionStats.total}`)
    console.log(`Messages with emotions: ${emotionStats.withEmotions} (${((emotionStats.withEmotions / emotionStats.total) * 100).toFixed(1)}%)`)
    console.log(`Messages with high confidence (>30%): ${emotionStats.withHighConfidence}`)
    
    console.log('\n🎭 Emotion Distribution:')
    Object.entries(emotionStats.emotionDistribution)
      .sort(([,a], [,b]) => b - a)
      .forEach(([emotion, count]) => {
        console.log(`  ${emotion}: ${count}`)
      })
    
    console.log('\n📈 Confidence Distribution:')
    console.log(`  Low (<10%): ${emotionStats.confidenceDistribution.low}`)
    console.log(`  Medium (10-30%): ${emotionStats.confidenceDistribution.medium}`)
    console.log(`  High (>30%): ${emotionStats.confidenceDistribution.high}`)
    
    console.log('\n📝 Sample Messages with Emotions:')
    emotionStats.sampleMessages.forEach((msg, index) => {
      console.log(`  ${index + 1}. "${msg.text}..."`)
      console.log(`     Emotion: ${msg.emotion} (${(msg.confidence * 100).toFixed(1)}% conf, intensity: ${msg.intensity})`)
    })
    
    // Test emotion filtering logic
    console.log('\n🔍 Testing Emotion Filtering Logic:')
    const testEmotions = ['love', 'joy', 'sadness', 'anger', 'neutral']
    
    testEmotions.forEach(emotion => {
      const matchingMessages = messages.filter(msg => 
        msg.primary_emotion === emotion || 
        (msg.secondary_emotions && msg.secondary_emotions.includes(emotion))
      )
      console.log(`  ${emotion}: ${matchingMessages.length} messages`)
    })
    
    // Check if any messages would show emotion indicators (>30% confidence)
    const highConfidenceMessages = messages.filter(msg => 
      msg.primary_emotion && msg.emotion_confidence > 0.3
    )
    console.log(`\n💡 Messages that would show emotion indicators: ${highConfidenceMessages.length}`)
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

// Run the test
testMobileEmotions().catch(console.error) 