"use client"

import { useState, useRef, useEffect, useCallback } from 'react'
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Settings, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { getAvailableAudioFiles, type AudioFileInfo } from '@/lib/audio-file-manager'

interface EnhancedLoveNotesAudioPlayerProps {
  audioFiles: string[]
  currentIndex: number
  onIndexChange: (index: number) => void
  onPlayAll: () => void
  onStop: () => void
  isPlaying: boolean
  autoPlay: boolean
  onAutoPlayToggle: () => void
  showStats?: boolean
}

export default function EnhancedLoveNotesAudioPlayer({
  audioFiles,
  currentIndex,
  onIndexChange,
  onPlayAll,
  onStop,
  isPlaying,
  autoPlay,
  onAutoPlayToggle,
  showStats = true
}: EnhancedLoveNotesAudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [audioStats, setAudioStats] = useState<{ totalFiles: number; filesByYear: Record<number, number> } | null>(null)

  const currentAudioFile = audioFiles[currentIndex]

  // Load audio stats
  useEffect(() => {
    const loadStats = async () => {
      try {
        const files = await getAvailableAudioFiles()
        const filesByYear: Record<number, number> = {}
        files.forEach(file => {
          filesByYear[file.year] = (filesByYear[file.year] || 0) + 1
        })
        setAudioStats({
          totalFiles: files.length,
          filesByYear
        })
      } catch (error) {
        console.error('Error loading audio stats:', error)
      }
    }
    
    if (showStats) {
      loadStats()
    }
  }, [showStats])

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.addEventListener('timeupdate', handleTimeUpdate)
      audioRef.current.addEventListener('loadedmetadata', handleLoadedMetadata)
      audioRef.current.addEventListener('ended', handleEnded)
      audioRef.current.addEventListener('error', handleError)
      
      return () => {
        if (audioRef.current) {
          audioRef.current.removeEventListener('timeupdate', handleTimeUpdate)
          audioRef.current.removeEventListener('loadedmetadata', handleLoadedMetadata)
          audioRef.current.removeEventListener('ended', handleEnded)
          audioRef.current.removeEventListener('error', handleError)
        }
      }
    }
  }, [])

  const handleTimeUpdate = useCallback(() => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime)
    }
  }, [])

  const handleLoadedMetadata = useCallback(() => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration)
    }
  }, [])

  const handleEnded = useCallback(() => {
    if (autoPlay && currentIndex < audioFiles.length - 1) {
      onIndexChange(currentIndex + 1)
    } else {
      onStop()
    }
  }, [autoPlay, currentIndex, audioFiles.length, onIndexChange, onStop])

  const handleError = useCallback((e: Event) => {
    console.error('Audio error:', e)
    // Try to skip to next file on error
    if (currentIndex < audioFiles.length - 1) {
      onIndexChange(currentIndex + 1)
    }
  }, [currentIndex, audioFiles.length, onIndexChange])

  const togglePlay = useCallback(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play().catch(error => {
          console.error('Error playing audio:', error)
        })
      }
    }
  }, [isPlaying])

  const skipToNext = useCallback(() => {
    if (currentIndex < audioFiles.length - 1) {
      onIndexChange(currentIndex + 1)
    }
  }, [currentIndex, audioFiles.length, onIndexChange])

  const skipToPrevious = useCallback(() => {
    if (currentIndex > 0) {
      onIndexChange(currentIndex - 1)
    }
  }, [currentIndex, onIndexChange])

  const handleVolumeChange = useCallback((value: number[]) => {
    const newVolume = value[0]
    setVolume(newVolume)
    if (audioRef.current) {
      audioRef.current.volume = newVolume
    }
  }, [])

  const toggleMute = useCallback(() => {
    if (audioRef.current) {
      if (isMuted) {
        audioRef.current.volume = volume
        setIsMuted(false)
      } else {
        audioRef.current.volume = 0
        setIsMuted(true)
      }
    }
  }, [isMuted, volume])

  const handlePlaybackRateChange = useCallback((value: number[]) => {
    const newRate = value[0]
    setPlaybackRate(newRate)
    if (audioRef.current) {
      audioRef.current.playbackRate = newRate
    }
  }, [])

  const resetAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0
      setCurrentTime(0)
    }
  }, [])

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div className="bg-gray-800 rounded-lg p-4 mb-4">
      {/* Header with Stats */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-lg font-semibold text-white">🎵 Love Notes Audio</h3>
          {showStats && audioStats && (
            <p className="text-xs text-gray-400">
              {audioStats.totalFiles} files available • 
              {Object.entries(audioStats.filesByYear).map(([year, count]) => (
                <span key={year} className="ml-2">{year}: {count}</span>
              ))}
            </p>
          )}
        </div>
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
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowSettings(!showSettings)}
            className="text-gray-400 hover:text-white"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="bg-gray-700 rounded-lg p-3 mb-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-300 mb-2 block">Volume</label>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={toggleMute}
                  className="text-gray-400 hover:text-white"
                >
                  {isMuted ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
                </Button>
                <Slider
                  value={[isMuted ? 0 : volume]}
                  onValueChange={handleVolumeChange}
                  max={1}
                  step={0.1}
                  className="flex-1"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-300 mb-2 block">Playback Speed</label>
              <Slider
                value={[playbackRate]}
                onValueChange={handlePlaybackRateChange}
                min={0.5}
                max={2}
                step={0.25}
                className="flex-1"
              />
              <span className="text-xs text-gray-400">{playbackRate}x</span>
            </div>
          </div>
        </div>
      )}

      {/* Progress Bar */}
      <div className="mb-3">
        <div className="flex justify-between text-xs text-gray-400 mb-1">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2 relative">
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

        <Button
          size="sm"
          variant="outline"
          onClick={resetAudio}
          className="text-gray-400 hover:text-white"
          title="Reset to beginning"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>

      {/* Current Track Info */}
      <div className="mt-3 text-center">
        <p className="text-sm text-gray-300">
          {currentIndex + 1} of {audioFiles.length}
        </p>
        <p className="text-xs text-gray-400 truncate max-w-xs mx-auto">
          {currentAudioFile}
        </p>
      </div>

      {/* Hidden Audio Element */}
      <audio
        ref={audioRef}
        src={`${process.env.NEXT_PUBLIC_AUDIO_BASE_URL ? process.env.NEXT_PUBLIC_AUDIO_BASE_URL.replace(/\/$/, '') + '/' : '/audio/love-notes-mp3/'}${currentAudioFile}`}
        onPlay={() => {/* Handle play state */}}
        onPause={() => {/* Handle pause state */}}
        preload="metadata"
      />
    </div>
  )
} 