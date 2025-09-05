"use client"

import { useState, useEffect } from 'react'
import { BarChart3, Play, Clock, Heart, TrendingUp, Calendar } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface AudioAnalyticsProps {
  audioFiles: string[]
  currentPlayTime: number
  totalPlayTime: number
}

interface YearStats {
  year: number
  count: number
  totalDuration: number
  playCount: number
}

export default function AudioAnalytics({
  audioFiles,
  currentPlayTime,
  totalPlayTime
}: AudioAnalyticsProps) {
  const [yearStats, setYearStats] = useState<YearStats[]>([])
  const [totalFiles, setTotalFiles] = useState(0)
  const [totalDuration, setTotalDuration] = useState(0)

  useEffect(() => {
    // Calculate statistics by year
    const stats: Record<number, YearStats> = {}
    
    audioFiles.forEach(filename => {
      const match = filename.match(/david-(\d{4})-love-note-(\d+)\.mp3/)
      if (match) {
        const year = parseInt(match[1])
        if (!stats[year]) {
          stats[year] = {
            year,
            count: 0,
            totalDuration: 0,
            playCount: 0
          }
        }
        stats[year].count++
        // Estimate duration (average 2-3 minutes per love note)
        stats[year].totalDuration += 150 // 2.5 minutes in seconds
      }
    })

    const sortedStats = Object.values(stats).sort((a, b) => a.year - b.year)
    setYearStats(sortedStats)
    setTotalFiles(audioFiles.length)
    setTotalDuration(sortedStats.reduce((sum, stat) => sum + stat.totalDuration, 0))
  }, [audioFiles])

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${hours}h ${minutes}m`
  }

  const getYearColor = (year: number) => {
    const colors = [
      'bg-blue-500',
      'bg-green-500', 
      'bg-yellow-500',
      'bg-red-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-orange-500',
      'bg-teal-500',
      'bg-cyan-500'
    ]
    return colors[year % colors.length]
  }

  return (
    <div className="space-y-4">
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <BarChart3 className="h-5 w-5" />
            Audio Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{totalFiles}</div>
              <div className="text-sm text-gray-400">Total Files</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{formatDuration(totalDuration)}</div>
              <div className="text-sm text-gray-400">Total Duration</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{yearStats.length}</div>
              <div className="text-sm text-gray-400">Years Covered</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{formatDuration(currentPlayTime)}</div>
              <div className="text-sm text-gray-400">Current Session</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Year Breakdown */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Year Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {yearStats.map(stat => (
              <div key={stat.year} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-full ${getYearColor(stat.year)}`}></div>
                  <div>
                    <div className="font-medium text-white">{stat.year}</div>
                    <div className="text-sm text-gray-400">
                      {stat.count} files • {formatDuration(stat.totalDuration)}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-400">
                    {Math.round((stat.count / totalFiles) * 100)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Usage Insights */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Usage Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-gray-700 rounded-lg">
              <Play className="h-5 w-5 text-green-500" />
              <div>
                <div className="font-medium text-white">Most Active Year</div>
                <div className="text-sm text-gray-400">
                  {yearStats.length > 0 ? yearStats.reduce((max, stat) => 
                    stat.count > max.count ? stat : max
                  ).year : 'N/A'}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-gray-700 rounded-lg">
              <Clock className="h-5 w-5 text-blue-500" />
              <div>
                <div className="font-medium text-white">Average Duration</div>
                <div className="text-sm text-gray-400">
                  {totalFiles > 0 ? formatDuration(Math.round(totalDuration / totalFiles)) : 'N/A'} per file
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-gray-700 rounded-lg">
              <Heart className="h-5 w-5 text-pink-500" />
              <div>
                <div className="font-medium text-white">Love Notes Timeline</div>
                <div className="text-sm text-gray-400">
                  {yearStats.length > 0 ? `${yearStats[0].year} - ${yearStats[yearStats.length - 1].year}` : 'N/A'}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-gray-700 rounded-lg">
              <TrendingUp className="h-5 w-5 text-yellow-500" />
              <div>
                <div className="font-medium text-white">Growth Trend</div>
                <div className="text-sm text-gray-400">
                  {yearStats.length >= 2 ? 
                    yearStats[yearStats.length - 1].count > yearStats[yearStats.length - 2].count ? 
                      'Increasing' : 'Decreasing' : 'Stable'}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 