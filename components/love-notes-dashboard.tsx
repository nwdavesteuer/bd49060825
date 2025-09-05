"use client"

import { useState, useEffect } from 'react'
import { Heart, Play, Pause, SkipBack, SkipForward, Settings, Volume2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAudioStore } from '@/lib/audio-state-manager'
import AudioProgressIndicator from './audio-progress-indicator'

interface LoveNotesDashboardProps {
  showLoveNotes: boolean
  onToggleLoveNotes: () => void
  onToggleContext: () => void
  showContext: boolean
}

export default function LoveNotesDashboard({
  showLoveNotes,
  onToggleLoveNotes,
  onToggleContext,
  showContext
}: LoveNotesDashboardProps) {
  const [audioStats, setAudioStats] = useState<Record<number, { expected: number; actual: number }>>({})
  const [isLoading, setIsLoading] = useState(false)
  
  const {
    isPlaying,
    currentAudioFile,
    currentIndex,
    autoPlay,
    audioFiles,
    play,
    pause,
    next,
    previous,
    setAutoPlay,
    reset
  } = useAudioStore()

  // Load audio statistics
  useEffect(() => {
    const loadAudioStats = async () => {
      setIsLoading(true)
      try {
        // This would ideally fetch from an API, but for now we'll use hardcoded data
        const stats = {
          2022: { expected: 78, actual: 79 },
          2023: { expected: 76, actual: 75 },
          2024: { expected: 39, actual: 38 }
        }
        setAudioStats(stats)
      } catch (error) {
        console.error('Error loading audio stats:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (showLoveNotes) {
      loadAudioStats()
    }
  }, [showLoveNotes])

  const handleGenerateMissing = (year: number) => {
    // This would trigger the audio generation script
    console.log(`Generating missing audio for ${year}`)
    // In a real implementation, this would make an API call
  }

  const totalExpected = Object.values(audioStats).reduce((sum, stat) => sum + stat.expected, 0)
  const totalActual = Object.values(audioStats).reduce((sum, stat) => sum + stat.actual, 0)
  const totalProgress = totalExpected > 0 ? (totalActual / totalExpected) * 100 : 0

  return (
    <div className="bg-gray-800 rounded-lg p-4 mb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Heart className="h-5 w-5 text-pink-500" />
          <h3 className="text-lg font-semibold text-white">Love Notes Dashboard</h3>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={onToggleLoveNotes}
            variant={showLoveNotes ? "default" : "outline"}
            className={showLoveNotes ? "bg-gradient-to-r from-pink-500 to-red-500" : ""}
          >
            {showLoveNotes ? "Hide" : "Show"} Love Notes
          </Button>
        </div>
      </div>

      {showLoveNotes && (
        <>
          {/* Overall Progress */}
          <div className="mb-4 p-3 bg-gray-700 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-300">Overall Progress</span>
              <span className="text-sm text-white">
                {totalActual}/{totalExpected} ({Math.round(totalProgress)}%)
              </span>
            </div>
            <div className="w-full bg-gray-600 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-pink-500 to-red-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(totalProgress, 100)}%` }}
              />
            </div>
          </div>

          {/* Year-by-Year Progress */}
          <div className="space-y-2 mb-4">
            {Object.entries(audioStats).map(([year, stats]) => (
              <AudioProgressIndicator
                key={year}
                year={parseInt(year)}
                expectedCount={stats.expected}
                actualCount={stats.actual}
                onGenerateMissing={() => handleGenerateMissing(parseInt(year))}
              />
            ))}
          </div>

          {/* Audio Controls */}
          {audioFiles.length > 0 && (
            <div className="border-t border-gray-700 pt-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-white">Audio Player</h4>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => setAutoPlay(!autoPlay)}
                    variant={autoPlay ? "default" : "outline"}
                    className="text-xs"
                  >
                    {autoPlay ? "Auto-Play On" : "Auto-Play Off"}
                  </Button>
                  <Button
                    size="sm"
                    onClick={reset}
                    variant="outline"
                    className="text-xs"
                  >
                    Reset
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-center gap-4">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={previous}
                  disabled={currentIndex === 0}
                  className="text-gray-400 hover:text-white"
                >
                  <SkipBack className="h-4 w-4" />
                </Button>

                <Button
                  size="lg"
                  onClick={isPlaying ? pause : play}
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
                  onClick={next}
                  disabled={currentIndex === audioFiles.length - 1}
                  className="text-gray-400 hover:text-white"
                >
                  <SkipForward className="h-4 w-4" />
                </Button>
              </div>

              {/* Current Track Info */}
              {currentAudioFile && (
                <div className="mt-3 text-center">
                  <p className="text-sm text-gray-300">
                    {currentIndex + 1} of {audioFiles.length}
                  </p>
                  <p className="text-xs text-gray-400 truncate max-w-xs mx-auto">
                    {currentAudioFile}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Context Toggle */}
          <div className="border-t border-gray-700 pt-4">
            <Button
              size="sm"
              onClick={onToggleContext}
              variant={showContext ? "default" : "outline"}
              className="w-full"
            >
              {showContext ? "Hide" : "Show"} Message Context
            </Button>
          </div>
        </>
      )}
    </div>
  )
} 