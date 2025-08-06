#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

// Initialize Supabase client
const supabaseUrl = 'https://fblwndzprmvjajayxjln.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZibHduZHpwcm12amFqYXl4amxuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk0MjEwODAsImV4cCI6MjA2NDk5NzA4MH0.kUJ2La2IkvcX86_bnBbgI17VvqLvoKEhiTgqQrxF6zY'
const supabase = createClient(supabaseUrl, supabaseKey)

console.log('🔍 Finding MISSING longer notes that might have been filtered out')
console.log('=' * 60)

// Keywords that indicate emotional content (even if mixed with logistics)
const EMOTIONAL_KEYWORDS = [
  'love', 'adore', 'cherish', 'treasure', 'precious',
  'beautiful', 'amazing', 'wonderful', 'incredible',
  'grateful', 'blessed', 'lucky', 'happy', 'joy',
  'heart', 'soul', 'spirit', 'connection', 'bond',
  'miss', 'missing', 'can\'t wait', 'excited',
  'appreciate', 'thank you', 'thanks',
  'together', 'with you', 'us', 'we', 'our',
  'forever', 'always', 'never want to lose you',
  'can\'t imagine life without you', 'you complete me',
  'you mean everything', 'you are my everything',
  'my love', 'my dear', 'my darling', 'my sweetheart'
]

// Keywords that indicate longer, thoughtful content
const THOUGHTFUL_KEYWORDS = [
  'realize', 'realized', 'thinking', 'thought', 'feel',
  'feeling', 'understand', 'understood', 'learn', 'learned',
  'grow', 'growing', 'grateful', 'appreciate', 'appreciated',
  'blessed', 'lucky', 'fortunate', 'wonderful', 'amazing',
  'incredible', 'beautiful', 'special', 'unique', 'extraordinary',
  'journey', 'adventure', 'experience', 'moment', 'memory',
  'reflection', 'reflecting', 'consider', 'considering',
  'wonder', 'wondering', 'imagine', 'imagining', 'dream',
  'dreaming', 'hope', 'hoping', 'wish', 'wishing'
]

function calculateLongNoteScore(text) {
  const lowerText = text.toLowerCase()
  let score = 0
  
  // Base score for length
  const wordCount = text.split(' ').length
  if (wordCount >= 50) {
    score += 10  // High bonus for very long messages
  } else if (wordCount >= 30) {
    score += 6   // Good bonus for long messages
  } else if (wordCount >= 20) {
    score += 3   // Small bonus for medium messages
  }
  
  // Emotional content scoring
  EMOTIONAL_KEYWORDS.forEach(keyword => {
    if (lowerText.includes(keyword)) {
      score += 2
    }
  })
  
  // Thoughtful content scoring
  THOUGHTFUL_KEYWORDS.forEach(keyword => {
    if (lowerText.includes(keyword)) {
      score += 1
    }
  })
  
  // Bonus for multiple emotional expressions
  const loveExpressions = ['i love you', 'love you', 'i adore you', 'adore you', 'i miss you', 'miss you', 'i appreciate you', 'appreciate you']
  const loveCount = loveExpressions.filter(expr => lowerText.includes(expr)).length
  score += loveCount * 3
  
  // Penalty for pure logistics (but lighter)
  const logisticsKeywords = [
    'insurance', 'covered california', 'enroll', 'deadline',
    'charge point', 'parking', 'traffic', 'commute',
    'doctor', 'dr.', 'appointment', 'dentist', 'haircut',
    'tax', 'marin', 'follow up', 'shopping list', 'grocery',
    'pick up', 'drop off', 'schedule', 'meeting', 'call', 'email',
    'work', 'office', 'conference', 'presentation', 'panel',
    'house', 'apartment', 'rent', 'mortgage', 'utilities',
    'car', 'bike', 'repair', 'maintenance', 'service',
    'school', 'class', 'homework', 'assignment', 'grade',
    'pet', 'dog', 'cat', 'vet', 'animal',
    'weather', 'rain', 'sunny', 'hot', 'cold',
    'cost', 'price', 'money', 'budget', 'expensive',
    'plan', 'planning', 'calendar', 'remember', 'remind', 'reminder',
    'send', 'text', 'message', 'call', 'ok', 'okay', 'sure', 'fine', 'yes', 'no',
    'thanks', 'thank you', 'thx', 'hey', 'hi', 'hello', 'good morning', 'good night',
    'bye', 'goodbye', 'see you', 'talk to you later'
  ]
  
  logisticsKeywords.forEach(keyword => {
    if (lowerText.includes(keyword)) {
      score -= 1  // Light penalty for logistics
    }
  })
  
  return Math.max(0, score)
}

async function findMissingLongNotes(year) {
  console.log(`\n📅 Searching for missing longer notes in ${year}...`)
  
  try {
    // Get all messages from David to Nitzan in the specified year
    const startDate = `${year}-01-01T00:00:00+00:00`
    const endDate = `${year}-12-31T23:59:59+00:00`
    
    const { data: messages, error } = await supabase
      .from('fulldata_set')
      .select('message_id, readable_date, text, sender, is_from_me')
      .eq('is_from_me', '1')
      .eq('recipient', 'Nitzan')
      .gte('readable_date', startDate)
      .lte('readable_date', endDate)
      .order('readable_date', { ascending: true })

    if (error) throw error

    console.log(`📊 Found ${messages.length} total messages from David in ${year}`)

    // Score all messages for longer, thoughtful content
    const scoredMessages = messages
      .map(msg => {
        const text = msg.text || ''
        const score = calculateLongNoteScore(text)
        
        return {
          ...msg,
          longNoteScore: score,
          wordCount: text.split(' ').length,
          emotionalKeywords: EMOTIONAL_KEYWORDS.filter(k => text.toLowerCase().includes(k)).length,
          thoughtfulKeywords: THOUGHTFUL_KEYWORDS.filter(k => text.toLowerCase().includes(k)).length
        }
      })
      .filter(msg => msg.longNoteScore >= 8 && msg.wordCount >= 20) // Focus on longer, thoughtful messages
      .sort((a, b) => b.longNoteScore - a.longNoteScore)

    console.log(`🎯 Found ${scoredMessages.length} potential longer notes (score >= 8, words >= 20)`)

    // Generate CSV content
    const csvHeader = 'id,text,date,emotion,filename,score,wordCount,emotionalKeywords,thoughtfulKeywords\n'
    const csvRows = scoredMessages.map(msg => {
      const date = new Date(msg.readable_date)
      const filename = `david-${year}-long-note-${msg.message_id}.wav`
      
      return `"${msg.message_id}","${msg.text.replace(/"/g, '""')}","${msg.readable_date}","love","${filename}","${msg.longNoteScore}","${msg.wordCount}","${msg.emotionalKeywords}","${msg.thoughtfulKeywords}"`
    }).join('\n')

    const csvContent = csvHeader + csvRows

    // Save to file
    const filename = `data/${year}-david-long-notes-missing.csv`
    fs.writeFileSync(filename, csvContent, 'utf-8')

    console.log(`✅ Saved ${scoredMessages.length} potential longer notes to ${filename}`)
    
    // Show top 5 examples
    console.log('\n📝 Top 5 Longer Note Examples:')
    scoredMessages.slice(0, 5).forEach((msg, index) => {
      console.log(`${index + 1}. [Score: ${msg.longNoteScore}, Words: ${msg.wordCount}] ${msg.readable_date.split('T')[0]}`)
      console.log(`   Emotional keywords: ${msg.emotionalKeywords}, Thoughtful keywords: ${msg.thoughtfulKeywords}`)
      console.log(`   Text: ${msg.text.substring(0, 150)}${msg.text.length > 150 ? '...' : ''}`)
      console.log('')
    })

    return {
      year,
      totalMessages: messages.length,
      longNotes: scoredMessages.length,
      averageScore: scoredMessages.reduce((sum, msg) => sum + msg.longNoteScore, 0) / scoredMessages.length,
      averageWords: scoredMessages.reduce((sum, msg) => sum + msg.wordCount, 0) / scoredMessages.length
    }

  } catch (error) {
    console.error(`❌ Error processing ${year}:`, error)
    return { year, error: error.message }
  }
}

async function main() {
  const years = [2018, 2019, 2020, 2021, 2022, 2023, 2024]
  const results = []

  for (const year of years) {
    const result = await findMissingLongNotes(year)
    results.push(result)
  }

  console.log('\n🎉 Missing Long Notes Search Complete!')
  console.log('=' * 60)
  console.log('📊 Summary:')
  results.forEach(result => {
    if (result.error) {
      console.log(`❌ ${result.year}: ${result.error}`)
    } else {
      console.log(`✅ ${result.year}: ${result.longNotes} longer notes (avg score: ${result.averageScore.toFixed(1)}, avg words: ${result.averageWords.toFixed(1)})`)
    }
  })

  console.log('\n📁 Missing long notes CSV files saved to data/ directory')
  console.log('✏️  These might contain longer, more thoughtful notes we missed')
}

main().catch(console.error) 