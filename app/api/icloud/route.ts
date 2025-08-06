import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { action, link, albumId } = await request.json()

    switch (action) {
      case 'processLink':
        return await processiCloudLink(link)
      case 'getPhotos':
        return await getPhotosFromAlbum(albumId)
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('iCloud API error:', error)
    return NextResponse.json(
      { error: 'Failed to process iCloud request' },
      { status: 500 }
    )
  }
}

async function processiCloudLink(link: string) {
  try {
    // Extract album ID from the link
    const albumIdMatch = link.match(/sharedalbum\/#([A-Za-z0-9]+)/)
    if (!albumIdMatch) {
      return NextResponse.json({ error: 'Invalid iCloud link format' }, { status: 400 })
    }

    const albumId = albumIdMatch[1]
    
    // Try to fetch album info from iCloud
    const response = await fetch(`https://www.icloud.com/sharedalbum/${albumId}`, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
    })

    if (!response.ok) {
      // If we can't access the album directly, return mock data for demo
      console.log(`Could not access iCloud album ${albumId}, returning mock data`)
      return NextResponse.json({
        success: true,
        albumInfo: {
          id: albumId,
          name: `Shared Album ${albumId}`,
          photoCount: 25,
          sharedUrl: link,
          createdAt: new Date().toISOString()
        },
        isMock: true
      })
    }

    const html = await response.text()
    
    // Extract album name from HTML
    const nameMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
    const albumName = nameMatch 
      ? nameMatch[1].replace(' - iCloud', '').trim() 
      : `Shared Album ${albumId}`

    // Extract photo count (this is a simplified approach)
    const photoCountMatch = html.match(/photo[s]?\s*count[^>]*>(\d+)/i)
    const photoCount = photoCountMatch ? parseInt(photoCountMatch[1]) : 0

    return NextResponse.json({
      success: true,
      albumInfo: {
        id: albumId,
        name: albumName,
        photoCount,
        sharedUrl: link,
        createdAt: new Date().toISOString()
      },
      isMock: false
    })

  } catch (error) {
    console.error('Error processing iCloud link:', error)
    return NextResponse.json(
      { error: 'Failed to process iCloud link' },
      { status: 500 }
    )
  }
}

async function getPhotosFromAlbum(albumId: string) {
  try {
    // Try to fetch photos from the album
    const response = await fetch(`https://www.icloud.com/sharedalbum/${albumId}`, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    })

    if (!response.ok) {
      // Return mock photos if we can't access the album
      console.log(`Could not access iCloud album ${albumId}, returning mock photos`)
      return NextResponse.json({
        success: true,
        photos: generateMockPhotos(albumId),
        isMock: true
      })
    }

    const html = await response.text()
    const photos = parsePhotosFromHTML(html, albumId)

    return NextResponse.json({
      success: true,
      photos,
      isMock: photos.length === 0
    })

  } catch (error) {
    console.error('Error fetching photos from album:', error)
    return NextResponse.json(
      { error: 'Failed to fetch photos from album' },
      { status: 500 }
    )
  }
}

function parsePhotosFromHTML(html: string, albumId: string) {
  const photos: any[] = []
  
  // This is a simplified parser - in a real implementation, you'd need to handle
  // the actual iCloud HTML structure and JavaScript data
  const photoMatches = html.match(/data-photo-url="([^"]+)"/g)
  const dateMatches = html.match(/data-date="([^"]+)"/g)
  const locationMatches = html.match(/data-location="([^"]+)"/g)

  if (photoMatches) {
    for (let i = 0; i < photoMatches.length; i++) {
      const photoUrl = photoMatches[i].match(/data-photo-url="([^"]+)"/)?.[1]
      const dateStr = dateMatches?.[i]?.match(/data-date="([^"]+)"/)?.[1]
      const locationStr = locationMatches?.[i]?.match(/data-location="([^"]+)"/)?.[1]

      if (photoUrl) {
        const photo: any = {
          id: `photo_${albumId}_${i}`,
          url: photoUrl,
          date: dateStr || new Date().toISOString().split('T')[0],
          description: `Photo from ${albumId}`,
          tags: ['icloud', 'shared']
        }

        if (locationStr) {
          try {
            const [lat, lng] = locationStr.split(',').map(Number)
            photo.location = {
              latitude: lat,
              longitude: lng,
              name: `${lat.toFixed(4)}, ${lng.toFixed(4)}`
            }
          } catch (e) {
            console.warn('Failed to parse location:', locationStr)
          }
        }

        photos.push(photo)
      }
    }
  }

  return photos
}

function generateMockPhotos(albumId: string) {
  return [
    {
      id: `photo_${albumId}_1`,
      url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=300&fit=crop',
      date: '2023-08-15',
      location: {
        latitude: 37.7749,
        longitude: -122.4194,
        name: 'San Francisco, CA'
      },
      description: 'Coffee date at Blue Bottle',
      tags: ['coffee', 'date', 'blue-bottle']
    },
    {
      id: `photo_${albumId}_2`,
      url: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&h=300&fit=crop',
      date: '2023-08-20',
      location: {
        latitude: 37.7694,
        longitude: -122.4862,
        name: 'Golden Gate Park'
      },
      description: 'Weekend walk in the park',
      tags: ['outdoors', 'walk', 'park']
    },
    {
      id: `photo_${albumId}_3`,
      url: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop',
      date: '2023-09-01',
      location: {
        latitude: 37.7749,
        longitude: -122.4194,
        name: 'Home'
      },
      description: 'Cooking together',
      tags: ['cooking', 'home', 'food']
    }
  ]
} 