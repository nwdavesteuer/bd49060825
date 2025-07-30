"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, RefreshCw, AlertCircle } from "lucide-react"
import { supabase, TABLE_NAME } from "../lib/supabase"

interface WeekData {
  weekKey: string
  year: number
  week: number
  count: number
  intensity: number
  startDate: Date
}

export default function WeeklyVisualHeatmap() {
  const [weekData, setWeekData] = useState<WeekData[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<any>(null)
  const [hoveredWeek, setHoveredWeek] = useState<WeekData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<any>({})

  const fetchWeeklyData = async () => {
    setLoading(true)
    setError(null)
    setDebugInfo({})

    try {
      console.log(`Fetching from table: ${TABLE_NAME}`)

      // First, get a count to verify access
      const { count, error: countError } = await supabase.from(TABLE_NAME).select("*", { count: "exact", head: true })

      if (countError) {
        console.error("Count error:", countError)
        throw new Error(`Count error: ${countError.message}`)
      }

      console.log(`Table has ${count} records`)

      // Fetch ALL records - we need to paginate to get everything
      let allMessages: any[] = []
      let page = 0
      const pageSize = 1000
      let hasMore = true

      while (hasMore) {
        console.log(`Fetching page ${page + 1}...`)
        const { data, error } = await supabase
          .from(TABLE_NAME)
          .select("message_id, date")
          .range(page * pageSize, (page + 1) * pageSize - 1)

        if (error) {
          console.error("Fetch error:", error)
          throw new Error(`Fetch error on page ${page + 1}: ${error.message}`)
        }

        if (data && data.length > 0) {
          allMessages = [...allMessages, ...data]
          page++
          console.log(`Got ${data.length} records, total: ${allMessages.length}`)
        } else {
          hasMore = false
        }

        // Safety check - don't fetch more than 50 pages (50k records)
        if (page >= 50) {
          hasMore = false
          console.log("Reached maximum page limit")
        }
      }

      console.log(`Successfully fetched ${allMessages.length} messages`)

      // Get a sample to show in debug
      const { data: sampleData } = await supabase.from(TABLE_NAME).select("*").limit(5)

      console.log("Sample data:", sampleData)

      // Group messages by week
      const weekCounts: { [key: string]: number } = {}
      let maxCount = 0
      let minDate: Date | null = null
      let maxDate: Date | null = null
      let validDates = 0
      let invalidDates = 0
      const weekDistribution: { [year: number]: { [week: number]: number } } = {}

      allMessages.forEach((message) => {
        // Use the date column which is timestamptz format
        const dateValue = message.date
        let date: Date | null = null

        try {
          // Parse the date - it's in ISO format like "2015-07-24 00:40:12+00"
          date = new Date(dateValue)

          // Check if we got a valid date
          if (!date || isNaN(date.getTime())) {
            invalidDates++
            return
          }

          validDates++

          if (!minDate || date < minDate) minDate = date
          if (!maxDate || date > maxDate) maxDate = date

          // Calculate week
          const year = date.getFullYear()
          const startOfYear = new Date(year, 0, 1)
          const weekNumber = Math.ceil(
            ((date.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7,
          )
          const weekKey = `${year}-${weekNumber.toString().padStart(2, "0")}`

          // Track distribution for debugging
          if (!weekDistribution[year]) weekDistribution[year] = {}
          if (!weekDistribution[year][weekNumber]) weekDistribution[year][weekNumber] = 0
          weekDistribution[year][weekNumber]++

          weekCounts[weekKey] = (weekCounts[weekKey] || 0) + 1
          maxCount = Math.max(maxCount, weekCounts[weekKey])
        } catch (parseError) {
          invalidDates++
          console.warn("Failed to parse date:", dateValue, parseError)
        }
      })

      if (validDates === 0) {
        throw new Error(
          `No valid dates found. Sample date values: ${JSON.stringify(allMessages.slice(0, 3).map((d) => d.date))}`,
        )
      }

      // Generate all weeks from 2012 to 2025 (based on the data in screenshot)
      const allWeeks: WeekData[] = []
      for (let year = 2012; year <= 2025; year++) {
        const weeksInYear = getWeeksInYear(year)
        for (let week = 1; week <= weeksInYear; week++) {
          const weekKey = `${year}-${week.toString().padStart(2, "0")}`
          const count = weekCounts[weekKey] || 0
          const intensity = count === 0 ? 0 : Math.ceil((count / maxCount) * 5)

          const startDate = getDateOfWeek(week, year)

          allWeeks.push({
            weekKey,
            year,
            week,
            count,
            intensity,
            startDate,
          })
        }
      }

      setWeekData(allWeeks)
      setStats({
        totalMessages: allMessages.length,
        validDates,
        invalidDates,
        totalWeeks: allWeeks.length,
        activeWeeks: Object.keys(weekCounts).length,
        maxWeeklyMessages: maxCount,
        dateRange:
          minDate && maxDate
            ? {
                start: minDate.toLocaleDateString(),
                end: maxDate.toLocaleDateString(),
              }
            : null,
      })

      setDebugInfo({
        totalRecords: allMessages.length,
        expectedRecords: count,
        sampleDates: allMessages.slice(0, 3).map((d) => d.date),
        sampleData: sampleData,
        weekDistribution: weekDistribution,
        activeWeekCount: Object.keys(weekCounts).length,
        weekCountSample: Object.entries(weekCounts).slice(0, 10),
      })
    } catch (error: any) {
      console.error("Error fetching weekly data:", error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  // Helper function to get number of weeks in a year
  const getWeeksInYear = (year: number) => {
    const lastDay = new Date(year, 11, 31)
    const lastWeek = Math.ceil(
      ((lastDay.getTime() - new Date(year, 0, 1).getTime()) / 86400000 + new Date(year, 0, 1).getDay() + 1) / 7,
    )
    return lastWeek
  }

  // Helper function to get the start date of a specific week in a year
  const getDateOfWeek = (week: number, year: number) => {
    const startOfYear = new Date(year, 0, 1)
    const daysToAdd = (week - 1) * 7 - startOfYear.getDay()
    const result = new Date(startOfYear)
    result.setDate(startOfYear.getDate() + daysToAdd)
    return result
  }

  const getIntensityColor = (intensity: number) => {
    switch (intensity) {
      case 0:
        return "bg-gray-800 border-gray-700"
      case 1:
        return "bg-green-900 border-green-800"
      case 2:
        return "bg-green-700 border-green-600"
      case 3:
        return "bg-green-500 border-green-400"
      case 4:
        return "bg-green-300 border-green-200"
      case 5:
        return "bg-green-100 border-green-50"
      default:
        return "bg-gray-800 border-gray-700"
    }
  }

  useEffect(() => {
    fetchWeeklyData()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center text-white">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" />
          <p className="text-xl">Loading message heatmap...</p>
          <p className="text-sm text-gray-400 mt-2">Fetching data from Supabase...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Card className="bg-red-900 border-red-700 text-white max-w-2xl">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-6 h-6 text-red-400" />
              <h2 className="text-xl font-bold">Error Loading Data</h2>
            </div>
            <p className="mb-4">{error}</p>

            <div className="mb-4">
              <h3 className="font-semibold mb-2">Debug Information:</h3>
              <div className="bg-black p-3 rounded text-sm font-mono overflow-auto max-h-60">
                <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
              </div>
            </div>

            <div className="mb-4">
              <h3 className="font-semibold mb-2">Troubleshooting:</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Check that the table name "{TABLE_NAME}" is correct</li>
                <li>Verify your Supabase connection settings</li>
                <li>Ensure the table has data and proper permissions</li>
                <li>Check the browser console for more detailed errors</li>
              </ul>
            </div>

            <Button
              onClick={fetchWeeklyData}
              variant="outline"
              className="bg-gray-900 border-gray-700 text-white hover:bg-gray-800"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Message Activity Heatmap</h1>
        <p className="text-gray-400 mb-4">Every week from 2012-2025 • Each square = 1 week</p>

        {stats && (
          <div className="flex justify-center gap-8 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{stats.totalMessages.toLocaleString()}</div>
              <div className="text-gray-400">Total Messages</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">{stats.activeWeeks}</div>
              <div className="text-gray-400">Active Weeks</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">{stats.maxWeeklyMessages}</div>
              <div className="text-gray-400">Peak Week</div>
            </div>
            {stats.invalidDates > 0 && (
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-400">{stats.invalidDates}</div>
                <div className="text-gray-400">Invalid Dates</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Debug Info */}
      <div className="mb-6 p-4 bg-gray-900 rounded border border-gray-700 text-xs text-gray-400">
        <p>
          <strong>Debug:</strong> Found {debugInfo.activeWeekCount || 0} active weeks out of {stats?.totalWeeks || 0}{" "}
          total weeks
        </p>
        <p>
          <strong>Records:</strong> {debugInfo.totalRecords || 0} fetched / {debugInfo.expectedRecords || 0} expected
        </p>
        {debugInfo.weekCountSample && (
          <p>
            <strong>Sample weeks:</strong>{" "}
            {debugInfo.weekCountSample.map(([week, count]: [string, number]) => `${week}: ${count}`).join(", ")}
          </p>
        )}
      </div>

      {/* Legend */}
      <div className="flex justify-center items-center gap-4 mb-8">
        <span className="text-gray-400 text-sm">Less</span>
        <div className="flex gap-1">
          {[0, 1, 2, 3, 4, 5].map((intensity) => (
            <div key={intensity} className={`w-4 h-4 border ${getIntensityColor(intensity)}`} />
          ))}
        </div>
        <span className="text-gray-400 text-sm">More</span>
      </div>

      {/* Heatmap Grid */}
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-52 gap-1 justify-center">
          {weekData.map((week) => (
            <div
              key={week.weekKey}
              className={`w-3 h-3 border cursor-pointer transition-all hover:scale-150 hover:z-10 relative ${getIntensityColor(week.intensity)}`}
              onMouseEnter={() => setHoveredWeek(week)}
              onMouseLeave={() => setHoveredWeek(null)}
              title={`Week ${week.week}, ${week.year}: ${week.count} messages`}
            />
          ))}
        </div>
      </div>

      {/* Year Labels */}
      <div className="max-w-7xl mx-auto mt-4">
        <div className="grid grid-cols-14 gap-4 text-center text-gray-400 text-sm">
          {Array.from({ length: 14 }, (_, i) => 2012 + i).map((year) => (
            <div key={year}>{year}</div>
          ))}
        </div>
      </div>

      {/* Hover Info */}
      {hoveredWeek && (
        <Card className="fixed bottom-6 left-6 bg-gray-900 border-gray-700 text-white">
          <CardContent className="p-4">
            <div className="text-sm">
              <div className="font-bold">
                Week {hoveredWeek.week}, {hoveredWeek.year}
              </div>
              <div className="text-gray-400">{hoveredWeek.startDate.toLocaleDateString()}</div>
              <div className="text-green-400">{hoveredWeek.count} messages</div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Refresh Button */}
      <div className="fixed bottom-6 right-6">
        <Button
          onClick={fetchWeeklyData}
          variant="outline"
          className="bg-gray-900 border-gray-700 text-white hover:bg-gray-800"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Debug Info */}
      <div className="fixed top-6 right-6 text-xs text-gray-500 text-right">
        <div>Table: {TABLE_NAME}</div>
        {stats?.dateRange && (
          <div>
            Data: {stats.dateRange.start} - {stats.dateRange.end}
          </div>
        )}
      </div>
    </div>
  )
}
