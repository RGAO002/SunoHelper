import { useCallback, useRef, useState } from 'react'
import { useStore } from '@/store'

export function RecordButton() {
  const phase = useStore((s) => s.phase)
  const setPhase = useStore((s) => s.setPhase)
  const setAudioBuffer = useStore((s) => s.setAudioBuffer)
  const setAudioUrl = useStore((s) => s.setAudioUrl)
  const resetAudio = useStore((s) => s.resetAudio)
  const resetPitchData = useStore((s) => s.resetPitchData)
  const resetCorrection = useStore((s) => s.resetCorrection)
  const resetEditor = useStore((s) => s.resetEditor)
  const resetTransport = useStore((s) => s.resetTransport)
  const resetHistory = useStore((s) => s.resetHistory)

  const [error, setError] = useState<string | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const audioContextRef = useRef<AudioContext | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const startRecording = useCallback(async () => {
    try {
      setError(null)

      // Clear ALL previous state before starting a new recording
      resetTransport()
      resetPitchData()
      resetCorrection()
      resetHistory()
      resetAudio()
      resetEditor() // also resets phase → 'idle', viewport, selections

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      })

      streamRef.current = stream
      audioContextRef.current = new AudioContext({ sampleRate: 44100 })

      // Find supported mimeType
      const mimeType = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus']
        .find((t) => MediaRecorder.isTypeSupported(t)) || ''

      const mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
      chunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      mediaRecorder.start(100)
      mediaRecorderRef.current = mediaRecorder
      setPhase('recording')
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to access microphone',
      )
    }
  }, [setPhase, resetAudio, resetPitchData, resetCorrection, resetEditor, resetTransport, resetHistory])

  const stopRecording = useCallback(async () => {
    const recorder = mediaRecorderRef.current
    const ctx = audioContextRef.current
    if (!recorder || !ctx) return

    return new Promise<void>((resolve) => {
      recorder.onstop = async () => {
        // Stop all tracks
        streamRef.current?.getTracks().forEach((t) => t.stop())

        const blob = new Blob(chunksRef.current, { type: recorder.mimeType })
        const url = URL.createObjectURL(blob)
        setAudioUrl(url)

        try {
          const arrayBuffer = await blob.arrayBuffer()
          const audioBuffer = await ctx.decodeAudioData(arrayBuffer)
          setAudioBuffer(audioBuffer)
          setPhase('analyzing')
        } catch (err) {
          setError('Failed to decode audio')
          setPhase('idle')
        }
        resolve()
      }
      recorder.stop()
    })
  }, [setAudioBuffer, setAudioUrl, setPhase])

  const isRecording = phase === 'recording'

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        onClick={isRecording ? stopRecording : startRecording}
        className="group relative flex h-20 w-20 items-center justify-center rounded-full transition-all duration-200"
        style={{
          backgroundColor: isRecording ? '#ef4444' : '#27272a',
          border: `3px solid ${isRecording ? '#ef4444' : '#3f3f46'}`,
        }}
      >
        {/* Pulsing ring when recording */}
        {isRecording && (
          <span className="absolute inset-0 animate-ping rounded-full bg-red-500 opacity-20" />
        )}

        {/* Icon */}
        <span
          className="relative z-10 block transition-all duration-200"
          style={{
            width: isRecording ? 24 : 28,
            height: isRecording ? 24 : 28,
            borderRadius: isRecording ? 4 : 999,
            backgroundColor: isRecording ? '#fff' : '#ef4444',
          }}
        />
      </button>

      <span className="text-sm text-zinc-400">
        {isRecording ? 'Recording... Click to stop' : 'Click to record'}
      </span>

      {error && (
        <span className="text-sm text-red-400">{error}</span>
      )}
    </div>
  )
}
