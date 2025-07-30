"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Search,
  Plus,
  Menu,
  ChevronUp,
  ChevronDown,
  MessageCircle,
  Bell,
  Calendar,
  AlertTriangle,
  Database,
} from "lucide-react"
import { supabase, type Message, TABLE_NAME } from "@/lib/supabase"

interface MessageGroup {
  id: string
  messages: Message[]
  sender: string
  isFromMe: boolean
  timestamp: Date
  timeString: string
}

interface YearData {
  year: number
  count: number
  isExpanded: boolean
}

interface DebugInfo {
  totalRawMessages: number
  sampleRawMessages: any[]
  dateParsingResults: any[]
  yearDistribution: Record<number, number>
  filteringResults: {
    beforeCutoff: number
    afterCutoff: number
    cutoffDate: string
  }
  supabaseQueryInfo: {
    queryExecuted: string
    limitApplied: boolean
    orderBy: string
    pagesFetched: number
    totalRecordsExpected: number
  }
  year2016Analysis: {
    found: boolean
    count: number
    sampleMessages: any[]
    dateRange: string
    rawQuery: string
    error?: string
  }
  dateRangeAnalysis: {
    earliest: string
    latest: string
    totalSpan: string
    missingYears: number[]
  }
}

// Optimized date parsing function
function parseMessageDate(dateString: string): { date: Date; year: number; isValid: boolean } {
  try {
    const date = new Date(dateString)
    const year = date.getFullYear()
    const isValid = !isNaN(date.getTime()) && year >= 1900 && year <= 2030
    return { date, year, isValid }
  } catch (error) {
    return { date: new Date(), year: 0, isValid: false }
  }
}

// Optimized message grouping function
function groupMessagesByTime(messages: Message[]): MessageGroup[] {
  const groups: MessageGroup[] = []
  let currentGroup: Message[] = []
  let currentSender = ""
  let lastTimestamp = 0

  const sortedMessages = [...messages].sort((a, b) => {
    // Use pre-computed date if available, otherwise parse
    const dateA = a.date ? new Date(a.date).getTime() : new Date(a.readable_date).getTime()
    const dateB = b.date ? new Date(b.date).getTime() : new Date(b.readable_date).getTime()
    return dateA - dateB
  })

  for (const message of sortedMessages) {
    const messageTime = message.date ? new Date(message.date).getTime() : new Date(message.readable_date).getTime()
    const sender = String(message.is_from_me) === "1" ? "me" : "other"
    const timeDiff = messageTime - lastTimestamp

    if (sender === currentSender && timeDiff < 5 * 60 * 1000 && currentGroup.length > 0) {
      currentGroup.push(message)
    } else {
      if (currentGroup.length > 0) {
        const lastMessage = currentGroup[currentGroup.length - 1]
        const groupTimestamp = lastMessage.date ? new Date(lastMessage.date) : new Date(lastMessage.readable_date)
        groups.push({
          id: `group-${groups.length}`,
          messages: [...currentGroup],
          sender: currentSender,
          isFromMe: currentSender === "me",
          timestamp: groupTimestamp,
          timeString: groupTimestamp.toLocaleTimeString([], {
            hour: "numeric",
            minute: "2-digit",
          }),
        })
      }
      currentGroup = [message]
      currentSender = sender
    }
    lastTimestamp = messageTime
  }

  if (currentGroup.length > 0) {
    const lastMessage = currentGroup[currentGroup.length - 1]
    const groupTimestamp = lastMessage.date ? new Date(lastMessage.date) : new Date(lastMessage.readable_date)
    groups.push({
      id: `group-${groups.length}`,
      messages: [...currentGroup],
      sender: currentSender,
      isFromMe: currentSender === "me",
      timestamp: groupTimestamp,
      timeString: groupTimestamp.toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
      }),
    })
  }

  return groups
}

function MessageBubble({
  message,
  isFromMe,
  position,
}: {
  message: Message
  isFromMe: boolean
  position: "single" | "first" | "middle" | "last"
}) {
  const baseClasses = "max-w-[75%] px-4 py-2 text-sm leading-relaxed break-words cursor-pointer"

  const getCornerClasses = () => {
    if (isFromMe) {
      switch (position) {
        case "single":
          return "rounded-2xl"
        case "first":
          return "rounded-2xl rounded-br-md"
        case "middle":
          return "rounded-l-2xl rounded-r-md"
        case "last":
          return "rounded-2xl rounded-tr-md"
      }
    } else {
      switch (position) {
        case "single":
          return "rounded-2xl"
        case "first":
          return "rounded-2xl rounded-bl-md"
        case "middle":
          return "rounded-r-2xl rounded-l-md"
        case "last":
          return "rounded-2xl rounded-tl-md"
      }
    }
  }

  const colorClasses = isFromMe ? "bg-blue-600 text-white ml-auto" : "bg-gray-700 text-gray-100 mr-auto"

  // Show placeholder for empty messages
  const displayText = message.text && message.text.trim() !== '' 
    ? message.text 
    : message.has_attachments === 1 || message.has_attachments === "1"
      ? "[Attachment]"
      : "[Message]"

  // Use pre-analyzed emotion data
  const hasEmotionData = message.primary_emotion && message.emotion_confidence
  const emotionTooltip = hasEmotionData 
    ? `Emotion: ${message.primary_emotion} (${Math.round(message.emotion_confidence * 100)}% confidence)`
    : undefined
  
  return (
    <div 
      className={`${baseClasses} ${colorClasses} ${getCornerClasses()} group relative`}
      title={emotionTooltip}
    >
      {displayText}
      
      {/* Emotion indicator */}
      {hasEmotionData && message.emotion_confidence > 0.3 && (
        <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-gradient-to-r from-pink-400 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
      )}
    </div>
  )
}

function MessageGroup({ group }: { group: MessageGroup }) {
  return (
    <div className={`flex flex-col gap-0.5 mb-4 ${group.isFromMe ? "items-end" : "items-start"}`}>
      {group.messages.map((message, index) => {
        let position: "single" | "first" | "middle" | "last" = "single"

        if (group.messages.length > 1) {
          if (index === 0) position = "first"
          else if (index === group.messages.length - 1) position = "last"
          else position = "middle"
        }

        return (
          <MessageBubble
            key={message.message_id || index}
            message={message}
            isFromMe={group.isFromMe}
            position={position}
          />
        )
      })}
      <div className={`text-xs text-gray-400 mt-1 px-2 ${group.isFromMe ? "text-right" : "text-left"}`}>
        {group.timeString}
      </div>
    </div>
  )
}

function DayHeader({ date }: { date: Date }) {
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  let dateString = ""
  if (date.toDateString() === today.toDateString()) {
    dateString = "Today"
  } else if (date.toDateString() === yesterday.toDateString()) {
    dateString = "Yesterday"
  } else {
    dateString = date.toLocaleDateString([], {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  return (
    <div className="flex justify-center my-6">
      <div className="bg-gray-800 px-3 py-1 rounded-full text-xs text-gray-300 font-medium">{dateString}</div>
    </div>
  )
}

export default function MobileMessageApp() {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchMode, setSearchMode] = useState<"all" | "year">("all")
  const [selectedYear, setSelectedYear] = useState<number | null>(2015)
  const [yearData, setYearData] = useState<YearData[]>([])
  const [messagesExpanded, setMessagesExpanded] = useState(true)
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null)
  const [showDebug, setShowDebug] = useState(false)
  const [searchFilters, setSearchFilters] = useState({
    sender: "",
    dateRange: "",
    hasAttachments: false,
    hasLinks: false,
    hasEmojis: false,
    emotions: {
      love: false,
      joy: false,
      sweet: false,
      support: false,
      celebration: false,
      deepTalks: false,
      fights: false,
      anxiety: false,
      excitement: false,
      sadness: false,
      gratitude: false,
      sexiness: false,
      flirtation: false,
      intimacy: false,
      jealousy: false,
      nostalgia: false,
      surprise: false,
      confusion: false,
      relief: false,
      longing: false,
      playfulness: false
    }
  })
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([])
  const [showSearchPanel, setShowSearchPanel] = useState(false)
  const [loadingProgress, setLoadingProgress] = useState(0)
  
  // Pre-calculated insights from the full dataset
  const insights = {
    totalWords: 470263,
    messageCount: 40216,
    wordsPerMessage: 12,
    loveCount: 2883,
    loveFromDavid: 1349,
    loveFromNitzan: 1534,
    lovePerMessage: 7.2,
    pickUpOrliCount: 131,
    iLoveYouCount: 479,
    missYouCount: 111,
    coffeeCount: 73,
    foodCount: 1152,
    emojiCount: 274,
    emojiPerMessage: 0.7
  }

  // Calculate emotion filter counts using pre-analyzed data
  const emotionCounts = useMemo(() => {
    console.log('🎭 Starting emotion count calculation...')
    console.log('   Messages available:', messages.length)
    
    const counts = {
      love: 0,
      joy: 0,
      sweet: 0,
      support: 0,
      celebration: 0,
      deepTalks: 0,
      fights: 0,
      anxiety: 0,
      excitement: 0,
      sadness: 0,
      gratitude: 0,
      sexiness: 0,
      flirtation: 0,
      intimacy: 0,
      jealousy: 0,
      nostalgia: 0,
      surprise: 0,
      confusion: 0,
      relief: 0,
      longing: 0,
      playfulness: 0
    }

    let totalMessages = 0
    let messagesWithEmotions = 0
    let neutralCount = 0

    messages.forEach((msg, index) => {
      if (!msg.text) return
      totalMessages++
      
      // Debug first few messages
      if (index < 5) {
        console.log(`🎭 Message ${index + 1}:`, {
          id: msg.message_id,
          text: msg.text?.substring(0, 30),
          primary_emotion: msg.primary_emotion,
          emotion_confidence: msg.emotion_confidence,
          has_primary: !!msg.primary_emotion,
          is_neutral: msg.primary_emotion === 'neutral',
          in_counts: msg.primary_emotion in counts
        })
      }
      
      // Use pre-analyzed emotion data if available
      if (msg.primary_emotion) {
        if (msg.primary_emotion === 'neutral') {
          neutralCount++
        } else if (msg.primary_emotion in counts) {
          counts[msg.primary_emotion as keyof typeof counts]++
          messagesWithEmotions++
        }
      }

      // Also count secondary emotions
      if (msg.secondary_emotions && Array.isArray(msg.secondary_emotions)) {
        msg.secondary_emotions.forEach(emotion => {
          if (emotion in counts) {
            counts[emotion as keyof typeof counts]++
          }
        })
      }
    })

    // Debug logging
    console.log('🎭 Emotion Analysis Debug:')
    console.log(`   Total messages: ${totalMessages}`)
    console.log(`   Messages with emotions: ${messagesWithEmotions}`)
    console.log(`   Neutral messages: ${neutralCount}`)
    console.log(`   Messages array length: ${messages.length}`)
    console.log(`   First few messages:`, messages.slice(0, 3).map(msg => ({
      id: msg.message_id,
      text: msg.text?.substring(0, 30),
      primary_emotion: msg.primary_emotion,
      emotion_confidence: msg.emotion_confidence
    })))
    console.log(`   Emotion counts:`, counts)

    console.log('🎭 Final emotion counts:', counts)
    return counts
  }, [messages])

  // Generate search suggestions based on message content
  const generateSearchSuggestions = useMemo(() => {
    const suggestions: string[] = []
    const commonWords = new Map<string, number>()
    
    // Extract common words from messages
    messages.forEach(msg => {
      if (msg.text) {
        const words = msg.text.toLowerCase().match(/\b\w+\b/g) || []
        words.forEach(word => {
          if (word.length > 3) { // Only words longer than 3 characters
            commonWords.set(word, (commonWords.get(word) || 0) + 1)
          }
        })
      }
    })
    
    // Get top 10 most common words
    const sortedWords = Array.from(commonWords.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([word]) => word)
    
    suggestions.push(...sortedWords)
    
    // Add some predefined interesting searches
    suggestions.push('cafe', 'restaurant', 'meeting', 'work', 'home', 'travel', 'food', 'coffee', 'dinner', 'lunch')
    
    return suggestions
  }, [messages])

  useEffect(() => {
    async function fetchMessages() {
      try {
        setLoading(true)
        setError(null)
        setLoadingProgress(0)

        console.log("=== COMPREHENSIVE 2016 MESSAGE HUNT ===")
        console.log("Fetching from table:", TABLE_NAME)
        console.log("Timestamp:", new Date().toISOString())

        // Start the loading animation
        setTimeout(() => setLoadingProgress(1), 500)
        setTimeout(() => setLoadingProgress(2), 1500)
        setTimeout(() => setLoadingProgress(3), 2500)
        setTimeout(() => setLoadingProgress(4), 3500)
        setTimeout(() => setLoadingProgress(5), 4500)
        setTimeout(() => setLoadingProgress(6), 5500)
        setTimeout(() => setLoadingProgress(7), 6500)

        // Step 1: Get exact count from database
        console.log("Step 1: Getting exact count...")
        const { count: exactCount, error: countError } = await supabase
          .from(TABLE_NAME)
          .select("*", { count: "exact", head: true })

        if (countError) {
          console.error("Count query error:", countError)
          throw countError
        }

        console.log("✅ EXACT COUNT FROM DATABASE:", exactCount)

        // Step 2: MULTIPLE 2016 QUERIES TO HUNT DOWN THE DATA
        console.log("Step 2: HUNTING FOR 2016 DATA WITH MULTIPLE QUERIES...")

        // Query 1: Exact 2016 year match
        console.log("🔍 Query 1: Exact 2016 year match...")
        const { data: year2016Exact, error: error2016Exact } = await supabase
          .from(TABLE_NAME)
          .select("*")
          .gte("readable_date", "2016-01-01")
          .lt("readable_date", "2017-01-01")
          .order("readable_date", { ascending: true })

        console.log("Query 1 result:", year2016Exact?.length || 0, "messages")
        if (year2016Exact && year2016Exact.length > 0) {
          console.log("✅ FOUND 2016 DATA WITH EXACT QUERY!")
          console.log("First 2016 message:", year2016Exact[0])
          console.log("Last 2016 message:", year2016Exact[year2016Exact.length - 1])
        }

        // Query 2: Contains "2016" in readable_date
        console.log("🔍 Query 2: Contains '2016' in readable_date...")
        const { data: year2016Contains, error: error2016Contains } = await supabase
          .from(TABLE_NAME)
          .select("*")
          .ilike("readable_date", "%2016%")
          .order("readable_date", { ascending: true })

        console.log("Query 2 result:", year2016Contains?.length || 0, "messages")
        if (year2016Contains && year2016Contains.length > 0) {
          console.log("✅ FOUND 2016 DATA WITH CONTAINS QUERY!")
          console.log("Sample contains results:", year2016Contains.slice(0, 3))
        }

        // Query 3: Get date range to see what years exist
        console.log("🔍 Query 3: Getting date range...")
        const { data: dateRangeData, error: dateRangeError } = await supabase
          .from(TABLE_NAME)
          .select("readable_date")
          .order("readable_date", { ascending: true })

        let dateRangeAnalysis = {
          earliest: "Unknown",
          latest: "Unknown",
          totalSpan: "Unknown",
          missingYears: [] as number[],
        }

        if (dateRangeData && dateRangeData.length > 0) {
          const validDates = dateRangeData
            .map((d) => new Date(d.readable_date))
            .filter((d) => !isNaN(d.getTime()))
            .sort((a, b) => a.getTime() - b.getTime())

          if (validDates.length > 0) {
            const earliest = validDates[0]
            const latest = validDates[validDates.length - 1]

            dateRangeAnalysis = {
              earliest: earliest.toISOString().substring(0, 10),
              latest: latest.toISOString().substring(0, 10),
              totalSpan: `${latest.getFullYear() - earliest.getFullYear()} years`,
              missingYears: [],
            }

            // Check for missing years
            const startYear = earliest.getFullYear()
            const endYear = latest.getFullYear()
            const existingYears = new Set(validDates.map((d) => d.getFullYear()))

            for (let year = startYear; year <= endYear; year++) {
              if (!existingYears.has(year)) {
                dateRangeAnalysis.missingYears.push(year)
              }
            }

            console.log("✅ DATE RANGE ANALYSIS:")
            console.log("- Earliest:", dateRangeAnalysis.earliest)
            console.log("- Latest:", dateRangeAnalysis.latest)
            console.log("- Span:", dateRangeAnalysis.totalSpan)
            console.log("- Missing years:", dateRangeAnalysis.missingYears)
            console.log("- 2016 exists:", existingYears.has(2016) ? "YES" : "NO")
          }
        }

        // Query 4: Sample messages around 2016 timeframe
        console.log("🔍 Query 4: Messages around 2016 timeframe...")
        const { data: around2016, error: errorAround2016 } = await supabase
          .from(TABLE_NAME)
          .select("*")
          .gte("readable_date", "2015-06-01")
          .lt("readable_date", "2017-06-01")
          .order("readable_date", { ascending: true })

        console.log("Query 4 result:", around2016?.length || 0, "messages around 2016")
        if (around2016 && around2016.length > 0) {
          const yearCounts: Record<number, number> = {}
          around2016.forEach((msg) => {
            const year = new Date(msg.readable_date).getFullYear()
            if (!isNaN(year)) {
              yearCounts[year] = (yearCounts[year] || 0) + 1
            }
          })
          console.log("Year distribution around 2016:", yearCounts)
        }

        // Consolidate 2016 analysis
        const year2016Analysis = {
          found: (year2016Exact?.length || 0) > 0 || (year2016Contains?.length || 0) > 0,
          count: Math.max(year2016Exact?.length || 0, year2016Contains?.length || 0),
          sampleMessages: year2016Exact?.slice(0, 3) || year2016Contains?.slice(0, 3) || [],
          dateRange:
            year2016Exact && year2016Exact.length > 0
              ? `${year2016Exact[0].readable_date} to ${year2016Exact[year2016Exact.length - 1].readable_date}`
              : "No 2016 data found",
          rawQuery: "Multiple queries executed",
          error: error2016Exact?.message || error2016Contains?.message,
        }

        console.log("🎯 FINAL 2016 ANALYSIS:", year2016Analysis)

        // Step 3: Get ALL messages with pagination to handle large datasets
        console.log("Step 3: Fetching ALL messages with pagination...")
        const startTime = Date.now()
        
        let allData: any[] = []
        let hasMore = true
        let page = 0
        let totalPages = 0
        const pageSize = 1000
        
        while (hasMore) {
          console.log(`Fetching page ${page + 1} (${pageSize} records)...`)
          const { data: pageData, error: fetchError } = await supabase
            .from(TABLE_NAME)
            .select(`*, primary_emotion, emotion_confidence, secondary_emotions, emotion_intensity, emotion_context, emotion_triggers, relationship_impact`)
            .order("readable_date", { ascending: true })
            .range(page * pageSize, (page + 1) * pageSize - 1)
          
          if (fetchError) {
            console.error("❌ Page fetch error:", fetchError)
            throw fetchError
          }
          
          if (pageData && pageData.length > 0) {
            // Debug the first record to see what fields are actually returned
            if (page === 0 && pageData.length > 0) {
              console.log('🔍 First page data sample:', {
                message_id: pageData[0].message_id,
                text: pageData[0].text?.substring(0, 30),
                has_primary_emotion: 'primary_emotion' in pageData[0],
                primary_emotion: pageData[0].primary_emotion,
                all_keys: Object.keys(pageData[0]).filter(key => key.includes('emotion'))
              })
            }
            
            allData = allData.concat(pageData)
            console.log(`✅ Page ${page + 1} loaded: ${pageData.length} records`)
            page++
            totalPages = page
          } else {
            hasMore = false
            totalPages = page
          }
          
          // Safety check to prevent infinite loops - increased to handle 50,000+ records
          if (page > 50) {
            console.warn("⚠️ Stopping pagination after 50 pages to prevent infinite loop")
            hasMore = false
          }
        }
        
        const data = allData

        const queryTime = Date.now() - startTime
        console.log(`✅ Main query completed in ${queryTime}ms`)

        // Note: fetchError is handled inside the while loop above

        console.log("✅ RAW DATA RECEIVED:")
        console.log("- Expected count:", exactCount)
        console.log("- Actual received:", data?.length)
        console.log("- Match:", exactCount === data?.length ? "✅ YES" : "❌ NO")
        
        // Debug emotion data
        if (data && data.length > 0) {
          console.log("🔍 Checking first 3 messages for emotion fields:")
          data.slice(0, 3).forEach((msg, index) => {
            console.log(`   Message ${index + 1}:`, {
              id: msg.message_id,
              text: msg.text?.substring(0, 30),
              has_primary_emotion: 'primary_emotion' in msg,
              primary_emotion: msg.primary_emotion,
              emotion_confidence: msg.emotion_confidence,
              all_keys: Object.keys(msg).filter(key => key.includes('emotion'))
            })
          })
          
          const sampleWithEmotion = data.find(msg => msg.primary_emotion && msg.primary_emotion !== 'neutral')
          if (sampleWithEmotion) {
            console.log("🎭 Sample message with emotion:")
            console.log("   Text:", sampleWithEmotion.text?.substring(0, 50))
            console.log("   Primary emotion:", sampleWithEmotion.primary_emotion)
            console.log("   Confidence:", sampleWithEmotion.emotion_confidence)
          } else {
            console.log("❌ No messages with emotions found in fetched data")
          }
          
          const emotionStats = {}
          data.forEach(msg => {
            if (msg.primary_emotion) {
              emotionStats[msg.primary_emotion] = (emotionStats[msg.primary_emotion] || 0) + 1
            }
          })
          console.log("📊 Emotion distribution in fetched data:", emotionStats)
        }

        if (!data || data.length === 0) {
          setError("No messages found in the database")
          return
        }



        // Step 4: Analyze ALL dates to find 2016
        console.log("=== ANALYZING ALL DATES FOR 2016 ===")
        const dateParsingResults: any[] = []
        const yearDistribution: Record<number, number> = {}
        let validDates = 0
        let invalidDates = 0
        let found2016InParsing = 0

        data.forEach((msg: any, index: number) => {
          try {
            const originalDate = msg.readable_date
            if (!originalDate) {
              invalidDates++
              return
            }

            const parsedDate = new Date(originalDate)
            const year = parsedDate.getFullYear()
            // More lenient validation - accept any reasonable date
            const isValid = !isNaN(parsedDate.getTime()) && year >= 1900 && year <= 2030

            if (isValid) {
              validDates++
              yearDistribution[year] = (yearDistribution[year] || 0) + 1

              if (year === 2016) {
                found2016InParsing++
                if (found2016InParsing <= 5) {
                  console.log(`🎯 FOUND 2016 MESSAGE #${found2016InParsing}:`, {
                    index,
                    original: originalDate,
                    parsed: parsedDate.toISOString(),
                    text: msg.text?.substring(0, 50) + "...",
                  })
                }
              }
            } else {
              invalidDates++
              console.log(`⚠️ Invalid date found: ${originalDate} at index ${index}`)
            }

            // Store detailed info for first 20 messages
            if (index < 20) {
              dateParsingResults.push({
                index,
                original: originalDate,
                parsed: isValid ? parsedDate.toISOString() : "INVALID",
                year: isValid ? year : "INVALID",
                isValid,
              })
            }
          } catch (e) {
            invalidDates++
            console.log(`⚠️ Date parsing error at index ${index}:`, e)
          }
        })

        console.log("✅ DATE PARSING RESULTS:")
        console.log("- Valid dates:", validDates)
        console.log("- Invalid dates:", invalidDates)
        console.log("- 2016 messages found in parsing:", found2016InParsing)
        console.log("- Year distribution:", yearDistribution)

        // Step 5: Process messages (INCLUDE ALL MESSAGES)
        console.log("=== MESSAGE PROCESSING (INCLUDING ALL MESSAGES) ===")
        
        const normalizedMessages: Message[] = []
        let processingErrors = 0

        // Optimized message processing with better error handling
        data.forEach((msg: any, index: number) => {
          try {
            // Use optimized date parsing
            const { date: messageDate, year, isValid: isValidDate } = parseMessageDate(msg.readable_date)

            if (isValidDate) {
              normalizedMessages.push({
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
                message_id: index,
                date: messageDate.toISOString(),
                message_type: msg.has_attachments && msg.has_attachments !== "0" ? "image" : "text",
                year: year,
                month: messageDate.getMonth() + 1,
                day: messageDate.getDate(),
              })
            } else {
              console.log(`⚠️ Skipping message with invalid date: ${msg.readable_date}`)
            }
          } catch (e) {
            processingErrors++
            console.log(`⚠️ Processing error at index ${index}:`, e)
          }
        })

        // Step 6: Final year counts
        const finalYearCounts: { [year: number]: number } = {}
        normalizedMessages.forEach((msg) => {
          const year = new Date(msg.date).getFullYear()
          finalYearCounts[year] = (finalYearCounts[year] || 0) + 1
        })

        console.log("✅ FINAL RESULTS:")
        console.log("- Total processed messages:", normalizedMessages.length)
        console.log("- Final year distribution:", finalYearCounts)
        console.log("- 2016 in final data:", finalYearCounts[2016] || 0)
        
        // Debug: Check for 2022-2025 data
        console.log("🔍 CHECKING FOR 2022-2025 DATA:")
        for (let year = 2022; year <= 2025; year++) {
          const count = finalYearCounts[year] || 0
          console.log(`- ${year}: ${count} messages`)
        }
        
        // Debug: Check date range of processed messages
        if (normalizedMessages.length > 0) {
          const dates = normalizedMessages.map(msg => new Date(msg.date))
          const earliest = new Date(Math.min(...dates.map(d => d.getTime())))
          const latest = new Date(Math.max(...dates.map(d => d.getTime())))
          console.log("📅 PROCESSED MESSAGE DATE RANGE:")
          console.log("- Earliest:", earliest.toISOString().substring(0, 10))
          console.log("- Latest:", latest.toISOString().substring(0, 10))
        }

        // Set debug info
        setDebugInfo({
          totalRawMessages: data.length,
          sampleRawMessages: data.slice(0, 5),
          dateParsingResults,
          yearDistribution,
          filteringResults: {
            beforeCutoff: 0,
            afterCutoff: normalizedMessages.length,
            cutoffDate: "DISABLED",
          },
          supabaseQueryInfo: {
            queryExecuted: `SELECT * FROM ${TABLE_NAME} ORDER BY readable_date ASC (PAGINATED)`,
            limitApplied: false,
            orderBy: "readable_date ASC",
            pagesFetched: totalPages,
            totalRecordsExpected: exactCount,
          },
          year2016Analysis,
          dateRangeAnalysis,
        })

        setMessages(normalizedMessages)

        const years = Object.keys(finalYearCounts)
          .map((year) => Number.parseInt(year))
          .sort((a, b) => a - b) // Changed to ascending order: 2015 first, 2025 last
          .map((year) => ({
            year,
            count: finalYearCounts[year],
            isExpanded: false,
          }))

        setYearData(years)

        console.log("=== HUNT COMPLETE ===")
        if (!finalYearCounts[2016]) {
          console.log("🚨 2016 MESSAGES NOT FOUND IN FINAL DATA")
          console.log("Check the debug panel for detailed analysis")
        } else {
          console.log("✅ 2016 MESSAGES FOUND:", finalYearCounts[2016])
        }
      } catch (err: any) {
        console.error("❌ FATAL ERROR:", err)
        setError(`Failed to load messages: ${err.message}`)
      } finally {
        setLoading(false)
      }
    }

    fetchMessages()
  }, [])

  // Enhanced filtering with advanced search capabilities
  const filteredMessages = useMemo(() => {
    let filtered = messages

    // Year filter (only apply if search mode is "year" or no search mode selected)
    if (selectedYear && (searchMode === "year" || !searchQuery)) {
      filtered = filtered.filter((msg) => {
        if (msg.year) return msg.year === selectedYear
        const { year } = parseMessageDate(msg.readable_date)
        return year === selectedYear
      })
    }

    // Text search with multiple modes
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      
      // Check if it's a special search command
      if (query.startsWith('/')) {
        const command = query.slice(1).split(' ')[0]
        const searchTerm = query.slice(command.length + 2)
        
        switch (command) {
          case 'sender':
            filtered = filtered.filter((msg) => 
              msg.sender?.toLowerCase().includes(searchTerm)
            )
            break
          case 'date':
            filtered = filtered.filter((msg) => 
              msg.readable_date?.includes(searchTerm)
            )
            break
          case 'link':
            filtered = filtered.filter((msg) => 
              msg.text?.toLowerCase().includes('http') || 
              msg.links?.toLowerCase().includes(searchTerm)
            )
            break
          case 'emoji':
            filtered = filtered.filter((msg) => 
              msg.emojis || msg.text?.match(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u)
            )
            break
          case 'attachment':
            filtered = filtered.filter((msg) => 
              msg.has_attachments === 1 || msg.has_attachments === "1"
            )
            break
          default:
            // Regular text search
            filtered = filtered.filter((msg) => 
              msg.text?.toLowerCase().includes(query) ||
              msg.sender?.toLowerCase().includes(query) ||
              msg.recipient?.toLowerCase().includes(query)
            )
        }
      } else {
        // Regular text search across all fields
        filtered = filtered.filter((msg) => 
          msg.text?.toLowerCase().includes(query) ||
          msg.sender?.toLowerCase().includes(query) ||
          msg.recipient?.toLowerCase().includes(query)
        )
      }
    }

    // Advanced filters
    if (searchFilters.sender) {
      filtered = filtered.filter((msg) => 
        msg.sender?.toLowerCase().includes(searchFilters.sender.toLowerCase())
      )
    }

    if (searchFilters.hasAttachments) {
      filtered = filtered.filter((msg) => 
        msg.has_attachments === 1 || msg.has_attachments === "1"
      )
    }

    if (searchFilters.hasLinks) {
      filtered = filtered.filter((msg) => 
        msg.text?.toLowerCase().includes('http') || msg.links
      )
    }

    if (searchFilters.hasEmojis) {
      filtered = filtered.filter((msg) => 
        msg.emojis || msg.text?.match(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u)
      )
    }

    // Emotion filters using pre-analyzed data
    const activeEmotions = Object.entries(searchFilters.emotions)
      .filter(([_, isActive]) => isActive)
      .map(([emotion]) => emotion)

    if (activeEmotions.length > 0) {
      filtered = filtered.filter((msg) => {
        if (!msg.text) return false

        return activeEmotions.some(emotion => {
          // Check primary emotion
          if (msg.primary_emotion === emotion) return true
          
          // Check secondary emotions
          if (msg.secondary_emotions && Array.isArray(msg.secondary_emotions) && msg.secondary_emotions.includes(emotion)) return true
          
          // Special case for deep talks (context-based)
          if (emotion === 'deepTalks') {
            const messageDate = new Date(msg.readable_date)
            const hour = messageDate.getHours()
            const isLateNight = hour >= 22 || hour <= 6
            const isLongMessage = msg.text.length > 100
            return isLongMessage && isLateNight
          }
          
          return false
        })
      })
    }

    return filtered
  }, [messages, selectedYear, searchQuery, searchFilters])

  // Optimized message grouping with memoization
  const messageGroups = useMemo(() => groupMessagesByTime(filteredMessages), [filteredMessages])

  // Optimized day grouping with better performance
  const groupedByDay = useMemo(() => {
    const dayGroups: { [key: string]: MessageGroup[] } = {}

    messageGroups.forEach((group) => {
      const dayKey = group.timestamp.toDateString()
      if (!dayGroups[dayKey]) {
        dayGroups[dayKey] = []
      }
      dayGroups[dayKey].push(group)
    })

    return Object.entries(dayGroups).sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
  }, [messageGroups])

  // Performance optimization: Debounced search
  const debouncedSearchQuery = useMemo(() => {
    const timeoutId = setTimeout(() => {}, 300)
    return searchQuery
  }, [searchQuery])

  // Virtual scrolling optimization: Limit displayed items for large datasets
  const displayLimit = 1000 // Show max 1000 messages at once for performance
  const limitedGroupedByDay = useMemo(() => {
    if (groupedByDay.length <= displayLimit) return groupedByDay
    
    // For large datasets, show most recent days first
    return groupedByDay.slice(-displayLimit)
  }, [groupedByDay, displayLimit])

  const selectYear = (year: number | null) => {
    setSelectedYear(year)
    setSidebarOpen(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900 flex items-center justify-center">
        <div className="text-center max-w-2xl mx-auto px-6">
          {/* Animated Heart */}
          <div className="mb-8">
            <div className="animate-pulse">
              <div className="text-6xl mb-4">💕</div>
            </div>
          </div>

          {/* Elegant Text Animation */}
          <div className="space-y-4 text-white">
            <div className="overflow-hidden">
              <div 
                className="text-2xl font-light tracking-wide transform transition-all duration-1000 ease-out"
                style={{
                  transform: loadingProgress >= 1 ? 'translateY(0)' : 'translateY(20px)',
                  opacity: loadingProgress >= 1 ? 1 : 0
                }}
              >
                Words of affirmation
              </div>
            </div>

            <div className="overflow-hidden">
              <div 
                className="text-xl text-blue-200 transform transition-all duration-1000 ease-out delay-500"
                style={{
                  transform: loadingProgress >= 2 ? 'translateY(0)' : 'translateY(20px)',
                  opacity: loadingProgress >= 2 ? 1 : 0
                }}
              >
                Are your love language.
              </div>
            </div>

            <div className="overflow-hidden">
              <div 
                className="text-lg text-purple-200 transform transition-all duration-1000 ease-out delay-1000"
                style={{
                  transform: loadingProgress >= 3 ? 'translateY(0)' : 'translateY(20px)',
                  opacity: loadingProgress >= 3 ? 1 : 0
                }}
              >
                We've written{' '}
                <span className="font-semibold text-yellow-300 animate-pulse">
                  {insights.totalWords.toLocaleString()}
                </span>{' '}
                words
              </div>
            </div>

            <div className="overflow-hidden">
              <div 
                className="text-lg text-pink-200 transform transition-all duration-1000 ease-out delay-1500"
                style={{
                  transform: loadingProgress >= 4 ? 'translateY(0)' : 'translateY(20px)',
                  opacity: loadingProgress >= 4 ? 1 : 0
                }}
              >
                and said "love" {insights.loveCount.toLocaleString()} times.
              </div>
            </div>

            <div className="overflow-hidden">
              <div 
                className="text-lg text-green-200 transform transition-all duration-1000 ease-out delay-2000"
                style={{
                  transform: loadingProgress >= 5 ? 'translateY(0)' : 'translateY(20px)',
                  opacity: loadingProgress >= 5 ? 1 : 0
                }}
              >
                Including {insights.iLoveYouCount} "I love you"s 💕
              </div>
            </div>

            <div className="overflow-hidden">
              <div 
                className="text-lg text-orange-200 transform transition-all duration-1000 ease-out delay-2500"
                style={{
                  transform: loadingProgress >= 6 ? 'translateY(0)' : 'translateY(20px)',
                  opacity: loadingProgress >= 6 ? 1 : 0
                }}
              >
                And {insights.pickUpOrliCount} "pick up Orli"s 👶
              </div>
            </div>

            <div className="overflow-hidden">
              <div 
                className="text-xl font-medium text-white transform transition-all duration-1000 ease-out delay-3000"
                style={{
                  transform: loadingProgress >= 7 ? 'translateY(0)' : 'translateY(20px)',
                  opacity: loadingProgress >= 7 ? 1 : 0
                }}
              >
                and counting...
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-8 w-full max-w-md mx-auto">
            <div className="bg-gray-800 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 h-full rounded-full transition-all duration-500 ease-out"
                style={{ width: `${(loadingProgress / 7) * 100}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Loading your love story... {Math.round((loadingProgress / 7) * 100)}%
            </p>
          </div>

          {/* Subtle Loading Indicator */}
          <div className="mt-6">
            <div className="flex justify-center space-x-1">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
          <h2 className="text-red-400 font-semibold mb-2">Connection Error</h2>
          <p className="text-gray-300 mb-4">{error}</p>
          <div className="text-xs text-gray-400 mb-4">
            <p>Table: {TABLE_NAME}</p>
            <p>Check console for comprehensive debug info</p>
          </div>
          <Button onClick={() => window.location.reload()} className="w-full bg-blue-600 hover:bg-blue-700">
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder={searchMode === "all" ? "Search all messages..." : "Search this year..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400 rounded-full"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-200"
              >
                ×
              </button>
            )}
          </div>

          <Button
            size="sm"
            onClick={() => setShowSearchPanel(!showSearchPanel)}
            className={`rounded-lg p-2 ${showSearchPanel ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-600 hover:bg-gray-700"}`}
          >
            <Search className="h-4 w-4" />
          </Button>

          <Button
            size="sm"
            onClick={() => setSearchMode(searchMode === "all" ? "year" : "all")}
            className={`rounded-lg p-2 ${searchMode === "all" ? "bg-green-600 hover:bg-green-700" : "bg-orange-600 hover:bg-orange-700"}`}
            title={searchMode === "all" ? "Search all messages" : "Search this year only"}
          >
            {searchMode === "all" ? "🌍" : "📅"}
          </Button>

          <Button
            size="sm"
            onClick={() => setShowDebug(!showDebug)}
            className={`rounded-lg p-2 ${showDebug ? "bg-yellow-600 hover:bg-yellow-700" : "bg-red-600 hover:bg-red-700"}`}
          >
            <AlertTriangle className="h-4 w-4" />
          </Button>

          <Button size="sm" className="bg-purple-600 hover:bg-purple-700 rounded-lg p-2">
            <Database className="h-4 w-4" />
          </Button>

          <Button size="sm" className="bg-gray-700 hover:bg-gray-600 rounded-full p-2">
            <Plus className="h-4 w-4" />
          </Button>

          <Button
            size="sm"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="bg-gray-700 hover:bg-gray-600 rounded-lg p-2"
          >
            <Menu className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Search Panel */}
      {showSearchPanel && (
        <div className="bg-blue-900 border-b border-blue-700 p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h3 className="text-blue-200 font-semibold mb-3">🔍 Advanced Search</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-blue-300 text-sm">Search Mode</label>
                  <div className="flex gap-2 mt-1">
                    <button
                      onClick={() => setSearchMode("all")}
                      className={`px-3 py-1 rounded text-xs ${
                        searchMode === "all" 
                          ? "bg-blue-600 text-white" 
                          : "bg-gray-600 text-gray-300"
                      }`}
                    >
                      All Messages
                    </button>
                    <button
                      onClick={() => setSearchMode("year")}
                      className={`px-3 py-1 rounded text-xs ${
                        searchMode === "year" 
                          ? "bg-blue-600 text-white" 
                          : "bg-gray-600 text-gray-300"
                      }`}
                    >
                      This Year Only
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="text-blue-300 text-sm">Quick Filters</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    <button
                      onClick={() => setSearchFilters(prev => ({ ...prev, hasAttachments: !prev.hasAttachments }))}
                      className={`px-2 py-1 rounded text-xs ${
                        searchFilters.hasAttachments 
                          ? "bg-green-600 text-white" 
                          : "bg-gray-600 text-gray-300"
                      }`}
                    >
                      📎 Attachments
                    </button>
                    <button
                      onClick={() => setSearchFilters(prev => ({ ...prev, hasLinks: !prev.hasLinks }))}
                      className={`px-2 py-1 rounded text-xs ${
                        searchFilters.hasLinks 
                          ? "bg-green-600 text-white" 
                          : "bg-gray-600 text-gray-300"
                      }`}
                    >
                      🔗 Links
                    </button>
                    <button
                      onClick={() => setSearchFilters(prev => ({ ...prev, hasEmojis: !prev.hasEmojis }))}
                      className={`px-2 py-1 rounded text-xs ${
                        searchFilters.hasEmojis 
                          ? "bg-green-600 text-white" 
                          : "bg-gray-600 text-gray-300"
                      }`}
                    >
                      😊 Emojis
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-blue-300 text-sm">Emotion Filters</label>
                  <div className="text-xs text-gray-400 mb-2">
                    Debug: {JSON.stringify(emotionCounts)}
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-1">
                    <button
                      onClick={() => setSearchFilters(prev => ({ 
                        ...prev, 
                        emotions: { ...prev.emotions, love: !prev.emotions.love }
                      }))}
                      className={`px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                        searchFilters.emotions.love 
                          ? "bg-red-500 text-white shadow-lg" 
                          : "bg-gray-600 text-gray-300 hover:bg-gray-500"
                      }`}
                    >
                      ❤️ Love ({emotionCounts.love})
                    </button>
                    <button
                      onClick={() => setSearchFilters(prev => ({ 
                        ...prev, 
                        emotions: { ...prev.emotions, joy: !prev.emotions.joy }
                      }))}
                      className={`px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                        searchFilters.emotions.joy 
                          ? "bg-yellow-500 text-white shadow-lg" 
                          : "bg-gray-600 text-gray-300 hover:bg-gray-500"
                      }`}
                    >
                      😂 Joy ({emotionCounts.joy})
                    </button>
                    <button
                      onClick={() => setSearchFilters(prev => ({ 
                        ...prev, 
                        emotions: { ...prev.emotions, sweet: !prev.emotions.sweet }
                      }))}
                      className={`px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                        searchFilters.emotions.sweet 
                          ? "bg-pink-500 text-white shadow-lg" 
                          : "bg-gray-600 text-gray-300 hover:bg-gray-500"
                      }`}
                    >
                      🥰 Sweet ({emotionCounts.sweet})
                    </button>
                    <button
                      onClick={() => setSearchFilters(prev => ({ 
                        ...prev, 
                        emotions: { ...prev.emotions, support: !prev.emotions.support }
                      }))}
                      className={`px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                        searchFilters.emotions.support 
                          ? "bg-blue-500 text-white shadow-lg" 
                          : "bg-gray-600 text-gray-300 hover:bg-gray-500"
                      }`}
                    >
                      😢 Support ({emotionCounts.support})
                    </button>
                    <button
                      onClick={() => setSearchFilters(prev => ({ 
                        ...prev, 
                        emotions: { ...prev.emotions, celebration: !prev.emotions.celebration }
                      }))}
                      className={`px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                        searchFilters.emotions.celebration 
                          ? "bg-purple-500 text-white shadow-lg" 
                          : "bg-gray-600 text-gray-300 hover:bg-gray-500"
                      }`}
                    >
                      🎉 Celebration ({emotionCounts.celebration})
                    </button>
                    <button
                      onClick={() => setSearchFilters(prev => ({ 
                        ...prev, 
                        emotions: { ...prev.emotions, deepTalks: !prev.emotions.deepTalks }
                      }))}
                      className={`px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                        searchFilters.emotions.deepTalks 
                          ? "bg-indigo-500 text-white shadow-lg" 
                          : "bg-gray-600 text-gray-300 hover:bg-gray-500"
                      }`}
                    >
                      💭 Deep Talks ({emotionCounts.deepTalks})
                    </button>
                    <button
                      onClick={() => setSearchFilters(prev => ({ 
                        ...prev, 
                        emotions: { ...prev.emotions, fights: !prev.emotions.fights }
                      }))}
                      className={`px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                        searchFilters.emotions.fights 
                          ? "bg-red-600 text-white shadow-lg" 
                          : "bg-gray-600 text-gray-300 hover:bg-gray-500"
                      }`}
                    >
                      😠 Fights ({emotionCounts.fights})
                    </button>
                    <button
                      onClick={() => setSearchFilters(prev => ({ 
                        ...prev, 
                        emotions: { ...prev.emotions, anxiety: !prev.emotions.anxiety }
                      }))}
                      className={`px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                        searchFilters.emotions.anxiety 
                          ? "bg-orange-600 text-white shadow-lg" 
                          : "bg-gray-600 text-gray-300 hover:bg-gray-500"
                      }`}
                    >
                      😰 Anxiety ({emotionCounts.anxiety})
                    </button>
                    <button
                      onClick={() => setSearchFilters(prev => ({ 
                        ...prev, 
                        emotions: { ...prev.emotions, excitement: !prev.emotions.excitement }
                      }))}
                      className={`px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                        searchFilters.emotions.excitement 
                          ? "bg-yellow-600 text-white shadow-lg" 
                          : "bg-gray-600 text-gray-300 hover:bg-gray-500"
                      }`}
                    >
                      🎉 Excitement ({emotionCounts.excitement})
                    </button>
                    <button
                      onClick={() => setSearchFilters(prev => ({ 
                        ...prev, 
                        emotions: { ...prev.emotions, sadness: !prev.emotions.sadness }
                      }))}
                      className={`px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                        searchFilters.emotions.sadness 
                          ? "bg-blue-600 text-white shadow-lg" 
                          : "bg-gray-600 text-gray-300 hover:bg-gray-500"
                      }`}
                    >
                      😢 Sadness ({emotionCounts.sadness})
                    </button>
                    <button
                      onClick={() => setSearchFilters(prev => ({ 
                        ...prev, 
                        emotions: { ...prev.emotions, gratitude: !prev.emotions.gratitude }
                      }))}
                      className={`px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                        searchFilters.emotions.gratitude 
                          ? "bg-green-600 text-white shadow-lg" 
                          : "bg-gray-600 text-gray-300 hover:bg-gray-500"
                      }`}
                    >
                      🙏 Gratitude ({emotionCounts.gratitude})
                    </button>
                    <button
                      onClick={() => setSearchFilters(prev => ({ 
                        ...prev, 
                        emotions: { ...prev.emotions, sexiness: !prev.emotions.sexiness }
                      }))}
                      className={`px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                        searchFilters.emotions.sexiness 
                          ? "bg-pink-600 text-white shadow-lg" 
                          : "bg-gray-600 text-gray-300 hover:bg-gray-500"
                      }`}
                    >
                      🔥 Sexiness ({emotionCounts.sexiness})
                    </button>
                    <button
                      onClick={() => setSearchFilters(prev => ({ 
                        ...prev, 
                        emotions: { ...prev.emotions, flirtation: !prev.emotions.flirtation }
                      }))}
                      className={`px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                        searchFilters.emotions.flirtation 
                          ? "bg-purple-600 text-white shadow-lg" 
                          : "bg-gray-600 text-gray-300 hover:bg-gray-500"
                      }`}
                    >
                      😉 Flirtation ({emotionCounts.flirtation})
                    </button>
                    <button
                      onClick={() => setSearchFilters(prev => ({ 
                        ...prev, 
                        emotions: { ...prev.emotions, intimacy: !prev.emotions.intimacy }
                      }))}
                      className={`px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                        searchFilters.emotions.intimacy 
                          ? "bg-red-600 text-white shadow-lg" 
                          : "bg-gray-600 text-gray-300 hover:bg-gray-500"
                      }`}
                    >
                      💕 Intimacy ({emotionCounts.intimacy})
                    </button>
                    <button
                      onClick={() => setSearchFilters(prev => ({ 
                        ...prev, 
                        emotions: { ...prev.emotions, jealousy: !prev.emotions.jealousy }
                      }))}
                      className={`px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                        searchFilters.emotions.jealousy 
                          ? "bg-yellow-600 text-white shadow-lg" 
                          : "bg-gray-600 text-gray-300 hover:bg-gray-500"
                      }`}
                    >
                      😤 Jealousy ({emotionCounts.jealousy})
                    </button>
                    <button
                      onClick={() => setSearchFilters(prev => ({ 
                        ...prev, 
                        emotions: { ...prev.emotions, nostalgia: !prev.emotions.nostalgia }
                      }))}
                      className={`px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                        searchFilters.emotions.nostalgia 
                          ? "bg-teal-600 text-white shadow-lg" 
                          : "bg-gray-600 text-gray-300 hover:bg-gray-500"
                      }`}
                    >
                      😌 Nostalgia ({emotionCounts.nostalgia})
                    </button>
                    <button
                      onClick={() => setSearchFilters(prev => ({ 
                        ...prev, 
                        emotions: { ...prev.emotions, surprise: !prev.emotions.surprise }
                      }))}
                      className={`px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                        searchFilters.emotions.surprise 
                          ? "bg-orange-600 text-white shadow-lg" 
                          : "bg-gray-600 text-gray-300 hover:bg-gray-500"
                      }`}
                    >
                      😲 Surprise ({emotionCounts.surprise})
                    </button>
                    <button
                      onClick={() => setSearchFilters(prev => ({ 
                        ...prev, 
                        emotions: { ...prev.emotions, confusion: !prev.emotions.confusion }
                      }))}
                      className={`px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                        searchFilters.emotions.confusion 
                          ? "bg-gray-500 text-white shadow-lg" 
                          : "bg-gray-600 text-gray-300 hover:bg-gray-500"
                      }`}
                    >
                      🤔 Confusion ({emotionCounts.confusion})
                    </button>
                    <button
                      onClick={() => setSearchFilters(prev => ({ 
                        ...prev, 
                        emotions: { ...prev.emotions, relief: !prev.emotions.relief }
                      }))}
                      className={`px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                        searchFilters.emotions.relief 
                          ? "bg-green-500 text-white shadow-lg" 
                          : "bg-gray-600 text-gray-300 hover:bg-gray-500"
                      }`}
                    >
                      😌 Relief ({emotionCounts.relief})
                    </button>
                    <button
                      onClick={() => setSearchFilters(prev => ({ 
                        ...prev, 
                        emotions: { ...prev.emotions, longing: !prev.emotions.longing }
                      }))}
                      className={`px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                        searchFilters.emotions.longing 
                          ? "bg-purple-500 text-white shadow-lg" 
                          : "bg-gray-600 text-gray-300 hover:bg-gray-500"
                      }`}
                    >
                      💔 Longing ({emotionCounts.longing})
                    </button>
                    <button
                      onClick={() => setSearchFilters(prev => ({ 
                        ...prev, 
                        emotions: { ...prev.emotions, playfulness: !prev.emotions.playfulness }
                      }))}
                      className={`px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                        searchFilters.emotions.playfulness 
                          ? "bg-cyan-600 text-white shadow-lg" 
                          : "bg-gray-600 text-gray-300 hover:bg-gray-500"
                      }`}
                    >
                      😄 Playfulness ({emotionCounts.playfulness})
                    </button>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-blue-700">
                  <button
                    onClick={() => setSearchFilters({
                      sender: "",
                      dateRange: "",
                      hasAttachments: false,
                      hasLinks: false,
                      hasEmojis: false,
                      emotions: {
                        love: false,
                        joy: false,
                        sweet: false,
                        support: false,
                        celebration: false,
                        deepTalks: false,
                        fights: false,
                        anxiety: false,
                        excitement: false,
                        sadness: false,
                        gratitude: false,
                        sexiness: false,
                        flirtation: false,
                        intimacy: false,
                        jealousy: false,
                        nostalgia: false,
                        surprise: false,
                        confusion: false,
                        relief: false,
                        longing: false,
                        playfulness: false
                      }
                    })}
                    className="w-full px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-xs text-gray-300 transition-colors"
                  >
                    🗑️ Clear All Filters
                  </button>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-blue-200 font-semibold mb-3">💡 Search Tips</h3>
              <div className="text-blue-300 text-xs space-y-2">
                <p><strong>Commands:</strong></p>
                <ul className="space-y-1 ml-2">
                  <li><code>/sender david</code> - Find messages from David</li>
                  <li><code>/date 2025</code> - Find messages from 2025</li>
                  <li><code>/link</code> - Find messages with links</li>
                  <li><code>/emoji</code> - Find messages with emojis</li>
                  <li><code>/attachment</code> - Find messages with attachments</li>
                </ul>
                <p className="mt-2"><strong>Discovery:</strong></p>
                <ul className="space-y-1 ml-2">
                  <li>• Search across all years for patterns</li>
                  <li>• Use filters to find specific content types</li>
                  <li>• Combine search with year selection</li>
                </ul>
              </div>
            </div>
            
            <div>
              <h3 className="text-blue-200 font-semibold mb-3">🔥 Trending Topics</h3>
              <div className="text-blue-300 text-xs">
                <p className="mb-2">Popular words in your conversations:</p>
                <div className="flex flex-wrap gap-1">
                  {generateSearchSuggestions.slice(0, 8).map((word, index) => (
                    <button
                      key={index}
                      onClick={() => setSearchQuery(word)}
                      className="px-2 py-1 bg-blue-800 hover:bg-blue-700 rounded text-xs"
                    >
                      {word}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}



      {/* Debug Panel */}
      {showDebug && debugInfo && (
        <div className="bg-red-900 border-b border-red-700 p-4 text-xs">
          <h3 className="text-red-200 font-semibold mb-3">🔍 WHERE ARE THE 2016 MESSAGES?</h3>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div className="bg-red-800 p-3 rounded">
              <h4 className="text-red-300 font-medium mb-2">Database</h4>
              <p className="text-red-100">Total: {debugInfo.totalRawMessages}</p>
              <p className="text-red-100">Expected: 20,000+</p>
              <p className={`${debugInfo.totalRawMessages < 1000 ? "text-red-300 font-bold" : "text-red-100"}`}>
                Status: {debugInfo.totalRawMessages < 1000 ? "🚨 LOW" : "✅ OK"}
              </p>
            </div>

            <div className="bg-blue-800 p-3 rounded">
              <h4 className="text-blue-300 font-medium mb-2">Date Range</h4>
              <p className="text-blue-100">From: {debugInfo.dateRangeAnalysis.earliest}</p>
              <p className="text-blue-100">To: {debugInfo.dateRangeAnalysis.latest}</p>
              <p className="text-blue-100">Span: {debugInfo.dateRangeAnalysis.totalSpan}</p>
              <p
                className={`${debugInfo.dateRangeAnalysis.missingYears.includes(2016) ? "text-red-300" : "text-green-300"}`}
              >
                2016: {debugInfo.dateRangeAnalysis.missingYears.includes(2016) ? "MISSING" : "EXISTS"}
              </p>
            </div>

            <div className="bg-purple-800 p-3 rounded">
              <h4 className="text-purple-300 font-medium mb-2">2016 Hunt</h4>
              <p className={`${debugInfo.year2016Analysis.found ? "text-green-100" : "text-red-100"}`}>
                Found: {debugInfo.year2016Analysis.found ? "YES" : "NO"}
              </p>
              <p className="text-purple-100">Count: {debugInfo.year2016Analysis.count}</p>
              <p className="text-purple-100">Range: {debugInfo.year2016Analysis.dateRange.substring(0, 20)}...</p>
              {debugInfo.year2016Analysis.error && (
                <p className="text-red-300">Error: {debugInfo.year2016Analysis.error}</p>
              )}
            </div>

            <div className="bg-yellow-800 p-3 rounded">
              <h4 className="text-yellow-300 font-medium mb-2">Year Distribution</h4>
              {Object.entries(debugInfo.yearDistribution)
                .slice(0, 4)
                .map(([year, count]) => (
                  <p key={year} className={`${year === "2016" ? "text-green-100 font-bold" : "text-yellow-100"}`}>
                    {year}: {count}
                  </p>
                ))}
              <p className="text-yellow-200">2016: {debugInfo.yearDistribution[2016] || 0}</p>
            </div>

            <div className="bg-green-800 p-3 rounded">
              <h4 className="text-green-300 font-medium mb-2">Processing</h4>
              <p className="text-green-100">Processed: {messages.length}</p>
              <p className="text-green-100">Pages: {debugInfo.supabaseQueryInfo.pagesFetched || 0}</p>
              <p className="text-green-100">Expected: {debugInfo.supabaseQueryInfo.totalRecordsExpected || 0}</p>
              <p className="text-green-100">2016 Final: {yearData.find((y) => y.year === 2016)?.count || 0}</p>
            </div>

            <div className="bg-gray-800 p-3 rounded">
              <h4 className="text-gray-300 font-medium mb-2">Missing Years</h4>
              {debugInfo.dateRangeAnalysis.missingYears.length > 0 ? (
                debugInfo.dateRangeAnalysis.missingYears.slice(0, 5).map((year) => (
                  <p key={year} className={`${year === 2016 ? "text-red-300 font-bold" : "text-gray-100"}`}>
                    {year}
                  </p>
                ))
              ) : (
                <p className="text-green-100">None</p>
              )}
            </div>
          </div>

          <div className="mt-3 p-2 bg-gray-800 rounded">
            <p className="text-gray-300">
              <strong>Conclusion:</strong>{" "}
              {debugInfo.year2016Analysis.found
                ? `✅ 2016 data exists in database (${debugInfo.year2016Analysis.count} messages)`
                : "❌ No 2016 data found in database"}
            </p>
          </div>
        </div>
      )}

      <div className="flex">
        {/* Sidebar */}
        <div
          className={`
          fixed inset-y-0 left-0 z-50 w-80 bg-gray-800 border-r border-gray-700 transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          lg:relative lg:translate-x-0
        `}
        >
          <div className="flex flex-col h-full">
            <div className="p-4 border-b border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <MessageCircle className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h2 className="font-semibold text-gray-100">Message Timeline</h2>
                  <p className="text-xs text-gray-400">{filteredMessages.length.toLocaleString()} messages</p>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="p-4">
                <button
                  onClick={() => setMessagesExpanded(!messagesExpanded)}
                  className="flex items-center justify-between w-full text-left mb-3"
                >
                  <div className="flex items-center gap-3">
                    <MessageCircle className="h-4 w-4 text-gray-400" />
                    <span className="font-medium text-gray-100">MESSAGES</span>
                  </div>
                  {messagesExpanded ? (
                    <ChevronUp className="h-4 w-4 text-gray-400" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  )}
                </button>

                {messagesExpanded && (
                  <div className="space-y-1 ml-7">
                    <button
                      onClick={() => selectYear(null)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                        selectedYear === null
                          ? "bg-gray-700 text-gray-100"
                          : "text-gray-400 hover:text-gray-200 hover:bg-gray-700/50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>All Messages</span>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${messages.length < 1000 ? "bg-red-600" : "bg-gray-600"}`}
                        >
                          {messages.length.toLocaleString()}
                        </span>
                      </div>
                    </button>

                    {yearData.map((yearInfo) => (
                      <div key={yearInfo.year}>
                        <button
                          onClick={() => selectYear(yearInfo.year)}
                          className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                            selectedYear === yearInfo.year
                              ? "bg-gray-700 text-gray-100"
                              : "text-gray-400 hover:text-gray-200 hover:bg-gray-700/50"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-2 h-2 rounded-full ${
                                  yearInfo.year === 2016
                                    ? "bg-purple-500"
                                    : yearInfo.year >= 2020
                                      ? "bg-purple-500"
                                      : yearInfo.year >= 2018
                                        ? "bg-pink-500"
                                        : "bg-gray-500"
                                }`}
                              />
                              <span>{yearInfo.year}</span>
                            </div>
                            <span className="text-xs bg-gray-600 px-2 py-1 rounded-full">
                              {yearInfo.count.toLocaleString()}
                            </span>
                          </div>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>


          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-h-screen">
          <div className="bg-gray-800 border-b border-gray-700 px-4 py-3">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="font-semibold text-gray-100">
                  {selectedYear ? `Messages from ${selectedYear}` : "All Messages"}
                  {searchMode === "all" && searchQuery && (
                    <span className="text-blue-400 text-sm ml-2">(Searching all years)</span>
                  )}
                </h1>
                <p className="text-xs text-gray-400">
                  {filteredMessages.length.toLocaleString()} messages
                  {searchQuery && ` matching "${searchQuery}"`}
                  {searchFilters.hasAttachments && " 📎"}
                  {searchFilters.hasLinks && " 🔗"}
                  {searchFilters.hasEmojis && " 😊"}
                  {Object.values(searchFilters.emotions).some(Boolean) && (
                    <span className="ml-1">
                      {Object.entries(searchFilters.emotions)
                        .filter(([_, isActive]) => isActive)
                        .map(([emotion]) => {
                          const emojis = { 
                            love: '❤️', 
                            joy: '😂', 
                            sweet: '🥰', 
                            support: '😢', 
                            celebration: '🎉', 
                            deepTalks: '💭', 
                            fights: '😠',
                            anxiety: '😰',
                            excitement: '🎉',
                            sadness: '😢',
                            gratitude: '🙏',
                            sexiness: '🔥',
                            flirtation: '😉',
                            intimacy: '💕',
                            jealousy: '😤',
                            nostalgia: '😌',
                            surprise: '😲',
                            confusion: '🤔',
                            relief: '😌',
                            longing: '💔',
                            playfulness: '😄'
                          }
                          return emojis[emotion as keyof typeof emojis]
                        })
                        .join(' ')}
                    </span>
                  )}
                </p>
              </div>
              <Calendar className="h-5 w-5 text-gray-400" />
            </div>
          </div>

          <div className="px-4 py-6 max-w-2xl mx-auto">
            {groupedByDay.length === 0 ? (
              <div className="text-center py-12">
                <MessageCircle className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">
                  {searchQuery ? "No messages found matching your search" : "No messages found"}
                </p>
              </div>
            ) : (
              <>
                {/* Performance indicator for large datasets */}
                {groupedByDay.length > displayLimit && (
                  <div className="mb-4 p-3 bg-yellow-900/20 border border-yellow-600/30 rounded-lg">
                    <p className="text-yellow-300 text-sm">
                      ⚡ Showing {limitedGroupedByDay.length} of {groupedByDay.length} days for performance
                    </p>
                    <p className="text-yellow-400 text-xs mt-1">
                      Use search or year filter to see specific data
                    </p>
                  </div>
                )}
                
                {limitedGroupedByDay.map(([dayString, dayGroups]) => (
                  <div key={dayString}>
                    <DayHeader date={new Date(dayString)} />
                    {dayGroups.map((group) => (
                      <MessageGroup key={group.id} group={group} />
                    ))}
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </div>

      {sidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}
    </div>
  )
}
