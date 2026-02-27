import { useCallback, useState } from 'react'
import { useStore } from '@/store'
import { audioBufferToWavBlob, downloadBlob } from '@/engine/audio/WavEncoder'
import { exportMidi } from '@/engine/audio/MidiExporter'

export function ExportPanel() {
  const audioBuffer = useStore((s) => s.audioBuffer)
  const correctedBuffer = useStore((s) => s.correctedBuffer)
  const notes = useStore((s) => s.notes)
  const phase = useStore((s) => s.phase)
  const [exporting, setExporting] = useState(false)

  const hasCorrected = correctedBuffer !== null
  const hasNotes = notes.length > 0

  const handleExportWav = useCallback(
    async (mode: 'original' | 'corrected') => {
      const buffer = mode === 'corrected' ? correctedBuffer : audioBuffer
      if (!buffer) return

      setExporting(true)
      try {
        const blob = audioBufferToWavBlob(buffer)
        const timestamp = new Date().toISOString().slice(0, 16).replace(':', '-')
        downloadBlob(blob, `sunoprep-${mode}-${timestamp}.wav`)
      } finally {
        setExporting(false)
      }
    },
    [audioBuffer, correctedBuffer],
  )

  const handleExportMidi = useCallback(() => {
    if (!hasNotes) return

    setExporting(true)
    try {
      const blob = exportMidi(notes, 120, true)
      const timestamp = new Date().toISOString().slice(0, 16).replace(':', '-')
      downloadBlob(blob, `sunoprep-${timestamp}.mid`)
    } finally {
      setExporting(false)
    }
  }, [notes, hasNotes])

  if (phase !== 'analyzed' && phase !== 'corrected') return null

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg bg-surface px-4 py-3">
      <span className="text-xs font-medium text-zinc-400">Export</span>

      {/* WAV Original */}
      <button
        onClick={() => handleExportWav('original')}
        disabled={!audioBuffer || exporting}
        className="rounded-md bg-zinc-800 px-3 py-1.5 text-xs text-zinc-200
          transition-colors hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed
          border border-zinc-700"
      >
        WAV (Original)
      </button>

      {/* WAV Corrected */}
      <button
        onClick={() => handleExportWav('corrected')}
        disabled={!hasCorrected || exporting}
        className="rounded-md bg-green-900/50 px-3 py-1.5 text-xs text-green-300
          transition-colors hover:bg-green-900/70 disabled:opacity-40 disabled:cursor-not-allowed
          border border-green-700"
      >
        WAV (Corrected)
      </button>

      {/* MIDI */}
      <button
        onClick={handleExportMidi}
        disabled={!hasNotes || exporting}
        className="rounded-md bg-purple-900/50 px-3 py-1.5 text-xs text-purple-300
          transition-colors hover:bg-purple-900/70 disabled:opacity-40 disabled:cursor-not-allowed
          border border-purple-700"
      >
        MIDI
      </button>

      {/* Suno Ready badge */}
      {hasCorrected && (
        <div className="ml-auto flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs font-medium text-green-400">
            Suno Ready
          </span>
        </div>
      )}

      {exporting && (
        <span className="text-xs text-zinc-500 animate-pulse">
          Exporting...
        </span>
      )}
    </div>
  )
}
