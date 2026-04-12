import { TRACKS } from './constants';

export type PadTriggerFn = (track: number) => void;

export class PadsUI {
  readonly el: HTMLElement;
  private pads: HTMLElement[] = [];
  private triggerFn: PadTriggerFn;

  constructor(triggerFn: PadTriggerFn) {
    this.triggerFn = triggerFn;
    this.el = document.createElement('section');
    this.el.className = 'pads-section';
    this.build();
  }

  private build() {
    const grid = document.createElement('div');
    grid.className = 'pads-grid';

    TRACKS.forEach((track, i) => {
      const pad = document.createElement('button');
      pad.className = 'drum-pad';
      pad.dataset.track = String(i);
      pad.style.setProperty('--pad-color', track.color);
      pad.style.setProperty('--pad-from', track.gradFrom);
      pad.style.setProperty('--pad-to', track.gradTo);

      pad.innerHTML = `
        <span class="pad-name">${track.name}</span>
        <span class="pad-key">${track.keyLabel}</span>
        <div class="pad-glow"></div>
      `;

      pad.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        this.trigger(i);
      });
      pad.addEventListener('contextmenu', (e) => e.preventDefault());

      this.pads.push(pad);
      grid.appendChild(pad);
    });

    this.el.appendChild(grid);
  }

  trigger(index: number) {
    this.triggerFn(index);

    const pad = this.pads[index];
    pad.classList.remove('triggered');
    // Force reflow to restart animation
    void pad.offsetWidth;
    pad.classList.add('triggered');

    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }

    setTimeout(() => pad.classList.remove('triggered'), 200);
  }
}
