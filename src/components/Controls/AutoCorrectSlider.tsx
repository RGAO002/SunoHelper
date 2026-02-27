import { useCallback, useMemo } from 'react'
import { useStore } from '@/store'
import { PitchQuantizer } from '@/engine/pitchDetection/PitchQuantizer'

/**
 * Auto-correct slider (0–100%).
 * Dragging this progressively quantizes all notes toward the target scale.
 * Bigger deviations get corrected first (like Melodyne's behavior).
 */
export function AutoCorrectSlider() {
  const correctionParams = useStore((s) => s.correctionParams)
  const setCorrectionParams = useStore((s) => s.setCorrectionParams)
  const notes = useStore((s) => s.notes)
  const setNotes = useStore((s) => s.setNotes)
  const setPhase = useStore((s) => s.setPhase)

  const quantizer = useMemo(() => new PitchQuantizer(), [])

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const strength = Number(e.target.value)
      setCorrectionParams({ autoCorrectStrength: strength })

      // Apply quantization to all notes
      if (notes.length > 0) {
        const params = { ...correctionParams, autoCorrectStrength: strength }
        const correctedNotes = quantizer.quantize(notes, params)
        setNotes(correctedNotes)
        if (strength > 0) setPhase('corrected')
      }
    },
    [notes, correctionParams, quantizer, setCorrectionParams, setNotes, setPhase],
  )

  const strength = correctionParams.autoCorrectStrength

  return (
    <div className="flex items-center gap-3">
      <label className="text-xs text-zinc-400 whitespace-nowrap">
        Auto-Correct
      </label>
      <input
        type="range"
        min={0}
        max={100}
        step={1}
        value={strength}
        onChange={handleChange}
        className="h-1.5 w-32 cursor-pointer appearance-none rounded-full bg-zinc-700
          [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5
          [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full
          [&::-webkit-slider-thumb]:bg-accent [&::-webkit-slider-thumb]:shadow-md"
      />
      <span className="w-8 text-right text-xs font-mono text-zinc-300">
        {strength}%
      </span>
    </div>
  )
}
