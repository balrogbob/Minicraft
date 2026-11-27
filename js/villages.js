// Villages, laid out anew (v50): hamlets, villages, towns and cities, with a cobbled square round the well,
// straight roads out of it (and side streets in towns and cities), plank bridges where a road crosses water, and
// plots along the roads, each levelled to its road, for houses, fields and room to grow. The ground under all of it
// is cut and filled level, and blends back into the land round the edge.
//
// Like everything else in the world, a village is worked out from the seed alone: `planVillage` makes the whole plan
// once (a grid of target heights over the village), and `stampVillage` puts the part of it in one chunk into that
// chunk's blocks, so every chunk agrees on where the roads and houses go.
//
// Worlds made before v50 keep their old villages wherever anyone has been (see Generator.villageAt).
import {
  AIR, GRASS, DIRT, SAND, SNOW, SNOW_GRASS, SANDSTONE, CUT_SANDSTONE, COBBLE, GRAVEL, PLANKS, LOG, FENCE, WATER,
  GLASS_PANE, FURN_TABLE, CHEST, TORCH_WALL_W, doorId, slabId, WHEAT_0, VILLAGE_BELL, LANTERN,
} from './blocks.js';
import { CHUNK, H, SEA_LEVEL, SNOW_LINE, localIndex } from './terrain.js';

// R: how far the village reaches from the well, its levelled edge included. plaza: half the width of the square.
// sides: how far along each main road the side streets branch off; sideLen: how long they run.
export const VILLAGE_SIZES = {
  hamlet: { R: 22, plaza: 3, roads: [2, 2], sides: [], sideLen: 0, houses: [3, 5], farms: 1, paved: false, lamps: false },
  village: { R: 30, plaza: 4, roads: [3, 4], sides: [], sideLen: 0, houses: [6, 10], farms: 2, paved: false, lamps: false },
  town: { R: 40, plaza: 5, roads: [4, 4], sides: [14], sideLen: 15, houses: [12, 20], farms: 3, paved: true, lamps: true },
  city: { R: 50, plaza: 6, roads: [4, 4], sides: [13, 27], sideLen: 19, houses: [20, 35], farms: 4, paved: true, lamps: true },
};
export const SIZE_ORDER = ['hamlet', 'village', 'town', 'city'];
// How often each size comes up (before rough land makes some of them smaller).
export const SIZE_CHANCE = [0.35, 0.4, 0.18, 0.07];

// What a cell of the plan is
export const K_NONE = 0, K_ROAD = 1, K_PLAZA = 2, K_PLOT = 3, K_EDGE = 4, K_BRIDGE = 5, K_RAIL = 6, K_LAMP = 7;
const PLOT = 7, PLOT_STEP = 9, EDGE = 5; // plots are 7 x 7, a plot every 9 blocks along a road; the edge blends over 5
const MAX_SPAN = 12; // the longest bridge a road builds

// Which sizes fit here: the biggest one (no bigger than `want`) whose ground isn't too steep or too wet.
export function fitSize(g, x, z, y, want) {
  for (let s = SIZE_ORDER.indexOf(want); s > 0; s--) {
    const R = VILLAGE_SIZES[SIZE_ORDER[s]].R;
    let bad = 0;
    for (const f of [0.35, 0.7]) for (let k = 0; k < 12; k++) {
      const a = (k / 12) * Math.PI * 2, h = g.height(Math.round(x + Math.cos(a) * R * f), Math.round(z + Math.sin(a) * R * f));
      if (h < SEA_LEVEL || Math.abs(h - y) > 10) bad++;
    }
    if (bad <= 8) return SIZE_ORDER[s];
  }
  return 'hamlet';
}

// The whole plan of a village whose well is at (c.x, c.z): roads, plots, houses, fields, and the height of the
// ground in every column it levels.
export function planVillage(g, c) {
  const S = VILLAGE_SIZES[c.size], R = S.R;
  const rnd = (k) => g.villageRand(c.rx, k, c.rz);
  const W = 2 * R + 1, bx0 = c.x - R, bz0 = c.z - R;
  const inB = (x, z) => x >= bx0 && z >= bz0 && x < bx0 + W && z < bz0 + W;
  const at = (x, z) => (x - bx0) + (z - bz0) * W;
  const nat = new Int16Array(W * W);
  for (let j = 0; j < W; j++) for (let i = 0; i < W; i++) nat[i + j * W] = g.height(bx0 + i, bz0 + j);
  const N = (x, z) => nat[at(Math.max(bx0, Math.min(bx0 + W - 1, x)), Math.max(bz0, Math.min(bz0 + W - 1, z)))];
  const tgt = new Int16Array(W * W).fill(-1), kind = new Uint8Array(W * W), post = new Uint8Array(W * W);
  const wet = (x, z) => N(x, z) < SEA_LEVEL;
  const reach = R - EDGE; // roads and plots stay this close to the middle, leaving room for the edge to blend
  const within = (x, z, m = 0) => Math.abs(x - c.x) <= reach - m && Math.abs(z - c.z) <= reach - m;
  const mark = (x, z, k, y) => { if (inB(x, z)) { const i = at(x, z); kind[i] = k; tgt[i] = y; } };

  // the square, levelled to the ground round the well
  let sum = 0, n = 0;
  for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) { sum += Math.max(SEA_LEVEL + 1, N(c.x + dx, c.z + dz)); n++; }
  const P = Math.round(sum / n), ps = S.plaza;
  for (let dz = -ps; dz <= ps; dz++) for (let dx = -ps; dx <= ps; dx++) mark(c.x + dx, c.z + dz, K_PLAZA, P);
  const lamps = [[c.x - ps, c.z - ps], [c.x + ps, c.z - ps], [c.x - ps, c.z + ps], [c.x + ps, c.z + ps]].map(([x, z]) => ({ x, y: P, z }));

  // A road: from (sx, sz) heading `dir`, starting at level y0. It follows the lie of the land, rising or falling a
  // block at most every 3 blocks, crosses short stretches of water on a bridge, and stops at a cliff, a wide stretch
  // of water, the edge of the village, or another road. Returns its centre line: [{ x, z, y, wet }].
  const road = (sx, sz, [ux, uz], y0, len) => {
    const px = -uz, pz = ux, cells = [];
    let y = y0, last = 0, run = 0;
    for (let t = 0; t < len; t++) {
      const x = sx + ux * t, z = sz + uz * t;
      if (!within(x, z)) break;
      if (t > 0 && [-1, 0, 1].some((o) => { const k = kind[at(x + px * o, z + pz * o)]; return k === K_ROAD || k === K_PLAZA || k === K_BRIDGE; })) {
        // it's met another road: join it if they're about level, or stop just short
        if (Math.abs(tgt[at(x, z)] - y) > 1) cells.pop();
        break;
      }
      let s = 0, m = 0;
      for (let k = -2; k <= 2; k++) { s += Math.max(SEA_LEVEL + 1, N(x + ux * k, z + uz * k)); m++; }
      const want = Math.round(s / m);
      if (t - last >= 3 && want !== y) { y += Math.sign(want - y); last = t; }
      const water = [-1, 0, 1].some((o) => wet(x + px * o, z + pz * o));
      run = water ? run + 1 : 0;
      if (run > MAX_SPAN) break;
      if (!water && Math.abs(N(x, z) - y) > 6) break;
      cells.push({ x, z, y, wet: water });
    }
    while (cells.length && cells[cells.length - 1].wet) cells.pop(); // (no bridges to nowhere)
    return cells;
  };
  const roads = [];
  const lay = (cells, dir, main) => {
    if (cells.length < 3) return null;
    const [ux, uz] = dir, px = -uz, pz = ux;
    cells.forEach((cl, t) => {
      for (const o of [-1, 0, 1]) {
        const x = cl.x + px * o, z = cl.z + pz * o;
        mark(x, z, wet(x, z) ? K_BRIDGE : K_ROAD, cl.y);
      }
      if (cl.wet) for (const o of [-2, 2]) {
        const x = cl.x + px * o, z = cl.z + pz * o;
        if (!inB(x, z) || kind[at(x, z)] === K_ROAD || kind[at(x, z)] === K_BRIDGE) continue;
        mark(x, z, K_RAIL, cl.y);
        if (t % 4 === 0 || !cells[t + 1]?.wet || !cells[t - 1]?.wet) post[at(x, z)] = 1;
      }
    });
    const r = { cells, dir, main };
    roads.push(r);
    return r;
  };

  // main roads out of each side of the square
  const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  const order = DIRS.map((d, i) => [rnd(30 + i), d]).sort((a, b) => a[0] - b[0]).map((e) => e[1]);
  const nRoads = S.roads[0] + Math.floor(rnd(29) * (S.roads[1] - S.roads[0] + 1));
  const mains = [];
  for (const d of order.slice(0, nRoads)) {
    const r = lay(road(c.x + d[0] * (ps + 1), c.z + d[1] * (ps + 1), d, P, R), d, true);
    if (r) mains.push(r);
  }
  // side streets, both ways off the main roads
  for (const m of mains) for (const t of S.sides) {
    if (t >= m.cells.length - 3) continue;
    const cl = m.cells[t], [ux, uz] = m.dir;
    for (const s of [-1, 1]) {
      const d = [-uz * s, ux * s];
      lay(road(cl.x + d[0] * 2, cl.z + d[1] * 2, d, cl.y, S.sideLen), d, false);
    }
  }

  // plots along both sides of every road, each levelled to the road in front of it
  const plots = [];
  for (const r of roads) {
    const [ux, uz] = r.dir, px = -uz, pz = ux;
    // (each a plot's width and a gap along from the last, or as soon after that as there's room)
    for (const s of [-1, 1]) for (let t0 = 1, next; t0 + PLOT - 1 < r.cells.length; t0 = next) {
      next = t0 + 1;
      const mid = r.cells[t0 + 3], L = mid.y;
      let ok = true;
      for (let a = 0; a < PLOT && ok; a++) {
        const cl = r.cells[t0 + a];
        if (cl.wet) { ok = false; break; }
        for (let o = 2; o <= 2 + PLOT - 1; o++) {
          const x = cl.x + px * s * o, z = cl.z + pz * s * o;
          if (!inB(x, z) || !within(x, z, 1) || kind[at(x, z)] !== K_NONE || N(x, z) < SEA_LEVEL || Math.abs(N(x, z) - L) > 6) { ok = false; break; }
        }
      }
      if (!ok) continue;
      for (let a = 0; a < PLOT; a++) {
        const cl = r.cells[t0 + a];
        for (let o = 2; o <= 2 + PLOT - 1; o++) mark(cl.x + px * s * o, cl.z + pz * s * o, K_PLOT, L);
      }
      // `face`: the way out to the road
      next = t0 + PLOT_STEP;
      plots.push({ x: mid.x + px * s * 5, y: L, z: mid.z + pz * s * 5, face: [-px * s, -pz * s], along: [ux, uz], kind: 'spare' });
    }
  }

  // which plots are houses, which are fields, and which are left for the village to grow into
  plots.sort((a, b) => Math.hypot(a.x - c.x, a.z - c.z) - Math.hypot(b.x - c.x, b.z - c.z));
  const wantHouses = S.houses[0] + Math.floor(rnd(40) * (S.houses[1] - S.houses[0] + 1));
  const nFarms = Math.min(S.farms, Math.max(0, plots.length - 1));
  // (a plot or two left free for the village to build on as it does well)
  const spare = S.paved ? 2 : 1, free = plots.length - nFarms;
  const nHouses = Math.max(Math.min(S.houses[0], free), Math.min(wantHouses, free - spare));
  plots.forEach((p, i) => { p.kind = i < nHouses ? 'house' : i >= plots.length - nFarms ? 'farm' : 'spare'; });
  const houses = plots.filter((p) => p.kind === 'house').map((p) => ({ x: p.x, y: p.y, z: p.z, door: [p.face[0] * 2, p.face[1] * 2] }));
  const farms = plots.filter((p) => p.kind === 'farm').map((p) => ({ x: p.x, y: p.y, z: p.z, face: p.face, crop: Math.floor(rnd(50 + plots.indexOf(p)) * 6) }));

  // street lamps by the roads of towns and cities, in the gaps between the plots
  if (S.lamps) for (const r of roads) {
    const [ux, uz] = r.dir, px = -uz, pz = ux;
    r.cells.forEach((cl, t) => {
      if (t % 9 !== 8 || cl.wet) return;
      const s = (t / 9) % 2 ? 1 : -1, x = cl.x + px * s * 2, z = cl.z + pz * s * 2;
      if (inB(x, z) && kind[at(x, z)] === K_NONE && N(x, z) >= SEA_LEVEL && Math.abs(N(x, z) - cl.y) <= 4) {
        mark(x, z, K_LAMP, cl.y);
        lamps.push({ x, y: cl.y, z });
      }
    });
  }

  // the edge: ground near anything levelled slopes back to the land as it was
  const bestD = new Uint8Array(W * W).fill(255), bestY = new Int16Array(W * W);
  for (let j = 0; j < W; j++) for (let i = 0; i < W; i++) {
    const k = kind[i + j * W];
    if (k === K_NONE || k === K_BRIDGE || (k === K_RAIL && nat[i + j * W] < SEA_LEVEL)) continue;
    const y = tgt[i + j * W];
    for (let dj = -EDGE + 1; dj < EDGE; dj++) for (let di = -EDGE + 1; di < EDGE; di++) {
      const ii = i + di, jj = j + dj;
      if (ii < 0 || jj < 0 || ii >= W || jj >= W || kind[ii + jj * W] !== K_NONE || nat[ii + jj * W] < SEA_LEVEL) continue;
      const d = Math.max(Math.abs(di), Math.abs(dj));
      if (d < bestD[ii + jj * W]) { bestD[ii + jj * W] = d; bestY[ii + jj * W] = y; }
    }
  }
  for (let q = 0; q < W * W; q++) {
    if (bestD[q] === 255) continue;
    const f = bestD[q] / EDGE;
    kind[q] = K_EDGE;
    tgt[q] = Math.round(bestY[q] + (nat[q] - bestY[q]) * f * f * (3 - 2 * f));
  }

  return {
    x: c.x, y: P, z: c.z, biome: c.biome, name: c.name, size: c.size, radius: R, layout: 2,
    houses, farm: farms[0] ?? null, farms, plots, lamps,
    roads: roads.map((r) => ({ main: r.main, dir: r.dir, from: [r.cells[0].x, r.cells[0].z], to: [r.cells.at(-1).x, r.cells.at(-1).z] })),
    plaza: { x0: c.x - ps, z0: c.z - ps, x1: c.x + ps, z1: c.z + ps, y: P },
    bbox: { x0: bx0, z0: bz0, x1: bx0 + W - 1, z1: bz0 + W - 1 },
    grid: { W, bx0, bz0, nat, tgt, kind, post },
  };
}

// Whether a village's plan touches column (x, z) (so no tree grows there).
export function villageCovers(v, x, z) {
  const G = v.grid;
  if (!G) return false;
  const i = x - G.bx0, j = z - G.bz0;
  return i >= 0 && j >= 0 && i < G.W && j < G.W && G.kind[i + j * G.W] !== K_NONE;
}

// The part of a village in chunk (cx, cz), into its blocks.
export function stampVillage(g, v, data, cx, cz, crops) {
  const x0 = cx * CHUNK, z0 = cz * CHUNK, G = v.grid;
  if (v.bbox.x1 < x0 || v.bbox.z1 < z0 || v.bbox.x0 >= x0 + CHUNK || v.bbox.z0 >= z0 + CHUNK) return;
  const inside = (x, z) => x >= x0 && z >= z0 && x < x0 + CHUNK && z < z0 + CHUNK;
  const set = (x, y, z, id) => { if (inside(x, z) && y > 0 && y < H) data[localIndex(x, y, z)] = id; };
  const get = (x, y, z) => data[localIndex(x, y, z)];
  const S = VILLAGE_SIZES[v.size], desert = v.biome === 'desert';
  const roadId = desert ? (S.paved ? CUT_SANDSTONE : SANDSTONE) : S.paved ? COBBLE : GRAVEL;
  const plazaId = desert ? CUT_SANDSTONE : COBBLE;

  // the ground: cut down or built up to the plan, cleared above, and surfaced
  for (let lz = 0; lz < CHUNK; lz++) for (let lx = 0; lx < CHUNK; lx++) {
    const x = x0 + lx, z = z0 + lz, i = x - G.bx0, j = z - G.bz0;
    if (i < 0 || j < 0 || i >= G.W || j >= G.W) continue;
    const q = i + j * G.W, k = G.kind[q];
    if (k === K_NONE) continue;
    const t = G.tgt[q], h = G.nat[q];
    if (k === K_BRIDGE || (k === K_RAIL && h < SEA_LEVEL)) {
      // a plank deck over the water, with a fence along each side on log posts down to the bed
      for (let y = t + 1; y <= Math.min(H - 1, t + 5); y++) set(x, y, z, AIR);
      set(x, t, z, PLANKS);
      if (k === K_RAIL) {
        set(x, t + 1, z, FENCE);
        if (G.post[q]) for (let y = h + 1; y < t; y++) set(x, y, z, LOG);
      }
      continue;
    }
    const sandy = t <= SEA_LEVEL + 1;
    const top = desert || sandy ? SAND : t >= SNOW_LINE ? SNOW : v.biome === 'tundra' ? SNOW_GRASS : GRASS;
    const sub = desert || sandy ? SAND : DIRT;
    if (t > h) for (let y = Math.max(1, h); y < t; y++) set(x, y, z, sub);
    else if (t < h) for (let y = t + 1; y <= h; y++) set(x, y, z, AIR);
    for (let y = t + 1; y <= Math.min(H - 1, Math.max(h, t) + 14); y++) if (get(x, y, z) !== AIR) set(x, y, z, AIR);
    if (get(x, t - 1, z) === AIR || get(x, t - 1, z) === WATER) set(x, t - 1, z, sub);
    set(x, t, z, k === K_ROAD || k === K_RAIL ? roadId : k === K_PLAZA ? plazaId : top);
    if (k === K_RAIL) set(x, t + 1, z, FENCE);
  }

  // lamps: a lantern on a post at each corner of the square, and along the streets of towns and cities
  for (const l of v.lamps) { set(l.x, l.y + 1, l.z, FENCE); set(l.x, l.y + 2, l.z, LANTERN); }

  // the well, with the village bell beside it
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const x = v.x + dx, z = v.z + dz;
    if (dx || dz) { set(x, v.y, z, COBBLE); set(x, v.y + 1, z, COBBLE); } else { set(x, v.y, z, WATER); set(x, v.y - 1, z, WATER); set(x, v.y - 2, z, COBBLE); }
  }
  set(v.x + 2, v.y + 1, v.z, VILLAGE_BELL);

  // houses: 5 x 5, plank walls on log corners, a cobblestone footing, a door to the road, windows, a torch and a table
  for (const hs of v.houses) {
    const { x, y, z, door } = hs;
    for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) {
      const wx = x + dx, wz = z + dz, edge = Math.abs(dx) === 2 || Math.abs(dz) === 2, corner = Math.abs(dx) === 2 && Math.abs(dz) === 2;
      set(wx, y, wz, edge ? COBBLE : PLANKS);
      for (let k = 1; k <= 3; k++) set(wx, y + k, wz, corner ? LOG : edge ? (k === 2 && (dx === 0 || dz === 0) ? GLASS_PANE : PLANKS) : AIR);
      set(wx, y + 4, wz, PLANKS);
      if (!edge) set(wx, y + 5, wz, slabId(0));
    }
    const dx = x + door[0], dz = z + door[1], facing = door[1] ? 0 : 1;
    set(dx, y + 1, dz, doorId(facing, false, false));
    set(dx, y + 2, dz, doorId(facing, false, true));
    set(dx + Math.sign(door[0]), y, dz + Math.sign(door[1]), GRAVEL); // the path to the road
    const bx = x - Math.sign(door[0]), bz = z - Math.sign(door[1]);
    const tw = door[0] > 0 ? 0 : door[0] < 0 ? 1 : door[1] > 0 ? 2 : 3; // the wall it hangs on: -x, +x, -z, +z
    set(bx, y + 2, bz, TORCH_WALL_W + tw);
    const side = door[0] ? [0, 1] : [1, 0];
    set(x + side[0], y + 1, z + side[1], FURN_TABLE);
    set(x - side[0], y + 1, z - side[1], CHEST);
  }

  // fields: a log border, a channel of water from the road end to the back, wheat on one side and a vegetable on the other
  for (const f of v.farms) {
    const { x, y, z, face } = f, ax = Math.abs(face[1]), az = Math.abs(face[0]); // `a`: along the road
    for (let b = -3; b <= 3; b++) for (let a = -3; a <= 3; a++) {
      const wx = x + ax * a + face[0] * b, wz = z + az * a + face[1] * b;
      if (Math.abs(a) === 3 || Math.abs(b) === 3) { set(wx, y, wz, LOG); continue; }
      if (a === 0) { set(wx, y, wz, WATER); continue; }
      set(wx, y, wz, DIRT);
      const stage = Math.floor(g.villageRand(wx, 3011, wz) * 4);
      set(wx, y + 1, wz, (a < 0 ? WHEAT_0 : crops[f.crop % crops.length]) + stage);
    }
  }
}
