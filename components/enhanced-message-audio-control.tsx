"use client"

import { useState, useRef, useEffect } from 'react'
import { Play, Pause } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAudioStore } from '@/lib/audio-state-manager'

interface EnhancedMessageAudioControlProps {
  audioFile: string
  messageId: string
  year: number
  className?: string
}

export default function EnhancedMessageAudioControl({
  audioFile,
  messageId,
  year,
  className = ""
}: EnhancedMessageAudioControlProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [hasAudio, setHasAudio] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Check if audio file exists
  useEffect(() => {
    const checkAudioExists = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(`/audio/love-notes-mp3/${audioFile}`, { 
          method: 'HEAD'
        })
        setHasAudio(response.ok)
      } catch (error) {
        console.error('Error checking audio file:', error)
        setHasAudio(false)
      } finally {
        setIsLoading(false)
      }
    }
    checkAudioExists()
  }, [audioFile])

  const togglePlay = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!audioRef.current || !hasAudio) return
    
    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      audioRef.current.play().catch(error => {
        console.error('Error playing audio:', error)
      })
      setIsPlaying(true)
    }
  }

  // Don't render if no audio file or still loading
  if (isLoading || !hasAudio) {
    return null
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Play/Pause Button */}
      <Button
        size="sm"
        onClick={togglePlay}
        className={`rounded-full w-6 h-6 p-0 transition-all duration-200 ${
          isPlaying 
            ? "bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600" 
            : "bg-gray-600 hover:bg-gray-500"
        }`}
      >
        {isPlaying ? (
          <Pause className="h-2 w-2" />
        ) : (
          <Play className="h-2 w-2 ml-0.5" />
        )}
      </Button>

      {/* Hidden Audio Element */}
      <audio
        ref={audioRef}
        src={`/audio/love-notes-mp3/${audioFile}`}
        preload="none"
        onEnded={() => setIsPlaying(false)}
        onError={() => {
          console.error('Audio error for file:', audioFile)
          setIsPlaying(false)
        }}
      />
    </div>
  )
} 