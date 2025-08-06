#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

// Initialize Supabase client
const supabaseUrl = 'https://fblwndzprmvjajayxjln.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZibHduZHpwcm12amFqYXl4amxuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk0MjEwODAsImV4cCI6MjA2NDk5NzA4MH0.kUJ2La2IkvcX86_bnBbgI17VvqLvoKEhiTgqQrxF6zY'
const supabase = createClient(supabaseUrl, supabaseKey)

console.log('🎯 Generating CSV files for all years with improved analysis logic')
console.log('=' * 60)

// Improved scoring criteria
const TIER_1_KEYWORDS = [
  'i love you', 'love you', 'i love', 'i adore you', 'adore you',
  'i miss you', 'miss you', 'missing you', 'can\'t wait to see you',
  'i appreciate you', 'appreciate you', 'thank you for', 'grateful for you',
  'you mean everything to me', 'you are my everything', 'my love',
  'my dear', 'my darling', 'my sweetheart', 'my beautiful'
]

const TIER_2_KEYWORDS = [
  'love', 'adore', 'cherish', 'treasure', 'precious',
  'beautiful', 'amazing', 'wonderful', 'incredible',
  'happy with you', 'lucky to have you', 'blessed to have you',
  'you make me', 'you inspire me', 'you bring me'
]

const TIER_3_KEYWORDS = [
  'together', 'with you', 'us', 'we', 'our',
  'future', 'forever', 'always', 'never want to lose you',
  'can\'t imagine life without you', 'you complete me'
]

const NEGATIVE_KEYWORDS = [
  'sorry', 'apologize', 'regret', 'mistake', 'wrong',
  'fight', 'argument', 'disappointed', 'upset', 'angry',
  'work', 'meeting', 'call', 'email', 'schedule',
  'pick up', 'grocery', 'milk', 'bread', 'dinner',
  'appointment', 'doctor', 'dentist', 'haircut'
]

function calculateLoveScore(text, emotion) {
  const lowerText = text.toLowerCase()
  let score = 0
  
  // Tier 1 scoring (highest weight)
  TIER_1_KEYWORDS.forEach(keyword => {
    if (lowerText.includes(keyword)) {
      score += 3
    }
  })
  
  // Tier 2 scoring
  TIER_2_KEYWORDS.forEach(keyword => {
    if (lowerText.includes(keyword)) {
      score += 2
    }
  })
  
  // Tier 3 scoring
  TIER_3_KEYWORDS.forEach(keyword => {
    if (lowerText.includes(keyword)) {
      score += 1
    }
  })
  
  // Negative scoring (reduce score for logistics/noise)
  NEGATIVE_KEYWORDS.forEach(keyword => {
    if (lowerText.includes(keyword)) {
      score -= 2
    }
  })
  
  // Emotion bonus
  const positiveEmotions = ['love', 'joy', 'excitement', 'gratitude', 'appreciation', 'longing', 'nostalgia']
  if (positiveEmotions.includes(emotion)) {
    score += 1
  }
  
  // Length bonus (but not too long)
  const wordCount = text.split(' ').length
  if (wordCount >= 10 && wordCount <= 100) {
    score += 1
  }
  
  return Math.max(0, score)
}

async function generateYearCSV(year) {
  console.log(`\n📅 Processing ${year}...`)
  
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

    // Score and filter messages
    const scoredMessages = messages
      .map(msg => {
        const text = msg.text || ''
        const emotion = 'love' // Default emotion, can be enhanced later
        const score = calculateLoveScore(text, emotion)
        
        return {
          ...msg,
          loveScore: score,
          wordCount: text.split(' ').length,
          emotion: emotion
        }
      })
      .filter(msg => msg.loveScore >= 4) // Minimum score threshold
      .sort((a, b) => b.loveScore - a.loveScore)

    console.log(`🎯 Found ${scoredMessages.length} high-quality love notes (score >= 4)`)

    // Generate CSV content
    const csvHeader = 'id,text,date,emotion,filename\n'
    const csvRows = scoredMessages.map(msg => {
      const date = new Date(msg.date)
      const filename = `david-${year}-love-note-${msg.message_id}.wav`
      
      return `"${msg.message_id}","${msg.text.replace(/"/g, '""')}","${msg.date}","${msg.emotion}","${filename}"`
    }).join('\n')

    const csvContent = csvHeader + csvRows

    // Save to file
    const filename = `data/${year}-david-love-notes-for-audio.csv`
    fs.writeFileSync(filename, csvContent, 'utf-8')

    console.log(`✅ Saved ${scoredMessages.length} notes to ${filename}`)
    
    // Show top 5 examples
    console.log('\n📝 Top 5 Love Note Examples:')
    scoredMessages.slice(0, 5).forEach((msg, index) => {
      console.log(`${index + 1}. [Score: ${msg.loveScore}] ${msg.date.split('T')[0]}`)
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
  const years = [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024]
  const results = []

  for (const year of years) {
    const result = await generateYearCSV(year)
    results.push(result)
  }

  console.log('\n🎉 Generation Complete!')
  console.log('=' * 60)
  console.log('📊 Summary:')
  results.forEach(result => {
    if (result.error) {
      console.log(`❌ ${result.year}: ${result.error}`)
    } else {
      console.log(`✅ ${result.year}: ${result.loveNotes} notes (avg score: ${result.averageScore.toFixed(1)})`)
    }
  })

  console.log('\n📁 CSV files saved to data/ directory')
  console.log('✏️  You can now manually edit these files before audio generation')
}

main().catch(console.error) 