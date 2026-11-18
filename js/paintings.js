// Paintings: a painting hangs in one block on the side of a wall, and its picture reaches right and up
// from there (see ART in blocks.js for each picture's size). The pictures are painted here, pixel by
// pixel, at 16 pixels a block, and shown as flat panels lit like the blocks around them.
import * as THREE from 'three';
import { BLOCKS, FACING_DIRS, ART } from './blocks.js';
import { skyBrightness, lightBrightness } from './world.js';
import { CHUNK } from './terrain.js';

const PX = 16;
const key = (x, y, z) => `${x},${y},${z}`;

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const mix = (a, b, k) => a.map((v, i) => Math.round(v + (b[i] - v) * k));

// Paint picture `i` onto a canvas w x h blocks.
function paint(i, w, h) {
  const W = w * PX, Hh = h * PX;
  const c = document.createElement('canvas');
  c.width = W; c.height = Hh;
  const ctx = c.getContext('2d');
  const r = rng(1000 + i * 77);
  const px = (x, y, col) => { ctx.fillStyle = `rgb(${col[0]},${col[1]},${col[2]})`; ctx.fillRect(x, y, 1, 1); };
  const sky = (top, bottom) => { for (let y = 0; y < Hh; y++) for (let x = 0; x < W; x++) px(x, y, mix(top, bottom, y / Hh)); };
  // a ridge of land: height(x) in pixels from the top, filled below with colour (with a little texture)
  const land = (height, col, dark) => {
    for (let x = 0; x < W; x++) for (let y = Math.max(0, Math.floor(height(x))); y < Hh; y++) px(x, y, r() < 0.15 ? dark : col);
  };
  const name = ART[i].name;
  if (name === 'Sunset Hills') {
    sky([250, 140, 70], [255, 214, 130]);
    for (let y = 0; y < Hh; y++) for (let x = 0; x < W; x++) if (Math.hypot(x - W * 0.6, y - Hh * 0.55) < 3) px(x, y, [255, 240, 170]);
    land((x) => Hh * 0.6 + Math.sin(x * 0.5) * 2, [120, 70, 90], [100, 56, 76]);
    land((x) => Hh * 0.75 + Math.sin(x * 0.8 + 1) * 1.5, [70, 46, 64], [56, 36, 52]);
  } else if (name === 'Night Sky') {
    sky([16, 20, 54], [40, 52, 110]);
    for (let k = 0; k < 14; k++) px(Math.floor(r() * W), Math.floor(r() * Hh * 0.7), [255, 250, 220]);
    for (let y = 0; y < Hh; y++) for (let x = 0; x < W; x++) {
      if (Math.hypot(x - 4, y - 4) < 2.2 && Math.hypot(x - 5, y - 3.4) > 1.8) px(x, y, [250, 246, 210]); // a crescent moon
    }
    land((x) => Hh * 0.8 + Math.sin(x) * 1, [20, 30, 40], [14, 22, 30]);
  } else if (name === 'The Sea') {
    sky([120, 186, 240], [200, 230, 250]);
    for (let x = 0; x < W; x++) for (let y = Math.floor(Hh * 0.5); y < Hh; y++) px(x, y, (x + y * 3) % 7 === 0 ? [220, 240, 255] : mix([40, 110, 180], [20, 60, 120], (y - Hh * 0.5) / (Hh * 0.5)));
    // a little sailing boat
    for (let y = 3; y < 7; y++) for (let x = 0; x <= y - 3; x++) px(18 + x, y, [250, 250, 240]);
    for (let x = 15; x < 24; x++) px(x, 8, [120, 70, 40]);
    for (let x = 16; x < 23; x++) px(x, 7, [140, 84, 48]);
  } else if (name === 'Mountains') {
    sky([150, 200, 240], [220, 236, 250]);
    const peak = (cx, hgt, wid) => (x) => Hh - hgt + Math.abs(x - cx) * (hgt / wid);
    land(peak(9, 13, 9), [110, 116, 130], [96, 100, 116]);
    for (let x = 4; x < 15; x++) for (let y = 3; y < Hh; y++) if (y < Hh - 13 + Math.abs(x - 9) * 1.45 + 3 && y >= Hh - 13 + Math.abs(x - 9) * 1.45) px(x, y, [245, 248, 255]);
    land(peak(23, 10, 10), [90, 98, 112], [76, 84, 98]);
    land((x) => Hh - 3 + Math.sin(x) * 0.6, [80, 140, 70], [60, 116, 54]);
  } else if (name === 'Meadow') {
    sky([140, 196, 240], [210, 232, 250]);
    land((x) => Hh * 0.45 + Math.sin(x * 0.25) * 2, [100, 170, 70], [84, 150, 60]);
    for (let k = 0; k < 40; k++) {
      const x = Math.floor(r() * W), y = Math.floor(Hh * 0.5 + r() * Hh * 0.5);
      px(x, y, [[230, 60, 50], [250, 220, 60], [240, 240, 240], [150, 90, 220]][k % 4]);
    }
    // a tree
    for (let y = 8; y < 15; y++) px(24, y, [100, 66, 40]);
    for (let y = 2; y < 10; y++) for (let x = 20; x < 29; x++) if (Math.hypot(x - 24, y - 6) < 4) px(x, y, r() < 0.3 ? [50, 110, 50] : [70, 140, 60]);
    for (let y = 2; y < 6; y++) for (let x = 3; x < 10; x++) if (Math.hypot((x - 6.5) / 2, y - 4) < 1.4) px(x, y, [250, 250, 250]); // a cloud
  } else if (name === 'The Lighthouse') {
    sky([60, 80, 140], [240, 170, 120]);
    for (let x = 0; x < W; x++) for (let y = Math.floor(Hh * 0.72); y < Hh; y++) px(x, y, (x + y) % 5 === 0 ? [120, 160, 210] : [40, 70, 120]);
    land((x) => Hh * 0.66 + Math.abs(x - 8) * 0.7, [90, 86, 80], [70, 66, 62]);
    for (let y = 6; y < 22; y++) for (let x = 6; x < 10; x++) px(x, y, Math.floor(y / 3) % 2 ? [230, 50, 40] : [245, 245, 240]);
    for (let y = 3; y < 6; y++) for (let x = 5; x < 11; x++) px(x, y, y === 3 ? [40, 40, 44] : [255, 236, 140]);
    for (let x = 11; x < 16; x++) px(x, 4, [255, 246, 190]); // the beam
  } else if (name === 'Desert Dunes') {
    sky([110, 170, 230], [250, 220, 170]);
    for (let y = 0; y < Hh; y++) for (let x = 0; x < W; x++) if (Math.hypot(x - 24, y - 6) < 3.5) px(x, y, [255, 246, 200]);
    land((x) => Hh * 0.55 + Math.sin(x * 0.18) * 3, [226, 190, 120], [206, 170, 104]);
    land((x) => Hh * 0.72 + Math.sin(x * 0.22 + 2) * 2.5, [240, 206, 140], [214, 180, 116]);
    // a cactus
    for (let y = 14; y < 24; y++) px(8, y, [70, 140, 60]);
    for (let y = 16; y < 19; y++) px(6, y, [70, 140, 60]);
    px(7, 18, [70, 140, 60]);
  } else {
    // The Long Valley: hills fading into the distance, a river winding through
    sky([170, 210, 245], [235, 240, 230]);
    land((x) => Hh * 0.38 + Math.sin(x * 0.11) * 3, [150, 170, 190], [140, 160, 182]);
    land((x) => Hh * 0.5 + Math.sin(x * 0.17 + 1) * 3, [110, 150, 110], [96, 136, 96]);
    land((x) => Hh * 0.64 + Math.sin(x * 0.13 + 3) * 3, [84, 140, 66], [70, 124, 54]);
    for (let y = Math.floor(Hh * 0.6); y < Hh; y++) {
      const cx = W * 0.5 + Math.sin(y * 0.4) * (y - Hh * 0.55) * 0.9, wd = (y - Hh * 0.58) * 0.5 + 1;
      for (let x = Math.floor(cx - wd); x <= cx + wd; x++) px(x, y, (x + y) % 6 ? [80, 140, 210] : [190, 220, 250]);
    }
  }
  // the frame
  ctx.fillStyle = 'rgb(112,76,42)';
  ctx.fillRect(0, 0, W, 1); ctx.fillRect(0, Hh - 1, W, 1); ctx.fillRect(0, 0, 1, Hh); ctx.fillRect(W - 1, 0, 1, Hh);
  return c;
}

// The cells a painting hung at (x, y, z) facing f covers: [[x, y, z], ...], anchor first.
export function paintingCells(x, y, z, f, w, h) {
  const [dx, dz] = FACING_DIRS[f];
  const [rx, rz] = [dz, -dx]; // to the right, looking at it
  const out = [];
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) out.push([x + rx * i, y + j, z + rz * i]);
  return out;
}

export class Paintings {
  constructor(scene) {
    this.scene = scene;
    this.textures = new Map(); // art -> texture
    this.panels = new Map(); // "x,y,z" -> { mesh, id }
    this.timer = 0;
  }

  texture(art) {
    let t = this.textures.get(art);
    if (!t) {
      t = new THREE.CanvasTexture(paint(art, ART[art].w, ART[art].h));
      t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter; t.colorSpace = THREE.SRGBColorSpace;
      this.textures.set(art, t);
    }
    return t;
  }

  update(dt, world, light) {
    if ((this.timer -= dt) <= 0) {
      this.timer = 0.3;
      const seen = new Set();
      for (const c of world.chunks.values()) {
        for (const li of c.machines) {
          const id = c.data[li], def = BLOCKS[id];
          if (!def?.painting) continue;
          const x = c.cx * CHUNK + (li & 15), z = c.cz * CHUNK + ((li >> 4) & 15), y = li >> 8, k = key(x, y, z);
          seen.add(k);
          const p = this.panels.get(k);
          if (p?.id === id) continue;
          if (p) this.drop(k, p);
          this.panels.set(k, this.make(x, y, z, def, id));
        }
      }
      for (const [k, p] of this.panels) if (!seen.has(k)) this.drop(k, p);
    }
    for (const p of this.panels.values()) {
      const [x, y, z] = p.at;
      const sun = light.day * skyBrightness(world.skyAt(x, y, z));
      const t = lightBrightness(world.lightAt(x, y, z)) * light.flicker;
      p.mesh.material.color.setRGB(Math.max(sun, t, light.ambient), Math.max(sun, t * 0.86, light.ambient), Math.max(sun, t * 0.66, light.ambient));
    }
  }

  make(x, y, z, def, id) {
    const { art, w, h } = def.painting, f = def.facing;
    const [dx, dz] = FACING_DIRS[f];
    const [rx, rz] = [dz, -dx];
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: this.texture(art) }));
    // flat against the wall behind the block it hangs in, centred over the cells it covers
    mesh.position.set(x + 0.5 - dx * 0.46 + rx * (w - 1) / 2, y + h / 2, z + 0.5 - dz * 0.46 + rz * (w - 1) / 2);
    mesh.rotation.y = Math.atan2(dx, dz);
    this.scene.add(mesh);
    return { mesh, id, at: [x, y, z] };
  }

  drop(k, p) {
    this.scene.remove(p.mesh);
    p.mesh.geometry.dispose();
    p.mesh.material.dispose();
    this.panels.delete(k);
  }

  clear() { for (const [k, p] of this.panels) this.drop(k, p); }
}
