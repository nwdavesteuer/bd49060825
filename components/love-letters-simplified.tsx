"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { format } from "date-fns"
import { supabase, TABLE_NAME } from "@/lib/supabase"
import { Loader2, Heart, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { emotionallyImpactfulConversations } from "@/data/emotionally-impactful-conversations"

interface Message {
  id: string
  text: string
  date: string
  sender: string
  isSentByDavid: boolean
  timestamp: string
  isLoveMessage: boolean
  isMoonMessage: boolean
}

interface Letter {
  id: string
  theme: string
  year: number
  description: string
  date: string
  messages: Message[]
  letterNumber: number
}

export default function LoveLettersSimplified() {
  const [letters, setLetters] = useState<Letter[]>([])
  const [currentLetterIndex, setCurrentLetterIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showIntro, setShowIntro] = useState(true)

  // Test Supabase connection first
  const testConnection = async () => {
    try {
      const { data, error } = await supabase.from(TABLE_NAME).select("count", { count: "exact" }).limit(1)

      if (error) throw error
      return true
    } catch (err: any) {
      console.error("Connection test failed:", err)
      throw new Error(`Connection failed: ${err.message}`)
    }
  }

  // Fetch and process letters
  useEffect(() => {
    const fetchLetters = async () => {
      try {
        setLoading(true)
        setError(null)

        // First test the connection
        await testConnection()

        // Check if we have the required data
        if (!emotionallyImpactfulConversations || emotionallyImpactfulConversations.length === 0) {
          throw new Error("No conversation data available")
        }

        const allMessageIds = emotionallyImpactfulConversations.flatMap((conv) => conv.messageIds)
        console.log(`Looking for ${allMessageIds.length} messages...`)

        const { data, error: supabaseError } = await supabase
          .from(TABLE_NAME)
          .select("message_id, date, text, sender, is_from_me")
          .in("message_id", allMessageIds)
          .order("date", { ascending: true })

        if (supabaseError) {
          console.error("Supabase query error:", supabaseError)
          throw new Error(`Database query failed: ${supabaseError.message}`)
        }

        if (!data || data.length === 0) {
          console.warn("No messages found for the specified IDs")
          throw new Error("No messages found in database for the specified conversations")
        }

        console.log(`Found ${data.length} messages in database`)

        const processedLetters: Letter[] = emotionallyImpactfulConversations
          .map((conv, index) => {
            const letterMessages = data
              .filter((msg) => conv.messageIds.includes(msg.message_id))
              .map((msg) => {
                try {
                  const date = new Date(msg.date)
                  const text = msg.text || ""
                  const isDavid = msg.is_from_me === 1 || msg.is_from_me === "1" || msg.sender === "David"

                  return {
                    id: `msg-${msg.message_id}`,
                    text,
                    date: msg.date,
                    sender: isDavid ? "David" : "Nitzan",
                    isSentByDavid: isDavid,
                    timestamp: format(date, "h:mm a"),
                    isLoveMessage: /love you|❤️|💕|💗|💓|💘|💝|😘|adore|cherish/i.test(text),
                    isMoonMessage: /moon.*back|death.*beyond/i.test(text),
                  }
                } catch (err) {
                  console.error("Error processing message:", msg, err)
                  return null
                }
              })
              .filter((msg): msg is Message => msg !== null)

            const sortedMessages = letterMessages.sort(
              (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
            )

            return {
              id: `letter-${index}`,
              theme: conv.theme,
              year: conv.year,
              description: conv.description || "",
              date: sortedMessages[0]?.date || new Date().toISOString(),
              messages: sortedMessages,
              letterNumber: index + 1,
            }
          })
          .filter((letter) => letter.messages.length > 0)

        console.log(`Created ${processedLetters.length} letters`)

        if (processedLetters.length === 0) {
          throw new Error("No letters could be created from the available data")
        }

        setLetters(processedLetters)
      } catch (err: any) {
        console.error("Error fetching letters:", err)
        setError(err.message || "Failed to load letters")
      } finally {
        setLoading(false)
      }
    }

    fetchLetters()
  }, [])

  const nextLetter = useCallback(() => {
    if (currentLetterIndex < letters.length - 1) {
      setCurrentLetterIndex((prev) => prev + 1)
    }
  }, [currentLetterIndex, letters.length])

  const previousLetter = useCallback(() => {
    if (currentLetterIndex > 0) {
      setCurrentLetterIndex((prev) => prev - 1)
    }
  }, [currentLetterIndex])

  const jumpToYear = useCallback(
    (year: number) => {
      const letterIndex = letters.findIndex((letter) => letter.year === year)
      if (letterIndex !== -1) {
        setCurrentLetterIndex(letterIndex)
      }
    },
    [letters],
  )

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showIntro) return

      switch (e.key) {
        case "ArrowLeft":
          previousLetter()
          break
        case "ArrowRight":
          nextLetter()
          break
        case "Escape":
          setShowIntro(true)
          break
        case "0":
        case "1":
        case "2":
        case "3":
        case "4":
        case "5":
        case "6":
        case "7":
        case "8":
        case "9":
          const year = Number.parseInt(`201${e.key}`)
          jumpToYear(year)
          break
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [showIntro, nextLetter, previousLetter, jumpToYear])

  const startExperience = () => {
    setShowIntro(false)
  }

  // Get current letter safely
  const currentLetter = letters[currentLetterIndex] || null

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-white" />
          <h2 className="text-2xl font-serif text-white">Preparing your messages...</h2>
          <p className="text-gray-400 mt-2">Curating 10 years of love</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md">
          <Heart className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-serif text-white mb-4">Connection Issue</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <div className="space-y-3">
            <Button onClick={() => window.location.reload()} className="bg-red-600 hover:bg-red-700 w-full">
              Try Again
            </Button>
            <p className="text-xs text-gray-500">
              If the issue persists, check that your Supabase project is active and the database contains message data.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (showIntro) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0">
          <motion.div
            className="absolute inset-0 opacity-5"
            animate={{
              background: [
                "radial-gradient(circle at 20% 50%, #007AFF 0%, transparent 50%)",
                "radial-gradient(circle at 80% 50%, #34C759 0%, transparent 50%)",
                "radial-gradient(circle at 50% 20%, #007AFF 0%, transparent 50%)",
                "radial-gradient(circle at 50% 80%, #34C759 0%, transparent 50%)",
              ],
            }}
            transition={{ duration: 10, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
          />
        </div>

        <div className="text-center z-10 max-w-2xl px-8">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1 }}>
            <h1 className="text-6xl font-serif text-white mb-6" style={{ fontFamily: '"Playfair Display", serif' }}>
              Our Messages
            </h1>
            <motion.p
              className="text-2xl text-gray-300 mb-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1, duration: 1 }}
            >
              2015 — 2025
            </motion.p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 2, duration: 0.5 }}
          >
            <Button
              onClick={startExperience}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-12 py-4 text-xl font-serif rounded-2xl shadow-2xl"
              style={{ fontFamily: '"SF Pro Display", -apple-system, BlinkMacSystemFont, sans-serif' }}
            >
              Begin Reading
            </Button>
          </motion.div>

          <motion.p
            className="text-gray-500 mt-8 text-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 3, duration: 1 }}
          >
            {letters.length} conversations • David & Nitzan
          </motion.p>
        </div>
      </div>
    )
  }

  if (!currentLetter) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Heart className="w-16 h-16 text-red-500 mx-auto mb-8 fill-current" />
          <h1 className="text-4xl font-serif text-white mb-6">The End</h1>
          <p className="text-xl text-gray-400 mb-8">Every message, a piece of our story.</p>
          <Button
            onClick={() => {
              setCurrentLetterIndex(0)
              setShowIntro(true)
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-2xl"
          >
            Read Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentLetter.id}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="conversation-container relative max-w-md w-full mx-auto"
          style={{
            minHeight: "80vh",
          }}
        >
          {/* iPhone-style header */}
          <div className="bg-gray-100 rounded-t-3xl px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-semibold">N</span>
                </div>
                <div>
                  <h2
                    className="text-lg font-semibold text-gray-900"
                    style={{ fontFamily: '"SF Pro Display", -apple-system, BlinkMacSystemFont, sans-serif' }}
                  >
                    Nitzan
                  </h2>
                  <p className="text-xs text-gray-500">{currentLetter.theme}</p>
                </div>
              </div>
              <div className="text-right">
                <p
                  className="text-sm text-gray-600"
                  style={{ fontFamily: '"SF Pro Display", -apple-system, BlinkMacSystemFont, sans-serif' }}
                >
                  {format(new Date(currentLetter.date), "MMM d, yyyy")}
                </p>
                <p className="text-xs text-gray-500">{currentLetter.year}</p>
              </div>
            </div>
          </div>

          {/* Messages container with iPhone-style background */}
          <div
            className="bg-white rounded-b-3xl px-4 py-6 min-h-[600px] relative overflow-hidden"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23f8f9fa' fillOpacity='0.4'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z'/%3E%3C/g%3E%3C/svg%3E")`,
            }}
          >
            {/* Messages */}
            <div className="space-y-3">
              {currentLetter.messages.map((message, index) => (
                <MessageBubble key={message.id} message={message} delay={index * 100} />
              ))}
            </div>

            {/* Conversation footer */}
            <motion.div
              className="text-center mt-8 pt-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1, duration: 0.5 }}
            >
              <p
                className="text-xs text-gray-400"
                style={{ fontFamily: '"SF Pro Text", -apple-system, BlinkMacSystemFont, sans-serif' }}
              >
                {currentLetter.description}
              </p>
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation controls */}
      {letters.length > 1 && (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 flex items-center space-x-4">
          <Button
            variant="outline"
            size="icon"
            onClick={previousLetter}
            disabled={currentLetterIndex === 0}
            className="bg-white/90 hover:bg-white border-gray-300 rounded-full"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            onClick={nextLetter}
            disabled={currentLetterIndex === letters.length - 1}
            className="bg-white/90 hover:bg-white border-gray-300 px-4 rounded-full"
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}

      {/* Year indicator */}
      {currentLetter && (
        <div className="fixed top-8 right-8 text-right">
          <div className="bg-black/20 backdrop-blur-sm rounded-full px-3 py-1">
            <div
              className="text-white text-sm font-semibold"
              style={{ fontFamily: '"SF Pro Display", -apple-system, BlinkMacSystemFont, sans-serif' }}
            >
              {currentLetter.year}
            </div>
          </div>
        </div>
      )}

      {/* Progress indicator */}
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-1">
        {letters.slice(0, 10).map((_, index) => (
          <div
            key={index}
            className={`w-2 h-2 rounded-full transition-all ${
              index === currentLetterIndex ? "bg-blue-500 w-3 h-3" : "bg-gray-400"
            }`}
          />
        ))}
        {letters.length > 10 && <div className="text-white text-xs ml-2">+{letters.length - 10} more</div>}
      </div>
    </div>
  )
}

// Individual message bubble component
interface MessageBubbleProps {
  message: Message
  delay: number
}

function MessageBubble({ message, delay }: MessageBubbleProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, delay: delay / 1000, ease: "easeOut" }}
      className={`flex ${message.isSentByDavid ? "justify-end" : "justify-start"} mb-2`}
    >
      <div className="max-w-[85%] flex flex-col">
        <div
          className={`relative px-4 py-3 rounded-3xl shadow-sm ${
            message.isSentByDavid ? "bg-blue-500 text-white rounded-br-lg" : "bg-gray-100 text-gray-900 rounded-bl-lg"
          }`}
          style={{
            boxShadow: message.isSentByDavid ? "0 1px 2px rgba(0, 122, 255, 0.3)" : "0 1px 2px rgba(0, 0, 0, 0.1)",
          }}
        >
          {/* Love message glow effect */}
          {message.isLoveMessage && (
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-pink-400/20 to-red-400/20 animate-pulse" />
          )}

          {/* Moon message starry effect */}
          {message.isMoonMessage && (
            <div className="absolute inset-0 rounded-3xl">
              <div className="absolute top-1 right-2 w-1 h-1 bg-yellow-300 rounded-full opacity-60" />
              <div className="absolute top-3 right-4 w-0.5 h-0.5 bg-yellow-300 rounded-full opacity-40" />
              <div className="absolute bottom-2 right-3 w-0.5 h-0.5 bg-yellow-300 rounded-full opacity-50" />
            </div>
          )}

          <p
            className={`relative z-10 ${message.isLoveMessage ? "font-medium" : ""}`}
            style={{
              fontFamily: message.isLoveMessage
                ? '"Crimson Text", "Georgia", serif'
                : '"SF Pro Text", -apple-system, BlinkMacSystemFont, sans-serif',
              fontSize: message.isLoveMessage ? "16px" : "15px",
              lineHeight: "1.4",
              letterSpacing: message.isLoveMessage ? "0.3px" : "0",
            }}
          >
            {message.text}
          </p>

          {/* Love message heart indicator */}
          {message.isLoveMessage && (
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="absolute -top-1 -right-1"
            >
              <Heart className="h-3 w-3 text-red-500 fill-current drop-shadow-sm" />
            </motion.div>
          )}
        </div>

        {/* Timestamp */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: (delay + 200) / 1000 }}
          className={`mt-1 px-1 ${message.isSentByDavid ? "text-right" : "text-left"}`}
        >
          <span
            className="text-xs text-gray-400"
            style={{ fontFamily: '"SF Pro Text", -apple-system, BlinkMacSystemFont, sans-serif' }}
          >
            {message.timestamp}
          </span>
        </motion.div>
      </div>
    </motion.div>
  )
}
