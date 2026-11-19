// Electricity: generators, electrum wire, and the machines that run on it (electric lamps, pulverizers and
// battery chargers).
//
// Electric blocks join up when they touch (any face), and through electrum wire, which joins like copper
// wire does (side by side, or up or down a block round an edge). Each joined set is a network:
//  - every generator in it makes GEN_POWER for each 1x its shaft turns it at (see kinetics.js);
//  - each machine takes its draw (ELECTRIC_DRAW) while it has work: a lamp always, a pulverizer while
//    it has something to pulverize, a charger while what's in it isn't full.
// When the generators make less than the machines want, everything runs on the share there is: a
// pulverizer works that much slower, a charger fills that much slower, and lamps go out below half.
import { BLOCKS, GEN_POWER, ELECTRIC_LAMP, CHARGE_RATE, chargeCap, stationKind } from './blocks.js';
import { STATION_KINDS } from './stations.js';
import { CHUNK } from './terrain.js';

const SOLVE_EVERY = 0.25; // seconds between working the networks out again
const key = (x, y, z) => `${x},${y},${z}`;
const SIDES = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
// wire to wire: up or down a block beside it, as well as straight on
const WIRE_STEPS = [[1, 1, 0], [-1, 1, 0], [0, 1, 1], [0, 1, -1], [1, -1, 0], [-1, -1, 0], [0, -1, 1], [0, -1, -1]];
const fmt = (n) => (Math.round(n * 10) / 10).toString();

export class Electric {
  constructor() {
    this.nodes = new Map(); // "x,y,z" -> { x, y, z, id, role, draw, net }
    this.nets = []; // { supply, demand, share, gens, users }
    this.timer = 0;
  }

  // Does an electric machine at (x, y, z) want power right now?
  wants(n, stations) {
    if (n.role !== 'use') return false;
    const kind = stationKind(n.id);
    if (!kind) return true; // a lamp
    const st = stations.map.get(key(n.x, n.y, n.z));
    if (!st) return false;
    if (kind === 'charger') { const s = st.inputs[0]; return !!s && chargeCap(s.id) > 0 && (s.wear ?? 0) > 0; }
    return !!stations.recipeFor(st);
  }

  solve(world, kinetics, stations) {
    const nodes = new Map();
    for (const c of world.chunks.values()) {
      for (const li of c.machines) {
        const def = BLOCKS[c.data[li]];
        if (!def?.electric) continue;
        const x = c.cx * CHUNK + (li & 15), z = c.cz * CHUNK + ((li >> 4) & 15), y = li >> 8;
        nodes.set(key(x, y, z), { x, y, z, id: c.data[li], ...def.electric, draw: def.electric.draw ?? 0, net: null });
      }
    }
    const nets = [];
    for (const start of nodes.values()) {
      if (start.net !== null) continue;
      const net = { supply: 0, demand: 0, share: 0, gens: 0, users: 0, parts: [] };
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
      for (const n of net.parts) {
        if (n.role === 'gen') { n.made = GEN_POWER * kinetics.powerAt(n.x, n.y, n.z); net.supply += n.made; net.gens++; }
        else if (n.role === 'use') { net.users++; n.want = this.wants(n, stations); if (n.want) net.demand += n.draw; }
      }
      net.share = net.demand > 0 ? Math.min(1, net.supply / net.demand) : net.supply > 0 ? 1 : 0;
      nets.push(net);
    }
    this.nodes = nodes;
    this.nets = nets;
  }

  // How fast an electric machine runs (0 when it has no power): its speed x the network's share.
  speedAt(x, y, z) {
    const n = this.nodes.get(key(x, y, z));
    if (!n || n.role !== 'use') return 0;
    return (n.speed ?? 1) * this.nets[n.net].share;
  }

  // A line about the network an electric block is on, for its panel or when it's tapped.
  statusAt(x, y, z) {
    const n = this.nodes.get(key(x, y, z));
    if (!n) return 'Not connected';
    const net = this.nets[n.net];
    if (n.role === 'gen' && !n.made) return 'Still: turn a shaft or gear against it to make electricity';
    const gen = n.role === 'gen' ? `Making ${fmt(n.made)} power. ` : '';
    if (!net.gens) return `${gen}No power: join it to a generator with electrum wire`;
    if (!net.supply) return `${gen}No power: the generators aren't turning`;
    if (net.demand > net.supply + 1e-6) return `${gen}Short of power: needs ${fmt(net.demand)}, the generators make ${fmt(net.supply)}, so everything runs at ${Math.round(net.share * 100)}%`;
    return `${gen}Using ${fmt(net.demand)} of ${fmt(net.supply)} power`;
  }

  // hooks: { setBlock(x, y, z, id) }
  update(dt, world, kinetics, stations, hooks) {
    this.timer -= dt;
    if (this.timer <= 0 || world.electricChanged) {
      world.electricChanged = false;
      this.timer = SOLVE_EVERY;
      this.solve(world, kinetics, stations);
      // lamps light while they've at least half the power they want
      for (const n of this.nodes.values()) {
        if (n.id !== ELECTRIC_LAMP && n.id !== ELECTRIC_LAMP + 1) continue;
        const lit = this.nets[n.net].share >= 0.5;
        if (lit !== (n.id === ELECTRIC_LAMP + 1)) { n.id = ELECTRIC_LAMP + (lit ? 1 : 0); hooks.setBlock(n.x, n.y, n.z, n.id); }
      }
    }
    // chargers fill what's in them
    for (const n of this.nodes.values()) {
      if (n.role !== 'use' || !n.want || stationKind(n.id) !== 'charger') continue;
      const share = this.nets[n.net].share;
      const s = stations.map.get(key(n.x, n.y, n.z))?.inputs[0];
      if (!share || !s?.wear) continue;
      s.wear = Math.max(0, s.wear - n.draw * share * CHARGE_RATE * dt);
      if (!s.wear) { delete s.wear; n.want = false; }
    }
  }
}

export const isElectricStation = (kind) => !!STATION_KINDS[kind]?.electric;
