import { createClient } from '@supabase/supabase-js'

// Supabase configuration
const supabaseUrl = 'https://fblwndzprmvjajayxjln.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZibHduZHpwcm12amFqYXl4amxuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk0MjEwODAsImV4cCI6MjA2NDk5NzA4MH0.kUJ2La2IkvcX86_bnBbgI17VvqLvoKEhiTgqQrxF6zY'
const supabase = createClient(supabaseUrl, supabaseKey)

const TABLE_NAME = 'fulldata_set'

async function addEmotionColumnsDirect() {
  console.log('🔧 Attempting to add emotion columns directly...')
  
  const columnsToAdd = [
    { name: 'primary_emotion', type: 'text' },
    { name: 'emotion_confidence', type: 'numeric' },
    { name: 'secondary_emotions', type: 'text[]' },
    { name: 'emotion_intensity', type: 'numeric' },
    { name: 'emotion_context', type: 'text' },
    { name: 'emotion_triggers', type: 'text[]' },
    { name: 'relationship_impact', type: 'text' }
  ]
  
  for (const column of columnsToAdd) {
    try {
      console.log(`📝 Adding column: ${column.name} (${column.type})...`)
      
      // Try to add the column using a raw SQL query
      const { error } = await supabase.rpc('exec_sql', {
        sql: `ALTER TABLE ${TABLE_NAME} ADD COLUMN IF NOT EXISTS ${column.name} ${column.type};`
      })
      
      if (error) {
        console.log(`⚠️  Could not add ${column.name} directly: ${error.message}`)
        console.log(`   You'll need to add this column manually in your Supabase dashboard`)
      } else {
        console.log(`✅ Successfully added ${column.name}`)
      }
      
    } catch (error) {
      console.log(`❌ Error adding ${column.name}: ${error.message}`)
      console.log(`   You'll need to add this column manually in your Supabase dashboard`)
    }
  }
  
  console.log('\n📋 If any columns failed to add automatically, use these SQL commands in your Supabase SQL Editor:')
  console.log('')
  columnsToAdd.forEach(col => {
    console.log(`ALTER TABLE ${TABLE_NAME} ADD COLUMN ${col.name} ${col.type};`)
  })
  console.log('')
  console.log('🎯 After adding all columns, run: node scripts/annotate_emotions.mjs')
}

// Run the column addition
addEmotionColumnsDirect().catch(console.error) 