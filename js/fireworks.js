// Fireworks: a rocket climbs on a trail of sparks, then bursts into a ball of coloured stars that drift down and
// fade. Villages send them up on festival nights; you can set them off yourself.
import * as THREE from 'three';

const COLOURS = [0xff4a4a, 0x4ad0ff, 0xffd84a, 0x7aff6a, 0xff7ae6, 0xffffff, 0xff9a3a, 0xa07aff];
const STARS = 70;
const GRAVITY = 3.2;

// a soft round spark, so the stars aren't squares
function sparkTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 16;
  const g = c.getContext('2d'), grad = g.createRadialGradient(8, 8, 0, 8, 8, 8);
  grad.addColorStop(0, 'rgba(255,255,255,1)'); grad.addColorStop(0.4, 'rgba(255,255,255,0.8)'); grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad; g.fillRect(0, 0, 16, 16);
  return new THREE.CanvasTexture(c);
}

export class Fireworks {
  constructor(scene) {
    this.scene = scene;
    this.rockets = [];
    this.bursts = [];
    this.onBurst = null; // (x, y, z) when one goes off, for the bang
    this.map = sparkTexture();
  }

  // Send one up from (x, y, z). colour: a hex colour, or random.
  launch(x, y, z, colour) {
    const c = new THREE.Color(colour ?? COLOURS[Math.floor(Math.random() * COLOURS.length)]);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(3 * 12), 3));
    const mat = new THREE.PointsMaterial({ map: this.map, color: 0xffe0a0, size: 0.45, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false });
    const pts = new THREE.Points(geo, mat);
    pts.frustumCulled = false;
    this.scene.add(pts);
    this.rockets.push({ pos: new THREE.Vector3(x, y, z), vel: new THREE.Vector3((Math.random() - 0.5) * 2, 16 + Math.random() * 5, (Math.random() - 0.5) * 2), fuse: 1.3 + Math.random() * 0.5, trail: [], pts, colour: c });
  }

  burst(at, colour) {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(STARS * 3), col = new Float32Array(STARS * 3), vel = [];
    const second = new THREE.Color(COLOURS[Math.floor(Math.random() * COLOURS.length)]);
    for (let i = 0; i < STARS; i++) {
      // even-ish directions over a sphere
      const u = Math.random() * 2 - 1, a = Math.random() * Math.PI * 2, r = Math.sqrt(1 - u * u), sp = 7 + Math.random() * 2;
      vel.push(new THREE.Vector3(r * Math.cos(a) * sp, u * sp, r * Math.sin(a) * sp));
      pos.set([at.x, at.y, at.z], i * 3);
      const c = i % 4 === 0 ? second : colour;
      col.set([c.r, c.g, c.b], i * 3);
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const mat = new THREE.PointsMaterial({ map: this.map, size: 0.9, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false });
    const pts = new THREE.Points(geo, mat);
    pts.frustumCulled = false;
    this.scene.add(pts);
    this.bursts.push({ pts, vel, age: 0, life: 2.2 });
    this.onBurst?.(at.x, at.y, at.z);
  }

  update(dt) {
    for (let i = this.rockets.length - 1; i >= 0; i--) {
      const r = this.rockets[i];
      r.vel.y -= GRAVITY * 0.5 * dt;
      r.pos.addScaledVector(r.vel, dt);
      r.trail.unshift(r.pos.clone());
      if (r.trail.length > 12) r.trail.pop();
      const a = r.pts.geometry.attributes.position;
      r.trail.forEach((p, k) => a.setXYZ(k, p.x + (Math.random() - 0.5) * 0.1 * k, p.y - k * 0.12, p.z + (Math.random() - 0.5) * 0.1 * k));
      for (let k = r.trail.length; k < 12; k++) a.setXYZ(k, r.pos.x, r.pos.y, r.pos.z);
      a.needsUpdate = true;
      if ((r.fuse -= dt) <= 0) {
        this.scene.remove(r.pts); r.pts.geometry.dispose(); r.pts.material.dispose();
        this.rockets.splice(i, 1);
        this.burst(r.pos, r.colour);
      }
    }
    for (let i = this.bursts.length - 1; i >= 0; i--) {
      const b = this.bursts[i];
      b.age += dt;
      const k = b.age / b.life;
      if (k >= 1) {
        this.scene.remove(b.pts); b.pts.geometry.dispose(); b.pts.material.dispose();
        this.bursts.splice(i, 1);
        continue;
      }
      const a = b.pts.geometry.attributes.position, drag = Math.exp(-2.2 * dt);
      b.vel.forEach((v, j) => {
        v.multiplyScalar(drag); v.y -= GRAVITY * dt;
        a.setXYZ(j, a.getX(j) + v.x * dt, a.getY(j) + v.y * dt, a.getZ(j) + v.z * dt);
      });
      a.needsUpdate = true;
      b.pts.material.opacity = k < 0.6 ? 1 : (1 - k) / 0.4 * (0.6 + Math.random() * 0.4); // they twinkle out
    }
  }

  clear() {
    for (const r of this.rockets) { this.scene.remove(r.pts); r.pts.geometry.dispose(); r.pts.material.dispose(); }
    for (const b of this.bursts) { this.scene.remove(b.pts); b.pts.geometry.dispose(); b.pts.material.dispose(); }
    this.rockets.length = 0; this.bursts.length = 0;
  }
}
