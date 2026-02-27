import { useStore } from '@/store'
import { useCallback } from 'react'

export function TransportBar() {
  const isPlaying = useStore((s) => s.isPlaying)
  const currentTime = useStore((s) => s.currentTime)
  const duration = useStore((s) => s.duration)
  const playbackMode = useStore((s) => s.playbackMode)
  const setIsPlaying = useStore((s) => s.setIsPlaying)
  const seekTo = useStore((s) => s.seekTo)
  const setPlaybackMode = useStore((s) => s.setPlaybackMode)

  const togglePlay = useCallback(() => {
    setIsPlaying(!isPlaying)
  }, [isPlaying, setIsPlaying])

  const stop = useCallback(() => {
    setIsPlaying(false)
    seekTo(0)
  }, [setIsPlaying, seekTo])

  const toggleMode = useCallback(() => {
    setPlaybackMode(playbackMode === 'original' ? 'corrected' : 'original')
  }, [playbackMode, setPlaybackMode])

  const formatTime = (t: number) => {
    const mins = Math.floor(t / 60)
    const secs = Math.floor(t % 60)
    const ms = Math.floor((t % 1) * 10)
    return `${mins}:${String(secs).padStart(2, '0')}.${ms}`
  }

  return (
    <div className="flex items-center gap-3">
      {/* Play/Pause */}
      <button
        onClick={togglePlay}
        className="flex h-8 w-8 items-center justify-center rounded-md bg-zinc-800
          text-white transition-colors hover:bg-zinc-700"
        title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
      >
        {isPlaying ? (
          // Pause icon
          <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
            <rect x="2" y="1" width="3.5" height="12" rx="0.5" />
            <rect x="8.5" y="1" width="3.5" height="12" rx="0.5" />
          </svg>
        ) : (
          // Play icon
          <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
            <path d="M3 1.5v11l9-5.5z" />
          </svg>
        )}
      </button>

      {/* Stop */}
      <button
        onClick={stop}
        className="flex h-8 w-8 items-center justify-center rounded-md bg-zinc-800
          text-white transition-colors hover:bg-zinc-700"
        title="Stop"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
          <rect x="1" y="1" width="10" height="10" rx="1" />
        </svg>
      </button>

      {/* Time display */}
      <span className="font-mono text-xs text-zinc-300 tabular-nums">
        {formatTime(currentTime)} / {formatTime(duration)}
      </span>

      {/* A/B mode toggle */}
      <button
        onClick={toggleMode}
        className={`rounded-md px-2 py-1 text-xs font-medium transition-colors ${
          playbackMode === 'corrected'
            ? 'bg-green-900/50 text-green-300 border border-green-700'
            : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
        }`}
        title="Toggle Original / Corrected playback"
      >
        {playbackMode === 'original' ? 'Original' : 'Corrected'}
      </button>
    </div>
  )
}
