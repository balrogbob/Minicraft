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
//  - A harvester reaps the ripe crops in front of it and passes them back, like a drill.
//  - A steam engine burns the fuel put into it while there's water beside it, and drives shafts.
//  - Observers and storage gauges watch the block in front of them and switch on (see onSwitch).
//  - An ejector throws what's in the chest or machine behind it out onto the ground, while it's signalled.
//  - A collector is a hopper that also pulls in loose things lying near it.
//  - Splitting belts send things left and right in turn; sorting belts send what matches their frames left.
//  - A bucket elevator, while driven, lifts what's put into it up its column and out of the top.
import * as THREE from 'three';
import {
  BLOCKS, AIR, WATER, LAVA, PIPE, PUMP, SPOUT, DRILL, FILAMENT_LAMP, BELT, FACING_DIRS, TOOL_MATERIALS,
  metalTool, maxStack, dropsFor, isFlowing, stationKind, CAULDRON, WHEAT_0, WHEAT_3, SEEDS, BERRY_BUSH, BERRIES, SUGAR_CANE,
  STEAM_ENGINE, MAX_HONEY,
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

// The way a drill, hopper or belt points: [dx, dy, dz].
export function pointing(def) {
  if (def.down) return [0, -1, 0];
  const [dx, dz] = FACING_DIRS[def.facing];
  return [dx, 0, dz];
}

// Put up to n of an item into a list of slots: onto matching stacks first, then empty slots.
// Returns how many went in.
function addToSlots(slots, id, n) {
  let left = n;
  for (const s of slots) {
    if (!left) break;
    if (s && s.id === id && s.count < maxStack(id)) { const k = Math.min(left, maxStack(id) - s.count); s.count += k; left -= k; }
  }
  for (let i = 0; i < slots.length && left; i++) {
    if (!slots[i]) { const k = Math.min(left, maxStack(id)); slots[i] = { id, count: k }; left -= k; }
  }
  return n - left;
}

export class Machines {
  constructor(scene, icons) {
    this.scene = scene;
    this.icons = icons;
    this.belts = new Map(); // "x,y,z" -> [{ id, t, sprite }], front first (t from 0 at the start to 1 at the end)
    this.spoutWater = new Map(); // cells holding water (or lava) poured by a spout -> which
    this.drills = new Map(); // "x,y,z" -> { progress, target: "x,y,z", held: [[id, n]], status } (harvesters too)
    this.engines = new Map(); // "x,y,z" -> { burn: seconds left, fuel: { id, count } | null }
    this.seen = new Map(); // observer "x,y,z" -> the block it last saw in front of it
    this.pulses = new Map(); // observer "x,y,z" -> seconds left of its signal
    this.gaugeFull = new Set(); // gauges set to signal only when what they watch is full
    this.ejectors = new Map(); // "x,y,z" -> { t: seconds to the next throw, sig: signalled last time }
    this.ejectStacks = new Set(); // ejectors set to throw a whole stack each time their signal comes on
    this.split = new Map(); // splitting belt "x,y,z" -> which side the next thing goes (0 left, 1 right)
    this.lifts = new Map(); // bucket elevator column, by its bottom "x,y,z" -> [{ id, h, sprite }] (h: height climbed)
    this.sensorTimer = 0;
    this.world = null;
    this.hopperTimer = 0;
    this.pumpTimer = 0;
    this.textures = new Map();
  }

  clear() {
    for (const items of this.belts.values()) for (const it of items) this.dropSprite(it);
    this.belts.clear();
    this.spoutWater.clear();
    this.drills.clear();
    this.engines.clear();
    this.seen.clear();
    this.pulses.clear();
    this.gaugeFull.clear();
    this.ejectors.clear(); this.ejectStacks.clear(); this.split.clear();
    for (const items of this.lifts.values()) for (const it of items) this.dropSprite(it);
    this.lifts.clear();
  }

  // ---------- putting things into blocks ----------

  // Put n of an item into the block at (x, y, z): a chest, a machine (as an ingredient, or as fuel when
  // `fuel` and it burns), a hopper (passed straight on) or a belt (one at a time). Returns how many went in.
  insert(world, stations, x, y, z, id, n, fuel = false, depth = 0) {
    const bid = world.get(x, y, z), def = BLOCKS[bid];
    if (!def || depth > 6) return 0;
    const kind = stationKind(bid);
    if (kind) {
      const K = STATION_KINDS[kind];
      const st = stations.get(x, y, z, kind);
      if (fuel && !K.storage && !K.powered && !K.crafter && isFuel(id)) {
        if (!st.fuel) { const k = Math.min(n, maxStack(id)); st.fuel = { id, count: k }; return k; }
        if (st.fuel.id !== id) return 0;
        const k = Math.min(n, maxStack(id) - st.fuel.count);
        st.fuel.count += k;
        return k;
      }
      return addToSlots(st.inputs, id, n);
    }
    if (def.rail?.loader) {
      // a storage cart waiting on a loader rail
      const cart = this.carts?.storageAt(x, y, z);
      if (!cart) return 0;
      const k = addToSlots(cart.store.inputs, id, n);
      if (k) this.carts.busy(cart);
      return k;
    }
    if (def.hopper) {
      // a sorting hopper (one with item frames on it) only takes what matches a frame
      const filter = this.frames?.around(world, x, y, z);
      if (filter?.length && !filter.includes(id)) return 0;
      const [dx, dy, dz] = pointing(def);
      return this.insert(world, stations, x + dx, y + dy, z + dz, id, n, !def.down, depth + 1);
    }
    if (def.engine) {
      if (!isFuel(id)) return 0;
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
      items.push({ id, h, sprite: null });
      items.sort((a, b) => b.h - a.h);
      this.lifts.set(k, items);
      return 1;
    }
    if (def.belt) {
      const items = this.belts.get(key(x, y, z)) ?? [];
      const last = items[items.length - 1];
      if (last && last.t < BELT_GAP) return 0;
      items.push({ id, t: 0, sprite: null });
      this.belts.set(key(x, y, z), items);
      return 1;
    }
    return 0;
  }

  // Take one thing out of the chest or machine at (x, y, z) for a hopper below it: a chest's first
  // stack, or a machine's output. Returns the id taken, or 0 (`peek` only looks).
  takeOne(world, stations, x, y, z, peek = false, filter = null) {
    const ok = (s) => s && (!filter?.length || filter.includes(s.id));
    if (BLOCKS[world.get(x, y, z)]?.rail?.loader) {
      const cart = this.carts?.storageAt(x, y, z);
      const i = cart ? cart.store.inputs.findIndex(ok) : -1;
      if (i < 0) return 0;
      const id = cart.store.inputs[i].id;
      if (!peek) { if (!--cart.store.inputs[i].count) cart.store.inputs[i] = null; this.carts.busy(cart); }
      return id;
    }
    const kind = stationKind(world.get(x, y, z));
    if (!kind) return 0;
    const st = stations.get(x, y, z, kind);
    if (STATION_KINDS[kind].storage) {
      const i = st.inputs.findIndex(ok);
      if (i < 0) return 0;
      const id = st.inputs[i].id;
      if (!peek && !--st.inputs[i].count) st.inputs[i] = null;
      return id;
    }
    if (!ok(st.out)) return 0;
    const id = st.out.id;
    if (!peek && !--st.out.count) st.out = null;
    return id;
  }

  // ---------- each frame ----------

  tick(dt, world, kinetics, stations, light) {
    // gather the machines in the loaded world
    this.world = world; this.kinetics = kinetics;
    const pumps = [], drills = [], lamps = [], hoppers = [], sensors = [], harvesters = [], engines = [], ejectors = [], collectors = [];
    for (const c of world.chunks.values()) {
      for (const li of c.machines) {
        const id = c.data[li], def = BLOCKS[id];
        const x = c.cx * CHUNK + (li & 15), z = c.cz * CHUNK + ((li >> 4) & 15), y = li >> 8;
        if (id === PUMP) pumps.push([x, y, z]);
        else if (def.machine && id >= DRILL && id <= DRILL + 4) drills.push([x, y, z, def]);
        else if (id === FILAMENT_LAMP || id === FILAMENT_LAMP + 1) lamps.push([x, y, z, id]);
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
    if ((this.pumpTimer -= dt) <= 0) { this.pumpTimer = 0.5; this.tickPumps(world, kinetics, pumps); }
    for (const d of drills) this.tickDrill(dt, world, kinetics, stations, d);
    for (const h of harvesters) this.tickHarvester(dt, world, kinetics, stations, h);
    for (const e of engines) this.tickEngine(dt, world, e);
    this.tickSensors(dt, world, stations, sensors);
    if ((this.hopperTimer -= dt) <= 0) {
      this.hopperTimer = HOPPER_EVERY;
      for (const [x, y, z, def] of hoppers) {
        const filter = this.frames?.around(world, x, y, z);
        const id = this.takeOne(world, stations, x, y + 1, z, true, filter);
        if (!id) continue;
        const [dx, dy, dz] = pointing(def);
        if (this.insert(world, stations, x + dx, y + dy, z + dz, id, 1, !def.down)) this.takeOne(world, stations, x, y + 1, z, false, filter);
      }
    }
    this.tickBelts(dt, world, kinetics, stations, light);
    this.tickLifts(dt, world, kinetics, stations, light);
    for (const e of ejectors) this.tickEjector(dt, world, stations, e);
    if (collectors.length) this.tickCollectors(dt, world, stations, collectors);
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
    const id = this.takeOne(world, stations, bx, y, bz, true);
    if (!id) return;
    let n = 0;
    const most = stack ? maxStack(id) : 1;
    while (n < most && this.takeOne(world, stations, bx, y, bz, true) === id) { this.takeOne(world, stations, bx, y, bz); n++; }
    this.throwItem?.({ id, count: n }, { x: x + 0.5 + dx * 0.7, y: y + 0.35, z: z + 0.5 + dz * 0.7 }, { x: dx * 4, y: 2, z: dz * 4 });
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
      if (it.age < it.delay || it.stack.wear || it.stack.ench?.length || (it.noCollect -= dt) > 0) continue;
      let best = null, bd = Infinity;
      for (const c of collectors) {
        const cx = c[0] + 0.5, cy = c[1] + 1, cz = c[2] + 0.5;
        const d = Math.hypot(it.pos.x - cx, it.pos.y - cy, it.pos.z - cz);
        if (d < bd && d <= COLLECT_REACH + 0.5 && it.pos.y > c[1] - 1.5) { bd = d; best = c; }
      }
      if (!best) continue;
      const [x, y, z] = best;
      if (bd < 0.9) {
        const took = this.insert(world, stations, x, y, z, it.stack.id, it.stack.count, false);
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
        for (const it of items) { this.dropSprite(it); this.throwItem?.({ id: it.id, count: 1 }, { x: x + 0.5, y: y + it.h + 0.5, z: z + 0.5 }, { x: 0, y: 1, z: 0 }); }
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
        const out = above === 0 ? (this.throwItem?.({ id: it.id, count: 1 }, { x: x + 0.5, y: top + 0.1, z: z + 0.5 }, { x: 0, y: 2.5, z: 0 }), 1)
          : this.insert(world, stations, x, top, z, it.id, 1, false);
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

  tickPumps(world, kinetics, pumps) {
    const active = new Map(); // cell below a spout -> WATER or LAVA
    for (const [x, y, z] of pumps) {
      if (kinetics.powerAt(x, y, z) <= 0) continue;
      const near = SIDES6.map(([dx, dy, dz]) => world.get(x + dx, y + dy, z + dz));
      const liquid = near.includes(WATER) ? WATER : near.includes(LAVA) ? LAVA : 0;
      if (!liquid) continue;
      // follow the pipes from the pump; spouts touching any of them pour
      const seen = new Set([key(x, y, z)]);
      const queue = [[x, y, z]];
      while (queue.length && seen.size < 512) {
        const [px, py, pz] = queue.shift();
        for (const [dx, dy, dz] of SIDES6) {
          const nx = px + dx, ny = py + dy, nz = pz + dz, k = key(nx, ny, nz);
          if (seen.has(k)) continue;
          const id = world.get(nx, ny, nz);
          if (id === PIPE) { seen.add(k); queue.push([nx, ny, nz]); } else if (id === SPOUT) { seen.add(k); if (!active.has(key(nx, ny - 1, nz))) active.set(key(nx, ny - 1, nz), liquid); }
        }
      }
    }
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
      const put = this.insert(world, stations, x - dx, y - dy, z - dz, id, n, false);
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
      const put = this.insert(world, stations, x - dx, y, z - dz, id, n, false);
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
    if (def.hive >= 0) return full ? def.hive >= MAX_HONEY : def.hive > 0;
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
      if (BLOCKS[world.get(x, y, z)]?.sensor === 'observer') this.onSwitch?.(x, y, z, false);
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
          if (this.insert(world, stations, x, y - 1, z, it.id, 1, false)) { this.dropSprite(it); items.splice(i, 1); }
        }
        if (!items.length) { this.belts.delete(k); continue; }
      }
      // at the end: on to the next belt, or into whatever it points at (or off to the side)
      if (items.length && items[0].t >= 1 && speed > 0) {
        const outs = this.beltOuts(world, x, y, z, def, items[0].id);
        const i = outs.findIndex(([ox, oz]) => this.insert(world, stations, ox, y, oz, items[0].id, 1, false));
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

  // A machine was broken: what was on it or held in it comes back, as [[id, n], ...].
  removeAt(x, y, z) {
    const k = key(x, y, z), out = [];
    for (const it of this.belts.get(k) ?? []) { out.push([it.id, 1]); this.dropSprite(it); }
    this.belts.delete(k);
    for (const [id, n] of this.drills.get(k)?.held ?? []) out.push([id, n]);
    this.drills.delete(k);
    const e = this.engines.get(k);
    if (e?.fuel) out.push([e.fuel.id, e.fuel.count]);
    this.engines.delete(k);
    this.gaugeFull.delete(k);
    this.seen.delete(k);
    this.ejectors.delete(k); this.ejectStacks.delete(k); this.split.delete(k);
    if (BLOCKS[this.world?.get(x, y, z)]?.elevator) {
      // the column it was part of: what it holds comes back
      for (const [lk, items] of this.lifts) {
        const [lx, ly, lz] = unkey(lk);
        if (lx !== x || lz !== z || ly > y) continue;
        let joined = true;
        for (let cy = ly; cy < y && joined; cy++) joined = !!BLOCKS[this.world.get(x, cy, z)]?.elevator;
        if (!joined) continue;
        for (const it of items) { out.push([it.id, 1]); this.dropSprite(it); }
        this.lifts.delete(lk);
      }
    }
    return out;
  }

  // What a drill is doing, for a toast when you tap it.
  drillStatus(x, y, z) { return this.drills.get(key(x, y, z))?.status || 'Not turning'; }

  serialize() {
    return {
      belts: [...this.belts].map(([k, items]) => [k, items.map((it) => [it.id, it.t])]),
      spoutWater: [...this.spoutWater].map(([k, l]) => (l === WATER ? k : [k, l])),
      drills: [...this.drills].filter(([, d]) => d.held.length).map(([k, d]) => [k, d.held]),
      engines: [...this.engines].filter(([, e]) => e.fuel || e.burn > 0).map(([k, e]) => [k, +e.burn.toFixed(1), e.fuel ? [e.fuel.id, e.fuel.count] : 0]),
      gaugeFull: [...this.gaugeFull],
      ejectStacks: [...this.ejectStacks],
      lifts: [...this.lifts].map(([k, items]) => [k, items.map((it) => [it.id, +it.h.toFixed(2)])]),
    };
  }

  load(o) {
    this.clear();
    for (const [k, items] of o?.belts ?? []) {
      if (typeof k === 'string' && Array.isArray(items)) this.belts.set(k, items.filter((it) => it?.[0] > 0).map(([id, t]) => ({ id, t: Math.min(1, Math.max(0, +t || 0)), sprite: null })));
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
    for (const [k, items] of o?.lifts ?? []) {
      if (typeof k === 'string' && Array.isArray(items)) this.lifts.set(k, items.filter((it) => it?.[0] > 0).map(([id, h]) => ({ id, h: Math.max(0, +h || 0), sprite: null })));
    }
    for (const [k, held] of o?.drills ?? []) {
      if (typeof k === 'string' && Array.isArray(held)) this.drills.set(k, { progress: 0, target: '', held: held.filter((h) => h?.[0] > 0 && h[1] > 0), status: '' });
    }
  }
}
