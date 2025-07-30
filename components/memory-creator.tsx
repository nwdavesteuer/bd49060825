"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sparkles, Search, Check, X } from "lucide-react"

interface Message {
  id: string
  date: string
  time: string
  sender: "you" | "nitzan"
  content: string
  type: "text" | "image" | "special"
  year: number
  month: number
  day: number
}

interface Theme {
  id: string
  name: string
  color: string
}

interface MemoryCreatorProps {
  messages: Message[]
  themes: Theme[]
  onSave: (memory: any) => void
  onCancel: () => void
}

export default function MemoryCreator({ messages, themes, onSave, onCancel }: MemoryCreatorProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [selectedTheme, setSelectedTheme] = useState(themes[0]?.id || "")
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedMessages, setSelectedMessages] = useState<Message[]>([])

  const filteredMessages = messages.filter((msg) => msg.content.toLowerCase().includes(searchTerm.toLowerCase()))

  const toggleMessageSelection = (message: Message) => {
    if (selectedMessages.some((m) => m.id === message.id)) {
      setSelectedMessages(selectedMessages.filter((m) => m.id !== message.id))
    } else {
      setSelectedMessages([...selectedMessages, message])
    }
  }

  const handleSave = () => {
    if (!title || selectedMessages.length === 0 || !selectedTheme) return

    const memory = {
      id: `memory_${Date.now()}`,
      title,
      description,
      theme: selectedTheme,
      color: themes.find((t) => t.id === selectedTheme)?.color || "#000000",
      date: selectedMessages[0].date,
      messages: selectedMessages,
    }

    onSave(memory)
  }

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-400" />
            Create New Memory
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Memory Title</label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Our First Date"
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="A special moment to remember..."
                  className="bg-gray-800 border-gray-700 text-white h-24"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Theme</label>
                <Select value={selectedTheme} onValueChange={setSelectedTheme}>
                  <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                    <SelectValue placeholder="Select a theme" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700 text-white">
                    {themes.map((theme) => (
                      <SelectItem key={theme.id} value={theme.id}>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: theme.color }} />
                          <span>{theme.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Selected Messages</label>
                <div className="bg-gray-800 border border-gray-700 rounded-md p-3 h-48 overflow-y-auto">
                  {selectedMessages.length === 0 ? (
                    <div className="text-gray-500 text-center py-4">No messages selected</div>
                  ) : (
                    <div className="space-y-2">
                      {selectedMessages.map((message) => (
                        <div key={message.id} className="flex justify-between items-center bg-gray-700 p-2 rounded">
                          <div className="truncate text-sm">{message.content}</div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => toggleMessageSelection(message)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Search Messages</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search for messages to include..."
                    className="pl-10 bg-gray-800 border-gray-700 text-white"
                  />
                </div>
              </div>

              <div className="bg-gray-800 border border-gray-700 rounded-md h-[350px] overflow-y-auto p-2">
                {filteredMessages.length === 0 ? (
                  <div className="text-gray-500 text-center py-4">No messages found</div>
                ) : (
                  <div className="space-y-2">
                    {filteredMessages.map((message) => {
                      const isSelected = selectedMessages.some((m) => m.id === message.id)
                      return (
                        <div
                          key={message.id}
                          className={`p-3 rounded-lg cursor-pointer transition-all ${
                            message.sender === "you"
                              ? "bg-blue-900/30 hover:bg-blue-900/50"
                              : "bg-gray-700 hover:bg-gray-600"
                          } ${isSelected ? "ring-2 ring-blue-500" : ""}`}
                          onClick={() => toggleMessageSelection(message)}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="text-xs text-gray-400 mb-1">
                                {message.sender === "you" ? "You" : "Nitzan"} •{" "}
                                {new Date(message.date).toLocaleDateString()}
                              </div>
                              <div className="text-sm">{message.content}</div>
                            </div>
                            <div
                              className={`w-5 h-5 rounded-full flex items-center justify-center ${
                                isSelected ? "bg-blue-500" : "bg-gray-600"
                              }`}
                            >
                              {isSelected && <Check className="w-3 h-3 text-white" />}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
            <Button variant="outline" onClick={onCancel} className="border-gray-700 text-gray-300 hover:bg-gray-800">
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!title || selectedMessages.length === 0 || !selectedTheme}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Create Memory
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
