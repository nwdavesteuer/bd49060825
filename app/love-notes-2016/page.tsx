"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Heart, Play, Pause, Volume2, Calendar, Clock } from "lucide-react"
import { AudioPlayer } from "@/components/audio-player"

interface LoveNote2016 {
  id: string
  text: string
  date: string
  emotion: string
  filename: string
}

export default function LoveNotes2016Page() {
  const [loveNotes, setLoveNotes] = useState<LoveNote2016[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPlayingId, setCurrentPlayingId] = useState<string | null>(null)

  useEffect(() => {
    // Load the 2016 love notes from the CSV data
    fetch('/api/love-notes-2016')
      .then(res => res.json())
      .then(data => {
        setLoveNotes(data.notes || [])
        setLoading(false)
      })
      .catch(err => {
        console.error('Error loading 2016 love notes:', err)
        setLoading(false)
      })
  }, [])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getEmotionColor = (emotion: string) => {
    const colors: Record<string, string> = {
      love: 'bg-red-100 text-red-800',
      gratitude: 'bg-green-100 text-green-800',
      appreciation: 'bg-blue-100 text-blue-800',
      joy: 'bg-yellow-100 text-yellow-800',
      relief: 'bg-purple-100 text-purple-800',
      excitement: 'bg-orange-100 text-orange-800',
      playfulness: 'bg-pink-100 text-pink-800',
      longing: 'bg-indigo-100 text-indigo-800',
      nostalgia: 'bg-teal-100 text-teal-800',
      neutral: 'bg-gray-100 text-gray-800'
    }
    return colors[emotion] || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-red-50 flex items-center justify-center">
        <div className="text-center">
          <Heart className="w-12 h-12 animate-pulse text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-serif text-gray-800">Loading 2016 Love Notes...</h2>
          <p className="text-gray-600 mt-2">Preparing your audio collection</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-red-50">
      <div className="container mx-auto p-6">
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Heart className="w-8 h-8 text-red-500 fill-current" />
            <h1 className="text-4xl font-serif text-gray-800">2016 Love Notes</h1>
            <Heart className="w-8 h-8 text-red-500 fill-current" />
          </div>
          <p className="text-xl text-gray-600 mb-2">
            {loveNotes.length} carefully selected moments from 2016
          </p>
          <p className="text-gray-500">
            Each note has been converted to audio using David's voice
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {loveNotes.map((note) => (
            <Card 
              key={note.id} 
              className="relative overflow-hidden hover:shadow-lg transition-all duration-300 border-pink-200"
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <CardTitle className="text-lg font-serif">
                      {formatDate(note.date)}
                    </CardTitle>
                  </div>
                  <Badge className={getEmotionColor(note.emotion)}>
                    {note.emotion}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="mb-4">
                  <p className="text-gray-700 leading-relaxed font-serif">
                    "{note.text}"
                  </p>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Clock className="w-4 h-4" />
                    <span>Audio: {note.filename}</span>
                  </div>
                  
                  <AudioPlayer
                    audioUrl={`/audio/love-notes-mp3/${note.filename}`}
                    className="w-full"
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {loveNotes.length === 0 && (
          <div className="text-center py-12">
            <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-serif text-gray-600 mb-2">No love notes found</h3>
            <p className="text-gray-500">
              The 2016 love notes haven't been loaded yet. Please check the data source.
            </p>
          </div>
        )}
      </div>
    </div>
  )
} 