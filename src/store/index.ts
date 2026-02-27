import { create } from 'zustand'
import { createAudioSlice, type AudioSlice } from './slices/audioSlice'
import {
  createPitchDataSlice,
  type PitchDataSlice,
} from './slices/pitchDataSlice'
import { createEditorSlice, type EditorSlice } from './slices/editorSlice'
import {
  createCorrectionSlice,
  type CorrectionSlice,
} from './slices/correctionSlice'
import { createHistorySlice, type HistorySlice } from './slices/historySlice'
import {
  createTransportSlice,
  type TransportSlice,
} from './slices/transportSlice'

export type StoreState = AudioSlice &
  PitchDataSlice &
  EditorSlice &
  CorrectionSlice &
  HistorySlice &
  TransportSlice

export const useStore = create<StoreState>()((...a) => ({
  ...createAudioSlice(...a),
  ...createPitchDataSlice(...a),
  ...createEditorSlice(...a),
  ...createCorrectionSlice(...a),
  ...createHistorySlice(...a),
  ...createTransportSlice(...a),
}))

export type { AppPhase } from './slices/editorSlice'
