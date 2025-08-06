#!/usr/bin/env node

console.log('🔍 Testing Google Photos Library API Enablement')
console.log('')

async function testAPIEnablement() {
  try {
    // Test 1: Try to access the API discovery document
    console.log('🔍 Test 1: API Discovery Document...')
    const discoveryResponse = await fetch('https://photoslibrary.googleapis.com/$discovery/rest?version=v1')
    
    console.log(`   Status: ${discoveryResponse.status}`)
    if (discoveryResponse.ok) {
      console.log('   ✅ API discovery document accessible')
    } else {
      console.log('   ❌ API discovery document not accessible')
    }
    
    console.log('')
    
    // Test 2: Try a simple endpoint without auth
    console.log('🔍 Test 2: Simple endpoint test...')
    const simpleResponse = await fetch('https://photoslibrary.googleapis.com/v1/albums')
    
    console.log(`   Status: ${simpleResponse.status}`)
    if (simpleResponse.status === 401) {
      console.log('   ✅ API is enabled (401 = needs auth)')
    } else if (simpleResponse.status === 403) {
      console.log('   ✅ API is enabled (403 = needs proper auth)')
    } else {
      console.log('   ❓ Unexpected response')
    }
    
    console.log('')
    console.log('💡 If both tests show the API is accessible, the issue is with OAuth scopes.')
    console.log('💡 If the discovery document fails, the API is not enabled.')
    
  } catch (error) {
    console.error('❌ Error testing API enablement:', error.message)
  }
}

testAPIEnablement() 