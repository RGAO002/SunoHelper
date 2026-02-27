import { NOTE_NAMES } from '@/constants/music'

/** Convert frequency (Hz) to exact MIDI note number (float) */
export function freqToMidi(freq: number): number {
  return 69 + 12 * Math.log2(freq / 440)
}

/** Convert MIDI note number to frequency (Hz) */
export function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12)
}

/** Convert frequency to nearest MIDI note + cents offset */
export function freqToNoteAndCents(freq: number): {
  midi: number
  cents: number
} {
  const exactMidi = freqToMidi(freq)
  const midi = Math.round(exactMidi)
  const cents = Math.round((exactMidi - midi) * 100)
  return { midi, cents }
}

/** Convert MIDI note number to note name (e.g., 60 -> "C4") */
export function midiToNoteName(midi: number): string {
  const octave = Math.floor(midi / 12) - 1
  const noteIndex = midi % 12
  return `${NOTE_NAMES[noteIndex]}${octave}`
}

/** Linear interpolation */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

/** Calculate median of a number array */
export function median(values: number[]): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2
}
