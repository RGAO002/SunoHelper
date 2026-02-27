/**
 * AudioRecorder manages the MediaRecorder + AnalyserNode setup.
 * The RecordButton component currently handles recording inline,
 * but this class can be used for a more structured approach.
 */
export class AudioRecorder {
  private audioContext: AudioContext | null = null
  private mediaRecorder: MediaRecorder | null = null
  private stream: MediaStream | null = null
  private chunks: Blob[] = []
  analyser: AnalyserNode | null = null

  async start(): Promise<AnalyserNode> {
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
      },
    })

    this.audioContext = new AudioContext({ sampleRate: 44100 })
    const source = this.audioContext.createMediaStreamSource(this.stream)

    // AnalyserNode for real-time visualization (not connected to output to avoid feedback)
    this.analyser = this.audioContext.createAnalyser()
    this.analyser.fftSize = 2048
    source.connect(this.analyser)

    // MediaRecorder for capturing audio data
    const mimeType = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus']
      .find((t) => MediaRecorder.isTypeSupported(t)) || ''

    this.mediaRecorder = new MediaRecorder(
      this.stream,
      mimeType ? { mimeType } : undefined,
    )
    this.chunks = []
    this.mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) this.chunks.push(e.data)
    }
    this.mediaRecorder.start(100)

    return this.analyser
  }

  async stop(): Promise<AudioBuffer> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder || !this.audioContext) {
        reject(new Error('Not recording'))
        return
      }

      this.mediaRecorder.onstop = async () => {
        this.stream?.getTracks().forEach((t) => t.stop())

        const blob = new Blob(this.chunks, {
          type: this.mediaRecorder!.mimeType,
        })
        try {
          const arrayBuffer = await blob.arrayBuffer()
          const audioBuffer =
            await this.audioContext!.decodeAudioData(arrayBuffer)
          resolve(audioBuffer)
        } catch (err) {
          reject(err)
        }
      }

      this.mediaRecorder.stop()
    })
  }

  dispose(): void {
    this.stream?.getTracks().forEach((t) => t.stop())
    this.audioContext?.close()
    this.analyser = null
    this.mediaRecorder = null
    this.stream = null
  }
}
