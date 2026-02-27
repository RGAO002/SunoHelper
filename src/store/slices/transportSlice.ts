import type { StateCreator } from 'zustand'

export interface TransportSlice {
  isPlaying: boolean
  currentTime: number
  playbackMode: 'original' | 'corrected'
  /** Incremented each time seekTo is called — usePlayhead watches this to trigger a seek */
  seekGeneration: number
  setIsPlaying: (playing: boolean) => void
  setCurrentTime: (time: number) => void
  /** Explicitly seek the player to a time position (used by stop, playhead click, etc.) */
  seekTo: (time: number) => void
  setPlaybackMode: (mode: 'original' | 'corrected') => void
  resetTransport: () => void
}

export const createTransportSlice: StateCreator<
  TransportSlice,
  [],
  [],
  TransportSlice
> = (set) => ({
  isPlaying: false,
  currentTime: 0,
  playbackMode: 'original',
  seekGeneration: 0,
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setCurrentTime: (time) => set({ currentTime: time }),
  seekTo: (time) =>
    set((state) => ({
      currentTime: time,
      seekGeneration: state.seekGeneration + 1,
    })),
  setPlaybackMode: (mode) => set({ playbackMode: mode }),
  resetTransport: () =>
    set({ isPlaying: false, currentTime: 0, playbackMode: 'original', seekGeneration: 0 }),
})
