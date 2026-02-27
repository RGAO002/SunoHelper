import { useCallback, useRef } from 'react'
import { useStore } from '@/store'
import type { AnalysisWorkerOutput } from '@/workers/pitchAnalysis.worker'

/** Hook to run pitch analysis in a web worker after recording */
export function usePitchAnalysis() {
  const workerRef = useRef<Worker | null>(null)
  const setNotes = useStore((s) => s.setNotes)
  const setPitchFrames = useStore((s) => s.setPitchFrames)
  const setPhase = useStore((s) => s.setPhase)

  const analyze = useCallback(
    (audioBuffer: AudioBuffer) => {
      // Terminate previous worker if any
      workerRef.current?.terminate()

      const worker = new Worker(
        new URL(
          '../../../workers/pitchAnalysis.worker.ts',
          import.meta.url,
        ),
        { type: 'module' },
      )

      worker.onmessage = (e: MessageEvent<AnalysisWorkerOutput>) => {
        const msg = e.data
        console.log('[PitchAnalysis]', msg.type, {
          notes: msg.notes?.length,
          frames: msg.frames?.length,
          progress: msg.progress,
        })
        switch (msg.type) {
          case 'progress':
            if (msg.frames) setPitchFrames(msg.frames)
            break
          case 'complete':
            if (msg.notes) setNotes(msg.notes)
            if (msg.frames) setPitchFrames(msg.frames)
            setPhase('analyzed')
            // Defer termination to avoid "message port closed" errors
            // from any in-flight postMessage calls
            setTimeout(() => worker.terminate(), 100)
            break
          case 'error':
            console.error('[PitchAnalysis] Error:', msg.error)
            setPhase('idle')
            setTimeout(() => worker.terminate(), 100)
            break
        }
      }

      worker.onerror = (err) => {
        console.error('[PitchAnalysis] Worker crashed:', err)
        setPhase('idle')
      }

      // Transfer channel data (zero-copy)
      console.log('[PitchAnalysis] Starting analysis...', audioBuffer.length, 'samples,', audioBuffer.sampleRate, 'Hz')
      const channelData = new Float32Array(audioBuffer.getChannelData(0))
      worker.postMessage(
        { channelData, sampleRate: audioBuffer.sampleRate },
        [channelData.buffer],
      )

      workerRef.current = worker
    },
    [setNotes, setPitchFrames, setPhase],
  )

  return { analyze }
}
