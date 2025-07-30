"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle, Loader2, Database } from "lucide-react"
import { testConnection } from "../lib/supabase"

export default function ConnectionTest() {
  const [status, setStatus] = useState<"idle" | "testing" | "success" | "error">("idle")
  const [result, setResult] = useState<any>(null)

  const runTest = async () => {
    setStatus("testing")
    const testResult = await testConnection()
    setResult(testResult)
    setStatus(testResult.success ? "success" : "error")
  }

  useEffect(() => {
    runTest()
  }, [])

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="w-5 h-5" />
          Supabase Connection
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          {status === "testing" && <Loader2 className="w-5 h-5 animate-spin text-blue-500" />}
          {status === "success" && <CheckCircle className="w-5 h-5 text-green-500" />}
          {status === "error" && <XCircle className="w-5 h-5 text-red-500" />}
          <span>
            {status === "idle" && "Ready to test"}
            {status === "testing" && "Testing connection..."}
            {status === "success" && "Connected successfully!"}
            {status === "error" && "Connection failed"}
          </span>
        </div>

        {result && (
          <div className="text-sm">
            {result.success ? (
              <div className="text-green-600 p-3 bg-green-50 rounded">
                ✅ Database is ready for your messages!
                <div className="text-xs mt-1">Connected to: fblwndzprmvjajayxjln.supabase.co</div>
              </div>
            ) : (
              <div className="text-red-600 p-3 bg-red-50 rounded">❌ Error: {result.error}</div>
            )}
          </div>
        )}

        <Button onClick={runTest} disabled={status === "testing"} className="w-full">
          {status === "testing" ? "Testing..." : "Test Connection"}
        </Button>
      </CardContent>
    </Card>
  )
}
