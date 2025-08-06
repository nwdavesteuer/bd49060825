"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { AudioPlayer } from '@/components/audio-player'
import { humeService } from '@/lib/hume-service'

export default function TestAudioPage() {
  const [text, setText] = useState('I love you so much. You mean everything to me.')
  const [audioUrl, setAudioUrl] = useState<string>('')
  const [isGenerating, setIsGenerating] = useState(false)

  const generateAudio = async (inputText: string): Promise<string> => {
    setIsGenerating(true)
    try {
      const response = await fetch('/api/generate-audio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: inputText,
          voice_id: 'pNInz6obpgDQGcFmaJgB',
          speed: 1.0,
          stability: 0.5,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate audio')
      }

      const data = await response.json()
      const audioBlob = humeService.createAudioBlob(data.audio)
      setAudioUrl(audioBlob)
      setIsGenerating(false)
      return audioBlob
    } catch (error) {
      console.error('Error generating audio:', error)
      setIsGenerating(false)
      throw error
    }
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">🎵 Audio Generation Test</h1>
        <p className="text-muted-foreground">
          Test the Hume AI audio generation for love notes
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Text Input</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter text to convert to audio..."
              className="min-h-[100px]"
            />
            <Button 
              onClick={() => generateAudio(text)}
              disabled={isGenerating}
              className="mt-4"
            >
              {isGenerating ? 'Generating...' : 'Generate Audio'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Audio Player</CardTitle>
          </CardHeader>
          <CardContent>
            <AudioPlayer
              text={text}
              onGenerateAudio={generateAudio}
              audioUrl={audioUrl}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 