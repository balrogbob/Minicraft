import * as THREE from 'three';
import { BLOCKS, RECIPES, TABLE, AIR, GRASS, SAND, isBlock, itemName, breakTime, dropFor } from './blocks.js';
import { createAtlas, createIcons, createCrackCanvases } from './textures.js';
import { World, W } from './world.js';
import { Player } from './player.js';
import { Inventory, SLOTS } from './inventory.js';
import { Controls } from './controls.js';

const SAVE_KEY = 'minicraft-save-v1';
const REACH = 5.5;
const $ = (id) => document.getElementById(id);

// ---------- storage (never trusted to exist) ----------
function loadSave() {
  try { return JSON.parse(localStorage.getItem(SAVE_KEY)); } catch { return null; }
}
function writeSave(obj) {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(obj)); return true; } catch { return false; }
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
  updateAutoJumpLabel();

  // mesh every chunk with a progress bar, nearest first
  $('load-text').textContent = 'Building chunks…';
  const total = world.dirty.size;
  while (world.dirty.size) {
    world.remeshDirty(scene, material, player.pos.x, player.pos.z, 4);
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
  let sx = Math.floor(W / 2), sz = sx;
  for (let r = 0; r < 40; r++) {
    if (clear(sx + r, sz + r)) { sx += r; sz += r; break; }
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
  if (target.id === TABLE) { openInventory(true); return; }
  const held = inventory.held();
  if (!held || !isBlock(held.id)) return;
  const x = target.x + target.nx, y = target.y + target.ny, z = target.z + target.nz;
  if (!world.inBounds(x, y, z) || world.get(x, y, z) !== AIR) return;
  if (player.overlapsBlock(x, y, z)) return;
  world.setBlock(x, y, z, held.id);
  inventory.consumeHeld();
}

function updateBreaking(dt) {
  if (!controls.breaking || !target) {
    breakState.key = ''; breakState.progress = 0;
    crack.visible = false;
    return;
  }
  const key = `${target.x},${target.y},${target.z}`;
  if (key !== breakState.key) { breakState.key = key; breakState.progress = 0; }
  const held = inventory.heldId();
  const t = breakTime(target.id, held);
  if (!isFinite(t)) { crack.visible = false; return; }
  breakState.progress += dt / Math.max(t, 0.05);
  if (breakState.progress >= 1) {
    const drop = dropFor(target.id, held);
    world.setBlock(target.x, target.y, target.z, AIR);
    if (drop) {
      if (inventory.add(drop, 1) > 0) toast('Inventory full');
    } else if (BLOCKS[target.id]?.needsTool) {
      toast(`You need a ${BLOCKS[target.id].tool === 'pick' ? 'pickaxe' : BLOCKS[target.id].tool} to collect ${BLOCKS[target.id].name}`);
    }
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
$('sens').addEventListener('input', (e) => { controls.lookSens = e.target.value / 1000; });
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

// ---------- main loop ----------
let last = performance.now();
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min((now - last) / 1000, 0.05);
  last = now;
  if (!world) return;

  if (!paused) {
    controls.update();
    player.update(dt, { moveX: controls.moveX, moveZ: controls.moveZ, jump: controls.jump });
    if (player.pos.y < -20) respawn();
  }

  const eye = player.eye;
  camera.position.copy(eye);
  camera.rotation.set(player.pitch, player.yaw, 0);

  target = paused ? null : world.raycast(eye, player.lookDir(), REACH);
  if (target) {
    highlight.visible = true;
    highlight.position.set(target.x + 0.5, target.y + 0.5, target.z + 0.5);
  } else highlight.visible = false;

  if (!paused) updateBreaking(dt);
  else crack.visible = false;

  world.remeshDirty(scene, material, player.pos.x, player.pos.z, 3);
  renderer.render(scene, camera);
}
requestAnimationFrame(frame);

startWorld(loadSave());

// expose for debugging in the console
window.minicraft = { get world() { return world; }, player, inventory, saveGame };
