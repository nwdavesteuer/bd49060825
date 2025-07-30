"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { User, Bot, Clock, MessageSquare } from "lucide-react"
import type { Message } from "@/lib/supabase"

interface VirtualMessageListProps {
  messages: Message[]
}

export default function VirtualMessageList({ messages }: VirtualMessageListProps) {
  const [visibleMessages, setVisibleMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const MESSAGES_PER_BATCH = 50

  useEffect(() => {
    // Reset and load first batch when messages change
    setVisibleMessages(messages.slice(0, MESSAGES_PER_BATCH))
  }, [messages])

  const loadMoreMessages = () => {
    if (loading || visibleMessages.length >= messages.length) return

    setLoading(true)
    setTimeout(() => {
      const nextBatch = messages.slice(visibleMessages.length, visibleMessages.length + MESSAGES_PER_BATCH)
      setVisibleMessages((prev) => [...prev, ...nextBatch])
      setLoading(false)
    }, 100)
  }

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget
    if (scrollHeight - scrollTop <= clientHeight * 1.5) {
      loadMoreMessages()
    }
  }

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    } catch {
      return "Invalid time"
    }
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString([], {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    } catch {
      return "Invalid date"
    }
  }

  const getSenderInfo = (message: Message) => {
    // Handle different formats of is_from_me
    const isFromMe =
      message.is_from_me === 1 ||
      message.is_from_me === "1" ||
      message.is_from_me === true ||
      message.is_from_me === "true"

    return {
      isFromMe,
      displayName: isFromMe ? "You" : message.sender || "Partner",
      debugInfo: `is_from_me: ${message.is_from_me} (${typeof message.is_from_me}), sender: ${message.sender}`,
    }
  }

  const groupMessagesByDate = (messages: Message[]) => {
    const groups: { date: string; messages: Message[] }[] = []
    let currentDate = ""
    let currentGroup: Message[] = []

    messages.forEach((message) => {
      const messageDate = new Date(message.date).toDateString()

      if (messageDate !== currentDate) {
        if (currentGroup.length > 0) {
          groups.push({ date: currentDate, messages: currentGroup })
        }
        currentDate = messageDate
        currentGroup = [message]
      } else {
        currentGroup.push(message)
      }
    })

    if (currentGroup.length > 0) {
      groups.push({ date: currentDate, messages: currentGroup })
    }

    return groups
  }

  const messageGroups = groupMessagesByDate(visibleMessages)

  if (messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <MessageSquare className="h-12 w-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">No messages to display</p>
        </div>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="h-full overflow-y-auto p-4 space-y-6" onScroll={handleScroll}>
      {messageGroups.map((group, groupIndex) => (
        <div key={`${group.date}-${groupIndex}`} className="space-y-4">
          {/* Date Header */}
          <div className="flex items-center justify-center">
            <div className="bg-gray-700 px-4 py-2 rounded-full">
              <span className="text-sm text-gray-300 font-medium">{formatDate(group.messages[0]?.date)}</span>
            </div>
          </div>

          {/* Messages for this date */}
          <div className="space-y-3">
            {group.messages.map((message, index) => {
              const senderInfo = getSenderInfo(message)

              return (
                <div
                  key={`${message.message_id}-${index}`}
                  className={`flex ${senderInfo.isFromMe ? "justify-end" : "justify-start"} group`}
                >
                  <div className={`max-w-xs lg:max-w-md xl:max-w-lg ${senderInfo.isFromMe ? "order-2" : "order-1"}`}>
                    {/* Message Bubble */}
                    <div
                      className={`px-4 py-3 rounded-2xl shadow-sm ${
                        senderInfo.isFromMe
                          ? "bg-blue-600 text-white"
                          : "bg-gray-700 text-gray-100 border border-gray-600"
                      }`}
                    >
                      <p className="text-sm leading-relaxed break-words">{message.text}</p>
                    </div>

                    {/* Message Info */}
                    <div
                      className={`flex items-center gap-2 mt-1 text-xs text-gray-400 ${
                        senderInfo.isFromMe ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div className="flex items-center gap-1">
                        {senderInfo.isFromMe ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
                        <span>{senderInfo.displayName}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{formatTime(message.date)}</span>
                      </div>
                    </div>

                    {/* Debug Info */}
                    <div className={`text-xs text-gray-500 mt-1 ${senderInfo.isFromMe ? "text-right" : "text-left"}`}>
                      {senderInfo.debugInfo}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {/* Loading Indicator */}
      {loading && (
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400"></div>
        </div>
      )}

      {/* End of Messages */}
      {visibleMessages.length >= messages.length && messages.length > 0 && (
        <div className="text-center py-4">
          <p className="text-sm text-gray-400">End of messages • {messages.length.toLocaleString()} total</p>
        </div>
      )}
    </div>
  )
}
