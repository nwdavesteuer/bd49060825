// Sophisticated Emotion Analysis System
export interface EmotionAnalysis {
  primaryEmotion: string
  confidence: number
  secondaryEmotions: string[]
  intensity: number
  context: string
  triggers: string[]
  relationshipImpact: 'positive' | 'negative' | 'neutral' | 'complex'
}

export interface MessageContext {
  text: string
  timestamp: Date
  sender: string
  isFromMe: boolean
  previousMessage?: string
  nextMessage?: string
  messageLength: number
  timeOfDay: number
  dayOfWeek: number
  hasEmojis: boolean
  emojiCount: number
  punctuationCount: number
  capitalizationRatio: number
  repetitionCount: number
}

export class EmotionAnalyzer {
  private emotionKeywords = {
    love: {
      primary: ['love', 'heart', 'miss you', 'thinking of you', 'care about you'],
      secondary: ['adore', 'cherish', 'treasure', 'precious', 'beautiful'],
      emojis: ['💕', '❤️', '💖', '💝', '💗', '💓', '💘', '💞'],
      intensity: ['i love you', 'love you so much', 'love you forever', 'my love']
    },
    joy: {
      primary: ['haha', 'lol', 'lmao', 'omg', 'amazing', 'wow', 'awesome'],
      secondary: ['funny', 'hilarious', 'great', 'excellent', 'perfect'],
      emojis: ['😂', '😄', '😆', '🤣', '😊', '😃', '😁', '🎉', '✨'],
      intensity: ['hahahaha', 'lmao', 'omg', 'amazing', 'incredible']
    },
    sweet: {
      primary: ['sweet', 'cute', 'adorable', 'precious', 'beautiful'],
      secondary: ['lovely', 'charming', 'endearing', 'darling'],
      emojis: ['🥰', '😍', '💕', '❤️', '💖', '💝', '💗', '💓'],
      intensity: ['so sweet', 'adorable', 'precious', 'beautiful']
    },
    support: {
      primary: ['sorry', 'hope', 'feel better', 'it\'s ok', 'everything will be ok'],
      secondary: ['understand', 'here for you', 'support', 'care', 'worried'],
      emojis: ['💙', '🤗', '💪', '🙏', '💚'],
      intensity: ['i\'m so sorry', 'hope you feel better', 'everything will be ok']
    },
    celebration: {
      primary: ['birthday', 'anniversary', 'congratulations', 'congrats', 'celebration'],
      secondary: ['special', 'amazing', 'proud', 'achievement', 'milestone'],
      emojis: ['🎉', '🎊', '🎂', '🎈', '🎁', '🏆', '⭐'],
      intensity: ['happy birthday', 'congratulations', 'amazing achievement']
    },
    fights: {
      primary: ['fight', 'argument', 'angry', 'upset', 'furious', 'mad'],
      secondary: ['frustrated', 'annoyed', 'irritated', 'disappointed'],
      emojis: ['😠', '😡', '💢', '😤', '🤬'],
      intensity: ['i\'m so angry', 'furious', 'really upset', 'seriously']
    },
    anxiety: {
      primary: ['worried', 'anxious', 'nervous', 'scared', 'afraid', 'concerned'],
      secondary: ['stress', 'pressure', 'overwhelm', 'panic'],
      emojis: ['😰', '😨', '😱', '😥', '😓'],
      intensity: ['really worried', 'so anxious', 'terrified', 'panicking']
    },
    excitement: {
      primary: ['excited', 'thrilled', 'can\'t wait', 'looking forward', 'amazing'],
      secondary: ['awesome', 'incredible', 'fantastic', 'wonderful'],
      emojis: ['🎉', '✨', '🔥', '💯', '🚀', '⭐'],
      intensity: ['so excited', 'can\'t wait', 'thrilled', 'amazing']
    },
    sadness: {
      primary: ['sad', 'depressed', 'down', 'blue', 'melancholy'],
      secondary: ['disappointed', 'hurt', 'broken', 'lonely'],
      emojis: ['😢', '😭', '💔', '😔', '😞', '😥'],
      intensity: ['so sad', 'really down', 'heartbroken', 'devastated']
    },
    gratitude: {
      primary: ['thank you', 'thanks', 'appreciate', 'grateful', 'blessed'],
      secondary: ['owe you', 'indebted', 'thankful', 'appreciation'],
      emojis: ['🙏', '💙', '💚', '💜', '🤗'],
      intensity: ['thank you so much', 'really appreciate', 'so grateful']
    },
    sexiness: {
      primary: ['sexy', 'hot', 'attractive', 'beautiful', 'gorgeous', 'stunning'],
      secondary: ['alluring', 'seductive', 'charming', 'handsome', 'cute'],
      emojis: ['😘', '😍', '🥵', '🔥', '💋', '👄', '💄', '💅'],
      intensity: ['so sexy', 'incredibly hot', 'absolutely gorgeous', 'stunning']
    },
    flirtation: {
      primary: ['flirt', 'tease', 'wink', 'playful', 'naughty', 'mischievous'],
      secondary: ['cute', 'adorable', 'sweet', 'charming', 'fun'],
      emojis: ['😉', '😏', '😋', '😛', '😜', '😝', '🤪', '😎'],
      intensity: ['so playful', 'very naughty', 'mischievous', 'teasing']
    },
    intimacy: {
      primary: ['intimate', 'close', 'personal', 'private', 'special', 'deep'],
      secondary: ['meaningful', 'profound', 'significant', 'important'],
      emojis: ['💕', '💖', '💗', '💓', '💘', '💞', '💝'],
      intensity: ['deeply intimate', 'very personal', 'meaningful connection']
    },
    jealousy: {
      primary: ['jealous', 'envious', 'possessive', 'protective', 'mine'],
      secondary: ['worried', 'concerned', 'suspicious', 'doubtful'],
      emojis: ['😤', '😒', '😕', '😟', '😔'],
      intensity: ['so jealous', 'really possessive', 'very protective']
    },
    nostalgia: {
      primary: ['remember', 'miss', 'old times', 'back then', 'used to'],
      secondary: ['memories', 'past', 'history', 'before', 'earlier'],
      emojis: ['😌', '😊', '🥰', '💭', '📸', '🎞️'],
      intensity: ['miss those days', 'remember when', 'good old times']
    },
    surprise: {
      primary: ['surprised', 'shocked', 'amazed', 'wow', 'omg', 'unexpected'],
      secondary: ['astonished', 'stunned', 'incredible', 'unbelievable'],
      emojis: ['😲', '😱', '😳', '🤯', '😵', '💥'],
      intensity: ['completely shocked', 'totally surprised', 'absolutely amazed']
    },
    confusion: {
      primary: ['confused', 'unsure', 'uncertain', 'maybe', 'not sure'],
      secondary: ['puzzled', 'perplexed', 'bewildered', 'mystified'],
      emojis: ['😕', '🤔', '😶', '😐', '😑', '🤷'],
      intensity: ['really confused', 'totally unsure', 'completely puzzled']
    },
    relief: {
      primary: ['relieved', 'better', 'okay', 'fine', 'good', 'phew'],
      secondary: ['calm', 'peaceful', 'settled', 'resolved'],
      emojis: ['😌', '😊', '😄', '😃', '🙂', '😉'],
      intensity: ['so relieved', 'finally', 'at last', 'phew']
    },
    longing: {
      primary: ['miss you', 'want you', 'need you', 'wish you were here'],
      secondary: ['longing', 'yearning', 'desire', 'craving'],
      emojis: ['💔', '😢', '😭', '💕', '💖', '💗'],
      intensity: ['miss you so much', 'want you here', 'need you now']
    },
    playfulness: {
      primary: ['fun', 'playful', 'silly', 'goofy', 'crazy', 'wild'],
      secondary: ['entertaining', 'amusing', 'delightful', 'enjoyable'],
      emojis: ['😄', '😆', '🤪', '😜', '😝', '🤣', '🎉', '🎊'],
      intensity: ['so much fun', 'really playful', 'totally silly']
    }
  }

  private contextPatterns = {
    lateNight: { start: 22, end: 6, weight: 1.5 },
    earlyMorning: { start: 6, end: 9, weight: 1.2 },
    weekend: { days: [0, 6], weight: 1.3 },
    longMessage: { minLength: 100, weight: 1.4 },
    shortMessage: { maxLength: 10, weight: 0.8 },
    emojiHeavy: { minEmojis: 3, weight: 1.3 },
    allCaps: { threshold: 0.7, weight: 1.2 },
    repetition: { minRepeats: 3, weight: 1.1 }
  }

  private relationshipDynamics = {
    apologyPattern: /(sorry|apologize|forgive).*(love|care|miss)/i,
    reconciliationPattern: /(miss you|love you|care).*(sorry|understand)/i,
    escalationPattern: /(stop|enough|seriously|really).*(angry|upset|mad)/i,
    deEscalationPattern: /(calm|relax|breathe|okay).*(love|care)/i
  }

  analyzeEmotion(context: MessageContext): EmotionAnalysis {
    const text = context.text.toLowerCase()
    const emotions = this.detectEmotions(text, context)
    const primaryEmotion = this.determinePrimaryEmotion(emotions, context)
    const intensity = this.calculateIntensity(text, context)
    const relationshipImpact = this.assessRelationshipImpact(emotions, context)

    return {
      primaryEmotion,
      confidence: this.calculateConfidence(emotions, context),
      secondaryEmotions: this.getSecondaryEmotions(emotions),
      intensity,
      context: this.analyzeContext(context),
      triggers: this.identifyTriggers(text, context),
      relationshipImpact
    }
  }

  private detectEmotions(text: string, context: MessageContext): Record<string, number> {
    const emotions: Record<string, number> = {}

    // Analyze each emotion category
    Object.entries(this.emotionKeywords).forEach(([emotion, patterns]) => {
      let score = 0

      // Primary keywords (highest weight)
      patterns.primary.forEach(keyword => {
        const matches = (text.match(new RegExp(keyword, 'gi')) || []).length
        score += matches * 3
      })

      // Secondary keywords (medium weight)
      patterns.secondary.forEach(keyword => {
        const matches = (text.match(new RegExp(keyword, 'gi')) || []).length
        score += matches * 2
      })

      // Emojis (high weight)
      patterns.emojis.forEach(emoji => {
        const matches = (text.match(new RegExp(emoji, 'g')) || []).length
        score += matches * 2.5
      })

      // Intensity keywords (highest weight)
      patterns.intensity.forEach(keyword => {
        const matches = (text.match(new RegExp(keyword, 'gi')) || []).length
        score += matches * 4
      })

      // Apply context multipliers
      score = this.applyContextMultipliers(score, emotion, context)

      if (score > 0) {
        emotions[emotion] = score
      }
    })

    return emotions
  }

  private applyContextMultipliers(score: number, emotion: string, context: MessageContext): number {
    let multiplier = 1

    // Time-based context
    if (this.isLateNight(context.timeOfDay)) {
      if (['love', 'sadness', 'anxiety', 'deepTalks'].includes(emotion)) {
        multiplier *= 1.5
      }
    }

    // Message length context
    if (context.messageLength > 100) {
      if (['love', 'support', 'gratitude', 'deepTalks'].includes(emotion)) {
        multiplier *= 1.3
      }
    }

    // Emoji context
    if (context.emojiCount > 2) {
      if (['joy', 'sweet', 'celebration', 'excitement'].includes(emotion)) {
        multiplier *= 1.2
      }
    }

    // Capitalization context
    if (context.capitalizationRatio > 0.7) {
      if (['fights', 'excitement', 'anger'].includes(emotion)) {
        multiplier *= 1.4
      }
    }

    // Repetition context
    if (context.repetitionCount > 2) {
      if (['fights', 'excitement', 'anxiety'].includes(emotion)) {
        multiplier *= 1.3
      }
    }

    return score * multiplier
  }

  private determinePrimaryEmotion(emotions: Record<string, number>, context: MessageContext): string {
    if (Object.keys(emotions).length === 0) {
      return 'neutral'
    }

    // Find the emotion with the highest score
    const primaryEmotion = Object.entries(emotions)
      .sort(([,a], [,b]) => b - a)[0]

    // Check for complex emotions (multiple high scores)
    const highScoringEmotions = Object.entries(emotions)
      .filter(([,score]) => score > 2)
      .sort(([,a], [,b]) => b - a)

    if (highScoringEmotions.length > 1) {
      const topScore = highScoringEmotions[0][1]
      const closeEmotions = highScoringEmotions
        .filter(([,score]) => score >= topScore * 0.8)

      if (closeEmotions.length > 1) {
        // Check for specific combinations
        const emotionNames = closeEmotions.map(([name]) => name)
        
        if (emotionNames.includes('love') && emotionNames.includes('sadness')) {
          return 'longing'
        }
        if (emotionNames.includes('fights') && emotionNames.includes('love')) {
          return 'passionate_conflict'
        }
        if (emotionNames.includes('joy') && emotionNames.includes('gratitude')) {
          return 'appreciation'
        }
      }
    }

    return primaryEmotion[0]
  }

  private calculateIntensity(text: string, context: MessageContext): number {
    let intensity = 1

    // Punctuation intensity
    const exclamationCount = (text.match(/!/g) || []).length
    const questionCount = (text.match(/\?/g) || []).length
    intensity += (exclamationCount * 0.3) + (questionCount * 0.2)

    // Capitalization intensity
    const capsRatio = context.capitalizationRatio
    intensity += capsRatio * 0.5

    // Emoji intensity
    intensity += context.emojiCount * 0.2

    // Repetition intensity
    intensity += context.repetitionCount * 0.3

    // Message length intensity
    if (context.messageLength > 200) intensity += 0.5
    if (context.messageLength < 10) intensity -= 0.3

    return Math.min(intensity, 5) // Cap at 5
  }

  private assessRelationshipImpact(emotions: Record<string, number>, context: MessageContext): 'positive' | 'negative' | 'neutral' | 'complex' {
    const positiveEmotions = ['love', 'joy', 'sweet', 'support', 'celebration', 'excitement', 'gratitude']
    const negativeEmotions = ['fights', 'anxiety', 'sadness']
    
    const positiveScore = positiveEmotions.reduce((sum, emotion) => sum + (emotions[emotion] || 0), 0)
    const negativeScore = negativeEmotions.reduce((sum, emotion) => sum + (emotions[emotion] || 0), 0)

    if (positiveScore > negativeScore * 2) return 'positive'
    if (negativeScore > positiveScore * 2) return 'negative'
    if (positiveScore > 0 && negativeScore > 0) return 'complex'
    return 'neutral'
  }

  private analyzeContext(context: MessageContext): string {
    const contexts = []

    if (this.isLateNight(context.timeOfDay)) {
      contexts.push('late_night')
    }
    if (context.messageLength > 100) {
      contexts.push('long_message')
    }
    if (context.emojiCount > 2) {
      contexts.push('emoji_heavy')
    }
    if (context.capitalizationRatio > 0.7) {
      contexts.push('emphatic')
    }
    if (context.repetitionCount > 2) {
      contexts.push('repetitive')
    }

    return contexts.join(', ') || 'standard'
  }

  private identifyTriggers(text: string, context: MessageContext): string[] {
    const triggers = []

    // Time-based triggers
    if (this.isLateNight(context.timeOfDay)) {
      triggers.push('late_night_emotions')
    }

    // Content-based triggers
    if (text.includes('work') || text.includes('job')) {
      triggers.push('work_stress')
    }
    if (text.includes('family') || text.includes('parents')) {
      triggers.push('family_dynamics')
    }
    if (text.includes('money') || text.includes('expensive')) {
      triggers.push('financial_stress')
    }

    // Relationship triggers
    if (this.relationshipDynamics.apologyPattern.test(text)) {
      triggers.push('apology_moment')
    }
    if (this.relationshipDynamics.reconciliationPattern.test(text)) {
      triggers.push('reconciliation')
    }

    return triggers
  }

  private calculateConfidence(emotions: Record<string, number>, context: MessageContext): number {
    const totalScore = Object.values(emotions).reduce((sum, score) => sum + score, 0)
    const maxPossibleScore = Object.keys(this.emotionKeywords).length * 10 // Theoretical max
    
    let confidence = totalScore / maxPossibleScore

    // Boost confidence for clear emotional signals
    if (context.emojiCount > 0) confidence += 0.1
    if (context.messageLength > 50) confidence += 0.1
    if (Object.keys(emotions).length === 1) confidence += 0.2

    return Math.min(confidence, 1)
  }

  private getSecondaryEmotions(emotions: Record<string, number>): string[] {
    return Object.entries(emotions)
      .sort(([,a], [,b]) => b - a)
      .slice(1, 3) // Get top 2-3 secondary emotions
      .map(([emotion]) => emotion)
  }

  private isLateNight(hour: number): boolean {
    return hour >= 22 || hour <= 6
  }
}

// Helper function to create message context
export function createMessageContext(
  text: string,
  timestamp: string,
  sender: string,
  isFromMe: boolean,
  previousMessage?: string,
  nextMessage?: string
): MessageContext {
  const date = new Date(timestamp)
  const words = text.split(/\s+/)
  const emojis = (text.match(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu) || [])
  
  return {
    text,
    timestamp: date,
    sender,
    isFromMe,
    previousMessage,
    nextMessage,
    messageLength: text.length,
    timeOfDay: date.getHours(),
    dayOfWeek: date.getDay(),
    hasEmojis: emojis.length > 0,
    emojiCount: emojis.length,
    punctuationCount: (text.match(/[!?.,;:]/g) || []).length,
    capitalizationRatio: (text.match(/[A-Z]/g) || []).length / text.length,
    repetitionCount: countRepetitions(text)
  }
}

function countRepetitions(text: string): number {
  const words = text.toLowerCase().split(/\s+/)
  const wordCount: Record<string, number> = {}
  
  words.forEach(word => {
    wordCount[word] = (wordCount[word] || 0) + 1
  })
  
  return Object.values(wordCount).filter(count => count > 1).length
} 