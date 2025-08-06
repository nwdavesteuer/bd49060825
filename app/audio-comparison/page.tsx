"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Heart, Play, Pause, Volume2, Calendar, Clock, ArrowRight } from "lucide-react"
import { AudioPlayer } from "@/components/audio-player"

interface LoveNote {
  id: string
  text: string
  date: string
  emotion: string
  filename: string
}

export default function AudioComparisonPage() {
  const [notes2015, setNotes2015] = useState<LoveNote[]>([])
  const [notes2016, setNotes2016] = useState<LoveNote[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Load both datasets
    Promise.all([
      fetch('/api/love-notes-2015').then(res => res.json()),
      fetch('/api/love-notes-2016').then(res => res.json())
    ])
    .then(([data2015, data2016]) => {
      setNotes2015(data2015.notes || [])
      setNotes2016(data2016.notes || [])
      setLoading(false)
    })
    .catch(err => {
      console.error('Error loading comparison data:', err)
      setLoading(false)
    })
  }, [])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
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
      neutral: 'bg-gray-100 text-gray-800',
      sweet: 'bg-pink-100 text-pink-800',
      support: 'bg-blue-100 text-blue-800',
      anxiety: 'bg-yellow-100 text-yellow-800',
      confusion: 'bg-gray-100 text-gray-800',
      intimacy: 'bg-purple-100 text-purple-800',
      sadness: 'bg-gray-100 text-gray-800',
      sexiness: 'bg-red-100 text-red-800'
    }
    return colors[emotion] || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <Heart className="w-12 h-12 animate-pulse text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-serif text-gray-800">Loading Audio Comparison...</h2>
          <p className="text-gray-600 mt-2">Preparing 2015 vs 2016 comparison</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="container mx-auto p-6">
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Heart className="w-8 h-8 text-red-500 fill-current" />
            <h1 className="text-4xl font-serif text-gray-800">Audio Quality Comparison</h1>
            <Heart className="w-8 h-8 text-red-500 fill-current" />
          </div>
          <p className="text-xl text-gray-600 mb-2">
            Compare 2015 vs 2016 Love Notes - Voice Quality & Text Completeness
          </p>
          <p className="text-gray-500">
            Listen to both versions to evaluate voice quality and text completeness
          </p>
        </div>

        <div className="grid gap-8">
          {notes2015.slice(0, 5).map((note2015, index) => {
            const note2016 = notes2016[index] || null
            
            return (
              <Card key={`comparison-${index}`} className="border-2 border-gray-200">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-serif">Comparison #{index + 1}</h3>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-blue-100 text-blue-800">2015</Badge>
                      <ArrowRight className="w-4 h-4 text-gray-500" />
                      <Badge className="bg-pink-100 text-pink-800">2016</Badge>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* 2015 Note */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <span className="font-medium">2015: {formatDate(note2015.date)}</span>
                        <Badge className={getEmotionColor(note2015.emotion)}>
                          {note2015.emotion}
                        </Badge>
                      </div>
                      
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <p className="text-gray-700 leading-relaxed font-serif text-sm">
                          "{note2015.text}"
                        </p>
                        <div className="mt-2 text-xs text-gray-500">
                          Length: {note2015.text.length} characters
                        </div>
                      </div>
                      
                      <AudioPlayer
                        audioUrl={`/audio/love-notes/${note2015.filename}`}
                        className="w-full"
                      />
                    </div>

                    {/* 2016 Note */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <span className="font-medium">2016: {note2016 ? formatDate(note2016.date) : 'N/A'}</span>
                        {note2016 && (
                          <Badge className={getEmotionColor(note2016.emotion)}>
                            {note2016.emotion}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="bg-pink-50 p-4 rounded-lg">
                        {note2016 ? (
                          <>
                            <p className="text-gray-700 leading-relaxed font-serif text-sm">
                              "{note2016.text}"
                            </p>
                            <div className="mt-2 text-xs text-gray-500">
                              Length: {note2016.text.length} characters
                            </div>
                          </>
                        ) : (
                          <p className="text-gray-500 italic">No corresponding 2016 note</p>
                        )}
                      </div>
                      
                      {note2016 && (
                        <AudioPlayer
                          audioUrl={`/audio/love-notes/${note2016.filename}`}
                          className="w-full"
                        />
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="mt-8 p-6 bg-white rounded-lg shadow-sm">
          <h3 className="text-lg font-serif mb-4">Quality Assessment</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2">2015 Notes - Strengths:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Longer, more detailed messages</li>
                <li>• More emotional depth and context</li>
                <li>• Complete thoughts and stories</li>
                <li>• Better voice quality (original voice model)</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">2016 Notes - Issues:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Truncated text (cut off mid-sentence)</li>
                <li>• Shorter, less emotional content</li>
                <li>• Different voice model quality</li>
                <li>• Missing context and completeness</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 