"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Heart, MessageCircle, Calendar, TrendingUp } from "lucide-react"

interface Message {
  id: string
  text: string
  sender: "you" | "nitzan"
  timestamp: string
  isLove?: boolean
}

interface TimelineData {
  year: number
  month: number
  messageCount: number
  loveMessageCount: number
  messages: Message[]
}

export default function MessageTimeline() {
  const [timelineData, setTimelineData] = useState<TimelineData[]>([])
  const [selectedYear, setSelectedYear] = useState<number | null>(null)
  const [hoveredMonth, setHoveredMonth] = useState<{ year: number; month: number } | null>(null)

  // Sample data - in real app this would come from your database
  useEffect(() => {
    const sampleData: TimelineData[] = [
      {
        year: 2015,
        month: 7,
        messageCount: 1250,
        loveMessageCount: 45,
        messages: [
          {
            id: "1",
            text: "I love you more than words can express",
            sender: "you",
            timestamp: "2015-07-24T10:30:00.000Z",
            isLove: true,
          },
          {
            id: "2",
            text: "You mean everything to me ❤️",
            sender: "nitzan",
            timestamp: "2015-07-24T10:31:00.000Z",
            isLove: true,
          },
        ],
      },
      {
        year: 2015,
        month: 8,
        messageCount: 1890,
        loveMessageCount: 67,
        messages: [],
      },
      // Add more sample data as needed
    ]
    setTimelineData(sampleData)
  }, [])

  const years = [...new Set(timelineData.map((d) => d.year))].sort()
  const filteredData = selectedYear ? timelineData.filter((d) => d.year === selectedYear) : timelineData

  const totalMessages = timelineData.reduce((sum, d) => sum + d.messageCount, 0)
  const totalLoveMessages = timelineData.reduce((sum, d) => sum + d.loveMessageCount, 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Your Love Story Timeline</h1>
          <p className="text-gray-600">A journey through your messages since July 24, 2015</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 text-center">
              <MessageCircle className="w-8 h-8 mx-auto mb-2 text-blue-500" />
              <div className="text-2xl font-bold text-gray-900">{totalMessages.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Total Messages</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Heart className="w-8 h-8 mx-auto mb-2 text-pink-500" />
              <div className="text-2xl font-bold text-gray-900">{totalLoveMessages.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Love Messages</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Calendar className="w-8 h-8 mx-auto mb-2 text-green-500" />
              <div className="text-2xl font-bold text-gray-900">{years.length}</div>
              <div className="text-sm text-gray-600">Years Together</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <TrendingUp className="w-8 h-8 mx-auto mb-2 text-purple-500" />
              <div className="text-2xl font-bold text-gray-900">
                {Math.round((totalLoveMessages / totalMessages) * 100)}%
              </div>
              <div className="text-sm text-gray-600">Love Ratio</div>
            </CardContent>
          </Card>
        </div>

        {/* Year Filter */}
        <div className="flex flex-wrap gap-2 mb-8 justify-center">
          <Button
            variant={selectedYear === null ? "default" : "outline"}
            onClick={() => setSelectedYear(null)}
            size="sm"
          >
            All Years
          </Button>
          {years.map((year) => (
            <Button
              key={year}
              variant={selectedYear === year ? "default" : "outline"}
              onClick={() => setSelectedYear(year)}
              size="sm"
            >
              {year}
            </Button>
          ))}
        </div>

        {/* Timeline */}
        <div className="space-y-6">
          {filteredData.map((data) => (
            <Card
              key={`${data.year}-${data.month}`}
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onMouseEnter={() => setHoveredMonth({ year: data.year, month: data.month })}
              onMouseLeave={() => setHoveredMonth(null)}
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-5 h-5 text-gray-500" />
                    <span>
                      {new Date(data.year, data.month - 1).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                      })}
                    </span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <Badge variant="secondary">{data.messageCount.toLocaleString()} messages</Badge>
                    <Badge variant="outline" className="text-pink-600 border-pink-300">
                      <Heart className="w-3 h-3 mr-1" />
                      {data.loveMessageCount}
                    </Badge>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-4 mb-4">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${Math.min((data.messageCount / 2000) * 100, 100)}%` }}
                    />
                  </div>
                  <div className="text-sm text-gray-600">{data.messageCount} messages</div>
                </div>

                {hoveredMonth?.year === data.year && hoveredMonth?.month === data.month && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Sample Messages</h4>
                    <div className="space-y-2">
                      {data.messages.slice(0, 3).map((message) => (
                        <div
                          key={message.id}
                          className={`p-2 rounded text-sm ${
                            message.sender === "you"
                              ? "bg-blue-100 text-blue-900 ml-8"
                              : "bg-gray-100 text-gray-900 mr-8"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{message.sender === "you" ? "You" : "Nitzan"}</span>
                            {message.isLove && <Heart className="w-3 h-3 text-pink-500" />}
                          </div>
                          <p className="mt-1">{message.text}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
