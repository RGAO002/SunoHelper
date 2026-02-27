import { useEffect, useRef } from 'react'
import { useStore } from '@/store'
import { AudioPlayer } from '@/engine/audio/AudioPlayer'

/**
 * Hook that syncs AudioPlayer with the transport store.
 * - Starts/stops playback when isPlaying changes
 * - Reports currentTime at ~60fps via rAF
 * - Handles playback mode switching (original/corrected)
 * - Handles explicit seek (stop button, playhead click)
 */
export function usePlayhead() {
  const audioBuffer = useStore((s) => s.audioBuffer)
  const correctedBuffer = useStore((s) => s.correctedBuffer)
  const isPlaying = useStore((s) => s.isPlaying)
  const currentTime = useStore((s) => s.currentTime)
  const seekGeneration = useStore((s) => s.seekGeneration)
  const playbackMode = useStore((s) => s.playbackMode)
  const setIsPlaying = useStore((s) => s.setIsPlaying)
  const setCurrentTime = useStore((s) => s.setCurrentTime)

  const playerRef = useRef<AudioPlayer | null>(null)

  // Initialize player once
  useEffect(() => {
    const player = new AudioPlayer()
    playerRef.current = player

    player.setOnTimeUpdate((time) => {
      setCurrentTime(time)
    })
    player.setOnEnded(() => {
      setIsPlaying(false)
      setCurrentTime(0)
    })

    return () => {
      player.destroy()
      playerRef.current = null
    }
  }, [setCurrentTime, setIsPlaying])

  // Update buffer when mode changes
  useEffect(() => {
    const player = playerRef.current
    if (!player) return

    const buffer =
      playbackMode === 'corrected' && correctedBuffer
        ? correctedBuffer
        : audioBuffer

    if (buffer) {
      player.setBuffer(buffer)
    }
  }, [audioBuffer, correctedBuffer, playbackMode])

  // Play/pause control
  useEffect(() => {
    const player = playerRef.current
    if (!player) return

    if (isPlaying) {
      player.play()
    } else {
      player.pause()
    }
  }, [isPlaying])

  // Handle explicit seek (stop → 0, playhead click, etc.)
  // Watches seekGeneration which increments on each seekTo() call
  useEffect(() => {
    const player = playerRef.current
    if (!player || seekGeneration === 0) return

    player.seek(currentTime)
  }, [seekGeneration]) // eslint-disable-line react-hooks/exhaustive-deps
  // ^ intentionally only depends on seekGeneration, not currentTime
  // currentTime changes 60fps during playback — we only want to seek on explicit user action
}
