// Procedurally synthesised sound effects (Web Audio, no audio files).
// Each block has a `sound` material: grass, stone, wood, sand, glass, leaves, water.

const PROFILES = {
  //       filter type, centre Hz, Q, duration s, volume, optional low "thump" Hz
  grass: { type: 'bandpass', freq: 1100, q: 0.8, dur: 0.12, vol: 0.5 },
  leaves: { type: 'highpass', freq: 2500, q: 0.7, dur: 0.14, vol: 0.35 },
  sand: { type: 'highpass', freq: 3200, q: 0.5, dur: 0.16, vol: 0.4 },
  stone: { type: 'bandpass', freq: 2300, q: 2.5, dur: 0.07, vol: 0.7, thump: 260 },
  wood: { type: 'bandpass', freq: 520, q: 1.8, dur: 0.1, vol: 0.8, thump: 150 },
  glass: { type: 'bandpass', freq: 3800, q: 4, dur: 0.06, vol: 0.5, thump: 900 },
  water: { type: 'lowpass', freq: 900, q: 0.6, dur: 0.35, vol: 0.5 },
};

export class Sound {
  constructor() {
    this.ctx = null;
    this.volume = 0.7;
    this.muted = false;
  }

  // Browsers only allow audio after a user gesture, so this is called from the first touch/click.
  unlock() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.connect(this.ctx.destination);
      this.applyVolume();
      const len = this.ctx.sampleRate; // 1 s of white noise, reused by every effect
      this.noise = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = this.noise.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  applyVolume() {
    if (this.master) this.master.gain.value = this.muted ? 0 : this.volume;
  }

  get ready() { return this.ctx && this.ctx.state === 'running' && !this.muted && this.volume > 0; }

  noiseBurst(p, gain = 1, pitch = 1) {
    const c = this.ctx, t = c.currentTime;
    const src = c.createBufferSource();
    src.buffer = this.noise;
    src.playbackRate.value = 0.8 + Math.random() * 0.4;
    const f = c.createBiquadFilter();
    f.type = p.type;
    f.frequency.value = p.freq * pitch * (0.85 + Math.random() * 0.3);
    f.Q.value = p.q;
    const g = c.createGain();
    g.gain.setValueAtTime(p.vol * gain, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + p.dur);
    src.connect(f).connect(g).connect(this.master);
    src.start(t, Math.random() * 0.5, p.dur + 0.05);
  }

  tone(freq, dur, vol, type = 'sine', slideTo = 0) {
    const c = this.ctx, t = c.currentTime;
    const o = c.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    const g = c.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g).connect(this.master);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  material(p, gain, pitch) {
    this.noiseBurst(p, gain, pitch);
    if (p.thump) this.tone(p.thump * pitch * (0.9 + Math.random() * 0.2), p.dur * 1.2, 0.25 * gain, 'triangle', p.thump * 0.6);
  }

  // A light tick while a block is being broken.
  dig(kind) { if (this.ready) this.material(PROFILES[kind] ?? PROFILES.stone, 0.45, 1); }

  // The block finally breaks.
  breakBlock(kind) {
    if (!this.ready) return;
    const p = PROFILES[kind] ?? PROFILES.stone;
    if (kind === 'glass') {
      for (let i = 0; i < 5; i++) setTimeout(() => this.ready && this.tone(2200 + Math.random() * 2500, 0.18, 0.12), i * 25);
    }
    this.material({ ...p, dur: p.dur * 1.8 }, 1, 0.85);
  }

  place(kind) { if (this.ready) this.material(PROFILES[kind] ?? PROFILES.stone, 0.8, 0.75); }

  step(kind) { if (this.ready) this.material(PROFILES[kind] ?? PROFILES.grass, 0.3, 0.9); }

  splash(big = true) {
    if (!this.ready) return;
    const p = PROFILES.water;
    this.noiseBurst({ ...p, dur: big ? 0.6 : 0.25, freq: big ? 1200 : 700 }, big ? 1 : 0.35);
  }

  // Soft rising "pop" for crafting / picking things up.
  pop() { if (this.ready) this.tone(520 + Math.random() * 80, 0.09, 0.2, 'square', 900); }

  click() { if (this.ready) this.tone(800, 0.04, 0.08, 'square'); }
}
