import AttachmentColumnFixer from "@/components/attachment-column-fixer"

export default function FixAttachmentsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Fix Attachment Columns</h1>
          <p className="text-gray-600">Diagnose and fix missing attachment columns in your database</p>
        </div>

        <AttachmentColumnFixer />
      </div>
    </div>
  )
}
