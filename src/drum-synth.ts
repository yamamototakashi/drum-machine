import { DrumType } from './constants';

const noiseCache = new Map<string, AudioBuffer>();

function getNoiseBuffer(ctx: AudioContext, duration: number): AudioBuffer {
  const key = `${ctx.sampleRate}:${duration}`;
  let buf = noiseCache.get(key);
  if (!buf) {
    const len = Math.floor(ctx.sampleRate * duration);
    buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    noiseCache.set(key, buf);
  }
  return buf;
}

/** Handle returned by hi-hat synths for choke control. */
export interface DrumVoice {
  /** Fade out over `duration` seconds starting at `time`, then stop all sources. */
  choke(time: number, fadeDuration: number): void;
}

const EMPTY_VOICE: DrumVoice = { choke() {} };

export function synthesizeDrum(
  ctx: AudioContext,
  dest: AudioNode,
  type: DrumType,
  time: number,
): DrumVoice {
  switch (type) {
    case DrumType.Kick:      synthKick(ctx, dest, time); return EMPTY_VOICE;
    case DrumType.Snare:     synthSnare(ctx, dest, time); return EMPTY_VOICE;
    case DrumType.Clap:      synthClap(ctx, dest, time); return EMPTY_VOICE;
    case DrumType.ClosedHat: return synthClosedHat(ctx, dest, time);
    case DrumType.OpenHat:   return synthOpenHat(ctx, dest, time);
    case DrumType.Tom:       synthTom(ctx, dest, time); return EMPTY_VOICE;
    case DrumType.Rim:       synthRim(ctx, dest, time); return EMPTY_VOICE;
    case DrumType.Crash:     synthCrash(ctx, dest, time); return EMPTY_VOICE;
  }
}

/** Helper: build a chokeable voice from a master gain and its source nodes. */
function makeVoice(
  ctx: AudioContext,
  masterGain: GainNode,
  sources: (OscillatorNode | AudioBufferSourceNode)[],
  naturalEnd: number,
): DrumVoice {
  let choked = false;
  return {
    choke(time: number, fadeDuration: number) {
      if (choked) return;
      choked = true;
      // Cancel any scheduled ramps on the gain, then fade to silence
      masterGain.gain.cancelScheduledValues(time);
      masterGain.gain.setValueAtTime(masterGain.gain.value, time);
      masterGain.gain.linearRampToValueAtTime(0, time + fadeDuration);
      // Stop all sources just after the fade completes
      const stopAt = time + fadeDuration + 0.002;
      for (const s of sources) {
        try { s.stop(stopAt); } catch { /* already stopped */ }
      }
    },
  };
}

// ─── Kick ──────────────────────────────────────────────────────────
function synthKick(ctx: AudioContext, dest: AudioNode, t: number) {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(160, t);
  osc.frequency.exponentialRampToValueAtTime(28, t + 0.12);
  g.gain.setValueAtTime(1.0, t);
  g.gain.setValueAtTime(0.95, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
  osc.connect(g).connect(dest);
  osc.start(t);
  osc.stop(t + 0.45);

  const c = ctx.createOscillator();
  const cg = ctx.createGain();
  c.type = 'square';
  c.frequency.setValueAtTime(1800, t);
  c.frequency.exponentialRampToValueAtTime(200, t + 0.015);
  cg.gain.setValueAtTime(0.35, t);
  cg.gain.exponentialRampToValueAtTime(0.001, t + 0.025);
  c.connect(cg).connect(dest);
  c.start(t);
  c.stop(t + 0.03);
}

// ─── Snare ─────────────────────────────────────────────────────────
function synthSnare(ctx: AudioContext, dest: AudioNode, t: number) {
  const osc = ctx.createOscillator();
  const og = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(200, t);
  osc.frequency.exponentialRampToValueAtTime(120, t + 0.05);
  og.gain.setValueAtTime(0.6, t);
  og.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
  osc.connect(og).connect(dest);
  osc.start(t);
  osc.stop(t + 0.12);

  const n = ctx.createBufferSource();
  n.buffer = getNoiseBuffer(ctx, 0.25);
  const hp = ctx.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.setValueAtTime(2000, t);
  const ng = ctx.createGain();
  ng.gain.setValueAtTime(0.7, t);
  ng.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
  n.connect(hp).connect(ng).connect(dest);
  n.start(t);
  n.stop(t + 0.25);
}

// ─── Clap ──────────────────────────────────────────────────────────
function synthClap(ctx: AudioContext, dest: AudioNode, t: number) {
  for (let i = 0; i < 4; i++) {
    const bt = t + i * 0.012;
    const n = ctx.createBufferSource();
    n.buffer = getNoiseBuffer(ctx, 0.08);
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(1200, bt);
    bp.Q.setValueAtTime(1.5, bt);
    const g = ctx.createGain();
    const last = i === 3;
    g.gain.setValueAtTime(last ? 0.8 : 0.45, bt);
    g.gain.exponentialRampToValueAtTime(0.001, bt + (last ? 0.2 : 0.035));
    n.connect(bp).connect(g).connect(dest);
    n.start(bt);
    n.stop(bt + (last ? 0.25 : 0.05));
  }
}

// ─── Closed Hi-Hat ─────────────────────────────────────────────────
function synthClosedHat(ctx: AudioContext, dest: AudioNode, t: number): DrumVoice {
  // All hat sources route through a single master gain for choke control
  const master = ctx.createGain();
  master.gain.setValueAtTime(1, t);
  master.connect(dest);
  const sources: (OscillatorNode | AudioBufferSourceNode)[] = [];

  const n = ctx.createBufferSource();
  n.buffer = getNoiseBuffer(ctx, 0.08);
  const hp = ctx.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.setValueAtTime(7000, t);
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.setValueAtTime(10000, t);
  bp.Q.setValueAtTime(1, t);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.45, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
  n.connect(hp).connect(bp).connect(g).connect(master);
  n.start(t);
  n.stop(t + 0.08);
  sources.push(n);

  const o = ctx.createOscillator();
  o.type = 'square';
  o.frequency.setValueAtTime(6800, t);
  const og = ctx.createGain();
  og.gain.setValueAtTime(0.07, t);
  og.gain.exponentialRampToValueAtTime(0.001, t + 0.035);
  o.connect(og).connect(master);
  o.start(t);
  o.stop(t + 0.04);
  sources.push(o);

  return makeVoice(ctx, master, sources, t + 0.08);
}

// ─── Open Hi-Hat ───────────────────────────────────────────────────
function synthOpenHat(ctx: AudioContext, dest: AudioNode, t: number): DrumVoice {
  const master = ctx.createGain();
  master.gain.setValueAtTime(1, t);
  master.connect(dest);
  const sources: (OscillatorNode | AudioBufferSourceNode)[] = [];

  const n = ctx.createBufferSource();
  n.buffer = getNoiseBuffer(ctx, 0.6);
  const hp = ctx.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.setValueAtTime(6000, t);
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.setValueAtTime(9000, t);
  bp.Q.setValueAtTime(0.8, t);
  const g = ctx.createGain();
  // Longer sustain with natural tail — clearly longer than closed hat
  g.gain.setValueAtTime(0.45, t);
  g.gain.setValueAtTime(0.42, t + 0.02);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
  n.connect(hp).connect(bp).connect(g).connect(master);
  n.start(t);
  n.stop(t + 0.6);
  sources.push(n);

  for (const freq of [5620, 7440]) {
    const o = ctx.createOscillator();
    o.type = 'square';
    o.frequency.setValueAtTime(freq, t);
    const og = ctx.createGain();
    og.gain.setValueAtTime(0.05, t);
    og.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
    o.connect(og).connect(master);
    o.start(t);
    o.stop(t + 0.35);
    sources.push(o);
  }

  return makeVoice(ctx, master, sources, t + 0.6);
}

// ─── Tom ───────────────────────────────────────────────────────────
function synthTom(ctx: AudioContext, dest: AudioNode, t: number) {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(220, t);
  osc.frequency.exponentialRampToValueAtTime(80, t + 0.15);
  g.gain.setValueAtTime(0.9, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
  osc.connect(g).connect(dest);
  osc.start(t);
  osc.stop(t + 0.3);

  const c = ctx.createOscillator();
  const cg = ctx.createGain();
  c.type = 'triangle';
  c.frequency.setValueAtTime(500, t);
  c.frequency.exponentialRampToValueAtTime(150, t + 0.02);
  cg.gain.setValueAtTime(0.25, t);
  cg.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
  c.connect(cg).connect(dest);
  c.start(t);
  c.stop(t + 0.03);
}

// ─── Rim ───────────────────────────────────────────────────────────
function synthRim(ctx: AudioContext, dest: AudioNode, t: number) {
  const n = ctx.createBufferSource();
  n.buffer = getNoiseBuffer(ctx, 0.05);
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.setValueAtTime(3500, t);
  bp.Q.setValueAtTime(3, t);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.55, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.035);
  n.connect(bp).connect(g).connect(dest);
  n.start(t);
  n.stop(t + 0.05);

  const o = ctx.createOscillator();
  o.type = 'sine';
  o.frequency.setValueAtTime(830, t);
  const og = ctx.createGain();
  og.gain.setValueAtTime(0.45, t);
  og.gain.exponentialRampToValueAtTime(0.001, t + 0.025);
  o.connect(og).connect(dest);
  o.start(t);
  o.stop(t + 0.03);
}

// ─── Crash ─────────────────────────────────────────────────────────
function synthCrash(ctx: AudioContext, dest: AudioNode, t: number) {
  const n = ctx.createBufferSource();
  n.buffer = getNoiseBuffer(ctx, 1.5);
  const hp = ctx.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.setValueAtTime(4000, t);
  const pk = ctx.createBiquadFilter();
  pk.type = 'peaking';
  pk.frequency.setValueAtTime(6000, t);
  pk.gain.setValueAtTime(6, t);
  pk.Q.setValueAtTime(0.5, t);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.5, t);
  g.gain.setValueAtTime(0.45, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.001, t + 1.2);
  n.connect(hp).connect(pk).connect(g).connect(dest);
  n.start(t);
  n.stop(t + 1.5);

  for (const [i, freq] of [4200, 5800, 7400].entries()) {
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(freq, t);
    const og = ctx.createGain();
    og.gain.setValueAtTime(0.035, t);
    og.gain.exponentialRampToValueAtTime(0.001, t + 0.8 - i * 0.15);
    o.connect(og).connect(dest);
    o.start(t);
    o.stop(t + 0.8);
  }
}
