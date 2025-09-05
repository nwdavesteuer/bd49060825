#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'

// Create Supabase client
const supabaseUrl = 'https://fblwndzprmvjajayxjln.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZibHduZHpwcm12amFqYXl4amxuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk0MjEwODAsImV4cCI6MjA2NDk5NzA4MH0.kUJ2La2IkvcX86_bnBbgI17VvqLvoKEhiTgqQrxF6zY'
const supabase = createClient(supabaseUrl, supabaseKey)

console.log('🔍 Finding ALL Love Notes FROM David TO Nitzan in 2015')
console.log('')

async function find2015LoveNotes() {
  try {
    // Enhanced keywords for romantic love notes
    const loveKeywords = [
      'love you', 'i love you', 'my love', 'love', 'heart',
      'miss you', 'missing you', 'thinking of you', 'wish you were here',
      'appreciate you', 'grateful for you', 'thank you', 'thanks',
      'beautiful', 'amazing', 'wonderful', 'incredible', 'special',
      'forever', 'always', 'together', 'us', 'we',
      'soul', 'spirit', 'connection', 'bond', 'relationship',
      'care about you', 'care for you', 'adore', 'cherish',
      'sorry', 'apologize', 'forgive', 'understanding',
      'here for you', 'with you', 'by your side', 'support',
      'happy', 'joy', 'smile', 'laugh', 'fun',
      'kiss', 'hug', 'touch', 'hold', 'embrace'
    ]

    // Keywords that indicate the message is NOT from David
    const notFromDavidKeywords = [
      'please share w david', 'share with david', 'david too',
      'elizabeth', 'dave', 'guy', 'halleli', 'scott', 'avi', 'noah',
      'training', 'work', 'meeting', 'conference', 'flight',
      'bug report', 'jas', 'subpar', 'alameda', 'ketuba', 'lechaim',
      'pass along', 'forward', 'share with', 'please share',
      'hey everyone', 'we\'d like to invite', 'hope you can make it',
      'friends totally welcome', 'musicale', 'potluck'
    ]

    // Query 2015 messages from David to Nitzan
    console.log('📅 Querying 2015 messages...')
    
    const { data: messages, error } = await supabase
      .from('fulldata_set')
      .select('*')
      .eq('is_from_me', '1')  // Messages from David
      .eq('recipient', 'Nitzan')  // Messages to Nitzan
      .not('text', 'is', null)  // Has text content
      .not('text', 'eq', '')    // Not empty
      .gte('readable_date', '2015-01-01')
      .lte('readable_date', '2015-12-31')
      .order('readable_date', { ascending: false })

    if (error) {
      console.error('❌ Database error:', error)
      return
    }

    console.log(`📊 Found ${messages.length} messages from David to Nitzan in 2015`)
    
    // Show date range
    if (messages.length > 0) {
      const dates = messages.map(m => new Date(m.readable_date))
      const earliest = new Date(Math.min(...dates))
      const latest = new Date(Math.max(...dates))
      console.log(`📅 Date range: ${earliest.toLocaleDateString()} to ${latest.toLocaleDateString()}`)
    }
    console.log('')

    // Filter and score messages with strict validation
    const loveNotes = []
    
    for (const message of messages) {
      const text = message.text.toLowerCase()
      let score = 0
      let matchedKeywords = []
      
      // STRICT CHECK: Skip messages that contain keywords indicating they're NOT from David
      let shouldExclude = false
      for (const excludeKeyword of notFromDavidKeywords) {
        if (text.includes(excludeKeyword.toLowerCase())) {
          shouldExclude = true
          break
        }
      }
      if (shouldExclude) continue
      
      // Additional checks for messages that seem to be from Nitzan
      if (text.includes('please share w david') || 
          text.includes('share with david') ||
          text.includes('hey everyone') ||
          text.includes('we\'d like to invite') ||
          text.includes('hope you can make it')) {
        continue
      }
      
      // Check for love keywords
      for (const keyword of loveKeywords) {
        if (text.includes(keyword.toLowerCase())) {
          score += 1
          matchedKeywords.push(keyword)
        }
      }
      
      // Bonus points for longer messages (more thoughtful)
      const wordCount = text.split(' ').length
      if (wordCount > 15) score += 1
      if (wordCount > 30) score += 2
      if (wordCount > 50) score += 3
      
      // Bonus for emotional words and emojis
      if (text.includes('❤️') || text.includes('💕') || text.includes('💖') || text.includes('💗')) score += 3
      if (text.includes('😊') || text.includes('😍') || text.includes('🥰')) score += 2
      
      // Bonus for personal pronouns (indicating direct communication)
      if (text.includes('you') && text.includes('i')) score += 1
      
      // Bonus for romantic phrases
      if (text.includes('my love') || text.includes('love you') || text.includes('i love you')) score += 3
      if (text.includes('miss you') || text.includes('thinking of you')) score += 2
      if (text.includes('appreciate you') || text.includes('grateful for you')) score += 2
      
      // Include ALL messages with any love indicators (lower threshold for 2015)
      if (score >= 1) {
        loveNotes.push({
          ...message,
          loveScore: score,
          matchedKeywords,
          wordCount,
          date: new Date(message.readable_date)
        })
      }
    }
    
    // Sort by love score (highest first)
    loveNotes.sort((a, b) => b.loveScore - a.loveScore)
    
    console.log(`💕 Found ${loveNotes.length} potential love notes FROM David in 2015`)
    console.log('')
    
    // Show ALL results
    console.log('🏆 ALL Love Notes FROM David in 2015:')
    console.log('')
    
    loveNotes.forEach((note, index) => {
      console.log(`${index + 1}. Score: ${note.loveScore} | ${note.date.toLocaleDateString()}`)
      console.log(`   Keywords: ${note.matchedKeywords.join(', ')}`)
      console.log(`   Words: ${note.wordCount}`)
      console.log(`   Text: ${note.text}`)
      console.log('')
    })
    
    // Save results to file for manual review
    const fs = await import('fs')
    const results = {
      totalFound: loveNotes.length,
      allNotes: loveNotes
    }
    
    fs.writeFileSync('data/2015-david-love-notes.json', JSON.stringify(results, null, 2))
    console.log('💾 Results saved to: data/2015-david-love-notes.json')
    console.log('')
    console.log('📋 Next steps:')
    console.log('1. Review the candidates in the JSON file')
    console.log('2. Run: node scripts/export-2015-david-love-notes-for-audio.mjs')
    console.log('3. Generate audio files with Hume web interface')
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

find2015LoveNotes() 