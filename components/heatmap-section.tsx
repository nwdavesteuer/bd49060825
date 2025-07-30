"use client"

import { useState, useEffect } from "react"
import { Calendar, TrendingUp, Heart, MessageSquare, Activity } from "lucide-react"
import { supabase, TABLE_NAME } from "@/lib/supabase"

interface DayData {
  date: string
  count: number
  intensity: number
}

interface MonthData {
  month: string
  year: number
  days: DayData[]
  totalMessages: number
}

export default function HeatmapSection() {
  const [heatmapData, setHeatmapData] = useState<MonthData[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedYear, setSelectedYear] = useState(2023)
  const [stats, setStats] = useState({
    totalMessages: 0,
    averagePerDay: 0,
    mostActiveDay: "",
    mostActiveMonth: "",
  })

  const availableYears = [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024]
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ]

  useEffect(() => {
    loadHeatmapData(selectedYear)
  }, [selectedYear])

  const loadHeatmapData = async (year: number) => {
    setLoading(true)
    try {
      const { data, error } = await supabase.from(TABLE_NAME).select("date").eq("year", year).gte("date", "2015-07-24")

      if (error) throw error

      // Process data into daily counts
      const dailyCounts: Record<string, number> = {}
      data?.forEach((row) => {
        const date = new Date(row.date).toISOString().split("T")[0]
        dailyCounts[date] = (dailyCounts[date] || 0) + 1
      })

      // Generate calendar data for the year
      const monthsData: MonthData[] = []
      const maxCount = Math.max(...Object.values(dailyCounts))

      for (let month = 0; month < 12; month++) {
        const daysInMonth = new Date(year, month + 1, 0).getDate()
        const days: DayData[] = []
        let monthTotal = 0

        for (let day = 1; day <= daysInMonth; day++) {
          const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
          const count = dailyCounts[dateStr] || 0
          monthTotal += count

          days.push({
            date: dateStr,
            count,
            intensity: maxCount > 0 ? count / maxCount : 0,
          })
        }

        monthsData.push({
          month: months[month],
          year,
          days,
          totalMessages: monthTotal,
        })
      }

      setHeatmapData(monthsData)

      // Calculate stats
      const totalMessages = Object.values(dailyCounts).reduce((sum, count) => sum + count, 0)
      const activeDays = Object.keys(dailyCounts).length
      const averagePerDay = activeDays > 0 ? totalMessages / activeDays : 0

      // Find most active day and month
      const mostActiveDate = Object.entries(dailyCounts).reduce(
        (max, [date, count]) => (count > max.count ? { date, count } : max),
        { date: "", count: 0 },
      )

      const monthCounts = monthsData.reduce(
        (acc, month) => {
          acc[month.month] = month.totalMessages
          return acc
        },
        {} as Record<string, number>,
      )

      const mostActiveMonth = Object.entries(monthCounts).reduce(
        (max, [month, count]) => (count > max.count ? { month, count } : max),
        { month: "", count: 0 },
      )

      setStats({
        totalMessages,
        averagePerDay: Math.round(averagePerDay),
        mostActiveDay: mostActiveDate.date,
        mostActiveMonth: mostActiveMonth.month,
      })
    } catch (error) {
      console.error("Error loading heatmap data:", error)
    } finally {
      setLoading(false)
    }
  }

  const getIntensityColor = (intensity: number) => {
    if (intensity === 0) return "bg-gray-800"
    if (intensity < 0.2) return "bg-green-900"
    if (intensity < 0.4) return "bg-green-700"
    if (intensity < 0.6) return "bg-green-500"
    if (intensity < 0.8) return "bg-green-400"
    return "bg-green-300"
  }

  const getDayOfWeek = (dateStr: string) => {
    return new Date(dateStr).getDay()
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-semibold text-gray-100 flex items-center gap-2">
              <Activity className="h-5 w-5 text-green-400" />
              Message Heatmap
            </h1>
            <p className="text-xs text-gray-400">Visual patterns of your communication activity</p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="bg-gray-700 border border-gray-600 rounded px-3 py-1 text-sm text-gray-100"
            >
              {availableYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-400 mx-auto mb-4"></div>
              <p className="text-gray-400">Loading heatmap data for {selectedYear}...</p>
            </div>
          </div>
        ) : (
          <div className="max-w-6xl mx-auto">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="h-4 w-4 text-blue-400" />
                  <span className="text-sm text-gray-400">Total Messages</span>
                </div>
                <div className="text-2xl font-bold text-gray-100">{stats.totalMessages.toLocaleString()}</div>
              </div>

              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-green-400" />
                  <span className="text-sm text-gray-400">Daily Average</span>
                </div>
                <div className="text-2xl font-bold text-gray-100">{stats.averagePerDay}</div>
              </div>

              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4 text-purple-400" />
                  <span className="text-sm text-gray-400">Most Active Month</span>
                </div>
                <div className="text-lg font-bold text-gray-100">{stats.mostActiveMonth || "N/A"}</div>
              </div>

              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <div className="flex items-center gap-2 mb-2">
                  <Heart className="h-4 w-4 text-red-400" />
                  <span className="text-sm text-gray-400">Most Active Day</span>
                </div>
                <div className="text-sm font-bold text-gray-100">
                  {stats.mostActiveDay ? new Date(stats.mostActiveDay).toLocaleDateString() : "N/A"}
                </div>
              </div>
            </div>

            {/* Heatmap Calendar */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-100">{selectedYear} Activity Calendar</h2>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <span>Less</span>
                  <div className="flex gap-1">
                    <div className="w-3 h-3 rounded-sm bg-gray-800 border border-gray-600"></div>
                    <div className="w-3 h-3 rounded-sm bg-green-900"></div>
                    <div className="w-3 h-3 rounded-sm bg-green-700"></div>
                    <div className="w-3 h-3 rounded-sm bg-green-500"></div>
                    <div className="w-3 h-3 rounded-sm bg-green-400"></div>
                    <div className="w-3 h-3 rounded-sm bg-green-300"></div>
                  </div>
                  <span>More</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {heatmapData.map((monthData) => (
                  <div key={`${monthData.month}-${monthData.year}`} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-gray-300">{monthData.month}</h3>
                      <span className="text-xs text-gray-500">{monthData.totalMessages} msgs</span>
                    </div>

                    {/* Days of week header */}
                    <div className="grid grid-cols-7 gap-1 text-xs text-gray-500 mb-1">
                      {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (
                        <div key={i} className="text-center">
                          {day}
                        </div>
                      ))}
                    </div>

                    {/* Calendar grid */}
                    <div className="grid grid-cols-7 gap-1">
                      {/* Empty cells for days before month starts */}
                      {Array.from({ length: getDayOfWeek(monthData.days[0]?.date || "") }).map((_, i) => (
                        <div key={`empty-${i}`} className="w-3 h-3"></div>
                      ))}

                      {/* Days of the month */}
                      {monthData.days.map((day) => (
                        <div
                          key={day.date}
                          className={`w-3 h-3 rounded-sm ${getIntensityColor(day.intensity)} border border-gray-700 hover:border-gray-500 transition-colors cursor-pointer`}
                          title={`${day.date}: ${day.count} messages`}
                        ></div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Legend and Info */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-400">
                Each square represents a day. Darker squares indicate more message activity. Hover over squares to see
                exact counts.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
