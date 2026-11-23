// Item frames: a small wooden frame hung on the side of a block, showing one item. A frame hung on a
// hopper makes it a sorting hopper: it only lets through things that match a frame on it (see machines.js).
// What each frame holds is kept here by position (and saved with the world); the item is drawn as a
// flat picture in the frame, lit like the blocks around it.
import * as THREE from 'three';
import { BLOCKS, ITEMS, FACING_DIRS, isFrame, SHELF, FURN_TABLE, isStand, isMonitor } from './blocks.js';

// Shelves and tables show one thing standing on top of them.
export const isDisplay = (id) => id === SHELF || id === FURN_TABLE;
import { skyBrightness, lightBrightness } from './world.js';

const key = (x, y, z) => `${x},${y},${z}`;
// A box with each face shaded like the blocks are (tops brightest, undersides darkest).
const FACE_SHADE = [0.8, 0.8, 1, 0.55, 0.9, 0.7]; // +x, -x, +y, -y, +z, -z
function shadedBox(w, h, d) {
  const geo = new THREE.BoxGeometry(w, h, d), n = geo.attributes.position.count, c = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { const f = FACE_SHADE[Math.floor(i / 4)]; c[i * 3] = c[i * 3 + 1] = c[i * 3 + 2] = f; }
  geo.setAttribute('color', new THREE.BufferAttribute(c, 3));
  return geo;
}
const STAND_COLOURS = {
  leather: 0x8a5a32, bronze: 0xc0804a, iron: 0xc8ccd2, steel: 0x8e98a2, stainless: 0xe2e8ee, polymer: 0x3a9ad0, starsteel: 0x6a58d0,
  hazmat: 0xe8d030, glider: 0xd84a3a, jetpack: 0x707880, hover: 0x60c0e0, goggles: 0x404448, meteoric: 0x5a4a5a,
};

export class Frames {
  constructor(scene, icons) {
    this.scene = scene;
    this.icons = icons;
    this.items = new Map(); // "x,y,z" -> item id
    this.panels = new Map(); // "x,y,z" -> { mesh, item, id }
    this.textures = new Map();
    this.timer = 0;
  }

  get(x, y, z) { return this.items.get(key(x, y, z)) ?? 0; }
  set(x, y, z, id) { if (id) this.items.set(key(x, y, z), id); else this.items.delete(key(x, y, z)); }
  // A frame was broken or emptied: returns the item it held (or 0).
  remove(x, y, z) { const id = this.get(x, y, z); this.items.delete(key(x, y, z)); return id; }

  // The items shown in frames hung on the block at (x, y, z): a hopper's filter.
  around(world, x, y, z) {
    const out = [];
    FACING_DIRS.forEach(([dx, dz], f) => {
      const fx = x + dx, fz = z + dz, id = world.get(fx, y, fz);
      if (isFrame(id) && BLOCKS[id].facing === f) { const item = this.get(fx, y, fz); if (item) out.push(item); }
    });
    return out;
  }

  update(dt, world, light) {
    this.timer -= dt;
    if (this.timer <= 0) {
      this.timer = 0.25;
      for (const [k, p] of this.panels) {
        const [x, y, z] = k.split(',').map(Number);
        if (this.items.get(k) !== p.item || world.get(x, y, z) !== p.id || !world.chunkAt(x, z)) this.drop(k, p);
      }
      for (const [k, item] of this.items) {
        if (this.panels.has(k)) continue;
        const [x, y, z] = k.split(',').map(Number);
        if (!world.chunkAt(x, z)) continue;
        const id = world.get(x, y, z);
        if (!isFrame(id) && !isDisplay(id) && !isStand(id) && !isMonitor(id)) { this.items.delete(k); continue; }
        if (isMonitor(id)) continue; // (v46: a monitor's camera: 'M' + where it is; see screens.js)
        if (isStand(id) !== (typeof item === 'string')) continue; // (not yet in step)
        this.panels.set(k, this.make(x, y, z, id, item));
      }
    }
    for (const [k, p] of this.panels) {
      const [x, y, z] = k.split(',').map(Number);
      const ly = p.top ? y + 1 : y; // (a shelf is solid: light it from above)
      const sun = light.day * skyBrightness(world.skyAt(x, ly, z));
      const t = lightBrightness(world.lightAt(x, ly, z)) * light.flicker;
      const r = Math.max(sun, t, light.ambient), g = Math.max(sun, t * 0.86, light.ambient), b = Math.max(sun, t * 0.66, light.ambient);
      if (p.mats) for (const m of p.mats) m.color.copy(m.userData.base).multiply({ r, g, b });
      else p.mesh.material.color.setRGB(r, g, b);
    }
  }

  make(x, y, z, id, item) {
    if (isStand(id)) return this.makeStand(x, y, z, id, item);
    let tex = this.textures.get(item);
    if (!tex) {
      tex = new THREE.TextureLoader().load(this.icons[item] ?? '');
      tex.magFilter = THREE.NearestFilter; tex.minFilter = THREE.NearestFilter; tex.colorSpace = THREE.SRGBColorSpace;
      this.textures.set(item, tex);
    }
    if (isDisplay(id)) {
      // standing on top, always turned toward you
      const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, alphaTest: 0.5 }));
      sprite.scale.set(0.55, 0.55, 1);
      sprite.position.set(x + 0.5, y + 1 + 0.27, z + 0.5);
      this.scene.add(sprite);
      return { mesh: sprite, item, id, top: true };
    }
    const mat = new THREE.MeshBasicMaterial({ map: tex, alphaTest: 0.5, polygonOffset: true, polygonOffsetFactor: -1 });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(9 / 16, 9 / 16), mat);
    const [fx, fz] = FACING_DIRS[BLOCKS[id].facing];
    const out = 1.2 / 16 - 0.5 + 0.004;
    mesh.position.set(x + 0.5 + fx * out, y + 0.5, z + 0.5 + fz * out);
    mesh.rotation.y = Math.atan2(fx, fz);
    this.scene.add(mesh);
    return { mesh, item, id };
  }

  // (v44) The armour on an armour stand, as blocky pieces in each one's colour (see standGear in main.js).
  makeStand(x, y, z, id, item) {
    let gear = [];
    try { gear = JSON.parse(item.slice(1)); } catch { /* (empty) */ }
    const g = new THREE.Group(), mats = [], geos = [];
    const mat = (c) => { const m = new THREE.MeshBasicMaterial({ color: c, vertexColors: true }); m.userData.base = new THREE.Color(c); mats.push(m); return m; };
    const box = (w, h, d, m, px, py, pz) => { const geo = shadedBox(w, h, d); geos.push(geo); const b = new THREE.Mesh(geo, m); b.position.set(px, py, pz); g.add(b); };
    const colourOf = (gid) => STAND_COLOURS[ITEMS[gid]?.armour?.mat] ?? 0xe0b030;
    const [helm, chest, legs, boots, shield] = [0, 1, 2, 3, 4].map((i) => gear[i]?.[0]);
    if (helm) { const m = mat(colourOf(helm)); box(0.36, 0.2, 0.36, m, 0, 1.78, 0); box(0.38, 0.06, 0.38, m, 0, 1.66, 0); }
    if (chest) {
      const m = mat(colourOf(chest));
      if (ITEMS[chest]?.armour?.mat === 'glider') { box(1.4, 0.04, 0.5, m, 0, 1.4, -0.25); box(0.04, 0.5, 0.04, m, 0, 1.15, -0.2); }
      else { box(0.56, 0.62, 0.3, m, 0, 1.08, 0); for (const sd of [-1, 1]) box(0.18, 0.5, 0.22, m, sd * 0.38, 1.12, 0); }
    }
    if (legs) { const m = mat(colourOf(legs)); for (const sd of [-1, 1]) box(0.22, 0.5, 0.26, m, sd * 0.13, 0.5, 0); box(0.5, 0.12, 0.28, m, 0, 0.74, 0); }
    if (boots) { const m = mat(colourOf(boots)); for (const sd of [-1, 1]) box(0.24, 0.16, 0.32, m, sd * 0.13, 0.16, 0.02); }
    if (shield) { const m = mat(ITEMS[shield]?.name?.includes('Iron') ? 0xb8bcc2 : 0x9a6a3a); box(0.06, 0.5, 0.4, m, -0.5, 1.0, 0.15); }
    const [fx, fz] = FACING_DIRS[BLOCKS[id].facing];
    g.position.set(x + 0.5, y, z + 0.5);
    g.rotation.y = Math.atan2(fx, fz);
    this.scene.add(g);
    return { mesh: g, item, id, mats, geos, top: true };
  }

  drop(k, p) {
    if (p.mats) { this.scene.remove(p.mesh); for (const m of p.mats) m.dispose(); for (const geo of p.geos) geo.dispose(); this.panels.delete(k); return; }
    this.scene.remove(p.mesh);
    if (!p.top) p.mesh.geometry.dispose(); // (sprites share one geometry)
    p.mesh.material.dispose();
    this.panels.delete(k);
  }

  clear() {
    for (const [k, p] of this.panels) this.drop(k, p);
    this.items.clear();
  }

  serialize() { return [...this.items]; }

  load(list) {
    this.clear();
    for (const [k, id] of list ?? []) if (typeof k === 'string' && ((Number.isInteger(id) && id > 0) || (typeof id === 'string' && (id[0] === 'A' || id[0] === 'M')))) this.items.set(k, id);
  }
}
