"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Menu, MessageCircle, Heart, Star } from "lucide-react"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { supabase, type Message, TABLE_NAME } from "@/lib/supabase"
import DirectAudioPlayer from "./direct-audio-player"
import EnhancedLoveNotesAudioPlayer from "@/components/enhanced-love-notes-audio-player"
import EnhancedMessageAudioControl from "./enhanced-message-audio-control"
import { getAvailableAudioFiles, getAudioFilename, checkMultipleAudioFiles, getAudioFilenameSet, resolveAudioFilename, resolveAudioFilenameByTimestamp } from "@/lib/audio-file-manager"
import { useAudioStore } from "@/lib/audio-state-manager"

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
  searchMode,
  showLoveNotes,
  isPlaying,
  onPlay,
  onPause,
  onEnded,
}: {
  message: Message
  isFromMe: boolean
  position: "single" | "first" | "middle" | "last"
  searchMode?: "all" | "year" | "love"
  showLoveNotes?: boolean
  isPlaying?: boolean
  onPlay?: () => void
  onPause?: () => void
  onEnded?: () => void
}) {
  // Favorites helpers via global injected functions (defined in root component)
  const favFns = (typeof window !== 'undefined') ? (window as any).__favFns as | { toggle: (id: number) => void; has: (id: number) => boolean } | undefined : undefined
  const isFav = (id: number) => (favFns ? favFns.has(id) : false)
  const doToggle = (id: number) => { if (favFns) favFns.toggle(id) }
  const [audioFilename, setAudioFilename] = useState<string | null>(null)
  const [hasAudio, setHasAudio] = useState(false)

  // Normalize text once and decide whether this bubble has any content to render
  const rawText = (message as any).text
  const displayText = typeof rawText === 'string' ? rawText : (rawText == null ? '' : String(rawText))
  const hasText = displayText.trim().length > 0 && displayText.trim() !== '0'

  // Load audio filename asynchronously
  useEffect(() => {
    const loadAudioFilename = async () => {
      console.log(`🔍 Audio check for message ${message.message_id}: showLoveNotes=${showLoveNotes}, is_from_me=${message.is_from_me} (type: ${typeof message.is_from_me}), check=${String(message.is_from_me) === "1"}`)
      if (showLoveNotes && String(message.is_from_me) === "1") {
        try {
          const messageYear = message.year || new Date(message.readable_date).getFullYear()
          const messageId = String(message.message_id)
          console.log(`🎵 Loading audio for message:`, {
            raw_message_id: message.message_id,
            string_message_id: messageId,
            year: messageYear,
            text_preview: message.text?.substring(0, 50)
          })
          // Resolve actual filename from manifest (handles suffixes)
          let resolved = await resolveAudioFilename(messageYear, messageId)
          if (!resolved) {
            // Fallback to time-based resolution using CSV when IDs mismatch
            resolved = await resolveAudioFilenameByTimestamp(messageYear, message.readable_date)
          }
          if (resolved) {
            console.log(`✅ Audio file resolved: ${resolved}`)
            setAudioFilename(resolved)
            setHasAudio(true)
          } else {
            console.log(`❌ No audio for message ${messageId} in ${messageYear}`)
            setAudioFilename(null)
            setHasAudio(false)
          }
        } catch (error) {
          console.error('Error loading audio filename:', error)
          setHasAudio(false)
        }
      } else {
        setHasAudio(false)
      }
    }

    loadAudioFilename()
  }, [message, showLoveNotes])

  // If there is no text and no audio to show, skip rendering this bubble entirely
  if (!hasText && !(showLoveNotes && hasAudio)) {
    return null
  }

  const getCornerClasses = () => {
    if (position === "single") return "rounded-2xl"
    if (position === "first") return isFromMe ? "rounded-2xl rounded-br-md" : "rounded-2xl rounded-bl-md"
    if (position === "last") return isFromMe ? "rounded-2xl rounded-tr-md" : "rounded-2xl rounded-tl-md"
    return isFromMe ? "rounded-2xl rounded-r-md" : "rounded-2xl rounded-l-md"
  }

  const getEmotionTint = () => {
    if (!message.primary_emotion || !message.emotion_confidence || message.emotion_confidence < 0.3) {
      return ""
    }

    const emotion = message.primary_emotion.toLowerCase()
    const confidence = message.emotion_confidence

    // Base colors for different emotions
    const emotionColors = {
      joy: "from-yellow-400 to-orange-400",
      love: "from-pink-400 to-red-400",
      sadness: "from-blue-400 to-indigo-400",
      anger: "from-red-500 to-pink-500",
      fear: "from-purple-400 to-indigo-400",
      surprise: "from-yellow-300 to-orange-300",
      disgust: "from-green-400 to-emerald-400",
      neutral: "from-gray-400 to-gray-500"
    }

    const colorClass = emotionColors[emotion as keyof typeof emotionColors] || emotionColors.neutral
    const opacity = Math.min(confidence * 0.3, 0.3) // Cap opacity at 0.3

    return `bg-gradient-to-r ${colorClass} bg-opacity-${Math.round(opacity * 100)}`
  }

  const hasEmotionData = !!(
    message.primary_emotion &&
    typeof message.emotion_confidence === 'number' &&
    message.emotion_confidence > 0.2
  )
  const isLoveNote = String(message.is_from_me) === "1" && hasAudio

  return (
    <div id={`msg-${message.message_id}`} className={`group relative ${isFromMe ? "ml-auto" : "mr-auto"} max-w-[85%] md:max-w-[70%]`}>
      <div
        className={`
          px-4 py-2 md:px-6 md:py-3 
          ${getCornerClasses()}
          ${isFromMe
            ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white"
            : "bg-gray-700 text-gray-100"
          }
          ${getEmotionTint()}
          shadow-lg
          transition-all duration-200
          hover:shadow-xl
          ${searchMode === "love" && isLoveNote ? "ring-2 ring-pink-400 ring-opacity-50" : ""}
        `}
      >
        {/* Favorite toggle - only show in Love Notes mode and for your messages with audio */}
        {showLoveNotes && isLoveNote && (
          <div className={`absolute ${isFromMe ? 'left-[-28px]' : 'right-[-28px]'} top-0`}>
            <button
              onClick={() => doToggle(Number(message.message_id))}
              className={`text-sm ${isFav(Number(message.message_id)) ? 'text-yellow-400' : 'text-gray-500 hover:text-gray-300'}`}
              title={isFav(Number(message.message_id)) ? 'Unfavorite' : 'Favorite'}
            >
              <Star className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Message Text (avoid rendering numeric 0) */}
        {(() => {
          const raw = (message as any).text
          const displayText = typeof raw === 'string' ? raw : (raw == null ? '' : String(raw))
          const hasText = displayText.trim().length > 0 && displayText.trim() !== '0'
          return hasText ? (
            <div className="text-sm md:text-base leading-relaxed whitespace-pre-wrap">
              {displayText}
            </div>
          ) : null
        })()}

        {/* Audio Control for Love Notes */}
        {showLoveNotes && isLoveNote && audioFilename && (
          <EnhancedMessageAudioControl
            audioFile={audioFilename}
            messageId={String(message.message_id)}
            year={message.year || new Date(message.readable_date).getFullYear()}
          />
        )}
      </div>

      {/* Subtle emotion indicator - only on hover for high confidence */}
      {hasEmotionData && message.primary_emotion !== 'neutral' && (
        <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-gradient-to-r from-pink-400 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
      )}
    </div>
  )
}

function MessageGroup({
  group,
  searchMode,
  showLoveNotes,
  isPlaying,
  onPlay,
  onPause,
  onEnded
}: {
  group: MessageGroup;
  searchMode?: "all" | "year" | "love"
  showLoveNotes?: boolean
  isPlaying?: boolean
  onPlay?: () => void
  onPause?: () => void
  onEnded?: () => void
}) {
  return (
    <div className={`flex flex-col gap-0.5 mb-2 md:mb-4 ${group.isFromMe ? "items-end" : "items-start"}`}>
      {group.messages.map((message, index) => {
        let position: "single" | "first" | "middle" | "last" = "single"

        if (group.messages.length > 1) {
          if (index === 0) position = "first"
          else if (index === group.messages.length - 1) position = "last"
          else position = "middle"
        }

        return (
          <MessageBubble
            key={message.message_id ? `msg-${message.message_id}` : `msg-index-${index}`}
            message={message}
            isFromMe={group.isFromMe}
            position={position}
            searchMode={searchMode}
            showLoveNotes={showLoveNotes}
            isPlaying={isPlaying}
            onPlay={onPlay}
            onPause={onPause}
            onEnded={onEnded}
          />
        )
      })}
      {group.timeString && String(group.timeString).trim() !== '0' && (
        <div className={`text-xs text-gray-400 mt-1 px-2 ${group.isFromMe ? "text-right" : "text-left"}`}>
          {group.timeString}
        </div>
      )}
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
    <div className="flex justify-center my-4 md:my-6">
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
  const [searchMode, setSearchMode] = useState<"all" | "year" | "love">("all")
  const [selectedYear, setSelectedYear] = useState<number | null>(2015)
  const [yearData, setYearData] = useState<YearData[]>([])
  const [messagesExpanded, setMessagesExpanded] = useState(true)
  const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const chipClass =
    "h-9 rounded-md border bg-muted/40 px-3 text-sm hover:bg-muted transition-colors data-[state=on]:bg-primary data-[state=on]:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
  const [selectedMonthsSidebar, setSelectedMonthsSidebar] = useState<string[]>([])

  const scrollToFirstOfMonth = (year: number, month: number) => {
    const target = messages.find((m) => {
      const d = new Date(m.readable_date)
      const y = (m as any).year || d.getFullYear()
      const mo = d.getMonth() + 1
      return y === year && mo === month
    })
    if (target) {
      const el = document.getElementById(`msg-${target.message_id}`)
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }
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
      playfulness: false,
      neutral: false
    }
  })
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([])
  const [showSearchPanel, setShowSearchPanel] = useState(false)
  const [loadingProgress, setLoadingProgress] = useState(0)

  // Love Notes Audio State
  const [showLoveNotes, setShowLoveNotes] = useState(false)
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)
  const [favorites, setFavorites] = useState<Set<number>>(() => {
    if (typeof window === 'undefined') return new Set()
    try { const raw = localStorage.getItem('favorites'); if (!raw) return new Set(); return new Set(JSON.parse(raw) as number[]) } catch { return new Set() }
  })

  const toggleFavorite = useCallback((messageId: number) => {
    setFavorites(prev => {
      const next = new Set(prev)
      if (next.has(messageId)) next.delete(messageId); else next.add(messageId)
      try { localStorage.setItem('favorites', JSON.stringify(Array.from(next))) } catch { }
      return next
    })
  }, [])
  const [showContext, setShowContext] = useState(false)

  // Expose favorites helpers globally for child bubbles (no prop drilling)
  useEffect(() => {
    ; (window as any).__favFns = {
      toggle: (id: number) => toggleFavorite(id),
      has: (id: number) => favorites.has(id),
    }
    return () => { try { delete (window as any).__favFns } catch { } }
  }, [favorites, toggleFavorite])

  // Use global audio state
  const {
    isPlaying,
    currentIndex,
    autoPlay,
    audioFiles,
    setAudioFiles,
    play,
    pause,
    next,
    previous,
    setAutoPlay,
    reset
  } = useAudioStore()

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
    console.log('   Loading state:', loading)
    console.log('   Error state:', error)

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
      playfulness: 0,
      neutral: 0
    }

    let totalMessages = 0
    let messagesWithEmotions = 0
    let neutralCount = 0

    // Only process if we have messages and they're not still loading
    if (messages.length === 0) {
      console.log('🎭 Skipping emotion count - no messages')
      return counts
    }

    if (loading) {
      console.log('🎭 Skipping emotion count - still loading')
      return counts
    }

    // Debug: Check what fields are actually available on the first message
    if (messages.length > 0) {
      const firstMsg = messages[0]
      console.log('🎭 First message field check:', {
        message_id: firstMsg.message_id,
        text: firstMsg.text?.substring(0, 30),
        all_keys: Object.keys(firstMsg),
        has_primary_emotion: 'primary_emotion' in firstMsg,
        primary_emotion: firstMsg.primary_emotion,
        emotion_fields: Object.keys(firstMsg).filter(key => key.includes('emotion'))
      })
    }

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
          in_counts: (msg.primary_emotion || '') in counts
        })
      }

      // Use pre-analyzed emotion data if available
      if (msg.primary_emotion) {
        if (msg.primary_emotion === 'neutral') {
          neutralCount++
          // Count neutral as a valid emotion for filtering
          messagesWithEmotions++
        } else if (msg.primary_emotion in counts) {
          counts[msg.primary_emotion as keyof typeof counts]++
          messagesWithEmotions++
        } else {
          console.log(`⚠️ Unknown emotion: ${msg.primary_emotion}`)
          // Count unknown emotions too
          messagesWithEmotions++
        }
      } else {
        console.log(`⚠️ No primary_emotion for message ${msg.message_id}`)
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

    // Show sample of actual emotion data
    const sampleEmotional = messages.find(msg => msg.primary_emotion && msg.primary_emotion !== 'neutral')
    if (sampleEmotional) {
      console.log(`   Sample emotional message:`, {
        id: sampleEmotional.message_id,
        text: sampleEmotional.text?.substring(0, 50),
        primary_emotion: sampleEmotional.primary_emotion,
        emotion_confidence: sampleEmotional.emotion_confidence
      })
    }

    console.log(`   Emotion counts:`, counts)
    console.log(`   Counts object keys:`, Object.keys(counts))
    console.log(`   Sample counts:`, {
      love: counts.love,
      joy: counts.joy,
      relief: counts.relief,
      neutral: neutralCount
    })

    console.log('🎭 Final emotion counts:', counts)
    console.log('🎭 Summary:', {
      totalMessages,
      messagesWithEmotions,
      neutralCount,
      nonNeutralCount: messagesWithEmotions - neutralCount
    })
    return counts
  }, [messages, loading])

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
      .sort(([, a], [, b]) => b - a)
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

        // Start the loading animation
        setTimeout(() => setLoadingProgress(1), 500)
        setTimeout(() => setLoadingProgress(2), 1500)
        setTimeout(() => setLoadingProgress(3), 2500)
        setTimeout(() => setLoadingProgress(4), 3500)
        setTimeout(() => setLoadingProgress(5), 4500)
        setTimeout(() => setLoadingProgress(6), 5500)
        setTimeout(() => setLoadingProgress(7), 6500)

        // Check if Supabase is properly configured
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
          throw new Error("Supabase environment variables are not configured. Please check your .env file or Vercel environment variables.")
        }

        // Get exact count from database
        const { count: exactCount, error: countError } = await supabase
          .from(TABLE_NAME)
          .select("*", { count: "exact", head: true })

        if (countError) {
          console.error("Count query error:", countError)
          // Check if it's a DNS/connection error
          if (countError.message?.includes('ENOTFOUND') || countError.message?.includes('getaddrinfo')) {
            throw new Error(`Database connection failed: Unable to reach Supabase server. This usually means:
1. The Supabase project has been deleted or suspended
2. The project URL is incorrect  
3. There's a network connectivity issue

Please check your Supabase dashboard and verify the project URL in your environment variables.`)
          }
          throw countError
        }

        console.log("✅ Total messages in database:", exactCount)

        // Fetch all messages with pagination to handle large datasets
        const startTime = Date.now()

        let allData: any[] = []
        let hasMore = true
        let page = 0
        const pageSize = 1000

        while (hasMore) {
          console.log(`Fetching page ${page + 1} (${pageSize} records)...`)
          const { data: pageData, error: fetchError } = await supabase
            .from(TABLE_NAME)
            .select('message_id, text, readable_date, is_from_me, sender, recipient, has_attachments, attachments_info, emojis, links, service, account, contact_id, date, date_read, guid, primary_emotion, emotion_confidence, secondary_emotions, emotion_intensity, emotion_context, emotion_triggers, relationship_impact')
            .order("readable_date", { ascending: true })
            .range(page * pageSize, (page + 1) * pageSize - 1)

          if (fetchError) {
            console.error("❌ Page fetch error:", fetchError)
            throw fetchError
          }

          if (pageData && pageData.length > 0) {
            allData = allData.concat(pageData)
            console.log(`✅ Page ${page + 1} loaded: ${pageData.length} records`)
            page++
          } else {
            hasMore = false
          }

          // Safety check to prevent infinite loops
          if (page > 50) {
            console.warn("⚠️ Stopping pagination after 50 pages to prevent infinite loop")
            hasMore = false
          }
        }

        const data = allData
        const queryTime = Date.now() - startTime
        console.log(`✅ Main query completed in ${queryTime}ms`)

        if (!data || data.length === 0) {
          setError("No messages found in the database")
          return
        }

        console.log("✅ Raw data received:", data.length, "messages")

        // Debug: Check first few messages with their IDs
        console.log("🔍 First 5 messages with IDs:", data.slice(0, 5).map((msg: any) => ({
          message_id: msg.message_id,
          text: msg.text?.substring(0, 30),
          is_from_me: msg.is_from_me,
          date: msg.readable_date
        })))

        // Check if we have the specific audio messages
        const audioMessageIds = [176274, 176305, 176307, 176312, 176322]
        const foundAudioMessages = data.filter((msg: any) => audioMessageIds.includes(msg.message_id))
        console.log(`🎵 Found ${foundAudioMessages.length} messages with audio files out of ${audioMessageIds.length} expected`)
        if (foundAudioMessages.length > 0) {
          console.log("🎵 Audio messages found:", foundAudioMessages.map((msg: any) => ({
            id: msg.message_id,
            date: msg.readable_date,
            text: msg.text?.substring(0, 30)
          })))
        }

        // Process messages
        const normalizedMessages: Message[] = []
        let processingErrors = 0

        data.forEach((msg: any, index: number) => {
          try {
            // Use optimized date parsing
            const { date: messageDate, year, isValid: isValidDate } = parseMessageDate(msg.readable_date)

            if (isValidDate) {
              normalizedMessages.push({
                // Normalize text to avoid stray numeric zeros
                text: ((): string => {
                  const raw = (msg as any).text
                  if (raw === 0 || raw === "0") return ""
                  if (raw == null) return ""
                  return String(raw)
                })(),
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
                message_id: msg.message_id, // Always use actual message_id from database
                date: messageDate.toISOString(),
                message_type: msg.has_attachments && msg.has_attachments !== "0" ? "image" : "text",
                year: year,
                month: messageDate.getMonth() + 1,
                day: messageDate.getDate(),
                // Emotion analysis fields
                primary_emotion: msg.primary_emotion,
                emotion_confidence: msg.emotion_confidence,
                secondary_emotions: msg.secondary_emotions,
                emotion_intensity: msg.emotion_intensity,
                emotion_context: msg.emotion_context,
                emotion_triggers: msg.emotion_triggers,
                relationship_impact: msg.relationship_impact,
              })
            } else {
              console.log(`⚠️ Skipping message with invalid date: ${msg.readable_date}`)
            }
          } catch (e) {
            processingErrors++
            console.log(`⚠️ Processing error at index ${index}:`, e)
          }
        })

        // Calculate year distribution
        const finalYearCounts: { [year: number]: number } = {}
        normalizedMessages.forEach((msg) => {
          const year = new Date(msg.date || '').getFullYear()
          finalYearCounts[year] = (finalYearCounts[year] || 0) + 1
        })

        console.log("✅ Processing complete:")
        console.log("- Total processed messages:", normalizedMessages.length)
        console.log("- Year distribution:", finalYearCounts)

        setMessages(normalizedMessages)

        const years = Object.keys(finalYearCounts)
          .map((year) => Number.parseInt(year))
          .sort((a, b) => a - b)
          .map((year) => ({
            year,
            count: finalYearCounts[year],
            isExpanded: false,
          }))

        setYearData(years)
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

    // Love notes filter
    if (searchMode === "love") {
      // Load selected love notes from localStorage
      const selectedLoveNotes = localStorage.getItem('selectedLoveNotes')
      if (selectedLoveNotes) {
        try {
          const loveNotes = JSON.parse(selectedLoveNotes)
          const loveNoteIds = new Set(loveNotes.map((note: any) => note.message_id))
          filtered = filtered.filter((msg) => loveNoteIds.has(msg.message_id))
        } catch (error) {
          console.error('Error parsing love notes:', error)
          // If no love notes are selected, show a message
          filtered = []
        }
      } else {
        // If no love notes are selected, show a message
        filtered = []
      }
    }

    // Love Notes mode - show only David's messages (we'll filter for audio files separately)
    if (showLoveNotes) {
      filtered = filtered.filter((msg) => {
        // Only David's messages (is_from_me === "1")
        const isFromDavid = String(msg.is_from_me) === "1"
        return isFromDavid
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
          // Check primary emotion (include low confidence matches)
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

    // Favorites filter (applies to any mode when active)
    if (showFavoritesOnly) {
      // Favorites should only apply to Love Notes view
      filtered = filtered.filter((msg) => String(msg.is_from_me) === "1" && favorites.has(msg.message_id as unknown as number))
    }
    return filtered
  }, [messages, selectedYear, searchMode, searchQuery, showLoveNotes, showFavoritesOnly, favorites, searchFilters])

  // Separate state for love notes with audio files
  const [loveNotesWithAudio, setLoveNotesWithAudio] = useState<Message[]>([])
  const [isLoadingLoveNotes, setIsLoadingLoveNotes] = useState(false)

  // Load love notes with audio files when showLoveNotes changes
  useEffect(() => {
    if (showLoveNotes) {
      const loadLoveNotesWithAudio = async () => {
        console.log('🎵 Loading love notes with audio files...')
        setIsLoadingLoveNotes(true)

        const davidMessages = filteredMessages.filter(msg => String(msg.is_from_me) === "1")
        console.log(`🎵 Found ${davidMessages.length} David messages to check`)

        if (davidMessages.length === 0) {
          console.log('🎵 No David messages found')
          setLoveNotesWithAudio([])
          setIsLoadingLoveNotes(false)
          return
        }

        try {
          // Prepare messages for batch checking
          const messagesToCheck = davidMessages.map(message => ({
            messageId: String(message.message_id),
            year: message.year || new Date(message.readable_date).getFullYear()
          }))

          // Use the efficient batch checking function
          const audioResults = await checkMultipleAudioFiles(messagesToCheck)

          // Filter messages that have audio files
          const messagesWithAudio = davidMessages.filter(message => {
            const messageId = String(message.message_id)
            return audioResults.get(messageId) || false
          })

          console.log(`🎵 Found ${messagesWithAudio.length} messages with audio files`)
          setLoveNotesWithAudio(messagesWithAudio)
        } catch (error) {
          console.error('🎵 Error loading love notes with audio:', error)
          setLoveNotesWithAudio([])
        } finally {
          setIsLoadingLoveNotes(false)
        }
      }

      loadLoveNotesWithAudio()
    } else {
      setLoveNotesWithAudio([])
      setIsLoadingLoveNotes(false)
    }
  }, [filteredMessages, showLoveNotes])

  // Use loveNotesWithAudio when showLoveNotes is true
  const finalFilteredMessages = showLoveNotes ? loveNotesWithAudio : filteredMessages

  // Optimized message grouping with memoization
  const messageGroups = useMemo(() => groupMessagesByTime(finalFilteredMessages), [finalFilteredMessages])

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
    const timeoutId = setTimeout(() => { }, 300)
    return searchQuery
  }, [searchQuery])

  // Virtual scrolling optimization: Limit displayed items for large datasets
  const displayLimit = 1000 // Show max 1000 messages at once for performance
  const limitedGroupedByDay = useMemo(() => {
    if (groupedByDay.length <= displayLimit) return groupedByDay

    // For large datasets, show most recent days first
    return groupedByDay.slice(-displayLimit)
  }, [groupedByDay, displayLimit])

  // Keep month chips in sync with the first visible day on scroll
  useEffect(() => {
    const onScroll = () => {
      const containers = document.querySelectorAll('[data-day-key]') as NodeListOf<HTMLElement>
      let first: HTMLElement | null = null
      for (const el of Array.from(containers)) {
        const rect = el.getBoundingClientRect()
        if (rect.top >= 64) { first = el; break }
      }
      if (!first) return
      const key = first.dataset.dayKey
      if (!key) return
      const d = new Date(key)
      if (Number.isNaN(d.getTime())) return
      const y = d.getFullYear(); const m = d.getMonth()
      if (selectedYear === y) {
        const label = MONTH_LABELS[m]
        if (label && (selectedMonthsSidebar.length === 0 || selectedMonthsSidebar[selectedMonthsSidebar.length - 1] !== label)) {
          setSelectedMonthsSidebar((prev) => {
            if (prev.includes(label)) return prev
            return [...prev, label]
          })
        }
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true } as any)
    return () => window.removeEventListener('scroll', onScroll)
  }, [selectedYear, selectedMonthsSidebar, MONTH_LABELS])

  const selectYear = (year: number | null) => {
    setSelectedYear(year)
    setSidebarOpen(false)
  }

  // Love Notes Audio Functions
  // Note: Using imported getAudioFilename from @/lib/audio-file-manager

  // Check using manifest (no HEAD request)
  const checkAudioFileExists = useCallback(async (message: Message) => {
    if (String(message.is_from_me) !== "1") return false
    const messageYear = message.year || new Date(message.readable_date).getFullYear()
    const messageId = String(message.message_id)
    const filename = `david-${messageYear}-love-note-${messageId}.mp3`
    const set = await getAudioFilenameSet()
    return set.has(filename)
  }, [])

  const handlePlayAll = () => {
    if (currentAudioFiles.length > 0) {
      setAudioFiles(currentAudioFiles)
      play(currentAudioFiles[0], 0)
      setAutoPlay(true)
    }
  }

  const handleStop = () => {
    pause()
    setAutoPlay(false)
  }

  const handleAudioIndexChange = (index: number) => {
    if (currentAudioFiles[index]) {
      play(currentAudioFiles[index], index)
    }
  }

  const handleAutoPlayToggle = () => {
    setAutoPlay(!autoPlay)
  }

  // Generate audio files list for current filtered messages
  const [currentAudioFiles, setCurrentAudioFiles] = useState<string[]>([])

  // Async effect to load audio files
  useEffect(() => {
    const loadAudioFiles = async () => {
      if (!showLoveNotes) { setCurrentAudioFiles([]); return }
      const set = await getAudioFilenameSet()
      const files: string[] = []
      for (const message of finalFilteredMessages) {
        if (String(message.is_from_me) !== "1") continue
        const y = message.year || new Date(message.readable_date).getFullYear()
        const id = String(message.message_id)
        let resolved = await resolveAudioFilename(y, id)
        if (!resolved) {
          resolved = await resolveAudioFilenameByTimestamp(y, message.readable_date)
        }
        if (resolved) files.push(resolved)
      }
      setCurrentAudioFiles(files)
    }
    loadAudioFiles()
  }, [finalFilteredMessages, showLoveNotes])

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
        <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl">
          <h2 className="text-red-400 font-semibold mb-4 text-xl">Connection Error</h2>
          <div className="text-gray-300 mb-6 space-y-2">
            <p className="whitespace-pre-line">{error}</p>
          </div>
          <div className="text-xs text-gray-400 mb-6 p-3 bg-gray-700 rounded">
            <p><strong>Table:</strong> {TABLE_NAME}</p>
            <p><strong>Environment:</strong> {process.env.NODE_ENV}</p>
            <p><strong>Supabase URL:</strong> {process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Configured' : 'Missing'}</p>
            <p><strong>Supabase Key:</strong> {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Configured' : 'Missing'}</p>
          </div>
          <div className="flex gap-3">
            <Button onClick={() => window.location.reload()} className="flex-1 bg-blue-600 hover:bg-blue-700">
              Try Again
            </Button>
            <Button
              onClick={() => window.open('https://supabase.com/dashboard', '_blank')}
              className="flex-1 bg-gray-600 hover:bg-gray-700"
            >
              Supabase Dashboard
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-3">
        <div className="flex items-center gap-3">
          {/* Mobile Menu Button - Only show on mobile */}
          <Button
            size="sm"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="bg-gray-700 hover:bg-gray-600 rounded-lg p-2 md:hidden"
          >
            <Menu className="h-4 w-4" />
          </Button>

          {/* Search Bar */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search messages..."
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

          {/* Emotion Filters Toggle */}
          <Button
            size="sm"
            onClick={() => setShowSearchPanel(!showSearchPanel)}
            className={`rounded-lg p-2 ${showSearchPanel ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-600 hover:bg-gray-700"}`}
            title="Emotion Filters"
          >
            🎭
          </Button>
        </div>
      </div>

      {/* Compact Emotion Filters Panel */}
      {showSearchPanel && (
        <div className="bg-blue-900 border-b border-blue-700 p-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-blue-200 font-semibold text-sm">🎭 Emotions</h3>
            <button
              onClick={() => setSearchFilters({
                sender: "",
                dateRange: "",
                hasAttachments: false,
                hasLinks: false,
                hasEmojis: false,
                emotions: {
                  love: false, joy: false, sweet: false, support: false,
                  celebration: false, deepTalks: false, fights: false,
                  anxiety: false, excitement: false, sadness: false,
                  gratitude: false, sexiness: false, flirtation: false,
                  intimacy: false, jealousy: false, nostalgia: false,
                  surprise: false, confusion: false, relief: false,
                  longing: false, playfulness: false, neutral: false
                }
              })}
              className="text-xs text-blue-300 hover:text-blue-200"
            >
              Clear
            </button>
          </div>

          <div className="grid grid-cols-6 gap-1">
            <button
              onClick={() => setSearchFilters(prev => ({
                ...prev,
                emotions: { ...prev.emotions, love: !prev.emotions.love }
              }))}
              className={`px-2 py-1 rounded text-xs font-medium transition-all duration-200 ${searchFilters.emotions.love
                ? "bg-red-500 text-white"
                : "bg-gray-600 text-gray-300 hover:bg-gray-500"
                }`}
              title={`Love: ${emotionCounts.love} messages`}
            >
              ❤️ {emotionCounts.love}
            </button>
            <button
              onClick={() => setSearchFilters(prev => ({
                ...prev,
                emotions: { ...prev.emotions, joy: !prev.emotions.joy }
              }))}
              className={`px-2 py-1 rounded text-xs font-medium transition-all duration-200 ${searchFilters.emotions.joy
                ? "bg-yellow-500 text-white"
                : "bg-gray-600 text-gray-300 hover:bg-gray-500"
                }`}
              title={`Joy: ${emotionCounts.joy} messages`}
            >
              😂 {emotionCounts.joy}
            </button>
            <button
              onClick={() => setSearchFilters(prev => ({
                ...prev,
                emotions: { ...prev.emotions, sweet: !prev.emotions.sweet }
              }))}
              className={`px-2 py-1 rounded text-xs font-medium transition-all duration-200 ${searchFilters.emotions.sweet
                ? "bg-pink-500 text-white"
                : "bg-gray-600 text-gray-300 hover:bg-gray-500"
                }`}
              title={`Sweet: ${emotionCounts.sweet} messages`}
            >
              🥰 {emotionCounts.sweet}
            </button>
            <button
              onClick={() => setSearchFilters(prev => ({
                ...prev,
                emotions: { ...prev.emotions, support: !prev.emotions.support }
              }))}
              className={`px-2 py-1 rounded text-xs font-medium transition-all duration-200 ${searchFilters.emotions.support
                ? "bg-blue-500 text-white"
                : "bg-gray-600 text-gray-300 hover:bg-gray-500"
                }`}
              title={`Support: ${emotionCounts.support} messages`}
            >
              😢 {emotionCounts.support}
            </button>
            <button
              onClick={() => setSearchFilters(prev => ({
                ...prev,
                emotions: { ...prev.emotions, celebration: !prev.emotions.celebration }
              }))}
              className={`px-2 py-1 rounded text-xs font-medium transition-all duration-200 ${searchFilters.emotions.celebration
                ? "bg-purple-500 text-white"
                : "bg-gray-600 text-gray-300 hover:bg-gray-500"
                }`}
              title={`Celebration: ${emotionCounts.celebration} messages`}
            >
              🎉 {emotionCounts.celebration}
            </button>
            <button
              onClick={() => setSearchFilters(prev => ({
                ...prev,
                emotions: { ...prev.emotions, deepTalks: !prev.emotions.deepTalks }
              }))}
              className={`px-2 py-1 rounded text-xs font-medium transition-all duration-200 ${searchFilters.emotions.deepTalks
                ? "bg-indigo-500 text-white"
                : "bg-gray-600 text-gray-300 hover:bg-gray-500"
                }`}
              title={`Deep Talks: ${emotionCounts.deepTalks} messages`}
            >
              💭 {emotionCounts.deepTalks}
            </button>
            <button
              onClick={() => setSearchFilters(prev => ({
                ...prev,
                emotions: { ...prev.emotions, fights: !prev.emotions.fights }
              }))}
              className={`px-2 py-1 rounded text-xs font-medium transition-all duration-200 ${searchFilters.emotions.fights
                ? "bg-red-600 text-white"
                : "bg-gray-600 text-gray-300 hover:bg-gray-500"
                }`}
              title={`Fights: ${emotionCounts.fights} messages`}
            >
              😠 {emotionCounts.fights}
            </button>
            <button
              onClick={() => setSearchFilters(prev => ({
                ...prev,
                emotions: { ...prev.emotions, anxiety: !prev.emotions.anxiety }
              }))}
              className={`px-2 py-1 rounded text-xs font-medium transition-all duration-200 ${searchFilters.emotions.anxiety
                ? "bg-orange-600 text-white"
                : "bg-gray-600 text-gray-300 hover:bg-gray-500"
                }`}
              title={`Anxiety: ${emotionCounts.anxiety} messages`}
            >
              😰 {emotionCounts.anxiety}
            </button>
            <button
              onClick={() => setSearchFilters(prev => ({
                ...prev,
                emotions: { ...prev.emotions, excitement: !prev.emotions.excitement }
              }))}
              className={`px-2 py-1 rounded text-xs font-medium transition-all duration-200 ${searchFilters.emotions.excitement
                ? "bg-yellow-600 text-white"
                : "bg-gray-600 text-gray-300 hover:bg-gray-500"
                }`}
              title={`Excitement: ${emotionCounts.excitement} messages`}
            >
              🎉 {emotionCounts.excitement}
            </button>
            <button
              onClick={() => setSearchFilters(prev => ({
                ...prev,
                emotions: { ...prev.emotions, sadness: !prev.emotions.sadness }
              }))}
              className={`px-2 py-1 rounded text-xs font-medium transition-all duration-200 ${searchFilters.emotions.sadness
                ? "bg-blue-600 text-white"
                : "bg-gray-600 text-gray-300 hover:bg-gray-500"
                }`}
              title={`Sadness: ${emotionCounts.sadness} messages`}
            >
              😢 {emotionCounts.sadness}
            </button>
            <button
              onClick={() => setSearchFilters(prev => ({
                ...prev,
                emotions: { ...prev.emotions, gratitude: !prev.emotions.gratitude }
              }))}
              className={`px-2 py-1 rounded text-xs font-medium transition-all duration-200 ${searchFilters.emotions.gratitude
                ? "bg-green-600 text-white"
                : "bg-gray-600 text-gray-300 hover:bg-gray-500"
                }`}
              title={`Gratitude: ${emotionCounts.gratitude} messages`}
            >
              🙏 {emotionCounts.gratitude}
            </button>
            <button
              onClick={() => setSearchFilters(prev => ({
                ...prev,
                emotions: { ...prev.emotions, sexiness: !prev.emotions.sexiness }
              }))}
              className={`px-2 py-1 rounded text-xs font-medium transition-all duration-200 ${searchFilters.emotions.sexiness
                ? "bg-pink-600 text-white"
                : "bg-gray-600 text-gray-300 hover:bg-gray-500"
                }`}
              title={`Sexiness: ${emotionCounts.sexiness} messages`}
            >
              🔥 {emotionCounts.sexiness}
            </button>
            <button
              onClick={() => setSearchFilters(prev => ({
                ...prev,
                emotions: { ...prev.emotions, flirtation: !prev.emotions.flirtation }
              }))}
              className={`px-2 py-1 rounded text-xs font-medium transition-all duration-200 ${searchFilters.emotions.flirtation
                ? "bg-purple-600 text-white"
                : "bg-gray-600 text-gray-300 hover:bg-gray-500"
                }`}
              title={`Flirtation: ${emotionCounts.flirtation} messages`}
            >
              😉 {emotionCounts.flirtation}
            </button>
            <button
              onClick={() => setSearchFilters(prev => ({
                ...prev,
                emotions: { ...prev.emotions, intimacy: !prev.emotions.intimacy }
              }))}
              className={`px-2 py-1 rounded text-xs font-medium transition-all duration-200 ${searchFilters.emotions.intimacy
                ? "bg-red-600 text-white"
                : "bg-gray-600 text-gray-300 hover:bg-gray-500"
                }`}
              title={`Intimacy: ${emotionCounts.intimacy} messages`}
            >
              💕 {emotionCounts.intimacy}
            </button>
            <button
              onClick={() => setSearchFilters(prev => ({
                ...prev,
                emotions: { ...prev.emotions, jealousy: !prev.emotions.jealousy }
              }))}
              className={`px-2 py-1 rounded text-xs font-medium transition-all duration-200 ${searchFilters.emotions.jealousy
                ? "bg-yellow-600 text-white"
                : "bg-gray-600 text-gray-300 hover:bg-gray-500"
                }`}
              title={`Jealousy: ${emotionCounts.jealousy} messages`}
            >
              😤 {emotionCounts.jealousy}
            </button>
            <button
              onClick={() => setSearchFilters(prev => ({
                ...prev,
                emotions: { ...prev.emotions, nostalgia: !prev.emotions.nostalgia }
              }))}
              className={`px-2 py-1 rounded text-xs font-medium transition-all duration-200 ${searchFilters.emotions.nostalgia
                ? "bg-teal-600 text-white"
                : "bg-gray-600 text-gray-300 hover:bg-gray-500"
                }`}
              title={`Nostalgia: ${emotionCounts.nostalgia} messages`}
            >
              😌 {emotionCounts.nostalgia}
            </button>
            <button
              onClick={() => setSearchFilters(prev => ({
                ...prev,
                emotions: { ...prev.emotions, surprise: !prev.emotions.surprise }
              }))}
              className={`px-2 py-1 rounded text-xs font-medium transition-all duration-200 ${searchFilters.emotions.surprise
                ? "bg-orange-600 text-white"
                : "bg-gray-600 text-gray-300 hover:bg-gray-500"
                }`}
              title={`Surprise: ${emotionCounts.surprise} messages`}
            >
              😲 {emotionCounts.surprise}
            </button>
            <button
              onClick={() => setSearchFilters(prev => ({
                ...prev,
                emotions: { ...prev.emotions, confusion: !prev.emotions.confusion }
              }))}
              className={`px-2 py-1 rounded text-xs font-medium transition-all duration-200 ${searchFilters.emotions.confusion
                ? "bg-gray-500 text-white"
                : "bg-gray-600 text-gray-300 hover:bg-gray-500"
                }`}
              title={`Confusion: ${emotionCounts.confusion} messages`}
            >
              🤔 {emotionCounts.confusion}
            </button>
            <button
              onClick={() => setSearchFilters(prev => ({
                ...prev,
                emotions: { ...prev.emotions, relief: !prev.emotions.relief }
              }))}
              className={`px-2 py-1 rounded text-xs font-medium transition-all duration-200 ${searchFilters.emotions.relief
                ? "bg-green-500 text-white"
                : "bg-gray-600 text-gray-300 hover:bg-gray-500"
                }`}
              title={`Relief: ${emotionCounts.relief} messages`}
            >
              😌 {emotionCounts.relief}
            </button>
            <button
              onClick={() => setSearchFilters(prev => ({
                ...prev,
                emotions: { ...prev.emotions, longing: !prev.emotions.longing }
              }))}
              className={`px-2 py-1 rounded text-xs font-medium transition-all duration-200 ${searchFilters.emotions.longing
                ? "bg-purple-500 text-white"
                : "bg-gray-600 text-gray-300 hover:bg-gray-500"
                }`}
              title={`Longing: ${emotionCounts.longing} messages`}
            >
              💔 {emotionCounts.longing}
            </button>
            <button
              onClick={() => setSearchFilters(prev => ({
                ...prev,
                emotions: { ...prev.emotions, playfulness: !prev.emotions.playfulness }
              }))}
              className={`px-2 py-1 rounded text-xs font-medium transition-all duration-200 ${searchFilters.emotions.playfulness
                ? "bg-cyan-600 text-white"
                : "bg-gray-600 text-gray-300 hover:bg-gray-500"
                }`}
              title={`Playfulness: ${emotionCounts.playfulness} messages`}
            >
              😄 {emotionCounts.playfulness}
            </button>
            <button
              onClick={() => setSearchFilters(prev => ({
                ...prev,
                emotions: { ...prev.emotions, neutral: !prev.emotions.neutral }
              }))}
              className={`px-2 py-1 rounded text-xs font-medium transition-all duration-200 ${searchFilters.emotions.neutral
                ? "bg-gray-500 text-white"
                : "bg-gray-600 text-gray-300 hover:bg-gray-500"
                }`}
              title={`Neutral: ${emotionCounts.neutral} messages`}
            >
              😐 {emotionCounts.neutral}
            </button>
          </div>
        </div>
      )}

      {/* Desktop Layout */}
      <div className="flex h-[calc(100vh-64px)]">
        {/* Desktop Sidebar - Always visible on desktop */}
        <div className="hidden md:block w-80 bg-gray-800 border-r border-gray-700 p-4 overflow-y-auto">
          {/* Section: Messages */}
          <h2 className="text-lg font-semibold mb-4">Messages</h2>

          {/* Section: Search */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-300 mb-3">Search</h3>
            <ToggleGroup type="single" value={showLoveNotes ? 'love' : 'all'} onValueChange={(v) => {
              if (!v) return; if (v === 'love') setShowLoveNotes(true); else setShowLoveNotes(false)
            }} className="grid grid-cols-1 gap-2">
              <ToggleGroupItem value="all" aria-label="All Messages" className={`justify-start ${chipClass}`}>
                <span className="mr-2">🌍</span> All Messages
              </ToggleGroupItem>
              <ToggleGroupItem value="love" aria-label="Love Notes" className={`justify-start ${chipClass}`}>
                <Heart className="h-4 w-4 mr-2" /> Love Notes
              </ToggleGroupItem>
            </ToggleGroup>

            {/* Favorites Toggle */}
            <div className="mt-3">
              <ToggleGroup type="single" value={showFavoritesOnly ? 'fav' : 'any'} onValueChange={(v) => { if (!v) return; setShowFavoritesOnly(v === 'fav') }} className="grid grid-cols-1 gap-2" disabled={!showLoveNotes}>
                <ToggleGroupItem value="any" className={`justify-start ${chipClass}`}>
                  <span className="mr-2">⭐️</span> Any
                </ToggleGroupItem>
                <ToggleGroupItem value="fav" className={`justify-start ${chipClass}`}>
                  <Star className="h-4 w-4 mr-2" /> Favorites
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          </div>

          {/* Section: Year & Month Filter */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-300 mb-3">Year Filter</h3>
            <ToggleGroup type="single" value={selectedYear?.toString() ?? 'all'} onValueChange={(v) => {
              if (!v) return; if (v === 'all') selectYear(null); else selectYear(parseInt(v))
            }} className="grid grid-cols-3 gap-2 mb-3">
              <ToggleGroupItem value={'all'} aria-label="All Years" className={chipClass}>All</ToggleGroupItem>
              {yearData.map((y) => (
                <ToggleGroupItem key={y.year} value={String(y.year)} className={chipClass}>{y.year}</ToggleGroupItem>
              ))}
            </ToggleGroup>

            {selectedYear && (
              <>
                <p className="text-xs text-gray-400 mb-2">Months</p>
                <ToggleGroup type="multiple" value={selectedMonthsSidebar} onValueChange={(vals) => {
                  setSelectedMonthsSidebar(vals)
                  if (vals.length > 0 && selectedYear) {
                    const latest = vals[vals.length - 1]
                    const month = MONTH_LABELS.indexOf(latest) + 1
                    if (month > 0) scrollToFirstOfMonth(selectedYear, month)
                  }
                }} className="grid grid-cols-4 gap-2">
                  {MONTH_LABELS.map((label) => (
                    <ToggleGroupItem key={label} value={label} className={chipClass}>{label}</ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto pb-4">
          {limitedGroupedByDay.length === 0 ? (
            <div className="flex items-center justify-center h-64 px-4">
              <div className="text-center">
                <MessageCircle className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400">No messages found</p>
                {searchQuery && (
                  <p className="text-sm text-gray-500 mt-2">Try adjusting your search or filters</p>
                )}
                {showLoveNotes && (
                  <div className="text-sm text-gray-500 mt-2">
                    {isLoadingLoveNotes ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-pink-500"></div>
                        <span>Loading love notes with audio files...</span>
                      </div>
                    ) : (
                      <p>Only messages with audio files are shown.</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="px-4 md:px-8 space-y-4 md:space-y-6">
              {limitedGroupedByDay.map(([dayKey, groups]) => {
                const dayDate = new Date(dayKey)
                return (
                  <div key={dayKey} data-day-key={dayKey}>
                    <DayHeader date={dayDate} />
                    {groups.map((group) => (
                      <MessageGroup
                        key={group.id}
                        group={group}
                        searchMode={searchMode}
                        showLoveNotes={showLoveNotes}
                        isPlaying={isPlaying}
                        onPlay={() => play()}
                        onPause={() => pause()}
                        onEnded={() => {
                          if (autoPlay && currentIndex < currentAudioFiles.length - 1) {
                            next()
                          } else {
                            pause()
                          }
                        }}
                      />
                    ))}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Sticky bottom Love Notes player (mobile & desktop) */}
      {showLoveNotes && audioFiles.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-gray-700 bg-gray-900/95 backdrop-blur supports-[backdrop-filter]:bg-gray-900/75">
          <div className="max-w-6xl mx-auto px-3 py-2">
            <EnhancedLoveNotesAudioPlayer
              audioFiles={audioFiles}
              currentIndex={currentIndex}
              onIndexChange={(idx) => { if (audioFiles[idx]) play(audioFiles[idx], idx) }}
              onPlayAll={() => { if (audioFiles.length > 0) play(audioFiles[0], 0) }}
              onStop={() => { pause(); reset() }}
              isPlaying={isPlaying}
              autoPlay={autoPlay}
              onAutoPlayToggle={() => setAutoPlay(!autoPlay)}
              showStats={false}
            />
          </div>
        </div>
      )}

      {/* Mobile Sidebar - Only on mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 md:hidden">
          <div className="fixed left-0 top-0 h-full w-80 bg-gray-800 border-r border-gray-700 p-4 flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Messages</h2>
              <Button onClick={() => setSidebarOpen(false)} variant="destructive">Close</Button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-6">
              <div>
                <h3 className="text-sm font-medium text-gray-300 mb-3">Search</h3>
                <ToggleGroup type="single" value={showLoveNotes ? 'love' : 'all'} onValueChange={(v) => { if (!v) return; setShowLoveNotes(v === 'love') }} className="grid grid-cols-1 gap-2">
                  <ToggleGroupItem value="all" className="justify-start"><span className="mr-2">🌍</span> All Messages</ToggleGroupItem>
                  <ToggleGroupItem value="love" className="justify-start"><Heart className="h-4 w-4 mr-2" /> Love Notes</ToggleGroupItem>
                </ToggleGroup>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-300 mb-3">Year Filter</h3>
                <ToggleGroup type="single" value={selectedYear?.toString() ?? 'all'} onValueChange={(v) => { if (!v) return; if (v === 'all') selectYear(null); else selectYear(parseInt(v)) }} className="grid grid-cols-3 gap-2 mb-3">
                  <ToggleGroupItem value={'all'} aria-label="All Years">All</ToggleGroupItem>
                  {yearData.map((y) => (
                    <ToggleGroupItem key={y.year} value={String(y.year)}>{y.year}</ToggleGroupItem>
                  ))}
                </ToggleGroup>
                {selectedYear && (
                  <>
                    <p className="text-xs text-gray-400 mb-2">Months</p>
                    <ToggleGroup type="multiple" value={selectedMonthsSidebar} onValueChange={(vals) => { setSelectedMonthsSidebar(vals); if (vals.length > 0 && selectedYear) { const latest = vals[vals.length - 1]; const m = MONTH_LABELS.indexOf(latest) + 1; if (m > 0) scrollToFirstOfMonth(selectedYear, m) } }} className="grid grid-cols-4 gap-2">
                      {MONTH_LABELS.map((label) => (<ToggleGroupItem key={label} value={label}>{label}</ToggleGroupItem>))}
                    </ToggleGroup>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}