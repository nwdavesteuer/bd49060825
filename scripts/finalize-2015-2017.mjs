#!/usr/bin/env node

import fs from 'fs'

console.log('📝 Finalizing 2015-2017 files')
console.log('=' * 40)

async function finalizeFiles() {
  // Replace 2015 file with refined version
  if (fs.existsSync('data/2015-david-love-notes-for-audio-refined.csv')) {
    fs.renameSync('data/2015-david-love-notes-for-audio-refined.csv', 'data/2015-david-love-notes-for-audio.csv')
    console.log('✅ Replaced 2015 file with refined version (74 notes)')
  }
  
  // Remove empty 2016 and 2017 files
  const filesToRemove = [
    'data/2016-david-long-notes-missing.csv',
    'data/2017-david-long-notes-missing.csv'
  ]
  
  for (const file of filesToRemove) {
    if (fs.existsSync(file)) {
      fs.unlinkSync(file)
      console.log(`🗑️  Removed empty file: ${file}`)
    }
  }
  
  console.log('\n📊 Final 2015-2017 Status:')
  console.log('✅ 2015: 74 high-quality notes (refined from 461 total)')
  console.log('❌ 2016: No data available')
  console.log('❌ 2017: No data available')
  
  console.log('\n📁 Current CSV files ready for audio:')
  const csvFiles = [
    'data/2015-david-love-notes-for-audio.csv',
    'data/2018-david-love-notes-for-audio.csv',
    'data/2019-david-love-notes-for-audio.csv',
    'data/2020-david-love-notes-for-audio.csv',
    'data/2021-david-love-notes-for-audio.csv',
    'data/2022-david-love-notes-for-audio.csv',
    'data/2023-david-love-notes-for-audio.csv',
    'data/2024-david-love-notes-for-audio.csv'
  ]
  
  for (const file of csvFiles) {
    if (fs.existsSync(file)) {
      const stats = fs.statSync(file)
      const sizeKB = (stats.size / 1024).toFixed(1)
      console.log(`   📁 ${file.split('/').pop()} (${sizeKB} KB)`)
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

finalizeFiles().catch(console.error) 