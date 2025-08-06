export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-4xl font-bold mb-4">Love Letters & Message Timeline</h1>
      <p className="text-lg mb-8">Welcome to your message timeline app!</p>
      <div className="space-y-4">
        <a href="/mobile-messages" className="block text-blue-400 hover:text-blue-300">
          → Go to Mobile Messages
        </a>
        <a href="/test" className="block text-blue-400 hover:text-blue-300">
          → Test Page
        </a>
        <a href="/simple" className="block text-blue-400 hover:text-blue-300">
          → Simple Page
        </a>
      </div>
    </div>
  )
}