// Arrows shot from the bow fly in an arc, hit animals and night creatures, and stick in blocks,
// where the player can pick them back up by walking over them. Thornspitters' thorns use the
// same flight, but hit the player instead (and can't be picked up).
import * as THREE from 'three';
import { ARROW, SILVER_ARROW } from './blocks.js';
import { H } from './terrain.js';
import { skyBrightness, lightBrightness } from './world.js';

const GRAVITY = 20;
const MIN_SPEED = 8, MAX_SPEED = 40; // blocks per second, from a quick tap to a full draw
const STUCK_SECONDS = 60; // stuck arrows vanish after this long
const FLY_SECONDS = 10;
const PICKUP_RANGE = 1.6;
const THORN_STUCK_SECONDS = 3;
export const THORN_SPEED = 16;
export const THORN_GRAVITY = 6; // thorns are light: they arc less than arrows

// Where along a ray (origin o, unit dir d, up to len) it enters an axis-aligned box, or null.
function rayBox(o, d, len, min, max) {
  let t0 = 0, t1 = len;
  for (const a of ['x', 'y', 'z']) {
    if (Math.abs(d[a]) < 1e-9) { if (o[a] < min[a] || o[a] > max[a]) return null; continue; }
    let ta = (min[a] - o[a]) / d[a], tb = (max[a] - o[a]) / d[a];
    if (ta > tb) [ta, tb] = [tb, ta];
    t0 = Math.max(t0, ta); t1 = Math.min(t1, tb);
    if (t0 > t1) return null;
  }
  return t0;
}

const SHADE = [0.8, 0.8, 1.0, 0.5, 0.65, 0.65].map((v) => Math.pow(v, 2.2));
function shadedBox([w, h, d], color, [x, y, z]) {
  const g = new THREE.BoxGeometry(w, h, d);
  g.translate(x, y, z);
  const c = new THREE.Color(color);
  const col = new Float32Array(72);
  for (let i = 0; i < 24; i++) { const s = SHADE[i >> 2]; col[i * 3] = c.r * s; col[i * 3 + 1] = c.g * s; col[i * 3 + 2] = c.b * s; }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return g;
}

export class ArrowManager {
  constructor(scene, sound) {
    this.scene = scene;
    this.sound = sound;
    this.arrows = [];
    // all arrows share one set of geometry: shaft, stone head and feather fletching, pointing along +z
    this.parts = [
      shadedBox([0.04, 0.04, 0.62], 0x7a5630, [0, 0, 0]),
      shadedBox([0.09, 0.09, 0.12], 0x9a9a9e, [0, 0, 0.36]),
      shadedBox([0.12, 0.02, 0.14], 0xf2f2ee, [0, 0, -0.26]),
      shadedBox([0.02, 0.12, 0.14], 0xf2f2ee, [0, 0, -0.26]),
    ];
    // silver arrows: the same, with a bright silver head
    this.silverParts = [this.parts[0], shadedBox([0.09, 0.09, 0.12], 0xf0f2fa, [0, 0, 0.36]), this.parts[2], this.parts[3]];
    this.thornParts = [
      shadedBox([0.05, 0.05, 0.34], 0x6b8f2e, [0, 0, 0]),
      shadedBox([0.03, 0.03, 0.14], 0xd9d2a8, [0, 0, 0.23]),
    ];
  }

  reset() {
    for (const a of this.arrows) this.remove(a);
    this.arrows = [];
  }

  remove(a) {
    this.scene.remove(a.group);
    a.material.dispose();
  }

  // Fire from `origin` along unit vector `dir`; power 0..1 is how far the bow was drawn.
  shoot(origin, dir, power, silver = false) {
    const speed = MIN_SPEED + (MAX_SPEED - MIN_SPEED) * Math.max(0, Math.min(1, power));
    this.sound?.bow(power);
    return this.launch(origin, dir, speed, { power, thorn: false, silver });
  }

  // A thornspitter's thorn: slower, and it hurts the player for `damage` if it hits.
  shootThorn(origin, dir, damage) {
    return this.launch(origin, dir, THORN_SPEED, { damage, thorn: true, gravity: THORN_GRAVITY });
  }

  launch(origin, dir, speed, extra) {
    const material = new THREE.MeshBasicMaterial({ vertexColors: true });
    const group = new THREE.Group();
    for (const g of extra.thorn ? this.thornParts : extra.silver ? this.silverParts : this.parts) group.add(new THREE.Mesh(g, material));
    const a = {
      pos: origin.clone().addScaledVector(dir, extra.thorn ? 0.5 : 0.6),
      vel: dir.clone().multiplyScalar(speed),
      stuck: false,
      age: 0,
      group,
      material,
      ...extra,
    };
    this.arrows.push(a);
    this.scene.add(group);
    this.place(a);
    return a;
  }

  place(a) {
    a.group.position.copy(a.pos);
    if (!a.stuck) a.group.lookAt(a.pos.x + a.vel.x, a.pos.y + a.vel.y, a.pos.z + a.vel.z);
  }

  // Returns the stuck arrows the player picked up this frame, as a list of item ids.
  // onHitMob(mob, arrow, fromPos): an arrow hit an animal or creature. onHitPlayer(damage): a thorn hit.
  update(dt, { world, mobs, player, light, onHitMob, onHitPlayer }) {
    const picked = [];
    const tmp = new THREE.Vector3();
    for (let i = this.arrows.length - 1; i >= 0; i--) {
      const a = this.arrows[i];
      a.age += dt;
      if (a.stuck && a.thorn) {
        if (a.age > THORN_STUCK_SECONDS) { this.remove(a); this.arrows.splice(i, 1); continue; }
      } else if (a.stuck) {
        // walk over a stuck arrow to pick it up
        const d = tmp.copy(a.pos).sub(player.pos).setY(a.pos.y - (player.pos.y + 0.9)).length();
        if (d < PICKUP_RANGE) { picked.push(a.silver ? SILVER_ARROW : ARROW); this.remove(a); this.arrows.splice(i, 1); continue; }
        if (a.age > STUCK_SECONDS || !world.chunkAt(Math.floor(a.pos.x), Math.floor(a.pos.z))) { this.remove(a); this.arrows.splice(i, 1); continue; }
      } else {
        if (a.age > FLY_SECONDS) { this.remove(a); this.arrows.splice(i, 1); continue; }
        // water slows arrows down a lot
        if (world.isWater(Math.floor(a.pos.x), Math.floor(a.pos.y), Math.floor(a.pos.z))) a.vel.multiplyScalar(Math.max(0, 1 - 4 * dt));
        a.vel.y -= (a.gravity ?? GRAVITY) * dt;
        const step = a.vel.length() * dt;
        if (step > 0) {
          const dir = tmp.copy(a.vel).normalize();
          const block = world.raycast(a.pos, dir, step, true);
          if (a.thorn) {
            // thorns fly past animals and creatures, and hurt the player
            const p = player.pos;
            const t = rayBox(a.pos, dir, step, { x: p.x - 0.35, y: p.y, z: p.z - 0.35 }, { x: p.x + 0.35, y: p.y + 1.8, z: p.z + 0.35 });
            if (t !== null && (!block || t < block.t)) {
              onHitPlayer?.(a.damage);
              this.remove(a); this.arrows.splice(i, 1);
              continue;
            }
          } else {
            const mob = mobs.raycast(a.pos, dir, step);
            if (mob && (!block || mob.t < block.t)) {
              // hit an animal or creature: the game decides what happens; the arrow breaks
              onHitMob?.(mob.mob, a, a.pos.clone().addScaledVector(dir, -2));
              this.remove(a); this.arrows.splice(i, 1);
              continue;
            }
          }
          if (block) {
            a.pos.addScaledVector(dir, Math.max(0, block.t - 0.02)); // the tip lodges at the surface
            a.group.lookAt(a.pos.x + dir.x, a.pos.y + dir.y, a.pos.z + dir.z);
            a.stuck = true;
            a.age = 0;
            if (!a.thorn) this.sound?.arrowHit();
          } else {
            a.pos.addScaledVector(dir, step);
          }
          if (a.pos.y < -10) { this.remove(a); this.arrows.splice(i, 1); continue; }
        }
        this.place(a);
      }
      // lit like everything else around it
      const x = Math.floor(a.pos.x), y = Math.min(H - 1, Math.floor(a.pos.y)), z = Math.floor(a.pos.z);
      const sun = light.day * skyBrightness(world.skyAt(x, y, z));
      const t = lightBrightness(world.lightAt(x, y, z)) * light.flicker;
      a.material.color.setRGB(Math.max(sun, t, light.ambient), Math.max(sun, t * 0.86, light.ambient), Math.max(sun, t * 0.66, light.ambient));
    }
    return picked;
  }
}

export { ARROW };
