// Logistics pipes: a routed item network, after the classic Logistics Pipes.
//
// Logistics pipes (and the request tables and power junctions touching them) join up into a network. Each pipe
// serves the chests and machines it touches, by its job:
//   provider  - offers what's in them to the network (a chest's contents; a machine's finished output)
//   crafting  - knows one recipe of the auto-crafter or machine it sits on: the network can order it made
//   supplier  - keeps them stocked with what it's set to (topping up as they're used)
//   sink      - takes in what it's set to (or, as the default route, anything nothing else wants)
//   extractor - pulls things out of them and sends them off to a sink
//   basic     - just a link in the network
// At a request table you order anything the network has, or can make: it works out the whole tree of crafting
// it takes (ingredients first, then what they make), and fails, saying what's missing, if it can't be done.
// Items fly along the pipes to where they're wanted. Nothing moves without a powered junction on the network.
// (v30) Also:
//   sensor    - signals while the network has less (or at least) some amount of a thing
//   fprovider - offers the water or lava in the tanks it touches (or endless, dipped in a still pool)
//   fsupplier - keeps the tank it touches filled to a level, or the oven, smelter or engine fed with lava
//   pad       - a drone pad: networks with pads on the same channel are one network, and couriers fly
//               things between the pads
// A power junction that gets a signal pauses its part of the network.
import * as THREE from 'three';
import { BLOCKS, stationKind, maxStack, RECIPES, WATER, LAVA, TANK_CAP, WATER_BUCKET, LAVA_BUCKET } from './blocks.js';
import { STATION_KINDS, isFuel } from './stations.js';

const key = (x, y, z) => `${x},${y},${z}`;
const unkey = (k) => k.split(',').map(Number);
const D6 = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
const SPEED = 8; // blocks a second along the pipes
const FILTER_SLOTS = 9;
const SUPPLY_EVERY = 2, EXTRACT_EVERY = 1, EXTRACT_MAX = 16;
const MAX_DEPTH = 10;
const DRONE_SPEED = 16; // blocks a second, flying
const SENSE_EVERY = 0.5, FLUID_EVERY = 2, FLUID_MAX = 4; // (buckets sent at a time)
const ENGINE_BURN = 30; // (as in machines.js: seconds of steam for a hundredth of a bucket of lava)
const FIRES = ['oven', 'smelter', 'blast'];
export const CHANNELS = 16;
const LIQUIDS = [WATER, LAVA];
const isLiquid = (id) => LIQUIDS.includes(id);
export const liquidIcon = (id) => (id === LAVA ? LAVA_BUCKET : WATER_BUCKET);
const idsOf = (id) => (Array.isArray(id) ? id : [id]);

export class Logistics {
  // deps: { world, stations, machines, electric }
  constructor(deps) {
    Object.defineProperties(this, Object.getOwnPropertyDescriptors(deps)); // (keeping getters, so `world` follows a new world)
    this.pipes = new Map(); // "x,y,z" -> config: { role, filter, mode, fallback, recipe, orders, inflight }
    this.transits = []; // things on their way: { id, count, path, d, dest, sprite }
    this.nets = []; this.netOf = new Map(); this.dirty = true;
    this.timers = { supply: 0, extract: 0, net: 0, sense: 0, fluid: 0 };
    this.segOf = new Map(); // "x,y,z" -> the piped-together part of a network it's in (a network can be several, joined by drones)
    this.onArrive = null; // (dest, id, n) when an order lands at a request table
    this.onSwitch = null; // (x, y, z, on): a stock sensor's signal changed (main.js)
    this.pausedAt = null; // (x, y, z) -> does a power junction get a signal (main.js)
  }

  // ---- the pipes ----
  add(x, y, z) {
    const role = BLOCKS[this.world.get(x, y, z)]?.lpipe;
    if (!role) return;
    const k = key(x, y, z);
    if (!this.pipes.has(k)) this.pipes.set(k, blank(role));
    this.pipes.get(k).role = role;
    this.dirty = true;
  }
  remove(x, y, z) { if (this.pipes.delete(key(x, y, z))) this.dirty = true; }
  config(x, y, z) { return this.pipes.get(key(x, y, z)) ?? null; }

  // Group the pipes into networks: the parts piped together, joined up by drone pads on the same channel (if
  // both parts are powered).
  rebuild() {
    for (const [k, c] of this.pipes) {
      const [x, y, z] = unkey(k);
      if (!this.world.chunkAt(x, z)) continue;
      const role = BLOCKS[this.world.get(x, y, z)]?.lpipe;
      if (!role) this.pipes.delete(k); else c.role = role;
    }
    const segs = []; this.segOf = new Map();
    for (const k of this.pipes.keys()) {
      if (this.segOf.has(k)) continue;
      const seg = { nodes: [] };
      segs.push(seg);
      const queue = [k];
      this.segOf.set(k, seg);
      while (queue.length) {
        const at = queue.pop();
        seg.nodes.push(at);
        const [x, y, z] = unkey(at);
        for (const [dx, dy, dz] of D6) {
          const n = key(x + dx, y + dy, z + dz);
          if (this.pipes.has(n) && !this.segOf.has(n)) { this.segOf.set(n, seg); queue.push(n); }
        }
      }
    }
    // drone pads: parts with a powered pad on the same channel join
    const up = segs.map((_, i) => i), find = (i) => (up[i] === i ? i : (up[i] = find(up[i])));
    const byCh = new Map(), segIndex = new Map(segs.map((g, i) => [g, i]));
    for (const g of segs) {
      if (!this.segPowered(g)) continue;
      for (const k of g.nodes) {
        const c = this.pipes.get(k);
        if (c.role !== 'pad') continue;
        const was = byCh.get(c.channel);
        if (was !== undefined) up[find(segIndex.get(g))] = find(was); else byCh.set(c.channel, segIndex.get(g));
      }
    }
    this.nets = []; this.netOf = new Map();
    const netAt = new Map();
    segs.forEach((g, i) => {
      const r = find(i);
      let net = netAt.get(r);
      if (!net) { net = { i: this.nets.length, nodes: [], segs: [], pads: [] }; netAt.set(r, net); this.nets.push(net); }
      net.segs.push(g); net.nodes.push(...g.nodes);
      for (const k of g.nodes) this.netOf.set(k, net);
    });
    for (const net of this.nets) {
      if (net.segs.length < 2) continue;
      net.pads = net.nodes.filter((k) => this.pipes.get(k).role === 'pad' && net.segs.length > 1 && this.segPowered(this.segOf.get(k)));
    }
    this.dirty = false;
  }
  netAt(x, y, z) { if (this.dirty) this.rebuild(); return this.netOf.get(key(x, y, z)) ?? null; }
  // A part of a network runs while a power junction on it has power, and none of them gets a signal (which pauses it).
  segPowered(seg) {
    let on = false;
    for (const k of seg.nodes) {
      if (this.pipes.get(k)?.role !== 'power') continue;
      const [x, y, z] = unkey(k);
      if (this.pausedAt?.(x, y, z)) return false;
      if (this.electric.speedAt(x, y, z) > 0) on = true;
    }
    return on;
  }
  powered(net) { return !!net && (net.segs ?? [net]).some((g) => this.segPowered(g)); }
  paused(net) { return !!net && net.nodes.some((k) => this.pipes.get(k)?.role === 'power' && this.pausedAt?.(...unkey(k))); }
  ofRole(net, role) { return net.nodes.filter((k) => this.pipes.get(k)?.role === role); }

  // The chests and machines a pipe touches (not other parts of the network): [{ x, y, z, kind, st }]
  invsOf(pk) {
    const [x, y, z] = unkey(pk), out = [];
    if (this.pipes.get(pk)?.role === 'table') return [this.inv(x, y, z)].filter(Boolean);
    for (const [dx, dy, dz] of D6) {
      const ix = x + dx, iy = y + dy, iz = z + dz;
      if (this.pipes.has(key(ix, iy, iz))) continue;
      const inv = this.inv(ix, iy, iz);
      if (inv) out.push(inv);
    }
    return out;
  }
  inv(x, y, z) {
    const kind = stationKind(this.world.get(x, y, z));
    if (!kind) return null;
    return { x, y, z, kind, K: STATION_KINDS[kind], st: this.stations.get(x, y, z, kind) };
  }
  // The slots things can be taken out of: everything in a store; only what a machine has made.
  outSlots(inv) {
    const { K, st } = inv;
    if (K.storage || K.holder) return st.inputs.map((_, i) => ({ get: () => st.inputs[i], set: (v) => { st.inputs[i] = v; } }));
    const s = [{ get: () => st.out, set: (v) => { st.out = v; } }];
    (st.side ?? []).forEach((_, i) => s.push({ get: () => st.side[i], set: (v) => { st.side[i] = v; } }));
    return s;
  }
  countIn(inv, id, withInputs = false) {
    let n = 0;
    for (const s of this.outSlots(inv)) { const v = s.get(); if (v?.id === id) n += v.count; }
    if (withInputs && !inv.K.storage) {
      for (const v of inv.st.inputs) if (v?.id === id) n += v.count;
      if (inv.st.fuel?.id === id) n += inv.st.fuel.count;
    }
    return n;
  }
  takeFrom(inv, id, n) {
    let got = 0;
    for (const s of this.outSlots(inv)) {
      const v = s.get();
      if (!v || v.id !== id || got >= n) continue;
      const k = Math.min(n - got, v.count);
      v.count -= k; got += k;
      if (!v.count) s.set(null);
    }
    return got;
  }
  // How much of `id` would fit in a chest or machine's ingredient slots.
  roomIn(inv, id) {
    if (inv.K.accepts && !inv.K.accepts.includes(id)) return 0;
    let room = 0;
    for (const v of inv.st.inputs) room += !v ? maxStack(id) : v.id === id ? maxStack(id) - v.count : 0;
    return room;
  }

  // ---- what's on offer ----
  offers(cfg, id) {
    const f = cfg.filter.filter(Boolean).map((s) => s.id);
    if (!f.length) return true;
    return cfg.mode === 'include' ? f.includes(id) : !f.includes(id);
  }
  // Everything the providers on a network offer: Map id -> count.
  stock(net) {
    const m = new Map();
    for (const pk of this.ofRole(net, 'provider')) {
      const cfg = this.pipes.get(pk);
      for (const inv of this.invsOf(pk)) for (const s of this.outSlots(inv)) {
        const v = s.get();
        if (v && !v.charge && !v.ench && this.offers(cfg, v.id)) m.set(v.id, (m.get(v.id) ?? 0) + v.count);
      }
    }
    return m;
  }
  // The crafting pipes on a network with their recipes: [{ pk, recipe, inv }]
  crafters(net) {
    return this.ofRole(net, 'crafting').map((pk) => ({ pk, recipe: this.pipes.get(pk).recipe, inv: this.craftInv(pk) })).filter((c) => c.recipe && c.inv);
  }
  // The crafter or machine a crafting pipe works.
  craftInv(pk) { return this.invsOf(pk).find((v) => v.K.crafter || (v.K.recipes?.length && !v.K.storage)) ?? null; }
  // What a crafting pipe could be set to make: the recipes of the thing it's on.
  recipesFor(pk) {
    const inv = this.craftInv(pk);
    if (!inv) return [];
    return inv.K.crafter ? RECIPES : inv.K.recipes.filter((r) => r.out);
  }
  // The recipe an auto-crafter at (x, y, z) should follow, if a crafting pipe on it says so.
  crafterRecipe(x, y, z) {
    for (const [dx, dy, dz] of D6) {
      const c = this.pipes.get(key(x + dx, y + dy, z + dz));
      if (c?.role === 'crafting' && c.recipe) return c.recipe;
    }
    return null;
  }

  // ---- ordering ----
  // Work out how to get n of id to dest: [{ fetch: id, n } | { craft: pk, id, n }] (all with dest), or the missing things.
  plan(net, id, n, dest) {
    const stock = this.stock(net), crafters = this.crafters(net), steps = [], missing = new Map();
    const go = (id, n, dest, depth, chain) => {
      const have = stock.get(id) ?? 0, use = Math.min(have, n);
      if (use > 0) { steps.push({ fetch: id, n: use, dest }); stock.set(id, have - use); }
      const rem = n - use;
      if (rem <= 0) return;
      const c = depth < MAX_DEPTH && crafters.find((c) => c.recipe.out[0] === id && !chain.has(c.pk));
      if (!c) { missing.set(id, (missing.get(id) ?? 0) + rem); return; }
      const times = Math.ceil(rem / c.recipe.out[1]);
      const next = new Set(chain).add(c.pk), at = { pk: c.pk, x: c.inv.x, y: c.inv.y, z: c.inv.z };
      for (const [iid, k] of c.recipe.in) go(this.bestId(iid, stock, crafters), k * times, at, depth + 1, next);
      steps.push({ craft: c.pk, id, n: times * c.recipe.out[1], dest });
    };
    go(id, n, dest, 0, new Set());
    return { ok: !missing.size, steps, missing: [...missing] };
  }
  // For an ingredient that can be one of several things: the one there's most of, or that can be made.
  bestId(id, stock, crafters) {
    const ids = idsOf(id);
    if (ids.length === 1) return ids[0];
    return [...ids].sort((a, b) => (stock.get(b) ?? 0) - (stock.get(a) ?? 0))[0] ?? (ids.find((i) => crafters.some((c) => c.recipe.out[0] === i)) ?? ids[0]);
  }
  // Carry out a plan: send what's there, and set the crafting going.
  run(net, steps) {
    for (const s of steps) {
      const n = s.fetch ? this.fetch(net, s.fetch, s.n, s.dest) : s.n;
      if (s.craft) this.pipes.get(s.craft)?.orders.push({ id: s.id, left: s.n, dest: s.dest });
      this.expect(s.dest, s.fetch ?? s.id, n);
    }
  }
  // A supplier keeps count of what's on its way to it, so it doesn't order it twice.
  expect(dest, id, n) {
    const c = dest && !dest.table && this.pipes.get(dest.pk);
    if (c?.role === 'supplier' || c?.role === 'fsupplier') c.inflight[id] = Math.max(0, (c.inflight[id] ?? 0) + n);
  }
  // Order n of id to a request table (or a supplier's chest): { ok, missing, reason }.
  request(x, y, z, id, n) {
    const net = this.netAt(x, y, z);
    if (!net) return { ok: false, reason: 'Not joined to any logistics pipes' };
    if (!this.powered(net)) return { ok: false, reason: this.paused(net) ? 'The network is paused: a power junction is getting a signal' : 'The network has no power: put a power junction on it, wired to the grid' };
    const p = this.plan(net, id, n, { pk: key(x, y, z), x, y, z, table: true });
    if (p.ok) this.run(net, p.steps);
    return p;
  }
  // Everything that can be ordered at (x, y, z): [{ id, count, craft }]
  orderable(x, y, z) {
    const net = this.netAt(x, y, z);
    if (!net) return [];
    const m = new Map([...this.stock(net)].map(([id, n]) => [id, { id, count: n, craft: false }]));
    for (const c of this.crafters(net)) { const e = m.get(c.recipe.out[0]); if (e) e.craft = true; else m.set(c.recipe.out[0], { id: c.recipe.out[0], count: 0, craft: true }); }
    return [...m.values()];
  }

  // Take n of id from the providers (nearest first) and send it to dest.
  fetch(net, id, n, dest) {
    const provs = this.ofRole(net, 'provider').map((pk) => ({ pk, path: this.path(net, pk, dest.pk) })).filter((p) => p.path).sort((a, b) => a.path.length - b.path.length);
    let left = n;
    for (const p of provs) {
      const cfg = this.pipes.get(p.pk);
      if (!this.offers(cfg, id)) continue;
      for (const inv of this.invsOf(p.pk)) {
        if (left <= 0) break;
        const got = this.takeFrom(inv, id, left);
        if (got) { left -= got; this.send(id, got, [[inv.x, inv.y, inv.z], ...p.path], dest); }
      }
      if (left <= 0) break;
    }
    return n - left;
  }

  // ---- moving things ----
  // The way along the network from one pipe to another: [[x, y, z], ...], or null.
  path(net, from, to) {
    if (from === to) return [unkey(from)];
    const prev = new Map([[from, null]]), queue = [from];
    for (let i = 0; i < queue.length; i++) {
      const at = queue[i];
      if (at === to) break;
      const [x, y, z] = unkey(at);
      for (const [dx, dy, dz] of D6) {
        const n = key(x + dx, y + dy, z + dz);
        if (prev.has(n) || this.netOf.get(n) !== net) continue;
        prev.set(n, at); queue.push(n);
      }
      // a drone pad: a courier flies to the other pads on its channel
      const c = this.pipes.get(at);
      if (c?.role === 'pad' && net.pads?.includes(at)) {
        for (const n of net.pads) if (!prev.has(n) && this.pipes.get(n).channel === c.channel) { prev.set(n, at); queue.push(n); }
      }
    }
    if (!prev.has(to)) return null;
    const out = [];
    for (let at = to; at; at = prev.get(at)) out.unshift(unkey(at));
    return out;
  }
  send(id, count, path, dest, fluid = false) {
    const t = { id, count, path: dest.table ? path : [...path, [dest.x, dest.y, dest.z]], d: 0, dest, sprite: null, fluid };
    this.transits.push(costs(t));
  }
  arrive(t) {
    const { dest } = t, c = this.pipes.get(dest.pk);
    this.expect(dest, t.id, -t.count);
    if (t.fluid) { this.arriveFluid(t, c); return; }
    const fuel = c?.role === 'supplier' && isFuel(t.id);
    let k = this.world.chunkAt(dest.x, dest.z) ? this.machines.insert(this.world, this.stations, dest.x, dest.y, dest.z, t.id, t.count, fuel) : 0;
    if (k > 0 && dest.table) this.onArrive?.(dest, t.id, k);
    const left = t.count - k;
    if (left > 0) this.reroute(t.id, left, t.path[t.path.length - 1]);
  }
  // Something with nowhere to go (its chest was full): off to a sink if there is one, or out onto the floor.
  reroute(id, n, at) {
    const [x, y, z] = at, net = this.netAt(x, y, z) ?? this.nearNet(x, y, z);
    const sink = net && this.sinkFor(net, id, n, key(x, y, z));
    if (sink) { this.send(id, n, sink.path, sink.dest); return; }
    this.machines.throwItem?.({ id, count: n }, { x: x + 0.5, y: y + 0.6, z: z + 0.5 }, { x: 0, y: 1.5, z: 0 });
  }
  nearNet(x, y, z) { for (const [dx, dy, dz] of D6) { const n = this.netOf.get(key(x + dx, y + dy, z + dz)); if (n) return n; } return null; }
  // The nearest sink that wants id and has room (one that names it first, then a default route): { path, dest }.
  sinkFor(net, id, n, fromPk, notInv = null) {
    let best = null;
    for (const pk of this.ofRole(net, 'sink')) {
      const cfg = this.pipes.get(pk), named = cfg.filter.some((s) => s?.id === id);
      if (!named && !cfg.fallback) continue;
      for (const inv of this.invsOf(pk)) {
        if (notInv && inv.x === notInv.x && inv.y === notInv.y && inv.z === notInv.z) continue;
        if (this.roomIn(inv, id) < 1) continue;
        const path = this.path(net, fromPk, pk);
        if (!path) continue;
        const score = path.length + (named ? 0 : 1000);
        if (!best || score < best.score) best = { score, path, dest: { pk, x: inv.x, y: inv.y, z: inv.z } };
      }
    }
    return best;
  }

  // ---- every frame ----
  update(dt) {
    if ((this.timers.net -= dt) <= 0 || this.dirty) { this.timers.net = 1; this.rebuild(); }
    // things in the pipes (and in the air)
    for (let i = this.transits.length - 1; i >= 0; i--) {
      const t = this.transits[i];
      if (!t.cum) costs(t);
      t.d += dt * SPEED;
      const end = t.cum[t.cum.length - 1];
      if (t.d >= end) {
        this.transits.splice(i, 1);
        this.machines.dropSprite?.(t); this.dropDrone(t);
        this.arrive(t);
        continue;
      }
      let j = t.j ?? 0;
      while (j < t.cum.length - 2 && t.cum[j + 1] <= t.d) j++;
      t.j = j;
      const a = t.path[j], b = t.path[j + 1], u = (t.d - t.cum[j]) / Math.max(1e-6, t.cum[j + 1] - t.cum[j]);
      const len = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]), flying = len > 1.01;
      const px = a[0] + 0.5 + (b[0] - a[0]) * u, py = a[1] + 0.5 + (b[1] - a[1]) * u, pz = a[2] + 0.5 + (b[2] - a[2]) * u;
      if (flying) {
        if (t.sprite) this.machines.dropSprite(t);
        if (!t.drone && this.machines.scene) { t.drone = this.makeDrone(t); this.onFlight?.(t); }
        if (t.drone) {
          t.drone.position.set(px, py + 0.4 + Math.sin(Math.PI * u) * Math.min(12, len * 0.3), pz);
          t.drone.rotation.y = Math.atan2(b[0] - a[0], b[2] - a[2]);
          for (const r of t.drone.userData.rotors) r.rotation.y += dt * 40;
        }
        continue;
      }
      this.dropDrone(t);
      if (!t.sprite && this.machines.makeSprite && i < 80) { t.sprite = this.machines.makeSprite(t.fluid ? liquidIcon(t.id) : t.id); t.sprite.scale.setScalar(0.28); }
      if (t.sprite) t.sprite.position.set(px, py, pz);
    }
    const powered = new Map(this.nets.map((n) => [n, this.powered(n)]));
    if ((this.timers.sense -= dt) <= 0) { this.timers.sense = SENSE_EVERY; this.tickSensors(); }
    if ((this.timers.fluid -= dt) <= 0) { this.timers.fluid = FLUID_EVERY; this.tickFluids(); }
    this.burnFluids();
    // crafting pipes send on what's been made for their orders
    for (const [pk, c] of this.pipes) {
      if (c.role !== 'crafting' || !c.orders.length) continue;
      const net = this.netOf.get(pk), inv = this.craftInv(pk);
      if (!net || !inv || !powered.get(net)) continue;
      const o = c.orders[0];
      const got = this.takeFrom(inv, o.id, o.left);
      if (got) {
        const path = this.path(net, pk, o.dest.pk);
        if (path) this.send(o.id, got, [[inv.x, inv.y, inv.z], ...path], o.dest);
        else this.reroute(o.id, got, unkey(pk));
        o.left -= got;
        if (o.left <= 0) c.orders.shift();
      }
    }
    // suppliers top up
    if ((this.timers.supply -= dt) <= 0) {
      this.timers.supply = SUPPLY_EVERY;
      for (const [pk, c] of this.pipes) {
        if (c.role !== 'supplier') continue;
        const net = this.netOf.get(pk);
        if (!net || !powered.get(net)) continue;
        const inv = this.invsOf(pk)[0];
        if (!inv) continue;
        for (const want of c.filter) {
          if (!want) continue;
          const have = this.countIn(inv, want.id, true) + (c.inflight[want.id] ?? 0);
          if (have >= want.count) continue;
          const dest = { pk, x: inv.x, y: inv.y, z: inv.z };
          const p = this.plan(net, want.id, want.count - have, dest);
          if (p.ok) this.run(net, p.steps);
          else this.expect(dest, want.id, this.fetch(net, want.id, want.count - have, dest)); // (what there is, at least)
        }
      }
    }
    // extractors empty things out into sinks
    if ((this.timers.extract -= dt) <= 0) {
      this.timers.extract = EXTRACT_EVERY;
      for (const [pk, c] of this.pipes) {
        if (c.role !== 'extractor') continue;
        const net = this.netOf.get(pk);
        if (!net || !powered.get(net)) continue;
        for (const inv of this.invsOf(pk)) {
          const slot = this.outSlots(inv).find((s) => { const v = s.get(); return v && !v.charge && !v.ench && this.sinkFor(net, v.id, 1, pk, inv); });
          if (!slot) continue;
          const v = slot.get(), sink = this.sinkFor(net, v.id, 1, pk, inv);
          const n = Math.min(EXTRACT_MAX, v.count, this.roomIn(this.inv(sink.dest.x, sink.dest.y, sink.dest.z), v.id));
          if (n <= 0) continue;
          const id = v.id;
          this.takeFrom(inv, id, n);
          this.send(id, n, [[inv.x, inv.y, inv.z], ...sink.path], sink.dest);
          break;
        }
      }
    }
  }

  // stock sensors and liquid suppliers (called from update)
  tickSensors() {
    for (const [pk, c] of this.pipes) {
      if (c.role !== 'sensor') continue;
      const [x, y, z] = unkey(pk);
      if (!this.world.chunkAt(x, z)) continue;
      const net = this.netOf.get(pk), want = this.sensed(net, c);
      if (want !== !!BLOCKS[this.world.get(x, y, z)]?.on) this.onSwitch?.(x, y, z, want);
    }
  }
  // Should a stock sensor be signalling?
  sensed(net, c) {
    const f = c.filter[0];
    if (!net || !f) return false;
    const have = this.amountOf(net, f.id);
    return c.when === 'above' ? have >= f.count : have < f.count;
  }
  // How much of a thing (or buckets of a liquid) the network has on offer.
  amountOf(net, id) { return isLiquid(id) ? this.fluidStock(net).get(id) ?? 0 : this.stock(net).get(id) ?? 0; }

  // ---- liquids ----
  // The tanks (and still pools) a liquid provider touches: [{ x, y, z, tank, liquid, amount }]
  fluidSources(pk) {
    const [x, y, z] = unkey(pk), out = [];
    for (const [dx, dy, dz] of D6) {
      const ix = x + dx, iy = y + dy, iz = z + dz, id = this.world.get(ix, iy, iz);
      if (isLiquid(id)) out.push({ x: ix, y: iy, z: iz, tank: null, liquid: id, amount: Infinity });
      else if (BLOCKS[id]?.tank) {
        const t = this.machines.tanks.get(key(ix, iy, iz));
        if (t?.amount > 0) out.push({ x: ix, y: iy, z: iz, tank: t, liquid: t.liquid, amount: t.amount });
      }
    }
    return out;
  }
  fluidStock(net) {
    const m = new Map();
    for (const pk of this.ofRole(net, 'fprovider')) for (const s of this.fluidSources(pk)) m.set(s.liquid, (m.get(s.liquid) ?? 0) + s.amount);
    return m;
  }
  // What a liquid supplier feeds: a tank to fill, or something that burns lava. { x, y, z, kind: 'tank' | 'fire', d }
  fluidTarget(pk) {
    const [x, y, z] = unkey(pk);
    for (const [dx, dy, dz] of D6) {
      const ix = x + dx, iy = y + dy, iz = z + dz;
      if (this.pipes.has(key(ix, iy, iz))) continue;
      const d = BLOCKS[this.world.get(ix, iy, iz)];
      if (d?.tank) return { x: ix, y: iy, z: iz, kind: 'tank', d };
      if (d?.engine || FIRES.includes(d?.station)) return { x: ix, y: iy, z: iz, kind: 'fire', d };
    }
    return null;
  }
  // Send up to n buckets of a liquid from the nearest providers to dest; returns how much was sent.
  fetchFluid(net, liquid, n, dest) {
    const provs = this.ofRole(net, 'fprovider').map((pk) => ({ pk, path: this.path(net, pk, dest.pk) })).filter((p) => p.path).sort((a, b) => a.path.length - b.path.length);
    let left = n;
    for (const p of provs) {
      for (const s of this.fluidSources(p.pk)) {
        if (left <= 0) break;
        if (s.liquid !== liquid) continue;
        const k = Math.min(left, s.amount);
        if (k <= 0) continue;
        if (s.tank) { s.tank.amount -= k; this.machines.showTank(this.world, s.x, s.y, s.z); }
        left -= k;
        this.send(liquid, k, [[s.x, s.y, s.z], ...p.path], dest, true);
      }
      if (left <= 0) break;
    }
    return n - left;
  }
  tickFluids() {
    for (const [pk, c] of this.pipes) {
      if (c.role !== 'fsupplier') continue;
      const net = this.netOf.get(pk);
      if (!net || !this.powered(net)) continue;
      const tg = this.fluidTarget(pk);
      if (!tg) continue;
      const dest = { pk, x: tg.x, y: tg.y, z: tg.z, fuel: tg.kind === 'fire' };
      if (tg.kind === 'fire') {
        const want = 1 - (c.buf ?? 0) - (c.inflight[LAVA] ?? 0);
        if (want > 0.05) this.expect(dest, LAVA, this.fetchFluid(net, LAVA, Math.min(FLUID_MAX, Math.ceil(want)), dest));
        continue;
      }
      const f = c.filter[0];
      if (!f || !isLiquid(f.id)) continue;
      const t = this.machines.tank(tg.x, tg.y, tg.z);
      if (t.amount > 0.01 && t.liquid !== f.id) continue; // (a tank of the other liquid: leave it be)
      const want = Math.min(f.count, TANK_CAP) - t.amount - (c.inflight[f.id] ?? 0);
      if (want >= 1) this.expect(dest, f.id, this.fetchFluid(net, f.id, Math.min(FLUID_MAX, Math.floor(want)), dest));
    }
  }
  // Lava a liquid supplier holds burns in the fire it feeds, as a pump's does.
  burnFluids() {
    for (const [pk, c] of this.pipes) {
      if (c.role !== 'fsupplier' || !(c.buf > 0)) continue;
      const tg = this.fluidTarget(pk);
      if (tg?.kind !== 'fire') continue;
      if (tg.d.engine) { const e = this.machines.engine(tg.x, tg.y, tg.z); if (e.burn < 2 && c.buf >= 0.01) { e.burn += ENGINE_BURN; c.buf -= 0.01; } continue; }
      const st = this.stations.get(tg.x, tg.y, tg.z, tg.d.station);
      if (st.burn < 0.5 && c.buf >= 0.01) { st.burn += 1; st.burnMax = Math.max(st.burnMax, 1); c.buf -= 0.01; }
    }
  }
  arriveFluid(t, c) {
    const { dest } = t;
    if (dest.fuel) { if (c) c.buf = (c.buf ?? 0) + t.count; return; }
    if (!this.world.chunkAt(dest.x, dest.z) || !BLOCKS[this.world.get(dest.x, dest.y, dest.z)]?.tank) return;
    const tk = this.machines.tank(dest.x, dest.y, dest.z);
    if (tk.amount > 0.01 && tk.liquid !== t.id) return;
    tk.liquid = t.id; tk.amount = Math.min(TANK_CAP, tk.amount + t.count);
    this.machines.showTank(this.world, dest.x, dest.y, dest.z);
  }

  // ---- couriers ----
  makeDrone(t) {
    const g = new THREE.Group();
    g.add(new THREE.Mesh(DRONE.body, DRONE.dark));
    const rotors = [];
    for (const [rx, rz] of [[-0.28, -0.28], [0.28, -0.28], [-0.28, 0.28], [0.28, 0.28]]) {
      const arm = new THREE.Mesh(DRONE.arm, DRONE.dark); arm.position.set(rx / 2, 0, rz / 2); arm.rotation.y = Math.atan2(rx, rz); g.add(arm);
      const r = new THREE.Mesh(DRONE.rotor, DRONE.light); r.position.set(rx, 0.08, rz); g.add(r); rotors.push(r);
    }
    const lamp = new THREE.Mesh(DRONE.lamp, DRONE.glow); lamp.position.set(0, 0, 0.17); g.add(lamp);
    if (this.machines.makeSprite) {
      const s = this.machines.makeSprite(t.fluid ? liquidIcon(t.id) : t.id);
      this.machines.scene.remove(s); s.scale.setScalar(0.34); s.position.set(0, -0.26, 0); g.add(s); g.userData.sprite = s;
    }
    g.userData.rotors = rotors;
    this.machines.scene.add(g);
    return g;
  }
  dropDrone(t) {
    if (!t.drone) return;
    this.machines.scene?.remove(t.drone);
    t.drone.userData.sprite?.material.dispose();
    t.drone = null;
  }

  // A line about a pipe's network, for its panel.
  status(x, y, z) {
    const net = this.netAt(x, y, z);
    if (!net) return 'Not part of a network';
    const pipes = net.nodes.length, on = this.powered(net), far = (net.segs?.length ?? 1) - 1;
    const linked = far ? ` Linked by drone to ${far} other network${far > 1 ? 's' : ''}.` : '';
    if (this.paused(net) && !on) return `${pipes} part${pipes > 1 ? 's' : ''} in this network.${linked} Paused: a power junction is getting a signal.`;
    return `${pipes} part${pipes > 1 ? 's' : ''} in this network.${linked} ${on ? 'Powered.' : 'No power: put a logistics power junction on it, wired to the grid.'}`;
  }

  clear() { for (const t of this.transits) { this.machines.dropSprite?.(t); this.dropDrone(t); } this.transits = []; this.pipes.clear(); this.dirty = true; }
  serialize() {
    return {
      pipes: [...this.pipes].map(([k, c]) => [k, { ...c, recipe: c.recipe ? { out: c.recipe.out, in: c.recipe.in, i: RECIPES.indexOf(c.recipe) } : null }]),
      transits: this.transits.map((t) => [t.id, t.count, t.path, +t.d.toFixed(2), t.dest, t.fluid ? 1 : 0]),
    };
  }
  load(o) {
    this.clear();
    for (const [k, c] of Array.isArray(o?.pipes) ? o.pipes : []) {
      if (typeof k !== 'string' || !c) continue;
      const cfg = blank(c.role);
      cfg.filter = Array.from({ length: FILTER_SLOTS }, (_, i) => (c.filter?.[i]?.id > 0 ? { id: c.filter[i].id, count: Math.max(1, c.filter[i].count | 0) } : null));
      cfg.mode = c.mode === 'include' ? 'include' : 'exclude';
      cfg.fallback = !!c.fallback;
      cfg.recipe = c.recipe ? findRecipe(c.recipe) : null;
      cfg.orders = Array.isArray(c.orders) ? c.orders.filter((x) => x?.id > 0 && x.left > 0 && x.dest) : [];
      cfg.inflight = c.inflight && typeof c.inflight === 'object' ? { ...c.inflight } : {};
      cfg.channel = c.channel >= 1 && c.channel <= CHANNELS ? c.channel | 0 : 1;
      cfg.when = c.when === 'above' ? 'above' : 'below';
      cfg.buf = Math.max(0, Math.min(8, +c.buf || 0));
      this.pipes.set(k, cfg);
    }
    for (const a of Array.isArray(o?.transits) ? o.transits : []) {
      if (!Array.isArray(a) || !(a[0] > 0) || !(a[1] > 0) || !Array.isArray(a[2]) || !a[4]) continue;
      this.transits.push(costs({ id: a[0], count: a[1], path: a[2], d: +a[3] || 0, dest: a[4], sprite: null, fluid: !!a[5] }));
    }
    this.dirty = true;
  }
}

function blank(role) {
  return { role, filter: new Array(FILTER_SLOTS).fill(null), mode: 'exclude', fallback: false, recipe: null, orders: [], inflight: {}, channel: 1, when: 'below', buf: 0 };
}
// How far along its path each point of a thing's way is, in pipe-lengths (flights count for less: drones are fast).
function costs(t) {
  t.cum = [0];
  for (let i = 1; i < t.path.length; i++) {
    const a = t.path[i - 1], b = t.path[i], len = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
    t.cum.push(t.cum[i - 1] + (len > 1.01 ? Math.max(1, len * SPEED / DRONE_SPEED) : len));
  }
  if (t.cum.length < 2) t.cum.push(1);
  t.j = 0;
  return t;
}
// A courier drone's parts (shared by every drone).
const DRONE = {
  body: new THREE.BoxGeometry(0.3, 0.1, 0.3), arm: new THREE.BoxGeometry(0.05, 0.04, 0.4),
  rotor: new THREE.CylinderGeometry(0.15, 0.15, 0.02, 10), lamp: new THREE.BoxGeometry(0.06, 0.04, 0.02),
  dark: new THREE.MeshBasicMaterial({ color: 0x3a3f46 }), light: new THREE.MeshBasicMaterial({ color: 0xc8ccd2, transparent: true, opacity: 0.7 }),
  glow: new THREE.MeshBasicMaterial({ color: 0x7fe8ff }),
};
// A saved recipe, found again among the game's recipes (crafting or a machine's).
function findRecipe(r) {
  if (r.i >= 0 && RECIPES[r.i]?.out[0] === r.out?.[0]) return RECIPES[r.i];
  const same = (q) => q.out && q.out[0] === r.out?.[0] && q.out[1] === r.out?.[1] && JSON.stringify(q.in) === JSON.stringify(r.in);
  for (const K of Object.values(STATION_KINDS)) { const q = K.recipes?.find(same); if (q) return q; }
  return RECIPES.find(same) ?? null;
}
