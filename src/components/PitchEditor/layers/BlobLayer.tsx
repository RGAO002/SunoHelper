import { useEffect, useRef } from 'react'
import type { Viewport } from '@/types/editor'
import type { NoteSegment } from '@/types/pitch'
import { applyCanvasScale } from '../hooks/useCanvasScale'
import { drawBlob } from '../renderers/drawBlob'

interface BlobLayerProps {
  width: number
  height: number
  dpr: number
  viewport: Viewport
  notes: NoteSegment[]
  selectedNoteIds: Set<string>
}

export function BlobLayer({
  width,
  height,
  dpr,
  viewport,
  notes,
  selectedNoteIds,
}: BlobLayerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = applyCanvasScale(canvas, width, height, dpr)
    ctx.clearRect(0, 0, width, height)

    // Draw all note blobs
    for (const note of notes) {
      drawBlob(ctx, note, viewport, width, height, {
        isSelected: selectedNoteIds.has(note.id),
        isDragging: false,
      })
    }
  }, [width, height, dpr, viewport, notes, selectedNoteIds])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ width, height }}
    />
  )
}
