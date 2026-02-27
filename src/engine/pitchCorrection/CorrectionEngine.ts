import type { NoteSegment } from '@/types/pitch'
import { shiftSegment } from './SegmentShifter'

const CROSSFADE_SAMPLES = 64

/**
 * CorrectionEngine — orchestrates per-segment pitch correction.
 *
 * Takes the original AudioBuffer and the list of NoteSegments with their
 * correction offsets, pitch-shifts each segment that needs correction,
 * and assembles them back into a new AudioBuffer with crossfades.
 *
 * Non-destructive: the original buffer is never modified.
 */
export class CorrectionEngine {
  private cache = new Map<string, Float32Array>()

  /**
   * Apply corrections and produce a new corrected AudioBuffer.
   * Caches shifted segments by noteId + shiftAmount to avoid re-processing.
   */
  async correct(
    originalBuffer: AudioBuffer,
    notes: NoteSegment[],
    onProgress?: (progress: number) => void,
  ): Promise<AudioBuffer> {
    const sampleRate = originalBuffer.sampleRate
    const channelData = originalBuffer.getChannelData(0)
    const outputData = new Float32Array(channelData) // Start with original

    let processed = 0
    const totalNotes = notes.length

    for (const note of notes) {
      const semitoneShift =
        note.correctedMidiNote -
        note.detectedMidiNote +
        (note.correctedCents - note.detectedCents) / 100

      if (Math.abs(semitoneShift) >= 0.01) {
        console.log(`[CorrectionEngine] Shifting note ${note.id}: ${semitoneShift.toFixed(2)} semitones (${note.detectedMidiNote}→${note.correctedMidiNote})`)
        // Build cache key
        const cacheKey = `${note.id}:${semitoneShift.toFixed(2)}`
        let shiftedData = this.cache.get(cacheKey)

        if (!shiftedData) {
          try {
            shiftedData = await shiftSegment(
              channelData,
              sampleRate,
              note.startSample,
              note.endSample,
              semitoneShift,
            )
            this.cache.set(cacheKey, shiftedData)
            console.log(`[CorrectionEngine] Shifted segment: ${shiftedData.length} samples`)
          } catch (err) {
            console.error(`[CorrectionEngine] Failed to shift note ${note.id}:`, err)
            processed++
            continue
          }
        }

        // Splice the shifted segment into the output with crossfade
        this.spliceWithCrossfade(
          outputData,
          shiftedData,
          note.startSample,
          note.endSample,
        )
      }

      processed++
      onProgress?.(processed / totalNotes)
    }

    // Create a new AudioBuffer with the corrected data
    const offlineCtx = new OfflineAudioContext(1, outputData.length, sampleRate)
    const correctedBuffer = offlineCtx.createBuffer(
      1,
      outputData.length,
      sampleRate,
    )
    correctedBuffer.getChannelData(0).set(outputData)

    return correctedBuffer
  }

  /**
   * Splice shifted audio data into the output with crossfade at boundaries
   * to avoid clicks and pops.
   */
  private spliceWithCrossfade(
    output: Float32Array,
    shifted: Float32Array,
    startSample: number,
    endSample: number,
  ): void {
    const segmentLength = endSample - startSample
    const fadeLength = Math.min(CROSSFADE_SAMPLES, Math.floor(segmentLength / 4))

    for (let i = 0; i < segmentLength && i < shifted.length; i++) {
      const outIdx = startSample + i

      // Crossfade at start
      if (i < fadeLength) {
        const t = i / fadeLength
        output[outIdx] = output[outIdx] * (1 - t) + shifted[i] * t
      }
      // Crossfade at end
      else if (i >= segmentLength - fadeLength) {
        const t = (segmentLength - i) / fadeLength
        output[outIdx] = output[outIdx] * (1 - t) + shifted[i] * t
      }
      // Full replacement in the middle
      else {
        output[outIdx] = shifted[i]
      }
    }
  }

  /** Clear the cache (e.g., when loading new audio) */
  clearCache(): void {
    this.cache.clear()
  }
}
