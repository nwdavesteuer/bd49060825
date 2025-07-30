"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Heart, Star, BellRingIcon as Ring, Home, Plane } from "lucide-react"

interface RelationshipPhase {
  id: string
  title: string
  startDate: string
  endDate?: string
  description: string
  icon: React.ComponentType<any>
  color: string
  milestones: Array<{
    date: string
    title: string
    description: string
  }>
  messageCount: number
  loveMessageCount: number
}

export default function RelationshipPhases() {
  const [phases, setPhases] = useState<RelationshipPhase[]>([])
  const [selectedPhase, setSelectedPhase] = useState<string | null>(null)

  useEffect(() => {
    // Sample relationship phases - in real app this would be calculated from message data
    const samplePhases: RelationshipPhase[] = [
      {
        id: "early-dating",
        title: "Early Dating",
        startDate: "2015-07-24",
        endDate: "2015-12-31",
        description: "The beginning of our beautiful journey together",
        icon: Heart,
        color: "pink",
        milestones: [
          {
            date: "2015-07-24",
            title: "First Messages",
            description: "Our conversation began",
          },
          {
            date: "2015-08-15",
            title: "First Date",
            description: "Our first official date",
          },
          {
            date: "2015-09-20",
            title: "First 'I Love You'",
            description: "The moment everything changed",
          },
        ],
        messageCount: 5420,
        loveMessageCount: 234,
      },
      {
        id: "long-distance",
        title: "Long Distance",
        startDate: "2016-01-01",
        endDate: "2017-06-30",
        description: "Testing our love across the miles",
        icon: Plane,
        color: "blue",
        milestones: [
          {
            date: "2016-01-15",
            title: "First Separation",
            description: "You moved for work",
          },
          {
            date: "2016-06-20",
            title: "First Visit",
            description: "Reunited after months apart",
          },
          {
            date: "2017-02-14",
            title: "Valentine's Apart",
            description: "Our first Valentine's Day long distance",
          },
        ],
        messageCount: 12890,
        loveMessageCount: 1456,
      },
      {
        id: "living-together",
        title: "Living Together",
        startDate: "2017-07-01",
        endDate: "2019-08-20",
        description: "Building our life together",
        icon: Home,
        color: "green",
        milestones: [
          {
            date: "2017-07-01",
            title: "Moved In Together",
            description: "Our first shared apartment",
          },
          {
            date: "2018-07-24",
            title: "3 Year Anniversary",
            description: "Celebrating three years together",
          },
          {
            date: "2019-05-15",
            title: "Adopted Our Pet",
            description: "Our little family grew",
          },
        ],
        messageCount: 8934,
        loveMessageCount: 892,
      },
      {
        id: "engagement",
        title: "Engagement",
        startDate: "2019-08-21",
        endDate: "2021-06-15",
        description: "Planning our forever",
        icon: Ring,
        color: "purple",
        milestones: [
          {
            date: "2019-08-21",
            title: "The Proposal",
            description: "You said yes!",
          },
          {
            date: "2020-02-14",
            title: "Wedding Planning Begins",
            description: "Starting to plan our special day",
          },
          {
            date: "2020-12-25",
            title: "Christmas Engaged",
            description: "Our first Christmas as fiancés",
          },
        ],
        messageCount: 6745,
        loveMessageCount: 1234,
      },
      {
        id: "married-life",
        title: "Married Life",
        startDate: "2021-06-16",
        description: "Our happily ever after continues",
        icon: Star,
        color: "gold",
        milestones: [
          {
            date: "2021-06-16",
            title: "Wedding Day",
            description: "We became husband and wife",
          },
          {
            date: "2022-06-16",
            title: "First Anniversary",
            description: "One year of marriage",
          },
          {
            date: "2023-07-24",
            title: "8 Years Together",
            description: "Eight amazing years since we started talking",
          },
        ],
        messageCount: 15678,
        loveMessageCount: 2345,
      },
    ]

    setPhases(samplePhases)
  }, [])

  const getColorClasses = (color: string) => {
    const colorMap: { [key: string]: string } = {
      pink: "bg-pink-100 text-pink-800 border-pink-300",
      blue: "bg-blue-100 text-blue-800 border-blue-300",
      green: "bg-green-100 text-green-800 border-green-300",
      purple: "bg-purple-100 text-purple-800 border-purple-300",
      gold: "bg-yellow-100 text-yellow-800 border-yellow-300",
    }
    return colorMap[color] || "bg-gray-100 text-gray-800 border-gray-300"
  }

  const getIconColorClasses = (color: string) => {
    const colorMap: { [key: string]: string } = {
      pink: "text-pink-500",
      blue: "text-blue-500",
      green: "text-green-500",
      purple: "text-purple-500",
      gold: "text-yellow-500",
    }
    return colorMap[color] || "text-gray-500"
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Relationship Phases</h1>
          <p className="text-gray-600">The chapters of your love story</p>
        </div>

        {/* Timeline Overview */}
        <div className="mb-8">
          <div className="flex flex-wrap justify-center gap-2">
            {phases.map((phase) => {
              const Icon = phase.icon
              return (
                <Button
                  key={phase.id}
                  variant={selectedPhase === phase.id ? "default" : "outline"}
                  onClick={() => setSelectedPhase(selectedPhase === phase.id ? null : phase.id)}
                  className="flex items-center space-x-2"
                >
                  <Icon className="w-4 h-4" />
                  <span>{phase.title}</span>
                </Button>
              )
            })}
          </div>
        </div>

        {/* Phase Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {phases
            .filter((phase) => !selectedPhase || phase.id === selectedPhase)
            .map((phase) => {
              const Icon = phase.icon
              return (
                <Card key={phase.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-3">
                      <div className={`p-2 rounded-full bg-white shadow-sm`}>
                        <Icon className={`w-6 h-6 ${getIconColorClasses(phase.color)}`} />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">{phase.title}</h3>
                        <p className="text-sm text-gray-600">
                          {new Date(phase.startDate).toLocaleDateString()} -{" "}
                          {phase.endDate ? new Date(phase.endDate).toLocaleDateString() : "Present"}
                        </p>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 mb-4">{phase.description}</p>

                    {/* Stats */}
                    <div className="flex space-x-4 mb-6">
                      <Badge variant="secondary">{phase.messageCount.toLocaleString()} messages</Badge>
                      <Badge className={getColorClasses(phase.color)}>
                        <Heart className="w-3 h-3 mr-1" />
                        {phase.loveMessageCount} love messages
                      </Badge>
                    </div>

                    {/* Milestones */}
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                        <Star className="w-4 h-4 mr-2 text-yellow-500" />
                        Key Milestones
                      </h4>
                      <div className="space-y-3">
                        {phase.milestones.map((milestone, index) => (
                          <div key={index} className="flex items-start space-x-3">
                            <div className="flex-shrink-0 w-2 h-2 bg-gray-400 rounded-full mt-2" />
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="font-medium text-gray-900">{milestone.title}</span>
                                <span className="text-xs text-gray-500">
                                  {new Date(milestone.date).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600">{milestone.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
        </div>

        {/* Summary Stats */}
        {!selectedPhase && (
          <div className="mt-12">
            <Card>
              <CardHeader>
                <CardTitle className="text-center">Your Journey Together</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                  <div>
                    <div className="text-3xl font-bold text-gray-900">
                      {phases.reduce((sum, phase) => sum + phase.messageCount, 0).toLocaleString()}
                    </div>
                    <div className="text-gray-600">Total Messages</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-pink-600">
                      {phases.reduce((sum, phase) => sum + phase.loveMessageCount, 0).toLocaleString()}
                    </div>
                    <div className="text-gray-600">Love Messages</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-purple-600">{phases.length}</div>
                    <div className="text-gray-600">Relationship Phases</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
