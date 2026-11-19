// Crows: in the daytime they come down on ripe wheat out under the open sky and eat it back to green shoots,
// unless a scarecrow stands within SCARE_REACH blocks of it. Walk up to one and it flies off.
import * as THREE from 'three';
import { WHEAT_3, BLOCKS, MAX_LIGHT } from './blocks.js';


export const SCARE_REACH = 8;
const SPEED = 7, PECK_TIME = 5, MAX_CROWS = 3;

function crowMesh() {
  const g = new THREE.Group();
  const black = new THREE.MeshBasicMaterial({ color: 0x18181e }), beak = new THREE.MeshBasicMaterial({ color: 0x4a4038 });
  const box = (w, h, d, m, x, y, z) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); g.add(b); return b; };
  box(0.18, 0.16, 0.34, black, 0, 0.14, 0); // body
  box(0.14, 0.14, 0.14, black, 0, 0.24, 0.2); // head
  box(0.05, 0.04, 0.1, beak, 0, 0.23, 0.31); // beak
  box(0.12, 0.03, 0.14, black, 0, 0.12, -0.22); // tail
  const wings = [-1, 1].map((s) => {
    const pivot = new THREE.Group();
    pivot.position.set(s * 0.09, 0.2, 0);
    const w = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.02, 0.22), black);
    w.position.x = s * 0.15;
    pivot.add(w); g.add(pivot);
    return { pivot, s };
  });
  return { g, wings, head: g.children[1] };
}

export class Crows {
  constructor(scene) {
    this.scene = scene;
    this.list = []; // { mesh, pos, target: [x, y, z], state: 'in' | 'peck' | 'out', t, dir }
    this.timer = 10;
  }

  clear() { for (const c of this.list) this.scene.remove(c.mesh.g); this.list = []; }

  // Is there a scarecrow near (x, y, z)?
  scared(world, x, y, z) {
    for (let dy = -3; dy <= 3; dy++) for (let dz = -SCARE_REACH; dz <= SCARE_REACH; dz++) for (let dx = -SCARE_REACH; dx <= SCARE_REACH; dx++) {
      if (BLOCKS[world.get(x + dx, y + dy, z + dz)]?.scarecrow) return true;
    }
    return false;
  }

  // Look for ripe wheat under the open sky near p that no scarecrow guards.
  findCrop(world, p) {
    for (let tries = 0; tries < 80; tries++) {
      const x = Math.floor(p.x + (Math.random() - 0.5) * 40), z = Math.floor(p.z + (Math.random() - 0.5) * 40);
      for (let y = Math.floor(p.y) + 8; y >= Math.floor(p.y) - 8; y--) {
        if (world.get(x, y, z) !== WHEAT_3) continue;
        if (world.skyAt(x, y + 1, z) < MAX_LIGHT || this.list.some((c) => c.target[0] === x && c.target[1] === y && c.target[2] === z)) break;
        if (this.scared(world, x, y, z)) break;
        return [x, y, z];
      }
    }
    return null;
  }

  // hooks: { day (0..1), eat(x, y, z), caw(pos) }
  update(dt, world, player, hooks) {
    this.timer -= dt;
    if (this.timer <= 0) {
      this.timer = 15 + Math.random() * 20;
      if (hooks.day > 0.5 && this.list.length < MAX_CROWS) {
        const t = this.findCrop(world, player);
        if (t) this.spawn(t);
      }
    }
    for (const c of [...this.list]) this.step(c, dt, world, player, hooks);
  }

  spawn([x, y, z]) {
    const a = Math.random() * Math.PI * 2;
    const mesh = crowMesh();
    const pos = new THREE.Vector3(x + 0.5 + Math.cos(a) * 26, y + 16, z + 0.5 + Math.sin(a) * 26);
    mesh.g.position.copy(pos);
    this.scene.add(mesh.g);
    this.list.push({ mesh, pos, target: [x, y, z], state: 'in', t: 0, dir: new THREE.Vector3() });
  }

  step(c, dt, world, player, hooks) {
    c.t += dt;
    const [x, y, z] = c.target;
    const near = c.pos.distanceTo(player) < 5; // (player is where you are)
    if (c.state !== 'out' && (near || world.get(x, y, z) !== WHEAT_3 || hooks.day < 0.3)) this.flee(c, hooks);
    if (c.state === 'in') {
      const goal = new THREE.Vector3(x + 0.5, y + 0.75, z + 0.5);
      const d = goal.clone().sub(c.pos), len = d.length();
      if (len < 0.15) { c.state = 'peck'; c.t = 0; c.pos.copy(goal); if (Math.random() < 0.6) hooks.caw?.(c.pos); }
      else { c.dir.copy(d).normalize(); c.pos.addScaledVector(c.dir, Math.min(len, SPEED * dt * Math.min(1, len / 3 + 0.3))); }
    } else if (c.state === 'peck') {
      c.mesh.head.position.y = 0.24 - (Math.sin(c.t * 9) > 0.3 ? 0.08 : 0);
      if (c.t > PECK_TIME) { hooks.eat(x, y, z); this.flee(c, hooks, true); }
    } else {
      c.pos.addScaledVector(c.dir, SPEED * 1.3 * dt);
      if (c.t > 8) { this.scene.remove(c.mesh.g); this.list.splice(this.list.indexOf(c), 1); return; }
    }
    // flap (folded while pecking), and face the way it's going
    const flap = c.state === 'peck' ? 0.1 : Math.sin(c.t * 18) * 0.8;
    for (const w of c.mesh.wings) w.pivot.rotation.z = w.s * flap;
    c.mesh.g.position.copy(c.pos);
    if (c.state !== 'peck') c.mesh.g.rotation.y = Math.atan2(c.dir.x, c.dir.z);
  }

  flee(c, hooks, ate = false) {
    if (c.state === 'out') return;
    if (!ate && c.state === 'peck') hooks.caw?.(c.pos);
    c.state = 'out'; c.t = 0;
    const a = Math.random() * Math.PI * 2;
    c.dir.set(Math.cos(a), 0.6, Math.sin(a)).normalize();
  }
}
