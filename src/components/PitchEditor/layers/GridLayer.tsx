import { useEffect, useRef } from 'react'
import type { Viewport } from '@/types/editor'
import { applyCanvasScale } from '../hooks/useCanvasScale'
import { drawGrid } from '../renderers/drawGrid'

interface GridLayerProps {
  width: number
  height: number
  dpr: number
  viewport: Viewport
}

export function GridLayer({ width, height, dpr, viewport }: GridLayerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = applyCanvasScale(canvas, width, height, dpr)
    drawGrid(ctx, viewport, width, height)
  }, [width, height, dpr, viewport])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0"
      style={{ width, height }}
    />
  )
}
