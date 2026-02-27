import { useEffect, useRef } from 'react'
import { useStore } from '@/store'
import { GridLayer } from './layers/GridLayer'
import { BlobLayer } from './layers/BlobLayer'
import { PitchContourLayer } from './layers/PitchContourLayer'
import { CorrectionOverlay } from './layers/CorrectionOverlay'
import { InteractionLayer } from './layers/InteractionLayer'
import { PlayheadLayer } from './layers/PlayheadLayer'
import { useCanvasScale } from './hooks/useCanvasScale'
import { useViewport } from './hooks/useViewport'
import { usePitchAnalysis } from './hooks/usePitchAnalysis'
import { usePlayhead } from './hooks/usePlayhead'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import { useCorrectionEngine } from './hooks/useCorrectionEngine'

export function PitchEditor() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { width, height, dpr } = useCanvasScale(containerRef)
  const viewport = useStore((s) => s.viewport)
  const notes = useStore((s) => s.notes)
  const selectedNoteIds = useStore((s) => s.selectedNoteIds)
  const audioBuffer = useStore((s) => s.audioBuffer)
  const phase = useStore((s) => s.phase)
  const currentTime = useStore((s) => s.currentTime)
  const isPlaying = useStore((s) => s.isPlaying)

  const { analyze } = usePitchAnalysis()

  // Auto-fit viewport based on audio duration, detected notes, and canvas size
  useViewport(width, height)

  // Playback engine
  usePlayhead()

  // Global keyboard shortcuts
  useKeyboardShortcuts()

  // Pitch correction engine
  const { renderCorrection } = useCorrectionEngine()

  // Trigger analysis when audioBuffer is available and phase is 'analyzing'
  useEffect(() => {
    if (audioBuffer && phase === 'analyzing') {
      analyze(audioBuffer)
    }
  }, [audioBuffer, phase, analyze])

  // Trigger correction rendering when phase becomes 'corrected'
  useEffect(() => {
    if (phase === 'corrected') {
      renderCorrection()
    }
  }, [phase, notes, renderCorrection])

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full overflow-hidden"
      style={{ minHeight: 400 }}
    >
      {width > 0 && height > 0 && (
        <>
          {/* Layer 0: Grid */}
          <GridLayer
            width={width}
            height={height}
            dpr={dpr}
            viewport={viewport}
          />

          {/* Layer 1: Note blobs */}
          {notes.length > 0 && (
            <BlobLayer
              width={width}
              height={height}
              dpr={dpr}
              viewport={viewport}
              notes={notes}
              selectedNoteIds={selectedNoteIds}
            />
          )}

          {/* Layer 2: Pitch contour */}
          {notes.length > 0 && (
            <PitchContourLayer
              width={width}
              height={height}
              dpr={dpr}
              viewport={viewport}
              notes={notes}
            />
          )}

          {/* Layer 3: Correction markers (original → corrected arrows) */}
          {notes.length > 0 && (
            <CorrectionOverlay
              width={width}
              height={height}
              dpr={dpr}
              viewport={viewport}
              notes={notes}
            />
          )}

          {/* Layer 4: Interaction (hover, drag feedback, mouse events) */}
          {notes.length > 0 && (
            <InteractionLayer
              width={width}
              height={height}
              dpr={dpr}
              viewport={viewport}
              notes={notes}
            />
          )}

          {/* Layer 5: Playhead */}
          <PlayheadLayer
            width={width}
            height={height}
            dpr={dpr}
            viewport={viewport}
            currentTime={currentTime}
            isPlaying={isPlaying}
          />
        </>
      )}

      {/* Status overlay */}
      <div className="absolute bottom-2 right-2 flex items-center gap-2 text-xs text-zinc-500">
        {phase === 'analyzing' && (
          <span className="animate-pulse text-accent">Analyzing...</span>
        )}
        {notes.length > 0 && <span>{notes.length} notes detected</span>}
      </div>
    </div>
  )
}
