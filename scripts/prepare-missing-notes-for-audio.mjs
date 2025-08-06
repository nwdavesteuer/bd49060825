#!/usr/bin/env node

import fs from 'fs'
import path from 'path'

console.log('📝 Preparing missing notes for audio generation')
console.log('=' * 60)

const years = [2018, 2019, 2020, 2021, 2022, 2023, 2024]

function convertMissingNotesToAudioFormat(year) {
  console.log(`\n📅 Processing ${year}...`)
  
  const inputFile = `data/${year}-david-long-notes-missing.csv`
  const outputFile = `data/${year}-david-love-notes-for-audio.csv`
  
  if (!fs.existsSync(inputFile)) {
    console.log(`❌ Input file not found: ${inputFile}`)
    return
  }
  
  try {
    const csvContent = fs.readFileSync(inputFile, 'utf-8')
    const lines = csvContent.split('\n')
    const headers = lines[0].split(',')
    
    // Parse CSV and convert to audio format
    const audioNotes = lines.slice(1).filter(line => line.trim()).map(line => {
      // Parse CSV properly handling quoted fields
      const values = []
      let current = ''
      let inQuotes = false
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i]
        if (char === '"') {
          inQuotes = !inQuotes
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim())
          current = ''
        } else {
          current += char
        }
      }
      values.push(current.trim()) // Add the last value
      
      const id = values[0]?.replace(/"/g, '') || ''
      const text = values[1]?.replace(/"/g, '') || ''
      const date = values[2]?.replace(/"/g, '') || ''
      const emotion = values[3]?.replace(/"/g, '') || 'love'
      const filename = `david-${year}-love-note-${id}.wav`
      
      return {
        id,
        text,
        date,
        emotion,
        filename
      }
    })
    
    // Generate new CSV in audio format
    const csvHeader = 'id,text,date,emotion,filename\n'
    const csvRows = audioNotes.map(note => {
      return `"${note.id}","${note.text.replace(/"/g, '""')}","${note.date}","${note.emotion}","${note.filename}"`
    }).join('\n')
    
    const outputCsvContent = csvHeader + csvRows
    
    // Save to file
    fs.writeFileSync(outputFile, outputCsvContent, 'utf-8')
    
    console.log(`✅ Converted ${audioNotes.length} notes`)
    console.log(`📁 Saved to: ${outputFile}`)
    
    // Show sample
    if (audioNotes.length > 0) {
      const sample = audioNotes[0]
      console.log(`📝 Sample: ${sample.text.substring(0, 100)}...`)
      console.log(`📊 Length: ${sample.text.length} characters, ${sample.text.split(' ').length} words`)
    }
    
    return {
      year,
      count: audioNotes.length,
      averageLength: audioNotes.reduce((sum, note) => sum + note.text.length, 0) / audioNotes.length,
      averageWords: audioNotes.reduce((sum, note) => sum + note.text.split(' ').length, 0) / audioNotes.length
    }
    
  } catch (error) {
    console.error(`❌ Error processing ${year}:`, error.message)
    return { year, error: error.message }
  }
}

async function main() {
  const results = []
  
  for (const year of years) {
    const result = convertMissingNotesToAudioFormat(year)
    if (result) {
      results.push(result)
    }
  }
  
  console.log('\n🎉 Conversion Complete!')
  console.log('=' * 60)
  console.log('📊 Summary:')
  results.forEach(result => {
    if (result.error) {
      console.log(`❌ ${result.year}: ${result.error}`)
    } else {
      console.log(`✅ ${result.year}: ${result.count} notes (avg ${result.averageLength.toFixed(0)} chars, ${result.averageWords.toFixed(1)} words)`)
    }
  })
  
  console.log('\n📁 Audio-ready CSV files created:')
  results.forEach(result => {
    if (!result.error) {
      console.log(`   ${result.year}-david-love-notes-for-audio.csv`)
    }
  })
  
  console.log('\n🎤 Next steps:')
  console.log('1. Get fresh Hume API key from https://app.hume.ai/')
  console.log('2. Update the API key in lib/hume-service.ts')
  console.log('3. Run audio generation for each year')
}

main().catch(console.error) 