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
    <div className={`relative inline-block ${className}`}>
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

      {/* Corner Play Button with subtle ring */}
      <button
        aria-label={isPlaying ? 'Pause love note' : 'Play love note'}
        onClick={togglePlay}
        className={`absolute -top-3 -right-3 z-10 flex items-center justify-center w-8 h-8 rounded-full shadow-md transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
          isPlaying ? 'bg-gradient-to-r from-pink-500 to-red-500 text-white' : 'bg-primary text-primary-foreground'
        }`}
      >
        {isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3 ml-0.5" />}
      </button>

      {/* Progress halo */}
      {isPlaying && (
        <span className="absolute -top-3 -right-3 w-8 h-8 rounded-full ring-2 ring-pink-300 animate-pulse" />
      )}
    </div>
  )
} 