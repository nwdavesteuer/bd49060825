import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET(
  request: NextRequest,
  { params }: { params: { year: string } }
) {
  try {
    const year = params.year
    const csvPath = path.join(process.cwd(), 'data', `${year}-david-love-notes-for-audio.csv`)
    
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
    console.error(`Error reading CSV for year ${params.year}:`, error)
    return NextResponse.json({ error: 'Failed to load CSV' }, { status: 500 })
  }
} 