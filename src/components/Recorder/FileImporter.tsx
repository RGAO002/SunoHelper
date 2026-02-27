import { useCallback, useRef, useState } from 'react'
import { useStore } from '@/store'

/**
 * Supported audio MIME types for the file picker.
 * Web Audio API's decodeAudioData handles the actual decoding,
 * so anything the browser can decode will work.
 */
const ACCEPTED_TYPES = [
  'audio/wav',
  'audio/x-wav',
  'audio/mp3',
  'audio/mpeg',
  'audio/ogg',
  'audio/flac',
  'audio/x-flac',
  'audio/mp4',       // m4a
  'audio/x-m4a',
  'audio/aac',
  'audio/webm',
].join(',')

/** File extensions shown in the picker */
const ACCEPTED_EXT = '.wav,.mp3,.ogg,.flac,.m4a,.aac,.webm,.opus'

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50 MB

export function FileImporter() {
  const setAudioBuffer = useStore((s) => s.setAudioBuffer)
  const setAudioUrl = useStore((s) => s.setAudioUrl)
  const setPhase = useStore((s) => s.setPhase)
  const resetAudio = useStore((s) => s.resetAudio)
  const resetPitchData = useStore((s) => s.resetPitchData)
  const resetCorrection = useStore((s) => s.resetCorrection)
  const resetEditor = useStore((s) => s.resetEditor)
  const resetTransport = useStore((s) => s.resetTransport)
  const resetHistory = useStore((s) => s.resetHistory)

  const inputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)

  const processFile = useCallback(
    async (file: File) => {
      setError(null)

      // Validate size
      if (file.size > MAX_FILE_SIZE) {
        setError('File too large (max 50 MB)')
        return
      }

      // Validate type loosely — let decodeAudioData be the real gatekeeper
      if (!file.type.startsWith('audio/') && !ACCEPTED_EXT.split(',').some(ext => file.name.toLowerCase().endsWith(ext))) {
        setError('Unsupported file type')
        return
      }

      setLoading(true)

      try {
        // Reset all state
        resetTransport()
        resetPitchData()
        resetCorrection()
        resetHistory()
        resetAudio()
        resetEditor()

        // Decode the file
        const arrayBuffer = await file.arrayBuffer()
        const audioCtx = new AudioContext({ sampleRate: 44100 })
        const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer)
        await audioCtx.close()

        // Set a blob URL for potential playback reference
        const url = URL.createObjectURL(file)
        setAudioUrl(url)
        setAudioBuffer(audioBuffer)
        setPhase('analyzing')
      } catch {
        setError('Failed to decode audio — format may not be supported by your browser')
      } finally {
        setLoading(false)
        // Reset the input so the same file can be re-imported
        if (inputRef.current) inputRef.current.value = ''
      }
    },
    [setAudioBuffer, setAudioUrl, setPhase, resetAudio, resetPitchData, resetCorrection, resetEditor, resetTransport, resetHistory],
  )

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) processFile(file)
    },
    [processFile],
  )

  const handleClick = useCallback(() => {
    inputRef.current?.click()
  }, [])

  // --- Drag & Drop ---
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragOver(false)

      const file = e.dataTransfer.files[0]
      if (file) processFile(file)
    },
    [processFile],
  )

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept={`${ACCEPTED_TYPES},${ACCEPTED_EXT}`}
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Drop zone / click button */}
      <button
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        disabled={loading}
        className={`
          flex flex-col items-center gap-1.5 rounded-lg border-2 border-dashed
          px-5 py-3 text-sm transition-all
          ${isDragOver
            ? 'border-accent bg-accent/10 scale-105'
            : 'border-zinc-700 bg-zinc-800/50 hover:border-zinc-500 hover:bg-zinc-800'
          }
          ${loading ? 'opacity-50 cursor-wait' : 'cursor-pointer'}
        `}
      >
        {/* Upload icon */}
        <svg
          className={`h-5 w-5 ${isDragOver ? 'text-accent' : 'text-zinc-400'}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          />
        </svg>

        <span className={`font-medium ${isDragOver ? 'text-accent' : 'text-zinc-300'}`}>
          {loading ? 'Decoding...' : isDragOver ? 'Drop here' : 'Import Audio'}
        </span>
        <span className="text-[10px] text-zinc-500">
          WAV, MP3, OGG, FLAC, M4A, WebM
        </span>
      </button>

      {error && (
        <span className="max-w-[200px] text-center text-xs text-red-400">{error}</span>
      )}
    </div>
  )
}
