// Bee breeding (v31). A bee house holds a princess, a drone and up to two frames. The princess and a drone
// make a queen, who works through her life in spells of BEE_SPELL seconds: each spell she fills the frames with
// combs (more with frames in). When her life is over she leaves a new princess and some drones in the trays.
// Each of them takes after one parent or the other, unless the parents are a pair that can mutate, when now
// and then it's the new species instead. Mating a princess and a drone of the same species breeds true.
//
// A queen only works when the place suits her species (see BEE_SPECIES in blocks.js): the right flowers nearby,
// the right time of day, the right climate, and no rain on the house (for most).
import {
  BEE_SPECIES, BEE_MUTATIONS, BEE_FRAMES, beeOf, princessOf, droneOf, isFlower, maxStack,
  CACTUS, SNOW, SNOW_LAYER, SNOW_GRASS, ICE, PACKED_ICE, LAVA, GLOW_MUSHROOM, FRUIT_LEAVES,
} from './blocks.js';

export const BEE_SPELL = 30; // seconds of work a spell takes, at speed 1
const RANGE = 5; // how far the bees look for their flowers
const LOOK_AGAIN = 20; // seconds before a bee house looks around for flowers again

const FLOWERS = {
  flowers: isFlower,
  cactus: (id) => id === CACTUS,
  fruit: (id) => id >= FRUIT_LEAVES && id < FRUIT_LEAVES + 6,
  snow: (id) => id === SNOW || id === SNOW_LAYER || id === SNOW_GRASS || id === ICE || id === PACKED_ICE,
  lava: (id) => id === LAVA,
  glowcap: (id) => id === GLOW_MUSHROOM,
};

// The species of one young bee from a princess of species a mated with a drone of species b.
export function mateSpecies(a, b, rnd = Math.random) {
  if (a !== b) for (const [p, q, c, chance] of BEE_MUTATIONS) if (((p === a && q === b) || (p === b && q === a)) && rnd() < chance) return c;
  return rnd() < 0.5 ? a : b;
}

// What species a wild hive's colony is: by the land it's in.
export function wildSpecies(biome, rnd = Math.random) {
  const key = biome === 'tundra' ? 'frost' : biome === 'desert' ? 'dune' : rnd() < 0.5 ? 'woodland' : 'meadow';
  return BEE_SPECIES.findIndex((s) => s.key === key);
}

const key = (x, y, z) => `${x},${y},${z}`;

export class Apiculture {
  constructor() {
    this.flowerSeen = new Map(); // "x,y,z" -> { kind, ok, t }
    this.time = 0;
    this.onYoung = null; // (x, y, z, sp, mate, kids: [species...]) when a queen leaves her young
  }

  // Are the queen's flowers within reach of the house?
  flowersNear(world, x, y, z, kind) {
    if (!FLOWERS[kind]) return true;
    const k = key(x, y, z);
    const seen = this.flowerSeen.get(k);
    if (seen && seen.kind === kind && this.time - seen.t < LOOK_AGAIN) return seen.ok;
    let ok = false;
    const is = FLOWERS[kind];
    for (let dy = -2; dy <= 3 && !ok; dy++) for (let dz = -RANGE; dz <= RANGE && !ok; dz++) for (let dx = -RANGE; dx <= RANGE && !ok; dx++) {
      if (is(world.get(x + dx, y + dy, z + dz))) ok = true;
    }
    this.flowerSeen.set(k, { kind, ok, t: this.time });
    return ok;
  }

  // Why a queen of species sp can't work in the house at (x, y, z) right now, or '' if she can.
  // env: { day, raining, season (0 spring .. 3 winter), biome }
  why(world, x, y, z, sp, env) {
    const s = BEE_SPECIES[sp], name = s.name.toLowerCase();
    const sky = world.skyAt(x, y + 1, z);
    if (s.climate === 'cold' && env.biome !== 'tundra' && env.season !== 3) return `It's too warm for ${name} bees: they work in the tundra, or in winter`;
    if (s.climate === 'hot' && env.biome !== 'desert' && env.season !== 1) return `It's too cool for ${name} bees: they work in the desert, or in summer`;
    if (s.time === 'day' && !env.day) return 'The bees are asleep: they work by day';
    if (s.time === 'night' && env.day && sky > 2) return `${s.name} bees work at night, or somewhere dark`;
    if (s.time === 'cave' && sky > 2) return `${s.name} bees only work underground, with no sky over them`;
    if (s.time === 'stars' && (env.day || sky < 14)) return `${s.name} bees only work at night, under the open sky`;
    if (env.raining && !s.rain && sky >= 14) return 'The bees stay in while it rains on the house';
    if (!this.flowersNear(world, x, y, z, s.flower)) {
      const what = { flowers: 'flowers', cactus: 'cactus', fruit: 'fruit trees', snow: 'snow or ice', lava: 'lava', glowcap: 'glowcaps' }[s.flower];
      return `${s.name} bees need ${what} within ${RANGE} blocks`;
    }
    return '';
  }

  // Room in the trays for one more of id?
  room(st, id) {
    const slots = [st.out, ...(st.side ?? [])];
    return slots.some((s) => !s || (s.id === id && s.count < maxStack(id)));
  }
  put(st, id, n) {
    const fits = (s) => s && s.id === id && s.count < maxStack(id);
    while (n > 0) {
      if (fits(st.out)) { st.out.count++; n--; continue; }
      const j = (st.side ?? []).findIndex(fits);
      if (j >= 0) { st.side[j].count++; n--; continue; }
      if (!st.out) { st.out = { id, count: 1 }; n--; continue; }
      const e = (st.side ?? []).indexOf(null);
      if (e < 0) return; // (no room: lost)
      st.side[e] = { id, count: 1 }; n--;
    }
  }

  // A princess and a drone in the house become a queen.
  crown(st) {
    const pi = st.inputs.findIndex((s) => beeOf(s?.id)?.princess);
    const di = st.inputs.findIndex((s) => s && beeOf(s.id) && !beeOf(s.id).princess);
    if (pi < 0 || di < 0) return false;
    const sp = beeOf(st.inputs[pi].id).sp, mate = beeOf(st.inputs[di].id).sp;
    for (const i of [pi, di]) if (--st.inputs[i].count <= 0) st.inputs[i] = null;
    st.queen = { sp, mate, life: BEE_SPECIES[sp].life, work: 0 };
    return true;
  }

  // The frames in the house: [{ i, frame }]
  frames(st) {
    return st.inputs.map((s, i) => (s && BEE_FRAMES[s.id] ? { i, frame: BEE_FRAMES[s.id] } : null)).filter(Boolean);
  }

  // One spell of the queen's work: combs, worn frames, and at the end of her life her young.
  spell(st, x, y, z, rnd) {
    const q = st.queen, s = BEE_SPECIES[q.sp];
    const fr = this.frames(st);
    const mult = 1 + fr.reduce((t, f) => t + f.frame.bonus, 0);
    for (const [comb, p] of s.combs) {
      const e = p * mult;
      const n = Math.floor(e) + (rnd() < e % 1 ? 1 : 0);
      if (n) this.put(st, comb, n);
    }
    st.fu ??= new Array(st.inputs.length).fill(0);
    st.fuOf ??= new Array(st.inputs.length).fill(0);
    for (const { i, frame } of fr) {
      if (st.fuOf[i] !== st.inputs[i].id) { st.fuOf[i] = st.inputs[i].id; st.fu[i] = 0; }
      if (++st.fu[i] >= frame.uses) { st.fu[i] = 0; if (--st.inputs[i].count <= 0) { st.inputs[i] = null; st.fuOf[i] = 0; } }
    }
    if (--q.life > 0) return;
    const kids = [mateSpecies(q.sp, q.mate, rnd)];
    this.put(st, princessOf(kids[0]), 1);
    for (let k = 0; k < s.fertility; k++) {
      const d = mateSpecies(q.sp, q.mate, rnd);
      kids.push(d);
      this.put(st, droneOf(d), 1);
    }
    st.queen = null;
    this.onYoung?.(x, y, z, q.sp, q.mate, kids);
  }

  // Advance every loaded bee house by dt seconds. envAt(x, y, z) gives { day, raining, season, biome } there.
  tick(dt, stations, world, envAt, rnd = Math.random) {
    this.time += dt;
    for (const [k, st] of stations.map) {
      if (st.kind !== 'beehouse') continue;
      const [x, y, z] = k.split(',').map(Number);
      if (!world.chunkAt(x, z) || (stations.owns && !stations.owns(x, z))) continue; // (v39: in multiplayer, the nearest player's game runs it)
      if (!st.queen && !this.crown(st)) { st.bees = 'Put in a princess and a drone'; continue; }
      const env = envAt(x, y, z);
      const why = this.why(world, x, y, z, st.queen.sp, env);
      if (why) { st.bees = why; continue; }
      const s = BEE_SPECIES[st.queen.sp];
      if (!s.combs.some(([c]) => this.room(st, c))) { st.bees = 'The trays are full: take the combs out'; continue; }
      st.queen.work += dt * s.speed * (env.season === 3 && s.climate !== 'cold' ? 0.5 : 1);
      while (st.queen && st.queen.work >= BEE_SPELL) { st.queen.work -= BEE_SPELL; this.spell(st, x, y, z, rnd); }
      st.bees = st.queen ? '' : 'The queen\'s life is over: she has left her young in the trays';
    }
  }

  // A line about the house for its panel.
  status(st) {
    if (st.queen) {
      const s = BEE_SPECIES[st.queen.sp], m = BEE_SPECIES[st.queen.mate];
      const life = `${st.queen.life} spell${st.queen.life === 1 ? '' : 's'} of work left`;
      return `${s.name} queen (mated with a ${m.name.toLowerCase()} drone), ${life}. ${st.bees || 'The bees are at work…'}`;
    }
    return st.bees || 'Put in a princess and a drone';
  }
  // How far through her current spell the queen is (0..1), for the progress bar.
  progress(st) { return st.queen ? Math.min(1, st.queen.work / BEE_SPELL) : 0; }
}

// A queen saved with the world, checked over (or null).
export function cleanQueen(q) {
  if (!q || typeof q !== 'object') return null;
  const sp = q.sp | 0, mate = q.mate | 0;
  if (!BEE_SPECIES[sp] || !BEE_SPECIES[mate]) return null;
  return { sp, mate, life: Math.max(1, Math.min(BEE_SPECIES[sp].life, q.life | 0)), work: Math.max(0, Math.min(BEE_SPELL, +q.work || 0)) };
}
