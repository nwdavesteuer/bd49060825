"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ImageIcon, Search, Calendar, User, Filter, Download, Eye, Loader2, RefreshCw, AlertCircle } from "lucide-react"
import { supabase } from "../lib/supabase"

interface AttachmentMessage {
  id: string
  original_id: string
  date_sent: string
  sender: "you" | "nitzan"
  content: string
  message_type: string
  year: number
  month: number
  day: number
  metadata: any
}

export default function AttachmentsGallery() {
  const [attachments, setAttachments] = useState<AttachmentMessage[]>([])
  const [filteredAttachments, setFilteredAttachments] = useState<AttachmentMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedYear, setSelectedYear] = useState<number | null>(null)
  const [selectedSender, setSelectedSender] = useState<string | null>(null)
  const [stats, setStats] = useState<any>(null)

  const fetchAttachments = async () => {
    setLoading(true)
    setError(null)

    try {
      console.log("Fetching attachment messages...")

      // First, let's get all messages and see what we have
      const { data: allMessages, error: allError } = await supabase
        .from("messages")
        .select("*")
        .order("date_sent", { ascending: false })

      if (allError) throw allError

      console.log("Total messages in database:", allMessages?.length || 0)

      // Find messages with attachments using multiple criteria
      const attachmentMessages =
        allMessages?.filter((msg) => {
          // Check message_type
          const isImageType = msg.message_type === "image"

          // Check metadata for attachment indicators
          const metadataHasAttachments =
            msg.metadata?.has_attachments === true ||
            msg.metadata?.has_attachments === "true" ||
            msg.metadata?.has_attachments === 1 ||
            msg.metadata?.has_attachments === "1"

          // Check content for attachment keywords
          const content = (msg.content || "").toLowerCase()
          const hasAttachmentKeywords =
            content.includes("photo") ||
            content.includes("image") ||
            content.includes("picture") ||
            content.includes("attachment") ||
            content.includes("sent you") ||
            content.includes("shared") ||
            content.includes("screenshot") ||
            content.includes("video") ||
            content.includes("file")

          // Check for attachment count in metadata
          const hasAttachmentCount = msg.metadata?.attachment_count > 0

          return isImageType || metadataHasAttachments || hasAttachmentKeywords || hasAttachmentCount
        }) || []

      console.log("Found attachment messages:", attachmentMessages.length)

      // Log some examples for debugging
      if (attachmentMessages.length > 0) {
        console.log("Sample attachment messages:")
        attachmentMessages.slice(0, 5).forEach((msg, index) => {
          console.log(`${index + 1}:`, {
            content: msg.content?.substring(0, 100),
            type: msg.message_type,
            metadata: msg.metadata,
            sender: msg.sender,
          })
        })
      }

      setAttachments(attachmentMessages)
      setFilteredAttachments(attachmentMessages)

      // Calculate stats
      const years = [...new Set(attachmentMessages.map((msg) => msg.year))].sort()
      const byYear = attachmentMessages.reduce(
        (acc, msg) => {
          acc[msg.year] = (acc[msg.year] || 0) + 1
          return acc
        },
        {} as Record<number, number>,
      )

      const bySender = attachmentMessages.reduce(
        (acc, msg) => {
          acc[msg.sender] = (acc[msg.sender] || 0) + 1
          return acc
        },
        {} as Record<string, number>,
      )

      setStats({
        total: attachmentMessages.length,
        years,
        byYear,
        bySender,
        earliest:
          attachmentMessages.length > 0 ? new Date(attachmentMessages[attachmentMessages.length - 1].date_sent) : null,
        latest: attachmentMessages.length > 0 ? new Date(attachmentMessages[0].date_sent) : null,
      })
    } catch (err) {
      console.error("Error fetching attachments:", err)
      setError(err instanceof Error ? err.message : "Failed to load attachments")
    } finally {
      setLoading(false)
    }
  }

  // Filter attachments based on search and filters
  useEffect(() => {
    let filtered = attachments

    if (searchTerm) {
      filtered = filtered.filter((msg) => msg.content?.toLowerCase().includes(searchTerm.toLowerCase()))
    }

    if (selectedYear) {
      filtered = filtered.filter((msg) => msg.year === selectedYear)
    }

    if (selectedSender) {
      filtered = filtered.filter((msg) => msg.sender === selectedSender)
    }

    setFilteredAttachments(filtered)
  }, [attachments, searchTerm, selectedYear, selectedSender])

  useEffect(() => {
    fetchAttachments()
  }, [])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getAttachmentType = (msg: AttachmentMessage) => {
    const content = (msg.content || "").toLowerCase()

    if (content.includes("photo") || content.includes("image") || content.includes("picture")) {
      return "Photo"
    } else if (content.includes("video")) {
      return "Video"
    } else if (content.includes("screenshot")) {
      return "Screenshot"
    } else if (content.includes("file") || content.includes("document")) {
      return "File"
    } else if (msg.metadata?.attachment_count > 0) {
      return "Attachment"
    } else {
      return "Media"
    }
  }

  const getAttachmentIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "photo":
      case "screenshot":
        return "📷"
      case "video":
        return "🎥"
      case "file":
        return "📄"
      default:
        return "📎"
    }
  }

  if (loading) {
    return (
      <Card className="max-w-6xl mx-auto">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin mr-3" />
          <span>Loading attachments...</span>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="max-w-6xl mx-auto">
        <CardContent className="py-12">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <div className="text-red-600 mb-4">Error loading attachments: {error}</div>
            <Button onClick={fetchAttachments} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header with Stats */}
      <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-center justify-center">
            <ImageIcon className="w-6 h-6 text-purple-600" />
            All Attachments & Media
            <ImageIcon className="w-6 h-6 text-purple-600" />
          </CardTitle>
          <p className="text-center text-gray-600">Every photo, video, and file shared in your conversation</p>
        </CardHeader>
        {stats && (
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                <div className="text-2xl font-bold text-purple-600">{stats.total.toLocaleString()}</div>
                <div className="text-sm text-gray-600">Total Attachments</div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                <div className="text-2xl font-bold text-blue-600">{stats.bySender?.you || 0}</div>
                <div className="text-sm text-gray-600">From You</div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                <div className="text-2xl font-bold text-pink-600">{stats.bySender?.nitzan || 0}</div>
                <div className="text-sm text-gray-600">From Nitzan</div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                <div className="text-2xl font-bold text-green-600">{stats.years?.length || 0}</div>
                <div className="text-sm text-gray-600">Years Span</div>
              </div>
            </div>

            {stats.earliest && stats.latest && (
              <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                <div className="text-sm font-medium text-gray-700">📅 Date Range</div>
                <div className="text-sm text-gray-600">
                  {stats.earliest.toLocaleDateString()} - {stats.latest.toLocaleDateString()}
                </div>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search attachment content..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Year Filter */}
            <div className="flex gap-2 overflow-x-auto">
              <Button
                variant={selectedYear === null ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedYear(null)}
              >
                All Years
              </Button>
              {stats?.years?.map((year: number) => (
                <Button
                  key={year}
                  variant={selectedYear === year ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedYear(year)}
                >
                  {year} ({stats.byYear[year]})
                </Button>
              ))}
            </div>

            {/* Sender Filter */}
            <div className="flex gap-2">
              <Button
                variant={selectedSender === null ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedSender(null)}
              >
                All
              </Button>
              <Button
                variant={selectedSender === "you" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedSender("you")}
              >
                You
              </Button>
              <Button
                variant={selectedSender === "nitzan" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedSender("nitzan")}
              >
                Nitzan
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Count */}
      <div className="text-center text-gray-600">
        Showing {filteredAttachments.length} of {attachments.length} attachments
      </div>

      {/* Attachments Grid */}
      {filteredAttachments.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <ImageIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">No attachments found</h3>
            <p className="text-gray-500">
              {attachments.length === 0
                ? "No messages with attachments were detected in your dataset."
                : "Try adjusting your filters to see more results."}
            </p>
            {attachments.length === 0 && (
              <Button onClick={fetchAttachments} className="mt-4" variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh Data
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAttachments.map((attachment) => {
            const attachmentType = getAttachmentType(attachment)
            const icon = getAttachmentIcon(attachmentType)

            return (
              <Card key={attachment.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <Badge variant={attachment.sender === "you" ? "default" : "secondary"}>
                      <User className="w-3 h-3 mr-1" />
                      {attachment.sender === "you" ? "You" : "Nitzan"}
                    </Badge>
                    <Badge variant="outline" className="text-purple-600 border-purple-600">
                      {icon} {attachmentType}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Attachment Placeholder */}
                  <div className="w-full h-48 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex flex-col items-center justify-center border-2 border-dashed border-gray-300">
                    <ImageIcon className="w-12 h-12 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-500 font-medium">{attachmentType}</span>
                    <span className="text-xs text-gray-400">
                      {attachment.metadata?.attachment_count > 0 &&
                        `${attachment.metadata.attachment_count} file${attachment.metadata.attachment_count > 1 ? "s" : ""}`}
                    </span>
                  </div>

                  {/* Message Content */}
                  <div className="space-y-2">
                    <div className="text-sm text-gray-800 leading-relaxed">
                      {attachment.content || "(No message text)"}
                    </div>

                    {/* Date and Time */}
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Calendar className="w-3 h-3" />
                      {formatDate(attachment.date_sent)}
                    </div>

                    {/* Metadata Info */}
                    {attachment.metadata && (
                      <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                        <div className="font-medium mb-1">Metadata:</div>
                        <div>Service: {attachment.metadata.service || "Unknown"}</div>
                        {attachment.metadata.has_attachments && (
                          <div>Has attachments: {String(attachment.metadata.has_attachments)}</div>
                        )}
                        {attachment.metadata.attachment_count > 0 && (
                          <div>Attachment count: {attachment.metadata.attachment_count}</div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2">
                    <Button size="sm" variant="outline" className="flex-1">
                      <Eye className="w-3 h-3 mr-1" />
                      View Details
                    </Button>
                    <Button size="sm" variant="outline">
                      <Download className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Load More Button (if needed) */}
      {filteredAttachments.length > 0 && filteredAttachments.length < attachments.length && (
        <div className="text-center">
          <Button
            variant="outline"
            onClick={() => {
              // Could implement pagination here
            }}
          >
            Load More Attachments
          </Button>
        </div>
      )}
    </div>
  )
}
