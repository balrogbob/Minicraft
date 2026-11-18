// Ovens and smelters: blocks you put items into. While there's fuel burning and the ingredients for a
// recipe, they cook it, a batch at a time, into the output slot.
//
// Each placed station keeps its contents here, keyed by position, and they're saved with the world.
// Like crops and lamps, a station only works while its part of the world is loaded.
import {
  COAL, CHARCOAL, LOG, PLANKS, STICK, COBBLE, STONE, SAND, GLASS,
  FLOUR, SUGAR, BUTTER, MILK_BUCKET, BREAD, COOKIE, CAKE, BLOCKS, maxStack, stationKind,
} from './blocks.js';

// Seconds of burning each fuel gives.
export const FUEL_SECONDS = { [STICK]: 3, [PLANKS]: 8, [LOG]: 15, [COAL]: 40, [CHARCOAL]: 40 };
export const isFuel = (id) => id in FUEL_SECONDS;

// Recipes are tried in order, so put the most specific first (cake before cookies before bread).
// tools: needed in the station but not used up (the milk bucket for cookies).
export const STATION_KINDS = {
  oven: {
    name: 'Oven',
    inputs: 4,
    recipes: [
      { out: [CAKE, 1], in: [[FLOUR, 3], [SUGAR, 3], [BUTTER, 3]], time: 10 },
      { out: [COOKIE, 9], in: [[FLOUR, 3], [SUGAR, 3], [BUTTER, 1]], tools: [MILK_BUCKET], time: 8 },
      { out: [BREAD, 1], in: [[FLOUR, 3]], time: 6 },
    ],
  },
  smelter: {
    name: 'Smelter',
    inputs: 1,
    recipes: [
      { out: [STONE, 1], in: [[COBBLE, 1]], time: 4 },
      { out: [GLASS, 1], in: [[SAND, 1]], time: 4 },
      { out: [CHARCOAL, 1], in: [[LOG, 1]], time: 5 },
    ],
  },
};

const key = (x, y, z) => `${x},${y},${z}`;

export class Stations {
  constructor() {
    this.map = new Map(); // "x,y,z" -> station state
  }

  // The station at a position, created empty the first time it's used.
  get(x, y, z, kind) {
    const k = key(x, y, z);
    let st = this.map.get(k);
    if (!st || st.kind !== kind) {
      st = { kind, inputs: new Array(STATION_KINDS[kind].inputs).fill(null), fuel: null, out: null, burn: 0, burnMax: 0, progress: 0 };
      this.map.set(k, st);
    }
    return st;
  }

  // Remove a station, returning everything that was inside it as [[id, count], ...].
  remove(x, y, z) {
    const st = this.map.get(key(x, y, z));
    this.map.delete(key(x, y, z));
    if (!st) return [];
    return [...st.inputs, st.fuel, st.out].filter(Boolean).map((s) => [s.id, s.count]);
  }

  count(st, id) {
    let n = 0;
    for (const s of st.inputs) if (s && s.id === id) n += s.count;
    return n;
  }

  // The recipe this station can make right now (ingredients present, room in the output), or null.
  recipeFor(st) {
    for (const r of STATION_KINDS[st.kind].recipes) {
      if (!r.in.every(([id, n]) => this.count(st, id) >= n)) continue;
      if (!(r.tools ?? []).every((id) => this.count(st, id) > 0)) continue;
      const [oid, on] = r.out;
      if (st.out && (st.out.id !== oid || st.out.count + on > maxStack(oid))) continue;
      return r;
    }
    return null;
  }

  make(st, r) {
    for (const [id, n] of r.in) {
      let left = n;
      for (let i = 0; i < st.inputs.length && left > 0; i++) {
        const s = st.inputs[i];
        if (!s || s.id !== id) continue;
        const k = Math.min(left, s.count);
        s.count -= k; left -= k;
        if (!s.count) st.inputs[i] = null;
      }
    }
    if (st.out) st.out.count += r.out[1];
    else st.out = { id: r.out[0], count: r.out[1] };
  }

  // Advance every loaded station by dt seconds. setLit(x, y, z, lit) is called when one lights or goes out.
  tick(dt, world, setLit) {
    for (const [k, st] of this.map) {
      const [x, y, z] = k.split(',').map(Number);
      if (!world.chunkAt(x, z)) continue;
      const id = world.get(x, y, z);
      if (stationKind(id) !== st.kind) { this.map.delete(k); continue; }
      const r = this.recipeFor(st);
      // light a new piece of fuel only when there's something to make
      if (st.burn <= 0 && r && st.fuel) {
        st.burn = st.burnMax = FUEL_SECONDS[st.fuel.id] ?? 0;
        if (--st.fuel.count <= 0) st.fuel = null;
      }
      if (st.burn > 0) {
        st.burn = Math.max(0, st.burn - dt);
        if (r) {
          st.progress += dt;
          if (st.progress >= r.time) { this.make(st, r); st.progress = 0; }
        } else {
          st.progress = 0;
        }
      } else {
        st.progress = 0;
      }
      const lit = st.burn > 0;
      if (lit !== BLOCKS[id].lit) setLit(x, y, z, lit);
    }
  }

  serialize() { return [...this.map]; }

  load(list) {
    this.map.clear();
    for (const [k, st] of list ?? []) {
      if (typeof k !== 'string' || !STATION_KINDS[st?.kind]) continue;
      const clean = (s) => (s && s.id && s.count > 0 ? { id: s.id, count: s.count } : null);
      const n = STATION_KINDS[st.kind].inputs;
      this.map.set(k, {
        kind: st.kind,
        inputs: Array.from({ length: n }, (_, i) => clean(st.inputs?.[i])),
        fuel: clean(st.fuel), out: clean(st.out),
        burn: Math.max(0, +st.burn || 0), burnMax: Math.max(0, +st.burnMax || 0), progress: Math.max(0, +st.progress || 0),
      });
    }
  }
}
