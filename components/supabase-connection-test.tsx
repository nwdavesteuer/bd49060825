"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, CheckCircle, XCircle, RefreshCw, Database } from "lucide-react"
import { supabase, TABLE_NAME } from "../lib/supabase"

export default function SupabaseConnectionTest() {
  const [loading, setLoading] = useState(true)
  const [results, setResults] = useState<any>({})
  const [sampleData, setSampleData] = useState<any[]>([])

  const runTests = async () => {
    setLoading(true)
    setResults({})
    setSampleData([])

    const testResults: any = {
      connection: { status: "pending" },
      tableExists: { status: "pending" },
      dataAccess: { status: "pending" },
      columnCheck: { status: "pending" },
    }

    try {
      // Test 1: Basic connection - try multiple approaches
      testResults.connection.status = "running"
      setResults({ ...testResults })

      // Try different ways to access the table
      let connectionSuccess = false
      let connectionDetails = ""

      // Approach 1: Simple select with limit
      try {
        const { data: testData, error: testError } = await supabase.from(TABLE_NAME).select("*").limit(1)

        if (!testError && testData) {
          connectionSuccess = true
          connectionDetails = "Connected via simple select query"
        }
      } catch (e) {
        console.log("Simple select failed:", e)
      }

      // Approach 2: Count query without head
      if (!connectionSuccess) {
        try {
          const { count, error: countError } = await supabase.from(TABLE_NAME).select("*", { count: "exact" }).limit(0)

          if (!countError && count !== null) {
            connectionSuccess = true
            connectionDetails = `Connected via count query - found ${count} records`
          }
        } catch (e) {
          console.log("Count query failed:", e)
        }
      }

      // Approach 3: Try with different table name formats
      if (!connectionSuccess) {
        const alternativeNames = [
          "david_nitzan_all_messages",
          '"david_nitzan_all_messages"',
          "public.david_nitzan_all_messages",
        ]

        for (const tableName of alternativeNames) {
          try {
            const { data, error } = await supabase.from(tableName).select("*").limit(1)

            if (!error && data) {
              connectionSuccess = true
              connectionDetails = `Connected using table name: ${tableName}`
              break
            }
          } catch (e) {
            console.log(`Failed with table name ${tableName}:`, e)
          }
        }
      }

      if (!connectionSuccess) {
        testResults.connection = {
          status: "failed",
          details: "Could not connect to Supabase or access the table",
          error: "All connection attempts failed",
        }
        setResults({ ...testResults })
        setLoading(false)
        return
      }

      testResults.connection = {
        status: "success",
        details: connectionDetails,
      }
      setResults({ ...testResults })

      // Test 2: Get actual row count
      testResults.tableExists.status = "running"
      setResults({ ...testResults })

      const { count, error: countError } = await supabase.from(TABLE_NAME).select("*", { count: "exact" }).limit(0)

      if (countError) {
        // Try alternative count method
        const { data: allData, error: allError } = await supabase.from(TABLE_NAME).select("*")

        if (allError) {
          testResults.tableExists = {
            status: "failed",
            error: allError.message,
            details: `Could not access table "${TABLE_NAME}"`,
          }
        } else {
          testResults.tableExists = {
            status: "success",
            details: `Table "${TABLE_NAME}" exists`,
            count: allData?.length || 0,
          }
        }
      } else {
        testResults.tableExists = {
          status: "success",
          details: `Table "${TABLE_NAME}" exists`,
          count: count || 0,
        }
      }
      setResults({ ...testResults })

      // Test 3: Fetch sample data
      testResults.dataAccess.status = "running"
      setResults({ ...testResults })

      const { data, error: dataError } = await supabase.from(TABLE_NAME).select("*").limit(5)

      if (dataError) {
        testResults.dataAccess = {
          status: "failed",
          error: dataError.message,
          details: "Could not fetch sample data",
        }
      } else if (!data || data.length === 0) {
        testResults.dataAccess = {
          status: "warning",
          details: "Query succeeded but no data returned",
        }
      } else {
        testResults.dataAccess = {
          status: "success",
          details: `Successfully fetched ${data.length} sample rows`,
          rowCount: data.length,
        }
        setSampleData(data)
      }
      setResults({ ...testResults })

      // Test 4: Column analysis
      testResults.columnCheck.status = "running"
      setResults({ ...testResults })

      if (!data || data.length === 0) {
        testResults.columnCheck = {
          status: "skipped",
          details: "No data available for column analysis",
        }
      } else {
        const columns = Object.keys(data[0])
        const dateColumns = columns.filter(
          (col) => col.toLowerCase().includes("date") || col.toLowerCase().includes("time") || col === "date",
        )

        testResults.columnCheck = {
          status: "success",
          details: `Found ${columns.length} columns`,
          columns,
          dateColumns,
          sampleRow: data[0],
        }
      }
      setResults({ ...testResults })
    } catch (error: any) {
      console.error("Diagnostic error:", error)
      testResults.error = {
        status: "failed",
        message: error.message,
        details: "Unexpected error during diagnostic",
      }
      setResults({ ...testResults })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    runTests()
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case "failed":
        return <XCircle className="w-5 h-5 text-red-500" />
      case "warning":
        return <CheckCircle className="w-5 h-5 text-yellow-500" />
      case "running":
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
      case "pending":
        return <div className="w-5 h-5 rounded-full bg-gray-300" />
      case "skipped":
        return <div className="w-5 h-5 rounded-full bg-gray-300" />
      default:
        return <div className="w-5 h-5 rounded-full bg-gray-300" />
    }
  }

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader className="bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Database className="w-6 h-6 text-blue-600" />
              <CardTitle>Supabase Connection Diagnostic</CardTitle>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={runTests}
              disabled={loading}
              className="flex items-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              {loading ? "Testing..." : "Run Tests"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-6">
            {/* Test Results */}
            <div className="space-y-4">
              {/* Connection Test */}
              <div className="flex items-start gap-3 p-3 border rounded-lg bg-gray-50">
                <div className="mt-1">{getStatusIcon(results.connection?.status || "pending")}</div>
                <div className="flex-1">
                  <h3 className="font-medium">Supabase Connection</h3>
                  <p className="text-sm text-gray-600">{results.connection?.details || "Testing connection..."}</p>
                  {results.connection?.error && <p className="text-sm text-red-600 mt-1">{results.connection.error}</p>}
                  {results.connection?.code && (
                    <p className="text-xs text-gray-500 mt-1">Error code: {results.connection.code}</p>
                  )}
                </div>
              </div>

              {/* Table Exists Test */}
              <div className="flex items-start gap-3 p-3 border rounded-lg bg-gray-50">
                <div className="mt-1">{getStatusIcon(results.tableExists?.status || "pending")}</div>
                <div className="flex-1">
                  <h3 className="font-medium">Table Check</h3>
                  <p className="text-sm text-gray-600">
                    {results.tableExists?.details || `Checking if table "${TABLE_NAME}" exists...`}
                  </p>
                  {results.tableExists?.error && (
                    <p className="text-sm text-red-600 mt-1">{results.tableExists.error}</p>
                  )}
                  {results.tableExists?.count !== undefined && (
                    <p className="text-sm text-blue-600 mt-1">Approximate row count: {results.tableExists.count}</p>
                  )}
                </div>
              </div>

              {/* Data Access Test */}
              <div className="flex items-start gap-3 p-3 border rounded-lg bg-gray-50">
                <div className="mt-1">{getStatusIcon(results.dataAccess?.status || "pending")}</div>
                <div className="flex-1">
                  <h3 className="font-medium">Data Access</h3>
                  <p className="text-sm text-gray-600">{results.dataAccess?.details || "Testing data access..."}</p>
                  {results.dataAccess?.error && <p className="text-sm text-red-600 mt-1">{results.dataAccess.error}</p>}
                </div>
              </div>

              {/* Column Check Test */}
              <div className="flex items-start gap-3 p-3 border rounded-lg bg-gray-50">
                <div className="mt-1">{getStatusIcon(results.columnCheck?.status || "pending")}</div>
                <div className="flex-1">
                  <h3 className="font-medium">Column Check</h3>
                  <p className="text-sm text-gray-600">
                    {results.columnCheck?.details || "Checking available columns..."}
                  </p>
                  {results.columnCheck?.columns && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-500 mb-1">Available columns:</p>
                      <div className="flex flex-wrap gap-1">
                        {results.columnCheck.columns.map((col: string) => (
                          <span
                            key={col}
                            className={`text-xs px-2 py-1 rounded-full ${
                              results.columnCheck.dateColumns?.includes(col)
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {col}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {results.columnCheck?.dateColumns && results.columnCheck.dateColumns.length > 0 && (
                    <p className="text-xs text-green-600 mt-1">
                      Possible date columns: {results.columnCheck.dateColumns.join(", ")}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Sample Data */}
            {sampleData.length > 0 && (
              <div className="mt-6">
                <h3 className="font-medium mb-2">Sample Data (First 5 rows)</h3>
                <div className="overflow-x-auto">
                  <div className="bg-gray-50 p-3 rounded border">
                    <pre className="text-xs overflow-auto max-h-60">{JSON.stringify(sampleData, null, 2)}</pre>
                  </div>
                </div>
              </div>
            )}

            {/* Connection Details */}
            <div className="mt-6 text-sm text-gray-500">
              <p>
                Table name: <span className="font-mono">{TABLE_NAME}</span>
              </p>
              <p>
                Supabase URL: <span className="font-mono">{supabase.supabaseUrl}</span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
