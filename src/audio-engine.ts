import { TRACK_COUNT } from './constants';
import { synthesizeDrum } from './drum-synth';

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private trackGains: GainNode[] = [];
  private trackVolumes: number[] = new Array(TRACK_COUNT).fill(0.8);
  private trackMuted: boolean[] = new Array(TRACK_COUNT).fill(false);
  private _unlocked = false;
  private _initialized = false;
  private _initCallbacks: (() => void)[] = [];

  get currentTime(): number {
    return this.ctx?.currentTime ?? 0;
  }

  get isReady(): boolean {
    return this._unlocked && this.ctx?.state === 'running';
  }

  onInit(cb: () => void) {
    if (this._initialized) cb();
    else this._initCallbacks.push(cb);
  }

  async ensureContext(): Promise<AudioContext> {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.masterGain.connect(this.ctx.destination);

      this.trackGains = [];
      for (let i = 0; i < TRACK_COUNT; i++) {
        const g = this.ctx.createGain();
        g.connect(this.masterGain);
        this.trackGains.push(g);
      }
    }

    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }

    if (!this._unlocked) {
      const buf = this.ctx.createBuffer(1, 1, this.ctx.sampleRate);
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      src.connect(this.ctx.destination);
      src.start(0);
      this._unlocked = true;
    }

    if (!this._initialized) {
      this._initialized = true;
      this._initCallbacks.forEach(cb => cb());
      this._initCallbacks = [];
    }

    return this.ctx;
  }

  setMasterVolume(value: number) {
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(Math.max(0, Math.min(1, value)), this.ctx.currentTime);
    }
  }

  setTrackVolume(track: number, value: number) {
    this.trackVolumes[track] = value;
    if (this.trackGains[track] && this.ctx && !this.trackMuted[track]) {
      this.trackGains[track].gain.setValueAtTime(value, this.ctx.currentTime);
    }
  }

  setTrackMute(track: number, muted: boolean) {
    this.trackMuted[track] = muted;
    if (this.trackGains[track] && this.ctx) {
      const vol = muted ? 0 : this.trackVolumes[track];
      this.trackGains[track].gain.setValueAtTime(vol, this.ctx.currentTime);
    }
  }

  playDrum(type: number) {
    if (!this.ctx) return;
    const dest = this.trackGains[type] || this.masterGain!;
    synthesizeDrum(this.ctx, dest, type, this.ctx.currentTime);
  }

  scheduleDrum(type: number, time: number) {
    if (!this.ctx) return;
    const dest = this.trackGains[type] || this.masterGain!;
    synthesizeDrum(this.ctx, dest, type, time);
  }
}
