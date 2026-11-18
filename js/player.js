// First-person player: AABB physics against the voxel grid.
import * as THREE from 'three';

const HALF = 0.3; // half width
const HEIGHT = 1.8;
const EYE = 1.62;
const GRAVITY = 28;
const JUMP_V = 8.6;
const WALK = 4.3;

export class Player {
  constructor(world) {
    this.world = world;
    this.pos = new THREE.Vector3();
    this.vel = new THREE.Vector3();
    this.yaw = 0;
    this.pitch = 0;
    this.onGround = false;
    this.autoJump = true;
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

  // Move along one axis and resolve collisions. Returns true if blocked.
  moveAxis(axis, delta) {
    if (!delta) return false;
    const p = this.pos;
    p[axis] += delta;
    const x0 = Math.floor(p.x - HALF), x1 = Math.floor(p.x + HALF - 1e-6);
    const y0 = Math.floor(p.y), y1 = Math.floor(p.y + HEIGHT - 1e-6);
    const z0 = Math.floor(p.z - HALF), z1 = Math.floor(p.z + HALF - 1e-6);
    for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) {
      if (!this.world.isSolid(x, y, z)) continue;
      if (axis === 'x') p.x = delta > 0 ? x - HALF - 1e-4 : x + 1 + HALF + 1e-4;
      else if (axis === 'z') p.z = delta > 0 ? z - HALF - 1e-4 : z + 1 + HALF + 1e-4;
      else {
        if (delta < 0) { p.y = y + 1; this.onGround = true; } else p.y = y - HEIGHT - 1e-4;
      }
      return true;
    }
    return false;
  }

  // input: { moveX, moveZ (forward +), jump }
  update(dt, input) {
    const fx = -Math.sin(this.yaw), fz = -Math.cos(this.yaw);
    const rx = Math.cos(this.yaw), rz = -Math.sin(this.yaw);
    let wx = fx * input.moveZ + rx * input.moveX;
    let wz = fz * input.moveZ + rz * input.moveX;
    const len = Math.hypot(wx, wz);
    if (len > 1) { wx /= len; wz /= len; }
    const control = this.onGround ? 1 : 0.85;
    this.vel.x = wx * WALK * control;
    this.vel.z = wz * WALK * control;
    if (input.jump && this.onGround) this.vel.y = JUMP_V;
    this.vel.y = Math.max(this.vel.y - GRAVITY * dt, -40);

    // sub-step so fast falls never tunnel through blocks
    const steps = Math.max(1, Math.ceil((Math.abs(this.vel.y) + WALK) * dt / 0.4));
    const h = dt / steps;
    for (let i = 0; i < steps; i++) {
      const wasGround = this.onGround;
      const bx = this.moveAxis('x', this.vel.x * h);
      const bz = this.moveAxis('z', this.vel.z * h);
      this.onGround = false;
      if (this.moveAxis('y', this.vel.y * h)) this.vel.y = 0;
      // auto-jump: walked into a 1-high step with headroom above it
      if (this.autoJump && wasGround && (bx || bz) && len > 0.3 && this.canStepUp(wx, wz)) {
        this.vel.y = JUMP_V;
      }
    }
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
      w.isSolid(x, fy, z) && !w.isSolid(x, fy + 1, z) && !w.isSolid(x, fy + 2, z) &&
      !w.isSolid(Math.floor(this.pos.x), fy + 2, Math.floor(this.pos.z)));
  }
}
