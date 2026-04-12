import { Store } from './store';
import { TRACKS, STEP_COUNT, TRACK_COUNT } from './constants';

export class SequencerGridUI {
  readonly el: HTMLElement;
  private btns: HTMLElement[][] = [];
  private store: Store;

  constructor(store: Store) {
    this.store = store;
    this.el = document.createElement('section');
    this.el.className = 'sequencer-section panel';
    this.build();
    this.store.subscribe(() => this.syncPattern());
  }

  private build() {
    const state = this.store.getState();
    const title = document.createElement('div');
    title.className = 'seq-title';
    title.textContent = 'SEQUENCER';
    this.el.appendChild(title);

    const grid = document.createElement('div');
    grid.className = 'seq-grid';

    for (let tr = 0; tr < TRACK_COUNT; tr++) {
      const row = document.createElement('div');
      row.className = 'seq-row';
      row.style.setProperty('--track-color', TRACKS[tr].color);

      // Label with color dot
      const label = document.createElement('div');
      label.className = 'seq-label';
      label.innerHTML = `<span class="seq-dot" style="background:${TRACKS[tr].color}"></span>${TRACKS[tr].shortName}`;
      row.appendChild(label);

      // 4 groups of 4 steps
      const stepsWrap = document.createElement('div');
      stepsWrap.className = 'seq-steps';

      this.btns[tr] = [];

      for (let grp = 0; grp < 4; grp++) {
        const group = document.createElement('div');
        group.className = 'step-group';
        for (let s = 0; s < 4; s++) {
          const step = grp * 4 + s;
          const btn = document.createElement('button');
          btn.className = 'step-btn';
          if (state.pattern[tr][step]) btn.classList.add('on');
          btn.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            this.store.toggleStep(tr, step);
          });
          btn.addEventListener('contextmenu', (e) => e.preventDefault());
          this.btns[tr][step] = btn;
          group.appendChild(btn);
        }
        stepsWrap.appendChild(group);
      }

      row.appendChild(stepsWrap);
      grid.appendChild(row);
    }

    // Step numbers
    const nums = document.createElement('div');
    nums.className = 'seq-row seq-numbers';
    nums.innerHTML = '<div class="seq-label"></div>';
    const numsWrap = document.createElement('div');
    numsWrap.className = 'seq-steps';
    for (let grp = 0; grp < 4; grp++) {
      const group = document.createElement('div');
      group.className = 'step-group';
      for (let s = 0; s < 4; s++) {
        const num = document.createElement('span');
        num.className = 'step-num';
        num.textContent = String(grp * 4 + s + 1);
        group.appendChild(num);
      }
      numsWrap.appendChild(group);
    }
    nums.appendChild(numsWrap);
    grid.appendChild(nums);

    this.el.appendChild(grid);
  }

  syncPattern() {
    const state = this.store.getState();
    for (let tr = 0; tr < TRACK_COUNT; tr++) {
      for (let s = 0; s < STEP_COUNT; s++) {
        this.btns[tr][s].classList.toggle('on', state.pattern[tr][s]);
      }
    }
  }

  setCurrentStep(step: number) {
    for (let tr = 0; tr < TRACK_COUNT; tr++) {
      for (let s = 0; s < STEP_COUNT; s++) {
        this.btns[tr][s].classList.toggle('current', s === step);
      }
    }
  }
}
