// Boats and hot-air balloons: things you put down, get into (tap) and steer about, like a minecart off the rails.
//
// A boat floats on water: hold forward to row the way you're looking, back to slow down or back off. It
// won't go onto land. A balloon floats in the air: jump to rise, sneak to sink, and move as you'd walk. Its
// burner uses a piece of coal (or charcoal) from your inventory every BURN seconds while you're up; with
// none, it slowly sinks back down. Hold on either to pick it up.
import * as THREE from 'three';
import { skyBrightness, lightBrightness } from './world.js';

const BOAT_SPEED = 7, BOAT_BACK = 2.5;
const BALLOON_SPEED = 4, BALLOON_RISE = 3.5, BALLOON_SINK = 1.5;
export const BURN = 45; // seconds of flight from a piece of coal
const GRAVITY = 20;
export const BOAT_SLOTS = 18;
export const newBoatStore = () => ({ kind: 'chest', inputs: new Array(BOAT_SLOTS).fill(null), fuel: null, out: null });

function box(group, material, [w, h, d], color, [x, y, z]) {
  const g = new THREE.BoxGeometry(w, h, d);
  g.translate(x, y, z);
  const c = new THREE.Color(color);
  const shade = [0.8, 0.8, 1.0, 0.5, 0.65, 0.65].map((v) => Math.pow(v, 2.2));
  const col = new Float32Array(72);
  for (let i = 0; i < 24; i++) { const s = shade[i >> 2]; col[i * 3] = c.r * s; col[i * 3 + 1] = c.g * s; col[i * 3 + 2] = c.b * s; }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  group.add(new THREE.Mesh(g, material));
}

// Models, pointing along +z, with the floor at y = 0.
const MODELS = {
  boat(g, m, chest = false) {
    box(g, m, [1.1, 0.12, 1.9], 0x8a5a32, [0, 0.06, 0]); // the bottom
    box(g, m, [0.12, 0.42, 1.9], 0xa06a3c, [0.55, 0.27, 0]); box(g, m, [0.12, 0.42, 1.9], 0xa06a3c, [-0.55, 0.27, 0]); // the sides
    box(g, m, [1.1, 0.42, 0.12], 0xa06a3c, [0, 0.27, -0.95]); box(g, m, [0.7, 0.36, 0.12], 0xa06a3c, [0, 0.3, 1.0]); // stern and bow
    box(g, m, [1.0, 0.08, 0.3], 0x7a4e2a, [0, 0.3, -0.2]); // a seat
    box(g, m, [0.06, 0.06, 1.3], 0x6a4426, [0.75, 0.42, 0.1]); box(g, m, [0.06, 0.06, 1.3], 0x6a4426, [-0.75, 0.42, 0.1]); // oars
    if (chest) { box(g, m, [0.7, 0.5, 0.5], 0x9a6a34, [0, 0.37, -0.6]); box(g, m, [0.72, 0.08, 0.52], 0x6e4622, [0, 0.6, -0.6]); box(g, m, [0.1, 0.12, 0.04], 0xc8c8d0, [0, 0.5, -0.33]); } // (v28: a chest in the stern)
  },
  balloon(g, m) {
    box(g, m, [1.1, 0.7, 1.1], 0x9a6a3a, [0, 0.35, 0]); // the basket
    box(g, m, [1.16, 0.08, 1.16], 0x6a4426, [0, 0.72, 0]);
    for (const [x, z] of [[0.5, 0.5], [-0.5, 0.5], [0.5, -0.5], [-0.5, -0.5]]) box(g, m, [0.025, 2.0, 0.025], 0xd8cfb0, [x, 1.7, z]); // ropes
    box(g, m, [0.3, 0.3, 0.3], 0x40444c, [0, 2.75, 0]); // the burner
    const stripes = [0xd23c32, 0xf0c838, 0xd23c32, 0x3c78d2];
    // the envelope: stacked slices, widest in the middle
    [[1.6, 3.0], [2.4, 3.5], [2.9, 4.0], [3.1, 4.5], [3.0, 5.0], [2.6, 5.5], [1.8, 5.95]].forEach(([w, y], i) => box(g, m, [w, 0.5, w], stripes[i % 4], [0, y, 0]));
  },
};

export class Vehicles {
  constructor(scene) {
    this.scene = scene;
    this.list = []; // { kind, pos, yaw, speed, vy, burn, group, material }
  }

  // store: a chest boat's contents ({ kind: 'chest', inputs }), or null
  add(kind, x, y, z, yaw = 0, burn = 0, store = null) {
    const material = new THREE.MeshBasicMaterial({ vertexColors: true });
    const group = new THREE.Group();
    MODELS[kind](group, material, !!store);
    const v = { kind, pos: new THREE.Vector3(x, y, z), yaw, speed: 0, vy: 0, burn, group, material, store };
    group.position.copy(v.pos);
    group.rotation.y = yaw;
    this.scene.add(group);
    this.list.push(v);
    return v;
  }

  remove(v) {
    this.scene.remove(v.group);
    v.group.traverse((o) => o.geometry?.dispose());
    v.material.dispose();
    const i = this.list.indexOf(v);
    if (i >= 0) this.list.splice(i, 1);
  }

  clear() { for (const v of [...this.list]) this.remove(v); }

  // The water surface under or around a boat: the y of the top of the highest water cell in its column near
  // its floor, or null.
  waterTop(world, x, y, z) {
    const bx = Math.floor(x), bz = Math.floor(z);
    for (let cy = Math.floor(y) + 1; cy >= Math.floor(y) - 2; cy--) if (world.isWater(bx, cy, bz)) return cy + 0.85;
    return null;
  }

  // Would a box (half-width hw, height h, floor at y) at (x, z) overlap a solid block?
  blocked(world, x, y, z, hw, h) {
    for (let cy = Math.floor(y + 0.05); cy <= Math.floor(y + h); cy++)
      for (let cz = Math.floor(z - hw); cz <= Math.floor(z + hw); cz++)
        for (let cx = Math.floor(x - hw); cx <= Math.floor(x + hw); cx++) if (world.isSolid(cx, cy, cz)) return true;
    return false;
  }

  // rider: { v, moveX, moveZ, jump, down, yaw } for the one you're in. hooks.fuel() takes a piece of coal from
  // your inventory (true if there was one).
  update(dt, world, rider, light, hooks = {}) {
    for (const v of this.list) {
      if (!world.chunkAt(Math.floor(v.pos.x), Math.floor(v.pos.z))) continue;
      const r = rider?.v === v ? rider : null;
      if (v.kind === 'boat') this.boat(v, dt, world, r);
      else this.balloon(v, dt, world, r, hooks);
      v.group.position.copy(v.pos);
      v.group.rotation.y = v.yaw;
      this.light(v, world, light);
    }
  }

  boat(v, dt, world, r) {
    const top = this.waterTop(world, v.pos.x, v.pos.y, v.pos.z);
    if (top !== null) { v.pos.y += (top - 0.12 - v.pos.y) * Math.min(1, dt * 6); v.vy = 0; } // bob at the surface
    else if (!this.blocked(world, v.pos.x, v.pos.y - 0.1, v.pos.z, 0.4, 0.05)) { v.vy -= GRAVITY * dt; v.pos.y += v.vy * dt; } // falling
    else { v.vy = 0; v.speed *= Math.exp(-6 * dt); } // aground
    if (r) {
      const want = r.yaw + Math.PI; // (a boat's yaw points along +z; yours looks along -z)
      v.yaw += Math.atan2(Math.sin(want - v.yaw), Math.cos(want - v.yaw)) * Math.min(1, dt * 3); // turns the way you look
      if (r.moveZ > 0.3) v.speed = Math.min(BOAT_SPEED, v.speed + 5 * dt);
      else if (r.moveZ < -0.3) v.speed = Math.max(-BOAT_BACK, v.speed - 6 * dt);
    }
    v.speed *= Math.exp(-0.7 * dt);
    if (Math.abs(v.speed) < 0.01) return;
    const dx = Math.sin(v.yaw), dz = Math.cos(v.yaw);
    const nx = v.pos.x + dx * v.speed * dt, nz = v.pos.z + dz * v.speed * dt;
    const ahead = 0.8 * Math.sign(v.speed);
    // it only goes where there's water, and nothing solid in the way
    if (top === null || this.waterTop(world, nx + dx * ahead, v.pos.y, nz + dz * ahead) === null || this.blocked(world, nx, v.pos.y + 0.2, nz, 0.45, 0.6)) { v.speed = 0; return; }
    v.pos.x = nx; v.pos.z = nz;
  }

  balloon(v, dt, world, r, hooks) {
    const grounded = this.blocked(world, v.pos.x, v.pos.y - 0.08, v.pos.z, 0.5, 0.05);
    if (r && !grounded) {
      if ((v.burn -= dt) <= 0) v.burn = hooks.fuel?.() ? BURN : 0;
    }
    let want = -BALLOON_SINK;
    if (r) {
      if (r.jump) { if (v.burn <= 0 && hooks.fuel?.()) v.burn = BURN; want = v.burn > 0 ? BALLOON_RISE : -BALLOON_SINK * 0.5; }
      else if (r.down) want = -BALLOON_RISE;
      else want = v.burn > 0 ? 0 : -BALLOON_SINK;
    }
    v.vy += (want - v.vy) * Math.min(1, dt * 2);
    const ny = v.pos.y + v.vy * dt;
    if (v.vy < 0 && this.blocked(world, v.pos.x, ny, v.pos.z, 0.5, 0.05)) { v.pos.y = Math.floor(ny) + 1; v.vy = 0; }
    else if (v.vy > 0 && this.blocked(world, v.pos.x, ny + 2.9, v.pos.z, 0.4, 0.05)) v.vy = 0; // your head (and the burner) against a ceiling
    else v.pos.y = ny;
    if (!r || grounded && !(v.vy > 0)) return;
    // moving about, as you would on foot
    const fx = -Math.sin(r.yaw), fz = -Math.cos(r.yaw), rx = Math.cos(r.yaw), rz = -Math.sin(r.yaw);
    let wx = fx * r.moveZ + rx * r.moveX, wz = fz * r.moveZ + rz * r.moveX;
    const len = Math.hypot(wx, wz);
    if (len > 1) { wx /= len; wz /= len; }
    for (const [axis, d] of [['x', wx * BALLOON_SPEED * dt], ['z', wz * BALLOON_SPEED * dt]]) {
      if (!d) continue;
      const nx = axis === 'x' ? v.pos.x + d : v.pos.x, nz = axis === 'z' ? v.pos.z + d : v.pos.z;
      if (!this.blocked(world, nx, v.pos.y + 0.05, nz, 0.55, 2.6)) v.pos[axis] += d;
    }
    v.yaw = r.yaw + Math.PI;
  }

  light(v, world, light) {
    const x = Math.floor(v.pos.x), y = Math.floor(v.pos.y + 0.5), z = Math.floor(v.pos.z);
    const sun = light.day * skyBrightness(world.skyAt(x, y, z));
    const t = lightBrightness(world.lightAt(x, y, z)) * light.flicker;
    v.material.color.setRGB(Math.max(sun, t, light.ambient), Math.max(sun, t * 0.86, light.ambient), Math.max(sun, t * 0.66, light.ambient));
  }

  // The nearest boat or balloon (basket) hit by a ray: { v, t } or null.
  raycast(o, d, maxDist) {
    let best = null;
    for (const v of this.list) {
      const hw = v.kind === 'boat' ? 0.7 : 0.6, h = v.kind === 'boat' ? 0.55 : 0.8;
      const min = [v.pos.x - hw, v.pos.y, v.pos.z - hw], max = [v.pos.x + hw, v.pos.y + h, v.pos.z + hw];
      const oo = [o.x, o.y, o.z], dd = [d.x, d.y, d.z];
      let t0 = 0, t1 = maxDist, hit = true;
      for (let a = 0; a < 3 && hit; a++) {
        if (Math.abs(dd[a]) < 1e-9) { if (oo[a] < min[a] || oo[a] > max[a]) hit = false; continue; }
        let ta = (min[a] - oo[a]) / dd[a], tb = (max[a] - oo[a]) / dd[a];
        if (ta > tb) [ta, tb] = [tb, ta];
        t0 = Math.max(t0, ta); t1 = Math.min(t1, tb);
        if (t0 > t1) hit = false;
      }
      if (hit && (!best || t0 < best.t)) best = { v, t: t0 };
    }
    return best;
  }

  serialize() {
    return this.list.map((v) => [v.kind, +v.pos.x.toFixed(2), +v.pos.y.toFixed(2), +v.pos.z.toFixed(2), +v.yaw.toFixed(2), Math.round(v.burn),
      ...(v.store ? [v.store.inputs.map((it) => (it ? [it.id, it.count] : 0))] : [])]);
  }

  load(list) {
    this.clear();
    for (const a of Array.isArray(list) ? list : []) {
      if (!Array.isArray(a) || !MODELS[a[0]] || !a.slice(1, 5).every(Number.isFinite)) continue;
      let store = null;
      if (Array.isArray(a[6])) {
        store = newBoatStore();
        a[6].slice(0, BOAT_SLOTS).forEach((it, i) => { if (Array.isArray(it) && it[0] > 0 && it[1] > 0) store.inputs[i] = { id: it[0], count: it[1] }; });
      }
      this.add(a[0], a[1], a[2], a[3], a[4], Math.max(0, +a[5] || 0), store);
    }
  }
}
