import { audio } from '../systems/AudioSystem';

/**
 * musicGen — simple chiptune sequencer. Patterns are original. Each level has
 * its own bassline + arpeggio + tempo. Loops until stopped or replaced.
 */

type Pattern = {
  bpm: number;
  bass: number[];   // frequencies (0 = rest)
  lead: number[];   // arpeggio notes
  leadWave: OscillatorType;
  bassWave: OscillatorType;
};

const N = {
  C2: 65.41, D2: 73.42, E2: 82.41, F2: 87.31, G2: 98.0, A2: 110.0, B2: 123.47,
  C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.0, A3: 220.0, B3: 246.94,
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.0, A4: 440.0, B4: 493.88,
  C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99,
  R: 0,
};

const PATTERNS: Record<string, Pattern> = {
  city: {
    bpm: 132,
    bass: [N.C2, N.C2, N.G2, N.C2, N.E2, N.E2, N.G2, N.E2],
    lead: [N.C4, N.E4, N.G4, N.E4, N.C4, N.E4, N.G4, N.C5],
    leadWave: 'square',
    bassWave: 'triangle',
  },
  sewers: {
    bpm: 96,
    bass: [N.D2, N.D2, N.A2, N.D2, N.F2, N.F2, N.A2, N.F2],
    lead: [N.D4, N.F4, N.A4, N.F4, N.D4, N.A3, N.D4, N.F4],
    leadWave: 'sawtooth',
    bassWave: 'sine',
  },
  roofs: {
    bpm: 150,
    bass: [N.A2, N.A2, N.E2, N.A2, N.G2, N.G2, N.D2, N.G2],
    lead: [N.A4, N.C5, N.E5, N.A4, N.G4, N.B4, N.D5, N.G4],
    leadWave: 'square',
    bassWave: 'triangle',
  },
  desert: {
    bpm: 120,
    bass: [N.E2, N.E2, N.B2, N.E2, N.G2, N.G2, N.D2, N.G2],
    lead: [N.E4, N.G4, N.B4, N.G4, N.E4, N.B3, N.E4, N.G4],
    leadWave: 'sawtooth',
    bassWave: 'triangle',
  },
  base: {
    bpm: 140,
    bass: [N.F2, N.F2, N.C3, N.F2, N.D3, N.D3, N.A2, N.D3],
    lead: [N.F4, N.A4, N.C5, N.A4, N.D4, N.F4, N.A4, N.D5],
    leadWave: 'square',
    bassWave: 'sawtooth',
  },
  ship: {
    bpm: 160,
    bass: [N.B2, N.B2, N.F2, N.B2, N.A2, N.A2, N.E2, N.A2],
    lead: [N.B4, N.D5, N.G5, N.D5, N.A4, N.C5, N.E5, N.B4],
    leadWave: 'square',
    bassWave: 'triangle',
  },
  boss: {
    bpm: 168,
    bass: [N.E2, N.E2, N.E2, N.E2, N.F2, N.F2, N.G2, N.G2],
    lead: [N.E4, N.G4, N.B4, N.E5, N.F4, N.A4, N.C5, N.F5],
    leadWave: 'sawtooth',
    bassWave: 'square',
  },
  menu: {
    bpm: 110,
    bass: [N.C2, N.G2, N.A2, N.F2],
    lead: [N.C4, N.E4, N.G4, N.E4],
    leadWave: 'triangle',
    bassWave: 'sine',
  },
};

export class MusicPlayer {
  private timers: number[] = [];
  private current = '';

  play(name: keyof typeof PATTERNS | string): void {
    if (this.current === name) return;
    this.stop();
    const p = PATTERNS[name];
    if (!p) return;
    this.current = name as string;
    const ctx = audio.ctxSafe;
    const stepDur = 60 / p.bpm / 2; // eighth notes
    let step = 0;

    const schedule = () => {
      const ahead = 0.2;
      while (audio.now + ahead > step * stepDur + this.startTime) {
        const t = step * stepDur + this.startTime;
        const bi = step % p.bass.length;
        const li = step % p.lead.length;
        if (p.bass[bi] > 0) this.note(p.bass[bi], t, stepDur * 0.9, p.bassWave, 0.25);
        if (p.lead[li] > 0) this.note(p.lead[li], t, stepDur * 0.8, p.leadWave, 0.12);
        if (step % 4 === 0) this.note(p.bass[bi] / 2, t, stepDur * 0.3, 'square', 0.08); // hat-ish
        step++;
      }
    };

    this.startTime = ctx.currentTime + 0.1;
    schedule();
    const interval = window.setInterval(schedule, 100);
    this.timers.push(interval);
  }

  private startTime = 0;

  private note(freq: number, t: number, dur: number, wave: OscillatorType, vol: number): void {
    const ctx = audio.ctxSafe;
    const o = ctx.createOscillator();
    o.type = wave;
    o.frequency.setValueAtTime(freq, t);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g);
    g.connect(audio.music);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  stop(): void {
    for (const id of this.timers) clearInterval(id);
    this.timers = [];
    this.current = '';
  }

  stinger(kind: 'victory' | 'gameover'): void {
    const ctx = audio.ctxSafe;
    const t0 = ctx.currentTime + 0.02;
    const seq = kind === 'victory'
      ? [N.C4, N.E4, N.G4, N.C5]
      : [N.C4, N.A3, N.F3, N.D3];
    seq.forEach((f, i) => this.note(f, t0 + i * 0.18, 0.3, 'square', 0.22));
  }
}

export const music = new MusicPlayer();
