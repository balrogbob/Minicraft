// Smoke: soft grey puffs that rise, drift with the wind, swell and fade. Chimneys over a burning fireplace
// and a running locomotive's funnel give them off.
import * as THREE from 'three';

const MAX_PUFFS = 160;

function puffTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 32;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(16, 16, 2, 16, 16, 16);
  grad.addColorStop(0, 'rgba(255,255,255,0.9)');
  grad.addColorStop(0.5, 'rgba(255,255,255,0.45)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 32, 32);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export class Smoke {
  constructor(scene) {
    this.scene = scene;
    this.map = puffTexture();
    this.puffs = [];
    this.free = [];
  }

  // A puff at (x, y, z). grey: 0..1 (how light), size: blocks across at the start, life: seconds.
  puff(x, y, z, { grey = 0.55, size = 0.5, life = 4, rise = 0.9, spread = 0.15 } = {}) {
    let p = this.free.pop();
    if (!p) {
      if (this.puffs.length >= MAX_PUFFS) p = this.puffs.shift();
      else {
        const material = new THREE.SpriteMaterial({ map: this.map, transparent: true, depthWrite: false, fog: true });
        p = { sprite: new THREE.Sprite(material) };
        this.scene.add(p.sprite);
      }
    }
    p.sprite.visible = true;
    p.sprite.position.set(x + (Math.random() - 0.5) * spread, y, z + (Math.random() - 0.5) * spread);
    p.grey = grey; p.size = size; p.life = life; p.age = 0; p.rise = rise * (0.8 + Math.random() * 0.4);
    p.spin = (Math.random() - 0.5) * 0.6;
    this.puffs.push(p);
  }

  // wind: { x, z } blocks a second; light: 0..1, how bright it is out (smoke is dark at night).
  update(dt, wind = { x: 0.4, z: 0.15 }, light = 1) {
    for (let i = this.puffs.length - 1; i >= 0; i--) {
      const p = this.puffs[i];
      p.age += dt;
      const k = p.age / p.life;
      if (k >= 1) {
        p.sprite.visible = false;
        this.puffs.splice(i, 1);
        this.free.push(p);
        continue;
      }
      const s = p.sprite;
      s.position.y += p.rise * dt * (1 - k * 0.5);
      s.position.x += wind.x * dt * k;
      s.position.z += wind.z * dt * k;
      const size = p.size * (1 + k * 2.2);
      s.scale.set(size, size, 1);
      s.material.rotation += p.spin * dt;
      const g = p.grey * (0.25 + 0.75 * light);
      s.material.color.setRGB(g, g, g);
      s.material.opacity = Math.min(1, p.age * 4) * (1 - k) * 0.7;
    }
  }

  clear() {
    for (const p of this.puffs) { p.sprite.visible = false; this.free.push(p); }
    this.puffs.length = 0;
  }
}
