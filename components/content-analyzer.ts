export interface ContentAnalysis {
  sentiment: "positive" | "negative" | "neutral"
  emotionalIntensity: number
  topics: string[]
  isLoveMessage: boolean
  isMilestone: boolean
}

export class ContentAnalyzer {
  private loveKeywords = [
    "love you",
    "i love",
    "love u",
    "❤️",
    "💕",
    "💖",
    "💗",
    "💘",
    "💙",
    "💚",
    "💛",
    "💜",
    "🧡",
    "🖤",
    "🤍",
    "🤎",
    "miss you",
    "miss u",
    "missing you",
    "thinking of you",
    "can't wait",
    "forever",
    "always",
    "beautiful",
    "gorgeous",
    "handsome",
    "amazing",
    "perfect",
    "wonderful",
    "incredible",
    "moon and back",
    "to the moon",
    "infinity",
    "eternity",
    "soulmate",
    "my heart",
    "my world",
    "kiss",
    "kisses",
    "hug",
    "hugs",
    "cuddle",
    "snuggle",
    "baby",
    "babe",
    "honey",
    "sweetheart",
    "darling",
    "my love",
    "beloved",
    "precious",
    "treasure",
    "angel",
    "dream",
    "dreams",
  ]

  private milestoneKeywords = [
    "marry",
    "wedding",
    "proposal",
    "engaged",
    "anniversary",
    "birthday",
    "graduation",
    "new job",
    "moving",
    "vacation",
    "holiday",
    "christmas",
    "new year",
    "valentine",
  ]

  private positiveKeywords = [
    "happy",
    "excited",
    "amazing",
    "wonderful",
    "great",
    "awesome",
    "fantastic",
    "perfect",
    "beautiful",
    "love",
    "joy",
    "smile",
    "laugh",
    "fun",
    "good",
    "best",
    "incredible",
    "outstanding",
    "excellent",
  ]

  private negativeKeywords = [
    "sad",
    "angry",
    "upset",
    "disappointed",
    "frustrated",
    "worried",
    "scared",
    "hurt",
    "pain",
    "sorry",
    "apologize",
    "mistake",
    "wrong",
    "bad",
    "terrible",
    "awful",
    "hate",
    "annoyed",
    "stressed",
  ]

  analyze(text: string): ContentAnalysis {
    const lowerText = text.toLowerCase()

    // Check if it's a love message
    const isLoveMessage = this.loveKeywords.some((keyword) => lowerText.includes(keyword))

    // Check if it's a milestone
    const isMilestone = this.milestoneKeywords.some((keyword) => lowerText.includes(keyword))

    // Analyze sentiment
    const positiveCount = this.positiveKeywords.filter((keyword) => lowerText.includes(keyword)).length
    const negativeCount = this.negativeKeywords.filter((keyword) => lowerText.includes(keyword)).length

    let sentiment: "positive" | "negative" | "neutral" = "neutral"
    if (positiveCount > negativeCount) {
      sentiment = "positive"
    } else if (negativeCount > positiveCount) {
      sentiment = "negative"
    }

    // Calculate emotional intensity (0-1 scale)
    const emotionalIntensity = Math.min((positiveCount + negativeCount + (isLoveMessage ? 2 : 0)) / 10, 1)

    // Extract topics (simplified)
    const topics: string[] = []
    if (isLoveMessage) topics.push("love")
    if (isMilestone) topics.push("milestone")
    if (lowerText.includes("work") || lowerText.includes("job")) topics.push("work")
    if (lowerText.includes("family")) topics.push("family")
    if (lowerText.includes("travel") || lowerText.includes("vacation")) topics.push("travel")
    if (lowerText.includes("food") || lowerText.includes("dinner")) topics.push("food")

    return {
      sentiment,
      emotionalIntensity,
      topics,
      isLoveMessage,
      isMilestone,
    }
  }

  analyzeBatch(messages: Array<{ text: string; id: string }>): Map<string, ContentAnalysis> {
    const results = new Map<string, ContentAnalysis>()
    messages.forEach((message) => {
      results.set(message.id, this.analyze(message.text))
    })
    return results
  }
}

export const contentAnalyzer = new ContentAnalyzer()
