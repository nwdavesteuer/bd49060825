"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search, AlertCircle, ImageIcon } from "lucide-react"
import { supabase } from "../lib/supabase"

interface ImageDataAnalysis {
  totalAttachments: number
  sampleAttachments: any[]
  metadataStructure: any[]
  possibleImagePaths: string[]
  attachmentTypes: Record<string, number>
}

export default function ImageDataAnalyzer() {
  const [analysis, setAnalysis] = useState<ImageDataAnalysis | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const analyzeImageData = async () => {
    setLoading(true)
    setError(null)

    try {
      // Get messages with attachments
      const { data: attachmentMessages, error: attachmentError } = await supabase
        .from("fulldata_set")
        .select("*")
        .eq("has_attachments", 1)
        .limit(50)

      if (attachmentError) throw attachmentError

      console.log("=== IMAGE DATA ANALYSIS ===")
      console.log("Messages with attachments:", attachmentMessages?.length || 0)

      if (!attachmentMessages || attachmentMessages.length === 0) {
        setError("No attachment messages found")
        return
      }

      // Analyze metadata structure
      const metadataStructure = attachmentMessages.slice(0, 10).map((msg, index) => ({
        messageIndex: index,
        id: msg.message_id,
        content: msg.text?.substring(0, 100),
        metadata: msg.attachments_info,
        metadataKeys: msg.attachments_info ? Object.keys({ attachments_info: msg.attachments_info }) : [],
        hasAttachments: msg.attachments_info ? [msg.attachments_info] : [],
        attachmentCount: msg.has_attachments === 1 ? 1 : 0,
      }))

      // Look for possible image paths or URLs
      const possibleImagePaths: string[] = []
      const attachmentTypes: Record<string, number> = {}

      attachmentMessages.forEach((msg) => {
        // Check attachments_info for image paths
        if (msg.attachments_info) {
          possibleImagePaths.push(msg.attachments_info)
        }

        // Check for image references in content
        const content = msg.text || ""
        const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".heic", ".webp", ".bmp"]
        imageExtensions.forEach((ext) => {
          if (content.toLowerCase().includes(ext)) {
            possibleImagePaths.push(content)
          }
        })
      })

      // Sample attachments for detailed view
      const sampleAttachments = attachmentMessages.slice(0, 20).map((msg) => ({
        id: msg.message_id,
        content: msg.text,
        sender: msg.sender,
        date: msg.readable_date,
        messageType: msg.has_attachments ? 'attachment' : 'text',
        metadata: msg.attachments_info,
        attachments: msg.attachments_info ? [msg.attachments_info] : [],
        attachmentCount: msg.has_attachments === 1 ? 1 : 0,
        hasAttachmentsFlag: msg.has_attachments,
      }))

      setAnalysis({
        totalAttachments: attachmentMessages.length,
        sampleAttachments,
        metadataStructure,
        possibleImagePaths: [...new Set(possibleImagePaths)], // Remove duplicates
        attachmentTypes,
      })

      console.log("Analysis complete:", {
        totalAttachments: attachmentMessages.length,
        uniqueImagePaths: [...new Set(possibleImagePaths)].length,
        attachmentTypes,
      })
    } catch (err) {
      console.error("Error analyzing image data:", err)
      setError(err instanceof Error ? err.message : "Failed to analyze image data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    analyzeImageData()
  }, [])

  if (loading) {
    return (
      <Card className="max-w-4xl mx-auto">
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
          <span>Analyzing image data...</span>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="max-w-4xl mx-auto border-red-200 bg-red-50">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 text-red-800">
            <AlertCircle className="w-5 h-5" />
            <span className="font-medium">Error: {error}</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-6 h-6" />
            Image Data Analysis
          </CardTitle>
          <p className="text-gray-600">Let's see what actual image data we have in your messages</p>
        </CardHeader>
      </Card>

      {analysis && (
        <>
          {/* Overview */}
          <Card>
            <CardHeader>
              <CardTitle>📊 Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{analysis.totalAttachments}</div>
                  <div className="text-sm text-gray-600">Messages with Attachments</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{analysis.possibleImagePaths.length}</div>
                  <div className="text-sm text-gray-600">Possible Image Paths</div>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {Object.keys(analysis.attachmentTypes).length}
                  </div>
                  <div className="text-sm text-gray-600">Attachment Types</div>
                </div>
                <div className="text-center p-3 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">{analysis.metadataStructure.length}</div>
                  <div className="text-sm text-gray-600">Sample Messages</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Possible Image Paths */}
          <Card>
            <CardHeader>
              <CardTitle>🖼️ Possible Image Paths Found</CardTitle>
            </CardHeader>
            <CardContent>
              {analysis.possibleImagePaths.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <ImageIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No image paths or URLs found in the data</p>
                  <p className="text-sm mt-2">
                    This suggests the export only contains text references, not actual image files
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {analysis.possibleImagePaths.map((path, index) => (
                    <div key={index} className="p-2 bg-gray-50 rounded text-sm font-mono break-all">
                      {path}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Attachment Types */}
          {Object.keys(analysis.attachmentTypes).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>📎 Attachment Types</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {Object.entries(analysis.attachmentTypes).map(([type, count]) => (
                    <div key={type} className="p-3 bg-gray-50 rounded text-center">
                      <div className="font-bold text-lg">{count}</div>
                      <div className="text-sm text-gray-600">"{type}"</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Sample Metadata Structure */}
          <Card>
            <CardHeader>
              <CardTitle>🔍 Sample Attachment Metadata</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {analysis.sampleAttachments.map((sample, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <Badge variant={sample.sender === "you" ? "default" : "secondary"}>
                          {sample.sender === "you" ? "You" : "Nitzan"}
                        </Badge>
                        <Badge variant="outline" className="ml-2">
                          Type: {sample.messageType}
                        </Badge>
                        {sample.hasAttachmentsFlag && (
                          <Badge className="ml-2 bg-green-600">
                            has_attachments: {String(sample.hasAttachmentsFlag)}
                          </Badge>
                        )}
                      </div>
                      <span className="text-sm text-gray-500">{new Date(sample.date).toLocaleDateString()}</span>
                    </div>

                    <div className="mb-3">
                      <div className="text-sm font-medium text-gray-700">Message Content:</div>
                      <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded mt-1">
                        {sample.content || "(No text content)"}
                      </div>
                    </div>

                    {sample.attachments && sample.attachments.length > 0 && (
                      <div className="mb-3">
                        <div className="text-sm font-medium text-gray-700">Attachments Array:</div>
                        <div className="text-xs bg-gray-50 p-2 rounded mt-1 font-mono">
                          {JSON.stringify(sample.attachments, null, 2)}
                        </div>
                      </div>
                    )}

                    {sample.metadata && (
                      <div>
                        <div className="text-sm font-medium text-gray-700">Full Metadata:</div>
                        <div className="text-xs bg-gray-50 p-2 rounded mt-1 font-mono max-h-32 overflow-y-auto">
                          {JSON.stringify(sample.metadata, null, 2)}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recommendations */}
          <Card className="bg-yellow-50 border-yellow-200">
            <CardHeader>
              <CardTitle className="text-yellow-800">💡 Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-yellow-800">
                {analysis.possibleImagePaths.length === 0 ? (
                  <>
                    <p className="font-medium">❌ No actual image files found in your data</p>
                    <div className="text-sm space-y-2">
                      <p>
                        Your iMessage export appears to contain only text references to images, not the actual image
                        files. This is common with most export tools.
                      </p>
                      <p>
                        <strong>To display real photos, you would need to:</strong>
                      </p>
                      <ul className="list-disc list-inside space-y-1 ml-4">
                        <li>Manually export photos from your Photos app</li>
                        <li>Upload them to a cloud storage service (like Vercel Blob, Cloudinary, etc.)</li>
                        <li>Match them to messages by date/time</li>
                        <li>Update the database with image URLs</li>
                      </ul>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="font-medium">✅ Found some image references!</p>
                    <div className="text-sm">
                      <p>We found {analysis.possibleImagePaths.length} potential image paths. These might be:</p>
                      <ul className="list-disc list-inside space-y-1 ml-4">
                        <li>Local file paths on your device</li>
                        <li>iMessage attachment identifiers</li>
                        <li>Temporary file references</li>
                      </ul>
                      <p className="mt-2">
                        To display these images, you'd need to locate the actual files and upload them to a hosting
                        service.
                      </p>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-6 text-center">
              <h3 className="text-lg font-bold text-blue-800 mb-4">🎨 Alternative Solutions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-white rounded-lg">
                  <h4 className="font-medium mb-2">📱 Keep Beautiful Placeholders</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Use our colorful, themed placeholders that represent your photos beautifully
                  </p>
                  <Button onClick={() => (window.location.href = "/attachments")} className="w-full">
                    View Placeholder Gallery
                  </Button>
                </div>
                <div className="p-4 bg-white rounded-lg">
                  <h4 className="font-medium mb-2">📊 Focus on Data Insights</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Explore message patterns, timelines, and relationship insights instead
                  </p>
                  <Button onClick={() => (window.location.href = "/timeline")} variant="outline" className="w-full">
                    View Message Timeline
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
