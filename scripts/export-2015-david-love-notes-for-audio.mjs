import fs from 'fs'
import path from 'path'

async function export2015DavidLoveNotesForAudio() {
  try {
    console.log('🎵 Exporting 2015 David love notes for audio generation...')
    
    // Read the 2015 David love notes candidates
    const candidatesPath = path.join(process.cwd(), 'data', '2015-david-love-notes.json')
    
    if (!fs.existsSync(candidatesPath)) {
      console.log('❌ 2015 David love notes candidates file not found')
      console.log('Please run: node scripts/find-2015-love-notes.mjs first')
      return
    }
    
    const candidatesData = JSON.parse(fs.readFileSync(candidatesPath, 'utf-8'))
    const candidates = candidatesData.allNotes || []
    
    console.log(`📝 Found ${candidates.length} love notes from David in 2015`)
    
    // Filter to only include the best love notes (score >= 3 for quality)
    const qualityLoveNotes = candidates.filter(note => note.loveScore >= 3)
    
    console.log(`🎯 Found ${qualityLoveNotes.length} high-quality love notes (score >= 3)`)
    
    // Create CSV content
    const csvHeader = 'id,text,date,emotion,filename\n'
    const csvRows = qualityLoveNotes.map((note, index) => {
      const filename = `david-2015-love-note-${note.message_id}.wav`
      return `${note.message_id},"${note.text.replace(/"/g, '""')}",${note.readable_date},${note.primary_emotion || 'love'},${filename}`
    }).join('\n')
    
    const csvContent = csvHeader + csvRows
    
    // Save CSV file
    const outputPath = path.join(process.cwd(), 'data', '2015-david-love-notes-for-audio.csv')
    fs.writeFileSync(outputPath, csvContent)
    
    console.log('✅ Exported 2015 David love notes to:', outputPath)
    console.log('')
    console.log('📋 Next steps:')
    console.log('1. Go to https://app.hume.ai/')
    console.log('2. Upload the CSV file: data/2015-david-love-notes-for-audio.csv')
    console.log('3. Use their TTS feature to generate audio for each text')
    console.log('4. Download the generated WAV files')
    console.log('5. Place them in: public/audio/love-notes/')
    console.log('')
    console.log('🎵 After generating audio, run: node scripts/update-2015-david-love-notes-audio.mjs')
    
    // Also save the full list for reference
    const fullOutputPath = path.join(process.cwd(), 'data', '2015-david-love-notes-full.csv')
    const fullCsvRows = candidates.map((note, index) => {
      const filename = `david-2015-love-note-${note.message_id}.wav`
      return `${note.message_id},"${note.text.replace(/"/g, '""')}",${note.readable_date},${note.primary_emotion || 'love'},${filename}`
    }).join('\n')
    const fullCsvContent = csvHeader + fullCsvRows
    fs.writeFileSync(fullOutputPath, fullCsvContent)
    
    console.log('📄 Also saved full list to: data/2015-david-love-notes-full.csv')
    
  } catch (error) {
    console.error('❌ Error exporting 2015 David love notes:', error)
  }
}

export2015DavidLoveNotesForAudio() 