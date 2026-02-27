import { useEffect, useRef } from 'react'
import type { Viewport } from '@/types/editor'
import type { NoteSegment } from '@/types/pitch'
import { applyCanvasScale } from '../hooks/useCanvasScale'
import { drawCorrectionMarkers } from '../renderers/drawCorrectionMarkers'

interface CorrectionOverlayProps {
  width: number
  height: number
  dpr: number
  viewport: Viewport
  notes: NoteSegment[]
}

export function CorrectionOverlay({
  width,
  height,
  dpr,
  viewport,
  notes,
}: CorrectionOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = applyCanvasScale(canvas, width, height, dpr)
    ctx.clearRect(0, 0, width, height)

    // Only draw markers for notes that have been corrected
    for (const note of notes) {
      const hasCorrected =
        note.correctedMidiNote !== note.detectedMidiNote ||
        note.correctedCents !== note.detectedCents
      if (hasCorrected) {
        drawCorrectionMarkers(ctx, note, viewport, width, height)
      }
    }
  }, [width, height, dpr, viewport, notes])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ width, height }}
    />
  )
}
