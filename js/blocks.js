// Block and item definitions.

// Block ids (< 100). Stored in the world Uint8Array.
export const AIR = 0, GRASS = 1, DIRT = 2, STONE = 3, COBBLE = 4, LOG = 5, PLANKS = 6,
  LEAVES = 7, SAND = 8, GLASS = 9, TABLE = 10, BRICKS = 11, COAL_ORE = 12, BEDROCK = 13;

// Item-only ids (>= 100). Only ever live in the inventory.
export const STICK = 100, COAL = 101,
  WOOD_PICK = 110, STONE_PICK = 111,
  WOOD_AXE = 112, STONE_AXE = 113,
  WOOD_SHOVEL = 114, STONE_SHOVEL = 115;

// Texture atlas tile indices.
export const T = {
  GRASS_TOP: 0, GRASS_SIDE: 1, DIRT: 2, STONE: 3, COBBLE: 4, LOG_SIDE: 5, LOG_TOP: 6,
  PLANKS: 7, LEAVES: 8, SAND: 9, GLASS: 10, TABLE_TOP: 11, TABLE_SIDE: 12, BRICKS: 13,
  COAL_ORE: 14, BEDROCK: 15,
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
    drop: o.drop ?? id, // id, or function returning id (0 = nothing)
  };
}

block(GRASS, { name: 'Grass', top: T.GRASS_TOP, bottom: T.DIRT, side: T.GRASS_SIDE, hardness: 0.9, tool: 'shovel', drop: DIRT });
block(DIRT, { name: 'Dirt', tex: T.DIRT, hardness: 0.75, tool: 'shovel' });
block(STONE, { name: 'Stone', tex: T.STONE, hardness: 2.25, tool: 'pick', needsTool: true, drop: COBBLE });
block(COBBLE, { name: 'Cobblestone', tex: T.COBBLE, hardness: 2.5, tool: 'pick', needsTool: true });
block(LOG, { name: 'Log', top: T.LOG_TOP, bottom: T.LOG_TOP, side: T.LOG_SIDE, hardness: 2.5, tool: 'axe' });
block(PLANKS, { name: 'Planks', tex: T.PLANKS, hardness: 2, tool: 'axe' });
block(LEAVES, { name: 'Leaves', tex: T.LEAVES, transparent: true, hardness: 0.3, drop: () => (Math.random() < 0.12 ? STICK : 0) });
block(SAND, { name: 'Sand', tex: T.SAND, hardness: 0.75, tool: 'shovel' });
block(GLASS, { name: 'Glass', tex: T.GLASS, transparent: true, hardness: 0.4 });
block(TABLE, { name: 'Crafting Table', top: T.TABLE_TOP, bottom: T.PLANKS, side: T.TABLE_SIDE, hardness: 2.5, tool: 'axe' });
block(BRICKS, { name: 'Stone Bricks', tex: T.BRICKS, hardness: 2.5, tool: 'pick', needsTool: true });
block(COAL_ORE, { name: 'Coal Ore', tex: T.COAL_ORE, hardness: 3, tool: 'pick', needsTool: true, drop: COAL });
block(BEDROCK, { name: 'Bedrock', tex: T.BEDROCK, hardness: Infinity });

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
};

export function isBlock(id) {
  return id > 0 && id < 100 && !!BLOCKS[id];
}

export function itemName(id) {
  return isBlock(id) ? BLOCKS[id].name : ITEMS[id]?.name ?? '?';
}

export function maxStack(id) {
  return ITEMS[id]?.tool ? 1 : 64;
}

// Seconds needed to break `blockId` while holding `heldId`.
export function breakTime(blockId, heldId) {
  const b = BLOCKS[blockId];
  if (!b || b.hardness === Infinity) return Infinity;
  const tool = ITEMS[heldId]?.tool;
  if (tool && b.tool === tool.type) return b.hardness / tool.speed;
  return b.needsTool ? b.hardness * 3.3 : b.hardness;
}

// What breaking `blockId` with `heldId` yields (0 = nothing).
export function dropFor(blockId, heldId) {
  const b = BLOCKS[blockId];
  if (!b) return 0;
  if (b.needsTool && ITEMS[heldId]?.tool?.type !== b.tool) return 0;
  return typeof b.drop === 'function' ? b.drop() : b.drop;
}

// Crafting recipes. `table: true` means a crafting table must be nearby.
export const RECIPES = [
  { out: [PLANKS, 4], in: [[LOG, 1]] },
  { out: [STICK, 4], in: [[PLANKS, 2]] },
  { out: [TABLE, 1], in: [[PLANKS, 4]] },
  { out: [WOOD_PICK, 1], in: [[PLANKS, 3], [STICK, 2]], table: true },
  { out: [WOOD_AXE, 1], in: [[PLANKS, 3], [STICK, 2]], table: true },
  { out: [WOOD_SHOVEL, 1], in: [[PLANKS, 1], [STICK, 2]], table: true },
  { out: [STONE_PICK, 1], in: [[COBBLE, 3], [STICK, 2]], table: true },
  { out: [STONE_AXE, 1], in: [[COBBLE, 3], [STICK, 2]], table: true },
  { out: [STONE_SHOVEL, 1], in: [[COBBLE, 1], [STICK, 2]], table: true },
  { out: [BRICKS, 4], in: [[COBBLE, 4]], table: true },
  { out: [GLASS, 4], in: [[SAND, 4], [COAL, 1]], table: true },
];
