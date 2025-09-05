import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'data', 'love-notes-candidates.json')

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'Love notes candidates file not found' }, { status: 404 })
    }

    const fileContent = fs.readFileSync(filePath, 'utf-8')
    const data = JSON.parse(fileContent)

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error reading love notes candidates:', error)
    return NextResponse.json({ error: 'Failed to load love notes candidates' }, { status: 500 })
  }
} 