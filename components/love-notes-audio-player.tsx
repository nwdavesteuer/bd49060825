"use client"

import { useState, useRef, useEffect } from 'react'
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface LoveNotesAudioPlayerProps {
  audioFiles: string[]
  currentIndex: number
  onIndexChange: (index: number) => void
  onPlayAll: () => void
  onStop: () => void
  isPlaying: boolean
  autoPlay: boolean
  onAutoPlayToggle: () => void
}

export default function LoveNotesAudioPlayer({
  audioFiles,
  currentIndex,
  onIndexChange,
  onPlayAll,
  onStop,
  isPlaying,
  autoPlay,
  onAutoPlayToggle
}: LoveNotesAudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  const currentAudioFile = audioFiles[currentIndex]

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.addEventListener('timeupdate', handleTimeUpdate)
      audioRef.current.addEventListener('loadedmetadata', handleLoadedMetadata)
      audioRef.current.addEventListener('ended', handleEnded)
      
      return () => {
        if (audioRef.current) {
          audioRef.current.removeEventListener('timeupdate', handleTimeUpdate)
          audioRef.current.removeEventListener('loadedmetadata', handleLoadedMetadata)
          audioRef.current.removeEventListener('ended', handleEnded)
        }
      }
    }
  }, [])

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime)
    }
  }

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration)
    }
  }

  const handleEnded = () => {
    if (autoPlay && currentIndex < audioFiles.length - 1) {
      onIndexChange(currentIndex + 1)
    } else {
      onStop()
    }
  }

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play()
      }
    }
  }

  const skipToNext = () => {
    if (currentIndex < audioFiles.length - 1) {
      onIndexChange(currentIndex + 1)
    }
  }

  const skipToPrevious = () => {
    if (currentIndex > 0) {
      onIndexChange(currentIndex - 1)
    }
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div className="bg-gray-800 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-white">🎵 Love Notes Audio</h3>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={onAutoPlayToggle}
            variant={autoPlay ? "default" : "outline"}
            className="text-xs"
          >
            {autoPlay ? "Auto-Play On" : "Auto-Play Off"}
          </Button>
          <Button
            size="sm"
            onClick={onPlayAll}
            className="bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600"
          >
            Play All
          </Button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-3">
        <div className="flex justify-between text-xs text-gray-400 mb-1">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-pink-500 to-red-500 h-2 rounded-full transition-all duration-200"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Audio Controls */}
      <div className="flex items-center justify-center gap-4">
        <Button
          size="sm"
          variant="outline"
          onClick={skipToPrevious}
          disabled={currentIndex === 0}
          className="text-gray-400 hover:text-white"
        >
          <SkipBack className="h-4 w-4" />
        </Button>

        <Button
          size="lg"
          onClick={togglePlay}
          className="bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 rounded-full w-12 h-12"
        >
          {isPlaying ? (
            <Pause className="h-6 w-6" />
          ) : (
            <Play className="h-6 w-6 ml-1" />
          )}
        </Button>

        <Button
          size="sm"
          variant="outline"
          onClick={skipToNext}
          disabled={currentIndex === audioFiles.length - 1}
          className="text-gray-400 hover:text-white"
        >
          <SkipForward className="h-4 w-4" />
        </Button>
      </div>

      {/* Current Track Info */}
      <div className="mt-3 text-center">
        <p className="text-sm text-gray-300">
          {currentIndex + 1} of {audioFiles.length}
        </p>
        <p className="text-xs text-gray-400 truncate">
          {currentAudioFile}
        </p>
      </div>

      {/* Hidden Audio Element */}
      <audio
        ref={audioRef}
        src={`/audio/love-notes-mp3/${currentAudioFile}`}
        onPlay={() => {/* Handle play state */}}
        onPause={() => {/* Handle pause state */}}
      />
    </div>
  )
} 