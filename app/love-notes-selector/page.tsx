"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Heart, Play, Pause, Volume2 } from "lucide-react"
import { AudioPlayer } from "@/components/audio-player"
import { humeService } from "@/lib/hume-service"

interface LoveNote {
  message_id: number
  text: string
  readable_date: string
  loveScore: number
  matchedKeywords: string[]
  wordCount: number
  primary_emotion?: string
  emotion_confidence?: number
  secondary_emotions?: string[]
  relationship_impact?: string
  audio_file?: string
  has_audio?: boolean
}

export default function LoveNotesSelector() {
  const [candidates, setCandidates] = useState<LoveNote[]>([])
  const [selectedNotes, setSelectedNotes] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(true)
  const [audioCache, setAudioCache] = useState<Record<string, string>>({})

  useEffect(() => {
    // Load the candidates from the JSON file
    fetch('/api/love-notes-candidates')
      .then(res => res.json())
      .then(data => {
        setCandidates(data.topNotes || [])
        setLoading(false)
      })
      .catch(err => {
        console.error('Error loading candidates:', err)
        setLoading(false)
      })
  }, [])

  const toggleSelection = (messageId: number) => {
    const newSelected = new Set(selectedNotes)
    if (newSelected.has(messageId)) {
      newSelected.delete(messageId)
    } else {
      newSelected.add(messageId)
    }
    setSelectedNotes(newSelected)
  }

  const generateAudio = async (text: string): Promise<string> => {
    // Check cache first
    if (audioCache[text]) {
      return audioCache[text]
    }

    try {
      const response = await fetch('/api/generate-audio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          voice_id: 'pNInz6obpgDQGcFmaJgB', // Default voice
          speed: 1.0,
          stability: 0.5,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate audio')
      }

      const data = await response.json()
      const audioBlob = humeService.createAudioBlob(data.audio)
      
      // Cache the audio URL
      setAudioCache(prev => ({ ...prev, [text]: audioBlob }))
      
      return audioBlob
    } catch (error) {
      console.error('Error generating audio:', error)
      throw error
    }
  }

  const saveSelection = () => {
    const selectedNotesData = candidates.filter(note => selectedNotes.has(note.message_id))
    console.log('Selected notes:', selectedNotesData)
    
    // Save to localStorage for now, later we can save to database
    localStorage.setItem('selectedLoveNotes', JSON.stringify(selectedNotesData))
    alert(`Saved ${selectedNotesData.length} love notes!`)
  }

  if (loading) {
    return <div className="p-8">Loading love notes candidates...</div>
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">💕 Love Notes Selector</h1>
        <p className="text-muted-foreground">
          Review and select the love notes you want to include in the collection.
          Selected: {selectedNotes.size} / {candidates.length}
        </p>
      </div>

      <div className="mb-6">
        <Button onClick={saveSelection} className="mb-4">
          Save Selection ({selectedNotes.size} notes)
        </Button>
      </div>

      <div className="grid gap-4">
        {candidates.map((note) => (
          <Card key={note.message_id ? `note-${note.message_id}` : `note-index-${candidates.indexOf(note)}`} className={`relative ${selectedNotes.has(note.message_id) ? 'ring-2 ring-pink-500' : ''}`}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={selectedNotes.has(note.message_id)}
                    onCheckedChange={() => toggleSelection(note.message_id)}
                  />
                  <CardTitle className="text-lg">
                    {new Date(note.readable_date).toLocaleDateString()}
                  </CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-pink-100 text-pink-800">
                    Score: {note.loveScore}
                  </Badge>
                  <Badge variant="outline">
                    {note.wordCount} words
                  </Badge>
                  {note.primary_emotion && (
                    <Badge variant="outline" className="bg-blue-100">
                      {note.primary_emotion}
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="mb-3">
                <div className="flex flex-wrap gap-1 mb-2">
                  {note.matchedKeywords.map((keyword, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {keyword}
                    </Badge>
                  ))}
                </div>
                
                <p className="text-sm text-muted-foreground mb-3">
                  {note.text.length > 200 
                    ? `${note.text.substring(0, 200)}...` 
                    : note.text
                  }
                </p>
                
                {note.secondary_emotions && note.secondary_emotions.length > 0 && (
                  <div className="text-xs text-muted-foreground">
                    Emotions: {note.secondary_emotions.join(', ')}
                  </div>
                )}
                
                {note.has_audio && note.audio_file && (
                  <div className="mt-4">
                    <AudioPlayer
                      audioUrl={note.audio_file}
                      className="w-full"
                    />
                  </div>
                )}
                {!note.has_audio && (
                  <div className="mt-4 p-3 bg-muted rounded-md">
                    <p className="text-sm text-muted-foreground">
                      🎵 Audio not yet generated. Use Hume web interface to create audio files.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
} 