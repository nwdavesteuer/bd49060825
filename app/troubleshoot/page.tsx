import { DatabaseTroubleshooter } from "@/components/database-troubleshooter"

export default function TroubleshootPage() {
  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Database Troubleshooter</h1>
      <DatabaseTroubleshooter />
    </div>
  )
}
