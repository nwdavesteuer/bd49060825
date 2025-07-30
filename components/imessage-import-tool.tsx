"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Upload, CheckCircle, AlertCircle, FileText, BarChart3, Database } from "lucide-react"
import { importiMessageData, analyzeMessageData, type MessageExportFormat } from "../lib/message-import"

export default function IMessageImportTool() {
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<{ imported: number; errors: number; total: number } | null>(null)
  const [analysis, setAnalysis] = useState<any>(null)
  const [preview, setPreview] = useState<any[]>([])
  const [parseError, setParseError] = useState<string | null>(null)

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setParseError(null)

    try {
      const text = await file.text()
      console.log("Parsing JSON file...")

      // Try to parse the JSON
      let jsonData: MessageExportFormat
      try {
        jsonData = JSON.parse(text)
      } catch (parseErr) {
        console.error("JSON parse error:", parseErr)
        setParseError("Could not parse JSON file. Please check the format.")
        return
      }

      console.log("JSON parsed successfully")

      // Check if the structure matches what we expect
      if (!jsonData.messages && !Array.isArray(jsonData)) {
        console.error("Unexpected JSON structure:", Object.keys(jsonData))
        setParseError("JSON structure doesn't match expected format. Looking for 'messages' array.")
        return
      }

      // Get messages array
      const messages = jsonData.messages || jsonData

      if (!Array.isArray(messages)) {
        console.error("Messages is not an array:", typeof messages)
        setParseError("Expected messages to be an array.")
        return
      }

      console.log(`Found ${messages.length} messages`)

      // Analyze the data
      const stats = analyzeMessageData(jsonData)
      setAnalysis(stats)

      // Show preview of first few messages
      const validMessages = Array.isArray(messages) ? messages.filter((m) => m.text && m.text.trim().length > 0) : []

      setPreview(validMessages.slice(0, 5))

      console.log(`Analyzed ${validMessages.length} valid messages`)
    } catch (error) {
      console.error("File processing error:", error)
      setParseError(`Error processing file: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  const startImport = async () => {
    if (!analysis) return

    setImporting(true)
    try {
      // Get all messages from the file again
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
      const file = fileInput?.files?.[0]
      if (!file) return

      const text = await file.text()
      const jsonData = JSON.parse(text)

      const importResult = await importiMessageData(jsonData)
      setResult(importResult)
    } catch (error: any) {
      console.error("Import error:", error)
      alert(`Import error: ${error.message}`)
      setResult({ imported: 0, errors: 1, total: 0 })
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Instructions Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <Database className="w-5 h-5" />
            How to Import Your Messages
          </CardTitle>
        </CardHeader>
        <CardContent className="text-blue-700">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <span className="bg-blue-200 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                1
              </span>
              <div>
                <div className="font-medium">Locate your JSON file</div>
                <div className="text-sm">Find the iMessage export JSON file on your computer</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="bg-blue-200 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                2
              </span>
              <div>
                <div className="font-medium">Click "Choose File" below</div>
                <div className="text-sm">Select your JSON file to analyze it</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="bg-blue-200 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                3
              </span>
              <div>
                <div className="font-medium">Review the analysis</div>
                <div className="text-sm">Check the message count and preview to make sure it looks right</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="bg-blue-200 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                4
              </span>
              <div>
                <div className="font-medium">Click "Import Messages"</div>
                <div className="text-sm">Start the import process (this may take a few minutes)</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Import Tool */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Import Your iMessage Data
          </CardTitle>
          <p className="text-sm text-gray-600">Upload your JSON file to import your message history with Nitzan</p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* File Upload Section */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Step 1: Select your iMessage JSON file</label>
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

            {parseError && (
              <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                <div className="font-medium mb-1">Error parsing file:</div>
                <div>{parseError}</div>
                <div className="mt-2 text-xs">
                  Expected format: JSON with a "messages" array or an array of message objects
                </div>
              </div>
            )}
          </div>

          {/* Analysis Results */}
          {analysis && (
            <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg text-green-800">
                  <BarChart3 className="w-5 h-5" />
                  Step 2: Your Data Analysis ✅
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                    <div className="text-2xl font-bold text-blue-600">{analysis.totalMessages.toLocaleString()}</div>
                    <div className="text-sm text-gray-600">Total Messages</div>
                  </div>
                  <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                    <div className="text-2xl font-bold text-green-600">
                      {analysis.messagesWithText.toLocaleString()}
                    </div>
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 bg-white rounded-lg shadow-sm">
                    <div className="text-sm font-medium text-gray-700">📅 Date Range</div>
                    <div className="text-sm text-gray-600">
                      {analysis.dateRange.earliest?.toLocaleDateString()} -{" "}
                      {analysis.dateRange.latest?.toLocaleDateString()}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {analysis.dateRange.earliest && analysis.dateRange.latest
                        ? Math.round(
                            (analysis.dateRange.latest.getTime() - analysis.dateRange.earliest.getTime()) /
                              (1000 * 60 * 60 * 24 * 365),
                          )
                        : 0}{" "}
                      years of love! 💕
                    </div>
                  </div>
                  <div className="p-3 bg-white rounded-lg shadow-sm">
                    <div className="text-sm font-medium text-gray-700">📱 Message Types</div>
                    <div className="text-sm text-gray-600">{analysis.services?.join(", ") || "SMS, iMessage"}</div>
                    {analysis.withAttachments > 0 && (
                      <div className="text-xs text-gray-500 mt-1">
                        📎 {analysis.withAttachments.toLocaleString()} with attachments
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Preview Section */}
          {preview.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                <span className="font-medium">Step 3: Message Preview (looks good!)</span>
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
                  <span className="text-lg font-medium text-green-800">Step 4: Ready to Import!</span>
                </div>
                <p className="text-sm text-green-700 mb-4">
                  Everything looks perfect! This will import {analysis?.messagesWithText.toLocaleString()} messages
                  spanning{" "}
                  {analysis?.dateRange.earliest && analysis?.dateRange.latest
                    ? Math.round(
                        (analysis.dateRange.latest.getTime() - analysis.dateRange.earliest.getTime()) /
                          (1000 * 60 * 60 * 24 * 365),
                      )
                    : 0}{" "}
                  years of your beautiful relationship with Nitzan.
                </p>
                <Button onClick={startImport} disabled={importing} className="w-full" size="lg">
                  {importing ? (
                    <span className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Importing Your Love Story...
                    </span>
                  ) : (
                    `🚀 Import ${analysis?.messagesWithText.toLocaleString()} Messages`
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Import Progress */}
          {importing && (
            <div className="text-center p-6 bg-blue-50 rounded-lg border-2 border-blue-200">
              <div className="animate-pulse">
                <div className="text-lg font-medium text-blue-800">Importing your love story... 💕</div>
                <div className="text-sm mt-2 text-blue-600">Processing messages in batches for optimal performance</div>
                <div className="text-xs mt-1 text-gray-600">This may take a few minutes for large datasets</div>
                <div className="mt-3">
                  <div className="bg-blue-200 rounded-full h-2 overflow-hidden">
                    <div className="bg-blue-500 h-full rounded-full animate-pulse"></div>
                  </div>
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
    </div>
  )
}
