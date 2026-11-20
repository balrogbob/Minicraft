// Electricity: what makes it (generators, solar panels, wind turbines), what carries it (electrum wire,
// cupronickel cable), what stores it (grid batteries) and the machines that run on it.
//
// Electric blocks join up when they touch (any face), through electrum wire, which joins like copper
// wire does (side by side, or up or down a block round an edge), and through cupronickel cable, which
// runs straight on in any direction (up a wall or across a ceiling) and carries no signals. Each joined
// set is a network:
//  - every generator in it makes GEN_POWER for each 1x its shaft turns it at (see kinetics.js); a solar
//    panel makes up to SOLAR_POWER under open sky by day; a wind turbine makes more the higher it stands;
//  - each machine takes its draw (ELECTRIC_DRAW) while it has work: a lamp while it's on, a pulverizer or
//    electric smelter while it has something to work on, a charger while what's in it isn't full, a motor
//    while it has something to turn, a teleport pad while it isn't full, a quarry while it's digging;
//  - grid batteries soak up what's spare (up to STORE_RATE each) and give it back when the network's short;
//  - a geothermal generator makes GEO_POWER for each face against lava; a reactor makes REACTOR_POWER for
//    each fuel rod burning in it (none while it gets a signal: its control rods are in). A reactor heats up
//    as its rods burn, and cools by itself a little and by each face it has against water; at MELTDOWN heat
//    it blows up;
//  - a wireless charger tops up the battery things you carry while you're near it, and electric rails and
//    lifts take power while a cart is on them, or while they carry you.
// When there's less than the machines want, everything runs on the share there is: a pulverizer works that
// much slower, a charger fills that much slower, a motor gives that much less, and lamps go out below half.
import {
  BLOCKS, GEN_POWER, ELECTRIC_LAMP, CHARGE_RATE, chargeCap, stationKind, MAX_LIGHT, SOLAR_POWER, STORE_CAP, STORE_RATE,
  PAD_CAP, PAD_PLAYER, TELEPAD, LAVA, GEO_POWER, REACTOR, REACTOR_POWER, REACTOR_HEAT, REACTOR_COOL, WATER_COOL, REACTOR_HOT,
  MELTDOWN, FUEL_ROD, ROD_LIFE, SPENT_ROD, isFuelRod, maxWear, ICE, PACKED_ICE, ICE_COOL, PACKED_ICE_COOL, WATER,
  WIRE_CARRY, INSULATED_CARRY,
} from './blocks.js';
import { STATION_KINDS } from './stations.js';
import { CHUNK, SEA_LEVEL } from './terrain.js';

const SOLVE_EVERY = 0.25; // seconds between working the networks out again
const key = (x, y, z) => `${x},${y},${z}`;
const SIDES = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
// wire to wire: up or down a block beside it, as well as straight on
const WIRE_STEPS = [[1, 1, 0], [-1, 1, 0], [0, 1, 1], [0, 1, -1], [1, -1, 0], [-1, -1, 0], [0, -1, 1], [0, -1, -1]];
const fmt = (n) => (Math.round(n * 10) / 10).toString();
const AROUND = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];

// A wind turbine's power: 1 at sea level, a point more every 6 blocks higher (up to 6), and half as much
// again in a storm. It needs the 8 cells around it clear to turn.
export function turbinePower(world, x, y, z, raining) {
  for (const [dx, dz] of AROUND) if (world.get(x + dx, y, z + dz)) return 0;
  return Math.min(6, 1 + Math.max(0, y - SEA_LEVEL) / 6) * (raining ? 1.5 : 1);
}

export class Electric {
  constructor() {
    this.nodes = new Map(); // "x,y,z" -> { x, y, z, id, role, draw, net }
    this.nets = []; // { supply, demand, share, gens, users, stores, stored, parts }
    this.store = new Map(); // grid battery or teleport pad "x,y,z" -> power-seconds held
    this.signalLamps = new Set(); // electric lamps switched to come on only with a signal
    this.heat = new Map(); // reactor "x,y,z" -> heat (MELTDOWN blows it up)
    this.timer = 0;
    this.hooks = {};
  }

  // Does an electric machine want power right now?
  wants(n, stations, kinetics) {
    if (n.role !== 'use') return false;
    const k = key(n.x, n.y, n.z), def = BLOCKS[n.id];
    const said = this.hooks.wants?.(n);
    if (said !== undefined) return said;
    if (def.pad) return (this.store.get(k) ?? 0) < PAD_CAP;
    if (n.wireless) return !!this.hooks.wireless?.(n, 0);
    if (def.rail || def.lift) return false; // (main.js says when one's in use)
    if (def.kinetic) {
      // a motor: while there's something on its shafts to turn
      const m = kinetics.nodes.get(k);
      return m?.net != null && !!kinetics.nets[m.net]?.machines.length;
    }
    const kind = stationKind(n.id);
    if (!kind) return !this.signalLamps.has(k) || !!this.hooks.signalAt?.(n.x, n.y, n.z); // a lamp
    const st = stations.map.get(k);
    if (!st) return false;
    if (kind === 'charger') { const s = st.inputs[0]; return !!s && chargeCap(s.id) > 0 && (s.wear ?? 0) > 0; }
    return !!stations.recipeFor(st);
  }

  // How many fuel rods are burning in a reactor (none while it gets a signal).
  rodsIn(n, stations) {
    if (this.hooks.signalAt?.(n.x, n.y, n.z)) return 0;
    const st = stations.map.get(key(n.x, n.y, n.z));
    return st ? st.inputs.filter((s) => isFuelRod(s?.id) && (s.wear ?? 0) < maxWear(s.id)).length : 0;
  }

  made(n, world, kinetics, stations) {
    if (n.geo) {
      let faces = 0;
      for (const [dx, dy, dz] of SIDES) if (world.get(n.x + dx, n.y + dy, n.z + dz) === LAVA) faces++;
      return GEO_POWER * faces;
    }
    if (n.reactor) return REACTOR_POWER * this.rodsIn(n, stations);
    if (n.solar) {
      if (world.skyAt(n.x, n.y, n.z) < MAX_LIGHT - 1) return 0; // under a roof
      const day = Math.max(0, ((this.hooks.daylight?.() ?? 1) - 0.3) / 0.7);
      return SOLAR_POWER * day;
    }
    if (n.wind) return turbinePower(world, n.x, n.y, n.z, this.hooks.raining?.());
    return GEN_POWER * kinetics.powerAt(n.x, n.y, n.z);
  }

  solve(world, kinetics, stations) {
    const nodes = new Map();
    for (const c of world.chunks.values()) {
      for (const li of c.machines) {
        const def = BLOCKS[c.data[li]];
        if (!def?.electric) continue;
        const x = c.cx * CHUNK + (li & 15), z = c.cz * CHUNK + ((li >> 4) & 15), y = li >> 8;
        nodes.set(key(x, y, z), { x, y, z, id: c.data[li], ...def.electric, draw: def.electric.draw ?? 0, net: null, flow: 0 });
      }
    }
    // forget the charge of batteries and pads that have gone (where the world's loaded)
    for (const k of this.store.keys()) {
      const n = nodes.get(k);
      if (n && (n.role === 'store' || BLOCKS[n.id].pad)) continue;
      const [x, , z] = k.split(',').map(Number);
      if (world.chunkAt(x, z)) this.store.delete(k);
    }
    for (const k of this.heat.keys()) {
      if (nodes.get(k)?.reactor) continue;
      const [x, , z] = k.split(',').map(Number);
      if (world.chunkAt(x, z)) this.heat.delete(k);
    }
    const nets = [];
    for (const start of nodes.values()) {
      if (start.net !== null) continue;
      const net = { supply: 0, demand: 0, share: 0, gens: 0, users: 0, stores: 0, stored: 0, give: 0, take: 0, parts: [] };
      start.net = nets.length;
      const queue = [start];
      while (queue.length) {
        const n = queue.pop();
        net.parts.push(n);
        const steps = n.role === 'wire' ? [...SIDES, ...WIRE_STEPS] : SIDES;
        for (const [dx, dy, dz] of steps) {
          const m = nodes.get(key(n.x + dx, n.y + dy, n.z + dz));
          if (!m || m.net !== null) continue;
          if (dy && (dx || dz)) {
            // up or down a block: wire to wire only, round the edge of a block rather than through it
            if (n.role !== 'wire' || m.role !== 'wire') continue;
            if (world.isSolid(dy > 0 ? n.x : m.x, n.y + Math.max(dy, 0), dy > 0 ? n.z : m.z)) continue;
          }
          m.net = start.net;
          queue.push(m);
        }
      }
      // (v32) the wires and cables carry only so much: the weakest of them decides what reaches the machines
      net.carry = Infinity;
      for (const n of net.parts) if (n.role === 'wire' || n.role === 'cable') net.carry = Math.min(net.carry, n.carry ?? WIRE_CARRY);
      const stores = [];
      for (const n of net.parts) {
        if (n.role === 'gen') { n.made = this.made(n, world, kinetics, stations); net.supply += n.made; net.gens++; }
        else if (n.role === 'use') { net.users++; n.want = this.wants(n, stations, kinetics); if (n.want) net.demand += n.draw; }
        else if (n.role === 'store') { stores.push(n); net.stores++; net.stored += this.store.get(key(n.x, n.y, n.z)) ?? 0; }
      }
      // grid batteries: make up what's short, or soak up what's spare
      const k = (n) => key(n.x, n.y, n.z);
      if (net.demand > net.supply) {
        const full = stores.filter((n) => (this.store.get(k(n)) ?? 0) > 1e-6);
        net.give = Math.min(net.demand - net.supply, STORE_RATE * full.length);
        for (const n of full) n.flow = -net.give / full.length;
      } else if (net.supply > net.demand) {
        const room = stores.filter((n) => (this.store.get(k(n)) ?? 0) < STORE_CAP - 1e-6);
        net.take = Math.min(net.supply - net.demand, STORE_RATE * room.length);
        for (const n of room) n.flow = net.take / room.length;
      }
      const have = Math.min(net.supply + net.give, net.carry);
      net.share = net.demand > 0 ? Math.min(1, have / net.demand) : have > 0 ? 1 : 0;
      nets.push(net);
    }
    this.nodes = nodes;
    this.nets = nets;
  }

  netAt(x, y, z) { const n = this.nodes.get(key(x, y, z)); return n ? this.nets[n.net] : null; }

  // How fast an electric machine runs (0 when it has no power): its speed x the network's share.
  speedAt(x, y, z) {
    const n = this.nodes.get(key(x, y, z));
    if (!n || n.role !== 'use') return 0;
    return (n.speed ?? 1) * this.nets[n.net].share;
  }

  // Is the network at (x, y, z) short of power (its machines want more than it has)?
  shortAt(x, y, z) { const net = this.netAt(x, y, z); return !!net && net.demand > Math.min(net.supply + net.give, net.carry ?? Infinity) + 1e-6; }
  // Has it power to spare (making more than its machines use)?
  spareAt(x, y, z) { const net = this.netAt(x, y, z); return !!net && net.supply > net.demand + 1e-6; }

  // Take power-seconds out of a teleport pad; false if it hasn't that much.
  drawPad(x, y, z, amount) {
    const k = key(x, y, z), have = this.store.get(k) ?? 0;
    if (have < amount - 1e-6) return false;
    this.store.set(k, have - amount);
    return true;
  }
  padCharge(x, y, z) { return (this.store.get(key(x, y, z)) ?? 0) / PAD_CAP; }

  // A line about the network an electric block is on, for its panel or when it's tapped.
  statusAt(x, y, z) {
    const n = this.nodes.get(key(x, y, z));
    if (!n) return 'Not connected';
    const net = this.nets[n.net];
    if (n.reactor) {
      const heat = this.heat.get(key(x, y, z)) ?? 0;
      if (heat >= REACTOR_HOT && n.made) return `Heat ${Math.round(heat / MELTDOWN * 100)}%! DANGER: cool it with more water, take rods out or give it a signal. Making ${fmt(n.made)} power`;
      if (heat >= REACTOR_HOT) return `Heat ${Math.round(heat / MELTDOWN * 100)}%: stopped, and cooling down (water round it cools it faster)`;
      if (!n.made) return `Heat ${Math.round(heat / MELTDOWN * 100)}%. ${this.hooks.signalAt?.(x, y, z) ? 'Stopped: a signal has its control rods in' : 'Idle: put fuel rods in'}`;
    }
    if (n.role === 'gen' && !n.made) {
      return n.geo ? 'Cold: a geothermal generator needs lava against it' : n.solar ? 'Dark: a solar panel needs open sky and daylight' : n.wind ? 'Becalmed: a wind turbine needs the 8 blocks around it clear'
        : 'Still: turn a shaft or gear against it to make electricity';
    }
    let pre = '';
    if (n.reactor) pre = `Heat ${Math.round((this.heat.get(key(x, y, z)) ?? 0) / MELTDOWN * 100)}%. `;
    if (n.role === 'gen') pre += `Making ${fmt(n.made)} power. `;
    if (n.role === 'store') {
      const e = this.store.get(key(x, y, z)) ?? 0;
      pre = `${Math.round(e / STORE_CAP * 100)}% full${n.flow > 1e-6 ? `, charging at ${fmt(n.flow)}` : n.flow < -1e-6 ? `, giving ${fmt(-n.flow)}` : ''}. `;
    }
    if (BLOCKS[n.id]?.pad) pre = `${Math.round(this.padCharge(x, y, z) * 100)}% charged. `;
    const stored = net.stores ? ` (batteries ${Math.round(net.stored / (STORE_CAP * net.stores) * 100)}% full)` : '';
    if (!net.gens && !net.stored) return `${pre}No power: join it to a generator with electrum wire or cable`;
    if (!net.supply && !net.give) return `${pre}No power: the generators aren't making any${stored}`;
    if (net.demand > net.carry + 1e-6 && net.supply + net.give > net.carry + 1e-6) {
      return `${pre}Wire limit: the machines want ${fmt(net.demand)}, but the wires carry only ${fmt(net.carry)}, so everything runs at ${Math.round(net.share * 100)}%${net.carry < INSULATED_CARRY ? ' (insulated wire carries twice as much)' : ''}${stored}`;
    }
    if (net.demand > net.supply + net.give + 1e-6) return `${pre}Short of power: needs ${fmt(net.demand)}, has ${fmt(net.supply + net.give)}, so everything runs at ${Math.round(net.share * 100)}%${stored}`;
    if (net.give > 1e-6) return `${pre}Using ${fmt(net.demand)} power: ${fmt(net.supply)} made, ${fmt(net.give)} from the batteries${stored}`;
    return `${pre}Using ${fmt(net.demand)} of ${fmt(net.supply)} power${stored}`;
  }

  // Tapping an electric lamp switches it between always on and on only with a signal.
  toggleLampMode(x, y, z) {
    const k = key(x, y, z);
    if (this.signalLamps.has(k)) this.signalLamps.delete(k); else this.signalLamps.add(k);
    this.timer = 0;
    return this.signalLamps.has(k);
  }

  // hooks: { setBlock(x, y, z, id), signalAt(x, y, z), daylight(), raining(), wants(node) -> bool | undefined }
  update(dt, world, kinetics, stations, hooks) {
    Object.assign(this.hooks, hooks);
    this.timer -= dt;
    if (this.timer <= 0 || world.electricChanged) {
      world.electricChanged = false;
      this.timer = SOLVE_EVERY;
      this.solve(world, kinetics, stations);
      // lamps light while they've at least half the power they want (and, if they're set to, a signal)
      for (const n of this.nodes.values()) {
        if (n.id !== ELECTRIC_LAMP && n.id !== ELECTRIC_LAMP + 1) continue;
        const lit = n.want && this.nets[n.net].share >= 0.5;
        if (lit !== (n.id === ELECTRIC_LAMP + 1)) { n.id = ELECTRIC_LAMP + (lit ? 1 : 0); hooks.setBlock(n.x, n.y, n.z, n.id); }
      }
    }
    for (const n of this.nodes.values()) {
      const k = key(n.x, n.y, n.z);
      // grid batteries fill and empty
      if (n.role === 'store' && n.flow) this.store.set(k, Math.max(0, Math.min(STORE_CAP, (this.store.get(k) ?? 0) + n.flow * dt)));
      if (n.role !== 'use' || !n.want) continue;
      const share = this.nets[n.net].share;
      if (!share) continue;
      if (BLOCKS[n.id].pad) {
        // teleport pads charge up, and glow when they're full enough to send you
        const e = Math.min(PAD_CAP, (this.store.get(k) ?? 0) + n.draw * share * dt);
        this.store.set(k, e);
        if (e >= PAD_CAP - 1e-6) n.want = false;
        continue;
      }
      // wireless chargers fill what you carry
      if (n.wireless) { if (!hooks.wireless?.(n, n.draw * share * CHARGE_RATE * dt)) n.want = false; continue; }
      // chargers fill what's in them
      if (stationKind(n.id) !== 'charger') continue;
      const s = stations.map.get(k)?.inputs[0];
      if (!s?.wear) continue;
      s.wear = Math.max(0, s.wear - n.draw * share * CHARGE_RATE * dt);
      if (!s.wear) { delete s.wear; n.want = false; }
    }
    // reactors burn their rods and heat up
    for (const n of this.nodes.values()) if (n.reactor) this.tickReactor(n, dt, world, stations, hooks);
    // pads show when they've enough to send you
    for (const n of this.nodes.values()) {
      if (!BLOCKS[n.id].pad) continue;
      const ready = (this.store.get(key(n.x, n.y, n.z)) ?? 0) >= PAD_PLAYER - 1e-6;
      if (ready !== (n.id === TELEPAD + 1)) { n.id = TELEPAD + (ready ? 1 : 0); hooks.setBlock(n.x, n.y, n.z, n.id); }
    }
  }

  // A reactor's rods burn down while they make power, heating it; water touching it carries heat away.
  // hooks.meltdown(x, y, z) when it gets too hot; hooks.alarm(x, y, z) every second or so while it's hot.
  tickReactor(n, dt, world, stations, hooks) {
    const k = key(n.x, n.y, n.z);
    let rods = 0;
    if (n.made > 0) {
      const st = stations.map.get(k);
      for (let i = 0; st && i < st.inputs.length; i++) {
        const s = st.inputs[i];
        if (!isFuelRod(s?.id)) continue;
        rods++;
        s.wear = (s.wear ?? 0) + dt;
        if (s.wear >= maxWear(s.id)) { st.inputs[i] = { id: SPENT_ROD, count: 1 }; this.timer = 0; } // burnt out: nuclear waste
      }
    }
    // water, ice and packed ice touching it carry heat away; ice melts while the reactor's running
    let cool = REACTOR_COOL;
    for (const [dx, dy, dz] of SIDES) {
      const x = n.x + dx, y = n.y + dy, z = n.z + dz, id = world.get(x, y, z);
      if (id === PACKED_ICE) cool += PACKED_ICE_COOL;
      else if (id === ICE) { cool += ICE_COOL; if (rods && Math.random() < dt / 120) hooks.setBlock(x, y, z, WATER); }
      else if (world.isWater(x, y, z)) cool += WATER_COOL;
    }
    const heat = Math.max(0, (this.heat.get(k) ?? 0) + (rods * REACTOR_HEAT - cool) * dt);
    if (heat >= MELTDOWN) {
      this.heat.delete(k);
      this.timer = 0;
      hooks.meltdown?.(n.x, n.y, n.z);
      return;
    }
    if (heat > 0) this.heat.set(k, heat); else this.heat.delete(k);
    const hot = heat >= REACTOR_HOT;
    if (hot !== (n.id === REACTOR + 1)) { n.id = REACTOR + (hot ? 1 : 0); hooks.setBlock(n.x, n.y, n.z, n.id); }
    if (hot && (n.alarm = (n.alarm ?? 0) - dt) <= 0) { n.alarm = 1; hooks.alarm?.(n.x, n.y, n.z, heat / MELTDOWN); }
  }

  serialize() {
    return {
      store: [...this.store].map(([k, v]) => [k, Math.round(v * 10) / 10]), signalLamps: [...this.signalLamps],
      heat: [...this.heat].map(([k, v]) => [k, Math.round(v * 10) / 10]),
    };
  }

  load(o) {
    this.store.clear(); this.signalLamps.clear();
    for (const e of Array.isArray(o?.store) ? o.store : []) {
      if (Array.isArray(e) && typeof e[0] === 'string' && Number.isFinite(e[1])) this.store.set(e[0], Math.max(0, Math.min(STORE_CAP, e[1])));
    }
    for (const k of Array.isArray(o?.signalLamps) ? o.signalLamps : []) if (typeof k === 'string') this.signalLamps.add(k);
    this.heat.clear();
    for (const e of Array.isArray(o?.heat) ? o.heat : []) {
      if (Array.isArray(e) && typeof e[0] === 'string' && Number.isFinite(e[1])) this.heat.set(e[0], Math.max(0, Math.min(MELTDOWN - 1, e[1])));
    }
    this.timer = 0;
  }
}

export const isElectricStation = (kind) => !!STATION_KINDS[kind]?.electric;
