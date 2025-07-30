import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MessageSquare, Heart, Calendar, Database, Smartphone, BarChart3, Settings } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto py-12 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Love Letters & Message Timeline</h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Transform your text messages into cinematic love letters and explore your conversation history through
              beautiful visualizations and timelines.
            </p>
          </div>

          {/* Main Navigation Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {/* Messages Timeline */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-blue-600" />
                  Message Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Browse your complete message history organized by year with search and filtering capabilities.
                </p>
                <Link href="/mobile-messages">
                  <Button className="w-full">Browse Messages</Button>
                </Link>
              </CardContent>
            </Card>

            {/* Love Letters */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-red-600" />
                  Love Letters
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Experience your most meaningful conversations transformed into cinematic love letters.
                </p>
                <Link href="/love-letters">
                  <Button className="w-full">View Love Letters</Button>
                </Link>
              </CardContent>
            </Card>

            {/* Visualizations */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-green-600" />
                  Visualizations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Explore heatmaps, word clouds, and other visual representations of your conversations.
                </p>
                <Link href="/visual-heatmap">
                  <Button className="w-full">View Charts</Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Tools & Utilities */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Tools & Utilities</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Database Diagnostic */}
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="pt-4">
                  <div className="text-center">
                    <Database className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                    <h3 className="font-medium mb-2">Database Diagnostic</h3>
                    <Link href="/diagnostic">
                      <Button variant="outline" size="sm">
                        Run Tests
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>

              {/* Word Evolution */}
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="pt-4">
                  <div className="text-center">
                    <BarChart3 className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <h3 className="font-medium mb-2">Word Evolution</h3>
                    <Link href="/word-evolution">
                      <Button variant="outline" size="sm">
                        View Evolution
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Status */}
          <Card className="bg-white/50 backdrop-blur">
            <CardContent className="pt-6">
              <div className="text-center">
                <h3 className="font-medium text-gray-900 mb-2">Current Data Source</h3>
                <div className="flex items-center justify-center gap-2">
                  <Database className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-gray-600">fulldata_set table</span>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  All features are now using your complete dataset as the source of truth
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
