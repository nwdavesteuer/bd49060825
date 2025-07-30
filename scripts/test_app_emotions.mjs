import { createClient } from '@supabase/supabase-js'

// Supabase configuration (same as in lib/supabase.ts)
const supabaseUrl = 'https://fblwndzprmvjajayxjln.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZibHduZHpwcm12amFqYXl4amxuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk0MjEwODAsImV4cCI6MjA2NDk5NzA4MH0.kUJ2La2IkvcX86_bnBbgI17VvqLvoKEhiTgqQrxF6zY'
const supabase = createClient(supabaseUrl, supabaseKey)

const TABLE_NAME = 'fulldata_set'

async function testAppEmotions() {
  console.log('🧪 Testing app emotion fetching...')
  
  try {
    // Simulate the exact same query as the mobile app
    console.log('📥 Fetching messages like the app does...')
    
    // Step 1: Get count
    const { count: exactCount, error: countError } = await supabase
      .from(TABLE_NAME)
      .select("*", { count: "exact", head: true })
    
    if (countError) {
      console.error('❌ Count error:', countError)
      return
    }
    
    console.log(`📊 Total messages in database: ${exactCount}`)
    
    // Step 2: Fetch messages with pagination (like the app)
    let allData = []
    let hasMore = true
    let page = 0
    const pageSize = 1000
    
    while (hasMore && page < 3) { // Just get first 3 pages for testing
      console.log(`📄 Fetching page ${page + 1}...`)
      const { data: pageData, error: fetchError } = await supabase
        .from(TABLE_NAME)
        .select("*")
        .order("readable_date", { ascending: true })
        .range(page * pageSize, (page + 1) * pageSize - 1)
      
      if (fetchError) {
        console.error('❌ Page fetch error:', fetchError)
        break
      }
      
      if (pageData && pageData.length > 0) {
        allData = allData.concat(pageData)
        console.log(`✅ Page ${page + 1} loaded: ${pageData.length} records`)
        page++
      } else {
        hasMore = false
      }
    }
    
    console.log(`📦 Total fetched: ${allData.length} messages`)
    
    // Step 3: Analyze emotion data
    if (allData.length > 0) {
      console.log('\n🎭 Analyzing emotion data...')
      
      // Count emotions
      const emotionStats = {}
      let neutralCount = 0
      let messagesWithEmotions = 0
      
      allData.forEach(msg => {
        if (msg.primary_emotion) {
          if (msg.primary_emotion === 'neutral') {
            neutralCount++
          } else {
            emotionStats[msg.primary_emotion] = (emotionStats[msg.primary_emotion] || 0) + 1
            messagesWithEmotions++
          }
        }
      })
      
      console.log(`📊 Emotion Analysis:`)
      console.log(`   Total messages: ${allData.length}`)
      console.log(`   Messages with emotions: ${messagesWithEmotions}`)
      console.log(`   Neutral messages: ${neutralCount}`)
      console.log(`   Messages with emotion data: ${messagesWithEmotions + neutralCount}`)
      
      console.log('\n📈 Emotion distribution:')
      Object.entries(emotionStats)
        .sort(([,a], [,b]) => b - a)
        .forEach(([emotion, count]) => {
          console.log(`   ${emotion}: ${count} messages`)
        })
      
      // Check specific emotions that should appear in UI
      const uiEmotions = ['love', 'joy', 'sweet', 'support', 'celebration', 'fights', 'anxiety', 'excitement', 'sadness', 'gratitude', 'sexiness', 'flirtation', 'intimacy', 'jealousy', 'nostalgia', 'surprise', 'confusion', 'relief', 'longing', 'playfulness']
      
      console.log('\n🎯 UI Emotion Counts (what should show in app):')
      uiEmotions.forEach(emotion => {
        const count = emotionStats[emotion] || 0
        console.log(`   ${emotion}: ${count}`)
      })
      
      // Show sample emotional messages
      const sampleEmotional = allData.find(msg => 
        msg.primary_emotion && 
        msg.primary_emotion !== 'neutral' && 
        msg.text
      )
      
      if (sampleEmotional) {
        console.log('\n💡 Sample emotional message:')
        console.log(`   Text: "${sampleEmotional.text?.substring(0, 50)}..."`)
        console.log(`   Emotion: ${sampleEmotional.primary_emotion}`)
        console.log(`   Confidence: ${sampleEmotional.emotion_confidence}`)
      }
    }
    
  } catch (error) {
    console.error('❌ Fatal error:', error)
  }
}

// Run the test
testAppEmotions().catch(console.error) 