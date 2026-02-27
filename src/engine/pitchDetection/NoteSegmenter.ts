import { nanoid } from 'nanoid'
import type { PitchFrame, NoteSegment, PitchContourPoint } from '@/types/pitch'
import { freqToMidi, freqToNoteAndCents, median } from '@/utils/noteHelpers'
import { normalizeEnvelope } from '@/utils/audioBufferUtils'
import { ANALYSIS_CONFIG } from '@/constants/music'

export class NoteSegmenter {
  private readonly minNoteDuration: number
  private readonly pitchJumpThreshold: number
  private readonly silenceRmsThreshold = 0.005
  /**
   * Max consecutive unpitched frames to tolerate within a note.
   * Small gaps (1-3 frames) can occur from pitch detection variance
   * without indicating an actual note boundary.
   */
  private readonly maxGapFrames = 3

  constructor(config = ANALYSIS_CONFIG) {
    this.minNoteDuration = config.minNoteDuration
    this.pitchJumpThreshold = config.pitchJumpThreshold
  }

  segment(frames: PitchFrame[], sampleRate: number): NoteSegment[] {
    const notes: NoteSegment[] = []
    let currentFrames: PitchFrame[] = []
    let gapCount = 0

    for (let i = 0; i < frames.length; i++) {
      const frame = frames[i]
      const isPitched =
        frame.frequencyHz > 0 &&
        frame.rmsAmplitude > this.silenceRmsThreshold

      if (!isPitched) {
        if (currentFrames.length > 0) {
          gapCount++
          // Tolerate small gaps — the pitched frames may resume shortly
          if (gapCount > this.maxGapFrames) {
            this.finalizeNote(currentFrames, sampleRate, notes)
            currentFrames = []
            gapCount = 0
          }
        }
        continue
      }

      // We have a pitched frame — reset gap counter
      gapCount = 0

      if (currentFrames.length === 0) {
        // Start a new note
        currentFrames.push(frame)
      } else {
        // Find the last pitched frame in currentFrames for comparison
        const lastPitched = this.lastPitchedFrame(currentFrames)
        if (!lastPitched) {
          currentFrames.push(frame)
          continue
        }

        const prevMidi = freqToMidi(lastPitched.frequencyHz)
        const currMidi = freqToMidi(frame.frequencyHz)
        const pitchDelta = Math.abs(currMidi - prevMidi)

        // Check for onset (sudden energy increase)
        const prevRms = frames[i - 1]?.rmsAmplitude ?? 0
        const energyRatio = prevRms > 0.001 ? frame.rmsAmplitude / prevRms : 0
        const isOnset = energyRatio > 2.5

        if (pitchDelta > this.pitchJumpThreshold || isOnset) {
          // New note boundary
          this.finalizeNote(currentFrames, sampleRate, notes)
          currentFrames = [frame]
        } else {
          currentFrames.push(frame)
        }
      }
    }

    // Finalize any remaining note
    if (currentFrames.length > 0) {
      this.finalizeNote(currentFrames, sampleRate, notes)
    }

    // Filter out notes that are too short
    return notes.filter(
      (n) => n.endTime - n.startTime >= this.minNoteDuration,
    )
  }

  /** Find the last frame in the array that has a valid pitch */
  private lastPitchedFrame(frames: PitchFrame[]): PitchFrame | null {
    for (let i = frames.length - 1; i >= 0; i--) {
      if (frames[i].frequencyHz > 0) return frames[i]
    }
    return null
  }

  private finalizeNote(
    pitchFrames: PitchFrame[],
    sampleRate: number,
    notes: NoteSegment[],
  ): void {
    const frequencies = pitchFrames
      .map((f) => f.frequencyHz)
      .filter((f) => f > 0)
    if (frequencies.length === 0) return

    const medianFreq = median(frequencies)
    const { midi, cents } = freqToNoteAndCents(medianFreq)

    const startTime = pitchFrames[0].timeSeconds
    const endTime = pitchFrames[pitchFrames.length - 1].timeSeconds

    // Build pitch contour (high-res pitch curve within this note)
    const pitchContour: PitchContourPoint[] = pitchFrames
      .filter((f) => f.frequencyHz > 0)
      .map((f) => ({
        timeOffset: f.timeSeconds - startTime,
        frequencyHz: f.frequencyHz,
        cents: Math.round((freqToMidi(f.frequencyHz) - midi) * 100),
      }))

    // Build amplitude envelope for blob shape
    const rawEnvelope = pitchFrames.map((f) => f.rmsAmplitude)
    const amplitudeEnvelope = normalizeEnvelope(rawEnvelope)

    const note: NoteSegment = {
      id: nanoid(8),
      startTime,
      endTime,
      startSample: Math.floor(startTime * sampleRate),
      endSample: Math.floor(endTime * sampleRate),
      detectedPitchHz: medianFreq,
      detectedMidiNote: midi,
      detectedCents: cents,
      correctedMidiNote: midi, // Initially same as detected
      correctedCents: cents,
      pitchContour,
      amplitudeEnvelope,
      isSelected: false,
    }

    notes.push(note)
  }
}
