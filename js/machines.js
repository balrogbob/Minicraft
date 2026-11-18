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
import * as THREE from 'three';
import {
  BLOCKS, AIR, WATER, PIPE, PUMP, SPOUT, DRILL, FILAMENT_LAMP, BELT, FACING_DIRS, TOOL_MATERIALS,
  metalTool, maxStack, dropsFor, isFlowing, stationKind,
} from './blocks.js';
import { STATION_KINDS, isFuel } from './stations.js';
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
    this.spoutWater = new Set(); // cells holding water poured by a spout
    this.drills = new Map(); // "x,y,z" -> { progress, target: "x,y,z", held: [[id, n]], status }
    this.hopperTimer = 0;
    this.pumpTimer = 0;
    this.textures = new Map();
  }

  clear() {
    for (const items of this.belts.values()) for (const it of items) this.dropSprite(it);
    this.belts.clear();
    this.spoutWater.clear();
    this.drills.clear();
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
      if (fuel && !K.storage && !K.powered && isFuel(id)) {
        if (!st.fuel) { const k = Math.min(n, maxStack(id)); st.fuel = { id, count: k }; return k; }
        if (st.fuel.id !== id) return 0;
        const k = Math.min(n, maxStack(id) - st.fuel.count);
        st.fuel.count += k;
        return k;
      }
      return addToSlots(st.inputs, id, n);
    }
    if (def.hopper) {
      const [dx, dy, dz] = pointing(def);
      return this.insert(world, stations, x + dx, y + dy, z + dz, id, n, !def.down, depth + 1);
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
  takeOne(world, stations, x, y, z, peek = false) {
    const kind = stationKind(world.get(x, y, z));
    if (!kind) return 0;
    const st = stations.get(x, y, z, kind);
    if (STATION_KINDS[kind].storage) {
      const i = st.inputs.findIndex(Boolean);
      if (i < 0) return 0;
      const id = st.inputs[i].id;
      if (!peek && !--st.inputs[i].count) st.inputs[i] = null;
      return id;
    }
    if (!st.out) return 0;
    const id = st.out.id;
    if (!peek && !--st.out.count) st.out = null;
    return id;
  }

  // ---------- each frame ----------

  tick(dt, world, kinetics, stations, light) {
    // gather the machines in the loaded world
    const pumps = [], drills = [], lamps = [], hoppers = [];
    for (const c of world.chunks.values()) {
      for (const li of c.machines) {
        const id = c.data[li], def = BLOCKS[id];
        const x = c.cx * CHUNK + (li & 15), z = c.cz * CHUNK + ((li >> 4) & 15), y = li >> 8;
        if (id === PUMP) pumps.push([x, y, z]);
        else if (def.machine && id >= DRILL && id <= DRILL + 4) drills.push([x, y, z, def]);
        else if (id === FILAMENT_LAMP || id === FILAMENT_LAMP + 1) lamps.push([x, y, z, id]);
        else if (def.hopper) hoppers.push([x, y, z, def]);
      }
    }
    for (const [x, y, z, id] of lamps) {
      const lit = kinetics.powerAt(x, y, z) > 0;
      if (lit !== (id === FILAMENT_LAMP + 1)) world.setBlock(x, y, z, FILAMENT_LAMP + (lit ? 1 : 0));
    }
    if ((this.pumpTimer -= dt) <= 0) { this.pumpTimer = 0.5; this.tickPumps(world, kinetics, pumps); }
    for (const d of drills) this.tickDrill(dt, world, kinetics, stations, d);
    if ((this.hopperTimer -= dt) <= 0) {
      this.hopperTimer = HOPPER_EVERY;
      for (const [x, y, z, def] of hoppers) {
        if (!this.takeOne(world, stations, x, y + 1, z, true)) continue;
        const [dx, dy, dz] = pointing(def);
        const id = this.takeOne(world, stations, x, y + 1, z, true);
        if (this.insert(world, stations, x + dx, y + dy, z + dz, id, 1, !def.down)) this.takeOne(world, stations, x, y + 1, z);
      }
    }
    this.tickBelts(dt, world, kinetics, stations, light);
  }

  tickPumps(world, kinetics, pumps) {
    const active = new Set();
    for (const [x, y, z] of pumps) {
      if (kinetics.powerAt(x, y, z) <= 0) continue;
      if (!SIDES6.some(([dx, dy, dz]) => world.get(x + dx, y + dy, z + dz) === WATER)) continue;
      // follow the pipes from the pump; spouts touching any of them pour
      const seen = new Set([key(x, y, z)]);
      const queue = [[x, y, z]];
      while (queue.length && seen.size < 512) {
        const [px, py, pz] = queue.shift();
        for (const [dx, dy, dz] of SIDES6) {
          const nx = px + dx, ny = py + dy, nz = pz + dz, k = key(nx, ny, nz);
          if (seen.has(k)) continue;
          const id = world.get(nx, ny, nz);
          if (id === PIPE) { seen.add(k); queue.push([nx, ny, nz]); } else if (id === SPOUT) { seen.add(k); active.add(key(nx, ny - 1, nz)); }
        }
      }
    }
    for (const k of active) {
      const [x, y, z] = unkey(k);
      const id = world.get(x, y, z);
      if (id === AIR || isFlowing(id)) world.setBlock(x, y, z, WATER);
      if (world.get(x, y, z) === WATER) this.spoutWater.add(k);
    }
    // spouts that stopped: their water is drawn back
    for (const k of this.spoutWater) {
      if (active.has(k)) continue;
      const [x, y, z] = unkey(k);
      if (!world.chunkAt(x, z)) continue;
      if (world.get(x, y, z) === WATER) world.setBlock(x, y, z, AIR);
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
      // at the end: on to the next belt, or into whatever it points at
      if (items.length && items[0].t >= 1 && speed > 0) {
        if (this.insert(world, stations, x + dx, y, z + dz, items[0].id, 1, false)) {
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
    return out;
  }

  // What a drill is doing, for a toast when you tap it.
  drillStatus(x, y, z) { return this.drills.get(key(x, y, z))?.status || 'Not turning'; }

  serialize() {
    return {
      belts: [...this.belts].map(([k, items]) => [k, items.map((it) => [it.id, it.t])]),
      spoutWater: [...this.spoutWater],
      drills: [...this.drills].filter(([, d]) => d.held.length).map(([k, d]) => [k, d.held]),
    };
  }

  load(o) {
    this.clear();
    for (const [k, items] of o?.belts ?? []) {
      if (typeof k === 'string' && Array.isArray(items)) this.belts.set(k, items.filter((it) => it?.[0] > 0).map(([id, t]) => ({ id, t: Math.min(1, Math.max(0, +t || 0)), sprite: null })));
    }
    for (const k of o?.spoutWater ?? []) if (typeof k === 'string') this.spoutWater.add(k);
    for (const [k, held] of o?.drills ?? []) {
      if (typeof k === 'string' && Array.isArray(held)) this.drills.set(k, { progress: 0, target: '', held: held.filter((h) => h?.[0] > 0 && h[1] > 0), status: '' });
    }
  }
}
