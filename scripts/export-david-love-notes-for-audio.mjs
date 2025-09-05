import fs from 'fs'
import path from 'path'

async function exportDavidLoveNotesForAudio() {
  try {
    console.log('🎵 Exporting David\'s love notes for audio generation...')
    
    // Read the David love notes candidates
    const candidatesPath = path.join(process.cwd(), 'data', 'david-love-notes-candidates.json')
    
    if (!fs.existsSync(candidatesPath)) {
      console.log('❌ David love notes candidates file not found')
      console.log('Please run: node scripts/find-david-love-notes.mjs first')
      return
    }
    
    const candidatesData = JSON.parse(fs.readFileSync(candidatesPath, 'utf-8'))
    const candidates = candidatesData.topNotes || []
    
    console.log(`📝 Found ${candidates.length} love notes from David`)
    
    // Create CSV content
    const csvHeader = 'id,text,date,emotion,filename\n'
    const csvRows = candidates.map((note, index) => {
      const filename = `david-love-note-${note.message_id}.wav`
      return `${note.message_id},"${note.text.replace(/"/g, '""')}",${note.readable_date},${note.primary_emotion || 'love'},${filename}`
    }).join('\n')
    
    const csvContent = csvHeader + csvRows
    
    // Save CSV file
    const outputPath = path.join(process.cwd(), 'data', 'david-love-notes-for-audio.csv')
    fs.writeFileSync(outputPath, csvContent)
    
    console.log('✅ Exported David\'s love notes to:', outputPath)
    console.log('')
    console.log('📋 Next steps:')
    console.log('1. Go to https://app.hume.ai/')
    console.log('2. Upload the CSV file: data/david-love-notes-for-audio.csv')
    console.log('3. Use their TTS feature to generate audio for each text')
    console.log('4. Download the generated WAV files')
    console.log('5. Place them in: public/audio/love-notes/')
    console.log('')
    console.log('🎵 After generating audio, run: node scripts/update-david-love-notes-audio.mjs')
    
  } catch (error) {
    console.error('❌ Error exporting David\'s love notes:', error)
  }
}

exportDavidLoveNotesForAudio() 