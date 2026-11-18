import * as THREE from 'three';
import {
  BLOCKS, RECIPES, TABLE, AIR, WATER, TORCH, TORCH_WALL_W, WALL_TORCH_DIRS,
  GRASS, DIRT, SAND, CHURN, SUGAR_CANE, BREAD, ITEMS, BOW, ARROW, BUCKET,
  WOOD_PICK, STONE_PICK, WOOD_AXE, STONE_AXE, WOOD_SHOVEL, STONE_SHOVEL,
  BED, BED_FOOT, CHAIR, LAMP, CARPET, CURTAIN, DOOR, SLIME_FUEL, FACING_DIRS, MAX_LAMP_FUEL,
  isBed, isChair, isLamp, isCurtain, isDoor, doorId,
  OVEN, SMELTER, stationKind, maxStack, FISHING_ROD, RAW_FISH, TOOL_TIERS, LOG, LEAVES, SAPLING,
  BLAST_SMELTER, CRUSHER, WATER_BUCKET, WATER_WHEEL, isWaterId, isFlowing,
  CHEST, IRON_CHEST, LADDER, SCAFFOLD, SIGN, SIGN_POST, isSign, isSword, ARMOUR_PIECES,
  SAW, TRIP_HAMMER, DRILL, HOPPER, BELT, WINDMILL, BELLOWS, PUMP, FILAMENT_LAMP, MILLSTONE,
  RAIL, POWERED_RAIL, MINECART, MAP, ICE, isRail, railId,
  LAVA, BLAST_CHARGE, LEAD_BUCKET, LAVA_BUCKET, GOLD_CLOCK, COMPASS, SILVER_ARROW, MIRROR_LAMP, WEIGHTED_ROD, isRod, metalTool, TOOL_MATERIALS,
  isBlock, isTorch, isWheat, itemName, breakTime, dropsFor, foodValue,
  COLORS, DYE, WOOL, dyedWool, dyedCarpet, DYED_WOOL, DYED_CARPET, STAINED_GLASS, PAINTED_PLANKS, GLASS, PLANKS,
  isFlower, isSlab, slabId, SHAPE_MATS, FENCE_GATE, TRAPDOOR, isGate, isTrapdoor,
  LEVER, BUTTON, PRESSURE_PLATE, ITEM_FRAME, LOADER_RAIL, STORAGE_CART, isFrame,
  ANVIL, LOOT_CHEST, BOSS_SHRINE, SPENT_SHRINE, CAULDRON, GLASS_BOTTLE, maxWear,   BERRY_BUSH, BERRIES, STAINLESS_INGOT, STEEL_INGOT, COPPER_INGOT, WHEAT, COBBLE, FEATHER, COAL, CORNFLOWER,
  IRON_INGOT, GOLD_INGOT, SILVER_INGOT, ELECTRUM_INGOT, TUNGSTEN_INGOT, GUNPOWDER, NIGHT_TEA, HASTE_TEA, FIRE_TEA, HEAL_TEA, IRON_SHIELD, BAKED_FISH,
  GLOW_MUSHROOM, CRYSTAL_SHARD, HONEY_BOTTLE, HONEYCOMB, BEE_HIVE, MAX_HONEY, VILLAGE_BELL, SALMON, BAKED_SALMON, ICEFISH, PUFFERFISH, OLD_BOOT,
  STICK, STRING, PAPER, CAKE, COOKIE, LEATHER, FISHING_ROD as ROD, WEIGHTED_ROD as WROD, SEEDS, FLOUR, BUTTER,
} from './blocks.js';
import { createAtlas, createIcons, createCrackCanvases, createWaterCanvas, createHudIcons, paintSeason } from './textures.js';
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
import { Kinetics } from './kinetics.js';
import { Signs } from './signs.js';
import { Machines } from './machines.js';
import { Carts, railBeyond } from './carts.js';
import { MiniMap } from './minimap.js';
import { Frames } from './frames.js';
import { Weather } from './weather.js';
import { Bees } from './bees.js';

// v2 = the 16k x 16k streaming world (player state here, edited chunks in IndexedDB).
// v1 = the old 128 x 128 world, migrated into the middle of the big world on first launch.
const GAME_VERSION = '18'; // shown in the menu; bump with each release
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
  const defaults = { sens: 6, volume: 70, viewDistance: 6, perf: false, difficulty: 'worrying', wear: true, favs: [] };
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
const lightUniforms = { uDay: { value: 1 }, uFlicker: { value: 1 }, uAmbient: { value: AMBIENT } };
function addTorchLight(mat) {
  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, lightUniforms);
    shader.vertexShader = 'attribute float torch;\nattribute float sky;\nvarying float vTorch;\nvarying float vSky;\n' + shader.vertexShader
      .replace('#include <color_vertex>', '#include <color_vertex>\nvTorch = torch;\nvSky = sky;');
    shader.fragmentShader = 'uniform float uDay;\nuniform float uFlicker;\nuniform float uAmbient;\nvarying float vTorch;\nvarying float vSky;\n' + shader.fragmentShader
      .replace('#include <color_fragment>',
        '#include <color_fragment>\ndiffuseColor.rgb *= max(vec3(max(uDay * vSky, uAmbient)), vTorch * uFlicker * vec3(1.0, 0.86, 0.66));');
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
  if (shieldBlocks(from, amount)) return;
  damage(armoured(amount), cause);
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
let targetCart = null; // { cart, t } when the crosshair is on a minecart
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
const timers = { regen: 0, starve: 0, poison: 0, drown: 0, lava: 0 };
let bowCharge = 0; // seconds the bow has been drawn (holding)
let bedSpawn = null; // { x, y, z } of the bed you last used: where you respawn
// Lit lamps: "x,y,z" -> seconds left in the fuel unit now burning (each unit lasts one in-game day).
const lamps = new Map();
const stations = new Stations(); // what's inside each oven and smelter
const kinetics = new Kinetics(scene, atlas); // water wheels, shafts and gears, and what they drive
const powerAt = (x, y, z) => kinetics.powerAt(x, y, z);
const signs = new Signs(scene); // what's written on each sign
const machines = new Machines(scene, icons); // pumps, drills, hoppers and belts
const carts = new Carts(scene); // minecarts on rails
let riding = null; // the minecart you're sitting in
const minimap = new MiniMap($('map'), atlasCanvas);
const frames = new Frames(scene, icons); // what's shown in each item frame
const weather = new Weather(scene);
const bees = new Bees(scene, sound);
let ridingMob = null; // the camel you're riding
machines.frames = frames; machines.carts = carts;
// Bellows blowing into an oven or smelter (while they're turned) make it work half as fast again.
const boostAt = (x, y, z) => ([[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]
  .some(([dx, dy, dz]) => world.get(x + dx, y + dy, z + dz) === BELLOWS && powerAt(x + dx, y + dy, z + dz) > 0) ? 1.5 : 1);
// Armour worn: an item id (or null) for helmet, chestplate, leggings and boots.
const armour = [null, null, null, null, null]; // (the fifth is the shield)
const armourWear = [0, 0, 0, 0, 0];
const armourPoints = () => armour.reduce((t, id) => t + (id ? ITEMS[id].armour.points : 0), 0);
// Each point of armour takes 4% off what creatures do to you, up to 80%.
const armourShare = () => Math.min(0.8, armourPoints() * 0.04);
const armoured = (amount) => { if (amount > 0) wearArmour(); return amount * (1 - armourShare()); };
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
    const data = new Uint16Array(CHUNK_VOLUME);
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
  // leaves falling from a tree you just cut drop their saplings and sticks to you, if you're nearby
  world.onLeafDecay = (x, y, z) => {
    const p = player.pos;
    if (dead || (x + 0.5 - p.x) ** 2 + (y + 0.5 - p.y) ** 2 + (z + 0.5 - p.z) ** 2 > 16 * 16) return;
    const drops = dropsFor(LEAVES, 0);
    if (drops.length) giveDrops(drops);
  };
  mobs.reset(world); bees.clear(); shownSeason = -1;
  kinetics.clear();
  for (const [k, f] of fuses) removeFuse(k, f);
  signs.load(save?.signs);
  frames.load(save?.frames);
  pressedButtons.clear(); pressedPlates.clear();
  machines.load(save?.machines);
  carts.load(save?.carts);
  riding = null;
  ridingMob = null;
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
  for (let i = 0; i < 5; i++) {
    const id = save?.armour?.[i];
    armour[i] = ITEMS[id]?.armour?.piece === i ? id : null;
    armourWear[i] = armour[i] ? Math.max(0, +save?.armourWear?.[i] || 0) : 0;
  }
  for (const k of Object.keys(effects)) effects[k] = Math.max(0, +save?.effects?.[k] || 0);
  caneToday = Number.isFinite(save?.caneToday) ? save.caneToday : 0;
  waypoints = Array.isArray(save?.waypoints) ? save.waypoints.filter((w) => w && [w.x, w.y, w.z].every(Number.isFinite)).map((w) => ({ x: w.x, y: w.y, z: w.z, name: String(w.name ?? 'Mark').slice(0, 16) })).slice(0, 12) : [];
  if (save?.weather) weather.set(!!save.weather.raining, Math.max(10, +save.weather.timer || 60));
  else weather.set(false);
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
  // pets come back where you left them (or beside you, if that's far away)
  for (const [kind, x, y, z, sitting] of save?.pets ?? []) {
    if (!['wolf', 'camel'].includes(kind) || ![x, y, z].every(Number.isFinite)) continue;
    const far = Math.hypot(x - player.pos.x, z - player.pos.z) > 40;
    const m = far ? mobs.spawn(kind, player.pos.x + 1.5, player.pos.y + 0.2, player.pos.z + 1.5) : mobs.spawn(kind, x, y, z);
    mobs.setTame(m);
    m.sitting = !!sitting && !far;
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
    signs: signs.serialize(),
    frames: frames.serialize(),
    machines: machines.serialize(),
    carts: carts.serialize(),
    armour: [...armour],
    armourWear: [...armourWear],
    effects: { ...effects },
    caneToday,
    weather: { raining: weather.raining, timer: Math.round(weather.timer) },
    pets: mobs.pets(),
    waypoints,
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
  let bar = '';
  if (s.wear > 0 && maxWear(s.id)) {
    const left = Math.max(0, 1 - s.wear / maxWear(s.id));
    bar = `<span class="wear"><i style="--w:${Math.round(left * 100)}%;--wc:hsl(${Math.round(left * 120)},70%,45%)"></i></span>`;
  }
  return `<img src="${icons[s.id]}" alt=""><span class="count">${s.count > 1 ? s.count : ''}</span>${bar}`;
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

function touchingPrickly() {
  const p = player.pos, r = 0.36;
  for (let y = Math.floor(p.y); y <= Math.floor(p.y + 1.7); y++)
    for (let z = Math.floor(p.z - r); z <= Math.floor(p.z + r); z++)
      for (let x = Math.floor(p.x - r); x <= Math.floor(p.x + r); x++) if (BLOCKS[world.get(x, y, z)]?.prickly) return true;
  return false;
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
  riding = null;
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
  if (riding || ridingMob || player.inWater || player.inLava || player.climbing || player.onGround && wasGround) fallTop = null;
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
  // cactus spines: a point every half second while you're up against one
  if (touchingPrickly()) {
    if ((timers.cactus = (timers.cactus ?? 0) - dt) <= 0) { timers.cactus = 0.5; damage(1, 'You hugged a cactus.'); }
  } else timers.cactus = 0;
  // lava burns: 3 points every half second
  if (player.inLava && !(effects.fire > 0)) {
    if ((timers.lava -= dt) <= 0) { timers.lava = 0.5; damage(3, 'You tried to swim in lava.'); }
  } else timers.lava = 0;
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
// Silver arrows are used first when you have them.
function shootArrow(power) {
  const silver = inventory.count(SILVER_ARROW) > 0;
  if (!silver && inventory.count(ARROW) <= 0) { toast('You need arrows'); return; }
  inventory.remove(silver ? SILVER_ARROW : ARROW, 1);
  arrows.shoot(player.eye, player.lookDir(), power, silver);
}

// ---------- fishing ----------
// Tap with the rod to cast; tap again to reel in. Reel in while the bobber is bobbing under (a bite) to catch a fish.
function useRod(id) {
  if (!fishing.active) { fishing.cast(player.eye, player.lookDir(), id === WEIGHTED_ROD); return; }
  const at = fishing.state?.pos?.clone();
  if (!fishing.reel()) return;
  const [what, n, msg] = catchAt(at ?? player.pos);
  if (inventory.add(what, n) > 0) { toast('Inventory full: it got away'); return; }
  toast(msg, 1800);
  sound.pop();
}

// What's on the hook depends on where you fish: salmon in rivers, icefish in the cold, pufferfish in warm
// water, and now and then some junk, or treasure.
const TREASURE = [[GOLD_INGOT, 1], [SILVER_INGOT, 2], [CRYSTAL_SHARD, 3], [IRON_INGOT, 2], [NIGHT_TEA, 1], [SILVER_ARROW, 4]];
function catchAt(pos) {
  const x = Math.floor(pos.x), z = Math.floor(pos.z), r = Math.random();
  const gen = world.generator, biome = gen.biomeAt(x, z);
  if (r < 0.05) { const [id, n] = TREASURE[Math.floor(Math.random() * TREASURE.length)]; return [id, n, `Treasure! You fished up ${n > 1 ? n + ' × ' : ''}${itemName(id).toLowerCase()}`]; }
  if (r < 0.12) { const id = Math.random() < 0.6 ? OLD_BOOT : STICK; return [id, 1, `You fished up ${id === OLD_BOOT ? 'an old boot' : 'a soggy stick'}`]; }
  let id = RAW_FISH;
  const f = Math.random();
  if (biome === 'tundra' && f < 0.6) id = ICEFISH;
  else if (gen.isRiver(x, z) && f < 0.6) id = SALMON;
  else if (biome === 'desert' && f < 0.3) id = PUFFERFISH;
  else if (biome !== 'desert' && f < 0.06) id = PUFFERFISH;
  return [id, 1, `You caught ${id === RAW_FISH ? 'a fish' : id === PUFFERFISH ? 'a pufferfish' : 'a ' + itemName(id).replace('Raw ', '').toLowerCase()}!`];
}

// Where the line leaves the rod: a little to the right of and below your eye.
const rodTip = new THREE.Vector3();
function updateFishing(dt) {
  if (!fishing.active) return;
  if (!isRod(inventory.heldId()) || dead) { fishing.stop(); return; }
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
  for (let k = 0; k < 5; k++) make(ARMOUR_SLOT + k, $('inv-armour'));
}
const ARMOUR_SLOT = 100; // the armour slots count as 100..103 in the inventory panel
buildInventoryGrid();

const armourPiece = (id) => ITEMS[id]?.armour?.piece ?? -1;
function onInvSlot(i) {
  if (picked < 0) {
    if (i >= ARMOUR_SLOT ? armour[i - ARMOUR_SLOT] : inventory.slots[i]) picked = i;
  } else if (picked === i) {
    picked = -1;
  } else if (i >= ARMOUR_SLOT || picked >= ARMOUR_SLOT) {
    // between the backpack and an armour slot: only the right piece goes in each slot
    const [k, s] = i >= ARMOUR_SLOT ? [i - ARMOUR_SLOT, picked] : [picked - ARMOUR_SLOT, i];
    if (s >= ARMOUR_SLOT) { picked = -1; renderInventory(); return; }
    const item = inventory.slots[s];
    if (item && armourPiece(item.id) !== k) toast(k === 4 ? 'That isn\'t a shield' : `That isn't ${ARMOUR_PIECES[k].name.toLowerCase()} armour`);
    else {
      const worn = armour[k], wornWear = armourWear[k];
      armour[k] = item?.id ?? null;
      armourWear[k] = item?.wear ?? 0;
      inventory.slots[s] = worn ? { id: worn, count: 1, ...(wornWear ? { wear: wornWear } : {}) } : null;
      sound.pop();
      inventory.onChange();
    }
    picked = -1;
  } else {
    inventory.moveSlot(picked, i);
    picked = -1;
  }
  renderInventory();
}

// Tap with a piece of armour in hand to put it on (swapping with whatever you were wearing there).
function wearHeld() {
  const held = inventory.held();
  const k = armourPiece(held.id);
  const worn = armour[k], wornWear = armourWear[k];
  armour[k] = held.id;
  armourWear[k] = held.wear ?? 0;
  inventory.slots[inventory.selected] = worn ? { id: worn, count: 1, ...(wornWear ? { wear: wornWear } : {}) } : null;
  inventory.onChange();
  sound.pop();
  toast(k === 4 ? `Carrying ${itemName(held.id).toLowerCase()}: it stops hits from in front of you` : `Wearing ${itemName(held.id).toLowerCase()} · armour ${Math.round(armourShare() * 100)}%`, 1800);
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
  for (let k = 0; k < 5; k++) {
    const el = invEls[ARMOUR_SLOT + k];
    el.innerHTML = armour[k] ? slotHTML({ id: armour[k], count: 1, wear: armourWear[k] }) : `<span class="empty-armour">${['⛑', '👕', '👖', '👢', '🛡'][k]}</span>`;
    el.classList.toggle('picked', ARMOUR_SLOT + k === picked);
  }
  $('armour-total').textContent = armourPoints() ? `blocks ${Math.round(armourShare() * 100)}% of creature damage` : '';
  const hasTable = openedAt === TABLE || nearBlock(TABLE);
  const hasChurn = openedAt === CHURN || nearBlock(CHURN);
  $('table-status').textContent = `— crafting table ${hasTable ? '✓' : '✗'} · butter churn ${hasChurn ? '✓' : '✗'}`;
  const list = $('recipes');
  list.innerHTML = '';
  const query = $('recipe-search').value.trim().toLowerCase();
  const favs = new Set(settings.favs);
  // favourites first, then everything else in the usual order
  const shown = RECIPES.filter((r) => favs.has(recipeKey(r))).concat(RECIPES.filter((r) => !favs.has(recipeKey(r))));
  let count = 0;
  shown.forEach((r) => {
    if (r.metal && countOf(r.metal) <= 0) return; // metal tools only show up once you have that metal
    const fav = favs.has(recipeKey(r));
    if (favOnly && !fav) return;
    if (query && ![r.out[0], ...r.in.flatMap(([id]) => idsOf(id))].some((id) => itemName(id).toLowerCase().includes(query))) return;
    const stationOk = (!r.table || hasTable) && (!r.churn || hasChurn);
    const haveAll = r.in.every(([id, n]) => countOf(id) >= n) && (r.tools ?? []).every((id) => inventory.count(id) > 0);
    const canMake = haveAll && stationOk && inventory.room(r.out[0]) >= r.out[1];
    if (canMakeOnly && !canMake) return;
    count++;
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
    const star = document.createElement('button');
    star.className = 'fav' + (fav ? ' on' : '');
    star.textContent = fav ? '★' : '☆';
    star.title = fav ? 'Remove from favourites' : 'Add to favourites';
    star.addEventListener('click', () => {
      const k = recipeKey(r);
      settings.favs = fav ? settings.favs.filter((f) => f !== k) : [...settings.favs, k];
      saveSettings();
      renderInventory();
    });
    row.appendChild(star);
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
  if (!count) list.innerHTML = `<p class="hint">${query ? `Nothing matches "${query.replace(/[<>&"]/g, '')}".` : favOnly ? 'No favourites yet: tap the ☆ beside a recipe.' : 'Nothing you can make right now.'}</p>`;
}

// What a recipe is called in the favourites list: what it makes and from what.
const recipeKey = (r) => `${r.out[0]}x${r.out[1]}:${r.in.map(([id, n]) => idsOf(id).join('|') + 'x' + n).join(',')}`;
let favOnly = false, canMakeOnly = false;
$('recipe-search').addEventListener('input', () => renderInventory());
$('btn-fav-only').addEventListener('click', (e) => { favOnly = !favOnly; e.currentTarget.classList.toggle('on', favOnly); renderInventory(); });
$('btn-can-make').addEventListener('click', (e) => { canMakeOnly = !canMakeOnly; e.currentTarget.classList.toggle('on', canMakeOnly); renderInventory(); });

// Tidy a run of slots: stacks of the same thing are combined, and everything is put in order.
function sortSlots(slots, from = 0, to = slots.length) {
  const items = [];
  for (let i = from; i < to; i++) {
    const s = slots[i];
    if (!s) continue;
    const same = !s.wear && items.find((t) => t.id === s.id && !t.wear && t.count < maxStack(t.id));
    if (same) {
      const k = Math.min(s.count, maxStack(s.id) - same.count);
      same.count += k;
      if (s.count - k) items.push({ ...s, count: s.count - k });
    } else items.push({ ...s });
  }
  items.sort((a, b) => a.id - b.id || b.count - a.count);
  for (let i = from; i < to; i++) slots[i] = items[i - from] ?? null;
}
$('btn-sort').addEventListener('click', () => { sortSlots(inventory.slots, 9); picked = -1; sound.pop(); inventory.onChange(); });
$('btn-chest-sort').addEventListener('click', () => { const st = currentStation(); if (!st) return; sortSlots(st.inputs); stPicked = null; sound.pop(); renderStation(); });

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
  world.setBlock(x, y, z, d.stationBase + d.facing + (lit ? 4 : 0));
}

const currentStation = () => openStationAt && (openStationAt.cart ? openStationAt.cart.store : stations.get(openStationAt.x, openStationAt.y, openStationAt.z, openStationAt.kind));

function stationSlot(area, i) {
  const st = currentStation();
  if (area === 'in') return { get: () => st.inputs[i], set: (v) => { st.inputs[i] = v; } };
  if (area === 'fuel') return { get: () => st.fuel, set: (v) => { st.fuel = v; } };
  if (area === 'out') return { get: () => st.out, set: (v) => { st.out = v; } };
  return { get: () => inventory.slots[i], set: (v) => { inventory.slots[i] = v; } };
}

function openStation(x, y, z, cart = null) {
  const kind = cart ? 'chest' : stationKind(world.get(x, y, z));
  if (!cart) stations.get(x, y, z, kind);
  openStationAt = { x, y, z, kind, cart };
  stPicked = null;
  paused = true;
  controls.reset();
  document.exitPointerLock?.();
  const K = STATION_KINDS[kind];
  $('station-title').textContent = cart ? 'Storage Cart' : K.name;
  $('station').classList.toggle('storage', !!K.storage);
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
  ins.style.gridTemplateColumns = K.storage ? '' : `repeat(${K.inputs > 1 ? 2 : 1}, var(--slot))`;
  for (let i = 0; i < K.inputs; i++) make(ins, 'in', i);
  for (const [id, area] of [['st-fuel', 'fuel'], ['st-out', 'out']]) {
    $(id).innerHTML = '';
    if (!K.storage && (area === 'out' || !K.powered)) make($(id), area, 0);
  }
  $('station').querySelector('.st-fuel-row').style.display = K.powered ? 'none' : '';
  $('st-inv').innerHTML = ''; $('st-hotbar').innerHTML = '';
  for (let i = 9; i < SLOTS; i++) make($('st-inv'), 'inv', i);
  for (let i = 0; i < 9; i++) make($('st-hotbar'), 'inv', i);
  // what it can make
  $('st-recipes').innerHTML = K.recipes.map((r) => {
    const ing = r.in.map(([id, n]) => `<span class="ing" title="${idsOf(id).map(itemName).join(' or ')}"><img src="${icons[idsOf(id)[0]]}" alt="">${n}</span>`).join('');
    const tools = (r.tools ?? []).map((id) => `<span class="ing tool" title="${itemName(id)} (not used up)"><img src="${icons[id]}" alt="">kept</span>`).join('');
    return `<div class="recipe">${ing}${tools}<span class="arrow">→</span><img class="outimg" src="${icons[r.out[0]]}" alt="">` +
      `<span class="name">${r.out[1] > 1 ? r.out[1] + ' × ' : ''}${itemName(r.out[0])}</span></div>`;
  }).join('') + (K.powered ? '<p class="hint">Times are at 1x speed. Drive it with a water wheel or windmill by turning a shaft or gear ' +
    'against any face; gear it up for more speed.' + (kind === 'crusher' ? ' Ore dust smelts into ingots, so crushing ore doubles what you get.' : '') + '</p>'
    : '<p class="hint">Fuel, in items cooked per piece: log or planks 1, stick ½, coal or charcoal 10, ' +
    'slime fuel 40, lava bucket 100 (their buckets are left in the fuel slot). Fuel is only used while something is cooking.' +
    (K.speed ? ' A blast smelter works twice as fast on the same fuel.' : '') +
    (K.water ? ' It needs water: tap it with a water bucket (or leave it out in the rain). Every two teas use a level.' : '') + '</p>');
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
  const K = STATION_KINDS[st.kind];
  if (K.storage) {
    $('st-status').textContent = `${st.inputs.filter(Boolean).length} of ${K.inputs} slots used`;
    return;
  }
  const r = stations.recipeFor(st);
  $('st-progress').style.width = `${r ? Math.min(100, (st.progress / r.time) * 100) : 0}%`;
  if (STATION_KINDS[st.kind].powered) {
    const { x, y, z } = openStationAt;
    const power = kinetics.statusAt(x, y, z);
    const verb = STATION_KINDS[st.kind].verb;
    $('st-status').textContent = r && st.speed > 0 ? `${verb} ${itemName(idsOf(r.in[0][0])[0]).toLowerCase()}… ${power}` : `${r ? '' : 'Put something in. '}${power}`;
    return;
  }
  if (K.water && !(BLOCKS[world.get(openStationAt.x, openStationAt.y, openStationAt.z)]?.water > 0)) {
    $('st-status').textContent = 'The cauldron is dry: tap it with a water bucket, or leave it out in the rain';
    return;
  }
  $('st-flame').style.opacity = st.burn > 0 ? String(0.35 + 0.65 * (st.burn / (st.burnMax || 1))) : '0.12';
  const fuelLeft = st.burn > 1e-9 ? ` (fuel for ${+st.burn.toFixed(1)} more)` : '';
  $('st-status').textContent = r ? (st.burn > 1e-9 || (st.fuel && isFuel(st.fuel.id)) ? `Making ${itemName(r.out[0]).toLowerCase()}…${fuelLeft}` : 'Needs fuel') :
    `Put ingredients in${fuelLeft}`;
}

// Chest buttons: move everything in the backpack (not the hotbar) into the chest, or take it all out.
function chestMove(intoChest) {
  const st = currentStation();
  if (!st) return;
  const put = (slots, from, i) => {
    const s = from[i];
    if (!s) return;
    for (let j = 0; j < slots.length && s.count; j++) {
      const t = slots[j];
      if (t && t.id === s.id && t.count < maxStack(s.id)) { const k = Math.min(s.count, maxStack(s.id) - t.count); t.count += k; s.count -= k; }
    }
    for (let j = 0; j < slots.length && s.count; j++) if (!slots[j]) { slots[j] = { ...s }; s.count = 0; }
    if (!s.count) from[i] = null;
  };
  if (intoChest) for (let i = 9; i < SLOTS; i++) put(st.inputs, inventory.slots, i);
  else {
    for (let i = 0; i < st.inputs.length; i++) {
      const s = st.inputs[i];
      if (!s) continue;
      const left = inventory.addItem(s);
      st.inputs[i] = left ? { ...s, count: left } : null;
    }
  }
  sound.pop();
  inventory.onChange();
  renderStation();
}
$('btn-chest-in').addEventListener('click', () => chestMove(true));
$('btn-chest-out').addEventListener('click', () => chestMove(false));

function onStationSlot(area, i) {
  const st = currentStation();
  if (!st) return;
  // tapping the result collects it
  if (area === 'out' && !stPicked) {
    if (st.out) {
      const left = inventory.addItem(st.out);
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
    if (now - lastSwing < (isSword(inventory.heldId()) ? 300 : 450)) return; // swords swing quicker
    lastSwing = now;
    giveDrops(mobs.hurt(targetMob.mob, WEAPON_DAMAGE[inventory.heldId()] ?? ITEMS[inventory.heldId()]?.tool?.damage ?? 2, player.pos));
    wearOutHeld(1);
    return;
  }
  const r = mobs.interact(targetMob.mob, player.pos, inventory.heldId());
  if (r.trade) { openTrade(targetMob.mob); return; }
  if (r.ride) { mountMob(targetMob.mob); return; }
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
  if (id === HONEY_BOTTLE) { inventory.add(GLASS_BOTTLE, 1); health = Math.min(MAX_HEALTH, health + 2); renderHealth(); }
  if (id === PUFFERFISH) { poisoned = Math.max(poisoned, 15); toast('Ugh! The pufferfish was poisonous.', 2500); renderHealth(); }
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

const bedPartnerOr = (x, y, z, id) => (isBed(id) ? bedPartner(x, y, z) : [x, y, z]);
function toggleDoor(x, y, z, force = false) {
  const d = BLOCKS[world.get(x, y, z)];
  const by = d.upper ? y - 1 : y; // the bottom half
  if (!force && !d.open && (player.overlapsBlock(x, by, z) || player.overlapsBlock(x, by + 1, z))) return; // don't shut it on yourself
  world.setBlock(x, by, z, doorId(d.facing, !d.open, false));
  if (isDoor(world.get(x, by + 1, z))) world.setBlock(x, by + 1, z, doorId(d.facing, !d.open, true));
  sound.door(!d.open);
}

function toggleCurtain(x, y, z) {
  const d = BLOCKS[world.get(x, y, z)];
  world.setBlock(x, y, z, CURTAIN + d.axis + (d.open ? 0 : 2));
  sound.swish();
}

// Fence gates and trapdoors swing open and shut when tapped (or switched: see signals).
function toggleHatch(x, y, z, open) {
  const d = BLOCKS[world.get(x, y, z)];
  const want = open ?? !d.open;
  if (want === d.open) return;
  const base = d.gate ? FENCE_GATE + d.axis : TRAPDOOR + d.facing;
  world.setBlock(x, y, z, base + (want ? (d.gate ? 2 : 4) : 0));
  sound.door(want);
}

const isCarpet = (id) => id === CARPET || (id > DYED_CARPET && id <= DYED_CARPET + 9);
// Tap a block holding a dye to colour it: wool, carpet, glass and planks (plain or already coloured),
// or the writing on a sign. Returns true if it took the dye.
function dyeBlock(x, y, z, c) {
  const id = world.get(x, y, z), def = BLOCKS[id];
  let to = 0;
  if (isSign(id)) {
    signs.setColor(x, y, z, c);
    inventory.consumeHeld();
    sound.pop();
    toast(`The writing is ${COLORS[c].name.toLowerCase()} now`, 1500);
    return true;
  }
  if (id === WOOL || (id > DYED_WOOL && id <= DYED_WOOL + 9)) to = dyedWool(c);
  else if (isCarpet(id)) to = dyedCarpet(c);
  else if (id === GLASS || (id >= STAINED_GLASS && id < STAINED_GLASS + 10)) to = STAINED_GLASS + c;
  else if (id === PLANKS || (id >= PAINTED_PLANKS && id < PAINTED_PLANKS + 10)) to = PAINTED_PLANKS + c;
  if (!to || to === id) return false;
  world.setBlock(x, y, z, to);
  inventory.consumeHeld();
  sound.place(def.sound);
  return true;
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
    world.setBlock(x, y, z, BLOCKS[world.get(x, y, z)].lampBase + fuel + 1);
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
    if (fuel !== BLOCKS[id].fuel) world.setBlock(x, y, z, BLOCKS[id].lampBase + fuel);
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
  stations.tick(skipped, world, setStationLit, powerAt, boostAt);
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

// ---------- wear and repair ----------
// Tools, weapons, armour and shields wear a little with each use and break when worn out (unless wear
// is turned off in the menu). An anvil puts them right with a piece of what they're made of.
function wearOutHeld(n) {
  const s = inventory.held();
  if (!settings.wear || !s || !maxWear(s.id)) return;
  s.wear = (s.wear ?? 0) + n;
  if (s.wear >= maxWear(s.id)) {
    inventory.slots[inventory.selected] = null;
    sound.breakBlock('stone');
    toast(`Your ${itemName(s.id).toLowerCase()} broke!`, 2000);
  }
  inventory.onChange();
}
function wearArmour(k = -1, n = 1) {
  if (!settings.wear) return;
  for (let i = 0; i < 5; i++) {
    if (!armour[i] || (k >= 0 ? i !== k : i === 4)) continue;
    armourWear[i] += n;
    if (armourWear[i] >= maxWear(armour[i])) {
      toast(`Your ${itemName(armour[i]).toLowerCase()} fell apart!`, 2000);
      sound.breakBlock('stone');
      armour[i] = null; armourWear[i] = 0;
    }
  }
}
// A shield stops a hit (or a thorn) coming from in front of you; it wears by how hard the hit was.
function shieldBlocks(from, amount) {
  if (!armour[4] || !from) return false;
  const look = player.lookDir();
  const dx = from.x - player.pos.x, dz = from.z - player.pos.z, len = Math.hypot(dx, dz) || 1;
  const lookLen = Math.hypot(look.x, look.z) || 1;
  if ((dx * look.x + dz * look.z) / (len * lookLen) < 0.35) return false; // from the side or behind
  wearArmour(4, Math.max(1, Math.ceil(amount)));
  sound.place('stone');
  toast('Blocked!', 600);
  return true;
}
function useAnvil() {
  const s = inventory.held();
  if (!s || !maxWear(s.id)) { toast('Hold a worn tool, weapon, piece of armour or shield and tap the anvil to repair it', 2500); return; }
  if (!s.wear) { toast(`Your ${itemName(s.id).toLowerCase()} doesn't need repairing`); return; }
  const mat = ITEMS[s.id].repair;
  if (inventory.count(mat) < 1) { toast(`You need ${itemName(mat).toLowerCase()} to repair this`); return; }
  inventory.remove(mat, 1);
  s.wear = Math.max(0, Math.round(s.wear - maxWear(s.id) * 0.5));
  if (!s.wear) delete s.wear;
  inventory.onChange();
  sound.place('stone');
  toast(`Repaired with ${itemName(mat).toLowerCase()}: ${Math.round(100 - ((s.wear ?? 0) / maxWear(s.id)) * 100)}% as good as new`, 2000);
}

// ---------- teas ----------
const effects = { night: 0, haste: 0, fire: 0, heal: 0 }; // seconds left of each
const EFFECT_ICONS = { night: '🌙', haste: '⛏', fire: '🔥', heal: '💚' };
function drinkTea(id) {
  const [kind, secs] = ITEMS[id].tea;
  effects[kind] = Math.max(effects[kind], secs);
  inventory.consumeHeld();
  if (inventory.add(GLASS_BOTTLE, 1)) toast('Inventory full');
  sound.gulp();
  toast(`${itemName(id)}: you ${ITEMS[id].about}`, 2000);
}
function tickEffects(dt) {
  for (const k of Object.keys(effects)) effects[k] = Math.max(0, effects[k] - dt);
  if (effects.heal > 0 && health < MAX_HEALTH) { health = Math.min(MAX_HEALTH, health + dt * 1.2); renderHealth(); }
  lightUniforms.uAmbient.value = effects.night > 0 ? 0.3 : AMBIENT;
}
const effectsText = () => Object.entries(effects).filter(([, t]) => t > 0)
  .map(([k, t]) => `${EFFECT_ICONS[k]} ${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`).join('  ');

// ---------- dungeons ----------
// Deep underground, rare stone-brick rooms hold a shrine and a chest or two of loot. Come near an
// active shrine and its guardian, the Mossback King, rises to meet you; beat it and the shrine goes quiet.
const LOOT = [
  [IRON_INGOT, 2, 6, 0.8], [GOLD_INGOT, 1, 3, 0.5], [SILVER_INGOT, 1, 3, 0.4], [ELECTRUM_INGOT, 1, 2, 0.25],
  [TUNGSTEN_INGOT, 1, 2, 0.15], [GUNPOWDER, 2, 6, 0.5], [SILVER_ARROW, 4, 8, 0.4], [BAKED_FISH, 2, 4, 0.6],
  [NIGHT_TEA, 1, 2, 0.35], [HASTE_TEA, 1, 2, 0.3], [FIRE_TEA, 1, 1, 0.25], [HEAL_TEA, 1, 2, 0.3], [IRON_SHIELD, 1, 1, 0.12],
];
function rollLoot() {
  const out = [];
  for (const [id, a, b, p] of LOOT) if (Math.random() < p) out.push([id, a + Math.floor(Math.random() * (b - a + 1))]);
  return out.length ? out : [[IRON_INGOT, 3]];
}
let bossTimer = 0;
function tickBoss(dt) {
  if ((bossTimer -= dt) > 0) return;
  bossTimer = 1;
  if (dead) return;
  const pcx = Math.floor(player.pos.x / CHUNK), pcz = Math.floor(player.pos.z / CHUNK);
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const d = world.generator.dungeonAt(pcx + dx, pcz + dz);
    if (!d || world.get(d.x, d.y, d.z) !== BOSS_SHRINE) continue;
    if (Math.hypot(d.x + 0.5 - player.pos.x, d.z + 0.5 - player.pos.z) > 9 || Math.abs(d.y - player.pos.y) > 5) continue;
    const k = `${d.x},${d.y},${d.z}`;
    if (mobs.mobs.some((m) => m.shrine === k && !m.dying)) continue;
    const m = mobs.spawn('mossking', d.x + 0.5, d.y, d.z + 2.5);
    m.shrine = k;
    if (settings.difficulty !== 'peaceful') m.angry = 1e6;
    sound.boom(0.4);
    toast('The Mossback King rises from the shrine!', 3000);
  }
}
mobs.onDefeat = (m) => {
  if (!m.spec.boss || !m.shrine) return;
  const [x, y, z] = m.shrine.split(',').map(Number);
  if (world.get(x, y, z) === BOSS_SHRINE) world.setBlock(x, y, z, SPENT_SHRINE);
  toast('The Mossback King is defeated! The shrine falls quiet.', 4000);
};
function renderBossBar() {
  const boss = mobs.mobs.find((m) => m.spec.boss && !m.dying && m.pos.distanceTo(player.pos) < 32);
  $('boss-bar').classList.toggle('hidden', !boss);
  if (!boss) return;
  $('boss-name').textContent = boss.spec.name;
  $('boss-fill').style.width = `${Math.max(0, (boss.hp / boss.spec.hp) * 100)}%`;
}

// ---------- riding camels ----------
function mountMob(m) {
  ridingMob = m;
  m.ridden = true;
  player.vel.set(0, 0, 0);
  sound.mob(m.kind, 0.8);
  toast('Steer with the joystick (or WASD). Tap to get off.', 2500);
}
function dismount() {
  if (!ridingMob) return;
  ridingMob.ridden = false;
  player.spawn(ridingMob.pos.x + 1.1, ridingMob.pos.y + 0.3, ridingMob.pos.z);
  ridingMob = null;
}
function followMount() {
  if (!mobs.mobs.includes(ridingMob)) { ridingMob = null; return; }
  player.pos.set(ridingMob.pos.x, ridingMob.pos.y + 1.55, ridingMob.pos.z);
  player.vel.set(0, 0, 0);
  player.onGround = true;
  player.updateWaterState();
}
mobs.onPetKill = (drops) => giveDrops(drops);

// ---------- the wandering trader ----------
// Turns up now and then on a fine day with four offers, rolled from these: what you give -> what you get.
const TRADES = [
  [[WHEAT, 24], [TUNGSTEN_INGOT, 1]], [[LOG, 16], [ELECTRUM_INGOT, 2]], [[COBBLE, 48], [GOLD_INGOT, 2]],
  [[WOOL, 8], [SILVER_INGOT, 2]], [[BREAD, 6], [GUNPOWDER, 4]], [[RAW_FISH, 8], [NIGHT_TEA, 1]],
  [[SAND, 32], [STAINLESS_INGOT, 1]], [[FEATHER, 6], [SILVER_ARROW, 6]], [[IRON_INGOT, 4], [TUNGSTEN_INGOT, 1]],
  [[COAL, 16], [STEEL_INGOT, 2]], [[BERRIES, 12], [HEAL_TEA, 1]], [[SUGAR_CANE, 16], [COPPER_INGOT, 4]],
  [[CORNFLOWER, 4], [HASTE_TEA, 1]], [[COPPER_INGOT, 8], [IRON_SHIELD, 1]],
];
mobs.onTraderSpawn = (m) => {
  const pool = [...TRADES];
  m.trades = [];
  for (let i = 0; i < 4 && pool.length; i++) m.trades.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  toast('A wandering trader has turned up nearby', 3000);
};
// Villagers each have a trade, and offer three swaps from its list.
const VILLAGER_TRADES = {
  farmer: [[[LOG, 8], [BREAD, 4]], [[COBBLE, 24], [CAKE, 1]], [[STICK, 16], [WHEAT, 12]], [[FEATHER, 6], [BUTTER, 2]], [[BERRIES, 10], [COOKIE, 6]], [[COAL, 6], [FLOUR, 6]]],
  smith: [[[COAL, 12], [IRON_INGOT, 3]], [[LOG, 16], [STEEL_INGOT, 1]], [[GOLD_INGOT, 1], [STAINLESS_INGOT, 1]], [[COBBLE, 32], [COPPER_INGOT, 4]], [[LEATHER, 4], [IRON_SHIELD, 1]], [[CRYSTAL_SHARD, 4], [TUNGSTEN_INGOT, 1]]],
  fisher: [[[STICK, 12], [BAKED_FISH, 3]], [[STRING, 4], [WROD, 1]], [[WHEAT, 16], [SALMON, 4]], [[COAL, 8], [BAKED_SALMON, 3]], [[BREAD, 4], [ROD, 1]], [[OLD_BOOT, 2], [LEATHER, 3]]],
  cleric: [[[GOLD_INGOT, 1], [HEAL_TEA, 2]], [[BERRIES, 8], [NIGHT_TEA, 1]], [[HONEYCOMB, 3], [HASTE_TEA, 1]], [[SILVER_INGOT, 2], [CRYSTAL_SHARD, 4]], [[PAPER, 6], [FIRE_TEA, 1]], [[GLOW_MUSHROOM, 4], [NIGHT_TEA, 1]]],
};
const PROFESSION_NAMES = { farmer: 'Farmer', smith: 'Smith', fisher: 'Fisher', cleric: 'Cleric' };
mobs.onVillagerSpawn = (m) => {
  const pool = [...VILLAGER_TRADES[m.profession]];
  m.trades = [];
  for (let i = 0; i < 3; i++) m.trades.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
};
// The way to the nearest village, as the trader tells it ("about 300 blocks north-east"), or ''.
function villageHint() {
  const v = world.generator.nearestVillage(player.pos.x, player.pos.z, 8);
  if (!v) return '';
  const dx = v.x - player.pos.x, dz = v.z - player.pos.z, d = Math.hypot(dx, dz);
  if (d < 48) return ` You're right by ${v.name}.`;
  return ` There's a village called ${v.name} about ${Math.round(d / 50) * 50} blocks ${POINT_NAMES[pointOf(dx, dz)]} of here.`;
}
const POINT_NAMES = { N: 'north', NE: 'north-east', E: 'east', SE: 'south-east', S: 'south', SW: 'south-west', W: 'west', NW: 'north-west' };
let tradingWith = null;
function openTrade(m) {
  if (!m.trades) (m.spec.villager ? mobs.onVillagerSpawn : mobs.onTraderSpawn)(m);
  if (m.spec.villager) {
    $('trade-title').textContent = `${PROFESSION_NAMES[m.profession] ?? 'Villager'} of ${m.home?.name ?? 'the village'}`;
    $('trade-hint').textContent = '"Welcome, friend! Have a look at what I can offer."';
  } else {
    $('trade-title').textContent = 'Wandering Trader';
    $('trade-hint').textContent = `"Rare things from far away! I'll take what you have plenty of.${villageHint()}" The trader moves on after a while.`;
  }
  tradingWith = m;
  paused = true;
  controls.reset();
  document.exitPointerLock?.();
  sound.mob(m.kind, 1);
  $('trade').classList.remove('hidden');
  renderTrades();
}
function closeTrade() { $('trade').classList.add('hidden'); tradingWith = null; paused = false; }
function renderTrades() {
  const list = $('trades');
  list.innerHTML = '';
  for (const [[gid, gn], [oid, on]] of tradingWith.trades) {
    const row = document.createElement('div');
    row.className = 'recipe';
    const have = inventory.count(gid) >= gn;
    row.innerHTML = `<span class="ing${have ? '' : ' missing'}" title="${itemName(gid)}"><img src="${icons[gid]}" alt="">${gn}</span>` +
      `<span class="arrow">→</span><img class="outimg" src="${icons[oid]}" alt=""><span class="name">${on > 1 ? on + ' × ' : ''}${itemName(oid)}</span>`;
    const btn = document.createElement('button');
    btn.className = 'btn';
    btn.textContent = 'Trade';
    btn.disabled = !have || inventory.room(oid) < on;
    btn.addEventListener('click', () => {
      if (inventory.count(gid) < gn) return;
      inventory.remove(gid, gn);
      inventory.add(oid, on);
      sound.pop();
      renderTrades();
    });
    row.appendChild(btn);
    list.appendChild(row);
  }
}
$('btn-close-trade').addEventListener('click', closeTrade);
$('trade').addEventListener('click', (e) => { if (e.target.id === 'trade') closeTrade(); });

// ---------- switches and signals ----------
// Levers (flip on and off), buttons (on for a moment) and pressure plates (on while something stands on
// them) switch on the things beside them: doors, gates and trapdoors open, clutches engage and powered
// rails push carts along. A switch fixed to a block also reaches whatever touches that block.
const SIDES6 = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
const pressedButtons = new Map(); // "x,y,z" -> seconds until it pops back out
const pressedPlates = new Map(); // "x,y,z" -> seconds since anything stood on it
const attachedTo = (x, y, z, d) => (d.floor ? [x, y - 1, z] : [x - FACING_DIRS[d.facing][0], y, z - FACING_DIRS[d.facing][1]]);
function signalAt(x, y, z) {
  for (const [dx, dy, dz] of SIDES6) {
    const nx = x + dx, ny = y + dy, nz = z + dz;
    const d = BLOCKS[world.get(nx, ny, nz)];
    if (d?.switch) { if (d.on) return true; continue; }
    if (!d?.solid || d.shape !== 'cube') continue;
    // a switch fixed to this block passes its signal through it
    for (const [ex, ey, ez] of SIDES6) {
      const sx = nx + ex, sy = ny + ey, sz = nz + ez, s = BLOCKS[world.get(sx, sy, sz)];
      if (!s?.switch || !s.on) continue;
      const [ax, ay, az] = attachedTo(sx, sy, sz, s);
      if (ax === nx && ay === ny && az === nz) return true;
    }
  }
  return false;
}
kinetics.signalAt = signalAt;

function setSwitch(x, y, z, on) {
  const d = BLOCKS[world.get(x, y, z)];
  if (!d?.switch || d.on === on) return;
  const id = d.switch === 'lever' ? LEVER + (d.floor ? 4 : d.facing) + (on ? 5 : 0)
    : d.switch === 'button' ? BUTTON + d.facing + (on ? 4 : 0) : PRESSURE_PLATE + (on ? 1 : 0);
  world.setBlock(x, y, z, id);
  sound.click();
  signalChanged(x, y, z);
}

// A switch at (x, y, z) changed: everything it can reach catches up.
function signalChanged(x, y, z) {
  const cells = new Map();
  const add = (cx, cy, cz) => { for (const [dx, dy, dz] of SIDES6) cells.set(`${cx + dx},${cy + dy},${cz + dz}`, [cx + dx, cy + dy, cz + dz]); };
  add(x, y, z);
  for (const [dx, dy, dz] of SIDES6) if (BLOCKS[world.get(x + dx, y + dy, z + dz)]?.solid) add(x + dx, y + dy, z + dz);
  world.machinesChanged = true; // clutches
  for (const [cx, cy, cz] of cells.values()) {
    const id = world.get(cx, cy, cz), d = BLOCKS[id];
    if (isGate(id) || isTrapdoor(id)) toggleHatch(cx, cy, cz, signalAt(cx, cy, cz));
    else if (isDoor(id)) {
      const by = d.upper ? cy - 1 : cy;
      const on = signalAt(cx, by, cz) || signalAt(cx, by + 1, cz);
      if (on !== d.open) toggleDoor(cx, cy, cz, true);
    }
  }
}

// Buttons pop back out; pressure plates go down under you, animals and creatures, and up again after.
function tickSwitches(dt) {
  for (const [k, t] of pressedButtons) {
    if (t - dt > 0) { pressedButtons.set(k, t - dt); continue; }
    pressedButtons.delete(k);
    const [x, y, z] = k.split(',').map(Number);
    if (world.chunkAt(x, z)) setSwitch(x, y, z, false);
  }
  const standing = new Set();
  const feet = (px, py, pz) => {
    const x = Math.floor(px), y = Math.floor(py + 0.05), z = Math.floor(pz);
    if (BLOCKS[world.get(x, y, z)]?.switch === 'plate') standing.add(lampKey(x, y, z));
  };
  if (!dead && !riding) feet(player.pos.x, player.pos.y, player.pos.z);
  for (const m of mobs.mobs) if (!m.dying) feet(m.pos.x, m.pos.y, m.pos.z);
  for (const k of standing) {
    pressedPlates.set(k, 0);
    const [x, y, z] = k.split(',').map(Number);
    if (!BLOCKS[world.get(x, y, z)].on) setSwitch(x, y, z, true);
  }
  for (const [k, t] of pressedPlates) {
    if (standing.has(k)) continue;
    if (t + dt < 0.4) { pressedPlates.set(k, t + dt); continue; }
    pressedPlates.delete(k);
    const [x, y, z] = k.split(',').map(Number);
    if (world.chunkAt(x, z)) setSwitch(x, y, z, false);
  }
}

// ---------- item frames ----------
// Tap an empty frame holding something to put one in it; tap a full one to take it out.
function useFrame(x, y, z, held) {
  const item = frames.get(x, y, z);
  if (item) {
    frames.remove(x, y, z);
    giveDrops([[item, 1]]);
    return;
  }
  if (!held) { toast('Tap the frame holding something to show it here. On a hopper, it only lets matching things through.', 3500); return; }
  frames.set(x, y, z, held.id);
  inventory.consumeHeld();
  sound.place('wood');
}

// ---------- rails and minecarts ----------
// A rail you place joins up to two rails beside it (or a block higher or lower, as a slope), preferring
// ones already pointing at it, and they bend round to meet it.
function railNeighbour(x, y, z, d) {
  const [dx, dz] = FACING_DIRS[d];
  for (const dy of [0, 1, -1]) if (isRail(world.get(x + dx, y + dy, z + dz))) return [x + dx, y + dy, z + dz, dy];
  return null;
}
const joinedEnds = (x, y, z) => BLOCKS[world.get(x, y, z)].rail.ends.filter((d) => railBeyond(world, x, y, z, d));
function placeRail(x, y, z, powered) {
  const cands = [];
  for (let d = 0; d < 4; d++) {
    const n = railNeighbour(x, y, z, d);
    if (!n) continue;
    const nr = BLOCKS[world.get(n[0], n[1], n[2])].rail;
    const pointsHere = nr.ends.includes((d + 2) % 4);
    if (pointsHere || joinedEnds(n[0], n[1], n[2]).length < 2) cands.push({ d, n, dy: n[3], pri: pointsHere ? 0 : 1 });
  }
  cands.sort((a, b) => a.pri - b.pri);
  let pick = cands.slice(0, 2);
  const straight = (a, b) => (a + 2) % 4 === b;
  if (pick.length === 2 && powered && !straight(pick[0].d, pick[1].d)) pick = pick.slice(0, 1); // powered rails don't bend
  const up = pick.find((c) => c.dy === 1);
  if (up) pick = [up, ...pick.filter((c) => c !== up && straight(c.d, up.d))]; // a slope runs straight
  let ends;
  if (pick.length === 2) ends = [pick[0].d, pick[1].d];
  else if (pick.length === 1) ends = [pick[0].d, (pick[0].d + 2) % 4];
  else { const f = (facingTowardPlayer(x, z) + 2) % 4; ends = [f, (f + 2) % 4]; }
  world.setBlock(x, y, z, railId(ends, up && !powered ? up.d : -1, powered));
  for (const c of pick) {
    const [nx, ny, nz, dy] = c.n;
    const nr = BLOCKS[world.get(nx, ny, nz)].rail, back = (c.d + 2) % 4;
    if (nr.loader) continue; // loader rails stay straight
    if (nr.ends.includes(back) && (dy !== -1 || nr.slope === back)) continue; // already joined
    const keep = joinedEnds(nx, ny, nz).find((e) => e !== back);
    const nends = keep === undefined ? [back, (back + 2) % 4] : [keep, back];
    if (straight(nends[0], nends[1]) || !nr.powered) {
      const slope = dy === -1 && straight(nends[0], nends[1]) && !nr.powered ? back : -1; // a lower rail slopes up to meet this one
      if (dy === -1 && slope < 0) continue;
      world.setBlock(nx, ny, nz, railId(nends, slope, nr.powered));
    }
  }
}

function getInCart(cart) {
  riding = cart;
  player.vel.set(0, 0, 0);
  sound.place('stone');
  toast('Hold forward to push off, back to brake. Tap to get out.', 2500);
}
function getOutOfCart() {
  if (!riding) return;
  player.spawn(riding.pos.x, riding.pos.y + 0.7, riding.pos.z);
  riding = null;
}
// Sit in the cart: you go where it goes.
function followCart() {
  if (!carts.carts.includes(riding)) { riding = null; return; }
  player.pos.set(riding.pos.x, riding.pos.y - 0.32, riding.pos.z);
  player.vel.set(0, 0, 0);
  player.onGround = true;
  player.updateWaterState();
}

// ---------- signs ----------
let signAt = null; // the sign being written on
function editSign(x, y, z) {
  signAt = { x, y, z };
  paused = true;
  controls.reset();
  document.exitPointerLock?.();
  $('sign-text').value = signs.get(x, y, z);
  $('sign-edit').classList.remove('hidden');
  setTimeout(() => $('sign-text').focus(), 50);
}
function closeSign() {
  if (!signAt) return;
  const { x, y, z } = signAt;
  if (isSign(world.get(x, y, z))) signs.set(x, y, z, $('sign-text').value);
  signAt = null;
  $('sign-text').blur();
  $('sign-edit').classList.add('hidden');
  paused = false;
  saveGame();
}
$('btn-sign-done').addEventListener('click', closeSign);
$('sign-text').addEventListener('input', (e) => {
  // keep to 4 lines of 16 letters as you type
  const lines = e.target.value.split('\n');
  if (lines.length > 4 || lines.some((l) => l.length > 16)) {
    const pos = e.target.selectionStart;
    e.target.value = lines.slice(0, 4).map((l) => l.slice(0, 16)).join('\n');
    e.target.selectionStart = e.target.selectionEnd = Math.min(pos, e.target.value.length);
  }
});

function place() {
  if (paused) return;
  const held = inventory.held();
  if (isRod(held?.id)) { useRod(held.id); return; }
  // with the bow in hand a tap always shoots (a quick, short shot), whatever you're looking at
  if (held?.id === BOW) { shootArrow(Math.max(0.25, Math.min(1, bowCharge / FULL_DRAW))); bowCharge = 0; return; }
  if (riding) { getOutOfCart(); return; }
  if (ridingMob) { dismount(); return; }
  if (targetCart) {
    const c = targetCart.cart;
    if (c.store) { sound.click(); openStation(c.x, c.y, c.z, c); } else getInCart(c);
    return;
  }
  if (targetMob) { hitMob(); return; }
  if ((held?.id === MINECART || held?.id === STORAGE_CART) && target && isRail(target.id)) {
    if (carts.add(world, target.x, target.y, target.z, player.lookDir(), held.id === STORAGE_CART)) { inventory.consumeHeld(); sound.place('stone'); }
    return;
  }
  if (target && (target.id === TABLE || target.id === CHURN)) { sound.click(); openInventory(target.id); return; }
  if (target) {
    const { x: tx, y: ty, z: tz, id: tid } = target;
    if (held?.id === MAP && (isSign(tid) || isBed(tid))) { toggleWaypoint(tx, ty, tz, tid); return; }
    if (isBed(tid)) { useBed(tx, ty, tz); return; }
    if (isDoor(tid)) { toggleDoor(tx, ty, tz); return; }
    if (isCurtain(tid)) { toggleCurtain(tx, ty, tz); return; }
    if (isGate(tid) || isTrapdoor(tid)) { toggleHatch(tx, ty, tz); return; }
    if (BLOCKS[tid].switch === 'lever') { setSwitch(tx, ty, tz, !BLOCKS[tid].on); return; }
    if (BLOCKS[tid].switch === 'button') { setSwitch(tx, ty, tz, true); pressedButtons.set(lampKey(tx, ty, tz), 1.5); return; }
    if (isFrame(tid)) { useFrame(tx, ty, tz, held); return; }
    if (BLOCKS[tid].hive >= 0 && (held?.id === GLASS_BOTTLE || !held || !isBlock(held.id))) {
      const lv = BLOCKS[tid].hive;
      if (held?.id === GLASS_BOTTLE && lv >= MAX_HONEY) {
        world.setBlock(tx, ty, tz, BEE_HIVE);
        inventory.consumeHeld();
        giveDrops([[HONEY_BOTTLE, 1]]);
        sound.splash(false);
        toast('You fill a bottle with honey', 1500);
      } else toast(lv >= MAX_HONEY ? 'The hive is full of honey: tap it holding a glass bottle' : `The bees are making honey (${lv}/${MAX_HONEY})`, 2000);
      return;
    }
    if (BLOCKS[tid].bell) {
      const v = world.generator.nearestVillage(tx, tz, 1);
      sound.ding?.() ?? sound.pop();
      toast(v ? `Welcome to ${v.name}` : 'Ding!', 2200);
      return;
    }
    if (tid === BERRY_BUSH + 1) {
      world.setBlock(tx, ty, tz, BERRY_BUSH);
      sound.breakBlock('leaves');
      giveDrops([[BERRIES, 2 + (Math.random() < 0.5 ? 1 : 0)]]);
      return;
    }
    if (held && ITEMS[held.id]?.dye !== undefined && dyeBlock(tx, ty, tz, ITEMS[held.id].dye)) return;
    if (isLamp(tid)) { useLamp(tx, ty, tz, held); return; }
    if (isSign(tid)) { editSign(tx, ty, tz); return; }
    if (tid === BLAST_CHARGE) { lightFuse(tx, ty, tz); toast('The fuse is lit! Stand back…', 1500); return; }
    if (tid === ANVIL) { useAnvil(); return; }
    if (BLOCKS[tid].station === 'cauldron' && held?.id === WATER_BUCKET) {
      world.setBlock(tx, ty, tz, CAULDRON + 3);
      inventory.slots[inventory.selected] = { id: BUCKET, count: 1 };
      inventory.onChange();
      sound.splash(false);
      return;
    }
    if (tid === LOOT_CHEST) {
      // a dungeon chest: its loot is put in the first time it's opened
      const st = stations.get(tx, ty, tz, 'chest');
      rollLoot().forEach(([id, n], i) => { st.inputs[i * 2 % st.inputs.length] = { id, count: n }; });
      world.setBlock(tx, ty, tz, CHEST);
    }
    if (stationKind(tid)) { sound.click(); openStation(tx, ty, tz); return; }
    if (BLOCKS[tid].machine || BLOCKS[tid].kinetic) {
      // tap a machine (or a wheel or windmill) to see how it's running
      const what = BLOCKS[tid];
      let msg = kinetics.statusAt(tx, ty, tz);
      if (tid >= DRILL && tid <= DRILL + 4 && powerAt(tx, ty, tz) > 0) msg = machines.drillStatus(tx, ty, tz);
      if (!(held && isBlock(held.id))) { toast(`${what.name}: ${msg}`, 2500); return; } // (holding a block, you place it)
    }
  }
  // sugar cane in hand: plant it if you're aiming at a good spot beside water, otherwise eat it
  if (held?.id === SUGAR_CANE) {
    const ground = target && (target.id === SAND || target.id === GRASS || target.id === DIRT);
    const plantable = target && target.ny === 1 && world.get(target.x, target.y + 1, target.z) === AIR &&
      (target.id === SUGAR_CANE || (ground && waterBeside(target.x, target.y, target.z)));
    if (!plantable) { eatCane(); return; }
  }
  if (held?.id === BUCKET || held?.id === WATER_BUCKET) { useBucket(held.id); return; }
  if (held?.id === LEAD_BUCKET || held?.id === LAVA_BUCKET) { useLeadBucket(held.id); return; }
  if (held && (foodValue(held.id) || ITEMS[held.id]?.drink)) { eat(held.id); return; }
  if (held && ITEMS[held.id]?.tea) { drinkTea(held.id); return; }
  if (held && ITEMS[held.id]?.armour) { wearHeld(); return; }
  if (!target || !held) return;
  // ladders and scaffolding tapped with more of the same grow upward from the top of the column
  if ((held.id === LADDER && BLOCKS[target.id].climb && target.id !== SCAFFOLD) || (held.id === SCAFFOLD && target.id === SCAFFOLD)) {
    let ty = target.y;
    while (ty < H - 1 && world.get(target.x, ty + 1, target.z) === target.id) ty++;
    if (ty >= H - 1 || world.get(target.x, ty + 1, target.z) !== AIR) return;
    world.setBlock(target.x, ty + 1, target.z, target.id);
    sound.place('wood');
    inventory.consumeHeld();
    return;
  }
  // what goes into the world: the block itself, or what an item plants (seeds -> young wheat)
  let id = isBlock(held.id) ? held.id : ITEMS[held.id]?.places;
  if (!id) return;
  const x = target.x + target.nx, y = target.y + target.ny, z = target.z + target.nz;
  const there = world.get(x, y, z);
  if (!world.inBounds(x, y, z) || (there !== AIR && !isWaterId(there))) return;
  if (id === TORCH) {
    // torches need a solid block to stand on or hang from, and can't go underwater or on ceilings
    if (there !== AIR || target.ny < 0 || !BLOCKS[target.id].solid || isTorch(target.id)) return;
    if (target.ny === 0) id = TORCH_WALL_W + WALL_TORCH_DIRS.findIndex(([dx, dz]) => dx === -target.nx && dz === -target.nz);
  } else if (isWheat(id)) {
    // seeds go on top of grass or dirt
    if (there !== AIR || target.ny !== 1 || (target.id !== GRASS && target.id !== DIRT)) { toast('Plant seeds on top of grass or dirt'); return; }
  } else if (id === BERRY_BUSH) {
    if (there !== AIR || target.ny !== 1 || (target.id !== GRASS && target.id !== DIRT)) { toast('Plant berry bushes on top of grass or dirt'); return; }
  } else if (isFlower(id)) {
    if (there !== AIR || target.ny !== 1 || (target.id !== GRASS && target.id !== DIRT)) { toast('Plant flowers on top of grass or dirt'); return; }
  } else if (isSlab(id)) {
    // a slab onto a slab of the same kind makes the full block; otherwise it goes in the top or bottom
    // half of the space, by where on the block you tap
    const s = BLOCKS[id].slab;
    const tslab = BLOCKS[target.id].slab;
    if (tslab && tslab.mat === s.mat && ((target.ny === 1 && !tslab.top) || (target.ny === -1 && tslab.top))) {
      world.setBlock(target.x, target.y, target.z, SHAPE_MATS[s.mat].full);
      sound.place(BLOCKS[id].sound);
      inventory.consumeHeld();
      return;
    }
    const hitY = player.eye.y + player.lookDir().y * target.t - target.y;
    const top = target.ny === -1 || (target.ny === 0 && hitY > 0.5);
    if (there !== AIR && !isWaterId(there)) return;
    const half = BLOCKS[slabId(s.mat, top)].boxes[0];
    if (player.overlapsBlock(x, y + half[1] / 16, z) && player.pos.y < y + half[4] / 16 && player.pos.y + 1.8 > y + half[1] / 16) return;
    id = slabId(s.mat, top);
  } else if (id === GLOW_MUSHROOM) {
    if (there !== AIR || target.ny !== 1 || !BLOCKS[target.id].solid || BLOCKS[target.id].transparent) { toast('Mushrooms grow on top of a solid block'); return; }
  } else if (id === SAPLING) {
    if (there !== AIR || target.ny !== 1 || (target.id !== GRASS && target.id !== DIRT)) { toast('Plant saplings on top of grass or dirt'); return; }
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
  } else if (id === RAIL || id === POWERED_RAIL || id === LOADER_RAIL) {
    // rails lie on top of a block, and bend to join the rails next to them (loader rails just run straight)
    if (there !== AIR || target.ny !== 1 || !BLOCKS[target.id].solid) { toast('Rails go on top of a block'); return; }
    if (id === LOADER_RAIL) world.setBlock(x, y, z, LOADER_RAIL + (facingTowardPlayer(x, z) % 2));
    else placeRail(x, y, z, id === POWERED_RAIL);
    sound.place('stone');
    inventory.consumeHeld();
    return;
  } else if (id === LEVER || id === BUTTON || id === ITEM_FRAME || id === PRESSURE_PLATE) {
    // switches and frames are fixed to the side of a solid block (a lever can also stand on top of one,
    // and a pressure plate only goes on top)
    if (there !== AIR || !BLOCKS[target.id].solid) return;
    const side = FACING_DIRS.findIndex(([dx, dz]) => dx === target.nx && dz === target.nz);
    if (id === PRESSURE_PLATE) { if (target.ny !== 1) { toast('Pressure plates go on top of a block'); return; } }
    else if (id === LEVER && target.ny === 1) id = LEVER + 4;
    else if (target.ny !== 0) { toast(`${BLOCKS[id].name}s go on the side of a block`); return; }
    else id += side;
    world.setBlock(x, y, z, id);
    sound.place(BLOCKS[id].sound);
    inventory.consumeHeld();
    return;
  } else if (id === LADDER || id === SIGN) {
    // fixed to the side of a solid block, facing out of it; a sign can also stand on top of one
    if (there !== AIR || !BLOCKS[target.id].solid) return;
    if (id === SIGN && target.ny === 1) id = SIGN_POST + facingTowardPlayer(x, z);
    else if (target.ny !== 0) { toast(id === LADDER ? 'Ladders go on the side of a block' : 'Signs go on a wall or on top of a block'); return; }
    else id += FACING_DIRS.findIndex(([dx, dz]) => dx === target.nx && dz === target.nz);
    world.setBlock(x, y, z, id);
    sound.place('wood');
    inventory.consumeHeld();
    if (isSign(id)) editSign(x, y, z);
    return;
  } else if (id === LAMP || id === MIRROR_LAMP || isCarpet(id)) {
    if (there !== AIR || !world.isSolid(x, y - 1, z)) { toast(`${BLOCKS[id].name}s need something solid underneath`); return; }
  } else {
    // chairs face you; curtains hang across your line of sight
    if ([CHAIR, OVEN, SMELTER, BLAST_SMELTER, CRUSHER, CHEST, IRON_CHEST, SAW, TRIP_HAMMER].includes(id)) id += facingTowardPlayer(x, z); // the front faces you
    else if (id === DRILL) id += player.pitch < -0.75 ? 4 : (facingTowardPlayer(x, z) + 2) % 4; // drills the way you're looking
    else if (id === BELT) id += (facingTowardPlayer(x, z) + 2) % 4; // carries things away from you
    else if (id === HOPPER) id += target.ny === 1 ? 4 : FACING_DIRS.findIndex(([dx, dz]) => dx === -target.nx && dz === -target.nz); // into the block you tapped
    else if (BLOCKS[id].kinetic) id = kineticVariant(id);
    else if (id === CURTAIN) id += facingTowardPlayer(x, z) % 2; // facing 0/2 -> hangs across x, 1/3 -> across z
    else if (BLOCKS[id].stair) id += facingTowardPlayer(x, z); // you walk up them away from you
    else if (id === FENCE_GATE) id += facingTowardPlayer(x, z) % 2; // across your way
    else if (id === TRAPDOOR) id += target.ny === 0 ? FACING_DIRS.findIndex(([dx, dz]) => dx === -target.nx && dz === -target.nz) : (facingTowardPlayer(x, z) + 2) % 4; // hinged on the block you tap
    if (BLOCKS[id].solid && player.overlapsBlock(x, y, z)) return;
  }
  world.setBlock(x, y, z, id);
  sound.place(BLOCKS[id].sound);
  inventory.consumeHeld();
}

// Which way a shaft, gear or water wheel goes when placed: its axle points out of the face you tap,
// except against the side of another part, where it lines up with that part (so gears sit side by side).
// A water wheel's axle is always level: on top of a block it points the way you're looking.
function kineticVariant(id) {
  const k = BLOCKS[id].kinetic;
  let axis = target.nx ? 0 : target.ny ? 1 : 2;
  const other = BLOCKS[target.id].kinetic;
  if (other && other.axis !== axis) axis = other.axis;
  if (k.part === 'wheel' || k.part === 'windmill') {
    if (axis === 1) { const look = player.lookDir(); axis = Math.abs(look.x) > Math.abs(look.z) ? 0 : 2; }
    return (k.part === 'wheel' ? WATER_WHEEL : WINDMILL) + (axis === 2 ? 1 : 0);
  }
  return id + axis;
}

// An empty bucket scoops up still water (the sea refills behind it); a full one pours it out where
// you tap. Water poured above sea level runs downhill: that's what turns water wheels.
function useBucket(id) {
  if (id === BUCKET) {
    const hit = world.raycast(player.eye, player.lookDir(), REACH, false, true);
    if (!hit || hit.id !== WATER) { toast('Tap still water to fill the bucket'); return; }
    world.setBlock(hit.x, hit.y, hit.z, AIR);
    inventory.consumeHeld();
    if (inventory.add(WATER_BUCKET, 1)) toast('Inventory full');
    sound.splash(false);
    return;
  }
  if (!target) return;
  const x = target.x + target.nx, y = target.y + target.ny, z = target.z + target.nz;
  const there = world.get(x, y, z);
  if (!world.inBounds(x, y, z) || (there !== AIR && !isFlowing(there))) return;
  world.setBlock(x, y, z, WATER);
  inventory.slots[inventory.selected] = { id: BUCKET, count: 1 };
  inventory.onChange();
  sound.splash(false);
}

// A lead bucket scoops up lava (a wooden one would burn); a lava bucket pours it out again.
// Lava poured next to water cools into obsidian at once.
function useLeadBucket(id) {
  if (id === LEAD_BUCKET) {
    const hit = world.raycast(player.eye, player.lookDir(), REACH, false, true);
    if (!hit || hit.id !== LAVA) { toast(hit?.id === WATER ? 'Use a wooden bucket for water' : 'Tap lava to fill the lead bucket'); return; }
    world.setBlock(hit.x, hit.y, hit.z, AIR);
    inventory.consumeHeld();
    if (inventory.add(LAVA_BUCKET, 1)) toast('Inventory full');
    sound.pour();
    return;
  }
  if (!target) return;
  const x = target.x + target.nx, y = target.y + target.ny, z = target.z + target.nz;
  const there = world.get(x, y, z);
  if (!world.inBounds(x, y, z) || (there !== AIR && !isFlowing(there))) return;
  if (player.overlapsBlock(x, y, z)) return;
  world.setBlock(x, y, z, LAVA);
  inventory.slots[inventory.selected] = { id: LEAD_BUCKET, count: 1 };
  inventory.onChange();
  sound.pour();
}

// ---------- blasting charges ----------
// Tap a charge to light its fuse; 3 seconds later it blows a round hole about 5 blocks across. Most of
// what it breaks is thrown to you (as if dug with an iron pickaxe) if you're within 24 blocks. Charges
// caught in the blast go off too. Chests, machines, furniture, obsidian and bedrock are blast-proof.
const fuses = new Map(); // "x,y,z" -> { t, mesh }
const fuseMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false });
const BLAST_RADIUS = 2.6;
const IRON_PICK = metalTool(TOOL_MATERIALS.findIndex((m) => m.key === 'iron'), 'pick');
function lightFuse(x, y, z, t = 3) {
  const k = `${x},${y},${z}`;
  if (fuses.has(k)) return;
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(1.02, 1.02, 1.02), fuseMat.clone());
  mesh.position.set(x + 0.5, y + 0.5, z + 0.5);
  scene.add(mesh);
  fuses.set(k, { t, mesh });
  sound.fuse();
}
function tickFuses(dt) {
  for (const [k, f] of fuses) {
    const [x, y, z] = k.split(',').map(Number);
    if (world.get(x, y, z) !== BLAST_CHARGE) { removeFuse(k, f); continue; }
    f.t -= dt;
    f.mesh.material.opacity = (Math.sin(f.t * (f.t < 1 ? 30 : 12)) * 0.5 + 0.5) * 0.55; // flashing faster as it burns down
    if (f.t <= 0) { removeFuse(k, f); explode(x, y, z); }
  }
}
function removeFuse(k, f) {
  scene.remove(f.mesh);
  f.mesh.geometry.dispose();
  f.mesh.material.dispose();
  fuses.delete(k);
}
const blastable = (def) => def && !def.blastproof && !def.liquid && !def.station && !def.kinetic && def.hardness !== Infinity &&
  (def.shape === 'cube' || def.shape === 'cross' || def.shape === 'torch' || def.climb || def.sign || def.slab || def.stair || def.shape === 'fence' || def.shape === 'pane');
function explode(x, y, z) {
  world.setBlock(x, y, z, AIR);
  const R = BLAST_RADIUS, gathered = new Map();
  const near = (x + 0.5 - player.pos.x) ** 2 + (y + 0.5 - player.pos.y) ** 2 + (z + 0.5 - player.pos.z) ** 2 < 24 * 24;
  const cleared = [];
  for (let dy = -3; dy <= 3; dy++) for (let dz = -3; dz <= 3; dz++) for (let dx = -3; dx <= 3; dx++) {
    if (dx * dx + dy * dy + dz * dz > R * R) continue;
    const bx = x + dx, by = y + dy, bz = z + dz;
    const id = world.get(bx, by, bz);
    if (id === AIR) continue;
    if (id === BLAST_CHARGE) { lightFuse(bx, by, bz, 0.25 + Math.random() * 0.2); continue; }
    const def = BLOCKS[id];
    if (!blastable(def)) continue;
    if (isSign(id)) signs.remove(bx, by, bz);
    world.setBlock(bx, by, bz, AIR);
    cleared.push([bx, by, bz]);
    if (near && Math.random() < 0.75) for (const [d, n] of dropsFor(id, IRON_PICK)) gathered.set(d, (gathered.get(d) ?? 0) + n);
  }
  for (const [bx, by, bz] of cleared) dropUnsupported(bx, by, bz);
  if (gathered.size) {
    let lost = 0;
    for (const [d, n] of gathered) lost += inventory.add(d, n);
    toast(`Boom! ${[...gathered].map(([d, n]) => `+${n} ${itemName(d)}`).slice(0, 4).join(', ')}${lost ? ' (inventory full)' : ''}`, 2200);
  }
  // the blast: a flash, a bang and a shove
  const dist = Math.hypot(x + 0.5 - player.pos.x, y + 0.5 - (player.pos.y + 0.9), z + 0.5 - player.pos.z);
  sound.boom(Math.max(0.15, 1 - dist / 40));
  flashBlast(x + 0.5, y + 0.5, z + 0.5);
  if (dist < 5.5 && !dead) {
    const len = dist || 1;
    player.kx = ((player.pos.x - x - 0.5) / len) * 10; player.kz = ((player.pos.z - z - 0.5) / len) * 10;
    player.vel.y = 6;
    damage(armoured(Math.round((5.5 - dist) * 3)), 'You stood too close to a blasting charge.');
  }
  for (const m of mobs.mobs) {
    const d = Math.hypot(m.pos.x - x - 0.5, m.pos.y - y, m.pos.z - z - 0.5);
    if (d > 5.5) continue;
    if (m.spec.hostile) giveDrops(mobs.hurt(m, Math.round((5.5 - d) * 6), { x: x + 0.5, y, z: z + 0.5 }));
    else mobs.bump(m, { x: x + 0.5, y, z: z + 0.5 });
  }
}
const blasts = [];
function flashBlast(x, y, z) {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), new THREE.MeshBasicMaterial({ color: 0xffd27a, transparent: true, opacity: 0.85, depthWrite: false }));
  mesh.position.set(x, y, z);
  scene.add(mesh);
  blasts.push({ mesh, t: 0 });
}
function tickBlasts(dt) {
  for (let i = blasts.length - 1; i >= 0; i--) {
    const b = blasts[i];
    b.t += dt;
    b.mesh.scale.setScalar(1 + b.t * 9);
    b.mesh.material.opacity = Math.max(0, 0.85 - b.t * 2.4);
    if (b.t > 0.36) { scene.remove(b.mesh); b.mesh.geometry.dispose(); b.mesh.material.dispose(); blasts.splice(i, 1); }
  }
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
  if (isRod(inventory.heldId())) { crack.visible = false; breakState.key = ''; breakState.progress = 0; return; }
  // holding on an animal taps it again every half second instead of breaking blocks. The first
  // repeat waits half a second too, so a tap (which acts once, on release) never acts twice.
  // hold on a minecart to pick it up
  if (controls.breaking && targetCart) {
    breakState.cart = (breakState.cart ?? 0) + dt;
    if (breakState.cart >= 0.5) {
      const c = targetCart.cart;
      if (openStationAt?.cart === c) closeStation();
      carts.remove(c);
      targetCart = null;
      breakState.cart = 0;
      giveDrops([[c.store ? STORAGE_CART : MINECART, 1], ...(c.store?.inputs ?? []).filter(Boolean).map((it) => [it.id, it.count])]);
    }
    crack.visible = false;
    return;
  }
  breakState.cart = 0;
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
  breakState.progress += dt * (effects.haste > 0 ? 1.5 : 1) / Math.max(t, 0.05);
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
  if (id === LOOT_CHEST) drops.push(...rollLoot());
  if (ITEMS[inventory.heldId()]?.tool?.type === def.tool && def.hardness > 0) wearOutHeld(1);
  if (isDoor(id)) {
    // either half takes the whole door with it
    const oy = def.upper ? y - 1 : y + 1;
    if (isDoor(world.get(x, oy, z))) world.setBlock(x, oy, z, AIR);
    drops = [[DOOR, 1]];
  }
  if (isLamp(id)) lamps.delete(lampKey(x, y, z));
  if (isSign(id)) signs.remove(x, y, z);
  if (isSign(id) || isBed(id)) { dropWaypoint(x, y, z); dropWaypoint(...bedPartnerOr(x, y, z, id)); }
  if (isFrame(id)) { const item = frames.remove(x, y, z); if (item) drops.push([item, 1]); }
  if (stationKind(id)) giveDrops(stations.remove(x, y, z)); // whatever was inside comes back too
  if (def.machine) giveDrops(machines.removeAt(x, y, z)); // and whatever was on a belt or in a drill
  if (isBed(id)) {
    // either half takes the whole bed with it
    const [ox, oy, oz] = bedPartner(x, y, z);
    if (isBed(world.get(ox, oy, oz))) world.setBlock(ox, oy, oz, AIR);
    const used = (bx, by, bz) => bedSpawn && bedSpawn.x === bx && bedSpawn.y === by && bedSpawn.z === bz;
    if (used(x, y, z) || used(ox, oy, oz)) bedSpawn = null;
    drops = [[BED, 1]];
  }
  // scaffolding: the whole tower above comes down with it
  if (id === SCAFFOLD) {
    let n = 0;
    for (let ty = y + 1; ty < H && world.get(x, ty, z) === SCAFFOLD; ty++) { world.setBlock(x, ty, z, AIR); n++; }
    if (n) drops.push([SCAFFOLD, n]);
  }
  // cutting a tree's trunk with an axe brings down the whole tree above it
  const felled = id === LOG && ITEMS[inventory.heldId()]?.tool?.type === 'axe' ? treeAbove(x, y, z) : [];
  world.setBlock(x, y, z, id === ICE ? WATER : AIR); // ice melts into water
  if (def.switch) signalChanged(x, y, z);
  dropUnsupported(x, y, z);
  for (const [lx, ly, lz] of felled) {
    world.setBlock(lx, ly, lz, AIR);
    dropUnsupported(lx, ly, lz);
  }
  if (felled.length) drops.push([LOG, felled.length]);
  if (felled.length) {
    sound.breakBlock('leaves');
    toast(`Timber! +${felled.length + 1} Log`, 1800);
  }
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

// The logs of a tree standing on the log at (x, y, z): every log joined to it at or above its height,
// highest first. Only counts as a tree if some of those logs touch leaves, so log buildings are safe.
const MAX_FELL = 64;
function treeAbove(x, y, z) {
  const seen = new Set([`${x},${y},${z}`]);
  const logs = [];
  const queue = [[x, y, z]];
  let leafy = false;
  while (queue.length && logs.length < MAX_FELL) {
    const [cx, cy, cz] = queue.shift();
    for (let dy = 0; dy <= 1; dy++) for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
      const nx = cx + dx, ny = cy + dy, nz = cz + dz;
      if (ny < y) continue;
      const key = `${nx},${ny},${nz}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const id = world.get(nx, ny, nz);
      if (id === LEAVES) leafy = true;
      else if (id === LOG && logs.length < MAX_FELL) { logs.push([nx, ny, nz]); queue.push([nx, ny, nz]); }
    }
  }
  return leafy ? logs.sort((a, b) => b[1] - a[1]) : [];
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
  // ladders and signs fixed to it (each faces away from the block it hangs on), and a sign post on top
  FACING_DIRS.forEach(([dx, dz], f) => {
    const id = world.get(x + dx, y, z + dz), d = BLOCKS[id];
    const hung = id === LADDER + f || id === SIGN + f || id === ITEM_FRAME + f || (d?.switch && !d.floor && d.facing === f);
    if (hung) {
      world.setBlock(x + dx, y, z + dz, AIR);
      if (id === SIGN + f) signs.remove(x + dx, y, z + dz);
      if (id === ITEM_FRAME + f) { const item = frames.remove(x + dx, y, z + dz); if (item) inventory.add(item, 1); }
      inventory.add(d.drop, 1);
      if (d.switch) signalChanged(x + dx, y, z + dz);
    }
  });
  const onTop = BLOCKS[world.get(x, y + 1, z)];
  if (onTop?.switch && onTop.floor) {
    world.setBlock(x, y + 1, z, AIR);
    inventory.add(onTop.drop, 1);
    signalChanged(x, y + 1, z);
  }
  if (BLOCKS[world.get(x, y + 1, z)]?.post) {
    world.setBlock(x, y + 1, z, AIR);
    signs.remove(x, y + 1, z);
    inventory.add(SIGN, 1);
  }
  // lamps and carpets resting on it, and a door standing on it
  const above = world.get(x, y + 1, z);
  if (isRail(above)) {
    world.setBlock(x, y + 1, z, AIR);
    inventory.add(BLOCKS[above].drop, 1);
  } else if (isLamp(above) || isCarpet(above)) {
    lamps.delete(lampKey(x, y + 1, z));
    world.setBlock(x, y + 1, z, AIR);
    inventory.add(BLOCKS[above].drop, 1);
  } else if (isDoor(above) && !BLOCKS[above].upper) {
    world.setBlock(x, y + 1, z, AIR);
    if (isDoor(world.get(x, y + 2, z))) world.setBlock(x, y + 2, z, AIR);
    inventory.add(DOOR, 1);
  }
  for (let ty = y + 1; ty < H; ty++) {
    const id = world.get(x, ty, z);
    if (!isWheat(id) && id !== SUGAR_CANE && id !== SAPLING && !isFlower(id) && id !== BERRY_BUSH && id !== BERRY_BUSH + 1) break;
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
function updateWearLabel() { $('btn-wear').textContent = `Tool wear: ${settings.wear ? 'on' : 'off'}`; }
updateWearLabel();
$('btn-wear').addEventListener('click', () => { settings.wear = !settings.wear; updateWearLabel(); saveSettings(); });
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

// ---------- map waypoints ----------
// Holding a map, tap a sign (or a bed) to mark it on the map, named by the sign's first line; tap it
// again to take the mark off. Marks off the edge of the map show as arrows pointing toward them.
let waypoints = []; // [{ x, y, z, name }]
function toggleWaypoint(x, y, z, id) {
  if (isBed(id)) { const d = BLOCKS[id]; if (d.foot) [x, y, z] = bedPartner(x, y, z); }
  const i = waypoints.findIndex((w) => w.x === x && w.y === y && w.z === z);
  if (i >= 0) { const [w] = waypoints.splice(i, 1); toast(`Took ${w.name} off the map`, 1500); sound.click(); return; }
  if (waypoints.length >= 12) { toast('The map has room for 12 marks: take one off first'); return; }
  const name = isSign(id) ? (signs.get(x, y, z).split('\n')[0].trim() || 'Sign') : 'Bed';
  waypoints.push({ x, y, z, name: name.slice(0, 16) });
  toast(`Marked ${name} on the map`, 1500);
  sound.pop();
}
const dropWaypoint = (x, y, z) => { waypoints = waypoints.filter((w) => !(w.x === x && w.y === y && w.z === z)); };

// ---------- seasons ----------
// The year turns through four seasons of SEASON_DAYS days each. Crops grow fastest in summer and
// barely at all in winter; leaves turn in autumn and fall in winter, and winter frosts the grass and
// brings snow instead of rain.
const SEASON_DAYS = 6;
const SEASONS = [
  { name: 'Spring', grow: 1.25, arrives: 'spring is here: fresh leaves and quick-growing crops' },
  { name: 'Summer', grow: 1.5, arrives: 'summer: crops grow fastest now' },
  { name: 'Autumn', grow: 1, arrives: 'autumn: the leaves are turning' },
  { name: 'Winter', grow: 0.35, arrives: 'winter: frost, snow, and crops that barely grow' },
];
const seasonOf = (d) => Math.floor((d - 1) / SEASON_DAYS) % 4;
let shownSeason = -1;
function applySeason() {
  const s = seasonOf(day);
  if (s === shownSeason || !world) return;
  shownSeason = s;
  world.growthRate = SEASONS[s].grow;
  paintSeason(atlasCanvas, s);
  atlas.needsUpdate = true;
}

// ---------- clock and compass ----------
// The gold clock reads the time of day (sunrise is 6:00, sunset 18:00); the compass shows which way you
// face and which way home is (your bed, or where the world started you).
function clockTime() {
  const mins = Math.floor(((sky.time * 24 + 6) % 24) * 60);
  return `${Math.floor(mins / 60)}:${String(mins % 60).padStart(2, '0')}`;
}
const POINTS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
const pointOf = (dx, dz) => POINTS[(Math.round(Math.atan2(dx, -dz) / (Math.PI / 4)) + 8) % 8]; // -z is north
function compassText() {
  const look = player.lookDir();
  let home = bedSpawn;
  if (!home) home = (world.spawnCache ??= world.generator.findSpawn());
  const dx = home.x + 0.5 - player.pos.x, dz = home.z + 0.5 - player.pos.z, d = Math.hypot(dx, dz);
  return `facing ${pointOf(look.x, look.z)} · ${bedSpawn ? 'bed' : 'start'} ${d < 2 ? 'here' : `${Math.round(d)} ${pointOf(dx, dz)}`}`;
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
    if (!dead) stations.tick(dt, world, setStationLit, powerAt, boostAt);
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
    carts.update(dt, world, (x, y, z) => powerAt(x, y, z) || (signalAt(x, y, z) ? 1 : 0), riding && { cart: riding, push: controls.moveZ, look: player.lookDir() },
      { day: lightUniforms.uDay.value, flicker: lightUniforms.uFlicker.value, ambient: lightUniforms.uAmbient.value });
    if (riding) followCart();
    else if (ridingMob) followMount();
    else player.update(dt, { moveX: controls.moveX, moveZ: controls.moveZ, jump: controls.jump });
    if (player.pos.y < -20) respawn();
    playMovementSounds(dt, wasGround, wasWater, fallSpeed);
    world.tickWater(dt);
    world.tickPlants(dt);
    world.tickLeaves(dt);
    tickLamps(dt);
    tickFuses(dt);
    tickSwitches(dt);
    tickEffects(dt);
    tickBoss(dt);
    renderBossBar();
    updateHunger(dt);
    updateHealth(dt, wasGround, prevY);
    const picked = arrows.update(dt, {
      world, mobs, player, light: { day: lightUniforms.uDay.value, flicker: lightUniforms.uFlicker.value, ambient: lightUniforms.uAmbient.value },
      // arrows bump animals, and hurt creatures more the further the bow was drawn
      onHitMob: (m, arrow, from) => {
        if (m.spec.hostile) giveDrops(mobs.hurt(m, Math.round(2 + 6 * arrow.power) * (arrow.silver ? 2 : 1), from));
        else mobs.bump(m, from);
      },
      onHitPlayer: (dmg, from) => { if (!dead && !shieldBlocks(from, dmg)) damage(armoured(dmg), 'A thornspitter shot you full of thorns.'); },
    });
    for (const id of picked) { inventory.add(id, 1); sound.pop(); }
    updateFishing(dt);
    bees.update(dt, world, player, { day: lightUniforms.uDay.value, flicker: lightUniforms.uFlicker.value, ambient: lightUniforms.uAmbient.value }, sky.light);
    mobs.update(dt, player, { day: lightUniforms.uDay.value, flicker: lightUniforms.uFlicker.value, ambient: lightUniforms.uAmbient.value },
      { difficulty: difficulty(), daylight: sky.light, playerDead: dead, ride: ridingMob && { moveX: controls.moveX, moveZ: controls.moveZ, yaw: player.yaw } });
    if (ridingMob) followMount();
  }
  // write edited chunks to storage shortly (1.5 s) after the player stops changing them
  if (world.unsaved.size !== unsavedCount) { unsavedCount = world.unsaved.size; lastEditAt = now; }
  if (unsavedCount && now - lastEditAt > 1500 && worldReady) { world.saveChunks(); unsavedCount = 0; }
  kinetics.update(paused ? 0 : dt, world, { day: lightUniforms.uDay.value, flicker: lightUniforms.uFlicker.value, ambient: lightUniforms.uAmbient.value });
  tickBlasts(dt);
  minimap.show(!paused && inventory.heldId() === MAP);
  minimap.update(world, player, bedSpawn ?? (world.spawnCache ??= world.generator.findSpawn()), waypoints);
  try {
    machines.tick(paused ? 0 : dt, world, kinetics, stations, { day: lightUniforms.uDay.value, flicker: lightUniforms.uFlicker.value, ambient: lightUniforms.uAmbient.value });
  } catch (err) { reportError(err); }
  frames.update(dt, world, { day: lightUniforms.uDay.value, flicker: lightUniforms.uFlicker.value, ambient: lightUniforms.uAmbient.value });
  signs.update(dt, world, { day: lightUniforms.uDay.value, flicker: lightUniforms.uFlicker.value, ambient: lightUniforms.uAmbient.value });
  coordsTimer -= dt;
  if (coordsTimer <= 0) {
    coordsTimer = 0.25;
    applySeason();
    $('coords').textContent = `Day ${day} · ${SEASONS[seasonOf(day)].name}   X ${Math.floor(player.pos.x)}  Y ${Math.floor(player.pos.y)}  Z ${Math.floor(player.pos.z)}` +
      (inventory.count(GOLD_CLOCK) ? `   🕰 ${clockTime()}` : '') + (inventory.count(COMPASS) ? `   🧭 ${compassText()}` : '') +
      (effectsText() ? `   ${effectsText()}` : '');
  }

  const eye = player.eye;
  camera.position.copy(eye);
  camera.rotation.set(player.pitch, player.yaw, 0);

  const biome = world.generator.biomeAt(Math.floor(player.pos.x), Math.floor(player.pos.z));
  // in winter it snows rather than rains in temperate land
  weather.update(paused ? 0 : dt, eye, biome === 'temperate' && seasonOf(day) === 3 ? 'tundra' : biome, world.skyAt(Math.floor(eye.x), Math.min(H - 1, Math.floor(eye.y) + 1), Math.floor(eye.z)));
  sky.weather = { overcast: weather.overcast, level: weather.level, kind: weather.kind };
  world.raining = weather.raining && biome !== 'desert';
  sound.weather(paused ? 0 : weather.level, weather.kind);
  const before = sky.time;
  sky.update(paused ? 0 : dt, eye, lightUniforms.uDay, player.eyeInWater);
  if (sky.time < before) { // the clock wrapped round to sunrise
    day++; caneToday = 0;
    const turned = seasonOf(day) !== seasonOf(day - 1);
    toast(turned ? `Day ${day}: ${SEASONS[seasonOf(day)].arrives}` : `Day ${day}`, turned ? 4000 : 2500);
    applySeason();
  }
  lightUniforms.uFlicker.value = 0.93 + 0.04 * Math.sin(now * 0.011) + 0.03 * Math.sin(now * 0.029);
  $('underwater').classList.toggle('show', player.eyeInWater);
  waterTex.offset.x = (waterTex.offset.x + dt * 0.06) % 1;
  waterTex.offset.y = (waterTex.offset.y + dt * 0.025) % 1;

  const look = player.lookDir();
  target = paused ? null : world.raycast(eye, look, REACH);
  targetMob = paused ? null : mobs.raycast(eye, look, REACH);
  targetCart = paused || riding ? null : carts.raycast(eye, look, REACH);
  if (targetCart && ((target && target.t < targetCart.t) || (targetMob && targetMob.t < targetCart.t))) targetCart = null;
  if (targetCart) { target = null; targetMob = null; }
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
  arrows, fishing, kinetics, bees, catchAt, seasonOf, applySeason, set day(v) { day = v; applySeason(); }, frames, signalAt, setSwitch, machines, carts, minimap, signs, armour, damage, placeRail, getInCart, getOutOfCart,
  get riding() { return riding; }, explode, lightFuse, fuses, clockTime, compassText, place, editSign, closeSign, openInventory, closeInventory, chestMove, lamps, tickLamps, sleepUntilMorning, stations, openStation, closeStation,
  get caneToday() { return caneToday; }, get waypoints() { return waypoints; }, toggleWaypoint, sortSlots, weather, openTrade, closeTrade, mountMob, dismount, get ridingMob() { return ridingMob; }, effects, armourWear, useAnvil, rollLoot, settings,
  get bedSpawn() { return bedSpawn; },
};
