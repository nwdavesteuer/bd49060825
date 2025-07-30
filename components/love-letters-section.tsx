"use client"

import { useState, useEffect } from "react"
import { Play, Pause, SkipBack, SkipForward, Heart, Star, Moon, Sparkles, ArrowLeft, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { supabase, TABLE_NAME } from "@/lib/supabase"

interface LoveLetterMessage {
  id: string
  text: string
  sender: string
  timestamp: string
  date: string
  is_from_me: boolean
}

interface LoveLetter {
  id: string
  title: string
  date: string
  preview: string
  mood: "romantic" | "playful" | "deep" | "nostalgic"
  emotionalScore: number
  tags: string[]
  messages: LoveLetterMessage[]
}

export default function LoveLettersSection() {
  const [loveLetters, setLoveLetters] = useState<LoveLetter[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedLetter, setSelectedLetter] = useState<LoveLetter | null>(null)
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [showPlayer, setShowPlayer] = useState(false)

  useEffect(() => {
    fetchLoveLetters()
  }, [])

  useEffect(() => {
    let interval: NodeJS.Timeout

    if (isPlaying && selectedLetter && currentMessageIndex < selectedLetter.messages.length - 1) {
      interval = setInterval(() => {
        setCurrentMessageIndex((prev) => {
          if (prev >= selectedLetter.messages.length - 1) {
            setIsPlaying(false)
            return prev
          }
          return prev + 1
        })
      }, 3000) // 3 seconds per message
    }

    return () => clearInterval(interval)
  }, [isPlaying, selectedLetter, currentMessageIndex])

  const fetchLoveLetters = async () => {
    try {
      setLoading(true)
      setError(null)

      // First, check if there's a dedicated love_letters table
      const { data: loveLettersData, error: loveLettersError } = await supabase
        .from("love_letters")
        .select("*")
        .order("emotional_score", { ascending: false })

      if (loveLettersError && loveLettersError.code !== "42P01") {
        // If it's not a "table doesn't exist" error, throw it
        throw loveLettersError
      }

      if (loveLettersData && loveLettersData.length > 0) {
        // Process love letters from dedicated table
        const processedLetters = await Promise.all(
          loveLettersData.map(async (letter) => {
            // Fetch associated messages from the new full dataset
            const messageIds = letter.message_ids || []
            const { data: messagesData, error: messagesError } = await supabase
              .from(TABLE_NAME)
              .select("*")
              .in("message_id", messageIds)
              .order("date", { ascending: true })

            if (messagesError) {
              console.error("Error fetching messages for letter:", letter.id, messagesError)
              return null
            }

            const messages: LoveLetterMessage[] =
              messagesData?.map((msg) => ({
                id: msg.message_id.toString(),
                text: msg.text,
                sender: msg.is_from_me ? "you" : "partner",
                timestamp: new Date(msg.date).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
                date: msg.date,
                is_from_me: Boolean(msg.is_from_me),
              })) || []

            return {
              id: letter.id.toString(),
              title: letter.title,
              date: letter.date,
              preview: letter.preview || letter.description,
              mood: letter.mood || "romantic",
              emotionalScore: letter.emotional_score || 8.0,
              tags: letter.tags || [],
              messages,
            }
          }),
        )

        setLoveLetters(processedLetters.filter(Boolean) as LoveLetter[])
      } else {
        // Fallback: Look for emotionally_impactful_conversations table
        const { data: conversationsData, error: conversationsError } = await supabase
          .from("emotionally_impactful_conversations")
          .select("*")
          .order("emotional_score", { ascending: false })

        if (conversationsError && conversationsError.code !== "42P01") {
          throw conversationsError
        }

        if (conversationsData && conversationsData.length > 0) {
          // Process from conversations table using the new full dataset
          const processedLetters = await Promise.all(
            conversationsData.map(async (conv) => {
              const messageIds = conv.message_ids || []
              const { data: messagesData, error: messagesError } = await supabase
                .from(TABLE_NAME)
                .select("*")
                .in("message_id", messageIds)
                .order("date", { ascending: true })

              if (messagesError) {
                console.error("Error fetching messages for conversation:", conv.id, messagesError)
                return null
              }

              const messages: LoveLetterMessage[] =
                messagesData?.map((msg) => ({
                  id: msg.message_id.toString(),
                  text: msg.text,
                  sender: msg.is_from_me ? "you" : "partner",
                  timestamp: new Date(msg.date).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
                  date: msg.date,
                  is_from_me: Boolean(msg.is_from_me),
                })) || []

              return {
                id: conv.id.toString(),
                title: conv.title || conv.theme,
                date: conv.date || new Date(messages[0]?.date || Date.now()).toLocaleDateString(),
                preview: conv.preview || conv.description,
                mood: conv.mood || "romantic",
                emotionalScore: conv.emotional_score || 8.0,
                tags: conv.tags || [],
                messages,
              }
            }),
          )

          setLoveLetters(processedLetters.filter(Boolean) as LoveLetter[])
        } else {
          // Final fallback: Create love letters from high-emotion messages in the full dataset
          await createLoveLettersFromMessages()
        }
      }
    } catch (err: any) {
      console.error("Error fetching love letters:", err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const createLoveLettersFromMessages = async () => {
    try {
      // Look for messages with love-related keywords and high emotional content from the full dataset
      const { data: messagesData, error: messagesError } = await supabase
        .from(TABLE_NAME)
        .select("*")
        .or(
          "text.ilike.%love you%,text.ilike.%i love%,text.ilike.%❤️%,text.ilike.%💕%,text.ilike.%forever%,text.ilike.%always%,text.ilike.%moon%,text.ilike.%back%",
        )
        .order("date", { ascending: true })
        .limit(100)

      if (messagesError) throw messagesError

      // Group messages into conversations (within 1 hour of each other)
      const conversations: { messages: any[]; startDate: string }[] = []
      let currentConversation: any[] = []
      let lastMessageTime = 0

      messagesData?.forEach((message) => {
        const messageTime = new Date(message.date).getTime()
        const timeDiff = messageTime - lastMessageTime

        if (timeDiff > 60 * 60 * 1000 && currentConversation.length > 0) {
          // More than 1 hour gap, start new conversation
          conversations.push({
            messages: [...currentConversation],
            startDate: currentConversation[0].date,
          })
          currentConversation = [message]
        } else {
          currentConversation.push(message)
        }

        lastMessageTime = messageTime
      })

      if (currentConversation.length > 0) {
        conversations.push({
          messages: [...currentConversation],
          startDate: currentConversation[0].date,
        })
      }

      // Convert to love letters format
      const generatedLetters: LoveLetter[] = conversations
        .filter((conv) => conv.messages.length >= 2) // At least 2 messages
        .slice(0, 10) // Limit to 10 love letters
        .map((conv, index) => {
          const messages: LoveLetterMessage[] = conv.messages.map((msg) => ({
            id: msg.message_id.toString(),
            text: msg.text,
            sender: msg.is_from_me ? "you" : "partner",
            timestamp: new Date(msg.date).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
            date: msg.date,
            is_from_me: Boolean(msg.is_from_me),
          }))

          // Determine mood based on content
          const allText = conv.messages.map((m) => m.text.toLowerCase()).join(" ")
          let mood: "romantic" | "playful" | "deep" | "nostalgic" = "romantic"

          if (allText.includes("haha") || allText.includes("lol") || allText.includes("😂")) {
            mood = "playful"
          } else if (allText.includes("forever") || allText.includes("always") || allText.includes("remember")) {
            mood = "nostalgic"
          } else if (allText.includes("think") || allText.includes("feel") || allText.includes("understand")) {
            mood = "deep"
          }

          // Calculate emotional score based on keywords
          let emotionalScore = 7.0
          if (allText.includes("love you")) emotionalScore += 1.5
          if (allText.includes("❤️") || allText.includes("💕")) emotionalScore += 0.5
          if (allText.includes("forever") || allText.includes("always")) emotionalScore += 1.0
          if (allText.includes("moon") && allText.includes("back")) emotionalScore += 2.0

          emotionalScore = Math.min(10, emotionalScore)

          return {
            id: `generated-${index}`,
            title: `Love Letter ${index + 1}`,
            date: new Date(conv.startDate).toLocaleDateString(),
            preview: conv.messages[0].text.substring(0, 100) + "...",
            mood,
            emotionalScore: Math.round(emotionalScore * 10) / 10,
            tags: ["love", "heartfelt", mood],
            messages,
          }
        })

      setLoveLetters(generatedLetters)
    } catch (err: any) {
      console.error("Error creating love letters from messages:", err)
      throw err
    }
  }

  const handleLetterSelect = (letter: LoveLetter) => {
    setSelectedLetter(letter)
    setCurrentMessageIndex(0)
    setIsPlaying(false)
    setShowPlayer(true)
  }

  const handlePlay = () => {
    setIsPlaying(!isPlaying)
  }

  const handlePrevious = () => {
    setCurrentMessageIndex((prev) => Math.max(0, prev - 1))
    setIsPlaying(false)
  }

  const handleNext = () => {
    if (selectedLetter) {
      setCurrentMessageIndex((prev) => Math.min(selectedLetter.messages.length - 1, prev + 1))
      setIsPlaying(false)
    }
  }

  const handleBack = () => {
    setShowPlayer(false)
    setSelectedLetter(null)
    setIsPlaying(false)
    setCurrentMessageIndex(0)
  }

  const getMoodGradient = (mood: string) => {
    switch (mood) {
      case "romantic":
        return "from-pink-500 to-red-500"
      case "playful":
        return "from-yellow-400 to-orange-500"
      case "deep":
        return "from-purple-500 to-indigo-600"
      case "nostalgic":
        return "from-blue-400 to-teal-500"
      default:
        return "from-gray-400 to-gray-600"
    }
  }

  const getMoodIcon = (mood: string) => {
    switch (mood) {
      case "romantic":
        return <Heart className="w-5 h-5" />
      case "playful":
        return <Star className="w-5 h-5" />
      case "deep":
        return <Moon className="w-5 h-5" />
      case "nostalgic":
        return <Sparkles className="w-5 h-5" />
      default:
        return <Heart className="w-5 h-5" />
    }
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-purple-400" />
          <h2 className="text-xl font-semibold text-gray-100 mb-2">Curating Your Love Letters</h2>
          <p className="text-gray-400">Finding your most meaningful conversations from the full dataset...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center max-w-md">
          <Heart className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-100 mb-2">Unable to Load Love Letters</h2>
          <p className="text-gray-400 mb-4">{error}</p>
          <Button onClick={fetchLoveLetters} className="bg-red-600 hover:bg-red-700">
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  if (showPlayer && selectedLetter) {
    const currentMessage = selectedLetter.messages[currentMessageIndex]
    const progress = ((currentMessageIndex + 1) / selectedLetter.messages.length) * 100

    return (
      <div className="h-full flex flex-col bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 relative overflow-hidden">
        {/* Background Gradient */}
        <div className={`absolute inset-0 bg-gradient-to-br ${getMoodGradient(selectedLetter.mood)} opacity-10`} />

        {/* Floating Animation */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-pulse opacity-20"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animationDelay: `${i * 0.7}s`,
                animationDuration: `${3 + Math.random() * 2}s`,
              }}
            >
              {getMoodIcon(selectedLetter.mood)}
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="relative z-10 bg-gray-800/50 border-b border-gray-700 px-4 py-3 flex-shrink-0">
          <div className="flex items-center justify-between">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 text-gray-400 hover:text-gray-100 transition-colors text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Letters
            </button>
            <div className="text-center">
              <h1 className="font-semibold text-gray-100">{selectedLetter.title}</h1>
              <p className="text-xs text-gray-400">{selectedLetter.date}</p>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${getMoodGradient(selectedLetter.mood)}`} />
              <span className="text-xs text-gray-400 capitalize">{selectedLetter.mood}</span>
            </div>
          </div>
        </div>

        {/* Message Display */}
        <div className="relative z-10 flex-1 flex items-center justify-center px-4 py-8">
          <div className="max-w-2xl w-full">
            <div className={`flex ${currentMessage.sender === "you" ? "justify-end" : "justify-start"} mb-8`}>
              <div className={`max-w-md ${currentMessage.sender === "you" ? "order-2" : "order-1"}`}>
                <div
                  className={`px-6 py-4 rounded-2xl shadow-lg ${
                    currentMessage.sender === "you"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-800/80 backdrop-blur-sm text-white border border-gray-600"
                  }`}
                >
                  <p className="text-lg font-serif leading-relaxed">{currentMessage.text}</p>
                </div>
                <div
                  className={`text-sm text-gray-400 mt-2 ${
                    currentMessage.sender === "you" ? "text-right" : "text-left"
                  }`}
                >
                  {currentMessage.sender === "you" ? "You" : "Your Love"} • {currentMessage.timestamp}
                </div>
              </div>
            </div>

            {/* Emotional Score */}
            <div className="text-center mt-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800/50 rounded-full backdrop-blur-sm">
                <Heart className="w-4 h-4 text-red-400" />
                <span className="text-sm text-gray-300">Emotional Impact: {selectedLetter.emotionalScore}/10</span>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="relative z-10 px-6 mb-4">
          <div className="w-full bg-gray-700/50 rounded-full h-2">
            <div
              className={`bg-gradient-to-r ${getMoodGradient(selectedLetter.mood)} rounded-full h-2 transition-all duration-300`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between text-sm text-gray-400 mt-2">
            <span>
              {currentMessageIndex + 1} of {selectedLetter.messages.length}
            </span>
            <span>{Math.round(progress)}% complete</span>
          </div>
        </div>

        {/* Controls */}
        <div className="relative z-10 bg-gray-800/50 border-t border-gray-700 p-4 flex-shrink-0">
          <div className="flex justify-center items-center gap-6">
            <Button
              variant="ghost"
              size="lg"
              onClick={handlePrevious}
              disabled={currentMessageIndex === 0}
              className="text-gray-300 hover:text-white hover:bg-gray-700"
            >
              <SkipBack className="w-6 h-6" />
            </Button>

            <Button
              variant="ghost"
              size="lg"
              onClick={handlePlay}
              className={`text-white w-16 h-16 rounded-full bg-gradient-to-r ${getMoodGradient(selectedLetter.mood)} hover:opacity-90`}
            >
              {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8" />}
            </Button>

            <Button
              variant="ghost"
              size="lg"
              onClick={handleNext}
              disabled={currentMessageIndex === selectedLetter.messages.length - 1}
              className="text-gray-300 hover:text-white hover:bg-gray-700"
            >
              <SkipForward className="w-6 h-6" />
            </Button>
          </div>

          {/* Tags */}
          <div className="flex justify-center gap-2 mt-4">
            {selectedLetter.tags.map((tag) => (
              <span key={tag} className="px-2 py-1 bg-gray-700/50 rounded-full text-xs text-gray-300">
                #{tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-semibold text-gray-100 flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-500" />
              Love Letters
            </h1>
            <p className="text-xs text-gray-400">
              {loveLetters.length} emotionally impactful conversations from your full dataset
            </p>
          </div>
          <Sparkles className="h-5 w-5 text-purple-400" />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto">
          {loveLetters.length === 0 ? (
            <div className="text-center py-12">
              <Heart className="w-16 h-16 text-gray-600 mx-auto mb-6" />
              <h2 className="text-xl font-semibold text-gray-300 mb-2">No Love Letters Found</h2>
              <p className="text-gray-400 max-w-md mx-auto mb-6">
                We couldn't find any emotionally impactful conversations in your full dataset. This could mean the love
                letters table hasn't been populated yet, or we need to adjust our search criteria.
              </p>
              <Button onClick={fetchLoveLetters} className="bg-red-600 hover:bg-red-700">
                Refresh & Search Again
              </Button>
            </div>
          ) : (
            <>
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-100 mb-4">Your Most Meaningful Moments</h2>
                <p className="text-gray-400 max-w-2xl mx-auto">
                  These conversations have been identified as the most emotionally impactful moments in your
                  relationship. Experience them as cinematic love letters with immersive storytelling.
                </p>
              </div>

              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {loveLetters.map((letter) => (
                  <div
                    key={letter.id}
                    onClick={() => handleLetterSelect(letter)}
                    className="bg-gray-800 rounded-lg p-6 cursor-pointer hover:bg-gray-700 transition-all duration-300 hover:scale-105 border border-gray-700 group"
                  >
                    {/* Mood Indicator */}
                    <div
                      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm mb-4 bg-gradient-to-r ${getMoodGradient(letter.mood)} text-white`}
                    >
                      {getMoodIcon(letter.mood)}
                      <span className="capitalize">{letter.mood}</span>
                    </div>

                    <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-gray-100">{letter.title}</h3>
                    <p className="text-gray-400 text-sm mb-3">{letter.date}</p>
                    <p className="text-gray-300 leading-relaxed mb-4">{letter.preview}</p>

                    {/* Stats */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-700">
                      <div className="flex items-center gap-4">
                        <span className="text-gray-400 text-sm">{letter.messages.length} messages</span>
                        <div className="flex items-center gap-1">
                          <Heart className="w-3 h-3 text-red-400" />
                          <span className="text-gray-400 text-sm">{letter.emotionalScore}/10</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-gray-400 group-hover:text-white transition-colors">
                        <Play className="w-4 h-4" />
                        <span className="text-sm">Play</span>
                      </div>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1 mt-3">
                      {letter.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="px-2 py-1 bg-gray-700 rounded-full text-xs text-gray-400">
                          #{tag}
                        </span>
                      ))}
                      {letter.tags.length > 3 && (
                        <span className="px-2 py-1 bg-gray-700 rounded-full text-xs text-gray-400">
                          +{letter.tags.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Stats Summary */}
              <div className="mt-12 grid gap-4 md:grid-cols-3">
                <div className="bg-gray-800 rounded-lg p-6 text-center border border-gray-700">
                  <div className="text-2xl font-bold text-red-400 mb-2">{loveLetters.length}</div>
                  <div className="text-gray-400">Love Letters</div>
                </div>
                <div className="bg-gray-800 rounded-lg p-6 text-center border border-gray-700">
                  <div className="text-2xl font-bold text-purple-400 mb-2">
                    {loveLetters.reduce((sum, letter) => sum + letter.messages.length, 0)}
                  </div>
                  <div className="text-gray-400">Total Messages</div>
                </div>
                <div className="bg-gray-800 rounded-lg p-6 text-center border border-gray-700">
                  <div className="text-2xl font-bold text-blue-400 mb-2">
                    {loveLetters.length > 0
                      ? (
                          loveLetters.reduce((sum, letter) => sum + letter.emotionalScore, 0) / loveLetters.length
                        ).toFixed(1)
                      : "0.0"}
                  </div>
                  <div className="text-gray-400">Avg. Emotional Score</div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
