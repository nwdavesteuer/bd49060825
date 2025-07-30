"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle, CheckCircle, Database, Wrench, RefreshCw } from "lucide-react"
import { supabase } from "../lib/supabase"

export default function AttachmentColumnFixer() {
  const [checking, setChecking] = useState(false)
  const [fixing, setFixing] = useState(false)
  const [status, setStatus] = useState<any>(null)
  const [fixed, setFixed] = useState(false)

  const checkAttachmentColumns = async () => {
    setChecking(true)
    try {
      // Check if attachment columns exist by trying to select them
      const { data: columnCheck, error: columnError } = await supabase
        .from("messages")
        .select("has_attachments, attachment_type, attachment_path")
        .limit(1)

      // Check current message_type distribution
      const { data: typeData, error: typeError } = await supabase.from("messages").select("message_type")

      if (typeError) throw typeError

      const typeCounts =
        typeData?.reduce((acc: any, msg) => {
          acc[msg.message_type] = (acc[msg.message_type] || 0) + 1
          return acc
        }, {}) || {}

      // Check total messages
      const { count: totalCount } = await supabase.from("messages").select("*", { count: "exact", head: true })

      setStatus({
        hasAttachmentColumns: !columnError,
        columnError: columnError?.message,
        totalMessages: totalCount,
        messageTypes: typeCounts,
        attachmentMessages: typeCounts.image || 0,
        needsFix: columnError !== null,
      })
    } catch (error: any) {
      console.error("Error checking columns:", error)
      setStatus({
        hasAttachmentColumns: false,
        columnError: error.message,
        needsFix: true,
      })
    } finally {
      setChecking(false)
    }
  }

  const fixAttachmentColumns = async () => {
    setFixing(true)
    try {
      // We can't run ALTER TABLE from the client, so we'll update the CSV importer
      // to handle attachment columns properly on the next import

      // For now, let's update existing records to set proper attachment flags
      const { data: messages, error: fetchError } = await supabase.from("messages").select("id, message_type, metadata")

      if (fetchError) throw fetchError

      // Update messages that should have attachment flags
      const updates =
        messages?.map((msg) => ({
          id: msg.id,
          has_attachments: msg.message_type === "image" || msg.message_type === "video" || msg.message_type === "audio",
          attachment_type: msg.message_type === "text" ? null : msg.message_type,
        })) || []

      // We need to add the columns first via SQL
      alert(
        'Please run the SQL script "04-add-attachment-columns.sql" in your Supabase SQL editor first, then click "Recheck Columns"',
      )
    } catch (error: any) {
      console.error("Error fixing columns:", error)
    } finally {
      setFixing(false)
    }
  }

  useEffect(() => {
    checkAttachmentColumns()
  }, [])

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="w-5 h-5" />
          Attachment Column Diagnostic
        </CardTitle>
        <p className="text-sm text-gray-600">
          Checking if your database has the proper attachment columns from your CSV
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {checking && (
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
            <div className="text-blue-800">Checking database schema...</div>
          </div>
        )}

        {status && (
          <div className="space-y-4">
            {/* Column Status */}
            <div
              className={`p-4 rounded-lg border-2 ${
                status.hasAttachmentColumns ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                {status.hasAttachmentColumns ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600" />
                )}
                <span className="font-medium">
                  {status.hasAttachmentColumns ? "✅ Attachment columns exist" : "❌ Missing attachment columns"}
                </span>
              </div>

              {!status.hasAttachmentColumns && (
                <div className="text-sm text-red-700">
                  <div className="font-medium mb-1">Missing columns:</div>
                  <ul className="list-disc list-inside space-y-1">
                    <li>
                      <code>has_attachments</code> (boolean)
                    </li>
                    <li>
                      <code>attachment_type</code> (text)
                    </li>
                    <li>
                      <code>attachment_path</code> (text)
                    </li>
                    <li>
                      <code>attachment_filename</code> (text)
                    </li>
                  </ul>
                  <div className="mt-2 text-xs">Error: {status.columnError}</div>
                </div>
              )}
            </div>

            {/* Current Data Status */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="font-medium mb-3">Current Database Status</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{status.totalMessages?.toLocaleString() || 0}</div>
                  <div className="text-sm text-gray-600">Total Messages</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{status.messageTypes?.image || 0}</div>
                  <div className="text-sm text-gray-600">Image Messages</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{status.messageTypes?.text || 0}</div>
                  <div className="text-sm text-gray-600">Text Messages</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {Object.keys(status.messageTypes || {}).length}
                  </div>
                  <div className="text-sm text-gray-600">Message Types</div>
                </div>
              </div>

              {status.messageTypes && (
                <div className="mt-4 p-3 bg-white rounded border">
                  <div className="text-sm font-medium mb-2">Message Type Breakdown:</div>
                  <div className="text-xs space-y-1">
                    {Object.entries(status.messageTypes).map(([type, count]: [string, any]) => (
                      <div key={type} className="flex justify-between">
                        <span>{type}:</span>
                        <span className="font-medium">{count.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Fix Instructions */}
            {status.needsFix && (
              <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Wrench className="w-5 h-5 text-yellow-600" />
                  <span className="font-medium text-yellow-800">Fix Required</span>
                </div>

                <div className="space-y-3 text-sm text-yellow-800">
                  <div>
                    <div className="font-medium">Step 1: Add Missing Columns</div>
                    <div>Run the SQL script "04-add-attachment-columns.sql" in your Supabase SQL editor</div>
                  </div>

                  <div>
                    <div className="font-medium">Step 2: Re-import CSV</div>
                    <div>Your CSV has attachment data, but it wasn't imported because the columns didn't exist</div>
                  </div>

                  <div>
                    <div className="font-medium">Step 3: Verify</div>
                    <div>Use this tool to confirm the columns were added successfully</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button onClick={checkAttachmentColumns} disabled={checking} variant="outline">
            <RefreshCw className={`w-4 h-4 mr-2 ${checking ? "animate-spin" : ""}`} />
            Recheck Columns
          </Button>

          {status?.needsFix && (
            <Button
              onClick={() => window.open("/scripts/04-add-attachment-columns.sql", "_blank")}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Database className="w-4 h-4 mr-2" />
              View SQL Script
            </Button>
          )}
        </div>

        {/* Expected vs Actual */}
        {status && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-800 mb-2">Expected vs Actual</h3>
            <div className="text-sm text-blue-700 space-y-1">
              <div>📊 Your CSV should have ~102 messages with attachments</div>
              <div>🔍 Currently found: {status.attachmentMessages} image messages</div>
              <div>💡 Missing attachment columns means CSV attachment data wasn't imported</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
