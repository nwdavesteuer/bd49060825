import { create } from 'zustand'

export interface AudioState {
  isPlaying: boolean
  currentAudioFile: string | null
  currentIndex: number
  autoPlay: boolean
  volume: number
  playbackRate: number
  isMuted: boolean
  audioFiles: string[]
  setAudioFiles: (files: string[]) => void
  play: (audioFile?: string, index?: number) => void
  pause: () => void
  stop: () => void
  next: () => void
  previous: () => void
  setAutoPlay: (autoPlay: boolean) => void
  setVolume: (volume: number) => void
  setPlaybackRate: (rate: number) => void
  toggleMute: () => void
  reset: () => void
}

export const useAudioStore = create<AudioState>((set, get) => ({
  isPlaying: false,
  currentAudioFile: null,
  currentIndex: 0,
  autoPlay: false,
  volume: 1,
  playbackRate: 1,
  isMuted: false,
  audioFiles: [],

  setAudioFiles: (files: string[]) => {
    set({ audioFiles: files, currentIndex: 0, currentAudioFile: files[0] || null })
  },

  play: (audioFile?: string, index?: number) => {
    const { audioFiles } = get()
    if (audioFile) {
      const newIndex = audioFiles.indexOf(audioFile)
      if (newIndex !== -1) {
        set({ 
          isPlaying: true, 
          currentAudioFile: audioFile, 
          currentIndex: newIndex 
        })
      }
    } else if (index !== undefined) {
      const file = audioFiles[index]
      if (file) {
        set({ 
          isPlaying: true, 
          currentAudioFile: file, 
          currentIndex: index 
        })
      }
    } else {
      set({ isPlaying: true })
    }
  },

  pause: () => {
    set({ isPlaying: false })
  },

  stop: () => {
    set({ isPlaying: false, currentIndex: 0, currentAudioFile: get().audioFiles[0] || null })
  },

  next: () => {
    const { audioFiles, currentIndex } = get()
    if (currentIndex < audioFiles.length - 1) {
      const nextIndex = currentIndex + 1
      const nextFile = audioFiles[nextIndex]
      set({ 
        currentIndex: nextIndex, 
        currentAudioFile: nextFile,
        isPlaying: get().autoPlay 
      })
    }
  },

  previous: () => {
    const { currentIndex } = get()
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1
      const prevFile = get().audioFiles[prevIndex]
      set({ 
        currentIndex: prevIndex, 
        currentAudioFile: prevFile,
        isPlaying: get().autoPlay 
      })
    }
  },

  setAutoPlay: (autoPlay: boolean) => {
    set({ autoPlay })
  },

  setVolume: (volume: number) => {
    set({ volume, isMuted: volume === 0 })
  },

  setPlaybackRate: (rate: number) => {
    set({ playbackRate: rate })
  },

  toggleMute: () => {
    const { isMuted, volume } = get()
    set({ isMuted: !isMuted })
  },

  reset: () => {
    set({
      isPlaying: false,
      currentAudioFile: null,
      currentIndex: 0,
      autoPlay: false,
      volume: 1,
      playbackRate: 1,
      isMuted: false,
      audioFiles: []
    })
  }
})) 