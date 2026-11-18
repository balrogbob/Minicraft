// Arrows shot from the bow: they fly in an arc, bump animals they hit, and stick in blocks,
// where the player can pick them back up by walking over them.
import * as THREE from 'three';
import { ARROW } from './blocks.js';
import { H } from './terrain.js';
import { skyBrightness, lightBrightness } from './world.js';

const GRAVITY = 20;
const MIN_SPEED = 8, MAX_SPEED = 40; // blocks per second, from a quick tap to a full draw
const STUCK_SECONDS = 60; // stuck arrows vanish after this long
const FLY_SECONDS = 10;
const PICKUP_RANGE = 1.6;

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
  shoot(origin, dir, power) {
    const speed = MIN_SPEED + (MAX_SPEED - MIN_SPEED) * Math.max(0, Math.min(1, power));
    const material = new THREE.MeshBasicMaterial({ vertexColors: true });
    const group = new THREE.Group();
    for (const g of this.parts) group.add(new THREE.Mesh(g, material));
    const a = {
      pos: origin.clone().addScaledVector(dir, 0.6),
      vel: dir.clone().multiplyScalar(speed),
      stuck: false,
      age: 0,
      group,
      material,
    };
    this.arrows.push(a);
    this.scene.add(group);
    this.sound?.bow(power);
    this.place(a);
    return a;
  }

  place(a) {
    a.group.position.copy(a.pos);
    if (!a.stuck) a.group.lookAt(a.pos.x + a.vel.x, a.pos.y + a.vel.y, a.pos.z + a.vel.z);
  }

  // Returns how many stuck arrows the player picked up this frame.
  update(dt, { world, mobs, player, light }) {
    let picked = 0;
    const tmp = new THREE.Vector3();
    for (let i = this.arrows.length - 1; i >= 0; i--) {
      const a = this.arrows[i];
      a.age += dt;
      if (a.stuck) {
        // walk over a stuck arrow to pick it up
        const d = tmp.copy(a.pos).sub(player.pos).setY(a.pos.y - (player.pos.y + 0.9)).length();
        if (d < PICKUP_RANGE) { picked++; this.remove(a); this.arrows.splice(i, 1); continue; }
        if (a.age > STUCK_SECONDS || !world.chunkAt(Math.floor(a.pos.x), Math.floor(a.pos.z))) { this.remove(a); this.arrows.splice(i, 1); continue; }
      } else {
        if (a.age > FLY_SECONDS) { this.remove(a); this.arrows.splice(i, 1); continue; }
        // water slows arrows down a lot
        if (world.isWater(Math.floor(a.pos.x), Math.floor(a.pos.y), Math.floor(a.pos.z))) a.vel.multiplyScalar(Math.max(0, 1 - 4 * dt));
        a.vel.y -= GRAVITY * dt;
        const step = a.vel.length() * dt;
        if (step > 0) {
          const dir = tmp.copy(a.vel).normalize();
          const block = world.raycast(a.pos, dir, step, true);
          const mob = mobs.raycast(a.pos, dir, step);
          if (mob && (!block || mob.t < block.t)) {
            // hit an animal: it gets bumped away from the arrow, and the arrow breaks
            mobs.bump(mob.mob, a.pos.clone().addScaledVector(dir, -2));
            this.remove(a); this.arrows.splice(i, 1);
            continue;
          }
          if (block) {
            a.pos.addScaledVector(dir, Math.max(0, block.t - 0.02)); // the tip lodges at the surface
            a.group.lookAt(a.pos.x + dir.x, a.pos.y + dir.y, a.pos.z + dir.z);
            a.stuck = true;
            a.age = 0;
            this.sound?.arrowHit();
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
