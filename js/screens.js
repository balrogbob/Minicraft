// v46: mirrors, security cameras and monitors.
//
// Mirrors: every mirror hung in the same flat plane (same facing, same wall line) shares one picture: the
// scene drawn from your eye's mirror image behind that plane, at a quarter of the screen's pixels, and laid
// over each mirror by projecting its points into that picture (the way the water's reflection works). Only
// the two nearest mirror planes in view are drawn each frame; the others show a plain silvery sheen.
//
// Cameras and monitors: monitors facing the same way side by side (in one flat wall) join into one screen,
// whose picture is the view from the camera it's tuned to. One screen is redrawn per frame, in turn, at a low
// resolution, and only screens you can see.
import * as THREE from 'three';
import { BLOCKS, FACING_DIRS } from './blocks.js';
import { CHUNK } from './world.js';

const key = (x, y, z) => `${x},${y},${z}`;
const MIRROR_RANGE = 40; // (mirror planes further away than this aren't drawn live)
const MAX_PLANES = 2;
const SCREEN_RANGE = 64;
const PX_PER_BLOCK = 128, MAX_PX = 768;
const TILTS = [0, 25, 50].map((d) => THREE.MathUtils.degToRad(d));

const MIRROR_VERT = `
varying vec3 vWorld;
void main() {
  vec4 w = modelMatrix * vec4(position, 1.0);
  vWorld = w.xyz;
  gl_Position = projectionMatrix * viewMatrix * w;
}`;
const MIRROR_FRAG = `
uniform sampler2D uTex;
uniform mat4 uMat;
uniform float uOn;
uniform float uLive;
uniform vec3 uNormal;
uniform vec3 uSky;
varying vec3 vWorld;
void main() {
  vec3 col;
  if (uOn * uLive > 0.5) {
    vec4 c = uMat * vec4(vWorld, 1.0);
    col = texture2D(uTex, c.xy / c.w).rgb * vec3(0.9, 0.93, 0.95);
  } else {
    // (not drawn live: a soft sheen of the sky above and the ground below, in the direction it reflects)
    vec3 v = normalize(vWorld - cameraPosition);
    vec3 r = reflect(v, uNormal);
    col = mix(vec3(0.16, 0.16, 0.18), uSky, smoothstep(-0.3, 0.4, r.y)) * 0.85;
  }
  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

// A "no signal" picture for a screen tuned to a camera that's gone (or too far away to be loaded).
function noSignal() {
  const c = document.createElement('canvas');
  c.width = 128; c.height = 96;
  const g = c.getContext('2d');
  const img = g.createImageData(128, 96);
  for (let i = 0; i < img.data.length; i += 4) { const v = 30 + Math.random() * 90; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255; }
  g.putImageData(img, 0, 0);
  g.fillStyle = 'rgba(0,0,0,0.6)'; g.fillRect(14, 36, 100, 24);
  g.fillStyle = '#e8e8e8'; g.font = 'bold 15px monospace'; g.textAlign = 'center'; g.fillText('NO SIGNAL', 64, 53);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// The two ways along a wall facing f: `right` as seen by someone looking at it.
const rightOf = (f) => { const [dx, dz] = FACING_DIRS[f]; return [dz, -dx]; };

export class Screens {
  constructor(scene, renderer) {
    this.scene = scene;
    this.renderer = renderer;
    this.cells = new Map(); // "x,y,z" -> id (every mirror, camera and monitor in the loaded world)
    this.sig = '';
    this.planes = []; // mirror planes: { f, n, c, mesh, mat, box, cells }
    this.groups = []; // joined monitors: { f, cells, mesh, mat, rt, w, h, link, box }
    this.cameras = new Map(); // "x,y,z" -> id
    this.timer = 0;
    this.rr = 0; // (whose turn it is to have its screen redrawn)
    this.slots = []; // the mirror pictures, shared out each frame
    this.liveU = { value: 1 };
    this.skyU = { value: new THREE.Color(0.6, 0.75, 0.95) };
    this.mirrorCam = new THREE.PerspectiveCamera();
    this.secCam = new THREE.PerspectiveCamera(70, 1, 0.05, 96);
    this.clip = new THREE.Plane();
    this.frustum = new THREE.Frustum();
    this.m4 = new THREE.Matrix4();
    this.bias = new THREE.Matrix4().set(0.5, 0, 0, 0.5, 0, 0.5, 0, 0.5, 0, 0, 0.5, 0.5, 0, 0, 0, 1);
    this.size = new THREE.Vector2();
    this.noSignal = null;
    this.links = null; // set by the game: { get(x, y, z), set(x, y, z, v) } (kept with the item frames)
  }

  // ---------- finding them ----------

  update(dt, world) {
    if ((this.timer -= dt) > 0) return;
    this.timer = 0.3;
    const cells = new Map();
    for (const c of world.chunks.values()) {
      for (const li of c.machines) {
        const id = c.data[li];
        if (!BLOCKS[id]?.screen) continue;
        cells.set(key(c.cx * CHUNK + (li & 15), li >> 8, c.cz * CHUNK + ((li >> 4) & 15)), id);
      }
    }
    const sig = [...cells].map(([k, id]) => `${k}:${id}`).sort().join(';');
    if (sig !== this.sig) { this.sig = sig; this.cells = cells; this.rebuild(); }
    // which camera each screen is tuned to (any of its monitors can hold the link)
    for (const g of this.groups) {
      let link = null;
      for (const [x, y, z] of g.cells) { const v = this.links?.get(x, y, z); if (typeof v === 'string' && v[0] === 'M') { link = v.slice(1); break; } }
      if (link !== g.link) { g.link = link; g.drawn = false; }
      const cam = link && this.cameras.get(link);
      const map = cam ? (g.drawn ? g.rt.texture : null) : (link ? (this.noSignal ??= noSignal()) : null);
      if (g.mat.map !== map) { g.mat.map = map; g.mat.needsUpdate = true; }
      g.mesh.visible = !!map;
    }
  }

  rebuild() {
    for (const p of this.planes) { this.scene.remove(p.mesh); p.mesh.geometry.dispose(); p.mat.dispose(); }
    for (const g of this.groups) { this.scene.remove(g.mesh); g.mesh.geometry.dispose(); g.mat.dispose(); g.rt?.dispose(); }
    this.planes = []; this.groups = []; this.cameras.clear();
    const mirrors = new Map(), monitors = [];
    for (const [k, id] of this.cells) {
      const d = BLOCKS[id], [x, y, z] = k.split(',').map(Number);
      if (d.screen === 'camera') this.cameras.set(k, id);
      else if (d.screen === 'monitor') monitors.push([x, y, z, d.facing]);
      else if (d.screen === 'mirror') {
        const [dx, dz] = FACING_DIRS[d.facing];
        // the glass is 1/16 out from the wall behind the block it hangs in
        const c = dx ? dx * (x + 0.5 - dx * 0.5 + dx / 16) : dz * (z + 0.5 - dz * 0.5 + dz / 16);
        const pk = `${d.facing}:${c.toFixed(3)}`;
        if (!mirrors.has(pk)) mirrors.set(pk, { f: d.facing, c, cells: [] });
        mirrors.get(pk).cells.push([x, y, z]);
      }
    }
    for (const p of mirrors.values()) this.planes.push(this.makePlane(p));
    // monitors join with the ones beside, above and below them in the same flat wall
    const left = new Map(monitors.map((m) => [key(m[0], m[1], m[2]), m]));
    for (const m of monitors) {
      const k0 = key(m[0], m[1], m[2]);
      if (!left.has(k0)) continue;
      const f = m[3], [rx, rz] = rightOf(f), cells = [], todo = [m];
      left.delete(k0);
      while (todo.length) {
        const [x, y, z] = todo.pop();
        cells.push([x, y, z]);
        for (const [ox, oy, oz] of [[rx, 0, rz], [-rx, 0, -rz], [0, 1, 0], [0, -1, 0]]) {
          const n = left.get(key(x + ox, y + oy, z + oz));
          if (n && n[3] === f) { left.delete(key(n[0], n[1], n[2])); todo.push(n); }
        }
      }
      cells.sort((a, b) => a[1] - b[1] || (a[0] * rx + a[2] * rz) - (b[0] * rx + b[2] * rz));
      this.groups.push(this.makeGroup(f, cells));
    }
  }

  // one quad per cell, in a single mesh; `uv` gives each corner's place in the whole picture
  quads(cells, f, out, uvOf, inset) {
    const [dx, dz] = FACING_DIRS[f], [rx, rz] = rightOf(f), pos = [], uv = [], idx = [];
    for (const [x, y, z] of cells) {
      const [l, r, b, t] = inset ? inset(x, y, z) : [0, 0, 0, 0];
      const cx = x + 0.5 + dx * out, cz = z + 0.5 + dz * out;
      const base = pos.length / 3;
      for (const [u, v] of [[-0.5 + l, b], [0.5 - r, b], [0.5 - r, 1 - t], [-0.5 + l, 1 - t]]) {
        const px = cx + rx * u, pz = cz + rz * u;
        pos.push(px, y + v, pz);
        if (uvOf) uv.push(...uvOf(px, y + v, pz));
      }
      idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    if (uvOf) geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    geo.setIndex(idx);
    geo.computeBoundingSphere();
    geo.computeBoundingBox();
    return geo;
  }

  makePlane({ f, c, cells }) {
    const [dx, dz] = FACING_DIRS[f];
    const mat = new THREE.ShaderMaterial({
      vertexShader: MIRROR_VERT, fragmentShader: MIRROR_FRAG,
      uniforms: {
        uTex: { value: null }, uMat: { value: new THREE.Matrix4() }, uOn: { value: 0 }, uLive: this.liveU,
        uNormal: { value: new THREE.Vector3(dx, 0, dz) }, uSky: this.skyU,
      },
      polygonOffset: true, polygonOffsetFactor: -1,
    });
    const geo = this.quads(cells, f, -0.5 + 1 / 16 + 0.003, null, null);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.userData.noShadow = true;
    this.scene.add(mesh);
    return { f, n: new THREE.Vector3(dx, 0, dz), c, cells, mesh, mat, box: geo.boundingBox };
  }

  makeGroup(f, cells) {
    const [rx, rz] = rightOf(f), has = new Set(cells.map(([x, y, z]) => key(x, y, z)));
    const along = ([x, , z]) => (x + 0.5) * rx + (z + 0.5) * rz;
    const s0 = Math.min(...cells.map(along)) - 0.5, s1 = Math.max(...cells.map(along)) + 0.5;
    const y0 = Math.min(...cells.map((c) => c[1])), y1 = Math.max(...cells.map((c) => c[1])) + 1;
    const B = 1 / 16; // (the bezel round the edge of the whole screen)
    const inset = (x, y, z) => [
      has.has(key(x - rx, y, z - rz)) ? 0 : B, has.has(key(x + rx, y, z + rz)) ? 0 : B,
      has.has(key(x, y - 1, z)) ? 0 : B, has.has(key(x, y + 1, z)) ? 0 : B,
    ];
    const uvOf = (px, py, pz) => [(px * rx + pz * rz - s0) / (s1 - s0), (py - y0) / (y1 - y0)];
    const geo = this.quads(cells, f, 0.5 + 0.003, uvOf, inset);
    const mat = new THREE.MeshBasicMaterial({ color: 0xf0f0f0, polygonOffset: true, polygonOffsetFactor: -1 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.visible = false;
    mesh.userData.noShadow = true;
    this.scene.add(mesh);
    const w = s1 - s0, h = y1 - y0, scale = Math.min(1, MAX_PX / (Math.max(w, h) * PX_PER_BLOCK));
    return { f, cells, mesh, mat, rt: null, w, h, px: [Math.max(16, Math.round(w * PX_PER_BLOCK * scale)), Math.max(16, Math.round(h * PX_PER_BLOCK * scale))], link: null, box: geo.boundingBox };
  }

  // ---------- tuning a monitor ----------

  // The screen a monitor at (x, y, z) is part of.
  groupAt(x, y, z) { return this.groups.find((g) => g.cells.some((c) => c[0] === x && c[1] === y && c[2] === z)); }

  // Tune the screen with this monitor in it to the next camera (nearest first), or off after the last.
  // Returns { index, count, at } of the camera it's now on, or null when it's off.
  nextCamera(x, y, z) {
    const g = this.groupAt(x, y, z);
    const cells = g ? g.cells : [[x, y, z]];
    const cams = [...this.cameras.keys()].map((k) => { const [cx, cy, cz] = k.split(',').map(Number); return { k, at: [cx, cy, cz], d: Math.hypot(cx - x, cy - y, cz - z) }; })
      .sort((a, b) => a.d - b.d || (a.k < b.k ? -1 : 1));
    let cur = null;
    for (const [cx, cy, cz] of cells) { const v = this.links?.get(cx, cy, cz); if (typeof v === 'string' && v[0] === 'M') { cur = v.slice(1); break; } }
    const i = cur ? cams.findIndex((c) => c.k === cur) : -1;
    const next = cams[i + 1] ?? null;
    for (const [cx, cy, cz] of cells) this.links?.set(cx, cy, cz, next ? `M${next.k}` : 0);
    this.timer = 0; // (show it straight away)
    return next ? { index: i + 2, count: cams.length, at: next.at } : null;
  }

  // ---------- drawing ----------

  // Draw this frame's mirror pictures and (at most) one screen's camera view. `show`: things hidden in the
  // main view that should still be seen in mirrors and on screens (your body, in first person); `hide`: the
  // other way round (the block outline).
  render(camera, opts) {
    const { mirrors, show = [], hide = [], sky, uniforms } = opts;
    if (!this.planes.length && !this.groups.length) return;
    if (sky) this.skyU.value.copy(sky);
    const r = this.renderer;
    this.m4.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    this.frustum.setFromProjectionMatrix(this.m4);
    const eye = camera.getWorldPosition(new THREE.Vector3());
    // the mirror planes to draw: in front of you, in view and near enough; nearest first
    const live = [];
    for (const p of this.planes) {
      p.mat.uniforms.uOn.value = 0;
      p.mat.uniforms.uTex.value = null;
      if (!mirrors) continue;
      const side = p.n.dot(eye) - p.c;
      if (side < 0.05) continue;
      const d = p.box.distanceToPoint(eye);
      if (d > MIRROR_RANGE || !this.frustum.intersectsBox(p.box)) continue;
      live.push([d, p]);
    }
    live.sort((a, b) => a[0] - b[0]);
    const planes = live.slice(0, MAX_PLANES).map((e) => e[1]);
    // the camera views: whose turn it is, of the screens in view and near enough
    let group = null;
    const seen = this.groups.filter((g) => g.link && this.cameras.has(g.link) && g.box.distanceToPoint(eye) < SCREEN_RANGE && this.frustum.intersectsBox(g.box));
    if (seen.length) group = seen[this.rr++ % seen.length];
    if (!planes.length && !group) return;

    const was = r.getRenderTarget(), clipWas = r.clippingPlanes, reflWas = uniforms?.uReflect?.value;
    const shown = show.map((o) => [o, o.visible]), hidden = hide.map((o) => [o, o.visible]);
    for (const [o] of shown) o.visible = true;
    for (const [o] of hidden) o.visible = false;
    if (uniforms?.uReflect) uniforms.uReflect.value = 0; // (the water's own reflection is only right from your eye)
    this.liveU.value = 0; // (and so is a mirror's: in other views they show their sheen)
    try {
      if (planes.length) {
        r.getDrawingBufferSize(this.size);
        const w = Math.max(1, this.size.x >> 1), h = Math.max(1, this.size.y >> 1);
        planes.forEach((p, i) => {
          let rt = this.slots[i];
          if (!rt || rt.width !== w || rt.height !== h) { rt?.dispose(); rt = this.slots[i] = this.target(w, h); }
          p.mat.uniforms.uTex.value = rt.texture;
          p.mat.uniforms.uOn.value = 1;
        });
        planes.forEach((p, i) => this.drawMirror(camera, eye, p, this.slots[i]));
        if (planes.length) this.drawnMirrors = (this.drawnMirrors ?? 0) + 1;
      }
      if (group) this.drawScreen(group);
    } finally {
      r.clippingPlanes = clipWas;
      r.setRenderTarget(was);
      for (const [o, v] of shown) o.visible = v;
      for (const [o, v] of hidden) o.visible = v;
      if (uniforms?.uReflect) uniforms.uReflect.value = reflWas;
      this.liveU.value = 1;
    }
  }

  target(w, h) {
    const r = this.renderer;
    const half = r.extensions.has('EXT_color_buffer_half_float') || r.extensions.has('EXT_color_buffer_float');
    return new THREE.WebGLRenderTarget(w, h, { type: half ? THREE.HalfFloatType : THREE.UnsignedByteType, generateMipmaps: false, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter });
  }

  drawMirror(camera, eye, p, rt) {
    const r = this.renderer, mc = this.mirrorCam, n = p.n;
    mc.fov = camera.fov; mc.aspect = camera.aspect; mc.near = camera.near; mc.far = camera.far;
    mc.updateProjectionMatrix();
    // your eye's mirror image behind the glass, looking at the mirrored view
    const fwd = camera.getWorldDirection(new THREE.Vector3());
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.getWorldQuaternion(new THREE.Quaternion()));
    const mirror = (v, point) => v.addScaledVector(n, -2 * (n.dot(v) - (point ? p.c : 0)));
    const pos = mirror(eye.clone(), true), target = mirror(eye.clone().add(fwd), true);
    mirror(up, false);
    mc.position.copy(pos); mc.up.copy(up); mc.lookAt(target);
    mc.updateMatrixWorld(true);
    p.mat.uniforms.uMat.value.copy(this.bias).multiply(mc.projectionMatrix).multiply(mc.matrixWorldInverse);
    // only what's in front of the glass (not the wall it hangs on, nor what's behind that)
    this.clip.normal.copy(n); this.clip.constant = -(p.c + 0.01);
    r.clippingPlanes = [this.clip];
    p.mesh.visible = false; // (it can't show its own picture while that's being drawn)
    try {
      r.setRenderTarget(rt);
      r.render(this.scene, mc);
    } finally { p.mesh.visible = true; r.clippingPlanes = []; }
  }

  drawScreen(g) {
    const r = this.renderer, cam = this.secCam;
    const [x, y, z] = g.link.split(',').map(Number), d = BLOCKS[this.cameras.get(g.link)];
    const [dx, dz] = FACING_DIRS[d.facing], tilt = TILTS[d.tilt] ?? 0;
    cam.aspect = g.w / g.h;
    cam.updateProjectionMatrix();
    const lensY = d.floor ? y + 0.5 : y + 0.5;
    cam.position.set(x + 0.5 + dx * 0.32, lensY, z + 0.5 + dz * 0.32);
    cam.up.set(0, 1, 0);
    cam.lookAt(cam.position.x + dx * Math.cos(tilt), lensY - Math.sin(tilt), cam.position.z + dz * Math.cos(tilt));
    cam.updateMatrixWorld(true);
    g.rt ??= this.target(g.px[0], g.px[1]);
    r.clippingPlanes = [];
    const vis = g.mesh.visible;
    g.mesh.visible = false; // (it can't show its own picture while that's being drawn)
    try {
      r.setRenderTarget(g.rt);
      r.render(this.scene, cam);
    } finally { g.mesh.visible = vis; }
    if (!g.drawn) { g.drawn = true; g.mat.map = g.rt.texture; g.mat.needsUpdate = true; g.mesh.visible = true; }
  }

  clear() {
    this.cells = new Map(); this.sig = '';
    this.rebuild();
    for (const rt of this.slots) rt?.dispose();
    this.slots = [];
  }
}
