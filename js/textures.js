// Procedurally painted pixel-art textures: the block atlas, UI icons and break cracks.
import { T, BLOCKS, isBlock, STICK, COAL, WOOD_PICK, STONE_PICK, WOOD_AXE, STONE_AXE, WOOD_SHOVEL, STONE_SHOVEL } from './blocks.js';

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
  [T.BEDROCK](t) {
    for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) {
      const g = 30 + t.r() * 100;
      t.set(x, y, [g, g, g]);
    }
  },
};

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
  face(def.side, [28 * s, 14 * s, 0, 28 * s, 4, 18], 0.25);
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
    if (!def || !isBlock(def.id)) continue;
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const ctx = c.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    drawIsoBlock(ctx, atlas, def);
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
