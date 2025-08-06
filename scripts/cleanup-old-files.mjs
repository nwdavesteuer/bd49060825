#!/usr/bin/env node

import fs from 'fs'
import path from 'path'

console.log('🧹 Cleaning up old files and preparing final CSV set')
console.log('=' * 60)

// Files to keep (our final set)
const filesToKeep = [
  'data/2015-david-love-notes-full.csv', // Rename to standard format
  'data/2018-david-love-notes-for-audio.csv',
  'data/2019-david-love-notes-for-audio.csv', 
  'data/2020-david-love-notes-for-audio.csv',
  'data/2021-david-love-notes-for-audio.csv',
  'data/2022-david-love-notes-for-audio.csv',
  'data/2023-david-love-notes-for-audio.csv',
  'data/2024-david-love-notes-for-audio.csv'
]

// Files to delete
const filesToDelete = [
  'data/2015-david-long-notes-missing.csv',
  'data/2016-david-long-notes-missing.csv', 
  'data/2017-david-long-notes-missing.csv',
  'data/2018-david-long-notes-missing.csv',
  'data/2019-david-long-notes-missing.csv',
  'data/2020-david-long-notes-missing.csv',
  'data/2021-david-long-notes-missing.csv',
  'data/2022-david-long-notes-missing.csv',
  'data/2023-david-long-notes-missing.csv',
  'data/2024-david-long-notes-missing.csv',
  'data/david-love-notes-for-audio.csv',
  'data/love-notes-for-audio.csv'
]

async function cleanupFiles() {
  console.log('🗑️  Deleting old files...')
  
  for (const file of filesToDelete) {
    if (fs.existsSync(file)) {
      fs.unlinkSync(file)
      console.log(`   ✅ Deleted: ${file}`)
    } else {
      console.log(`   ⚠️  Not found: ${file}`)
    }
  }
  
  console.log('\n📝 Renaming 2015 file to standard format...')
  
  // Rename 2015 file to standard format
  if (fs.existsSync('data/2015-david-love-notes-full.csv')) {
    fs.renameSync('data/2015-david-love-notes-full.csv', 'data/2015-david-love-notes-for-audio.csv')
    console.log('   ✅ Renamed: 2015-david-love-notes-full.csv → 2015-david-love-notes-for-audio.csv')
  }
  
  console.log('\n📊 Final file summary:')
  const finalFiles = [
    'data/2015-david-love-notes-for-audio.csv',
    'data/2018-david-love-notes-for-audio.csv',
    'data/2019-david-love-notes-for-audio.csv',
    'data/2020-david-love-notes-for-audio.csv',
    'data/2021-david-love-notes-for-audio.csv',
    'data/2022-david-love-notes-for-audio.csv',
    'data/2023-david-love-notes-for-audio.csv',
    'data/2024-david-love-notes-for-audio.csv'
  ]
  
  for (const file of finalFiles) {
    if (fs.existsSync(file)) {
      const stats = fs.statSync(file)
      const sizeKB = (stats.size / 1024).toFixed(1)
      console.log(`   📁 ${path.basename(file)} (${sizeKB} KB)`)
    } else {
      console.log(`   ❌ Missing: ${path.basename(file)}`)
    }
  }
  
  console.log('\n🎯 Ready for audio generation!')
  console.log('📋 Next steps:')
  console.log('1. Get fresh Hume API key')
  console.log('2. Update lib/hume-service.ts with new key')
  console.log('3. Update David5 voice ID in app/api/generate-audio/route.ts')
  console.log('4. Test audio generation with a few notes')
  console.log('5. Generate audio for all years')
}

cleanupFiles().catch(console.error) 