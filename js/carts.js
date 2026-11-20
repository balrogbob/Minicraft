// Minecarts: they roll along rails, round curves and up and down slopes, slowing gently as they go.
// Slopes speed them up going down and slow them going up (they roll back if they don't make it).
// A powered rail turned by a shaft pushes a cart along at speed; one that isn't turning brakes it.
// You can ride in a cart: hold forward to push it along, back to brake. A cart stops at a rail station, and
// waits there until the station gets a signal (or you push off).
import * as THREE from 'three';
import { BLOCKS, FACING_DIRS, COAL, CHARCOAL } from './blocks.js';
import { skyBrightness, lightBrightness } from './world.js';

const OPP = (d) => (d + 2) % 4;
const MAX_SPEED = 10; // blocks a second
const PUSH_SPEED = 4.5; // as fast as pushing it yourself gets it going
const SLOPE_PULL = 7;
const FRICTION = 0.35;
const RAIL_TOP = 0.1; // the cart's floor sits this far above the rail's block
const HOLD = 1.5; // seconds a storage cart waits on a loader rail after the last thing moves in or out
export const CART_SLOTS = 18;
// Locomotives: a steam engine on wheels that burns coal and pulls the carts coupled behind it.
const LOCO_SPEED = 6; // its top speed, blocks a second
const LOCO_PULL = 2.5; // how hard it pulls away
const LOCO_BURN = 60; // seconds of steam from one coal
const LOCO_WAIT = 4; // seconds it waits at a rail station before setting off again by itself
const GAP = 1.15; // how far apart coupled carts ride
const TRAIL_STEP = 0.1; // how often the locomotive leaves a mark for the carts behind to follow
const TRAIL_BACK = 10; // how far back along the track the trail reaches when a locomotive is put down
export const newLoco = () => ({ coal: 0, burn: 0, running: true });
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
    // a locomotive: a green boiler with a chimney up front and a red cab behind
    this.locoParts = [
      shadedBox([0.86, 0.1, 0.98], 0x3a3a40, [0, 0.12, 0]),
      shadedBox([0.56, 0.5, 0.62], 0x2f7a3e, [0, 0.42, 0.16]), shadedBox([0.6, 0.08, 0.66], 0xb8902e, [0, 0.42, 0.16]),
      shadedBox([0.16, 0.34, 0.16], 0x222226, [0, 0.82, 0.34]), shadedBox([0.22, 0.06, 0.22], 0x2a2a2e, [0, 1.0, 0.34]),
      shadedBox([0.76, 0.62, 0.34], 0xa8302a, [0, 0.48, -0.3]), shadedBox([0.82, 0.06, 0.4], 0x5a1a16, [0, 0.82, -0.3]),
      shadedBox([0.5, 0.1, 0.06], 0x9a9ea8, [0, 0.2, 0.5]),
      ...[[0.4, 0.3], [-0.4, 0.3], [0.4, -0.3], [-0.4, -0.3]].map(([x, z]) => shadedBox([0.06, 0.24, 0.24], 0x2a2a2e, [x, 0.1, z])),
    ];
    this.chestParts = [
      shadedBox([0.7, 0.42, 0.8], 0x7a5230, [0, 0.38, 0]), shadedBox([0.72, 0.1, 0.82], 0x5c3c22, [0, 0.62, 0]),
      shadedBox([0.12, 0.14, 0.04], 0x9a9ea8, [0, 0.5, 0.42]),
    ];
  }

  // Set a cart on the rail at (x, y, z), facing the end most in line with `look`.
  add(world, x, y, z, look, storage = false, loco = false) {
    const r = railAt(world, x, y, z);
    if (!r) return null;
    const along = (d) => FACING_DIRS[d][0] * look.x + FACING_DIRS[d][1] * look.z;
    const [a, b] = r.ends;
    const to = along(a) >= along(b) ? a : b;
    return this.spawn({ x, y, z, from: to === a ? b : a, to, s: 0.5, speed: 0, store: storage ? newStore() : null, loco: loco ? newLoco() : null });
  }

  spawn(c) {
    const material = new THREE.MeshBasicMaterial({ vertexColors: true });
    const group = new THREE.Group();
    for (const g of c.loco ? this.locoParts : this.parts) group.add(new THREE.Mesh(g, material));
    if (c.store) for (const g of this.chestParts) group.add(new THREE.Mesh(g, material));
    const cart = { ...c, group, material, pos: new THREE.Vector3(), yaw: 0, pitch: 0 };
    this.scene.add(group);
    this.carts.push(cart);
    this.place(cart, railAt(this.world ?? { get: () => 0 }, c.x, c.y, c.z));
    if (cart.loco) { cart.towed = []; cart.trail = null; cart.odo = 0; cart.wait = 0; cart.chuff = 0; }
    return cart;
  }

  remove(cart) {
    if (cart.tow) cart.tow.towed = cart.tow.towed.filter((t) => t !== cart);
    if (cart.towed) this.uncouple(cart);
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
      if (c.tow) continue; // a coupled cart just follows its locomotive (below)
      if (c.loco) this.steam(c, r, dt, rider);
      // pushing and braking from inside
      if (rider?.cart === c && !c.loco) {
        if (rider.push > 0.3) {
          if (c.speed < 0.3) {
            // set off whichever way you're looking along the track
            const along = (d) => FACING_DIRS[d][0] * rider.look.x + FACING_DIRS[d][1] * rider.look.z;
            if (along(c.from) > along(c.to)) this.turnAround(c);
          }
          if (c.speed < PUSH_SPEED) c.speed = Math.min(PUSH_SPEED, c.speed + 3 * dt);
        } else if (rider.push < -0.3) c.speed = Math.max(0, c.speed - 6 * dt);
      }
      if (r.slope >= 0 && !(c.loco && this.steaming(c))) c.speed += (c.to === r.slope ? -SLOPE_PULL : SLOPE_PULL) * dt;
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
        else if (poweredAt(c.x, c.y, c.z) > 0 || (rider?.cart === c && rider.push > 0.3)
          || (c.loco && this.steaming(c) && (c.wait += dt) >= LOCO_WAIT)) {
          c.waiting = false; c.released = true;
          if (!railBeyond(world, c.x, c.y, c.z, c.to)) this.turnAround(c); // (the end of the line: back the way it came)
          c.speed = Math.max(c.speed, c.loco ? 1 : PUSH_SPEED);
          if (c.loco) this.onLoco?.(c, 'hoot');
        } else c.speed = 0;
      }
      // a storage cart waits on a loader rail while it's filled or emptied, then rolls on
      if (c.holding) {
        c.speed = 0;
        if ((c.hold -= dt) <= 0) { c.holding = false; c.released = true; c.speed = 4; }
      }
      if (c.loco) this.buffer(c, world);
      let dist = c.speed * dt;
      while (dist > 1e-6) {
        let step = Math.min(dist, 1 - c.s, c.loco ? TRAIL_STEP : 1);
        if (r.loader && c.store && !c.released && c.s < 0.5 && c.s + step >= 0.5) {
          c.s = 0.5; c.speed = 0; c.holding = true; c.hold = HOLD;
          break;
        }
        if (r.stop && !c.released && c.s < 0.5 && c.s + step >= 0.5) {
          const ds = 0.5 - c.s;
          c.s = 0.5; c.speed = 0; c.waiting = true; c.wait = 0;
          if (c.loco) this.mark(c, ds);
          break;
        }
        const s0 = c.s;
        c.s += step; dist -= step;
        if (c.loco) this.mark(c, c.s - s0);
        if (c.s < 1 - 1e-9) { if (c.loco) continue; break; }
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
    // coupled carts ride along behind their locomotive
    for (const c of this.carts) if (c.loco) this.haul(c, world, light);
  }

  // ---- locomotives ----
  steaming(c) { return c.loco.running && (c.loco.burn > 0 || c.loco.coal > 0); }

  // Fire and steam: a running locomotive burns its coal and pulls away up to its top speed (a little
  // slower for each cart behind). Riding it, hold back to stop it and forward to start it again.
  steam(c, r, dt, rider) {
    const l = c.loco;
    if (rider?.cart === c) {
      if (rider.push < -0.3) l.running = false;
      else if (rider.push > 0.3 && !l.running) {
        l.running = true;
        if (c.speed < 0.3) {
          const along = (d) => FACING_DIRS[d][0] * rider.look.x + FACING_DIRS[d][1] * rider.look.z;
          if (along(c.from) > along(c.to)) this.turnAround(c);
        }
      }
    }
    if (!l.running) { c.speed = Math.max(0, c.speed - 4 * dt); return; }
    if (c.waiting || c.holding) return;
    if (c.s >= 1 - 1e-6 && !railBeyond(this.world, c.x, c.y, c.z, c.to)) { c.speed = 0; return; } // the end of the line
    if (l.burn <= 0) {
      if (l.coal <= 0) this.fromTender(c);
      if (l.coal <= 0) return; // out of coal: it coasts to a stop
      l.coal--; l.burn += LOCO_BURN;
    }
    l.burn = Math.max(0, l.burn - dt);
    const top = Math.max(3.5, LOCO_SPEED - 0.25 * c.towed.length);
    if (c.speed < top) c.speed = Math.min(top, c.speed + LOCO_PULL * dt);
    if (c.speed > 0.5 && (c.chuff -= dt * c.speed) <= 0) { c.chuff = 2.4; this.onLoco?.(c, 'chuff'); }
  }

  // The tender: a storage cart coupled right behind the locomotive keeps it in coal (or charcoal), a few
  // pieces at a time, as it runs out.
  fromTender(c) {
    const t = c.towed[0];
    if (!t?.store) return false;
    const inputs = t.store.inputs;
    const i = inputs.findIndex((it) => it && (it.id === COAL || it.id === CHARCOAL));
    if (i < 0) return false;
    const n = Math.min(inputs[i].count, 4);
    inputs[i].count -= n;
    if (!inputs[i].count) inputs[i] = null;
    c.loco.coal += n;
    this.onLoco?.(c, 'tender');
    return true;
  }

  // A locomotive that runs up against a cart that isn't coupled shoves it along ahead.
  buffer(c, world) {
    for (const o of this.carts) {
      if (o === c || o.tow || o.loco) continue;
      if (Math.abs(o.pos.x - c.pos.x) + Math.abs(o.pos.z - c.pos.z) + Math.abs(o.pos.y - c.pos.y) > 1.6) continue;
      // is it ahead? (along the way the locomotive is heading)
      const ahead = (o.pos.x - c.pos.x) * Math.sin(c.yaw) + (o.pos.z - c.pos.z) * Math.cos(c.yaw);
      if (ahead <= 0.2 || ahead > 1.05) continue;
      if (o.speed < c.speed) {
        // send it the same way
        if (o.x === c.x && o.y === c.y && o.z === c.z) { if (o.to !== c.to) this.turnAround(o); }
        else if (o.from !== OPP(c.to) && railAt(world, o.x, o.y, o.z)?.ends.includes(OPP(c.to))) {
          if (o.to === OPP(c.to)) this.turnAround(o);
        }
        o.speed = c.speed + 0.3;
        o.waiting = false; o.holding = false; o.released = true;
      }
    }
  }

  // The trail: where the locomotive has been, so the carts behind can follow it round curves and slopes.
  // Each mark is { d, x, y, z, from, to, s }, d being how far along the locomotive had come.
  mark(c, moved) {
    if (!c.trail) this.seedTrail(c);
    c.odo += Math.max(0, moved);
    const last = c.trail[c.trail.length - 1];
    if (last && c.odo - last.d < TRAIL_STEP * 0.5 && last.x === c.x && last.y === c.y && last.z === c.z) return;
    c.trail.push({ d: c.odo, x: c.x, y: c.y, z: c.z, from: c.from, to: c.to, s: c.s });
    const keep = c.odo - Math.max(TRAIL_BACK, (c.towed.length + 2) * GAP + 2);
    let cut = 0;
    while (cut < c.trail.length - 2 && c.trail[cut + 1].d < keep) cut++;
    if (cut) c.trail.splice(0, cut);
  }

  // When a locomotive is put down (or loaded, or turns round) its trail runs back along the track behind it.
  seedTrail(c) {
    const world = this.world;
    c.trail = [];
    c.odo = 0;
    const w = { x: c.x, y: c.y, z: c.z, from: c.to, to: c.from, s: 1 - c.s };
    const back = [];
    let gone = 0;
    while (gone < TRAIL_BACK && world) {
      back.push({ d: -gone, x: w.x, y: w.y, z: w.z, from: w.to, to: w.from, s: 1 - w.s });
      const step = Math.min(TRAIL_STEP, 1 - w.s);
      w.s += step; gone += step;
      if (w.s < 1 - 1e-9) continue;
      const next = railBeyond(world, w.x, w.y, w.z, w.to);
      if (!next) break;
      const entry = OPP(w.to);
      [w.x, w.y, w.z] = next;
      const r = railAt(world, w.x, w.y, w.z);
      w.from = entry;
      w.to = r.ends[0] === entry ? r.ends[1] : r.ends[0];
      w.s = 0;
    }
    c.trail = back.reverse();
  }

  // Where along the trail a point d lies: { x, y, z, from, to, s } or null.
  trailAt(c, d) {
    const t = c.trail;
    if (!t?.length || d < t[0].d - 1e-6) return null;
    let i = t.length - 1;
    while (i > 0 && t[i].d > d) i--;
    const a = t[i], b = t[i + 1];
    if (b && a.x === b.x && a.y === b.y && a.z === b.z && a.from === b.from && b.d > a.d) {
      return { ...a, s: a.s + (b.s - a.s) * Math.min(1, (d - a.d) / (b.d - a.d)) };
    }
    return { ...a };
  }

  // Couple on any cart standing on the track just behind the train, then set each coupled cart in its
  // place along the trail.
  haul(c, world, light) {
    if (!c.trail) this.seedTrail(c);
    c.towed = c.towed.filter((t) => this.carts.includes(t) && t.tow === c);
    for (;;) {
      const want = (c.towed.length + 1) * GAP;
      let best = null, bestBack = Infinity;
      for (const o of this.carts) {
        if (o === c || o.tow || o.loco || o.speed > 0.5 && !o.waiting) continue;
        for (let i = c.trail.length - 1; i >= 0; i--) {
          const m = c.trail[i];
          if (m.x !== o.x || m.y !== o.y || m.z !== o.z) continue;
          const back = c.odo - m.d;
          if (back > 0.4 && back <= want + 0.8 && back < bestBack) { best = o; bestBack = back; }
          break;
        }
      }
      if (!best) break;
      best.tow = c; best.speed = 0; best.waiting = false; best.holding = false;
      c.towed.push(best);
      this.onLoco?.(c, 'couple', best);
    }
    c.towed.forEach((t, i) => {
      const at = this.trailAt(c, c.odo - (i + 1) * GAP);
      if (!at) return;
      Object.assign(t, { x: at.x, y: at.y, z: at.z, from: at.from, to: at.to, s: at.s, speed: c.speed });
      this.place(t, railAt(world, t.x, t.y, t.z));
      this.light(t, world, light);
    });
  }

  // Let every coupled cart go (they stand where they are).
  uncouple(c) {
    for (const t of c.towed ?? []) { t.tow = null; t.speed = 0; }
    if (c.towed) c.towed = [];
  }

  // The storage cart standing on a rail cell, if any.
  storageAt(x, y, z) { return this.carts.find((c) => c.store && c.x === x && c.y === y && c.z === z) ?? null; }

  // Hoppers filling or emptying a storage cart on a loader rail keep it waiting there a moment longer.
  busy(c) { if (c.holding) c.hold = HOLD; }

  turnAround(c) {
    [c.from, c.to] = [c.to, c.from]; c.s = 1 - c.s;
    if (c.loco) { this.uncouple(c); c.trail = null; } // a locomotive turning round leaves its train behind
  }

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
      a.push(c.store ? c.store.inputs.map((it) => (it ? [it.id, it.count] : 0)) : 0);
      if (c.loco) a.push([c.loco.coal, +c.loco.burn.toFixed(1), c.loco.running ? 1 : 0]);
      return a;
    });
  }

  load(list) {
    this.clear();
    for (const a of list ?? []) {
      if (!Array.isArray(a) || !a.slice(0, 5).every(Number.isFinite)) continue;
      const [x, y, z, from, to, s, items, lc] = a;
      let loco = null;
      if (Array.isArray(lc)) loco = { coal: Math.max(0, lc[0] | 0), burn: Math.max(0, +lc[1] || 0), running: !!lc[2] };
      let store = null;
      if (Array.isArray(items)) {
        store = newStore();
        items.slice(0, CART_SLOTS).forEach((it, i) => { if (Array.isArray(it) && it[0] > 0 && it[1] > 0) store.inputs[i] = { id: it[0], count: it[1] }; });
      }
      this.spawn({ x, y, z, from, to, s: Math.min(1, Math.max(0, +s || 0)), speed: 0, store, loco });
    }
  }
}
