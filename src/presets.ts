import { STEP_COUNT, TRACK_COUNT, DrumType } from './constants';

export interface PresetPattern {
  name: string;
  id: string;
  pattern: boolean[][];
}

function p(data: Record<number, number[]>): boolean[][] {
  const pattern = Array.from({ length: TRACK_COUNT }, () =>
    new Array(STEP_COUNT).fill(false),
  );
  for (const [track, steps] of Object.entries(data)) {
    for (const s of steps) pattern[Number(track)][s] = true;
  }
  return pattern;
}

export const PRESETS: PresetPattern[] = [
  {
    name: 'Empty',
    id: 'empty',
    pattern: p({}),
  },
  {
    name: 'Four on the Floor',
    id: 'four-floor',
    pattern: p({
      [DrumType.Kick]:      [0, 4, 8, 12],
      [DrumType.Snare]:     [4, 12],
      [DrumType.ClosedHat]: [0, 2, 4, 6, 8, 10, 12, 14],
      [DrumType.OpenHat]:   [6, 14],
    }),
  },
  {
    name: 'Hip Hop',
    id: 'hip-hop',
    pattern: p({
      [DrumType.Kick]:      [0, 3, 7, 10],
      [DrumType.Snare]:     [4, 12],
      [DrumType.Clap]:      [4, 12],
      [DrumType.ClosedHat]: [0, 2, 4, 6, 8, 10, 12, 14],
      [DrumType.OpenHat]:   [14],
    }),
  },
  {
    name: 'Electro',
    id: 'electro',
    pattern: p({
      [DrumType.Kick]:      [0, 1, 4, 8, 9, 12],
      [DrumType.Snare]:     [4, 12],
      [DrumType.Clap]:      [4, 12],
      [DrumType.ClosedHat]: [0, 2, 4, 6, 8, 10, 12, 14],
      [DrumType.Tom]:       [6, 7, 14, 15],
      [DrumType.Rim]:       [2, 10],
    }),
  },
  {
    name: 'Breakbeat',
    id: 'breakbeat',
    pattern: p({
      [DrumType.Kick]:      [0, 4, 9, 10],
      [DrumType.Snare]:     [4, 12],
      [DrumType.ClosedHat]: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
      [DrumType.OpenHat]:   [7, 15],
      [DrumType.Crash]:     [0],
      [DrumType.Rim]:       [2, 6, 14],
    }),
  },
];
