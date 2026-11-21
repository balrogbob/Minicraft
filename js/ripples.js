// v38: rings spreading on the water around things that swim or float (ducks, newts, boats, you), wakes behind
// boats, and splashes of spray when something drops in (or a duck has a wash).
//
// Rings are one instanced mesh of soft ring sprites lying flat on the surface, drawn after the water (and
// added on, so they read as glints on any water colour). Spray is a pool of points thrown up that fall back.

import * as THREE from 'three';
import { LATE_LAYER } from './graphics.js';

const MAX_RINGS = 160;
const MAX_DROPS = 400;
const GRAVITY = 14;

function ringTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, 'rgba(255,255,255,0)');
  grad.addColorStop(0.6, 'rgba(255,255,255,0)');
  grad.addColorStop(0.8, 'rgba(255,255,255,1)');
  grad.addColorStop(0.9, 'rgba(255,255,255,0.45)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function dropTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 16;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(8, 8, 0, 8, 8, 8);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.5, 'rgba(255,255,255,0.8)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 16, 16);
  return new THREE.CanvasTexture(c);
}

export class Ripples {
  constructor(scene) {
    this.scene = scene;
    const geo = new THREE.PlaneGeometry(1, 1);
    geo.rotateX(-Math.PI / 2);
    const mat = new THREE.MeshBasicMaterial({
      map: ringTexture(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false,
      polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
    });
    this.mesh = new THREE.InstancedMesh(geo, mat, MAX_RINGS);
    this.mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(MAX_RINGS * 3), 3);
    this.mesh.count = 0;
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 5;
    this.mesh.layers.set(LATE_LAYER);
    this.mesh.userData.noShadow = true;
    scene.add(this.mesh);
    this.rings = []; // { x, y, z, age, life, r0, r1, sx, k }

    const dg = new THREE.BufferGeometry();
    this.dropPos = new Float32Array(MAX_DROPS * 3);
    dg.setAttribute('position', new THREE.BufferAttribute(this.dropPos, 3));
    dg.setDrawRange(0, 0);
    this.points = new THREE.Points(dg, new THREE.PointsMaterial({
      map: dropTexture(), color: 0xe4f3ff, size: 0.22, sizeAttenuation: true, transparent: true, depthWrite: false, opacity: 0.85,
    }));
    this.points.frustumCulled = false;
    this.points.renderOrder = 6;
    this.points.layers.set(LATE_LAYER);
    this.points.userData.noShadow = true;
    scene.add(this.points);
    this.drops = []; // { x, y, z, vx, vy, vz, floor }
    this.m4 = new THREE.Matrix4();
    this.q = new THREE.Quaternion();
    this.v = new THREE.Vector3();
    this.s = new THREE.Vector3();
  }

  // One ring at (x, y, z) on the surface y. size: how far it spreads; k: how bright (0..1); stretch: >1 makes
  // it longer along yaw (for a boat's wake).
  ring(x, y, z, size = 1, k = 0.5, life = 1.6, stretch = 1, yaw = 0) {
    if (this.rings.length >= MAX_RINGS) this.rings.shift();
    this.rings.push({ x, y: y + 0.012, z, age: 0, life, r0: 0.15 * size, r1: 1.3 * size, k, stretch, yaw });
  }

  // Spray thrown up from (x, y, z): n drops, power how high they go.
  splash(x, y, z, n = 14, power = 1) {
    for (let i = 0; i < n; i++) {
      if (this.drops.length >= MAX_DROPS) this.drops.shift();
      const a = Math.random() * Math.PI * 2, out = (0.6 + Math.random() * 1.6) * power;
      this.drops.push({ x: x + Math.cos(a) * 0.15, y: y + 0.05, z: z + Math.sin(a) * 0.15, vx: Math.cos(a) * out, vy: (2.5 + Math.random() * 3.5) * power, vz: Math.sin(a) * out, floor: y });
    }
    this.ring(x, y, z, 0.8 + power * 0.6, 0.8, 1.3);
    this.ring(x, y, z, 0.5 + power * 0.3, 0.6, 0.9);
  }

  clear() { this.rings.length = 0; this.drops.length = 0; }

  // cam: the camera's position; drops right in front of the lens aren't drawn (they'd fill the view).
  update(dt, cam = null) {
    const { m4, q, v, s } = this;
    const col = this.mesh.instanceColor.array;
    let n = 0;
    for (let i = 0; i < this.rings.length; i++) {
      const r = this.rings[i];
      r.age += dt;
      if (r.age >= r.life) { this.rings.splice(i--, 1); continue; }
      const t = r.age / r.life, e = 1 - (1 - t) * (1 - t);
      const rad = r.r0 + (r.r1 - r.r0) * e;
      if (cam && Math.abs(cam.y - r.y) < 0.6 && Math.hypot(cam.x - r.x, cam.z - r.z) < rad + 0.6) continue; // (seen edge-on from right beside it)
      const fade = r.k * Math.min(1, t * 8) * (1 - t) * (1 - t) * 1.1;
      q.setFromAxisAngle(v.set(0, 1, 0), r.yaw);
      m4.compose(v.set(r.x, r.y, r.z), q, s.set(rad * 2, 1, rad * 2 * r.stretch));
      this.mesh.setMatrixAt(n, m4);
      col[n * 3] = fade * 0.9; col[n * 3 + 1] = fade * 0.97; col[n * 3 + 2] = fade;
      n++;
    }
    this.mesh.count = n;
    this.mesh.instanceMatrix.needsUpdate = true;
    this.mesh.instanceColor.needsUpdate = true;
    this.mesh.visible = n > 0;

    let d = 0;
    for (let i = 0; i < this.drops.length; i++) {
      const p = this.drops[i];
      p.vy -= GRAVITY * dt;
      p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
      p.vx *= 1 - dt * 0.8; p.vz *= 1 - dt * 0.8;
      if (p.y < p.floor && p.vy < 0) {
        if (Math.random() < 0.15) this.ring(p.x, p.floor, p.z, 0.25, 0.45, 0.7);
        this.drops.splice(i--, 1); continue;
      }
      if (cam && Math.abs(p.x - cam.x) + Math.abs(p.y - cam.y) + Math.abs(p.z - cam.z) < 1.1) continue;
      this.dropPos[d * 3] = p.x; this.dropPos[d * 3 + 1] = p.y; this.dropPos[d * 3 + 2] = p.z;
      d++;
    }
    this.points.geometry.setDrawRange(0, d);
    this.points.geometry.attributes.position.needsUpdate = true;
    this.points.visible = d > 0;
  }
}
