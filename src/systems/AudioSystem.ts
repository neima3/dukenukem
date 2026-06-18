/**
 * AudioSystem — thin WebAudio wrapper. All sound is synthesized at runtime;
 * no external audio samples are used. Everything here is original.
 */
export class AudioSystem {
  private ctx: AudioContext | null = null;
  private master!: GainNode;
  private sfxBus!: GainNode;
  private musicBus!: GainNode;
  private _muted = false;
  private _sfxVol = 0.6;
  private _musicVol = 0.35;

  init(): void {
    if (this.ctx) return;
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    this.ctx = new Ctx();
    this.master = this.ctx.createGain();
    this.master.gain.value = this._muted ? 0 : 1;
    this.master.connect(this.ctx.destination);

    this.sfxBus = this.ctx.createGain();
    this.sfxBus.gain.value = this._sfxVol;
    this.sfxBus.connect(this.master);

    this.musicBus = this.ctx.createGain();
    this.musicBus.gain.value = this._musicVol;
    this.musicBus.connect(this.master);
  }

  /** Call on first user gesture to satisfy autoplay policies. */
  resume(): void {
    this.init();
    if (this.ctx && this.ctx.state === 'suspended') void this.ctx.resume();
  }

  get ctxSafe(): AudioContext {
    this.init();
    return this.ctx!;
  }
  get sfx(): GainNode { return this.sfxBus; }
  get music(): GainNode { return this.musicBus; }
  get now(): number { return this.ctx ? this.ctx.currentTime : 0; }

  get muted(): boolean { return this._muted; }
  setMuted(m: boolean): void {
    this._muted = m;
    if (this.master) this.master.gain.value = m ? 0 : 1;
  }
  toggleMute(): boolean { this.setMuted(!this._muted); return this._muted; }

  setSfxVolume(v: number): void { this._sfxVol = v; if (this.sfxBus) this.sfxBus.gain.value = v; }
  setMusicVolume(v: number): void { this._musicVol = v; if (this.musicBus) this.musicBus.gain.value = v; }
}

export const audio = new AudioSystem();
