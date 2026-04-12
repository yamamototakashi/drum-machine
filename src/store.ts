import { DrumMachineState, createDefaultState, TRACK_COUNT, STEP_COUNT } from './constants';
import { PRESETS } from './presets';

const STORAGE_KEY = 'neon-pulse-state';

type Listener = () => void;

export class Store {
  private state: DrumMachineState;
  private listeners: Set<Listener> = new Set();

  constructor() {
    this.state = this.load();
  }

  getState(): Readonly<DrumMachineState> {
    return this.state;
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((l) => l());
    this.save();
  }

  setTempo(tempo: number) {
    this.state.tempo = Math.max(40, Math.min(300, Math.round(tempo)));
    this.notify();
  }

  setSwing(swing: number) {
    this.state.swing = Math.max(0, Math.min(100, Math.round(swing)));
    this.notify();
  }

  setMasterVolume(vol: number) {
    this.state.masterVolume = Math.max(0, Math.min(1, vol));
    this.notify();
  }

  setTrackVolume(track: number, vol: number) {
    this.state.trackVolumes[track] = Math.max(0, Math.min(1, vol));
    this.notify();
  }

  toggleTrackMute(track: number) {
    this.state.trackMutes[track] = !this.state.trackMutes[track];
    this.notify();
  }

  toggleStep(track: number, step: number) {
    this.state.pattern[track][step] = !this.state.pattern[track][step];
    this.notify();
  }

  loadPreset(presetId: string) {
    const preset = PRESETS.find((p) => p.id === presetId);
    if (preset) {
      this.state.pattern = preset.pattern.map((row) => [...row]);
      this.state.currentPreset = presetId;
      this.notify();
    }
  }

  clearPattern() {
    this.state.pattern = Array.from({ length: TRACK_COUNT }, () =>
      new Array(STEP_COUNT).fill(false),
    );
    this.state.currentPreset = 'empty';
    this.notify();
  }

  private save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch {
      /* storage unavailable */
    }
  }

  private load(): DrumMachineState {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const d = JSON.parse(raw);
        const def = createDefaultState();
        return {
          tempo: typeof d.tempo === 'number' ? d.tempo : def.tempo,
          swing: typeof d.swing === 'number' ? d.swing : def.swing,
          masterVolume: typeof d.masterVolume === 'number' ? d.masterVolume : def.masterVolume,
          trackVolumes:
            Array.isArray(d.trackVolumes) && d.trackVolumes.length === TRACK_COUNT
              ? d.trackVolumes
              : [...def.trackVolumes],
          trackMutes:
            Array.isArray(d.trackMutes) && d.trackMutes.length === TRACK_COUNT
              ? d.trackMutes
              : [...def.trackMutes],
          pattern:
            Array.isArray(d.pattern) &&
            d.pattern.length === TRACK_COUNT &&
            d.pattern.every(
              (r: unknown) => Array.isArray(r) && (r as unknown[]).length === STEP_COUNT,
            )
              ? d.pattern
              : def.pattern,
          currentPreset: typeof d.currentPreset === 'string' ? d.currentPreset : def.currentPreset,
        };
      }
    } catch {
      /* parse error */
    }
    return createDefaultState();
  }
}
