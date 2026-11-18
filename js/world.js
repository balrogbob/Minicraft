// Voxel world: storage, terrain generation, block light, chunk meshing, raycasting.
import * as THREE from 'three';
import { BLOCKS, AIR, GRASS, DIRT, STONE, LOG, LEAVES, SAND, COAL_ORE, BEDROCK, WATER, MAX_LIGHT } from './blocks.js';
import { TILE, ATLAS_COLS } from './textures.js';

export const CHUNK = 16;
export const WORLD_CHUNKS = 8; // world is WORLD_CHUNKS x WORLD_CHUNKS chunks
export const W = CHUNK * WORLD_CHUNKS; // 128 blocks wide
export const H = 64; // blocks tall
export const SEA_LEVEL = 24; // water fills every open cell at or below this height
const WATER_TOP = 0.875; // surface sits a little below the block top
// Terrain generator version. Saves remember theirs so old worlds regenerate identically.
// 1 = original terrain, 2 = adds caves.
export const GEN_VERSION = 2;

// ---------- noise ----------
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makePerlin(rand) {
  const p = new Uint8Array(512);
  const base = [...Array(256).keys()];
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [base[i], base[j]] = [base[j], base[i]];
  }
  for (let i = 0; i < 512; i++) p[i] = base[i & 255];
  const G = [[1, 1], [-1, 1], [1, -1], [-1, -1], [1, 0], [-1, 0], [0, 1], [0, -1]];
  const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10);
  const grad = (h, x, y) => { const g = G[h & 7]; return g[0] * x + g[1] * y; };
  const noise = (x, y) => {
    const X = Math.floor(x) & 255, Y = Math.floor(y) & 255;
    const xf = x - Math.floor(x), yf = y - Math.floor(y);
    const u = fade(xf), v = fade(yf);
    const aa = p[p[X] + Y], ab = p[p[X] + Y + 1], ba = p[p[X + 1] + Y], bb = p[p[X + 1] + Y + 1];
    const x1 = grad(aa, xf, yf) + u * (grad(ba, xf - 1, yf) - grad(aa, xf, yf));
    const x2 = grad(ab, xf, yf - 1) + u * (grad(bb, xf - 1, yf - 1) - grad(ab, xf, yf - 1));
    return x1 + v * (x2 - x1);
  };
  return (x, y, oct = 4) => {
    let sum = 0, amp = 1, freq = 1, norm = 0;
    for (let i = 0; i < oct; i++) {
      sum += noise(x * freq, y * freq) * amp;
      norm += amp; amp *= 0.5; freq *= 2;
    }
    return sum / norm;
  };
}

// ---------- face tables for meshing ----------
// For each of the 6 faces: axis d, sign s, plus per-corner vertex offset, AO neighbour offsets and uv.
const FACES = [];
for (const [d, s] of [[0, 1], [0, -1], [1, 1], [1, -1], [2, 1], [2, -1]]) {
  const u = (d + 1) % 3, v = (d + 2) % 3;
  const order = s > 0 ? [[0, 0], [1, 0], [1, 1], [0, 1]] : [[0, 0], [0, 1], [1, 1], [1, 0]];
  const n = [0, 0, 0]; n[d] = s;
  const corners = order.map(([cu, cv]) => {
    const o = [0, 0, 0];
    o[d] = s > 0 ? 1 : 0; o[u] = cu; o[v] = cv;
    const a = [...n]; a[u] += cu ? 1 : -1;
    const b = [...n]; b[v] += cv ? 1 : -1;
    const c = [...n]; c[u] += cu ? 1 : -1; c[v] += cv ? 1 : -1;
    let uv;
    if (d === 1) uv = [o[0], o[2]];
    else if (d === 0) uv = [o[2], o[1]];
    else uv = [o[0], o[1]];
    return { o, a, b, c, uv };
  });
  // brightness per face direction (top brightest, bottom darkest)
  const shade = d === 1 ? (s > 0 ? 1.0 : 0.5) : d === 0 ? 0.8 : 0.65;
  FACES.push({ d, s, n, corners, shade });
}
const AO_LEVELS = [0.45, 0.62, 0.8, 1.0];
// vertex colours are linear in three.js; convert perceptual brightness to linear
const toLinear = (v) => Math.pow(v, 2.2);

// Torch light level (0-15) -> linear brightness, falling off ~17% per block.
const LIGHT_CURVE = Array.from({ length: 16 * 4 + 1 }, (_, i) => {
  const level = i / 4;
  return level <= 0 ? 0 : toLinear(Math.pow(0.83, 14 - Math.min(14, level)));
});
const lightBrightness = (level) => LIGHT_CURVE[Math.round(level * 4)];

// Sunlight level (0-15) -> linear brightness. Gentler falloff so cave mouths fade gradually.
const SKY_CURVE = Array.from({ length: 16 * 4 + 1 }, (_, i) => {
  const level = i / 4;
  return level <= 0 ? 0 : toLinear(Math.pow(0.84, 15 - Math.min(15, level)));
});
const skyBrightness = (level) => SKY_CURVE[Math.round(level * 4)];

// Sunlight level after one step into a block of type `id`. Full sunlight shining straight down
// through air or glass stays full; everything else (sideways, or down through leaves and water)
// loses one level per block. Both the full rebuild and the incremental updates use this rule.
function skyStep(level, down, id) {
  return down && level === MAX_LIGHT && id !== LEAVES && id !== WATER ? MAX_LIGHT : level - 1;
}

const NEIGHBOURS = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];

export class World {
  constructor(seed, gen = GEN_VERSION) {
    this.seed = seed;
    this.gen = gen;
    this.data = new Uint8Array(W * W * H);
    this.light = new Uint8Array(W * W * H); // block light from torches, 0-15
    this.sky = new Uint8Array(W * W * H); // sunlight, 0-15 (15 = open sky)
    this.mods = new Map(); // index -> id, player edits (for saving)
    this.chunkMeshes = new Map();
    this.dirty = new Set();
    this.flow = []; // cells to re-check for water spreading into them
    this.flowTimer = 0;
  }

  idx(x, y, z) { return x + z * W + y * W * W; }

  inBounds(x, y, z) { return x >= 0 && z >= 0 && x < W && z < W && y >= 0 && y < H; }

  get(x, y, z) {
    if (!this.inBounds(x, y, z)) return AIR;
    return this.data[x + z * W + y * W * W];
  }

  // Used for player collision: the world edges and floor are solid walls.
  isSolid(x, y, z) {
    if (y < 0 || x < 0 || z < 0 || x >= W || z >= W) return true;
    if (y >= H) return false;
    return BLOCKS[this.data[x + z * W + y * W * W]]?.solid ?? false;
  }

  isWater(x, y, z) { return this.get(x, y, z) === WATER; }

  // Player edit: records the change, updates light and marks chunks for remeshing.
  setBlock(x, y, z, id) {
    if (!this.inBounds(x, y, z)) return;
    const i = this.idx(x, y, z);
    this.data[i] = id;
    this.mods.set(i, id);
    this.markCellDirty(x, z);
    this.updateLight(i);
    if (id === AIR) this.flow.push([x, y, z]);
  }

  // A cell's mesh (and AO/light sampling) can affect the chunk next door when it's on the border.
  markCellDirty(x, z) {
    const cx = Math.floor(x / CHUNK), cz = Math.floor(z / CHUNK);
    this.markDirty(cx, cz);
    const lx = x - cx * CHUNK, lz = z - cz * CHUNK;
    if (lx === 0) this.markDirty(cx - 1, cz);
    if (lx === CHUNK - 1) this.markDirty(cx + 1, cz);
    if (lz === 0) this.markDirty(cx, cz - 1);
    if (lz === CHUNK - 1) this.markDirty(cx, cz + 1);
  }

  // ---------- block light ----------
  // Light floods out from emitters (torches), losing one level per block, through any non-opaque cell.

  lightPasses(i) {
    const id = this.data[i];
    return id === AIR || BLOCKS[id].transparent;
  }

  // Calls fn(j) for each in-bounds neighbour index of cell i.
  eachNeighbour(i, fn) {
    const x = i % W, z = Math.floor(i / W) % W, y = Math.floor(i / (W * W));
    for (const [dx, dy, dz] of NEIGHBOURS) {
      const nx = x + dx, ny = y + dy, nz = z + dz;
      if (nx >= 0 && nz >= 0 && ny >= 0 && nx < W && nz < W && ny < H) fn(nx + nz * W + ny * W * W);
    }
  }

  spreadLight(queue, changed) {
    const L = this.light;
    for (let h = 0; h < queue.length; h++) {
      const i = queue[h];
      const next = L[i] - 1;
      if (next <= 0) continue;
      this.eachNeighbour(i, (j) => {
        if (L[j] < next && this.lightPasses(j)) {
          L[j] = next;
          changed?.add(j);
          queue.push(j);
        }
      });
    }
  }

  // Darken everything lit by cell i, then re-spread from any brighter light at the edge of the dark area.
  removeLight(i, changed) {
    const L = this.light;
    const dark = [[i, L[i]]];
    const relight = [];
    L[i] = 0;
    changed.add(i);
    for (let h = 0; h < dark.length; h++) {
      const [c, level] = dark[h];
      this.eachNeighbour(c, (j) => {
        const nl = L[j];
        if (nl && nl < level) {
          L[j] = 0;
          changed.add(j);
          dark.push([j, nl]);
        } else if (nl >= level) {
          relight.push(j);
        }
      });
    }
    this.spreadLight(relight, changed);
  }

  // Recompute light after the block at index i changed.
  updateLight(i) {
    const changed = new Set();
    this.updateSky(i, changed);
    if (this.light[i] > 0) this.removeLight(i, changed);
    const emit = BLOCKS[this.data[i]]?.light ?? 0;
    if (emit) {
      this.light[i] = emit;
      changed.add(i);
      this.spreadLight([i], changed);
    } else if (this.lightPasses(i)) {
      // an opening: let neighbouring light flow in
      const q = [];
      this.eachNeighbour(i, (j) => { if (this.light[j] > 1) q.push(j); });
      this.spreadLight(q, changed);
    }
    for (const j of changed) this.markCellDirty(j % W, Math.floor(j / W) % W);
  }

  // ---------- sunlight ----------
  // Like torch light, except sunlight at full strength travels straight down without fading,
  // so open ground is fully lit while overhangs, caves and tunnels fall off into darkness.

  spreadSky(queue, changed) {
    const S = this.sky, D = this.data;
    for (let h = 0; h < queue.length; h++) {
      const i = queue[h];
      const level = S[i];
      if (level <= 1 && level !== MAX_LIGHT) continue;
      const x = i % W, z = Math.floor(i / W) % W, y = Math.floor(i / (W * W));
      for (const [dx, dy, dz] of NEIGHBOURS) {
        const nx = x + dx, ny = y + dy, nz = z + dz;
        if (nx < 0 || nz < 0 || ny < 0 || nx >= W || nz >= W || ny >= H) continue;
        const j = nx + nz * W + ny * W * W;
        if (!this.lightPasses(j)) continue;
        const next = skyStep(level, dy === -1, D[j]);
        if (next > S[j]) {
          S[j] = next;
          changed?.add(j);
          queue.push(j);
        }
      }
    }
  }

  removeSky(i, changed) {
    const S = this.sky;
    const dark = [[i, S[i]]];
    const relight = [];
    S[i] = 0;
    changed.add(i);
    for (let h = 0; h < dark.length; h++) {
      const [c, level] = dark[h];
      const x = c % W, z = Math.floor(c / W) % W, y = Math.floor(c / (W * W));
      for (const [dx, dy, dz] of NEIGHBOURS) {
        const nx = x + dx, ny = y + dy, nz = z + dz;
        if (nx < 0 || nz < 0 || ny < 0 || nx >= W || nz >= W || ny >= H) continue;
        const j = nx + nz * W + ny * W * W;
        const nl = S[j];
        if (!nl) continue;
        // a full-strength column below us was lit by us, even though it's just as bright
        if (nl < level || (dy === -1 && level === MAX_LIGHT && nl === MAX_LIGHT)) {
          S[j] = 0;
          changed.add(j);
          dark.push([j, nl]);
        } else {
          relight.push(j);
        }
      }
    }
    this.spreadSky(relight, changed);
  }

  updateSky(i, changed) {
    if (this.sky[i] > 0) this.removeSky(i, changed);
    if (!this.lightPasses(i)) return;
    // let sunlight back in from the neighbours (the top of the world is open sky)
    const y = Math.floor(i / (W * W));
    if (y === H - 1) {
      this.sky[i] = skyStep(MAX_LIGHT, true, this.data[i]);
      changed.add(i);
      this.spreadSky([i], changed);
      return;
    }
    const q = [];
    this.eachNeighbour(i, (j) => { if (this.sky[j] > 0) q.push(j); });
    this.spreadSky(q, changed);
  }

  // Full rebuild of both light channels, used after generating or loading a world.
  computeAllLight() {
    this.light.fill(0);
    const q = [];
    for (let i = 0; i < this.data.length; i++) {
      const e = BLOCKS[this.data[i]]?.light;
      if (e) { this.light[i] = Math.min(e, MAX_LIGHT); q.push(i); }
    }
    this.spreadLight(q, null);

    // sunlight: shine straight down each column, then spread sideways into overhangs and caves
    const S = this.sky, D = this.data;
    S.fill(0);
    const sq = [];
    for (let z = 0; z < W; z++) for (let x = 0; x < W; x++) {
      let level = MAX_LIGHT; // open sky above the world
      for (let y = H - 1; y >= 0; y--) {
        const i = x + z * W + y * W * W;
        if (!this.lightPasses(i)) break;
        level = skyStep(level, true, D[i]);
        if (level <= 0) break;
        S[i] = level;
        sq.push(i);
      }
    }
    this.spreadSky(sq, null);
  }

  skyAt(x, y, z) {
    if (y >= H) return MAX_LIGHT;
    if (!this.inBounds(x, y, z)) return 0;
    return this.sky[x + z * W + y * W * W];
  }

  lightAt(x, y, z) {
    if (!this.inBounds(x, y, z)) return 0;
    return this.light[x + z * W + y * W * W];
  }

  // Water spreads into open cells at or below sea level that touch water from the side or above.
  // Bounded by SEA_LEVEL, so it can flood holes and caves you dig by the sea, but never runs away.
  tickWater(dt) {
    if (!this.flow.length) return;
    this.flowTimer += dt;
    if (this.flowTimer < 0.25) return;
    this.flowTimer = 0;
    const batch = this.flow;
    this.flow = [];
    const seen = new Set();
    for (const [x, y, z] of batch) {
      const k = this.idx(x, y, z);
      if (seen.has(k) || y > SEA_LEVEL || this.get(x, y, z) !== AIR) continue;
      seen.add(k);
      const wet = this.isWater(x + 1, y, z) || this.isWater(x - 1, y, z) || this.isWater(x, y, z + 1) ||
        this.isWater(x, y, z - 1) || this.isWater(x, y + 1, z);
      if (!wet) continue;
      this.setBlock(x, y, z, WATER);
      for (const [dx, dy, dz] of [[1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1], [0, -1, 0]]) {
        if (this.get(x + dx, y + dy, z + dz) === AIR) this.flow.push([x + dx, y + dy, z + dz]);
      }
    }
  }

  markDirty(cx, cz) {
    if (cx >= 0 && cz >= 0 && cx < WORLD_CHUNKS && cz < WORLD_CHUNKS) this.dirty.add(cx + ',' + cz);
  }

  applyMods(list) {
    for (const [i, id] of list) {
      if (i >= 0 && i < this.data.length) { this.data[i] = id; this.mods.set(i, id); }
    }
  }

  heightAt(x, z) {
    for (let y = H - 1; y >= 0; y--) if (this.get(x, y, z) !== AIR) return y;
    return 0;
  }

  generate() {
    const rand = mulberry32(this.seed);
    const n1 = makePerlin(rand), n2 = makePerlin(rand), n3 = makePerlin(rand);
    const heights = new Int16Array(W * W);
    for (let z = 0; z < W; z++) for (let x = 0; x < W; x++) {
      // "continent" noise decides land vs. lakes/sea; hills and mountains only rise on land
      const cont = n1(x / 70, z / 70, 4);
      const land = cont * 34;
      const detail = n2(x / 18, z / 18, 2) * 3;
      const mountain = Math.max(0, n3(x / 80, z / 80, 3)) * 30 * Math.min(1, Math.max(0, cont * 5));
      let h = Math.round(SEA_LEVEL + 4 + land + detail + mountain);
      h = Math.max(6, Math.min(H - 14, h));
      heights[x + z * W] = h;
      const sandy = h <= SEA_LEVEL + 1;
      for (let y = 0; y <= h; y++) {
        let id;
        if (y === 0) id = BEDROCK;
        else if (y < h - 3) id = rand() < 0.012 && y < h - 5 ? COAL_ORE : STONE;
        else if (sandy) id = SAND;
        else id = y === h ? GRASS : DIRT;
        this.data[this.idx(x, y, z)] = id;
      }
      for (let y = h + 1; y <= SEA_LEVEL; y++) this.data[this.idx(x, y, z)] = WATER;
    }
    if (this.gen >= 2) this.carveCaves();
    // trees
    for (let z = 3; z < W - 3; z++) for (let x = 3; x < W - 3; x++) {
      const h = heights[x + z * W];
      if (this.get(x, h, z) !== GRASS || rand() > 0.014) continue;
      const trunk = 4 + Math.floor(rand() * 3);
      if (h + trunk + 2 >= H) continue;
      this.data[this.idx(x, h, z)] = DIRT;
      for (let y = 1; y <= trunk; y++) this.data[this.idx(x, h + y, z)] = LOG;
      const top = h + trunk;
      for (let y = top - 2; y <= top + 1; y++) {
        const r = y >= top ? 1 : 2;
        for (let dz = -r; dz <= r; dz++) for (let dx = -r; dx <= r; dx++) {
          const corner = Math.abs(dx) === r && Math.abs(dz) === r;
          if (corner && (y === top + 1 || rand() < 0.5)) continue;
          const i = this.idx(x + dx, y, z + dz);
          if (this.data[i] === AIR) this.data[i] = LEAVES;
        }
      }
    }
    for (let cz = 0; cz < WORLD_CHUNKS; cz++) for (let cx = 0; cx < WORLD_CHUNKS; cx++) this.markDirty(cx, cz);
  }

  // Winding "worm" tunnels: random walks that carve out spheres. They have their own random
  // stream so tree placement is unchanged, and they never cut into water, so lakes don't hang in the air.
  carveCaves() {
    const rand = mulberry32(this.seed ^ 0x2c1b3c6d);
    const touchesWater = (x, y, z) => this.isWater(x, y + 1, z) || this.isWater(x + 1, y, z) ||
      this.isWater(x - 1, y, z) || this.isWater(x, y, z + 1) || this.isWater(x, y, z - 1);
    const carve = (cx, cy, cz, r) => {
      const r2 = r * r;
      for (let y = Math.max(1, Math.floor(cy - r)); y <= Math.ceil(cy + r); y++)
        for (let z = Math.floor(cz - r); z <= Math.ceil(cz + r); z++)
          for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) {
            if (!this.inBounds(x, y, z)) continue;
            const dx = x + 0.5 - cx, dy = (y + 0.5 - cy) * 1.3, dz = z + 0.5 - cz; // squashed: wider than tall
            if (dx * dx + dy * dy + dz * dz > r2) continue;
            const i = this.idx(x, y, z), id = this.data[i];
            if (id === AIR || id === WATER || id === BEDROCK || touchesWater(x, y, z)) continue;
            this.data[i] = AIR;
          }
    };
    for (let w = 0; w < 30; w++) {
      let x = rand() * W, z = rand() * W, y = 6 + rand() * 24;
      let yaw = rand() * Math.PI * 2, pitch = (rand() - 0.5) * 0.6, r = 1.4 + rand() * 0.8;
      const steps = 50 + rand() * 100;
      for (let s = 0; s < steps; s++) {
        carve(x, y, z, r);
        r = Math.max(1.1, Math.min(2.8, r + (rand() - 0.5) * 0.4));
        yaw += (rand() - 0.5) * 0.6;
        pitch = Math.max(-0.8, Math.min(0.8, pitch * 0.85 + (rand() - 0.5) * 0.4));
        x += Math.cos(yaw) * Math.cos(pitch);
        z += Math.sin(yaw) * Math.cos(pitch);
        y += Math.sin(pitch);
        if (y < 3) pitch = Math.abs(pitch);
        if (x < 1 || z < 1 || x >= W - 1 || z >= W - 1) break;
      }
    }
  }

  // ---------- meshing ----------
  buildChunkGeometry(cx, cz) {
    const pos = [], uv = [], col = [], tl = [], sl = [], index = [];
    const wpos = [], wuv = [], wcol = [], wtl = [], wsl = [], windex = [];
    let wcount = 0;
    const data = this.data;
    const tileUV = 1 / ATLAS_COLS;
    const eps = 0.5 / (TILE * ATLAS_COLS); // half-texel inset to avoid atlas bleeding
    const opaque = (x, y, z) => {
      if (y < 0) return true;
      const id = this.get(x, y, z);
      return id !== AIR && !BLOCKS[id].transparent;
    };
    const x0 = cx * CHUNK, z0 = cz * CHUNK;
    let vcount = 0;
    for (let y = 0; y < H; y++) for (let z = z0; z < z0 + CHUNK; z++) for (let x = x0; x < x0 + CHUNK; x++) {
      const id = data[x + z * W + y * W * W];
      if (id === AIR) continue;
      const def = BLOCKS[id];
      if (id === WATER) {
        const surface = this.get(x, y + 1, z) !== WATER;
        for (const f of FACES) {
          const nid = f.n[1] < 0 && y === 0 ? STONE : this.get(x + f.n[0], y + f.n[1], z + f.n[2]);
          if (nid === WATER || (nid !== AIR && !BLOCKS[nid].transparent)) continue;
          for (const c of f.corners) {
            const top = c.o[1] === 1 && surface ? WATER_TOP : c.o[1];
            const px = x + c.o[0], py = y + top, pz = z + c.o[2];
            wpos.push(px, py, pz);
            // world-space UVs so the texture tiles seamlessly and can scroll
            if (f.d === 1) wuv.push(px, pz); else if (f.d === 0) wuv.push(pz, py); else wuv.push(px, py);
            const b = toLinear(f.shade);
            wcol.push(b, b, b);
            const fx = x + f.n[0], fy = y + f.n[1], fz = z + f.n[2];
            wtl.push(lightBrightness(Math.max(this.lightAt(x, y, z), this.lightAt(fx, fy, fz))));
            wsl.push(skyBrightness(Math.max(this.skyAt(x, y, z), this.skyAt(fx, fy, fz))));
          }
          windex.push(wcount, wcount + 1, wcount + 2, wcount, wcount + 2, wcount + 3);
          wcount += 4;
        }
        continue;
      }
      if (def.shape === 'torch') {
        vcount = this.addTorch(x, y, z, def, pos, uv, col, tl, sl, index, vcount);
        continue;
      }
      for (const f of FACES) {
        const nx = x + f.n[0], ny = y + f.n[1], nz = z + f.n[2];
        if (ny < 0) continue;
        const nid = this.get(nx, ny, nz);
        if (nid !== AIR) {
          const ndef = BLOCKS[nid];
          if (!ndef.transparent) continue;
          if (nid === id && id !== LEAVES) continue; // glass-to-glass faces are hidden
        }
        const tile = f.d === 1 ? (f.s > 0 ? def.top : def.bottom) : def.side;
        const tu = (tile % ATLAS_COLS) * tileUV;
        const tvTop = 1 - Math.floor(tile / ATLAS_COLS) * tileUV;
        const ao = [0, 0, 0, 0];
        for (let k = 0; k < 4; k++) {
          const c = f.corners[k];
          pos.push(x + c.o[0], y + c.o[1], z + c.o[2]);
          uv.push(
            tu + eps + c.uv[0] * (tileUV - 2 * eps),
            tvTop - tileUV + eps + c.uv[1] * (tileUV - 2 * eps),
          );
          const s1 = opaque(x + c.a[0], y + c.a[1], z + c.a[2]) ? 1 : 0;
          const s2 = opaque(x + c.b[0], y + c.b[1], z + c.b[2]) ? 1 : 0;
          const cc = opaque(x + c.c[0], y + c.c[1], z + c.c[2]) ? 1 : 0;
          const a = s1 && s2 ? 0 : 3 - (s1 + s2 + cc);
          ao[k] = a;
          const b = toLinear(f.shade * AO_LEVELS[a]);
          col.push(b, b, b);
          // smooth light: average the open cells around this corner, in front of the face
          let sum = this.lightAt(nx, ny, nz), sun = this.skyAt(nx, ny, nz), n = 1;
          if (!s1) { sum += this.lightAt(x + c.a[0], y + c.a[1], z + c.a[2]); sun += this.skyAt(x + c.a[0], y + c.a[1], z + c.a[2]); n++; }
          if (!s2) { sum += this.lightAt(x + c.b[0], y + c.b[1], z + c.b[2]); sun += this.skyAt(x + c.b[0], y + c.b[1], z + c.b[2]); n++; }
          if (!cc && !(s1 && s2)) { sum += this.lightAt(x + c.c[0], y + c.c[1], z + c.c[2]); sun += this.skyAt(x + c.c[0], y + c.c[1], z + c.c[2]); n++; }
          tl.push(lightBrightness(sum / n));
          sl.push(skyBrightness(sun / n));
        }
        // flip the quad diagonal so AO interpolates without artifacts
        if (ao[0] + ao[2] < ao[1] + ao[3]) {
          index.push(vcount + 1, vcount + 2, vcount + 3, vcount + 1, vcount + 3, vcount);
        } else {
          index.push(vcount, vcount + 1, vcount + 2, vcount, vcount + 2, vcount + 3);
        }
        vcount += 4;
      }
    }
    const geo = (p, u, c, t, sk, i) => {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3));
      g.setAttribute('uv', new THREE.Float32BufferAttribute(u, 2));
      g.setAttribute('color', new THREE.Float32BufferAttribute(c, 3));
      g.setAttribute('torch', new THREE.Float32BufferAttribute(t, 1));
      g.setAttribute('sky', new THREE.Float32BufferAttribute(sk, 1));
      g.setIndex(i);
      g.computeBoundingSphere();
      return g;
    };
    return { solid: geo(pos, uv, col, tl, sl, index), water: wcount ? geo(wpos, wuv, wcol, wtl, wsl, windex) : null };
  }

  // A torch is a 2x10-pixel stick. Wall torches sit low against the wall and lean out of it.
  addTorch(x, y, z, def, pos, uv, col, tl, sl, index, vcount) {
    const tileUV = 1 / ATLAS_COLS;
    const tu = (def.top % ATLAS_COLS) * tileUV;
    const tv0 = 1 - Math.floor(def.top / ATLAS_COLS) * tileUV - tileUV;
    const [wx, wz] = def.wall ?? [0, 0];
    const lift = def.wall ? 0.22 : 0;
    for (const f of FACES) {
      // texture rows: sides show the whole stick, the top shows the flame, the bottom the stick end
      const [v0, vlen] = f.d !== 1 ? [0, 10] : f.s > 0 ? [8, 2] : [0, 2];
      for (const c of f.corners) {
        const o = c.o;
        const lean = 0.42 - 0.27 * o[1]; // distance from the centre toward the wall: more at the base
        pos.push(
          x + (7 + 2 * o[0]) / 16 + wx * lean,
          y + lift + (o[1] * 10) / 16,
          z + (7 + 2 * o[2]) / 16 + wz * lean,
        );
        uv.push(tu + ((7 + 2 * c.uv[0]) / 16) * tileUV, tv0 + ((v0 + vlen * c.uv[1]) / 16) * tileUV);
        const b = toLinear(f.shade);
        col.push(b, b, b);
        tl.push(1); // torches are always fully lit
        sl.push(1);
      }
      index.push(vcount, vcount + 1, vcount + 2, vcount, vcount + 2, vcount + 3);
      vcount += 4;
    }
    return vcount;
  }

  // Rebuild up to `max` dirty chunks, nearest to (px, pz) first.
  // materials: { solid, water }
  remeshDirty(scene, materials, px, pz, max = Infinity) {
    if (!this.dirty.size) return 0;
    const list = [...this.dirty].map((k) => {
      const [cx, cz] = k.split(',').map(Number);
      const dx = (cx + 0.5) * CHUNK - px, dz = (cz + 0.5) * CHUNK - pz;
      return { k, cx, cz, d: dx * dx + dz * dz };
    }).sort((a, b) => a.d - b.d);
    let n = 0;
    for (const c of list) {
      if (n >= max) break;
      this.dirty.delete(c.k);
      const geo = this.buildChunkGeometry(c.cx, c.cz);
      let entry = this.chunkMeshes.get(c.k);
      if (!entry) { entry = { solid: null, water: null }; this.chunkMeshes.set(c.k, entry); }
      for (const kind of ['solid', 'water']) {
        const g = geo[kind];
        let mesh = entry[kind];
        if (mesh) {
          mesh.geometry.dispose();
          if (g) mesh.geometry = g;
          else { scene.remove(mesh); entry[kind] = null; }
        } else if (g) {
          mesh = new THREE.Mesh(g, materials[kind]);
          if (kind === 'water') mesh.renderOrder = 1;
          entry[kind] = mesh;
          scene.add(mesh);
        }
      }
      n++;
    }
    return n;
  }

  dispose(scene) {
    for (const e of this.chunkMeshes.values()) {
      for (const m of [e.solid, e.water]) if (m) { scene.remove(m); m.geometry.dispose(); }
    }
    this.chunkMeshes.clear();
  }

  // Voxel DDA raycast. Returns { x, y, z, id, nx, ny, nz } for the first solid block hit (water is ignored).
  raycast(origin, dir, maxDist) {
    let x = Math.floor(origin.x), y = Math.floor(origin.y), z = Math.floor(origin.z);
    const sx = Math.sign(dir.x), sy = Math.sign(dir.y), sz = Math.sign(dir.z);
    const tdx = sx ? Math.abs(1 / dir.x) : Infinity;
    const tdy = sy ? Math.abs(1 / dir.y) : Infinity;
    const tdz = sz ? Math.abs(1 / dir.z) : Infinity;
    let tmx = sx ? (sx > 0 ? x + 1 - origin.x : origin.x - x) * tdx : Infinity;
    let tmy = sy ? (sy > 0 ? y + 1 - origin.y : origin.y - y) * tdy : Infinity;
    let tmz = sz ? (sz > 0 ? z + 1 - origin.z : origin.z - z) * tdz : Infinity;
    let nx = 0, ny = 0, nz = 0, t = 0;
    while (t <= maxDist) {
      const id = this.get(x, y, z);
      if (id !== AIR && id !== WATER) return { x, y, z, id, nx, ny, nz };
      if (tmx < tmy && tmx < tmz) { x += sx; t = tmx; tmx += tdx; nx = -sx; ny = 0; nz = 0; }
      else if (tmy < tmz) { y += sy; t = tmy; tmy += tdy; nx = 0; ny = -sy; nz = 0; }
      else { z += sz; t = tmz; tmz += tdz; nx = 0; ny = 0; nz = -sz; }
    }
    return null;
  }
}
