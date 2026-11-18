// Bees: a few little striped bees buzz around each hive near you in the daytime, now and then darting
// off to visit a flower. They're only for show (they don't sting), and aren't saved; the honey and the
// flowers they spread are worked out by the world (see tickHive in world.js).
import * as THREE from 'three';

const PER_HIVE = 3;
const MAX_BEES = 24;
const RANGE = 24; // only hives this close to you have bees out

function beeGeometry() {
  const g = new THREE.BoxGeometry(0.14, 0.11, 0.18);
  const col = new Float32Array(24 * 3);
  const pos = g.attributes.position;
  for (let i = 0; i < 24; i++) {
    const z = pos.getZ(i);
    const stripe = Math.abs(z) < 0.03 || z < -0.08;
    const [r, gg, b] = stripe ? [0.08, 0.06, 0.04] : [0.96, 0.74, 0.12];
    col[i * 3] = r; col[i * 3 + 1] = gg; col[i * 3 + 2] = b;
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return g;
}

export class Bees {
  constructor(scene, sound) {
    this.scene = scene;
    this.sound = sound;
    this.geometry = beeGeometry();
    this.wingGeometry = new THREE.PlaneGeometry(0.12, 0.08);
    this.material = new THREE.MeshBasicMaterial({ vertexColors: true });
    this.wingMaterial = new THREE.MeshBasicMaterial({ color: 0xe8f4ff, transparent: true, opacity: 0.6, side: THREE.DoubleSide, depthWrite: false });
    this.bees = []; // { mesh, hive: [x, y, z], pos, target, t }
    this.timer = 0;
    this.buzzTimer = 2;
  }

  get count() { return this.bees.length; }

  // light: { day, flicker, ambient }; daylight: 0..1 (bees stay in at night and in the rain)
  update(dt, world, player, light, daylight) {
    this.timer -= dt;
    if (this.timer <= 0) {
      this.timer = 2;
      const out = daylight > 0.5 && !world.raining;
      const hives = out ? world.hiveList().filter(([x, y, z]) => Math.hypot(x + 0.5 - player.pos.x, y - player.pos.y, z + 0.5 - player.pos.z) < RANGE) : [];
      const keyOf = (h) => h.join(',');
      const wanted = new Set(hives.map(keyOf));
      // bees whose hive is gone, out of range or closed for the night fly home and vanish
      for (let i = this.bees.length - 1; i >= 0; i--) if (!wanted.has(keyOf(this.bees[i].hive))) this.drop(i);
      for (const h of hives) {
        let n = this.bees.filter((b) => keyOf(b.hive) === keyOf(h)).length;
        while (n < PER_HIVE && this.bees.length < MAX_BEES) { this.add(h); n++; }
      }
    }
    const tmp = new THREE.Vector3();
    for (const b of this.bees) {
      b.t -= dt;
      if (b.t <= 0 || b.pos.distanceTo(b.target) < 0.3) this.pickTarget(b, world);
      tmp.subVectors(b.target, b.pos);
      const d = tmp.length() || 1;
      tmp.multiplyScalar(Math.min(1, (2.2 * dt) / d));
      b.pos.add(tmp);
      b.phase += dt * 9;
      b.mesh.position.set(b.pos.x + Math.sin(b.phase) * 0.06, b.pos.y + Math.sin(b.phase * 1.7) * 0.08, b.pos.z + Math.cos(b.phase * 1.3) * 0.06);
      b.mesh.rotation.y = Math.atan2(b.target.x - b.pos.x, b.target.z - b.pos.z);
      b.wings.rotation.z = Math.sin(b.phase * 6) * 0.6;
    }
    const k = Math.max(light.day, light.ambient);
    this.material.color.setRGB(k, k, k);
    this.buzzTimer -= dt;
    if (this.buzzTimer <= 0) {
      this.buzzTimer = 1.5 + Math.random() * 2;
      let near = Infinity;
      for (const b of this.bees) near = Math.min(near, b.pos.distanceTo(player.pos));
      if (near < 8) this.sound?.mob('bee', 1 - near / 8);
    }
  }

  // Somewhere to fly next: around the hive, or now and then to a flower nearby.
  pickTarget(b, world) {
    const [hx, hy, hz] = b.hive;
    b.t = 2 + Math.random() * 4;
    if (Math.random() < 0.3) {
      for (let k = 0; k < 6; k++) {
        const x = hx + Math.round((Math.random() - 0.5) * 10), z = hz + Math.round((Math.random() - 0.5) * 10);
        for (let y = hy + 1; y > hy - 7; y--) {
          if (world.isFlowerAt?.(x, y, z)) { b.target.set(x + 0.5, y + 0.7, z + 0.5); return; }
        }
      }
    }
    b.target.set(hx + 0.5 + (Math.random() - 0.5) * 3, hy + 0.5 + (Math.random() - 0.5) * 2, hz + 0.5 + (Math.random() - 0.5) * 3);
  }

  add(hive) {
    const mesh = new THREE.Mesh(this.geometry, this.material);
    const wings = new THREE.Mesh(this.wingGeometry, this.wingMaterial);
    wings.position.set(0, 0.07, 0);
    wings.rotation.x = Math.PI / 2;
    mesh.add(wings);
    const pos = new THREE.Vector3(hive[0] + 0.5, hive[1] + 0.5, hive[2] + 0.5);
    const b = { mesh, wings, hive, pos, target: pos.clone(), t: 0, phase: Math.random() * 10 };
    this.scene.add(mesh);
    this.bees.push(b);
  }

  drop(i) {
    this.scene.remove(this.bees[i].mesh);
    this.bees.splice(i, 1);
  }

  clear() { for (let i = this.bees.length - 1; i >= 0; i--) this.drop(i); }
}
