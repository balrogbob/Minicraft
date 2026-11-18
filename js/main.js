import * as THREE from 'three';
import {
  BLOCKS, RECIPES, TABLE, AIR, WATER, TORCH, TORCH_WALL_W, WALL_TORCH_DIRS,
  GRASS, DIRT, SAND, CHURN, SUGAR_CANE, BREAD, ITEMS, BOW, ARROW, BUCKET,
  WOOD_PICK, STONE_PICK, WOOD_AXE, STONE_AXE, WOOD_SHOVEL, STONE_SHOVEL,
  BED, BED_FOOT, CHAIR, LAMP, CARPET, CURTAIN, DOOR, SLIME_FUEL, FACING_DIRS, MAX_LAMP_FUEL,
  isBed, isChair, isLamp, isCurtain, isDoor, doorId,
  OVEN, SMELTER, stationKind, maxStack, FISHING_ROD, RAW_FISH, TOOL_TIERS,
  isBlock, isTorch, isWheat, itemName, breakTime, dropsFor, foodValue,
} from './blocks.js';
import { createAtlas, createIcons, createCrackCanvases, createWaterCanvas, createHudIcons } from './textures.js';
import { World, CHUNK, WORLD_SIZE, chunkKey } from './world.js';
import { localIndex, CHUNK_VOLUME, H } from './terrain.js';
import { ChunkStore } from './store.js';
import { buildLegacyWorld, LEGACY_W } from './legacy.js';
import { Sky, DAY_LENGTH } from './sky.js';
import { Sound } from './sound.js';
import { Player } from './player.js';
import { Inventory, SLOTS } from './inventory.js';
import { Controls } from './controls.js';
import { MobManager, DIFFICULTY, DIFFICULTY_ORDER } from './mobs.js';
import { ArrowManager } from './arrows.js';
import { Stations, STATION_KINDS, isFuel } from './stations.js';
import { Fishing } from './fishing.js';

// v2 = the 16k x 16k streaming world (player state here, edited chunks in IndexedDB).
// v1 = the old 128 x 128 world, migrated into the middle of the big world on first launch.
const GAME_VERSION = '14'; // shown in the menu; bump with each release
const SAVE_KEY = 'minicraft-save-v2';
const LEGACY_SAVE_KEY = 'minicraft-save-v1';
const SETTINGS_KEY = 'minicraft-settings-v1';
const REACH = 5.5;
const $ = (id) => document.getElementById(id);

// ---------- storage (never trusted to exist) ----------
function loadSave(key = SAVE_KEY) {
  try { return JSON.parse(localStorage.getItem(key)); } catch { return null; }
}
function writeSave(obj) {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(obj)); return true; } catch { return false; }
}
// Settings live apart from the world so they survive "New world".
const settings = (() => {
  const defaults = { sens: 6, volume: 70, viewDistance: 6, perf: false, difficulty: 'worrying' };
  try { return { ...defaults, ...JSON.parse(localStorage.getItem(SETTINGS_KEY)) }; } catch { return defaults; }
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

// World lighting: each pixel gets max(daylight x sunlight, torch light, faint ambient).
// Sunlight and torch light are baked per vertex (how much of each reaches that spot);
// daylight is a uniform set by the sky, so nights darken everything the sun reaches,
// caves stay dark all day, and torches glow wherever they are.
const AMBIENT = 0.03; // linear; just enough to make out cave walls without a torch
const lightUniforms = { uDay: { value: 1 }, uFlicker: { value: 1 } };
function addTorchLight(mat) {
  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, lightUniforms);
    shader.vertexShader = 'attribute float torch;\nattribute float sky;\nvarying float vTorch;\nvarying float vSky;\n' + shader.vertexShader
      .replace('#include <color_vertex>', '#include <color_vertex>\nvTorch = torch;\nvSky = sky;');
    shader.fragmentShader = 'uniform float uDay;\nuniform float uFlicker;\nvarying float vTorch;\nvarying float vSky;\n' + shader.fragmentShader
      .replace('#include <color_fragment>',
        '#include <color_fragment>\ndiffuseColor.rgb *= max(vec3(max(uDay * vSky, ' + AMBIENT.toFixed(3) + ')), vTorch * uFlicker * vec3(1.0, 0.86, 0.66));');
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
const mobs = new MobManager(scene, sound);
const arrows = new ArrowManager(scene, sound);
const fishing = new Fishing(scene, sound);

// ---------- night creatures ----------
const difficulty = () => DIFFICULTY[settings.difficulty] ?? DIFFICULTY.worrying;
// How hard each thing in your hand hits a creature (bare hand: 2). Creatures have 10-30 health.
const WEAPON_DAMAGE = { [WOOD_SHOVEL]: 3, [STONE_SHOVEL]: 4, [WOOD_PICK]: 3, [STONE_PICK]: 4, [WOOD_AXE]: 4, [STONE_AXE]: 6 };
let lastSwing = 0; // time of the last swing at a creature (a short pause between swings, in real time)

// A creature's hit knocks you back away from it.
mobs.onHurtPlayer = (amount, cause, from) => {
  if (dead) return;
  const dx = player.pos.x - from.x, dz = player.pos.z - from.z, len = Math.hypot(dx, dz) || 1;
  player.kx = (dx / len) * 7; player.kz = (dz / len) * 7;
  if (player.onGround) player.vel.y = 4.5;
  damage(amount, cause);
};
mobs.onShoot = (origin, dir, dmg) => arrows.shootThorn(origin, dir, dmg);

function giveDrops(drops) {
  for (const [id, n] of drops) {
    if (inventory.add(id, n) > 0) toast('Inventory full');
    else { toast(`+${n} ${itemName(id)}`, 1200); sound.pop(); }
  }
}
const hudIcons = createHudIcons();

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
let targetMob = null; // { mob, t } when the crosshair is on an animal (closer than any block)
const breakState = { key: '', progress: 0 };
let openedAt = null; // the station block (crafting table or churn) tapped to open crafting
const MAX_HUNGER = 20;
let hunger = MAX_HUNGER; // 0..20; each bread-loaf icon on the bar is 2 points
let day = 1; // days survived; goes up at each sunrise
const MAX_HEALTH = 20, MAX_AIR = 10;
let health = MAX_HEALTH; // 0..20; each heart is 2 points
let air = MAX_AIR; // seconds of breath left underwater
let poisoned = 0; // seconds of food poisoning left
let dead = false;
let fallTop = null; // highest point of the current fall, for fall damage
const timers = { regen: 0, starve: 0, poison: 0, drown: 0 };
let bowCharge = 0; // seconds the bow has been drawn (holding)
let bedSpawn = null; // { x, y, z } of the bed you last used: where you respawn
// Lit lamps: "x,y,z" -> seconds left in the fuel unit now burning (each unit lasts one in-game day).
const lamps = new Map();
const stations = new Stations(); // what's inside each oven and smelter
let caneToday = 0; // raw sugar cane eaten since sunrise: the 5th gives you food poisoning
const store = new ChunkStore();
let worldReady = false; // false while a world is loading: nothing gets saved until the player is placed

function newSeed() { return (Math.random() * 2 ** 31) | 0; }

// View distance (in chunks) drives fog and the camera's far plane.
function applyViewDistance() {
  const r = settings.viewDistance;
  if (world) world.renderDistance = r;
  sky.fogFar = r * CHUNK;
  sky.fogNear = sky.fogFar * 0.55;
  camera.far = Math.max(160, r * CHUNK + 48);
  camera.updateProjectionMatrix();
  $('view-label').textContent = `View distance: ${r * CHUNK} blocks`;
}

// The old 128 x 128 world is placed here, in the middle of the big world.
const LEGACY_OFFSET = WORLD_SIZE / 2 - LEGACY_W / 2;

// Rebuild a world saved by the previous version and store it as edited chunks in the big world.
async function migrateLegacyWorld(old) {
  $('load-text').textContent = 'Moving your world into the big world…';
  await nextFrame();
  await store.clear();
  const blocks = buildLegacyWorld(old);
  const entries = [];
  const n = LEGACY_W / CHUNK, base = LEGACY_OFFSET / CHUNK;
  for (let cz = 0; cz < n; cz++) for (let cx = 0; cx < n; cx++) {
    const data = new Uint8Array(CHUNK_VOLUME);
    for (let y = 0; y < H; y++) for (let lz = 0; lz < CHUNK; lz++) for (let lx = 0; lx < CHUNK; lx++) {
      const x = cx * CHUNK + lx, z = cz * CHUNK + lz;
      data[localIndex(lx, y, lz)] = blocks[x + z * LEGACY_W + y * LEGACY_W * LEGACY_W];
    }
    entries.push([chunkKey(base + cx, base + cz), data]);
  }
  await store.saveMany(entries);
  const p = old.player && Number.isFinite(old.player.x) ? old.player : { x: 64.5, y: 50, z: 64.5, yaw: 0, pitch: 0 };
  const save = {
    seed: old.seed,
    inv: old.inv,
    autoJump: old.autoJump,
    time: old.time,
    player: { x: p.x + LEGACY_OFFSET, y: p.y, z: p.z + LEGACY_OFFSET, yaw: p.yaw, pitch: p.pitch },
    migrated: true,
  };
  writeSave(save);
  return save;
}

async function boot() {
  $('load-text').textContent = 'Opening save…';
  if (!(await store.open())) toast('Storage is unavailable here, so this world won\'t be saved', 5000);
  let save = loadSave();
  const legacy = !save && loadSave(LEGACY_SAVE_KEY);
  if (legacy?.seed !== undefined) save = await migrateLegacyWorld(legacy);
  await startWorld(save);
  if (legacy?.seed !== undefined) toast('Your world now sits in the middle of a 16,384 × 16,384 block world.<br>Walk out past its edges to explore!', 7000);
}

async function startWorld(save) {
  worldReady = false;
  paused = true;
  $('loading').classList.remove('hidden');
  if (world) world.dispose(scene);
  if (!save) await store.clear();
  const seed = save?.seed ?? newSeed();
  world = new World(seed, store);
  world.onError = reportError;
  mobs.reset(world);
  arrows.reset();
  lastSwing = 0;
  applyViewDistance();
  $('load-text').textContent = 'Generating terrain…';
  setProgress(0);
  await nextFrame();

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
  hunger = Number.isFinite(save?.hunger) ? Math.max(0, Math.min(MAX_HUNGER, save.hunger)) : MAX_HUNGER;
  day = Number.isFinite(save?.day) ? Math.max(1, save.day | 0) : 1;
  health = Number.isFinite(save?.health) && save.health > 0 ? Math.min(MAX_HEALTH, save.health) : MAX_HEALTH;
  poisoned = Number.isFinite(save?.poisoned) ? Math.max(0, save.poisoned) : 0;
  bedSpawn = save?.bed && Number.isFinite(save.bed.x) ? save.bed : null;
  lamps.clear();
  for (const [key, secs] of save?.lamps ?? []) if (typeof key === 'string' && Number.isFinite(secs)) lamps.set(key, secs);
  stations.load(save?.stations);
  caneToday = Number.isFinite(save?.caneToday) ? save.caneToday : 0;
  air = MAX_AIR;
  dead = false;
  fallTop = null;
  $('death').classList.add('hidden');
  renderHunger();
  renderHealth();
  updateAutoJumpLabel();

  // build the area around the player before starting; the rest streams in while playing
  for (;;) {
    world.update(player.pos.x, player.pos.z, scene, materials, 40);
    const ready = world.readiness(player.pos.x, player.pos.z, 2);
    setProgress(ready);
    if (ready >= 1) break;
    await nextFrame();
  }
  $('loading').classList.add('hidden');
  worldReady = true;
  paused = false;
  if (!save) toast('Hold on a tree to punch it and collect logs.<br>Tap 🎒 to craft.', 5000);
  save || saveGame();
}

function respawn() {
  // at your bed if you've slept in one (and it's still there)
  if (bedSpawn) {
    const b = bedSpawn;
    const loaded = !!world.chunkAt(b.x, b.z);
    if (!loaded || isBed(world.get(b.x, b.y, b.z))) {
      player.spawn(b.x + 0.5, b.y + 1, b.z + 0.5);
      return;
    }
    bedSpawn = null;
    toast('Your bed was missing, so you woke up back where you started');
  }
  // otherwise open grass near the middle of the world, found from the terrain function (no chunks needed)
  const s = world.generator.findSpawn();
  player.spawn(s.x + 0.5, s.h + 1, s.z + 0.5);
  player.yaw = Math.PI * 0.25;
  player.pitch = -0.2;
}

function setProgress(f) { $('load-bar').style.width = Math.round(f * 100) + '%'; }
const nextFrame = () => new Promise((r) => requestAnimationFrame(() => r()));

function saveGame() {
  if (!world || !player || !worldReady) return false;
  world.saveChunks();
  return writeSave({
    seed: world.seed,
    inv: inventory.serialize(),
    player: { x: player.pos.x, y: player.pos.y, z: player.pos.z, yaw: player.yaw, pitch: player.pitch },
    autoJump: player.autoJump,
    hunger,
    day,
    health,
    poisoned,
    bed: bedSpawn,
    lamps: [...lamps],
    stations: stations.serialize(),
    caneToday,
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

// Errors are shown on screen (at most every few seconds) so problems on a tablet are visible.
let lastError = '', lastErrorShown = 0;
function reportError(err) {
  const msg = String(err?.message ?? err ?? 'unknown error');
  console.error(err);
  lastError = msg;
  if (performance.now() - lastErrorShown > 4000) {
    lastErrorShown = performance.now();
    const safe = msg.replace(/[<>&]/g, (ch) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' })[ch]);
    toast(`Something went wrong: ${safe}`, 5000);
  }
}
window.addEventListener('error', (e) => reportError(e.error ?? e.message));
window.addEventListener('unhandledrejection', (e) => reportError(e.reason));

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
  if (openStationAt) renderStation();
  if (!$('inventory').classList.contains('hidden')) renderInventory();
};

// ---------- hunger bar ----------
// Ten bread loaves above the hotbar, each worth 2 points: full, half or empty.
const hungerEls = [];
for (let i = 0; i < MAX_HUNGER / 2; i++) {
  const el = document.createElement('span');
  el.className = 'food';
  el.innerHTML = '<img class="bg" alt=""><img class="fg" alt="">';
  $('hunger').appendChild(el);
  hungerEls.push(el);
}
let shownHunger = -1;
function renderHunger() {
  const h = Math.ceil(hunger);
  if (h === shownHunger) return;
  shownHunger = h;
  hungerEls.forEach((el, i) => {
    const fill = Math.max(0, Math.min(2, h - i * 2)); // 0, 1 or 2 points in this loaf
    if (!el.firstChild.src) { el.firstChild.src = icons[BREAD]; el.lastChild.src = icons[BREAD]; }
    el.lastChild.style.clipPath = `inset(0 ${100 - fill * 50}% 0 0)`;
  });
  $('hunger').classList.toggle('low', h <= 6);
}

// Hunger drains slowly over time, faster while walking or breaking blocks.
// A full bar lasts about 27 minutes standing still, or about 9 minutes of busy play.
let starvingWarned = false;
function updateHunger(dt) {
  const moving = Math.hypot(player.vel.x, player.vel.z) > 0.5;
  const rate = (1 / 80 + (moving ? 1 / 40 : 0) + (controls.breaking ? 1 / 50 : 0)) * (poisoned > 0 ? 4 : 1);
  hunger = Math.max(0, hunger - rate * dt);
  // starving: you can only stagger along until you eat something
  player.speedMul = hunger <= 0 ? 0.45 : 1;
  if (hunger <= 0 && !starvingWarned) { starvingWarned = true; toast('You\'re starving! Eat something to get your strength back.', 4000); }
  if (hunger > 2) starvingWarned = false;
  renderHunger();
}

// ---------- health ----------
// Ten hearts (2 points each), green while poisoned; bubbles show your breath underwater.
const heartEls = [], bubbleEls = [];
for (let i = 0; i < MAX_HEALTH / 2; i++) {
  const el = document.createElement('span');
  el.className = 'heart';
  el.innerHTML = `<img class="bg" src="${hudIcons.heart}" alt=""><img class="fg" src="${hudIcons.heart}" alt="">`;
  $('health').appendChild(el);
  heartEls.push(el);
  const b = document.createElement('img');
  b.className = 'bubble';
  b.src = hudIcons.bubble;
  b.alt = '';
  $('air').appendChild(b);
  bubbleEls.push(b);
}
let shownHealth = '';
function renderHealth() {
  const h = Math.ceil(health), sick = poisoned > 0;
  const key = h + (sick ? 'p' : '');
  if (key === shownHealth) return;
  shownHealth = key;
  heartEls.forEach((el, i) => {
    const fill = Math.max(0, Math.min(2, h - i * 2));
    el.lastChild.src = sick ? hudIcons.poison : hudIcons.heart;
    el.lastChild.style.clipPath = `inset(0 ${100 - fill * 50}% 0 0)`;
  });
  $('health').classList.toggle('low', h <= 6);
}
function renderAir() {
  const show = air < MAX_AIR;
  $('air').classList.toggle('hidden', !show);
  if (show) bubbleEls.forEach((b, i) => { b.style.visibility = i < Math.ceil(air) ? 'visible' : 'hidden'; });
}

function damage(amount, cause) {
  if (dead || amount <= 0) return;
  health = Math.max(0, health - amount);
  sound.hurt();
  const fx = $('hurt');
  fx.classList.remove('flash'); void fx.offsetWidth; fx.classList.add('flash');
  renderHealth();
  if (health <= 0) die(cause);
}

function die(cause) {
  dead = true;
  paused = true;
  controls.reset();
  document.exitPointerLock?.();
  $('death-cause').textContent = cause;
  $('death-day').textContent = `You made it to day ${day}.`;
  $('death').classList.remove('hidden');
}

function respawnPlayer() {
  respawn();
  health = MAX_HEALTH; hunger = MAX_HUNGER; air = MAX_AIR; poisoned = 0;
  fallTop = null; dead = false;
  player.vel.set(0, 0, 0);
  player.kx = player.kz = 0;
  mobs.calm();
  $('death').classList.add('hidden');
  paused = false;
  renderHealth(); renderHunger(); renderAir();
  saveGame();
}

// Per-frame health rules:
//   falls of more than 3 blocks hurt (1 point per extra block) unless you land in water;
//   breath lasts 10 s underwater, then you drown at 2 points a second;
//   an empty hunger bar costs a point every 4 s (it can't take your last point);
//   food poisoning costs a point every 2 s for its duration (also never the last point);
//   a well-fed player (hunger 16+) heals a point every 3 s, using up a little hunger.
function updateHealth(dt, wasGround, prevY) {
  // falling: track the highest point since leaving the ground (including where this step started)
  if (player.inWater || player.onGround && wasGround) fallTop = null;
  if (!player.onGround && !player.inWater) fallTop = Math.max(fallTop ?? prevY, prevY, player.pos.y);
  else if (player.onGround && !wasGround && fallTop === null && !player.inWater) fallTop = prevY;
  if (player.onGround && !wasGround && fallTop !== null) {
    const fall = fallTop - player.pos.y;
    fallTop = null;
    if (fall > 3.5) damage(Math.floor(fall - 3), 'You fell from a high place.');
  }
  // drowning
  if (player.eyeInWater) {
    air = Math.max(0, air - dt);
    if (air <= 0 && (timers.drown += dt) >= 1) { timers.drown = 0; damage(2, 'You drowned.'); }
  } else {
    air = Math.min(MAX_AIR, air + dt * 5);
    timers.drown = 0;
  }
  renderAir();
  // starving
  if (hunger <= 0) {
    if ((timers.starve += dt) >= 4) { timers.starve = 0; if (health > 1) damage(1, 'You starved.'); }
  } else timers.starve = 0;
  // food poisoning
  if (poisoned > 0) {
    poisoned = Math.max(0, poisoned - dt);
    if ((timers.poison += dt) >= 2) { timers.poison = 0; if (health > 1) damage(1, 'Food poisoning.'); }
    if (poisoned === 0) { renderHealth(); toast('You feel better', 1500); }
  }
  $('sick').classList.toggle('show', poisoned > 0);
  // healing
  if (health < MAX_HEALTH && hunger >= 16 && poisoned <= 0) {
    if ((timers.regen += dt) >= 3) {
      timers.regen = 0;
      health = Math.min(MAX_HEALTH, health + 1);
      hunger = Math.max(0, hunger - 0.5);
      renderHealth();
    }
  } else timers.regen = 0;
}

// ---------- bow ----------
const FULL_DRAW = 1; // seconds to draw the bow all the way
function shootArrow(power) {
  if (inventory.count(ARROW) <= 0) { toast('You need arrows'); return; }
  inventory.remove(ARROW, 1);
  arrows.shoot(player.eye, player.lookDir(), power);
}

// ---------- fishing ----------
// Tap with the rod to cast; tap again to reel in. Reel in while the bobber is bobbing under (a bite) to catch a fish.
function useRod() {
  if (!fishing.active) { fishing.cast(player.eye, player.lookDir()); return; }
  if (!fishing.reel()) return;
  if (inventory.add(RAW_FISH, 1) > 0) { toast('Inventory full: the fish got away'); return; }
  toast('You caught a fish!', 1500);
  sound.pop();
}

// Where the line leaves the rod: a little to the right of and below your eye.
const rodTip = new THREE.Vector3();
function updateFishing(dt) {
  if (!fishing.active) return;
  if (inventory.heldId() !== FISHING_ROD || dead) { fishing.stop(); return; }
  const look = player.lookDir();
  rodTip.copy(player.eye).addScaledVector(look, 0.7);
  rodTip.x += Math.cos(player.yaw) * 0.3; rodTip.z -= Math.sin(player.yaw) * 0.3; rodTip.y -= 0.12;
  const ev = fishing.update(dt, world, rodTip, Math.max(lightUniforms.uDay.value, 0.3));
  if (ev === 'bite') toast('Something\'s biting! Tap to reel in', 1200);
  else if (ev === 'escaped') toast('It got away…', 1200);
  else if (ev === 'snapped') toast('You walked too far: the line reeled back in', 1800);
}

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

// Is a block of this kind (a crafting table or butter churn) within reach?
function nearBlock(id) {
  const p = player.pos;
  const bx = Math.floor(p.x), by = Math.floor(p.y), bz = Math.floor(p.z);
  for (let y = by - 2; y <= by + 3; y++) for (let z = bz - 4; z <= bz + 4; z++) for (let x = bx - 4; x <= bx + 4; x++) {
    if (world.get(x, y, z) === id) return true;
  }
  return false;
}

function renderInventory() {
  for (let i = 0; i < SLOTS; i++) {
    invEls[i].innerHTML = slotHTML(inventory.slots[i]);
    invEls[i].classList.toggle('picked', i === picked);
  }
  const hasTable = openedAt === TABLE || nearBlock(TABLE);
  const hasChurn = openedAt === CHURN || nearBlock(CHURN);
  $('table-status').textContent = `— crafting table ${hasTable ? '✓' : '✗'} · butter churn ${hasChurn ? '✓' : '✗'}`;
  const list = $('recipes');
  list.innerHTML = '';
  RECIPES.forEach((r) => {
    if (r.metal && countOf(r.metal) <= 0) return; // metal tools only show up once you have that metal
    const stationOk = (!r.table || hasTable) && (!r.churn || hasChurn);
    const haveAll = r.in.every(([id, n]) => countOf(id) >= n) && (r.tools ?? []).every((id) => inventory.count(id) > 0);
    const canMake = haveAll && stationOk && inventory.room(r.out[0]) >= r.out[1];
    const row = document.createElement('div');
    row.className = 'recipe' + (stationOk ? '' : ' locked');
    const ings = r.in.map(([id, n]) => {
      const miss = countOf(id) < n ? ' missing' : '';
      const first = idsOf(id)[0];
      return `<span class="ing${miss}" title="${idsOf(id).map(itemName).join(' or ')}"><img src="${icons[first]}" alt="">${n}</span>`;
    }).join('');
    // tools are needed but not used up
    const tools = (r.tools ?? []).map((id) => {
      const miss = inventory.count(id) > 0 ? '' : ' missing';
      return `<span class="ing tool${miss}" title="${itemName(id)} (not used up)"><img src="${icons[id]}" alt="">kept</span>`;
    }).join('');
    const also = (r.also ?? []).map(([id]) => ` + ${itemName(id)} back`).join('');
    const where = r.churn ? ' (churn)' : r.table ? ' 🛠' : '';
    row.innerHTML = `${ings}${tools}<span class="arrow">→</span><img class="outimg" src="${icons[r.out[0]]}" alt="">` +
      `<span class="name">${r.out[1] > 1 ? r.out[1] + ' × ' : ''}${itemName(r.out[0])}${also}${where}</span>`;
    const btn = document.createElement('button');
    btn.className = 'btn';
    btn.textContent = 'Craft';
    btn.disabled = !canMake;
    btn.addEventListener('click', () => {
      if (!r.in.every(([id, n]) => countOf(id) >= n)) return;
      for (const [id, n] of r.in) takeOf(id, n);
      let lost = inventory.add(r.out[0], r.out[1]);
      for (const [id, n] of r.also ?? []) lost += inventory.add(id, n);
      if (lost) toast('Inventory full');
      sound.pop();
    });
    row.appendChild(btn);
    list.appendChild(row);
  });
}

// A recipe ingredient can be one id or a list of alternatives (coal or charcoal).
const idsOf = (spec) => (Array.isArray(spec) ? spec : [spec]);
const countOf = (spec) => idsOf(spec).reduce((t, id) => t + inventory.count(id), 0);
function takeOf(spec, n) {
  for (const id of idsOf(spec)) {
    const k = Math.min(n, inventory.count(id));
    if (k) { inventory.remove(id, k); n -= k; }
  }
}

function openInventory(station = null) {
  const loading = !$('loading').classList.contains('hidden');
  if (!world || loading) return;
  openedAt = station;
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
  openedAt = null;
}
function toggleInventory() {
  if (openStationAt) { closeStation(); return; }
  if ($('inventory').classList.contains('hidden')) {
    if ($('menu').classList.contains('hidden')) openInventory();
  } else closeInventory();
}

// ---------- ovens and smelters ----------
// Tap one to open it: move ingredients and fuel in from your inventory (tap a slot, then another),
// and tap the result to collect it. It keeps cooking while it has fuel and ingredients.
let openStationAt = null; // { x, y, z, kind }
let stPicked = null; // { area, i }: the slot you tapped first

function setStationLit(x, y, z, lit) {
  const d = BLOCKS[world.get(x, y, z)];
  const base = d.station === 'oven' ? OVEN : SMELTER;
  world.setBlock(x, y, z, base + d.facing + (lit ? 4 : 0));
}

const currentStation = () => openStationAt && stations.get(openStationAt.x, openStationAt.y, openStationAt.z, openStationAt.kind);

function stationSlot(area, i) {
  const st = currentStation();
  if (area === 'in') return { get: () => st.inputs[i], set: (v) => { st.inputs[i] = v; } };
  if (area === 'fuel') return { get: () => st.fuel, set: (v) => { st.fuel = v; } };
  if (area === 'out') return { get: () => st.out, set: (v) => { st.out = v; } };
  return { get: () => inventory.slots[i], set: (v) => { inventory.slots[i] = v; } };
}

function openStation(x, y, z) {
  const kind = stationKind(world.get(x, y, z));
  stations.get(x, y, z, kind);
  openStationAt = { x, y, z, kind };
  stPicked = null;
  paused = true;
  controls.reset();
  document.exitPointerLock?.();
  const K = STATION_KINDS[kind];
  $('station-title').textContent = K.name;
  // build the slots for this kind of station
  const make = (parent, area, i) => {
    const el = document.createElement('div');
    el.className = 'slot';
    el.dataset.area = area;
    el.dataset.i = i;
    el.addEventListener('click', () => onStationSlot(area, i));
    parent.appendChild(el);
  };
  const ins = $('st-inputs');
  ins.innerHTML = '';
  ins.style.gridTemplateColumns = `repeat(${K.inputs > 1 ? 2 : 1}, var(--slot))`;
  for (let i = 0; i < K.inputs; i++) make(ins, 'in', i);
  for (const [id, area] of [['st-fuel', 'fuel'], ['st-out', 'out']]) { $(id).innerHTML = ''; make($(id), area, 0); }
  $('st-inv').innerHTML = ''; $('st-hotbar').innerHTML = '';
  for (let i = 9; i < SLOTS; i++) make($('st-inv'), 'inv', i);
  for (let i = 0; i < 9; i++) make($('st-hotbar'), 'inv', i);
  // what it can make
  $('st-recipes').innerHTML = K.recipes.map((r) => {
    const ing = r.in.map(([id, n]) => `<span class="ing" title="${idsOf(id).map(itemName).join(' or ')}"><img src="${icons[idsOf(id)[0]]}" alt="">${n}</span>`).join('');
    const tools = (r.tools ?? []).map((id) => `<span class="ing tool" title="${itemName(id)} (not used up)"><img src="${icons[id]}" alt="">kept</span>`).join('');
    return `<div class="recipe">${ing}${tools}<span class="arrow">→</span><img class="outimg" src="${icons[r.out[0]]}" alt="">` +
      `<span class="name">${r.out[1] > 1 ? r.out[1] + ' × ' : ''}${itemName(r.out[0])}</span></div>`;
  }).join('') + '<p class="hint">Fuel, in items cooked per piece: log or planks 1, stick ½, coal or charcoal 10, ' +
    'slime fuel 40 (its bucket is left in the fuel slot). Fuel is only used while something is cooking.</p>';
  $('station').classList.remove('hidden');
  renderStation();
}

function closeStation() {
  $('station').classList.add('hidden');
  openStationAt = null;
  stPicked = null;
  paused = false;
}

function renderStation() {
  const st = currentStation();
  if (!st) return;
  for (const el of $('station').querySelectorAll('.slot')) {
    const area = el.dataset.area, i = +el.dataset.i;
    el.innerHTML = slotHTML(stationSlot(area, i).get());
    el.classList.toggle('picked', !!stPicked && stPicked.area === area && stPicked.i === i);
  }
  const r = stations.recipeFor(st);
  $('st-progress').style.width = `${r ? Math.min(100, (st.progress / r.time) * 100) : 0}%`;
  $('st-flame').style.opacity = st.burn > 0 ? String(0.35 + 0.65 * (st.burn / (st.burnMax || 1))) : '0.12';
  const fuelLeft = st.burn > 1e-9 ? ` (fuel for ${+st.burn.toFixed(1)} more)` : '';
  $('st-status').textContent = r ? (st.burn > 1e-9 || (st.fuel && isFuel(st.fuel.id)) ? `Making ${itemName(r.out[0]).toLowerCase()}…${fuelLeft}` : 'Needs fuel') :
    `Put ingredients in${fuelLeft}`;
}

function onStationSlot(area, i) {
  const st = currentStation();
  if (!st) return;
  // tapping the result collects it
  if (area === 'out' && !stPicked) {
    if (st.out) {
      const left = inventory.add(st.out.id, st.out.count);
      st.out = left ? { id: st.out.id, count: left } : null;
      if (left) toast('Inventory full'); else sound.pop();
    }
    renderStation();
    return;
  }
  if (!stPicked) {
    if (stationSlot(area, i).get()) stPicked = { area, i };
    renderStation();
    return;
  }
  const fromArea = stPicked.area, fromI = stPicked.i;
  stPicked = null;
  if (fromArea === area && fromI === i) { renderStation(); return; }
  const from = stationSlot(fromArea, fromI), to = stationSlot(area, i);
  const a = from.get(), b = to.get();
  if (!a || area === 'out') { renderStation(); return; } // nothing can be put into the result slot
  if (area === 'fuel' && !isFuel(a.id)) { toast(`${itemName(a.id)} won't burn`); renderStation(); return; }
  if (fromArea === 'fuel' && b && !isFuel(b.id)) { renderStation(); return; }
  if (b && b.id === a.id) {
    const k = Math.min(a.count, maxStack(a.id) - b.count);
    b.count += k; a.count -= k;
    if (!a.count) from.set(null);
  } else {
    from.set(b); to.set(a);
  }
  inventory.onChange();
  renderStation();
}

// ---------- actions ----------
// Tap the animal under the crosshair with whatever is in hand: milk a yak, pluck a duck,
// shear an alpaca, fill a bucket with newt slime, or just bump it.
function hitMob() {
  if (!targetMob) return;
  if (targetMob.mob.spec.hostile) {
    // fight a night creature: damage depends on what's in your hand
    const now = performance.now();
    if (now - lastSwing < 450) return;
    lastSwing = now;
    giveDrops(mobs.hurt(targetMob.mob, WEAPON_DAMAGE[inventory.heldId()] ?? ITEMS[inventory.heldId()]?.tool?.damage ?? 2, player.pos));
    return;
  }
  const r = mobs.interact(targetMob.mob, player.pos, inventory.heldId());
  for (const [id, n] of r.take) inventory.remove(id, n);
  for (const [id, n] of r.give) {
    if (inventory.add(id, n) > 0) toast('Inventory full');
    else { toast(`+${n} ${itemName(id)}`, 1200); sound.pop(); }
  }
  if (r.said) toast(r.said);
}

// Raw sugar cane: a heart of health and half a point of food. Eating five or more in a day
// (they're counted from sunrise) gives you food poisoning.
function eatCane() {
  if (hunger > MAX_HUNGER - 1 && health >= MAX_HEALTH) { toast('You\'re not hungry'); return; }
  hunger = Math.min(MAX_HUNGER, hunger + 1);
  health = Math.min(MAX_HEALTH, health + 2);
  inventory.consumeHeld();
  sound.eat();
  caneToday++;
  if (caneToday >= 5) {
    poisoned = Math.max(poisoned, 20);
    toast('Too much raw sugar cane! You have food poisoning.', 2500);
  } else {
    toast(`Ate raw sugar cane (${caneToday} today${caneToday === 4 ? ': any more and you\'ll feel sick' : ''})`, 1800);
  }
  renderHunger();
  renderHealth();
}

function eat(id) {
  if (ITEMS[id]?.drink === 'poison') {
    // drinking slime: you keep the bucket, and get food poisoning
    inventory.consumeHeld();
    inventory.add(BUCKET, 1);
    poisoned = 20;
    sound.gulp();
    toast('Yuck! You have food poisoning.', 2500);
    renderHealth();
    return;
  }
  if (hunger > MAX_HUNGER - 1) { toast('You\'re not hungry'); return; } // (hunger drains constantly, so never exactly full)
  hunger = Math.min(MAX_HUNGER, hunger + foodValue(id));
  inventory.consumeHeld();
  sound.eat();
  toast(`Ate ${itemName(id).toLowerCase()}`, 1000);
  renderHunger();
}

// Is there water beside (not above or below) this block?
const waterBeside = (x, y, z) => world.isWater(x + 1, y, z) || world.isWater(x - 1, y, z) ||
  world.isWater(x, y, z + 1) || world.isWater(x, y, z - 1);

// ---------- furniture ----------

// Which of the four facings points from the block at (bx, bz) toward the player.
function facingTowardPlayer(bx, bz) {
  const vx = player.pos.x - (bx + 0.5), vz = player.pos.z - (bz + 0.5);
  if (Math.abs(vz) >= Math.abs(vx)) return vz > 0 ? 0 : 2;
  return vx < 0 ? 1 : 3;
}

// The other half of a two-block bed: the foot is one block from the head in the bed's facing direction.
function bedPartner(x, y, z) {
  const d = BLOCKS[world.get(x, y, z)];
  const [dx, dz] = FACING_DIRS[d.facing];
  return d.foot ? [x - dx, y, z - dz] : [x + dx, y, z + dz];
}

function toggleDoor(x, y, z) {
  const d = BLOCKS[world.get(x, y, z)];
  const by = d.upper ? y - 1 : y; // the bottom half
  if (!d.open && (player.overlapsBlock(x, by, z) || player.overlapsBlock(x, by + 1, z))) return; // don't shut it on yourself
  world.setBlock(x, by, z, doorId(d.facing, !d.open, false));
  if (isDoor(world.get(x, by + 1, z))) world.setBlock(x, by + 1, z, doorId(d.facing, !d.open, true));
  sound.door(!d.open);
}

function toggleCurtain(x, y, z) {
  const d = BLOCKS[world.get(x, y, z)];
  world.setBlock(x, y, z, CURTAIN + d.axis + (d.open ? 0 : 2));
  sound.swish();
}

const lampKey = (x, y, z) => `${x},${y},${z}`;
function lampDaysLeft(x, y, z) {
  const fuel = BLOCKS[world.get(x, y, z)].fuel;
  if (!fuel) return 0;
  return fuel - 1 + (lamps.get(lampKey(x, y, z)) ?? DAY_LENGTH) / DAY_LENGTH;
}

// Tap a lamp holding slime fuel to pour a unit in (the bucket stays with you); otherwise see how much is left.
function useLamp(x, y, z, held) {
  const fuel = BLOCKS[world.get(x, y, z)].fuel;
  if (held?.id === SLIME_FUEL) {
    if (fuel >= MAX_LAMP_FUEL) { toast('This lamp is already full'); return; }
    world.setBlock(x, y, z, LAMP + fuel + 1);
    if (!fuel) lamps.set(lampKey(x, y, z), DAY_LENGTH);
    inventory.consumeHeld();
    inventory.add(BUCKET, 1);
    sound.pour();
    toast(`Lamp fuel: ${fuel + 1} of ${MAX_LAMP_FUEL}`, 1500);
    return;
  }
  if (!fuel) toast('This lamp is empty. Tap it holding slime fuel to fill it.', 2500);
  else toast(`Lamp fuel: ${fuel} of ${MAX_LAMP_FUEL} (about ${lampDaysLeft(x, y, z).toFixed(1)} days left)`, 2500);
}

// Lamps burn one unit of fuel per in-game day, but only while their part of the world is loaded.
function tickLamps(dt) {
  for (const [key, secs] of lamps) {
    const [x, y, z] = key.split(',').map(Number);
    if (!world.chunkAt(x, z)) continue;
    const id = world.get(x, y, z);
    if (!isLamp(id) || !BLOCKS[id].fuel) { lamps.delete(key); continue; }
    let left = secs - dt, fuel = BLOCKS[id].fuel;
    while (left <= 0 && fuel > 0) { fuel--; left += DAY_LENGTH; }
    if (fuel !== BLOCKS[id].fuel) world.setBlock(x, y, z, LAMP + fuel);
    if (fuel > 0) lamps.set(key, left); else lamps.delete(key);
  }
}

// Sleep from evening until sunrise (and remember this bed as where you respawn).
const canSleepNow = () => sky.time > 0.46;
function useBed(x, y, z) {
  bedSpawn = { x, y, z };
  if (!canSleepNow()) { toast('Respawn point set. You can only sleep in the evening or at night.', 2500); return; }
  const lurking = mobs.mobs.some((m) => m.spec.hostile && !m.dying &&
    Math.hypot(m.pos.x - player.pos.x, m.pos.z - player.pos.z) < 12 && Math.abs(m.pos.y - player.pos.y) < 6);
  if (lurking) { toast('You can\'t sleep now: something is lurking nearby', 2500); return; }
  sleepUntilMorning();
}
async function sleepUntilMorning() {
  paused = true;
  controls.reset();
  $('sleep').classList.add('show');
  await new Promise((r) => setTimeout(r, 1300));
  const skipped = (1 - sky.time) * DAY_LENGTH; // seconds of night slept through
  sky.time = 0.001;
  day++;
  caneToday = 0;
  stations.tick(skipped, world, setStationLit);
  tickLamps(skipped);
  for (let i = 0; i < 6; i++) world.tickPlants(skipped / 6);
  hunger = Math.max(0, hunger - 3); // a night's sleep makes you a bit peckish
  renderHunger();
  saveGame();
  await new Promise((r) => setTimeout(r, 400));
  $('sleep').classList.remove('show');
  sound.wake();
  toast(`Good morning! Day ${day}`, 2500);
  paused = false;
}

function place() {
  if (paused) return;
  const held = inventory.held();
  if (held?.id === FISHING_ROD) { useRod(); return; }
  // with the bow in hand a tap always shoots (a quick, short shot), whatever you're looking at
  if (held?.id === BOW) { shootArrow(Math.max(0.25, Math.min(1, bowCharge / FULL_DRAW))); bowCharge = 0; return; }
  if (targetMob) { hitMob(); return; }
  if (target && (target.id === TABLE || target.id === CHURN)) { sound.click(); openInventory(target.id); return; }
  if (target) {
    const { x: tx, y: ty, z: tz, id: tid } = target;
    if (isBed(tid)) { useBed(tx, ty, tz); return; }
    if (isDoor(tid)) { toggleDoor(tx, ty, tz); return; }
    if (isCurtain(tid)) { toggleCurtain(tx, ty, tz); return; }
    if (isLamp(tid)) { useLamp(tx, ty, tz, held); return; }
    if (stationKind(tid)) { sound.click(); openStation(tx, ty, tz); return; }
  }
  // sugar cane in hand: plant it if you're aiming at a good spot beside water, otherwise eat it
  if (held?.id === SUGAR_CANE) {
    const ground = target && (target.id === SAND || target.id === GRASS || target.id === DIRT);
    const plantable = target && target.ny === 1 && world.get(target.x, target.y + 1, target.z) === AIR &&
      (target.id === SUGAR_CANE || (ground && waterBeside(target.x, target.y, target.z)));
    if (!plantable) { eatCane(); return; }
  }
  if (held && (foodValue(held.id) || ITEMS[held.id]?.drink)) { eat(held.id); return; }
  if (!target || !held) return;
  // what goes into the world: the block itself, or what an item plants (seeds -> young wheat)
  let id = isBlock(held.id) ? held.id : ITEMS[held.id]?.places;
  if (!id) return;
  const x = target.x + target.nx, y = target.y + target.ny, z = target.z + target.nz;
  const there = world.get(x, y, z);
  if (!world.inBounds(x, y, z) || (there !== AIR && there !== WATER)) return;
  if (id === TORCH) {
    // torches need a solid block to stand on or hang from, and can't go underwater or on ceilings
    if (there !== AIR || target.ny < 0 || !BLOCKS[target.id].solid || isTorch(target.id)) return;
    if (target.ny === 0) id = TORCH_WALL_W + WALL_TORCH_DIRS.findIndex(([dx, dz]) => dx === -target.nx && dz === -target.nz);
  } else if (isWheat(id)) {
    // seeds go on top of grass or dirt
    if (there !== AIR || target.ny !== 1 || (target.id !== GRASS && target.id !== DIRT)) { toast('Plant seeds on top of grass or dirt'); return; }
  } else if (id === SUGAR_CANE) {
    // sugar cane goes on top of more cane, or on sand, grass or dirt right beside water
    const ground = target.id === SAND || target.id === GRASS || target.id === DIRT;
    if (there !== AIR || target.ny !== 1 || !(target.id === SUGAR_CANE || (ground && waterBeside(target.x, target.y, target.z)))) {
      toast('Sugar cane needs sand, grass or dirt right next to water'); return;
    }
  } else if (id === DOOR) {
    // a door stands on a block and takes two spaces; it faces you
    if (there !== AIR || target.ny !== 1 || world.get(x, y + 1, z) !== AIR) { toast('A door needs two free spaces on top of a block'); return; }
    if (player.overlapsBlock(x, y, z) || player.overlapsBlock(x, y + 1, z)) return;
    const f = facingTowardPlayer(x, z);
    world.setBlock(x, y, z, doorId(f, false, false));
    world.setBlock(x, y + 1, z, doorId(f, false, true));
    sound.place('wood');
    inventory.consumeHeld();
    return;
  } else if (id === BED) {
    // the foot goes where you tap and the head extends away from you; both spaces must be free
    const f = facingTowardPlayer(x, z);
    const [dx, dz] = FACING_DIRS[f];
    const hx = x - dx, hz = z - dz;
    if (there !== AIR || world.get(hx, y, hz) !== AIR) { toast('A bed needs two free spaces'); return; }
    if (player.overlapsBlock(x, y, z) || player.overlapsBlock(hx, y, hz)) return;
    world.setBlock(x, y, z, BED_FOOT + f);
    world.setBlock(hx, y, hz, BED + f);
    sound.place('wool');
    inventory.consumeHeld();
    return;
  } else if (id === LAMP || id === CARPET) {
    if (there !== AIR || !world.isSolid(x, y - 1, z)) { toast(`${BLOCKS[id].name}s need something solid underneath`); return; }
  } else {
    // chairs face you; curtains hang across your line of sight
    if (id === CHAIR || id === OVEN || id === SMELTER) id += facingTowardPlayer(x, z); // the front faces you
    else if (id === CURTAIN) id += facingTowardPlayer(x, z) % 2; // facing 0/2 -> hangs across x, 1/3 -> across z
    if (BLOCKS[id].solid && player.overlapsBlock(x, y, z)) return;
  }
  world.setBlock(x, y, z, id);
  sound.place(BLOCKS[id].sound);
  inventory.consumeHeld();
}

function updateBreaking(dt) {
  // holding with the bow draws it; letting go shoots (a quick tap is handled by place())
  if (inventory.heldId() === BOW) {
    if (controls.breaking) bowCharge = Math.min(FULL_DRAW, bowCharge + dt);
    else if (bowCharge > 0) { shootArrow(Math.max(0.25, bowCharge / FULL_DRAW)); bowCharge = 0; }
    $('charge').style.setProperty('--charge', String(bowCharge / FULL_DRAW));
    $('charge').classList.toggle('show', bowCharge > 0);
    crack.visible = false;
    return;
  }
  if (bowCharge) { bowCharge = 0; $('charge').classList.remove('show'); }
  // the rod is for fishing, not digging: holding it does nothing
  if (inventory.heldId() === FISHING_ROD) { crack.visible = false; breakState.key = ''; breakState.progress = 0; return; }
  // holding on an animal taps it again every half second instead of breaking blocks. The first
  // repeat waits half a second too, so a tap (which acts once, on release) never acts twice.
  if (!controls.breaking) breakState.mobCooldown = 0.5;
  breakState.mobCooldown = Math.max(0, breakState.mobCooldown - dt);
  if (controls.breaking && targetMob) {
    if (!breakState.mobCooldown) { hitMob(); breakState.mobCooldown = 0.5; }
    breakState.key = ''; breakState.progress = 0;
    crack.visible = false;
    return;
  }
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
  let drops = dropsFor(id, inventory.heldId());
  if (isDoor(id)) {
    // either half takes the whole door with it
    const oy = def.upper ? y - 1 : y + 1;
    if (isDoor(world.get(x, oy, z))) world.setBlock(x, oy, z, AIR);
    drops = [[DOOR, 1]];
  }
  if (isLamp(id)) lamps.delete(lampKey(x, y, z));
  if (stationKind(id)) giveDrops(stations.remove(x, y, z)); // whatever was inside comes back too
  if (isBed(id)) {
    // either half takes the whole bed with it
    const [ox, oy, oz] = bedPartner(x, y, z);
    if (isBed(world.get(ox, oy, oz))) world.setBlock(ox, oy, oz, AIR);
    const used = (bx, by, bz) => bedSpawn && bedSpawn.x === bx && bedSpawn.y === by && bedSpawn.z === bz;
    if (used(x, y, z) || used(ox, oy, oz)) bedSpawn = null;
    drops = [[BED, 1]];
  }
  world.setBlock(x, y, z, AIR);
  dropUnsupported(x, y, z);
  if (drops.length) {
    let lost = 0;
    for (const [d, n] of drops) lost += inventory.add(d, n);
    if (lost) toast('Inventory full');
  } else if (def.needsTool) {
    const kind = def.tool === 'pick' ? 'pickaxe' : def.tool;
    if (def.tier > 1) {
      toast(`You need a ${TOOL_TIERS[def.tier]} ${kind} or better to collect ${def.name}`, 2500);
    } else toast(`You need a ${kind} to collect ${def.name}`);
  }
}

// Things resting on a block that was just removed pop off into the inventory: torches standing on
// it or hanging from it, wheat growing on it, and a whole column of sugar cane above it.
function dropUnsupported(x, y, z) {
  const check = [[x, y + 1, z, TORCH]];
  WALL_TORCH_DIRS.forEach(([dx, dz], i) => check.push([x - dx, y, z - dz, TORCH_WALL_W + i]));
  for (const [tx, ty, tz, id] of check) {
    if (world.get(tx, ty, tz) !== id) continue;
    world.setBlock(tx, ty, tz, AIR);
    inventory.add(TORCH, 1);
  }
  // lamps and carpets resting on it, and a door standing on it
  const above = world.get(x, y + 1, z);
  if (isLamp(above) || above === CARPET) {
    lamps.delete(lampKey(x, y + 1, z));
    world.setBlock(x, y + 1, z, AIR);
    inventory.add(above === CARPET ? CARPET : LAMP, 1);
  } else if (isDoor(above) && !BLOCKS[above].upper) {
    world.setBlock(x, y + 1, z, AIR);
    if (isDoor(world.get(x, y + 2, z))) world.setBlock(x, y + 2, z, AIR);
    inventory.add(DOOR, 1);
  }
  for (let ty = y + 1; ty < H; ty++) {
    const id = world.get(x, ty, z);
    if (!isWheat(id) && id !== SUGAR_CANE) break;
    for (const [d, n] of dropsFor(id, 0)) inventory.add(d, n);
    world.setBlock(x, ty, z, AIR);
    if (id !== SUGAR_CANE) break;
  }
}

// ---------- menu ----------
function updateAutoJumpLabel() { $('btn-autojump').textContent = `Auto-jump: ${player?.autoJump ? 'on' : 'off'}`; }
$('btn-respawn').addEventListener('click', respawnPlayer);
$('btn-close-station').addEventListener('click', closeStation);
$('station').addEventListener('click', (e) => { if (e.target.id === 'station') closeStation(); });
$('btn-menu').addEventListener('click', () => {
  paused = true; controls.reset(); document.exitPointerLock?.();
  $('menu').classList.remove('hidden');
});
$('btn-close-menu').addEventListener('click', () => { $('menu').classList.add('hidden'); paused = false; });
$('btn-autojump').addEventListener('click', () => { player.autoJump = !player.autoJump; updateAutoJumpLabel(); saveGame(); });
$('btn-save').addEventListener('click', () => toast(saveGame() ? 'World saved' : 'Could not save (storage unavailable)'));
$('btn-new').addEventListener('click', () => {
  // (startWorld(null) also clears the stored chunks)
  if (!confirm('Start a new world? Your current world will be lost.')) return;
  $('menu').classList.add('hidden');
  startWorld(null);
});
$('version').textContent = `Version ${GAME_VERSION}`;
function updatePerfLabel() { $('btn-perf').textContent = `Performance info: ${settings.perf ? 'on' : 'off'}`; }
updatePerfLabel();
$('perf').classList.toggle('hidden', !settings.perf);
$('btn-perf').addEventListener('click', () => {
  settings.perf = !settings.perf;
  $('perf').classList.toggle('hidden', !settings.perf);
  updatePerfLabel();
  saveSettings();
});
function updateDifficultyLabel() {
  $('btn-difficulty').textContent = `Difficulty: ${difficulty().name}`;
  $('difficulty-about').textContent = difficulty().about;
}
updateDifficultyLabel();
$('btn-difficulty').addEventListener('click', () => {
  const i = DIFFICULTY_ORDER.indexOf(settings.difficulty);
  settings.difficulty = DIFFICULTY_ORDER[(i + 1) % DIFFICULTY_ORDER.length];
  updateDifficultyLabel();
  saveSettings();
});
$('view').value = settings.viewDistance;
$('view').addEventListener('input', (e) => {
  settings.viewDistance = +e.target.value;
  applyViewDistance();
  saveSettings();
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
  // Player must exist before Controls; startWorld gives it the real world.
  player = new Player(null);
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
let coordsTimer = 0;
let stationRefresh = 0;
let unsavedCount = 0, lastEditAt = 0;
const perf = { frames: 0, since: 0, fps: 0 };
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min((now - last) / 1000, 0.05);
  last = now;
  if (!world) return;
  // gameplay, streaming and rendering are isolated so an error in one can't stop the others
  try { stepGame(now, dt); } catch (err) { reportError(err); }
  try {
    if (!dead) stations.tick(dt, world, setStationLit);
    if (openStationAt && (stationRefresh -= dt) <= 0) { stationRefresh = 0.15; renderStation(); }
  } catch (err) { reportError(err); }
  try { world.update(player.pos.x, player.pos.z, scene, materials, 6, dt); } catch (err) { reportError(err); }
  renderer.render(scene, camera);
  updatePerf(now);
}

function updatePerf(now) {
  perf.frames++;
  if (now - perf.since < 500) return;
  perf.fps = Math.round((perf.frames * 1000) / (now - perf.since));
  perf.frames = 0;
  perf.since = now;
  if (!settings.perf) return;
  const st = world.stats(player.pos.x, player.pos.z);
  $('perf').textContent = `${perf.fps} fps · view ${settings.viewDistance * CHUNK} blocks\n` +
    `chunks: ${st.loaded} loaded, ${st.drawn} drawn, ${st.waiting} waiting` +
    (st.pending ? `, ${st.pending} reading` : '') + (st.failed ? `, ${st.failed} failed` : '') +
    `\nanimals: ${mobs.animals} · creatures: ${mobs.creatures} (${difficulty().name})` +
    (lastError ? `\nlast error: ${lastError}` : '');
}

function stepGame(now, dt) {
  // the player waits (frozen) until the chunk they're standing in has loaded
  const here = world.chunkAt(Math.floor(player.pos.x), Math.floor(player.pos.z));
  if (!paused && here) {
    controls.update();
    const wasGround = player.onGround, wasWater = player.inWater, fallSpeed = -player.vel.y, prevY = player.pos.y;
    player.update(dt, { moveX: controls.moveX, moveZ: controls.moveZ, jump: controls.jump });
    if (player.pos.y < -20) respawn();
    playMovementSounds(dt, wasGround, wasWater, fallSpeed);
    world.tickWater(dt);
    world.tickPlants(dt);
    tickLamps(dt);
    updateHunger(dt);
    updateHealth(dt, wasGround, prevY);
    const picked = arrows.update(dt, {
      world, mobs, player, light: { day: lightUniforms.uDay.value, flicker: lightUniforms.uFlicker.value, ambient: AMBIENT },
      // arrows bump animals, and hurt creatures more the further the bow was drawn
      onHitMob: (m, arrow, from) => {
        if (m.spec.hostile) giveDrops(mobs.hurt(m, Math.round(2 + 6 * arrow.power), from));
        else mobs.bump(m, from);
      },
      onHitPlayer: (dmg) => { if (!dead) damage(dmg, 'A thornspitter shot you full of thorns.'); },
    });
    if (picked) { inventory.add(ARROW, picked); sound.pop(); }
    updateFishing(dt);
    mobs.update(dt, player, { day: lightUniforms.uDay.value, flicker: lightUniforms.uFlicker.value, ambient: AMBIENT },
      { difficulty: difficulty(), daylight: sky.light, playerDead: dead });
  }
  // write edited chunks to storage shortly (1.5 s) after the player stops changing them
  if (world.unsaved.size !== unsavedCount) { unsavedCount = world.unsaved.size; lastEditAt = now; }
  if (unsavedCount && now - lastEditAt > 1500 && worldReady) { world.saveChunks(); unsavedCount = 0; }
  coordsTimer -= dt;
  if (coordsTimer <= 0) {
    coordsTimer = 0.25;
    $('coords').textContent = `Day ${day}   X ${Math.floor(player.pos.x)}  Y ${Math.floor(player.pos.y)}  Z ${Math.floor(player.pos.z)}`;
  }

  const eye = player.eye;
  camera.position.copy(eye);
  camera.rotation.set(player.pitch, player.yaw, 0);

  const before = sky.time;
  sky.update(paused ? 0 : dt, eye, lightUniforms.uDay, player.eyeInWater);
  if (sky.time < before) { day++; caneToday = 0; toast(`Day ${day}`, 2500); } // the clock wrapped round to sunrise
  lightUniforms.uFlicker.value = 0.93 + 0.04 * Math.sin(now * 0.011) + 0.03 * Math.sin(now * 0.029);
  $('underwater').classList.toggle('show', player.eyeInWater);
  waterTex.offset.x = (waterTex.offset.x + dt * 0.06) % 1;
  waterTex.offset.y = (waterTex.offset.y + dt * 0.025) % 1;

  const look = player.lookDir();
  target = paused ? null : world.raycast(eye, look, REACH);
  targetMob = paused ? null : mobs.raycast(eye, look, REACH);
  // whichever is closer wins: an animal in front of a block, or a block in front of an animal
  if (targetMob && target && target.t < targetMob.t) targetMob = null;
  if (targetMob) target = null;
  if (target) {
    highlight.visible = true;
    highlight.position.set(target.x + 0.5, target.y + 0.5, target.z + 0.5);
  } else highlight.visible = false;

  if (!paused) updateBreaking(dt);
  else crack.visible = false;
}
requestAnimationFrame(frame);

boot().catch(reportError);

// Keep the game files fresh (and playable offline). Only works on https or localhost.
if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(() => {});

// expose for debugging in the console
window.minicraft = {
  get world() { return world; }, player, inventory, saveGame, sky, sound, breakBlock, mobs,
  get hunger() { return hunger; }, set hunger(v) { hunger = v; renderHunger(); },
  get day() { return day; },
  get paused() { return paused; },
  get health() { return health; }, set health(v) { health = v; renderHealth(); },
  get poisoned() { return poisoned; }, get dead() { return dead; }, get air() { return air; }, set air(v) { air = v; },
  arrows, fishing, damage, lamps, tickLamps, sleepUntilMorning, stations, openStation, closeStation,
  get caneToday() { return caneToday; },
  get bedSpawn() { return bedSpawn; },
};
