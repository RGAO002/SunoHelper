import type { StateCreator } from 'zustand'
import type { PitchFrame, NoteSegment } from '@/types/pitch'

export interface PitchDataSlice {
  pitchFrames: PitchFrame[]
  notes: NoteSegment[]
  setPitchFrames: (frames: PitchFrame[]) => void
  setNotes: (notes: NoteSegment[]) => void
  updateNotePitch: (
    noteId: string,
    correctedMidi: number,
    correctedCents: number,
  ) => void
  resetPitchData: () => void
}

export const createPitchDataSlice: StateCreator<
  PitchDataSlice,
  [],
  [],
  PitchDataSlice
> = (set) => ({
  pitchFrames: [],
  notes: [],
  setPitchFrames: (frames) => set({ pitchFrames: frames }),
  setNotes: (notes) => set({ notes }),
  updateNotePitch: (noteId, correctedMidi, correctedCents) =>
    set((state) => ({
      notes: state.notes.map((n) =>
        n.id === noteId
          ? { ...n, correctedMidiNote: correctedMidi, correctedCents }
          : n,
      ),
    })),
  resetPitchData: () => set({ pitchFrames: [], notes: [] }),
})
