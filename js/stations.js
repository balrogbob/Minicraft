// Ovens and smelters: blocks you put items into. While there's fuel burning and the ingredients for a
// recipe, they cook it, a batch at a time, into the output slot.
//
// Each placed station keeps its contents here, keyed by position, and they're saved with the world.
// Like crops and lamps, a station only works while its part of the world is loaded.
import {
  COAL, CHARCOAL, LOG, PLANKS, STICK, COBBLE, STONE, SAND, GLASS, SLIME_FUEL, BUCKET,
  FLOUR, SUGAR, BUTTER, MILK_BUCKET, BREAD, COOKIE, CAKE, RAW_FISH, BAKED_FISH, BLOCKS, maxStack, stationKind,
  ORES, COAL_OR_CHARCOAL, IRON_INGOT, COPPER_INGOT, TIN_INGOT, ZINC_INGOT, ALUMINIUM_INGOT, SILVER_INGOT, GOLD_INGOT,
  BRONZE_INGOT, ELECTRUM_INGOT, STAINLESS_INGOT, STEEL_INGOT, AL_BRONZE_INGOT,
} from './blocks.js';

// A recipe ingredient can be one id or a list of alternatives (coal or charcoal).
const idsOf = (spec) => (Array.isArray(spec) ? spec : [spec]);

// How many items (or oven batches) each piece of fuel cooks. Fuel is only used up while something is
// actually cooking, so what's left of a piece waits in the station for the next job.
// Slime fuel burns out of its bucket and leaves the empty bucket in the fuel slot.
export const FUEL_ITEMS = { [LOG]: 1, [PLANKS]: 1, [STICK]: 0.5, [COAL]: 10, [CHARCOAL]: 10, [SLIME_FUEL]: 40 };
export const isFuel = (id) => id in FUEL_ITEMS;

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
      { out: [BAKED_FISH, 1], in: [[RAW_FISH, 1]], time: 5 },
    ],
  },
  smelter: {
    name: 'Smelter',
    inputs: 4,
    recipes: [
      // alloys first (stainless steel before plain steel, as it needs the same plus zinc).
      // Coal here is an ingredient, separate from whatever is burning in the fuel slot.
      { out: [STAINLESS_INGOT, 2], in: [[ZINC_INGOT, 1], [IRON_INGOT, 1], [COAL_OR_CHARCOAL, 1]], time: 8 },
      { out: [STEEL_INGOT, 1], in: [[IRON_INGOT, 1], [COAL_OR_CHARCOAL, 1]], time: 6 },
      { out: [BRONZE_INGOT, 4], in: [[COPPER_INGOT, 3], [TIN_INGOT, 1]], time: 6 },
      { out: [AL_BRONZE_INGOT, 4], in: [[ALUMINIUM_INGOT, 1], [COPPER_INGOT, 3]], time: 6 },
      { out: [ELECTRUM_INGOT, 2], in: [[SILVER_INGOT, 1], [GOLD_INGOT, 1]], time: 6 },
      // ores into ingots
      ...ORES.filter((o) => o.ingot).map((o) => ({ out: [o.ingot, 1], in: [[o.id, 1]], time: o.tier >= 5 ? 8 : 5 })),
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
    const ids = idsOf(id);
    for (const s of st.inputs) if (s && ids.includes(s.id)) n += s.count;
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
        if (!s || !idsOf(id).includes(s.id)) continue;
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
      if (!r) st.progress = 0;
      // light a new piece of fuel only when there's something to make and the last piece is used up
      if (r && st.burn <= 1e-9 && st.fuel && isFuel(st.fuel.id)) {
        st.burn = st.burnMax = FUEL_ITEMS[st.fuel.id];
        if (st.fuel.id === SLIME_FUEL) st.fuel = { id: BUCKET, count: 1 }; // the bucket stays behind
        else if (--st.fuel.count <= 0) st.fuel = null;
      }
      // cooking: fuel burns at one "item" per recipe time, so a log cooks exactly one item
      const cooking = !!r && st.burn > 1e-9;
      if (cooking) {
        const step = Math.min(dt, st.burn * r.time);
        st.burn = Math.max(0, st.burn - step / r.time);
        st.progress += step;
        if (st.progress >= r.time - 1e-9) { this.make(st, r); st.progress = 0; }
      }
      const lit = cooking;
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
