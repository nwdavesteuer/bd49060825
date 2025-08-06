import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MessageSquare, Heart, BarChart3, Brain, Camera, Volume2 } from "lucide-react"

export default function HomePage() {
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

            {/* 2016 Love Notes */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-pink-600" />
                  2016 Love Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Listen to 42 carefully selected love notes from 2016, converted to audio using David's voice.
                </p>
                <Link href="/love-notes-2016">
                  <Button className="w-full">Listen to 2016 Notes</Button>
                </Link>
              </CardContent>
            </Card>

            {/* Audio Comparison */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Volume2 className="h-5 w-5 text-purple-600" />
                  Audio Comparison
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Compare 2015 vs 2016 voice quality and text completeness side by side.
                </p>
                <Link href="/audio-comparison">
                  <Button className="w-full">Compare Audio Quality</Button>
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

            {/* Emotions Explorer */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-purple-600" />
                  Emotions Explorer
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Test and debug emotion tagging functionality. Explore emotional patterns in your conversations.
                </p>
                <Link href="/emotions-explorer">
                  <Button className="w-full">Explore Emotions</Button>
                </Link>
              </CardContent>
            </Card>

            {/* Photo Timeline */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="h-5 w-5 text-green-600" />
                  Photo Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Visual memories alongside your messages. Upload photos or connect to iCloud for a complete timeline.
                </p>
                <Link href="/photo-timeline">
                  <Button className="w-full">View Photos</Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Additional Features */}
          <div className="mb-8 sm:mb-12">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6 text-center">Additional Features</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Word Evolution */}
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="pt-4">
                  <div className="text-center">
                    <BarChart3 className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <h3 className="font-medium mb-2">Word Evolution</h3>
                    <p className="text-sm text-gray-600 mb-3">
                      Track how your vocabulary and communication patterns have evolved over time.
                    </p>
                    <Link href="/word-evolution">
                      <Button variant="outline" size="sm">
                        View Evolution
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>

              {/* Visual Heatmap */}
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="pt-4">
                  <div className="text-center">
                    <BarChart3 className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <h3 className="font-medium mb-2">Visual Heatmap</h3>
                    <p className="text-sm text-gray-600 mb-3">
                      See your messaging patterns visualized in an interactive heatmap.
                    </p>
                    <Link href="/visual-heatmap">
                      <Button variant="outline" size="sm">
                        View Heatmap
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
