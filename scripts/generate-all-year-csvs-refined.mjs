#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

// Initialize Supabase client
const supabaseUrl = 'https://fblwndzprmvjajayxjln.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZibHduZHpwcm12amFqYXl4amxuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk0MjEwODAsImV4cCI6MjA2NDk5NzA4MH0.kUJ2La2IkvcX86_bnBbgI17VvqLvoKEhiTgqQrxF6zY'
const supabase = createClient(supabaseUrl, supabaseKey)

console.log('🎯 Generating REFINED CSV files with STRICT filtering (2018+)')
console.log('=' * 60)

// STRICT Tier 1 keywords - Only these get high scores
const TIER_1_KEYWORDS = [
  'i love you', 'love you', 'i love', 'i adore you', 'adore you',
  'i miss you', 'miss you', 'missing you', 'can\'t wait to see you',
  'i appreciate you', 'appreciate you', 'thank you for', 'grateful for you',
  'you mean everything to me', 'you are my everything', 'my love',
  'my dear', 'my darling', 'my sweetheart', 'my beautiful',
  'i cherish you', 'cherish you', 'i treasure you', 'treasure you'
]

// STRICT Tier 2 keywords - Moderate scoring
const TIER_2_KEYWORDS = [
  'love', 'adore', 'cherish', 'treasure', 'precious',
  'beautiful', 'amazing', 'wonderful', 'incredible',
  'happy with you', 'lucky to have you', 'blessed to have you',
  'you make me', 'you inspire me', 'you bring me',
  'forever', 'always', 'never want to lose you',
  'can\'t imagine life without you', 'you complete me'
]

// STRICT Tier 3 keywords - Lower scoring
const TIER_3_KEYWORDS = [
  'together', 'with you', 'us', 'we', 'our',
  'future', 'forever', 'always', 'soul', 'spirit',
  'connection', 'bond', 'relationship'
]

// HEAVY negative scoring for logistical/practical messages
const NEGATIVE_KEYWORDS = [
  // Logistics
  'insurance', 'covered california', 'enroll', 'deadline', 'friday',
  'transit', 'bus', 'bart', 'train', 'flight', 'uber', 'lyft',
  'charge point', 'parking', 'traffic', 'commute',
  'doctor', 'dr.', 'appointment', 'dentist', 'haircut', 'infection',
  'tax', 'marin', 'follow up', 'insurance', 'covered california',
  'shopping list', 'grocery', 'milk', 'bread', 'dinner',
  'pick up', 'drop off', 'schedule', 'meeting', 'call', 'email',
  'work', 'office', 'conference', 'presentation', 'panel',
  'movie', 'show', 'theater', 'restaurant', 'dinner', 'lunch',
  'house', 'apartment', 'rent', 'mortgage', 'utilities',
  'car', 'bike', 'repair', 'maintenance', 'service',
  'school', 'class', 'homework', 'assignment', 'grade',
  'kids', 'children', 'boys', 'girls', 'family',
  'pet', 'dog', 'cat', 'vet', 'animal',
  'weather', 'rain', 'sunny', 'hot', 'cold',
  'time', 'when', 'what time', 'how long',
  'where', 'location', 'address', 'map',
  'cost', 'price', 'money', 'budget', 'expensive',
  'plan', 'planning', 'schedule', 'calendar',
  'help', 'need help', 'can you help',
  'remember', 'remind', 'reminder',
  'send', 'text', 'message', 'call',
  'ok', 'okay', 'sure', 'fine', 'yes', 'no',
  'thanks', 'thank you', 'thx',
  'sorry', 'apologize', 'regret',
  'good', 'bad', 'great', 'terrible',
  'how are you', 'how\'s it going', 'what\'s up',
  'hey', 'hi', 'hello', 'good morning', 'good night',
  'bye', 'goodbye', 'see you', 'talk to you later'
]

// Additional filters for very short or very long messages
const MIN_WORDS = 8
const MAX_WORDS = 200

function calculateStrictLoveScore(text, emotion) {
  const lowerText = text.toLowerCase()
  let score = 0
  
  // Tier 1 scoring (highest weight) - ONLY these get high scores
  TIER_1_KEYWORDS.forEach(keyword => {
    if (lowerText.includes(keyword)) {
      score += 5  // Increased weight
    }
  })
  
  // Tier 2 scoring
  TIER_2_KEYWORDS.forEach(keyword => {
    if (lowerText.includes(keyword)) {
      score += 3
    }
  })
  
  // Tier 3 scoring
  TIER_3_KEYWORDS.forEach(keyword => {
    if (lowerText.includes(keyword)) {
      score += 1
    }
  })
  
  // HEAVY negative scoring for logistics
  NEGATIVE_KEYWORDS.forEach(keyword => {
    if (lowerText.includes(keyword)) {
      score -= 5  // Much heavier penalty
    }
  })
  
  // Length requirements
  const wordCount = text.split(' ').length
  if (wordCount < MIN_WORDS || wordCount > MAX_WORDS) {
    score -= 3  // Penalty for too short or too long
  }
  
  // Bonus for emotional depth
  const emotionalWords = ['heart', 'soul', 'spirit', 'love', 'adore', 'cherish', 'treasure', 'beautiful', 'amazing', 'wonderful']
  const emotionalCount = emotionalWords.filter(word => lowerText.includes(word)).length
  score += emotionalCount * 2
  
  return Math.max(0, score)
}

async function generateRefinedYearCSV(year) {
  console.log(`\n📅 Processing ${year} with STRICT filtering...`)
  
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

    // Score and filter messages with STRICT criteria
    const scoredMessages = messages
      .map(msg => {
        const text = msg.text || ''
        const emotion = 'love' // Default emotion
        const score = calculateStrictLoveScore(text, emotion)
        
        return {
          ...msg,
          loveScore: score,
          wordCount: text.split(' ').length,
          emotion: emotion
        }
      })
      .filter(msg => msg.loveScore >= 8) // MUCH higher threshold
      .sort((a, b) => b.loveScore - a.loveScore)

    console.log(`🎯 Found ${scoredMessages.length} HIGH-QUALITY love notes (score >= 8)`)

    // Generate CSV content
    const csvHeader = 'id,text,date,emotion,filename\n'
    const csvRows = scoredMessages.map(msg => {
      const date = new Date(msg.readable_date)
      const filename = `david-${year}-love-note-${msg.message_id}.wav`
      
      return `"${msg.message_id}","${msg.text.replace(/"/g, '""')}","${msg.readable_date}","${msg.emotion}","${filename}"`
    }).join('\n')

    const csvContent = csvHeader + csvRows

    // Save to file
    const filename = `data/${year}-david-love-notes-for-audio-refined.csv`
    fs.writeFileSync(filename, csvContent, 'utf-8')

    console.log(`✅ Saved ${scoredMessages.length} notes to ${filename}`)
    
    // Show top 5 examples
    console.log('\n📝 Top 5 Love Note Examples:')
    scoredMessages.slice(0, 5).forEach((msg, index) => {
      console.log(`${index + 1}. [Score: ${msg.loveScore}] ${msg.readable_date.split('T')[0]}`)
      console.log(`   Keywords: ${TIER_1_KEYWORDS.filter(k => msg.text.toLowerCase().includes(k)).join(', ')}`)
      console.log(`   Words: ${msg.wordCount}`)
      console.log(`   Text: ${msg.text.substring(0, 100)}${msg.text.length > 100 ? '...' : ''}`)
      console.log('')
    })

    return {
      year,
      totalMessages: messages.length,
      loveNotes: scoredMessages.length,
      averageScore: scoredMessages.reduce((sum, msg) => sum + msg.loveScore, 0) / scoredMessages.length
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
    const result = await generateRefinedYearCSV(year)
    results.push(result)
  }

  console.log('\n🎉 Refined Generation Complete!')
  console.log('=' * 60)
  console.log('📊 Summary:')
  results.forEach(result => {
    if (result.error) {
      console.log(`❌ ${result.year}: ${result.error}`)
    } else {
      console.log(`✅ ${result.year}: ${result.loveNotes} notes (avg score: ${result.averageScore.toFixed(1)})`)
    }
  })

  console.log('\n📁 Refined CSV files saved to data/ directory')
  console.log('✏️  These should have much less noise and more emotional content')
}

main().catch(console.error) 