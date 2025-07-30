"use client"

import { useState, useEffect } from "react"
import { supabase, type Message } from "../lib/supabase"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Heart, MessageCircle, ImageIcon, Calendar, Loader2 } from "lucide-react"

export default function DatabaseMessageTimeline() {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedYear, setSelectedYear] = useState<number | null>(null)
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    fetchMessages()
    fetchStats()
  }, [])

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .order("date_sent", { ascending: true })
        .limit(1000) // Show first 1000 messages, we'll add pagination

      if (error) throw error
      setMessages(data || [])
    } catch (error) {
      console.error("Error fetching messages:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const { data, error } = await supabase.from("message_stats").select("*")

      if (error) throw error
      setStats(data)
    } catch (error) {
      console.error("Error fetching stats:", error)
    }
  }

  const years = Array.from(new Set(messages.map((m) => m.year))).sort()
  const filteredMessages = selectedYear ? messages.filter((m) => m.year === selectedYear) : messages

  const getMessageIcon = (type: string) => {
    switch (type) {
      case "image":
        return <ImageIcon className="w-4 h-4" />
      case "reaction":
        return <Heart className="w-4 h-4 text-red-500" />
      default:
        return <MessageCircle className="w-4 h-4" />
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="ml-2">Loading your love story...</span>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gradient-to-br from-pink-50 to-purple-50 min-h-screen">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">Our Story in Messages</h1>
        <p className="text-gray-600">A decade of love, one message at a time</p>
        <div className="flex items-center justify-center gap-2 mt-4">
          <Heart className="w-5 h-5 text-red-500" />
          <span className="text-sm text-gray-500">
            {Math.min(...years)} - {Math.max(...years)}
          </span>
          <Heart className="w-5 h-5 text-red-500" />
        </div>
      </div>

      {/* Year Filter */}
      <div className="flex flex-wrap justify-center gap-2 mb-8">
        <Badge
          variant={selectedYear === null ? "default" : "outline"}
          className="cursor-pointer"
          onClick={() => setSelectedYear(null)}
        >
          All Years
        </Badge>
        {years.map((year) => (
          <Badge
            key={year}
            variant={selectedYear === year ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setSelectedYear(year)}
          >
            {year}
          </Badge>
        ))}
      </div>

      {/* Timeline */}
      <div className="relative">
        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-pink-300 to-purple-300"></div>

        <div className="space-y-6">
          {filteredMessages.map((message) => (
            <div key={message.id} className="relative flex items-start gap-6">
              <div
                className={`relative z-10 flex items-center justify-center w-16 h-16 rounded-full border-4 border-white shadow-lg ${
                  message.sender === "you"
                    ? "bg-gradient-to-r from-blue-400 to-blue-600"
                    : "bg-gradient-to-r from-pink-400 to-pink-600"
                }`}
              >
                {getMessageIcon(message.message_type)}
              </div>

              <Card className="flex-1 shadow-md hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={message.sender === "you" ? "default" : "secondary"}>
                        {message.sender === "you" ? "You" : "Nitzan"}
                      </Badge>
                      <span className="text-sm text-gray-500 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(message.date_sent)}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-white">
                    <p className="text-gray-800">{message.content}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4">
          {stats.map((stat: any) => (
            <Card key={stat.sender} className="text-center p-4">
              <CardContent className="p-0">
                <div className="text-2xl font-bold text-pink-600">{stat.total_messages}</div>
                <div className="text-sm text-gray-600">{stat.sender === "you" ? "Your" : "Nitzan's"} Messages</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
