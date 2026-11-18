// Item frames: a small wooden frame hung on the side of a block, showing one item. A frame hung on a
// hopper makes it a sorting hopper: it only lets through things that match a frame on it (see machines.js).
// What each frame holds is kept here by position (and saved with the world); the item is drawn as a
// flat picture in the frame, lit like the blocks around it.
import * as THREE from 'three';
import { BLOCKS, FACING_DIRS, isFrame } from './blocks.js';
import { skyBrightness, lightBrightness } from './world.js';

const key = (x, y, z) => `${x},${y},${z}`;

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
        if (!isFrame(id)) { this.items.delete(k); continue; }
        this.panels.set(k, this.make(x, y, z, id, item));
      }
    }
    for (const [k, p] of this.panels) {
      const [x, y, z] = k.split(',').map(Number);
      const sun = light.day * skyBrightness(world.skyAt(x, y, z));
      const t = lightBrightness(world.lightAt(x, y, z)) * light.flicker;
      p.mesh.material.color.setRGB(Math.max(sun, t, light.ambient), Math.max(sun, t * 0.86, light.ambient), Math.max(sun, t * 0.66, light.ambient));
    }
  }

  make(x, y, z, id, item) {
    let tex = this.textures.get(item);
    if (!tex) {
      tex = new THREE.TextureLoader().load(this.icons[item] ?? '');
      tex.magFilter = THREE.NearestFilter; tex.minFilter = THREE.NearestFilter; tex.colorSpace = THREE.SRGBColorSpace;
      this.textures.set(item, tex);
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

  drop(k, p) {
    this.scene.remove(p.mesh);
    p.mesh.geometry.dispose();
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
    for (const [k, id] of list ?? []) if (typeof k === 'string' && Number.isInteger(id) && id > 0) this.items.set(k, id);
  }
}
