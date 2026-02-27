import type { NoteSegment } from '@/types/pitch'
import type { CorrectionParams } from '@/types/correction'
import { lerp } from '@/utils/noteHelpers'

export class PitchQuantizer {
  quantize(
    notes: NoteSegment[],
    params: CorrectionParams,
  ): NoteSegment[] {
    const { autoCorrectStrength, targetScale } = params
    const strength = autoCorrectStrength / 100 // 0..1

    if (strength === 0) {
      // No correction - keep detected values as corrected
      return notes.map((note) => ({
        ...note,
        correctedMidiNote: note.detectedMidiNote,
        correctedCents: note.detectedCents,
      }))
    }

    return notes.map((note) => {
      const nearestScaleMidi = this.findNearestScaleDegree(
        note.detectedMidiNote,
        note.detectedCents,
        targetScale.root,
        targetScale.intervals,
      )

      // Progressive: bigger deviations get corrected more aggressively
      const exactDetected =
        note.detectedMidiNote + note.detectedCents / 100
      const deviationSemitones = Math.abs(exactDetected - nearestScaleMidi)
      const effectiveStrength = Math.min(
        1,
        strength * (1 + deviationSemitones * 0.5),
      )

      const correctedExact = lerp(
        exactDetected,
        nearestScaleMidi,
        effectiveStrength,
      )

      return {
        ...note,
        correctedMidiNote: Math.round(correctedExact),
        correctedCents: Math.round(
          (correctedExact - Math.round(correctedExact)) * 100,
        ),
      }
    })
  }

  private findNearestScaleDegree(
    midi: number,
    cents: number,
    root: number,
    intervals: number[],
  ): number {
    const exactMidi = midi + cents / 100
    let bestDistance = Infinity
    let bestMidi = midi

    // Search within +/- 7 semitones
    for (let offset = -7; offset <= 7; offset++) {
      const candidate = Math.round(exactMidi) + offset
      const pitchClass = ((candidate % 12) - root + 12) % 12
      if (intervals.includes(pitchClass)) {
        const distance = Math.abs(exactMidi - candidate)
        if (distance < bestDistance) {
          bestDistance = distance
          bestMidi = candidate
        }
      }
    }

    return bestMidi
  }
}
