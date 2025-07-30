"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search, AlertCircle, CheckCircle, Database } from "lucide-react"
import { supabase } from "../lib/supabase"

interface AttachmentAnalysis {
  totalMessages: number
  messageTypes: Record<string, number>
  metadataAnalysis: {
    hasAttachmentsTrue: number
    hasAttachmentsFalse: number
    hasAttachmentsOther: number
    sampleMetadata: any[]
  }
  sampleMessages: any[]
  rawAttachmentData: any[]
}

export default function AttachmentDebugger() {
  const [analysis, setAnalysis] = useState<AttachmentAnalysis | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const analyzeAttachments = async () => {
    setLoading(true)
    setError(null)

    try {
      // Get all messages with their metadata
      const { data: allMessages, error: messagesError } = await supabase
        .from("messages")
        .select("*")
        .order("date_sent", { ascending: true })

      if (messagesError) throw messagesError

      if (!allMessages || allMessages.length === 0) {
        setError("No messages found in database")
        return
      }

      console.log("=== ATTACHMENT ANALYSIS ===")
      console.log("Total messages in database:", allMessages.length)

      // Analyze message types
      const messageTypes: Record<string, number> = {}
      allMessages.forEach((msg) => {
        const type = msg.message_type || "unknown"
        messageTypes[type] = (messageTypes[type] || 0) + 1
      })

      console.log("Message types distribution:", messageTypes)

      // Analyze metadata for attachment info
      let hasAttachmentsTrue = 0
      let hasAttachmentsFalse = 0
      let hasAttachmentsOther = 0
      const sampleMetadata: any[] = []

      allMessages.forEach((msg, index) => {
        if (msg.metadata) {
          const hasAttachments = msg.metadata.has_attachments

          if (hasAttachments === true || hasAttachments === "true" || hasAttachments === 1 || hasAttachments === "1") {
            hasAttachmentsTrue++
          } else if (
            hasAttachments === false ||
            hasAttachments === "false" ||
            hasAttachments === 0 ||
            hasAttachments === "0"
          ) {
            hasAttachmentsFalse++
          } else {
            hasAttachmentsOther++
          }

          // Collect sample metadata for first 20 messages
          if (index < 20) {
            sampleMetadata.push({
              messageId: msg.id,
              content: msg.content?.substring(0, 50) + "...",
              messageType: msg.message_type,
              metadata: msg.metadata,
              hasAttachmentsValue: hasAttachments,
              hasAttachmentsType: typeof hasAttachments,
            })
          }
        }
      })

      // Find messages that should have attachments
      const potentialAttachmentMessages = allMessages.filter((msg) => {
        const content = (msg.content || "").toLowerCase()
        const hasAttachmentKeywords =
          content.includes("photo") ||
          content.includes("image") ||
          content.includes("picture") ||
          content.includes("attachment") ||
          content.includes("sent you") ||
          content.includes("shared")

        const metadataHasAttachments =
          msg.metadata?.has_attachments === true ||
          msg.metadata?.has_attachments === "true" ||
          msg.metadata?.has_attachments === 1 ||
          msg.metadata?.has_attachments === "1"

        return hasAttachmentKeywords || metadataHasAttachments || msg.message_type === "image"
      })

      console.log("Messages with potential attachments:", potentialAttachmentMessages.length)

      // Get sample of these messages
      const sampleMessages = potentialAttachmentMessages.slice(0, 10).map((msg) => ({
        id: msg.id,
        content: msg.content,
        messageType: msg.message_type,
        sender: msg.sender,
        date: msg.date_sent,
        metadata: msg.metadata,
        hasAttachmentsInMetadata: msg.metadata?.has_attachments,
        rawAttachmentField: msg.metadata?.raw_attachment_field,
      }))

      // Look for any messages with "image" type specifically
      const imageTypeMessages = allMessages.filter((msg) => msg.message_type === "image")
      console.log("Messages with type 'image':", imageTypeMessages.length)

      // Raw attachment data analysis
      const rawAttachmentData = allMessages.slice(0, 50).map((msg) => ({
        id: msg.id,
        messageType: msg.message_type,
        content: msg.content?.substring(0, 100),
        metadata: msg.metadata,
        hasAttachmentsValue: msg.metadata?.has_attachments,
        rawAttachmentField: msg.metadata?.raw_attachment_field,
        attachmentCount: msg.metadata?.attachment_count,
      }))

      setAnalysis({
        totalMessages: allMessages.length,
        messageTypes,
        metadataAnalysis: {
          hasAttachmentsTrue,
          hasAttachmentsFalse,
          hasAttachmentsOther,
          sampleMetadata,
        },
        sampleMessages,
        rawAttachmentData,
      })
    } catch (err) {
      console.error("Error analyzing attachments:", err)
      setError(err instanceof Error ? err.message : "Failed to analyze attachments")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    analyzeAttachments()
  }, [])

  const fixAttachmentTypes = async () => {
    if (!analysis) return

    setLoading(true)
    try {
      // Update messages that have attachment metadata but wrong type
      const { error } = await supabase
        .from("messages")
        .update({ message_type: "image" })
        .or("metadata->>has_attachments.eq.true,metadata->>has_attachments.eq.1")

      if (error) throw error

      // Re-analyze after fix
      await analyzeAttachments()

      alert("Attachment types updated! Check the analysis again.")
    } catch (err) {
      console.error("Error fixing attachment types:", err)
      setError(err instanceof Error ? err.message : "Failed to fix attachment types")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-6 h-6" />
            Attachment Detection Analysis
          </CardTitle>
          <p className="text-gray-600">Deep dive into your message data to find and fix attachment detection</p>
        </CardHeader>
      </Card>

      {loading && (
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
            <span>Analyzing your message data...</span>
          </CardContent>
        </Card>
      )}

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-red-800">
              <AlertCircle className="w-5 h-5" />
              <span className="font-medium">Error: {error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {analysis && (
        <>
          {/* Overview Stats */}
          <Card>
            <CardHeader>
              <CardTitle>📊 Overview Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{analysis.totalMessages.toLocaleString()}</div>
                  <div className="text-sm text-gray-600">Total Messages</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{analysis.messageTypes.image || 0}</div>
                  <div className="text-sm text-gray-600">Type: "image"</div>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {analysis.metadataAnalysis.hasAttachmentsTrue}
                  </div>
                  <div className="text-sm text-gray-600">Metadata: has_attachments=true</div>
                </div>
                <div className="text-center p-3 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">{analysis.sampleMessages.length}</div>
                  <div className="text-sm text-gray-600">Potential Attachments</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Message Types Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>📋 Message Types Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(analysis.messageTypes).map(([type, count]) => (
                  <div
                    key={type}
                    className={`p-3 rounded-lg text-center ${
                      type === "image" ? "bg-green-100 border-green-300" : "bg-gray-100"
                    }`}
                  >
                    <div className="font-bold text-lg">{count}</div>
                    <div className="text-sm text-gray-600">"{type}"</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Metadata Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>🔍 Metadata Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-xl font-bold text-green-600">{analysis.metadataAnalysis.hasAttachmentsTrue}</div>
                  <div className="text-sm text-gray-600">has_attachments: true</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-xl font-bold text-gray-600">{analysis.metadataAnalysis.hasAttachmentsFalse}</div>
                  <div className="text-sm text-gray-600">has_attachments: false</div>
                </div>
                <div className="text-center p-3 bg-red-50 rounded-lg">
                  <div className="text-xl font-bold text-red-600">{analysis.metadataAnalysis.hasAttachmentsOther}</div>
                  <div className="text-sm text-gray-600">Other values</div>
                </div>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto">
                <h4 className="font-medium">Sample Metadata (First 20 messages):</h4>
                {analysis.metadataAnalysis.sampleMetadata.map((sample, index) => (
                  <div key={index} className="p-2 bg-gray-50 rounded text-sm">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="font-medium">
                          Message {index + 1}: {sample.content}
                        </div>
                        <div className="text-xs text-gray-600">Type: {sample.messageType}</div>
                      </div>
                      <div className="text-right">
                        <Badge
                          variant={
                            sample.hasAttachmentsValue === true ||
                            sample.hasAttachmentsValue === "true" ||
                            sample.hasAttachmentsValue === 1 ||
                            sample.hasAttachmentsValue === "1"
                              ? "default"
                              : "outline"
                          }
                        >
                          {String(sample.hasAttachmentsValue)} ({sample.hasAttachmentsType})
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Potential Attachment Messages */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>📎 Messages with Potential Attachments</span>
                {analysis.metadataAnalysis.hasAttachmentsTrue > 0 && analysis.messageTypes.image === 0 && (
                  <Button onClick={fixAttachmentTypes} className="bg-green-600 hover:bg-green-700">
                    Fix Attachment Types
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analysis.sampleMessages.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No messages with attachment indicators found</div>
              ) : (
                <div className="space-y-3">
                  {analysis.sampleMessages.map((msg, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <Badge variant={msg.sender === "you" ? "default" : "secondary"}>
                            {msg.sender === "you" ? "You" : "Nitzan"}
                          </Badge>
                          <Badge variant="outline" className="ml-2">
                            Type: {msg.messageType}
                          </Badge>
                          {msg.hasAttachmentsInMetadata && (
                            <Badge className="ml-2 bg-green-600">
                              Metadata: has_attachments = {String(msg.hasAttachmentsInMetadata)}
                            </Badge>
                          )}
                        </div>
                        <span className="text-sm text-gray-500">{new Date(msg.date).toLocaleDateString()}</span>
                      </div>
                      <div className="text-gray-800 mb-2">{msg.content}</div>
                      {msg.metadata && (
                        <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                          <strong>Metadata:</strong> {JSON.stringify(msg.metadata, null, 2)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Raw Data Sample */}
          <Card>
            <CardHeader>
              <CardTitle>🔧 Raw Data Sample (First 50 messages)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {analysis.rawAttachmentData.map((msg, index) => (
                  <div key={index} className="p-2 bg-gray-50 rounded text-xs font-mono">
                    <div>
                      <strong>ID:</strong> {msg.id}
                    </div>
                    <div>
                      <strong>Type:</strong> {msg.messageType}
                    </div>
                    <div>
                      <strong>Content:</strong> {msg.content}
                    </div>
                    <div>
                      <strong>has_attachments:</strong> {String(msg.hasAttachmentsValue)} (
                      {typeof msg.hasAttachmentsValue})
                    </div>
                    {msg.rawAttachmentField && (
                      <div>
                        <strong>raw_attachment_field:</strong> {String(msg.rawAttachmentField)}
                      </div>
                    )}
                    {msg.attachmentCount && (
                      <div>
                        <strong>attachment_count:</strong> {msg.attachmentCount}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-6">
              <div className="text-center space-y-4">
                <h3 className="text-lg font-bold text-blue-800">🔧 Debug Actions</h3>
                <div className="flex flex-wrap justify-center gap-3">
                  <Button onClick={analyzeAttachments} variant="outline">
                    <Database className="w-4 h-4 mr-2" />
                    Re-analyze Data
                  </Button>
                  {analysis.metadataAnalysis.hasAttachmentsTrue > 0 && (
                    <Button onClick={fixAttachmentTypes} className="bg-green-600 hover:bg-green-700">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Fix Message Types
                    </Button>
                  )}
                </div>
                <p className="text-sm text-blue-700">
                  If you see messages with has_attachments=true but message_type="text", click "Fix Message Types" to
                  correct them.
                </p>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
