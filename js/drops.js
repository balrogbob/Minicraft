// Loose items lying in the world: things you throw (Q, or hold a hotbar slot), and what spills out of a
// chest or machine when you break it. They fly in an arc, bounce, roll to a stop and slowly spin. Walk
// over one to pick it up (things you've just thrown wait a moment first). One that comes to rest on a
// conveyor belt rides off along it, and one that lands on a hopper (or a bucket elevator) drops in. They're saved with the world,
// and vanish after a few minutes so they can't pile up forever.
import * as THREE from 'three';
import { BLOCKS, isWaterId, LAVA } from './blocks.js';
import { skyBrightness, lightBrightness } from './world.js';

const R = 0.12; // half the size of an item's box
const GRAVITY = 20;
const LIFETIME = 300; // seconds before a loose item vanishes
const MAX_ITEMS = 300;
const PICKUP_REACH = 1.3;
const CATCH_EVERY = 0.25; // seconds between tries at handing an item to a belt or hopper


export class ItemDrops {
  // makeSprite(id) -> THREE.Sprite added to the scene
  constructor(scene, makeSprite) {
    this.scene = scene;
    this.makeSprite = makeSprite;
    this.items = []; // { stack: { id, count, wear?, ench? }, pos, vel, age, delay, catchT, spin, sprite, ground }
  }

  // Put a stack into the world at pos (a Vector3 or {x, y, z}) moving at vel; nobody can pick it up for `delay` s.
  spawn(stack, pos, vel = { x: 0, y: 0, z: 0 }, delay = 0) {
    if (!stack || stack.count <= 0) return null;
    if (this.items.length >= MAX_ITEMS) this.remove(this.items[0]);
    const it = {
      stack: { ...stack }, pos: new THREE.Vector3(pos.x, pos.y, pos.z), vel: new THREE.Vector3(vel.x, vel.y, vel.z),
      age: 0, delay, catchT: 0, spin: Math.random() * Math.PI * 2, sprite: this.makeSprite(stack.id), ground: false,
    };
    this.items.push(it);
    return it;
  }

  // Scatter stacks out of a block (a broken chest or machine).
  spill(stacks, x, y, z) {
    for (const s of stacks) {
      if (!s || s.count <= 0) continue;
      const a = Math.random() * Math.PI * 2, v = 1 + Math.random() * 1.5;
      this.spawn(s, { x: x + 0.5, y: y + 0.4, z: z + 0.5 }, { x: Math.cos(a) * v, y: 3 + Math.random() * 2, z: Math.sin(a) * v }, 0.5);
    }
  }

  remove(it) {
    const i = this.items.indexOf(it);
    if (i >= 0) this.items.splice(i, 1);
    this.scene.remove(it.sprite);
    it.sprite.material.dispose();
  }

  clear() { for (const it of [...this.items]) this.remove(it); }

  // Move one item along an axis, stopping at blocks. Returns true if it hit something.
  move(world, it, axis, d) {
    if (!d) return false;
    const p = it.pos;
    p[axis] += d;
    const x0 = Math.floor(p.x - R), x1 = Math.floor(p.x + R), y0 = Math.floor(p.y), y1 = Math.floor(p.y + 2 * R);
    const z0 = Math.floor(p.z - R), z1 = Math.floor(p.z + R);
    for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) {
      for (const b of world.collisionBoxes(x, y, z) ?? []) {
        if (!(b[3] > p.x - R && b[0] < p.x + R && b[5] > p.z - R && b[2] < p.z + R && b[4] > p.y && b[1] < p.y + 2 * R)) continue;
        if (axis === 'y') { if (d < 0) { p.y = b[4]; it.ground = true; } else p.y = b[1] - 2 * R - 1e-4; }
        else if (axis === 'x') p.x = d > 0 ? b[0] - R - 1e-4 : b[3] + R + 1e-4;
        else p.z = d > 0 ? b[2] - R - 1e-4 : b[5] + R + 1e-4;
        return true;
      }
    }
    return false;
  }

  // hooks: { player (pos), pickup(stack) -> how many it took, insert(x, y, z, id, n) -> how many a machine took,
  //          light: { day, flicker, ambient } }
  update(dt, world, hooks) {
    const time = performance.now() / 1000;
    for (const it of [...this.items]) {
      it.age += dt;
      if (it.age > LIFETIME) { this.remove(it); continue; }
      const p = it.pos, v = it.vel;
      // a chunk that isn't loaded holds it still until it is
      if (!world.chunkAt(Math.floor(p.x), Math.floor(p.z))) continue;
      const here = world.get(Math.floor(p.x), Math.floor(p.y + R), Math.floor(p.z));
      if (here === LAVA || BLOCKS[here]?.variantOf === LAVA) { this.remove(it); continue; } // burnt up
      const wet = isWaterId(here);
      if (wet) { v.y = Math.min(v.y + 14 * dt, 0.8); v.multiplyScalar(Math.exp(-3 * dt)); } // things float up
      else v.y = Math.max(v.y - GRAVITY * dt, -30);
      const wasGround = it.ground;
      it.ground = false;
      const steps = Math.max(1, Math.ceil(v.length() * dt / 0.2));
      for (let s = 0; s < steps; s++) {
        if (this.move(world, it, 'x', v.x * dt / steps)) v.x *= -0.3;
        if (this.move(world, it, 'z', v.z * dt / steps)) v.z *= -0.3;
        const fall = v.y;
        if (this.move(world, it, 'y', v.y * dt / steps)) v.y = fall < -4 ? -fall * 0.3 : 0; // a little bounce
      }
      if (!it.ground && wasGround && v.y === 0) it.ground = true;
      if (it.ground) { const f = Math.exp(-8 * dt); v.x *= f; v.z *= f; }

      // a belt or hopper under it takes it
      if ((it.catchT -= dt) <= 0) {
        it.catchT = CATCH_EVERY;
        const bx = Math.floor(p.x), bz = Math.floor(p.z);
        for (const by of [Math.floor(p.y + 0.01), Math.floor(p.y - 0.05)]) {
          const def = BLOCKS[world.get(bx, by, bz)];
          if (!def?.belt && !def?.hopper && !def?.elevator) continue;
          const took = hooks.insert(bx, by, bz, it.stack, def.belt ? 1 : it.stack.count); // (with its wear and charge)
          if (took > 0) it.stack.count -= took;
          break;
        }
        if (it.stack.count <= 0) { this.remove(it); continue; }
      }

      // walk over it to pick it up
      const pl = hooks.player.pos;
      if (it.age >= it.delay && Math.hypot(pl.x - p.x, pl.z - p.z) < PICKUP_REACH && p.y > pl.y - 0.8 && p.y < pl.y + 1.9) {
        const took = hooks.pickup(it.stack);
        if (took > 0) {
          it.stack.count -= took;
          if (it.stack.count <= 0) { this.remove(it); continue; }
        }
      }

      // draw it: bobbing, lit like the block it's in
      const L = hooks.light, bx = Math.floor(p.x), by = Math.floor(p.y + R), bz = Math.floor(p.z);
      const sun = L.day * skyBrightness(world.skyAt(bx, by, bz)), t = lightBrightness(world.lightAt(bx, by, bz)) * L.flicker;
      it.sprite.material.color.setRGB(Math.max(sun, t, L.ambient), Math.max(sun, t * 0.86, L.ambient), Math.max(sun, t * 0.66, L.ambient));
      it.sprite.position.set(p.x, p.y + 0.2 + (it.ground ? Math.sin(time * 2.5 + it.spin) * 0.05 + 0.05 : 0), p.z);
      it.sprite.material.rotation = it.ground ? Math.sin(time * 1.5 + it.spin) * 0.25 : it.sprite.material.rotation + dt * 6;
      // a stack of several shows a little bigger
      it.sprite.scale.setScalar(it.stack.count > 1 ? 0.36 : 0.3);
    }
  }

  serialize() {
    return this.items.map((it) => [it.stack, +it.pos.x.toFixed(2), +it.pos.y.toFixed(2), +it.pos.z.toFixed(2), Math.round(it.age)]);
  }

  load(list) {
    this.clear();
    for (const e of Array.isArray(list) ? list : []) {
      const [s, x, y, z, age] = e ?? [];
      if (!s || !(s.id > 0) || !(s.count > 0) || ![x, y, z].every(Number.isFinite)) continue;
      const stack = { id: s.id, count: s.count };
      if (s.wear > 0) stack.wear = s.wear;
      if (Array.isArray(s.ench) && s.ench.length) stack.ench = s.ench.filter((k) => typeof k === 'string');
      const it = this.spawn(stack, { x, y, z });
      if (it) it.age = Math.max(0, +age || 0);
    }
  }
}
