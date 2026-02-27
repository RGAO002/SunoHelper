declare module 'soundtouchjs' {
  export class SoundTouch {
    rate: number
    tempo: number
    pitch: number
    pitchSemitones: number
    pitchOctaves: number
  }

  export class SimpleFilter {
    constructor(
      source: { extract: (target: Float32Array, numFrames: number, position: number) => number },
      pipe: SoundTouch,
      callback?: () => void,
    )
    extract(target: Float32Array, numFrames?: number): number
    position: number
  }

  export class PitchShifter {
    constructor(audioContext: AudioContext, audioBuffer: AudioBuffer, bufferSize: number, onEnd?: () => void)
    pitch: number
    pitchSemitones: number
    tempo: number
    rate: number
    timePlayed: number
    percentagePlayed: number
    duration: number
    node: ScriptProcessorNode
    connect(toNode: AudioNode): void
    disconnect(): void
    on(eventName: string, callback: (detail: { timePlayed: number; percentagePlayed: number }) => void): void
    off(eventName?: string): void
  }

  export class WebAudioBufferSource {
    constructor(audioBuffer: AudioBuffer)
    position: number
    extract(target: Float32Array, numFrames: number): number
  }

  export function getWebAudioNode(audioContext: AudioContext, filter: SimpleFilter, sourcePostion?: () => void): ScriptProcessorNode
}
