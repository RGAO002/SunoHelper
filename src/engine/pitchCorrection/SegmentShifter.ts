/**
 * SegmentShifter — uses SoundTouchJS to pitch-shift individual audio segments.
 *
 * For each NoteSegment that has been corrected, it:
 * 1. Extracts the audio range PLUS surrounding context from the original buffer
 * 2. Applies pitch shifting using SoundTouch's TDOAI algorithm
 * 3. Trims the output to only the segment portion and returns it
 *
 * SoundTouchJS uses Time-Domain Overlap-Add with Interpolation,
 * which is better for monophonic vocals than Phase Vocoder.
 *
 * IMPORTANT: SoundTouch's TDOA algorithm has significant internal buffering.
 * Without context padding, short segments (< 500ms) produce truncated or
 * even ZERO output. We solve this by:
 * - Feeding real audio context before/after the segment (avoids edge artifacts)
 * - Adding silence flush padding at the end (forces SoundTouch to drain its buffers)
 * - Extracting only the segment portion from the extended output
 */

import { SoundTouch, SimpleFilter } from 'soundtouchjs'

export interface ShiftedSegment {
  noteId: string
  startSample: number
  endSample: number
  shiftedData: Float32Array
}

/**
 * Amount of audio context (in samples) to include before and after
 * the target segment. This gives SoundTouch enough data to:
 * - Warm up its internal buffers (pre-context)
 * - Avoid boundary fade-out artifacts (post-context)
 * 8192 samples ≈ 186ms at 44.1kHz — well above SoundTouch's sequence window (~82ms)
 */
const CONTEXT_SAMPLES = 8192

/**
 * Extra silence appended after all real audio to ensure SoundTouch
 * fully flushes its internal buffers into the output.
 */
const FLUSH_PADDING = 8192

/**
 * Shift the pitch of a single audio segment by a given number of semitones.
 *
 * @param channelData - The full original audio channel
 * @param _sampleRate - Sample rate (unused currently but kept for API)
 * @param startSample - Start of the segment in channelData
 * @param endSample - End of the segment in channelData
 * @param semitoneShift - Number of semitones to shift (positive = up)
 */
export async function shiftSegment(
  channelData: Float32Array,
  _sampleRate: number,
  startSample: number,
  endSample: number,
  semitoneShift: number,
): Promise<Float32Array> {
  // If no shift needed, return original segment
  if (Math.abs(semitoneShift) < 0.01) {
    return channelData.slice(startSample, endSample)
  }

  const segmentLength = endSample - startSample

  // === Build extended input with context ===
  // [pre-context from original] [segment] [post-context from original] [silence flush]
  const preStart = Math.max(0, startSample - CONTEXT_SAMPLES)
  const postEnd = Math.min(channelData.length, endSample + CONTEXT_SAMPLES)
  const preContextLen = startSample - preStart
  const postContextLen = postEnd - endSample

  const extendedLen = preContextLen + segmentLength + postContextLen + FLUSH_PADDING
  const extendedData = new Float32Array(extendedLen)

  // Copy real audio: pre-context + segment + post-context
  const realLen = preContextLen + segmentLength + postContextLen
  extendedData.set(channelData.subarray(preStart, postEnd), 0)
  // Remaining FLUSH_PADDING samples stay as zeros (silence)

  // === Configure SoundTouch ===
  const soundTouch = new SoundTouch()
  soundTouch.pitchSemitones = semitoneShift
  soundTouch.rate = 1.0
  soundTouch.tempo = 1.0

  // Source feeds the extended data (with silence flush at the end)
  const totalFeedLength = extendedLen
  const source = {
    extract(target: Float32Array, numFrames: number, position: number): number {
      const pos = position ?? 0
      const framesAvailable = Math.min(numFrames, totalFeedLength - pos)
      if (framesAvailable <= 0) return 0
      for (let i = 0; i < framesAvailable; i++) {
        const sample = extendedData[pos + i]
        // Interleaved stereo (SoundTouch expects L,R,L,R...)
        target[i * 2] = sample
        target[i * 2 + 1] = sample
      }
      return framesAvailable
    },
  }

  const filter = new SimpleFilter(source, soundTouch)

  // === Extract processed audio ===
  const outputBuffer = new Float32Array(totalFeedLength + 8192)
  let outputLength = 0
  const chunkSize = 4096

  let extractedFrames: number
  let iterations = 0
  const maxIterations = Math.ceil(totalFeedLength / chunkSize) + 20

  do {
    const tempBuffer = new Float32Array(chunkSize * 2) // stereo interleaved
    extractedFrames = filter.extract(tempBuffer, chunkSize)
    if (extractedFrames > 0) {
      for (let i = 0; i < extractedFrames; i++) {
        if (outputLength + i < outputBuffer.length) {
          // Take left channel only (mono)
          outputBuffer[outputLength + i] = tempBuffer[i * 2]
        }
      }
      outputLength += extractedFrames
    }
    iterations++
  } while (extractedFrames > 0 && iterations < maxIterations)

  // === Extract the segment portion from the output ===
  // The output aligns with the extended input, so our segment starts
  // at preContextLen and has length segmentLength.
  const result = new Float32Array(segmentLength)
  const outputSegStart = preContextLen
  const outputSegEnd = Math.min(outputSegStart + segmentLength, outputLength)

  if (outputSegEnd > outputSegStart) {
    const availableLen = outputSegEnd - outputSegStart
    for (let i = 0; i < availableLen; i++) {
      result[i] = outputBuffer[outputSegStart + i]
    }
    // If SoundTouch didn't produce enough output for the full segment,
    // blend with original audio for the missing tail (avoids silence)
    if (availableLen < segmentLength) {
      const originalSegment = channelData.subarray(startSample, endSample)
      const fadeLen = Math.min(256, availableLen)
      // Crossfade from shifted to original at the boundary
      for (let i = 0; i < fadeLen; i++) {
        const t = i / fadeLen
        const idx = availableLen - fadeLen + i
        result[idx] = result[idx] * (1 - t) + originalSegment[idx] * t
      }
      // Fill rest with original audio
      for (let i = availableLen; i < segmentLength; i++) {
        result[i] = originalSegment[i]
      }
    }
  } else {
    // Fallback: SoundTouch produced no usable output — return original
    result.set(channelData.subarray(startSample, endSample))
  }

  return result
}
