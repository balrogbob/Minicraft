// Block and item definitions.

// Block ids (< 100). Stored in the world Uint8Array.
export const AIR = 0, GRASS = 1, DIRT = 2, STONE = 3, COBBLE = 4, LOG = 5, PLANKS = 6,
  LEAVES = 7, SAND = 8, GLASS = 9, TABLE = 10, BRICKS = 11, COAL_ORE = 12, BEDROCK = 13, WATER = 14,
  TORCH = 15, // standing torch; the only torch id that lives in the inventory
  TORCH_WALL_W = 16, TORCH_WALL_E = 17, TORCH_WALL_N = 18, TORCH_WALL_S = 19, // mounted on a wall at -x/+x/-z/+z
  WOOL = 20,
  WHEAT_0 = 21, WHEAT_1 = 22, WHEAT_2 = 23, WHEAT_3 = 24, // growth stages; 3 is ripe
  SUGAR_CANE = 25,
  CHURN = 26,
  // furniture; facing variants follow their base id (facing 0..3 = toward +z, -x, -z, +x)
  BED = 27, // 27..30: the head half of a bed (with the pillow); its foot half is BED_FOOT
  FURN_TABLE = 31,
  CHAIR = 32, // 32..35
  SHELF = 36,
  LAMP = 37, // 37 = empty, 38..40 = holding 1..3 units of fuel
  CARPET = 41,
  CURTAIN = 42, // 42..45: + axis (0 = hangs across x, 1 = across z) + 2 if open
  DOOR = 46, // 46..61: + facing*4 + 2 if open + 1 for the upper half
  BED_FOOT = 62, // 62..65: the foot half of a bed, one block toward where it faces
  OVEN = 66, // 66..73: + facing, + 4 while burning
  SMELTER = 74; // 74..81: + facing, + 4 while burning

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
  STRING = 133, ARROW = 134, BOW = 135,
  COAL_DUST = 136, SLIME_FUEL = 137, CHARCOAL = 138,
  FISHING_ROD = 139, RAW_FISH = 140, BAKED_FISH = 141;

// Charcoal (smelted from logs) can stand in for coal anywhere coal is used.
export const COAL_OR_CHARCOAL = [COAL, CHARCOAL];

// Texture atlas tile indices.
export const T = {
  GRASS_TOP: 0, GRASS_SIDE: 1, DIRT: 2, STONE: 3, COBBLE: 4, LOG_SIDE: 5, LOG_TOP: 6,
  PLANKS: 7, LEAVES: 8, SAND: 9, GLASS: 10, TABLE_TOP: 11, TABLE_SIDE: 12, BRICKS: 13,
  COAL_ORE: 14, BEDROCK: 15, TORCH: 16, WOOL: 17,
  WHEAT_0: 18, WHEAT_1: 19, WHEAT_2: 20, WHEAT_3: 21, SUGAR_CANE: 22, CHURN_SIDE: 23, CHURN_TOP: 24,
  BLANKET: 25, SHELF: 26, FLAME: 27, LAMP_EMPTY: 28, DOOR_LOWER: 29, DOOR_UPPER: 30, CURTAIN: 31,
  OVEN_SIDE: 32, OVEN_TOP: 33, OVEN_FRONT: 34, OVEN_FRONT_LIT: 35,
  SMELTER_SIDE: 36, SMELTER_TOP: 37, SMELTER_FRONT: 38, SMELTER_FRONT_LIT: 39,
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
    shape: o.model ? 'model' : o.shape ?? 'cube', // 'cube' | 'torch' | 'cross' (plants) | 'model' (furniture)
    model: o.model ?? null, // boxes: [x0, y0, z0, x1, y1, z1 (in 1/16 block), tiles, glow]
    solid: o.solid ?? !o.liquid, // blocks player movement
    wall: o.wall ?? null, // [dx, dz] of the wall a wall torch hangs on
    variantOf: o.variantOf ?? 0, // placed form of another item; never held in the inventory
    grows: o.grows ?? null, // id this plant grows into (or 'up' for sugar cane)
    // furniture state, encoded in which variant id is placed
    facing: o.facing ?? 0, open: !!o.open, upper: !!o.upper, axis: o.axis ?? 0, fuel: o.fuel ?? 0, foot: !!o.foot,
    front: o.front ?? null, // a different tile on the side that faces `facing` (ovens, smelters)
    lit: !!o.lit, station: o.station ?? null, // 'oven' | 'smelter'
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

// ---------- furniture ----------
// Models are lists of boxes in 1/16-block units, drawn for facing 0 (front toward +z). `tiles` is
// one atlas tile, or { top, side, bottom }. Glowing boxes are always drawn fully lit (a lamp flame).

export const FACING_DIRS = [[0, 1], [-1, 0], [0, -1], [1, 0]];

// Rotate a model by quarter turns about the block's vertical centre line.
function rotateModel(model, turns) {
  return model.map(([x0, y0, z0, x1, y1, z1, tiles, glow]) => {
    let ax = x0, az = z0, bx = x1, bz = z1;
    for (let k = 0; k < turns; k++) {
      [ax, az] = [16 - az, ax];
      [bx, bz] = [16 - bz, bx];
    }
    return [Math.min(ax, bx), y0, Math.min(az, bz), Math.max(ax, bx), y1, Math.max(az, bz), tiles, glow];
  });
}

const wood = T.PLANKS;
// A bed is two blocks long. Facing 0: the foot half is toward +z (toward the player who placed it)
// and the head half, with the headboard and pillow, is one block further away (toward -z).
const blanket = { top: T.BLANKET, side: T.BLANKET, bottom: T.WOOL };
const BED_HEAD_MODEL = [
  [0, 0, 0, 16, 3, 16, wood], // frame
  [0, 3, 0, 16, 8, 16, T.WOOL], // mattress
  [0, 3, 0, 16, 14, 2, wood], // headboard
  [3, 8, 3, 13, 10.5, 8, T.WOOL], // pillow
  [0, 8, 10, 16, 9, 16, blanket], // blanket, pulled up to here...
  [0, 8.5, 9.5, 16, 9.5, 11, T.WOOL], // ...with the sheet folded back over its edge
];
const BED_FOOT_MODEL = [
  [0, 0, 0, 16, 3, 16, wood],
  [0, 3, 0, 16, 8, 16, T.WOOL],
  [0, 8, 0, 16, 9, 14, blanket],
  [0, 4, 14, 16, 9, 15, blanket], // the blanket hangs over the end
  [0, 3, 15, 16, 8, 16, wood], // footboard
];
const TABLE_MODEL = [
  [0, 14, 0, 16, 16, 16, wood],
  [1, 0, 1, 3, 14, 3, wood], [13, 0, 1, 15, 14, 3, wood], [1, 0, 13, 3, 14, 15, wood], [13, 0, 13, 15, 14, 15, wood],
];
const CHAIR_MODEL = [
  [2, 7, 2, 14, 9, 14, wood], // seat
  [2, 0, 2, 4, 7, 4, wood], [12, 0, 2, 14, 7, 4, wood], [2, 0, 12, 4, 7, 14, wood], [12, 0, 12, 14, 7, 14, wood],
  [2, 9, 2, 4, 16, 4, wood], [12, 9, 2, 14, 16, 4, wood], // back posts
  [4, 11, 2, 12, 15, 3, wood], // back rest
];
const lampModel = (lit) => [
  [4, 0, 4, 12, 2, 12, T.COBBLE], // base
  [6.5, 2, 6.5, 9.5, 7, 9.5, lit ? T.FLAME : T.LAMP_EMPTY, lit], // the flame (or a cold wick)
  [5.2, 2, 5.2, 10.8, 9, 10.8, T.GLASS], // glass panes
  [5, 2, 5, 6, 9, 6, T.COBBLE], [10, 2, 5, 11, 9, 6, T.COBBLE], // corner posts holding up the cap
  [5, 2, 10, 6, 9, 11, T.COBBLE], [10, 2, 10, 11, 9, 11, T.COBBLE],
  [4.5, 9, 4.5, 11.5, 10, 11.5, T.COBBLE], // cap
  [7, 10, 7, 9, 12, 9, T.COBBLE], // handle
];
const CARPET_MODEL = [[0, 0, 0, 16, 1, 16, T.WOOL]];
const CURTAIN_CLOSED = [[0, 15, 7, 16, 16, 9, wood], [0, 0, 7.5, 16, 15, 8.5, T.CURTAIN]];
const CURTAIN_OPEN = [[0, 15, 7, 16, 16, 9, wood], [0, 0, 7, 3, 15, 9, T.CURTAIN], [13, 0, 7, 16, 15, 9, T.CURTAIN]];
const doorModel = (open, upper) => {
  const tile = upper ? T.DOOR_UPPER : T.DOOR_LOWER;
  return open ? [[0, 0, 0, 3, 16, 16, tile]] : [[0, 0, 13, 16, 16, 16, tile]];
};

const furniture = { sound: 'wood', hardness: 1.5, tool: 'axe', transparent: true };
for (let f = 0; f < 4; f++) {
  block(BED + f, { ...furniture, name: 'Bed', model: rotateModel(BED_HEAD_MODEL, f), variantOf: f ? BED : 0, drop: BED, facing: f, sound: 'wool' });
  block(BED_FOOT + f, { ...furniture, name: 'Bed', model: rotateModel(BED_FOOT_MODEL, f), variantOf: BED, drop: BED, facing: f, sound: 'wool', foot: true });
  block(CHAIR + f, { ...furniture, name: 'Chair', model: rotateModel(CHAIR_MODEL, f), variantOf: f ? CHAIR : 0, drop: CHAIR, facing: f });
}
block(FURN_TABLE, { ...furniture, name: 'Wooden Table', model: TABLE_MODEL });
block(SHELF, { name: 'Shelf', sound: 'wood', top: T.PLANKS, bottom: T.PLANKS, side: T.SHELF, hardness: 2, tool: 'axe' });
for (let fuel = 0; fuel <= 3; fuel++) {
  block(LAMP + fuel, {
    name: 'Lamp', sound: 'glass', transparent: true, solid: false, hardness: 0.5, model: lampModel(fuel > 0),
    light: fuel > 0 ? 15 : 0, variantOf: fuel ? LAMP : 0, drop: LAMP, fuel,
  });
}
block(CARPET, { name: 'Carpet', sound: 'wool', transparent: true, solid: false, hardness: 0.2, model: CARPET_MODEL });
for (let k = 0; k < 4; k++) {
  const axis = k & 1, open = k >> 1;
  block(CURTAIN + k, {
    name: 'Curtain', sound: 'wool', transparent: true, solid: false, hardness: 0.3,
    model: rotateModel(open ? CURTAIN_OPEN : CURTAIN_CLOSED, axis), variantOf: k ? CURTAIN : 0, drop: CURTAIN, axis, open: !!open,
  });
}
for (let k = 0; k < 16; k++) {
  const f = k >> 2, open = (k >> 1) & 1, upper = k & 1;
  block(DOOR + k, {
    ...furniture, name: 'Door', model: rotateModel(doorModel(open, upper), f), solid: !open,
    variantOf: k ? DOOR : 0, drop: upper ? 0 : DOOR, facing: f, open: !!open, upper: !!upper,
  });
}

export const isBed = (id) => (id >= BED && id < BED + 4) || (id >= BED_FOOT && id < BED_FOOT + 4);
export const isChair = (id) => id >= CHAIR && id < CHAIR + 4;
export const isLamp = (id) => id >= LAMP && id <= LAMP + 3;
export const isCurtain = (id) => id >= CURTAIN && id < CURTAIN + 4;
export const isDoor = (id) => id >= DOOR && id < DOOR + 16;

// Ovens and smelters: cube blocks whose front faces you; they glow while burning fuel.
for (const [base, station, name, side, top, front, frontLit] of [
  [OVEN, 'oven', 'Oven', T.OVEN_SIDE, T.OVEN_TOP, T.OVEN_FRONT, T.OVEN_FRONT_LIT],
  [SMELTER, 'smelter', 'Smelter', T.SMELTER_SIDE, T.SMELTER_TOP, T.SMELTER_FRONT, T.SMELTER_FRONT_LIT],
]) {
  for (let k = 0; k < 8; k++) {
    const facing = k & 3, lit = k >= 4;
    block(base + k, {
      name, station, side, top, bottom: side, front: lit ? frontLit : front, facing, lit, light: lit ? 13 : 0,
      hardness: 2.5, tool: 'pick', variantOf: k ? base : 0, drop: base,
    });
  }
}
export const stationKind = (id) => BLOCKS[id]?.station ?? null;
export const doorId = (facing, open, upper) => DOOR + facing * 4 + (open ? 2 : 0) + (upper ? 1 : 0);
export const MAX_LAMP_FUEL = 3;

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
  [COAL_DUST]: { name: 'Coal Dust' },
  [SLIME_FUEL]: { name: 'Slime Fuel', stack: 1 }, // a bucket of lamp fuel; the bucket stays with you
  [CHARCOAL]: { name: 'Charcoal' },
  [FISHING_ROD]: { name: 'Fishing Rod', stack: 1 },
  [RAW_FISH]: { name: 'Raw Fish', food: 2 },
  [BAKED_FISH]: { name: 'Baked Fish', food: 6 },
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
//   in:    [[id, count], ...] used up (an id can be a list of alternatives, e.g. coal or charcoal)
//   tools: ids you must have, which are not used up (e.g. the mortar)
//   also:  extra things given back (e.g. the empty bucket after churning milk)
//   table / churn: needs a crafting table / butter churn nearby
export const RECIPES = [
  { out: [PLANKS, 4], in: [[LOG, 1]] },
  { out: [STICK, 4], in: [[PLANKS, 2]] },
  { out: [TABLE, 1], in: [[PLANKS, 4]] },
  { out: [TORCH, 4], in: [[COAL_OR_CHARCOAL, 1], [STICK, 1]] },
  { out: [WOOD_PICK, 1], in: [[PLANKS, 3], [STICK, 2]], table: true },
  { out: [WOOD_AXE, 1], in: [[PLANKS, 3], [STICK, 2]], table: true },
  { out: [WOOD_SHOVEL, 1], in: [[PLANKS, 1], [STICK, 2]], table: true },
  { out: [STONE_PICK, 1], in: [[COBBLE, 3], [STICK, 2]], table: true },
  { out: [STONE_AXE, 1], in: [[COBBLE, 3], [STICK, 2]], table: true },
  { out: [STONE_SHOVEL, 1], in: [[COBBLE, 1], [STICK, 2]], table: true },
  { out: [BRICKS, 4], in: [[COBBLE, 4]], table: true },
  { out: [BUCKET, 1], in: [[PLANKS, 3]], table: true },
  { out: [MORTAR, 1], in: [[COBBLE, 3], [STICK, 1]], table: true },
  { out: [CHURN, 1], in: [[PLANKS, 7]], table: true },
  { out: [FLOUR, 1], in: [[WHEAT, 1]], tools: [MORTAR] },
  { out: [SUGAR, 1], in: [[SUGAR_CANE, 1]], tools: [MORTAR] },
  { out: [BUTTER, 1], in: [[MILK_BUCKET, 1]], also: [[BUCKET, 1]], churn: true },
  { out: [STRING, 1], in: [[SLIME_BUCKET, 1], [WHEAT, 3]], also: [[BUCKET, 1]] },
  { out: [ARROW, 1], in: [[FEATHER, 1], [COBBLE, 1], [STICK, 1]], table: true },
  { out: [BOW, 1], in: [[STICK, 3], [STRING, 3]], table: true },
  { out: [FISHING_ROD, 1], in: [[STICK, 3], [STRING, 2]], table: true },
  { out: [COAL_DUST, 1], in: [[COAL_OR_CHARCOAL, 1]], tools: [MORTAR] },
  { out: [SLIME_FUEL, 1], in: [[COAL_DUST, 3], [SLIME_BUCKET, 1]] },
  { out: [LAMP, 1], in: [[GLASS, 1], [COBBLE, 2]], table: true },
  { out: [BED, 1], in: [[WOOL, 3], [PLANKS, 3]], table: true },
  { out: [FURN_TABLE, 1], in: [[PLANKS, 3], [STICK, 4]], table: true },
  { out: [CHAIR, 1], in: [[PLANKS, 2], [STICK, 3]], table: true },
  { out: [SHELF, 1], in: [[PLANKS, 5]], table: true },
  { out: [CARPET, 3], in: [[WOOL, 2]], table: true },
  { out: [CURTAIN, 1], in: [[WOOL, 2], [STICK, 1]], table: true },
  { out: [DOOR, 1], in: [[PLANKS, 4]], table: true },
  { out: [OVEN, 1], in: [[COBBLE, 6], [SAND, 2]], table: true },
  { out: [SMELTER, 1], in: [[COBBLE, 8]], table: true },
];
// (Bread, cookies, cake and baked fish are baked in the oven, and glass, stone and charcoal come from the smelter:
// see stations.js.)
