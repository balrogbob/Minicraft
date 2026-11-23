// v41: distant land. Past the chunks that are loaded, the world goes on as a cheap blocky sketch of itself,
// worked out from the same terrain generator: hills, mountains with snow, sea, sand and snowy tundra, in steps
// FAR_CELL blocks wide. It is built in square tiles a few at a time as you move, and it hides itself wherever
// the real chunks are, so it only ever fills the gap between them and the horizon.

import * as THREE from 'three';
import { CHUNK, SEA_LEVEL, SNOW_LINE } from './terrain.js';
import { gfxUniforms, GFX_PT_HEAD } from './graphics.js';

const FAR_CELL = 4; // blocks per step
const TILE = 64; // blocks per tile (a mesh each)
const STEPS = TILE / FAR_CELL;
export const FAR_REACH = 192; // how far past the loaded chunks it goes, in blocks
const PER_FRAME = 2; // tiles built per frame at most (each samples the generator 17 x 17 times)

// colours, in sRGB (converted when the mesh is built)
const C = {
  grass: [0.37, 0.6, 0.25], forest: [0.26, 0.47, 0.2], sand: [0.86, 0.8, 0.56], snow: [0.93, 0.95, 0.98],
  tundra: [0.82, 0.88, 0.86], stone: [0.5, 0.5, 0.52], water: [0.2, 0.38, 0.72], ice: [0.72, 0.84, 0.94], dirt: [0.47, 0.36, 0.25],
};
const lin = (c) => c.map((v) => Math.pow(v, 2.2));
const CL = Object.fromEntries(Object.entries(C).map(([k, v]) => [k, lin(v)]));

export class FarLand {
  // gen: the world's terrain Generator; dayU: the daylight uniform the world materials use
  constructor(scene, gen, dayU) {
    this.scene = scene;
    this.gen = gen;
    this.tiles = new Map(); // "tx,tz" -> mesh
    this.group = new THREE.Group();
    this.group.name = 'far land';
    scene.add(this.group);
    this.uInner = { value: 96 }; // loaded chunks reach this far from uCentre (half a square's side)
    this.uCentre = { value: new THREE.Vector2() };
    this.material = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide });
    this.material.onBeforeCompile = (shader) => {
      shader.uniforms.uDay = dayU; shader.uniforms.uInner = this.uInner; shader.uniforms.uCentre = this.uCentre;
      shader.uniforms.uPTPass = gfxUniforms.uPTPass; shader.uniforms.uPTFar = gfxUniforms.uPTFar;
      shader.vertexShader = 'varying vec3 vFarP;\n' + shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvFarP = (modelMatrix * vec4(position, 1.0)).xyz;');
      shader.fragmentShader = 'uniform float uDay;\nuniform float uInner;\nuniform vec2 uCentre;\nvarying vec3 vFarP;\n' + GFX_PT_HEAD + shader.fragmentShader
        .replace('#include <clipping_planes_fragment>', '#include <clipping_planes_fragment>\nvec2 farD = abs(vFarP.xz - uCentre);\nif (max(farD.x, farD.y) < uInner) discard; // (the real chunks are here)')
        .replace('#include <color_fragment>', '#include <color_fragment>\nvec3 farC = diffuseColor.rgb;\ndiffuseColor.rgb *= max(uDay, 0.03);')
        // (v46: path tracing's plain pictures, see graphics.js)
        .replace('#include <dithering_fragment>', '#include <dithering_fragment>\nif (uPTPass > 0.5) { vec3 fn = normalize(cross(dFdx(vFarP), dFdy(vFarP))); if (dot(fn, cameraPosition - vFarP) < 0.0) fn = -fn; gl_FragColor = gfxPTOut(farC, vFarP, fn, 0.0, 0.0); }');
    };
    this.material.customProgramCacheKey = () => 'far-land';
    this.material.userData.ptWorld = true;
    this.on = true;
  }

  setGenerator(gen) { if (gen !== this.gen) { this.gen = gen; this.clear(); } }

  clear() {
    for (const m of this.tiles.values()) { this.group.remove(m); m.geometry.dispose(); }
    this.tiles.clear();
  }

  dispose() { this.clear(); this.scene.remove(this.group); this.material.dispose(); }

  // every frame: (cx, cz) the chunk the loaded square is centred on, r its radius in chunks
  update(camPos, cx, cz, r) {
    this.group.visible = this.on && !!this.gen;
    if (!this.group.visible) return;
    const inner = (r + 0.5) * CHUNK; // (the loaded square runs from cx - r to cx + r chunks)
    this.uInner.value = inner - 2;
    this.uCentre.value.set((cx + 0.5) * CHUNK, (cz + 0.5) * CHUNK);
    const outer = inner + FAR_REACH;
    const t0x = Math.floor((camPos.x - outer) / TILE), t1x = Math.floor((camPos.x + outer) / TILE);
    const t0z = Math.floor((camPos.z - outer) / TILE), t1z = Math.floor((camPos.z + outer) / TILE);
    const ccx = (cx + 0.5) * CHUNK, ccz = (cz + 0.5) * CHUNK;
    const want = new Set();
    const todo = [];
    for (let tx = t0x; tx <= t1x; tx++) for (let tz = t0z; tz <= t1z; tz++) {
      const x0 = tx * TILE, z0 = tz * TILE;
      // skip tiles wholly inside the loaded square, or wholly beyond the reach
      const insideX = x0 >= ccx - inner && x0 + TILE <= ccx + inner, insideZ = z0 >= ccz - inner && z0 + TILE <= ccz + inner;
      if (insideX && insideZ) continue;
      const dx = Math.max(0, Math.abs(x0 + TILE / 2 - camPos.x) - TILE / 2), dz = Math.max(0, Math.abs(z0 + TILE / 2 - camPos.z) - TILE / 2);
      if (Math.hypot(dx, dz) > outer) continue;
      const k = `${tx},${tz}`;
      want.add(k);
      if (!this.tiles.has(k)) todo.push([Math.hypot(dx, dz), tx, tz, k]);
    }
    for (const [k, m] of this.tiles) if (!want.has(k)) { this.group.remove(m); m.geometry.dispose(); this.tiles.delete(k); }
    todo.sort((a, b) => a[0] - b[0]);
    for (const [, tx, tz, k] of todo.slice(0, PER_FRAME)) {
      const m = new THREE.Mesh(this.buildTile(tx * TILE, tz * TILE), this.material);
      m.matrixAutoUpdate = false;
      m.userData.noShadow = true;
      this.group.add(m);
      this.tiles.set(k, m);
    }
  }

  // one tile: a flat top for each step, at the land's height there (or the sea's), with walls down to the
  // lower neighbour on each side, so hills read as blocky steps
  buildTile(x0, z0) {
    const g = this.gen, N = STEPS + 2;
    const hs = new Float32Array(N * N), cols = new Array(N * N);
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
      const x = x0 + (i - 1) * FAR_CELL + FAR_CELL / 2, z = z0 + (j - 1) * FAR_CELL + FAR_CELL / 2;
      const h = g.height(x, z), biome = g.biomeAt(x, z);
      let top = h + 1, c;
      if (h < SEA_LEVEL) { top = SEA_LEVEL + 0.9; c = biome === 'tundra' ? CL.ice : CL.water; }
      else if (h >= SNOW_LINE) c = CL.snow;
      else if (h >= SNOW_LINE - 6) c = CL.stone;
      else if (biome === 'desert' || h <= SEA_LEVEL + 1) c = CL.sand;
      else if (biome === 'tundra') c = CL.tundra;
      else c = (g.plants(x / 40, z / 40, 1) > 0.05 ? CL.forest : CL.grass); // (woods: a darker green)
      hs[j * N + i] = top; cols[j * N + i] = c;
    }
    const pos = [], col = [], idx = [];
    const quad = (a, b, cc, d, c, k) => {
      const n = pos.length / 3;
      pos.push(...a, ...b, ...cc, ...d);
      for (let q = 0; q < 4; q++) col.push(c[0] * k, c[1] * k, c[2] * k);
      idx.push(n, n + 1, n + 2, n, n + 2, n + 3);
    };
    for (let j = 1; j <= STEPS; j++) for (let i = 1; i <= STEPS; i++) {
      const h = hs[j * N + i], c = cols[j * N + i];
      const xa = x0 + (i - 1) * FAR_CELL, xb = xa + FAR_CELL, za = z0 + (j - 1) * FAR_CELL, zb = za + FAR_CELL;
      quad([xa, h, za], [xa, h, zb], [xb, h, zb], [xb, h, za], c, 1);
      const side = c === CL.grass || c === CL.forest || c === CL.tundra ? CL.dirt : c === CL.water || c === CL.ice ? CL.water : c;
      // walls where this step stands above a neighbour (that neighbour's own tile draws the rest)
      const hw = hs[j * N + i - 1], he = hs[j * N + i + 1], hn = hs[(j - 1) * N + i], hsouth = hs[(j + 1) * N + i];
      if (hw < h) quad([xa, hw, za], [xa, hw, zb], [xa, h, zb], [xa, h, za], side, 0.8);
      if (he < h) quad([xb, he, zb], [xb, he, za], [xb, h, za], [xb, h, zb], side, 0.8);
      if (hn < h) quad([xb, hn, za], [xa, hn, za], [xa, h, za], [xb, h, za], side, 0.65);
      if (hsouth < h) quad([xa, hsouth, zb], [xb, hsouth, zb], [xb, h, zb], [xa, h, zb], side, 0.65);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    geo.setIndex(idx);
    geo.computeBoundingSphere();
    return geo;
  }
}
