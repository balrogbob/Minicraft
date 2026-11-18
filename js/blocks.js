// Block and item definitions.

// Block ids (< 100). Stored in the world Uint8Array.
export const AIR = 0, GRASS = 1, DIRT = 2, STONE = 3, COBBLE = 4, LOG = 5, PLANKS = 6,
  LEAVES = 7, SAND = 8, GLASS = 9, TABLE = 10, BRICKS = 11, COAL_ORE = 12, BEDROCK = 13, WATER = 14,
  TORCH = 15, // standing torch; the only torch id that lives in the inventory
  TORCH_WALL_W = 16, TORCH_WALL_E = 17, TORCH_WALL_N = 18, TORCH_WALL_S = 19, // mounted on a wall at -x/+x/-z/+z
  WOOL = 20,
  WHEAT_0 = 21, WHEAT_1 = 22, WHEAT_2 = 23, WHEAT_3 = 24, // growth stages; 3 is ripe
  SUGAR_CANE = 25,
  CHURN = 26;

// Wall direction [dx, dz] for each wall-torch variant, in id order.
export const WALL_TORCH_DIRS = [[-1, 0], [1, 0], [0, -1], [0, 1]];
export const MAX_LIGHT = 15;

// Item-only ids (>= 100). Only ever live in the inventory.
export const STICK = 100, COAL = 101,
  WOOD_PICK = 110, STONE_PICK = 111,
  WOOD_AXE = 112, STONE_AXE = 113,
  WOOD_SHOVEL = 114, STONE_SHOVEL = 115,
  SEEDS = 120, WHEAT = 121, FLOUR = 122, SUGAR = 123, BUTTER = 124,
  BREAD = 125, COOKIE = 126, CAKE = 127,
  BUCKET = 128, MILK_BUCKET = 129, SLIME_BUCKET = 130,
  FEATHER = 131, MORTAR = 132,
  STRING = 133, ARROW = 134, BOW = 135;

// Texture atlas tile indices.
export const T = {
  GRASS_TOP: 0, GRASS_SIDE: 1, DIRT: 2, STONE: 3, COBBLE: 4, LOG_SIDE: 5, LOG_TOP: 6,
  PLANKS: 7, LEAVES: 8, SAND: 9, GLASS: 10, TABLE_TOP: 11, TABLE_SIDE: 12, BRICKS: 13,
  COAL_ORE: 14, BEDROCK: 15, TORCH: 16, WOOL: 17,
  WHEAT_0: 18, WHEAT_1: 19, WHEAT_2: 20, WHEAT_3: 21, SUGAR_CANE: 22, CHURN_SIDE: 23, CHURN_TOP: 24,
};

export const BLOCKS = [];

function block(id, o) {
  const tex = o.tex ?? 0;
  BLOCKS[id] = {
    id,
    name: o.name,
    top: o.top ?? tex,
    bottom: o.bottom ?? tex,
    side: o.side ?? tex,
    transparent: !!o.transparent,
    hardness: o.hardness ?? 1, // seconds to break by hand with no penalty
    tool: o.tool ?? null, // 'pick' | 'axe' | 'shovel'
    needsTool: !!o.needsTool, // drops nothing (and is slow) without the right tool
    drop: o.drop ?? id, // id, or function returning id (0 = nothing), or function returning [[id, n], ...]
    sound: o.sound ?? 'stone', // material for dig / step / place sounds
    liquid: !!o.liquid, // not solid, not targetable, never in the inventory
    light: o.light ?? 0, // light level this block emits (0-15)
    shape: o.shape ?? 'cube', // 'cube' | 'torch' | 'cross' (plants: two crossed sprites)
    solid: o.solid ?? !o.liquid, // blocks player movement
    wall: o.wall ?? null, // [dx, dz] of the wall a wall torch hangs on
    variantOf: o.variantOf ?? 0, // placed form of another item; never held in the inventory
    grows: o.grows ?? null, // id this plant grows into (or 'up' for sugar cane)
  };
}

block(GRASS, { name: 'Grass', sound: 'grass', top: T.GRASS_TOP, bottom: T.DIRT, side: T.GRASS_SIDE, hardness: 0.9, tool: 'shovel', drop: DIRT });
block(DIRT, { name: 'Dirt', sound: 'grass', tex: T.DIRT, hardness: 0.75, tool: 'shovel' });
block(STONE, { name: 'Stone', tex: T.STONE, hardness: 2.25, tool: 'pick', needsTool: true, drop: COBBLE });
block(COBBLE, { name: 'Cobblestone', tex: T.COBBLE, hardness: 2.5, tool: 'pick', needsTool: true });
block(LOG, { name: 'Log', sound: 'wood', top: T.LOG_TOP, bottom: T.LOG_TOP, side: T.LOG_SIDE, hardness: 2.5, tool: 'axe' });
block(PLANKS, { name: 'Planks', sound: 'wood', tex: T.PLANKS, hardness: 2, tool: 'axe' });
block(LEAVES, { name: 'Leaves', sound: 'leaves', tex: T.LEAVES, transparent: true, hardness: 0.3, drop: () => (Math.random() < 0.12 ? STICK : 0) });
block(SAND, { name: 'Sand', sound: 'sand', tex: T.SAND, hardness: 0.75, tool: 'shovel' });
block(GLASS, { name: 'Glass', sound: 'glass', tex: T.GLASS, transparent: true, hardness: 0.4 });
block(TABLE, { name: 'Crafting Table', sound: 'wood', top: T.TABLE_TOP, bottom: T.PLANKS, side: T.TABLE_SIDE, hardness: 2.5, tool: 'axe' });
block(BRICKS, { name: 'Stone Bricks', tex: T.BRICKS, hardness: 2.5, tool: 'pick', needsTool: true });
block(COAL_ORE, { name: 'Coal Ore', tex: T.COAL_ORE, hardness: 3, tool: 'pick', needsTool: true, drop: COAL });
block(BEDROCK, { name: 'Bedrock', tex: T.BEDROCK, hardness: Infinity });
block(WATER, { name: 'Water', transparent: true, liquid: true, hardness: Infinity, drop: 0, sound: 'water' });
const torch = { name: 'Torch', sound: 'wood', tex: T.TORCH, transparent: true, solid: false, shape: 'torch', hardness: 0, light: 14, drop: TORCH };
block(TORCH, torch);
WALL_TORCH_DIRS.forEach((wall, i) => block(TORCH_WALL_W + i, { ...torch, wall, variantOf: TORCH }));

export const isTorch = (id) => id >= TORCH && id <= TORCH_WALL_S;

block(WOOL, { name: 'Wool', sound: 'wool', tex: T.WOOL, hardness: 0.8 });

// Plants: walk-through crossed sprites that break instantly.
const plant = { sound: 'leaves', transparent: true, solid: false, shape: 'cross', hardness: 0 };
// young wheat gives its seed back; ripe wheat gives wheat and usually a seed or two to replant
const youngWheat = { ...plant, name: 'Wheat', variantOf: SEEDS, drop: () => [[SEEDS, 1]] };
block(WHEAT_0, { ...youngWheat, tex: T.WHEAT_0, grows: WHEAT_1 });
block(WHEAT_1, { ...youngWheat, tex: T.WHEAT_1, grows: WHEAT_2 });
block(WHEAT_2, { ...youngWheat, tex: T.WHEAT_2, grows: WHEAT_3 });
block(WHEAT_3, { ...youngWheat, tex: T.WHEAT_3, drop: () => [[WHEAT, 1], [SEEDS, Math.random() < 0.5 ? 2 : 1]] });
block(SUGAR_CANE, { ...plant, name: 'Sugar Cane', tex: T.SUGAR_CANE, grows: 'up' });
export const isWheat = (id) => id >= WHEAT_0 && id <= WHEAT_3;
export const MAX_CANE_HEIGHT = 3;

block(CHURN, { name: 'Butter Churn', sound: 'wood', top: T.CHURN_TOP, bottom: T.PLANKS, side: T.CHURN_SIDE, hardness: 2, tool: 'axe' });

// Non-block items.
export const ITEMS = {
  [STICK]: { name: 'Stick' },
  [COAL]: { name: 'Coal' },
  [WOOD_PICK]: { name: 'Wooden Pickaxe', tool: { type: 'pick', speed: 2.5 } },
  [STONE_PICK]: { name: 'Stone Pickaxe', tool: { type: 'pick', speed: 5 } },
  [WOOD_AXE]: { name: 'Wooden Axe', tool: { type: 'axe', speed: 2.5 } },
  [STONE_AXE]: { name: 'Stone Axe', tool: { type: 'axe', speed: 5 } },
  [WOOD_SHOVEL]: { name: 'Wooden Shovel', tool: { type: 'shovel', speed: 2.5 } },
  [STONE_SHOVEL]: { name: 'Stone Shovel', tool: { type: 'shovel', speed: 5 } },
  [SEEDS]: { name: 'Wheat Seeds', places: WHEAT_0 },
  [WHEAT]: { name: 'Wheat' },
  [FLOUR]: { name: 'Flour' },
  [SUGAR]: { name: 'Sugar' },
  [BUTTER]: { name: 'Butter' },
  // food: hunger points restored (the bar holds 20)
  [BREAD]: { name: 'Bread', food: 5 },
  [COOKIE]: { name: 'Cookie', food: 2 },
  [CAKE]: { name: 'Cake', food: 12, stack: 16 },
  [BUCKET]: { name: 'Wooden Bucket', stack: 16 },
  [MILK_BUCKET]: { name: 'Milk Bucket', stack: 1 },
  [SLIME_BUCKET]: { name: 'Slime Bucket', stack: 1, drink: 'poison' }, // drinking it gives food poisoning
  [FEATHER]: { name: 'Feather' },
  [MORTAR]: { name: 'Mortar and Pestle', stack: 1 },
  [STRING]: { name: 'Wheat String' },
  [ARROW]: { name: 'Arrow' },
  [BOW]: { name: 'Bow', stack: 1 },
};

export const foodValue = (id) => ITEMS[id]?.food ?? 0;

// Placeable block that can live in the inventory.
export function isBlock(id) {
  return id > 0 && id < 100 && !!BLOCKS[id] && !BLOCKS[id].liquid && !BLOCKS[id].variantOf;
}

export function itemName(id) {
  return isBlock(id) ? BLOCKS[id].name : ITEMS[id]?.name ?? '?';
}

export function maxStack(id) {
  return ITEMS[id]?.stack ?? (ITEMS[id]?.tool ? 1 : 64);
}

// Seconds needed to break `blockId` while holding `heldId`.
export function breakTime(blockId, heldId) {
  const b = BLOCKS[blockId];
  if (!b || b.hardness === Infinity) return Infinity;
  const tool = ITEMS[heldId]?.tool;
  if (tool && b.tool === tool.type) return b.hardness / tool.speed;
  return b.needsTool ? b.hardness * 3.3 : b.hardness;
}

// What breaking `blockId` with `heldId` yields, as [[id, count], ...] (empty = nothing).
export function dropsFor(blockId, heldId) {
  const b = BLOCKS[blockId];
  if (!b) return [];
  if (b.needsTool && ITEMS[heldId]?.tool?.type !== b.tool) return [];
  const d = typeof b.drop === 'function' ? b.drop() : b.drop;
  if (Array.isArray(d)) return d.filter(([id, n]) => id && n > 0);
  return d ? [[d, 1]] : [];
}

// Crafting recipes.
//   out:   [id, count] made
//   in:    [[id, count], ...] used up
//   tools: ids you must have, which are not used up (e.g. the mortar)
//   also:  extra things given back (e.g. the empty bucket after churning milk)
//   table / churn: needs a crafting table / butter churn nearby
export const RECIPES = [
  { out: [PLANKS, 4], in: [[LOG, 1]] },
  { out: [STICK, 4], in: [[PLANKS, 2]] },
  { out: [TABLE, 1], in: [[PLANKS, 4]] },
  { out: [TORCH, 4], in: [[COAL, 1], [STICK, 1]] },
  { out: [WOOD_PICK, 1], in: [[PLANKS, 3], [STICK, 2]], table: true },
  { out: [WOOD_AXE, 1], in: [[PLANKS, 3], [STICK, 2]], table: true },
  { out: [WOOD_SHOVEL, 1], in: [[PLANKS, 1], [STICK, 2]], table: true },
  { out: [STONE_PICK, 1], in: [[COBBLE, 3], [STICK, 2]], table: true },
  { out: [STONE_AXE, 1], in: [[COBBLE, 3], [STICK, 2]], table: true },
  { out: [STONE_SHOVEL, 1], in: [[COBBLE, 1], [STICK, 2]], table: true },
  { out: [BRICKS, 4], in: [[COBBLE, 4]], table: true },
  { out: [GLASS, 4], in: [[SAND, 4], [COAL, 1]], table: true },
  { out: [BUCKET, 1], in: [[PLANKS, 3]], table: true },
  { out: [MORTAR, 1], in: [[COBBLE, 3], [STICK, 1]], table: true },
  { out: [CHURN, 1], in: [[PLANKS, 7]], table: true },
  { out: [FLOUR, 1], in: [[WHEAT, 1]], tools: [MORTAR] },
  { out: [SUGAR, 1], in: [[SUGAR_CANE, 1]], tools: [MORTAR] },
  { out: [BUTTER, 1], in: [[MILK_BUCKET, 1]], also: [[BUCKET, 1]], churn: true },
  { out: [BREAD, 1], in: [[FLOUR, 3]], table: true },
  { out: [COOKIE, 9], in: [[FLOUR, 3], [SUGAR, 3], [BUTTER, 1]], tools: [MILK_BUCKET], table: true },
  { out: [CAKE, 1], in: [[FLOUR, 3], [SUGAR, 3], [BUTTER, 3]], table: true },
  { out: [STRING, 3], in: [[SLIME_BUCKET, 1], [WHEAT, 3]], also: [[BUCKET, 1]] },
  { out: [ARROW, 4], in: [[FEATHER, 1], [COBBLE, 1], [STICK, 1]], table: true },
  { out: [BOW, 1], in: [[STICK, 3], [STRING, 3]], table: true },
];
