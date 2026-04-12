import { AudioEngine } from './audio-engine';
import { Store } from './store';
import { STEP_COUNT, TRACK_COUNT } from './constants';

const SCHEDULE_AHEAD = 0.1;
const LOOKAHEAD_MS = 25;

type StepCallback = (step: number) => void;

export class Sequencer {
  private audioEngine: AudioEngine;
  private store: Store;
  private _isPlaying = false;
  private _currentStep = 0;
  private nextNoteTime = 0;
  private timerID = 0;
  private stepCallbacks: StepCallback[] = [];

  get isPlaying(): boolean {
    return this._isPlaying;
  }

  get currentStep(): number {
    return this._currentStep;
  }

  constructor(audioEngine: AudioEngine, store: Store) {
    this.audioEngine = audioEngine;
    this.store = store;
  }

  onStep(cb: StepCallback) {
    this.stepCallbacks.push(cb);
  }

  start() {
    if (this._isPlaying) return;
    this._isPlaying = true;
    this._currentStep = 0;
    this.nextNoteTime = this.audioEngine.currentTime + 0.05;
    this.schedule();
  }

  stop() {
    this._isPlaying = false;
    this._currentStep = 0;
    clearTimeout(this.timerID);
    this.notifyStep(-1);
  }

  toggle() {
    if (this._isPlaying) this.stop();
    else this.start();
  }

  private schedule() {
    const ct = this.audioEngine.currentTime;
    while (this.nextNoteTime < ct + SCHEDULE_AHEAD) {
      this.scheduleStep(this._currentStep, this.nextNoteTime);
      this.advance();
    }
    this.timerID = window.setTimeout(() => {
      if (this._isPlaying) this.schedule();
    }, LOOKAHEAD_MS);
  }

  private scheduleStep(step: number, time: number) {
    const state = this.store.getState();
    for (let track = 0; track < TRACK_COUNT; track++) {
      if (state.pattern[track][step]) {
        this.audioEngine.scheduleDrum(track, time);
      }
    }

    // Schedule UI update close to the actual play time
    const delayMs = Math.max(0, (time - this.audioEngine.currentTime) * 1000);
    setTimeout(() => {
      if (this._isPlaying) this.notifyStep(step);
    }, delayMs);
  }

  private advance() {
    const state = this.store.getState();
    const secPerBeat = 60.0 / state.tempo;
    const secPerStep = secPerBeat / 4; // 16th notes
    const swingAmt = state.swing / 100;
    const swingDelay = secPerStep * swingAmt * 0.7;

    let dur: number;
    if (this._currentStep % 2 === 0) {
      // Even -> odd: add swing delay (odd note comes later)
      dur = secPerStep + swingDelay;
    } else {
      // Odd -> even: compensate
      dur = Math.max(secPerStep * 0.15, secPerStep - swingDelay);
    }

    this.nextNoteTime += dur;
    this._currentStep = (this._currentStep + 1) % STEP_COUNT;
  }

  private notifyStep(step: number) {
    for (const cb of this.stepCallbacks) cb(step);
  }
}
