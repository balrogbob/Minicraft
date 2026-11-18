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
  wool: { type: 'lowpass', freq: 700, q: 0.5, dur: 0.12, vol: 0.45 },
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

  // Three quick crunches.
  eat() {
    if (!this.ready) return;
    for (let i = 0; i < 3; i++) {
      setTimeout(() => this.ready && this.noiseBurst({ type: 'bandpass', freq: 1800, q: 1.2, dur: 0.07, vol: 0.5 }, 1, 0.8 + i * 0.15), i * 110);
    }
  }

  // A filtered oscillator with a pitch glide and an attack/decay envelope.
  voice({ type = 'sawtooth', from, to, dur, vol, filter = 'lowpass', freq = 2000, q = 1, attack = 0.01, delay = 0, vibrato = 0 }) {
    const c = this.ctx, t = c.currentTime + delay;
    const o = c.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(from, t);
    o.frequency.exponentialRampToValueAtTime(to, t + dur);
    if (vibrato) {
      const lfo = c.createOscillator(), depth = c.createGain();
      lfo.frequency.value = 6;
      depth.gain.value = vibrato;
      lfo.connect(depth).connect(o.frequency);
      lfo.start(t);
      lfo.stop(t + dur + 0.05);
    }
    const f = c.createBiquadFilter();
    f.type = filter;
    f.frequency.value = freq;
    f.Q.value = q;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(f).connect(g).connect(this.master);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  // Animal calls. `gain` scales with distance; `hurt` is the sound when the animal is bumped.
  mob(kind, gain = 1, hurt = false) {
    if (!this.ready || gain <= 0.01) return;
    const p = (a, b) => a + Math.random() * (b - a);
    if (kind === 'duck') {
      // two nasal quacks
      const f = hurt ? p(650, 750) : p(480, 560);
      for (const delay of hurt ? [0] : [0, 0.17]) {
        this.voice({ from: f, to: f * 0.72, dur: 0.13, vol: 0.35 * gain, filter: 'bandpass', freq: 1300, q: 3, delay });
      }
    } else if (kind === 'buffalo') {
      const f = hurt ? p(115, 130) : p(85, 100);
      this.voice({ from: f, to: f * 0.8, dur: hurt ? 0.3 : 0.8, vol: 0.55 * gain, freq: 420, q: 2, attack: 0.08 });
    } else if (kind === 'yak') {
      // yaks grunt rather than moo
      const f = hurt ? p(92, 102) : p(66, 76);
      this.voice({ from: f, to: f * 0.75, dur: hurt ? 0.25 : 0.5, vol: 0.6 * gain, freq: 340, q: 2.5, attack: 0.04 });
    } else if (kind === 'alpaca') {
      // alpacas hum; a bumped one gives a short high squeak
      if (hurt) this.voice({ type: 'triangle', from: p(900, 1000), to: 620, dur: 0.22, vol: 0.3 * gain, freq: 3000 });
      else this.voice({ type: 'sine', from: p(280, 320), to: p(330, 360), dur: 0.65, vol: 0.28 * gain, freq: 1500, attack: 0.12, vibrato: 12 });
    } else if (kind === 'newt') {
      this.voice({ type: 'sine', from: p(2400, 2700), to: p(3100, 3400), dur: hurt ? 0.1 : 0.06, vol: 0.12 * gain, freq: 6000 });
    }
  }
}
