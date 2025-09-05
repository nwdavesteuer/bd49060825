// iCloud Photo Service for handling shared album links

export interface iCloudPhoto {
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
}

export interface iCloudAlbumInfo {
  id: string
  name: string
  photoCount: number
  sharedUrl: string
  createdAt: string
}

class CloudPhotoService {
  private albums: Map<string, iCloudPhoto[]> = new Map()
  private albumInfo: Map<string, iCloudAlbumInfo> = new Map()

  private extractAlbumId(link: string): string | null {
    // Extract album ID from iCloud shared album URL
    const match = link.match(/sharedalbum\/#([A-Za-z0-9]+)/)
    return match ? match[1] : null
  }

  async processiCloudLink(link: string): Promise<iCloudAlbumInfo | null> {
    const albumId = this.extractAlbumId(link)
    if (!albumId) {
      throw new Error('Invalid iCloud shared album link')
    }

    try {
      // Use our API route to process the iCloud link
      const response = await fetch('/api/icloud', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'processLink',
          link
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to process iCloud link: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.success) {
        this.albumInfo.set(albumId, data.albumInfo)
        return data.albumInfo
      } else {
        throw new Error(data.error || 'Failed to process iCloud link')
      }
    } catch (error) {
      console.error('Failed to process iCloud link:', error)
      throw error
    }
  }

  async getPhotosFromAlbum(albumId: string): Promise<iCloudPhoto[]> {
    if (this.albums.has(albumId)) {
      return this.albums.get(albumId)!
    }

    try {
      // Use our API route to fetch photos
      const response = await fetch('/api/icloud', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'getPhotos',
          albumId
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch photos: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.success) {
        this.albums.set(albumId, data.photos)
        return data.photos
      } else {
        throw new Error(data.error || 'Failed to fetch photos')
      }
    } catch (error) {
      console.error('Failed to fetch photos from album:', error)
      throw error
    }
  }

  async getAllPhotos(): Promise<iCloudPhoto[]> {
    const allPhotos: iCloudPhoto[] = []
    for (const [albumId, photos] of this.albums) {
      allPhotos.push(...photos)
    }
    return allPhotos
  }

  async getPhotosByDateRange(startDate: string, endDate: string): Promise<iCloudPhoto[]> {
    const allPhotos = await this.getAllPhotos()
    return allPhotos.filter(photo => {
      const photoDate = new Date(photo.date)
      const start = new Date(startDate)
      const end = new Date(endDate)
      return photoDate >= start && photoDate <= end
    })
  }

  async getPhotosByLocation(latitude: number, longitude: number, radius: number): Promise<iCloudPhoto[]> {
    const allPhotos = await this.getAllPhotos()
    return allPhotos.filter(photo => {
      if (!photo.location) return false
      const distance = this.calculateDistance(
        latitude, longitude,
        photo.location.latitude, photo.location.longitude
      )
      return distance <= radius
    })
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

  async getAlbumInfo(albumId: string): Promise<iCloudAlbumInfo | null> {
    return this.albumInfo.get(albumId) || null
  }

  async getAllAlbumInfo(): Promise<iCloudAlbumInfo[]> {
    return Array.from(this.albumInfo.values())
  }

  async removeAlbum(albumId: string): Promise<void> {
    this.albums.delete(albumId)
    this.albumInfo.delete(albumId)
  }
}

export const iCloudPhotoService = new CloudPhotoService() 