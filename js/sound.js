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
  // a lit fuse: a short hissing fizz
  fuse() { if (this.ready) this.noiseBurst({ type: 'highpass', freq: 4200, q: 0.6, dur: 0.5, vol: 0.25 }, 1, 1); }

  // an explosion: a deep thump under a long rumble of noise
  boom(gain = 1) {
    if (!this.ready) return;
    this.tone(70, 0.6, 0.9 * gain, 'sine', 30);
    this.noiseBurst({ type: 'lowpass', freq: 600, q: 0.5, dur: 1.2, vol: 1.1 }, gain, 1);
    this.noiseBurst({ type: 'bandpass', freq: 1800, q: 0.7, dur: 0.35, vol: 0.6 }, gain, 1);
  }

  // thunder: a sharp crack when it's close, then a long low rumble (gain falls off with distance)
  thunder(gain = 1, near = false) {
    if (!this.ready || gain <= 0.01) return;
    if (near) this.noiseBurst({ type: 'highpass', freq: 1500, q: 0.4, dur: 0.4, vol: 0.9 }, gain, 1);
    this.tone(55, 1.4, 0.5 * gain, 'sine', 32);
    for (let i = 0; i < 4; i++) setTimeout(() => this.noiseBurst({ type: 'lowpass', freq: 260 + Math.random() * 160, q: 0.4, dur: 1.4, vol: 0.9 - i * 0.15 }, gain, 1), i * 380 + Math.random() * 200);
  }
  // fire crackling
  crackle(gain = 1) { if (this.ready && gain > 0.01) this.noiseBurst({ type: 'bandpass', freq: 2400, q: 1.5, dur: 0.08, vol: 0.25 }, gain, 1 + Math.random() * 0.5); }

  // a steam locomotive: a puff of steam, and its whistle
  chuff(gain = 1) { if (this.ready && gain > 0.01) this.noiseBurst({ type: 'bandpass', freq: 700, q: 0.7, dur: 0.18, vol: 0.35 }, gain, 1); }
  hoot(gain = 1) {
    if (!this.ready || gain <= 0.01) return;
    for (const [f, v] of [[587, 0.12], [740, 0.09], [880, 0.06]]) this.voice({ type: 'triangle', from: f, to: f * 0.99, dur: 0.9, vol: v * gain, freq: 3000, attack: 0.04 });
  }

  // a village bell: a bright strike with a long ring
  ding(gain = 1) {
    if (!this.ready || gain <= 0.01) return;
    for (const [f, v] of [[880, 0.25], [1320, 0.12], [2210, 0.06]]) this.voice({ type: 'sine', from: f, to: f * 0.998, dur: 2.2, vol: v * gain, freq: 6000, attack: 0.005 });
  }

  // A reactor's alarm: a two-tone whoop, louder the nearer (k: 0..1).
  alarm(k = 1) {
    if (!this.ready || k <= 0) return;
    this.voice({ type: 'square', from: 620, to: 920, dur: 0.35, vol: 0.12 * k, freq: 2200, attack: 0.01 });
    setTimeout(() => this.voice({ type: 'square', from: 920, to: 620, dur: 0.35, vol: 0.12 * k, freq: 2200, attack: 0.01 }), 380);
  }

  // A chainsaw biting into wood: a rasping buzz.
  saw() {
    if (!this.ready) return;
    this.voice({ type: 'sawtooth', from: 140, to: 110, dur: 0.22, vol: 0.12, freq: 1800, q: 2 });
  }

  pop() { if (this.ready) this.tone(520 + Math.random() * 80, 0.09, 0.2, 'square', 900); }

  click() { if (this.ready) this.tone(800, 0.04, 0.08, 'square'); }

  // a geiger counter's click
  geiger() { if (this.ready) this.tone(1800 + Math.random() * 600, 0.008, 0.12, 'square'); }

  // an electric zap: a tesla coil's bolt, or an electric fence
  zap(gain = 1) {
    if (!this.ready) return;
    this.voice({ type: 'sawtooth', from: 900, to: 180, dur: 0.16, vol: 0.14 * gain, filter: 'highpass', freq: 400, q: 1, vibrato: 60 });
  }

  // Bow release: a twang that's higher and louder the further the bow was drawn.
  bow(power = 1) {
    if (!this.ready) return;
    this.voice({ type: 'triangle', from: 260 + power * 160, to: 120, dur: 0.18, vol: 0.25 + power * 0.25, freq: 2400, q: 1 });
    this.noiseBurst({ type: 'highpass', freq: 2500, q: 0.7, dur: 0.08, vol: 0.25 }, 1, 1);
  }

  // An arrow thunking into a block.
  arrowHit() {
    if (!this.ready) return;
    this.noiseBurst({ type: 'bandpass', freq: 500, q: 1.5, dur: 0.08, vol: 0.6 }, 1, 1);
    this.voice({ type: 'triangle', from: 180, to: 90, dur: 0.1, vol: 0.25, freq: 800 });
  }

  // The player gets hurt: a low thump and a short grunt.
  hurt() {
    if (!this.ready) return;
    this.noiseBurst({ type: 'lowpass', freq: 300, q: 0.8, dur: 0.15, vol: 0.8 }, 1, 1);
    this.voice({ type: 'sawtooth', from: 210, to: 140, dur: 0.16, vol: 0.22, freq: 900, q: 1.5 });
  }

  // Gulping something nasty.
  gulp() {
    if (!this.ready) return;
    for (let i = 0; i < 3; i++) {
      this.voice({ type: 'sine', from: 320 - i * 40, to: 160, dur: 0.12, vol: 0.3, freq: 1200, delay: i * 0.16 });
    }
  }

  // A wooden door swinging open or shut.
  door(open) {
    if (!this.ready) return;
    this.voice({ type: 'triangle', from: open ? 180 : 140, to: open ? 120 : 90, dur: 0.18, vol: 0.35, freq: 900, q: 2 });
    this.noiseBurst({ type: 'bandpass', freq: 450, q: 1.5, dur: 0.1, vol: 0.5 }, 1, 1);
  }

  // A curtain being drawn.
  swish() {
    if (this.ready) this.noiseBurst({ type: 'bandpass', freq: 2200, q: 0.6, dur: 0.35, vol: 0.3 }, 1, 1);
  }

  // Waking up after sleeping: a soft rising chime.
  wake() {
    if (!this.ready) return;
    [523, 659, 784].forEach((f, i) => this.voice({ type: 'sine', from: f, to: f, dur: 0.6, vol: 0.18, freq: 4000, delay: i * 0.18, attack: 0.05 }));
  }

  // Pouring fuel into a lamp.
  pour() {
    if (!this.ready) return;
    this.noiseBurst({ type: 'lowpass', freq: 900, q: 0.8, dur: 0.5, vol: 0.4 }, 1, 0.7);
    this.voice({ type: 'sine', from: 260, to: 180, dur: 0.4, vol: 0.12, freq: 900 });
  }

  // A thornspitter spitting a thorn.
  spit() {
    if (!this.ready) return;
    this.voice({ type: 'sine', from: 420, to: 120, dur: 0.09, vol: 0.35, freq: 1500 });
    this.noiseBurst({ type: 'bandpass', freq: 1200, q: 1, dur: 0.06, vol: 0.3 }, 1, 1);
  }

  // A night creature defeated, or dissolving into shadow.
  poof() {
    if (!this.ready) return;
    this.noiseBurst({ type: 'lowpass', freq: 700, q: 0.7, dur: 0.45, vol: 0.5 }, 1, 0.8);
    this.voice({ type: 'sine', from: 300, to: 90, dur: 0.35, vol: 0.18, freq: 1000 });
  }

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
    } else if (kind === 'gloomling') {
      // a breathy, wavering whisper; a thin shriek when hit
      if (hurt) this.voice({ type: 'square', from: p(900, 1000), to: 560, dur: 0.16, vol: 0.18 * gain, freq: 2500 });
      else {
        this.noiseBurst({ type: 'bandpass', freq: 2800, q: 2, dur: 0.45, vol: 0.3 * gain }, 1, 1);
        this.voice({ type: 'sine', from: p(560, 640), to: p(380, 420), dur: 0.5, vol: 0.14 * gain, freq: 1500, vibrato: 30, attack: 0.08 });
      }
    } else if (kind === 'mossback') {
      // a deep grinding rumble
      const f = hurt ? p(70, 80) : p(46, 54);
      this.voice({ from: f, to: f * 0.8, dur: hurt ? 0.35 : 0.9, vol: 0.7 * gain, freq: 220, q: 3, attack: 0.1 });
      this.noiseBurst({ type: 'lowpass', freq: 260, q: 1, dur: hurt ? 0.3 : 0.7, vol: 0.5 * gain }, 1, 1);
    } else if (kind === 'thornspitter') {
      // a dry rattle of thorns
      const n = hurt ? 2 : 5;
      for (let i = 0; i < n; i++) setTimeout(() => this.ready && this.noiseBurst({ type: 'highpass', freq: 3500, q: 1, dur: 0.03, vol: 0.35 * gain }, 1, 1), i * 45);
      if (hurt) this.voice({ type: 'triangle', from: 1200, to: 700, dur: 0.12, vol: 0.15 * gain, freq: 3000 });
    } else if (kind === 'mossking') {
      const f = hurt ? p(52, 60) : p(34, 40);
      this.voice({ from: f, to: f * 0.7, dur: hurt ? 0.5 : 1.3, vol: 0.9 * gain, freq: 180, q: 3, attack: 0.15 });
      this.noiseBurst({ type: 'lowpass', freq: 200, q: 1, dur: hurt ? 0.4 : 1, vol: 0.6 * gain }, 1, 1);
    } else if (kind === 'wolf') {
      // a yip, or a short howl
      if (hurt || Math.random() < 0.6) this.voice({ type: 'triangle', from: p(700, 800), to: p(1000, 1100), dur: 0.12, vol: 0.25 * gain, freq: 2500 });
      else this.voice({ type: 'sine', from: p(420, 460), to: p(640, 700), dur: 1.1, vol: 0.22 * gain, freq: 1800, attack: 0.2, vibrato: 8 });
    } else if (kind === 'cat') {
      // a meow (rising then falling), or a hiss when bumped
      if (hurt) this.noiseBurst({ type: 'highpass', freq: 2500, q: 1, dur: 0.3, vol: 0.25 * gain }, 1, 1);
      else this.voice({ type: 'triangle', from: p(500, 560), to: p(720, 800), dur: 0.45, vol: 0.2 * gain, freq: 2400, attack: 0.06, vibrato: 6 });
    } else if (kind === 'chicken') {
      // a few quick clucks
      for (const delay of hurt ? [0, 0.08, 0.16] : [0, 0.12]) this.voice({ type: 'square', from: p(620, 700), to: p(420, 480), dur: 0.07, vol: 0.12 * gain, freq: 1800, q: 2, delay });
    } else if (kind === 'deer') {
      // a soft nasal bleat; a sharp bark when startled
      if (hurt || gain > 0.55) this.voice({ type: 'sawtooth', from: p(520, 580), to: p(380, 420), dur: 0.14, vol: 0.14 * gain, freq: 1400, q: 2 });
      else this.voice({ type: 'triangle', from: p(600, 660), to: p(480, 520), dur: 0.35, vol: 0.12 * gain, freq: 1600, attack: 0.05, vibrato: 10 });
    } else if (kind === 'owl') {
      // hoo, hoo-hoo
      for (const [delay, dur] of [[0, 0.32], [0.55, 0.16], [0.75, 0.4]]) this.voice({ type: 'sine', from: p(370, 390), to: p(330, 345), dur, vol: 0.2 * gain, freq: 900, attack: 0.05, delay });
    } else if (kind === 'bat') {
      // a few tiny squeaks
      for (const delay of [0, 0.07, 0.15]) this.voice({ type: 'square', from: p(3200, 3600), to: p(2600, 2800), dur: 0.03, vol: 0.05 * gain, freq: 5000, delay });
    } else if (kind === 'crow') {
      // a harsh caw or two
      for (const delay of [0, 0.3]) this.voice({ type: 'sawtooth', from: p(560, 640), to: p(380, 420), dur: 0.2, vol: 0.16 * gain, freq: 1500, q: 3, delay, vibrato: 30 });
    } else if (kind === 'pig') {
      // a snuffly grunt; a squeal when bumped
      if (hurt) this.voice({ type: 'sawtooth', from: p(900, 1000), to: 1400, dur: 0.3, vol: 0.18 * gain, freq: 2200 });
      else this.voice({ type: 'sawtooth', from: p(150, 170), to: p(110, 120), dur: 0.22, vol: 0.3 * gain, freq: 700, q: 2, vibrato: 25 });
    } else if (kind === 'camel') {
      const f = hurt ? p(150, 170) : p(110, 130);
      this.voice({ from: f, to: f * 0.7, dur: hurt ? 0.3 : 0.7, vol: 0.45 * gain, freq: 600, q: 2, attack: 0.05, vibrato: 18 });
    } else if (kind === 'trader') {
      // a cheerful hum
      this.voice({ type: 'triangle', from: p(240, 270), to: p(320, 350), dur: 0.35, vol: 0.18 * gain, freq: 1600 });
      this.voice({ type: 'triangle', from: p(320, 350), to: p(260, 280), dur: 0.3, vol: 0.18 * gain, freq: 1600, delay: 0.32 });
    } else if (kind === 'villager') {
      // a thoughtful "hmm"
      this.voice({ type: 'triangle', from: p(170, 200), to: p(140, 160), dur: 0.4, vol: 0.2 * gain, freq: 1200, attack: 0.05 });
    } else if (kind === 'bee') {
      this.voice({ type: 'sawtooth', from: p(210, 240), to: p(200, 250), dur: 0.5, vol: 0.05 * gain, freq: 900, vibrato: 40, attack: 0.08 });
    } else if (kind === 'spider') {
      // a dry clicking chitter
      const n = hurt ? 2 : 4;
      for (let i = 0; i < n; i++) setTimeout(() => this.ready && this.noiseBurst({ type: 'bandpass', freq: 4200, q: 4, dur: 0.025, vol: 0.3 * gain }, 1, 1), i * 70);
      if (hurt) this.voice({ type: 'square', from: 1500, to: 900, dur: 0.1, vol: 0.12 * gain, freq: 3500 });
    } else if (kind === 'dunewarden') {
      // grinding sandstone and a hiss of sand
      const f = hurt ? p(60, 70) : p(40, 46);
      this.voice({ from: f, to: f * 0.75, dur: hurt ? 0.4 : 1.1, vol: 0.8 * gain, freq: 200, q: 3, attack: 0.12 });
      this.noiseBurst({ type: 'highpass', freq: 2500, q: 1, dur: hurt ? 0.3 : 0.9, vol: 0.35 * gain }, 1, 1);
    } else if (kind === 'frostwraith') {
      // a cold, hollow wail
      this.voice({ type: 'sine', from: hurt ? p(900, 1000) : p(520, 580), to: hurt ? 600 : p(300, 340), dur: hurt ? 0.4 : 1.4, vol: 0.3 * gain, freq: 2200, vibrato: 25, attack: 0.2 });
      this.noiseBurst({ type: 'bandpass', freq: 3200, q: 2, dur: 0.8, vol: 0.2 * gain }, 1, 1);
    } else if (kind === 'emberlord') {
      // a roar over the crackle of fire
      const f = hurt ? p(70, 80) : p(48, 56);
      this.voice({ type: 'sawtooth', from: f, to: f * 0.7, dur: hurt ? 0.5 : 1.2, vol: 0.6 * gain, freq: 300, q: 2, attack: 0.1 });
      for (let i = 0; i < 6; i++) setTimeout(() => this.ready && this.noiseBurst({ type: 'highpass', freq: 1800, q: 1, dur: 0.04, vol: 0.25 * gain }, 1, 1), i * 90 + Math.random() * 40);
    } else if (kind === 'newt') {
      this.voice({ type: 'sine', from: p(2400, 2700), to: p(3100, 3400), dur: hurt ? 0.1 : 0.06, vol: 0.12 * gain, freq: 6000 });
    }
  }

  // The hum of machinery nearby: a low drone for turning shafts and machines (mech), and a higher mains
  // buzz for electricity (elec), each 0..1.
  hum(mech, elec) {
    if (!this.ctx) return;
    if (!this.humNodes) {
      const c = this.ctx, mk = (type, freq, cut) => {
        const o = c.createOscillator(); o.type = type; o.frequency.value = freq;
        const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = cut;
        const g = c.createGain(); g.gain.value = 0;
        o.connect(f); f.connect(g); g.connect(this.master); o.start();
        return g;
      };
      this.humNodes = { mech: mk('sawtooth', 46, 160), elec: mk('square', 100, 420) };
    }
    const t = this.ctx.currentTime;
    this.humNodes.mech.gain.setTargetAtTime(this.muted ? 0 : mech * 0.07, t, 0.5);
    this.humNodes.elec.gain.setTargetAtTime(this.muted ? 0 : elec * 0.025, t, 0.5);
  }

  // A steady hiss of rain (or the wind of a sandstorm), faded in and out: level 0..1.
  weather(level, kind = 'rain') {
    if (!this.ctx) return;
    if (!this.rain) {
      const src = this.ctx.createBufferSource();
      src.buffer = this.noise; src.loop = true;
      const f = this.ctx.createBiquadFilter();
      const g = this.ctx.createGain(); g.gain.value = 0;
      src.connect(f); f.connect(g); g.connect(this.master);
      src.start();
      this.rain = { f, g };
    }
    const sand = kind === 'sand', snow = kind === 'snow', hail = kind === 'hail';
    this.rain.f.type = sand || hail ? 'bandpass' : 'lowpass';
    this.rain.f.frequency.value = sand ? 700 : snow ? 500 : hail ? 3800 : 2600;
    const want = this.muted ? 0 : level * (snow ? 0.08 : sand ? 0.25 : 0.18);
    this.rain.g.gain.setTargetAtTime(want, this.ctx.currentTime, 0.4);
  }
}
