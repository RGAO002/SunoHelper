export interface CorrectionEdit {
  noteId: string
  fromMidiNote: number
  fromCents: number
  toMidiNote: number
  toCents: number
  timestamp: number
}

export type ScaleType =
  | 'chromatic'
  | 'major'
  | 'minor'
  | 'pentatonic'
  | 'blues'

export interface ScaleConfig {
  root: number // 0..11 (C=0, C#=1, ...)
  intervals: number[]
  name: string
}

export interface CorrectionParams {
  autoCorrectStrength: number // 0..100
  targetScale: ScaleConfig
  preserveFormants: boolean
  correctionSpeed: number // ms
}
