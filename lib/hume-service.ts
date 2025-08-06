export interface HumeTTSRequest {
  text: string
  model_id?: string
  voice_id?: string
  speed?: number
  stability?: number
  similarity_boost?: number
  style?: number
  use_speaker_boost?: boolean
}

export interface HumeTTSResponse {
  audio: string // base64 encoded audio
  duration: number
  model_id: string
  voice_id: string
}

export class HumeService {
  private apiKey: string
  private baseUrl = 'https://api.hume.ai/v0'

  constructor() {
    this.apiKey = process.env.HUME_API_KEY || '5sMy54ZASUGzlDJv8f2nOIliS5AqEJmYyhECrA6VqiwZVIFx'
  }

  async generateAudio(request: HumeTTSRequest): Promise<HumeTTSResponse> {
    const response = await fetch(`${this.baseUrl}/text-to-speech`, {
      method: 'POST',
      headers: {
        'X-Hume-Api-Key': this.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: request.text,
        model_id: request.model_id || 'eleven_turbo_v2',
        voice_id: request.voice_id || 'pNInz6obpgDQGcFmaJgB', // Default voice
        speed: request.speed || 1.0,
        stability: request.stability || 0.5,
        similarity_boost: request.similarity_boost || 0.75,
        style: request.style || 0.0,
        use_speaker_boost: request.use_speaker_boost || true,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Hume API error: ${response.status} - ${error}`)
    }

    const data = await response.json()
    return {
      audio: data.audio,
      duration: data.duration || 0,
      model_id: data.model_id,
      voice_id: data.voice_id,
    }
  }

  async getAvailableVoices() {
    const response = await fetch(`${this.baseUrl}/voices`, {
      headers: {
        'X-Hume-Api-Key': this.apiKey,
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch voices: ${response.status}`)
    }

    return response.json()
  }

  // Helper method to convert base64 audio to blob URL
  createAudioBlob(base64Audio: string): string {
    const binaryString = atob(base64Audio)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }
    const blob = new Blob([bytes], { type: 'audio/mpeg' })
    return URL.createObjectURL(blob)
  }
}

export const humeService = new HumeService() 