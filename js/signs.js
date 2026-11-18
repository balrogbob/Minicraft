// Signs: the text written on each sign, and the little canvas-textured panels that show it.
// Texts are kept here by position (and saved with the world); a panel is made for every sign
// in the loaded part of the world, and lit like the blocks around it.
import * as THREE from 'three';
import { BLOCKS, FACING_DIRS, isSign } from './blocks.js';
import { skyBrightness, lightBrightness } from './world.js';

export const SIGN_LINES = 4, SIGN_CHARS = 16;
const key = (x, y, z) => `${x},${y},${z}`;

// Tidy text typed for a sign: at most 4 lines of 16 characters.
export function cleanSignText(text) {
  return String(text ?? '').split('\n').slice(0, SIGN_LINES).map((l) => l.slice(0, SIGN_CHARS)).join('\n').trimEnd();
}

export class Signs {
  constructor(scene) {
    this.scene = scene;
    this.texts = new Map(); // "x,y,z" -> text
    this.panels = new Map(); // "x,y,z" -> { mesh, text, id }
    this.timer = 0;
  }

  get(x, y, z) { return this.texts.get(key(x, y, z)) ?? ''; }

  set(x, y, z, text) {
    const t = cleanSignText(text);
    if (t) this.texts.set(key(x, y, z), t); else this.texts.delete(key(x, y, z));
  }

  remove(x, y, z) { this.texts.delete(key(x, y, z)); }

  // Keep a panel for every sign with text in the loaded world, lit like its block.
  update(dt, world, light) {
    this.timer -= dt;
    if (this.timer <= 0) {
      this.timer = 0.25;
      for (const [k, p] of this.panels) {
        const [x, y, z] = k.split(',').map(Number);
        if (this.texts.get(k) !== p.text || world.get(x, y, z) !== p.id || !world.chunkAt(x, z)) this.drop(k, p);
      }
      for (const [k, text] of this.texts) {
        if (this.panels.has(k)) continue;
        const [x, y, z] = k.split(',').map(Number);
        if (!world.chunkAt(x, z)) continue;
        const id = world.get(x, y, z);
        if (!isSign(id)) { this.texts.delete(k); continue; }
        this.panels.set(k, this.make(x, y, z, id, text));
      }
    }
    for (const [k, p] of this.panels) {
      const [x, y, z] = k.split(',').map(Number);
      const sun = light.day * skyBrightness(world.skyAt(x, y, z));
      const t = lightBrightness(world.lightAt(x, y, z)) * light.flicker;
      p.mesh.material.color.setRGB(Math.max(sun, t, light.ambient), Math.max(sun, t * 0.86, light.ambient), Math.max(sun, t * 0.66, light.ambient));
    }
  }

  make(x, y, z, id, text) {
    const def = BLOCKS[id];
    const c = document.createElement('canvas');
    c.width = 256; c.height = 128;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#2b1a0c';
    ctx.font = 'bold 26px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const lines = text.split('\n');
    lines.forEach((line, i) => ctx.fillText(line, 128, 64 + (i - (lines.length - 1) / 2) * 29, 244));
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1 });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(14 / 16, 7 / 16), mat);
    // the board's front faces `facing`; the text sits just in front of it
    const [fx, fz] = FACING_DIRS[def.facing];
    const out = def.post ? 8.5 / 16 - 0.5 + 0.004 : 1.5 / 16 - 0.5 + 0.004;
    mesh.position.set(x + 0.5 + fx * out, y + (def.post ? 12 / 16 : 0.5), z + 0.5 + fz * out);
    mesh.rotation.y = Math.atan2(fx, fz);
    this.scene.add(mesh);
    return { mesh, text, id };
  }

  drop(k, p) {
    this.scene.remove(p.mesh);
    p.mesh.geometry.dispose();
    p.mesh.material.map.dispose();
    p.mesh.material.dispose();
    this.panels.delete(k);
  }

  clear() {
    for (const [k, p] of this.panels) this.drop(k, p);
    this.texts.clear();
  }

  serialize() { return [...this.texts]; }

  load(list) {
    this.clear();
    for (const [k, t] of list ?? []) if (typeof k === 'string' && typeof t === 'string') this.texts.set(k, cleanSignText(t));
  }
}
