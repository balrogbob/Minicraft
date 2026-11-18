// Animals: ducks, buffalo, alpacas and newts that spawn around the player and wander the world.
//
// Each animal is a small hierarchy of shaded boxes (legs and heads on pivots so they can move),
// with simple behaviour: stand, wander, graze, and run away when bumped. They follow the same
// physics as the player (gravity, block collisions, stepping up one block) and float in water.
// They aren't saved: they're spawned fresh around wherever you are.
import * as THREE from 'three';
import { AIR, WATER, LEAVES, LOG, GRASS, SAND, DIRT, WOOL } from './blocks.js';
import { SEA_LEVEL, H } from './terrain.js';
import { skyBrightness, lightBrightness } from './world.js';

const GRAVITY = 28;
const MAX_MOBS = 26;
const SPAWN_MIN_DIST = 24;
const SHORN_SECONDS = 150; // how long an alpaca's coat takes to grow back

// face brightness for box faces (+x, -x, +y, -y, +z, -z), matching the world's block shading
const SHADE = [0.8, 0.8, 1.0, 0.5, 0.65, 0.65].map((v) => Math.pow(v, 2.2));
const rand = (a, b) => a + Math.random() * (b - a);
const pick = (list) => list[Math.floor(Math.random() * list.length)];

// Builds a model from coloured boxes. All boxes of one animal share its material, whose colour
// is set every frame from the light where the animal stands.
class Builder {
  constructor(material) {
    this.material = material;
    this.geometries = [];
  }

  box(parent, [w, h, d], color, [x, y, z] = [0, 0, 0]) {
    const g = new THREE.BoxGeometry(w, h, d);
    const c = new THREE.Color(color);
    const col = new Float32Array(24 * 3);
    for (let i = 0; i < 24; i++) {
      const s = SHADE[i >> 2];
      col[i * 3] = c.r * s; col[i * 3 + 1] = c.g * s; col[i * 3 + 2] = c.b * s;
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const m = new THREE.Mesh(g, this.material);
    m.position.set(x, y, z);
    parent.add(m);
    this.geometries.push(g);
    return m;
  }

  pivot(parent, [x, y, z]) {
    const p = new THREE.Group();
    p.position.set(x, y, z);
    parent.add(p);
    return p;
  }
}

// ---------- species ----------
// Models face +z with their feet at y = 0. Sizes are in blocks.
// w/h: collision box; sink: how deep they float in water; stride: leg swing speed.

const SPECIES = {
  duck: {
    w: 0.5, h: 0.65, speed: 1.2, fleeSpeed: 3.2, sink: 0.18, stride: 9, legSwing: 0.7,
    group: [2, 4], cap: 8, avoidWater: false, grazes: false,
    build(b, root) {
      const drake = Math.random() < 0.5;
      const body = drake ? 0x9c958a : 0x8c6b47;
      const parts = { legs: [] };
      const torso = parts.torso = b.pivot(root, [0, 0, 0]);
      b.box(torso, [0.42, 0.3, 0.6], body, [0, 0.3, 0]);
      b.box(torso, [0.4, 0.24, 0.18], drake ? 0x6e3b22 : body, [0, 0.3, 0.26]); // chest
      b.box(torso, [0.28, 0.12, 0.16], drake ? 0x2b2b2b : 0x6e5236, [0, 0.4, -0.34]); // tail
      for (const s of [-1, 1]) {
        b.box(torso, [0.06, 0.2, 0.44], drake ? 0x7c7368 : 0x7a5b3b, [s * 0.22, 0.33, -0.04]); // wing
        b.box(torso, [0.065, 0.06, 0.12], 0x2b55c8, [s * 0.225, 0.3, -0.06]); // blue wing patch
      }
      const head = parts.head = b.pivot(torso, [0, 0.42, 0.24]);
      if (drake) b.box(head, [0.2, 0.05, 0.2], 0xffffff, [0, 0, 0]); // white collar
      b.box(head, [0.22, 0.24, 0.26], drake ? 0x1d6b3c : 0x7f6040, [0, 0.13, 0.02]);
      b.box(head, [0.14, 0.06, 0.16], drake ? 0xe3b52a : 0xc98a2e, [0, 0.08, 0.21]); // bill
      for (const s of [-1, 1]) b.box(head, [0.03, 0.04, 0.04], 0x111111, [s * 0.112, 0.17, 0.08]);
      for (const s of [-1, 1]) {
        const leg = b.pivot(root, [s * 0.1, 0.15, 0.02]);
        b.box(leg, [0.05, 0.14, 0.05], 0xee8a1c, [0, -0.07, 0]);
        b.box(leg, [0.12, 0.02, 0.14], 0xee8a1c, [0, -0.14, 0.04]); // webbed foot
        parts.legs.push(leg);
      }
      return parts;
    },
  },

  buffalo: {
    w: 1.25, h: 1.85, speed: 1.1, fleeSpeed: 4.5, sink: 1.15, stride: 5, legSwing: 0.45,
    group: [2, 4], cap: 6, avoidWater: true, grazes: true,
    build(b, root) {
      const fur = 0x4b3323, mane = 0x3a2617, dark = 0x24170e, horn = 0xd8cdb5;
      const parts = { legs: [] };
      b.box(root, [1.0, 0.85, 1.1], fur, [0, 1.05, -0.4]); // hindquarters
      b.box(root, [1.2, 1.1, 0.95], mane, [0, 1.15, 0.42]); // shaggy shoulders
      b.box(root, [0.9, 0.3, 0.7], mane, [0, 1.82, 0.32]); // hump
      const head = parts.head = b.pivot(root, [0, 1.2, 0.9]);
      b.box(head, [0.66, 0.66, 0.55], dark, [0, -0.18, 0.22]);
      b.box(head, [0.62, 0.2, 0.5], mane, [0, 0.2, 0.18]); // shaggy crown
      b.box(head, [0.46, 0.28, 0.14], 0x1a110a, [0, -0.32, 0.54]); // muzzle
      b.box(head, [0.36, 0.35, 0.3], dark, [0, -0.62, 0.2]); // beard
      for (const s of [-1, 1]) {
        b.box(head, [0.28, 0.12, 0.12], horn, [s * 0.44, 0.04, 0.2]);
        b.box(head, [0.1, 0.2, 0.1], horn, [s * 0.55, 0.18, 0.2]); // upturned horn tip
        b.box(head, [0.04, 0.06, 0.04], 0x0a0a0a, [s * 0.33, -0.08, 0.42]);
      }
      for (const [x, z] of [[-0.33, 0.55], [0.33, 0.55], [-0.33, -0.7], [0.33, -0.7]]) {
        const leg = b.pivot(root, [x, 0.65, z]);
        b.box(leg, [0.28, 0.6, 0.28], 0x2f1e12, [0, -0.3, 0]);
        b.box(leg, [0.3, 0.08, 0.3], 0x151515, [0, -0.6, 0]); // hoof
        parts.legs.push(leg);
      }
      const tail = parts.tail = b.pivot(root, [0, 1.35, -0.95]);
      b.box(tail, [0.1, 0.45, 0.1], dark, [0, -0.22, 0]);
      b.box(tail, [0.16, 0.14, 0.16], mane, [0, -0.48, 0]);
      return parts;
    },
  },

  alpaca: {
    w: 0.8, h: 2.15, speed: 1.3, fleeSpeed: 4.2, sink: 1.35, stride: 6.5, legSwing: 0.5,
    group: [2, 3], cap: 6, avoidWater: true, grazes: true, wool: true,
    build(b, root) {
      const coat = pick([0xf1ece1, 0xf1ece1, 0xdcc09a, 0x8e5d3d, 0xa29c94, 0x3d3530]);
      const legColor = new THREE.Color(coat).multiplyScalar(0.85).getHex();
      const parts = { legs: [], fleece: [], tufts: [] };
      parts.fleece.push(b.box(root, [0.72, 0.66, 1.05], coat, [0, 1.0, 0])); // body
      parts.fleece.push(b.box(root, [0.3, 0.8, 0.3], coat, [0, 1.55, 0.42])); // neck
      const head = parts.head = b.pivot(root, [0, 1.92, 0.46]);
      b.box(head, [0.32, 0.3, 0.4], coat, [0, 0.04, 0.08]);
      parts.tufts.push(b.box(head, [0.36, 0.16, 0.3], coat, [0, 0.22, 0.02])); // fluffy topknot
      b.box(head, [0.2, 0.16, 0.16], 0x5e4c3e, [0, -0.04, 0.32]); // muzzle
      for (const s of [-1, 1]) {
        b.box(head, [0.07, 0.2, 0.06], coat, [s * 0.12, 0.33, -0.04]); // ears
        b.box(head, [0.04, 0.05, 0.04], 0x0a0a0a, [s * 0.163, 0.08, 0.18]);
      }
      for (const [x, z] of [[-0.2, 0.36], [0.2, 0.36], [-0.2, -0.36], [0.2, -0.36]]) {
        const leg = b.pivot(root, [x, 0.72, z]);
        parts.tufts.push(b.box(leg, [0.22, 0.26, 0.22], coat, [0, -0.08, 0])); // woolly thigh
        b.box(leg, [0.14, 0.66, 0.14], legColor, [0, -0.36, 0]);
        b.box(leg, [0.16, 0.06, 0.2], 0x352a22, [0, -0.69, 0.02]);
        parts.legs.push(leg);
      }
      const tail = parts.tail = b.pivot(root, [0, 1.12, -0.55]);
      b.box(tail, [0.18, 0.24, 0.14], coat, [0, -0.1, -0.02]);
      // a sheared alpaca is visibly slimmer until its coat grows back
      parts.shear = (shorn) => {
        parts.fleece[0].scale.set(shorn ? 0.78 : 1, shorn ? 0.82 : 1, shorn ? 0.9 : 1);
        parts.fleece[1].scale.set(shorn ? 0.72 : 1, 1, shorn ? 0.72 : 1);
        for (const t of parts.tufts) t.visible = !shorn;
      };
      return parts;
    },
  },

  newt: {
    w: 0.3, h: 0.15, speed: 0.9, fleeSpeed: 2.6, sink: 0.08, stride: 16, legSwing: 0.6,
    group: [1, 2], cap: 5, avoidWater: false, grazes: false,
    build(b, root) {
      const orange = Math.random() < 0.6;
      const skin = orange ? 0xe0641c : 0x6a5233, belly = orange ? 0xf08a2a : 0xe07a20, spot = orange ? 0xb5241a : 0x2a2018;
      const parts = { legs: [], newt: true };
      const torso = parts.torso = b.pivot(root, [0, 0, 0]);
      b.box(torso, [0.16, 0.08, 0.3], skin, [0, 0.07, 0]);
      b.box(torso, [0.14, 0.02, 0.28], belly, [0, 0.03, 0]);
      const head = parts.head = b.pivot(torso, [0, 0.07, 0.15]);
      b.box(head, [0.14, 0.07, 0.12], skin, [0, 0, 0.06]);
      for (const s of [-1, 1]) b.box(head, [0.03, 0.03, 0.03], 0x111111, [s * 0.07, 0.03, 0.07]);
      const tail = b.pivot(torso, [0, 0.07, -0.15]);
      b.box(tail, [0.08, 0.06, 0.18], skin, [0, 0, -0.09]);
      const tip = b.pivot(tail, [0, 0, -0.18]);
      b.box(tip, [0.05, 0.05, 0.16], skin, [0, 0, -0.08]);
      parts.tailSegments = [tail, tip];
      for (const [x, z] of [[0.04, 0.06], [-0.05, -0.04], [0.03, -0.1]]) b.box(torso, [0.035, 0.012, 0.035], spot, [x, 0.116, z]);
      for (const [x, z] of [[-0.1, 0.1], [0.1, 0.1], [-0.1, -0.09], [0.1, -0.09]]) {
        const leg = b.pivot(torso, [x, 0.05, z]);
        b.box(leg, [0.08, 0.03, 0.035], skin, [Math.sign(x) * 0.03, -0.02, 0]);
        parts.legs.push(leg);
      }
      return parts;
    },
  },
};

export const MOB_KINDS = Object.keys(SPECIES);

class Mob {
  constructor(kind, x, y, z) {
    this.kind = kind;
    this.spec = SPECIES[kind];
    this.pos = new THREE.Vector3(x, y, z);
    this.vel = new THREE.Vector3();
    this.kx = 0; this.kz = 0; // knockback
    this.yaw = rand(0, Math.PI * 2);
    this.heading = this.yaw;
    this.state = 'idle';
    this.timer = rand(0, 2);
    this.phase = 0;
    this.swing = 0; // leg swing amount, eased in and out
    this.headTilt = 0;
    this.onGround = false;
    this.inWater = false;
    this.flash = 0;
    this.soundTimer = rand(4, 20);
    this.shornFor = 0;
    this.material = new THREE.MeshBasicMaterial({ vertexColors: true });
    const b = new Builder(this.material);
    this.root = new THREE.Group();
    this.parts = this.spec.build(b, this.root);
    this.geometries = b.geometries;
  }

  dispose(scene) {
    scene.remove(this.root);
    for (const g of this.geometries) g.dispose();
    this.material.dispose();
  }
}

export class MobManager {
  constructor(scene, sound) {
    this.scene = scene;
    this.sound = sound;
    this.mobs = [];
    this.world = null;
    this.spawnTimer = 0;
  }

  reset(world) {
    for (const m of this.mobs) m.dispose(this.scene);
    this.mobs = [];
    this.world = world;
  }

  count(kind) {
    let n = 0;
    for (const m of this.mobs) if (m.kind === kind) n++;
    return n;
  }

  // ---------- spawning ----------

  // Top block of a column: { y, id }, or null under a tree (no spawning in canopies).
  surface(x, z) {
    const w = this.world;
    for (let y = H - 1; y > 0; y--) {
      const id = w.get(x, y, z);
      if (id === AIR) continue;
      if (id === LEAVES || id === LOG) return null;
      return { y, id };
    }
    return null;
  }

  nearWater(x, y, z, r = 3) {
    for (let dz = -r; dz <= r; dz++) for (let dx = -r; dx <= r; dx++) {
      if (this.world.isWater(x + dx, y, z + dz) || this.world.isWater(x + dx, y + 1, z + dz)) return true;
    }
    return false;
  }

  // Which animal (if any) would live at this column, and where its feet would go.
  habitat(x, z) {
    const s = this.surface(x, z);
    if (!s) return null;
    if (s.id === WATER) return { kinds: ['duck'], y: s.y + 0.875 - SPECIES.duck.sink, water: true };
    if (s.id !== GRASS && s.id !== SAND && s.id !== DIRT) return null;
    const y = s.y + 1;
    if (this.nearWater(x, s.y, z)) return { kinds: ['duck', 'newt'], y };
    if (s.id !== GRASS) return null;
    if (s.y >= SEA_LEVEL + 12) return { kinds: ['alpaca'], y };
    if (s.y >= SEA_LEVEL + 2) return { kinds: ['buffalo'], y };
    return null;
  }

  // Is the animal's whole collision box (centred on (x, z), feet at y) free of solid blocks?
  hasRoom(kind, x, y, z) {
    const w = this.world, hw = SPECIES[kind].w / 2, h = SPECIES[kind].h;
    for (let by = Math.floor(y); by <= Math.floor(y + h - 1e-6); by++)
      for (let bz = Math.floor(z - hw); bz <= Math.floor(z + hw - 1e-6); bz++)
        for (let bx = Math.floor(x - hw); bx <= Math.floor(x + hw - 1e-6); bx++) {
          if (w.isSolid(bx, by, bz)) return false;
        }
    return true;
  }

  trySpawn(player) {
    if (this.mobs.length >= MAX_MOBS) return;
    const w = this.world;
    const far = Math.max(SPAWN_MIN_DIST + 8, w.renderDistance * 16 - 8);
    const a = rand(0, Math.PI * 2), d = rand(SPAWN_MIN_DIST, far);
    const x = Math.floor(player.pos.x + Math.cos(a) * d), z = Math.floor(player.pos.z + Math.sin(a) * d);
    if (!w.chunkAt(x, z)) return;
    const hab = this.habitat(x, z);
    if (!hab) return;
    const kind = pick(hab.kinds);
    const spec = SPECIES[kind];
    if (this.count(kind) >= spec.cap) return;
    const n = Math.round(rand(spec.group[0], spec.group[1]));
    for (let i = 0; i < n && this.mobs.length < MAX_MOBS && this.count(kind) < spec.cap; i++) {
      const gx = i ? x + Math.round(rand(-3, 3)) : x, gz = i ? z + Math.round(rand(-3, 3)) : z;
      if (!w.chunkAt(gx, gz)) continue;
      const h = i ? this.habitat(gx, gz) : hab;
      if (!h || !h.kinds.includes(kind) || !this.hasRoom(kind, gx + 0.5, h.y, gz + 0.5)) continue;
      const m = new Mob(kind, gx + 0.5, h.y, gz + 0.5);
      this.mobs.push(m);
      this.scene.add(m.root);
    }
  }

  // ---------- per-frame update ----------

  // light: { day, flicker, ambient } from the renderer, so animals are lit like the blocks around them
  update(dt, player, light) {
    const w = this.world;
    if (!w) return;
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.spawnTimer = 0.4;
      this.trySpawn(player);
    }
    const despawn = w.renderDistance * 16 + 24;
    for (let i = this.mobs.length - 1; i >= 0; i--) {
      const m = this.mobs[i];
      const dx = m.pos.x - player.pos.x, dz = m.pos.z - player.pos.z;
      const dist = Math.hypot(dx, dz);
      if (dist > despawn || !w.chunkAt(Math.floor(m.pos.x), Math.floor(m.pos.z))) {
        m.dispose(this.scene);
        this.mobs.splice(i, 1);
        continue;
      }
      this.think(m, dt, player);
      this.move(m, dt);
      this.animate(m, dt);
      this.light(m, light, dt);
      m.soundTimer -= dt;
      if (m.soundTimer <= 0) {
        m.soundTimer = rand(8, 25);
        if (dist < 22) this.sound?.mob(m.kind, 1 - dist / 22);
      }
      if (m.shornFor > 0 && (m.shornFor -= dt) <= 0) m.parts.shear?.(false);
    }
  }

  // Behaviour: idle / graze / walk somewhere / run away from the player after being bumped.
  think(m, dt, player) {
    const spec = m.spec;
    m.timer -= dt;
    if (m.state === 'flee') {
      m.heading = Math.atan2(m.pos.x - player.pos.x, m.pos.z - player.pos.z) + Math.sin(m.timer * 3) * 0.3;
      if (m.timer <= 0) { m.state = 'idle'; m.timer = rand(1, 3); }
    } else if (m.timer <= 0) {
      const r = Math.random();
      if (m.state !== 'walk' && r < 0.55) {
        m.state = 'walk';
        m.heading = m.yaw + rand(-1.6, 1.6);
        m.timer = spec === SPECIES.newt ? rand(0.4, 1.4) : rand(1.5, 4.5);
      } else if (spec.grazes && r < 0.8) {
        m.state = 'graze';
        m.timer = rand(2, 5);
      } else {
        m.state = 'idle';
        m.timer = rand(1, 4);
      }
    }
  }

  speedOf(m) {
    if (m.state === 'flee') return m.spec.fleeSpeed;
    if (m.state === 'walk') return m.spec.speed * (m.inWater ? 0.6 : 1);
    return 0;
  }

  // Would stepping forward walk off a cliff (or, for land animals, into water)?
  badAhead(m, dx, dz) {
    const w = this.world, hw = m.spec.w / 2;
    const ax = Math.floor(m.pos.x + dx * (hw + 0.5)), az = Math.floor(m.pos.z + dz * (hw + 0.5));
    const fy = Math.floor(m.pos.y + 0.01);
    if (m.spec.avoidWater && (w.isWater(ax, fy, az) || w.isWater(ax, fy - 1, az))) return true;
    if (w.isSolid(ax, fy, az)) return false; // a wall or step: handled by stepping up or turning
    for (let d = 1; d <= 3; d++) if (w.isSolid(ax, fy - d, az) || w.isWater(ax, fy - d, az)) return false;
    return true;
  }

  // Move along one axis, stopping at the first solid block the leading face moves into.
  // Only newly entered cells are tested, so an animal that somehow overlaps a block can walk free
  // instead of being shoved through it.
  moveAxis(m, axis, delta) {
    if (!delta) return false;
    const w = this.world, p = m.pos, hw = m.spec.w / 2, h = m.spec.h;
    const lo = axis === 'y' ? p.y : p[axis] - hw;
    const hi = axis === 'y' ? p.y + h : p[axis] + hw;
    p[axis] += delta;
    // range of cells (along this axis) entered by the leading face, nearest first
    let first, last, step;
    if (delta > 0) { first = Math.floor(hi - 1e-6) + 1; last = Math.floor(hi + delta - 1e-6); step = 1; }
    else { first = Math.floor(lo) - 1; last = Math.floor(lo + delta); step = -1; }
    if ((last - first) * step < 0) return false;
    // the other two axes' cell ranges
    const r = (c, half) => [Math.floor(c - half), Math.floor(c + half - 1e-6)];
    const [ya, yb] = [Math.floor(p.y), Math.floor(p.y + h - 1e-6)];
    const [xa, xb] = r(p.x, hw), [za, zb] = r(p.z, hw);
    for (let c = first; (last - c) * step >= 0; c += step) {
      let solid = false;
      if (axis === 'x') { for (let y = ya; y <= yb && !solid; y++) for (let z = za; z <= zb; z++) if (w.isSolid(c, y, z)) { solid = true; break; } }
      else if (axis === 'z') { for (let y = ya; y <= yb && !solid; y++) for (let x = xa; x <= xb; x++) if (w.isSolid(x, y, c)) { solid = true; break; } }
      else { for (let z = za; z <= zb && !solid; z++) for (let x = xa; x <= xb; x++) if (w.isSolid(x, c, z)) { solid = true; break; } }
      if (!solid) continue;
      if (axis === 'y') {
        if (delta < 0) { p.y = c + 1; m.onGround = true; } else p.y = c - h - 1e-4;
      } else {
        p[axis] = delta > 0 ? c - hw - 1e-4 : c + 1 + hw + 1e-4;
      }
      return true;
    }
    return false;
  }

  canStepUp(m, dx, dz) {
    const w = this.world, hw = m.spec.w / 2;
    const ax = Math.floor(m.pos.x + Math.sign(dx) * (hw + 0.3)), az = Math.floor(m.pos.z + Math.sign(dz) * (hw + 0.3));
    const fy = Math.floor(m.pos.y + 0.01);
    for (let k = 1; k <= Math.ceil(m.spec.h); k++) if (w.isSolid(ax, fy + k, az)) return false;
    return w.isSolid(ax, fy, az);
  }

  move(m, dt) {
    const w = this.world, spec = m.spec;
    let speed = this.speedOf(m);
    let dx = Math.sin(m.heading), dz = Math.cos(m.heading);
    if (speed && (m.onGround || m.inWater) && this.badAhead(m, dx, dz)) {
      m.heading += m.state === 'flee' ? Math.PI / 2 : rand(Math.PI * 0.6, Math.PI * 1.4);
      dx = Math.sin(m.heading); dz = Math.cos(m.heading);
      speed *= 0.3;
    }
    m.vel.x = dx * speed + m.kx;
    m.vel.z = dz * speed + m.kz;
    const decay = Math.exp(-5 * dt);
    m.kx *= decay; m.kz *= decay;

    // float in water, fall on land
    const fx = Math.floor(m.pos.x), fz = Math.floor(m.pos.z);
    m.inWater = w.isWater(fx, Math.floor(m.pos.y + 0.05), fz) || w.isWater(fx, Math.floor(m.pos.y + spec.h * 0.5), fz);
    if (m.inWater) {
      let wy = Math.floor(m.pos.y + 0.05);
      if (!w.isWater(fx, wy, fz)) wy = Math.floor(m.pos.y + spec.h * 0.5);
      while (wy < H - 1 && w.isWater(fx, wy + 1, fz)) wy++;
      const target = wy + 0.875 - spec.sink;
      m.vel.y += (target - m.pos.y) * 12 * dt;
      m.vel.y *= Math.max(0, 1 - 5 * dt);
    } else {
      m.vel.y = Math.max(m.vel.y - GRAVITY * dt, -30);
    }

    const steps = Math.max(1, Math.ceil((Math.abs(m.vel.y) + Math.abs(m.vel.x) + Math.abs(m.vel.z)) * dt / 0.3));
    const h = dt / steps;
    for (let i = 0; i < steps; i++) {
      const wasGround = m.onGround;
      const bx = this.moveAxis(m, 'x', m.vel.x * h);
      const bz = this.moveAxis(m, 'z', m.vel.z * h);
      m.onGround = false;
      if (this.moveAxis(m, 'y', m.vel.y * h)) m.vel.y = 0;
      if ((bx || bz) && speed) {
        if ((wasGround || m.inWater) && this.canStepUp(m, dx, dz)) m.vel.y = m.inWater ? 6 : 7.5;
        else if (wasGround) m.heading += rand(Math.PI * 0.5, Math.PI * 1.5); // a wall: turn away
      }
    }
    // turn smoothly toward the heading
    let diff = m.heading - m.yaw;
    diff = Math.atan2(Math.sin(diff), Math.cos(diff));
    m.yaw += diff * Math.min(1, dt * (m.state === 'flee' ? 10 : 5));
    m.moving = speed > 0;
  }

  animate(m, dt) {
    const p = m.parts, spec = m.spec;
    m.swing += ((m.moving ? 1 : 0) - m.swing) * Math.min(1, dt * 8);
    m.phase += dt * spec.stride * (m.state === 'flee' ? 1.6 : 1);
    const s = Math.sin(m.phase) * spec.legSwing * m.swing;
    if (p.newt) {
      // newts scurry: legs paddle sideways and the body and tail wiggle
      p.legs.forEach((leg, i) => { leg.rotation.y = (i === 0 || i === 3 ? s : -s); });
      p.torso.rotation.y = Math.sin(m.phase * 0.5) * 0.25 * m.swing;
      p.tailSegments[0].rotation.y = -Math.sin(m.phase * 0.5) * 0.5 * (0.3 + m.swing);
      p.tailSegments[1].rotation.y = -Math.sin(m.phase * 0.5 - 1) * 0.6 * (0.3 + m.swing);
    } else if (p.legs.length === 2) {
      p.legs[0].rotation.x = s; p.legs[1].rotation.x = -s;
      // ducks waddle on land and bob on water
      p.torso.rotation.z = m.inWater ? Math.sin(m.phase * 0.3) * 0.05 : Math.sin(m.phase) * 0.12 * m.swing;
    } else {
      p.legs.forEach((leg, i) => { leg.rotation.x = (i === 0 || i === 3 ? s : -s); });
    }
    // grazing animals lower their heads to eat
    const tilt = m.state === 'graze' ? 0.95 : m.moving ? Math.sin(m.phase * 2) * 0.05 : 0;
    m.headTilt += (tilt - m.headTilt) * Math.min(1, dt * 4);
    if (p.head) p.head.rotation.x = m.headTilt;
    if (p.tail) p.tail.rotation.z = Math.sin(m.phase * 0.7 + 1) * 0.15;
    m.root.position.copy(m.pos);
    m.root.rotation.y = m.yaw;
  }

  // Same lighting as the blocks: max(daylight x sunlight, warm torch light, ambient).
  light(m, { day, flicker, ambient }, dt) {
    const w = this.world;
    const x = Math.floor(m.pos.x), y = Math.min(H - 1, Math.floor(m.pos.y + m.spec.h * 0.6)), z = Math.floor(m.pos.z);
    const sun = day * skyBrightness(w.skyAt(x, y, z));
    const t = lightBrightness(w.lightAt(x, y, z)) * flicker;
    let r = Math.max(sun, t, ambient), g = Math.max(sun, t * 0.86, ambient), b = Math.max(sun, t * 0.66, ambient);
    if (m.flash > 0) { // red flash when bumped
      m.flash -= dt;
      r = Math.max(r, 0.35); g *= 0.4; b *= 0.4;
    }
    m.material.color.setRGB(r, g, b);
  }

  // ---------- interaction ----------

  // Nearest animal hit by a ray: { mob, t } or null.
  raycast(o, d, maxDist) {
    let best = null;
    for (const m of this.mobs) {
      const hw = m.spec.w / 2;
      const min = [m.pos.x - hw, m.pos.y, m.pos.z - hw], max = [m.pos.x + hw, m.pos.y + m.spec.h, m.pos.z + hw];
      const oo = [o.x, o.y, o.z], dd = [d.x, d.y, d.z];
      let t0 = 0, t1 = maxDist, hit = true;
      for (let a = 0; a < 3 && hit; a++) {
        if (Math.abs(dd[a]) < 1e-9) {
          if (oo[a] < min[a] || oo[a] > max[a]) hit = false;
          continue;
        }
        let ta = (min[a] - oo[a]) / dd[a], tb = (max[a] - oo[a]) / dd[a];
        if (ta > tb) [ta, tb] = [tb, ta];
        t0 = Math.max(t0, ta); t1 = Math.min(t1, tb);
        if (t0 > t1) hit = false;
      }
      if (hit && (!best || t0 < best.t)) best = { mob: m, t: t0 };
    }
    return best;
  }

  // The player bumps an animal: it hops away and flees. Alpacas give wool (then need time to regrow it).
  // Returns items to give the player, as [[id, count], ...].
  hit(m, from) {
    let dx = m.pos.x - from.x, dz = m.pos.z - from.z;
    const len = Math.hypot(dx, dz) || 1;
    dx /= len; dz /= len;
    m.kx = dx * 6; m.kz = dz * 6;
    if (m.onGround || m.inWater) m.vel.y = 5;
    m.state = 'flee';
    m.timer = rand(3, 4.5);
    m.flash = 0.25;
    this.sound?.mob(m.kind, 1, true);
    if (m.spec.wool && m.shornFor <= 0) {
      m.shornFor = SHORN_SECONDS;
      m.parts.shear(true);
      return [[WOOL, Math.random() < 0.5 ? 2 : 1]];
    }
    return [];
  }
}
