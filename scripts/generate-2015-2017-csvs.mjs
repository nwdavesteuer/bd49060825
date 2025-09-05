#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://fblwndzprmvjajayxjln.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZibHduZHpwcm12amFqYXl4amxuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk0MjEwODAsImV4cCI6MjA2NDk5NzA4MH0.kUJ2La2IkvcX86_bnBbgI17VvqLvoKEhiTgqQrxF6zY'

const supabase = createClient(supabaseUrl, supabaseKey)

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

async function findMissingLongNotes(year) {
  console.log(`\n📅 Analyzing ${year} for longer, thoughtful love notes...`)
  
  const startDate = `${year}-01-01`
  const endDate = `${year}-12-31`
  
  try {
    const { data: messages, error } = await supabase
      .from('fulldata_set')
      .select('*')
      .eq('is_from_me', '1')
      .gte('readable_date', startDate)
      .lte('readable_date', endDate)
      .order('readable_date', { ascending: true })
    
    if (error) {
      console.error(`❌ Database error for ${year}:`, error)
      return
    }
    
    console.log(`📊 Found ${messages.length} messages from ${year}`)
    
    // Score and filter messages
    const scoredMessages = messages
      .map(msg => {
        const scoring = calculateLongNoteScore(msg.text || '')
        return {
          ...msg,
          ...scoring
        }
      })
      .filter(msg => msg.score >= 8 && msg.wordCount >= 20)
      .sort((a, b) => b.score - a.score)
    
    console.log(`✅ Found ${scoredMessages.length} high-quality longer notes`)
    
    // Save to CSV
    const csvHeader = 'id,text,date,emotion,filename,score,wordCount,emotionalKeywords,thoughtfulKeywords\n'
    const csvRows = scoredMessages.map(msg => {
      const filename = `david-${year}-love-note-${msg.id}.wav`
      return `"${msg.id}","${(msg.text || '').replace(/"/g, '""')}","${msg.readable_date}","love","${filename}","${msg.score}","${msg.wordCount}","${msg.emotionalKeywords}","${msg.thoughtfulKeywords}"`
    }).join('\n')
    
    const csvContent = csvHeader + csvRows
    const outputFile = `data/${year}-david-long-notes-missing.csv`
    
    const fs = await import('fs')
    fs.writeFileSync(outputFile, csvContent, 'utf-8')
    
    console.log(`💾 Saved ${scoredMessages.length} notes to ${outputFile}`)
    
    // Show top examples
    console.log(`\n📝 Top 5 Love Note Examples from ${year}:`)
    scoredMessages.slice(0, 5).forEach((msg, i) => {
      console.log(`${i + 1}. Score: ${msg.score}, Words: ${msg.wordCount}`)
      console.log(`   Date: ${msg.readable_date}`)
      console.log(`   Text: ${(msg.text || '').substring(0, 100)}...`)
      console.log('')
    })
    
    return {
      year,
      total: messages.length,
      selected: scoredMessages.length,
      averageScore: scoredMessages.length > 0 ? scoredMessages.reduce((sum, msg) => sum + msg.score, 0) / scoredMessages.length : 0,
      averageWords: scoredMessages.length > 0 ? scoredMessages.reduce((sum, msg) => sum + msg.wordCount, 0) / scoredMessages.length : 0
    }
    
  } catch (error) {
    console.error(`❌ Error processing ${year}:`, error.message)
    return { year, error: error.message }
  }
}

async function main() {
  console.log('🎯 Generating CSV files for 2015-2017 using missing notes analysis')
  console.log('=' * 70)
  
  const years = [2015, 2016, 2017]
  const results = []
  
  for (const year of years) {
    const result = await findMissingLongNotes(year)
    if (result) {
      results.push(result)
    }
  }
  
  console.log('\n🎉 Analysis Complete!')
  console.log('=' * 70)
  console.log('📊 Summary:')
  results.forEach(result => {
    if (result.error) {
      console.log(`❌ ${result.year}: ${result.error}`)
    } else {
      console.log(`✅ ${result.year}: ${result.selected}/${result.total} notes selected`)
      console.log(`   Avg Score: ${result.averageScore.toFixed(1)}, Avg Words: ${result.averageWords.toFixed(1)}`)
    }
  })
  
  console.log('\n📁 Generated CSV files:')
  results.forEach(result => {
    if (!result.error) {
      console.log(`   ${result.year}-david-long-notes-missing.csv`)
    }
  })
}

main().catch(console.error) 