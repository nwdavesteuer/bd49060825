import fs from 'fs'
import path from 'path'

console.log('🔑 Hume AI API Key Setup')
console.log('========================')
console.log('')
console.log('It looks like your current API key is not working.')
console.log('')
console.log('📋 To get a fresh API key:')
console.log('')
console.log('1. Go to https://app.hume.ai/')
console.log('2. Sign in to your account')
console.log('3. Go to Settings or API section')
console.log('4. Look for "API Keys" or "Developer Settings"')
console.log('5. Create a new API key or copy your existing one')
console.log('')
console.log('🔍 Common places to find API keys:')
console.log('   - Settings > API Keys')
console.log('   - Developer Settings')
console.log('   - Account Settings > API')
console.log('   - Dashboard > API Keys')
console.log('')
console.log('⚠️  Make sure the API key has TTS (Text-to-Speech) permissions')
console.log('')
console.log('Once you have your new API key, you can:')
console.log('')
console.log('Option 1: Set as environment variable')
console.log('   export HUME_API_KEY="your-new-api-key"')
console.log('')
console.log('Option 2: Create a .env file')
console.log('   echo "HUME_API_KEY=your-new-api-key" > .env')
console.log('')
console.log('Option 3: Update the script directly')
console.log('   Edit scripts/generate-audio-from-csv.mjs')
console.log('   Replace the API key on line 8')
console.log('')
console.log('After setting the new API key, test it with:')
console.log('   node scripts/test-hume-api.mjs')
console.log('')

// Check if .env file exists
const envPath = path.join(process.cwd(), '.env')
if (fs.existsSync(envPath)) {
  console.log('📄 Found .env file')
  const envContent = fs.readFileSync(envPath, 'utf-8')
  if (envContent.includes('HUME_API_KEY')) {
    console.log('✅ HUME_API_KEY is already set in .env file')
  } else {
    console.log('❌ HUME_API_KEY not found in .env file')
  }
} else {
  console.log('📄 No .env file found')
}

console.log('')
console.log('Current API key being used:')
console.log(`   ${process.env.HUME_API_KEY || '5sMy54ZASUGzlDJv8f2nOIliS5AqEJmYyhECrA6VqiwZVIFx'}`)
console.log('') 