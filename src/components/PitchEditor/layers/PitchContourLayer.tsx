import { useEffect, useRef } from 'react'
import type { Viewport } from '@/types/editor'
import type { NoteSegment } from '@/types/pitch'
import { applyCanvasScale } from '../hooks/useCanvasScale'
import { drawPitchContour } from '../renderers/drawPitchContour'

interface PitchContourLayerProps {
  width: number
  height: number
  dpr: number
  viewport: Viewport
  notes: NoteSegment[]
}

export function PitchContourLayer({
  width,
  height,
  dpr,
  viewport,
  notes,
}: PitchContourLayerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = applyCanvasScale(canvas, width, height, dpr)
    ctx.clearRect(0, 0, width, height)

    for (const note of notes) {
      drawPitchContour(ctx, note, viewport, width, height)
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
