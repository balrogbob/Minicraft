import * as THREE from 'three';
import { Viewmodel, Avatar, LOOKS, randomLook } from './held.js';
import { Ripples } from './ripples.js';
import { Net } from './net.js';
import { Graphics, GFX_DEFAULTS, GFX_NAMES, GFX_TOGGLES, SHADOW_LEVELS, GFX_PRESETS, PRESET_ORDER, PRESET_NAMES, MAX_TORCH_SHADOWS, gfxUniforms, GFX_FRAG_HEAD, GFX_SUN_TERM, GFX_WATER, GFX_VERT_HEAD, GFX_VERT_DECODE, GFX_VERT_SWAY, WATER_LAYER, LATE_LAYER } from './graphics.js';
import {
  BLOCKS, RECIPES, TABLE, AIR, WATER, TORCH, TORCH_WALL_W, WALL_TORCH_DIRS,
  GRASS, DIRT, SAND, CHURN, SUGAR_CANE, BREAD, ITEMS, BOW, ARROW, BUCKET,
  WOOD_PICK, STONE_PICK, WOOD_AXE, STONE_AXE, WOOD_SHOVEL, STONE_SHOVEL,
  BED, BED_FOOT, CHAIR, LAMP, CARPET, CURTAIN, DOOR, SLIME_FUEL, FACING_DIRS, MAX_LAMP_FUEL,
  isBed, isChair, isLamp, isCurtain, isDoor, doorId, IRON_BARS, FLOWER_POT, HANGING_PLANT, WINDOW_BOX, POT_PLANTS, potOf,
  OVEN, SMELTER, stationKind, maxStack, FISHING_ROD, RAW_FISH, TOOL_TIERS, LOG, LEAVES, SAPLING, WHEAT_3, isLeaves, FRUITS, fruitLeaves, FRUIT_SAPLING, SCARECROW, COOK_POT, SNOW_LAYER, LIGHTHOUSE_LAMP, EXPLORER_MAP, TREASURE_MAP, STARSTEEL_INGOT, MAX_LIGHT, APIARY, MAX_APIARY, BEESWAX, CANDLE_BLOCK, CABLE_CAR, FARM_REACH, MARKET_STALL, COIN, GLASS_PANE, FURN_TABLE, GRAVEL, FIRE, isFlammable, isCrop, GRAPES, TRELLIS, GRAPE_VINE, PUMPKIN_SEEDS, CARROT, POTATO, AGING, WINE, FINE_WINE, CHEESE, AGED_CHEESE, VAULT_GATE, AIR_PUMP, PEARL, DIVING_HELMET, FLIPPERS, SEA_LANTERN,
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
  OBSERVER, GAUGE, HARVESTER, STEAM_ENGINE, SWITCH_RAIL, switchRailId,
  TINTS, WALL, LANTERN, HANGING_LANTERN, CHANDELIER, PAINTING, ART, isWall,
  ENCHANT_ALTAR, LAIRS, ENCHANTS, hasEnch, HONEY_TEA, CRYSTAL_BLOCK, SUN_SCARAB, FROST_HEART, EMBER_CORE, OBSIDIAN, SANDSTONE,
  STICK, STRING, PAPER, CAKE, COOKIE, LEATHER, FISHING_ROD as ROD, WEIGHTED_ROD as WROD, SEEDS, FLOUR, BUTTER, COPY_WAND,
  ELECTRUM_WIRE, PULVERIZER, BATTERY, PORTABLE_LAMP, JACKHAMMER, JETPACK, CHARGE_USE, chargeCap, chargeLeft, ORES, oreDust, dirtyDust, WASHER,
  E_SMELTER, QUARRY, ITEM_COUNTER, TELEPAD, PROG_CRAFTER, PAD_PLAYER, ELECTRIC_DRILL, HOVER_BOOTS, NV_GOGGLES, MAGNET_RING, isElectricLamp, SPAWNER,
  WIRE, INVERTER, DELAY, LATCH, DETECTOR_RAIL, DRIVE_BELT, TREE_FELLER, PLANTER, BREAKER, PLACER, ANIMAL_STATION, EJECTOR, COLLECTOR, BELT_SPLITTER, BELT_SORTER,
  ELECTRIC_RAIL, LIFT, LIFT_REACH, WIRELESS_REACH, CHAINSAW, SAWDUST, SPANNER, GRAPPLE, isBackpack, kineticId, MELTDOWN, REACTOR_POWER, ROD_LIFE, BOOK,
  BOOKSHELF, JOURNAL, FERTILISER, SHELF_DISCOUNT, LEAD_CHEST, FREEZER, ARC_FURNACE, SPENT_ROD, RADIATION_REACH, hazmatId, TESLA_REACH, TESLA_DAMAGE, ELECTRIC_FENCE,
  RAIL_STATION, ZIP_POST, ZIP_LINE, ZIP_REACH, BOAT, BALLOON, CHARCOAL, METEORITE, METEORIC_IRON, metalSword, TRUFFLE,
  RADIO_TX, RADIO_RX, SORTING_MACHINE, LOCOMOTIVE, FIREPLACE, CHIMNEY, HEARTH_FUEL, STABLE,
  SNOWMAN, FIREWORK, PUMPKIN, JACK_O_LANTERN, EGG, POPPY, DANDELION, DAISY, LAVENDER,
  ONION, BEANS, TOMATO, HERBS, CIDER, VINTAGE_CIDER, BERRY_WINE, FINE_BERRY_WINE,
  KILN, ROPE_LADDER, ROPE_BRIDGE, BRIDGE_RAIL, LOCK_GATE, SLUICE_WHEEL, STALACTITE, STALAGMITE,
  CHARCOAL_HEAP, CLAY, STONE, UPGRADES, CHEST_BOAT, LP_TABLE, LP_POWER, REMOTE_ORDERER, DRONE_PAD, TANK_CAP, FINE_CROPS, isFine, WORM, SADDLEBAGS, GOLDEN_TEA, SPEED_UPGRADE, YIELD_UPGRADE, HAY_BALE, LAVENDER_HONEY, BLOSSOM_HONEY, GOLDEN_HONEY, FRUIT_LEAVES,
} from './blocks.js';
import { Smoke } from './smoke.js';
import { Fireworks } from './fireworks.js';
import { createAtlas, createIcons, createCrackCanvases, createWaterCanvas, createHudIcons, paintSeason } from './textures.js';
import { World, CHUNK, WORLD_SIZE, chunkKey, skyBrightness, lightBrightness } from './world.js';
import { localIndex, CHUNK_VOLUME, H, SEA_LEVEL } from './terrain.js';
import { ChunkStore } from './store.js';
import { buildLegacyWorld, LEGACY_W } from './legacy.js';
import { Sky, DAY_LENGTH } from './sky.js';
import { Sound } from './sound.js';
import { Music } from './music.js';
import { Logistics, CHANNELS, liquidIcon } from './logistics.js';
import { Apiculture, wildSpecies } from './apiculture.js';
import { BEE_SCOOP, BEE_SPECIES, princessOf, droneOf } from './blocks.js';
import { Player } from './player.js';
import { Inventory, SLOTS } from './inventory.js';
import { Controls, KEY_ACTIONS, DEFAULT_KEYS, keyLabel } from './controls.js';
import { WorldMap } from './worldmap.js';
import { ItemDrops } from './drops.js';
import { ACHIEVEMENTS, ACHIEVEMENT_IDS } from './achievements.js';
import { GUIDE, GOALS, chapterOpen, goalItem } from './guidebook.js';
import { MobManager, DIFFICULTY, DIFFICULTY_ORDER, SPECIES } from './mobs.js';
import { ArrowManager } from './arrows.js';
import { Stations, STATION_KINDS, isFuel, inCellar, wetAt, upgradeStacks, upgradeRefusal } from './stations.js';
import { Fishing } from './fishing.js';
import { Kinetics } from './kinetics.js';
import { Electric } from './electric.js';
import { Signs } from './signs.js';
import { Machines } from './machines.js';
import { Carts, railBeyond } from './carts.js';
import { Vehicles, newBoatStore } from './vehicles.js';
import { MiniMap } from './minimap.js';
import { Frames, isDisplay } from './frames.js';
import { Crows } from './birds.js';
import { Critters } from './critters.js';
import { Weather } from './weather.js';
import { Bees } from './bees.js';
import { Paintings, paintingCells } from './paintings.js';
import { Logic } from './logic.js';

// v2 = the 16k x 16k streaming world (player state here, edited chunks in IndexedDB).
// v1 = the old 128 x 128 world, migrated into the middle of the big world on first launch.
const GAME_VERSION = '38'; // shown in the menu; bump with each release
const SAVE_KEY = 'minicraft-save-v2';
const LEGACY_SAVE_KEY = 'minicraft-save-v1';
const SETTINGS_KEY = 'minicraft-settings-v1';
const REACH = 5.5;
const $ = (id) => document.getElementById(id);

// ---------- storage (never trusted to exist) ----------
// Save slots: slot 0 is the original save (so worlds from before there were slots carry on as world 1).
const SLOT_COUNT = 3;
const MP_SLOT = 9; // (v38: a multiplayer world's local copy lives here, apart from your own worlds)
let activeSlot = 0; // the slot being played: settings.slot, or MP_SLOT while on a server
const saveKeyOf = (n) => (n ? `${SAVE_KEY}-s${n}` : SAVE_KEY);
function loadSave(key = saveKeyOf(activeSlot)) {
  try { return JSON.parse(localStorage.getItem(key)); } catch { return null; }
}
function writeSave(obj, slot = activeSlot) {
  try { localStorage.setItem(saveKeyOf(slot), JSON.stringify(obj)); return true; } catch { return false; }
}
// Settings live apart from the world so they survive "New world".
const settings = (() => {
  const defaults = { gfxPreset: 'custom', sens: 6, volume: 70, music: 50, viewDistance: 6, perf: false, difficulty: 'worrying', wear: true, favs: [], pins: [], slot: 0, fov: 72, keys: {}, tips: true, doubleTap: true, gfx: {} };
  let s;
  try { s = { ...defaults, ...JSON.parse(localStorage.getItem(SETTINGS_KEY)) }; } catch { s = { ...defaults }; }
  s.slot = Math.max(0, Math.min(SLOT_COUNT - 1, s.slot | 0));
  s.fov = Math.max(50, Math.min(110, +s.fov || 72));
  if (!s.keys || typeof s.keys !== 'object') s.keys = {};
  if (!Array.isArray(s.pins)) s.pins = [];
  if (!s.look || typeof s.look !== 'object') s.look = randomLook(); // (v38: how your character looks)
  s.gfx = { ...GFX_DEFAULTS, ...(s.gfx && typeof s.gfx === 'object' ? s.gfx : {}) };
  s.gfx.torches = Math.max(0, Math.min(MAX_TORCH_SHADOWS, s.gfx.torches | 0));
  s.gfx.torchRate = Math.max(1, Math.min(MAX_TORCH_SHADOWS, s.gfx.torchRate | 0 || 2));
  s.gfx.shadows = s.gfx.shadows === true ? 2 : Math.max(0, Math.min(2, s.gfx.shadows | 0)); // (v36 saved on/off)
  return s;
})();
activeSlot = settings.slot;
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

const camera = new THREE.PerspectiveCamera(settings.fov, window.innerWidth / window.innerHeight, 0.05, 160);
camera.rotation.order = 'YXZ';
camera.layers.enable(WATER_LAYER); camera.layers.enable(LATE_LAYER); // (see graphics.js)

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
const lightUniforms = { uHand: { value: new THREE.Vector4(0, 0, 0, 0) }, uDay: { value: 1 }, uFlicker: { value: 1 }, uAmbient: { value: AMBIENT }, uTints: { value: TINTS.map((c) => new THREE.Vector3(...c)) }, ...gfxUniforms };
function addTorchLight(mat, water = false) {
  // (sky also carries a "next to water" flag, +2, for caustics: see World.buildChunkGeometry)
  mat.customProgramCacheKey = () => (water ? 'world-water' : 'world-solid');
  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, lightUniforms);
    // torch light comes in as brightness + 2 x its colour (see TINTS): decoded here, per vertex
    // (and a portable lamp you carry lights what's within HAND_REACH of you: uHand is where it is, and how bright)
    shader.vertexShader = `attribute float torch;\nattribute float sky;\nvarying vec3 vTorchC;\nvarying float vSky;\nvarying vec3 vWorldP;\nuniform vec3 uTints[${TINTS.length}];\n` + GFX_VERT_HEAD + shader.vertexShader
      .replace('#include <color_vertex>', '#include <color_vertex>\nfloat tintI = floor(torch * 0.5);\nvTorchC = (torch - tintI * 2.0) * uTints[int(tintI)];\n' + GFX_VERT_DECODE + 'vWorldP = (modelMatrix * vec4(position, 1.0)).xyz;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\n' + GFX_VERT_SWAY);
    shader.fragmentShader = 'uniform float uDay;\nuniform float uFlicker;\nuniform float uAmbient;\nuniform vec4 uHand;\nvarying vec3 vTorchC;\nvarying float vSky;\nvarying vec3 vWorldP;\n' + GFX_FRAG_HEAD + shader.fragmentShader
      .replace('#include <color_fragment>',
        '#include <color_fragment>\nfloat hl = uHand.w * pow(clamp(1.0 - distance(vWorldP, uHand.xyz) / 13.0, 0.0, 1.0), 1.4);\n' + GFX_SUN_TERM +
        'diffuseColor.rgb *= max(max(vec3(max(sunT, uAmbient)), torchT), vec3(hl, hl * 0.96, hl * 0.86));\n' + (water ? GFX_WATER : ''));
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
addTorchLight(waterMat, true);
const materials = { solid: material, water: waterMat };
// optional fancy graphics: shadows, bloom, water (see graphics.js)
const gfx = new Graphics(renderer, settings.gfx);
// torch shadows: the nearest lights (not lava, not ones out in the sun) within 16 blocks (24 for many lights)
gfx.findLights = (n) => {
  if (!world || !player) return [];
  const px = Math.floor(player.pos.x), py = Math.floor(player.pos.y + 1), pz = Math.floor(player.pos.z);
  const day = lightUniforms.uDay.value, found = [], R = n > 5 ? 24 : 16, V = n > 5 ? 12 : 10;
  for (let y = py - V; y <= py + V; y++) for (let x = px - R; x <= px + R; x++) for (let z = pz - R; z <= pz + R; z++) {
    const id = world.get(x, y, z);
    if (id === AIR) continue;
    const def = BLOCKS[id];
    if (!def || !(def.light >= 6) || def.liquid) continue;
    if (day * world.skyAt(x, y, z) / 15 > 0.35) continue; // drowned out by daylight
    found.push({ x: x + 0.5, y: y + 0.55, z: z + 0.5, r: def.light + 1, d: (x - px) ** 2 + (y - py) ** 2 + (z - pz) ** 2 });
  }
  found.sort((a, b) => a.d - b.d);
  return found.slice(0, n);
};
// water reflections: the height of the water surface around you (the most common nearby, weighted by
// closeness), looked for twice a second
let waterLookT = 0;
function findWaterLevel(dt) {
  if ((waterLookT -= dt) > 0) return;
  waterLookT = 0.5;
  if (!settings.gfx.reflections || !world || !player) { gfx.waterY = null; return; }
  const ex = Math.floor(player.eye.x), ey = Math.floor(player.eye.y), ez = Math.floor(player.eye.z);
  const votes = new Map();
  for (let dx = -14; dx <= 14; dx += 2) for (let dz = -14; dz <= 14; dz += 2) {
    for (let y = ey; y >= ey - 24; y--) {
      const id = world.get(ex + dx, y, ez + dz);
      if (id === AIR) continue;
      if (id === WATER && world.get(ex + dx, y + 1, ez + dz) === AIR) votes.set(y, (votes.get(y) ?? 0) + 1 / (1 + Math.hypot(dx, dz)));
      break;
    }
  }
  let best = null, most = 0;
  for (const [y, v] of votes) if (v > most) { most = v; best = y; }
  gfx.waterY = best === null ? null : best + 0.875; // (the surface sits a little below the block top)
}
gfx.onFail = (key) => { goCustom(); settings.gfx[key] = key === 'torches' || key === 'shadows' ? 0 : false; saveSettings(); updateGfxLabels(); toast(`${GFX_NAMES[key]} doesn't work on this device — turned off`, 4000); };

const sky = new Sky(scene);
const sound = new Sound();
const music = new Music(sound); // (v29)
sound.volume = settings.volume / 100;
music.volume = settings.music / 100;
// audio may only start after a user gesture
for (const ev of ['touchstart', 'pointerdown', 'keydown']) {
  window.addEventListener(ev, () => sound.unlock(), { capture: true, passive: true });
}

const icons = createIcons(atlasCanvas);
// (v38) what's in your hand, and you yourself (photo mode, third-person view)
const viewmodel = new Viewmodel(atlas, icons.canvases, ITEMS);
viewmodel.setLook(settings.look);
const avatar = new Avatar(settings.look, atlas, icons.canvases, ITEMS);
avatar.root.visible = false;
scene.add(avatar.root);
// v38: multiplayer (see net.js, and server/server.js)
const net = new Net({ scene, atlas, icons: icons.canvases, ITEMS, on: {
  welcome: (m) => mpWelcome(m), block: (x, y, z, id) => mpBlock(x, y, z, id), chat: (name, text, mine) => addChat(name, text, mine),
  host: (me, name) => { if (me && weather.timer > 1e6) weather.timer = 120 + Math.random() * 300; addChat(null, me ? 'You are now the host: your game keeps the time, weather and creatures for everyone' : `${name ?? 'Someone'} is now the host`); clockTimer = 0; },
  clock: (c) => applyClock(c),
  kv: (ch, k, v) => applyKv(ch, k, v),
  join: (name) => addChat(null, `${name} joined`), leave: (name) => addChat(null, `${name} left`), status: (st, why) => mpStatus(st, why),
} });
let viewMode = 0; // 0 first person, 1 behind you, 2 facing you
const VIEW_NAMES = ['First person', 'Third person (behind)', 'Third person (front)'];
function swingArm() { viewmodel.swing(); avatar.swing(); if (net.live) { const now = performance.now(); if (now - (swingArm.sent ?? 0) > 250) { swingArm.sent = now; net.send({ t: 'swing' }); } } }
// how bright it is where you stand (for your arm, what you hold, and your character)
function lightHere() {
  const x = Math.floor(player.pos.x), y = Math.min(H - 1, Math.floor(player.pos.y + 1.2)), z = Math.floor(player.pos.z);
  return {
    sun: lightUniforms.uDay.value * skyBrightness(world.skyAt(x, y, z)),
    torch: Math.max(lightBrightness(world.lightAt(x, y, z)) * lightUniforms.uFlicker.value, lightUniforms.uHand.value.w * 0.9),
    ambient: lightUniforms.uAmbient.value,
  };
}
// place the camera behind (or in front of) you, pulled in where a wall is in the way
function thirdPersonCamera(eye) {
  const d = player.lookDir();
  const back = viewMode === 1 ? d.clone().negate() : d.clone();
  let dist = 4;
  for (let t = 0.3; t <= 4; t += 0.1) {
    const p = eye.clone().addScaledVector(back, t);
    if (world.isSolid(Math.floor(p.x), Math.floor(p.y), Math.floor(p.z))) { dist = Math.max(0.3, t - 0.3); break; }
  }
  camera.position.copy(eye).addScaledVector(back, dist);
  camera.lookAt(eye);
}
function updateMe(dt) {
  const held = inventory.heldId();
  viewmodel.setItem(held);
  avatar.setHeld(held);
  const light = lightHere();
  const speed = Math.hypot(player.vel.x, player.vel.z);
  const swimming = player.inWater && !player.onGround && !riding && !ridingMob;
  avatar.root.visible = !dead && (photoMode || viewMode > 0);
  if (avatar.root.visible) avatar.update(dt, { pos: player.pos, yaw: player.yaw, pitch: player.pitch, speed, swimming, onGround: player.onGround, light });
  viewmodel.update(dt, { moving: Math.min(1, speed / 4.3), onGround: player.onGround, swimming, aspect: camera.aspect, light });
}
const mobs = new MobManager(scene, sound);
const arrows = new ArrowManager(scene, sound);
const fishing = new Fishing(scene, sound);

// ---------- night creatures ----------
const difficulty = () => DIFFICULTY[settings.difficulty] ?? DIFFICULTY.worrying;
// How hard each thing in your hand hits a creature (bare hand: 2). Creatures have 10-30 health.
const WEAPON_DAMAGE = { [WOOD_SHOVEL]: 3, [STONE_SHOVEL]: 4, [WOOD_PICK]: 3, [STONE_PICK]: 4, [WOOD_AXE]: 4, [STONE_AXE]: 6 };
let lastSwing = 0; // time of the last swing at a creature (a short pause between swings, in real time)

// A creature's hit knocks you back away from it.
mobs.onHurtPlayer = (amount, cause, from, kind) => {
  if (dead) return;
  if (SPECIES[kind]?.poisons && !shieldBlocks(from, 0)) {
    poisoned = Math.max(poisoned, SPECIES[kind].poisons);
    toast('The spider\'s bite poisoned you!', 1800);
    renderHealth();
  }
  const dx = player.pos.x - from.x, dz = player.pos.z - from.z, len = Math.hypot(dx, dz) || 1;
  player.kx = (dx / len) * 7; player.kz = (dz / len) * 7;
  if (player.onGround) player.vel.y = 4.5;
  if (shieldBlocks(from, amount)) return;
  damage(armoured(amount), cause);
};
mobs.onShoot = (origin, dir, dmg, kind) => { const a = arrows.shootThorn(origin, dir, dmg); if (a) a.from = kind; };

function giveDrops(drops) {
  for (const [id, n] of drops) {
    if (inventory.add(id, n) > 0) toast('Inventory full: dropped at your feet');
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
const timers = { regen: 0, starve: 0, poison: 0, drown: 0, lava: 0, fence: 0 };
let bowCharge = 0; // seconds the bow has been drawn (holding)
let bedSpawn = null; // { x, y, z } of the bed you last used: where you respawn
// Lit lamps: "x,y,z" -> seconds left in the fuel unit now burning (each unit lasts one in-game day).
const lamps = new Map();
const stations = new Stations(); // what's inside each oven and smelter
const kinetics = new Kinetics(scene, atlas); // water wheels, shafts and gears, and what they drive
const electric = new Electric(); // generators, electrum wire and the machines that run on electricity
const powerAt = (x, y, z) => kinetics.powerAt(x, y, z) || electric.speedAt(x, y, z);
const electricHooks = {
  setBlock: (x, y, z, id) => world.setBlock(x, y, z, id),
  signalAt: (x, y, z) => signalAt(x, y, z),
  daylight: () => sky.light,
  raining: () => weather.raining,
  wants: (n) => {
    const d = BLOCKS[n.id];
    if (d.quarry) return machines.quarryWants(n.x, n.y, n.z);
    if (d.rail) return carts.carts.some((c) => c.x === n.x && c.y === n.y && c.z === n.z); // an electric rail, while a cart's on it
    if (d.lift) return lift?.from === `${n.x},${n.y},${n.z}`; // a lift, while it's carrying you
    if (d.tesla) return !!teslaTarget(n); // a tesla coil, while there's a creature to zap
    return undefined;
  },
  wireless: (n, amount) => wirelessCharge(n, amount),
  meltdown: (x, y, z) => meltdown(x, y, z),
  alarm: (x, y, z, k) => {
    const d = Math.hypot(x + 0.5 - player.pos.x, y + 0.5 - player.pos.y, z + 0.5 - player.pos.z);
    if (d < 40) sound.alarm(Math.min(1, 1.2 - d / 40));
    if (d < 40 && (reactorWarned -= 1) <= 0) { reactorWarned = 8; toast(`A reactor is overheating (${Math.round(k * 100)}%): cool it with water, take its rods out or give it a signal!`, 3500); }
  },
};
let reactorWarned = 0;
// What's inside backpacks, and inside machines taken up with a spanner: pack id -> contents. The stack holds
// the id as its `pack`, so the contents go wherever the stack goes (chests, belts, the ground) and are saved.
//   a backpack: { slots: [stack | null, ...] }
//   a machine:  { kind, inputs, fuel, out } (what was in it) and/or { charge } (a grid battery's or pad's)
//   a journal:  { note } (what's written in it)
const packs = new Map();
let nextPack = 1;
function newPack(v) { const id = nextPack++; packs.set(id, v); return id; }
const cleanStack = (s) => (s && s.id > 0 && s.count > 0 ? {
  id: s.id, count: s.count, ...(s.wear > 0 ? { wear: +s.wear } : {}), ...(Array.isArray(s.ench) && s.ench.length ? { ench: s.ench.filter((e) => typeof e === 'string') } : {}),
  ...(s.on === true ? { on: true } : {}), ...(s.pack > 0 ? { pack: Math.floor(s.pack) } : {}),
} : null);
function loadPacks(list, next) {
  packs.clear();
  for (const e of Array.isArray(list) ? list : []) {
    if (!Array.isArray(e) || !(e[0] > 0) || !e[1] || typeof e[1] !== 'object') continue;
    const v = e[1], c = {};
    if (Array.isArray(v.slots)) c.slots = v.slots.slice(0, 54).map(cleanStack);
    if (typeof v.kind === 'string' && STATION_KINDS[v.kind]) {
      c.kind = v.kind;
      c.inputs = (Array.isArray(v.inputs) ? v.inputs : []).slice(0, 54).map(cleanStack);
      c.fuel = cleanStack(v.fuel); c.out = cleanStack(v.out);
    }
    if (v.charge > 0) c.charge = +v.charge;
    if (typeof v.note === 'string') c.note = v.note.slice(0, 4000);
    if (Number.isInteger(v.treasure)) c.treasure = v.treasure;
    packs.set(Math.floor(e[0]), c);
  }
  nextPack = Math.max(1, Math.floor(+next || 0), ...[...packs.keys()].map((k) => k + 1));
}
const signs = new Signs(scene); // what's written on each sign
const machines = new Machines(scene, icons); // pumps, drills, hoppers and belts
const logistics = new Logistics({ get world() { return world; }, stations, machines, electric }); // (v29: logistics pipes)
const apiculture = new Apiculture(); // (v31: bee houses)
// Where a bee house stands: is it day, is it raining, what season and what land.
const beeEnv = (x, y, z) => ({ day: sky.light > 0.5, raining: !!world.raining, season: seasonOf(day), biome: world.generator.biomeAt(x, z) });
const nightEnv = (x, y, z) => ({ ...beeEnv(x, y, z), day: false, raining: false });
const loose = new ItemDrops(scene, (id) => machines.makeSprite(id)); // items lying on the ground
const carts = new Carts(scene); // minecarts on rails
carts.onLoco = (c, what) => {
  const d = Math.hypot(c.pos.x - player.pos.x, c.pos.y - player.pos.y, c.pos.z - player.pos.z);
  const g = riding === c ? 1 : Math.max(0, 1 - d / 40);
  if (what === 'chuff') {
    sound.chuff(g * 0.8);
    if (d < 80) smoke.puff(c.pos.x + Math.sin(c.yaw) * 0.34, c.pos.y + 1.1, c.pos.z + Math.cos(c.yaw) * 0.34, { grey: 0.8, size: 0.45, life: 2.5, rise: 1.4 });
  }
  else if (what === 'hoot') sound.hoot(g);
  else if (what === 'couple') sound.place('stone');
  else if (what === 'tender' && riding === c) toast(`The locomotive takes on coal from its tender (${c.loco.coal})`, 1500);
};
const vehicles = new Vehicles(scene); // boats and balloons
const ripples = new Ripples(scene); // (v38: rings, wakes and spray on the water)
const crows = new Crows(scene); // after ripe wheat (see birds.js)
const critters = new Critters(scene, sound); // owls, bats and fireflies
let riding = null; // the minecart you're sitting in
const minimap = new MiniMap($('map'), atlasCanvas);
const frames = new Frames(scene, icons); // what's shown in each item frame
const paintings = new Paintings(scene); // the pictures in paintings
const weather = new Weather(scene);
const smoke = new Smoke(scene); // chimney and locomotive smoke
const fireworks = new Fireworks(scene);
fireworks.onBurst = (x, y, z) => {
  const d = Math.hypot(x - player.pos.x, y - player.pos.y, z - player.pos.z), g = Math.max(0, 1 - d / 160);
  if (g <= 0) return;
  sound.boom(0.22 * g);
  for (let i = 0; i < 4; i++) setTimeout(() => sound.crackle(0.6 * g), 250 + i * 120 + Math.random() * 100);
};
const bees = new Bees(scene, sound);
let ridingMob = null; // the camel you're riding
let boarded = null; // the boat or balloon you're in
let seated = null; // the chair you're sitting on: { x, y, z }
let targetVehicle = null; // { v, t } when the crosshair is on a boat or balloon
let zipping = null; // sliding along a zipline
// a cable car: a little red gondola that hangs from the line and carries you along it at an even speed
const CABLE_SPEED = 5;
const gondola = (() => {
  const g = new THREE.Group(), red = new THREE.MeshBasicMaterial({ color: 0xc82828 }), dark = new THREE.MeshBasicMaterial({ color: 0x5a5a60 });
  const glass = new THREE.MeshBasicMaterial({ color: 0xa8d4e8, transparent: true, opacity: 0.35 });
  const box = (w, h, d, m, x, y, z) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); g.add(b); };
  box(1.3, 0.12, 1.3, red, 0, 0, 0); // floor
  box(1.36, 0.1, 1.36, red, 0, 2.05, 0); // roof
  for (const [x, z] of [[-0.63, -0.63], [0.63, -0.63], [-0.63, 0.63], [0.63, 0.63]]) box(0.08, 2, 0.08, red, x, 1.03, z);
  for (const [w, d, x, z] of [[1.3, 0.04, 0, -0.64], [1.3, 0.04, 0, 0.64], [0.04, 1.3, -0.64, 0], [0.04, 1.3, 0.64, 0]]) { box(w, 0.6, d, red, x, 0.35, z); box(w, 1.2, d, glass, x, 1.25, z); }
  box(0.08, 0.7, 0.08, dark, 0, 2.45, 0); box(0.5, 0.12, 0.2, dark, 0, 2.8, 0); // hanger and wheels
  g.userData.mats = [red, dark, glass].map((m) => [m, m.color.clone()]);
  g.visible = false;
  scene.add(g);
  return g;
})();
machines.frames = frames; machines.carts = carts; machines.loose = loose;
machines.throwItem = (stack, pos, vel) => loose.spawn(stack, pos, vel, 0.5);
// Whatever doesn't fit in the inventory drops at your feet, to pick up once you've made room.
inventory.overflow = (stack) => player && loose.spawn(stack, { x: player.pos.x, y: player.pos.y + 0.6, z: player.pos.z }, { x: 0, y: 1, z: 0 }, 1);
// An auto-crafter makes what the item frame on it shows: the first recipe for that thing.
const crafterRecipe = (x, y, z) => {
  const piped = logistics.crafterRecipe(x, y, z); // (a crafting pipe on it says what to make)
  if (piped) return piped;
  if (world.get(x, y, z) === PROG_CRAFTER) return progRecipe(x, y, z);
  const want = frames.around(world, x, y, z)[0];
  return want ? RECIPES.find((r) => r.out[0] === want) ?? null : null;
};
kinetics.engineOn = (x, y, z) => machines.engineOn(x, y, z);
kinetics.motorShare = (x, y, z) => electric.speedAt(x, y, z); // an electric motor turns on its share of the grid
machines.electric = electric;
machines.daylight = () => sky.light;
let padDing = 0;
machines.teleported = (x, y, z) => {
  // (a soft ding now and then as things arrive at a pad near you)
  const now = performance.now();
  if (now - padDing > 1500 && Math.hypot(x - player.pos.x, y - player.pos.y, z - player.pos.z) < 24) { padDing = now; sound.ding(); }
};
// a programmable crafter makes what the frame it's stepped to shows
const progRecipe = (x, y, z) => {
  const want = machines.progFrame(x, y, z, frames.around(world, x, y, z), signalAt(x, y, z));
  return want ? RECIPES.find((r) => r.out[0] === want) ?? null : null;
};
kinetics.engineStatus = (x, y, z) => machines.engineStatus(x, y, z);
// Bellows blowing into an oven or smelter (while they're turned) make it work half as fast again.
const boostAt = (x, y, z) => ([[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]
  .some(([dx, dy, dz]) => world.get(x + dx, y + dy, z + dz) === BELLOWS && powerAt(x + dx, y + dy, z + dz) > 0) ? 1.5 : 1);
// Armour worn: an item id (or null) for helmet, chestplate, leggings and boots.
const armour = [null, null, null, null, null]; // (the fifth is the shield)
const armourWear = [0, 0, 0, 0, 0];
const armourEnch = [null, null, null, null, null]; // enchantments on what you're wearing
const armourPoints = () => armour.reduce((t, id) => t + (id ? ITEMS[id].armour.points : 0), 0);
// Each point of armour takes 4% off what creatures do to you, up to 80%.
const armourShare = () => Math.min(0.8, armourPoints() * 0.04);
const armoured = (amount) => { if (amount > 0) wearArmour(); return amount * (1 - armourShare()) * (ridingMob?.armoured ? 0.5 : 1); }; // (an armoured horse takes half)
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
  store.setSlot(settings.slot);
  let save = loadSave();
  const legacy = !save && settings.slot === 0 && loadSave(LEGACY_SAVE_KEY);
  if (legacy?.seed !== undefined) save = await migrateLegacyWorld(legacy);
  await startWorld(save);
  if (legacy?.seed !== undefined) toast('Your world now sits in the middle of a 16,384 × 16,384 block world.<br>Walk out past its edges to explore!', 7000);
}

async function startWorld(save, opts = {}) {
  worldReady = false;
  paused = true;
  $('loading').classList.remove('hidden');
  if (world) world.dispose(scene);
  if (!save) await store.clear();
  const seed = save?.seed ?? newSeed();
  world = new World(seed, store);
  world.onError = reportError;
  // leaves falling from a tree you just cut drop their saplings and sticks to you, if you're nearby
  world.onLeafDecay = (x, y, z, was) => {
    const p = player.pos;
    if (dead || (x + 0.5 - p.x) ** 2 + (y + 0.5 - p.y) ** 2 + (z + 0.5 - p.z) ** 2 > 16 * 16) return;
    // a fruit tree's leaves give its own saplings (but not their fruit, which you'd pick)
    const fruit = BLOCKS[was]?.fruit;
    const drops = dropsFor(fruit ? fruit.bare : LEAVES, 0);
    if (drops.length) giveDrops(drops);
  };
  mobs.reset(world); bees.clear(); crows.clear(); critters.clear(); fires.clear(); hearths.clear(); smoke.clear(); fireworks.clear(); exitPhotoMode(); clearChestMark(); openGates.clear(); lockJobs.length = 0; piles.length = 0; mangers.clear(); clearRocks(); strikeIn = 20; catGiftDay = -1; bellDay = -1; villageGrowth = new Map(); shownSeason = -1;
  kinetics.clear();
  kinetics.load(save?.kinetics);
  beltStart = null;
  for (const [k, f] of fuses) removeFuse(k, f);
  signs.load(save?.signs);
  frames.load(save?.frames);
  loose.load(save?.loose);
  pressedButtons.clear(); pressedPlates.clear(); detected.clear();
  logic.load(save?.logic);
  machines.load(save?.machines);
  logistics.load(save?.logistics); ordererLink = typeof save?.ordererLink === 'string' ? save.ordererLink : null;
  electric.load(save?.electric);
  loadPacks(save?.packs, save?.nextPack);
  lift = null; releaseGrapple();
  carts.load(save?.carts);
  vehicles.load(save?.vehicles);
  loadZips(save?.zips);
  riding = null;
  ridingMob = null;
  boarded = null; zipping = null; gondola.visible = false; seated = null;
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
    armourEnch[i] = armour[i] && Array.isArray(save?.armourEnch?.[i]) ? save.armourEnch[i] : null;
  }
  for (const k of Object.keys(effects)) effects[k] = Math.max(0, +save?.effects?.[k] || 0);
  caneToday = Number.isFinite(save?.caneToday) ? save.caneToday : 0;
  waypoints = Array.isArray(save?.waypoints) ? save.waypoints.filter((w) => w && [w.x, w.y, w.z].every(Number.isFinite)).map((w) => ({ x: w.x, y: w.y, z: w.z, name: String(w.name ?? 'Mark').slice(0, 16) })).slice(0, 12) : [];
  places = Array.isArray(save?.places) ? save.places.filter((p) => p && typeof p.kind === 'string' && [p.x, p.z].every(Number.isFinite)).slice(0, 400) : [];
  treasures = Array.isArray(save?.treasures) ? save.treasures.filter((t) => t && [t.x, t.z].every(Number.isFinite)) : [];
  catGiftDay = Number.isInteger(save?.catGiftDay) ? save.catGiftDay : -1;
  bellDay = Number.isInteger(save?.bellDay) ? save.bellDay : -1;
  world.soil = new Map((Array.isArray(save?.soil) ? save.soil : []).filter((e) => Array.isArray(e) && typeof e[0] === 'string' && e[1] && typeof e[1].kind === 'string'));
  for (const k of Array.isArray(save?.openGates) ? save.openGates.map((e) => (Array.isArray(e) ? e[0] : e)) : []) if (typeof k === 'string') openGates.set(k, LOCK_GATE);
  for (const [k, n] of Array.isArray(save?.mangers) ? save.mangers : []) if (typeof k === 'string' && n > 0) mangers.set(k, Math.min(MANGER_MAX, n | 0));
  for (const p of Array.isArray(save?.piles) ? save.piles : []) {
    if (!Array.isArray(p?.cells) || !Array.isArray(p.hole) || !(p.left > 0)) continue;
    piles.push({ cells: p.cells.filter((c) => Array.isArray(c) && c.length === 3).map((c) => c.map((v) => v | 0)), hole: p.hole.map((v) => v | 0), left: +p.left, total: +p.total || +p.left, puff: 0 });
  }
  for (const e of Array.isArray(save?.hearths) ? save.hearths : []) if (Array.isArray(e) && typeof e[0] === 'string' && Number.isFinite(e[1])) hearths.set(e[0], e[1]);
  for (const e of Array.isArray(save?.fires) ? save.fires : []) if (Array.isArray(e) && typeof e[0] === 'string' && Number.isFinite(e[1])) fires.set(e[0], e[1]);
  villageGrowth = new Map((Array.isArray(save?.villageGrowth) ? save.villageGrowth : []).filter((e) => Array.isArray(e) && typeof e[0] === 'string' && e[1] && Number.isFinite(e[1].deals))
    .map(([k, g]) => [k, { deals: g.deals, built: (Array.isArray(g.built) ? g.built : []).filter((h) => h && [h.x, h.y, h.z].every(Number.isFinite) && Array.isArray(h.door)),
      rep: Number.isFinite(g.rep) ? g.rep : 0, reqDay: Number.isInteger(g.reqDay) ? g.reqDay : -1, decorDay: Number.isInteger(g.decorDay) ? g.decorDay : -1,
      decor: (Array.isArray(g.decor) ? g.decor : []).filter((e) => Array.isArray(e) && e.length === 4 && e.every(Number.isFinite)) }]));
  beaconSpots = new Set(Array.isArray(save?.beacons) ? save.beacons.filter((k) => typeof k === 'string') : []);
  if (save?.weather) weather.set(!!save.weather.raining, Math.max(10, +save.weather.timer || 60));
  else weather.set(false);
  creative = !!(save ? save.creative : opts.creative);
  player.flying = creative && !!save?.flying;
  achieved = new Set((Array.isArray(save?.achievements) ? save.achievements : []).filter((a) => ACHIEVEMENT_IDS.has(a)));
  guideDone = new Set((Array.isArray(save?.guidebook?.done) ? save.guidebook.done : []).filter((g) => GOAL_IDS.has(g)));
  guideClaimed = new Set((Array.isArray(save?.guidebook?.claimed) ? save.guidebook.claimed : []).filter((g) => guideDone.has(g)));
  worldMap.load(save?.explored);
  wand.a = null; wand.clip = null;
  air = MAX_AIR;
  dead = false;
  fallTop = null;
  $('death').classList.add('hidden');
  renderHunger();
  renderHealth();
  updateAutoJumpLabel();
  applyCreative();
  startPos = save?.start && Number.isFinite(save.start.x) ? save.start : { x: player.pos.x, z: player.pos.z };

  // build the area around the player before starting; the rest streams in while playing
  for (;;) {
    world.update(player.pos.x, player.pos.z, scene, materials, 40);
    const ready = world.readiness(player.pos.x, player.pos.z, 2);
    setProgress(ready);
    if (ready >= 1) break;
    await nextFrame();
  }
  // pets come back where you left them (or beside you, if that's far away)
  for (const [kind, x, y, z, sitting, coat, h] of save?.pets ?? []) {
    if (!['wolf', 'camel', 'cat', 'buffalo', 'horse'].includes(kind) || ![x, y, z].every(Number.isFinite)) continue;
    // a horse kept at a stable waits there, however far away; other pets come to you if they're far off
    const stabled = kind === 'horse' && typeof h?.stable === 'string';
    const far = !stabled && Math.hypot(x - player.pos.x, z - player.pos.z) > 40;
    const opts = { ...(Number.isFinite(coat) ? { coat } : {}), ...(kind === 'horse' && h ? { gait: +h.gait || undefined, leap: +h.leap || undefined } : {}) };
    const m = far ? mobs.spawn(kind, player.pos.x + 1.5, player.pos.y + 0.2, player.pos.z + 1.5, opts) : mobs.spawn(kind, x, y, z, opts);
    if (kind !== 'horse' || h?.tame !== false) mobs.setTame(m);
    if (kind === 'horse') {
      m.trusted = true;
      if (stabled) m.stable = h.stable;
      if (h?.baby > 0) { m.baby = h.baby; m.root.scale.setScalar(m.baseScale * 0.5); }
      if (Array.isArray(h?.bags)) m.bags = Array.from({ length: 9 }, (_, i) => cleanStack(h.bags[i]));
      m.armoured = !!h?.armoured;
      m.rested = Math.max(0, +h?.rested || 0);
      m.parts.gear?.(m.bags, m.armoured);
    }
    m.sitting = !!sitting && !far;
  }
  $('loading').classList.add('hidden');
  worldReady = true;
  paused = false;
  if (!save) toast(creative ? 'Creative mode: open 🎒 for every block and item. Press F (or 🕊) to fly.' : 'Hold on a tree to punch it and collect logs.<br>Tap 🎒 to craft.', 5000);
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
    ...(activeSlot === MP_SLOT ? { mpWorld: net.worldId } : {}),
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
    logistics: logistics.serialize(), ordererLink,
    logic: logic.serialize(),
    kinetics: kinetics.serialize(),
    electric: electric.serialize(),
    packs: [...packs],
    nextPack,
    carts: carts.serialize(),
    vehicles: vehicles.serialize(),
    zips: zips.map((z) => z.ends),
    armour: [...armour],
    armourWear: [...armourWear],
    armourEnch: [...armourEnch],
    effects: { ...effects },
    caneToday,
    weather: { raining: weather.raining, timer: Math.round(weather.timer) },
    pets: mobs.pets(),
    waypoints,
    places, treasures, beacons: [...beaconSpots], catGiftDay, villageGrowth: [...villageGrowth], bellDay, fires: [...fires], hearths: [...hearths], openGates: [...openGates], mangers: [...mangers], piles: piles.map((p) => ({ cells: p.cells, hole: p.hole, left: p.left, total: p.total })), soil: [...(world.soil ?? [])].slice(-4000),
    time: sky.time,
    creative,
    flying: player.flying,
    achievements: [...achieved],
    guidebook: { done: [...guideDone], claimed: [...guideClaimed] },
    explored: worldMap.serialize(),
    loose: loose.serialize(),
    start: startPos,
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
  const ench = inventory.held()?.ench;
  el.textContent = id ? itemName(id) + (ench?.length ? ` (${ench.map((e) => ENCHANTS[e]?.name).join(', ')})` : '') : '';
  el.classList.add('show');
  clearTimeout(nameTimer);
  nameTimer = setTimeout(() => el.classList.remove('show'), 1200);
}

function slotHTML(s) {
  if (!s) return '';
  let bar = '';
  if (s.wear > 0 && (maxWear(s.id) || chargeCap(s.id))) {
    const left = Math.max(0, 1 - s.wear / (maxWear(s.id) || chargeCap(s.id))); // (or, for battery-powered things, the charge left)
    bar = `<span class="wear"><i style="--w:${Math.round(left * 100)}%;--wc:hsl(${Math.round(left * 120)},70%,45%)"></i></span>`;
  }
  return `<img src="${icons[s.id]}" alt=""${s.ench?.length ? ' class="enchanted"' : ''}><span class="count">${s.count > 1 ? s.count : ''}</span>${bar}`;
}

const hotbarEls = [];
for (let i = 0; i < 9; i++) {
  const el = document.createElement('div');
  el.className = 'slot';
  el.addEventListener('pointerdown', (e) => { e.preventDefault(); selectSlot(i); startHotbarThrow(i); });
  for (const ev of ['pointerup', 'pointerleave', 'pointercancel']) el.addEventListener(ev, stopHotbarThrow);
  $('hotbar').appendChild(el);
  hotbarEls.push(el);
}

// Hold a hotbar slot to throw what's in it, one at a time (the touch version of Q).
let hotbarThrow = null;
function startHotbarThrow(i) {
  stopHotbarThrow();
  hotbarThrow = setTimeout(function again() {
    if (inventory.selected !== i || !inventory.held() || !throwHeld(false)) { hotbarThrow = null; return; }
    hotbarThrow = setTimeout(again, 180);
  }, 450);
}
function stopHotbarThrow() { clearTimeout(hotbarThrow); hotbarThrow = null; }

// Take n from the stack in hand (in creative, nothing in hand is ever used up).
function takeFromHeld(n) {
  const s = inventory.held();
  if (!s || creative) return;
  s.count -= n;
  if (s.count <= 0) { inventory.slots[inventory.selected] = null; inventory.refill(s.id); }
  inventory.onChange();
}

// Throw one of what's in your hand (or the whole stack) out in front of you. Returns whether it threw.
function throwHeld(all) {
  const s = inventory.held();
  if (!s || paused || dead || !worldReady) return false;
  const n = all ? s.count : 1;
  const dir = player.lookDir();
  const from = player.eye.clone().addScaledVector(dir, 0.4);
  from.y -= 0.35;
  const it = loose.spawn({ ...s, count: n }, from, { x: dir.x * 5.5 + player.vel.x * 0.5, y: dir.y * 5.5 + 2, z: dir.z * 5.5 + player.vel.z * 0.5 }, 1.5);
  if (it && s.id === STICK) it.thrown = true; // a tame wolf will fetch it
  takeFromHeld(n);
  sound.click?.() ?? sound.pop();
  return true;
}

// Walking over a loose item picks it up: returns how many you took.
let pickToastAt = 0;
function pickUpLoose(s) {
  const left = s.wear || s.ench?.length || s.pack ? inventory.fitItem(s) : inventory.fit(s.id, s.count);
  const took = s.count - left;
  if (took > 0) {
    sound.pop();
    const now = performance.now();
    if (now - pickToastAt > 300) { pickToastAt = now; toast(`+${took} ${itemName(s.id)}`, 1000); }
  }
  return took;
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
  renderPins();
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
  if (creative) { hunger = MAX_HUNGER; player.speedMul = 1; return false; }
  const moving = Math.hypot(player.vel.x, player.vel.z) > 0.5;
  const rate = (1 / 80 + (moving ? 1 / 40 : 0) + (controls.breaking ? 1 / 50 : 0)) * (poisoned > 0 ? 4 : 1) *
    (effects.fed > 0 ? 0.5 : 1) * (ailments.heat >= 1 ? 2 : 1);
  hunger = Math.max(0, hunger - rate * dt);
  // starving: you can only stagger along until you eat something; the cold slows you too
  player.speedMul = (hunger <= 0 ? 0.45 : 1) * (ailments.chill >= 1 ? 0.7 : 1) * (effects.swift > 0 ? 1.3 : 1);
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
  if (dead || amount <= 0 || creative) return;
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
  if (riding || ridingMob || boarded || zipping || seated || player.flying || player.thrusting || player.hovering || player.inWater || player.inLava || player.climbing || player.onGround && wasGround) fallTop = null;
  if (!player.onGround && !player.inWater) fallTop = Math.max(fallTop ?? prevY, prevY, player.pos.y);
  else if (player.onGround && !wasGround && fallTop === null && !player.inWater) fallTop = prevY;
  if (player.onGround && !wasGround && fallTop !== null) {
    const fall = fallTop - player.pos.y;
    fallTop = null;
    const hurt = Math.floor((fall - 3) * (armourEnch[3]?.includes('feather') ? 0.5 : 1));
    // v32: a bounce pad throws you back up (hold jump to bounce higher, sneak to stop), and never hurts
    const pad = BLOCKS[world.get(Math.floor(player.pos.x), Math.floor(player.pos.y - 0.05), Math.floor(player.pos.z))]?.bounce;
    if (pad) {
      const back = Math.min(24, Math.sqrt(2 * 28 * Math.max(0, fall)) * 0.85);
      const v = controls.down ? 0 : Math.max(back, controls.jump ? pad : 0);
      if (v > 2) { player.vel.y = v; player.onGround = false; sound.place('wool'); }
    } else if (fall > 3.5 && hurt > 0 && !guarded('fall')) damage(hurt, 'You fell from a high place.'); // (padded boots: no fall damage)
  }
  // drowning
  player.swimMul = guarded('swim') ? 1.9 : 1; // flippers
  sky.diving = guarded('water');
  if (player.eyeInWater) {
    // a diving helmet: breath lasts five times as long, and an air pump near you keeps it topped up
    if (sky.diving && airPumpNear(dt)) air = Math.min(MAX_AIR, air + dt * 2);
    else air = Math.max(0, air - dt / (sky.diving ? 5 : 1));
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
  if (player.inLava && !(effects.fire > 0) && !guarded('fire')) {
    if ((timers.lava -= dt) <= 0) { timers.lava = hazmatSuit() ? 1 : 0.5; damage(3, 'You tried to swim in lava.'); } // (a hazmat suit holds it off for longer)
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
  if (health < MAX_HEALTH && hunger >= (effects.fed > 0 ? 10 : 16) && poisoned <= 0) {
    if ((timers.regen += dt) >= (effects.fed > 0 ? 2 : 3)) {
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
  if (!fishing.active) {
    // a worm from your pack goes on the hook if you have one
    const bait = inventory.count(WORM) > 0;
    if (bait) inventory.remove(WORM, 1);
    fishing.cast(player.eye, player.lookDir(), id === WEIGHTED_ROD, bait);
    return;
  }
  const at = fishing.state?.pos?.clone(), baited = fishing.baited;
  if (!fishing.reel()) return;
  const [what, n, msg] = catchAt(at ?? player.pos, baited);
  if (inventory.add(what, n) > 0) { toast('Inventory full: your catch dropped at your feet'); return; }
  toast(msg, 1800);
  achieve('fish');
  sound.pop();
}

// What's on the hook depends on where you fish: salmon in rivers, icefish in the cold, pufferfish in warm
// water, and now and then some junk, or treasure.
const TREASURE = [[GOLD_INGOT, 1], [SILVER_INGOT, 2], [CRYSTAL_SHARD, 3], [IRON_INGOT, 2], [NIGHT_TEA, 1], [SILVER_ARROW, 4]];
function catchAt(pos, baited = false) {
  const x = Math.floor(pos.x), z = Math.floor(pos.z), r = Math.random() * (baited ? 0.95 : 1);
  const gen = world.generator, biome = gen.biomeAt(x, z);
  if (r < 0.05) { const [id, n] = TREASURE[Math.floor(Math.random() * TREASURE.length)]; return [id, n, `Treasure! You fished up ${n > 1 ? n + ' × ' : ''}${itemName(id).toLowerCase()}`]; }
  if (r < 0.12 && !baited) { const id = Math.random() < 0.6 ? OLD_BOOT : STICK; return [id, 1, `You fished up ${id === OLD_BOOT ? 'an old boot' : 'a soggy stick'}`]; }
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
    el.addEventListener('click', (e) => { if (e.shiftKey && i < SLOTS) quickMoveInv(i); else onInvSlot(i); showSlotTip(i); });
    if (i < SLOTS) holdOn(el, () => quickMoveInv(i));
    if (i < SLOTS) splitOn(el, () => ({ slot: { get: () => inventory.slots[i], set: (v) => { inventory.slots[i] = v; } }, list: inventory.slots, i, room: [inventory.slots], done: () => { picked = -1; inventory.onChange(); renderInventory(); } }));
    el.addEventListener('mouseenter', () => showSlotTip(i));
    el.addEventListener('mouseleave', () => { if (tipSlot === i) showSlotTip(picked); });
    parent.appendChild(el);
    invEls[i] = el;
  };
  for (let i = 9; i < SLOTS; i++) make(i, $('inv-grid'));
  for (let i = 0; i < 9; i++) make(i, $('inv-hotbar'));
  for (let k = 0; k < 5; k++) make(ARMOUR_SLOT + k, $('inv-armour'));
}
const ARMOUR_SLOT = 100; // the armour slots count as 100..103 in the inventory panel

// ---------- tooltips ----------
// In the inventory: the name (and a few details) of the slot under the mouse, or the one you tapped.
// In the world: the name of whatever the crosshair is on. Both can be turned off in the ☰ menu.
let tipSlot = -1;
function itemTipHTML(s) {
  const def = ITEMS[s.id];
  const bits = [];
  if (def?.about) bits.push(def.about);
  if (foodValue(s.id)) bits.push(`${foodValue(s.id)} food`);
  if (def?.tool) bits.push(`${def.tool.type === 'pick' ? 'pickaxe' : def.tool.type}${def.tool.tier ? `, tier ${def.tool.tier}` : ''}`);
  if (def?.armour?.points) bits.push(`${def.armour.points} armour`);
  const mw = maxWear(s.id);
  if (mw) bits.push(`${Math.max(0, Math.round(100 - (s.wear ?? 0) / mw * 100))}% left`);
  if (chargeCap(s.id)) bits.push(`${Math.round(chargeLeft(s) / chargeCap(s.id) * 100)}% charged${s.on ? ' · switched on' : ''}`);
  const ench = (s.ench ?? []).map((k) => ENCHANTS[k]?.name).filter(Boolean);
  const uses = usedIn(s.id), names = [...new Set(uses.map((o) => itemName(o)))];
  const usedTxt = names.length ? `Used in: ${names.slice(0, 6).join(', ')}${names.length > 6 ? ` and ${names.length - 6} more` : ''}` : '';
  return `<b>${itemName(s.id)}</b>${s.count > 1 ? ` × ${s.count}` : ''}` +
    (ench.length ? `<span class="ench">${ench.join(', ')}</span>` : '') + (bits.length ? `<span>${bits.join(' · ')}</span>` : '') +
    (usedTxt ? `<span class="used-in">${usedTxt}</span>` : '');
}
function showSlotTip(i) {
  const tip = $('inv-tip');
  tipSlot = i;
  const s = i < 0 ? null : i >= ARMOUR_SLOT ? (armour[i - ARMOUR_SLOT] && { id: armour[i - ARMOUR_SLOT], count: 1, wear: armourWear[i - ARMOUR_SLOT], ench: armourEnch[i - ARMOUR_SLOT] }) : inventory.slots[i];
  if (!settings.tips || !s || !invEls[i]) { tip.classList.remove('show'); return; }
  tip.innerHTML = itemTipHTML(s);
  tip.classList.add('show');
  // just above the slot, kept on screen
  const r = invEls[i].getBoundingClientRect(), w = tip.offsetWidth, h = tip.offsetHeight;
  tip.style.left = Math.max(4, Math.min(window.innerWidth - w - 4, r.left + r.width / 2 - w / 2)) + 'px';
  tip.style.top = (r.top - h - 6 < 4 ? r.bottom + 6 : r.top - h - 6) + 'px';
}
// (v35) The same tooltips in crafting lists and machine windows: anything with data-tip="id" (and data-tip-or,
// a line naming the alternatives), and the slots of whatever station is open. Shown on hover.
function placeTip(tip, el) {
  const r = el.getBoundingClientRect(), w = tip.offsetWidth, h = tip.offsetHeight;
  tip.style.left = Math.max(4, Math.min(window.innerWidth - w - 4, r.left + r.width / 2 - w / 2)) + 'px';
  tip.style.top = (r.top - h - 6 < 4 ? r.bottom + 6 : r.top - h - 6) + 'px';
}
let hoverTipEl = null;
document.addEventListener('mouseover', (e) => {
  const el = e.target.closest?.('[data-tip], #station .slot[data-area]');
  if (el === hoverTipEl) return;
  const tip = $('inv-tip');
  if (hoverTipEl && tipSlot < 0) tip.classList.remove('show');
  hoverTipEl = el;
  if (!el || !settings.tips) return;
  let s;
  if (el.dataset.tip) s = { id: +el.dataset.tip, count: 1 };
  else { try { s = stationSlot(el.dataset.area, +el.dataset.i).get(); } catch { s = null; } }
  if (!s) return;
  tipSlot = -1;
  tip.innerHTML = itemTipHTML(s) + (el.dataset.tipOr ? `<span class="ench">${el.dataset.tipOr}</span>` : '');
  tip.classList.add('show');
  placeTip(tip, el);
});
const capital = (t) => t.charAt(0).toUpperCase() + t.slice(1);
function lookName() {
  if (targetCart) {
    const c = targetCart.cart, l = c.loco;
    if (l) return `Locomotive${l.burn > 0 || l.coal > 0 ? ` (coal: ${l.coal}${l.burn > 0 ? ` + ${Math.ceil(l.burn)}s` : ''})` : ' (no coal)'}${c.towed?.length ? `, pulling ${c.towed.length}` : ''}`;
    return (c.store ? 'Storage Cart' : 'Minecart') + (c.tow ? ' (coupled)' : '');
  }
  if (targetVehicle) return targetVehicle.v.kind === 'boat' ? (targetVehicle.v.store ? 'Chest Boat (sneak and tap to open)' : targetVehicle.v.fast ? 'Polymer Boat' : 'Boat') : 'Hot-Air Balloon';
  if (targetMob) {
    const m = targetMob.mob;
    const name = m.spec.name ?? (m.kind === 'villager' ? `Villager (${m.profession ?? 'farmer'})` : capital(m.kind));
    if (m.spec.horse) return horseLabel(m);
    return m.tame ? `${name} (tame)` : name;
  }
  if (target) {
    const def = BLOCKS[target.id];
    return def ? (def.variantOf && BLOCKS[def.variantOf] ? BLOCKS[def.variantOf].name : def.name) : '';
  }
  return '';
}
let shownLook = null;
function updateLookTip() {
  const name = settings.tips && !paused ? lookName() : '';
  if (name === shownLook) return;
  shownLook = name;
  const el = $('look-tip');
  el.textContent = name;
  el.classList.toggle('show', !!name);
}
buildInventoryGrid();

const armourPiece = (id) => ITEMS[id]?.armour?.piece ?? -1;
let lastInvTap = { i: -1, t: 0 };
function onInvSlot(i) {
  // a quick second tap on the same slot gathers up all the same things from the rest of the backpack into it
  const now = performance.now();
  if (lastInvTap.i === i && now - lastInvTap.t < DOUBLE_TAP && i < ARMOUR_SLOT && inventory.slots[i]) {
    lastInvTap = { i: -1, t: 0 };
    picked = -1;
    gatherInto(inventory.slots, i, [inventory.slots]);
    inventory.onChange();
    renderInventory();
    return;
  }
  lastInvTap = { i, t: now };
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
      const worn = armour[k], wornWear = armourWear[k], wornEnch = armourEnch[k];
      armour[k] = item?.id ?? null;
      armourWear[k] = item?.wear ?? 0;
      armourEnch[k] = item?.ench ?? null;
      inventory.slots[s] = worn ? { id: worn, count: 1, ...(wornWear ? { wear: wornWear } : {}), ...(wornEnch ? { ench: wornEnch } : {}) } : null;
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
  const worn = armour[k], wornWear = armourWear[k], wornEnch = armourEnch[k];
  armour[k] = held.id;
  armourWear[k] = held.wear ?? 0;
  armourEnch[k] = held.ench ?? null;
  inventory.slots[inventory.selected] = worn ? { id: worn, count: 1, ...(wornWear ? { wear: wornWear } : {}), ...(wornEnch ? { ench: wornEnch } : {}) } : null;
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
  if (tipSlot >= 0) requestAnimationFrame(() => showSlotTip(tipSlot)); // (what's in the slot may have changed)
  if (creative) renderPalette();
  for (let i = 0; i < SLOTS; i++) {
    invEls[i].innerHTML = slotHTML(inventory.slots[i]);
    invEls[i].classList.toggle('picked', i === picked);
  }
  for (let k = 0; k < 5; k++) {
    const el = invEls[ARMOUR_SLOT + k];
    el.innerHTML = armour[k] ? slotHTML({ id: armour[k], count: 1, wear: armourWear[k], ench: armourEnch[k] }) : `<span class="empty-armour">${['⛑', '👕', '👖', '👢', '🛡'][k]}</span>`;
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
      return `<span class="ing${miss}" data-tip="${first}" data-tip-or="${idsOf(id).length > 1 ? idsOf(id).map(itemName).join(' or ') : ''}"><img src="${icons[first]}" alt="">${n}</span>`;
    }).join('');
    // tools are needed but not used up
    const tools = (r.tools ?? []).map((id) => {
      const miss = inventory.count(id) > 0 ? '' : ' missing';
      return `<span class="ing tool${miss}" data-tip="${id}" data-tip-or="${itemName(id)} (not used up)"><img src="${icons[id]}" alt="">kept</span>`;
    }).join('');
    const also = (r.also ?? []).map(([id]) => ` + ${itemName(id)} back`).join('');
    const where = r.churn ? ' (churn)' : r.table ? ' 🛠' : '';
    row.innerHTML = `${ings}${tools}<span class="arrow">→</span><img class="outimg" src="${icons[r.out[0]]}" alt="" data-tip="${r.out[0]}">` +
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
    // pin it to the screen, to keep track of what you still need for it
    const pinned = settings.pins.includes(recipeKey(r));
    const pin = document.createElement('button');
    pin.className = 'pinb' + (pinned ? ' on' : '');
    pin.textContent = '📌';
    pin.title = pinned ? 'Unpin from the screen' : 'Pin to the screen';
    pin.addEventListener('click', () => togglePin(r));
    row.appendChild(pin);
    const btn = document.createElement('button');
    btn.className = 'btn';
    btn.textContent = 'Craft';
    btn.disabled = !canMake;
    btn.addEventListener('click', () => {
      if (!r.in.every(([id, n]) => countOf(id) >= n)) return;
      const charge = batteriesTaken(r);
      for (const [id, n] of r.in) takeOf(id, n);
      for (const id of r.tools ?? []) wearTool(id);
      const cap = chargeCap(r.out[0]);
      let lost = cap ? inventory.addItem({ id: r.out[0], count: 1, ...(charge < cap ? { wear: cap - charge } : {}) }) : inventory.add(r.out[0], r.out[1]);
      for (const [id, n] of r.also ?? []) lost += inventory.add(id, n);
      if (lost) toast('Inventory full: dropped at your feet');
      sound.pop();
    });
    row.appendChild(btn);
    list.appendChild(row);
  });
  if (!count) list.innerHTML = `<p class="hint">${query ? `Nothing matches "${query.replace(/[<>&"]/g, '')}".` : favOnly ? 'No favourites yet: tap the ☆ beside a recipe.' : 'Nothing you can make right now.'}</p>`;
}

// Pinned recipes: up to three, shown at the side of the screen with how many of each thing you have
// and still need. Pinned recipes stay pinned until you unpin them (or make the thing, if you like).
const MAX_PINS = 3;
function togglePin(r) {
  const k = recipeKey(r);
  if (settings.pins.includes(k)) settings.pins = settings.pins.filter((p) => p !== k);
  else {
    settings.pins = [...settings.pins, k].slice(-MAX_PINS);
    toast(`Pinned: ${itemName(r.out[0])}`, 1200);
  }
  saveSettings();
  renderPins();
  renderInventory();
}
function renderPins() {
  const el = $('pins');
  if (!el) return;
  const rs = settings.pins.map((k) => RECIPES.find((r) => recipeKey(r) === k)).filter(Boolean);
  el.innerHTML = rs.map((r) => {
    const ings = r.in.map(([id, n]) => {
      const have = countOf(id), first = idsOf(id)[0];
      return `<span class="${have >= n ? 'have' : 'need'}"><img src="${icons[first]}" alt="">${Math.min(have, n)}/${n}</span>`;
    }).join(' ');
    const ready = r.in.every(([id, n]) => countOf(id) >= n);
    return `<div class="pin${ready ? ' ready' : ''}"><img src="${icons[r.out[0]]}" alt=""><span class="pname">${itemName(r.out[0])}${r.table ? ' 🛠' : ''}</span>${ings}</div>`;
  }).join('');
}

// What a recipe is called in the favourites list: what it makes and from what.
function recipeKey(r) { return `${r.out[0]}x${r.out[1]}:${r.in.map(([id, n]) => idsOf(id).join('|') + 'x' + n).join(',')}`; }
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
    const same = !s.wear && !s.ench && items.find((t) => t.id === s.id && !t.wear && !t.ench && t.count < maxStack(t.id));
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
function idsOf(spec) { return Array.isArray(spec) ? spec : [spec]; }
function countOf(spec) { return idsOf(spec).reduce((t, id) => t + inventory.count(id), 0); }
// The charge in the batteries a recipe uses up (the ones inventory.remove takes: from the last slot back),
// which goes into what it makes. (A new battery comes flat.)
function batteriesTaken(r) {
  let n = r.in.find(([id]) => id === BATTERY)?.[1] ?? 0, charge = 0;
  for (let i = SLOTS - 1; i >= 0 && n > 0; i--) if (inventory.slots[i]?.id === BATTERY) { charge += chargeLeft(inventory.slots[i]); n--; }
  return charge;
}
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
  renderChestResults();
}
function closeInventory() {
  closeSplit();
  tipSlot = -1;
  $('inv-tip').classList.remove('show');
  $('inventory').classList.add('hidden');
  paused = false;
  openedAt = null;
}
function toggleInventory() {
  if (photoMode) return;
  if (openStationAt) { closeStation(); return; }
  if (ridingMob?.bags && $('inventory').classList.contains('hidden') && $('menu').classList.contains('hidden')) { openSaddlebags(ridingMob); return; }
  if (boarded?.store && $('inventory').classList.contains('hidden') && $('menu').classList.contains('hidden')) { openBoatChest(boarded); return; }
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
  if (area === 'side') return { get: () => stations.sideSlots(st)[i], set: (v) => { stations.sideSlots(st)[i] = v; } };
  return { get: () => inventory.slots[i], set: (v) => { inventory.slots[i] = v; } };
}

function openStation(x, y, z, cart = null) {
  const t = !cart && treasures.find((tr) => tr.placed && !tr.found && tr.x === x && tr.y === y && tr.z === z);
  if (t) { t.found = true; toast('You found the buried treasure!', 2500); sound.ding?.(); achieve('treasure'); }
  const kind = cart ? 'chest' : stationKind(world.get(x, y, z));
  const nIn = cart ? cart.store.inputs.length : STATION_KINDS[kind].inputs;
  if (!cart) stations.get(x, y, z, kind);
  openStationAt = { x, y, z, kind, cart };
  stPicked = null;
  paused = true;
  controls.reset();
  document.exitPointerLock?.();
  const K = STATION_KINDS[kind];
  $('station-title').textContent = cart ? cart.title ?? 'Storage Cart' : K.name;
  $('station').classList.toggle('storage', !!K.storage);
  // build the slots for this kind of station
  const make = (parent, area, i) => {
    const el = document.createElement('div');
    el.className = 'slot';
    el.dataset.area = area;
    el.dataset.i = i;
    el.addEventListener('click', (e) => { if (e.shiftKey) quickMoveStation(area, i); else onStationSlot(area, i); });
    holdOn(el, () => quickMoveStation(area, i));
    if (area === 'in' || area === 'inv') splitOn(el, () => {
      const st = currentStation();
      return st && { slot: stationSlot(area, i), list: area === 'in' ? st.inputs : inventory.slots, i, room: area === 'in' && STATION_KINDS[st.kind].storage ? [st.inputs, inventory.slots] : [inventory.slots],
        done: () => { stPicked = null; inventory.onChange(); renderStation(); } };
    });
    parent.appendChild(el);
  };
  const ins = $('st-inputs');
  ins.innerHTML = '';
  ins.style.gridTemplateColumns = K.storage ? '' : `repeat(${K.inputs > 1 ? 2 : 1}, var(--slot))`;
  for (let i = 0; i < nIn; i++) make(ins, 'in', i);
  for (const [id, area] of [['st-fuel', 'fuel'], ['st-out', 'out']]) {
    $(id).innerHTML = '';
    if (!K.storage && !K.holder && (area === 'out' || !(K.powered || K.crafter || K.nofuel))) make($(id), area, 0);
  }
  $('station').querySelector('.st-fuel-row').style.display = K.powered || K.crafter || K.holder || K.nofuel ? 'none' : '';
  $('st-side').innerHTML = '';
  if (!cart) for (let i = 0; i < (K.sides ?? 0); i++) make($('st-side'), 'side', i);
  $('st-side').classList.toggle('hidden', !K.sides || !!cart);
  $('st-inv').innerHTML = ''; $('st-hotbar').innerHTML = '';
  for (let i = 9; i < SLOTS; i++) make($('st-inv'), 'inv', i);
  for (let i = 0; i < 9; i++) make($('st-hotbar'), 'inv', i);
  // what it can make
  const shownRecipes = K.crafter ? [crafterRecipe(x, y, z)].filter(Boolean) : K.recipes;
  $('st-recipes').innerHTML = shownRecipes.map((r) => {
    const ing = r.in.map(([id, n]) => `<span class="ing" title="${idsOf(id).map(itemName).join(' or ')}"><img src="${icons[idsOf(id)[0]]}" alt="">${n}</span>`).join('');
    const tools = (r.tools ?? []).map((id) => `<span class="ing tool" title="${itemName(id)} (not used up)"><img src="${icons[id]}" alt="">kept</span>`).join('');
    const side = (r.side ?? []).map(([id, p]) => `<span class="ing side" title="${itemName(id)}: ${Math.round(p * 100)}% of the time"><img src="${icons[id]}" alt="">${Math.round(p * 100)}%</span>`).join('');
    return `<div class="recipe">${ing}${tools}<span class="arrow">→</span>` + (r.out ? `<img class="outimg" src="${icons[r.out[0]]}" alt="" data-tip="${r.out[0]}">` +
      `<span class="name">${r.out[1] > 1 ? r.out[1] + ' × ' : ''}${itemName(r.out[0])}</span>` : '') + (side ? `<span class="sides">${r.out ? '+ ' : ''}${side}</span>` : '') + '</div>';
  }).join('') + (kind === 'charger' ? '<p class="hint">Put in a battery, or anything that runs on one (a portable lamp, jackhammer, jetpack, drill, chainsaw, hover boots, goggles or magnet ring): ' +
    'it charges while it has electricity. Join it to a generator with electrum wire, or set it right beside one.</p>'
    : kind === 'reactor' ? `<p class="hint">Put fuel rods in: each burns for ${ROD_LIFE / 60} minutes (an enriched rod twice as long), making ${REACTOR_POWER} power, and heats the reactor. ` +
    'A burnt-out rod is left spent: nuclear waste, so keep it in a lead-lined chest. Water, ice or packed ice touching it (each face counts) cools it. If it gets too hot it melts down, so keep plenty of water round it, take rods out, or give it a ' +
    'signal (a lever, or a power meter set to signal a shortfall) to push its control rods in and stop it.</p>'
    : K.holder ? `<p class="hint">${kind === 'planter' ? 'Put saplings, seeds or vegetables in (or feed them in with a hopper): it plants one on the grass or dirt in front of it whenever there\'s room.'
    : 'Put empty buckets in for milking yaks, and wheat to feed the animals (their coats grow back faster). Wheat, seeds or berries also feed pairs of animals so they have young. What it gets comes out of its back, into a chest, hopper or belt.'}</p>`
    : kind === 'winepress' || kind === 'cheesepress' ? `<p class="hint">It needs no fuel or power. Lay what it makes down in an oak barrel to age: ${kind === 'winepress' ? 'grape juice becomes wine, apple juice cider and berry juice berry wine in a day, and finer still three days later' : 'curds become cheese in a day, and aged cheese three days later'}.</p>`
    : kind === 'bottler' ? `<p class="hint">Pipe water or lava into it with a liquid sink or supplier pipe: it fills the buckets put in it (lava goes in lead buckets). It holds ${logistics.bottlerText(x, y, z)}.</p>`
    : kind === 'polypress' ? '<p class="hint">Turn it with a shaft. Sawdust and hide glue (leather rendered in an oven) make polymer pellets; two pellets press into a sheet.</p>'
    : kind === 'beehouse' ? '<p class="hint">Put in a princess and a drone (catch them from a wild hive with a bee scoop), and up to two frames for more combs. ' +
      'The princess becomes a queen and works through her life filling the trays with combs, then leaves a new princess and some drones. ' +
      'Each of them takes after one parent or the other, but two different species can now and then breed a new one. ' +
      'Each species needs its own flowers nearby and its own time and place to work: see its tip. Spin the combs in a comb centrifuge.</p>'
    : kind === 'compost' ? '<p class="hint">It needs no fuel or power: scraps just rot down, given time. Tap a crop or sapling with fertiliser to grow it a step.</p>'
    : kind === 'fishtrap' ? '<p class="hint">Sink it in water and put worms in for bait: every so often something swims in. Collect the catch from the trays (or put a hopper under it).</p>'
    : kind === 'sieve' ? '<p class="hint">It needs no fuel or power: you shake it by hand. What it sifts out (shown as a chance) collects in the trays on the right: keep them emptied (a hopper underneath does it), or things that don\'t fit are lost, and once they\'re full it stops.</p>'
    : kind === 'washer' ? '<p class="hint">Times are at 1x speed. Drive it with a shaft like the rock crusher, and give it water: a source or flowing water touching any side. ' +
      'Clean dust smelts one for one (dirty dust only three for four). The washings sometimes give an extra dust, a trace of another metal, and sludge (4 make clay).</p>'
    : kind === 'pcrafter' ? '<p class="hint">Hang item frames on it (up to four) showing what to make: it makes the first, and steps on ' +
    'to the next each time it gets a signal (a lever, button, item counter...). Fill it with hoppers or belts and empty it with a hopper underneath.</p>'
    : K.crafter ? '<p class="hint">Hang an item frame on it showing what to make. Whenever the ingredients are inside, ' +
    'it makes one, a second at a time, into the output slot: fill it with hoppers or belts and empty it with a hopper underneath.</p>'
    : K.electric ? '<p class="hint">Times are at 1x speed: it runs at 2x with all the electricity it wants. Join it to a generator ' +
    'with electrum wire or cable (or set it right beside one). ' + (kind === 'esmelter' ? 'It needs no fuel.</p>'
    : kind === 'arc' ? 'It needs no fuel, smelts twice as fast as the electric smelter, and makes invar and starsteel (from meteoric iron), which no fire is hot enough for.</p>'
    : kind === 'freezer' ? 'Water buckets come back empty. Packed ice cools a reactor better than water, and doesn\'t melt.</p>'
    : kind === 'centrifuge' ? 'Enriched uranium makes fuel rods that burn twice as long. Spent rods slowly give back a little uranium (and stop being waste).</p>'
    : 'It gets half as much again out of everything as the rock crusher, and sometimes one more.</p>')
    : K.powered ? '<p class="hint">Times are at 1x speed. Drive it with a water wheel or windmill by turning a shaft or gear ' +
    'against any face; gear it up for more speed.' + (kind === 'crusher' ? ' Ore dust smelts into ingots, so crushing ore doubles what you get.' : '') + '</p>'
    : '<p class="hint">Fuel, in items cooked per piece: log or planks 1, stick ½, coal or charcoal 10, ' +
    'slime fuel 40, lava bucket 100 (their buckets are left in the fuel slot). Fuel is only used while something is cooking.' +
    (K.speed ? ' A blast smelter works twice as fast on the same fuel.' : '') +
    (K.water ? ' It needs water: tap it with a water bucket (or leave it out in the rain). Every two teas use a level.' : '') + '</p>');
  $('station').classList.remove('hidden');
  renderStation();
}

function closeStation() {
  closeSplit();
  $('station').classList.add('hidden');
  openStationAt = null;
  stPicked = null;
  paused = false;
}

function renderStation() {
  const st = currentStation();
  if (!st) return;
  const ups = upgradeStacks(st);
  $('st-upgrades').textContent = ups.length ? `Upgrades: ${ups.map((u) => `${itemName(u.id).replace(' Upgrade', '').toLowerCase()} × ${u.count}`).join(', ')}` : '';
  for (const el of $('station').querySelectorAll('.slot')) {
    const area = el.dataset.area, i = +el.dataset.i;
    el.innerHTML = slotHTML(stationSlot(area, i).get());
    el.classList.toggle('picked', !!stPicked && stPicked.area === area && stPicked.i === i);
  }
  const K = STATION_KINDS[st.kind];
  if (K.storage) {
    $('st-status').textContent = `${st.inputs.filter(Boolean).length} of ${st.inputs.length} slots used`;
    if (K.ages) {
      // a barrel: how the first thing that's ageing is coming along
      const i = st.inputs.findIndex((s) => s && AGING[s.id]);
      const s = st.inputs[i], cellar = inCellar(world, openStationAt.x, openStationAt.y, openStationAt.z);
      $('st-status').textContent = s ? `${itemName(s.id)} → ${itemName(AGING[s.id][0])}: ${Math.floor(Math.min(1, (st.age?.[i] ?? 0) / (AGING[s.id][1] * DAY_LENGTH)) * 100)}% (${AGING[s.id][1]} day${AGING[s.id][1] > 1 ? 's' : ''} in all)${cellar ? ', faster in the cellar' : ''}`
        : `Lay down grape, apple or berry juice, or curds, to age: juice becomes wine (or cider) in a day, then something finer after three more; curds become cheese, then aged cheese. ${cellar ? 'This barrel is in a cellar: things age faster here' : 'A barrel where no daylight reaches (a cellar) ages things faster'}`;
    }
    return;
  }
  const r = stations.recipeFor(st, `${openStationAt.x},${openStationAt.y},${openStationAt.z}`);
  $('st-progress').style.width = `${r ? Math.min(100, (st.progress / r.time) * 100) : 0}%`;
  if (st.kind === 'charger') {
    const s = st.inputs[0], { x, y, z } = openStationAt;
    $('st-progress').style.width = s && chargeCap(s.id) ? `${chargeLeft(s) / chargeCap(s.id) * 100}%` : '0%';
    $('st-status').textContent = !s ? `Put a battery in. ${electric.statusAt(x, y, z)}` : !s.wear ? `${itemName(s.id)}: fully charged` :
      `${itemName(s.id)}: ${Math.floor(chargeLeft(s) / chargeCap(s.id) * 100)}% charged. ${electric.statusAt(x, y, z)}`;
    return;
  }
  if (st.kind === 'beehouse') {
    $('st-progress').style.width = `${apiculture.progress(st) * 100}%`;
    $('st-status').textContent = apiculture.status(st);
    return;
  }
  if (st.kind === 'reactor') {
    const { x, y, z } = openStationAt, heat = (electric.heat.get(`${x},${y},${z}`) ?? 0) / MELTDOWN;
    $('st-progress').style.width = `${Math.min(100, heat * 100)}%`;
    $('st-status').textContent = electric.statusAt(x, y, z);
    return;
  }
  if (K.holder) {
    $('st-status').textContent = st.kind === 'ranch' ? `${machines.drillStatus(openStationAt.x, openStationAt.y, openStationAt.z)}` : `${st.inputs.filter(Boolean).reduce((t, s) => t + s.count, 0)} saplings to plant`;
    return;
  }
  if (K.crafter) {
    const want = crafterRecipe(openStationAt.x, openStationAt.y, openStationAt.z);
    $('st-status').textContent = !want ? 'Hang an item frame on it showing what to make' : r ? `Making ${itemName(want.out[0]).toLowerCase()}…` : `Put in what ${itemName(want.out[0]).toLowerCase()} needs`;
    return;
  }
  const sideFull = !r && (st.side ?? []).length && st.side.every(Boolean) && K.recipes.some((q) => q.side && q.in.every(([id, n]) => stations.count(st, id) >= n));
  if (st.kind === 'sieve') {
    $('st-status').textContent = r ? `Sifting ${itemName(r.in[0][0]).toLowerCase()}…` : sideFull ? 'The trays are full: take what\'s been sifted out' : 'Put gravel or dirt in';
    return;
  }
  if (st.kind === 'fishtrap') {
    const wet = wetAt(world, openStationAt.x, openStationAt.y, openStationAt.z);
    $('st-status').textContent = !wet ? 'It needs to be in water' : r ? 'Baited: waiting for a bite…' : sideFull ? 'The trays are full: take out the catch' : 'Put worms in for bait';
    return;
  }
  if (st.kind === 'washer' && !wetAt(world, openStationAt.x, openStationAt.y, openStationAt.z)) {
    $('st-status').textContent = `It needs water touching it. ${kinetics.statusAt(openStationAt.x, openStationAt.y, openStationAt.z)}`;
    return;
  }
  if (sideFull) { $('st-status').textContent = 'The by-product slots are full: empty them to carry on'; return; }
  if (K.passive) {
    $('st-status').textContent = r ? `Rotting down into ${itemName(r.out[0]).toLowerCase()}…` : 'Put plant scraps in: sawdust, leaves, seeds, saplings, wheat, cane, berries or flowers';
    return;
  }
  if (STATION_KINDS[st.kind].powered) {
    const { x, y, z } = openStationAt;
    const power = K.electric ? electric.statusAt(x, y, z) : kinetics.statusAt(x, y, z);
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
      if (t && t.id === s.id && !t.pack && !s.pack && t.count < maxStack(s.id)) { const k = Math.min(s.count, maxStack(s.id) - t.count); t.count += k; s.count -= k; }
    }
    for (let j = 0; j < slots.length && s.count; j++) if (!slots[j]) { slots[j] = { ...s }; s.count = 0; }
    if (!s.count) from[i] = null;
  };
  if (intoChest) for (let i = 9; i < SLOTS; i++) { if (!(openStationAt.cart?.backpack && isBackpack(inventory.slots[i]?.id))) put(st.inputs, inventory.slots, i); }
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
// Quick-stack: backpack things (not the hotbar) that a chest already holds go into it, filling its stacks
// first and then its empty slots. Tools, enchanted things and backpacks stay with you. Returns how many moved.
function stackInto(slots) {
  let moved = 0;
  for (let i = 9; i < SLOTS; i++) {
    const s = inventory.slots[i];
    if (!s || s.wear || s.ench || s.pack || isBackpack(s.id) || !slots.some((t) => t && t.id === s.id)) continue;
    for (let j = 0; j < slots.length && s.count; j++) {
      const t = slots[j];
      if (t && t.id === s.id && !t.wear && !t.ench && t.count < maxStack(s.id)) { const k = Math.min(s.count, maxStack(s.id) - t.count); t.count += k; s.count -= k; moved += k; }
    }
    for (let j = 0; j < slots.length && s.count; j++) if (!slots[j]) { slots[j] = { ...s }; moved += s.count; s.count = 0; }
    if (!s.count) inventory.slots[i] = null;
  }
  return moved;
}
const QUICK_STACK_REACH = 6;
const QUICK_STACK_KINDS = ['chest', 'ironchest', 'leadchest'];
function quickStack() {
  const bx = Math.floor(player.pos.x), by = Math.floor(player.pos.y), bz = Math.floor(player.pos.z), R = QUICK_STACK_REACH;
  let moved = 0, chests = 0;
  for (let dy = -R; dy <= R; dy++) for (let dz = -R; dz <= R; dz++) for (let dx = -R; dx <= R; dx++) {
    const kind = stationKind(world.get(bx + dx, by + dy, bz + dz));
    if (!QUICK_STACK_KINDS.includes(kind)) continue;
    const n = stackInto(stations.get(bx + dx, by + dy, bz + dz, kind).inputs);
    if (n) { moved += n; chests++; }
  }
  sound.pop();
  inventory.onChange();
  toast(moved ? `Stacked ${moved} item${moved > 1 ? 's' : ''} into ${chests} chest${chests > 1 ? 's' : ''} nearby` : 'No chest nearby holds any of the things in your backpack');
  return moved;
}
$('btn-quick-stack').addEventListener('click', () => { picked = -1; quickStack(); });
$('btn-chest-match').addEventListener('click', () => {
  const st = currentStation();
  if (!st) return;
  const n = stackInto(st.inputs);
  sound.pop(); inventory.onChange(); renderStation();
  if (!n) toast('Nothing in your backpack matches what\'s in here');
});
$('btn-chest-in').addEventListener('click', () => chestMove(true));
$('btn-chest-out').addEventListener('click', () => chestMove(false));

let lastStTap = { area: '', i: -1, t: 0 };
function onStationSlot(area, i) {
  const st = currentStation();
  if (!st) return;
  // a quick second tap gathers the same things (from the chest and your backpack) into the slot
  const now = performance.now();
  if (lastStTap.area === area && lastStTap.i === i && now - lastStTap.t < DOUBLE_TAP && (area === 'in' || area === 'inv') && stationSlot(area, i).get()) {
    lastStTap = { area: '', i: -1, t: 0 };
    stPicked = null;
    const storage = STATION_KINDS[st.kind].storage;
    gatherInto(area === 'in' ? st.inputs : inventory.slots, i, area === 'in' ? (storage ? [st.inputs, inventory.slots] : [inventory.slots]) : (storage ? [inventory.slots, st.inputs] : [inventory.slots]));
    inventory.onChange();
    renderStation();
    return;
  }
  lastStTap = { area, i, t: now };
  // tapping the result collects it
  if ((area === 'out' || area === 'side') && !stPicked) {
    const slot = stationSlot(area, i), got = slot.get();
    if (got) {
      const left = inventory.addItem(got);
      slot.set(left ? { id: got.id, count: left } : null);
      if (left) toast('Inventory full: dropped at your feet'); else sound.pop();
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
  if (!a || area === 'out' || area === 'side') { renderStation(); return; } // nothing can be put into the result slots
  const K = STATION_KINDS[st.kind];
  if (area === 'in' && openStationAt.cart?.backpack && isBackpack(a.id)) { toast('A backpack won\'t go inside a backpack'); renderStation(); return; }
  if (area === 'in' && K?.accepts && !K.accepts.includes(a.id)) { toast(`The ${K.name.toLowerCase()} won't take ${itemName(a.id).toLowerCase()}`); renderStation(); return; }
  if (area === 'fuel' && !isFuel(a.id)) { toast(`${itemName(a.id)} won't burn`); renderStation(); return; }
  if (fromArea === 'fuel' && b && !isFuel(b.id)) { renderStation(); return; }
  if (b && b.id === a.id && !a.pack && !b.pack) {
    const k = Math.min(a.count, maxStack(a.id) - b.count);
    b.count += k; a.count -= k;
    if (!a.count) from.set(null);
  } else {
    from.set(b); to.set(a);
  }
  inventory.onChange();
  renderStation();
}

// ---------- v25: gathering stacks, quick moves ----------
const DOUBLE_TAP = 350; // ms
// Pull everything that stacks with list[i] out of the `sources` lists into it (up to a full stack).
function gatherInto(list, i, sources) {
  const s = list[i];
  if (!s || s.pack || s.wear || s.ench || maxStack(s.id) <= 1) return 0;
  let got = 0;
  for (const src of sources) for (let j = 0; j < src.length && s.count < maxStack(s.id); j++) {
    const t = src[j];
    if (!t || t === s || t.id !== s.id || t.pack || t.wear || t.ench) continue;
    const k = Math.min(t.count, maxStack(s.id) - s.count);
    s.count += k; t.count -= k; got += k;
    if (!t.count) src[j] = null;
  }
  if (got) { sound.pop(); toast(`Gathered ${got} more ${itemName(s.id).toLowerCase()}`, 1200); }
  return got;
}
// Put the stack from[i] into `slots` (topping up stacks first, then empty slots). Returns how many went.
function moveStack(slots, from, i, ok = () => true) {
  const s = from[i];
  if (!s || !ok(s)) return 0;
  const n0 = s.count;
  for (let j = 0; j < slots.length && s.count; j++) {
    const t = slots[j];
    if (t && t !== s && t.id === s.id && !t.pack && !s.pack && !t.wear && !s.wear && t.count < maxStack(s.id)) { const k = Math.min(s.count, maxStack(s.id) - t.count); t.count += k; s.count -= k; }
  }
  for (let j = 0; j < slots.length && s.count; j++) if (!slots[j]) { slots[j] = { ...s }; s.count = 0; }
  if (!s.count) from[i] = null;
  return n0 - s.count;
}
// Shift-click (or press and hold) a slot in the backpack screen: between the hotbar and the backpack.
function quickMoveInv(i) {
  picked = -1;
  const into = i < 9 ? inventory.slots.slice(9) : inventory.slots.slice(0, 9);
  const moved = moveStack(into, inventory.slots, i);
  if (moved) {
    if (i < 9) for (let j = 9; j < SLOTS; j++) inventory.slots[j] = into[j - 9]; else for (let j = 0; j < 9; j++) inventory.slots[j] = into[j];
    sound.pop();
  }
  inventory.onChange();
  renderInventory();
}
// Shift-click (or press and hold) a slot with a chest, backpack or machine open: the whole stack goes across.
function quickMoveStation(area, i) {
  const st = currentStation();
  if (!st) return;
  stPicked = null;
  const K = STATION_KINDS[st.kind];
  let moved = 0;
  if (area === 'inv') {
    const a = inventory.slots[i];
    if (!a) return;
    if (openStationAt.cart?.backpack && isBackpack(a.id)) { toast('A backpack won\'t go inside a backpack'); return; }
    if (K.accepts && !K.accepts.includes(a.id)) { toast(`The ${K.name.toLowerCase()} won't take ${itemName(a.id).toLowerCase()}`); return; }
    const ingredient = (K.recipes ?? []).some?.((r) => (r.in ?? []).some(([ing]) => (Array.isArray(ing) ? ing : [ing]).includes(a.id)));
    if (!K.storage && !K.crafter && !K.powered && !K.holder && isFuel(a.id) && !(st.fuel && st.fuel.id !== a.id) && !ingredient) {
      // fuel into the fuel slot
      const fuel = [st.fuel];
      moved = moveStack(fuel, inventory.slots, i);
      st.fuel = fuel[0];
    } else moved = moveStack(st.inputs, inventory.slots, i);
  } else {
    const slot = stationSlot(area, i), a = slot.get();
    if (!a) return;
    const left = inventory.addItem(a);
    moved = a.count - left;
    slot.set(left ? { ...a, count: left } : null);
    if (left) toast('Inventory full: dropped at your feet');
  }
  if (moved) sound.pop();
  inventory.onChange();
  renderStation();
}
// Press and hold a slot (on a touch screen) to do `fn` instead of a tap.
function holdOn(el, fn) {
  let timer = 0, x0 = 0, y0 = 0;
  const cancel = () => { clearTimeout(timer); timer = 0; };
  el.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse') return;
    x0 = e.clientX; y0 = e.clientY;
    cancel();
    timer = setTimeout(() => { timer = 0; noClickUntil = performance.now() + 600; navigator.vibrate?.(15); fn(); }, 480);
  });
  el.addEventListener('pointermove', (e) => { if (timer && Math.hypot(e.clientX - x0, e.clientY - y0) > 10) cancel(); });
  for (const t of ['pointerup', 'pointercancel', 'pointerleave']) el.addEventListener(t, cancel);
}

// What each thing is used to make (crafting, and the machines and stations), worked out once.
let usedInMap = null;
function usedIn(id) {
  if (!usedInMap) {
    usedInMap = new Map();
    const add = (ing, out) => {
      for (const x of Array.isArray(ing) ? ing : [ing]) {
        if (!usedInMap.has(x)) usedInMap.set(x, new Set());
        usedInMap.get(x).add(out);
      }
    };
    for (const r of RECIPES) for (const [ing] of r.in) add(ing, r.out[0]);
    for (const K of Object.values(STATION_KINDS)) for (const r of Array.isArray(K.recipes) ? K.recipes : []) for (const [ing] of r.in ?? []) if (r.out) add(ing, r.out[0]);
  }
  return [...(usedInMap.get(id) ?? [])].filter((o) => o !== id);
}

// ---------- splitting a stack ----------
// Right-click a slot (or tap it with two fingers) for a little menu: split off half, one, or any number,
// into an empty slot (in the same chest or backpack first).
let splitting = null, noClickUntil = 0;
function splitOn(el, what) {
  el.addEventListener('contextmenu', (e) => { e.preventDefault(); openSplit(el, what()); });
  el.addEventListener('touchstart', (e) => {
    if (e.touches.length !== 2) return;
    e.preventDefault();
    // the slot under the first finger (or this one)
    const t = e.touches[0], under = document.elementFromPoint(t.clientX, t.clientY)?.closest('.slot');
    if (under && under !== el) under.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true }));
    else openSplit(el, what());
  }, { passive: false });
}
// a two-finger tap can let a click through as the fingers come up: swallow it
document.addEventListener('click', (e) => { if (performance.now() < noClickUntil && !e.target.closest('#split-menu')) { e.stopPropagation(); e.preventDefault(); } }, true);
function openSplit(el, w) {
  const s = w?.slot.get();
  if (!s) return;
  if (s.count < 2) { toast('There\'s only one of those'); return; }
  splitting = w;
  noClickUntil = performance.now() + 500;
  $('inv-tip').classList.remove('show');
  $('split-title').textContent = `${itemName(s.id)} × ${s.count}`;
  const range = $('split-range');
  range.max = s.count - 1;
  range.value = Math.floor(s.count / 2);
  $('split-n').textContent = range.value;
  const menu = $('split-menu');
  menu.classList.remove('hidden');
  const r = el.getBoundingClientRect(), mw = menu.offsetWidth, mh = menu.offsetHeight;
  menu.style.left = Math.max(4, Math.min(window.innerWidth - mw - 4, r.left + r.width / 2 - mw / 2)) + 'px';
  menu.style.top = Math.max(4, r.bottom + 6 + mh > window.innerHeight ? r.top - mh - 6 : r.bottom + 6) + 'px';
}
function closeSplit() { splitting = null; $('split-menu').classList.add('hidden'); }
function doSplit(n) {
  const w = splitting;
  closeSplit();
  const s = w?.slot.get();
  if (!s || s.count < 2) return;
  n = Math.max(1, Math.min(s.count - 1, Math.floor(n)));
  for (const slots of w.room) {
    // the next empty slot after this one (wrapping round), if it's in the same place
    const from = slots === w.list ? w.i : -1;
    let j = -1;
    for (let k = 1; k <= slots.length && j < 0; k++) { const c = (from + k + slots.length) % slots.length; if (!slots[c]) j = c; }
    if (j < 0) continue;
    slots[j] = { ...s, count: n };
    s.count -= n;
    sound.pop();
    w.done();
    return;
  }
  toast('There\'s no empty slot to split it into');
}
$('split-range').addEventListener('input', (e) => { $('split-n').textContent = e.target.value; });
$('btn-split-half').addEventListener('click', () => doSplit(Math.floor((splitting?.slot.get()?.count ?? 0) / 2)));
$('btn-split-one').addEventListener('click', () => doSplit(1));
$('btn-split-go').addEventListener('click', () => doSplit(+$('split-range').value));
$('btn-split-cancel').addEventListener('click', closeSplit);
document.addEventListener('pointerdown', (e) => { if (splitting && !e.target.closest('#split-menu')) closeSplit(); }, true);

// ---------- actions ----------
// (v35) Swat a bat flitting in front of you (nearer than whatever block you're looking at).
function swatBat() {
  if (!critters.bats.length) return false;
  const reach = Math.min(REACH, target?.t ?? REACH, targetMob?.t ?? REACH);
  if (!critters.swatBat(player.eye, player.lookDir(), reach)) return false;
  sound.mob?.('bat', 1);
  achieve('bat');
  return true;
}
// Guano falls where a bat was (a swatted bat drops a bit more).
critters.onGuano = (pos, swatted) => loose.spawn({ id: GUANO, count: swatted ? 1 + Math.floor(Math.random() * 2) : 1 }, pos, { x: 0, y: swatted ? 1 : 0, z: 0 }, swatted ? 0.3 : 0);
// Tap the animal under the crosshair with whatever is in hand: milk a yak, pluck a duck,
// shear an alpaca, fill a bucket with newt slime, or just bump it.
function hitMob() {
  if (!targetMob) return;
  if (targetMob.mob.spec.hostile) {
    // fight a night creature: damage depends on what's in your hand
    const now = performance.now();
    if (now - lastSwing < (isSword(inventory.heldId()) ? 300 : 450)) return; // swords swing quicker
    lastSwing = now;
    swingArm();
    const held = inventory.held(), m = targetMob.mob;
    const dmg = (WEAPON_DAMAGE[inventory.heldId()] ?? ITEMS[inventory.heldId()]?.tool?.damage ?? 2) + (hasEnch(held, 'keen') ? 3 : 0);
    if (hasEnch(held, 'flame') && !m.spec.burns) m.burning = 4;
    giveDrops(mobs.hurt(m, dmg, player.pos));
    wearOutHeld(1);
    return;
  }
  // (v34) a sword or an axe butchers a pig or a chicken; nothing harms the other animals
  const heldTool = ITEMS[inventory.heldId()]?.tool?.type;
  if (targetMob.mob.spec.livestock && (heldTool === 'sword' || heldTool === 'axe')) {
    const now = performance.now();
    if (now - lastSwing < (heldTool === 'sword' ? 300 : 450)) return;
    lastSwing = now;
    const r = mobs.butcher(targetMob.mob, ITEMS[inventory.heldId()].tool.damage ?? 4, player.pos);
    if (r.why) { toast(r.why[0].toUpperCase() + r.why.slice(1), 1500); return; }
    if (r.drops.length) { giveDrops(r.drops); achieve('butcher'); }
    wearOutHeld(1);
    return;
  }
  const wasTame = targetMob.mob.tame;
  const r = mobs.interact(targetMob.mob, player.pos, inventory.heldId());
  if (!wasTame && targetMob.mob.tame) achieve('tame');
  if (r.trade) { openTrade(targetMob.mob); return; }
  if (r.ride) { mountMob(targetMob.mob); return; }
  for (const [id, n] of r.take) inventory.remove(id, n);
  for (const [id, n] of r.give) {
    if (inventory.add(id, n) > 0) toast('Inventory full: dropped at your feet');
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

// (v35) A bandage heals 4 hearts and cures food poisoning.
function useBandage() {
  if (health >= MAX_HEALTH && !poisoned) { toast('You don\'t need a bandage', 1500); return; }
  inventory.consumeHeld();
  health = Math.min(MAX_HEALTH, health + 8);
  poisoned = 0;
  sound.pop();
  toast('You bandage yourself up', 1500);
  renderHealth();
}
function eat(id) {
  viewmodel.eat();
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
  if (ITEMS[id]?.risky && Math.random() < ITEMS[id].risky) { poisoned = Math.max(poisoned, 15); toast('Ugh! That wasn\'t cooked: you have food poisoning.', 2500); renderHealth(); } // (v34: raw chicken)
  if (foodValue(id) >= 6) {
    const was = effects.fed > 0;
    effects.fed = Math.max(effects.fed, foodValue(id) * 20); // a hearty meal keeps you going: the better the meal, the longer
    if (!was) toast(`${ITEMS[id]?.bottle ? "Drank" : "Ate"} ${itemName(id).toLowerCase()}: you feel well fed`, 1600);
    achieve('eat');
  }
  const meal = ITEMS[id]?.meal;
  if (meal) {
    // a good meal does you good for a while
    effects[meal[0]] = Math.max(effects[meal[0]], meal[1]);
    if (meal[0] === 'heal') { poisoned = 0; renderHealth(); }
    if (meal[0] === 'warm') ailments.chill = 0;
    if (meal[0] === 'cool') ailments.heat = 0;
    toast(`${itemName(id)}: you ${ITEMS[id].about}`, 1800);
  }
  if (ITEMS[id]?.bottle && inventory.add(GLASS_BOTTLE, 1)) toast('Inventory full: dropped at your feet');
  if (ITEMS[id]?.honey) { inventory.add(GLASS_BOTTLE, 1); health = Math.min(MAX_HEALTH, health + 2); renderHealth(); }
  if (id === PUFFERFISH) { poisoned = Math.max(poisoned, 15); toast('Ugh! The pufferfish was poisonous.', 2500); renderHealth(); }
  sound.eat();
  toast(`${ITEMS[id]?.bottle ? "Drank" : "Ate"} ${itemName(id).toLowerCase()}`, 1000);
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
  world.setBlock(x, by, z, doorId(d.facing, !d.open, false, d.doorBase));
  if (isDoor(world.get(x, by + 1, z))) world.setBlock(x, by + 1, z, doorId(d.facing, !d.open, true, d.doorBase));
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
const canSleepNow = () => sky.time > 0.46 || weather.raining;
function useBed(x, y, z) {
  bedSpawn = { x, y, z };
  if (!canSleepNow()) { toast('Respawn point set. You can only sleep in the evening, at night or through a storm.', 2500); return; }
  const lurking = mobs.mobs.some((m) => m.spec.hostile && !m.dying &&
    Math.hypot(m.pos.x - player.pos.x, m.pos.z - player.pos.z) < 12 && Math.abs(m.pos.y - player.pos.y) < 6);
  if (lurking) { toast('You can\'t sleep now: something is lurking nearby', 2500); return; }
  if (sky.time <= 0.46) { napThroughStorm(); return; }
  if (weather.raining) weather.set(false); // the storm blows over in the night
  sleepUntilMorning();
}
// Sleeping through a storm in the daytime: you nap a few hours and wake to clear skies.
async function napThroughStorm() {
  paused = true;
  controls.reset();
  $('sleep').classList.add('show');
  await new Promise((r) => setTimeout(r, 1000));
  const skip = Math.min(0.12, 0.46 - sky.time);
  sky.time += skip;
  weather.set(false);
  if (net.isHost) sendClock('slept');
  const secs = skip * DAY_LENGTH;
  stations.tick(secs, world, setStationLit, powerAt, boostAt, crafterRecipe);
  apiculture.tick(secs, stations, world, beeEnv);
  tickLamps(secs);
  for (let i = 0, n = Math.max(1, Math.ceil(secs / 60)); i < n; i++) world.tickPlants(secs / n);
  hunger = Math.max(0, hunger - 1);
  renderHunger();
  await new Promise((r) => setTimeout(r, 300));
  $('sleep').classList.remove('show');
  sound.wake();
  toast('You nap until the storm blows over', 2500);
  paused = false;
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
  if (net.isHost) sendClock('slept');
  stations.tick(skipped, world, setStationLit, powerAt, boostAt, crafterRecipe);
  apiculture.tick(skipped, stations, world, nightEnv); // (night bees work while you sleep)
  tickLamps(skipped);
  const steps = Math.max(1, Math.ceil(skipped / 60)); // (a minute at a time, so plants grow as they would have)
  for (let i = 0; i < steps; i++) world.tickPlants(skipped / steps);
  hunger = Math.max(0, hunger - 3); // a night's sleep makes you a bit peckish
  achieve('sleep');
  renderHunger();
  saveGame();
  await new Promise((r) => setTimeout(r, 400));
  $('sleep').classList.remove('show');
  sound.wake();
  toast(`Good morning! Day ${day}`, 2500);
  paused = false;
}

// A tool a recipe needs but doesn't use up (the mortar and pestle) wears by one each time: the most worn one
// you carry, so a spare stays fresh. If the one in your hand breaks, the next moves in.
function wearTool(id) {
  if (creative || !settings.wear || !maxWear(id)) return;
  let best = -1;
  inventory.slots.forEach((s, i) => { if (s?.id === id && (best < 0 || (s.wear ?? 0) > (inventory.slots[best].wear ?? 0))) best = i; });
  if (best < 0) return;
  const s = inventory.slots[best];
  s.wear = (s.wear ?? 0) + 1;
  if (s.wear >= maxWear(id)) {
    inventory.slots[best] = null;
    sound.breakBlock('stone');
    toast(`Your ${itemName(id).toLowerCase()} broke!`, 2000);
    if (best === inventory.selected) inventory.refill(id);
  }
  inventory.onChange();
}

// ---------- wear and repair ----------
// Tools, weapons, armour and shields wear a little with each use and break when worn out (unless wear
// is turned off in the menu). An anvil puts them right with a piece of what they're made of.
function wearOutHeld(n) {
  const s = inventory.held();
  if (creative || !settings.wear || !s || !maxWear(s.id)) return;
  if (hasEnch(s, 'sturdy') && Math.random() < 0.5) return;
  s.wear = (s.wear ?? 0) + n;
  if (s.wear >= maxWear(s.id)) {
    inventory.slots[inventory.selected] = null;
    sound.breakBlock('stone');
    toast(`Your ${itemName(s.id).toLowerCase()} broke!${inventory.refill(s.id) ? ' You take out another.' : ''}`, 2000);
  }
  inventory.onChange();
}
function wearArmour(k = -1, n = 1) {
  if (!settings.wear) return;
  for (let i = 0; i < 5; i++) {
    if (!armour[i] || !maxWear(armour[i]) || (k >= 0 ? i !== k : i === 4)) continue; // (a jetpack doesn't wear)
    if (armourEnch[i]?.includes('sturdy') && Math.random() < 0.5) continue;
    armourWear[i] += n;
    if (armourWear[i] >= maxWear(armour[i])) {
      toast(`Your ${itemName(armour[i]).toLowerCase()} fell apart!`, 2000);
      sound.breakBlock('stone');
      armour[i] = null; armourWear[i] = 0; armourEnch[i] = null;
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
// ---------- battery-powered things ----------
// A portable lamp, jackhammer or jetpack uses its own charge first, then tops itself up from a battery you're
// carrying (as much as it'll take), so spare batteries keep them going.
const JACK_DUST = 0.15; // the chance the jackhammer shakes a dust off an ore too
let chargeShown = 0; // seconds until the slots' charge bars are redrawn
function topUp(s) {
  for (const b of inventory.slots) {
    if (!s.wear) break;
    if (!b || b === s || b.id !== BATTERY || !chargeLeft(b)) continue;
    const k = Math.min(chargeLeft(b), s.wear);
    b.wear = (b.wear ?? 0) + k; s.wear -= k;
    if (s.wear <= 1e-9) delete s.wear;
    inventory.onChange();
  }
}
// Has it (or a battery you carry) any charge?
const hasCharge = (s) => creative || chargeLeft(s) > 1e-9 || inventory.slots.some((b) => b && b !== s && b.id === BATTERY && chargeLeft(b) > 1e-9);
// Use n charge from it; false if there isn't that much.
function drawCharge(s, n) {
  if (creative) return true;
  if (chargeLeft(s) < n) topUp(s);
  if (chargeLeft(s) < n) { if (s.wear !== chargeCap(s.id)) { s.wear = chargeCap(s.id); inventory.onChange(); } return false; }
  s.wear = (s.wear ?? 0) + n;
  return true;
}
// What's in hand, as far as digging goes: a flat jackhammer is no better than your bare hands.
function toolHeld() {
  const s = inventory.held();
  return s && chargeCap(s.id) && !hasCharge(s) ? 0 : s?.id ?? 0;
}
let nightSight = false; // wearing night-vision goggles with charge
const MAGNET_REACH = 8; // blocks a magnet ring pulls things from
function switchMagnet(s) {
  if (!s.on && !hasCharge(s)) { toast('The magnet ring is flat: charge it in a battery charger', 2000); return; }
  s.on = !s.on;
  sound.click();
  toast(s.on ? 'Magnet ring on: it pulls loose things to you' : 'Magnet ring off', 1500);
  inventory.onChange();
}

// Teleport pads: stand on a charged one for a moment and you're sent to its partner (and not straight back
// until you step off).
const PAD_WAIT = 0.8;
let padTime = 0, padArrived = '', padWarned = '';
function tickPads(dt) {
  const x = Math.floor(player.pos.x), y = Math.floor(player.pos.y + 0.01), z = Math.floor(player.pos.z), k = `${x},${y},${z}`;
  if (!BLOCKS[world.get(x, y, z)]?.pad || !player.onGround || riding || ridingMob || boarded) { padTime = 0; padArrived = ''; padWarned = ''; return; }
  if (k === padArrived) return;
  if ((padTime += dt) < PAD_WAIT) return;
  const to = machines.padPartner(x, y, z);
  const warn = (msg) => { if (padWarned !== k) { padWarned = k; toast(msg, 2500); } };
  if (!to) { warn('This teleport pad isn\'t paired: put down another one'); return; }
  const [px, py, pz] = to;
  if (!world.chunkAt(px, pz) || !BLOCKS[world.get(px, py, pz)]?.pad) { warn('The other pad is too far away (its part of the world isn\'t loaded)'); return; }
  if (world.isSolid(px, py + 1, pz) || world.isSolid(px, py + 2, pz)) { warn('There\'s no room to stand on the other pad'); return; }
  if (!electric.drawPad(x, y, z, PAD_PLAYER)) { warn(`The pad needs charging: ${Math.round(electric.padCharge(x, y, z) * 100)}%`); return; }
  player.pos.set(px + 0.5, py + 0.13, pz + 0.5);
  player.vel.set(0, 0, 0);
  fallTop = null;
  padArrived = `${px},${py},${pz}`; padTime = 0;
  sound.ding();
  toast('Whoosh!', 1000);
}

// A low hum from the machines turning and the electricity flowing near you.
let humTimer = 0;
function tickHum(dt) {
  if ((humTimer -= dt) > 0) return;
  humTimer = 0.5;
  const p = player.pos, R = 14;
  const near = (n) => Math.abs(n.x + 0.5 - p.x) < R && Math.abs(n.y + 0.5 - p.y) < R && Math.abs(n.z + 0.5 - p.z) < R;
  let mech = 0, elec = 0;
  for (const n of kinetics.nodes.values()) if (n.speed && near(n)) mech += n.part === 'machine' ? 1 : 0.3;
  for (const n of electric.nodes.values()) {
    if (!near(n)) continue;
    if (n.role === 'gen' && n.made > 0) elec += 1;
    else if (n.role === 'use' && n.want && electric.nets[n.net]?.share > 0) elec += 1;
  }
  sound.hum(paused || dead ? 0 : Math.min(1, mech / 8), paused || dead ? 0 : Math.min(1, elec / 6));
}

// v38: each working machine near you makes its own sound now and then (a saw rasps, a cauldron bubbles, an
// auto-crafter clacks), and items whoosh along logistics pipes.
const machineNext = new Map();
let machineTimer = 0, pipeNext = 0;
function tickMachineSounds(dt) {
  if ((machineTimer -= dt) > 0 || paused || dead) return;
  machineTimer = 0.25;
  const p = player.pos, R = 12, now = performance.now() / 1000;
  const heard = [];
  for (const [k, st] of stations.map) {
    const [x, y, z] = k.split(',').map(Number);
    const d = Math.hypot(x + 0.5 - p.x, y + 0.5 - p.y, z + 0.5 - p.z);
    if (d > R) continue;
    const K = STATION_KINDS[st.kind];
    if (!K || !(st.progress > 0)) continue;
    const working = K.powered ? (K.passive || st.speed > 0) : K.crafter || st.cooking || K.nofuel;
    if (working) heard.push([k, st.kind, d]);
  }
  heard.sort((a, b) => a[2] - b[2]);
  for (const [k, kind, d] of heard.slice(0, 4)) {
    if ((machineNext.get(k) ?? 0) > now) continue;
    machineNext.set(k, now + 0.8 + Math.random() * 1.4);
    sound.machine(kind, (1 - d / R) ** 1.5);
  }
  if (machineNext.size > 200) for (const [k, t] of machineNext) if (t < now) machineNext.delete(k);
  if (now > pipeNext) {
    let best = R;
    for (const t of logistics.transits) {
      const a = t.path?.[t.j ?? 0];
      if (a) best = Math.min(best, Math.hypot(a[0] + 0.5 - p.x, a[1] + 0.5 - p.y, a[2] + 0.5 - p.z));
    }
    if (best < R) { sound.pipe((1 - best / R) ** 1.5); pipeNext = now + 0.5 + Math.random() * 0.8; }
  }
}

// v38: the water surface (y) at or just around (x, y, z), or null if there's no water there.
function waterSurfaceAt(x, y, z) {
  const fx = Math.floor(x), fz = Math.floor(z), by = Math.floor(y);
  for (const dy of [0, -1, 1]) {
    let wy = by + dy;
    if (!world.isWater(fx, wy, fz)) continue;
    for (let i = 0; i < 6 && world.isWater(fx, wy + 1, fz); i++) wy++;
    return wy + 0.875;
  }
  return null;
}
// v38: rings on the water around anything swimming or floating near you, wakes behind boats, and now and
// then a duck has a splash about.
const rippleTimers = new WeakMap();
function tickRipples(dt) {
  if (paused) return;
  const p = player.pos, R = 40;
  const due = (o, every) => {
    const t = (rippleTimers.get(o) ?? Math.random() * every) - dt;
    if (t > 0) { rippleTimers.set(o, t); return false; }
    rippleTimers.set(o, every * (0.8 + Math.random() * 0.4));
    return true;
  };
  for (const m of mobs.mobs) {
    if (!m.inWater || m.dead || Math.abs(m.pos.x - p.x) > R || Math.abs(m.pos.z - p.z) > R) continue;
    const sy = waterSurfaceAt(m.pos.x, m.pos.y + 0.3, m.pos.z);
    if (sy === null) continue;
    const speed = Math.hypot(m.vel.x, m.vel.z), small = m.kind === 'duck' || m.kind === 'newt';
    const size = small ? 0.55 : 1.1;
    if (due(m, speed > 0.3 ? 0.35 : 1.8)) {
      ripples.ring(m.pos.x, sy, m.pos.z, size * (speed > 0.3 ? 1 : 0.7), speed > 0.3 ? 0.7 : 0.4, speed > 0.3 ? 1.4 : 2);
      // a little V behind a duck paddling along
      if (speed > 0.3) { const a = Math.atan2(m.vel.x, m.vel.z); ripples.ring(m.pos.x - Math.sin(a) * 0.3, sy, m.pos.z - Math.cos(a) * 0.3, size * 0.8, 0.5, 1.2, 1.8, a); }
    }
    if (m.kind === 'duck' && Math.random() < dt / 14) {
      ripples.splash(m.pos.x, sy, m.pos.z, 12, 0.55);
      if (Math.hypot(m.pos.x - p.x, m.pos.z - p.z) < 14) sound.splash(false);
    }
  }
  for (const v of vehicles.list) {
    if (v.kind !== 'boat' || Math.abs(v.pos.x - p.x) > R || Math.abs(v.pos.z - p.z) > R) continue;
    const sy = waterSurfaceAt(v.pos.x, v.pos.y, v.pos.z);
    if (sy === null) continue;
    const sp = Math.abs(v.speed ?? 0);
    if (sp > 0.6) {
      if (!due(v, Math.max(0.07, 0.3 - sp * 0.03))) continue;
      const fx = -Math.sin(v.yaw), fz = -Math.cos(v.yaw), sx = -fz, sz = fx, back = Math.sign(v.speed || 1);
      for (const side of [-1, 1]) {
        ripples.ring(v.pos.x - fx * 0.9 * back + sx * 0.45 * side, sy, v.pos.z - fz * 0.9 * back + sz * 0.45 * side, 0.7 + sp * 0.05, Math.min(0.9, 0.4 + sp * 0.06), 1.8, 1.6, v.yaw);
      }
      if (sp > 4 && Math.random() < 0.4) ripples.splash(v.pos.x + fx * 1.0 * back, sy, v.pos.z + fz * 1.0 * back, 3, 0.4);
    } else if (due(v, 2.2)) ripples.ring(v.pos.x, sy, v.pos.z, 1.3, 0.35, 2.2);
  }
  if (player.inWater && !boarded && !dead) {
    const sy = waterSurfaceAt(p.x, p.y + 0.5, p.z);
    if (sy !== null && sy - p.y < 1.9 && sy - p.y > 0) {
      const speed = Math.hypot(player.vel.x, player.vel.z);
      if (due(player, speed > 0.5 ? 0.3 : 1.5)) ripples.ring(p.x, sy, p.z, speed > 0.5 ? 1 : 0.8, speed > 0.5 ? 0.7 : 0.45, 1.6);
    }
  }
  ripples.update(dt, camera.position);
}

// A wireless charger tops up what you carry (things in your inventory first, then what you're wearing) while
// you're within WIRELESS_REACH of it. Returns whether anything needed charge; with amount 0 it only looks.
function wirelessCharge(n, amount) {
  if (dead || Math.hypot(player.pos.x - n.x - 0.5, player.pos.y + 0.9 - n.y - 0.5, player.pos.z - n.z - 0.5) > WIRELESS_REACH) return false;
  for (const s of inventory.slots) {
    if (!s || !chargeCap(s.id) || !(s.wear > 0)) continue;
    if (amount > 0) { s.wear = Math.max(0, s.wear - amount); if (s.wear <= 1e-9) { delete s.wear; inventory.onChange(); } else if ((chargeShown -= 1 / 60) <= 0) { chargeShown = 1; inventory.onChange(); } }
    return true;
  }
  for (let i = 0; i < armour.length; i++) {
    if (!armour[i] || !chargeCap(armour[i]) || !(armourWear[i] > 0)) continue;
    if (amount > 0) armourWear[i] = Math.max(0, armourWear[i] - amount);
    return true;
  }
  return false;
}

// Lifts: stand on one and jump to ride up to the next lift above in the same column (or sneak to go down to
// the next one below), while it has power. You pass up or down through anything between.
const LIFT_SPEED = 9;
let lift = null; // { from: "x,y,z", x, z, toY }
let liftWarned = '';
function tickLift(dt) {
  if (lift) {
    const goal = lift.toY + 1, dy = goal - player.pos.y, step = LIFT_SPEED * dt;
    player.pos.x += (lift.x + 0.5 - player.pos.x) * Math.min(1, dt * 8);
    player.pos.z += (lift.z + 0.5 - player.pos.z) * Math.min(1, dt * 8);
    player.vel.set(0, 0, 0);
    fallTop = null;
    if (Math.abs(dy) <= step) { player.pos.y = goal; player.onGround = true; lift = null; sound.ding(); electric.timer = 0; }
    else player.pos.y += Math.sign(dy) * step;
    return true;
  }
  const dir = controls.jump ? 1 : controls.down ? -1 : 0;
  if (!dir) { liftWarned = ''; return false; }
  if (!player.onGround || riding || ridingMob || boarded || player.flying) return false;
  const x = Math.floor(player.pos.x), y = Math.floor(player.pos.y - 0.05), z = Math.floor(player.pos.z), k = `${x},${y},${z}`;
  if (!BLOCKS[world.get(x, y, z)]?.lift) return false;
  const warn = (msg) => { if (liftWarned !== k + dir) { liftWarned = k + dir; toast(msg, 2200); } };
  let to = null;
  for (let ty = y + dir; Math.abs(ty - y) <= LIFT_REACH && ty >= 0 && ty < H - 2; ty += dir) {
    if (BLOCKS[world.get(x, ty, z)]?.lift && !world.isSolid(x, ty + 1, z) && !world.isSolid(x, ty + 2, z)) { to = ty; break; }
  }
  if (to === null) { warn(dir > 0 ? 'There\'s no lift above this one to go up to' : 'There\'s no lift below this one to go down to'); return dir < 0; }
  if (!(electric.speedAt(x, y, z) > 0)) { warn(`The lift has no power. ${electric.statusAt(x, y, z)}`); return dir < 0; }
  lift = { from: k, x, z, toY: to };
  electric.timer = 0;
  sound.click();
  return true;
}

// The grappling hook: tap to throw it at what you're looking at (up to GRAPPLE_REACH away); it catches on the
// first solid block and pulls you there, and you hang on it. Jump to climb up off it (onto a ledge), sneak
// (or tap again) to let go.
const GRAPPLE_REACH = 24, GRAPPLE_SPEED = 15;
let grapple = null; // { x, y, z, t, stuck, hang, line }
function throwGrapple() {
  const eye = player.eye, d = player.lookDir();
  let hit = null;
  for (let t = 0.6; t <= GRAPPLE_REACH; t += 0.1) {
    const x = eye.x + d.x * t, y = eye.y + d.y * t, z = eye.z + d.z * t;
    if (world.isSolid(Math.floor(x), Math.floor(y), Math.floor(z))) { hit = { x: eye.x + d.x * (t - 0.3), y: eye.y + d.y * (t - 0.3), z: eye.z + d.z * (t - 0.3), cell: [Math.floor(x), Math.floor(y), Math.floor(z)] }; break; }
  }
  if (!hit) { toast('The hook found nothing to catch on', 1200); sound.click(); return; }
  releaseGrapple();
  const geo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
  const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0xd8c8a0 }));
  line.frustumCulled = false;
  scene.add(line);
  grapple = { ...hit, t: 0, stuck: 0, line };
  sound.bow?.(0.6);
  wearOutHeld(1);
}
function releaseGrapple() {
  if (!grapple) return;
  scene.remove(grapple.line); grapple.line.geometry.dispose(); grapple.line.material.dispose();
  grapple = null;
}
function tickGrapple(dt) {
  if (!grapple) return false;
  const g = grapple;
  g.t += dt;
  const to = new THREE.Vector3(g.x - player.pos.x, g.y - (player.pos.y + 0.9), g.z - player.pos.z), dist = to.length();
  if (g.vault) {
    // climbing up onto the ledge: up first, then across onto it
    const v = g.vault;
    v.t = Math.min(1, v.t + dt / 0.45);
    const up = Math.min(1, v.t * 2), across = Math.max(0, v.t * 2 - 1);
    player.pos.set(v.from.x + (v.to.x - v.from.x) * across, v.from.y + (v.to.y - v.from.y) * up, v.from.z + (v.to.z - v.from.z) * across);
    player.vel.set(0, 0, 0);
    fallTop = null;
    if (v.t >= 1) { player.onGround = true; releaseGrapple(); }
    return true;
  }
  if (controls.down || riding || ridingMob || boarded || zipping || dead || (!g.hang && g.t > 3)) { releaseGrapple(); return false; }
  if (g.hang && controls.jump && g.t > 0.3) {
    // climb up off the rope: onto the top of the block it's caught on if there's room there, or a hop
    const [cx, cy, cz] = g.cell;
    let ty = cy;
    while (ty < cy + 3 && world.isSolid(cx, ty, cz)) ty++;
    if (!world.isSolid(cx, ty, cz) && !world.isSolid(cx, ty + 1, cz) && ty - player.pos.y <= 3.2) {
      g.vault = { from: player.pos.clone(), to: new THREE.Vector3(cx + 0.5, ty, cz + 0.5), t: 0 };
      return true;
    }
    player.vel.y = 7.5;
    releaseGrapple();
    return false;
  }
  if (dist < 1.2 || g.stuck > 0.2) g.hang = true;
  if (g.hang) player.vel.set(0, 0, 0);
  else {
    const moved = player.pulled(dt, to.multiplyScalar(GRAPPLE_SPEED / dist));
    g.stuck = moved < GRAPPLE_SPEED * dt * 0.2 ? g.stuck + dt : 0;
  }
  fallTop = null;
  const pos = g.line.geometry.attributes.position;
  pos.setXYZ(0, player.pos.x, player.pos.y + 1.1, player.pos.z); pos.setXYZ(1, g.x, g.y, g.z); pos.needsUpdate = true;
  return true;
}

// A reactor that got too hot: it blows up (a much bigger blast than a blasting charge) and leaves its molten
// core behind as lava.
function meltdown(x, y, z) {
  stations.map.delete(`${x},${y},${z}`);
  if (openStationAt && openStationAt.x === x && openStationAt.y === y && openStationAt.z === z && !openStationAt.cart) closeStation();
  explode(x, y, z, 5.5, 'You were too close to a reactor when it melted down.');
  world.setBlock(x, y, z, LAVA);
  for (let i = 0; i < 8; i++) {
    const lx = x + Math.round((Math.random() - 0.5) * 6), lz = z + Math.round((Math.random() - 0.5) * 6);
    for (let ly = y + 1; ly > y - 6; ly--) if (world.get(lx, ly, lz) === AIR && world.isSolid(lx, ly - 1, lz)) { world.setBlock(lx, ly, lz, LAVA); break; }
  }
  if (Math.hypot(x - player.pos.x, z - player.pos.z) < 80) toast('A reactor has melted down!', 4000);
}

// The spanner: tap a machine to turn it round (the next way it can face, or its axle onto the next axis);
// hold on one to take it up with whatever's inside it.
const SPANNER_TIME = 0.4;
const spannerable = (d) => !!d && !d.spawner && !d.rail && !d.liquid && !(d.switch && !d.sensor && !d.logic) &&
  !!(d.station || d.machine || d.kinetic || d.hopper || d.belt || d.farm || d.electric || d.sensor || d.ejector || d.quarry || d.counter || d.engine || d.tank || d.logic || d.elevator || d.harvester || d.pad);
function spannerTurn(x, y, z) {
  const id = world.get(x, y, z), d = BLOCKS[id];
  if (!spannerable(d)) return false;
  const root = d.variantOf || id;
  let next = 0;
  for (let i = root; i < root + 48 && !next; i++) {
    const e = BLOCKS[i];
    if (!e || (i !== root && e.variantOf !== root) || e.name !== d.name) continue;
    if (e.facing === (d.facing + 1) % 4 && e.on === d.on && e.lit === d.lit && e.down === d.down && e.open === d.open && e.water === d.water) next = i;
  }
  if (!next && d.kinetic && d.kinetic.axis >= 0) {
    for (let a = 1; a < 3 && !next; a++) {
      const k = kineticId(d.kinetic.part, d.kinetic.mat, (d.kinetic.axis + a) % 3);
      if (BLOCKS[k]?.kinetic && k !== id) next = k;
    }
  }
  if (!next) { toast(`The ${d.name.toLowerCase()} only goes one way round`, 1500); return true; }
  world.setBlock(x, y, z, next);
  logic.near(world, x, y, z);
  signalChanged(x, y, z);
  sound.place('stone');
  return true;
}
let spannerPack = -1; // while a machine is being taken up with the spanner: the pack its contents went in (0: none)
function spannerTake(x, y, z) {
  const id = world.get(x, y, z), k = `${x},${y},${z}`, kind = stationKind(id);
  let content = null;
  const st = kind && stations.map.get(k);
  if (st && ([...st.inputs, st.fuel, st.out, ...(st.side ?? [])].some(Boolean) || upgradeStacks(st).length)) {
    content = { kind, inputs: [...st.inputs, ...(st.side ?? [])].map((s) => (s ? { ...s } : null)), fuel: st.fuel && { ...st.fuel }, out: st.out && { ...st.out }, ...(st.up ? { up: { ...st.up } } : {}) };
    st.inputs.fill(null); st.fuel = null; st.out = null; st.side?.fill(null); delete st.up;
  }
  const charge = electric.store.get(k);
  if (charge > 0) { (content ??= {}).charge = charge; electric.store.delete(k); }
  if (openStationAt && !openStationAt.cart && openStationAt.x === x && openStationAt.y === y && openStationAt.z === z) closeStation();
  spannerPack = content ? newPack(content) : 0;
  try { breakBlock(x, y, z); } finally { spannerPack = -1; }
}
// Put back what was inside a machine taken up with the spanner, now it's been set down at (x, y, z).
function unpack(x, y, z, pid) {
  const c = packs.get(pid);
  packs.delete(pid);
  if (!c) return;
  const spill = [];
  if (c.kind) {
    const kind = stationKind(world.get(x, y, z));
    if (kind) {
      const st = stations.get(x, y, z, kind);
      c.inputs.forEach((s, i) => { if (!s) return; if (i < st.inputs.length && !st.inputs[i]) st.inputs[i] = s; else spill.push(s); });
      if (c.fuel) { if (!st.fuel) st.fuel = c.fuel; else spill.push(c.fuel); }
      if (c.out) { if (!st.out) st.out = c.out; else spill.push(c.out); }
      if (c.up) st.up = { ...c.up };
    } else spill.push(...c.inputs.filter(Boolean), c.fuel, c.out, ...upgradeStacks(c));
  }
  if (c.charge > 0) electric.store.set(`${x},${y},${z}`, c.charge);
  loose.spill(spill.filter(Boolean), x, y, z);
}

// Open a backpack in hand: like a chest you carry about.
// ---------- the journal ----------
// A book to write in: what's written is kept with the journal itself (in packs, like a backpack's contents).
let journalOpen = null;
function openJournal(s) {
  if (!(s.pack > 0) || !packs.has(s.pack)) { s.pack = newPack({ note: '' }); inventory.onChange(); }
  journalOpen = s;
  paused = true;
  controls.reset();
  document.exitPointerLock?.();
  $('journal-text').value = packs.get(s.pack).note ?? '';
  $('journal').classList.remove('hidden');
  setTimeout(() => $('journal-text').focus(), 50);
}
function closeJournal() {
  if (!journalOpen) return;
  const p = packs.get(journalOpen.pack);
  if (p) p.note = $('journal-text').value.slice(0, 4000);
  journalOpen = null;
  $('journal-text').blur();
  $('journal').classList.add('hidden');
  paused = false;
  saveGame();
}
$('btn-journal-done').addEventListener('click', closeJournal);
$('btn-journal-here').addEventListener('click', () => {
  const t = $('journal-text'), p = player.pos;
  const line = `Day ${day}: ${Math.floor(p.x)}, ${Math.floor(p.y)}, ${Math.floor(p.z)} - `;
  t.value = (t.value && !t.value.endsWith('\n') ? t.value + '\n' : t.value) + line;
  t.focus();
  t.selectionStart = t.selectionEnd = t.value.length;
});

// ---------- fertiliser ----------
// Tap a crop or a sapling with it to grow it a step (a sapling into a tree; sugar cane a block taller).
function fertilise(x, y, z) {
  const id = world.get(x, y, z), grows = BLOCKS[id]?.grows;
  // fertiliser on soil (or on a crop growing in it) freshens worn-out ground
  const soilY = [GRASS, DIRT].includes(id) ? y : y - 1;
  const freshened = world.restSoil(x, soilY, z);
  if (freshened && (soilY === y || !grows)) { toast('The soil is fresh again', 1500); sound.place('grass'); return true; }
  if (grows === 'pumpkin') {
    if (!world.growPumpkin(x, y, z)) { toast('A pumpkin vine needs open grass or dirt beside it, and no pumpkin there already', 2000); return false; }
    sound.place('grass'); return true;
  }
  if (!grows || grows === 'fill' || grows === 'honey') { toast('Fertiliser helps crops and saplings grow', 1500); return false; }
  if (grows === 'tree') world.growTree(x, y, z);
  else if (grows === 'up') {
    let top = y;
    while (world.get(x, top + 1, z) === SUGAR_CANE) top++;
    if (top - y >= 2 || world.get(x, top + 1, z) !== AIR) { toast('That sugar cane is as tall as it grows', 1500); return false; }
    world.setBlock(x, top + 1, z, SUGAR_CANE);
  } else world.setBlock(x, y, z, grows);
  if (world.get(x, y, z) === id && grows === 'tree') { toast('There isn\'t room for that sapling to grow', 1500); return false; }
  sound.place('grass');
  return true;
}

function openBackpack(s) {
  const size = ITEMS[s.id].backpack;
  if (!(s.pack > 0) || !packs.get(s.pack)?.slots) s.pack = newPack({ slots: new Array(size).fill(null) });
  const c = packs.get(s.pack);
  while (c.slots.length < size) c.slots.push(null);
  sound.click();
  openStation(0, 0, 0, { store: { kind: 'chest', inputs: c.slots }, title: itemName(s.id), backpack: s });
}

function switchHandLamp(s) {
  if (!s.on && !hasCharge(s)) { toast('The portable lamp is flat: charge it in a battery charger', 2000); return; }
  s.on = !s.on;
  sound.click();
  toast(s.on ? 'Portable lamp on: it lights your way wherever you carry it' : 'Portable lamp off', 1500);
  inventory.onChange();
}
// Mending: worn things mend themselves a little at a time while you carry (or wear) them.
let mendClock = 0;
function tickMending(dt) {
  if ((mendClock += dt) < 5) return;
  mendClock = 0;
  let changed = false;
  for (const s of inventory.slots) if (s?.wear > 0 && hasEnch(s, 'mending')) { s.wear--; changed = true; }
  for (let k = 0; k < armour.length; k++) if (armourWear[k] > 0 && armourEnch[k]?.includes('mending')) { armourWear[k]--; changed = true; }
  if (changed) inventory.onChange();
}

function tickBatteryGear(dt) {
  tickMending(dt);
  tickRadiation(dt);
  tickZaps(dt);
  // the jetpack (worn in place of a chestplate) thrusts while you hold jump in the air
  const jet = armour[1] === JETPACK ? { id: JETPACK, ...(armourWear[1] ? { wear: armourWear[1] } : {}) } : null;
  if (jet && player.thrusting && !drawCharge(jet, CHARGE_USE.jetpack * dt)) toast('Your jetpack has run flat', 1500);
  if (jet) armourWear[1] = jet.wear ?? 0;
  player.jetpack = !!jet && hasCharge(jet);
  // a portable lamp that's switched on lights the way from anywhere in your inventory
  const lamp = inventory.slots.find((s) => s?.id === PORTABLE_LAMP && s.on);
  let shine = 0;
  if (lamp) {
    if (drawCharge(lamp, CHARGE_USE.lamp * dt)) shine = 0.95;
    else { lamp.on = false; toast('Your portable lamp has run flat', 2000); inventory.onChange(); }
  }
  lightUniforms.uHand.value.set(player.pos.x, player.pos.y + 1.4, player.pos.z, shine);
  // hover boots slow any fall (hold sneak to drop), while they have charge
  const boots = armour[3] === HOVER_BOOTS ? { id: HOVER_BOOTS, ...(armourWear[3] ? { wear: armourWear[3] } : {}) } : null;
  if (boots && player.hovering && !drawCharge(boots, CHARGE_USE.hover * dt)) toast('Your hover boots have run flat', 1500);
  if (boots) armourWear[3] = boots.wear ?? 0;
  player.hover = !!boots && hasCharge(boots);
  // night-vision goggles let you see in the dark, using a little charge all the time you wear them
  const goggles = armour[0] === NV_GOGGLES ? { id: NV_GOGGLES, ...(armourWear[0] ? { wear: armourWear[0] } : {}) } : null;
  nightSight = !!goggles && drawCharge(goggles, CHARGE_USE.goggles * dt);
  if (goggles) armourWear[0] = goggles.wear ?? 0;
  // a magnet ring that's switched on pulls loose things to you
  const ring = inventory.slots.find((s) => s?.id === MAGNET_RING && s.on);
  let pulling = false;
  if (ring) {
    for (const it of loose.items) {
      if (it.age < it.delay) continue;
      const dx = player.pos.x - it.pos.x, dy = player.pos.y + 0.8 - it.pos.y, dz = player.pos.z - it.pos.z, d = Math.hypot(dx, dy, dz);
      if (d > MAGNET_REACH || d < 0.3) continue;
      // drawn steadily toward you, hopping over anything low in the way
      it.vel.x = dx / d * 6; it.vel.z = dz / d * 6;
      if (it.ground || it.vel.y < -2) it.vel.y = Math.max(2.5, dy * 3);
      it.ground = false;
      pulling = true;
    }
    if (pulling && !drawCharge(ring, CHARGE_USE.magnet * dt)) { ring.on = false; toast('Your magnet ring has run flat', 2000); inventory.onChange(); }
  }
  // (redraw the charge bars now and then while things are using it)
  if ((jet && player.thrusting) || lamp || (boots && player.hovering) || goggles || pulling) { if ((chargeShown -= dt) <= 0) { chargeShown = 1; inventory.onChange(); } }
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
const effects = { night: 0, haste: 0, fire: 0, heal: 0, warm: 0, fed: 0, swift: 0, cool: 0 }; // seconds left of each
const EFFECT_ICONS = { night: '🌙', haste: '⛏', fire: '🔥', heal: '💚', warm: '🍯', fed: '🍗', swift: '🏃', cool: '🍦' };
function drinkTea(id) {
  const [kind, secs] = ITEMS[id].tea;
  effects[kind] = Math.max(effects[kind], secs);
  if (kind === 'heal') { poisoned = 0; ailments.chill = 0; ailments.heat = 0; renderHealth(); } // a healing tea cures what ails you
  if (kind === 'warm') ailments.chill = 0;
  inventory.consumeHeld();
  if (inventory.add(GLASS_BOTTLE, 1)) toast('Inventory full: dropped at your feet');
  sound.gulp();
  toast(`${itemName(id)}: you ${ITEMS[id].about}`, 2000);
}
function tickEffects(dt) {
  for (const k of Object.keys(effects)) effects[k] = Math.max(0, effects[k] - dt);
  if (effects.heal > 0 && health < MAX_HEALTH) { health = Math.min(MAX_HEALTH, health + dt * 1.2); renderHealth(); }
  lightUniforms.uAmbient.value = effects.night > 0 || nightSight ? 0.3 : AMBIENT;
}
const effectsText = () => [...Object.entries(effects).filter(([, t]) => t > 0)
  .map(([k, t]) => `${EFFECT_ICONS[k]} ${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`),
...(ailments.chill >= 1 ? ['🥶 chilled'] : ailments.chill > 0.5 ? ['🥶 cold'] : []), ...(ailments.heat >= 1 ? ['🥵 heatstroke'] : ailments.heat > 0.5 ? ['🥵 hot'] : [])].join('  ');

// ---------- ailments ----------
// The tundra (and temperate land in winter) is bitterly cold at night and in snow: out under the sky
// without warm clothes (three pieces of armour, or a Warmth enchantment), a fire or torch nearby, or a
// honey tea, you get chilled: slow, and slowly hurt. The desert sun at midday and its sandstorms give you
// heatstroke if your head is bare: you go hungry twice as fast, and it hurts. A healing tea cures both.
const ailments = { chill: 0, heat: 0 }; // 0..1 as they build up; 1 or more and you're suffering
const guarded = (what) => armour.some((id) => ITEMS[id]?.guards === what);
// A full hazmat suit: all four pieces.
const hazmatSuit = () => [0, 1, 2, 3].every((k) => armour[k] === hazmatId(k));

// ---------- radiation ----------
// Spent fuel rods give off radiation: carried, lying about, or kept in anything but a lead-lined chest. Each
// one within RADIATION_REACH (more the closer it is) adds to the dose you take; enough of it hurts.
let radDose = 0, radClock = 0, radLevel = 0, radWarned = false;
function radiationAt(p) {
  let level = 0;
  const near = (x, y, z, n) => { const d = Math.hypot(x - p.x, y - p.y - 1, z - p.z); if (d < RADIATION_REACH) level += n * (1 - d / RADIATION_REACH); };
  const count = (list) => (list ?? []).reduce((t, s) => t + (s?.id === SPENT_ROD ? s.count : s?.pack > 0 ? count(packs.get(s.pack)?.slots ?? packs.get(s.pack)?.inputs) : 0), 0);
  level += count(inventory.slots);
  for (const it of loose.items) if (it.stack.id === SPENT_ROD) near(it.pos.x, it.pos.y, it.pos.z, it.stack.count);
  for (const [k, st] of stations.map) {
    if (STATION_KINDS[st.kind]?.shielded) continue;
    const n = count(st.inputs) + count([st.out]);
    if (!n) continue;
    const [x, y, z] = k.split(',').map(Number);
    near(x + 0.5, y + 0.5, z + 0.5, n);
  }
  return level;
}
function tickRadiation(dt) {
  if (dead || creative) return;
  if ((radClock += dt) >= 0.5) { radClock = 0; radLevel = radiationAt(player.pos); }
  if (radLevel < 0.05) { radDose = Math.max(0, radDose - dt); return; }
  if (Math.random() < Math.min(0.9, radLevel * dt * 6)) sound.geiger();
  if (hazmatSuit()) return;
  if (!radWarned) { radWarned = true; toast('Your skin prickles: radiation from spent fuel rods! Shut them away in a lead-lined chest, or wear a hazmat suit.', 4000); }
  radDose += radLevel * dt;
  if (radDose >= 6) { radDose = 0; damage(1, 'You were poisoned by radiation.'); }
}

// ---------- tesla coils and electric fences ----------
const giveDropsAt = (drops, pos) => mobs.onWorldKill({ pos }, drops); // (what a creature drops, where it fell)
const isHostile = (m) => m.spec.hostile && !m.dying;
const teslaClock = new Map(); // "x,y,z" -> seconds until it can zap again
const bolts = []; // { line, t }
function teslaTarget(n) {
  let best = null, bd = TESLA_REACH;
  for (const m of mobs.mobs) {
    if (!isHostile(m)) continue;
    const d = Math.hypot(m.pos.x - n.x - 0.5, m.pos.y + 0.8 - n.y - 1, m.pos.z - n.z - 0.5);
    if (d < bd) { bd = d; best = m; }
  }
  return best;
}
function drawBolt(a, b) {
  const pts = [];
  for (let i = 0; i <= 8; i++) {
    const k = i / 8, j = i && i < 8 ? 0.35 : 0;
    pts.push(new THREE.Vector3(a.x + (b.x - a.x) * k + (Math.random() - 0.5) * j, a.y + (b.y - a.y) * k + (Math.random() - 0.5) * j, a.z + (b.z - a.z) * k + (Math.random() - 0.5) * j));
  }
  const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: 0xc8e8ff }));
  scene.add(line);
  bolts.push({ line, t: 0.18 });
}
function tickZaps(dt) {
  for (const b of [...bolts]) if ((b.t -= dt) <= 0) { scene.remove(b.line); b.line.geometry.dispose(); b.line.material.dispose(); bolts.splice(bolts.indexOf(b), 1); }
  for (const n of electric.nodes.values()) {
    if (!BLOCKS[n.id]?.tesla) continue;
    const k = `${n.x},${n.y},${n.z}`, t = (teslaClock.get(k) ?? 0) - dt;
    if (t > 0) { teslaClock.set(k, t); continue; }
    teslaClock.delete(k);
    const share = electric.speedAt(n.x, n.y, n.z);
    if (!(share > 0)) continue;
    const m = teslaTarget(n);
    if (!m) continue;
    teslaClock.set(k, 1 / Math.min(1, share)); // a zap a second with all the power it wants
    drawBolt({ x: n.x + 0.5, y: n.y + 1, z: n.z + 0.5 }, { x: m.pos.x, y: m.pos.y + 0.8, z: m.pos.z });
    if (player.pos.distanceTo(m.pos) < 40) sound.zap();
    giveDropsAt(mobs.hurt(m, TESLA_DAMAGE, { x: n.x + 0.5, z: n.z + 0.5 }), m.pos);
  }
  // electric fences: a shock for anything that touches a live one
  const live = (x, y, z) => world.get(x, y, z) === ELECTRIC_FENCE && electric.speedAt(x, y, z) > 0;
  const touching = (p, half, h) => {
    for (let y = Math.floor(p.y); y <= Math.floor(p.y + h); y++) for (let z = Math.floor(p.z - half - 0.2); z <= Math.floor(p.z + half + 0.2); z++) for (let x = Math.floor(p.x - half - 0.2); x <= Math.floor(p.x + half + 0.2); x++) if (live(x, y, z)) return [x + 0.5, z + 0.5];
    return null;
  };
  for (const m of mobs.mobs) {
    if (m.dying || m.tame || (m.shock = (m.shock ?? 0) - dt) > 0 || m.pos.distanceTo(player.pos) > 48) continue;
    const at = touching(m.pos, m.spec.w / 2, m.spec.h);
    if (!at) continue;
    m.shock = 1;
    if (isHostile(m)) giveDropsAt(mobs.hurt(m, 3, { x: at[0], z: at[1] }), m.pos); else if (!m.spec.trader && !m.spec.villager) mobs.bump(m, { x: at[0], z: at[1] });
    if (player.pos.distanceTo(m.pos) < 24) sound.zap(0.4);
  }
  if ((timers.fence = (timers.fence ?? 0) - dt) <= 0 && !creative) {
    const at = touching(player.pos, 0.3, 1.8);
    if (at) {
      timers.fence = 1;
      const dx = player.pos.x - at[0], dz = player.pos.z - at[1], len = Math.hypot(dx, dz) || 1;
      player.kx = dx / len * 7; player.kz = dz / len * 7;
      sound.zap(0.6);
      damage(1, 'You touched an electric fence.');
    }
  }
}
function tickAilments(dt) {
  if (dead) return;
  const x = Math.floor(player.pos.x), z = Math.floor(player.pos.z), head = Math.min(H - 1, Math.floor(player.eye.y));
  const biome = world.generator.biomeAt(x, z), outside = world.skyAt(x, head, z) >= 10;
  const coldLand = biome === 'tundra' || (biome === 'temperate' && seasonOf(day) === 3);
  const cold = coldLand && outside && (sky.light < 0.45 || (weather.raining && weather.level > 0.3));
  const warm = effects.warm > 0 || guarded('chill') || armourEnch.some((e) => e?.includes('warmth')) ||
    armour.slice(0, 4).filter(Boolean).length >= 3 || world.lightAt(x, head, z) >= 9 || ridingMob;
  ailments.chill = Math.max(0, ailments.chill + (cold && !warm ? dt / 45 : hearths.size && hearthNear() ? -dt / 3 : -dt / 12));
  const sun = sky.light > 0.95 && sky.time > 0.15 && sky.time < 0.35;
  const hot = biome === 'desert' && outside && (sun || (weather.raining && weather.level > 0.5));
  const shaded = armour[0] || effects.fire > 0 || effects.cool > 0 || guarded('heat'); // (v34: ice cream cools you)
  ailments.heat = Math.max(0, ailments.heat + (hot && !shaded ? dt / 50 : -dt / 15));
  for (const k of ['chill', 'heat']) {
    if (ailments[k] < 1) { timers[k] = 0; if (ailments[k] < 0.5) warned[k] = false; continue; }
    if (!warned[k]) { warned[k] = true; toast(k === 'chill' ? 'You\'re chilled to the bone! Find warmth, wrap up, or drink honey tea.' : 'Heatstroke! Get out of the sun, cover your head, or drink a healing tea.', 3500); }
    if ((timers[k] = (timers[k] ?? 0) + dt) >= (k === 'chill' ? 8 : 10)) { timers[k] = 0; if (health > 1) damage(1, k === 'chill' ? 'You froze.' : 'Heatstroke.'); }
  }
  ailments.chill = Math.min(1.5, ailments.chill); ailments.heat = Math.min(1.5, ailments.heat);
}
const warned = { chill: false, heat: false };

// ---------- dungeons ----------
// Deep underground, rare stone-brick rooms hold a shrine and a chest or two of loot. Come near an
// active shrine and its guardian, the Mossback King, rises to meet you; beat it and the shrine goes quiet.
const LOOT = [
  [IRON_INGOT, 2, 6, 0.8], [GOLD_INGOT, 1, 3, 0.5], [SILVER_INGOT, 1, 3, 0.4], [ELECTRUM_INGOT, 1, 2, 0.25],
  [TUNGSTEN_INGOT, 1, 2, 0.15], [GUNPOWDER, 2, 6, 0.5], [SILVER_ARROW, 4, 8, 0.4], [BAKED_FISH, 2, 4, 0.6],
  [NIGHT_TEA, 1, 2, 0.35], [HASTE_TEA, 1, 2, 0.3], [FIRE_TEA, 1, 1, 0.25], [HEAL_TEA, 1, 2, 0.3], [IRON_SHIELD, 1, 1, 0.12],
];
// A lair's chests also hold things from its own land: crystal and gold in a tomb, frost and silver in a
// crypt, obsidian and fire tea in a fortress.
const LAIR_LOOT = {
  tomb: [[GOLD_INGOT, 2, 5, 0.9], [CRYSTAL_SHARD, 3, 8, 0.8], [HASTE_TEA, 1, 2, 0.4]],
  crypt: [[SILVER_INGOT, 2, 5, 0.9], [CRYSTAL_SHARD, 3, 8, 0.8], [HONEY_TEA, 1, 2, 0.5]],
  fortress: [[TUNGSTEN_INGOT, 1, 3, 0.8], [OBSIDIAN, 4, 8, 0.7], [FIRE_TEA, 1, 2, 0.6], [CRYSTAL_SHARD, 4, 10, 0.8]],
};
function lairNear(x, y, z) {
  const cx = Math.floor(x / CHUNK), cz = Math.floor(z / CHUNK);
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const L = world.generator.lairAt(cx + dx, cz + dz);
    if (L && Math.abs(L.x - x) <= 6 && Math.abs(L.z - z) <= 6 && y >= L.y0 && y <= L.y0 + 8) return L;
  }
  return null;
}
// An old ruined house keeps books, maps and old tools; a shipwreck keeps a sailor's things: gold, a compass, a
// map, fish and powder.
const ironAt = TOOL_MATERIALS.findIndex((m) => m.key === 'iron');
const RUIN_LOOT = [
  [BOOK, 1, 3, 0.8], [MAP, 1, 1, 0.35], [JOURNAL, 1, 1, 0.25], [PAPER, 2, 6, 0.6], [CRYSTAL_SHARD, 1, 4, 0.5],
  [metalTool(ironAt, 'pick'), 1, 1, 0.3], [metalTool(ironAt, 'axe'), 1, 1, 0.25], [metalTool(ironAt, 'shovel'), 1, 1, 0.25], [metalSword(ironAt), 1, 1, 0.2],
];
const TEMPLE_LOOT = [
  [PEARL, 1, 3, 0.9], [COIN, 4, 12, 0.8], [GOLD_INGOT, 2, 5, 0.6], [SEA_LANTERN, 1, 3, 0.5], [DIVING_HELMET, 1, 1, 0.3], [FLIPPERS, 1, 1, 0.3], [TREASURE_MAP, 1, 1, 0.3],
];
const SKY_LOOT = [
  [STARSTEEL_INGOT, 1, 2, 0.4], [COIN, 6, 14, 0.8], [FEATHER, 4, 10, 0.6], [GOLD_INGOT, 2, 4, 0.5], [HASTE_TEA, 1, 1, 0.4], [EXPLORER_MAP, 1, 1, 0.3], [PEARL, 1, 1, 0.3],
];
const WRECK_LOOT = [
  [TREASURE_MAP, 1, 1, 0.45], [GOLD_INGOT, 2, 6, 0.8], [COMPASS, 1, 1, 0.45], [MAP, 1, 1, 0.35], [GUNPOWDER, 2, 6, 0.6], [RAW_FISH, 2, 5, 0.6], [SALMON, 1, 3, 0.4], [PAPER, 1, 3, 0.3],
];
// a lighthouse keeper's things
const LIGHTHOUSE_LOOT = [
  [TREASURE_MAP, 1, 1, 0.7], [EXPLORER_MAP, 1, 1, 0.25], [LANTERN, 1, 2, 0.5], [COMPASS, 1, 1, 0.3], [RAW_FISH, 2, 6, 0.6], [PAPER, 1, 4, 0.4], [COAL, 3, 8, 0.6],
];
// buried treasure: a pirate's hoard
const TREASURE_LOOT = [
  [GOLD_INGOT, 6, 14, 1], [SILVER_INGOT, 3, 8, 0.6], [CRYSTAL_SHARD, 3, 8, 0.6], [STARSTEEL_INGOT, 1, 2, 0.25], [COMPASS, 1, 1, 0.3], [GUNPOWDER, 2, 6, 0.4],
];
function placeLoot(x, y, z) {
  const cx = Math.floor(x / CHUNK), cz = Math.floor(z / CHUNK), g = world.generator;
  const tp = g.templeAt?.(cx, cz), il = g.islandAt?.(cx, cz);
  if (tp && tp.chest[0] === x && tp.chest[1] === y && tp.chest[2] === z) return TEMPLE_LOOT;
  if (il && il.chest[0] === x && il.chest[1] === y && il.chest[2] === z) return SKY_LOOT;
  const l = g.lighthouseAt?.(cx, cz);
  if (l && Math.abs(l.x - x) <= 2 && Math.abs(l.z - z) <= 2) return LIGHTHOUSE_LOOT;
  const r = g.ruinAt?.(cx, cz), w = g.wreckAt?.(cx, cz);
  if (r && Math.abs(r.x - x) <= 6 && Math.abs(r.z - z) <= 6 && Math.abs(r.y - y) <= 2) return RUIN_LOOT;
  if (w && Math.abs(w.x - x) <= 8 && Math.abs(w.z - z) <= 6 && Math.abs(w.y - y) <= 2) return WRECK_LOOT;
  return null;
}
function rollLoot(x, y, z) {
  const out = [];
  const place = x !== undefined && placeLoot(x, y, z);
  const table = place || [...LOOT, ...((x !== undefined && LAIR_LOOT[lairNear(x, y, z)?.kind]) || [])];
  for (const [id, a, b, p] of table) if (Math.random() < p) out.push([id, a + Math.floor(Math.random() * (b - a + 1))]);
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
    raiseBoss(d.x, d.y, d.z, 'mossking', BOSS_SHRINE, SPENT_SHRINE, 'The Mossback King');
  }
  // the lairs: a desert tomb, a frozen crypt, a fortress deep down by the lava
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const L = world.generator.lairAt(pcx + dx, pcz + dz);
    if (!L) continue;
    const info = LAIRS[L.kind];
    if (world.get(L.x, L.y, L.z) !== info.shrine) continue;
    if (Math.hypot(L.x + 0.5 - player.pos.x, L.z + 0.5 - player.pos.z) > 7 || Math.abs(L.y - player.pos.y) > 4) continue;
    raiseBoss(L.x, L.y, L.z, info.boss, info.shrine, info.shrine + 3, info.name);
  }
}
function raiseBoss(x, y, z, kind, shrine, spent, name) {
  const k = `${x},${y},${z}`;
  if (mobs.mobs.some((m) => m.shrine === k && !m.dying)) return;
  const m = mobs.spawn(kind, x + 0.5, y, z + 2.5);
  if (!m) return;
  Object.assign(m, { shrine: k, shrineId: shrine, spentId: spent, bossName: name });
  if (settings.difficulty !== 'peaceful') m.angry = 1e6;
  sound.boom(0.4);
  toast(`${name} rises from the shrine!`, 3000);
}
mobs.onDefeat = (m) => {
  achieve(m.spec.boss ? 'boss' : 'fight');
  if (!m.spec.boss || !m.shrine) return;
  const [x, y, z] = m.shrine.split(',').map(Number);
  const shrine = m.shrineId ?? BOSS_SHRINE, spent = m.spentId ?? SPENT_SHRINE;
  if (world.get(x, y, z) === shrine) world.setBlock(x, y, z, spent);
  toast(`${m.bossName ?? 'The Mossback King'} is defeated! The shrine falls quiet.`, 4000);
};

// ---------- fire and traps ----------
// The Ember Lord scorches anyone close (unless the fire can't touch them); creatures struck with a
// Flame weapon burn for a few seconds; and stepping on a tomb's pressure plate sets its dart traps off.
const FACE_DIR = [[0, 1], [-1, 0], [0, -1], [1, 0]]; // facing 0..3 -> [dx, dz]
let fireTimer = 0, trapCool = 0, onPlate = null;
function tickHazards(dt) {
  if (dead) return;
  if ((fireTimer += dt) >= 1) {
    fireTimer = 0;
    for (const m of mobs.mobs) {
      if (m.dying) continue;
      if (m.spec.burns && m.pos.distanceTo(player.pos) < 2.6 && !(effects.fire > 0) && !guarded('fire')) damage(armoured(2), 'The Ember Lord burned you to a crisp.');
      if (m.burning > 0) {
        m.burning -= 1;
        if (m.spec.hostile) giveDrops(mobs.hurt(m, 2, m.pos.clone().add(new THREE.Vector3(0, 0, 0.01))));
        else m.burning = 0;
      }
    }
  }
  trapCool = Math.max(0, trapCool - dt);
  const fx = Math.floor(player.pos.x), fz = Math.floor(player.pos.z), fy = Math.floor(player.pos.y - 0.05);
  // a plate goes off once as you step onto it (not again until you step off and back on)
  const plate = player.onGround && BLOCKS[world.get(fx, fy, fz)]?.trap ? `${fx},${fy},${fz}` : null;
  if (plate === onPlate) return;
  onPlate = plate;
  if (!plate || trapCool > 0) return;
  trapCool = 1;
  sound.click();
  let fired = 0;
  for (let y = fy; y <= fy + 4; y++) for (let z = fz - 9; z <= fz + 9; z++) for (let x = fx - 9; x <= fx + 9; x++) {
    const b = BLOCKS[world.get(x, y, z)];
    if (!b?.dart) continue;
    const [ddx, ddz] = FACE_DIR[b.facing ?? 0];
    const ox = x + 0.5 + ddx * 0.6, oz = z + 0.5 + ddz * 0.6, oy = y + 0.5;
    // only traps facing you, roughly in line with you
    const tx = player.pos.x - ox, tz = player.pos.z - oz;
    const along = tx * ddx + tz * ddz, across = Math.abs(tx * ddz - tz * ddx);
    if (along <= 0 || across > 1.6) continue;
    const dir = new THREE.Vector3(player.pos.x - ox, player.pos.y + 1 - oy, player.pos.z - oz).normalize();
    const a = arrows.shootThorn(new THREE.Vector3(ox, oy, oz), dir, 2);
    if (a) a.trap = true;
    fired++;
  }
  if (fired) toast('Click! Darts fly from the walls!', 1200);
}

// ---------- the enchanting altar ----------
// Hold a tool, weapon or piece of armour and tap the altar: it offers the enchantments that suit what
// you hold, each paid for in crystal shards and, for the strongest, a trophy from a lair's guardian.
let altarOpen = false, altarShelves = 0;
// Bookshelves within 2 blocks of the altar, on its level or the one above.
function shelvesNear(x, y, z) {
  let n = 0;
  for (let dy = 0; dy <= 1; dy++) for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) if (world.get(x + dx, y + dy, z + dz) === BOOKSHELF) n++;
  return n;
}
// What an enchantment costs with this many bookshelves round the altar: a crystal shard off for every few.
function enchCost(e, shelves) {
  return e.cost.map(([id, n]) => [id, id === CRYSTAL_SHARD ? n - Math.min(Math.floor(n / 2), Math.floor(shelves / SHELF_DISCOUNT)) : n]);
}
function openAltar(x, y, z) {
  altarOpen = true;
  altarShelves = x === undefined ? 0 : shelvesNear(x, y, z);
  tradingWith = null;
  paused = true;
  controls.reset();
  document.exitPointerLock?.();
  sound.chime?.() ?? sound.pop();
  $('trade-title').textContent = 'Enchanting Altar';
  $('trade').classList.remove('hidden');
  renderEnchants();
}
function renderEnchants() {
  const list = $('trades');
  list.innerHTML = '';
  const held = inventory.held();
  const opts = held ? Object.entries(ENCHANTS).filter(([, e]) => e.on(held.id)) : [];
  const shelfNote = altarShelves ? ` (${altarShelves} bookshelves nearby)` : ' Bookshelves round the altar make it cheaper, and teach it more.';
  $('trade-hint').textContent = (!held ? 'Hold a tool, weapon or piece of armour to enchant it.' :
    !opts.length ? `${itemName(held.id)} can't be enchanted.` : `Enchant your ${itemName(held.id).toLowerCase()}:`) + shelfNote;
  for (const [key, e] of opts) {
    const row = document.createElement('div');
    row.className = 'recipe';
    const cost = enchCost(e, altarShelves), locked = (e.shelves ?? 0) > altarShelves;
    const have = cost.every(([id, n]) => inventory.count(id) >= n);
    const done = hasEnch(held, key);
    row.innerHTML = cost.map(([id, n]) => `<span class="ing${inventory.count(id) >= n ? '' : ' missing'}" title="${itemName(id)}"><img src="${icons[id]}" alt="">${n}</span>`).join('') +
      `<span class="arrow">→</span><span class="name"><b>${e.name}</b>: ${e.about}${locked ? ` <i>(needs ${e.shelves} bookshelves round the altar)</i>` : ''}</span>`;
    const btn = document.createElement('button');
    btn.className = 'btn';
    btn.textContent = done ? 'Done' : 'Enchant';
    btn.disabled = done || locked || !have || held.count > 1;
    btn.addEventListener('click', () => {
      const h = inventory.held();
      if (!h || hasEnch(h, key) || locked || !cost.every(([id, n]) => inventory.count(id) >= n)) return;
      for (const [id, n] of cost) inventory.remove(id, n);
      h.ench = [...(h.ench ?? []), key];
      inventory.onChange();
      sound.levelUp?.() ?? sound.pop();
      toast(`${itemName(h.id)} is now ${e.name}`, 1800);
      achieve('enchant');
      renderEnchants();
    });
    row.appendChild(btn);
    list.appendChild(row);
  }
}
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
  m.sitting = false;
  player.vel.set(0, 0, 0);
  sound.mob(m.kind, 0.8);
  if (m.spec.horse) { achieve('horse'); toast(`Steer with the joystick (or WASD), jump to leap. Tap to get off. ${horseStats(m)}`, 3000); }
  else toast('Steer with the joystick (or WASD). Tap to get off.', 2500);
}
function dismount() {
  if (!ridingMob) return;
  const m = ridingMob;
  m.ridden = false;
  player.spawn(m.pos.x + 1.1, m.pos.y + 0.3, m.pos.z);
  ridingMob = null;
  // get off a horse near a stable and it goes in and waits there
  if (m.spec.horse) {
    const st = stableNear(m.pos.x, m.pos.y, m.pos.z, 12);
    if (st) { stableHorse(m, st); toast('Your horse settles in at the stable', 1800); }
    else m.sitting = true;
  }
}

// ---------- v27 A: horses and stables ----------
const HORSE_COATS = { 0x7a4a2a: 'bay', 0x9a5a2e: 'chestnut', 0x2a2420: 'black', 0xe6dfd2: 'white', 0x8c8c8e: 'grey', 0xc8a46a: 'dun' };
const horseStats = (m) => `Speed ${m.gait.toFixed(1)}, jump ${m.leap.toFixed(1)}`;
function horseLabel(m) {
  const coat = HORSE_COATS[m.coat] ?? 'mottled';
  const who = m.baby > 0 ? 'Foal' : 'Horse';
  if (!m.tame && !m.trusted) return `${who} (wild, ${coat})`;
  return `${who} (${coat}${m.tame ? '' : ', trusts you'}) · ${horseStats(m)}`;
}
// The nearest stable within r blocks of a point: [x, y, z] or null.
function stableNear(px, py, pz, r) {
  let best = null, bd = Infinity;
  const bx = Math.floor(px), by = Math.floor(py), bz = Math.floor(pz);
  for (let y = by - 3; y <= by + 3; y++) for (let z = bz - r; z <= bz + r; z++) for (let x = bx - r; x <= bx + r; x++) {
    if (!BLOCKS[world.get(x, y, z)]?.stable) continue;
    const d = (x - bx) ** 2 + (z - bz) ** 2;
    if (d < bd) { bd = d; best = [x, y, z]; }
  }
  return best;
}
// Put a horse in at a stable: on a free spot beside the manger, waiting there.
function stableHorse(m, [x, y, z]) {
  m.stable = `${x},${y},${z}`;
  m.sitting = true;
  for (const [dx, dz] of [[0, 1], [1, 0], [0, -1], [-1, 0], [1, 1], [-1, 1], [1, -1], [-1, -1]]) {
    const fx = x + dx * 2, fz = z + dz * 2;
    for (const fy of [y, y + 1, y - 1]) {
      if (!world.isSolid(fx, fy - 1, fz) || world.isSolid(fx, fy, fz) || world.isSolid(fx, fy + 1, fz)) continue;
      m.pos.set(fx + 0.5, fy, fz + 0.5); m.vel.set(0, 0, 0);
      m.heading = m.yaw = Math.atan2(x - fx, z - fz);
      return true;
    }
  }
  return false;
}
// Tap a stable: your horses (tame ones anywhere in the loaded world) come home to it, and it tells you about them.
function useStable(x, y, z) {
  const key = `${x},${y},${z}`;
  const mine = mobs.mobs.filter((m) => m.spec.horse && m.tame && !m.dying && m !== ridingMob);
  let called = 0;
  for (const m of mine) {
    if (m.stable === key && Math.hypot(m.pos.x - x, m.pos.z - z) < 4) continue;
    if (Math.hypot(m.pos.x - x, m.pos.z - z) > 160) continue;
    if (stableHorse(m, [x, y, z])) called++;
  }
  const here = mine.filter((m) => m.stable === key);
  sound.mob('horse', 0.8);
  if (!here.length) { toast('No horses here. Saddle a horse you\'ve won over, ride it here and get off nearby.', 3000); return; }
  const feed = mangers.get(key) ?? 0;
  toast(`${called ? `${called} horse${called > 1 ? 's' : ''} came home. ` : ''}At this stable: ${here.map((m) => `${HORSE_COATS[m.coat] ?? 'mottled'} (${horseStats(m).toLowerCase()}${m.rested > 0 ? ', rested' : ''})`).join('; ')}. ` +
    (feed ? `The manger holds ${feed} wheat.` : 'The manger is empty: tap the stable with wheat or a hay bale.'), 4500);
}
function followMount() {
  if (!mobs.mobs.includes(ridingMob)) { ridingMob = null; return; }
  player.pos.set(ridingMob.pos.x, ridingMob.pos.y + (ridingMob.spec.seat ?? 1.55), ridingMob.pos.z);
  player.vel.set(0, 0, 0);
  player.onGround = true;
  player.updateWaterState();
}
mobs.onPetKill = (drops) => giveDrops(drops);
// a hen's egg, or a truffle a pig has rooted up, left on the ground for you to pick up
mobs.onLay = (m, id) => loose.spawn({ id, count: 1 }, { x: m.pos.x, y: m.pos.y + 0.3, z: m.pos.z }, { x: 0, y: 1.5, z: 0 }, 0.3);

// ---------- the wandering trader ----------
// Turns up now and then on a fine day with four offers, rolled from these: what you give -> what you get.
const TRADES = [
  [[WHEAT, 24], [TUNGSTEN_INGOT, 1]], [[LOG, 16], [ELECTRUM_INGOT, 2]], [[COBBLE, 48], [GOLD_INGOT, 2]],
  [[WOOL, 8], [SILVER_INGOT, 2]], [[BREAD, 6], [GUNPOWDER, 4]], [[RAW_FISH, 8], [NIGHT_TEA, 1]],
  [[SAND, 32], [STAINLESS_INGOT, 1]], [[FEATHER, 6], [SILVER_ARROW, 6]], [[IRON_INGOT, 4], [TUNGSTEN_INGOT, 1]],
  [[COAL, 16], [STEEL_INGOT, 2]], [[BERRIES, 12], [HEAL_TEA, 1]], [[SUGAR_CANE, 16], [COPPER_INGOT, 4]],
  [[CORNFLOWER, 4], [HASTE_TEA, 1]], [[TRUFFLE, 3], [GOLD_INGOT, 2]], [[COPPER_INGOT, 8], [IRON_SHIELD, 1]],
  [[COIN, 10], [TUNGSTEN_INGOT, 1]], [[COIN, 8], [GOLD_INGOT, 2]],
  [[WHEAT, 8], [GRAPES, 4]], [[SEEDS, 12], [PUMPKIN_SEEDS, 3]], [[BREAD, 2], [CARROT, 6]], [[STICK, 16], [POTATO, 6]],
];
mobs.onTraderSpawn = (m) => {
  const pool = [...TRADES];
  m.trades = [];
  for (let i = 0; i < 4 && pool.length; i++) m.trades.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  toast('A wandering trader has turned up nearby', 3000);
};
// Villagers each have a trade, and offer three swaps from its list.
const VILLAGER_TRADES = {
  farmer: [[[LOG, 8], [BREAD, 4]], [[COBBLE, 24], [CAKE, 1]], [[STICK, 16], [WHEAT, 12]], [[FEATHER, 6], [BUTTER, 2]], [[BERRIES, 10], [COOKIE, 6]], [[COAL, 6], [FLOUR, 6]], [[COIN, 4], [CAKE, 1]], [[COIN, 2], [BREAD, 3]], [[COIN, 2], [CARROT, 4]], [[COIN, 2], [POTATO, 4]], [[COIN, 3], [PUMPKIN_SEEDS, 3]], [[COIN, 3], [GRAPES, 4]], [[COIN, 2], [ONION, 4]], [[COIN, 2], [BEANS, 6]], [[COIN, 2], [TOMATO, 4]], [[COIN, 2], [HERBS, 4]]],
  smith: [[[COAL, 12], [IRON_INGOT, 3]], [[LOG, 16], [STEEL_INGOT, 1]], [[GOLD_INGOT, 1], [STAINLESS_INGOT, 1]], [[COBBLE, 32], [COPPER_INGOT, 4]], [[LEATHER, 4], [IRON_SHIELD, 1]], [[CRYSTAL_SHARD, 4], [TUNGSTEN_INGOT, 1]], [[COIN, 6], [STEEL_INGOT, 2]], [[COIN, 5], [IRON_INGOT, 4]]],
  fisher: [[[STICK, 12], [BAKED_FISH, 3]], [[STRING, 4], [WROD, 1]], [[WHEAT, 16], [SALMON, 4]], [[COAL, 8], [BAKED_SALMON, 3]], [[BREAD, 4], [ROD, 1]], [[OLD_BOOT, 2], [LEATHER, 3]], [[COIN, 3], [BAKED_SALMON, 3]]],
  cleric: [[[GOLD_INGOT, 1], [HEAL_TEA, 2]], [[BERRIES, 8], [NIGHT_TEA, 1]], [[HONEYCOMB, 3], [HASTE_TEA, 1]], [[SILVER_INGOT, 2], [CRYSTAL_SHARD, 4]], [[PAPER, 6], [FIRE_TEA, 1]], [[GLOW_MUSHROOM, 4], [NIGHT_TEA, 1]], [[COIN, 5], [HEAL_TEA, 1]]],
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
    $('trade-hint').textContent = tradeGreeting(m.home);
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
function closeTrade() { $('trade').classList.add('hidden'); tradingWith = null; altarOpen = false; paused = false; }
function renderTrades() {
  const list = $('trades');
  list.innerHTML = '';
  for (const [[gid, gn0], [oid, on], special] of [...tradingWith.trades, ...specialTrades(tradingWith)]) {
    const gn = special ? gn0 : tradeCost(gn0, tradingWith.home);
    const row = document.createElement('div');
    row.className = special ? 'recipe special' : 'recipe';
    if (special) row.title = `Only for ${special === 'Hero' ? 'heroes' : 'friends'} of ${tradingWith.home.name}`;
    const have = inventory.count(gid) >= gn;
    row.innerHTML = `<span class="ing${have ? '' : ' missing'}" title="${itemName(gid)}"><img src="${icons[gid]}" alt="">${gn}</span>` +
      `<span class="arrow">→</span><img class="outimg" src="${icons[oid]}" alt=""><span class="name">${on > 1 ? on + ' × ' : ''}${itemName(oid)}${special ? ` <small>★ ${special}</small>` : ''}</span>`;
    const btn = document.createElement('button');
    btn.className = 'btn';
    btn.textContent = 'Trade';
    btn.disabled = !have || inventory.room(oid) < on;
    btn.addEventListener('click', () => {
      if (inventory.count(gid) < gn) return;
      inventory.remove(gid, gn);
      inventory.add(oid, on);
      sound.pop();
      achieve('trade');
      if (tradingWith.home) { growVillage(tradingWith.home); addRep(tradingWith.home, 1); }
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
const pressedRails = new Map(); // detector rails: "x,y,z" -> seconds since a cart was on it
const detected = pressedRails;
const logic = new Logic(); // wires, inverters, delay blocks and latches
// The block a switch passes its signal through: the one it's fixed to (or stands on); for a logic block,
// the one in front of it.
const attachedTo = (x, y, z, d) => (d.directed ? [x + FACING_DIRS[d.facing][0], y, z + FACING_DIRS[d.facing][1]]
  : d.floor ? [x, y - 1, z] : [x - FACING_DIRS[d.facing][0], y, z - FACING_DIRS[d.facing][1]]);
// Does the block at (nx, ny, nz) give a signal to its neighbour (x, y, z)? noWire: leave out wires (a
// line of wire only counts the signals that come from outside it).
function feeds(x, y, z, nx, ny, nz, noWire) {
  const d = BLOCKS[world.get(nx, ny, nz)];
  if (d?.switch) {
    if (!d.on || (noWire && d.logic === 'wire')) return false;
    // a logic block only signals the block in front of it
    if (d.directed) return nx + FACING_DIRS[d.facing][0] === x && ny === y && nz + FACING_DIRS[d.facing][1] === z;
    // (an observer or gauge doesn't power the block it's watching, or it would set itself off again)
    return !((d.sensor === 'observer' || d.sensor === 'gauge') && nx + FACING_DIRS[d.facing][0] === x && ny === y && nz + FACING_DIRS[d.facing][1] === z);
  }
  if (!d?.solid || d.shape !== 'cube') return false;
  // a switch fixed to this block passes its signal through it
  for (const [ex, ey, ez] of SIDES6) {
    const sx = nx + ex, sy = ny + ey, sz = nz + ez;
    if (sx === x && sy === y && sz === z) continue;
    const s = BLOCKS[world.get(sx, sy, sz)];
    if (!s?.switch || !s.on || (noWire && s.logic === 'wire')) continue;
    const [ax, ay, az] = attachedTo(sx, sy, sz, s);
    if (ax === nx && ay === ny && az === nz) return true;
  }
  return false;
}
function signalAt(x, y, z) {
  for (const [dx, dy, dz] of SIDES6) if (feeds(x, y, z, x + dx, y + dy, z + dz, false)) return true;
  return false;
}
kinetics.signalAt = signalAt;
machines.onSwitch = (x, y, z, on) => setSwitch(x, y, z, on);
machines.farmHooks = { treeAbove: (x, y, z) => treeAbove(x, y, z), catchAt: (pos) => catchAt(pos), mobs, playerPos: () => (dead ? null : player.pos) };
// creatures killed by a trap (lava, cactus, a long fall) drop what they carry where they die, for collectors
mobs.onWorldKill = (m, drops) => {
  for (const [id, n] of drops) loose.spawn({ id, count: n }, { x: m.pos.x, y: m.pos.y + 0.3, z: m.pos.z }, { x: (Math.random() - 0.5) * 2, y: 3, z: (Math.random() - 0.5) * 2 }, 0);
};
mobs.onBred = (baby) => { if (Math.hypot(baby.pos.x - player.pos.x, baby.pos.z - player.pos.z) < 24) toast(`A young ${baby.kind} is born!`, 2200); };
machines.onBlockChanged = (x, y, z) => { logic.near(world, x, y, z); dropUnsupported(x, y, z); };
machines.signalAt = signalAt;
// (v30) stock sensors switch like other switches; a power junction getting a signal (not from the network's own sensors) pauses it
logistics.onSwitch = (x, y, z, on) => setSwitch(x, y, z, on);
logistics.onFlight = () => achieve('courier');
logistics.pausedAt = (x, y, z) => SIDES6.some(([dx, dy, dz]) => !BLOCKS[world.get(x + dx, y + dy, z + dz)]?.lpipe && feeds(x, y, z, x + dx, y + dy, z + dz, false));

function setSwitch(x, y, z, on) {
  const d = BLOCKS[world.get(x, y, z)];
  if (!d?.switch || d.on === on) return;
  const id = d.flip ? d.flip : d.switch === 'lever' ? LEVER + (d.floor ? 4 : d.facing) + (on ? 5 : 0)
    : d.switch === 'button' ? BUTTON + d.facing + (on ? 4 : 0)
      : d.switch === 'observer' ? OBSERVER + d.facing + (on ? 4 : 0)
        : d.switch === 'gauge' ? GAUGE + d.facing + (on ? 4 : 0) : PRESSURE_PLATE + (on ? 1 : 0);
  world.setBlock(x, y, z, id);
  if (!d.sensor && !d.logic && d.switch !== 'detector' && d.switch !== 'stock') sound.click();
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
    if (d?.logic) logic.mark(cx, cy, cz);
    if (isGate(id) || isTrapdoor(id)) toggleHatch(cx, cy, cz, signalAt(cx, cy, cz));
    else if (d?.rail?.junction) {
      const j = d.rail.junction, on = signalAt(cx, cy, cz);
      if (on !== j.curved) world.setBlock(cx, cy, cz, switchRailId(j.stem, j.branch, on));
    }
    else if (isDoor(id)) {
      const by = d.upper ? cy - 1 : cy;
      const on = signalAt(cx, by, cz) || signalAt(cx, by + 1, cz);
      if (on !== d.open) toggleDoor(cx, cy, cz, true);
    }
  }
}

// A drive belt: tap a shaft or gear, then another on a parallel axle, to link them.
let beltStart = null;
function useDriveBelt() {
  if (!target || !BLOCKS[target.id].kinetic) { toast('Tap a shaft or gear, then another one, to link them with the drive belt'); beltStart = null; return; }
  const here = [target.x, target.y, target.z];
  if (!beltStart || beltStart.join() === here.join()) { beltStart = here; sound.click(); toast('Now tap the shaft or gear to link it to (up to 8 blocks away)', 2500); return; }
  const why = kinetics.canBelt(beltStart, here);
  if (why) { toast(why, 2500); beltStart = null; return; }
  kinetics.addBelt(beltStart, here);
  beltStart = null;
  inventory.consumeHeld();
  sound.place('wool');
  toast('Linked with a drive belt', 1500);
}

// Tap a logic block: a delay block goes on to its next setting, a latch flips over, and the others say
// what they're doing.
function useLogic(x, y, z, d) {
  sound.click();
  if (d.logic === 'delay') { toast(`Delay block: passes its signal on after ${logic.cycleDelay(x, y, z)} s`, 2000); return; }
  if (d.logic === 'latch') { setSwitch(x, y, z, !d.on); toast(`Latch: ${d.on ? 'off' : 'on'} (flips each time its signal comes on)`, 2000); return; }
  if (d.logic === 'inverter') { toast(`Inverter: ${d.on ? 'on: it gets no signal' : 'off: it gets a signal'}`, 2000); return; }
  if (d.electric) { toast(`Electrum wire: ${d.on ? 'carrying a signal' : 'no signal'}. ${electric.statusAt(x, y, z)}`, 2500); return; }
  toast(`Copper wire: ${d.on ? 'carrying a signal' : 'no signal'}`, 1500);
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
  // detector rails: on while a cart is on them, and a moment after
  for (const c of carts.carts) {
    const id = world.get(c.x, c.y, c.z);
    if (BLOCKS[id]?.switch !== 'detector') continue;
    pressedRails.set(lampKey(c.x, c.y, c.z), 0);
    if (!BLOCKS[id].on) setSwitch(c.x, c.y, c.z, true);
  }
  for (const [k, t] of pressedRails) {
    if (t + dt < 0.3) { pressedRails.set(k, t + dt); continue; }
    pressedRails.delete(k);
    const [x, y, z] = k.split(',').map(Number);
    if (world.chunkAt(x, z)) setSwitch(x, y, z, false);
  }
  logic.update(dt, world, { feeds, set: setSwitch });
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

// ---------- v25 A: shelves and tables, flower pots, chairs ----------
// Tap the top of a shelf or table holding something (not a block) to stand it there; tap it again to take it back.
function useDisplay(x, y, z, held) {
  const item = frames.get(x, y, z);
  if (item) { frames.remove(x, y, z); giveDrops([[item, 1]]); return; }
  if (world.get(x, y + 1, z) !== AIR) { toast('There\'s no room on top of it', 1500); return; }
  if (held.wear || held.ench || held.pack || held.on) { toast('Only plain things stand on a shelf', 1500); return; }
  frames.set(x, y, z, held.id);
  inventory.consumeHeld();
  sound.place('wood');
}
// Tap an empty flower pot holding a flower, sapling, glowcap or cactus to plant it; tap a planted pot to take it out.
function usePot(x, y, z, id, held) {
  const k = potOf(id);
  if (k > 0) {
    world.setBlock(x, y, z, FLOWER_POT);
    giveDrops([[POT_PLANTS[k], 1]]);
    sound.breakBlock('grass');
    return true;
  }
  const j = POT_PLANTS.indexOf(held?.id ?? -1);
  if (j <= 0) { if (!held || !isBlock(held.id)) { toast('Tap the pot holding a flower, sapling, glowcap or cactus to plant it', 2500); return true; } return false; }
  world.setBlock(x, y, z, FLOWER_POT + j);
  inventory.consumeHeld();
  sound.place('grass');
  return true;
}
// Sit on a chair: you face the way it faces until you move or jump.
function sitOn(x, y, z) {
  if (world.isSolid(x, y + 1, z)) { toast('There\'s no room to sit there', 1500); return; }
  seated = { x, y, z };
  const [dx, dz] = FACING_DIRS[BLOCKS[world.get(x, y, z)].facing];
  player.yaw = Math.atan2(-dx, -dz);
  player.vel.set(0, 0, 0);
  sound.place('wood');
  toast('Move or jump to get up', 1500);
}
function standUp() {
  const s = seated;
  seated = null;
  if (!s) return;
  const [dx, dz] = FACING_DIRS[BLOCKS[world.get(s.x, s.y, s.z)]?.facing ?? 0];
  const fx = s.x + dx, fz = s.z + dz;
  if (!world.isSolid(fx, s.y, fz) && !world.isSolid(fx, s.y + 1, fz)) player.spawn(fx + 0.5, s.y, fz + 0.5);
  else player.spawn(s.x + 0.5, s.y + 1, s.z + 0.5);
}
function followSeat() {
  const s = seated;
  if (!isChair(world.get(s.x, s.y, s.z)) || controls.jump || Math.abs(controls.moveX) + Math.abs(controls.moveZ) > 0.3) { standUp(); return; }
  player.pos.set(s.x + 0.5, s.y - 0.3, s.z + 0.5);
  player.vel.set(0, 0, 0);
  player.onGround = true;
  player.updateWaterState();
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
    const pointsHere = (nr.all ?? nr.ends).includes((d + 2) % 4);
    if (pointsHere || joinedEnds(n[0], n[1], n[2]).length < 2) cands.push({ d, n, dy: n[3], pri: pointsHere ? 0 : 1 });
  }
  cands.sort((a, b) => a.pri - b.pri);
  let pick = cands.slice(0, 2);
  const straight = (a, b) => (a + 2) % 4 === b;
  if (pick.length === 2 && powered && !straight(pick[0].d, pick[1].d)) pick = pick.slice(0, 1); // powered (and electric) rails don't bend
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
    if (nr.loader || nr.junction) continue; // loader rails stay straight, switch rails stay as they are
    if (nr.ends.includes(back) && (dy !== -1 || nr.slope === back)) continue; // already joined
    const keep = joinedEnds(nx, ny, nz).find((e) => e !== back);
    const nends = keep === undefined ? [back, (back + 2) % 4] : [keep, back];
    if (straight(nends[0], nends[1]) || !nr.powered) {
      const slope = dy === -1 && straight(nends[0], nends[1]) && !nr.powered ? back : -1; // a lower rail slopes up to meet this one
      if (dy === -1 && slope < 0) continue;
      world.setBlock(nx, ny, nz, railId(nends, slope, nr.electric ? 'electric' : nr.powered));
    }
  }
}

// A switch rail: its stem and straight run follow the rails already there (a straight line through it),
// and its branch goes off toward a third rail beside it; with none, it runs the way you're looking and
// branches to the right.
function placeSwitchRail(x, y, z) {
  const near = [0, 1, 2, 3].filter((d) => railNeighbour(x, y, z, d));
  const f = facingTowardPlayer(x, z);
  let stem = f, branch = (f + 3) % 4;
  const line = [0, 1].find((a) => near.includes(a) && near.includes(a + 2));
  const side = near.find((e) => line !== undefined && e % 2 !== line % 2);
  if (side !== undefined) {
    // a straight line with a rail off to one side: the stem is the end of the line nearer you
    stem = f % 2 === line % 2 ? f : line;
    branch = side;
  } else if (line === undefined && near.length >= 2) {
    // a corner: one way in, the other the branch
    const d = near.find((e) => e % 2 !== near[0] % 2);
    if (d !== undefined) { stem = near[0]; branch = d; }
  } else if (line !== undefined) stem = f % 2 === line % 2 ? f : line;
  world.setBlock(x, y, z, switchRailId(stem, branch, signalAt(x, y, z)));
  // the rails beside it turn to meet it
  for (const d of [stem, (stem + 2) % 4, branch]) {
    const n = railNeighbour(x, y, z, d);
    if (!n || n[3] !== 0) continue;
    const nr = BLOCKS[world.get(n[0], n[1], n[2])].rail, back = (d + 2) % 4;
    if (nr.loader || nr.junction || nr.powered || nr.ends.includes(back)) continue;
    const keep = joinedEnds(n[0], n[1], n[2]).find((e) => e !== back);
    world.setBlock(n[0], n[1], n[2], railId(keep === undefined ? [back, d] : [keep, back]));
  }
}

// ---------- boats and balloons ----------
// Put a boat on the water you're looking at, or a balloon on the block you're looking at.
function waterInSight() {
  const eye = player.eye, d = player.lookDir();
  for (let t = 0.5; t <= REACH; t += 0.25) {
    const x = Math.floor(eye.x + d.x * t), y = Math.floor(eye.y + d.y * t), z = Math.floor(eye.z + d.z * t);
    if (world.isWater(x, y, z)) return [x, y, z];
    if (world.isSolid(x, y, z)) return null;
  }
  return null;
}
function openBoatChest(v) {
  sound.click();
  openStation(0, 0, 0, { store: v.store, title: 'Chest Boat' });
}
function putVehicle(kind, chest = false, fast = false) {
  if (kind === 'boat') {
    const w = waterInSight();
    if (!w) { toast('Put a boat on water', 1500); return false; }
    let y = w[1];
    while (world.isWater(w[0], y + 1, w[2])) y++;
    vehicles.add('boat', w[0] + 0.5, y + 0.55, w[2] + 0.5, player.yaw + Math.PI, 0, chest ? newBoatStore() : null, fast);
  } else {
    if (!target) return false;
    const { x, y, z } = target;
    if (vehicles.blocked(world, x + 0.5, y + 1, z + 0.5, 0.5, 2.6)) { toast('There isn\'t room for a balloon there', 1500); return false; }
    vehicles.add('balloon', x + 0.5, y + 1, z + 0.5, player.yaw);
  }
  sound.place('wood');
  return true;
}
function boardVehicle(v) {
  if (vehicles.list.some((o) => o !== v && o === boarded)) return;
  boarded = v;
  player.vel.set(0, 0, 0);
  sound.place('wood');
  toast(v.kind === 'boat' ? `Hold forward to row the way you look, back to slow down. Tap to get out.${v.store ? ' Open the chest with 🎒.' : ''}`
    : 'Jump to rise, sneak to sink, and move as you walk. The burner uses coal or charcoal from your inventory. Tap to get out.', 3500);
}
function leaveVehicle() {
  if (!boarded) return;
  const v = boarded;
  boarded = null;
  // step out onto land beside a boat if there is some, otherwise just stand up in it
  if (v.kind === 'boat') {
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]]) {
      const x = Math.floor(v.pos.x) + dx, z = Math.floor(v.pos.z) + dz;
      for (let y = Math.floor(v.pos.y) + 1; y >= Math.floor(v.pos.y) - 1; y--) {
        if (world.isSolid(x, y, z) && !world.isWater(x, y, z) && !world.isSolid(x, y + 1, z) && !world.isSolid(x, y + 2, z) && !world.isWater(x, y + 1, z)) { player.spawn(x + 0.5, y + 1, z + 0.5); return; }
      }
    }
  }
  player.spawn(v.pos.x, v.pos.y + (v.kind === 'boat' ? 0.6 : 0.15), v.pos.z);
}
function followVehicle() {
  if (!vehicles.list.includes(boarded)) { boarded = null; return; }
  player.pos.set(boarded.pos.x, boarded.pos.y + (boarded.kind === 'boat' ? 0.1 : 0.12), boarded.pos.z);
  player.vel.set(0, 0, 0);
  player.onGround = true;
  player.updateWaterState();
  fallTop = null;
}
// The balloon's burner: a piece of coal or charcoal from your inventory.
function burnCoal() {
  if (creative) return true;
  for (const id of [COAL, CHARCOAL]) if (inventory.count(id) > 0) { inventory.remove(id, 1); return true; }
  toast('The balloon\'s burner is out of fuel: carry coal or charcoal', 2500);
  return false;
}

// ---------- ziplines ----------
// Lines between pairs of zipline posts; tap a post holding a grappling hook to slide to the other end.
const zips = []; // { ends: [ax, ay, az, bx, by, bz], line }
let zipStart = null; // the first post you tapped with a rope
const zipTop = (x, y, z) => new THREE.Vector3(x + 0.5, y + 0.9, z + 0.5);
function drawZip(z) {
  const a = zipTop(...z.ends.slice(0, 3)), b = zipTop(...z.ends.slice(3)), len = a.distanceTo(b), pts = [];
  for (let i = 0; i <= 16; i++) { const k = i / 16; pts.push(a.clone().lerp(b, k).add(new THREE.Vector3(0, -Math.sin(k * Math.PI) * len * 0.03, 0))); }
  z.line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: 0x3a3226 }));
  scene.add(z.line);
}
function loadZips(list) {
  for (const z of zips) { scene.remove(z.line); z.line.geometry.dispose(); }
  zips.length = 0; zipStart = null;
  for (const e of Array.isArray(list) ? list : []) if (Array.isArray(e) && e.length === 6 && e.every(Number.isFinite)) { const z = { ends: e.map(Math.floor) }; zips.push(z); drawZip(z); }
}
const zipsAt = (x, y, z) => zips.filter((l) => (l.ends[0] === x && l.ends[1] === y && l.ends[2] === z) || (l.ends[3] === x && l.ends[4] === y && l.ends[5] === z));
function linkZip(x, y, z) {
  if (!zipStart || world.get(...zipStart) !== ZIP_POST) { zipStart = [x, y, z]; toast('Now tap another zipline post to run the rope to', 2000); return; }
  const [sx, sy, sz] = zipStart;
  zipStart = null;
  const d = Math.hypot(x - sx, y - sy, z - sz);
  if (d < 1) { toast('Tap a different post', 1500); return; }
  if (d > ZIP_REACH) { toast(`A zipline can be at most ${ZIP_REACH} blocks long`, 2000); return; }
  if (zipsAt(sx, sy, sz).some((l) => zipsAt(x, y, z).includes(l))) { toast('Those posts are already joined', 1500); return; }
  const l = { ends: [sx, sy, sz, x, y, z] };
  zips.push(l); drawZip(l);
  inventory.consumeHeld();
  sound.place('wool');
  toast('Zipline up! Tap a post holding a grappling hook to slide along it', 2500);
}
// Breaking a post takes its lines down: their ropes come back.
function unlinkZips(x, y, z) {
  const gone = zipsAt(x, y, z);
  for (const l of gone) { scene.remove(l.line); l.line.geometry.dispose(); zips.splice(zips.indexOf(l), 1); }
  return gone.length ? [[ZIP_LINE, gone.length]] : [];
}
function startZip(x, y, z, cable = false) {
  const lines = zipsAt(x, y, z);
  if (!lines.length) { toast('That post has no zipline: join it to another with a zipline rope', 2000); return; }
  // the line that runs most nearly the way you're looking
  const look = player.lookDir(), here = zipTop(x, y, z);
  const other = (l) => (l.ends[0] === x && l.ends[1] === y && l.ends[2] === z ? l.ends.slice(3) : l.ends.slice(0, 3));
  const best = lines.map((l) => ({ l, to: other(l) })).sort((a, b) => zipTop(...b.to).sub(here).normalize().dot(look) - zipTop(...a.to).sub(here).normalize().dot(look))[0];
  const from = here, to = zipTop(...best.to);
  zipping = { from, to, end: best.to, len: from.distanceTo(to), d: 0, speed: cable ? CABLE_SPEED : 4, cable };
  if (cable) { gondola.visible = true; toast('Off you go! (sneak to get out)', 1800); }
  sound.swish?.();
}
function letGoZip() { zipping = null; gondola.visible = false; player.vel.set(0, 0, 0); }
function tickZip(dt) {
  const z = zipping;
  if (controls.down || dead) { letGoZip(); return; }
  const drop = (z.from.y - z.to.y) / Math.max(1, z.len);
  if (!z.cable) z.speed = Math.max(4, Math.min(16, z.speed + drop * 14 * dt));
  z.d = Math.min(z.len, z.d + z.speed * dt);
  const k = z.d / z.len, p = z.from.clone().lerp(z.to, k);
  p.y -= Math.sin(k * Math.PI) * z.len * 0.03 + (z.cable ? 2.9 : 2.0); // hanging under the rope (in the gondola, lower)
  player.pos.copy(p);
  if (z.cable) {
    const lit = Math.max(0.3, lightUniforms.uDay.value);
    for (const [m, c] of gondola.userData.mats) m.color.copy(c).multiplyScalar(lit);
    gondola.position.set(p.x, p.y - 0.06, p.z); gondola.rotation.y = Math.atan2(z.to.x - z.from.x, z.to.z - z.from.z); }
  player.vel.set(0, 0, 0);
  fallTop = null;
  if (z.d < z.len) return;
  // off at the far post: step down beside it, back toward where you came from
  zipping = null; gondola.visible = false;
  const [ex, ey, ez] = z.end, back = z.from.clone().sub(z.to).setY(0).normalize();
  let fx = Math.floor(ex + 0.5 + back.x * 1.1), fz = Math.floor(ez + 0.5 + back.z * 1.1), fy = ey;
  while (fy < ey + 4 && (world.isSolid(fx, fy, fz) || world.isSolid(fx, fy + 1, fz))) fy++;
  player.spawn(fx + 0.5, fy, fz + 0.5);
  sound.place('wool');
}

function getInCart(cart) {
  riding = cart;
  player.vel.set(0, 0, 0);
  sound.place('stone');
  toast('Hold forward to push off, back to brake. Tap to get out.', 2500);
  achieve('cart');
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

// Placing a machine taken up with the spanner puts back what was inside it.
function place() {
  if (photoMode) return;
  const before = inventory.held();
  const pk = before?.pack > 0 && isBlock(before.id) ? before.pack : 0;
  const at = target && { x: target.x + target.nx, y: target.y + target.ny, z: target.z + target.nz };
  placeInner();
  if (!pk || (inventory.slots[inventory.selected] === before && before.count > 0)) return;
  const there = at && world.get(at.x, at.y, at.z);
  if (there && ((BLOCKS[there].variantOf || there) === before.id || BLOCKS[there].drop === before.id)) unpack(at.x, at.y, at.z, pk);
  else if (at) unpack(at.x, at.y, at.z, pk); // (spills what was inside)
}
function placeInner() {
  if (paused) return;
  const held = inventory.held();
  if (isRod(held?.id)) { useRod(held.id); return; }
  // with the bow in hand a tap always shoots (a quick, short shot), whatever you're looking at
  if (held?.id === BOW) { shootArrow(Math.max(0.25, Math.min(1, bowCharge / FULL_DRAW))); bowCharge = 0; return; }
  if (riding) { getOutOfCart(); return; }
  if (ridingMob) { dismount(); return; }
  if (boarded) { leaveVehicle(); return; }
  if (zipping) { letGoZip(); return; }
  if (targetCart) {
    const c = targetCart.cart;
    if (c.loco && (held?.id === COAL || held?.id === CHARCOAL)) {
      // stoke the locomotive's firebox
      const n = held.count;
      c.loco.coal += n; c.loco.running = true;
      takeFromHeld(n);
      sound.crackle(1);
      toast(`The locomotive has ${c.loco.coal} coal${c.loco.burn > 0 ? ' and a fire going' : ''}`, 1800);
      return;
    }
    if (c.store) { sound.click(); openStation(c.x, c.y, c.z, c); } else getInCart(c);
    return;
  }
  if (targetVehicle) { if (targetVehicle.v.store && controls.down) openBoatChest(targetVehicle.v); else boardVehicle(targetVehicle.v); return; }
  if (held && ITEMS[held.id]?.vehicle && putVehicle(ITEMS[held.id].vehicle, ITEMS[held.id].chest, ITEMS[held.id].fast)) { inventory.consumeHeld(); return; }
  if (held?.id === ZIP_LINE && target?.id === ZIP_POST) { linkZip(target.x, target.y, target.z); return; }
  if (held?.id === GRAPPLE && target?.id === ZIP_POST) { startZip(target.x, target.y, target.z); return; }
  if (held?.id === CABLE_CAR && target?.id === ZIP_POST) { startZip(target.x, target.y, target.z, true); return; }
  if (swatBat()) return;
  if (targetMob) { hitMob(); return; }
  if (held?.id === LOCOMOTIVE && target && isRail(target.id)) {
    if (carts.add(world, target.x, target.y, target.z, player.lookDir(), false, true)) {
      inventory.consumeHeld(); sound.place('stone');
      toast('Tap the locomotive with coal to fire it up', 2500);
    }
    return;
  }
  if ((held?.id === MINECART || held?.id === STORAGE_CART) && target && isRail(target.id)) {
    if (carts.add(world, target.x, target.y, target.z, player.lookDir(), held.id === STORAGE_CART)) { inventory.consumeHeld(); sound.place('stone'); }
    return;
  }
  if (held?.id === COPY_WAND) { useWand(); return; }
  if (held?.id === DRIVE_BELT) { useDriveBelt(); return; }
  if (held && isBackpack(held.id)) { openBackpack(held); return; }
  if (held?.id === BOOK) { openGuide(); return; }
  if (held?.id === JOURNAL) { openJournal(held); return; }
  if (held?.id === REMOTE_ORDERER) { useOrderer(target); return; }
  if (held?.id === TREASURE_MAP) { readTreasureMap(held); return; }
  if (held?.id === DETONATOR) { useDetonator(held, target); return; }
  if (held?.id === FIREWORK) { const l = player.lookDir(); fireworks.launch(player.pos.x + l.x * 1.2, player.pos.y + 1, player.pos.z + l.z * 1.2); sound.fuse(); inventory.consumeHeld(); return; }
  if (held?.id === FERTILISER && target && fertilise(target.x, target.y, target.z)) { inventory.consumeHeld(); return; }
  if (held?.id === GRAPPLE) { if (grapple) releaseGrapple(); else throwGrapple(); return; }
  if (held?.id === SPANNER && target && spannerTurn(target.x, target.y, target.z)) return;
  // tap a belt or hopper with an item (not a block, or a tool) to put it in: one on a belt, the lot into a hopper
  if (target && held && !isBlock(held.id) && !ITEMS[held.id]?.tool && (BLOCKS[target.id].belt || BLOCKS[target.id].hopper || BLOCKS[target.id].elevator)) {
    const n = machines.insert(world, stations, target.x, target.y, target.z, held, BLOCKS[target.id].belt ? 1 : held.count, false);
    if (n) { takeFromHeld(n); sound.place('wool'); } else toast(BLOCKS[target.id].belt ? 'The belt is full there' : 'That hopper has nowhere to put it', 1500);
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
    if (tid === LP_TABLE && !(held && isBlock(held.id))) { openLogistics(tx, ty, tz, 'order'); return; }
    if (BLOCKS[tid].shape === 'lpipe' && !(held && isBlock(held.id))) { logistics.add(tx, ty, tz); openLogistics(tx, ty, tz, 'pipe'); return; }
    if (tid === DRONE_PAD && !(held && isBlock(held.id))) { logistics.add(tx, ty, tz); openLogistics(tx, ty, tz, 'pipe'); return; }
    if (tid === LP_POWER && !(held && isBlock(held.id))) { toast(`${logistics.status(tx, ty, tz)} ${electric.statusAt(tx, ty, tz)}`, 3000); return; }
    if (BLOCKS[tid].stable && (held?.id === HAY_BALE || held?.id === WHEAT)) { stockStable(tx, ty, tz, held.id); return; }
    if (BLOCKS[tid].stable && !(held && isBlock(held.id))) { useStable(tx, ty, tz); return; }
    if (BLOCKS[tid].hearth) {
      if (held && HEARTH_FUEL[held.id]) { feedHearth(tx, ty, tz, held); return; }
      if (!(held && isBlock(held.id))) {
        const left = hearths.get(`${tx},${ty},${tz}`);
        toast(left ? `The fire will burn for ${hearthTime(left)}` : 'Tap the fireplace with logs, planks, sticks or coal to light it', 2000);
        return;
      }
    }
    if ((BLOCKS[tid].sensor === 'radio' || BLOCKS[tid].sensor === 'radiotx') && !(held && isBlock(held.id))) {
      const ch = machines.nextChannel(tx, ty, tz);
      sound.click();
      toast(`${BLOCKS[tid].sensor === 'radio' ? 'Radio receiver' : 'Radio transmitter'}: channel ${ch}`, 1500);
      return;
    }
    if (BLOCKS[tid].logic && !(held && isBlock(held.id))) { useLogic(tx, ty, tz, BLOCKS[tid]); return; }
    if (BLOCKS[tid].switch === 'button') { setSwitch(tx, ty, tz, true); pressedButtons.set(lampKey(tx, ty, tz), 1.5); return; }
    if (isFrame(tid)) { useFrame(tx, ty, tz, held); return; }
    if (isDisplay(tid) && target.ny === 1 && (frames.get(tx, ty, tz) || (held && !isBlock(held.id)))) { useDisplay(tx, ty, tz, held); return; }
    if (isChair(tid) && !(held && isBlock(held.id))) { sitOn(tx, ty, tz); return; }
    if (potOf(tid) >= 0 && usePot(tx, ty, tz, tid, held)) return;
    if (held?.id === BEE_SCOOP && BLOCKS[tid].hive >= 0) { scoopHive(tx, ty, tz, tid); return; }
    if (BLOCKS[tid].tap >= 0 && !(held && isBlock(held.id))) { useTap(tx, ty, tz, tid); return; }
    if (BLOCKS[tid].apiary && (held?.id === GLASS_BOTTLE || !held || !isBlock(held.id))) {
      // an apiary: take the comb and wax by hand (and a bottle of honey too, if you hold a bottle)
      const lv = BLOCKS[tid].hive;
      if (lv >= MAX_APIARY) {
        world.setBlock(tx, ty, tz, APIARY);
        if (held?.id === GLASS_BOTTLE) { inventory.consumeHeld(); giveDrops([[honeyAt(tx, ty, tz), 1], [HONEYCOMB, 2], [BEESWAX, 2]]); }
        else giveDrops([[HONEYCOMB, 3], [BEESWAX, 2]]);
        sound.pop();
        toast('You take the frames of comb from the apiary', 1500);
      } else toast(`The bees are filling the frames (${lv}/${MAX_APIARY})`, 2000);
      return;
    }
    if (BLOCKS[tid].hive >= 0 && (held?.id === GLASS_BOTTLE || !held || !isBlock(held.id))) {
      const lv = BLOCKS[tid].hive;
      if (held?.id === GLASS_BOTTLE && lv >= MAX_HONEY) {
        world.setBlock(tx, ty, tz, BEE_HIVE);
        inventory.consumeHeld();
        const hid = honeyAt(tx, ty, tz);
        giveDrops([[hid, 1]]);
        sound.splash(false);
        toast(hid === HONEY_BOTTLE ? 'You fill a bottle with wildflower honey' : `You fill a bottle with ${itemName(hid).toLowerCase()}`, 1800);
      } else toast(lv >= MAX_HONEY ? 'The hive is full of honey: tap it holding a glass bottle' : `The bees are making honey (${lv}/${MAX_HONEY})`, 2000);
      return;
    }
    if (tid === ENCHANT_ALTAR) { openAltar(tx, ty, tz); return; }
    if (BLOCKS[tid].bell) { ringBell(tx, tz, held); return; }
    if (tid === SLUICE_WHEEL) { workLock(tx, ty, tz); return; }
    if (tid === LOG && held?.id === TORCH && lightCharcoalPile(tx, ty, tz, [target.nx, target.ny, target.nz])) return;
    if (tid === CHOC_MOULD || mouldFill(tid)) { useMould(tx, ty, tz, tid, held); return; }
    if (tid >= CHOC_CAKE && tid < CHOC_CAKE + CAKE_SLICES && !(held && isBlock(held.id))) { eatCakeSlice(tx, ty, tz, tid); return; }
    if (BLOCKS[tid].fruit?.ripe) {
      // pick the fruit off a fruit tree's leaves
      const f = BLOCKS[tid].fruit;
      world.setBlock(tx, ty, tz, f.bare);
      sound.breakBlock('leaves');
      giveDrops([[f.item, 1 + (Math.random() < 0.3 ? 1 : 0)]]);
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
    if ((tid === DEMO_CHARGE || tid === DEMO_CHARGE + 1) && held?.id !== DETONATOR) { toast('A demolition charge has no fuse: link it to a detonator', 2000); return; }
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
      rollLoot(tx, ty, tz).forEach(([id, n], i) => { st.inputs[i * 2 % st.inputs.length] = { id, count: n }; });
      world.setBlock(tx, ty, tz, CHEST);
    }
    if (stationKind(tid) && UPGRADES[held?.id]) { fitUpgrade(tx, ty, tz, held.id); return; }
    if (stationKind(tid)) { sound.click(); openStation(tx, ty, tz); return; }
    if (BLOCKS[tid].engine) {
      // feed a steam engine's firebox, or see how it's doing
      if (held && isFuel(held.id)) {
        const n = machines.insert(world, stations, tx, ty, tz, held.id, held.count, true);
        if (n) { inventory.remove(held.id, n); sound.place('stone'); toast(`Steam engine: ${machines.engineText(tx, ty, tz)}`, 2000); achieve('engine'); return; }
      }
      toast(`Steam engine: ${machines.engineText(tx, ty, tz)}. ${kinetics.statusAt(tx, ty, tz)}`, 3000);
      return;
    }
    if (BLOCKS[tid].ejector && !(held && isBlock(held.id))) {
      sound.click();
      toast(machines.toggleEjector(tx, ty, tz) ? 'Ejector: throws a whole stack each time its signal comes on' : 'Ejector: throws one thing at a time while it gets a signal', 2500);
      return;
    }
    if (BLOCKS[tid].tank) {
      // pour a bucket in, or fill an empty one; otherwise see what's in it
      const pour = { [WATER_BUCKET]: [WATER, 1, BUCKET], [BUCKET]: [WATER, -1, WATER_BUCKET], [LAVA_BUCKET]: [LAVA, 1, LEAD_BUCKET], [LEAD_BUCKET]: [LAVA, -1, LAVA_BUCKET] }[held?.id];
      if (pour) {
        if (machines.pourTank(world, tx, ty, tz, pour[0], pour[1])) {
          if (held.count > 1) { inventory.consumeHeld(); if (inventory.add(pour[2], 1)) toast('Inventory full: dropped at your feet'); }
          else { inventory.slots[inventory.selected] = { id: pour[2], count: 1 }; inventory.onChange(); }
          sound.splash(false);
        } else toast(pour[1] > 0 ? 'The tank is full, or holds the other liquid' : 'There\'s not a bucketful of that in the tank', 2000);
        return;
      }
      if (!(held && isBlock(held.id))) { toast(`Tank: ${machines.tankText(tx, ty, tz)}`, 2000); return; }
    }
    if (BLOCKS[tid].farm && !BLOCKS[tid].station && !(held && isBlock(held.id))) {
      const f = BLOCKS[tid].farm;
      const about = f === 'breaker' ? 'breaks the block in front of it each time its signal comes on' : f === 'placer' ? 'puts a block from the chest behind it in front of it each time its signal comes on'
        : machines.drillStatus(tx, ty, tz);
      toast(`${BLOCKS[tid].name}: ${about}`, 2500);
      return;
    }
    if (BLOCKS[tid].valve && !(held && isBlock(held.id))) { toast(`Valve: ${signalAt(tx, ty, tz) ? 'open (it has a signal)' : 'shut: give it a signal to let liquid through'}`, 2000); return; }
    if (BLOCKS[tid].elevator && !(held && isBlock(held.id))) { toast(`Bucket elevator: ${machines.liftStatus(world, kinetics, tx, ty, tz)}`, 2500); return; }
    if (BLOCKS[tid].sensor === 'gauge' && !(held && isBlock(held.id))) {
      const full = machines.toggleGauge(tx, ty, tz);
      sound.click();
      toast(full ? 'Storage gauge: signals when what it watches is full' : 'Storage gauge: signals while what it watches holds anything', 2500);
      return;
    }
    const handFree = !(held && isBlock(held.id));
    if (isElectricLamp(tid) && handFree) {
      sound.click();
      const sig = electric.toggleLampMode(tx, ty, tz);
      toast(sig ? 'Electric lamp: comes on only while it has a signal (a lever, daylight sensor...)' : 'Electric lamp: always on while it has power', 2500);
      return;
    }
    if (BLOCKS[tid].sensor === 'meter' && handFree) {
      sound.click();
      toast(machines.toggleMeter(tx, ty, tz) ? `Power meter: signals while there's power to spare. ${electric.statusAt(tx, ty, tz)}` : `Power meter: signals while the grid is short of power. ${electric.statusAt(tx, ty, tz)}`, 3000);
      return;
    }
    if (BLOCKS[tid].sensor === 'farm' && handFree) {
      const r = machines.farmReport(world, tx, ty, tz);
      sound.click();
      toast(r.total ? `Farm controller: ${r.total} wheat within ${FARM_REACH} blocks, ${r.ripe} ripe and ${r.growing} growing. It signals once half is ripe.` : `Farm controller: no wheat within ${FARM_REACH} blocks`, 3500);
      return;
    }
    if (BLOCKS[tid].sensor === 'daylight' && handFree) {
      sound.click();
      toast(machines.toggleDaylight(tx, ty, tz) ? 'Daylight sensor: signals by day' : 'Daylight sensor: signals at night (and in the dark under a roof)', 2500);
      return;
    }
    if (BLOCKS[tid].counter && handFree) {
      sound.click();
      toast(`Item counter: a pulse after every ${machines.cycleCounter(tx, ty, tz)} things that pass through it`, 2500);
      return;
    }
    if (BLOCKS[tid].quarry && handFree) { toast(`Quarry: ${machines.quarryStatus(tx, ty, tz)}`, 3000); return; }
    if (BLOCKS[tid].pad && handFree) {
      const p = machines.padPartner(tx, ty, tz);
      toast(`Teleport pad: ${p ? `paired with ${p[0]}, ${p[1]}, ${p[2]}` : 'not paired: put down another pad'}. ${electric.statusAt(tx, ty, tz)}`, 3000);
      return;
    }
    if (tid === SPAWNER && handFree) { toast('Monster spawner: brings out creatures while you\'re near, unless it has a signal. Trap them with cactus, lava or a long drop and collect what they leave', 4000); return; }
    if (BLOCKS[tid].electric && handFree) {
      // a generator or an electric lamp: how its electricity is doing
      const gen = BLOCKS[tid].electric.role === 'gen';
      toast(`${BLOCKS[tid].name}: ${electric.statusAt(tx, ty, tz)}${gen ? `. Its shaft: ${kinetics.statusAt(tx, ty, tz)}` : ''}`, 3000);
      return;
    }
    if (BLOCKS[tid].machine || BLOCKS[tid].kinetic) {
      // tap a machine (or a wheel or windmill) to see how it's running
      const what = BLOCKS[tid];
      let msg = kinetics.statusAt(tx, ty, tz);
      if ((tid >= DRILL && tid <= DRILL + 4) || what.harvester) if (powerAt(tx, ty, tz) > 0) msg = machines.drillStatus(tx, ty, tz);
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
  // grapes on a trellis plant a vine; a carrot or potato aimed at the top of soil is planted, not eaten
  if (held?.id === GRAPES && target?.id === TRELLIS) {
    if (![GRASS, DIRT].includes(world.get(target.x, target.y - 1, target.z))) { toast('The trellis needs to stand on grass or dirt for a vine to grow', 2000); return; }
    world.setBlock(target.x, target.y, target.z, GRAPE_VINE);
    notePlanting(target.x, target.y, target.z, GRAPE_VINE);
    sound.place('leaves'); inventory.consumeHeld(); return;
  }
  const plantsCrop = held && isCrop(ITEMS[held.id]?.places) && target?.ny === 1 && ([GRASS, DIRT].includes(target.id) || (target.id === SAND && BLOCKS[ITEMS[held.id].places].crop.sandy)) && world.get(target.x, target.y + 1, target.z) === AIR;
  if (held?.id === BANDAGE) { useBandage(); return; }
  if (held && !plantsCrop && (foodValue(held.id) || ITEMS[held.id]?.drink)) { eat(held.id); return; }
  if (held && ITEMS[held.id]?.tea) { drinkTea(held.id); return; }
  if (held?.id === PORTABLE_LAMP) { switchHandLamp(held); return; }
  if (held?.id === MAGNET_RING) { switchMagnet(held); return; }
  if (held && ITEMS[held.id]?.armour) { wearHeld(); return; }
  if (!target || !held) return;
  if (held.id === ROPE_LADDER) { hangRopeLadder(target); return; }
  if (held.id === ROPE_BRIDGE) { layBridge(target); return; }
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
  } else if (isWheat(id) || isCrop(id)) {
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
  } else if (isDoor(id)) {
    // a door stands on a block and takes two spaces; it faces you
    if (there !== AIR || target.ny !== 1 || world.get(x, y + 1, z) !== AIR) { toast('A door needs two free spaces on top of a block'); return; }
    if (player.overlapsBlock(x, y, z) || player.overlapsBlock(x, y + 1, z)) return;
    const f = facingTowardPlayer(x, z);
    world.setBlock(x, y, z, doorId(f, false, false, id));
    world.setBlock(x, y + 1, z, doorId(f, false, true, id));
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
  } else if (id === HANGING_PLANT || id === WINDOW_BOX) {
    // a basket hangs under a block; a window box hangs on the side of one
    const up = id === HANGING_PLANT;
    if (there !== AIR || !BLOCKS[target.id].solid || (up ? target.ny !== -1 : target.ny !== 0)) { toast(up ? 'A hanging basket hangs from the underside of a block' : 'A window box hangs on the side of a block'); return; }
    world.setBlock(x, y, z, up ? id : id + FACING_DIRS.findIndex(([dx, dz]) => dx === -target.nx && dz === -target.nz));
    sound.place('grass');
    inventory.consumeHeld();
    return;
  } else if (id === LANTERN || id === CHANDELIER) {
    // a lantern stands on a block or hangs under one; a chandelier hangs from a ceiling
    if (there !== AIR || !BLOCKS[target.id].solid || target.ny === 0 || (id === CHANDELIER && target.ny !== -1)) {
      toast(id === CHANDELIER ? 'A chandelier hangs from the underside of a block' : 'A lantern stands on a block or hangs under one'); return;
    }
    world.setBlock(x, y, z, id === LANTERN && target.ny === -1 ? HANGING_LANTERN : id);
    sound.place('stone');
    inventory.consumeHeld();
    return;
  } else if (id === PAINTING) {
    // hung on the side of a block: the biggest picture that fits there (a random one of those)
    if (there !== AIR || !BLOCKS[target.id].solid || target.ny !== 0) { toast('Paintings hang on the side of a block'); return; }
    const f = FACING_DIRS.findIndex(([dx, dz]) => dx === target.nx && dz === target.nz);
    const fits = (a) => paintingCells(x, y, z, f, ART[a].w, ART[a].h).every(([cx, cy, cz]) => (cx === x && cy === y && cz === z) ||
      (world.get(cx, cy, cz) === AIR && world.isSolid(cx - target.nx, cy, cz - target.nz)));
    const ok = ART.map((a, i) => i).filter(fits);
    const big = Math.max(...ok.map((a) => ART[a].w * ART[a].h));
    const pick = ok.filter((a) => ART[a].w * ART[a].h === big);
    const art = pick[Math.floor(Math.random() * pick.length)];
    world.setBlock(x, y, z, PAINTING + art * 4 + f);
    achieve('paint');
    sound.place('wood');
    inventory.consumeHeld();
    toast(`"${ART[art].name}"`, 1500);
    return;
  } else if (id === SWITCH_RAIL) {
    if (there !== AIR || target.ny !== 1 || !BLOCKS[target.id].solid) { toast('Rails go on top of a block'); return; }
    placeSwitchRail(x, y, z);
    sound.place('stone');
    inventory.consumeHeld();
    return;
  } else if (id === RAIL || id === POWERED_RAIL || id === LOADER_RAIL || id === ELECTRIC_RAIL || id === RAIL_STATION) {
    // rails lie on top of a block, and bend to join the rails next to them (loader rails just run straight)
    if (there !== AIR || target.ny !== 1 || !BLOCKS[target.id].solid) { toast('Rails go on top of a block'); return; }
    if (id === LOADER_RAIL || id === RAIL_STATION) world.setBlock(x, y, z, id + (facingTowardPlayer(x, z) % 2));
    else placeRail(x, y, z, id === ELECTRIC_RAIL ? 'electric' : id === POWERED_RAIL);
    sound.place('stone');
    inventory.consumeHeld();
    return;
  } else if (id === WIRE || id === ELECTRUM_WIRE || id === INVERTER || id === DELAY || id === LATCH || id === DETECTOR_RAIL) {
    // wire and logic blocks lie on top of a block; logic blocks pass their signal on the way you're looking
    if (there !== AIR || target.ny !== 1 || !BLOCKS[target.id].solid || BLOCKS[target.id].shape !== 'cube') {
      const wire = id === WIRE || id === ELECTRUM_WIRE;
      toast(`${BLOCKS[id].name}${wire ? '' : 's'} go${wire ? 'es' : ''} on top of a full block`); return;
    }
    if (id === DETECTOR_RAIL) id += facingTowardPlayer(x, z) % 2;
    else if (id !== WIRE && id !== ELECTRUM_WIRE) id += (facingTowardPlayer(x, z) + 2) % 4;
    world.setBlock(x, y, z, id);
    logic.near(world, x, y, z);
    signalChanged(x, y, z);
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
    if ([CHAIR, SCARECROW, COOK_POT, OVEN, SMELTER, BLAST_SMELTER, CRUSHER, PULVERIZER, E_SMELTER, CHEST, IRON_CHEST, SAW, TRIP_HAMMER, LEAD_CHEST, FREEZER, ARC_FURNACE, MARKET_STALL, FIREPLACE, SNOWMAN, KILN, WASHER].includes(id)) id += facingTowardPlayer(x, z); // the front faces you
    else if (id === DRILL) id += player.pitch < -0.75 ? 4 : (facingTowardPlayer(x, z) + 2) % 4; // drills the way you're looking
    else if (id === ITEM_COUNTER) id += ((facingTowardPlayer(x, z) + 2) % 4) * 2; // passes things on the way you're looking
    else if ([OBSERVER, GAUGE, HARVESTER, EJECTOR, TREE_FELLER, PLANTER, BREAKER, PLACER, QUARRY].includes(id)) id += (facingTowardPlayer(x, z) + 2) % 4; // looks (or reaps) the way you're looking
    else if (id === STEAM_ENGINE || id === ANIMAL_STATION) id += facingTowardPlayer(x, z); // its firebox door faces you
    else if (id === BELT || id === BELT_SPLITTER || id === BELT_SORTER) id += (facingTowardPlayer(x, z) + 2) % 4; // carries things away from you
    else if (id === HOPPER || id === COLLECTOR) id += target.ny === 1 ? 4 : FACING_DIRS.findIndex(([dx, dz]) => dx === -target.nx && dz === -target.nz); // into the block you tapped
    else if (BLOCKS[id].kinetic) id = kineticVariant(id);
    else if (id === CURTAIN) id += facingTowardPlayer(x, z) % 2; // facing 0/2 -> hangs across x, 1/3 -> across z
    else if (BLOCKS[id].stair) id += facingTowardPlayer(x, z); // you walk up them away from you
    else if (id === FENCE_GATE) id += facingTowardPlayer(x, z) % 2; // across your way
    else if (id === TRAPDOOR) id += target.ny === 0 ? FACING_DIRS.findIndex(([dx, dz]) => dx === -target.nx && dz === -target.nz) : (facingTowardPlayer(x, z) + 2) % 4; // hinged on the block you tap
    if (BLOCKS[id].solid && player.overlapsBlock(x, y, z)) return;
  }
  world.setBlock(x, y, z, id);
  logic.near(world, x, y, z); // (a block put down beside a wire or logic block can change what it gets)
  if (BLOCKS[id].lpipe) logistics.add(x, y, z);
  sound.place(BLOCKS[id].sound);
  inventory.consumeHeld();
  if (isWheat(id) || isCrop(id)) notePlanting(x, y, z, id);
  if (id === LIGHTHOUSE_LAMP) beaconSpots.add(`${x},${y},${z}`);
  if (id === TELEPAD) {
    const p = machines.padPlaced(x, y, z);
    toast(p ? `Teleport pad: paired with the pad at ${p[0]}, ${p[1]}, ${p[2]}` : 'Teleport pad: put down another one to pair it with this', 3000);
  }
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
    if (inventory.add(WATER_BUCKET, 1)) toast('Inventory full: dropped at your feet');
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
    if (inventory.add(LAVA_BUCKET, 1)) toast('Inventory full: dropped at your feet');
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
    const R = chargeRadius(world.get(x, y, z));
    if (!R) { removeFuse(k, f); continue; }
    f.t -= dt;
    f.mesh.material.opacity = (Math.sin(f.t * (f.t < 1 ? 30 : 12)) * 0.5 + 0.5) * 0.55; // flashing faster as it burns down
    if (f.t <= 0) { removeFuse(k, f); explode(x, y, z, R, R > BLAST_RADIUS ? 'You were caught in a demolition blast.' : undefined, true); }
  }
}
function removeFuse(k, f) {
  scene.remove(f.mesh);
  f.mesh.geometry.dispose();
  f.mesh.material.dispose();
  fuses.delete(k);
}
const blastable = (def) => def && !def.blastproof && !def.liquid && !def.station && !def.kinetic && def.hardness !== Infinity &&
  (def.shape === 'cube' || def.shape === 'cross' || def.shape === 'torch' || def.climb || def.sign || def.slab || def.stair || def.shape === 'fence' || def.shape === 'pane' || def.shape === 'wall');
// (v32: a demolition charge, linked to a detonator, blows a bigger hole)
const chargeRadius = (id) => (id === BLAST_CHARGE ? BLAST_RADIUS : id === DEMO_CHARGE || id === DEMO_CHARGE + 1 ? DEMO_RADIUS : 0);
// gather: a charge's blast throws you what it breaks (a meltdown or a meteorite just destroys)
// (v39: in multiplayer an explosion is sent on by whoever's game it went off in)
function explode(...args) { net.capture++; try { return explodeHere(...args); } finally { net.capture--; } }
function explodeHere(x, y, z, R = BLAST_RADIUS, cause = 'You stood too close to a blasting charge.', gather = false) {
  world.setBlock(x, y, z, AIR);
  const gathered = new Map(), span = Math.ceil(R);
  const near = gather && (x + 0.5 - player.pos.x) ** 2 + (y + 0.5 - player.pos.y) ** 2 + (z + 0.5 - player.pos.z) ** 2 < 24 * 24; // (a meltdown just destroys)
  const cleared = [];
  for (let dy = -span; dy <= span; dy++) for (let dz = -span; dz <= span; dz++) for (let dx = -span; dx <= span; dx++) {
    if (dx * dx + dy * dy + dz * dz > R * R) continue;
    const bx = x + dx, by = y + dy, bz = z + dz;
    const id = world.get(bx, by, bz);
    if (id === AIR) continue;
    if (chargeRadius(id)) { lightFuse(bx, by, bz, 0.25 + Math.random() * 0.2); continue; }
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
    toast(`Boom! ${[...gathered].map(([d, n]) => `+${n} ${itemName(d)}`).slice(0, 4).join(', ')}${lost ? ' (inventory full: the rest dropped at your feet)' : ''}`, 2200);
  }
  // the blast: a flash, a bang and a shove
  const dist = Math.hypot(x + 0.5 - player.pos.x, y + 0.5 - (player.pos.y + 0.9), z + 0.5 - player.pos.z);
  sound.boom(Math.max(0.15, 1 - dist / 40));
  flashBlast(x + 0.5, y + 0.5, z + 0.5);
  const reach = R + 2.9;
  if (dist < reach && !dead) {
    const len = dist || 1;
    player.kx = ((player.pos.x - x - 0.5) / len) * 10; player.kz = ((player.pos.z - z - 0.5) / len) * 10;
    player.vel.y = 6;
    damage(armoured(Math.round((reach - dist) * 3)), cause);
  }
  for (const m of mobs.mobs) {
    const d = Math.hypot(m.pos.x - x - 0.5, m.pos.y - y, m.pos.z - z - 0.5);
    if (d > reach) continue;
    if (m.spec.hostile) giveDrops(mobs.hurt(m, Math.round((reach - d) * 6), { x: x + 0.5, y, z: z + 0.5 }));
    else mobs.bump(m, { x: x + 0.5, y, z: z + 0.5 });
  }
}
// ---------- meteorites ----------
// Now and then on a clear night (no more than one a night) a meteorite streaks down somewhere near you. It
// blasts a crater and leaves a few lumps of meteorite rock in it: mine them (a tungsten pick or better) for
// meteoric iron, which the arc furnace makes into starsteel, the best metal there is.
const meteors = [];
let meteorNight = -1;
function tickMeteors(dt) {
  for (let i = meteors.length - 1; i >= 0; i--) {
    const m = meteors[i];
    m.t += dt;
    const k = Math.min(1, m.t / m.fall);
    m.mesh.position.set(m.from.x + (m.to.x - m.from.x) * k, m.from.y + (m.to.y - m.from.y) * k, m.from.z + (m.to.z - m.from.z) * k);
    m.trail.position.copy(m.mesh.position);
    m.trail.scale.setScalar(1 + k * 0.6);
    if (k < 1) continue;
    scene.remove(m.mesh, m.trail);
    meteors.splice(i, 1);
    landMeteor(m.to.x, m.to.y, m.to.z);
  }
  if (paused || dead || !sky.isNight || meteorNight === day || weather.raining || (mpOn() && !net.isHost)) return; // (v39: in multiplayer the host's sky has the meteors)
  if (Math.random() < dt / 600) { meteorNight = day; dropMeteor(); }
}
// Drop a meteorite (at (x, z), or somewhere 30-70 blocks away); returns where it'll land, or null.
function dropMeteor(x, z) {
  if (x === undefined) {
    const a = Math.random() * Math.PI * 2, d = 30 + Math.random() * 40;
    x = Math.floor(player.pos.x + Math.cos(a) * d); z = Math.floor(player.pos.z + Math.sin(a) * d);
  }
  if (!world.chunkAt(x, z)) return null;
  let y = H - 2;
  while (y > 1 && (world.get(x, y, z) === AIR || BLOCKS[world.get(x, y, z)]?.liquid)) y--;
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.9, 0.9), new THREE.MeshBasicMaterial({ color: 0xffe0a0 }));
  const trail = new THREE.Mesh(new THREE.SphereGeometry(1.4, 12, 8), new THREE.MeshBasicMaterial({ color: 0xff8a3a, transparent: true, opacity: 0.45, depthWrite: false }));
  const from = { x: x + 0.5 - 40, y: H + 40, z: z + 0.5 - 25 }, to = { x: x + 0.5, y: y + 1, z: z + 0.5 };
  mesh.position.set(from.x, from.y, from.z);
  scene.add(mesh, trail);
  meteors.push({ mesh, trail, from, to, t: 0, fall: 3.5 });
  sound.zap?.(0.25);
  const dx = x - player.pos.x, dz = z - player.pos.z;
  toast(`A meteorite streaks across the sky... it's coming down about ${Math.round(Math.hypot(dx, dz) / 10) * 10} blocks ${POINT_NAMES[pointOf(dx, dz)]}!`, 4000);
  return { x, y: y + 1, z };
}
function landMeteor(fx, fy, fz) {
  const x = Math.floor(fx), y = Math.floor(fy), z = Math.floor(fz);
  explode(x, y, z, 3, 'A meteorite fell on you.');
  // the rock that survived the fall, glowing in the bottom of the crater
  const lumps = 3 + Math.floor(Math.random() * 3), spots = [[0, 0, 0], [1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1], [0, 1, 0], [1, 0, 1]];
  // the floor of the crater at (cx, cz): the first open block above solid ground, searching down from the rim
  const floorAt = (cx, cz) => { let by = y + 2; while (by > 1 && world.get(cx, by - 1, cz) === AIR) by--; return world.get(cx, by, cz) === AIR ? by : -1; };
  for (let i = 0; i < lumps; i++) {
    const [dx, , dz] = spots[i], by = floorAt(x + dx, z + dz);
    if (by > 0) world.setBlock(x + dx, by, z + dz, METEORITE);
  }
  for (const [dx, dz] of [[2, 0], [-2, 0], [0, 2], [0, -2], [2, 2], [-2, -2]]) {
    const by = floorAt(x + dx, z + dz);
    if (by > 0 && Math.random() < 0.5) world.setBlock(x + dx, by, z + dz, OBSIDIAN);
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
      giveDrops([[c.loco ? LOCOMOTIVE : c.store ? STORAGE_CART : MINECART, 1], ...(c.loco?.coal ? [[COAL, c.loco.coal]] : []),
        ...(c.store?.inputs ?? []).filter(Boolean).map((it) => [it.id, it.count])]);
    }
    crack.visible = false;
    return;
  }
  if (controls.breaking && targetVehicle) {
    breakState.cart = (breakState.cart ?? 0) + dt;
    if (breakState.cart >= 0.5) {
      const v = targetVehicle.v;
      vehicles.remove(v);
      targetVehicle = null;
      breakState.cart = 0;
      if (v.store && openStationAt?.cart?.store === v.store) closeStation();
      giveDrops([[v.kind === 'boat' ? (v.store ? CHEST_BOAT : v.fast ? POLYMER_BOAT : BOAT) : BALLOON, 1], ...(v.store?.inputs ?? []).filter(Boolean).map((it) => [it.id, it.count])]);
    }
    crack.visible = false;
    return;
  }
  breakState.cart = 0;
  if (!controls.breaking) breakState.mobCooldown = 0.5;
  breakState.mobCooldown = Math.max(0, breakState.mobCooldown - dt);
  if (controls.breaking && !breakState.mobCooldown && swatBat()) { breakState.mobCooldown = 0.5; breakState.key = ''; breakState.progress = 0; crack.visible = false; return; }
  if (controls.breaking && targetMob) {
    if (!breakState.mobCooldown) { hitMob(); breakState.mobCooldown = 0.5; }
    breakState.key = ''; breakState.progress = 0;
    crack.visible = false;
    return;
  }
  if (controls.breaking && inventory.heldId() === COPY_WAND) { resetWand(); crack.visible = false; return; } // holding the wand still clears it
  if (!controls.breaking || !target) {
    breakState.key = ''; breakState.progress = 0; breakState.tick = 0;
    crack.visible = false;
    return;
  }
  const key = `${target.x},${target.y},${target.z}`;
  if (key !== breakState.key) { breakState.key = key; breakState.progress = 0; }
  if (inventory.heldId() === SPANNER && spannerable(BLOCKS[target.id])) {
    // holding the spanner on a machine takes it up, with what's inside it
    breakState.progress += dt / SPANNER_TIME;
    if (breakState.progress >= 1) { spannerTake(target.x, target.y, target.z); breakState.key = ''; breakState.progress = 0; crack.visible = false; target = null; }
    return;
  }
  const held = toolHeld();
  const t = breakTime(target.id, held);
  if (!isFinite(t)) { crack.visible = false; return; }
  if (creative) breakState.progress += dt / 0.12; // creative: everything breaks at once (one block every so often)
  else breakState.progress += dt * (effects.haste > 0 ? 1.5 : 1) * (hasEnch(inventory.held(), 'swift') ? 1.4 : 1) / Math.max(t, 0.05);
  breakState.tick = (breakState.tick || 0) - dt;
  if (breakState.tick <= 0) { sound.dig(BLOCKS[target.id].sound); breakState.tick = 0.24; swingArm(); }
  if (breakState.progress >= 1) {
    const hit = target;
    net.capture++;
    try {
      breakBlock(target.x, target.y, target.z);
      if (held === ELECTRIC_DRILL) drillAround(hit);
    } finally { net.capture--; }
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

// The electric drill digs out the 8 blocks round the one you dig as well (across the face you're digging),
// if they're plain rock or earth no slower to dig, while it has charge.
function drillAround(hit) {
  const [ua, ub] = hit.nx ? [[0, 1, 0], [0, 0, 1]] : hit.ny ? [[1, 0, 0], [0, 0, 1]] : [[1, 0, 0], [0, 1, 0]];
  const limit = breakTime(hit.id, ELECTRIC_DRILL) * 1.5 + 0.05;
  for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) {
    if (!a && !b) continue;
    if (toolHeld() !== ELECTRIC_DRILL) return; // (run flat)
    const x = hit.x + ua[0] * a + ub[0] * b, y = hit.y + ua[1] * a + ub[1] * b, z = hit.z + ua[2] * a + ub[2] * b;
    const id = world.get(x, y, z);
    if (!machines.quarryable(id) || id === LOOT_CHEST || !(breakTime(id, ELECTRIC_DRILL) <= limit)) continue;
    breakBlock(x, y, z);
  }
}

// Remove a block, collecting what it drops with the held item.
function breakBlock(x, y, z) {
  const id = world.get(x, y, z);
  const def = BLOCKS[id];
  if (!def || id === AIR) return;
  sound.breakBlock(def.sound);
  const tool = toolHeld();
  let drops = dropsFor(id, tool);
  if (spannerPack >= 0) drops = [[typeof def.drop === 'number' && def.drop ? def.drop : def.variantOf || id, 1]]; // taken up with a spanner
  else if (id === WHEAT_3 || def.crop?.ripe) drops = fineHarvest(drops, x, y, z);
  if (id === LOOT_CHEST) drops.push(...rollLoot(x, y, z));
  if (tool === ELECTRIC_DRILL && def.hardness > 0) drawCharge(inventory.held(), CHARGE_USE.drill);
  if (tool === JACKHAMMER && def.hardness > 0) {
    // the jackhammer uses a little charge for each block, and now and then shakes some dust off an ore as well
    drawCharge(inventory.held(), CHARGE_USE.jackhammer);
    if (drops.length && ORES.some((o) => o.id === id && o.ingot) && Math.random() < JACK_DUST) drops.push([dirtyDust(id), 1]);
  }
  // a Lucky pickaxe now and then turns up a second ore
  if (hasEnch(inventory.held(), 'lucky') && drops.length && ORES.some((o) => o.id === id) && Math.random() < 1 / 3) drops.push([drops[0][0], 1]);
  if (ITEMS[inventory.heldId()]?.tool?.type === def.tool && def.hardness > 0) wearOutHeld(1);
  if (isDoor(id)) {
    // either half takes the whole door with it
    const oy = def.upper ? y - 1 : y + 1;
    if (isDoor(world.get(x, oy, z))) world.setBlock(x, oy, z, AIR);
    drops = [[def.doorBase, 1]];
  }
  if (isLamp(id)) lamps.delete(lampKey(x, y, z));
  if (isSign(id)) signs.remove(x, y, z);
  if (isSign(id) || isBed(id)) { dropWaypoint(x, y, z); dropWaypoint(...bedPartnerOr(x, y, z, id)); }
  if (isFrame(id) || isDisplay(id)) { const item = frames.remove(x, y, z); if (item) drops.push([item, 1]); }
  if (id === ZIP_POST) drops.push(...unlinkZips(x, y, z));
  if (id === LIGHTHOUSE_LAMP) beaconSpots.delete(`${x},${y},${z}`);
  if (stationKind(id)) loose.spill(stations.removeStacks(x, y, z), x, y, z); // whatever was inside spills out
  if (def.lpipe) logistics.remove(x, y, z);
  if (def.station === 'bottler') machines.tanks.delete(`${x},${y},${z}`); // (the liquid in it is lost)
  if (isElectricLamp(id)) electric.signalLamps.delete(`${x},${y},${z}`);
  if (def.machine || def.engine || def.sensor || def.ejector || def.hopper || def.tank || def.farm || def.quarry || def.pad || def.spawner) loose.spill(machines.removeAt(x, y, z).map(([i, n, st]) => ({ id: i, count: n, ...st })), x, y, z); // and whatever was on a belt or in a drill
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
  const felled = id === LOG && ITEMS[tool]?.tool?.type === 'axe' ? treeAbove(x, y, z) : [];
  if (tool === CHAINSAW && def.hardness > 0) {
    // the chainsaw uses charge for each log it cuts, and leaves sawdust besides
    drawCharge(inventory.held(), CHARGE_USE.chainsaw * (1 + felled.length));
    if (id === LOG) drops.push([SAWDUST, 1 + felled.length]);
    sound.saw();
  }
  world.setBlock(x, y, z, id === ICE ? WATER : AIR); // ice melts into water
  if (def.switch) signalChanged(x, y, z);
  if (def.logic) logic.removed(x, y, z);
  logic.near(world, x, y, z);
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
  if (creative) {
    // creative: blocks you break aren't collected (the palette has them all)
  } else if (drops.length) {
    let lost = 0;
    for (const [d, n] of drops) lost += spannerPack > 0 && d === drops[0][0] && n === 1 ? inventory.addItem({ id: d, count: 1, pack: spannerPack }) : inventory.add(d, n);
    if (lost) toast('Inventory full: dropped at your feet');
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
      if (isLeaves(id)) leafy = true;
      else if (id === LOG && logs.length < MAX_FELL) { logs.push([nx, ny, nz]); queue.push([nx, ny, nz]); }
    }
  }
  return leafy ? logs.sort((a, b) => b[1] - a[1]) : [];
}

// Things resting on a block that was just removed pop off into the inventory: torches standing on
// it or hanging from it, wheat growing on it, and a whole column of sugar cane above it.
function dropUnsupported(x, y, z) {
  // a stalactite hanging from it comes down; a stalagmite standing on it pops off
  if (BLOCKS[world.get(x, y - 1, z)]?.stalactite) loosenStalactite(x, y - 1, z, 0.25);
  if (world.get(x, y + 1, z) === STALAGMITE) { world.setBlock(x, y + 1, z, AIR); giveDrops([[STALAGMITE, 1]]); }
  // a bridge's rope rails go with its deck; a rope ladder rolls up from where it was cut (or lost its hold)
  if (BLOCKS[world.get(x, y + 1, z)]?.name === 'Rope Rail') world.setBlock(x, y + 1, z, AIR);
  if (BLOCKS[world.get(x, y - 1, z)]?.ropeLadder) rollUpRope(x, y - 1, z);
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
    if (id === ROPE_LADDER + f) { rollUpRope(x + dx, y, z + dz); return; }
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
    if (onTop.logic) logic.removed(x, y + 1, z);
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
    inventory.add(BLOCKS[above].doorBase, 1);
  }
  for (let ty = y + 1; ty < H; ty++) {
    const id = world.get(x, ty, z);
    if (!isWheat(id) && id !== SUGAR_CANE && id !== SAPLING && !isFlower(id) && id !== BERRY_BUSH && id !== BERRY_BUSH + 1) break;
    for (const [d, n] of dropsFor(id, 0)) inventory.add(d, n);
    world.setBlock(x, ty, z, AIR);
    if (id !== SUGAR_CANE) break;
  }
}

// ---------- multiplayer (v38) ----------
// Joining a server plays its world in a slot of its own (your worlds are left alone). The server gives the
// seed and every block players have changed; the rest the game builds itself, as usual. Blocks you place or
// break go to the server and on to everyone else. (Stage 1: what's inside chests and machines, creatures,
// and water and plants growing are each player's own.)
const pendingEdits = new Map(); // chunk key -> [[x, y, z, id]] for parts of the world not loaded yet
let pendingTimer = 0, netApplying = false;
{
  const set = World.prototype.setBlock;
  // v39: in multiplayer, a change your game makes by itself (a crop growing, a leaf falling, a machine at work,
  // a fire spreading) only happens where your game runs that part of the world, and then goes to everyone;
  // elsewhere it comes from the game that does run it. What you do yourself always happens and goes to
  // everyone. Running water is left to each game: from the same blocks it flows the same way everywhere.
  World.prototype.setBlock = function (x, y, z, id) {
    if (this !== world || netApplying || !worldReady || !mpOn() || this.flowing) { set.call(this, x, y, z, id); return; }
    const mine = net.capture > 0;
    if (!mine && !ownsSpot(x, z)) return;
    set.call(this, x, y, z, id);
    net.send({ t: 'block', x, y, z, id: this.get(x, y, z) });
  };
}
function mpDefaultUrl() {
  if (!/^https?:$/.test(location.protocol)) return 'ws://localhost:8080/mc';
  return `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/mc`;
}
function mpUrl(text) {
  let u = String(text || '').trim() || mpDefaultUrl();
  if (/^https?:\/\//i.test(u)) u = u.replace(/^http/i, 'ws');
  if (!/^wss?:\/\//i.test(u)) u = `ws://${u}`;
  if (!/\/mc\/?$/.test(new URL(u).pathname)) u = u.replace(/\/?$/, '/mc');
  return u;
}
function openMp() {
  $('menu').classList.add('hidden');
  $('mp').classList.remove('hidden');
  paused = true; controls.reset(); document.exitPointerLock?.();
  $('mp-url').value = settings.mpUrl || mpDefaultUrl();
  $('mp-name').value = settings.mpName || '';
  renderMp();
}
function closeMp() { $('mp').classList.add('hidden'); paused = false; }
function renderMp() {
  const on = activeSlot === MP_SLOT;
  $('btn-mp-join').classList.toggle('hidden', net.live);
  $('btn-mp-leave').classList.toggle('hidden', !on);
  $('btn-chat').classList.toggle('hidden', !net.live);
  const names = [...net.remotes.values()].map((r) => r.name);
  $('mp-players').textContent = net.live ? (names.length ? `Also here: ${names.join(', ')}` : 'Nobody else is here yet') : '';
}
function mpStatus(st, why) {
  const text = { connecting: 'Connecting…', open: `Connected to ${net.url}`, failed: 'Could not reach the server (is it running, and is the address right?)', lost: 'Lost the connection to the server: you\'re playing on your own copy now. Join again to carry on together.', left: 'Not connected', full: 'The server is full', error: `That address doesn't work${why ? ` (${why})` : ''}` }[st] ?? st;
  $('mp-status').textContent = text;
  if (st === 'lost' || st === 'failed' || st === 'full') toast(text, 4000);
  renderMp();
}
$('btn-mp').addEventListener('click', openMp);
$('btn-close-mp').addEventListener('click', closeMp);
$('btn-mp-join').addEventListener('click', () => {
  let url;
  try { url = mpUrl($('mp-url').value); } catch { mpStatus('error'); return; }
  settings.mpUrl = $('mp-url').value.trim(); settings.mpName = $('mp-name').value.trim().slice(0, 20); saveSettings();
  net.connect(url, settings.mpName || 'Player', settings.look);
});
$('btn-mp-leave').addEventListener('click', () => mpLeave());
async function mpWelcome(m) {
  saveGame(); await world?.saveChunks();
  const key = saveKeyOf(MP_SLOT);
  let save = loadSave(key);
  if (!save || save.seed !== m.seed || save.mpWorld !== m.world) {
    try { localStorage.removeItem(key); } catch { /* storage unavailable */ }
    await store.clear(MP_SLOT);
    save = { seed: m.seed, mpWorld: m.world };
  }
  worldReady = false;
  activeSlot = MP_SLOT; store.setSlot(MP_SLOT);
  pendingEdits.clear();
  for (const [x, y, z, id] of m.edits ?? []) queueEdit(x, y, z, id);
  $('mp').classList.add('hidden'); $('menu').classList.add('hidden');
  await startWorld(save);
  applyPending(true);
  applyKvAll(m.kv);
  if (m.clock && !net.isHost) applyClock({ ...m.clock, why: 'join' });
  if (net.isHost && m.clock) { sky.time = m.clock.time; day = Math.max(1, m.clock.day | 0); weather.set(m.clock.raining, Math.max(10, m.clock.timer || 60), m.clock.storm); applySeason(); }
  toast(`Joined the server${net.remotes.size ? ` (${net.remotes.size} other${net.remotes.size === 1 ? '' : 's'} here)` : ''}. Press ${keyLabel(controls.binds.chat)} to chat.`, 3500);
  renderMp();
}
async function mpLeave() {
  net.leave();
  pendingEdits.clear();
  closeMp();
  if (activeSlot === MP_SLOT) await switchSlot(settings.slot, loadSave(saveKeyOf(settings.slot)));
  renderMp();
}
function queueEdit(x, y, z, id) {
  const k = chunkKey(Math.floor(x / CHUNK), Math.floor(z / CHUNK));
  let list = pendingEdits.get(k);
  if (!list) pendingEdits.set(k, (list = []));
  list.push([x, y, z, id]);
}
function applyEdit(x, y, z, id) {
  if (world.get(x, y, z) === id) return;
  netApplying = true;
  try { world.setBlock(x, y, z, id); } finally { netApplying = false; }
}
function mpBlock(x, y, z, id) {
  if (activeSlot !== MP_SLOT || !worldReady) { queueEdit(x, y, z, id); return; }
  if (world.chunkAt(x, z)) applyEdit(x, y, z, id); else queueEdit(x, y, z, id);
}
// edits waiting for their part of the world to load
function applyPending(now = false) {
  if (!pendingEdits.size || activeSlot !== MP_SLOT || !world) return;
  for (const [k, list] of pendingEdits) {
    const [x, , z] = list[0];
    if (!world.chunkAt(x, z)) continue;
    for (const [ex, ey, ez, id] of list) applyEdit(ex, ey, ez, id);
    pendingEdits.delete(k);
  }
}
// v39: who runs what. Each part of the world is run by the game of the player nearest it (by chunk; on a tie,
// whoever joined first): its machines cook, its plants grow and its creatures roam there, and it tells the
// others. So a base far from everyone else still works while its builder is there.
const mpOn = () => net.live && activeSlot === MP_SLOT;
function ownsSpot(x, z) {
  if (!mpOn()) return true;
  const cx = Math.floor(x / CHUNK) * CHUNK + 8, cz = Math.floor(z / CHUNK) * CHUNK + 8;
  const mine = (player.pos.x - cx) ** 2 + (player.pos.z - cz) ** 2;
  for (const [id, r] of net.remotes) {
    if (!r.pos) continue;
    const d = (r.target.x - cx) ** 2 + (r.target.z - cz) ** 2;
    if (d < mine - 4 || (Math.abs(d - mine) <= 4 && id < net.id)) return false;
  }
  return true;
}
stations.owns = (x, z) => ownsSpot(x, z);

// v39: what's in chests and machines, the writing on signs and what's in item frames is shared. Every half
// second each game looks for any that changed since it last sent or heard of them, and sends those.
const kvKnown = { st: new Map(), sign: new Map(), frame: new Map() };
const KV = {
  st: {
    entries: () => stations.map,
    apply: (k, v) => { stations.setOne(k, v); return stations.map.get(k); },
  },
  sign: {
    entries: () => new Map([...signs.texts].map(([k, t]) => [k, [t, signs.colors.get(k) ?? null]])),
    apply: (k, v) => {
      const [x, y, z] = k.split(',').map(Number);
      if (!v) { signs.remove(x, y, z); return undefined; }
      signs.set(x, y, z, String(v[0] ?? ''));
      if (Number.isInteger(v[1])) signs.colors.set(k, v[1]); else signs.colors.delete(k);
      return [signs.texts.get(k), signs.colors.get(k) ?? null];
    },
  },
  frame: {
    entries: () => frames.items,
    apply: (k, v) => { if (Number.isInteger(v) && v > 0) frames.items.set(k, v); else frames.items.delete(k); return frames.items.get(k); },
  },
};
const kvKey = (v) => (v === undefined || v === null ? '' : JSON.stringify(v));
function applyKv(ch, k, v) {
  if (!KV[ch] || activeSlot !== MP_SLOT) return;
  const got = KV[ch].apply(k, v);
  if (got === undefined || got === null) kvKnown[ch].delete(k); else kvKnown[ch].set(k, kvKey(got));
  if (ch === 'st' && openStationAt && !openStationAt.cart && `${openStationAt.x},${openStationAt.y},${openStationAt.z}` === k) {
    if (v) renderStation(); else closeStation();
  }
}
function applyKvAll(all) {
  for (const ch of Object.keys(kvKnown)) {
    kvKnown[ch].clear();
    for (const [k, v] of Object.entries(all?.[ch] ?? {})) applyKv(ch, k, v);
  }
}
let kvTimer = 0;
function tickKv(dt) {
  const t = performance.now(); // (real time, so a slow frame rate doesn't hold things up)
  if (!mpOn() || !worldReady || t < kvTimer) return;
  kvTimer = t + 500;
  for (const ch of Object.keys(KV)) {
    const known = kvKnown[ch], now = KV[ch].entries();
    for (const [k, v] of now) {
      const s = kvKey(v);
      if (known.get(k) === s) continue;
      known.set(k, s);
      net.send({ t: 'kv', ch, k, v });
    }
    for (const k of [...known.keys()]) {
      if (now.has(k)) continue;
      const [x, , z] = k.split(',').map(Number);
      if (!world.chunkAt(x, z)) continue; // (not gone: just not loaded here)
      known.delete(k);
      net.send({ t: 'kv', ch, k, v: null });
    }
  }
}

// The host's game keeps the clock and the weather and sends them every couple of seconds (and at once when
// something changes); everyone else follows. (Each game still moves its own sun smoothly in between.)
let clockTimer = 0, lastClock = '';
function sendClock(why = '') {
  net.send({ t: 'clock', time: sky.time, day, raining: weather.raining, storm: !!weather.storm, timer: weather.timer, why });
  lastClock = `${day},${weather.raining},${!!weather.storm}`;
  clockTimer = performance.now() + 2000;
}
function applyClock(c) {
  if (activeSlot !== MP_SLOT || !worldReady || net.isHost) return;
  const ahead = c.at ? Math.min(5, Math.max(0, (Date.now() - c.at) / 1000)) / DAY_LENGTH : 0; // (time on its way)
  const t = (c.time + ahead) % 1;
  let dt = t - sky.time; if (dt > 0.5) dt -= 1; if (dt < -0.5) dt += 1;
  if (Math.abs(dt) > 0.002 || c.why) sky.time = t;
  if (c.day !== day) {
    const was = day;
    day = Math.max(1, c.day | 0); caneToday = 0;
    if (day > was) { const turned = seasonOf(day) !== seasonOf(was); toast(turned ? `Day ${day}: ${SEASONS[seasonOf(day)].arrives}` : `Day ${day}`, turned ? 4000 : 2500); }
    applySeason();
  }
  if (c.raining !== weather.raining || !!c.storm !== !!weather.storm) weather.set(c.raining, 1e9, c.storm);
  else weather.timer = 1e9; // (only the host's weather changes by itself)
  if (c.why === 'slept') toast('The night was slept through', 2000);
}
function tickClock(dt) {
  if (!net.isHost || activeSlot !== MP_SLOT || !worldReady) return;
  const now = `${day},${weather.raining},${!!weather.storm}`;
  if (performance.now() > clockTimer || now !== lastClock) sendClock();
}
function tickNet(dt) {
  tickClock(dt);
  tickKv(dt);
  if ((pendingTimer -= dt) <= 0) { pendingTimer = 0.4; applyPending(); }
  const p = player.pos;
  net.update(dt, net.live && activeSlot === MP_SLOT && !dead ? {
    pos: p, yaw: player.yaw, pitch: player.pitch, held: inventory.heldId(), speed: Math.hypot(player.vel.x, player.vel.z),
    swimming: player.inWater && !player.onGround, onGround: player.onGround,
  } : null, (pos) => {
    const x = Math.floor(pos.x), y = Math.min(H - 1, Math.max(0, Math.floor(pos.y + 1.2))), z = Math.floor(pos.z);
    return { sun: lightUniforms.uDay.value * skyBrightness(world.skyAt(x, y, z)), torch: lightBrightness(world.lightAt(x, y, z)) * lightUniforms.uFlicker.value, ambient: lightUniforms.uAmbient.value };
  });
}
// chat: T (or the 💬 button) opens a line to type in; the last few messages show for a while
function addChat(name, text, mine = false) {
  const log = $('chat-log'), d = document.createElement('div');
  if (name) { const b = document.createElement('b'); b.textContent = `${name}${mine ? ' (you)' : ''}: `; d.append(b); }
  d.append(document.createTextNode(text));
  if (!name) d.style.fontStyle = 'italic';
  log.append(d);
  while (log.children.length > 8) log.firstChild.remove();
  setTimeout(() => d.classList.add('fade'), 10000);
  setTimeout(() => d.remove(), 11200);
  renderMp();
}
function openChat() {
  if (!net.live) { toast('Chat is for multiplayer: Menu → Multiplayer'); return; }
  const inp = $('chat-input');
  inp.classList.remove('hidden');
  controls.reset();
  setTimeout(() => inp.focus(), 0);
}
function closeChat() { const inp = $('chat-input'); inp.value = ''; inp.classList.add('hidden'); inp.blur(); }
$('chat-input').addEventListener('keydown', (e) => {
  e.stopPropagation();
  if (e.key === 'Enter') { const t = e.target.value.trim(); if (t) net.send({ t: 'chat', text: t }); closeChat(); }
  else if (e.key === 'Escape') closeChat();
});
$('chat-input').addEventListener('blur', () => setTimeout(closeChat, 150));
$('btn-chat').addEventListener('click', openChat);

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
function updateRefillLabel() { inventory.autoRefill = settings.autoRefill !== false; $('btn-refill').textContent = `Auto-refill hotbar: ${inventory.autoRefill ? 'on' : 'off'}`; }
updateRefillLabel();
$('btn-refill').addEventListener('click', () => { settings.autoRefill = settings.autoRefill === false; updateRefillLabel(); saveSettings(); });
updateWearLabel();
$('btn-wear').addEventListener('click', () => { settings.wear = !settings.wear; updateWearLabel(); saveSettings(); });
$('btn-save').addEventListener('click', () => toast(saveGame() ? 'World saved' : 'Could not save (storage unavailable)'));
$('btn-worlds').addEventListener('click', openWorlds);
$('btn-close-worlds').addEventListener('click', closeWorlds);
$('btn-open-map').addEventListener('click', () => { $('menu').classList.add('hidden'); openMap(); });
$('btn-guide').addEventListener('click', () => { $('menu').classList.add('hidden'); openGuide(); });
$('btn-keys').addEventListener('click', () => { $('menu').classList.add('hidden'); $('keys').classList.remove('hidden'); renderKeys(); });
$('btn-close-keys').addEventListener('click', () => { controls.capture = null; $('keys').classList.add('hidden'); $('menu').classList.remove('hidden'); });
$('btn-keys-reset').addEventListener('click', () => { settings.keys = {}; applyKeys(); saveSettings(); renderKeys(); });
$('btn-mode').addEventListener('click', () => {
  creative = !creative;
  applyCreative();
  toast(creative ? 'Creative mode: no harm, no hunger, and every block in 🎒' : 'Survival mode', 2200);
  saveGame();
});
$('fov').value = settings.fov;
function applyFov() {
  camera.fov = settings.fov;
  camera.updateProjectionMatrix();
  $('fov-label').textContent = `Field of view: ${settings.fov}°`;
}
applyFov();
$('fov').addEventListener('input', (e) => { settings.fov = +e.target.value; applyFov(); saveSettings(); });
$('version').textContent = `Version ${GAME_VERSION}`;
function updateBreakLabel() { $('btn-break').textContent = `Touch breaking: ${settings.doubleTap ? 'double-tap & hold' : 'hold'}`; }
updateBreakLabel();
$('btn-break').addEventListener('click', () => { settings.doubleTap = !settings.doubleTap; controls.doubleTapBreak = settings.doubleTap; updateBreakLabel(); saveSettings(); });
function updateTipsLabel() { $('btn-tips').textContent = `Tooltips: ${settings.tips ? 'on' : 'off'}`; }
updateTipsLabel();
// (v38) your character's colours: each button steps through its part's colours
function updateLookButtons() {
  for (const part of Object.keys(LOOKS)) {
    const b = $(`btn-look-${part}`);
    const c = LOOKS[part][settings.look[part] % LOOKS[part].length];
    if (b) b.style.boxShadow = `inset 0 -6px 0 #${c.toString(16).padStart(6, '0')}`;
  }
}
for (const part of Object.keys(LOOKS)) {
  $(`btn-look-${part}`)?.addEventListener('click', () => {
    settings.look[part] = ((settings.look[part] ?? 0) + 1) % LOOKS[part].length;
    avatar.setLook(settings.look); viewmodel.setLook(settings.look);
    updateLookButtons(); saveSettings();
  });
}
updateLookButtons();
function updateGfxLabels() {
  const g = settings.gfx;
  $('btn-gfx-shadows').textContent = `Sun shadows: ${SHADOW_LEVELS[g.shadows]}`;
  $('torch-shadows').value = g.torches;
  $('torch-shadows-label').textContent = `Torch shadows: ${g.torches ? `nearest ${g.torches}` : 'off'}`;
  $('torch-rate').value = g.torchRate;
  $('torch-rate-label').textContent = `Torch shadows redrawn per frame: ${g.torchRate}`;
  for (const key of GFX_TOGGLES) { const b = $(`btn-gfx-${key}`); if (b) b.textContent = `${GFX_NAMES[key]}: ${g[key] ? 'on' : 'off'}`; }
}
updateGfxLabels();
// v38: presets. Picking one sets everything below; touching any one setting makes it Custom. Auto keeps
// stepping up or down a level to hold a smooth frame rate.
const PRESET_CYCLE = ['auto', ...PRESET_ORDER, 'custom'];
const autoGfx = { level: 2, ceiling: 4, timer: 8, fps: [], good: 0 };
function applyPreset(name, quiet = false) {
  const g = GFX_PRESETS[name === 'auto' ? PRESET_ORDER[autoGfx.level] : name];
  if (g) for (const [k, v] of Object.entries(g)) { settings.gfx[k] = v; gfx.set(k, v); }
  updateGfxLabels(); saveSettings();
  if (!quiet && name === 'auto') toast(`Graphics: Auto (${PRESET_NAMES[PRESET_ORDER[autoGfx.level]]} for now)`, 2000);
}
function updatePresetLabel() {
  const p = settings.gfxPreset;
  $('btn-gfx-preset').textContent = `Graphics preset: ${PRESET_NAMES[p] ?? 'Custom'}${p === 'auto' ? ` (${PRESET_NAMES[PRESET_ORDER[autoGfx.level]]})` : ''}`;
}
function goCustom() { if (settings.gfxPreset !== 'custom') { settings.gfxPreset = 'custom'; updatePresetLabel(); } }
$('btn-gfx-preset').addEventListener('click', () => {
  const i = PRESET_CYCLE.indexOf(settings.gfxPreset);
  let next = PRESET_CYCLE[(i + 1) % PRESET_CYCLE.length];
  if (next === 'custom') next = PRESET_CYCLE[0];
  settings.gfxPreset = next;
  if (next === 'auto') { autoGfx.level = 2; autoGfx.ceiling = 4; autoGfx.timer = 6; autoGfx.fps = []; autoGfx.good = 0; }
  applyPreset(next); updatePresetLabel();
});
// Auto: watch the frame rate while playing; below 40 fps step down a level (and don't climb back above
// it), comfortably above 57 for a while step up.
function tickAutoGfx(dt) {
  if (settings.gfxPreset !== 'auto' || paused || dead || document.hidden) return;
  if (perf.fps) autoGfx.fps.push(perf.fps);
  if ((autoGfx.timer -= dt) > 0) return;
  autoGfx.timer = 5;
  const f = autoGfx.fps.sort((a, b) => a - b), med = f[f.length >> 1] ?? 60;
  autoGfx.fps = [];
  if (f.length < 4) return;
  let to = autoGfx.level;
  if (med < 40 && to > 0) { to--; autoGfx.ceiling = to; autoGfx.good = 0; }
  else if (med > 57 && to < autoGfx.ceiling) { if (++autoGfx.good >= 2) { to++; autoGfx.good = 0; } }
  else autoGfx.good = 0;
  if (to !== autoGfx.level) {
    autoGfx.level = to; applyPreset('auto', true); updatePresetLabel();
    toast(`Graphics: ${PRESET_NAMES[PRESET_ORDER[to]]} (auto, ${med} fps)`, 1800);
  }
}
updatePresetLabel();
if (settings.gfxPreset === 'auto') applyPreset('auto', true);
$('torch-shadows').addEventListener('input', (e) => { goCustom(); settings.gfx.torches = +e.target.value; gfx.set('torches', settings.gfx.torches); updateGfxLabels(); saveSettings(); });
$('torch-rate').addEventListener('input', (e) => { goCustom(); settings.gfx.torchRate = +e.target.value; gfx.set('torchRate', settings.gfx.torchRate); updateGfxLabels(); saveSettings(); });
$('btn-gfx-shadows').addEventListener('click', () => { goCustom(); settings.gfx.shadows = (settings.gfx.shadows + 1) % 3; gfx.set('shadows', settings.gfx.shadows); updateGfxLabels(); saveSettings(); });
for (const key of GFX_TOGGLES) {
  $(`btn-gfx-${key}`)?.addEventListener('click', () => { goCustom(); settings.gfx[key] = !settings.gfx[key]; gfx.set(key, settings.gfx[key]); updateGfxLabels(); saveSettings(); });
}
$('btn-tips').addEventListener('click', () => { settings.tips = !settings.tips; updateTipsLabel(); saveSettings(); if (!settings.tips) $('inv-tip').classList.remove('show'); });
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
$('music').value = settings.music;
$('music').addEventListener('input', (e) => { settings.music = +e.target.value; music.volume = settings.music / 100; saveSettings(); });
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
const downBtn = $('btn-down');
const setDown = (v) => (e) => { e.preventDefault(); controls.downTouch = v; };
downBtn.addEventListener('touchstart', setDown(true), { passive: false });
downBtn.addEventListener('touchend', setDown(false), { passive: false });
downBtn.addEventListener('touchcancel', setDown(false), { passive: false });
downBtn.addEventListener('mousedown', setDown(true));
downBtn.addEventListener('mouseup', setDown(false));
$('btn-fly').addEventListener('click', () => toggleFly());
$('map').addEventListener('click', () => { if (!paused) openMap(); });

// ---------- init ----------
player = null;
controls = null;
{
  // Player must exist before Controls; startWorld gives it the real world.
  player = new Player(null);
  controls = new Controls($('touch-layer'), player, {
    place: () => { swingArm(); net.capture++; try { return place(); } finally { net.capture--; } },
    openChat,
    toggleView: () => { if (photoMode || dead) return; viewMode = (viewMode + 1) % 3; toast(VIEW_NAMES[viewMode], 1000); },
    selectSlot,
    scrollSlot: (d) => selectSlot((inventory.selected + d + 9) % 9),
    toggleInventory,
    toggleMap: () => (worldMap.open ? closeMap() : !paused && !dead && !photoMode && openMap()),
    toggleGuidebook: () => ($('guidebook').classList.contains('hidden') ? openGuidebook() : closeGuidebook()),
    toggleFly,
    throwItem: (all) => !photoMode && throwHeld(all),
    quickHold: () => inventory.heldId() === BOW,
    isPaused: () => paused,
    toggleMenu: () => { if ($('menu').classList.contains('hidden')) { if (!paused) $('btn-menu').click(); } else $('btn-close-menu').click(); },
    back: () => {
      const shown = (id) => !$(id).classList.contains('hidden');
      if (!$('menu').classList.contains('hidden')) $('btn-close-menu').click();
      else if (shown('station')) closeStation();
      else if (worldMap.open) closeMap();
      else if (shown('guidebook')) closeGuidebook();
      else if (shown('inventory')) toggleInventory();
    },
  });
  window.addEventListener('gamepadconnected', (e) => { if (e.gamepad.mapping === 'standard') toast('Gamepad connected: left stick walks, right stick looks, RT breaks, LT places', 3500); });
  controls.lookSens = settings.sens / 1000;
  controls.doubleTapBreak = settings.doubleTap;
  applyKeys();
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

// ---------- creative mode ----------
// No harm and no hunger, blocks break at once and are never used up, the inventory gets a palette of
// every block and item, and you can fly. It's chosen per world (and can be switched from the menu).
let creative = false;
function applyCreative() {
  inventory.infinite = creative;
  if (!creative) player.flying = false;
  $('btn-fly').classList.toggle('hidden', !creative);
  $('btn-fly').classList.toggle('on', player.flying);
  $('btn-down').classList.toggle('hidden', !player.flying);
  $('btn-mode').textContent = `Game mode: ${creative ? 'Creative' : 'Survival'}`;
  $('palette-wrap').classList.toggle('hidden', !creative);
  if (creative) {
    hunger = MAX_HUNGER; health = MAX_HEALTH;
    for (const k of Object.keys(ailments)) ailments[k] = 0;
    poisoned = 0;
    renderHunger(); renderHealth();
  }
}
function toggleFly() {
  if (!creative || riding || ridingMob || photoMode) return;
  player.flying = !player.flying;
  player.vel.y = 0;
  fallTop = null;
  applyCreative();
  toast(player.flying ? 'Flying: jump to rise, Shift (or ⤓) to sink' : 'Flying off', 1500);
}

// The palette: every block and item, built once and filtered by the recipe search box.
let paletteBuilt = false;
function renderPalette() {
  const el = $('palette');
  if (!paletteBuilt) {
    paletteBuilt = true;
    const ids = [];
    for (let id = 1; id < BLOCKS.length; id++) if (isBlock(id) && icons[id]) ids.push(id);
    for (const k of Object.keys(ITEMS).map(Number).sort((a, b) => a - b)) if (icons[k] && !BLOCKS[k]) ids.push(k);
    for (const id of ids) {
      const img = document.createElement('img');
      img.src = icons[id]; img.alt = ''; img.title = itemName(id); img.dataset.name = itemName(id).toLowerCase();
      img.addEventListener('click', () => {
        if (inventory.fit(id, maxStack(id)) > 0) { toast('Inventory full'); return; }
        toast(`+${maxStack(id)} ${itemName(id)}`, 1000);
        sound.pop();
      });
      el.appendChild(img);
    }
  }
  const query = $('recipe-search').value.trim().toLowerCase();
  for (const img of el.children) img.style.display = !query || img.dataset.name.includes(query) ? '' : 'none';
}

// The copy wand: tap one corner, then the opposite one, to copy everything between them; then every tap
// pastes a copy against the face you tapped. Holding it still clears it.
const WAND_MAX = 32768;
const wand = { a: null, clip: null };
function resetWand() {
  if (!wand.a && !wand.clip) return;
  wand.a = null; wand.clip = null;
  toast('Copy wand cleared: tap a corner to start a new copy', 2000);
}
function useWand() {
  if (!target) { toast('Tap a block with the copy wand'); return; }
  if (wand.clip) { pasteClip(target); return; }
  const { x, y, z } = target;
  if (!wand.a) { wand.a = [x, y, z]; sound.click(); toast('First corner set: now tap the opposite corner', 2200); return; }
  const [ax, ay, az] = wand.a;
  const x0 = Math.min(ax, x), y0 = Math.min(ay, y), z0 = Math.min(az, z);
  const w = Math.abs(ax - x) + 1, h = Math.abs(ay - y) + 1, d = Math.abs(az - z) + 1;
  if (w * h * d > WAND_MAX) { toast(`That's ${w} × ${h} × ${d}: too big (at most ${WAND_MAX} blocks)`, 2500); return; }
  const data = new Uint16Array(w * h * d);
  for (let j = 0; j < h; j++) for (let k = 0; k < d; k++) for (let i = 0; i < w; i++) data[i + w * (k + d * j)] = world.get(x0 + i, y0 + j, z0 + k);
  wand.clip = { w, h, d, data };
  wand.a = null;
  sound.click();
  toast(`Copied ${w} × ${h} × ${d}. Tap where you want it; hold the wand still to clear it.`, 3500);
}
function pasteClip(t) {
  const { w, h, d, data } = wand.clip;
  let ox = t.x + t.nx, oy = t.y + t.ny, oz = t.z + t.nz;
  if (t.nx < 0) ox -= w - 1;
  if (t.ny < 0) oy -= h - 1;
  if (t.nz < 0) oz -= d - 1;
  let n = 0;
  for (let j = 0; j < h; j++) {
    const y = oy + j;
    if (y < 1 || y >= H) continue;
    for (let k = 0; k < d; k++) for (let i = 0; i < w; i++) {
      const x = ox + i, z = oz + k, id = data[i + w * (k + d * j)];
      if (!world.chunkAt(x, z) || world.get(x, y, z) === id) continue;
      world.setBlock(x, y, z, id);
      n++;
    }
  }
  sound.place('stone');
  toast(`Pasted ${n} block${n === 1 ? '' : 's'}`, 1500);
}

// ---------- achievements ----------
let achieved = new Set();
let startPos = null; // where this world began, for "Explorer"
let achToastTimer;
function achieve(id) {
  if (!worldReady || achieved.has(id) || !ACHIEVEMENT_IDS.has(id)) return;
  achieved.add(id);
  const a = ACHIEVEMENTS.find((x) => x.id === id);
  const el = $('ach-toast');
  el.innerHTML = `<span class="icon">${a.icon}</span><span><small>Achievement</small><b>${a.name}</b></span>`;
  el.classList.add('show');
  clearTimeout(achToastTimer);
  achToastTimer = setTimeout(() => el.classList.remove('show'), 3500);
  sound.levelUp?.() ?? sound.pop();
}
const INGOT_IDS = Object.keys(ITEMS).map(Number).filter((k) => / Ingot$/.test(ITEMS[k].name));
const METAL_PICKS = Object.keys(ITEMS).map(Number).filter((k) => ITEMS[k].tool?.type === 'pick' && k !== WOOD_PICK && k !== STONE_PICK);
let progressTimer = 0;
// Once a second: goals reached just by having something or being somewhere, and the map's explored land.
function tickProgress(dt) {
  if ((progressTimer -= dt) > 0) return;
  progressTimer = 1;
  worldMap.record(world);
  const has = (id) => inventory.count(id) > 0;
  if (has(LOG)) achieve('log');
  if (has(TABLE)) achieve('table');
  if (has(STONE_PICK)) achieve('stonepick');
  if (INGOT_IDS.some(has)) achieve('ingot');
  if (METAL_PICKS.some(has)) achieve('metalpick');
  if (has(CRYSTAL_SHARD)) achieve('diamond');
  if (player.pos.y < 10) achieve('deep');
  if (player.pos.y > 46) achieve('peak');
  if (startPos && Math.hypot(player.pos.x - startPos.x, player.pos.z - startPos.z) > 1000) achieve('far');
  if (day >= 7) achieve('week');
  tickGuidebook();
}

// ---------- guide ----------
function openGuide() {
  paused = true; controls.reset(); document.exitPointerLock?.();
  renderAchievements();
  $('guide').classList.remove('hidden');
}
function renderAchievements() {
  $('ach-list').innerHTML = `<p class="ach-count">${achieved.size} of ${ACHIEVEMENTS.length} achievements in this world</p>` +
    ACHIEVEMENTS.map((a) => `<div class="ach${achieved.has(a.id) ? ' got' : ''}"><span class="icon">${a.icon}</span><span><b>${a.name}${achieved.has(a.id) ? ' ✓' : ''}</b><span class="about">${a.about}</span></span></div>`).join('');
}
const guideTab = (ach) => {
  $('tab-ach').classList.toggle('on', ach); $('tab-guide').classList.toggle('on', !ach);
  $('ach-list').classList.toggle('hidden', !ach); $('guide-text').classList.toggle('hidden', ach);
};
$('tab-ach').addEventListener('click', () => guideTab(true));
$('tab-guide').addEventListener('click', () => guideTab(false));
$('btn-close-guide').addEventListener('click', () => { $('guide').classList.add('hidden'); paused = false; });


// ---------- v29 C: logistics pipes ----------
// The network itself is in logistics.js; here are its panels: setting up a pipe, and ordering at a request table.
const LP_INFO = {
  basic: ['Logistics Pipe', 'Joins the network up. It serves nothing itself.'],
  provider: ['Provider Pipe', 'Offers what\'s in the chests it touches (or what a machine it touches has made) to the network. Set it to offer everything except some things, or only some.'],
  crafting: ['Crafting Pipe', 'Put it on an auto-crafter or a machine and choose what it makes: the network can then order it, with its ingredients fetched (or made first) for it.'],
  supplier: ['Supplier Pipe', 'Keeps the chest or machine it touches stocked with what you set here, ordering more as it\'s used (fuel goes in a machine\'s fuel slot).'],
  sink: ['Item Sink Pipe', 'Takes in the things you set here, from extractors and anything that has nowhere else to go. As the default route it takes in anything.'],
  extractor: ['Extractor Pipe', 'Pulls things out of the chest it touches (or what a machine has made) and sends them off to an item sink.'],
  sensor: ['Stock Sensor Pipe', 'Gives a signal (to wires, doors, lamps...) while the network has less than some amount of a thing, or, set to, at least that much. A power junction that gets a signal pauses its network.'],
  fprovider: ['Liquid Provider Pipe', 'Offers the water or lava in the tanks it touches to the network. Dipped in a still pool, it offers as much as you like.'],
  fsupplier: ['Liquid Supplier Pipe', 'Keeps the tank it touches filled to the level you set, or the oven, smelter or steam engine it touches fed with lava as fuel.'],
  fsink: ['Liquid Sink Pipe', 'Takes in liquid that has nowhere else to go (more than its tank had room for, with no room back where it came from), into the tank or bottler it touches. A bottler fills buckets from it.'],
  pad: ['Drone Pad', 'Networks with a pad on the same channel are one network: courier drones fly things between the pads. Each part needs its own powered junction.'],
};
const SENSOR_STEPS = [1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024];
const TANK_STEPS = [1, 2, 4, 8, 12, 16];
const lpIconOf = (id) => (id === WATER || id === LAVA ? liquidIcon(id) : id);
const LP_STEPS = [1, 2, 4, 8, 16, 32, 64];
let lpOpen = null; // { x, y, z, mode: 'pipe' | 'order', pick, search, recipePick }
let ordererLink = null;
let keepTimer = 0; // (v30: drone pads keep their networks' chunks loaded; worked out each second) // the request table the remote orderer is linked to: "x,y,z"
logistics.onArrive = (dest, id, n) => {
  if (Math.hypot(dest.x - player.pos.x, dest.z - player.pos.z) < 48 || lpOpen?.mode === 'order') toast(`📦 ${n > 1 ? n + ' × ' : ''}${itemName(id)} arrived at the request table`, 1800);
  if (lpOpen) renderLogistics();
};
function openLogistics(x, y, z, mode) {
  paused = true; controls.reset(); document.exitPointerLock?.();
  lpOpen = { x, y, z, mode, pick: null, search: '', qty: 1, msg: '', recipePick: false };
  $('lp-search').value = '';
  $('lp').classList.remove('hidden');
  sound.click();
  renderLogistics();
}
function closeLogistics() { $('lp').classList.add('hidden'); lpOpen = null; paused = false; }
const lpIcon = (id, extra = '') => `<img src="${icons[id] ?? ''}" alt="" ${extra}>`;
function renderLogistics() {
  if (!lpOpen) return;
  const { x, y, z, mode } = lpOpen;
  const id = world.get(x, y, z);
  if (!BLOCKS[id]?.lpipe) { closeLogistics(); return; }
  const cfg = logistics.config(x, y, z);
  const body = $('lp-body');
  $('lp-status').textContent = logistics.status(x, y, z);
  $('lp-search-row').classList.toggle('hidden', !(mode === 'order' || lpOpen.recipePick));
  if (mode === 'order') return renderOrders(body);
  const role = cfg?.role ?? BLOCKS[id].lpipe;
  const [name, about] = LP_INFO[role] ?? [BLOCKS[id].name, ''];
  $('lp-title').textContent = name;
  let html = `<p class="hint">${about}</p>`;
  if (role === 'crafting') {
    const inv = logistics.craftInv(`${x},${y},${z}`);
    if (!inv) html += '<p class="lp-warn">Put it against an auto-crafter or a machine.</p>';
    else if (lpOpen.recipePick) return renderRecipePick(body, inv);
    else {
      const r = cfg.recipe;
      html += `<p>On: <b>${escapeHtml(inv.K.name)}</b></p>`;
      html += r ? `<div class="lp-recipe">${lpIcon(r.out[0])} <b>${r.out[1] > 1 ? r.out[1] + ' × ' : ''}${escapeHtml(itemName(r.out[0]))}</b> from ${r.in.map(([i, n]) => `${n > 1 ? n + ' × ' : ''}${escapeHtml(itemName(idsOf(i)[0]))}`).join(', ')}</div>` : '<p class="lp-warn">No recipe chosen yet.</p>';
      html += `<button class="btn" id="lp-choose">${r ? 'Change recipe' : 'Choose recipe'}</button>`;
      if (cfg.orders.length) html += `<p class="hint">Working on: ${cfg.orders.map((o) => `${o.left} × ${escapeHtml(itemName(o.id))}`).join(', ')}</p>`;
    }
  }
  if (role === 'sensor' || role === 'fprovider' || role === 'fsupplier' || role === 'fsink' || role === 'pad') { renderLpExtra(body, html, role, cfg, x, y, z); return; }
  if (role === 'provider' || role === 'sink' || role === 'supplier') {
    if (role === 'provider') html += `<button class="btn" id="lp-mode">${cfg.mode === 'include' ? 'Offers only these:' : 'Offers everything except these:'}</button>`;
    if (role === 'sink') html += `<button class="btn" id="lp-fallback">Default route: ${cfg.fallback ? 'on (takes anything)' : 'off'}</button><p class="hint">Takes in:</p>`;
    if (role === 'supplier') html += '<p class="hint">Keeps this much in stock:</p>';
    html += '<div class="lp-ghosts">' + cfg.filter.map((s, i) => `<div class="lp-ghost" data-i="${i}">${s ? lpIcon(s.id) : ''}${s && role === 'supplier' ? `<span class="n">${s.count}</span>` : ''}${s && role === 'supplier' ? `<span class="pm"><button data-i="${i}" data-d="-1">−</button><button data-i="${i}" data-d="1">+</button></span>` : ''}</div>`).join('') + '</div>';
    const have = [...new Set(inventory.slots.filter(Boolean).map((s) => s.id))];
    html += `<p class="hint">Tap a thing from your backpack to add it; tap a slot to clear it.</p><div class="lp-palette">${have.map((i) => `<button class="lp-pal" data-id="${i}" title="${escapeHtml(itemName(i))}">${lpIcon(i)}</button>`).join('') || '<i>Your backpack is empty.</i>'}</div>`;
  }
  body.innerHTML = html;
  body.querySelector('#lp-choose')?.addEventListener('click', () => { lpOpen.recipePick = true; lpOpen.search = ''; $('lp-search').value = ''; renderLogistics(); });
  body.querySelector('#lp-mode')?.addEventListener('click', () => { cfg.mode = cfg.mode === 'include' ? 'exclude' : 'include'; renderLogistics(); });
  body.querySelector('#lp-fallback')?.addEventListener('click', () => { cfg.fallback = !cfg.fallback; renderLogistics(); });
  body.querySelectorAll('.lp-ghost').forEach((el) => el.addEventListener('click', (e) => {
    if (e.target.closest('.pm')) return;
    cfg.filter[+el.dataset.i] = null; sound.click(); renderLogistics();
  }));
  body.querySelectorAll('.pm button').forEach((b) => b.addEventListener('click', () => {
    const s = cfg.filter[+b.dataset.i];
    if (!s) return;
    const at = LP_STEPS.findIndex((v) => v >= s.count), next = at + +b.dataset.d;
    if (next < 0) cfg.filter[+b.dataset.i] = null; else s.count = LP_STEPS[Math.min(LP_STEPS.length - 1, next)];
    sound.click(); renderLogistics();
  }));
  body.querySelectorAll('.lp-pal').forEach((b) => b.addEventListener('click', () => {
    const i = cfg.filter.findIndex((s) => !s), pid = +b.dataset.id;
    if (cfg.filter.some((s) => s?.id === pid)) return;
    if (i < 0) { toast('All nine slots are set: clear one first', 1500); return; }
    cfg.filter[i] = { id: pid, count: Math.min(16, maxStack(pid)) };
    sound.click(); renderLogistics();
  }));
}
// (v30) The stock sensor, liquid pipes and drone pads.
function renderLpExtra(body, html, role, cfg, x, y, z) {
  const net = logistics.netAt(x, y, z), pk = `${x},${y},${z}`;
  const step = (list, v, d) => { const i = list.findIndex((s) => s >= v); return list[Math.max(0, Math.min(list.length - 1, (i < 0 ? list.length - 1 : i) + d))]; };
  if (role === 'sensor') {
    const f = cfg.filter[0], have = f ? logistics.amountOf(net, f.id) : 0;
    html += `<div class="lp-sense"><div class="lp-ghost" id="lp-sense-slot">${f ? lpIcon(lpIconOf(f.id)) : ''}</div>`;
    html += f ? `<span>Signals while the network has <button class="btn small" id="lp-when">${cfg.when === 'above' ? 'at least' : 'less than'}</button>
      <button class="btn small" data-c="-1">−</button> <b>${f.count}</b> <button class="btn small" data-c="1">+</button> ${escapeHtml(itemName(f.id))}${isLiquidId(f.id) ? ' (buckets)' : ''}.<br>
      It has ${have === Infinity ? 'endless' : Math.floor(have)} now: <b>${logistics.sensed(net, cfg) ? 'signalling' : 'not signalling'}</b>.</span>` : '<span>Choose what to watch:</span>';
    html += '</div>';
    html += `<div class="lp-palette">${[WATER, LAVA, ...new Set(inventory.slots.filter(Boolean).map((s) => s.id))].map((i) => `<button class="lp-pal" data-id="${i}" title="${escapeHtml(itemName(i))}">${lpIcon(lpIconOf(i))}</button>`).join('')}</div>`;
    body.innerHTML = html;
    body.querySelectorAll('.lp-pal').forEach((b) => b.addEventListener('click', () => { cfg.filter[0] = { id: +b.dataset.id, count: cfg.filter[0]?.count ?? 16 }; sound.click(); renderLogistics(); }));
    body.querySelector('#lp-sense-slot').addEventListener('click', () => { cfg.filter[0] = null; renderLogistics(); });
    body.querySelector('#lp-when')?.addEventListener('click', () => { cfg.when = cfg.when === 'above' ? 'below' : 'above'; renderLogistics(); });
    body.querySelectorAll('[data-c]').forEach((b) => b.addEventListener('click', () => { cfg.filter[0].count = step(SENSOR_STEPS, cfg.filter[0].count, +b.dataset.c); sound.click(); renderLogistics(); }));
    return;
  }
  if (role === 'fprovider') {
    const src = logistics.fluidSources(pk);
    html += src.length ? `<p>Offers: ${src.map((s) => `${s.amount === Infinity ? 'endless' : Math.floor(s.amount * 10) / 10 + ' buckets of'} ${s.liquid === LAVA ? 'lava' : 'water'}${s.tank ? ' (tank)' : ' (pool)'}`).join(', ')}</p>`
      : '<p class="lp-warn">Put it against a tank with something in it, or dip it in a still pool of water or lava.</p>';
    body.innerHTML = html;
    return;
  }
  if (role === 'fsink') {
    const tg = logistics.fluidTarget(pk);
    html += tg?.kind === 'tank' ? `<p>Into the ${escapeHtml(tg.d.name.toLowerCase())}: it has ${Math.floor(machines.tank(tg.x, tg.y, tg.z).amount * 10) / 10} of ${tg.cap} buckets.</p>`
      : '<p class="lp-warn">Put it against a tank or a bottler.</p>';
    body.innerHTML = html;
    return;
  }
  if (role === 'fsupplier') {
    const tg = logistics.fluidTarget(pk);
    if (!tg) html += '<p class="lp-warn">Put it against a tank, or an oven, smelter or steam engine.</p>';
    else if (tg.kind === 'fire') html += `<p>Feeds lava to the ${escapeHtml(tg.d.name.toLowerCase())} as fuel. Holding ${Math.floor((cfg.buf ?? 0) * 100)}% of a bucket.</p>`;
    else {
      const f = cfg.filter[0];
      html += `<p>Keep the ${escapeHtml(tg.d.name.toLowerCase())} filled with ${[WATER, LAVA].map((l) => `<button class="btn small${f?.id === l ? ' on' : ''}" data-l="${l}">${l === LAVA ? 'lava' : 'water'}</button>`).join(' ')}`;
      if (f) html += ` up to <button class="btn small" data-c="-1">−</button> <b>${f.count}</b> <button class="btn small" data-c="1">+</button> buckets (of ${tg.cap})`;
      html += `.</p><p class="hint">It has ${Math.floor(machines.tank(tg.x, tg.y, tg.z).amount * 10) / 10} of ${tg.cap} now.</p>`;
    }
    body.innerHTML = html;
    body.querySelectorAll('[data-l]').forEach((b) => b.addEventListener('click', () => { cfg.filter[0] = { id: +b.dataset.l, count: cfg.filter[0]?.count ?? tg.cap }; sound.click(); renderLogistics(); }));
    body.querySelectorAll('[data-c]').forEach((b) => b.addEventListener('click', () => { cfg.filter[0].count = Math.min(tg.cap, step(TANK_STEPS, cfg.filter[0].count, +b.dataset.c)); sound.click(); renderLogistics(); }));
    return;
  }
  // a drone pad
  const others = [...logistics.pipes].filter(([k, c]) => k !== pk && c.role === 'pad' && c.channel === cfg.channel).length;
  const linked = net?.pads?.filter((k) => k !== pk && logistics.pipes.get(k).channel === cfg.channel).length ?? 0;
  html += `<p>Channel <button class="btn small" data-ch="-1">−</button> <b>${cfg.channel}</b> <button class="btn small" data-ch="1">+</button></p>
    <p class="hint">${others ? `${others} other pad${others > 1 ? 's' : ''} on this channel; ${linked} linked now${linked < others ? ' (a pad links while its network is powered and its part of the world is loaded)' : ''}.` : 'No other pads on this channel yet.'}</p>`;
  body.innerHTML = html;
  body.querySelectorAll('[data-ch]').forEach((b) => b.addEventListener('click', () => {
    cfg.channel = ((cfg.channel - 1 + +b.dataset.ch + CHANNELS) % CHANNELS) + 1; logistics.dirty = true; sound.click(); renderLogistics();
  }));
}
const isLiquidId = (id) => id === WATER || id === LAVA;
// Choosing what a crafting pipe makes: the recipes of the thing it's on.
function renderRecipePick(body, inv) {
  const cfg = logistics.config(lpOpen.x, lpOpen.y, lpOpen.z), q = lpOpen.search.toLowerCase();
  const list = logistics.recipesFor(`${lpOpen.x},${lpOpen.y},${lpOpen.z}`).filter((r) => r.out && (!q || itemName(r.out[0]).toLowerCase().includes(q))).slice(0, 80);
  body.innerHTML = `<p class="hint">What should the ${escapeHtml(inv.K.name.toLowerCase())} make? <button class="btn small" id="lp-back">Back</button></p>` +
    list.map((r, i) => `<button class="lp-row" data-i="${i}">${lpIcon(r.out[0])}<span><b>${r.out[1] > 1 ? r.out[1] + ' × ' : ''}${escapeHtml(itemName(r.out[0]))}</b><small>${r.in.map(([id, n]) => `${n > 1 ? n + ' × ' : ''}${escapeHtml(itemName(idsOf(id)[0]))}`).join(', ')}</small></span></button>`).join('');
  body.querySelector('#lp-back').addEventListener('click', () => { lpOpen.recipePick = false; renderLogistics(); });
  body.querySelectorAll('.lp-row').forEach((b) => b.addEventListener('click', () => { cfg.recipe = list[+b.dataset.i]; lpOpen.recipePick = false; sound.pop(); renderLogistics(); }));
}
// The request table: everything the network has or can make, to order.
function renderOrders(body) {
  const { x, y, z } = lpOpen, q = lpOpen.search.toLowerCase();
  $('lp-title').textContent = 'Request Table';
  const all = logistics.orderable(x, y, z).filter((e) => !q || itemName(e.id).toLowerCase().includes(q)).sort((a, b) => itemName(a.id).localeCompare(itemName(b.id)));
  const st = stations.get(x, y, z, 'reqtable'), waiting = st.inputs.filter(Boolean).reduce((a, s) => a + s.count, 0);
  let html = `<div class="lp-list">${all.map((e) => `<button class="lp-row${lpOpen.pick === e.id ? ' on' : ''}" data-id="${e.id}">${lpIcon(e.id)}<span><b>${escapeHtml(itemName(e.id))}</b><small>${e.count ? e.count + ' in store' : ''}${e.count && e.craft ? ' · ' : ''}${e.craft ? '✦ can be made' : ''}</small></span></button>`).join('') || '<p class="hint">Nothing on offer: put provider pipes on chests, or crafting pipes on crafters.</p>'}</div>`;
  html += `<div class="lp-order"><span>${lpOpen.pick ? lpIcon(lpOpen.pick) + ' ' + escapeHtml(itemName(lpOpen.pick)) : 'Pick something above'}</span>
    <span class="qty"><button class="btn small" data-q="-1">−</button><input id="lp-qty" type="number" min="1" max="999" value="${lpOpen.qty}"><button class="btn small" data-q="1">+</button>
    ${[8, 16, 64].map((v) => `<button class="btn small" data-set="${v}">${v}</button>`).join('')}</span>
    <button class="btn" id="lp-request" ${lpOpen.pick ? '' : 'disabled'}>Request</button></div>
    <p class="lp-msg">${lpOpen.msg}</p>
    <div class="lp-buffer"><span>${waiting ? `${waiting} thing${waiting > 1 ? 's' : ''} waiting at the table` : 'Nothing waiting at the table'}</span><button class="btn small" id="lp-take" ${waiting ? '' : 'disabled'}>Take all</button><button class="btn small" id="lp-open">Open table</button></div>`;
  body.innerHTML = html;
  body.querySelectorAll('.lp-row').forEach((b) => b.addEventListener('click', () => { lpOpen.pick = +b.dataset.id; lpOpen.msg = ''; renderLogistics(); }));
  body.querySelectorAll('[data-q]').forEach((b) => b.addEventListener('click', () => { lpOpen.qty = Math.max(1, Math.min(999, lpOpen.qty + +b.dataset.q)); renderLogistics(); }));
  body.querySelectorAll('[data-set]').forEach((b) => b.addEventListener('click', () => { lpOpen.qty = +b.dataset.set; renderLogistics(); }));
  body.querySelector('#lp-qty').addEventListener('change', (e) => { lpOpen.qty = Math.max(1, Math.min(999, Math.floor(+e.target.value) || 1)); renderLogistics(); });
  body.querySelector('#lp-request').addEventListener('click', () => placeOrder());
  body.querySelector('#lp-take').addEventListener('click', () => {
    for (let i = 0; i < st.inputs.length; i++) { const s = st.inputs[i]; if (!s) continue; const left = inventory.fitItem(s); st.inputs[i] = left > 0 ? { ...s, count: left } : null; }
    sound.pop(); renderLogistics();
  });
  body.querySelector('#lp-open').addEventListener('click', () => { const { x: tx, y: ty, z: tz } = lpOpen; closeLogistics(); openStation(tx, ty, tz); });
}
function placeOrder() {
  const { x, y, z, pick, qty } = lpOpen;
  const r = logistics.request(x, y, z, pick, qty);
  if (r.ok) {
    const crafts = r.steps.filter((s) => s.craft).length;
    lpOpen.msg = `✔ Ordered ${qty} × ${escapeHtml(itemName(pick))}${crafts ? ` (${crafts} crafting job${crafts > 1 ? 's' : ''})` : ''}`;
    sound.ding?.(0.7);
    achieve('logistics');
  } else lpOpen.msg = r.reason ? `✖ ${escapeHtml(r.reason)}` : `✖ Missing: ${r.missing.map(([id, n]) => `${n} × ${escapeHtml(itemName(id))}`).join(', ')}`;
  renderLogistics();
}
function useOrderer(target) {
  if (target?.id === LP_TABLE) {
    ordererLink = `${target.x},${target.y},${target.z}`;
    toast('The remote orderer is linked to this request table', 2000); sound.ding?.(0.6);
    return;
  }
  if (!ordererLink) { toast('Tap a request table with it first to link it', 2000); return; }
  const [x, y, z] = ordererLink.split(',').map(Number);
  if (!world.chunkAt(x, z) || world.get(x, y, z) !== LP_TABLE) { toast('Its request table is too far away (or gone)', 2000); return; }
  openLogistics(x, y, z, 'order');
}
$('lp-close').addEventListener('click', closeLogistics);
$('lp').addEventListener('click', (e) => { if (e.target.id === 'lp') closeLogistics(); });
$('lp-search').addEventListener('input', (e) => { if (lpOpen) { lpOpen.search = e.target.value; renderLogistics(); } });

// ---------- v29 B: music ----------
// What the music should sound like here and now (see music.js).
let moodTimer = 0, moodNow = 'day';
function musicMood(dt) {
  if ((moodTimer -= dt) > 0) return moodNow;
  moodTimer = 1.5;
  const e = player.eye, x = Math.floor(e.x), y = Math.floor(e.y), z = Math.floor(e.z);
  const v = world.generator.nearestVillage(x, z, 1);
  const nearVillage = v && Math.hypot(v.x - e.x, v.z - e.z) < 56;
  moodNow = player.eyeInWater ? 'water'
    : !(world.skyAt(x, y, z) > 0) && y < 26 ? 'cave'
    : nearVillage && festivalToday() ? 'festival'
    : nearVillage && !sky.isNight ? 'village'
    : sky.isNight ? 'night'
    : seasonOf(day) === 3 ? 'winter' : 'day';
  return moodNow;
}

// ---------- v29 A: the guidebook ----------
// Chapters of goals (see guidebook.js), ticked off as you reach them, each with a reward to claim.
let guideDone = new Set(), guideClaimed = new Set(), gbChapter = 0;
const GOAL_IDS = new Set(GOALS.map((g) => g.id));
const GOAL_TESTS = { armour: () => armourShare() > 0 };
function goalMet(g) {
  const c = g.check;
  if (c.has != null) return [].concat(c.has).some((id) => inventory.count(id) > 0);
  if (c.count) return inventory.count(c.count[0]) >= c.count[1];
  if (c.ach) return achieved.has(c.ach);
  if (c.fn) return !!GOAL_TESTS[c.fn]?.();
  return false;
}
function tickGuidebook() {
  let fresh = null;
  GUIDE.forEach((ch, i) => {
    if (!chapterOpen(i, guideDone)) return;
    for (const g of ch.goals) if (!guideDone.has(g.id) && goalMet(g)) { guideDone.add(g.id); fresh = g; }
  });
  if (fresh) {
    toast(`📖 ${fresh.name}: done! ${fresh.reward ? 'Claim your reward in the guidebook' : ''}`, 2600);
    sound.ding?.(0.8);
    if (!$('guidebook').classList.contains('hidden')) renderGuidebook();
  }
  $('btn-guidebook').classList.toggle('claim', unclaimed().length > 0);
}
const unclaimed = () => GOALS.filter((g) => g.reward && guideDone.has(g.id) && !guideClaimed.has(g.id));
function claimGoal(g) {
  if (!guideDone.has(g.id) || guideClaimed.has(g.id) || !g.reward) return;
  if (inventory.room(g.reward[0]) < g.reward[1]) { toast('Make room in your backpack first', 1500); return; }
  guideClaimed.add(g.id);
  inventory.add(g.reward[0], g.reward[1]);
  sound.pop();
  $('btn-guidebook').classList.toggle('claim', unclaimed().length > 0);
  renderGuidebook();
}
function openGuidebook() {
  if (paused || dead || photoMode) return;
  paused = true; controls.reset(); document.exitPointerLock?.();
  // open at the first chapter with something to claim, or else still to do
  const open = GUIDE.map((_, i) => chapterOpen(i, guideDone));
  const claim = GUIDE.findIndex((ch, i) => open[i] && ch.goals.some((g) => g.reward && guideDone.has(g.id) && !guideClaimed.has(g.id)));
  const todo = GUIDE.findIndex((ch, i) => open[i] && ch.goals.some((g) => !guideDone.has(g.id)));
  gbChapter = claim >= 0 ? claim : todo >= 0 ? todo : 0;
  renderGuidebook();
  $('guidebook').classList.remove('hidden');
}
function closeGuidebook() { $('guidebook').classList.add('hidden'); paused = false; }
const gbIcon = (id) => (id && icons[id] ? `<img class="icon" src="${icons[id]}" alt="">` : '<span class="icon"></span>');
function renderGuidebook() {
  const total = GOALS.length, nDone = GOALS.filter((g) => guideDone.has(g.id)).length;
  $('gb-progress').textContent = `${nDone} of ${total} goals`;
  const chs = $('gb-chapters');
  chs.innerHTML = '';
  GUIDE.forEach((ch, i) => {
    const open = chapterOpen(i, guideDone), done = ch.goals.filter((g) => guideDone.has(g.id)).length;
    const b = document.createElement('button');
    b.className = `gb-ch${i === gbChapter ? ' on' : ''}${open ? '' : ' locked'}`;
    const claim = ch.goals.some((g) => g.reward && guideDone.has(g.id) && !guideClaimed.has(g.id));
    b.innerHTML = `${open ? '' : '🔒 '}${ch.name}${claim ? '<span class="dot"></span>' : ''}<span class="n">${done}/${ch.goals.length}</span>`;
    b.title = open ? '' : `Opens when half of "${GUIDE[ch.after].name}" is done`;
    if (open) b.addEventListener('click', () => { gbChapter = i; renderGuidebook(); });
    chs.appendChild(b);
  });
  const ch = GUIDE[gbChapter], list = $('gb-goals');
  list.innerHTML = '';
  if (!chapterOpen(gbChapter, guideDone)) { list.innerHTML = `<p class="hint">Do half of "${GUIDE[ch.after].name}" to open this chapter.</p>`; return; }
  for (const g of ch.goals) {
    const done = guideDone.has(g.id), claimed = guideClaimed.has(g.id);
    const row = document.createElement('div');
    row.className = `gb-goal${done ? ' done' : ''}${done && g.reward && !claimed ? ' unclaimed' : ''}`;
    const item = goalItem(g), r = item && !g.check.ach && RECIPES.find((x) => x.out[0] === item);
    const made = r && !done ? `<div class="made">Made from: ${r.in.map(([id, n]) => `${n > 1 ? n + ' × ' : ''}${gbIcon(id).replace('class="icon"', '')}${escapeHtml(itemName(id))}`).join(', ')}${r.table ? ' (at a table)' : ''}</div>` : '';
    const reward = g.reward ? `<div class="reward">Reward: ${gbIcon(g.reward[0]).replace('class="icon"', '')}${g.reward[1] > 1 ? g.reward[1] + ' × ' : ''}${escapeHtml(itemName(g.reward[0]))}</div>` : '';
    row.innerHTML = `${gbIcon(item)}<div class="txt"><b>${escapeHtml(g.name)} ${done ? '<span class="tick">✓</span>' : ''}</b><div class="hint">${escapeHtml(g.hint)}</div>${made}${reward}</div>`;
    if (done && g.reward && !claimed) {
      const btn = document.createElement('button');
      btn.className = 'btn';
      btn.textContent = 'Claim';
      btn.addEventListener('click', () => claimGoal(g));
      row.appendChild(btn);
    }
    list.appendChild(row);
  }
}
$('btn-guidebook').addEventListener('click', () => ($('guidebook').classList.contains('hidden') ? openGuidebook() : closeGuidebook()));
$('btn-close-guidebook').addEventListener('click', closeGuidebook);
$('guidebook').addEventListener('click', (e) => { if (e.target.id === 'guidebook') closeGuidebook(); });

// ---------- world map ----------
const worldMap = new WorldMap($('worldmap'), $('bigmap'), minimap, {
  marks: () => waypoints,
  places: () => [...places, ...treasures.filter((t) => !t.found).map((t) => ({ kind: 'treasure', x: t.x, z: t.z, name: 'X' }))],
  home: () => bedSpawn ?? (world.spawnCache ??= world.generator.findSpawn()),
  toggleMark(x, z, near) {
    if (near) { waypoints = waypoints.filter((w) => w !== near); toast(`Removed ${near.name}`, 1200); sound.click(); return; }
    if (waypoints.length >= 12) { toast('You can have 12 waypoints at most: tap one to remove it'); return; }
    let n = 1;
    while (waypoints.some((w) => w.name === `Mark ${n}`)) n++;
    let y = world.generator.height(x, z);
    if (world.chunkAt(x, z)) for (y = H - 1; y > 0 && world.get(x, y, z) === AIR; y--);
    waypoints.push({ x, y, z, name: `Mark ${n}` });
    toast(`Added Mark ${n}`, 1200);
    sound.click();
    achieve('map');
  },
});
function openMap() {
  if (!world || !worldReady) return;
  paused = true; controls.reset(); document.exitPointerLock?.();
  worldMap.record(world);
  worldMap.show(true, world, player);
}
function closeMap() {
  worldMap.show(false);
  paused = false;
}
$('btn-close-map').addEventListener('click', closeMap);
$('btn-map-in').addEventListener('click', () => worldMap.zoom(1.5));
$('btn-map-out').addEventListener('click', () => worldMap.zoom(1 / 1.5));
$('btn-map-me').addEventListener('click', () => worldMap.centre());

// ---------- keyboard keys ----------
function applyKeys() {
  controls.binds = { ...DEFAULT_KEYS };
  for (const [a, k] of Object.entries(settings.keys)) if (a in DEFAULT_KEYS && typeof k === 'string') controls.binds[a] = k;
}
function renderKeys(waiting = null) {
  const list = $('key-list');
  list.innerHTML = '';
  for (const [action, name] of KEY_ACTIONS) {
    const row = document.createElement('div');
    row.className = 'key-row';
    row.innerHTML = `<span>${name}</span>`;
    const btn = document.createElement('button');
    btn.className = 'btn' + (waiting === action ? ' waiting' : '');
    btn.textContent = waiting === action ? 'Press a key…' : keyLabel(controls.binds[action]);
    btn.addEventListener('click', () => {
      renderKeys(action);
      controls.capture = (code) => {
        if (code !== 'Escape') {
          // a key can only do one thing: whatever had it swaps to this action's old key
          const old = controls.binds[action];
          for (const [a, k] of Object.entries(controls.binds)) if (k === code && a !== action) settings.keys[a] = old;
          settings.keys[action] = code;
          applyKeys();
          saveSettings();
        }
        renderKeys();
      };
    });
    row.appendChild(btn);
    list.appendChild(row);
  }
}

// ---------- worlds (save slots) ----------
function slotSummary(n) {
  const s = loadSave(saveKeyOf(n));
  if (!s || s.seed === undefined) return null;
  return { day: s.day ?? 1, creative: !!s.creative, seed: s.seed, achievements: s.achievements?.length ?? 0 };
}
function openWorlds() {
  $('menu').classList.add('hidden');
  $('worlds').classList.remove('hidden');
  renderWorlds();
}
function closeWorlds() {
  $('worlds').classList.add('hidden');
  $('menu').classList.remove('hidden');
}
function renderWorlds() {
  const box = $('slots');
  box.innerHTML = '';
  for (let n = 0; n < SLOT_COUNT; n++) {
    const sum = n === settings.slot && worldReady ? { day, creative, seed: world.seed, achievements: achieved.size } : slotSummary(n);
    const card = document.createElement('div');
    card.className = 'slot-card' + (n === settings.slot ? ' current' : '');
    card.innerHTML = `<h3>World ${n + 1}${n === settings.slot ? ' (playing)' : ''}</h3><div class="about">${sum ? `Day ${sum.day} · ${sum.creative ? 'Creative' : 'Survival'} · ${sum.achievements}/${ACHIEVEMENTS.length} achievements · seed ${sum.seed}` : 'Empty'}</div><div class="row"></div>`;
    const row = card.querySelector('.row');
    const add = (label, fn, danger) => {
      const b = document.createElement('button');
      b.className = 'btn' + (danger ? ' danger' : '');
      b.textContent = label;
      b.addEventListener('click', fn);
      row.appendChild(b);
    };
    if (sum && n !== settings.slot) add('Play', () => switchSlot(n, loadSave(saveKeyOf(n))));
    add('New survival', () => newWorldIn(n, false, sum));
    add('New creative', () => newWorldIn(n, true, sum));
    if (sum) add('Export', () => exportSlot(n));
    add('Import', () => { importTarget = n; $('import-file').value = ''; $('import-file').click(); });
    if (sum && n !== settings.slot) add('Delete', () => deleteSlot(n), true);
    box.appendChild(card);
  }
}
async function switchSlot(n, save, opts) {
  if (activeSlot === MP_SLOT && net.ws) net.leave(true);
  saveGame();
  await world?.saveChunks();
  worldReady = false;
  settings.slot = n;
  saveSettings();
  store.setSlot(n); activeSlot = n;
  $('worlds').classList.add('hidden');
  $('menu').classList.add('hidden');
  await startWorld(save, opts);
}
function newWorldIn(n, asCreative, sum) {
  if (sum && !confirm(`Start a new ${asCreative ? 'creative' : 'survival'} world in World ${n + 1}? The world there now will be lost.`)) return;
  try { localStorage.removeItem(saveKeyOf(n)); } catch { /* storage unavailable */ }
  switchSlot(n, null, { creative: asCreative });
}
async function deleteSlot(n) {
  if (!confirm(`Delete World ${n + 1}? This can't be undone (unless you've exported it).`)) return;
  try { localStorage.removeItem(saveKeyOf(n)); } catch { /* storage unavailable */ }
  await store.clear(n);
  renderWorlds();
}

// A world file: the save itself, plus every chunk the player changed (as base64 of their block ids).
const toB64 = (u16) => {
  const b = new Uint8Array(u16.buffer, u16.byteOffset, u16.byteLength);
  let s = '';
  for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode.apply(null, b.subarray(i, i + 0x8000));
  return btoa(s);
};
const fromB64 = (str) => {
  const s = atob(str), b = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) b[i] = s.charCodeAt(i);
  return new Uint16Array(b.buffer);
};
async function exportSlot(n) {
  if (n === settings.slot) { saveGame(); await world.saveChunks(); }
  const save = loadSave(saveKeyOf(n));
  if (!save) { toast('Nothing to export'); return; }
  const chunks = (await store.dump(n)).map(([k, d]) => [k, toB64(d)]);
  const file = { minicraft: 'world', version: GAME_VERSION, save, chunks };
  const url = URL.createObjectURL(new Blob([JSON.stringify(file)], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = `minicraft-world-${n + 1}-day-${save.day ?? 1}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
  toast(`Exported World ${n + 1} (${chunks.length} changed chunk${chunks.length === 1 ? '' : 's'})`, 2500);
}
let importTarget = 0;
$('import-file').addEventListener('change', async (e) => {
  const f = e.target.files?.[0];
  if (!f) return;
  let file;
  try { file = JSON.parse(await f.text()); } catch { file = null; }
  if (file?.minicraft !== 'world' || !file.save || !Number.isFinite(file.save.seed) || !Array.isArray(file.chunks)) { toast('That isn\'t a Minicraft world file', 2500); return; }
  const n = importTarget;
  if (slotSummary(n) && !confirm(`Replace World ${n + 1} with the imported world?`)) return;
  let chunks;
  try {
    chunks = file.chunks.filter(([k, d]) => Number.isFinite(k) && typeof d === 'string').map(([k, d]) => [k, fromB64(d)]).filter(([, d]) => d.length === CHUNK_VOLUME);
  } catch { toast('That world file is damaged', 2500); return; }
  if (n === settings.slot) { worldReady = false; await world?.saveChunks(); }
  await store.clear(n);
  const was = store.slot;
  store.setSlot(n);
  await store.saveMany(chunks);
  store.setSlot(was);
  if (!writeSave(file.save, n)) { toast('Could not save the imported world (storage full?)', 3000); return; }
  toast(`Imported into World ${n + 1}`, 2000);
  await switchSlot(n, file.save);
});

// ---------- movement sounds ----------
const moveSnd = { dist: 0, swim: 0 };
function groundSound() {
  const p = player.pos;
  const id = world.get(Math.floor(p.x), Math.floor(p.y - 0.05), Math.floor(p.z));
  return BLOCKS[id]?.sound ?? 'grass';
}
function playMovementSounds(dt, wasGround, wasWater, fallSpeed) {
  const speed = Math.hypot(player.vel.x, player.vel.z);
  if (!wasWater && player.inWater) {
    sound.splash(fallSpeed > 5);
    const sy = waterSurfaceAt(player.pos.x, player.pos.y + 0.5, player.pos.z);
    if (sy !== null) ripples.splash(player.pos.x, sy, player.pos.z, Math.round(10 + Math.min(30, fallSpeed * 3)), Math.min(1.8, 0.6 + fallSpeed * 0.08));
  }
  if (player.inWater) {
    moveSnd.swim -= dt;
    if ((speed > 0.5 || controls.jump) && moveSnd.swim <= 0) {
      sound.splash(false); moveSnd.swim = 0.7;
      const sy = waterSurfaceAt(player.pos.x, player.pos.y + 0.5, player.pos.z);
      if (sy !== null && sy - player.pos.y < 1.9) ripples.splash(player.pos.x + Math.sin(-player.yaw) * -0.4, sy, player.pos.z - Math.cos(player.yaw) * 0.4, 6, 0.45);
    }
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

// ---------- v25 C: explorer's map, treasure maps, lighthouse beams, morning fog, settling snow ----------
// Carrying an explorer's map, the ruins, wrecks, lighthouses, volcanoes and villages you come near are marked on
// the world map.
let places = []; // [{ kind, x, z, name }]
const PLACE_NAMES = { ruin: 'Ruin', wreck: 'Shipwreck', lighthouse: 'Lighthouse', volcano: 'Volcano', village: 'Village', temple: 'Sunken Temple', island: 'Sky Island' };
let exploreTimer = 0;
function tickExplore(dt) {
  if ((exploreTimer -= dt) > 0) return;
  exploreTimer = 2;
  if (!inventory.count(EXPLORER_MAP)) return;
  const g = world.generator, p = player.pos, pcx = Math.floor(p.x / CHUNK), pcz = Math.floor(p.z / CHUNK);
  const mark = (kind, x, z, name) => {
    if (Math.hypot(x - p.x, z - p.z) > 48 || places.some((q) => q.kind === kind && Math.abs(q.x - x) < 8 && Math.abs(q.z - z) < 8)) return;
    places.push({ kind, x: Math.round(x), z: Math.round(z), name: name ?? PLACE_NAMES[kind] });
    toast(`Explorer's map: marked ${name ?? `a ${PLACE_NAMES[kind].toLowerCase()}`}`, 2000);
    sound.pop();
  };
  for (let cz = pcz - 3; cz <= pcz + 3; cz++) for (let cx = pcx - 3; cx <= pcx + 3; cx++) {
    const r = g.ruinAt?.(cx, cz); if (r) mark('ruin', r.x + 3, r.z + 3);
    const w = g.wreckAt?.(cx, cz); if (w) mark('wreck', w.x + 2, w.z);
    const l = g.lighthouseAt?.(cx, cz); if (l) mark('lighthouse', l.x, l.z);
    const v = g.volcanoAt?.(cx, cz); if (v) mark('volcano', v.x, v.z);
    const tp = g.templeAt?.(cx, cz); if (tp) mark('temple', tp.x, tp.z);
    const il = g.islandAt?.(cx, cz); if (il) mark('island', il.x, il.z);
  }
  const v = g.nearestVillage(p.x, p.z, 1);
  if (v) mark('village', v.x, v.z, v.name);
}

// A treasure map, the first time it's read, leads to a chest buried somewhere 120-280 blocks away on dry land.
// The chest is put in the ground once that part of the world is loaded.
let treasures = []; // [{ id, x, z, y, placed, found }]
const pointName = (dx, dz) => ['north', 'north-east', 'east', 'south-east', 'south', 'south-west', 'west', 'north-west'][(Math.round(Math.atan2(dx, -dz) / (Math.PI / 4)) + 8) % 8];
function readTreasureMap(s) {
  let t = s.pack > 0 && packs.get(s.pack)?.treasure !== undefined ? treasures.find((tr) => tr.id === packs.get(s.pack).treasure) : null;
  if (!t) {
    const g = world.generator;
    for (let tries = 0; tries < 40 && !t; tries++) {
      const a = Math.random() * Math.PI * 2, d = 120 + Math.random() * 160;
      const x = Math.floor(player.pos.x + Math.cos(a) * d), z = Math.floor(player.pos.z + Math.sin(a) * d);
      if (x < 8 || z < 8 || x >= WORLD_SIZE - 8 || z >= WORLD_SIZE - 8) continue;
      const h = g.height(x, z);
      if (h <= SEA_LEVEL + 1 || h >= H - 4) continue;
      t = { id: treasures.reduce((m, tr) => Math.max(m, tr.id), 0) + 1, x, z, y: null, placed: false, found: false };
    }
    if (!t) { toast('The map is too faded to read', 1800); return; }
    treasures.push(t);
    s.pack = newPack({ treasure: t.id });
    inventory.onChange();
  }
  if (t.found) { toast('This treasure has been found', 1800); return; }
  const dx = t.x + 0.5 - player.pos.x, dz = t.z + 0.5 - player.pos.z, d = Math.hypot(dx, dz);
  toast(d < 3 ? 'X marks the spot: dig here!' : `X marks the spot: ${Math.round(d)} blocks ${pointName(dx, dz)} (it's on your world map)`, 3000);
  sound.click();
}
let treasureTimer = 0;
function tickTreasure(dt) {
  if ((treasureTimer -= dt) > 0) return;
  treasureTimer = 2;
  for (const t of treasures) {
    if (t.placed || !world.chunkAt(t.x, t.z)) continue;
    let y = H - 2;
    while (y > 1 && !(world.isSolid(t.x, y, t.z) && !isLeaves(world.get(t.x, y, t.z)))) y--;
    t.y = Math.max(1, y - 2);
    world.setBlock(t.x, t.y, t.z, CHEST);
    const st = stations.get(t.x, t.y, t.z, 'chest');
    TREASURE_LOOT.forEach(([id, a, b, p], i) => { if (Math.random() < p) st.inputs[i * 2] = { id, count: a + Math.floor(Math.random() * (b - a + 1)) }; });
    t.placed = true;
  }
}

// Lighthouse lamps sweep two beams of light round at night.
let beaconSpots = new Set(); // lamps you've put down: "x,y,z"
const beams = new Map(); // "x,y,z" -> mesh
const beamMat = new THREE.MeshBasicMaterial({ color: 0xfff0b8, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
function beamMesh() {
  const g = new THREE.Group();
  for (const s of [1, -1]) {
    const cone = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 3.2, 36, 12, 1, true), beamMat);
    cone.rotation.z = s * Math.PI / 2;
    cone.position.x = s * 18.4;
    g.add(cone);
  }
  return g;
}
let beamTimer = 0;
function tickBeams(dt) {
  const night = Math.max(0, Math.min(1, (0.55 - lightUniforms.uDay.value) * 2.5));
  beamMat.opacity = night * 0.32;
  for (const m of beams.values()) { m.rotation.y += dt * 0.9; m.visible = night > 0.02; }
  if ((beamTimer -= dt) > 0) return;
  beamTimer = 1;
  const want = new Set();
  const g = world.generator, pcx = Math.floor(player.pos.x / CHUNK), pcz = Math.floor(player.pos.z / CHUNK), r = Math.ceil(settings.viewDistance ?? 4) + 2;
  for (let cz = pcz - r; cz <= pcz + r; cz++) for (let cx = pcx - r; cx <= pcx + r; cx++) {
    const l = g.lighthouseAt?.(cx, cz);
    if (l && world.chunkAt(l.x, l.z) && world.get(l.x, l.lamp, l.z) === LIGHTHOUSE_LAMP) want.add(`${l.x},${l.lamp},${l.z}`);
  }
  for (const k of [...beaconSpots]) {
    const [x, y, z] = k.split(',').map(Number);
    if (!world.chunkAt(x, z)) continue;
    if (world.get(x, y, z) !== LIGHTHOUSE_LAMP) { beaconSpots.delete(k); continue; }
    if (Math.hypot(x - player.pos.x, z - player.pos.z) < (r + 2) * CHUNK) want.add(k);
  }
  for (const [k, m] of beams) if (!want.has(k)) { scene.remove(m); m.traverse((o) => o.geometry?.dispose()); beams.delete(k); }
  for (const k of want) {
    if (beams.has(k)) continue;
    const [x, y, z] = k.split(',').map(Number), m = beamMesh();
    m.position.set(x + 0.5, y + 0.45, z + 0.5);
    scene.add(m);
    beams.set(k, m);
  }
}

// Some mornings, mist lies in the valleys: thickest at dawn, gone by mid-morning, and thinner up high.
function mistNow() {
  const hours = (sky.time * 24 + 6) % 24;
  if (hours < 4.5 || hours > 9.5) return 0;
  const foggy = ((Math.imul(day + 1, 0x9e3779b1) ^ world.seed) >>> 0) % 100 < 40;
  if (!foggy || world.generator.biomeAt(Math.floor(player.pos.x), Math.floor(player.pos.z)) === 'desert') return 0;
  const t = hours < 6.5 ? (hours - 4.5) / 2 : 1 - (hours - 6.5) / 3;
  const low = Math.max(0.25, Math.min(1, 1 - (player.pos.y - SEA_LEVEL - 10) / 25));
  return Math.max(0, Math.min(1, t)) * low;
}

// Snow settles on the ground (and on leaves) under the open sky while it snows, and melts away out of winter
// (but not in the tundra).
let snowTimer = 0;
function tickSnow(dt) {
  if ((snowTimer -= dt) > 0) return;
  snowTimer = 0.25;
  const winter = seasonOf(day) === 3;
  const snowing = weather.raining && weather.kind === 'snow' && weather.level > 0.3;
  for (let k = 0; k < 4; k++) {
    const x = Math.floor(player.pos.x + (Math.random() - 0.5) * 48), z = Math.floor(player.pos.z + (Math.random() - 0.5) * 48);
    if (!world.chunkAt(x, z)) continue;
    let y = Math.min(H - 2, Math.floor(player.pos.y) + 24);
    while (y > Math.floor(player.pos.y) - 24 && world.get(x, y, z) === AIR) y--;
    const id = world.get(x, y, z);
    if (id === SNOW_LAYER || BLOCKS[id]?.snowman) {
      const tundra = world.generator.biomeAt(x, z) === 'tundra';
      if (!winter && !tundra && Math.random() < 0.5) world.setBlock(x, y, z, AIR);
      continue;
    }
    if (!snowing || world.skyAt(x, y + 1, z) < MAX_LIGHT) continue;
    const d = BLOCKS[id];
    if ((d?.shape === 'cube' && d.solid && !d.liquid && !d.station) || isLeaves(id)) world.setBlock(x, y + 1, z, SNOW_LAYER);
  }
}

// ---------- v25 D: pets that fetch and bring presents ----------
// Throw a stick (the drop key, or drag it out of your bag) and a tame wolf that isn't told to stay runs after it
// and brings it back. A tame cat, now and then of a morning, leaves you a present.
let catGiftDay = -1;
const CAT_GIFTS = [[FEATHER, 1, 2], [STRING, 1, 2], [RAW_FISH, 1, 1], [SEEDS, 2, 4], [BERRIES, 1, 3], [OLD_BOOT, 1, 1], [CARROT, 1, 2], [POTATO, 1, 2]];
function tickPets(dt) {
  for (const m of mobs.mobs) {
    if (m.kind !== 'wolf' || !m.tame) continue;
    if (m.sitting || m.dying) { if (m.fetch) { m.fetch = null; m.goal = null; } continue; }
    if (m.carrying) {
      // bring it back and drop it at your feet
      m.goal = player.pos;
      if (Math.hypot(m.pos.x - player.pos.x, m.pos.z - player.pos.z) < 2) {
        const dx = player.pos.x - m.pos.x, dz = player.pos.z - m.pos.z; // dropped (tossed) at your feet
        loose.spawn(m.carrying, { x: m.pos.x, y: m.pos.y + 0.5, z: m.pos.z }, { x: dx * 2, y: 2.5, z: dz * 2 }, 0);
        m.carrying = null; m.goal = null; m.parts.carry?.(false);
        sound.mob('wolf', 0.7);
      }
      continue;
    }
    if (m.fetch) {
      if (!loose.items.includes(m.fetch)) { m.fetch = null; m.goal = null; continue; } // someone picked it up
      m.goal = m.fetch.pos;
      if (m.fetch.ground && Math.hypot(m.pos.x - m.fetch.pos.x, m.pos.z - m.fetch.pos.z) < 1.1 && Math.abs(m.pos.y - m.fetch.pos.y) < 1.5) {
        m.carrying = { ...m.fetch.stack };
        loose.remove(m.fetch);
        m.fetch = null; m.parts.carry?.(true);
      }
      continue;
    }
    // look for a stick you've thrown
    const stick = loose.items.find((it) => it.thrown && !mobs.mobs.some((o) => o.fetch === it) && it.pos.distanceTo(m.pos) < 24);
    if (stick) { m.fetch = stick; m.goal = stick.pos; sound.mob('wolf', 0.5); }
  }
  // a cat's morning present
  const hours = (sky.time * 24 + 6) % 24;
  if (catGiftDay !== day && hours > 6.2 && hours < 10) {
    const cat = mobs.mobs.find((m) => m.kind === 'cat' && m.tame && !m.dying && Math.hypot(m.pos.x - player.pos.x, m.pos.z - player.pos.z) < 32);
    if (cat) {
      catGiftDay = day;
      if (Math.random() < 0.6) {
        const [id, a, b] = CAT_GIFTS[Math.floor(Math.random() * CAT_GIFTS.length)];
        loose.spawn({ id, count: a + Math.floor(Math.random() * (b - a + 1)) }, { x: cat.pos.x, y: cat.pos.y + 0.4, z: cat.pos.z }, { x: 0, y: 2, z: 0 }, 0.5);
        sound.mob('cat', 0.8);
        toast(`Your cat has left you a present: ${itemName(id)}`, 2500);
      }
    }
  }
}

// ---------- v26 A: village life ----------
// Villagers go home at dusk and come out again when the bell rings in the morning. Trading with them, and
// selling to them from a market stall, makes a village prosper: every so many deals it builds another house
// (and another villager moves in).
let villageGrowth = new Map(); // "x,z" of the well -> { deals, built: [house, ...] }
let bellDay = -1;
const DEALS_PER_HOUSE = 12;
const villageKey = (v) => `${v.x},${v.z}`;
// The houses a village has built since it was first found go back on its list (the blocks themselves are
// saved with the world like any others).
function villageHouses(v) {
  if (!v || v.grown) return;
  v.grown = true;
  for (const h of villageGrowth.get(villageKey(v))?.built ?? []) if (!v.houses.some((o) => o.x === h.x && o.z === h.z)) v.houses.push({ ...h });
}
function growVillage(v, n = 1) {
  const g = villageEntry(v);
  g.deals += n;
  if (g.deals >= DEALS_PER_HOUSE * (g.built.length + 1) && g.built.length < 6) {
    const h = buildVillageHouse(v);
    if (h) { g.built.push(h); v.houses.push({ ...h }); toast(`${v.name} is doing well: the villagers have built a new house`, 3000); }
  }
}
// Find a level, clear patch 16-22 blocks from the well (in loaded ground) and build a house like the others.
function groundAt(x, z) {
  for (let y = H - 2; y > 1; y--) {
    const id = world.get(x, y, z);
    if (id === AIR || !BLOCKS[id]?.solid || isLeaves(id) || id === LOG) { if (id !== AIR && id !== undefined && (isLeaves(id) || id === LOG)) return null; continue; }
    return y;
  }
  return null;
}
function buildVillageHouse(v) {
  const base = Math.random() * Math.PI * 2;
  for (let i = 0; i < 24; i++) {
    const a = base + i * 0.9, d = 16 + (i % 4) * 2;
    const hx = Math.round(v.x + Math.cos(a) * d), hz = Math.round(v.z + Math.sin(a) * d);
    if (v.houses.some((o) => Math.hypot(o.x - hx, o.z - hz) < 8) || (v.farm && Math.hypot(v.farm.x - hx, v.farm.z - hz) < 7)) continue;
    let ok = true, hy = null;
    for (let dz = -3; dz <= 3 && ok; dz++) for (let dx = -3; dx <= 3 && ok; dx++) {
      if (!world.chunkAt(hx + dx, hz + dz)) { ok = false; break; }
      const g = groundAt(hx + dx, hz + dz);
      if (g === null || world.isWater(hx + dx, g, hz + dz) || world.isWater(hx + dx, g + 1, hz + dz)) { ok = false; break; }
      if (hy === null && !dx && !dz) hy = g;
    }
    if (!ok) continue;
    hy = groundAt(hx, hz);
    for (let dz = -2; dz <= 2 && ok; dz++) for (let dx = -2; dx <= 2 && ok; dx++) if (Math.abs(groundAt(hx + dx, hz + dz) - hy) > 2) ok = false;
    if (!ok) continue;
    const ddx = v.x - hx, ddz = v.z - hz;
    const door = Math.abs(ddx) > Math.abs(ddz) ? [Math.sign(ddx) * 2, 0] : [0, Math.sign(ddz) * 2];
    const h = { x: hx, y: hy, z: hz, door };
    placeHouse(h);
    return h;
  }
  return null;
}
function placeHouse({ x, y, z, door }) {
  const set = (bx, by, bz, id) => world.setBlock(bx, by, bz, id);
  for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) {
    const wx = x + dx, wz = z + dz, edge = Math.abs(dx) === 2 || Math.abs(dz) === 2, corner = Math.abs(dx) === 2 && Math.abs(dz) === 2;
    for (let yy = y - 1; yy > y - 6; yy--) { const id = world.get(wx, yy, wz); if (id !== AIR && BLOCKS[id]?.solid && !world.isWater(wx, yy, wz)) break; set(wx, yy, wz, COBBLE); }
    set(wx, y, wz, edge ? COBBLE : PLANKS);
    for (let k = 1; k <= 3; k++) set(wx, y + k, wz, corner ? LOG : edge ? (k === 2 && (dx === 0 || dz === 0) ? GLASS_PANE : PLANKS) : AIR);
    set(wx, y + 4, wz, PLANKS);
    set(wx, y + 5, wz, edge ? AIR : slabId(0));
    for (let k = 6; k <= 8; k++) if (world.get(wx, y + k, wz) !== AIR && !BLOCKS[world.get(wx, y + k, wz)]?.solid) set(wx, y + k, wz, AIR);
  }
  const dx = x + door[0], dz = z + door[1], facing = door[1] ? 0 : 1;
  set(dx, y + 1, dz, doorId(facing, false, false));
  set(dx, y + 2, dz, doorId(facing, false, true));
  const bx = x - Math.sign(door[0]), bz = z - Math.sign(door[1]);
  const tw = door[0] > 0 ? 0 : door[0] < 0 ? 1 : door[1] > 0 ? 2 : 3;
  set(bx, y + 2, bz, TORCH_WALL_W + tw);
  const side = door[0] ? [0, 1] : [1, 0];
  set(x + side[0], y + 1, z + side[1], FURN_TABLE);
  set(x - side[0], y + 1, z - side[1], CHEST);
  // a path of gravel out of the door
  for (let k = 1; k <= 3; k++) {
    const px = dx + Math.sign(door[0]) * k, pz = dz + Math.sign(door[1]) * k, g = groundAt(px, pz);
    if (g !== null && [GRASS, DIRT].includes(world.get(px, g, pz))) set(px, g, pz, GRAVEL);
  }
}
// What villagers pay at a stall: [how many they take, coins]. Food by how filling it is, metal well, and
// building stuff cheaply.
function stallPrice(id) {
  if (isFine(id)) return [1, 4]; // (v28: the pick of the harvest)
  if (id === FINE_WINE || id === AGED_CHEESE || id === PEARL || id === VINTAGE_CIDER || id === FINE_BERRY_WINE) return [1, 6];
  if (id === OLD_WHISKY) return [1, 7]; // (v35)
  if (id === WHISKY) return [1, 4]; // the best things villagers can buy
  if (id === WINE || id === CHEESE || id === CIDER || id === BERRY_WINE) return [1, 3];
  if (ITEMS[id]?.treat) return [1, 3]; // (v34) villagers love a treat
  const food = foodValue(id);
  if (food) return food >= 6 ? [1, 2] : food >= 3 ? [1, 1] : [2, 1];
  if (id === GOLD_INGOT || id === STARSTEEL_INGOT) return [1, 5];
  if (/Ingot$/.test(ITEMS[id]?.name ?? '')) return [1, 2];
  if (id === COIN) return null;
  if (isBlock(id)) return [8, 1];
  return [4, 1];
}
const STALL_REACH = 9;
let stallTimer = 0;
// A villager near a stall, in the daytime, buys one lot of whatever is on it every so often and pays into it.
function tickStalls(dt) {
  stallTimer -= dt;
  if (stallTimer > 0) return;
  stallTimer = 2;
  if (mobs.villagerNight()) return;
  for (const [k, st] of stations.map) {
    if (st.kind !== 'stall') continue;
    st.sellIn = (st.sellIn ?? 18) - 2;
    if (st.sellIn > 0) continue;
    const [x, y, z] = k.split(',').map(Number);
    if (Math.hypot(x - player.pos.x, z - player.pos.z) > 96) continue;
    const buyer = mobs.mobs.find((m) => m.spec.villager && !m.indoors && !m.dying && Math.hypot(m.pos.x - x - 0.5, m.pos.z - z - 0.5) < STALL_REACH);
    if (!buyer) continue;
    const i = st.inputs.findIndex((s2) => s2 && s2.id !== COIN && stallPrice(s2.id));
    if (i < 0) continue;
    const stack = st.inputs[i], [n, coins0] = stallPrice(stack.id), coins = coins0 * (festivalToday() ? 2 : 1); // festival days pay double
    if (stack.count < n) continue;
    // room for the coins?
    const ci = st.inputs.findIndex((s2) => s2 && s2.id === COIN && s2.count + coins <= maxStack(COIN));
    const free = ci >= 0 ? ci : (stack.count === n ? i : st.inputs.findIndex((s2) => !s2));
    if (free < 0) continue;
    stack.count -= n;
    if (!stack.count) st.inputs[i] = null;
    if (st.inputs[free]?.id === COIN) st.inputs[free].count += coins; else st.inputs[free] = { id: COIN, count: coins };
    st.sellIn = 14 + Math.random() * 10;
    buyer.heading = Math.atan2(x + 0.5 - buyer.pos.x, z + 0.5 - buyer.pos.z); buyer.yaw = buyer.heading; buyer.state = 'idle'; buyer.timer = 2;
    const d = Math.hypot(x - player.pos.x, y - player.pos.y, z - player.pos.z);
    if (d < 20) { sound.mob('villager', 0.6 * (1 - d / 20)); sound.pop(); }
    if (openStationAt && openStationAt.x === x && openStationAt.y === y && openStationAt.z === z) renderStation?.();
    if (buyer.home) { growVillage(buyer.home); addRep(buyer.home, 0.5); }
  }
}
// The bell, first thing in the morning: the villagers come out.
function tickVillages(dt) {
  world.day = day;
  const hours = (sky.time * 24 + 6) % 24;
  mobs.hour = hours;
  const v = world.generator.nearestVillage(player.pos.x, player.pos.z, 1);
  if (v) villageHouses(v);
  if (v && bellDay !== day && hours > 6.05 && hours < 9) {
    bellDay = day;
    const d = Math.hypot(v.x + 2 - player.pos.x, v.z - player.pos.z);
    const fest = festivalToday();
    if (d < 64) { sound.ding(Math.max(0.15, 1 - d / 64)); setTimeout(() => sound.ding(Math.max(0.15, 1 - d / 64) * 0.8), 700); toast(fest ? `The bell rings in ${v.name}: it's the ${fest.name}! Stalls and requests pay double today, and there are fireworks after dark` : `The bell rings in ${v.name}: the villagers are up and about`, fest ? 4000 : 2600); }
  }
  mobs.festival = !!festivalToday();
  if (v) tickFestival(v, hours, dt);
  tickStalls(dt);
}

// ---------- v27 B: requests, reputation and festivals ----------
// Each village asks for something new every day (tap its bell to hear what, and tap it again holding the goods
// to hand them over). Trading, selling at a stall and filling requests earn its good opinion: friends of the
// village get better prices, and its heroes better still. On the fourth day of every season it holds a festival:
// decorations go up round the well, stalls and requests pay double, the villagers stay up late and there are
// fireworks after dark.
const REP_TIERS = [[60, 'Hero', 0.65], [30, 'Friend', 0.8], [10, 'Neighbour', 1], [0, 'Stranger', 1]];
const repTier = (rep) => REP_TIERS.find(([n]) => rep >= n);
function villageEntry(v) {
  villageHouses(v);
  let g = villageGrowth.get(villageKey(v));
  if (!g) villageGrowth.set(villageKey(v), g = { deals: 0, built: [] });
  g.rep ??= 0; g.reqDay ??= -1; g.decorDay ??= -1; g.decor ??= [];
  return g;
}
const repOf = (v) => villageGrowth.get(villageKey(v))?.rep ?? 0;
function addRep(v, n) {
  const g = villageEntry(v), before = repTier(g.rep);
  g.rep = Math.min(100, g.rep + n);
  const after = repTier(g.rep);
  if (after !== before) {
    toast(after[1] === 'Hero' ? `${v.name} calls you its hero! The villagers give you their best prices` : `The people of ${v.name} count you a ${after[1].toLowerCase()} now${after[2] < 1 ? ': they give you better prices' : ''}`, 3200);
    if (after[1] === 'Hero') achieve('hero');
  }
}
// What a trade costs you here: friends and heroes of the village pay less.
const tradeCost = (n, v) => (v ? Math.max(1, Math.round(n * repTier(repOf(v))[2])) : n);
function tradeGreeting(v) {
  const t = v ? repTier(repOf(v))[1] : 'Stranger';
  return { Stranger: '"Hello, traveller. Have a look at what I can offer."', Neighbour: '"Welcome, neighbour! Have a look at what I can offer."',
    Friend: '"Ah, my friend! For you, a better price."', Hero: '"Our hero! Take anything you like, for next to nothing."' }[t];
}
// [item, how many, coins]
const REQUESTS = [[BREAD, 6, 4], [CARROT, 12, 3], [POTATO, 12, 3], [EGG, 8, 3], [WOOL, 8, 4], [LOG, 24, 3], [PLANKS, 32, 3], [COBBLE, 48, 3],
  [TORCH, 16, 3], [IRON_INGOT, 6, 6], [BAKED_FISH, 6, 4], [PAPER, 8, 4], [GLASS, 12, 4], [WINE, 1, 5], [CHEESE, 2, 5], [CIDER, 1, 5], [ONION, 10, 3], [TOMATO, 10, 3]];
const SEASON_REQUESTS = [[[POPPY, 6, 2], [EGG, 12, 4]], [[WOOL, 12, 5], [BAKED_FISH, 8, 5]], [[PUMPKIN, 3, 4], [CARROT, 16, 4], [BERRY_WINE, 1, 5]], [[LOG, 32, 4], [TORCH, 24, 4]]];
function requestFor(v, d = day) {
  let h = 7;
  for (const c of `${villageKey(v)}:${d}`) h = (h * 31 + c.charCodeAt(0)) | 0;
  const pool = [...REQUESTS, ...SEASON_REQUESTS[seasonOf(d)]];
  return pool[Math.abs(h) % pool.length];
}
const FESTIVALS = [{ name: 'Blossom Fair' }, { name: 'Midsummer Feast' }, { name: 'Harvest Festival' }, { name: 'Frost Fair' }];
const festivalToday = (d = day) => ((d - 1) % SEASON_DAYS === 3 ? FESTIVALS[seasonOf(d)] : null);
function ringBell(x, z, held) {
  const v = world.generator.nearestVillage(x, z, 1);
  sound.ding();
  if (!v) { toast('Ding!', 1500); return; }
  const g = villageEntry(v), [id, n, coins] = requestFor(v), fest = festivalToday(), tier = repTier(g.rep)[1];
  const head = `${v.name}${fest ? ` (the ${fest.name})` : ''}: you are a ${tier.toLowerCase()} here.`;
  if (fest && held && isFine(held.id)) { showProduce(v, g, held); return; }
  if (fest && held && contestScore(held.id, seasonOf(day))) { foodContest(v, g, held, fest); return; }
  if (g.reqDay === day) { toast(`${head} You've done what they asked today: come back tomorrow`, 3000); return; }
  if (held?.id === id && inventory.count(id) >= n) {
    inventory.remove(id, n);
    const pay = coins * (fest ? 2 : 1);
    giveDrops([[COIN, pay]]);
    g.reqDay = day;
    sound.pop(); setTimeout(() => sound.ding(0.6), 250);
    toast(`The people of ${v.name} thank you for the ${itemName(id).toLowerCase()} and pay you ${pay} coin${pay > 1 ? 's' : ''}`, 3200);
    addRep(v, 8);
    return;
  }
  toast(`${head} Today they need ${n} × ${itemName(id)} (${coins * (fest ? 2 : 1)} coins): tap the bell holding them${fest ? '. Bring fine produce for the show, and a dish for the food contest!' : ''}`, 4000);
}
// Decorations round the well: flowers in spring, lanterns in summer, jack-o'-lanterns in autumn and snowmen in winter.
// They go up on the morning of the festival and come down the next day (unless you've moved them).
const DECOR = [[POPPY, DANDELION, DAISY, LAVENDER], [LANTERN], [JACK_O_LANTERN], [SNOWMAN]];
let fireworkIn = 0;
function tickFestival(v, hours, dt) {
  const fest = festivalToday(), g = villageEntry(v);
  const near = Math.hypot(v.x - player.pos.x, v.z - player.pos.z);
  if (near > 96) return;
  const cx = v.x + 0.5, cz = v.z + 0.5;
  const loaded = (x, z) => !!world.chunkAt(x, z);
  if (fest && g.decorDay !== day && loaded(v.x - 6, v.z - 6) && loaded(v.x + 6, v.z + 6)) {
    takeDownDecor(g);
    g.decorDay = day;
    const kinds = DECOR[seasonOf(day)];
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2, x = Math.floor(cx + Math.cos(a) * 5), z = Math.floor(cz + Math.sin(a) * 5);
      const y = groundAt(x, z);
      if (y == null || world.get(x, y + 1, z) !== AIR || BLOCKS[world.get(x, y, z)]?.liquid) continue;
      let id = kinds[k % kinds.length];
      if (id === SNOWMAN) {
        // face the well
        const dx = cx - (x + 0.5), dz = cz - (z + 0.5);
        let best = 0;
        FACING_DIRS.forEach(([fx, fz], f) => { if (fx * dx + fz * dz > FACING_DIRS[best][0] * dx + FACING_DIRS[best][1] * dz) best = f; });
        id += best;
      }
      world.setBlock(x, y + 1, z, id);
      g.decor.push([x, y + 1, z, id]);
    }
  } else if (!fest && g.decor.length && g.decor.every(([x, , z]) => loaded(x, z))) takeDownDecor(g);
  // fireworks over the village after dark
  if (fest && hours > 19.5 && hours < 23 && near < 120 && (fireworkIn -= dt) <= 0) {
    fireworkIn = 1.2 + Math.random() * 2.5;
    const x = cx + (Math.random() - 0.5) * 12, z = cz + (Math.random() - 0.5) * 12, y = groundAt(Math.floor(x), Math.floor(z)) ?? v.y;
    fireworks.launch(x, y + 1.5, z);
    const d = Math.hypot(x - player.pos.x, z - player.pos.z);
    if (d < 40) sound.fuse();
  }
}
function takeDownDecor(g) {
  for (const [x, y, z, id] of g.decor) if (world.get(x, y, z) === id) world.setBlock(x, y, z, AIR);
  g.decor = [];
}


// ---------- v27 D: rope ladders and rope bridges ----------
// A rope ladder fixed to the side of a block (or to the edge of a drop: tap the top of the edge block, looking
// out over it) unrolls straight down until it reaches something, one piece from your hand for each block.
// Tap the ladder with more to make it longer. Cut it (or what it hangs from) and it rolls back up into your bag.
const MAX_ROPE = 48;
function hangRopeLadder(t) {
  const d = BLOCKS[t.id];
  let x, y, z, f;
  if (d.ropeLadder) {
    x = t.x; z = t.z; f = d.facing; y = t.y;
    while (y > 1 && BLOCKS[world.get(x, y - 1, z)]?.ropeLadder) y--;
    y--;
  } else {
    if (!d.solid) { toast('Rope ladders hang from the side of a solid block'); return; }
    let dx = t.nx, dz = t.nz;
    if (t.ny === 1) { const l = player.lookDir(); [dx, dz] = Math.abs(l.x) > Math.abs(l.z) ? [Math.sign(l.x), 0] : [0, Math.sign(l.z)]; } // over the edge
    else if (t.ny !== 0) { toast('Rope ladders hang from the side of a block, or over the edge of a drop'); return; }
    x = t.x + dx; y = t.y; z = t.z + dz; f = FACING_DIRS.findIndex(([fx, fz]) => fx === dx && fz === dz);
  }
  const held = inventory.held();
  let n = 0;
  while (n < Math.min(held.count, MAX_ROPE) && y > 0 && world.get(x, y, z) === AIR) { world.setBlock(x, y, z, ROPE_LADDER + f); n++; y--; }
  if (!n) { toast('There\'s no room for the ladder to hang there'); return; }
  takeFromHeld(n);
  sound.place('wool');
  const more = y > 0 && world.get(x, y, z) === AIR;
  toast(`The rope ladder unrolls ${n} block${n > 1 ? 's' : ''} down${more ? ': it doesn\'t reach the bottom yet (tap it with more)' : ''}`, 2000);
}
function rollUpRope(x, y, z) {
  let n = 0;
  while (y > 0 && BLOCKS[world.get(x, y, z)]?.ropeLadder) { world.setBlock(x, y, z, AIR); n++; y--; }
  if (n) giveDrops([[ROPE_LADDER, n]]);
}
// A rope bridge is laid out from the block you tap, level with its top, the way you're facing, plank by plank
// until it reaches the other side (or you run out). Tap the end of one to carry on with it.
const MAX_BRIDGE = 48;
function layBridge(t) {
  const d = BLOCKS[t.id];
  if (!d.solid && d.bridge == null) { toast('Lay a rope bridge out from the top of a solid block'); return; }
  const l = player.lookDir(), along = Math.abs(l.x) > Math.abs(l.z), dx = along ? Math.sign(l.x) : 0, dz = along ? 0 : Math.sign(l.z), a = along ? 1 : 0;
  const held = inventory.held(), max = Math.min(held.count, MAX_BRIDGE);
  let x = t.x, z = t.z, n = 0, reached = false;
  for (let k = 0; k < 96 && n < max; k++) {
    x += dx; z += dz;
    const id = world.get(x, t.y, z);
    if (BLOCKS[id]?.bridge != null) continue; // over what's laid already
    if (id !== AIR) { reached = true; break; }
    world.setBlock(x, t.y, z, ROPE_BRIDGE + a);
    if (world.get(x, t.y + 1, z) === AIR) world.setBlock(x, t.y + 1, z, BRIDGE_RAIL + a);
    n++;
  }
  if (!n) { toast('There\'s nowhere to lay a bridge that way'); return; }
  if (!reached && n === max) { const id = world.get(x + dx, t.y, z + dz); reached = id !== AIR && BLOCKS[id]?.bridge == null; }
  takeFromHeld(n);
  sound.place('wood');
  toast(`You lay out ${n} block${n > 1 ? 's' : ''} of rope bridge${reached ? ' to the other side' : ': it doesn\'t reach across yet (tap its end with more)'}`, 2200);
}


// ---------- v27 E: canal locks ----------
// Turning a sluice wheel works the lock beside it. The chamber is the walled-in water (or air) next to the
// wheel, up to the bank it stands on; its gates are the lock gates in its walls (or the open gateways where
// they were). Beyond each gate is a stretch of canal, and the water there has a level. The wheel shuts every
// gate, fills or drains the chamber a layer at a time to the level of a canal on another side, and then opens
// that canal's gate (its cells fill with water up to the level, and the rest stand open).
const openGates = new Map(); // "x,y,z" of a lock gate that's standing open -> (the gate's id)
const lockJobs = []; // locks filling or draining: { cells, level, target, open: [gate cells], timer }
const MAX_CHAMBER = 600;
let lockTimer = 0;
function findLock(wx, wy, wz) {
  const top = wy - 1; // (the level of the bank the wheel stands on)
  const start = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dz]) => [wx + dx, top, wz + dz]).filter(([x, y, z]) => (world.get(x, y, z) === AIR || world.isWater(x, y, z)) && !openGates.has(`${x},${y},${z}`));
  if (!start.length) return null;
  // (the wheel has a chamber on one side and open bank or canal on the others: try each side)
  let best = null;
  for (const s of start) {
    const L = chamberFrom(s, top);
    if (L.cells) return L;
    best = L.noGates ? L : best ?? L;
  }
  return best;
}
function chamberFrom(from, top) {
  const seen = new Set(), cells = [], gates = new Map();
  const queue = [from];
  seen.add(from.join(','));
  while (queue.length) {
    const [x, y, z] = queue.pop();
    cells.push([x, y, z]);
    if (cells.length > MAX_CHAMBER) return { tooBig: true };
    for (const [dx, dy, dz] of [[1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1], [0, -1, 0], [0, 1, 0]]) {
      const nx = x + dx, ny = y + dy, nz = z + dz, k = `${nx},${ny},${nz}`;
      if (ny > top || ny < 1 || seen.has(k)) continue;
      seen.add(k);
      const id = world.get(nx, ny, nz);
      if (id === LOCK_GATE || openGates.has(k)) { if (dy === 0) gates.set(k, [nx, ny, nz, dx, dz]); continue; }
      if (id === AIR || isWaterId(id)) queue.push([nx, ny, nz]);
    }
  }
  if (!gates.size) return { noGates: true };
  // the gates in each wall, and the canal level beyond them
  const ends = new Map(); // level -> [gate cells]
  for (const [, [x, y, z, dx, dz]] of gates) {
    let level = null;
    for (let cy = top + 1; cy >= top - 16 && level === null; cy--) if (world.isWater(x + dx, cy, z + dz) && !world.isWater(x + dx, cy + 1, z + dz)) level = cy;
    if (level === null) continue;
    if (!ends.has(level)) ends.set(level, []);
    ends.get(level).push([x, y, z]);
  }
  let level = -1;
  for (const [x, y, z] of cells) if (world.isWater(x, y, z) && y > level) level = y;
  if (level < 0) level = Math.min(...cells.map((c) => c[1])) - 1;
  return { cells, gates: [...gates.values()].map(([x, y, z]) => [x, y, z]), ends, level };
}
function workLock(x, y, z) {
  sound.place('wood');
  if (lockJobs.some((j) => j.wheel === `${x},${y},${z}`)) { toast('The lock is already working', 1500); return; }
  const L = findLock(x, y, z);
  if (!L) { toast('A sluice wheel works the lock beside it: stand it on the bank, next to the chamber', 3000); return; }
  if (L.tooBig) { toast('That isn\'t a lock chamber: the water beside the wheel needs walls and lock gates all round', 3000); return; }
  if (L.noGates || !L.ends.size) { toast('The chamber needs lock gates in its walls, with canal water beyond them', 3000); return; }
  const levels = [...L.ends.keys()].sort((a, b) => a - b);
  if (levels.length < 2) { toast('The canals on either side are at the same level: no lock is needed', 2500); return; }
  // go to the next level up, or back to the bottom once it's at the top
  const target = levels.find((l) => l > L.level) ?? levels[0];
  // shut every gate first
  for (const [gx, gy, gz] of L.gates) { const k = `${gx},${gy},${gz}`; if (openGates.has(k)) { world.setBlock(gx, gy, gz, LOCK_GATE); openGates.delete(k); } }
  lockJobs.push({ wheel: `${x},${y},${z}`, cells: L.cells, level: L.level, target, open: L.ends.get(target), timer: 0.6 });
  sound.splash(true);
  toast(target > L.level ? 'The sluices open: the lock is filling' : 'The sluices open: the lock is draining', 2200);
}
function tickLocks(dt) {
  if (!lockJobs.length) return;
  if ((lockTimer -= dt) > 0) return;
  lockTimer = 0.4;
  for (let i = lockJobs.length - 1; i >= 0; i--) {
    const j = lockJobs[i];
    if (j.level !== j.target) {
      if (j.level < j.target) { j.level++; for (const [x, y, z] of j.cells) if (y === j.level && world.get(x, y, z) === AIR) world.setBlock(x, y, z, WATER); }
      else { for (const [x, y, z] of j.cells) if (y === j.level && world.isWater(x, y, z)) world.setBlock(x, y, z, AIR); j.level--; }
      const [x, , z] = j.cells[0];
      if (Math.hypot(x - player.pos.x, z - player.pos.z) < 24 && Math.random() < 0.5) sound.splash(false);
      continue;
    }
    // there: open the gates on the side whose canal is at this level
    for (const [x, y, z] of j.open) { world.setBlock(x, y, z, y <= j.target ? WATER : AIR); openGates.set(`${x},${y},${z}`, LOCK_GATE); }
    sound.place('wood');
    const [x, , z] = j.cells[0];
    if (Math.hypot(x - player.pos.x, z - player.pos.z) < 32) toast('The lock gates swing open', 1800);
    achieve('lock');
    lockJobs.splice(i, 1);
  }
}


// ---------- v27 F: falling stalactites ----------
// Walk under a stalactite in the dark and now and then one cracks and comes down. Dig out the rock one hangs
// from and it falls too. It hurts (a helmet helps), and shatters where it lands.
const shaking = []; // stalactites about to fall: { x, y, z, wait }
const fallingRocks = []; // { mesh, x, y, z, vy }
const rockGeo = new THREE.ConeGeometry(0.2, 0.9, 6).rotateX(Math.PI);
const rockMat = new THREE.MeshLambertMaterial({ color: 0xa08c74 });
let rockTimer = 0, rockWarned = false;
function loosenStalactite(x, y, z, wait = 0.8) {
  if (shaking.some((s) => s.x === x && s.y === y && s.z === z)) return;
  shaking.push({ x, y, z, wait });
  const d = Math.hypot(x + 0.5 - player.pos.x, y - player.pos.y, z + 0.5 - player.pos.z);
  if (d < 16) { sound.crackle(1 - d / 16); smoke.puff(x + 0.5, y + 0.9, z + 0.5, { grey: 0.6, size: 0.25, life: 1.2, rise: -0.4, spread: 0.4 }); }
  if (d < 6 && !rockWarned) { rockWarned = true; toast('Crack! Something overhead is coming loose: look out', 2200); }
}
function clearRocks() { for (const r of fallingRocks) scene.remove(r.mesh); fallingRocks.length = 0; shaking.length = 0; }
function tickStalactites(dt) {
  for (let i = shaking.length - 1; i >= 0; i--) {
    const s = shaking[i];
    if ((s.wait -= dt) > 0) continue;
    shaking.splice(i, 1);
    if (!BLOCKS[world.get(s.x, s.y, s.z)]?.stalactite) continue;
    world.setBlock(s.x, s.y, s.z, AIR);
    const mesh = new THREE.Mesh(rockGeo, rockMat);
    mesh.position.set(s.x + 0.5, s.y + 0.5, s.z + 0.5);
    scene.add(mesh);
    fallingRocks.push({ mesh, x: s.x + 0.5, y: s.y + 0.5, z: s.z + 0.5, vy: 0 });
  }
  for (let i = fallingRocks.length - 1; i >= 0; i--) {
    const r = fallingRocks[i];
    r.vy -= 22 * dt; r.y += r.vy * dt;
    r.mesh.position.y = r.y;
    const p = player.pos, tip = r.y - 0.45;
    const hit = Math.abs(p.x - r.x) < 0.6 && Math.abs(p.z - r.z) < 0.6 && tip <= p.y + 1.8 && tip >= p.y - 0.2;
    const landed = world.isSolid(Math.floor(r.x), Math.floor(tip), Math.floor(r.z)) || world.isWater(Math.floor(r.x), Math.floor(tip), Math.floor(r.z)) || tip < 0;
    if (!hit && !landed) continue;
    scene.remove(r.mesh);
    fallingRocks.splice(i, 1);
    const d = Math.hypot(r.x - p.x, r.y - p.y, r.z - p.z);
    if (d < 20) sound.breakBlock('stone');
    if (hit) damage(armoured(4), 'Struck by a falling stalactite');
    else if (Math.random() < 0.5) loose.spawn(STALACTITE, { x: r.x, y: Math.floor(tip) + 1.1, z: r.z }, { x: 0, y: 2, z: 0 }, 0);
  }
  if ((rockTimer -= dt) > 0) return;
  rockTimer = 0.5;
  const px = Math.floor(player.pos.x), py = Math.floor(player.pos.y + 1.6), pz = Math.floor(player.pos.z);
  if (dead || creative || world.skyAt(px, py, pz) >= 4) return;
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    for (let y = py + 1; y < py + 10; y++) {
      const id = world.get(px + dx, y, pz + dz);
      if (id === AIR) continue;
      if (BLOCKS[id]?.stalactite && Math.random() < 0.05) loosenStalactite(px + dx, y, pz + dz);
      break;
    }
  }
}

// ---------- v27 G: find things in chests nearby; photo mode ----------
// Type in the box under the backpack to see which chests (barrels, urns, stalls and nets too) within
// SEARCH_REACH hold something whose name matches. "Show" marks the chest with a glowing outline and a beam
// for a while; "Take" (when it's in reach) moves what matched into your backpack.
const SEARCH_REACH = 32, TAKE_REACH = 6, MARK_TIME = 25;
function searchChests(q) {
  q = String(q ?? '').trim().toLowerCase();
  if (!q || !world) return [];
  const px = player.pos.x, py = player.pos.y, pz = player.pos.z, out = [];
  for (const [k, st] of stations.map) {
    if (!STATION_KINDS[st.kind]?.storage) continue;
    const [x, y, z] = k.split(',').map(Number);
    const dist = Math.hypot(x + 0.5 - px, y + 0.5 - py, z + 0.5 - pz);
    if (dist > SEARCH_REACH || stationKind(world.get(x, y, z)) !== st.kind) continue; // (a chest that's since been broken)
    const found = new Map();
    for (const s of st.inputs) if (s?.count > 0 && itemName(s.id).toLowerCase().includes(q)) found.set(s.id, (found.get(s.id) ?? 0) + s.count);
    if (found.size) out.push({ x, y, z, kind: st.kind, name: STATION_KINDS[st.kind].name, dist, items: [...found].map(([id, count]) => ({ id, count })) });
  }
  return out.sort((a, b) => a.dist - b.dist);
}
function whereIs(x, y, z) {
  const dx = x + 0.5 - player.pos.x, dz = z + 0.5 - player.pos.z, dy = y - Math.floor(player.pos.y);
  const flat = Math.round(Math.hypot(dx, dz));
  return (flat ? `${flat} block${flat > 1 ? 's' : ''} ${pointOf(dx, dz)}` : 'right here') + (dy > 1 ? `, ${dy} up` : dy < -1 ? `, ${-dy} down` : '');
}
// Move the matching things out of the chest at (x, y, z) into your backpack. Returns how many moved.
function takeFromChest(x, y, z, q) {
  const kind = stationKind(world.get(x, y, z));
  if (!kind || !STATION_KINDS[kind].storage) return 0;
  if (Math.hypot(x + 0.5 - player.pos.x, y + 0.5 - player.pos.y, z + 0.5 - player.pos.z) > TAKE_REACH + 0.5) { toast('That one\'s too far away to reach'); return 0; }
  q = String(q).trim().toLowerCase();
  const st = stations.get(x, y, z, kind);
  let moved = 0;
  st.inputs.forEach((s, i) => {
    if (!s?.count || !itemName(s.id).toLowerCase().includes(q)) return;
    const had = s.count, left = inventory.addItem(s);
    moved += had - left;
    st.inputs[i] = left ? { ...s, count: left } : null;
  });
  inventory.onChange();
  if (moved) sound.pop(); else toast('Inventory full: dropped at your feet');
  return moved;
}
let chestMark = null; // { group, until }
function markChest(x, y, z) {
  clearChestMark();
  const mat = new THREE.LineBasicMaterial({ color: 0xffe066, depthTest: false, transparent: true, fog: false });
  const box = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1.06, 1.06, 1.06)), mat);
  const beamGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0.55, 0), new THREE.Vector3(0, 14, 0)]);
  const beam = new THREE.Line(beamGeo, mat);
  const group = new THREE.Group();
  group.add(box, beam);
  group.position.set(x + 0.5, y + 0.5, z + 0.5);
  group.renderOrder = 999; box.renderOrder = 999; beam.renderOrder = 999;
  scene.add(group);
  chestMark = { group, mat, until: performance.now() + MARK_TIME * 1000 };
}
function clearChestMark() {
  if (!chestMark) return;
  scene.remove(chestMark.group);
  chestMark.group.traverse((o) => o.geometry?.dispose());
  chestMark.mat.dispose();
  chestMark = null;
}
function tickChestMark(now) {
  if (!chestMark) return;
  const left = (chestMark.until - now) / 1000;
  if (left <= 0) { clearChestMark(); return; }
  chestMark.mat.opacity = Math.min(1, left / 3) * (0.65 + 0.35 * Math.sin(now * 0.008));
  chestMark.group.visible = !photoMode; // (kept out of photos)
  // gone once you're standing next to it
  const p = chestMark.group.position;
  if (Math.hypot(p.x - player.pos.x, p.y - player.pos.y - 0.5, p.z - player.pos.z) < 1.8) chestMark.until = Math.min(chestMark.until, now + 1500);
}
function renderChestResults() {
  const q = $('chest-search').value, box = $('chest-results');
  if (!q.trim()) { box.innerHTML = ''; return; }
  const found = searchChests(q);
  if (!found.length) { box.innerHTML = `<div class="cs-none">No chest within ${SEARCH_REACH} blocks holds “${escapeHtml(q.trim())}”.</div>`; return; }
  box.innerHTML = '';
  for (const r of found.slice(0, 12)) {
    const el = document.createElement('div');
    el.className = 'cs-box';
    el.innerHTML = `<div class="cs-head"><b>${r.name}</b><span>${whereIs(r.x, r.y, r.z)}</span></div>` +
      `<div class="cs-items">${r.items.map((it) => `<span class="cs-item"><img src="${icons[it.id]}" alt="" width="20" height="20">${it.count} ${escapeHtml(itemName(it.id))}</span>`).join('')}</div>`;
    const show = document.createElement('button');
    show.className = 'btn small'; show.textContent = 'Show';
    show.addEventListener('click', () => { closeInventory(); markChest(r.x, r.y, r.z); toast(`${r.name}: ${whereIs(r.x, r.y, r.z)} (look for the gold outline)`, 3500); });
    el.firstChild.appendChild(show);
    if (r.dist <= TAKE_REACH + 0.5) {
      const take = document.createElement('button');
      take.className = 'btn small'; take.textContent = 'Take';
      take.addEventListener('click', () => { picked = -1; takeFromChest(r.x, r.y, r.z, q); renderInventory(); renderChestResults(); });
      el.firstChild.appendChild(take);
    }
    box.appendChild(el);
  }
}
function escapeHtml(s) { return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
$('chest-search').addEventListener('input', renderChestResults);

// Photo mode: the HUD goes, the player stands still, and the camera floats free (within PHOTO_LEASH blocks)
// so you can frame a shot. 📷 saves the picture as a PNG. F2 or the menu button go in; F2, Esc or ✕ come out.
const PHOTO_LEASH = 48, PHOTO_SPEED = 7;
let photoMode = false;
const photoCam = new THREE.Vector3();
const photoLift = { up: false, down: false };
let lastPhoto = null; // (the last picture's data URL, for tests)
function enterPhotoMode() {
  if (!world || !worldReady || dead || photoMode) return false;
  if (openStationAt) closeStation();
  for (const id of ['menu', 'inventory']) $(id).classList.add('hidden');
  photoMode = true;
  paused = false;
  controls.reset();
  photoCam.copy(player.eye);
  document.body.classList.add('photo');
  $('photo-bar').classList.remove('hidden');
  return true;
}
function exitPhotoMode() {
  if (!photoMode) return;
  photoMode = false;
  photoLift.up = photoLift.down = false;
  controls.reset();
  document.body.classList.remove('photo');
  $('photo-bar').classList.add('hidden');
}
function movePhotoCam(dt) {
  const fwd = new THREE.Vector3(-Math.sin(player.yaw) * Math.cos(player.pitch), Math.sin(player.pitch), -Math.cos(player.yaw) * Math.cos(player.pitch));
  const right = new THREE.Vector3(Math.cos(player.yaw), 0, -Math.sin(player.yaw));
  const lift = (controls.jump || photoLift.up ? 1 : 0) - (controls.down || photoLift.down ? 1 : 0);
  const step = new THREE.Vector3().addScaledVector(fwd, controls.moveZ).addScaledVector(right, controls.moveX);
  step.y += lift;
  if (step.lengthSq() > 1) step.normalize();
  step.multiplyScalar(PHOTO_SPEED * dt);
  // slide along the axes one at a time, so the camera can't go through walls
  for (const ax of ['x', 'y', 'z']) {
    if (!step[ax]) continue;
    const was = photoCam[ax];
    photoCam[ax] += step[ax];
    if (world.isSolid(Math.floor(photoCam.x), Math.floor(photoCam.y), Math.floor(photoCam.z))) photoCam[ax] = was;
  }
  const eye = player.eye, off = photoCam.clone().sub(eye);
  if (off.length() > PHOTO_LEASH) photoCam.copy(eye).add(off.setLength(PHOTO_LEASH));
  photoCam.y = Math.max(-10, Math.min(H + 30, photoCam.y));
}
function snapPhoto() {
  if (!photoMode) return null;
  document.body.classList.add('snapping');
  gfx.render(scene, camera);
  let url = null;
  try { url = renderer.domElement.toDataURL('image/png'); } catch (err) { reportError(err); }
  document.body.classList.remove('snapping');
  if (!url) return null;
  lastPhoto = url;
  const a = document.createElement('a');
  a.href = url;
  a.download = `minicraft-day${day}-${String(Math.floor(((sky.time * 24 + 6) % 24) * 100)).padStart(4, '0')}.png`;
  if (!navigator.webdriver) a.click();
  sound.pop();
  const fx = $('photo-bar');
  fx.style.opacity = '0.2'; setTimeout(() => { fx.style.opacity = ''; }, 250);
  return url;
}
$('btn-photo').addEventListener('click', enterPhotoMode);
$('photo-exit').addEventListener('click', exitPhotoMode);
$('photo-snap').addEventListener('click', snapPhoto);
for (const [id, k] of [['photo-up', 'up'], ['photo-down', 'down']]) {
  const b = $(id);
  b.addEventListener('pointerdown', (e) => { e.preventDefault(); photoLift[k] = true; });
  for (const ev of ['pointerup', 'pointerleave', 'pointercancel']) b.addEventListener(ev, () => { photoLift[k] = false; });
}
window.addEventListener('keydown', (e) => {
  if (e.target?.tagName === 'INPUT' || e.target?.tagName === 'TEXTAREA') return;
  if (e.code === 'F2') { e.preventDefault(); if (photoMode) exitPhotoMode(); else if (!paused) enterPhotoMode(); }
  else if (photoMode && e.code === 'Escape') exitPhotoMode();
  else if (photoMode && (e.code === 'Enter' || e.code === 'KeyP')) snapPhoto();
});

// ---------- v28 E: fine crops, festival shows, special trades ----------
// A ripe crop sometimes comes up fine: one in sixteen as a rule, one in five from soil beans have fed, a bit
// more under glass, and seldom from tired soil.
function fineChance(x, y, z) {
  let c = world.soilRich(x, y - 1, z) ? 0.2 : 0.06;
  if (world.underGlass(x, y, z)) c += 0.04;
  return c * [1, 0.5, 0.25, 0][world.soilTired(x, y - 1, z)];
}
function fineHarvest(drops, x, y, z) {
  const i = drops.findIndex(([d]) => FINE_CROPS[d]);
  if (i < 0 || Math.random() >= fineChance(x, y, z)) return drops;
  const [d, n] = drops[i];
  achieve('fine');
  const out = drops.slice();
  out.splice(i, 1, [FINE_CROPS[d], 1], ...(n > 1 ? [[d, n - 1]] : []));
  return out;
}
// On a festival day the village holds a show: tap the bell with fine produce to enter it (once a day).
function showProduce(v, g, held) {
  if (g.showDay === day) { toast(`You've already entered ${v.name}'s show today`, 2500); return; }
  g.showDay = day;
  const id = held.id, n = Math.min(held.count, 3);
  takeFromHeld(n);
  const place = n >= 3 ? 'first' : n === 2 ? 'second' : 'third', pay = [0, 4, 8, 14][n];
  giveDrops([[COIN, pay]]);
  addRep(v, 4 * n);
  sound.ding(); setTimeout(() => sound.ding(0.7), 220); setTimeout(() => sound.ding(0.9), 440);
  toast(`Your ${itemName(id).toLowerCase()} win${n > 1 ? '' : 's'} ${place} prize at ${v.name}'s show! (${pay} coins)${n < 3 ? ' Show three for first prize' : ''}`, 3500);
}
// (v34) The food contest, on festival days too: one dish a day. First prize pays 16 coins (and a rosette in your
// achievements), second 9, third 4.
function foodContest(v, g, held, fest) {
  if (g.contestDay === day) { toast(`You've already entered ${v.name}'s food contest today`, 2500); return; }
  g.contestDay = day;
  const id = held.id, score = contestScore(id, seasonOf(day)), fav = FESTIVAL_FAVOURITES[seasonOf(day)].includes(id);
  takeFromHeld(1);
  const n = score >= 15 ? 3 : score >= 9 ? 2 : 1, place = ['', 'third', 'second', 'first'][n], pay = [0, 4, 9, 16][n];
  giveDrops([[COIN, pay]]);
  addRep(v, 4 * n);
  if (n === 3) achieve('contest');
  sound.ding(); setTimeout(() => sound.ding(0.8), 220); if (n === 3) setTimeout(() => sound.ding(1), 440);
  const tip = n < 3 ? (fav ? ' Try something more filling next time' : ` The judges at the ${fest.name} like ${FESTIVAL_FAVOURITES[seasonOf(day)].slice(0, 3).map((f) => itemName(f).toLowerCase()).join(', ')}`) : '';
  toast(`Your ${itemName(id).toLowerCase()} takes ${place} prize in ${v.name}'s food contest! (${pay} coins)${tip}`, 4000);
}
// Friends of a village are offered something special by each of its trades, and its heroes something more.
const SPECIAL_TRADES = {
  farmer: [[[COIN, 4], [FERTILISER, 8]], [[COIN, 8], [SADDLEBAGS, 1]]],
  smith: [[[COIN, 8], [SPEED_UPGRADE, 1]], [[COIN, 12], [YIELD_UPGRADE, 1]]],
  fisher: [[[COIN, 2], [WORM, 10]], [[COIN, 8], [TREASURE_MAP, 1]]],
  cleric: [[[COIN, 5], [GOLDEN_TEA, 1]], [[COIN, 8], [PEARL, 3]]],
};
function specialTrades(m) {
  if (!m.spec.villager || !m.home) return [];
  const t = repTier(repOf(m.home))[1], [friend, hero] = SPECIAL_TRADES[m.profession] ?? [];
  return [...(friend && (t === 'Friend' || t === 'Hero') ? [[...friend, 'Friend']] : []), ...(hero && t === 'Hero' ? [[...hero, 'Hero']] : [])];
}

// ---------- v28 D: horse gear, stables with hay, honey varieties ----------
// Saddlebags: while riding, 🎒 opens them (with your backpack below).
function openSaddlebags(m) {
  openStation(0, 0, 0, { store: { kind: 'chest', inputs: m.bags }, title: 'Saddlebags' });
}
// A stable's manger holds wheat (a hay bale is nine). Each horse kept there eats one when it needs it and is
// then rested: 15% faster and higher-jumping, for five minutes of riding.
const mangers = new Map(); // "x,y,z" of a stable -> wheat in its manger
const MANGER_MAX = 90, RESTED_TIME = 300;
function stockStable(x, y, z, id) {
  const k = `${x},${y},${z}`, have = mangers.get(k) ?? 0, add = id === HAY_BALE ? 9 : 1;
  if (have + add > MANGER_MAX) { toast(`The manger is full (${have} wheat)`, 1500); return; }
  mangers.set(k, have + add);
  inventory.consumeHeld();
  sound.place('grass');
  toast(`The manger holds ${have + add} wheat: horses kept here eat it and come out rested (15% faster, and jump higher)`, 2500);
}
let stableTimer = 0;
function tickStables(dt) {
  if ((stableTimer -= dt) > 0) return;
  stableTimer = 2;
  for (const m of mobs.mobs) {
    if (!m.spec.horse || !m.tame || !m.stable || m.ridden || m.dying || (m.rested ?? 0) > RESTED_TIME * 0.5) continue;
    const feed = mangers.get(m.stable) ?? 0;
    if (!feed) continue;
    const [x, , z] = m.stable.split(',').map(Number);
    if (Math.hypot(m.pos.x - x - 0.5, m.pos.z - z - 0.5) > 4) continue;
    mangers.set(m.stable, feed - 1);
    if (feed - 1 <= 0) mangers.delete(m.stable);
    m.rested = RESTED_TIME;
  }
}
// What honey a hive or apiary at (x, y, z) makes: after whichever flowers grow thickest around it.
const HONEY_FLOWERS = [[LAVENDER_HONEY, (id) => id === LAVENDER], [BLOSSOM_HONEY, (id) => BLOCKS[id]?.fruit != null || (id >= FRUIT_LEAVES && id < FRUIT_LEAVES + 6)], [GOLDEN_HONEY, (id) => id === DANDELION]];
function honeyAt(x, y, z, r = 6) {
  const n = HONEY_FLOWERS.map(() => 0);
  for (let dy = -3; dy <= 4; dy++) for (let dz = -r; dz <= r; dz++) for (let dx = -r; dx <= r; dx++) {
    const id = world.get(x + dx, y + dy, z + dz);
    if (!id) continue;
    HONEY_FLOWERS.forEach(([, is], i) => { if (is(id)) n[i]++; });
  }
  const best = n.indexOf(Math.max(...n));
  return n[best] >= 3 ? HONEY_FLOWERS[best][0] : HONEY_BOTTLE;
}

// ---------- v28 C: machine upgrades ----------
function fitUpgrade(x, y, z, upId) {
  const kind = stationKind(world.get(x, y, z));
  const why = upgradeRefusal(kind, upId);
  if (why) { toast(why, 2500); return false; }
  const st = stations.get(x, y, z, kind), k = UPGRADES[upId];
  st.up ??= { speed: 0, eff: 0, yield: 0 };
  if ((st.up[k] ?? 0) >= 2) { toast(`This ${STATION_KINDS[kind].name.toLowerCase()} already has two ${itemName(upId).toLowerCase()}s`, 2500); return false; }
  st.up[k] = (st.up[k] ?? 0) + 1;
  inventory.consumeHeld();
  sound.place('metal');
  const say = { speed: `works ${Math.round(1.5 ** st.up.speed * 100) / 100}× as fast`, eff: `burns ${Math.round((1 - 0.67 ** st.up.eff) * 100)}% less fuel`, yield: `gives one more ${st.up.yield * 12}% of the time` }[k];
  toast(`${itemName(upId)} fitted: the ${STATION_KINDS[kind].name.toLowerCase()} now ${say}`, 3000);
  achieve('upgrade');
  return true;
}

// ---------- v28 B: charcoal piles ----------
// Stack logs, cover them over with earth (dirt, grass, clay, gravel or sand) leaving one log showing through
// a hole, and light that log with a torch. The pile smoulders, smoke curling from the hole, and when it's
// done every log has become a charcoal heap (two charcoal each). If air gets in anywhere else while it's
// burning, or a log is taken out, it flares up and burns away.
const PILE_COVER = new Set([DIRT, GRASS, CLAY, GRAVEL, SAND, COBBLE, STONE, CHARCOAL_HEAP]);
const MAX_PILE = 96, PILE_TIME = 40, PILE_PER_LOG = 4;
stations.onTrace = () => achieve('trace');
const piles = []; // { cells: [[x, y, z]...], hole: [x, y, z] (the air the pile was lit through), left, total, puff }
// The logs joined to (x, y, z), and the faces of the pile that open onto something other than earth.
function pileAt(x, y, z) {
  const cells = [], seen = new Set([`${x},${y},${z}`]), open = [], q = [[x, y, z]];
  while (q.length) {
    const [cx, cy, cz] = q.pop();
    cells.push([cx, cy, cz]);
    if (cells.length > MAX_PILE) return { cells, open, tooBig: true };
    for (const [dx, dy, dz] of SIDES6) {
      const nx = cx + dx, ny = cy + dy, nz = cz + dz, k = `${nx},${ny},${nz}`, id = world.get(nx, ny, nz);
      if (id === LOG) { if (!seen.has(k)) { seen.add(k); q.push([nx, ny, nz]); } continue; }
      if (!PILE_COVER.has(id)) open.push([nx, ny, nz]);
    }
  }
  return { cells, open };
}
function lightCharcoalPile(x, y, z, [nx, ny, nz]) {
  if (piles.some((p) => p.cells.some(([cx, cy, cz]) => cx === x && cy === y && cz === z))) { toast('That pile is already smouldering', 1500); return true; }
  const P = pileAt(x, y, z), hole = [x + nx, y + ny, z + nz];
  if (P.tooBig) { toast(`That's too many logs for one pile (at most ${MAX_PILE})`); return true; }
  const others = P.open.filter(([ox, oy, oz]) => ox !== hole[0] || oy !== hole[1] || oz !== hole[2]);
  if (P.cells.length < 2 || others.length) {
    // not a covered pile: just a torch on a log, unless it nearly is one
    if (P.cells.length >= 4 && others.length <= 6) { toast(`Cover the pile over with earth first: ${others.length} more gap${others.length > 1 ? 's' : ''} to fill (leave only the hole you light it through)`, 3000); return true; }
    return false;
  }
  inventory.consumeHeld();
  const t = PILE_TIME + PILE_PER_LOG * P.cells.length;
  piles.push({ cells: P.cells, hole, left: t, total: t, puff: 0 });
  sound.crackle?.(0.8);
  toast(`The pile catches and starts to smoulder (${P.cells.length} logs, about ${Math.round(t / 60 * 10) / 10} minutes). Keep the air out!`, 3500);
  return true;
}
function tickPiles(dt) {
  for (let i = piles.length - 1; i >= 0; i--) {
    const p = piles[i];
    const [hx, hy, hz] = p.hole;
    if (!world.chunkAt(hx, hz)) continue;
    p.left -= dt;
    if ((p.puff -= dt) <= 0) { p.puff = 0.35; smoke.puff(hx + 0.5, hy + 0.3, hz + 0.5, { grey: 0.45, size: 0.6, life: 5, rise: 1.1 }); }
    // check it's still sealed (now and then)
    if ((p.check = (p.check ?? 0) - dt) > 0 && p.left > 0) continue;
    p.check = 0.5;
    const intact = p.cells.every(([x, y, z]) => world.get(x, y, z) === LOG);
    const leaks = intact ? p.cells.flatMap(([x, y, z]) => SIDES6.map(([dx, dy, dz]) => [x + dx, y + dy, z + dz]))
      .filter(([x, y, z]) => !(x === hx && y === hy && z === hz) && !PILE_COVER.has(world.get(x, y, z)) && world.get(x, y, z) !== LOG) : [];
    if (!intact || leaks.length) {
      // air got in: it flares up
      piles.splice(i, 1);
      for (const [x, y, z] of p.cells) if (world.get(x, y, z) === LOG && Math.random() < 0.6) igniteAt(x, y, z, true);
      for (const [x, y, z] of leaks.slice(0, 6)) igniteAt(x, y, z);
      if (Math.hypot(hx - player.pos.x, hz - player.pos.z) < 40) toast('Air got into the charcoal pile and it flared up!', 2500);
      continue;
    }
    if (p.left <= 0) {
      piles.splice(i, 1);
      for (const [x, y, z] of p.cells) world.setBlock(x, y, z, CHARCOAL_HEAP);
      if (Math.hypot(hx - player.pos.x, hz - player.pos.z) < 40) toast(`The charcoal pile has burnt down: ${p.cells.length} heaps of charcoal under the earth`, 3000);
      achieve('charcoal');
    }
  }
}

// ---------- v26 E: temple and sky-island puzzles, diving ----------
// A sunken temple's vault opens when each of its three levers matches the lamp above it (lit: on, dark: off).
// A sky island's opens when you step on its plates in the order of the wool over the vault's gate.
let puzzleTimer = 0;
const islandSteps = new Map(); // island "x,z" -> plate indexes stepped on so far
let lastPlate = null;
function openVault(gate, water, msg) {
  for (const [x, y, z] of gate) world.setBlock(x, y, z, water ? WATER : AIR);
  sound.boom(0.4); setTimeout(() => sound.ding(0.6), 300);
  toast(msg, 3000);
  achieve('vault');
}
function tickPuzzles(dt) {
  if ((puzzleTimer -= dt) > 0) return;
  puzzleTimer = 0.2;
  const g = world.generator, pcx = Math.floor(player.pos.x / CHUNK), pcz = Math.floor(player.pos.z / CHUNK);
  const fx = Math.floor(player.pos.x), fy = Math.floor(player.pos.y + 0.05), fz = Math.floor(player.pos.z);
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const t = g.templeAt(pcx + dx, pcz + dz);
    if (t && world.chunkAt(t.x, t.z) && world.get(...t.gate[0]) === VAULT_GATE) {
      const ok = t.levers.every(([x, y, z], i) => { const d = BLOCKS[world.get(x, y, z)]; return d?.switch === 'lever' && d.on === t.code[i]; });
      if (ok) openVault(t.gate, true, 'With a deep grinding, the vault gate sinks into the floor');
    }
    const il = g.islandAt(pcx + dx, pcz + dz);
    if (il && world.chunkAt(il.x, il.z) && world.get(...il.gate[0]) === VAULT_GATE) {
      const k = il.plates.findIndex(([x, y, z]) => x === fx && y === fy && z === fz);
      const key = `${il.x},${il.z}`;
      if (k < 0) { if (lastPlate === key) lastPlate = null; continue; }
      if (lastPlate === key) continue; // still standing on it
      lastPlate = key;
      const steps = [...(islandSteps.get(key) ?? []), k];
      if (il.order[steps.length - 1] !== k) {
        islandSteps.set(key, []);
        if (sound.ready) sound.tone(140, 0.35, 0.25, 'square', 90);
        toast('Clunk. The plates reset: that wasn\'t the right order', 2000);
      } else if (steps.length === 3) {
        islandSteps.delete(key);
        openVault(il.gate, false, 'Click, click, click... and the vault gate slides away');
      } else {
        islandSteps.set(key, steps);
        sound.click();
      }
    }
  }
}
let pumpTimer = 0, pumpNear = false;
function airPumpNear(dt) {
  if ((pumpTimer -= dt) > 0) return pumpNear;
  pumpTimer = 1;
  pumpNear = false;
  const px = Math.floor(player.pos.x), py = Math.floor(player.pos.y), pz = Math.floor(player.pos.z);
  for (let y = py; y <= Math.min(H - 1, py + 24) && !pumpNear; y++) for (let dz = -12; dz <= 12 && !pumpNear; dz++) for (let dx = -12; dx <= 12; dx++) {
    if (world.get(px + dx, y, pz + dz) === AIR_PUMP) { pumpNear = true; break; }
  }
  return pumpNear;
}

// ---------- v26 C: crop rotation ----------
// The soil remembers what grew in it last (see world.planted): the same crop again tires it.
const CROP_NAMES = { wheat: 'wheat', carrot: 'carrots', potato: 'potatoes', pumpkin: 'pumpkins', grape: 'grapes', onion: 'onions', tomato: 'tomatoes', herb: 'herbs' };
const cropKind = (id) => (isWheat(id) ? 'wheat' : BLOCKS[id]?.crop?.kind ?? null);
function notePlanting(x, y, z, id) {
  const kind = cropKind(id);
  if (!kind) return 0;
  const tired = world.planted(x, y - 1, z, kind);
  if (world.soilRich(x, y - 1, z)) toast('The beans have left this soil rich: this crop will grow faster', 2200);
  else if (tired >= 1) toast(`This soil is ${tired >= 3 ? 'worn out' : tired === 2 ? 'tired' : 'a little tired'} from ${CROP_NAMES[kind]}: rotate crops, rest it a season, or fertilise it`, 2600);
  return tired;
}

// ---------- v26 B: thunderstorms, fire, hail ----------
// Some spells of rain are thunderstorms: lightning strikes the ground now and then within sight, lights up the
// sky, and can set trees alight; the thunder follows a moment later. Up in the mountains rain falls as hail,
// which stings if your head's bare.
const HAIL_HEIGHT = 50;
let strikeIn = 20, hailIn = 3, flashLevel = 0;
const fires = new Map(); // "x,y,z" -> seconds left burning

// ---------- fireplaces ----------
// A fireplace burns what you feed it (tap it with logs, planks, sticks or coal), lighting and warming the
// room. Smoke rises out of the top of a chimney built straight up from it; with no chimney it puffs out
// into the room instead.
const hearths = new Map(); // "x,y,z" -> seconds of fire left
const MAX_HEARTH = 1800;
let hearthTimer = 0, smokyWarned = false;
function feedHearth(x, y, z, held) {
  const per = HEARTH_FUEL[held.id];
  const k = `${x},${y},${z}`, left = hearths.get(k) ?? 0;
  const n = Math.max(0, Math.min(held.count, Math.ceil((MAX_HEARTH - left) / per)));
  if (!n) { toast('The fireplace is full of fuel', 1500); return; }
  takeFromHeld(n);
  hearths.set(k, left + n * per);
  const id = world.get(x, y, z);
  if (!BLOCKS[id].lit) world.setBlock(x, y, z, id + 4);
  sound.crackle(1);
  toast(`The fire will burn for ${hearthTime(left + n * per)}${chimneyTop(x, y, z) ? '' : ' (build a chimney on top for the smoke)'}`, 2200);
}
const hearthTime = (t) => (t >= 90 ? `${Math.round(t / 60)} minutes` : `${Math.ceil(t)} seconds`);
// The top of the chimney over a fireplace: the y of the topmost chimney block, or 0 for none.
function chimneyTop(x, y, z) {
  let top = 0;
  for (let h = y + 1; h < H && world.get(x, h, z) === CHIMNEY; h++) top = h;
  return top;
}
function tickHearths(dt) {
  if (!hearths.size) return;
  hearthTimer -= dt;
  const puff = hearthTimer <= 0;
  if (puff) hearthTimer = 0.35;
  for (const [k, left] of [...hearths]) {
    const [x, y, z] = k.split(',').map(Number);
    if (!world.chunkAt(x, z)) continue;
    const id = world.get(x, y, z);
    if (!BLOCKS[id]?.hearth) { hearths.delete(k); continue; }
    const t = left - dt;
    if (t <= 0) { hearths.delete(k); if (BLOCKS[id].lit) world.setBlock(x, y, z, id - 4); continue; }
    hearths.set(k, t);
    if (!puff) continue;
    const near = Math.hypot(x + 0.5 - player.pos.x, z + 0.5 - player.pos.z);
    if (near > 96) continue;
    const top = chimneyTop(x, y, z);
    if (top && !world.isSolid(x, top + 1, z)) smoke.puff(x + 0.5, top + 1.05, z + 0.5, { grey: 0.62, size: 0.55, life: 5, rise: 1 });
    else if (!top) {
      // no chimney: smoke billows out of the front into the room
      const [dx, dz] = FACING_DIRS[BLOCKS[id].facing];
      if (Math.random() < 0.5) smoke.puff(x + 0.5 + dx * 0.6, y + 0.8, z + 0.5 + dz * 0.6, { grey: 0.45, size: 0.4, life: 3, rise: 0.5, spread: 0.4 });
      if (near < 6 && !smokyWarned) { smokyWarned = true; toast('The room is filling with smoke! Build a chimney up from the fireplace.', 3000); }
    }
  }
}
// A burning fireplace close by warms you quickly.
function hearthNear(r = 6) {
  const px = player.pos.x, py = player.pos.y, pz = player.pos.z;
  for (const k of hearths.keys()) {
    const [x, y, z] = k.split(',').map(Number);
    if (Math.abs(x + 0.5 - px) <= r && Math.abs(y - py) <= 3 && Math.abs(z + 0.5 - pz) <= r) return true;
  }
  return false;
}
function topBlock(x, z) {
  for (let y = H - 1; y > 0; y--) { const id = world.get(x, y, z); if (id !== AIR && !(BLOCKS[id]?.liquid && !world.isWater(x, y, z))) return y; }
  return null;
}
function lightning(x, z) {
  const y = topBlock(x, z);
  if (y === null) return false;
  weather.bolt(x, y, z);
  flashLevel = Math.max(flashLevel, 0.55 * Math.max(0.25, weather.level));
  const d = Math.hypot(x + 0.5 - player.pos.x, z + 0.5 - player.pos.z);
  setTimeout(() => sound.thunder(Math.max(0.2, 1 - d / 120), d < 24), Math.min(3000, d * 25));
  const id = world.get(x, y, z);
  if (isFlammable(id)) { igniteAt(x, y, z, true); for (const [dx, dy, dz] of SIDES6) if (Math.random() < 0.5) igniteAt(x + dx, y + dy, z + dz, true); }
  else if (world.get(x, y + 1, z) === AIR && !world.isWater(x, y, z) && Math.random() < 0.3 && BLOCKS[id]?.solid) igniteAt(x, y + 1, z);
  if (d < 3 && Math.abs(player.pos.y - y) < 4) damage(6, 'Struck by lightning');
  for (const m of mobs.mobs) if (!m.dying && Math.hypot(m.pos.x - x - 0.5, m.pos.z - z - 0.5) < 2.5) { m.burning = 4; if (m.spec.hostile) m.dying = 0.4; }
  return true;
}
// Set fire to the block at (x, y, z) (burning it away), or light the air there.
function igniteAt(x, y, z, replace = false) {
  if (fires.size > 240) return;
  const id = world.get(x, y, z);
  if (!(replace ? isFlammable(id) : id === AIR)) return;
  world.setBlock(x, y, z, FIRE);
  fires.set(`${x},${y},${z}`, 3 + Math.random() * 5);
}
let burnTimer = 0;
function tickFires(dt) {
  flashLevel = Math.max(0, flashLevel - dt * 2.5);
  $('flash').style.opacity = flashLevel.toFixed(2);
  burnTimer -= dt;
  if (burnTimer > 0 || !fires.size) return;
  const step = 0.5 - burnTimer; burnTimer = 0.5;
  let nearest = Infinity;
  for (const [k, left] of [...fires]) {
    const [x, y, z] = k.split(',').map(Number);
    if (world.get(x, y, z) !== FIRE) { fires.delete(k); continue; }
    const wet = world.raining && world.skyAt(x, y + 1, z) >= MAX_LIGHT;
    const t = left - step * (wet ? 3 : 1);
    if (t <= 0) { fires.delete(k); world.setBlock(x, y, z, AIR); continue; }
    fires.set(k, t);
    for (const [dx, dy, dz] of SIDES6) if (Math.random() < (wet ? 0.015 : 0.065) * step * 2) igniteAt(x + dx, y + dy, z + dz, true);
    nearest = Math.min(nearest, Math.hypot(x + 0.5 - player.pos.x, y + 0.5 - player.pos.y, z + 0.5 - player.pos.z));
    // standing in it burns
    if (Math.floor(player.pos.x) === x && Math.floor(player.pos.z) === z && (Math.floor(player.pos.y) === y || Math.floor(player.pos.y + 1) === y)) damage(1, 'Burned');
  }
  if (nearest < 16 && Math.random() < 0.7) sound.crackle(1 - nearest / 16);
}
function tickStorm(dt) {
  if (weather.raining && weather.storm && weather.kind !== 'snow' && weather.kind !== 'sand' && (weather.overcast ?? 0) > 0.6) {
    strikeIn -= dt;
    if (strikeIn <= 0) {
      strikeIn = 6 + Math.random() * 16;
      const a = Math.random() * Math.PI * 2, d = 6 + Math.random() * 64;
      const x = Math.floor(player.pos.x + Math.cos(a) * d), z = Math.floor(player.pos.z + Math.sin(a) * d);
      if (world.chunkAt(x, z)) lightning(x, z);
    }
  }
  // hail: a sting now and then if you're out in it with nothing on your head
  if (weather.kind === 'hail' && weather.level > 0.5 && !armour[0]) {
    hailIn -= dt;
    if (hailIn <= 0) { hailIn = 3 + Math.random() * 3; damage(1, 'Pelted by hailstones'); }
  }
}

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
  world.season = s;
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
  // and the nearest of your waypoints
  let near = null, nd = Infinity;
  for (const w of waypoints) { const wd = Math.hypot(w.x + 0.5 - player.pos.x, w.z + 0.5 - player.pos.z); if (wd < nd) { nd = wd; near = w; } }
  const mark = near ? ` · ${near.name} ${nd < 2 ? 'here' : `${Math.round(nd)} ${pointOf(near.x + 0.5 - player.pos.x, near.z + 0.5 - player.pos.z)}`}` : '';
  return `facing ${pointOf(look.x, look.z)} · ${bedSpawn ? 'bed' : 'start'} ${d < 2 ? 'here' : `${Math.round(d)} ${pointOf(dx, dz)}`}${mark}`;
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
    if (!dead) { stations.tick(dt, world, setStationLit, powerAt, boostAt, crafterRecipe); apiculture.tick(dt, stations, world, beeEnv); }
    if (!dead && worldReady) { logistics.update(dt); if ((keepTimer -= dt) <= 0) { keepTimer = 1; world.keepLoaded = new Set(logistics.loaderChunks()); } }
    if (openStationAt && (stationRefresh -= dt) <= 0) { stationRefresh = 0.15; renderStation(); }
  } catch (err) { reportError(err); }
  try { world.update(player.pos.x, player.pos.z, scene, materials, 6, dt); } catch (err) { reportError(err); }
  gfx.sunDir.copy(sky.sunDir); gfx.overcast = weather?.overcast ?? 0; gfx.underwater = !!player.eyeInWater;
  try { findWaterLevel(dt); } catch (err) { reportError(err); }
  gfx.render(scene, camera);
  if (viewMode === 0 && !photoMode && !dead) viewmodel.render(renderer);
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
  if (paused || !here) controls.pollPad(); // (a gamepad can still open and close menus)
  if (photoMode) {
    controls.update();
    movePhotoCam(dt);
    fireworks.update(dt);
  } else if (!paused && here) {
    controls.update();
    const wasGround = player.onGround, wasWater = player.inWater, fallSpeed = -player.vel.y, prevY = player.pos.y;
    fireworks.update(dt);
    smoke.update(dt, { x: 0.3 + (weather.storm ? 1.2 : 0), z: 0.12 }, sky.light);
    carts.update(dt, world, (x, y, z) => powerAt(x, y, z) || (signalAt(x, y, z) ? 1 : 0), riding && { cart: riding, push: controls.moveZ, look: player.lookDir() },
      { day: lightUniforms.uDay.value, flicker: lightUniforms.uFlicker.value, ambient: lightUniforms.uAmbient.value });
    vehicles.update(dt, world, boarded && { v: boarded, moveX: controls.moveX, moveZ: controls.moveZ, jump: controls.jump, down: controls.down, yaw: player.yaw },
      { day: lightUniforms.uDay.value, flicker: lightUniforms.uFlicker.value, ambient: lightUniforms.uAmbient.value }, { fuel: burnCoal });
    if (riding) followCart();
    else if (boarded) followVehicle();
    else if (seated) followSeat();
    else if (zipping) tickZip(dt);
    else if (ridingMob) followMount();
    else if (tickGrapple(dt) || tickLift(dt)) { /* carried by the hook or a lift */ }
    else player.update(dt, { moveX: controls.moveX, moveZ: controls.moveZ, jump: controls.jump, down: controls.down });
    if (player.pos.y < -20) respawn();
    playMovementSounds(dt, wasGround, wasWater, fallSpeed);
    world.tickWater(dt);
    world.tickPlants(dt);
    world.tickLeaves(dt);
    tickLamps(dt);
    tickExplore(dt); tickTreasure(dt); tickLocks(dt); tickPiles(dt); tickStables(dt); tickStalactites(dt); tickSnow(dt); tickVillages(dt); tickStorm(dt); tickFires(dt); tickPuzzles(dt); tickHearths(dt);
    crows.update(dt, world, player.pos, {
      day: lightUniforms.uDay.value,
      eat: (x, y, z) => world.setBlock(x, y, z, WHEAT_3 - 2), // back to green shoots
      caw: (p) => { const d = p.distanceTo(player.pos); if (d < 24) sound.mob('crow', 1 - d / 28); },
    });
    {
      const hours = (sky.time * 24 + 6) % 24;
      critters.update(dt, world, player, {
        night: Math.max(0, Math.min(1, (0.55 - lightUniforms.uDay.value) * 2.5)), dusk: hours > 18.3 && hours < 20.5,
        season: seasonOf(day), raining: weather.raining, light: Math.max(lightUniforms.uDay.value, lightUniforms.uAmbient.value),
      });
    }
    tickPets(dt);
    tickFuses(dt);
    tickSwitches(dt);
    tickProgress(dt);
    tickEffects(dt);
    tickBoss(dt);
    tickHazards(dt);
    tickAilments(dt);
    tickBatteryGear(dt);
    tickPads(dt);
    tickHum(dt);
    tickMachineSounds(dt);
    tickAutoGfx(dt);
    try { tickRipples(dt); } catch (err) { reportError(err); }
    try { tickNet(dt); } catch (err) { reportError(err); }
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
      onHitPlayer: (dmg, from, a) => {
        if (dead || shieldBlocks(from, dmg)) return;
        damage(armoured(dmg), a?.from && SPECIES[a.from] ? SPECIES[a.from].cause : a?.trap ? 'A dart trap got you.' : 'A thornspitter shot you full of thorns.');
        if (SPECIES[a?.from]?.shot === 'frost' && !guarded('chill')) { ailments.chill = Math.min(1.5, ailments.chill + 0.35); }
      },
    });
    for (const id of picked) { inventory.add(id, 1); sound.pop(); }
    updateFishing(dt);
    bees.update(dt, world, player, { day: lightUniforms.uDay.value, flicker: lightUniforms.uFlicker.value, ambient: lightUniforms.uAmbient.value }, sky.light);
    mobs.sneaking = controls.down && player.onGround; // (deer let you creep up on them)
    mobs.update(dt, player, { day: lightUniforms.uDay.value, flicker: lightUniforms.uFlicker.value, ambient: lightUniforms.uAmbient.value },
      { difficulty: difficulty(), daylight: sky.light, playerDead: dead, ride: ridingMob && { moveX: controls.moveX, moveZ: controls.moveZ, yaw: player.yaw, jump: controls.jump } });
    if (ridingMob) followMount();
  }
  // write edited chunks to storage shortly (1.5 s) after the player stops changing them
  if (world.unsaved.size !== unsavedCount) { unsavedCount = world.unsaved.size; lastEditAt = now; }
  if (unsavedCount && now - lastEditAt > 1500 && worldReady) { world.saveChunks(); unsavedCount = 0; }
  kinetics.update(paused ? 0 : dt, world, { day: lightUniforms.uDay.value, flicker: lightUniforms.uFlicker.value, ambient: lightUniforms.uAmbient.value });
  for (const [x, y, z] of kinetics.dropped.splice(0)) loose.spawn({ id: DRIVE_BELT, count: 1 }, { x: x + 0.5, y: y + 0.5, z: z + 0.5 }, { x: 0, y: 2, z: 0 }, 0.5); // a drive belt that came off
  tickBlasts(dt);
  tickMeteors(dt);
  minimap.show(!paused && inventory.heldId() === MAP);
  minimap.update(world, player, bedSpawn ?? (world.spawnCache ??= world.generator.findSpawn()), waypoints);
  worldMap.draw();
  try {
    machines.tick(paused ? 0 : dt, world, kinetics, stations, { day: lightUniforms.uDay.value, flicker: lightUniforms.uFlicker.value, ambient: lightUniforms.uAmbient.value });
    electric.update(paused ? 0 : dt, world, kinetics, stations, electricHooks);
    loose.update(paused || dead ? 0 : dt, world, {
      player, pickup: pickUpLoose, insert: (x, y, z, item, n) => machines.insert(world, stations, x, y, z, item, n, false),
      light: { day: lightUniforms.uDay.value, flicker: lightUniforms.uFlicker.value, ambient: lightUniforms.uAmbient.value },
    });
  } catch (err) { reportError(err); }
  frames.update(dt, world, { day: lightUniforms.uDay.value, flicker: lightUniforms.uFlicker.value, ambient: lightUniforms.uAmbient.value });
  paintings.update(dt, world, { day: lightUniforms.uDay.value, flicker: lightUniforms.uFlicker.value, ambient: lightUniforms.uAmbient.value });
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
  camera.position.copy(photoMode ? photoCam : eye);
  camera.rotation.set(player.pitch, player.yaw, 0);
  if (!photoMode && viewMode > 0) thirdPersonCamera(eye);
  try { updateMe(paused ? 0 : dt); } catch (err) { reportError(err); }

  const biome = world.generator.biomeAt(Math.floor(player.pos.x), Math.floor(player.pos.z));
  // in winter it snows rather than rains in temperate land
  weather.update(paused ? 0 : dt, eye, biome === 'temperate' && seasonOf(day) === 3 ? 'tundra' : biome, world.skyAt(Math.floor(eye.x), Math.min(H - 1, Math.floor(eye.y) + 1), Math.floor(eye.z)),
    eye.y > HAIL_HEIGHT, Math.cos(sky.time * Math.PI * 2), sky.light);
  sky.weather = { overcast: weather.overcast, level: weather.level, kind: weather.kind };
  world.raining = weather.raining && biome !== 'desert';
  world.daylight = sky.light; // (v34: drying racks)
  sound.weather(paused ? 0 : weather.level, weather.kind);
  if (worldReady) music.update(dt, paused ? null : musicMood(dt));
  const before = sky.time;
  if (world && worldReady) { tickBeams(paused ? 0 : dt); sky.mist = mistNow(); }
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
  targetVehicle = paused || riding || boarded ? null : vehicles.raycast(eye, look, REACH);
  if (targetVehicle && ((target && target.t < targetVehicle.t) || (targetMob && targetMob.t < targetVehicle.t) || (targetCart && targetCart.t < targetVehicle.t))) targetVehicle = null;
  if (targetVehicle) { target = null; targetMob = null; targetCart = null; }
  // whichever is closer wins: an animal in front of a block, or a block in front of an animal
  if (targetMob && target && target.t < targetMob.t) targetMob = null;
  if (targetMob) target = null;
  if (photoMode) target = targetMob = targetCart = targetVehicle = null;
  if (target) {
    highlight.visible = true;
    highlight.position.set(target.x + 0.5, target.y + 0.5, target.z + 0.5);
  } else highlight.visible = false;

  updateLookTip();
  tickChestMark(now);
  if (!paused && !photoMode) updateBreaking(dt);
  else crack.visible = false;
}
requestAnimationFrame(frame);

boot().catch(reportError);

// Keep the game files fresh (and playable offline). Only works on https or localhost.
if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(() => {});

// expose for debugging in the console
window.minicraft = {
  gfx, viewmodel, avatar, swingArm, ripples, waterSurfaceAt, net, ownsSpot, get activeSlot() { return activeSlot; }, mpLeave, pendingEdits, get viewMode() { return viewMode; },
  get world() { return world; }, player, inventory, saveGame, sky, sound, breakBlock, mobs,
  get hunger() { return hunger; }, set hunger(v) { hunger = v; renderHunger(); },
  get day() { return day; },
  get paused() { return paused; },
  get health() { return health; }, set health(v) { health = v; renderHealth(); },
  get poisoned() { return poisoned; }, get dead() { return dead; }, get air() { return air; }, set air(v) { air = v; },
  arrows, fishing, kinetics, electric, lightUniforms, bees, catchAt, seasonOf, applySeason, set day(v) { day = v; applySeason(); }, frames, signalAt, setSwitch, logic, machines, carts, minimap, signs, armour, damage, placeRail, getInCart, getOutOfCart,
  get riding() { return riding; }, explode, lightFuse, fuses, clockTime, compassText, place, editSign, closeSign, openInventory, closeInventory, chestMove, lamps, tickLamps, sleepUntilMorning, stations, openStation, closeStation,
  get caneToday() { return caneToday; }, get creative() { return creative; }, set creative(v) { creative = v; applyCreative(); }, toggleFly, wand, useWand, get achieved() { return achieved; }, achieve, worldMap, openMap, closeMap, openGuide, switchSlot, store, saveGame, renderWorlds, openWorlds, exportSlot, get target() { return target; }, set target(v) { target = v; }, applyKeys, renderKeys, camera, get controls() { return controls; }, loose, throwHeld, get waypoints() { return waypoints; }, toggleWaypoint, sortSlots, quickStack, dropMeteor, get meteors() { return meteors; }, weather, openTrade, closeTrade, mountMob, dismount, get ridingMob() { return ridingMob; }, effects, armourWear, useAnvil, rollLoot, settings,
  get bedSpawn() { return bedSpawn; }, fertilise, openJournal, closeJournal, get packs() { return packs; }, radiationAt, vehicles, boardVehicle, leaveVehicle, get boarded() { return boarded; }, get seated() { return seated; }, crows, onInvSlot, onStationSlot, quickMoveInv, quickMoveStation, usedIn, itemTipHTML, critters, tickPets, get catGiftDay() { return catGiftDay; }, get villageGrowth() { return villageGrowth; }, notePlanting, tickPuzzles, airPumpNear, useStable, stableNear, horseLabel, logistics, openLogistics, closeLogistics, placeOrder, get lpOpen() { return lpOpen; }, music, musicMood, get guideDone() { return guideDone; }, get guideClaimed() { return guideClaimed; }, tickGuidebook, openGuidebook, closeGuidebook, claimGoal, goalMet, fineChance, fineHarvest, showProduce, foodContest, specialTrades, catchAt, stockStable, tickStables, mangers, openSaddlebags, honeyAt, apiculture, scoopHive, beeEnv, fitUpgrade, piles, lightCharcoalPile, tickPiles, searchChests, takeFromChest, markChest, get chestMark() { return chestMark; }, enterPhotoMode, exitPhotoMode, snapPhoto, get photoMode() { return photoMode; }, photoCam, get lastPhoto() { return lastPhoto; }, tickStalactites, loosenStalactite, fallingRocks, shaking, workLock, findLock, tickLocks, openGates, lockJobs, hangRopeLadder, layBridge, rollUpRope, fireworks, ringBell, requestFor, festivalToday, repOf, addRep, tradeCost, tickFestival, villageEntry, hearths, tickHearths, feedHearth, chimneyTop, smoke, renderPins, togglePin, lightning, igniteAt, fires, tickFires, tickStorm, growVillage, buildVillageHouse, stallPrice, tickStalls, tickVillages, set catGiftDay(v) { catGiftDay = v; }, get places() { return places; }, get treasures() { return treasures; }, readTreasureMap, tickTreasure, beams, tickBeams, beaconSpots: () => beaconSpots, mistNow, tickSnow, tickExplore, sitOn, standUp, useDisplay, zips, linkZip, startZip, get zipping() { return zipping; }, burnCoal, get health() { return health; }, set health(v) { health = v; }, paintings, placeSwitchRail, signalAt, ailments, armourEnch, openAltar, lairNear, useBed, eat, drinkTea,
};

// ---------- v31: catching bees ----------
// A bee scoop takes the colony out of a wild hive (one with honey in it): a princess and a drone or two of the
// local species, and whatever comb was in it. The empty hive is left behind for a new swarm.
function scoopHive(x, y, z, tid) {
  if (BLOCKS[tid].apiary) { toast('An apiary\'s bees won\'t leave it: scoop a wild hive', 2200); return; }
  const lv = BLOCKS[tid].hive;
  if (lv < 1) { toast('No bees have moved into this hive yet', 2000); return; }
  const sp = wildSpecies(world.generator.biomeAt(x, z)), drones = 1 + (Math.random() < 0.5 ? 1 : 0);
  world.setBlock(x, y, z, BEE_HIVE);
  giveDrops([[princessOf(sp), 1], [droneOf(sp), drones], ...(lv > 1 ? [[HONEYCOMB, lv - 1]] : [])]);
  sound.pop();
  toast(`You scoop up a colony of ${BEE_SPECIES[sp].name.toLowerCase()} bees: a princess and ${drones === 1 ? 'a drone' : 'two drones'}`, 2500);
  achieve('bees');
}
apiculture.onYoung = (x, y, z, sp, mate, kids) => {
  const fresh = kids.filter((k) => k !== sp && k !== mate);
  if (!fresh.length) return;
  achieve('mutation');
  if (Math.hypot(x + 0.5 - player.pos.x, z + 0.5 - player.pos.z) < 32) toast(`A new kind of bee in the bee house: ${[...new Set(fresh)].map((k) => BEE_SPECIES[k].name.toLowerCase()).join(' and ')}!`, 3000);
};

// ---------- v32: tree taps ----------
import { CHOC_MOULD, CHOC_CAKE, CAKE_SLICES, MOULD_BARS, MELTED_CHOC, CHOC_BAR, MOULD_FILLS, mouldFill } from './blocks.js';
import { FESTIVAL_FAVOURITES, contestScore, GUANO, BANDAGE, WHISKY, OLD_WHISKY } from './blocks.js';
import { TREE_TAP, LATEX, MAX_LATEX, POLYMER_BOAT, DEMO_CHARGE, DETONATOR, DEMO_RADIUS, DETONATOR_LINKS, DETONATOR_RANGE } from './blocks.js';
// Tapping a tree tap takes the latex in it.
function useTap(x, y, z, tid) {
  const lv = BLOCKS[tid].tap;
  if (lv > 0) {
    world.setBlock(x, y, z, TREE_TAP);
    giveDrops([[LATEX, lv]]);
    sound.pop();
    toast(`You take ${lv} latex from the tap`, 1500);
    achieve('latex');
  } else toast(world.tapOnTree(x, y, z) ? `Latex is dripping slowly into the tap (0/${MAX_LATEX})` : 'Put the tap against a tree trunk: latex drips into it', 2000);
}
window.minicraft.useTap = useTap;

// A detonator remembers the demolition charges linked to it (in the item itself, so it keeps them when you
// put it away). Tap a charge to link it (or unlink it); use the detonator anywhere else to set them all off,
// one after another, as long as you're within DETONATOR_RANGE of each.
function useDetonator(held, target) {
  const links = (held.links ??= []);
  const id = target && world.get(target.x, target.y, target.z);
  if (target && (id === DEMO_CHARGE || id === DEMO_CHARGE + 1)) {
    const i = links.findIndex(([x, y, z]) => x === target.x && y === target.y && z === target.z);
    if (i >= 0) { links.splice(i, 1); world.setBlock(target.x, target.y, target.z, DEMO_CHARGE); toast(`Charge unlinked (${links.length} linked)`, 1500); }
    else if (links.length >= DETONATOR_LINKS) toast(`A detonator can only hold ${DETONATOR_LINKS} charges`, 1800);
    else { links.push([target.x, target.y, target.z]); world.setBlock(target.x, target.y, target.z, DEMO_CHARGE + 1); toast(`Charge linked (${links.length} linked). Stand well back, then use the detonator.`, 2200); }
    sound.click(); inventory.onChange();
    return;
  }
  if (!links.length) { toast('No charges linked: tap demolition charges with the detonator first', 2000); return; }
  let fired = 0, far = 0;
  for (const [x, y, z] of links) {
    if (world.get(x, y, z) !== DEMO_CHARGE + 1) continue;
    if (Math.hypot(x + 0.5 - player.pos.x, y + 0.5 - player.pos.y, z + 0.5 - player.pos.z) > DETONATOR_RANGE) { far++; continue; }
    lightFuse(x, y, z, 1 + fired * 0.15);
    fired++;
  }
  held.links = far ? links.filter(([x, y, z]) => world.get(x, y, z) === DEMO_CHARGE + 1 && !fuses.has(`${x},${y},${z}`)) : [];
  inventory.onChange();
  sound.click();
  if (fired) { toast(`Detonating ${fired} charge${fired > 1 ? 's' : ''}!${far ? ` (${far} out of range)` : ''}`, 2000); achieve('demolition'); }
  else toast(far ? 'The linked charges are out of range' : 'None of the linked charges are left', 2000);
}
window.minicraft.useDetonator = useDetonator;

// ---------- v33: the chocolate mould and chocolate cake ----------
// Tap an empty mould holding melted chocolate to pour it in; tap it once it's set to knock out the bars.
function useMould(x, y, z, tid, held) {
  if (tid === CHOC_MOULD) {
    const fill = MOULD_FILLS.find((f) => f.liquid === held?.id);
    if (!fill) { toast('Pour melted chocolate, melted toffee or honey syrup into the mould (from a cooking pot)', 2400); return; }
    inventory.consumeHeld();
    if (inventory.add(GLASS_BOTTLE, 1)) toast('Inventory full: dropped at your feet');
    world.setBlock(x, y, z, fill.poured);
    sound.pour();
    const chill = world.mouldChill(x, y, z);
    toast(`Poured. Leave it to set${chill > 1 ? ': it\'s nice and cold here, so it won\'t be long' : chill < 1 ? ', though it\'s too warm here for it to set quickly' : ''}.`, 2200);
    return;
  }
  const { fill, stage } = mouldFill(tid);
  if (stage < 3) { toast(stage === 1 ? 'It\'s still runny' : 'It\'s nearly set', 1500); return; }
  world.setBlock(x, y, z, CHOC_MOULD);
  sound.click();
  giveDrops([[fill.out, MOULD_BARS]]);
  if (fill.out === CHOC_BAR) achieve('chocolate');
}
function eatCakeSlice(x, y, z, tid) {
  if (hunger > MAX_HUNGER - 1) { toast('You\'re not hungry'); return; }
  const k = tid - CHOC_CAKE;
  hunger = Math.min(MAX_HUNGER, hunger + 5);
  health = Math.min(MAX_HEALTH, health + 2);
  effects.fed = Math.max(effects.fed, 100);
  world.setBlock(x, y, z, k + 1 < CAKE_SLICES ? tid + 1 : AIR);
  sound.eat();
  toast(k + 1 < CAKE_SLICES ? `Ate a slice of chocolate cake (${CAKE_SLICES - k - 1} left)` : 'Ate the last slice of chocolate cake', 1500);
  renderHunger(); renderHealth();
}
window.minicraft.useMould = useMould;
window.minicraft.eatCakeSlice = eatCakeSlice;
