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

export function synthesizeDrum(
  ctx: AudioContext,
  dest: AudioNode,
  type: DrumType,
  time: number,
): void {
  switch (type) {
    case DrumType.Kick:      return synthKick(ctx, dest, time);
    case DrumType.Snare:     return synthSnare(ctx, dest, time);
    case DrumType.Clap:      return synthClap(ctx, dest, time);
    case DrumType.ClosedHat: return synthClosedHat(ctx, dest, time);
    case DrumType.OpenHat:   return synthOpenHat(ctx, dest, time);
    case DrumType.Tom:       return synthTom(ctx, dest, time);
    case DrumType.Rim:       return synthRim(ctx, dest, time);
    case DrumType.Crash:     return synthCrash(ctx, dest, time);
  }
}

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

  // Click transient
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

function synthSnare(ctx: AudioContext, dest: AudioNode, t: number) {
  // Body tone
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

  // Noise wires
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

function synthClosedHat(ctx: AudioContext, dest: AudioNode, t: number) {
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
  n.connect(hp).connect(bp).connect(g).connect(dest);
  n.start(t);
  n.stop(t + 0.08);

  const o = ctx.createOscillator();
  o.type = 'square';
  o.frequency.setValueAtTime(6800, t);
  const og = ctx.createGain();
  og.gain.setValueAtTime(0.07, t);
  og.gain.exponentialRampToValueAtTime(0.001, t + 0.035);
  o.connect(og).connect(dest);
  o.start(t);
  o.stop(t + 0.04);
}

function synthOpenHat(ctx: AudioContext, dest: AudioNode, t: number) {
  const n = ctx.createBufferSource();
  n.buffer = getNoiseBuffer(ctx, 0.5);
  const hp = ctx.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.setValueAtTime(6000, t);
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.setValueAtTime(9000, t);
  bp.Q.setValueAtTime(0.8, t);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.45, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
  n.connect(hp).connect(bp).connect(g).connect(dest);
  n.start(t);
  n.stop(t + 0.5);

  for (const freq of [5620, 7440]) {
    const o = ctx.createOscillator();
    o.type = 'square';
    o.frequency.setValueAtTime(freq, t);
    const og = ctx.createGain();
    og.gain.setValueAtTime(0.05, t);
    og.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
    o.connect(og).connect(dest);
    o.start(t);
    o.stop(t + 0.25);
  }
}

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
