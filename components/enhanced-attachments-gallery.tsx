"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {
  ImageIcon,
  Search,
  Calendar,
  User,
  Filter,
  Download,
  Loader2,
  RefreshCw,
  AlertCircle,
  Heart,
  Play,
  FileText,
} from "lucide-react"
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

export default function EnhancedAttachmentsGallery() {
  const [attachments, setAttachments] = useState<AttachmentMessage[]>([])
  const [filteredAttachments, setFilteredAttachments] = useState<AttachmentMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedYear, setSelectedYear] = useState<number | null>(null)
  const [selectedSender, setSelectedSender] = useState<string | null>(null)
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [stats, setStats] = useState<any>(null)
  const [selectedAttachment, setSelectedAttachment] = useState<AttachmentMessage | null>(null)

  const fetchAttachments = async () => {
    setLoading(true)
    setError(null)

    try {
      console.log("Fetching attachment messages...")

      // Get all messages and filter for attachments
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
            content.includes("file") ||
            content.includes("gif") ||
            content.includes("selfie") ||
            content.includes("pic")

          // Check for attachment count in metadata
          const hasAttachmentCount = msg.metadata?.attachment_count > 0

          return isImageType || metadataHasAttachments || hasAttachmentKeywords || hasAttachmentCount
        }) || []

      console.log("Found attachment messages:", attachmentMessages.length)

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

      const byType = attachmentMessages.reduce(
        (acc, msg) => {
          const type = getAttachmentType(msg)
          acc[type] = (acc[type] || 0) + 1
          return acc
        },
        {} as Record<string, number>,
      )

      setStats({
        total: attachmentMessages.length,
        years,
        byYear,
        bySender,
        byType,
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

    if (selectedType) {
      filtered = filtered.filter((msg) => getAttachmentType(msg) === selectedType)
    }

    setFilteredAttachments(filtered)
  }, [attachments, searchTerm, selectedYear, selectedSender, selectedType])

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

    if (
      content.includes("photo") ||
      content.includes("picture") ||
      content.includes("selfie") ||
      content.includes("pic")
    ) {
      return "Photo"
    } else if (content.includes("video") || content.includes("movie")) {
      return "Video"
    } else if (content.includes("screenshot") || content.includes("screen shot")) {
      return "Screenshot"
    } else if (content.includes("gif")) {
      return "GIF"
    } else if (content.includes("file") || content.includes("document")) {
      return "Document"
    } else if (msg.metadata?.attachment_count > 0) {
      return "Attachment"
    } else {
      return "Image"
    }
  }

  const getAttachmentIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "photo":
      case "image":
        return "📷"
      case "screenshot":
        return "📱"
      case "video":
        return "🎥"
      case "gif":
        return "🎬"
      case "document":
        return "📄"
      default:
        return "📎"
    }
  }

  const generatePlaceholderImage = (msg: AttachmentMessage, index: number) => {
    const type = getAttachmentType(msg)
    const colors = [
      "from-pink-400 to-purple-600",
      "from-blue-400 to-indigo-600",
      "from-green-400 to-teal-600",
      "from-yellow-400 to-orange-600",
      "from-red-400 to-pink-600",
      "from-purple-400 to-indigo-600",
      "from-indigo-400 to-blue-600",
      "from-teal-400 to-green-600",
    ]

    const colorClass = colors[index % colors.length]
    const isVideo = type === "Video"
    const isGif = type === "GIF"

    return (
      <div
        className={`w-full h-48 bg-gradient-to-br ${colorClass} rounded-lg flex flex-col items-center justify-center relative overflow-hidden`}
      >
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-20">
          <div
            className="w-full h-full"
            style={{
              backgroundImage: `radial-gradient(circle at 20% 50%, white 2px, transparent 2px), radial-gradient(circle at 80% 50%, white 2px, transparent 2px)`,
              backgroundSize: "30px 30px",
            }}
          />
        </div>

        {/* Content */}
        <div className="relative z-10 text-center text-white">
          {isVideo && (
            <div className="mb-2">
              <Play className="w-12 h-12 mx-auto opacity-80" />
            </div>
          )}
          {isGif && <div className="mb-2 text-2xl">🎬</div>}
          {!isVideo && !isGif && (
            <div className="mb-2">
              <ImageIcon className="w-12 h-12 mx-auto opacity-80" />
            </div>
          )}

          <div className="text-lg font-semibold mb-1">{type}</div>
          <div className="text-sm opacity-75">{msg.sender === "you" ? "Sent by You" : "Sent by Nitzan"}</div>
          <div className="text-xs opacity-60 mt-1">{new Date(msg.date_sent).toLocaleDateString()}</div>
        </div>

        {/* Heart overlay for special moments */}
        {msg.content?.includes("❤️") ||
          msg.content?.includes("💕") ||
          (msg.content?.includes("love") && (
            <div className="absolute top-2 right-2">
              <Heart className="w-6 h-6 text-white opacity-80 fill-current" />
            </div>
          ))}
      </div>
    )
  }

  if (loading) {
    return (
      <Card className="max-w-6xl mx-auto">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin mr-3" />
          <span>Loading your photo memories...</span>
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
            Your Photo & Media Gallery
            <ImageIcon className="w-6 h-6 text-purple-600" />
          </CardTitle>
          <p className="text-center text-gray-600">Every photo, video, and memory shared between you and Nitzan</p>
        </CardHeader>
        {stats && (
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                <div className="text-2xl font-bold text-purple-600">{stats.total.toLocaleString()}</div>
                <div className="text-sm text-gray-600">Total Media</div>
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
                <div className="text-sm text-gray-600">Years</div>
              </div>
            </div>

            {/* Type breakdown */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
              {Object.entries(stats.byType || {}).map(([type, count]: [string, any]) => (
                <div key={type} className="text-center p-2 bg-white rounded shadow-sm">
                  <div className="text-lg font-bold text-indigo-600">{count}</div>
                  <div className="text-xs text-gray-600">
                    {getAttachmentIcon(type)} {type}
                  </div>
                </div>
              ))}
            </div>

            {stats.earliest && stats.latest && (
              <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                <div className="text-sm font-medium text-gray-700">📅 Memory Span</div>
                <div className="text-sm text-gray-600">
                  {stats.earliest.toLocaleDateString()} - {stats.latest.toLocaleDateString()}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {Math.round((stats.latest.getTime() - stats.earliest.getTime()) / (1000 * 60 * 60 * 24 * 365))} years
                  of shared memories 💕
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
            Filter Your Memories
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search photos and videos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex flex-col md:flex-row gap-4">
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

              {/* Type Filter */}
              <div className="flex gap-2 overflow-x-auto">
                <Button
                  variant={selectedType === null ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedType(null)}
                >
                  All Types
                </Button>
                {Object.entries(stats?.byType || {}).map(([type, count]: [string, any]) => (
                  <Button
                    key={type}
                    variant={selectedType === type ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedType(type)}
                  >
                    {getAttachmentIcon(type)} {type} ({count})
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
                  Both
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
          </div>
        </CardContent>
      </Card>

      {/* Results Count */}
      <div className="text-center text-gray-600">
        Showing {filteredAttachments.length} of {attachments.length} memories
      </div>

      {/* Photo Gallery Grid */}
      {filteredAttachments.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <ImageIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">No memories found</h3>
            <p className="text-gray-500">
              {attachments.length === 0
                ? "No messages with photos or media were detected in your dataset."
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredAttachments.map((attachment, index) => {
            const attachmentType = getAttachmentType(attachment)
            const icon = getAttachmentIcon(attachmentType)

            return (
              <Dialog key={attachment.id}>
                <DialogTrigger asChild>
                  <Card className="hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:scale-105">
                    <CardContent className="p-0">
                      {/* Photo/Media Display */}
                      {generatePlaceholderImage(attachment, index)}

                      {/* Info Overlay */}
                      <div className="p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <Badge variant={attachment.sender === "you" ? "default" : "secondary"} className="text-xs">
                            <User className="w-3 h-3 mr-1" />
                            {attachment.sender === "you" ? "You" : "Nitzan"}
                          </Badge>
                          <Badge variant="outline" className="text-purple-600 border-purple-600 text-xs">
                            {icon} {attachmentType}
                          </Badge>
                        </div>

                        {/* Message Preview */}
                        <div className="text-sm text-gray-700 line-clamp-2 leading-relaxed">
                          {attachment.content || "(Photo shared)"}
                        </div>

                        {/* Date */}
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Calendar className="w-3 h-3" />
                          {formatDate(attachment.date_sent)}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </DialogTrigger>

                {/* Full View Dialog */}
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      {icon} {attachmentType} from {attachment.sender === "you" ? "You" : "Nitzan"}
                    </DialogTitle>
                  </DialogHeader>

                  <div className="space-y-6">
                    {/* Large Photo Display */}
                    <div className="w-full">{generatePlaceholderImage(attachment, index)}</div>

                    {/* Message Content */}
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Message</h4>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <p className="text-gray-800 leading-relaxed">
                            {attachment.content || "(No message text - photo only)"}
                          </p>
                        </div>
                      </div>

                      {/* Details */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Details</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Sent by:</span>
                              <span className="font-medium">{attachment.sender === "you" ? "You" : "Nitzan"}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Date:</span>
                              <span className="font-medium">{formatDate(attachment.date_sent)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Type:</span>
                              <span className="font-medium">{attachmentType}</span>
                            </div>
                          </div>
                        </div>

                        {/* Metadata */}
                        {attachment.metadata && (
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">Technical Info</h4>
                            <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded">
                              <div>Service: {attachment.metadata.service || "Unknown"}</div>
                              {attachment.metadata.has_attachments && (
                                <div>Has attachments: {String(attachment.metadata.has_attachments)}</div>
                              )}
                              {attachment.metadata.attachment_count > 0 && (
                                <div>Attachment count: {attachment.metadata.attachment_count}</div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-3 pt-4 border-t">
                        <Button className="flex-1">
                          <Download className="w-4 h-4 mr-2" />
                          Save Memory
                        </Button>
                        <Button variant="outline">
                          <Heart className="w-4 h-4 mr-2" />
                          Add to Favorites
                        </Button>
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )
          })}
        </div>
      )}

      {/* Summary Card */}
      {filteredAttachments.length > 0 && (
        <Card className="bg-gradient-to-r from-pink-50 to-purple-50 border-pink-200">
          <CardContent className="p-6 text-center">
            <h3 className="text-xl font-bold text-pink-800 mb-2">💕 Your Visual Love Story</h3>
            <p className="text-pink-700 mb-4">
              {filteredAttachments.length} beautiful memories captured and shared between you and Nitzan
            </p>
            <div className="flex justify-center gap-3">
              <Button onClick={() => window.print()} variant="outline">
                <FileText className="w-4 h-4 mr-2" />
                Print Gallery
              </Button>
              <Button>
                <Download className="w-4 h-4 mr-2" />
                Export Memories
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
