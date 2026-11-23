// (v44) Life in the sea that lives around you rather than in the world, like the owls and fireflies: schools of
// little fish that dart about the reefs and kelp and scatter when you swim at them, jellyfish drifting in open
// water (glowing at night: don't touch, they sting), sea turtles paddling over warm shallows, and dolphins that
// leap out of the deep ocean beside you. None of them can be caught or hurt.
import * as THREE from 'three';
import { isWaterId, isWetId, CORAL, CORAL_FAN } from './blocks.js';
import { SEA_LEVEL } from './terrain.js';

const MAX_SCHOOLS = 5, MAX_JELLIES = 6, MAX_TURTLES = 2, MAX_DOLPHINS = 3;
const REACH = 36; // creatures further than this from you swim off (are removed)
const rand = (a, b) => a + Math.random() * (b - a);
const FISH_COLOURS = [[0xff8a20, 0xffffff], [0x3070e0, 0xffe040], [0xf0d020, 0x202020], [0xe04070, 0xffd0e0], [0x30c0b0, 0x105060]];
const PLAIN_FISH = [0xa8b4bc, 0x70808c];

function matOf(c, glow = false, opacity = 1) {
  const m = new THREE.MeshBasicMaterial({ color: c, transparent: opacity < 1, opacity, depthWrite: opacity >= 1 });
  m.userData.base = new THREE.Color(c); m.userData.glow = glow;
  return m;
}
const box = (g, w, h, d, mat, x, y, z) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); b.position.set(x, y, z); g.add(b); return b; };

function fishMesh(cols, size, mats) {
  const g = new THREE.Group();
  const body = mats[0], stripe = mats[1];
  box(g, 0.07 * size, 0.12 * size, 0.24 * size, body, 0, 0, 0);
  box(g, 0.075 * size, 0.125 * size, 0.04 * size, stripe, 0, 0, 0.03 * size);
  const tail = new THREE.Group(); tail.position.z = -0.12 * size; g.add(tail);
  box(tail, 0.02 * size, 0.12 * size, 0.08 * size, body, 0, 0, -0.04 * size);
  return { g, tail };
}

function jellyMesh() {
  const g = new THREE.Group();
  const hue = [0xc080ff, 0x80c8ff, 0xff90c0][Math.floor(Math.random() * 3)];
  const bell = matOf(hue, true, 0.55), inner = matOf(0xffffff, true, 0.5), tent = matOf(hue, true, 0.4);
  const top = box(g, 0.5, 0.26, 0.5, bell, 0, 0.1, 0);
  box(g, 0.36, 0.08, 0.36, bell, 0, 0.27, 0);
  box(g, 0.2, 0.1, 0.2, inner, 0, 0.06, 0);
  const tentacles = [];
  for (const [x, z] of [[-0.16, -0.16], [0.16, -0.16], [-0.16, 0.16], [0.16, 0.16], [0, 0]]) {
    const t = box(g, 0.03, 0.6, 0.03, tent, x, -0.32, z);
    tentacles.push(t);
  }
  return { g, top, tentacles, mats: [bell, inner, tent] };
}

function turtleMesh() {
  const g = new THREE.Group();
  const shell = matOf(0x5a6a30), rim = matOf(0x7a8a48), skin = matOf(0x8aa070), dark = matOf(0x1a1a14);
  box(g, 0.7, 0.18, 0.8, shell, 0, 0.08, 0);
  box(g, 0.5, 0.1, 0.6, rim, 0, 0.2, 0);
  box(g, 0.76, 0.06, 0.86, rim, 0, -0.02, 0);
  const head = new THREE.Group(); head.position.set(0, 0.05, 0.45); g.add(head);
  box(head, 0.2, 0.16, 0.24, skin, 0, 0, 0.08);
  for (const s of [-1, 1]) box(head, 0.03, 0.04, 0.04, dark, s * 0.09, 0.03, 0.14);
  const flippers = [[-1, 0.25], [1, 0.25], [-1, -0.28], [1, -0.28]].map(([s, z]) => {
    const pivot = new THREE.Group(); pivot.position.set(s * 0.36, 0, z); g.add(pivot);
    box(pivot, z > 0 ? 0.4 : 0.22, 0.04, z > 0 ? 0.16 : 0.14, skin, s * (z > 0 ? 0.2 : 0.11), 0, 0);
    return { pivot, s, front: z > 0 };
  });
  return { g, head, flippers, mats: [shell, rim, skin, dark] };
}

function dolphinMesh() {
  const g = new THREE.Group();
  const grey = matOf(0x6a7c8c), belly = matOf(0xc8d0d8), dark = matOf(0x14181c);
  box(g, 0.44, 0.46, 1.4, grey, 0, 0, 0);
  box(g, 0.36, 0.14, 1.1, belly, 0, -0.2, 0.05);
  box(g, 0.34, 0.36, 0.3, grey, 0, 0, 0.82); // head
  box(g, 0.16, 0.12, 0.3, grey, 0, -0.08, 1.1); // beak
  for (const s of [-1, 1]) box(g, 0.02, 0.05, 0.05, dark, s * 0.17, 0.04, 0.9);
  box(g, 0.06, 0.3, 0.3, grey, 0, 0.36, -0.05); // dorsal fin
  for (const s of [-1, 1]) box(g, 0.34, 0.04, 0.2, grey, s * 0.32, -0.16, 0.35); // flippers
  const tail = new THREE.Group(); tail.position.z = -0.7; g.add(tail);
  box(tail, 0.24, 0.24, 0.5, grey, 0, 0, -0.22);
  box(tail, 0.8, 0.05, 0.24, grey, 0, 0, -0.5);
  return { g, tail, mats: [grey, belly, dark] };
}

export class SeaLife {
  constructor(scene, sound) {
    this.scene = scene;
    this.sound = sound;
    this.schools = []; // { fish: [{ mesh, off, ph }], centre, vel, t, mats }
    this.jellies = []; // { mesh, pos, ph, t }
    this.turtles = []; // { mesh, pos, vel, t }
    this.dolphins = []; // { mesh, pos, vel, t, leap }
    this.timer = 0;
    this.onSting = null; // called when you swim into a jellyfish
    this.stingWait = 0;
  }

  clear() {
    for (const s of this.schools) for (const f of s.fish) this.scene.remove(f.mesh.g);
    for (const c of [...this.jellies, ...this.turtles, ...this.dolphins]) this.scene.remove(c.mesh.g);
    this.schools = []; this.jellies = []; this.turtles = []; this.dolphins = [];
  }

  get count() { return this.schools.length + this.jellies.length + this.turtles.length + this.dolphins.length; }

  // A random spot of open sea near p: { x, z, floor (the top of the sea bed), depth, reef, warm } or null.
  seaSpot(world, p, near, far) {
    const a = Math.random() * Math.PI * 2, r = rand(near, far);
    const x = Math.floor(p.x + Math.cos(a) * r), z = Math.floor(p.z + Math.sin(a) * r);
    if (!world.chunkAt(x, z) || !isWaterId(world.waterAt(x, SEA_LEVEL, z))) return null;
    let y = SEA_LEVEL, reef = false;
    for (; y > 0; y--) {
      const id = world.get(x, y, z);
      if (id >= CORAL && id < CORAL_FAN + 4) reef = true;
      if (!isWaterId(id) && !isWetId(id)) break;
    }
    return { x, z, floor: y, depth: SEA_LEVEL - y, reef };
  }

  // Is (x, y, z) a cell of water you could swim in?
  wet(world, x, y, z) { return isWaterId(world.waterAt(Math.floor(x), Math.floor(y), Math.floor(z))); }

  // ctx: { light (0..1), night (0..1), warm (is the sea here warm), swimming, near (is there sea nearby) }
  update(dt, world, player, ctx) {
    const p = player.pos;
    const time = performance.now() / 1000;
    this.timer -= dt;
    this.stingWait = Math.max(0, this.stingWait - dt);
    const nearSea = Math.abs(p.y - SEA_LEVEL) < 40;
    if (this.timer <= 0 && nearSea) {
      this.timer = 1.5;
      // fish: over reefs and anywhere in the shallows; most of all around you when you're in the water
      if (this.schools.length < MAX_SCHOOLS && Math.random() < (ctx.swimming ? 0.7 : 0.25)) {
        const s = this.seaSpot(world, p, 6, 24);
        if (s && s.depth >= 3) this.addSchool(s, ctx);
      }
      // jellyfish: in open water a little way out, more of them at night
      if (this.jellies.length < MAX_JELLIES && Math.random() < 0.15 + ctx.night * 0.3) {
        const s = this.seaSpot(world, p, 8, 28);
        if (s && s.depth >= 7) {
          const mesh = jellyMesh();
          const pos = new THREE.Vector3(s.x + 0.5, rand(s.floor + 3, SEA_LEVEL - 1), s.z + 0.5);
          mesh.g.position.copy(pos); this.scene.add(mesh.g);
          this.jellies.push({ mesh, pos, ph: rand(0, 6.28), t: rand(40, 90), drift: new THREE.Vector3(rand(-0.2, 0.2), 0, rand(-0.2, 0.2)) });
        }
      }
      // turtles: warm, shallow seas
      if (ctx.warm && this.turtles.length < MAX_TURTLES && Math.random() < 0.12) {
        const s = this.seaSpot(world, p, 8, 26);
        if (s && s.depth >= 3 && s.depth <= 16) {
          const mesh = turtleMesh();
          const pos = new THREE.Vector3(s.x + 0.5, rand(s.floor + 1.5, SEA_LEVEL - 0.8), s.z + 0.5);
          mesh.g.position.copy(pos); this.scene.add(mesh.g);
          const a = rand(0, 6.28);
          this.turtles.push({ mesh, pos, vel: new THREE.Vector3(Math.cos(a), 0, Math.sin(a)).multiplyScalar(0.9), t: rand(40, 80), ph: rand(0, 6.28) });
        }
      }
      // dolphins: out over the deep ocean, swimming along beside you near the surface
      if (this.dolphins.length < MAX_DOLPHINS && Math.random() < 0.2 && Math.abs(p.y - SEA_LEVEL) < 12) {
        const s = this.seaSpot(world, p, 12, 30);
        if (s && s.depth >= 18) {
          const pod = 1 + Math.floor(Math.random() * Math.min(3, MAX_DOLPHINS - this.dolphins.length));
          const a = rand(0, 6.28), dir = new THREE.Vector3(Math.cos(a), 0, Math.sin(a));
          for (let k = 0; k < pod; k++) {
            const mesh = dolphinMesh();
            const pos = new THREE.Vector3(s.x + rand(-2, 2), SEA_LEVEL - 1.2, s.z + rand(-2, 2));
            mesh.g.position.copy(pos); this.scene.add(mesh.g);
            this.dolphins.push({ mesh, pos, vel: dir.clone().multiplyScalar(5), t: rand(30, 60), leap: rand(2, 6), vy: 0, air: false });
          }
        }
      }
    }
    const k = Math.max(0.3, ctx.light ?? 1);
    const tint = (mats, glow) => { for (const mt of mats) mt.color.copy(mt.userData.base).multiplyScalar(mt.userData.glow ? Math.max(k, glow) : k); };

    // fish: each school wanders through the water, its fish weaving round the middle; they dart away from you
    for (let i = this.schools.length - 1; i >= 0; i--) {
      const s = this.schools[i];
      s.t -= dt;
      const d = s.centre.distanceTo(p);
      if (s.t <= 0 || d > REACH) { for (const f of s.fish) this.scene.remove(f.mesh.g); this.schools.splice(i, 1); continue; }
      tint(s.mats, 0);
      s.vel.x += rand(-1.5, 1.5) * dt; s.vel.z += rand(-1.5, 1.5) * dt; s.vel.y += rand(-0.6, 0.6) * dt;
      if (d < 3.5) s.vel.add(s.centre.clone().sub(p).setY(0).normalize().multiplyScalar(dt * 18)); // scatter!
      const max = d < 3.5 ? 5 : 1.6;
      if (s.vel.length() > max) s.vel.setLength(max); else if (d >= 3.5 && s.vel.length() > 1.6) s.vel.multiplyScalar(1 - dt);
      const next = s.centre.clone().addScaledVector(s.vel, dt);
      if (this.wet(world, next.x, next.y, next.z) && this.wet(world, next.x, next.y + 0.6, next.z) && !world.isSolid(Math.floor(next.x), Math.floor(next.y - 0.5), Math.floor(next.z))) s.centre.copy(next);
      else s.vel.multiplyScalar(-1);
      const spread = d < 3.5 ? 1.8 : 1;
      for (const f of s.fish) {
        const t = time * f.sp + f.ph;
        f.mesh.g.position.set(s.centre.x + (f.off.x + Math.sin(t) * 0.3) * spread, s.centre.y + f.off.y + Math.sin(t * 1.3) * 0.12, s.centre.z + (f.off.z + Math.cos(t * 0.8) * 0.3) * spread);
        f.mesh.g.rotation.y = Math.atan2(s.vel.x, s.vel.z) + Math.sin(t * 2) * 0.25;
        f.mesh.tail.rotation.y = Math.sin(time * (d < 3.5 ? 30 : 14) + f.ph) * 0.6;
      }
    }

    // jellyfish: pulse, rising a little with each pulse and sinking slowly between; glow in the dark
    for (let i = this.jellies.length - 1; i >= 0; i--) {
      const j = this.jellies[i];
      j.t -= dt;
      if (j.t <= 0 || j.pos.distanceTo(p) > REACH) { this.scene.remove(j.mesh.g); this.jellies.splice(i, 1); continue; }
      tint(j.mesh.mats, 0.6 + ctx.night * 0.4);
      const ph = time * 1.4 + j.ph, pulse = Math.max(0, Math.sin(ph));
      const next = j.pos.clone().addScaledVector(j.drift, dt);
      next.y += (pulse * 0.5 - 0.18) * dt;
      if (this.wet(world, next.x, next.y + 0.4, next.z) && this.wet(world, next.x, next.y - 0.7, next.z)) j.pos.copy(next);
      else { j.drift.multiplyScalar(-1); j.pos.y -= 0.1 * dt; }
      j.mesh.g.position.copy(j.pos);
      j.mesh.top.scale.set(1 - pulse * 0.2, 1 + pulse * 0.15, 1 - pulse * 0.2);
      j.mesh.tentacles.forEach((t, n) => { t.rotation.x = Math.sin(ph * 0.7 + n) * 0.25; t.rotation.z = Math.cos(ph * 0.6 + n) * 0.25; });
      // touching one stings
      const dx = p.x - j.pos.x, dz = p.z - j.pos.z, dy = j.pos.y - (p.y + 0.9);
      if (!this.stingWait && Math.hypot(dx, dz) < 0.7 && Math.abs(dy) < 1.2) { this.stingWait = 1.5; this.onSting?.(j.pos); }
    }

    // turtles: paddle slowly along, turning aside from the reef and the shore
    for (let i = this.turtles.length - 1; i >= 0; i--) {
      const t = this.turtles[i];
      t.t -= dt;
      if (t.t <= 0 || t.pos.distanceTo(p) > REACH) { this.scene.remove(t.mesh.g); this.turtles.splice(i, 1); continue; }
      tint(t.mesh.mats, 0);
      t.vel.applyAxisAngle(THREE.Object3D.DEFAULT_UP, rand(-0.6, 0.6) * dt);
      const next = t.pos.clone().addScaledVector(t.vel, dt);
      next.y += Math.sin(time * 0.5 + t.ph) * 0.15 * dt;
      if (this.wet(world, next.x + t.vel.x * 0.8, next.y, next.z + t.vel.z * 0.8) && this.wet(world, next.x, next.y - 0.4, next.z) && this.wet(world, next.x, next.y + 0.4, next.z)) t.pos.copy(next);
      else t.vel.applyAxisAngle(THREE.Object3D.DEFAULT_UP, Math.PI * rand(0.5, 1));
      t.mesh.g.position.copy(t.pos);
      t.mesh.g.rotation.y = Math.atan2(t.vel.x, t.vel.z);
      for (const f of t.mesh.flippers) f.pivot.rotation.z = f.s * Math.sin(time * 2.2 + t.ph + (f.front ? 0 : 1.2)) * (f.front ? 0.55 : 0.3);
      t.mesh.head.rotation.y = Math.sin(time * 0.4 + t.ph) * 0.3;
    }

    // dolphins: swim fast just under the surface, now and then leaping clear of the water in an arc
    for (let i = this.dolphins.length - 1; i >= 0; i--) {
      const dn = this.dolphins[i];
      dn.t -= dt;
      const dist = dn.pos.distanceTo(p);
      if ((dn.t <= 0 && !dn.air) || dist > REACH + 10) { this.scene.remove(dn.mesh.g); this.dolphins.splice(i, 1); continue; }
      tint(dn.mesh.mats, 0);
      if (!dn.air) {
        // keep loosely alongside you
        const toP = p.clone().sub(dn.pos).setY(0);
        if (toP.length() > 16) dn.vel.addScaledVector(toP.normalize(), dt * 2);
        dn.vel.applyAxisAngle(THREE.Object3D.DEFAULT_UP, rand(-0.3, 0.3) * dt);
        dn.vel.setY(0).setLength(5);
        const ahead = dn.pos.clone().addScaledVector(dn.vel, 0.6);
        if (!this.wet(world, ahead.x, SEA_LEVEL - 2, ahead.z)) dn.vel.multiplyScalar(-1); // (turn back from the shallows)
        dn.pos.addScaledVector(dn.vel, dt);
        dn.pos.y += (SEA_LEVEL - 1.2 + Math.sin(time * 2 + i) * 0.25 - dn.pos.y) * Math.min(1, dt * 2);
        if ((dn.leap -= dt) <= 0) { dn.air = true; dn.vy = 7; dn.leap = rand(3, 8); if (dist < 30) { this.sound?.splash(false); this.sound?.mob('dolphin', 1 - dist / 30); } }
      } else {
        dn.vy -= 14 * dt;
        dn.pos.addScaledVector(dn.vel, dt);
        dn.pos.y += dn.vy * dt;
        if (dn.vy < 0 && dn.pos.y < SEA_LEVEL - 1.2) { dn.air = false; dn.vy = 0; if (dist < 30) this.sound?.splash(dist < 12); }
      }
      dn.mesh.g.position.copy(dn.pos);
      dn.mesh.g.rotation.order = 'YXZ';
      dn.mesh.g.rotation.y = Math.atan2(dn.vel.x, dn.vel.z);
      dn.mesh.g.rotation.x = dn.air ? -Math.atan2(dn.vy, 5) : 0;
      dn.mesh.tail.rotation.x = Math.sin(time * 8 + i) * 0.3;
    }
  }

  addSchool(s, ctx) {
    const reefy = s.reef || (ctx.warm && Math.random() < 0.6);
    const [c1, c2] = reefy ? FISH_COLOURS[Math.floor(Math.random() * FISH_COLOURS.length)] : PLAIN_FISH;
    const mats = [matOf(c1), matOf(c2)];
    const size = reefy ? rand(1.1, 1.5) : rand(1.2, 1.7);
    const centre = new THREE.Vector3(s.x + 0.5, rand(s.floor + 1.5, Math.max(s.floor + 1.6, SEA_LEVEL - 1)), s.z + 0.5);
    const fish = [];
    for (let n = 0, count = 5 + Math.floor(Math.random() * 6); n < count; n++) {
      const mesh = fishMesh([c1, c2], size, mats);
      this.scene.add(mesh.g);
      fish.push({ mesh, off: new THREE.Vector3(rand(-0.8, 0.8), rand(-0.4, 0.4), rand(-0.8, 0.8)), ph: rand(0, 6.28), sp: rand(1.5, 2.5) });
    }
    const a = rand(0, 6.28);
    this.schools.push({ fish, centre, vel: new THREE.Vector3(Math.cos(a), 0, Math.sin(a)), t: rand(40, 80), mats });
  }
}
