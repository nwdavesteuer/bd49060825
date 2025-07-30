"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Info, FileText, Copy, CheckCircle } from "lucide-react"

export default function CsvFormatHelper() {
  const [copied, setCopied] = useState(false)

  const sampleCsv = `guid,text,readable_date,is_from_me,has_attachments,service
"msg123","Hey there!","2023-01-01 12:30:45",1,0,"iMessage"
"msg124","Hi! How are you?","2023-01-01 12:31:20",0,0,"iMessage"
"msg125","Check out this photo","2023-01-01 12:35:10",1,1,"iMessage"
"msg126","That's amazing!","2023-01-01 12:36:45",0,0,"iMessage"`

  const copyToClipboard = () => {
    navigator.clipboard.writeText(sampleCsv)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card className="max-w-3xl mx-auto shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          CSV Format Guide
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Info className="w-5 h-5 text-blue-600" />
            <span className="font-medium text-blue-800">CSV Format Requirements</span>
          </div>
          <p className="text-sm text-blue-700 mb-3">
            For the importer to correctly identify your messages and attachments, your CSV needs these key columns:
          </p>
          <div className="space-y-2 text-sm text-blue-700">
            <div className="flex items-start gap-2">
              <div className="font-medium min-w-24">is_from_me:</div>
              <div>
                <p>
                  Set to <code className="bg-blue-100 px-1 rounded">1</code> for your messages,{" "}
                  <code className="bg-blue-100 px-1 rounded">0</code> for Nitzan's messages
                </p>
                <p className="text-xs mt-1">Also accepts: "true"/"false", "you"/"nitzan", "yes"/"no"</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="font-medium min-w-24">has_attachments:</div>
              <div>
                <p>
                  Set to <code className="bg-blue-100 px-1 rounded">1</code> for messages with images/attachments,{" "}
                  <code className="bg-blue-100 px-1 rounded">0</code> for text-only
                </p>
                <p className="text-xs mt-1">Also accepts: "true"/"false", "yes"/"no"</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="font-medium min-w-24">readable_date:</div>
              <div>
                <p>
                  Date in format: <code className="bg-blue-100 px-1 rounded">YYYY-MM-DD HH:MM:SS</code>
                </p>
                <p className="text-xs mt-1">Other standard date formats also work</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-lg font-medium">Sample CSV Format</h3>
          <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto relative">
            <Button
              size="sm"
              variant="outline"
              className="absolute top-2 right-2 bg-gray-800 text-gray-200 border-gray-700 hover:bg-gray-700"
              onClick={copyToClipboard}
            >
              {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span className="ml-2">{copied ? "Copied!" : "Copy"}</span>
            </Button>
            <pre className="text-sm whitespace-pre-wrap">{sampleCsv}</pre>
          </div>
          <p className="text-sm text-gray-600">
            Copy this sample and modify it to match your data structure. Save as a .csv file and upload.
          </p>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-yellow-800 mb-2">Troubleshooting Tips</h3>
          <ul className="space-y-2 text-sm text-yellow-700">
            <li>• Open your CSV in a text editor to verify the format</li>
            <li>
              • Make sure the <code className="bg-yellow-100 px-1 rounded">is_from_me</code> column has correct values
              (1 for your messages)
            </li>
            <li>
              • Check that <code className="bg-yellow-100 px-1 rounded">has_attachments</code> is properly set for
              messages with images
            </li>
            <li>• Ensure all text with commas is properly quoted</li>
            <li>• If using Excel/Sheets, export as CSV (not CSV UTF-8)</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
