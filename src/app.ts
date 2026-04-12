import { Store } from './store';
import { AudioEngine } from './audio-engine';
import { Sequencer } from './sequencer';
import { PadsUI } from './pads';
import { TransportUI } from './transport';
import { SequencerGridUI } from './sequencer-grid';
import { MixerUI } from './mixer';
import { KEY_TO_TRACK, TRACKS } from './constants';

export class App {
  private store: Store;
  private audioEngine: AudioEngine;
  private sequencer: Sequencer;
  private padsUI!: PadsUI;
  private transportUI!: TransportUI;
  private seqGridUI!: SequencerGridUI;
  private mixerUI!: MixerUI;

  constructor() {
    this.store = new Store();
    this.audioEngine = new AudioEngine();
    this.sequencer = new Sequencer(this.audioEngine, this.store);
  }

  mount(container: HTMLElement) {
    container.className = 'app-root';

    // --- Header ---
    const header = document.createElement('header');
    header.className = 'app-header';
    header.innerHTML = `
      <div class="header-left">
        <h1 class="app-title">NEON<span class="title-accent"> PULSE</span></h1>
        <span class="app-subtitle">DRUM MACHINE</span>
      </div>
      <div class="header-right">
        <div class="led-cluster">
          <div class="led led-1"></div>
          <div class="led led-2"></div>
          <div class="led led-3"></div>
        </div>
      </div>
    `;
    container.appendChild(header);

    // --- Main scroll area ---
    const main = document.createElement('main');
    main.className = 'app-main';

    // Pads
    this.padsUI = new PadsUI(async (track) => {
      await this.audioEngine.ensureContext();
      this.audioEngine.playDrum(track);
    });
    main.appendChild(this.padsUI.el);

    // Transport
    this.transportUI = new TransportUI(this.store, this.sequencer, this.audioEngine);
    main.appendChild(this.transportUI.el);

    // Sequencer grid
    this.seqGridUI = new SequencerGridUI(this.store);
    main.appendChild(this.seqGridUI.el);

    // Mixer
    this.mixerUI = new MixerUI(this.store, this.audioEngine);
    main.appendChild(this.mixerUI.el);

    container.appendChild(main);

    // --- Wire sequencer step visual ---
    this.sequencer.onStep((step) => {
      this.seqGridUI.setCurrentStep(step);
    });

    // --- Apply stored audio state once audio is ready ---
    this.audioEngine.onInit(() => {
      const s = this.store.getState();
      this.audioEngine.setMasterVolume(s.masterVolume);
      for (let i = 0; i < TRACKS.length; i++) {
        this.audioEngine.setTrackVolume(i, s.trackVolumes[i]);
        this.audioEngine.setTrackMute(i, s.trackMutes[i]);
      }
    });

    // --- Warm up audio on first interaction ---
    const warmUp = () => this.audioEngine.ensureContext();
    document.addEventListener('touchstart', warmUp, { once: true });
    document.addEventListener('mousedown', warmUp, { once: true });

    // --- Keyboard ---
    this.bindKeyboard();
  }

  private bindKeyboard() {
    const held = new Set<string>();

    document.addEventListener('keydown', (e) => {
      // Ignore when typing in inputs
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return;

      const key = e.key.toLowerCase();
      if (held.has(key)) return;
      held.add(key);

      if (key === ' ') {
        e.preventDefault();
        this.audioEngine.ensureContext().then(() => {
          this.sequencer.toggle();
          this.transportUI.syncPlayState();
        });
        return;
      }

      if (key in KEY_TO_TRACK) {
        e.preventDefault();
        const track = KEY_TO_TRACK[key];
        this.padsUI.trigger(track);
      }
    });

    document.addEventListener('keyup', (e) => {
      held.delete(e.key.toLowerCase());
    });
  }
}
