"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle, CheckCircle, Trash2, Info, RefreshCw, Loader2 } from "lucide-react"
import { TABLE_NAME, getMessagesTable } from "../lib/supabase"

export default function SafeDuplicateHandler() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [deleteResult, setDeleteResult] = useState<{ success: boolean; message: string } | null>(null)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true)
        setDeleteResult(null)

        // First, check if the table exists by trying a simple count query
        const { data, error, count } = await getMessagesTable().select("*", { count: "exact", head: true })

        if (error) {
          // Handle the specific case where the table doesn't exist
          if (
            error.message.includes(`relation "public.${TABLE_NAME}" does not exist`) ||
            error.message.includes("does not exist")
          ) {
            setStats({
              tableExists: false,
              error: "Database table not found. Please run the setup scripts first.",
              totalMessages: 0,
            })
            return
          }

          console.error("Error fetching stats:", error)
          setStats({
            tableExists: false,
            error: `Database error: ${error.message}`,
            totalMessages: 0,
          })
          return
        }

        // If we get here, the table exists, so fetch the actual data
        const { data: messages, error: fetchError } = await getMessagesTable().select("*")

        if (fetchError) {
          console.error("Error fetching messages:", fetchError)
          setStats({
            tableExists: true,
            error: `Error fetching data: ${fetchError.message}`,
            totalMessages: 0,
          })
          return
        }

        // Process stats
        const processedStats = {
          tableExists: true,
          totalMessages: messages?.length || 0,
          dateRange: {
            earliest:
              messages && messages.length > 0
                ? new Date(Math.min(...messages.map((m) => new Date(m.date_sent).getTime())))
                : null,
            latest:
              messages && messages.length > 0
                ? new Date(Math.max(...messages.map((m) => new Date(m.date_sent).getTime())))
                : null,
          },
          fromYou: messages?.filter((m) => m.sender === "you").length || 0,
          fromNitzan: messages?.filter((m) => m.sender === "nitzan").length || 0,
        }

        setStats(processedStats)
      } catch (error) {
        console.error("Unexpected error:", error)
        setStats({
          tableExists: false,
          error: `Unexpected error: ${error instanceof Error ? error.message : String(error)}`,
          totalMessages: 0,
        })
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [deleteResult]) // Refetch when delete operation completes

  const clearAllData = async () => {
    if (!confirm("Are you sure you want to delete ALL messages? This cannot be undone.")) {
      return
    }

    try {
      setDeleting(true)
      const { error } = await getMessagesTable().delete().gte("created_at", "1900-01-01") // Delete all rows

      if (error) {
        console.error("Error deleting data:", error)
        setDeleteResult({
          success: false,
          message: `Failed to delete data: ${error.message}`,
        })
        return
      }

      setDeleteResult({
        success: true,
        message: "All data successfully deleted. You can now import your complete history.",
      })
    } catch (error) {
      console.error("Error:", error)
      setDeleteResult({
        success: false,
        message: `An unexpected error occurred: ${error instanceof Error ? error.message : String(error)}`,
      })
    } finally {
      setDeleting(false)
    }
  }

  const refreshStats = () => {
    setDeleteResult(null)
    setLoading(true)
    // The useEffect will handle the refresh since it depends on deleteResult
  }

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Current Database Status</h3>
          <Button variant="outline" size="sm" onClick={refreshStats} disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
            Refresh
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center p-8">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : stats ? (
          <div className="space-y-4">
            {!stats.tableExists ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-500" />
                  <div className="font-medium text-yellow-800">Database Setup Required</div>
                </div>
                <p className="text-sm text-yellow-700 mt-2">
                  {stats.error || "The messages table doesn't exist yet. Please run the database setup scripts first."}
                </p>
                <div className="mt-3 p-3 bg-yellow-100 rounded border">
                  <p className="text-sm font-medium text-yellow-800">Next Steps:</p>
                  <ol className="text-sm text-yellow-700 mt-1 ml-4 list-decimal">
                    <li>Make sure you've added the Supabase integration</li>
                    <li>Run the SQL scripts in order (01-create-tables.sql first)</li>
                    <li>Refresh this page once the scripts are complete</li>
                  </ol>
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-sm text-gray-500">Total Messages</div>
                    <div className="text-2xl font-bold">{stats.totalMessages.toLocaleString()}</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-sm text-gray-500">Date Range</div>
                    <div className="text-sm font-medium">
                      {stats.dateRange.earliest ? stats.dateRange.earliest.toLocaleDateString() : "N/A"} -{" "}
                      {stats.dateRange.latest ? stats.dateRange.latest.toLocaleDateString() : "N/A"}
                    </div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-sm text-gray-500">From You</div>
                    <div className="text-xl font-bold">{stats.fromYou.toLocaleString()}</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-sm text-gray-500">From Nitzan</div>
                    <div className="text-xl font-bold">{stats.fromNitzan.toLocaleString()}</div>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-blue-500 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-800">Preparing for Complete Import</h4>
                      <p className="text-sm text-blue-700 mt-1">
                        You currently have {stats.totalMessages.toLocaleString()} messages in your database. To avoid
                        duplicates when importing your complete history, you should clear this data first.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <Button
                    variant="destructive"
                    onClick={clearAllData}
                    disabled={deleting || stats.totalMessages === 0}
                    className="flex items-center gap-2"
                  >
                    {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    Clear All Data
                  </Button>

                  <div className="text-sm text-gray-500">
                    {stats.totalMessages === 0 ? "Database is empty" : "This will delete all existing messages"}
                  </div>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <div className="font-medium text-red-800">Could not connect to database</div>
            </div>
            <p className="text-sm text-red-700 mt-2">
              There was an error connecting to your Supabase database. Please check your connection settings.
            </p>
          </div>
        )}

        {deleteResult && (
          <div
            className={`p-4 rounded-lg border ${deleteResult.success ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}
          >
            <div className="flex items-center gap-2">
              {deleteResult.success ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-500" />
              )}
              <div className={`font-medium ${deleteResult.success ? "text-green-800" : "text-red-800"}`}>
                {deleteResult.success ? "Success!" : "Error"}
              </div>
            </div>
            <p className={`text-sm mt-1 ${deleteResult.success ? "text-green-700" : "text-red-700"}`}>
              {deleteResult.message}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
