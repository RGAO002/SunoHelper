import type { NoteSegment } from '@/types/pitch'
import type { Viewport } from '@/types/editor'
import { timeToX, midiToY } from '../utils/coordTransforms'

/**
 * Draw the pitch contour line through a note blob.
 * This shows the actual pitch variation within the note (vibrato, scoops, etc.)
 */
export function drawPitchContour(
  ctx: CanvasRenderingContext2D,
  note: NoteSegment,
  viewport: Viewport,
  canvasWidth: number,
  canvasHeight: number,
): void {
  const contour = note.pitchContour
  if (contour.length < 2) return

  ctx.beginPath()
  ctx.strokeStyle = 'rgba(239, 68, 68, 0.7)' // contour red
  ctx.lineWidth = 1.5
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'

  for (let i = 0; i < contour.length; i++) {
    const x = timeToX(note.startTime + contour[i].timeOffset, viewport, canvasWidth)
    // The contour cents are relative to correctedMidiNote
    const exactMidi =
      note.correctedMidiNote + contour[i].cents / 100
    const y = midiToY(exactMidi, viewport, canvasHeight)

    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }

  ctx.stroke()
}
