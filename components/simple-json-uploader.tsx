"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Upload, CheckCircle, AlertCircle, FileText, Loader2, Info } from "lucide-react"
import { supabase } from "../lib/supabase"

interface ImportMessage {
  message_id: number
  guid: string
  text: string
  date: number
  date_read?: number
  is_from_me: boolean
  has_attachments: boolean
  contact_id: string
  service: string
  readable_date: string
  attachments: any[]
}

interface MessageExportFormat {
  metadata: {
    contact_identifier: string
    extraction_date: string
    total_messages: number
    date_range: {
      start: string
      end: string
    }
    conversation_stats: {
      total_messages: number
      sent_messages: number
      received_messages: number
      messages_with_attachments: number
      daily_message_counts: Record<string, number>
    }
  }
  messages: ImportMessage[]
}

export default function SimpleJsonUploader() {
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<{ imported: number; errors: number; total: number } | null>(null)
  const [analysis, setAnalysis] = useState<any>(null)
  const [preview, setPreview] = useState<ImportMessage[]>([])
  const [parseError, setParseError] = useState<string | null>(null)
  const [progress, setProgress] = useState<number>(0)
  const [fileInfo, setFileInfo] = useState<{ name: string; size: number; type: string } | null>(null)

  const validateJsonFile = (text: string): { isValid: boolean; error?: string; preview?: string } => {
    // Check if file is empty
    if (!text || text.trim().length === 0) {
      return { isValid: false, error: "File is empty" }
    }

    // Check file size (basic validation)
    if (text.length < 100) {
      return { isValid: false, error: "File seems too small to contain message data" }
    }

    // Check if it starts and ends with proper JSON characters
    const trimmed = text.trim()
    if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) {
      return { isValid: false, error: "File doesn't appear to be valid JSON (should start with { or [)" }
    }

    if (!trimmed.endsWith("}") && !trimmed.endsWith("]")) {
      return {
        isValid: false,
        error: "File appears to be incomplete (doesn't end with } or ])",
        preview: `File ends with: "${trimmed.slice(-50)}"`,
      }
    }

    // Check for common JSON issues
    const openBraces = (text.match(/{/g) || []).length
    const closeBraces = (text.match(/}/g) || []).length
    const openBrackets = (text.match(/\[/g) || []).length
    const closeBrackets = (text.match(/\]/g) || []).length

    if (openBraces !== closeBraces) {
      return {
        isValid: false,
        error: `Mismatched braces: ${openBraces} opening { vs ${closeBraces} closing }`,
      }
    }

    if (openBrackets !== closeBrackets) {
      return {
        isValid: false,
        error: `Mismatched brackets: ${openBrackets} opening [ vs ${closeBrackets} closing ]`,
      }
    }

    return { isValid: true }
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

    // Store file info
    setFileInfo({
      name: file.name,
      size: file.size,
      type: file.type,
    })

    try {
      console.log(`Reading file: ${file.name} (${(file.size / 1024 / 1024).toFixed(1)}MB)`)

      // Read file with better error handling
      let text: string
      try {
        text = await file.text()
      } catch (readError) {
        setParseError(`Failed to read file: ${readError instanceof Error ? readError.message : String(readError)}`)
        return
      }

      console.log(`File read successfully. Content length: ${text.length} characters`)

      // Validate JSON structure before parsing
      const validation = validateJsonFile(text)
      if (!validation.isValid) {
        setParseError(validation.error || "File validation failed")
        if (validation.preview) {
          console.log("File preview:", validation.preview)
        }
        return
      }

      console.log("File validation passed, attempting to parse JSON...")

      // Parse JSON with better error handling
      let jsonData: MessageExportFormat
      try {
        jsonData = JSON.parse(text)
      } catch (parseErr) {
        console.error("JSON parse error:", parseErr)
        let errorMessage = "Could not parse JSON file."

        if (parseErr instanceof Error) {
          if (parseErr.message.includes("Unexpected end")) {
            errorMessage =
              "JSON file appears to be incomplete or corrupted. The file may have been cut off during export."
          } else if (parseErr.message.includes("Unexpected token")) {
            errorMessage = `JSON syntax error: ${parseErr.message}. There may be invalid characters in the file.`
          } else {
            errorMessage = `JSON parse error: ${parseErr.message}`
          }
        }

        setParseError(errorMessage)
        return
      }

      console.log("JSON parsed successfully")

      // Check if the structure matches what we expect
      if (!jsonData.messages && !Array.isArray(jsonData)) {
        console.error("Unexpected JSON structure:", Object.keys(jsonData))
        setParseError(
          `JSON structure doesn't match expected format. Found keys: ${Object.keys(jsonData).join(", ")}. Expected 'messages' array.`,
        )
        return
      }

      // Get messages array
      const messages = jsonData.messages || jsonData

      if (!Array.isArray(messages)) {
        console.error("Messages is not an array:", typeof messages)
        setParseError(`Expected messages to be an array, but got ${typeof messages}.`)
        return
      }

      if (messages.length === 0) {
        setParseError("No messages found in the file.")
        return
      }

      console.log(`Found ${messages.length} messages`)

      // Basic analysis
      const validMessages = messages.filter((m) => m && m.text && m.text.trim().length > 0)
      const stats = {
        totalMessages: messages.length,
        messagesWithText: validMessages.length,
        fromYou: messages.filter((m) => m && m.is_from_me).length,
        fromNitzan: messages.filter((m) => m && !m.is_from_me).length,
        withAttachments: messages.filter((m) => m && m.has_attachments).length,
        dateRange: {
          earliest: validMessages.length > 0 ? new Date(validMessages[0].readable_date) : null,
          latest: validMessages.length > 0 ? new Date(validMessages[validMessages.length - 1].readable_date) : null,
        },
      }

      setAnalysis(stats)

      // Show preview of first few messages
      setPreview(validMessages.slice(0, 5))

      console.log(`Analyzed ${validMessages.length} valid messages`)
    } catch (error) {
      console.error("File processing error:", error)
      setParseError(`Unexpected error processing file: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  const importMessages = async () => {
    if (!analysis) return

    setImporting(true)
    setProgress(0)
    try {
      // Get all messages from the file again
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
      const file = fileInput?.files?.[0]
      if (!file) return

      const text = await file.text()
      const jsonData = JSON.parse(text)
      const messages = jsonData.messages || jsonData

      // Convert to our format
      const convertedMessages = messages
        .filter((msg: ImportMessage) => msg && msg.text && msg.text.trim().length > 0)
        .map((msg: ImportMessage) => {
          const date = new Date(msg.readable_date)
          return {
            original_id: msg.guid,
            date_sent: date.toISOString(),
            sender: msg.is_from_me ? "you" : "nitzan",
            content: msg.text,
            message_type: msg.has_attachments ? "image" : "text",
            year: date.getFullYear(),
            month: date.getMonth() + 1,
            day: date.getDate(),
            metadata: {
              message_id: msg.message_id,
              service: msg.service,
              contact_id: msg.contact_id,
              has_attachments: msg.has_attachments,
              attachment_count: msg.attachments?.length || 0,
            },
          }
        })

      console.log(`Starting import of ${convertedMessages.length} messages...`)

      const batchSize = 1000
      let imported = 0
      let errors = 0
      const totalBatches = Math.ceil(convertedMessages.length / batchSize)

      for (let i = 0; i < convertedMessages.length; i += batchSize) {
        const batch = convertedMessages.slice(i, i + batchSize)
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

        // Update progress
        setProgress(Math.round((currentBatch / totalBatches) * 100))
      }

      setResult({ imported, errors, total: convertedMessages.length })
    } catch (error) {
      console.error("Import error:", error)
      setResult({ imported: 0, errors: 1, total: 0 })
    } finally {
      setImporting(false)
    }
  }

  return (
    <Card className="max-w-3xl mx-auto shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Upload JSON to Supabase
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* File Upload Section */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Select your iMessage JSON file</label>
          <div className="relative">
            <input
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              disabled={importing}
              className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 focus:border-blue-500 focus:outline-none cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>
          <p className="text-xs text-gray-500">
            📁 Supports JSON files up to 100MB • 🔒 Your data stays private in your database
          </p>

          {/* File Info */}
          {fileInfo && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Info className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">File Information</span>
              </div>
              <div className="text-sm text-blue-700">
                <div>Name: {fileInfo.name}</div>
                <div>Size: {(fileInfo.size / 1024 / 1024).toFixed(1)} MB</div>
                <div>Type: {fileInfo.type || "application/json"}</div>
              </div>
            </div>
          )}

          {/* Parse Error */}
          {parseError && (
            <div className="mt-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <span className="font-medium text-red-800">File Processing Error</span>
              </div>
              <div className="text-sm mb-3">
                <p>{parseError}</p>
              </div>
              <div className="text-xs text-red-600 bg-red-100 p-3 rounded">
                <p className="font-medium mb-2">💡 Troubleshooting Tips:</p>
                <ul className="space-y-1">
                  <li>• Make sure the file export completed successfully</li>
                  <li>• Check that the file isn't corrupted or truncated</li>
                  <li>• Try re-exporting the data if possible</li>
                  <li>• Verify the file opens correctly in a text editor</li>
                  <li>• If the file is very large, try exporting a smaller date range first</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Analysis Results */}
        {analysis && (
          <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4">
            <h3 className="text-lg font-medium text-green-800 mb-3">✅ File Analysis Successful</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                <div className="text-2xl font-bold text-blue-600">{analysis.totalMessages.toLocaleString()}</div>
                <div className="text-sm text-gray-600">Total Messages</div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                <div className="text-2xl font-bold text-green-600">{analysis.messagesWithText.toLocaleString()}</div>
                <div className="text-sm text-gray-600">Valid Messages</div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                <div className="text-2xl font-bold text-purple-600">{analysis.fromYou.toLocaleString()}</div>
                <div className="text-sm text-gray-600">From You</div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                <div className="text-2xl font-bold text-pink-600">{analysis.fromNitzan.toLocaleString()}</div>
                <div className="text-sm text-gray-600">From Nitzan</div>
              </div>
            </div>

            {analysis.dateRange.earliest && analysis.dateRange.latest && (
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
                  years of love! 💕
                </div>
              </div>
            )}
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
                      <span className={`font-medium ${msg.is_from_me ? "text-blue-600" : "text-pink-600"}`}>
                        {msg.is_from_me ? "You" : "Nitzan"}
                      </span>
                      <span className="text-xs bg-gray-200 px-2 py-1 rounded">{msg.service}</span>
                      {msg.has_attachments && <span className="text-xs bg-yellow-200 px-2 py-1 rounded">📎</span>}
                    </div>
                    <span className="text-gray-500 text-xs">{new Date(msg.readable_date).toLocaleDateString()}</span>
                  </div>
                  <div className="text-gray-700">{msg.text}</div>
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
                Everything looks good! This will import {analysis?.messagesWithText.toLocaleString()} messages spanning{" "}
                {analysis?.dateRange.earliest && analysis?.dateRange.latest
                  ? Math.round(
                      (analysis.dateRange.latest.getTime() - analysis.dateRange.earliest.getTime()) /
                        (1000 * 60 * 60 * 24 * 365),
                    )
                  : 0}{" "}
                years of your relationship.
              </p>
              <Button onClick={importMessages} disabled={importing} className="w-full" size="lg">
                {importing ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Importing Messages...
                  </span>
                ) : (
                  `Import ${analysis?.messagesWithText.toLocaleString()} Messages`
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
