import { Store } from './store';
import { AudioEngine } from './audio-engine';
import { TRACKS, TRACK_COUNT } from './constants';

export class MixerUI {
  readonly el: HTMLElement;
  private store: Store;
  private audioEngine: AudioEngine;
  private expanded = false;

  constructor(store: Store, audioEngine: AudioEngine) {
    this.store = store;
    this.audioEngine = audioEngine;
    this.el = document.createElement('section');
    this.el.className = 'mixer-section panel';
    this.build();
    this.store.subscribe(() => this.sync());
  }

  private build() {
    const s = this.store.getState();

    const toggle = document.createElement('button');
    toggle.className = 'mixer-toggle';
    toggle.innerHTML = '<span>MIXER</span><span class="mixer-arrow">&#9660;</span>';
    toggle.addEventListener('click', () => {
      this.expanded = !this.expanded;
      this.el.classList.toggle('expanded', this.expanded);
      toggle.querySelector('.mixer-arrow')!.innerHTML = this.expanded ? '&#9650;' : '&#9660;';
    });
    this.el.appendChild(toggle);

    const content = document.createElement('div');
    content.className = 'mixer-content';

    for (let tr = 0; tr < TRACK_COUNT; tr++) {
      const row = document.createElement('div');
      row.className = 'mixer-row';
      row.style.setProperty('--track-color', TRACKS[tr].color);

      const mute = document.createElement('button');
      mute.className = 'mute-btn' + (s.trackMutes[tr] ? ' muted' : '');
      mute.innerHTML = `<span class="mute-dot"></span>${TRACKS[tr].shortName}`;
      mute.addEventListener('click', () => {
        this.store.toggleTrackMute(tr);
        const muted = this.store.getState().trackMutes[tr];
        this.audioEngine.setTrackMute(tr, muted);
      });

      const slider = document.createElement('input');
      slider.type = 'range';
      slider.className = 'neon-slider mixer-slider';
      slider.min = '0';
      slider.max = '100';
      slider.value = String(Math.round(s.trackVolumes[tr] * 100));
      slider.addEventListener('input', () => {
        const v = Number(slider.value) / 100;
        this.store.setTrackVolume(tr, v);
        this.audioEngine.setTrackVolume(tr, v);
      });

      row.appendChild(mute);
      row.appendChild(slider);
      content.appendChild(row);
    }

    this.el.appendChild(content);
  }

  private sync() {
    const s = this.store.getState();
    const rows = this.el.querySelectorAll('.mixer-row');
    rows.forEach((row, tr) => {
      const btn = row.querySelector('.mute-btn') as HTMLElement;
      const sl = row.querySelector('.mixer-slider') as HTMLInputElement;
      btn.classList.toggle('muted', s.trackMutes[tr]);
      if (document.activeElement !== sl) {
        sl.value = String(Math.round(s.trackVolumes[tr] * 100));
      }
    });
  }
}
