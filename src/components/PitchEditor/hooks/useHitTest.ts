import { useCallback } from 'react'
import type { Viewport } from '@/types/editor'
import type { NoteSegment } from '@/types/pitch'
import { timeToX, midiToY } from '../utils/coordTransforms'

/**
 * Returns a function that performs hit testing against note blobs.
 * Given mouse (x, y) in canvas coords, returns the NoteSegment under cursor or null.
 *
 * Hit testing uses the blob's bounding box (time range × pitch ± half semitone).
 * For more precise testing we'd check the amplitude envelope shape,
 * but bounding box is sufficient for a good UX.
 */
export function useHitTest(
  notes: NoteSegment[],
  viewport: Viewport,
  canvasWidth: number,
  canvasHeight: number,
) {
  return useCallback(
    (mouseX: number, mouseY: number): NoteSegment | null => {
      // Search in reverse to prefer notes drawn on top (later in array)
      for (let i = notes.length - 1; i >= 0; i--) {
        const note = notes[i]

        const x1 = timeToX(note.startTime, viewport, canvasWidth)
        const x2 = timeToX(note.endTime, viewport, canvasWidth)

        // Check horizontal bounds
        if (mouseX < x1 || mouseX > x2) continue

        // Blob vertical bounds: correctedMidiNote ± some range
        const semitoneHeight =
          canvasHeight / (viewport.topMidi - viewport.bottomMidi)
        const blobHalfHeight = semitoneHeight * 0.5

        const centerY = midiToY(
          note.correctedMidiNote,
          viewport,
          canvasHeight,
        )

        // Check vertical bounds (with generous hit area)
        if (mouseY < centerY - blobHalfHeight || mouseY > centerY + blobHalfHeight) continue

        return note
      }

      return null
    },
    [notes, viewport, canvasWidth, canvasHeight],
  )
}
