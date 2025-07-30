"use client"

import { useState, useEffect } from "react"
import { Calendar, Search, MessageSquare, Filter, AlertCircle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import VirtualMessageList from "@/components/virtual-message-list"
import { supabase, type Message, TABLE_NAME, convertTimestampToDate } from "@/lib/supabase"

export default function MessagesSection() {
  const [selectedYear, setSelectedYear] = useState<number | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [totalCount, setTotalCount] = useState(0)
  const [yearCounts, setYearCounts] = useState<Record<number, number>>({})
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  // Static year data for sidebar - expanded range
  const availableYears = [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024]

  useEffect(() => {
    loadYearCounts()
  }, [])

  useEffect(() => {
    if (selectedYear) {
      loadMessages(selectedYear)
    }
  }, [selectedYear, searchTerm])

  const loadYearCounts = async () => {
    try {
      setError(null)
      console.log("Loading year counts from table:", TABLE_NAME)

      // Get sample data first to understand structure
      const { data: sampleData, error: sampleError } = await supabase.from(TABLE_NAME).select("*").limit(5)

      if (sampleError) {
        console.error("Sample data error:", sampleError)
        setError(`Sample data error: ${sampleError.message}`)
        return
      }

      console.log("Sample data:", sampleData)
      setDebugInfo({ sampleData, tableName: TABLE_NAME })

      // Get all readable_date values to count by year
      const { data, error } = await supabase.from(TABLE_NAME).select("readable_date")

      if (error) {
        console.error("Date loading error:", error)
        setError(`Date loading error: ${error.message}`)
        return
      }

      console.log(`Loaded ${data?.length || 0} date records`)
      console.log("First 5 date samples:", data?.slice(0, 5))

      const counts: Record<number, number> = {}
      let validMessages = 0
      let invalidDates = 0
      const cutoffDate = new Date("2015-07-24")

      data?.forEach((row, index) => {
        if (row.readable_date) {
          try {
            const messageDate = convertTimestampToDate(row.readable_date)

            // Log first few conversions for debugging
            if (index < 10) {
              console.log(`Date conversion ${index}:`, {
                original: row.readable_date,
                converted: messageDate,
                year: messageDate.getFullYear(),
              })
            }

            // Only count messages from July 24, 2015 onwards
            if (messageDate >= cutoffDate) {
              const year = messageDate.getFullYear()
              if (year >= 2015 && year <= 2024) {
                counts[year] = (counts[year] || 0) + 1
                validMessages++
              }
            }
          } catch (e) {
            invalidDates++
            if (index < 5) {
              console.warn("Could not parse date:", row.readable_date, e)
            }
          }
        }
      })

      console.log("Year counts:", counts)
      console.log("Valid messages:", validMessages)
      console.log("Invalid dates:", invalidDates)

      setYearCounts(counts)
      setTotalCount(validMessages)
    } catch (error: any) {
      console.error("Error loading year counts:", error)
      setError(`Error loading year counts: ${error.message}`)
    }
  }

  const loadMessages = async (year: number) => {
    setLoading(true)
    setError(null)

    try {
      console.log(`Loading messages for year ${year}`)

      // Get ALL messages for the year - remove limit and use pagination if needed
      const { data, error } = await supabase.from(TABLE_NAME).select("*").order("readable_date", { ascending: true })
      // Remove the limit to get all messages

      if (error) {
        console.error("Messages loading error:", error)
        setError(`Messages loading error: ${error.message}`)
        setLoading(false)
        return
      }

      console.log(`Fetched ${data?.length || 0} raw messages`)

      // Filter and process messages client-side
      const filteredMessages: Message[] = []
      const cutoffDate = new Date("2015-07-24")
      let processedCount = 0
      let yearMatches = 0
      let searchMatches = 0

      data?.forEach((msg: any, index) => {
        try {
          const messageDate = convertTimestampToDate(msg.readable_date)
          const messageYear = messageDate.getFullYear()

          processedCount++

          // Log first few messages for debugging
          if (index < 3) {
            console.log(`Message ${index}:`, {
              originalDate: msg.readable_date,
              convertedDate: messageDate,
              year: messageYear,
              text: msg.text?.substring(0, 50),
              is_from_me: msg.is_from_me,
            })
          }

          // Filter by year and cutoff date
          if (messageYear === year && messageDate >= cutoffDate) {
            yearMatches++

            // Apply search filter if present
            if (!searchTerm || msg.text?.toLowerCase().includes(searchTerm.toLowerCase())) {
              searchMatches++

              filteredMessages.push({
                text: msg.text || "",
                data: msg.data || "",
                date_read: msg.date_read || "",
                is_from_me: msg.is_from_me,
                sender: msg.sender || "",
                recipient: msg.recipient || "",
                has_attachments: msg.has_attachments,
                attachments_info: msg.attachments_info || "",
                emojis: msg.emojis || "",
                links: msg.links || "",
                service: msg.service || "",
                account: msg.account || "",
                contact_id: msg.contact_id || "",
                readable_date: msg.readable_date || "",
                message_id: Math.random(),
                date: messageDate.toISOString(),
                message_type: msg.has_attachments && msg.has_attachments !== "0" ? "image" : "text",
                year: messageYear,
                month: messageDate.getMonth() + 1,
                day: messageDate.getDate(),
                metadata: {},
                attachment_count: msg.has_attachments && msg.has_attachments !== "0" ? 1 : 0,
              })
            }
          }
        } catch (e) {
          console.warn("Could not process message:", msg, e)
        }
      })

      console.log(`Processing results for ${year}:`, {
        processedCount,
        yearMatches,
        searchMatches,
        finalCount: filteredMessages.length,
      })

      // Sort by date
      filteredMessages.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

      setMessages(filteredMessages)
    } catch (error: any) {
      console.error("Error loading messages:", error)
      setError(`Error loading messages: ${error.message}`)
      setMessages([])
    } finally {
      setLoading(false)
    }
  }

  const handleYearSelect = (year: number) => {
    setSelectedYear(year)
  }

  const filteredMessages = messages.filter((message) => message.text?.toLowerCase().includes(searchTerm.toLowerCase()))

  return (
    <div className="h-full flex">
      {/* Year Sidebar */}
      <div className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-700">
          <h2 className="font-semibold text-gray-100 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-400" />
            Browse by Year
          </h2>
          <p className="text-xs text-gray-400 mt-1">{totalCount.toLocaleString()} total messages</p>
          <p className="text-xs text-gray-500 mt-1">Source: {TABLE_NAME}</p>

          {/* Debug Info */}
          {debugInfo && (
            <div className="mt-2 p-2 bg-gray-900 rounded text-xs">
              <div className="text-yellow-400">Debug Info:</div>
              <div className="text-gray-300">Table: {debugInfo.tableName}</div>
              <div className="text-gray-300">Sample count: {debugInfo.sampleData?.length || 0}</div>
              {debugInfo.sampleData?.[0] && (
                <div className="text-gray-300">Columns: {Object.keys(debugInfo.sampleData[0]).join(", ")}</div>
              )}
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-4 bg-red-900 border-b border-red-700">
            <div className="flex items-center gap-2 text-red-200 text-sm">
              <AlertCircle className="h-4 w-4" />
              <span>Error</span>
            </div>
            <p className="text-xs text-red-300 mt-1">{error}</p>
            <Button size="sm" variant="outline" className="mt-2 text-xs bg-transparent" onClick={loadYearCounts}>
              Retry
            </Button>
          </div>
        )}

        {/* Year List */}
        <div className="flex-1 overflow-y-auto p-2">
          {availableYears.map((year) => (
            <button
              key={year}
              onClick={() => handleYearSelect(year)}
              className={`w-full flex items-center justify-between p-3 rounded-lg mb-2 transition-colors ${
                selectedYear === year ? "bg-blue-600 text-white" : "text-gray-300 hover:bg-gray-700 hover:text-white"
              }`}
            >
              <span className="font-medium">{year}</span>
              <span className="text-sm opacity-75">{yearCounts[year]?.toLocaleString() || "0"}</span>
            </button>
          ))}
        </div>

        {/* Stats */}
        <div className="p-4 border-t border-gray-700">
          <div className="text-xs text-gray-400 space-y-1">
            <div className="flex justify-between">
              <span>Since July 24, 2015</span>
            </div>
            <div className="flex justify-between">
              <span>Years active:</span>
              <span>{Object.keys(yearCounts).length}</span>
            </div>
            <div className="flex justify-between">
              <span>Data source:</span>
              <span className="text-green-400">{TABLE_NAME}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {selectedYear ? (
          <>
            {/* Header */}
            <div className="bg-gray-800 border-b border-gray-700 px-4 py-3">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="font-semibold text-gray-100 flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-green-400" />
                    Messages from {selectedYear}
                  </h1>
                  <p className="text-xs text-gray-400">
                    {loading ? "Loading..." : `${filteredMessages.length.toLocaleString()} messages`} • {TABLE_NAME}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-gray-400" />
                  <span className="text-xs text-gray-400">Chronological</span>
                </div>
              </div>
            </div>

            {/* Search */}
            <div className="bg-gray-800 border-b border-gray-700 px-4 py-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search messages..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400"
                />
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-hidden">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-4"></div>
                    <p className="text-gray-400">Loading messages from {selectedYear}...</p>
                    <p className="text-xs text-gray-500 mt-1">{TABLE_NAME}</p>
                  </div>
                </div>
              ) : error ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <p className="text-red-400 mb-2">Error loading messages</p>
                    <p className="text-xs text-gray-500 mb-4">{error}</p>
                    <Button onClick={() => loadMessages(selectedYear)} variant="outline">
                      Try Again
                    </Button>
                  </div>
                </div>
              ) : filteredMessages.length > 0 ? (
                <VirtualMessageList messages={filteredMessages} />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <MessageSquare className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">
                      {searchTerm ? "No messages found matching your search" : "No messages found for this year"}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Searching in {TABLE_NAME}</p>
                    <p className="text-xs text-gray-600 mt-2">
                      Year count shows: {yearCounts[selectedYear]?.toLocaleString() || "0"} messages
                    </p>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Calendar className="h-16 w-16 text-gray-600 mx-auto mb-6" />
              <h2 className="text-xl font-semibold text-gray-300 mb-2">Select a Year</h2>
              <p className="text-gray-400 max-w-md">
                Choose a year from the sidebar to browse your messages from that time period. Your conversation history
                spans from July 24, 2015 to present day.
              </p>
              <p className="text-sm text-green-400 mt-2">Now using {TABLE_NAME}</p>
              <div className="mt-6 grid grid-cols-2 gap-4 max-w-sm mx-auto">
                <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                  <div className="text-2xl font-bold text-blue-400">{Object.keys(yearCounts).length}</div>
                  <div className="text-sm text-gray-400">Years Active</div>
                </div>
                <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                  <div className="text-2xl font-bold text-green-400">{totalCount.toLocaleString()}</div>
                  <div className="text-sm text-gray-400">Total Messages</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
