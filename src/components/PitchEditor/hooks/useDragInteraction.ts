import { useCallback, useRef, useState } from 'react'
import type { DragState } from '@/types/editor'
import type { Viewport } from '@/types/editor'
import type { NoteSegment } from '@/types/pitch'
import { useStore } from '@/store'
import { yToMidi } from '../utils/coordTransforms'

/**
 * State machine for blob drag interaction:
 *   IDLE ─(mousemove onto blob)─> HOVERING (cursor: grab)
 *   HOVERING ─(mousemove away)─> IDLE
 *   HOVERING ─(mousedown)─> DRAGGING (cursor: grabbing)
 *   DRAGGING ─(mousemove)─> DRAGGING (update offset)
 *   DRAGGING ─(mouseup)─> IDLE (commit edit)
 *   DRAGGING ─(Escape)─> IDLE (cancel)
 */
export function useDragInteraction(
  hitTest: (x: number, y: number) => NoteSegment | null,
  viewport: Viewport,
  _canvasWidth: number,
  canvasHeight: number,
) {
  const updateNotePitch = useStore((s) => s.updateNotePitch)
  const pushHistory = useStore((s) => s.pushHistory)
  const setSelectedNoteIds = useStore((s) => s.setSelectedNoteIds)
  const setPhase = useStore((s) => s.setPhase)

  const [dragState, setDragState] = useState<DragState>({
    status: 'idle',
    targetNoteId: null,
    startMouseY: 0,
    startMidiNote: 0,
    currentMidiNote: 0,
    currentCents: 0,
    snapEnabled: true,
  })

  // Keep a ref to the note being dragged for commit
  const draggedNoteRef = useRef<NoteSegment | null>(null)

  const onMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const rect = e.currentTarget.getBoundingClientRect()
      const mouseX = e.clientX - rect.left
      const mouseY = e.clientY - rect.top

      if (dragState.status === 'dragging') {
        // Update drag position
        const rawMidi = yToMidi(mouseY, viewport, canvasHeight)
        const altKey = e.altKey

        let snappedMidi: number
        let snappedCents: number

        if (altKey) {
          // Free drag (cent-level precision)
          snappedMidi = Math.round(rawMidi)
          snappedCents = Math.round((rawMidi - snappedMidi) * 100)
        } else {
          // Snap to nearest semitone
          snappedMidi = Math.round(rawMidi)
          snappedCents = 0
        }

        setDragState((prev) => ({
          ...prev,
          currentMidiNote: snappedMidi,
          currentCents: snappedCents,
          snapEnabled: !altKey,
        }))
      } else {
        // Hit test for hover
        const hit = hitTest(mouseX, mouseY)
        if (hit) {
          if (dragState.status !== 'hovering' || dragState.targetNoteId !== hit.id) {
            setDragState({
              status: 'hovering',
              targetNoteId: hit.id,
              startMouseY: mouseY,
              startMidiNote: hit.correctedMidiNote,
              currentMidiNote: hit.correctedMidiNote,
              currentCents: hit.correctedCents,
              snapEnabled: true,
            })
          }
        } else if (dragState.status === 'hovering') {
          setDragState({
            status: 'idle',
            targetNoteId: null,
            startMouseY: 0,
            startMidiNote: 0,
            currentMidiNote: 0,
            currentCents: 0,
            snapEnabled: true,
          })
        }
      }
    },
    [dragState.status, dragState.targetNoteId, hitTest, viewport, canvasHeight],
  )

  const onMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (dragState.status !== 'hovering' || !dragState.targetNoteId) return

      const rect = e.currentTarget.getBoundingClientRect()
      const mouseY = e.clientY - rect.top
      const mouseX = e.clientX - rect.left

      // Find the note
      const note = hitTest(mouseX, mouseY)
      if (!note) return

      draggedNoteRef.current = note
      setSelectedNoteIds(new Set([note.id]))

      setDragState((prev) => ({
        ...prev,
        status: 'dragging',
        startMouseY: mouseY,
        startMidiNote: note.correctedMidiNote,
      }))

      e.preventDefault()
    },
    [dragState.status, dragState.targetNoteId, hitTest, setSelectedNoteIds],
  )

  const onMouseUp = useCallback(() => {
    if (dragState.status !== 'dragging' || !draggedNoteRef.current) {
      return
    }

    const note = draggedNoteRef.current
    const { currentMidiNote, currentCents } = dragState

    // Commit the edit
    if (
      currentMidiNote !== note.correctedMidiNote ||
      currentCents !== note.correctedCents
    ) {
      // Push history for undo
      pushHistory({
        noteId: note.id,
        fromMidiNote: note.correctedMidiNote,
        fromCents: note.correctedCents,
        toMidiNote: currentMidiNote,
        toCents: currentCents,
        timestamp: Date.now(),
      })

      updateNotePitch(note.id, currentMidiNote, currentCents)
      setPhase('corrected')
    }

    draggedNoteRef.current = null
    setDragState({
      status: 'idle',
      targetNoteId: null,
      startMouseY: 0,
      startMidiNote: 0,
      currentMidiNote: 0,
      currentCents: 0,
      snapEnabled: true,
    })
  }, [dragState, pushHistory, updateNotePitch, setPhase])

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape' && dragState.status === 'dragging') {
        // Cancel drag
        draggedNoteRef.current = null
        setDragState({
          status: 'idle',
          targetNoteId: null,
          startMouseY: 0,
          startMidiNote: 0,
          currentMidiNote: 0,
          currentCents: 0,
          snapEnabled: true,
        })
      }
    },
    [dragState.status],
  )

  const onMouseLeave = useCallback(() => {
    if (dragState.status === 'hovering') {
      setDragState({
        status: 'idle',
        targetNoteId: null,
        startMouseY: 0,
        startMidiNote: 0,
        currentMidiNote: 0,
        currentCents: 0,
        snapEnabled: true,
      })
    }
    // If dragging, we keep the state (user might come back)
  }, [dragState.status])

  // Compute the MIDI offset for the blob being dragged
  const dragMidiOffset =
    dragState.status === 'dragging' && draggedNoteRef.current
      ? dragState.currentMidiNote - draggedNoteRef.current.correctedMidiNote
      : 0

  const cursor =
    dragState.status === 'dragging'
      ? 'grabbing'
      : dragState.status === 'hovering'
        ? 'grab'
        : 'default'

  return {
    dragState,
    dragMidiOffset,
    cursor,
    handlers: {
      onMouseMove,
      onMouseDown,
      onMouseUp,
      onKeyDown,
      onMouseLeave,
    },
  }
}
