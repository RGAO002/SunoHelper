import type { Viewport } from '@/types/editor'
import { midiToNoteName } from '@/utils/noteHelpers'
import { midiToY, timeToX } from '../utils/coordTransforms'

const BLACK_KEYS = new Set([1, 3, 6, 8, 10])

export function drawGrid(
  ctx: CanvasRenderingContext2D,
  viewport: Viewport,
  width: number,
  height: number,
): void {
  ctx.clearRect(0, 0, width, height)

  const bottomMidi = Math.floor(viewport.bottomMidi)
  const topMidi = Math.ceil(viewport.topMidi)

  // Draw semitone bands
  for (let midi = bottomMidi; midi <= topMidi; midi++) {
    const y = midiToY(midi + 0.5, viewport, height)
    const nextY = midiToY(midi - 0.5, viewport, height)
    const bandHeight = nextY - y
    const pitchClass = ((midi % 12) + 12) % 12

    // White key vs black key background
    ctx.fillStyle = BLACK_KEYS.has(pitchClass) ? '#12122a' : '#161636'
    ctx.fillRect(0, y, width, bandHeight)

    // Semitone border line
    const isC = pitchClass === 0
    ctx.strokeStyle = isC ? '#3a3a6a' : '#222248'
    ctx.lineWidth = isC ? 1.5 : 0.5
    ctx.beginPath()
    ctx.moveTo(0, nextY)
    ctx.lineTo(width, nextY)
    ctx.stroke()

    // Piano key labels on the left
    if (bandHeight > 10) {
      ctx.fillStyle = isC ? '#888' : '#555'
      ctx.font = `${Math.min(11, bandHeight * 0.7)}px monospace`
      ctx.textAlign = 'left'
      ctx.textBaseline = 'middle'
      ctx.fillText(midiToNoteName(midi), 4, (y + nextY) / 2)
    }
  }

  // Time gridlines
  const timeStep = calculateTimeGridStep(viewport)
  const startT = Math.floor(viewport.startTime / timeStep) * timeStep
  for (let t = startT; t <= viewport.endTime; t += timeStep) {
    const x = timeToX(t, viewport, width)
    ctx.strokeStyle = '#222248'
    ctx.lineWidth = 0.5
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, height)
    ctx.stroke()

    // Time label
    ctx.fillStyle = '#555'
    ctx.font = '9px monospace'
    ctx.textAlign = 'center'
    ctx.fillText(`${t.toFixed(1)}s`, x, height - 4)
  }
}

function calculateTimeGridStep(viewport: Viewport): number {
  const duration = viewport.endTime - viewport.startTime
  if (duration > 30) return 5
  if (duration > 10) return 1
  if (duration > 5) return 0.5
  return 0.1
}
