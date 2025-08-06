import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MessageSquare, Heart, BarChart3, Brain, Camera, Volume2 } from "lucide-react"

export default function NavigationPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto py-8 px-4 sm:py-12">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8 sm:mb-12">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Love Letters & Message Timeline</h1>
            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
              Transform your text messages into cinematic love letters and explore your conversation history through
              beautiful visualizations and timelines.
            </p>
          </div>

          {/* Main Navigation Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-12">
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
                <Link href="/">
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

            {/* Analytics */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-green-600" />
                  Analytics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Explore patterns in your conversations with detailed analytics and insights.
                </p>
                <Link href="/emotions-explorer">
                  <Button className="w-full">View Analytics</Button>
                </Link>
              </CardContent>
            </Card>

            {/* Emotion Explorer */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-purple-600" />
                  Emotion Explorer
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Discover the emotional journey of your relationship through AI-powered sentiment analysis.
                </p>
                <Link href="/emotions-explorer">
                  <Button className="w-full">Explore Emotions</Button>
                </Link>
              </CardContent>
            </Card>

            {/* Visual Heatmap */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-orange-600" />
                  Visual Heatmap
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  See your conversation patterns visualized as an interactive heatmap over time.
                </p>
                <Link href="/visual-heatmap">
                  <Button className="w-full">View Heatmap</Button>
                </Link>
              </CardContent>
            </Card>

            {/* Photo Timeline */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="h-5 w-5 text-pink-600" />
                  Photo Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Journey through your shared memories with a chronological photo timeline.
                </p>
                <Link href="/photo-timeline">
                  <Button className="w-full">Browse Photos</Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Secondary Features */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Volume2 className="h-4 w-4 text-blue-600" />
                  Audio Comparison
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm mb-3">
                  Compare audio messages from different years.
                </p>
                <Link href="/audio-comparison">
                  <Button variant="outline" size="sm" className="w-full">
                    Compare Audio
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Heart className="h-4 w-4 text-red-600" />
                  2016 Love Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm mb-3">
                  Special collection from 2016.
                </p>
                <Link href="/love-notes-2016">
                  <Button variant="outline" size="sm" className="w-full">
                    View 2016 Notes
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <MessageSquare className="h-4 w-4 text-green-600" />
                  Word Evolution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm mb-3">
                  See how your language evolved.
                </p>
                <Link href="/word-evolution">
                  <Button variant="outline" size="sm" className="w-full">
                    Word Evolution
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <BarChart3 className="h-4 w-4 text-purple-600" />
                  Diagnostic
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm mb-3">
                  System diagnostics and data health.
                </p>
                <Link href="/diagnostic">
                  <Button variant="outline" size="sm" className="w-full">
                    Run Diagnostic
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}