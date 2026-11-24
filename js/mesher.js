// Chunk meshing (v48): the code that turns a chunk's blocks into triangles, shared by the main thread and
// mesh-worker.js. A job holds a copy of the chunk with a one-block border taken from its neighbours (all the
// mesher looks at), so it can be meshed anywhere, off the main thread, while the game carries on.
// Also the shapes of joined blocks (fences, walls, panes, wires, stairs) and water surfaces, which the world
// uses for collision as well (see World in world.js, which shares these methods).
import {
  BLOCKS, AIR, isLeaves, WATER, MAX_LIGHT, WATER_FALL, WATER_WHEEL, isWaterId, waterLevel, PUMP, SPOUT, T, FACING_DIRS, isWetId,
} from './blocks.js';
import { TILE, ATLAS_COLS } from './textures.js';
import { CHUNK, H } from './terrain.js';

const isWheel = (id) => id === WATER_WHEEL || id === WATER_WHEEL + 1;
const WATER_TOP = 0.875; // surface sits a little below the block top
const WHEEL_STREAM = 0.3; // water running through a water wheel's cell is drawn as a shallow stream under it
// the snapshot is the chunk plus one block all round: PW x PW per layer
export const PW = CHUNK + 2, PL = PW * PW;

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

// (the sphere three.js would work out for these positions: the middle of their box, out to the furthest)
function boundingSphere(p) {
  if (!p.length) return [0, 0, 0, 0];
  let x0 = Infinity, y0 = Infinity, z0 = Infinity, x1 = -Infinity, y1 = -Infinity, z1 = -Infinity;
  for (let i = 0; i < p.length; i += 3) {
    const x = p[i], y = p[i + 1], z = p[i + 2];
    if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; if (z < z0) z0 = z; if (z > z1) z1 = z;
  }
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, cz = (z0 + z1) / 2;
  let r = 0;
  for (let i = 0; i < p.length; i += 3) { const dx = p[i] - cx, dy = p[i + 1] - cy, dz = p[i + 2] - cz; r = Math.max(r, dx * dx + dy * dy + dz * dz); }
  return [cx, cy, cz, Math.sqrt(r)];
}

// Shapes that depend on the blocks around them. Any class with get(x, y, z) and waterAt(x, y, z) can use these
// (the World, and a mesh job's snapshot): see shareShapes.
export class BlockShapes {
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

  // Does the column of falling water at (x, y, z) come down onto a water wheel?
  fallsOnWheel(x, y, z) {
    for (let ty = y - 1; ty >= Math.max(0, y - 24); ty--) {
      const id = this.get(x, ty, z);
      if (isWheel(id)) return true;
      if (id !== WATER_FALL) return false;
    }
    return false;
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

}
export function shareShapes(cls) {
  for (const k of Object.getOwnPropertyNames(BlockShapes.prototype)) if (k !== 'constructor') cls.prototype[k] = BlockShapes.prototype[k];
}

// A mesh job's snapshot: the chunk and its border, in global block coordinates. job: { cx, cz, top, ny, data, light,
// sky, tint (each PL x ny), wheels: [snapshot index, water id, ...] for water running through water wheels }
export class MeshSource extends BlockShapes {
  constructor(job) {
    super();
    Object.assign(this, job);
    this.x0 = job.cx * CHUNK; this.z0 = job.cz * CHUNK;
    this.wheelAt = new Map();
    for (let i = 0; i < job.wheels.length; i += 2) this.wheelAt.set(job.wheels[i], job.wheels[i + 1]);
  }

  // the index of a cell in the snapshot, or -1 outside it
  at(x, y, z) {
    const px = x - this.x0 + 1, pz = z - this.z0 + 1;
    if (y < 0 || y >= this.ny || px < 0 || pz < 0 || px >= PW || pz >= PW) return -1;
    return px + pz * PW + y * PL;
  }
  get(x, y, z) { const i = this.at(x, y, z); return i < 0 ? AIR : this.data[i]; }
  waterAt(x, y, z) {
    const i = this.at(x, y, z);
    if (i < 0) return AIR;
    const id = this.data[i];
    return isWheel(id) ? this.wheelAt.get(i) ?? AIR : isWetId(id) ? WATER : id;
  }
  lightAt(x, y, z) { const i = this.at(x, y, z); return i < 0 ? 0 : this.light[i]; }
  tintAt(x, y, z) { const i = this.at(x, y, z); return i < 0 ? 0 : this.tint[i]; }
  skyAt(x, y, z) {
    if (y >= this.ny) return MAX_LIGHT; // (above anything in the chunk; the world's top is open sky)
    const i = this.at(x, y, z);
    return i < 0 ? 0 : this.sky[i];
  }
  torchAt(x, y, z) { return lightBrightness(this.lightAt(x, y, z)) + 2 * this.tintAt(x, y, z); }

  build(c) {
    const pos = [], uv = [], col = [], tl = [], sl = [], index = [];
    const wpos = [], wuv = [], wcol = [], wtl = [], wsl = [], windex = [];
    let wcount = 0, vcount = 0;
    const tileUV = 1 / ATLAS_COLS;
    const eps = 0.5 / (TILE * ATLAS_COLS); // half-texel inset to avoid atlas bleeding
    const opaque = (x, y, z) => {
      if (y < 0) return true;
      const id = this.get(x, y, z);
      return id !== AIR && !BLOCKS[id].transparent;
    };
    const x0 = c.cx * CHUNK, z0 = c.cz * CHUNK;
    const waterU = x0 % 64, waterV = z0 % 64; // keeps water UVs small but seamless across chunks
    for (let y = 0, yTop = Math.min(H - 1, c.top); y <= yTop; y++) for (let lz = 0; lz < CHUNK; lz++) for (let lx = 0; lx < CHUNK; lx++) {
      let id = this.data[lx + 1 + (lz + 1) * PW + y * PL];
      if (id === AIR) continue;
      const x = x0 + lx, z = z0 + lz;
      const wheel = isWheel(id);
      if (wheel) {
        id = this.waterAt(x, y, z); // a water wheel is drawn by kinetics.js; the stream it dips into is drawn here
        if (id === AIR) continue;
      }
      const def = BLOCKS[id];
      const wet = isWetId(id); // (v44) a sea plant: draw the water it stands in, then the plant
      if (wet || isWaterId(id)) {
        if (wet) id = WATER;
        const height = wheel ? WHEEL_STREAM : this.waterHeight(x, y, z, id);
        // water falling onto a water wheel narrows to a stream, so the wheel's paddles show around it
        const ins = id === WATER_FALL && this.fallsOnWheel(x, y, z) ? 0.25 : 0;
        for (const f of FACES) {
          if (f.n[1] < 0 && y === 0) continue;
          const nx = x + f.n[0], ny = y + f.n[1], nz = z + f.n[2];
          // (a wheel's shallow stream counts as open, so water around and above it shows its faces)
          const raw = this.get(nx, ny, nz), nid = isWheel(raw) ? AIR : isWetId(raw) ? WATER : raw;
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
        if (!wet) continue;
        id = def.id;
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
        // (how many plant blocks it stands on, so a tall plant sways as one: see addCross)
        let up = 0;
        while (up < 7 && y - up > 0 && BLOCKS[this.get(x, y - up - 1, z)]?.shape === 'cross') up++;
        vcount = this.addCross(lx, y, lz, def, this.torchAt(x, y, z), skyBrightness(this.skyAt(x, y, z)),
          pos, uv, col, tl, sl, index, vcount, up);
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
      const position = new Float32Array(p);
      return {
        position, uv: new Float32Array(u), color: new Float32Array(cl), torch: new Float32Array(t), sky: new Float32Array(sk),
        index: p.length / 3 > 65535 ? new Uint32Array(i) : new Uint16Array(i), sphere: boundingSphere(position),
      };
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
  // `up` is how many plant blocks this one stands on: a tall plant bends from its root, not at every block.
  addCross(x, y, z, def, torch, sky, pos, uv, col, tl, sl, index, vcount, up = 0) {
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
        const h = up + cy; // blocks up from the root
        sl.push(sky + (sway && h ? 8 + 32 * h : 0) + (def.light > 0 ? 16 : 0)); // (+8: above a plant's root, so it sways; +16: glows)
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

}

// Mesh one job: { solid, water }, each null or the attribute arrays (and bounding sphere) of a geometry
export function meshJob(job) { return new MeshSource(job).build(job); }
// the arrays in a result, to hand over rather than copy
export function resultBuffers(r) {
  const out = [];
  for (const g of [r.solid, r.water]) if (g) out.push(g.position.buffer, g.uv.buffer, g.color.buffer, g.torch.buffer, g.sky.buffer, g.index.buffer);
  return out;
}
