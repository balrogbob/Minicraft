// Power from water: water wheels turned by flowing water drive shafts and gears, which drive machines
// (the rock crusher).
//
// How parts connect:
//  - shafts, gears and wheels join end to end along their axle (same axle direction, next cell along it);
//  - two small gears on parallel axles mesh when side by side (next cell across the axle): same speed;
//  - a large gear meshes with a small gear one cell diagonally across the axle: the small one turns
//    twice as fast as the large one (and the large one half as fast as the small one);
//  - a crusher is driven by any shaft, gear or wheel whose axle points into one of its faces.
//
// Each connected set of parts is a network. Every water wheel with flowing water beside it turns at 1x
// and gives WHEEL_POWER. Machines take CRUSHER_LOAD for each 1x of their speed, so gearing one wheel up
// to 2x is all it can drive, and going faster needs more wheels. Every shaft and gear also has a
// limit to the load it can carry (by material). Too much load, or wheels geared to different speeds,
// and the whole network stops.
import * as THREE from 'three';
import {
  BLOCKS, KINETIC_MATS, WHEEL_POWER, CRUSHER_LOAD, isFlowing, T,
} from './blocks.js';
import { TILE, ATLAS_COLS } from './textures.js';
import { CHUNK } from './terrain.js';
import { lightBrightness, skyBrightness } from './world.js';

const SOLVE_EVERY = 0.4; // seconds between re-checking the networks (and which wheels have water)
const TURN_RATE = Math.PI; // radians per second at 1x (a slow half turn a second)
const UNIT = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
const key = (x, y, z) => `${x},${y},${z}`;

export class Kinetics {
  constructor(scene, atlas) {
    this.scene = scene;
    this.atlas = atlas;
    this.nodes = new Map(); // key -> { x, y, z, id, part, axis, mat, speed, net }
    this.nets = []; // { speed info, load, power, limit, status }
    this.meshes = new Map(); // key -> { id, group, spin, material, angle }
    this.geoCache = new Map();
    this.timer = 0;
  }

  // Speed (x 1) a crusher at this position is being driven at, or 0.
  powerAt(x, y, z) { return this.nodes.get(key(x, y, z))?.speed ?? 0; }

  // A short description of what's driving a crusher (for its panel).
  statusAt(x, y, z) {
    const n = this.nodes.get(key(x, y, z));
    if (!n || n.net == null) return 'Not connected: turn a shaft or gear against any face';
    const net = this.nets[n.net];
    if (net.status) return net.status;
    return `Turning at ${fmt(n.speed)}x · load ${fmt(net.load)} of ${fmt(net.power)} power`;
  }

  // ---------- networks ----------

  solve(world) {
    world.machinesChanged = false;
    const nodes = new Map();
    for (const c of world.chunks.values()) {
      for (const li of c.machines) {
        const x = c.cx * CHUNK + (li & 15), z = c.cz * CHUNK + ((li >> 4) & 15), y = li >> 8;
        const id = c.data[li];
        const def = BLOCKS[id];
        if (def.kinetic) nodes.set(key(x, y, z), { x, y, z, id, ...def.kinetic, speed: 0, rel: null, net: null });
        else if (def.station === 'crusher') nodes.set(key(x, y, z), { x, y, z, id, part: 'crusher', speed: 0, net: null });
      }
    }
    const at = (x, y, z) => nodes.get(key(x, y, z));
    // the parts a part turns, with the speed ratio (sign: which way round)
    const links = (n) => {
      const out = [];
      const a = UNIT[n.axis];
      for (const s of [1, -1]) {
        const m = at(n.x + a[0] * s, n.y + a[1] * s, n.z + a[2] * s);
        if (m && m.part !== 'crusher' && m.axis === n.axis) out.push([m, 1, null]);
      }
      if (n.part === 'gear' || n.part === 'large') {
        const [u, v] = [UNIT[(n.axis + 1) % 3], UNIT[(n.axis + 2) % 3]];
        const off = (du, dv) => [u[0] * du + v[0] * dv, u[1] * du + v[1] * dv, u[2] * du + v[2] * dv];
        const side = (d) => at(n.x + d[0], n.y + d[1], n.z + d[2]);
        if (n.part === 'gear') {
          for (const [du, dv] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
            const d = off(du, dv), m = side(d);
            if (m?.part === 'gear' && m.axis === n.axis) out.push([m, -1, d]);
          }
        }
        for (const [du, dv] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
          const d = off(du, dv), m = side(d);
          if (!m || m.axis !== n.axis) continue;
          if (n.part === 'large' && m.part === 'gear') out.push([m, -2, d]);
          if (n.part === 'gear' && m.part === 'large') out.push([m, -0.5, d]);
        }
      }
      return out;
    };
    const nets = [];
    for (const start of nodes.values()) {
      if (start.part === 'crusher' || start.rel !== null) continue;
      const net = { parts: [], wheels: [], crushers: [], jammed: false, load: 0, power: 0, limit: Infinity, weakest: null, status: '' };
      start.rel = 1;
      start.phase = 0;
      net.root = start;
      const queue = [start];
      while (queue.length) {
        const n = queue.shift();
        n.net = nets.length;
        net.parts.push(n);
        for (const [m, r, d] of links(n)) {
          const want = n.rel * r;
          if (m.rel === null) {
            m.rel = want;
            // line the teeth up: when one of n's teeth points at m, one of m's gaps points back at n
            if (!d) m.phase = n.phase;
            else {
              const tn = localAngle(d, n.axis), t0 = (tn - n.phase) / n.rel;
              m.phase = tn + Math.PI + Math.PI / teeth(m) - m.rel * t0;
            }
            queue.push(m);
          } else if (Math.abs(m.rel - want) > 1e-6) net.jammed = true;
        }
      }
      nets.push(net);
    }
    // crushers join the network of the first part turning against them
    for (const n of nodes.values()) {
      if (n.part !== 'crusher') continue;
      for (let a = 0; a < 3 && n.net === null; a++) {
        for (const s of [1, -1]) {
          const m = at(n.x - UNIT[a][0] * s, n.y - UNIT[a][1] * s, n.z - UNIT[a][2] * s);
          if (m && m.part !== 'crusher' && m.axis === a) { n.net = m.net; n.drive = m; nets[m.net].crushers.push(n); break; }
        }
      }
    }
    for (const net of nets) {
      for (const n of net.parts) {
        if (n.part === 'wheel') {
          const a = n.axis;
          // water running through the wheel's own cell, or past its rim
          const turning = [[0, 0, 0], [0, 1, 0], [0, -1, 0], a === 0 ? [0, 0, 1] : [1, 0, 0], a === 0 ? [0, 0, -1] : [-1, 0, 0]]
            .some(([dx, dy, dz]) => isFlowing(world.waterAt(n.x + dx, n.y + dy, n.z + dz)));
          if (turning) net.wheels.push(n);
        } else {
          const cap = KINETIC_MATS[n.mat].cap;
          if (cap < net.limit) { net.limit = cap; net.weakest = KINETIC_MATS[n.mat].name.toLowerCase(); }
        }
      }
      net.power = net.wheels.length * WHEEL_POWER;
      let scale = 0;
      if (net.jammed) net.status = 'Stuck: the gears are locked against each other';
      else if (!net.wheels.length) {
        net.status = net.parts.some((n) => n.part === 'wheel') ? 'No power: a water wheel needs flowing water beside it' : 'No power: connect a water wheel';
      } else {
        const base = Math.abs(net.wheels[0].rel);
        if (net.wheels.some((w) => Math.abs(Math.abs(w.rel) - base) > 1e-6)) net.status = 'Stuck: water wheels are geared to different speeds';
        else scale = 1 / base;
      }
      for (const c of net.crushers) net.load += CRUSHER_LOAD * Math.abs(c.drive.rel * scale);
      if (scale && net.load > net.power + 1e-6) {
        net.status = `Overloaded: needs ${fmt(net.load)} power, ${net.wheels.length > 1 ? `${net.wheels.length} wheels give` : 'the wheel gives'} ${fmt(net.power)}`;
        scale = 0;
      } else if (scale && net.load > net.limit + 1e-6) {
        net.status = `Overloaded: ${net.weakest} parts can only carry ${fmt(net.limit)} (load ${fmt(net.load)})`;
        scale = 0;
      }
      for (const n of net.parts) n.speed = n.rel * scale;
      for (const c of net.crushers) c.speed = Math.abs(c.drive.rel * scale);
      // every part's turn is rel x the network's turn + its phase; carry on from where the first part was
      const rootMesh = this.meshes.get(key(net.root.x, net.root.y, net.root.z));
      const theta = rootMesh && rootMesh.id === net.root.id ? rootMesh.angle - net.root.phase : 0;
      for (const n of net.parts) {
        n.angle = n.rel * theta + n.phase;
        const m = this.meshes.get(key(n.x, n.y, n.z));
        if (m && m.id === n.id) m.angle = n.angle;
      }
    }
    this.nodes = nodes;
    this.nets = nets;
  }

  // ---------- drawing ----------

  update(dt, world, light) {
    this.timer -= dt;
    if (this.timer <= 0 || world.machinesChanged) { this.timer = SOLVE_EVERY; this.solve(world); }
    // keep a turning model for every part in the loaded world
    for (const [k, m] of this.meshes) {
      const n = this.nodes.get(k);
      if (!n || n.id !== m.id) { this.removeMesh(k, m); }
    }
    for (const [k, n] of this.nodes) {
      if (n.part === 'crusher') continue;
      let m = this.meshes.get(k);
      if (!m) m = this.addMesh(k, n);
      m.angle += n.speed * TURN_RATE * dt;
      m.spin.rotation.x = m.angle;
      const sun = light.day * skyBrightness(world.skyAt(n.x, n.y, n.z));
      const t = lightBrightness(world.lightAt(n.x, n.y, n.z)) * light.flicker;
      m.material.color.setRGB(Math.max(sun, t, light.ambient), Math.max(sun, t * 0.86, light.ambient), Math.max(sun, t * 0.66, light.ambient));
    }
  }

  addMesh(k, n) {
    const material = new THREE.MeshBasicMaterial({ map: this.atlas, vertexColors: true });
    const group = new THREE.Group();
    group.position.set(n.x + 0.5, n.y + 0.5, n.z + 0.5);
    if (n.axis === 1) group.rotation.z = Math.PI / 2;
    else if (n.axis === 2) group.rotation.y = -Math.PI / 2;
    const spin = new THREE.Mesh(this.geometry(n.part, n.part === 'wheel' ? -1 : n.mat), material);
    const m = { id: n.id, group, spin, material, angle: n.angle ?? 0 };
    group.add(spin);
    this.scene.add(group);
    this.meshes.set(k, m);
    return m;
  }

  removeMesh(k, m) {
    this.scene.remove(m.group);
    m.material.dispose();
    this.meshes.delete(k);
  }

  clear() {
    for (const [k, m] of this.meshes) this.removeMesh(k, m);
    this.nodes.clear();
    this.nets = [];
  }

  // Models spin about their local x axis. Built from textured boxes merged into one geometry.
  geometry(part, mat) {
    const ck = `${part}:${mat}`;
    if (this.geoCache.has(ck)) return this.geoCache.get(ck);
    const tile = mat < 0 ? T.PLANKS : KINETIC_MATS[mat].tile;
    const boxes = []; // [sx, sy, sz, cy, cz, angle about x, tile]
    const ring = (count, r, size, tl = tile, phase = 0, cx = 0) => {
      for (let i = 0; i < count; i++) {
        const a = phase + (i / count) * Math.PI * 2;
        boxes.push([...size, Math.cos(a) * r, Math.sin(a) * r, a, tl, cx]);
      }
    };
    if (part === 'wheel') {
      // bigger than its block (almost two across), so the paddles stand up out of the water around it
      boxes.push([0.98, 0.24, 0.24, 0, 0, 0, T.LOG_SIDE]); // axle
      for (let i = 0; i < 6; i++) boxes.push([0.06 + i * 0.004, 1.8, 0.08, 0, 0, (i * Math.PI) / 6, T.LOG_SIDE]); // spokes
      ring(12, 0.7, [0.84, 0.5, 0.06], tile, Math.PI / 12); // paddles, reaching out to 0.95
      for (const cx of [-0.42, 0.42]) {
        for (let i = 0; i < 12; i++) { // a rim at each side
          const a = (i + 0.5) * (Math.PI * 2) / 12;
          boxes.push([i % 2 ? 0.06 : 0.065, 0.08, 0.5, Math.cos(a) * 0.9, Math.sin(a) * 0.9, a, T.LOG_SIDE, cx]);
        }
      }
    } else if (part === 'shaft') {
      boxes.push([1, 0.22, 0.22, 0, 0, 0, tile]);
    } else if (part === 'gear' || part === 'large') {
      // hub, spokes, a rim, and teeth around it. Pitch radii add up to the distance between meshing
      // gears (1 block side by side; a diagonal for large + small) and the teeth are the same size on both.
      const big = part === 'large', n = teeth({ part });
      const rim = big ? 0.775 : 0.32, rimW = big ? 0.15 : 0.12, pitch = big ? 0.943 : 0.471;
      boxes.push([1, 0.2, 0.2, 0, 0, 0, tile]); // axle
      boxes.push([0.3, big ? 0.34 : 0.28, big ? 0.34 : 0.28, 0, 0, 0, T.LOG_SIDE]); // hub (thicker, so it covers where spokes cross)
      for (let i = 0; i < (big ? 4 : 2); i++) boxes.push([0.16 + i * 0.01, rim * 2, 0.09, 0, 0, (i * Math.PI) / (big ? 4 : 2), tile]);
      for (let i = 0; i < n; i++) {
        const ang = (i + 0.5) * (Math.PI * 2) / n; // rim segments sit between the teeth
        const len = 2 * (rim + rimW / 2) * Math.tan(Math.PI / n) + 0.02;
        boxes.push([i % 2 ? 0.2 : 0.21, rimW, len, Math.cos(ang) * rim, Math.sin(ang) * rim, ang, tile]);
      }
      ring(n, pitch, [0.18, 0.2, big ? 0.17 : 0.16]);
    }
    const geo = mergeBoxes(boxes);
    this.geoCache.set(ck, geo);
    return geo;
  }
}

const fmt = (v) => (Math.round(v * 100) / 100).toString();
const teeth = (n) => (n.part === 'large' ? 16 : 8);
// The angle, in a part's own spinning frame, of the direction d (across its axle): see addMesh's rotations.
function localAngle(d, axis) {
  if (axis === 0) return Math.atan2(d[2], d[1]);
  if (axis === 1) return Math.atan2(d[2], -d[0]);
  return Math.atan2(-d[0], d[1]);
}

// face brightness (+x, -x, +y, -y, +z, -z), matching the world's block shading
const SHADE = [0.8, 0.8, 1.0, 0.5, 0.65, 0.65].map((v) => Math.pow(v, 2.2));

function mergeBoxes(boxes) {
  const pos = [], uv = [], col = [], index = [];
  const tileUV = 1 / ATLAS_COLS, eps = 0.5 / (TILE * ATLAS_COLS);
  const m = new THREE.Matrix4(), r = new THREE.Matrix4(), v = new THREE.Vector3();
  for (const [sx, sy, sz, cy, cz, angle, tile, cx = 0] of boxes) {
    const g = new THREE.BoxGeometry(sx, sy, sz);
    r.makeRotationX(angle);
    m.makeTranslation(cx, cy, cz).multiply(r);
    const p = g.attributes.position, t = g.attributes.uv;
    const base = pos.length / 3;
    const tu = (tile % ATLAS_COLS) * tileUV, tv = 1 - Math.floor(tile / ATLAS_COLS) * tileUV - tileUV;
    // use just the part of the tile in proportion to the face, so small boxes aren't squashed
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i).applyMatrix4(m);
      pos.push(v.x, v.y, v.z);
      uv.push(tu + eps + t.getX(i) * (tileUV - 2 * eps), tv + eps + t.getY(i) * (tileUV - 2 * eps));
      const s = SHADE[Math.floor(i / 4)];
      col.push(s, s, s);
    }
    for (let i = 0; i < g.index.count; i++) index.push(base + g.index.getX(i));
    g.dispose();
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  geo.setIndex(index);
  return geo;
}
