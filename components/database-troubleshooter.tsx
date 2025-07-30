"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/supabase"

export function DatabaseTroubleshooter() {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const runDiagnostics = async () => {
    setLoading(true)
    setError(null)
    setResults(null)

    try {
      // Test connection
      const { data: connectionTest, error: connectionError } = await supabase
        .from("david_nitzan_all_messages")
        .select("count(*)")
        .limit(1)

      if (connectionError) {
        throw new Error(`Connection error: ${connectionError.message}`)
      }

      // Get table info
      const { data: tableInfo, error: tableError } = await supabase
        .rpc("get_table_info", {
          table_name: "fulldata_set",
        })
        .catch(() => ({ data: null, error: { message: "get_table_info function not available" } }))

      // Get column info directly if RPC not available
      const { data: columnInfo, error: columnError } = await supabase
        .from("information_schema.columns")
        .select("column_name, data_type")
        .eq("table_name", "fulldata_set")
        .catch(() => ({ data: null, error: { message: "Could not access schema information" } }))

      // Get sample data
      const { data: sampleData, error: sampleError } = await supabase
        .from("fulldata_set")
        .select("*")
        .limit(5)

      // Count messages
      const { data: countData, error: countError } = await supabase.from("fulldata_set").select("count(*)")

      setResults({
        connection: !connectionError,
        tableInfo: tableInfo || "Not available",
        columnInfo: columnInfo || "Not available",
        sampleData: sampleData || "No data available",
        count: countData?.[0]?.count || 0,
        errors: {
          connection: connectionError?.message || null,
          table: tableError?.message || null,
          column: columnError?.message || null,
          sample: sampleError?.message || null,
          count: countError?.message || null,
        },
      })
    } catch (err: any) {
      setError(err.message || "An unknown error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Database Connection Diagnostics</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-gray-600">
            This tool will check your Supabase connection and analyze the structure of your message table.
          </p>
          <Button onClick={runDiagnostics} disabled={loading}>
            {loading ? "Running Diagnostics..." : "Run Diagnostics"}
          </Button>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold text-red-700 mb-2">Error</h3>
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}

      {results && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Connection Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <div className={`w-4 h-4 rounded-full ${results.connection ? "bg-green-500" : "bg-red-500"}`}></div>
                <span>{results.connection ? "Connected successfully" : "Connection failed"}</span>
              </div>
              {results.errors.connection && <p className="mt-2 text-red-600">{results.errors.connection}</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Table Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">Message Count</h3>
                  <p>{results.count}</p>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Column Information</h3>
                  {Array.isArray(results.columnInfo) ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Column Name
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Data Type
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {results.columnInfo.map((col: any, i: number) => (
                            <tr key={i}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{col.column_name}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{col.data_type}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-gray-500">Column information not available</p>
                  )}
                </div>

                <div>
                  <h3 className="font-medium mb-2">Sample Data</h3>
                  {Array.isArray(results.sampleData) && results.sampleData.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            {Object.keys(results.sampleData[0]).map((key) => (
                              <th
                                key={key}
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                              >
                                {key}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {results.sampleData.map((row: any, i: number) => (
                            <tr key={i}>
                              {Object.values(row).map((value: any, j: number) => (
                                <td key={j} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {typeof value === "object" ? JSON.stringify(value) : String(value)}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-gray-500">No sample data available</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
