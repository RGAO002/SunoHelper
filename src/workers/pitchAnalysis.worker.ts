// Web Worker for offline pitch analysis
// Runs PitchAnalyzer + NoteSegmenter off the main thread

import { PitchAnalyzer } from '../engine/pitchDetection/PitchAnalyzer'
import { NoteSegmenter } from '../engine/pitchDetection/NoteSegmenter'

export interface AnalysisWorkerInput {
  channelData: Float32Array
  sampleRate: number
}

export interface AnalysisWorkerOutput {
  type: 'progress' | 'complete' | 'error'
  progress?: number
  notes?: import('../types/pitch').NoteSegment[]
  frames?: import('../types/pitch').PitchFrame[]
  error?: string
}

self.onmessage = (e: MessageEvent<AnalysisWorkerInput>) => {
  try {
    const { channelData, sampleRate } = e.data

    self.postMessage({
      type: 'progress',
      progress: 0.1,
    } satisfies AnalysisWorkerOutput)

    const analyzer = new PitchAnalyzer()
    const frames = analyzer.analyze(channelData, sampleRate)

    self.postMessage({
      type: 'progress',
      progress: 0.6,
      frames,
    } satisfies AnalysisWorkerOutput)

    const segmenter = new NoteSegmenter()
    const notes = segmenter.segment(frames, sampleRate)

    self.postMessage({
      type: 'progress',
      progress: 0.9,
    } satisfies AnalysisWorkerOutput)

    self.postMessage({
      type: 'complete',
      notes,
      frames,
    } satisfies AnalysisWorkerOutput)
  } catch (err) {
    self.postMessage({
      type: 'error',
      error: err instanceof Error ? err.message : 'Analysis failed',
    } satisfies AnalysisWorkerOutput)
  }
}
