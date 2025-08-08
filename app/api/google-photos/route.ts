import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const resultsFile = path.join(process.cwd(), 'data/google-photos-results.json')

    if (fs.existsSync(resultsFile)) {
      const results = JSON.parse(fs.readFileSync(resultsFile, 'utf8'))
      const photos: any[] = []
      for (const [date, mediaItems] of Object.entries(results)) {
        for (const item of mediaItems as any[]) {
          photos.push({
            id: (item as any).id,
            url: (item as any).baseUrl + '=w400-h300-c',
            date,
            description: (item as any).filename,
            tags: [],
            source: 'google-photos',
          })
        }
      }
      return NextResponse.json({ photos, total: photos.length, message: 'Photos loaded from Google Photos cache' })
    }

    return NextResponse.json({ photos: [], total: 0, message: 'No Google Photos data found.' })
  } catch (error) {
    console.error('Error fetching Google Photos:', error)
    return NextResponse.json({ error: 'Failed to fetch Google Photos' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json()

    if (action === 'fetch') {
      if (process.env.VERCEL) {
        return NextResponse.json(
          { error: 'Fetch job disabled in serverless. Run the fetch script outside Vercel and persist results to Supabase/Storage.' },
          { status: 501 }
        )
      }

      // Local/dev only: spawn script
      const { spawn } = require('child_process')
      return new Promise((resolve) => {
        const child = spawn('node', ['scripts/google-photos-service.mjs', 'fetch'], { cwd: process.cwd(), stdio: 'pipe' })
        let output = ''
        child.stdout.on('data', (data: Buffer) => { output += data.toString() })
        child.stderr.on('data', (data: Buffer) => { output += data.toString() })
        child.on('close', (code: number) => {
          if (code === 0) {
            resolve(NextResponse.json({ success: true, message: 'Google Photos fetched successfully' }))
          } else {
            resolve(NextResponse.json({ error: 'Failed to fetch Google Photos', output }, { status: 500 }))
          }
        })
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Error in Google Photos API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 