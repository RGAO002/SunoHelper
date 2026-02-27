import type { StateCreator } from 'zustand'
import type { CorrectionParams, ScaleConfig } from '@/types/correction'
import { createScaleConfig } from '@/constants/music'

export interface CorrectionSlice {
  correctionParams: CorrectionParams
  correctedBuffer: AudioBuffer | null
  setCorrectionParams: (params: Partial<CorrectionParams>) => void
  setCorrectedBuffer: (buffer: AudioBuffer | null) => void
  resetCorrection: () => void
}

const DEFAULT_SCALE: ScaleConfig = createScaleConfig(0, 'chromatic')

const DEFAULT_PARAMS: CorrectionParams = {
  autoCorrectStrength: 0,
  targetScale: DEFAULT_SCALE,
  preserveFormants: false,
  correctionSpeed: 0,
}

export const createCorrectionSlice: StateCreator<
  CorrectionSlice,
  [],
  [],
  CorrectionSlice
> = (set) => ({
  correctionParams: DEFAULT_PARAMS,
  correctedBuffer: null,
  setCorrectionParams: (params) =>
    set((state) => ({
      correctionParams: { ...state.correctionParams, ...params },
    })),
  setCorrectedBuffer: (buffer) => set({ correctedBuffer: buffer }),
  resetCorrection: () =>
    set({ correctionParams: DEFAULT_PARAMS, correctedBuffer: null }),
})
