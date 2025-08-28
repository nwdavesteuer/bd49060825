import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { listAudioFiles } from '@/lib/supabase-storage'

export async function GET() {
  try {
    // First try to get files from Supabase storage
    console.log('🔍 Checking Supabase storage for audio files...')
    const supabaseFiles = await listAudioFiles()
    
    if (supabaseFiles.length > 0) {
      console.log(`✅ Found ${supabaseFiles.length} audio files in Supabase storage`)
      return NextResponse.json(supabaseFiles)
    }
    
    // Fallback to local files if Supabase storage is empty
    console.log('📁 Falling back to local audio files...')
    const audioDir = path.join(process.cwd(), 'public', 'audio', 'love-notes-mp3')
    
    // Check if directory exists
    if (!fs.existsSync(audioDir)) {
      console.log('❌ No local audio directory found')
      return NextResponse.json([])
    }
    
    // Read all files in the directory
    const files = fs.readdirSync(audioDir)
    
    // Filter for .mp3 files only
    const audioFiles = files.filter(file => file.endsWith('.mp3'))
    
    console.log(`📁 Found ${audioFiles.length} local audio files`)
    
    return NextResponse.json(audioFiles)
  } catch (error) {
    console.error('Error reading audio files:', error)
    return NextResponse.json([])
  }
}