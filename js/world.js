// Streaming voxel world: chunks are generated (or loaded) around the player and unloaded behind,
// with block light and sunlight flowing across chunk borders, chunk meshing and raycasting.
import * as THREE from 'three';
import { BLOCKS, AIR, LEAVES, WATER, MAX_LIGHT, SUGAR_CANE, MAX_CANE_HEIGHT } from './blocks.js';
import { TILE, ATLAS_COLS } from './textures.js';
import { Generator, CHUNK, H, SEA_LEVEL, WORLD_SIZE, WORLD_CHUNKS, CHUNK_VOLUME, localIndex } from './terrain.js';

export { CHUNK, H, SEA_LEVEL, WORLD_SIZE, WORLD_CHUNKS };

const WATER_TOP = 0.875; // surface sits a little below the block top

export const chunkKey = (cx, cz) => cx * WORLD_CHUNKS + cz;

// Light-propagation queues hold packed global coordinates.
const S1 = WORLD_SIZE, S2 = WORLD_SIZE * WORLD_SIZE;
const pack = (x, y, z) => x + z * S1 + y * S2;

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
  // which of the four facings (0..3 = +z, -x, -z, +x) a side face points toward
  const dir = d === 2 ? (s > 0 ? 0 : 2) : d === 0 ? (s > 0 ? 3 : 1) : -1;
  FACES.push({ d, s, n, corners, shade, dir });
}
const AO_LEVELS = [0.45, 0.62, 0.8, 1.0];
// vertex colours are linear in three.js; convert perceptual brightness to linear
const toLinear = (v) => Math.pow(v, 2.2);

// Torch light level (0-15) -> linear brightness, falling off ~17% per block.
const LIGHT_CURVE = Array.from({ length: 16 * 4 + 1 }, (_, i) => {
  const level = i / 4;
  return level <= 0 ? 0 : toLinear(Math.pow(0.83, 14 - Math.min(14, level)));
});
export const lightBrightness = (level) => LIGHT_CURVE[Math.round(level * 4)];

// Sunlight level (0-15) -> linear brightness. Gentler falloff so cave mouths fade gradually.
const SKY_CURVE = Array.from({ length: 16 * 4 + 1 }, (_, i) => {
  const level = i / 4;
  return level <= 0 ? 0 : toLinear(Math.pow(0.84, 15 - Math.min(15, level)));
});
export const skyBrightness = (level) => SKY_CURVE[Math.round(level * 4)];

// Sunlight level after one step into a block of type `id`. Full sunlight shining straight down
// through air or glass stays full; everything else (sideways, or down through leaves and water)
// loses one level per block. Both chunk lighting and the incremental updates use this rule.
function skyStep(level, down, id) {
  return down && level === MAX_LIGHT && id !== LEAVES && id !== WATER ? MAX_LIGHT : level - 1;
}

const NEIGHBOURS = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
const passes = (id) => id === AIR || BLOCKS[id].transparent;

class Chunk {
  constructor(cx, cz, data) {
    this.cx = cx;
    this.cz = cz;
    this.key = chunkKey(cx, cz);
    this.data = data;
    this.light = new Uint8Array(CHUNK_VOLUME); // torch light
    this.sky = new Uint8Array(CHUNK_VOLUME); // sunlight
    this.solid = null; // meshes
    this.water = null;
    this.growing = new Set(); // local indices of plants that can still grow
  }
}

// Average seconds between growth steps for each kind of plant (only while its chunk is loaded).
const GROW_SECONDS = { wheat: 45, cane: 60 };

export class World {
  constructor(seed, store) {
    this.seed = seed;
    this.generator = new Generator(seed);
    this.store = store;
    this.chunks = new Map();
    this.dirty = new Set(); // chunk keys needing a (re)mesh
    this.pending = new Set(); // chunk keys being loaded from storage
    this.unsaved = new Set(); // chunk keys edited since the last save
    this.flow = []; // cells to re-check for water spreading into them
    this.flowTimer = 0;
    this.renderDistance = 6; // in chunks
    this.lastChunk = null;
    this.unloadTimer = 0;
    this.ringCache = null;
    this.failed = new Map(); // chunk key -> time it failed to load; retried after a pause
    this.onError = null; // called with an Error if a chunk fails to generate, load or mesh
  }

  // Report an error without letting it stop the streaming of other chunks.
  fail(key, err) {
    this.failed.set(key, performance.now());
    if (this.onError) this.onError(err);
    else console.error(err);
  }

  // ---------- block access ----------

  chunkAt(x, z) {
    if (x < 0 || z < 0 || x >= WORLD_SIZE || z >= WORLD_SIZE) return null;
    const cx = x >> 4, cz = z >> 4;
    const lc = this.lastChunk;
    if (lc && lc.cx === cx && lc.cz === cz) return lc;
    const c = this.chunks.get(chunkKey(cx, cz));
    if (c) this.lastChunk = c;
    return c ?? null;
  }

  inBounds(x, y, z) { return x >= 0 && z >= 0 && x < WORLD_SIZE && z < WORLD_SIZE && y >= 0 && y < H; }

  get(x, y, z) {
    if (y < 0 || y >= H) return AIR;
    const c = this.chunkAt(x, z);
    return c ? c.data[localIndex(x, y, z)] : AIR;
  }

  // Used for player collision: the floor, world edges and not-yet-loaded chunks are solid.
  isSolid(x, y, z) {
    if (y < 0) return true;
    if (y >= H) return false;
    const c = this.chunkAt(x, z);
    if (!c) return true;
    return BLOCKS[c.data[localIndex(x, y, z)]]?.solid ?? false;
  }

  isWater(x, y, z) { return this.get(x, y, z) === WATER; }

  lightAt(x, y, z) {
    if (y < 0 || y >= H) return 0;
    const c = this.chunkAt(x, z);
    return c ? c.light[localIndex(x, y, z)] : 0;
  }

  skyAt(x, y, z) {
    if (y >= H) return MAX_LIGHT;
    if (y < 0) return 0;
    const c = this.chunkAt(x, z);
    return c ? c.sky[localIndex(x, y, z)] : 0;
  }

  heightAt(x, z) {
    for (let y = H - 1; y >= 0; y--) if (this.get(x, y, z) !== AIR) return y;
    return 0;
  }

  // Player edit: records the change, updates light and marks chunks for remeshing.
  setBlock(x, y, z, id) {
    if (y < 0 || y >= H) return;
    const c = this.chunkAt(x, z);
    if (!c) return;
    c.data[localIndex(x, y, z)] = id;
    this.unsaved.add(c.key);
    this.markCellDirty(x, z);
    this.updateLight(x, y, z);
    if (id === AIR) this.flow.push([x, y, z]);
    // this cell, and the one below (a sugar cane that's no longer, or now is, the top), may start or stop growing
    this.refreshGrowth(c, x, y, z);
    if (y > 0) this.refreshGrowth(c, x, y - 1, z);
  }

  // ---------- plant growth ----------

  canGrow(c, x, y, z) {
    const id = c.data[localIndex(x, y, z)];
    const grows = BLOCKS[id]?.grows;
    if (!grows) return false;
    if (grows !== 'up') return true;
    // sugar cane: only the top of a column shorter than the maximum, with air above
    if (y + 1 >= H || c.data[localIndex(x, y + 1, z)] !== AIR) return false;
    let height = 1;
    while (y - height >= 0 && c.data[localIndex(x, y - height, z)] === SUGAR_CANE) height++;
    return height < MAX_CANE_HEIGHT;
  }

  refreshGrowth(c, x, y, z) {
    const li = localIndex(x, y, z);
    if (this.canGrow(c, x, y, z)) c.growing.add(li); else c.growing.delete(li);
  }

  // Called about once a second: each growing plant has a small chance to grow a step.
  tickPlants(dt) {
    this.growTimer = (this.growTimer ?? 0) + dt;
    if (this.growTimer < 1) return;
    const elapsed = this.growTimer;
    this.growTimer = 0;
    for (const c of this.chunks.values()) {
      if (!c.growing.size) continue;
      for (const li of [...c.growing]) {
        const id = c.data[li];
        const def = BLOCKS[id];
        const chance = elapsed / (def.grows === 'up' ? GROW_SECONDS.cane : GROW_SECONDS.wheat);
        if (Math.random() >= chance) continue;
        const x = c.cx * CHUNK + (li & 15), z = c.cz * CHUNK + ((li >> 4) & 15), y = li >> 8;
        if (def.grows === 'up') this.setBlock(x, y + 1, z, SUGAR_CANE);
        else this.setBlock(x, y, z, def.grows);
      }
    }
  }

  // A cell's mesh (and AO/light sampling) can affect the chunks next door when it's on a border.
  markCellDirty(x, z) {
    const cx = x >> 4, cz = z >> 4, lx = x & 15, lz = z & 15;
    const xs = lx === 0 ? [cx, cx - 1] : lx === 15 ? [cx, cx + 1] : [cx];
    const zs = lz === 0 ? [cz, cz - 1] : lz === 15 ? [cz, cz + 1] : [cz];
    for (const a of xs) for (const b of zs) {
      const k = chunkKey(a, b);
      if (this.chunks.has(k)) this.dirty.add(k);
    }
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
      const k = pack(x, y, z);
      if (seen.has(k) || y > SEA_LEVEL || !this.chunkAt(x, z) || this.get(x, y, z) !== AIR) continue;
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

  // ---------- light ----------
  // Two channels, both flood-filled one level per block through non-opaque cells:
  // torch light (from emitting blocks) and sunlight (which also shines straight down unchanged).
  // Light only flows through loaded chunks; when a chunk loads it pulls light in from its neighbours.

  // Spread one channel ('light' or 'sky') outward from the packed cells in `queue`.
  spread(channel, queue) {
    const isSky = channel === 'sky';
    for (let h = 0; h < queue.length; h++) {
      const p = queue[h];
      const y = Math.floor(p / S2), r = p - y * S2, z = Math.floor(r / S1), x = r - z * S1;
      const c = this.chunkAt(x, z);
      if (!c) continue;
      const level = c[channel][localIndex(x, y, z)];
      if (level <= 1) continue;
      for (const [dx, dy, dz] of NEIGHBOURS) {
        const ny = y + dy;
        if (ny < 0 || ny >= H) continue;
        const nx = x + dx, nz = z + dz;
        const nc = this.chunkAt(nx, nz);
        if (!nc) continue;
        const li = localIndex(nx, ny, nz);
        const id = nc.data[li];
        if (!passes(id)) continue;
        const next = isSky ? skyStep(level, dy === -1, id) : level - 1;
        if (next > nc[channel][li]) {
          nc[channel][li] = next;
          this.markCellDirty(nx, nz);
          queue.push(pack(nx, ny, nz));
        }
      }
    }
  }

  // Darken everything lit through (x, y, z), then re-spread from brighter light at the edge of the dark area.
  remove(channel, x, y, z) {
    const isSky = channel === 'sky';
    const c0 = this.chunkAt(x, z);
    const dark = [[pack(x, y, z), c0[channel][localIndex(x, y, z)]]];
    const relight = [];
    c0[channel][localIndex(x, y, z)] = 0;
    this.markCellDirty(x, z);
    for (let h = 0; h < dark.length; h++) {
      const [p, level] = dark[h];
      const cy = Math.floor(p / S2), r = p - cy * S2, cz = Math.floor(r / S1), cx = r - cz * S1;
      for (const [dx, dy, dz] of NEIGHBOURS) {
        const ny = cy + dy;
        if (ny < 0 || ny >= H) continue;
        const nx = cx + dx, nz = cz + dz;
        const nc = this.chunkAt(nx, nz);
        if (!nc) continue;
        const li = localIndex(nx, ny, nz);
        const nl = nc[channel][li];
        if (!nl) continue;
        // for sunlight, a full-strength column below was lit by us even though it's just as bright
        if (nl < level || (isSky && dy === -1 && level === MAX_LIGHT && nl === MAX_LIGHT)) {
          nc[channel][li] = 0;
          this.markCellDirty(nx, nz);
          dark.push([pack(nx, ny, nz), nl]);
        } else {
          relight.push(pack(nx, ny, nz));
        }
      }
    }
    this.spread(channel, relight);
  }

  // Recompute both channels after the block at (x, y, z) changed.
  updateLight(x, y, z) {
    const c = this.chunkAt(x, z);
    const li = localIndex(x, y, z);
    const id = c.data[li];
    // sunlight
    if (c.sky[li] > 0) this.remove('sky', x, y, z);
    if (passes(id)) {
      if (y === H - 1) {
        c.sky[li] = skyStep(MAX_LIGHT, true, id);
        this.spread('sky', [pack(x, y, z)]);
      } else {
        this.spread('sky', this.litNeighbours('sky', x, y, z));
      }
    }
    // torch light
    if (c.light[li] > 0) this.remove('light', x, y, z);
    const emit = BLOCKS[id]?.light ?? 0;
    if (emit) {
      c.light[li] = emit;
      this.spread('light', [pack(x, y, z)]);
    } else if (passes(id)) {
      this.spread('light', this.litNeighbours('light', x, y, z));
    }
  }

  litNeighbours(channel, x, y, z) {
    const q = [];
    for (const [dx, dy, dz] of NEIGHBOURS) {
      const nx = x + dx, ny = y + dy, nz = z + dz;
      if (ny < 0 || ny >= H) continue;
      const nc = this.chunkAt(nx, nz);
      if (nc && nc[channel][localIndex(nx, ny, nz)] > 0) q.push(pack(nx, ny, nz));
    }
    return q;
  }

  // Light a freshly loaded chunk: sunlight down its columns, its own torches, plus whatever
  // flows in across the borders from neighbours that are already loaded.
  lightChunk(c) {
    const x0 = c.cx * CHUNK, z0 = c.cz * CHUNK;
    const skyQ = [], lightQ = [];
    for (let lz = 0; lz < CHUNK; lz++) for (let lx = 0; lx < CHUNK; lx++) {
      let level = MAX_LIGHT; // open sky above the world
      for (let y = H - 1; y >= 0; y--) {
        const li = localIndex(lx, y, lz);
        const id = c.data[li];
        if (!passes(id)) break;
        level = skyStep(level, true, id);
        if (level <= 0) break;
        c.sky[li] = level;
        skyQ.push(pack(x0 + lx, y, z0 + lz));
      }
    }
    for (let li = 0; li < CHUNK_VOLUME; li++) {
      const e = BLOCKS[c.data[li]]?.light;
      if (e) {
        c.light[li] = e;
        lightQ.push(pack(x0 + (li & 15), li >> 8, z0 + ((li >> 4) & 15)));
      }
    }
    // the border cells of each loaded neighbour that face this chunk
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const n = this.chunks.get(chunkKey(c.cx + dx, c.cz + dz));
      if (!n) continue;
      for (let i = 0; i < CHUNK; i++) for (let y = 0; y < H; y++) {
        const gx = dx === 1 ? x0 + CHUNK : dx === -1 ? x0 - 1 : x0 + i;
        const gz = dz === 1 ? z0 + CHUNK : dz === -1 ? z0 - 1 : z0 + i;
        const li = localIndex(gx, y, gz);
        if (n.sky[li] > 1) skyQ.push(pack(gx, y, gz));
        if (n.light[li] > 1) lightQ.push(pack(gx, y, gz));
      }
    }
    this.spread('sky', skyQ);
    this.spread('light', lightQ);
  }

  // ---------- streaming ----------

  addChunk(cx, cz, data) {
    const c = new Chunk(cx, cz, data);
    this.chunks.set(c.key, c);
    this.lightChunk(c);
    for (let li = 0; li < CHUNK_VOLUME; li++) {
      if (BLOCKS[data[li]]?.grows && this.canGrow(c, li & 15, li >> 8, (li >> 4) & 15)) c.growing.add(li);
    }
    this.dirty.add(c.key);
    return c;
  }

  // Square ring offsets within radius r, nearest first.
  ring(r) {
    if (this.ringCache?.r === r) return this.ringCache.list;
    const list = [];
    for (let dz = -r; dz <= r; dz++) for (let dx = -r; dx <= r; dx++) list.push([dx, dz, dx * dx + dz * dz]);
    list.sort((a, b) => a[2] - b[2]);
    this.ringCache = { r, list };
    return list;
  }

  inWorld(cx, cz) { return cx >= 0 && cz >= 0 && cx < WORLD_CHUNKS && cz < WORLD_CHUNKS; }

  // A chunk can be meshed once its 8 neighbours are loaded (for face culling, AO and light at the edges).
  meshReady(cx, cz) {
    for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
      if (this.inWorld(cx + dx, cz + dz) && !this.chunks.has(chunkKey(cx + dx, cz + dz))) return false;
    }
    return true;
  }

  // Load and mesh chunks around (px, pz) within a time budget; unload far ones.
  update(px, pz, scene, materials, budgetMs = 6, dt = 0) {
    const t0 = performance.now();
    const pcx = Math.floor(px / CHUNK), pcz = Math.floor(pz / CHUNK);
    const R = this.renderDistance;
    // 1. load: one ring wider than we draw, so every drawn chunk has its neighbours
    for (const [dx, dz] of this.ring(R + 1)) {
      if (performance.now() - t0 > budgetMs * 0.5) break;
      const cx = pcx + dx, cz = pcz + dz;
      if (!this.inWorld(cx, cz)) continue;
      const key = chunkKey(cx, cz);
      if (this.chunks.has(key) || this.pending.has(key)) continue;
      if (this.failed.has(key)) {
        if (t0 - this.failed.get(key) < 5000) continue; // retry a failed chunk every 5 s
        this.failed.delete(key);
      }
      if (this.store.has(key)) {
        this.pending.add(key);
        this.store.load(key).then((data) => {
          this.pending.delete(key);
          if (this.disposed || this.chunks.has(key)) return;
          try {
            this.addChunk(cx, cz, data ?? this.generator.generateChunk(cx, cz));
          } catch (err) {
            this.chunks.delete(key);
            this.fail(key, err);
          }
        }, (err) => { this.pending.delete(key); this.fail(key, err); });
      } else {
        try {
          this.addChunk(cx, cz, this.generator.generateChunk(cx, cz));
        } catch (err) {
          this.chunks.delete(key);
          this.fail(key, err);
        }
      }
    }
    // 2. mesh: nearest dirty chunks that are in view distance and have all their neighbours
    if (this.dirty.size) {
      const list = [];
      for (const key of this.dirty) {
        const c = this.chunks.get(key);
        if (!c) { this.dirty.delete(key); continue; }
        const dx = c.cx - pcx, dz = c.cz - pcz;
        if (Math.max(Math.abs(dx), Math.abs(dz)) > R || !this.meshReady(c.cx, c.cz)) continue;
        list.push([dx * dx + dz * dz, c]);
      }
      list.sort((a, b) => a[0] - b[0]);
      for (const [, c] of list) {
        // always mesh at least one chunk so edits show up even when generation is busy
        if (performance.now() - t0 > budgetMs && c !== list[0][1]) break;
        this.dirty.delete(c.key);
        try {
          this.meshChunk(c, scene, materials);
        } catch (err) {
          this.fail(c.key, err);
        }
      }
    }
    // 3. unload (and save) chunks well outside the loaded area, a couple of times a second
    this.unloadTimer -= dt;
    if (this.unloadTimer <= 0) {
      this.unloadTimer = 0.5;
      for (const c of this.chunks.values()) {
        const far = Math.max(Math.abs(c.cx - pcx), Math.abs(c.cz - pcz));
        if (far > R + 3) this.unloadChunk(c, scene);
        else if (far > R && (c.solid || c.water)) this.dropMeshes(c, scene); // out of view: free GPU memory
      }
    }
  }

  // Numbers for the performance overlay.
  stats(px, pz) {
    const pcx = Math.floor(px / CHUNK), pcz = Math.floor(pz / CHUNK), R = this.renderDistance;
    let drawn = 0, waiting = 0;
    for (const c of this.chunks.values()) if (c.solid || c.water) drawn++;
    for (const key of this.dirty) {
      const c = this.chunks.get(key);
      if (c && Math.max(Math.abs(c.cx - pcx), Math.abs(c.cz - pcz)) <= R) waiting++;
    }
    return { loaded: this.chunks.size, drawn, waiting, pending: this.pending.size, failed: this.failed.size };
  }

  // Fraction of chunks within radius r of (px, pz) that are loaded and meshed (for the loading screen).
  readiness(px, pz, r) {
    const pcx = Math.floor(px / CHUNK), pcz = Math.floor(pz / CHUNK);
    let ready = 0, total = 0;
    for (const [dx, dz] of this.ring(r)) {
      const cx = pcx + dx, cz = pcz + dz;
      if (!this.inWorld(cx, cz)) continue;
      total++;
      const c = this.chunks.get(chunkKey(cx, cz));
      if (c && !this.dirty.has(c.key)) ready++;
    }
    return total ? ready / total : 1;
  }

  dropMeshes(c, scene) {
    for (const kind of ['solid', 'water']) {
      if (c[kind]) { scene.remove(c[kind]); c[kind].geometry.dispose(); c[kind] = null; }
    }
    this.dirty.add(c.key); // rebuild if it comes back into view
  }

  unloadChunk(c, scene) {
    if (this.unsaved.has(c.key)) { this.store.save(c.key, c.data); this.unsaved.delete(c.key); }
    this.dropMeshes(c, scene);
    this.dirty.delete(c.key);
    this.chunks.delete(c.key);
    if (this.lastChunk === c) this.lastChunk = null;
  }

  // Write every edited chunk to storage.
  saveChunks() {
    const writes = [];
    for (const key of this.unsaved) {
      const c = this.chunks.get(key);
      if (c) writes.push(this.store.save(key, c.data));
    }
    this.unsaved.clear();
    return Promise.all(writes);
  }

  dispose(scene) {
    this.disposed = true;
    for (const c of this.chunks.values()) this.dropMeshes(c, scene);
    this.chunks.clear();
    this.dirty.clear();
  }

  // ---------- meshing ----------

  meshChunk(c, scene, materials) {
    const geo = this.buildChunkGeometry(c);
    for (const kind of ['solid', 'water']) {
      const g = geo[kind];
      let mesh = c[kind];
      if (mesh) {
        mesh.geometry.dispose();
        if (g) mesh.geometry = g;
        else { scene.remove(mesh); c[kind] = null; }
      } else if (g) {
        mesh = new THREE.Mesh(g, materials[kind]);
        // vertices are chunk-local; the mesh sits at the chunk origin (keeps float precision far from 0)
        mesh.position.set(c.cx * CHUNK, 0, c.cz * CHUNK);
        if (kind === 'water') mesh.renderOrder = 1;
        c[kind] = mesh;
        scene.add(mesh);
      }
    }
  }

  buildChunkGeometry(c) {
    const pos = [], uv = [], col = [], tl = [], sl = [], index = [];
    const wpos = [], wuv = [], wcol = [], wtl = [], wsl = [], windex = [];
    let wcount = 0, vcount = 0;
    const data = c.data;
    const tileUV = 1 / ATLAS_COLS;
    const eps = 0.5 / (TILE * ATLAS_COLS); // half-texel inset to avoid atlas bleeding
    const opaque = (x, y, z) => {
      if (y < 0) return true;
      const id = this.get(x, y, z);
      return id !== AIR && !BLOCKS[id].transparent;
    };
    const x0 = c.cx * CHUNK, z0 = c.cz * CHUNK;
    const waterU = x0 % 64, waterV = z0 % 64; // keeps water UVs small but seamless across chunks
    for (let y = 0; y < H; y++) for (let lz = 0; lz < CHUNK; lz++) for (let lx = 0; lx < CHUNK; lx++) {
      const id = data[localIndex(lx, y, lz)];
      if (id === AIR) continue;
      const x = x0 + lx, z = z0 + lz;
      const def = BLOCKS[id];
      if (id === WATER) {
        const surface = this.get(x, y + 1, z) !== WATER;
        for (const f of FACES) {
          if (f.n[1] < 0 && y === 0) continue;
          const nid = this.get(x + f.n[0], y + f.n[1], z + f.n[2]);
          if (nid === WATER || (nid !== AIR && !BLOCKS[nid].transparent)) continue;
          for (const cr of f.corners) {
            const top = cr.o[1] === 1 && surface ? WATER_TOP : cr.o[1];
            const px = lx + cr.o[0], py = y + top, pz = lz + cr.o[2];
            wpos.push(px, py, pz);
            // world-space UVs (wrapped every 64 blocks) so the texture tiles seamlessly and can scroll
            const ux = waterU + px, uz = waterV + pz;
            if (f.d === 1) wuv.push(ux, uz); else if (f.d === 0) wuv.push(uz, py); else wuv.push(ux, py);
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
        vcount = this.addTorch(lx, y, lz, def, pos, uv, col, tl, sl, index, vcount);
        continue;
      }
      if (def.shape === 'model') {
        vcount = this.addModel(lx, y, lz, def, lightBrightness(this.lightAt(x, y, z)), skyBrightness(this.skyAt(x, y, z)),
          pos, uv, col, tl, sl, index, vcount);
        continue;
      }
      if (def.shape === 'cross') {
        vcount = this.addCross(lx, y, lz, def, lightBrightness(this.lightAt(x, y, z)), skyBrightness(this.skyAt(x, y, z)),
          pos, uv, col, tl, sl, index, vcount);
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
        // (blocks with a front, like ovens, show it on the side that faces their `facing` direction)
        const tile = f.d === 1 ? (f.s > 0 ? def.top : def.bottom) : def.front !== null && f.dir === def.facing ? def.front : def.side;
        const tu = (tile % ATLAS_COLS) * tileUV;
        const tvTop = 1 - Math.floor(tile / ATLAS_COLS) * tileUV;
        const ao = [0, 0, 0, 0];
        for (let k = 0; k < 4; k++) {
          const cr = f.corners[k];
          pos.push(lx + cr.o[0], y + cr.o[1], lz + cr.o[2]);
          uv.push(
            tu + eps + cr.uv[0] * (tileUV - 2 * eps),
            tvTop - tileUV + eps + cr.uv[1] * (tileUV - 2 * eps),
          );
          const s1 = opaque(x + cr.a[0], y + cr.a[1], z + cr.a[2]) ? 1 : 0;
          const s2 = opaque(x + cr.b[0], y + cr.b[1], z + cr.b[2]) ? 1 : 0;
          const cc = opaque(x + cr.c[0], y + cr.c[1], z + cr.c[2]) ? 1 : 0;
          const a = s1 && s2 ? 0 : 3 - (s1 + s2 + cc);
          ao[k] = a;
          const b = toLinear(f.shade * AO_LEVELS[a]);
          col.push(b, b, b);
          // smooth light: average the open cells around this corner, in front of the face
          let sum = this.lightAt(nx, ny, nz), sun = this.skyAt(nx, ny, nz), n = 1;
          if (!s1) { sum += this.lightAt(x + cr.a[0], y + cr.a[1], z + cr.a[2]); sun += this.skyAt(x + cr.a[0], y + cr.a[1], z + cr.a[2]); n++; }
          if (!s2) { sum += this.lightAt(x + cr.b[0], y + cr.b[1], z + cr.b[2]); sun += this.skyAt(x + cr.b[0], y + cr.b[1], z + cr.b[2]); n++; }
          if (!cc && !(s1 && s2)) { sum += this.lightAt(x + cr.c[0], y + cr.c[1], z + cr.c[2]); sun += this.skyAt(x + cr.c[0], y + cr.c[1], z + cr.c[2]); n++; }
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
    const geo = (p, u, cl, t, sk, i) => {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3));
      g.setAttribute('uv', new THREE.Float32BufferAttribute(u, 2));
      g.setAttribute('color', new THREE.Float32BufferAttribute(cl, 3));
      g.setAttribute('torch', new THREE.Float32BufferAttribute(t, 1));
      g.setAttribute('sky', new THREE.Float32BufferAttribute(sk, 1));
      g.setIndex(i);
      g.computeBoundingSphere();
      return g;
    };
    return {
      solid: vcount ? geo(pos, uv, col, tl, sl, index) : null,
      water: wcount ? geo(wpos, wuv, wcol, wtl, wsl, windex) : null,
    };
  }

  // Furniture: a list of boxes (in 1/16 block), each face textured with the matching part of its tile,
  // so a thin table leg shows a thin strip of planks. (x, y, z) are chunk-local.
  addModel(x, y, z, def, torch, sky, pos, uv, col, tl, sl, index, vcount) {
    const tileUV = 1 / ATLAS_COLS;
    const inset = 0.5 / TILE; // keep samples inside the tile
    const clampUV = (t) => Math.min(1 - inset, Math.max(inset, t));
    for (const [x0, y0, z0, x1, y1, z1, tiles, glow] of def.model) {
      const lo = [x0 / 16, y0 / 16, z0 / 16], size = [(x1 - x0) / 16, (y1 - y0) / 16, (z1 - z0) / 16];
      for (const f of FACES) {
        const tile = typeof tiles === 'number' ? tiles : f.d === 1 ? (f.s > 0 ? tiles.top : tiles.bottom) : tiles.side;
        const tu = (tile % ATLAS_COLS) * tileUV;
        const tv0 = 1 - Math.floor(tile / ATLAS_COLS) * tileUV - tileUV;
        const b = toLinear(f.shade);
        for (const c of f.corners) {
          const px = lo[0] + c.o[0] * size[0], py = lo[1] + c.o[1] * size[1], pz = lo[2] + c.o[2] * size[2];
          pos.push(x + px, y + py, z + pz);
          const [u, v] = f.d === 1 ? [px, pz] : f.d === 0 ? [pz, py] : [px, py];
          uv.push(tu + clampUV(u) * tileUV, tv0 + clampUV(v) * tileUV);
          col.push(b, b, b);
          tl.push(glow ? 1 : torch);
          sl.push(glow ? 1 : sky);
        }
        index.push(vcount, vcount + 1, vcount + 2, vcount, vcount + 2, vcount + 3);
        vcount += 4;
      }
    }
    return vcount;
  }

  // Plants: two sprites crossed diagonally through the block, visible from both sides.
  // (x, y, z) are chunk-local; torch and sky are the light levels in the plant's own cell.
  addCross(x, y, z, def, torch, sky, pos, uv, col, tl, sl, index, vcount) {
    const tileUV = 1 / ATLAS_COLS;
    const tu = (def.side % ATLAS_COLS) * tileUV;
    const tv0 = 1 - Math.floor(def.side / ATLAS_COLS) * tileUV - tileUV;
    const a = 0.12, b = 0.88; // inset from the block corners
    const b2 = toLinear(0.88);
    for (const [x1, z1, x2, z2] of [[a, a, b, b], [b, a, a, b]]) {
      const corners = [[x1, 0, z1, 0, 0], [x2, 0, z2, 1, 0], [x2, 1, z2, 1, 1], [x1, 1, z1, 0, 1]];
      for (const [cx, cy, cz, u, v] of corners) {
        pos.push(x + cx, y + cy, z + cz);
        uv.push(tu + u * tileUV, tv0 + v * tileUV);
        col.push(b2, b2, b2);
        tl.push(torch);
        sl.push(sky);
      }
      // both windings, so the sprite shows from either side
      index.push(vcount, vcount + 1, vcount + 2, vcount, vcount + 2, vcount + 3);
      index.push(vcount, vcount + 2, vcount + 1, vcount, vcount + 3, vcount + 2);
      vcount += 4;
    }
    return vcount;
  }

  // A torch is a 2x10-pixel stick. Wall torches sit low against the wall and lean out of it.
  // (x, y, z) here are chunk-local.
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

  // Voxel DDA raycast. Returns { x, y, z, id, nx, ny, nz, t } for the first solid block hit (water is ignored);
  // t is the distance along the ray. With solidOnly, walk-through blocks (plants, torches) are skipped too.
  raycast(origin, dir, maxDist, solidOnly = false) {
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
      if (id !== AIR && id !== WATER && (!solidOnly || BLOCKS[id].solid)) return { x, y, z, id, nx, ny, nz, t };
      if (tmx < tmy && tmx < tmz) { x += sx; t = tmx; tmx += tdx; nx = -sx; ny = 0; nz = 0; }
      else if (tmy < tmz) { y += sy; t = tmy; tmy += tdy; nx = 0; ny = -sy; nz = 0; }
      else { z += sz; t = tmz; tmz += tdz; nx = 0; ny = 0; nz = -sz; }
    }
    return null;
  }
}
