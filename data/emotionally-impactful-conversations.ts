// This file contains the identified emotionally impactful conversations
// These are now sourced from the Supabase database instead of static data

export interface LoveLetterMessage {
  id: string
  text: string
  sender: string
  timestamp: string
  date: string
  is_from_me: boolean
}

export interface LoveLetter {
  id: string
  title: string
  date: string
  preview: string
  mood: "romantic" | "playful" | "deep" | "nostalgic"
  emotionalScore: number
  tags: string[]
  messages: LoveLetterMessage[]
}

// Year selector for styling and categorization
export const yearSelector: Record<string, { label: string; color: string }> = {
  "2015": { label: "The Beginning", color: "#FF6B6B" },
  "2016": { label: "Growing Closer", color: "#4ECDC4" },
  "2017": { label: "Deepening Bond", color: "#45B7D1" },
  "2018": { label: "Steady Love", color: "#96CEB4" },
  "2019": { label: "Mature Connection", color: "#FFEAA7" },
  "2020": { label: "Pandemic Together", color: "#DDA0DD" },
  "2021": { label: "Resilient Love", color: "#98D8C8" },
  "2022": { label: "Established Partnership", color: "#F7DC6F" },
  "2023": { label: "Enduring Romance", color: "#BB8FCE" },
  "2024": { label: "Present Day", color: "#85C1E9" },
}

// This data is now dynamically loaded from Supabase
// The component will try to fetch from these tables in order:
// 1. love_letters
// 2. emotionally_impactful_conversations
// 3. Generate from high-emotion messages in david_nitzan_all_messages

export const identifiedLoveLetters: LoveLetter[] = []

// Export for backward compatibility
export const emotionallyImpactfulConversations = identifiedLoveLetters

// Helper function to get love letters by mood
export function getLoveLettersByMood(mood: LoveLetter["mood"]): LoveLetter[] {
  return identifiedLoveLetters.filter((letter) => letter.mood === mood)
}

// Helper function to get top love letters by emotional score
export function getTopLoveLetters(limit = 5): LoveLetter[] {
  return identifiedLoveLetters.sort((a, b) => b.emotionalScore - a.emotionalScore).slice(0, limit)
}

// Helper function to search love letters by tag
export function searchLoveLettersByTag(tag: string): LoveLetter[] {
  return identifiedLoveLetters.filter((letter) => letter.tags.some((t) => t.toLowerCase().includes(tag.toLowerCase())))
}
