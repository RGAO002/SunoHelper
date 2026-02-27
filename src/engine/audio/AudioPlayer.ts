/**
 * AudioPlayer — plays an AudioBuffer with position tracking.
 * Supports play, pause, stop, and seeking.
 * Reports current time via a callback at ~60fps using requestAnimationFrame.
 */
export class AudioPlayer {
  private audioContext: AudioContext | null = null
  private sourceNode: AudioBufferSourceNode | null = null
  private gainNode: GainNode | null = null
  private buffer: AudioBuffer | null = null
  private startedAt = 0 // audioContext.currentTime when playback started
  private pausedAt = 0 // offset in seconds where we paused
  private rafId: number | null = null
  private onTimeUpdate: ((time: number) => void) | null = null
  private onEnded: (() => void) | null = null
  private _isPlaying = false

  get isPlaying() {
    return this._isPlaying
  }

  async init() {
    if (!this.audioContext) {
      this.audioContext = new AudioContext({ sampleRate: 44100 })
    }
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume()
    }
  }

  setBuffer(buffer: AudioBuffer) {
    this.buffer = buffer
  }

  setOnTimeUpdate(cb: (time: number) => void) {
    this.onTimeUpdate = cb
  }

  setOnEnded(cb: () => void) {
    this.onEnded = cb
  }

  async play(offset = this.pausedAt) {
    await this.init()
    if (!this.audioContext || !this.buffer) return

    this.stop(false)

    this.sourceNode = this.audioContext.createBufferSource()
    this.sourceNode.buffer = this.buffer

    this.gainNode = this.audioContext.createGain()
    this.sourceNode.connect(this.gainNode)
    this.gainNode.connect(this.audioContext.destination)

    this.sourceNode.onended = () => {
      if (this._isPlaying) {
        this._isPlaying = false
        this.pausedAt = 0
        this.cancelRAF()
        this.onEnded?.()
      }
    }

    this.startedAt = this.audioContext.currentTime - offset
    this.sourceNode.start(0, offset)
    this._isPlaying = true
    this.startRAF()
  }

  pause() {
    if (!this._isPlaying || !this.audioContext) return
    this.pausedAt = this.audioContext.currentTime - this.startedAt
    this.stopSource()
    this._isPlaying = false
    this.cancelRAF()
  }

  stop(reset = true) {
    this.stopSource()
    this._isPlaying = false
    this.cancelRAF()
    if (reset) {
      this.pausedAt = 0
      this.onTimeUpdate?.(0)
    }
  }

  seek(time: number) {
    this.pausedAt = time
    if (this._isPlaying) {
      this.play(time)
    } else {
      this.onTimeUpdate?.(time)
    }
  }

  getCurrentTime(): number {
    if (!this.audioContext || !this._isPlaying) return this.pausedAt
    return this.audioContext.currentTime - this.startedAt
  }

  setVolume(volume: number) {
    if (this.gainNode) {
      this.gainNode.gain.value = Math.max(0, Math.min(1, volume))
    }
  }

  destroy() {
    this.stop()
    this.audioContext?.close()
    this.audioContext = null
  }

  private stopSource() {
    try {
      this.sourceNode?.stop()
    } catch {
      // Already stopped
    }
    this.sourceNode?.disconnect()
    this.sourceNode = null
  }

  private startRAF() {
    const tick = () => {
      if (!this._isPlaying || !this.audioContext) return
      const time = this.audioContext.currentTime - this.startedAt
      this.onTimeUpdate?.(time)
      this.rafId = requestAnimationFrame(tick)
    }
    this.rafId = requestAnimationFrame(tick)
  }

  private cancelRAF() {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
  }
}
