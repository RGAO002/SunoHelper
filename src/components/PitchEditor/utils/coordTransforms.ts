import type { Viewport } from '@/types/editor'

/** Time (seconds) -> X pixel position */
export function timeToX(
  time: number,
  viewport: Viewport,
  canvasWidth?: number,
): number {
  const pps = canvasWidth
    ? canvasWidth / (viewport.endTime - viewport.startTime)
    : viewport.pixelsPerSecond
  return (time - viewport.startTime) * pps
}

/** X pixel -> time (seconds) */
export function xToTime(
  x: number,
  viewport: Viewport,
  canvasWidth?: number,
): number {
  const pps = canvasWidth
    ? canvasWidth / (viewport.endTime - viewport.startTime)
    : viewport.pixelsPerSecond
  return x / pps + viewport.startTime
}

/**
 * MIDI note -> Y pixel position
 * Y=0 is top of canvas. Higher MIDI notes = lower Y (higher on screen).
 */
export function midiToY(
  midiNote: number,
  viewport: Viewport,
  canvasHeight: number,
): number {
  const range = viewport.topMidi - viewport.bottomMidi
  const normalized = (midiNote - viewport.bottomMidi) / range
  return canvasHeight * (1 - normalized)
}

/** Y pixel -> MIDI note */
export function yToMidi(
  y: number,
  viewport: Viewport,
  canvasHeight: number,
): number {
  const normalized = 1 - y / canvasHeight
  return viewport.bottomMidi + normalized * (viewport.topMidi - viewport.bottomMidi)
}
