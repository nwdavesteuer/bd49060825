"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Cloud, Heart, TrendingUp, Loader2, Play, Pause } from "lucide-react"
import { supabase } from "../lib/supabase"

interface WordData {
  word: string
  count: number
  size: number
  color: string
}

interface YearData {
  year: number
  words: WordData[]
  totalMessages: number
  topWords: string[]
}

export default function WordCloudEvolution() {
  const [yearData, setYearData] = useState<YearData[]>([])
  const [currentYearIndex, setCurrentYearIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [isPlaying, setIsPlaying] = useState(false)
  const [playSpeed, setPlaySpeed] = useState([1000])

  const fetchWordData = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("fulldata_set")
        .select("text, readable_date")
        .not("text", "is", null)
        .order("readable_date", { ascending: true })

      if (error) throw error

      // Process messages by year
      const yearGroups: { [year: number]: string[] } = {}

      data?.forEach((message) => {
        const year = new Date(message.readable_date).getFullYear()
        if (!yearGroups[year]) {
          yearGroups[year] = []
        }
        if (message.text) {
          yearGroups[year].push(message.text.toLowerCase())
        }
      })

      // Common words to filter out
      const stopWords = new Set([
        "the",
        "a",
        "an",
        "and",
        "or",
        "but",
        "in",
        "on",
        "at",
        "to",
        "for",
        "of",
        "with",
        "by",
        "i",
        "you",
        "he",
        "she",
        "it",
        "we",
        "they",
        "me",
        "him",
        "her",
        "us",
        "them",
        "is",
        "am",
        "are",
        "was",
        "were",
        "be",
        "been",
        "being",
        "have",
        "has",
        "had",
        "do",
        "does",
        "did",
        "will",
        "would",
        "could",
        "should",
        "may",
        "might",
        "must",
        "this",
        "that",
        "these",
        "those",
        "my",
        "your",
        "his",
        "her",
        "its",
        "our",
        "their",
        "what",
        "when",
        "where",
        "why",
        "how",
        "who",
        "which",
        "can",
        "cant",
        "dont",
        "wont",
        "im",
        "youre",
        "hes",
        "shes",
        "were",
        "theyre",
        "ive",
        "youve",
        "weve",
        "theyve",
      ])

      const colors = [
        "text-red-500",
        "text-pink-500",
        "text-purple-500",
        "text-blue-500",
        "text-green-500",
        "text-yellow-500",
        "text-orange-500",
        "text-indigo-500",
      ]

      const processedYears: YearData[] = Object.entries(yearGroups).map(([year, messages]) => {
        // Count word frequencies
        const wordCounts: { [word: string]: number } = {}

        messages.forEach((message) => {
          const words = message.match(/\b\w+\b/g) || []
          words.forEach((word) => {
            if (word.length > 2 && !stopWords.has(word)) {
              wordCounts[word] = (wordCounts[word] || 0) + 1
            }
          })
        })

        // Get top 50 words
        const sortedWords = Object.entries(wordCounts)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 50)

        const maxCount = sortedWords[0]?.[1] || 1

        const words: WordData[] = sortedWords.map(([word, count], index) => ({
          word,
          count,
          size: Math.max(12, Math.min(48, (count / maxCount) * 40 + 12)),
          color: colors[index % colors.length],
        }))

        return {
          year: Number.parseInt(year),
          words,
          totalMessages: messages.length,
          topWords: sortedWords.slice(0, 10).map(([word]) => word),
        }
      })

      setYearData(processedYears.sort((a, b) => a.year - b.year))
    } catch (error) {
      console.error("Error fetching word data:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWordData()
  }, [])

  // Auto-play functionality
  useEffect(() => {
    if (!isPlaying || yearData.length === 0) return

    const interval = setInterval(() => {
      setCurrentYearIndex((prev) => (prev + 1) % yearData.length)
    }, playSpeed[0])

    return () => clearInterval(interval)
  }, [isPlaying, yearData.length, playSpeed])

  const currentYear = yearData[currentYearIndex]

  if (loading) {
    return (
      <Card className="max-w-6xl mx-auto">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin mr-3" />
          <span>Analyzing your word evolution...</span>
        </CardContent>
      </Card>
    )
  }

  if (!currentYear) {
    return (
      <Card className="max-w-6xl mx-auto">
        <CardContent className="py-12 text-center">
          <p className="text-gray-500">No word data available</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-center justify-center">
            <Cloud className="w-6 h-6 text-purple-600" />
            Word Cloud Evolution
            <Heart className="w-6 h-6 text-red-500" />
          </CardTitle>
          <p className="text-center text-gray-600">Watch how your language of love evolved over time</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-white rounded-lg shadow-sm">
              <div className="text-2xl font-bold text-purple-600">{yearData.length}</div>
              <div className="text-sm text-gray-600">Years Analyzed</div>
            </div>
            <div className="text-center p-3 bg-white rounded-lg shadow-sm">
              <div className="text-2xl font-bold text-blue-600">{currentYear.year}</div>
              <div className="text-sm text-gray-600">Current Year</div>
            </div>
            <div className="text-center p-3 bg-white rounded-lg shadow-sm">
              <div className="text-2xl font-bold text-green-600">{currentYear.totalMessages}</div>
              <div className="text-sm text-gray-600">Messages</div>
            </div>
            <div className="text-center p-3 bg-white rounded-lg shadow-sm">
              <div className="text-2xl font-bold text-red-600">{currentYear.words.length}</div>
              <div className="text-sm text-gray-600">Unique Words</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Controls */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Year Navigation */}
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Year: {currentYear.year}</h3>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setIsPlaying(!isPlaying)}>
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  {isPlaying ? "Pause" : "Play"}
                </Button>
              </div>
            </div>

            {/* Year Slider */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-500">
                <span>{yearData[0]?.year}</span>
                <span>{yearData[yearData.length - 1]?.year}</span>
              </div>
              <Slider
                value={[currentYearIndex]}
                onValueChange={([value]) => setCurrentYearIndex(value)}
                max={yearData.length - 1}
                step={1}
                className="w-full"
              />
            </div>

            {/* Speed Control */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Animation Speed</label>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-500">Slow</span>
                <Slider
                  value={playSpeed}
                  onValueChange={setPlaySpeed}
                  min={500}
                  max={3000}
                  step={250}
                  className="flex-1"
                />
                <span className="text-sm text-gray-500">Fast</span>
              </div>
            </div>

            {/* Year Navigation Badges */}
            <div className="flex flex-wrap gap-2 justify-center">
              {yearData.map((year, index) => (
                <Badge
                  key={year.year}
                  variant={index === currentYearIndex ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => setCurrentYearIndex(index)}
                >
                  {year.year}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Word Cloud */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            {currentYear.year} Word Cloud
          </CardTitle>
          <p className="text-sm text-gray-600">Most frequently used words in your conversations</p>
        </CardHeader>
        <CardContent>
          <div className="min-h-96 bg-gradient-to-br from-gray-50 to-white rounded-lg p-8 flex flex-wrap items-center justify-center gap-2">
            {currentYear.words.map((word, index) => (
              <span
                key={`${word.word}-${index}`}
                className={`font-bold ${word.color} hover:scale-110 transition-transform cursor-pointer`}
                style={{ fontSize: `${word.size}px` }}
                title={`"${word.word}" appeared ${word.count} times`}
              >
                {word.word}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Words List */}
      <Card>
        <CardHeader>
          <CardTitle>Top 10 Words in {currentYear.year}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {currentYear.topWords.map((word, index) => (
              <div key={word} className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-lg font-bold text-purple-600">#{index + 1}</div>
                <div className="text-sm font-medium">{word}</div>
                <div className="text-xs text-gray-500">
                  {currentYear.words.find((w) => w.word === word)?.count} times
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
