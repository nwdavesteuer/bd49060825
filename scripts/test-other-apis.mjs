#!/usr/bin/env node

console.log('🧪 Testing Other Google APIs')
console.log('')

async function testOtherAPIs() {
  try {
    // Test 1: Google Drive API (should work with basic auth)
    console.log('🔍 Test 1: Google Drive API...')
    const driveResponse = await fetch('https://www.googleapis.com/drive/v3/about', {
      headers: {
        'Authorization': 'Bearer YOUR_TOKEN_HERE' // We'll need to get a token first
      }
    })
    
    console.log(`   Status: ${driveResponse.status}`)
    if (driveResponse.ok) {
      console.log('   ✅ Drive API works!')
    } else {
      console.log('   ❌ Drive API failed')
    }
    
    console.log('')
    console.log('💡 The issue might be specific to Google Photos Library API.')
    console.log('💡 Let me check if there are any specific requirements...')
    
    // Check the API documentation
    console.log('')
    console.log('📚 Google Photos Library API Requirements:')
    console.log('1. API must be enabled in Google Cloud Console ✅')
    console.log('2. OAuth consent screen must have the scopes ✅')
    console.log('3. User must have photos in their Google Photos account')
    console.log('4. User must grant permission during OAuth flow')
    console.log('')
    console.log('🔍 The issue might be that you need to have photos in your Google Photos account')
    console.log('🔍 Or the OAuth flow didn\'t properly request photo access')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

testOtherAPIs() 