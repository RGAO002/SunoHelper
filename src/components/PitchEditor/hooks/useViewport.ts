import { useEffect } from 'react'
import { useStore } from '@/store'

/**
 * Auto-fit viewport to audio duration and detected notes.
 * Also computes pixelsPerSecond / pixelsPerSemitone from canvas dimensions.
 */
export function useViewport(canvasWidth = 0, canvasHeight = 0) {
  const duration = useStore((s) => s.duration)
  const notes = useStore((s) => s.notes)
  const setViewport = useStore((s) => s.setViewport)

  useEffect(() => {
    if (duration <= 0) return

    // Set time range to cover full audio + small padding
    const endTime = Math.ceil(duration) + 0.5

    // If we have notes, fit the pitch range
    if (notes.length > 0) {
      const midiNotes = notes.map((n) => n.detectedMidiNote)
      const minMidi = Math.min(...midiNotes)
      const maxMidi = Math.max(...midiNotes)
      const padding = 4 // semitones

      const bottomMidi = Math.max(24, minMidi - padding)
      const topMidi = Math.min(96, maxMidi + padding)

      setViewport({
        startTime: 0,
        endTime,
        bottomMidi,
        topMidi,
        ...(canvasWidth > 0 && {
          pixelsPerSecond: canvasWidth / endTime,
        }),
        ...(canvasHeight > 0 && {
          pixelsPerSemitone: canvasHeight / (topMidi - bottomMidi),
        }),
      })
    } else {
      setViewport({
        startTime: 0,
        endTime,
        ...(canvasWidth > 0 && {
          pixelsPerSecond: canvasWidth / endTime,
        }),
      })
    }
  }, [duration, notes, setViewport, canvasWidth, canvasHeight])
}
