// Minecarts: they roll along rails, round curves and up and down slopes, slowing gently as they go.
// Slopes speed them up going down and slow them going up (they roll back if they don't make it).
// A powered rail turned by a shaft pushes a cart along at speed; one that isn't turning brakes it.
// You can ride in a cart: hold forward to push it along, back to brake. A cart stops at a rail station, and
// waits there until the station gets a signal (or you push off).
import * as THREE from 'three';
import { BLOCKS, FACING_DIRS } from './blocks.js';
import { skyBrightness, lightBrightness } from './world.js';

const OPP = (d) => (d + 2) % 4;
const MAX_SPEED = 10; // blocks a second
const PUSH_SPEED = 4.5; // as fast as pushing it yourself gets it going
const SLOPE_PULL = 7;
const FRICTION = 0.35;
const RAIL_TOP = 0.1; // the cart's floor sits this far above the rail's block
const HOLD = 1.5; // seconds a storage cart waits on a loader rail after the last thing moves in or out
export const CART_SLOTS = 18;
const newStore = () => ({ kind: 'chest', inputs: new Array(CART_SLOTS).fill(null), fuel: null, out: null });

// The rail shape in a cell, or null.
const railAt = (world, x, y, z) => BLOCKS[world.get(x, y, z)]?.rail ?? null;

// A point on a rail, in its cell: one of its ends (d) or its middle (d = -1).
function railPoint(r, d) {
  if (d < 0) return [0.5, r.slope >= 0 ? 0.5 : 0, 0.5];
  const [dx, dz] = FACING_DIRS[d];
  return [0.5 + dx * 0.5, r.slope === d ? 1 : 0, 0.5 + dz * 0.5];
}

// The rail joined to the rail at (x, y, z) through its end d: [x, y, z] or null. Rails join flat, or
// up or down a block through a slope.
export function railBeyond(world, x, y, z, d) {
  const r = railAt(world, x, y, z);
  if (!r || !(r.all ?? r.ends).includes(d)) return null;
  const [dx, dz] = FACING_DIRS[d];
  const up = r.slope === d ? 1 : 0;
  const nx = x + dx, nz = z + dz;
  const flat = railAt(world, nx, y + up, nz);
  if (flat && (flat.all ?? flat.ends).includes(OPP(d))) return [nx, y + up, nz]; // (a switch rail joins all three ways)
  const below = railAt(world, nx, y + up - 1, nz);
  if (below && below.slope === OPP(d)) return [nx, y + up - 1, nz];
  return null;
}

function shadedBox([w, h, d], color, [x, y, z]) {
  const g = new THREE.BoxGeometry(w, h, d);
  g.translate(x, y, z);
  const c = new THREE.Color(color);
  const shade = [0.8, 0.8, 1.0, 0.5, 0.65, 0.65].map((v) => Math.pow(v, 2.2));
  const col = new Float32Array(72);
  for (let i = 0; i < 24; i++) { const s = shade[i >> 2]; col[i * 3] = c.r * s; col[i * 3 + 1] = c.g * s; col[i * 3 + 2] = c.b * s; }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return g;
}

export class Carts {
  constructor(scene) {
    this.scene = scene;
    this.carts = [];
    // one shared model: an open iron box on four wheels, pointing along +z
    this.parts = [
      shadedBox([0.86, 0.08, 0.96], 0x5c6068, [0, 0.12, 0]), // floor
      shadedBox([0.86, 0.42, 0.06], 0x80848e, [0, 0.35, 0.45]), shadedBox([0.86, 0.42, 0.06], 0x80848e, [0, 0.35, -0.45]),
      shadedBox([0.06, 0.42, 0.84], 0x8a8e98, [0.4, 0.35, 0]), shadedBox([0.06, 0.42, 0.84], 0x8a8e98, [-0.4, 0.35, 0]),
      ...[[0.33, 0.3], [-0.33, 0.3], [0.33, -0.3], [-0.33, -0.3]].map(([x, z]) => shadedBox([0.1, 0.18, 0.18], 0x2a2a2e, [x, 0.08, z])),
    ];
    // a storage cart carries a chest
    this.chestParts = [
      shadedBox([0.7, 0.42, 0.8], 0x7a5230, [0, 0.38, 0]), shadedBox([0.72, 0.1, 0.82], 0x5c3c22, [0, 0.62, 0]),
      shadedBox([0.12, 0.14, 0.04], 0x9a9ea8, [0, 0.5, 0.42]),
    ];
  }

  // Set a cart on the rail at (x, y, z), facing the end most in line with `look`.
  add(world, x, y, z, look, storage = false) {
    const r = railAt(world, x, y, z);
    if (!r) return null;
    const along = (d) => FACING_DIRS[d][0] * look.x + FACING_DIRS[d][1] * look.z;
    const [a, b] = r.ends;
    const to = along(a) >= along(b) ? a : b;
    return this.spawn({ x, y, z, from: to === a ? b : a, to, s: 0.5, speed: 0, store: storage ? newStore() : null });
  }

  spawn(c) {
    const material = new THREE.MeshBasicMaterial({ vertexColors: true });
    const group = new THREE.Group();
    for (const g of this.parts) group.add(new THREE.Mesh(g, material));
    if (c.store) for (const g of this.chestParts) group.add(new THREE.Mesh(g, material));
    const cart = { ...c, group, material, pos: new THREE.Vector3(), yaw: 0, pitch: 0 };
    this.scene.add(group);
    this.carts.push(cart);
    this.place(cart, railAt(this.world ?? { get: () => 0 }, c.x, c.y, c.z));
    return cart;
  }

  remove(cart) {
    this.scene.remove(cart.group);
    cart.material.dispose();
    this.carts.splice(this.carts.indexOf(cart), 1);
  }

  clear() { for (const c of [...this.carts]) this.remove(c); }

  // Where the cart is, and which way it points, from its place along its rail.
  place(c, r) {
    if (!r) { c.pos.set(c.x + 0.5, c.y, c.z + 0.5); c.group.position.copy(c.pos); return; }
    const a = railPoint(r, c.from), m = railPoint(r, -1), b = railPoint(r, c.to);
    const [p, q, t] = c.s < 0.5 ? [a, m, c.s * 2] : [m, b, (c.s - 0.5) * 2];
    c.pos.set(c.x + p[0] + (q[0] - p[0]) * t, c.y + p[1] + (q[1] - p[1]) * t + RAIL_TOP, c.z + p[2] + (q[2] - p[2]) * t);
    const dx = q[0] - p[0], dy = q[1] - p[1], dz = q[2] - p[2];
    if (dx || dz) c.yaw = Math.atan2(dx, dz);
    c.pitch = -Math.atan2(dy, Math.hypot(dx, dz));
    c.group.position.copy(c.pos);
    c.group.rotation.set(0, 0, 0);
    c.group.rotateY(c.yaw);
    c.group.rotateX(c.pitch);
  }

  // Roll every cart along. rider: { cart, push (-1..1), look } for the cart you're in; poweredAt(x, y, z) is
  // how fast a powered rail is being turned.
  update(dt, world, poweredAt, rider, light) {
    this.world = world;
    for (const c of this.carts) {
      if (!world.chunkAt(c.x, c.z)) continue;
      let r = railAt(world, c.x, c.y, c.z);
      if (r?.junction && c.from === r.junction.stem) c.to = r.ends[1]; // a switch rail was switched under it
      else if (r?.junction && !r.all.includes(c.to)) c.to = r.ends[0];
      else if (r && !r.junction && !r.ends.includes(c.to)) { c.from = r.ends[0]; c.to = r.ends[1]; } // its rail was reshaped
      if (!r) { c.speed = 0; this.light(c, world, light); continue; } // off the rails: it just sits there
      // pushing and braking from inside
      if (rider?.cart === c) {
        if (rider.push > 0.3) {
          if (c.speed < 0.3) {
            // set off whichever way you're looking along the track
            const along = (d) => FACING_DIRS[d][0] * rider.look.x + FACING_DIRS[d][1] * rider.look.z;
            if (along(c.from) > along(c.to)) this.turnAround(c);
          }
          if (c.speed < PUSH_SPEED) c.speed = Math.min(PUSH_SPEED, c.speed + 3 * dt);
        } else if (rider.push < -0.3) c.speed = Math.max(0, c.speed - 6 * dt);
      }
      if (r.slope >= 0) c.speed += (c.to === r.slope ? -SLOPE_PULL : SLOPE_PULL) * dt;
      if (r.powered) {
        if (poweredAt(c.x, c.y, c.z) > 0) c.speed = Math.min(MAX_SPEED, Math.max(c.speed, 1) + 14 * dt);
        else c.speed *= Math.exp(-5 * dt);
      }
      c.speed = Math.min(MAX_SPEED, c.speed - (FRICTION + c.speed * 0.02) * dt * Math.sign(c.speed));
      if (c.speed < 0) {
        if (r.slope >= 0) { this.turnAround(c); c.speed = -c.speed; } else c.speed = 0; // rolls back down
      }
      // a cart waits at a rail station until the station gets a signal, or you push off
      if (c.waiting) {
        if (!r.stop) c.waiting = false;
        else if (poweredAt(c.x, c.y, c.z) > 0 || (rider?.cart === c && rider.push > 0.3)) {
          c.waiting = false; c.released = true;
          if (!railBeyond(world, c.x, c.y, c.z, c.to)) this.turnAround(c); // (the end of the line: back the way it came)
          c.speed = Math.max(c.speed, PUSH_SPEED);
        } else c.speed = 0;
      }
      // a storage cart waits on a loader rail while it's filled or emptied, then rolls on
      if (c.holding) {
        c.speed = 0;
        if ((c.hold -= dt) <= 0) { c.holding = false; c.released = true; c.speed = 4; }
      }
      let dist = c.speed * dt;
      while (dist > 1e-6) {
        let step = Math.min(dist, 1 - c.s);
        if (r.loader && c.store && !c.released && c.s < 0.5 && c.s + step >= 0.5) {
          c.s = 0.5; c.speed = 0; c.holding = true; c.hold = HOLD;
          break;
        }
        if (r.stop && !c.released && c.s < 0.5 && c.s + step >= 0.5) {
          c.s = 0.5; c.speed = 0; c.waiting = true;
          break;
        }
        c.s += step; dist -= step;
        if (c.s < 1 - 1e-9) break;
        const next = railBeyond(world, c.x, c.y, c.z, c.to);
        if (!next || !world.chunkAt(next[0], next[2])) { c.s = 1; c.speed = 0; break; } // the end of the line
        const entry = OPP(c.to);
        [c.x, c.y, c.z] = next;
        r = railAt(world, c.x, c.y, c.z);
        c.from = entry;
        c.to = r.ends[0] === entry ? r.ends[1] : r.ends[0];
        c.s = 0;
        c.released = false;
      }
      this.place(c, r);
      this.light(c, world, light);
    }
  }

  // The storage cart standing on a rail cell, if any.
  storageAt(x, y, z) { return this.carts.find((c) => c.store && c.x === x && c.y === y && c.z === z) ?? null; }

  // Hoppers filling or emptying a storage cart on a loader rail keep it waiting there a moment longer.
  busy(c) { if (c.holding) c.hold = HOLD; }

  turnAround(c) { [c.from, c.to] = [c.to, c.from]; c.s = 1 - c.s; }

  light(c, world, light) {
    const x = Math.floor(c.pos.x), y = Math.floor(c.pos.y + 0.3), z = Math.floor(c.pos.z);
    const sun = light.day * skyBrightness(world.skyAt(x, y, z));
    const t = lightBrightness(world.lightAt(x, y, z)) * light.flicker;
    c.material.color.setRGB(Math.max(sun, t, light.ambient), Math.max(sun, t * 0.86, light.ambient), Math.max(sun, t * 0.66, light.ambient));
  }

  // The nearest cart hit by a ray: { cart, t } or null.
  raycast(o, d, maxDist) {
    let best = null;
    for (const c of this.carts) {
      const min = [c.pos.x - 0.45, c.pos.y, c.pos.z - 0.45], max = [c.pos.x + 0.45, c.pos.y + 0.6, c.pos.z + 0.45];
      const oo = [o.x, o.y, o.z], dd = [d.x, d.y, d.z];
      let t0 = 0, t1 = maxDist, hit = true;
      for (let a = 0; a < 3 && hit; a++) {
        if (Math.abs(dd[a]) < 1e-9) { if (oo[a] < min[a] || oo[a] > max[a]) hit = false; continue; }
        let ta = (min[a] - oo[a]) / dd[a], tb = (max[a] - oo[a]) / dd[a];
        if (ta > tb) [ta, tb] = [tb, ta];
        t0 = Math.max(t0, ta); t1 = Math.min(t1, tb);
        if (t0 > t1) hit = false;
      }
      if (hit && (!best || t0 < best.t)) best = { cart: c, t: t0 };
    }
    return best;
  }

  serialize() {
    return this.carts.map((c) => {
      const a = [c.x, c.y, c.z, c.from, c.to, +c.s.toFixed(3)];
      if (c.store) a.push(c.store.inputs.map((it) => (it ? [it.id, it.count] : 0)));
      return a;
    });
  }

  load(list) {
    this.clear();
    for (const a of list ?? []) {
      if (!Array.isArray(a) || !a.slice(0, 5).every(Number.isFinite)) continue;
      const [x, y, z, from, to, s, items] = a;
      let store = null;
      if (Array.isArray(items)) {
        store = newStore();
        items.slice(0, CART_SLOTS).forEach((it, i) => { if (Array.isArray(it) && it[0] > 0 && it[1] > 0) store.inputs[i] = { id: it[0], count: it[1] }; });
      }
      this.spawn({ x, y, z, from, to, s: Math.min(1, Math.max(0, +s || 0)), speed: 0, store });
    }
  }
}
