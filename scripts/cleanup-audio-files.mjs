#!/usr/bin/env node

import fs from 'fs'
import path from 'path'

console.log('🎵 Cleaning up old audio files')
console.log('=' * 50)

const audioDir = 'public/audio/love-notes'

async function cleanupAudioFiles() {
  if (!fs.existsSync(audioDir)) {
    console.log('📁 Audio directory not found, creating...')
    fs.mkdirSync(audioDir, { recursive: true })
    return
  }
  
  console.log('🗑️  Removing old audio files...')
  
  const files = fs.readdirSync(audioDir)
  let deletedCount = 0
  let totalSize = 0
  
  for (const file of files) {
    if (file.endsWith('.wav')) {
      const filePath = path.join(audioDir, file)
      const stats = fs.statSync(filePath)
      totalSize += stats.size
      
      fs.unlinkSync(filePath)
      deletedCount++
      console.log(`   ✅ Deleted: ${file} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`)
    }
  }
  
  console.log(`\n📊 Cleanup Summary:`)
  console.log(`   🗑️  Deleted ${deletedCount} audio files`)
  console.log(`   💾 Freed ${(totalSize / 1024 / 1024).toFixed(2)} MB of space`)
  
  console.log('\n🎤 Ready for David5 voice generation!')
  console.log('📋 Next steps:')
  console.log('1. Get fresh Hume API key from https://app.hume.ai/')
  console.log('2. Update lib/hume-service.ts with new key')
  console.log('3. Update David5 voice ID in app/api/generate-audio/route.ts')
  console.log('4. Test with a few notes first')
  console.log('5. Generate audio for all years with David5 voice')
}

cleanupAudioFiles().catch(console.error) 