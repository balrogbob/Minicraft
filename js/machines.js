// Machines that do more than turn: pumps and spouts, drills, filament lamps, hoppers and conveyor belts.
// (Kinetics works out how fast each one is driven; machines that make things are stations.)
//
//  - A pump beside still water, while driven, pushes it through every lead pipe joined to it, and out of
//    each spout joined to the pipes: a spout pours a block of water below it. Stop the pump and the water
//    from its spouts is taken back.
//  - A drill digs out the first block in its way, up to 32 blocks ahead (or down), as fast as it's driven,
//    and passes what it digs into whatever is behind it: a chest, a machine, a hopper or a belt.
//  - A filament lamp glows while it's driven.
//  - A hopper takes one thing at a time out of the chest or machine above it (a machine's finished
//    output) and passes it on to the chest, machine, hopper or belt it points at. Pointing down into a
//    machine it fills the ingredients; from the side it fills the fuel slot (if it's fuel).
//  - A conveyor belt, while driven, carries things along to whatever its end points at.
//  - A pump beside lava pumps lava instead; a spout over a cauldron fills it with water.
//  - Pipes also fill tanks, water sprinklers, and carry lava to ovens, smelters and engines as fuel;
//    valves only let it through while signalled. A pump beside a tank pumps out of it.
//  - A harvester reaps the ripe crops in front of it and passes them back, like a drill.
//  - A steam engine burns the fuel put into it while there's water beside it, and drives shafts.
//  - Observers and storage gauges watch the block in front of them and switch on (see onSwitch).
//  - An ejector throws what's in the chest or machine behind it out onto the ground, while it's signalled.
//  - A collector is a hopper that also pulls in loose things lying near it.
//  - Splitting belts send things left and right in turn; sorting belts send what matches their frames left.
//  - Farm machines: tree fellers, planters, block breakers and placers, animal stations, fishing nets.
//  - A bucket elevator, while driven, lifts what's put into it up its column and out of the top.
//  - Power meters and daylight sensors signal (see onSwitch) when the grid's short, or at night.
//  - An item counter passes things on out of its front and gives a pulse after every N of them.
//  - A teleport pad sends what's put into it to the pad it's paired with (pads pair up in the order
//    they're put down), into the block under that, or out onto it.
//  - A quarry, on electricity, digs out the 9 x 9 area in front of it a layer at a time, down to bedrock,
//    and passes what it digs out of its back.
//  - A monster spawner (found in dungeons) brings out a creature now and then while you're near and it
//    has no signal.
import * as THREE from 'three';
import {
  BLOCKS, AIR, WATER, LAVA, isWaterId, PIPE, PUMP, SPOUT, DRILL, FILAMENT_LAMP, BELT, FACING_DIRS, TOOL_MATERIALS,
  metalTool, maxStack, dropsFor, isFlowing, stationKind, CAULDRON, WHEAT_0, WHEAT_3, SEEDS, BERRY_BUSH, BERRIES, SUGAR_CANE,
  STEAM_ENGINE, MAX_HONEY, FARM_REACH, isWheat, BEDROCK, PAD_ITEM, LOOT_CHEST, TANK, TANK_CAP, tankId, LOG, SAPLING, GRASS, DIRT, isBlock, WOOL, FEATHER, BUCKET, MILK_BUCKET, WHEAT,
} from './blocks.js';
import { STATION_KINDS, isFuel, FUEL_ITEMS } from './stations.js';
import { CHUNK } from './terrain.js';
import { skyBrightness, lightBrightness } from './world.js';

const key = (x, y, z) => `${x},${y},${z}`;
const unkey = (k) => k.split(',').map(Number);
const SIDES6 = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
const DRILL_REACH = 32;
const TUNGSTEN_PICK = metalTool(TOOL_MATERIALS.findIndex((m) => m.key === 'tungsten'), 'pick');
const BELT_SPEED = 1.5; // blocks a second at 1x
const BELT_GAP = 0.3; // spacing between things on a belt
const HOPPER_EVERY = 0.4; // seconds between items a hopper moves
const HARVEST_TIME = 1.5; // seconds a harvester takes over each crop at 1x
const ENGINE_BURN = 30; // seconds a steam engine runs on one "item" of fuel (a coal runs it for 5 minutes)
const PULSE = 0.4; // seconds an observer's signal lasts
const EJECT_EVERY = 0.5; // seconds between things an ejector throws while it's signalled
const COLLECT_REACH = 4; // how far a collector pulls loose things from
const LIFT_SPEED = 2; // blocks a second a bucket elevator lifts things at 1x
const LIFT_GAP = 0.35;
const FELL_TIME = 4; // seconds a tree feller takes over a tree at 1x
const RANCH_EVERY = 3; // seconds between an animal station's rounds
const RANCH_REACH = 5;
const NET_TIME = 60; // average seconds between a fishing net's catches
const QUARRY_TIME = 0.5; // seconds a quarry takes over each block at 1x
const QUARRY_SIZE = 9; // it digs a QUARRY_SIZE x QUARRY_SIZE area
const COUNTER_STEPS = [1, 2, 4, 8, 16, 32, 64];
const SPAWN_EVERY = [8, 16]; // seconds between a spawner's creatures (at random between these)
const SPAWN_NEAR = 20; // a spawner only works while you're this close

// The way a drill, hopper or belt points: [dx, dy, dz].
export function pointing(def) {
  if (def.down) return [0, -1, 0];
  const [dx, dz] = FACING_DIRS[def.facing];
  return [dx, 0, dz];
}

// What a stack (or a thing on a belt or in an elevator) carries besides its id and count: how worn it is
// (or how much charge it has used), its enchantments, and whether a portable lamp is switched on. Null for a
// plain one. Machines pass this along with the thing, so nothing comes out of one mended or recharged.
export function stateOf(s) {
  if (!s || typeof s !== 'object') return null;
  const o = {};
  if (s.wear > 0) o.wear = s.wear;
  if (Array.isArray(s.ench) && s.ench.length) o.ench = [...s.ench];
  if (s.on) o.on = true;
  if (s.pack > 0) o.pack = s.pack; // what's inside a backpack, or a machine taken up with a spanner (see main.js)
  return o.wear || o.ench || o.on || o.pack ? o : null;
}
// The same, checked over (for loading a save).
const cleanState = (o) => {
  if (!o || typeof o !== 'object') return {};
  return stateOf({ wear: +o.wear || 0, ench: Array.isArray(o.ench) ? o.ench.filter((e) => typeof e === 'string') : null, on: o.on === true, pack: Math.floor(+o.pack || 0) }) ?? {};
};
const idOf = (item) => (typeof item === 'object' ? item?.id ?? 0 : item);

// Put up to n of an item into a list of slots: onto matching stacks first, then empty slots.
// Returns how many went in. A thing with state (see stateOf) never stacks: it gets a slot of its own.
function addToSlots(slots, id, n, state = null) {
  let left = n;
  for (const s of slots) {
    if (!left || state) break;
    if (s && s.id === id && !stateOf(s) && s.count < maxStack(id)) { const k = Math.min(left, maxStack(id) - s.count); s.count += k; left -= k; }
  }
  for (let i = 0; i < slots.length && left; i++) {
    if (!slots[i]) { const k = state ? 1 : Math.min(left, maxStack(id)); slots[i] = { id, count: k, ...state }; left -= k; }
  }
  return n - left;
}

export class Machines {
  constructor(scene, icons) {
    this.scene = scene;
    this.icons = icons;
    this.belts = new Map(); // "x,y,z" -> [{ id, t, sprite }], front first (t from 0 at the start to 1 at the end)
    this.tubeFx = []; // things flying along pneumatic tubes (just for show): { id, path, d, sprite }
    this.spoutWater = new Map(); // cells holding water (or lava) poured by a spout -> which
    this.drills = new Map(); // "x,y,z" -> { progress, target: "x,y,z", held: [[id, n]], status } (harvesters too)
    this.engines = new Map(); // "x,y,z" -> { burn: seconds left, fuel: { id, count } | null }
    this.seen = new Map(); // observer "x,y,z" -> the block it last saw in front of it
    this.pulses = new Map(); // observer "x,y,z" -> seconds left of its signal
    this.gaugeFull = new Set(); // gauges set to signal only when what they watch is full
    this.ejectors = new Map(); // "x,y,z" -> { t: seconds to the next throw, sig: signalled last time }
    this.ejectStacks = new Set(); // ejectors set to throw a whole stack each time their signal comes on
    this.split = new Map(); // splitting belt "x,y,z" -> which side the next thing goes (0 left, 1 right)
    this.tanks = new Map(); // "x,y,z" -> { liquid, amount (buckets) }
    this.sprinkling = []; // sprinklers watering now
    this.lifts = new Map(); // bucket elevator column, by its bottom "x,y,z" -> [{ id, h, sprite }] (h: height climbed)
    this.counts = new Map(); // item counter "x,y,z" -> things counted since its last pulse
    this.counterN = new Map(); // item counter "x,y,z" -> how many things for each pulse (8 if not set)
    this.meterSpare = new Set(); // power meters set to signal when there's power to spare
    this.dayInvert = new Set(); // daylight sensors set to signal by day
    this.quarries = new Map(); // "x,y,z" -> { i: cell in the layer, y: the layer, progress, held: [[id, n]], done, status }
    this.spawners = new Map(); // "x,y,z" -> seconds to its next creature
    this.pads = new Map(); // teleport pad "x,y,z" -> the "x,y,z" of its partner, or null while it waits for one
    this.progIndex = new Map(); // programmable crafter "x,y,z" -> { i: which frame, sig: signalled last time }
    this.sensorTimer = 0;
    this.world = null;
    this.hopperTimer = 0;
    this.pumpTimer = 0;
    this.textures = new Map();
  }

  clear() {
    for (const items of this.belts.values()) for (const it of items) this.dropSprite(it);
    this.belts.clear();
    for (const f of this.tubeFx) this.dropSprite(f); this.tubeFx = []; this.farmCache?.clear();
    this.spoutWater.clear();
    this.drills.clear();
    this.engines.clear();
    this.seen.clear();
    this.pulses.clear();
    this.gaugeFull.clear();
    this.ejectors.clear(); this.ejectStacks.clear(); this.split.clear();
    for (const items of this.lifts.values()) for (const it of items) this.dropSprite(it);
    this.lifts.clear();
    this.tanks.clear();
    this.counts.clear(); this.counterN.clear(); this.meterSpare.clear(); this.dayInvert.clear();
    this.quarries.clear(); this.spawners.clear(); this.pads.clear(); this.progIndex.clear();
  }

  // ---------- tanks ----------

  tank(x, y, z) {
    const k = key(x, y, z);
    let t = this.tanks.get(k);
    if (!t) { t = { liquid: WATER, amount: 0 }; this.tanks.set(k, t); }
    return t;
  }

  // Show how full a tank is.
  showTank(world, x, y, z) {
    const t = this.tank(x, y, z), id = tankId(t.liquid, t.amount);
    if (world.get(x, y, z) !== id && BLOCKS[world.get(x, y, z)]?.tank) world.setBlock(x, y, z, id);
  }

  // Pour a bucket of liquid into a tank (n = 1) or take one out (n = -1). Returns true if it could.
  pourTank(world, x, y, z, liquid, n) {
    const t = this.tank(x, y, z);
    if (n > 0) { if ((t.amount > 0 && t.liquid !== liquid) || t.amount > TANK_CAP - 1) return false; t.liquid = liquid; t.amount += 1; }
    else { if (t.liquid !== liquid || t.amount < 1) return false; t.amount -= 1; }
    this.showTank(world, x, y, z);
    return true;
  }

  tankText(x, y, z) {
    const t = this.tanks.get(key(x, y, z));
    return t?.amount > 0 ? `${Math.floor(t.amount * 10) / 10} of ${TANK_CAP} buckets of ${t.liquid === LAVA ? 'lava' : 'water'}` : 'Empty';
  }

  // ---------- putting things into blocks ----------

  // Put n of an item into the block at (x, y, z): a chest, a machine (as an ingredient, or as fuel when
  // `fuel` and it burns), a hopper (passed straight on) or a belt (one at a time). Returns how many went in.
  // `item` is an id, or a stack (or anything with an id) whose state goes along with it (see stateOf).
  // `dir` ([dx, dy, dz]), when known, is the way the thing is moving: it came from (x - dx, y - dy, z - dz).
  insert(world, stations, x, y, z, item, n, fuel = false, depth = 0, dir = null) {
    const id = idOf(item), state = stateOf(item);
    const bid = world.get(x, y, z), def = BLOCKS[bid];
    if (!def || depth > 6 || !id) return 0;
    if (def.crossing) {
      // a belt crossing: straight on across, the way it was going
      if (!dir || dir[1]) return 0;
      return this.insert(world, stations, x + dir[0], y, z + dir[2], item, n, fuel, depth + 1, dir);
    }
    if (def.tube) return this.intoTube(world, stations, x, y, z, item, n, depth, dir);
    const kind = stationKind(bid);
    if (kind) {
      const K = STATION_KINDS[kind];
      const st = stations.get(x, y, z, kind);
      if (K.accepts && !K.accepts.includes(id)) return 0;
      if (fuel && !state && !K.storage && !K.powered && !K.crafter && !K.holder && isFuel(id)) {
        if (!st.fuel) { const k = Math.min(n, maxStack(id)); st.fuel = { id, count: k }; return k; }
        if (st.fuel.id !== id) return 0;
        const k = Math.min(n, maxStack(id) - st.fuel.count);
        st.fuel.count += k;
        return k;
      }
      return addToSlots(st.inputs, id, n, state);
    }
    if (def.rail?.loader) {
      // a storage cart waiting on a loader rail
      const cart = this.carts?.storageAt(x, y, z);
      if (!cart) return 0;
      const k = addToSlots(cart.store.inputs, id, n, state);
      if (k) this.carts.busy(cart);
      return k;
    }
    if (def.hopper) {
      // a sorting hopper (one with item frames on it) only takes what matches a frame
      const filter = this.frames?.around(world, x, y, z);
      if (filter?.length && !filter.includes(id)) return 0;
      const [dx, dy, dz] = pointing(def);
      return this.insert(world, stations, x + dx, y + dy, z + dz, item, n, !def.down, depth + 1, [dx, dy, dz]);
    }
    if (def.counter) {
      // an item counter: straight on out of its front, counting what goes through
      const [dx, dz] = FACING_DIRS[def.facing];
      const k = this.insert(world, stations, x + dx, y, z + dz, item, n, fuel, depth + 1, [dx, 0, dz]);
      if (k > 0) this.counted(x, y, z, k);
      return k;
    }
    if (def.pad) {
      // a teleport pad: to its partner, into the block under it or out on top of it
      const to = this.pads.get(key(x, y, z));
      if (!to || !this.electric) return 0;
      const [px, py, pz] = unkey(to);
      if (!world.chunkAt(px, pz) || !BLOCKS[world.get(px, py, pz)]?.pad) return 0;
      const k = Math.min(n, Math.floor((this.electric.store.get(key(x, y, z)) ?? 0) / PAD_ITEM + 1e-6));
      if (k <= 0 || !this.electric.drawPad(x, y, z, k * PAD_ITEM)) return 0;
      const below = this.insert(world, stations, px, py - 1, pz, item, k, false, depth + 1);
      if (below < k) this.throwItem?.({ id, count: k - below, ...state }, { x: px + 0.5, y: py + 0.4, z: pz + 0.5 }, { x: 0, y: 2.5, z: 0 });
      this.teleported?.(px, py, pz);
      return k;
    }
    if (def.engine) {
      if (!isFuel(id) || state) return 0;
      const e = this.engine(x, y, z);
      if (e.fuel && e.fuel.id !== id) return 0;
      const k = Math.min(n, maxStack(id) - (e.fuel?.count ?? 0));
      if (k > 0) e.fuel = { id, count: (e.fuel?.count ?? 0) + k };
      return Math.max(0, k);
    }
    if (def.elevator) {
      // into the bucket elevator column, at this height
      let by = y;
      while (BLOCKS[world.get(x, by - 1, z)]?.elevator) by--;
      const k = key(x, by, z), items = this.lifts.get(k) ?? [], h = y - by;
      if (items.some((it) => Math.abs(it.h - h) < LIFT_GAP)) return 0;
      items.push({ id, h, sprite: null, ...state });
      items.sort((a, b) => b.h - a.h);
      this.lifts.set(k, items);
      return 1;
    }
    if (def.belt) {
      const items = this.belts.get(key(x, y, z)) ?? [];
      const last = items[items.length - 1];
      if (last && last.t < BELT_GAP) return 0;
      items.push({ id, t: 0, sprite: null, ...state });
      this.belts.set(key(x, y, z), items);
      return 1;
    }
    return 0;
  }

  // Take one thing out of the chest or machine at (x, y, z) for a hopper below it: a chest's first
  // stack, or a machine's output. Returns { id, ...its state } for the thing taken, or 0 (`peek` only looks).
  takeOne(world, stations, x, y, z, peek = false, filter = null) {
    const ok = (s) => s && (!filter?.length || filter.includes(s.id));
    const one = (s) => ({ id: s.id, ...stateOf(s) });
    if (BLOCKS[world.get(x, y, z)]?.rail?.loader) {
      const cart = this.carts?.storageAt(x, y, z);
      const i = cart ? cart.store.inputs.findIndex(ok) : -1;
      if (i < 0) return 0;
      const it = one(cart.store.inputs[i]);
      if (!peek) { if (!--cart.store.inputs[i].count) cart.store.inputs[i] = null; this.carts.busy(cart); }
      return it;
    }
    const kind = stationKind(world.get(x, y, z));
    if (!kind) return 0;
    const st = stations.get(x, y, z, kind);
    if (STATION_KINDS[kind].storage) {
      const i = st.inputs.findIndex(ok);
      if (i < 0) return 0;
      const it = one(st.inputs[i]);
      if (!peek && !--st.inputs[i].count) st.inputs[i] = null;
      return it;
    }
    if (!ok(st.out)) return 0;
    const it = one(st.out);
    if (!peek && !--st.out.count) st.out = null;
    return it;
  }

  // ---------- each frame ----------

  tick(dt, world, kinetics, stations, light) {
    // gather the machines in the loaded world
    this.world = world; this.kinetics = kinetics;
    const pumps = [], drills = [], lamps = [], hoppers = [], sensors = [], harvesters = [], engines = [], ejectors = [], collectors = [], farms = [], quarries = [], spawners = [];
    for (const c of world.chunks.values()) {
      for (const li of c.machines) {
        const id = c.data[li], def = BLOCKS[id];
        const x = c.cx * CHUNK + (li & 15), z = c.cz * CHUNK + ((li >> 4) & 15), y = li >> 8;
        if (id === PUMP) pumps.push([x, y, z]);
        else if (def.quarry) quarries.push([x, y, z, def]);
        else if (def.spawner) spawners.push([x, y, z]);
        else if (def.machine && id >= DRILL && id <= DRILL + 4) drills.push([x, y, z, def]);
        else if (id === FILAMENT_LAMP || id === FILAMENT_LAMP + 1) lamps.push([x, y, z, id]);
        else if (def.farm) farms.push([x, y, z, def]);
        else if (def.hopper) { hoppers.push([x, y, z, def]); if (def.collector) collectors.push([x, y, z, def]); }
        else if (def.ejector) ejectors.push([x, y, z, def]);
        else if (def.sensor) sensors.push([x, y, z, def]);
        else if (def.harvester) harvesters.push([x, y, z, def]);
        else if (def.engine) engines.push([x, y, z, def]);
      }
    }
    for (const [x, y, z, id] of lamps) {
      const lit = kinetics.powerAt(x, y, z) > 0;
      if (lit !== (id === FILAMENT_LAMP + 1)) world.setBlock(x, y, z, FILAMENT_LAMP + (lit ? 1 : 0));
    }
    if ((this.pumpTimer -= dt) <= 0) { this.pumpTimer = 0.5; this.tickPumps(world, kinetics, pumps, stations); }
    for (const d of drills) this.tickDrill(dt, world, kinetics, stations, d);
    for (const h of harvesters) this.tickHarvester(dt, world, kinetics, stations, h);
    for (const e of engines) this.tickEngine(dt, world, e);
    this.tickSensors(dt, world, stations, sensors);
    if ((this.hopperTimer -= dt) <= 0) {
      this.hopperTimer = HOPPER_EVERY;
      for (const [x, y, z, def] of hoppers) {
        const filter = this.frames?.around(world, x, y, z);
        const it = this.takeOne(world, stations, x, y + 1, z, true, filter);
        if (!it) continue;
        const [dx, dy, dz] = pointing(def);
        if (this.insert(world, stations, x + dx, y + dy, z + dz, it, 1, !def.down, 0, [dx, dy, dz])) this.takeOne(world, stations, x, y + 1, z, false, filter);
      }
    }
    this.tickBelts(dt, world, kinetics, stations, light);
    this.tickTubes(dt);
    this.tickLifts(dt, world, kinetics, stations, light);
    for (const e of ejectors) this.tickEjector(dt, world, stations, e);
    for (const f of farms) this.tickFarm(dt, world, kinetics, stations, f);
    if (collectors.length) this.tickCollectors(dt, world, stations, collectors);
    for (const q of quarries) this.tickQuarry(dt, world, stations, q);
    for (const sp of spawners) this.tickSpawner(dt, world, sp);
  }

  // ---------- v22: quarries, spawners, counters, teleport pads ----------

  // Can a quarry dig this block out?
  quarryable(id) {
    const d = BLOCKS[id];
    if (!id || !d || id === BEDROCK || !(d.hardness > 0) || !isFinite(d.hardness)) return false;
    if (isWaterId(id) || id === LAVA || d.variantOf === LAVA) return false;
    if (d.station || d.machine || d.kinetic || d.electric || d.hopper || d.belt || d.sensor || d.rail || d.spawner || d.logic || d.switch) return false;
    if (id === LOOT_CHEST || d.blastproof || d.doorBase || d.frame || d.sign || d.painting || d.lampBase) return false; // (things that hold something, or come in pairs)
    return !d.tier || d.tier <= 5;
  }

  quarry(x, y, z) {
    const k = key(x, y, z);
    let q = this.quarries.get(k);
    if (!q) { q = { i: 0, y, progress: 0, held: [], done: false, status: '' }; this.quarries.set(k, q); }
    return q;
  }

  // the cell in front of a quarry it's on now (its layer, and cell i of the area)
  quarryCell(x, z, def, q) {
    const [dx, dz] = FACING_DIRS[def.facing], [rx, rz] = [dz, -dx]; // (to its right)
    const a = Math.floor(q.i / QUARRY_SIZE) + 1, b = (q.i % QUARRY_SIZE) - (QUARRY_SIZE >> 1);
    return [x + dx * a + rx * b, q.y, z + dz * a + rz * b];
  }

  // Does a quarry want electricity (is it still digging, with somewhere to put things)?
  quarryWants(x, y, z) { const q = this.quarries.get(key(x, y, z)); return !q || (!q.done && !q.held.length); }

  tickQuarry(dt, world, stations, [x, y, z, def]) {
    const q = this.quarry(x, y, z);
    if (!this.passBack(world, stations, q, x, y, z, def)) { q.status = 'Stuck: nowhere to put what it digs (a chest, hopper or belt behind it)'; return; }
    if (q.done) { q.status = 'Finished: it has dug all the way down'; return; }
    const speed = this.electric?.speedAt(x, y, z) ?? 0;
    if (!(speed > 0)) { q.status = `No power: ${this.electric?.statusAt(x, y, z) ?? 'join it to a generator'}`; return; }
    // on to the next block there's something to dig (looking at a fair few cells each tick)
    for (let tries = 0; tries < 40; tries++) {
      if (q.i >= QUARRY_SIZE * QUARRY_SIZE) { q.i = 0; q.y--; }
      if (q.y < 1) { q.done = true; q.status = 'Finished: it has dug all the way down'; return; }
      const [cx, cy, cz] = this.quarryCell(x, z, def, q);
      if (!world.chunkAt(cx, cz)) { q.status = 'Waiting: the area it digs isn\'t loaded'; return; }
      if (this.quarryable(world.get(cx, cy, cz))) break;
      q.i++; q.progress = 0;
      if (tries === 39) return;
    }
    const [cx, cy, cz] = this.quarryCell(x, z, def, q);
    q.status = `Digging layer ${y - q.y + 1} (at height ${q.y})`;
    q.progress += dt * speed;
    if (q.progress < QUARRY_TIME) return;
    q.progress = 0;
    const id = world.get(cx, cy, cz);
    q.held.push(...dropsFor(id, TUNGSTEN_PICK).map(([i, n]) => [i, n]));
    world.setBlock(cx, cy, cz, AIR);
    this.onBlockChanged?.(cx, cy, cz);
    q.i++;
  }

  quarryStatus(x, y, z) { return this.quarries.get(key(x, y, z))?.status || 'Waiting for power'; }

  tickSpawner(dt, world, [x, y, z]) {
    const k = key(x, y, z), h = this.farmHooks;
    let t = this.spawners.get(k) ?? SPAWN_EVERY[0] / 2;
    t -= dt;
    if (t > 0) { this.spawners.set(k, t); return; }
    this.spawners.set(k, SPAWN_EVERY[0] + Math.random() * (SPAWN_EVERY[1] - SPAWN_EVERY[0]));
    if (!h?.mobs || h.peaceful?.() || this.signalAt?.(x, y, z)) return; // a signal stops it
    const p = h.playerPos?.();
    if (!p || Math.hypot(p.x - x - 0.5, p.y - y, p.z - z - 0.5) > SPAWN_NEAR) return;
    h.mobs.spawnNear?.(x, y, z);
  }

  // An item counter counted k more things: a pulse each time it gets to its number.
  counted(x, y, z, k) {
    const key_ = key(x, y, z), n = this.counterN.get(key_) ?? 8;
    let c = (this.counts.get(key_) ?? 0) + k;
    if (c >= n) {
      c %= n;
      if (!this.pulses.has(key_)) { this.pulses.set(key_, PULSE); this.onSwitch?.(x, y, z, true); }
    }
    this.counts.set(key_, c);
  }

  // Tapping an item counter steps on how many things it counts for each pulse.
  cycleCounter(x, y, z) {
    const k = key(x, y, z), n = this.counterN.get(k) ?? 8;
    const next = COUNTER_STEPS[(COUNTER_STEPS.indexOf(n) + 1) % COUNTER_STEPS.length];
    this.counterN.set(k, next); this.counts.delete(k);
    return next;
  }
  counterText(x, y, z) { const k = key(x, y, z); return `${this.counts.get(k) ?? 0} of ${this.counterN.get(k) ?? 8}`; }

  toggleMeter(x, y, z) { const k = key(x, y, z); if (this.meterSpare.has(k)) this.meterSpare.delete(k); else this.meterSpare.add(k); return this.meterSpare.has(k); }
  toggleDaylight(x, y, z) { const k = key(x, y, z); if (this.dayInvert.has(k)) this.dayInvert.delete(k); else this.dayInvert.add(k); return this.dayInvert.has(k); }

  // A teleport pad was put down: it pairs with the oldest pad still waiting for a partner.
  padPlaced(x, y, z) {
    const k = key(x, y, z);
    const waiting = [...this.pads].find(([o, p]) => p === null && o !== k);
    if (waiting) { this.pads.set(waiting[0], k); this.pads.set(k, waiting[0]); return unkey(waiting[0]); }
    this.pads.set(k, null);
    return null;
  }
  padPartner(x, y, z) { const p = this.pads.get(key(x, y, z)); return p ? unkey(p) : null; }

  // A programmable crafter: which of its frames it's on, stepping on to the next as its signal comes on.
  progFrame(x, y, z, frames, sig) {
    const k = key(x, y, z);
    let p = this.progIndex.get(k);
    if (!p) { p = { i: 0, sig: false }; this.progIndex.set(k, p); }
    if (sig && !p.sig && frames.length) p.i = (p.i + 1) % frames.length;
    p.sig = sig;
    if (!frames.length) return null;
    p.i %= frames.length;
    return frames[p.i];
  }

  // ---------- ejectors and collectors ----------

  tickEjector(dt, world, stations, [x, y, z, def]) {
    const k = key(x, y, z);
    let e = this.ejectors.get(k);
    if (!e) { e = { t: 0, sig: false }; this.ejectors.set(k, e); }
    const sig = !!this.signalAt?.(x, y, z), rising = sig && !e.sig;
    e.sig = sig;
    e.t -= dt;
    const stack = this.ejectStacks.has(k);
    if (stack ? !rising : !sig || e.t > 0) return;
    e.t = EJECT_EVERY;
    const [dx, dz] = FACING_DIRS[def.facing];
    if (world.isSolid(x + dx, y, z + dz)) return; // nowhere to throw it
    const bx = x - dx, bz = z - dz;
    const first = this.takeOne(world, stations, bx, y, bz, true);
    if (!first) return;
    const id = first.id, state = stateOf(first);
    let n = 0;
    const most = stack && !state ? maxStack(id) : 1; // (a thing with state goes on its own)
    for (let it; n < most && (it = this.takeOne(world, stations, bx, y, bz, true)) && it.id === id && !stateOf(it) === !state;) { this.takeOne(world, stations, bx, y, bz); n++; }
    this.throwItem?.({ id, count: n, ...state }, { x: x + 0.5 + dx * 0.7, y: y + 0.35, z: z + 0.5 + dz * 0.7 }, { x: dx * 4, y: 2, z: dz * 4 });
  }

  // ---------- farm machines ----------

  // Pass on what a machine holds out of its back (as a drill does). Returns false while it's stuck.
  passBack(world, stations, d, x, y, z, def) {
    const [dx, dz] = FACING_DIRS[def.facing];
    while (d.held.length) {
      const [id, n] = d.held[0];
      const put = this.insert(world, stations, x - dx, y, z - dz, id, n, false, 0, [-dx, 0, -dz]);
      if (put >= n) d.held.shift(); else { d.held[0][1] = n - put; break; }
    }
    return !d.held.length;
  }

  tickFarm(dt, world, kinetics, stations, [x, y, z, def]) {
    const k = key(x, y, z);
    let d = this.drills.get(k);
    if (!d) { d = { progress: 0, target: '', held: [], status: '', sig: false, t: Math.random() * 2 }; this.drills.set(k, d); }
    const [dx, dz] = FACING_DIRS[def.facing], fx = x + dx, fz = z + dz;
    const sig = def.farm === 'breaker' || def.farm === 'placer' ? !!this.signalAt?.(x, y, z) : false, rising = sig && !d.sig;
    d.sig = sig;
    if (def.farm !== 'net' && def.farm !== 'planter' && !this.passBack(world, stations, d, x, y, z, def)) { d.status = 'Stopped: there\'s nowhere behind it to put what it gets'; return; }
    if (def.farm === 'feller') {
      const speed = kinetics.powerAt(x, y, z);
      if (speed <= 0) { d.status = 'Not turning'; d.progress = 0; return; }
      const ty = [y, y + 1].find((cy) => world.get(fx, cy, fz) === LOG);
      if (ty === undefined) { d.status = 'Waiting for a tree in front of it'; d.progress = 0; return; }
      d.status = 'Cutting down a tree';
      if ((d.progress += dt * speed) < FELL_TIME) return;
      d.progress = 0;
      const logs = [[fx, ty, fz], ...(this.farmHooks?.treeAbove(fx, ty, fz) ?? [])];
      for (const [lx, ly, lz] of logs) world.setBlock(lx, ly, lz, AIR);
      d.held.push([LOG, logs.length]);
      if (logs.length > 1) d.held.push([SAPLING, Math.random() < 0.5 ? 2 : 1]);
      return;
    }
    if (def.farm === 'breaker') {
      if (!rising) return;
      const id = world.get(fx, y, fz), b = BLOCKS[id];
      if (id === AIR || !b || b.liquid || b.hardness === Infinity || b.station || b.kinetic || b.machine || b.hopper || b.farm || b.rail) return;
      d.held.push(...dropsFor(id, TUNGSTEN_PICK).map(([i, n]) => [i, n]));
      world.setBlock(fx, y, fz, AIR);
      this.onBlockChanged?.(fx, y, fz);
      return;
    }
    if (def.farm === 'placer') {
      if (!rising) return;
      const there = world.get(fx, y, fz);
      if (there !== AIR && !isFlowing(there)) return;
      // the first plain block in the chest behind it
      const bx = x - dx, bz = z - dz, kind = stationKind(world.get(bx, y, bz));
      if (!kind || !STATION_KINDS[kind].storage) return;
      const st = stations.get(bx, y, bz, kind);
      const i = st.inputs.findIndex((s) => s && isBlock(s.id) && BLOCKS[s.id].shape === 'cube' && !BLOCKS[s.id].station && !BLOCKS[s.id].kinetic && !BLOCKS[s.id].machine && !BLOCKS[s.id].farm);
      if (i < 0) return;
      const id = st.inputs[i].id;
      if (!--st.inputs[i].count) st.inputs[i] = null;
      world.setBlock(fx, y, fz, id);
      this.onBlockChanged?.(fx, y, fz);
      return;
    }
    if ((d.t -= dt) > 0) return;
    if (def.farm === 'planter') {
      d.t = 2;
      const below = world.get(fx, y - 1, fz);
      if (world.get(fx, y, fz) !== AIR || (below !== GRASS && below !== DIRT)) return;
      const st = stations.get(x, y, z, 'planter');
      const i = st.inputs.findIndex((s) => s?.id === SAPLING);
      if (i < 0) return;
      if (!--st.inputs[i].count) st.inputs[i] = null;
      world.setBlock(fx, y, fz, SAPLING);
      return;
    }
    if (def.farm === 'net') {
      d.t = 5;
      const wet = SIDES6.filter(([ex, ey, ez]) => ey <= 0 && isWaterId(world.get(x + ex, y + ey, z + ez))).length;
      if (wet < 2) { d.status = 'It needs to be in water'; return; }
      d.status = 'Fishing';
      if (Math.random() >= 5 / NET_TIME) return;
      const c = this.farmHooks?.catchAt({ x: x + 0.5, y, z: z + 0.5 });
      if (c) addToSlots(stations.get(x, y, z, 'net').inputs, c[0], c[1]);
      return;
    }
    if (def.farm === 'ranch') {
      d.t = RANCH_EVERY;
      const st = stations.get(x, y, z, 'ranch'), mobs = this.farmHooks?.mobs;
      if (!mobs) return;
      const near = mobs.mobs.filter((m) => !m.dying && Math.hypot(m.pos.x - x - 0.5, m.pos.z - z - 0.5) <= RANCH_REACH && Math.abs(m.pos.y - y) <= 3);
      const take = (id) => { const i = st.inputs.findIndex((s) => s?.id === id); if (i < 0) return false; if (!--st.inputs[i].count) st.inputs[i] = null; return true; };
      let got = 0;
      for (const m of near) {
        if (m.spec.wool && m.shornFor <= 0) { m.shornFor = 150; m.parts.shear?.(true); d.held.push([WOOL, Math.random() < 0.5 ? 2 : 1]); got++; }
        else if (m.kind === 'duck' && m.featherFor <= 0) { m.featherFor = 30; d.held.push([FEATHER, 1]); got++; }
        else if (m.spec.milk && !(m.milkFor > 0) && take(BUCKET)) { m.milkFor = 60; d.held.push([MILK_BUCKET, 1]); got++; }
        if (m.milkFor > 0) m.milkFor -= RANCH_EVERY;
      }
      // feeding: a wheat now and then makes coats and feathers grow back twice as fast
      const hungry = near.filter((m) => m.shornFor > 0 || m.featherFor > 0);
      if (hungry.length && (d.fed = (d.fed ?? 0) - RANCH_EVERY) <= 0 && take(WHEAT)) d.fed = 30;
      if (d.fed > 0) for (const m of hungry) { if (m.shornFor > 0) m.shornFor -= RANCH_EVERY; if (m.featherFor > 0) m.featherFor -= RANCH_EVERY; }
      // breeding: two of a kind ready to breed are each fed what they breed on, if it's in the station
      let paired = 0;
      const kinds = new Map();
      for (const m of near) if (mobs.canBreed(m) && !m.tame) kinds.set(m.kind, [...(kinds.get(m.kind) ?? []), m]);
      for (const group of kinds.values()) {
        if (group.length < 2) continue;
        const food = group[0].spec.breeds.find((id) => st.inputs.filter((s) => s?.id === id).reduce((t, s) => t + s.count, 0) >= 2);
        if (food === undefined) continue;
        for (const m of group.slice(0, 2)) { take(food); mobs.feed(m); }
        paired++;
      }
      d.status = near.length ? `${near.length} animal${near.length > 1 ? 's' : ''} nearby${got ? `: got ${got} thing${got > 1 ? 's' : ''}` : ''}${d.fed > 0 ? ', fed' : ''}${paired ? `, ${paired} pair${paired > 1 ? 's' : ''} fed to breed` : ''}` : 'No animals within 5 blocks';
    }
  }

  // Tapping an ejector switches it between one at a time and a stack per signal. Returns true for stacks.
  toggleEjector(x, y, z) {
    const k = key(x, y, z);
    if (this.ejectStacks.has(k)) this.ejectStacks.delete(k); else this.ejectStacks.add(k);
    return this.ejectStacks.has(k);
  }

  // Collectors draw in loose things lying near them; when one gets there, it goes in like a dropped one.
  tickCollectors(dt, world, stations, collectors) {
    if (!this.loose) return;
    for (const it of this.loose.items) {
      if (it.age < it.delay || (it.noCollect -= dt) > 0) continue;
      let best = null, bd = Infinity;
      for (const c of collectors) {
        const cx = c[0] + 0.5, cy = c[1] + 1, cz = c[2] + 0.5;
        const d = Math.hypot(it.pos.x - cx, it.pos.y - cy, it.pos.z - cz);
        if (d < bd && d <= COLLECT_REACH + 0.5 && it.pos.y > c[1] - 1.5) { bd = d; best = c; }
      }
      if (!best) continue;
      const [x, y, z] = best;
      if (bd < 0.9) {
        const took = this.insert(world, stations, x, y, z, it.stack, it.stack.count, false);
        if (took > 0) it.stack.count -= took; else it.noCollect = 3; // (the collector has nowhere to put it: leave it be a while)
        continue;
      }
      const dx = x + 0.5 - it.pos.x, dy = y + 1.1 - it.pos.y, dz = z + 0.5 - it.pos.z, d = Math.hypot(dx, dy, dz) || 1;
      it.vel.set((dx / d) * 4, Math.max(it.vel.y, (dy / d) * 4 + 1), (dz / d) * 4);
    }
  }

  // ---------- bucket elevators ----------

  tickLifts(dt, world, kinetics, stations, light) {
    for (const [k, items] of this.lifts) {
      const [x, y, z] = unkey(k);
      if (!world.chunkAt(x, z)) continue;
      if (!BLOCKS[world.get(x, y, z)]?.elevator || BLOCKS[world.get(x, y - 1, z)]?.elevator) {
        // the column was broken up: what it held spills out
        for (const it of items) { this.dropSprite(it); this.throwItem?.({ id: it.id, count: 1, ...stateOf(it) }, { x: x + 0.5, y: y + it.h + 0.5, z: z + 0.5 }, { x: 0, y: 1, z: 0 }); }
        this.lifts.delete(k);
        continue;
      }
      let top = y, speed = 0;
      for (; BLOCKS[world.get(x, top, z)]?.elevator; top++) speed = Math.max(speed, kinetics.powerAt(x, top, z));
      const height = top - y; // things come out at this height (the top of the column)
      for (let i = 0; i < items.length; i++) {
        const limit = i === 0 ? height : items[i - 1].h - LIFT_GAP;
        items[i].h = Math.max(items[i].h, Math.min(limit, items[i].h + dt * speed * LIFT_SPEED));
      }
      if (items.length && items[0].h >= height - 1e-6 && speed > 0) {
        // out of the top: into what's above, or onto it
        const it = items[0];
        const above = world.get(x, top, z);
        const out = above === 0 ? (this.throwItem?.({ id: it.id, count: 1, ...stateOf(it) }, { x: x + 0.5, y: top + 0.1, z: z + 0.5 }, { x: 0, y: 2.5, z: 0 }), 1)
          : this.insert(world, stations, x, top, z, it, 1, false);
        if (out) { this.dropSprite(items.shift()); if (!items.length) { this.lifts.delete(k); continue; } }
      }
      const sun = light.day * skyBrightness(world.skyAt(x, y, z)), t = lightBrightness(world.lightAt(x, y, z)) * light.flicker;
      for (const it of items) {
        if (!it.sprite) it.sprite = this.makeSprite(it.id);
        it.sprite.position.set(x + 0.5, y + Math.min(it.h, height - 0.5) + 0.4, z + 0.5);
        it.sprite.material.color.setRGB(Math.max(sun, t, light.ambient), Math.max(sun, t * 0.86, light.ambient), Math.max(sun, t * 0.66, light.ambient));
      }
    }
  }

  // What a bucket elevator is doing, for a toast.
  liftStatus(world, kinetics, x, y, z) {
    let by = y;
    while (BLOCKS[world.get(x, by - 1, z)]?.elevator) by--;
    let top = by, speed = 0;
    for (; BLOCKS[world.get(x, top, z)]?.elevator; top++) speed = Math.max(speed, kinetics.powerAt(x, top, z));
    const n = this.lifts.get(key(x, by, z))?.length ?? 0;
    return `${top - by} block${top - by > 1 ? 's' : ''} high, ${n ? `lifting ${n} thing${n > 1 ? 's' : ''}` : 'empty'}; ${speed > 0 ? `running at ${+speed.toFixed(2)}x` : 'not turning: drive it with a shaft'}`;
  }

  tickPumps(world, kinetics, pumps, stations) {
    const active = new Map(); // cell below a spout -> WATER or LAVA
    const sprinkled = [];
    for (const [x, y, z] of pumps) {
      if (kinetics.powerAt(x, y, z) <= 0) continue;
      const near = SIDES6.map(([dx, dy, dz]) => [x + dx, y + dy, z + dz]);
      const ids = near.map(([nx, ny, nz]) => world.get(nx, ny, nz));
      let liquid = ids.includes(WATER) ? WATER : ids.includes(LAVA) ? LAVA : 0, from = null;
      if (!liquid) {
        // or out of a tank beside it
        const i = ids.findIndex((id) => BLOCKS[id]?.tank && id !== TANK);
        if (i >= 0) { from = key(...near[i]); liquid = this.tank(...near[i]).liquid; }
      }
      if (!liquid) continue;
      // follow the pipes (and open valves) from the pump; spouts, tanks, sprinklers and fires touching them take it
      const seen = new Set([key(x, y, z)]);
      const queue = [[x, y, z]];
      const tanks = [], fires = [];
      while (queue.length && seen.size < 512) {
        const [px, py, pz] = queue.shift();
        for (const [dx, dy, dz] of SIDES6) {
          const nx = px + dx, ny = py + dy, nz = pz + dz, k = key(nx, ny, nz);
          if (seen.has(k)) continue;
          const id = world.get(nx, ny, nz), d = BLOCKS[id];
          if (id === PIPE || (d?.valve && this.signalAt?.(nx, ny, nz))) { seen.add(k); queue.push([nx, ny, nz]); continue; }
          if (id === SPOUT) { seen.add(k); if (!active.has(key(nx, ny - 1, nz))) active.set(key(nx, ny - 1, nz), liquid); }
          else if (d?.tank) { seen.add(k); if (k !== from) tanks.push([nx, ny, nz]); }
          else if (d?.sprinkler) { seen.add(k); if (liquid === WATER) sprinkled.push([nx, ny, nz]); }
          else if (liquid === LAVA && (d?.engine || ['oven', 'smelter', 'blast'].includes(d?.station))) { seen.add(k); fires.push([nx, ny, nz, d]); }
        }
      }
      const src = from ? this.tank(...from.split(',').map(Number)) : null;
      const draw = (n) => { if (!src) return true; if (src.amount < n) return false; src.amount -= n; return true; };
      // tanks fill a bucket each time round
      for (const [tx, ty, tz] of tanks) {
        const t = this.tank(tx, ty, tz);
        if ((t.amount > 0 && t.liquid !== liquid) || t.amount >= TANK_CAP || !draw(1)) continue;
        t.liquid = liquid; t.amount = Math.min(TANK_CAP, t.amount + 1);
      }
      // lava burns as fuel (a hundredth of a bucket for each thing cooked, or half a minute of steam)
      for (const [fx, fy, fz, d] of fires) {
        if (d.engine) { const e = this.engine(fx, fy, fz); if (e.burn < 2 && draw(0.01)) e.burn += ENGINE_BURN; continue; }
        const st = stations.get(fx, fy, fz, d.station);
        if (st.burn < 0.5 && draw(0.01)) { st.burn += 1; st.burnMax = Math.max(st.burnMax, 1); }
      }
      if (src) this.showTank(world, ...from.split(',').map(Number));
      for (const [tx, ty, tz] of tanks) this.showTank(world, tx, ty, tz);
    }
    world.sprinkled = sprinkled;
    this.sprinkling = sprinkled;
    for (const [k, liquid] of active) {
      const [x, y, z] = unkey(k);
      const id = world.get(x, y, z), def = BLOCKS[id];
      // a cauldron under a water spout fills up, a level at a time
      if (def?.stationBase === CAULDRON) { if (liquid === WATER && def.water < 3) world.setBlock(x, y, z, CAULDRON + def.water + 1); continue; }
      if (id === AIR || isFlowing(id)) world.setBlock(x, y, z, liquid);
      if (world.get(x, y, z) === liquid) this.spoutWater.set(k, liquid);
    }
    // spouts that stopped: what they poured is drawn back
    for (const [k, liquid] of this.spoutWater) {
      if (active.get(k) === liquid) continue;
      const [x, y, z] = unkey(k);
      if (!world.chunkAt(x, z)) continue;
      if (world.get(x, y, z) === liquid) world.setBlock(x, y, z, AIR);
      this.spoutWater.delete(k);
    }
  }

  tickDrill(dt, world, kinetics, stations, [x, y, z, def]) {
    const k = key(x, y, z);
    let d = this.drills.get(k);
    if (!d) { d = { progress: 0, target: '', held: [], status: '' }; this.drills.set(k, d); }
    const speed = kinetics.powerAt(x, y, z);
    const [dx, dy, dz] = pointing(def);
    // pass on what it dug out of its back
    if (d.held.length) {
      const [id, n] = d.held[0];
      const put = this.insert(world, stations, x - dx, y - dy, z - dz, id, n, false, 0, [-dx, -dy, -dz]);
      if (put >= n) d.held.shift(); else d.held[0][1] = n - put;
      if (d.held.length) { d.status = 'Stopped: there\'s nowhere behind it to put what it digs'; return; }
    }
    if (speed <= 0) { d.status = 'Not turning'; d.progress = 0; return; }
    // the first block in its way
    let target = null;
    for (let i = 1; i <= DRILL_REACH; i++) {
      const tx = x + dx * i, ty = y + dy * i, tz = z + dz * i;
      if (ty < 0) break;
      const id = world.get(tx, ty, tz);
      if (id === AIR) continue;
      const b = BLOCKS[id];
      if (b.liquid) { d.status = 'Stopped: it has drilled into water'; return; }
      if (b.hardness === Infinity || b.station || b.kinetic || b.machine || b.hopper) { d.status = `Stopped at ${b.name.toLowerCase()}`; return; }
      target = [tx, ty, tz, id, i];
      break;
    }
    if (!target) { d.status = `Finished: nothing left to dig within ${DRILL_REACH} blocks`; d.progress = 0; return; }
    const [tx, ty, tz, id, dist] = target;
    const tk = key(tx, ty, tz);
    if (tk !== d.target) { d.target = tk; d.progress = 0; }
    const time = Math.max(0.5, BLOCKS[id].hardness * 0.8);
    d.progress += dt * speed;
    d.status = `Drilling ${BLOCKS[id].name.toLowerCase()}, ${dist} block${dist > 1 ? 's' : ''} ahead`;
    if (d.progress < time) return;
    d.progress = 0;
    d.held.push(...dropsFor(id, TUNGSTEN_PICK).map(([i, n]) => [i, n]));
    world.setBlock(tx, ty, tz, AIR);
  }

  // ---------- harvesters ----------

  // A ripe crop at (x, y, z): what reaping it gives, and what's left growing. Or null.
  reap(world, x, y, z) {
    const id = world.get(x, y, z);
    if (id === WHEAT_3) {
      const drops = dropsFor(id).map(([i, n]) => [i, i === SEEDS ? n - 1 : n]).filter(([, n]) => n > 0); // one seed is replanted
      return { drops, after: WHEAT_0 };
    }
    if (id === BERRY_BUSH + 1) return { drops: [[BERRIES, 2]], after: BERRY_BUSH };
    if (id === SUGAR_CANE && world.get(x, y - 1, z) === SUGAR_CANE && world.get(x, y + 1, z) !== SUGAR_CANE) return { drops: [[SUGAR_CANE, 1]], after: AIR };
    return null;
  }

  tickHarvester(dt, world, kinetics, stations, [x, y, z, def]) {
    const k = key(x, y, z);
    let d = this.drills.get(k);
    if (!d) { d = { progress: 0, target: '', held: [], status: '' }; this.drills.set(k, d); }
    const [dx, , dz] = pointing(def);
    if (d.held.length) {
      const [id, n] = d.held[0];
      const put = this.insert(world, stations, x - dx, y, z - dz, id, n, false, 0, [-dx, 0, -dz]);
      if (put >= n) d.held.shift(); else d.held[0][1] = n - put;
      if (d.held.length) { d.status = 'Stopped: there\'s nowhere behind it to put the harvest'; return; }
      d.status = 'Harvesting';
    }
    const speed = kinetics.powerAt(x, y, z);
    if (speed <= 0) { d.status = 'Not turning'; d.progress = 0; return; }
    d.progress += dt * speed;
    if (d.progress < HARVEST_TIME) return;
    d.progress = 0;
    // the 5 x 5 patch in front of it, nearest rows first, at its own level and one above or below
    const [sx, sz] = [-dz, dx]; // sideways
    for (let row = 1; row <= 5; row++) for (const side of [0, -1, 1, -2, 2]) for (const dy of [0, 1, -1, 2]) {
      const cx = x + dx * row + sx * side, cz = z + dz * row + sz * side, cy = y + dy;
      const r = this.reap(world, cx, cy, cz);
      if (!r) continue;
      world.setBlock(cx, cy, cz, r.after);
      d.held.push(...r.drops);
      d.status = 'Harvesting';
      return;
    }
    d.status = 'Waiting for something to ripen';
  }

  // ---------- steam engines ----------

  engine(x, y, z) {
    const k = key(x, y, z);
    let e = this.engines.get(k);
    if (!e) { e = { burn: 0, fuel: null }; this.engines.set(k, e); }
    return e;
  }

  hasWater(world, x, y, z) {
    return SIDES6.some(([dx, dy, dz]) => {
      const id = world.get(x + dx, y + dy, z + dz);
      return id === WATER || isFlowing(id) || BLOCKS[id]?.water > 0;
    });
  }

  // Is the steam engine at (x, y, z) giving power? (for kinetics)
  engineOn(x, y, z) { return !!BLOCKS[this.world?.get(x, y, z)]?.lit; }

  engineStatus(x, y, z) {
    const e = this.engines.get(key(x, y, z));
    if (!this.world || !this.hasWater(this.world, x, y, z)) return 'Dry: it needs water beside it (or a cauldron of water)';
    if (!e?.fuel && !(e?.burn > 0)) return 'Cold: put coal or wood in it (by hand or with a hopper)';
    return 'Getting up steam...';
  }

  tickEngine(dt, world, [x, y, z, def]) {
    const e = this.engine(x, y, z);
    const water = this.hasWater(world, x, y, z);
    if (water && e.burn <= 0 && e.fuel) {
      e.burn += (FUEL_ITEMS[e.fuel.id] ?? 1) * ENGINE_BURN;
      if (!--e.fuel.count) e.fuel = null;
    }
    const on = water && e.burn > 0;
    if (on) e.burn = Math.max(0, e.burn - dt);
    if (on !== def.lit) world.setBlock(x, y, z, STEAM_ENGINE + def.facing + (on ? 4 : 0));
  }

  // What's in a steam engine, for a toast.
  engineText(x, y, z) {
    const e = this.engines.get(key(x, y, z));
    const mins = Math.ceil((e?.burn ?? 0) / 60);
    return `${e?.fuel ? `${e.fuel.count} fuel in the firebox` : 'No fuel in the firebox'}${e?.burn > 0 ? `, ${mins} minute${mins > 1 ? 's' : ''} of steam left` : ''}`;
  }

  // ---------- observers and gauges ----------

  // Does the block at (x, y, z) hold anything (or, `full`, is it full)?
  holds(world, stations, x, y, z, full) {
    const id = world.get(x, y, z), def = BLOCKS[id];
    if (!def) return false;
    if (def.stationBase === CAULDRON) return full ? def.water >= 3 : def.water > 0;
    if (def.hive >= 0) return full ? def.hive >= (def.apiary ? 5 : MAX_HONEY) : def.hive > 0;
    if (def.tank) { const t = this.tanks.get(key(x, y, z)); return full ? (t?.amount ?? 0) >= TANK_CAP : (t?.amount ?? 0) > 0; }
    if (def.engine) { const e = this.engines.get(key(x, y, z)); return full ? (e?.fuel?.count ?? 0) >= maxStack(e?.fuel?.id ?? 0) : !!e?.fuel; }
    if (def.rail?.loader) {
      const cart = this.carts?.storageAt(x, y, z);
      return !!cart && (full ? cart.store.inputs.every((s) => s && s.count >= maxStack(s.id)) : cart.store.inputs.some(Boolean));
    }
    const kind = stationKind(id);
    if (!kind) return false;
    const st = stations.get(x, y, z, kind);
    const slots = [...st.inputs, ...(STATION_KINDS[kind].storage ? [] : [st.out])];
    return full ? st.inputs.every((s) => s && s.count >= maxStack(s.id)) : slots.some(Boolean);
  }

  tickSensors(dt, world, stations, sensors) {
    for (const [k, t] of this.pulses) {
      if (t - dt > 0) { this.pulses.set(k, t - dt); continue; }
      this.pulses.delete(k);
      const [x, y, z] = unkey(k);
      const ps = BLOCKS[world.get(x, y, z)]?.sensor;
      if (ps === 'observer' || ps === 'counter') this.onSwitch?.(x, y, z, false);
    }
    if ((this.sensorTimer -= dt) > 0) return;
    this.sensorTimer = 0.1;
    for (const [x, y, z, def] of sensors) {
      const [dx, dz] = FACING_DIRS[def.facing];
      const fx = x + dx, fz = z + dz, k = key(x, y, z);
      if (def.sensor === 'observer') {
        const now = world.get(fx, y, fz), was = this.seen.get(k);
        this.seen.set(k, now);
        if (was !== undefined && was !== now && !this.pulses.has(k)) { this.pulses.set(k, PULSE); this.onSwitch?.(x, y, z, true); }
      } else if (def.sensor === 'counter') {
        continue; // (it pulses as things go through it)
      } else if (def.sensor === 'meter') {
        // a power meter signals while its grid is short of power (or, set to, while there's some to spare)
        const want = this.meterSpare.has(k) ? !!this.electric?.spareAt(x, y, z) : !!this.electric?.shortAt(x, y, z);
        if (want !== def.on) this.onSwitch?.(x, y, z, want);
      } else if (def.sensor === 'daylight') {
        // a daylight sensor signals at night (or, set to, by day); under a roof it's always night
        const day = (this.daylight?.() ?? 1) > 0.45 && world.skyAt(x, y, z) >= 12;
        const want = this.dayInvert.has(k) ? day : !day;
        if (want !== def.on) this.onSwitch?.(x, y, z, want);
      } else if (def.sensor === 'farm') {
        // a farm controller signals once half the wheat around it is ripe
        const r = this.farmReport(world, x, y, z);
        const want = r.ripe > 0 && r.ripe * 2 >= r.total;
        if (want !== def.on) this.onSwitch?.(x, y, z, want);
      } else if (def.sensor === 'tacho') {
        // a tachometer signals while its network is stopped or overloaded
        const want = !(this.kinetics?.powerAt(x, y, z) > 0);
        if (want !== def.on) this.onSwitch?.(x, y, z, want);
      } else {
        const want = this.holds(world, stations, fx, y, fz, this.gaugeFull.has(k));
        if (want !== def.on) this.onSwitch?.(x, y, z, want);
      }
    }
  }

  // Tapping a gauge switches it between "anything in it" and "full".
  toggleGauge(x, y, z) {
    const k = key(x, y, z);
    if (this.gaugeFull.has(k)) this.gaugeFull.delete(k); else this.gaugeFull.add(k);
    return this.gaugeFull.has(k);
  }

  tickBelts(dt, world, kinetics, stations, light) {
    for (const [k, items] of this.belts) {
      const [x, y, z] = unkey(k);
      if (!world.chunkAt(x, z)) continue;
      const def = BLOCKS[world.get(x, y, z)];
      if (!def?.belt) { for (const it of items) this.dropSprite(it); this.belts.delete(k); continue; }
      const [dx, , dz] = pointing(def);
      const speed = kinetics.powerAt(x, y, z);
      for (let i = 0; i < items.length; i++) {
        const limit = i === 0 ? 1 : items[i - 1].t - BELT_GAP;
        items[i].t = Math.max(items[i].t, Math.min(limit, items[i].t + dt * speed * BELT_SPEED));
      }
      // passing over a hopper: it drops in, if the hopper (and whatever it feeds) will take it
      if (speed > 0 && BLOCKS[world.get(x, y - 1, z)]?.hopper) {
        for (let i = items.length - 1; i >= 0; i--) {
          const it = items[i];
          if (it.offered || it.t < 0.5) continue;
          it.offered = true;
          if (this.insert(world, stations, x, y - 1, z, it, 1, false)) { this.dropSprite(it); items.splice(i, 1); }
        }
        if (!items.length) { this.belts.delete(k); continue; }
      }
      // at the end: on to the next belt, or into whatever it points at (or off to the side)
      if (items.length && items[0].t >= 1 && speed > 0) {
        const outs = this.beltOuts(world, x, y, z, def, items[0].id);
        const i = outs.findIndex(([ox, oz]) => this.insert(world, stations, ox, y, oz, items[0], 1, false, 0, [ox - x, 0, oz - z]));
        if (i >= 0) {
          if (def.sorts === 'split') this.split.set(k, (outs[i][2] + 1) % 2);
          this.dropSprite(items.shift());
          if (!items.length) this.belts.delete(k);
        }
      }
      // draw them, lit like the belt
      const sun = light.day * skyBrightness(world.skyAt(x, y, z));
      const t = lightBrightness(world.lightAt(x, y, z)) * light.flicker;
      for (const it of items) {
        if (!it.sprite) it.sprite = this.makeSprite(it.id);
        it.sprite.position.set(x + 0.5 + dx * (it.t - 0.5), y + 0.45, z + 0.5 + dz * (it.t - 0.5));
        it.sprite.material.color.setRGB(Math.max(sun, t, light.ambient), Math.max(sun, t * 0.86, light.ambient), Math.max(sun, t * 0.66, light.ambient));
      }
    }
  }

  // Where the front thing on a belt can go next, in the order to try: [[x, z, side], ...].
  beltOuts(world, x, y, z, def, id) {
    const f = def.facing, step = (g) => [x + FACING_DIRS[g][0], z + FACING_DIRS[g][1]];
    const left = (f + 3) % 4, right = (f + 1) % 4;
    if (def.sorts === 'split') {
      const first = this.split.get(key(x, y, z)) ?? 0;
      const sides = [[...step(left), 0], [...step(right), 1]];
      return first ? [sides[1], sides[0]] : sides;
    }
    if (def.sorts === 'sort') {
      const filter = this.frames?.around(world, x, y, z) ?? [];
      return filter.includes(id) ? [[...step(left), 0]] : [[...step(f), 0]];
    }
    return [[...step(f), 0]];
  }

  // ---------- v25: farm controllers and pneumatic tubes ----------

  // The wheat within FARM_REACH blocks of a farm controller (counted at most once a second): { total, ripe, growing }.
  farmReport(world, x, y, z) {
    const k = key(x, y, z), now = performance.now();
    this.farmCache ??= new Map();
    const c = this.farmCache.get(k);
    if (c && now - c.t < 1000) return c;
    let total = 0, ripe = 0;
    for (let dy = -2; dy <= 2; dy++) for (let dz = -FARM_REACH; dz <= FARM_REACH; dz++) for (let dx = -FARM_REACH; dx <= FARM_REACH; dx++) {
      const id = world.get(x + dx, y + dy, z + dz);
      if (!isWheat(id)) continue;
      total++;
      if (id === WHEAT_3) ripe++;
    }
    const r = { t: now, total, ripe, growing: total - ripe };
    this.farmCache.set(k, r);
    return r;
  }

  // Something put into a pneumatic tube at (x, y, z) (coming from (x, y, z) - dir) shoots through the tubes joined
  // to it to the nearest chest, machine or belt at the far end that will take it. It arrives at once (the little
  // icon that flies along the tubes is just for show). Returns how many went.
  intoTube(world, stations, x, y, z, item, n, depth, dir) {
    const id = idOf(item);
    const src = dir ? key(x - dir[0], y - dir[1], z - dir[2]) : null;
    const prev = new Map([[key(x, y, z), null]]), queue = [[x, y, z]];
    const D6 = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
    for (let qi = 0; qi < queue.length && queue.length < 256; qi++) {
      const [tx, ty, tz] = queue[qi];
      // a tube with item frames on it only lets out the things they show
      const filter = this.frames?.around(world, tx, ty, tz);
      for (const [ex, ey, ez] of D6) {
        const ox = tx + ex, oy = ty + ey, oz = tz + ez, ok = key(ox, oy, oz);
        if (prev.has(ok) || ok === src) continue;
        const def = BLOCKS[world.get(ox, oy, oz)];
        if (!def) continue;
        if (def.tube) { prev.set(ok, key(tx, ty, tz)); queue.push([ox, oy, oz]); continue; }
        if (def.hopper || def.crossing || (filter?.length && !filter.includes(id))) continue;
        if (!stationKind(world.get(ox, oy, oz)) && !def.belt && !def.elevator && !def.rail?.loader) continue;
        const k = this.insert(world, stations, ox, oy, oz, item, n, false, depth + 1, [ex, ey, ez]);
        if (k <= 0) continue;
        // show it flying along the tubes
        const path = [[ox, oy, oz]];
        for (let at = key(tx, ty, tz); at; at = prev.get(at)) path.unshift(unkey(at));
        if (this.tubeFx.length < 40) this.tubeFx.push({ id, path, d: 0, sprite: null });
        return k;
      }
    }
    return 0;
  }

  tickTubes(dt) {
    for (let i = this.tubeFx.length - 1; i >= 0; i--) {
      const f = this.tubeFx[i];
      f.d += dt * 12;
      if (f.d >= f.path.length - 1) { this.dropSprite(f); this.tubeFx.splice(i, 1); continue; }
      if (!f.sprite) { f.sprite = this.makeSprite(f.id); f.sprite.scale.setScalar(0.3); }
      const j = Math.floor(f.d), u = f.d - j, a = f.path[j], b = f.path[j + 1];
      f.sprite.position.set(a[0] + 0.5 + (b[0] - a[0]) * u, a[1] + 0.5 + (b[1] - a[1]) * u, a[2] + 0.5 + (b[2] - a[2]) * u);
    }
  }

  makeSprite(id) {
    let tex = this.textures.get(id);
    if (!tex) {
      tex = new THREE.TextureLoader().load(this.icons[id] ?? '');
      tex.magFilter = THREE.NearestFilter; tex.minFilter = THREE.NearestFilter; tex.colorSpace = THREE.SRGBColorSpace;
      this.textures.set(id, tex);
    }
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, alphaTest: 0.5 }));
    s.scale.setScalar(0.42);
    this.scene.add(s);
    return s;
  }

  dropSprite(it) {
    if (!it?.sprite) return;
    this.scene.remove(it.sprite);
    it.sprite.material.dispose();
    it.sprite = null;
  }

  // A machine was broken: what was on it or held in it comes back, as [[id, n, state], ...].
  removeAt(x, y, z) {
    const k = key(x, y, z), out = [];
    for (const it of this.belts.get(k) ?? []) { out.push([it.id, 1, stateOf(it)]); this.dropSprite(it); }
    this.belts.delete(k);
    for (const [id, n] of this.drills.get(k)?.held ?? []) out.push([id, n]);
    this.drills.delete(k);
    const e = this.engines.get(k);
    if (e?.fuel) out.push([e.fuel.id, e.fuel.count]);
    this.engines.delete(k);
    this.gaugeFull.delete(k);
    this.seen.delete(k);
    this.ejectors.delete(k); this.ejectStacks.delete(k); this.split.delete(k); this.tanks.delete(k);
    for (const [id, n] of this.quarries.get(k)?.held ?? []) out.push([id, n]);
    this.quarries.delete(k); this.spawners.delete(k); this.counts.delete(k); this.counterN.delete(k);
    this.meterSpare.delete(k); this.dayInvert.delete(k); this.progIndex.delete(k);
    if (this.pads.has(k)) {
      // its partner waits for a new one
      const p = this.pads.get(k);
      this.pads.delete(k);
      if (p && this.pads.get(p) === k) this.pads.set(p, null);
    }
    if (BLOCKS[this.world?.get(x, y, z)]?.elevator) {
      // the column it was part of: what it holds comes back
      for (const [lk, items] of this.lifts) {
        const [lx, ly, lz] = unkey(lk);
        if (lx !== x || lz !== z || ly > y) continue;
        let joined = true;
        for (let cy = ly; cy < y && joined; cy++) joined = !!BLOCKS[this.world.get(x, cy, z)]?.elevator;
        if (!joined) continue;
        for (const it of items) { out.push([it.id, 1, stateOf(it)]); this.dropSprite(it); }
        this.lifts.delete(lk);
      }
    }
    return out;
  }

  // What a drill is doing, for a toast when you tap it.
  drillStatus(x, y, z) { return this.drills.get(key(x, y, z))?.status || 'Not turning'; }

  serialize() {
    return {
      belts: [...this.belts].map(([k, items]) => [k, items.map((it) => [it.id, it.t, ...(stateOf(it) ? [stateOf(it)] : [])])]),
      spoutWater: [...this.spoutWater].map(([k, l]) => (l === WATER ? k : [k, l])),
      drills: [...this.drills].filter(([, d]) => d.held.length).map(([k, d]) => [k, d.held]),
      engines: [...this.engines].filter(([, e]) => e.fuel || e.burn > 0).map(([k, e]) => [k, +e.burn.toFixed(1), e.fuel ? [e.fuel.id, e.fuel.count] : 0]),
      gaugeFull: [...this.gaugeFull],
      ejectStacks: [...this.ejectStacks],
      tanks: [...this.tanks].filter(([, t]) => t.amount > 0).map(([k, t]) => [k, t.liquid, +t.amount.toFixed(2)]),
      lifts: [...this.lifts].map(([k, items]) => [k, items.map((it) => [it.id, +it.h.toFixed(2), ...(stateOf(it) ? [stateOf(it)] : [])])]),
      counters: [...new Set([...this.counts.keys(), ...this.counterN.keys()])].map((k) => [k, this.counts.get(k) ?? 0, this.counterN.get(k) ?? 8]),
      meterSpare: [...this.meterSpare],
      dayInvert: [...this.dayInvert],
      quarries: [...this.quarries].map(([k, q]) => [k, q.i, q.y, q.done ? 1 : 0, q.held]),
      pads: [...this.pads],
      progIndex: [...this.progIndex].map(([k, p]) => [k, p.i, p.sig ? 1 : 0]),
    };
  }

  load(o) {
    this.clear();
    for (const [k, items] of o?.belts ?? []) {
      if (typeof k === 'string' && Array.isArray(items)) this.belts.set(k, items.filter((it) => it?.[0] > 0).map(([id, t, st]) => ({ id, t: Math.min(1, Math.max(0, +t || 0)), sprite: null, ...cleanState(st) })));
    }
    for (const k of o?.spoutWater ?? []) {
      if (typeof k === 'string') this.spoutWater.set(k, WATER);
      else if (Array.isArray(k) && typeof k[0] === 'string' && (k[1] === WATER || k[1] === LAVA)) this.spoutWater.set(k[0], k[1]);
    }
    for (const [k, burn, fuel] of o?.engines ?? []) {
      if (typeof k !== 'string') continue;
      this.engines.set(k, { burn: Math.max(0, +burn || 0), fuel: Array.isArray(fuel) && fuel[0] > 0 && fuel[1] > 0 ? { id: fuel[0], count: fuel[1] } : null });
    }
    for (const k of o?.gaugeFull ?? []) if (typeof k === 'string') this.gaugeFull.add(k);
    for (const k of o?.ejectStacks ?? []) if (typeof k === 'string') this.ejectStacks.add(k);
    for (const [k, liquid, amount] of o?.tanks ?? []) {
      if (typeof k === 'string' && (liquid === WATER || liquid === LAVA)) this.tanks.set(k, { liquid, amount: Math.min(TANK_CAP, Math.max(0, +amount || 0)) });
    }
    for (const [k, items] of o?.lifts ?? []) {
      if (typeof k === 'string' && Array.isArray(items)) this.lifts.set(k, items.filter((it) => it?.[0] > 0).map(([id, h, st]) => ({ id, h: Math.max(0, +h || 0), sprite: null, ...cleanState(st) })));
    }
    for (const [k, c, n] of o?.counters ?? []) {
      if (typeof k !== 'string') continue;
      if (COUNTER_STEPS.includes(n)) this.counterN.set(k, n);
      if (c > 0) this.counts.set(k, c | 0);
    }
    for (const k of o?.meterSpare ?? []) if (typeof k === 'string') this.meterSpare.add(k);
    for (const k of o?.dayInvert ?? []) if (typeof k === 'string') this.dayInvert.add(k);
    for (const [k, i, y, done, held] of o?.quarries ?? []) {
      if (typeof k !== 'string') continue;
      this.quarries.set(k, { i: Math.max(0, i | 0), y: y | 0, done: !!done, progress: 0, status: '', held: Array.isArray(held) ? held.filter((h) => h?.[0] > 0 && h[1] > 0) : [] });
    }
    for (const [k, p] of o?.pads ?? []) if (typeof k === 'string' && (p === null || typeof p === 'string')) this.pads.set(k, p);
    for (const [k, i, sig] of o?.progIndex ?? []) if (typeof k === 'string') this.progIndex.set(k, { i: Math.max(0, i | 0), sig: !!sig });
    for (const [k, held] of o?.drills ?? []) {
      if (typeof k === 'string' && Array.isArray(held)) this.drills.set(k, { progress: 0, target: '', held: held.filter((h) => h?.[0] > 0 && h[1] > 0), status: '' });
    }
  }
}
