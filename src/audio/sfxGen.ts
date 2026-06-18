import { audio } from '../systems/AudioSystem';

/**
 * sfxGen — procedural sound effects synthesized with WebAudio oscillators and
 * noise buffers. All original; no samples.
 */

function env(node: AudioNode, gain: GainNode, t: number, peak: number, attack: number, decay: number): void {
  gain.gain.cancelScheduledValues(t);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(peak, t + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
  node.connect(gain);
  gain.connect(audio.sfx);
}

function osc(type: OscillatorType, freq: number, t: number, peak: number, attack: number, decay: number): void {
  const ctx = audio.ctxSafe;
  const o = ctx.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  const g = ctx.createGain();
  env(o, g, t, peak, attack, decay);
  o.start(t);
  o.stop(t + attack + decay + 0.05);
}

function noiseBuffer(duration: number): AudioBuffer {
  const ctx = audio.ctxSafe;
  const len = Math.floor(ctx.sampleRate * duration);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  return buf;
}

function noise(t: number, peak: number, duration: number, filterFreq: number, q = 1): void {
  const ctx = audio.ctxSafe;
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer(duration);
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = filterFreq;
  filter.Q.value = q;
  const g = ctx.createGain();
  src.connect(filter);
  env(filter, g, t, peak, 0.001, duration);
  src.start(t);
  src.stop(t + duration + 0.05);
}

export const sfx = {
  shoot(): void {
    const t = audio.now;
    osc('square', 880, t, 0.18, 0.001, 0.07);
    osc('square', 440, t + 0.02, 0.10, 0.001, 0.05);
    noise(t, 0.08, 0.05, 2200, 0.7);
  },
  shotgun(): void {
    const t = audio.now;
    noise(t, 0.35, 0.18, 1400, 0.4);
    osc('sawtooth', 180, t, 0.2, 0.001, 0.12);
  },
  chaingun(): void {
    const t = audio.now;
    noise(t, 0.16, 0.05, 2600, 1.2);
    osc('square', 220, t, 0.06, 0.001, 0.03);
  },
  explosion(): void {
    const t = audio.now;
    noise(t, 0.55, 0.6, 320, 0.3);
    osc('sawtooth', 90, t, 0.4, 0.002, 0.5);
    osc('sine', 50, t, 0.4, 0.002, 0.6);
  },
  rocket(): void {
    const t = audio.now;
    noise(t, 0.2, 0.3, 700, 0.6);
    osc('sawtooth', 140, t, 0.18, 0.005, 0.25);
  },
  hurt(): void {
    const t = audio.now;
    const o = audio.ctxSafe.createOscillator();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(300, t);
    o.frequency.exponentialRampToValueAtTime(80, t + 0.2);
    const g = audio.ctxSafe.createGain();
    env(o, g, t, 0.3, 0.002, 0.2);
    o.start(t); o.stop(t + 0.3);
  },
  enemyHit(): void {
    const t = audio.now;
    osc('square', 520, t, 0.08, 0.001, 0.04);
    noise(t, 0.06, 0.03, 3000, 1);
  },
  enemyDie(): void {
    const t = audio.now;
    const o = audio.ctxSafe.createOscillator();
    o.type = 'square';
    o.frequency.setValueAtTime(400, t);
    o.frequency.exponentialRampToValueAtTime(60, t + 0.25);
    const g = audio.ctxSafe.createGain();
    env(o, g, t, 0.22, 0.002, 0.25);
    o.start(t); o.stop(t + 0.32);
    noise(t, 0.18, 0.2, 800, 0.5);
  },
  pickup(): void {
    const t = audio.now;
    osc('triangle', 660, t, 0.2, 0.001, 0.06);
    osc('triangle', 990, t + 0.06, 0.2, 0.001, 0.08);
  },
  armor(): void {
    const t = audio.now;
    osc('square', 520, t, 0.18, 0.002, 0.1);
    osc('square', 780, t + 0.08, 0.18, 0.002, 0.12);
  },
  jump(): void {
    const t = audio.now;
    const o = audio.ctxSafe.createOscillator();
    o.type = 'square';
    o.frequency.setValueAtTime(300, t);
    o.frequency.exponentialRampToValueAtTime(700, t + 0.12);
    const g = audio.ctxSafe.createGain();
    env(o, g, t, 0.14, 0.002, 0.12);
    o.start(t); o.stop(t + 0.2);
  },
  reload(): void {
    const t = audio.now;
    noise(t, 0.12, 0.04, 1800, 1);
    osc('square', 200, t + 0.05, 0.1, 0.002, 0.05);
  },
  switchWeapon(): void {
    const t = audio.now;
    osc('square', 700, t, 0.1, 0.001, 0.03);
    osc('square', 1000, t + 0.03, 0.08, 0.001, 0.04);
  },
  bossHit(): void {
    const t = audio.now;
    noise(t, 0.3, 0.15, 500, 0.6);
    osc('sawtooth', 120, t, 0.2, 0.002, 0.1);
  },
  bossDie(): void {
    const t = audio.now;
    noise(t, 0.6, 0.9, 250, 0.3);
    const o = audio.ctxSafe.createOscillator();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(200, t);
    o.frequency.exponentialRampToValueAtTime(30, t + 0.9);
    const g = audio.ctxSafe.createGain();
    env(o, g, t, 0.5, 0.005, 0.9);
    o.start(t); o.stop(t + 1);
  },
  secret(): void {
    const t = audio.now;
    osc('triangle', 880, t, 0.2, 0.002, 0.08);
    osc('triangle', 1100, t + 0.08, 0.2, 0.002, 0.08);
    osc('triangle', 1320, t + 0.16, 0.2, 0.002, 0.12);
  },
  quip(): void {
    // vocoder-ish blip for one-liners (no real voice)
    const t = audio.now;
    const o = audio.ctxSafe.createOscillator();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(180, t);
    o.frequency.linearRampToValueAtTime(260, t + 0.08);
    o.frequency.linearRampToValueAtTime(160, t + 0.18);
    const filter = audio.ctxSafe.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 900;
    filter.Q.value = 6;
    const g = audio.ctxSafe.createGain();
    o.connect(filter);
    env(filter, g, t, 0.16, 0.005, 0.2);
    o.start(t); o.stop(t + 0.3);
  },
  uiSelect(): void {
    const t = audio.now;
    osc('square', 600, t, 0.12, 0.001, 0.05);
    osc('square', 900, t + 0.04, 0.1, 0.001, 0.06);
  },
};
