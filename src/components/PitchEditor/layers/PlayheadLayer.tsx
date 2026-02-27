import { useEffect, useRef } from 'react'
import type { Viewport } from '@/types/editor'
import { applyCanvasScale } from '../hooks/useCanvasScale'
import { timeToX } from '../utils/coordTransforms'

interface PlayheadLayerProps {
  width: number
  height: number
  dpr: number
  viewport: Viewport
  currentTime: number
  isPlaying: boolean
}

/**
 * Layer 5: Playhead — vertical line indicating current playback position.
 * Redraws every frame via rAF when playing (lightweight: just one line).
 */
export function PlayheadLayer({
  width,
  height,
  dpr,
  viewport,
  currentTime,
  isPlaying,
}: PlayheadLayerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = applyCanvasScale(canvas, width, height, dpr)
    ctx.clearRect(0, 0, width, height)

    // Only draw if time is within visible range
    if (currentTime < viewport.startTime || currentTime > viewport.endTime) return

    const x = timeToX(currentTime, viewport, width)

    // Playhead line
    ctx.beginPath()
    ctx.strokeStyle = isPlaying ? '#f59e0b' : '#6b7280' // amber when playing, gray when paused
    ctx.lineWidth = 1.5
    ctx.moveTo(x, 0)
    ctx.lineTo(x, height)
    ctx.stroke()

    // Top triangle indicator
    ctx.beginPath()
    ctx.fillStyle = isPlaying ? '#f59e0b' : '#6b7280'
    ctx.moveTo(x - 5, 0)
    ctx.lineTo(x + 5, 0)
    ctx.lineTo(x, 8)
    ctx.closePath()
    ctx.fill()
  }, [width, height, dpr, viewport, currentTime, isPlaying])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ width, height }}
    />
  )
}
