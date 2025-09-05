#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

// Create Supabase client
const supabaseUrl = 'https://fblwndzprmvjajayxjln.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZibHduZHpwcm12amFqYXl4amxuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk0MjEwODAsImV4cCI6MjA2NDk5NzA4MH0.kUJ2La2IkvcX86_bnBbgI17VvqLvoKEhiTgqQrxF6zY'
const supabase = createClient(supabaseUrl, supabaseKey)

console.log('🔍 Finding High-Quality 2016 Love Notes')
console.log('==========================================')

async function find2016LoveNotes() {
  try {
    // Get all messages from David to Nitzan in 2016
    const { data: messages, error } = await supabase
      .from('fulldata_set')
      .select('*')
      .eq('is_from_me', '1')  // Messages from David
      .eq('recipient', 'Nitzan')  // Messages to Nitzan
      .not('text', 'is', null)  // Has text content
      .not('text', 'eq', '')    // Not empty
      .gte('readable_date', '2016-01-01')  // From 2016
      .lte('readable_date', '2016-12-31')  // To end of 2016
      .order('readable_date', { ascending: false })

    if (error) {
      console.error('❌ Database error:', error)
      return
    }

    console.log(`📊 Found ${messages.length} total messages from David to Nitzan in 2016`)
    
    // Show date range
    if (messages.length > 0) {
      const dates = messages.map(m => new Date(m.readable_date))
      const earliest = new Date(Math.min(...dates))
      const latest = new Date(Math.max(...dates))
      console.log(`📅 Date range: ${earliest.toLocaleDateString()} to ${latest.toLocaleDateString()}`)
    }
    console.log('')

    // REFINED CRITERIA FOR HIGH-QUALITY LOVE NOTES
    
    // Tier 1: High-Quality Emotional Expressions (Must Have)
    const tier1Keywords = [
      'i love you', 'love you', 'i love', 'i miss you', 'missing you',
      'i appreciate you', 'grateful for you', 'thank you for being',
      'i\'m sorry', 'i apologize', 'forgive me',
      'i want to be better', 'i want to be a better',
      'i can\'t wait to', 'i\'m excited about our',
      'you make me', 'you inspire me', 'you help me',
      'i feel so lucky', 'i\'m so grateful', 'i\'m blessed',
      'i cherish', 'i adore', 'i treasure',
      'my love', 'my dear', 'my darling',
      'forever', 'always', 'together',
      'soul', 'spirit', 'connection', 'bond'
    ]

    // Tier 2: Medium-Quality (Consider)
    const tier2Keywords = [
      'thinking of you', 'wish you were here', 'miss you',
      'here for you', 'with you', 'by your side', 'support you',
      'happy with you', 'joy with you', 'smile', 'laugh',
      'kiss', 'hug', 'hold', 'embrace',
      'beautiful', 'amazing', 'wonderful', 'incredible', 'special'
    ]

    // EXCLUDE: Noise and Logistics
    const excludeKeywords = [
      // Logistics
      'can you pick up', 'what time', 'where are you', 'when are you',
      'meeting', 'appointment', 'schedule', 'flight', 'train', 'bus',
      'car', 'drive', 'pick up', 'drop off', 'parking',
      'restaurant', 'dinner', 'lunch', 'breakfast',
      'hotel', 'room', 'key', 'card',
      
      // Work/Professional
      'proposal', 'contract', 'client', 'meeting went',
      'presentation', 'conference', 'work', 'job', 'office',
      'colleague', 'boss', 'team', 'project',
      
      // Third-party references
      'tell your', 'share with', 'forward to', 'pass along',
      'your brother', 'your sister', 'your mom', 'your dad',
      'everyone', 'we\'d like to invite', 'please share',
      
      // Casual/Logistics
      'hey love', 'good morning', 'good night', 'goodbye',
      'ok', 'okay', 'sure', 'yes', 'no',
      'umbrella', 'umbrellas', 'shopping', 'grocery',
      'movie', 'concert', 'ticket', 'tickets',
      
      // Technical/URLs
      'http', 'https', 'www', '.com', '.org',
      'eventbrite', 'apple music', 'spotify',
      
      // Specific exclusions
      'elizabeth', 'dave', 'guy', 'halleli', 'scott', 'avi', 'noah',
      'training', 'bug report', 'jas', 'subpar', 'alameda', 'ketuba', 'lechaim'
    ]

    // Filter and score messages
    const loveNotes = []
    
    for (const message of messages) {
      const text = message.text.toLowerCase()
      let score = 0
      let matchedKeywords = []
      let excluded = false
      
      // Check for exclusion keywords first
      for (const excludeKeyword of excludeKeywords) {
        if (text.includes(excludeKeyword.toLowerCase())) {
          excluded = true
          break
        }
      }
      if (excluded) continue
      
      // Check for logistics patterns
      if (text.includes('can you') || text.includes('what time') || text.includes('where')) {
        // Only include if it also has emotional content
        let hasEmotionalContent = false
        for (const keyword of [...tier1Keywords, ...tier2Keywords]) {
          if (text.includes(keyword.toLowerCase())) {
            hasEmotionalContent = true
            break
          }
        }
        if (!hasEmotionalContent) continue
      }
      
      // Score Tier 1 keywords (higher weight)
      for (const keyword of tier1Keywords) {
        if (text.includes(keyword.toLowerCase())) {
          score += 3
          matchedKeywords.push(keyword)
        }
      }
      
      // Score Tier 2 keywords (lower weight)
      for (const keyword of tier2Keywords) {
        if (text.includes(keyword.toLowerCase())) {
          score += 1
          matchedKeywords.push(keyword)
        }
      }
      
      // Bonus points for longer messages (more thoughtful)
      const wordCount = text.split(' ').length
      if (wordCount > 20) score += 2
      if (wordCount > 40) score += 3
      if (wordCount > 60) score += 4
      
      // Bonus for emotional words and emojis
      if (text.includes('❤️') || text.includes('💕') || text.includes('💖') || text.includes('💗')) score += 3
      if (text.includes('😊') || text.includes('😍') || text.includes('🥰')) score += 2
      
      // Bonus for personal pronouns (indicating direct communication)
      if (text.includes('you') && text.includes('i')) score += 2
      
      // Bonus for vulnerability/apology
      if (text.includes('sorry') || text.includes('apologize') || text.includes('forgive')) score += 2
      
      // Bonus for future-oriented language
      if (text.includes('can\'t wait') || text.includes('excited') || text.includes('looking forward')) score += 2
      
      // Bonus for reflection on relationship
      if (text.includes('grateful') || text.includes('lucky') || text.includes('blessed')) score += 2
      
      // Only include messages with significant emotional content
      if (score >= 4) {
        loveNotes.push({
          message_id: message.message_id,
          text: message.text,
          readable_date: message.readable_date,
          score: score,
          matchedKeywords: matchedKeywords,
          wordCount: wordCount
        })
      }
    }
    
    // Sort by score (highest first)
    loveNotes.sort((a, b) => b.score - a.score)
    
    console.log(`🎯 Found ${loveNotes.length} high-quality love notes (score >= 4)`)
    console.log('')
    
    // Display top candidates
    console.log('📝 Top Love Note Candidates:')
    console.log('============================')
    
    for (let i = 0; i < Math.min(loveNotes.length, 20); i++) {
      const note = loveNotes[i]
      const date = new Date(note.readable_date).toLocaleDateString()
      const preview = note.text.length > 80 ? note.text.substring(0, 80) + '...' : note.text
      
      console.log(`${i + 1}. [Score: ${note.score}] ${date}`)
      console.log(`   Keywords: ${note.matchedKeywords.join(', ')}`)
      console.log(`   Words: ${note.wordCount}`)
      console.log(`   Text: ${preview}`)
      console.log('')
    }
    
    // Save to CSV for audio generation
    if (loveNotes.length > 0) {
      const csvData = ['id,text,date,emotion,filename']
      
      for (const note of loveNotes) {
        const emotion = note.score >= 8 ? 'love' : note.score >= 6 ? 'gratitude' : 'appreciation'
        const filename = `david-2016-love-note-${note.message_id}.wav`
        
        csvData.push(`"${note.message_id}","${note.text.replace(/"/g, '""')}","${note.readable_date}","${emotion}","${filename}"`)
      }
      
      fs.writeFileSync('data/2016-david-love-notes-for-audio.csv', csvData.join('\n'))
      console.log(`💾 Saved ${loveNotes.length} love notes to data/2016-david-love-notes-for-audio.csv`)
    }
    
    console.log('')
    console.log('✅ Analysis complete!')
    console.log(`📊 Summary:`)
    console.log(`   - Total messages in 2016: ${messages.length}`)
    console.log(`   - High-quality love notes: ${loveNotes.length}`)
    console.log(`   - Average score: ${loveNotes.length > 0 ? (loveNotes.reduce((sum, n) => sum + n.score, 0) / loveNotes.length).toFixed(1) : 0}`)
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

find2016LoveNotes() 