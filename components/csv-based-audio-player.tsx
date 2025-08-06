"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Play, Pause, ChevronLeft, ChevronRight, Calendar, User } from "lucide-react"

interface AudioMessage {
  id: string
  text: string
  date: string
  year: number
  audioFile: string
}

export default function CsvBasedAudioPlayer() {
  const [messages, setMessages] = useState<AudioMessage[]>([])
  const [selectedMessage, setSelectedMessage] = useState<AudioMessage | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedYear, setSelectedYear] = useState<number | null>(null)
  const [availableYears, setAvailableYears] = useState<number[]>([])
  const audioRef = useRef<HTMLAudioElement>(null)

  // Load messages from CSV files
  useEffect(() => {
    loadMessagesFromCSV()
  }, [])

  const loadMessagesFromCSV = async () => {
    setIsLoading(true)
    try {
      // Years we have CSV files for
      const years = [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024]
      const allMessages: AudioMessage[] = []
      const yearsWithData: number[] = []

      for (const year of years) {
        try {
          // Try to fetch the CSV file for this year
          const response = await fetch(`/data/${year}-david-love-notes-for-audio.csv`)
          if (!response.ok) continue

          const csvText = await response.text()
          const lines = csvText.split('\n')
          
          // Skip header line
          for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim()
            if (!line) continue

            // Parse CSV line (handling quoted fields)
            const match = line.match(/^"([^"]+)","([^"]+)","([^"]+)","([^"]+)","([^"]+)"$/)
            if (match) {
              const [_, id, text, date, emotion, filename] = match
              
              // Check if the audio file actually exists
              const audioResponse = await fetch(`/audio/love-notes-mp3/${filename}`, { method: 'HEAD' })
              if (audioResponse.ok) {
                allMessages.push({
                  id,
                  text,
                  date,
                  year,
                  audioFile: filename
                })
              }
            }
          }

          if (allMessages.some(m => m.year === year)) {
            yearsWithData.push(year)
          }
        } catch (error) {
          console.log(`No CSV file for year ${year}`)
        }
      }

      console.log(`Loaded ${allMessages.length} messages from CSV files`)
      
      // Sort by date
      allMessages.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      
      setMessages(allMessages)
      setAvailableYears(yearsWithData)
      
      // Set initial year
      if (yearsWithData.length > 0 && !selectedYear) {
        setSelectedYear(yearsWithData[0])
      }
    } catch (error) {
      console.error('Error loading CSV files:', error)
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
          <p className="text-muted-foreground">Loading audio messages from CSV files...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="border-b p-4">
        <h1 className="text-2xl font-bold mb-2">Love Notes Audio Player (CSV Based)</h1>
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
                    key={`${message.year}-${message.id}`}
                    className={`p-3 cursor-pointer transition-colors hover:bg-accent ${
                      selectedMessage?.id === message.id && selectedMessage?.year === message.year ? 'bg-accent' : ''
                    }`}
                    onClick={() => handleSelectMessage(message)}
                  >
                    <div className="flex items-start gap-2">
                      <Play className="h-4 w-4 mt-1 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">
                          {message.year} - Message #{message.id}
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
                      {selectedMessage.year} - Message #{selectedMessage.id}
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