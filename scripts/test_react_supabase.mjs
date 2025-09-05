import { createClient } from '@supabase/supabase-js'

// Use the exact same configuration as the React app
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://fblwndzprmvjajayxjln.supabase.co"
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZibHduZHpwcm12amFqYXl4amxuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk0MjEwODAsImV4cCI6MjA2NDk5NzA4MH0.kUJ2La2IkvcX86_bnBbgI17VvqLvoKEhiTgqQrxF6zY"

const supabase = createClient(supabaseUrl, supabaseAnonKey)
const TABLE_NAME = 'fulldata_set'

async function testReactSupabase() {
  console.log('🧪 Testing React app Supabase configuration...')
  console.log('   URL:', supabaseUrl)
  console.log('   Key:', supabaseAnonKey.substring(0, 20) + '...')
  
  try {
    // Test the exact same query as the React app
    console.log('\n📥 Testing explicit field selection...')
    const { data: pageData, error: fetchError } = await supabase
      .from(TABLE_NAME)
      .select('message_id, text, readable_date, is_from_me, sender, recipient, has_attachments, attachments_info, emojis, links, service, account, contact_id, date, date_read, guid, primary_emotion, emotion_confidence, secondary_emotions, emotion_intensity, emotion_context, emotion_triggers, relationship_impact')
      .order("readable_date", { ascending: true })
      .range(0, 2)
    
    if (fetchError) {
      console.error('❌ Error:', fetchError)
      return
    }
    
    console.log(`✅ Fetched ${pageData?.length || 0} records`)
    
    if (pageData && pageData.length > 0) {
      console.log('\n🔍 Sample records:')
      pageData.forEach((msg, index) => {
        console.log(`   Message ${index + 1}:`, {
          id: msg.message_id,
          text: msg.text?.substring(0, 30),
          has_primary_emotion: 'primary_emotion' in msg,
          primary_emotion: msg.primary_emotion,
          emotion_confidence: msg.emotion_confidence,
          all_emotion_keys: Object.keys(msg).filter(key => key.includes('emotion'))
        })
      })
    }
    
  } catch (error) {
    console.error('❌ Fatal error:', error)
  }
}

// Run the test
testReactSupabase().catch(console.error) 