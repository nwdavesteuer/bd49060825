"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Image, Calendar, MapPin, Heart, Camera, Upload, X, Smartphone, Cloud } from "lucide-react"
import { iCloudPhotoService, type iCloudPhoto, type iCloudAlbumInfo } from "@/lib/icloud-photo-service"
import { iphonePhotoService, type iPhonePhoto } from "@/lib/iphone-photo-service"

interface Photo {
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
  messageId?: string // Link to specific message
}

interface PhotoTimelineProps {
  messages: any[]
  onPhotoSelect?: (photo: Photo) => void
}

export default function PhotoTimeline({ messages, onPhotoSelect }: PhotoTimelineProps) {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(false)
  const [viewMode, setViewMode] = useState<"timeline" | "grid" | "map">("timeline")
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [showiCloudLink, setShowiCloudLink] = useState(false)
  const [iCloudLink, setiCloudLink] = useState("")
  const [iCloudPhotos, setiCloudPhotos] = useState<iCloudPhoto[]>([])
  const [iCloudAlbums, setiCloudAlbums] = useState<iCloudAlbumInfo[]>([])
  const [processingiCloud, setProcessingiCloud] = useState(false)
  const [iphonePhotos, setiPhonePhotos] = useState<iPhonePhoto[]>([])
  const [processingiPhone, setProcessingiPhone] = useState(false)
  const [photoMatches, setPhotoMatches] = useState<any[]>([])
  const [googlePhotos, setGooglePhotos] = useState<any[]>([])
  const [processingGoogle, setProcessingGoogle] = useState(false)

  // Load photos from data file if available
  useEffect(() => {
    const loadPhotos = async () => {
      try {
        // Try to load local photos first
        const localResponse = await fetch('/api/local-photos')
        if (localResponse.ok) {
          const data = await localResponse.json()
          setPhotos(data.photos || [])
          console.log(`📸 Loaded ${data.photos?.length || 0} local photos`)
          return
        }
        
        // Fallback to photo metadata
        const response = await fetch('/data/photo-metadata.json')
        if (response.ok) {
          const data = await response.json()
          setPhotos(data)
          console.log(`📸 Loaded ${data.length} photos from metadata`)
        } else {
          console.log('📸 Using mock photos')
        }
      } catch (error) {
        console.log('📸 Using mock photos')
      }
    }

    loadPhotos()
  }, [])

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files && files.length > 0) {
      setLoading(true)
      
      // Simulate upload process
      setTimeout(() => {
        const newPhotos: Photo[] = Array.from(files).map((file, index) => ({
          id: `upload-${Date.now()}-${index}`,
          url: URL.createObjectURL(file),
          date: new Date().toISOString().split('T')[0],
          description: file.name,
          tags: []
        }))
        
        setPhotos(prev => [...prev, ...newPhotos])
        setLoading(false)
      }, 1000)
    }
  }

  const handleGooglePhotosFetch = async () => {
    setProcessingGoogle(true)
    try {
      const response = await fetch('/api/google-photos')
      if (response.ok) {
        const data = await response.json()
        setGooglePhotos(data.photos || [])
        console.log(`📸 Loaded ${data.photos?.length || 0} Google Photos`)
      } else {
        console.error('Failed to fetch Google Photos')
      }
    } catch (error) {
      console.error('Error fetching Google Photos:', error)
    } finally {
      setProcessingGoogle(false)
    }
  }

  const filteredPhotos = selectedDate 
    ? [...photos, ...iCloudPhotos, ...iphonePhotos, ...googlePhotos].filter(photo => photo.date === selectedDate)
    : [...photos, ...iCloudPhotos, ...iphonePhotos, ...googlePhotos]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Photo Timeline</h2>
          <p className="text-gray-600">Visual memories alongside your messages</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode("timeline")}
            className={viewMode === "timeline" ? "bg-blue-100" : ""}
          >
            <Calendar className="h-4 w-4 mr-1" />
            Timeline
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode("grid")}
            className={viewMode === "grid" ? "bg-blue-100" : ""}
          >
            <Image className="h-4 w-4 mr-1" />
            Grid
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode("map")}
            className={viewMode === "map" ? "bg-blue-100" : ""}
          >
            <MapPin className="h-4 w-4 mr-1" />
            Map
          </Button>
        </div>
      </div>

      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Add Photos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={() => document.getElementById('photo-upload')?.click()}>
                <Camera className="h-4 w-4 mr-2" />
                Upload Photos
              </Button>
              <Button variant="outline" onClick={() => setShowiCloudLink(true)}>
                <Heart className="h-4 w-4 mr-2" />
                Add iCloud Link
              </Button>
              <Button 
                variant="outline" 
                onClick={async () => {
                  setProcessingiPhone(true)
                  try {
                    console.log('📱 Extracting photos from iPhone...')
                    const photos = await iphonePhotoService.extractPhotosFromiPhone()
                    setiPhonePhotos(photos)
                    console.log('✅ iPhone photos extracted:', photos.length)
                    
                    // Match photos with messages
                    console.log('🎯 Matching photos with messages...')
                    const matches = await iphonePhotoService.matchPhotosWithMessages()
                    setPhotoMatches(matches)
                    console.log('✅ Photo-message matches found:', matches.length)
                  } catch (error) {
                    console.error('❌ Failed to extract iPhone photos:', error)
                    alert(`Failed to extract iPhone photos: ${error.message}`)
                  } finally {
                    setProcessingiPhone(false)
                  }
                }}
                disabled={processingiPhone}
              >
                <Smartphone className="h-4 w-4 mr-2" />
                {processingiPhone ? 'Extracting...' : 'Extract from iPhone'}
              </Button>
              <Button 
                variant="outline" 
                onClick={handleGooglePhotosFetch}
                disabled={processingGoogle}
              >
                <Cloud className="h-4 w-4 mr-2" />
                {processingGoogle ? 'Loading...' : 'Load from Google Photos'}
              </Button>
            </div>
            
            {/* Connected iCloud Albums */}
            {iCloudAlbums.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Connected Albums:</h4>
                <div className="space-y-2">
                  {iCloudAlbums.map((album) => (
                    <div key={album.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div>
                        <p className="text-sm font-medium">{album.name}</p>
                        <p className="text-xs text-gray-500">{album.photoCount} photos • {album.owner}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          await iCloudPhotoService.removeAlbum(album.id)
                          setiCloudAlbums(prev => prev.filter(a => a.id !== album.id))
                          setiCloudPhotos(prev => prev.filter(p => p.albumName !== album.name))
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* iPhone Photo Matches */}
            {photoMatches.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">📱 iPhone Photo Matches:</h4>
                <div className="space-y-2">
                  {photoMatches.slice(0, 5).map((match, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-blue-50 rounded">
                      <div className="flex items-center gap-3">
                        <img 
                          src={match.photo.url} 
                          alt={match.photo.description}
                          className="w-12 h-12 object-cover rounded"
                        />
                        <div>
                          <p className="text-sm font-medium">{match.photo.description}</p>
                          <p className="text-xs text-gray-500">
                            Matched with message on {match.messageDate} 
                            {match.confidence < 1.0 && ` (${Math.round(match.confidence * 100)}% confidence)`}
                          </p>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">
                        {match.confidence === 1.0 ? '🎯 Exact match' : '📅 Nearby date'}
                      </div>
                    </div>
                  ))}
                  {photoMatches.length > 5 && (
                    <p className="text-xs text-gray-500 text-center">
                      +{photoMatches.length - 5} more matches
                    </p>
                  )}
                </div>
              </div>
            )}
            
            <input
              id="photo-upload"
              type="file"
              multiple
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
            />
            
            {loading && (
              <div className="text-sm text-gray-500">
                Uploading photos...
              </div>
            )}
            
            {/* iCloud Link Modal */}
            {showiCloudLink && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 w-full max-w-md">
                  <h3 className="text-lg font-semibold mb-4">Add iCloud Photo Library</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Paste your shared iCloud photo library link here. This will allow us to access and display photos alongside your messages.
                  </p>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        iCloud Shared Library URL
                      </label>
                      <Input
                        type="url"
                        placeholder="https://www.icloud.com/sharedalbum/..."
                        value={iCloudLink}
                        onChange={(e) => setiCloudLink(e.target.value)}
                        className="w-full"
                      />
                    </div>
                    
                    <div className="text-xs text-gray-500">
                      <p>💡 How to get your iCloud link:</p>
                      <ol className="list-decimal list-inside mt-2 space-y-1">
                        <li>Open Photos app on your iPhone/Mac</li>
                        <li>Select the album you want to share</li>
                        <li>Tap "Share" → "Copy Link"</li>
                        <li>Paste the link above</li>
                      </ol>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                                            onClick={async () => {
                      if (iCloudLink) {
                        setProcessingiCloud(true)
                        try {
                          console.log('🔗 Processing iCloud link:', iCloudLink)
                          const albumInfo = await iCloudPhotoService.processiCloudLink(iCloudLink)
                          if (albumInfo) {
                            console.log('✅ Album info received:', albumInfo)
                            const photos = await iCloudPhotoService.getPhotosFromAlbum(albumInfo.id)
                            console.log('📸 Photos fetched:', photos.length)
                            setiCloudPhotos(prev => [...prev, ...photos])
                            setiCloudAlbums(prev => [...prev, albumInfo])
                            setShowiCloudLink(false)
                            setiCloudLink("")
                          }
                        } catch (error) {
                          console.error('❌ Failed to process iCloud link:', error)
                          alert(`Failed to process iCloud link: ${error.message}`)
                        } finally {
                          setProcessingiCloud(false)
                        }
                      }
                    }}
                        className="flex-1"
                        disabled={processingiCloud}
                      >
                        {processingiCloud ? 'Processing...' : 'Add Library'}
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setShowiCloudLink(false)
                          setiCloudLink("")
                        }}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Photo Display */}
      {viewMode === "timeline" && (
        <div className="space-y-6">
          {filteredPhotos.map((photo) => (
            <Card key={photo.id} className="overflow-hidden">
              <div className="flex">
                <div className="w-1/3">
                  <img
                    src={photo.url}
                    alt={photo.description || "Photo"}
                    className="w-full h-48 object-cover"
                  />
                </div>
                <div className="w-2/3 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">{photo.date}</span>
                    {photo.location && (
                      <>
                        <MapPin className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600">{photo.location.name || `${photo.location.latitude}, ${photo.location.longitude}`}</span>
                      </>
                    )}
                  </div>
                  
                  {photo.description && (
                    <p className="text-gray-800 mb-3">{photo.description}</p>
                  )}
                  
                  {photo.tags && photo.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {photo.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() => onPhotoSelect?.(photo)}
                  >
                    Link to Message
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {viewMode === "grid" && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredPhotos.map((photo) => (
            <Card key={photo.id} className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow">
              <img
                src={photo.url}
                alt={photo.description || "Photo"}
                className="w-full h-48 object-cover"
              />
              <CardContent className="p-3">
                <p className="text-sm font-medium truncate">{photo.description}</p>
                <p className="text-xs text-gray-500">{photo.date}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {viewMode === "map" && (
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-gray-500">
              <MapPin className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Map view coming soon...</p>
              <p className="text-sm">View photos by location</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 