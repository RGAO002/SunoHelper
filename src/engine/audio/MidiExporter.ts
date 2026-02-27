import MidiWriter from 'midi-writer-js'
import type { NoteSegment } from '@/types/pitch'

/**
 * Export detected/corrected notes as a MIDI file.
 * Uses midi-writer-js to generate standard MIDI format.
 */
export function exportMidi(
  notes: NoteSegment[],
  bpm = 120,
  useCorrected = true,
): Blob {
  const track = new MidiWriter.Track()
  track.setTempo(bpm)
  track.addTrackName('SunoPrep Export')

  // Sort notes by start time
  const sorted = [...notes].sort((a, b) => a.startTime - b.startTime)

  for (const note of sorted) {
    const midiNote = useCorrected
      ? note.correctedMidiNote
      : note.detectedMidiNote

    // Convert time to ticks (at given BPM)
    // midi-writer-js uses 'T' prefix for tick-based timing
    const durationSeconds = note.endTime - note.startTime
    const durationTicks = Math.round(
      (durationSeconds / 60) * bpm * 128,
    ) // 128 ticks per beat

    // Start tick
    const startTicks = Math.round(
      (note.startTime / 60) * bpm * 128,
    )

    const noteEvent = new MidiWriter.NoteEvent({
      pitch: [midiNote] as unknown as string[],
      duration: `T${Math.max(1, durationTicks)}`,
      startTick: startTicks,
      velocity: Math.round(
        // Map average amplitude to MIDI velocity (0-127)
        Math.min(
          127,
          Math.max(
            40,
            note.amplitudeEnvelope.reduce((a, b) => a + b, 0) /
              note.amplitudeEnvelope.length *
              127,
          ),
        ),
      ),
    })

    track.addEvent(noteEvent)
  }

  const writer = new MidiWriter.Writer([track])
  const dataUri = writer.dataUri()

  // Convert data URI to Blob
  const byteString = atob(dataUri.split(',')[1])
  const mimeString = dataUri.split(',')[0].split(':')[1].split(';')[0]
  const ab = new ArrayBuffer(byteString.length)
  const ia = new Uint8Array(ab)
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i)
  }

  return new Blob([ab], { type: mimeString })
}
