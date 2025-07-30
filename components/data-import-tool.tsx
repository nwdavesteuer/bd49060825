"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Upload, CheckCircle, AlertCircle, FileText } from "lucide-react"
import { supabase } from "../lib/supabase"

interface ImportMessage {
  date: string
  sender: "you" | "nitzan"
  content: string
  type?: string
}

export default function DataImportTool() {
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<{ imported: number; errors: number } | null>(null)
  const [preview, setPreview] = useState<ImportMessage[]>([])

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      const jsonData = JSON.parse(text)

      // Show preview of first few messages
      const validMessages = validateMessageData(jsonData)
      setPreview(validMessages.slice(0, 5))

      console.log(`Found ${validMessages.length} valid messages out of ${jsonData.length} total`)
    } catch (error) {
      console.error("File parsing error:", error)
      alert("Error parsing JSON file. Please check the format.")
    }
  }

  const validateMessageData = (data: any[]): ImportMessage[] => {
    return data.filter((item) => {
      return (
        item.date &&
        item.sender &&
        (item.sender === "you" || item.sender === "nitzan") &&
        typeof item.content === "string"
      )
    })
  }

  const importMessages = async () => {
    if (preview.length === 0) return

    setImporting(true)
    try {
      const batchSize = 1000
      let imported = 0
      let errors = 0

      // Get all messages from the file again
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
      const file = fileInput?.files?.[0]
      if (!file) return

      const text = await file.text()
      const jsonData = JSON.parse(text)
      const validMessages = validateMessageData(jsonData)

      for (let i = 0; i < validMessages.length; i += batchSize) {
        const batch = validMessages.slice(i, i + batchSize)

        const formattedBatch = batch.map((msg, index) => {
          const date = new Date(msg.date)
          return {
            original_id: `import_${i + index}`,
            date_sent: date.toISOString(),
            sender: msg.sender,
            content: msg.content || "",
            message_type: msg.type || "text",
            year: date.getFullYear(),
            month: date.getMonth() + 1,
            day: date.getDate(),
          }
        })

        const { error } = await supabase.from("messages").insert(formattedBatch)

        if (error) {
          console.error(`Error importing batch ${i / batchSize + 1}:`, error)
          errors += batch.length
        } else {
          imported += batch.length
          console.log(`Imported batch ${i / batchSize + 1}/${Math.ceil(validMessages.length / batchSize)}`)
        }
      }

      setResult({ imported, errors })
    } catch (error) {
      console.error("Import error:", error)
      setResult({ imported: 0, errors: 1 })
    } finally {
      setImporting(false)
    }
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Import Your Message Data
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Select your JSON file:</label>
          <input
            type="file"
            accept=".json"
            onChange={handleFileUpload}
            disabled={importing}
            className="w-full p-2 border rounded"
          />
        </div>

        {preview.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <span className="font-medium">Preview (first 5 messages):</span>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {preview.map((msg, index) => (
                <div key={index} className="p-2 bg-gray-50 rounded text-sm">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium">{msg.sender}</span>
                    <span className="text-gray-500">{new Date(msg.date).toLocaleDateString()}</span>
                  </div>
                  <div className="text-gray-700">{msg.content.substring(0, 100)}...</div>
                </div>
              ))}
            </div>
            <Button onClick={importMessages} disabled={importing} className="w-full">
              {importing ? "Importing..." : `Import ${preview.length}+ Messages`}
            </Button>
          </div>
        )}

        {importing && (
          <div className="text-center text-blue-600 p-4 bg-blue-50 rounded">
            Importing messages... This may take a few minutes for large datasets.
          </div>
        )}

        {result && (
          <div
            className={`p-4 rounded flex items-center gap-2 ${
              result.errors === 0 ? "bg-green-50 text-green-700" : "bg-yellow-50 text-yellow-700"
            }`}
          >
            {result.errors === 0 ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <div>
              <div className="font-medium">Import Complete!</div>
              <div>✅ Imported: {result.imported} messages</div>
              {result.errors > 0 && <div>⚠️ Errors: {result.errors}</div>}
            </div>
          </div>
        )}

        <div className="text-sm text-gray-600 p-3 bg-gray-50 rounded">
          <strong>Expected JSON format:</strong>
          <pre className="mt-2 text-xs">
            {`[
  {
    "date": "2014-03-15T14:30:00Z",
    "sender": "you",
    "content": "Hey beautiful!",
    "type": "text"
  }
]`}
          </pre>
        </div>
      </CardContent>
    </Card>
  )
}
