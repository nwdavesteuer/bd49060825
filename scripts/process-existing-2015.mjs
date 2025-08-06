#!/usr/bin/env node

import fs from 'fs'

console.log('📝 Processing existing 2015 file with missing notes scoring logic')
console.log('=' * 60)

// Scoring logic for longer, thoughtful notes
const EMOTIONAL_KEYWORDS = [
  'love', 'adore', 'miss', 'heart', 'beautiful', 'amazing', 'wonderful', 'incredible',
  'grateful', 'blessed', 'lucky', 'happy', 'joy', 'excited', 'thrilled', 'proud',
  'sad', 'hurt', 'angry', 'frustrated', 'worried', 'anxious', 'scared', 'vulnerable',
  'tender', 'gentle', 'kind', 'caring', 'compassionate', 'understanding', 'patient',
  'forgiving', 'healing', 'growth', 'journey', 'adventure', 'exploration', 'discovery'
]

const THOUGHTFUL_KEYWORDS = [
  'think', 'feel', 'believe', 'realize', 'understand', 'learn', 'grow', 'change',
  'reflect', 'consider', 'wonder', 'imagine', 'dream', 'hope', 'wish', 'pray',
  'appreciate', 'value', 'cherish', 'treasure', 'honor', 'respect', 'admire',
  'inspire', 'motivate', 'encourage', 'support', 'help', 'guide', 'teach',
  'share', 'connect', 'bond', 'relationship', 'partnership', 'marriage', 'family'
]

function calculateLongNoteScore(text) {
  const lowerText = text.toLowerCase()
  const words = text.split(' ')
  const wordCount = words.length
  
  let score = 0
  
  // Base score for length
  if (wordCount >= 50) score += 10
  else if (wordCount >= 30) score += 8
  else if (wordCount >= 20) score += 6
  else if (wordCount >= 15) score += 4
  else if (wordCount >= 10) score += 2
  
  // Emotional keywords
  const emotionalCount = EMOTIONAL_KEYWORDS.filter(keyword => 
    lowerText.includes(keyword)
  ).length
  score += emotionalCount * 2
  
  // Thoughtful keywords
  const thoughtfulCount = THOUGHTFUL_KEYWORDS.filter(keyword => 
    lowerText.includes(keyword)
  ).length
  score += thoughtfulCount * 1
  
  // Love expressions bonus
  const loveExpressions = (lowerText.match(/love|adore|heart/g) || []).length
  score += loveExpressions * 3
  
  // Logistics penalty (lighter)
  const logisticsKeywords = [
    'meeting', 'appointment', 'schedule', 'time', 'when', 'where', 'pickup', 'dropoff',
    'grocery', 'shopping', 'errand', 'task', 'reminder', 'note', 'info', 'details'
  ]
  const logisticsCount = logisticsKeywords.filter(keyword => 
    lowerText.includes(keyword)
  ).length
  score -= logisticsCount * 1
  
  return {
    score,
    wordCount,
    emotionalKeywords: emotionalCount,
    thoughtfulKeywords: thoughtfulCount
  }
}

async function process2015File() {
  const inputFile = 'data/2015-david-love-notes-for-audio.csv'
  
  if (!fs.existsSync(inputFile)) {
    console.log('❌ 2015 file not found')
    return
  }
  
  console.log('📖 Reading existing 2015 file...')
  const csvContent = fs.readFileSync(inputFile, 'utf-8')
  const lines = csvContent.split('\n')
  const headers = lines[0].split(',')
  
  console.log(`📊 Found ${lines.length - 1} notes in 2015 file`)
  
  // Parse CSV and score messages
  const scoredNotes = lines.slice(1).filter(line => line.trim()).map(line => {
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
    const filename = values[4]?.replace(/"/g, '') || `david-2015-love-note-${id}.wav`
    
    const scoring = calculateLongNoteScore(text)
    
    return {
      id,
      text,
      date,
      emotion,
      filename,
      ...scoring
    }
  })
  
  // Filter for high-quality notes
  const highQualityNotes = scoredNotes
    .filter(note => note.score >= 8 && note.wordCount >= 20)
    .sort((a, b) => b.score - a.score)
  
  console.log(`✅ Found ${highQualityNotes.length} high-quality notes (out of ${scoredNotes.length} total)`)
  
  // Save to new CSV
  const csvHeader = 'id,text,date,emotion,filename,score,wordCount,emotionalKeywords,thoughtfulKeywords\n'
  const csvRows = highQualityNotes.map(note => {
    return `"${note.id}","${note.text.replace(/"/g, '""')}","${note.date}","${note.emotion}","${note.filename}","${note.score}","${note.wordCount}","${note.emotionalKeywords}","${note.thoughtfulKeywords}"`
  }).join('\n')
  
  const outputCsvContent = csvHeader + csvRows
  const outputFile = 'data/2015-david-love-notes-for-audio-refined.csv'
  
  fs.writeFileSync(outputFile, outputCsvContent, 'utf-8')
  
  console.log(`💾 Saved ${highQualityNotes.length} refined notes to ${outputFile}`)
  
  // Show top examples
  console.log(`\n📝 Top 5 Love Note Examples from 2015:`)
  highQualityNotes.slice(0, 5).forEach((note, i) => {
    console.log(`${i + 1}. Score: ${note.score}, Words: ${note.wordCount}`)
    console.log(`   Date: ${note.date}`)
    console.log(`   Text: ${note.text.substring(0, 100)}...`)
    console.log('')
  })
  
  return {
    total: scoredNotes.length,
    selected: highQualityNotes.length,
    averageScore: highQualityNotes.reduce((sum, note) => sum + note.score, 0) / highQualityNotes.length,
    averageWords: highQualityNotes.reduce((sum, note) => sum + note.wordCount, 0) / highQualityNotes.length
  }
}

process2015File().catch(console.error) 