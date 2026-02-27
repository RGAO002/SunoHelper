import { useCallback } from 'react'
import { useStore } from '@/store'
import { RecordButton } from '@/components/Recorder/RecordButton'
import { FileImporter } from '@/components/Recorder/FileImporter'
import { PitchEditor } from '@/components/PitchEditor/PitchEditor'
import { TransportBar } from '@/components/Controls/TransportBar'
import { AutoCorrectSlider } from '@/components/Controls/AutoCorrectSlider'
import { ScaleSelector } from '@/components/Controls/ScaleSelector'
import { ExportPanel } from '@/components/Export/ExportPanel'
import { generateDemoAudio } from '@/engine/audio/DemoGenerator'

export default function App() {
  const phase = useStore((s) => s.phase)
  const setAudioBuffer = useStore((s) => s.setAudioBuffer)
  const setPhase = useStore((s) => s.setPhase)
  const resetAudio = useStore((s) => s.resetAudio)
  const resetPitchData = useStore((s) => s.resetPitchData)
  const resetCorrection = useStore((s) => s.resetCorrection)
  const resetEditor = useStore((s) => s.resetEditor)
  const resetTransport = useStore((s) => s.resetTransport)
  const resetHistory = useStore((s) => s.resetHistory)
  const hasNotes = phase === 'analyzed' || phase === 'corrected'

  const handleDemo = useCallback(() => {
    // Clear all previous state before loading demo
    resetTransport()
    resetPitchData()
    resetCorrection()
    resetHistory()
    resetAudio()
    resetEditor()

    const demoBuffer = generateDemoAudio()
    setAudioBuffer(demoBuffer)
    setPhase('analyzing')
  }, [setAudioBuffer, setPhase, resetAudio, resetPitchData, resetCorrection, resetEditor, resetTransport, resetHistory])

  return (
    <div className="flex min-h-screen flex-col bg-bg">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-zinc-800 px-6 py-3">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold tracking-tight">
            <span style={{ color: '#f97316' }}>Suno</span>{' '}
            <span className="text-white">Helper</span>
          </h1>
          <span className="text-xs text-zinc-500">
            Clean your musical ideas for Suno
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-zinc-600">
          <span className="rounded bg-zinc-800 px-2 py-0.5">{phase}</span>
        </div>
      </header>

      {/* Main content */}
      <main className="flex flex-1 flex-col gap-4 p-4">
        {/* Input section: Record / Import / Demo */}
        <div className="flex items-center justify-center gap-6 rounded-lg bg-surface p-6">
          <RecordButton />

          {phase !== 'recording' && (
            <>
              <div className="h-12 w-px bg-zinc-700" /> {/* divider */}
              <FileImporter />
            </>
          )}

          {phase === 'idle' && (
            <>
              <div className="h-12 w-px bg-zinc-700" /> {/* divider */}
              <div className="flex flex-col items-center gap-2">
                <button
                  onClick={handleDemo}
                  className="rounded-lg bg-accent/20 px-4 py-2 text-sm font-medium text-accent
                    transition-all hover:bg-accent/30 hover:scale-105 border border-accent/30"
                >
                  Try Demo
                </button>
                <span className="text-[10px] text-zinc-600">
                  No mic needed
                </span>
              </div>
            </>
          )}
        </div>

        {/* Controls bar — shows after analysis */}
        {hasNotes && (
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg bg-surface px-4 py-3">
            <TransportBar />
            <div className="flex items-center gap-6">
              <ScaleSelector />
              <AutoCorrectSlider />
            </div>
          </div>
        )}

        {/* Pitch Editor - shows after recording */}
        {phase !== 'idle' && phase !== 'recording' && (
          <div className="flex-1 rounded-lg bg-surface" style={{ minHeight: 400 }}>
            <PitchEditor />
          </div>
        )}

        {/* Export panel */}
        {hasNotes && <ExportPanel />}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800 px-6 py-2 text-center text-xs text-zinc-600">
        Built with Web Audio API & React 19 · Suno Helper
      </footer>
    </div>
  )
}
