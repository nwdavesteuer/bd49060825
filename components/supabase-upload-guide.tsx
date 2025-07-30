"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, Database, FileText, CheckCircle, AlertCircle, Copy } from "lucide-react"

export default function SupabaseUploadGuide() {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const sqlScript = `-- First, let's check if your table exists
SELECT COUNT(*) FROM messages;

-- If you need to clear existing data (optional)
-- DELETE FROM messages;

-- Sample insert statement (you'll replace this with your actual data)
INSERT INTO messages (
  original_id,
  date_sent,
  sender,
  content,
  message_type,
  year,
  month,
  day,
  metadata
) VALUES 
(
  'sample_guid_123',
  '2016-01-25 18:56:09',
  'nitzan',
  'Hey! How was your day? 😊',
  'text',
  2016,
  1,
  25,
  '{"service": "iMessage"}'
);`

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <Database className="w-6 h-6" />
            Upload Your JSON to Supabase
          </CardTitle>
          <p className="text-blue-700">Choose the method that works best for you</p>
        </CardHeader>
      </Card>

      <Tabs defaultValue="import-tool" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="import-tool">Import Tool</TabsTrigger>
          <TabsTrigger value="dashboard">Dashboard Upload</TabsTrigger>
          <TabsTrigger value="sql-editor">SQL Editor</TabsTrigger>
          <TabsTrigger value="manual">Manual Steps</TabsTrigger>
        </TabsList>

        <TabsContent value="import-tool" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-green-600" />
                Method 1: Use Our Import Tool (Recommended)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-green-800">Easiest Method</span>
                </div>
                <p className="text-green-700 text-sm">
                  This is the simplest way - just upload your JSON file and we'll handle everything automatically.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                    1
                  </span>
                  <div>
                    <div className="font-medium">Go back to the Import Tool</div>
                    <div className="text-sm text-gray-600">
                      Navigate to the main page where you see the "Import Your iMessage Data" section
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                    2
                  </span>
                  <div>
                    <div className="font-medium">Upload your JSON file</div>
                    <div className="text-sm text-gray-600">Click "Choose File" and select your complete JSON file</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                    3
                  </span>
                  <div>
                    <div className="font-medium">Review and Import</div>
                    <div className="text-sm text-gray-600">
                      Check the preview and click "Import Messages" when ready
                    </div>
                  </div>
                </div>
              </div>

              <Button className="w-full" onClick={() => (window.location.href = "/")}>
                <Upload className="w-4 h-4 mr-2" />
                Go to Import Tool
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dashboard" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5 text-blue-600" />
                Method 2: Supabase Dashboard Upload
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-blue-800">Direct Database Access</span>
                </div>
                <p className="text-blue-700 text-sm">
                  Upload directly through the Supabase dashboard if you prefer manual control.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                    1
                  </span>
                  <div>
                    <div className="font-medium">Open Supabase Dashboard</div>
                    <div className="text-sm text-gray-600">
                      Go to{" "}
                      <a
                        href="https://supabase.com/dashboard"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 underline"
                      >
                        supabase.com/dashboard
                      </a>
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                    2
                  </span>
                  <div>
                    <div className="font-medium">Navigate to your project</div>
                    <div className="text-sm text-gray-600">
                      Find your project: <code className="bg-gray-100 px-1 rounded">fblwndzprmvjajayxjln</code>
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                    3
                  </span>
                  <div>
                    <div className="font-medium">Go to Table Editor</div>
                    <div className="text-sm text-gray-600">Click on "Table Editor" in the left sidebar</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                    4
                  </span>
                  <div>
                    <div className="font-medium">Select the messages table</div>
                    <div className="text-sm text-gray-600">Click on the "messages" table</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                    5
                  </span>
                  <div>
                    <div className="font-medium">Import CSV</div>
                    <div className="text-sm text-gray-600">
                      Click "Import data via CSV" (you'll need to convert your JSON to CSV first)
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-5 h-5 text-yellow-600" />
                  <span className="font-medium text-yellow-800">Note</span>
                </div>
                <p className="text-yellow-700 text-sm">
                  The dashboard method requires converting your JSON to CSV format first. The Import Tool (Method 1) is
                  much easier!
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sql-editor" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-600" />
                Method 3: SQL Editor (Advanced)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-5 h-5 text-purple-600" />
                  <span className="font-medium text-purple-800">For Advanced Users</span>
                </div>
                <p className="text-purple-700 text-sm">
                  Use SQL commands to insert your data directly. Good for smaller datasets or testing.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <span className="bg-purple-100 text-purple-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                    1
                  </span>
                  <div>
                    <div className="font-medium">Open SQL Editor</div>
                    <div className="text-sm text-gray-600">
                      In your Supabase dashboard, go to "SQL Editor" in the left sidebar
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="bg-purple-100 text-purple-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                    2
                  </span>
                  <div>
                    <div className="font-medium">Use the sample SQL below</div>
                    <div className="text-sm text-gray-600">Modify the INSERT statements with your actual data</div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-900 rounded-lg p-4 relative">
                <Button
                  size="sm"
                  variant="outline"
                  className="absolute top-2 right-2"
                  onClick={() => copyToClipboard(sqlScript)}
                >
                  {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
                <pre className="text-green-400 text-sm overflow-x-auto">{sqlScript}</pre>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <span className="font-medium text-red-800">Warning</span>
                </div>
                <p className="text-red-700 text-sm">
                  This method is not practical for large datasets (37,000+ messages). Use the Import Tool instead!
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manual" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Quick Manual Steps
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-green-800">Recommended Approach</span>
                </div>
                <p className="text-green-700 text-sm">
                  For your 37,000+ messages, the Import Tool is definitely the best option.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h4 className="font-medium">✅ What You Need:</h4>
                  <ul className="text-sm space-y-1 text-gray-600">
                    <li>• Your complete JSON file</li>
                    <li>• Supabase database already set up</li>
                    <li>• Tables created (already done)</li>
                    <li>• Connection working (already tested)</li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <h4 className="font-medium">🚀 Next Steps:</h4>
                  <ul className="text-sm space-y-1 text-gray-600">
                    <li>• Go back to the Import Tool</li>
                    <li>• Upload your JSON file</li>
                    <li>• Review the analysis</li>
                    <li>• Click "Import Messages"</li>
                    <li>• Wait for completion</li>
                  </ul>
                </div>
              </div>

              <div className="flex gap-3">
                <Button className="flex-1" onClick={() => (window.location.href = "/")}>
                  <Upload className="w-4 h-4 mr-2" />
                  Use Import Tool
                </Button>
                <Button
                  variant="outline"
                  onClick={() => window.open("https://supabase.com/dashboard", "_blank")}
                  className="flex-1"
                >
                  <Database className="w-4 h-4 mr-2" />
                  Open Supabase Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="w-5 h-5 text-yellow-600" />
            <span className="font-medium text-yellow-800">💡 Pro Tip</span>
          </div>
          <p className="text-yellow-700">
            Since you have 37,660 messages, I strongly recommend using <strong>Method 1: Import Tool</strong>. It's
            specifically designed to handle large datasets efficiently and will automatically format your data correctly
            for Supabase.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
