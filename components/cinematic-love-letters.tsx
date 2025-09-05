"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { format } from "date-fns"
import { supabase, TABLE_NAME } from "@/lib/supabase"
import {
  Loader2,
  Heart,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Camera,
  Paperclip,
  FastForward,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { emotionallyImpactfulConversations, yearSelector } from "@/data/emotionally-impactful-conversations"

interface Message {
  id: string
  text: string
  date: string
  sender: string
  isSentByDavid: boolean
  timestamp: string
  hasRead: boolean
  readTime?: string
  service: string
  hasAttachment: boolean
  attachmentType?: string
  isLoveMessage: boolean
  emojis?: string[]
}

interface Conversation {
  id: string
  theme: string
  year: number
  description: string
  messages: Message[]
  messageIds: number[]
}

type Phase = "loading" | "intro" | "sms" | "transforming" | "letter" | "complete"

const TRANSFORMATION_DURATION = 3000
const SMS_MESSAGE_DELAY = 400
const TYPING_DURATION = 300

export default function CinematicLoveLetters() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [currentConversationIndex, setCurrentConversationIndex] = useState(0)
  const [phase, setPhase] = useState<Phase>("loading")
  const [visibleMessageCount, setVisibleMessageCount] = useState(0)
  const [showTyping, setShowTyping] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [showControls, setShowControls] = useState(true)
  const [playbackSpeed, setPlaybackSpeed] = useState(1)
  const [isPlaying, setIsPlaying] = useState(false)
  const [navigationMode, setNavigationMode] = useState<"chronological" | "themes" | "random">("chronological")

  const audioContextRef = useRef<AudioContext | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const playSound = useCallback(
    (type: "message" | "transform" | "page") => {
      if (!soundEnabled || !audioContextRef.current) return

      const ctx = audioContextRef.current
      const oscillator = ctx.createOscillator()
      const gainNode = ctx.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(ctx.destination)

      switch (type) {
        case "message":
          oscillator.frequency.setValueAtTime(800, ctx.currentTime)
          oscillator.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.1)
          gainNode.gain.setValueAtTime(0.05, ctx.currentTime)
          gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1)
          oscillator.start(ctx.currentTime)
          oscillator.stop(ctx.currentTime + 0.1)
          break
        case "transform":
          oscillator.frequency.setValueAtTime(200, ctx.currentTime)
          oscillator.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.5)
          gainNode.gain.setValueAtTime(0.03, ctx.currentTime)
          gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5)
          oscillator.start(ctx.currentTime)
          oscillator.stop(ctx.currentTime + 0.5)
          break
        case "page":
          oscillator.frequency.setValueAtTime(150, ctx.currentTime)
          gainNode.gain.setValueAtTime(0.02, ctx.currentTime)
          gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3)
          oscillator.start(ctx.currentTime)
          oscillator.stop(ctx.currentTime + 0.3)
          break
      }
    },
    [soundEnabled],
  )

  // Initialize audio context
  useEffect(() => {
    if (typeof window !== "undefined") {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }, [])

  // Fetch specific conversations based on message IDs
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setLoading(true)
        setError(null)

        // Get all message IDs we need
        const allMessageIds = emotionallyImpactfulConversations.flatMap((conv) => conv.messageIds)

        const { data, error } = await supabase
          .from(TABLE_NAME)
          .select("message_id, date, text, sender, is_from_me")
          .in("message_id", allMessageIds)
          .order("date", { ascending: true })

        if (error) throw error

        // Group messages by conversation
        const processedConversations: Conversation[] = emotionallyImpactfulConversations
          .map((conv) => {
            const conversationMessages =
              data
                ?.filter((msg) => conv.messageIds.includes(msg.message_id))
                .map((msg, index) => {
                  const date = new Date(msg.date)
                  const text = msg.text || ""
                  const isDavid = msg.is_from_me === 1 || msg.is_from_me === "1" || msg.sender === "David"

                  return {
                    id: msg.message_id ? `msg-${msg.message_id}` : `msg-index-${index}`,
                    text,
                    date: msg.date,
                    sender: isDavid ? "David" : "Nitzan",
                    isSentByDavid: isDavid,
                    timestamp: format(date, "h:mm a"),
                    hasRead: true,
                    readTime: format(date, "h:mm a"),
                    service: "iMessage",
                    hasAttachment: /\.(jpg|jpeg|png|gif|heic)/i.test(text) || text.includes("📷"),
                    attachmentType: text.includes("📷") ? "photo" : undefined,
                    isLoveMessage: /love you|❤️|💕|💗|💓|💘|💝|😘|adore|cherish|moon.*back|death.*beyond/i.test(text),
                    emojis:
                      text.match(
                        /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu,
                      ) || [],
                  }
                }) || []

            return {
              id: `conv-${conv.year}-${conv.theme.replace(/\s+/g, "-")}`,
              theme: conv.theme,
              year: conv.year,
              description: conv.description,
              messages: conversationMessages.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
              messageIds: conv.messageIds,
            }
          })
          .filter((conv) => conv.messages.length > 0)

        setConversations(processedConversations)
        setPhase("intro")
      } catch (err: any) {
        console.error("Error fetching conversations:", err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchConversations()
  }, [])

  // Phase management
  useEffect(() => {
    if (!isPlaying || !conversations[currentConversationIndex]) return

    const currentConversation = conversations[currentConversationIndex]

    if (phase === "sms") {
      if (visibleMessageCount < currentConversation.messages.length) {
        // Show typing indicator
        setShowTyping(true)

        const typingTimeout = setTimeout(() => {
          setShowTyping(false)
          playSound("message")
          setVisibleMessageCount((prev) => prev + 1)
        }, TYPING_DURATION / playbackSpeed)

        timeoutRef.current = typingTimeout
        return () => clearTimeout(typingTimeout)
      } else {
        // All messages displayed, pause then transform
        const pauseTimeout = setTimeout(() => {
          setPhase("transforming")
          playSound("transform")

          const transformTimeout = setTimeout(() => {
            setPhase("letter")
          }, TRANSFORMATION_DURATION)

          timeoutRef.current = transformTimeout
        }, 2000)

        timeoutRef.current = pauseTimeout
        return () => clearTimeout(pauseTimeout)
      }
    } else if (phase === "letter") {
      // After viewing letter, move to next conversation
      const nextTimeout = setTimeout(() => {
        if (currentConversationIndex < conversations.length - 1) {
          setCurrentConversationIndex((prev) => prev + 1)
          setVisibleMessageCount(0)
          setPhase("sms")
        } else {
          setPhase("complete")
          setIsPlaying(false)
        }
      }, 4000)

      timeoutRef.current = nextTimeout
      return () => clearTimeout(nextTimeout)
    }
  }, [phase, visibleMessageCount, currentConversationIndex, conversations, isPlaying, playbackSpeed, playSound])

  // Auto-hide controls
  useEffect(() => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current)
    }

    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false)
    }, 3000)

    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current)
      }
    }
  }, [showControls])

  const handleMouseMove = () => {
    setShowControls(true)
  }

  const togglePlayback = useCallback(() => {
    if (phase === "intro") {
      setPhase("sms")
    }
    setIsPlaying((prev) => !prev)
  }, [phase])

  const nextConversation = useCallback(() => {
    if (currentConversationIndex < conversations.length - 1) {
      setCurrentConversationIndex((prev) => prev + 1)
      setVisibleMessageCount(0)
      setPhase("sms")
      playSound("page")
    }
  }, [currentConversationIndex, conversations.length, playSound])

  const previousConversation = useCallback(() => {
    if (currentConversationIndex > 0) {
      setCurrentConversationIndex((prev) => prev - 1)
      setVisibleMessageCount(0)
      setPhase("sms")
      playSound("page")
    }
  }, [currentConversationIndex, playSound])

  const skipToTransformation = useCallback(() => {
    const currentConversation = conversations[currentConversationIndex]
    if (currentConversation && phase === "sms") {
      setVisibleMessageCount(currentConversation.messages.length)
      setPhase("transforming")
      playSound("transform")

      setTimeout(() => {
        setPhase("letter")
      }, TRANSFORMATION_DURATION)
    }
  }, [conversations, currentConversationIndex, phase, playSound])

  const currentConversation = conversations[currentConversationIndex]
  const visibleMessages = currentConversation?.messages.slice(0, visibleMessageCount) || []

  // Get background color based on year and phase
  const getBackgroundStyle = () => {
    if (phase === "loading" || phase === "intro") return { background: "#000000" }
    if (phase === "transforming" || phase === "letter") {
      const yearColor = yearSelector[currentConversation?.year.toString()]?.color || "#FAF8F3"
      return {
        background: `linear-gradient(135deg, ${yearColor}15 0%, #FAF8F3 100%)`,
      }
    }
    return { background: "#000000" }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-white" />
          <h2 className="text-2xl font-serif text-white">Preparing your love story...</h2>
          <p className="text-gray-400 mt-2">Curating 10 years of memories</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center max-w-md">
          <Heart className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-serif text-white mb-4">Something went wrong</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <Button onClick={() => window.location.reload()} className="bg-red-600 hover:bg-red-700">
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  if (phase === "intro") {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0">
          <motion.div
            className="absolute inset-0 opacity-10"
            animate={{
              background: [
                "radial-gradient(circle at 20% 50%, #FF69B4 0%, transparent 50%)",
                "radial-gradient(circle at 80% 50%, #FFB6C1 0%, transparent 50%)",
                "radial-gradient(circle at 50% 20%, #FF1493 0%, transparent 50%)",
                "radial-gradient(circle at 50% 80%, #FF69B4 0%, transparent 50%)",
              ],
            }}
            transition={{ duration: 8, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
          />
        </div>

        <div className="text-center z-10 max-w-2xl px-8">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1 }}>
            <h1 className="text-6xl font-serif text-white mb-4">10 Years</h1>
            <motion.p
              className="text-2xl text-gray-300 mb-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1, duration: 1 }}
            >
              28,000+ Messages
            </motion.p>
            <motion.p
              className="text-3xl text-pink-300 mb-12"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2, duration: 1 }}
            >
              One Love Story
            </motion.p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 3, duration: 0.5 }}
          >
            <Button
              onClick={togglePlayback}
              className="bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 text-white px-12 py-4 text-xl font-serif rounded-full shadow-2xl"
            >
              Begin Our Story
            </Button>
          </motion.div>

          <motion.p
            className="text-gray-500 mt-8 text-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 4, duration: 1 }}
          >
            {conversations.length} carefully chosen moments • David & Nitzan
          </motion.p>
        </div>
      </div>
    )
  }

  if (phase === "complete") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-red-50 flex items-center justify-center">
        <div className="text-center max-w-2xl px-8">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1 }}>
            <Heart className="w-16 h-16 text-red-500 mx-auto mb-8 fill-current" />
            <h1 className="text-4xl font-serif text-gray-800 mb-6">Every message, a love letter.</h1>
            <p className="text-xl text-gray-600 mb-8">Every conversation, our story continues...</p>
            <div className="space-x-4">
              <Button
                onClick={() => {
                  setCurrentConversationIndex(0)
                  setVisibleMessageCount(0)
                  setPhase("intro")
                  setIsPlaying(false)
                }}
                className="bg-red-600 hover:bg-red-700 text-white px-8 py-3"
              >
                Experience Again
              </Button>
              <Button onClick={() => setNavigationMode("random")} variant="outline" className="px-8 py-3">
                Random Moment
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    )
  }

  if (!currentConversation) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-white" />
          <p className="text-white">Loading conversation...</p>
        </div>
      </div>
    )
  }

  return (
    <div
     className="min-h-screen transition-all duration-[3000ms] ease-in-out relative overflow-hidden"
      style={getBackgroundStyle()}
      onMouseMove={handleMouseMove}
      onClick={() => setShowControls(true)}
    >
      {/* Paper texture overlay */}
      <div
       className={`absolute inset-0 transition-opacity duration-[3000ms] ease-in-out ${
          phase === "transforming" || phase === "letter" ? "opacity-20" : "opacity-0"
        }`}
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fillRule='evenodd'%3E%3Cg fill='%23000000' fillOpacity='0.05'%3E%3Ccircle cx='7' cy='7' r='1'/%3E%3Ccircle cx='53' cy='53' r='1'/%3E%3Ccircle cx='13' cy='43' r='1'/%3E%3Ccircle cx='47' cy='17' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* Special background effects for moon and back messages */}
      {currentConversation.theme.includes("Moon") && phase === "letter" && (
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 right-10 w-20 h-20 bg-yellow-200 rounded-full blur-sm" />
          <div className="absolute top-20 right-32 w-2 h-2 bg-yellow-100 rounded-full" />
          <div className="absolute top-32 right-20 w-1 h-1 bg-yellow-100 rounded-full" />
        </div>
      )}

      {/* Main content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <motion.div
          className="text-center py-8"
          initial={{ opacity: 0 }}
          animate={{
            opacity: phase === "transforming" || phase === "letter" ? 1 : 0,
          }}
          transition={{ duration: 2, delay: 1 }}
        >
          <h1 className="font-serif text-3xl text-gray-800 mb-2">{currentConversation.theme}</h1>
          <p className="text-gray-600 text-base mb-1">
            {yearSelector[currentConversation.year.toString()]?.label} • {currentConversation.year}
          </p>
          <p className="text-gray-500 text-sm italic">{currentConversation.description}</p>
          <div className="w-24 h-px bg-gray-400 mx-auto mt-4" />
        </motion.div>

        {/* Messages container */}
        <div className="flex-1 px-4 sm:px-8 lg:px-16 max-w-4xl mx-auto w-full">
          <div className="space-y-3">
            {visibleMessages.map((message, index) => (
              <MessageBubble key={message.id} message={message} phase={phase} delay={index * 50} />
            ))}

            {/* Typing indicator */}
            <AnimatePresence>
              {showTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className={`flex ${
                    currentConversation.messages[visibleMessageCount]?.isSentByDavid ? "justify-start" : "justify-end"
                  }`}
                >
                  <div className="bg-gray-200 rounded-2xl px-4 py-2 max-w-xs">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" />
                      <div
                        className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      />
                      <div
                        className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Controls */}
        <AnimatePresence>
          {showControls && phase !== "intro" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50"
            >
              <Card className="bg-black/80 backdrop-blur-sm border-gray-700 p-4">
                <div className="flex items-center space-x-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={previousConversation}
                    disabled={currentConversationIndex === 0}
                    className="text-white hover:bg-white/20"
                  >
                    <SkipBack className="h-4 w-4" />
                  </Button>

                  <Button variant="ghost" size="icon" onClick={togglePlayback} className="text-white hover:bg-white/20">
                    {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={nextConversation}
                    disabled={currentConversationIndex === conversations.length - 1}
                    className="text-white hover:bg-white/20"
                  >
                    <SkipForward className="h-4 w-4" />
                  </Button>

                  <div className="w-px h-6 bg-gray-600" />

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSoundEnabled((prev) => !prev)}
                    className="text-white hover:bg-white/20"
                  >
                    {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                  </Button>

                  {phase === "sms" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={skipToTransformation}
                      className="text-white hover:bg-white/20"
                    >
                      <FastForward className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Progress indicator */}
        <motion.div
          className="fixed bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2"
          initial={{ opacity: 1 }}
          animate={{ opacity: showControls ? 0 : 1 }}
          transition={{ delay: showControls ? 0 : 3 }}
        >
          {conversations.slice(0, 10).map((conv, index) => (
            <div
              key={conv.id}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentConversationIndex ? "bg-pink-400 w-3 h-3" : "bg-white/30"
              }`}
            />
          ))}
          {conversations.length > 10 && (
            <div className="text-white/50 text-xs ml-2">+{conversations.length - 10} more</div>
          )}
        </motion.div>

        {/* Year indicator */}
        <div className="fixed top-4 right-4 text-right">
          <div className="text-white/70 text-sm font-mono">{currentConversation.year}</div>
          <div className="text-white/50 text-xs">
            {currentConversationIndex + 1} of {conversations.length}
          </div>
        </div>
      </div>
    </div>
  )
}

// Individual message bubble component with proper sender differentiation
interface MessageBubbleProps {
  message: Message
  phase: Phase
  delay: number
}

function MessageBubble({ message, phase, delay }: MessageBubbleProps) {
  const isTransformed = phase === "letter"
  const isTransforming = phase === "transforming"

  const bubbleVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.8 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.3, ease: "easeOut" },
    },
    transforming: {
      filter: "blur(1px)",
      scale: 1.02,
      transition: { duration: 3, ease: "easeInOut" },
    },
    letter: {
      filter: "blur(0px)",
      scale: 1,
      transition: { duration: 3, ease: "easeInOut" },
    },
  }

  return (
    <motion.div
      initial="hidden"
      animate={isTransformed ? "letter" : isTransforming ? "transforming" : "visible"}
      variants={bubbleVariants}
      transition={{ delay: delay / 1000 }}
      className={`flex ${message.isSentByDavid ? "justify-end" : "justify-start"}`}
    >
      <motion.div
       className={`max-w-xs lg:max-w-md relative transition-all duration-[3000ms] ease-in-out ${
          isTransformed ? "bg-transparent" : message.isSentByDavid ? "bg-blue-500" : "bg-gray-200"
        }`}
        style={{
          borderRadius: isTransformed ? "0px" : "18px",
          padding: isTransformed ? "8px 0" : "12px 16px",
          marginLeft: message.isSentByDavid ? "20%" : "0",
          marginRight: message.isSentByDavid ? "0" : "20%",
        }}
        animate={{
          borderRadius: isTransforming || isTransformed ? "0px" : "18px",
          backgroundColor:
            isTransforming || isTransformed ? "transparent" : message.isSentByDavid ? "#007AFF" : "#E5E5EA",
        }}
        transition={{ duration: 3, ease: "easeInOut" }}
      >
        {/* Message text */}
        <motion.p
          className={`transition-all duration-[3000ms] ease-in-out ${
            isTransformed
              ? message.isLoveMessage
                ? "font-serif text-xl text-gray-800 leading-relaxed"
                : "font-serif text-lg text-gray-800 leading-relaxed"
              : message.isSentByDavid
                ? "text-white text-sm"
                : "text-black text-sm"
          }`}
          style={{
            lineHeight: isTransformed ? "1.8" : "1.4",
            fontFamily: isTransformed
              ? message.isLoveMessage
                ? '"Amatic SC", cursive'
                : '"Crimson Pro", serif'
              : '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
            fontSize: isTransformed ? (message.isLoveMessage ? "1.5rem" : "1.125rem") : "0.875rem",
            color: isTransformed
              ? message.isLoveMessage
                ? "#8B4513"
                : "#2D2D2D"
              : message.isSentByDavid
                ? "#FFFFFF"
                : "#000000",
            textAlign: isTransformed ? "left" : "left",
          }}
        >
          {message.text}
        </motion.p>

        {/* Attachments */}
        {message.hasAttachment && (
          <motion.div
            className={`mt-2 flex items-center space-x-1 ${
              isTransformed ? "text-gray-600" : message.isSentByDavid ? "text-blue-100" : "text-gray-500"
            }`}
            animate={{
              opacity: isTransformed ? 0.7 : 1,
            }}
          >
            {message.attachmentType === "photo" ? (
              <>
                <Camera className="h-3 w-3" />
                <span className="text-xs">{isTransformed ? "Enclosed photograph" : "Photo"}</span>
              </>
            ) : (
              <>
                <Paperclip className="h-3 w-3" />
                <span className="text-xs">Attachment</span>
              </>
            )}
          </motion.div>
        )}

        {/* Love message indicator */}
        {message.isLoveMessage && isTransformed && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 2, duration: 1 }}
            className="absolute -top-2 -right-2"
          >
            <Heart className="h-5 w-5 text-red-500 fill-current" />
          </motion.div>
        )}

        {/* Timestamp */}
        <motion.div
          className={`text-xs mt-1 transition-all duration-[3000ms] ease-in-out ${
            isTransformed ? "text-gray-500 font-mono" : message.isSentByDavid ? "text-blue-100" : "text-gray-500"
          }`}
          style={{
            fontFamily: isTransformed ? '"Courier Prime", monospace' : "inherit",
            textAlign: message.isSentByDavid ? "right" : "left",
          }}
        >
          {isTransformed ? `Sent ${message.timestamp}` : message.timestamp}
        </motion.div>

        {/* Read receipt for SMS phase */}
        {message.hasRead && !isTransformed && (
          <motion.div className={`text-xs text-gray-400 mt-1 ${message.isSentByDavid ? "text-right" : "text-left"}`}>
            Read {message.readTime}
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  )
}
