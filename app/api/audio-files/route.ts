import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET() {
  try {
    const audioDir = path.join(process.cwd(), 'public', 'audio', 'love-notes-mp3')
    
    // Check if directory exists
    if (!fs.existsSync(audioDir)) {
      return NextResponse.json([])
    }
    
    // Read all files in the directory
    const files = fs.readdirSync(audioDir)
    
    // Filter for .mp3 files only
    const audioFiles = files.filter(file => file.endsWith('.mp3'))
    
    console.log(`Found ${audioFiles.length} audio files`)
    
    return NextResponse.json(audioFiles)
  } catch (error) {
    console.error('Error reading audio files:', error)
    return NextResponse.json([])
  }
}