import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET() {
  try {
    const csvPath = path.join(process.cwd(), 'data', '2015-david-love-notes-for-audio.csv')
    
    if (!fs.existsSync(csvPath)) {
      return NextResponse.json({ error: 'CSV file not found' }, { status: 404 })
    }

    const csvContent = fs.readFileSync(csvPath, 'utf-8')
    const lines = csvContent.split('\n')
    const headers = lines[0].split(',')
    
    const notes = lines.slice(1).filter(line => line.trim()).map(line => {
      // Parse CSV properly handling quoted fields
      const values: string[] = []
      let current = ''
      let inQuotes = false
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i]
        if (char === '"') {
          inQuotes = !inQuotes
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim())
          current = ''
        } else {
          current += char
        }
      }
      values.push(current.trim()) // Add the last value
      
      return {
        id: values[0]?.replace(/"/g, '') || '',
        text: values[1]?.replace(/"/g, '') || '',
        date: values[2]?.replace(/"/g, '') || '',
        emotion: values[3]?.replace(/"/g, '') || '',
        filename: values[4]?.replace(/"/g, '') || ''
      }
    })

    return NextResponse.json({ 
      notes,
      total: notes.length,
      year: 2015
    })
  } catch (error) {
    console.error('Error reading 2015 love notes:', error)
    return NextResponse.json({ error: 'Failed to load love notes' }, { status: 500 })
  }
} 