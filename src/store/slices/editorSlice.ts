import type { StateCreator } from 'zustand'
import type { Viewport } from '@/types/editor'

export type AppPhase =
  | 'idle'
  | 'recording'
  | 'analyzing'
  | 'analyzed'
  | 'corrected'
  | 'exporting'

export interface EditorSlice {
  phase: AppPhase
  viewport: Viewport
  selectedNoteIds: Set<string>
  setPhase: (phase: AppPhase) => void
  setViewport: (viewport: Partial<Viewport>) => void
  setSelectedNoteIds: (ids: Set<string>) => void
  toggleNoteSelection: (noteId: string) => void
  resetEditor: () => void
}

const DEFAULT_VIEWPORT: Viewport = {
  startTime: 0,
  endTime: 10,
  bottomMidi: 48, // C3
  topMidi: 72, // C5
  pixelsPerSecond: 100,
  pixelsPerSemitone: 20,
}

export const createEditorSlice: StateCreator<
  EditorSlice,
  [],
  [],
  EditorSlice
> = (set) => ({
  phase: 'idle' as AppPhase,
  viewport: DEFAULT_VIEWPORT,
  selectedNoteIds: new Set<string>(),
  setPhase: (phase) => set({ phase }),
  setViewport: (partial) =>
    set((state) => ({ viewport: { ...state.viewport, ...partial } })),
  setSelectedNoteIds: (ids) => set({ selectedNoteIds: ids }),
  toggleNoteSelection: (noteId) =>
    set((state) => {
      const next = new Set(state.selectedNoteIds)
      if (next.has(noteId)) next.delete(noteId)
      else next.add(noteId)
      return { selectedNoteIds: next }
    }),
  resetEditor: () =>
    set({
      phase: 'idle',
      viewport: DEFAULT_VIEWPORT,
      selectedNoteIds: new Set(),
    }),
})
