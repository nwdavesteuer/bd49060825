import JsonToCsvConverter from "../../components/json-to-csv-converter"

export default function CsvConverterPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-12 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">JSON to CSV Converter</h1>
          <p className="text-gray-600">Convert your iMessage data for easy Supabase upload</p>
        </div>

        <JsonToCsvConverter />
      </div>
    </div>
  )
}
