"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Play, Pause, ChevronLeft, ChevronRight, Calendar, Heart, Star } from "lucide-react"
import { supabase, TABLE_NAME } from "@/lib/supabase"
import { getAudioFileUrl } from "@/lib/supabase-storage"

interface AudioFile {
  filename: string
  year: number
  messageId: string
  index: number
}

interface DirectAudioPlayerProps {
  selectedYear?: number | null
}

export default function DirectAudioPlayer({ selectedYear = null }: DirectAudioPlayerProps) {
  const [audioFiles, setAudioFiles] = useState<AudioFile[]>([])
  const [selectedFile, setSelectedFile] = useState<AudioFile | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [availableYears, setAvailableYears] = useState<number[]>([])
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [activeTab, setActiveTab] = useState<"all" | "favorites">("all")
  const audioRef = useRef<HTMLAudioElement>(null)
  const [messageText, setMessageText] = useState<string>("")
  const [messageDate, setMessageDate] = useState<string>("")
  const [loadingMessage, setLoadingMessage] = useState<boolean>(false)

  // Load audio files directly from the API
  useEffect(() => {
    loadAudioFiles()
    loadFavorites()
  }, [])

  // Save favorites to localStorage whenever they change
  useEffect(() => {
    if (favorites.size > 0 || localStorage.getItem('loveNoteFavorites')) {
      localStorage.setItem('loveNoteFavorites', JSON.stringify(Array.from(favorites)))
    }
  }, [favorites])

  const loadFavorites = () => {
    try {
      const saved = localStorage.getItem('loveNoteFavorites')
      if (saved) {
        setFavorites(new Set(JSON.parse(saved)))
      }
    } catch (error) {
      console.error('Error loading favorites:', error)
    }
  }

  const toggleFavorite = (filename: string) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev)
      if (newFavorites.has(filename)) {
        newFavorites.delete(filename)
      } else {
        newFavorites.add(filename)
      }
      return newFavorites
    })
  }

  const loadAudioFiles = async () => {
    setIsLoading(true)
    try {
      // Get list of audio files from the public directory
      const response = await fetch('/api/audio-files')
      const files: string[] = await response.json()
      
      console.log(`Found ${files.length} audio files`)
      
      // Parse and sort files
      const parsedFiles: AudioFile[] = []
      const yearsSet = new Set<number>()
      
      files.forEach((filename, index) => {
        const match = filename.match(/david-(\d{4})-love-note-(\d+)\.mp3/)
        if (match) {
          const year = parseInt(match[1])
          const messageId = match[2]
          
          parsedFiles.push({
            filename,
            year,
            messageId,
            index
          })
          
          yearsSet.add(year)
        }
      })
      
      // Sort by year and message ID
      parsedFiles.sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year
        return parseInt(a.messageId) - parseInt(b.messageId)
      })
      
      setAudioFiles(parsedFiles)
      setAvailableYears(Array.from(yearsSet).sort())
    } catch (error) {
      console.error('Error loading audio files:', error)
      setAudioFiles([])
    } finally {
      setIsLoading(false)
    }
  }

  // Filter files by selected year and favorites
  const getFilteredFiles = () => {
    let files = audioFiles
    
    // Filter by favorites if on favorites tab
    if (activeTab === "favorites") {
      files = files.filter(file => favorites.has(file.filename))
    }
    
    // Filter by year if selected
    if (selectedYear) {
      files = files.filter(file => file.year === selectedYear)
    }
    
    return files
  }
  
  const filteredFiles = getFilteredFiles()

  const handlePlayPause = () => {
    if (!audioRef.current) return
    
    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
    }
    setIsPlaying(!isPlaying)
  }

  const handleSelectFile = async (file: AudioFile) => {
    // If clicking the same file that's playing, just toggle play/pause
    if (selectedFile?.filename === file.filename && isPlaying) {
      audioRef.current?.pause()
      setIsPlaying(false)
      return
    }
    
    setSelectedFile(file)
    setIsPlaying(false)
    // Load the corresponding message text for validation while listening
    loadMessageForFile(file).catch((err) => console.error("Failed to load message text:", err))
    
    if (audioRef.current) {
      audioRef.current.pause()
      
      // Get signed URL for the audio file
      try {
        const signedUrl = await getAudioFileUrl(file.filename)
        if (signedUrl) {
          audioRef.current.src = signedUrl
          console.log(`🎵 Loaded signed URL for ${file.filename}`)
        } else {
          // Fallback to local URL
          audioRef.current.src = `/audio/love-notes-mp3/${file.filename}`
          console.log(`🎵 Fallback to local URL for ${file.filename}`)
        }
      } catch (error) {
        console.error('Error getting audio URL:', error)
        // Fallback to local URL
        audioRef.current.src = `/audio/love-notes-mp3/${file.filename}`
      }
      
      audioRef.current.load()
      
      // Auto-play the selected file
      setTimeout(() => {
        audioRef.current?.play().catch(err => {
          console.error('Error playing audio:', err)
        })
      }, 100)
    }
  }

  async function loadMessageForFile(file: AudioFile) {
    try {
      setLoadingMessage(true)
      setMessageText("")
      setMessageDate("")
      const messageIdNum = Number.parseInt(file.messageId)
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select("text, readable_date")
        .eq("message_id", messageIdNum)
        .limit(1)
      if (error) throw error
      const row = data?.[0]
      setMessageText(row?.text || "")
      setMessageDate(row?.readable_date || "")
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingMessage(false)
    }
  }

  const handlePrevious = () => {
    if (!selectedFile) return
    const currentIndex = filteredFiles.findIndex(f => f.filename === selectedFile.filename)
    if (currentIndex > 0) {
      handleSelectFile(filteredFiles[currentIndex - 1])
    }
  }

  const handleNext = () => {
    if (!selectedFile) return
    const currentIndex = filteredFiles.findIndex(f => f.filename === selectedFile.filename)
    if (currentIndex < filteredFiles.length - 1) {
      handleSelectFile(filteredFiles[currentIndex + 1])
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading audio files...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="border-b p-4">
        <h1 className="text-2xl font-bold mb-2">Love Notes Audio Player</h1>
        <p className="text-sm text-muted-foreground">
          {selectedYear ? `Year ${selectedYear}` : 'All Years'} • {filteredFiles.length} audio files
          {favorites.size > 0 && ` • ${favorites.size} favorites`}
        </p>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* File List with Tabs */}
        <div className="w-1/3 border-r flex flex-col">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "all" | "favorites")} className="flex-1 flex flex-col">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="all">All ({audioFiles.length})</TabsTrigger>
              <TabsTrigger value="favorites">
                <Star className="h-4 w-4 mr-1" />
                Favorites ({favorites.size})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value={activeTab} className="flex-1 mt-0">
              <ScrollArea className="h-full">
                <div className="p-4 space-y-2">
                  {filteredFiles.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      {activeTab === "favorites" ? "No favorites yet" : "No audio files found"}
                    </p>
                  ) : (
                    filteredFiles.map(file => {
                      const isSelected = selectedFile?.filename === file.filename
                      const isCurrentlyPlaying = isSelected && isPlaying
                      const isFavorite = favorites.has(file.filename)
                      
                      return (
                        <Card
                          key={file.filename}
                          className={`p-3 cursor-pointer transition-all hover:bg-accent ${
                            isSelected ? 'bg-accent border-primary' : ''
                          } ${isCurrentlyPlaying ? 'animate-pulse' : ''}`}
                        >
                          <div className="flex items-center gap-3">
                            <div 
                              className="flex-shrink-0"
                              onClick={() => handleSelectFile(file)}
                            >
                              {isCurrentlyPlaying ? (
                                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground">
                                  <Pause className="h-4 w-4" />
                                </div>
                              ) : isSelected ? (
                                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/20 text-primary">
                                  <Play className="h-4 w-4" />
                                </div>
                              ) : (
                                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted">
                                  <Play className="h-3 w-3 text-muted-foreground" />
                                </div>
                              )}
                            </div>
                            <div 
                              className="flex-1 min-w-0"
                              onClick={() => handleSelectFile(file)}
                            >
                              <p className="text-sm font-medium">
                                Message #{file.messageId}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {file.year} • Click to {isCurrentlyPlaying ? 'pause' : 'play'}
                              </p>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="flex-shrink-0"
                              onClick={(e) => {
                                e.stopPropagation()
                                toggleFavorite(file.filename)
                              }}
                            >
                              <Star 
                                className={`h-4 w-4 ${isFavorite ? 'fill-yellow-500 text-yellow-500' : 'text-muted-foreground'}`}
                              />
                            </Button>
                          </div>
                        </Card>
                      )
                    })
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>

        {/* Player Area */}
        <div className="flex-1 flex flex-col justify-center items-center p-6">
          {selectedFile ? (
            <div className="w-full max-w-md">
              <Card className="p-8">
                <div className="text-center mb-6">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <h2 className="text-2xl font-bold">
                      Message #{selectedFile.messageId}
                    </h2>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => toggleFavorite(selectedFile.filename)}
                    >
                      <Star 
                        className={`h-5 w-5 ${favorites.has(selectedFile.filename) ? 'fill-yellow-500 text-yellow-500' : 'text-muted-foreground'}`}
                      />
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Year {selectedFile.year}
                  </p>
                </div>
                
                <audio
                  ref={audioRef}
                  key={selectedFile.filename} // Force reload when file changes
                  onEnded={() => {
                    setIsPlaying(false)
                    // Auto-play next if available
                    const currentIndex = filteredFiles.findIndex(f => f.filename === selectedFile.filename)
                    if (currentIndex < filteredFiles.length - 1) {
                      setTimeout(() => handleSelectFile(filteredFiles[currentIndex + 1]), 500)
                    }
                  }}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onError={(e) => {
                    console.error('Audio playback error:', e)
                    setIsPlaying(false)
                  }}
                />
                
                {/* Large Play/Pause Button */}
                <div className="flex justify-center mb-6">
                  <Button
                    size="lg"
                    onClick={handlePlayPause}
                    className="w-32 h-32 rounded-full"
                    variant={isPlaying ? "secondary" : "default"}
                  >
                    {isPlaying ? (
                      <Pause className="h-12 w-12" />
                    ) : (
                      <Play className="h-12 w-12 ml-2" />
                    )}
                  </Button>
                </div>
                
                {/* Navigation */}
                <div className="flex items-center justify-between gap-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrevious}
                    disabled={filteredFiles.findIndex(f => f.filename === selectedFile.filename) === 0}
                    className="flex-1"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  
                  <span className="text-sm text-muted-foreground px-4">
                    {filteredFiles.findIndex(f => f.filename === selectedFile.filename) + 1} / {filteredFiles.length}
                  </span>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNext}
                    disabled={filteredFiles.findIndex(f => f.filename === selectedFile.filename) === filteredFiles.length - 1}
                    className="flex-1"
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>

                {/* Message text preview for validation */}
                <div className="mt-6">
                  <h3 className="text-sm font-medium mb-2">Message Text</h3>
                  {loadingMessage ? (
                    <p className="text-sm text-muted-foreground">Loading text…</p>
                  ) : messageText ? (
                    <ScrollArea className="h-40 border rounded-md p-3 bg-muted/20">
                      <p className="text-sm whitespace-pre-wrap">{messageText}</p>
                    </ScrollArea>
                  ) : (
                    <p className="text-sm text-muted-foreground">No text found for this message.</p>
                  )}
                  {messageDate && (
                    <p className="text-xs text-muted-foreground mt-2">Date: {new Date(messageDate).toLocaleString()}</p>
                  )}
                </div>
              </Card>
            </div>
          ) : (
            <Card className="p-8">
              <div className="text-center">
                <div className="w-32 h-32 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                  <Play className="h-12 w-12 text-muted-foreground" />
                </div>
                <p className="text-lg font-medium mb-2">
                  Select an audio file to play
                </p>
                <p className="text-sm text-muted-foreground">
                  {audioFiles.length} love notes available
                </p>
                <p className="text-xs text-muted-foreground mt-4">
                  Click any file on the left to start playing
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}