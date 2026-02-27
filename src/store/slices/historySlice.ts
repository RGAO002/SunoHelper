import type { StateCreator } from 'zustand'
import type { CorrectionEdit } from '@/types/correction'

export interface HistorySlice {
  undoStack: CorrectionEdit[]
  redoStack: CorrectionEdit[]
  pushHistory: (edit: CorrectionEdit) => void
  undo: () => CorrectionEdit | null
  redo: () => CorrectionEdit | null
  resetHistory: () => void
}

export const createHistorySlice: StateCreator<
  HistorySlice,
  [],
  [],
  HistorySlice
> = (set, get) => ({
  undoStack: [],
  redoStack: [],
  pushHistory: (edit) =>
    set((state) => ({
      undoStack: [...state.undoStack, edit],
      redoStack: [],
    })),
  undo: () => {
    const { undoStack } = get()
    if (undoStack.length === 0) return null
    const last = undoStack[undoStack.length - 1]
    set((state) => ({
      undoStack: state.undoStack.slice(0, -1),
      redoStack: [...state.redoStack, last],
    }))
    return last
  },
  redo: () => {
    const { redoStack } = get()
    if (redoStack.length === 0) return null
    const last = redoStack[redoStack.length - 1]
    set((state) => ({
      undoStack: [...state.undoStack, last],
      redoStack: state.redoStack.slice(0, -1),
    }))
    return last
  },
  resetHistory: () => set({ undoStack: [], redoStack: [] }),
})
