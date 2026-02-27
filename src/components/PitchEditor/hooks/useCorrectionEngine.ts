import { useCallback, useRef } from 'react'
import { useStore } from '@/store'
import { CorrectionEngine } from '@/engine/pitchCorrection/CorrectionEngine'

/**
 * Hook that manages the CorrectionEngine lifecycle.
 * Call `renderCorrection()` after notes are edited to produce a corrected AudioBuffer.
 */
export function useCorrectionEngine() {
  const audioBuffer = useStore((s) => s.audioBuffer)
  const notes = useStore((s) => s.notes)
  const setCorrectedBuffer = useStore((s) => s.setCorrectedBuffer)

  const engineRef = useRef(new CorrectionEngine())

  const renderCorrection = useCallback(async () => {
    if (!audioBuffer || notes.length === 0) {
      console.log('[CorrectionEngine] No buffer or notes, skipping')
      return
    }

    // Check if any notes actually need correction
    const correctedNotes = notes.filter(
      (n) =>
        n.correctedMidiNote !== n.detectedMidiNote ||
        n.correctedCents !== n.detectedCents,
    )

    if (correctedNotes.length === 0) {
      console.log('[CorrectionEngine] No corrections needed')
      setCorrectedBuffer(null)
      return
    }

    console.log(`[CorrectionEngine] Rendering ${correctedNotes.length} corrections...`)
    try {
      const corrected = await engineRef.current.correct(audioBuffer, notes)
      console.log('[CorrectionEngine] Done! Buffer:', corrected.length, 'samples')
      setCorrectedBuffer(corrected)
    } catch (err) {
      console.error('[CorrectionEngine] Render failed:', err)
    }
  }, [audioBuffer, notes, setCorrectedBuffer])

  return { renderCorrection }
}
