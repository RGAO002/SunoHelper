import type { StateCreator } from 'zustand'

export interface AudioSlice {
  audioBuffer: AudioBuffer | null
  audioUrl: string | null
  sampleRate: number
  duration: number
  setAudioBuffer: (buffer: AudioBuffer) => void
  setAudioUrl: (url: string) => void
  resetAudio: () => void
}

export const createAudioSlice: StateCreator<AudioSlice, [], [], AudioSlice> = (
  set,
) => ({
  audioBuffer: null,
  audioUrl: null,
  sampleRate: 44100,
  duration: 0,
  setAudioBuffer: (buffer) =>
    set({
      audioBuffer: buffer,
      sampleRate: buffer.sampleRate,
      duration: buffer.duration,
    }),
  setAudioUrl: (url) => set({ audioUrl: url }),
  resetAudio: () =>
    set({ audioBuffer: null, audioUrl: null, sampleRate: 44100, duration: 0 }),
})
