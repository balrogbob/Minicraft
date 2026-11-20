// Ovens and smelters: blocks you put items into. While there's fuel burning and the ingredients for a
// recipe, they cook it, a batch at a time, into the output slot.
//
// Each placed station keeps its contents here, keyed by position, and they're saved with the world.
// Like crops and lamps, a station only works while its part of the world is loaded.
import {
  COAL, CHARCOAL, LOG, PLANKS, STICK, COBBLE, STONE, SAND, GLASS, SLIME_FUEL, BUCKET, SEEDS,
  FISH_TRAP, OLD_BOOT, PUFFERFISH,
  SALMON, BAKED_SALMON, ICEFISH, BAKED_ICEFISH, HONEY_TEA, HONEYCOMB, MUSHROOM_STEW, FISH_PIE, GLOW_MUSHROOM,
  FLOUR, SUGAR, BUTTER, MILK_BUCKET, BREAD, COOKIE, CAKE, RAW_FISH, BAKED_FISH, BLOCKS, maxStack, stationKind,
  ORES, COAL_OR_CHARCOAL, FUEL_ROD, FERTILISER, SAWDUST, CUPRONICKEL_INGOT, ENRICHED_ROD, SPENT_ROD, URANIUM_INGOT, URANIUM_DUST, ENRICHED_URANIUM, WATER_BUCKET, ICE, PACKED_ICE, INVAR_INGOT, METEORIC_IRON, STARSTEEL_INGOT, NICKEL_INGOT, IRON_INGOT, COPPER_INGOT, TIN_INGOT, ZINC_INGOT, ALUMINIUM_INGOT, SILVER_INGOT, GOLD_INGOT,
  BRONZE_INGOT, ELECTRUM_INGOT, STAINLESS_INGOT, STEEL_INGOT, AL_BRONZE_INGOT,
  GRAVEL, FLINT, FLINT_DUST, CLAY_BALL, CLAY_DUST, BRICK, FIRE_CLAY, FIRE_BRICK, oreDust, HIDE, LEATHER,
  dirtyDust, SLUDGE, SLAG, WORM, TRACE_METALS, DIRT, UPGRADES,
  LAVENDER_HONEY, BLOSSOM_HONEY, GOLDEN_HONEY, LAVENDER_TEA, BLOSSOM_TEA, GOLDEN_TEA,
  LAVA_BUCKET, LEAD_BUCKET, SALTPETRE, SANDSTONE, WHEAT, SUGAR_CANE, COAL_DUST, PLATE_METALS, PLATES, TUNGSTEN_INGOT, FILAMENT,
  SAPLING, ELECTRIC_ITEMS, chargeCap, GLASS_BOTTLE, NIGHT_TEA, HASTE_TEA, FIRE_TEA, HEAL_TEA, BERRIES, CORNFLOWER, DANDELION, POPPY, CACTUS, LAVENDER, DAISY, CAULDRON,
  EGG, FRIED_EGG, TRUFFLE, APPLE, CHERRIES, APPLE_PIE, CHERRY_PIE, FISH_SOUP, TRUFFLE_SOUP, BERRY_JAM,
  CARROT, POTATO, BAKED_POTATO, PUMPKIN, PUMPKIN_PIE, PUMPKIN_SEEDS, GRAPES, GRAPE_JUICE, CURDS, AGING,
  ONION, BEANS, TOMATO, HERBS, APPLE_JUICE, BERRY_JUICE, VEG_STEW, TOMATO_SOUP, BAKED_BEANS,
  CLAY, TERRACOTTA, TERRA_COL, GLAZED_TILE, URN, UNFIRED_URN, COLORS,
} from './blocks.js';
import {
  HONEYCOMB as COMB_PLAIN, FROSTY_COMB, DRY_COMB, FLORAL_COMB, BLOSSOM_COMB, MINERAL_COMB, EMBER_COMB, ROYAL_COMB, GLOW_COMB, CRYSTAL_COMB, GILDED_COMB, STARRY_COMB,
  HONEY_DROP, PROPOLIS, POLLEN, ROYAL_JELLY, HONEY_MUST, HONEY_CAKE, BEESWAX, SULPHUR, GLOW_SHELL, CRYSTAL_SHARD,
  IRON_ORE, COPPER_ORE, TIN_ORE, GOLD_ORE, SILVER_ORE, BEE_SPECIES, princessOf, droneOf, BEE_FRAMES,
} from './blocks.js';
import { cleanQueen } from './apiculture.js';

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
      { out: [FRIED_EGG, 1], in: [[EGG, 1]], time: 4 },
      { out: [CAKE, 1], in: [[FLOUR, 3], [SUGAR, 2], [EGG, 2]], time: 10 },
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
    sides: 1, // (the slag)
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
      ...ORES.filter((o) => o.ingot).map((o) => ({ out: [o.ingot, 1], in: [[o.id, 1]], time: o.tier >= 5 ? 8 : 5, side: [[SLAG, 0.15]] })),
      // crushed ore: each dust is a whole ingot, so crushing first doubles what an ore gives
      ...ORES.filter((o) => o.ingot).map((o) => ({ out: [o.ingot, 1], in: [[oreDust(o.id), 1]], time: o.tier >= 5 ? 6 : 4, side: [[SLAG, 0.05]] })),
      // v28: dirty dust (straight from the crusher) smelts too, but four make only three ingots, and more slag
      ...ORES.filter((o) => o.ingot).map((o) => ({ out: [o.ingot, 3], in: [[dirtyDust(o.id), 4]], time: o.tier >= 5 ? 18 : 12, side: [[SLAG, 0.4]] })),
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
      ...ORES.map((o) => ({ out: o.crush ?? [dirtyDust(o.id), 2], in: [[o.id, 1]], time: o.tier >= 5 ? 12 : 8 })), // (v28: the dust comes out dirty)
      { out: [FERTILISER, 1], in: [[SLAG, 2]], time: 4 },
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
    { out: [LAVENDER_TEA, 1], in: [[LAVENDER_HONEY, 1], [LAVENDER, 1]], time: 8 },
    { out: [BLOSSOM_TEA, 1], in: [[BLOSSOM_HONEY, 1], [[APPLE, CHERRIES], 1]], time: 8 },
    { out: [GOLDEN_TEA, 1], in: [[GOLDEN_HONEY, 1], [DANDELION, 1]], time: 8 },
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
  name: 'Arc Furnace', verb: 'Smelting', inputs: 4, powered: true, electric: true, sides: 1,
  recipes: [
    { out: [STARSTEEL_INGOT, 1], in: [[METEORIC_IRON, 2], [TUNGSTEN_INGOT, 1], [COAL_OR_CHARCOAL, 1]], time: 12 },
    { out: [INVAR_INGOT, 3], in: [[IRON_INGOT, 2], [NICKEL_INGOT, 1]], time: 6 },
    ...STATION_KINDS.smelter.recipes.map((r) => ({ ...r, time: r.time / 2 })),
  ],
};
// Chests just hold things.
STATION_KINDS.chest = { name: 'Chest', inputs: 18, storage: true, recipes: [] };
STATION_KINDS.reqtable = { name: 'Request Table', inputs: 18, storage: true, recipes: [] }; // (v29: where orders arrive)
// (v30) The bottler fills the empty buckets put in it from the liquid piped in (see logistics.js).
STATION_KINDS.bottler = { name: 'Bottler', inputs: 4, sides: 3, nofuel: true, accepts: [BUCKET, LEAD_BUCKET], recipes: [] };
STATION_KINDS.stall = { name: 'Market Stall', inputs: 9, storage: true, recipes: [] }; // (villagers buy from it: see main.js)
STATION_KINDS.ironchest = { name: 'Iron-Banded Chest', inputs: 36, storage: true, recipes: [] };
// The auto-crafter makes whatever the item frame on it shows (see recipeAt), once a second, from what's
// put into it; no fuel or power.
export const CRAFT_TIME = 1;
STATION_KINDS.crafter = { name: 'Auto-Crafter', inputs: 9, crafter: true, recipes: [] };
// The programmable crafter: an auto-crafter that steps on to the next item frame on it each time it gets a signal.
STATION_KINDS.pcrafter = { name: 'Programmable Crafter', inputs: 9, crafter: true, recipes: [] };
// Farm machines that hold things: a planter's saplings, an animal station's buckets and wheat (both just
// hold them: see machines.js), and a fishing net's catch (taken out by a hopper underneath).
STATION_KINDS.planter = { name: 'Planter', inputs: 4, holder: true, accepts: [SAPLING, SEEDS, CARROT, POTATO, PUMPKIN_SEEDS, ONION, BEANS, TOMATO, HERBS], recipes: [] };
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
  name: 'Freezer', verb: 'Freezing', inputs: 3, powered: true, electric: true,
  recipes: [
    { out: [PACKED_ICE, 1], in: [[ICE, 4]], time: 10 },
    { out: [ICE, 1], in: [[WATER_BUCKET, 1]], leaves: BUCKET, time: 6 },
  ],
};

// The cooking pot: stews, soups and pies over a fire. Good meals that do something more for you (see ITEMS).
STATION_KINDS.cookpot = {
  name: 'Cooking Pot', verb: 'Cooking', inputs: 4,
  recipes: [
    { out: [APPLE_PIE, 1], in: [[APPLE, 3], [FLOUR, 2], [SUGAR, 1], [EGG, 1]], time: 10 },
    { out: [CHERRY_PIE, 1], in: [[CHERRIES, 4], [FLOUR, 2], [SUGAR, 1], [EGG, 1]], time: 10 },
    { out: [TRUFFLE_SOUP, 1], in: [[TRUFFLE, 1], [GLOW_MUSHROOM, 2], [WATER_BUCKET, 1]], leaves: BUCKET, time: 8 },
    { out: [FISH_SOUP, 1], in: [[[RAW_FISH, SALMON, ICEFISH], 2], [WATER_BUCKET, 1]], leaves: BUCKET, time: 8 },
    { out: [BERRY_JAM, 1], in: [[BERRIES, 6], [SUGAR, 2], [GLASS_BOTTLE, 1]], time: 8 },
    { out: [MUSHROOM_STEW, 1], in: [[GLOW_MUSHROOM, 3], [BUTTER, 1]], time: 8 },
  ],
};

// v26 D: presses (no fuel or power) and the oak barrel, where drinks and cheese age (see tick)
STATION_KINDS.winepress = { name: 'Wine Press', verb: 'Pressing', inputs: 2, powered: true, passive: true, recipes: [
  { out: [GRAPE_JUICE, 1], in: [[GRAPES, 6], [GLASS_BOTTLE, 1]], time: 8 },
  { out: [APPLE_JUICE, 1], in: [[APPLE, 4], [GLASS_BOTTLE, 1]], time: 8 },
  { out: [BERRY_JUICE, 1], in: [[BERRIES, 8], [GLASS_BOTTLE, 1]], time: 8 },
] };
STATION_KINDS.cheesepress = { name: 'Cheese Press', verb: 'Pressing', inputs: 2, powered: true, passive: true, recipes: [
  { out: [CURDS, 1], in: [[MILK_BUCKET, 1]], leaves: BUCKET, time: 10 },
] };
STATION_KINDS.barrel = { name: 'Oak Barrel', inputs: 6, storage: true, ages: true, recipes: [] };
export const AGE_DAY = 12 * 60; // (a game day, in seconds)
// A barrel in a cellar, where no daylight reaches it (dark and cool), ages what's in it half as fast again.
export const CELLAR_SPEED = 1.5;
export const inCellar = (world, x, y, z) => [[0, 1, 0], [1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1]].every(([dx, dy, dz]) => !(world.skyAt?.(x + dx, y + dy, z + dz) > 0));

// v26: the new crops in the oven and the pot
STATION_KINDS.oven.recipes.push(
  { out: [BAKED_POTATO, 1], in: [[POTATO, 1]], time: 5 },
  { out: [PUMPKIN_PIE, 1], in: [[PUMPKIN, 1], [SUGAR, 1], [EGG, 1]], time: 10 },
);
STATION_KINDS.cookpot.recipes.push(
  { out: [PUMPKIN_PIE, 1], in: [[PUMPKIN, 1], [SUGAR, 1], [EGG, 1]], time: 10 },
  { out: [VEG_STEW, 1], in: [[ONION, 1], [CARROT, 1], [POTATO, 1], [HERBS, 1]], time: 10 },
  { out: [TOMATO_SOUP, 1], in: [[TOMATO, 3], [ONION, 1], [WATER_BUCKET, 1]], leaves: BUCKET, time: 8 },
);
// v27: beans in tomato sauce
STATION_KINDS.oven.recipes.push({ out: [BAKED_BEANS, 1], in: [[BEANS, 4], [TOMATO, 1]], time: 6 });

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
    { out: [FERTILISER, 1], in: [[CARROT, 4]], time: 20 },
    { out: [FERTILISER, 1], in: [[POTATO, 4]], time: 20 },
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
      if (STATION_KINDS[kind].sides) st.side = new Array(STATION_KINDS[kind].sides).fill(null);
      this.map.set(k, st);
    }
    return st;
  }

  // Remove a station, returning everything that was inside it as [[id, count], ...].
  remove(x, y, z) {
    const st = this.map.get(key(x, y, z));
    this.map.delete(key(x, y, z));
    if (!st) return [];
    return [...st.inputs, st.fuel, st.out, ...(st.side ?? []), ...upgradeStacks(st), ...queenStacks(st)].filter(Boolean).map((s) => [s.id, s.count]);
  }

  // Like remove, but the whole stacks (keeping wear and enchantments), for spilling them on the ground.
  removeStacks(x, y, z) {
    const st = this.map.get(key(x, y, z));
    this.map.delete(key(x, y, z));
    if (!st) return [];
    return [...st.inputs, st.fuel, st.out, ...(st.side ?? []), ...upgradeStacks(st), ...queenStacks(st)].filter(Boolean).map((s) => ({ ...s }));
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
      if (r.out) {
        const [oid, on] = r.out;
        if (st.out && (st.out.id !== oid || st.out.count + on > maxStack(oid))) continue;
      }
      if (r.side && !r.side.some(([id, , n = 1]) => this.sideFits(st, id, n))) continue; // (by-product trays with no room at all stop it)
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
    for (const [id, p, k = 1] of r.side ?? []) if (Math.random() < p && this.putSide(st, id, k) && id === r.trace) this.onTrace?.(st, id);
    if (!r.out) return;
    const extra = (r.bonus && Math.random() < r.bonus ? 1 : 0) + (STATION_KINDS[st.kind].yieldUp && Math.random() < 0.12 * (st.up?.yield ?? 0) ? 1 : 0);
    const n = Math.min(maxStack(r.out[0]) - (st.out?.count ?? 0), r.out[1] + extra);
    if (st.out) st.out.count += n;
    else st.out = { id: r.out[0], count: n, ...(chargeCap(r.out[0]) ? { wear: chargeCap(r.out[0]) } : {}) }; // (batteries come out flat)
  }

  // v28: by-products (slag, sludge, trace metals...) go into a station's side slots.
  sideSlots(st) {
    const n = STATION_KINDS[st.kind]?.sides ?? 0;
    if (!n) return [];
    if (!st.side || st.side.length !== n) st.side = Array.from({ length: n }, (_, i) => st.side?.[i] ?? null);
    return st.side;
  }
  sideFits(st, id, n = 1) {
    const sl = this.sideSlots(st);
    return sl.some((s) => !s || (s.id === id && s.count + n <= maxStack(id)));
  }
  putSide(st, id, n = 1) {
    const sl = this.sideSlots(st);
    const i = sl.findIndex((s) => s?.id === id && s.count + n <= maxStack(id));
    if (i >= 0) { sl[i].count += n; return true; }
    const j = sl.indexOf(null);
    if (j >= 0) { sl[j] = { id, count: n }; return true; }
    return false;
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
      if (K.ages) this.age(st, inCellar(world, x, y, z) ? dt * CELLAR_SPEED : dt, K.ages === 'urn' ? URN_AGING : AGING);
      if (K.smokes && smokedAt(world, x, y, z)) this.age(st, dt, SMOKING, 1); // (v34: these tables are in seconds, not days)
      if (K.dries) { const d = dryingAt(world, x, y, z); if (d) this.age(st, d * dt, DRYING, 1); }
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
      const r = (K.water && !(BLOCKS[id].water > 0)) || (K.wet && !wetAt(world, x, y, z)) ? null : this.recipeFor(st); // a dry cauldron can't brew, nor a washer wash
      if (!r) st.progress = 0;
      if (K.powered) {
        const speed = K.passive ? 1 : powerAt(x, y, z);
        st.speed = speed;
        if (r && speed > 0) {
          st.progress += dt * speed * upSpeed(st);
          if (st.progress >= r.time - 1e-9) { this.make(st, r); st.progress = 0; }
        }
        continue;
      }
      const sdt = dt * (K.speed ?? 1) * boostAt(x, y, z) * upSpeed(st); // a blast smelter cooks twice as fast, on the same fuel per item
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
        st.burn = Math.max(0, st.burn - step / r.time * 0.67 ** (st.up?.eff ?? 0));
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

  // Things laid down in a barrel age a little each second: a whole stack together. (Taking it out and putting
  // it back starts it again.)
  // unit: seconds per step of the table's times (a game day, or 1 for tables in seconds)
  age(st, dt, table = AGING, unit = AGE_DAY) {
    st.age ??= new Array(st.inputs.length).fill(0);
    st.ageOf ??= new Array(st.inputs.length).fill(0);
    st.inputs.forEach((s, i) => {
      const a = s && table[s.id];
      if (!a) { st.age[i] = 0; st.ageOf[i] = 0; return; }
      if (st.ageOf[i] !== s.id) { st.ageOf[i] = s.id; st.age[i] = 0; }
      st.age[i] += dt;
      if (st.age[i] >= a[1] * unit) { s.id = a[0]; st.ageOf[i] = s.id; st.age[i] = 0; }
    });
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
        ...(STATION_KINDS[st.kind].sides ? { side: Array.from({ length: STATION_KINDS[st.kind].sides }, (_, i) => clean(st.side?.[i])) } : {}),
        burn: Math.max(0, +st.burn || 0), burnMax: Math.max(0, +st.burnMax || 0), progress: Math.max(0, +st.progress || 0), brews: st.brews | 0,
        ...(st.up && typeof st.up === 'object' ? { up: { speed: Math.min(2, st.up.speed | 0), eff: Math.min(2, st.up.eff | 0), yield: Math.min(2, st.up.yield | 0) } } : {}),
        ...(st.kind === 'beehouse' && cleanQueen(st.queen) ? { queen: cleanQueen(st.queen) } : {}),
        ...(st.kind === 'beehouse' && Array.isArray(st.fu) && Array.isArray(st.fuOf) ? { fu: Array.from({ length: n }, (_, i) => Math.max(0, st.fu[i] | 0)), fuOf: Array.from({ length: n }, (_, i) => st.fuOf[i] | 0) } : {}),
        ...(Array.isArray(st.age) && Array.isArray(st.ageOf) ? { age: Array.from({ length: n }, (_, i) => Math.max(0, +st.age[i] || 0)), ageOf: Array.from({ length: n }, (_, i) => st.ageOf[i] | 0) } : {}),
      });
    }
  }
}

// v27 D: the kiln fires clay (burning fuel like an oven); an urn is a little pot to keep things in
STATION_KINDS.kiln = { name: 'Kiln', verb: 'Firing', inputs: 2, recipes: [
  { out: [TERRACOTTA, 1], in: [[CLAY, 1]], time: 5 },
  { out: [BRICK, 1], in: [[CLAY_BALL, 1]], time: 2.5 },
  { out: [URN, 1], in: [[UNFIRED_URN, 1]], time: 8 },
  ...COLORS.map((c, i) => ({ out: [GLAZED_TILE + i, 1], in: [[TERRA_COL + i, 1]], time: 5 })),
] };
STATION_KINDS.urn = { name: 'Urn', inputs: 6, storage: true, ages: 'urn', recipes: [] }; // (v34: juice sours into vinegar in it)

// ---------- v28 A: ore washer and sieve ----------
// Water touching the washer on any side (a source or flowing).
export function wetAt(world, x, y, z) {
  for (const [dx, dy, dz] of [[1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1], [0, 1, 0], [0, -1, 0]]) if (world.isWater(x + dx, y + dy, z + dz)) return true;
  return false;
}
// Washing a dirty dust gives the clean dust; now and then one more, a trace of another metal, and sludge.
STATION_KINDS.washer = {
  name: 'Ore Washer', verb: 'Washing', inputs: 2, powered: true, wet: true, sides: 3,
  recipes: ORES.filter((o) => o.ingot).map((o) => {
    const trace = TRACE_METALS[o.id];
    return { out: [oreDust(o.id), 1], in: [[dirtyDust(o.id), 1]], time: o.tier >= 5 ? 6 : 4,
      side: [[oreDust(o.id), 0.1], ...(trace ? [[oreDust(trace[0]), trace[1]]] : []), [SLUDGE, 0.3]], trace: trace ? oreDust(trace[0]) : 0 };
  }),
};
// The sieve needs no power: it's shaken by hand (it just takes a while). Dirt gives only what's in it.
STATION_KINDS.sieve = {
  name: 'Sieve', verb: 'Sifting', inputs: 2, powered: true, passive: true, sides: 4,
  recipes: [
    { out: [SAND, 1], in: [[GRAVEL, 1]], time: 3, side: [[FLINT, 0.25], [dirtyDust(ORES[0].id), 0.08], [dirtyDust(ORES[1].id), 0.06], [dirtyDust(ORES.find((o) => o.name === 'Gold Ore').id), 0.02]] },
    { out: null, in: [[DIRT, 1]], time: 3, side: [[WORM, 0.35], [SEEDS, 0.2], [FLINT, 0.06], [SAPLING, 0.03]] },
  ],
};

// A fish trap needs water around it and worms for bait.
STATION_KINDS.fishtrap = {
  name: 'Fish Trap', verb: 'Waiting', inputs: 1, powered: true, passive: true, wet: true, sides: 2,
  recipes: [{ out: [RAW_FISH, 1], in: [[WORM, 1]], time: 40, side: [[SALMON, 0.25], [OLD_BOOT, 0.04], [PUFFERFISH, 0.03]] }],
};

// ---------- v28 C: upgrades ----------
const upSpeed = (st) => 1.5 ** (st.up?.speed ?? 0);
const UPGRADE_ID = Object.fromEntries(Object.entries(UPGRADES).map(([id, k]) => [k, +id]));
export function upgradeStacks(st) { return Object.entries(st.up ?? {}).filter(([, n]) => n > 0).map(([k, n]) => ({ id: UPGRADE_ID[k], count: n })); }
for (const k of ['crusher', 'pulverizer', 'washer', 'sieve', 'mill', 'saw']) STATION_KINDS[k].yieldUp = true;
// Can this upgrade go in this kind of station? Returns a reason it can't, or ''.
export function upgradeRefusal(kind, upId) {
  const K = STATION_KINDS[kind], what = UPGRADES[upId];
  if (!K || K.storage || K.holder || K.crafter || K.ages || kind === 'charger' || kind === 'reactor') return 'That isn\'t a machine that makes anything';
  if (what === 'eff' && K.powered) return 'An efficiency upgrade only helps something that burns fuel';
  if (what === 'yield' && !K.yieldUp) return 'A yield upgrade fits crushers, pulverizers, washers, sieves, millstones and saws';
  return '';
}

// ---------- v31: bee houses and the comb centrifuge ----------
// A bee house holds a princess, drones and frames; its queen fills the trays (see apiculture.js).
export const BEE_ACCEPTS = [...BEE_SPECIES.flatMap((_, i) => [princessOf(i), droneOf(i)]), ...Object.keys(BEE_FRAMES).map(Number)];
STATION_KINDS.beehouse = { name: 'Bee House', inputs: 4, sides: 5, nofuel: true, noLit: true, bees: true, accepts: BEE_ACCEPTS, recipes: [] };
// A queen still in a house that's broken comes out as a princess again.
export function queenStacks(st) { return st.queen ? [{ id: princessOf(st.queen.sp), count: 1 }] : []; }
// Spinning combs: the main product, and what else comes out (each a chance) into the trays.
export const COMB_RECIPES = [
  { out: [HONEY_DROP, 1], in: [[COMB_PLAIN, 1]], time: 4, side: [[BEESWAX, 0.8], [HONEY_DROP, 0.4]] },
  { out: [HONEY_DROP, 1], in: [[FROSTY_COMB, 1]], time: 4, side: [[BEESWAX, 0.7], [ICE, 0.3]] },
  { out: [BEESWAX, 1], in: [[DRY_COMB, 1]], time: 4, side: [[PROPOLIS, 0.6], [SAND, 0.3]] },
  { out: [HONEY_DROP, 1], in: [[FLORAL_COMB, 1]], time: 4, side: [[POLLEN, 0.6], [BEESWAX, 0.5]] },
  { out: [HONEY_DROP, 2], in: [[BLOSSOM_COMB, 1]], time: 4, side: [[POLLEN, 0.3], [BEESWAX, 0.5]] },
  { out: [BEESWAX, 1], in: [[MINERAL_COMB, 1]], time: 6, side: [[dirtyDust(IRON_ORE), 0.4], [dirtyDust(COPPER_ORE), 0.3], [dirtyDust(TIN_ORE), 0.2], [PROPOLIS, 0.2]] },
  { out: [BEESWAX, 1], in: [[EMBER_COMB, 1]], time: 6, side: [[SULPHUR, 0.5], [COAL_DUST, 0.4], [PROPOLIS, 0.2]] },
  { out: [ROYAL_JELLY, 1], in: [[ROYAL_COMB, 1]], time: 6, side: [[BEESWAX, 0.5], [HONEY_DROP, 0.5]] },
  { out: [BEESWAX, 1], in: [[GLOW_COMB, 1]], time: 6, side: [[GLOW_SHELL, 0.35], [GLOW_MUSHROOM, 0.2]] },
  { out: [BEESWAX, 1], in: [[CRYSTAL_COMB, 1]], time: 8, side: [[CRYSTAL_SHARD, 0.5]] },
  { out: [HONEY_DROP, 1], in: [[GILDED_COMB, 1]], time: 8, side: [[dirtyDust(GOLD_ORE), 0.4], [dirtyDust(SILVER_ORE), 0.3], [BEESWAX, 0.5]] },
  { out: [BEESWAX, 1], in: [[STARRY_COMB, 1]], time: 10, side: [[METEORIC_IRON, 0.15], [CRYSTAL_SHARD, 0.25], [HONEY_DROP, 0.3]] },
];
// the comb centrifuge is turned by a shaft, like a millstone
STATION_KINDS.combspin = { name: 'Comb Centrifuge', verb: 'Spinning', inputs: 2, powered: true, sides: 4, yieldUp: true, recipes: COMB_RECIPES };
// and the electric centrifuge spins combs too
STATION_KINDS.centrifuge.sides = 4;
STATION_KINDS.centrifuge.recipes.push(...COMB_RECIPES);
// honey must for mead, and honey cake
STATION_KINDS.winepress.recipes.push({ out: [HONEY_MUST, 1], in: [[HONEY_DROP, 6], [GLASS_BOTTLE, 1]], time: 8 });
STATION_KINDS.oven.recipes.push({ out: [HONEY_CAKE, 1], in: [[FLOUR, 3], [HONEY_DROP, 4], [EGG, 1]], time: 10 });

// ---------- v32: rubber and polymers ----------
import { LATEX, RUBBER, HIDE_GLUE, POLYMER_PELLETS, POLYMER_SHEET } from './blocks.js';
// the polymer press is turned by a shaft, like a millstone
STATION_KINDS.polypress = { name: 'Polymer Press', verb: 'Pressing', inputs: 2, powered: true, recipes: [
  { out: [POLYMER_PELLETS, 2], in: [[SAWDUST, 4], [HIDE_GLUE, 1]], time: 6 },
  { out: [POLYMER_SHEET, 1], in: [[POLYMER_PELLETS, 2]], time: 5 },
] };
// the oven cures latex into rubber, and renders leather into glue (hide cures into leather first)
STATION_KINDS.oven.recipes.push(
  { out: [RUBBER, 1], in: [[LATEX, 2]], time: 6 },
  { out: [HIDE_GLUE, 1], in: [[LEATHER, 1]], time: 8 },
);

// v33: cocoa and chocolate
import { COCOA_BEANS, ROASTED_COCOA, COCOA_POWDER, CHOC_MILK, HOT_CHOC, MELTED_CHOC } from './blocks.js';
STATION_KINDS.oven.recipes.push(
  { out: [ROASTED_COCOA, 1], in: [[COCOA_BEANS, 1]], time: 3 },
  { out: [HOT_CHOC, 1], in: [[CHOC_MILK, 1]], time: 4 },
);
STATION_KINDS.cookpot.recipes.push(
  { out: [MELTED_CHOC, 2], in: [[COCOA_POWDER, 2], [SUGAR, 1], [BUTTER, 1], [GLASS_BOTTLE, 2]], time: 6 },
);

// v34 A: pork and chicken
import { RAW_PORK, ROAST_PORK, RAW_CHICKEN, ROAST_CHICKEN, CHICKEN_SOUP, PORK_PIE, PORK_AND_BEANS } from './blocks.js';
STATION_KINDS.oven.recipes.push(
  { out: [ROAST_PORK, 1], in: [[RAW_PORK, 1]], time: 5 },
  { out: [ROAST_CHICKEN, 1], in: [[RAW_CHICKEN, 1]], time: 5 },
  { out: [PORK_PIE, 1], in: [[RAW_PORK, 2], [FLOUR, 2], [BUTTER, 1]], time: 10 },
);
STATION_KINDS.cookpot.recipes.push(
  { out: [CHICKEN_SOUP, 1], in: [[RAW_CHICKEN, 1], [CARROT, 1], [ONION, 1], [WATER_BUCKET, 1]], leaves: BUCKET, time: 8 },
  { out: [PORK_AND_BEANS, 1], in: [[RAW_PORK, 1], [BEANS, 3], [TOMATO, 1]], time: 8 },
);

// v34 B: dairy and preserving
import { CREAM, CHOC_ICE_CREAM, CHERRY_ICE_CREAM, HONEY_ICE_CREAM, ICE_LOLLY, VINEGAR, FISH_AND_CHIPS, URN_AGING, SMOKING, DRYING, CHIMNEY, ORANGE_JUICE } from './blocks.js';
STATION_KINDS.freezer.recipes.push(
  { out: [CHOC_ICE_CREAM, 2], in: [[CREAM, 1], [SUGAR, 1], [COCOA_POWDER, 1]], time: 8 },
  { out: [CHERRY_ICE_CREAM, 2], in: [[CREAM, 1], [SUGAR, 1], [CHERRIES, 2]], time: 8 },
  { out: [HONEY_ICE_CREAM, 2], in: [[CREAM, 1], [HONEY_DROP, 2]], time: 8 },
  { out: [ICE_LOLLY, 2], in: [[[ORANGE_JUICE, APPLE_JUICE, BERRY_JUICE, GRAPE_JUICE], 1], [STICK, 1]], leaves: GLASS_BOTTLE, time: 6 },
);
COMB_RECIPES.push({ out: [CREAM, 2], in: [[MILK_BUCKET, 1]], leaves: BUCKET, time: 4 });
STATION_KINDS.oven.recipes.push({ out: [FISH_AND_CHIPS, 1], in: [[[RAW_FISH, SALMON], 1], [POTATO, 2], [VINEGAR, 1]], time: 8 });
// a chimney over a fireplace is a smokehouse while the fire burns; a drying rack works in the sun
STATION_KINDS.smokehouse = { name: 'Chimney (smoking)', inputs: 4, storage: true, smokes: true, recipes: [] };
STATION_KINDS.dryrack = { name: 'Drying Rack', inputs: 4, storage: true, dries: true, recipes: [] };
export function smokedAt(world, x, y, z) {
  let h = y;
  while (h > 0 && world.get(x, h - 1, z) === CHIMNEY) h--;
  const d = BLOCKS[world.get(x, h - 1, z)];
  return !!(d?.hearth && d.lit);
}
// how fast a drying rack dries (0: not at all): in the sun, under open sky, in the day; twice as fast in the desert
export function dryingAt(world, x, y, z) {
  if (world.raining || !(world.daylight > 0.5) || !(world.skyAt?.(x, y + 1, z) >= 15)) return 0;
  return world.generator?.biomeAt?.(x, z) === 'desert' ? 2 : 1;
}
