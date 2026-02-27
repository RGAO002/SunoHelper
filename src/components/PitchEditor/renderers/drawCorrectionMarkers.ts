import type { NoteSegment } from '@/types/pitch'
import type { Viewport } from '@/types/editor'
import { timeToX, midiToY } from '../utils/coordTransforms'

/**
 * Draw correction markers showing original → corrected pitch.
 * - A dashed line at the original detected pitch
 * - A solid green line at the corrected pitch
 * - A vertical arrow connecting them
 */
export function drawCorrectionMarkers(
  ctx: CanvasRenderingContext2D,
  note: NoteSegment,
  viewport: Viewport,
  canvasWidth: number,
  canvasHeight: number,
): void {
  const x1 = timeToX(note.startTime, viewport, canvasWidth)
  const x2 = timeToX(note.endTime, viewport, canvasWidth)
  const noteWidth = x2 - x1
  if (noteWidth < 2) return

  const originalY = midiToY(
    note.detectedMidiNote + note.detectedCents / 100,
    viewport,
    canvasHeight,
  )
  const correctedY = midiToY(
    note.correctedMidiNote + note.correctedCents / 100,
    viewport,
    canvasHeight,
  )

  // Original pitch line (dashed, dimmed)
  ctx.beginPath()
  ctx.strokeStyle = 'rgba(156, 163, 175, 0.4)' // gray
  ctx.lineWidth = 1
  ctx.setLineDash([3, 3])
  ctx.moveTo(x1, originalY)
  ctx.lineTo(x2, originalY)
  ctx.stroke()
  ctx.setLineDash([])

  // Corrected pitch line (solid green)
  ctx.beginPath()
  ctx.strokeStyle = 'rgba(74, 222, 128, 0.7)' // corrected green
  ctx.lineWidth = 2
  ctx.moveTo(x1, correctedY)
  ctx.lineTo(x2, correctedY)
  ctx.stroke()

  // Correction arrow (vertical)
  if (Math.abs(correctedY - originalY) > 3) {
    const midX = (x1 + x2) / 2
    ctx.beginPath()
    ctx.strokeStyle = 'rgba(74, 222, 128, 0.5)'
    ctx.lineWidth = 1.5
    ctx.setLineDash([2, 2])
    ctx.moveTo(midX, originalY)
    ctx.lineTo(midX, correctedY)
    ctx.stroke()
    ctx.setLineDash([])

    // Small arrow head
    const dir = correctedY > originalY ? 1 : -1
    ctx.beginPath()
    ctx.fillStyle = 'rgba(74, 222, 128, 0.5)'
    ctx.moveTo(midX - 4, correctedY - dir * 6)
    ctx.lineTo(midX, correctedY)
    ctx.lineTo(midX + 4, correctedY - dir * 6)
    ctx.fill()
  }

  // Cents offset label
  const totalCentsShift =
    (note.correctedMidiNote - note.detectedMidiNote) * 100 +
    (note.correctedCents - note.detectedCents)
  if (Math.abs(totalCentsShift) >= 5 && noteWidth > 40) {
    const sign = totalCentsShift > 0 ? '+' : ''
    const label = `${sign}${Math.round(totalCentsShift)}c`
    ctx.fillStyle = 'rgba(74, 222, 128, 0.8)'
    ctx.font = '9px monospace'
    ctx.textAlign = 'right'
    ctx.textBaseline = 'bottom'
    ctx.fillText(label, x2 - 2, Math.min(originalY, correctedY) - 3)
  }
}
