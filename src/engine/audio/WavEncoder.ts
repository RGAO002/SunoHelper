/**
 * WavEncoder — hand-written WAV file encoder.
 * Writes a proper RIFF/WAV header at the byte level.
 *
 * This demonstrates low-level audio engineering knowledge:
 * - RIFF container format
 * - PCM audio encoding (16-bit signed integer)
 * - Byte-level buffer manipulation
 */
export function encodeWav(
  audioBuffer: AudioBuffer,
  bitDepth: 16 | 32 = 16,
): ArrayBuffer {
  const numChannels = 1 // Mono output
  const sampleRate = audioBuffer.sampleRate
  const channelData = audioBuffer.getChannelData(0)
  const numSamples = channelData.length
  const bytesPerSample = bitDepth / 8
  const blockAlign = numChannels * bytesPerSample

  // Total file size = 44 bytes header + data
  const dataSize = numSamples * blockAlign
  const fileSize = 44 + dataSize

  const buffer = new ArrayBuffer(fileSize)
  const view = new DataView(buffer)

  let offset = 0

  // --- RIFF Header ---
  // "RIFF" chunk descriptor
  writeString(view, offset, 'RIFF')
  offset += 4
  view.setUint32(offset, fileSize - 8, true) // File size - 8
  offset += 4
  writeString(view, offset, 'WAVE')
  offset += 4

  // --- fmt sub-chunk ---
  writeString(view, offset, 'fmt ')
  offset += 4
  view.setUint32(offset, 16, true) // Sub-chunk size (16 for PCM)
  offset += 4
  view.setUint16(offset, bitDepth === 32 ? 3 : 1, true) // Audio format: 1=PCM, 3=IEEE float
  offset += 2
  view.setUint16(offset, numChannels, true) // Num channels
  offset += 2
  view.setUint32(offset, sampleRate, true) // Sample rate
  offset += 4
  view.setUint32(offset, sampleRate * blockAlign, true) // Byte rate
  offset += 4
  view.setUint16(offset, blockAlign, true) // Block align
  offset += 2
  view.setUint16(offset, bitDepth, true) // Bits per sample
  offset += 2

  // --- data sub-chunk ---
  writeString(view, offset, 'data')
  offset += 4
  view.setUint32(offset, dataSize, true) // Data size
  offset += 4

  // --- Write audio samples ---
  if (bitDepth === 16) {
    for (let i = 0; i < numSamples; i++) {
      // Clamp to [-1, 1] then scale to 16-bit signed integer range
      const sample = Math.max(-1, Math.min(1, channelData[i]))
      const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7fff
      view.setInt16(offset, intSample, true)
      offset += 2
    }
  } else {
    // 32-bit IEEE float
    for (let i = 0; i < numSamples; i++) {
      view.setFloat32(offset, channelData[i], true)
      offset += 4
    }
  }

  return buffer
}

/** Write an ASCII string to a DataView */
function writeString(view: DataView, offset: number, str: string): void {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i))
  }
}

/** Create a downloadable blob URL from an AudioBuffer */
export function audioBufferToWavBlob(audioBuffer: AudioBuffer): Blob {
  const wavData = encodeWav(audioBuffer)
  return new Blob([wavData], { type: 'audio/wav' })
}

/** Trigger a file download */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
