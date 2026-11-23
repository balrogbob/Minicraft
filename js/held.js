// What you hold, and how you look (v38).
//   heldMesh(id)  - a small 3D model of any item: blocks are little cubes in their own textures,
//                   everything else is its icon given a pixel of thickness (each pixel's edge is
//                   filled in with its own colour, so a pickaxe looks solid, not like paper)
//   Viewmodel     - your arm and what's in your hand, at the bottom right of the screen
//   Avatar        - a person made of boxes: you in photo mode and the third-person view, and other
//                   players in multiplayer. It walks, swims, swings and holds what's in its hand.
import * as THREE from 'three';
import { BLOCKS, isBlock } from './blocks.js';
import { ATLAS_COLS } from './textures.js';

// face brightness for box faces (+x, -x, +y, -y, +z, -z), matching the world's block shading
const SHADE = [0.8, 0.8, 1.0, 0.5, 0.65, 0.65].map((v) => Math.pow(v, 2.2));

// ---------- item models ----------

const cache = new Map(); // id -> { geometry, map, cube }

function cubeGeometry(def, size) {
  const g = new THREE.BoxGeometry(size, size, size);
  const uv = g.attributes.uv, t = 1 / ATLAS_COLS, eps = 0.5 / (16 * ATLAS_COLS);
  const tiles = [def.side, def.side, def.top, def.bottom, def.front ?? def.side, def.side];
  for (let f = 0; f < 6; f++) {
    const tile = tiles[f];
    const u0 = (tile % ATLAS_COLS) * t, v0 = 1 - Math.floor(tile / ATLAS_COLS) * t - t;
    for (let k = 0; k < 4; k++) {
      const i = f * 4 + k;
      uv.setXY(i, u0 + eps + uv.getX(i) * (t - 2 * eps), v0 + eps + uv.getY(i) * (t - 2 * eps));
    }
  }
  const col = new Float32Array(24 * 3);
  for (let i = 0; i < 24; i++) col.fill(SHADE[i >> 2], i * 3, i * 3 + 3);
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return g;
}

// A flat picture given thickness: a front and a back, and a little side wall wherever a filled pixel
// meets an empty one (the side shows that pixel's colour).
function extrudedGeometry(img, n, size) {
  const data = img.getContext('2d').getImageData(0, 0, n, n).data;
  const filled = (x, y) => x >= 0 && y >= 0 && x < n && y < n && data[(y * n + x) * 4 + 3] > 127;
  const pos = [], uvs = [], col = [], idx = [];
  const px = size / n, th = size / 16, h = size / 2;
  const quad = (a, b, c, d, uv4, shade) => {
    const base = pos.length / 3;
    pos.push(...a, ...b, ...c, ...d);
    uvs.push(...uv4);
    for (let i = 0; i < 4; i++) col.push(shade, shade, shade);
    idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
  };
  // front (+z) and back (-z)
  quad([-h, -h, th / 2], [h, -h, th / 2], [h, h, th / 2], [-h, h, th / 2], [0, 0, 1, 0, 1, 1, 0, 1], 1);
  quad([h, -h, -th / 2], [-h, -h, -th / 2], [-h, h, -th / 2], [h, h, -th / 2], [1, 0, 0, 0, 0, 1, 1, 1], SHADE[4]);
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    if (!filled(x, y)) continue;
    const u = (x + 0.5) / n, v = 1 - (y + 0.5) / n;
    const uv4 = [u, v, u, v, u, v, u, v];
    const x0 = -h + x * px, x1 = x0 + px, y1 = h - y * px, y0 = y1 - px, zf = th / 2, zb = -th / 2;
    if (!filled(x - 1, y)) quad([x0, y0, zb], [x0, y0, zf], [x0, y1, zf], [x0, y1, zb], uv4, SHADE[1]);
    if (!filled(x + 1, y)) quad([x1, y0, zf], [x1, y0, zb], [x1, y1, zb], [x1, y1, zf], uv4, SHADE[0]);
    if (!filled(x, y - 1)) quad([x0, y1, zf], [x1, y1, zf], [x1, y1, zb], [x0, y1, zb], uv4, SHADE[2]);
    if (!filled(x, y + 1)) quad([x0, y0, zb], [x1, y0, zb], [x1, y0, zf], [x0, y0, zf], uv4, SHADE[3]);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx);
  return g;
}

// { geometry, map, cube }: shared by every copy of the item
export function heldModel(id, atlasTex, iconCanvases) {
  if (cache.has(id)) return cache.get(id);
  const def = isBlock(id) ? BLOCKS[id] : null;
  let out = null;
  if (def && def.shape === 'cube' && !def.model) {
    out = { geometry: cubeGeometry(def, 1), map: atlasTex, cube: true };
  } else {
    const src = iconCanvases?.[id];
    if (src) {
      // painted items and plants are 16 x 16 pixel art; drawings of models and shaped blocks are finer
      const n = def && def.shape !== 'cross' && def.shape !== 'torch' ? 32 : 16;
      const c = document.createElement('canvas');
      c.width = c.height = n;
      const ctx = c.getContext('2d');
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(src, 0, 0, n, n);
      const map = new THREE.CanvasTexture(c);
      map.magFilter = map.minFilter = THREE.NearestFilter;
      map.generateMipmaps = false;
      map.colorSpace = THREE.SRGBColorSpace;
      out = { geometry: extrudedGeometry(c, n, 1), map, cube: false };
    }
  }
  cache.set(id, out);
  return out;
}

// A mesh of the item with its own material (so its brightness can follow the light where it is).
export function heldMesh(id, atlasTex, iconCanvases) {
  const m = heldModel(id, atlasTex, iconCanvases);
  if (!m) return null;
  const mat = new THREE.MeshBasicMaterial({ map: m.map, vertexColors: true, alphaTest: 0.5, side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(m.geometry, mat);
  mesh.userData.cube = m.cube;
  return mesh;
}

// Is this item held like a tool (handle in the fist, pointing up and forward)?
const toolLike = (id, ITEMS) => !!(ITEMS[id]?.tool || ITEMS[id]?.weapon || /rod|bow|sword|axe|pick|shovel|hoe|shears|wand|spanner|hammer|drill|saw|knife|scoop/i.test(ITEMS[id]?.name ?? ''));

// ---------- looks ----------

export const LOOKS = {
  skin: [0xf1c79a, 0xe0ac69, 0xc68642, 0x8d5524, 0x5c3a21, 0xffdbb5],
  hair: [0x3b2a1a, 0x7a4a24, 0xc9a050, 0x1a1a1a, 0xa83a20, 0xd8d8d0, 0x6a3fa0],
  shirt: [0x3a7bc8, 0xc83a3a, 0x3a9a4a, 0xe0b030, 0x7a4ab0, 0xe8e8e0, 0x2a2a30, 0xe07a30],
  trousers: [0x3a4a6a, 0x5a4030, 0x2a2a2a, 0x6a6a50, 0x304a30, 0x803030],
};
export const randomLook = () => Object.fromEntries(Object.entries(LOOKS).map(([k, list]) => [k, Math.floor(Math.random() * list.length)]));
const lookColour = (look, part) => LOOKS[part][((look?.[part] ?? 0) % LOOKS[part].length + LOOKS[part].length) % LOOKS[part].length];

function shadedBox(w, h, d, color) {
  const g = new THREE.BoxGeometry(w, h, d);
  const c = new THREE.Color(color);
  const col = new Float32Array(24 * 3);
  for (let i = 0; i < 24; i++) { const s = SHADE[i >> 2]; col[i * 3] = c.r * s; col[i * 3 + 1] = c.g * s; col[i * 3 + 2] = c.b * s; }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return g;
}

// (v44) A glider's wing, as a group of boxes drawn with `mat` (its geometries are pushed onto `geos`, to be
// disposed with the rest): about 2.6 wide, its middle at the group's origin, with the bar hanging 1 below.
export function gliderGroup(mat, geos) {
  const g = new THREE.Group();
  const add = (size, color, pos) => { const geo = shadedBox(...size, color); geos.push(geo); const m = new THREE.Mesh(geo, mat); m.position.set(...pos); g.add(m); return m; };
  for (let i = 0; i < 5; i++) {
    const m = add([0.54, 0.04, 0.95], i % 2 ? 0xece2c8 : 0xce3a30, [(i - 2) * 0.52, -Math.abs(i - 2) * 0.05, 0.05]);
    m.rotation.z = (i - 2) * 0.05;
  }
  add([2.7, 0.06, 0.06], 0x78502c, [0, 0.01, -0.42]); // the spar along the front
  add([0.05, 0.06, 1.0], 0x78502c, [0, 0.02, 0.05]); // the keel
  for (const x of [-0.28, 0.28]) { const st = add([0.04, 1.0, 0.04], 0x6e4a28, [x * 0.7, -0.5, -0.05]); st.rotation.z = x > 0 ? 0.25 : -0.25; }
  add([0.62, 0.04, 0.04], 0x6e4a28, [0, -0.98, -0.05]); // the bar you hold
  return g;
}

// light where something is, as a colour: max(daylight x sunlight, warm torch light, ambient)
export function lightColour(out, { sun, torch, ambient }) {
  return out.setRGB(Math.max(sun, torch, ambient), Math.max(sun, torch * 0.86, ambient), Math.max(sun, torch * 0.66, ambient));
}

// ---------- first person: your arm and what's in your hand ----------

export class Viewmodel {
  constructor(atlasTex, iconCanvases, ITEMS) {
    this.atlas = atlasTex; this.icons = iconCanvases; this.ITEMS = ITEMS;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(70, 1, 0.01, 10);
    this.scene.add(this.camera);
    this.root = new THREE.Group(); // bob and sway move this
    this.camera.add(this.root);
    this.armMat = new THREE.MeshBasicMaterial({ vertexColors: true });
    this.arm = new THREE.Group();
    this.root.add(this.arm);
    this.armMesh = new THREE.Mesh(shadedBox(0.17, 0.17, 0.75, 0xffffff), this.armMat);
    this.armMesh.position.set(0, 0, 0.34);
    this.sleeve = new THREE.Mesh(shadedBox(0.19, 0.19, 0.3, 0xffffff), new THREE.MeshBasicMaterial({ vertexColors: true }));
    this.sleeve.position.set(0, 0, 0.62);
    this.arm.add(this.armMesh, this.sleeve);
    this.hand = new THREE.Group(); // the held item hangs off this
    this.root.add(this.hand);
    this.id = 0; this.item = null; this.shown = 0;
    this.swingT = 1; this.switchT = 1; this.eating = 0; this.phase = 0; this.bobAmt = 0;
    this.light = new THREE.Color(1, 1, 1);
    this.setLook({});
  }

  setLook(look) {
    const skin = new THREE.Color(lookColour(look, 'skin')), shirt = new THREE.Color(lookColour(look, 'shirt'));
    this.skin = skin; this.shirt = shirt;
  }

  // the item in your hand changed: lower the old one and raise the new
  setItem(id) {
    if (id === this.id) return;
    this.id = id;
    this.switchT = 0;
  }

  swing() { if (this.swingT > 0.55) this.swingT = 0; }
  eat() { this.eatTimer = 0.8; } // raise the food to your mouth and munch

  build(id) {
    if (this.item) { this.hand.remove(this.item); this.item.material.dispose(); this.item = null; }
    this.shown = id;
    if (!id) return;
    const mesh = heldMesh(id, this.atlas, this.icons);
    if (!mesh) return;
    if (mesh.userData.cube) {
      mesh.scale.setScalar(0.32);
      mesh.rotation.set(0.1, 0.75, 0);
      mesh.position.set(-0.02, 0.1, -0.08);
    } else if (toolLike(id, this.ITEMS)) {
      mesh.scale.setScalar(0.52);
      mesh.rotation.set(0, -1.35, 0.55);
      mesh.position.set(0.0, 0.2, -0.12);
    } else {
      mesh.scale.setScalar(0.4);
      mesh.rotation.set(0, -0.35, 0.1);
      mesh.position.set(-0.04, 0.14, -0.1);
    }
    this.item = mesh;
    this.hand.add(mesh);
  }

  // moving: 0..1 how fast you walk; light: { sun, torch, ambient }
  update(dt, { moving = 0, onGround = true, swimming = false, aspect = 1, light, eating = false }) {
    this.camera.aspect = aspect; this.camera.updateProjectionMatrix();
    this.eatTimer = Math.max(0, (this.eatTimer ?? 0) - dt);
    this.eating = eating || this.eatTimer > 0 ? Math.min(1, this.eating + dt * 6) : Math.max(0, this.eating - dt * 6);
    // switching: lower the old item, swap, raise the new one
    if (this.switchT < 1) {
      this.switchT = Math.min(1, this.switchT + dt * 5);
      if (this.switchT >= 0.5 && this.shown !== this.id) this.build(this.id);
    } else if (this.shown !== this.id) this.build(this.id);
    const drop = this.switchT < 1 ? Math.sin(this.switchT * Math.PI) * 0.45 : 0;
    // walking bob
    const walk = onGround || swimming ? moving : 0;
    this.bobAmt += (walk - this.bobAmt) * Math.min(1, dt * 8);
    this.phase += dt * (swimming ? 5 : 9) * Math.max(0.3, moving);
    const bx = Math.sin(this.phase) * 0.025 * this.bobAmt, by = -Math.abs(Math.cos(this.phase)) * 0.03 * this.bobAmt;
    // swing: a quick chop forward and down
    if (this.swingT < 1) this.swingT = Math.min(1, this.swingT + dt / 0.28);
    const s = Math.sin(this.swingT * Math.PI), s2 = Math.sin(Math.sqrt(this.swingT) * Math.PI);
    const e = this.eating, chew = Math.abs(Math.sin(performance.now() / 90)) * 0.03 * e;
    this.root.position.set(0.42 + bx - 0.25 * e, -0.42 + by - drop + 0.12 * e - chew, -0.62 + 0.08 * e);
    this.root.rotation.set(-0.7 * s, -0.5 * s2 + 0.6 * e, -0.2 * s);
    // arm runs from below the screen up to the hand
    this.arm.position.set(0.03, 0.02, -0.04);
    this.arm.rotation.set(0.3, 0.2, 0);
    this.hand.position.set(0, 0, -0.1);
    // colours: skin and sleeve, and everything follows the light where you stand
    lightColour(this.light, light);
    this.armMat.color.copy(this.skin).multiply(this.light);
    this.sleeve.material.color.copy(this.shirt).multiply(this.light);
    if (this.item) this.item.material.color.copy(this.light);
  }

  render(renderer) {
    const ac = renderer.autoClear;
    renderer.autoClear = false;
    renderer.clearDepth();
    renderer.render(this.scene, this.camera);
    renderer.autoClear = ac;
  }
}

// ---------- a whole person ----------

export class Avatar {
  constructor(look, atlasTex, iconCanvases, ITEMS) {
    this.atlas = atlasTex; this.icons = iconCanvases; this.ITEMS = ITEMS;
    this.root = new THREE.Group();
    this.body = new THREE.Group(); // tilts forward to swim
    this.root.add(this.body);
    this.mat = new THREE.MeshBasicMaterial({ vertexColors: true });
    this.geos = [];
    this.parts = {};
    this.heldId = 0; this.held = null;
    this.phase = 0; this.swingT = 1; this.swim = 0; this.walk = 0;
    this.light = new THREE.Color(1, 1, 1);
    this.setLook(look);
  }

  box(parent, size, color, pos) {
    const g = shadedBox(...size, color);
    this.geos.push(g);
    const m = new THREE.Mesh(g, this.mat);
    m.position.set(...pos);
    parent.add(m);
    return m;
  }

  pivot(parent, pos) { const p = new THREE.Group(); p.position.set(...pos); parent.add(p); return p; }

  setLook(look) {
    this.look = { ...look };
    for (const c of [...this.body.children]) this.body.remove(c);
    for (const g of this.geos) g.dispose();
    this.geos = [];
    const skin = lookColour(look, 'skin'), hair = lookColour(look, 'hair'), shirt = lookColour(look, 'shirt'), pants = lookColour(look, 'trousers');
    const shoe = 0x3a2a20, dark = 0x1a1a22;
    const B = this.body;
    // legs, on hip pivots
    const legL = this.pivot(B, [-0.12, 0.76, 0]), legR = this.pivot(B, [0.12, 0.76, 0]);
    for (const leg of [legL, legR]) {
      this.box(leg, [0.23, 0.62, 0.25], pants, [0, -0.31, 0]);
      this.box(leg, [0.24, 0.13, 0.28], shoe, [0, -0.69, -0.015]);
    }
    // body
    this.box(B, [0.5, 0.66, 0.27], shirt, [0, 1.09, 0]);
    this.box(B, [0.5, 0.06, 0.28], pants, [0, 0.79, 0]); // belt line
    // arms, on shoulder pivots
    const armL = this.pivot(B, [-0.34, 1.38, 0]), armR = this.pivot(B, [0.34, 1.38, 0]);
    for (const arm of [armL, armR]) {
      this.box(arm, [0.19, 0.26, 0.22], shirt, [0, -0.1, 0]);
      this.box(arm, [0.17, 0.42, 0.19], skin, [0, -0.43, 0]);
    }
    const hand = this.pivot(armR, [0, -0.62, -0.02]);
    // head, on a neck pivot
    const head = this.pivot(B, [0, 1.42, 0]);
    this.box(head, [0.42, 0.42, 0.42], skin, [0, 0.21, 0]);
    this.box(head, [0.45, 0.12, 0.45], hair, [0, 0.4, 0.0]); // top
    this.box(head, [0.45, 0.3, 0.08], hair, [0, 0.27, 0.2]); // back
    this.box(head, [0.06, 0.18, 0.4], hair, [-0.21, 0.32, 0.03]);
    this.box(head, [0.06, 0.18, 0.4], hair, [0.21, 0.32, 0.03]);
    this.box(head, [0.08, 0.06, 0.02], 0xffffff, [-0.09, 0.24, -0.212]);
    this.box(head, [0.08, 0.06, 0.02], 0xffffff, [0.09, 0.24, -0.212]);
    this.box(head, [0.04, 0.06, 0.02], dark, [-0.075, 0.24, -0.222]);
    this.box(head, [0.04, 0.06, 0.02], dark, [0.075, 0.24, -0.222]);
    this.box(head, [0.12, 0.03, 0.02], 0x8a4a3a, [0, 0.12, -0.212]);
    // (v44) a glider, shown while it's open
    const glider = gliderGroup(this.mat, this.geos);
    glider.position.set(0, 2.9, 0.1); // (the bar just at your raised hands)
    glider.visible = false;
    this.body.add(glider);
    this.parts = { legL, legR, armL, armR, head, hand, glider };
    this.heldShown = -1;
  }

  setHeld(id) { this.heldId = id || 0; }
  swing() { if (this.swingT > 0.55) this.swingT = 0; }

  buildHeld() {
    const hand = this.parts.hand;
    if (this.held) { hand.remove(this.held); this.held.material.dispose(); this.held = null; }
    this.heldShown = this.heldId;
    if (!this.heldId) return;
    const mesh = heldMesh(this.heldId, this.atlas, this.icons);
    if (!mesh) return;
    if (mesh.userData.cube) { mesh.scale.setScalar(0.24); mesh.position.set(0, -0.06, -0.1); }
    else if (toolLike(this.heldId, this.ITEMS)) { mesh.scale.setScalar(0.5); mesh.rotation.set(-0.1, Math.PI / 2, 0.8); mesh.position.set(0, 0.06, -0.14); }
    else { mesh.scale.setScalar(0.32); mesh.rotation.set(0, Math.PI / 2, 0); mesh.position.set(0, -0.04, -0.1); }
    this.held = mesh;
    hand.add(mesh);
  }

  // state: { pos, yaw, pitch, speed (blocks/s), swimming, onGround, light: { sun, torch, ambient } }
  update(dt, { pos, yaw, pitch = 0, speed = 0, swimming = false, onGround = true, gliding = false, light }) {
    if (this.heldShown !== this.heldId) this.buildHeld();
    const P = this.parts;
    this.root.position.copy(pos);
    this.root.rotation.y = yaw;
    this.swim += ((swimming ? 1 : 0) - this.swim) * Math.min(1, dt * 4);
    this.walk += (Math.min(1, speed / 4) - this.walk) * Math.min(1, dt * 8);
    this.phase += dt * (swimming ? 4 : 2 + speed * 2.2);
    const sw = Math.sin(this.phase) * this.walk * (onGround || swimming ? 1 : 0.3);
    // swimming: lie forward and kick; arms sweep in a crawl
    this.body.rotation.x = -1.25 * this.swim;
    this.body.position.y = 0.55 * this.swim;
    P.legL.rotation.x = sw * 0.8 * (1 - this.swim) + Math.sin(this.phase * 2) * 0.4 * this.swim;
    P.legR.rotation.x = -sw * 0.8 * (1 - this.swim) - Math.sin(this.phase * 2) * 0.4 * this.swim;
    if (this.swingT < 1) this.swingT = Math.min(1, this.swingT + dt / 0.3);
    const chop = Math.sin(this.swingT * Math.PI);
    const crawl = this.phase;
    P.armL.rotation.x = -sw * 0.7 * (1 - this.swim) + (-Math.PI + Math.sin(crawl) * 1.3) * this.swim * 0.8;
    P.armR.rotation.x = sw * 0.7 * (1 - this.swim) - (this.heldId ? 0.3 : 0) - chop * 1.6 + (-Math.PI - Math.sin(crawl) * 1.3) * this.swim * 0.8;
    P.armR.rotation.z = -chop * 0.3;
    P.head.rotation.x = -pitch * 0.8 + 1.0 * this.swim;
    // (v44) gliding: hang from the bar, arms up, legs trailing
    this.glide = (this.glide ?? 0) + ((gliding ? 1 : 0) - (this.glide ?? 0)) * Math.min(1, dt * 6);
    P.glider.visible = this.glide > 0.5;
    if (this.glide > 0.01) {
      const k = this.glide;
      P.armL.rotation.x += (-Math.PI * 0.92 - P.armL.rotation.x) * k;
      P.armR.rotation.x += (-Math.PI * 0.92 - P.armR.rotation.x) * k;
      P.legL.rotation.x *= 1 - k * 0.8; P.legR.rotation.x *= 1 - k * 0.8;
      this.body.rotation.x += -0.35 * k;
      P.glider.rotation.x = 0.35 * k; // (the wing stays level while you lean)
    }
    lightColour(this.light, light);
    this.mat.color.copy(this.light);
    if (this.held) this.held.material.color.copy(this.light);
  }

  dispose() {
    for (const g of this.geos) g.dispose();
    this.mat.dispose();
    this.held?.material.dispose();
    this.root.parent?.remove(this.root);
  }
}
