import type { NoteSegment } from '@/types/pitch'
import type { Viewport } from '@/types/editor'
import { timeToX, midiToY } from '../utils/coordTransforms'
import { midiToNoteName } from '@/utils/noteHelpers'

interface DrawBlobOptions {
  isSelected: boolean
  isDragging: boolean
  dragMidiOffset?: number
}

/**
 * Draw a single Melodyne-style waveform blob.
 * The blob shape is determined by the amplitude envelope -
 * louder parts are thicker, quieter parts are thinner.
 */
export function drawBlob(
  ctx: CanvasRenderingContext2D,
  note: NoteSegment,
  viewport: Viewport,
  canvasWidth: number,
  canvasHeight: number,
  options: DrawBlobOptions = { isSelected: false, isDragging: false },
): void {
  const { isSelected, isDragging, dragMidiOffset = 0 } = options

  const x1 = timeToX(note.startTime, viewport, canvasWidth)
  const x2 = timeToX(note.endTime, viewport, canvasWidth)
  const noteWidth = x2 - x1
  if (noteWidth < 1) return // Too small to render

  // Determine the Y center based on corrected pitch (or dragged pitch)
  const displayMidi = isDragging
    ? note.correctedMidiNote + dragMidiOffset
    : note.correctedMidiNote
  const centerY = midiToY(displayMidi, viewport, canvasHeight)

  // Max thickness is ~40% of one semitone height
  const semitoneHeight =
    canvasHeight / (viewport.topMidi - viewport.bottomMidi)
  const maxThickness = semitoneHeight * 0.4

  const envelope = note.amplitudeEnvelope
  if (envelope.length < 2) return

  const step = noteWidth / (envelope.length - 1)

  // Build the blob path from amplitude envelope
  ctx.beginPath()

  // Top edge (left to right)
  for (let i = 0; i < envelope.length; i++) {
    const x = x1 + i * step
    const thickness = envelope[i] * maxThickness
    const y = centerY - thickness
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }

  // Bottom edge (right to left, creating closed shape)
  for (let i = envelope.length - 1; i >= 0; i--) {
    const x = x1 + i * step
    const thickness = envelope[i] * maxThickness
    const y = centerY + thickness
    ctx.lineTo(x, y)
  }

  ctx.closePath()

  // Fill color based on state
  const alpha = isDragging ? 0.5 : isSelected ? 0.95 : 0.8
  ctx.fillStyle = `rgba(230, 126, 34, ${alpha})` // blob orange
  ctx.fill()

  // Border
  ctx.strokeStyle = isSelected ? '#f59e0b' : '#c0392b'
  ctx.lineWidth = isSelected ? 2 : 1
  ctx.stroke()

  // Note name label inside blob
  if (noteWidth > 25 && semitoneHeight > 8) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
    ctx.font = `${Math.min(11, semitoneHeight * 0.5)}px monospace`
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'
    ctx.fillText(midiToNoteName(displayMidi), x1 + 3, centerY)
  }
}
