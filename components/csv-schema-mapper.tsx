"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { supabase, TABLE_NAME } from "@/lib/supabase"
import { Upload, Download, Database, CheckCircle, AlertCircle, Info } from "lucide-react"

interface ColumnMapping {
  csvColumn: string
  dbColumn: string
  required: boolean
  dataType: string
}

interface SchemaInfo {
  columns: string[]
  sample: any
}

export default function CsvSchemaMapper() {
  const [schemaInfo, setSchemaInfo] = useState<SchemaInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [csvHeaders, setCsvHeaders] = useState<string[]>([])
  const [mappings, setMappings] = useState<ColumnMapping[]>([])
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<string | null>(null)

  // Expected database schema based on your screenshots
  const expectedSchema = [
    { column: "text", required: true, type: "text", description: "Message content" },
    { column: "data", required: false, type: "text", description: "Timestamp data" },
    { column: "date_read", required: false, type: "text", description: "Date read timestamp" },
    { column: "is_from_me", required: true, type: "number", description: "1 if from you, 0 if from recipient" },
    { column: "sender", required: true, type: "text", description: "Sender name" },
    { column: "recipient", required: true, type: "text", description: "Recipient name" },
    { column: "has_attachments", required: false, type: "number", description: "1 if has attachments, 0 if not" },
    { column: "attachments_info", required: false, type: "text", description: "Attachment information" },
    { column: "emojis", required: false, type: "text", description: "Emoji data" },
    { column: "links", required: false, type: "text", description: "Link data" },
    { column: "service", required: false, type: "text", description: "Service type (iMessage, SMS, etc.)" },
    { column: "account", required: false, type: "text", description: "Account information" },
    { column: "contact_id", required: false, type: "text", description: "Contact identifier" },
    { column: "readable_date", required: true, type: "timestamp", description: "Human-readable timestamp" },
  ]

  useEffect(() => {
    fetchSchema()
  }, [])

  const fetchSchema = async () => {
    try {
      setLoading(true)
      setError(null)

      // Try multiple approaches to get schema information
      let schemaResult = null

      // Approach 1: Try to get schema from information_schema
      try {
        const { data: schemaData, error: schemaError } = await supabase
          .from("information_schema.columns")
          .select("column_name")
          .eq("table_name", TABLE_NAME)

        if (!schemaError && schemaData && schemaData.length > 0) {
          const columns = schemaData.map((col: any) => col.column_name)
          schemaResult = { columns, sample: null }
        }
      } catch (e) {
        console.log("Schema query failed, trying sample approach")
      }

      // Approach 2: Get schema by sampling data
      if (!schemaResult) {
        try {
          const { data: sampleData, error: sampleError } = await supabase.from(TABLE_NAME).select("*").limit(1)

          if (!sampleError && sampleData && sampleData.length > 0) {
            const columns = Object.keys(sampleData[0])
            schemaResult = { columns, sample: sampleData[0] }
          }
        } catch (e) {
          console.log("Sample query failed")
        }
      }

      // Approach 3: Use expected schema as fallback
      if (!schemaResult) {
        console.log("Using expected schema as fallback")
        schemaResult = {
          columns: expectedSchema.map((s) => s.column),
          sample: null,
        }
      }

      setSchemaInfo(schemaResult)

      // Initialize mappings
      const initialMappings = expectedSchema.map((schema) => ({
        csvColumn: "",
        dbColumn: schema.column,
        required: schema.required,
        dataType: schema.type,
      }))
      setMappings(initialMappings)
    } catch (err: any) {
      console.error("Error fetching schema:", err)
      setError(`Failed to fetch schema: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setCsvFile(file)

    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const lines = text.split("\n")
      if (lines.length > 0) {
        const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""))
        setCsvHeaders(headers)

        // Auto-map columns based on name similarity
        const updatedMappings = mappings.map((mapping) => {
          const matchingHeader = headers.find(
            (header) =>
              header.toLowerCase() === mapping.dbColumn.toLowerCase() ||
              header.toLowerCase().includes(mapping.dbColumn.toLowerCase()) ||
              mapping.dbColumn.toLowerCase().includes(header.toLowerCase()),
          )
          return {
            ...mapping,
            csvColumn: matchingHeader || "",
          }
        })
        setMappings(updatedMappings)
      }
    }
    reader.readAsText(file)
  }

  const updateMapping = (index: number, csvColumn: string) => {
    const updatedMappings = [...mappings]
    updatedMappings[index].csvColumn = csvColumn
    setMappings(updatedMappings)
  }

  const downloadTemplate = () => {
    const headers = expectedSchema.map((s) => s.column).join(",")
    const exampleRow = [
      "Hey love, just landing.",
      "523489000000000",
      "523489555000000",
      "1",
      "David",
      "Nitzan",
      "0",
      "EMPTY",
      "EMPTY",
      "EMPTY",
      "iMessage",
      "e:nwdave@b-zb.com",
      "David",
      "2017-08-09 22:50:16+00",
    ].join(",")

    const csvContent = `${headers}\n${exampleRow}`
    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${TABLE_NAME}_template.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const importCsv = async () => {
    if (!csvFile) return

    try {
      setImporting(true)
      setImportResult(null)

      const reader = new FileReader()
      reader.onload = async (e) => {
        const text = e.target?.result as string
        const lines = text.split("\n").filter((line) => line.trim())
        const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""))

        const rows = lines.slice(1).map((line) => {
          const values = line.split(",").map((v) => v.trim().replace(/"/g, ""))
          const row: any = {}

          mappings.forEach((mapping) => {
            if (mapping.csvColumn) {
              const csvIndex = headers.indexOf(mapping.csvColumn)
              if (csvIndex !== -1) {
                let value = values[csvIndex] || ""
                // Handle data type conversion
                if (mapping.dataType === "number" && value) {
                  value = value === "EMPTY" ? "0" : value
                  row[mapping.dbColumn] = Number.parseInt(value) || 0
                } else {
                  row[mapping.dbColumn] = value === "EMPTY" ? "" : value
                }
              }
            }
          })

          return row
        })

        // Insert data in batches
        const batchSize = 100
        let successCount = 0
        let errorCount = 0

        for (let i = 0; i < rows.length; i += batchSize) {
          const batch = rows.slice(i, i + batchSize)
          try {
            const { error } = await supabase.from(TABLE_NAME).insert(batch)
            if (error) {
              console.error("Batch error:", error)
              errorCount += batch.length
            } else {
              successCount += batch.length
            }
          } catch (err) {
            console.error("Batch insert failed:", err)
            errorCount += batch.length
          }
        }

        setImportResult(`Import completed: ${successCount} successful, ${errorCount} failed`)
      }

      reader.readAsText(csvFile)
    } catch (err: any) {
      setImportResult(`Import failed: ${err.message}`)
    } finally {
      setImporting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading schema information...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">CSV Schema Mapper</h1>
          <p className="text-gray-600">Map your CSV columns to the database schema for {TABLE_NAME}</p>
        </div>

        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Database Schema */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Database Schema
              </CardTitle>
              <CardDescription>Current table structure for {TABLE_NAME}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {expectedSchema.map((schema, index) => (
                  <div key={schema.column} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{schema.column}</span>
                        {schema.required && <Badge variant="destructive">Required</Badge>}
                        <Badge variant="outline">{schema.type}</Badge>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{schema.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              {schemaInfo?.sample && (
                <div className="mt-4">
                  <h4 className="font-medium text-gray-900 mb-2">Sample Data:</h4>
                  <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                    {JSON.stringify(schemaInfo.sample, null, 2)}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>

          {/* CSV Upload and Mapping */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                CSV Upload & Mapping
              </CardTitle>
              <CardDescription>Upload your CSV file and map columns to database fields</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="csv-file">Upload CSV File</Label>
                <Input id="csv-file" type="file" accept=".csv" onChange={handleFileUpload} className="mt-1" />
              </div>

              <div className="flex gap-2">
                <Button onClick={downloadTemplate} variant="outline" className="flex-1 bg-transparent">
                  <Download className="h-4 w-4 mr-2" />
                  Download Template
                </Button>
              </div>

              {csvHeaders.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Column Mapping</h4>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {mappings.map((mapping, index) => (
                      <div key={mapping.dbColumn} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-gray-900">{mapping.dbColumn}</span>
                            {mapping.required && <Badge variant="destructive">Required</Badge>}
                          </div>
                          <select
                            value={mapping.csvColumn}
                            onChange={(e) => updateMapping(index, e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded text-sm"
                          >
                            <option value="">Select CSV column...</option>
                            {csvHeaders.map((header) => (
                              <option key={header} value={header}>
                                {header}
                              </option>
                            ))}
                          </select>
                        </div>
                        {mapping.csvColumn && <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {csvFile && (
                <Button onClick={importCsv} disabled={importing} className="w-full">
                  {importing ? "Importing..." : "Import CSV Data"}
                </Button>
              )}

              {importResult && (
                <Alert
                  className={
                    importResult.includes("failed") ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"
                  }
                >
                  <Info className="h-4 w-4" />
                  <AlertDescription>{importResult}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Example CSV Format */}
        <Card>
          <CardHeader>
            <CardTitle>Example CSV Format</CardTitle>
            <CardDescription>Here's what your CSV should look like based on your database structure</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-100 p-4 rounded-lg overflow-x-auto">
              <pre className="text-sm">
                {`text,data,date_read,is_from_me,sender,recipient,has_attachments,attachments_info,emojis,links,service,account,contact_id,readable_date
"Hey love, just landing.",523489000000000,523489555000000,1,David,Nitzan,0,EMPTY,EMPTY,EMPTY,iMessage,e:nwdave@b-zb.com,David,2017-08-09 22:50:16+00
"Sure!",523489600000000,523489666000000,0,Nitzan,David,0,EMPTY,EMPTY,EMPTY,iMessage,+19172390518,+19172390518,2017-08-09 22:50:38+00`}
              </pre>
            </div>
            <div className="mt-4 text-sm text-gray-600">
              <p className="font-medium mb-2">Important notes:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Use "EMPTY" for empty fields instead of leaving them blank</li>
                <li>is_from_me should be 1 for messages from you, 0 for messages from the recipient</li>
                <li>has_attachments should be 1 if the message has attachments, 0 if not</li>
                <li>readable_date should be in format: YYYY-MM-DD HH:MM:SS+TZ</li>
                <li>Enclose text fields with commas in quotes</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
