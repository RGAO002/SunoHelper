import type { ScaleConfig, ScaleType } from '@/types/correction'

export const NOTE_NAMES = [
  'C', 'C#', 'D', 'D#', 'E', 'F',
  'F#', 'G', 'G#', 'A', 'A#', 'B',
] as const

export const SCALE_INTERVALS: Record<ScaleType, number[]> = {
  chromatic: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
  pentatonic: [0, 2, 4, 7, 9],
  blues: [0, 3, 5, 6, 7, 10],
}

export const KEY_NAMES: Record<number, string> = {
  0: 'C', 1: 'C#', 2: 'D', 3: 'D#', 4: 'E', 5: 'F',
  6: 'F#', 7: 'G', 8: 'G#', 9: 'A', 10: 'A#', 11: 'B',
}

export const BLACK_KEYS = new Set([1, 3, 6, 8, 10])

export function createScaleConfig(
  root: number,
  type: ScaleType,
): ScaleConfig {
  return {
    root,
    intervals: SCALE_INTERVALS[type],
    name: `${KEY_NAMES[root]} ${type}`,
  }
}

/** Default analysis config */
export const ANALYSIS_CONFIG = {
  windowSize: 2048,
  hopSize: 512,
  clarityThreshold: 0.65,
  minFrequency: 80,
  maxFrequency: 1000,
  minNoteDuration: 0.05, // 50ms
  pitchJumpThreshold: 0.8, // semitones
  sampleRate: 44100,
} as const
