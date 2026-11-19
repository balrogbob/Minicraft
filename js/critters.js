// Little night creatures that live around you rather than in the world: owls that perch in the treetops after
// dark and hoot, bats that flit about in caves (and out under the sky at dusk), and fireflies that blink over
// the grass on warm nights. None of them can be caught or harmed: they're there to make the world feel alive.
import * as THREE from 'three';
import { AIR, GRASS, BLOCKS, isLeaves, MAX_LIGHT } from './blocks.js';

const MAX_WORMS = 240;
const MAX_OWLS = 2, MAX_BATS = 5, MAX_FLIES = 48;
const rand = (a, b) => a + Math.random() * (b - a);

function owlMesh() {
  const g = new THREE.Group();
  const mats = [];
  const m = (c) => { const mt = new THREE.MeshBasicMaterial({ color: c }); mt.userData.base = new THREE.Color(c); mats.push(mt); return mt; };
  const brown = m(0x7a5a3a), pale = m(0xd8c8a8), eye = m(0xffc828), dark = m(0x221a12);
  const box = (w, h, d, mat, x, y, z, parent = g) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); b.position.set(x, y, z); parent.add(b); return b; };
  box(0.3, 0.38, 0.26, brown, 0, 0.19, 0); // body
  box(0.2, 0.26, 0.04, pale, 0, 0.18, 0.13); // breast
  const head = new THREE.Group(); head.position.set(0, 0.42, 0); g.add(head);
  box(0.28, 0.22, 0.24, brown, 0, 0, 0, head);
  box(0.22, 0.16, 0.03, pale, 0, -0.01, 0.12, head); // face disc
  for (const s of [-1, 1]) {
    box(0.06, 0.06, 0.02, eye, s * 0.055, 0.01, 0.135, head);
    box(0.025, 0.025, 0.01, dark, s * 0.055, 0.01, 0.146, head);
    box(0.05, 0.07, 0.04, brown, s * 0.1, 0.13, 0, head); // ear tufts
  }
  box(0.04, 0.05, 0.04, m(0x3a2e20), 0, -0.06, 0.14, head); // beak
  const wings = [-1, 1].map((s) => {
    const pivot = new THREE.Group(); pivot.position.set(s * 0.15, 0.3, 0); g.add(pivot);
    const w = box(0.04, 0.3, 0.22, brown, 0, -0.14, 0, pivot);
    return { pivot, w, s };
  });
  return { g, head, wings, mats };
}

function batMesh() {
  const g = new THREE.Group();
  const mat = new THREE.MeshBasicMaterial({ color: 0x2a2228 });
  mat.userData.base = new THREE.Color(0x2a2228);
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.16), mat); g.add(body);
  const wings = [-1, 1].map((s) => {
    const pivot = new THREE.Group(); pivot.position.x = s * 0.05; g.add(pivot);
    const w = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.015, 0.14), mat); w.position.x = s * 0.12; pivot.add(w);
    return { pivot, s };
  });
  for (const s of [-1, 1]) { const e = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.05, 0.02), mat); e.position.set(s * 0.03, 0.07, 0.06); g.add(e); }
  return { g, wings, mats: [mat] };
}

// a soft round glow for a firefly
function glowTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 32;
  const x = c.getContext('2d'), gr = x.createRadialGradient(16, 16, 0, 16, 16, 16);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.25, 'rgba(255,255,255,0.8)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = gr; x.fillRect(0, 0, 32, 32);
  return new THREE.CanvasTexture(c);
}

export class Critters {
  constructor(scene, sound) {
    this.scene = scene;
    this.sound = sound;
    this.owls = []; // { mesh, pos, perch, state: 'perch' | 'fly', t, hoot }
    this.bats = []; // { mesh, pos, vel, t }
    this.timer = 0;
    // fireflies: one Points cloud, each point wandering round its own spot
    this.flies = [];
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(MAX_FLIES * 3), 3));
    geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(MAX_FLIES * 3), 3));
    this.flyPoints = new THREE.Points(geo, new THREE.PointsMaterial({
      size: 0.35, map: glowTexture(), vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
    }));
    this.flyPoints.frustumCulled = false;
    scene.add(this.flyPoints);
    // glow-worms: specks of blue-green light on the roofs of caves
    this.worms = [];
    const wgeo = new THREE.BufferGeometry();
    wgeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(MAX_WORMS * 3), 3));
    wgeo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(MAX_WORMS * 3), 3));
    this.wormPoints = new THREE.Points(wgeo, new THREE.PointsMaterial({
      size: 0.16, map: this.flyPoints.material.map, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
    }));
    this.wormPoints.frustumCulled = false;
    scene.add(this.wormPoints);
  }

  clear() {
    for (const o of this.owls) this.scene.remove(o.mesh.g);
    for (const b of this.bats) this.scene.remove(b.mesh.g);
    this.owls = []; this.bats = []; this.flies = []; this.worms = [];
  }

  // A leafy treetop with open air above it near p (a place an owl would sit), or null.
  perch(world, p) {
    for (let tries = 0; tries < 30; tries++) {
      const x = Math.floor(p.x + rand(-26, 26)), z = Math.floor(p.z + rand(-26, 26));
      if (Math.hypot(x - p.x, z - p.z) < 8 || !world.chunkAt(x, z)) continue;
      for (let y = Math.floor(p.y) + 16; y > Math.floor(p.y) - 10; y--) {
        const id = world.get(x, y, z);
        if (id === AIR) continue;
        if (isLeaves(id) && world.get(x, y + 1, z) === AIR && world.get(x, y + 2, z) === AIR) return new THREE.Vector3(x + 0.5, y + 1, z + 0.5);
        break;
      }
    }
    return null;
  }

  // ctx: { night (0..1), dusk (bool), season (0..3), raining, light (0..1: how brightly lit things are) }
  update(dt, world, player, ctx) {
    const p = player.pos;
    const k = Math.max(0.35, ctx.light ?? 1);
    for (const c of [...this.owls, ...this.bats]) for (const mt of c.mesh.mats) mt.color.copy(mt.userData.base).multiplyScalar(k);
    const underground = world.skyAt(Math.floor(p.x), Math.floor(p.y + 1.5), Math.floor(p.z)) < 4;
    this.timer -= dt;
    if (this.timer <= 0) {
      this.timer = 2;
      // owls come out at night, over the trees
      if (ctx.night > 0.5 && !underground && this.owls.length < MAX_OWLS && Math.random() < 0.4) {
        const at = this.perch(world, p);
        if (at) {
          const mesh = owlMesh();
          const from = at.clone().add(new THREE.Vector3(rand(-12, 12), 10, rand(-12, 12)));
          mesh.g.position.copy(from);
          this.scene.add(mesh.g);
          this.owls.push({ mesh, pos: from, perch: at, state: 'fly', t: 0, hoot: rand(4, 14), leave: false });
        }
      }
      // bats: in the dark under ground, or out over the land at dusk
      if ((underground || ctx.dusk) && this.bats.length < MAX_BATS && Math.random() < 0.5) {
        for (let tries = 0; tries < 8; tries++) {
          const x = Math.floor(p.x + rand(-10, 10)), y = Math.floor(p.y + rand(0, 5)), z = Math.floor(p.z + rand(-10, 10));
          if (world.get(x, y, z) !== AIR || world.lightAt(x, y, z) > 9) continue;
          const mesh = batMesh();
          mesh.g.position.set(x + 0.5, y + 0.5, z + 0.5);
          this.scene.add(mesh.g);
          this.bats.push({ mesh, pos: mesh.g.position, vel: new THREE.Vector3(rand(-3, 3), 0, rand(-3, 3)), t: rand(20, 40), squeak: rand(1, 6) });
          break;
        }
      }
      // fireflies on spring and summer nights, out on the grass
      const warm = ctx.season <= 1 && ctx.night > 0.6 && !ctx.raining && !underground;
      if (warm) {
        for (let k = 0; k < 8 && this.flies.length < MAX_FLIES; k++) {
          const x = Math.floor(p.x + rand(-18, 18)), z = Math.floor(p.z + rand(-18, 18));
          for (let y = Math.floor(p.y) + 6; y > Math.floor(p.y) - 8; y--) {
            const id = world.get(x, y, z);
            if (id === AIR || BLOCKS[id]?.shape === 'cross') continue;
            if (id === GRASS && world.skyAt(x, y + 1, z) >= MAX_LIGHT) this.flies.push({ home: new THREE.Vector3(x + 0.5, y + 1.2 + Math.random() * 1.6, z + 0.5), ph: rand(0, 6.28), sp: rand(0.6, 1.4), life: rand(30, 90) });
            break;
          }
        }
      }
      if (!warm) for (const f of this.flies) f.life = Math.min(f.life, rand(0, 4));
      // glow-worms: clusters on the rock over your head when you're down in the dark
      if (underground) {
        for (let k = 0; k < 6 && this.worms.length < MAX_WORMS - 12; k++) {
          const x = Math.floor(p.x + rand(-14, 14)), z = Math.floor(p.z + rand(-14, 14));
          for (let y = Math.floor(p.y) + 1; y < Math.floor(p.y) + 12; y++) {
            const id = world.get(x, y, z);
            if (id === AIR) continue;
            if (BLOCKS[id]?.solid && world.skyAt(x, y - 1, z) === 0 && world.lightAt(x, y - 1, z) < 6) {
              for (let n = 0; n < 10; n++) this.worms.push({ pos: new THREE.Vector3(x + Math.random(), y - 0.04 - Math.random() * 0.25, z + Math.random()), ph: rand(0, 6.28), life: rand(40, 90) });
            }
            break;
          }
        }
      }
      for (const g of this.worms) if (!underground || g.pos.distanceTo(p) > 26) g.life = Math.min(g.life, rand(0, 3));
    }

    // owls fly in to a perch, sit and hoot, turn their heads to watch you, and fly off when you come close or day breaks
    for (let i = this.owls.length - 1; i >= 0; i--) {
      const o = this.owls[i], g = o.mesh.g;
      o.t += dt;
      const near = Math.hypot(p.x - o.pos.x, p.z - o.pos.z);
      if (o.state === 'perch') {
        if (near < 5 || ctx.night < 0.4 || world.get(Math.floor(o.perch.x), Math.floor(o.perch.y) - 1, Math.floor(o.perch.z)) === AIR || near > 60) {
          o.state = 'fly'; o.leave = true; o.t = 0;
          o.perch = o.pos.clone().add(new THREE.Vector3(rand(-30, 30), 18, rand(-30, 30)));
        } else {
          // watch the player
          const yaw = Math.atan2(p.x - o.pos.x, p.z - o.pos.z) - g.rotation.y;
          o.mesh.head.rotation.y += (Math.atan2(Math.sin(yaw), Math.cos(yaw)) * 0.9 - o.mesh.head.rotation.y) * Math.min(1, dt * 3);
          for (const w of o.mesh.wings) w.pivot.rotation.z = 0;
          if ((o.hoot -= dt) <= 0) { o.hoot = rand(8, 20); if (near < 40) this.sound?.mob('owl', 1 - near / 40); }
        }
      }
      if (o.state === 'fly') {
        const to = o.perch.clone().sub(o.pos), d = to.length();
        o.pos.addScaledVector(to.normalize(), Math.min(d, dt * 5));
        g.rotation.y = Math.atan2(to.x, to.z);
        for (const w of o.mesh.wings) w.pivot.rotation.z = w.s * (0.6 + Math.sin(o.t * 14) * 0.9);
        if (d < 0.1) {
          if (o.leave) { this.scene.remove(g); this.owls.splice(i, 1); continue; }
          o.state = 'perch';
          g.rotation.y = Math.atan2(p.x - o.pos.x, p.z - o.pos.z);
        }
      }
      g.position.copy(o.pos);
    }

    // bats: erratic, fluttering flight, turning away from walls
    for (let i = this.bats.length - 1; i >= 0; i--) {
      const b = this.bats[i];
      b.t -= dt;
      if (b.t <= 0 || b.pos.distanceTo(p) > 30 || (!underground && !ctx.dusk && b.t < 15)) { this.scene.remove(b.mesh.g); this.bats.splice(i, 1); continue; }
      b.vel.x += rand(-14, 14) * dt; b.vel.y += rand(-10, 10) * dt; b.vel.z += rand(-14, 14) * dt;
      // stay loosely around the player
      const back = p.clone().add(new THREE.Vector3(0, 2.5, 0)).sub(b.pos);
      if (back.length() > 8) b.vel.addScaledVector(back.normalize(), dt * 6);
      if (b.vel.length() > 5) b.vel.setLength(5);
      const next = b.pos.clone().addScaledVector(b.vel, dt);
      if (world.isSolid(Math.floor(next.x), Math.floor(next.y), Math.floor(next.z))) b.vel.multiplyScalar(-0.8);
      else b.pos.copy(next);
      b.mesh.g.rotation.y = Math.atan2(b.vel.x, b.vel.z);
      for (const w of b.mesh.wings) w.pivot.rotation.z = w.s * Math.sin(performance.now() / 30) * 1.1;
      if ((b.squeak -= dt) <= 0) { b.squeak = rand(3, 9); const d = b.pos.distanceTo(p); if (d < 14) this.sound?.mob('bat', 1 - d / 14); }
    }

    // fireflies: drift round their spot and blink
    const pos = this.flyPoints.geometry.attributes.position, col = this.flyPoints.geometry.attributes.color;
    const time = performance.now() / 1000;
    for (let i = this.flies.length - 1; i >= 0; i--) if ((this.flies[i].life -= dt) <= 0) this.flies.splice(i, 1);
    for (let i = 0; i < MAX_FLIES; i++) {
      const f = this.flies[i];
      if (!f) { pos.setXYZ(i, 0, -1000, 0); col.setXYZ(i, 0, 0, 0); continue; }
      const t = time * f.sp + f.ph;
      pos.setXYZ(i, f.home.x + Math.sin(t * 0.7) * 1.2, f.home.y + Math.sin(t * 1.3) * 0.4, f.home.z + Math.cos(t * 0.5) * 1.2);
      const blink = Math.max(0, Math.sin(t * 2.2)) ** 3 * Math.min(1, f.life / 3);
      col.setXYZ(i, 0.8 * blink, 1.0 * blink, 0.3 * blink);
    }
    pos.needsUpdate = true; col.needsUpdate = true;
    // glow-worms: a slow shimmer
    const wpos = this.wormPoints.geometry.attributes.position, wcol = this.wormPoints.geometry.attributes.color;
    for (let i = this.worms.length - 1; i >= 0; i--) if ((this.worms[i].life -= dt) <= 0) this.worms.splice(i, 1);
    for (let i = 0; i < MAX_WORMS; i++) {
      const g = this.worms[i];
      if (!g) { wpos.setXYZ(i, 0, -1000, 0); wcol.setXYZ(i, 0, 0, 0); continue; }
      wpos.setXYZ(i, g.pos.x, g.pos.y, g.pos.z);
      const b = (0.55 + 0.45 * Math.sin(time * 0.8 + g.ph)) * Math.min(1, g.life / 3);
      wcol.setXYZ(i, 0.25 * b, 0.85 * b, 1.0 * b);
    }
    wpos.needsUpdate = true; wcol.needsUpdate = true;
  }
}
