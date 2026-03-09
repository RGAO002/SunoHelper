# Suno Helper

**Pitch correction in the browser — clean up your musical ideas for Suno.**  
No backend, no install. Record or import audio, edit pitch visually, and export corrected WAV or MIDI.

---

## Features

- **Record / Import / Demo**
  - Record from the microphone or import local files (WAV, MP3, FLAC, OGG, M4A, etc.)
  - “Try Demo” loads sample audio so you can try it without a mic

- **Pitch detection**
  - Real-time pitch detection using the McLeod Pitch Method ([pitchy](https://github.com/nicklockwood/pitchy))
  - Automatic note segmentation (NoteSegmenter) shown as draggable note blobs on the canvas

- **Visual pitch editor**
  - Time–pitch grid, pitch contour, draggable note blobs
  - Multi-select, zoom, and pan

- **Pitch correction**
  - **Auto-correct**: Snap to nearest semitone or to a scale (major, minor, pentatonic, blues, etc.)
  - **Manual**: Drag note blobs or nudge with the keyboard
  - Scale selector (ScaleSelector) and auto-correct strength slider (AutoCorrectSlider)

- **Export**
  - **WAV (Original)**: Uncorrected recording
  - **WAV (Corrected)**: Pitch-corrected audio, ready for Suno
  - **MIDI**: Export current note data as a MIDI file

- **Undo / Redo**  
  Full edit history with Ctrl/Cmd+Z and Ctrl/Cmd+Shift+Z.

---

## Tech stack

| Layer        | Tech |
|-------------|------|
| Frontend    | React 19, TypeScript, Vite |
| State       | Zustand |
| Styles      | Tailwind CSS 4 |
| Audio       | Web Audio API, SoundTouch.js (time-stretch/pitch), pitchy (pitch detection), web-audio-beat-detector |
| Editor/Export | Canvas 2D, midi-writer-js, custom WAV encoding |

---

## Project structure (overview)

```
src/
├── App.tsx                 # Main UI: record/import/demo, controls, pitch editor, export
├── components/
│   ├── Recorder/           # Record button, file importer
│   ├── PitchEditor/        # Pitch editor (grid, contour, blobs, interaction, playhead)
│   ├── Controls/           # TransportBar, ScaleSelector, AutoCorrectSlider
│   └── Export/             # ExportPanel (WAV / MIDI)
├── engine/
│   ├── audio/              # AudioRecorder, AudioPlayer, WavEncoder, MidiExporter, DemoGenerator
│   ├── pitchDetection/     # PitchAnalyzer, NoteSegmenter, PitchQuantizer
│   └── pitchCorrection/    # CorrectionEngine, SegmentShifter
├── store/                  # Zustand slices (audio, pitchData, correction, editor, transport, history)
├── types/                  # Types for pitch, correction, editor, etc.
├── utils/                  # Note helpers, audio buffer utils
└── constants/              # Music constants (note names, scales, analysis config)
```

---

## Getting started

```bash
# Install dependencies
npm install

# Dev server (default http://localhost:5173)
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

---

## Workflow

1. **Input**: Record, choose a file, or click “Try Demo” to load sample audio.
2. **Analysis**: The app runs pitch detection and segmentation, then shows the pitch editor.
3. **Edit**: Pick a scale and auto-correct strength in the control bar; drag note blobs or use keyboard shortcuts to fine-tune.
4. **Export**: Use the export panel to download WAV (Original), WAV (Corrected), or MIDI.

---

## Keyboard shortcuts

| Key | Action |
|-----|--------|
| `Space` | Play / Pause |
| `Ctrl/Cmd + Z` | Undo |
| `Ctrl/Cmd + Shift + Z` | Redo |
| `Delete` / `Backspace` | Reset selected notes to detected pitch |
| `↑` / `↓` | Nudge selected notes ±1 semitone |
| `Shift + ↑` / `Shift + ↓` | Nudge selected notes ±1 octave |

---

## Notes

- All processing runs in the browser; audio and project data are not sent to any server.
- Export filenames: `sunoprep-{original|corrected}-{timestamp}.wav` or `sunoprep-{timestamp}.mid`.
- For [Suno](https://suno.com), correct pitch here and export WAV for cleaner, more controllable vocal or melody material.

---

## License

Private project. See repository for details.
