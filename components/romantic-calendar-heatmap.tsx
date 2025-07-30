"use client"

import { useState, useEffect, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { format, parseISO, endOfMonth, eachDayOfInterval } from "date-fns"
import { supabase, TABLE_NAME } from "@/lib/supabase"
import { Loader2, Heart, MessageSquare, ChevronLeft, ChevronRight, ImageIcon, Smile } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

// Diagnostic component to debug data processing
const DataDiagnostic = ({ messageData, rawSample }: { messageData: any; rawSample: any[] }) => {
  const [showDiagnostic, setShowDiagnostic] = useState(false)

  if (!showDiagnostic) {
    return (
      <div className="fixed top-4 right-4 z-50">
        <Button
          onClick={() => setShowDiagnostic(true)}
          variant="outline"
          size="sm"
          className="bg-red-100 text-red-700 border-red-300"
        >
          Debug Data
        </Button>
      </div>
    )
  }

  const totalProcessedDays = Object.keys(messageData).length
  const totalMessages = Object.values(messageData).reduce((sum: number, day: any) => sum + day.count, 0)
  const sampleDates = Object.keys(messageData).slice(0, 10)

  return (
    <div className="fixed inset-4 bg-white border-2 border-red-300 rounded-lg p-4 z-50 overflow-auto">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-red-700">Data Diagnostic</h3>
        <Button onClick={() => setShowDiagnostic(false)} variant="outline" size="sm">
          Close
        </Button>
      </div>

      <div className="space-y-4 text-sm">
        <div>
          <strong>Raw Sample Messages (first 5):</strong>
          <pre className="bg-gray-100 p-2 rounded mt-1 text-xs overflow-auto">
            {JSON.stringify(rawSample.slice(0, 5), null, 2)}
          </pre>
        </div>

        <div>
          <strong>Processing Results:</strong>
          <ul className="list-disc list-inside mt-1">
            <li>Total processed days: {totalProcessedDays}</li>
            <li>Total messages counted: {totalMessages}</li>
            <li>Raw messages received: {rawSample.length}</li>
          </ul>
        </div>

        <div>
          <strong>Sample processed dates:</strong>
          <ul className="list-disc list-inside mt-1">
            {sampleDates.map((date) => (
              <li key={date}>
                {date}: {messageData[date]?.count || 0} messages
              </li>
            ))}
          </ul>
        </div>

        <div>
          <strong>Date Format Analysis:</strong>
          {rawSample.slice(0, 3).map((msg, i) => (
            <div key={i} className="bg-gray-100 p-2 rounded mt-1">
              <div>Raw date: {msg.date}</div>
              <div>Parsed: {new Date(msg.date).toString()}</div>
              <div>Is valid: {!isNaN(new Date(msg.date).getTime()) ? "Yes" : "No"}</div>
              <div>Formatted key: {format(new Date(msg.date), "yyyy-MM-dd")}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

interface MessageData {
  date: string
  count: number
  loveCount: number
  photoCount: number
  happyCount: number
  previewMessage?: string
  sender?: string
}

interface DayData {
  date: Date
  count: number
  intensity: number
  loveCount: number
  photoCount: number
  happyCount: number
  hasLoveMessage: boolean
  previewMessage?: string
  sender?: string
}

const YEARS = Array.from({ length: 11 }, (_, i) => 2015 + i)
const MONTHS = [
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
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

export default function RomanticCalendarHeatmap() {
  const [selectedYear, setSelectedYear] = useState(2023)
  const [messageData, setMessageData] = useState<Record<string, MessageData>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hoveredDay, setHoveredDay] = useState<DayData | null>(null)
  const [selectedDay, setSelectedDay] = useState<DayData | null>(null)
  const [yearStats, setYearStats] = useState<Record<number, any>>({})
  const [dayMessages, setDayMessages] = useState<any[]>([])
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [rawSampleData, setRawSampleData] = useState<any[]>([])

  // Fetch message data for all years
  useEffect(() => {
    const fetchMessageData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Get all messages with their dates
        const { data, error } = await supabase
          .from(TABLE_NAME)
          .select("date, text, sender, is_from_me")
          .order("date", { ascending: true })

        if (error) throw error

        console.log("Raw data sample:", data?.slice(0, 5))
        setRawSampleData(data?.slice(0, 20) || [])

        // Process the data by date
        const messagesByDate: Record<string, MessageData> = {}
        const yearStatistics: Record<number, any> = {}

        // Add detailed logging for date processing
        let processedCount = 0
        let skippedCount = 0
        let invalidDateCount = 0

        // Initialize year statistics
        YEARS.forEach((year) => {
          yearStatistics[year] = {
            totalMessages: 0,
            activeDays: 0,
            mostActiveDay: { date: null, count: 0 },
            loveMessages: 0,
            photoMessages: 0,
            happyMessages: 0,
          }
        })

        // Process each message
        data?.forEach((message, index) => {
          try {
            // More robust date parsing
            let date: Date

            // Try different date parsing approaches
            if (typeof message.date === "string") {
              // Handle different date formats
              if (message.date.includes("T")) {
                // ISO format
                date = new Date(message.date)
              } else if (message.date.includes("/")) {
                // MM/DD/YYYY or similar
                date = new Date(message.date)
              } else if (message.date.includes("-")) {
                // YYYY-MM-DD or similar
                date = new Date(message.date)
              } else {
                // Try parsing as timestamp
                const timestamp = Number.parseInt(message.date)
                if (!isNaN(timestamp)) {
                  date = new Date(timestamp * 1000) // Convert from seconds to milliseconds if needed
                } else {
                  date = new Date(message.date)
                }
              }
            } else if (typeof message.date === "number") {
              // Handle timestamp
              date = new Date(message.date * 1000) // Assume seconds, convert to milliseconds
            } else {
              date = new Date(message.date)
            }

            if (isNaN(date.getTime())) {
              invalidDateCount++
              if (index < 10) {
                console.error(`Invalid date at index ${index}:`, message.date)
              }
              return
            }

            const year = date.getFullYear()
            if (year < 2015 || year > 2025) {
              skippedCount++
              return
            }

            processedCount++

            // Rest of the processing logic remains the same...
            const dateKey = format(date, "yyyy-MM-dd")
            const text = message.text || ""
            const sender = message.is_from_me === "true" ? "David" : "Nitzan"

            // Check for special message types
            const isLoveMessage = /love you|❤️|💕|💗|💓|💘|💝|😘/.test(text.toLowerCase())
            const isPhotoMessage = /\.(jpg|jpeg|png|gif|heic)/i.test(text) || text.includes("📷") || text.includes("🖼️")
            const isHappyMessage = /😊|😃|😄|😁|haha|lol|lmao|happy|joy|yay|excited/i.test(text)

            // Initialize or update the date entry
            if (!messagesByDate[dateKey]) {
              messagesByDate[dateKey] = {
                date: dateKey,
                count: 0,
                loveCount: 0,
                photoCount: 0,
                happyCount: 0,
              }
            }

            // Update counts
            messagesByDate[dateKey].count++
            if (isLoveMessage) messagesByDate[dateKey].loveCount++
            if (isPhotoMessage) messagesByDate[dateKey].photoCount++
            if (isHappyMessage) messagesByDate[dateKey].happyCount++

            // Store a preview message if it's meaningful
            if (
              (!messagesByDate[dateKey].previewMessage && text.length > 10) ||
              (isLoveMessage && (!messagesByDate[dateKey].previewMessage || Math.random() > 0.5))
            ) {
              messagesByDate[dateKey].previewMessage = text.substring(0, 100) + (text.length > 100 ? "..." : "")
              messagesByDate[dateKey].sender = sender
            }

            // Update year statistics
            yearStatistics[year].totalMessages++
            if (isLoveMessage) yearStatistics[year].loveMessages++
            if (isPhotoMessage) yearStatistics[year].photoMessages++
            if (isHappyMessage) yearStatistics[year].happyMessages++
          } catch (e) {
            console.error(`Error processing message at index ${index}:`, e, message)
            invalidDateCount++
          }
        })

        console.log(
          `Processing complete: ${processedCount} processed, ${skippedCount} skipped (out of range), ${invalidDateCount} invalid dates`,
        )

        // Calculate active days and most active day for each year
        Object.entries(messagesByDate).forEach(([dateKey, data]) => {
          const year = Number.parseInt(dateKey.split("-")[0])
          if (year >= 2015 && year <= 2025) {
            yearStatistics[year].activeDays++
            if (data.count > (yearStatistics[year].mostActiveDay?.count || 0)) {
              yearStatistics[year].mostActiveDay = {
                date: dateKey,
                count: data.count,
              }
            }
          }
        })

        setMessageData(messagesByDate)
        setYearStats(yearStatistics)
      } catch (err: any) {
        console.error("Error fetching message data:", err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchMessageData()
  }, [])

  // Fetch messages for a specific day when selected
  const fetchDayMessages = async (dateKey: string) => {
    try {
      setLoadingMessages(true)
      const date = parseISO(dateKey)
      const nextDay = new Date(date)
      nextDay.setDate(nextDay.getDate() + 1)

      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select("date, text, sender, is_from_me")
        .gte("date", date.toISOString())
        .lt("date", nextDay.toISOString())
        .order("date", { ascending: true })

      if (error) throw error

      // Process messages for display
      const processedMessages = data?.map((msg) => ({
        id: Math.random().toString(36).substring(2, 9), // Generate a random ID
        text: msg.text || "",
        time: format(new Date(msg.date), "h:mm a"),
        sender: msg.is_from_me === "true" ? "David" : "Nitzan",
        isLoveMessage: /love you|❤️|💕|💗|💓|💘|💝|😘/.test((msg.text || "").toLowerCase()),
        isPhotoMessage: /\.(jpg|jpeg|png|gif|heic)/i.test(msg.text || "") || (msg.text || "").includes("📷"),
        isHappyMessage: /😊|😃|😄|😁|haha|lol|lmao|happy|joy|yay|excited/i.test((msg.text || "").toLowerCase()),
      }))

      setDayMessages(processedMessages || [])
    } catch (err) {
      console.error("Error fetching day messages:", err)
    } finally {
      setLoadingMessages(false)
    }
  }

  // Generate calendar data for the selected year
  const calendarData = useMemo(() => {
    const yearData = []

    for (let month = 0; month < 12; month++) {
      const firstDay = new Date(selectedYear, month, 1)
      const lastDay = endOfMonth(firstDay)
      const daysInMonth = eachDayOfInterval({ start: firstDay, end: lastDay })

      // Calculate the maximum message count for this month for intensity scaling
      let maxCount = 0
      daysInMonth.forEach((day) => {
        const dateKey = format(day, "yyyy-MM-dd")
        const count = messageData[dateKey]?.count || 0
        maxCount = Math.max(maxCount, count)
      })

      // Generate day data
      const days = daysInMonth.map((day) => {
        const dateKey = format(day, "yyyy-MM-dd")
        const data = messageData[dateKey] || { count: 0, loveCount: 0, photoCount: 0, happyCount: 0 }
        const intensity = maxCount > 0 ? data.count / maxCount : 0

        return {
          date: day,
          count: data.count,
          intensity: intensity,
          loveCount: data.loveCount,
          photoCount: data.photoCount,
          happyCount: data.happyCount,
          hasLoveMessage: data.loveCount > 0,
          previewMessage: data.previewMessage,
          sender: data.sender,
        }
      })

      // Calculate leading empty days (before first day of month)
      const firstDayOfWeek = firstDay.getDay()
      const leadingEmptyDays = Array.from({ length: firstDayOfWeek }, (_, i) => ({
        date: new Date(selectedYear, month, -i),
        isEmpty: true,
        intensity: 0,
        count: 0,
        loveCount: 0,
        photoCount: 0,
        happyCount: 0,
        hasLoveMessage: false,
      }))

      yearData.push({
        month,
        name: MONTHS[month],
        days: [...leadingEmptyDays.reverse(), ...days],
      })
    }

    return yearData
  }, [selectedYear, messageData])

  // Get intensity color based on message count
  const getIntensityColor = (intensity: number, hasLoveMessage: boolean) => {
    if (intensity === 0) return "bg-gray-50"

    // Base color classes for the romantic gradient
    const baseColors = [
      "bg-[#FFF0F5]", // Light blush
      "bg-[#FFD1DC]", // Lighter pink
      "bg-[#FFB6C1]", // Light pink
      "bg-[#FF8DA1]", // Medium pink
      "bg-[#FF69B4]", // Hot pink
      "bg-[#C71585]", // Deep magenta
    ]

    // Determine color index based on intensity
    const colorIndex = Math.min(Math.floor(intensity * 6), 5)
    const baseColor = baseColors[colorIndex]

    // Add gold shimmer for love messages
    return hasLoveMessage ? `${baseColor} love-message-overlay` : baseColor
  }

  // Handle year navigation
  const navigateYear = (direction: number) => {
    const newYear = selectedYear + direction
    if (newYear >= 2015 && newYear <= 2025) {
      setSelectedYear(newYear)
    }
  }

  // Handle day click
  const handleDayClick = (day: DayData) => {
    if (day.isEmpty) return
    setSelectedDay(day)
    const dateKey = format(day.date, "yyyy-MM-dd")
    fetchDayMessages(dateKey)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white to-[#FFF0F5]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-[#C71585]" />
          <h2 className="text-2xl font-serif text-gray-800">Creating your love story...</h2>
          <p className="text-gray-600 mt-2">Loading 10 years of beautiful memories</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white to-[#FFF0F5]">
        <div className="text-center max-w-md">
          <div className="text-red-500 mb-4">❤️</div>
          <h2 className="text-2xl font-serif text-gray-800 mb-4">Something went wrong</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button onClick={() => window.location.reload()} className="bg-[#C71585] hover:bg-[#a01165]">
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-[#FFF0F5] py-8 px-4 sm:px-6 lg:px-8">
      <DataDiagnostic messageData={messageData} rawSample={rawSampleData} />
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl text-gray-800 mb-2">David & Nitzan</h1>
          <p className="text-gray-600 text-lg">A decade of love, one message at a time</p>
        </header>

        {/* Year Navigation */}
        <div className="flex items-center justify-center mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigateYear(-1)}
            disabled={selectedYear <= 2015}
            className="text-gray-600 hover:text-gray-900"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>

          <motion.h2
            key={selectedYear}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="font-serif text-4xl sm:text-5xl text-gray-800 mx-6 w-32 text-center"
          >
            {selectedYear}
          </motion.h2>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigateYear(1)}
            disabled={selectedYear >= 2025}
            className="text-gray-600 hover:text-gray-900"
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
        </div>

        {/* Year Pills */}
        <div className="flex justify-center flex-wrap gap-2 mb-8">
          {YEARS.map((year) => (
            <button
              key={year}
              onClick={() => setSelectedYear(year)}
              className={`px-3 py-1 rounded-full text-sm transition-all ${
                selectedYear === year
                  ? "bg-[#C71585] text-white font-medium"
                  : "bg-white text-gray-600 hover:bg-gray-100"
              }`}
            >
              {year}
            </button>
          ))}
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <Card className="p-4 text-center bg-white/80 backdrop-blur-sm border-pink-100">
            <div className="text-2xl sm:text-3xl font-bold text-[#C71585]">
              {yearStats[selectedYear]?.totalMessages?.toLocaleString() || 0}
            </div>
            <div className="text-gray-600 text-sm uppercase tracking-wide">Messages</div>
          </Card>
          <Card className="p-4 text-center bg-white/80 backdrop-blur-sm border-pink-100">
            <div className="text-2xl sm:text-3xl font-bold text-[#C71585]">
              {yearStats[selectedYear]?.activeDays || 0}
            </div>
            <div className="text-gray-600 text-sm uppercase tracking-wide">Active Days</div>
          </Card>
          <Card className="p-4 text-center bg-white/80 backdrop-blur-sm border-pink-100">
            <div className="text-2xl sm:text-3xl font-bold text-[#C71585]">
              {yearStats[selectedYear]?.loveMessages || 0}
            </div>
            <div className="text-gray-600 text-sm uppercase tracking-wide">Love Messages</div>
          </Card>
          <Card className="p-4 text-center bg-white/80 backdrop-blur-sm border-pink-100">
            <div className="text-2xl sm:text-3xl font-bold text-[#C71585]">
              {yearStats[selectedYear]?.mostActiveDay?.count > 0
                ? format(parseISO(yearStats[selectedYear]?.mostActiveDay?.date), "MMM d")
                : "-"}
            </div>
            <div className="text-gray-600 text-sm uppercase tracking-wide">Busiest Day</div>
          </Card>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {calendarData.map((month) => (
            <div key={month.month} className="bg-white rounded-lg shadow-sm p-4 border border-pink-100">
              <h3 className="font-medium text-center text-gray-800 uppercase tracking-wide text-sm mb-4">
                {month.name}
              </h3>
              <div className="grid grid-cols-7 gap-1">
                {/* Day headers */}
                {DAYS.map((day) => (
                  <div key={day} className="text-center text-xs text-gray-500 mb-1">
                    {day[0]}
                  </div>
                ))}

                {/* Calendar days */}
                {month.days.map((day, i) => (
                  <motion.div
                    key={day.isEmpty ? `empty-${i}` : format(day.date, "yyyy-MM-dd")}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.01 }}
                    className={`aspect-square relative rounded-md cursor-pointer transition-all ${
                      day.isEmpty ? "bg-transparent" : getIntensityColor(day.intensity, day.hasLoveMessage)
                    } ${
                      selectedDay &&
                      !day.isEmpty &&
                      format(day.date, "yyyy-MM-dd") === format(selectedDay.date, "yyyy-MM-dd")
                        ? "ring-2 ring-[#C71585]"
                        : ""
                    }`}
                    onMouseEnter={() => !day.isEmpty && setHoveredDay(day)}
                    onMouseLeave={() => setHoveredDay(null)}
                    onClick={() => !day.isEmpty && handleDayClick(day)}
                  >
                    {!day.isEmpty && (
                      <>
                        <div className="absolute top-1 left-1 text-xs font-medium text-gray-700">
                          {format(day.date, "d")}
                        </div>
                        {day.count > 0 && (
                          <div className="absolute bottom-1 right-1 text-[0.65rem] font-medium text-gray-700">
                            {day.count}
                          </div>
                        )}
                        {day.hasLoveMessage && (
                          <div className="absolute top-1 right-1">
                            <Heart className="h-2 w-2 text-red-500" fill="currentColor" />
                          </div>
                        )}
                      </>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Hover Tooltip */}
        <AnimatePresence>
          {hoveredDay && hoveredDay.count > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-lg p-4 border border-pink-200 max-w-md z-50"
            >
              <div className="text-lg font-serif text-gray-800 mb-1">{format(hoveredDay.date, "MMMM d, yyyy")}</div>
              <div className="flex items-center gap-4 mb-2 text-sm text-gray-600">
                <div className="flex items-center">
                  <MessageSquare className="h-4 w-4 mr-1" />
                  {hoveredDay.count} messages
                </div>
                {hoveredDay.loveCount > 0 && (
                  <div className="flex items-center text-red-500">
                    <Heart className="h-4 w-4 mr-1" fill="currentColor" />
                    {hoveredDay.loveCount}
                  </div>
                )}
                {hoveredDay.photoCount > 0 && (
                  <div className="flex items-center text-blue-500">
                    <ImageIcon className="h-4 w-4 mr-1" />
                    {hoveredDay.photoCount}
                  </div>
                )}
                {hoveredDay.happyCount > 0 && (
                  <div className="flex items-center text-yellow-500">
                    <Smile className="h-4 w-4 mr-1" />
                    {hoveredDay.happyCount}
                  </div>
                )}
              </div>
              {hoveredDay.previewMessage && (
                <div className="text-sm italic text-gray-600 border-l-2 border-pink-200 pl-3">
                  "{hoveredDay.previewMessage}"
                  {hoveredDay.sender && <span className="text-xs block mt-1 text-gray-500">— {hoveredDay.sender}</span>}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Day Detail Modal */}
        <AnimatePresence>
          {selectedDay && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              onClick={() => setSelectedDay(null)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6 border-b border-gray-100">
                  <h3 className="text-2xl font-serif text-gray-800">
                    {format(selectedDay.date, "EEEE, MMMM d, yyyy")}
                  </h3>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                    <div className="flex items-center">
                      <MessageSquare className="h-4 w-4 mr-1" />
                      {selectedDay.count} messages
                    </div>
                    {selectedDay.loveCount > 0 && (
                      <div className="flex items-center text-red-500">
                        <Heart className="h-4 w-4 mr-1" fill="currentColor" />
                        {selectedDay.loveCount}
                      </div>
                    )}
                    {selectedDay.photoCount > 0 && (
                      <div className="flex items-center text-blue-500">
                        <ImageIcon className="h-4 w-4 mr-1" />
                        {selectedDay.photoCount}
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-6 overflow-y-auto max-h-[60vh]">
                  {loadingMessages ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-8 h-8 animate-spin text-[#C71585]" />
                    </div>
                  ) : dayMessages.length > 0 ? (
                    <div className="space-y-4">
                      {dayMessages.map((message) => (
                        <motion.div
                          key={message.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`flex ${message.sender === "David" ? "justify-start" : "justify-end"}`}
                        >
                          <div
                            className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                              message.sender === "David"
                                ? "bg-blue-100 text-gray-800 rounded-bl-none"
                                : "bg-purple-100 text-gray-800 rounded-br-none"
                            } ${message.isLoveMessage ? "love-message" : ""}`}
                          >
                            <div className="text-sm">{message.text}</div>
                            <div className="text-xs text-gray-500 mt-1">{message.time}</div>
                            {message.isLoveMessage && (
                              <Heart className="h-3 w-3 text-red-500 inline ml-1" fill="currentColor" />
                            )}
                            {message.isPhotoMessage && <ImageIcon className="h-3 w-3 text-blue-500 inline ml-1" />}
                            {message.isHappyMessage && <Smile className="h-3 w-3 text-yellow-500 inline ml-1" />}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">No messages found for this day</div>
                  )}
                </div>

                <div className="p-4 border-t border-gray-100 flex justify-end">
                  <Button variant="outline" onClick={() => setSelectedDay(null)}>
                    Close
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <footer className="text-center mt-12 text-gray-500 text-sm">
        <p>David & Nitzan • 10 Years of Love • 2015-2025</p>
      </footer>

      {/* CSS for love message overlay */}
      <style jsx global>{`
        .love-message-overlay {
          position: relative;
          overflow: hidden;
        }
        
        .love-message-overlay::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(45deg, transparent, rgba(255, 215, 0, 0.3), transparent);
          animation: shimmer 2s infinite;
        }
        
        .love-message {
          position: relative;
          overflow: hidden;
        }
        
        .love-message::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(45deg, transparent, rgba(255, 105, 180, 0.1), transparent);
          animation: shimmer 2s infinite;
        }
        
        @keyframes shimmer {
          0% { background-position: -100% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </div>
  )
}
