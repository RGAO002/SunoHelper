/** Extract a segment of an AudioBuffer as a new Float32Array */
export function extractSegment(
  channelData: Float32Array,
  startSample: number,
  endSample: number,
): Float32Array {
  return channelData.slice(startSample, endSample)
}

/** Apply Hann window to a buffer (in-place) */
export function applyHannWindow(buffer: Float32Array): void {
  const N = buffer.length
  for (let i = 0; i < N; i++) {
    const multiplier = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (N - 1)))
    buffer[i] *= multiplier
  }
}

/** Calculate RMS amplitude of a buffer */
export function calculateRMS(buffer: Float32Array): number {
  let sum = 0
  for (let i = 0; i < buffer.length; i++) {
    sum += buffer[i] * buffer[i]
  }
  return Math.sqrt(sum / buffer.length)
}

/** Normalize a Float32Array to 0..1 range */
export function normalizeEnvelope(values: number[]): number[] {
  const max = Math.max(...values, 0.001) // avoid divide by zero
  return values.map((v) => v / max)
}
