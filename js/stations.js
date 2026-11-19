// Ovens and smelters: blocks you put items into. While there's fuel burning and the ingredients for a
// recipe, they cook it, a batch at a time, into the output slot.
//
// Each placed station keeps its contents here, keyed by position, and they're saved with the world.
// Like crops and lamps, a station only works while its part of the world is loaded.
import {
  COAL, CHARCOAL, LOG, PLANKS, STICK, COBBLE, STONE, SAND, GLASS, SLIME_FUEL, BUCKET, SEEDS,
  SALMON, BAKED_SALMON, ICEFISH, BAKED_ICEFISH, HONEY_TEA, HONEYCOMB, MUSHROOM_STEW, FISH_PIE, GLOW_MUSHROOM,
  FLOUR, SUGAR, BUTTER, MILK_BUCKET, BREAD, COOKIE, CAKE, RAW_FISH, BAKED_FISH, BLOCKS, maxStack, stationKind,
  ORES, COAL_OR_CHARCOAL, FUEL_ROD, FERTILISER, SAWDUST, CUPRONICKEL_INGOT, ENRICHED_ROD, SPENT_ROD, URANIUM_INGOT, URANIUM_DUST, ENRICHED_URANIUM, WATER_BUCKET, ICE, PACKED_ICE, INVAR_INGOT, NICKEL_INGOT, IRON_INGOT, COPPER_INGOT, TIN_INGOT, ZINC_INGOT, ALUMINIUM_INGOT, SILVER_INGOT, GOLD_INGOT,
  BRONZE_INGOT, ELECTRUM_INGOT, STAINLESS_INGOT, STEEL_INGOT, AL_BRONZE_INGOT,
  GRAVEL, FLINT, FLINT_DUST, CLAY_BALL, CLAY_DUST, BRICK, FIRE_CLAY, FIRE_BRICK, oreDust, HIDE, LEATHER,
  LAVA_BUCKET, LEAD_BUCKET, SALTPETRE, SANDSTONE, WHEAT, SUGAR_CANE, COAL_DUST, PLATE_METALS, PLATES, TUNGSTEN_INGOT, FILAMENT,
  SAPLING, ELECTRIC_ITEMS, chargeCap, GLASS_BOTTLE, NIGHT_TEA, HASTE_TEA, FIRE_TEA, HEAL_TEA, BERRIES, CORNFLOWER, DANDELION, POPPY, CACTUS, LAVENDER, DAISY, CAULDRON,
} from './blocks.js';

// A recipe ingredient can be one id or a list of alternatives (coal or charcoal).
const idsOf = (spec) => (Array.isArray(spec) ? spec : [spec]);

// How many items (or oven batches) each piece of fuel cooks. Fuel is only used up while something is
// actually cooking, so what's left of a piece waits in the station for the next job.
// Slime fuel burns out of its bucket and leaves the empty bucket in the fuel slot.
// A lava bucket burns for 100 and leaves its lead bucket behind.
export const FUEL_ITEMS = { [LOG]: 1, [PLANKS]: 1, [STICK]: 0.5, [COAL]: 10, [CHARCOAL]: 10, [SLIME_FUEL]: 40, [LAVA_BUCKET]: 100 };
const FUEL_LEAVES = { [SLIME_FUEL]: BUCKET, [LAVA_BUCKET]: LEAD_BUCKET };
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
      { out: [BAKED_SALMON, 1], in: [[SALMON, 1]], time: 5 },
      { out: [MUSHROOM_STEW, 1], in: [[GLOW_MUSHROOM, 3], [BUTTER, 1]], time: 8 },
      ...[BAKED_FISH, BAKED_SALMON, BAKED_ICEFISH].map((f) => ({ out: [FISH_PIE, 1], in: [[f, 1], [FLOUR, 2], [BUTTER, 1]], time: 10 })),
      { out: [BAKED_ICEFISH, 1], in: [[ICEFISH, 1]], time: 5 },
      { out: [BRICK, 1], in: [[CLAY_BALL, 1]], time: 5 },
      { out: [LEATHER, 1], in: [[HIDE, 1]], time: 6 }, // gently cured
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
      { out: [CUPRONICKEL_INGOT, 4], in: [[COPPER_INGOT, 3], [NICKEL_INGOT, 1]], time: 6 },
      // ores into ingots
      ...ORES.filter((o) => o.ingot).map((o) => ({ out: [o.ingot, 1], in: [[o.id, 1]], time: o.tier >= 5 ? 8 : 5 })),
      // crushed ore: each dust is a whole ingot, so crushing first doubles what an ore gives
      ...ORES.filter((o) => o.ingot).map((o) => ({ out: [o.ingot, 1], in: [[oreDust(o.id), 1]], time: o.tier >= 5 ? 6 : 4 })),
      { out: [STONE, 1], in: [[COBBLE, 1]], time: 4 },
      { out: [GLASS, 2], in: [[FLINT_DUST, 1], [SAND, 1]], time: 4 }, // flint dust helps sand melt into twice the glass
      { out: [GLASS, 1], in: [[SAND, 1]], time: 4 },
      { out: [CHARCOAL, 1], in: [[LOG, 1]], time: 5 },
      { out: [BRICK, 1], in: [[CLAY_BALL, 1]], time: 4 },
      { out: [FIRE_BRICK, 1], in: [[FIRE_CLAY, 1]], time: 6 },
    ],
  },
  // The rock crusher has no fuel: it turns while a water wheel drives it, faster with gearing (see kinetics.js).
  // Times are at 1x speed.
  crusher: {
    name: 'Rock Crusher',
    verb: 'Crushing',
    inputs: 1,
    powered: true,
    recipes: [
      ...ORES.map((o) => ({ out: o.crush ?? [oreDust(o.id), 2], in: [[o.id, 1]], time: o.tier >= 5 ? 12 : 8 })),
      { out: [GRAVEL, 1], in: [[COBBLE, 1]], time: 4 },
      { out: [SAND, 1], in: [[GRAVEL, 1]], time: 4 },
      { out: [FLINT_DUST, 2], in: [[FLINT, 1]], time: 4 },
      { out: [CLAY_DUST, 2], in: [[BRICK, 1]], time: 4 },
      { out: [SALTPETRE, 1], in: [[SANDSTONE, 2]], time: 6 }, // desert sandstone holds a little saltpetre
    ],
  },
};
// More machines driven by shafts (times at 1x speed).
STATION_KINDS.mill = {
  name: 'Millstone', verb: 'Grinding', inputs: 1, powered: true,
  recipes: [
    { out: [FLOUR, 1], in: [[WHEAT, 1]], time: 3 },
    { out: [SUGAR, 2], in: [[SUGAR_CANE, 1]], time: 3 },
    { out: [COAL_DUST, 2], in: [[COAL_OR_CHARCOAL, 1]], time: 3 },
  ],
};
STATION_KINDS.saw = {
  name: 'Mechanical Saw', verb: 'Sawing', inputs: 1, powered: true,
  recipes: [
    { out: [PLANKS, 6], in: [[LOG, 1]], time: 3 },
    { out: [STICK, 3], in: [[PLANKS, 1]], time: 2 },
  ],
};
STATION_KINDS.hammer = {
  name: 'Trip Hammer', verb: 'Hammering', inputs: 1, powered: true,
  recipes: [
    ...PLATE_METALS.map((m, i) => ({ out: [PLATES + i, 1], in: [[m.ingot, 1]], time: 6 })),
    { out: [FILAMENT, 4], in: [[TUNGSTEN_INGOT, 1]], time: 10 }, // drawn out into fine wire
  ],
};
// The blast smelter: lined with fire bricks, it smelts everything the smelter does, twice as fast.
STATION_KINDS.blast = { ...STATION_KINDS.smelter, name: 'Blast Smelter', speed: 2 };
// The cauldron: brews teas over a fire, from its water. Every two teas use up a level of water.
STATION_KINDS.cauldron = {
  name: 'Cauldron', inputs: 2, water: true, noLit: true,
  recipes: [
    { out: [NIGHT_TEA, 1], in: [[GLASS_BOTTLE, 1], [CORNFLOWER, 1]], time: 8 },
    { out: [HASTE_TEA, 1], in: [[GLASS_BOTTLE, 1], [DANDELION, 1]], time: 8 },
    { out: [FIRE_TEA, 1], in: [[GLASS_BOTTLE, 1], [POPPY, 1], [CACTUS, 1]], time: 8 },
    { out: [HEAL_TEA, 1], in: [[GLASS_BOTTLE, 1], [LAVENDER, 1], [DAISY, 1]], time: 8 },
    { out: [HEAL_TEA, 1], in: [[GLASS_BOTTLE, 1], [BERRIES, 3]], time: 8 },
    { out: [HONEY_TEA, 1], in: [[GLASS_BOTTLE, 1], [HONEYCOMB, 1]], time: 8 },
  ],
};
// The electric pulverizer: a rock crusher run on electricity (see electric.js), twice as fast, that gets
// half as much again out of everything, and now and then a little more (`bonus`: the chance of one extra).
STATION_KINDS.pulverizer = {
  name: 'Electric Pulverizer', verb: 'Pulverizing', inputs: 1, powered: true, electric: true,
  recipes: STATION_KINDS.crusher.recipes.map((r) => ({ ...r, out: [r.out[0], Math.ceil(r.out[1] * 1.5)], bonus: 0.25 })),
};
// The battery charger holds one battery (or anything that runs on one) and fills it while it has power.
STATION_KINDS.charger = { name: 'Battery Charger', inputs: 1, holder: true, accepts: ELECTRIC_ITEMS, electric: true, recipes: [] };
// The electric smelter smelts everything the smelter does with no fuel, on electricity (see electric.js):
// at 2x speed with all the power it wants, slower when the grid's short.
STATION_KINDS.esmelter = { ...STATION_KINDS.smelter, name: 'Electric Smelter', verb: 'Smelting', powered: true, electric: true };
// The arc furnace: smelts everything the smelter does at half the time (and at 2x with full power), and
// makes alloys that need more heat than any fire gives.
STATION_KINDS.arc = {
  name: 'Arc Furnace', verb: 'Smelting', inputs: 4, powered: true, electric: true,
  recipes: [
    { out: [INVAR_INGOT, 3], in: [[IRON_INGOT, 2], [NICKEL_INGOT, 1]], time: 6 },
    ...STATION_KINDS.smelter.recipes.map((r) => ({ ...r, time: r.time / 2 })),
  ],
};
// Chests just hold things.
STATION_KINDS.chest = { name: 'Chest', inputs: 18, storage: true, recipes: [] };
STATION_KINDS.ironchest = { name: 'Iron-Banded Chest', inputs: 36, storage: true, recipes: [] };
// The auto-crafter makes whatever the item frame on it shows (see recipeAt), once a second, from what's
// put into it; no fuel or power.
export const CRAFT_TIME = 1;
STATION_KINDS.crafter = { name: 'Auto-Crafter', inputs: 9, crafter: true, recipes: [] };
// The programmable crafter: an auto-crafter that steps on to the next item frame on it each time it gets a signal.
STATION_KINDS.pcrafter = { name: 'Programmable Crafter', inputs: 9, crafter: true, recipes: [] };
// Farm machines that hold things: a planter's saplings, an animal station's buckets and wheat (both just
// hold them: see machines.js), and a fishing net's catch (taken out by a hopper underneath).
STATION_KINDS.planter = { name: 'Planter', inputs: 4, holder: true, accepts: [SAPLING], recipes: [] };
STATION_KINDS.ranch = { name: 'Animal Station', inputs: 6, holder: true, accepts: [BUCKET, WHEAT, SEEDS, BERRIES], recipes: [] };
STATION_KINDS.net = { name: 'Fishing Net', inputs: 4, storage: true, recipes: [] };
// A reactor holds up to four fuel rods, burning them all at once (see electric.js). Burnt-out rods stay in it, spent.
STATION_KINDS.reactor = { name: 'Reactor', inputs: 4, holder: true, accepts: [FUEL_ROD, ENRICHED_ROD, SPENT_ROD], recipes: [] };
// A lead-lined chest: a chest that keeps the radiation of spent fuel rods in.
STATION_KINDS.leadchest = { name: 'Lead-Lined Chest', inputs: 18, storage: true, shielded: true, recipes: [] };
// The centrifuge enriches uranium, and slowly reprocesses spent rods back into a little uranium.
STATION_KINDS.centrifuge = {
  name: 'Centrifuge', verb: 'Spinning', inputs: 2, powered: true, electric: true,
  recipes: [
    { out: [ENRICHED_URANIUM, 1], in: [[URANIUM_INGOT, 3]], time: 20 },
    { out: [ENRICHED_URANIUM, 1], in: [[URANIUM_DUST, 3]], time: 20 },
    { out: [URANIUM_DUST, 1], in: [[SPENT_ROD, 1]], time: 60 },
  ],
};
// The freezer turns water into ice (you get the bucket back) and ice into packed ice.
STATION_KINDS.freezer = {
  name: 'Freezer', verb: 'Freezing', inputs: 2, powered: true, electric: true,
  recipes: [
    { out: [PACKED_ICE, 1], in: [[ICE, 4]], time: 10 },
    { out: [ICE, 1], in: [[WATER_BUCKET, 1]], leaves: BUCKET, time: 6 },
  ],
};

// The compost bin needs no fuel or power: plant scraps just rot down into fertiliser, given time.
STATION_KINDS.compost = {
  name: 'Compost Bin', verb: 'Rotting down', inputs: 4, powered: true, passive: true,
  recipes: [
    { out: [FERTILISER, 2], in: [[SAWDUST, 4]], time: 20 },
    { out: [FERTILISER, 1], in: [[SEEDS, 8]], time: 20 },
    { out: [FERTILISER, 1], in: [[SAPLING, 2]], time: 20 },
    { out: [FERTILISER, 1], in: [[WHEAT, 4]], time: 20 },
    { out: [FERTILISER, 1], in: [[SUGAR_CANE, 4]], time: 20 },
    { out: [FERTILISER, 1], in: [[BERRIES, 6]], time: 20 },
    { out: [FERTILISER, 1], in: [[[POPPY, DANDELION, CORNFLOWER, LAVENDER, DAISY], 4]], time: 20 },
  ],
};

const key = (x, y, z) => `${x},${y},${z}`;

export class Stations {
  constructor() {
    this.map = new Map(); // "x,y,z" -> station state
    this.chosen = new Map(); // auto-crafter "x,y,z" -> the recipe its frame shows (worked out each tick)
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

  // Like remove, but the whole stacks (keeping wear and enchantments), for spilling them on the ground.
  removeStacks(x, y, z) {
    const st = this.map.get(key(x, y, z));
    this.map.delete(key(x, y, z));
    if (!st) return [];
    return [...st.inputs, st.fuel, st.out].filter(Boolean).map((s) => ({ ...s }));
  }

  count(st, id) {
    let n = 0;
    const ids = idsOf(id);
    for (const s of st.inputs) if (s && ids.includes(s.id)) n += s.count;
    return n;
  }

  // The recipe this station can make right now (ingredients present, room in the output), or null.
  recipeFor(st, k) {
    const K = STATION_KINDS[st.kind];
    const list = K.crafter ? [this.chosen.get(k)].filter(Boolean) : K.recipes;
    for (const r of list) {
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
    if (r.leaves) { // (the freezer gives the bucket back)
      const i = st.inputs.findIndex((x) => !x);
      if (i >= 0) st.inputs[i] = { id: r.leaves, count: 1 };
    }
    const n = r.out[1] + (r.bonus && Math.random() < r.bonus && (st.out?.count ?? 0) + r.out[1] < maxStack(r.out[0]) ? 1 : 0);
    if (st.out) st.out.count += n;
    else st.out = { id: r.out[0], count: n, ...(chargeCap(r.out[0]) ? { wear: chargeCap(r.out[0]) } : {}) }; // (batteries come out flat)
  }

  // Advance every loaded station by dt seconds. setLit(x, y, z, lit) is called when one lights or goes out.
  // powerAt(x, y, z) gives a powered station's speed (0 when it isn't turning).
  // boostAt(x, y, z): how much faster a fuelled station works (1, or 1.5 with bellows blowing into it).
  // recipeAt(x, y, z): the recipe an auto-crafter is set to make (from its item frame), or null.
  tick(dt, world, setLit, powerAt = () => 0, boostAt = () => 1, recipeAt = () => null) {
    for (const [k, st] of this.map) {
      const [x, y, z] = k.split(',').map(Number);
      if (!world.chunkAt(x, z)) continue;
      const id = world.get(x, y, z);
      if (stationKind(id) !== st.kind) { this.map.delete(k); continue; }
      const K = STATION_KINDS[st.kind];
      if (K.storage || K.holder) continue;
      if (K.crafter) {
        const want = recipeAt(x, y, z);
        if (want) this.chosen.set(k, { ...want, time: CRAFT_TIME }); else this.chosen.delete(k);
        const r = this.recipeFor(st, k);
        if (!r) { st.progress = 0; continue; }
        st.progress += dt;
        if (st.progress >= CRAFT_TIME) { this.make(st, r); st.progress = 0; }
        continue;
      }
      const r = K.water && !(BLOCKS[id].water > 0) ? null : this.recipeFor(st); // a dry cauldron can't brew
      if (!r) st.progress = 0;
      if (K.powered) {
        const speed = K.passive ? 1 : powerAt(x, y, z);
        st.speed = speed;
        if (r && speed > 0) {
          st.progress += dt * speed;
          if (st.progress >= r.time - 1e-9) { this.make(st, r); st.progress = 0; }
        }
        continue;
      }
      const sdt = dt * (K.speed ?? 1) * boostAt(x, y, z); // a blast smelter cooks twice as fast, on the same fuel per item
      // light a new piece of fuel only when there's something to make and the last piece is used up
      if (r && st.burn <= 1e-9 && st.fuel && isFuel(st.fuel.id)) {
        st.burn = st.burnMax = FUEL_ITEMS[st.fuel.id];
        if (FUEL_LEAVES[st.fuel.id]) st.fuel = { id: FUEL_LEAVES[st.fuel.id], count: 1 }; // the bucket stays behind
        else if (--st.fuel.count <= 0) st.fuel = null;
      }
      // cooking: fuel burns at one "item" per recipe time, so a log cooks exactly one item
      const cooking = !!r && st.burn > 1e-9;
      if (cooking) {
        const step = Math.min(sdt, st.burn * r.time);
        st.burn = Math.max(0, st.burn - step / r.time);
        st.progress += step;
        if (st.progress >= r.time - 1e-9) {
          this.make(st, r); st.progress = 0;
          if (K.water && (st.brews = (st.brews ?? 0) + 1) % 2 === 0) world.setBlock(x, y, z, CAULDRON + BLOCKS[id].water - 1);
        }
      }
      st.cooking = cooking;
      const lit = cooking;
      if (!K.noLit && lit !== BLOCKS[id].lit) setLit(x, y, z, lit);
    }
  }

  serialize() { return [...this.map]; }

  load(list) {
    this.map.clear();
    for (const [k, st] of list ?? []) {
      if (typeof k !== 'string' || !STATION_KINDS[st?.kind]) continue;
      const clean = (s) => (s && s.id && s.count > 0 ? { id: s.id, count: s.count, ...(s.wear > 0 ? { wear: s.wear } : {}), ...(Array.isArray(s.ench) && s.ench.length ? { ench: s.ench } : {}), ...(s.on === true ? { on: true } : {}), ...(s.pack > 0 ? { pack: Math.floor(s.pack) } : {}) } : null);
      const n = STATION_KINDS[st.kind].inputs;
      this.map.set(k, {
        kind: st.kind,
        inputs: Array.from({ length: n }, (_, i) => clean(st.inputs?.[i])),
        fuel: clean(st.fuel), out: clean(st.out),
        burn: Math.max(0, +st.burn || 0), burnMax: Math.max(0, +st.burnMax || 0), progress: Math.max(0, +st.progress || 0), brews: st.brews | 0,
      });
    }
  }
}
