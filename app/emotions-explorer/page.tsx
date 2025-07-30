'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createClient } from '@supabase/supabase-js'
import { Brain, Heart, Search, Filter, TrendingUp, Calendar, User } from 'lucide-react'

// Supabase configuration
const supabaseUrl = 'https://fblwndzprmvjajayxjln.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZibHduZHpwcm12amFqYXl4amxuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk0MjEwODAsImV4cCI6MjA2NDk5NzA4MH0.kUJ2La2IkvcX86_bnBbgI17VvqLvoKEhiTgqQrxF6zY'
const supabase = createClient(supabaseUrl, supabaseKey)

interface Message {
  id: number
  text: string
  readable_date: string
  sender: string
  is_from_me: number
  primary_emotion?: string
  emotion_confidence?: number
  secondary_emotions?: string[]
  emotion_intensity?: number
  emotion_context?: string
  emotion_triggers?: string[]
  relationship_impact?: string
}

export default function EmotionsExplorer() {
  const [messages, setMessages] = useState<Message[]>([])
  const [filteredMessages, setFilteredMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedEmotion, setSelectedEmotion] = useState<string>('all')
  const [selectedIntensity, setSelectedIntensity] = useState<string>('all')
  const [stats, setStats] = useState({
    total: 0,
    withEmotions: 0,
    topEmotions: [] as { emotion: string; count: number }[],
    averageConfidence: 0
  })

  useEffect(() => {
    fetchEmotionData()
  }, [])

  useEffect(() => {
    filterMessages()
  }, [messages, searchTerm, selectedEmotion, selectedIntensity])

  const fetchEmotionData = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log('🔍 Fetching messages with emotion data...')
      
      const { data, error } = await supabase
        .from('fulldata_set')
        .select('*')
        .order('readable_date', { ascending: false })
        .limit(1000) // Start with a reasonable limit

      if (error) {
        console.error('❌ Error fetching data:', error)
        setError(`Database error: ${error.message}`)
        return
      }

      if (!data) {
        setError('No data returned from database')
        return
      }

      console.log(`✅ Fetched ${data.length} messages`)
      console.log('📊 Sample message with emotions:', data.find(m => m.primary_emotion))

      setMessages(data)
      calculateStats(data)
      
    } catch (err) {
      console.error('❌ Unexpected error:', err)
      setError(`Unexpected error: ${err}`)
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (data: Message[]) => {
    const withEmotions = data.filter(m => m.primary_emotion).length
    const emotionCounts: { [key: string]: number } = {}
    let totalConfidence = 0
    let confidenceCount = 0

    data.forEach(message => {
      if (message.primary_emotion) {
        emotionCounts[message.primary_emotion] = (emotionCounts[message.primary_emotion] || 0) + 1
      }
      if (message.emotion_confidence) {
        totalConfidence += message.emotion_confidence
        confidenceCount++
      }
    })

    const topEmotions = Object.entries(emotionCounts)
      .map(([emotion, count]) => ({ emotion, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    setStats({
      total: data.length,
      withEmotions,
      topEmotions,
      averageConfidence: confidenceCount > 0 ? totalConfidence / confidenceCount : 0
    })
  }

  const filterMessages = () => {
    let filtered = messages

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(message => 
        message.text?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        message.primary_emotion?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filter by emotion
    if (selectedEmotion !== 'all') {
      filtered = filtered.filter(message => message.primary_emotion === selectedEmotion)
    }

    // Filter by intensity
    if (selectedIntensity !== 'all') {
      const intensity = parseInt(selectedIntensity)
      filtered = filtered.filter(message => message.emotion_intensity === intensity)
    }

    setFilteredMessages(filtered)
  }

  const getEmotionColor = (emotion: string) => {
    const colors: { [key: string]: string } = {
      'love': 'bg-red-100 text-red-800',
      'joy': 'bg-yellow-100 text-yellow-800',
      'sadness': 'bg-blue-100 text-blue-800',
      'anger': 'bg-red-100 text-red-800',
      'fear': 'bg-purple-100 text-purple-800',
      'surprise': 'bg-orange-100 text-orange-800',
      'disgust': 'bg-green-100 text-green-800',
      'neutral': 'bg-gray-100 text-gray-800'
    }
    return colors[emotion?.toLowerCase()] || 'bg-gray-100 text-gray-800'
  }

  const getIntensityColor = (intensity: number) => {
    if (intensity >= 4) return 'bg-red-500'
    if (intensity >= 3) return 'bg-orange-500'
    if (intensity >= 2) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">
            <Brain className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-pulse" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Loading Emotions Explorer...</h2>
            <p className="text-gray-600">Fetching and analyzing emotion data</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
        <div className="max-w-6xl mx-auto">
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-800 flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Error Loading Emotions Data
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-red-700 mb-4">{error}</p>
              <Button onClick={fetchEmotionData} variant="outline">
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4 flex items-center justify-center gap-3">
              <Brain className="h-10 w-10 text-blue-600" />
              Emotions Explorer
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Explore and analyze the emotional patterns in your conversations. 
              Test and debug emotion tagging functionality.
            </p>
          </div>

          {/* Stats Overview */}
          <div className="grid md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                  <div className="text-sm text-gray-600">Total Messages</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{stats.withEmotions}</div>
                  <div className="text-sm text-gray-600">With Emotions</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {((stats.withEmotions / stats.total) * 100).toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600">Emotion Coverage</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {(stats.averageConfidence * 100).toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600">Avg Confidence</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Emotions */}
          {stats.topEmotions.length > 0 && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  Top Emotions Detected
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {stats.topEmotions.map(({ emotion, count }) => (
                    <Badge key={emotion} className={getEmotionColor(emotion)}>
                      {emotion} ({count})
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Filters */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-blue-600" />
                Filters & Search
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Search Messages</label>
                  <Input
                    placeholder="Search text or emotions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Primary Emotion</label>
                  <Select value={selectedEmotion} onValueChange={setSelectedEmotion}>
                    <SelectTrigger>
                      <SelectValue placeholder="All emotions" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All emotions</SelectItem>
                      {stats.topEmotions.map(({ emotion }) => (
                        <SelectItem key={emotion} value={emotion}>
                          {emotion}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Intensity</label>
                  <Select value={selectedIntensity} onValueChange={setSelectedIntensity}>
                    <SelectTrigger>
                      <SelectValue placeholder="All intensities" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All intensities</SelectItem>
                      <SelectItem value="1">Low (1)</SelectItem>
                      <SelectItem value="2">Medium-Low (2)</SelectItem>
                      <SelectItem value="3">Medium (3)</SelectItem>
                      <SelectItem value="4">Medium-High (4)</SelectItem>
                      <SelectItem value="5">High (5)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button 
                    onClick={fetchEmotionData} 
                    variant="outline" 
                    className="w-full"
                  >
                    Refresh Data
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Messages List */}
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">All Messages ({filteredMessages.length})</TabsTrigger>
              <TabsTrigger value="with-emotions">With Emotions ({filteredMessages.filter(m => m.primary_emotion).length})</TabsTrigger>
              <TabsTrigger value="without-emotions">Without Emotions ({filteredMessages.filter(m => !m.primary_emotion).length})</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-6">
              <MessagesList messages={filteredMessages} />
            </TabsContent>
            <TabsContent value="with-emotions" className="mt-6">
              <MessagesList messages={filteredMessages.filter(m => m.primary_emotion)} />
            </TabsContent>
            <TabsContent value="without-emotions" className="mt-6">
              <MessagesList messages={filteredMessages.filter(m => !m.primary_emotion)} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}

function MessagesList({ messages }: { messages: Message[] }) {
  if (messages.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-gray-500">
            <Search className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No messages found matching your filters.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {messages.map((message) => (
        <Card key={message.id} className="hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">
                    {message.is_from_me ? 'You' : message.sender || 'Unknown'}
                  </span>
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">{message.readable_date}</span>
                </div>
                
                <p className="text-gray-900 mb-3">{message.text}</p>
                
                {message.primary_emotion && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    <Badge className={getEmotionColor(message.primary_emotion)}>
                      {message.primary_emotion}
                    </Badge>
                    {message.emotion_confidence && (
                      <Badge variant="outline">
                        {(message.emotion_confidence * 100).toFixed(1)}% confidence
                      </Badge>
                    )}
                    {message.emotion_intensity && (
                      <Badge variant="outline">
                        Intensity: {message.emotion_intensity}/5
                      </Badge>
                    )}
                  </div>
                )}
                
                {message.secondary_emotions && message.secondary_emotions.length > 0 && (
                  <div className="mb-2">
                    <span className="text-sm text-gray-600">Secondary: </span>
                    {message.secondary_emotions.map((emotion, index) => (
                      <Badge key={index} variant="secondary" className="mr-1">
                        {emotion}
                      </Badge>
                    ))}
                  </div>
                )}
                
                {message.emotion_context && (
                  <div className="text-sm text-gray-600 mb-1">
                    Context: {message.emotion_context}
                  </div>
                )}
                
                {message.relationship_impact && (
                  <div className="text-sm text-gray-600">
                    Impact: {message.relationship_impact}
                  </div>
                )}
              </div>
              
              {!message.primary_emotion && (
                <Badge variant="outline" className="text-gray-400">
                  No emotion data
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function getEmotionColor(emotion: string) {
  const colors: { [key: string]: string } = {
    'love': 'bg-red-100 text-red-800',
    'joy': 'bg-yellow-100 text-yellow-800',
    'sadness': 'bg-blue-100 text-blue-800',
    'anger': 'bg-red-100 text-red-800',
    'fear': 'bg-purple-100 text-purple-800',
    'surprise': 'bg-orange-100 text-orange-800',
    'disgust': 'bg-green-100 text-green-800',
    'neutral': 'bg-gray-100 text-gray-800'
  }
  return colors[emotion?.toLowerCase()] || 'bg-gray-100 text-gray-800'
} 