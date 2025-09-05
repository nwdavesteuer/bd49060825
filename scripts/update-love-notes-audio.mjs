import fs from 'fs'
import path from 'path'

async function updateLoveNotesAudio() {
  try {
    console.log('🎵 Updating love notes with audio file paths...')
    
    // Read the love notes candidates
    const candidatesPath = path.join(process.cwd(), 'data', 'love-notes-candidates.json')
    const audioDir = path.join(process.cwd(), 'public', 'audio', 'love-notes')
    
    if (!fs.existsSync(candidatesPath)) {
      console.log('❌ Love notes candidates file not found')
      return
    }
    
    if (!fs.existsSync(audioDir)) {
      console.log('❌ Audio directory not found:', audioDir)
      console.log('Please create the directory and add your WAV files')
      return
    }
    
    const candidatesData = JSON.parse(fs.readFileSync(candidatesPath, 'utf-8'))
    const candidates = candidatesData.topNotes || []
    
    // Get list of available audio files
    const audioFiles = fs.readdirSync(audioDir).filter(file => file.endsWith('.wav'))
    console.log(`🎵 Found ${audioFiles.length} audio files`)
    
    // Update candidates with audio paths
    const updatedCandidates = candidates.map(note => {
      const expectedFilename = `love-note-${note.message_id}.wav`
      const audioPath = audioFiles.find(file => file === expectedFilename)
      
      return {
        ...note,
        audio_file: audioPath ? `/audio/love-notes/${audioPath}` : null,
        has_audio: !!audioPath
      }
    })
    
    // Count how many have audio
    const withAudio = updatedCandidates.filter(note => note.has_audio).length
    console.log(`✅ ${withAudio} out of ${candidates.length} love notes have audio`)
    
    // Save updated data
    const updatedData = {
      ...candidatesData,
      topNotes: updatedCandidates
    }
    
    fs.writeFileSync(candidatesPath, JSON.stringify(updatedData, null, 2))
    
    console.log('✅ Updated love notes data with audio paths')
    console.log('')
    console.log('📋 Next steps:')
    console.log('1. Visit /love-notes-selector to see audio players')
    console.log('2. Audio will play from local WAV files')
    console.log('3. No API calls needed - much faster!')
    
  } catch (error) {
    console.error('❌ Error updating love notes audio:', error)
  }
}

updateLoveNotesAudio() 