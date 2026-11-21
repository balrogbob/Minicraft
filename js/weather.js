// Weather: spells of rain come and go (some of them thunderstorms, and hail up in the mountains; a rainbow may
// follow). What falls depends on where you are: rain in temperate land,
// snow in the tundra, and a sandstorm of blowing sand in the desert. While it rains the sky clouds
// over and the light dims, crops grow faster, and cauldrons left out in the open fill with water.
// Particles are drawn in a box around the camera, and only when there's open sky above you.
import * as THREE from 'three';

const COUNT = 900;
const BOX = 22; // half-width of the box of particles around the camera
const TOP = 16, BOTTOM = -10;
const rand = (a, b) => a + Math.random() * (b - a);

export class Weather {
  constructor(scene) {
    this.scene = scene;
    this.raining = false;
    this.timer = rand(240, 600); // seconds until the weather changes
    this.level = 0; // 0..1, eased toward 1 while it rains where you are and you're under the sky
    this.kind = 'rain'; // 'rain' | 'snow' | 'sand' where you are
    const pos = new Float32Array(COUNT * 6);
    this.offsets = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      this.offsets[i * 3] = rand(-BOX, BOX);
      this.offsets[i * 3 + 1] = rand(BOTTOM, TOP);
      this.offsets[i * 3 + 2] = rand(-BOX, BOX);
    }
    // rain is drawn as short streaks (line segments); snow and sand as points
    const lg = new THREE.BufferGeometry();
    lg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    this.streaks = new THREE.LineSegments(lg, new THREE.LineBasicMaterial({ color: 0xa8c0e8, transparent: true, opacity: 0, depthWrite: false }));
    const pg = new THREE.BufferGeometry();
    pg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(COUNT * 3), 3));
    this.flakes = new THREE.Points(pg, new THREE.PointsMaterial({ color: 0xffffff, size: 0.12, transparent: true, opacity: 0, depthWrite: false }));
    for (const o of [this.streaks, this.flakes]) { o.frustumCulled = false; o.renderOrder = 2; o.layers.set(4); scene.add(o); } // (layer 4: drawn after the water, see graphics.js)
    this.t = 0;
  }

  // Start or stop a spell of rain now (for the console, and for loading a save).
  // A spell of rain may be a thunderstorm; when one ends, there may be a rainbow.
  set(raining, secs = raining ? rand(120, 300) : rand(300, 720), storm = raining && Math.random() < 0.35) {
    if (this.raining && !raining && Math.random() < 0.7) this.rainbowFor = rand(80, 140);
    if (raining) this.rainbowFor = 0;
    this.raining = raining; this.timer = secs; this.storm = !!(raining && storm);
  }

  // A bolt of lightning from the clouds to (x, y, z): a jagged white streak that's gone in a moment.
  bolt(x, y, z) {
    const g = new THREE.Group(), mat = new THREE.MeshBasicMaterial({ color: 0xf4f6ff, transparent: true, opacity: 1, fog: false, depthWrite: false });
    let px = x + 0.5, py = y + 70, pz = z + 0.5;
    const steps = 12, box = new THREE.BoxGeometry(1, 1, 1);
    for (let i = 1; i <= steps; i++) {
      const nx = i === steps ? x + 0.5 : x + 0.5 + rand(-3, 3) * (1 - i / steps), nz = i === steps ? z + 0.5 : z + 0.5 + rand(-3, 3) * (1 - i / steps), ny = y + 70 * (1 - i / steps);
      const a = new THREE.Vector3(px, py, pz), b = new THREE.Vector3(nx, ny, nz), len = a.distanceTo(b);
      const seg = new THREE.Mesh(box, mat);
      seg.scale.set(0.22, 0.22, len);
      seg.position.copy(a).add(b).multiplyScalar(0.5);
      seg.lookAt(b);
      g.add(seg);
      px = nx; py = ny; pz = nz;
    }
    g.renderOrder = 3;
    this.scene.add(g);
    (this.bolts ??= []).push({ g, mat, box, life: 0.45 });
  }

  // The rainbow: bands of colour in an arc, opposite the sun. (Made the first time it's needed.)
  makeRainbow() {
    const g = new THREE.Group(), cols = [0xd03030, 0xe08020, 0xe0d030, 0x40b040, 0x3070e0, 0x5040b0, 0x8040a0];
    this.rainbowMats = [];
    cols.forEach((c, i) => {
      const m = new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0, fog: false, depthWrite: false, side: THREE.DoubleSide });
      this.rainbowMats.push(m);
      g.add(new THREE.Mesh(new THREE.RingGeometry(78 - i * 3, 81 - i * 3, 64, 1, 0, Math.PI), m));
    });
    g.renderOrder = -1;
    this.scene.add(g);
    this.rainbow = g;
  }

  // dt: game seconds; biome where the player is; sky: sunlight level (0..15) at the player's head.
  // high: up in the mountains (rain falls as hail there); sunX: which way the sun is (east +1, west -1);
  // daylight: 0..1.
  update(dt, camPos, biome, sky, high = false, sunX = 1, daylight = 1) {
    this.timer -= dt;
    if (this.timer <= 0) this.set(!this.raining);
    this.kind = biome === 'desert' ? 'sand' : biome === 'tundra' ? 'snow' : high ? 'hail' : 'rain';
    // lightning
    for (const b of this.bolts ?? []) { b.life -= dt; b.mat.opacity = Math.max(0, b.life / 0.45); }
    if (this.bolts?.some((b) => b.life <= 0)) {
      for (const b of this.bolts.filter((b2) => b2.life <= 0)) { this.scene.remove(b.g); b.mat.dispose(); b.box.dispose(); }
      this.bolts = this.bolts.filter((b) => b.life > 0);
    }
    // the rainbow, after the rain, while the sun's well up
    if (this.rainbowFor > 0) this.rainbowFor -= dt;
    const bow = this.rainbowFor > 0 && !this.raining && daylight > 0.6 && (this.overcast ?? 0) < 0.5 && biome !== 'desert' ? Math.min(1, this.rainbowFor / 20, (0.5 - (this.overcast ?? 0)) * 3) : 0;
    this.bowLevel = (this.bowLevel ?? 0) + (bow - (this.bowLevel ?? 0)) * Math.min(1, dt * 0.5);
    if (this.bowLevel > 0.01 || this.rainbow) {
      if (!this.rainbow) this.makeRainbow();
      this.rainbow.visible = this.bowLevel > 0.01;
      if (this.rainbow.visible) {
        const dir = new THREE.Vector3(-Math.sign(sunX || 1), 0, -0.35).normalize();
        this.rainbow.position.copy(camPos).addScaledVector(dir, 135);
        this.rainbow.position.y = camPos.y - 28;
        this.rainbow.lookAt(camPos.x, camPos.y - 28, camPos.z);
        for (const m of this.rainbowMats) m.opacity = 0.4 * this.bowLevel;
      }
    }
    const open = sky >= 13;
    const want = this.raining && open ? 1 : 0;
    this.level += (want - this.level) * Math.min(1, dt * 0.8);
    // how cloudy it is (indoors too: the light outside the window dims)
    this.overcast = (this.overcast ?? 0) + ((this.raining ? 1 : 0) - (this.overcast ?? 0)) * Math.min(1, dt * 0.3);
    this.t += dt;
    const lv = this.level;
    this.streaks.visible = lv > 0.01 && this.kind === 'rain';
    this.flakes.visible = lv > 0.01 && this.kind !== 'rain';
    if (lv <= 0.01) return;
    const o = this.offsets;
    if (this.kind === 'rain') {
      const p = this.streaks.geometry.attributes.position.array;
      for (let i = 0; i < COUNT; i++) {
        let y = o[i * 3 + 1] - dt * 18;
        if (y < BOTTOM) y += TOP - BOTTOM;
        o[i * 3 + 1] = y;
        const x = camPos.x + wrap(o[i * 3] - camPos.x), z = camPos.z + wrap(o[i * 3 + 2] - camPos.z);
        p[i * 6] = x; p[i * 6 + 1] = camPos.y + y; p[i * 6 + 2] = z;
        p[i * 6 + 3] = x - 0.05; p[i * 6 + 4] = camPos.y + y - 0.7; p[i * 6 + 5] = z;
      }
      this.streaks.geometry.attributes.position.needsUpdate = true;
      this.streaks.material.opacity = 0.55 * lv;
    } else {
      const sand = this.kind === 'sand', hail = this.kind === 'hail';
      const p = this.flakes.geometry.attributes.position.array;
      for (let i = 0; i < COUNT; i++) {
        let y = o[i * 3 + 1] - dt * (sand ? 0.6 : hail ? 14 : 1.6);
        if (y < BOTTOM) y += TOP - BOTTOM;
        o[i * 3 + 1] = y;
        // snow drifts and wavers; sand blows sideways fast
        if (sand) o[i * 3] += dt * (9 + (i % 7));
        else if (!hail) o[i * 3] += Math.sin(this.t * 0.9 + i) * dt * 0.6;
        p[i * 3] = camPos.x + wrap(o[i * 3] - camPos.x);
        p[i * 3 + 1] = camPos.y + y + (sand ? Math.sin(this.t * 2 + i) * 0.3 : 0);
        p[i * 3 + 2] = camPos.z + wrap(o[i * 3 + 2] - camPos.z);
      }
      this.flakes.geometry.attributes.position.needsUpdate = true;
      this.flakes.material.color.setHex(sand ? 0xd8bc80 : hail ? 0xe4eef8 : 0xffffff);
      this.flakes.material.size = sand ? 0.09 : hail ? 0.18 : 0.13;
      this.flakes.material.opacity = (sand ? 0.75 : 0.9) * lv;
    }
  }
}

// Keep a particle within the box around the camera as the camera moves.
function wrap(d) {
  const w = BOX * 2;
  return ((d + BOX) % w + w) % w - BOX;
}
