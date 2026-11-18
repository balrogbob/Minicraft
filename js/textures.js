// Procedurally painted pixel-art textures: the block atlas, UI icons and break cracks.
import {
  T, BLOCKS, isBlock, TORCH, STICK, COAL, WOOD_PICK, STONE_PICK, WOOD_AXE, STONE_AXE, WOOD_SHOVEL, STONE_SHOVEL,
  SEEDS, WHEAT, FLOUR, SUGAR, BUTTER, BREAD, COOKIE, CAKE, BUCKET, MILK_BUCKET, SLIME_BUCKET, FEATHER, MORTAR,
  STRING, ARROW, BOW, COAL_DUST, SLIME_FUEL, BED, FURN_TABLE, CHAIR, LAMP, CARPET, CURTAIN, DOOR, CHARCOAL,
} from './blocks.js';

export const TILE = 16;
export const ATLAS_COLS = 8;

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

ITEM_PAINTERS[WOOD_PICK] = toolPainter('pick', 'wood');
ITEM_PAINTERS[STONE_PICK] = toolPainter('pick', 'stone');
ITEM_PAINTERS[WOOD_AXE] = toolPainter('axe', 'wood');
ITEM_PAINTERS[STONE_AXE] = toolPainter('axe', 'stone');
ITEM_PAINTERS[WOOD_SHOVEL] = toolPainter('shovel', 'wood');
ITEM_PAINTERS[STONE_SHOVEL] = toolPainter('shovel', 'stone');

// Returns { id: dataURL } for every block and item.
export function createIcons(atlas) {
  const icons = {};
  for (const def of BLOCKS) {
    if (!def || !isBlock(def.id) || def.shape === 'torch' || def.shape === 'model') continue; // (those have painted icons)
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const ctx = c.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    if (def.shape === 'cross') {
      // plants show their flat sprite, like an item
      ctx.drawImage(atlas, (def.side % ATLAS_COLS) * TILE, Math.floor(def.side / ATLAS_COLS) * TILE, TILE, TILE, 0, 0, 64, 64);
    } else {
      drawIsoBlock(ctx, atlas, def);
    }
    icons[def.id] = c.toDataURL();
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
  }
  return icons;
}
