/**
 * DemoGenerator — generates a synthetic humming audio for demo mode.
 * Simulates a human voice singing a simple melody with vibrato and amplitude variation.
 * This allows the app to be demonstrated without a microphone.
 */

interface NoteSpec {
  midi: number
  duration: number // seconds
  velocity: number // 0-1
}

// A simple melody: "Twinkle Twinkle Little Star" first phrase
const DEMO_MELODY: NoteSpec[] = [
  { midi: 60, duration: 0.5, velocity: 0.7 },  // C4
  { midi: 60, duration: 0.5, velocity: 0.7 },  // C4
  { midi: 67, duration: 0.5, velocity: 0.8 },  // G4
  { midi: 67, duration: 0.5, velocity: 0.8 },  // G4
  { midi: 69, duration: 0.5, velocity: 0.85 }, // A4
  { midi: 69, duration: 0.5, velocity: 0.85 }, // A4
  { midi: 67, duration: 1.0, velocity: 0.7 },  // G4 (hold)
  // Short pause
  { midi: 0, duration: 0.3, velocity: 0 },      // rest
  { midi: 65, duration: 0.5, velocity: 0.75 }, // F4
  { midi: 65, duration: 0.5, velocity: 0.75 }, // F4
  { midi: 64, duration: 0.5, velocity: 0.7 },  // E4
  { midi: 64, duration: 0.5, velocity: 0.7 },  // E4
  { midi: 62, duration: 0.5, velocity: 0.65 }, // D4
  { midi: 62, duration: 0.5, velocity: 0.65 }, // D4
  { midi: 60, duration: 1.0, velocity: 0.6 },  // C4 (hold)
]

/**
 * Generate a demo AudioBuffer with synthetic humming.
 * The synthesis uses:
 * - Sine + harmonics (simulates vocal timbre)
 * - Vibrato (±0.3 semitone, ~5.5Hz — natural singing vibrato)
 * - Amplitude envelope with attack/release
 * - Slight pitch imperfection (makes it realistic for pitch detection)
 */
export function generateDemoAudio(sampleRate = 44100): AudioBuffer {
  const gapDuration = 0.05 // 50ms silence gap between notes for clear segmentation

  let totalDuration = 0
  for (let i = 0; i < DEMO_MELODY.length; i++) {
    totalDuration += DEMO_MELODY[i].duration
    // Account for inter-note gaps (between consecutive pitched notes)
    const next = DEMO_MELODY[i + 1]
    if (next && DEMO_MELODY[i].midi !== 0 && next.midi !== 0) {
      totalDuration += gapDuration
    }
  }

  const numSamples = Math.ceil(totalDuration * sampleRate)
  const offlineCtx = new OfflineAudioContext(1, numSamples, sampleRate)
  const buffer = offlineCtx.createBuffer(1, numSamples, sampleRate)
  const data = buffer.getChannelData(0)

  // Insert silence gap between notes so pitch detection can segment them
  const gapSamples = Math.floor(gapDuration * sampleRate)
  let currentSample = 0
  let phase = 0

  for (let noteIdx = 0; noteIdx < DEMO_MELODY.length; noteIdx++) {
    const note = DEMO_MELODY[noteIdx]
    const noteSamples = Math.ceil(note.duration * sampleRate)

    if (note.midi === 0) {
      // Rest: silence with tiny noise
      for (let i = 0; i < noteSamples && currentSample + i < numSamples; i++) {
        data[currentSample + i] = (Math.random() - 0.5) * 0.001
      }
      currentSample += noteSamples
      continue
    }

    const baseFreq = 440 * Math.pow(2, (note.midi - 69) / 12)

    // Add slight pitch imperfection (±15 cents) to make it realistic
    const pitchOffset = (Math.random() - 0.5) * 0.3 // ±15 cents in semitones
    const actualFreq = baseFreq * Math.pow(2, pitchOffset / 12)

    // Sharper attack/release so notes are more distinct
    const attackSamples = Math.min(Math.floor(0.015 * sampleRate), noteSamples / 4)
    const releaseSamples = Math.min(Math.floor(0.025 * sampleRate), noteSamples / 4)

    for (let i = 0; i < noteSamples && currentSample + i < numSamples; i++) {
      const t = i / sampleRate

      // Vibrato: ~5.5Hz, ±0.3 semitone (deterministic, not random per-sample)
      const vibratoDepth = 0.003 * Math.sin(2 * Math.PI * 5.5 * t)
      const freq = actualFreq * (1 + vibratoDepth)

      // Phase accumulation for smooth frequency changes
      phase += (2 * Math.PI * freq) / sampleRate

      // Strong fundamental-dominant timbre for reliable pitch detection
      let sample =
        Math.sin(phase) * 0.7 +           // fundamental (dominant)
        Math.sin(phase * 2) * 0.12 +       // 2nd harmonic
        Math.sin(phase * 3) * 0.06 +       // 3rd harmonic
        Math.sin(phase * 4) * 0.03         // 4th harmonic

      // Minimal noise (too much confuses pitch detection)
      sample += (Math.random() - 0.5) * 0.005

      // Amplitude envelope
      let envelope = note.velocity
      if (i < attackSamples) {
        envelope *= i / attackSamples // Attack
      } else if (i > noteSamples - releaseSamples) {
        envelope *= (noteSamples - i) / releaseSamples // Release
      }

      // Slight amplitude variation (shimmer)
      envelope *= 1 + Math.sin(2 * Math.PI * 4.2 * t) * 0.05

      data[currentSample + i] = sample * envelope * 0.5 // Master gain
    }

    currentSample += noteSamples

    // Add tiny silence gap between consecutive pitched notes (not before rest, not at end)
    const nextNote = DEMO_MELODY[noteIdx + 1]
    if (nextNote && nextNote.midi !== 0 && currentSample + gapSamples < numSamples) {
      for (let i = 0; i < gapSamples; i++) {
        data[currentSample + i] = (Math.random() - 0.5) * 0.0005
      }
      currentSample += gapSamples
    }
  }

  return buffer
}
