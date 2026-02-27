import { useCallback } from 'react'
import { useStore } from '@/store'
import { createScaleConfig, KEY_NAMES, SCALE_INTERVALS } from '@/constants/music'
import type { ScaleType } from '@/types/correction'

const SCALE_TYPES = Object.keys(SCALE_INTERVALS) as ScaleType[]
const ROOT_NOTES = Array.from({ length: 12 }, (_, i) => i)

export function ScaleSelector() {
  const correctionParams = useStore((s) => s.correctionParams)
  const setCorrectionParams = useStore((s) => s.setCorrectionParams)

  const currentRoot = correctionParams.targetScale.root
  const currentType = SCALE_TYPES.find(
    (t) =>
      JSON.stringify(SCALE_INTERVALS[t]) ===
      JSON.stringify(correctionParams.targetScale.intervals),
  ) ?? 'chromatic'

  const handleRootChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const root = Number(e.target.value)
      setCorrectionParams({
        targetScale: createScaleConfig(root, currentType),
      })
    },
    [currentType, setCorrectionParams],
  )

  const handleTypeChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const type = e.target.value as ScaleType
      setCorrectionParams({
        targetScale: createScaleConfig(currentRoot, type),
      })
    },
    [currentRoot, setCorrectionParams],
  )

  return (
    <div className="flex items-center gap-2">
      <label className="text-xs text-zinc-400">Scale</label>

      {/* Root note selector */}
      <select
        value={currentRoot}
        onChange={handleRootChange}
        className="rounded bg-zinc-800 px-2 py-1 text-xs text-zinc-200
          border border-zinc-700 focus:border-accent focus:outline-none"
      >
        {ROOT_NOTES.map((note) => (
          <option key={note} value={note}>
            {KEY_NAMES[note]}
          </option>
        ))}
      </select>

      {/* Scale type selector */}
      <select
        value={currentType}
        onChange={handleTypeChange}
        className="rounded bg-zinc-800 px-2 py-1 text-xs text-zinc-200
          border border-zinc-700 focus:border-accent focus:outline-none capitalize"
      >
        {SCALE_TYPES.map((type) => (
          <option key={type} value={type}>
            {type}
          </option>
        ))}
      </select>
    </div>
  )
}
