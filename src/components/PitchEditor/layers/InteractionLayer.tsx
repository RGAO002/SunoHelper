import { useCallback, useEffect, useRef, useState } from 'react'
import type { Viewport, DragState } from '@/types/editor'
import type { NoteSegment } from '@/types/pitch'
import { useStore } from '@/store'
import { applyCanvasScale } from '../hooks/useCanvasScale'
import { useHitTest } from '../hooks/useHitTest'
import { useDragInteraction } from '../hooks/useDragInteraction'
import { midiToY, timeToX, xToTime } from '../utils/coordTransforms'
import { midiToNoteName } from '@/utils/noteHelpers'

interface InteractionLayerProps {
  width: number
  height: number
  dpr: number
  viewport: Viewport
  notes: NoteSegment[]
}

export function InteractionLayer({
  width,
  height,
  dpr,
  viewport,
  notes,
}: InteractionLayerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const seekTo = useStore((s) => s.seekTo)
  const duration = useStore((s) => s.duration)

  const hitTest = useHitTest(notes, viewport, width, height)
  const {
    dragState,
    dragMidiOffset,
    cursor,
    handlers,
  } = useDragInteraction(hitTest, viewport, width, height)

  // --- Playhead seek: click/drag on empty space ---
  const [isSeeking, setIsSeeking] = useState(false)

  const seekFromEvent = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const rect = e.currentTarget.getBoundingClientRect()
      const mouseX = e.clientX - rect.left
      const time = Math.max(0, Math.min(duration, xToTime(mouseX, viewport, width)))
      seekTo(time)
    },
    [seekTo, viewport, width, duration],
  )

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const rect = e.currentTarget.getBoundingClientRect()
      const mouseX = e.clientX - rect.left
      const mouseY = e.clientY - rect.top
      const hit = hitTest(mouseX, mouseY)

      if (hit) {
        // Hit a note blob → delegate to note drag handler
        handlers.onMouseDown(e)
      } else {
        // Empty space → start playhead seek/drag
        setIsSeeking(true)
        seekFromEvent(e)
      }
    },
    [hitTest, handlers, seekFromEvent],
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (isSeeking) {
        // Dragging the playhead
        seekFromEvent(e)
      } else {
        handlers.onMouseMove(e)
      }
    },
    [isSeeking, seekFromEvent, handlers],
  )

  const handleMouseUp = useCallback(
    () => {
      if (isSeeking) {
        setIsSeeking(false)
      } else {
        handlers.onMouseUp()
      }
    },
    [isSeeking, handlers],
  )

  const handleMouseLeave = useCallback(() => {
    if (isSeeking) {
      setIsSeeking(false)
    } else {
      handlers.onMouseLeave()
    }
  }, [isSeeking, handlers])

  const effectiveCursor = isSeeking ? 'col-resize' : cursor

  // Draw interaction feedback
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = applyCanvasScale(canvas, width, height, dpr)
    ctx.clearRect(0, 0, width, height)

    // Draw hover highlight
    if (dragState.status === 'hovering' && dragState.targetNoteId) {
      const note = notes.find((n) => n.id === dragState.targetNoteId)
      if (note) {
        drawHoverHighlight(ctx, note, viewport, width, height)
      }
    }

    // Draw drag ghost + snap line
    if (dragState.status === 'dragging' && dragState.targetNoteId) {
      const note = notes.find((n) => n.id === dragState.targetNoteId)
      if (note) {
        drawDragGhost(ctx, note, dragState, viewport, width, height)
        drawSnapLine(ctx, dragState, viewport, width, height)
      }
    }
  }, [width, height, dpr, viewport, notes, dragState, dragMidiOffset])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0"
      style={{ width, height, cursor: effectiveCursor }}
      tabIndex={0}
      onMouseMove={handleMouseMove}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onKeyDown={handlers.onKeyDown}
    />
  )
}

/** Draw a subtle glow around the hovered blob */
function drawHoverHighlight(
  ctx: CanvasRenderingContext2D,
  note: NoteSegment,
  viewport: Viewport,
  canvasWidth: number,
  canvasHeight: number,
) {
  const x1 = timeToX(note.startTime, viewport, canvasWidth)
  const x2 = timeToX(note.endTime, viewport, canvasWidth)
  const centerY = midiToY(note.correctedMidiNote, viewport, canvasHeight)
  const semitoneHeight = canvasHeight / (viewport.topMidi - viewport.bottomMidi)
  const halfH = semitoneHeight * 0.45

  ctx.strokeStyle = 'rgba(245, 158, 11, 0.6)' // amber glow
  ctx.lineWidth = 2
  ctx.setLineDash([])

  // Rounded rect around blob
  const padding = 3
  roundRect(
    ctx,
    x1 - padding,
    centerY - halfH - padding,
    x2 - x1 + padding * 2,
    halfH * 2 + padding * 2,
    6,
  )
  ctx.stroke()
}

/** Draw a ghost outline at the drag position */
function drawDragGhost(
  ctx: CanvasRenderingContext2D,
  note: NoteSegment,
  drag: DragState,
  viewport: Viewport,
  canvasWidth: number,
  canvasHeight: number,
) {
  const x1 = timeToX(note.startTime, viewport, canvasWidth)
  const x2 = timeToX(note.endTime, viewport, canvasWidth)
  const targetY = midiToY(drag.currentMidiNote, viewport, canvasHeight)
  const semitoneHeight = canvasHeight / (viewport.topMidi - viewport.bottomMidi)
  const halfH = semitoneHeight * 0.4

  // Ghost rectangle at target position
  ctx.fillStyle = 'rgba(230, 126, 34, 0.25)'
  ctx.strokeStyle = 'rgba(230, 126, 34, 0.8)'
  ctx.lineWidth = 2
  ctx.setLineDash([4, 4])

  roundRect(ctx, x1, targetY - halfH, x2 - x1, halfH * 2, 4)
  ctx.fill()
  ctx.stroke()
  ctx.setLineDash([])

  // Arrow from original to target position
  const originalY = midiToY(note.correctedMidiNote, viewport, canvasHeight)
  if (Math.abs(targetY - originalY) > 2) {
    const midX = (x1 + x2) / 2
    ctx.beginPath()
    ctx.strokeStyle = 'rgba(74, 222, 128, 0.7)' // green arrow
    ctx.lineWidth = 2
    ctx.setLineDash([])
    ctx.moveTo(midX, originalY)
    ctx.lineTo(midX, targetY)
    ctx.stroke()

    // Arrow head
    const arrowDir = targetY > originalY ? 1 : -1
    ctx.beginPath()
    ctx.moveTo(midX - 5, targetY - arrowDir * 8)
    ctx.lineTo(midX, targetY)
    ctx.lineTo(midX + 5, targetY - arrowDir * 8)
    ctx.stroke()
  }

  // Note name label at target
  ctx.fillStyle = 'rgba(74, 222, 128, 0.9)'
  ctx.font = '12px monospace'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  const label = midiToNoteName(drag.currentMidiNote)
  ctx.fillText(label, x2 + 6, targetY)
}

/** Draw a horizontal snap line at the target semitone */
function drawSnapLine(
  ctx: CanvasRenderingContext2D,
  drag: DragState,
  viewport: Viewport,
  canvasWidth: number,
  canvasHeight: number,
) {
  if (!drag.snapEnabled) return

  const y = midiToY(drag.currentMidiNote, viewport, canvasHeight)

  ctx.beginPath()
  ctx.strokeStyle = 'rgba(74, 222, 128, 0.3)'
  ctx.lineWidth = 1
  ctx.setLineDash([2, 4])
  ctx.moveTo(0, y)
  ctx.lineTo(canvasWidth, y)
  ctx.stroke()
  ctx.setLineDash([])
}

/** Utility: draw a rounded rectangle */
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}
