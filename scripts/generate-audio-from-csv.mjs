import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Hume AI API configuration
const HUME_API_KEY = process.env.HUME_API_KEY || '5sMy54ZASUGzlDJv8f2nOIliS5AqEJmYyhECrA6VqiwZVIFx'
const HUME_BASE_URL = 'https://api.hume.ai/v0'

// Default voice settings - will try to use David2 voice first
let DEFAULT_VOICE_ID = 'pNInz6obpgDQGcFmaJgB' // Fallback voice
const DEFAULT_MODEL_ID = 'eleven_turbo_v2'
const DEFAULT_SPEED = 1.0
const DEFAULT_STABILITY = 0.5
const DEFAULT_SIMILARITY_BOOST = 0.75
const DEFAULT_STYLE = 0.0
const DEFAULT_USE_SPEAKER_BOOST = true

async function getAvailableVoices() {
  const response = await fetch(`${HUME_BASE_URL}/voices`, {
    headers: {
      'X-Hume-Api-Key': HUME_API_KEY,
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch voices: ${response.status}`)
  }

  return response.json()
}

async function findDavid2Voice() {
  try {
    const voices = await getAvailableVoices()
    const david2Voice = voices.find(voice => 
      voice.name === 'David2' || 
      voice.voice_id.includes('david2') || 
      voice.voice_id.includes('David2')
    )
    return david2Voice ? david2Voice.voice_id : null
  } catch (error) {
    console.log('⚠️  Could not fetch voices, using fallback voice')
    return null
  }
}

async function generateAudioFromText(text, options = {}) {
  const response = await fetch(`${HUME_BASE_URL}/text-to-speech`, {
    method: 'POST',
    headers: {
      'X-Hume-Api-Key': HUME_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text: text,
      model_id: options.model_id || DEFAULT_MODEL_ID,
      voice_id: options.voice_id || DEFAULT_VOICE_ID,
      speed: options.speed || DEFAULT_SPEED,
      stability: options.stability || DEFAULT_STABILITY,
      similarity_boost: options.similarity_boost || DEFAULT_SIMILARITY_BOOST,
      style: options.style || DEFAULT_STYLE,
      use_speaker_boost: options.use_speaker_boost || DEFAULT_USE_SPEAKER_BOOST,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Hume API error: ${response.status} - ${error}`)
  }

  const data = await response.json()
  return {
    audio: data.audio,
    duration: data.duration || 0,
    model_id: data.model_id,
    voice_id: data.voice_id,
  }
}

function base64ToAudioFile(base64Audio, outputPath) {
  const binaryString = Buffer.from(base64Audio, 'base64')
  fs.writeFileSync(outputPath, binaryString)
}

function parseCSV(csvContent) {
  const lines = csvContent.split('\n')
  const headers = lines[0].split(',')
  const rows = lines.slice(1).filter(line => line.trim())
  
  return rows.map(line => {
    // Handle quoted fields properly
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
    
    const row = {}
    headers.forEach((header, index) => {
      row[header.trim()] = values[index] || ''
    })
    return row
  })
}

async function generateAudioFromCSV(csvFilePath, outputDir, options = {}) {
  try {
    console.log('🎵 Starting audio generation from CSV...')
    
    // Read CSV file
    if (!fs.existsSync(csvFilePath)) {
      throw new Error(`CSV file not found: ${csvFilePath}`)
    }
    
    const csvContent = fs.readFileSync(csvFilePath, 'utf-8')
    const rows = parseCSV(csvContent)
    
    console.log(`📝 Found ${rows.length} entries in CSV file`)
    
    // Create output directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
      console.log(`📁 Created output directory: ${outputDir}`)
    }
    
    // Process each row
    let successCount = 0
    let errorCount = 0
    
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const text = row.text
      const filename = row.filename || `audio-${i + 1}.wav`
      
      if (!text || text.trim() === '') {
        console.log(`⚠️  Skipping row ${i + 1}: empty text`)
        continue
      }
      
      console.log(`🎤 Generating audio ${i + 1}/${rows.length}: ${filename}`)
      console.log(`   Text: ${text.substring(0, 100)}${text.length > 100 ? '...' : ''}`)
      
      try {
        // Generate audio
        const audioResponse = await generateAudioFromText(text, options)
        
        // Save audio file
        const outputPath = path.join(outputDir, filename)
        base64ToAudioFile(audioResponse.audio, outputPath)
        
        console.log(`✅ Generated: ${filename} (${audioResponse.duration.toFixed(2)}s)`)
        successCount++
        
        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100))
        
      } catch (error) {
        console.error(`❌ Error generating audio for row ${i + 1}:`, error.message)
        errorCount++
      }
    }
    
    console.log('')
    console.log('🎉 Audio generation complete!')
    console.log(`✅ Successfully generated: ${successCount} files`)
    console.log(`❌ Errors: ${errorCount} files`)
    console.log(`📁 Output directory: ${outputDir}`)
    
    return { successCount, errorCount, total: rows.length }
    
  } catch (error) {
    console.error('❌ Error processing CSV:', error)
    throw error
  }
}

// Main execution
async function main() {
  try {
    const csvFilePath = path.join(process.cwd(), 'data', '2015-david-love-notes-for-audio.csv')
    const outputDir = path.join(process.cwd(), 'public', 'audio', 'love-notes')
    
    // Try to find and use David2 voice
    console.log('🔍 Looking for David2 voice...')
    const david2VoiceId = await findDavid2Voice()
    
    if (david2VoiceId) {
      DEFAULT_VOICE_ID = david2VoiceId
      console.log(`✅ Found David2 voice: ${david2VoiceId}`)
    } else {
      console.log('⚠️  David2 voice not found, using fallback voice')
    }
    
    // You can customize these options
    const options = {
      voice_id: DEFAULT_VOICE_ID,
      speed: DEFAULT_SPEED,
      stability: DEFAULT_STABILITY,
      // Add emotion-based voice adjustments if needed
      // For love notes, you might want a warmer, more intimate voice
    }
    
    const result = await generateAudioFromCSV(csvFilePath, outputDir, options)
    
    console.log('')
    console.log('📋 Next steps:')
    console.log('1. Check the generated audio files in: public/audio/love-notes/')
    console.log('2. Test a few files to ensure quality meets your expectations')
    console.log('3. If needed, adjust voice settings and re-run the script')
    console.log('4. Update your application to use the new audio files')
    
  } catch (error) {
    console.error('❌ Script failed:', error)
    process.exit(1)
  }
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}

export { generateAudioFromCSV, generateAudioFromText } 