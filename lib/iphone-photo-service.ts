import { supabase } from './supabase'

export interface iPhonePhoto {
  id: string
  url: string
  date: string
  location?: {
    latitude: number
    longitude: number
    name?: string
  }
  description?: string
  tags?: string[]
  messageId?: string
  matchedDate?: string
  confidence?: number
}

export interface PhotoMatch {
  photo: iPhonePhoto
  messageDate: string
  messageId: string
  confidence: number
}

class iPhonePhotoService {
  private photos: iPhonePhoto[] = []
  private messageDates: Set<string> = new Set()

  async initializeMessageDates(): Promise<void> {
    try {
      // Fetch all message dates from the database
      const { data: messages, error } = await supabase
        .from('fulldata_set')
        .select('id, date')
        .not('date', 'is', null)

      if (error) {
        console.error('Error fetching message dates:', error)
        return
      }

      // Extract unique dates from messages
      this.messageDates = new Set(
        messages?.map(msg => {
          const date = new Date(msg.date)
          return date.toISOString().split('T')[0] // YYYY-MM-DD format
        }) || []
      )

      console.log(`📅 Found ${this.messageDates.size} unique message dates`)
    } catch (error) {
      console.error('Failed to initialize message dates:', error)
    }
  }

  async extractPhotosFromiPhone(): Promise<iPhonePhoto[]> {
    try {
      console.log('📱 Attempting to extract photos from iPhone...')
      
      // This would integrate with iPhone photo access
      // For now, we'll simulate the process with mock data
      const mockPhotos = await this.simulateiPhonePhotoExtraction()
      
      this.photos = mockPhotos
      console.log(`📸 Extracted ${this.photos.length} photos from iPhone`)
      
      return this.photos
    } catch (error) {
      console.error('Failed to extract photos from iPhone:', error)
      throw error
    }
  }

  private async simulateiPhonePhotoExtraction(): Promise<iPhonePhoto[]> {
    // Simulate photos that would be extracted from iPhone
    const mockPhotos: iPhonePhoto[] = [
      {
        id: 'iphone_1',
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
        id: 'iphone_2',
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
        id: 'iphone_3',
        url: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop',
        date: '2023-09-01',
        location: {
          latitude: 37.7749,
          longitude: -122.4194,
          name: 'Home'
        },
        description: 'Cooking together',
        tags: ['cooking', 'home', 'food']
      },
      {
        id: 'iphone_4',
        url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop',
        date: '2023-09-10',
        location: {
          latitude: 37.7749,
          longitude: -122.4194,
          name: 'Home'
        },
        description: 'Orli playing in the garden',
        tags: ['family', 'garden', 'orli']
      },
      {
        id: 'iphone_5',
        url: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=400&h=300&fit=crop',
        date: '2023-09-15',
        location: {
          latitude: 37.7749,
          longitude: -122.4194,
          name: 'San Francisco, CA'
        },
        description: 'Date night at the new restaurant',
        tags: ['date', 'restaurant', 'night']
      }
    ]

    return mockPhotos
  }

  async matchPhotosWithMessages(): Promise<PhotoMatch[]> {
    if (this.messageDates.size === 0) {
      await this.initializeMessageDates()
    }

    const matches: PhotoMatch[] = []

    for (const photo of this.photos) {
      const photoDate = photo.date
      
      // Check for exact date matches
      if (this.messageDates.has(photoDate)) {
        const messageIds = await this.getMessageIdsForDate(photoDate)
        
        for (const messageId of messageIds) {
          matches.push({
            photo: {
              ...photo,
              messageId,
              matchedDate: photoDate,
              confidence: 1.0
            },
            messageDate: photoDate,
            messageId,
            confidence: 1.0
          })
        }
      }

      // Check for nearby date matches (±1 day)
      const nearbyMatches = await this.findNearbyDateMatches(photo, photoDate)
      matches.push(...nearbyMatches)
    }

    console.log(`🎯 Found ${matches.length} photo-message matches`)
    return matches
  }

  private async getMessageIdsForDate(date: string): Promise<string[]> {
    try {
      const { data: messages, error } = await supabase
        .from('fulldata_set')
        .select('id')
        .eq('date', date)

      if (error) {
        console.error('Error fetching messages for date:', error)
        return []
      }

      return messages?.map(msg => msg.id) || []
    } catch (error) {
      console.error('Failed to get message IDs for date:', error)
      return []
    }
  }

  private async findNearbyDateMatches(photo: iPhonePhoto, photoDate: string): Promise<PhotoMatch[]> {
    const matches: PhotoMatch[] = []
    const photoDateObj = new Date(photoDate)

    // Check ±1 day
    for (let i = -1; i <= 1; i++) {
      if (i === 0) continue // Skip exact match (already handled)

      const checkDate = new Date(photoDateObj)
      checkDate.setDate(checkDate.getDate() + i)
      const checkDateStr = checkDate.toISOString().split('T')[0]

      if (this.messageDates.has(checkDateStr)) {
        const messageIds = await this.getMessageIdsForDate(checkDateStr)
        const confidence = i === 0 ? 1.0 : 0.8 // Lower confidence for nearby dates

        for (const messageId of messageIds) {
          matches.push({
            photo: {
              ...photo,
              messageId,
              matchedDate: checkDateStr,
              confidence
            },
            messageDate: checkDateStr,
            messageId,
            confidence
          })
        }
      }
    }

    return matches
  }

  async getPhotosForMessage(messageId: string): Promise<iPhonePhoto[]> {
    const matches = await this.matchPhotosWithMessages()
    return matches
      .filter(match => match.messageId === messageId)
      .map(match => match.photo)
  }

  async getPhotosForDateRange(startDate: string, endDate: string): Promise<iPhonePhoto[]> {
    const matches = await this.matchPhotosWithMessages()
    return matches
      .filter(match => {
        const matchDate = new Date(match.messageDate)
        const start = new Date(startDate)
        const end = new Date(endDate)
        return matchDate >= start && matchDate <= end
      })
      .map(match => match.photo)
  }

  async getPhotosForLocation(latitude: number, longitude: number, radius: number): Promise<iPhonePhoto[]> {
    const matches = await this.matchPhotosWithMessages()
    return matches
      .filter(match => {
        if (!match.photo.location) return false
        const distance = this.calculateDistance(
          latitude, longitude,
          match.photo.location.latitude, match.photo.location.longitude
        )
        return distance <= radius
      })
      .map(match => match.photo)
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371 // Earth's radius in kilometers
    const dLat = this.deg2rad(lat2 - lat1)
    const dLon = this.deg2rad(lon2 - lon1)
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI/180)
  }

  async getAllPhotos(): Promise<iPhonePhoto[]> {
    return this.photos
  }

  async refreshPhotos(): Promise<void> {
    console.log('🔄 Refreshing iPhone photos...')
    await this.extractPhotosFromiPhone()
    await this.initializeMessageDates()
  }
}

export const iphonePhotoService = new iPhonePhotoService() 