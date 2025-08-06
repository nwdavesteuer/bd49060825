import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET(request: NextRequest) {
  try {
    // Check if we have Google Photos results
    const resultsFile = path.join(process.cwd(), 'data/google-photos-results.json')
    
    if (fs.existsSync(resultsFile)) {
      const results = JSON.parse(fs.readFileSync(resultsFile, 'utf8'))
      
      // Convert Google Photos format to our Photo format
      const photos = []
      for (const [date, mediaItems] of Object.entries(results)) {
        for (const item of mediaItems as any[]) {
          photos.push({
            id: item.id,
            url: item.baseUrl + '=w400-h300-c', // Optimized for display
            date: date,
            description: item.filename,
            tags: [],
            source: 'google-photos'
          })
        }
      }
      
      return NextResponse.json({ 
        photos,
        total: photos.length,
        message: 'Photos loaded from Google Photos cache'
      })
    } else {
      return NextResponse.json({ 
        photos: [],
        total: 0,
        message: 'No Google Photos data found. Run the Google Photos service first.'
      })
    }
  } catch (error) {
    console.error('Error fetching Google Photos:', error)
    return NextResponse.json(
      { error: 'Failed to fetch Google Photos' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json()
    
    if (action === 'fetch') {
      // Trigger Google Photos fetch
      const { spawn } = require('child_process')
      
      return new Promise((resolve) => {
        const child = spawn('node', ['scripts/google-photos-service.mjs', 'fetch'], {
          cwd: process.cwd(),
          stdio: 'pipe'
        })
        
        let output = ''
        child.stdout.on('data', (data: Buffer) => {
          output += data.toString()
        })
        
        child.stderr.on('data', (data: Buffer) => {
          output += data.toString()
        })
        
        child.on('close', (code: number) => {
          if (code === 0) {
            resolve(NextResponse.json({ 
              success: true,
              message: 'Google Photos fetched successfully'
            }))
          } else {
            resolve(NextResponse.json(
              { error: 'Failed to fetch Google Photos', output },
              { status: 500 }
            ))
          }
        })
      })
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Error in Google Photos API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 