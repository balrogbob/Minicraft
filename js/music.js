// Music, made up as it plays (Web Audio, no files). Every so often a quiet piece starts: a few minutes of
// soft chords with a wandering tune over them, then a long rest before the next one. What it sounds like
// follows where you are and when: bright by day, hushed at night, sparse and echoing in caves, floating
// underwater, bouncy in a village and livelier still at a festival. Winter rings with bells.

// Scales, as semitones above the key note.
const SCALES = {
  major: [0, 2, 4, 5, 7, 9, 11], dorian: [0, 2, 3, 5, 7, 9, 10], phrygian: [0, 1, 3, 5, 7, 8, 10], lydian: [0, 2, 4, 6, 7, 9, 11],
  mixolydian: [0, 2, 4, 5, 7, 9, 10], minor: [0, 2, 3, 5, 7, 8, 10],
};
// Each mood: scale; tempo; how busy the tune is (0..1); its voices; chord progressions (scale degrees, a bar
// each); how much echo; the octave the tune sits in; and how long a piece runs (bars).
export const MOODS = {
  day: { scale: 'major', bpm: 76, busy: 0.5, lead: 'pluck', pad: 'warm', bass: true, progs: [[0, 4, 5, 3], [0, 5, 3, 4], [0, 3, 0, 4], [5, 3, 0, 4]], wet: 0.3, oct: 72, bars: [16, 28] },
  night: { scale: 'dorian', bpm: 58, busy: 0.3, lead: 'bell', pad: 'dark', bass: false, progs: [[0, 3, 0, 4], [0, 6, 3, 0], [0, 2, 3, 4]], wet: 0.45, oct: 72, bars: [12, 20] },
  cave: { scale: 'phrygian', bpm: 46, busy: 0.18, lead: 'bell', pad: 'drone', bass: false, progs: [[0, 1, 0, 6], [0, 0, 1, 0]], wet: 0.65, oct: 60, bars: [10, 16] },
  water: { scale: 'lydian', bpm: 60, busy: 0.4, lead: 'flute', pad: 'warm', bass: false, progs: [[0, 1, 0, 4], [0, 4, 1, 0]], wet: 0.6, oct: 72, bars: [12, 20] },
  village: { scale: 'mixolydian', bpm: 96, busy: 0.6, lead: 'pluck', pad: 'warm', bass: true, progs: [[0, 6, 3, 0], [0, 3, 4, 0], [0, 4, 6, 3]], wet: 0.25, oct: 72, bars: [16, 24] },
  festival: { scale: 'major', bpm: 116, busy: 0.75, lead: 'pluck', pad: 'warm', bass: true, drums: true, progs: [[0, 3, 4, 0], [0, 5, 3, 4], [3, 4, 0, 0]], wet: 0.25, oct: 72, bars: [16, 32] },
  winter: { scale: 'minor', bpm: 64, busy: 0.35, lead: 'bell', pad: 'warm', bass: false, progs: [[0, 5, 2, 6], [0, 3, 6, 2]], wet: 0.5, oct: 79, bars: [12, 20] },
};
const REST = [50, 150]; // seconds of quiet between pieces
const FIRST_REST = [6, 14];
const FADE = 3;

const hz = (midi) => 440 * 2 ** ((midi - 69) / 12);
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const between = ([a, b]) => a + Math.random() * (b - a);

export class Music {
  constructor(sound) {
    this.sound = sound;
    this.volume = 0.5;
    this.mood = 'day';
    this.piece = null;
    this.rest = between(FIRST_REST);
    this.out = null;
  }

  // The output chain: notes -> bus -> (dry + echo) -> out -> speakers. Built on first use, once audio's allowed.
  setup() {
    const c = this.sound.ctx;
    this.out = c.createGain();
    this.out.gain.value = 0;
    this.out.connect(c.destination);
    this.bus = c.createGain();
    this.bus.connect(this.out);
    this.verb = c.createConvolver();
    this.verb.buffer = this.impulse(2.8);
    this.wet = c.createGain();
    this.wet.gain.value = 0.3;
    this.bus.connect(this.verb).connect(this.wet).connect(this.out);
  }

  // A made-up room: noise that dies away, for the echo.
  impulse(secs) {
    const c = this.sound.ctx, n = Math.floor(c.sampleRate * secs), b = c.createBuffer(2, n, c.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = b.getChannelData(ch);
      for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n) ** 3;
    }
    return b;
  }

  get level() { return this.sound.muted ? 0 : this.sound.volume * this.volume * 0.8; }

  // Call every frame with the mood that suits where the player is. (v44) `record`: { mood, gain } while a record
  // player is playing nearby: its music plays on and on (even with the music turned off), louder the closer you are.
  update(dt, mood, record = null) {
    const c = this.sound.ctx;
    if (!c || c.state !== 'running') return;
    if (!this.out) this.setup();
    const p = this.piece;
    const gain = record ? (this.sound.muted ? 0 : this.sound.volume * 0.8 * Math.max(this.volume, 0.5) * record.gain) : this.level;
    this.out.gain.setTargetAtTime(gain, c.currentTime, 0.3);
    if (record) mood = record.mood;
    if (mood && MOODS[mood]) this.mood = mood;
    if (this.volume <= 0 && !record) { this.piece = null; return; }
    if (!p) {
      if (record || (this.rest -= dt) <= 0) { this.start(this.mood); this.piece.record = !!record; }
      return;
    }
    // a record put on (or changed, or taken off): straight over to it, or back to the usual quiet
    if (!p.fading && (record ? p.mood !== this.mood || !p.record : p.record)) this.fadeOut(record ? 0.2 : between(FIRST_REST));
    // somewhere quite different (into a cave, under water): let this piece go and start one that fits soon
    else if (p.mood !== this.mood && !p.fading && moodGap(p.mood, this.mood)) this.fadeOut(8 + Math.random() * 8);
    this.schedule(c.currentTime + 0.6);
    if (c.currentTime >= p.end) { this.piece = null; this.rest = p.fading ? p.after : between(REST); }
  }

  start(mood) {
    const c = this.sound.ctx, M = MOODS[mood];
    this.wet.gain.setTargetAtTime(M.wet, c.currentTime, 0.5);
    const bars = Math.round(between(M.bars) / 4) * 4;
    this.piece = {
      mood, M, key: 48 + Math.floor(Math.random() * 10), scale: SCALES[M.scale], prog: pick(M.progs), step: 60 / M.bpm / 2,
      bars, bar: 0, s: 0, t: c.currentTime + 0.1, end: Infinity, last: 4 + Math.floor(Math.random() * 3), motif: null,
    };
    this.piece.end = this.piece.t + bars * 8 * this.piece.step + 3;
  }

  fadeOut(after) {
    const p = this.piece, c = this.sound.ctx;
    p.fading = true; p.after = after;
    p.end = Math.min(p.end, c.currentTime + FADE);
    p.fadeAt = c.currentTime;
  }

  // Lay down the notes due before `until`, an eighth-note step at a time.
  schedule(until) {
    const p = this.piece, M = p.M;
    while (p.t < until && p.bar < p.bars) {
      const t = p.t, step = p.s, beat = step % 8;
      if (p.fading && t > p.end) break;
      const fade = p.fading ? Math.max(0, 1 - (t - p.fadeAt) / FADE) : 1;
      const lastBars = p.bars - p.bar;
      const g = fade * (lastBars <= 2 ? 0.6 + 0.2 * lastBars : 1) * (p.bar < 1 ? 0.75 : 1);
      const deg = lastBars === 1 ? 0 : p.prog[p.bar % p.prog.length]; // home at the end
      const chord = [0, 2, 4].map((k) => this.note(p, deg + k, 0));
      if (beat === 0) this.pad(M.pad, chord, t, p.step * 8, g);
      if (M.bass && (beat === 0 || (beat === 4 && Math.random() < 0.7))) this.voice('bass', chord[0] - 12, t, p.step * 3, 0.5 * g);
      if (M.drums) { if (beat % 2 === 0) this.tick(t, beat === 0 ? 0.5 : 0.25, g); if (beat === 4) this.tick(t, 0.6, g, true); }
      // the tune: a short phrase of two bars, then it breathes; it comes back now and then
      const inPhrase = !(p.bar % 2 === 1 && beat >= 5);
      const strong = beat === 0 || beat === 4;
      if (inPhrase && Math.random() < M.busy * (strong ? 1.4 : 0.8)) {
        p.last = this.nextNote(p, chord, strong);
        const len = p.step * (Math.random() < 0.3 ? 2 : 1) * (M.lead === 'bell' ? 3 : 1.4);
        this.voice(M.lead, this.note(p, p.last, M.oct - 60), t, len, (strong ? 0.42 : 0.32) * g);
      }
      p.t += p.step * (beat % 2 === 0 ? 1.04 : 0.96); // a little swing
      p.s++;
      if (p.s % 8 === 0) p.bar++;
    }
  }

  // The midi note of scale degree d (any whole number: wraps into octaves) in the piece's key.
  note(p, d, octUp) {
    const n = p.scale.length, o = Math.floor(d / n);
    return p.key + octUp + o * 12 + p.scale[((d % n) + n) % n];
  }

  // The next tune note, as a scale degree: mostly steps, now and then a leap; on strong beats it leans
  // to the notes of the chord.
  nextNote(p, chord, strong) {
    let d = p.last + pick([-1, -1, 1, 1, -2, 2, 0, 3, -3]);
    d = Math.max(0, Math.min(11, d));
    if (strong) {
      const tones = [0, 2, 4, 7, 9, 11].map((k) => k + p.prog[p.bar % p.prog.length]).filter((x) => x >= 0 && x <= 11);
      d = tones.reduce((a, b) => (Math.abs(b - d) < Math.abs(a - d) ? b : a), d);
    }
    return d;
  }

  // ---- voices ----
  env(t, attack, hold, release, peak) {
    const g = this.sound.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(peak, t + attack);
    g.gain.setValueAtTime(peak, t + attack + hold);
    g.gain.exponentialRampToValueAtTime(0.0001, t + attack + hold + release);
    g.connect(this.bus);
    return g;
  }
  osc(type, f, t, stop, to, detune = 0) {
    const o = this.sound.ctx.createOscillator();
    o.type = type; o.frequency.value = f; o.detune.value = detune;
    o.connect(to); o.start(t); o.stop(stop);
    return o;
  }

  voice(kind, midi, t, len, vol) {
    if (vol <= 0.001) return;
    const c = this.sound.ctx, f = hz(midi);
    if (kind === 'pluck') {
      const g = this.env(t, 0.005, 0, len + 0.3, vol * 0.35);
      const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 2;
      lp.frequency.setValueAtTime(f * 6, t); lp.frequency.exponentialRampToValueAtTime(f * 1.2, t + len + 0.2);
      lp.connect(g);
      this.osc('triangle', f, t, t + len + 0.4, lp);
      this.osc('sawtooth', f, t, t + len + 0.4, lp, 6);
    } else if (kind === 'bell') {
      const g = this.env(t, 0.004, 0, len + 1.5, vol * 0.3);
      this.osc('sine', f, t, t + len + 1.6, g);
      const g2 = this.env(t, 0.004, 0, 0.6, vol * 0.08);
      this.osc('sine', f * 2.76, t, t + 0.7, g2);
    } else if (kind === 'flute') {
      const g = this.env(t, 0.08, len * 0.6, len * 0.6 + 0.2, vol * 0.25);
      const o = this.osc('sine', f, t, t + len * 1.3 + 0.3, g);
      const lfo = c.createOscillator(), depth = c.createGain();
      lfo.frequency.value = 5; depth.gain.value = f * 0.006;
      lfo.connect(depth).connect(o.frequency); lfo.start(t); lfo.stop(t + len * 1.3 + 0.3);
    } else if (kind === 'bass') {
      const g = this.env(t, 0.01, len * 0.5, len * 0.5, vol * 0.4);
      const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 420; lp.connect(g);
      this.osc('triangle', f, t, t + len + 0.1, lp);
    }
  }

  // A chord held for a bar, softly.
  pad(kind, chord, t, len, vol) {
    if (vol <= 0.001) return;
    const c = this.sound.ctx;
    const g = this.env(t, len * 0.35, len * 0.35, len * 0.6, vol * (kind === 'drone' ? 0.07 : 0.05));
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = kind === 'dark' ? 600 : kind === 'drone' ? 400 : 900; lp.connect(g);
    const notes = kind === 'drone' ? [chord[0] - 12, chord[0] - 5] : chord.map((n) => n - (kind === 'dark' ? 12 : 0));
    for (const n of notes) for (const det of [-7, 7]) this.osc(kind === 'warm' ? 'triangle' : 'sawtooth', hz(n), t, t + len * 1.35, lp, det);
  }

  // A light drum: a tick of noise (or a thump).
  tick(t, vol, g, low = false) {
    const c = this.sound.ctx, s = this.sound;
    if (!s.noise) return;
    const src = c.createBufferSource(); src.buffer = s.noise;
    const f = c.createBiquadFilter(); f.type = low ? 'lowpass' : 'highpass'; f.frequency.value = low ? 180 : 6000;
    const e = this.env(t, 0.002, 0, low ? 0.18 : 0.05, vol * g * (low ? 0.6 : 0.12));
    src.connect(f).connect(e);
    src.start(t, Math.random() * 0.5, 0.25);
  }
}

// Is this a big enough change of scene to cut a piece short? (Day to night can wait for the next one.)
function moodGap(a, b) {
  const indoor = (m) => (m === 'cave' || m === 'water' ? m : 'out');
  return indoor(a) !== indoor(b) || (b === 'festival') !== (a === 'festival');
}
