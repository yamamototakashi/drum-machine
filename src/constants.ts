export const TRACK_COUNT = 8;
export const STEP_COUNT = 16;

export const enum DrumType {
  Kick = 0,
  Snare = 1,
  Clap = 2,
  ClosedHat = 3,
  OpenHat = 4,
  Tom = 5,
  Rim = 6,
  Crash = 7,
}

export interface TrackInfo {
  type: DrumType;
  name: string;
  shortName: string;
  color: string;
  gradFrom: string;
  gradTo: string;
  key: string;
  keyLabel: string;
}

export const TRACKS: TrackInfo[] = [
  { type: DrumType.Kick,      name: 'KICK',       shortName: 'KK', color: '#ff6644', gradFrom: '#ff8844', gradTo: '#cc3311', key: 'a', keyLabel: 'A' },
  { type: DrumType.Snare,     name: 'SNARE',      shortName: 'SN', color: '#ffaa22', gradFrom: '#ffcc44', gradTo: '#dd8800', key: 's', keyLabel: 'S' },
  { type: DrumType.Clap,      name: 'CLAP',       shortName: 'CL', color: '#ff44aa', gradFrom: '#ff66cc', gradTo: '#cc1188', key: 'd', keyLabel: 'D' },
  { type: DrumType.ClosedHat, name: 'HI-HAT',     shortName: 'CH', color: '#00ddff', gradFrom: '#44eeff', gradTo: '#0099cc', key: 'f', keyLabel: 'F' },
  { type: DrumType.OpenHat,   name: 'OPEN HH',    shortName: 'OH', color: '#22aaff', gradFrom: '#44bbff', gradTo: '#0077dd', key: 'j', keyLabel: 'J' },
  { type: DrumType.Tom,       name: 'TOM',        shortName: 'TM', color: '#aa55ff', gradFrom: '#cc77ff', gradTo: '#7722dd', key: 'k', keyLabel: 'K' },
  { type: DrumType.Rim,       name: 'RIM',        shortName: 'RM', color: '#00ee88', gradFrom: '#44ff99', gradTo: '#00aa55', key: 'l', keyLabel: 'L' },
  { type: DrumType.Crash,     name: 'CRASH',      shortName: 'CR', color: '#eedd22', gradFrom: '#ffee55', gradTo: '#bbaa00', key: ';', keyLabel: ';' },
];

export const KEY_TO_TRACK: Record<string, number> = {};
TRACKS.forEach((t, i) => { KEY_TO_TRACK[t.key] = i; });

export interface DrumMachineState {
  tempo: number;
  swing: number;
  masterVolume: number;
  trackVolumes: number[];
  trackMutes: boolean[];
  pattern: boolean[][];
  currentPreset: string;
}

export function createDefaultState(): DrumMachineState {
  return {
    tempo: 120,
    swing: 0,
    masterVolume: 0.8,
    trackVolumes: new Array(TRACK_COUNT).fill(0.8),
    trackMutes: new Array(TRACK_COUNT).fill(false),
    pattern: Array.from({ length: TRACK_COUNT }, () => new Array(STEP_COUNT).fill(false)),
    currentPreset: 'empty',
  };
}
