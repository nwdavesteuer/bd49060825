import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const messageDatesFile = path.join(process.cwd(), 'data/message-dates.json')

    if (!fs.existsSync(messageDatesFile)) {
      return NextResponse.json({ photos: [], message: 'No message dates found' })
    }

    const messageDates = JSON.parse(fs.readFileSync(messageDatesFile, 'utf8'))

    const recentDates = messageDates.filter((date: string) => {
      const year = parseInt(date.split('-')[0])
      return year >= 2024
    })

    const photos: any[] = []
    for (const date of recentDates.slice(0, 20)) {
      const photoCount = Math.floor(Math.random() * 5) + 1
      for (let i = 0; i < photoCount; i++) {
        const photoId = `local_${date}_${i + 1}`
        const photoUrl = `/api/mock-photo?date=${date}&id=${photoId}`
        photos.push({
          id: photoId,
          url: photoUrl,
          date,
          description: `Photo from ${date}`,
          tags: ['local', 'message-date'],
          source: 'local-photos',
          location: {
            latitude: 37.7749 + (Math.random() - 0.5) * 0.1,
            longitude: -122.4194 + (Math.random() - 0.5) * 0.1,
            name: 'San Francisco Area',
          },
        })
      }
    }

    return NextResponse.json({ photos, total: photos.length, message: `Generated ${photos.length} local photos for ${recentDates.slice(0, 20).length} dates` })
  } catch (error) {
    console.error('Error loading local photos:', error)
    return NextResponse.json({ error: 'Failed to load local photos' }, { status: 500 })
  }
} 