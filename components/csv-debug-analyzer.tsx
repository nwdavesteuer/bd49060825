"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Search, Copy, CheckCircle } from "lucide-react"

export default function CsvDebugAnalyzer() {
  const [fileContent, setFileContent] = useState<string>("")
  const [analysis, setAnalysis] = useState<any>(null)
  const [copied, setCopied] = useState(false)

  const analyzeCSV = (text: string) => {
    const lines = text.split("\n").filter((line) => line.trim().length > 0)

    if (lines.length < 2) {
      return { error: "CSV file must have at least a header row and one data row" }
    }

    // Parse header
    const headerLine = lines[0]
    const headers = headerLine.split(",").map((h) => h.trim().replace(/"/g, ""))

    // Find attachment-related columns
    const attachmentColumns = headers
      .map((header, index) => ({
        index,
        header,
        isAttachmentRelated: header.toLowerCase().includes("attachment"),
      }))
      .filter((col) => col.isAttachmentRelated)

    // Parse first 20 data rows for analysis
    const sampleRows = []
    const attachmentValues = new Map()

    for (let i = 1; i < Math.min(lines.length, 21); i++) {
      const line = lines[i]
      const values = parseCSVLine(line)

      // Get attachment field values
      const attachmentData = {}
      attachmentColumns.forEach((col) => {
        const value = values[col.index] || ""
        attachmentData[col.header] = {
          raw: value,
          cleaned: value.replace(/"/g, ""),
          type: typeof value,
          length: value.length,
        }

        // Count values
        const cleanValue = value.replace(/"/g, "")
        attachmentValues.set(cleanValue, (attachmentValues.get(cleanValue) || 0) + 1)
      })

      sampleRows.push({
        rowNumber: i,
        line: line.substring(0, 200) + (line.length > 200 ? "..." : ""),
        values: values.slice(0, 10), // First 10 columns
        attachmentData,
      })
    }

    // Count total attachment values in entire file
    const totalAttachmentCounts = new Map()
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i])
      attachmentColumns.forEach((col) => {
        const value = (values[col.index] || "").replace(/"/g, "")
        totalAttachmentCounts.set(value, (totalAttachmentCounts.get(value) || 0) + 1)
      })
    }

    return {
      totalLines: lines.length,
      headerLine,
      headers,
      attachmentColumns,
      sampleRows,
      attachmentValueCounts: Object.fromEntries(attachmentValues),
      totalAttachmentCounts: Object.fromEntries(totalAttachmentCounts),
      expectedAttachments: 102,
    }
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
          i++
        } else {
          inQuotes = !inQuotes
        }
      } else if (char === "," && !inQuotes) {
        values.push(current)
        current = ""
      } else {
        current += char
      }
    }

    values.push(current)
    return values
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      setFileContent(text)
      const result = analyzeCSV(text)
      setAnalysis(result)
    } catch (error) {
      setAnalysis({ error: `Error reading file: ${error}` })
    }
  }

  const copyAnalysis = () => {
    const analysisText = JSON.stringify(analysis, null, 2)
    navigator.clipboard.writeText(analysisText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card className="max-w-4xl mx-auto shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="w-5 h-5" />
          CSV Debug Analyzer
        </CardTitle>
        <p className="text-sm text-gray-600">Deep analysis of your CSV file to debug attachment detection</p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* File Upload */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Upload your CSV file for analysis</label>
          <input
            type="file"
            accept=".csv,.txt"
            onChange={handleFileUpload}
            className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 focus:border-blue-500 focus:outline-none cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>

        {/* Analysis Results */}
        {analysis && !analysis.error && (
          <div className="space-y-4">
            {/* Header Analysis */}
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-lg">Header Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <strong>Total Lines:</strong> {analysis.totalLines}
                  </div>
                  <div>
                    <strong>Header Line:</strong>
                  </div>
                  <div className="bg-gray-100 p-2 rounded text-sm font-mono break-all">{analysis.headerLine}</div>
                  <div>
                    <strong>Parsed Headers ({analysis.headers.length}):</strong>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {analysis.headers.map((header: string, index: number) => (
                      <div
                        key={index}
                        className={`p-2 rounded text-sm ${
                          header.toLowerCase().includes("attachment") ? "bg-green-200" : "bg-gray-100"
                        }`}
                      >
                        {index}: {header}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Attachment Columns */}
            <Card className="bg-green-50 border-green-200">
              <CardHeader>
                <CardTitle className="text-lg">Attachment Columns Found</CardTitle>
              </CardHeader>
              <CardContent>
                {analysis.attachmentColumns.length > 0 ? (
                  <div className="space-y-2">
                    {analysis.attachmentColumns.map((col: any) => (
                      <div key={col.index} className="p-2 bg-white rounded">
                        <strong>Column {col.index}:</strong> "{col.header}"
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-red-600">❌ No attachment-related columns found!</div>
                )}
              </CardContent>
            </Card>

            {/* Value Counts */}
            <Card className="bg-yellow-50 border-yellow-200">
              <CardHeader>
                <CardTitle className="text-lg">Attachment Value Counts (Entire File)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(analysis.totalAttachmentCounts).map(([value, count]: [string, any]) => (
                    <div
                      key={value}
                      className={`p-3 rounded text-center ${
                        value === "1" ? "bg-green-200" : value === "0" ? "bg-gray-200" : "bg-red-200"
                      }`}
                    >
                      <div className="text-2xl font-bold">{count}</div>
                      <div className="text-sm">Value: "{value}"</div>
                      {value === "1" && <div className="text-xs text-green-700">Should be attachments</div>}
                    </div>
                  ))}
                </div>
                <div className="mt-4 p-3 bg-white rounded">
                  <div className="text-sm">
                    <strong>Expected:</strong> 102 messages with attachments (value "1")
                  </div>
                  <div className="text-sm">
                    <strong>Found:</strong> {analysis.totalAttachmentCounts["1"] || 0} messages with value "1"
                  </div>
                  {(analysis.totalAttachmentCounts["1"] || 0) !== 102 && (
                    <div className="text-red-600 text-sm mt-1">
                      ❌ Mismatch! Expected 102 but found {analysis.totalAttachmentCounts["1"] || 0}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Sample Rows */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Sample Rows (First 20)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {analysis.sampleRows.map((row: any) => (
                    <div key={row.rowNumber} className="border rounded p-3">
                      <div className="text-sm font-medium mb-2">Row {row.rowNumber}</div>

                      {/* Attachment Data */}
                      {Object.keys(row.attachmentData).length > 0 && (
                        <div className="mb-2">
                          <div className="text-xs font-medium text-gray-600">Attachment Fields:</div>
                          {Object.entries(row.attachmentData).map(([header, data]: [string, any]) => (
                            <div key={header} className="text-xs bg-gray-100 p-1 rounded mt-1">
                              <strong>{header}:</strong> "{data.raw}" (cleaned: "{data.cleaned}", type: {data.type})
                            </div>
                          ))}
                        </div>
                      )}

                      {/* First few values */}
                      <div className="text-xs text-gray-600 mb-1">First 10 values:</div>
                      <div className="text-xs bg-gray-50 p-2 rounded font-mono break-all">
                        {row.values.map((val: string, idx: number) => `[${idx}]="${val}"`).join(", ")}
                      </div>

                      {/* Raw line preview */}
                      <div className="text-xs text-gray-600 mt-2 mb-1">Raw line:</div>
                      <div className="text-xs bg-gray-50 p-2 rounded font-mono break-all">{row.line}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Copy Analysis */}
            <div className="flex justify-center">
              <Button onClick={copyAnalysis} variant="outline">
                {copied ? <CheckCircle className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                {copied ? "Copied!" : "Copy Full Analysis"}
              </Button>
            </div>
          </div>
        )}

        {/* Error Display */}
        {analysis && analysis.error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="text-red-800 font-medium">Error:</div>
            <div className="text-red-700">{analysis.error}</div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
