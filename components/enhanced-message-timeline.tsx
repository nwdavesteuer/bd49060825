"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Search,
  Heart,
  ImageIcon,
  ChevronDown,
  ArrowUp,
  Clock,
  Hash,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  X,
} from "lucide-react"

interface Message {
  id: string
  date: string
  time: string
  sender: "you" | "nitzan"
  content: string
  type: "text" | "image" | "special"
  year: number
  month: number
  day: number
}

interface Memory {
  id: string
  title: string
  description: string
  date: string
  theme: string
  color: string
  messages: Message[]
  coverImage?: string
}

interface Theme {
  id: string
  name: string
  color: string
  description: string
  keywords: string[]
}

// Sample themes
const themes: Theme[] = [
  {
    id: "honeymoon",
    name: "Honeymoon Phase",
    color: "#FF5E94",
    description: "The early days of falling in love",
    keywords: ["love", "miss", "beautiful", "amazing", "perfect", "dream", "forever"],
  },
  {
    id: "daily",
    name: "Daily Life",
    color: "#4A90E2",
    description: "Everyday moments and routines",
    keywords: ["work", "dinner", "morning", "sleep", "home", "today", "tomorrow"],
  },
  {
    id: "milestones",
    name: "Milestones",
    color: "#F5A623",
    description: "Important moments and celebrations",
    keywords: ["anniversary", "birthday", "celebrate", "congratulations", "proud", "achievement"],
  },
  {
    id: "support",
    name: "Support & Care",
    color: "#7ED321",
    description: "Being there for each other",
    keywords: ["sorry", "help", "support", "feel", "better", "care", "worry", "okay"],
  },
  {
    id: "playful",
    name: "Playful Moments",
    color: "#BD10E0",
    description: "Fun, humor and playfulness",
    keywords: ["haha", "funny", "lol", "joke", "laugh", "silly", "fun", "play"],
  },
]

// Enhanced sample data with more realistic conversation flow
const sampleMessages: Message[] = [
  {
    id: "1",
    date: "2016-01-25",
    time: "18:56",
    sender: "nitzan",
    content: "Hey! How was your day? 😊",
    type: "text",
    year: 2016,
    month: 1,
    day: 25,
  },
  {
    id: "2",
    date: "2016-01-25",
    time: "19:02",
    sender: "you",
    content: "It was good! Just thinking about you ❤️",
    type: "text",
    year: 2016,
    month: 1,
    day: 25,
  },
  {
    id: "3",
    date: "2016-01-25",
    time: "19:03",
    sender: "nitzan",
    content: "Aww you're so sweet 🥰",
    type: "text",
    year: 2016,
    month: 1,
    day: 25,
  },
  {
    id: "4",
    date: "2016-01-26",
    time: "08:15",
    sender: "you",
    content: "Good morning beautiful ☀️",
    type: "text",
    year: 2016,
    month: 1,
    day: 26,
  },
  {
    id: "5",
    date: "2016-01-26",
    time: "08:20",
    sender: "nitzan",
    content: "Good morning! Coffee date today? ☕️",
    type: "text",
    year: 2016,
    month: 1,
    day: 26,
  },
  {
    id: "6",
    date: "2016-01-26",
    time: "14:30",
    sender: "you",
    content: "Photo from our coffee date",
    type: "image",
    year: 2016,
    month: 1,
    day: 26,
  },
  {
    id: "7",
    date: "2016-03-27",
    time: "20:45",
    sender: "nitzan",
    content: "I love spending time with you 💕",
    type: "special",
    year: 2016,
    month: 3,
    day: 27,
  },
  {
    id: "8",
    date: "2016-03-27",
    time: "20:47",
    sender: "you",
    content: "Me too! You make every day better 🌟",
    type: "special",
    year: 2016,
    month: 3,
    day: 27,
  },
  {
    id: "9",
    date: "2024-06-08",
    time: "14:00",
    sender: "nitzan",
    content: "Can't believe it's been almost 10 years of messages! 🎉",
    type: "special",
    year: 2024,
    month: 6,
    day: 8,
  },
  {
    id: "10",
    date: "2024-06-08",
    time: "14:01",
    sender: "you",
    content: "Best 10 years ever! Here's to many more 💕",
    type: "special",
    year: 2024,
    month: 6,
    day: 8,
  },
]

// Sample memories (curated collections of messages)
const sampleMemories: Memory[] = [
  {
    id: "memory1",
    title: "First Conversations",
    description: "Where it all began - our first exchanges",
    date: "2016-01-25",
    theme: "honeymoon",
    color: "#FF5E94",
    messages: sampleMessages.slice(0, 3),
    coverImage: "/placeholder.svg?height=400&width=300",
  },
  {
    id: "memory2",
    title: "Coffee Date",
    description: "Our first coffee date together",
    date: "2016-01-26",
    theme: "daily",
    color: "#4A90E2",
    messages: sampleMessages.slice(3, 6),
    coverImage: "/placeholder.svg?height=400&width=300",
  },
  {
    id: "memory3",
    title: "Special Moment",
    description: "A meaningful exchange about our relationship",
    date: "2016-03-27",
    theme: "support",
    color: "#7ED321",
    messages: sampleMessages.slice(6, 8),
    coverImage: "/placeholder.svg?height=400&width=300",
  },
  {
    id: "memory4",
    title: "10 Year Anniversary",
    description: "Celebrating a decade of love",
    date: "2024-06-08",
    theme: "milestones",
    color: "#F5A623",
    messages: sampleMessages.slice(8, 10),
    coverImage: "/placeholder.svg?height=400&width=300",
  },
]

export default function EnhancedMessageTimeline() {
  const [messages, setMessages] = useState<Message[]>(sampleMessages)
  const [filteredMessages, setFilteredMessages] = useState<Message[]>(sampleMessages)
  const [memories, setMemories] = useState<Memory[]>(sampleMemories)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedYear, setSelectedYear] = useState<number | null>(null)
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null)
  const [showScrollTop, setShowScrollTop] = useState(false)
  const [activeTab, setActiveTab] = useState("timeline")
  const [viewingMemory, setViewingMemory] = useState<Memory | null>(null)
  const [storyIndex, setStoryIndex] = useState(0)
  const [storyProgress, setStoryProgress] = useState(0)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const years = Array.from(new Set(messages.map((m) => m.year))).sort()
  const months = selectedYear
    ? Array.from(new Set(messages.filter((m) => m.year === selectedYear).map((m) => m.month))).sort()
    : []

  // Filter messages based on search, year, and theme
  useEffect(() => {
    let filtered = messages

    if (searchTerm) {
      filtered = filtered.filter((msg) => msg.content.toLowerCase().includes(searchTerm.toLowerCase()))
    }

    if (selectedYear) {
      filtered = filtered.filter((msg) => msg.year === selectedYear)
    }

    if (selectedTheme) {
      const theme = themes.find((t) => t.id === selectedTheme)
      if (theme) {
        filtered = filtered.filter((msg) =>
          theme.keywords.some((keyword) => msg.content.toLowerCase().includes(keyword.toLowerCase())),
        )
      }
    }

    setFilteredMessages(filtered)
  }, [searchTerm, selectedYear, selectedTheme, messages])

  // Handle scroll to show/hide scroll to top button
  useEffect(() => {
    const handleScroll = () => {
      if (containerRef.current) {
        const { scrollTop } = containerRef.current
        setShowScrollTop(scrollTop > 200)
      }
    }

    const container = containerRef.current
    if (container) {
      container.addEventListener("scroll", handleScroll)
      return () => container.removeEventListener("scroll", handleScroll)
    }
  }, [])

  // Story progress animation
  useEffect(() => {
    if (!viewingMemory) return

    const interval = setInterval(() => {
      setStoryProgress((prev) => {
        if (prev >= 100) {
          // Move to next message in story
          if (storyIndex < viewingMemory.messages.length - 1) {
            setStoryIndex(storyIndex + 1)
            return 0
          } else {
            clearInterval(interval)
            return 100
          }
        }
        return prev + 1
      })
    }, 50)

    return () => clearInterval(interval)
  }, [viewingMemory, storyIndex])

  const scrollToTop = () => {
    containerRef.current?.scrollTo({ top: 0, behavior: "smooth" })
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return "Today"
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday"
    } else {
      return date.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    }
  }

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(":")
    const hour = Number.parseInt(hours)
    const ampm = hour >= 12 ? "PM" : "AM"
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  // Group messages by date
  const groupedMessages = filteredMessages.reduce(
    (groups, message) => {
      const date = message.date
      if (!groups[date]) {
        groups[date] = []
      }
      groups[date].push(message)
      return groups
    },
    {} as Record<string, Message[]>,
  )

  const viewMemory = (memory: Memory) => {
    setViewingMemory(memory)
    setStoryIndex(0)
    setStoryProgress(0)
  }

  const closeMemory = () => {
    setViewingMemory(null)
    setStoryIndex(0)
    setStoryProgress(0)
  }

  const nextStory = () => {
    if (!viewingMemory) return
    if (storyIndex < viewingMemory.messages.length - 1) {
      setStoryIndex(storyIndex + 1)
      setStoryProgress(0)
    } else {
      closeMemory()
    }
  }

  const prevStory = () => {
    if (!viewingMemory) return
    if (storyIndex > 0) {
      setStoryIndex(storyIndex - 1)
      setStoryProgress(0)
    }
  }

  return (
    <div className="h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <div className="bg-gray-900/95 backdrop-blur-xl border-b border-gray-800 p-4 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto">
          {/* Contact Header */}
          <div className="flex items-center justify-center mb-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center mb-2 mx-auto">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl font-semibold text-white">Nitzan</h1>
              <p className="text-sm text-gray-400">
                {filteredMessages.length.toLocaleString()} messages • {years.length} years
              </p>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-3 mb-4 bg-gray-800">
              <TabsTrigger value="timeline" className="data-[state=active]:bg-blue-600">
                <Clock className="w-4 h-4 mr-2" />
                Timeline
              </TabsTrigger>
              <TabsTrigger value="themes" className="data-[state=active]:bg-blue-600">
                <Hash className="w-4 h-4 mr-2" />
                Themes
              </TabsTrigger>
              <TabsTrigger value="memories" className="data-[state=active]:bg-blue-600">
                <Sparkles className="w-4 h-4 mr-2" />
                Memories
              </TabsTrigger>
            </TabsList>

            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search messages..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-blue-500"
                />
              </div>

              {activeTab === "timeline" && (
                <div className="flex gap-2 overflow-x-auto">
                  <Button
                    variant={selectedYear === null ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedYear(null)}
                    className={
                      selectedYear === null
                        ? "bg-blue-600 hover:bg-blue-700 text-white"
                        : "border-gray-600 text-gray-300 hover:bg-gray-800"
                    }
                  >
                    All Years
                  </Button>
                  {years.map((year) => (
                    <Button
                      key={year}
                      variant={selectedYear === year ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedYear(year)}
                      className={
                        selectedYear === year
                          ? "bg-blue-600 hover:bg-blue-700 text-white"
                          : "border-gray-600 text-gray-300 hover:bg-gray-800"
                      }
                    >
                      {year}
                    </Button>
                  ))}
                </div>
              )}

              {activeTab === "themes" && (
                <div className="flex gap-2 overflow-x-auto">
                  <Button
                    variant={selectedTheme === null ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedTheme(null)}
                    className={
                      selectedTheme === null
                        ? "bg-blue-600 hover:bg-blue-700 text-white"
                        : "border-gray-600 text-gray-300 hover:bg-gray-800"
                    }
                  >
                    All Themes
                  </Button>
                  {themes.map((theme) => (
                    <Button
                      key={theme.id}
                      variant={selectedTheme === theme.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedTheme(theme.id)}
                      style={{
                        backgroundColor: selectedTheme === theme.id ? theme.color : "transparent",
                        borderColor: theme.color,
                        color: selectedTheme === theme.id ? "white" : theme.color,
                      }}
                    >
                      {theme.name}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </Tabs>
        </div>
      </div>

      {/* Memory Story View (Instagram-like) */}
      {viewingMemory && (
        <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
          {/* Close button */}
          <button
            onClick={closeMemory}
            className="absolute top-4 right-4 z-50 p-2 bg-gray-800/50 backdrop-blur-sm rounded-full"
          >
            <X className="w-6 h-6 text-white" />
          </button>

          {/* Progress bars */}
          <div className="absolute top-4 left-0 right-0 flex gap-1 px-4">
            {viewingMemory.messages.map((_, idx) => (
              <div key={idx} className="h-1 flex-1 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`h-full bg-white ${idx === storyIndex ? "transition-all duration-50" : ""} ${
                    idx < storyIndex ? "w-full" : idx > storyIndex ? "w-0" : ""
                  }`}
                  style={{ width: idx === storyIndex ? `${storyProgress}%` : undefined }}
                />
              </div>
            ))}
          </div>

          {/* Memory header */}
          <div className="absolute top-10 left-0 right-0 px-6 py-4">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: viewingMemory.color }}
              >
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-white">{viewingMemory.title}</h3>
                <p className="text-sm text-gray-300">{formatDate(viewingMemory.date)}</p>
              </div>
            </div>
          </div>

          {/* Navigation buttons */}
          <button
            onClick={prevStory}
            className={`absolute left-2 top-1/2 transform -translate-y-1/2 p-2 rounded-full ${
              storyIndex > 0 ? "bg-gray-800/50 backdrop-blur-sm" : "hidden"
            }`}
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>

          <button
            onClick={nextStory}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 bg-gray-800/50 backdrop-blur-sm rounded-full"
          >
            <ChevronRight className="w-6 h-6 text-white" />
          </button>

          {/* Story content */}
          <div className="w-full max-w-md p-6 flex flex-col items-center">
            {viewingMemory.messages[storyIndex] && (
              <div
                className="w-full max-w-sm p-6 rounded-xl shadow-2xl animate-fade-in"
                style={{
                  background: `linear-gradient(135deg, ${viewingMemory.color}22, ${viewingMemory.color}66)`,
                  backdropFilter: "blur(10px)",
                }}
              >
                <div className="mb-4 text-center">
                  <Badge
                    style={{ backgroundColor: viewingMemory.color }}
                    className="mb-2 px-3 py-1 text-xs font-medium"
                  >
                    {themes.find((t) => t.id === viewingMemory.theme)?.name || viewingMemory.theme}
                  </Badge>
                </div>

                <div
                  className={`p-4 rounded-xl mb-3 ${
                    viewingMemory.messages[storyIndex].sender === "you"
                      ? "bg-blue-600 text-white ml-auto mr-2 max-w-[80%]"
                      : "bg-gray-800 text-white mr-auto ml-2 max-w-[80%]"
                  }`}
                >
                  <p className="text-lg">{viewingMemory.messages[storyIndex].content}</p>
                </div>

                <div className="text-center mt-6">
                  <p className="text-sm text-gray-300">
                    {formatDate(viewingMemory.messages[storyIndex].date)} •{" "}
                    {formatTime(viewingMemory.messages[storyIndex].time)}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto px-4 py-6 scroll-smooth"
        style={{ scrollbarWidth: "thin", scrollbarColor: "#374151 transparent" }}
      >
        <div className="max-w-6xl mx-auto">
          <TabsContent value="timeline" className="mt-0">
            {/* Month quick navigation */}
            {selectedYear && (
              <div className="mb-6 flex flex-wrap gap-2 justify-center">
                {months.map((month) => {
                  const monthName = new Date(selectedYear, month - 1, 1).toLocaleString("default", { month: "short" })
                  return (
                    <Badge
                      key={month}
                      className="cursor-pointer bg-gray-800 hover:bg-gray-700"
                      onClick={() => {
                        const targetDate = `${selectedYear}-${month.toString().padStart(2, "0")}`
                        const element = document.getElementById(`date-${targetDate}`)
                        if (element) {
                          element.scrollIntoView({ behavior: "smooth" })
                        }
                      }}
                    >
                      {monthName}
                    </Badge>
                  )
                })}
              </div>
            )}

            {/* Timeline */}
            <div className="space-y-6">
              {Object.entries(groupedMessages).map(([date, dayMessages]) => (
                <div key={date} className="space-y-4" id={`date-${date.substring(0, 7)}`}>
                  {/* Date Separator */}
                  <div className="flex items-center justify-center">
                    <div className="bg-gray-800/80 backdrop-blur-sm px-4 py-2 rounded-full">
                      <span className="text-sm text-gray-300 font-medium">{formatDate(date)}</span>
                    </div>
                  </div>

                  {/* Messages for this date */}
                  <div className="space-y-2">
                    {dayMessages.map((message, index) => {
                      const isFromYou = message.sender === "you"
                      const showTime =
                        index === dayMessages.length - 1 || dayMessages[index + 1]?.sender !== message.sender

                      return (
                        <div key={message.id} className={`flex ${isFromYou ? "justify-end" : "justify-start"} group`}>
                          <div className={`max-w-xs sm:max-w-md lg:max-w-lg ${isFromYou ? "order-2" : "order-1"}`}>
                            {/* Message Bubble */}
                            <div
                              className={`relative px-4 py-3 rounded-2xl shadow-lg transform transition-all duration-200 hover:scale-[1.02] ${
                                isFromYou
                                  ? message.type === "special"
                                    ? "bg-gradient-to-br from-pink-500 to-purple-600 text-white"
                                    : "bg-gradient-to-br from-blue-500 to-blue-600 text-white"
                                  : message.type === "special"
                                    ? "bg-gradient-to-br from-green-500 to-emerald-600 text-white"
                                    : "bg-gray-800 text-white"
                              } ${isFromYou ? "rounded-br-md ml-4" : "rounded-bl-md mr-4"}`}
                            >
                              {/* Special message indicator */}
                              {message.type === "special" && (
                                <div className="absolute -top-1 -right-1">
                                  <Heart className="w-4 h-4 text-yellow-300 animate-pulse" />
                                </div>
                              )}

                              {/* Message content */}
                              {message.type === "image" ? (
                                <div className="space-y-2">
                                  <div className="w-full h-32 bg-gray-700 rounded-lg flex items-center justify-center">
                                    <ImageIcon className="w-8 h-8 text-gray-400" />
                                  </div>
                                  <p className="text-sm">{message.content}</p>
                                </div>
                              ) : (
                                <p className="text-sm leading-relaxed">{message.content}</p>
                              )}

                              {/* Message tail */}
                              <div
                                className={`absolute bottom-0 w-4 h-4 ${
                                  isFromYou
                                    ? message.type === "special"
                                      ? "bg-gradient-to-br from-pink-500 to-purple-600 -right-2 rounded-bl-full"
                                      : "bg-gradient-to-br from-blue-500 to-blue-600 -right-2 rounded-bl-full"
                                    : message.type === "special"
                                      ? "bg-gradient-to-br from-green-500 to-emerald-600 -left-2 rounded-br-full"
                                      : "bg-gray-800 -left-2 rounded-br-full"
                                }`}
                              />
                            </div>

                            {/* Timestamp */}
                            {showTime && (
                              <div className={`mt-1 px-2 ${isFromYou ? "text-right" : "text-left"}`}>
                                <span className="text-xs text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                  {formatTime(message.time)}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}

              <div ref={messagesEndRef} />
            </div>
          </TabsContent>

          <TabsContent value="themes" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {themes.map((theme) => (
                <Card
                  key={theme.id}
                  className="bg-gray-900 border-gray-800 overflow-hidden hover:border-gray-700 transition-all cursor-pointer"
                  onClick={() => setSelectedTheme(theme.id === selectedTheme ? null : theme.id)}
                >
                  <div className="h-2" style={{ backgroundColor: theme.color }} />
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-bold text-white">{theme.name}</h3>
                      <Badge style={{ backgroundColor: theme.color }}>{theme.id}</Badge>
                    </div>
                    <p className="text-gray-400 mb-4">{theme.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {theme.keywords.map((keyword) => (
                        <Badge key={keyword} variant="outline" className="border-gray-700 text-gray-300">
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-800">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-400">
                          {
                            messages.filter((msg) =>
                              theme.keywords.some((keyword) =>
                                msg.content.toLowerCase().includes(keyword.toLowerCase()),
                              ),
                            ).length
                          }{" "}
                          messages
                        </span>
                        <Button size="sm" variant="outline" className="border-gray-700 text-gray-300 hover:bg-gray-800">
                          View Messages
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="memories" className="mt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {memories.map((memory) => (
                <Card
                  key={memory.id}
                  className="bg-gray-900 border-gray-800 overflow-hidden hover:border-gray-700 transition-all cursor-pointer"
                  onClick={() => viewMemory(memory)}
                >
                  <div
                    className="h-48 bg-cover bg-center relative"
                    style={{
                      backgroundImage: `url(${memory.coverImage})`,
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <Badge style={{ backgroundColor: memory.color }} className="mb-2">
                        {themes.find((t) => t.id === memory.theme)?.name || memory.theme}
                      </Badge>
                      <h3 className="text-xl font-bold text-white">{memory.title}</h3>
                      <p className="text-sm text-gray-300">{formatDate(memory.date)}</p>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <p className="text-gray-400 text-sm">{memory.description}</p>
                    <div className="mt-3 flex justify-between items-center">
                      <span className="text-xs text-gray-500">{memory.messages.length} messages</span>
                      <Button size="sm" variant="ghost" className="text-blue-400 hover:text-blue-300">
                        <Sparkles className="w-4 h-4 mr-1" /> View Story
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Add New Memory Card */}
              <Card className="bg-gray-900 border-gray-800 border-dashed hover:border-blue-500 transition-all cursor-pointer flex flex-col items-center justify-center h-full min-h-[300px]">
                <CardContent className="p-6 flex flex-col items-center justify-center text-center h-full">
                  <div className="w-16 h-16 rounded-full bg-blue-900/30 flex items-center justify-center mb-4">
                    <Sparkles className="w-8 h-8 text-blue-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Create New Memory</h3>
                  <p className="text-gray-400 mb-4">Curate special moments from your messages</p>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Sparkles className="w-4 h-4 mr-2" /> Create Memory
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </div>
      </div>

      {/* Floating Action Buttons */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-3">
        {showScrollTop && (
          <Button
            onClick={scrollToTop}
            size="icon"
            className="w-12 h-12 rounded-full bg-gray-800/90 backdrop-blur-sm border border-gray-700 hover:bg-gray-700 shadow-lg"
          >
            <ArrowUp className="w-5 h-5 text-white" />
          </Button>
        )}

        <Button
          onClick={scrollToBottom}
          size="icon"
          className="w-12 h-12 rounded-full bg-blue-600/90 backdrop-blur-sm hover:bg-blue-700 shadow-lg"
        >
          <ChevronDown className="w-5 h-5 text-white" />
        </Button>
      </div>

      {/* Stats Footer */}
      <div className="bg-gray-900/95 backdrop-blur-xl border-t border-gray-800 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-blue-400">
                {filteredMessages.filter((m) => m.sender === "you").length}
              </div>
              <div className="text-xs text-gray-400">Your Messages</div>
            </div>
            <div>
              <div className="text-lg font-bold text-pink-400">
                {filteredMessages.filter((m) => m.sender === "nitzan").length}
              </div>
              <div className="text-xs text-gray-400">Nitzan's Messages</div>
            </div>
            <div>
              <div className="text-lg font-bold text-green-400">
                {filteredMessages.filter((m) => m.type === "image").length}
              </div>
              <div className="text-xs text-gray-400">Photos</div>
            </div>
            <div>
              <div className="text-lg font-bold text-purple-400">
                {filteredMessages.filter((m) => m.type === "special").length}
              </div>
              <div className="text-xs text-gray-400">Special</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
