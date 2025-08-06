import { NextRequest, NextResponse } from 'next/server'
import { humeService } from '@/lib/hume-service'

export async function POST(request: NextRequest) {
  try {
    const { text, voice, voice_id, speed, stability } = await request.json()

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 })
    }

    // Map voice names to voice IDs
    const voiceMap: Record<string, string> = {
      'David': 'pNInz6obpgDQGcFmaJgB', // Original David voice
      'David5': 'pNInz6obpgDQGcFmaJgB', // New David5 voice - replace with actual ID
      'default': 'pNInz6obpgDQGcFmaJgB'
    }

    const selectedVoiceId = voice ? voiceMap[voice] || voice_id : voice_id

    const audioResponse = await humeService.generateAudio({
      text,
      voice_id: selectedVoiceId,
      speed,
      stability,
    })

    return NextResponse.json({
      success: true,
      audio: audioResponse.audio,
      duration: audioResponse.duration,
      model_id: audioResponse.model_id,
      voice_id: audioResponse.voice_id,
      filename: `${Date.now()}-${Math.random().toString(36).substring(7)}.wav`
    })
  } catch (error) {
    console.error('Error generating audio:', error)
    return NextResponse.json(
      { error: 'Failed to generate audio' },
      { status: 500 }
    )
  }
} 