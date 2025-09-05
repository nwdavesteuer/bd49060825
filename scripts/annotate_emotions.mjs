import { createClient } from '@supabase/supabase-js'
import { EmotionAnalyzer, createMessageContext } from '../emotion_analyzer.js'

// Supabase configuration
const supabaseUrl = 'https://fblwndzprmvjajayxjln.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZibHduZHpwcm12amFqYXl4amxuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk0MjEwODAsImV4cCI6MjA2NDk5NzA4MH0.kUJ2La2IkvcX86_bnBbgI17VvqLvoKEhiTgqQrxF6zY'
const supabase = createClient(supabaseUrl, supabaseKey)

const TABLE_NAME = 'fulldata_set'

async function annotateEmotions() {
  console.log('🧠 Starting emotion annotation process...')
  
  const analyzer = new EmotionAnalyzer()
  let processedCount = 0
  let updatedCount = 0
  let errorCount = 0
  
  try {
    // Test connection and check if emotion columns exist
    console.log('📊 Testing database connection and checking emotion columns...')
    const { data: testData, error: testError } = await supabase
      .from(TABLE_NAME)
      .select('primary_emotion, emotion_confidence')
      .limit(1)
    
    if (testError) {
      console.log('❌ Emotion columns not found. Error:', testError.message)
      console.log('💡 Please add the emotion columns to your database first:')
      console.log('   - primary_emotion (text)')
      console.log('   - emotion_confidence (numeric)')
      console.log('   - secondary_emotions (text[])')
      console.log('   - emotion_intensity (numeric)')
      console.log('   - emotion_context (text)')
      console.log('   - emotion_triggers (text[])')
      console.log('   - relationship_impact (text)')
      console.log('')
      console.log('🔧 Use these SQL commands in your Supabase SQL Editor:')
      console.log('ALTER TABLE fulldata_set ADD COLUMN primary_emotion text;')
      console.log('ALTER TABLE fulldata_set ADD COLUMN emotion_confidence numeric;')
      console.log('ALTER TABLE fulldata_set ADD COLUMN secondary_emotions text[];')
      console.log('ALTER TABLE fulldata_set ADD COLUMN emotion_intensity numeric;')
      console.log('ALTER TABLE fulldata_set ADD COLUMN emotion_context text;')
      console.log('ALTER TABLE fulldata_set ADD COLUMN emotion_triggers text[];')
      console.log('ALTER TABLE fulldata_set ADD COLUMN relationship_impact text;')
      return
    }
    
    console.log('✅ Emotion columns found! Proceeding with annotation...')
    
    // Fetch all messages in batches
    console.log('📥 Fetching all messages for emotion analysis...')
    let page = 0
    const pageSize = 1000
    let hasMore = true
    
    while (hasMore) {
      console.log(`\n📄 Processing page ${page + 1}...`)
      
      const { data: messages, error: fetchError } = await supabase
        .from(TABLE_NAME)
        .select('*')
        .range(page * pageSize, (page + 1) * pageSize - 1)
        .order('readable_date', { ascending: true })
      
      if (fetchError) {
        console.error('❌ Error fetching messages:', fetchError)
        break
      }
      
      if (!messages || messages.length === 0) {
        console.log('✅ No more messages to process')
        break
      }
      
      console.log(`📝 Processing ${messages.length} messages...`)
      
      // Process each message
      for (let i = 0; i < messages.length; i++) {
        const message = messages[i]
        processedCount++
        
        try {
          // Skip if no text content
          if (!message.text || message.text.trim() === '') {
            continue
          }
          
          // Create message context
          const context = createMessageContext(
            message.text,
            message.readable_date,
            message.sender || '',
            message.is_from_me === 1
          )
          
          // Analyze emotion
          const analysis = analyzer.analyzeEmotion(context)
          
          // Prepare update data
          const updateData = {
            primary_emotion: analysis.primaryEmotion,
            emotion_confidence: analysis.confidence,
            secondary_emotions: analysis.secondaryEmotions,
            emotion_intensity: analysis.intensity,
            emotion_context: analysis.context,
            emotion_triggers: analysis.triggers,
            relationship_impact: analysis.relationshipImpact
          }
          
          // Update the message with emotion data
          const { error: updateError } = await supabase
            .from(TABLE_NAME)
            .update(updateData)
            .eq('message_id', message.message_id)
          
          if (updateError) {
            console.error(`❌ Error updating message ${message.message_id}:`, updateError)
            errorCount++
          } else {
            updatedCount++
            
            // Progress indicator
            if (updatedCount % 100 === 0) {
              console.log(`✅ Updated ${updatedCount} messages so far...`)
            }
          }
          
        } catch (error) {
          console.error(`❌ Error processing message ${message.message_id}:`, error)
          errorCount++
        }
      }
      
      page++
      
      // Add a small delay to avoid overwhelming the database
      await new Promise(resolve => setTimeout(resolve, 100))
      
    }
    
    console.log('\n🎉 Emotion annotation complete!')
    console.log(`📊 Summary:`)
    console.log(`   - Processed: ${processedCount} messages`)
    console.log(`   - Updated: ${updatedCount} messages`)
    console.log(`   - Errors: ${errorCount} messages`)
    console.log(`   - Success rate: ${((updatedCount / processedCount) * 100).toFixed(1)}%`)
    
    // Show some sample results
    console.log('\n🔍 Sample emotion analysis results:')
    const { data: samples } = await supabase
      .from(TABLE_NAME)
      .select('text, primary_emotion, emotion_confidence, secondary_emotions, emotion_intensity')
      .not('primary_emotion', 'is', null)
      .limit(5)
    
    if (samples) {
      samples.forEach((sample, index) => {
        console.log(`\n   Sample ${index + 1}:`)
        console.log(`   Text: "${sample.text?.substring(0, 50)}..."`)
        console.log(`   Primary: ${sample.primary_emotion} (${Math.round(sample.emotion_confidence * 100)}%)`)
        console.log(`   Secondary: [${sample.secondary_emotions?.join(', ')}]`)
        console.log(`   Intensity: ${sample.emotion_intensity}/5`)
      })
    }
    
  } catch (error) {
    console.error('❌ Fatal error:', error)
  }
}

// Run the annotation
annotateEmotions().catch(console.error) 