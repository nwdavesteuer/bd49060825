"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, AlertCircle, FileText, Loader2, Info, Upload } from "lucide-react"
import { supabase } from "../lib/supabase"

interface ParsedMessage {
  original_id: string
  date_sent: string
  sender: "you" | "nitzan"
  content: string
  message_type: string
  year: number
  month: number
  day: number
  has_attachments: boolean
  attachment_type?: string
  attachment_path?: string
  attachment_filename?: string
  metadata?: any
}

export default function EnhancedCsvImporter() {
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<{ imported: number; errors: number; total: number } | null>(null)
  const [analysis, setAnalysis] = useState<any>(null)
  const [preview, setPreview] = useState<ParsedMessage[]>([])
  const [parseError, setParseError] = useState<string | null>(null)
  const [progress, setProgress] = useState<number>(0)
  const [fileInfo, setFileInfo] = useState<{ name: string; size: number; type: string } | null>(null)
  const [debugInfo, setDebugInfo] = useState<any>(null)

  // Use refs for any values that shouldn't trigger re-renders
  const fileContentRef = useRef<string | null>(null)

  const parseCSV = (text: string): ParsedMessage[] => {
    const lines = text.split("\n").filter((line) => line.trim().length > 0)

    if (lines.length < 2) {
      throw new Error("CSV file must have at least a header row and one data row")
    }

    const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""))
    console.log("Headers found:", headers)

    // Find attachment column index
    const hasAttachmentsIndex = headers.findIndex((h) => h.toLowerCase() === "has_attachments")
    const attachmentTypeIndex = headers.findIndex((h) => h.toLowerCase() === "attachment_type")
    const attachmentPathIndex = headers.findIndex((h) => h.toLowerCase() === "attachment_path")
    const attachmentFilenameIndex = headers.findIndex((h) => h.toLowerCase() === "attachment_filename")

    // Debug info for attachment detection
    const attachmentDebug = {
      hasAttachmentsColumn: hasAttachmentsIndex >= 0,
      attachmentTypeColumn: attachmentTypeIndex >= 0,
      attachmentPathColumn: attachmentPathIndex >= 0,
      attachmentFilenameColumn: attachmentFilenameIndex >= 0,
      sampleValues: [],
      attachmentCounts: { "0": 0, "1": 0, other: 0 },
    }

    const messages: ParsedMessage[] = []
    let attachmentCount = 0

    // Parse all messages
    for (let i = 1; i < lines.length; i++) {
      try {
        const values = parseCSVLine(lines[i])

        if (values.length < 3) continue // Skip incomplete rows

        let message: ParsedMessage

        // Auto-detect format based on headers or content
        if (headers.includes("guid") || headers.includes("message_id")) {
          // iMessage export format
          message = parseIMessageCSV(headers, values)
        } else if (headers.includes("original_id") || headers.includes("date_sent")) {
          // Our Supabase format
          message = parseSupabaseCSV(headers, values)
        } else {
          // Generic format - try to auto-detect
          message = parseGenericCSV(values)
        }

        if (message.content && message.content.trim().length > 0) {
          messages.push(message)

          // Count attachments for debugging
          if (message.has_attachments) {
            attachmentCount++
          }

          // Track attachment field values
          if (hasAttachmentsIndex >= 0) {
            const rawAttachmentValue = values[hasAttachmentsIndex] || ""
            const cleanValue = rawAttachmentValue.toString().replace(/"/g, "").trim()

            if (cleanValue === "0") attachmentDebug.attachmentCounts["0"]++
            else if (cleanValue === "1") attachmentDebug.attachmentCounts["1"]++
            else attachmentDebug.attachmentCounts.other++
          }

          // Sample first few attachment messages for debugging
          if (message.has_attachments && attachmentDebug.sampleValues.length < 5) {
            attachmentDebug.sampleValues.push({
              content: message.content.substring(0, 30),
              has_attachments: message.has_attachments,
              attachment_type: message.attachment_type,
              attachment_path: message.attachment_path,
              attachment_filename: message.attachment_filename,
            })
          }
        }
      } catch (error) {
        console.warn(`Error parsing line ${i + 1}:`, error)
        // Continue with other lines
      }
    }

    console.log("Total messages parsed:", messages.length)
    console.log("Messages with attachments:", attachmentCount)

    setDebugInfo(attachmentDebug)
    return messages
  }

  const parseCSVLine = (line: string): string[] => {
    const values: string[] = []
    let current = ""
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
      const char = line[i]

      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"'
          i++ // Skip next quote
        } else {
          inQuotes = !inQuotes
        }
      } else if (char === "," && !inQuotes) {
        values.push(current.trim())
        current = ""
      } else {
        current += char
      }
    }

    values.push(current.trim())
    return values
  }

  const getFieldValue = (headers: string[], values: string[], fieldName: string): string => {
    // First try exact match (case insensitive)
    let index = headers.findIndex((h) => h.toLowerCase().trim() === fieldName.toLowerCase())

    // If no exact match, try includes
    if (index === -1) {
      index = headers.findIndex((h) => h.toLowerCase().includes(fieldName.toLowerCase()))
    }

    const value = index >= 0 ? values[index] : ""
    return value?.toString().replace(/"/g, "").trim() || ""
  }

  const parseIMessageCSV = (headers: string[], values: string[]): ParsedMessage => {
    const text = getFieldValue(headers, values, "text") || getFieldValue(headers, values, "content") || values[2] || ""

    // Better detection of "is_from_me" field
    const isFromMeField = getFieldValue(headers, values, "is_from_me")
    const isFromMe =
      isFromMeField === "true" ||
      isFromMeField === "1" ||
      isFromMeField === "yes" ||
      isFromMeField.toLowerCase() === "you"

    const readableDate =
      getFieldValue(headers, values, "readable_date") || getFieldValue(headers, values, "date") || values[1] || ""

    // More robust attachment detection
    const hasAttachmentsField = getFieldValue(headers, values, "has_attachments")
    const cleanAttachmentValue = hasAttachmentsField.toString().replace(/"/g, "").replace(/'/g, "").trim()
    const hasAttachments = cleanAttachmentValue === "1" || cleanAttachmentValue.toLowerCase() === "true"

    // Get attachment details
    const attachmentType = getFieldValue(headers, values, "attachment_type")
    const attachmentPath = getFieldValue(headers, values, "attachment_path")
    const attachmentFilename = getFieldValue(headers, values, "attachment_filename")

    const date = new Date(readableDate)

    return {
      original_id:
        getFieldValue(headers, values, "guid") ||
        getFieldValue(headers, values, "id") ||
        `import_${Date.now()}_${Math.random()}`,
      date_sent: date.toISOString(),
      sender: isFromMe ? "you" : "nitzan",
      content: text,
      message_type: hasAttachments ? "image" : "text",
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      day: date.getDate(),
      has_attachments: hasAttachments,
      attachment_type: hasAttachments ? attachmentType || "image" : undefined,
      attachment_path: hasAttachments ? attachmentPath || "" : undefined,
      attachment_filename: hasAttachments ? attachmentFilename || "" : undefined,
      metadata: {
        service: getFieldValue(headers, values, "service") || "iMessage",
        has_attachments: hasAttachments,
        raw_attachment_field: hasAttachmentsField,
        cleaned_attachment_field: cleanAttachmentValue,
      },
    }
  }

  const parseSupabaseCSV = (headers: string[], values: string[]): ParsedMessage => {
    const getField = (fieldName: string) => {
      const index = headers.findIndex((h) => h.toLowerCase() === fieldName.toLowerCase())
      return index >= 0 ? values[index]?.replace(/"/g, "") : ""
    }

    const hasAttachments = getField("has_attachments") === "true" || getField("has_attachments") === "1"
    const messageType = getField("message_type") || (hasAttachments ? "image" : "text")

    return {
      original_id: getField("original_id") || `import_${Date.now()}_${Math.random()}`,
      date_sent: getField("date_sent") || new Date().toISOString(),
      sender: (getField("sender") as "you" | "nitzan") || "you",
      content: getField("content") || getField("text") || "",
      message_type: messageType,
      year: Number.parseInt(getField("year")) || new Date().getFullYear(),
      month: Number.parseInt(getField("month")) || new Date().getMonth() + 1,
      day: Number.parseInt(getField("day")) || new Date().getDate(),
      has_attachments: hasAttachments,
      attachment_type: getField("attachment_type") || undefined,
      attachment_path: getField("attachment_path") || undefined,
      attachment_filename: getField("attachment_filename") || undefined,
      metadata: getField("metadata") ? JSON.parse(getField("metadata")) : {},
    }
  }

  const parseGenericCSV = (values: string[]): ParsedMessage => {
    // Assume: date, sender, content as first 3 columns
    const dateStr = values[0]?.replace(/"/g, "") || ""
    const senderStr = values[1]?.replace(/"/g, "") || ""
    const content = values[2]?.replace(/"/g, "") || ""

    const date = new Date(dateStr)
    const isFromYou = senderStr.toLowerCase().includes("you") || senderStr === "1" || senderStr === "true"

    return {
      original_id: `import_${Date.now()}_${Math.random()}`,
      date_sent: date.toISOString(),
      sender: isFromYou ? "you" : "nitzan",
      content: content,
      message_type: "text",
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      day: date.getDate(),
      has_attachments: false,
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Reset state
    setParseError(null)
    setAnalysis(null)
    setPreview([])
    setProgress(0)
    setResult(null)
    setDebugInfo(null)

    // Store file info
    setFileInfo({
      name: file.name,
      size: file.size,
      type: file.type,
    })

    try {
      console.log(`Reading CSV file: ${file.name} (${(file.size / 1024 / 1024).toFixed(1)}MB)`)

      const text = await file.text()
      fileContentRef.current = text // Store in ref to avoid re-renders
      console.log(`File read successfully. Content length: ${text.length} characters`)

      // Parse CSV
      const messages = parseCSV(text)
      console.log(`Parsed ${messages.length} messages from CSV`)

      if (messages.length === 0) {
        setParseError("No valid messages found in CSV file. Please check the format.")
        return
      }

      // Analysis
      const stats = {
        totalMessages: messages.length,
        fromYou: messages.filter((m) => m.sender === "you").length,
        fromNitzan: messages.filter((m) => m.sender === "nitzan").length,
        withAttachments: messages.filter((m) => m.has_attachments).length,
        dateRange: {
          earliest: new Date(Math.min(...messages.map((m) => new Date(m.date_sent).getTime()))),
          latest: new Date(Math.max(...messages.map((m) => new Date(m.date_sent).getTime()))),
        },
      }

      setAnalysis(stats)
      setPreview(messages.slice(0, 5))

      console.log(`Analysis complete: ${stats.totalMessages} total messages, ${stats.withAttachments} with attachments`)
    } catch (error) {
      console.error("CSV processing error:", error)
      setParseError(`Error processing CSV file: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  const importMessages = async () => {
    if (!analysis || !fileContentRef.current) return

    setImporting(true)
    setProgress(0)

    try {
      // Re-parse the file for import
      const messages = parseCSV(fileContentRef.current)

      console.log(`Starting import of ${messages.length} messages...`)

      const batchSize = 1000
      let imported = 0
      let errors = 0
      const totalBatches = Math.ceil(messages.length / batchSize)

      for (let i = 0; i < messages.length; i += batchSize) {
        const batch = messages.slice(i, i + batchSize)
        const currentBatch = Math.floor(i / batchSize) + 1

        try {
          const { error } = await supabase.from("messages").insert(batch)

          if (error) {
            console.error(`Error importing batch ${currentBatch}/${totalBatches}:`, error)
            errors += batch.length
          } else {
            imported += batch.length
            console.log(`Imported batch ${currentBatch}/${totalBatches}`)
          }
        } catch (err) {
          console.error(`Exception importing batch ${currentBatch}/${totalBatches}:`, err)
          errors += batch.length
        }

        setProgress(Math.round((currentBatch / totalBatches) * 100))
      }

      setResult({ imported, errors, total: messages.length })
    } catch (error) {
      console.error("Import error:", error)
      setResult({ imported: 0, errors: 1, total: 0 })
    } finally {
      setImporting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Enhanced CSV Importer with Attachment Support
        </CardTitle>
        <p className="text-sm text-gray-600">
          Upload your message data as a CSV file with attachment columns for complete import
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* File Upload Section */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Select your CSV file</label>
          <div className="relative">
            <input
              type="file"
              accept=".csv,.txt"
              onChange={handleFileUpload}
              disabled={importing}
              className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 focus:border-blue-500 focus:outline-none cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>
          <p className="text-xs text-gray-500">
            📁 Supports CSV files • 🔍 Auto-detects format • 🔒 Your data stays private
          </p>

          {/* Schema check warning */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Info className="w-4 h-4 text-yellow-600" />
              <span className="text-sm font-medium text-yellow-800">Check Database Schema First</span>
            </div>
            <div className="text-xs text-yellow-700">
              Make sure your database has all the required attachment columns. Visit{" "}
              <a href="/schema-mapper" className="text-blue-600 underline">
                /schema-mapper
              </a>{" "}
              to verify and fix your schema.
            </div>
          </div>
        </div>

        {/* File Info */}
        {fileInfo && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <FileText className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-800">File Information</span>
            </div>
            <div className="text-sm text-gray-700">
              <div>Name: {fileInfo.name}</div>
              <div>Size: {(fileInfo.size / 1024 / 1024).toFixed(1)} MB</div>
              <div>Type: {fileInfo.type || "text/csv"}</div>
            </div>
          </div>
        )}

        {/* Parse Error */}
        {parseError && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <span className="font-medium text-red-800">CSV Processing Error</span>
            </div>
            <div className="text-sm mb-3">
              <p>{parseError}</p>
            </div>
          </div>
        )}

        {/* Attachment Column Detection */}
        {debugInfo && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <Info className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">Attachment Column Detection</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs text-blue-700">
              <div>
                has_attachments column:{" "}
                {debugInfo.hasAttachmentsColumn ? (
                  <span className="text-green-600 font-medium">✓ Found</span>
                ) : (
                  <span className="text-red-600 font-medium">✗ Missing</span>
                )}
              </div>
              <div>
                attachment_type column:{" "}
                {debugInfo.attachmentTypeColumn ? (
                  <span className="text-green-600 font-medium">✓ Found</span>
                ) : (
                  <span className="text-red-600 font-medium">✗ Missing</span>
                )}
              </div>
              <div>
                attachment_path column:{" "}
                {debugInfo.attachmentPathColumn ? (
                  <span className="text-green-600 font-medium">✓ Found</span>
                ) : (
                  <span className="text-red-600 font-medium">✗ Missing</span>
                )}
              </div>
              <div>
                attachment_filename column:{" "}
                {debugInfo.attachmentFilenameColumn ? (
                  <span className="text-green-600 font-medium">✓ Found</span>
                ) : (
                  <span className="text-red-600 font-medium">✗ Missing</span>
                )}
              </div>
            </div>

            {debugInfo.sampleValues.length > 0 && (
              <div className="mt-2">
                <div className="text-xs font-medium text-blue-800">Sample attachment messages:</div>
                <div className="mt-1 bg-white p-2 rounded text-xs max-h-32 overflow-y-auto">
                  {debugInfo.sampleValues.map((sample: any, idx: number) => (
                    <div key={idx} className="mb-1 pb-1 border-b border-blue-100">
                      <div>
                        <span className="font-medium">Content:</span> {sample.content}...
                      </div>
                      <div>
                        <span className="font-medium">Has attachments:</span> {String(sample.has_attachments)}
                      </div>
                      {sample.attachment_type && (
                        <div>
                          <span className="font-medium">Type:</span> {sample.attachment_type}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Analysis Results */}
        {analysis && (
          <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4">
            <h3 className="text-lg font-medium text-green-800 mb-3">✅ CSV Parsed Successfully</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                <div className="text-2xl font-bold text-blue-600">{analysis.totalMessages.toLocaleString()}</div>
                <div className="text-sm text-gray-600">Total Messages</div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                <div className="text-2xl font-bold text-purple-600">{analysis.fromYou.toLocaleString()}</div>
                <div className="text-sm text-gray-600">From You</div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                <div className="text-2xl font-bold text-pink-600">{analysis.fromNitzan.toLocaleString()}</div>
                <div className="text-sm text-gray-600">From Nitzan</div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                <div
                  className={`text-2xl font-bold ${analysis.withAttachments === 102 ? "text-green-600" : "text-green-600"}`}
                >
                  {analysis.withAttachments.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">With Attachments</div>
                {analysis.withAttachments !== 102 && <div className="text-xs text-blue-600 mt-1">Expected: ~102</div>}
              </div>
            </div>

            <div className="p-3 bg-white rounded-lg shadow-sm">
              <div className="text-sm font-medium text-gray-700">📅 Date Range</div>
              <div className="text-sm text-gray-600">
                {analysis.dateRange.earliest.toLocaleDateString()} - {analysis.dateRange.latest.toLocaleDateString()}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {Math.round(
                  (analysis.dateRange.latest.getTime() - analysis.dateRange.earliest.getTime()) /
                    (1000 * 60 * 60 * 24 * 365),
                )}{" "}
                years of messages! 💕
              </div>
            </div>
          </div>
        )}

        {/* Preview Section */}
        {preview.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <span className="font-medium">Message Preview</span>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto bg-gray-50 p-3 rounded-lg">
              {preview.map((msg, index) => (
                <div key={index} className="p-3 bg-white rounded border-l-4 border-gray-300 text-sm">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`font-medium ${msg.sender === "you" ? "text-blue-600" : "text-pink-600"}`}>
                        {msg.sender === "you" ? "You" : "Nitzan"}
                      </span>
                      <span
                        className={`text-xs px-2 py-1 rounded ${msg.has_attachments ? "bg-green-200" : "bg-gray-200"}`}
                      >
                        {msg.has_attachments ? "attachment" : "text"}
                      </span>
                    </div>
                    <span className="text-gray-500 text-xs">{new Date(msg.date_sent).toLocaleDateString()}</span>
                  </div>
                  <div className="text-gray-700">{msg.content}</div>
                  {msg.has_attachments && (
                    <div className="mt-2 text-xs text-gray-500">
                      {msg.attachment_type && <span className="mr-2">Type: {msg.attachment_type}</span>}
                      {msg.attachment_filename && <span>File: {msg.attachment_filename}</span>}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Import Button */}
            <div className="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200 rounded-lg p-6">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-6 h-6 text-green-600" />
                <span className="text-lg font-medium text-green-800">Ready to Import!</span>
              </div>
              <p className="text-sm text-green-700 mb-4">
                CSV parsed successfully! This will import {analysis?.totalMessages.toLocaleString()} messages spanning{" "}
                {Math.round(
                  (analysis?.dateRange.latest.getTime() - analysis?.dateRange.earliest.getTime()) /
                    (1000 * 60 * 60 * 24 * 365),
                )}{" "}
                years of your relationship.
              </p>
              <Button onClick={importMessages} disabled={importing} className="w-full" size="lg">
                {importing ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Importing Messages...
                  </span>
                ) : (
                  `Import ${analysis?.totalMessages.toLocaleString()} Messages`
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Import Progress */}
        {importing && (
          <div className="text-center p-6 bg-blue-50 rounded-lg border-2 border-blue-200">
            <div>
              <div className="text-lg font-medium text-blue-800 mb-2">Importing your messages... 💕</div>
              <div className="text-sm text-blue-600">Processing in batches for optimal performance</div>
              <div className="mt-4">
                <div className="bg-blue-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-blue-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <div className="text-sm text-blue-800 mt-1">{progress}% complete</div>
              </div>
            </div>
          </div>
        )}

        {/* Import Results */}
        {result && (
          <div
            className={`p-6 rounded-lg border-2 ${
              result.errors === 0
                ? "bg-green-50 text-green-700 border-green-200"
                : "bg-yellow-50 text-yellow-700 border-yellow-200"
            }`}
          >
            <div className="flex items-center gap-2 mb-3">
              {result.errors === 0 ? <CheckCircle className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
              <div className="text-xl font-medium">Import Complete! 🎉</div>
            </div>
            <div className="space-y-2 text-lg">
              <div>✅ Successfully imported: {result.imported.toLocaleString()} messages</div>
              <div>📊 Total processed: {result.total.toLocaleString()} messages</div>
              {result.errors > 0 && <div>⚠️ Errors: {result.errors.toLocaleString()}</div>}
            </div>
            <div className="mt-4 p-4 bg-white rounded border">
              <div className="text-lg font-medium text-gray-800">🎨 Ready for Visualizations!</div>
              <div className="text-sm text-gray-600 mt-1">
                Your message data is now safely stored in your database. You can now create beautiful timelines, word
                clouds, and relationship phase analysis for your book!
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
