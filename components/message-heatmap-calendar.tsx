"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Heart, MessageCircle, Loader2, RefreshCw } from "lucide-react"
import { supabase } from "../lib/supabase"

interface DayData {
  date: string
  count: number
  intensity: number
}

interface MonthData {
  year: number
  month: number
  monthName: string
  days: DayData[]
  total: number
}

export default function MessageHeatmapCalendar() {
  const [heatmapData, setHeatmapData] = useState<MonthData[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedYear, setSelectedYear] = useState<number | null>(null)
  const [stats, setStats] = useState<any>(null)

  const fetchHeatmapData = async () => {
    setLoading(true)
    try {
      // Fetch daily message counts
      const { data, error } = await supabase
        .from("messages")
        .select("date_sent, sender")
        .order("date_sent", { ascending: true })

      if (error) throw error

      // Process data into daily counts
      const dailyCounts: { [key: string]: number } = {}
      let maxCount = 0

      data?.forEach((message) => {
        const date = new Date(message.date_sent).toISOString().split("T")[0]
        dailyCounts[date] = (dailyCounts[date] || 0) + 1
        maxCount = Math.max(maxCount, dailyCounts[date])
      })

      // Group by months
      const monthsMap: { [key: string]: MonthData } = {}

      Object.entries(dailyCounts).forEach(([dateStr, count]) => {
        const date = new Date(dateStr)
        const year = date.getFullYear()
        const month = date.getMonth()
        const monthKey = `${year}-${month}`

        if (!monthsMap[monthKey]) {
          monthsMap[monthKey] = {
            year,
            month,
            monthName: date.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
            days: [],
            total: 0,
          }
        }

        monthsMap[monthKey].days.push({
          date: dateStr,
          count,
          intensity: Math.ceil((count / maxCount) * 4), // Scale 1-4
        })
        monthsMap[monthKey].total += count
      })

      // Sort months chronologically
      const sortedMonths = Object.values(monthsMap).sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year
        return a.month - b.month
      })

      setHeatmapData(sortedMonths)

      // Calculate stats
      const totalMessages = data?.length || 0
      const totalDays = Object.keys(dailyCounts).length
      const avgPerDay = totalMessages / totalDays
      const mostActiveDay = Object.entries(dailyCounts).reduce(
        (max, [date, count]) => (count > max.count ? { date, count } : max),
        { date: "", count: 0 },
      )

      setStats({
        totalMessages,
        totalDays,
        avgPerDay: Math.round(avgPerDay),
        mostActiveDay,
        years: [...new Set(sortedMonths.map((m) => m.year))].sort(),
      })
    } catch (error) {
      console.error("Error fetching heatmap data:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHeatmapData()
  }, [])

  const getIntensityColor = (intensity: number) => {
    switch (intensity) {
      case 1:
        return "bg-green-100 border-green-200"
      case 2:
        return "bg-green-200 border-green-300"
      case 3:
        return "bg-green-400 border-green-500"
      case 4:
        return "bg-green-600 border-green-700"
      default:
        return "bg-gray-50 border-gray-200"
    }
  }

  const filteredData = selectedYear ? heatmapData.filter((month) => month.year === selectedYear) : heatmapData

  if (loading) {
    return (
      <Card className="max-w-6xl mx-auto">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin mr-3" />
          <span>Creating your message heatmap...</span>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-center justify-center">
            <Calendar className="w-6 h-6 text-green-600" />
            Message Activity Heatmap
            <Heart className="w-6 h-6 text-red-500" />
          </CardTitle>
          <p className="text-center text-gray-600">See when your love burned brightest</p>
        </CardHeader>
        {stats && (
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                <div className="text-2xl font-bold text-blue-600">{stats.totalMessages.toLocaleString()}</div>
                <div className="text-sm text-gray-600">Total Messages</div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                <div className="text-2xl font-bold text-green-600">{stats.totalDays}</div>
                <div className="text-sm text-gray-600">Active Days</div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                <div className="text-2xl font-bold text-purple-600">{stats.avgPerDay}</div>
                <div className="text-sm text-gray-600">Avg/Day</div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                <div className="text-2xl font-bold text-red-600">{stats.mostActiveDay.count}</div>
                <div className="text-sm text-gray-600">Best Day</div>
              </div>
            </div>

            {/* Year Filter */}
            <div className="flex flex-wrap justify-center gap-2">
              <Badge
                variant={selectedYear === null ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setSelectedYear(null)}
              >
                All Years
              </Badge>
              {stats.years.map((year: number) => (
                <Badge
                  key={year}
                  variant={selectedYear === year ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => setSelectedYear(year)}
                >
                  {year}
                </Badge>
              ))}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Heatmap */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Daily Message Activity
          </CardTitle>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span>Less</span>
            <div className="flex gap-1">
              <div className="w-3 h-3 bg-gray-50 border border-gray-200 rounded-sm"></div>
              <div className="w-3 h-3 bg-green-100 border border-green-200 rounded-sm"></div>
              <div className="w-3 h-3 bg-green-200 border border-green-300 rounded-sm"></div>
              <div className="w-3 h-3 bg-green-400 border border-green-500 rounded-sm"></div>
              <div className="w-3 h-3 bg-green-600 border border-green-700 rounded-sm"></div>
            </div>
            <span>More</span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            {filteredData.map((month) => (
              <div key={`${month.year}-${month.month}`} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg">{month.monthName}</h3>
                  <Badge variant="outline">{month.total} messages</Badge>
                </div>

                <div className="grid grid-cols-7 gap-1">
                  {/* Generate calendar grid for the month */}
                  {(() => {
                    const firstDay = new Date(month.year, month.month, 1)
                    const lastDay = new Date(month.year, month.month + 1, 0)
                    const startDate = new Date(firstDay)
                    startDate.setDate(startDate.getDate() - firstDay.getDay()) // Start from Sunday

                    const days = []
                    const currentDate = new Date(startDate)

                    // Generate 6 weeks (42 days) to cover the month
                    for (let i = 0; i < 42; i++) {
                      const dateStr = currentDate.toISOString().split("T")[0]
                      const dayData = month.days.find((d) => d.date === dateStr)
                      const isCurrentMonth = currentDate.getMonth() === month.month

                      days.push(
                        <div
                          key={dateStr}
                          className={`
                            w-4 h-4 rounded-sm border text-xs flex items-center justify-center
                            ${
                              isCurrentMonth
                                ? dayData
                                  ? getIntensityColor(dayData.intensity)
                                  : "bg-gray-50 border-gray-200"
                                : "bg-transparent border-transparent"
                            }
                          `}
                          title={isCurrentMonth && dayData ? `${currentDate.getDate()}: ${dayData.count} messages` : ""}
                        ></div>,
                      )

                      currentDate.setDate(currentDate.getDate() + 1)
                    }

                    return days
                  })()}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="p-6">
          <div className="text-center">
            <h3 className="text-xl font-bold text-blue-800 mb-2">💝 Your Love Story in Color</h3>
            <p className="text-blue-700 mb-4">
              Each square represents a day. The darker the green, the more you talked that day!
            </p>
            <Button onClick={fetchHeatmapData} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Heatmap
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
