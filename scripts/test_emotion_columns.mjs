import { createClient } from '@supabase/supabase-js'

// Supabase configuration
const supabaseUrl = 'https://fblwndzprmvjajayxjln.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZibHduZHpwcm12amFqYXl4amxuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk0MjEwODAsImV4cCI6MjA2NDk5NzA4MH0.kUJ2La2IkvcX86_bnBbgI17VvqLvoKEhiTgqQrxF6zY'
const supabase = createClient(supabaseUrl, supabaseKey)

const TABLE_NAME = 'fulldata_set'

async function testEmotionColumns() {
  console.log('🧠 Testing emotion columns in database...')
  
  try {
    // Test connection first
    console.log('📊 Testing database connection...')
    const { data: testData, error: testError } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .limit(1)
    
    if (testError) {
      console.error('❌ Error connecting to database:', testError)
      return
    }
    
    console.log('✅ Database connection successful!')
    
    // Check for emotion columns
    const emotionColumns = [
      'primary_emotion',
      'emotion_confidence', 
      'secondary_emotions',
      'emotion_intensity',
      'emotion_context',
      'emotion_triggers',
      'relationship_impact'
    ]
    
    console.log('🔍 Checking for emotion columns...')
    
    for (const column of emotionColumns) {
      try {
        const { data, error } = await supabase
          .from(TABLE_NAME)
          .select(column)
          .limit(1)
        
        if (error) {
          console.log(`❌ Column '${column}' NOT found: ${error.message}`)
        } else {
          console.log(`✅ Column '${column}' found`)
        }
      } catch (err) {
        console.log(`❌ Column '${column}' NOT found: ${err}`)
      }
    }
    
    // Check for existing emotion data
    console.log('\n📊 Checking for existing emotion data...')
    const { data: emotionData, error: emotionError } = await supabase
      .from(TABLE_NAME)
      .select('primary_emotion, emotion_confidence')
      .not('primary_emotion', 'is', null)
      .limit(5)
    
    if (emotionError) {
      console.log('❌ Error checking emotion data:', emotionError.message)
    } else if (emotionData && emotionData.length > 0) {
      console.log(`✅ Found ${emotionData.length} messages with emotion data`)
      console.log('📝 Sample emotion data:', emotionData[0])
    } else {
      console.log('⚠️  No emotion data found. You need to run the annotation script.')
    }
    
    // Provide next steps
    console.log('\n🎯 Next Steps:')
    console.log('1. If emotion columns are missing, add them using the SQL commands from add_emotion_columns.mjs')
    console.log('2. If columns exist but no data, run: node scripts/annotate_emotions.mjs')
    console.log('3. Test the emotions explorer at: http://localhost:3000/emotions-explorer')
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

// Run the test
testEmotionColumns().catch(console.error) 