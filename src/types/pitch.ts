/** A single frame of pitch analysis from the pitchy detector */
export interface PitchFrame {
  timeSeconds: number
  frequencyHz: number // 0 if unpitched
  clarity: number // 0..1
  rmsAmplitude: number
}

/** A point on the continuous pitch contour within a note */
export interface PitchContourPoint {
  timeOffset: number // Seconds relative to note start
  frequencyHz: number
  cents: number // Cents from the note's correctedMidiNote
}

/** A detected note: a contiguous region of stable pitch */
export interface NoteSegment {
  id: string
  startTime: number
  endTime: number
  startSample: number
  endSample: number
  detectedPitchHz: number
  detectedMidiNote: number
  detectedCents: number // -50..+50
  correctedMidiNote: number
  correctedCents: number
  pitchContour: PitchContourPoint[]
  amplitudeEnvelope: number[] // RMS values for blob shape
  isSelected: boolean
}
