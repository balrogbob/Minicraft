// First-person player: AABB physics against the voxel grid.
import * as THREE from 'three';
import { isClimbable, LAVA } from './blocks.js';

const HALF = 0.3; // half width
const HEIGHT = 1.8;
const EYE = 1.62;
const GRAVITY = 28;
const JUMP_V = 8.6;
const WALK = 4.3;
const JET_THRUST = 16; // how much harder than gravity a jetpack pushes up
const JET_RISE = 6; // the fastest it climbs
const HOVER_FALL = 3; // the fastest hover boots let you fall

export class Player {
  constructor(world) {
    this.world = world;
    this.pos = new THREE.Vector3();
    this.vel = new THREE.Vector3();
    this.yaw = 0;
    this.pitch = 0;
    this.onGround = false;
    this.autoJump = true;
    this.speedMul = 1; // below 1 while starving
    this.flying = false; // creative mode only
    this.kx = 0; this.kz = 0; // knockback from being hit, fades quickly
    this.inWater = false; // any part of the body in water
    this.eyeInWater = false;
    this.climbing = false; // on a ladder or in scaffolding
    this.jetpack = false; // wearing a jetpack with charge in it (main.js)
    this.thrusting = false; // the jetpack is firing (main.js uses its charge)
    this.hover = false; // wearing hover boots with charge in them (main.js)
    this.hovering = false; // they're slowing a fall
  }

  updateWaterState() {
    const w = this.world, p = this.pos;
    const x = Math.floor(p.x), z = Math.floor(p.z);
    this.inWater = w.isWater(x, Math.floor(p.y + 0.1), z) || w.isWater(x, Math.floor(p.y + 0.9), z);
    this.eyeInWater = w.isWater(x, Math.floor(p.y + EYE), z);
    this.inLava = w.get(x, Math.floor(p.y + 0.1), z) === LAVA || w.get(x, Math.floor(p.y + 0.9), z) === LAVA;
    this.climbing = isClimbable(w.get(x, Math.floor(p.y + 0.1), z)) || isClimbable(w.get(x, Math.floor(p.y + 1), z));
  }

  get eye() { return new THREE.Vector3(this.pos.x, this.pos.y + EYE, this.pos.z); }

  lookDir() {
    const cp = Math.cos(this.pitch);
    return new THREE.Vector3(-Math.sin(this.yaw) * cp, Math.sin(this.pitch), -Math.cos(this.yaw) * cp);
  }

  spawn(x, y, z) {
    this.pos.set(x, y, z);
    this.vel.set(0, 0, 0);
  }

  // Does the player's body overlap block cell (bx, by, bz)?
  overlapsBlock(bx, by, bz) {
    const p = this.pos;
    return bx + 1 > p.x - HALF && bx < p.x + HALF && bz + 1 > p.z - HALF && bz < p.z + HALF &&
      by + 1 > p.y && by < p.y + HEIGHT;
  }

  // The collision boxes of every block cell around the player's box (fences poke up into the cell above).
  nearbyBoxes() {
    const p = this.pos, out = [];
    const x0 = Math.floor(p.x - HALF - 0.5), x1 = Math.floor(p.x + HALF + 0.5);
    const z0 = Math.floor(p.z - HALF - 0.5), z1 = Math.floor(p.z + HALF + 0.5);
    const y0 = Math.floor(p.y) - 1, y1 = Math.floor(p.y + HEIGHT + 0.6);
    for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) {
      const b = this.world.collisionBoxes(x, y, z);
      if (b) out.push(...b);
    }
    return out;
  }

  // Does the player's box (feet at y) overlap any of these boxes?
  hits(boxes, y = this.pos.y) {
    const p = this.pos;
    return boxes.some((b) => b[3] > p.x - HALF && b[0] < p.x + HALF && b[5] > p.z - HALF && b[2] < p.z + HALF && b[4] > y && b[1] < y + HEIGHT);
  }

  // Move along one axis and resolve collisions. Returns true if blocked. Walking on the ground into
  // something no more than half a block high (a slab or a stair) steps up onto it.
  moveAxis(axis, delta, canStep = false) {
    if (!delta) return false;
    const p = this.pos;
    p[axis] += delta;
    const boxes = this.nearbyBoxes();
    const eps = 1e-4;
    for (const b of boxes) {
      if (!(b[3] > p.x - HALF && b[0] < p.x + HALF && b[5] > p.z - HALF && b[2] < p.z + HALF && b[4] > p.y && b[1] < p.y + HEIGHT)) continue;
      if (axis === 'y') {
        if (delta < 0) { p.y = b[4]; this.onGround = true; } else p.y = b[1] - HEIGHT - eps;
        return true;
      }
      const rise = b[4] - p.y;
      if (canStep && rise > 0 && rise <= 0.55 && !this.hits(boxes, b[4] + eps)) { p.y = b[4] + eps; continue; }
      if (axis === 'x') p.x = delta > 0 ? b[0] - HALF - eps : b[3] + HALF + eps;
      else p.z = delta > 0 ? b[2] - HALF - eps : b[5] + HALF + eps;
      return true;
    }
    return false;
  }

  // input: { moveX, moveZ (forward +), jump, down }
  // While flying (creative mode) there's no gravity: jump rises, down sinks, and you move twice as fast.
  update(dt, input) {
    const fx = -Math.sin(this.yaw), fz = -Math.cos(this.yaw);
    const rx = Math.cos(this.yaw), rz = -Math.sin(this.yaw);
    let wx = fx * input.moveZ + rx * input.moveX;
    let wz = fz * input.moveZ + rz * input.moveX;
    const len = Math.hypot(wx, wz);
    if (len > 1) { wx /= len; wz /= len; }
    this.updateWaterState();
    this.thrusting = false;
    this.hovering = false;
    const control = this.flying ? 2.2 : this.inLava ? 0.3 : this.inWater ? 0.55 * (this.swimMul ?? 1) : this.onGround ? 1 : 0.85;
    this.vel.x = wx * WALK * control * this.speedMul + this.kx;
    this.vel.z = wz * WALK * control * this.speedMul + this.kz;
    const fade = Math.exp(-6 * dt);
    this.kx *= fade; this.kz *= fade;
    if (this.flying) {
      this.vel.y = ((input.jump ? 1 : 0) - (input.down ? 1 : 0)) * 8;
    } else if (this.climbing && !this.inWater) {
      // ladders: walk into them (or jump) to climb, back away to climb down, stand still to slide down slowly
      if (input.jump || input.moveZ > 0.3) this.vel.y = 3.2;
      else if (input.moveZ < -0.3) this.vel.y = -3.2;
      else this.vel.y = Math.max(this.vel.y - GRAVITY * dt, -1.2);
    } else if (this.inWater || this.inLava) {
      // swimming: slow sinking, jump swims upward
      this.vel.y -= 9 * dt;
      if (input.jump) this.vel.y = Math.min(this.vel.y + 30 * dt, 3.6 * Math.min(1.5, this.swimMul ?? 1));
      this.vel.y = Math.max(this.vel.y, -3);
    } else {
      if (input.jump && this.onGround) this.vel.y = JUMP_V;
      // a jetpack: hold jump in the air to climb (or to slow a fall)
      if (this.jetpack && input.jump && !this.onGround && this.vel.y < JET_RISE) {
        this.vel.y = Math.min(this.vel.y + (GRAVITY + JET_THRUST) * dt, JET_RISE);
        this.thrusting = true;
      }
      this.vel.y = Math.max(this.vel.y - GRAVITY * dt, -40);
      // hover boots: a gentle fall, unless you hold sneak (or are using a jetpack)
      if (this.hover && !this.thrusting && !input.down && !this.onGround && this.vel.y < -HOVER_FALL) { this.vel.y = -HOVER_FALL; this.hovering = true; }
    }

    // sub-step so fast falls never tunnel through blocks
    const steps = Math.max(1, Math.ceil((Math.abs(this.vel.y) + WALK) * dt / 0.4));
    const h = dt / steps;
    for (let i = 0; i < steps; i++) {
      const wasGround = this.onGround;
      const bx = this.moveAxis('x', this.vel.x * h, wasGround);
      const bz = this.moveAxis('z', this.vel.z * h, wasGround);
      this.onGround = false;
      if (this.moveAxis('y', this.vel.y * h)) this.vel.y = 0;
      // auto-jump: walked into a 1-high step with headroom above it
      if (this.autoJump && wasGround && !this.inWater && (bx || bz) && len > 0.3 && this.canStepUp(wx, wz)) {
        this.vel.y = JUMP_V;
      }
      // climb out of water onto a ledge you swim against
      if (this.inWater && (bx || bz) && len > 0.3 && this.canStepUp(wx, wz)) this.vel.y = Math.max(this.vel.y, 6.5);
    }
  }

  // Pulled along by something (a grappling hook): velocity v, no gravity or walking, still stopped by blocks.
  // Returns how far it really moved.
  pulled(dt, v) {
    this.updateWaterState();
    this.vel.copy(v);
    this.kx = 0; this.kz = 0;
    const from = this.pos.clone();
    const steps = Math.max(1, Math.ceil(v.length() * dt / 0.3));
    const h = dt / steps;
    for (let i = 0; i < steps; i++) {
      this.moveAxis('x', v.x * h, false);
      this.moveAxis('z', v.z * h, false);
      this.onGround = false;
      this.moveAxis('y', v.y * h);
    }
    return this.pos.distanceTo(from);
  }

  canStepUp(wx, wz) {
    const w = this.world;
    const ax = Math.floor(this.pos.x + Math.sign(wx) * (HALF + 0.3));
    const az = Math.floor(this.pos.z + Math.sign(wz) * (HALF + 0.3));
    const fy = Math.floor(this.pos.y + 0.01);
    const cells = [];
    if (Math.abs(wx) > 0.2) cells.push([ax, Math.floor(this.pos.z)]);
    if (Math.abs(wz) > 0.2) cells.push([Math.floor(this.pos.x), az]);
    return cells.some(([x, z]) =>
      w.isSolid(x, fy, z) && w.collisionBoxes(x, fy, z)?.every((b) => b[4] <= fy + 1) && !w.isSolid(x, fy + 1, z) && !w.isSolid(x, fy + 2, z) &&
      !w.isSolid(Math.floor(this.pos.x), fy + 2, Math.floor(this.pos.z)));
  }
}
