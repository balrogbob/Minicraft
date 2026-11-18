// Voxel world: storage, terrain generation, chunk meshing, raycasting.
import * as THREE from 'three';
import { BLOCKS, AIR, GRASS, DIRT, STONE, LOG, LEAVES, SAND, COAL_ORE, BEDROCK } from './blocks.js';
import { TILE, ATLAS_COLS } from './textures.js';

export const CHUNK = 16;
export const WORLD_CHUNKS = 8; // world is WORLD_CHUNKS x WORLD_CHUNKS chunks
export const W = CHUNK * WORLD_CHUNKS; // 128 blocks wide
export const H = 64; // blocks tall

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

export class World {
  constructor(seed) {
    this.seed = seed;
    this.data = new Uint8Array(W * W * H);
    this.mods = new Map(); // index -> id, player edits (for saving)
    this.chunkMeshes = new Map();
    this.dirty = new Set();
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
    return this.data[x + z * W + y * W * W] !== AIR;
  }

  // Player edit: records the change and marks chunks for remeshing.
  setBlock(x, y, z, id) {
    if (!this.inBounds(x, y, z)) return;
    const i = this.idx(x, y, z);
    this.data[i] = id;
    this.mods.set(i, id);
    const cx = Math.floor(x / CHUNK), cz = Math.floor(z / CHUNK);
    this.markDirty(cx, cz);
    const lx = x - cx * CHUNK, lz = z - cz * CHUNK;
    if (lx === 0) this.markDirty(cx - 1, cz);
    if (lx === CHUNK - 1) this.markDirty(cx + 1, cz);
    if (lz === 0) this.markDirty(cx, cz - 1);
    if (lz === CHUNK - 1) this.markDirty(cx, cz + 1);
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
      const base = n1(x / 64, z / 64, 4) * 12;
      const detail = n2(x / 18, z / 18, 2) * 2.5;
      const mountain = Math.max(0, n3(x / 80, z / 80, 3)) * 30;
      let h = Math.round(28 + base + detail + mountain);
      h = Math.max(6, Math.min(H - 14, h));
      heights[x + z * W] = h;
      const sandy = h <= 25;
      for (let y = 0; y <= h; y++) {
        let id;
        if (y === 0) id = BEDROCK;
        else if (y < h - 3) id = rand() < 0.012 && y < h - 5 ? COAL_ORE : STONE;
        else if (sandy) id = SAND;
        else id = y === h ? GRASS : DIRT;
        this.data[this.idx(x, y, z)] = id;
      }
    }
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

  // ---------- meshing ----------
  buildChunkGeometry(cx, cz) {
    const pos = [], uv = [], col = [], index = [];
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
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    g.setIndex(index);
    g.computeBoundingSphere();
    return g;
  }

  // Rebuild up to `max` dirty chunks, nearest to (px, pz) first.
  remeshDirty(scene, material, px, pz, max = Infinity) {
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
      let mesh = this.chunkMeshes.get(c.k);
      if (mesh) {
        mesh.geometry.dispose();
        mesh.geometry = geo;
      } else {
        mesh = new THREE.Mesh(geo, material);
        this.chunkMeshes.set(c.k, mesh);
        scene.add(mesh);
      }
      n++;
    }
    return n;
  }

  dispose(scene) {
    for (const m of this.chunkMeshes.values()) { scene.remove(m); m.geometry.dispose(); }
    this.chunkMeshes.clear();
  }

  // Voxel DDA raycast. Returns { x, y, z, id, nx, ny, nz } for the first non-air block hit.
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
      if (id !== AIR) return { x, y, z, id, nx, ny, nz };
      if (tmx < tmy && tmx < tmz) { x += sx; t = tmx; tmx += tdx; nx = -sx; ny = 0; nz = 0; }
      else if (tmy < tmz) { y += sy; t = tmy; tmy += tdy; nx = 0; ny = -sy; nz = 0; }
      else { z += sz; t = tmz; tmz += tdz; nx = 0; ny = 0; nz = -sz; }
    }
    return null;
  }
}
