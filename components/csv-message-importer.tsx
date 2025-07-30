"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Upload, CheckCircle, AlertCircle, FileText, Loader2, Info } from "lucide-react"
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
  metadata?: any
}

export default function CsvMessageImporter() {
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<{ imported: number; errors: number; total: number } | null>(null)
  const [analysis, setAnalysis] = useState<any>(null)
  const [preview, setPreview] = useState<ParsedMessage[]>([])
  const [parseError, setParseError] = useState<string | null>(null)
  const [progress, setProgress] = useState<number>(0)
  const [fileInfo, setFileInfo] = useState<{ name: string; size: number; type: string } | null>(null)
  const [debugInfo, setDebugInfo] = useState<any>(null)

  const parseCSV = (text: string): ParsedMessage[] => {
    const lines = text.split("\n").filter((line) => line.trim().length > 0)

    if (lines.length < 2) {
      throw new Error("CSV file must have at least a header row and one data row")
    }

    const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""))
    console.log("=== CSV PARSING DEBUG ===")
    console.log("Headers found:", headers)
    console.log("Total lines:", lines.length)

    // Find attachment column index
    const attachmentColumnIndex = headers.findIndex((h) => h.toLowerCase().includes("attachment"))
    const hasAttachmentsIndex = headers.findIndex((h) => h.toLowerCase() === "has_attachments")

    console.log("Attachment column search:")
    console.log("- 'attachment' found at index:", attachmentColumnIndex)
    console.log("- 'has_attachments' found at index:", hasAttachmentsIndex)
    console.log("- Header at attachment index:", headers[attachmentColumnIndex])
    console.log("- Header at has_attachments index:", headers[hasAttachmentsIndex])

    // Debug info for attachment detection
    const attachmentDebug = {
      hasAttachmentsColumn: headers.includes("has_attachments"),
      attachmentsColumn: headers.includes("attachments"),
      headerIndex: attachmentColumnIndex,
      hasAttachmentsIndex: hasAttachmentsIndex,
      sampleValues: [],
      attachmentCounts: { "0": 0, "1": 0, other: 0 },
    }

    const messages: ParsedMessage[] = []
    let attachmentCount = 0

    // Sample first 10 rows for debugging
    for (let i = 1; i < Math.min(lines.length, 11); i++) {
      const values = parseCSVLine(lines[i])
      const attachmentField = values[hasAttachmentsIndex] || values[attachmentColumnIndex] || "not found"

      console.log(`Row ${i} debug:`)
      console.log("- Raw line:", lines[i].substring(0, 100) + "...")
      console.log("- Parsed values count:", values.length)
      console.log("- Attachment field value:", `"${attachmentField}"`)
      console.log("- Attachment field type:", typeof attachmentField)

      attachmentDebug.sampleValues.push({
        row: i,
        attachmentField: attachmentField,
        rawValue: values[attachmentColumnIndex] || "not found",
        hasAttachmentsValue: values[hasAttachmentsIndex] || "not found",
        allValues: values.slice(0, 5), // First 5 values for context
      })
    }

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
          if (message.message_type === "image") {
            attachmentCount++
            if (attachmentCount <= 5) {
              // Log first 5 attachment messages
              console.log(`Attachment message ${attachmentCount}:`, {
                content: message.content.substring(0, 50),
                metadata: message.metadata,
              })
            }
          }

          // Track attachment field values - FIXED
          const rawAttachmentValue = values[hasAttachmentsIndex] || values[attachmentColumnIndex] || ""
          const cleanValue = rawAttachmentValue.toString().replace(/"/g, "").trim()

          if (cleanValue === "0") attachmentDebug.attachmentCounts["0"]++
          else if (cleanValue === "1") attachmentDebug.attachmentCounts["1"]++
          else attachmentDebug.attachmentCounts.other++
        }
      } catch (error) {
        console.warn(`Error parsing line ${i + 1}:`, error)
        // Continue with other lines
      }
    }

    console.log("=== FINAL ATTACHMENT DEBUG ===")
    console.log("Total messages parsed:", messages.length)
    console.log("Messages with attachments:", attachmentCount)
    console.log("Attachment field value counts:", attachmentDebug.attachmentCounts)
    console.log("Expected attachment count: 102")

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

    // If still not found, try direct index lookup for has_attachments (it should be column 6)
    if (index === -1 && fieldName.toLowerCase() === "has_attachments") {
      index = 6 // Based on your header order
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

    // IMPROVED: More robust attachment detection
    const hasAttachmentsField = getFieldValue(headers, values, "has_attachments")

    // Additional debugging
    console.log("ATTACHMENT DEBUG for row:", {
      hasAttachmentsField: `"${hasAttachmentsField}"`,
      fieldType: typeof hasAttachmentsField,
      fieldLength: hasAttachmentsField.length,
      charCodes: [...hasAttachmentsField].map((c) => c.charCodeAt(0)),
      rawValue: values[6], // Direct access to column 6
      allValues: values.slice(0, 12), // Show first 12 columns
    })

    // Clean and normalize the attachment value
    const cleanAttachmentValue = hasAttachmentsField.toString().replace(/"/g, "").replace(/'/g, "").trim()

    // FIXED: Simplified and more reliable attachment detection
    const hasAttachments = cleanAttachmentValue === "1"

    // Enhanced logging for debugging
    console.log("FINAL ATTACHMENT DECISION:", {
      originalField: hasAttachmentsField,
      cleanValue: cleanAttachmentValue,
      hasAttachments: hasAttachments,
      messagePreview: text.substring(0, 50),
    })

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
      metadata: {
        service: getFieldValue(headers, values, "service") || "iMessage",
        has_attachments: hasAttachments,
        raw_attachment_field: hasAttachmentsField,
        cleaned_attachment_field: cleanAttachmentValue,
        attachment_field_type: typeof hasAttachmentsField,
        column_6_direct: values[6], // Direct column access for debugging
      },
    }
  }

  const parseSupabaseCSV = (headers: string[], values: string[]): ParsedMessage => {
    const getField = (fieldName: string) => {
      const index = headers.findIndex((h) => h.toLowerCase() === fieldName.toLowerCase())
      return index >= 0 ? values[index]?.replace(/"/g, "") : ""
    }

    return {
      original_id: getField("original_id") || `import_${Date.now()}_${Math.random()}`,
      date_sent: getField("date_sent") || new Date().toISOString(),
      sender: (getField("sender") as "you" | "nitzan") || "you",
      content: getField("content") || getField("text") || "",
      message_type: getField("message_type") || "text",
      year: Number.parseInt(getField("year")) || new Date().getFullYear(),
      month: Number.parseInt(getField("month")) || new Date().getMonth() + 1,
      day: Number.parseInt(getField("day")) || new Date().getDate(),
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
      console.log(`File read successfully. Content length: ${text.length} characters`)

      // Parse CSV
      const messages = parseCSV(text)
      console.log(`Parsed ${messages.length} messages from CSV`)

      // Log the first few rows for debugging
      const lines = text.split("\n").filter((line) => line.trim().length > 0)
      const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""))
      console.log("First row headers:", headers)

      if (messages.length > 0) {
        console.log("First message parsed:", messages[0])

        const senderDistribution = {
          you: messages.filter((m) => m.sender === "you").length,
          nitzan: messages.filter((m) => m.sender === "nitzan").length,
        }

        const messageTypes = {
          text: messages.filter((m) => m.message_type === "text").length,
          image: messages.filter((m) => m.message_type === "image").length,
        }

        console.log("Sender distribution:", senderDistribution)
        console.log("Message types:", messageTypes)

        // Log some attachment examples
        const attachmentMessages = messages.filter((m) => m.message_type === "image").slice(0, 5)
        console.log("Sample attachment messages:", attachmentMessages)
      }

      if (messages.length === 0) {
        setParseError("No valid messages found in CSV file. Please check the format.")
        return
      }

      // Analysis
      const stats = {
        totalMessages: messages.length,
        fromYou: messages.filter((m) => m.sender === "you").length,
        fromNitzan: messages.filter((m) => m.sender === "nitzan").length,
        withAttachments: messages.filter((m) => m.message_type === "image").length,
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
    if (!analysis) return

    setImporting(true)
    setProgress(0)

    try {
      // Re-parse the file for import
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
      const file = fileInput?.files?.[0]
      if (!file) return

      const text = await file.text()
      const messages = parseCSV(text)

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

  useEffect(() => {
    const checkDatabase = async () => {
      // Async code here
    }

    checkDatabase()
  }, [])

  return (
    <Card className="max-w-3xl mx-auto shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Import CSV Messages to Supabase
        </CardTitle>
        <p className="text-sm text-gray-600">Upload your message data as a CSV file - supports multiple formats</p>
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

          {/* Expected attachment count warning */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Info className="w-4 h-4 text-yellow-600" />
              <span className="text-sm font-medium text-yellow-800">Expected: 102 messages with attachments</span>
            </div>
            <div className="text-xs text-yellow-700">
              If the count doesn't match, check that your CSV has a "has_attachments" column with values of exactly "1"
              for messages with attachments and "0" for text-only messages.
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
          <div className="mt-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <span className="font-medium text-red-800">CSV Processing Error</span>
            </div>
            <div className="text-sm mb-3">
              <p>{parseError}</p>
            </div>
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
                  className={`text-2xl font-bold ${analysis.withAttachments === 102 ? "text-green-600" : "text-red-600"}`}
                >
                  {analysis.withAttachments.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">With Attachments</div>
                {analysis.withAttachments !== 102 && <div className="text-xs text-red-600 mt-1">Expected: 102</div>}
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

        {/* Debug Information */}
        {debugInfo && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <Info className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-800">Attachment Detection Debug</span>
            </div>
            <div className="text-xs text-gray-700 space-y-1">
              <div>Has "has_attachments" column: {debugInfo.hasAttachmentsColumn ? "✅ Yes" : "❌ No"}</div>
              <div>Sample attachment field values:</div>
              <div className="bg-gray-100 p-2 rounded max-h-32 overflow-y-auto">
                {debugInfo.sampleValues.map((sample: any, idx: number) => (
                  <div key={idx} className="text-xs">
                    Row {sample.row}: "{sample.attachmentField}" (raw: "{sample.rawValue}")
                  </div>
                ))}
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
                        className={`text-xs px-2 py-1 rounded ${msg.message_type === "image" ? "bg-green-200" : "bg-gray-200"}`}
                      >
                        {msg.message_type}
                      </span>
                      {msg.metadata?.raw_attachment_field && (
                        <span className="text-xs bg-yellow-200 px-2 py-1 rounded">
                          attachment: "{msg.metadata.raw_attachment_field}"
                        </span>
                      )}
                    </div>
                    <span className="text-gray-500 text-xs">{new Date(msg.date_sent).toLocaleDateString()}</span>
                  </div>
                  <div className="text-gray-700">{msg.content}</div>
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
              {analysis?.withAttachments !== 102 && (
                <div className="bg-yellow-100 border border-yellow-300 rounded p-3 mb-4">
                  <div className="text-sm text-yellow-800">
                    ⚠️ Attachment count mismatch: Found {analysis?.withAttachments}, expected 102. Check the debug info
                    above to verify your CSV format.
                  </div>
                </div>
              )}
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
