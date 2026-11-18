// Block and item definitions.

// Block ids (< 100, and 190..255). Stored in the world Uint8Array. Item ids are 100..189 and 300 up.
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
  SMELTER = 74, // 74..81: + facing, + 4 while burning
  // metal ores (see ORES below)
  IRON_ORE = 82, COPPER_ORE = 83, TIN_ORE = 84, LEAD_ORE = 85, ZINC_ORE = 86, SULPHUR_ORE = 87,
  BAUXITE = 88, SILVER_ORE = 89, GOLD_ORE = 90, TUNGSTEN_ORE = 91,
  SAPLING = 92, // grows into a tree
  GRAVEL = 93, CLAY = 94, CLAY_BRICKS = 95, FIRE_BRICKS = 96,
  // (ids 100..189 are items; more blocks continue from 190)
  WATER_FLOW = 190, // 190..196: flowing water, level 1..7 (7 is next to the source)
  WATER_FALL = 197, // falling water
  CRUSHER = 198, // 198..201: + facing
  WATER_WHEEL = 202, // 202 = axle along x, 203 = along z
  KINETIC = 204, // 204..230: shafts, small gears and large gears; see kineticId()
  BLAST_SMELTER = 231; // 231..238: + facing, + 4 while burning

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
  FISHING_ROD = 139, RAW_FISH = 140, BAKED_FISH = 141,
  IRON_INGOT = 142, COPPER_INGOT = 143, TIN_INGOT = 144, LEAD_INGOT = 145, ZINC_INGOT = 146,
  ALUMINIUM_INGOT = 147, SILVER_INGOT = 148, GOLD_INGOT = 149, TUNGSTEN_INGOT = 150, SULPHUR = 151,
  BRONZE_INGOT = 152, ELECTRUM_INGOT = 153, STAINLESS_INGOT = 154, STEEL_INGOT = 155, AL_BRONZE_INGOT = 156;
// Metal tools are 160 + 3 * (material index in TOOL_MATERIALS) + 0 pick / 1 axe / 2 shovel.
export const METAL_TOOLS = 160;
// Items added after the metal tools.
export const FLINT = 300, CLAY_BALL = 301, BRICK = 302, FIRE_CLAY = 303, FIRE_BRICK = 304,
  FLINT_DUST = 305, CLAY_DUST = 306, WATER_BUCKET = 307,
  ORE_DUST = 310; // 310..: the dust of each smeltable ore, in ORES order (see oreDust())

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
  ORE0: 40, // 40..49: the ores, in ORES order
  SAPLING: 50, GRAVEL: 51, CLAY: 52, CLAY_BRICKS: 53, FIRE_BRICKS: 54,
  CRUSHER_SIDE: 55, CRUSHER_TOP: 56, CRUSHER_FRONT: 57, STAINLESS: 58,
};

// Ores, deepest-reaching last. tier: the pickaxe tier needed to mine it (see TOOL_TIERS);
// y range and chance (per 4x4x4 cell of stone) control where veins are generated.
// They drop the ore block itself. The smelter turns it into `ingot`, and the rock crusher into two of
// its dust (each of which smelts into an ingot). Sulphur can only be got out of its ore by crushing.
export const ORES = [
  { id: IRON_ORE, name: 'Iron Ore', ingot: IRON_INGOT, tier: 3, hardness: 3.5, y: [4, 44], chance: 0.05, color: [226, 182, 156] },
  { id: COPPER_ORE, name: 'Copper Ore', ingot: COPPER_INGOT, tier: 2, hardness: 3, y: [8, 50], chance: 0.055, color: [216, 116, 60] },
  { id: TIN_ORE, name: 'Tin Ore', ingot: TIN_INGOT, tier: 2, hardness: 3, y: [6, 40], chance: 0.035, color: [170, 174, 182] },
  { id: LEAD_ORE, name: 'Lead Ore', ingot: LEAD_INGOT, tier: 2, hardness: 3, y: [4, 34], chance: 0.03, color: [84, 92, 118] },
  { id: ZINC_ORE, name: 'Zinc Ore', ingot: ZINC_INGOT, tier: 2, hardness: 3, y: [6, 40], chance: 0.035, color: [150, 190, 200] },
  { id: SULPHUR_ORE, name: 'Sulphur Ore', crush: [SULPHUR, 2], tier: 2, hardness: 3, y: [2, 26], chance: 0.03, color: [232, 214, 52] },
  { id: BAUXITE, name: 'Bauxite', ingot: ALUMINIUM_INGOT, tier: 2, hardness: 2.75, y: [16, 56], chance: 0.05, color: [186, 92, 58] },
  { id: SILVER_ORE, name: 'Silver Ore', ingot: SILVER_INGOT, tier: 4, hardness: 3.5, y: [2, 22], chance: 0.016, color: [236, 238, 246] },
  { id: GOLD_ORE, name: 'Gold Ore', ingot: GOLD_INGOT, tier: 4, hardness: 3.5, y: [1, 16], chance: 0.013, color: [248, 204, 56] },
  { id: TUNGSTEN_ORE, name: 'Tungsten Ore', ingot: TUNGSTEN_INGOT, tier: 5, hardness: 5, y: [1, 9], chance: 0.03, color: [118, 104, 170] },
];

// Tool tiers: a block with `tier` n only drops (and only breaks quickly) with a tool of tier n or more.
export const TOOL_TIERS = {
  1: 'wooden', 2: 'stone', 3: 'copper-class', 4: 'iron-class', 5: 'stainless steel', 6: 'tungsten',
};

// Metal tool materials. Copper, tin, zinc and aluminium are a little better than stone; the alloys
// are better again within their class. Pickaxe and axe: 3 ingots + 2 sticks; shovel: 1 ingot + 2 sticks.
export const TOOL_MATERIALS = [
  { key: 'copper', name: 'Copper', ingot: COPPER_INGOT, tier: 3, speed: 6, dmg: 1 },
  { key: 'tin', name: 'Tin', ingot: TIN_INGOT, tier: 3, speed: 6, dmg: 1 },
  { key: 'zinc', name: 'Zinc', ingot: ZINC_INGOT, tier: 3, speed: 6, dmg: 1 },
  { key: 'aluminium', name: 'Aluminium', ingot: ALUMINIUM_INGOT, tier: 3, speed: 6.5, dmg: 1 },
  { key: 'bronze', name: 'Bronze', ingot: BRONZE_INGOT, tier: 3, speed: 7, dmg: 2 },
  { key: 'albronze', name: 'Aluminium Bronze', ingot: AL_BRONZE_INGOT, tier: 3, speed: 7.5, dmg: 2 },
  { key: 'iron', name: 'Iron', ingot: IRON_INGOT, tier: 4, speed: 8, dmg: 2 },
  { key: 'steel', name: 'Steel', ingot: STEEL_INGOT, tier: 4, speed: 9.5, dmg: 3 },
  { key: 'stainless', name: 'Stainless Steel', ingot: STAINLESS_INGOT, tier: 5, speed: 11, dmg: 4 },
  { key: 'tungsten', name: 'Tungsten', ingot: TUNGSTEN_INGOT, tier: 6, speed: 14, dmg: 5 },
];
export const TOOL_KINDS = ['pick', 'axe', 'shovel'];
export const metalTool = (matIndex, kind) => METAL_TOOLS + matIndex * 3 + TOOL_KINDS.indexOf(kind);

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
    tier: o.tier ?? 1, // ...of at least this tier
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
    lit: !!o.lit, station: o.station ?? null, // 'oven' | 'smelter' | 'blast' | 'crusher'
    stationBase: o.stationBase ?? 0, // the id of a station's first variant
    kinetic: o.kinetic ?? null, // { part: 'wheel' | 'shaft' | 'gear' | 'large', mat, axis: 0 x | 1 y | 2 z }
  };
}

block(GRASS, { name: 'Grass', sound: 'grass', top: T.GRASS_TOP, bottom: T.DIRT, side: T.GRASS_SIDE, hardness: 0.9, tool: 'shovel', drop: DIRT });
block(DIRT, { name: 'Dirt', sound: 'grass', tex: T.DIRT, hardness: 0.75, tool: 'shovel' });
block(STONE, { name: 'Stone', tex: T.STONE, hardness: 2.25, tool: 'pick', needsTool: true, drop: COBBLE });
block(COBBLE, { name: 'Cobblestone', tex: T.COBBLE, hardness: 2.5, tool: 'pick', needsTool: true });
block(LOG, { name: 'Log', sound: 'wood', top: T.LOG_TOP, bottom: T.LOG_TOP, side: T.LOG_SIDE, hardness: 2.5, tool: 'axe' });
block(PLANKS, { name: 'Planks', sound: 'wood', tex: T.PLANKS, hardness: 2, tool: 'axe' });
// leaves sometimes drop a sapling or a stick, whether broken or left to decay after the tree is cut
block(LEAVES, {
  name: 'Leaves', sound: 'leaves', tex: T.LEAVES, transparent: true, hardness: 0.3,
  drop: () => [[SAPLING, Math.random() < 0.08 ? 1 : 0], [STICK, Math.random() < 0.12 ? 1 : 0]],
});
block(SAND, { name: 'Sand', sound: 'sand', tex: T.SAND, hardness: 0.75, tool: 'shovel' });
// gravel sometimes gives flint instead; clay breaks up into clay balls
block(GRAVEL, { name: 'Gravel', sound: 'sand', tex: T.GRAVEL, hardness: 0.9, tool: 'shovel', drop: () => (Math.random() < 0.1 ? FLINT : GRAVEL) });
block(CLAY, { name: 'Clay', sound: 'grass', tex: T.CLAY, hardness: 0.9, tool: 'shovel', drop: () => [[CLAY_BALL, 4]] });
block(CLAY_BRICKS, { name: 'Bricks', tex: T.CLAY_BRICKS, hardness: 2.5, tool: 'pick', needsTool: true });
block(FIRE_BRICKS, { name: 'Fire Bricks', tex: T.FIRE_BRICKS, hardness: 3, tool: 'pick', needsTool: true });
block(GLASS, { name: 'Glass', sound: 'glass', tex: T.GLASS, transparent: true, hardness: 0.4 });
block(TABLE, { name: 'Crafting Table', sound: 'wood', top: T.TABLE_TOP, bottom: T.PLANKS, side: T.TABLE_SIDE, hardness: 2.5, tool: 'axe' });
block(BRICKS, { name: 'Stone Bricks', tex: T.BRICKS, hardness: 2.5, tool: 'pick', needsTool: true });
block(COAL_ORE, { name: 'Coal Ore', tex: T.COAL_ORE, hardness: 3, tool: 'pick', needsTool: true, drop: COAL });
ORES.forEach((o, i) => block(o.id, {
  name: o.name, tex: T.ORE0 + i, hardness: o.hardness, tool: 'pick', needsTool: true, tier: o.tier,
  drop: o.drop ? () => [[o.drop, 1 + (Math.random() < 0.4 ? 1 : 0)]] : o.id,
}));
export const isOre = (id) => id >= IRON_ORE && id <= TUNGSTEN_ORE;
block(BEDROCK, { name: 'Bedrock', tex: T.BEDROCK, hardness: Infinity });
block(WATER, { name: 'Water', transparent: true, liquid: true, hardness: Infinity, drop: 0, sound: 'water' });
// Flowing water: spreads out from a source (placed with a water bucket) and falls over edges.
for (let level = 1; level <= 7; level++) {
  block(WATER_FLOW + level - 1, { name: 'Water', transparent: true, liquid: true, hardness: Infinity, drop: 0, sound: 'water', variantOf: WATER });
}
block(WATER_FALL, { name: 'Water', transparent: true, liquid: true, hardness: Infinity, drop: 0, sound: 'water', variantOf: WATER });
export const isWaterId = (id) => id === WATER || (id >= WATER_FLOW && id <= WATER_FALL);
export const isFlowing = (id) => id >= WATER_FLOW && id <= WATER_FALL;
// How strongly a water cell pushes water outward: 8 for a source or falling water, else its level.
export const waterLevel = (id) => (id === WATER || id === WATER_FALL ? 8 : id >= WATER_FLOW && id < WATER_FALL ? id - WATER_FLOW + 1 : 0);
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
block(SAPLING, { ...plant, name: 'Sapling', tex: T.SAPLING, grows: 'tree' });
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
  [BLAST_SMELTER, 'blast', 'Blast Smelter', T.FIRE_BRICKS, T.FIRE_BRICKS, T.SMELTER_FRONT, T.SMELTER_FRONT_LIT],
]) {
  for (let k = 0; k < 8; k++) {
    const facing = k & 3, lit = k >= 4;
    block(base + k, {
      name, station, side, top, bottom: side, front: lit ? frontLit : front, facing, lit, light: lit ? 13 : 0,
      hardness: 2.5, tool: 'pick', variantOf: k ? base : 0, drop: base, stationBase: base,
    });
  }
}
// The rock crusher: driven by a shaft or gear turning against any of its faces (see kinetics.js).
for (let k = 0; k < 4; k++) {
  block(CRUSHER + k, {
    name: 'Rock Crusher', station: 'crusher', side: T.CRUSHER_SIDE, top: T.CRUSHER_TOP, bottom: T.CRUSHER_SIDE,
    front: T.CRUSHER_FRONT, facing: k, hardness: 2.5, tool: 'pick', variantOf: k ? CRUSHER : 0, drop: CRUSHER, stationBase: CRUSHER,
  });
}
export const stationKind = (id) => BLOCKS[id]?.station ?? null;

// Power transmission. Each material sets how much load its shafts and gears can carry; a water wheel
// gives WHEEL_POWER, and a crusher takes CRUSHER_LOAD for each 1x of speed it turns at.
export const KINETIC_MATS = [
  { key: 'wood', name: 'Wooden', cap: 16, tile: T.PLANKS },
  { key: 'stone', name: 'Stone', cap: 64, tile: T.STONE },
  { key: 'stainless', name: 'Stainless Steel', cap: 256, tile: T.STAINLESS },
];
export const KINETIC_PARTS = ['shaft', 'gear', 'large'];
export const WHEEL_POWER = 8, CRUSHER_LOAD = 4;
// Shafts, small gears and large gears: one id for each part, material and axle direction.
export const kineticId = (part, mat, axis = 0) => KINETIC + (KINETIC_PARTS.indexOf(part) * 3 + mat) * 3 + axis;
const PART_NAMES = { shaft: 'Shaft', gear: 'Small Gear', large: 'Large Gear' };
const kineticShape = { shape: 'kinetic', transparent: true, sound: 'wood', hardness: 1, tool: 'axe' };
for (let a = 0; a < 2; a++) {
  block(WATER_WHEEL + a, { ...kineticShape, name: 'Water Wheel', variantOf: a ? WATER_WHEEL : 0, drop: WATER_WHEEL, kinetic: { part: 'wheel', mat: 0, axis: a ? 2 : 0 } });
}
KINETIC_PARTS.forEach((part) => KINETIC_MATS.forEach((m, mat) => {
  for (let axis = 0; axis < 3; axis++) {
    const base = kineticId(part, mat, 0);
    block(kineticId(part, mat, axis), {
      ...kineticShape, name: `${m.name} ${PART_NAMES[part]}`, variantOf: axis ? base : 0, drop: base,
      kinetic: { part, mat, axis },
      ...(mat ? { sound: 'stone', tool: 'pick', hardness: 1.5 } : {}),
    });
  }
}));
export const isKinetic = (id) => !!BLOCKS[id]?.kinetic;
export const doorId = (facing, open, upper) => DOOR + facing * 4 + (open ? 2 : 0) + (upper ? 1 : 0);
export const MAX_LAMP_FUEL = 3;

// Non-block items.
export const ITEMS = {
  [STICK]: { name: 'Stick' },
  [COAL]: { name: 'Coal' },
  [WOOD_PICK]: { name: 'Wooden Pickaxe', tool: { type: 'pick', speed: 2.5, tier: 1 } },
  [STONE_PICK]: { name: 'Stone Pickaxe', tool: { type: 'pick', speed: 5, tier: 2 } },
  [WOOD_AXE]: { name: 'Wooden Axe', tool: { type: 'axe', speed: 2.5, tier: 1 } },
  [STONE_AXE]: { name: 'Stone Axe', tool: { type: 'axe', speed: 5, tier: 2 } },
  [WOOD_SHOVEL]: { name: 'Wooden Shovel', tool: { type: 'shovel', speed: 2.5, tier: 1 } },
  [STONE_SHOVEL]: { name: 'Stone Shovel', tool: { type: 'shovel', speed: 5, tier: 2 } },
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
  [FLINT]: { name: 'Flint' },
  [CLAY_BALL]: { name: 'Clay Ball' },
  [BRICK]: { name: 'Brick' },
  [FIRE_CLAY]: { name: 'Fire Clay' },
  [FIRE_BRICK]: { name: 'Fire Brick' },
  [FLINT_DUST]: { name: 'Flint Dust' },
  [CLAY_DUST]: { name: 'Clay Dust' },
  [WATER_BUCKET]: { name: 'Water Bucket', stack: 1 },
  [RAW_FISH]: { name: 'Raw Fish', food: 2 },
  [BAKED_FISH]: { name: 'Baked Fish', food: 6 },
};

const INGOT_NAMES = {
  [IRON_INGOT]: 'Iron Ingot', [COPPER_INGOT]: 'Copper Ingot', [TIN_INGOT]: 'Tin Ingot', [LEAD_INGOT]: 'Lead Ingot',
  [ZINC_INGOT]: 'Zinc Ingot', [ALUMINIUM_INGOT]: 'Aluminium Ingot', [SILVER_INGOT]: 'Silver Ingot', [GOLD_INGOT]: 'Gold Ingot',
  [TUNGSTEN_INGOT]: 'Tungsten Ingot', [BRONZE_INGOT]: 'Bronze Ingot', [ELECTRUM_INGOT]: 'Electrum Ingot',
  [STAINLESS_INGOT]: 'Stainless Steel Ingot', [STEEL_INGOT]: 'Steel Ingot', [AL_BRONZE_INGOT]: 'Aluminium Bronze Ingot',
};
for (const [id, name] of Object.entries(INGOT_NAMES)) ITEMS[id] = { name, ingot: true };
ITEMS[SULPHUR] = { name: 'Sulphur' };
// Ore dust from the rock crusher: one kind for each ore that smelts into an ingot.
export const oreDust = (oreId) => ORE_DUST + ORES.findIndex((o) => o.id === oreId);
for (const o of ORES) if (o.ingot) ITEMS[oreDust(o.id)] = { name: o.name.replace(' Ore', '') + ' Dust', dust: o };
const KIND_NAMES = { pick: 'Pickaxe', axe: 'Axe', shovel: 'Shovel' };
const KIND_DAMAGE = { pick: 4, axe: 6, shovel: 4 }; // stone tools hit for 4 / 6 / 4
TOOL_MATERIALS.forEach((m, i) => {
  for (const kind of TOOL_KINDS) {
    ITEMS[metalTool(i, kind)] = {
      name: `${m.name} ${KIND_NAMES[kind]}`, mat: m.key,
      tool: { type: kind, speed: m.speed, tier: m.tier, damage: KIND_DAMAGE[kind] + m.dmg },
    };
  }
});

export const foodValue = (id) => ITEMS[id]?.food ?? 0;

// Placeable block that can live in the inventory.
export function isBlock(id) {
  return id > 0 && id < 256 && !!BLOCKS[id] && !BLOCKS[id].liquid && !BLOCKS[id].variantOf;
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
  if (tool && b.tool === tool.type && (!b.needsTool || tool.tier >= b.tier)) return b.hardness / tool.speed;
  return b.needsTool ? b.hardness * 3.3 : b.hardness;
}

// What breaking `blockId` with `heldId` yields, as [[id, count], ...] (empty = nothing).
export function dropsFor(blockId, heldId) {
  const b = BLOCKS[blockId];
  if (!b) return [];
  const tool = ITEMS[heldId]?.tool;
  if (b.needsTool && (tool?.type !== b.tool || tool.tier < b.tier)) return [];
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
  // gravel, flint and clay
  { out: [FLINT, 1], in: [[GRAVEL, 3]] },
  { out: [ARROW, 4], in: [[FLINT, 1], [STICK, 1], [FEATHER, 1]], table: true },
  { out: [CLAY, 1], in: [[CLAY_BALL, 4]] },
  { out: [CLAY_BRICKS, 1], in: [[BRICK, 4]], table: true },
  { out: [CLAY_BALL, 4], in: [[CLAY_DUST, 4], [WATER_BUCKET, 1]], also: [[BUCKET, 1]], metal: CLAY_DUST },
  { out: [FIRE_CLAY, 4], in: [[CLAY_DUST, 2], [FLINT_DUST, 2]], metal: FLINT_DUST },
  { out: [FIRE_BRICKS, 1], in: [[FIRE_BRICK, 4]], table: true, metal: FIRE_BRICK },
  { out: [BLAST_SMELTER, 1], in: [[SMELTER, 1], [FIRE_BRICK, 8]], table: true, metal: FIRE_BRICK },
  // power: water wheels, shafts and gears, and the rock crusher they drive
  { out: [WATER_WHEEL, 1], in: [[PLANKS, 8], [STICK, 4]], table: true },
  { out: [CRUSHER, 1], in: [[BRONZE_INGOT, 3], [COBBLE, 4], [kineticId('large', 0), 1], [kineticId('gear', 0), 1]], table: true, metal: BRONZE_INGOT },
];
// Shafts, small gears (shaft + 4 of the material) and large gears (small gear + 4 more), in each material.
// Stainless steel parts are only listed once you're carrying the ingots.
[[PLANKS, 0], [STONE, 0], [STAINLESS_INGOT, STAINLESS_INGOT]].forEach(([mat, show], i) => {
  const extra = show ? { metal: show } : {};
  RECIPES.push(
    { out: [kineticId('shaft', i), 4], in: [[mat, 2]], table: true, ...extra },
    { out: [kineticId('gear', i), 1], in: [[kineticId('shaft', i), 1], [mat, 4]], table: true, ...extra },
    { out: [kineticId('large', i), 1], in: [[kineticId('gear', i), 1], [mat, 4]], table: true, ...extra },
  );
});
// Metal tools. `metal` hides the recipe from the list until you're carrying that ingot.
TOOL_MATERIALS.forEach((m, i) => {
  RECIPES.push(
    { out: [metalTool(i, 'pick'), 1], in: [[m.ingot, 3], [STICK, 2]], table: true, metal: m.ingot },
    { out: [metalTool(i, 'axe'), 1], in: [[m.ingot, 3], [STICK, 2]], table: true, metal: m.ingot },
    { out: [metalTool(i, 'shovel'), 1], in: [[m.ingot, 1], [STICK, 2]], table: true, metal: m.ingot },
  );
});
// (Bread, cookies, cake and baked fish are baked in the oven, and glass, stone and charcoal come from the smelter:
// see stations.js.)
