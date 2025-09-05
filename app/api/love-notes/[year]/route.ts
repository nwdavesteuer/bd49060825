import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ year: string }> }
) {
  try {
    const { year } = await params
    // Prefer the corrected CSV when present to match the render plan
    const fixedPath = path.join(process.cwd(), 'data', `${year}-david-love-notes-for-audio-fixed.csv`)
    const standardPath = path.join(process.cwd(), 'data', `${year}-david-love-notes-for-audio.csv`)
    const csvPath = fs.existsSync(fixedPath) ? fixedPath : standardPath
    
    if (!fs.existsSync(csvPath)) {
      return NextResponse.json({ error: 'CSV file not found' }, { status: 404 })
    }

    const csvContent = fs.readFileSync(csvPath, 'utf-8')
    
    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
      }
    })
  } catch (error) {
    console.error(`Error reading CSV for year:`, error)
    return NextResponse.json({ error: 'Failed to load CSV' }, { status: 500 })
  }
} 