// Weather: spells of rain come and go. What falls depends on where you are: rain in temperate land,
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
    for (const o of [this.streaks, this.flakes]) { o.frustumCulled = false; o.renderOrder = 2; scene.add(o); }
    this.t = 0;
  }

  // Start or stop a spell of rain now (for the console, and for loading a save).
  set(raining, secs = raining ? rand(120, 300) : rand(300, 720)) { this.raining = raining; this.timer = secs; }

  // dt: game seconds; biome where the player is; sky: sunlight level (0..15) at the player's head.
  update(dt, camPos, biome, sky) {
    this.timer -= dt;
    if (this.timer <= 0) this.set(!this.raining);
    this.kind = biome === 'desert' ? 'sand' : biome === 'tundra' ? 'snow' : 'rain';
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
      const sand = this.kind === 'sand';
      const p = this.flakes.geometry.attributes.position.array;
      for (let i = 0; i < COUNT; i++) {
        let y = o[i * 3 + 1] - dt * (sand ? 0.6 : 1.6);
        if (y < BOTTOM) y += TOP - BOTTOM;
        o[i * 3 + 1] = y;
        // snow drifts and wavers; sand blows sideways fast
        if (sand) o[i * 3] += dt * (9 + (i % 7));
        else o[i * 3] += Math.sin(this.t * 0.9 + i) * dt * 0.6;
        p[i * 3] = camPos.x + wrap(o[i * 3] - camPos.x);
        p[i * 3 + 1] = camPos.y + y + (sand ? Math.sin(this.t * 2 + i) * 0.3 : 0);
        p[i * 3 + 2] = camPos.z + wrap(o[i * 3 + 2] - camPos.z);
      }
      this.flakes.geometry.attributes.position.needsUpdate = true;
      this.flakes.material.color.setHex(sand ? 0xd8bc80 : 0xffffff);
      this.flakes.material.size = sand ? 0.09 : 0.13;
      this.flakes.material.opacity = (sand ? 0.75 : 0.9) * lv;
    }
  }
}

// Keep a particle within the box around the camera as the camera moves.
function wrap(d) {
  const w = BOX * 2;
  return ((d + BOX) % w + w) % w - BOX;
}
