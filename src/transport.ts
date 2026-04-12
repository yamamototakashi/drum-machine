import { Store } from './store';
import { Sequencer } from './sequencer';
import { AudioEngine } from './audio-engine';
import { PRESETS } from './presets';

export class TransportUI {
  readonly el: HTMLElement;
  private playBtn!: HTMLButtonElement;
  private store: Store;
  private sequencer: Sequencer;
  private audioEngine: AudioEngine;

  constructor(store: Store, sequencer: Sequencer, audioEngine: AudioEngine) {
    this.store = store;
    this.sequencer = sequencer;
    this.audioEngine = audioEngine;
    this.el = document.createElement('section');
    this.el.className = 'transport-section panel';
    this.build();
    this.store.subscribe(() => this.sync());
  }

  private build() {
    const s = this.store.getState();

    this.el.innerHTML = `
      <div class="transport-row transport-buttons">
        <button class="t-btn play-btn" aria-label="Play">
          <svg viewBox="0 0 24 24" width="18" height="18"><polygon points="6,3 21,12 6,21" fill="currentColor"/></svg>
        </button>
        <button class="t-btn stop-btn" aria-label="Stop">
          <svg viewBox="0 0 24 24" width="16" height="16"><rect x="4" y="4" width="16" height="16" rx="2" fill="currentColor"/></svg>
        </button>
        <button class="t-btn clear-btn" aria-label="Clear">CLR</button>
        <div class="transport-spacer"></div>
        <div class="bpm-display">
          <span class="bpm-label">BPM</span>
          <span class="bpm-value">${s.tempo}</span>
        </div>
      </div>

      <div class="transport-row transport-sliders">
        <div class="ctrl-group">
          <label class="ctrl-label">TEMPO</label>
          <input type="range" class="neon-slider tempo-slider" min="40" max="300" value="${s.tempo}" />
        </div>
        <div class="ctrl-group">
          <label class="ctrl-label">SWING <span class="ctrl-val swing-val">${s.swing}%</span></label>
          <input type="range" class="neon-slider swing-slider" min="0" max="100" value="${s.swing}" />
        </div>
        <div class="ctrl-group">
          <label class="ctrl-label">MASTER <span class="ctrl-val vol-val">${Math.round(s.masterVolume * 100)}%</span></label>
          <input type="range" class="neon-slider vol-slider" min="0" max="100" value="${Math.round(s.masterVolume * 100)}" />
        </div>
        <div class="ctrl-group preset-group">
          <label class="ctrl-label">PATTERN</label>
          <select class="preset-select">
            ${PRESETS.map(
              (p) =>
                `<option value="${p.id}"${p.id === s.currentPreset ? ' selected' : ''}>${p.name}</option>`,
            ).join('')}
          </select>
        </div>
      </div>
    `;

    this.playBtn = this.el.querySelector('.play-btn')!;
    const stopBtn = this.el.querySelector('.stop-btn') as HTMLButtonElement;
    const clearBtn = this.el.querySelector('.clear-btn') as HTMLButtonElement;
    const tempoSlider = this.el.querySelector('.tempo-slider') as HTMLInputElement;
    const swingSlider = this.el.querySelector('.swing-slider') as HTMLInputElement;
    const volSlider = this.el.querySelector('.vol-slider') as HTMLInputElement;
    const presetSel = this.el.querySelector('.preset-select') as HTMLSelectElement;

    this.playBtn.addEventListener('click', async () => {
      await this.audioEngine.ensureContext();
      if (this.sequencer.isPlaying) {
        this.sequencer.stop();
      } else {
        this.sequencer.start();
      }
      this.syncPlayState();
    });

    stopBtn.addEventListener('click', () => {
      this.sequencer.stop();
      this.syncPlayState();
    });

    clearBtn.addEventListener('click', () => {
      this.store.clearPattern();
      presetSel.value = 'empty';
    });

    tempoSlider.addEventListener('input', () => {
      this.store.setTempo(Number(tempoSlider.value));
    });

    swingSlider.addEventListener('input', () => {
      this.store.setSwing(Number(swingSlider.value));
    });

    volSlider.addEventListener('input', () => {
      const v = Number(volSlider.value) / 100;
      this.store.setMasterVolume(v);
      this.audioEngine.setMasterVolume(v);
    });

    presetSel.addEventListener('change', () => {
      this.store.loadPreset(presetSel.value);
    });
  }

  syncPlayState() {
    const playing = this.sequencer.isPlaying;
    this.playBtn.classList.toggle('active', playing);
    document.body.classList.toggle('playing', playing);
  }

  private sync() {
    const s = this.store.getState();
    const bpmVal = this.el.querySelector('.bpm-value')!;
    bpmVal.textContent = String(s.tempo);
    const swingVal = this.el.querySelector('.swing-val')!;
    swingVal.textContent = `${s.swing}%`;
    const volVal = this.el.querySelector('.vol-val')!;
    volVal.textContent = `${Math.round(s.masterVolume * 100)}%`;
  }
}
