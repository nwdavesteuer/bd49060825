"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Play, Pause, ChevronLeft, ChevronRight, Calendar, User } from "lucide-react"
import { supabase } from "@/lib/supabase"


interface AudioMessage {
  id: number
  text: string
  date: string
  year: number
  audioFile: string
  exists?: boolean
}

export default function SimpleLoveNotesPlayer() {
  const [messages, setMessages] = useState<AudioMessage[]>([])
  const [selectedMessage, setSelectedMessage] = useState<AudioMessage | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedYear, setSelectedYear] = useState<number | null>(null)
  const [availableYears, setAvailableYears] = useState<number[]>([])
  const audioRef = useRef<HTMLAudioElement>(null)

  // Load available audio files
  useEffect(() => {
    loadAudioMessages()
  }, [])

  const loadAudioMessages = async () => {
    setIsLoading(true)
    try {
      // Get list of audio files from the public directory
      const response = await fetch('/api/audio-files')
      const files: string[] = await response.json()
      
      console.log(`Found ${files.length} audio files in directory`)
      
      // Parse filenames to extract message IDs and years
      const audioMap = new Map<number, { year: number, filename: string }>()
      const yearsSet = new Set<number>()
      
      files.forEach(filename => {
        const match = filename.match(/david-(\d{4})-love-note-(\d+)\.mp3/)
        if (match) {
          const year = parseInt(match[1])
          const messageId = parseInt(match[2])
          audioMap.set(messageId, { year, filename })
          yearsSet.add(year)
        }
      })
      
      setAvailableYears(Array.from(yearsSet).sort())
      
      // Get message IDs that actually have audio files
      const messageIds = Array.from(audioMap.keys())
      
      if (messageIds.length === 0) {
        console.log('No audio files found')
        setMessages([])
        setIsLoading(false)
        return
      }
      
      console.log(`Fetching ${messageIds.length} messages from database`)
      
      // Fetch ONLY messages that have audio files
      const { data, error } = await supabase
        .from('fulldata_set')
        .select('message_id, text, readable_date, is_from_me')
        .in('message_id', messageIds)
        .order('readable_date', { ascending: true })
      
      if (error) {
        console.error('Error fetching messages:', error)
        setMessages([])
        setIsLoading(false)
        return
      }
      
      console.log(`Database returned ${data?.length || 0} messages`)
      
      // Map ONLY messages that we found in the database AND have audio files
      const audioMessages: AudioMessage[] = []
      
      if (data) {
        data.forEach(msg => {
          if (audioMap.has(msg.message_id)) {
            const audioInfo = audioMap.get(msg.message_id)!
            audioMessages.push({
              id: msg.message_id,
              text: msg.text || '',
              date: msg.readable_date,
              year: audioInfo.year,
              audioFile: audioInfo.filename,
              exists: true
            })
          }
        })
      }
      
      console.log(`Created ${audioMessages.length} audio messages (messages with both DB entry and audio file)`)
      setMessages(audioMessages)
      
      // Set initial year if not set
      if (!selectedYear && availableYears.length > 0) {
        setSelectedYear(availableYears[0])
      }
    } catch (error) {
      console.error('Error loading audio messages:', error)
      setMessages([])
    } finally {
      setIsLoading(false)
    }
  }

  // Filter messages by selected year
  const filteredMessages = selectedYear 
    ? messages.filter(msg => msg.year === selectedYear)
    : messages

  const handlePlayPause = () => {
    if (!audioRef.current) return
    
    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
    }
    setIsPlaying(!isPlaying)
  }

  const handleSelectMessage = (message: AudioMessage) => {
    setSelectedMessage(message)
    setIsPlaying(false)
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.load()
    }
  }

  const handlePrevious = () => {
    if (!selectedMessage) return
    const currentIndex = filteredMessages.findIndex(m => m.id === selectedMessage.id)
    if (currentIndex > 0) {
      handleSelectMessage(filteredMessages[currentIndex - 1])
    }
  }

  const handleNext = () => {
    if (!selectedMessage) return
    const currentIndex = filteredMessages.findIndex(m => m.id === selectedMessage.id)
    if (currentIndex < filteredMessages.length - 1) {
      handleSelectMessage(filteredMessages[currentIndex + 1])
    }
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })
    } catch {
      return dateString
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading audio messages...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="border-b p-4">
        <h1 className="text-2xl font-bold mb-2">Love Notes Audio Player</h1>
        <div className="flex gap-2 flex-wrap">
          {availableYears.map(year => (
            <Button
              key={year}
              variant={selectedYear === year ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedYear(year)}
            >
              {year}
            </Button>
          ))}
          <Button
            variant={selectedYear === null ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedYear(null)}
          >
            All Years
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Message List */}
        <div className="w-1/3 border-r">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-2">
              {filteredMessages.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No audio messages found
                </p>
              ) : (
                filteredMessages.map(message => (
                  <Card
                    key={message.id}
                    className={`p-3 cursor-pointer transition-colors hover:bg-accent ${
                      selectedMessage?.id === message.id ? 'bg-accent' : ''
                    }`}
                    onClick={() => handleSelectMessage(message)}
                  >
                    <div className="flex items-start gap-2">
                      <Play className="h-4 w-4 mt-1 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          Message #{message.id}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(message.date)}
                        </p>
                        <p className="text-sm mt-1 line-clamp-2">
                          {message.text}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Player Area */}
        <div className="flex-1 flex flex-col">
          {selectedMessage ? (
            <>
              {/* Message Display */}
              <ScrollArea className="flex-1 p-6">
                <div className="max-w-3xl mx-auto">
                  <div className="mb-4">
                    <h2 className="text-xl font-semibold mb-2">
                      Message #{selectedMessage.id}
                    </h2>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {formatDate(selectedMessage.date)}
                      </div>
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        David
                      </div>
                    </div>
                  </div>
                  
                  <Card className="p-6">
                    <p className="whitespace-pre-wrap text-base leading-relaxed">
                      {selectedMessage.text}
                    </p>
                  </Card>
                </div>
              </ScrollArea>

              {/* Audio Controls */}
              <div className="border-t p-4">
                <div className="max-w-3xl mx-auto">
                  <audio
                    ref={audioRef}
                    src={`/audio/love-notes-mp3/${selectedMessage.audioFile}`}
                    onEnded={() => setIsPlaying(false)}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                  />
                  
                  <div className="flex items-center justify-center gap-4">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handlePrevious}
                      disabled={filteredMessages.findIndex(m => m.id === selectedMessage.id) === 0}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      size="lg"
                      onClick={handlePlayPause}
                      className="w-20"
                    >
                      {isPlaying ? (
                        <Pause className="h-5 w-5" />
                      ) : (
                        <Play className="h-5 w-5" />
                      )}
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleNext}
                      disabled={filteredMessages.findIndex(m => m.id === selectedMessage.id) === filteredMessages.length - 1}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="text-center mt-2 text-sm text-muted-foreground">
                    {filteredMessages.findIndex(m => m.id === selectedMessage.id) + 1} of {filteredMessages.length}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Play className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg text-muted-foreground">
                  Select a message to play
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}