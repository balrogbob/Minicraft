// Block and item definitions.

// Block ids: < 100, 190..255, 400..999 and 1100 up. Stored in each chunk's Uint16Array.
// Item ids: 100..189, 300..399, 1000..1099 and (from v28) 3000 up, out of the way of the blocks.
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
  WIRE_OFF: 211, WIRE_ON: 212, LOGIC_BASE: 213, EJECTOR_FRONT: 214, CRAFTER_FRONT: 215, TANK_WATER: 216, PLANTER_FRONT: 217, PLACER_FRONT: 218, RANCH_SIDE: 219, NET: 220,
  ELWIRE_OFF: 221, ELWIRE_ON: 222, GEN_SIDE: 223, GEN_TOP: 224, CHARGER_TOP: 225, CHARGER_SIDE: 226, PULV_FRONT: 227, PULV_SIDE: 228, ELAMP_OFF: 229, ELAMP_ON: 230,
  GRIDBAT_SIDE: 231, GRIDBAT_TOP: 232, MOTOR_SIDE: 233, MOTOR_TOP: 234, SOLAR_TOP: 235, METER_FACE: 236, METER_FACE_ON: 237,
  DAYSENSE_TOP: 238, DAYSENSE_TOP_ON: 239, ESMELT_FRONT: 240, ESMELT_SIDE: 241, NICKEL_ORE: 242, CABLE: 243, SPAWNER: 244,
  PCRAFT_TOP: 245, PCRAFT_SIDE: 246, COUNTER_FRONT: 247, COUNTER_FRONT_ON: 248, TELEPAD: 249, TELEPAD_ON: 250, QUARRY_FRONT: 251,
  QUARRY_SIDE: 252, TURBINE: 253,
  GEO_SIDE: 254, GEO_TOP: 255, WCHARGE_SIDE: 256, WCHARGE_TOP: 257, ELEVATOR_TOP: 258, ELEVATOR_SIDE: 259, URANIUM_ORE: 260,
  REACTOR_SIDE: 261, REACTOR_SIDE_HOT: 262, REACTOR_TOP: 263,
  BOOKSHELF: 264, COMPOST_SIDE: 265, COMPOST_TOP: 266,
  LEAD_CHEST_SIDE: 267, LEAD_CHEST_TOP: 268, LEAD_CHEST_FRONT: 269, CENTRIFUGE_SIDE: 270, CENTRIFUGE_TOP: 271, TESLA: 272, TESLA_TOP: 273,
  FENCE_POST: 274, FENCE_WIRE: 275, FREEZER_SIDE: 276, FREEZER_FRONT: 277, ARC_SIDE: 278, ARC_FRONT: 279, PACKED_ICE: 280, INVAR: 281, RAIL_STOP: 282, BASALT: 283, BASALT_TOP: 284, METEORITE: 285,
  IRON_BARS: 286, POT: 287, IVY: 288, BOX_FLOWERS: 289,
  FRUIT_LEAVES: 290, FRUIT_RIPE: 293, FRUIT_SAPLING: 296, HAY: 299, SACK: 300, BEACON: 301, APIARY_SIDE: 302, APIARY_FRONT: 303, APIARY_FULL: 304, APIARY_TOP: 305, BELT_CROSS: 306, FARM_CTRL: 307, FARM_CTRL_ON: 308, TUBE: 309, TUBE_END: 310, AWNING: 311, FIRE: 312, CARROT_0: 313, POTATO_0: 317, STEM_0: 321, PUMPKIN_SIDE: 324, PUMPKIN_TOP: 325, JACK_FACE: 326, TRELLIS: 327, VINE_0: 328, BARREL_SIDE: 331, BARREL_TOP: 332, CHEESE: 333, SEA_BRICK: 334, SEA_LANTERN: 335, VAULT: 336, SKY_STONE: 337, AIR_PUMP: 338, RADIO: 339, RADIO_ON: 340, SORTBOX: 341, SORTBOX_TOP: 342, HEARTH: 343, HEARTH_LIT: 344, CHIMNEY_TOP: 345, STABLE_SIDE: 346, SNOWMAN_FRONT: 347, ONION_0: 348, BEAN_0: 352, TOMATO_0: 356, HERB_0: 360, KILN_SIDE: 364, KILN_TOP: 365, KILN_FRONT: 366, KILN_FRONT_LIT: 367, TERRACOTTA: 368, TERRA_COL: 369, GLAZED: 379, ROOF_TILES: 389, URN: 390, ROPE: 391, LOCK_GATE: 392, LOCK_GATE_TOP: 393, DRIPSTONE: 394, BEETLE_LAMP: 395, WASHER_SIDE: 396, WASHER_TOP: 397, WASHER_FRONT: 398, SIEVE: 399, SLAG_BRICKS: 400, CHARCOAL_HEAP: 401, LP_ARM: 402, LP_CORE: 403, LP_TABLE_TOP: 409, LP_TABLE_SIDE: 410, LP_JUNCTION: 411, LP_SENSOR_CORE: 412, LP_SENSOR_ON: 413, LP_FPROVIDER: 414, LP_FSUPPLIER: 415, DRONE_PAD_TOP: 416, DRONE_PAD_SIDE: 417, LP_FSINK: 418, BOTTLER_SIDE: 419, BOTTLER_TOP: 420, BEEHOUSE_SIDE: 421, BEEHOUSE_TOP: 422, BEEHOUSE_FRONT: 423, COMB_SPIN_SIDE: 424, COMB_SPIN_TOP: 425, TAP_SIDE: 426, TAP_LATEX: 427, PRESS_SIDE: 428, PRESS_TOP: 429, INSWIRE_OFF: 430, INSWIRE_ON: 431, BOUNCE_TOP: 432, BOUNCE_SIDE: 433, POLY_COL: 434, LUMEN: 444, DEMO_SIDE: 445, DEMO_TOP: 446, DEMO_ARMED: 447, DETONATOR_TILE: 448, COCOA_LEAVES: 449, COCOA_RIPE: 450, COCOA_SAPLING: 451, MOULD: 452, CHOC: 453, CHOC_LIQUID: 454, CAKE_TOP: 455, CAKE_SIDE: 456, RACK: 457, TOFFEE: 458, TOFFEE_LIQ: 459, CANDY: 460, CANDY_LIQ: 461, COFFEE_0: 462, RICE_0: 466, CHILLI_0: 470, CARP_SIDE: 474, CARP_TOP: 475, STILL_COPPER: 476, // (434..443: polymer + colour) // (fruit tiles: apple, cherry, orange)
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
  1: 'wooden', 2: 'stone', 3: 'copper-class', 4: 'iron-class', 5: 'stainless steel', 6: 'tungsten', 7: 'starsteel',
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
    electric: o.electric ?? null, // { role: 'wire' | 'cable' | 'gen' | 'use' | 'store' | 'meter', draw, speed, solar, wind }: joined up by electrum wire (see electric.js)
    spawner: !!o.spawner, counter: !!o.counter, quarry: !!o.quarry, pad: !!o.pad, // v22 machines (see machines.js)
    lift: !!o.lift, reactor: !!o.reactor, // v23: lifts and reactors (see electric.js and main.js)
    postTex: o.postTex ?? null, armTex: o.armTex ?? null, // a fence's own post and rail tiles (an electric fence)
    shock: !!o.shock, tesla: !!o.tesla, zip: !!o.zip, // v24: electric fences, tesla coils, zipline posts (see main.js)
    fruit: o.fruit ?? null, scarecrow: !!o.scarecrow, apiary: !!o.apiary, crossing: !!o.crossing, tube: !!o.tube, // v25: { kind, ripe } on a fruit tree's leaves; scarecrows keep crows off crops
    sortbox: !!o.sortbox, hearth: !!o.hearth, chimney: !!o.chimney, stable: !!o.stable, snowman: !!o.snowman, ropeLadder: !!o.ropeLadder, stalactite: !!o.stalactite, bridge: o.bridge ?? null, // v26: a sorting machine (see machines.js)
    crop: o.crop ?? null, // v26: { kind, stage, ripe, seed } for the newer crops (carrots, potatoes, pumpkin vines, grapes)
    farm: o.farm ?? null, // 'feller' | 'planter' | 'breaker' | 'placer' | 'ranch' | 'net' (see machines.js)
    lpipe: o.lpipe ?? null, // v29: a part of a logistics network (see logistics.js): its role
    tap: o.tap ?? -1, // v32: a tree tap's latex level
    wireTex: o.wireTex ?? null, // v32: [off, on] tiles for a wire that isn't electrum
    bounce: o.bounce ?? 0, // v32: how high a bounce pad throws you (blocks/s), 0 for none
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
export const isOre = (id) => (id >= IRON_ORE && id <= TUNGSTEN_ORE) || id === NICKEL_ORE || id === URANIUM_ORE;
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
  return model.map(([x0, y0, z0, x1, y1, z1, tiles, ...rest]) => {
    let ax = x0, az = z0, bx = x1, bz = z1;
    for (let k = 0; k < turns; k++) {
      [ax, az] = [16 - az, ax];
      [bx, bz] = [16 - bz, bx];
    }
    return [Math.min(ax, bx), y0, Math.min(az, bz), Math.max(ax, bx), y1, Math.max(az, bz), tiles, ...rest];
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
function railModel({ ends, slope = -1, powered }, metal) {
  const rail = metal ?? (powered ? T.GOLD : RAIL_IRON);
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
// powered: false, true (a shaft-driven powered rail) or 'electric' (an electric rail: see the v23 section)
export const railId = (ends, slope = -1, powered = false) => {
  if (powered === 'electric') return ELECTRIC_RAIL + (ends[0] % 2);
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
export const oreDust = (oreId) => { const i = ORES.findIndex((o) => o.id === oreId); return ORES[i]?.dust ?? ORE_DUST + i; };
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
// the mortar and pestle wears a little with each thing ground in it
Object.assign(ITEMS[MORTAR], { wearMax: 96, repair: COBBLE });
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

// ---------- farms: tree fellers, planters, block breakers and placers, animal stations, fishing nets ----------
// A tree feller, driven by a shaft, cuts down the tree in front of it (and keeps a sapling or two from
// it), passing the logs behind it like a drill. A planter plants a sapling put into it on the grass or dirt
// in front of it. A block breaker breaks the block in front of it each time its signal comes on (passing
// what it gives behind it); a block placer puts a block from the chest behind it into the space in front.
// An animal station shears alpacas, takes feathers from ducks and milks yaks (into empty buckets put in
// it) within 5 blocks, passing what it gets behind it; wheat put in it is fed to them, so their coats
// grow back twice as fast. A fishing net in water catches a fish every minute or so; a hopper under it
// takes them out.
export const TREE_FELLER = 1171, // 1171..1174: + facing (the way it cuts)
  PLANTER = 1175, // 1175..1178: + facing
  BREAKER = 1179, // 1179..1182: + facing
  PLACER = 1183, // 1183..1186: + facing
  ANIMAL_STATION = 1187, // 1187..1190: + facing (what it gets goes out of the back)
  FISH_NET = 1191;
const farmBase = { hardness: 2.5, tool: 'pick', sound: 'stone', side: T.DRILL_SIDE, top: T.DRILL_SIDE, bottom: T.DRILL_SIDE };
for (let f = 0; f < 4; f++) {
  block(TREE_FELLER + f, { ...farmBase, name: 'Tree Feller', front: T.SAW_FRONT, facing: f, farm: 'feller', machine: { load: 3 }, variantOf: f ? TREE_FELLER : 0, drop: TREE_FELLER });
  block(PLANTER + f, { ...farmBase, name: 'Planter', sound: 'wood', tool: 'axe', side: T.PLANKS, top: T.PLANKS, bottom: T.PLANKS, front: T.PLANTER_FRONT, facing: f, farm: 'planter', station: 'planter', variantOf: f ? PLANTER : 0, drop: PLANTER });
  block(BREAKER + f, { ...farmBase, name: 'Block Breaker', side: T.OBSERVER_SIDE, top: T.OBSERVER_SIDE, bottom: T.OBSERVER_SIDE, front: T.DRILL_FRONT, facing: f, farm: 'breaker', variantOf: f ? BREAKER : 0, drop: BREAKER });
  block(PLACER + f, { ...farmBase, name: 'Block Placer', side: T.OBSERVER_SIDE, top: T.OBSERVER_SIDE, bottom: T.OBSERVER_SIDE, front: T.PLACER_FRONT, facing: f, farm: 'placer', variantOf: f ? PLACER : 0, drop: PLACER });
  block(ANIMAL_STATION + f, { ...farmBase, name: 'Animal Station', sound: 'wood', tool: 'axe', side: T.RANCH_SIDE, top: T.PLANKS, bottom: T.PLANKS, front: T.RANCH_SIDE, facing: f, farm: 'ranch', station: 'ranch', variantOf: f ? ANIMAL_STATION : 0, drop: ANIMAL_STATION });
}
block(FISH_NET, {
  name: 'Fishing Net', sound: 'wool', hardness: 0.5, tool: 'axe', transparent: true, solid: false, farm: 'net', station: 'net',
  model: [[0, 0, 7.5, 16, 16, 8.5, T.NET], [7.5, 0, 0, 8.5, 16, 16, T.NET], [7, 13, 7, 9, 16, 9, T.LOG_SIDE]],
});
RECIPES.push(
  { out: [TREE_FELLER, 1], in: [[STEEL_INGOT, 2], [IRON_INGOT, 3], [kineticId('gear', 1), 1], [LOG, 2]], table: true, metal: STEEL_INGOT },
  { out: [PLANTER, 1], in: [[PLANKS, 4], [SAPLING, 1], [DIRT, 2], [HOPPER, 1]], table: true, metal: IRON_INGOT },
  { out: [BREAKER, 1], in: [[COBBLE, 5], [IRON_INGOT, 2], [metalTool(TOOL_MATERIALS.findIndex((m) => m.key === 'iron'), 'pick'), 1]], table: true, metal: IRON_INGOT },
  { out: [PLACER, 1], in: [[COBBLE, 5], [IRON_INGOT, 2], [HOPPER, 1]], table: true, metal: IRON_INGOT },
  { out: [ANIMAL_STATION, 1], in: [[PLANKS, 6], [IRON_INGOT, 2], [BUCKET, 1], [WHEAT, 4]], table: true, metal: IRON_INGOT },
  { out: [FISH_NET, 1], in: [[STRING, 6], [STICK, 2]], table: true },
);

// ---------- electricity: electrum wire, generators, batteries, chargers, pulverizers, electric lamps ----------
// A generator turned by a shaft makes electricity (GEN_POWER for each 1x it turns at). Electrum wire carries
// it to the machines joined to the wire (or set right beside a generator or each other): electric lamps,
// pulverizers and battery chargers. Electrum wire also carries signals, just like copper wire, and joins
// up with it. Batteries (and the things built round one) hold CHARGE units: a charger fills them.
export const ELECTRUM_WIRE = 1200, // 1201 = carrying a signal
  GENERATOR = 1202,
  CHARGER = 1203,
  PULVERIZER = 1204, // 1204..1207: + facing
  ELECTRIC_LAMP = 1208; // 1209 = lit
export const BATTERY = 1031, PORTABLE_LAMP = 1032, JACKHAMMER = 1033, JETPACK = 1034;
export const GEN_POWER = 4; // electricity a generator makes at 1x
export const ELECTRIC_DRAW = { lamp: 1, pulverizer: 6, charger: 4 }; // what each machine takes while it works
export const CHARGE_RATE = 5; // charge put into a battery for each power a charger gets, each second
// how much charge things take: a portable lamp each second it's on, a jackhammer for each block, a jetpack
// each second it's thrusting
export const CHARGE_USE = { lamp: 1, jackhammer: 5, jetpack: 30 };
for (let k = 0; k < 2; k++) {
  const on = !!k, t = on ? T.ELWIRE_ON : T.ELWIRE_OFF;
  block(ELECTRUM_WIRE + k, {
    name: 'Electrum Wire', shape: 'wire', sound: 'stone', hardness: 0.2, transparent: true, solid: false, switch: 'wire', on, floor: true,
    logic: 'wire', flip: ELECTRUM_WIRE + 1 - k, light: on ? 3 : 0, variantOf: k ? ELECTRUM_WIRE : 0, drop: ELECTRUM_WIRE,
    electric: { role: 'wire' },
    model: [[6.5, 0, 0, 9.5, 1, 16, t], [0, 0, 6.5, 16, 1, 9.5, t]],
  });
}
block(GENERATOR, {
  name: 'Generator', sound: 'stone', hardness: 2.5, tool: 'pick', side: T.GEN_SIDE, top: T.GEN_TOP, bottom: T.GEN_TOP,
  machine: { load: GEN_POWER }, electric: { role: 'gen' },
});
block(CHARGER, {
  name: 'Battery Charger', sound: 'stone', hardness: 2, tool: 'pick', side: T.CHARGER_SIDE, top: T.CHARGER_TOP, bottom: T.IRON,
  station: 'charger', stationBase: CHARGER, electric: { role: 'use', draw: ELECTRIC_DRAW.charger },
});
for (let f = 0; f < 4; f++) {
  block(PULVERIZER + f, {
    name: 'Electric Pulverizer', station: 'pulverizer', side: T.PULV_SIDE, top: T.STAINLESS, bottom: T.STAINLESS, front: T.PULV_FRONT,
    facing: f, hardness: 3, tool: 'pick', variantOf: f ? PULVERIZER : 0, drop: PULVERIZER, stationBase: PULVERIZER,
    electric: { role: 'use', draw: ELECTRIC_DRAW.pulverizer, speed: 2 },
  });
}
for (let k = 0; k < 2; k++) {
  const lit = !!k, glass = lit ? T.ELAMP_ON : T.ELAMP_OFF;
  block(ELECTRIC_LAMP + k, {
    name: 'Electric Lamp', sound: 'glass', hardness: 0.8, transparent: true, solid: false, light: lit ? 20 : 0, lit,
    model: [[4, 0, 4, 12, 2, 12, T.IRON], [5, 2, 5, 11, 10, 11, glass], [6, 10, 6, 10, 11, 10, T.ELECTRUM]],
    variantOf: k ? ELECTRIC_LAMP : 0, drop: ELECTRIC_LAMP, electric: { role: 'use', draw: ELECTRIC_DRAW.lamp },
  });
}
export const isElectricLamp = (id) => id === ELECTRIC_LAMP || id === ELECTRIC_LAMP + 1;
// Battery-powered things: their charge used is kept as `wear` (out of `charge`), but unlike a tool's wear
// it never breaks them: they just stop working until they're charged again.
ITEMS[BATTERY] = { name: 'Battery', stack: 1, charge: 1000 };
ITEMS[PORTABLE_LAMP] = { name: 'Portable Electric Lamp', stack: 1, charge: 1000, handLamp: true };
ITEMS[JACKHAMMER] = { name: 'Jackhammer', stack: 1, charge: 1000, tool: { type: 'pick', speed: 13, tier: 5, damage: 4 } };
ITEMS[JETPACK] = { name: 'Electric Jetpack', stack: 1, charge: 1500, armour: { piece: 1, points: 1, mat: 'jetpack' } };
export const chargeCap = (id) => ITEMS[id]?.charge ?? 0;
export const chargeLeft = (s) => (s && chargeCap(s.id) ? Math.max(0, chargeCap(s.id) - (s.wear ?? 0)) : 0);
export const ELECTRIC_ITEMS = [BATTERY, PORTABLE_LAMP, JACKHAMMER, JETPACK];
RECIPES.push(
  { out: [ELECTRUM_WIRE, 8], in: [[ELECTRUM_INGOT, 1]], table: true, metal: ELECTRUM_INGOT },
  { out: [GENERATOR, 1], in: [[IRON_INGOT, 4], [COPPER_INGOT, 4], [ELECTRUM_WIRE, 2]], table: true, metal: ELECTRUM_WIRE },
  { out: [BATTERY, 1], in: [[LEAD_INGOT, 8], [SLIME_BUCKET, 1]], also: [[BUCKET, 1]], table: true, metal: LEAD_INGOT },
  { out: [CHARGER, 1], in: [[IRON_INGOT, 3], [COPPER_INGOT, 2], [ELECTRUM_WIRE, 4]], table: true, metal: ELECTRUM_WIRE },
  { out: [PULVERIZER, 1], in: [[STAINLESS_INGOT, 4], [ELECTRUM_INGOT, 1], [FLINT, 1], [PIPE, 1], [CHEST, 1]], table: true, metal: ELECTRUM_INGOT },
  { out: [ELECTRIC_LAMP, 1], in: [[[IRON_INGOT, BRONZE_INGOT, COPPER_INGOT], 1], [GLASS, 1], [ELECTRUM_INGOT, 1]], table: true, metal: ELECTRUM_INGOT },
  { out: [PORTABLE_LAMP, 1], in: [[ELECTRIC_LAMP, 1], [BATTERY, 1], [IRON_INGOT, 1]], table: true, metal: ELECTRIC_LAMP },
  { out: [JACKHAMMER, 1], in: [[STAINLESS_INGOT, 4], [BATTERY, 1], [ELECTRUM_WIRE, 2]], table: true, metal: ELECTRUM_WIRE },
  { out: [JETPACK, 1], in: [[STAINLESS_INGOT, 4], [BATTERY, 2], [ELECTRUM_WIRE, 4], [LEATHER, 2]], table: true, metal: ELECTRUM_WIRE },
);

// ---------- v22: more electricity, battery gear, automation, nickel ----------
export const GRID_BATTERY = 1210,
  ELECTRIC_MOTOR = 1211,
  SOLAR_PANEL = 1212,
  WIND_TURBINE = 1213,
  POWER_METER = 1214, // 1215 = signalling
  DAYLIGHT_SENSOR = 1216, // 1217 = signalling
  E_SMELTER = 1218, // 1218..1221: + facing
  NICKEL_ORE = 1222,
  CABLE = 1223,
  SPAWNER = 1224,
  PROG_CRAFTER = 1225,
  ITEM_COUNTER = 1226, // 1226..1233: + facing * 2 + 1 while signalling
  TELEPAD = 1234, // 1235 = charged
  QUARRY = 1236; // 1236..1239: + facing
export const ELECTRIC_DRILL = 1035, HOVER_BOOTS = 1036, NV_GOGGLES = 1037, MAGNET_RING = 1038,
  NICKEL_INGOT = 1039, CUPRONICKEL_INGOT = 1040, NICKEL_DUST = 1041;
Object.assign(ELECTRIC_DRAW, { motor: 8, smelter: 8, pad: 6, quarry: 10 });
Object.assign(CHARGE_USE, { drill: 4, hover: 20, goggles: 1, magnet: 2 });
export const SOLAR_POWER = 2; // what a solar panel makes in full sun
export const MOTOR_POWER = 6; // shaft power an electric motor gives with all the electricity it wants
export const STORE_CAP = 2400; // power-seconds a grid battery holds
export const STORE_RATE = 8; // most power a grid battery can take in or give out
export const PAD_CAP = 60; // power-seconds a teleport pad holds
export const PAD_PLAYER = 40, PAD_ITEM = 1; // what sending you, or one thing, takes out of it

// nickel: an ore like the others (with its own tile and dust, as the ore tiles and dust ids in ORES order
// are all taken), and cupronickel, its alloy with copper
ORES.push({ id: NICKEL_ORE, name: 'Nickel Ore', ingot: NICKEL_INGOT, tier: 3, hardness: 3.5, y: [4, 36], chance: 0.03, color: [206, 184, 118], tile: T.NICKEL_ORE, dust: NICKEL_DUST });
block(NICKEL_ORE, { name: 'Nickel Ore', tex: T.NICKEL_ORE, hardness: 3.5, tool: 'pick', needsTool: true, tier: 3 });
ITEMS[NICKEL_INGOT] = { name: 'Nickel Ingot', ingot: true };
ITEMS[CUPRONICKEL_INGOT] = { name: 'Cupronickel Ingot', ingot: true };
ITEMS[NICKEL_DUST] = { name: 'Nickel Dust', dust: ORES[ORES.length - 1] };

const plain = { sound: 'stone', hardness: 2.5, tool: 'pick' };
block(GRID_BATTERY, { ...plain, name: 'Grid Battery', side: T.GRIDBAT_SIDE, top: T.GRIDBAT_TOP, bottom: T.GRIDBAT_TOP, electric: { role: 'store' } });
block(ELECTRIC_MOTOR, {
  ...plain, name: 'Electric Motor', side: T.MOTOR_SIDE, top: T.MOTOR_TOP, bottom: T.MOTOR_TOP,
  kinetic: { part: 'engine', mat: 1, axis: -1, motor: true }, electric: { role: 'use', draw: ELECTRIC_DRAW.motor },
});
block(SOLAR_PANEL, {
  ...plain, name: 'Solar Panel', hardness: 1.5, transparent: true, model: [[0, 0, 0, 16, 5, 16, { top: T.SOLAR_TOP, side: T.IRON, bottom: T.IRON }]],
  boxes: [[0, 0, 0, 16, 5, 16]], electric: { role: 'gen', solar: true },
});
block(WIND_TURBINE, {
  ...plain, name: 'Wind Turbine', hardness: 2, transparent: true, electric: { role: 'gen', wind: true },
  model: [[7, 0, 7, 9, 10, 9, T.IRON], [6, 9, 6, 10, 13, 12, T.IRON], [7.5, 10.5, 4.5, 8.5, 11.5, 6, T.IRON],
    [7, 11.5, 4, 9, 16, 4.5, T.TURBINE], [7, 6, 4, 9, 10.5, 4.5, T.TURBINE], [1, 10, 4, 7.5, 12, 4.5, T.TURBINE], [8.5, 10, 4, 15, 12, 4.5, T.TURBINE]],
});
for (let k = 0; k < 2; k++) {
  block(POWER_METER + k, {
    ...plain, name: 'Power Meter', hardness: 1.5, side: k ? T.METER_FACE_ON : T.METER_FACE, top: T.IRON, bottom: T.IRON,
    electric: { role: 'meter' }, sensor: 'meter', switch: 'meter', on: !!k, flip: POWER_METER + 1 - k, light: k ? 4 : 0,
    variantOf: k ? POWER_METER : 0, drop: POWER_METER,
  });
  block(DAYLIGHT_SENSOR + k, {
    ...plain, name: 'Daylight Sensor', sound: 'glass', hardness: 1, transparent: true,
    model: [[0, 0, 0, 16, 6, 16, { top: k ? T.DAYSENSE_TOP_ON : T.DAYSENSE_TOP, side: T.PLANKS, bottom: T.PLANKS }]], boxes: [[0, 0, 0, 16, 6, 16]],
    sensor: 'daylight', switch: 'daylight', on: !!k, flip: DAYLIGHT_SENSOR + 1 - k, light: k ? 3 : 0,
    variantOf: k ? DAYLIGHT_SENSOR : 0, drop: DAYLIGHT_SENSOR,
  });
}
for (let f = 0; f < 4; f++) {
  block(E_SMELTER + f, {
    name: 'Electric Smelter', station: 'esmelter', side: T.ESMELT_SIDE, top: T.STAINLESS, bottom: T.STAINLESS, front: T.ESMELT_FRONT,
    facing: f, hardness: 3, tool: 'pick', variantOf: f ? E_SMELTER : 0, drop: E_SMELTER, stationBase: E_SMELTER,
    electric: { role: 'use', draw: ELECTRIC_DRAW.smelter, speed: 2 },
  });
  block(QUARRY + f, {
    name: 'Quarry', side: T.QUARRY_SIDE, top: T.STAINLESS, bottom: T.STAINLESS, front: T.QUARRY_FRONT, facing: f, hardness: 3, tool: 'pick',
    variantOf: f ? QUARRY : 0, drop: QUARRY, quarry: true, electric: { role: 'use', draw: ELECTRIC_DRAW.quarry, speed: 1 },
  });
  for (let k = 0; k < 2; k++) {
    block(ITEM_COUNTER + f * 2 + k, {
      ...plain, name: 'Item Counter', hardness: 1.5, side: k ? T.COUNTER_FRONT_ON : T.COUNTER_FRONT, top: T.IRON, bottom: T.IRON, facing: f,
      counter: true, sensor: 'counter', switch: 'counter', on: !!k, flip: ITEM_COUNTER + f * 2 + 1 - k, light: k ? 4 : 0,
      variantOf: f || k ? ITEM_COUNTER : 0, drop: ITEM_COUNTER,
    });
  }
}
// cupronickel cable: carries electricity only (no signals), straight on in any direction, up walls and across ceilings
block(CABLE, {
  name: 'Cupronickel Cable', shape: 'cable', sound: 'stone', hardness: 0.3, transparent: true, solid: false,
  model: [[6, 6, 0, 10, 10, 16, T.CABLE]], electric: { role: 'cable' },
});
block(SPAWNER, {
  name: 'Monster Spawner', sound: 'stone', hardness: 5, tool: 'pick', needsTool: true, tier: 5, tex: T.SPAWNER, transparent: true, light: 3, spawner: true,
});
block(PROG_CRAFTER, {
  name: 'Programmable Crafter', station: 'pcrafter', hardness: 2.5, tool: 'axe', sound: 'wood', top: T.PCRAFT_TOP, bottom: T.PLANKS, side: T.PCRAFT_SIDE,
});
for (let k = 0; k < 2; k++) {
  block(TELEPAD + k, {
    ...plain, name: 'Teleport Pad', hardness: 2, transparent: true, light: k ? 8 : 2, pad: true,
    model: [[0, 0, 0, 16, 2, 16, { top: k ? T.TELEPAD_ON : T.TELEPAD, side: T.STAINLESS, bottom: T.STAINLESS }]], boxes: [[0, 0, 0, 16, 2, 16]],
    variantOf: k ? TELEPAD : 0, drop: TELEPAD, electric: { role: 'use', draw: ELECTRIC_DRAW.pad },
  });
}

// battery gear
ITEMS[ELECTRIC_DRILL] = { name: 'Electric Drill', stack: 1, charge: 2000, drill: true, tool: { type: 'pick', speed: 10, tier: 5, damage: 4 } };
ITEMS[HOVER_BOOTS] = { name: 'Hover Boots', stack: 1, charge: 1000, armour: { piece: 3, points: 1, mat: 'hover' } };
ITEMS[NV_GOGGLES] = { name: 'Night-Vision Goggles', stack: 1, charge: 1500, armour: { piece: 0, points: 1, mat: 'goggles' } };
ITEMS[MAGNET_RING] = { name: 'Magnet Ring', stack: 1, charge: 1000, magnet: true };
ELECTRIC_ITEMS.push(ELECTRIC_DRILL, HOVER_BOOTS, NV_GOGGLES, MAGNET_RING);

RECIPES.push(
  { out: [GRID_BATTERY, 1], in: [[BATTERY, 4], [LEAD_INGOT, 4], [ELECTRUM_WIRE, 2]], table: true, metal: BATTERY },
  { out: [ELECTRIC_MOTOR, 1], in: [[IRON_INGOT, 3], [COPPER_INGOT, 4], [ELECTRUM_WIRE, 2], [kineticId('gear', 1), 1]], table: true, metal: ELECTRUM_WIRE },
  { out: [SOLAR_PANEL, 1], in: [[GLASS, 3], [SILVER_INGOT, 1], [IRON_INGOT, 2], [ELECTRUM_WIRE, 2]], table: true, metal: ELECTRUM_WIRE },
  { out: [WIND_TURBINE, 1], in: [[GENERATOR, 1], [ALUMINIUM_INGOT, 3], [IRON_INGOT, 2]], table: true, metal: GENERATOR },
  { out: [POWER_METER, 1], in: [[COPPER_INGOT, 2], [GLASS, 1], [ELECTRUM_WIRE, 1]], table: true, metal: ELECTRUM_WIRE },
  { out: [DAYLIGHT_SENSOR, 1], in: [[GLASS, 3], [COPPER_INGOT, 2], [WIRE, 1]], table: true, metal: COPPER_INGOT },
  { out: [E_SMELTER, 1], in: [[SMELTER, 1], [STAINLESS_INGOT, 4], [ELECTRUM_WIRE, 4]], table: true, metal: ELECTRUM_WIRE },
  { out: [CABLE, 16], in: [[CUPRONICKEL_INGOT, 1], [WOOL, 1]], table: true, metal: CUPRONICKEL_INGOT },
  { out: [PROG_CRAFTER, 1], in: [[AUTO_CRAFTER, 1], [GOLD_INGOT, 1], [WIRE, 2]], table: true, metal: AUTO_CRAFTER },
  { out: [ITEM_COUNTER, 1], in: [[HOPPER, 1], [COPPER_INGOT, 3], [WIRE, 1]], table: true, metal: COPPER_INGOT },
  { out: [TELEPAD, 2], in: [[CRYSTAL_SHARD, 4], [ELECTRUM_INGOT, 4], [CUPRONICKEL_INGOT, 4], [GOLD_INGOT, 2]], table: true, metal: CUPRONICKEL_INGOT },
  { out: [QUARRY, 1], in: [[STAINLESS_INGOT, 6], [DRILL_BIT, 1], [CHEST, 1], [CUPRONICKEL_INGOT, 4]], table: true, metal: CUPRONICKEL_INGOT },
  { out: [ELECTRIC_DRILL, 1], in: [[JACKHAMMER, 1], [DRILL_BIT, 1], [CUPRONICKEL_INGOT, 2]], table: true, metal: JACKHAMMER },
  { out: [HOVER_BOOTS, 1], in: [[BATTERY, 1], [LEATHER, 4], [ALUMINIUM_INGOT, 2], [ELECTRUM_WIRE, 2]], table: true, metal: BATTERY },
  { out: [NV_GOGGLES, 1], in: [[BATTERY, 1], [GLASS, 2], [LEATHER, 2], [CRYSTAL_SHARD, 1]], table: true, metal: BATTERY },
  { out: [MAGNET_RING, 1], in: [[BATTERY, 1], [NICKEL_INGOT, 2], [IRON_INGOT, 2]], table: true, metal: NICKEL_INGOT },
);

// ---------- v23: geothermal power, wireless chargers, electric rails, lifts, uranium and reactors, gear ----------
// A geothermal generator makes GEO_POWER for each face it has against lava. A wireless charger tops up the
// battery things you carry while you're within WIRELESS_REACH of it. An electric rail is a powered rail run
// off the grid instead of a shaft. A lift carries you up (jump) or down (sneak) to the next lift in the same
// column. A reactor burns fuel rods (REACTOR_POWER each) and heats up as it does; water touching it cools
// it, and a signal pushes its control rods in to stop it. If it gets to MELTDOWN heat, it blows up.
export const GEOTHERMAL = 1240,
  WIRELESS_CHARGER = 1241,
  ELECTRIC_RAIL = 1242, // 1243 = along x
  LIFT = 1244,
  URANIUM_ORE = 1245,
  REACTOR = 1246; // 1247 = running hot
export const CHAINSAW = 1042, SAWDUST = 1043, BOOK = 1044, BACKPACK = 1045, BIG_BACKPACK = 1046, HUGE_BACKPACK = 1047,
  SPANNER = 1048, GRAPPLE = 1049, URANIUM_INGOT = 1050, URANIUM_DUST = 1051, FUEL_ROD = 1052;
Object.assign(ELECTRIC_DRAW, { wireless: 6, rail: 2, lift: 4 });
Object.assign(CHARGE_USE, { chainsaw: 3 });
export const GEO_POWER = 2; // for each face of a geothermal generator against lava
export const WIRELESS_REACH = 8;
export const LIFT_REACH = 48; // how far up or down a lift looks for the next one
export const REACTOR_POWER = 12; // for each fuel rod burning in a reactor
export const ROD_LIFE = 600; // seconds a fuel rod burns
export const REACTOR_HEAT = 1.5; // heat a second from each burning rod
export const REACTOR_COOL = 0.5, WATER_COOL = 1.2; // heat a second lost by itself, and to each face against water
export const REACTOR_HOT = 70, MELTDOWN = 100;

ORES.push({ id: URANIUM_ORE, name: 'Uranium Ore', ingot: URANIUM_INGOT, tier: 5, hardness: 5, y: [1, 14], chance: 0.02, color: [126, 214, 72], tile: T.URANIUM_ORE, dust: URANIUM_DUST, burn: 8 });
block(URANIUM_ORE, { name: 'Uranium Ore', tex: T.URANIUM_ORE, hardness: 5, tool: 'pick', needsTool: true, tier: 5, light: 2 });
ITEMS[URANIUM_INGOT] = { name: 'Uranium Ingot', ingot: true };
ITEMS[URANIUM_DUST] = { name: 'Uranium Dust', dust: ORES[ORES.length - 1] };
ITEMS[FUEL_ROD] = { name: 'Fuel Rod', stack: 1, wearMax: ROD_LIFE };

block(GEOTHERMAL, { ...plain, name: 'Geothermal Generator', hardness: 3, side: T.GEO_SIDE, top: T.GEO_TOP, bottom: T.GEO_TOP, electric: { role: 'gen', geo: true } });
block(WIRELESS_CHARGER, {
  ...plain, name: 'Wireless Charger', side: T.WCHARGE_SIDE, top: T.WCHARGE_TOP, bottom: T.IRON, light: 2,
  electric: { role: 'use', draw: ELECTRIC_DRAW.wireless, wireless: true },
});
for (let k = 0; k < 2; k++) {
  const shape = { ends: k ? [1, 3] : [0, 2], powered: true };
  block(ELECTRIC_RAIL + k, {
    name: 'Electric Rail', sound: 'stone', transparent: true, solid: false, hardness: 0.7, tool: 'pick',
    model: railModel(shape, T.ELECTRUM), rail: { ends: shape.ends, slope: -1, powered: true, electric: true },
    variantOf: k ? ELECTRIC_RAIL : 0, drop: ELECTRIC_RAIL, electric: { role: 'use', draw: ELECTRIC_DRAW.rail },
  });
}
block(LIFT, {
  ...plain, name: 'Lift', side: T.ELEVATOR_SIDE, top: T.ELEVATOR_TOP, bottom: T.IRON, lift: true,
  electric: { role: 'use', draw: ELECTRIC_DRAW.lift },
});
for (let k = 0; k < 2; k++) {
  block(REACTOR + k, {
    ...plain, name: 'Reactor', hardness: 6, side: k ? T.REACTOR_SIDE_HOT : T.REACTOR_SIDE, top: T.REACTOR_TOP, bottom: T.REACTOR_TOP,
    station: 'reactor', reactor: true, blastproof: true, light: k ? 9 : 2, variantOf: k ? REACTOR : 0, drop: REACTOR,
    electric: { role: 'gen', reactor: true },
  });
}

// gear: the chainsaw (a battery axe that brings down a tree and gives sawdust besides), backpacks (hold
// things, and carry them about: tap one to open it), the spanner (turns machines round, and takes them up
// with what's inside them), the grappling hook (pulls you to the block it catches on) and the book (the guide)
ITEMS[CHAINSAW] = { name: 'Chainsaw', stack: 1, charge: 1500, chainsaw: true, tool: { type: 'axe', speed: 14, tier: 5, damage: 5 } };
ITEMS[SAWDUST] = { name: 'Sawdust' };
ITEMS[BOOK] = { name: 'Book', stack: 16, book: true };
ITEMS[BACKPACK] = { name: 'Leather Backpack', stack: 1, backpack: 9 };
ITEMS[BIG_BACKPACK] = { name: 'Iron-Framed Backpack', stack: 1, backpack: 18 };
ITEMS[HUGE_BACKPACK] = { name: 'Stainless Steel Backpack', stack: 1, backpack: 27 };
ITEMS[SPANNER] = { name: 'Spanner', stack: 1, spanner: true };
ITEMS[GRAPPLE] = { name: 'Grappling Hook', stack: 1, wearMax: 120, grapple: true };
ELECTRIC_ITEMS.push(CHAINSAW);
export const isBackpack = (id) => !!ITEMS[id]?.backpack;

RECIPES.push(
  { out: [GEOTHERMAL, 1], in: [[GENERATOR, 1], [OBSIDIAN, 4], [STAINLESS_INGOT, 2], [PIPE, 1]], table: true, metal: GENERATOR },
  { out: [WIRELESS_CHARGER, 1], in: [[CHARGER, 1], [CRYSTAL_SHARD, 2], [CUPRONICKEL_INGOT, 2], [GOLD_INGOT, 1]], table: true, metal: CHARGER },
  { out: [ELECTRIC_RAIL, 6], in: [[POWERED_RAIL, 6], [ELECTRUM_WIRE, 2]], table: true, metal: ELECTRUM_WIRE },
  { out: [LIFT, 1], in: [[STAINLESS_INGOT, 4], [ELECTRIC_MOTOR, 1], [CUPRONICKEL_INGOT, 2], [PRESSURE_PLATE, 1]], table: true, metal: ELECTRIC_MOTOR },
  { out: [FUEL_ROD, 1], in: [[URANIUM_INGOT, 3], [STAINLESS_INGOT, 2]], table: true, metal: URANIUM_INGOT },
  { out: [REACTOR, 1], in: [[STAINLESS_INGOT, 8], [LEAD_INGOT, 8], [TUNGSTEN_INGOT, 2], [GENERATOR, 2], [GLASS, 2]], table: true, metal: TUNGSTEN_INGOT },
  { out: [CHAINSAW, 1], in: [[STAINLESS_INGOT, 3], [BATTERY, 1], [ELECTRUM_WIRE, 2], [IRON_INGOT, 2]], table: true, metal: BATTERY },
  { out: [PAPER, 4], in: [[SAWDUST, 4], [WATER_BUCKET, 1]], also: [[BUCKET, 1]], table: true },
  { out: [BOOK, 1], in: [[PAPER, 6], [HIDE, 1]], table: true },
  { out: [BACKPACK, 1], in: [[LEATHER, 6], [STRING, 2]], table: true },
  { out: [BIG_BACKPACK, 1], in: [[LEATHER, 8], [IRON_INGOT, 4], [STRING, 2]], table: true, metal: IRON_INGOT },
  { out: [HUGE_BACKPACK, 1], in: [[LEATHER, 8], [STAINLESS_INGOT, 4], [HIDE, 2]], table: true, metal: STAINLESS_INGOT },
  { out: [SPANNER, 1], in: [[STEEL_INGOT, 3]], table: true, metal: STEEL_INGOT },
  { out: [GRAPPLE, 1], in: [[IRON_INGOT, 3], [STRING, 8]], table: true, metal: IRON_INGOT },
);

// ---------- v24 A: bookshelves, the journal, compost and fertiliser ----------
// Bookshelves round an enchanting altar (within 2 blocks, on its level or the one above) make enchanting
// cheaper and unlock the enchantments that need learning (see ENCHANTS: shelves). The journal is a book to
// write in. The compost bin rots plant scraps down into fertiliser, which grows a crop or sapling a step.
export const BOOKSHELF = 1260, COMPOST_BIN = 1261;
export const JOURNAL = 1060, FERTILISER = 1061;
block(BOOKSHELF, { name: 'Bookshelf', sound: 'wood', tool: 'axe', hardness: 1.5, side: T.BOOKSHELF, top: T.PLANKS, bottom: T.PLANKS });
block(COMPOST_BIN, { name: 'Compost Bin', sound: 'wood', tool: 'axe', hardness: 1.5, side: T.COMPOST_SIDE, top: T.COMPOST_TOP, bottom: T.PLANKS, station: 'compost' });
ITEMS[JOURNAL] = { name: 'Journal', stack: 1, journal: true };
ITEMS[FERTILISER] = { name: 'Fertiliser', fertiliser: true };
Object.assign(ENCHANTS, {
  lucky: { name: 'Lucky', about: '1 in 3 chance of an extra ore', on: (id) => toolType(id) === 'pick', cost: [[CRYSTAL_SHARD, 4], [BOOK, 2]], shelves: 4 },
  mending: { name: 'Mending', about: 'slowly mends itself while you carry it', on: (id) => maxWear(id) > 0 && !chargeCap(id), cost: [[CRYSTAL_SHARD, 6], [BOOK, 3], [GOLD_INGOT, 1]], shelves: 8 },
  feather: { name: 'Feather Fall', about: 'halves fall damage', on: (id) => ITEMS[id]?.armour?.piece === 3, cost: [[CRYSTAL_SHARD, 4], [BOOK, 2], [FEATHER, 4]], shelves: 12 },
});
export const SHELF_DISCOUNT = 5; // one crystal shard off for every this many bookshelves (up to half the shards)
RECIPES.push(
  { out: [BOOKSHELF, 1], in: [[PLANKS, 6], [BOOK, 3]], table: true },
  { out: [JOURNAL, 1], in: [[BOOK, 1], [FEATHER, 1], [COAL_DUST, 1]], table: true },
  { out: [COMPOST_BIN, 1], in: [[PLANKS, 7]], table: true },
);

// ---------- v24 B: spent fuel, radiation, the lead-lined chest, the hazmat suit and the centrifuge ----------
// A fuel rod that burns out in a reactor leaves a spent rod: nuclear waste. Spent rods give off radiation that
// makes you ill (see main.js) unless they're shut away in a lead-lined chest, or you're in a full hazmat suit.
// The centrifuge enriches uranium for rods that burn twice as long, and slowly reprocesses spent rods.
export const LEAD_CHEST = 1270, // 1270..1273: + facing
  CENTRIFUGE = 1263;
export const SPENT_ROD = 1062, ENRICHED_URANIUM = 1063, ENRICHED_ROD = 1064, HAZMAT = 1065; // 1065..1068: + piece
export const hazmatId = (piece) => HAZMAT + piece;
export const RADIATION_REACH = 6; // how far spent rods' radiation carries
ITEMS[FUEL_ROD].fuelRod = true;
ITEMS[SPENT_ROD] = { name: 'Spent Fuel Rod', stack: 1, radioactive: 1 };
ITEMS[ENRICHED_URANIUM] = { name: 'Enriched Uranium' };
ITEMS[ENRICHED_ROD] = { name: 'Enriched Fuel Rod', stack: 1, wearMax: ROD_LIFE * 2, fuelRod: true };
export const isFuelRod = (id) => !!ITEMS[id]?.fuelRod;
['Hood', 'Suit', 'Trousers', 'Boots'].forEach((n, i) => {
  ITEMS[hazmatId(i)] = { name: `Hazmat ${n}`, stack: 1, armour: { piece: i, points: [1, 2, 2, 1][i], mat: 'hazmat' }, wearMax: 300, repair: LEAD_INGOT };
});
Object.assign(ELECTRIC_DRAW, { centrifuge: 10, tesla: 10, fence: 1, freezer: 6, arc: 14 });
for (let f = 0; f < 4; f++) {
  block(LEAD_CHEST + f, {
    name: 'Lead-Lined Chest', station: 'leadchest', side: T.LEAD_CHEST_SIDE, top: T.LEAD_CHEST_TOP, bottom: T.LEAD_CHEST_TOP, front: T.LEAD_CHEST_FRONT,
    facing: f, sound: 'stone', hardness: 3, tool: 'pick', variantOf: f ? LEAD_CHEST : 0, drop: LEAD_CHEST, stationBase: LEAD_CHEST,
  });
}
block(CENTRIFUGE, {
  ...plain, name: 'Centrifuge', hardness: 3, side: T.CENTRIFUGE_SIDE, top: T.CENTRIFUGE_TOP, bottom: T.STAINLESS, station: 'centrifuge',
  electric: { role: 'use', draw: ELECTRIC_DRAW.centrifuge, speed: 1 },
});

// ---------- v24 C: tesla coil, electric fence, freezer, arc furnace ----------
// The tesla coil zaps night creatures that come within TESLA_REACH. The electric fence is a fence that
// shocks creatures (and you) that touch it. The freezer turns water into ice, and ice into packed ice, which
// cools a reactor better than water does. The arc furnace smelts quickly and makes alloys nothing else can.
export const TESLA_COIL = 1264, ELECTRIC_FENCE = 1265, PACKED_ICE = 1268,
  FREEZER = 1274, // 1274..1277: + facing
  ARC_FURNACE = 1278; // 1278..1281: + facing
export const INVAR_INGOT = 1069;
export const TESLA_REACH = 7, TESLA_DAMAGE = 6;
export const ICE_COOL = 2, PACKED_ICE_COOL = 3; // heat a second carried off by each face of a reactor against ice / packed ice
ITEMS[INVAR_INGOT] = { name: 'Invar Ingot', ingot: true };
block(TESLA_COIL, {
  ...plain, name: 'Tesla Coil', hardness: 3, transparent: true, light: 3, tesla: true,
  model: [[3, 0, 3, 13, 3, 13, { side: T.INVAR, top: T.INVAR, bottom: T.INVAR }], [6, 3, 6, 10, 12, 10, T.TESLA], [4, 12, 4, 12, 16, 12, { side: T.TESLA_TOP, top: T.TESLA_TOP, bottom: T.TESLA_TOP }]],
  boxes: [[3, 0, 3, 13, 16, 13]],
  electric: { role: 'use', draw: ELECTRIC_DRAW.tesla },
});
block(ELECTRIC_FENCE, {
  name: 'Electric Fence', shape: 'fence', sound: 'stone', tool: 'pick', hardness: 2, transparent: true, postTex: T.FENCE_POST, armTex: T.FENCE_WIRE, shock: true,
  model: [[6, 0, 6, 10, 16, 10, T.FENCE_POST]],
  electric: { role: 'use', draw: ELECTRIC_DRAW.fence },
});
block(PACKED_ICE, { name: 'Packed Ice', sound: 'glass', tex: T.PACKED_ICE, hardness: 1, tool: 'pick' });
for (let f = 0; f < 4; f++) {
  block(FREEZER + f, {
    ...plain, name: 'Freezer', station: 'freezer', side: T.FREEZER_SIDE, top: T.FREEZER_SIDE, bottom: T.STAINLESS, front: T.FREEZER_FRONT,
    facing: f, hardness: 3, variantOf: f ? FREEZER : 0, drop: FREEZER, stationBase: FREEZER,
    electric: { role: 'use', draw: ELECTRIC_DRAW.freezer, speed: 1 },
  });
  block(ARC_FURNACE + f, {
    ...plain, name: 'Arc Furnace', station: 'arc', side: T.ARC_SIDE, top: T.ARC_SIDE, bottom: T.FIRE_BRICKS, front: T.ARC_FRONT,
    facing: f, hardness: 4, variantOf: f ? ARC_FURNACE : 0, drop: ARC_FURNACE, stationBase: ARC_FURNACE, light: 4,
    electric: { role: 'use', draw: ELECTRIC_DRAW.arc, speed: 2 },
  });
}

RECIPES.push(
  { out: [LEAD_CHEST, 1], in: [[CHEST, 1], [LEAD_INGOT, 8]], table: true, metal: LEAD_INGOT },
  { out: [hazmatId(0), 1], in: [[LEATHER, 2], [LEAD_INGOT, 2], [GLASS, 1]], table: true, metal: LEAD_INGOT },
  { out: [hazmatId(1), 1], in: [[LEATHER, 4], [LEAD_INGOT, 4], [WOOL, 1]], table: true, metal: LEAD_INGOT },
  { out: [hazmatId(2), 1], in: [[LEATHER, 3], [LEAD_INGOT, 3]], table: true, metal: LEAD_INGOT },
  { out: [hazmatId(3), 1], in: [[LEATHER, 2], [LEAD_INGOT, 2]], table: true, metal: LEAD_INGOT },
  { out: [CENTRIFUGE, 1], in: [[STAINLESS_INGOT, 6], [ELECTRIC_MOTOR, 1], [INVAR_INGOT, 2], [GLASS, 1]], table: true, metal: INVAR_INGOT },
  { out: [ENRICHED_ROD, 1], in: [[ENRICHED_URANIUM, 2], [STAINLESS_INGOT, 2]], table: true, metal: ENRICHED_URANIUM },
  { out: [TESLA_COIL, 1], in: [[INVAR_INGOT, 3], [COPPER_INGOT, 6], [ELECTRUM_WIRE, 4], [CRYSTAL_SHARD, 1]], table: true, metal: INVAR_INGOT },
  { out: [ELECTRIC_FENCE, 6], in: [[INVAR_INGOT, 1], [IRON_INGOT, 2], [ELECTRUM_WIRE, 2]], table: true, metal: INVAR_INGOT },
  { out: [FREEZER, 1], in: [[STAINLESS_INGOT, 4], [ELECTRIC_MOTOR, 1], [PIPE, 2], [ICE, 1]], table: true, metal: ELECTRIC_MOTOR },
  { out: [ARC_FURNACE, 1], in: [[E_SMELTER, 1], [FIRE_BRICK, 6], [TUNGSTEN_INGOT, 2], [ELECTRUM_WIRE, 4]], table: true, metal: E_SMELTER },
);

// ---------- v24 D: rail stations, ziplines, boats and hot-air balloons ----------
// A rail station: a straight rail where carts stop, and wait until it gets a signal (a button beside it, say)
// or you push off. A zipline runs between two posts (tap one, then the other, holding a zipline rope); tap a
// post holding a grappling hook to slide along it to the other. Boats and balloons are in vehicles.js.
export const RAIL_STATION = 1282, // 1282 = along z, 1283 = along x
  ZIP_POST = 1284;
export const BOAT = 1076, BALLOON = 1077, ZIP_LINE = 1078;
export const ZIP_REACH = 40; // the longest zipline
for (let a = 0; a < 2; a++) {
  const ends = a ? [1, 3] : [0, 2];
  block(RAIL_STATION + a, {
    name: 'Rail Station', sound: 'stone', transparent: true, solid: false, hardness: 0.7, tool: 'pick',
    model: [...rotateModel([[2, 0, 1, 14, 0.8, 15, T.RAIL_STOP]], a), ...railModel({ ends })], rail: { ends, slope: -1, powered: false, stop: true },
    variantOf: a ? RAIL_STATION : 0, drop: RAIL_STATION,
  });
}
block(ZIP_POST, {
  name: 'Zipline Post', sound: 'wood', hardness: 2, tool: 'axe', transparent: true, zip: true,
  model: [[6, 0, 6, 10, 16, 10, { side: T.LOG_SIDE, top: T.LOG_TOP, bottom: T.LOG_TOP }], [3, 13, 7, 13, 15, 9, T.IRON], [7, 13, 3, 9, 15, 13, T.IRON]],
  boxes: [[6, 0, 6, 10, 16, 10]],
});
ITEMS[BOAT] = { name: 'Boat', stack: 1, vehicle: 'boat' };
ITEMS[BALLOON] = { name: 'Hot-Air Balloon', stack: 1, vehicle: 'balloon' };
ITEMS[ZIP_LINE] = { name: 'Zipline Rope', stack: 16 };
RECIPES.push(
  { out: [RAIL_STATION, 2], in: [[RAIL, 2], [BRICKS, 1], [WIRE, 1]], table: true, metal: WIRE },
  { out: [ZIP_POST, 2], in: [[LOG, 2], [IRON_INGOT, 1]], table: true, metal: IRON_INGOT },
  { out: [ZIP_LINE, 2], in: [[STRING, 6], [IRON_INGOT, 1]], table: true, metal: IRON_INGOT },
  { out: [BOAT, 1], in: [[PLANKS, 5], [STICK, 2]], table: true },
  { out: [BALLOON, 1], in: [[WOOL, 12], [STRING, 8], [PLANKS, 4], [IRON_INGOT, 2], [LANTERN, 1]], table: true, metal: IRON_INGOT },
);

// ---------- v24 E: volcanoes, ruins, shipwrecks and meteorites ----------
// Volcanoes are cones of basalt with a lava-filled crater, rich in deep ores. Meteorites fall at night (see
// main.js) and leave meteoric iron, which the arc furnace makes into starsteel: the best tools of all.
export const BASALT = 1285, METEORITE = 1286;
export const METEORIC_IRON = 1070, STARSTEEL_INGOT = 1071, STARSTEEL_TOOLS = 1072; // 1072..1075: pick, axe, shovel, sword
export const starsteelTool = (kind) => STARSTEEL_TOOLS + ['pick', 'axe', 'shovel', 'sword'].indexOf(kind);
block(BASALT, { name: 'Basalt', side: T.BASALT, top: T.BASALT_TOP, bottom: T.BASALT_TOP, hardness: 2.5, tool: 'pick', needsTool: true });
block(METEORITE, {
  name: 'Meteorite', tex: T.METEORITE, hardness: 6, tool: 'pick', needsTool: true, tier: 5, light: 3,
  drop: () => [[METEORIC_IRON, 1 + (Math.random() < 0.4 ? 1 : 0)]],
});
ITEMS[METEORIC_IRON] = { name: 'Meteoric Iron' };
ITEMS[STARSTEEL_INGOT] = { name: 'Starsteel Ingot', ingot: true };
['pick', 'axe', 'shovel'].forEach((kind, i) => {
  ITEMS[STARSTEEL_TOOLS + i] = {
    name: `Starsteel ${KIND_NAMES[kind]}`, mat: 'starsteel', wearMax: 3000, repair: STARSTEEL_INGOT,
    tool: { type: kind, speed: 18, tier: 7, damage: KIND_DAMAGE[kind] + 7 },
  };
});
ITEMS[starsteelTool('sword')] = { name: 'Starsteel Sword', mat: 'starsteel', wearMax: 3000, repair: STARSTEEL_INGOT, tool: { type: 'sword', speed: 1, tier: 0, damage: 16 } };
RECIPES.push(
  { out: [starsteelTool('pick'), 1], in: [[STARSTEEL_INGOT, 3], [STICK, 2]], table: true, metal: STARSTEEL_INGOT },
  { out: [starsteelTool('axe'), 1], in: [[STARSTEEL_INGOT, 3], [STICK, 2]], table: true, metal: STARSTEEL_INGOT },
  { out: [starsteelTool('shovel'), 1], in: [[STARSTEEL_INGOT, 1], [STICK, 2]], table: true, metal: STARSTEEL_INGOT },
  { out: [starsteelTool('sword'), 1], in: [[STARSTEEL_INGOT, 2], [STICK, 1]], table: true, metal: STARSTEEL_INGOT },
);

// ---------- v24 F: farm animals ----------
// Hens lay eggs and pigs root up truffles (see mobs.js); a saddle lets you ride a buffalo.
export const EGG = 1079, FRIED_EGG = 1080, SADDLE = 1081, TRUFFLE = 1082;
ITEMS[EGG] = { name: 'Egg', stack: 16 };
ITEMS[FRIED_EGG] = { name: 'Fried Egg', food: 5 };
ITEMS[SADDLE] = { name: 'Saddle', stack: 1 };
ITEMS[TRUFFLE] = { name: 'Truffle', food: 4 };
RECIPES.push(
  { out: [SADDLE, 1], in: [[LEATHER, 3], [STRING, 2], [IRON_INGOT, 1]], table: true, metal: IRON_INGOT },
);

// ---------- v25 A: decoration ----------
// Iron bars (a pane of iron), flower pots (tap one holding a flower, sapling, glowcap or cactus to plant it),
// hanging baskets of ivy, and window boxes. Chairs can be sat on, and shelves and tables show what you put on
// them (see main.js and frames.js).
export const IRON_BARS = 1287, FLOWER_POT = 1288, HANGING_PLANT = 1304, WINDOW_BOX = 1305; // pot: 1288..1296, box: 1305..1308
// what grows in a pot, by variant (0 is an empty pot)
export const POT_PLANTS = [0, POPPY, DANDELION, CORNFLOWER, LAVENDER, DAISY, SAPLING, GLOW_MUSHROOM, CACTUS];
export const potOf = (id) => (id >= FLOWER_POT && id < FLOWER_POT + POT_PLANTS.length ? id - FLOWER_POT : -1);
block(IRON_BARS, {
  name: 'Iron Bars', shape: 'pane', sound: 'stone', hardness: 2, tool: 'pick', transparent: true,
  model: [[0, 0, 7, 16, 16, 9, T.IRON_BARS]], paneTex: T.IRON_BARS,
});
const POT_BOX = [[5, 0, 5, 11, 6, 11, T.POT], [5.6, 5, 5.6, 10.4, 5.6, 10.4, T.DIRT]];
POT_PLANTS.forEach((plant, k) => {
  const tile = plant && BLOCKS[plant].side;
  const grown = !plant ? [] : plant === CACTUS ? [[6.5, 5.6, 6.5, 9.5, 13, 9.5, { side: T.CACTUS_SIDE, top: T.CACTUS_TOP, bottom: T.CACTUS_TOP }]]
    : [[3, 5.6, 3, 13, 15.6, 13, tile, plant === GLOW_MUSHROOM, 'cross']];
  block(FLOWER_POT + k, {
    name: 'Flower Pot', sound: 'stone', transparent: true, solid: false, hardness: 0.3, model: [...POT_BOX, ...grown],
    variantOf: k ? FLOWER_POT : 0, drop: k ? () => [[FLOWER_POT, 1], [plant, 1]] : FLOWER_POT, light: plant === GLOW_MUSHROOM ? 7 : 0,
  });
});
// a basket of ivy, hung from the underside of a block on three cords
block(HANGING_PLANT, {
  name: 'Hanging Basket', sound: 'grass', transparent: true, solid: false, hardness: 0.3,
  model: [
    [4, 6, 4, 12, 9, 12, T.POT], [4.5, 8.6, 4.5, 11.5, 9.1, 11.5, T.DIRT],
    [7.7, 9, 4.3, 8.3, 16, 4.9, T.IRON], [4.3, 9, 11.1, 4.9, 16, 11.7, T.IRON], [11.1, 9, 11.1, 11.7, 16, 11.7, T.IRON],
    [2, 0, 2, 14, 12, 14, T.IVY, false, 'cross'],
  ],
});
// a trough of flowers along the outside of a window sill: it hangs on the face you tap
const BOX_MODEL = [[0, 0, 10, 16, 5, 16, wood], [0.5, 4, 10.5, 15.5, 4.6, 15.5, T.DIRT], [0, 3.5, 10, 16, 11, 16, T.BOX_FLOWERS, false, 'cross']];
for (let f = 0; f < 4; f++) {
  block(WINDOW_BOX + f, { ...furniture, name: 'Window Box', solid: false, model: rotateModel(BOX_MODEL, f), variantOf: f ? WINDOW_BOX : 0, drop: WINDOW_BOX, facing: f });
}
RECIPES.push(
  { out: [IRON_BARS, 16], in: [[IRON_INGOT, 6]], table: true, metal: IRON_INGOT },
  { out: [FLOWER_POT, 1], in: [[BRICK, 3]] },
  { out: [HANGING_PLANT, 1], in: [[FLOWER_POT, 1], [STRING, 2], [IRON_INGOT, 1], [LEAVES, 4]], table: true, metal: IRON_INGOT },
  { out: [WINDOW_BOX, 1], in: [[PLANKS, 3], [DIRT, 1], [[POPPY, DANDELION, CORNFLOWER, LAVENDER, DAISY], 3]], table: true },
);

// ---------- v25 B: fruit trees, the cooking pot and scarecrows ----------
// Apple, cherry and orange trees grow wild in temperate land (and from their saplings). Their leaves blossom in
// spring and fruit in summer and autumn: tap a leaf with fruit on it to pick it. The fruit drops off in winter.
export const FRUIT_SAPLING = 1317, FRUIT_LEAVES = 1320, SCARECROW = 1326, COOK_POT = 1309; // saplings 1317..1319, leaves 1320..1325 (kind * 2 + ripe), scarecrow 1326..1329, pot 1309..1316
export const APPLE = 1083, CHERRIES = 1084, ORANGE_FRUIT = 1085, APPLE_PIE = 1086, CHERRY_PIE = 1087, FRUIT_SALAD = 1088,
  ORANGE_JUICE = 1089, FISH_SOUP = 1090, TRUFFLE_SOUP = 1091, BERRY_JAM = 1092;
export const FRUITS = [
  { key: 'apple', name: 'Apple', item: APPLE },
  { key: 'cherry', name: 'Cherry', item: CHERRIES },
  { key: 'orange', name: 'Orange', item: ORANGE_FRUIT },
];
export const isLeaves = (id) => id === LEAVES || (id >= FRUIT_LEAVES && id < FRUIT_LEAVES + FRUITS.length * 2) || id === COCOA_LEAVES || id === COCOA_LEAVES + 1; // (v33: and cocoa)
export const fruitLeaves = (k, ripe = false) => FRUIT_LEAVES + k * 2 + (ripe ? 1 : 0);
FRUITS.forEach((f, k) => {
  block(FRUIT_SAPLING + k, { ...plant, name: `${f.name} Sapling`, tex: T.FRUIT_SAPLING + k, grows: 'tree' });
  for (const ripe of [false, true]) {
    block(fruitLeaves(k, ripe), {
      name: `${f.name} Leaves`, sound: 'leaves', tex: ripe ? T.FRUIT_RIPE + k : T.FRUIT_LEAVES + k, transparent: true, hardness: 0.3,
      grows: 'fruit', fruit: { kind: k, ripe, bare: fruitLeaves(k), ripeId: fruitLeaves(k, true), item: f.item }, variantOf: ripe ? fruitLeaves(k) : 0, drop: () => [
        [FRUIT_SAPLING + k, Math.random() < 0.08 ? 1 : 0], [STICK, Math.random() < 0.12 ? 1 : 0], [f.item, ripe ? 1 : 0]],
    });
  }
});
ITEMS[APPLE] = { name: 'Apple', food: 4 };
ITEMS[CHERRIES] = { name: 'Cherries', food: 3 };
ITEMS[ORANGE_FRUIT] = { name: 'Orange', food: 4 };
// Cooked in the cooking pot (or mixed by hand): good meals that give you something extra for a while.
ITEMS[APPLE_PIE] = { name: 'Apple Pie', food: 14, meal: ['warm', 300], about: 'warms you through' };
ITEMS[CHERRY_PIE] = { name: 'Cherry Pie', food: 14, meal: ['heal', 8], about: 'heals you' };
ITEMS[FRUIT_SALAD] = { name: 'Fruit Salad', food: 9, meal: ['haste', 120], about: 'dig half as fast again' };
ITEMS[ORANGE_JUICE] = { name: 'Orange Juice', stack: 8, food: 5, meal: ['swift', 180], about: 'run faster', bottle: true };
ITEMS[FISH_SOUP] = { name: 'Fish Soup', food: 10, meal: ['warm', 300], about: 'warms you through' };
ITEMS[TRUFFLE_SOUP] = { name: 'Truffle Soup', food: 12, meal: ['night', 240], about: 'see in the dark' };
ITEMS[BERRY_JAM] = { name: 'Berry Jam', stack: 8, food: 7, meal: ['heal', 5], about: 'heals you', bottle: true };
// the cooking pot: an iron pot on a tripod over a little fire
const potModel = (lit) => [
  [3, 4, 3, 13, 11, 13, T.IRON], [2.5, 10, 2.5, 13.5, 11.5, 13.5, T.IRON], // the pot and its rim
  [1, 0, 1, 2, 12, 2, T.IRON], [14, 0, 1, 15, 12, 2, T.IRON], [7.5, 0, 14, 8.5, 12, 15, T.IRON], // the tripod
  [5, 0, 5, 11, 1.5, 11, T.LOG_SIDE], // the firewood
  ...(lit ? [[6, 1, 6, 10, 4, 10, T.FLAME, true]] : []),
];
for (let k = 0; k < 8; k++) {
  block(COOK_POT + k, {
    name: 'Cooking Pot', station: 'cookpot', sound: 'stone', transparent: true, hardness: 1.5, tool: 'pick', facing: k & 3, lit: k >= 4,
    model: potModel(k >= 4), light: k >= 4 ? 12 : 0, variantOf: k ? COOK_POT : 0, drop: COOK_POT, stationBase: COOK_POT,
  });
}
// a scarecrow: a straw man in a sack mask and a hat, on a post
const SCARECROW_MODEL = [
  [7.2, 0, 7.2, 8.8, 12, 8.8, wood], // the post
  [5, 5, 6.5, 11, 11.5, 9.5, T.HAY], // the body
  [1, 9.5, 7, 15, 11, 9, T.HAY], // the arms
  [5.5, 11.5, 5.5, 10.5, 16, 10.5, { side: T.SACK, top: T.WOOL, bottom: T.WOOL }], // the head
  [4, 16, 4, 12, 16.6, 12, T.LOG_SIDE], [5.5, 16.6, 5.5, 10.5, 19, 10.5, T.LOG_SIDE], // the hat
];
for (let f = 0; f < 4; f++) {
  block(SCARECROW + f, { ...furniture, name: 'Scarecrow', sound: 'grass', solid: false, model: rotateModel(SCARECROW_MODEL, f), variantOf: f ? SCARECROW : 0, drop: SCARECROW, facing: f, scarecrow: true });
}
RECIPES.push(
  { out: [COOK_POT, 1], in: [[IRON_INGOT, 5], [LOG, 1]], table: true, metal: IRON_INGOT },
  { out: [SCARECROW, 1], in: [[STICK, 3], [WHEAT, 6], [WOOL, 1]], table: true },
  { out: [FRUIT_SALAD, 1], in: [[APPLE, 1], [CHERRIES, 1], [ORANGE_FRUIT, 1]] },
  { out: [ORANGE_JUICE, 1], in: [[ORANGE_FRUIT, 3], [GLASS_BOTTLE, 1]] },
);

// ---------- v25 C: lighthouses, maps and snow ----------
// Lighthouses stand on some coasts with a great lamp at the top that sweeps a beam round at night (a lighthouse lamp
// you make does the same). An explorer's map marks the ruins, wrecks, lighthouses, volcanoes and villages you pass;
// a treasure map (found in wrecks and lighthouses) leads to a buried chest. In winter, snow settles on the ground.
export const SNOW_LAYER = 1330, LIGHTHOUSE_LAMP = 1331;
export const EXPLORER_MAP = 1093, TREASURE_MAP = 1094;
block(SNOW_LAYER, { name: 'Snow', sound: 'sand', transparent: true, solid: false, hardness: 0.1, tool: 'shovel', drop: 0, model: [[0, 0, 0, 16, 2, 16, T.SNOW]] });
block(LIGHTHOUSE_LAMP, {
  name: 'Lighthouse Lamp', sound: 'glass', transparent: true, hardness: 1, light: 15,
  model: [[3, 0, 3, 13, 2, 13, T.IRON], [4, 2, 4, 12, 12, 12, T.BEACON, true], [3, 12, 3, 13, 14, 13, T.IRON], [7, 14, 7, 9, 16, 9, T.IRON]],
});
ITEMS[EXPLORER_MAP] = { name: 'Explorer\'s Map', stack: 1, about: 'marks the places you find' };
ITEMS[TREASURE_MAP] = { name: 'Treasure Map', stack: 1, about: 'tap to read: X marks the spot' };
RECIPES.push(
  { out: [EXPLORER_MAP, 1], in: [[MAP, 1], [COMPASS, 1], [GOLD_INGOT, 1]], table: true },
  { out: [LIGHTHOUSE_LAMP, 1], in: [[LANTERN, 1], [GLASS, 4], [GOLD_INGOT, 2]], table: true, metal: GOLD_INGOT },
);

// ---------- v25 D: apiary, beeswax and candles ----------
// An apiary is a bee box you build: it holds more honey than a wild hive, and gives up its comb and wax by hand.
export const APIARY = 1332, // 1332..1337: + honey level 0..5 (5 is full)
  CANDLE_BLOCK = 1338;
export const MAX_APIARY = 5;
export const BEESWAX = 1095;
for (let k = 0; k <= MAX_APIARY; k++) {
  block(APIARY + k, {
    name: 'Apiary', sound: 'wood', top: T.APIARY_TOP, bottom: T.APIARY_TOP, side: T.APIARY_SIDE, front: k === MAX_APIARY ? T.APIARY_FULL : T.APIARY_FRONT,
    hardness: 1, tool: 'axe', variantOf: k ? APIARY : 0, grows: k < MAX_APIARY ? 'honey' : null, hive: k, apiary: true,
    drop: () => [[APIARY, 1], [HONEYCOMB, Math.floor(k / 2)]],
  });
}
block(CANDLE_BLOCK, {
  name: 'Beeswax Candle', sound: 'wood', transparent: true, solid: false, hardness: 0.2, light: 12,
  model: [[6, 0, 6, 10, 7, 10, T.CANDLE], [7.5, 7, 7.5, 8.5, 9, 8.5, T.FLAME, true]],
  boxes: [[6, 0, 6, 10, 9, 10]],
});
ITEMS[BEESWAX] = { name: 'Beeswax', about: 'from honeycomb or an apiary; makes candles' };
RECIPES.push(
  { out: [APIARY, 1], in: [[PLANKS, 8], [HONEYCOMB, 3], [GLASS, 1]], table: true },
  { out: [BEESWAX, 1], in: [[HONEYCOMB, 1]] },
  { out: [CANDLE_BLOCK, 3], in: [[BEESWAX, 2], [STRING, 1]] },
);

// ---------- v25 E: belt crossings, farm controllers, pneumatic tubes, cable cars ----------
// A belt crossing passes whatever a belt brings it straight on across, so two lines of belts can cross.
// A farm controller watches the wheat within FARM_REACH blocks: it signals once half of it is ripe (to set
// harvesters going), and tapping it gives a report on the field.
// Pneumatic tubes whisk things from wherever they're put in (by a belt, hopper or ejector) through the tubes joined
// to them, in any direction, up and down too, to the nearest chest or machine at the other end. Item frames on a
// tube next to a chest make it take only those things.
// A cable car (held, tapping a zipline post) carries you along the line in a little gondola at an even speed,
// uphill as well as down.
export const BELT_CROSSING = 1339, FARM_CONTROLLER = 1340, // 1341 = signalling
  TUBE = 1342;
export const CABLE_CAR = 1096;
export const FARM_REACH = 7;
block(BELT_CROSSING, {
  name: 'Belt Crossing', sound: 'wool', hardness: 0.8, tool: 'axe', transparent: true, crossing: true,
  model: [[0, 0, 0, 16, 4, 16, { top: T.BELT_CROSS, side: T.LOG_SIDE, bottom: T.PLANKS }]], boxes: [[0, 0, 0, 16, 4, 16]],
});
for (let k = 0; k < 2; k++) {
  block(FARM_CONTROLLER + k, {
    name: 'Farm Controller', sound: 'wood', hardness: 1.5, tool: 'axe', side: k ? T.FARM_CTRL_ON : T.FARM_CTRL, top: T.PLANKS, bottom: T.PLANKS,
    sensor: 'farm', switch: 'farm', on: !!k, flip: FARM_CONTROLLER + 1 - k, light: k ? 4 : 0,
    variantOf: k ? FARM_CONTROLLER : 0, drop: FARM_CONTROLLER,
  });
}
block(TUBE, { name: 'Pneumatic Tube', sound: 'glass', hardness: 0.6, transparent: true, tube: true, side: T.TUBE, top: T.TUBE_END, bottom: T.TUBE_END });
ITEMS[CABLE_CAR] = { name: 'Cable Car', stack: 1, about: 'tap a zipline post to ride the line, uphill too' };
RECIPES.push(
  { out: [BELT_CROSSING, 1], in: [[BELT, 2], [IRON_INGOT, 1]], table: true },
  { out: [FARM_CONTROLLER, 1], in: [[COPPER_INGOT, 2], [WIRE, 1], [WHEAT, 4], [PLANKS, 2]], table: true, metal: COPPER_INGOT },
  { out: [TUBE, 6], in: [[GLASS, 4], [COPPER_INGOT, 1]], table: true, metal: COPPER_INGOT },
  { out: [CABLE_CAR, 1], in: [[IRON_INGOT, 4], [GLASS, 2], [PLANKS, 3]], table: true, metal: IRON_INGOT },
);

// ---------- v26 A: market stalls and coins ----------
// A market stall in a village: put things on it and villagers passing by buy them for silver coins, which they
// also take in trade.
export const MARKET_STALL = 1343; // 1343..1346 + facing
export const COIN = 1097;
const STALL_MODEL = [
  [0, 0, 8, 16, 9, 16, T.PLANKS], [0, 9, 7, 16, 10, 16, T.LOG_SIDE], // the counter
  [0.5, 0, 0.5, 2, 15, 2, T.LOG_SIDE], [14, 0, 0.5, 15.5, 15, 2, T.LOG_SIDE], [0.5, 10, 14, 2, 15, 15.5, T.LOG_SIDE], [14, 10, 14, 15.5, 15, 15.5, T.LOG_SIDE],
  [0, 15, 0, 16, 16, 16, T.AWNING], // the striped awning
];
for (let f = 0; f < 4; f++) {
  block(MARKET_STALL + f, {
    name: 'Market Stall', station: 'stall', sound: 'wood', transparent: true, hardness: 1.5, tool: 'axe', facing: f,
    model: rotateModel(STALL_MODEL, f), boxes: [[0, 0, 0, 16, 10, 16]], variantOf: f ? MARKET_STALL : 0, drop: MARKET_STALL, stationBase: MARKET_STALL,
  });
}
ITEMS[COIN] = { name: 'Silver Coin', stack: 99, about: 'villagers pay these at a market stall, and take them in trade' };
RECIPES.push({ out: [MARKET_STALL, 1], in: [[PLANKS, 6], [LOG, 4], [WOOL, 3]], table: true });

// ---------- v26 B: fire ----------
// Lightning can set trees and wooden things alight. Fire spreads to leaves, logs, planks and wool beside it,
// burning them away; rain puts it out.
export const FIRE = 1347;
block(FIRE, { name: 'Fire', sound: 'leaves', tex: T.FIRE, transparent: true, solid: false, shape: 'cross', hardness: 0, light: 13, drop: 0 });
export const isFlammable = (id) => !!id && (isLeaves(id) || id === LOG || id === PLANKS || /(Wool|Log|Planks|Leaves)$/.test(BLOCKS[id]?.name ?? '')) && !BLOCKS[id]?.station;

// ---------- v26 C: more crops ----------
// Carrots and potatoes are planted as they are; pumpkin seeds grow a vine that sets a pumpkin on the ground
// beside it (and goes on cropping); grapes grow up a trellis and fruit again after picking.
// Planting the same crop in the same soil over and over tires it out (it grows slower): rotate crops, let
// the ground rest a season, or fertilise it (see world.js).
// (baked potato and pumpkin pie were 1100 and 1102, which are also copper wire's and the inverter's ids: moved)
export const CARROT = 1098, POTATO = 1099, BAKED_POTATO = 392, PUMPKIN_SEEDS = 1101, PUMPKIN_PIE = 393, GRAPES = 1103;
export const CARROT_CROP = 1348, POTATO_CROP = 1352, PUMPKIN_STEM = 1356, PUMPKIN = 1359, JACK_O_LANTERN = 1360, TRELLIS = 1361, GRAPE_VINE = 1362;
// carrots and potatoes: 4 stages (3 is ripe)
for (const [base, kind, seed, tex, extra] of [[CARROT_CROP, 'carrot', CARROT, T.CARROT_0, 0], [POTATO_CROP, 'potato', POTATO, T.POTATO_0, 1]]) {
  for (let k = 0; k < 4; k++) {
    block(base + k, {
      ...plant, name: kind === 'carrot' ? 'Carrots' : 'Potatoes', tex: tex + k, variantOf: seed, grows: k < 3 ? base + k + 1 : null,
      crop: { kind, stage: k, ripe: k === 3, seed, first: base },
      drop: k < 3 ? () => [[seed, 1]] : () => [[seed, 2 + Math.floor(Math.random() * 2) + extra]],
    });
  }
}
// pumpkin vine: 3 stages; the last sets pumpkins beside it
for (let k = 0; k < 3; k++) {
  block(PUMPKIN_STEM + k, {
    ...plant, name: 'Pumpkin Vine', tex: T.STEM_0 + k, variantOf: PUMPKIN_SEEDS, grows: k < 2 ? PUMPKIN_STEM + k + 1 : 'pumpkin',
    crop: { kind: 'pumpkin', stage: k, ripe: false, seed: PUMPKIN_SEEDS, first: PUMPKIN_STEM }, drop: () => [[PUMPKIN_SEEDS, 1]],
  });
}
block(PUMPKIN, { name: 'Pumpkin', sound: 'wood', top: T.PUMPKIN_TOP, bottom: T.PUMPKIN_TOP, side: T.PUMPKIN_SIDE, hardness: 1, tool: 'axe' });
block(JACK_O_LANTERN, { name: "Jack-o'-Lantern", sound: 'wood', top: T.PUMPKIN_TOP, bottom: T.PUMPKIN_TOP, side: T.JACK_FACE, hardness: 1, tool: 'axe', light: 14, tint: 4 });
// grapes: a trellis, then a vine on it in 3 stages (2 is in fruit); picking takes it back to 1
block(TRELLIS, { name: 'Trellis', sound: 'wood', tex: T.TRELLIS, transparent: true, solid: false, shape: 'cross', hardness: 0.3, tool: 'axe' });
for (let k = 0; k < 3; k++) {
  block(GRAPE_VINE + k, {
    ...plant, name: 'Grape Vine', tex: T.VINE_0 + k, variantOf: TRELLIS, grows: k < 2 ? GRAPE_VINE + k + 1 : null, hardness: 0.3,
    crop: { kind: 'grape', stage: k, ripe: k === 2, seed: GRAPES, first: GRAPE_VINE, after: GRAPE_VINE + 1 },
    drop: k === 2 ? () => [[TRELLIS, 1], [GRAPES, 3 + Math.floor(Math.random() * 2)]] : () => [[TRELLIS, 1]],
  });
}
export const isCrop = (id) => !!BLOCKS[id]?.crop;
ITEMS[CARROT] = { name: 'Carrot', food: 3, places: CARROT_CROP };
ITEMS[POTATO] = { name: 'Potato', food: 1, places: POTATO_CROP };
ITEMS[BAKED_POTATO] = { name: 'Baked Potato', food: 6 };
ITEMS[PUMPKIN_SEEDS] = { name: 'Pumpkin Seeds', places: PUMPKIN_STEM };
ITEMS[PUMPKIN_PIE] = { name: 'Pumpkin Pie', food: 8 };
ITEMS[GRAPES] = { name: 'Grapes', food: 2, about: 'plant them on a trellis to grow a vine' };
RECIPES.push(
  { out: [PUMPKIN_SEEDS, 4], in: [[PUMPKIN, 1]] },
  { out: [JACK_O_LANTERN, 1], in: [[PUMPKIN, 1], [TORCH, 1]] },
  { out: [TRELLIS, 2], in: [[STICK, 6]] },
);

// ---------- v26 D: the winery and the dairy ----------
// A wine press squeezes grapes into juice, and a cheese press turns milk into curds. Both need no fuel or
// power. Laid down in an oak barrel they age, day by day: juice into wine and then fine wine; curds into
// cheese and then aged cheese. The longer they're kept, the better (and the more villagers pay).
export const WINE_PRESS = 1365, CHEESE_PRESS = 1366, BARREL = 1367;
export const GRAPE_JUICE = 1104, WINE = 1105, FINE_WINE = 1106, CURDS = 1107, CHEESE = 1108, AGED_CHEESE = 1109;
const pressModel = (top) => [
  [2, 0, 2, 14, 6, 14, T.PLANKS], [3, 5.5, 3, 13, 6.2, 13, top], // the tub, and what's in it
  [0.5, 0, 7, 2, 16, 9, T.LOG_SIDE], [14, 0, 7, 15.5, 16, 9, T.LOG_SIDE], [0.5, 14, 6.5, 15.5, 16, 9.5, T.LOG_SIDE], // the frame
  [7.25, 8, 7.25, 8.75, 14, 8.75, T.IRON], [4, 7, 4, 12, 8.5, 12, T.PLANKS], // the screw and its plate
];
block(WINE_PRESS, { name: 'Wine Press', station: 'winepress', sound: 'wood', transparent: true, hardness: 1.5, tool: 'axe', model: pressModel(T.VINE_0 + 2), boxes: [[2, 0, 2, 14, 9, 14]] });
block(CHEESE_PRESS, { name: 'Cheese Press', station: 'cheesepress', sound: 'wood', transparent: true, hardness: 1.5, tool: 'axe', model: pressModel(T.CHEESE), boxes: [[2, 0, 2, 14, 9, 14]] });
block(BARREL, { name: 'Oak Barrel', station: 'barrel', sound: 'wood', side: T.BARREL_SIDE, top: T.BARREL_TOP, bottom: T.BARREL_TOP, hardness: 1.5, tool: 'axe' });
ITEMS[GRAPE_JUICE] = { name: 'Grape Juice', stack: 8, food: 3, bottle: true, about: 'lay it down in a barrel to make wine' };
ITEMS[WINE] = { name: 'Wine', stack: 8, food: 4, meal: ['warm', 200], about: 'feel warm inside', bottle: true };
ITEMS[FINE_WINE] = { name: 'Fine Wine', stack: 8, food: 6, meal: ['heal', 8], about: 'feel wonderful', bottle: true };
ITEMS[CURDS] = { name: 'Curds', food: 2, about: 'age them in a barrel to make cheese' };
ITEMS[CHEESE] = { name: 'Cheese', food: 6 };
ITEMS[AGED_CHEESE] = { name: 'Aged Cheese', food: 10, meal: ['fed', 400], about: 'feel well fed for ages' };
// what ages into what in a barrel, and how many days it takes
export const AGING = { [GRAPE_JUICE]: [WINE, 1], [WINE]: [FINE_WINE, 3], [CURDS]: [CHEESE, 1], [CHEESE]: [AGED_CHEESE, 3] };
RECIPES.push(
  { out: [WINE_PRESS, 1], in: [[PLANKS, 6], [LOG, 3], [IRON_INGOT, 1]], table: true, metal: IRON_INGOT },
  { out: [CHEESE_PRESS, 1], in: [[PLANKS, 6], [LOG, 3], [IRON_INGOT, 1], [STRING, 1]], table: true, metal: IRON_INGOT },
  { out: [BARREL, 1], in: [[PLANKS, 6], [IRON_INGOT, 1]], table: true, metal: IRON_INGOT },
);

// ---------- v26 E: sunken temples, sky islands and diving gear ----------
// Temples of sea brick stand on the deep sea bed, and little islands float high over the lowlands. Each keeps
// its treasure behind a vault gate that only its puzzle opens (see main.js). A diving helmet makes your breath
// last five times as long, and an air pump keeps it topped up while you're near; flippers make you swim fast.
export const SEA_BRICK = 1368, SEA_LANTERN = 1369, VAULT_GATE = 1370, SKY_STONE = 1371, AIR_PUMP = 1372;
export const DIVING_HELMET = 394, FLIPPERS = 1111, PEARL = 1112; // (the helmet was 1110, the delay block's id)
block(SEA_BRICK, { name: 'Sea Bricks', tex: T.SEA_BRICK, hardness: 2.5, tool: 'pick', needsTool: true });
block(SEA_LANTERN, { name: 'Sea Lantern', tex: T.SEA_LANTERN, hardness: 1, tool: 'pick', light: 15, sound: 'glass' });
block(VAULT_GATE, { name: 'Vault Gate', tex: T.VAULT, hardness: Infinity, blastproof: true, drop: 0 });
block(SKY_STONE, { name: 'Sky Stone', tex: T.SKY_STONE, hardness: 2, tool: 'pick', needsTool: true });
block(AIR_PUMP, { name: 'Air Pump', tex: T.AIR_PUMP, side: T.AIR_PUMP, top: T.IRON, bottom: T.IRON, hardness: 2, tool: 'pick', sound: 'metal' });
ITEMS[DIVING_HELMET] = { name: 'Diving Helmet', stack: 1, armour: { piece: 0, points: 2 }, wearMax: 400, repair: COPPER_INGOT, guards: 'water', about: 'hold your breath five times as long; an air pump nearby keeps you breathing' };
ITEMS[FLIPPERS] = { name: 'Flippers', stack: 1, armour: { piece: 3, points: 1 }, wearMax: 400, repair: LEATHER, guards: 'swim', about: 'swim much faster' };
ITEMS[PEARL] = { name: 'Pearl', stack: 32, about: 'villagers pay well for these' };
RECIPES.push(
  { out: [DIVING_HELMET, 1], in: [[COPPER_INGOT, 5], [GLASS, 2]], table: true, metal: COPPER_INGOT },
  { out: [FLIPPERS, 1], in: [[LEATHER, 4], [SLIME_FUEL, 1]], table: true },
  { out: [AIR_PUMP, 1], in: [[IRON_INGOT, 4], [COPPER_INGOT, 2], [LEATHER, 2], [PIPE, 1]], table: true, metal: IRON_INGOT },
  { out: [SEA_LANTERN, 1], in: [[GLASS, 2], [PEARL, 1]], table: true },
);

// ---------- v26 F: radios, the sorting machine, locomotives ----------
// A radio transmitter sends the signal it's given on its channel (1-8: tap it to change); every receiver on the
// same channel, anywhere in the loaded world, gives a signal. A sorting machine sends what goes into it out
// along up to six pneumatic tubes: each tube with item frames hung on it takes what they show, and a tube with
// none takes everything else. A locomotive burns coal and pulls the carts behind it along the rails, stopping
// a moment at each rail station.
export const RADIO_TX = 1373, RADIO_RX = 1374, SORTING_MACHINE = 1376; // 1375 = a receiver that's signalling
export const LOCOMOTIVE = 1113;
const radioModel = (lamp) => [
  [2, 0, 2, 14, 8, 14, { side: lamp, top: T.IRON, bottom: T.IRON }],
  [7.5, 8, 7.5, 8.5, 16, 8.5, T.IRON], [6.5, 15, 6.5, 9.5, 16, 9.5, T.IRON], // the aerial
];
block(RADIO_TX, { name: 'Radio Transmitter', sound: 'metal', hardness: 1.5, tool: 'pick', transparent: true, sensor: 'radiotx', model: radioModel(T.RADIO), boxes: [[2, 0, 2, 14, 8, 14]] });
for (let k = 0; k < 2; k++) {
  block(RADIO_RX + k, {
    name: 'Radio Receiver', sound: 'metal', hardness: 1.5, tool: 'pick', transparent: true, sensor: 'radio', switch: 'radio', on: !!k, flip: RADIO_RX + 1 - k,
    light: k ? 5 : 0, model: radioModel(k ? T.RADIO_ON : T.RADIO), boxes: [[2, 0, 2, 14, 8, 14]], variantOf: k ? RADIO_RX : 0, drop: RADIO_RX,
  });
}
block(SORTING_MACHINE, { name: 'Sorting Machine', sound: 'metal', hardness: 2, tool: 'pick', side: T.SORTBOX, top: T.SORTBOX_TOP, bottom: T.SORTBOX_TOP, sortbox: true });
ITEMS[LOCOMOTIVE] = { name: 'Locomotive', stack: 1, about: 'put it on a rail and tap it with coal: it pulls the carts behind it' };
RECIPES.push(
  { out: [RADIO_TX, 1], in: [[COPPER_INGOT, 3], [WIRE, 2], [GLASS, 1]], table: true, metal: COPPER_INGOT },
  { out: [RADIO_RX, 1], in: [[COPPER_INGOT, 3], [WIRE, 2], [GLASS, 1]], table: true, metal: COPPER_INGOT },
  { out: [SORTING_MACHINE, 1], in: [[TUBE, 3], [IRON_INGOT, 3], [ITEM_FRAME, 1]], table: true, metal: IRON_INGOT },
  { out: [LOCOMOTIVE, 1], in: [[MINECART, 1], [IRON_INGOT, 6], [STEAM_ENGINE, 1]], table: true, metal: IRON_INGOT },
);

// v26 G: a fireplace burns logs, planks, sticks or coal (tap it with them) and warms and lights the room.
// Build a chimney straight up from it and the smoke goes out of the top; without one it fills the room.
export const FIREPLACE = 1377, CHIMNEY = 1385; // 1377..1384: + facing, + 4 when it's burning
export const HEARTH_FUEL = { [LOG]: 60, [PLANKS]: 30, [STICK]: 10, [COAL]: 240, [CHARCOAL]: 240 }; // seconds of fire
for (let k = 0; k < 8; k++) {
  const on = k >= 4;
  block(FIREPLACE + k, {
    name: 'Fireplace', sound: 'stone', hardness: 2, tool: 'pick', side: T.BRICKS, top: T.BRICKS, bottom: T.BRICKS,
    front: on ? T.HEARTH_LIT : T.HEARTH, facing: k & 3, hearth: true, lit: on, light: on ? 14 : 0,
    variantOf: k ? FIREPLACE : 0, drop: FIREPLACE,
  });
}
block(CHIMNEY, { name: 'Chimney', sound: 'stone', hardness: 2, tool: 'pick', side: T.BRICKS, top: T.CHIMNEY_TOP, bottom: T.CHIMNEY_TOP, chimney: true });
RECIPES.push(
  { out: [FIREPLACE, 1], in: [[BRICKS, 5], [COBBLE, 2], [IRON_INGOT, 1]], table: true },
  { out: [CHIMNEY, 2], in: [[BRICKS, 3]], table: true },
);

// ---------- v27 A: stables ----------
// A stable: a wooden manger full of hay. Tap it to call your horses home; a horse you get off near one goes in
// and waits there.
export const STABLE = 1386;
block(STABLE, {
  name: 'Stable', sound: 'wood', hardness: 1.5, tool: 'axe', transparent: true, stable: true,
  model: [[0, 0, 0, 16, 11, 16, { side: T.STABLE_SIDE, top: T.HAY, bottom: T.PLANKS }], [0, 11, 0, 2, 16, 2, T.LOG_SIDE], [14, 11, 0, 16, 16, 2, T.LOG_SIDE], [0, 11, 14, 2, 16, 16, T.LOG_SIDE], [14, 11, 14, 16, 16, 16, T.LOG_SIDE]],
  boxes: [[0, 0, 0, 16, 11, 16]],
});
RECIPES.push({ out: [STABLE, 1], in: [[PLANKS, 6], [LOG, 2], [WHEAT, 6]], table: true });

// ---------- v27 B: snowmen and fireworks ----------
// A snowman (it melts away out of winter, except in the tundra), and fireworks: tap with one in hand to send
// it up. Villages put on fireworks of their own on festival nights.
export const SNOWMAN = 1387; // 1387..1390: + facing
export const FIREWORK = 1114;
const SNOWMAN_MODEL = [
  [3, 0, 3, 13, 9, 13, T.SNOW], [4.5, 9, 4.5, 11.5, 15.5, 11.5, T.SNOW], // body and head
  [4, 1, 13, 12, 8.5, 13.3, T.SNOWMAN_FRONT], [5, 10, 11.5, 11, 15, 11.8, T.SNOWMAN_FRONT], // buttons, and the face
  [7.5, 12, 11.8, 8.5, 13, 14.2, T.PUMPKIN_SIDE], // a carrot nose
  [0, 6, 7.5, 3, 7, 8.5, T.LOG_SIDE], [13, 6, 7.5, 16, 7, 8.5, T.LOG_SIDE], // stick arms
];
for (let f = 0; f < 4; f++) {
  block(SNOWMAN + f, {
    name: 'Snowman', sound: 'grass', hardness: 0.4, tool: 'shovel', transparent: true, snowman: true, facing: f,
    model: rotateModel(SNOWMAN_MODEL, f), boxes: [[3, 0, 3, 13, 15.5, 13]], variantOf: f ? SNOWMAN : 0, drop: SNOWMAN,
  });
}
ITEMS[FIREWORK] = { name: 'Firework', about: 'tap to send it up' };
RECIPES.push(
  { out: [SNOWMAN, 1], in: [[SNOW, 3], [CARROT, 1], [COAL, 1], [STICK, 2]] },
  { out: [FIREWORK, 3], in: [[PAPER, 1], [GUNPOWDER, 1]] },
);

// ---------- v27 C: more vegetables; cider and berry wine; cellars ----------
// Onions, beans, tomatoes and herbs are planted as they are, like carrots. Beans feed the soil rather than
// tiring it: whatever is planted after them grows faster. Apples and berries go through the wine press too, and
// age in a barrel into cider and berry wine. A barrel kept in a cellar (where no daylight reaches) ages faster.
export const ONION = 395, BEANS = 396, TOMATO = 397, HERBS = 398, APPLE_JUICE = 399, BERRY_JUICE = 334, CIDER = 335, VINTAGE_CIDER = 336,
  BERRY_WINE = 337, FINE_BERRY_WINE = 338, VEG_STEW = 339, BAKED_BEANS = 1053, TOMATO_SOUP = 1054;
export const ONION_CROP = 1391, BEAN_CROP = 1395, TOMATO_CROP = 1399, HERB_CROP = 1403; // 4 stages each (3 is ripe)
for (const [base, kind, seed, tex, name, n] of [[ONION_CROP, 'onion', ONION, T.ONION_0, 'Onions', 2], [BEAN_CROP, 'bean', BEANS, T.BEAN_0, 'Beans', 3],
  [TOMATO_CROP, 'tomato', TOMATO, T.TOMATO_0, 'Tomatoes', 2], [HERB_CROP, 'herb', HERBS, T.HERB_0, 'Herbs', 2]]) {
  for (let k = 0; k < 4; k++) {
    block(base + k, {
      ...plant, name, tex: tex + k, variantOf: seed, grows: k < 3 ? base + k + 1 : null,
      crop: { kind, stage: k, ripe: k === 3, seed, first: base },
      drop: k < 3 ? () => [[seed, 1]] : () => [[seed, n + Math.floor(Math.random() * 2)]],
    });
  }
}
ITEMS[ONION] = { name: 'Onion', food: 1, places: ONION_CROP };
ITEMS[BEANS] = { name: 'Beans', food: 1, places: BEAN_CROP, about: 'they feed the soil: the next crop grows faster' };
ITEMS[TOMATO] = { name: 'Tomato', food: 3, places: TOMATO_CROP };
ITEMS[HERBS] = { name: 'Herbs', food: 1, places: HERB_CROP, about: 'thyme, sage and basil, for the cooking pot' };
ITEMS[APPLE_JUICE] = { name: 'Apple Juice', stack: 8, food: 3, bottle: true, about: 'lay it down in a barrel to make cider' };
ITEMS[BERRY_JUICE] = { name: 'Berry Juice', stack: 8, food: 3, bottle: true, about: 'lay it down in a barrel to make berry wine' };
ITEMS[CIDER] = { name: 'Cider', stack: 8, food: 4, meal: ['warm', 200], about: 'feel warm inside', bottle: true };
ITEMS[VINTAGE_CIDER] = { name: 'Vintage Cider', stack: 8, food: 6, meal: ['heal', 8], about: 'feel wonderful', bottle: true };
ITEMS[BERRY_WINE] = { name: 'Berry Wine', stack: 8, food: 4, meal: ['warm', 200], about: 'feel warm inside', bottle: true };
ITEMS[FINE_BERRY_WINE] = { name: 'Fine Berry Wine', stack: 8, food: 6, meal: ['heal', 8], about: 'feel wonderful', bottle: true };
ITEMS[VEG_STEW] = { name: 'Vegetable Stew', food: 10, meal: ['warm', 300], about: 'feel warm inside' };
ITEMS[TOMATO_SOUP] = { name: 'Tomato Soup', food: 7, meal: ['heal', 4], about: 'feel better' };
ITEMS[BAKED_BEANS] = { name: 'Baked Beans', food: 7 };
Object.assign(AGING, { [APPLE_JUICE]: [CIDER, 1], [CIDER]: [VINTAGE_CIDER, 3], [BERRY_JUICE]: [BERRY_WINE, 1], [BERRY_WINE]: [FINE_BERRY_WINE, 3] });

// ---------- v27 D: the kiln, terracotta and pottery; rope ladders and rope bridges ----------
// A kiln burns fuel like an oven and fires clay: a block of clay into terracotta (dye it, then fire it again
// for glazed tiles), clay balls into bricks (quicker than a smelter) or into an urn to keep things in.
// A rope ladder fixed to the top of a drop unrolls down it; a rope bridge is laid out across a gap, plank by
// plank, the way you're facing, with rope rails along it.
export const KILN = 1407, // 1407..1414: + facing, + 4 while burning
  TERRACOTTA = 1415, TERRA_COL = 1416, // 1416..1425: + colour 0..9
  GLAZED_TILE = 1426, // 1426..1435: + colour
  ROOF_TILES = 1436, URN = 1437,
  ROPE_LADDER = 1438, // 1438..1441: + facing
  ROPE_BRIDGE = 1442, // 1442..1443: + axis (0 along z, 1 along x)
  BRIDGE_RAIL = 1444; // 1444..1445: the rope rails over a bridge, + axis
export const UNFIRED_URN = 102;
ITEMS[UNFIRED_URN] = { name: 'Unfired Urn', about: 'fire it in a kiln' };
for (let k = 0; k < 8; k++) {
  const facing = k & 3, lit = k >= 4;
  block(KILN + k, {
    name: 'Kiln', station: 'kiln', side: T.KILN_SIDE, top: T.KILN_TOP, bottom: T.KILN_SIDE, front: lit ? T.KILN_FRONT_LIT : T.KILN_FRONT, facing, lit, light: lit ? 13 : 0,
    hardness: 2.5, tool: 'pick', variantOf: k ? KILN : 0, drop: KILN, stationBase: KILN,
  });
}
block(TERRACOTTA, { name: 'Terracotta', sound: 'stone', tex: T.TERRACOTTA, hardness: 1.5, tool: 'pick' });
COLORS.forEach((c, i) => {
  block(TERRA_COL + i, { name: `${c.name} Terracotta`, sound: 'stone', tex: T.TERRA_COL + i, hardness: 1.5, tool: 'pick', color: i });
  block(GLAZED_TILE + i, { name: `${c.name} Glazed Tile`, sound: 'glass', tex: T.GLAZED + i, hardness: 1.5, tool: 'pick', color: i });
});
block(ROOF_TILES, { name: 'Roof Tiles', sound: 'stone', tex: T.ROOF_TILES, hardness: 1.5, tool: 'pick' });
block(URN, {
  name: 'Urn', station: 'urn', sound: 'stone', transparent: true, hardness: 1, tool: 'pick',
  model: [[4, 0, 4, 12, 1, 12, T.URN], [2.5, 1, 2.5, 13.5, 10, 13.5, T.URN], [4, 10, 4, 12, 12, 12, T.URN], [5, 12, 5, 11, 14, 11, T.URN], [4, 14, 4, 12, 15, 12, T.URN]],
  boxes: [[2.5, 0, 2.5, 13.5, 15, 13.5]],
});
const rope = T.ROPE;
const ROPE_LADDER_MODEL = [
  [2.5, 0, 0.3, 3.5, 16, 1.3, rope], [12.5, 0, 0.3, 13.5, 16, 1.3, rope],
  ...[2, 6, 10, 14].map((y) => [3.5, y, 0.2, 12.5, y + 1, 1.4, T.PLANKS]),
];
for (let f = 0; f < 4; f++) {
  block(ROPE_LADDER + f, {
    name: 'Rope Ladder', sound: 'wool', transparent: true, solid: false, hardness: 0.4, climb: true, ropeLadder: true,
    model: rotateModel(ROPE_LADDER_MODEL, f), facing: f, variantOf: f ? ROPE_LADDER : 0, drop: ROPE_LADDER,
  });
}
// (a rotation by 1 turns a model along z into one along x)
const BRIDGE_MODEL = [...[0, 4, 8, 12].map((z) => [0.5, 13, z + 0.3, 15.5, 15, z + 3.7, T.PLANKS]), [1, 12, 0, 2, 13, 16, rope], [14, 12, 0, 15, 13, 16, rope]];
const RAIL_MODEL = [[0.5, 9, 0, 1.5, 10, 16, rope], [14.5, 9, 0, 15.5, 10, 16, rope], [0.7, 0, 7.5, 1.3, 9, 8.5, rope], [14.7, 0, 7.5, 15.3, 9, 8.5, rope]];
for (let a = 0; a < 2; a++) {
  block(ROPE_BRIDGE + a, {
    name: 'Rope Bridge', sound: 'wood', transparent: true, hardness: 0.8, tool: 'axe', bridge: a,
    model: a ? rotateModel(BRIDGE_MODEL, 1) : BRIDGE_MODEL, boxes: [[0, 13, 0, 16, 15, 16]], variantOf: a ? ROPE_BRIDGE : 0, drop: ROPE_BRIDGE,
  });
  block(BRIDGE_RAIL + a, {
    name: 'Rope Rail', sound: 'wool', transparent: true, solid: false, hardness: 0.1, variantOf: ROPE_BRIDGE, drop: 0,
    model: a ? rotateModel(RAIL_MODEL, 1) : RAIL_MODEL,
  });
}
RECIPES.push(
  { out: [KILN, 1], in: [[CLAY_BRICKS, 5], [IRON_INGOT, 1]], table: true, metal: IRON_INGOT },
  { out: [ROOF_TILES, 4], in: [[TERRACOTTA, 4]], table: true },
  { out: [UNFIRED_URN, 1], in: [[CLAY_BALL, 6]] },
  { out: [ROPE_LADDER, 4], in: [[STRING, 4], [STICK, 3]] },
  { out: [ROPE_BRIDGE, 4], in: [[PLANKS, 3], [STRING, 3]] },
);
COLORS.forEach((c, i) => RECIPES.push({ out: [TERRA_COL + i, 4], in: [[TERRACOTTA, 4], [DYE + i, 1]], metal: DYE + i }));

// ---------- v27 E: canal locks ----------
// Lock gates are heavy timber gates that hold the water back. Build a walled chamber between a lower and an
// upper stretch of canal, with gates at each end, and a sluice wheel on the bank beside it: turning the wheel
// shuts the gates, fills (or drains) the chamber to the other canal's level and opens the gate on that side,
// carrying a boat up or down with it.
export const LOCK_GATE = 1446, SLUICE_WHEEL = 1447;
block(LOCK_GATE, { name: 'Lock Gate', sound: 'wood', side: T.LOCK_GATE, top: T.LOCK_GATE_TOP, bottom: T.LOCK_GATE_TOP, hardness: 2.5, tool: 'axe' });
block(SLUICE_WHEEL, {
  name: 'Sluice Wheel', sound: 'wood', transparent: true, hardness: 1.5, tool: 'axe',
  model: [
    [3, 0, 6, 7, 11, 10, T.LOG_SIDE], [7, 9.25, 7.25, 12.5, 10.75, 8.75, T.IRON], // post and axle
    [12.5, 5, 7.5, 13.5, 15, 8.5, T.PLANKS], [12.5, 9.5, 3, 13.5, 10.5, 13, T.PLANKS], // spokes
    [12, 15, 5, 14, 16, 11, T.IRON], [12, 4, 5, 14, 5, 11, T.IRON], [12, 7, 2, 14, 13, 3, T.IRON], [12, 7, 13, 14, 13, 14, T.IRON], // the rim
    [12, 13, 3, 14, 15, 5, T.IRON], [12, 13, 11, 14, 15, 13, T.IRON], [12, 5, 3, 14, 7, 5, T.IRON], [12, 5, 11, 14, 7, 13, T.IRON],
  ],
  boxes: [[3, 0, 3, 14, 16, 13]],
});
RECIPES.push(
  { out: [LOCK_GATE, 2], in: [[PLANKS, 6], [IRON_INGOT, 1]], table: true, metal: IRON_INGOT },
  { out: [SLUICE_WHEEL, 1], in: [[LOG, 1], [PLANKS, 2], [IRON_INGOT, 2]], table: true, metal: IRON_INGOT },
);

// ---------- v27 F: stalactites, stalagmites and cave creatures ----------
// Dripstone hangs from cave roofs and rises from their floors. A stalactite can come loose over your head
// (or when the rock it hangs from is dug out) and fall. Glowing beetles crawl in the dark; their shells make
// a cool green lamp.
export const STALACTITE = 1448, STALAGMITE = 1449, BEETLE_LAMP = 1450;
export const GLOW_SHELL = 103;
const DRIP = T.DRIPSTONE;
block(STALACTITE, {
  name: 'Stalactite', sound: 'stone', transparent: true, solid: false, hardness: 0.8, tool: 'pick', stalactite: true,
  model: [[5, 11, 5, 11, 16, 11, DRIP], [6, 6, 6, 10, 11, 10, DRIP], [7, 2, 7, 9, 6, 9, DRIP], [7.5, 0, 7.5, 8.5, 2, 8.5, DRIP]],
});
block(STALAGMITE, {
  name: 'Stalagmite', sound: 'stone', transparent: true, solid: false, hardness: 0.8, tool: 'pick',
  model: [[4.5, 0, 4.5, 11.5, 5, 11.5, DRIP], [5.5, 5, 5.5, 10.5, 10, 10.5, DRIP], [6.75, 10, 6.75, 9.25, 14, 9.25, DRIP], [7.5, 14, 7.5, 8.5, 16, 8.5, DRIP]],
});
block(BEETLE_LAMP, { name: 'Beetle Lamp', sound: 'glass', tex: T.BEETLE_LAMP, hardness: 0.5, light: 12 });
ITEMS[GLOW_SHELL] = { name: 'Glow Shell', about: 'from a cave beetle: it still glows' };
RECIPES.push({ out: [BEETLE_LAMP, 1], in: [[GLOW_SHELL, 3], [GLASS, 1]] });

// ---------- v28 A: ore washer, sieve and slag ----------
// Crushed ore comes out dirty. Dirty dust smelts as it is, though it loses a quarter; washed in an ore washer
// (driven by a shaft, with water touching it) it comes clean, and the washings now and then give up a trace
// of another metal (nickel from iron, gold from copper, silver from lead...) as well as sludge. A sieve sifts
// gravel and dirt for flint, scraps of ore, seeds and worms. Smelting leaves slag, which crushes into
// fertiliser or makes rough bricks.
export const DIRTY_DUST = 3000; // 3000..3049: one for each ore, in ORES order
export const SLUDGE = 3050, SLAG = 3051, WORM = 3052;
export const WASHER = 1451, SIEVE = 1455, SLAG_BRICKS = 1456; // washer 1451..1454: + facing
export const dirtyDust = (oreId) => DIRTY_DUST + ORES.findIndex((o) => o.id === oreId);
// what washing each ore's dust can turn up: [ore whose clean dust it gives, chance]
const traceOf = (name) => ORES.find((o) => o.name === name)?.id;
export const TRACE_METALS = {
  [traceOf('Iron Ore')]: [traceOf('Nickel Ore'), 0.1],
  [traceOf('Copper Ore')]: [traceOf('Gold Ore'), 0.06],
  [traceOf('Tin Ore')]: [traceOf('Zinc Ore'), 0.1],
  [traceOf('Lead Ore')]: [traceOf('Silver Ore'), 0.1],
  [traceOf('Zinc Ore')]: [traceOf('Lead Ore'), 0.08],
  [traceOf('Bauxite')]: [traceOf('Iron Ore'), 0.12],
  [traceOf('Silver Ore')]: [traceOf('Gold Ore'), 0.06],
  [traceOf('Gold Ore')]: [traceOf('Silver Ore'), 0.1],
  [traceOf('Tungsten Ore')]: [traceOf('Tin Ore'), 0.1],
  [traceOf('Nickel Ore')]: [traceOf('Copper Ore'), 0.1],
  [traceOf('Uranium Ore')]: [traceOf('Lead Ore'), 0.12],
};
for (const o of ORES) if (o.ingot) ITEMS[dirtyDust(o.id)] = { name: `Dirty ${o.name.replace(' Ore', '')} Dust`, about: 'wash it for clean dust (and maybe a trace of another metal), or smelt it as it is' };
ITEMS[SLUDGE] = { name: 'Sludge', about: 'the muck washed out of ore: 4 make a clay block' };
ITEMS[SLAG] = { name: 'Slag', about: 'left over from smelting: crush it for fertiliser, or make bricks' };
ITEMS[WORM] = { name: 'Worm', about: 'fishing bait (sift dirt for more)' };
for (let k = 0; k < 4; k++) {
  block(WASHER + k, {
    name: 'Ore Washer', station: 'washer', side: T.WASHER_SIDE, top: T.WASHER_TOP, bottom: T.WASHER_SIDE, front: T.WASHER_FRONT,
    facing: k, hardness: 2.5, tool: 'pick', variantOf: k ? WASHER : 0, drop: WASHER, stationBase: WASHER, machine: { load: 3 },
  });
}
block(SIEVE, {
  name: 'Sieve', station: 'sieve', sound: 'wood', transparent: true, hardness: 1.2, tool: 'axe', stationBase: SIEVE,
  model: [
    [0, 0, 0, 2, 10, 2, T.PLANKS], [14, 0, 0, 16, 10, 2, T.PLANKS], [0, 0, 14, 2, 10, 16, T.PLANKS], [14, 0, 14, 16, 10, 16, T.PLANKS], // legs
    [0, 10, 0, 16, 13, 1.5, T.PLANKS], [0, 10, 14.5, 16, 13, 16, T.PLANKS], [0, 10, 1.5, 1.5, 13, 14.5, T.PLANKS], [14.5, 10, 1.5, 16, 13, 14.5, T.PLANKS], // frame
    [1.5, 10.5, 1.5, 14.5, 11, 14.5, T.SIEVE], // the mesh
  ],
  boxes: [[0, 0, 0, 16, 13, 16]],
});
block(SLAG_BRICKS, { name: 'Slag Bricks', sound: 'stone', tex: T.SLAG_BRICKS, hardness: 2, tool: 'pick' });
RECIPES.push(
  { out: [WASHER, 1], in: [[IRON_INGOT, 3], [PLANKS, 4], [BUCKET, 1], [kineticId('gear', 0), 1]], table: true, metal: IRON_INGOT },
  { out: [SIEVE, 1], in: [[PLANKS, 4], [STICK, 4], [STRING, 4]], table: true },
  { out: [CLAY, 1], in: [[SLUDGE, 4]] },
  { out: [SLAG_BRICKS, 4], in: [[SLAG, 4], [CLAY_BALL, 1]] },
);

// ---------- v28 B: charcoal piles ----------
// A stack of logs covered over with earth, lit through one hole, smoulders into charcoal: each log becomes a
// heap of charcoal that gives two pieces (no fuel needed). Let air in while it burns and it flares up.
export const CHARCOAL_HEAP = 1457;
block(CHARCOAL_HEAP, { name: 'Charcoal Heap', sound: 'gravel', tex: T.CHARCOAL_HEAP, hardness: 0.6, tool: 'shovel', drop: () => [[CHARCOAL, 2]] });

// ---------- v28 C: machine upgrades ----------
// Tap a machine with one to fit it (up to two of each kind in a machine; they come out again when it's broken).
// Speed: works half as fast again. Efficiency: burns a third less fuel (fuelled machines). Yield: a chance of
// one more of what it makes (crushers, pulverizers, washers, sieves, millstones and saws).
export const SPEED_UPGRADE = 3053, EFFICIENCY_UPGRADE = 3054, YIELD_UPGRADE = 3055;
export const UPGRADES = { [SPEED_UPGRADE]: 'speed', [EFFICIENCY_UPGRADE]: 'eff', [YIELD_UPGRADE]: 'yield' };
ITEMS[SPEED_UPGRADE] = { name: 'Speed Upgrade', about: 'tap a machine with it: works half as fast again (up to two)' };
ITEMS[EFFICIENCY_UPGRADE] = { name: 'Efficiency Upgrade', about: 'tap a furnace, oven or kiln with it: burns a third less fuel (up to two)' };
ITEMS[YIELD_UPGRADE] = { name: 'Yield Upgrade', about: 'tap a crusher, pulverizer, washer, sieve, millstone or saw with it: sometimes one more (up to two)' };
RECIPES.push(
  { out: [SPEED_UPGRADE, 1], in: [[STEEL_INGOT, 2], [ELECTRUM_INGOT, 1], [kineticId('gear', 0), 1]], table: true, metal: STEEL_INGOT },
  { out: [EFFICIENCY_UPGRADE, 1], in: [[CUPRONICKEL_INGOT, 2], [FIRE_BRICK, 2]], table: true, metal: CUPRONICKEL_INGOT },
  { out: [YIELD_UPGRADE, 1], in: [[STAINLESS_INGOT, 2], [SILVER_INGOT, 1], [GOLD_INGOT, 1]], table: true, metal: STAINLESS_INGOT },
);

// ---------- v28 D: horse gear, hay, honey varieties ----------
export const SADDLEBAGS = 3056, HORSE_ARMOUR = 3057, HAY_BALE = 1458;
ITEMS[SADDLEBAGS] = { name: 'Saddlebags', about: 'tap your saddled horse with them: nine slots you open with 🎒 while riding' };
ITEMS[HORSE_ARMOUR] = { name: 'Horse Armour', about: 'tap your horse with it: while you ride, creatures do you half the harm' };
block(HAY_BALE, { name: 'Hay Bale', sound: 'grass', side: T.HAY, top: T.HAY, bottom: T.HAY, hardness: 0.5, tool: 'axe' });
RECIPES.push(
  { out: [SADDLEBAGS, 1], in: [[LEATHER, 4], [STRING, 2], [CHEST, 1]], table: true },
  { out: [HORSE_ARMOUR, 1], in: [[IRON_INGOT, 6], [LEATHER, 2]], table: true, metal: IRON_INGOT },
  { out: [HAY_BALE, 1], in: [[WHEAT, 9]] },
  { out: [WHEAT, 9], in: [[HAY_BALE, 1]] },
);
// Honey takes after the flowers round the hive: lavender, fruit blossom or dandelions (or else it's plain
// wildflower honey). Each brews a tea in the cauldron with its flower.
export const LAVENDER_HONEY = 3059, BLOSSOM_HONEY = 3060, GOLDEN_HONEY = 3061, LAVENDER_TEA = 3062, BLOSSOM_TEA = 3063, GOLDEN_TEA = 3064;
ITEMS[LAVENDER_HONEY] = { name: 'Lavender Honey', stack: 8, food: 6, honey: true, about: 'from bees among lavender: brew it with lavender' };
ITEMS[BLOSSOM_HONEY] = { name: 'Blossom Honey', stack: 8, food: 6, honey: true, about: 'from bees among fruit trees: brew it with an apple or cherries' };
ITEMS[GOLDEN_HONEY] = { name: 'Golden Honey', stack: 8, food: 6, honey: true, about: 'from bees among dandelions: brew it with a dandelion' };
ITEMS[HONEY_BOTTLE].honey = true;
ITEMS[LAVENDER_TEA] = { name: 'Lavender Tea', stack: 8, tea: ['fed', 600], about: 'feel soothed: hunger falls slower and you heal quicker' };
ITEMS[BLOSSOM_TEA] = { name: 'Blossom Tea', stack: 8, tea: ['swift', 240], about: 'feel light on your feet: run faster' };
ITEMS[GOLDEN_TEA] = { name: 'Golden Tea', stack: 8, tea: ['heal', 25], about: 'glow with health: heal quickly for a while' };

// ---------- v28 E: fine crops, fish traps ----------
// Now and then a ripe crop comes up fine: more so in soil beans have fed, under glass or watched by a
// scarecrow, and never from tired soil. Fine produce is better eating, fetches a good price at a stall,
// wins prizes at festivals, and can stand in for the ordinary kind (craft it back).
export const FINE_CROPS = {}; // plain id -> fine id
export const FISH_TRAP = 1459;
[[WHEAT, 'Fine Wheat'], [CARROT, 'Fine Carrot'], [POTATO, 'Fine Potato'], [ONION, 'Fine Onion'], [BEANS, 'Fine Beans'],
  [TOMATO, 'Fine Tomato'], [HERBS, 'Fine Herbs'], [GRAPES, 'Fine Grapes']].forEach(([id, name], i) => {
  const fine = 3065 + i;
  FINE_CROPS[id] = fine;
  ITEMS[fine] = { name, fine: id, food: (ITEMS[id].food ?? 0) + 2, about: 'the pick of the harvest: sells well, and wins prizes at festivals' };
  RECIPES.push({ out: [id, 1], in: [[fine, 1]] });
});
export const isFine = (id) => !!ITEMS[id]?.fine;
// A wicker trap sunk in water: bait it with worms and now and then something swims in.
block(FISH_TRAP, {
  name: 'Fish Trap', station: 'fishtrap', sound: 'wood', transparent: true, hardness: 0.8, tool: 'axe', stationBase: FISH_TRAP,
  model: [
    [2, 0, 2, 14, 1, 14, T.PLANKS], [2, 1, 2, 14, 10, 3, T.SIEVE], [2, 1, 13, 14, 10, 14, T.SIEVE], [2, 1, 3, 3, 10, 13, T.SIEVE], [13, 1, 3, 14, 10, 13, T.SIEVE],
    [2, 10, 2, 14, 11, 14, T.SIEVE], [6, 4, 1, 10, 8, 2, T.PLANKS], // lid, and the funnel mouth
  ],
  boxes: [[2, 0, 2, 14, 11, 14]],
});
RECIPES.push({ out: [FISH_TRAP, 1], in: [[STICK, 8], [STRING, 4], [PLANKS, 1]], table: true });
ITEMS[WORM].about = 'bait: carry some when you fish and fish bite twice as fast (and no junk), or put them in a fish trap. Sift dirt for more';

// ---------- v28 F: chest boats ----------
export const CHEST_BOAT = 3073;
ITEMS[CHEST_BOAT] = { name: 'Chest Boat', stack: 1, vehicle: 'boat', chest: true, about: 'a boat with a chest in the stern: open it with 🎒 while you row, or sneak and tap it' };
RECIPES.push({ out: [CHEST_BOAT, 1], in: [[BOAT, 1], [CHEST, 1]] });
ITEMS[LOCOMOTIVE].about = 'put it on a rail and tap it with coal: it pulls the carts behind it. A storage cart coupled right behind it is its tender: it keeps it in coal';

// ---------- v29 C: logistics pipes ----------
// A routed item network (see logistics.js). Logistics pipes join up into a network and serve the chests and
// machines they touch: providers offer what's in them, crafting pipes make things in the crafter or machine
// they sit on, suppliers keep one stocked, sinks take things in, extractors empty one out. Order anything the
// network has, or can make, at a request table. A powered junction runs it all.
export const LP_PIPE = 1460, LP_PROVIDER = 1461, LP_CRAFTING = 1462, LP_SUPPLIER = 1463, LP_SINK = 1464, LP_EXTRACTOR = 1465,
  LP_TABLE = 1466, LP_POWER = 1467, REMOTE_ORDERER = 3074;
export const LP_ROLES = ['basic', 'provider', 'crafting', 'supplier', 'sink', 'extractor']; // (in the order of their core tiles)
ELECTRIC_DRAW.junction = 2;
[[LP_PIPE, 'Logistics Pipe'], [LP_PROVIDER, 'Provider Pipe'], [LP_CRAFTING, 'Crafting Pipe'], [LP_SUPPLIER, 'Supplier Pipe'],
  [LP_SINK, 'Item Sink Pipe'], [LP_EXTRACTOR, 'Extractor Pipe']].forEach(([id, name], i) => {
  block(id, { name, shape: 'lpipe', lpipe: LP_ROLES[i], transparent: true, sound: 'glass', hardness: 0.5, tex: T.LP_CORE + i });
});
block(LP_TABLE, { name: 'Request Table', station: 'reqtable', lpipe: 'table', sound: 'wood', top: T.LP_TABLE_TOP, side: T.LP_TABLE_SIDE, bottom: T.PLANKS, hardness: 1.5, tool: 'axe' });
block(LP_POWER, { name: 'Logistics Power Junction', lpipe: 'power', sound: 'stone', tex: T.LP_JUNCTION, hardness: 2, tool: 'pick', electric: { role: 'use', draw: ELECTRIC_DRAW.junction } });
ITEMS[REMOTE_ORDERER] = { name: 'Remote Orderer', stack: 1, about: 'tap a request table with it to link it, then order from anywhere nearby' };
RECIPES.push(
  { out: [LP_PIPE, 8], in: [[TUBE, 8], [GOLD_INGOT, 1], [WIRE, 1]], table: true, metal: GOLD_INGOT },
  { out: [LP_PROVIDER, 1], in: [[LP_PIPE, 1], [HOPPER, 1]], table: true },
  { out: [LP_CRAFTING, 1], in: [[LP_PIPE, 1], [TABLE, 1]], table: true },
  { out: [LP_SUPPLIER, 1], in: [[LP_PIPE, 1], [COPPER_INGOT, 2], [HOPPER, 1]], table: true, metal: COPPER_INGOT },
  { out: [LP_SINK, 1], in: [[LP_PIPE, 1], [ITEM_FRAME, 1]], table: true },
  { out: [LP_EXTRACTOR, 1], in: [[LP_PIPE, 1], [EJECTOR, 1]], table: true },
  { out: [LP_TABLE, 1], in: [[LP_PIPE, 1], [TABLE, 1], [GLASS_PANE, 2], [GOLD_INGOT, 1]], table: true, metal: GOLD_INGOT },
  { out: [LP_POWER, 1], in: [[LP_PIPE, 1], [GRID_BATTERY, 1], [WIRE, 4]], table: true },
  { out: [REMOTE_ORDERER, 1], in: [[LP_PIPE, 1], [CRYSTAL_SHARD, 1], [GOLD_INGOT, 2]], table: true, metal: GOLD_INGOT },
);
// ---------- v30: logistics signals, liquids and courier drones ----------
// A stock sensor pipe signals while the network has less (or, set to, at least) some amount of a thing; a power
// junction that gets a signal pauses its network. Liquid provider and supplier pipes move water and lava between
// tanks, and lava to the fires of ovens, smelters and engines. Drone pads on the same channel join networks
// that are too far apart to pipe: couriers fly things between them.
export const LP_SENSOR = 1468, // 1469 = signalling
  LP_FPROVIDER = 1470, LP_FSUPPLIER = 1471, DRONE_PAD = 1472, LP_FSINK = 1473, BOTTLER = 1474;
for (const k of [0, 1]) {
  block(LP_SENSOR + k, {
    name: 'Stock Sensor Pipe', shape: 'lpipe', lpipe: 'sensor', transparent: true, sound: 'glass', hardness: 0.5,
    tex: k ? T.LP_SENSOR_ON : T.LP_SENSOR_CORE, switch: 'stock', on: !!k, flip: LP_SENSOR + 1 - k,
    light: k ? 3 : 0, variantOf: k ? LP_SENSOR : 0, drop: LP_SENSOR,
  });
}
block(LP_FPROVIDER, { name: 'Liquid Provider Pipe', shape: 'lpipe', lpipe: 'fprovider', transparent: true, sound: 'glass', hardness: 0.5, tex: T.LP_FPROVIDER });
block(LP_FSUPPLIER, { name: 'Liquid Supplier Pipe', shape: 'lpipe', lpipe: 'fsupplier', transparent: true, sound: 'glass', hardness: 0.5, tex: T.LP_FSUPPLIER });
block(LP_FSINK, { name: 'Liquid Sink Pipe', shape: 'lpipe', lpipe: 'fsink', transparent: true, sound: 'glass', hardness: 0.5, tex: T.LP_FSINK });
// the bottler fills buckets from the liquid piped into it: water into buckets, lava into lead buckets
block(BOTTLER, { name: 'Bottler', station: 'bottler', sound: 'metal', side: T.BOTTLER_SIDE, top: T.BOTTLER_TOP, bottom: T.IRON, hardness: 2, tool: 'pick' });
block(DRONE_PAD, {
  name: 'Drone Pad', lpipe: 'pad', transparent: true, sound: 'metal', hardness: 2, tool: 'pick',
  model: [[0, 0, 0, 16, 4, 16, { top: T.DRONE_PAD_TOP, side: T.DRONE_PAD_SIDE, bottom: T.DRONE_PAD_SIDE }]], boxes: [[0, 0, 0, 16, 4, 16]],
});
RECIPES.push(
  { out: [LP_SENSOR, 1], in: [[LP_PIPE, 1], [DAYLIGHT_SENSOR, 1]], table: true },
  { out: [LP_FPROVIDER, 1], in: [[LP_PIPE, 1], [PIPE, 1], [BUCKET, 1]], table: true },
  { out: [LP_FSUPPLIER, 1], in: [[LP_PIPE, 1], [PIPE, 1], [COPPER_INGOT, 2]], table: true, metal: COPPER_INGOT },
  { out: [DRONE_PAD, 1], in: [[LP_PIPE, 1], [IRON_INGOT, 4], [CRYSTAL_SHARD, 1], [GRID_BATTERY, 1]], table: true, metal: IRON_INGOT },
  { out: [LP_FSINK, 1], in: [[LP_PIPE, 1], [PIPE, 1], [ITEM_FRAME, 1]], table: true },
  { out: [BOTTLER, 1], in: [[IRON_INGOT, 4], [TANK, 1], [BUCKET, 1], [HOPPER, 1]], table: true, metal: IRON_INGOT },
);

// ---------- v31: bee breeding, the comb centrifuge and honey products ----------
// Bees come in species. Each species is two items, a princess and a drone, so they keep in chests and travel
// along belts and pipes like anything else. A princess and a drone put in a bee house make a queen: she works
// through her life making combs, then leaves a new princess and some drones. Each of those is one of her
// parents' species, or (now and then, when the parents' pair is a known one) a new species: a mutation.
// Combs spin in the comb centrifuge into honey drops, beeswax, propolis, pollen, royal jelly and more.
export const BEE_HOUSE = 1475, COMB_CENTRIFUGE = 1476;
export const BEE_ITEMS = 3100; // princess = BEE_ITEMS + 2 * species, drone = + 1 (3100..3131)
export const BEE_SCOOP = 3140, WOODEN_FRAME = 3141, WAXED_FRAME = 3142, PROVEN_FRAME = 3143;
export const HONEY_DROP = 3144, PROPOLIS = 3145, POLLEN = 3146, ROYAL_JELLY = 3147, HONEY_MUST = 3148, MEAD = 3149, FINE_MEAD = 3150,
  HONEY_CAKE = 3151, HONEYED_APPLE = 3152;
export const COMBS = 3160; // 3160..3170: the combs of the species (plain honeycomb is HONEYCOMB)
export const FROSTY_COMB = 3160, DRY_COMB = 3161, FLORAL_COMB = 3162, BLOSSOM_COMB = 3163, MINERAL_COMB = 3164, EMBER_COMB = 3165,
  ROYAL_COMB = 3166, GLOW_COMB = 3167, CRYSTAL_COMB = 3168, GILDED_COMB = 3169, STARRY_COMB = 3170;
// flower: what must grow (or lie) within 5 blocks: 'flowers', 'cactus', 'fruit' (fruit tree leaves), 'snow' (snow
//   or ice), 'lava', 'glowcap', or 'none'.
// climate: 'cold' works only in the tundra or in winter, 'hot' only in the desert or in summer; else anywhere.
// time: 'day' (in daylight), 'night' (at night, or somewhere dark), 'cave' (with no sky over it), 'stars' (at night,
//   under the open sky).
// rain: works in the rain under the open sky. life: how many 30-second spells of work a queen lives.
// speed: how fast she works. fertility: how many drones she leaves. combs: [[comb, chance each spell], ...].
export const BEE_SPECIES = [
  { key: 'woodland', name: 'Woodland', col: [196, 140, 60], combs: [[HONEYCOMB, 0.5]], flower: 'flowers', time: 'day', life: 10, speed: 1, fertility: 2 },
  { key: 'meadow', name: 'Meadow', col: [226, 180, 40], combs: [[HONEYCOMB, 0.5]], flower: 'flowers', time: 'day', life: 8, speed: 1, fertility: 3 },
  { key: 'frost', name: 'Frost', col: [170, 214, 236], combs: [[FROSTY_COMB, 0.5]], flower: 'snow', climate: 'cold', time: 'day', life: 10, speed: 1, fertility: 2 },
  { key: 'dune', name: 'Dune', col: [222, 196, 130], combs: [[DRY_COMB, 0.5]], flower: 'cactus', climate: 'hot', time: 'day', life: 10, speed: 1, fertility: 2 },
  { key: 'common', name: 'Common', col: [214, 160, 56], combs: [[HONEYCOMB, 0.7]], flower: 'flowers', time: 'day', life: 10, speed: 1.2, fertility: 2 },
  { key: 'garden', name: 'Garden', col: [206, 120, 190], combs: [[FLORAL_COMB, 0.5], [HONEYCOMB, 0.3]], flower: 'flowers', time: 'day', life: 10, speed: 1, fertility: 2 },
  { key: 'orchard', name: 'Orchard', col: [236, 150, 160], combs: [[BLOSSOM_COMB, 0.5]], flower: 'fruit', time: 'day', life: 10, speed: 1, fertility: 2 },
  { key: 'hardy', name: 'Hardy', col: [140, 120, 96], combs: [[HONEYCOMB, 0.5]], flower: 'none', time: 'day', rain: true, life: 12, speed: 1, fertility: 2 },
  { key: 'diligent', name: 'Diligent', col: [240, 200, 60], combs: [[HONEYCOMB, 0.9]], flower: 'flowers', time: 'day', life: 12, speed: 1.5, fertility: 2 },
  { key: 'rocky', name: 'Rocky', col: [130, 130, 136], combs: [[MINERAL_COMB, 0.4]], flower: 'none', time: 'cave', rain: true, life: 12, speed: 1, fertility: 1 },
  { key: 'ember', name: 'Ember', col: [216, 80, 40], combs: [[EMBER_COMB, 0.4]], flower: 'lava', time: 'day', life: 10, speed: 1, fertility: 2 },
  { key: 'royal', name: 'Royal', col: [150, 70, 180], combs: [[ROYAL_COMB, 0.3], [HONEYCOMB, 0.4]], flower: 'flowers', time: 'day', life: 14, speed: 1, fertility: 1 },
  { key: 'glow', name: 'Glow', col: [120, 220, 150], combs: [[GLOW_COMB, 0.4]], flower: 'glowcap', time: 'night', life: 10, speed: 1, fertility: 2 },
  { key: 'crystal', name: 'Crystal', col: [180, 140, 240], combs: [[CRYSTAL_COMB, 0.3]], flower: 'none', time: 'cave', rain: true, life: 12, speed: 1, fertility: 1 },
  { key: 'gilded', name: 'Gilded', col: [250, 210, 70], combs: [[GILDED_COMB, 0.3]], flower: 'flowers', time: 'day', life: 14, speed: 1, fertility: 1 },
  { key: 'starry', name: 'Starry', col: [70, 80, 160], combs: [[STARRY_COMB, 0.25]], flower: 'none', time: 'stars', life: 16, speed: 1, fertility: 1 },
];
const SP = Object.fromEntries(BEE_SPECIES.map((s, i) => [s.key, i]));
// [parent, parent, child, chance]: a princess of one parent mated with a drone of the other (either way round)
export const BEE_MUTATIONS = [
  ['woodland', 'meadow', 'common', 0.15], ['common', 'meadow', 'garden', 0.12], ['common', 'woodland', 'orchard', 0.12],
  ['frost', 'dune', 'hardy', 0.12], ['common', 'garden', 'diligent', 0.10], ['hardy', 'diligent', 'rocky', 0.08],
  ['dune', 'hardy', 'ember', 0.10], ['diligent', 'orchard', 'royal', 0.08], ['garden', 'rocky', 'glow', 0.08],
  ['rocky', 'frost', 'crystal', 0.06], ['royal', 'rocky', 'gilded', 0.06], ['crystal', 'gilded', 'starry', 0.04],
].map(([a, b, c, p]) => [SP[a], SP[b], SP[c], p]);
export const princessOf = (sp) => BEE_ITEMS + 2 * sp;
export const droneOf = (sp) => BEE_ITEMS + 2 * sp + 1;
// The species of a bee item and whether it's a princess, or null.
export const beeOf = (id) => (id >= BEE_ITEMS && id < BEE_ITEMS + 2 * BEE_SPECIES.length ? { sp: (id - BEE_ITEMS) >> 1, princess: !((id - BEE_ITEMS) & 1) } : null);
export const BEE_FRAMES = { [WOODEN_FRAME]: { bonus: 0.5, uses: 8 }, [WAXED_FRAME]: { bonus: 1, uses: 16 }, [PROVEN_FRAME]: { bonus: 1, uses: 40 } };
const NEEDS = {
  flower: { flowers: 'flowers', cactus: 'cactus', fruit: 'fruit trees', snow: 'snow or ice', lava: 'lava', glowcap: 'glowcaps', none: '' },
  time: { day: 'works by day', night: 'works at night or in the dark', cave: 'works underground, with no sky over it', stars: 'works at night under the open sky' },
  climate: { cold: 'only in the tundra or in winter', hot: 'only in the desert or in summer' },
};
// Words for what a species needs, e.g. "needs flowers nearby; works by day".
export function beeNeeds(sp) {
  const s = BEE_SPECIES[sp];
  return [NEEDS.flower[s.flower] ? `needs ${NEEDS.flower[s.flower]} nearby` : '', NEEDS.time[s.time], NEEDS.climate[s.climate] ?? '', s.rain ? 'works in the rain' : ''].filter(Boolean).join('; ');
}
export const COMB_NAMES = ['Frosty', 'Dry', 'Floral', 'Blossom', 'Mineral', 'Ember', 'Royal', 'Glowing', 'Crystal', 'Gilded', 'Starry'];
COMB_NAMES.forEach((n, i) => { ITEMS[COMBS + i] = { name: `${n} Comb`, about: 'spin it in a comb centrifuge' }; });
ITEMS[HONEYCOMB].about = 'spin it in a comb centrifuge for honey and beeswax';
BEE_SPECIES.forEach((s, i) => {
  const bred = BEE_MUTATIONS.find((m) => m[2] === i);
  const from = bred ? ` Bred from ${BEE_SPECIES[bred[0]].name} and ${BEE_SPECIES[bred[1]].name} bees.` : '';
  const makes = s.combs.map(([c]) => itemName(c).toLowerCase()).join(' and ');
  ITEMS[princessOf(i)] = { name: `${s.name} Princess`, stack: 16, bee: true, about: `put her in a bee house with a drone. Makes ${makes}; ${beeNeeds(i)}.${from}` };
  ITEMS[droneOf(i)] = { name: `${s.name} Drone`, bee: true, about: `mate it with a princess in a bee house.${from}` };
});
ITEMS[BEE_SCOOP] = { name: 'Bee Scoop', stack: 1, about: 'tap a wild hive with bees in it to catch them: a princess and some drones' };
ITEMS[WOODEN_FRAME] = { name: 'Wooden Frame', stack: 16, about: 'in a bee house: half as many combs again; lasts 8 spells of work' };
ITEMS[WAXED_FRAME] = { name: 'Waxed Frame', stack: 16, about: 'in a bee house: twice the combs; lasts 16 spells of work' };
ITEMS[PROVEN_FRAME] = { name: 'Proven Frame', stack: 16, about: 'in a bee house: twice the combs; lasts 40 spells of work' };
ITEMS[HONEY_DROP] = { name: 'Honey Drop', about: '4 and a bottle make a honey bottle' };
ITEMS[PROPOLIS] = { name: 'Propolis', about: 'bee glue: makes proven frames' };
ITEMS[POLLEN] = { name: 'Pollen', about: '2 make fertiliser' };
ITEMS[ROYAL_JELLY] = { name: 'Royal Jelly', stack: 16, food: 3, meal: ['heal', 12], about: 'heals you' };
ITEMS[HONEY_MUST] = { name: 'Honey Must', stack: 8, food: 2, bottle: true, about: 'age it in an oak barrel for mead' };
ITEMS[MEAD] = { name: 'Mead', stack: 8, food: 5, meal: ['warm', 300], about: 'feel warm inside', bottle: true };
ITEMS[FINE_MEAD] = { name: 'Fine Mead', stack: 8, food: 7, meal: ['heal', 10], about: 'feel wonderful', bottle: true };
ITEMS[HONEY_CAKE] = { name: 'Honey Cake', food: 12 };
ITEMS[HONEYED_APPLE] = { name: 'Honeyed Apple', food: 6, meal: ['swift', 120], about: 'run faster' };
Object.assign(AGING, { [HONEY_MUST]: [MEAD, 1], [MEAD]: [FINE_MEAD, 3] });

block(BEE_HOUSE, { name: 'Bee House', station: 'beehouse', sound: 'wood', tool: 'axe', hardness: 1.5, side: T.BEEHOUSE_SIDE, top: T.BEEHOUSE_TOP, bottom: T.BEEHOUSE_TOP, front: T.BEEHOUSE_FRONT });
block(COMB_CENTRIFUGE, { ...machine, name: 'Comb Centrifuge', station: 'combspin', side: T.COMB_SPIN_SIDE, top: T.COMB_SPIN_TOP, bottom: T.PLANKS, stationBase: COMB_CENTRIFUGE, machine: { load: 2 } });
RECIPES.push(
  { out: [BEE_SCOOP, 1], in: [[STICK, 3], [WOOL, 3]], table: true },
  { out: [BEE_HOUSE, 1], in: [[PLANKS, 6], [HONEYCOMB, 2], [IRON_INGOT, 1]], table: true, metal: IRON_INGOT },
  { out: [COMB_CENTRIFUGE, 1], in: [[IRON_INGOT, 4], [PLANKS, 3], [kineticId('gear', 0), 1], [BUCKET, 1]], table: true, metal: IRON_INGOT },
  { out: [WOODEN_FRAME, 2], in: [[STICK, 4], [STRING, 1]], table: true },
  { out: [WAXED_FRAME, 1], in: [[WOODEN_FRAME, 1], [BEESWAX, 2]] },
  { out: [PROVEN_FRAME, 1], in: [[WAXED_FRAME, 1], [PROPOLIS, 2]] },
  { out: [HONEY_BOTTLE, 1], in: [[HONEY_DROP, 4], [GLASS_BOTTLE, 1]] },
  { out: [FERTILISER, 1], in: [[POLLEN, 2]] },
  { out: [HONEYED_APPLE, 1], in: [[APPLE, 1], [HONEY_DROP, 2]] },
);

// ---------- v32: rubber and polymers ----------
// A tree tap against a log slowly fills with latex, which an oven cures into rubber. Hide glue (rendered from
// leather in the oven) binds sawdust in the polymer press, a shaft-driven machine that moulds
// it into polymer pellets and presses those into sheets. Rubber sheathes electrum wire into insulated wire,
// which carries twice the power (see WIRE_CARRY in electric.js).
export const TREE_TAP = 1477, MAX_LATEX = 4, POLYMER_PRESS = 1482, INSULATED_WIRE = 1483; // taps 1477..1481 (+ latex level); wire 1484 = carrying a signal
export const LATEX = 3171, RUBBER = 3172, HIDE_GLUE = 3173, POLYMER_PELLETS = 3174, POLYMER_SHEET = 3175;
export const WIRE_CARRY = 48, INSULATED_CARRY = 96; // most power a network's wires carry (the weakest wire in it decides)
const TAP_MODEL = (k) => [
  [4, 0, 4, 12, 7, 12, T.TAP_SIDE], // the bucket
  [7, 7, 11, 9, 9, 16, T.IRON], // the spout, into the trunk behind
  ...(k ? [[5, 1 + k * 1.2, 5, 11, 1.5 + k * 1.2, 11, T.TAP_LATEX]] : []),
];
for (let k = 0; k <= MAX_LATEX; k++) {
  block(TREE_TAP + k, {
    name: 'Tree Tap', sound: 'wood', transparent: true, solid: false, hardness: 0.8, tool: 'axe', model: TAP_MODEL(k), boxes: [[4, 0, 4, 12, 9, 16]],
    variantOf: k ? TREE_TAP : 0, drop: () => [[TREE_TAP, 1], ...(k ? [[LATEX, k]] : [])], grows: k < MAX_LATEX ? 'latex' : null, tap: k,
  });
}
block(POLYMER_PRESS, { ...machine, name: 'Polymer Press', station: 'polypress', side: T.PRESS_SIDE, top: T.PRESS_TOP, bottom: T.IRON, stationBase: POLYMER_PRESS, machine: { load: 3 } });
for (let k = 0; k < 2; k++) {
  const on = !!k, t = on ? T.INSWIRE_ON : T.INSWIRE_OFF;
  block(INSULATED_WIRE + k, {
    name: 'Insulated Wire', shape: 'wire', sound: 'stone', hardness: 0.2, transparent: true, solid: false, switch: 'wire', on, floor: true,
    logic: 'wire', flip: INSULATED_WIRE + 1 - k, light: on ? 3 : 0, variantOf: k ? INSULATED_WIRE : 0, drop: INSULATED_WIRE,
    electric: { role: 'wire', carry: INSULATED_CARRY }, wireTex: [T.INSWIRE_OFF, T.INSWIRE_ON],
    model: [[6.5, 0, 0, 9.5, 1, 16, t], [0, 0, 6.5, 16, 1, 9.5, t]],
  });
}
ITEMS[TREE_TAP] = { name: 'Tree Tap', about: 'put it against a tree trunk: latex drips into it; tap it to collect' };
ITEMS[POLYMER_PRESS] = { name: 'Polymer Press', about: 'turn it with a shaft: it moulds sawdust and hide glue into polymer' };
ITEMS[INSULATED_WIRE] = { name: 'Insulated Wire', about: `like electrum wire, but carries twice the power (${INSULATED_CARRY} rather than ${WIRE_CARRY})` };
ITEMS[LATEX] = { name: 'Latex', about: 'cure it in an oven for rubber' };
ITEMS[RUBBER] = { name: 'Rubber' };
ITEMS[HIDE_GLUE] = { name: 'Hide Glue', about: 'render leather in an oven for it; binds sawdust in the polymer press' };
ITEMS[POLYMER_PELLETS] = { name: 'Polymer Pellets' };
ITEMS[POLYMER_SHEET] = { name: 'Polymer Sheet' };
RECIPES.push(
  { out: [TREE_TAP, 1], in: [[PLANKS, 3], [IRON_INGOT, 1]], table: true, metal: IRON_INGOT },
  { out: [POLYMER_PRESS, 1], in: [[IRON_INGOT, 4], [STONE, 2], [kineticId('gear', 0), 1], [PLANKS, 2]], table: true, metal: IRON_INGOT },
  { out: [INSULATED_WIRE, 4], in: [[ELECTRUM_WIRE, 4], [RUBBER, 1]], table: true },
);

// ---------- v32 B: polymer blocks and gear ----------
// Polymer sheets, dyed, make smooth coloured blocks; with a glow shell, a clear panel that lights a room. Rubber
// on planks makes a bounce pad that throws you back up as high as you fell (or a bit more than a jump), and
// never hurts. Padded boots stop all fall damage. Polymer tools are light and quick, but not as hard-wearing
// as metal; a polymer boat is faster than a wooden one.
export const BOUNCE_PAD = 1485, POLYMER_BLOCK = 1486, LUMEN_PANEL = 1496; // polymer blocks 1486..1495: + colour
export const POLYMER_TOOLS = 3176, POLYMER_BOAT = 3180, PADDED_BOOTS = 3181; // tools 3176..3179: pick, axe, shovel, sword
export const polymerTool = (kind) => POLYMER_TOOLS + ['pick', 'axe', 'shovel', 'sword'].indexOf(kind);
block(BOUNCE_PAD, { name: 'Bounce Pad', sound: 'wool', top: T.BOUNCE_TOP, side: T.BOUNCE_SIDE, bottom: T.PLANKS, hardness: 0.8, bounce: 11 });
COLORS.forEach((c, i) => block(POLYMER_BLOCK + i, { name: `${c.name} Polymer`, sound: 'stone', tex: T.POLY_COL + i, hardness: 1.2, color: i }));
block(LUMEN_PANEL, { name: 'Lumen Panel', sound: 'glass', tex: T.LUMEN, transparent: true, hardness: 0.6, light: 14 });
ITEMS[BOUNCE_PAD] = { name: 'Bounce Pad', about: 'land on it to bounce back up; it never hurts' };
ITEMS[LUMEN_PANEL] = { name: 'Lumen Panel', about: 'a clear panel that glows' };
['pick', 'axe', 'shovel'].forEach((kind, i) => {
  ITEMS[POLYMER_TOOLS + i] = {
    name: `Polymer ${KIND_NAMES[kind]}`, mat: 'polymer', wearMax: 350, repair: POLYMER_SHEET,
    tool: { type: kind, speed: 9, tier: 3, damage: KIND_DAMAGE[kind] + 2 }, about: 'light and quick, but wears out sooner than metal',
  };
});
ITEMS[polymerTool('sword')] = { name: 'Polymer Sword', mat: 'polymer', wearMax: 350, repair: POLYMER_SHEET, tool: { type: 'sword', speed: 1, tier: 0, damage: 8 } };
ITEMS[POLYMER_BOAT] = { name: 'Polymer Boat', stack: 1, vehicle: 'boat', fast: true, about: 'a light moulded hull: much faster than a wooden boat' };
ITEMS[PADDED_BOOTS] = { name: 'Padded Boots', stack: 1, armour: { piece: 3, points: 1 }, wearMax: 300, repair: RUBBER, guards: 'fall', about: 'rubber soles: falls never hurt you' };
RECIPES.push(
  ...COLORS.map((c, i) => ({ out: [POLYMER_BLOCK + i, 4], in: [[POLYMER_SHEET, 2], [DYE + i, 1]], metal: DYE + i })),
  { out: [LUMEN_PANEL, 2], in: [[POLYMER_SHEET, 2], [GLOW_SHELL, 1]] },
  { out: [BOUNCE_PAD, 1], in: [[RUBBER, 4], [PLANKS, 1]], table: true },
  { out: [PADDED_BOOTS, 1], in: [[RUBBER, 3], [LEATHER, 2]], table: true },
  { out: [polymerTool('pick'), 1], in: [[POLYMER_SHEET, 3], [STICK, 2]], table: true },
  { out: [polymerTool('axe'), 1], in: [[POLYMER_SHEET, 3], [STICK, 2]], table: true },
  { out: [polymerTool('shovel'), 1], in: [[POLYMER_SHEET, 1], [STICK, 2]], table: true },
  { out: [polymerTool('sword'), 1], in: [[POLYMER_SHEET, 2], [STICK, 1]], table: true },
  { out: [POLYMER_BOAT, 1], in: [[POLYMER_SHEET, 5], [STICK, 2]], table: true },
);

// ---------- v32 C: demolition charges ----------
// A demolition charge is a bigger blasting charge that has no fuse: link it to a detonator (tap it with one; a
// red light shows it's armed), walk well away, and use the detonator to set off every charge linked to it.
export const DEMO_CHARGE = 1497, DETONATOR = 3182; // 1498 = armed
export const DEMO_RADIUS = 3.8, DETONATOR_LINKS = 16, DETONATOR_RANGE = 96;
for (let k = 0; k < 2; k++) {
  block(DEMO_CHARGE + k, {
    name: 'Demolition Charge', sound: 'wool', side: T.DEMO_SIDE, top: k ? T.DEMO_ARMED : T.DEMO_TOP, bottom: T.DEMO_SIDE, hardness: 0.3,
    light: k ? 4 : 0, variantOf: k ? DEMO_CHARGE : 0, drop: DEMO_CHARGE,
  });
}
ITEMS[DEMO_CHARGE] = { name: 'Demolition Charge', about: 'a big charge with no fuse: link it to a detonator, then set it off from a distance' };
ITEMS[DETONATOR] = { name: 'Detonator', stack: 1, about: `tap demolition charges to link them (up to ${DETONATOR_LINKS}); use it anywhere else to set them all off` };
RECIPES.push(
  { out: [DEMO_CHARGE, 1], in: [[BLAST_CHARGE, 2], [POLYMER_SHEET, 1], [COPPER_INGOT, 1]], table: true, metal: GUNPOWDER },
  { out: [DETONATOR, 1], in: [[POLYMER_SHEET, 2], [INSULATED_WIRE, 2], [COPPER_INGOT, 1], [RUBBER, 1]], table: true },
);

// ---------- v33: cocoa and chocolate ----------
// Cocoa trees grow wild in the warmest green land, at the edge of the deserts. Their pods ripen in any season
// but winter (and more slowly than orchard fruit), and pick like fruit. Pods split into beans; roast the beans
// in an oven and grind them with the mortar into cocoa powder. Cocoa powder, milk and sugar make chocolate
// milk, which an oven heats into hot chocolate. Melt cocoa powder, sugar and butter in the cooking pot, pour
// it into a chocolate mould and leave it to set (faster somewhere cold), then tap the mould for chocolate bars.
// Bars go into a chocolate cake you set down and eat a slice at a time, and into a few sweets.
export const COCOA_SAPLING = 1499, COCOA_LEAVES = 1500, // 1501 = with ripe pods
  CHOC_MOULD = 1502, // 1502..1505: empty, just poured, setting, set
  CHOC_CAKE = 1506; // 1506..1509: + slices eaten (4 slices)
export const COCOA_POD = 3183, COCOA_BEANS = 3184, ROASTED_COCOA = 3185, COCOA_POWDER = 3186, CHOC_MILK = 3187, HOT_CHOC = 3188,
  MELTED_CHOC = 3189, CHOC_BAR = 3190, CHOC_COOKIE = 3191, CHOC_CHERRIES = 3192;
export const CAKE_SLICES = 4, MOULD_BARS = 4;
export const saplingLeaves = (id) => (id === COCOA_SAPLING ? COCOA_LEAVES : id >= FRUIT_SAPLING && id < FRUIT_SAPLING + FRUITS.length ? fruitLeaves(id - FRUIT_SAPLING) : 0);
block(COCOA_SAPLING, { ...plant, name: 'Cocoa Sapling', tex: T.COCOA_SAPLING, grows: 'tree' });
for (const ripe of [false, true]) {
  block(COCOA_LEAVES + (ripe ? 1 : 0), {
    name: 'Cocoa Leaves', sound: 'leaves', tex: ripe ? T.COCOA_RIPE : T.COCOA_LEAVES, transparent: true, hardness: 0.3,
    grows: 'fruit', fruit: { kind: -1, ripe, bare: COCOA_LEAVES, ripeId: COCOA_LEAVES + 1, item: COCOA_POD, tropical: true }, variantOf: ripe ? COCOA_LEAVES : 0,
    drop: () => [[COCOA_SAPLING, Math.random() < 0.08 ? 1 : 0], [STICK, Math.random() < 0.12 ? 1 : 0], [COCOA_POD, ripe ? 1 : 0]],
  });
}
const MOULD_MODEL = (k) => [
  [2, 0, 2, 14, 1, 14, T.MOULD], [2, 1, 2, 14, 3, 3, T.MOULD], [2, 1, 13, 14, 3, 14, T.MOULD], [2, 1, 3, 3, 3, 13, T.MOULD], [13, 1, 3, 14, 3, 13, T.MOULD],
  [7.5, 1, 3, 8.5, 3, 13, T.MOULD], // the divider between the bars
  ...(k ? [[3, 1, 3, 13, k === 1 ? 2.6 : 2.2, 13, k === 1 ? T.CHOC_LIQUID : T.CHOC]] : []),
];
for (let k = 0; k < 4; k++) {
  block(CHOC_MOULD + k, {
    name: 'Chocolate Mould', sound: 'stone', transparent: true, solid: false, hardness: 0.5, model: MOULD_MODEL(k), boxes: [[2, 0, 2, 14, 3, 14]],
    variantOf: k ? CHOC_MOULD : 0, drop: () => [[CHOC_MOULD, 1], ...(k === 3 ? [[CHOC_BAR, MOULD_BARS]] : [])], grows: k === 1 || k === 2 ? 'setting' : null,
  });
}
for (let k = 0; k < CAKE_SLICES; k++) {
  const w = 14 * (CAKE_SLICES - k) / CAKE_SLICES;
  block(CHOC_CAKE + k, {
    name: 'Chocolate Cake', sound: 'wool', transparent: true, hardness: 0.3, model: [[1, 0, 1, 1 + w, 8, 15, { side: T.CAKE_SIDE, top: T.CAKE_TOP, bottom: T.CAKE_SIDE }]],
    boxes: [[1, 0, 1, 1 + w, 8, 15]], variantOf: k ? CHOC_CAKE : 0, drop: k ? 0 : CHOC_CAKE,
  });
}
ITEMS[COCOA_SAPLING] = { name: 'Cocoa Sapling', about: 'grows best in warm land' };
ITEMS[CHOC_MOULD] = { name: 'Chocolate Mould', about: 'pour melted chocolate into it, leave it to set (faster somewhere cold), then tap it for bars' };
ITEMS[CHOC_CAKE] = { name: 'Chocolate Cake', stack: 4, about: `set it down and tap it to eat a slice (${CAKE_SLICES} slices)` };
ITEMS[COCOA_POD] = { name: 'Cocoa Pod', about: 'split it open for cocoa beans' };
ITEMS[COCOA_BEANS] = { name: 'Cocoa Beans', about: 'roast them in an oven' };
ITEMS[ROASTED_COCOA] = { name: 'Roasted Cocoa Beans', about: 'grind them with the mortar' };
ITEMS[COCOA_POWDER] = { name: 'Cocoa Powder' };
ITEMS[CHOC_MILK] = { name: 'Chocolate Milk', stack: 8, food: 5, bottle: true, about: 'heat it in an oven for hot chocolate' };
ITEMS[HOT_CHOC] = { name: 'Hot Chocolate', stack: 8, food: 7, meal: ['warm', 420], bottle: true, about: 'warms you right through' };
ITEMS[MELTED_CHOC] = { name: 'Melted Chocolate', stack: 8, bottle: true, about: 'pour it into a chocolate mould' };
ITEMS[CHOC_BAR] = { name: 'Chocolate Bar', food: 5, meal: ['swift', 60], about: 'get a burst of energy' };
ITEMS[CHOC_COOKIE] = { name: 'Chocolate Cookie', food: 4 };
ITEMS[CHOC_CHERRIES] = { name: 'Chocolate Cherries', food: 7, meal: ['heal', 4], about: 'heals you' };
RECIPES.push(
  { out: [COCOA_BEANS, 3], in: [[COCOA_POD, 1]] },
  { out: [COCOA_POWDER, 1], in: [[ROASTED_COCOA, 2]], tools: [MORTAR] },
  { out: [CHOC_MILK, 3], in: [[MILK_BUCKET, 1], [COCOA_POWDER, 2], [SUGAR, 1], [GLASS_BOTTLE, 3]], also: [[BUCKET, 1]] },
  { out: [CHOC_MOULD, 1], in: [[TIN_INGOT, 3]], table: true, metal: TIN_INGOT },
  { out: [CHOC_COOKIE, 4], in: [[COOKIE, 4], [COCOA_POWDER, 1]] },
  { out: [CHOC_CHERRIES, 2], in: [[CHERRIES, 4], [CHOC_BAR, 1]] },
  { out: [CHOC_CAKE, 1], in: [[CHOC_BAR, 2], [CHOC_MILK, 1], [FLOUR, 2], [EGG, 1], [SUGAR, 1]], also: [[GLASS_BOTTLE, 1]], table: true },
);

// ---------- v34 A: pork and chicken ----------
// Pigs and chickens are farm animals: a grown one can be butchered with a sword or an axe (see mobs.butcher).
// Every other animal is only ever bumped. Raw chicken can give you food poisoning; cook it first.
export const RAW_PORK = 3193, ROAST_PORK = 3194, RAW_CHICKEN = 3195, ROAST_CHICKEN = 3196, CHICKEN_SOUP = 3197, PORK_PIE = 3198, PORK_AND_BEANS = 3199;
ITEMS[RAW_PORK] = { name: 'Raw Pork', food: 3, meat: true };
ITEMS[ROAST_PORK] = { name: 'Roast Pork', food: 8, meat: true };
ITEMS[RAW_CHICKEN] = { name: 'Raw Chicken', food: 2, meat: true, risky: 0.5, about: 'cook it first, or risk food poisoning' };
ITEMS[ROAST_CHICKEN] = { name: 'Roast Chicken', food: 7, meat: true };
ITEMS[CHICKEN_SOUP] = { name: 'Chicken Soup', food: 10, meal: ['heal', 6], about: 'heals you and cures food poisoning' };
ITEMS[PORK_PIE] = { name: 'Pork Pie', food: 14, meal: ['fed', 600], about: 'keeps you full for a long time' };
ITEMS[PORK_AND_BEANS] = { name: 'Pork and Beans', food: 12, meal: ['warm', 300], about: 'warms you through' };

// ---------- v34 B: dairy and preserving ----------
// Spin milk in the comb centrifuge for cream (it churns into twice the butter). The freezer makes ice cream and
// ice lollies, which cool you down in the desert. Juice left in an urn sours into vinegar, for pickles and fish
// and chips. A chimney over a burning fireplace smokes fish, ham and cheese hung in it; a drying rack out in the
// sun dries fruit, grapes and pork (twice as fast in the desert, and not at all in the rain or at night).
export const DRYING_RACK = 1510;
export const CREAM = 3200, CHOC_ICE_CREAM = 3201, CHERRY_ICE_CREAM = 3202, HONEY_ICE_CREAM = 3203, ICE_LOLLY = 3204, VINEGAR = 3205,
  PICKLES = 3206, FISH_AND_CHIPS = 3207, SMOKED_FISH = 3208, SMOKED_HAM = 3209, SMOKED_CHEESE = 3210, RAISINS = 3211, DRIED_FRUIT = 3212,
  JERKY = 3213, TRAIL_MIX = 3214;
// (seconds for each to turn into the next)
export const URN_AGING = { [GRAPE_JUICE]: [VINEGAR, 1], [APPLE_JUICE]: [VINEGAR, 1], [BERRY_JUICE]: [VINEGAR, 1] }; // (game days)
export const SMOKING = { [RAW_FISH]: [SMOKED_FISH, 60], [SALMON]: [SMOKED_FISH, 60], [ICEFISH]: [SMOKED_FISH, 60], [RAW_PORK]: [SMOKED_HAM, 120], [CHEESE]: [SMOKED_CHEESE, 120] };
export const DRYING = { [GRAPES]: [RAISINS, 90], [APPLE]: [DRIED_FRUIT, 90], [CHERRIES]: [DRIED_FRUIT, 90], [ORANGE_FRUIT]: [DRIED_FRUIT, 90], [BERRIES]: [DRIED_FRUIT, 90], [RAW_PORK]: [JERKY, 150] };
BLOCKS[CHIMNEY].station = 'smokehouse';
const RACK_MODEL = [
  [1, 0, 7, 2, 14, 9, wood], [14, 0, 7, 15, 14, 9, wood], // the posts
  [1, 13, 7.5, 15, 14, 8.5, wood], [1, 9, 7.5, 15, 10, 8.5, wood], [1, 5, 7.5, 15, 6, 8.5, wood], // the rails
  [2, 6, 7.2, 14, 13, 7.6, T.RACK], // the netting
];
block(DRYING_RACK, { ...furniture, name: 'Drying Rack', station: 'dryrack', model: RACK_MODEL, boxes: [[1, 0, 7, 15, 14, 9]] });
ITEMS[DRYING_RACK] = { name: 'Drying Rack', about: 'out in the sun it dries fruit, grapes and pork (fastest in the desert)' };
ITEMS[CREAM] = { name: 'Cream', about: 'churn it for butter, or freeze it into ice cream' };
ITEMS[CHOC_ICE_CREAM] = { name: 'Chocolate Ice Cream', food: 6, meal: ['cool', 300], about: 'cools you down in the heat' };
ITEMS[CHERRY_ICE_CREAM] = { name: 'Cherry Ice Cream', food: 6, meal: ['cool', 300], about: 'cools you down in the heat' };
ITEMS[HONEY_ICE_CREAM] = { name: 'Honey Ice Cream', food: 6, meal: ['cool', 300], about: 'cools you down in the heat' };
ITEMS[ICE_LOLLY] = { name: 'Ice Lolly', food: 3, meal: ['cool', 180], about: 'cools you down in the heat' };
ITEMS[VINEGAR] = { name: 'Vinegar', stack: 8, about: 'for pickles, and fish and chips' };
ITEMS[PICKLES] = { name: 'Pickles', stack: 8, food: 6, meal: ['fed', 400], bottle: true, about: 'keep you going for a long time' };
ITEMS[FISH_AND_CHIPS] = { name: 'Fish and Chips', food: 14, meal: ['fed', 400], about: 'keeps you full for a long time' };
ITEMS[SMOKED_FISH] = { name: 'Smoked Fish', food: 8, meal: ['fed', 300], about: 'keeps you full for longer', fish: true };
ITEMS[SMOKED_HAM] = { name: 'Smoked Ham', food: 10, meal: ['fed', 400], about: 'keeps you full for a long time', meat: true };
ITEMS[SMOKED_CHEESE] = { name: 'Smoked Cheese', food: 9, meal: ['warm', 300], about: 'warms you through' };
ITEMS[RAISINS] = { name: 'Raisins', food: 3 };
ITEMS[DRIED_FRUIT] = { name: 'Dried Fruit', food: 4 };
ITEMS[JERKY] = { name: 'Jerky', food: 6, meat: true };
ITEMS[TRAIL_MIX] = { name: 'Trail Mix', food: 8, meal: ['swift', 150], about: 'run faster' };
RECIPES.push(
  { out: [DRYING_RACK, 1], in: [[STICK, 6], [STRING, 2]], table: true },
  { out: [BUTTER, 2], in: [[CREAM, 1]], churn: true },
  { out: [PICKLES, 1], in: [[[ONION, BEANS, CARROT], 3], [VINEGAR, 1], [GLASS_BOTTLE, 1]] },
  { out: [TRAIL_MIX, 2], in: [[RAISINS, 1], [DRIED_FRUIT, 1], [ROASTED_COCOA, 1], [HONEY_DROP, 1]] },
);

// ---------- v34 C: oven dishes and moulded sweets ----------
// Fine crops work in these recipes as well as plain ones. The chocolate mould also takes melted toffee and honey
// syrup (from the cooking pot), each setting into its own sweets; each filling has its own three block states
// (poured, setting, set) after the chocolate ones, so a mould needs no saved contents.
export const PIZZA = 3215, CARROT_CAKE = 3216, PUMPKIN_BREAD = 3217, CHEESY_POTATO = 3218, TOFFEE = 3219, HONEY_CANDY = 3220,
  CANDIED_PEEL = 3221, MELTED_TOFFEE = 3222, HONEY_SYRUP = 3223;
export const MOULD_TOFFEE = 1511, MOULD_HONEY = 1514; // + 0 poured, 1 setting, 2 set
export const orFine = (id) => (FINE_CROPS[id] ? [id, FINE_CROPS[id]] : id);
// what each filling is, where its poured state starts, and what it sets into
export const MOULD_FILLS = [
  { liquid: MELTED_CHOC, poured: CHOC_MOULD + 1, out: CHOC_BAR, set: [T.CHOC_LIQUID, T.CHOC] },
  { liquid: MELTED_TOFFEE, poured: MOULD_TOFFEE, out: TOFFEE, set: [T.TOFFEE_LIQ, T.TOFFEE] },
  { liquid: HONEY_SYRUP, poured: MOULD_HONEY, out: HONEY_CANDY, set: [T.CANDY_LIQ, T.CANDY] },
];
// (fill, stage 1..3) for a mould id, or null if it isn't a filled mould
export const mouldFill = (id) => {
  for (const f of MOULD_FILLS) if (id >= f.poured && id < f.poured + 3) return { fill: f, stage: id - f.poured + 1 };
  return null;
};
for (const f of MOULD_FILLS.slice(1)) {
  for (let k = 1; k <= 3; k++) {
    const model = MOULD_MODEL(0).concat([[3, 1, 3, 13, k === 1 ? 2.6 : 2.2, 13, k === 1 ? f.set[0] : f.set[1]]]);
    block(f.poured + k - 1, {
      name: 'Chocolate Mould', sound: 'stone', transparent: true, solid: false, hardness: 0.5, model, boxes: [[2, 0, 2, 14, 3, 14]],
      variantOf: CHOC_MOULD, drop: () => [[CHOC_MOULD, 1], ...(k === 3 ? [[f.out, MOULD_BARS]] : [])], grows: k < 3 ? 'setting' : null,
    });
  }
}
ITEMS[PIZZA] = { name: 'Pizza', food: 14, meal: ['fed', 400], about: 'keeps you full for a long time' };
ITEMS[CARROT_CAKE] = { name: 'Carrot Cake', food: 12, meal: ['night', 180], about: 'see in the dark' };
ITEMS[PUMPKIN_BREAD] = { name: 'Pumpkin Bread', food: 9 };
ITEMS[CHEESY_POTATO] = { name: 'Cheesy Jacket Potato', food: 11, meal: ['warm', 300], about: 'warms you through' };
ITEMS[TOFFEE] = { name: 'Toffee', food: 4, meal: ['swift', 60], about: 'get a burst of energy' };
ITEMS[HONEY_CANDY] = { name: 'Honey Candy', food: 3, meal: ['heal', 3], about: 'soothes and heals you' };
ITEMS[CANDIED_PEEL] = { name: 'Candied Peel', food: 3 };
ITEMS[MELTED_TOFFEE] = { name: 'Melted Toffee', stack: 8, bottle: true, about: 'pour it into a mould' };
ITEMS[HONEY_SYRUP] = { name: 'Honey Syrup', stack: 8, bottle: true, about: 'pour it into a mould' };

// ---------- v34 D: coffee, rice and chillies ----------
// Coffee bushes grow wild in the warm land by the deserts, chillies in the desert itself, and rice on river
// banks. Coffee and chillies only grow in warm land (or in a greenhouse anywhere); rice needs water right beside
// the ground it's planted in. Chillies and rice can be planted on sand as well as grass and dirt.
export const COFFEE_CROP = 1517, RICE_CROP = 1521, CHILLI_CROP = 1525; // 4 stages each (3 is ripe)
export const COFFEE_CHERRIES = 3224, RICE = 3225, CHILLI = 3226, ROASTED_COFFEE = 3227, GROUND_COFFEE = 3228, COFFEE = 3229, MOCHA = 3230,
  RICE_PUDDING = 3231, FISH_RICE = 3232, HOT_SAUCE = 3233, CHILLI_CON_CARNE = 3234;
for (const [base, kind, seed, tex, name, n, needs] of [[COFFEE_CROP, 'coffee', COFFEE_CHERRIES, T.COFFEE_0, 'Coffee Bush', 2, 'warm'],
  [RICE_CROP, 'rice', RICE, T.RICE_0, 'Rice', 3, 'water'], [CHILLI_CROP, 'chilli', CHILLI, T.CHILLI_0, 'Chilli Plant', 2, 'warm']]) {
  for (let k = 0; k < 4; k++) {
    block(base + k, {
      ...plant, name, tex: tex + k, variantOf: seed, grows: k < 3 ? base + k + 1 : null,
      crop: { kind, stage: k, ripe: k === 3, seed, first: base, needs, sandy: kind !== 'coffee' },
      drop: k < 3 ? () => [[seed, 1]] : () => [[seed, n + Math.floor(Math.random() * 2)]],
    });
  }
}
ITEMS[COFFEE_CHERRIES] = { name: 'Coffee Cherries', places: COFFEE_CROP, about: 'roast them in an oven; plant them in warm land (or a greenhouse)' };
ITEMS[RICE] = { name: 'Rice', places: RICE_CROP, about: 'plant it right beside water (sand or soil)' };
ITEMS[CHILLI] = { name: 'Chilli', food: 1, places: CHILLI_CROP, about: 'plant it in warm land (or a greenhouse), even on sand' };
ITEMS[ROASTED_COFFEE] = { name: 'Roasted Coffee Beans', about: 'grind them with the mortar' };
ITEMS[GROUND_COFFEE] = { name: 'Ground Coffee', about: 'brew it in the cooking pot' };
ITEMS[COFFEE] = { name: 'Coffee', stack: 8, food: 2, meal: ['haste', 240], bottle: true, about: 'dig half as fast again' };
ITEMS[MOCHA] = { name: 'Mocha', stack: 8, food: 5, meal: ['haste', 360], bottle: true, about: 'dig half as fast again, for longer' };
ITEMS[RICE_PUDDING] = { name: 'Rice Pudding', food: 9, meal: ['warm', 300], about: 'warms you through' };
ITEMS[FISH_RICE] = { name: 'Fish and Rice', food: 11, meal: ['swift', 180], about: 'run faster' };
ITEMS[HOT_SAUCE] = { name: 'Hot Sauce', stack: 8, food: 1, meal: ['warm', 480], bottle: true, about: 'warms you right through' };
ITEMS[CHILLI_CON_CARNE] = { name: 'Chilli con Carne', food: 14, meal: ['warm', 600], about: 'warms you right through for a long time' };
RECIPES.push(
  { out: [GROUND_COFFEE, 1], in: [[ROASTED_COFFEE, 2]], tools: [MORTAR] },
  { out: [MOCHA, 2], in: [[COFFEE, 1], [CHOC_MILK, 1]] },
);

// ---------- v34 E: treats, and the festival food contest ----------
// Villagers pay well for treats at a stall. At every festival the village holds a food contest: tap its bell
// holding a dish (anything that does you good when you eat it, a treat, or one of the festival's favourites) to enter. The judges like a filling dish, a treat
// more, and each festival's favourites most of all.
for (const id of [CHOC_BAR, CHOC_COOKIE, CHOC_CHERRIES, HOT_CHOC, CHOC_ICE_CREAM, CHERRY_ICE_CREAM, HONEY_ICE_CREAM, ICE_LOLLY,
  CARROT_CAKE, PUMPKIN_BREAD, TOFFEE, HONEY_CANDY, CANDIED_PEEL, MOCHA, RICE_PUDDING, TRAIL_MIX]) ITEMS[id].treat = true;
export const FESTIVAL_FAVOURITES = [ // by season: Blossom Fair, Midsummer Feast, Harvest Festival, Frost Fair
  [HONEY_CANDY, CANDIED_PEEL, CARROT_CAKE, CHOC_CHERRIES, PICKLES],
  [CHOC_ICE_CREAM, CHERRY_ICE_CREAM, HONEY_ICE_CREAM, ICE_LOLLY, PIZZA, FISH_AND_CHIPS],
  [PUMPKIN_BREAD, PORK_PIE, ROAST_PORK, CHEESY_POTATO, TRAIL_MIX, SMOKED_HAM],
  [HOT_CHOC, MOCHA, CHILLI_CON_CARNE, CHICKEN_SOUP, RICE_PUDDING, TOFFEE],
];
export function contestScore(id, season) {
  const it = ITEMS[id], fav = FESTIVAL_FAVOURITES[season]?.includes(id);
  if (!it?.meal && !it?.treat && !fav) return 0;
  return (it.food ?? 0) + (it.treat ? 3 : 0) + (fav ? 8 : 0);
}

// ---------- v35: bat guano ----------
// Bats leave guano now and then as they flit about under ground, and drop some when you swat one. It burns (a
// little under half as long as coal), grinds into saltpetre for gunpowder, and makes good fertiliser.
export const GUANO = 3235;
ITEMS[GUANO] = { name: 'Bat Guano', about: 'burns as fuel, grinds into saltpetre, or makes fertiliser' };
RECIPES.push(
  { out: [SALTPETRE, 1], in: [[GUANO, 3]], tools: [MORTAR] },
  { out: [FERTILISER, 2], in: [[GUANO, 1]] },
);

// ---------- v35: the carpenter and crates ----------
// The carpenter is turned by a shaft. It makes empty crates from planks and sticks, packs 9 of a bulk item and an
// empty crate into a crated item (which stacks to 64, so a slot holds 9 stacks), and unpacks a crated item again,
// giving the empty crate back in its tray. You can also unpack one by hand, but the crate breaks. Every bulk thing has its own crated item, listed in CRATED (id -> what's
// inside); their icons are a crate with the item on it (see createIcons).
export const CARPENTER = 1529, CRATE = 3236, CRATED_BASE = 3300;
block(CARPENTER, { ...machine, sound: 'wood', tool: 'axe', name: 'Carpenter', station: 'carpenter', side: T.CARP_SIDE, top: T.CARP_TOP, bottom: T.PLANKS, stationBase: CARPENTER, machine: { load: 2 } });
ITEMS[CARPENTER] = { name: 'Carpenter', about: 'turn it with a shaft: it makes crates, and packs 9 of a thing into each one' };
ITEMS[CRATE] = { name: 'Crate', about: 'the carpenter packs 9 of a thing into it' };
RECIPES.push({ out: [CARPENTER, 1], in: [[PLANKS, 4], [LOG, 2], [IRON_INGOT, 2], [kineticId('gear', 0), 1]], table: true, metal: IRON_INGOT });
export const CRATED = {}; // crated id -> the item inside
export const CRATE_OF = {}; // item -> its crated id
const CRATEABLE = [COBBLE, STONE, DIRT, SAND, GRAVEL, CLAY, BASALT, OBSIDIAN, LOG, PLANKS, GLASS, BRICK, LEAVES, SAPLING, CACTUS,
  COAL, CHARCOAL, SULPHUR, SALTPETRE, FLINT, CLAY_BALL, WHEAT, SEEDS, SUGAR_CANE, CARROT, POTATO, PUMPKIN, BERRIES, APPLE, CHERRIES,
  ORANGE_FRUIT, GRAPES, ONION, BEANS, TOMATO, HERBS, RICE, COFFEE_CHERRIES, CHILLI, COCOA_BEANS, FLOUR, SUGAR, EGG, STICK, STRING, FEATHER,
  WOOL, LEATHER, RUBBER, SAWDUST, GUANO, ...ORES.flatMap((o) => [o.id, o.ingot])];
for (const id of Object.keys(ITEMS).map(Number)) if (/ (Ingot|Dust)$/.test(ITEMS[id]?.name ?? '')) CRATEABLE.push(id);
let crateN = 0;
for (const id of new Set(CRATEABLE.filter((i) => i && (ITEMS[i] || BLOCKS[i]) && maxStack(i) === 64))) {
  const cid = CRATED_BASE + crateN++;
  CRATED[cid] = id; CRATE_OF[id] = cid;
  ITEMS[cid] = { name: `Crated ${itemName(id)}`, crated: id, about: `9 × ${itemName(id)}: a carpenter unpacks it and keeps the crate; by hand the crate breaks` };
  // unpacking by hand breaks the crate (only listed once you have one of these: see `metal` in the recipe list)
  RECIPES.push({ out: [id, 9], in: [[cid, 1]], metal: cid });
}

// ---------- v35: the distillery ----------
// A copper still over a fire (it burns fuel like an oven). Grain mash (wheat or rice with water) distils into new
// spirit, which ages into whisky in an oak barrel, and old whisky after that. Distilled again, new spirit makes
// rubbing alcohol, for bandages. Any plant matter, with an empty bucket, ferments into a bucket of biofuel, which
// burns long and hot in a stove, an oven or a steam engine.
export const DISTILLERY = 1530;
export const NEW_SPIRIT = 3237, WHISKY = 3238, OLD_WHISKY = 3239, RUBBING_ALCOHOL = 3240, BIOFUEL_BUCKET = 3241, BANDAGE = 3242;
const copper = T.STILL_COPPER;
block(DISTILLERY, {
  name: 'Distillery', station: 'distillery', sound: 'metal', transparent: true, hardness: 2.5, tool: 'pick', stationBase: DISTILLERY,
  model: [
    [1, 0, 1, 15, 4, 15, T.BRICKS], // the firebox
    [3, 4, 3, 13, 11, 13, copper], [5, 11, 5, 11, 13, 11, copper], [7, 13, 7, 9, 15, 9, copper], // the pot and its neck
    [9, 14, 7.2, 15, 15, 8.8, copper], [14, 4, 7.2, 15, 14, 8.8, copper], // the pipe over and down to the worm
  ],
  boxes: [[1, 0, 1, 15, 15, 15]],
});
ITEMS[DISTILLERY] = { name: 'Distillery', about: 'burns fuel: distils whisky spirit and rubbing alcohol, and makes biofuel from plants' };
ITEMS[NEW_SPIRIT] = { name: 'New Spirit', stack: 8, about: 'age it in an oak barrel into whisky, or distil it again into rubbing alcohol' };
ITEMS[WHISKY] = { name: 'Whisky', stack: 8, food: 1, meal: ['warm', 600], bottle: true, about: 'warms you right through' };
ITEMS[OLD_WHISKY] = { name: 'Old Whisky', stack: 8, food: 2, meal: ['warm', 900], bottle: true, about: 'warms you right through for a long time; sells very well' };
ITEMS[RUBBING_ALCOHOL] = { name: 'Rubbing Alcohol', stack: 8, about: 'for bandages (not for drinking!)' };
ITEMS[BIOFUEL_BUCKET] = { name: 'Biofuel Bucket', stack: 1, about: 'burns for a long time in a stove, oven or steam engine (you keep the bucket)' };
ITEMS[BANDAGE] = { name: 'Bandage', stack: 16, about: 'tap to use: heals 4 hearts and cures food poisoning' };
AGING[NEW_SPIRIT] = [WHISKY, 2];
AGING[WHISKY] = [OLD_WHISKY, 4];
export const PLANT_MATTER = [SEEDS, SAPLING, LEAVES, SUGAR_CANE, CACTUS, CARROT, POTATO, PUMPKIN, BERRIES, APPLE, CHERRIES, ORANGE_FRUIT,
  GRAPES, ONION, BEANS, TOMATO, HERBS, SAWDUST, COFFEE_CHERRIES, CHILLI, COCOA_POD, ...FLOWERS.map((f) => f.id)].filter((i) => ITEMS[i] || BLOCKS[i]);
RECIPES.push(
  { out: [DISTILLERY, 1], in: [[COPPER_INGOT, 6], [BRICK, 3], [GLASS_BOTTLE, 1]], table: true, metal: COPPER_INGOT },
  { out: [BANDAGE, 3], in: [[WOOL, 1], [RUBBING_ALCOHOL, 1]], also: [[GLASS_BOTTLE, 1]] },
);
