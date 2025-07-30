"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Database,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Loader2,
  Calendar,
  MessageCircle,
  Users,
  ImageIcon,
  BarChart3,
} from "lucide-react"
import { supabase } from "../lib/supabase"

interface DatabaseDiagnostic {
  connectionStatus: "success" | "error"
  totalMessages: number
  dateRange: {
    earliest: string
    latest: string
    totalDays: number
    totalYears: number
  }
  senderBreakdown: {
    you: number
    nitzan: number
  }
  messageTypes: {
    text: number
    image: number
    video: number
    audio: number
    reaction: number
    other: number
  }
  yearlyDistribution: Array<{
    year: number
    count: number
    percentage: number
  }>
  attachmentAnalysis: {
    totalWithAttachments: number
    expectedAttachments: number
    attachmentMatch: boolean
  }
  dataQuality: {
    messagesWithContent: number
    messagesWithoutContent: number
    duplicateCheck: number
    invalidDates: number
  }
  importSources: Record<string, number>
  sampleMessages: Array<{
    id: string
    date_sent: string
    sender: string
    content: string
    message_type: string
    metadata: any
  }>
}

export default function DatabaseDiagnostic() {
  const [diagnostic, setDiagnostic] = useState<DatabaseDiagnostic | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const runDiagnostic = async () => {
    setLoading(true)
    setError(null)

    try {
      console.log("🔍 Starting database diagnostic...")

      // Test connection
      const { data: connectionTest, error: connectionError } = await supabase
        .from("messages")
        .select("count", { count: "exact" })

      if (connectionError) {
        throw new Error(`Connection failed: ${connectionError.message}`)
      }

      console.log("✅ Database connection successful")

      // Get all messages for comprehensive analysis
      const { data: allMessages, error: messagesError } = await supabase
        .from("messages")
        .select("*")
        .order("date_sent", { ascending: true })

      if (messagesError) {
        throw new Error(`Failed to fetch messages: ${messagesError.message}`)
      }

      if (!allMessages || allMessages.length === 0) {
        setDiagnostic({
          connectionStatus: "success",
          totalMessages: 0,
          dateRange: { earliest: "", latest: "", totalDays: 0, totalYears: 0 },
          senderBreakdown: { you: 0, nitzan: 0 },
          messageTypes: { text: 0, image: 0, video: 0, audio: 0, reaction: 0, other: 0 },
          yearlyDistribution: [],
          attachmentAnalysis: { totalWithAttachments: 0, expectedAttachments: 102, attachmentMatch: false },
          dataQuality: { messagesWithContent: 0, messagesWithoutContent: 0, duplicateCheck: 0, invalidDates: 0 },
          importSources: {},
          sampleMessages: [],
        })
        return
      }

      console.log(`📊 Analyzing ${allMessages.length} messages...`)

      // Basic stats
      const totalMessages = allMessages.length
      const earliest = allMessages[0].date_sent
      const latest = allMessages[allMessages.length - 1].date_sent
      const totalDays = Math.ceil((new Date(latest).getTime() - new Date(earliest).getTime()) / (1000 * 60 * 60 * 24))
      const totalYears = new Date(latest).getFullYear() - new Date(earliest).getFullYear() + 1

      // Sender breakdown
      const senderBreakdown = {
        you: allMessages.filter((m) => m.sender === "you").length,
        nitzan: allMessages.filter((m) => m.sender === "nitzan").length,
      }

      // Message types
      const messageTypes = {
        text: allMessages.filter((m) => m.message_type === "text").length,
        image: allMessages.filter((m) => m.message_type === "image").length,
        video: allMessages.filter((m) => m.message_type === "video").length,
        audio: allMessages.filter((m) => m.message_type === "audio").length,
        reaction: allMessages.filter((m) => m.message_type === "reaction").length,
        other: allMessages.filter((m) => !["text", "image", "video", "audio", "reaction"].includes(m.message_type))
          .length,
      }

      // Yearly distribution
      const yearCounts: Record<number, number> = {}
      allMessages.forEach((m) => {
        const year = m.year || new Date(m.date_sent).getFullYear()
        yearCounts[year] = (yearCounts[year] || 0) + 1
      })

      const yearlyDistribution = Object.entries(yearCounts)
        .map(([year, count]) => ({
          year: Number.parseInt(year),
          count,
          percentage: (count / totalMessages) * 100,
        }))
        .sort((a, b) => a.year - b.year)

      // Attachment analysis
      const totalWithAttachments = messageTypes.image + messageTypes.video + messageTypes.audio
      const expectedAttachments = 102 // Based on your previous mention
      const attachmentMatch = Math.abs(totalWithAttachments - expectedAttachments) <= 5 // Allow small variance

      // Data quality checks
      const messagesWithContent = allMessages.filter((m) => m.content && m.content.trim().length > 0).length
      const messagesWithoutContent = totalMessages - messagesWithContent

      // Check for potential duplicates (same content, sender, and date within 1 minute)
      const duplicateCheck = allMessages.filter((msg, index) => {
        return (
          allMessages.findIndex(
            (other) =>
              other.content === msg.content &&
              other.sender === msg.sender &&
              Math.abs(new Date(other.date_sent).getTime() - new Date(msg.date_sent).getTime()) < 60000,
          ) !== index
        )
      }).length

      // Invalid dates
      const invalidDates = allMessages.filter((m) => !m.date_sent || isNaN(new Date(m.date_sent).getTime())).length

      // Import sources
      const importSources: Record<string, number> = {}
      allMessages.forEach((m) => {
        const source = m.metadata?.source || (m.original_id?.startsWith("import_") ? "csv_import" : "unknown")
        importSources[source] = (importSources[source] || 0) + 1
      })

      // Sample messages (first 5, last 5, and some with attachments)
      const sampleMessages = [
        ...allMessages.slice(0, 3),
        ...allMessages.slice(-2),
        ...allMessages.filter((m) => m.message_type === "image").slice(0, 2),
      ].map((m) => ({
        id: m.id,
        date_sent: m.date_sent,
        sender: m.sender,
        content: m.content?.substring(0, 100) + (m.content?.length > 100 ? "..." : ""),
        message_type: m.message_type,
        metadata: m.metadata,
      }))

      console.log("✅ Diagnostic complete!")

      setDiagnostic({
        connectionStatus: "success",
        totalMessages,
        dateRange: { earliest, latest, totalDays, totalYears },
        senderBreakdown,
        messageTypes,
        yearlyDistribution,
        attachmentAnalysis: { totalWithAttachments, expectedAttachments, attachmentMatch },
        dataQuality: { messagesWithContent, messagesWithoutContent, duplicateCheck, invalidDates },
        importSources,
        sampleMessages,
      })
    } catch (err) {
      console.error("❌ Diagnostic failed:", err)
      setError(err instanceof Error ? err.message : String(err))
      setDiagnostic({
        connectionStatus: "error",
        totalMessages: 0,
        dateRange: { earliest: "", latest: "", totalDays: 0, totalYears: 0 },
        senderBreakdown: { you: 0, nitzan: 0 },
        messageTypes: { text: 0, image: 0, video: 0, audio: 0, reaction: 0, other: 0 },
        yearlyDistribution: [],
        attachmentAnalysis: { totalWithAttachments: 0, expectedAttachments: 102, attachmentMatch: false },
        dataQuality: { messagesWithContent: 0, messagesWithoutContent: 0, duplicateCheck: 0, invalidDates: 0 },
        importSources: {},
        sampleMessages: [],
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    runDiagnostic()
  }, [])

  if (loading) {
    return (
      <Card className="max-w-6xl mx-auto">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin mr-3" />
          <span>Running comprehensive database diagnostic...</span>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <Card
        className={`${diagnostic?.connectionStatus === "success" ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}
      >
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-6 h-6" />
            Supabase Database Diagnostic
            {diagnostic?.connectionStatus === "success" ? (
              <CheckCircle className="w-6 h-6 text-green-600" />
            ) : (
              <AlertTriangle className="w-6 h-6 text-red-600" />
            )}
          </CardTitle>
          <div className="flex items-center justify-between">
            <p className={`${diagnostic?.connectionStatus === "success" ? "text-green-700" : "text-red-700"}`}>
              {diagnostic?.connectionStatus === "success"
                ? "✅ Database connection successful"
                : "❌ Database connection failed"}
            </p>
            <Button onClick={runDiagnostic} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Re-run Diagnostic
            </Button>
          </div>
        </CardHeader>
      </Card>

      {error && (
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-red-800">
              <AlertTriangle className="w-5 h-5" />
              <span className="font-medium">Error Details:</span>
            </div>
            <p className="text-red-700 mt-2">{error}</p>
          </CardContent>
        </Card>
      )}

      {diagnostic && diagnostic.totalMessages === 0 && (
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-yellow-800 mb-2">No Messages Found</h3>
            <p className="text-yellow-700">Your database appears to be empty. Please upload your conversation data.</p>
          </CardContent>
        </Card>
      )}

      {diagnostic && diagnostic.totalMessages > 0 && (
        <>
          {/* Overview Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Database Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-3xl font-bold text-blue-600">{diagnostic.totalMessages.toLocaleString()}</div>
                  <div className="text-sm text-gray-600">Total Messages</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-3xl font-bold text-green-600">{diagnostic.dateRange.totalYears}</div>
                  <div className="text-sm text-gray-600">Years of Data</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-3xl font-bold text-purple-600">
                    {diagnostic.dateRange.totalDays.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">Total Days</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-3xl font-bold text-orange-600">
                    {Math.round(diagnostic.totalMessages / diagnostic.dateRange.totalDays)}
                  </div>
                  <div className="text-sm text-gray-600">Messages/Day</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Date Range */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Timeline Coverage
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="text-lg font-bold text-green-700">First Message</div>
                  <div className="text-sm text-green-600">
                    {new Date(diagnostic.dateRange.earliest).toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </div>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="text-lg font-bold text-blue-700">Latest Message</div>
                  <div className="text-sm text-blue-600">
                    {new Date(diagnostic.dateRange.latest).toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sender Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Message Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center p-6 bg-blue-50 rounded-lg">
                  <div className="text-3xl font-bold text-blue-600">
                    {diagnostic.senderBreakdown.you.toLocaleString()}
                  </div>
                  <div className="text-lg font-medium text-blue-700">Your Messages</div>
                  <div className="text-sm text-blue-600">
                    {((diagnostic.senderBreakdown.you / diagnostic.totalMessages) * 100).toFixed(1)}%
                  </div>
                </div>
                <div className="text-center p-6 bg-pink-50 rounded-lg">
                  <div className="text-3xl font-bold text-pink-600">
                    {diagnostic.senderBreakdown.nitzan.toLocaleString()}
                  </div>
                  <div className="text-lg font-medium text-pink-700">Nitzan's Messages</div>
                  <div className="text-sm text-pink-600">
                    {((diagnostic.senderBreakdown.nitzan / diagnostic.totalMessages) * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Message Types */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                Message Types Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Object.entries(diagnostic.messageTypes).map(([type, count]) => (
                  <div key={type} className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-700">{count.toLocaleString()}</div>
                    <div className="text-sm text-gray-600 capitalize">{type}</div>
                    <div className="text-xs text-gray-500">
                      {((count / diagnostic.totalMessages) * 100).toFixed(1)}%
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Attachment Analysis */}
          <Card
            className={`${diagnostic.attachmentAnalysis.attachmentMatch ? "bg-green-50 border-green-200" : "bg-yellow-50 border-yellow-200"}`}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5" />
                Attachment Analysis
                {diagnostic.attachmentAnalysis.attachmentMatch ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-white rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {diagnostic.attachmentAnalysis.totalWithAttachments}
                  </div>
                  <div className="text-sm text-gray-600">Found Attachments</div>
                </div>
                <div className="text-center p-4 bg-white rounded-lg">
                  <div className="text-2xl font-bold text-gray-600">
                    {diagnostic.attachmentAnalysis.expectedAttachments}
                  </div>
                  <div className="text-sm text-gray-600">Expected</div>
                </div>
                <div className="text-center p-4 bg-white rounded-lg">
                  <div
                    className={`text-2xl font-bold ${diagnostic.attachmentAnalysis.attachmentMatch ? "text-green-600" : "text-yellow-600"}`}
                  >
                    {diagnostic.attachmentAnalysis.attachmentMatch ? "✅" : "⚠️"}
                  </div>
                  <div className="text-sm text-gray-600">Match Status</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Data Quality */}
          <Card>
            <CardHeader>
              <CardTitle>Data Quality Check</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {diagnostic.dataQuality.messagesWithContent.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">With Content</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    {diagnostic.dataQuality.messagesWithoutContent.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">Empty Messages</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">
                    {diagnostic.dataQuality.duplicateCheck.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">Potential Duplicates</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    {diagnostic.dataQuality.invalidDates.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">Invalid Dates</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Import Sources */}
          <Card>
            <CardHeader>
              <CardTitle>Import Sources</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(diagnostic.importSources).map(([source, count]) => (
                  <div key={source} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <Badge variant="outline">{source}</Badge>
                    <span className="font-medium">{count.toLocaleString()} messages</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Sample Messages */}
          <Card>
            <CardHeader>
              <CardTitle>Sample Messages</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {diagnostic.sampleMessages.map((msg, index) => (
                  <div key={msg.id} className="p-3 bg-gray-50 rounded-lg border-l-4 border-blue-300">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant={msg.sender === "you" ? "default" : "secondary"}>{msg.sender}</Badge>
                        <Badge variant="outline">{msg.message_type}</Badge>
                      </div>
                      <span className="text-xs text-gray-500">{new Date(msg.date_sent).toLocaleDateString()}</span>
                    </div>
                    <div className="text-sm text-gray-700">{msg.content}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
