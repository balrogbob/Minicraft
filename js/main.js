import * as THREE from 'three';
import {
  BLOCKS, RECIPES, TABLE, AIR, GRASS, SAND, WATER, TORCH, TORCH_WALL_W, WALL_TORCH_DIRS,
  isBlock, isTorch, itemName, breakTime, dropFor,
} from './blocks.js';
import { createAtlas, createIcons, createCrackCanvases, createWaterCanvas } from './textures.js';
import { World, W } from './world.js';
import { Sky } from './sky.js';
import { Sound } from './sound.js';
import { Player } from './player.js';
import { Inventory, SLOTS } from './inventory.js';
import { Controls } from './controls.js';

const SAVE_KEY = 'minicraft-save-v1';
const SETTINGS_KEY = 'minicraft-settings-v1';
const REACH = 5.5;
const $ = (id) => document.getElementById(id);

// ---------- storage (never trusted to exist) ----------
function loadSave() {
  try { return JSON.parse(localStorage.getItem(SAVE_KEY)); } catch { return null; }
}
function writeSave(obj) {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(obj)); return true; } catch { return false; }
}
// Settings live apart from the world so they survive "New world".
const settings = (() => {
  try { return { sens: 6, volume: 70, ...JSON.parse(localStorage.getItem(SETTINGS_KEY)) }; } catch { return { sens: 6, volume: 70 }; }
})();
function saveSettings() {
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); } catch { /* storage unavailable */ }
}

// ---------- renderer / scene ----------
const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
renderer.setSize(window.innerWidth, window.innerHeight);
$('game').prepend(renderer.domElement);

const SKY = 0x87c5f5;
const scene = new THREE.Scene();
scene.background = new THREE.Color(SKY);
scene.fog = new THREE.Fog(SKY, 38, 80);

const camera = new THREE.PerspectiveCamera(72, window.innerWidth / window.innerHeight, 0.05, 160);
camera.rotation.order = 'YXZ';

const atlasCanvas = createAtlas();
const atlas = new THREE.CanvasTexture(atlasCanvas);
atlas.magFilter = THREE.NearestFilter;
atlas.minFilter = THREE.NearestFilter;
atlas.generateMipmaps = false;
atlas.colorSpace = THREE.SRGBColorSpace;
const material = new THREE.MeshBasicMaterial({ map: atlas, vertexColors: true, alphaTest: 0.5 });

// World lighting: each pixel gets max(daylight, torch light), so torches glow at night and
// barely matter at noon. Daylight is a uniform (set by the sky); torch light is a vertex attribute.
const lightUniforms = { uDay: { value: 1 }, uFlicker: { value: 1 } };
function addTorchLight(mat) {
  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, lightUniforms);
    shader.vertexShader = 'attribute float torch;\nvarying float vTorch;\n' + shader.vertexShader
      .replace('#include <color_vertex>', '#include <color_vertex>\nvTorch = torch;');
    shader.fragmentShader = 'uniform float uDay;\nuniform float uFlicker;\nvarying float vTorch;\n' + shader.fragmentShader
      .replace('#include <color_fragment>',
        '#include <color_fragment>\ndiffuseColor.rgb *= max(vec3(uDay), vTorch * uFlicker * vec3(1.0, 0.86, 0.66));');
  };
}
addTorchLight(material);

const waterTex = new THREE.CanvasTexture(createWaterCanvas());
waterTex.wrapS = waterTex.wrapT = THREE.RepeatWrapping;
waterTex.magFilter = THREE.NearestFilter;
waterTex.minFilter = THREE.NearestFilter;
waterTex.generateMipmaps = false;
waterTex.colorSpace = THREE.SRGBColorSpace;
const waterMat = new THREE.MeshBasicMaterial({
  map: waterTex, vertexColors: true, transparent: true, opacity: 0.72, side: THREE.DoubleSide, depthWrite: false,
});
addTorchLight(waterMat);
const materials = { solid: material, water: waterMat };

const sky = new Sky(scene);
const sound = new Sound();
sound.volume = settings.volume / 100;
// audio may only start after a user gesture
for (const ev of ['touchstart', 'pointerdown', 'keydown']) {
  window.addEventListener(ev, () => sound.unlock(), { capture: true, passive: true });
}

const icons = createIcons(atlasCanvas);

// block highlight + break cracks
const highlight = new THREE.LineSegments(
  new THREE.EdgesGeometry(new THREE.BoxGeometry(1.004, 1.004, 1.004)),
  new THREE.LineBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.55 }),
);
highlight.visible = false;
scene.add(highlight);

const crackTextures = createCrackCanvases().map((c) => {
  const t = new THREE.CanvasTexture(c);
  t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter; t.generateMipmaps = false;
  return t;
});
const crackMat = new THREE.MeshBasicMaterial({
  map: crackTextures[0], transparent: true, depthWrite: false,
  polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
});
const crack = new THREE.Mesh(new THREE.BoxGeometry(1.002, 1.002, 1.002), crackMat);
crack.visible = false;
scene.add(crack);

// ---------- game state ----------
let world, player, controls;
const inventory = new Inventory();
let paused = true;
let target = null; // raycast hit
const breakState = { key: '', progress: 0 };
let tableOpen = false;

function newSeed() { return (Math.random() * 2 ** 31) | 0; }

async function startWorld(save) {
  paused = true;
  $('loading').classList.remove('hidden');
  if (world) world.dispose(scene);
  const seed = save?.seed ?? newSeed();
  world = new World(seed);
  $('load-text').textContent = 'Generating terrain…';
  setProgress(0.05);
  await nextFrame();
  world.generate();
  if (save?.mods) world.applyMods(save.mods);
  world.computeAllLight();

  if (!player) player = new Player(world);
  player.world = world;
  inventory.slots.fill(null);
  inventory.selected = 0;
  if (save?.inv) inventory.load(save.inv);
  inventory.onChange();

  if (save?.player && Number.isFinite(save.player.x)) {
    player.spawn(save.player.x, save.player.y, save.player.z);
    player.yaw = save.player.yaw || 0;
    player.pitch = save.player.pitch || 0;
  } else {
    respawn();
  }
  if (save && typeof save.autoJump === 'boolean') player.autoJump = save.autoJump;
  sky.time = Number.isFinite(save?.time) ? save.time : 0.02;
  updateAutoJumpLabel();

  // mesh every chunk with a progress bar, nearest first
  $('load-text').textContent = 'Building chunks…';
  const total = world.dirty.size;
  while (world.dirty.size) {
    world.remeshDirty(scene, materials, player.pos.x, player.pos.z, 4);
    setProgress(0.1 + 0.9 * (1 - world.dirty.size / total));
    await nextFrame();
  }
  $('loading').classList.add('hidden');
  paused = false;
  if (!save) toast('Hold on a tree to punch it and collect logs.<br>Tap 🎒 to craft.', 5000);
  save || saveGame();
}

function respawn() {
  // walk diagonally from the centre until we find open ground with no tree overhead nearby
  const clear = (x, z) => {
    for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) {
      const top = world.get(x + dx, world.heightAt(x + dx, z + dz), z + dz);
      if (top !== GRASS && top !== SAND) return false;
    }
    return true;
  };
  // search outward from the centre in growing square rings
  const c = Math.floor(W / 2);
  let sx = c, sz = c;
  search: for (let r = 0; r < c - 3; r += 2) {
    for (let dz = -r; dz <= r; dz += 2) for (let dx = -r; dx <= r; dx += 2) {
      if (Math.max(Math.abs(dx), Math.abs(dz)) !== r) continue;
      if (clear(c + dx, c + dz)) { sx = c + dx; sz = c + dz; break search; }
    }
  }
  player.spawn(sx + 0.5, world.heightAt(sx, sz) + 1, sz + 0.5);
  player.yaw = Math.PI * 0.25;
  player.pitch = -0.2;
}

function setProgress(f) { $('load-bar').style.width = Math.round(f * 100) + '%'; }
const nextFrame = () => new Promise((r) => requestAnimationFrame(() => r()));

function saveGame() {
  if (!world || !player) return false;
  return writeSave({
    seed: world.seed,
    mods: [...world.mods],
    inv: inventory.serialize(),
    player: { x: player.pos.x, y: player.pos.y, z: player.pos.z, yaw: player.yaw, pitch: player.pitch },
    autoJump: player.autoJump,
    time: sky.time,
  });
}

// ---------- HUD ----------
let toastTimer;
function toast(html, ms = 2200) {
  const el = $('toast');
  el.innerHTML = html;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), ms);
}

let nameTimer;
function showItemName() {
  const id = inventory.heldId();
  const el = $('item-name');
  el.textContent = id ? itemName(id) : '';
  el.classList.add('show');
  clearTimeout(nameTimer);
  nameTimer = setTimeout(() => el.classList.remove('show'), 1200);
}

function slotHTML(s) {
  if (!s) return '';
  return `<img src="${icons[s.id]}" alt=""><span class="count">${s.count > 1 ? s.count : ''}</span>`;
}

const hotbarEls = [];
for (let i = 0; i < 9; i++) {
  const el = document.createElement('div');
  el.className = 'slot';
  el.addEventListener('pointerdown', (e) => { e.preventDefault(); selectSlot(i); });
  $('hotbar').appendChild(el);
  hotbarEls.push(el);
}

function renderHotbar() {
  for (let i = 0; i < 9; i++) {
    hotbarEls[i].innerHTML = slotHTML(inventory.slots[i]);
    hotbarEls[i].classList.toggle('selected', i === inventory.selected);
  }
}

function selectSlot(i) {
  inventory.selected = i;
  renderHotbar();
  showItemName();
}

inventory.onChange = () => {
  renderHotbar();
  if (!$('inventory').classList.contains('hidden')) renderInventory();
};

// ---------- inventory / crafting UI ----------
let picked = -1;
const invEls = [];
function buildInventoryGrid() {
  const make = (i, parent) => {
    const el = document.createElement('div');
    el.className = 'slot';
    el.addEventListener('click', () => onInvSlot(i));
    parent.appendChild(el);
    invEls[i] = el;
  };
  for (let i = 9; i < SLOTS; i++) make(i, $('inv-grid'));
  for (let i = 0; i < 9; i++) make(i, $('inv-hotbar'));
}
buildInventoryGrid();

function onInvSlot(i) {
  if (picked < 0) {
    if (inventory.slots[i]) picked = i;
  } else {
    inventory.moveSlot(picked, i);
    picked = -1;
  }
  renderInventory();
}

function nearTable() {
  const p = player.pos;
  const bx = Math.floor(p.x), by = Math.floor(p.y), bz = Math.floor(p.z);
  for (let y = by - 2; y <= by + 3; y++) for (let z = bz - 4; z <= bz + 4; z++) for (let x = bx - 4; x <= bx + 4; x++) {
    if (world.get(x, y, z) === TABLE) return true;
  }
  return false;
}

function renderInventory() {
  for (let i = 0; i < SLOTS; i++) {
    invEls[i].innerHTML = slotHTML(inventory.slots[i]);
    invEls[i].classList.toggle('picked', i === picked);
  }
  const hasTable = tableOpen || nearTable();
  $('table-status').textContent = hasTable ? '— crafting table nearby' : '— place a crafting table to unlock more';
  const list = $('recipes');
  list.innerHTML = '';
  RECIPES.forEach((r) => {
    const haveAll = r.in.every(([id, n]) => inventory.count(id) >= n);
    const canMake = haveAll && (!r.table || hasTable) && inventory.room(r.out[0]) >= r.out[1];
    const row = document.createElement('div');
    row.className = 'recipe' + (!r.table || hasTable ? '' : ' locked');
    const ings = r.in.map(([id, n]) => {
      const miss = inventory.count(id) < n ? ' missing' : '';
      return `<span class="ing${miss}" title="${itemName(id)}"><img src="${icons[id]}" alt="">${n}</span>`;
    }).join('');
    row.innerHTML = `${ings}<span class="arrow">→</span><img class="outimg" src="${icons[r.out[0]]}" alt="">` +
      `<span class="name">${r.out[1] > 1 ? r.out[1] + ' × ' : ''}${itemName(r.out[0])}${r.table ? ' 🛠' : ''}</span>`;
    const btn = document.createElement('button');
    btn.className = 'btn';
    btn.textContent = 'Craft';
    btn.disabled = !canMake;
    btn.addEventListener('click', () => {
      if (!(r.in.every(([id, n]) => inventory.count(id) >= n))) return;
      for (const [id, n] of r.in) inventory.remove(id, n);
      inventory.add(r.out[0], r.out[1]);
      sound.pop();
    });
    row.appendChild(btn);
    list.appendChild(row);
  });
}

function openInventory(atTable = false) {
  const loading = !$('loading').classList.contains('hidden');
  if (!world || loading) return;
  tableOpen = atTable;
  picked = -1;
  paused = true;
  controls.reset();
  document.exitPointerLock?.();
  $('inventory').classList.remove('hidden');
  renderInventory();
}
function closeInventory() {
  $('inventory').classList.add('hidden');
  paused = false;
  tableOpen = false;
}
function toggleInventory() {
  if ($('inventory').classList.contains('hidden')) {
    if ($('menu').classList.contains('hidden')) openInventory();
  } else closeInventory();
}

// ---------- actions ----------
function place() {
  if (paused || !target) return;
  if (target.id === TABLE) { sound.click(); openInventory(true); return; }
  const held = inventory.held();
  if (!held || !isBlock(held.id)) return;
  const x = target.x + target.nx, y = target.y + target.ny, z = target.z + target.nz;
  const there = world.get(x, y, z);
  if (!world.inBounds(x, y, z) || (there !== AIR && there !== WATER)) return;
  let id = held.id;
  if (id === TORCH) {
    // torches need a solid block to stand on or hang from, and can't go underwater or on ceilings
    if (there !== AIR || target.ny < 0 || !BLOCKS[target.id].solid || isTorch(target.id)) return;
    if (target.ny === 0) id = TORCH_WALL_W + WALL_TORCH_DIRS.findIndex(([dx, dz]) => dx === -target.nx && dz === -target.nz);
  } else if (player.overlapsBlock(x, y, z)) return;
  world.setBlock(x, y, z, id);
  sound.place(BLOCKS[id].sound);
  inventory.consumeHeld();
}

function updateBreaking(dt) {
  if (!controls.breaking || !target) {
    breakState.key = ''; breakState.progress = 0; breakState.tick = 0;
    crack.visible = false;
    return;
  }
  const key = `${target.x},${target.y},${target.z}`;
  if (key !== breakState.key) { breakState.key = key; breakState.progress = 0; }
  const held = inventory.heldId();
  const t = breakTime(target.id, held);
  if (!isFinite(t)) { crack.visible = false; return; }
  breakState.progress += dt / Math.max(t, 0.05);
  breakState.tick = (breakState.tick || 0) - dt;
  if (breakState.tick <= 0) { sound.dig(BLOCKS[target.id].sound); breakState.tick = 0.24; }
  if (breakState.progress >= 1) {
    breakBlock(target.x, target.y, target.z);
    breakState.key = ''; breakState.progress = 0;
    crack.visible = false;
    target = null;
    return;
  }
  crack.visible = true;
  crack.position.set(target.x + 0.5, target.y + 0.5, target.z + 0.5);
  const stage = Math.min(crackTextures.length - 1, Math.floor(breakState.progress * crackTextures.length));
  if (crackMat.map !== crackTextures[stage]) { crackMat.map = crackTextures[stage]; crackMat.needsUpdate = true; }
}

// Remove a block, collecting what it drops with the held item.
function breakBlock(x, y, z) {
  const id = world.get(x, y, z);
  const def = BLOCKS[id];
  if (!def || id === AIR) return;
  sound.breakBlock(def.sound);
  const drop = dropFor(id, inventory.heldId());
  world.setBlock(x, y, z, AIR);
  dropUnsupportedTorches(x, y, z);
  if (drop) {
    if (inventory.add(drop, 1) > 0) toast('Inventory full');
  } else if (def.needsTool) {
    toast(`You need a ${def.tool === 'pick' ? 'pickaxe' : def.tool} to collect ${def.name}`);
  }
}

// Torches standing on, or hanging from, a block that was just removed pop off into the inventory.
function dropUnsupportedTorches(x, y, z) {
  const check = [[x, y + 1, z, TORCH]];
  WALL_TORCH_DIRS.forEach(([dx, dz], i) => check.push([x - dx, y, z - dz, TORCH_WALL_W + i]));
  for (const [tx, ty, tz, id] of check) {
    if (world.get(tx, ty, tz) !== id) continue;
    world.setBlock(tx, ty, tz, AIR);
    inventory.add(TORCH, 1);
  }
}

// ---------- menu ----------
function updateAutoJumpLabel() { $('btn-autojump').textContent = `Auto-jump: ${player?.autoJump ? 'on' : 'off'}`; }
$('btn-menu').addEventListener('click', () => {
  paused = true; controls.reset(); document.exitPointerLock?.();
  $('menu').classList.remove('hidden');
});
$('btn-close-menu').addEventListener('click', () => { $('menu').classList.add('hidden'); paused = false; });
$('btn-autojump').addEventListener('click', () => { player.autoJump = !player.autoJump; updateAutoJumpLabel(); saveGame(); });
$('btn-save').addEventListener('click', () => toast(saveGame() ? 'World saved' : 'Could not save (storage unavailable)'));
$('btn-new').addEventListener('click', () => {
  if (!confirm('Start a new world? Your current world will be lost.')) return;
  $('menu').classList.add('hidden');
  startWorld(null);
});
$('sens').value = settings.sens;
$('sens').addEventListener('input', (e) => { settings.sens = +e.target.value; controls.lookSens = settings.sens / 1000; saveSettings(); });
$('volume').value = settings.volume;
$('volume').addEventListener('input', (e) => {
  settings.volume = +e.target.value;
  sound.volume = settings.volume / 100;
  sound.applyVolume();
  saveSettings();
});
$('volume').addEventListener('change', () => sound.pop());
$('btn-inventory').addEventListener('click', () => toggleInventory());
$('btn-close-inv').addEventListener('click', closeInventory);
$('inventory').addEventListener('click', (e) => { if (e.target.id === 'inventory') closeInventory(); });
$('btn-fullscreen').addEventListener('click', async () => {
  try {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen({ navigationUI: 'hide' });
      await screen.orientation?.lock?.('landscape').catch(() => {});
    } else await document.exitFullscreen();
  } catch { /* fullscreen not supported */ }
});

const jumpBtn = $('btn-jump');
const setJump = (v) => (e) => { e.preventDefault(); controls.jumpTouch = v; };
jumpBtn.addEventListener('touchstart', setJump(true), { passive: false });
jumpBtn.addEventListener('touchend', setJump(false), { passive: false });
jumpBtn.addEventListener('touchcancel', setJump(false), { passive: false });
jumpBtn.addEventListener('mousedown', setJump(true));
jumpBtn.addEventListener('mouseup', setJump(false));

// ---------- init ----------
player = null;
controls = null;
{
  // Player must exist before Controls; startWorld re-binds the world.
  const tmp = new World(0);
  player = new Player(tmp);
  controls = new Controls($('touch-layer'), player, {
    place,
    selectSlot,
    scrollSlot: (d) => selectSlot((inventory.selected + d + 9) % 9),
    toggleInventory,
    isPaused: () => paused,
  });
  controls.lookSens = settings.sens / 1000;
}
renderHotbar();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
document.addEventListener('visibilitychange', () => { if (document.hidden) saveGame(); });
window.addEventListener('pagehide', saveGame);
setInterval(saveGame, 15000);

// ---------- movement sounds ----------
const moveSnd = { dist: 0, swim: 0 };
function groundSound() {
  const p = player.pos;
  const id = world.get(Math.floor(p.x), Math.floor(p.y - 0.05), Math.floor(p.z));
  return BLOCKS[id]?.sound ?? 'grass';
}
function playMovementSounds(dt, wasGround, wasWater, fallSpeed) {
  const speed = Math.hypot(player.vel.x, player.vel.z);
  if (!wasWater && player.inWater) sound.splash(fallSpeed > 5);
  if (player.inWater) {
    moveSnd.swim -= dt;
    if ((speed > 0.5 || controls.jump) && moveSnd.swim <= 0) { sound.splash(false); moveSnd.swim = 0.7; }
    return;
  }
  if (!wasGround && player.onGround && fallSpeed > 4) sound.step(groundSound());
  if (player.onGround && speed > 0.5) {
    moveSnd.dist += speed * dt;
    if (moveSnd.dist > 1.9) { moveSnd.dist = 0; sound.step(groundSound()); }
  }
}

// ---------- main loop ----------
let last = performance.now();
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min((now - last) / 1000, 0.05);
  last = now;
  if (!world) return;

  if (!paused) {
    controls.update();
    const wasGround = player.onGround, wasWater = player.inWater, fallSpeed = -player.vel.y;
    player.update(dt, { moveX: controls.moveX, moveZ: controls.moveZ, jump: controls.jump });
    if (player.pos.y < -20) respawn();
    playMovementSounds(dt, wasGround, wasWater, fallSpeed);
    world.tickWater(dt);
  }

  const eye = player.eye;
  camera.position.copy(eye);
  camera.rotation.set(player.pitch, player.yaw, 0);

  sky.update(paused ? 0 : dt, eye, lightUniforms.uDay, player.eyeInWater);
  lightUniforms.uFlicker.value = 0.93 + 0.04 * Math.sin(now * 0.011) + 0.03 * Math.sin(now * 0.029);
  $('underwater').classList.toggle('show', player.eyeInWater);
  waterTex.offset.x = (waterTex.offset.x + dt * 0.06) % 1;
  waterTex.offset.y = (waterTex.offset.y + dt * 0.025) % 1;

  target = paused ? null : world.raycast(eye, player.lookDir(), REACH);
  if (target) {
    highlight.visible = true;
    highlight.position.set(target.x + 0.5, target.y + 0.5, target.z + 0.5);
  } else highlight.visible = false;

  if (!paused) updateBreaking(dt);
  else crack.visible = false;

  world.remeshDirty(scene, materials, player.pos.x, player.pos.z, 3);
  renderer.render(scene, camera);
}
requestAnimationFrame(frame);

startWorld(loadSave());

// expose for debugging in the console
window.minicraft = { get world() { return world; }, player, inventory, saveGame, sky, sound, breakBlock };
