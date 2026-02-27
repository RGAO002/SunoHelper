export interface Viewport {
  startTime: number
  endTime: number
  bottomMidi: number // e.g. 48 (C3)
  topMidi: number // e.g. 72 (C5)
  pixelsPerSecond: number
  pixelsPerSemitone: number
}

export type DragStatus = 'idle' | 'hovering' | 'dragging'

export interface DragState {
  status: DragStatus
  targetNoteId: string | null
  startMouseY: number
  startMidiNote: number
  currentMidiNote: number
  currentCents: number
  snapEnabled: boolean
}
