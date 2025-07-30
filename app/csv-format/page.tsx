import CsvFormatHelper from "../../components/csv-format-helper"

export default function CsvFormatPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-12 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">CSV Format Guide</h1>
          <p className="text-gray-600">How to format your CSV file for successful import</p>
        </div>

        <CsvFormatHelper />
      </div>
    </div>
  )
}
