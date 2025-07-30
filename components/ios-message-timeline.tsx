"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Heart, ImageIcon, ChevronDown, ArrowUp } from "lucide-react"

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

export default function IOSMessageTimeline() {
  const [messages, setMessages] = useState<Message[]>(sampleMessages)
  const [filteredMessages, setFilteredMessages] = useState<Message[]>(sampleMessages)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedYear, setSelectedYear] = useState<number | null>(null)
  const [showScrollTop, setShowScrollTop] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const years = Array.from(new Set(messages.map((m) => m.year))).sort()

  // Filter messages based on search and year
  useEffect(() => {
    let filtered = messages

    if (searchTerm) {
      filtered = filtered.filter((msg) => msg.content.toLowerCase().includes(searchTerm.toLowerCase()))
    }

    if (selectedYear) {
      filtered = filtered.filter((msg) => msg.year === selectedYear)
    }

    setFilteredMessages(filtered)
  }, [searchTerm, selectedYear, messages])

  // Handle scroll to show/hide scroll to top button
  useEffect(() => {
    const handleScroll = () => {
      if (containerRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = containerRef.current
        setShowScrollTop(scrollTop > 200)
      }
    }

    const container = containerRef.current
    if (container) {
      container.addEventListener("scroll", handleScroll)
      return () => container.removeEventListener("scroll", handleScroll)
    }
  }, [])

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

  return (
    <div className="h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <div className="bg-gray-900/95 backdrop-blur-xl border-b border-gray-800 p-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto">
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
                All
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
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto px-4 py-6 scroll-smooth"
        style={{ scrollbarWidth: "thin", scrollbarColor: "#374151 transparent" }}
      >
        <div className="max-w-4xl mx-auto space-y-6">
          {Object.entries(groupedMessages).map(([date, dayMessages]) => (
            <div key={date} className="space-y-4">
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
                  const showTime = index === dayMessages.length - 1 || dayMessages[index + 1]?.sender !== message.sender

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
        <div className="max-w-4xl mx-auto">
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
