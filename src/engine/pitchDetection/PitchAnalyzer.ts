import { PitchDetector } from 'pitchy'
import type { PitchFrame } from '@/types/pitch'
import { calculateRMS } from '@/utils/audioBufferUtils'
import { ANALYSIS_CONFIG } from '@/constants/music'

export class PitchAnalyzer {
  private readonly windowSize: number
  private readonly hopSize: number
  private readonly clarityThreshold: number
  private readonly minFrequency: number
  private readonly maxFrequency: number

  constructor(config = ANALYSIS_CONFIG) {
    this.windowSize = config.windowSize
    this.hopSize = config.hopSize
    this.clarityThreshold = config.clarityThreshold
    this.minFrequency = config.minFrequency
    this.maxFrequency = config.maxFrequency
  }

  analyze(channelData: Float32Array, sampleRate: number): PitchFrame[] {
    const detector = PitchDetector.forFloat32Array(this.windowSize)
    const frames: PitchFrame[] = []
    const windowBuffer = new Float32Array(this.windowSize)

    for (
      let offset = 0;
      offset + this.windowSize <= channelData.length;
      offset += this.hopSize
    ) {
      // Copy samples into analysis window
      windowBuffer.set(
        channelData.subarray(offset, offset + this.windowSize),
      )

      // Calculate RMS on original (non-windowed) data for amplitude envelope
      const rms = calculateRMS(windowBuffer)

      // Detect pitch — pitchy applies its own autocorrelation window internally,
      // so we do NOT apply a Hann window here (causes double-windowing artifacts
      // that produce phantom ~21 Hz detections in ~50% of frames)
      const [frequency, clarity] = detector.findPitch(
        windowBuffer,
        sampleRate,
      )
      const timeSeconds = (offset + this.windowSize / 2) / sampleRate

      // Only accept frames with high clarity and reasonable frequency
      const isPitched =
        clarity >= this.clarityThreshold &&
        frequency >= this.minFrequency &&
        frequency <= this.maxFrequency

      frames.push({
        timeSeconds,
        frequencyHz: isPitched ? frequency : 0,
        clarity: isPitched ? clarity : 0,
        rmsAmplitude: rms,
      })
    }

    return frames
  }
}
