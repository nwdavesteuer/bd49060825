"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BarChart3, Calendar, MessageCircle, Heart, Users, Loader2, RefreshCw } from "lucide-react"
import { supabase } from "../lib/supabase"

interface DataStats {
  totalMessages: number
  dateRange: {
    start: string
    end: string
    totalDays: number
    totalYears: number
  }
  messageTypes: {
    text: number
    image: number
    video: number
    audio: number
    reaction: number
    other: number
  }
  senderStats: {
    you: number
    nitzan: number
  }
  yearlyBreakdown: Array<{
    year: number
    count: number
    percentage: number
  }>
  monthlyAverage: number
  dailyAverage: number
  busiestDay: {
    date: string
    count: number
  }
  longestGap: {
    start: string
    end: string
    days: number
  }
}

export default function FullDataStats() {
  const [stats, setStats] = useState<DataStats | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchFullStats = async () => {
    setLoading(true)
    try {
      // Get all messages
      const { data: messages, error } = await supabase
        .from("messages")
        .select("*")
        .order("date_sent", { ascending: true })

      if (error) throw error

      if (!messages || messages.length === 0) {
        setStats(null)
        return
      }

      // Calculate comprehensive stats
      const totalMessages = messages.length
      const startDate = messages[0].date_sent
      const endDate = messages[messages.length - 1].date_sent
      const totalDays = Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24))
      const totalYears = new Date(endDate).getFullYear() - new Date(startDate).getFullYear() + 1

      // Message types
      const messageTypes = {
        text: messages.filter((m) => m.message_type === "text").length,
        image: messages.filter((m) => m.message_type === "image").length,
        video: messages.filter((m) => m.message_type === "video").length,
        audio: messages.filter((m) => m.message_type === "audio").length,
        reaction: messages.filter((m) => m.message_type === "reaction").length,
        other: messages.filter((m) => !["text", "image", "video", "audio", "reaction"].includes(m.message_type)).length,
      }

      // Sender stats
      const senderStats = {
        you: messages.filter((m) => m.sender === "you").length,
        nitzan: messages.filter((m) => m.sender === "nitzan").length,
      }

      // Yearly breakdown
      const yearCounts: { [year: number]: number } = {}
      messages.forEach((m) => {
        const year = m.year
        yearCounts[year] = (yearCounts[year] || 0) + 1
      })

      const yearlyBreakdown = Object.entries(yearCounts)
        .map(([year, count]) => ({
          year: Number.parseInt(year),
          count,
          percentage: (count / totalMessages) * 100,
        }))
        .sort((a, b) => a.year - b.year)

      // Daily message counts for busiest day
      const dailyCounts: { [date: string]: number } = {}
      messages.forEach((m) => {
        const date = m.date_sent.split("T")[0]
        dailyCounts[date] = (dailyCounts[date] || 0) + 1
      })

      const busiestDay = Object.entries(dailyCounts).reduce(
        (max, [date, count]) => (count > max.count ? { date, count } : max),
        { date: "", count: 0 },
      )

      // Calculate averages
      const monthlyAverage = Math.round(totalMessages / (totalDays / 30.44)) // Average days per month
      const dailyAverage = Math.round(totalMessages / totalDays)

      // Find longest gap (simplified - just between consecutive days with messages)
      const messageDates = [...new Set(messages.map((m) => m.date_sent.split("T")[0]))].sort()
      let longestGap = { start: "", end: "", days: 0 }

      for (let i = 1; i < messageDates.length; i++) {
        const gap = Math.ceil(
          (new Date(messageDates[i]).getTime() - new Date(messageDates[i - 1]).getTime()) / (1000 * 60 * 60 * 24),
        )
        if (gap > longestGap.days) {
          longestGap = { start: messageDates[i - 1], end: messageDates[i], days: gap }
        }
      }

      setStats({
        totalMessages,
        dateRange: {
          start: startDate,
          end: endDate,
          totalDays,
          totalYears,
        },
        messageTypes,
        senderStats,
        yearlyBreakdown,
        monthlyAverage,
        dailyAverage,
        busiestDay,
        longestGap,
      })
    } catch (error) {
      console.error("Error fetching full stats:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFullStats()
  }, [])

  if (loading) {
    return (
      <Card className="max-w-6xl mx-auto">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin mr-3" />
          <span>Analyzing your complete conversation history...</span>
        </CardContent>
      </Card>
    )
  }

  if (!stats) {
    return (
      <Card className="max-w-6xl mx-auto">
        <CardContent className="py-12 text-center">
          <p className="text-gray-500">No conversation data found. Please upload your messages first.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-center justify-center">
            <BarChart3 className="w-6 h-6 text-blue-600" />
            Complete Conversation Analysis
            <Heart className="w-6 h-6 text-red-500" />
          </CardTitle>
          <p className="text-center text-gray-600">Your entire love story by the numbers</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-white rounded-lg shadow-sm">
              <div className="text-3xl font-bold text-blue-600">{stats.totalMessages.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Total Messages</div>
            </div>
            <div className="text-center p-4 bg-white rounded-lg shadow-sm">
              <div className="text-3xl font-bold text-green-600">{stats.dateRange.totalYears}</div>
              <div className="text-sm text-gray-600">Years Together</div>
            </div>
            <div className="text-center p-4 bg-white rounded-lg shadow-sm">
              <div className="text-3xl font-bold text-purple-600">{stats.dailyAverage}</div>
              <div className="text-sm text-gray-600">Messages/Day</div>
            </div>
            <div className="text-center p-4 bg-white rounded-lg shadow-sm">
              <div className="text-3xl font-bold text-red-600">{stats.busiestDay.count}</div>
              <div className="text-sm text-gray-600">Busiest Day</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Date Range */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Timeline Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg">
              <div className="text-lg font-bold text-green-700">First Message</div>
              <div className="text-sm text-green-600">
                {new Date(stats.dateRange.start).toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </div>
            </div>
            <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg">
              <div className="text-lg font-bold text-blue-700">Latest Message</div>
              <div className="text-sm text-blue-600">
                {new Date(stats.dateRange.end).toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </div>
            </div>
            <div className="text-center p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg">
              <div className="text-lg font-bold text-purple-700">Total Days</div>
              <div className="text-sm text-purple-600">{stats.dateRange.totalDays.toLocaleString()} days</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Message Types */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Message Types
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Object.entries(stats.messageTypes).map(([type, count]) => (
              <div key={type} className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-700">{count.toLocaleString()}</div>
                <div className="text-sm text-gray-600 capitalize">{type}</div>
                <div className="text-xs text-gray-500">{((count / stats.totalMessages) * 100).toFixed(1)}%</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Sender Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Who Talks More?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6">
            <div className="text-center p-6 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg">
              <div className="text-3xl font-bold text-blue-600">{stats.senderStats.you.toLocaleString()}</div>
              <div className="text-lg font-medium text-blue-700">Your Messages</div>
              <div className="text-sm text-blue-600">
                {((stats.senderStats.you / stats.totalMessages) * 100).toFixed(1)}%
              </div>
            </div>
            <div className="text-center p-6 bg-gradient-to-r from-pink-50 to-pink-100 rounded-lg">
              <div className="text-3xl font-bold text-pink-600">{stats.senderStats.nitzan.toLocaleString()}</div>
              <div className="text-lg font-medium text-pink-700">Nitzan's Messages</div>
              <div className="text-sm text-pink-600">
                {((stats.senderStats.nitzan / stats.totalMessages) * 100).toFixed(1)}%
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Yearly Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Messages by Year</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats.yearlyBreakdown.map((year) => (
              <div key={year.year} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Badge variant="outline">{year.year}</Badge>
                  <span className="font-medium">{year.count.toLocaleString()} messages</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600">{year.percentage.toFixed(1)}%</span>
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${year.percentage}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Fun Facts */}
      <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
        <CardHeader>
          <CardTitle className="text-center">💝 Fun Facts About Your Love Story</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="text-center p-4 bg-white rounded-lg shadow-sm">
              <div className="text-lg font-bold text-orange-600">Busiest Day</div>
              <div className="text-sm text-gray-600">
                {new Date(stats.busiestDay.date).toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </div>
              <div className="text-xs text-gray-500">{stats.busiestDay.count} messages</div>
            </div>
            <div className="text-center p-4 bg-white rounded-lg shadow-sm">
              <div className="text-lg font-bold text-orange-600">Longest Gap</div>
              <div className="text-sm text-gray-600">{stats.longestGap.days} days</div>
              <div className="text-xs text-gray-500">
                {new Date(stats.longestGap.start).toLocaleDateString()} -{" "}
                {new Date(stats.longestGap.end).toLocaleDateString()}
              </div>
            </div>
          </div>

          <div className="mt-6 text-center">
            <Button onClick={fetchFullStats} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Analysis
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
