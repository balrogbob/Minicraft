// Block and item definitions.

// Block ids: < 100, 190..255, 400..999 and 1100 up. Stored in each chunk's Uint16Array.
// Item ids: 100..189, 300..399 and 1000..1099 (never stored in the world).
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
  BLAST_SMELTER = 231, // 231..238: + facing, + 4 while burning
  // (ids 239..399 are unused or items; blocks continue from 400)
  CHEST = 400, // 400..403: + facing
  IRON_CHEST = 404, // 404..407: + facing
  LADDER = 408, // 408..411: + facing (it faces away from the wall it's fixed to)
  SCAFFOLD = 412,
  SIGN = 413, // 413..416: on a wall, + facing
  SIGN_POST = 417, // 417..420: standing on a block, + facing
  SALTPETRE_ORE = 421, BLAST_CHARGE = 422,
  MIRROR_LAMP = 427, // 427..430: a lamp with an electrum reflector; + fuel like LAMP
  PIPE = 424, PUMP = 425, SPOUT = 426, // lead pipework (see machines.js)
  FILAMENT_LAMP = 431, // 431 = dark, 432 = lit (while it's turned by a shaft)
  MILLSTONE = 433, SAW = 434, // saw: 434..437 + facing
  BELLOWS = 438, TRIP_HAMMER = 439, // hammer: 439..442 + facing
  DRILL = 443, // 443..446 + facing, 447 = facing down
  WINDMILL = 448, // 448 = axle along x, 449 = along z
  BELT = 450, // 450..453 + facing (the way it carries things)
  HOPPER = 454, // 454..457 + facing, 458 = facing down
  LAVA = 460, OBSIDIAN = 461,
  RAIL = 462, // 462..473: see RAIL_SHAPES
  SNOW_GRASS = 474, SNOW = 475, ICE = 476, SANDSTONE = 477, CACTUS = 478;

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
  ORE_DUST = 310, // 310..: the dust of each smeltable ore, in ORES order (see oreDust())
  WOOD_SWORD = 320, STONE_SWORD = 321,
  METAL_SWORDS = 322, // 322..331: one per TOOL_MATERIALS entry
  HIDE = 332, LEATHER = 333,
  ARMOUR = 340, // 340..359: + material * 4 + piece (see ARMOUR_MATS, ARMOUR_PIECES)
  PLATES = 360, // 360..364: hammered metal plates (see PLATE_METALS)
  SALTPETRE = 366, GUNPOWDER = 367, LEAD_SINKER = 368, WEIGHTED_ROD = 369, LEAD_BUCKET = 370, LAVA_BUCKET = 372,
  GOLD_CLOCK = 373, COMPASS = 374, SILVER_ARROW = 375, FILAMENT = 376, DRILL_BIT = 377,
  MINECART = 378, MAP = 379, PAPER = 380;

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
  CHEST_SIDE: 59, CHEST_TOP: 60, CHEST_FRONT: 61, IRON_CHEST_SIDE: 62, IRON_CHEST_TOP: 63, IRON_CHEST_FRONT: 64,
  SALTPETRE_ORE: 65, ELECTRUM: 66, CHARGE_SIDE: 67, CHARGE_TOP: 68, LAVA: 69, OBSIDIAN: 70,
  MILL_SIDE: 71, MILL_TOP: 72, SAW_SIDE: 73, SAW_TOP: 74, SAW_FRONT: 75, BELLOWS_SIDE: 76, BELLOWS_TOP: 77,
  HAMMER_SIDE: 78, HAMMER_FRONT: 79, HAMMER_TOP: 80, PUMP_SIDE: 81, PUMP_TOP: 82, LEAD: 83,
  DRILL_SIDE: 84, DRILL_FRONT: 85, BELT0: 86, // 86..89: belt tops, carrying toward each facing
  IRON: 90, FILAMENT_OFF: 91, FILAMENT_ON: 92,
  SNOW: 93, SNOW_GRASS_SIDE: 94, ICE: 95, SANDSTONE_SIDE: 96, SANDSTONE_TOP: 97, CACTUS_SIDE: 98, CACTUS_TOP: 99, GOLD: 100,
  DYED_WOOL: 100, // 101..109: wool in COLORS 1..9 (white wool is WOOL)
  STAINED: 110, // 110..119: stained glass in each colour
  PAINTED: 120, // 120..129: painted planks in each colour
  FLOWER0: 130, // 130..134: poppy, dandelion, cornflower, lavender, daisy
  TRAPDOOR: 135,
  GEARBOX: 136, FRAME_BACK: 137,
  MOSSY_BRICKS: 138, SHRINE_SIDE: 139, SHRINE_TOP: 140, SHRINE_SPENT: 141, CAULDRON: 142, CAULDRON_WATER: 143,
  BUSH: 144, BUSH_RIPE: 145,
  GLOW_MUSHROOM: 146, CRYSTAL: 147, CRYSTAL_CLUSTER: 148, GEODE_SHELL: 149,
  HIVE_SIDE: 150, HIVE_TOP: 151, HIVE_FRONT: 152, HIVE_FULL: 153, BELL: 154,
  ALTAR_TOP: 155, ALTAR_SIDE: 156, TOMB_SHRINE: 157, CRYPT_SHRINE: 158, FORT_SHRINE: 159, SHRINE_GLYPH: 160,
  DART_FRONT: 161, TRAP_PLATE: 162, FROST_BRICKS: 163, FORT_BRICKS: 164, CUT_SANDSTONE: 165,
  OBSERVER_FACE: 166, OBSERVER_FACE_ON: 167, OBSERVER_SIDE: 168, GAUGE_FACE: 169, GAUGE_FACE_ON: 170, HARVESTER_FRONT: 171,
  ENGINE_SIDE: 172, ENGINE_FRONT: 173, ENGINE_FRONT_ON: 174, ENGINE_TOP: 175,
  PAINTED_DOOR: 176, // 176..195: the lower then upper half of a door painted in each colour
  GLOW_LAMP: 196, // 196..205: a glow lamp in each colour
  PILLAR_SIDE: 206, PILLAR_TOP: 207, SAND_PILLAR_SIDE: 208, SAND_PILLAR_TOP: 209, CANDLE: 210,
  WIRE_OFF: 211, WIRE_ON: 212, LOGIC_BASE: 213, EJECTOR_FRONT: 214, CRAFTER_FRONT: 215, TANK_WATER: 216,
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
    shape: o.shape ?? (o.model ? 'model' : 'cube'), // 'cube' | 'torch' | 'cross' (plants) | 'model' (furniture) | 'fence' | 'pane'
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
    climb: !!o.climb, // ladders and scaffolding: you can climb up and down inside them
    sign: !!o.sign, post: !!o.post, // holds a few lines of text (see signs.js); post: stands on a post
    lampBase: o.lampBase ?? 0, // a lamp's first (empty) variant
    blastproof: !!o.blastproof, // blasting charges can't break it
    belt: !!o.belt, hopper: !!o.hopper,
    rail: o.rail ?? null, // { ends: [facing, facing], slope: facing it rises toward (or -1), powered }
    prickly: !!o.prickly, // hurts to touch (cactus)
    machine: o.machine ?? null, // { load }: driven by a shaft or gear turning against it (see kinetics.js)
    down: !!o.down, // a drill or hopper pointing down rather than to one side
    boxes: o.boxes ?? null, // collision boxes (in 1/16 block) for solid blocks that don't fill their cell
    slab: o.slab ?? null, // { mat, top } for slabs; stairs: { mat } in `stair`
    stair: o.stair ?? null,
    gate: !!o.gate, trapdoor: !!o.trapdoor,
    color: o.color ?? -1, // index into COLORS for dyed blocks
    switch: o.switch ?? null, on: !!o.on, floor: !!o.floor, // levers, buttons and pressure plates
    frame: !!o.frame,
    water: o.water ?? 0, // a cauldron's water level (0..3)
    hive: o.hive ?? -1, bell: !!o.bell, // a bee hive's honey level; the bell in the middle of a village
    lair: !!o.lair, trap: !!o.trap, dart: !!o.dart, // lair shrines and a tomb's traps
    sensor: o.sensor ?? null, harvester: !!o.harvester, engine: !!o.engine, // automation (see machines.js)
    doorBase: o.doorBase ?? 0, // a door's first variant (each colour of door has its own 16)
    tint: o.tint ?? 0, // the colour of the light it gives (see TINTS)
    wallTex: o.wallTex ?? null, // the tile a wall is built of
    paneTex: o.paneTex ?? null, // a coloured glass pane's tile
    painting: o.painting ?? null, // { art, w, h }: a painting hung on a wall (see paintings.js)
    logic: o.logic ?? null, // 'wire' | 'inverter' | 'delay' | 'latch': signal parts worked out by logic.js
    flip: o.flip ?? 0, // a switch's id in its other state (on <-> off), for the newer switches
    directed: !!o.directed, // a switch that only signals the block in front of it (inverters, delays, latches)
    sorts: o.sorts ?? null, // a belt that sends things off to the side: 'split' (left and right in turn) | 'sort' (matches go left)
    ejector: !!o.ejector, collector: !!o.collector, elevator: !!o.elevator, // more automation (see machines.js)
    tank: !!o.tank, valve: !!o.valve, sprinkler: !!o.sprinkler, // liquids (see machines.js)
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
// cold and dry places
block(SNOW_GRASS, { name: 'Snowy Grass', sound: 'grass', top: T.SNOW, bottom: T.DIRT, side: T.SNOW_GRASS_SIDE, hardness: 0.9, tool: 'shovel', drop: DIRT });
block(SNOW, { name: 'Snow', sound: 'sand', tex: T.SNOW, hardness: 0.5, tool: 'shovel' });
block(ICE, { name: 'Ice', sound: 'glass', tex: T.ICE, transparent: true, hardness: 0.6, drop: 0 }); // melts into water when broken
block(SANDSTONE, { name: 'Sandstone', top: T.SANDSTONE_TOP, bottom: T.SANDSTONE_TOP, side: T.SANDSTONE_SIDE, hardness: 2, tool: 'pick', needsTool: true });
block(CACTUS, {
  name: 'Cactus', sound: 'leaves', hardness: 0.5, transparent: true, prickly: true,
  model: [[1, 0, 1, 15, 16, 15, { top: T.CACTUS_TOP, side: T.CACTUS_SIDE, bottom: T.CACTUS_TOP }]],
});
block(BEDROCK, { name: 'Bedrock', tex: T.BEDROCK, hardness: Infinity, blastproof: true });
// saltpetre: a white crust on cave walls; it breaks into saltpetre for gunpowder
block(SALTPETRE_ORE, {
  name: 'Saltpetre', tex: T.SALTPETRE_ORE, hardness: 2.5, tool: 'pick', needsTool: true, tier: 2,
  drop: () => [[SALTPETRE, 1 + (Math.random() < 0.5 ? 1 : 0)]],
});
// blasting charge: tap it to light the fuse (see main.js)
block(BLAST_CHARGE, { name: 'Blasting Charge', sound: 'wool', top: T.CHARGE_TOP, bottom: T.CHARGE_TOP, side: T.CHARGE_SIDE, hardness: 0.3 });
// lava pools at the bottom of deep caves. Water poured onto lava (or lava onto water) turns it to obsidian.
block(LAVA, { name: 'Lava', tex: T.LAVA, liquid: true, hardness: Infinity, drop: 0, light: 15, sound: 'water', blastproof: true });
block(OBSIDIAN, { name: 'Obsidian', tex: T.OBSIDIAN, hardness: 25, tool: 'pick', needsTool: true, tier: 5, blastproof: true });
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
const doorModel = (open, upper, color = -1) => {
  const tile = color < 0 ? (upper ? T.DOOR_UPPER : T.DOOR_LOWER) : T.PAINTED_DOOR + color * 2 + (upper ? 1 : 0);
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
// The mirror lamp has an electrum reflector behind the flame and lights a much wider area.
const mirrorLampModel = (lit) => [...lampModel(lit), [5.5, 2, 10.6, 10.5, 8.5, 11.2, T.ELECTRUM]];
for (let fuel = 0; fuel <= 3; fuel++) {
  block(LAMP + fuel, {
    name: 'Lamp', sound: 'glass', transparent: true, solid: false, hardness: 0.5, model: lampModel(fuel > 0),
    light: fuel > 0 ? 15 : 0, variantOf: fuel ? LAMP : 0, drop: LAMP, fuel, lampBase: LAMP,
  });
  block(MIRROR_LAMP + fuel, {
    name: 'Mirror Lamp', sound: 'glass', transparent: true, solid: false, hardness: 0.5, model: mirrorLampModel(fuel > 0),
    light: fuel > 0 ? 22 : 0, variantOf: fuel ? MIRROR_LAMP : 0, drop: MIRROR_LAMP, fuel, lampBase: MIRROR_LAMP,
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
    variantOf: k ? DOOR : 0, drop: upper ? 0 : DOOR, facing: f, open: !!open, upper: !!upper, doorBase: DOOR,
  });
}

export const isBed = (id) => (id >= BED && id < BED + 4) || (id >= BED_FOOT && id < BED_FOOT + 4);
export const isChair = (id) => id >= CHAIR && id < CHAIR + 4;
export const isLamp = (id) => !!BLOCKS[id]?.lampBase;
export const isCurtain = (id) => id >= CURTAIN && id < CURTAIN + 4;
export const isDoor = (id) => !!BLOCKS[id]?.doorBase;

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
// Chests: storage only. Their contents are kept with the stations' (see stations.js).
for (const [base, station, name, side, top, front, hardness] of [
  [CHEST, 'chest', 'Chest', T.CHEST_SIDE, T.CHEST_TOP, T.CHEST_FRONT, 2],
  [IRON_CHEST, 'ironchest', 'Iron-Banded Chest', T.IRON_CHEST_SIDE, T.IRON_CHEST_TOP, T.IRON_CHEST_FRONT, 2.5],
]) {
  for (let f = 0; f < 4; f++) {
    block(base + f, {
      name, station, side, top, bottom: top, front, facing: f, sound: 'wood', hardness, tool: 'axe',
      variantOf: f ? base : 0, drop: base, stationBase: base,
    });
  }
}
export const stationKind = (id) => BLOCKS[id]?.station ?? null;
// Load each machine puts on the network for each 1x of speed it turns at.
export const MACHINE_LOAD = { crusher: 4, mill: 2, saw: 3, hammer: 4, bellows: 2, pump: 6, drill: 6, lamp: 1, belt: 0.5 };
for (let k = 0; k < 4; k++) BLOCKS[CRUSHER + k].machine = { load: MACHINE_LOAD.crusher };
const machine = { hardness: 2.5, tool: 'pick', sound: 'stone' };
block(MILLSTONE, { ...machine, name: 'Millstone', station: 'mill', side: T.MILL_SIDE, top: T.MILL_TOP, bottom: T.STONE, stationBase: MILLSTONE, machine: { load: MACHINE_LOAD.mill } });
block(BELLOWS, { name: 'Bellows', sound: 'wood', tool: 'axe', hardness: 1.5, side: T.BELLOWS_SIDE, top: T.BELLOWS_TOP, bottom: T.PLANKS, machine: { load: MACHINE_LOAD.bellows } });
block(PUMP, { ...machine, name: 'Pump', side: T.PUMP_SIDE, top: T.PUMP_TOP, bottom: T.PUMP_TOP, machine: { load: MACHINE_LOAD.pump } });
for (let k = 0; k < 4; k++) {
  block(SAW + k, {
    ...machine, name: 'Mechanical Saw', station: 'saw', side: T.SAW_SIDE, top: T.SAW_TOP, bottom: T.PLANKS, front: T.SAW_FRONT,
    facing: k, variantOf: k ? SAW : 0, drop: SAW, stationBase: SAW, machine: { load: MACHINE_LOAD.saw },
  });
  block(TRIP_HAMMER + k, {
    ...machine, name: 'Trip Hammer', station: 'hammer', side: T.HAMMER_SIDE, top: T.HAMMER_TOP, bottom: T.COBBLE, front: T.HAMMER_FRONT,
    facing: k, variantOf: k ? TRIP_HAMMER : 0, drop: TRIP_HAMMER, stationBase: TRIP_HAMMER, machine: { load: MACHINE_LOAD.hammer },
  });
}
// The drill bores a tunnel up to 32 blocks straight ahead (or down), passing what it digs out of its back.
for (let k = 0; k < 5; k++) {
  const down = k === 4;
  block(DRILL + k, {
    ...machine, name: 'Drill', side: T.DRILL_SIDE, top: T.DRILL_SIDE, bottom: down ? T.DRILL_FRONT : T.DRILL_SIDE,
    front: down ? null : T.DRILL_FRONT, facing: down ? 0 : k, down, variantOf: k ? DRILL : 0, drop: DRILL, machine: { load: MACHINE_LOAD.drill },
  });
}
// The filament lamp glows (brighter than any lamp) while a shaft turns it, and needs no fuel.
for (let k = 0; k < 2; k++) {
  block(FILAMENT_LAMP + k, {
    name: 'Filament Lamp', sound: 'glass', hardness: 0.8, transparent: true, tex: k ? T.FILAMENT_ON : T.FILAMENT_OFF,
    light: k ? 18 : 0, variantOf: k ? FILAMENT_LAMP : 0, drop: FILAMENT_LAMP, machine: { load: MACHINE_LOAD.lamp }, lit: !!k,
  });
}
// Lead pipes join up whichever way they touch (see world.js); a pump pushes water through them out of spouts.
block(PIPE, { name: 'Lead Pipe', shape: 'pipe', transparent: true, sound: 'stone', hardness: 1, tool: 'pick' });
block(SPOUT, {
  name: 'Spout', sound: 'stone', hardness: 1, tool: 'pick', transparent: true, solid: false,
  model: [[5, 6, 5, 11, 16, 11, T.LEAD], [4, 3, 4, 12, 6, 12, T.LEAD], [6, 2, 6, 10, 3, 10, T.LEAD]],
});
// Belts carry things along (while turned); hoppers take things out of the chest or machine above and
// pass them on to the one they point at. Hopper models are drawn for facing 0 (toward +z).
const BELT_MODEL = (f) => [[0, 0, 0, 16, 4, 16, { top: T.BELT0 + f, side: T.LOG_SIDE, bottom: T.PLANKS }]];
for (let f = 0; f < 4; f++) {
  block(BELT + f, {
    name: 'Conveyor Belt', sound: 'wool', hardness: 0.8, tool: 'axe', transparent: true, model: BELT_MODEL(f),
    facing: f, variantOf: f ? BELT : 0, drop: BELT, machine: { load: MACHINE_LOAD.belt }, belt: true,
  });
}
const HOPPER_TOP = [[0, 10, 0, 16, 16, 16, T.IRON], [4, 5, 4, 12, 10, 12, T.IRON]];
for (let k = 0; k < 5; k++) {
  const down = k === 4;
  block(HOPPER + k, {
    name: 'Hopper', sound: 'stone', hardness: 2, tool: 'pick', transparent: true, facing: down ? 0 : k, down,
    model: down ? [...HOPPER_TOP, [6, 0, 6, 10, 5, 10, T.IRON]] : rotateModel([...HOPPER_TOP, [6, 5, 12, 10, 9, 16, T.IRON]], k),
    variantOf: k ? HOPPER : 0, drop: HOPPER, hopper: true,
  });
}

// Rails: flat track on the ground. Each shape joins two of the four sides (facings 0..3 = +z, -x, -z,
// +x); a slope rises one block toward one side. Powered rails speed a minecart up while a shaft turns them.
export const RAIL_SHAPES = [
  { ends: [0, 2] }, { ends: [1, 3] }, // straight along z, along x
  { ends: [0, 1] }, { ends: [1, 2] }, { ends: [2, 3] }, { ends: [3, 0] }, // curves
  { ends: [0, 2], slope: 0 }, { ends: [1, 3], slope: 1 }, { ends: [0, 2], slope: 2 }, { ends: [1, 3], slope: 3 }, // slopes
  { ends: [0, 2], powered: true }, { ends: [1, 3], powered: true },
];
export const POWERED_RAIL = RAIL + 10;
const RAIL_IRON = T.IRON, TIE = T.PLANKS;
function railModel({ ends, slope = -1, powered }) {
  const boxes = [];
  const rail = powered ? T.GOLD : RAIL_IRON;
  if (slope >= 0) {
    // a staircase of ties and rail pieces climbing toward +z, turned to face the slope
    const steps = [];
    for (let k = 0; k < 4; k++) {
      const z = k * 4, y = k * 4;
      steps.push([1, y, z, 15, y + 1, z + 3, TIE], [3, y + 1, z, 5, y + 2.5, z + 4, rail], [11, y + 1, z, 13, y + 2.5, z + 4, rail]);
    }
    return rotateModel(steps, slope);
  }
  const [a, b] = ends;
  if ((a + 2) % 4 === b) {
    // straight: drawn along z, turned for x
    const m = [];
    for (const z of [1.5, 6, 10.5, 15 - 2.5]) m.push([1, 0, z, 15, 1, z + 2.5, TIE]);
    m.push([3, 1, 0, 5, 2.5, 16, rail], [11, 1, 0, 13, 2.5, 16, rail]);
    return a % 2 ? rotateModel(m, 1) : m;
  }
  // curves: drawn joining +z (front) and +x (right), in short straight pieces, then turned
  const m = [];
  const N = 8;
  for (let i = 0; i < N; i++) {
    const t0 = (i / N) * (Math.PI / 2), t1 = ((i + 1) / N) * (Math.PI / 2);
    for (const r of [4, 12]) {
      const xa = 16 - Math.cos(t0) * r, za = 16 - Math.sin(t0) * r, xb = 16 - Math.cos(t1) * r, zb = 16 - Math.sin(t1) * r;
      m.push([Math.min(xa, xb) - 0.8, 1, Math.min(za, zb) - 0.8, Math.max(xa, xb) + 0.8, 2.5, Math.max(za, zb) + 0.8, rail]);
    }
    if (i % 2) continue;
    const tm = (t0 + t1) / 2;
    for (const r of [2.5, 8, 13.5]) {
      const cx = 16 - Math.cos(tm) * r, cz = 16 - Math.sin(tm) * r;
      m.push([cx - 2, 0, cz - 2, cx + 2, 1, cz + 2, TIE]);
    }
  }
  // which turn takes the +z/+x corner to the corner between ends a and b
  const turnFor = { '0,3': 0, '3,0': 0, '0,1': 1, '1,0': 1, '1,2': 2, '2,1': 2, '2,3': 3, '3,2': 3 };
  return rotateModel(m, turnFor[`${a},${b}`]);
}
RAIL_SHAPES.forEach((shape, k) => {
  const powered = !!shape.powered;
  block(RAIL + k, {
    name: powered ? 'Powered Rail' : 'Rail', sound: 'stone', transparent: true, solid: false, hardness: 0.7, tool: 'pick',
    model: railModel(shape), rail: { ends: shape.ends, slope: shape.slope ?? -1, powered },
    variantOf: powered ? (k === 10 ? 0 : POWERED_RAIL) : k ? RAIL : 0, drop: powered ? POWERED_RAIL : RAIL,
    ...(powered ? { machine: { load: 1 } } : {}),
  });
});
export const isRail = (id) => !!BLOCKS[id]?.rail;
export const railId = (ends, slope = -1, powered = false) => {
  if (powered) return POWERED_RAIL + (ends[0] % 2);
  const k = RAIL_SHAPES.findIndex((s) => !s.powered && (s.slope ?? -1) === slope &&
    ((s.ends[0] === ends[0] && s.ends[1] === ends[1]) || (s.ends[0] === ends[1] && s.ends[1] === ends[0])));
  return RAIL + Math.max(0, k);
};

// Ladders hang on a wall (facing 0: the wall is toward -z); scaffolding stands on its own. You climb
// both: walk into them (or jump) to go up, back off to go down, and stand still to slide down slowly.
const LADDER_MODEL = [
  [2, 0, 0, 3.5, 16, 1.5, wood], [12.5, 0, 0, 14, 16, 1.5, wood], // rails
  ...[1.5, 5.5, 9.5, 13.5].map((y) => [3.5, y, 0.25, 12.5, y + 1.2, 1.25, wood]), // rungs
];
for (let f = 0; f < 4; f++) {
  block(LADDER + f, {
    name: 'Ladder', sound: 'wood', transparent: true, solid: false, hardness: 0.6, tool: 'axe', climb: true,
    model: rotateModel(LADDER_MODEL, f), facing: f, variantOf: f ? LADDER : 0, drop: LADDER,
  });
}
const SCAFFOLD_MODEL = [
  ...[[0, 0], [14, 0], [0, 14], [14, 14]].map(([x, z]) => [x, 0, z, x + 2, 16, z + 2, wood]), // posts
  [0, 14, 0, 16, 16, 2, wood], [0, 14, 14, 16, 16, 16, wood], [0, 14, 2, 2, 16, 14, wood], [14, 14, 2, 16, 16, 14, wood], // top frame
  [2, 15, 5, 14, 16, 7, wood], [2, 15, 9, 14, 16, 11, wood], // slats
  [2, 7, 0.5, 14, 8.5, 1.5, wood], [2, 7, 14.5, 14, 8.5, 15.5, wood], // braces
];
block(SCAFFOLD, { name: 'Scaffolding', sound: 'wood', transparent: true, solid: false, hardness: 0.3, climb: true, model: SCAFFOLD_MODEL });
export const isClimbable = (id) => !!BLOCKS[id]?.climb;

// Signs: a board on a wall, or on a post. The text is drawn by signs.js.
const WALL_SIGN_MODEL = [[1, 4, 0, 15, 12, 1.5, wood]];
const SIGN_POST_MODEL = [[7.2, 0, 7.2, 8.8, 8.5, 8.8, T.LOG_SIDE], [1, 8, 7, 15, 16, 8.5, wood]];
for (let f = 0; f < 4; f++) {
  block(SIGN + f, {
    name: 'Sign', sound: 'wood', transparent: true, solid: false, hardness: 0.6, tool: 'axe', sign: true,
    model: rotateModel(WALL_SIGN_MODEL, f), facing: f, variantOf: f ? SIGN : 0, drop: SIGN,
  });
  block(SIGN_POST + f, {
    name: 'Sign', sound: 'wood', transparent: true, solid: false, hardness: 0.6, tool: 'axe', sign: true, post: true,
    model: rotateModel(SIGN_POST_MODEL, f), facing: f, variantOf: SIGN, drop: SIGN,
  });
}
export const isSign = (id) => !!BLOCKS[id]?.sign;

// Power transmission. Each material sets how much load its shafts and gears can carry; a water wheel
// gives WHEEL_POWER, and a crusher takes CRUSHER_LOAD for each 1x of speed it turns at.
export const KINETIC_MATS = [
  { key: 'wood', name: 'Wooden', cap: 16, tile: T.PLANKS },
  { key: 'stone', name: 'Stone', cap: 64, tile: T.STONE },
  { key: 'stainless', name: 'Stainless Steel', cap: 256, tile: T.STAINLESS },
];
export const KINETIC_PARTS = ['shaft', 'gear', 'large'];
export const WHEEL_POWER = 8, CRUSHER_LOAD = MACHINE_LOAD.crusher;
// Shafts, small gears and large gears: one id for each part, material and axle direction.
export const kineticId = (part, mat, axis = 0) => KINETIC + (KINETIC_PARTS.indexOf(part) * 3 + mat) * 3 + axis;
const PART_NAMES = { shaft: 'Shaft', gear: 'Small Gear', large: 'Large Gear' };
const kineticShape = { shape: 'kinetic', transparent: true, sound: 'wood', hardness: 1, tool: 'axe' };
for (let a = 0; a < 2; a++) {
  block(WINDMILL + a, { ...kineticShape, name: 'Windmill', variantOf: a ? WINDMILL : 0, drop: WINDMILL, kinetic: { part: 'windmill', mat: 0, axis: a ? 2 : 0 } });
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
export const doorId = (facing, open, upper, base = DOOR) => base + facing * 4 + (open ? 2 : 0) + (upper ? 1 : 0);
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
  [SALTPETRE]: { name: 'Saltpetre' },
  [GUNPOWDER]: { name: 'Gunpowder' },
  [LEAD_SINKER]: { name: 'Lead Sinker' },
  [WEIGHTED_ROD]: { name: 'Weighted Fishing Rod', stack: 1 }, // fish bite twice as often
  [LEAD_BUCKET]: { name: 'Lead Bucket', stack: 16 }, // lined with lead: it can carry lava
  [LAVA_BUCKET]: { name: 'Lava Bucket', stack: 1 },
  [GOLD_CLOCK]: { name: 'Gold Clock', stack: 1 }, // carried anywhere, it shows the time of day
  [COMPASS]: { name: 'Compass', stack: 1 }, // carried anywhere, it shows which way is home
  [SILVER_ARROW]: { name: 'Silver Arrow' }, // twice the damage to night creatures
  [FILAMENT]: { name: 'Tungsten Filament' },
  [DRILL_BIT]: { name: 'Tungsten Drill Bit', stack: 1 },
  [MINECART]: { name: 'Minecart', stack: 1 },
  [MAP]: { name: 'Map', stack: 1 }, // hold it to see the land around you from above
  [PAPER]: { name: 'Paper' },
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
// Swords: the best weapons, and quicker to swing. They don't help with digging.
export const metalSword = (matIndex) => METAL_SWORDS + matIndex;
ITEMS[WOOD_SWORD] = { name: 'Wooden Sword', tool: { type: 'sword', speed: 1, tier: 0, damage: 5 } };
ITEMS[STONE_SWORD] = { name: 'Stone Sword', tool: { type: 'sword', speed: 1, tier: 0, damage: 7 } };
TOOL_MATERIALS.forEach((m, i) => {
  ITEMS[metalSword(i)] = { name: `${m.name} Sword`, mat: m.key, tool: { type: 'sword', speed: 1, tier: 0, damage: 8 + m.dmg } };
});
export const isSword = (id) => ITEMS[id]?.tool?.type === 'sword';

// Armour: four pieces in each material. Each point of armour takes 4% off the damage creatures do
// (up to 80%). Leather comes from buffalo hide cured in the oven; metal armour is plates over wool padding.
export const ARMOUR_PIECES = [
  { key: 'helmet', name: 'Helmet', leather: 5, plates: 3, wool: 1 },
  { key: 'chest', name: 'Chestplate', leather: 8, plates: 5, wool: 2 },
  { key: 'legs', name: 'Leggings', leather: 7, plates: 4, wool: 2 },
  { key: 'boots', name: 'Boots', leather: 4, plates: 2, wool: 1 },
];
// Metals that can be hammered into plates: 2 ingots make a plate at a crafting table, or the trip hammer
// beats 1 ingot into a plate.
export const PLATE_METALS = [
  { key: 'bronze', name: 'Bronze', ingot: BRONZE_INGOT },
  { key: 'iron', name: 'Iron', ingot: IRON_INGOT },
  { key: 'steel', name: 'Steel', ingot: STEEL_INGOT },
  { key: 'stainless', name: 'Stainless Steel', ingot: STAINLESS_INGOT },
  { key: 'copper', name: 'Copper', ingot: COPPER_INGOT },
];
export const plateOf = (ingot) => PLATES + PLATE_METALS.findIndex((m) => m.ingot === ingot);
PLATE_METALS.forEach((m, i) => { ITEMS[PLATES + i] = { name: `${m.name} Plate`, plate: m }; });
export const ARMOUR_MATS = [
  { key: 'leather', name: 'Leather', points: [1, 3, 2, 1] },
  { key: 'bronze', name: 'Bronze', plate: BRONZE_INGOT, points: [2, 4, 3, 1] },
  { key: 'iron', name: 'Iron', plate: IRON_INGOT, points: [2, 6, 5, 2] },
  { key: 'steel', name: 'Steel', plate: STEEL_INGOT, points: [3, 7, 6, 3] },
  { key: 'stainless', name: 'Stainless Steel', plate: STAINLESS_INGOT, points: [3, 8, 6, 3] },
];
export const armourId = (mat, piece) => ARMOUR + mat * 4 + piece;
ARMOUR_MATS.forEach((m, mi) => ARMOUR_PIECES.forEach((p, pi) => {
  ITEMS[armourId(mi, pi)] = { name: `${m.name} ${p.name}`, stack: 1, armour: { piece: pi, points: m.points[pi], mat: m.key } };
}));
ITEMS[HIDE] = { name: 'Buffalo Hide' };
ITEMS[LEATHER] = { name: 'Leather' };

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
export const isRod = (id) => id === FISHING_ROD || id === WEIGHTED_ROD;

// Placeable block that can live in the inventory.
export function isBlock(id) {
  return id > 0 && !!BLOCKS[id] && !BLOCKS[id].liquid && !BLOCKS[id].variantOf;
}

export function itemName(id) {
  return isBlock(id) ? BLOCKS[id].name : ITEMS[id]?.name ?? BLOCKS[id]?.name ?? '?';
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
RECIPES.push(
  // gunpowder and blasting
  { out: [GUNPOWDER, 4], in: [[SALTPETRE, 2], [SULPHUR, 1], [COAL_OR_CHARCOAL, 1]], tools: [MORTAR], metal: SALTPETRE },
  { out: [BLAST_CHARGE, 2], in: [[GUNPOWDER, 4], [CLAY_BALL, 1], [STRING, 1]], table: true, metal: GUNPOWDER },
  // lead, gold, silver and electrum
  { out: [LEAD_SINKER, 4], in: [[LEAD_INGOT, 1]], table: true, metal: LEAD_INGOT },
  { out: [WEIGHTED_ROD, 1], in: [[FISHING_ROD, 1], [LEAD_SINKER, 1]], metal: LEAD_SINKER },
  { out: [LEAD_BUCKET, 1], in: [[LEAD_INGOT, 3]], table: true, metal: LEAD_INGOT },
  { out: [GOLD_CLOCK, 1], in: [[GOLD_INGOT, 4], [GLASS, 1]], table: true, metal: GOLD_INGOT },
  { out: [COMPASS, 1], in: [[IRON_INGOT, 2], [COPPER_INGOT, 2], [GLASS, 1]], table: true, metal: IRON_INGOT },
  { out: [SILVER_ARROW, 4], in: [[ARROW, 4], [SILVER_INGOT, 1]], table: true, metal: SILVER_INGOT },
  { out: [MIRROR_LAMP, 1], in: [[LAMP, 1], [ELECTRUM_INGOT, 2]], table: true, metal: ELECTRUM_INGOT },
  // machines
  { out: [MILLSTONE, 1], in: [[STONE, 4], [kineticId('gear', 1), 1]], table: true },
  { out: [SAW, 1], in: [[plateOf(IRON_INGOT), 1], [PLANKS, 3], [kineticId('gear', 0), 1]], table: true, metal: IRON_INGOT },
  { out: [BELLOWS, 1], in: [[PLANKS, 4], [LEATHER, 2], [kineticId('shaft', 0), 1]], table: true, metal: LEATHER },
  { out: [TRIP_HAMMER, 1], in: [[IRON_INGOT, 3], [LOG, 3], [kineticId('large', 0), 1]], table: true, metal: IRON_INGOT },
  { out: [PIPE, 4], in: [[LEAD_INGOT, 1]], table: true, metal: LEAD_INGOT },
  { out: [SPOUT, 1], in: [[PIPE, 2]], table: true, metal: LEAD_INGOT },
  { out: [PUMP, 1], in: [[LEAD_INGOT, 4], [kineticId('gear', 1), 1], [PIPE, 1]], table: true, metal: LEAD_INGOT },
  { out: [WINDMILL, 1], in: [[WOOL, 4], [PLANKS, 6], [STICK, 4]], table: true },
  { out: [BELT, 6], in: [[LEATHER, 3], [kineticId('shaft', 0), 2]], table: true, metal: LEATHER },
  { out: [HOPPER, 1], in: [[plateOf(IRON_INGOT), 3], [CHEST, 1]], table: true, metal: IRON_INGOT },
  { out: [DRILL_BIT, 1], in: [[TUNGSTEN_INGOT, 2], [STEEL_INGOT, 1]], table: true, metal: TUNGSTEN_INGOT },
  { out: [DRILL, 1], in: [[DRILL_BIT, 1], [STEEL_INGOT, 3], [kineticId('gear', 1), 1]], table: true, metal: DRILL_BIT },
  { out: [FILAMENT_LAMP, 1], in: [[GLASS, 1], [FILAMENT, 1], [COPPER_INGOT, 2]], table: true, metal: FILAMENT },
  // rails, maps and the desert
  { out: [RAIL, 16], in: [[IRON_INGOT, 6], [STICK, 1]], table: true, metal: IRON_INGOT },
  { out: [POWERED_RAIL, 6], in: [[GOLD_INGOT, 4], [IRON_INGOT, 2], [STICK, 1]], table: true, metal: GOLD_INGOT },
  { out: [MINECART, 1], in: [[IRON_INGOT, 5]], table: true, metal: IRON_INGOT },
  { out: [PAPER, 3], in: [[SUGAR_CANE, 3]], table: true },
  { out: [MAP, 1], in: [[PAPER, 4], [COMPASS, 1]], table: true, metal: COMPASS },
  { out: [SANDSTONE, 1], in: [[SAND, 4]], table: true },
  // storage and getting about
  { out: [CHEST, 1], in: [[PLANKS, 8]], table: true },
  { out: [IRON_CHEST, 1], in: [[CHEST, 2], [plateOf(IRON_INGOT), 2]], table: true, metal: IRON_INGOT },
  { out: [LADDER, 3], in: [[STICK, 7]], table: true },
  { out: [SCAFFOLD, 4], in: [[STICK, 6], [STRING, 1]], table: true },
  { out: [SIGN, 3], in: [[PLANKS, 6], [STICK, 1]], table: true },
  // weapons and armour
  { out: [WOOD_SWORD, 1], in: [[PLANKS, 2], [STICK, 1]], table: true },
  { out: [STONE_SWORD, 1], in: [[COBBLE, 2], [STICK, 1]], table: true },
);
PLATE_METALS.forEach((m, i) => RECIPES.push({ out: [PLATES + i, 1], in: [[m.ingot, 2]], table: true, metal: m.ingot }));
ARMOUR_MATS.forEach((m, mi) => ARMOUR_PIECES.forEach((p, pi) => {
  RECIPES.push(m.plate
    ? { out: [armourId(mi, pi), 1], in: [[plateOf(m.plate), p.plates], [WOOL, p.wool]], table: true, metal: plateOf(m.plate) }
    : { out: [armourId(mi, pi), 1], in: [[LEATHER, p.leather]], table: true, metal: LEATHER });
}));
// Metal tools. `metal` hides the recipe from the list until you're carrying that ingot.
TOOL_MATERIALS.forEach((m, i) => {
  RECIPES.push(
    { out: [metalSword(i), 1], in: [[m.ingot, 2], [STICK, 1]], table: true, metal: m.ingot },
    { out: [metalTool(i, 'pick'), 1], in: [[m.ingot, 3], [STICK, 2]], table: true, metal: m.ingot },
    { out: [metalTool(i, 'axe'), 1], in: [[m.ingot, 3], [STICK, 2]], table: true, metal: m.ingot },
    { out: [metalTool(i, 'shovel'), 1], in: [[m.ingot, 1], [STICK, 2]], table: true, metal: m.ingot },
  );
});
// (Bread, cookies, cake and baked fish are baked in the oven, and glass, stone and charcoal come from the smelter:
// see stations.js.)

// ---------- building: colour, flowers, stairs, slabs, fences, panes and trapdoors ----------

// Dye colours. Index 0 is white (plain wool and carpet are white already).
export const COLORS = [
  { key: 'white', name: 'White', rgb: [236, 236, 232] },
  { key: 'black', name: 'Black', rgb: [44, 44, 50] },
  { key: 'red', name: 'Red', rgb: [178, 48, 40] },
  { key: 'orange', name: 'Orange', rgb: [228, 126, 40] },
  { key: 'yellow', name: 'Yellow', rgb: [236, 204, 56] },
  { key: 'green', name: 'Green', rgb: [86, 142, 52] },
  { key: 'cyan', name: 'Cyan', rgb: [42, 150, 160] },
  { key: 'blue', name: 'Blue', rgb: [54, 82, 180] },
  { key: 'purple', name: 'Purple', rgb: [128, 62, 172] },
  { key: 'pink', name: 'Pink', rgb: [234, 142, 172] },
];
export const DYED_WOOL = 479, // 480..488: + colour 1..9
  DYED_CARPET = 488, // 489..497: + colour 1..9
  STAINED_GLASS = 498, // 498..507: + colour 0..9
  PAINTED_PLANKS = 508, // 508..517: + colour 0..9
  POPPY = 520, DANDELION = 521, CORNFLOWER = 522, LAVENDER = 523, DAISY = 524,
  SHAPED = 530, // 530..565: + material * 6 + (0 slab, 1 top slab, 2..5 stairs facing 0..3)
  FENCE = 566, FENCE_GATE = 567, // gate: 567..570, + axis (0: across x, 1: across z) + 2 if open
  GLASS_PANE = 571,
  TRAPDOOR = 572; // 572..579: + facing (the side its hinge is on) + 4 if open
export const DYE = 381; // 381..390: + colour
export const dyedWool = (c) => (c ? DYED_WOOL + c : WOOL);
export const dyedCarpet = (c) => (c ? DYED_CARPET + c : CARPET);
export const FLOWERS = [
  { id: POPPY, name: 'Poppy', color: 2 }, { id: DANDELION, name: 'Dandelion', color: 4 },
  { id: CORNFLOWER, name: 'Cornflower', color: 7 }, { id: LAVENDER, name: 'Lavender', color: 8 }, { id: DAISY, name: 'Daisy', color: 0 },
];
export const isFlower = (id) => id >= POPPY && id <= DAISY;

COLORS.forEach((c, i) => {
  if (i) {
    block(DYED_WOOL + i, { name: `${c.name} Wool`, sound: 'wool', tex: T.DYED_WOOL + i, hardness: 0.8, color: i });
    block(DYED_CARPET + i, { name: `${c.name} Carpet`, sound: 'wool', transparent: true, solid: false, hardness: 0.2, model: [[0, 0, 0, 16, 1, 16, T.DYED_WOOL + i]], color: i });
  }
  block(STAINED_GLASS + i, { name: `${c.name} Stained Glass`, sound: 'glass', tex: T.STAINED + i, transparent: true, hardness: 0.4, color: i });
  block(PAINTED_PLANKS + i, { name: `${c.name} Painted Planks`, sound: 'wood', tex: T.PAINTED + i, hardness: 2, tool: 'axe', color: i });
  ITEMS[DYE + i] = { name: `${c.name} Dye`, dye: i };
});
FLOWERS.forEach((f, i) => block(f.id, { ...plant, name: f.name, tex: T.FLOWER0 + i }));

// Stairs and slabs in several materials. A slab fills the bottom (or top) half of its cell; two slabs
// together make the full block. Stairs (facing 0: the low step toward +z) climb away from where you stand.
export const SHAPE_MATS = [
  { key: 'planks', name: 'Wooden', full: PLANKS, tex: T.PLANKS, sound: 'wood', tool: 'axe', hardness: 2 },
  { key: 'cobble', name: 'Cobblestone', full: COBBLE, tex: T.COBBLE, tool: 'pick', hardness: 2.5, needsTool: true },
  { key: 'stone', name: 'Stone', full: STONE, tex: T.STONE, tool: 'pick', hardness: 2.25, needsTool: true },
  { key: 'bricks', name: 'Stone Brick', full: BRICKS, tex: T.BRICKS, tool: 'pick', hardness: 2.5, needsTool: true },
  { key: 'clay', name: 'Brick', full: CLAY_BRICKS, tex: T.CLAY_BRICKS, tool: 'pick', hardness: 2.5, needsTool: true },
  { key: 'sandstone', name: 'Sandstone', full: SANDSTONE, tex: { top: T.SANDSTONE_TOP, side: T.SANDSTONE_SIDE, bottom: T.SANDSTONE_TOP }, tool: 'pick', hardness: 2, needsTool: true },
];
export const slabId = (mat, top = false) => SHAPED + mat * 6 + (top ? 1 : 0);
export const stairId = (mat, facing = 0) => SHAPED + mat * 6 + 2 + facing;
const STAIR_BOXES = [[0, 0, 0, 16, 8, 16], [0, 8, 0, 16, 16, 8]];
SHAPE_MATS.forEach((m, mi) => {
  const base = { sound: m.sound ?? 'stone', tool: m.tool, hardness: m.hardness, needsTool: !!m.needsTool, transparent: true };
  const slab = slabId(mi);
  for (const top of [false, true]) {
    const box = top ? [0, 8, 0, 16, 16, 16] : [0, 0, 0, 16, 8, 16];
    block(slabId(mi, top), {
      ...base, name: `${m.name} Slab`, model: [[...box, m.tex]], boxes: [box], slab: { mat: mi, top },
      variantOf: top ? slab : 0, drop: slab,
    });
  }
  for (let f = 0; f < 4; f++) {
    const boxes = rotateModel(STAIR_BOXES.map((b) => [...b, m.tex]), f);
    block(stairId(mi, f), {
      ...base, name: `${m.name} Stairs`, model: boxes, boxes: boxes.map((b) => b.slice(0, 6)), stair: { mat: mi }, facing: f,
      variantOf: f ? stairId(mi) : 0, drop: stairId(mi),
    });
  }
});
export const isSlab = (id) => !!BLOCKS[id]?.slab;

// Fences and glass panes join up to their own kind and to solid blocks beside them (see world.js).
// A fence stands a block and a half tall for anything trying to get over it.
block(FENCE, {
  name: 'Fence', shape: 'fence', sound: 'wood', tool: 'axe', hardness: 2, transparent: true,
  model: [[6, 0, 6, 10, 16, 10, wood], [0, 6, 7, 6, 8, 9, wood], [0, 12, 7, 6, 14, 9, wood], [10, 6, 7, 16, 8, 9, wood], [10, 12, 7, 16, 14, 9, wood]],
});
block(GLASS_PANE, {
  name: 'Glass Pane', shape: 'pane', sound: 'glass', hardness: 0.4, transparent: true,
  model: [[0, 0, 7, 16, 16, 9, T.GLASS]],
});
// fence gates: closed they're a fence between their posts; open, the gate swings back out of the way
const GATE_CLOSED = [[0, 5, 7, 2, 16, 9, wood], [14, 5, 7, 16, 16, 9, wood], [2, 6, 7.5, 14, 8, 8.5, wood], [2, 12, 7.5, 14, 14, 8.5, wood], [7, 8, 7.5, 9, 12, 8.5, wood]];
const GATE_OPEN = [[0, 5, 7, 2, 16, 9, wood], [14, 5, 7, 16, 16, 9, wood], [0, 6, 9, 1, 8, 15, wood], [0, 12, 9, 1, 14, 15, wood], [15, 6, 9, 16, 8, 15, wood], [15, 12, 9, 16, 14, 15, wood]];
for (let k = 0; k < 4; k++) {
  const axis = k & 1, open = k >= 2;
  block(FENCE_GATE + k, {
    name: 'Fence Gate', sound: 'wood', tool: 'axe', hardness: 2, transparent: true, gate: true, axis, open,
    model: rotateModel(open ? GATE_OPEN : GATE_CLOSED, axis), solid: !open,
    boxes: open ? null : [axis ? [7, 0, 0, 9, 24, 16] : [0, 0, 7, 16, 24, 9]],
    variantOf: k ? FENCE_GATE : 0, drop: FENCE_GATE,
  });
}
// trapdoors: shut, a hatch lying across the top of their cell (a floor you can walk on); open, it stands
// up against the side it's hinged on. Model for facing 0: hinged on the +z side.
for (let k = 0; k < 8; k++) {
  const f = k & 3, open = k >= 4;
  const box = open ? [0, 0, 13, 16, 16, 16] : [0, 13, 0, 16, 16, 16];
  const [m] = rotateModel([[...box, { top: T.TRAPDOOR, side: T.PLANKS, bottom: T.TRAPDOOR }]], f);
  block(TRAPDOOR + k, {
    name: 'Trapdoor', sound: 'wood', tool: 'axe', hardness: 1.5, transparent: true, trapdoor: true, facing: f, open,
    model: [open ? [m[0], m[1], m[2], m[3], m[4], m[5], T.TRAPDOOR] : m], boxes: [m.slice(0, 6)],
    variantOf: k ? TRAPDOOR : 0, drop: TRAPDOOR,
  });
}
export const isGate = (id) => !!BLOCKS[id]?.gate;
export const isTrapdoor = (id) => !!BLOCKS[id]?.trapdoor;

RECIPES.push(
  // flowers into dyes, and mixing them
  ...FLOWERS.map((f) => ({ out: [DYE + f.color, 2], in: [[f.id, 1]], tools: [MORTAR], metal: f.id })),
  { out: [DYE + 1, 2], in: [[COAL_OR_CHARCOAL, 1]], tools: [MORTAR], metal: DYE },
  { out: [DYE + 5, 2], in: [[CACTUS, 1]], tools: [MORTAR], metal: CACTUS },
  { out: [DYE + 5, 1], in: [[LEAVES, 4]], tools: [MORTAR], metal: DYE },
  { out: [DYE + 3, 2], in: [[DYE + 2, 1], [DYE + 4, 1]], metal: DYE + 2 },
  { out: [DYE + 9, 2], in: [[DYE + 2, 1], [DYE + 0, 1]], metal: DYE + 2 },
  { out: [DYE + 6, 2], in: [[DYE + 7, 1], [DYE + 5, 1]], metal: DYE + 7 },
  // building shapes
  ...SHAPE_MATS.flatMap((m, i) => [
    { out: [slabId(i), 6], in: [[m.full, 3]], table: true },
    { out: [stairId(i), 4], in: [[m.full, 6]], table: true },
  ]),
  { out: [FENCE, 3], in: [[PLANKS, 4], [STICK, 2]], table: true },
  { out: [FENCE_GATE, 1], in: [[PLANKS, 2], [STICK, 4]], table: true },
  { out: [GLASS_PANE, 16], in: [[GLASS, 6]], table: true },
  { out: [TRAPDOOR, 2], in: [[PLANKS, 6]], table: true },
);
// colour: 4 of a block and a dye make 4 of the coloured block (only listed once you have that dye)
COLORS.forEach((c, i) => {
  if (i) RECIPES.push(
    { out: [dyedWool(i), 4], in: [[WOOL, 4], [DYE + i, 1]], metal: DYE + i },
    { out: [dyedCarpet(i), 3], in: [[dyedWool(i), 2]], table: true, metal: DYE + i },
  );
  RECIPES.push(
    { out: [STAINED_GLASS + i, 4], in: [[GLASS, 4], [DYE + i, 1]], metal: DYE + i },
    { out: [PAINTED_PLANKS + i, 4], in: [[PLANKS, 4], [DYE + i, 1]], metal: DYE + i },
  );
});

// ---------- automation: gearboxes, clutches, switches, item frames and loader rails ----------
export const GEARBOX = 580, // passes a turning shaft round a corner: every face is an axle end
  CLUTCH = 581, // 581..583: + axis; a shaft that only joins its two ends while it's switched on
  LEVER = 584, // 584..593: + mount (0..3 on a wall, facing out of it; 4 on the floor) + 5 if on
  BUTTON = 594, // 594..601: + facing + 4 while pressed
  PRESSURE_PLATE = 602, // 603 = pressed
  ITEM_FRAME = 604, // 604..607: + facing (out of the wall it hangs on)
  LOADER_RAIL = 608; // 608 = along z, 609 = along x
export const STORAGE_CART = 391;

block(GEARBOX, {
  name: 'Gearbox', tex: T.GEARBOX, hardness: 2, tool: 'pick', sound: 'stone', kinetic: { part: 'gearbox', mat: 1, axis: -1 },
});
for (let a = 0; a < 3; a++) {
  block(CLUTCH + a, {
    ...kineticShape, name: 'Clutch', sound: 'stone', tool: 'pick', hardness: 1.5, variantOf: a ? CLUTCH : 0, drop: CLUTCH,
    kinetic: { part: 'clutch', mat: 1, axis: a },
  });
}
// switches: models drawn for a wall toward -z (facing 0)
const leverModel = (floor, on) => (floor
  ? [[5, 0, 4, 11, 2, 12, T.COBBLE], on ? [7, 2, 8.5, 9, 10, 10.5, T.LOG_SIDE] : [7, 2, 5.5, 9, 10, 7.5, T.LOG_SIDE]]
  : [[5, 4, 0, 11, 12, 2, T.COBBLE], on ? [7, 8.5, 2, 9, 14, 4, T.LOG_SIDE] : [7, 2, 2, 9, 7.5, 4, T.LOG_SIDE]]);
for (let k = 0; k < 10; k++) {
  const mount = k % 5, on = k >= 5, floor = mount === 4;
  block(LEVER + k, {
    name: 'Lever', sound: 'wood', hardness: 0.5, transparent: true, solid: false, switch: 'lever', on, floor,
    model: floor ? leverModel(true, on) : rotateModel(leverModel(false, on), mount), facing: floor ? 0 : mount,
    variantOf: k ? LEVER : 0, drop: LEVER,
  });
}
for (let k = 0; k < 8; k++) {
  const f = k & 3, on = k >= 4;
  block(BUTTON + k, {
    name: 'Button', sound: 'stone', hardness: 0.5, transparent: true, solid: false, switch: 'button', on, facing: f,
    model: rotateModel([[5, 6, 0, 11, 10, on ? 1 : 2, T.STONE]], f), variantOf: k ? BUTTON : 0, drop: BUTTON,
  });
}
for (let k = 0; k < 2; k++) {
  block(PRESSURE_PLATE + k, {
    name: 'Pressure Plate', sound: 'stone', hardness: 0.5, transparent: true, solid: false, switch: 'plate', on: !!k, floor: true,
    model: [[1, 0, 1, 15, k ? 0.5 : 1, 15, T.STONE]], variantOf: k ? PRESSURE_PLATE : 0, drop: PRESSURE_PLATE,
  });
}
export const isSwitch = (id) => !!BLOCKS[id]?.switch;
const FRAME_MODEL = [[2, 2, 0, 14, 14, 0.6, T.FRAME_BACK], [1, 1, 0, 15, 2, 1.2, wood], [1, 14, 0, 15, 15, 1.2, wood], [1, 2, 0, 2, 14, 1.2, wood], [14, 2, 0, 15, 14, 1.2, wood]];
for (let f = 0; f < 4; f++) {
  block(ITEM_FRAME + f, {
    name: 'Item Frame', sound: 'wood', hardness: 0.5, tool: 'axe', transparent: true, solid: false, frame: true,
    model: rotateModel(FRAME_MODEL, f), facing: f, variantOf: f ? ITEM_FRAME : 0, drop: ITEM_FRAME,
  });
}
export const isFrame = (id) => !!BLOCKS[id]?.frame;
// a loader rail: a straight rail with an iron hopper plate between the rails. A storage cart stops on it
// while hoppers fill or empty it, then rolls on.
for (let a = 0; a < 2; a++) {
  const ends = a ? [1, 3] : [0, 2];
  block(LOADER_RAIL + a, {
    name: 'Loader Rail', sound: 'stone', transparent: true, solid: false, hardness: 0.7, tool: 'pick',
    model: [...railModel({ ends }), ...rotateModel([[5, 0, 4, 11, 1.6, 12, T.IRON]], a)], rail: { ends, slope: -1, powered: false, loader: true },
    variantOf: a ? LOADER_RAIL : 0, drop: LOADER_RAIL,
  });
}
ITEMS[STORAGE_CART] = { name: 'Storage Cart', stack: 1 };

RECIPES.push(
  { out: [GEARBOX, 1], in: [[kineticId('gear', 1), 2], [COBBLE, 4]], table: true },
  { out: [CLUTCH, 1], in: [[kineticId('shaft', 1), 2], [IRON_INGOT, 1]], table: true, metal: IRON_INGOT },
  { out: [LEVER, 1], in: [[STICK, 1], [COBBLE, 1]], table: true },
  { out: [BUTTON, 2], in: [[STONE, 1]], table: true },
  { out: [PRESSURE_PLATE, 1], in: [[STONE, 2]], table: true },
  { out: [ITEM_FRAME, 2], in: [[STICK, 6], [LEATHER, 1]], table: true, metal: LEATHER },
  { out: [LOADER_RAIL, 2], in: [[RAIL, 2], [HOPPER, 1]], table: true, metal: IRON_INGOT },
  { out: [STORAGE_CART, 1], in: [[MINECART, 1], [CHEST, 1]], table: true, metal: IRON_INGOT },
);

// ---------- survival: wear and repair, dungeons, cauldrons and teas, shields ----------
export const ANVIL = 610, MOSSY_BRICKS = 611, BOSS_SHRINE = 612, SPENT_SHRINE = 613, LOOT_CHEST = 614,
  CAULDRON = 615; // 615..618: + water level
export const GLASS_BOTTLE = 1000, NIGHT_TEA = 1001, HASTE_TEA = 1002, FIRE_TEA = 1003, HEAL_TEA = 1004,
  WOOD_SHIELD = 1006, IRON_SHIELD = 1007, KING_CROWN = 1008;

block(ANVIL, {
  name: 'Anvil', sound: 'stone', hardness: 4, tool: 'pick', needsTool: true, transparent: true,
  model: [[2, 0, 2, 14, 3, 14, T.IRON], [5, 3, 4, 11, 9, 12, T.IRON], [1, 9, 3, 15, 15, 13, T.IRON]],
  boxes: [[1, 0, 2, 15, 15, 14]],
});
block(MOSSY_BRICKS, { name: 'Mossy Stone Bricks', tex: T.MOSSY_BRICKS, hardness: 2.5, tool: 'pick', needsTool: true });
// the shrine in the middle of a dungeon calls up its guardian, the Mossback King, when you come near
block(BOSS_SHRINE, { name: 'Mossy Shrine', top: T.SHRINE_TOP, bottom: T.MOSSY_BRICKS, side: T.SHRINE_SIDE, hardness: Infinity, light: 7, blastproof: true, drop: 0 });
block(SPENT_SHRINE, { name: 'Quiet Shrine', top: T.SHRINE_SPENT, bottom: T.MOSSY_BRICKS, side: T.SHRINE_SIDE, hardness: 6, tool: 'pick', needsTool: true, tier: 3, drop: MOSSY_BRICKS });
// a dungeon chest: an ordinary chest, filled with loot the first time it's opened
block(LOOT_CHEST, {
  name: 'Chest', station: 'chest', side: T.CHEST_SIDE, top: T.CHEST_TOP, bottom: T.CHEST_TOP, front: T.CHEST_FRONT, facing: 0,
  sound: 'wood', hardness: 2, tool: 'axe', variantOf: CHEST, drop: CHEST, stationBase: CHEST,
});
const cauldronModel = (level) => [
  [1, 0, 1, 15, 2, 15, T.CAULDRON], [1, 2, 1, 15, 14, 3, T.CAULDRON], [1, 2, 13, 15, 14, 15, T.CAULDRON],
  [1, 2, 3, 3, 14, 13, T.CAULDRON], [13, 2, 3, 15, 14, 13, T.CAULDRON],
  ...[[0, 0], [14, 0], [0, 14], [14, 14]].map(([x, z]) => [x, 0, z, x + 2, 3, z + 2, T.CAULDRON]),
  ...(level ? [[3, 2, 3, 13, 2 + level * 3.6, 13, T.CAULDRON_WATER]] : []),
];
for (let k = 0; k < 4; k++) {
  block(CAULDRON + k, {
    name: 'Cauldron', sound: 'stone', hardness: 2.5, tool: 'pick', transparent: true, model: cauldronModel(k), water: k,
    station: 'cauldron', stationBase: CAULDRON, variantOf: k ? CAULDRON : 0, drop: CAULDRON, grows: k < 3 ? 'fill' : null,
  });
}

// Teas: brewed in a cauldron from a herb in a glass bottle of its water. effect: [kind, seconds]
ITEMS[GLASS_BOTTLE] = { name: 'Glass Bottle' };
ITEMS[NIGHT_TEA] = { name: 'Night-Eye Tea', stack: 8, tea: ['night', 240], about: 'see in the dark' };
ITEMS[HASTE_TEA] = { name: 'Miner\'s Tea', stack: 8, tea: ['haste', 180], about: 'dig half as fast again' };
ITEMS[FIRE_TEA] = { name: 'Fireproof Tea', stack: 8, tea: ['fire', 120], about: 'lava doesn\'t burn you' };
ITEMS[HEAL_TEA] = { name: 'Healing Tea', stack: 8, tea: ['heal', 10], about: 'heals you quickly' };
// Shields: worn in their own slot; they stop hits and thorns from in front of you, and wear as they do.
ITEMS[WOOD_SHIELD] = { name: 'Wooden Shield', stack: 1, armour: { piece: 4, points: 0 }, wearMax: 60, repair: PLANKS };
ITEMS[IRON_SHIELD] = { name: 'Iron Shield', stack: 1, armour: { piece: 4, points: 0 }, wearMax: 240, repair: IRON_INGOT };
ITEMS[KING_CROWN] = { name: 'Crown of the Mossback King', stack: 1, armour: { piece: 0, points: 5 }, wearMax: 600, repair: GOLD_INGOT };

// How many uses tools, weapons and armour take before they break (see main.js), and what repairs them at an anvil.
const WEAR_BY_MAT = { copper: 200, tin: 200, zinc: 200, aluminium: 220, bronze: 300, albronze: 340, iron: 400, steel: 600, stainless: 900, tungsten: 1500 };
for (const id of [WOOD_PICK, WOOD_AXE, WOOD_SHOVEL, WOOD_SWORD]) Object.assign(ITEMS[id], { wearMax: 60, repair: PLANKS });
for (const id of [STONE_PICK, STONE_AXE, STONE_SHOVEL, STONE_SWORD]) Object.assign(ITEMS[id], { wearMax: 130, repair: COBBLE });
TOOL_MATERIALS.forEach((m, i) => {
  for (const id of [metalSword(i), ...TOOL_KINDS.map((k) => metalTool(i, k))]) Object.assign(ITEMS[id], { wearMax: WEAR_BY_MAT[m.key], repair: m.ingot });
});
const ARMOUR_WEAR = [80, 160, 220, 320, 450];
ARMOUR_MATS.forEach((m, mi) => ARMOUR_PIECES.forEach((p, pi) => Object.assign(ITEMS[armourId(mi, pi)], { wearMax: ARMOUR_WEAR[mi], repair: m.plate ?? LEATHER })));
export const maxWear = (id) => ITEMS[id]?.wearMax ?? 0;

RECIPES.push(
  { out: [ANVIL, 1], in: [[IRON_INGOT, 5], [plateOf(IRON_INGOT), 2]], table: true, metal: IRON_INGOT },
  { out: [CAULDRON, 1], in: [[[IRON_INGOT, COPPER_INGOT], 5]], table: true, metal: [IRON_INGOT, COPPER_INGOT] },
  { out: [GLASS_BOTTLE, 3], in: [[GLASS, 3]], table: true },
  { out: [WOOD_SHIELD, 1], in: [[PLANKS, 6], [IRON_INGOT, 1]], table: true, metal: IRON_INGOT },
  { out: [WOOD_SHIELD, 1], in: [[PLANKS, 6], [LEATHER, 2]], table: true, metal: LEATHER },
  { out: [IRON_SHIELD, 1], in: [[plateOf(IRON_INGOT), 4], [LEATHER, 1]], table: true, metal: IRON_INGOT },
  { out: [MOSSY_BRICKS, 4], in: [[BRICKS, 4], [LEAVES, 2]], table: true },
);

// ---------- berry bushes ----------
// A low leafy bush that grows berries; tap a ripe one to pick them (and it grows more).
export const BERRY_BUSH = 619, // 620 = with ripe berries
  BERRIES = 1005;
for (let k = 0; k < 2; k++) {
  const tile = k ? T.BUSH_RIPE : T.BUSH;
  block(BERRY_BUSH + k, {
    name: 'Berry Bush', sound: 'leaves', hardness: 0.3, transparent: true, solid: false,
    model: [[2, 0, 2, 14, 11, 14, tile], [4, 11, 4, 12, 13, 12, tile]],
    grows: k ? null : BERRY_BUSH + 1, variantOf: k ? BERRY_BUSH : 0, drop: BERRY_BUSH,
  });
}
ITEMS[BERRIES] = { name: 'Berries', food: 2 };

// ---------- caves, bees and villages ----------
export const GLOW_MUSHROOM = 621, CRYSTAL_BLOCK = 622, CRYSTAL_CLUSTER = 623, GEODE_SHELL = 624,
  BEE_HIVE = 625, // 625..628: + honey level 0..3 (3 is full)
  VILLAGE_BELL = 629;
export const CRYSTAL_SHARD = 1009, HONEY_BOTTLE = 1010, HONEYCOMB = 1011,
  SALMON = 1012, BAKED_SALMON = 1013, ICEFISH = 1014, BAKED_ICEFISH = 1015, PUFFERFISH = 1016, OLD_BOOT = 1017;
export const MAX_HONEY = 3;

// glowing mushrooms carpet the floors of some caverns; they light the dark and can be picked and replanted
block(GLOW_MUSHROOM, { name: 'Glowcap Mushroom', sound: 'leaves', tex: T.GLOW_MUSHROOM, transparent: true, solid: false, shape: 'cross', hardness: 0, light: 10 });
// crystal geodes: a pale shell around a lining of glowing crystal
block(GEODE_SHELL, { name: 'Calcite', tex: T.GEODE_SHELL, hardness: 2, tool: 'pick', needsTool: true });
block(CRYSTAL_BLOCK, {
  name: 'Crystal', sound: 'glass', tex: T.CRYSTAL, hardness: 1.5, tool: 'pick', needsTool: true, light: 9,
  drop: () => [[CRYSTAL_SHARD, 3 + (Math.random() < 0.5 ? 1 : 0)]],
});
block(CRYSTAL_CLUSTER, {
  name: 'Crystal Cluster', sound: 'glass', tex: T.CRYSTAL_CLUSTER, transparent: true, solid: false, shape: 'cross', hardness: 0.5, light: 11,
  drop: () => [[CRYSTAL_SHARD, 2]],
});
// a bee hive, hung under the leaves of a tree: it slowly fills with honey (faster with flowers nearby)
for (let k = 0; k <= MAX_HONEY; k++) {
  block(BEE_HIVE + k, {
    name: 'Bee Hive', sound: 'wood', top: T.HIVE_TOP, bottom: T.HIVE_TOP, side: T.HIVE_SIDE, front: k === MAX_HONEY ? T.HIVE_FULL : T.HIVE_FRONT,
    hardness: 1, tool: 'axe', variantOf: k ? BEE_HIVE : 0, grows: k < MAX_HONEY ? 'honey' : null, hive: k,
    drop: () => [[BEE_HIVE, 1], [HONEYCOMB, k]],
  });
}
block(VILLAGE_BELL, {
  name: 'Village Bell', sound: 'stone', transparent: true, hardness: 3, tool: 'pick', bell: true,
  model: [[7, 13, 7, 9, 16, 9, T.LOG_SIDE], [4, 3, 4, 12, 13, 12, T.BELL], [3, 2, 3, 13, 4, 13, T.BELL], [7, 0, 7, 9, 2, 9, T.BELL]],
  boxes: [[3, 0, 3, 13, 16, 13]],
});

ITEMS[CRYSTAL_SHARD] = { name: 'Crystal Shard' };
ITEMS[HONEYCOMB] = { name: 'Honeycomb' };
ITEMS[HONEY_BOTTLE] = { name: 'Honey Bottle', stack: 8, food: 6, about: 'you keep the bottle' };
ITEMS[SALMON] = { name: 'Raw Salmon', food: 2, fish: true };
ITEMS[BAKED_SALMON] = { name: 'Baked Salmon', food: 7, fish: true };
ITEMS[ICEFISH] = { name: 'Raw Icefish', food: 2, fish: true };
ITEMS[BAKED_ICEFISH] = { name: 'Baked Icefish', food: 6, fish: true };
ITEMS[PUFFERFISH] = { name: 'Pufferfish', food: 1, about: 'poisonous to eat' };
ITEMS[OLD_BOOT] = { name: 'Old Boot' };
ITEMS[RAW_FISH].fish = true; ITEMS[BAKED_FISH].fish = true;
export const isFish = (id) => !!ITEMS[id]?.fish;

RECIPES.push(
  { out: [BEE_HIVE, 1], in: [[PLANKS, 6], [HONEYCOMB, 2]], table: true },
  { out: [LEATHER, 1], in: [[OLD_BOOT, 1]] },
  { out: [GLASS, 1], in: [[CRYSTAL_SHARD, 2], [SAND, 1]] },
);

// ---------- survival: enchanting, meals, more dungeons ----------
export const ENCHANT_ALTAR = 630,
  TOMB_SHRINE = 631, CRYPT_SHRINE = 632, FORT_SHRINE = 633, // a lair's shrine; + 3 once its guardian is beaten
  DART_TRAP = 637, // 637..640: + facing (the way it shoots)
  TRAP_PLATE = 641, FROST_BRICKS = 642, FORT_BRICKS = 643, CUT_SANDSTONE = 644;
export const SUN_SCARAB = 1018, FROST_HEART = 1019, EMBER_CORE = 1020, SUN_MASK = 1021, FROST_CIRCLET = 1022, EMBER_CROWN = 1023,
  HONEY_TEA = 1024, MUSHROOM_STEW = 1025, FISH_PIE = 1026;

block(ENCHANT_ALTAR, {
  name: 'Enchanting Altar', top: T.ALTAR_TOP, bottom: T.OBSIDIAN, side: T.ALTAR_SIDE, hardness: 6, tool: 'pick', needsTool: true, tier: 3,
  light: 6, blastproof: true, transparent: true,
  model: [[0, 0, 0, 16, 10, 16, { top: T.ALTAR_TOP, side: T.ALTAR_SIDE, bottom: T.OBSIDIAN }], [6, 10, 6, 10, 13, 10, T.CRYSTAL, true]],
  boxes: [[0, 0, 0, 16, 10, 16]],
});
// The guardians of the three new kinds of lair, and what each one leaves behind.
export const LAIRS = {
  tomb: { shrine: TOMB_SHRINE, boss: 'dunewarden', name: 'The Dune Warden', tile: T.TOMB_SHRINE, brick: T.CUT_SANDSTONE },
  crypt: { shrine: CRYPT_SHRINE, boss: 'frostwraith', name: 'The Frost Wraith', tile: T.CRYPT_SHRINE, brick: T.FROST_BRICKS },
  fortress: { shrine: FORT_SHRINE, boss: 'emberlord', name: 'The Ember Lord', tile: T.FORT_SHRINE, brick: T.FORT_BRICKS },
};
for (const l of Object.values(LAIRS)) {
  block(l.shrine, { name: 'Shrine', top: T.SHRINE_GLYPH, bottom: l.brick, side: l.tile, hardness: Infinity, light: 8, blastproof: true, drop: 0, lair: true });
  block(l.shrine + 3, { name: 'Quiet Shrine', top: T.SHRINE_SPENT, bottom: l.brick, side: l.tile, hardness: 6, tool: 'pick', needsTool: true, tier: 3 });
}
block(CUT_SANDSTONE, { name: 'Cut Sandstone', tex: T.CUT_SANDSTONE, hardness: 2, tool: 'pick', needsTool: true });
block(FROST_BRICKS, { name: 'Frost Bricks', tex: T.FROST_BRICKS, hardness: 2.5, tool: 'pick', needsTool: true, sound: 'glass' });
block(FORT_BRICKS, { name: 'Fortress Bricks', tex: T.FORT_BRICKS, hardness: 3, tool: 'pick', needsTool: true, blastproof: true });
// a tomb's traps: stepping on a loose floor tile makes the dart traps in the walls nearby shoot at you
block(TRAP_PLATE, { name: 'Cut Sandstone', tex: T.TRAP_PLATE, hardness: 2, tool: 'pick', needsTool: true, drop: CUT_SANDSTONE, trap: true });
for (let f = 0; f < 4; f++) {
  block(DART_TRAP + f, {
    name: 'Dart Trap', side: T.CUT_SANDSTONE, top: T.CUT_SANDSTONE, bottom: T.CUT_SANDSTONE, front: T.DART_FRONT, facing: f,
    hardness: 2.5, tool: 'pick', needsTool: true, variantOf: f ? DART_TRAP : 0, drop: DART_TRAP, dart: true,
  });
}

// Boss trophies: crowns (helmets with a gift) and the hearts of the guardians, used for enchanting.
ITEMS[SUN_SCARAB] = { name: 'Sun Scarab', about: 'from the Dune Warden' };
ITEMS[FROST_HEART] = { name: 'Frost Heart', about: 'from the Frost Wraith' };
ITEMS[EMBER_CORE] = { name: 'Ember Core', about: 'from the Ember Lord' };
ITEMS[SUN_MASK] = { name: 'Sun Mask', stack: 1, armour: { piece: 0, points: 4 }, wearMax: 600, repair: GOLD_INGOT, guards: 'heat', about: 'the desert sun can\'t harm you' };
ITEMS[FROST_CIRCLET] = { name: 'Frost Circlet', stack: 1, armour: { piece: 0, points: 4 }, wearMax: 600, repair: SILVER_INGOT, guards: 'chill', about: 'the cold can\'t touch you' };
ITEMS[EMBER_CROWN] = { name: 'Ember Crown', stack: 1, armour: { piece: 0, points: 6 }, wearMax: 800, repair: GOLD_INGOT, guards: 'fire', about: 'lava doesn\'t burn you' };
ITEMS[HONEY_TEA] = { name: 'Honey Tea', stack: 8, tea: ['warm', 300], about: 'feel warm inside: no chill' };
// hearty meals: the better the meal, the longer you stay well fed (see main.js)
ITEMS[MUSHROOM_STEW] = { name: 'Mushroom Stew', food: 8 };
ITEMS[FISH_PIE] = { name: 'Fish Pie', food: 12 };

// Creative mode's copy wand (only found in the creative palette): tap two corners to copy what's between
// them, then tap to paste it; hold it still (as if breaking) to start over.
export const COPY_WAND = 1027;
ITEMS[COPY_WAND] = { name: 'Copy Wand', stack: 1, about: 'creative: copy and paste builds' };

// Enchantments, put on at the altar. on: what they can go on; cost: what they take.
const toolType = (id) => ITEMS[id]?.tool?.type;
export const ENCHANTS = {
  swift: { name: 'Swift', about: 'digs 40% faster', on: (id) => ['pick', 'axe', 'shovel'].includes(toolType(id)), cost: [[CRYSTAL_SHARD, 4]] },
  sturdy: { name: 'Sturdy', about: 'wears half as fast', on: (id) => maxWear(id) > 0, cost: [[CRYSTAL_SHARD, 4], [GOLD_INGOT, 1]] },
  keen: { name: 'Keen', about: 'hits 3 harder', on: (id) => ['sword', 'axe'].includes(toolType(id)), cost: [[CRYSTAL_SHARD, 6], [SUN_SCARAB, 1]] },
  flame: { name: 'Flame', about: 'sets creatures alight', on: (id) => ['sword', 'axe'].includes(toolType(id)), cost: [[CRYSTAL_SHARD, 6], [EMBER_CORE, 1]] },
  warmth: { name: 'Warmth', about: 'keeps out the cold', on: (id) => { const p = ITEMS[id]?.armour?.piece; return p !== undefined && p < 4; }, cost: [[CRYSTAL_SHARD, 4], [FROST_HEART, 1]] },
};
export const hasEnch = (slot, e) => !!slot?.ench?.includes(e);

RECIPES.push(
  { out: [ENCHANT_ALTAR, 1], in: [[OBSIDIAN, 4], [CRYSTAL_SHARD, 4], [GOLD_INGOT, 1]], table: true, metal: GOLD_INGOT },
  { out: [CUT_SANDSTONE, 4], in: [[SANDSTONE, 4]], table: true },
);

// ---------- more automation: observers, gauges, harvesters, steam engines and switch rails ----------
// An observer watches the block in front of it and gives a short pulse of signal (like a button) when
// that block changes. A storage gauge reads the chest, machine or cauldron in front of it and gives a
// steady signal while it holds anything (or, tapped to change it, only while it's full). Both are
// switches, so they work doors, clutches, powered rails and switch rails; the signal also passes through
// the block behind them.
export const OBSERVER = 645, // 645..652: + facing (the way it looks) + 4 while signalling
  GAUGE = 653, // 653..660: + facing + 4 while signalling
  HARVESTER = 661, // 661..664: + facing (the way it reaps)
  STEAM_ENGINE = 665, // 665..672: + facing (its firebox door) + 4 while it's burning
  SWITCH_RAIL = 673; // 673..688: see switchRailId
const sensorBase = { hardness: 1.5, tool: 'pick', sound: 'stone', side: T.OBSERVER_SIDE, top: T.OBSERVER_SIDE, bottom: T.OBSERVER_SIDE };
for (let k = 0; k < 8; k++) {
  const f = k & 3, on = k >= 4;
  block(OBSERVER + k, {
    ...sensorBase, name: 'Observer', front: on ? T.OBSERVER_FACE_ON : T.OBSERVER_FACE, facing: f, switch: 'observer', on, sensor: 'observer',
    variantOf: k ? OBSERVER : 0, drop: OBSERVER,
  });
  block(GAUGE + k, {
    ...sensorBase, name: 'Storage Gauge', front: on ? T.GAUGE_FACE_ON : T.GAUGE_FACE, facing: f, switch: 'gauge', on, sensor: 'gauge',
    variantOf: k ? GAUGE : 0, drop: GAUGE, light: on ? 4 : 0,
  });
}
// A harvester, driven by a shaft, reaps ripe crops (wheat, berries, sugar cane) in the 5 x 5 patch in
// front of it, replants them, and passes the harvest to whatever is behind it, like a drill.
for (let f = 0; f < 4; f++) {
  block(HARVESTER + f, {
    hardness: 2.5, tool: 'pick', sound: 'stone', name: 'Harvester', side: T.DRILL_SIDE, top: T.DRILL_SIDE, bottom: T.DRILL_SIDE,
    front: T.HARVESTER_FRONT, facing: f, harvester: true, machine: { load: 3 }, variantOf: f ? HARVESTER : 0, drop: HARVESTER,
  });
}
// A steam engine: a boiler that burns coal (or any fuel) put into it by hand or by a hopper, and turns
// every shaft or gear that points into it, like a gearbox, with more power than a water wheel. It needs
// water beside it (a cauldron with water in it will do).
export const ENGINE_POWER = 16;
for (let k = 0; k < 8; k++) {
  const f = k & 3, on = k >= 4;
  block(STEAM_ENGINE + k, {
    hardness: 3, tool: 'pick', needsTool: true, sound: 'stone', name: 'Steam Engine', side: T.ENGINE_SIDE, top: T.ENGINE_TOP, bottom: T.ENGINE_SIDE,
    front: on ? T.ENGINE_FRONT_ON : T.ENGINE_FRONT, facing: f, engine: true, lit: on, light: on ? 10 : 0,
    kinetic: { part: 'engine', mat: 1, axis: -1 }, variantOf: k ? STEAM_ENGINE : 0, drop: STEAM_ENGINE,
  });
}
// A switch rail joins a branch line to a straight one. It runs straight until it gets a signal (a lever
// beside it, an observer, a gauge...), then switches carts onto the branch. Carts coming in off either
// line always run on to the shared end (the stem).
export const switchRailId = (stem, branch, curved) => SWITCH_RAIL + ((stem * 2 + (branch === (stem + 1) % 4 ? 0 : 1)) * 2) + (curved ? 1 : 0);
for (let k = 0; k < 16; k++) {
  const stem = k >> 2, branch = (k >> 1) & 1 ? (stem + 3) % 4 : (stem + 1) % 4, curved = !!(k & 1), straight = (stem + 2) % 4;
  const [bx, bz] = FACING_DIRS[curved ? straight : branch];
  block(SWITCH_RAIL + k, {
    name: 'Switch Rail', sound: 'stone', transparent: true, solid: false, hardness: 0.7, tool: 'pick',
    // the rail it's set to, and a little red lamp toward the end that's switched off
    model: [...railModel({ ends: [stem, curved ? branch : straight] }), [7 + bx * 6, 0, 7 + bz * 6, 9 + bx * 6, 2, 9 + bz * 6, T.GOLD]],
    rail: { ends: [stem, curved ? branch : straight], slope: -1, powered: false, junction: { stem, straight, branch, curved }, all: [stem, straight, branch] },
    variantOf: k ? SWITCH_RAIL : 0, drop: SWITCH_RAIL,
  });
}
RECIPES.push(
  { out: [OBSERVER, 1], in: [[COBBLE, 6], [CRYSTAL_SHARD, 1], [IRON_INGOT, 1]], table: true, metal: IRON_INGOT },
  { out: [GAUGE, 1], in: [[COBBLE, 4], [COPPER_INGOT, 2], [GLASS, 1]], table: true, metal: COPPER_INGOT },
  { out: [HARVESTER, 1], in: [[STEEL_INGOT, 2], [IRON_INGOT, 3], [kineticId('gear', 1), 1]], table: true, metal: STEEL_INGOT },
  { out: [STEAM_ENGINE, 1], in: [[IRON_INGOT, 6], [COPPER_INGOT, 4], [BRICKS, 4], [kineticId('gear', 1), 1]], table: true, metal: IRON_INGOT },
  { out: [SWITCH_RAIL, 1], in: [[RAIL, 3], [LEVER, 1]], table: true, metal: IRON_INGOT },
);

// ---------- building: walls, pillars, painted doors, stained panes, lanterns, glow lamps, paintings ----------
// Light colours: what colour a light-giving block lights its surroundings (index 0 is ordinary warm
// firelight; glow lamps give 1 + their dye colour). The world carries each cell's colour along with
// its light (see world.js), and the shader tints torch light by it.
export const TINTS = [
  [1, 0.86, 0.66], // firelight
  [0.92, 0.95, 1], [0.62, 0.36, 1], [1, 0.32, 0.26], [1, 0.62, 0.24], [1, 0.95, 0.42],
  [0.45, 1, 0.42], [0.3, 1, 0.95], [0.36, 0.55, 1], [0.8, 0.42, 1], [1, 0.56, 0.8],
];
export const WALL = 690, // 690..695: + material (see WALL_MATS)
  PILLAR = 696, SAND_PILLAR = 697,
  PAINTED_DOOR = 700, // 700..859: + colour * 16 + the door's usual variant
  STAINED_PANE = 860, // 860..869: + colour
  LANTERN = 870, HANGING_LANTERN = 871, CHANDELIER = 872,
  GLOW_LAMP = 873, // 873..882: + colour
  PAINTING = 883; // 883..914: + art * 4 + facing
// Walls join up to each other and to solid blocks like fences do (see world.js), but chunky and stone.
export const WALL_MATS = [
  { name: 'Cobblestone', full: COBBLE, tex: T.COBBLE }, { name: 'Stone Brick', full: BRICKS, tex: T.BRICKS },
  { name: 'Brick', full: CLAY_BRICKS, tex: T.CLAY_BRICKS }, { name: 'Sandstone', full: SANDSTONE, tex: T.SANDSTONE_SIDE },
  { name: 'Mossy Stone Brick', full: MOSSY_BRICKS, tex: T.MOSSY_BRICKS }, { name: 'Cut Sandstone', full: CUT_SANDSTONE, tex: T.CUT_SANDSTONE },
];
WALL_MATS.forEach((m, i) => block(WALL + i, {
  name: `${m.name} Wall`, shape: 'wall', sound: 'stone', tool: 'pick', needsTool: true, hardness: 2.5, transparent: true, wallTex: m.tex,
  model: [[4, 0, 4, 12, 16, 12, m.tex], [0, 0, 5, 4, 14, 11, m.tex], [12, 0, 5, 16, 14, 11, m.tex]],
}));
block(PILLAR, { name: 'Stone Pillar', side: T.PILLAR_SIDE, top: T.PILLAR_TOP, bottom: T.PILLAR_TOP, hardness: 2.25, tool: 'pick', needsTool: true });
block(SAND_PILLAR, { name: 'Sandstone Pillar', side: T.SAND_PILLAR_SIDE, top: T.SAND_PILLAR_TOP, bottom: T.SAND_PILLAR_TOP, hardness: 2, tool: 'pick', needsTool: true });
COLORS.forEach((c, ci) => {
  for (let k = 0; k < 16; k++) {
    const f = k >> 2, open = (k >> 1) & 1, upper = k & 1, base = PAINTED_DOOR + ci * 16;
    block(base + k, {
      ...furniture, name: `${c.name} Door`, model: rotateModel(doorModel(open, upper, ci), f), solid: !open,
      variantOf: k ? base : 0, drop: upper ? 0 : base, facing: f, open: !!open, upper: !!upper, doorBase: base, color: ci,
    });
  }
  block(STAINED_PANE + ci, {
    name: `${c.name} Glass Pane`, shape: 'pane', sound: 'glass', hardness: 0.4, transparent: true, color: ci,
    model: [[0, 0, 7, 16, 16, 9, T.STAINED + ci]], paneTex: T.STAINED + ci,
  });
  block(GLOW_LAMP + ci, {
    name: `${c.name} Glow Lamp`, tex: T.GLOW_LAMP + ci, sound: 'glass', hardness: 0.6, light: 14, tint: ci + 1, color: ci,
  });
});
// a lantern stands on a block, or hangs from one on a short chain; a chandelier hangs from a ceiling
const LANTERN_BOX = (y) => [[5, y, 5, 11, y + 1, 11, T.IRON], [5.5, y + 1, 5.5, 10.5, y + 6, 10.5, T.GLASS], [6.5, y + 1.5, 6.5, 9.5, y + 5, 9.5, T.FLAME, true],
  [5, y + 6, 5, 11, y + 7, 11, T.IRON], [7, y + 7, 7, 9, y + 8, 9, T.IRON]];
block(LANTERN, { name: 'Lantern', sound: 'stone', transparent: true, solid: false, hardness: 1, tool: 'pick', light: 14, model: LANTERN_BOX(0) });
block(HANGING_LANTERN, {
  name: 'Lantern', sound: 'stone', transparent: true, solid: false, hardness: 1, tool: 'pick', light: 14, variantOf: LANTERN, drop: LANTERN,
  model: [...LANTERN_BOX(6), [7.5, 14, 7.5, 8.5, 16, 8.5, T.IRON]],
});
block(CHANDELIER, {
  name: 'Chandelier', sound: 'stone', transparent: true, solid: false, hardness: 1, tool: 'pick', light: 15,
  model: [
    [7.5, 9, 7.5, 8.5, 16, 8.5, T.GOLD], [2, 8, 7.5, 14, 9, 8.5, T.GOLD], [7.5, 8, 2, 8.5, 9, 14, T.GOLD], [6, 7, 6, 10, 9, 10, T.GOLD],
    ...[[2, 8], [14, 8], [8, 2], [8, 14]].flatMap(([x, z]) => [[x - 1, 9, z - 1, x + 1, 12, z + 1, T.CANDLE], [x - 0.5, 12, z - 0.5, x + 0.5, 13.5, z + 0.5, T.FLAME, true]]),
  ],
});
// Paintings: hung on the side of a block, each shows one of the pictures in ART (drawn by paintings.js),
// reaching right and up from the block it hangs in.
export const ART = [
  { name: 'Sunset Hills', w: 1, h: 1 }, { name: 'Night Sky', w: 1, h: 1 }, { name: 'The Sea', w: 2, h: 1 },
  { name: 'Mountains', w: 2, h: 1 }, { name: 'Meadow', w: 2, h: 2 }, { name: 'The Lighthouse', w: 1, h: 2 },
  { name: 'Desert Dunes', w: 2, h: 2 }, { name: 'The Long Valley', w: 4, h: 2 },
];
ART.forEach((a, ai) => {
  for (let f = 0; f < 4; f++) {
    block(PAINTING + ai * 4 + f, {
      name: 'Painting', sound: 'wood', hardness: 0.5, tool: 'axe', transparent: true, solid: false, facing: f,
      model: rotateModel([[0, 0, 0, 16, 16, 0.5, T.PLANKS]], f).map((b) => [...b.slice(0, 6), T.PLANKS]), painting: { art: ai, ...a },
      variantOf: ai || f ? PAINTING : 0, drop: PAINTING,
    });
  }
});
export const isWall = (id) => BLOCKS[id]?.shape === 'wall';
RECIPES.push(
  ...WALL_MATS.map((m, i) => ({ out: [WALL + i, 6], in: [[m.full, 6]], table: true })),
  { out: [PILLAR, 2], in: [[STONE, 2]], table: true },
  { out: [SAND_PILLAR, 2], in: [[SANDSTONE, 2]], table: true },
  ...COLORS.flatMap((c, i) => [
    { out: [PAINTED_DOOR + i * 16, 1], in: [[DOOR, 1], [DYE + i, 1]], table: true, metal: DYE + i },
    { out: [STAINED_PANE + i, 16], in: [[STAINED_GLASS + i, 6]], table: true, metal: STAINED_GLASS + i },
    { out: [GLOW_LAMP + i, 2], in: [[CRYSTAL_SHARD, 2], [STAINED_GLASS + i, 1], [TORCH, 1]], table: true, metal: CRYSTAL_SHARD },
  ]),
  { out: [LANTERN, 1], in: [[IRON_INGOT, 2], [TORCH, 1]], table: true, metal: IRON_INGOT },
  { out: [CHANDELIER, 1], in: [[GOLD_INGOT, 2], [TORCH, 4]], table: true, metal: GOLD_INGOT },
  { out: [PAINTING, 1], in: [[STICK, 4], [WOOL, 1], [DYE + 2, 1]], table: true, metal: DYE + 2 },
);

// ---------- signals: copper wire, inverters, delay blocks, latches and detector rails ----------
// Copper wire lies on top of blocks and carries a signal along itself as far as it runs (up and down a
// block too): anything that switches on beside a wire (a lever, a button, an observer...) powers the whole
// line, and the wire powers what it touches, like a switch. The three logic blocks sit on top of a block
// too, and take their signal from behind (a wire, a switch or a powered block) and give it out in front:
// an inverter gives a signal while it gets none; a delay block passes on its signal after a while (tap it
// to set from half a second to five); a latch flips on or off each time its signal comes on. A detector
// rail signals while a cart is on it.
export const WIRE = 1100, // 1101 = carrying a signal
  INVERTER = 1102, // 1102..1109: + facing (the way its signal goes) + 4 while it signals
  DELAY = 1110, // 1110..1117: likewise
  LATCH = 1118, // 1118..1125: likewise
  DETECTOR_RAIL = 1126; // 1126..1129: + axis (0 along z, 1 along x) + 2 while a cart is on it
for (let k = 0; k < 2; k++) {
  const on = !!k, t = on ? T.WIRE_ON : T.WIRE_OFF;
  block(WIRE + k, {
    name: 'Copper Wire', shape: 'wire', sound: 'stone', hardness: 0.2, transparent: true, solid: false, switch: 'wire', on, floor: true,
    logic: 'wire', flip: WIRE + 1 - k, light: on ? 3 : 0, variantOf: k ? WIRE : 0, drop: WIRE,
    model: [[6.5, 0, 0, 9.5, 1, 16, t], [0, 0, 6.5, 16, 1, 9.5, t]], // (as an icon: the world draws it joined up, see world.js)
  });
}
// a stone plate with a copper strip from back to front and little lamps that light up; drawn facing +z
const logicModel = (kind, on) => {
  const lamp = on ? T.WIRE_ON : T.WIRE_OFF, m = [[0, 0, 0, 16, 2, 16, T.LOGIC_BASE], [7, 2, 0, 9, 2.5, 16, T.WIRE_OFF]];
  if (kind === 'inverter') m.push([6.5, 2, 9, 9.5, 7, 12, lamp], [5, 2, 3, 11, 3, 5, T.STONE]);
  if (kind === 'delay') m.push([6.5, 2, 2, 9.5, 6, 5, lamp], [6.5, 2, 11, 9.5, 6, 14, lamp], [3, 2, 7, 13, 3.5, 9, T.IRON]);
  if (kind === 'latch') m.push([4, 2, 5, 12, 4, 11, T.LOGIC_BASE], [6.5, 4, 7, 9.5, 7, 9, lamp], on ? [10, 2, 12, 13, 5, 15, lamp] : [3, 2, 12, 6, 5, 15, lamp]);
  return m;
};
[['inverter', INVERTER, 'Inverter'], ['delay', DELAY, 'Delay Block'], ['latch', LATCH, 'Latch']].forEach(([kind, base, name]) => {
  for (let k = 0; k < 8; k++) {
    const f = k & 3, on = k >= 4;
    block(base + k, {
      name, sound: 'stone', hardness: 0.3, transparent: true, solid: false, switch: kind, on, floor: true, facing: f, directed: true,
      logic: kind, flip: base + (k ^ 4), light: on ? 4 : 0, model: rotateModel(logicModel(kind, on), f), variantOf: k ? base : 0, drop: base,
    });
  }
});
for (let k = 0; k < 4; k++) {
  const axis = k & 1, on = k >= 2, ends = axis ? [1, 3] : [0, 2];
  block(DETECTOR_RAIL + k, {
    name: 'Detector Rail', sound: 'stone', transparent: true, solid: false, hardness: 0.7, tool: 'pick', switch: 'detector', on, floor: true,
    model: [...railModel({ ends }), ...rotateModel([[6, 0, 6, 10, 1.5, 10, on ? T.WIRE_ON : T.LOGIC_BASE]], axis)],
    rail: { ends, slope: -1, powered: false, detector: true }, flip: DETECTOR_RAIL + (k ^ 2), light: on ? 4 : 0,
    variantOf: k ? DETECTOR_RAIL : 0, drop: DETECTOR_RAIL,
  });
}
export const DELAYS = [0.5, 1, 1.5, 2, 3, 4, 5]; // the settings of a delay block, in seconds
RECIPES.push(
  { out: [WIRE, 8], in: [[COPPER_INGOT, 1]], table: true, metal: COPPER_INGOT },
  { out: [INVERTER, 1], in: [[WIRE, 2], [TORCH, 1], [STONE, 2]], table: true, metal: COPPER_INGOT },
  { out: [DELAY, 1], in: [[WIRE, 2], [TORCH, 2], [STONE, 3]], table: true, metal: COPPER_INGOT },
  { out: [LATCH, 1], in: [[WIRE, 2], [LEVER, 1], [STONE, 2]], table: true, metal: COPPER_INGOT },
  { out: [DETECTOR_RAIL, 2], in: [[RAIL, 2], [PRESSURE_PLATE, 1]], table: true, metal: IRON_INGOT },
);

// ---------- moving things: ejectors, collectors, splitting and sorting belts, bucket elevators, auto-crafters ----------
// An ejector throws things out of the chest or machine behind it, onto the ground in front: one at a time
// while it gets a signal (or, tapped to change it, a whole stack each time the signal comes on).
// A collector is a hopper that also pulls in loose things lying within a few blocks of it.
// A splitting belt sends what it carries off to its left and right in turn; a sorting belt sends things
// that match an item frame on it off to the left, and the rest straight on.
// A bucket elevator carries what's put into it (by a belt, a hopper, or dropped in) up its column while a
// shaft turns it, into whatever is above the top, or out onto the top.
// An auto-crafter makes the thing shown in an item frame on it, whenever its ingredients are inside.
export const EJECTOR = 1130, // 1130..1133: + facing (the way it throws)
  COLLECTOR = 1134, // 1134..1138: like a hopper
  BELT_SPLITTER = 1139, // 1139..1142: + facing
  BELT_SORTER = 1143, // 1143..1146: + facing
  ELEVATOR = 1147,
  AUTO_CRAFTER = 1148;
for (let f = 0; f < 4; f++) {
  block(EJECTOR + f, {
    name: 'Ejector', hardness: 2, tool: 'pick', sound: 'stone', side: T.OBSERVER_SIDE, top: T.OBSERVER_SIDE, bottom: T.OBSERVER_SIDE,
    front: T.EJECTOR_FRONT, facing: f, ejector: true, variantOf: f ? EJECTOR : 0, drop: EJECTOR,
  });
}
const COLLECTOR_TOP = [[0, 10, 0, 16, 16, 16, T.ELECTRUM], [4, 5, 4, 12, 10, 12, T.IRON], [1, 16, 1, 15, 16.5, 15, T.WIRE_OFF]];
for (let k = 0; k < 5; k++) {
  const down = k === 4;
  block(COLLECTOR + k, {
    name: 'Collector', sound: 'stone', hardness: 2, tool: 'pick', transparent: true, facing: down ? 0 : k, down,
    model: down ? [...COLLECTOR_TOP, [6, 0, 6, 10, 5, 10, T.IRON]] : rotateModel([...COLLECTOR_TOP, [6, 5, 12, 10, 9, 16, T.IRON]], k),
    variantOf: k ? COLLECTOR : 0, drop: COLLECTOR, hopper: true, collector: true,
  });
}
for (let f = 0; f < 4; f++) {
  const belt = [[0, 0, 0, 16, 4, 16, { top: T.BELT0 + f, side: T.LOG_SIDE, bottom: T.PLANKS }]];
  block(BELT_SPLITTER + f, {
    name: 'Splitting Belt', sound: 'wool', hardness: 0.8, tool: 'axe', transparent: true, facing: f, belt: true, sorts: 'split',
    model: [...belt, ...rotateModel([[7, 4, 9, 9, 7, 16, T.IRON], [5, 4, 14, 11, 7, 16, T.IRON]], f)],
    variantOf: f ? BELT_SPLITTER : 0, drop: BELT_SPLITTER, machine: { load: MACHINE_LOAD.belt },
  });
  block(BELT_SORTER + f, {
    name: 'Sorting Belt', sound: 'wool', hardness: 0.8, tool: 'axe', transparent: true, facing: f, belt: true, sorts: 'sort',
    model: [...belt, ...rotateModel([[0, 4, 14, 16, 5, 16, T.GOLD], [0, 4, 9, 1.5, 9, 16, T.GOLD]], f)],
    variantOf: f ? BELT_SORTER : 0, drop: BELT_SORTER, machine: { load: MACHINE_LOAD.belt },
  });
}
block(ELEVATOR, {
  name: 'Bucket Elevator', sound: 'wood', hardness: 1.5, tool: 'axe', transparent: true, elevator: true, machine: { load: 1 },
  model: [
    [0, 0, 0, 2, 16, 2, T.PLANKS], [14, 0, 0, 16, 16, 2, T.PLANKS], [0, 0, 14, 2, 16, 16, T.PLANKS], [14, 0, 14, 16, 16, 16, T.PLANKS],
    [0, 0, 0, 16, 1, 16, T.PLANKS], [7.5, 0, 3, 8.5, 16, 4, T.IRON], [7.5, 0, 12, 8.5, 16, 13, T.IRON],
    [5, 3, 2, 11, 6, 5, T.IRON], [5, 11, 2, 11, 14, 5, T.IRON], [5, 6, 11, 11, 9, 14, T.IRON],
  ],
});
block(AUTO_CRAFTER, {
  name: 'Auto-Crafter', station: 'crafter', hardness: 2.5, tool: 'axe', sound: 'wood', top: T.TABLE_TOP, bottom: T.PLANKS, side: T.CRAFTER_FRONT,
});
RECIPES.push(
  { out: [EJECTOR, 1], in: [[COBBLE, 5], [IRON_INGOT, 2], [WIRE, 1]], table: true, metal: IRON_INGOT },
  { out: [COLLECTOR, 1], in: [[HOPPER, 1], [COPPER_INGOT, 4]], table: true, metal: COPPER_INGOT },
  { out: [BELT_SPLITTER, 1], in: [[BELT, 1], [IRON_INGOT, 1]], table: true, metal: IRON_INGOT },
  { out: [BELT_SORTER, 1], in: [[BELT, 1], [ITEM_FRAME, 1], [GOLD_INGOT, 1]], table: true, metal: GOLD_INGOT },
  { out: [ELEVATOR, 4], in: [[PLANKS, 4], [BUCKET, 1], [LEATHER, 2]], table: true, metal: LEATHER },
  { out: [AUTO_CRAFTER, 1], in: [[TABLE, 1], [IRON_INGOT, 4], [kineticId('gear', 1), 1]], table: true, metal: IRON_INGOT },
);

// ---------- power: drive belts, flywheels, tachometers and gear shifts ----------
// A drive belt (an item) links two shafts or gears on parallel axles up to 8 blocks apart: tap one with it,
// then the other, and they turn together. A flywheel joins up like a shaft and stores spin while the
// network has power to spare, then gives it back when the power drops, so a network keeps running for a
// while after its wheels stop. A tachometer, driven like a machine (it takes no load), shows the speed
// and load when you tap it, and gives a signal while its network is stopped or overloaded. A gear shift
// joins like a shaft, but the far (+) end turns twice as fast as the near end while it gets a signal.
export const DRIVE_BELT = 1030,
  FLYWHEEL = 1150, // 1150..1152: + axis
  GEAR_SHIFT = 1153, // 1153..1155: + axis
  TACHOMETER = 1156; // 1157 = signalling
export const BELT_REACH = 8;
ITEMS[DRIVE_BELT] = { name: 'Drive Belt', about: 'tap two shafts on parallel axles to link them' };
for (let a = 0; a < 3; a++) {
  block(FLYWHEEL + a, {
    ...kineticShape, name: 'Flywheel', sound: 'stone', tool: 'pick', hardness: 2, variantOf: a ? FLYWHEEL : 0, drop: FLYWHEEL,
    kinetic: { part: 'flywheel', mat: 1, axis: a },
  });
  block(GEAR_SHIFT + a, {
    ...kineticShape, name: 'Gear Shift', sound: 'stone', tool: 'pick', hardness: 1.5, variantOf: a ? GEAR_SHIFT : 0, drop: GEAR_SHIFT,
    kinetic: { part: 'shift', mat: 1, axis: a },
  });
}
for (let k = 0; k < 2; k++) {
  block(TACHOMETER + k, {
    name: 'Tachometer', hardness: 1.5, tool: 'pick', sound: 'stone', side: k ? T.GAUGE_FACE_ON : T.GAUGE_FACE, top: T.IRON, bottom: T.IRON,
    machine: { load: 0 }, sensor: 'tacho', switch: 'tacho', on: !!k, flip: TACHOMETER + 1 - k, light: k ? 4 : 0,
    variantOf: k ? TACHOMETER : 0, drop: TACHOMETER,
  });
}
RECIPES.push(
  { out: [DRIVE_BELT, 1], in: [[LEATHER, 2], [STICK, 1]], table: true, metal: LEATHER },
  { out: [FLYWHEEL, 1], in: [[STONE, 6], [IRON_INGOT, 2], [kineticId('shaft', 1), 1]], table: true, metal: IRON_INGOT },
  { out: [GEAR_SHIFT, 1], in: [[kineticId('gear', 1), 2], [kineticId('large', 1), 1], [IRON_INGOT, 1]], table: true, metal: IRON_INGOT },
  { out: [TACHOMETER, 1], in: [[COPPER_INGOT, 2], [GLASS, 1], [kineticId('shaft', 0), 1]], table: true, metal: COPPER_INGOT },
);

// ---------- liquids: tanks, valves, sprinklers ----------
// A tank holds up to TANK_CAP buckets of water or lava: pour buckets in (or take them out) by hand, or
// fill it from a pump through lead pipes. A pump beside a tank pumps from it. A storage gauge reads it.
// A valve is a pipe that only lets liquid through while it gets a signal. Lava piped up to an oven,
// smelter or steam engine burns there as its fuel. A sprinkler on a water pipe waters the 5 x 5 patch
// around it (and the level below), and crops there grow twice as fast.
export const TANK = 1160, // 1160 empty; 1161..1164 water by quarters; 1165..1168 lava by quarters
  VALVE = 1169, SPRINKLER = 1170, TANK_CAP = 16;
export const tankId = (liquid, amount) => (amount <= 0 ? TANK : TANK + (liquid === LAVA ? 4 : 0) + Math.max(1, Math.min(4, Math.ceil((amount / TANK_CAP) * 4))));
for (let k = 0; k < 9; k++) {
  const lava = k > 4, q = k === 0 ? 0 : lava ? k - 4 : k, h = 1 + q * 3.5;
  block(TANK + k, {
    name: 'Tank', sound: 'glass', hardness: 1.5, tool: 'pick', transparent: true, tank: true, light: lava ? 10 : 0,
    model: [
      ...(q ? [[1.5, 1, 1.5, 14.5, h, 14.5, lava ? T.LAVA : T.TANK_WATER]] : []),
      [0, 0, 0, 16, 1, 16, T.IRON], [0, 15, 0, 16, 16, 16, T.IRON],
      [0, 1, 0, 1, 15, 1, T.IRON], [15, 1, 0, 16, 15, 1, T.IRON], [0, 1, 15, 1, 15, 16, T.IRON], [15, 1, 15, 16, 15, 16, T.IRON],
      [1, 1, 0.5, 15, 15, 1, T.GLASS], [1, 1, 15, 15, 15, 15.5, T.GLASS], [0.5, 1, 1, 1, 15, 15, T.GLASS], [15, 1, 1, 15.5, 15, 15, T.GLASS],
    ],
    variantOf: k ? TANK : 0, drop: TANK,
  });
}
block(VALVE, { name: 'Valve', shape: 'pipe', transparent: true, sound: 'stone', hardness: 1, tool: 'pick', valve: true });
block(SPRINKLER, {
  name: 'Sprinkler', sound: 'stone', hardness: 1, tool: 'pick', transparent: true, solid: false, sprinkler: true,
  model: [[6, 8, 6, 10, 16, 10, T.LEAD], [3, 6, 7, 13, 8, 9, T.LEAD], [7, 6, 3, 9, 8, 13, T.LEAD], [6.5, 5, 6.5, 9.5, 6, 9.5, T.IRON]],
});
RECIPES.push(
  { out: [TANK, 1], in: [[IRON_INGOT, 4], [GLASS, 4], [PIPE, 1]], table: true, metal: IRON_INGOT },
  { out: [VALVE, 1], in: [[PIPE, 1], [IRON_INGOT, 1], [LEVER, 1]], table: true, metal: LEAD_INGOT },
  { out: [SPRINKLER, 1], in: [[SPOUT, 1], [PIPE, 2]], table: true, metal: LEAD_INGOT },
);
