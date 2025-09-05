import { createClient } from '@supabase/supabase-js'

// Supabase configuration
const supabaseUrl = 'https://fblwndzprmvjajayxjln.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZibHduZHpwcm12amFqYXl4amxuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk0MjEwODAsImV4cCI6MjA2NDk5NzA4MH0.kUJ2La2IkvcX86_bnBbgI17VvqLvoKEhiTgqQrxF6zY'
const supabase = createClient(supabaseUrl, supabaseKey)

const TABLE_NAME = 'fulldata_set'

async function addEmotionColumns() {
  console.log('🔧 Adding emotion annotation columns to database...')
  
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
    
    // Define emotion columns to add
    const emotionColumns = [
      {
        name: 'primary_emotion',
        type: 'text',
        description: 'Primary emotion detected in the message'
      },
      {
        name: 'emotion_confidence',
        type: 'numeric',
        description: 'Confidence score (0-1) for the emotion detection'
      },
      {
        name: 'secondary_emotions',
        type: 'text[]',
        description: 'Array of secondary emotions detected'
      },
      {
        name: 'emotion_intensity',
        type: 'numeric',
        description: 'Emotion intensity score (1-5)'
      },
      {
        name: 'emotion_context',
        type: 'text',
        description: 'Context information (late_night, long_message, etc.)'
      },
      {
        name: 'emotion_triggers',
        type: 'text[]',
        description: 'Array of triggers that influenced the emotion'
      },
      {
        name: 'relationship_impact',
        type: 'text',
        description: 'Impact on relationship (positive, negative, neutral, complex)'
      }
    ]
    
    console.log(`📝 Need to add ${emotionColumns.length} emotion columns to the database:`)
    emotionColumns.forEach(col => {
      console.log(`   - ${col.name} (${col.type}): ${col.description}`)
    })
    
    console.log('\n⚠️  IMPORTANT: You need to add these columns manually in your Supabase dashboard!')
    console.log('📋 Here are the SQL commands to run in your Supabase SQL editor:')
    console.log('')
    
    emotionColumns.forEach(col => {
      let sqlType = col.type
      if (col.type === 'text[]') {
        sqlType = 'text[]'
      } else if (col.type === 'numeric') {
        sqlType = 'numeric'
      }
      
      console.log(`ALTER TABLE ${TABLE_NAME} ADD COLUMN ${col.name} ${sqlType};`)
    })
    
    console.log('')
    console.log('🔧 Steps to add columns:')
    console.log('1. Go to your Supabase dashboard')
    console.log('2. Navigate to the SQL Editor')
    console.log('3. Run the ALTER TABLE commands above')
    console.log('4. Come back and run the emotion annotation script')
    console.log('')
    console.log('💡 Or you can add them through the Table Editor:')
    console.log('1. Go to Table Editor')
    console.log('2. Select the fulldata_set table')
    console.log('3. Click "Add column" for each missing column')
    console.log('4. Set the appropriate data types')
    console.log('')
    console.log('🎯 After adding the columns, run: node scripts/annotate_emotions.mjs')
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

// Run the column addition
addEmotionColumns().catch(console.error) 