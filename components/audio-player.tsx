"use client"

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Play, Pause, Volume2, VolumeX, Loader2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

interface AudioPlayerProps {
  audioUrl?: string
  onGenerateAudio?: (text: string) => Promise<string>
  text?: string
  className?: string
}

export function AudioPlayer({ audioUrl, onGenerateAudio, text, className }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [currentAudioUrl, setCurrentAudioUrl] = useState<string | undefined>(audioUrl)
  
  const audioRef = useRef<HTMLAudioElement>(null)
  const previousVolume = useRef(1)

  useEffect(() => {
    if (audioUrl && audioUrl !== currentAudioUrl) {
      setCurrentAudioUrl(audioUrl)
    }
  }, [audioUrl, currentAudioUrl])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const updateTime = () => setCurrentTime(audio.currentTime)
    const updateDuration = () => setDuration(audio.duration)
    const handleEnded = () => setIsPlaying(false)

    audio.addEventListener('timeupdate', updateTime)
    audio.addEventListener('loadedmetadata', updateDuration)
    audio.addEventListener('ended', handleEnded)

    return () => {
      audio.removeEventListener('timeupdate', updateTime)
      audio.removeEventListener('loadedmetadata', updateDuration)
      audio.removeEventListener('ended', handleEnded)
    }
  }, [])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    audio.volume = isMuted ? 0 : volume
  }, [volume, isMuted])

  const togglePlay = async () => {
    if (!currentAudioUrl && text && onGenerateAudio) {
      setIsLoading(true)
      try {
        const newAudioUrl = await onGenerateAudio(text)
        setCurrentAudioUrl(newAudioUrl)
        setIsLoading(false)
        playAudio()
      } catch (error) {
        console.error('Failed to generate audio:', error)
        setIsLoading(false)
      }
      return
    }

    if (isPlaying) {
      pauseAudio()
    } else {
      playAudio()
    }
  }

  const playAudio = () => {
    const audio = audioRef.current
    if (audio) {
      audio.play()
      setIsPlaying(true)
    }
  }

  const pauseAudio = () => {
    const audio = audioRef.current
    if (audio) {
      audio.pause()
      setIsPlaying(false)
    }
  }

  const toggleMute = () => {
    if (isMuted) {
      setIsMuted(false)
      setVolume(previousVolume.current)
    } else {
      previousVolume.current = volume
      setIsMuted(true)
    }
  }

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0]
    setVolume(newVolume)
    setIsMuted(newVolume === 0)
  }

  const handleSeek = (value: number[]) => {
    const audio = audioRef.current
    if (audio) {
      audio.currentTime = value[0]
    }
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <Button
            onClick={togglePlay}
            disabled={isLoading}
            size="sm"
            variant="outline"
            className="w-10 h-10 p-0"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </Button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs text-muted-foreground">
                {formatTime(currentTime)}
              </span>
              <Slider
                value={[currentTime]}
                max={duration || 100}
                step={0.1}
                onValueChange={handleSeek}
                className="flex-1"
              />
              <span className="text-xs text-muted-foreground">
                {formatTime(duration)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={toggleMute}
              size="sm"
              variant="ghost"
              className="w-8 h-8 p-0"
            >
              {isMuted ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </Button>
            <Slider
              value={[isMuted ? 0 : volume]}
              max={1}
              step={0.1}
              onValueChange={handleVolumeChange}
              className="w-20"
            />
          </div>
        </div>

        {currentAudioUrl && (
          <audio
            ref={audioRef}
            src={currentAudioUrl}
            preload="metadata"
            className="hidden"
          />
        )}
      </CardContent>
    </Card>
  )
} 