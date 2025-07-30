import SupabaseDiagnostic from "@/components/supabase-diagnostic"

export default function DiagnosticPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Database Diagnostic</h1>
          <p className="text-gray-600">
            This page runs comprehensive tests on your Supabase integration to identify any issues with the fulldata_set
            table.
          </p>
        </div>

        <SupabaseDiagnostic />
      </div>
    </div>
  )
}
