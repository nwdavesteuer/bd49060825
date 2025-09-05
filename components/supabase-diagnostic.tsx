"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Database, CheckCircle, XCircle, AlertCircle, RefreshCw, Table } from "lucide-react"
import { supabase, TABLE_NAME } from "@/lib/supabase"

interface DiagnosticResult {
  step: string
  success: boolean
  data?: any
  error?: string
  details?: any
}

export default function SupabaseDiagnostic() {
  const [results, setResults] = useState<DiagnosticResult[]>([])
  const [loading, setLoading] = useState(false)
  const [tableInfo, setTableInfo] = useState<any>(null)

  const runDiagnostics = async () => {
    setLoading(true)
    setResults([])
    const diagnosticResults: DiagnosticResult[] = []

    // Step 1: Test basic connection
    try {
      const { data, error } = await supabase.from(TABLE_NAME).select("count", { count: "exact", head: true })

      if (error) {
        diagnosticResults.push({
          step: "Basic Connection",
          success: false,
          error: error.message,
          details: { code: error.code, hint: error.hint },
        })
      } else {
        diagnosticResults.push({
          step: "Basic Connection",
          success: true,
          data: `Table exists with ${data?.[0]?.count || "unknown"} rows`,
        })
      }
    } catch (err: any) {
      diagnosticResults.push({
        step: "Basic Connection",
        success: false,
        error: err.message,
      })
    }

    // Step 2: Get table schema
    try {
      const { data, error } = await supabase.from(TABLE_NAME).select("*").limit(1)

      if (error) {
        diagnosticResults.push({
          step: "Table Schema",
          success: false,
          error: error.message,
        })
      } else if (data && data.length > 0) {
        const columns = Object.keys(data[0])
        const sampleRow = data[0]

        setTableInfo({
          columns,
          sampleRow,
          columnTypes: Object.entries(sampleRow).map(([key, value]) => ({
            column: key,
            type: typeof value,
            sampleValue: value,
          })),
        })

        diagnosticResults.push({
          step: "Table Schema",
          success: true,
          data: `Found ${columns.length} columns`,
          details: { columns, sampleRow },
        })
      } else {
        diagnosticResults.push({
          step: "Table Schema",
          success: false,
          error: "Table appears to be empty",
        })
      }
    } catch (err: any) {
      diagnosticResults.push({
        step: "Table Schema",
        success: false,
        error: err.message,
      })
    }

    // Step 3: Test date column queries
    try {
      const { data, error } = await supabase.from(TABLE_NAME).select("date").limit(5)

      if (error) {
        diagnosticResults.push({
          step: "Date Column Test",
          success: false,
          error: error.message,
        })
      } else {
        diagnosticResults.push({
          step: "Date Column Test",
          success: true,
          data: `Retrieved ${data?.length || 0} date samples`,
          details: { dateSamples: data },
        })
      }
    } catch (err: any) {
      diagnosticResults.push({
        step: "Date Column Test",
        success: false,
        error: err.message,
      })
    }

    // Step 4: Test text column queries
    try {
      const { data, error } = await supabase.from(TABLE_NAME).select("text").limit(5)

      if (error) {
        diagnosticResults.push({
          step: "Text Column Test",
          success: false,
          error: error.message,
        })
      } else {
        diagnosticResults.push({
          step: "Text Column Test",
          success: true,
          data: `Retrieved ${data?.length || 0} text samples`,
          details: { textSamples: data },
        })
      }
    } catch (err: any) {
      diagnosticResults.push({
        step: "Text Column Test",
        success: false,
        error: err.message,
      })
    }

    // Step 5: Test is_from_me column
    try {
      const { data, error } = await supabase.from(TABLE_NAME).select("is_from_me").limit(5)

      if (error) {
        diagnosticResults.push({
          step: "is_from_me Column Test",
          success: false,
          error: error.message,
        })
      } else {
        diagnosticResults.push({
          step: "is_from_me Column Test",
          success: true,
          data: `Retrieved ${data?.length || 0} is_from_me samples`,
          details: { isFromMeSamples: data },
        })
      }
    } catch (err: any) {
      diagnosticResults.push({
        step: "is_from_me Column Test",
        success: false,
        error: err.message,
      })
    }

    // Step 6: Test ordering by date
    try {
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select("date, text")
        .order("date", { ascending: true })
        .limit(3)

      if (error) {
        diagnosticResults.push({
          step: "Date Ordering Test",
          success: false,
          error: error.message,
        })
      } else {
        diagnosticResults.push({
          step: "Date Ordering Test",
          success: true,
          data: `Successfully ordered by date`,
          details: { orderedSamples: data },
        })
      }
    } catch (err: any) {
      diagnosticResults.push({
        step: "Date Ordering Test",
        success: false,
        error: err.message,
      })
    }

    // Step 7: Test row count
    try {
      const { count, error } = await supabase.from(TABLE_NAME).select("*", { count: "exact", head: true })

      if (error) {
        diagnosticResults.push({
          step: "Row Count Test",
          success: false,
          error: error.message,
        })
      } else {
        diagnosticResults.push({
          step: "Row Count Test",
          success: true,
          data: `Total rows: ${count?.toLocaleString() || "unknown"}`,
        })
      }
    } catch (err: any) {
      diagnosticResults.push({
        step: "Row Count Test",
        success: false,
        error: err.message,
      })
    }

    setResults(diagnosticResults)
    setLoading(false)
  }

  useEffect(() => {
    runDiagnostics()
  }, [])

  const successCount = results.filter((r) => r.success).length
  const failureCount = results.filter((r) => !r.success).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Supabase Integration Diagnostic
          </CardTitle>
          <div className="flex items-center gap-4">
            <Badge variant={successCount > failureCount ? "default" : "destructive"}>
              {successCount} passed, {failureCount} failed
            </Badge>
            <Button onClick={runDiagnostics} disabled={loading} size="sm">
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Re-run Diagnostics
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-600">
            <p>
              <strong>Table:</strong> {TABLE_NAME}
            </p>
            <p>
              <strong>URL:</strong> {process.env.NEXT_PUBLIC_SUPABASE_URL || "Using fallback URL"}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Table Structure */}
      {tableInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Table className="h-5 w-5" />
              Table Structure
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Columns ({tableInfo.columns.length})</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {tableInfo.columns.map((column: string) => (
                    <Badge key={column} variant="outline">
                      {column}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Column Types & Sample Values</h4>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {tableInfo.columnTypes.map((col: any) => (
                    <div key={col.column} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                      <div className="font-medium">{col.column}</div>
                      <div className="text-gray-600">{col.type}</div>
                      <div className="text-xs text-gray-500 max-w-32 truncate">{JSON.stringify(col.sampleValue)}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Diagnostic Results */}
      <div className="grid gap-4">
        {results.map((result, index) => (
          <Card key={index}>
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <div className="mt-1">
                  {result.success ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium">{result.step}</h3>
                    <Badge variant={result.success ? "default" : "destructive"} className="text-xs">
                      {result.success ? "PASS" : "FAIL"}
                    </Badge>
                  </div>

                  {result.success ? (
                    <p className="text-sm text-green-700">{result.data}</p>
                  ) : (
                    <p className="text-sm text-red-700">{result.error}</p>
                  )}

                  {result.details && (
                    <details className="mt-2">
                      <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                        View Details
                      </summary>
                      <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
                        {JSON.stringify(result.details, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recommendations */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              {failureCount === 0 ? (
                <div className="flex items-center gap-2 text-green-700">
                  <CheckCircle className="h-4 w-4" />
                  All diagnostics passed! Your Supabase integration is working correctly.
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-red-700">
                    <XCircle className="h-4 w-4" />
                    {failureCount} diagnostic{failureCount > 1 ? "s" : ""} failed. Please check the following:
                  </div>

                  {results
                    .filter((r) => !r.success)
                    .map((result, index) => (
                      <div key={index} className="ml-6 text-gray-600">
                        • <strong>{result.step}:</strong> {result.error}
                      </div>
                    ))}

                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                    <h4 className="font-medium text-yellow-800 mb-2">Common Issues:</h4>
                    <ul className="text-sm text-yellow-700 space-y-1">
                      <li>• Check if the table name "fulldata_set" is correct</li>
                      <li>• Verify your Supabase URL and API key</li>
                      <li>• Ensure the table has the expected columns (date, text, is_from_me)</li>
                      <li>• Check if Row Level Security (RLS) is blocking access</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
