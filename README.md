# Neon Pulse Drum Machine

A futuristic PWA drum machine with step sequencer, built with TypeScript, Vite, and Web Audio API.

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Production Build

```bash
npm run build
npm run preview
```

## Features

- **8 Drum Pads** — Kick, Snare, Clap, Closed Hat, Open Hat, Tom, Rim, Crash
- **16-Step Sequencer** — Pattern editor with per-track step toggling
- **Transport Controls** — Play, Stop, Clear, BPM (40–300), Swing (0–100%)
- **Preset Patterns** — Four on the Floor, Hip Hop, Electro, Breakbeat
- **Mixer** — Per-track volume and mute, master volume
- **Keyboard Support** — A S D F J K L ; for pads, Space for play/stop
- **Vibration Feedback** — Haptic response on supported devices
- **State Persistence** — Auto-saves tempo, pattern, volumes to localStorage
- **PWA** — Installable, works offline
- **Responsive** — Mobile-first, works on phones, tablets, and desktop

## Sound Engine

All drum sounds are synthesized in real-time using the Web Audio API — no samples needed.
The sequencer uses a look-ahead scheduling technique for timing stability.

## Tech Stack

- TypeScript
- Vite
- vite-plugin-pwa (Workbox)
- Web Audio API
- CSS (no framework)

## Project Structure

```
src/
  main.ts              Entry point
  app.ts               App controller, wires all components
  audio-engine.ts      AudioContext management, gain routing
  drum-synth.ts        Web Audio synthesis for each drum type
  sequencer.ts         Step sequencer with look-ahead scheduling
  store.ts             State management + localStorage persistence
  presets.ts           Built-in rhythm patterns
  constants.ts         Shared types, track definitions, key mappings
  pads.ts              Drum pad UI component
  transport.ts         Transport controls UI
  sequencer-grid.ts    Step sequencer grid UI
  mixer.ts             Mixer panel UI
  style.css            All styles
```

## Future Extensions

- Pattern save/load slots
- Audio recording / export
- Effects (reverb, delay, distortion)
- Multi-touch gestures
- Sample import / replacement
- MIDI input/output
- 32/64 step patterns
- Pattern chaining
- Swing per-track
- Velocity per-step
