import { NextRequest, NextResponse } from 'next/server'
import { iphonePhotoService } from '@/lib/iphone-photo-service'

export async function POST(request: NextRequest) {
  try {
    const { action, messageId, startDate, endDate, latitude, longitude, radius } = await request.json()

    switch (action) {
      case 'extractPhotos':
        return await extractPhotosFromiPhone()
      case 'matchPhotos':
        return await matchPhotosWithMessages()
      case 'getPhotosForMessage':
        return await getPhotosForMessage(messageId)
      case 'getPhotosForDateRange':
        return await getPhotosForDateRange(startDate, endDate)
      case 'getPhotosForLocation':
        return await getPhotosForLocation(latitude, longitude, radius)
      case 'refreshPhotos':
        return await refreshPhotos()
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('iPhone Photos API error:', error)
    return NextResponse.json(
      { error: 'Failed to process iPhone photos request' },
      { status: 500 }
    )
  }
}

async function extractPhotosFromiPhone() {
  try {
    const photos = await iphonePhotoService.extractPhotosFromiPhone()
    return NextResponse.json({
      success: true,
      photos,
      count: photos.length
    })
  } catch (error) {
    console.error('Error extracting photos from iPhone:', error)
    return NextResponse.json(
      { error: 'Failed to extract photos from iPhone' },
      { status: 500 }
    )
  }
}

async function matchPhotosWithMessages() {
  try {
    const matches = await iphonePhotoService.matchPhotosWithMessages()
    return NextResponse.json({
      success: true,
      matches,
      count: matches.length
    })
  } catch (error) {
    console.error('Error matching photos with messages:', error)
    return NextResponse.json(
      { error: 'Failed to match photos with messages' },
      { status: 500 }
    )
  }
}

async function getPhotosForMessage(messageId: string) {
  try {
    const photos = await iphonePhotoService.getPhotosForMessage(messageId)
    return NextResponse.json({
      success: true,
      photos,
      count: photos.length
    })
  } catch (error) {
    console.error('Error getting photos for message:', error)
    return NextResponse.json(
      { error: 'Failed to get photos for message' },
      { status: 500 }
    )
  }
}

async function getPhotosForDateRange(startDate: string, endDate: string) {
  try {
    const photos = await iphonePhotoService.getPhotosForDateRange(startDate, endDate)
    return NextResponse.json({
      success: true,
      photos,
      count: photos.length
    })
  } catch (error) {
    console.error('Error getting photos for date range:', error)
    return NextResponse.json(
      { error: 'Failed to get photos for date range' },
      { status: 500 }
    )
  }
}

async function getPhotosForLocation(latitude: number, longitude: number, radius: number) {
  try {
    const photos = await iphonePhotoService.getPhotosForLocation(latitude, longitude, radius)
    return NextResponse.json({
      success: true,
      photos,
      count: photos.length
    })
  } catch (error) {
    console.error('Error getting photos for location:', error)
    return NextResponse.json(
      { error: 'Failed to get photos for location' },
      { status: 500 }
    )
  }
}

async function refreshPhotos() {
  try {
    await iphonePhotoService.refreshPhotos()
    return NextResponse.json({
      success: true,
      message: 'Photos refreshed successfully'
    })
  } catch (error) {
    console.error('Error refreshing photos:', error)
    return NextResponse.json(
      { error: 'Failed to refresh photos' },
      { status: 500 }
    )
  }
} 