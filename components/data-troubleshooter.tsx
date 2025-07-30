"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, CheckCircle, XCircle, RefreshCw, Database, AlertTriangle } from "lucide-react"
import { supabase, TABLE_NAME } from "../lib/supabase"

export default function DataTroubleshooter() {
  const [loading, setLoading] = useState(false)
  const [tests, setTests] = useState<any>({})
  const [rawData, setRawData] = useState<any[]>([])

  const runComprehensiveTests = async () => {
    setLoading(true)
    setTests({})
    setRawData([])

    const results: any = {}

    try {
      // Test 1: Basic Connection
      console.log("=== TEST 1: Basic Connection ===")
      results.connection = { status: "running", details: "Testing basic connection..." }
      setTests({ ...results })

      const { data: connectionTest, error: connectionError } = await supabase.from(TABLE_NAME).select("*").limit(1)

      if (connectionError) {
        results.connection = {
          status: "failed",
          error: connectionError.message,
          code: connectionError.code,
          details: connectionError.details || "Connection failed",
        }
        console.error("Connection test failed:", connectionError)
      } else {
        results.connection = {
          status: "success",
          details: "Successfully connected to Supabase",
          sampleRecord: connectionTest?.[0] || null,
        }
        console.log("Connection test passed:", connectionTest)
      }
      setTests({ ...results })

      if (connectionError) {
        setLoading(false)
        return
      }

      // Test 2: Row Count - Multiple Approaches
      console.log("=== TEST 2: Row Count - Multiple Approaches ===")
      results.rowCount = { status: "running", details: "Testing different counting methods..." }
      setTests({ ...results })

      // Method 1: Standard count with head=true
      const { count: count1, error: countError1 } = await supabase
        .from(TABLE_NAME)
        .select("*", { count: "exact", head: true })

      // Method 2: Count without head parameter
      const { count: count2, error: countError2 } = await supabase.from(TABLE_NAME).select("*", { count: "exact" })

      // Method 3: Simple select all and count locally
      const { data: allData, error: allError } = await supabase.from(TABLE_NAME).select("message_id")

      console.log("Count Method 1 (head=true):", { count: count1, error: countError1 })
      console.log("Count Method 2 (no head):", { count: count2, error: countError2 })
      console.log("Count Method 3 (select all):", { count: allData?.length, error: allError })

      results.rowCount = {
        status: count1 || count2 || allData?.length ? "success" : "failed",
        method1: { count: count1, error: countError1?.message },
        method2: { count: count2, error: countError2?.message },
        method3: { count: allData?.length, error: allError?.message },
        details: `Method 1: ${count1}, Method 2: ${count2}, Method 3: ${allData?.length}`,
      }
      setTests({ ...results })

      // Test 3: Column Structure
      console.log("=== TEST 3: Column Structure ===")
      results.columns = { status: "running", details: "Analyzing column structure..." }
      setTests({ ...results })

      const { data: sampleData, error: sampleError } = await supabase.from(TABLE_NAME).select("*").limit(3)

      if (sampleError) {
        results.columns = {
          status: "failed",
          error: sampleError.message,
          details: "Could not fetch sample data",
        }
        console.error("Sample data test failed:", sampleError)
      } else if (!sampleData || sampleData.length === 0) {
        results.columns = {
          status: "warning",
          details: "No sample data returned",
        }
      } else {
        const columns = Object.keys(sampleData[0])
        const dateColumns = columns.filter((col) => col.toLowerCase().includes("date"))

        results.columns = {
          status: "success",
          columns: columns,
          dateColumns: dateColumns,
          sampleData: sampleData,
          details: `Found ${columns.length} columns`,
        }
        console.log("Column analysis:", { columns, dateColumns, sampleData })
      }
      setTests({ ...results })

      // Test 4: Date Column Analysis
      console.log("=== TEST 4: Date Column Analysis ===")
      results.dateAnalysis = { status: "running", details: "Analyzing date column..." }
      setTests({ ...results })

      if (results.columns.status === "success" && results.columns.dateColumns.length > 0) {
        const dateColumn = results.columns.dateColumns[0] // Use first date column found

        const { data: dateData, error: dateError } = await supabase
          .from(TABLE_NAME)
          .select(`${dateColumn}`)
          .order(dateColumn, { ascending: true })
          .limit(10)

        if (dateError) {
          results.dateAnalysis = {
            status: "failed",
            error: dateError.message,
            details: `Could not analyze ${dateColumn} column`,
          }
        } else {
          const parsedDates = dateData?.map((row) => {
            const dateValue = row[dateColumn]
            try {
              const parsed = new Date(dateValue)
              return {
                original: dateValue,
                parsed: parsed.toISOString(),
                valid: !isNaN(parsed.getTime()),
                year: parsed.getFullYear(),
              }
            } catch (e) {
              return {
                original: dateValue,
                parsed: null,
                valid: false,
                error: e.message,
              }
            }
          })

          const validDates = parsedDates?.filter((d) => d.valid) || []
          const years = [...new Set(validDates.map((d) => d.year))].sort()

          results.dateAnalysis = {
            status: "success",
            dateColumn: dateColumn,
            sampleDates: parsedDates,
            validDates: validDates.length,
            totalSample: dateData?.length || 0,
            yearRange: years,
            details: `Analyzed ${dateColumn}: ${validDates.length}/${dateData?.length || 0} valid dates`,
          }
        }
      } else {
        results.dateAnalysis = {
          status: "skipped",
          details: "No date columns found to analyze",
        }
      }
      setTests({ ...results })

      // Test 5: Full Data Fetch (Limited)
      console.log("=== TEST 5: Full Data Fetch ===")
      results.dataFetch = { status: "running", details: "Fetching larger data sample..." }
      setTests({ ...results })

      const { data: fullData, error: fullError } = await supabase
        .from(TABLE_NAME)
        .select("*")
        .order("date", { ascending: true })
        .limit(100)

      if (fullError) {
        results.dataFetch = {
          status: "failed",
          error: fullError.message,
          details: "Could not fetch data sample",
        }
      } else {
        setRawData(fullData || [])
        results.dataFetch = {
          status: "success",
          recordCount: fullData?.length || 0,
          details: `Successfully fetched ${fullData?.length || 0} records`,
        }
      }
      setTests({ ...results })

      // Test 6: Heatmap Data Processing
      console.log("=== TEST 6: Heatmap Processing ===")
      results.heatmapProcessing = { status: "running", details: "Testing heatmap data processing..." }
      setTests({ ...results })

      if (fullData && fullData.length > 0 && results.dateAnalysis.dateColumn) {
        const dateColumn = results.dateAnalysis.dateColumn
        const weekCounts: { [key: string]: number } = {}
        let processedCount = 0
        let errorCount = 0

        fullData.forEach((message) => {
          try {
            const dateValue = message[dateColumn]
            const date = new Date(dateValue)

            if (!isNaN(date.getTime())) {
              const year = date.getFullYear()
              const startOfYear = new Date(year, 0, 1)
              const weekNumber = Math.ceil(
                ((date.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7,
              )
              const weekKey = `${year}-${weekNumber.toString().padStart(2, "0")}`

              weekCounts[weekKey] = (weekCounts[weekKey] || 0) + 1
              processedCount++
            } else {
              errorCount++
            }
          } catch (e) {
            errorCount++
          }
        })

        const activeWeeks = Object.keys(weekCounts).length
        const maxWeeklyCount = Math.max(...Object.values(weekCounts))

        results.heatmapProcessing = {
          status: "success",
          processedRecords: processedCount,
          errorRecords: errorCount,
          activeWeeks: activeWeeks,
          maxWeeklyCount: maxWeeklyCount,
          sampleWeeks: Object.entries(weekCounts)
            .slice(0, 5)
            .map(([week, count]) => ({ week, count })),
          details: `Processed ${processedCount} records into ${activeWeeks} active weeks`,
        }
      } else {
        results.heatmapProcessing = {
          status: "failed",
          details: "No data available for heatmap processing",
        }
      }
      setTests({ ...results })
    } catch (error: any) {
      console.error("Comprehensive test error:", error)
      results.error = {
        status: "failed",
        message: error.message,
        stack: error.stack,
      }
      setTests({ ...results })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    runComprehensiveTests()
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case "failed":
        return <XCircle className="w-5 h-5 text-red-500" />
      case "warning":
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />
      case "running":
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
      case "skipped":
        return <div className="w-5 h-5 rounded-full bg-gray-300" />
      default:
        return <div className="w-5 h-5 rounded-full bg-gray-300" />
    }
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <Card>
        <CardHeader className="bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Database className="w-6 h-6 text-blue-600" />
              <CardTitle>Comprehensive Data Troubleshooter</CardTitle>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={runComprehensiveTests}
              disabled={loading}
              className="flex items-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              {loading ? "Testing..." : "Run Tests"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* Test Results */}
            {Object.entries(tests).map(([testName, result]: [string, any]) => (
              <div key={testName} className="flex items-start gap-3 p-3 border rounded-lg bg-gray-50">
                <div className="mt-1">{getStatusIcon(result?.status || "pending")}</div>
                <div className="flex-1">
                  <h3 className="font-medium capitalize">{testName.replace(/([A-Z])/g, " $1")}</h3>
                  <p className="text-sm text-gray-600">{result?.details || "Pending..."}</p>
                  {result?.error && <p className="text-sm text-red-600 mt-1">Error: {result.error}</p>}
                  {result?.count !== undefined && <p className="text-sm text-blue-600 mt-1">Count: {result.count}</p>}
                  {result?.columns && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-500 mb-1">Columns:</p>
                      <div className="flex flex-wrap gap-1">
                        {result.columns.map((col: string) => (
                          <span
                            key={col}
                            className={`text-xs px-2 py-1 rounded-full ${
                              result.dateColumns?.includes(col)
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
                  {result?.yearRange && (
                    <p className="text-xs text-green-600 mt-1">Years: {result.yearRange.join(", ")}</p>
                  )}
                  {result?.sampleWeeks && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-500 mb-1">Sample weeks:</p>
                      <div className="text-xs font-mono">
                        {result.sampleWeeks.map((w: any) => `${w.week}: ${w.count}`).join(", ")}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Raw Data Sample */}
      {rawData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Raw Data Sample (First 10 records)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <div className="bg-gray-50 p-3 rounded border">
                <pre className="text-xs overflow-auto max-h-96">{JSON.stringify(rawData.slice(0, 10), null, 2)}</pre>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Connection Details */}
      <Card>
        <CardHeader>
          <CardTitle>Connection Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p>
              <strong>Table:</strong> <span className="font-mono">{TABLE_NAME}</span>
            </p>
            <p>
              <strong>URL:</strong> <span className="font-mono">{supabase.supabaseUrl}</span>
            </p>
            <p>
              <strong>Expected Records:</strong> 28,272
            </p>
            <div className="mt-4 p-3 bg-blue-50 rounded border">
              <p className="font-medium text-blue-800">How I'm accessing your data:</p>
              <ol className="list-decimal list-inside text-blue-700 mt-2 space-y-1">
                <li>Using supabase.from("david_nitzan_all_messages")</li>
                <li>Trying .select("*", {"{count: 'exact', head: true}"}) for counting</li>
                <li>Using .select("*").limit(100) for data fetching</li>
                <li>Looking for columns: message_id, date, text, guid</li>
                <li>Parsing the 'date' column as timestamptz</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
