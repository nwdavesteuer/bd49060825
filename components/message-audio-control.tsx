"use client"

import { useState, useRef } from 'react'
import { Play, Pause } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface MessageAudioControlProps {
  audioFile: string
  isPlaying: boolean
  onPlay: () => void
  onPause: () => void
  onEnded: () => void
}

export default function MessageAudioControl({
  audioFile,
  isPlaying,
  onPlay,
  onPause,
  onEnded
}: MessageAudioControlProps) {
  const audioRef = useRef<HTMLAudioElement>(null)

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
        onPause()
      } else {
        audioRef.current.play()
        onPlay()
      }
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        onClick={togglePlay}
        className="bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 rounded-full w-8 h-8 p-0"
      >
        {isPlaying ? (
          <Pause className="h-3 w-3" />
        ) : (
          <Play className="h-3 w-3 ml-0.5" />
        )}
      </Button>
      
      {/* Hidden Audio Element */}
      <audio
        ref={audioRef}
        src={`/audio/love-notes-mp3/${audioFile}`}
        onEnded={onEnded}
      />
    </div>
  )
} 