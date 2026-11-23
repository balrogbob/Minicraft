// Procedurally painted pixel-art textures: the block atlas, UI icons and break cracks.
import {
  T, BLOCKS, isBlock, TORCH, STICK, COAL, WOOD_PICK, STONE_PICK, WOOD_AXE, STONE_AXE, WOOD_SHOVEL, STONE_SHOVEL,
  SEEDS, WHEAT, FLOUR, SUGAR, BUTTER, BREAD, COOKIE, CAKE, BUCKET, MILK_BUCKET, SLIME_BUCKET, FEATHER, MORTAR,
  STRING, ARROW, BOW, COAL_DUST, SLIME_FUEL, BED, FURN_TABLE, CHAIR, LAMP, CARPET, CURTAIN, DOOR, CHARCOAL,
  FISHING_ROD, RAW_FISH, BAKED_FISH, ORES, TOOL_MATERIALS, TOOL_KINDS, metalTool, SULPHUR,
  IRON_INGOT, COPPER_INGOT, TIN_INGOT, LEAD_INGOT, ZINC_INGOT, ALUMINIUM_INGOT, SILVER_INGOT, GOLD_INGOT,
  TUNGSTEN_INGOT, BRONZE_INGOT, ELECTRUM_INGOT, STAINLESS_INGOT, STEEL_INGOT, AL_BRONZE_INGOT,
  FLINT, CLAY_BALL, BRICK, FIRE_CLAY, FIRE_BRICK, FLINT_DUST, CLAY_DUST, WATER_BUCKET, oreDust,
  WATER_WHEEL, KINETIC_MATS, kineticId,
  LADDER, SCAFFOLD, SIGN, WOOD_SWORD, STONE_SWORD, metalSword, HIDE, LEATHER, ARMOUR_MATS, ARMOUR_PIECES, armourId,
  PLATE_METALS, PLATES,
  PIPE, SPOUT, BELT, HOPPER, WINDMILL, FILAMENT, DRILL_BIT,
  RAIL, POWERED_RAIL, CACTUS, MINECART, MAP, PAPER,
  COLORS, DYE, CLUTCH, DRIVE_BELT, FLYWHEEL, GEAR_SHIFT, STORAGE_CART, LOADER_RAIL, SWITCH_RAIL, PAINTED_DOOR, PAINTING,
  BERRIES, GLASS_BOTTLE, NIGHT_TEA, HASTE_TEA, FIRE_TEA, HEAL_TEA, WOOD_SHIELD, IRON_SHIELD, KING_CROWN,
  SUN_SCARAB, FROST_HEART, EMBER_CORE, SUN_MASK, FROST_CIRCLET, EMBER_CROWN, HONEY_TEA, MUSHROOM_STEW, FISH_PIE, COPY_WAND,
  CRYSTAL_SHARD, HONEY_BOTTLE, HONEYCOMB, SALMON, BAKED_SALMON, ICEFISH, BAKED_ICEFISH, PUFFERFISH, OLD_BOOT,
  BATTERY, PORTABLE_LAMP, JACKHAMMER, JETPACK, ELECTRIC_DRILL, HOVER_BOOTS, NV_GOGGLES, MAGNET_RING, WIND_TURBINE, NICKEL_INGOT, CUPRONICKEL_INGOT,
  ELECTRIC_RAIL, CHAINSAW, SAWDUST, BOOK, BACKPACK, BIG_BACKPACK, HUGE_BACKPACK, SPANNER, GRAPPLE, URANIUM_INGOT, FUEL_ROD, JOURNAL, FERTILISER, SPENT_ROD, ENRICHED_URANIUM, ENRICHED_ROD, hazmatId, INVAR_INGOT, RAIL_STATION, BOAT, BALLOON, ZIP_LINE, METEORIC_IRON, STARSTEEL_INGOT, starsteelTool, EGG, FRIED_EGG, SADDLE, TRUFFLE, FLOWER_POT, HANGING_PLANT, WINDOW_BOX, APPLE, CHERRIES, ORANGE_FRUIT, APPLE_PIE, CHERRY_PIE, FRUIT_SALAD, ORANGE_JUICE, FISH_SOUP, TRUFFLE_SOUP, BERRY_JAM, COOK_POT, SCARECROW, EXPLORER_MAP, TREASURE_MAP, BEESWAX, CABLE_CAR, COIN, CARROT, POTATO, BAKED_POTATO, PUMPKIN_SEEDS, PUMPKIN_PIE, GRAPES, GRAPE_JUICE, WINE, FINE_WINE, CURDS, CHEESE, AGED_CHEESE, DIVING_HELMET, FLIPPERS, PEARL, LOCOMOTIVE, FIREWORK, UNFIRED_URN, GLOW_SHELL,
  ONION, BEANS, TOMATO, HERBS, APPLE_JUICE, BERRY_JUICE, CIDER, VINTAGE_CIDER, BERRY_WINE, FINE_BERRY_WINE, VEG_STEW, TOMATO_SOUP, BAKED_BEANS,
  dirtyDust, SLUDGE, SLAG, WORM, SPEED_UPGRADE, EFFICIENCY_UPGRADE, YIELD_UPGRADE,
  FINE_CROPS, CHEST_BOAT, LP_ROLES, LP_PIPE, REMOTE_ORDERER, LP_SENSOR, LP_FPROVIDER, LP_FSUPPLIER, LP_FSINK, SADDLEBAGS, HORSE_ARMOUR, LAVENDER_HONEY, BLOSSOM_HONEY, GOLDEN_HONEY, LAVENDER_TEA, BLOSSOM_TEA, GOLDEN_TEA,
  SALTPETRE, GUNPOWDER, LEAD_SINKER, WEIGHTED_ROD, LEAD_BUCKET, LAVA_BUCKET, GOLD_CLOCK, COMPASS, SILVER_ARROW, MIRROR_LAMP,
} from './blocks.js';

export const TILE = 16;
export const ATLAS_COLS = 32; // 32 x 32 tiles

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const clamp = (v) => Math.max(0, Math.min(255, Math.round(v)));

class Tile {
  constructor(rand) {
    this.r = rand;
    this.d = new Uint8ClampedArray(TILE * TILE * 4);
  }
  set(x, y, c, a = 255) {
    const i = ((y & 15) * TILE + (x & 15)) * 4;
    this.d[i] = clamp(c[0]); this.d[i + 1] = clamp(c[1]); this.d[i + 2] = clamp(c[2]); this.d[i + 3] = a;
  }
  vary(c, amt) {
    const f = 1 + (this.r() - 0.5) * amt;
    return [c[0] * f, c[1] * f, c[2] * f];
  }
  fill(c, amt) {
    for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) this.set(x, y, this.vary(c, amt));
  }
  speckle(c, chance, amt = 0.1) {
    for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) if (this.r() < chance) this.set(x, y, this.vary(c, amt));
  }
}

const P = {
  [T.GRASS_TOP](t) {
    t.fill([95, 159, 53], 0.28);
    t.speckle([120, 185, 70], 0.12);
  },
  [T.DIRT](t) {
    t.fill([134, 96, 67], 0.25);
    t.speckle([105, 74, 50], 0.15);
    t.speckle([160, 120, 88], 0.06);
  },
  [T.GRASS_SIDE](t) {
    P[T.DIRT](t);
    for (let x = 0; x < TILE; x++) {
      const depth = 3 + (t.r() < 0.5 ? 1 : 0) + (t.r() < 0.2 ? 1 : 0);
      for (let y = 0; y < depth; y++) t.set(x, y, t.vary([88, 150, 50], 0.25));
    }
  },
  [T.STONE](t) {
    t.fill([128, 128, 128], 0.16);
    for (let i = 0; i < 7; i++) {
      let x = (t.r() * 16) | 0, y = (t.r() * 16) | 0;
      const len = 2 + ((t.r() * 3) | 0);
      for (let k = 0; k < len; k++) { t.set(x + k, y, t.vary([104, 104, 104], 0.1)); }
    }
  },
  [T.COBBLE](t) {
    const pts = [];
    for (let i = 0; i < 9; i++) pts.push([t.r() * 16, t.r() * 16, 105 + t.r() * 50]);
    for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) {
      let d1 = 1e9, d2 = 1e9, g = 0;
      for (const p of pts) {
        // wrap-around distance so the tile is seamless
        let dx = Math.abs(x + 0.5 - p[0]); dx = Math.min(dx, 16 - dx);
        let dy = Math.abs(y + 0.5 - p[1]); dy = Math.min(dy, 16 - dy);
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < d1) { d2 = d1; d1 = d; g = p[2]; } else if (d < d2) d2 = d;
      }
      if (d2 - d1 < 1.1) t.set(x, y, t.vary([70, 70, 70], 0.15));
      else t.set(x, y, t.vary([g, g, g], 0.12));
    }
  },
  [T.LOG_SIDE](t) {
    for (let x = 0; x < TILE; x++) {
      const dark = t.r() < 0.3;
      const col = dark ? [76, 58, 36] : t.vary([104, 82, 51], 0.15);
      for (let y = 0; y < TILE; y++) t.set(x, y, t.vary(col, 0.12));
    }
  },
  [T.LOG_TOP](t) {
    for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) {
      const d = Math.max(Math.abs(x - 7.5), Math.abs(y - 7.5));
      if (d > 6.5) t.set(x, y, t.vary([90, 70, 43], 0.15));
      else t.set(x, y, t.vary(Math.floor(d) % 2 ? [176, 141, 88] : [154, 121, 73], 0.08));
    }
  },
  [T.PLANKS](t) {
    for (let y = 0; y < TILE; y++) {
      const band = y >> 2;
      const seam = (band * 7 + 3) % 16;
      const tone = t.vary([176, 137, 86], 0.1);
      for (let x = 0; x < TILE; x++) {
        if (y % 4 === 3 || x === seam) t.set(x, y, t.vary([118, 88, 52], 0.08));
        else t.set(x, y, t.vary(tone, 0.08));
      }
    }
  },
  [T.LEAVES](t) {
    for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) {
      if (t.r() < 0.2) t.set(x, y, [0, 0, 0], 0);
      else t.set(x, y, t.vary(t.r() < 0.3 ? [45, 105, 30] : [62, 135, 42], 0.3));
    }
  },
  [T.SAND](t) {
    t.fill([219, 207, 160], 0.08);
    t.speckle([196, 182, 132], 0.12);
  },
  [T.GLASS](t) {
    for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) {
      const edge = x === 0 || y === 0 || x === 15 || y === 15;
      const shine = (x + y === 7 && x > 2 && x < 6) || (x + y === 9 && x > 3 && x < 6) || (x + y === 22 && x > 10 && x < 14);
      if (edge) t.set(x, y, t.vary([196, 226, 238], 0.08));
      else if (shine) t.set(x, y, [235, 248, 255]);
      else t.set(x, y, [0, 0, 0], 0);
    }
  },
  [T.TABLE_TOP](t) {
    P[T.PLANKS](t);
    for (let i = 0; i < TILE; i++) {
      for (const k of [0, 15]) { t.set(i, k, [92, 64, 36]); t.set(k, i, [92, 64, 36]); }
      if (i > 1 && i < 14) for (const k of [5, 10]) { t.set(i, k, [120, 86, 50]); t.set(k, i, [120, 86, 50]); }
    }
  },
  [T.TABLE_SIDE](t) {
    P[T.PLANKS](t);
    for (let x = 0; x < TILE; x++) for (let y = 0; y < 3; y++) t.set(x, y, t.vary([110, 78, 44], 0.1));
    // a saw blade and a hammer hanging on the side
    for (let x = 3; x < 8; x++) for (let y = 6; y < 9; y++) t.set(x, y, t.vary([170, 170, 175], 0.1));
    for (let x = 3; x < 8; x += 2) t.set(x, 9, [120, 120, 125]);
    t.set(8, 7, [90, 60, 30]); t.set(9, 7, [90, 60, 30]);
    for (let y = 6; y < 13; y++) t.set(12, y, [90, 60, 30]);
    for (let x = 10; x < 15; x++) { t.set(x, 5, [130, 130, 135]); t.set(x, 6, [130, 130, 135]); }
  },
  [T.BRICKS](t) {
    for (let y = 0; y < TILE; y++) {
      const row = y >> 2;
      const seam = row % 2 ? 7 : 15;
      for (let x = 0; x < TILE; x++) {
        if (y % 4 === 3 || x === seam) t.set(x, y, t.vary([86, 86, 86], 0.08));
        else if (y % 4 === 0 || x === (seam + 1) % 16) t.set(x, y, t.vary([150, 150, 150], 0.06));
        else t.set(x, y, t.vary([124, 124, 124], 0.1));
      }
    }
  },
  [T.COAL_ORE](t) {
    P[T.STONE](t);
    for (let i = 0; i < 5; i++) {
      const cx = 2 + t.r() * 12, cy = 2 + t.r() * 12;
      for (let k = 0; k < 4; k++) {
        const x = Math.round(cx + (t.r() - 0.5) * 3), y = Math.round(cy + (t.r() - 0.5) * 3);
        t.set(x, y, t.vary([38, 38, 38], 0.2));
        t.set(x + 1, y, t.vary([58, 58, 58], 0.2));
      }
    }
  },
  // Only columns 7-8 are used: the torch mesh is a 2px-wide stick, 10px tall, flame on top.
  [T.TORCH](t) {
    for (let y = 6; y < 16; y++) for (let x = 7; x < 9; x++) {
      if (y < 8) t.set(x, y, y === 6 ? [255, 236, 140] : [255, 170, 50]);
      else t.set(x, y, t.vary(x === 7 ? [128, 92, 50] : [100, 70, 38], 0.1));
    }
  },
  [T.WOOL](t) {
    // soft cream fleece with little curls
    t.fill([236, 229, 214], 0.05);
    for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) {
      const k = (x * 7 + y * 13 + ((y >> 1) & 1) * 3) % 9;
      if (k === 0) t.set(x, y, t.vary([206, 197, 178], 0.05));
      else if (k === 4) t.set(x, y, t.vary([248, 244, 234], 0.03));
    }
  },
  // Wheat growth stages: stalks get taller and turn from green to gold, with grain heads when ripe.
  [T.WHEAT_0](t) { wheatStage(t, 0); },
  [T.WHEAT_1](t) { wheatStage(t, 1); },
  [T.WHEAT_2](t) { wheatStage(t, 2); },
  [T.WHEAT_3](t) { wheatStage(t, 3); },
  [T.SUGAR_CANE](t) {
    for (const x0 of [2, 7, 12]) {
      for (let y = 0; y < TILE; y++) {
        const joint = (y + x0) % 5 === 0;
        t.set(x0, y, joint ? [196, 224, 150] : t.vary([128, 196, 96], 0.08));
        t.set(x0 + 1, y, joint ? [170, 205, 125] : t.vary([92, 150, 66], 0.08));
      }
      // a few leaves sticking out
      const ly = 3 + ((x0 * 3) % 7);
      t.set(x0 - 1, ly, [110, 175, 80]); t.set(x0 + 2, ly + 4, [110, 175, 80]);
    }
  },
  // a young tree: a thin brown stem with a few clumps of leaves
  [T.SAPLING](t) {
    for (let y = 8; y < TILE; y++) {
      t.set(7, y, t.vary([112, 80, 46], 0.1));
      t.set(8, y, t.vary([88, 62, 34], 0.1));
    }
    t.set(6, 11, [104, 74, 42]); t.set(9, 12, [96, 68, 38]);
    const clump = (cx, cy, r) => {
      for (let y = cy - r; y <= cy + r; y++) for (let x = cx - r; x <= cx + r; x++) {
        if ((x - cx) ** 2 + (y - cy) ** 2 > r * r + 1 || t.r() < 0.12) continue;
        t.set(x, y, t.vary(t.r() < 0.35 ? [45, 105, 30] : [70, 145, 46], 0.25));
      }
    };
    clump(8, 5, 3); clump(4, 9, 2); clump(12, 8, 2);
  },
  [T.CHURN_SIDE](t) {
    // upright wooden staves held by two dark hoops
    for (let x = 0; x < TILE; x++) {
      const seam = x % 4 === 3;
      const tone = (x >> 2) % 2 ? [160, 112, 64] : [146, 100, 56];
      for (let y = 0; y < TILE; y++) {
        if (y === 3 || y === 12) t.set(x, y, x % 5 === 2 ? [150, 140, 120] : [78, 58, 38]);
        else t.set(x, y, seam ? [108, 74, 40] : t.vary(tone, 0.07));
      }
    }
  },
  [T.CHURN_TOP](t) {
    for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) {
      const d = Math.max(Math.abs(x - 7.5), Math.abs(y - 7.5));
      if (d > 6.5) t.set(x, y, [96, 66, 38]); // rim
      else if (d < 1.5) t.set(x, y, [70, 48, 28]); // the plunger handle poking through the lid
      else if (d < 2.5) t.set(x, y, [120, 84, 48]);
      else t.set(x, y, t.vary(y % 4 === 3 ? [130, 92, 54] : [172, 128, 78], 0.06));
    }
  },
  [T.BLANKET](t) {
    // a deep red quilt with cream stitching in a diamond pattern
    for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) {
      const stitch = (x + y) % 8 === 0 || (x - y + 16) % 8 === 0;
      t.set(x, y, stitch ? [222, 200, 170] : t.vary([152, 40, 44], 0.08));
    }
  },
  [T.SHELF](t) {
    // a wooden frame with two shelves: books on top, jars below
    for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) t.set(x, y, t.vary([60, 40, 22], 0.1)); // dark back
    const books = [[150, 40, 40], [40, 70, 130], [60, 110, 50], [170, 130, 50], [110, 60, 120]];
    for (let x = 1; x < 15; x++) {
      const c = books[(x * 3) % books.length], top = 2 + (x * 7 % 3);
      for (let y = top; y < 7; y++) t.set(x, y, t.vary(c, 0.08));
    }
    for (const x0 of [2, 6, 10]) for (let y = 10; y < 15; y++) for (let x = x0; x < x0 + 3; x++) {
      t.set(x, y, y === 10 ? [150, 120, 90] : t.vary([200, 210, 220], 0.06)); // jars with lids
    }
    for (let i = 0; i < TILE; i++) {
      for (const y of [0, 7, 15]) t.set(i, y, t.vary([168, 128, 78], 0.06)); // shelves
      for (const x of [0, 15]) t.set(x, i, t.vary([140, 104, 62], 0.06)); // sides
    }
  },
  [T.FLAME](t) {
    for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) {
      const d = Math.hypot(x - 7.5, (y - 9) * 0.7) / 8;
      t.set(x, y, d < 0.35 ? [255, 250, 220] : d < 0.7 ? [255, 210, 90] : [240, 140, 40]);
    }
  },
  [T.LAMP_EMPTY](t) {
    t.fill([60, 58, 56], 0.15);
    t.speckle([30, 28, 26], 0.3);
  },
  [T.DOOR_LOWER](t) { doorPanel(t, false); },
  [T.DOOR_UPPER](t) { doorPanel(t, true); },
  [T.CURTAIN](t) {
    // soft cream fabric hanging in vertical folds
    for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) {
      const fold = Math.sin((x / 16) * Math.PI * 4) * 0.5 + 0.5;
      const c = 196 + fold * 44;
      t.set(x, y, t.vary([c, c * 0.95, c * 0.86], 0.03));
    }
  },
  // Oven: clay bricks with an arched mouth; the lit front glows with fire.
  [T.OVEN_SIDE](t) { bricks(t, [164, 86, 60], [120, 100, 88]); },
  [T.OVEN_TOP](t) { bricks(t, [140, 72, 52], [110, 92, 80]); },
  [T.OVEN_FRONT](t) { bricks(t, [164, 86, 60], [120, 100, 88]); mouth(t, 'arch', false); },
  [T.OVEN_FRONT_LIT](t) { bricks(t, [164, 86, 60], [120, 100, 88]); mouth(t, 'arch', true); },
  // Smelter: dark stone bricks with a square mouth and a vent on top.
  [T.SMELTER_SIDE](t) { bricks(t, [96, 96, 102], [64, 64, 70]); },
  [T.SMELTER_TOP](t) {
    bricks(t, [96, 96, 102], [64, 64, 70]);
    for (let y = 4; y < 12; y++) for (let x = 4; x < 12; x++) t.set(x, y, (x + y) % 2 ? [40, 40, 44] : [24, 24, 28]); // vent grate
  },
  [T.SMELTER_FRONT](t) { bricks(t, [96, 96, 102], [64, 64, 70]); mouth(t, 'square', false); },
  [T.SMELTER_FRONT_LIT](t) { bricks(t, [96, 96, 102], [64, 64, 70]); mouth(t, 'square', true); },
  [T.BEDROCK](t) {
    for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) {
      const g = 30 + t.r() * 100;
      t.set(x, y, [g, g, g]);
    }
  },
};

// Ores: stone with clusters of coloured, slightly shiny nuggets (bauxite is a reddish rock with bigger blobs).
const shade = (c, k) => c.map((v) => Math.max(0, Math.min(255, Math.round(v * k))));
ORES.forEach((o, i) => {
  P[o.tile ?? T.ORE0 + i] = (t) => {
    P[T.STONE](t);
    if (o.tile) for (let k = 0; k < (o.burn ?? 7); k++) t.r(); // (skip a few draws: some seeds line the nuggets up in a stalk)
    const big = o.id === ORES.find((q) => q.name === 'Bauxite').id;
    const clusters = big ? 7 : 6;
    for (let n = 0; n < clusters; n++) {
      const cx = 2 + t.r() * 11, cy = 2 + t.r() * 11;
      for (let k = 0; k < (big ? 6 : 4); k++) {
        const x = Math.round(cx + (t.r() - 0.5) * 3), y = Math.round(cy + (t.r() - 0.5) * 3);
        t.set(x, y + 1, t.vary(shade(o.color, 0.6), 0.1)); // shadowed lower edge
        t.set(x, y, t.vary(o.color, 0.1));
        t.set(x + 1, y, t.vary(o.color, 0.1));
        t.set(x + 1, y + 1, t.vary(shade(o.color, 0.8), 0.1));
        if (t.r() < 0.4) t.set(x, y - 1, shade(o.color, 1.3)); // glint
      }
    }
  };
});

// Bricks in rows with offset joints: mortar colour and two brick tones.
function brickWall(t, mortar, a, b) {
  for (let y = 0; y < TILE; y++) {
    const row = y >> 2;
    const seam = row % 2 ? 3 : 11;
    for (let x = 0; x < TILE; x++) {
      if (y % 4 === 3 || x === seam) t.set(x, y, t.vary(mortar, 0.06));
      else t.set(x, y, t.vary((x + row * 5) % 16 < 8 ? a : b, 0.1));
    }
  }
}
Object.assign(P, {
  [T.GRAVEL](t) {
    t.fill([128, 122, 118], 0.15);
    for (let n = 0; n < 26; n++) {
      const x = Math.floor(t.r() * 16), y = Math.floor(t.r() * 16);
      const c = [[150, 144, 140], [96, 92, 90], [170, 160, 150], [110, 100, 94]][n % 4];
      t.set(x, y, t.vary(c, 0.08)); t.set(x + 1, y, t.vary(c, 0.08)); t.set(x, y + 1, t.vary(shade(c, 0.7), 0.08));
    }
  },
  [T.CLAY](t) {
    t.fill([160, 166, 180], 0.06);
    t.speckle([142, 148, 164], 0.12, 0.05);
    t.speckle([178, 184, 196], 0.06, 0.04);
  },
  [T.CLAY_BRICKS](t) { brickWall(t, [196, 186, 170], [164, 76, 56], [146, 66, 48]); },
  [T.FIRE_BRICKS](t) { brickWall(t, [120, 110, 100], [222, 204, 160], [206, 184, 138]); },
  [T.STAINLESS](t) {
    for (let y = 0; y < TILE; y++) {
      const band = 0.94 + 0.06 * Math.sin(y * 1.7);
      for (let x = 0; x < TILE; x++) t.set(x, y, t.vary(shade([206, 214, 220], band), 0.04));
    }
  },
  // the rock crusher: a stone frame bound with bronze, two toothed rollers on top, a chute at the front
  [T.CRUSHER_SIDE](t) {
    P[T.COBBLE](t);
    for (let x = 0; x < TILE; x++) for (const y of [1, 2, 13, 14]) t.set(x, y, t.vary(y % 13 === 1 ? [212, 160, 84] : [168, 120, 56], 0.05));
    for (const y of [1, 13]) for (const x of [2, 7, 12]) t.set(x, y, [110, 80, 40]); // rivets
  },
  [T.CRUSHER_TOP](t) {
    for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) {
      const edge = x < 2 || x > 13 || y < 2 || y > 13;
      if (edge) { t.set(x, y, t.vary([168, 120, 56], 0.06)); continue; }
      const roller = x < 8 ? x - 2 : x - 8; // two rollers, 6 px wide
      const tooth = (y + (x < 8 ? 0 : 1)) % 2 === 0;
      t.set(x, y, roller === 0 || roller === 5 ? [40, 40, 44] : t.vary(tooth ? [120, 122, 128] : [84, 86, 92], 0.05));
    }
  },
  [T.CRUSHER_FRONT](t) {
    P[T.CRUSHER_SIDE](t);
    for (let y = 6; y < 12; y++) for (let x = 4; x < 12; x++) t.set(x, y, y === 6 || x === 4 || x === 11 ? [70, 70, 74] : [24, 22, 22]);
    for (let x = 5; x < 11; x++) t.set(x, 10, t.vary([200, 190, 170], 0.1)); // a little dust in the chute
  },
});

// Chests: planks bound with dark wood (or iron bands), with a lid line and a latch at the front.
function chestFace(t, band, kind) {
  P[T.PLANKS](t);
  for (let i = 0; i < TILE; i++) {
    for (const e of [0, 15]) { t.set(i, e, t.vary(band, 0.08)); t.set(e, i, t.vary(band, 0.08)); }
  }
  if (kind !== 'top') for (let x = 0; x < TILE; x++) t.set(x, 5, t.vary(shade(band, 0.8), 0.06)); // the lid's edge
  if (kind === 'front') {
    for (let y = 4; y < 8; y++) for (let x = 7; x < 9; x++) t.set(x, y, [200, 196, 186]);
    t.set(7, 6, [60, 60, 64]); t.set(8, 6, [60, 60, 64]);
  }
}
Object.assign(P, {
  [T.CHEST_SIDE](t) { chestFace(t, [92, 62, 34], 'side'); },
  [T.CHEST_TOP](t) { chestFace(t, [92, 62, 34], 'top'); },
  [T.CHEST_FRONT](t) { chestFace(t, [92, 62, 34], 'front'); },
  [T.IRON_CHEST_SIDE](t) { chestFace(t, [150, 154, 162], 'side'); for (let y = 0; y < TILE; y++) for (const x of [4, 11]) t.set(x, y, t.vary([130, 134, 142], 0.05)); },
  [T.IRON_CHEST_TOP](t) { chestFace(t, [150, 154, 162], 'top'); for (let y = 0; y < TILE; y++) for (const x of [4, 11]) t.set(x, y, t.vary([130, 134, 142], 0.05)); },
  [T.IRON_CHEST_FRONT](t) { chestFace(t, [150, 154, 162], 'front'); for (let y = 0; y < TILE; y++) for (const x of [3, 12]) t.set(x, y, t.vary([130, 134, 142], 0.05)); },
});

Object.assign(P, {
  // white, fluffy crystals crusting the stone
  [T.SALTPETRE_ORE](t) {
    P[T.STONE](t);
    for (let n = 0; n < 9; n++) {
      const cx = 1 + t.r() * 13, cy = 1 + t.r() * 13;
      for (let k = 0; k < 5; k++) {
        const x = Math.round(cx + (t.r() - 0.5) * 3), y = Math.round(cy + (t.r() - 0.5) * 3);
        t.set(x, y, t.vary([238, 236, 228], 0.05)); if (t.r() < 0.5) t.set(x + 1, y, t.vary([214, 212, 204], 0.05));
      }
    }
  },
  [T.ELECTRUM](t) {
    for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) t.set(x, y, t.vary(shade([236, 218, 140], 0.9 + 0.15 * Math.sin((x + y) * 0.6)), 0.04));
  },
  // a bundle of paper-wrapped sticks of gunpowder, tied with string; the fuse sticks out of the top
  [T.CHARGE_SIDE](t) {
    for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) {
      const stick = x % 4 === 0 ? [150, 40, 30] : [196, 62, 44];
      t.set(x, y, t.vary(y === 4 || y === 11 ? [214, 196, 140] : stick, 0.06));
    }
  },
  [T.CHARGE_TOP](t) {
    for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) {
      const d = Math.hypot((x % 4) - 1.5, (y % 4) - 1.5);
      t.set(x, y, t.vary(d < 1.3 ? [70, 66, 62] : [176, 52, 38], 0.08));
    }
    for (let y = 6; y < 10; y++) for (let x = 7; x < 9; x++) t.set(x, y, [226, 214, 170]); // fuse
  },
  [T.LAVA](t) {
    for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) {
      const w = Math.sin(x * 0.9 + Math.sin(y * 0.7) * 2) + Math.cos(y * 0.8 - x * 0.3);
      t.set(x, y, t.vary(w > 1.1 ? [255, 236, 120] : w > 0.2 ? [252, 150, 30] : [210, 70, 14], 0.07));
    }
  },
  [T.OBSIDIAN](t) {
    t.fill([30, 22, 44], 0.2);
    t.speckle([62, 44, 92], 0.12, 0.1);
    t.speckle([12, 8, 18], 0.1, 0.1);
  },
});

// ----- machines -----
const IRON_C = [118, 122, 130];
function frame(t, c, w = 2) {
  for (let i = 0; i < TILE; i++) for (let k = 0; k < w; k++) {
    t.set(i, k, t.vary(c, 0.06)); t.set(i, 15 - k, t.vary(c, 0.06)); t.set(k, i, t.vary(c, 0.06)); t.set(15 - k, i, t.vary(c, 0.06));
  }
}
function arrowTile(t, dir) {
  // a rubber belt with chevrons pointing along it (dir: 0 +z (down the tile), 1 -x, 2 -z, 3 +x)
  for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) {
    const [u, v] = dir === 0 ? [x, y] : dir === 2 ? [x, 15 - y] : dir === 1 ? [y, x] : [y, 15 - x]; // (+z is up the tile)
    const chevron = (v - Math.abs(u - 7.5) * 0.6 + 32) % 6 < 1.4 && u > 1 && u < 14;
    t.set(x, y, t.vary(u < 1 || u > 14 ? [60, 60, 64] : chevron ? [140, 140, 136] : [44, 42, 40], 0.06));
  }
}
Object.assign(P, {
  [T.MILL_SIDE](t) { P[T.STONE](t); for (let x = 0; x < TILE; x++) { t.set(x, 7, [96, 96, 98]); t.set(x, 8, [150, 150, 152]); } },
  [T.MILL_TOP](t) {
    for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) {
      const d = Math.hypot(x - 7.5, y - 7.5), a = Math.atan2(y - 7.5, x - 7.5);
      t.set(x, y, t.vary(d < 1.6 ? [70, 52, 30] : Math.abs(Math.sin(a * 4)) < 0.15 && d < 7 ? [104, 104, 106] : [150, 150, 152], 0.07)); // grooved stone round the spindle
    }
  },
  [T.SAW_SIDE](t) { P[T.PLANKS](t); frame(t, IRON_C, 1); },
  [T.SAW_TOP](t) {
    P[T.PLANKS](t); frame(t, IRON_C, 1);
    for (let y = 2; y < 14; y++) { t.set(7, y, [210, 214, 222]); t.set(8, y, y % 2 ? [150, 154, 160] : [230, 232, 238]); } // the blade through its slot
  },
  [T.SAW_FRONT](t) {
    P[T.SAW_SIDE](t);
    for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) {
      const d = Math.hypot(x - 7.5, y - 9);
      if (d < 5.5) t.set(x, y, d > 4.6 && (Math.atan2(y - 9, x - 7.5) * 8 / Math.PI | 0) % 2 ? [120, 124, 130] : d < 1.2 ? [70, 70, 74] : [206, 210, 218]);
    }
  },
  [T.BELLOWS_SIDE](t) {
    for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) {
      const fold = y > 3 && y < 13 && (x + (y % 2)) % 3 === 0;
      t.set(x, y, t.vary(y < 3 || y > 12 ? [150, 110, 64] : fold ? [96, 62, 34] : [134, 88, 50], 0.07));
    }
  },
  [T.BELLOWS_TOP](t) { P[T.PLANKS](t); for (let y = 6; y < 10; y++) for (let x = 6; x < 10; x++) t.set(x, y, [60, 60, 64]); },
  [T.HAMMER_SIDE](t) { P[T.COBBLE](t); frame(t, [96, 70, 40], 2); },
  [T.HAMMER_TOP](t) { P[T.PLANKS](t); frame(t, IRON_C, 1); for (let y = 3; y < 13; y++) for (let x = 5; x < 11; x++) t.set(x, y, t.vary([90, 92, 98], 0.05)); },
  [T.HAMMER_FRONT](t) {
    P[T.HAMMER_SIDE](t);
    for (let y = 2; y < 8; y++) for (let x = 4; x < 12; x++) t.set(x, y, t.vary([84, 86, 92], 0.05)); // the hammer head
    for (let y = 8; y < 12; y++) for (let x = 7; x < 9; x++) t.set(x, y, [110, 80, 46]);
    for (let x = 3; x < 13; x++) for (let y = 12; y < 14; y++) t.set(x, y, [60, 60, 66]); // the anvil
  },
  [T.PUMP_SIDE](t) {
    for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) t.set(x, y, t.vary([104, 110, 134], 0.06));
    frame(t, [70, 76, 98], 1);
    for (let y = 4; y < 12; y++) for (let x = 4; x < 12; x++) t.set(x, y, t.vary(Math.hypot(x - 7.5, y - 7.5) < 3 ? [60, 64, 84] : [128, 134, 158], 0.05));
  },
  [T.PUMP_TOP](t) { P[T.PUMP_SIDE](t); for (let y = 6; y < 10; y++) for (let x = 6; x < 10; x++) t.set(x, y, [40, 44, 60]); },
  [T.LEAD](t) { for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) t.set(x, y, t.vary(shade([110, 116, 140], 0.88 + 0.12 * Math.sin(y * 0.8)), 0.04)); },
  [T.DRILL_SIDE](t) {
    for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) t.set(x, y, t.vary([146, 154, 166], 0.05));
    frame(t, [96, 100, 110], 1);
    for (const [x, y] of [[3, 3], [12, 3], [3, 12], [12, 12]]) t.set(x, y, [70, 72, 80]);
  },
  [T.DRILL_FRONT](t) {
    P[T.DRILL_SIDE](t);
    for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) {
      const d = Math.hypot(x - 7.5, y - 7.5), a = Math.atan2(y - 7.5, x - 7.5);
      if (d < 6) t.set(x, y, (a * 3 / Math.PI + d * 0.5 + 6) % 2 < 1 ? [124, 120, 152] : [84, 80, 110]); // a spiral tungsten bit
    }
  },
  [T.IRON](t) { for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) t.set(x, y, t.vary(shade(IRON_C, 0.9 + 0.1 * ((x + y) % 4 === 0)), 0.05)); frame(t, [84, 86, 94], 1); },
  [T.FILAMENT_OFF](t) {
    for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) t.set(x, y, [0, 0, 0], 0);
    frame(t, [200, 120, 70], 1);
    for (let y = 3; y < 13; y++) for (let x = 3; x < 13; x++) t.set(x, y, [210, 228, 236], 90); // glass
    for (let x = 4; x < 12; x++) t.set(x, 7 + ((x % 2)), [90, 86, 100]); // the coiled filament
  },
  [T.FILAMENT_ON](t) {
    for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) t.set(x, y, t.vary([255, 236, 170], 0.05));
    frame(t, [200, 120, 70], 1);
    for (let x = 4; x < 12; x++) t.set(x, 7 + ((x % 2)), [255, 255, 240]);
  },
});
for (let f = 0; f < 4; f++) P[T.BELT0 + f] = (t) => arrowTile(t, f);
// v25 E: a belt crossing (rollers both ways, a brass plate in the middle), a farm controller's dial face,
// a pneumatic tube (a glass duct banded with copper)
P[T.BELT_CROSS] = (t) => {
  for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) {
    const edge = (x < 1 || x > 14) && (y < 1 || y > 14), plate = Math.abs(x - 7.5) < 3 && Math.abs(y - 7.5) < 3;
    const stripe = (x > 4 && x < 11) !== (y > 4 && y < 11) && ((x + y) % 3 === 0);
    t.set(x, y, t.vary(edge ? [60, 60, 64] : plate ? [196, 160, 70] : stripe ? [140, 140, 136] : [44, 42, 40], 0.06));
  }
};
const farmFace = (on) => (t) => {
  P[T.PLANKS](t);
  for (let y = 3; y < 13; y++) for (let x = 3; x < 13; x++) t.set(x, y, [50, 56, 50]);
  for (let x = 4; x < 12; x++) { const h = [3, 5, 6, 4, 7, 6, 5, 3][x - 4]; for (let y = 12 - h; y < 12; y++) t.set(x, y, on ? [230, 200, 60] : [90, 160, 70]); }
  t.set(7, 14, on ? [255, 80, 60] : [90, 40, 30]); t.set(8, 14, on ? [255, 80, 60] : [90, 40, 30]);
};
P[T.FARM_CTRL] = farmFace(false);
P[T.FARM_CTRL_ON] = farmFace(true);
P[T.FIRE] = (t) => {
  for (let x = 0; x < TILE; x++) {
    const top = TILE * (0.25 + 0.5 * Math.abs(Math.sin(x * 1.7) * Math.cos(x * 0.6)));
    for (let y = Math.floor(top); y < TILE; y++) {
      const k = (y - top) / (TILE - top), c = k > 0.6 ? [255, 236, 120] : k > 0.3 ? [250, 160, 40] : [220, 70, 20];
      t.set(x, y, t.vary(c, 0.06), 255);
    }
  }
};
// v26 C: carrots, potatoes, pumpkin vines, pumpkins, trellises and grape vines
function leafyCrop(t, stage, top) {
  const h = [3, 5, 8, 10][stage];
  for (const x of [2, 5, 8, 11, 13]) {
    const hh = h - 1 + Math.floor(t.r() * 3);
    for (let k = 0; k < hh; k++) { t.set(x, 15 - k, t.vary([70, 150, 52], 0.12)); if (k > hh / 2 && k % 2) { t.set(x - 1, 15 - k, t.vary([90, 170, 60], 0.1)); t.set(x + 1, 15 - k, t.vary([60, 130, 44], 0.1)); } }
    if (stage === 3 && top) for (let k = 0; k < 2; k++) for (let d = -1; d <= 1; d++) t.set(x + d, 15 - k, t.vary(top, 0.1));
  }
}
for (let k = 0; k < 4; k++) { P[T.CARROT_0 + k] = (t) => leafyCrop(t, k, [236, 120, 30]); P[T.POTATO_0 + k] = (t) => { leafyCrop(t, k, [196, 160, 96]); if (k === 3) for (const x of [4, 10]) t.set(x, 4, [240, 240, 255]); }; }
for (let k = 0; k < 3; k++) P[T.STEM_0 + k] = (t) => {
  const h = [4, 8, 12][k];
  for (let y = 0; y < h; y++) { const x = 7 + Math.round(Math.sin(y * 0.9)); t.set(x, 15 - y, t.vary([110, 160, 60], 0.1)); }
  if (k >= 1) for (const [x, y] of [[5, 13], [9, 10], [6, 7], [10, 5]]) if (15 - y < h) for (let d = 0; d < 3; d++) t.set(x + d - 1, y, t.vary([70, 140, 50], 0.12));
  if (k === 2) for (const [x, y] of [[4, 4], [11, 9]]) t.set(x, y, [240, 200, 60]);
};
P[T.PUMPKIN_SIDE] = (t) => { for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) t.set(x, y, t.vary(x % 4 === 0 ? [196, 100, 20] : [228, 132, 32], 0.06)); };
P[T.PUMPKIN_TOP] = (t) => {
  for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) t.set(x, y, t.vary((x + y) % 5 === 0 ? [200, 108, 24] : [222, 128, 32], 0.06));
  for (let y = 6; y < 10; y++) for (let x = 7; x < 9; x++) t.set(x, y, t.vary([90, 120, 40], 0.1));
};
P[T.JACK_FACE] = (t) => {
  P[T.PUMPKIN_SIDE](t);
  const glow = [255, 214, 90];
  for (const [x, y] of [[4, 4], [5, 4], [4, 5], [5, 5], [10, 4], [11, 4], [10, 5], [11, 5]]) t.set(x, y, glow);
  for (let x = 3; x <= 12; x++) { t.set(x, 10, glow); if (x % 3) t.set(x, 11, glow); }
  t.set(3, 9, glow); t.set(12, 9, glow);
};
function trellis(t) {
  for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) if (x === 1 || x === 14 || (x + y) % 6 === 0 || (x - y + 16) % 6 === 0) t.set(x, y, t.vary([150, 112, 66], 0.1));
}
P[T.TRELLIS] = trellis;
for (let k = 0; k < 3; k++) P[T.VINE_0 + k] = (t) => {
  trellis(t);
  const reach = [6, 11, 15][k];
  for (let y = 15; y > 15 - reach; y--) for (let x = 0; x < TILE; x++) if (t.r() < (k ? 0.45 : 0.25) && (x + y) % 2 === 0) t.set(x, y, t.vary([66, 132, 48], 0.15));
  if (k === 2) for (const [x, y] of [[3, 6], [10, 4], [7, 10], [12, 11]]) for (let dy = 0; dy < 3; dy++) for (let dx = 0; dx < 2 + (dy < 2 ? 1 : 0) - (dy === 2 ? 1 : 0); dx++) t.set(x + dx, y + dy, t.vary([96, 40, 120], 0.12));
};
P[T.BARREL_SIDE] = (t) => {
  for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) {
    const hoop = y === 2 || y === 3 || y === 12 || y === 13;
    t.set(x, y, hoop ? t.vary([92, 92, 100], 0.08) : t.vary(x % 4 === 0 ? [104, 70, 38] : [140, 96, 54], 0.08));
  }
};
P[T.BARREL_TOP] = (t) => {
  for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) {
    const d = Math.hypot(x - 7.5, y - 7.5);
    t.set(x, y, d > 6.6 ? t.vary([92, 92, 100], 0.08) : t.vary(y % 4 === 0 ? [104, 70, 38] : [150, 106, 62], 0.08));
  }
  for (const [x, y] of [[7, 7], [8, 7], [7, 8], [8, 8]]) t.set(x, y, [70, 46, 24]);
};
P[T.CHEESE] = (t) => { for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) t.set(x, y, t.vary((x * 7 + y * 3) % 11 === 0 ? [214, 180, 70] : [244, 214, 110], 0.05)); };
P[T.SEA_BRICK] = (t) => {
  for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) {
    const mortar = y % 8 === 7 || (x + (Math.floor(y / 8) % 2) * 8) % 16 === 15;
    t.set(x, y, mortar ? t.vary([40, 80, 80], 0.1) : t.vary((x * 3 + y * 5) % 7 === 0 ? [70, 150, 140] : [88, 170, 158], 0.1));
  }
};
P[T.SEA_LANTERN] = (t) => {
  for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) {
    const edge = x === 0 || y === 0 || x === 15 || y === 15, d = Math.hypot(x - 7.5, y - 7.5);
    t.set(x, y, edge ? [120, 190, 180] : t.vary(d < 4 ? [240, 255, 250] : [196, 236, 226], 0.06));
  }
};
P[T.VAULT] = (t) => {
  for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) {
    const bar = x % 4 === 1 || y === 1 || y === 14;
    t.set(x, y, bar ? t.vary([120, 112, 96], 0.08) : t.vary([56, 52, 46], 0.08));
  }
  for (const [x, y] of [[7, 7], [8, 7], [7, 8], [8, 8]]) t.set(x, y, [214, 176, 60]);
};
P[T.SKY_STONE] = (t) => { for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) t.set(x, y, t.vary((x + y * 2) % 9 === 0 ? [206, 214, 232] : [232, 236, 246], 0.04)); };
P[T.AIR_PUMP] = (t) => {
  for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) t.set(x, y, t.vary(x === 0 || x === 15 || y === 0 || y === 15 ? [90, 90, 96] : [150, 150, 158], 0.05));
  for (let y = 3; y < 13; y++) for (let x = 4; x < 12; x++) t.set(x, y, t.vary(y % 2 ? [110, 74, 44] : [140, 96, 58], 0.05)); // the bellows
  for (let x = 6; x < 10; x++) t.set(x, 2, [196, 120, 60]);
};
const radioFace = (lit) => (t) => {
  for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) t.set(x, y, t.vary(x === 0 || x === 15 || y === 0 || y === 15 ? [70, 60, 50] : [150, 112, 70], 0.05));
  for (let y = 3; y < 10; y++) for (let x = 2; x < 9; x++) t.set(x, y, (x + y) % 2 ? [60, 52, 44] : [90, 80, 66]); // the speaker grille
  for (let y = 4; y < 7; y++) for (let x = 10; x < 14; x++) t.set(x, y, lit ? [255, 200, 90] : [96, 70, 40]); // the dial
  t.set(12, 9, [200, 200, 200]); t.set(12, 11, [200, 200, 200]);
};
P[T.RADIO] = radioFace(false); P[T.RADIO_ON] = radioFace(true);
P[T.SORTBOX] = (t) => {
  for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) t.set(x, y, t.vary(x === 0 || x === 15 || y === 0 || y === 15 ? [80, 82, 90] : [140, 144, 152], 0.05));
  for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) { const d = Math.hypot(x - 7.5, y - 7.5); if (d < 4.5) t.set(x, y, d > 3.4 ? [190, 160, 70] : [40, 40, 46]); }
};
P[T.SORTBOX_TOP] = (t) => {
  P[T.SORTBOX](t);
  for (const [x, y] of [[2, 2], [13, 2], [2, 13], [13, 13]]) t.set(x, y, [210, 60, 50]);
};
// v26 G: fireplace front (cold, and burning) and the top of a chimney
function hearthFront(t, lit) {
  P[T.BRICKS](t);
  for (let y = 4; y < TILE; y++) for (let x = 2; x < 14; x++) {
    const arch = y >= 6 || (y === 5 && x > 2 && x < 13) || (y === 4 && x > 4 && x < 11);
    if (arch) t.set(x, y, t.vary([26, 20, 18], 0.1));
  }
  for (let x = 1; x < 15; x++) t.set(x, 3, t.vary([120, 120, 124], 0.06)); // the mantel
  for (let x = 3; x < 13; x++) t.set(x, 14, t.vary([84, 54, 32], 0.1)); // logs
  for (let x = 4; x < 12; x += 2) t.set(x, 13, t.vary([96, 62, 36], 0.1));
  if (!lit) return;
  for (let x = 3; x < 13; x++) {
    const top = 7 + Math.floor(Math.abs(Math.sin(x * 1.9)) * 4);
    for (let y = top; y < 14; y++) {
      const k = (y - top) / (14 - top);
      t.set(x, y, t.vary(k > 0.65 ? [255, 236, 130] : k > 0.3 ? [250, 160, 40] : [214, 72, 22], 0.06));
    }
  }
}
P[T.HEARTH] = (t) => hearthFront(t, false);
P[T.HEARTH_LIT] = (t) => hearthFront(t, true);
P[T.CHIMNEY_TOP] = (t) => {
  P[T.BRICKS](t);
  for (let y = 3; y < 13; y++) for (let x = 3; x < 13; x++) t.set(x, y, t.vary([30, 26, 24], 0.12));
};
// v27: the side of a stable's manger: planks with hay poking over the top
P[T.STABLE_SIDE] = (t) => {
  P[T.PLANKS](t);
  for (let x = 0; x < TILE; x++) for (let y = 0; y < 3 + (x * 7 % 3); y++) t.set(x, y, t.vary([206, 176, 84], 0.12));
  for (let x = 0; x < TILE; x++) t.set(x, 9, t.vary([96, 66, 38], 0.08)); // a rail across
};
// v27: the front of a snowman (coal eyes, a smile and buttons; thin plates in front of the head and body show it)
P[T.SNOWMAN_FRONT] = (t) => {
  P[T.SNOW](t);
  const coal = [34, 32, 36];
  for (const [x, y] of [[6, 2], [9, 2], [6, 4], [7, 5], [8, 5], [9, 4], [7, 8], [8, 8], [7, 10], [8, 10], [7, 12], [8, 12]]) t.set(x, y, coal);
};
P[T.AWNING] = (t) => { for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) t.set(x, y, t.vary(Math.floor(x / 4) % 2 ? [240, 236, 224] : [200, 44, 44], 0.04)); };
P[T.TUBE] = (t) => {
  for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) {
    const band = y < 2 || y > 13, rim = x < 1 || x > 14;
    if (band) t.set(x, y, t.vary([200, 120, 70], 0.06)); else if (rim) t.set(x, y, [150, 190, 200]); else if ((x === 4 || x === 11) && y % 4) t.set(x, y, [225, 245, 252]); else t.set(x, y, [0, 0, 0], 0);
  }
};
P[T.TUBE_END] = (t) => {
  for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) {
    const d = Math.max(Math.abs(x - 7.5), Math.abs(y - 7.5));
    if (d > 6.5) t.set(x, y, t.vary([200, 120, 70], 0.06)); else if (d > 5.5) t.set(x, y, [150, 190, 200]); else t.set(x, y, [0, 0, 0], 0);
  }
};

// ----- tundra and desert -----
Object.assign(P, {
  [T.SNOW](t) { t.fill([240, 244, 250], 0.04); t.speckle([214, 224, 240], 0.1, 0.04); },
  [T.SNOW_GRASS_SIDE](t) {
    P[T.DIRT](t);
    for (let x = 0; x < TILE; x++) {
      const depth = 3 + (t.r() < 0.5 ? 1 : 0) + (t.r() < 0.25 ? 1 : 0);
      for (let y = 0; y < depth; y++) t.set(x, y, t.vary([238, 242, 248], 0.04));
    }
  },
  [T.ICE](t) {
    for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) t.set(x, y, t.vary([150, 196, 240], 0.05), 200);
    for (let i = 0; i < 3; i++) { let x = t.r() * 16, y = t.r() * 16; for (let k = 0; k < 6; k++) { t.set(x | 0, y | 0, [220, 238, 255], 220); x += 1; y += t.r() < 0.5 ? 1 : 0; } } // cracks
  },
  [T.SANDSTONE_TOP](t) { P[T.SAND](t); for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) if (x === 0 || y === 0) t.set(x, y, t.vary([196, 176, 120], 0.05)); },
  [T.SANDSTONE_SIDE](t) {
    for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) {
      const band = y < 3 ? [226, 210, 158] : y % 5 === 4 ? [190, 168, 112] : [214, 196, 140];
      t.set(x, y, t.vary(band, 0.05));
    }
  },
  [T.CACTUS_SIDE](t) {
    for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) t.set(x, y, t.vary(x % 4 === 1 ? [64, 120, 50] : [86, 150, 64], 0.08));
    for (let y = 1; y < TILE; y += 3) for (const x of [3, 11]) t.set(x, y, [236, 230, 190]); // spines
  },
  [T.CACTUS_TOP](t) {
    for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) t.set(x, y, t.vary(Math.hypot(x - 7.5, y - 7.5) < 4 ? [120, 176, 90] : [86, 150, 64], 0.06));
  },
  [T.GOLD](t) { for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) t.set(x, y, t.vary(shade([250, 210, 70], 0.88 + 0.12 * Math.sin((x - y) * 0.7)), 0.04)); },
});

// ----- colour, flowers and building -----
// Paint a base tile, then tint every pixel toward a dye colour by its brightness.
function tinted(base, rgb, ref) {
  return (t) => {
    P[base](t);
    for (let i = 0; i < t.d.length; i += 4) {
      if (!t.d[i + 3]) continue;
      const k = (t.d[i] + t.d[i + 1] + t.d[i + 2]) / 3 / ref;
      t.d[i] = clamp(rgb[0] * k); t.d[i + 1] = clamp(rgb[1] * k); t.d[i + 2] = clamp(rgb[2] * k);
    }
  };
}
COLORS.forEach((c, i) => {
  // painted doors: the plank door, painted (the window glass and its bars stay as they are)
  for (const upper of [0, 1]) P[T.PAINTED_DOOR + i * 2 + upper] = tinted(upper ? T.DOOR_UPPER : T.DOOR_LOWER, i === 1 ? [70, 70, 80] : c.rgb, 140);
  // glow lamps: a frosted block glowing in its colour, brightest in the middle
  P[T.GLOW_LAMP + i] = (t) => {
    const glow = i === 1 ? [150, 90, 230] : c.rgb.map((v) => Math.min(255, v * 0.6 + 110));
    for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) {
      const edge = x === 0 || y === 0 || x === 15 || y === 15, d = Math.hypot(x - 7.5, y - 7.5);
      t.set(x, y, edge ? [70, 66, 60] : t.vary(glow.map((v) => Math.min(255, v + (6 - d) * 10)), 0.04));
    }
    for (const k of [5, 10]) for (let j = 1; j < 15; j++) { t.set(k, j, shade(glow, 0.85)); t.set(j, k, shade(glow, 0.85)); }
  };
  if (i) P[T.DYED_WOOL + i] = tinted(T.WOOL, c.rgb, 228);
  P[T.PAINTED + i] = tinted(T.PLANKS, c.rgb, 150);
  // stained glass: a coloured frame and a fine coloured mesh you can see through
  P[T.STAINED + i] = (t) => {
    for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) {
      const edge = x === 0 || y === 0 || x === 15 || y === 15;
      if (edge) t.set(x, y, t.vary(shade(c.rgb, 0.8), 0.06));
      else if ((x + y) % 2 === 0 && (y % 4 !== 2)) t.set(x, y, t.vary(c.rgb, 0.08));
      else if (x + y === 8 && x > 2 && x < 6) t.set(x, y, [240, 248, 255]);
      else t.set(x, y, [0, 0, 0], 0);
    }
  };
});
// flowers: a green stem and leaves under a bloom
const BLOOMS = [
  { petal: [206, 40, 36], eye: [30, 24, 20], shape: 'cup' }, // poppy
  { petal: [246, 206, 40], eye: [226, 150, 30], shape: 'round' }, // dandelion
  { petal: [70, 110, 222], eye: [40, 50, 120], shape: 'star' }, // cornflower
  { petal: [150, 104, 206], eye: [120, 76, 176], shape: 'spike' }, // lavender
  { petal: [248, 248, 244], eye: [240, 200, 50], shape: 'star' }, // daisy
];
BLOOMS.forEach((b, i) => {
  P[T.FLOWER0 + i] = (t) => {
    for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) t.set(x, y, [0, 0, 0], 0);
    const top = b.shape === 'spike' ? 3 : 6;
    for (let y = top + 2; y < TILE; y++) t.set(7, y, t.vary([70, 140, 50], 0.1));
    t.set(6, 11, [80, 156, 56]); t.set(5, 10, [80, 156, 56]); t.set(8, 12, [80, 156, 56]); t.set(9, 11, [80, 156, 56]);
    if (b.shape === 'spike') {
      for (let y = 1; y < 9; y++) { t.set(7, y, t.vary(b.petal, 0.15)); if (y % 2) { t.set(6, y, t.vary(b.petal, 0.15)); t.set(8, y + 1, t.vary(b.eye, 0.1)); } }
      return;
    }
    const cx = 7.5, cy = top;
    for (let y = cy - 4; y <= cy + 3; y++) for (let x = 3; x <= 12; x++) {
      const dx = x - cx, dy = y - cy, d = Math.hypot(dx, dy);
      let on = d < 3.4;
      if (b.shape === 'star') on = d < 3.6 && (Math.abs(dx) < 1 || Math.abs(dy) < 1 || Math.abs(Math.abs(dx) - Math.abs(dy)) < 1);
      if (b.shape === 'cup') on = d < 3.5 && dy > -3;
      if (on) t.set(x, y, d < 1.2 ? b.eye : t.vary(b.petal, 0.1));
    }
  };
});
P[T.GEARBOX] = (t) => {
  P[T.COBBLE](t);
  frame(t, [96, 98, 104], 2);
  for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) {
    const d = Math.hypot(x - 7.5, y - 7.5);
    if (d < 4.6 && d > 2.2) t.set(x, y, t.vary(((Math.atan2(y - 7.5, x - 7.5) * 8 / Math.PI) | 0) % 2 ? [150, 152, 158] : [118, 120, 128], 0.05));
    else if (d <= 2.2) t.set(x, y, [70, 70, 76]);
  }
};
P[T.MOSSY_BRICKS] = (t) => {
  P[T.BRICKS](t);
  for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) {
    const n = Math.sin(x * 0.9 + y * 0.4) + Math.cos(y * 1.1 - x * 0.3) + t.r() * 0.8;
    if (n > 0.9 || (y < 3 && t.r() < 0.5)) t.set(x, y, t.vary(t.r() < 0.5 ? [72, 112, 46] : [92, 134, 58], 0.12));
  }
};
P[T.SHRINE_SIDE] = (t) => {
  P[T.MOSSY_BRICKS](t);
  for (let y = 4; y < 12; y++) for (let x = 5; x < 11; x++) if ((x === 5 || x === 10 || y === 4 || y === 11)) t.set(x, y, [60, 62, 58]);
  for (const [x, y] of [[7, 6], [8, 6], [7, 9], [8, 9], [6, 7], [9, 8]]) t.set(x, y, [150, 230, 120]); // a glowing rune
};
const shrineTop = (glow) => (t) => {
  t.fill([96, 98, 92], 0.08);
  for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) {
    const d = Math.hypot(x - 7.5, y - 7.5);
    if (d < 5) t.set(x, y, glow ? t.vary(d < 2.5 ? [200, 255, 170] : [110, 200, 90], 0.08) : t.vary([60, 66, 58], 0.08));
    else if (x === 0 || y === 0 || x === 15 || y === 15) t.set(x, y, [72, 112, 46]);
  }
};
P[T.SHRINE_TOP] = shrineTop(true);
P[T.SHRINE_SPENT] = shrineTop(false);
P[T.CAULDRON] = (t) => { t.fill([52, 52, 58], 0.08); for (let x = 0; x < TILE; x++) { t.set(x, 0, [86, 86, 94]); t.set(x, 15, [36, 36, 40]); } };
P[T.CAULDRON_WATER] = (t) => { for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) t.set(x, y, t.vary(Math.sin(x * 0.8 + y * 0.5) > 0.6 ? [96, 150, 226] : [52, 100, 200], 0.06)); };
const bush = (ripe) => (t) => {
  for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) {
    if (t.r() < 0.12) { t.set(x, y, [0, 0, 0], 0); continue; }
    t.set(x, y, t.vary(t.r() < 0.35 ? [40, 92, 34] : [58, 120, 44], 0.25));
  }
  if (ripe) for (const [x, y] of [[3, 3], [10, 2], [6, 7], [13, 9], [2, 11], [9, 12], [12, 5], [5, 14]]) { t.set(x, y, [196, 30, 52]); t.set(x + 1, y, [150, 20, 40]); t.set(x, y + 1, [150, 20, 40]); t.set(x + 1, y + 1, [120, 14, 30]); t.set(x, y - 1, [240, 120, 130]); }
};
P[T.BUSH] = bush(false);
P[T.BUSH_RIPE] = bush(true);
P[T.FRAME_BACK] = (t) => { t.fill([128, 88, 52], 0.06); t.speckle([110, 74, 42], 0.15, 0.05); };
P[T.TRAPDOOR] = (t) => {
  P[T.PLANKS](t);
  for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) {
    const frame = x < 2 || y < 2 || x > 13 || y > 13;
    const hole = !frame && (x === 5 || x === 10) && y > 3 && y < 12;
    if (frame) t.set(x, y, t.vary([126, 92, 54], 0.06));
    else if (hole) t.set(x, y, [0, 0, 0], 0);
  }
  for (const x of [3, 12]) for (const y of [3, 12]) t.set(x, y, [70, 70, 76]); // nails
};

// ----- caves, bees and villages -----
P[T.GLOW_MUSHROOM] = (t) => {
  for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) t.set(x, y, [0, 0, 0], 0);
  for (const [cx, cy, r, h] of [[5, 7, 3.2, 6], [11, 9, 2.4, 5], [8, 12, 1.8, 3]]) {
    for (let y = cy; y < Math.min(16, cy + h); y++) { t.set(Math.round(cx), y, t.vary([200, 220, 196], 0.08)); }
    for (let y = cy - r; y <= cy; y++) for (let x = cx - r - 1; x <= cx + r + 1; x++) {
      const d = Math.hypot((x - cx) / (r + 1), (y - cy) / r);
      if (d < 1 && y <= cy) t.set(Math.round(x), Math.round(y), d > 0.7 ? [40, 150, 170] : t.r() < 0.25 ? [200, 255, 250] : t.vary([90, 220, 220], 0.1));
    }
  }
};
P[T.GEODE_SHELL] = (t) => { t.fill([214, 210, 200], 0.08); t.speckle([186, 182, 172], 0.2, 0.05); t.speckle([240, 238, 232], 0.08, 0.03); };
P[T.CRYSTAL] = (t) => {
  for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) {
    const facet = ((x * 3 + y * 5) >> 3) % 3;
    t.set(x, y, t.vary([[150, 96, 214], [178, 128, 236], [122, 74, 186]][facet], 0.08));
  }
  for (let i = 0; i < 6; i++) { const x = (t.r() * 15) | 0, y = (t.r() * 15) | 0; t.set(x, y, [236, 210, 255]); t.set(x + 1, y + 1, [210, 170, 250]); }
};
P[T.CRYSTAL_CLUSTER] = (t) => {
  for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) t.set(x, y, [0, 0, 0], 0);
  for (const [cx, top, w] of [[7.5, 2, 1.6], [4, 7, 1.2], [11.5, 6, 1.3], [9.5, 9, 1]]) {
    for (let y = top; y < 16; y++) for (let x = Math.floor(cx - w); x <= Math.ceil(cx + w); x++) {
      const k = Math.min(1, (y - top + 1) / 3);
      if (Math.abs(x - cx) <= w * k) t.set(x, y, x < cx ? [214, 176, 252] : t.vary([156, 100, 222], 0.08));
    }
  }
};
const hiveRings = (t) => {
  for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) t.set(x, y, t.vary(y % 4 === 3 ? [176, 130, 52] : [222, 178, 82], 0.06));
};
P[T.HIVE_SIDE] = hiveRings;
P[T.HIVE_TOP] = (t) => { t.fill([200, 156, 70], 0.06); for (let i = 0; i < 16; i++) { t.set(i, 0, [150, 110, 44]); t.set(i, 15, [150, 110, 44]); t.set(0, i, [150, 110, 44]); t.set(15, i, [150, 110, 44]); } };
const hiveFront = (full) => (t) => {
  hiveRings(t);
  for (let y = 7; y < 11; y++) for (let x = 5; x < 11; x++) t.set(x, y, [44, 30, 14]); // the way in
  if (full) for (const [x, y0, n] of [[3, 0, 6], [6, 3, 4], [12, 1, 7], [9, 11, 4], [2, 9, 5]]) for (let y = y0; y < y0 + n; y++) t.set(x, y, y === y0 + n - 1 ? [255, 200, 60] : [240, 170, 30]);
};
P[T.HIVE_FRONT] = hiveFront(false);
// an apiary: a white-painted bee box of stacked supers, with a slot of an entrance at the bottom
const apiarySide = (t) => {
  for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) t.set(x, y, t.vary(y % 5 === 4 ? [196, 192, 178] : [236, 232, 218], 0.03));
  for (let y = 0; y < TILE; y++) { t.set(0, y, [180, 176, 160]); t.set(15, y, [180, 176, 160]); }
};
P[T.APIARY_SIDE] = apiarySide;
P[T.APIARY_TOP] = (t) => { t.fill([150, 112, 64], 0.06); for (let i = 0; i < 16; i++) { t.set(i, 0, [110, 80, 44]); t.set(i, 15, [110, 80, 44]); t.set(0, i, [110, 80, 44]); t.set(15, i, [110, 80, 44]); } };
const apiaryFront = (full) => (t) => {
  apiarySide(t);
  for (let x = 3; x < 13; x++) { t.set(x, 13, [40, 28, 14]); t.set(x, 12, [70, 50, 26]); } // the entrance slot
  if (full) for (const [x, y0, n] of [[3, 1, 5], [7, 0, 3], [11, 2, 6], [5, 6, 4], [13, 7, 3]]) for (let y = y0; y < y0 + n; y++) t.set(x, y, y === y0 + n - 1 ? [255, 200, 60] : [240, 170, 30]);
};
P[T.APIARY_FRONT] = apiaryFront(false);
P[T.APIARY_FULL] = apiaryFront(true);
P[T.HIVE_FULL] = hiveFront(true);
P[T.BELL] = (t) => { for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) t.set(x, y, t.vary(shade([236, 196, 76], 0.8 + 0.25 * Math.sin(x * 0.5)), 0.05)); };

// ----- enchanting and lairs -----
P[T.ALTAR_SIDE] = (t) => {
  P[T.OBSIDIAN](t);
  for (let x = 0; x < TILE; x++) { t.set(x, 0, [196, 160, 64]); t.set(x, 1, [150, 116, 40]); }
  for (const [x, y] of [[3, 6], [4, 7], [3, 8], [8, 5], [8, 9], [7, 7], [9, 7], [12, 6], [13, 7], [12, 8]]) t.set(x, y, [190, 140, 255]);
};
P[T.ALTAR_TOP] = (t) => {
  P[T.OBSIDIAN](t);
  for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) {
    const d = Math.hypot(x - 7.5, y - 7.5);
    if (Math.abs(d - 6) < 0.6) t.set(x, y, [196, 160, 64]);
    else if (Math.abs(d - 3.5) < 0.5) t.set(x, y, [170, 120, 240]);
  }
};
const brickTile = (brick, mortar) => (t) => bricks(t, brick, mortar);
P[T.CUT_SANDSTONE] = (t) => {
  t.fill([214, 196, 140], 0.05);
  for (let i = 0; i < 16; i++) { t.set(i, 0, [188, 168, 112]); t.set(i, 15, [176, 156, 100]); t.set(0, i, [196, 176, 120]); t.set(15, i, [176, 156, 100]); }
  for (let x = 3; x < 13; x++) { t.set(x, 4, [190, 170, 116]); t.set(x, 11, [190, 170, 116]); }
};
P[T.TRAP_PLATE] = (t) => { P[T.CUT_SANDSTONE](t); t.set(5, 7, [176, 156, 100]); t.set(6, 8, [176, 156, 100]); t.set(10, 9, [180, 160, 104]); };
P[T.DART_FRONT] = (t) => {
  P[T.CUT_SANDSTONE](t);
  for (const [x, y] of [[4, 6], [11, 6], [4, 10], [11, 10], [7, 8]]) { t.set(x, y, [40, 30, 20]); t.set(x + 1, y, [40, 30, 20]); t.set(x, y + 1, [60, 46, 30]); t.set(x + 1, y + 1, [60, 46, 30]); }
};
P[T.FROST_BRICKS] = brickTile([170, 210, 236], [120, 160, 196]);
P[T.FORT_BRICKS] = brickTile([92, 34, 34], [44, 18, 22]);
const lairShrine = (base, rune) => (t) => {
  P[base](t);
  for (let y = 4; y < 12; y++) for (let x = 5; x < 11; x++) if (x === 5 || x === 10 || y === 4 || y === 11) t.set(x, y, shade(rune, 0.45));
  for (const [x, y] of [[7, 6], [8, 6], [7, 9], [8, 9], [6, 7], [9, 8], [7, 7], [8, 8]]) t.set(x, y, rune);
};
P[T.TOMB_SHRINE] = lairShrine(T.CUT_SANDSTONE, [255, 200, 60]);
P[T.CRYPT_SHRINE] = lairShrine(T.FROST_BRICKS, [200, 250, 255]);
P[T.FORT_SHRINE] = lairShrine(T.FORT_BRICKS, [255, 120, 40]);
P[T.SHRINE_GLYPH] = (t) => {
  t.fill([70, 66, 72], 0.08);
  for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) {
    const d = Math.hypot(x - 7.5, y - 7.5);
    if (d < 5 && (Math.abs(x - 7.5) < 1 || Math.abs(y - 7.5) < 1 || Math.abs(d - 4) < 0.6)) t.set(x, y, [250, 236, 200]);
  }
};

// automation: an observer's stone face with a slit eye (red while it signals); a gauge's dial;
// a harvester's blades; a steam engine's riveted boiler with its firebox door
P[T.OBSERVER_SIDE] = (t) => {
  for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) t.set(x, y, t.vary([112, 112, 116], 0.06));
  frame(t, [78, 78, 84], 1);
  for (let x = 3; x < 13; x++) t.set(x, 7, [90, 90, 96]);
};
const observerFace = (on) => (t) => {
  P[T.OBSERVER_SIDE](t);
  for (let y = 5; y < 11; y++) for (let x = 2; x < 14; x++) t.set(x, y, [40, 40, 46]);
  for (let x = 4; x < 12; x++) t.set(x, 7, on ? [255, 70, 50] : [150, 150, 160]), t.set(x, 8, on ? [200, 40, 30] : [110, 110, 120]);
};
P[T.OBSERVER_FACE] = observerFace(false);
P[T.OBSERVER_FACE_ON] = observerFace(true);
const gaugeFace = (on) => (t) => {
  P[T.OBSERVER_SIDE](t);
  for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) {
    const d = Math.hypot(x - 7.5, y - 8.5);
    if (d < 5.5) t.set(x, y, d > 4.6 ? [184, 116, 64] : [232, 226, 206]);
  }
  // the needle: down to the left when empty, swung up to the right when it signals
  for (let i = 0; i < 4; i++) t.set(Math.round(7.5 + (on ? 1 : -1) * i * 0.8), Math.round(8.5 - i * (on ? 0.9 : -0.3)), on ? [220, 40, 30] : [40, 40, 50]);
  t.set(7, 8, [40, 40, 50]);
};
P[T.GAUGE_FACE] = gaugeFace(false);
P[T.GAUGE_FACE_ON] = gaugeFace(true);
P[T.HARVESTER_FRONT] = (t) => {
  P[T.DRILL_SIDE](t);
  for (let y = 2; y < 14; y += 4) for (let x = 1; x < 15; x++) {
    t.set(x, y, [210, 214, 222]); t.set(x, y + 1, x % 3 ? [150, 154, 164] : [96, 100, 110]);
  }
};
P[T.ENGINE_SIDE] = (t) => {
  for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) t.set(x, y, t.vary(shade([176, 104, 60], 0.85 + 0.15 * Math.sin(y * 0.9)), 0.04));
  for (const y of [1, 14]) for (let x = 1; x < 15; x += 3) t.set(x, y, [230, 190, 120]);
  for (const x of [0, 15]) for (let y = 0; y < TILE; y++) t.set(x, y, [70, 70, 76]);
};
P[T.ENGINE_TOP] = (t) => {
  P[T.ENGINE_SIDE](t);
  for (let y = 5; y < 11; y++) for (let x = 5; x < 11; x++) t.set(x, y, Math.hypot(x - 7.5, y - 7.5) < 2 ? [30, 30, 34] : [90, 92, 100]); // the chimney
};
const engineFront = (on) => (t) => {
  P[T.ENGINE_SIDE](t);
  for (let y = 6; y < 13; y++) for (let x = 3; x < 13; x++) {
    const edge = y === 6 || y === 12 || x === 3 || x === 12;
    t.set(x, y, edge ? [50, 50, 56] : on ? ((x + y) % 3 ? [255, 150, 40] : [255, 220, 90]) : [34, 30, 30]);
  }
  for (const [x, y] of [[5, 3], [10, 3]]) t.set(x, y, [210, 210, 220]); // gauges
};
P[T.ENGINE_FRONT] = engineFront(false);
P[T.ENGINE_FRONT_ON] = engineFront(true);

// pillars: fluted columns, with a rim on top
const pillarSide = (c) => (t) => {
  for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) {
    const groove = x % 4 === 1, rim = y < 1 || y > 14;
    t.set(x, y, t.vary(shade(c, rim ? 0.82 : groove ? 0.78 : 1 - Math.abs(x % 4 - 2.5) * 0.04), 0.03));
  }
};
const pillarTop = (c) => (t) => {
  for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) {
    const d = Math.max(Math.abs(x - 7.5), Math.abs(y - 7.5));
    t.set(x, y, t.vary(shade(c, d > 6 ? 0.8 : d > 4.5 ? 0.92 : 1), 0.03));
  }
};
P[T.PILLAR_SIDE] = pillarSide([196, 194, 190]);
P[T.PILLAR_TOP] = pillarTop([196, 194, 190]);
P[T.SAND_PILLAR_SIDE] = pillarSide([226, 208, 152]);
P[T.SAND_PILLAR_TOP] = pillarTop([226, 208, 152]);
P[T.CANDLE] = (t) => { for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) t.set(x, y, t.vary([240, 232, 206], 0.03)); };

// signals: copper wire, dull or glowing; the smooth stone plate logic blocks sit on
P[T.WIRE_OFF] = (t) => { for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) t.set(x, y, t.vary((x + y) % 4 ? [150, 82, 46] : [186, 110, 64], 0.06)); };
P[T.WIRE_ON] = (t) => { for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) t.set(x, y, t.vary((x + y) % 4 ? [255, 120, 50] : [255, 214, 120], 0.05)); };
// an ejector's dark mouth with a push plate; an auto-crafter's side: a little grid with gears
P[T.EJECTOR_FRONT] = (t) => {
  P[T.OBSERVER_SIDE](t);
  for (let y = 3; y < 13; y++) for (let x = 3; x < 13; x++) t.set(x, y, x === 3 || x === 12 || y === 3 || y === 12 ? [70, 70, 76] : [28, 26, 30]);
  for (let y = 6; y < 10; y++) for (let x = 6; x < 10; x++) t.set(x, y, [200, 120, 70]);
};
P[T.CRAFTER_FRONT] = (t) => {
  P[T.TABLE_SIDE](t);
  for (let y = 2; y < 9; y++) for (let x = 2; x < 9; x++) t.set(x, y, (x - 2) % 2 && (y - 2) % 2 ? [150, 110, 64] : [90, 90, 98]);
  for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) {
    const d = Math.hypot(x - 11.5, y - 11.5);
    if (d < 3.6 && (d > 2.4 || d < 1)) t.set(x, y, [176, 176, 184]);
    else if (d >= 3.6 && d < 4.4 && (Math.round(Math.atan2(y - 11.5, x - 11.5) * 4 / Math.PI) & 1)) t.set(x, y, [150, 150, 160]);
  }
};
P[T.TANK_WATER] = (t) => { for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) t.set(x, y, t.vary(Math.sin(x * 0.8 + y * 0.4) > 0.6 ? [96, 150, 232] : [52, 104, 210], 0.05)); };
// farm machines: a planter's soil-filled mouth with a sprout; a placer's hatch; an animal station's
// hay-packed slats; netting
P[T.PLANTER_FRONT] = (t) => {
  P[T.PLANKS](t);
  for (let y = 7; y < 15; y++) for (let x = 2; x < 14; x++) t.set(x, y, t.vary([104, 74, 50], 0.12));
  for (let y = 3; y < 8; y++) t.set(8, y, [90, 160, 60]);
  t.set(7, 4, [110, 180, 70]); t.set(9, 5, [110, 180, 70]); t.set(6, 3, [110, 180, 70]);
};
P[T.PLACER_FRONT] = (t) => {
  P[T.OBSERVER_SIDE](t);
  for (let y = 3; y < 13; y++) for (let x = 3; x < 13; x++) t.set(x, y, x === 3 || x === 12 || y === 3 || y === 12 ? [70, 70, 76] : [96, 72, 48]);
  for (let x = 5; x < 11; x++) t.set(x, 8, [60, 46, 30]);
};
P[T.RANCH_SIDE] = (t) => {
  P[T.PLANKS](t);
  for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) if (y % 4 === 1 || y % 4 === 2) t.set(x, y, t.vary([214, 188, 92], 0.12));
};
P[T.NET] = (t) => {
  for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) t.set(x, y, [0, 0, 0], 0);
  for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) if ((x + y) % 4 === 0 || (x - y + 16) % 4 === 0) t.set(x, y, [222, 210, 170]);
};
// electricity: electrum wire, a generator's copper coils, a charger, a pulverizer's intake, electric lamp glass
P[T.ELWIRE_OFF] = (t) => { for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) t.set(x, y, t.vary((x + y) % 4 ? [196, 168, 70] : [230, 210, 120], 0.06)); };
P[T.ELWIRE_ON] = (t) => { for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) t.set(x, y, t.vary((x + y) % 4 ? [255, 226, 90] : [255, 252, 200], 0.05)); };
P[T.GEN_SIDE] = (t) => {
  P[T.IRON](t);
  for (let y = 3; y < 13; y++) for (let x = 2; x < 14; x++) t.set(x, y, t.vary(y % 2 ? [196, 106, 52] : [150, 76, 36], 0.05)); // coils
  for (let y = 3; y < 13; y++) { t.set(2, y, [70, 72, 80]); t.set(13, y, [70, 72, 80]); }
  t.set(7, 1, [240, 216, 110]); t.set(8, 1, [240, 216, 110]);
};
P[T.GEN_TOP] = (t) => {
  P[T.IRON](t);
  for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) {
    const d = Math.hypot(x - 7.5, y - 7.5);
    if (d < 5.5 && d > 2) t.set(x, y, t.vary(d > 4 ? [150, 76, 36] : [196, 106, 52], 0.05));
    else if (d <= 2) t.set(x, y, [90, 92, 100]);
  }
};
P[T.CHARGER_SIDE] = (t) => {
  P[T.IRON](t);
  for (let x = 3; x < 13; x++) t.set(x, 5, [60, 62, 70]);
  for (const [x, c] of [[4, [90, 220, 90]], [7, [230, 210, 80]], [10, [220, 80, 60]]]) { t.set(x, 9, c); t.set(x + 1, 9, c); t.set(x, 10, c); t.set(x + 1, 10, c); }
};
P[T.CHARGER_TOP] = (t) => {
  P[T.IRON](t);
  for (let y = 4; y < 12; y++) for (let x = 5; x < 11; x++) t.set(x, y, x === 5 || x === 10 || y === 4 || y === 11 ? [60, 62, 70] : [36, 36, 42]);
  for (let x = 6; x < 10; x++) t.set(x, 5, [230, 210, 120]);
};
P[T.PULV_SIDE] = (t) => {
  P[T.STAINLESS](t);
  for (let y = 6; y < 10; y++) for (let x = 0; x < TILE; x++) if ((x + y) % 3 === 0) t.set(x, y, [120, 126, 136]);
  for (let x = 0; x < TILE; x++) t.set(x, 12, [214, 186, 80]);
};
P[T.PULV_FRONT] = (t) => {
  P[T.STAINLESS](t);
  for (let y = 3; y < 13; y++) for (let x = 3; x < 13; x++) {
    const teeth = (x + y) % 3 === 0;
    t.set(x, y, x === 3 || x === 12 || y === 3 || y === 12 ? [90, 94, 104] : teeth ? [170, 174, 186] : [34, 34, 40]);
  }
  t.set(13, 1, [90, 220, 90]); t.set(14, 1, [90, 220, 90]);
};
P[T.ELAMP_OFF] = (t) => {
  for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) t.set(x, y, t.vary([170, 186, 196], 0.04));
  for (let y = 3; y < 13; y++) { t.set(7, y, [120, 110, 90]); t.set(8, y, [120, 110, 90]); }
};
P[T.ELAMP_ON] = (t) => {
  for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) t.set(x, y, t.vary(Math.hypot(x - 7.5, y - 7.5) < 4 ? [255, 255, 236] : [255, 244, 190], 0.03));
};
// v22: grid battery, motor, solar cells, power meter, daylight sensor, electric smelter, cable, spawner,
// programmable crafter, item counter, teleport pad, quarry, turbine blades
const fill = (t, c, k = 0.05) => { for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) t.set(x, y, t.vary(c, k)); };
P[T.GRIDBAT_SIDE] = (t) => {
  fill(t, [84, 92, 118]); frame(t, [60, 64, 82], 1);
  for (const x0 of [3, 9]) for (let y = 3; y < 13; y++) for (let x = x0; x < x0 + 4; x++) t.set(x, y, t.vary(y > 8 ? [110, 200, 70] : [104, 112, 138], 0.04));
  for (const x0 of [4, 10]) { t.set(x0, 2, [230, 204, 100]); t.set(x0 + 1, 2, [230, 204, 100]); }
};
P[T.GRIDBAT_TOP] = (t) => { fill(t, [84, 92, 118]); frame(t, [60, 64, 82], 1); for (const [x, y] of [[4, 4], [10, 4], [4, 10], [10, 10]]) { t.set(x, y, [230, 204, 100]); t.set(x + 1, y, [230, 204, 100]); t.set(x, y + 1, [200, 176, 80]); t.set(x + 1, y + 1, [200, 176, 80]); } };
P[T.MOTOR_SIDE] = (t) => {
  P[T.IRON](t);
  for (let y = 2; y < 14; y += 2) for (let x = 1; x < 15; x++) t.set(x, y, [84, 86, 94]); // cooling fins
  for (let y = 6; y < 10; y++) for (let x = 6; x < 10; x++) t.set(x, y, [214, 186, 80]);
};
P[T.MOTOR_TOP] = (t) => {
  P[T.IRON](t);
  for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) { const d = Math.hypot(x - 7.5, y - 7.5); if (d < 3) t.set(x, y, [70, 72, 80]); else if (d < 6) t.set(x, y, t.vary([214, 186, 80], 0.06)); }
};
P[T.SOLAR_TOP] = (t) => {
  for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) {
    const line = x % 5 === 0 || y % 5 === 0;
    t.set(x, y, line ? [196, 200, 210] : t.vary((x + y) % 7 === 0 ? [70, 100, 170] : [36, 56, 120], 0.05));
  }
};
const dial = (t, on) => {
  P[T.IRON](t);
  for (let y = 3; y < 11; y++) for (let x = 3; x < 13; x++) t.set(x, y, x === 3 || x === 12 || y === 3 || y === 10 ? [60, 62, 70] : [236, 232, 214]);
  for (let k = 0; k < 4; k++) t.set(on ? 7 - k : 8 + k, 9 - k, [200, 40, 30]); // needle
  t.set(7, 13, on ? [255, 80, 60] : [90, 40, 36]); t.set(8, 13, on ? [255, 80, 60] : [90, 40, 36]);
};
P[T.METER_FACE] = (t) => dial(t, false);
P[T.METER_FACE_ON] = (t) => dial(t, true);
const daySense = (t, on) => {
  for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) t.set(x, y, t.vary([180, 200, 214], 0.04));
  frame(t, [120, 85, 45], 2);
  for (let y = 4; y < 12; y++) for (let x = 4; x < 12; x++) if (Math.hypot(x - 7.5, y - 7.5) < 3.5) t.set(x, y, on ? [255, 214, 90] : [80, 90, 130]);
};
P[T.DAYSENSE_TOP] = (t) => daySense(t, false);
P[T.DAYSENSE_TOP_ON] = (t) => daySense(t, true);
P[T.ESMELT_SIDE] = (t) => { P[T.STAINLESS](t); for (let y = 4; y < 12; y += 2) for (let x = 3; x < 13; x++) t.set(x, y, [120, 126, 136]); for (let x = 0; x < TILE; x++) t.set(x, 13, [214, 186, 80]); };
P[T.ESMELT_FRONT] = (t) => {
  P[T.STAINLESS](t);
  for (let y = 4; y < 13; y++) for (let x = 3; x < 13; x++) t.set(x, y, x === 3 || x === 12 || y === 4 || y === 12 ? [90, 94, 104] : y % 2 ? [255, 120, 40] : [200, 60, 20]); // glowing coils
  t.set(13, 2, [90, 220, 90]); t.set(14, 2, [90, 220, 90]);
};
P[T.CABLE] = (t) => { for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) t.set(x, y, t.vary((x + 2 * y) % 6 < 1 ? [214, 170, 140] : [60, 62, 70], 0.06)); };
P[T.SPAWNER] = (t) => {
  for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) {
    const bar = x % 5 === 0 || y % 5 === 0 || x === 15 || y === 15;
    if (bar) t.set(x, y, t.vary([50, 54, 64], 0.08)); else t.set(x, y, [0, 0, 0], 0); // a cage you can see into
  }
  for (const [x, y] of [[7, 7], [8, 7], [7, 8], [8, 8], [2, 12], [12, 2]]) t.set(x, y, [200, 60, 220]);
};
P[T.PCRAFT_TOP] = (t) => { P[T.TABLE_TOP](t); for (let x = 2; x < 14; x++) t.set(x, 14, [236, 218, 140]); t.set(2, 2, [90, 220, 90]); };
P[T.PCRAFT_SIDE] = (t) => { P[T.CRAFTER_FRONT](t); for (let x = 1; x < 15; x += 3) t.set(x, 1, [236, 218, 140]); };
const counter = (t, on) => {
  P[T.IRON](t);
  for (let y = 4; y < 11; y++) for (let x = 2; x < 14; x++) t.set(x, y, x === 2 || x === 13 || y === 4 || y === 10 ? [60, 62, 70] : [30, 32, 36]);
  for (const x0 of [4, 8]) for (let y = 6; y < 9; y++) { t.set(x0, y, [255, 170, 60]); t.set(x0 + 2, y, [255, 170, 60]); } // digits
  t.set(7, 12, on ? [255, 80, 60] : [90, 40, 36]); t.set(8, 12, on ? [255, 80, 60] : [90, 40, 36]);
};
P[T.COUNTER_FRONT] = (t) => counter(t, false);
P[T.COUNTER_FRONT_ON] = (t) => counter(t, true);
const pad = (t, on) => {
  P[T.STAINLESS](t);
  for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) {
    const d = Math.hypot(x - 7.5, y - 7.5);
    if (d < 6.5 && d > 5) t.set(x, y, on ? [140, 240, 255] : [70, 90, 110]);
    else if (d < 3) t.set(x, y, on ? [210, 250, 255] : [90, 100, 120]);
  }
};
P[T.TELEPAD] = (t) => pad(t, false);
P[T.TELEPAD_ON] = (t) => pad(t, true);
P[T.QUARRY_SIDE] = (t) => { P[T.STAINLESS](t); frame(t, [214, 186, 80], 1); for (let y = 5; y < 11; y++) for (let x = 5; x < 11; x++) t.set(x, y, [120, 126, 136]); };
P[T.QUARRY_FRONT] = (t) => {
  P[T.STAINLESS](t);
  for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) { const d = Math.hypot(x - 7.5, y - 7.5); if (d < 6) t.set(x, y, (Math.atan2(y - 7.5, x - 7.5) * 3 / Math.PI + 6 + d / 3) % 2 < 1 ? [124, 120, 152] : [80, 76, 100]); } // a tungsten bit
};
P[T.TURBINE] = (t) => fill(t, [236, 238, 240], 0.03);
// v23: geothermal generator, wireless charger, lift, reactor
P[T.GEO_SIDE] = (t) => {
  P[T.OBSIDIAN](t);
  for (let y = 3; y < 13; y++) for (let x = 3; x < 13; x++) t.set(x, y, x === 3 || x === 12 || y === 3 || y === 12 ? [150, 154, 164] : t.vary(y > 8 ? [255, 120, 30] : [90, 40, 30], 0.08));
  for (let x = 4; x < 12; x += 2) t.set(x, 8, [255, 200, 80]);
};
P[T.GEO_TOP] = (t) => { P[T.OBSIDIAN](t); frame(t, [150, 154, 164], 1); for (let y = 5; y < 11; y++) for (let x = 5; x < 11; x++) t.set(x, y, t.vary([255, 110, 30], 0.12)); };
P[T.WCHARGE_SIDE] = (t) => { P[T.CHARGER_SIDE](t); for (let x = 2; x < 14; x++) t.set(x, 2, [214, 170, 140]); };
P[T.WCHARGE_TOP] = (t) => {
  P[T.IRON](t);
  for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) { const d = Math.hypot(x - 7.5, y - 7.5); if (d < 2) t.set(x, y, [140, 240, 255]); else if (Math.abs(d - 4.5) < 0.6 || Math.abs(d - 7) < 0.6) t.set(x, y, [214, 170, 140]); }
};
P[T.ELEVATOR_TOP] = (t) => {
  P[T.STAINLESS](t); frame(t, [214, 186, 80], 1);
  for (let k = 0; k < 4; k++) { for (let x = 7 - k; x <= 8 + k; x++) { t.set(x, 3 + k, [90, 220, 90]); t.set(x, 12 - k, [230, 120, 40]); } } // up and down arrows
};
P[T.ELEVATOR_SIDE] = (t) => { P[T.STAINLESS](t); for (let y = 0; y < TILE; y += 3) for (let x = 0; x < TILE; x++) t.set(x, y, [120, 126, 136]); for (let y = 0; y < TILE; y++) { t.set(1, y, [214, 186, 80]); t.set(14, y, [214, 186, 80]); } };
const reactor = (t, hot) => {
  fill(t, [70, 76, 84]); frame(t, [46, 50, 56], 1);
  for (let y = 3; y < 13; y++) for (let x = 3; x < 13; x++) t.set(x, y, x === 3 || x === 12 || y === 3 || y === 12 ? [180, 186, 196] : t.vary(hot ? [255, 120, 60] : [110, 230, 80], 0.1)); // a glass window on the core
  for (let x = 5; x < 12; x += 3) for (let y = 4; y < 12; y++) t.set(x, y, [60, 64, 70]); // the rods
  for (let x = 2; x < 14; x += 2) { t.set(x, 14, [230, 200, 40]); t.set(x + 1, 14, [30, 30, 30]); } // warning stripes
};
P[T.REACTOR_SIDE] = (t) => reactor(t, false);
P[T.REACTOR_SIDE_HOT] = (t) => reactor(t, true);
P[T.REACTOR_TOP] = (t) => { fill(t, [70, 76, 84]); frame(t, [46, 50, 56], 1); for (const [x, y] of [[4, 4], [10, 4], [4, 10], [10, 10]]) for (let k = 0; k < 2; k++) for (let j = 0; j < 2; j++) t.set(x + k, y + j, [150, 156, 166]); };
// v24: bookshelf, compost bin
P[T.BOOKSHELF] = (t) => {
  P[T.PLANKS](t);
  const spines = [[150, 40, 40], [40, 80, 150], [50, 120, 60], [140, 110, 50], [100, 50, 120], [170, 150, 120]];
  for (const y0 of [1, 9]) {
    for (let x = 1; x < 15;) {
      const w = 1 + ((t.r() * 2) | 0), c = spines[(t.r() * spines.length) | 0], h = 5 + ((t.r() * 2) | 0);
      for (let k = 0; k < w && x < 15; k++, x++) for (let y = y0 + 6 - h; y < y0 + 6; y++) t.set(x, y, t.vary(c, 0.12));
      if (t.r() < 0.3) x++;
    }
    for (let x = 0; x < TILE; x++) t.set(x, y0 + 6, [96, 70, 40]);
  }
};
P[T.COMPOST_SIDE] = (t) => {
  P[T.PLANKS](t);
  for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) if (y % 4 === 3) t.set(x, y, t.vary([70, 52, 30], 0.1)); // slats with gaps
  for (let y = 0; y < TILE; y++) { t.set(0, y, [96, 70, 40]); t.set(15, y, [96, 70, 40]); }
};
P[T.COMPOST_TOP] = (t) => {
  P[T.PLANKS](t);
  for (let y = 2; y < 14; y++) for (let x = 2; x < 14; x++) t.set(x, y, t.vary(t.r() < 0.2 ? [90, 120, 50] : [74, 54, 34], 0.2)); // the heap inside
};
// v24 B/C: lead-lined chest, centrifuge, tesla coil, electric fence, freezer, arc furnace, packed ice, invar
const LEAD = [104, 110, 134];
P[T.LEAD_CHEST_SIDE] = (t) => { chestFace(t, LEAD, 'side'); for (let x = 2; x < 14; x += 3) t.set(x, 2, [230, 200, 40]); };
P[T.LEAD_CHEST_TOP] = (t) => chestFace(t, LEAD, 'top');
P[T.LEAD_CHEST_FRONT] = (t) => {
  chestFace(t, LEAD, 'front');
  for (const [x, y] of [[7, 11], [8, 11], [6, 12], [9, 12], [7, 13], [8, 13]]) t.set(x, y, [230, 200, 40]); // a little warning trefoil
};
P[T.CENTRIFUGE_SIDE] = (t) => {
  P[T.STAINLESS](t); frame(t, [120, 126, 136], 1);
  for (let y = 4; y < 12; y++) for (let x = 4; x < 12; x++) t.set(x, y, [70, 80, 90]);
  for (let y = 5; y < 11; y++) t.set(7 + (y % 2), y, [126, 214, 72]); // a glowing sample tube
};
P[T.CENTRIFUGE_TOP] = (t) => {
  P[T.STAINLESS](t);
  for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) { const d = Math.hypot(x - 7.5, y - 7.5); if (d < 6) t.set(x, y, (Math.atan2(y - 7.5, x - 7.5) * 4 / Math.PI + 8) % 2 < 1 ? [150, 156, 166] : [110, 116, 126]); }
  for (let y = 7; y < 9; y++) for (let x = 7; x < 9; x++) t.set(x, y, [214, 186, 80]);
};
P[T.INVAR] = (t) => { t.fill([168, 176, 170], 0.06); frame(t, [130, 138, 132], 1); };
P[T.TESLA] = (t) => {
  for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) t.set(x, y, y % 2 ? t.vary([222, 128, 72], 0.08) : [170, 90, 50]); // copper windings
};
P[T.TESLA_TOP] = (t) => { t.fill([200, 204, 212], 0.06); for (let x = 0; x < TILE; x++) t.set(x, 7, [240, 242, 250]); };
P[T.FENCE_POST] = (t) => {
  t.fill([84, 88, 96], 0.08);
  for (const y of [6, 9, 12]) for (let x = 0; x < TILE; x++) t.set(x, y, [230, 200, 40]); // insulators where the wires run
};
P[T.FENCE_WIRE] = (t) => t.fill([210, 214, 222], 0.05);
P[T.FREEZER_SIDE] = (t) => { t.fill([232, 238, 244], 0.03); frame(t, [180, 190, 200], 1); for (let x = 2; x < 14; x++) t.set(x, 13, [140, 196, 240]); };
P[T.FREEZER_FRONT] = (t) => {
  P[T.FREEZER_SIDE](t);
  for (let y = 3; y < 11; y++) for (let x = 3; x < 13; x++) t.set(x, y, t.vary([150, 200, 240], 0.08)); // a frosty window
  for (let k = 0; k < 4; k++) t.set(5 + k * 2, 5 + (k % 2) * 3, [240, 250, 255]);
  t.set(12, 6, [90, 96, 106]); t.set(12, 7, [90, 96, 106]); // the handle
};
P[T.ARC_SIDE] = (t) => { P[T.STAINLESS](t); for (let y = 0; y < TILE; y++) { t.set(2, y, [180, 70, 50]); t.set(13, y, [180, 70, 50]); } frame(t, [80, 84, 92], 1); };
P[T.ARC_FRONT] = (t) => {
  P[T.ARC_SIDE](t);
  for (let y = 4; y < 13; y++) for (let x = 4; x < 12; x++) t.set(x, y, [40, 40, 50]);
  let x = 5; for (let y = 5; y < 12; y++) { t.set(x, y, [200, 230, 255]); x += t.r() < 0.5 ? 1 : 0; if (x > 10) x = 10; } // the arc
  for (let y = 10; y < 13; y++) for (let x2 = 5; x2 < 11; x2++) t.set(x2, y, [255, 150 - (y - 10) * 30, 40]); // molten metal
};
P[T.PACKED_ICE] = (t) => {
  for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) t.set(x, y, t.vary([140, 180, 230], 0.08));
  for (let i = 0; i < 4; i++) { let x = t.r() * 16, y = t.r() * 16; for (let k = 0; k < 5; k++) { t.set(x | 0, y | 0, [200, 226, 250]); x += 1; y += t.r() < 0.5 ? 1 : -1; } }
};
// v24 E: volcanic basalt (columns on the sides, a cracked top), and the meteorite's glowing rock
P[T.BASALT] = (t) => {
  for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) t.set(x, y, t.vary(x % 5 === 0 ? [36, 36, 40] : [62, 62, 68], 0.08));
  t.speckle([84, 82, 88], 0.08, 0.05);
};
P[T.BASALT_TOP] = (t) => {
  t.fill([60, 60, 66], 0.08);
  for (let i = 0; i < 16; i++) { t.set(i, (i * 7) % 16, [34, 34, 38]); t.set((i * 5 + 3) % 16, i, [34, 34, 38]); }
};
P[T.METEORITE] = (t) => {
  t.fill([52, 44, 50], 0.18);
  t.speckle([120, 130, 170], 0.14, 0.08); // flecks of meteoric iron
  t.speckle([255, 150, 60], 0.05, 0.1); // still glowing
};
// v25 A: iron bars, flower pots, ivy and window-box flowers
P[T.IRON_BARS] = (t) => {
  for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) {
    const bar = x % 5 === 2 || x % 5 === 3, rail = y === 1 || y === 2 || y === 13 || y === 14;
    if (bar || rail) t.set(x, y, t.vary(bar && x % 5 === 2 ? [118, 118, 124] : [86, 86, 92], 0.06));
  }
};
P[T.POT] = (t) => {
  for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) t.set(x, y, t.vary(y < 3 ? [196, 104, 62] : [176, 88, 52], 0.06));
  for (let x = 0; x < TILE; x++) t.set(x, 3, [140, 66, 38]); // under the rim
};
P[T.IVY] = (t) => {
  // trailing strands of ivy, hanging down from the top
  for (const [x0, len] of [[2, 14], [5, 11], [8, 16], [11, 12], [13, 15]]) {
    for (let y = 0; y < len; y++) {
      const x = x0 + (Math.sin(y * 0.8 + x0) > 0.4 ? 1 : 0);
      t.set(x, y, t.vary([50, 110, 40], 0.15));
      if (y % 3 === 1) { t.set(x - 1, y, t.vary([70, 140, 50], 0.2)); t.set(x + 1, y + 1, t.vary([60, 128, 46], 0.2)); }
    }
  }
};
P[T.BOX_FLOWERS] = (t) => {
  const heads = [[220, 40, 40], [250, 210, 50], [80, 110, 230], [170, 110, 210], [245, 245, 240]];
  for (let k = 0; k < 6; k++) {
    const x = 1 + k * 2.6 | 0, top = 5 + (k * 5) % 4;
    for (let y = top; y < TILE; y++) t.set(x, y, t.vary([60, 130, 46], 0.15));
    t.set(x + 1, top + 4, [70, 145, 50]);
    const c = heads[k % heads.length];
    for (const [dx, dy] of [[0, -1], [-1, 0], [1, 0], [0, 1], [0, 0]]) t.set(x + dx, top - 1 + dy, dx || dy ? t.vary(c, 0.08) : [250, 220, 90]);
  }
};
// v25 B: fruit trees (apple, cherry, orange), hay and sacking
const FRUIT_GREEN = [[56, 120, 40], [70, 128, 52], [48, 112, 46]];
const FRUIT_COLOURS = [[[200, 30, 30], [236, 90, 70]], [[140, 10, 30], [190, 40, 60]], [[236, 130, 20], [252, 176, 60]]];
for (let k = 0; k < 3; k++) {
  const leaves = (t) => {
    for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) {
      if (t.r() < 0.2) t.set(x, y, [0, 0, 0], 0);
      else t.set(x, y, t.vary(t.r() < 0.3 ? shade(FRUIT_GREEN[k], 0.75) : FRUIT_GREEN[k], 0.28));
    }
  };
  P[T.FRUIT_LEAVES + k] = leaves;
  P[T.FRUIT_RIPE + k] = (t) => {
    leaves(t);
    const [c, hi] = FRUIT_COLOURS[k];
    for (const [fx, fy] of [[3, 3], [10, 2], [6, 9], [12, 10], [2, 12]]) {
      if (k === 1) { // cherries hang in pairs on stalks
        t.set(fx, fy - 1, [70, 90, 30]); t.set(fx, fy, c); t.set(fx + 2, fy, c); t.set(fx + 1, fy - 1, [70, 90, 30]); t.set(fx, fy + 1, c); t.set(fx + 2, fy + 1, c); t.set(fx, fy, hi);
      } else {
        for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) t.set(fx + dx, fy + dy, c);
        t.set(fx, fy, hi);
      }
    }
  };
  P[T.FRUIT_SAPLING + k] = (t) => {
    for (let y = 8; y < TILE; y++) { t.set(7, y, t.vary([112, 80, 46], 0.1)); t.set(8, y, t.vary([88, 62, 34], 0.1)); }
    const clump = (cx, cy, r) => {
      for (let y = cy - r; y <= cy + r; y++) for (let x = cx - r; x <= cx + r; x++) {
        if ((x - cx) ** 2 + (y - cy) ** 2 > r * r + 1 || t.r() < 0.12) continue;
        t.set(x, y, t.vary(FRUIT_GREEN[k], 0.25));
      }
    };
    clump(8, 5, 3); clump(4, 9, 2); clump(12, 8, 2);
    t.set(7, 4, FRUIT_COLOURS[k][0]); t.set(10, 6, FRUIT_COLOURS[k][0]);
  };
}
P[T.HAY] = (t) => {
  for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) t.set(x, y, t.vary((x + (y >> 2)) % 3 ? [214, 180, 80] : [180, 146, 56], 0.1));
};
P[T.SACK] = (t) => {
  t.fill([206, 184, 140], 0.08);
  for (let y = 0; y < TILE; y += 2) for (let x = 0; x < TILE; x++) t.set(x, y, t.vary([190, 168, 124], 0.05));
  for (const [x, y] of [[4, 6], [5, 6], [10, 6], [11, 6], [4, 7], [11, 7]]) t.set(x, y, [40, 30, 24]); // eyes
  for (let x = 5; x < 11; x++) t.set(x, 11 + (x === 5 || x === 10 ? -1 : 0), [90, 50, 30]); // a stitched grin
};
// v25 C: the lighthouse lamp's glowing heart
P[T.BEACON] = (t) => {
  for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) {
    const d = Math.hypot(x - 7.5, y - 7.5) / 8;
    t.set(x, y, [255, 250 - d * 40, 200 - d * 110]);
  }
};
// v24 D: the rail station's platform plate
P[T.RAIL_STOP] = (t) => {
  for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) t.set(x, y, ((x + y) >> 2) % 2 ? [220, 50, 40] : [240, 236, 228]);
};
P[T.LOGIC_BASE] = (t) => {
  for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) t.set(x, y, t.vary([172, 172, 168], 0.04));
  frame(t, [128, 128, 126], 1);
};

// A plank door: a frame with a centre board; the upper half has a four-pane window you can see through,
// the lower half has the handle.
function doorPanel(t, upper) {
  for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) {
    const frame = x < 2 || x > 13 || (upper ? y < 2 : y > 13);
    const window = upper && x > 3 && x < 12 && y > 3 && y < 12;
    if (window) {
      if (x === 7 || x === 8 || y === 7 || y === 8) t.set(x, y, [120, 84, 48]); // window bars
      else t.set(x, y, [0, 0, 0], 0); // see-through glass
    } else {
      t.set(x, y, t.vary(frame ? [118, 82, 46] : x % 4 === 1 ? [140, 100, 58] : [166, 122, 74], 0.06));
    }
  }
  if (!upper) { t.set(12, 2, [60, 60, 64]); t.set(12, 3, [90, 90, 96]); t.set(11, 3, [60, 60, 64]); } // handle
}

// Small bricks in staggered rows with mortar lines.
function bricks(t, brick, mortar) {
  for (let y = 0; y < TILE; y++) {
    const offset = (y >> 2) % 2 ? 4 : 0;
    for (let x = 0; x < TILE; x++) {
      const line = y % 4 === 3 || (x + offset) % 8 === 7;
      t.set(x, y, line ? t.vary(mortar, 0.06) : t.vary(brick, 0.1));
    }
  }
}

// A dark fire mouth in the lower half of a front face; when lit, filled with glowing embers and flames.
function mouth(t, shape, lit) {
  for (let y = 7; y < 15; y++) for (let x = 3; x < 13; x++) {
    if (shape === 'arch' && y < 9 && Math.abs(x - 7.5) > 2.5 + (y - 7) * 1.5) continue;
    const depth = (y - 7) / 8;
    if (!lit) t.set(x, y, t.vary([26, 22, 20], 0.15));
    else {
      const flame = Math.sin(x * 1.7) * 1.5 + 11 - y;
      t.set(x, y, flame > 1.5 ? t.vary([255, 220, 110], 0.08) : flame > 0 ? t.vary([250, 150, 40], 0.1) : t.vary([180 - depth * 40, 60, 24], 0.12));
    }
  }
  for (let x = 2; x < 14; x++) t.set(x, 15, [70, 70, 74]); // a stone lip under the mouth
}

function wheatStage(t, stage) {
  const heights = [[3, 5], [6, 8], [10, 12], [12, 15]][stage];
  const stalk = [[96, 176, 64], [96, 176, 64], [150, 182, 72], [206, 176, 78]][stage];
  for (const x of [1, 4, 6, 9, 11, 14]) {
    const h = heights[0] + Math.floor(t.r() * (heights[1] - heights[0] + 1));
    for (let k = 0; k < h; k++) t.set(x, 15 - k, t.vary(stalk, 0.1));
    if (stage === 3) {
      // grain head: a fatter, darker-gold top
      for (let k = h - 4; k < h; k++) {
        t.set(x, 15 - k, t.vary([222, 184, 72], 0.1));
        if (k % 2 === 0) t.set(x + 1, 15 - k, t.vary([186, 146, 52], 0.1));
      }
    } else if (stage >= 1) {
      t.set(x + 1, 15 - Math.floor(h * 0.6), t.vary([80, 150, 56], 0.1)); // a leaf
    }
  }
}

export function createAtlas() {
  const c = document.createElement('canvas');
  c.width = c.height = TILE * ATLAS_COLS;
  const ctx = c.getContext('2d');
  for (const key of Object.keys(P)) {
    const i = +key;
    const t = new Tile(mulberry32(1000 + i * 7919));
    P[i](t);
    ctx.putImageData(new ImageData(t.d, TILE, TILE), (i % ATLAS_COLS) * TILE, Math.floor(i / ATLAS_COLS) * TILE);
  }
  return c;
}

// Which pixels of the atlas glow (v41), for things that give off light: red = how much, 0..255.
// `modes` maps a tile to 'all' (the whole thing shines, like a lamp's glass: its bright pixels glow) or
// 'parts' (only what stands out glows, like the green flecks in uranium ore, not the stone around them) or
// 'fire' (the flame and embers in a lit oven's front).
export function createGlowMask(atlas, modes) {
  const c = document.createElement('canvas');
  c.width = atlas.width; c.height = atlas.height;
  const src = atlas.getContext('2d').getImageData(0, 0, atlas.width, atlas.height).data;
  const out = new ImageData(atlas.width, atlas.height);
  const ss = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  for (const [tile, mode] of modes) {
    const x0 = (tile % ATLAS_COLS) * TILE, y0 = Math.floor(tile / ATLAS_COLS) * TILE;
    const px = [];
    for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) {
      const i = ((y0 + y) * atlas.width + x0 + x) * 4;
      if (src[i + 3] < 128) continue;
      const r = src[i] / 255, g = src[i + 1] / 255, b = src[i + 2] / 255;
      const hi = Math.max(r, g, b);
      const sat = hi > 0 ? (hi - Math.min(r, g, b)) / hi : 0, warm = r >= g && r >= b ? 1 : 0;
      px.push([i, hi, hi + hi - Math.min(r, g, b), sat * warm]); // (how bright, bright plus how colourful, and how strongly warm)
    }
    if (!px.length) continue;
    const med = px.map((p) => p[2]).sort((a, b) => a - b)[px.length >> 1];
    for (const [i, hi, k, fire] of px) {
      // ('fire', v45: a lit oven's or smelter's fire: its strongly coloured warm pixels, flame and embers, not the
      // bricks or stone round it, which are duller)
      const m = mode === 'all' ? ss(0.55, 0.85, hi)
        : mode === 'fire' ? ss(0.72, 0.86, fire) * ss(0.4, 0.65, hi)
        : ss(med + 0.2, med + 0.5, k) * ss(0.4, 0.7, hi);
      out.data[i] = Math.round(m * 255); out.data[i + 1] = mode === 'fire' ? out.data[i] : 0; out.data[i + 3] = 255; // (green: glow extra bright, so embers bloom too)
    }
  }
  c.getContext('2d').putImageData(out, 0, 0);
  return c;
}

// Seamless water tile; used with RepeatWrapping and a scrolling offset.
export function createWaterCanvas() {
  const t = new Tile(mulberry32(777));
  for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) {
    const wave = Math.sin((x + y * 0.5) * (Math.PI / 4)) * 0.5 + Math.sin((y - x * 0.25) * (Math.PI / 8)) * 0.5;
    const c = wave > 0.6 ? [92, 150, 230] : [48, 98, 200];
    t.set(x, y, t.vary(c, 0.1));
  }
  const c = document.createElement('canvas');
  c.width = c.height = TILE;
  c.getContext('2d').putImageData(new ImageData(t.d, TILE, TILE), 0, 0);
  return c;
}

// Break-progress crack overlays (cumulative stages).
export function createCrackCanvases(stages = 8) {
  const rand = mulberry32(42);
  const pts = [];
  for (let s = 0; s < 6; s++) {
    let x = 7.5, y = 7.5, a = rand() * Math.PI * 2;
    for (let k = 0; k < 12; k++) {
      a += (rand() - 0.5) * 1.4;
      x += Math.cos(a); y += Math.sin(a);
      pts.push([Math.round(x), Math.round(y), k]);
    }
  }
  const out = [];
  for (let s = 1; s <= stages; s++) {
    const c = document.createElement('canvas');
    c.width = c.height = TILE;
    const ctx = c.getContext('2d');
    ctx.fillStyle = 'rgba(0,0,0,0.75)';
    const reach = (s / stages) * 12;
    for (const [x, y, k] of pts) if (k < reach && x >= 0 && y >= 0 && x < 16 && y < 16) ctx.fillRect(x, y, 1, 1);
    out.push(c);
  }
  return out;
}

// ----- UI icons -----

function drawIsoBlock(ctx, atlas, def) {
  const src = (tile) => [(tile % ATLAS_COLS) * TILE, Math.floor(tile / ATLAS_COLS) * TILE];
  // Each face is drawn on its own layer so source-atop shading only darkens that face.
  const face = (tile, m, shade) => {
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const l = c.getContext('2d');
    l.imageSmoothingEnabled = false;
    l.setTransform(...m);
    const [sx, sy] = src(tile);
    l.drawImage(atlas, sx, sy, TILE, TILE, 0, 0, TILE, TILE);
    if (shade) {
      l.globalCompositeOperation = 'source-atop';
      l.fillStyle = `rgba(0,0,0,${shade})`;
      l.fillRect(0, 0, TILE, TILE);
    }
    ctx.drawImage(c, 0, 0);
  };
  const s = 1 / TILE;
  face(def.front ?? def.side, [28 * s, 14 * s, 0, 28 * s, 4, 18], 0.25);
  face(def.side, [28 * s, -14 * s, 0, 28 * s, 32, 32], 0.45);
  face(def.top, [28 * s, -14 * s, 28 * s, 14 * s, 4, 18], 0);
}

const MAT = {
  wood: [[160, 120, 70], [110, 80, 45]],
  stone: [[150, 150, 150], [95, 95, 95]],
};
// ingot colours, also used for metal tool heads
const METAL_COLORS = {
  [IRON_INGOT]: [196, 190, 184], [COPPER_INGOT]: [222, 128, 72], [TIN_INGOT]: [214, 218, 226], [LEAD_INGOT]: [104, 110, 134],
  [ZINC_INGOT]: [172, 198, 208], [ALUMINIUM_INGOT]: [226, 230, 236], [SILVER_INGOT]: [240, 242, 250], [GOLD_INGOT]: [250, 210, 70],
  [TUNGSTEN_INGOT]: [124, 120, 152], [BRONZE_INGOT]: [198, 146, 72], [ELECTRUM_INGOT]: [236, 218, 140],
  [STAINLESS_INGOT]: [210, 218, 224], [STEEL_INGOT]: [146, 154, 166], [AL_BRONZE_INGOT]: [226, 186, 100],
  [NICKEL_INGOT]: [190, 200, 176], [CUPRONICKEL_INGOT]: [214, 170, 140], [URANIUM_INGOT]: [126, 214, 72],
  [INVAR_INGOT]: [168, 176, 170], [STARSTEEL_INGOT]: [150, 170, 230],
};
const dim = (c, k) => c.map((v) => Math.round(v * k));
for (const m of TOOL_MATERIALS) MAT[m.key] = [METAL_COLORS[m.ingot], dim(METAL_COLORS[m.ingot], 0.62)];
MAT.starsteel = [[170, 190, 250], [90, 100, 170]];
const HANDLE = [[120, 85, 45], [80, 55, 28]];

function px(ctx, x, y, c) {
  ctx.fillStyle = `rgb(${c[0]},${c[1]},${c[2]})`;
  ctx.fillRect(x, y, 1, 1);
}

function drawHandle(ctx, from = 2, to = 10) {
  for (let i = from; i <= to; i++) {
    px(ctx, i, 15 - i, HANDLE[0]);
    px(ctx, i, 16 - i, HANDLE[1]);
  }
}

const ITEM_PAINTERS = {
  [STICK](ctx) { drawHandle(ctx, 3, 12); },
  [TORCH](ctx) {
    ctx.fillStyle = 'rgba(255,200,80,0.35)';
    ctx.fillRect(5, 1, 6, 6);
    for (let y = 6; y < 16; y++) { px(ctx, 7, y, [128, 92, 50]); px(ctx, 8, y, [100, 70, 38]); }
    for (const [x, y, c] of [[7, 3, [255, 236, 140]], [8, 3, [255, 236, 140]], [7, 4, [255, 200, 80]], [8, 4, [255, 200, 80]],
      [7, 5, [255, 150, 40]], [8, 5, [255, 150, 40]], [6, 4, [255, 150, 40]], [9, 4, [255, 150, 40]], [7, 2, [255, 245, 200]]]) px(ctx, x, y, c);
  },
  [COAL](ctx) {
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      const d = Math.hypot((x - 7.5) / 5, (y - 8) / 4.3);
      if (d < 1) px(ctx, x, y, (x * 7 + y * 13) % 5 === 0 ? [80, 80, 85] : d > 0.75 ? [25, 25, 25] : [45, 45, 48]);
    }
  },
};

function toolPainter(kind, mat) {
  const [m, md] = MAT[mat];
  return (ctx) => {
    drawHandle(ctx);
    if (kind === 'pick') {
      const head = [[3, 3], [4, 2], [5, 2], [6, 2], [7, 2], [8, 3], [9, 3], [10, 4], [11, 5], [12, 6], [12, 7], [13, 8], [13, 9], [13, 10], [12, 11]];
      for (const [x, y] of head) { px(ctx, x, y, m); px(ctx, x - 1, y + 1, md); }
      px(ctx, 2, 4, md); px(ctx, 11, 12, md);
    } else if (kind === 'axe') {
      for (let y = 1; y < 8; y++) for (let x = 6; x < 12; x++) {
        const onHandle = x + y === 15 || x + y === 14;
        if (!onHandle && x + y > 9 && x + y < 15 && !(x > 10 && y > 5)) px(ctx, x, y, x + y < 11 ? md : m);
      }
    } else {
      for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
        const d = Math.hypot(x - 11.5, y - 4.5);
        if (d < 3.2) px(ctx, x, y, d > 2.3 ? md : m);
      }
    }
  };
}
const rect = (ctx, x, y, w, h, c) => { ctx.fillStyle = `rgb(${c[0]},${c[1]},${c[2]})`; ctx.fillRect(x, y, w, h); };

function bucketPainter(fill) {
  return (ctx) => {
    // handle
    for (const [x, y] of [[3, 3], [4, 2], [5, 1], [6, 1], [7, 1], [8, 1], [9, 1], [10, 1], [11, 2], [12, 3]]) px(ctx, x, y, [120, 120, 125]);
    // tapered wooden body with staves and two hoops
    for (let y = 4; y <= 14; y++) {
      const inset = Math.floor((y - 4) / 5);
      for (let x = 3 + inset; x <= 12 - inset; x++) {
        const c = y === 6 || y === 12 ? [86, 60, 36] : x % 3 === 0 ? [118, 80, 44] : [158, 110, 62];
        px(ctx, x, y, c);
      }
    }
    if (fill) rect(ctx, 4, 4, 8, 2, fill);
  };
}

Object.assign(ITEM_PAINTERS, {
  [SEEDS](ctx) {
    for (const [x, y] of [[4, 6], [9, 4], [11, 9], [6, 11], [3, 13], [9, 13], [12, 3], [6, 3]]) {
      px(ctx, x, y, [200, 166, 96]); px(ctx, x + 1, y, [160, 124, 66]); px(ctx, x, y + 1, [150, 116, 60]);
    }
  },
  [WHEAT](ctx) {
    for (let x = 5; x <= 10; x++) {
      for (let y = 7; y <= 15; y++) px(ctx, x, y, x % 2 ? [204, 170, 80] : [184, 150, 64]);
      for (let y = 1; y <= 6; y++) px(ctx, x, y, (x + y) % 2 ? [226, 188, 76] : [178, 138, 48]);
    }
    rect(ctx, 4, 10, 8, 2, [122, 82, 42]); // tied band
  },
  [FLOUR](ctx) {
    rect(ctx, 6, 2, 4, 2, [214, 200, 170]); // tied neck
    rect(ctx, 5, 4, 6, 1, [150, 110, 60]); // string
    for (let y = 5; y <= 14; y++) {
      const w = y < 7 ? 8 : 10;
      for (let x = 8 - w / 2; x < 8 + w / 2; x++) px(ctx, x, y, x < 6 ? [214, 204, 182] : [238, 230, 212]);
    }
    rect(ctx, 6, 8, 4, 3, [190, 160, 110]); // label
  },
  [SUGAR](ctx) {
    for (let y = 8; y <= 14; y++) {
      const half = y - 7;
      for (let x = 8 - half; x <= 7 + half; x++) px(ctx, x, y, (x * 5 + y * 3) % 7 === 0 ? [205, 215, 230] : [248, 250, 252]);
    }
    px(ctx, 7, 7, [248, 250, 252]); px(ctx, 8, 7, [230, 236, 245]);
  },
  [BUTTER](ctx) {
    rect(ctx, 4, 6, 10, 2, [255, 238, 150]); // top
    rect(ctx, 3, 8, 10, 6, [246, 214, 92]); // front
    rect(ctx, 13, 7, 1, 6, [214, 180, 64]); // side
    rect(ctx, 3, 13, 10, 1, [214, 180, 64]);
  },
  [BREAD](ctx) {
    for (let y = 5; y <= 12; y++) {
      const inset = y === 5 || y === 12 ? 2 : y === 6 ? 1 : 0;
      for (let x = 2 + inset; x <= 13 - inset; x++) px(ctx, x, y, y < 8 ? [222, 166, 82] : y > 10 ? [160, 100, 40] : [200, 140, 60]);
    }
    for (const x of [5, 8, 11]) { px(ctx, x, 6, [150, 96, 40]); px(ctx, x + 1, 7, [150, 96, 40]); } // scored crust
  },
  [COOKIE](ctx) {
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      const d = Math.hypot(x - 7.5, y - 7.5);
      if (d < 6) px(ctx, x, y, d > 5 ? [176, 122, 62] : [214, 162, 92]);
    }
    for (const [x, y] of [[5, 5], [9, 6], [6, 9], [10, 10], [8, 3], [3, 8]]) { px(ctx, x, y, [84, 50, 28]); px(ctx, x + 1, y, [104, 64, 36]); }
  },
  [CAKE](ctx) {
    rect(ctx, 2, 8, 12, 6, [232, 200, 146]); // sponge
    rect(ctx, 2, 10, 12, 1, [200, 80, 90]); // jam layer
    rect(ctx, 2, 6, 12, 2, [252, 250, 246]); // icing
    for (const x of [3, 6, 10, 13]) px(ctx, x, 8, [252, 250, 246]); // drips
    for (const x of [4, 8, 12]) { px(ctx, x, 5, [210, 30, 40]); px(ctx, x, 4, [90, 140, 50]); } // cherries
    rect(ctx, 2, 14, 12, 1, [190, 160, 110]);
  },
  [BUCKET]: bucketPainter(null),
  [MILK_BUCKET]: bucketPainter([248, 248, 244]),
  [SLIME_BUCKET]: bucketPainter([116, 204, 84]),
  [FEATHER](ctx) {
    for (let i = 0; i <= 10; i++) {
      const x = 3 + i, y = 13 - i;
      px(ctx, x, y, [150, 150, 150]); // quill
      if (i > 2) { px(ctx, x - 1, y - 1, [244, 244, 240]); px(ctx, x + 1, y + 1, [226, 226, 222]); px(ctx, x - 1, y, [236, 236, 232]); }
    }
  },
  [MORTAR](ctx) {
    for (let i = 0; i < 7; i++) { px(ctx, 8 + Math.floor(i * 0.7), 8 - i, [196, 188, 176]); px(ctx, 9 + Math.floor(i * 0.7), 8 - i, [168, 160, 150]); } // pestle
    for (let y = 9; y <= 14; y++) {
      const inset = Math.max(0, y - 12);
      for (let x = 2 + inset; x <= 13 - inset; x++) px(ctx, x, y, y === 9 ? [110, 110, 112] : x < 5 ? [128, 128, 130] : [156, 156, 158]);
    }
  },
});

Object.assign(ITEM_PAINTERS, {
  [STRING](ctx) {
    // a coiled skein of golden wheat string
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      const d = Math.hypot(x - 7.5, (y - 8) * 1.25);
      if (d > 2.2 && d < 6.2) px(ctx, x, y, Math.floor(d * 2 + (x + y) * 0.35) % 2 ? [226, 196, 110] : [186, 152, 74]);
    }
    for (let i = 0; i < 4; i++) px(ctx, 12 + (i >> 1), 12 + i, [206, 172, 90]); // loose end
  },
  [ARROW](ctx) {
    for (let i = 3; i <= 11; i++) px(ctx, i, 15 - i, [120, 86, 48]); // shaft
    for (const [x, y] of [[12, 3], [13, 2], [12, 2], [13, 3], [11, 2], [13, 4], [14, 1]]) px(ctx, x, y, [150, 150, 154]); // stone head
    for (const [x, y] of [[1, 12], [2, 13], [1, 13], [2, 14], [3, 14], [0, 11], [1, 14]]) px(ctx, x, y, [244, 244, 240]); // feather fletching
  },
  [BOW](ctx) {
    // a curved wooden limb with a taut string
    const limb = [[4, 1], [5, 1], [6, 2], [7, 3], [8, 4], [8, 5], [9, 6], [9, 7], [9, 8], [9, 9], [8, 10], [8, 11], [7, 12], [6, 13], [5, 14], [4, 14]];
    for (const [x, y] of limb) { px(ctx, x, y, [140, 96, 50]); px(ctx, x + 1, y, [104, 70, 36]); }
    for (let y = 2; y <= 13; y++) px(ctx, 4, y, [232, 214, 160]); // string
    px(ctx, 9, 7, [70, 46, 24]); px(ctx, 9, 8, [70, 46, 24]); // grip
  },
});

Object.assign(ITEM_PAINTERS, {
  [COAL_DUST](ctx) {
    for (let y = 8; y <= 14; y++) {
      const half = Math.floor((y - 6) * 0.9);
      for (let x = 8 - half; x <= 7 + half; x++) px(ctx, x, y, (x * 7 + y * 3) % 5 === 0 ? [90, 90, 94] : [36, 36, 40]);
    }
  },
  [SLIME_FUEL]: bucketPainter([46, 74, 36]),
  [CHARCOAL](ctx) {
    // a chunky lump of charred wood, with a little grain showing
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      const d = Math.hypot((x - 7.5) / 5.5, (y - 8) / 4);
      if (d < 1) px(ctx, x, y, d > 0.8 ? [22, 18, 16] : y % 3 === 0 ? [74, 56, 44] : [44, 36, 32]);
    }
  },
  [BED](ctx) {
    rect(ctx, 1, 10, 14, 2, [120, 84, 48]); // frame
    rect(ctx, 1, 12, 1, 3, [100, 70, 40]); rect(ctx, 14, 12, 1, 3, [100, 70, 40]); // legs
    rect(ctx, 1, 6, 2, 4, [120, 84, 48]); // headboard
    rect(ctx, 3, 8, 12, 2, [236, 229, 214]); // mattress
    rect(ctx, 7, 7, 8, 3, [152, 40, 44]); // blanket
    rect(ctx, 3, 6, 4, 2, [246, 242, 232]); // pillow
  },
  [FURN_TABLE](ctx) {
    rect(ctx, 1, 5, 14, 2, [176, 136, 86]); rect(ctx, 1, 7, 14, 1, [130, 96, 56]);
    rect(ctx, 2, 8, 2, 7, [150, 112, 66]); rect(ctx, 12, 8, 2, 7, [150, 112, 66]);
  },
  [CHAIR](ctx) {
    rect(ctx, 4, 1, 2, 14, [140, 102, 60]); // back post and leg
    rect(ctx, 6, 3, 1, 5, [176, 136, 86]); // back rest
    rect(ctx, 4, 8, 9, 2, [176, 136, 86]); // seat
    rect(ctx, 11, 10, 2, 5, [140, 102, 60]); // front leg
  },
  [LAMP](ctx) {
    rect(ctx, 7, 1, 2, 2, [120, 120, 124]); // handle
    rect(ctx, 5, 3, 6, 1, [110, 110, 114]); // cap
    rect(ctx, 5, 4, 6, 8, [190, 220, 232]); // glass
    rect(ctx, 6, 5, 4, 6, [240, 246, 250]);
    rect(ctx, 7, 7, 2, 4, [255, 210, 90]); // flame
    rect(ctx, 4, 12, 8, 2, [120, 120, 124]); // base
  },
  [CARPET](ctx) {
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      const d = Math.abs(x - 7.5) + Math.abs(y - 9.5) * 1.6;
      if (d < 8) px(ctx, x, y, d > 6.5 ? [190, 176, 150] : (x + y) % 3 ? [236, 229, 214] : [214, 204, 184]);
    }
  },
  [CURTAIN](ctx) {
    rect(ctx, 1, 1, 14, 1, [120, 84, 48]); // rod
    for (let x = 2; x <= 13; x++) for (let y = 2; y <= 14; y++) px(ctx, x, y, x % 3 === 0 ? [200, 188, 166] : [236, 226, 206]);
  },
  [DOOR](ctx) {
    rect(ctx, 4, 0, 8, 16, [118, 82, 46]);
    rect(ctx, 5, 1, 6, 14, [166, 122, 74]);
    rect(ctx, 6, 2, 4, 4, [170, 210, 230]); rect(ctx, 7, 2, 1, 4, [118, 82, 46]); // window
    px(ctx, 10, 9, [60, 60, 64]); // handle
  },
});

// Small HUD icons (9x9 pixel art): heart, poisoned heart, air bubble.
const HUD_ART = {
  heart: ['.XX...XX.', 'XHHX.XHHX', 'XHRRXRRRX', 'XRRRRRRRX', '.XRRRRRX.', '..XRRRX..', '...XRX...', '....X....', '.........'],
  bubble: ['..XXXXX..', '.XHH...X.', 'XH.....BX', 'XH.....BX', 'X......BX', 'X.....BBX', '.X..BBBX.', '..XXXXX..', '.........'],
};
export function createHudIcons() {
  const make = (art, colors) => {
    const c = document.createElement('canvas');
    c.width = c.height = 36;
    const ctx = c.getContext('2d');
    art.forEach((row, y) => [...row].forEach((ch, x) => {
      if (!colors[ch]) return;
      ctx.fillStyle = colors[ch];
      ctx.fillRect(x * 4, y * 4, 4, 4);
    }));
    return c.toDataURL();
  };
  return {
    heart: make(HUD_ART.heart, { X: '#3a0d0d', R: '#e0302b', H: '#ff9a92' }),
    poison: make(HUD_ART.heart, { X: '#14300c', R: '#6cbf2e', H: '#c6f29a' }),
    bubble: make(HUD_ART.bubble, { X: '#2a5aa8', H: '#ffffff', B: '#8fc4ff' }),
  };
}

// a fish facing left: body, tail fin, eye. colors = [back, belly, fin]
function fishPainter([back, belly, fin], baked = false) {
  return (ctx) => {
    for (let y = 0; y < 16; y++) for (let x = 1; x < 12; x++) {
      const d = Math.hypot((x - 6.5) / 5.5, (y - 8) / 3.2);
      if (d < 1) px(ctx, x, y, y < 8 ? back : belly);
    }
    for (let y = 4; y <= 12; y++) {
      const w = Math.abs(y - 8);
      for (let x = 12; x <= 12 + Math.min(3, w); x++) px(ctx, x, y, fin);
    }
    px(ctx, 11, 8, fin);
    if (baked) for (const x of [4, 7, 10]) { px(ctx, x, 6, [92, 52, 20]); px(ctx, x - 1, 7, [92, 52, 20]); } // grill marks
    else { px(ctx, 3, 7, [20, 20, 24]); for (let x = 5; x <= 9; x++) px(ctx, x, 5, fin); } // eye, dorsal fin
  };
}

Object.assign(ITEM_PAINTERS, {
  [FISHING_ROD](ctx) {
    for (let i = 0; i <= 13; i++) px(ctx, 1 + i, 14 - i, i < 4 ? [92, 60, 30] : [140, 100, 56]); // rod, darker handle
    for (let y = 2; y <= 11; y++) px(ctx, 14, y, [230, 222, 190]); // line
    px(ctx, 14, 12, [216, 56, 46]); px(ctx, 14, 13, [244, 241, 234]); // bobber
  },
  [RAW_FISH]: fishPainter([[86, 128, 150], [196, 210, 214], [70, 104, 124]]),
  [BAKED_FISH]: fishPainter([[176, 110, 50], [214, 160, 92], [140, 84, 36]], true),
});

ITEM_PAINTERS[WOOD_PICK] = toolPainter('pick', 'wood');
ITEM_PAINTERS[STONE_PICK] = toolPainter('pick', 'stone');
ITEM_PAINTERS[WOOD_AXE] = toolPainter('axe', 'wood');
ITEM_PAINTERS[STONE_AXE] = toolPainter('axe', 'stone');
ITEM_PAINTERS[WOOD_SHOVEL] = toolPainter('shovel', 'wood');
ITEM_PAINTERS[STONE_SHOVEL] = toolPainter('shovel', 'stone');

// A bar of metal seen from slightly above: bright top, mid front, dark end.
function ingotPainter(c) {
  return (ctx) => {
    for (let y = 6; y <= 8; y++) for (let x = 4 - (y - 6); x <= 13 - (y - 6); x++) px(ctx, x, y, dim(c, 1.12).map((v) => Math.min(255, v)));
    for (let y = 9; y <= 12; y++) for (let x = 1; x <= 11; x++) px(ctx, x, y, c);
    for (let y = 6; y <= 12; y++) for (let x = 12; x <= 14; x++) if (x - 12 <= y - 6 && y - 9 <= 14 - x + 1) px(ctx, x, y, dim(c, 0.7));
    px(ctx, 3, 10, dim(c, 1.25).map((v) => Math.min(255, v))); px(ctx, 4, 10, dim(c, 1.25).map((v) => Math.min(255, v)));
  };
}
for (const [id, c] of Object.entries(METAL_COLORS)) ITEM_PAINTERS[id] = ingotPainter(c);
ITEM_PAINTERS[SULPHUR] = (ctx) => {
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const d = Math.hypot((x - 7.5) / 5, (y - 9) / 4.5);
    if (d < 1) px(ctx, x, y, (x * 5 + y * 3) % 7 === 0 ? [255, 246, 150] : d > 0.75 ? [190, 168, 30] : [236, 214, 56]);
  }
};
TOOL_MATERIALS.forEach((m, i) => { for (const kind of TOOL_KINDS) ITEM_PAINTERS[metalTool(i, kind)] = toolPainter(kind, m.key); });

// A small heap of powder in the given colour.
function dustPainter(c) {
  return (ctx) => {
    for (let y = 6; y < 15; y++) {
      const half = Math.round((y - 5) * 0.75 + 1);
      for (let x = 8 - half; x < 8 + half; x++) {
        const k = (x * 7 + y * 5) % 6 === 0 ? 1.18 : (x * 3 + y) % 5 === 0 ? 0.8 : x < 8 ? 1.05 : 0.92;
        px(ctx, x, y, shade(c, k));
      }
    }
  };
}
// A rounded lump (clay balls).
function lumpPainter(c) {
  return (ctx) => {
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      const d = Math.hypot((x - 7.5) / 5, (y - 8.5) / 4.6);
      if (d < 1) px(ctx, x, y, shade(c, d > 0.78 ? 0.75 : x + y < 13 ? 1.12 : 1));
    }
  };
}
// One brick seen from the side and top.
function brickPainter(c) {
  return (ctx) => {
    rect(ctx, 4, 5, 10, 2, shade(c, 1.15)); // top
    rect(ctx, 2, 7, 10, 5, c); // front
    for (let y = 5; y < 12; y++) for (let x = 12; x < 14; x++) if (y - 5 >= x - 12 && y < 12 - (x - 12) + 2) px(ctx, x, y, shade(c, 0.72));
    rect(ctx, 3, 5, 1, 1, shade(c, 1.15));
  };
}
const ORE_DUST_COLORS = {};
for (const o of ORES) if (o.ingot) ORE_DUST_COLORS[oreDust(o.id)] = METAL_COLORS[o.ingot];
Object.assign(ITEM_PAINTERS, {
  [FLINT](ctx) {
    const shape = [[6, 2, 4], [5, 3, 6], [4, 4, 8], [3, 5, 9], [3, 6, 10], [3, 7, 10], [4, 8, 9], [4, 9, 9], [5, 10, 8], [6, 11, 6], [7, 12, 4]];
    for (const [x0, y, w] of shape) for (let x = x0; x < x0 + w; x++) px(ctx, x, y, x - x0 < 2 ? [118, 118, 124] : (x + y) % 4 === 0 ? [74, 74, 80] : [52, 52, 58]);
  },
  [CLAY_BALL]: lumpPainter([160, 166, 182]),
  [FIRE_CLAY]: lumpPainter([214, 198, 160]),
  [BRICK]: brickPainter([168, 78, 56]),
  [FIRE_BRICK]: brickPainter([220, 200, 154]),
  [FLINT_DUST]: dustPainter([86, 86, 94]),
  [CLAY_DUST]: dustPainter([176, 140, 120]),
  [WATER_BUCKET]: bucketPainter([60, 112, 214]),
});
for (const [id, c] of Object.entries(ORE_DUST_COLORS)) ITEM_PAINTERS[id] = dustPainter(shade(c, 0.85));

// Power parts, as icons: a water wheel, and a shaft, small gear and large gear in each material.
const PART_COLORS = [[[176, 132, 80], [116, 84, 46]], [[150, 150, 152], [96, 96, 100]], [[214, 222, 228], [140, 148, 156]]];
function gearIcon(ctx, [c, d], r, teeth, hub) {
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const dx = x - 7.5, dy = y - 7.5, dist = Math.hypot(dx, dy);
    const a = Math.atan2(dy, dx);
    const tooth = Math.cos(a * teeth) > 0.2;
    if (dist < hub) px(ctx, x, y, [60, 52, 44]);
    else if (dist < r - 1.6) px(ctx, x, y, dist > r - 2.6 ? d : c);
    else if (dist < r && tooth) px(ctx, x, y, d);
  }
}
ITEM_PAINTERS[WATER_WHEEL] = (ctx) => {
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const dx = x - 7.5, dy = y - 7.5, dist = Math.hypot(dx, dy), a = Math.atan2(dy, dx);
    if (dist > 6.2 && dist < 7.6) px(ctx, x, y, [96, 66, 36]); // rim
    else if (dist < 1.6) px(ctx, x, y, [80, 56, 30]); // hub
    else if (dist < 6.2 && Math.abs(Math.sin(a * 4)) < 0.22) px(ctx, x, y, [176, 132, 80]); // paddles
  }
};
KINETIC_MATS.forEach((m, i) => {
  const [c, d] = PART_COLORS[i];
  ITEM_PAINTERS[kineticId('shaft', i)] = (ctx) => {
    for (let k = 0; k < 13; k++) { px(ctx, 2 + k, 13 - k, c); px(ctx, 2 + k, 14 - k, d); px(ctx, 3 + k, 14 - k, d); }
  };
  ITEM_PAINTERS[kineticId('gear', i)] = (ctx) => gearIcon(ctx, PART_COLORS[i], 6, 8, 1.6);
  ITEM_PAINTERS[kineticId('large', i)] = (ctx) => gearIcon(ctx, PART_COLORS[i], 7.9, 14, 1.8);
});

// ----- stage A: ladders, scaffolding, signs, swords, armour -----
const PLANK = [[176, 132, 80], [128, 92, 52]];
Object.assign(ITEM_PAINTERS, {
  [LADDER](ctx) {
    rect(ctx, 3, 0, 2, 16, PLANK[1]); rect(ctx, 11, 0, 2, 16, PLANK[1]);
    for (const y of [2, 6, 10, 14]) rect(ctx, 5, y, 6, 1, PLANK[0]);
  },
  [SCAFFOLD](ctx) {
    for (const x of [1, 13]) rect(ctx, x, 1, 2, 15, PLANK[1]);
    rect(ctx, 1, 1, 14, 2, PLANK[0]); rect(ctx, 1, 8, 14, 1, PLANK[0]);
    for (let i = 0; i < 10; i++) px(ctx, 3 + i, 3 + Math.floor(i * 0.5), PLANK[0]); // a brace
  },
  [SIGN](ctx) {
    rect(ctx, 7, 9, 2, 7, [110, 80, 46]); // post
    rect(ctx, 1, 2, 14, 8, PLANK[0]); rect(ctx, 1, 9, 14, 1, PLANK[1]);
    for (const [y, w] of [[4, 10], [6, 8]]) rect(ctx, 3, y, w, 1, [70, 46, 24]); // writing
  },
});
// sword: blade along the diagonal, a crossguard and a short grip
function swordPainter(mat) {
  const [m, md] = MAT[mat];
  return (ctx) => {
    for (let i = 0; i < 9; i++) { px(ctx, 6 + i, 9 - i, m); px(ctx, 6 + i, 10 - i, md); px(ctx, 5 + i, 9 - i, m); }
    px(ctx, 15, 0, m);
    for (const [x, y] of [[3, 9], [4, 10], [5, 11], [6, 12], [7, 13]]) px(ctx, x, y, [90, 70, 40]); // crossguard
    for (let i = 0; i < 4; i++) { px(ctx, 1 + i, 14 - i, HANDLE[0]); px(ctx, 2 + i, 14 - i, HANDLE[1]); }
  };
}
ITEM_PAINTERS[WOOD_SWORD] = swordPainter('wood');
for (const kind of ['pick', 'axe', 'shovel']) ITEM_PAINTERS[starsteelTool(kind)] = toolPainter(kind, 'starsteel');
ITEM_PAINTERS[starsteelTool('sword')] = swordPainter('starsteel');
ITEM_PAINTERS[METEORIC_IRON] = (ctx) => { // a rough lump of space metal
  for (let y = 4; y < 13; y++) for (let x = 3; x < 13; x++) if ((x - 8) ** 2 + (y - 8.5) ** 2 * 1.3 < 22) px(ctx, x, y, (x * 7 + y * 3) % 5 ? [96, 100, 124] : [170, 180, 220]);
};
ITEM_PAINTERS[STONE_SWORD] = swordPainter('stone');
TOOL_MATERIALS.forEach((m, i) => { ITEM_PAINTERS[metalSword(i)] = swordPainter(m.key); });
const ARMOUR_COLORS = {
  leather: [148, 96, 56], bronze: METAL_COLORS[BRONZE_INGOT], iron: METAL_COLORS[IRON_INGOT],
  steel: METAL_COLORS[STEEL_INGOT], stainless: METAL_COLORS[STAINLESS_INGOT],
};
const ARMOUR_ART = [
  ['................', '................', '....XXXXXXXX....', '...XHHHHHHHHX...', '..XHHHHHHHHHHX..', '..XHHHHHHHHHHX..', '..XHHXXXXXXHHX..',
    '..XHX......XHX..', '..XHX......XHX..', '..XXX......XXX..', '................', '................', '................', '................', '................', '................'],
  ['................', '..XXX......XXX..', '.XHHHX....XHHHX.', 'XHHHHHXXXXHHHHHX', 'XHHHHHHHHHHHHHHX', 'XXXHHHHHHHHHHXXX', '..XHHHHHHHHHHX..',
    '..XHHHHHHHHHHX..', '..XHHHHHHHHHHX..', '..XHHHHHHHHHHX..', '..XHHHHHHHHHHX..', '..XHHHHHHHHHHX..', '..XXXXXXXXXXXX..', '................', '................', '................'],
  ['................', '................', '...XXXXXXXXXX...', '...XHHHHHHHHX...', '...XHHHHHHHHX...', '...XHHHXXHHHX...', '...XHHHXXHHHX...',
    '...XHHHXXHHHX...', '...XHHHXXHHHX...', '...XHHHXXHHHX...', '...XHHHXXHHHX...', '...XHHHXXHHHX...', '...XXXXXXXXXX...', '................', '................', '................'],
  ['................', '................', '................', '................', '................', '..XXXX....XXXX..', '..XHHX....XHHX..',
    '..XHHX....XHHX..', '..XHHX....XHHX..', '..XHHX....XHHX..', 'XXXHHX....XHHXXX', 'XHHHHX....XHHHHX', 'XHHHHX....XHHHHX', 'XXXXXX....XXXXXX', '................', '................'],
];
function armourPainter(c, piece) {
  return (ctx) => ARMOUR_ART[piece].forEach((row, y) => [...row].forEach((ch, x) => {
    if (ch === 'X') px(ctx, x, y, dim(c, 0.6));
    else if (ch === 'H') px(ctx, x, y, (x + y) % 5 === 0 ? dim(c, 1.15).map((v) => Math.min(255, v)) : c);
  }));
}
ARMOUR_MATS.forEach((m, mi) => ARMOUR_PIECES.forEach((p, pi) => { ITEM_PAINTERS[armourId(mi, pi)] = armourPainter(ARMOUR_COLORS[m.key], pi); }));
// a flat metal plate seen at an angle, with rivets
function platePainter(c) {
  return (ctx) => {
    for (let y = 3; y < 13; y++) for (let x = 2; x < 14; x++) {
      if (x + (12 - y) * 0.3 > 14 || x < 2 + (12 - y) * 0.3) continue;
      px(ctx, x, y, y === 3 ? dim(c, 1.15).map((v) => Math.min(255, v)) : y > 11 ? dim(c, 0.65) : c);
    }
    for (const [x, y] of [[4, 5], [11, 5], [4, 10], [11, 10]]) px(ctx, x, y, dim(c, 0.55));
  };
}
PLATE_METALS.forEach((m, i) => { ITEM_PAINTERS[PLATES + i] = platePainter(METAL_COLORS[m.ingot]); });
ITEM_PAINTERS[HIDE] = (ctx) => {
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const d = Math.hypot((x - 7.5) / 6.5, (y - 8) / 5.8) + Math.sin(x * 1.3) * 0.06 + Math.cos(y * 1.7) * 0.06;
    if (d < 1) px(ctx, x, y, (x * 3 + y * 5) % 7 === 0 ? [58, 38, 22] : d > 0.82 ? [62, 42, 26] : [86, 58, 36]);
  }
};
ITEM_PAINTERS[LEATHER] = (ctx) => {
  for (let y = 2; y < 14; y++) for (let x = 2; x < 14; x++) {
    if ((x === 2 || x === 13) && (y === 2 || y === 13)) continue;
    px(ctx, x, y, y === 2 || x === 2 ? [176, 118, 70] : (x + y) % 6 === 0 ? [128, 80, 44] : [150, 98, 56]);
  }
  for (let x = 4; x < 12; x += 2) px(ctx, x, 12, [100, 64, 34]); // stitching
};

// ----- stage B -----
Object.assign(ITEM_PAINTERS, {
  [SALTPETRE]: dustPainter([236, 234, 226]),
  [GUNPOWDER]: dustPainter([70, 70, 74]),
  [LEAD_SINKER](ctx) {
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      const d = Math.hypot((x - 7.5) / 3.6, (y - 9) / 4.5);
      if (d < 1) px(ctx, x, y, d > 0.75 ? [70, 76, 98] : x < 7 ? [130, 138, 160] : [104, 110, 134]);
    }
    rect(ctx, 7, 2, 2, 3, [104, 110, 134]); px(ctx, 7, 1, [70, 76, 98]); px(ctx, 8, 1, [70, 76, 98]); // eye for the line
  },
  [WEIGHTED_ROD](ctx) {
    ITEM_PAINTERS[FISHING_ROD](ctx);
    rect(ctx, 13, 12, 3, 3, [104, 110, 134]); px(ctx, 13, 12, [140, 146, 170]);
  },
  [LEAD_BUCKET]: (ctx) => { bucketPainter(null)(ctx); for (let y = 4; y <= 14; y++) for (let x = 3; x <= 12; x++) { const d = ctx.getImageData(x, y, 1, 1).data; if (d[3]) px(ctx, x, y, d[0] > 140 ? [130, 136, 158] : [96, 102, 124]); } },
  [LAVA_BUCKET]: (ctx) => { ITEM_PAINTERS[LEAD_BUCKET](ctx); rect(ctx, 4, 4, 8, 2, [252, 140, 30]); px(ctx, 6, 4, [255, 230, 120]); },
  [GOLD_CLOCK](ctx) {
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      const d = Math.hypot(x - 7.5, y - 8.5);
      if (d < 7) px(ctx, x, y, d > 5.6 ? [200, 150, 30] : d > 4.8 ? [250, 210, 70] : [248, 242, 222]);
    }
    rect(ctx, 7, 0, 2, 2, [200, 150, 30]); // crown
    for (let i = 0; i < 4; i++) px(ctx, 7, 8 - i, [40, 36, 30]); // hands at ten to twelve
    for (let i = 0; i < 3; i++) px(ctx, 8 + i, 8, [40, 36, 30]);
  },
  [COMPASS](ctx) {
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      const d = Math.hypot(x - 7.5, y - 7.5);
      if (d < 7) px(ctx, x, y, d > 5.6 ? [150, 146, 140] : [236, 232, 220]);
    }
    for (let i = 0; i < 5; i++) { px(ctx, 7 + (i > 2 ? 0 : 0), 3 + i, [200, 40, 34]); px(ctx, 8, 7 + i, [60, 60, 70]); }
    px(ctx, 8, 3, [200, 40, 34]); px(ctx, 7, 12, [60, 60, 70]);
  },
  [SILVER_ARROW](ctx) {
    ITEM_PAINTERS[ARROW](ctx);
    for (const [x, y] of [[12, 3], [13, 2], [12, 2], [13, 3], [11, 2], [13, 4], [14, 1]]) px(ctx, x, y, [236, 240, 250]);
    px(ctx, 14, 1, [255, 255, 255]);
  },
  [MIRROR_LAMP](ctx) {
    ITEM_PAINTERS[LAMP](ctx);
    rect(ctx, 5, 4, 1, 8, [236, 218, 140]); rect(ctx, 10, 4, 1, 8, [236, 218, 140]);
    rect(ctx, 6, 4, 4, 1, [250, 236, 170]);
  },
});

// ----- machines -----
Object.assign(ITEM_PAINTERS, {
  [PIPE](ctx) { rect(ctx, 1, 6, 14, 4, [110, 116, 140]); rect(ctx, 1, 6, 14, 1, [150, 156, 180]); rect(ctx, 1, 9, 14, 1, [80, 86, 108]); rect(ctx, 0, 5, 2, 6, [90, 96, 118]); rect(ctx, 14, 5, 2, 6, [90, 96, 118]); },
  [SPOUT](ctx) { rect(ctx, 6, 0, 4, 8, [110, 116, 140]); rect(ctx, 4, 8, 8, 3, [90, 96, 118]); rect(ctx, 6, 11, 4, 1, [80, 86, 108]); for (const y of [13, 15]) px(ctx, 7 + (y % 3 ? 0 : 1), y, [80, 140, 230]); },
  [BELT](ctx) {
    rect(ctx, 0, 6, 16, 6, [44, 42, 40]);
    for (const x of [3, 8, 13]) { px(ctx, x, 8, [140, 140, 136]); px(ctx, x + 1, 9, [140, 140, 136]); px(ctx, x, 10, [140, 140, 136]); }
    rect(ctx, 0, 12, 16, 2, [120, 86, 50]);
  },
  [HOPPER](ctx) {
    for (let y = 2; y < 8; y++) rect(ctx, 1 + (y - 2) * 0.5, y, 14 - (y - 2), 1, y === 2 ? [150, 154, 162] : IRON_C);
    rect(ctx, 5, 8, 6, 3, IRON_C); rect(ctx, 7, 11, 2, 4, [90, 92, 100]);
  },
  [WINDMILL](ctx) {
    for (let i = 0; i < 4; i++) {
      const a = (i * Math.PI) / 2 + Math.PI / 4;
      for (let r = 1; r < 8; r++) px(ctx, Math.round(7.5 + Math.cos(a) * r), Math.round(7.5 + Math.sin(a) * r), [120, 86, 50]);
      for (let r = 3; r < 8; r++) for (let w = 1; w < 3; w++) px(ctx, Math.round(7.5 + Math.cos(a) * r - Math.sin(a) * w), Math.round(7.5 + Math.sin(a) * r + Math.cos(a) * w), [236, 229, 214]);
    }
    rect(ctx, 6, 6, 3, 3, [80, 56, 30]);
  },
  [FILAMENT](ctx) { for (let x = 1; x < 15; x++) { px(ctx, x, 7 + Math.round(Math.sin(x * 1.6) * 2), [150, 146, 176]); px(ctx, x, 8 + Math.round(Math.sin(x * 1.6) * 2), [100, 96, 126]); } },
  [DRILL_BIT](ctx) {
    for (let y = 1; y < 15; y++) { const w = Math.max(1, Math.round((15 - y) * 0.3)); for (let x = 8 - w; x < 8 + w; x++) px(ctx, x, y, (x + y) % 3 ? [124, 120, 152] : [84, 80, 110]); }
    rect(ctx, 6, 13, 4, 3, [146, 154, 166]);
  },
});

// ----- rails, minecarts and maps -----
function railIcon(c) {
  return (ctx) => {
    for (const y of [2, 6, 10, 14]) rect(ctx, 1, y, 14, 2, [128, 92, 52]);
    rect(ctx, 3, 0, 2, 16, c); rect(ctx, 11, 0, 2, 16, c);
  };
}
Object.assign(ITEM_PAINTERS, {
  [RAIL]: railIcon([150, 154, 162]),
  [POWERED_RAIL]: railIcon([240, 196, 60]),
  [CACTUS](ctx) {
    rect(ctx, 5, 2, 6, 14, [86, 150, 64]); rect(ctx, 5, 2, 2, 14, [64, 120, 50]);
    rect(ctx, 1, 6, 4, 3, [86, 150, 64]); rect(ctx, 1, 3, 2, 4, [86, 150, 64]); // arm
    rect(ctx, 11, 8, 3, 3, [86, 150, 64]); rect(ctx, 13, 5, 2, 4, [86, 150, 64]);
    for (const [x, y] of [[8, 4], [9, 8], [8, 12], [2, 4], [14, 6]]) px(ctx, x, y, [236, 230, 190]);
  },
  [MINECART](ctx) {
    rect(ctx, 1, 4, 14, 8, [110, 114, 122]); rect(ctx, 2, 5, 12, 6, [70, 72, 80]); rect(ctx, 1, 4, 14, 1, [150, 154, 162]);
    for (const x of [3, 10]) { rect(ctx, x, 12, 3, 3, [40, 40, 44]); px(ctx, x + 1, 13, [120, 120, 126]); }
  },
  [PAPER](ctx) { rect(ctx, 3, 1, 10, 14, [246, 242, 228]); rect(ctx, 12, 1, 1, 14, [214, 208, 190]); for (const y of [4, 7, 10]) rect(ctx, 5, y, 6, 1, [200, 196, 184]); },
  [MAP](ctx) {
    rect(ctx, 1, 2, 14, 12, [226, 214, 172]);
    for (let y = 3; y < 13; y++) for (let x = 2; x < 14; x++) {
      const land = Math.sin(x * 0.7) + Math.cos(y * 0.6) > 0.2;
      px(ctx, x, y, land ? ((x + y) % 5 ? [120, 168, 84] : [90, 130, 60]) : [90, 140, 210]);
    }
    px(ctx, 8, 7, [200, 40, 34]); px(ctx, 7, 8, [200, 40, 34]); px(ctx, 9, 8, [200, 40, 34]);
  },
});

COLORS.forEach((c, i) => { ITEM_PAINTERS[DYE + i] = dustPainter(c.rgb); });
function bottlePainter(fill) {
  return (ctx) => {
    rect(ctx, 7, 1, 2, 3, [180, 140, 90]); // cork
    rect(ctx, 6, 4, 4, 2, [190, 220, 236]);
    for (let y = 6; y < 15; y++) for (let x = 3; x < 13; x++) {
      const d = Math.hypot((x - 7.5) / 4.6, (y - 10.5) / 4.4);
      if (d >= 1) continue;
      const edge = d > 0.82;
      px(ctx, x, y, edge ? [170, 205, 225] : fill && y >= 8 ? (x < 6 ? shade(fill, 1.2) : fill) : [214, 236, 246]);
    }
    px(ctx, 5, 9, [255, 255, 255]);
  };
}
ITEM_PAINTERS[GLASS_BOTTLE] = bottlePainter(null);
ITEM_PAINTERS[BERRIES] = (ctx) => {
  for (const [x, y] of [[4, 6], [8, 4], [9, 9], [5, 10], [11, 6]]) {
    rect(ctx, x, y, 3, 3, [190, 28, 50]); px(ctx, x, y, [246, 130, 140]); px(ctx, x + 2, y + 2, [120, 14, 30]);
  }
  rect(ctx, 8, 1, 1, 3, [70, 120, 40]); rect(ctx, 9, 2, 3, 1, [86, 150, 56]);
};
ITEM_PAINTERS[NIGHT_TEA] = bottlePainter([60, 80, 190]);
ITEM_PAINTERS[HASTE_TEA] = bottlePainter([226, 176, 40]);
ITEM_PAINTERS[FIRE_TEA] = bottlePainter([206, 64, 40]);
ITEM_PAINTERS[HEAL_TEA] = bottlePainter([150, 96, 196]);
function shieldPainter(face, rim) {
  return (ctx) => {
    for (let y = 1; y < 15; y++) for (let x = 2; x < 14; x++) {
      const w = y < 9 ? 6 : 6 - (y - 9) * 0.9;
      if (Math.abs(x - 7.5) > w) continue;
      const edge = Math.abs(x - 7.5) > w - 1.2 || y === 1;
      px(ctx, x, y, edge ? rim : (x + y) % 5 === 0 ? shade(face, 0.85) : face);
    }
    rect(ctx, 7, 4, 2, 7, rim); rect(ctx, 5, 6, 6, 2, rim);
  };
}
ITEM_PAINTERS[WOOD_SHIELD] = shieldPainter([160, 118, 70], [110, 112, 120]);
ITEM_PAINTERS[IRON_SHIELD] = shieldPainter([176, 180, 190], [100, 104, 112]);
ITEM_PAINTERS[KING_CROWN] = (ctx) => {
  rect(ctx, 2, 8, 12, 5, [236, 190, 50]); rect(ctx, 2, 12, 12, 1, [190, 140, 30]);
  for (const x of [2, 7, 12]) { rect(ctx, x, 4, 2, 4, [246, 206, 64]); px(ctx, x, 3, [255, 236, 120]); }
  for (const x of [4, 10]) rect(ctx, x, 6, 2, 2, [246, 206, 64]);
  px(ctx, 7, 10, [210, 40, 40]); px(ctx, 8, 10, [210, 40, 40]); px(ctx, 4, 10, [70, 140, 220]); px(ctx, 11, 10, [70, 140, 220]);
};
ITEM_PAINTERS[CRYSTAL_SHARD] = (ctx) => {
  for (let y = 2; y < 15; y++) for (let x = 4; x < 12; x++) {
    const w = y < 6 ? (y - 2) * 0.9 : (15 - y) * 0.45 + 0.6;
    if (Math.abs(x - 7.5) > w) continue;
    px(ctx, x, y, x < 7.5 ? [216, 180, 252] : y > 10 ? [120, 70, 182] : [160, 106, 226]);
  }
};
ITEM_PAINTERS[HONEYCOMB] = (ctx) => {
  for (let y = 3; y < 14; y++) for (let x = 2; x < 14; x++) {
    const cell = ((x + (Math.floor(y / 3) % 2) * 2) % 4 === 0) || y % 3 === 0;
    px(ctx, x, y, cell ? [190, 130, 30] : [246, 196, 64]);
  }
};
ITEM_PAINTERS[HONEY_BOTTLE] = bottlePainter([236, 166, 30]);
ITEM_PAINTERS[SALMON] = fishPainter([[196, 92, 80], [236, 150, 120], [150, 60, 56]]);
ITEM_PAINTERS[BAKED_SALMON] = fishPainter([[200, 112, 60], [230, 160, 110], [150, 80, 40]], true);
ITEM_PAINTERS[ICEFISH] = fishPainter([[170, 206, 226], [226, 240, 248], [110, 160, 196]]);
ITEM_PAINTERS[BAKED_ICEFISH] = fishPainter([[190, 150, 100], [226, 200, 160], [150, 110, 70]], true);
ITEM_PAINTERS[PUFFERFISH] = (ctx) => {
  for (let y = 3; y < 14; y++) for (let x = 3; x < 13; x++) {
    const d = Math.hypot(x - 8, y - 8.5);
    if (d < 5) px(ctx, x, y, y > 9 ? [240, 232, 180] : [222, 196, 70]);
  }
  for (const [x, y] of [[2, 8], [8, 2], [13, 8], [8, 14], [4, 4], [12, 4], [4, 13], [12, 13]]) px(ctx, x, y, [150, 120, 40]);
  px(ctx, 6, 7, [20, 20, 20]); px(ctx, 10, 7, [20, 20, 20]);
};
ITEM_PAINTERS[OLD_BOOT] = (ctx) => {
  rect(ctx, 4, 2, 6, 9, [100, 70, 44]); rect(ctx, 4, 10, 10, 4, [100, 70, 44]); rect(ctx, 4, 14, 11, 1, [50, 36, 24]);
  rect(ctx, 5, 3, 1, 6, [76, 52, 30]); px(ctx, 9, 6, [140, 104, 70]); px(ctx, 12, 11, [70, 120, 60]); px(ctx, 13, 11, [70, 120, 60]);
};
ITEM_PAINTERS[SUN_SCARAB] = (ctx) => {
  for (let y = 3; y < 14; y++) for (let x = 3; x < 13; x++) {
    const d = Math.hypot((x - 7.5) / 4.5, (y - 8.5) / 5);
    if (d < 1) px(ctx, x, y, x === 7 || x === 8 ? [150, 100, 20] : d > 0.75 ? [200, 140, 30] : [250, 200, 60]);
  }
  rect(ctx, 6, 1, 4, 2, [220, 160, 40]);
  for (const [x, y] of [[2, 6], [13, 6], [2, 10], [13, 10], [2, 13], [13, 13]]) px(ctx, x, y, [120, 80, 20]);
};
ITEM_PAINTERS[FROST_HEART] = (ctx) => {
  for (let y = 2; y < 15; y++) for (let x = 1; x < 15; x++) {
    const a = Math.hypot(x - 5, y - 5.5) < 3.6, b = Math.hypot(x - 10, y - 5.5) < 3.6, c = y >= 5 && Math.abs(x - 7.5) < (14 - y) * 0.75;
    if (a || b || c) px(ctx, x, y, (x + y) % 4 === 0 ? [240, 252, 255] : x < 7 ? [176, 228, 250] : [110, 180, 226]);
  }
};
ITEM_PAINTERS[EMBER_CORE] = (ctx) => {
  for (let y = 2; y < 14; y++) for (let x = 2; x < 14; x++) {
    const d = Math.hypot(x - 7.5, y - 7.5);
    if (d < 5.6) px(ctx, x, y, d < 2.2 ? [255, 246, 180] : d < 3.8 ? [255, 170, 40] : (x * 3 + y) % 5 ? [180, 50, 20] : [90, 20, 10]);
  }
};
function crownIcon(band, gem, spikes = true) {
  return (ctx) => {
    rect(ctx, 2, 8, 12, 5, band); rect(ctx, 2, 12, 12, 1, shade(band, 0.7));
    if (spikes) for (const x of [2, 7, 12]) { rect(ctx, x, 4, 2, 4, band); px(ctx, x, 3, shade(band, 1.2)); }
    rect(ctx, 7, 9, 2, 2, gem); px(ctx, 4, 10, gem); px(ctx, 11, 10, gem);
  };
}
ITEM_PAINTERS[SUN_MASK] = (ctx) => {
  for (let y = 2; y < 15; y++) for (let x = 2; x < 14; x++) {
    const w = y < 10 ? 6 : 6 - (y - 10) * 0.8;
    if (Math.abs(x - 7.5) <= w) px(ctx, x, y, y % 3 === 0 ? [40, 70, 160] : [236, 190, 50]);
  }
  rect(ctx, 4, 6, 3, 2, [30, 20, 10]); rect(ctx, 9, 6, 3, 2, [30, 20, 10]);
};
ITEM_PAINTERS[FROST_CIRCLET] = crownIcon([206, 230, 246], [120, 200, 255], false);
ITEM_PAINTERS[EMBER_CROWN] = crownIcon([60, 40, 40], [255, 120, 30]);
ITEM_PAINTERS[HONEY_TEA] = bottlePainter([214, 140, 40]);
ITEM_PAINTERS[MUSHROOM_STEW] = (ctx) => {
  rect(ctx, 2, 8, 12, 5, [150, 104, 60]); rect(ctx, 3, 13, 10, 1, [110, 74, 40]); rect(ctx, 2, 7, 12, 1, [120, 84, 48]);
  rect(ctx, 3, 8, 10, 2, [190, 150, 100]);
  for (const [x, y] of [[4, 6], [8, 5], [11, 6]]) { rect(ctx, x, y, 3, 2, [80, 210, 210]); px(ctx, x + 1, y + 2, [220, 230, 220]); }
};
ITEM_PAINTERS[FISH_PIE] = (ctx) => {
  for (let y = 5; y < 14; y++) for (let x = 1; x < 15; x++) {
    const d = Math.hypot((x - 7.5) / 6.6, (y - 9) / 4);
    if (d < 1) px(ctx, x, y, d > 0.8 ? [180, 120, 50] : (x + y) % 3 ? [226, 176, 96] : [206, 150, 70]);
  }
  rect(ctx, 5, 8, 6, 1, [150, 96, 40]); px(ctx, 11, 7, [150, 96, 40]); px(ctx, 11, 9, [150, 96, 40]);
};
ITEM_PAINTERS[COPY_WAND] = (ctx) => {
  for (let i = 0; i < 10; i++) { px(ctx, 3 + i, 12 - i, [120, 80, 160]); px(ctx, 4 + i, 12 - i, [90, 56, 130]); }
  rect(ctx, 11, 1, 4, 4, [250, 230, 120]); px(ctx, 13, 0, [255, 255, 220]); px(ctx, 15, 3, [255, 255, 220]); px(ctx, 10, 2, [255, 255, 220]);
  rect(ctx, 12, 2, 2, 2, [255, 255, 255]);
  rect(ctx, 1, 13, 3, 2, [200, 170, 90]);
};
ITEM_PAINTERS[CLUTCH] = (ctx) => {
  rect(ctx, 0, 7, 16, 3, [150, 150, 150]); rect(ctx, 0, 7, 16, 1, [180, 180, 180]);
  rect(ctx, 5, 3, 6, 11, IRON_C); rect(ctx, 7, 2, 2, 13, [104, 110, 134]); rect(ctx, 5, 3, 6, 1, [160, 164, 172]);
};
ITEM_PAINTERS[FLYWHEEL] = (ctx) => {
  rect(ctx, 0, 7, 16, 3, [150, 150, 150]);
  rect(ctx, 5, 0, 6, 16, [110, 110, 114]); rect(ctx, 6, 1, 4, 14, [140, 140, 146]); rect(ctx, 7, 6, 2, 4, [80, 80, 86]);
};
ITEM_PAINTERS[GEAR_SHIFT] = (ctx) => {
  rect(ctx, 0, 7, 16, 3, [150, 150, 150]);
  rect(ctx, 3, 4, 3, 9, [130, 130, 136]); rect(ctx, 9, 1, 3, 15, [130, 130, 136]); rect(ctx, 6, 6, 3, 5, IRON_C);
  for (const y of [2, 5, 11, 14]) px(ctx, 12, y, [170, 170, 176]);
};
ITEM_PAINTERS[DRIVE_BELT] = (ctx) => {
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    rect(ctx, Math.round(7.5 + Math.cos(a) * 6), Math.round(7.5 + Math.sin(a) * 4), 2, 2, i % 2 ? [92, 62, 40] : [120, 84, 54]);
  }
};
ITEM_PAINTERS[STORAGE_CART] = (ctx) => {
  ITEM_PAINTERS[MINECART](ctx);
  rect(ctx, 3, 1, 10, 6, [122, 82, 48]); rect(ctx, 3, 1, 10, 1, [92, 60, 34]); rect(ctx, 7, 3, 2, 2, [160, 164, 172]);
};
COLORS.forEach((c, i) => {
  const rgb = i === 1 ? [70, 70, 80] : c.rgb;
  ITEM_PAINTERS[PAINTED_DOOR + i * 16] = (ctx) => {
    rect(ctx, 4, 0, 8, 16, shade(rgb, 0.7));
    rect(ctx, 5, 1, 6, 14, rgb);
    rect(ctx, 6, 2, 4, 4, [170, 210, 230]); rect(ctx, 7, 2, 1, 4, shade(rgb, 0.7));
    px(ctx, 10, 9, [60, 60, 64]);
  };
});
ITEM_PAINTERS[PAINTING] = (ctx) => {
  rect(ctx, 1, 2, 14, 12, [120, 84, 48]);
  rect(ctx, 2, 3, 12, 10, [120, 180, 230]);
  rect(ctx, 2, 9, 12, 4, [90, 150, 70]); rect(ctx, 5, 7, 4, 3, [70, 130, 60]);
  rect(ctx, 10, 4, 2, 2, [255, 220, 90]);
};
ITEM_PAINTERS[SWITCH_RAIL] = (ctx) => {
  railIcon([150, 154, 162])(ctx);
  rect(ctx, 11, 6, 5, 2, [150, 154, 162]); rect(ctx, 12, 9, 4, 2, [150, 154, 162]); rect(ctx, 6, 6, 3, 3, [210, 40, 30]);
};
ITEM_PAINTERS[LOADER_RAIL] = (ctx) => { railIcon([150, 154, 162])(ctx); rect(ctx, 5, 5, 6, 6, IRON_C); rect(ctx, 6, 6, 4, 4, [70, 72, 80]); };

// battery-powered things: a lead battery with an electrum cap; a hand lamp; a jackhammer; a jetpack
ITEM_PAINTERS[BATTERY] = (ctx) => {
  rect(ctx, 4, 3, 8, 12, [84, 92, 118]); rect(ctx, 5, 4, 6, 10, [104, 112, 138]);
  rect(ctx, 6, 1, 4, 2, [230, 204, 100]); rect(ctx, 5, 7, 6, 3, [110, 200, 70]);
  rect(ctx, 7, 7, 2, 3, [240, 240, 240]);
};
ITEM_PAINTERS[PORTABLE_LAMP] = (ctx) => {
  rect(ctx, 6, 0, 4, 2, [150, 150, 156]); rect(ctx, 5, 2, 6, 1, [118, 122, 130]);
  rect(ctx, 5, 3, 6, 7, [255, 244, 190]); rect(ctx, 7, 4, 2, 5, [255, 255, 240]);
  rect(ctx, 4, 10, 8, 5, [84, 92, 118]); rect(ctx, 5, 11, 6, 1, [230, 204, 100]);
};
ITEM_PAINTERS[JACKHAMMER] = (ctx) => {
  rect(ctx, 3, 1, 10, 2, [60, 60, 66]); rect(ctx, 2, 1, 2, 4, [60, 60, 66]); rect(ctx, 12, 1, 2, 4, [60, 60, 66]); // handles
  rect(ctx, 5, 3, 6, 7, [196, 200, 210]); rect(ctx, 6, 4, 4, 2, [84, 92, 118]); rect(ctx, 6, 7, 4, 1, [230, 204, 100]);
  rect(ctx, 7, 10, 2, 5, [150, 154, 164]); px(ctx, 7, 15, [110, 114, 124]);
};
ITEM_PAINTERS[JETPACK] = (ctx) => {
  rect(ctx, 2, 2, 5, 10, [196, 200, 210]); rect(ctx, 9, 2, 5, 10, [196, 200, 210]);
  rect(ctx, 3, 3, 3, 8, [170, 174, 186]); rect(ctx, 10, 3, 3, 8, [170, 174, 186]);
  rect(ctx, 6, 4, 4, 6, [84, 92, 118]); rect(ctx, 7, 5, 2, 1, [230, 204, 100]);
  rect(ctx, 3, 12, 3, 2, [80, 80, 86]); rect(ctx, 10, 12, 3, 2, [80, 80, 86]);
  rect(ctx, 3, 14, 3, 2, [255, 170, 60]); rect(ctx, 10, 14, 3, 2, [255, 170, 60]);
};

ITEM_PAINTERS[WIND_TURBINE] = (ctx) => {
  rect(ctx, 7, 7, 2, 9, [150, 154, 164]); rect(ctx, 6, 5, 4, 3, [118, 122, 130]); // mast and hub
  rect(ctx, 7, 0, 2, 5, [236, 238, 240]); rect(ctx, 1, 6, 5, 2, [236, 238, 240]); rect(ctx, 10, 6, 5, 2, [236, 238, 240]); // blades
  px(ctx, 7, 6, [70, 72, 80]);
};
// v22 battery gear: an electric drill, hover boots, night-vision goggles, a magnet ring
ITEM_PAINTERS[ELECTRIC_DRILL] = (ctx) => {
  rect(ctx, 2, 4, 8, 6, [196, 200, 210]); rect(ctx, 3, 5, 6, 2, [84, 92, 118]); rect(ctx, 4, 8, 3, 1, [230, 204, 100]);
  rect(ctx, 4, 10, 3, 5, [60, 60, 66]); // grip
  rect(ctx, 10, 6, 2, 2, [150, 154, 164]); rect(ctx, 12, 6, 3, 2, [124, 120, 152]); px(ctx, 15, 7, [100, 96, 128]);
};
ITEM_PAINTERS[HOVER_BOOTS] = (ctx) => {
  rect(ctx, 2, 3, 4, 8, [120, 84, 50]); rect(ctx, 10, 3, 4, 8, [120, 84, 50]);
  rect(ctx, 1, 10, 6, 3, [226, 230, 236]); rect(ctx, 9, 10, 6, 3, [226, 230, 236]);
  rect(ctx, 2, 13, 4, 2, [140, 240, 255]); rect(ctx, 10, 13, 4, 2, [140, 240, 255]);
  rect(ctx, 3, 5, 2, 1, [230, 204, 100]); rect(ctx, 11, 5, 2, 1, [230, 204, 100]);
};
ITEM_PAINTERS[NV_GOGGLES] = (ctx) => {
  rect(ctx, 0, 7, 16, 2, [60, 50, 40]);
  for (const x of [2, 9]) { rect(ctx, x, 5, 5, 6, [60, 62, 70]); rect(ctx, x + 1, 6, 3, 4, [90, 230, 110]); px(ctx, x + 1, 6, [200, 255, 200]); }
};
// v23 gear
ITEM_PAINTERS[ELECTRIC_RAIL] = railIcon([214, 186, 80]);
ITEM_PAINTERS[RAIL_STATION] = (ctx) => { for (let y = 1; y < 15; y++) for (let x = 2; x < 14; x++) px(ctx, x, y, ((x + y) >> 2) % 2 ? [220, 50, 40] : [240, 236, 228]); railIcon([150, 154, 162])(ctx); };
// v24 F: farm animals' things
const blob = (ctx, cx, cy, rx, ry, c, c2) => { for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { const d = ((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2; if (d < 1) px(ctx, x, y, c2 && d > 0.6 && x > cx ? c2 : c); } };
ITEM_PAINTERS[EGG] = (ctx) => { blob(ctx, 8, 8.5, 4.5, 6, [244, 232, 210], [214, 196, 168]); px(ctx, 6, 5, [255, 252, 244]); };
ITEM_PAINTERS[FRIED_EGG] = (ctx) => { blob(ctx, 8, 8, 7, 6, [250, 248, 240], [226, 222, 212]); blob(ctx, 8, 8, 2.6, 2.6, [250, 186, 40]); };
ITEM_PAINTERS[TRUFFLE] = (ctx) => { blob(ctx, 8, 9, 5.5, 5, [70, 52, 40], [50, 36, 28]); for (const [x, y] of [[6, 7], [9, 8], [7, 11], [10, 11]]) px(ctx, x, y, [110, 86, 66]); };
// v25 B: fruit, pies, soups, juice and jam
ITEM_PAINTERS[APPLE] = (ctx) => { blob(ctx, 8, 9.5, 5.5, 5.5, [206, 32, 32], [160, 20, 24]); rect(ctx, 8, 2, 1, 3, [90, 60, 30]); rect(ctx, 9, 2, 3, 2, [70, 150, 50]); px(ctx, 6, 7, [250, 140, 130]); };
ITEM_PAINTERS[CHERRIES] = (ctx) => {
  for (let i = 0; i < 6; i++) { px(ctx, 7 - (i >> 1), 2 + i, [80, 110, 30]); px(ctx, 8 + (i >> 1), 2 + i, [80, 110, 30]); }
  blob(ctx, 5, 11, 3, 3, [160, 14, 34], [120, 8, 24]); blob(ctx, 11, 11, 3, 3, [160, 14, 34], [120, 8, 24]); px(ctx, 4, 10, [230, 100, 110]); px(ctx, 10, 10, [230, 100, 110]);
};
ITEM_PAINTERS[ORANGE_FRUIT] = (ctx) => { blob(ctx, 8, 9, 5.5, 5.5, [240, 140, 24], [210, 110, 16]); px(ctx, 8, 3, [70, 130, 40]); px(ctx, 9, 3, [70, 130, 40]); px(ctx, 6, 7, [255, 200, 120]); };
const piePainter = (fill) => (ctx) => {
  for (let y = 5; y < 14; y++) for (let x = 1; x < 15; x++) {
    const d = Math.hypot((x - 7.5) / 6.6, (y - 9) / 4);
    if (d < 1) px(ctx, x, y, d > 0.8 ? [180, 120, 50] : (x + y) % 4 === 0 ? fill : [226, 176, 96]);
  }
  for (const [x, y] of [[5, 8], [8, 9], [10, 8], [7, 11]]) px(ctx, x, y, fill);
};
ITEM_PAINTERS[APPLE_PIE] = piePainter([200, 150, 60]);
ITEM_PAINTERS[CHERRY_PIE] = piePainter([170, 20, 40]);
const bowlPainter = (soup, bits) => (ctx) => {
  rect(ctx, 2, 8, 12, 5, [150, 104, 60]); rect(ctx, 3, 13, 10, 1, [110, 74, 40]); rect(ctx, 2, 7, 12, 1, [120, 84, 48]);
  rect(ctx, 3, 8, 10, 2, soup);
  for (const [x, y, c] of bits) px(ctx, x, y, c);
};
ITEM_PAINTERS[FRUIT_SALAD] = bowlPainter([240, 230, 200], [[4, 7, [206, 32, 32]], [5, 7, [206, 32, 32]], [7, 6, [240, 140, 24]], [8, 7, [240, 140, 24]], [10, 7, [160, 14, 34]], [11, 6, [160, 14, 34]]]);
ITEM_PAINTERS[FISH_SOUP] = bowlPainter([220, 200, 150], [[5, 8, [240, 160, 120]], [9, 9, [240, 160, 120]], [7, 8, [90, 150, 60]]]);
ITEM_PAINTERS[TRUFFLE_SOUP] = bowlPainter([120, 90, 64], [[5, 8, [60, 44, 34]], [9, 8, [80, 210, 210]], [11, 9, [60, 44, 34]]]);
ITEM_PAINTERS[ORANGE_JUICE] = bottlePainter([246, 150, 30]);
ITEM_PAINTERS[BERRY_JAM] = bottlePainter([150, 24, 70]);
ITEM_PAINTERS[COOK_POT] = (ctx) => {
  for (const [x0, x1] of [[2, 3], [13, 14]]) for (let y = 3; y < 15; y++) px(ctx, y < 9 ? x0 : x0 + (x0 < 8 ? -1 : 1) * 0, y, [70, 70, 76]);
  for (let y = 5; y < 12; y++) for (let x = 3; x < 13; x++) px(ctx, x, y, y === 5 ? [120, 120, 128] : x === 3 ? [60, 60, 66] : [86, 86, 94]);
  rect(ctx, 5, 13, 6, 2, [110, 70, 40]); px(ctx, 7, 12, [250, 170, 40]); px(ctx, 8, 12, [250, 120, 30]);
};
ITEM_PAINTERS[SCARECROW] = (ctx) => {
  rect(ctx, 7, 6, 2, 10, [140, 100, 60]); // post
  rect(ctx, 1, 7, 14, 2, [214, 180, 80]); rect(ctx, 5, 6, 6, 6, [200, 166, 70]); // arms, body
  rect(ctx, 5, 2, 6, 4, [206, 184, 140]); px(ctx, 6, 3, [40, 30, 24]); px(ctx, 9, 3, [40, 30, 24]); // head
  rect(ctx, 4, 1, 8, 1, [110, 80, 50]); rect(ctx, 6, 0, 4, 1, [110, 80, 50]); // hat
};
// v25 C: an explorer's map (a map with a gold compass rose) and an old treasure map
ITEM_PAINTERS[EXPLORER_MAP] = (ctx) => {
  rect(ctx, 1, 2, 14, 12, [226, 214, 172]);
  for (let y = 3; y < 13; y++) for (let x = 2; x < 14; x++) px(ctx, x, y, Math.sin(x * 0.9) + Math.cos(y * 0.5) > 0.4 ? [120, 168, 84] : [90, 140, 210]);
  for (const [x, y] of [[4, 5], [10, 4], [6, 10], [11, 10]]) px(ctx, x, y, [60, 40, 30]);
  rect(ctx, 11, 9, 3, 3, [230, 190, 50]); px(ctx, 12, 8, [230, 190, 50]); px(ctx, 12, 12, [230, 190, 50]); px(ctx, 10, 10, [230, 190, 50]); px(ctx, 14, 10, [230, 190, 50]);
};
ITEM_PAINTERS[TREASURE_MAP] = (ctx) => {
  for (let y = 2; y < 14; y++) for (let x = 1; x < 15; x++) px(ctx, x, y, (x * 3 + y * 5) % 7 ? [214, 190, 140] : [196, 168, 116]);
  for (const [x, y] of [[3, 11], [4, 10], [5, 10], [6, 9], [8, 8], [9, 7], [10, 6]]) px(ctx, x, y, [120, 80, 50]); // the trail
  for (let i = 0; i < 4; i++) { px(ctx, 10 + i, 3 + i, [200, 30, 30]); px(ctx, 13 - i, 3 + i, [200, 30, 30]); } // X
};
// v26 C: the new crops
ITEM_PAINTERS[CARROT] = (ctx) => {
  for (let k = 0; k < 9; k++) rect(ctx, 4 + k, 11 - k, Math.max(1, 3 - Math.floor(k / 4)), 3, [236, 120, 30]);
  rect(ctx, 6, 9, 1, 1, [190, 90, 20]); rect(ctx, 9, 6, 1, 1, [190, 90, 20]);
  rect(ctx, 12, 1, 1, 3, [70, 150, 50]); rect(ctx, 13, 2, 2, 1, [90, 170, 60]); rect(ctx, 11, 2, 1, 2, [60, 130, 44]);
};
const spud = (body, dark) => (ctx) => { rect(ctx, 4, 5, 8, 7, body); rect(ctx, 3, 6, 10, 5, body); rect(ctx, 5, 4, 6, 1, body); px(ctx, 6, 7, dark); px(ctx, 9, 9, dark); px(ctx, 10, 6, dark); };
ITEM_PAINTERS[POTATO] = spud([196, 160, 96], [140, 110, 60]);
ITEM_PAINTERS[BAKED_POTATO] = (ctx) => { spud([150, 100, 50], [110, 70, 30])(ctx); rect(ctx, 6, 6, 4, 2, [250, 230, 150]); };
ITEM_PAINTERS[PUMPKIN_SEEDS] = (ctx) => { for (const [x, y] of [[4, 5], [9, 4], [6, 9], [10, 10], [3, 11]]) { rect(ctx, x, y, 2, 3, [238, 226, 180]); px(ctx, x, y, [255, 250, 220]); } };
ITEM_PAINTERS[PUMPKIN_PIE] = (ctx) => { rect(ctx, 2, 8, 12, 4, [196, 140, 70]); rect(ctx, 3, 7, 10, 2, [214, 120, 30]); rect(ctx, 2, 12, 12, 1, [150, 100, 50]); px(ctx, 5, 7, [240, 160, 60]); };
ITEM_PAINTERS[GRAPES] = (ctx) => {
  for (const [x, y] of [[5, 4], [8, 4], [11, 4], [6, 7], [9, 7], [7, 10], [10, 10], [8, 13]]) { rect(ctx, x - 1, y - 1, 3, 3, [96, 40, 120]); px(ctx, x - 1, y - 1, [160, 100, 190]); }
  rect(ctx, 8, 0, 1, 3, [110, 80, 40]); rect(ctx, 9, 1, 3, 1, [70, 140, 50]);
};
// v26 D: bottles of juice and wine; curds and cheeses
const wineBottle = (c, label) => (ctx) => {
  rect(ctx, 6, 1, 4, 2, [110, 80, 50]); rect(ctx, 6, 3, 4, 3, [60, 90, 60]); rect(ctx, 4, 6, 8, 9, [60, 90, 60]);
  rect(ctx, 5, 7, 6, 7, c);
  if (label) { rect(ctx, 5, 9, 6, 3, label); px(ctx, 7, 10, [160, 40, 40]); }
  px(ctx, 5, 7, [200, 230, 200]);
};
ITEM_PAINTERS[GRAPE_JUICE] = (ctx) => { bottlePainter([140, 60, 160])(ctx); };
ITEM_PAINTERS[WINE] = wineBottle([110, 20, 40], null);
ITEM_PAINTERS[FINE_WINE] = wineBottle([110, 20, 40], [236, 220, 170]);
ITEM_PAINTERS[CURDS] = (ctx) => { for (const [x, y] of [[4, 8], [8, 6], [9, 10], [5, 11], [11, 8]]) { rect(ctx, x, y, 3, 3, [246, 244, 230]); px(ctx, x + 2, y + 2, [210, 206, 190]); } };
const cheeseWedge = (c, rind) => (ctx) => {
  for (let k = 0; k < 9; k++) rect(ctx, 3, 12 - k, 4 + k, 1, c);
  rect(ctx, 3, 12, 12, 2, rind);
  for (const [x, y] of [[6, 9], [9, 10], [5, 6], [11, 8]]) px(ctx, x, y, [rind[0] * 0.9, rind[1] * 0.85, rind[2] * 0.6]);
};
ITEM_PAINTERS[CHEESE] = cheeseWedge([244, 214, 110], [220, 180, 70]);
ITEM_PAINTERS[AGED_CHEESE] = cheeseWedge([226, 180, 70], [150, 100, 40]);
// v26 E: diving gear and pearls
ITEM_PAINTERS[DIVING_HELMET] = (ctx) => {
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { const d = Math.hypot(x - 7.5, y - 7.5); if (d < 7) px(ctx, x, y, d > 5.8 ? [150, 90, 40] : [200, 126, 60]); }
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { const d = Math.hypot(x - 7.5, y - 7); if (d < 3.4) px(ctx, x, y, d > 2.6 ? [120, 70, 30] : [170, 210, 230]); }
  px(ctx, 6, 6, [240, 250, 255]); rect(ctx, 3, 13, 10, 2, [110, 110, 120]);
};
ITEM_PAINTERS[FLIPPERS] = (ctx) => {
  for (const ox of [1, 8]) { rect(ctx, ox + 1, 2, 4, 5, [60, 90, 120]); rect(ctx, ox, 7, 6, 4, [40, 140, 170]); rect(ctx, ox - 0, 11, 7, 3, [40, 140, 170]); for (let k = 0; k < 3; k++) px(ctx, ox + 1 + k * 2, 13, [20, 100, 130]); }
};
ITEM_PAINTERS[PEARL] = (ctx) => {
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { const d = Math.hypot(x - 7.5, y - 7.5); if (d < 4.5) px(ctx, x, y, d < 1.5 && x < 8 ? [255, 255, 255] : d > 3.6 ? [200, 196, 210] : [236, 232, 240]); }
};
// v26 F: a little green locomotive
ITEM_PAINTERS[LOCOMOTIVE] = (ctx) => {
  rect(ctx, 1, 6, 9, 5, [50, 120, 70]); rect(ctx, 9, 3, 5, 8, [170, 40, 40]); rect(ctx, 10, 4, 3, 3, [190, 220, 240]);
  rect(ctx, 3, 2, 2, 4, [40, 40, 44]); rect(ctx, 0, 11, 15, 1, [60, 60, 66]);
  for (const x of [2, 6, 11]) { rect(ctx, x, 12, 3, 3, [30, 30, 34]); px(ctx, x + 1, 13, [150, 150, 160]); }
  px(ctx, 0, 8, [255, 230, 120]);
};
// v27: a firework rocket
ITEM_PAINTERS[FIREWORK] = (ctx) => {
  rect(ctx, 6, 4, 4, 9, [200, 40, 50]); rect(ctx, 6, 6, 4, 1, [240, 220, 120]); rect(ctx, 6, 10, 4, 1, [240, 220, 120]);
  rect(ctx, 7, 1, 2, 3, [220, 200, 160]); px(ctx, 7, 0, [240, 240, 240]);
  rect(ctx, 7, 13, 2, 3, [120, 90, 60]);
};
// v26: a silver coin
ITEM_PAINTERS[COIN] = (ctx) => {
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const d = Math.hypot(x - 7.5, y - 7.5);
    if (d < 6.5) px(ctx, x, y, d > 5.3 ? [150, 150, 160] : (x + y) % 5 === 0 ? [235, 235, 245] : [196, 198, 210]);
  }
  rect(ctx, 6, 5, 4, 1, [120, 120, 132]); rect(ctx, 6, 7, 4, 1, [120, 120, 132]); rect(ctx, 6, 9, 4, 1, [120, 120, 132]);
};
// v25 E: a cable car gondola
ITEM_PAINTERS[CABLE_CAR] = (ctx) => {
  rect(ctx, 0, 1, 16, 1, [80, 80, 86]); rect(ctx, 7, 1, 2, 4, [120, 120, 126]);
  rect(ctx, 2, 5, 12, 9, [200, 40, 40]); rect(ctx, 3, 6, 4, 4, [170, 210, 230]); rect(ctx, 9, 6, 4, 4, [170, 210, 230]);
  rect(ctx, 2, 13, 12, 1, [120, 24, 24]);
};
// v25 D: a cake of beeswax
ITEM_PAINTERS[BEESWAX] = (ctx) => {
  for (let y = 5; y < 13; y++) for (let x = 2; x < 14; x++) px(ctx, x, y, y === 5 ? [252, 226, 130] : x === 2 || y === 12 ? [204, 150, 40] : (x * 7 + y * 3) % 5 ? [240, 196, 80] : [226, 178, 60]);
  for (let x = 3; x < 13; x++) px(ctx, x, 4, [246, 212, 110]);
};
// v25 A: a terracotta pot, a hanging basket of ivy, a window box of flowers
const potShape = (ctx, x0, y0, w, h) => {
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const inset = y > 1 ? Math.floor((y - 1) / 3) : 0;
    if (x < inset || x >= w - inset) continue;
    px(ctx, x0 + x, y0 + y, y < 2 ? [200, 108, 64] : x === inset ? [150, 72, 42] : [180, 90, 54]);
  }
};
ITEM_PAINTERS[FLOWER_POT] = (ctx) => { potShape(ctx, 3, 7, 10, 8); for (let x = 4; x < 12; x++) px(ctx, x, 7, [90, 62, 40]); };
ITEM_PAINTERS[HANGING_PLANT] = (ctx) => {
  for (let y = 0; y < 6; y++) { px(ctx, 8, y, [120, 120, 126]); px(ctx, 8 - (6 - y) / 2 | 0, y + 1, [120, 120, 126]); px(ctx, 8 + (6 - y) / 2 | 0, y + 1, [120, 120, 126]); }
  potShape(ctx, 4, 6, 8, 5);
  for (const [x, y0, len] of [[3, 6, 8], [5, 8, 7], [11, 7, 7], [12, 5, 9], [8, 10, 5]]) for (let y = y0; y < y0 + len && y < 16; y++) px(ctx, x + (y % 3 === 0 ? 1 : 0), y, y % 2 ? [56, 120, 44] : [76, 150, 54]);
};
ITEM_PAINTERS[WINDOW_BOX] = (ctx) => {
  for (let y = 10; y < 15; y++) for (let x = 1; x < 15; x++) px(ctx, x, y, y === 10 ? [176, 136, 84] : [146, 108, 64]);
  const heads = [[220, 40, 40], [250, 210, 50], [80, 110, 230], [170, 110, 210], [245, 245, 240]];
  for (let k = 0; k < 5; k++) {
    const x = 2 + k * 3, top = 4 + (k % 2) * 2;
    for (let y = top + 1; y < 10; y++) px(ctx, x, y, [60, 130, 46]);
    for (const [dx, dy] of [[0, -1], [-1, 0], [1, 0], [0, 1]]) px(ctx, x + dx, top + dy, heads[k]);
    px(ctx, x, top, [250, 220, 90]);
  }
};
ITEM_PAINTERS[SADDLE] = (ctx) => {
  for (let x = 2; x < 14; x++) for (let y = 6; y < 10; y++) px(ctx, x, y + (x < 4 || x > 11 ? -1 : 0), y === 6 ? [160, 90, 50] : [122, 60, 28]);
  for (let y = 10; y < 15; y++) { px(ctx, 7, y, [90, 60, 40]); px(ctx, 8, y, [90, 60, 40]); } // strap
  for (const x of [6, 9]) px(ctx, x, 14, [200, 200, 206]); // stirrup
};
ITEM_PAINTERS[BOAT] = (ctx) => {
  rect(ctx, 1, 8, 14, 3, [160, 106, 60]); rect(ctx, 3, 11, 10, 2, [138, 90, 50]); rect(ctx, 0, 6, 2, 3, [160, 106, 60]); rect(ctx, 14, 6, 2, 3, [160, 106, 60]);
  rect(ctx, 2, 9, 12, 1, [110, 72, 40]); for (let k = 0; k < 6; k++) px(ctx, 4 + k, 7 - (k >> 1), [106, 68, 38]); // an oar
};
ITEM_PAINTERS[BALLOON] = (ctx) => {
  const st = [[210, 60, 50], [240, 200, 56], [60, 120, 210]];
  for (let y = 0; y < 10; y++) for (let x = 0; x < 16; x++) { const d = Math.hypot((x - 7.5) / 6, (y - 4.5) / 5); if (d < 1) px(ctx, x, y, st[((x + 1) >> 2) % 3]); }
  for (const x of [5, 10]) for (let y = 10; y < 13; y++) px(ctx, x, y, [216, 207, 176]);
  rect(ctx, 5, 13, 6, 3, [154, 106, 58]);
};
ITEM_PAINTERS[ZIP_LINE] = (ctx) => {
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { const d = Math.hypot(x - 7.5, y - 7.5); if (d > 3 && d < 6.5 && ((Math.atan2(y - 7.5, x - 7.5) * 6) | 0) % 2 === 0) px(ctx, x, y, [226, 214, 170]); else if (d > 3 && d < 6.5) px(ctx, x, y, [196, 184, 140]); }
  rect(ctx, 12, 11, 3, 3, [176, 180, 190]); // a clip
};
ITEM_PAINTERS[CHAINSAW] = (ctx) => {
  rect(ctx, 1, 6, 6, 6, [230, 120, 40]); rect(ctx, 2, 7, 3, 2, [84, 92, 118]); rect(ctx, 1, 4, 4, 2, [60, 60, 66]); // body and handle
  rect(ctx, 7, 7, 8, 3, [196, 200, 210]); for (let x = 7; x < 15; x += 2) { px(ctx, x, 6, [150, 154, 164]); px(ctx, x + 1, 10, [150, 154, 164]); } // bar and chain
  px(ctx, 3, 10, [230, 204, 100]);
};
ITEM_PAINTERS[SAWDUST] = (ctx) => { for (let y = 8; y < 15; y++) for (let x = 2; x < 14; x++) if (Math.abs(x - 7.5) < (y - 6) * 0.9) px(ctx, x, y, (x * 7 + y * 3) % 5 ? [212, 180, 120] : [176, 140, 86]); };
ITEM_PAINTERS[BOOK] = (ctx) => {
  rect(ctx, 3, 2, 10, 12, [120, 84, 50]); rect(ctx, 4, 3, 8, 10, [140, 98, 60]); rect(ctx, 12, 3, 2, 10, [246, 242, 228]);
  rect(ctx, 6, 5, 4, 1, [230, 204, 100]); rect(ctx, 6, 7, 4, 1, [230, 204, 100]);
};
const backpack = (trim) => (ctx) => {
  rect(ctx, 3, 3, 10, 12, [130, 90, 54]); rect(ctx, 4, 2, 8, 2, [110, 76, 46]); // body and top
  rect(ctx, 4, 8, 8, 5, [150, 106, 64]); rect(ctx, 7, 9, 2, 2, trim); // pocket and buckle
  rect(ctx, 3, 3, 10, 1, trim); rect(ctx, 6, 0, 4, 2, [90, 62, 38]); // trim and handle
};
ITEM_PAINTERS[BACKPACK] = backpack([90, 62, 38]);
ITEM_PAINTERS[BIG_BACKPACK] = backpack([200, 204, 212]);
ITEM_PAINTERS[HUGE_BACKPACK] = backpack([226, 232, 240]);
ITEM_PAINTERS[SPANNER] = (ctx) => {
  for (let k = 0; k < 9; k++) rect(ctx, 4 + k, 11 - k, 2, 2, [176, 180, 190]); // the handle
  rect(ctx, 11, 1, 4, 4, [176, 180, 190]); ctx.clearRect(12, 1, 2, 2); // open jaw
  rect(ctx, 1, 11, 4, 4, [176, 180, 190]); rect(ctx, 2, 12, 2, 2, [80, 82, 90]); // ring end
};
ITEM_PAINTERS[GRAPPLE] = (ctx) => {
  rect(ctx, 7, 3, 2, 9, [150, 154, 164]); rect(ctx, 3, 11, 10, 2, [150, 154, 164]); px(ctx, 3, 10, [150, 154, 164]); px(ctx, 12, 10, [150, 154, 164]); // the hook
  for (let y = 0; y < 3; y++) px(ctx, 8 - (y % 2), y, [226, 214, 170]); // its rope
};
ITEM_PAINTERS[FUEL_ROD] = (ctx) => { rect(ctx, 6, 1, 4, 14, [196, 200, 210]); rect(ctx, 7, 3, 2, 10, [126, 214, 72]); rect(ctx, 6, 1, 4, 1, [84, 92, 118]); rect(ctx, 6, 14, 4, 1, [84, 92, 118]); };
ITEM_PAINTERS[JOURNAL] = (ctx) => {
  rect(ctx, 3, 2, 10, 12, [60, 90, 70]); rect(ctx, 4, 3, 8, 10, [74, 110, 86]); rect(ctx, 12, 3, 2, 10, [246, 242, 228]);
  rect(ctx, 3, 7, 10, 1, [180, 60, 50]); // a ribbon
  for (let k = 0; k < 4; k++) px(ctx, 13 - k, 1 + k, [240, 240, 240]); px(ctx, 9, 5, [40, 40, 40]); // a quill
};
ITEM_PAINTERS[FERTILISER] = (ctx) => {
  rect(ctx, 4, 4, 8, 10, [200, 180, 130]); rect(ctx, 5, 2, 6, 2, [180, 160, 110]); rect(ctx, 6, 1, 4, 1, [150, 130, 90]); // a sack
  rect(ctx, 6, 7, 4, 4, [80, 150, 60]); px(ctx, 7, 6, [80, 150, 60]); px(ctx, 8, 6, [110, 180, 80]); // a sprout on it
};
const rodIcon = (core, cap) => (ctx) => { rect(ctx, 6, 1, 4, 14, [196, 200, 210]); rect(ctx, 7, 3, 2, 10, core); rect(ctx, 6, 1, 4, 1, cap); rect(ctx, 6, 14, 4, 1, cap); };
ITEM_PAINTERS[SPENT_ROD] = (ctx) => { rodIcon([80, 90, 70], [60, 60, 60])(ctx); for (const [x, y] of [[3, 3], [12, 6], [4, 11], [12, 12]]) px(ctx, x, y, [126, 214, 72]); };
ITEM_PAINTERS[ENRICHED_ROD] = rodIcon([190, 255, 120], [214, 186, 80]);
ITEM_PAINTERS[ENRICHED_URANIUM] = (ctx) => {
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { const d = Math.hypot(x - 7.5, y - 8); if (d < 4.5) px(ctx, x, y, d < 2 ? [230, 255, 190] : [150, 240, 90]); }
};
[0, 1, 2, 3].forEach((pi) => { ITEM_PAINTERS[hazmatId(pi)] = armourPainter([230, 200, 40], pi); });
ITEM_PAINTERS[MAGNET_RING] = (ctx) => {
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { const d = Math.hypot(x - 7.5, y - 8.5); if (d > 3.5 && d < 6) px(ctx, x, y, y < 8 ? [200, 50, 40] : [190, 200, 176]); }
  rect(ctx, 6, 1, 4, 2, [84, 92, 118]); px(ctx, 7, 1, [230, 204, 100]);
};

// An isometric drawing of a model block (furniture, stairs, fences...) for blocks with no painted icon,
// matching drawIsoBlock: +z faces to the left, +x faces to the right.
function drawIsoModel(ctx, atlas, model) {
  const S = (x, y, z) => [4 + 28 * x + 28 * (1 - z), 18 + 14 * x - 14 * (1 - z) + 28 * (1 - y)];
  const boxes = [...model].sort((a, b) => (a[0] + a[3] + a[1] + a[4] + a[2] + a[5]) - (b[0] + b[3] + b[1] + b[4] + b[2] + b[5]));
  const k = 1 / 16;
  for (const [x0, y0, z0, x1, y1, z1, tiles, , kind] of boxes) {
    if (kind === 'cross') {
      // a plant: the whole tile, standing up through the middle of its box and facing you
      const zm = (z0 + z1) / 2 * k, [ox, oy] = S(x0 * k, y1 * k, zm), [rx, ry] = S(x1 * k, y1 * k, zm), [bx, by] = S(x0 * k, y0 * k, zm);
      ctx.save();
      ctx.imageSmoothingEnabled = false;
      ctx.setTransform((rx - ox) / TILE, (ry - oy) / TILE, (bx - ox) / TILE, (by - oy) / TILE, ox, oy);
      ctx.drawImage(atlas, (tiles % ATLAS_COLS) * TILE, Math.floor(tiles / ATLAS_COLS) * TILE, TILE, TILE, 0, 0, TILE, TILE);
      ctx.restore();
      continue;
    }
    const tileOf = (f) => (typeof tiles === 'number' ? tiles : tiles[f]);
    const face = (tile, m, sx, sy, sw, sh, shadeAmt) => {
      if (sw <= 0 || sh <= 0) return;
      const c = document.createElement('canvas');
      c.width = c.height = 64;
      const l = c.getContext('2d');
      l.imageSmoothingEnabled = false;
      l.setTransform(...m);
      const tx = (tile % ATLAS_COLS) * TILE, ty = Math.floor(tile / ATLAS_COLS) * TILE;
      l.drawImage(atlas, tx + sx, ty + sy, sw, sh, sx, sy, sw, sh);
      if (shadeAmt) { l.globalCompositeOperation = 'source-atop'; l.fillStyle = `rgba(0,0,0,${shadeAmt})`; l.fillRect(sx, sy, sw, sh); }
      ctx.drawImage(c, 0, 0);
    };
    // top (y = y1): tile u = x, v = z
    let o = S(0, y1 * k, 0);
    face(tileOf('top'), [28 * k, 14 * k, -28 * k, 14 * k, o[0], o[1]], x0, z0, x1 - x0, z1 - z0, 0);
    // front (+z, z = z1): tile u = x, v = 16 - y
    o = S(0, 1, z1 * k);
    face(tileOf('side'), [28 * k, 14 * k, 0, 28 * k, o[0], o[1]], x0, 16 - y1, x1 - x0, y1 - y0, 0.25);
    // right (+x, x = x1): tile u = 16 - z, v = 16 - y
    o = S(x1 * k, 1, 1);
    face(tileOf('side'), [28 * k, -14 * k, 0, 28 * k, o[0], o[1]], 16 - z1, 16 - y1, z1 - z0, y1 - y0, 0.45);
  }
}

// Returns { id: dataURL } for every block and item.
export function createIcons(atlas) {
  const icons = {}, canvases = {};
  for (const def of BLOCKS) {
    if (!def || !isBlock(def.id) || def.shape === 'torch' || def.shape === 'kinetic' || def.shape === 'pipe' || def.shape === 'lpipe') continue; // (those have painted icons)
    if (def.model && ITEM_PAINTERS[def.id]) continue;
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const ctx = c.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    if (def.model) {
      drawIsoModel(ctx, atlas, def.model);
    } else if (def.shape === 'cross') {
      // plants show their flat sprite, like an item
      ctx.drawImage(atlas, (def.side % ATLAS_COLS) * TILE, Math.floor(def.side / ATLAS_COLS) * TILE, TILE, TILE, 0, 0, 64, 64);
    } else {
      drawIsoBlock(ctx, atlas, def);
    }
    icons[def.id] = c.toDataURL();
    canvases[def.id] = c;
  }
  for (const [id, paint] of Object.entries(ITEM_PAINTERS)) {
    const small = document.createElement('canvas');
    small.width = small.height = 16;
    paint(small.getContext('2d'));
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const ctx = c.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(small, 0, 0, 64, 64);
    icons[id] = c.toDataURL();
    canvases[id] = c;
  }
  // (v35) crated items: a crate with what's inside drawn on its front
  for (const [cid, inner] of Object.entries(CRATED)) {
    const small = document.createElement('canvas');
    small.width = small.height = 16;
    paintCrateBox(small.getContext('2d'));
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const ctx = c.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(small, 0, 0, 64, 64);
    if (canvases[inner]) ctx.drawImage(canvases[inner], 14, 16, 36, 36);
    icons[cid] = c.toDataURL();
  }
  Object.defineProperty(icons, 'canvases', { value: canvases }); // (v38: held items are modelled from these)
  return icons;
}

// ----- seasons -----
// Repaint the leaves and grass tiles of the atlas for a season (0 spring, 1 summer, 2 autumn, 3 winter).
const AUTUMN = [[206, 96, 36], [226, 150, 40], [170, 60, 34], [196, 170, 60]];
export function paintSeason(canvas, season) {
  const ctx = canvas.getContext('2d');
  const put = (tile, recolour) => {
    const t = new Tile(mulberry32(1000 + tile * 7919));
    P[tile](t);
    for (let i = 0; i < t.d.length; i += 4) {
      if (!t.d[i + 3]) continue;
      const c = recolour([t.d[i], t.d[i + 1], t.d[i + 2]], i / 4);
      if (!c) { t.d[i + 3] = 0; continue; }
      t.d[i] = clamp(c[0]); t.d[i + 1] = clamp(c[1]); t.d[i + 2] = clamp(c[2]);
    }
    ctx.putImageData(new ImageData(t.d, TILE, TILE), (tile % ATLAS_COLS) * TILE, Math.floor(tile / ATLAS_COLS) * TILE);
  };
  const greenish = (c) => c[1] > c[0] + 12 && c[1] > c[2];
  const hash = (i) => ((i * 2654435761) >>> 0) / 4294967296;
  const mix = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
  put(T.LEAVES, (c, i) => {
    const lum = (c[0] + c[1] + c[2]) / 3 / 80;
    if (season === 0) return mix(c, [120, 190, 70], 0.35);
    if (season === 2) return shade(AUTUMN[Math.floor(hash(i) * 4)], 0.7 + lum * 0.4);
    if (season === 3) return hash(i) < 0.35 ? null : mix(c, [110, 96, 70], 0.6);
    return c;
  });
  const grass = (c, i) => {
    if (!greenish(c)) return c;
    if (season === 0) return mix(c, [120, 190, 70], 0.25);
    if (season === 2) return mix(c, [176, 160, 70], 0.45);
    if (season === 3) return mix(c, [226, 232, 236], 0.55 + hash(i) * 0.25);
    return c;
  };
  put(T.GRASS_TOP, grass);
  put(T.GRASS_SIDE, grass);
  // fruit trees blossom in spring (pink cherry, white apple and orange), and go thin in winter
  const BLOSSOM = [[250, 246, 240], [248, 180, 206], [255, 252, 236]];
  for (let k = 0; k < 3; k++) {
    put(T.FRUIT_LEAVES + k, (c, i) => {
      if (season === 0) {
        // blossom in little clumps of 2 x 2 pixels
        const x = i % 16, y = i >> 4, h = Math.imul(((y >> 1) * 8 + (x >> 1)) ^ (k * 0x9e37), 0x85ebca6b) >>> 0;
        return ((h ^ (h >>> 13)) & 255) < 100 ? shade(BLOSSOM[k], 0.9 + ((x + y) & 1) * 0.1) : mix(c, [120, 190, 70], 0.3);
      }
      if (season === 2) return mix(c, [190, 170, 60], 0.3);
      if (season === 3) return hash(i) < 0.45 ? null : mix(c, [110, 96, 70], 0.6);
      return c;
    });
  }
}

// v27 C: onions, beans, tomatoes and herbs (four stages each), and what's made of them
for (let k = 0; k < 4; k++) {
  // onions: tall hollow leaves, and the bulbs showing at the ground when they're ready
  P[T.ONION_0 + k] = (t) => {
    const h = [4, 7, 10, 12][k];
    for (const x of [3, 7, 11]) {
      for (let j = 0; j < h - Math.floor(t.r() * 2); j++) t.set(x + (j > h * 0.7 ? 1 : 0), 15 - j, t.vary([96, 160, 70], 0.1));
      if (k === 3) for (let dx = -1; dx <= 1; dx++) for (let j = 0; j < 3; j++) t.set(x + dx, 15 - j, t.vary(j === 2 && dx ? [200, 170, 120] : [214, 180, 120], 0.08));
    }
  };
  // beans: climbing on a cane, with pods hanging when they're ready
  P[T.BEAN_0 + k] = (t) => {
    const h = [5, 9, 13, 15][k];
    for (const x of [4, 11]) {
      if (k > 0) for (let j = 0; j < 16; j++) t.set(x, 15 - j, t.vary([150, 120, 70], 0.08)); // the cane
      for (let j = 0; j < h; j++) { const wx = x + (j % 4 < 2 ? -1 : 1); t.set(wx, 15 - j, t.vary([60, 140, 50], 0.12)); if (j % 3 === 1) t.set(wx + (wx < x ? -1 : 1), 15 - j, t.vary([80, 160, 60], 0.1)); }
      if (k === 3) for (const j of [5, 9, 12]) for (let d = 0; d < 3; d++) t.set(x + 2, 15 - j + d, t.vary([140, 196, 80], 0.06));
    }
  };
  // tomatoes: a bushy plant, red fruit when ripe (green before)
  P[T.TOMATO_0 + k] = (t) => {
    leafyCrop(t, k, null);
    if (k >= 2) for (const [x, y] of [[3, 9], [9, 7], [12, 10], [6, 11]]) for (let d = 0; d < 4; d++) t.set(x + (d & 1), y + (d >> 1), t.vary(k === 3 ? [214, 40, 30] : [120, 170, 60], 0.08));
  };
  // herbs: low and bushy, purple flowers at the end
  P[T.HERB_0 + k] = (t) => {
    const h = [2, 4, 6, 7][k];
    for (let x = 1; x < 15; x += 2) for (let j = 0; j < h - Math.floor(t.r() * 2); j++) { t.set(x, 15 - j, t.vary([80, 130, 70], 0.15)); if (j % 2) t.set(x + 1, 15 - j, t.vary([110, 150, 90], 0.12)); }
    if (k === 3) for (let x = 2; x < 15; x += 3) t.set(x, 15 - h, t.vary([170, 120, 210], 0.1));
  };
}
ITEM_PAINTERS[ONION] = (ctx) => { blob(ctx, 8, 10, 5, 4.5, [210, 170, 110], [170, 130, 80]); rect(ctx, 7, 3, 2, 3, [214, 190, 140]); rect(ctx, 8, 1, 1, 2, [96, 160, 70]); px(ctx, 6, 8, [240, 210, 160]); rect(ctx, 6, 14, 4, 1, [150, 120, 80]); };
ITEM_PAINTERS[BEANS] = (ctx) => { for (const [x, y] of [[3, 3], [7, 5], [5, 9]]) for (let k = 0; k < 6; k++) { rect(ctx, x + k, y + k, 2, 2, [130, 190, 76]); px(ctx, x + k, y + k, [170, 220, 110]); } };
ITEM_PAINTERS[TOMATO] = (ctx) => { blob(ctx, 8, 9.5, 5.5, 5, [214, 40, 30], [170, 26, 20]); rect(ctx, 6, 4, 5, 1, [70, 140, 50]); rect(ctx, 8, 3, 1, 2, [70, 140, 50]); px(ctx, 6, 7, [250, 140, 120]); };
ITEM_PAINTERS[HERBS] = (ctx) => {
  rect(ctx, 7, 9, 2, 6, [180, 150, 90]); // tied in a bunch
  for (const [x, y, c] of [[5, 3, [80, 140, 70]], [9, 2, [100, 160, 80]], [7, 5, [70, 120, 60]], [4, 6, [110, 150, 90]], [11, 5, [80, 140, 70]]]) { rect(ctx, x, y, 2, 4, c); px(ctx, x + 1, y, [170, 120, 210]); }
};
ITEM_PAINTERS[APPLE_JUICE] = bottlePainter([236, 196, 80]);
ITEM_PAINTERS[BERRY_JUICE] = bottlePainter([180, 30, 70]);
ITEM_PAINTERS[CIDER] = wineBottle([214, 160, 50], null);
ITEM_PAINTERS[VINTAGE_CIDER] = wineBottle([214, 160, 50], [236, 220, 170]);
ITEM_PAINTERS[BERRY_WINE] = wineBottle([150, 20, 90], null);
ITEM_PAINTERS[FINE_BERRY_WINE] = wineBottle([150, 20, 90], [236, 220, 170]);
ITEM_PAINTERS[VEG_STEW] = bowlPainter([170, 110, 60], [[5, 8, [236, 120, 30]], [9, 8, [214, 180, 120]], [11, 9, [80, 140, 70]], [7, 9, [196, 160, 96]]]);
ITEM_PAINTERS[TOMATO_SOUP] = bowlPainter([206, 50, 34], [[6, 8, [80, 140, 70]], [10, 9, [240, 120, 100]]]);
ITEM_PAINTERS[BAKED_BEANS] = bowlPainter([196, 90, 40], [[5, 8, [230, 170, 120]], [7, 9, [230, 170, 120]], [9, 8, [230, 170, 120]], [11, 9, [230, 170, 120]]]);

// v27 D: the kiln, terracotta, glazed tiles, roof tiles, urns and rope
P[T.KILN_SIDE] = (t) => bricks(t, [176, 104, 70], [130, 112, 96]);
P[T.KILN_TOP] = (t) => { bricks(t, [150, 88, 60], [120, 100, 86]); for (let y = 5; y < 11; y++) for (let x = 5; x < 11; x++) t.set(x, y, t.vary([40, 34, 30], 0.1)); };
P[T.KILN_FRONT] = (t) => { bricks(t, [176, 104, 70], [130, 112, 96]); mouth(t, 'arch', false); };
P[T.KILN_FRONT_LIT] = (t) => { bricks(t, [176, 104, 70], [130, 112, 96]); mouth(t, 'arch', true); };
const TERRA = [178, 98, 62];
P[T.TERRACOTTA] = (t) => { for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) t.set(x, y, t.vary(TERRA, 0.05)); for (let k = 0; k < 6; k++) t.set(Math.floor(t.r() * 16), Math.floor(t.r() * 16), shade(TERRA, 0.88)); };
COLORS.forEach((c, i) => {
  // fired colours come out earthy and muted
  const col = c.rgb.map((v, j) => Math.round(v * 0.62 + TERRA[j] * 0.28));
  P[T.TERRA_COL + i] = (t) => { for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) t.set(x, y, t.vary(col, 0.05)); for (let k = 0; k < 6; k++) t.set(Math.floor(t.r() * 16), Math.floor(t.r() * 16), shade(col, 0.88)); };
  // glazed: shiny, with a pattern that makes a bigger one when tiles are laid together
  const hi = c.rgb.map((v) => Math.min(255, v + 70)), lo = shade(c.rgb, 0.7);
  P[T.GLAZED + i] = (t) => {
    for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) {
      const d = Math.abs(x - 7.5) + Math.abs(y - 7.5), corner = Math.min(x, 15 - x) + Math.min(y, 15 - y);
      t.set(x, y, t.vary(d < 3 ? [240, 236, 220] : d < 5 ? lo : corner < 4 ? hi : (x + y) % 6 === 0 ? lo : c.rgb, 0.03));
    }
    for (const [x, y] of [[3, 2], [4, 2], [2, 3]]) t.set(x, y, [255, 255, 255]); // the shine
  };
});
P[T.ROOF_TILES] = (t) => {
  for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) {
    const row = y >> 2, off = row % 2 ? 2 : 0, u = (x + off) % 4, v = y % 4;
    const edge = v === 3 || (v >= 2 && (u === 0 || u === 3));
    t.set(x, y, t.vary(edge ? [120, 58, 38] : v === 0 ? [196, 104, 66] : [170, 84, 52], 0.05));
  }
};
P[T.URN] = (t) => { for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) t.set(x, y, t.vary(y === 4 || y === 5 || y === 11 ? [40, 30, 26] : y === 8 && x % 4 < 2 ? [40, 30, 26] : TERRA, 0.05)); };
P[T.ROPE] = (t) => { for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) t.set(x, y, t.vary((x + y) % 4 < 2 ? [196, 170, 120] : [160, 134, 90], 0.05)); };
ITEM_PAINTERS[UNFIRED_URN] = (ctx) => {
  const c = [150, 156, 170], d = [120, 126, 140];
  rect(ctx, 5, 13, 6, 1, d); rect(ctx, 3, 6, 10, 7, c); rect(ctx, 4, 5, 8, 1, c); rect(ctx, 6, 3, 4, 2, c); rect(ctx, 5, 2, 6, 1, d); rect(ctx, 11, 7, 2, 5, d);
};

// v27 E: lock gates: heavy planks, cross-braced, with iron straps
P[T.LOCK_GATE] = (t) => {
  for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) {
    const strap = y === 2 || y === 13, brace = Math.abs(x - y) <= 0 || Math.abs(x - (15 - y)) <= 0;
    t.set(x, y, strap ? t.vary([80, 80, 86], 0.06) : brace ? t.vary([110, 76, 44], 0.06) : t.vary(x % 4 === 3 ? [118, 86, 52] : [140, 102, 62], 0.06));
  }
  for (const x of [1, 14]) for (const y of [2, 13]) t.set(x, y, [170, 170, 176]);
};
P[T.LOCK_GATE_TOP] = (t) => { for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) t.set(x, y, t.vary(y % 4 === 3 ? [118, 86, 52] : [150, 110, 68], 0.06)); };

// v27 F: dripstone (banded tan and grey), and a lamp of glowing beetle shells
P[T.DRIPSTONE] = (t) => { for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) t.set(x, y, t.vary((y + (x % 3 === 0 ? 1 : 0)) % 5 < 2 ? [150, 126, 104] : [176, 152, 126], 0.06)); };
P[T.BEETLE_LAMP] = (t) => {
  for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) {
    const edge = x === 0 || y === 0 || x === 15 || y === 15, d = Math.hypot(x - 7.5, y - 7.5);
    t.set(x, y, edge ? [60, 70, 60] : t.vary([Math.max(40, 120 - d * 8), Math.min(255, 255 - d * 9), Math.max(60, 170 - d * 8)], 0.05));
  }
  for (const [x, y] of [[4, 4], [10, 5], [6, 10], [11, 11]]) { t.set(x, y, [40, 60, 40]); t.set(x + 1, y, [40, 60, 40]); }
};
ITEM_PAINTERS[GLOW_SHELL] = (ctx) => { blob(ctx, 8, 8.5, 5, 6, [90, 220, 140], [50, 160, 100]); rect(ctx, 8, 3, 1, 11, [40, 110, 70]); px(ctx, 6, 5, [210, 255, 220]); };

// v28 A: the ore washer (iron-bound planks with a sluice at the front and a wet trough on top), the sieve's
// mesh, rough slag bricks, and the dusts and leftovers
P[T.WASHER_SIDE] = (t) => {
  for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) t.set(x, y, t.vary(y % 5 === 4 ? [104, 74, 44] : [138, 100, 60], 0.06));
  for (let x = 0; x < TILE; x++) for (const y of [1, 14]) t.set(x, y, t.vary([110, 112, 120], 0.05));
  for (const y of [1, 14]) for (const x of [2, 8, 13]) t.set(x, y, [70, 70, 76]);
};
P[T.WASHER_TOP] = (t) => {
  for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) {
    const edge = x < 2 || x > 13 || y < 2 || y > 13;
    t.set(x, y, edge ? t.vary([110, 112, 120], 0.05) : t.vary((x + y * 3) % 7 === 0 ? [150, 200, 230] : [60, 110, 170], 0.08));
  }
};
P[T.WASHER_FRONT] = (t) => {
  P[T.WASHER_SIDE](t);
  for (let y = 4; y < 12; y++) for (let x = 4; x < 12; x++) t.set(x, y, y === 4 || x === 4 || x === 11 ? [80, 80, 86] : t.vary(y > 8 ? [150, 130, 100] : [70, 120, 180], 0.08));
};
P[T.SIEVE] = (t) => { for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) t.set(x, y, x % 3 === 0 || y % 3 === 0 ? t.vary([170, 150, 110], 0.06) : [40, 34, 28]); };
P[T.SLAG_BRICKS] = (t) => {
  bricks(t, [74, 72, 76], [40, 38, 40]);
  for (let k = 0; k < 14; k++) t.set(Math.floor(t.r() * 16), Math.floor(t.r() * 16), t.r() < 0.5 ? [120, 92, 70] : [104, 110, 124]);
};
for (const o of ORES) if (o.ingot) {
  const c = shade(METAL_COLORS[o.ingot] ?? [150, 150, 150], 0.85), mud = [104, 84, 62];
  ITEM_PAINTERS[dirtyDust(o.id)] = (ctx) => {
    dustPainter(c)(ctx);
    for (const [x, y] of [[6, 9], [9, 11], [7, 13], [10, 8], [5, 12], [8, 10], [11, 13], [4, 14]]) px(ctx, x, y, mud);
  };
}
ITEM_PAINTERS[SLUDGE] = (ctx) => { blob(ctx, 8, 10.5, 6, 4, [96, 90, 76], [70, 64, 54]); px(ctx, 6, 9, [140, 150, 160]); px(ctx, 10, 10, [140, 150, 160]); };
ITEM_PAINTERS[SLAG] = (ctx) => {
  blob(ctx, 8, 9, 5.5, 4.5, [70, 68, 74], [44, 42, 46]);
  for (const [x, y] of [[6, 8], [9, 7], [10, 10], [7, 11]]) px(ctx, x, y, [130, 96, 70]);
  px(ctx, 5, 7, [150, 160, 176]);
};
ITEM_PAINTERS[WORM] = (ctx) => {
  const c = [214, 120, 130], d = [170, 84, 96];
  for (const [x, y] of [[3, 11], [4, 10], [5, 10], [6, 11], [7, 12], [8, 12], [9, 11], [10, 10], [11, 9], [12, 9], [13, 10]]) { px(ctx, x, y, c); px(ctx, x, y + 1, d); }
  px(ctx, 13, 9, [120, 60, 70]);
};

// v28 B: a heap of charcoal: black lumps with a dull sheen, and the grain of the wood still in some
P[T.CHARCOAL_HEAP] = (t) => {
  for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) {
    const lump = ((x >> 2) + (y >> 2) * 3) % 4, edge = x % 4 === 3 || y % 4 === 3;
    t.set(x, y, t.vary(edge ? [18, 16, 16] : lump === 0 ? [58, 56, 60] : lump === 1 ? [44, 40, 40] : [34, 32, 34], 0.1));
  }
  for (let k = 0; k < 8; k++) t.set(Math.floor(t.r() * 16), Math.floor(t.r() * 16), [96, 96, 104]);
};

// v28 C: upgrade cards: a metal plate with a coloured emblem (a double arrow, a flame, a plus)
function upgradePainter(plate, mark, draw) {
  return (ctx) => {
    rect(ctx, 2, 3, 12, 10, shade(plate, 0.7)); rect(ctx, 3, 4, 10, 8, plate);
    for (const [x, y] of [[3, 4], [12, 4], [3, 11], [12, 11]]) px(ctx, x, y, shade(plate, 0.55));
    draw(ctx, mark);
  };
}
ITEM_PAINTERS[SPEED_UPGRADE] = upgradePainter([176, 180, 190], [60, 200, 255], (ctx, c) => {
  for (const o of [0, 4]) for (let k = 0; k < 3; k++) { px(ctx, 5 + o + k, 6 + k, c); px(ctx, 5 + o + k, 10 - k, c); }
});
ITEM_PAINTERS[EFFICIENCY_UPGRADE] = upgradePainter([196, 160, 120], [255, 140, 40], (ctx, c) => {
  rect(ctx, 7, 6, 2, 5, c); rect(ctx, 6, 8, 4, 3, c); px(ctx, 8, 5, c); px(ctx, 7, 9, [255, 230, 120]); px(ctx, 8, 10, [255, 230, 120]);
});
ITEM_PAINTERS[YIELD_UPGRADE] = upgradePainter([214, 214, 220], [90, 210, 90], (ctx, c) => { rect(ctx, 7, 5, 2, 6, c); rect(ctx, 5, 7, 6, 2, c); });
// v28 D: horse gear and honey varieties
ITEM_PAINTERS[SADDLEBAGS] = (ctx) => {
  for (const x0 of [1, 9]) { rect(ctx, x0, 6, 6, 7, [138, 84, 44]); rect(ctx, x0, 6, 6, 2, [168, 108, 58]); px(ctx, x0 + 3, 9, [220, 190, 80]); }
  rect(ctx, 6, 4, 4, 2, [110, 64, 32]); // the strap joining them
};
ITEM_PAINTERS[HORSE_ARMOUR] = (ctx) => {
  rect(ctx, 2, 5, 12, 6, [196, 198, 206]); rect(ctx, 2, 5, 12, 1, [230, 232, 238]);
  for (let x = 3; x < 14; x += 2) for (let y = 7; y < 11; y += 2) px(ctx, x, y, [150, 152, 162]); // mail
  rect(ctx, 12, 2, 3, 4, [210, 212, 220]); rect(ctx, 2, 11, 12, 1, [122, 60, 28]); // head plate, leather trim
};
ITEM_PAINTERS[LAVENDER_HONEY] = bottlePainter([196, 150, 210]);
ITEM_PAINTERS[BLOSSOM_HONEY] = bottlePainter([244, 170, 150]);
ITEM_PAINTERS[GOLDEN_HONEY] = bottlePainter([255, 210, 40]);
ITEM_PAINTERS[LAVENDER_TEA] = bottlePainter([150, 110, 200]);
ITEM_PAINTERS[BLOSSOM_TEA] = bottlePainter([236, 130, 150]);
ITEM_PAINTERS[GOLDEN_TEA] = bottlePainter([250, 190, 20]);
// v28 E: fine crops are the plain ones with a golden sparkle
for (const [id, fine] of Object.entries(FINE_CROPS)) {
  const base = ITEM_PAINTERS[id];
  ITEM_PAINTERS[fine] = (ctx) => {
    base?.(ctx);
    for (const [x, y] of [[13, 1], [1, 12], [14, 13]]) { px(ctx, x, y, [255, 236, 120]); px(ctx, x - 1, y, [255, 200, 60]); px(ctx, x + 1, y, [255, 200, 60]); px(ctx, x, y - 1, [255, 200, 60]); px(ctx, x, y + 1, [255, 200, 60]); }
  };
}
ITEM_PAINTERS[CHEST_BOAT] = (ctx) => {
  ITEM_PAINTERS[BOAT](ctx);
  rect(ctx, 9, 3, 5, 5, [154, 106, 52]); rect(ctx, 9, 3, 5, 1, [110, 70, 34]); px(ctx, 11, 5, [210, 210, 216]); // the chest
};
// v29 C: logistics pipes
const LP_COLOURS = [[170, 170, 160], [70, 130, 220], [80, 180, 90], [160, 90, 200], [220, 110, 60], [235, 200, 60]]; // basic, provider, crafting, supplier, sink, extractor
P[T.LP_ARM] = (t) => {
  // A clear glass tube in a gold frame. An arm's faces take the part of this tile at their place in the block:
  // across the tube that's pixels 5.5 to 10.5, so pixels 5-6 and 9-10 there are its four long edges.
  const edge = (c) => c === 5 || c === 6 || c === 9 || c === 10, inside = (c) => c >= 5 && c <= 10;
  for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) {
    const along = !inside(x) ? x : !inside(y) ? y : -1; // the pixel's place along the tube (-1 on an end face)
    const frame = along < 0 ? edge(x) || edge(y) : along === x ? edge(y) : edge(x);
    const collar = along === 0 || along === 15 || along === 4 || along === 11;
    if (frame) t.set(x, y, t.vary([214, 176, 70], 0.05));
    else if (collar) t.set(x, y, [190, 150, 60]);
    else t.set(x, y, [200, 230, 240], 0.25);
  }
};
LP_COLOURS.forEach((c, i) => {
  P[T.LP_CORE + i] = (t) => {
    for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) {
      const edge = x < 2 || x > 13 || y < 2 || y > 13, inner = x > 4 && x < 11 && y > 4 && y < 11;
      t.set(x, y, edge ? t.vary([214, 176, 70], 0.06) : inner ? t.vary(c.map((v) => Math.min(255, v + 40)), 0.05) : t.vary(c, 0.05));
    }
  };
});
P[T.LP_TABLE_TOP] = (t) => {
  for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) {
    const screen = x > 2 && x < 13 && y > 2 && y < 11, key = y > 11 && y < 14 && x > 2 && x < 13 && x % 2;
    t.set(x, y, screen ? (y % 3 === 0 ? [90, 200, 230] : [30, 60, 90]) : key ? [220, 220, 210] : t.vary([150, 104, 60], 0.08));
  }
};
P[T.LP_TABLE_SIDE] = (t) => {
  for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) t.set(x, y, y < 2 ? [214, 176, 70] : y % 5 === 4 ? [110, 74, 40] : t.vary([150, 104, 60], 0.08));
};
P[T.LP_JUNCTION] = (t) => {
  for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) {
    const edge = x < 1 || x > 14 || y < 1 || y > 14, bolt = Math.abs(x - 8 + (y < 8 ? (8 - y) * 0.5 : (8 - y) * 0.5)) < 1.2 && y > 2 && y < 13;
    t.set(x, y, edge ? [214, 176, 70] : bolt ? [255, 230, 80] : t.vary([60, 64, 74], 0.08));
  }
};
LP_ROLES.forEach((role, i) => {
  ITEM_PAINTERS[LP_PIPE + i] = (ctx) => {
    rect(ctx, 0, 5, 16, 6, [200, 230, 240]); rect(ctx, 0, 5, 16, 1, [214, 176, 70]); rect(ctx, 0, 10, 16, 1, [214, 176, 70]);
    rect(ctx, 4, 3, 8, 10, [214, 176, 70]); rect(ctx, 5, 4, 6, 8, LP_COLOURS[i]);
  };
});
// v30: stock sensor, liquid pipes and drone pads
const lpCore = (c, mark) => (t) => {
  for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) {
    const edge = x < 2 || x > 13 || y < 2 || y > 13;
    t.set(x, y, edge ? t.vary([214, 176, 70], 0.06) : mark(x, y) ? mark(x, y) : t.vary(c, 0.05));
  }
};
// the sensor: a dark core with an eye (lit while it signals)
P[T.LP_SENSOR_CORE] = lpCore([70, 74, 86], (x, y) => (Math.hypot(x - 7.5, y - 7.5) < 2.6 ? [120, 40, 40] : null));
P[T.LP_SENSOR_ON] = lpCore([70, 74, 86], (x, y) => (Math.hypot(x - 7.5, y - 7.5) < 2.6 ? [255, 90, 70] : Math.hypot(x - 7.5, y - 7.5) < 3.6 ? [190, 70, 60] : null));
// the liquid pipes: a drop on teal (provider) or deep blue (supplier)
const drop = (x, y) => (Math.hypot(x - 7.5, y - 8.5) < 2.6 || (y >= 4 && y < 7 && Math.abs(x - 7.5) < (y - 3) * 0.7) ? [210, 240, 255] : null);
P[T.LP_FPROVIDER] = lpCore([40, 170, 170], drop);
P[T.LP_FSUPPLIER] = lpCore([40, 80, 190], drop);
P[T.LP_FSINK] = lpCore([120, 70, 170], drop);
P[T.BOTTLER_SIDE] = (t) => {
  for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) {
    const edge = x < 1 || x > 14 || y < 1 || y > 14, glass = x > 3 && x < 12 && y > 2 && y < 10, level = glass && y > 6;
    const bucket = y > 10 && y < 14 && ((x > 2 && x < 6) || (x > 9 && x < 13));
    t.set(x, y, edge ? [150, 154, 162] : level ? [70, 130, 220] : glass ? [200, 230, 240] : bucket ? [190, 194, 200] : t.vary([112, 116, 124], 0.06));
  }
};
P[T.BOTTLER_TOP] = (t) => {
  for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) {
    const edge = x < 1 || x > 14 || y < 1 || y > 14, port = Math.hypot(x - 7.5, y - 7.5) < 3;
    t.set(x, y, edge ? [150, 154, 162] : port ? (Math.hypot(x - 7.5, y - 7.5) < 2 ? [40, 44, 50] : [214, 176, 70]) : t.vary([112, 116, 124], 0.06));
  }
};
P[T.DRONE_PAD_TOP] = (t) => {
  for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) {
    const edge = x < 1 || x > 14 || y < 1 || y > 14, ring = Math.abs(Math.hypot(x - 7.5, y - 7.5) - 5.5) < 0.8;
    const h = (x === 5 || x === 10) && y > 4 && y < 11 || y === 7 && x > 5 && x < 10;
    const stripe = (x + y) % 4 < 2 && (x < 2 || x > 13 || y < 2 || y > 13);
    t.set(x, y, edge ? (stripe ? [40, 40, 40] : [235, 190, 40]) : h ? [240, 240, 240] : ring ? [235, 190, 40] : t.vary([70, 76, 84], 0.06));
  }
};
P[T.DRONE_PAD_SIDE] = (t) => {
  for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) t.set(x, y, y < 1 ? [235, 190, 40] : (x % 8 === 3 && y > 13) ? [127, 232, 255] : t.vary([90, 96, 104], 0.06));
};
const lpIconOf = (core, mark) => (ctx) => {
  rect(ctx, 0, 5, 16, 6, [200, 230, 240]); rect(ctx, 0, 5, 16, 1, [214, 176, 70]); rect(ctx, 0, 10, 16, 1, [214, 176, 70]);
  rect(ctx, 4, 3, 8, 10, [214, 176, 70]); rect(ctx, 5, 4, 6, 8, core); mark?.(ctx);
};
ITEM_PAINTERS[LP_SENSOR] = lpIconOf([70, 74, 86], (ctx) => rect(ctx, 7, 7, 2, 2, [255, 90, 70]));
ITEM_PAINTERS[LP_FPROVIDER] = lpIconOf([40, 170, 170], (ctx) => { rect(ctx, 7, 6, 2, 1, [210, 240, 255]); rect(ctx, 6, 7, 4, 3, [210, 240, 255]); });
ITEM_PAINTERS[LP_FSUPPLIER] = lpIconOf([40, 80, 190], (ctx) => { rect(ctx, 7, 6, 2, 1, [210, 240, 255]); rect(ctx, 6, 7, 4, 3, [210, 240, 255]); });
ITEM_PAINTERS[LP_FSINK] = lpIconOf([120, 70, 170], (ctx) => { rect(ctx, 7, 6, 2, 1, [210, 240, 255]); rect(ctx, 6, 7, 4, 3, [210, 240, 255]); });
ITEM_PAINTERS[REMOTE_ORDERER] = (ctx) => {
  rect(ctx, 4, 2, 8, 12, [60, 64, 74]); rect(ctx, 5, 3, 6, 5, [90, 200, 230]); rect(ctx, 5, 9, 2, 1, [214, 176, 70]); rect(ctx, 9, 9, 2, 1, [214, 176, 70]); rect(ctx, 5, 11, 6, 1, [214, 176, 70]); rect(ctx, 7, 0, 1, 2, [180, 180, 190]);
};

// ---------- v31: bees, combs and honey products ----------
import {
  BEE_SPECIES, princessOf, droneOf, COMBS, COMB_NAMES, BEE_SCOOP, WOODEN_FRAME, WAXED_FRAME, PROVEN_FRAME, HONEY_DROP, PROPOLIS, POLLEN,
  ROYAL_JELLY, HONEY_MUST, MEAD, FINE_MEAD, HONEY_CAKE, HONEYED_APPLE,
} from './blocks.js';
// a bee house: a little wooden hut on legs, with a pitched roof and a round entrance
const beeHouseSide = (t) => {
  for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) {
    const board = y % 4 === 3, roof = y < 2;
    t.set(x, y, roof ? t.vary([150, 60, 40], 0.06) : board ? [150, 106, 56] : t.vary([214, 168, 96], 0.05));
  }
  for (let y = 2; y < TILE; y++) { t.set(0, y, [120, 84, 44]); t.set(15, y, [120, 84, 44]); }
};
P[T.BEEHOUSE_SIDE] = beeHouseSide;
P[T.BEEHOUSE_TOP] = (t) => {
  for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) t.set(x, y, (x + (y >> 1) % 2 * 2) % 4 === 0 ? [120, 44, 30] : t.vary([170, 70, 46], 0.06));
};
P[T.BEEHOUSE_FRONT] = (t) => {
  beeHouseSide(t);
  for (let y = 5; y < 12; y++) for (let x = 4; x < 12; x++) if (Math.hypot(x - 7.5, y - 8) < 2.6) t.set(x, y, [40, 26, 12]);
  for (let x = 3; x < 13; x++) t.set(x, 11, [120, 84, 44]); // the landing board
  for (const [x, y] of [[4, 4], [11, 6], [9, 13]]) { t.set(x, y, [240, 190, 40]); t.set(x + 1, y, [30, 24, 10]); }
};
// the comb centrifuge: an iron drum with a window onto the honey whirling round, and a crank gear on top
P[T.COMB_SPIN_SIDE] = (t) => {
  for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) {
    const edge = x < 1 || x > 14 || y < 1 || y > 14, band = y === 3 || y === 12;
    const win = Math.hypot(x - 7.5, y - 7.5) < 3.4, swirl = win && (Math.atan2(y - 7.5, x - 7.5) * 2 + Math.hypot(x - 7.5, y - 7.5)) % 2 < 1;
    t.set(x, y, edge ? [150, 154, 162] : win ? (swirl ? [250, 196, 60] : [214, 150, 30]) : band ? [96, 100, 108] : t.vary([128, 132, 140], 0.05));
  }
};
P[T.COMB_SPIN_TOP] = (t) => {
  for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) {
    const r = Math.hypot(x - 7.5, y - 7.5), ang = Math.atan2(y - 7.5, x - 7.5);
    const gear = r < 5 + (Math.cos(ang * 8) > 0 ? 1 : 0);
    t.set(x, y, r < 1.5 ? [60, 60, 66] : gear ? [176, 132, 70] : t.vary([128, 132, 140], 0.05));
  }
};
// a bee: a princess wears a little gold crown, a drone is plainer and rounder
const beePainter = (col, princess) => (ctx) => {
  const dark = [40, 30, 20];
  for (let y = 5; y < 13; y++) for (let x = 3; x < 13; x++) {
    const d = Math.hypot((x - 8) / (princess ? 5 : 4.4), (y - 9) / 3.6);
    if (d >= 1) continue;
    px(ctx, x, y, x === 6 || x === 9 ? dark : x > 11 ? shade(col, 0.6) : y < 7 ? shade(col, 1.2) : col);
  }
  for (let y = 3; y < 7; y++) for (let x = 5; x < 11; x++) if (Math.hypot(x - (x < 8 ? 6 : 9.5), y - 5) < 1.7) px(ctx, x, y, [220, 236, 250]); // wings
  px(ctx, 3, 9, dark); px(ctx, 2, 8, dark); // head and feeler
  if (princess) for (const [x, y] of [[11, 3], [12, 2], [13, 3]]) px(ctx, x, y, [250, 210, 60]);
};
BEE_SPECIES.forEach((s, i) => { ITEM_PAINTERS[princessOf(i)] = beePainter(s.col, true); ITEM_PAINTERS[droneOf(i)] = beePainter(shade(s.col, 0.85), false); });
const COMB_COLS = [[190, 226, 240], [210, 190, 140], [230, 150, 210], [250, 180, 190], [150, 150, 160], [220, 90, 40], [180, 120, 220], [140, 240, 170], [200, 170, 250], [250, 214, 80], [80, 90, 170]];
const combPainter = (c) => (ctx) => {
  for (let y = 3; y < 14; y++) for (let x = 2; x < 14; x++) {
    const cell = ((x + (Math.floor(y / 3) % 2) * 2) % 4 === 0) || y % 3 === 0;
    px(ctx, x, y, cell ? shade(c, 0.7) : c);
  }
};
COMB_NAMES.forEach((_, i) => { ITEM_PAINTERS[COMBS + i] = combPainter(COMB_COLS[i]); });
ITEM_PAINTERS[BEE_SCOOP] = (ctx) => {
  drawHandle(ctx, 2, 8);
  for (let y = 1; y < 8; y++) for (let x = 8; x < 15; x++) {
    const d = Math.hypot(x - 11.5, y - 4.5);
    if (d < 3.6) px(ctx, x, y, d > 2.8 ? [150, 110, 60] : (x + y) % 2 ? [236, 232, 220] : [200, 196, 186]);
  }
};
const framePainter = (wood, fill) => (ctx) => {
  rect(ctx, 2, 2, 12, 12, wood); rect(ctx, 4, 4, 8, 8, fill);
  for (let y = 4; y < 12; y++) for (let x = 4; x < 12; x++) if (((x + (Math.floor(y / 2) % 2)) % 3 === 0)) px(ctx, x, y, shade(fill, 0.8));
};
ITEM_PAINTERS[WOODEN_FRAME] = framePainter([170, 120, 64], [230, 220, 196]);
ITEM_PAINTERS[WAXED_FRAME] = framePainter([170, 120, 64], [246, 206, 96]);
ITEM_PAINTERS[PROVEN_FRAME] = framePainter([110, 60, 36], [240, 180, 60]);
ITEM_PAINTERS[HONEY_DROP] = (ctx) => {
  for (let y = 2; y < 14; y++) for (let x = 3; x < 13; x++) {
    const w = y < 8 ? (y - 2) * 0.6 : Math.sqrt(Math.max(0, 16 - (y - 9.5) ** 2)) * 1.1;
    if (Math.abs(x - 7.5) <= w) px(ctx, x, y, x < 7 && y < 10 ? [255, 214, 100] : y > 11 ? [196, 120, 20] : [240, 166, 30]);
  }
};
ITEM_PAINTERS[PROPOLIS] = (ctx) => { for (let y = 5; y < 13; y++) for (let x = 3; x < 13; x++) if (Math.hypot(x - 8, (y - 9) * 1.3) < 5 - ((x * 3 + y) % 4 === 0 ? 1 : 0)) px(ctx, x, y, y < 8 ? [150, 96, 40] : [110, 66, 28]); };
ITEM_PAINTERS[POLLEN] = (ctx) => { for (let y = 6; y < 14; y++) for (let x = 2; x < 14; x++) if (Math.abs(x - 8) < (y - 5) * 0.8 && (x * 7 + y * 5) % 3) px(ctx, x, y, (x + y) % 4 ? [246, 214, 60] : [226, 170, 30]); };
ITEM_PAINTERS[ROYAL_JELLY] = (ctx) => {
  rect(ctx, 4, 6, 8, 8, [214, 232, 240]); rect(ctx, 5, 8, 6, 5, [250, 244, 220]); rect(ctx, 4, 4, 8, 2, [150, 70, 180]); px(ctx, 6, 9, [255, 255, 255]);
};
ITEM_PAINTERS[HONEY_MUST] = bottlePainter([236, 214, 140]);
ITEM_PAINTERS[MEAD] = bottlePainter([226, 160, 40]);
ITEM_PAINTERS[FINE_MEAD] = bottlePainter([190, 110, 30]);
ITEM_PAINTERS[HONEY_CAKE] = (ctx) => {
  for (let y = 6; y < 14; y++) for (let x = 2; x < 14; x++) px(ctx, x, y, y < 8 ? [240, 176, 40] : y === 10 ? [246, 214, 120] : [200, 140, 70]);
  for (const x of [4, 8, 11]) px(ctx, x, 8, [240, 176, 40]);
};
ITEM_PAINTERS[HONEYED_APPLE] = (ctx) => {
  for (let y = 4; y < 14; y++) for (let x = 3; x < 13; x++) if (Math.hypot(x - 8, y - 9) < 4.8) px(ctx, x, y, y > 10 ? [200, 130, 30] : x < 7 ? [226, 70, 50] : [190, 40, 34]);
  rect(ctx, 8, 2, 1, 3, [100, 70, 40]); px(ctx, 6, 7, [255, 220, 140]);
};

// ---------- v32: rubber and polymers ----------
import { LATEX, RUBBER, HIDE_GLUE, POLYMER_PELLETS, POLYMER_SHEET } from './blocks.js';
// a tree tap's little bucket: staves with an iron hoop; and the latex in it
P[T.TAP_SIDE] = (t) => {
  for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) {
    const hoop = y === 4 || y === 11, stave = x % 4 === 0;
    t.set(x, y, hoop ? [120, 124, 132] : stave ? [118, 82, 44] : t.vary([170, 122, 70], 0.06));
  }
};
P[T.TAP_LATEX] = (t) => { for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) t.set(x, y, t.vary([240, 236, 220], 0.03)); };
// the polymer press: a heavy steel frame with a ram, and a hopper on top
P[T.PRESS_SIDE] = (t) => {
  for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) {
    const frame = x < 2 || x > 13 || y < 2 || y > 13, ram = x >= 5 && x <= 10 && y >= 3 && y <= 8, platen = y === 9 || y === 10;
    t.set(x, y, frame ? [92, 96, 104] : ram ? [176, 180, 188] : platen ? [70, 150, 200] : t.vary([128, 132, 140], 0.05));
  }
};
P[T.PRESS_TOP] = (t) => {
  for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) {
    const d = Math.max(Math.abs(x - 7.5), Math.abs(y - 7.5));
    t.set(x, y, d < 2 ? [40, 40, 46] : d < 5 ? [150, 154, 162] : d > 6.5 ? [92, 96, 104] : t.vary([128, 132, 140], 0.05));
  }
};
// insulated wire: black rubber sheathing, with a gleam of the electrum where it's carrying a signal
P[T.INSWIRE_OFF] = (t) => { for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) t.set(x, y, t.vary((x + y) % 5 ? [40, 40, 44] : [70, 70, 76], 0.06)); };
P[T.INSWIRE_ON] = (t) => { for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) t.set(x, y, t.vary((x + y) % 5 ? [40, 40, 44] : [255, 226, 90], 0.05)); };
ITEM_PAINTERS[LATEX] = (ctx) => {
  for (let y = 3; y < 14; y++) for (let x = 3; x < 13; x++) {
    const r = Math.hypot((x - 7.5) / 4.5, (y - 9.5) / 4.2), tip = y < 8 && Math.abs(x - 7.5) < (y - 2) * 0.7;
    if (r < 1 || tip) px(ctx, x, y, x > 9 ? [214, 210, 196] : x < 6 && y < 10 ? [255, 255, 250] : [240, 236, 220]);
  }
};
ITEM_PAINTERS[RUBBER] = (ctx) => {
  for (let y = 4; y < 13; y++) for (let x = 3; x < 13; x++) {
    if (Math.hypot((x - 7.5) / 5, (y - 8.5) / 4.3) >= 1) continue;
    px(ctx, x, y, y < 7 ? [80, 72, 66] : x > 10 ? [30, 26, 24] : [52, 46, 42]);
  }
};
ITEM_PAINTERS[HIDE_GLUE] = (ctx) => {
  for (let y = 5; y < 14; y++) for (let x = 4; x < 12; x++) px(ctx, x, y, x === 4 || x === 11 || y === 13 ? [150, 110, 60] : y < 8 ? [230, 190, 110] : [206, 160, 80]);
  for (let x = 5; x < 11; x++) px(ctx, x, 4, [120, 84, 44]);
};
ITEM_PAINTERS[POLYMER_PELLETS] = (ctx) => {
  for (const [cx, cy] of [[5, 6], [10, 5], [7, 10], [11, 11], [4, 12], [9, 8]]) {
    for (let y = cy - 1; y <= cy + 1; y++) for (let x = cx - 1; x <= cx + 1; x++) if (Math.abs(x - cx) + Math.abs(y - cy) < 2) px(ctx, x, y, x < cx || y < cy ? [226, 238, 246] : [176, 200, 220]);
  }
};
ITEM_PAINTERS[POLYMER_SHEET] = (ctx) => {
  for (let y = 4; y < 13; y++) for (let x = 2; x < 14; x++) {
    const sx = x - (12 - y) * 0.3;
    if (sx < 2 || sx > 13) continue;
    px(ctx, x, y, y === 4 || x === 13 ? [150, 176, 200] : (x + y) % 7 === 0 ? [250, 252, 255] : [210, 226, 240]);
  }
};

// ---------- v32 B: polymer blocks and gear ----------
import { POLYMER_BOAT, PADDED_BOOTS, polymerTool } from './blocks.js';
// a bounce pad: a taut black rubber skin with a pale target, over a plank frame
P[T.BOUNCE_TOP] = (t) => {
  for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) {
    const d = Math.hypot(x - 7.5, y - 7.5), rim = x < 1 || x > 14 || y < 1 || y > 14;
    t.set(x, y, rim ? [150, 110, 64] : d > 2.5 && d < 3.8 ? [230, 200, 70] : d < 1.5 ? [230, 200, 70] : t.vary([46, 44, 48], 0.05));
  }
};
P[T.BOUNCE_SIDE] = (t) => {
  for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) t.set(x, y, y < 3 ? t.vary([46, 44, 48], 0.05) : y === 8 && x % 5 === 2 ? [190, 190, 196] : t.vary([170, 122, 70], 0.06));
};
// polymer: flat, smooth colour with a soft sheen along one edge
COLORS.forEach((c, i) => {
  const hi = c.rgb.map((v) => Math.min(255, v + 40));
  P[T.POLY_COL + i] = (t) => { for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) t.set(x, y, x + y < 5 ? hi : x === 15 || y === 15 ? shade(c.rgb, 0.82) : t.vary(c.rgb, 0.015)); };
});
// a lumen panel: clear, with a glowing grid
P[T.LUMEN] = (t) => {
  for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) {
    const edge = x === 0 || y === 0 || x === 15 || y === 15, grid = x % 5 === 0 || y % 5 === 0;
    if (edge) t.set(x, y, [236, 246, 255]); else if (grid) t.set(x, y, [200, 236, 255], 200); else t.set(x, y, [210, 240, 255], 70);
  }
};
MAT.polymer = [[236, 240, 244], [150, 170, 190]];
for (const kind of ['pick', 'axe', 'shovel']) ITEM_PAINTERS[polymerTool(kind)] = toolPainter(kind, 'polymer');
ITEM_PAINTERS[polymerTool('sword')] = swordPainter('polymer');
ITEM_PAINTERS[POLYMER_BOAT] = (ctx) => {
  rect(ctx, 1, 8, 14, 3, [232, 236, 240]); rect(ctx, 3, 11, 10, 2, [200, 206, 214]); rect(ctx, 0, 6, 2, 3, [232, 236, 240]); rect(ctx, 14, 6, 2, 3, [232, 236, 240]);
  rect(ctx, 1, 9, 14, 1, [60, 120, 210]); for (let k = 0; k < 6; k++) px(ctx, 4 + k, 7 - (k >> 1), [106, 68, 38]);
};
ITEM_PAINTERS[PADDED_BOOTS] = (ctx) => {
  rect(ctx, 2, 3, 4, 8, [120, 84, 50]); rect(ctx, 10, 3, 4, 8, [120, 84, 50]);
  rect(ctx, 1, 10, 6, 3, [140, 100, 60]); rect(ctx, 9, 10, 6, 3, [140, 100, 60]);
  rect(ctx, 1, 13, 6, 2, [44, 42, 46]); rect(ctx, 9, 13, 6, 2, [44, 42, 46]);
};

// ---------- v32 C: demolition charges ----------
import { DETONATOR } from './blocks.js';
// a demolition charge: grey-wrapped blocks of explosive strapped in a polymer case, with a receiver on top
P[T.DEMO_SIDE] = (t) => {
  for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) {
    const strap = y === 3 || y === 12, seam = x === 5 || x === 10;
    t.set(x, y, strap ? [60, 60, 66] : seam ? [150, 140, 110] : t.vary([196, 186, 150], 0.05));
  }
  for (let x = 6; x < 10; x++) for (let y = 6; y < 9; y++) t.set(x, y, [214, 60, 40]); // a warning label
};
const demoTop = (lit) => (t) => {
  for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) {
    const box = x >= 4 && x <= 11 && y >= 4 && y <= 11, led = x >= 7 && x <= 8 && y >= 7 && y <= 8;
    t.set(x, y, led ? (lit ? [255, 60, 40] : [90, 30, 26]) : box ? [52, 54, 60] : t.vary([196, 186, 150], 0.05));
  }
  for (let y = 1; y < 4; y++) t.set(12, y, [40, 40, 44]); // the aerial
};
P[T.DEMO_TOP] = demoTop(false);
P[T.DEMO_ARMED] = demoTop(true);
P[T.DETONATOR_TILE] = demoTop(true); // (unused on blocks; keeps the slot reserved)
ITEM_PAINTERS[DETONATOR] = (ctx) => {
  rect(ctx, 4, 5, 8, 10, [232, 236, 240]); rect(ctx, 4, 14, 8, 1, [170, 176, 184]);
  rect(ctx, 6, 7, 4, 3, [214, 50, 40]); rect(ctx, 7, 11, 2, 2, [60, 60, 66]);
  for (let y = 0; y < 5; y++) px(ctx, 10, y, [40, 40, 44]); px(ctx, 10, 0, [255, 80, 60]);
};

// ---------- v33: cocoa and chocolate ----------
import { COCOA_POD, COCOA_BEANS, ROASTED_COCOA, COCOA_POWDER, CHOC_MILK, HOT_CHOC, MELTED_CHOC, CHOC_BAR, CHOC_COOKIE, CHOC_CHERRIES } from './blocks.js';
const COCOA_GREEN = [44, 104, 50], POD = [[196, 120, 40], [232, 170, 60]], CHOC = [92, 52, 30], CHOC_HI = [140, 88, 52];
// broad, dark, glossy leaves; ripe ones have long ridged orange pods hanging among them
const cocoaLeaves = (t) => {
  for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) {
    if (t.r() < 0.16) t.set(x, y, [0, 0, 0], 0);
    else t.set(x, y, t.vary((x + 2 * y) % 7 === 0 ? shade(COCOA_GREEN, 1.3) : COCOA_GREEN, 0.22));
  }
};
P[T.COCOA_LEAVES] = cocoaLeaves;
P[T.COCOA_RIPE] = (t) => {
  cocoaLeaves(t);
  for (const [fx, fy] of [[3, 2], [11, 4], [6, 10]]) for (let dy = 0; dy < 4; dy++) for (let dx = 0; dx < 2; dx++) t.set(fx + dx, fy + dy, dx === 0 && dy < 3 ? POD[1] : POD[0]);
};
P[T.COCOA_SAPLING] = (t) => {
  for (let y = 8; y < TILE; y++) { t.set(7, y, t.vary([112, 80, 46], 0.1)); t.set(8, y, t.vary([88, 62, 34], 0.1)); }
  for (const [cx, cy, r] of [[8, 5, 3], [4, 9, 2], [12, 8, 2]]) for (let y = cy - r; y <= cy + r; y++) for (let x = cx - r; x <= cx + r; x++) {
    if ((x - cx) ** 2 + (y - cy) ** 2 > r * r + 1 || t.r() < 0.12) continue;
    t.set(x, y, t.vary(COCOA_GREEN, 0.25));
  }
  t.set(9, 8, POD[0]); t.set(9, 9, POD[0]);
};
// a tin mould, and chocolate (glossy when set, smooth and runny when poured)
P[T.MOULD] = (t) => { for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) t.set(x, y, t.vary(y === 0 || x === 0 ? [232, 236, 242] : [196, 200, 208], 0.03)); };
P[T.CHOC] = (t) => { for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) t.set(x, y, x % 4 === 0 || y % 4 === 0 ? shade(CHOC, 0.8) : (x + y) % 9 === 1 ? CHOC_HI : t.vary(CHOC, 0.03)); };
P[T.CHOC_LIQUID] = (t) => { for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) t.set(x, y, t.vary(Math.sin(x * 0.7 + y * 0.3) > 0.7 ? CHOC_HI : [110, 64, 36], 0.03)); };
// chocolate cake: dark frosting with cherries on top, sponge and cream layers on the side
P[T.CAKE_TOP] = (t) => {
  for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) t.set(x, y, t.vary(CHOC, 0.05));
  for (const [cx, cy] of [[4, 4], [11, 4], [4, 11], [11, 11], [8, 8]]) { t.set(cx, cy, [170, 20, 40]); t.set(cx + 1, cy, [170, 20, 40]); t.set(cx, cy - 1, [220, 80, 90]); }
};
P[T.CAKE_SIDE] = (t) => {
  for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) {
    const c = y < 4 ? CHOC : y === 8 ? [240, 226, 200] : [120, 72, 42];
    t.set(x, y, t.vary(c, 0.05));
  }
};
ITEM_PAINTERS[COCOA_POD] = (ctx) => {
  for (let y = 2; y < 15; y++) for (let x = 3; x < 13; x++) {
    if (Math.hypot((x - 7.5) / 4.5, (y - 8.5) / 6.5) >= 1) continue;
    px(ctx, x, y, x % 3 === 0 ? [170, 100, 30] : x < 7 ? POD[1] : POD[0]);
  }
  px(ctx, 7, 1, [90, 70, 30]); px(ctx, 8, 1, [90, 70, 30]);
};
const beans = (c, hi) => (ctx) => {
  for (const [cx, cy] of [[5, 5], [10, 6], [7, 10], [11, 11], [4, 11]]) for (let y = cy - 1; y <= cy + 1; y++) for (let x = cx - 2; x <= cx + 1; x++) {
    if (Math.abs(x - cx + 0.5) + Math.abs(y - cy) > 2.2) continue;
    px(ctx, x, y, y < cy ? hi : x === cx ? shade(c, 0.7) : c);
  }
};
ITEM_PAINTERS[COCOA_BEANS] = beans([150, 96, 70], [190, 140, 110]);
ITEM_PAINTERS[ROASTED_COCOA] = beans([84, 48, 28], [120, 76, 48]);
ITEM_PAINTERS[COCOA_POWDER] = (ctx) => {
  for (let y = 6; y < 14; y++) for (let x = 2; x < 14; x++) {
    if (Math.abs(x - 7.5) > (y - 5) * 0.9) continue;
    px(ctx, x, y, (x * 3 + y * 5) % 7 === 0 ? [140, 90, 60] : [110, 66, 40]);
  }
};
const bottleOf = (c, steam) => (ctx) => {
  rect(ctx, 6, 1, 4, 2, [150, 110, 70]); rect(ctx, 6, 3, 4, 2, [210, 230, 240]);
  for (let y = 5; y < 15; y++) for (let x = 4; x < 12; x++) px(ctx, x, y, x === 4 || x === 11 || y === 14 ? [200, 220, 232] : y < 7 ? [230, 240, 248] : x === 5 ? shade(c, 1.25) : c);
  if (steam) for (const [x, y] of [[2, 2], [2, 4], [13, 1], [13, 3]]) px(ctx, x, y, [240, 240, 240]);
};
ITEM_PAINTERS[CHOC_MILK] = bottleOf([176, 120, 80], false);
ITEM_PAINTERS[HOT_CHOC] = bottleOf([120, 70, 40], true);
ITEM_PAINTERS[MELTED_CHOC] = bottleOf([90, 50, 28], false);
ITEM_PAINTERS[CHOC_BAR] = (ctx) => {
  rect(ctx, 2, 3, 12, 10, CHOC);
  for (let y = 3; y < 13; y++) for (let x = 2; x < 14; x++) if ((x - 2) % 4 === 3 || (y - 3) % 5 === 4) px(ctx, x, y, shade(CHOC, 0.75)); else if ((x - 2) % 4 === 0 && (y - 3) % 5 === 0) px(ctx, x, y, CHOC_HI);
  rect(ctx, 2, 9, 12, 4, [200, 50, 40]); rect(ctx, 2, 10, 12, 1, [236, 200, 80]);
};
ITEM_PAINTERS[CHOC_COOKIE] = (ctx) => {
  for (let y = 2; y < 14; y++) for (let x = 2; x < 14; x++) {
    if (Math.hypot(x - 7.5, y - 7.5) >= 6) continue;
    px(ctx, x, y, (x * 7 + y * 3) % 11 === 0 ? [50, 26, 14] : [210, 160, 100]);
  }
};
ITEM_PAINTERS[CHOC_CHERRIES] = (ctx) => {
  for (const [cx, cy] of [[5, 10], [11, 10]]) {
    for (let y = cy - 3; y <= cy + 3; y++) for (let x = cx - 3; x <= cx + 3; x++) if (Math.hypot(x - cx, y - cy) < 3.2) px(ctx, x, y, y > cy ? [150, 20, 40] : CHOC);
    px(ctx, cx - 1, cy - 2, CHOC_HI);
  }
  for (let k = 0; k < 6; k++) { px(ctx, 5 + (k >> 1), 6 - k, [70, 90, 30]); px(ctx, 11 - (k >> 1), 6 - k, [70, 90, 30]); }
};

// ---------- v34 A: pork and chicken ----------
import { RAW_PORK, ROAST_PORK, RAW_CHICKEN, ROAST_CHICKEN, CHICKEN_SOUP, PORK_PIE, PORK_AND_BEANS } from './blocks.js';
const chop = (meat, fat, bone) => (ctx) => {
  for (let y = 3; y < 14; y++) for (let x = 2; x < 13; x++) {
    const d = Math.hypot((x - 7) / 5, (y - 8) / 4.6);
    if (d >= 1) continue;
    px(ctx, x, y, d > 0.8 ? fat : (x + y) % 5 === 0 ? shade(meat, 0.85) : meat);
  }
  rect(ctx, 12, 6, 3, 2, bone); px(ctx, 14, 5, bone); px(ctx, 14, 8, bone);
};
ITEM_PAINTERS[RAW_PORK] = chop([232, 140, 140], [250, 226, 220], [240, 236, 224]);
ITEM_PAINTERS[ROAST_PORK] = chop([176, 104, 60], [224, 176, 110], [236, 226, 206]);
const drumstick = (meat, hi) => (ctx) => {
  for (let y = 2; y < 12; y++) for (let x = 2; x < 12; x++) {
    if (Math.hypot(x - 6.5, y - 6.5) >= 4.8) continue;
    px(ctx, x, y, x + y < 11 ? hi : meat);
  }
  for (let k = 0; k < 4; k++) px(ctx, 10 + k, 10 + k, [240, 236, 224]);
  rect(ctx, 13, 12, 2, 2, [250, 248, 240]);
};
ITEM_PAINTERS[RAW_CHICKEN] = drumstick([236, 190, 170], [248, 214, 198]);
ITEM_PAINTERS[ROAST_CHICKEN] = drumstick([196, 120, 50], [228, 160, 80]);
const bowl = (soup, bits) => (ctx) => {
  for (let x = 1; x < 15; x++) px(ctx, x, 7, shade(soup, 1.1));
  for (let y = 7; y < 14; y++) for (let x = 1; x < 15; x++) if (Math.abs(x - 7.5) < 7 - (y - 7) * 0.7) px(ctx, x, y, y === 7 ? soup : [150, 106, 64]);
  for (const [x, c] of bits) px(ctx, x, 7, c);
};
ITEM_PAINTERS[CHICKEN_SOUP] = bowl([232, 200, 110], [[4, [236, 130, 40]], [7, [240, 230, 200]], [10, [120, 160, 60]]]);
ITEM_PAINTERS[PORK_AND_BEANS] = bowl([196, 70, 40], [[4, [176, 104, 60]], [6, [230, 120, 80]], [9, [176, 104, 60]], [11, [230, 120, 80]]]);
ITEM_PAINTERS[PORK_PIE] = (ctx) => {
  for (let y = 4; y < 14; y++) for (let x = 2; x < 14; x++) px(ctx, x, y, y < 6 ? [226, 170, 90] : y === 13 ? [150, 96, 44] : (x + y) % 4 === 0 ? [200, 140, 70] : [214, 156, 80]);
  for (let x = 3; x < 13; x += 2) px(ctx, x, 4, [240, 200, 120]);
};

// ---------- v34 B: dairy and preserving ----------
import { CREAM, CHOC_ICE_CREAM, CHERRY_ICE_CREAM, HONEY_ICE_CREAM, ICE_LOLLY, VINEGAR, PICKLES, FISH_AND_CHIPS, SMOKED_FISH, SMOKED_HAM, SMOKED_CHEESE, RAISINS, DRIED_FRUIT, JERKY, TRAIL_MIX } from './blocks.js';
// a drying rack's netting: loose string mesh (mostly see-through)
P[T.RACK] = (t) => { for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) { if (x % 3 === 0 || y % 3 === 0) t.set(x, y, t.vary([226, 214, 180], 0.05)); else t.set(x, y, [0, 0, 0], 0); } };
ITEM_PAINTERS[CREAM] = (ctx) => {
  for (let y = 6; y < 14; y++) for (let x = 2; x < 14; x++) if (Math.abs(x - 7.5) < 6 - (y - 6) * 0.4) px(ctx, x, y, y < 8 ? [252, 248, 236] : [150, 106, 64]);
  for (let y = 3; y < 7; y++) for (let x = 5; x < 11; x++) if (Math.hypot(x - 7.5, y - 6) < 3) px(ctx, x, y, x < 7 ? [255, 255, 250] : [244, 238, 220]);
};
const cone = (scoop, hi) => (ctx) => {
  for (let y = 8; y < 16; y++) for (let x = 4; x < 12; x++) if (Math.abs(x - 7.5) < (16 - y) * 0.5) px(ctx, x, y, (x + y) % 3 ? [214, 164, 90] : [180, 126, 60]);
  for (let y = 1; y < 9; y++) for (let x = 3; x < 13; x++) if (Math.hypot(x - 7.5, y - 5) < 4.3) px(ctx, x, y, x < 6 && y < 5 ? hi : scoop);
};
ITEM_PAINTERS[CHOC_ICE_CREAM] = cone([110, 66, 40], [150, 100, 66]);
ITEM_PAINTERS[CHERRY_ICE_CREAM] = cone([240, 150, 170], [255, 200, 210]);
ITEM_PAINTERS[HONEY_ICE_CREAM] = cone([246, 214, 120], [255, 240, 180]);
ITEM_PAINTERS[ICE_LOLLY] = (ctx) => {
  for (let y = 1; y < 11; y++) for (let x = 4; x < 12; x++) px(ctx, x, y, y < 4 ? [250, 150, 60] : y < 7 ? [250, 220, 80] : [230, 80, 90]);
  for (let y = 11; y < 16; y++) { px(ctx, 7, y, [214, 180, 120]); px(ctx, 8, y, [190, 156, 100]); }
};
const jar = (c, lid, bits) => (ctx) => {
  rect(ctx, 4, 2, 8, 2, lid);
  for (let y = 4; y < 15; y++) for (let x = 3; x < 13; x++) px(ctx, x, y, x === 3 || x === 12 || y === 14 ? [200, 220, 232] : c);
  for (const [x, y, cc] of bits) px(ctx, x, y, cc);
};
ITEM_PAINTERS[VINEGAR] = jar([196, 150, 110], [120, 90, 60], []);
ITEM_PAINTERS[PICKLES] = jar([200, 210, 150], [200, 60, 50], [[5, 6, [110, 150, 50]], [9, 8, [240, 230, 210]], [6, 11, [110, 150, 50]], [10, 12, [240, 150, 60]], [7, 9, [110, 150, 50]]]);
ITEM_PAINTERS[FISH_AND_CHIPS] = (ctx) => {
  for (let y = 5; y < 15; y++) for (let x = 1; x < 15; x++) if (Math.abs(x - 7.5) < 7 - (14 - y) * 0.3) px(ctx, x, y, [236, 236, 228]);
  for (let y = 5; y < 10; y++) for (let x = 2; x < 9; x++) if (Math.hypot((x - 5.5) / 3.5, (y - 7.5) / 2.5) < 1) px(ctx, x, y, (x + y) % 3 ? [220, 160, 60] : [190, 124, 40]);
  for (const x of [9, 11, 13]) for (let y = 3; y < 10; y++) px(ctx, x + (y & 1 ? 0 : 0), y, [250, 214, 110]);
};
const fishShape = (c, d) => (ctx) => {
  for (let y = 4; y < 12; y++) for (let x = 2; x < 12; x++) if (Math.hypot((x - 7) / 5, (y - 8) / 3.5) < 1) px(ctx, x, y, (x + y) % 4 === 0 ? d : c);
  for (let k = 0; k < 4; k++) { px(ctx, 12 + (k >> 1), 6 + k, c); px(ctx, 13, 5 + k * 2, d); }
  px(ctx, 4, 7, [20, 20, 20]);
};
ITEM_PAINTERS[SMOKED_FISH] = fishShape([180, 110, 50], [130, 74, 34]);
ITEM_PAINTERS[SMOKED_HAM] = (ctx) => {
  for (let y = 2; y < 14; y++) for (let x = 2; x < 13; x++) { const d = Math.hypot((x - 7) / 5, (y - 8) / 5.5); if (d < 1) px(ctx, x, y, d > 0.82 ? [120, 60, 30] : (x * y) % 7 === 0 ? [240, 190, 180] : [190, 80, 70]); }
  rect(ctx, 11, 1, 2, 3, [240, 236, 224]); rect(ctx, 6, 0, 1, 3, [214, 196, 140]);
};
ITEM_PAINTERS[SMOKED_CHEESE] = (ctx) => {
  for (let y = 5; y < 13; y++) for (let x = 2; x < 14; x++) if (x - 2 > (12 - y) * 0.6) px(ctx, x, y, y === 5 || x === 13 ? [150, 96, 40] : (x * 3 + y) % 9 === 0 ? [176, 120, 50] : [214, 160, 70]);
};
const scatter = (c, d, n) => (ctx) => {
  const spots = [[4, 4], [9, 3], [12, 7], [6, 8], [3, 11], [9, 11], [12, 12], [7, 13]].slice(0, n);
  for (const [cx, cy] of spots) { px(ctx, cx, cy, c); px(ctx, cx + 1, cy, d); px(ctx, cx, cy + 1, d); px(ctx, cx + 1, cy + 1, c); }
};
ITEM_PAINTERS[RAISINS] = scatter([80, 40, 60], [50, 24, 40], 8);
ITEM_PAINTERS[DRIED_FRUIT] = (ctx) => {
  for (const [cx, cy, c] of [[5, 5, [200, 120, 50]], [10, 6, [170, 40, 50]], [7, 11, [230, 160, 70]]]) for (let y = cy - 2; y <= cy + 2; y++) for (let x = cx - 3; x <= cx + 2; x++) if (Math.hypot((x - cx + 0.5) / 3, (y - cy) / 2) < 1) px(ctx, x, y, (x + y) % 3 ? c : shade(c, 0.75));
};
ITEM_PAINTERS[JERKY] = (ctx) => { for (let k = 0; k < 12; k++) for (let w = 0; w < 3; w++) px(ctx, 2 + k, 12 - k + w - (k >> 2), (k + w) % 4 ? [120, 50, 30] : [80, 30, 20]); };
ITEM_PAINTERS[TRAIL_MIX] = (ctx) => {
  for (let y = 7; y < 15; y++) for (let x = 2; x < 14; x++) if (Math.abs(x - 7.5) < 6 - (y - 7) * 0.5) px(ctx, x, y, [150, 106, 64]);
  const bits = [[80, 40, 60], [200, 120, 50], [84, 48, 28], [230, 200, 120]];
  for (let k = 0; k < 14; k++) px(ctx, 3 + (k * 5) % 10, 5 + (k * 3) % 4, bits[k % 4]);
};

// ---------- v34 C: oven dishes and moulded sweets ----------
import { PIZZA, CARROT_CAKE, PUMPKIN_BREAD, CHEESY_POTATO, TOFFEE, HONEY_CANDY, CANDIED_PEEL, MELTED_TOFFEE, HONEY_SYRUP } from './blocks.js';
const TOF = [196, 130, 56], TOF_HI = [236, 180, 90], AMBER = [236, 160, 30], AMBER_HI = [255, 214, 110];
P[T.TOFFEE] = (t) => { for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) t.set(x, y, x % 4 === 0 || y % 4 === 0 ? shade(TOF, 0.8) : (x + y) % 7 === 1 ? TOF_HI : t.vary(TOF, 0.03)); };
P[T.TOFFEE_LIQ] = (t) => { for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) t.set(x, y, t.vary(Math.sin(x * 0.7 + y * 0.3) > 0.7 ? TOF_HI : [214, 150, 70], 0.03)); };
P[T.CANDY] = (t) => { for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) t.set(x, y, x % 4 === 0 || y % 4 === 0 ? shade(AMBER, 0.75) : (x + y) % 5 === 1 ? AMBER_HI : t.vary(AMBER, 0.03)); };
P[T.CANDY_LIQ] = (t) => { for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) t.set(x, y, t.vary(Math.sin(x * 0.6 + y * 0.4) > 0.7 ? AMBER_HI : [244, 180, 50], 0.03)); };
ITEM_PAINTERS[PIZZA] = (ctx) => {
  for (let y = 1; y < 15; y++) for (let x = 1; x < 15; x++) { const d = Math.hypot(x - 7.5, y - 7.5); if (d < 7) px(ctx, x, y, d > 5.8 ? [214, 160, 80] : [210, 70, 40]); }
  for (const [x, y] of [[5, 5], [9, 4], [10, 9], [5, 10], [8, 7]]) { px(ctx, x, y, [250, 230, 150]); px(ctx, x + 1, y, [250, 230, 150]); }
  for (const [x, y] of [[7, 4], [4, 8], [11, 6], [8, 11]]) px(ctx, x, y, [60, 130, 40]);
};
const loaf = (c, top, bits) => (ctx) => {
  for (let y = 5; y < 14; y++) for (let x = 2; x < 14; x++) px(ctx, x, y, y < 7 ? top : y === 13 ? shade(c, 0.75) : c);
  for (const [x, y, cc] of bits) px(ctx, x, y, cc);
};
ITEM_PAINTERS[CARROT_CAKE] = loaf([200, 130, 70], [250, 246, 236], [[4, 5, [236, 120, 30]], [8, 5, [236, 120, 30]], [11, 5, [236, 120, 30]], [5, 9, [236, 130, 40]], [10, 11, [236, 130, 40]]]);
ITEM_PAINTERS[PUMPKIN_BREAD] = loaf([214, 140, 60], [170, 100, 40], [[5, 9, [236, 170, 80]], [9, 10, [236, 170, 80]]]);
ITEM_PAINTERS[CHEESY_POTATO] = (ctx) => {
  for (let y = 4; y < 14; y++) for (let x = 2; x < 14; x++) if (Math.hypot((x - 7.5) / 6, (y - 9) / 4.5) < 1) px(ctx, x, y, [150, 100, 50]);
  for (let y = 5; y < 10; y++) for (let x = 4; x < 12; x++) if (Math.hypot((x - 7.5) / 3.6, (y - 7.5) / 2.2) < 1) px(ctx, x, y, y < 7 ? [250, 210, 90] : [240, 230, 190]);
};
const sweets = (c, hi, wrap) => (ctx) => {
  for (const [cx, cy] of [[5, 6], [10, 9]]) {
    rect(ctx, cx - 2, cy - 2, 5, 4, c); px(ctx, cx - 1, cy - 1, hi);
    if (wrap) { px(ctx, cx - 3, cy - 2, wrap); px(ctx, cx - 3, cy + 1, wrap); px(ctx, cx + 3, cy - 2, wrap); px(ctx, cx + 3, cy + 1, wrap); }
  }
};
ITEM_PAINTERS[TOFFEE] = sweets(TOF, TOF_HI, [230, 220, 200]);
ITEM_PAINTERS[HONEY_CANDY] = sweets(AMBER, AMBER_HI, null);
ITEM_PAINTERS[CANDIED_PEEL] = (ctx) => { for (const [ox, oy] of [[2, 3], [7, 7], [3, 10]]) for (let k = 0; k < 7; k++) { px(ctx, ox + k, oy + (k > 3 ? 1 : 0), [250, 150, 40]); px(ctx, ox + k, oy + 1 + (k > 3 ? 1 : 0), [255, 230, 180]); } };
ITEM_PAINTERS[MELTED_TOFFEE] = bottleOf([200, 130, 56], false);
ITEM_PAINTERS[HONEY_SYRUP] = bottleOf([240, 170, 40], false);

// ---------- v34 D: coffee, rice and chillies ----------
import { COFFEE_CHERRIES, RICE, CHILLI, ROASTED_COFFEE, GROUND_COFFEE, COFFEE, MOCHA, RICE_PUDDING, FISH_RICE, HOT_SAUCE, CHILLI_CON_CARNE } from './blocks.js';
for (let k = 0; k < 4; k++) {
  P[T.COFFEE_0 + k] = (t) => { // a glossy dark bush, red cherries when ripe
    const h = [4, 7, 10, 12][k];
    for (let y = 16 - h; y < 16; y++) for (let x = 2; x < 14; x++) {
      if (Math.abs(x - 7.5) > 1 + (y - (16 - h)) * 0.9 || t.r() < 0.25) continue;
      t.set(x, y, t.vary(y === 15 ? [90, 60, 36] : [34, 100, 40], 0.14));
    }
    if (k === 3) for (const [x, y] of [[5, 9], [9, 7], [10, 11], [6, 13], [8, 10]]) { t.set(x, y, [200, 30, 30]); t.set(x + 1, y, [160, 20, 24]); }
  };
  P[T.RICE_0 + k] = (t) => { // slim stalks that droop golden heads when ripe
    const h = [4, 7, 10, 12][k];
    for (const x of [2, 4, 6, 8, 10, 12, 14]) {
      const hh = h - 1 + Math.floor(t.r() * 3);
      for (let y = 0; y < hh; y++) t.set(x + (y > hh - 3 && k === 3 ? 1 : 0), 15 - y, t.vary(k === 3 && y > hh - 4 ? [220, 196, 110] : [96, 170, 70], 0.1));
    }
  };
  P[T.CHILLI_0 + k] = (t) => {
    leafyCrop(t, k, null);
    if (k === 3) for (const [x, y] of [[4, 8], [9, 7], [12, 10], [7, 11]]) for (let d = 0; d < 3; d++) t.set(x, y + d, d === 2 ? [180, 20, 20] : [226, 40, 30]);
  };
}
const cherries = (c, d) => (ctx) => { for (const [x, y] of [[5, 6], [10, 5], [8, 10], [4, 11], [11, 11]]) blob(ctx, x, y, 2, 2, c, d); };
ITEM_PAINTERS[COFFEE_CHERRIES] = cherries([210, 40, 36], [150, 20, 24]);
ITEM_PAINTERS[ROASTED_COFFEE] = beans([60, 36, 22], [100, 64, 40]);
ITEM_PAINTERS[GROUND_COFFEE] = (ctx) => {
  for (let y = 6; y < 14; y++) for (let x = 2; x < 14; x++) {
    if (Math.abs(x - 7.5) > (y - 5) * 0.9) continue;
    px(ctx, x, y, (x * 5 + y * 3) % 7 === 0 ? [90, 56, 34] : [56, 34, 20]);
  }
};
ITEM_PAINTERS[RICE] = scatter([244, 240, 226], [210, 200, 170], 14);
ITEM_PAINTERS[CHILLI] = (ctx) => {
  for (let k = 0; k < 10; k++) { const x = 4 + k, y = 5 + Math.round(k * 0.6 + Math.sin(k * 0.5) * 1.5); rect(ctx, x, y, 1, k < 8 ? 3 : 2, k % 3 ? [220, 36, 28] : [250, 90, 70]); }
  rect(ctx, 2, 4, 3, 2, [60, 130, 40]);
};
ITEM_PAINTERS[COFFEE] = bottleOf([60, 34, 18], true);
ITEM_PAINTERS[MOCHA] = bottleOf([130, 80, 50], true);
ITEM_PAINTERS[HOT_SAUCE] = bottleOf([200, 30, 20], false);
ITEM_PAINTERS[RICE_PUDDING] = bowl([246, 236, 210], [[5, [240, 210, 160]], [10, [200, 120, 60]]]);
ITEM_PAINTERS[FISH_RICE] = bowl([244, 240, 226], [[4, [240, 150, 110]], [7, [240, 150, 110]], [10, [80, 150, 60]]]);
ITEM_PAINTERS[CHILLI_CON_CARNE] = bowl([170, 50, 30], [[3, [120, 60, 40]], [6, [230, 60, 40]], [9, [120, 60, 40]], [12, [60, 130, 40]]]);

// ---------- v35: bat guano ----------
import { GUANO } from './blocks.js';
ITEM_PAINTERS[GUANO] = (ctx) => {
  for (const [cx, cy, r] of [[6, 10, 3.2], [10, 11, 2.6], [8, 7, 2.4]]) blob(ctx, cx, cy, r, r * 0.8, [92, 80, 62], [64, 54, 42]);
  for (const [x, y] of [[5, 9], [9, 6], [11, 10]]) px(ctx, x, y, [210, 204, 186]);
};

// ---------- v35: the carpenter, crates and the distillery ----------
import { CRATED, CRATE, NEW_SPIRIT, WHISKY, OLD_WHISKY, RUBBING_ALCOHOL, BIOFUEL_BUCKET, BANDAGE } from './blocks.js';
P[T.CARP_SIDE] = (t) => { // a timber frame with a saw blade showing
  for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) {
    const frame = x < 2 || x > 13 || y < 2 || y > 13, d = Math.hypot(x - 7.5, y - 8.5);
    t.set(x, y, frame ? t.vary([110, 74, 40], 0.06) : d < 1.2 ? [60, 60, 66] : d < 4.5 ? ((Math.atan2(y - 8.5, x - 7.5) * 4 / Math.PI) & 1 ? [200, 204, 210] : [160, 164, 172]) : t.vary([176, 132, 80], 0.05));
  }
};
P[T.CARP_TOP] = (t) => {
  for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) t.set(x, y, y === 7 || y === 8 ? (x > 2 && x < 13 ? [190, 194, 200] : [80, 56, 30]) : t.vary(y % 4 === 0 ? [140, 100, 58] : [176, 132, 80], 0.05));
};
P[T.STILL_COPPER] = (t) => { for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) t.set(x, y, t.vary((x + y * 3) % 11 === 0 ? [240, 170, 110] : y % 5 === 0 ? [170, 90, 50] : [206, 120, 70], 0.05)); };
const crateBox = (ctx) => {
  for (let y = 2; y < 15; y++) for (let x = 1; x < 15; x++) {
    const edge = x < 3 || x > 12 || y < 4 || y > 12, slat = y === 8;
    px(ctx, x, y, edge ? [120, 82, 44] : slat ? [150, 106, 60] : (x + y) % 5 === 0 ? [170, 122, 70] : [190, 140, 84]);
  }
  for (const [x, y] of [[2, 3], [13, 3], [2, 13], [13, 13]]) px(ctx, x, y, [80, 80, 86]); // nails
};
ITEM_PAINTERS[CRATE] = crateBox;
export const paintCrateBox = crateBox; // (the crated items: see createIcons)
ITEM_PAINTERS[NEW_SPIRIT] = bottleOf([226, 232, 240], false);
ITEM_PAINTERS[WHISKY] = bottleOf([200, 130, 50], false);
ITEM_PAINTERS[OLD_WHISKY] = bottleOf([150, 80, 30], false);
ITEM_PAINTERS[RUBBING_ALCOHOL] = (ctx) => { bottleOf([150, 210, 240], false)(ctx); rect(ctx, 6, 9, 4, 2, [240, 60, 50]); px(ctx, 7, 8, [240, 60, 50]); px(ctx, 7, 11, [240, 60, 50]); };
ITEM_PAINTERS[BIOFUEL_BUCKET] = bucketPainter([140, 190, 60]);
ITEM_PAINTERS[BANDAGE] = (ctx) => {
  for (let y = 4; y < 12; y++) for (let x = 2; x < 14; x++) px(ctx, x, y, (x + y) % 3 === 0 ? [226, 222, 210] : [246, 244, 236]);
  rect(ctx, 6, 6, 4, 4, [230, 60, 50]); rect(ctx, 7, 5, 2, 6, [230, 60, 50]); rect(ctx, 5, 7, 6, 2, [230, 60, 50]);
};

// ---------- v44: the glider ----------
import { GLIDER } from './blocks.js';
ITEM_PAINTERS[GLIDER] = (ctx) => {
  // a wide wing of red and cream cloth over a wooden frame
  for (let x = 0; x < 16; x++) {
    const sag = Math.round(Math.abs(x - 7.5) / 3);
    for (let y = 3 + sag; y < 8 + sag - (x < 2 || x > 13 ? 2 : 0); y++) px(ctx, x, y, (x >> 2) % 2 ? [236, 226, 200] : [206, 58, 48]);
  }
  rect(ctx, 1, 4, 14, 1, [120, 80, 44]); // the spar
  for (const [x0, x1] of [[5, 7], [10, 8]]) for (let i = 0; i < 6; i++) px(ctx, Math.round(x0 + (x1 - x0) * i / 5), 8 + i, [110, 74, 40]); // struts
  rect(ctx, 6, 13, 4, 1, [110, 74, 40]); // the bar
};

// ---------- v44: coral, coral fans, sea grass and kelp ----------
const CORAL_COLS = [[220, 70, 70], [236, 200, 60], [70, 120, 230], [236, 120, 190]];
CORAL_COLS.forEach((c, i) => {
  P[T.CORAL + i] = (t) => { // knobbly living stone, pitted with polyps
    for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) {
      const pit = ((x * 7 + y * 13 + i * 5) % 9 === 0) || ((x * 3 + y * 5) % 11 === 0);
      t.set(x, y, t.vary(pit ? [c[0] * 0.55, c[1] * 0.55, c[2] * 0.55] : (x + y * 2) % 7 === 0 ? [Math.min(255, c[0] + 40), Math.min(255, c[1] + 40), Math.min(255, c[2] + 40)] : c, 0.12));
    }
  };
  P[T.CORAL_FAN + i] = (t) => { // a branching fan on a short stalk
    for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) t.set(x, y, [0, 0, 0], 0);
    const branch = (x, y, dx, len) => { for (let k = 0; k < len; k++) { t.set(Math.round(x + dx * k), y - k, t.vary(c, 0.15)); } };
    branch(7, 15, 0, 6); branch(7, 10, -0.6, 7); branch(8, 10, 0.6, 7); branch(7, 12, -1, 5); branch(8, 12, 1, 5);
    branch(5, 7, -0.3, 5); branch(10, 7, 0.3, 5); branch(7, 9, 0.1, 8);
    for (const [x, y] of [[2, 7], [13, 7], [4, 2], [11, 2], [7, 1], [3, 5], [12, 5]]) t.set(x, y, [Math.min(255, c[0] + 50), Math.min(255, c[1] + 50), Math.min(255, c[2] + 50)]);
  };
});
P[T.SEA_GRASS] = (t) => { // thin wavy blades
  for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) t.set(x, y, [0, 0, 0], 0);
  for (const [bx, h, ph] of [[2, 10, 0], [5, 15, 1.3], [8, 12, 2.1], [11, 14, 0.7], [13, 8, 2.8]]) {
    for (let k = 0; k < h; k++) t.set(Math.round(bx + Math.sin(k * 0.45 + ph) * 1.2), 15 - k, t.vary(k > h - 3 ? [110, 190, 90] : [50, 140, 60], 0.12));
  }
};
P[T.KELP] = (t) => { // a brown-green strand with broad leaves to each side
  for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) t.set(x, y, [0, 0, 0], 0);
  for (let y = 0; y < TILE; y++) {
    const cx = 7 + Math.round(Math.sin(y * 0.4) * 0.8);
    t.set(cx, y, t.vary([80, 100, 36], 0.1)); t.set(cx + 1, y, t.vary([90, 112, 40], 0.1));
    if (y % 5 === 1) for (let k = 1; k < 5; k++) { t.set(cx - k, y + (k >> 1), t.vary([100, 130, 44], 0.12)); t.set(cx - k, y + 1 + (k >> 1), t.vary([86, 116, 40], 0.12)); }
    if (y % 5 === 3) for (let k = 2; k < 6; k++) { t.set(cx + k, y + (k >> 1), t.vary([100, 130, 44], 0.12)); t.set(cx + k, y + 1 + (k >> 1), t.vary([86, 116, 40], 0.12)); }
  }
};
import { DRIED_KELP } from './blocks.js';
ITEM_PAINTERS[DRIED_KELP] = (ctx) => {
  for (let k = 0; k < 11; k++) { rect(ctx, 3 + k, 4 + Math.round(Math.sin(k * 0.7) * 1.5) + (k >> 1), 2, 3, k % 3 ? [50, 62, 30] : [70, 84, 40]); }
};

// ---------- v44: the record player ----------
P[T.RECORD] = (t) => { // a black disc with grooves and a red label
  for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) {
    const d = Math.hypot(x - 7.5, y - 7.5);
    t.set(x, y, d < 0.8 ? [20, 20, 20] : d < 2.2 ? [200, 50, 40] : Math.round(d * 2) % 3 === 0 ? [44, 44, 48] : [18, 18, 22]);
  }
};
P[T.TURNTABLE] = (t) => { t.fill([70, 70, 76], 0.08); for (let y = 6; y < 10; y++) for (let x = 6; x < 10; x++) t.set(x, y, [150, 150, 160]); };
