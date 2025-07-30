"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, FileText, CheckCircle } from "lucide-react"

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

export default function JsonToCsvConverter() {
  const [converting, setConverting] = useState(false)
  const [csvData, setCsvData] = useState<string | null>(null)
  const [analysis, setAnalysis] = useState<any>(null)

  const convertJsonToCsv = (messages: ImportMessage[]): string => {
    // CSV headers matching our Supabase table structure
    const headers = [
      "original_id",
      "date_sent",
      "sender",
      "content",
      "message_type",
      "year",
      "month",
      "day",
      "metadata",
    ]

    // Convert messages to CSV rows
    const rows = messages
      .filter((msg) => msg.text && msg.text.trim().length > 0)
      .map((msg) => {
        const date = new Date(msg.readable_date)
        const metadata = JSON.stringify({
          message_id: msg.message_id,
          service: msg.service,
          contact_id: msg.contact_id,
          has_attachments: msg.has_attachments,
          attachment_count: msg.attachments?.length || 0,
        })

        return [
          `"${msg.guid}"`,
          `"${date.toISOString()}"`,
          `"${msg.is_from_me ? "you" : "nitzan"}"`,
          `"${msg.text.replace(/"/g, '""')}"`, // Escape quotes in content
          `"${msg.has_attachments ? "image" : "text"}"`,
          date.getFullYear(),
          date.getMonth() + 1,
          date.getDate(),
          `"${metadata.replace(/"/g, '""')}"`, // Escape quotes in JSON
        ].join(",")
      })

    return [headers.join(","), ...rows].join("\n")
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setConverting(true)
    try {
      const text = await file.text()
      const jsonData = JSON.parse(text)
      const messages = jsonData.messages || jsonData

      if (!Array.isArray(messages)) {
        throw new Error("Invalid JSON structure")
      }

      // Generate CSV
      const csv = convertJsonToCsv(messages)
      setCsvData(csv)

      // Analysis
      const validMessages = messages.filter((m) => m.text && m.text.trim().length > 0)
      setAnalysis({
        totalMessages: messages.length,
        validMessages: validMessages.length,
        fromYou: messages.filter((m) => m.is_from_me).length,
        fromNitzan: messages.filter((m) => !m.is_from_me).length,
        csvSize: (csv.length / 1024 / 1024).toFixed(1),
      })
    } catch (error) {
      console.error("Conversion error:", error)
      alert(`Error converting file: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setConverting(false)
    }
  }

  const downloadCsv = () => {
    if (!csvData) return

    const blob = new Blob([csvData], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "messages.csv"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <Card className="max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Convert JSON to CSV
        </CardTitle>
        <p className="text-sm text-gray-600">
          Convert your iMessage JSON file to CSV format for easy upload to Supabase
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Upload Section */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Select your iMessage JSON file</label>
          <input
            type="file"
            accept=".json"
            onChange={handleFileUpload}
            disabled={converting}
            className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 focus:border-blue-500 focus:outline-none cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>

        {/* Analysis Results */}
        {analysis && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="font-medium text-green-800">Conversion Successful!</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{analysis.validMessages.toLocaleString()}</div>
                <div className="text-sm text-gray-600">Valid Messages</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{analysis.csvSize} MB</div>
                <div className="text-sm text-gray-600">CSV File Size</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">Ready</div>
                <div className="text-sm text-gray-600">For Upload</div>
              </div>
            </div>
          </div>
        )}

        {/* Download Button */}
        {csvData && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-blue-800 mb-3">📥 Download CSV File</h3>
            <p className="text-sm text-blue-700 mb-4">
              Your CSV file is ready! Download it and then upload to Supabase using the dashboard.
            </p>
            <Button onClick={downloadCsv} className="w-full" size="lg">
              <Download className="w-4 h-4 mr-2" />
              Download messages.csv
            </Button>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="font-medium text-gray-800 mb-2">📋 Next Steps:</h4>
          <ol className="text-sm text-gray-600 space-y-1">
            <li>1. Download the CSV file using the button above</li>
            <li>2. Go to your Supabase Dashboard → Table Editor</li>
            <li>3. Select the "messages" table</li>
            <li>4. Click "Import data via CSV"</li>
            <li>5. Upload the downloaded CSV file</li>
            <li>6. Map the columns and import!</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  )
}
