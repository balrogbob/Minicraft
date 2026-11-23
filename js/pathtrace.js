// v46: path-traced lighting on WebGPU ("Path tracing" in Graphics).
//
// A hybrid: the usual WebGL renderer still draws what you see, but in three plain passes onto its canvas (the
// colour of everything without light, how far away each pixel is, and which way it faces plus whether it glows).
// Each pass is copied straight into a WebGPU texture. Then, on WebGPU:
//   trace     - for every other pixel (half size), light is followed from that spot: to the sun (or the moon),
//               to one of the nearby lights picked at random, and one bounce off whatever is in a random
//               direction (the sky, a block, a creature), lit by the sun in turn. Rays walk the blocks around you
//               block by block (the same 8 x 8 chunks the traced lighting uses), and creatures at their real
//               shape: each one is rebuilt each frame as a grid of 1/16-block cells from its posed mesh.
//   temporal  - each pixel's light is blended with what that spot got in earlier frames (found again by where it
//               is in the world), so the noise settles while you stand still
//   filter    - three passes of an edge-aware blur (stopping at edges in distance and facing)
//   composite - colour x light (+ glow), fog, onto this module's own canvas, which the WebGL renderer then draws
//               as the frame (so the hand you hold things in still draws on top)
import * as THREE from 'three';
import { CHUNK, H } from './terrain.js';
import { chunkKey, World } from './world.js';
import { BLOCKS, isWaterId, isLeaves, LAVA } from './blocks.js';

const VOX = 128, COLS = VOX / CHUNK, COL_U16 = CHUNK * CHUNK * H;
const MAX_MOBS = 48, MAX_CELLS = 1 << 21, MAX_LIGHTS = 64, MOB_GRID = 64;
const PER_FRAME = 8; // chunk columns copied in each frame
const MAX_MASKS = 2048; // different part-block shapes

// What each block is to light, for the tracer (see shapeOf in TRACE): solid cubes, glass, water, leaves,
// fences/walls/panes (joined in the shader), and everything else that is part of a block (slabs, stairs,
// torches, plants, machines and furniture) as an 8 x 8 x 8 grid of filled cells, from the same boxes the game
// uses for aiming at it. Returns { shape: Uint32Array(4096), masks: Uint32Array (16 per mask) }.
export function blockShapes() {
  const shape = new Uint32Array(4096), masks = [], seen = new Map();
  const fake = { get: () => 0 }; // (a world with nothing around: a stair on its own, no corners)
  const addMask = (bits) => {
    const key = bits.join(',');
    if (!seen.has(key)) { if (masks.length >= MAX_MASKS) return -1; seen.set(key, masks.length); masks.push(bits); }
    return seen.get(key);
  };
  const raster = (boxes) => {
    const bits = new Array(16).fill(0);
    let any = false;
    for (const b of boxes) {
      const lo = [], hi = [];
      for (let a = 0; a < 3; a++) {
        let x0 = b[a], x1 = b[a + 3];
        if (x1 - x0 < 1) { const m = (x0 + x1) / 2; x0 = m - 0.5; x1 = m + 0.5; } // (flat parts still count)
        lo.push(Math.max(0, Math.floor(x0 / 2 + 1e-6))); hi.push(Math.min(7, Math.ceil(x1 / 2 - 1e-6) - 1));
      }
      for (let k = lo[2]; k <= hi[2]; k++) for (let j = lo[1]; j <= hi[1]; j++) for (let i = lo[0]; i <= hi[0]; i++) {
        const bit = i + j * 8 + k * 64;
        bits[bit >> 5] |= 1 << (bit & 31); any = true;
      }
    }
    return any ? bits.map((v) => v >>> 0) : null;
  };
  for (let id = 1; id < Math.min(BLOCKS.length, 4096); id++) {
    const d = BLOCKS[id];
    if (!d) continue;
    if (d.liquid) { shape[id] = id === LAVA ? 1 : isWaterId(id) ? 5 : 5; continue; }
    if (isLeaves(id)) { shape[id] = 6; continue; }
    if (d.shape === 'fence' || d.shape === 'wall' || d.shape === 'pane') {
      const [t0, t1] = d.shape === 'fence' ? [6, 10] : d.shape === 'wall' ? [4, 12] : [7, 9];
      const fam = d.shape === 'fence' ? 0 : d.shape === 'wall' ? 1 : 2, tint = d.shape === 'pane' && d.sound === 'glass' ? 1 : 0;
      shape[id] = 3 | (t0 << 4) | (t1 << 9) | (tint << 14) | (fam << 15);
      continue;
    }
    let boxes = null;
    if (d.stair) boxes = World.prototype.stairModel.call(fake, 0, 0, 0, d).map((b) => b.slice(0, 6));
    else if (d.model) boxes = d.model.map((b) => b.slice(0, 6));
    else if (d.shape === 'cross') boxes = Array.from({ length: 8 }, (_, i) => [i * 2, 0, i * 2, i * 2 + 2, 13, i * 2 + 2]).concat(Array.from({ length: 8 }, (_, i) => [i * 2, 0, 14 - i * 2, i * 2 + 2, 13, 16 - i * 2]));
    else if (d.boxes || (d.shape && d.shape !== 'cube')) boxes = World.prototype.pickBoxes.call(fake, 0, 0, 0, id);
    if (!boxes) { shape[id] = d.transparent && d.sound === 'glass' ? 4 : 1; continue; } // (a whole cube)
    const bits = raster(boxes), m = bits ? addMask(bits) : -1;
    shape[id] = m < 0 ? 0 : 2 | (m << 4);
  }
  const flat = new Uint32Array(Math.max(1, masks.length) * 16);
  masks.forEach((b, i) => flat.set(b, i * 16));
  return { shape, masks: flat };
}

const COMMON = /* wgsl */`
struct U {
  invVP: mat4x4f, prevVP: mat4x4f,
  camPos: vec3f, far: f32,
  prevCam: vec3f, frame: u32,
  sunDir: vec3f, sunStr: f32,
  sunCol: vec3f, ambient: f32,
  skyCol: vec3f, nMobs: u32,
  voxO: vec3f, nLights: u32,
  fogCol: vec3f, fogNear: f32,
  size: vec2u, half: vec2u,
  fogFar: f32, reset: u32, hand: u32, glowK: f32,
  camFwd: vec3f, pad2: f32,
};
@group(0) @binding(0) var<uniform> u: U;
fn loadDist(t: texture_2d<f32>, p: vec2u) -> f32 {
  let c = vec3u(round(textureLoad(t, p, 0).rgb * 255.0));
  let d = f32(c.r * 65536u + c.g * 256u + c.b) / 16777215.0;
  return select(d * u.far, -1.0, d > 0.99999);
}
// the third picture's b: how much it glows (0-31) + 32 x how shiny (0-3) + 128 for things that move
fn glowOf(b: f32) -> f32 { return f32(u32(round(b * 255.0)) & 31u) / 31.0; }
fn shineOf(b: f32) -> u32 { return (u32(round(b * 255.0)) >> 5u) & 3u; }
fn moves(b: f32) -> bool { return u32(round(b * 255.0)) >= 128u; }
fn sgn(v: f32) -> f32 { return select(-1.0, 1.0, v >= 0.0); }
fn octDec(e0: vec2f) -> vec3f {
  let e = e0 * 2.0 - 1.0;
  var n = vec3f(e.x, 1.0 - abs(e.x) - abs(e.y), e.y);
  if (n.y < 0.0) { n = vec3f((1.0 - abs(e.y)) * sgn(e.x), n.y, (1.0 - abs(e.x)) * sgn(e.y)); }
  return normalize(n);
}
fn rayDir(p: vec2u) -> vec3f {
  let ndc = vec2f((f32(p.x) + 0.5) / f32(u.size.x) * 2.0 - 1.0, 1.0 - (f32(p.y) + 0.5) / f32(u.size.y) * 2.0);
  let f = u.invVP * vec4f(ndc, 1.0, 1.0);
  return normalize(f.xyz / f.w - u.camPos);
}
// the full-size pixel a half-size one stands for this frame (it moves round the 2 x 2 from frame to frame)
fn srcPixel(g: vec2u) -> vec2u { return min(g * 2u + vec2u(u.frame & 1u, (u.frame >> 1u) & 1u), u.size - 1u); }
`;

const TRACE = COMMON + /* wgsl */`
struct Mob { mn: vec3f, cell: f32, dims: vec3u, off: u32 };
struct Light { pos: vec3f, reach: f32, col: vec3f, size: f32 }; // (size: how wide it shines from: a torch's flame, a pool of lava)
struct Hit { t: f32, n: vec3f, col: vec3f, emit: f32, kind: u32, tr: vec3f };
@group(0) @binding(1) var gDepth: texture_2d<f32>;
@group(0) @binding(2) var gNorm: texture_2d<f32>;
@group(0) @binding(3) var<storage, read> vox: array<u32>;
@group(0) @binding(4) var<storage, read> pal: array<u32>;
@group(0) @binding(5) var<storage, read> mobs: array<Mob>;
@group(0) @binding(6) var<storage, read> cells: array<u32>;
@group(0) @binding(7) var<storage, read> lights: array<Light>;
@group(0) @binding(8) var outIrr: texture_storage_2d<rgba16float, write>;
@group(0) @binding(9) var outSpec: texture_storage_2d<rgba16float, write>;

var<private> seed: u32;
fn pcg(v: u32) -> u32 { let s = v * 747796405u + 2891336453u; let w = ((s >> ((s >> 28u) + 4u)) ^ s) * 277803737u; return (w >> 22u) ^ w; }
fn rnd() -> f32 { seed = pcg(seed); return f32(seed) / 4294967296.0; }
fn unpack(c: u32) -> vec3f { return pow(vec3f(f32(c & 255u), f32((c >> 8u) & 255u), f32((c >> 16u) & 255u)) / 255.0, vec3f(2.2)); }

// the block at c: 0xffffffff outside the traced area
fn voxId(c: vec3i) -> u32 {
  let r = c - vec3i(u.voxO);
  if (c.y < 0 || c.y >= ${H} || r.x < 0 || r.z < 0 || r.x >= ${VOX} || r.z >= ${VOX}) { return 0xffffffffu; }
  let slot = u32((c.x >> 4) & ${COLS - 1}) + u32((c.z >> 4) & ${COLS - 1}) * ${COLS}u;
  let i = slot * ${COL_U16}u + (u32(c.x & 15) | (u32(c.z & 15) << 4u) | (u32(c.y) << 8u));
  let w = vox[i >> 1u];
  return select(w & 0xffffu, w >> 16u, (i & 1u) == 1u);
}
// what each block is to light (pal[4096 + id]): kind in the low 4 bits
//   0 nothing, 1 a solid cube, 2 a part block (bits 4+: which 8 x 8 x 8 mask, from pal[8192 + 16 x mask]),
//   3 a fence, wall or pane (bits 4-8, 9-13: its post's sides in 16ths; 14: tinted (glass); 15-16: which kind,
//   joining its own kind and solid cubes), 4 glass (light through it takes its colour), 5 water, 6 leaves
fn shapeOf(id: u32) -> u32 { return pal[4096u + (id & 4095u)]; }
fn kindOf(id: u32) -> u32 { return shapeOf(id) & 15u; }
// the light through glass of colour p: its colour, as bright as can be (clear glass lets most through)
fn glassTint(p: u32) -> vec3f { let c = unpack(p); return clamp(c / max(max(c.r, max(c.g, c.b)), 0.05), vec3f(0.0), vec3f(1.0)) * 0.85; }
// is a cell of a part block filled? 0 no, 1 yes, 2 tinted glass
fn partCell(sh: u32, q: vec3i, jb: u32) -> u32 {
  if ((sh & 15u) == 2u) {
    let bit = u32(q.x + q.y * 8 + q.z * 64);
    return (pal[8192u + (sh >> 4u) * 16u + (bit >> 5u)] >> (bit & 31u)) & 1u;
  }
  let t0 = f32((sh >> 4u) & 31u); let t1 = f32((sh >> 9u) & 31u);
  let a = f32(q.x * 2); let b = f32(q.z * 2);
  let inX = a < t1 && a + 2.0 > t0; let inZ = b < t1 && b + 2.0 > t0;
  let on = (inX && inZ) || (inZ && (((jb & 1u) != 0u && a + 2.0 > t1) || ((jb & 2u) != 0u && a < t0)))
    || (inX && (((jb & 4u) != 0u && b + 2.0 > t1) || ((jb & 8u) != 0u && b < t0)));
  return select(0u, 1u + ((sh >> 14u) & 1u), on);
}
// which sides a fence, wall or pane at c joins (+x, -x, +z, -z)
fn joinsAt(c: vec3i, sh: u32) -> u32 {
  var jb = 0u;
  let ds = array<vec3i, 4>(vec3i(1, 0, 0), vec3i(-1, 0, 0), vec3i(0, 0, 1), vec3i(0, 0, -1));
  for (var k = 0u; k < 4u; k++) {
    let id = voxId(c + ds[k]);
    if (id == 0xffffffffu || id == 0u) { continue; }
    let ns = shapeOf(id); let nk = ns & 15u;
    if (nk == 1u || nk == 4u || nk == 6u || (nk == 3u && ((ns >> 15u) & 3u) == ((sh >> 15u) & 3u))) { jb |= 1u << k; }
  }
  return jb;
}
// through a part block's cell, in steps of an 8th: the time it hits something solid (or -1); tinted glass on the
// way colours tr
fn marchPart(o: vec3f, d: vec3f, c: vec3i, tIn: f32, nIn: vec3f, sh: u32, tr: ptr<function, vec3f>, tint: vec3f, nOut: ptr<function, vec3f>) -> f32 {
  let jb = select(0u, joinsAt(c, sh), (sh & 15u) == 3u);
  let p = clamp((o + d * tIn - vec3f(c)) * 8.0, vec3f(0.001), vec3f(7.999));
  var q = vec3i(floor(p));
  let s = sign(d); let st = vec3i(s);
  let dd = 1.0 / max(abs(d), vec3f(1e-6));
  var tm = (s * (vec3f(q) - p) + s * 0.5 + 0.5) * dd; // (in 8ths of a block)
  var n = nIn; var tc = 0.0; var tinted = false;
  for (var i = 0; i < 24; i++) {
    let f = partCell(sh, q, jb);
    if (f == 1u) { *nOut = n; return tIn + tc / 8.0; }
    if (f == 2u && !tinted) { *tr = *tr * tint; tinted = true; }
    if (tm.x < tm.y && tm.x < tm.z) { q.x += st.x; tc = tm.x; tm.x += dd.x; n = vec3f(-s.x, 0.0, 0.0); }
    else if (tm.y < tm.z) { q.y += st.y; tc = tm.y; tm.y += dd.y; n = vec3f(0.0, -s.y, 0.0); }
    else { q.z += st.z; tc = tm.z; tm.z += dd.z; n = vec3f(0.0, 0.0, -s.z); }
    if (any(q < vec3i(0)) || any(q > vec3i(7))) { break; }
  }
  return -1.0;
}
// along a ray through the blocks: the first solid thing it meets (h.tr: the light let through by glass, water
// and leaves on the way)
fn marchWorld(o: vec3f, d: vec3f, steps: u32) -> Hit {
  var h: Hit; h.kind = 0u; h.t = 1e9;
  var tr = vec3f(1.0);
  var c = vec3i(floor(o));
  let s = sign(d); let st = vec3i(s);
  let dd = 1.0 / max(abs(d), vec3f(1e-6));
  var tm = (s * (vec3f(c) - o) + s * 0.5 + 0.5) * dd;
  var n = vec3f(0.0); var t = 0.0;
  for (var i = 0u; i < steps; i++) {
    if (tm.x < tm.y && tm.x < tm.z) { c.x += st.x; t = tm.x; tm.x += dd.x; n = vec3f(-s.x, 0.0, 0.0); }
    else if (tm.y < tm.z) { c.y += st.y; t = tm.y; tm.y += dd.y; n = vec3f(0.0, -s.y, 0.0); }
    else { c.z += st.z; t = tm.z; tm.z += dd.z; n = vec3f(0.0, 0.0, -s.z); }
    let id = voxId(c);
    if (id == 0xffffffffu) { break; }
    if (id == 0u) { continue; }
    let sh = shapeOf(id); let kind = sh & 15u;
    if (kind == 0u) { continue; }
    let p = pal[id & 4095u];
    if (kind == 4u) { tr *= glassTint(p); continue; }
    if (kind == 5u) { tr *= exp(-vec3f(0.30, 0.10, 0.06) * (min(tm.x, min(tm.y, tm.z)) - t)); continue; } // (deeper is darker, and bluer)
    if (kind == 6u && rnd() < 0.3) { tr *= vec3f(0.55, 0.75, 0.4); continue; } // (some light gets through leaves, greened)
    var hn = n; var th = t;
    if (kind == 2u || kind == 3u) {
      th = marchPart(o, d, c, t, n, sh, &tr, glassTint(p), &hn);
      if (th < 0.0) { continue; }
    }
    h.kind = 1u; h.t = th; h.n = hn; h.col = unpack(p); h.emit = f32((p >> 24u) & 127u) / 120.0;
    break;
  }
  h.tr = tr;
  return h;
}
// creatures: each is a grid of small cells (0 = empty, else its colour; alpha 254 = glows)
fn marchMobs(o: vec3f, d: vec3f, tMax: f32) -> Hit {
  var best: Hit; best.kind = 0u; best.t = tMax;
  let dz = select(d, vec3f(1e-6), abs(d) < vec3f(1e-6));
  let inv = 1.0 / dz;
  let s = sign(dz); let st = vec3i(s);
  for (var m = 0u; m < u.nMobs; m++) {
    let mb = mobs[m];
    let mx = mb.mn + vec3f(mb.dims) * mb.cell;
    let t0 = (mb.mn - o) * inv; let t1 = (mx - o) * inv;
    let tn = min(t0, t1); let tf = max(t0, t1);
    let te = max(max(tn.x, tn.y), max(tn.z, 0.0)); let tx = min(min(tf.x, tf.y), tf.z);
    if (te > tx || te >= best.t) { continue; }
    let p = (o + d * (te + 1e-4) - mb.mn) / mb.cell;
    var c = clamp(vec3i(floor(p)), vec3i(0), vec3i(mb.dims) - 1);
    let dd = abs(inv);
    var tm = (s * (vec3f(c) - p) + s * 0.5 + 0.5) * dd;
    var n = select(select(vec3f(0.0, 0.0, -s.z), vec3f(0.0, -s.y, 0.0), tn.y >= tn.z), vec3f(-s.x, 0.0, 0.0), tn.x >= tn.y && tn.x >= tn.z);
    var tc = 0.0;
    let lim = mb.dims.x + mb.dims.y + mb.dims.z;
    for (var i = 0u; i < lim; i++) {
      let v = cells[mb.off + u32(c.x) + mb.dims.x * (u32(c.y) + mb.dims.y * u32(c.z))];
      if (v != 0u) {
        let t = te + tc * mb.cell;
        if (t < best.t) { best.kind = 2u; best.t = t; best.n = n; best.col = unpack(v); best.emit = select(0.0, 1.0, (v >> 24u) == 254u); }
        break;
      }
      if (tm.x < tm.y && tm.x < tm.z) { c.x += st.x; tc = tm.x; tm.x += dd.x; n = vec3f(-s.x, 0.0, 0.0); }
      else if (tm.y < tm.z) { c.y += st.y; tc = tm.y; tm.y += dd.y; n = vec3f(0.0, -s.y, 0.0); }
      else { c.z += st.z; tc = tm.z; tm.z += dd.z; n = vec3f(0.0, 0.0, -s.z); }
      if (any(c < vec3i(0)) || any(c >= vec3i(mb.dims))) { break; }
    }
  }
  return best;
}
fn traceAll(o: vec3f, d: vec3f, steps: u32, tMax: f32) -> Hit {
  let w = marchWorld(o, d, steps);
  var m = marchMobs(o, d, select(tMax, w.t, w.kind == 1u));
  if (m.kind == 2u) { m.tr = w.tr; return m; } // (near enough: glass beyond the creature counted too)
  return w;
}
// how much light gets from o along d to tMax away: 0 if something solid is in the way, coloured by glass
// and water
fn reach(o: vec3f, d: vec3f, tMax: f32) -> vec3f {
  let w = marchWorld(o, d, u32(min(tMax * 1.8 + 2.0, 200.0)));
  if (w.kind == 1u && w.t < tMax) { return vec3f(0.0); }
  if (marchMobs(o, d, tMax).kind == 2u) { return vec3f(0.0); }
  return w.tr;
}
fn cosDir(n: vec3f) -> vec3f {
  let r1 = rnd(); let r2 = rnd();
  let a = select(vec3f(0.0, 1.0, 0.0), vec3f(1.0, 0.0, 0.0), abs(n.y) > 0.9);
  let tu = normalize(cross(a, n)); let tv = cross(n, tu);
  let ph = 6.2831853 * r1; let r = sqrt(r2);
  return normalize(tu * (cos(ph) * r) + tv * (sin(ph) * r) + n * sqrt(1.0 - r2));
}
fn skyRad(d: vec3f) -> vec3f { return u.skyCol * (0.35 + 0.65 * clamp(d.y, 0.0, 1.0)) * 0.75; }
// light from one of the nearby lights reaching a spot at p (o: just off it) facing n (any way, for n = 0)
fn lightAt(L: Light, p: vec3f, o: vec3f, n: vec3f) -> vec3f {
  var v = L.pos + (vec3f(rnd(), rnd(), rnd()) - 0.5) * L.size - p;
  let dl = length(v); v = v / dl;
  let ndl = select(dot(n, v), 1.0, dot(n, n) < 0.5);
  if (dl >= L.reach || ndl <= 0.0) { return vec3f(0.0); }
  let k = 1.0 - dl / L.reach;
  return L.col * reach(o, v, max(dl - 0.75, 0.0)) * (k * k * ndl);
}
// sunlight reaching a spot facing n (soft: the sun is a small disc, not a point)
fn sunAt(o: vec3f, n: vec3f) -> vec3f {
  let nds = dot(n, u.sunDir);
  if (u.sunStr <= 0.0 || nds <= 0.0) { return vec3f(0.0); }
  let sj = normalize(u.sunDir + (vec3f(rnd(), rnd(), rnd()) - 0.5) * 0.035);
  return u.sunCol * reach(o, sj, 220.0) * (u.sunStr * nds);
}

// what is seen along d from o: the sky (and the sun's disc), or the thing it meets, lit roughly (sun, sky, glow)
fn radiance(o: vec3f, d: vec3f) -> vec3f {
  let h = traceAll(o, d, 96u, 120.0);
  if (h.kind == 0u) {
    let sunDisc = select(0.0, 6.0, dot(d, u.sunDir) > 0.9993) * u.sunStr;
    return (skyRad(d) * 1.25 + u.sunCol * sunDisc) * h.tr;
  }
  let hp = o + d * h.t + h.n * 0.03;
  return h.tr * h.col * (h.emit * u.glowK + sunAt(hp, h.n) + u.skyCol * 0.3 * max(h.n.y * 0.5 + 0.5, 0.2) + vec3f(u.ambient));
}
// the first water surface along the ray (its distance), or -1 (and none with your eye already in water)
fn firstWater(o: vec3f, d: vec3f, tMax: f32) -> f32 {
  var c = vec3i(floor(o));
  if (kindOf(voxId(c)) == 5u) { return -1.0; }
  let s = sign(d); let st = vec3i(s);
  let dd = 1.0 / max(abs(d), vec3f(1e-6));
  var tm = (s * (vec3f(c) - o) + s * 0.5 + 0.5) * dd;
  var t = 0.0;
  for (var i = 0u; i < 128u; i++) {
    if (tm.x < tm.y && tm.x < tm.z) { c.x += st.x; t = tm.x; tm.x += dd.x; }
    else if (tm.y < tm.z) { c.y += st.y; t = tm.y; tm.y += dd.y; }
    else { c.z += st.z; t = tm.z; tm.z += dd.z; }
    if (t >= tMax) { break; }
    let id = voxId(c);
    if (id == 0xffffffffu) { break; }
    let k = kindOf(id);
    if (k == 5u) { return t; }
    if (k == 1u || k == 6u) { break; }
  }
  return -1.0;
}
// light caught in the air along the view ray up to len away: sunbeams (seen mostly looking towards the sun) and the
// glow round lamps and lava. The sunbeams show fully only against things in shade (shade = 1: the far end of the ray
// is out of the sun), so they stand out in a dark hall or under trees while open sunny air only takes a light haze,
// not a grey wash (the fog does the rest). Murkier under water.
fn inscatter(o: vec3f, d: vec3f, len: f32, shade: f32) -> vec3f {
  if (len <= 0.5) { return vec3f(0.0); }
  let under = kindOf(voxId(vec3i(floor(o)))) == 5u;
  let dens = select(0.08, 0.12, under);
  var sun = vec3f(0.0);
  var glow = vec3f(0.0);
  let mu = max(dot(d, u.sunDir), 0.0);
  let phase = 0.6 + 3.0 * pow(mu, 8.0) + 2.0 * pow(mu, 60.0);
  if (u.sunStr > 0.0) {
    for (var i = 0u; i < 4u; i++) {
      let p = o + d * ((f32(i) + rnd()) * 0.25 * len);
      let sj = normalize(u.sunDir + (vec3f(rnd(), rnd(), rnd()) - 0.5) * 0.035);
      sun += reach(p, sj, 120.0);
    }
  }
  if (u.nLights > 0u) {
    let p = o + d * (rnd() * len);
    let L = lights[min(u32(rnd() * f32(u.nLights)), u.nLights - 1u)];
    glow = lightAt(L, p, p, vec3f(0.0)) * f32(u.nLights);
  }
  var s = u.sunCol * sun * (0.25 * len * dens * phase * u.sunStr * (0.12 + 0.88 * shade)) + glow * (len * 0.012);
  if (under) { s *= vec3f(0.35, 0.8, 0.9); }
  return s;
}

@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) gid: vec3u) {
  if (gid.x >= u.half.x || gid.y >= u.half.y) { return; }
  let px = srcPixel(gid.xy);
  seed = pcg(gid.x * 1973u + gid.y * 9277u + u.frame * 26699u);
  let dist = loadDist(gDepth, px);
  let rd = rayDir(px);
  if (dist < 0.0) { // (the sky: no surface to light, but there can be light in the air in front of it)
    textureStore(outIrr, gid.xy, vec4f(0.0, 0.0, 0.0, -1.0));
    textureStore(outSpec, gid.xy, vec4f(min(inscatter(u.camPos, rd, 64.0, 0.0), vec3f(24.0)), 1.0));
    return;
  }
  let wp = u.camPos + rd * dist;
  let ne = textureLoad(gNorm, px, 0);
  let N = octDec(ne.rg);
  // (creatures are traced as small cells, a little bigger than their drawn shape: start clear of them)
  let o = wp + N * select(0.03, 0.12, moves(ne.b));
  let sunHere = sunAt(o, N);
  var irr = vec3f(u.ambient) + sunHere;
  // one bounce (or the sky)
  let D = cosDir(N);
  let h = traceAll(o, D, 72u, 90.0);
  if (h.kind == 0u) { irr += skyRad(D) * h.tr; }
  else {
    let hp = o + D * h.t + h.n * 0.03;
    irr += h.tr * h.col * (h.emit * u.glowK + sunAt(hp, h.n) + u.skyCol * 0.3 + vec3f(u.ambient));
  }
  // two of the nearby lights (torches, lamps, pools of lava), picked at random and counted for all of them
  for (var j = 0u; j < min(u.nLights, 2u); j++) {
    let L = lights[min(u32(rnd() * f32(u.nLights)), u.nLights - 1u)];
    irr += lightAt(L, wp, o, N) * (f32(u.nLights) / f32(min(u.nLights, 2u)));
  }
  textureStore(outIrr, gid.xy, vec4f(min(irr, vec3f(24.0)), dist));
  // (v47) what shiny things mirror, and the light caught in the air on the way here
  var spec = inscatter(u.camPos, rd, min(dist, 64.0), select(1.0, 0.0, dot(sunHere, vec3f(1.0)) > 0.001));
  let sh = shineOf(ne.b);
  if (sh != 0u) {
    var R = reflect(rd, N);
    if (sh == 2u) { R = normalize(R + (vec3f(rnd(), rnd(), rnd()) - 0.5) * 0.06); } // (metal: a little blurred)
    if (dot(R, N) > 0.0) {
      let F = select(select(0.04, 0.02, sh == 3u) + 0.96 * pow(1.0 - max(dot(-rd, N), 0.0), 5.0), 0.6, sh == 2u);
      spec += radiance(o, R) * (F * select(1.0, 0.7, sh == 3u));
    }
  }
  // the water surface in front of it, if any: it mirrors what's above it (more the more slanting you look)
  let wt = firstWater(u.camPos, rd, min(dist, 96.0));
  if (wt > 0.0) {
    let wpos = u.camPos + rd * wt;
    let ph = f32(u.frame) * 0.04;
    let Nw = normalize(vec3f(sin(wpos.x * 1.3 + ph) * 0.03 + sin(wpos.z * 2.1 - ph * 1.4) * 0.02, 1.0, cos(wpos.z * 1.7 + ph * 1.2) * 0.03 + cos(wpos.x * 2.6 + ph) * 0.02));
    let Rw = reflect(rd, Nw);
    let F = 0.02 + 0.98 * pow(1.0 - max(-rd.y, 0.0), 5.0);
    if (Rw.y > 0.0) { spec += radiance(wpos + vec3f(0.0, 0.02, 0.0), Rw) * F; }
  }
  textureStore(outSpec, gid.xy, vec4f(min(spec, vec3f(24.0)), 1.0));
}
`;

const TEMPORAL = COMMON + /* wgsl */`
@group(0) @binding(1) var cur: texture_2d<f32>;
@group(0) @binding(2) var hist: texture_2d<f32>;
@group(0) @binding(3) var histD: texture_2d<f32>;
@group(0) @binding(4) var outH: texture_storage_2d<rgba16float, write>;
@group(0) @binding(5) var outD: texture_storage_2d<rgba16float, write>;
@group(0) @binding(6) var curS: texture_2d<f32>;
@group(0) @binding(7) var histS: texture_2d<f32>;
@group(0) @binding(8) var outS: texture_storage_2d<rgba16float, write>;
@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) gid: vec3u) {
  if (gid.x >= u.half.x || gid.y >= u.half.y) { return; }
  let c = textureLoad(cur, gid.xy, 0);
  let cs = textureLoad(curS, gid.xy, 0).rgb;
  if (c.a < 0.0) {
    textureStore(outH, gid.xy, vec4f(0.0)); textureStore(outD, gid.xy, vec4f(-1.0));
    // (the sky: light in the air, kept in the same pixel for a few frames)
    let hs = textureLoad(histS, gid.xy, 0);
    textureStore(outS, gid.xy, vec4f(select(mix(hs.rgb, cs, 0.25), cs, u.reset != 0u || hs.a > 0.0), -1.0));
    return;
  }
  var accS = cs;
  let wp = u.camPos + rayDir(srcPixel(gid.xy)) * c.a;
  var acc = c.rgb; var n = 1.0;
  let clip = u.prevVP * vec4f(wp, 1.0);
  if (u.reset == 0u && clip.w > 0.0) {
    let ndc = clip.xy / clip.w;
    let hp = vec2f((ndc.x * 0.5 + 0.5) * f32(u.half.x), (0.5 - ndc.y * 0.5) * f32(u.half.y));
    if (hp.x >= 0.0 && hp.y >= 0.0 && hp.x < f32(u.half.x) && hp.y < f32(u.half.y)) {
      let q = vec2u(hp);
      let pd = textureLoad(histD, q, 0).r;
      let want = distance(wp, u.prevCam);
      if (pd > 0.0 && abs(pd - want) < 0.06 * want + 0.12) {
        let h = textureLoad(hist, q, 0);
        n = min(h.a + 1.0, 20.0);
        acc = mix(h.rgb, c.rgb, 1.0 / n);
        accS = mix(textureLoad(histS, q, 0).rgb, cs, 1.0 / min(n, 8.0)); // (reflections move with you: kept less long)
      }
    }
  }
  textureStore(outH, gid.xy, vec4f(acc, n));
  textureStore(outD, gid.xy, vec4f(c.a));
  textureStore(outS, gid.xy, vec4f(accS, 1.0));
}
`;

const ATROUS = COMMON + /* wgsl */`
@group(0) @binding(1) var src: texture_2d<f32>;
@group(0) @binding(2) var dep: texture_2d<f32>;
@group(0) @binding(3) var gNorm: texture_2d<f32>;
@group(0) @binding(4) var dst: texture_storage_2d<rgba16float, write>;
@group(0) @binding(5) var<uniform> stepW: vec4u;
@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) gid: vec3u) {
  if (gid.x >= u.half.x || gid.y >= u.half.y) { return; }
  let dp = textureLoad(dep, gid.xy, 0).r;
  let c0 = textureLoad(src, gid.xy, 0);
  if (dp < 0.0) { textureStore(dst, gid.xy, c0); return; }
  let np = octDec(textureLoad(gNorm, srcPixel(gid.xy), 0).rg);
  let k = array<f32, 3>(0.375, 0.25, 0.0625);
  // (fewer samples counted so far: blur wider)
  let spread = 1.0 + 3.0 / c0.a;
  var acc = vec3f(0.0); var ws = 0.0;
  for (var j = -2; j <= 2; j++) {
    for (var i = -2; i <= 2; i++) {
      let q = vec2i(gid.xy) + vec2i(i, j) * i32(stepW.x);
      if (q.x < 0 || q.y < 0 || q.x >= i32(u.half.x) || q.y >= i32(u.half.y)) { continue; }
      let dq = textureLoad(dep, vec2u(q), 0).r;
      if (dq < 0.0) { continue; }
      let nq = octDec(textureLoad(gNorm, srcPixel(vec2u(q)), 0).rg);
      let w = k[abs(i)] * k[abs(j)] * exp(-abs(dq - dp) / ((0.02 * dp + 0.05) * spread * f32(stepW.x))) * pow(max(dot(nq, np), 0.0), 24.0);
      acc += textureLoad(src, vec2u(q), 0).rgb * w; ws += w;
    }
  }
  textureStore(dst, gid.xy, vec4f(acc / max(ws, 1e-5), c0.a));
}
`;

const COMPOSITE = COMMON + /* wgsl */`
@group(0) @binding(1) var gAlb: texture_2d<f32>;
@group(0) @binding(2) var gDepth: texture_2d<f32>;
@group(0) @binding(3) var gNorm: texture_2d<f32>;
@group(0) @binding(4) var irr: texture_2d<f32>;
@group(0) @binding(5) var dep: texture_2d<f32>;
@group(0) @binding(6) var gHand: texture_2d<f32>;
@group(0) @binding(7) var specT: texture_2d<f32>;
@vertex fn vs(@builtin(vertex_index) i: u32) -> @builtin(position) vec4f {
  let p = vec2f(f32((i << 1u) & 2u), f32(i & 2u));
  return vec4f(p * 2.0 - 1.0, 0.0, 1.0);
}
fn toLin(c: vec3f) -> vec3f { return select(pow((c + 0.055) / 1.055, vec3f(2.4)), c / 12.92, c <= vec3f(0.04045)); }
fn toSRGB(c0: vec3f) -> vec3f { let c = clamp(c0, vec3f(0.0), vec3f(1.0)); return select(1.055 * pow(c, vec3f(1.0 / 2.4)) - 0.055, c * 12.92, c <= vec3f(0.0031308)); }
@fragment fn fs(@builtin(position) fc: vec4f) -> @location(0) vec4f {
  let p = vec2u(fc.xy);
  if (u.hand != 0u) {
    let hc = textureLoad(gHand, p, 0).rgb;
    if (!(hc.r > 0.996 && hc.g < 0.004 && hc.b > 0.996)) { return vec4f(hc, 1.0); } // (the thing in your hand, drawn as usual)
  }
  let alb = textureLoad(gAlb, p, 0).rgb;
  let dist = loadDist(gDepth, p);
  if (dist < 0.0) { // (the sky, the sun, the clouds: as drawn, and any light in the air in front of them)
    let sp = textureLoad(specT, min(p / 2u, u.half - 1u), 0).rgb;
    return vec4f(toSRGB(toLin(alb) + sp), 1.0);
  }
  let ne = textureLoad(gNorm, p, 0);
  let n = octDec(ne.rg);
  // the light: from the four nearest half-size pixels, those at about the same distance and facing counting most
  let hp = (vec2f(p) - 0.5) * 0.5;
  let b = vec2i(floor(hp)); let f = hp - floor(hp);
  var l = vec3f(0.0); var ws = 0.0; var sp = vec3f(0.0);
  for (var k = 0; k < 4; k++) {
    let o = vec2i(k & 1, k >> 1);
    let q = clamp(b + o, vec2i(0), vec2i(u.half) - 1);
    let dq = textureLoad(dep, vec2u(q), 0).r;
    let wb = select(1.0 - f.x, f.x, o.x == 1) * select(1.0 - f.y, f.y, o.y == 1);
    let nq = octDec(textureLoad(gNorm, srcPixel(vec2u(q)), 0).rg);
    let w = (wb + 0.01) * select(0.0, 1.0, dq > 0.0) * exp(-abs(dq - dist) / (0.03 * dist + 0.05)) * pow(max(dot(nq, n), 0.0), 8.0);
    l += textureLoad(irr, vec2u(q), 0).rgb * w; ws += w;
    sp += textureLoad(specT, vec2u(q), 0).rgb * w;
  }
  if (ws < 1e-4) { l = vec3f(u.ambient + 0.3 * u.sunStr); sp = vec3f(0.0); } else { l /= ws; sp /= ws; }
  let a = toLin(alb);
  let metal = shineOf(ne.b) == 2u;
  // (metal mirrors in its own colour, and shows less of its own colour lit)
  if (metal) { sp *= mix(vec3f(1.0), a / max(max(a.r, max(a.g, a.b)), 0.05), 0.7); }
  var c = a * l * select(1.0, 0.55, metal) + a * glowOf(ne.b) * u.glowK + sp;
  c = c / (1.0 + max(max(c.r, max(c.g, c.b)) - 0.85, 0.0) * 0.6); // (a soft shoulder: no hard clipping in bright sun)
  // fog as the usual picture has it: by depth straight ahead, mixed in after the colour is made ready for the screen
  let depth = dist * dot(rayDir(p), u.camFwd);
  let fogK = clamp((depth - u.fogNear) / max(u.fogFar - u.fogNear, 0.001), 0.0, 1.0);
  return vec4f(mix(toSRGB(c), u.fogCol, fogK), 1.0);
}
`;

export class PathTracer {
  constructor() {
    this.ready = false;
    this.failed = null;
    this.canvas = document.createElement('canvas');
    this.w = this.h = 0;
    this.frame = 0;
    this.tags = new Array(COLS * COLS).fill(null);
    this.zero = new Uint16Array(COL_U16);
    this.ub = new ArrayBuffer(288); this.uf = new Float32Array(this.ub); this.uu = new Uint32Array(this.ub);
    this.prevVP = new THREE.Matrix4(); this.prevCam = new THREE.Vector3(); this.havePrev = false;
    this.mobHead = new ArrayBuffer(MAX_MOBS * 32); this.mobF = new Float32Array(this.mobHead); this.mobU = new Uint32Array(this.mobHead);
    this.cells = new Uint32Array(MAX_CELLS);
    this.mobN = 0; this.cellsUsed = 0;
    this.lightBuf = new Float32Array(MAX_LIGHTS * 8); this.nLights = 0;
    this.vtx = new WeakMap(); // (scratch arrays for transformed vertices, per geometry)
  }

  // (for tests: draw into a texture that snapshot() reads back, instead of showing the canvas)
  static headless = false;

  static available() { return typeof navigator !== 'undefined' && !!navigator.gpu; }

  async init() {
    const adapter = await navigator.gpu.requestAdapter({ powerPreference: 'high-performance' });
    if (!adapter) throw new Error('no WebGPU adapter');
    const d = this.device = await adapter.requestDevice({
      requiredLimits: { maxStorageBufferBindingSize: Math.min(adapter.limits.maxStorageBufferBindingSize, 1 << 27) },
    });
    d.lost.then((info) => { this.ready = false; this.failed = new Error(`WebGPU device lost: ${info.message}`); });
    this.headless = PathTracer.headless;
    if (this.headless) this.format = 'rgba8unorm';
    else {
      this.ctx = this.canvas.getContext('webgpu');
      this.format = navigator.gpu.getPreferredCanvasFormat();
      this.ctx.configure({ device: d, format: this.format, alphaMode: 'opaque' });
    }
    const S = GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC; // (COPY_SRC: so tests can read them back)
    this.uBuf = d.createBuffer({ size: 288, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });
    this.voxBuf = d.createBuffer({ size: COLS * COLS * COL_U16 * 2, usage: S });
    this.palBuf = d.createBuffer({ size: (8192 + MAX_MASKS * 16) * 4, usage: S }); // (colours, shapes, masks)
    this.mobBuf = d.createBuffer({ size: MAX_MOBS * 32, usage: S });
    this.cellBuf = d.createBuffer({ size: MAX_CELLS * 4, usage: S });
    this.lightGpu = d.createBuffer({ size: MAX_LIGHTS * 32, usage: S });
    this.steps = [1, 2, 4].map((s) => { const b = d.createBuffer({ size: 16, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST }); d.queue.writeBuffer(b, 0, new Uint32Array([s, 0, 0, 0])); return b; });
    const mod = (code) => d.createShaderModule({ code });
    d.pushErrorScope('validation');
    this.pTrace = d.createComputePipeline({ layout: 'auto', compute: { module: mod(TRACE), entryPoint: 'main' } });
    this.pTemporal = d.createComputePipeline({ layout: 'auto', compute: { module: mod(TEMPORAL), entryPoint: 'main' } });
    this.pAtrous = d.createComputePipeline({ layout: 'auto', compute: { module: mod(ATROUS), entryPoint: 'main' } });
    const cm = mod(COMPOSITE);
    this.pComp = d.createRenderPipeline({ layout: 'auto', vertex: { module: cm, entryPoint: 'vs' }, fragment: { module: cm, entryPoint: 'fs', targets: [{ format: this.format }] }, primitive: { topology: 'triangle-list' } });
    const err = await d.popErrorScope();
    if (err) throw new Error(err.message);
    this.ready = true;
  }

  setPalette(data) {
    const q = this.device.queue, sh = blockShapes();
    q.writeBuffer(this.palBuf, 0, data.buffer, data.byteOffset, 4096 * 4);
    q.writeBuffer(this.palBuf, 4096 * 4, sh.shape);
    q.writeBuffer(this.palBuf, 8192 * 4, sh.masks);
    this.shapes = sh;
  }

  resize(w, h) {
    if (w === this.w && h === this.h) return;
    const d = this.device;
    this.w = w; this.h = h; this.canvas.width = w; this.canvas.height = h;
    this.hw = Math.ceil(w / 2); this.hh = Math.ceil(h / 2);
    for (const t of this.textures ?? []) t.destroy();
    const full = () => d.createTexture({ size: [w, h], format: 'rgba8unorm', usage: GPUTextureUsage.COPY_DST | GPUTextureUsage.COPY_SRC | GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.RENDER_ATTACHMENT });
    const half = () => d.createTexture({ size: [this.hw, this.hh], format: 'rgba16float', usage: GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.TEXTURE_BINDING });
    this.g = [full(), full(), full(), full()];
    this.cur = half(); this.hist = [half(), half()]; this.histD = [half(), half()]; this.filt = [half(), half()];
    this.curS = half(); this.histS = [half(), half()]; // (v47: reflections and light in the air)
    this.textures = [...this.g, this.cur, ...this.hist, ...this.histD, ...this.filt, this.curS, ...this.histS];
    if (this.headless) { this.out = d.createTexture({ size: [w, h], format: 'rgba8unorm', usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC }); this.textures.push(this.out); }
    const v = (t) => t.createView();
    const bg = (p, entries) => d.createBindGroup({ layout: p.getBindGroupLayout(0), entries: entries.map((r, i) => ({ binding: i, resource: r })) });
    const U = { buffer: this.uBuf };
    this.bTrace = bg(this.pTrace, [U, v(this.g[1]), v(this.g[2]), { buffer: this.voxBuf }, { buffer: this.palBuf }, { buffer: this.mobBuf }, { buffer: this.cellBuf }, { buffer: this.lightGpu }, v(this.cur), v(this.curS)]);
    this.bTemporal = [0, 1].map((k) => bg(this.pTemporal, [U, v(this.cur), v(this.hist[k]), v(this.histD[k]), v(this.hist[1 - k]), v(this.histD[1 - k]), v(this.curS), v(this.histS[k]), v(this.histS[1 - k])]));
    // the blur: history -> filt0 -> filt1 -> filt0 (steps 1, 2, 4)
    this.bAtrous = [0, 1].map((k) => [
      bg(this.pAtrous, [U, v(this.hist[1 - k]), v(this.histD[1 - k]), v(this.g[2]), v(this.filt[0]), { buffer: this.steps[0] }]),
      bg(this.pAtrous, [U, v(this.filt[0]), v(this.histD[1 - k]), v(this.g[2]), v(this.filt[1]), { buffer: this.steps[1] }]),
      bg(this.pAtrous, [U, v(this.filt[1]), v(this.histD[1 - k]), v(this.g[2]), v(this.filt[0]), { buffer: this.steps[2] }]),
    ]);
    this.bComp = [0, 1].map((k) => bg(this.pComp, [U, v(this.g[0]), v(this.g[1]), v(this.g[2]), v(this.filt[0]), v(this.histD[1 - k]), v(this.g[3]), v(this.histS[1 - k])]));
    this.havePrev = false;
  }

  // copy what the WebGL canvas holds now into G-buffer picture i (0 colour, 1 distance, 2 facing + glow, 3 the hand)
  capture(i, glCanvas) {
    this.device.queue.copyExternalImageToTexture({ source: glCanvas }, { texture: this.g[i] }, [this.w, this.h]);
  }

  // the blocks around you: copy in chunk columns that changed (nearest first)
  updateWorld(world, px, pz) {
    const pcx = Math.floor(px / CHUNK), pcz = Math.floor(pz / CHUNK), ocx = pcx - COLS / 2, ocz = pcz - COLS / 2;
    this.voxO = [ocx * CHUNK, 0, ocz * CHUNK];
    const todo = [];
    for (let cx = ocx; cx < ocx + COLS; cx++) for (let cz = ocz; cz < ocz + COLS; cz++) {
      const slot = (cx & (COLS - 1)) + (cz & (COLS - 1)) * COLS, c = world.chunks.get(chunkKey(cx, cz));
      const tag = c ? `${cx},${cz}:${c.rev ?? 0}` : `${cx},${cz}:-`;
      if (this.tags[slot] !== tag) todo.push([(cx - pcx) ** 2 + (cz - pcz) ** 2, slot, tag, c]);
    }
    todo.sort((a, b) => a[0] - b[0]);
    for (const [, slot, tag, c] of todo.slice(0, PER_FRAME)) {
      const data = c ? c.data : this.zero;
      this.device.queue.writeBuffer(this.voxBuf, slot * COL_U16 * 2, data.buffer, data.byteOffset, COL_U16 * 2);
      this.tags[slot] = tag;
    }
  }

  // creatures (and you) at their real shape: each posed mesh sampled into a grid of small cells
  updateMobs(objects, cam) {
    let n = 0, used = 0;
    const box = this._box ??= new THREE.Box3(), size = this._size ??= new THREE.Vector3();
    const near = objects.filter((o) => o && o.position.distanceToSquared(cam) < 40 * 40)
      .sort((a, b) => a.position.distanceToSquared(cam) - b.position.distanceToSquared(cam)).slice(0, MAX_MOBS);
    for (const root of near) {
      root.updateMatrixWorld(true);
      box.makeEmpty();
      root.traverse((o) => { if (o.isMesh && this.partShown(o, root)) box.expandByObject(o, true); });
      if (box.isEmpty()) continue;
      box.getSize(size);
      const cell = Math.max(1 / 16, Math.max(size.x, size.y, size.z) / (MOB_GRID - 2));
      const dx = Math.ceil(size.x / cell) + 2, dy = Math.ceil(size.y / cell) + 2, dz = Math.ceil(size.z / cell) + 2;
      if (used + dx * dy * dz > MAX_CELLS) break;
      const mn = box.min.clone().subScalar(cell);
      this.cells.fill(0, used, used + dx * dy * dz);
      // (boxes filled solid; anything else, its surface; things that glow, like eyes, last so they show)
      const parts = [];
      root.traverse((o) => { if (o.isMesh && this.partShown(o, root)) parts.push(o); });
      parts.sort((a, b) => (a.material?.userData?.ptGlow ? 1 : 0) - (b.material?.userData?.ptGlow ? 1 : 0));
      for (const o of parts) {
        if (o.geometry.type === 'BoxGeometry') this.fillBox(o, mn, cell, dx, dy, dz, used);
        else this.sample(o, mn, cell, dx, dy, dz, used);
      }
      this.mobF.set([mn.x, mn.y, mn.z, cell], n * 8);
      this.mobU.set([dx, dy, dz, used], n * 8 + 4);
      used += dx * dy * dz; n++;
    }
    this.mobN = n;
    if (n) {
      this.device.queue.writeBuffer(this.mobBuf, 0, this.mobHead, 0, n * 32);
      this.device.queue.writeBuffer(this.cellBuf, 0, this.cells.buffer, 0, used * 4);
    }
  }

  // is this part showing? (the root itself may be hidden, like your body in first person, which still casts light)
  partShown(o, root) {
    for (let p = o; p && p !== root; p = p.parent) if (!p.visible) return false;
    return true;
  }

  // a box part: every cell whose middle is inside it (turned and scaled as it is now)
  fillBox(mesh, mn, cell, dx, dy, dz, off) {
    const g = mesh.geometry, P = g.parameters, hw = P.width / 2, hh = P.height / 2, hd = P.depth / 2;
    const M = mesh.matrixWorld, inv = this._inv ??= new THREE.Matrix4(), v = this._v ??= new THREE.Vector3();
    inv.copy(M).invert();
    const ie = inv.elements;
    // its colour: the top face's (the brightest of its shaded faces)
    const col = g.attributes.color, mc = mesh.material?.color;
    let r = 0.6, gg = 0.6, b = 0.6;
    if (col) { r = col.getX(8); gg = col.getY(8); b = col.getZ(8); } else if (mc) { r = mc.r; gg = mc.g; b = mc.b; }
    const enc = (x) => Math.round(Math.min(1, Math.max(0, x)) ** (1 / 2.2) * 255);
    const glow = !!mesh.material?.userData?.ptGlow;
    const word = (enc(r) | (enc(gg) << 8) | (enc(b) << 16) | ((glow ? 254 : 255) << 24)) >>> 0;
    // where it reaches, in cells
    let x0 = 1e9, y0 = 1e9, z0 = 1e9, x1 = -1e9, y1 = -1e9, z1 = -1e9;
    for (let k = 0; k < 8; k++) {
      v.set(k & 1 ? hw : -hw, k & 2 ? hh : -hh, k & 4 ? hd : -hd).applyMatrix4(M);
      x0 = Math.min(x0, v.x); y0 = Math.min(y0, v.y); z0 = Math.min(z0, v.z); x1 = Math.max(x1, v.x); y1 = Math.max(y1, v.y); z1 = Math.max(z1, v.z);
    }
    const i0 = Math.max(0, Math.floor((x0 - mn.x) / cell)), i1 = Math.min(dx - 1, Math.floor((x1 - mn.x) / cell));
    const j0 = Math.max(0, Math.floor((y0 - mn.y) / cell)), j1 = Math.min(dy - 1, Math.floor((y1 - mn.y) / cell));
    const k0 = Math.max(0, Math.floor((z0 - mn.z) / cell)), k1 = Math.min(dz - 1, Math.floor((z1 - mn.z) / cell));
    // (thin parts, like eyes, still get a cell: half a cell of slack, in the part's own size)
    const sc = Math.cbrt(Math.abs(M.determinant())) || 1, tol = 0.5 * cell / sc;
    const tx = hw + tol, ty = hh + tol, tz = hd + tol;
    for (let k = k0; k <= k1; k++) for (let j = j0; j <= j1; j++) {
      const wy = mn.y + (j + 0.5) * cell, wz = mn.z + (k + 0.5) * cell;
      // the row's start in the part's own space, and the step along it
      let lx = ie[0] * (mn.x + (i0 + 0.5) * cell) + ie[4] * wy + ie[8] * wz + ie[12];
      let ly = ie[1] * (mn.x + (i0 + 0.5) * cell) + ie[5] * wy + ie[9] * wz + ie[13];
      let lz = ie[2] * (mn.x + (i0 + 0.5) * cell) + ie[6] * wy + ie[10] * wz + ie[14];
      const sx = ie[0] * cell, sy = ie[1] * cell, sz = ie[2] * cell, row = off + dx * (j + dy * k);
      for (let i = i0; i <= i1; i++, lx += sx, ly += sy, lz += sz) {
        if (lx > -tx && lx < tx && ly > -ty && ly < ty && lz > -tz && lz < tz) this.cells[row + i] = word;
      }
    }
  }

  sample(mesh, mn, cell, dx, dy, dz, off) {
    const g = mesh.geometry, pos = g.attributes.position, col = g.attributes.color, idx = g.index;
    if (!pos) return;
    let w = this.vtx.get(g);
    if (!w || w.length < pos.count * 3) { w = new Float32Array(pos.count * 3); this.vtx.set(g, w); }
    const e = mesh.matrixWorld.elements;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
      w[i * 3] = e[0] * x + e[4] * y + e[8] * z + e[12];
      w[i * 3 + 1] = e[1] * x + e[5] * y + e[9] * z + e[13];
      w[i * 3 + 2] = e[2] * x + e[6] * y + e[10] * z + e[14];
    }
    const mc = mesh.material?.color, glow = !!mesh.material?.userData?.ptGlow;
    const enc = (v) => Math.round(Math.min(1, Math.max(0, v)) ** (1 / 2.2) * 255); // (linear colours -> 8-bit sRGB)
    const colourOf = (i) => (col ? [col.getX(i), col.getY(i), col.getZ(i)] : mc ? [mc.r, mc.g, mc.b] : [0.6, 0.6, 0.6]);
    const tris = idx ? idx.count / 3 : pos.count / 3;
    const inv = 1 / cell;
    for (let t = 0; t < tris; t++) {
      const a = idx ? idx.getX(t * 3) : t * 3, b = idx ? idx.getX(t * 3 + 1) : t * 3 + 1, c = idx ? idx.getX(t * 3 + 2) : t * 3 + 2;
      const ax = w[a * 3], ay = w[a * 3 + 1], az = w[a * 3 + 2];
      const ux = w[b * 3] - ax, uy = w[b * 3 + 1] - ay, uz = w[b * 3 + 2] - az;
      const vx = w[c * 3] - ax, vy = w[c * 3 + 1] - ay, vz = w[c * 3 + 2] - az;
      const len = Math.max(Math.hypot(ux, uy, uz), Math.hypot(vx, vy, vz), Math.hypot(ux - vx, uy - vy, uz - vz));
      const k = Math.min(160, Math.ceil(len * inv * 1.5) + 1);
      const ca = colourOf(a), cb = colourOf(b), cc = colourOf(c);
      for (let i = 0; i <= k; i++) for (let j = 0; i + j <= k; j++) {
        const s = i / k, r = j / k;
        const x = Math.floor((ax + ux * s + vx * r - mn.x) * inv), y = Math.floor((ay + uy * s + vy * r - mn.y) * inv), z = Math.floor((az + uz * s + vz * r - mn.z) * inv);
        if (x < 0 || y < 0 || z < 0 || x >= dx || y >= dy || z >= dz) continue;
        const q = 1 - s - r;
        const R = enc(ca[0] * q + cb[0] * s + cc[0] * r), G = enc(ca[1] * q + cb[1] * s + cc[1] * r), B = enc(ca[2] * q + cb[2] * s + cc[2] * r);
        this.cells[off + x + dx * (y + dy * z)] = (R | (G << 8) | (B << 16) | ((glow ? 254 : 255) << 24)) >>> 0;
      }
    }
  }

  setLights(list) {
    const n = Math.min(MAX_LIGHTS, list.length);
    for (let i = 0; i < n; i++) {
      const l = list[i], c = l.c ?? [1, 0.86, 0.66];
      this.lightBuf.set([l.x, l.y, l.z, l.r, c[0], c[1], c[2], l.size ?? 0.3], i * 8);
    }
    this.nLights = n;
    if (n) this.device.queue.writeBuffer(this.lightGpu, 0, this.lightBuf, 0, n * 8);
  }

  // trace, settle, filter and draw the frame onto this.canvas
  render(camera, p) {
    const d = this.device, f = this.uf, uu = this.uu;
    const vp = new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    const inv = new THREE.Matrix4().multiplyMatrices(camera.matrixWorld, camera.projectionMatrixInverse);
    f.set(inv.elements, 0);
    f.set((this.havePrev ? this.prevVP : vp).elements, 16);
    const cp = camera.getWorldPosition(new THREE.Vector3());
    f.set([cp.x, cp.y, cp.z, camera.far], 32);
    f.set([this.prevCam.x, this.prevCam.y, this.prevCam.z], 36); uu[39] = this.frame;
    f.set([p.sunDir.x, p.sunDir.y, p.sunDir.z, p.sunStr], 40);
    f.set([p.sunCol[0], p.sunCol[1], p.sunCol[2], p.ambient], 44);
    f.set([p.sky.r, p.sky.g, p.sky.b], 48); uu[51] = this.mobN;
    f.set(this.voxO ?? [0, 0, 0], 52); uu[55] = this.nLights;
    const fc = p.fogCol.getRGB(this._fc ??= { r: 0, g: 0, b: 0 }, THREE.SRGBColorSpace); // (mixed in as the screen shows it)
    f.set([fc.r, fc.g, fc.b, p.fogNear], 56);
    uu[60] = this.w; uu[61] = this.h; uu[62] = this.hw; uu[63] = this.hh;
    const fw = camera.getWorldDirection(this._fw ??= new THREE.Vector3());
    f.set([fw.x, fw.y, fw.z, 0], 68);
    f[64] = p.fogFar; uu[65] = this.havePrev ? 0 : 1; uu[66] = p.hand ? 1 : 0; f[67] = p.glowK ?? 2.5;
    d.queue.writeBuffer(this.uBuf, 0, this.ub);
    const k = this.frame & 1;
    const enc = d.createCommandEncoder();
    const gx = Math.ceil(this.hw / 8), gy = Math.ceil(this.hh / 8);
    const run = (pipe, bind) => { const c = enc.beginComputePass(); c.setPipeline(pipe); c.setBindGroup(0, bind); c.dispatchWorkgroups(gx, gy); c.end(); };
    run(this.pTrace, this.bTrace);
    run(this.pTemporal, this.bTemporal[k]);
    for (const b of this.bAtrous[k]) run(this.pAtrous, b);
    const rp = enc.beginRenderPass({ colorAttachments: [{ view: (this.headless ? this.out : this.ctx.getCurrentTexture()).createView(), loadOp: 'clear', storeOp: 'store', clearValue: [0, 0, 0, 1] }] });
    rp.setPipeline(this.pComp); rp.setBindGroup(0, this.bComp[k]); rp.draw(3); rp.end();
    d.queue.submit([enc.finish()]);
    this.prevVP.copy(vp); this.prevCam.copy(cp); this.havePrev = true;
    this.frame++;
  }

  // forget the light gathered over the last frames (after a jump: a new place, or the time of day)
  resetHistory() { this.havePrev = false; }

  // the last frame (or one of the plain pictures), read back (headless only): { width, height, data (rgba) }
  async snapshot(tex = this.out) {
    const d = this.device, bpr = Math.ceil(this.w * 4 / 256) * 256;
    const b = d.createBuffer({ size: bpr * this.h, usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ });
    const e = d.createCommandEncoder();
    e.copyTextureToBuffer({ texture: tex }, { buffer: b, bytesPerRow: bpr }, [this.w, this.h]);
    d.queue.submit([e.finish()]);
    await b.mapAsync(GPUMapMode.READ);
    const src = new Uint8Array(b.getMappedRange()), data = new Uint8ClampedArray(this.w * this.h * 4);
    for (let y = 0; y < this.h; y++) data.set(src.subarray(y * bpr, y * bpr + this.w * 4), y * this.w * 4);
    b.unmap(); b.destroy();
    return { width: this.w, height: this.h, data };
  }

  dispose() {
    for (const t of this.textures ?? []) t.destroy();
    for (const b of [this.uBuf, this.voxBuf, this.palBuf, this.mobBuf, this.cellBuf, this.lightGpu, ...(this.steps ?? [])]) b?.destroy();
    this.device?.destroy();
    this.ready = false;
  }
}
