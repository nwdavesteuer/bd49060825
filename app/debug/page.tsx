export default function DebugPage() {
    return (
        <div className="min-h-screen bg-gray-900 text-white p-8">
            <h1 className="text-2xl font-bold mb-4">Debug Page</h1>
            <div className="space-y-2">
                <p><strong>Environment:</strong> {process.env.NODE_ENV}</p>
                <p><strong>Supabase URL:</strong> {process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Configured' : 'Missing'}</p>
                <p><strong>Supabase Key:</strong> {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Configured' : 'Missing'}</p>
                <p><strong>Timestamp:</strong> {new Date().toISOString()}</p>
            </div>
            <div className="mt-8">
                <a href="/" className="text-blue-400 hover:text-blue-300">← Back to Home</a>
            </div>
        </div>
    )
}
