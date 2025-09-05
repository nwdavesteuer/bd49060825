#!/usr/bin/env node

import fs from 'fs'
import path from 'path'

console.log('🎤 Testing David5 voice with full text conversion')
console.log('=' * 60)

// Test with a few notes from 2022 missing notes
const testNotes = [
  {
    id: "48663",
    text: "Hey baby, sending you all my love before heading off tonight. I appreciate you being flexible so that I can go to the concert tonight…I'm really excited to see it. I'm feeling really good about where we are in our current  non-monogamy journey. I know there will be other bumps, but feels like we are getting closer and closer to learning the right balance for us. While I didn't react to your playful/sexy photo with joy, I didn't have big feelings either…just more of a curious…\"huh? Wonder what is going on here.\" It's getting easier. I absolutely love you to bits. We had some hard moments this week, going deep and really cleaning out the cellar. It would have been much easier to just not go so deep and be so vulnerable with one another. But I've realized that some of the unprocessed emotions are coming out sideways….and it's poisonous.  I know you are committed to doing personal growth in your own way….and have your path for exploration. I know I don't always communicate this well…but I love all of your parts…and I want to treat each one with compassion, curiosity, and care. I really want to share this way of thinking and experiencing your Self with you…it is a big mind shift that I think will help you understand some of the feedback I shared this week. I hear you repeat back things I have said in the past, judgements, interpretations…and I'm trying to move beyond this way of thinking…it's really liberating. I look forward to a lifetime of exploration with you….play, deep stuff, you in sexy dresses. No-one holds a candle to you, my love. I'll be out for a few hours…and can't wait to have you back in my arms.",
    date: "2022-05-13T16:35:31.807+00:00",
    filename: "test-david5-2022-long-note-48663.wav"
  },
  {
    id: "40644", 
    text: "Thanks love, I am also feeling sad and a bit out of sorts. I Have some reflections that we can talk through during our session with Priscilla. Some of my reactions are just responses to behavior that I don't like, and possibly some of this has been building. I know we can work through in a loving way and I will honor your tenderness. I appreciate you being vulnerable with me. I love you to death and am so grateful to have had the last few weeks of adventure together.",
    date: "2022-01-05T08:39:12.403653+00:00",
    filename: "test-david5-2022-long-note-40644.wav"
  },
  {
    id: "43683",
    text: "Love, thank you so much for the most wonderful birthday present….so much of you and your beautiful heart went into its meticulous creation. I love it so much. It will be wonderful to see what the book for the next 6 years will looks like. What an extraordinary life. I feel so lucky. I love you so much.",
    date: "2022-02-22T08:30:52.631586+00:00", 
    filename: "test-david5-2022-long-note-43683.wav"
  }
]

async function testDavid5Audio() {
  console.log(`\n📝 Testing ${testNotes.length} notes with David5 voice...`)
  
  for (const note of testNotes) {
    console.log(`\n🎤 Processing: ${note.filename}`)
    console.log(`📊 Text length: ${note.text.length} characters`)
    console.log(`📊 Word count: ${note.text.split(' ').length} words`)
    console.log(`📅 Date: ${note.date.split('T')[0]}`)
    console.log(`📝 Preview: ${note.text.substring(0, 100)}...`)
    
    // Call the Hume API with David5 voice
    try {
      const response = await fetch('http://localhost:3000/api/generate-audio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: note.text,
          filename: note.filename,
          voice: 'David5' // Use the new David5 voice
        })
      })
      
      if (response.ok) {
        const result = await response.json()
        console.log(`✅ Audio generated: ${result.filename}`)
        console.log(`⏱️  Duration: ${result.duration}s`)
        console.log(`🎤 Voice ID: ${result.voice_id}`)
        
        // Save the audio file
        if (result.audio) {
          const audioBuffer = Buffer.from(result.audio, 'base64')
          const outputPath = `public/audio/love-notes/${note.filename}`
          
          // Ensure directory exists
          const dir = path.dirname(outputPath)
          if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true })
          }
          
          fs.writeFileSync(outputPath, audioBuffer)
          console.log(`💾 Saved to: ${outputPath}`)
        }
      } else {
        console.log(`❌ Error: ${response.status} ${response.statusText}`)
      }
    } catch (error) {
      console.log(`❌ API Error: ${error.message}`)
    }
  }
  
  console.log('\n🎉 Test complete! Check the generated audio files.')
}

testDavid5Audio().catch(console.error) 