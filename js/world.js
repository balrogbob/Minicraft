// Streaming voxel world: chunks are generated (or loaded) around the player and unloaded behind,
// with block light and sunlight flowing across chunk borders, chunk meshing and raycasting.
import * as THREE from 'three';
import {
  BLOCKS, AIR, LEAVES, LOG, isLeaves, FRUIT_SAPLING, FRUITS, fruitLeaves, saplingLeaves, GLASS, DIRT, GRASS, WATER, MAX_LIGHT, SUGAR_CANE, MAX_CANE_HEIGHT,
  PUMPKIN, isWheat, WATER_FLOW, WATER_FALL, WATER_WHEEL, isWaterId, isFlowing, waterLevel, LAVA, OBSIDIAN, COBBLE, PIPE, PUMP, SPOUT, T, FLOWERS, isFlower, FACING_DIRS,
} from './blocks.js';

// Water wheels let water run through their cell (and over them); see waterAt().
const isWheel = (id) => id === WATER_WHEEL || id === WATER_WHEEL + 1;
const MOULD_SECONDS = 60; // (v33) seconds, on average, for each step of chocolate setting in a mould
const TAP_SECONDS = 90; // (v32) seconds, on average, for a tree tap to fill another level of latex
import { TILE, ATLAS_COLS } from './textures.js';
import { Generator, CHUNK, H, SEA_LEVEL, WORLD_SIZE, WORLD_CHUNKS, CHUNK_VOLUME, localIndex } from './terrain.js';

export { CHUNK, H, SEA_LEVEL, WORLD_SIZE, WORLD_CHUNKS };

const WATER_TOP = 0.875; // surface sits a little below the block top
const WHEEL_STREAM = 0.3; // water running through a water wheel's cell is drawn as a shallow stream under it

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

// Torch light level (0-15, up to 22 for a mirror lamp) -> linear brightness, falling off ~17% per block.
const LIGHT_CURVE = Array.from({ length: 24 * 4 + 1 }, (_, i) => {
  const level = i / 4;
  return level <= 0 ? 0 : toLinear(Math.pow(0.83, 14 - Math.min(14, level)));
});
export const lightBrightness = (level) => LIGHT_CURVE[Math.min(96, Math.round(level * 4))];

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
  return down && level === MAX_LIGHT && !isLeaves(id) && !isWaterId(id) ? MAX_LIGHT : level - 1;
}

// The nearest of a block's boxes (in 1/16 block) hit by a ray: { t, n: the face's normal } or null.
function rayBoxes(o, d, x, y, z, boxes, maxDist) {
  let best = null;
  const oo = [o.x, o.y, o.z], dd = [d.x, d.y, d.z];
  for (const b of boxes) {
    const min = [x + b[0] / 16, y + b[1] / 16, z + b[2] / 16], max = [x + b[3] / 16, y + b[4] / 16, z + b[5] / 16];
    let t0 = 0, t1 = maxDist, axis = -1, ok = true;
    for (let a = 0; a < 3 && ok; a++) {
      if (Math.abs(dd[a]) < 1e-9) { if (oo[a] < min[a] || oo[a] > max[a]) ok = false; continue; }
      let ta = (min[a] - oo[a]) / dd[a], tb = (max[a] - oo[a]) / dd[a];
      if (ta > tb) [ta, tb] = [tb, ta];
      if (ta > t0) { t0 = ta; axis = a; }
      t1 = Math.min(t1, tb);
      if (t0 > t1) ok = false;
    }
    if (!ok || (best && t0 >= best.t)) continue;
    const n = [0, 0, 0];
    if (axis >= 0) n[axis] = -Math.sign(dd[axis]);
    best = { t: t0, n };
  }
  return best;
}

const NEIGHBOURS = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
const SIDES = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const passes = (id) => id === AIR || BLOCKS[id].transparent;

class Chunk {
  constructor(cx, cz, data) {
    this.cx = cx;
    this.cz = cz;
    this.key = chunkKey(cx, cz);
    this.data = data;
    this.light = new Uint8Array(CHUNK_VOLUME); // torch light
    this.tint = new Uint8Array(CHUNK_VOLUME); // the colour of that light (see TINTS in blocks.js)
    this.sky = new Uint8Array(CHUNK_VOLUME); // sunlight
    this.solid = null; // meshes
    this.water = null;
    this.growing = new Set(); // local indices of plants that can still grow
    this.machines = new Set(); // local indices of water wheels, shafts, gears and crushers
    this.hives = new Set(); // local indices of bee hives
    this.logic = new Set(); // local indices of wires and logic blocks (see logic.js)
  }
}

// Average seconds between growth steps for each kind of plant (only while its chunk is loaded).
// Average seconds for a plant to grow a step (a game day is 12 minutes): a crop ripens in about a day, a
// sapling becomes a tree in a day or so, and fruit takes most of a day to ripen.
const GROW_SECONDS = { wheat: 240, cane: 300, tree: 900, fruit: 600 };
const GROW_MAX_CHANCE = 0.5; // (no plant grows more than one step at a time, however much time has passed)
const SOIL_REST_DAYS = 6; // a season: soil left this long without the same crop has rested
// Leaves with no log within this many steps (through other leaves) decay.
const LEAF_REACH = 4;

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
    this.wheelWater = new Map(); // packed position -> water id running through a water wheel there
    this.flowTimer = 0;
    this.renderDistance = 6; // in chunks
    this.lastChunk = null;
    this.unloadTimer = 0;
    this.keepLoaded = new Set(); // "cx,cz" of chunks kept loaded however far away they are (v30: drone pads)
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

  isWater(x, y, z) { return isWaterId(this.waterAt(x, y, z)); }

  // The water in a cell: the block itself, except that a water wheel's cell can hold flowing water too
  // (kept in wheelWater rather than in the block data).
  waterAt(x, y, z) {
    const id = this.get(x, y, z);
    return isWheel(id) ? this.wheelWater.get(pack(x, y, z)) ?? AIR : id;
  }

  lightAt(x, y, z) {
    if (y < 0 || y >= H) return 0;
    const c = this.chunkAt(x, z);
    return c ? c.light[localIndex(x, y, z)] : 0;
  }

  // The colour of the torch light in a cell (an index into TINTS).
  tintAt(x, y, z) {
    if (y < 0 || y >= H) return 0;
    const c = this.chunkAt(x, z);
    return c ? c.tint[localIndex(x, y, z)] : 0;
  }

  // Torch light for a vertex: its brightness (0..1), plus twice its colour index (decoded by the shader).
  torchAt(x, y, z) { return lightBrightness(this.lightAt(x, y, z)) + 2 * this.tintAt(x, y, z); }

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
    // lava and water that touch cool into obsidian
    // (v28: running water that reaches lava turns to cobblestone and leaves the lava be: break it and more
    // forms, so a block breaker there makes endless cobble)
    if (isFlowing(id) && NEIGHBOURS.some(([dx, dy, dz]) => this.get(x + dx, y + dy, z + dz) === LAVA)) id = COBBLE;
    else if (id === LAVA || isWaterId(id)) {
      for (const [dx, dy, dz] of NEIGHBOURS) {
        const n = this.get(x + dx, y + dy, z + dz);
        if (id === LAVA && isWaterId(n)) { id = OBSIDIAN; break; }
        if (id !== LAVA && n === LAVA) this.setBlock(x + dx, y + dy, z + dz, OBSIDIAN);
      }
    }
    const li = localIndex(x, y, z), old = c.data[li];
    c.data[li] = id;
    if (isWheel(old) && !isWheel(id)) this.wheelWater.delete(pack(x, y, z));
    // losing a log (or a leaf) may leave nearby leaves with nothing holding them up
    if (old === LOG && id !== LOG) this.checkLeavesAround(x, y, z, LEAF_REACH);
    else if (isLeaves(old) && !isLeaves(id)) this.checkLeavesAround(x, y, z, 1);
    this.unsaved.add(c.key);
    this.markCellDirty(x, z);
    this.updateLight(x, y, z);
    // water nearby may now flow in, or drain away
    this.flow.push([x, y, z], [x + 1, y, z], [x - 1, y, z], [x, y + 1, z], [x, y - 1, z], [x, y, z + 1], [x, y, z - 1]);
    const def = BLOCKS[id];
    const isMachine = (d) => !!(d?.kinetic || d?.machine || d?.hopper || d?.sensor || d?.painting || d?.ejector || d?.farm || d?.electric || d?.spawner);
    if (isMachine(def)) c.machines.add(li); else c.machines.delete(li);
    if (isMachine(BLOCKS[old]) || isMachine(def)) this.machinesChanged = true;
    if (BLOCKS[old]?.electric || def?.electric) this.electricChanged = true;
    if (def?.hive >= 0) c.hives.add(li); else c.hives.delete(li);
    if (def?.logic) c.logic.add(li); else c.logic.delete(li);
    // this cell, and the one below (a sugar cane that's no longer, or now is, the top), may start or stop growing
    this.refreshGrowth(c, x, y, z);
    if (y > 0) this.refreshGrowth(c, x, y - 1, z);
  }

  // ---------- fences, panes and collision ----------

  // Does a fence or pane at (x, y, z) reach out toward its neighbour at (nx, y, nz)?
  joins(def, nx, y, nz) {
    const n = BLOCKS[this.get(nx, y, nz)];
    if (!n || n.id === AIR) return false;
    if (n.shape === def.shape) return true;
    if ((def.shape === 'fence' || def.shape === 'wall') && n.gate) return true;
    return n.shape === 'cube' && n.solid && (def.shape === 'pane' || !n.transparent);
  }

  // The model of a fence or pane, with arms toward whatever it joins.
  joinedModel(x, y, z, def) {
    const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dz]) => this.joins(def, x + dx, y, z + dz));
    const arm = (dx, dz, a, b, y0, y1, tile) => {
      const [lo, hi] = dx > 0 ? [b, 16] : dx < 0 ? [0, a] : dz > 0 ? [b, 16] : [0, a];
      return dx ? [lo, y0, 7, hi, y1, 9, tile] : [7, y0, lo, 9, y1, hi, tile];
    };
    if (def.shape === 'fence') {
      const post = def.postTex ?? T.PLANKS, rail = def.armTex ?? T.PLANKS, [r0, r1] = def.armTex ? [7, 8] : [6, 8]; // (an electric fence's wires are thin)
      const m = [[6, 0, 6, 10, 16, 10, post]];
      for (const [dx, dz] of dirs) m.push(arm(dx, dz, 6, 10, r0, r1, rail), arm(dx, dz, 6, 10, r0 + 6, r1 + 6, rail), ...(def.armTex ? [arm(dx, dz, 6, 10, r0 + 3, r1 + 3, rail)] : []));
      return m;
    }
    if (def.shape === 'wall') {
      // a thick post (left out where the wall just runs straight through), and a wall toward each neighbour
      const tex = def.wallTex, straight = dirs.length === 2 && dirs[0][0] === -dirs[1][0] && dirs[0][1] === -dirs[1][1];
      const up = this.get(x, y + 1, z) !== AIR;
      const m = straight && !up ? [] : [[4, 0, 4, 12, 16, 12, tex]];
      const wide = (dx, dz) => {
        const [lo, hi] = dx > 0 ? [straight ? 8 : 12, 16] : dx < 0 ? [0, straight ? 8 : 4] : dz > 0 ? [straight ? 8 : 12, 16] : [0, straight ? 8 : 4];
        const top = up ? 16 : 14;
        return dx ? [lo, 0, 5, hi, top, 11, tex] : [5, 0, lo, 11, top, hi, tex];
      };
      for (const [dx, dz] of dirs) m.push(wide(dx, dz));
      if (!dirs.length && !m.length) m.push([4, 0, 4, 12, 16, 12, tex]);
      return m;
    }
    const glass = def.paneTex ?? T.GLASS;
    const m = [[7, 0, 7, 9, 16, 9, glass]];
    for (const [dx, dz] of dirs) m.push(arm(dx, dz, 7, 9, 0, 16, glass));
    return m;
  }

  // Copper wire: a dot in the middle, with a strip out to each wire or switch it touches, to wires a
  // block lower, and up the side of a block to wires on top of it.
  wireModel(x, y, z, def) {
    const t = def.wireTex ? def.wireTex[def.on ? 1 : 0] : def.electric ? (def.on ? T.ELWIRE_ON : T.ELWIRE_OFF) : def.on ? T.WIRE_ON : T.WIRE_OFF, m = [[6.5, 0, 6.5, 9.5, 1, 9.5, t]];
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const n = BLOCKS[this.get(x + dx, y, z + dz)];
      // (electrum wire also runs up to the electric machines beside it)
      if (def.electric && n?.electric && !n.switch) { m.push(dx > 0 ? [9.5, 0, 6.5, 16, 1, 9.5, t] : dx < 0 ? [0, 0, 6.5, 6.5, 1, 9.5, t] : dz > 0 ? [6.5, 0, 9.5, 9.5, 1, 16, t] : [6.5, 0, 0, 9.5, 1, 6.5, t]); continue; }
      const up = BLOCKS[this.get(x + dx, y + 1, z + dz)]?.logic === 'wire' && !BLOCKS[this.get(x, y + 1, z)]?.solid;
      const down = BLOCKS[this.get(x + dx, y - 1, z + dz)]?.logic === 'wire' && !n?.solid;
      if (!(n?.switch || up || down)) continue;
      m.push(dx > 0 ? [9.5, 0, 6.5, 16, 1, 9.5, t] : dx < 0 ? [0, 0, 6.5, 6.5, 1, 9.5, t] : dz > 0 ? [6.5, 0, 9.5, 9.5, 1, 16, t] : [6.5, 0, 0, 9.5, 1, 6.5, t]);
      if (up) m.push(dx > 0 ? [15, 0, 6.5, 16, 16, 9.5, t] : dx < 0 ? [0, 0, 6.5, 1, 16, 9.5, t] : dz > 0 ? [6.5, 0, 15, 9.5, 16, 16, t] : [6.5, 0, 0, 9.5, 16, 1, t]);
    }
    return m;
  }

  // Stairs turn their corners: a stair whose high side backs onto another stair at right angles becomes an
  // outside corner (just a quarter up high); one whose low side meets one at right angles, an inside corner.
  stairModel(x, y, z, def) {
    const tex = def.model[0][6], f = def.facing;
    const [fx, fz] = FACING_DIRS[f];
    const half = (dx, dz) => [dx > 0 ? 8 : 0, dx < 0 ? 8 : 16, dz > 0 ? 8 : 0, dz < 0 ? 8 : 16];
    const box = ([x0, x1, z0, z1]) => [x0, 8, z0, x1, 16, z1, tex];
    const meet = (a, b) => [Math.max(a[0], b[0]), Math.min(a[1], b[1]), Math.max(a[2], b[2]), Math.min(a[3], b[3])];
    const m = [[0, 0, 0, 16, 8, 16, tex]];
    const back = half(-fx, -fz);
    const behind = BLOCKS[this.get(x - fx, y, z - fz)], ahead = BLOCKS[this.get(x + fx, y, z + fz)];
    const across = (n) => n?.stair && n.facing % 2 !== f % 2;
    if (across(behind)) {
      const [gx, gz] = FACING_DIRS[behind.facing];
      m.push(box(meet(back, half(-gx, -gz))));
    } else if (across(ahead)) {
      const [gx, gz] = FACING_DIRS[ahead.facing];
      m.push(box(back), box(meet(half(fx, fz), half(-gx, -gz))));
    } else m.push(box(back));
    return m;
  }

  // Fences and shut gates are too tall to step or jump onto.
  isTall(x, y, z) {
    const def = BLOCKS[this.get(x, y, z)];
    return def?.shape === 'fence' || def?.shape === 'wall' || (def?.gate && !def.open);
  }

  // What the player bumps into in a cell, as [x0, y0, z0, x1, y1, z1] boxes in world units (or null).
  // Unloaded chunks and the world floor are solid.
  collisionBoxes(x, y, z) {
    if (y < 0) return [[x, y, z, x + 1, y + 1, z + 1]];
    if (y >= H) return null;
    const c = this.chunkAt(x, z);
    if (!c) return [[x, y, z, x + 1, y + 1, z + 1]];
    const def = BLOCKS[c.data[localIndex(x, y, z)]];
    if (!def || !def.solid) return null;
    let boxes = def.stair ? this.stairModel(x, y, z, def).map((b) => b.slice(0, 6)) : def.boxes;
    if (def.shape === 'fence' || def.shape === 'pane' || def.shape === 'wall') {
      // tall for fences and walls (you can't hop over), with arms toward what they join so there's no gap
      const top = def.shape === 'pane' ? 16 : 24, t = def.shape === 'fence' ? [6, 10] : def.shape === 'wall' ? [4, 12] : [7, 9];
      boxes = [[t[0], 0, t[0], t[1], top, t[1]]];
      for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        if (!this.joins(def, x + dx, y, z + dz)) continue;
        boxes.push(dx > 0 ? [t[1], 0, t[0], 16, top, t[1]] : dx < 0 ? [0, 0, t[0], t[0], top, t[1]]
          : dz > 0 ? [t[0], 0, t[1], t[1], top, 16] : [t[0], 0, 0, t[1], top, t[0]]);
      }
    }
    if (!boxes) return [[x, y, z, x + 1, y + 1, z + 1]];
    return boxes.map(([a, b, cc, d, e, f]) => [x + a / 16, y + b / 16, z + cc / 16, x + d / 16, y + e / 16, z + f / 16]);
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
    // bees: crops near a hive grow faster
    const hives = this.hiveList();
    const nearHive = (x, y, z) => hives.some(([hx, hy, hz]) => Math.abs(hx - x) + Math.abs(hz - z) <= 10 && Math.abs(hy - y) <= 6);
    const season = this.growthRate ?? 1;
    for (const c of this.chunks.values()) {
      if (!c.growing.size) continue;
      for (const li of [...c.growing]) {
        const id = c.data[li];
        const def = BLOCKS[id];
        const x = c.cx * CHUNK + (li & 15), z = c.cz * CHUNK + ((li >> 4) & 15), y = li >> 8;
        if (def.grows === 'fill') {
          // a cauldron out in the rain slowly fills up
          if (this.raining && this.skyAt(x, y + 1, z) >= MAX_LIGHT && Math.random() < elapsed / 25) this.setBlock(x, y, z, id + 1);
          continue;
        }
        if (def.grows === 'honey') { this.tickHive(x, y, z, id, elapsed); continue; }
        if (def.grows === 'latex') { this.tickTap(x, y, z, id, elapsed); continue; }
        if (def.grows === 'setting') { this.tickMould(x, y, z, id, elapsed); continue; }
        if (def.grows === 'fruit') { this.tickFruit(x, y, z, def, elapsed); continue; }
        const tired = def.crop || isWheat(id) ? this.soilFactor(x, y - 1, z) : 1;
        // plants grow faster in the rain, near bees, watered, and with the seasons
        // under glass (a greenhouse) crops grow as well in winter as in spring
        const grow = season < 1 && this.underGlass(x, y, z) ? 1.25 : season;
        const secs = def.grows === 'up' ? GROW_SECONDS.cane : def.grows === 'tree' ? GROW_SECONDS.tree : GROW_SECONDS.wheat;
        let chance = elapsed * (this.raining ? 1.5 : 1) * grow / secs;
        if (hives.length && nearHive(x, y, z)) chance *= 1.25;
        chance *= tired; // worn-out soil (the same crop over and over) grows slowly
        if (this.sprinkled?.some(([sx, sy, sz]) => Math.abs(sx - x) <= 2 && Math.abs(sz - z) <= 2 && sy - y >= 0 && sy - y <= 2)) chance *= 1.5; // watered
        // (v34) coffee and chillies grow only in warm land or under glass; rice only with water beside its ground
        if (def.crop?.needs === 'warm' && !this.warmLand(x, z) && !this.underGlass(x, y, z)) continue;
        if (def.crop?.needs === 'water' && ![[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => isWaterId(this.get(x + dx, y - 1, z + dz)))) continue;
        if (Math.random() >= Math.min(GROW_MAX_CHANCE, chance)) continue;
        if (def.grows === 'up') this.setBlock(x, y + 1, z, SUGAR_CANE);
        else if (def.grows === 'pumpkin') this.growPumpkin(x, y, z);
        else if (def.grows === 'tree') {
          const leaves = saplingLeaves(id); // a fruit (or cocoa) tree is a little shorter
          if (leaves) this.growTree(x, y, z, 3 + Math.floor(Math.random() * 2), leaves); else this.growTree(x, y, z);
        }
        else this.setBlock(x, y, z, def.grows);
      }
    }
  }

  // A pumpkin vine sets a pumpkin on open ground beside it (one at a time).
  growPumpkin(x, y, z) {
    const sides = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    if (sides.some(([dx, dz]) => this.get(x + dx, y, z + dz) === PUMPKIN)) return false;
    const free = sides.filter(([dx, dz]) => this.get(x + dx, y, z + dz) === AIR && [GRASS, DIRT].includes(this.get(x + dx, y - 1, z + dz)));
    if (!free.length) return false;
    const [dx, dz] = free[Math.floor(Math.random() * free.length)];
    this.setBlock(x + dx, y, z + dz, PUMPKIN);
    return true;
  }

  // ---------- crop rotation ----------
  // Each patch of soil remembers what was last planted in it. Planting the same crop again tires it (up to 3);
  // something different, a season left fallow, or fertiliser freshens it up. `day` is set by the game.
  planted(x, y, z, kind) {
    this.soil ??= new Map();
    const k = `${x},${y},${z}`, was = this.soil.get(k), day = this.day ?? 1;
    let tired = 0;
    // (beans never tire the soil: they feed it, and whatever follows them grows faster)
    if (was && was.kind === kind && kind !== 'bean' && day - was.day < SOIL_REST_DAYS) tired = Math.min(3, was.tired + 1);
    const rich = !!was && was.kind === 'bean' && kind !== 'bean';
    this.soil.set(k, rich ? { kind, tired, day, rich } : { kind, tired, day });
    if (this.soil.size > 6000) this.soil.delete(this.soil.keys().next().value);
    return tired;
  }
  soilTired(x, y, z) { return this.soil?.get(`${x},${y},${z}`)?.tired ?? 0; }
  soilFactor(x, y, z) { return this.soil?.get(`${x},${y},${z}`)?.rich ? 1.4 : [1, 0.7, 0.5, 0.35][this.soilTired(x, y, z)]; }
  soilRich(x, y, z) { return !!this.soil?.get(`${x},${y},${z}`)?.rich; }
  restSoil(x, y, z) { const e = this.soil?.get(`${x},${y},${z}`); if (!e || !e.tired) return false; e.tired = 0; return true; }

  isFlowerAt(x, y, z) { return isFlower(this.get(x, y, z)); }

  // Is the first thing above (x, y, z), within 8 blocks, glass? (Plain or stained glass, or a glass pane.)
  underGlass(x, y, z) {
    for (let ty = y + 1; ty <= y + 8 && ty < H; ty++) {
      const id = this.get(x, ty, z);
      if (id === AIR) continue;
      const d = BLOCKS[id];
      return id === GLASS || d.name?.includes('Glass') || false;
    }
    return false;
  }

  // A fruit tree's leaves: about one in four bears fruit in summer and autumn; ripe fruit falls in winter.
  // (v33) Cocoa pods ripen in spring, summer and autumn, a third as fast, and don't fall in winter.
  tickFruit(x, y, z, def, elapsed) {
    const s = this.season ?? 0, f = def.fruit;
    if (f.ripe) {
      if (s === 3 && !f.tropical && Math.random() < elapsed / 60) this.setBlock(x, y, z, f.bare);
      return;
    }
    if ((f.tropical ? s === 3 : s !== 1 && s !== 2) || ((x * 7 + y * 13 + z * 31) & 3) !== 0) return;
    if (Math.random() < Math.min(GROW_MAX_CHANCE, elapsed * (this.raining ? 1.5 : 1) / (GROW_SECONDS.fruit * (f.tropical ? 3 : 1)))) this.setBlock(x, y, z, f.ripeId);
  }

  // Every loaded bee hive, as [x, y, z].
  hiveList() {
    const out = [];
    for (const c of this.chunks.values()) for (const li of c.hives) out.push([c.cx * CHUNK + (li & 15), li >> 8, c.cz * CHUNK + ((li >> 4) & 15)]);
    return out;
  }

  // A hive slowly fills with honey: faster with flowers around it (and slower in winter). As the bees
  // work, now and then a new flower springs up on the grass nearby.
  // A tree tap fills with latex while it's against a tree trunk: a level about every minute and a half (slower
  // in the cold of the year; in winter hardly at all).
  tapOnTree(x, y, z) { return [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => this.get(x + dx, y, z + dz) === LOG); }
  tickTap(x, y, z, id, elapsed) {
    if (!this.tapOnTree(x, y, z)) return;
    if (Math.random() < elapsed * Math.max(0.1, this.growthRate ?? 1) / TAP_SECONDS) this.setBlock(x, y, z, id + 1);
  }

  // (v33) Chocolate in a mould sets in two steps, about a minute each; twice as fast somewhere cold (snowy land,
  // winter, or ice or snow beside it), and half as fast beside something hot (lava or a fire).
  // (v34) the deserts and the warm land by them
  warmLand(x, z) { return this.generator?.biomeAt(x, z) === 'desert' || !!this.generator?.isCocoaLand(x, z); }
  mouldChill(x, y, z) {
    let k = 1;
    const near = [[1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1], [0, -1, 0]].map(([dx, dy, dz]) => BLOCKS[this.get(x + dx, y + dy, z + dz)]);
    if ((this.season ?? 0) === 3 || this.generator?.biomeAt?.(x, z) === 'tundra' || near.some((d) => /Ice|Snow/.test(d?.name ?? ''))) k = 2;
    if (near.some((d) => d?.lit || /Lava|Fire|Furnace|Oven/.test(d?.name ?? ''))) k *= 0.5;
    return k;
  }
  tickMould(x, y, z, id, elapsed) {
    if (Math.random() < elapsed * this.mouldChill(x, y, z) / MOULD_SECONDS) this.setBlock(x, y, z, id + 1);
  }

  tickHive(x, y, z, id, elapsed) {
    const key = `${x},${y},${z}`;
    this.hiveFlowers ??= new Map();
    let f = this.hiveFlowers.get(key);
    if (!f || f.t < performance.now() - 30000) {
      let n = 0;
      for (let dy = -4; dy <= 2; dy++) for (let dz = -5; dz <= 5; dz++) for (let dx = -5; dx <= 5; dx++) if (isFlower(this.get(x + dx, y + dy, z + dz))) n++;
      f = { n, t: performance.now() };
      this.hiveFlowers.set(key, f);
    }
    const chance = elapsed * (1 + Math.min(8, f.n) / 2) * Math.max(0.3, this.growthRate ?? 1) / 240;
    if (Math.random() >= chance) return;
    this.setBlock(x, y, z, id + 1);
    if (Math.random() < 0.5) {
      const fx = x + Math.round((Math.random() - 0.5) * 8), fz = z + Math.round((Math.random() - 0.5) * 8);
      for (let fy = y + 2; fy >= y - 6; fy--) {
        if (this.get(fx, fy, fz) === GRASS) {
          if (this.get(fx, fy + 1, fz) === AIR) this.setBlock(fx, fy + 1, fz, FLOWERS[Math.floor(Math.random() * FLOWERS.length)].id);
          break;
        }
        if (this.get(fx, fy, fz) !== AIR) break;
      }
    }
  }

  // A sapling at (x, y, z) grows into a tree, if there's room for the trunk and it's on grass or dirt.
  // Returns true if it grew. Same shape as the trees in the generated world.
  growTree(x, y, z, trunk = 4 + Math.floor(Math.random() * 3), leaf = LEAVES) {
    const ground = this.get(x, y - 1, z);
    if (ground !== GRASS && ground !== DIRT) return false;
    const top = y + trunk - 1;
    if (top + 2 >= H) return false;
    for (let ty = y + 1; ty <= top + 1; ty++) if (this.get(x, ty, z) !== AIR) return false;
    this.setBlock(x, y - 1, z, DIRT);
    for (let ty = y; ty <= top; ty++) this.setBlock(x, ty, z, LOG);
    for (let ly = top - 2; ly <= top + 1; ly++) {
      const r = ly >= top ? 1 : 2;
      for (let dz = -r; dz <= r; dz++) for (let dx = -r; dx <= r; dx++) {
        const corner = Math.abs(dx) === r && Math.abs(dz) === r;
        if (corner && (ly === top + 1 || Math.random() < 0.5)) continue;
        if (this.get(x + dx, ly, z + dz) === AIR && this.chunkAt(x + dx, z + dz)) this.setBlock(x + dx, ly, z + dz, leaf);
      }
    }
    return true;
  }

  // ---------- leaf decay ----------

  // Queue the leaves within `r` of (x, y, z) to be checked a moment from now (staggered, so a cut
  // tree's crown thins out over a few seconds rather than vanishing at once).
  checkLeavesAround(x, y, z, r) {
    this.decay ??= new Map();
    for (let dy = -r; dy <= r; dy++) for (let dz = -r; dz <= r; dz++) for (let dx = -r; dx <= r; dx++) {
      if (r === 1 && Math.abs(dx) + Math.abs(dy) + Math.abs(dz) !== 1) continue; // just the 6 neighbours
      const lx = x + dx, ly = y + dy, lz = z + dz;
      if (!isLeaves(this.get(lx, ly, lz))) continue;
      const key = `${lx},${ly},${lz}`;
      if (!this.decay.has(key)) this.decay.set(key, 0.4 + Math.random() * 2.6);
    }
  }

  // Is there a log within LEAF_REACH steps of this leaf, through other leaves? Leaves at the edge of
  // the loaded world count as held up, since we can't see what's past them.
  leafSupported(x, y, z) {
    const seen = new Set([`${x},${y},${z}`]);
    let frontier = [[x, y, z]];
    for (let step = 0; step < LEAF_REACH && frontier.length; step++) {
      const next = [];
      for (const [fx, fy, fz] of frontier) {
        for (const [dx, dy, dz] of NEIGHBOURS) {
          const nx = fx + dx, ny = fy + dy, nz = fz + dz;
          const key = `${nx},${ny},${nz}`;
          if (seen.has(key)) continue;
          seen.add(key);
          if (ny >= 0 && ny < H && this.inBounds(nx, ny, nz) && !this.chunkAt(nx, nz)) return true;
          const id = this.get(nx, ny, nz);
          if (id === LOG) return true;
          if (isLeaves(id)) next.push([nx, ny, nz]);
        }
      }
      frontier = next;
    }
    return false;
  }

  // Count down queued leaves; those with no log nearby fall. onLeafDecay(x, y, z) is told about each.
  tickLeaves(dt) {
    if (!this.decay?.size) return;
    for (const [key, t] of this.decay) {
      if (t - dt > 0) { this.decay.set(key, t - dt); continue; }
      this.decay.delete(key);
      const [x, y, z] = key.split(',').map(Number);
      if (!isLeaves(this.get(x, y, z)) || this.leafSupported(x, y, z)) continue;
      const was = this.get(x, y, z);
      this.setBlock(x, y, z, AIR); // queues its neighbours in turn
      this.onLeafDecay?.(x, y, z, was);
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

  // ---------- water ----------
  // Two kinds of water. Sea and lake water (and water poured below sea level) fills any open cell at or
  // below sea level that touches it, as still "source" water, so holes dug by the sea flood but it
  // never runs away. Water poured from a bucket above sea level is a source too, and runs: it falls
  // straight down over edges, and on a floor spreads sideways, one level weaker per block, for up to
  // 7 blocks. Flowing water drains away again when its source is taken.
  tickWater(dt) {
    if (!this.flow.length) return;
    this.flowTimer += dt;
    if (this.flowTimer < 0.25) return;
    this.flowTimer = 0;
    const batch = this.flow;
    this.flow = [];
    const seen = new Set();
    this.flowing = true; // (v39: multiplayer games each run their own water)
    try {
      for (const [x, y, z] of batch) {
        if (y < 0 || y >= H) continue;
        const k = pack(x, y, z);
        if (seen.has(k) || !this.chunkAt(x, z)) continue;
        seen.add(k);
        this.updateWater(x, y, z);
      }
    } finally { this.flowing = false; }
  }

  updateWater(x, y, z) {
    const wheel = isWheel(this.get(x, y, z));
    let id = this.waterAt(x, y, z);
    const open = id === AIR || isFlowing(id);
    if (!open && id !== WATER) return;
    // the sea fills in (a wheel by the sea just sits in still water)
    if (open && y <= SEA_LEVEL && (this.get(x + 1, y, z) === WATER || this.get(x - 1, y, z) === WATER ||
      this.get(x, y, z + 1) === WATER || this.get(x, y, z - 1) === WATER || this.get(x, y + 1, z) === WATER)) {
      this.setWater(x, y, z, WATER, wheel);
      return;
    }
    // what a flowing cell should be, from the water around it
    if (open) {
      let want = AIR;
      if (isWaterId(this.waterAt(x, y + 1, z))) want = WATER_FALL;
      else {
        let m = 0;
        for (const [dx, dz] of SIDES) {
          const nid = this.waterAt(x + dx, y, z + dz);
          if (isWaterId(nid) && this.isFloor(x + dx, y - 1, z + dz)) m = Math.max(m, waterLevel(nid));
        }
        if (m >= 2) want = WATER_FLOW + m - 2;
      }
      if (want !== id) { this.setWater(x, y, z, want, wheel); id = want; }
      if (id === AIR) return;
    }
    // and where it runs from here: down if it can, otherwise out to the sides.
    // (Water wheels in the way work out their own water when their neighbours change.)
    const below = y > 0 ? this.get(x, y - 1, z) : -1;
    if (below === AIR || (isFlowing(below) && below !== WATER_FALL)) {
      this.setBlock(x, y - 1, z, WATER_FALL);
    } else if (this.isFloor(x, y - 1, z)) {
      const next = waterLevel(id) - 1;
      if (next < 1) return;
      for (const [dx, dz] of SIDES) {
        const nid = this.get(x + dx, y, z + dz);
        if (!this.chunkAt(x + dx, z + dz)) continue;
        if (nid === AIR || (isFlowing(nid) && nid !== WATER_FALL && waterLevel(nid) < next)) this.setBlock(x + dx, y, z + dz, WATER_FLOW + next - 1);
      }
    }
  }

  // Set the water in a cell: a block, or for a water wheel, the water running through it.
  setWater(x, y, z, id, wheel) {
    if (!wheel) { this.setBlock(x, y, z, id); return; }
    const k = pack(x, y, z);
    if ((this.wheelWater.get(k) ?? AIR) === id) return;
    if (id === AIR) this.wheelWater.delete(k); else this.wheelWater.set(k, id);
    this.markCellDirty(x, z);
    this.flow.push([x + 1, y, z], [x - 1, y, z], [x, y + 1, z], [x, y - 1, z], [x, y, z + 1], [x, y, z - 1]);
  }

  // Does the column of falling water at (x, y, z) come down onto a water wheel?
  fallsOnWheel(x, y, z) {
    for (let ty = y - 1; ty >= Math.max(0, y - 24); ty--) {
      const id = this.get(x, ty, z);
      if (isWheel(id)) return true;
      if (id !== WATER_FALL) return false;
    }
    return false;
  }

  // Can water rest on this cell and spread sideways over it? Anything but air, water and water wheels
  // (water runs on through those; the bottom of the world counts as a floor). Water running onto still
  // water just joins it.
  isFloor(x, y, z) {
    if (y < 0) return true;
    const id = this.get(x, y, z);
    return id !== AIR && !isWaterId(id) && !isWheel(id);
  }

  // Height of the water surface at one corner of a cell: the average of the water cells sharing that
  // corner, so flowing water slopes smoothly down from its source. Full if any of them has water above.
  waterCorner(x, y, z, cx, cz) {
    let sum = 0, n = 0;
    for (let dz = cz - 1; dz <= cz; dz++) for (let dx = cx - 1; dx <= cx; dx++) {
      const id = this.waterAt(x + dx, y, z + dz);
      if (!isWaterId(id)) continue;
      const h = this.waterHeight(x + dx, y, z + dz, id);
      if (h === 1) return 1;
      sum += h; n++;
    }
    return n ? sum / n : WATER_TOP;
  }

  // Surface height of the water in a cell, for drawing: still water sits a little below the top,
  // flowing water is lower the further it has run, and water with water above fills the cell.
  waterHeight(x, y, z, id) {
    if (isWaterId(this.waterAt(x, y + 1, z))) return 1;
    if (id === WATER || id === WATER_FALL) return WATER_TOP;
    return Math.max(0.12, (WATER_TOP * waterLevel(id)) / 8);
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
          if (!isSky) nc.tint[li] = c.tint[localIndex(x, y, z)]; // coloured light stays its colour as it spreads
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
      c.tint[li] = BLOCKS[id].tint;
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
        c.tint[li] = BLOCKS[c.data[li]].tint;
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
    const x0 = cx * CHUNK, z0 = cz * CHUNK;
    for (let li = 0; li < CHUNK_VOLUME; li++) {
      const id = data[li];
      if (id < 15) continue; // (quick skip for the common blocks: none of these grow, flow or turn)
      const def = BLOCKS[id];
      if (def?.hive >= 0) c.hives.add(li);
      if (def?.logic) c.logic.add(li);
      if (def?.grows && this.canGrow(c, li & 15, li >> 8, (li >> 4) & 15)) c.growing.add(li);
      else if (def?.kinetic || def?.machine || def?.hopper || def?.sensor || def?.painting || def?.ejector || def?.farm || def?.electric || def?.spawner) { c.machines.add(li); this.machinesChanged = true; }
      else if (isFlowing(id)) this.flow.push([x0 + (li & 15), li >> 8, z0 + ((li >> 4) & 15)]); // water left running
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
    // (and the chunks something keeps loaded, wherever they are: drone pads' networks)
    const kept = [...this.keepLoaded].map((s) => s.split(',').map(Number)).map(([cx, cz]) => [cx - pcx, cz - pcz]);
    for (const [dx, dz] of [...this.ring(R + 1), ...kept]) {
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
        if (far > R + 3 && !this.keepLoaded.has(`${c.cx},${c.cz}`)) this.unloadChunk(c, scene);
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
        if (kind === 'water') { mesh.renderOrder = 1; mesh.layers.set(3); } // (water layer: see graphics.js)
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
      let id = data[localIndex(lx, y, lz)];
      if (id === AIR) continue;
      const x = x0 + lx, z = z0 + lz;
      const wheel = isWheel(id);
      if (wheel) {
        id = this.waterAt(x, y, z); // a water wheel is drawn by kinetics.js; the stream it dips into is drawn here
        if (id === AIR) continue;
      }
      const def = BLOCKS[id];
      if (isWaterId(id)) {
        const height = wheel ? WHEEL_STREAM : this.waterHeight(x, y, z, id);
        // water falling onto a water wheel narrows to a stream, so the wheel's paddles show around it
        const ins = id === WATER_FALL && this.fallsOnWheel(x, y, z) ? 0.25 : 0;
        for (const f of FACES) {
          if (f.n[1] < 0 && y === 0) continue;
          const nx = x + f.n[0], ny = y + f.n[1], nz = z + f.n[2];
          // (a wheel's shallow stream counts as open, so water around and above it shows its faces)
          const nid = isWheel(this.get(nx, ny, nz)) ? AIR : this.get(nx, ny, nz);
          if (nid !== AIR && !isWaterId(nid) && !BLOCKS[nid].transparent) continue;
          // between two water cells, only where this one stands higher than its neighbour
          if (!wheel && !ins && isWaterId(nid) && (f.d === 1 || this.waterHeight(nx, ny, nz, nid) >= height)) continue;
          if (ins && f.d === 1 && isWaterId(nid)) continue;
          if (wheel && isWaterId(nid) && f.d !== 1) continue;
          for (const cr of f.corners) {
            const top = cr.o[1] === 1 ? (height === 1 || wheel ? height : this.waterCorner(x, y, z, cr.o[0], cr.o[2])) : cr.o[1];
            const px = lx + ins + cr.o[0] * (1 - 2 * ins), py = y + top, pz = lz + ins + cr.o[2] * (1 - 2 * ins);
            wpos.push(px, py, pz);
            // world-space UVs (wrapped every 64 blocks) so the texture tiles seamlessly and can scroll
            const ux = waterU + px, uz = waterV + pz;
            if (f.d === 1) wuv.push(ux, uz); else if (f.d === 0) wuv.push(uz, py); else wuv.push(ux, py);
            const b = toLinear(f.shade);
            wcol.push(b, b, b);
            const fx = x + f.n[0], fy = y + f.n[1], fz = z + f.n[2];
            wtl.push(lightBrightness(Math.max(this.lightAt(x, y, z), this.lightAt(fx, fy, fz))) + 2 * this.tintAt(x, y, z));
            wsl.push(skyBrightness(Math.max(this.skyAt(x, y, z), this.skyAt(fx, fy, fz))));
          }
          windex.push(wcount, wcount + 1, wcount + 2, wcount, wcount + 2, wcount + 3);
          wcount += 4;
        }
        continue;
      }
      if (def.shape === 'kinetic') continue; // drawn (and turned) by kinetics.js
      if (def.shape === 'pipe') {
        // a lead pipe: a short length at the centre, with arms reaching out to each pipe, pump, spout, tank,
        // sprinkler or fuel-burning machine it touches
        const model = [[5, 5, 5, 11, 11, 11, T.LEAD]];
        if (def.valve) model.push([4, 11, 7, 12, 12, 9, T.WIRE_ON], [7, 11, 4, 9, 12, 12, T.WIRE_ON], [7.5, 11, 7.5, 8.5, 12.5, 8.5, T.IRON]); // its handwheel
        const joins = (id) => { const d = BLOCKS[id]; return id === PUMP || id === SPOUT || d?.shape === 'pipe' || d?.tank || d?.sprinkler || d?.engine || ['oven', 'smelter', 'blast'].includes(d?.station); };
        if (joins(this.get(x + 1, y, z))) model.push([11, 5.5, 5.5, 16, 10.5, 10.5, T.LEAD]);
        if (joins(this.get(x - 1, y, z))) model.push([0, 5.5, 5.5, 5, 10.5, 10.5, T.LEAD]);
        if (joins(this.get(x, y + 1, z))) model.push([5.5, 11, 5.5, 10.5, 16, 10.5, T.LEAD]);
        if (joins(this.get(x, y - 1, z))) model.push([5.5, 0, 5.5, 10.5, 5, 10.5, T.LEAD]);
        if (joins(this.get(x, y, z + 1))) model.push([5.5, 5.5, 11, 10.5, 10.5, 16, T.LEAD]);
        if (joins(this.get(x, y, z - 1))) model.push([5.5, 5.5, 0, 10.5, 10.5, 5, T.LEAD]);
        vcount = this.addModel(lx, y, lz, { model }, this.torchAt(x, y, z), skyBrightness(this.skyAt(x, y, z)),
          pos, uv, col, tl, sl, index, vcount);
        continue;
      }
      if (def.shape === 'lpipe') {
        // a logistics pipe: a coloured core (by its job) with clear arms out to each pipe, chest or machine it touches
        const model = [[4.5, 4.5, 4.5, 11.5, 11.5, 11.5, def.side]];
        const joins = (id) => { const d = BLOCKS[id]; return !!(d?.lpipe || d?.station || d?.tank || d?.engine || (d?.liquid && def.lpipe === 'fprovider')); };
        if (joins(this.get(x + 1, y, z))) model.push([11.5, 5.5, 5.5, 16, 10.5, 10.5, T.LP_ARM]);
        if (joins(this.get(x - 1, y, z))) model.push([0, 5.5, 5.5, 4.5, 10.5, 10.5, T.LP_ARM]);
        if (joins(this.get(x, y + 1, z))) model.push([5.5, 11.5, 5.5, 10.5, 16, 10.5, T.LP_ARM]);
        if (joins(this.get(x, y - 1, z))) model.push([5.5, 0, 5.5, 10.5, 4.5, 10.5, T.LP_ARM]);
        if (joins(this.get(x, y, z + 1))) model.push([5.5, 5.5, 11.5, 10.5, 10.5, 16, T.LP_ARM]);
        if (joins(this.get(x, y, z - 1))) model.push([5.5, 5.5, 0, 10.5, 10.5, 4.5, T.LP_ARM]);
        vcount = this.addModel(lx, y, lz, { model }, this.torchAt(x, y, z), skyBrightness(this.skyAt(x, y, z)),
          pos, uv, col, tl, sl, index, vcount);
        continue;
      }
      if (def.shape === 'cable') {
        // cupronickel cable: a thin insulated run with arms out to each cable or electric block it touches
        const model = [[6, 6, 6, 10, 10, 10, T.CABLE]];
        const joins = (id) => !!BLOCKS[id]?.electric && BLOCKS[id].electric.role !== 'wire';
        if (joins(this.get(x + 1, y, z))) model.push([10, 6.5, 6.5, 16, 9.5, 9.5, T.CABLE]);
        if (joins(this.get(x - 1, y, z))) model.push([0, 6.5, 6.5, 6, 9.5, 9.5, T.CABLE]);
        if (joins(this.get(x, y + 1, z))) model.push([6.5, 10, 6.5, 9.5, 16, 9.5, T.CABLE]);
        if (joins(this.get(x, y - 1, z))) model.push([6.5, 0, 6.5, 9.5, 6, 9.5, T.CABLE]);
        if (joins(this.get(x, y, z + 1))) model.push([6.5, 6.5, 10, 9.5, 9.5, 16, T.CABLE]);
        if (joins(this.get(x, y, z - 1))) model.push([6.5, 6.5, 0, 9.5, 9.5, 6, T.CABLE]);
        vcount = this.addModel(lx, y, lz, { model }, this.torchAt(x, y, z), skyBrightness(this.skyAt(x, y, z)),
          pos, uv, col, tl, sl, index, vcount);
        continue;
      }
      if (def.shape === 'wire') {
        vcount = this.addModel(lx, y, lz, { model: this.wireModel(x, y, z, def) }, this.torchAt(x, y, z), skyBrightness(this.skyAt(x, y, z)),
          pos, uv, col, tl, sl, index, vcount);
        continue;
      }
      if (def.shape === 'fence' || def.shape === 'pane' || def.shape === 'wall') {
        vcount = this.addModel(lx, y, lz, { model: this.joinedModel(x, y, z, def) }, this.torchAt(x, y, z), skyBrightness(this.skyAt(x, y, z)),
          pos, uv, col, tl, sl, index, vcount);
        continue;
      }
      if (def.shape === 'torch') {
        vcount = this.addTorch(lx, y, lz, def, pos, uv, col, tl, sl, index, vcount);
        continue;
      }
      if (def.shape === 'model') {
        vcount = this.addModel(lx, y, lz, def.stair ? { model: this.stairModel(x, y, z, def) } : def, this.torchAt(x, y, z), skyBrightness(this.skyAt(x, y, z)),
          pos, uv, col, tl, sl, index, vcount);
        continue;
      }
      if (def.shape === 'cross') {
        vcount = this.addCross(lx, y, lz, def, this.torchAt(x, y, z), skyBrightness(this.skyAt(x, y, z)),
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
          if (nid === id && !isLeaves(id)) continue; // glass-to-glass faces are hidden
        }
        // (blocks with a front, like ovens, show it on the side that faces their `facing` direction)
        const tile = f.d === 1 ? (f.s > 0 ? def.top : def.bottom) : def.front !== null && f.dir === def.facing ? def.front : def.side;
        const tu = (tile % ATLAS_COLS) * tileUV;
        const tvTop = 1 - Math.floor(tile / ATLAS_COLS) * tileUV;
        const ao = [0, 0, 0, 0];
        const wet = isWaterId(nid);
        const leafSway = (isLeaves(id) ? 4 : 0) + (def.light > 0 ? 16 : 0); // (+16: it gives off light, so it glows)
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
          tl.push(lightBrightness(sum / n) + 2 * this.tintAt(nx, ny, nz));
          sl.push(skyBrightness(sun / n) + (wet ? 2 : 0) + leafSway); // (+2: faces under water, for caustics; +4: leaves sway; +16 glow)
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
    for (const [x0, y0, z0, x1, y1, z1, tiles, glow, kind] of def.model) {
      if (kind === 'cross') {
        // a plant: two sprites crossed through this box, the whole tile on each
        const tu = (tiles % ATLAS_COLS) * tileUV, tv0 = 1 - Math.floor(tiles / ATLAS_COLS) * tileUV - tileUV, b2 = toLinear(0.88);
        const [ax, az, bx, bz, ya, yb] = [x0 / 16, z0 / 16, x1 / 16, z1 / 16, y0 / 16, y1 / 16];
        for (const [p1, q1, p2, q2] of [[ax, az, bx, bz], [bx, az, ax, bz]]) {
          for (const [cx, cy, cz, u, v] of [[p1, ya, q1, 0, 0], [p2, ya, q2, 1, 0], [p2, yb, q2, 1, 1], [p1, yb, q1, 0, 1]]) {
            pos.push(x + cx, y + cy, z + cz);
            uv.push(tu + clampUV(u) * tileUV, tv0 + clampUV(v) * tileUV);
            col.push(b2, b2, b2);
            tl.push(glow ? 1 : torch);
            sl.push(glow ? 17 : sky); // (+16: a glowing part)
          }
          index.push(vcount, vcount + 1, vcount + 2, vcount, vcount + 2, vcount + 3);
          index.push(vcount, vcount + 2, vcount + 1, vcount, vcount + 3, vcount + 2);
          vcount += 4;
        }
        continue;
      }
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
          sl.push(glow ? 17 : sky);
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
    const e = 0.1 / TILE; // (a hair inside the tile, so its edges never pick up the next tile's pixels)
    const sway = def.sound === 'leaves' && !def.light; // plants, not fire or crystals
    for (const [x1, z1, x2, z2] of [[a, a, b, b], [b, a, a, b]]) {
      const corners = [[x1, 0, z1, 0, 0], [x2, 0, z2, 1, 0], [x2, 1, z2, 1, 1], [x1, 1, z1, 0, 1]];
      for (const [cx, cy, cz, u, v] of corners) {
        pos.push(x + cx, y + cy, z + cz);
        uv.push(tu + (e + u * (1 - 2 * e)) * tileUV, tv0 + (e + v * (1 - 2 * e)) * tileUV);
        col.push(b2, b2, b2);
        tl.push(torch);
        sl.push(sky + (sway && cy ? 8 : 0) + (def.light > 0 ? 16 : 0)); // (+8: the top of a plant, which sways; +16: glows)
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
        sl.push(17); // (and their flame glows)
      }
      index.push(vcount, vcount + 1, vcount + 2, vcount, vcount + 2, vcount + 3);
      vcount += 4;
    }
    return vcount;
  }

  // Voxel DDA raycast. Returns { x, y, z, id, nx, ny, nz, t } for the first solid block hit (water is ignored);
  // t is the distance along the ray. With solidOnly, walk-through blocks (plants, torches) are skipped too.
  raycast(origin, dir, maxDist, solidOnly = false, liquids = false) {
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
      if (id !== AIR && (!BLOCKS[id].liquid || (liquids && (id === WATER || id === LAVA))) && (!solidOnly || BLOCKS[id].solid)) {
        // slabs, stairs, gates and trapdoors: the ray must hit one of their boxes, not just their cell
        const boxes = BLOCKS[id].boxes;
        if (!boxes) return { x, y, z, id, nx, ny, nz, t };
        const hit = rayBoxes(origin, dir, x, y, z, boxes, maxDist);
        if (hit) return { x, y, z, id, nx: hit.n[0], ny: hit.n[1], nz: hit.n[2], t: hit.t };
      }
      if (tmx < tmy && tmx < tmz) { x += sx; t = tmx; tmx += tdx; nx = -sx; ny = 0; nz = 0; }
      else if (tmy < tmz) { y += sy; t = tmy; tmy += tdy; nx = 0; ny = -sy; nz = 0; }
      else { z += sz; t = tmz; tmz += tdz; nx = 0; ny = 0; nz = -sz; }
    }
    return null;
  }
}
