import { useEffect } from 'react'
import { useStore } from '@/store'

/**
 * Global keyboard shortcuts for the pitch editor.
 *
 * | Key           | Action                           |
 * |---------------|----------------------------------|
 * | Space         | Play / Pause                     |
 * | Ctrl/Cmd+Z    | Undo                             |
 * | Ctrl/Cmd+Shift+Z | Redo                         |
 * | Delete/Backspace | Reset selected note to original |
 * | ↑/↓           | Nudge selected note ±1 semitone  |
 * | Shift+↑/↓     | Nudge ±1 octave                  |
 */
export function useKeyboardShortcuts() {
  const isPlaying = useStore((s) => s.isPlaying)
  const setIsPlaying = useStore((s) => s.setIsPlaying)
  const selectedNoteIds = useStore((s) => s.selectedNoteIds)
  const notes = useStore((s) => s.notes)
  const updateNotePitch = useStore((s) => s.updateNotePitch)
  const pushHistory = useStore((s) => s.pushHistory)
  const undo = useStore((s) => s.undo)
  const redo = useStore((s) => s.redo)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isMeta = e.metaKey || e.ctrlKey

      // Space — Play/Pause
      if (e.code === 'Space' && !isMeta) {
        e.preventDefault()
        setIsPlaying(!isPlaying)
        return
      }

      // Ctrl/Cmd+Z — Undo
      if (isMeta && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        const edit = undo()
        if (edit) {
          updateNotePitch(edit.noteId, edit.fromMidiNote, edit.fromCents)
        }
        return
      }

      // Ctrl/Cmd+Shift+Z — Redo
      if (isMeta && e.key === 'z' && e.shiftKey) {
        e.preventDefault()
        const edit = redo()
        if (edit) {
          updateNotePitch(edit.noteId, edit.toMidiNote, edit.toCents)
        }
        return
      }

      // Delete / Backspace — Reset selected notes to original pitch
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedNoteIds.size > 0) {
          e.preventDefault()
          for (const noteId of selectedNoteIds) {
            const note = notes.find((n) => n.id === noteId)
            if (note && (note.correctedMidiNote !== note.detectedMidiNote || note.correctedCents !== note.detectedCents)) {
              pushHistory({
                noteId: note.id,
                fromMidiNote: note.correctedMidiNote,
                fromCents: note.correctedCents,
                toMidiNote: note.detectedMidiNote,
                toCents: note.detectedCents,
                timestamp: Date.now(),
              })
              updateNotePitch(note.id, note.detectedMidiNote, note.detectedCents)
            }
          }
        }
        return
      }

      // ↑/↓ — Nudge pitch
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        if (selectedNoteIds.size > 0) {
          e.preventDefault()
          const delta = e.key === 'ArrowUp' ? 1 : -1
          const amount = e.shiftKey ? 12 * delta : delta

          for (const noteId of selectedNoteIds) {
            const note = notes.find((n) => n.id === noteId)
            if (note) {
              const newMidi = note.correctedMidiNote + amount
              pushHistory({
                noteId: note.id,
                fromMidiNote: note.correctedMidiNote,
                fromCents: note.correctedCents,
                toMidiNote: newMidi,
                toCents: 0,
                timestamp: Date.now(),
              })
              updateNotePitch(note.id, newMidi, 0)
            }
          }
        }
        return
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isPlaying, selectedNoteIds, notes, setIsPlaying, undo, redo, updateNotePitch, pushHistory])
}
