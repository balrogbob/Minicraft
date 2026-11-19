// Signal logic: copper wire and the three logic blocks (inverters, delay blocks and latches).
//
// They're switches like levers (see signalAt in main.js), so whatever they switch on works doors, gates,
// clutches, powered rails and switch rails. Each one is worked out again when something near it changes
// (main.js marks it), a tenth of a second later, so a loop of them can't run away: an inverter that feeds
// itself just flickers on and off, and a delay block in the loop makes a slower clock.
//  - A wire carries its signal along every wire joined to it (side by side, or a block up or down): the
//    whole line is on while anything other than a wire switches it on.
//  - An inverter, a delay block and a latch take their signal from the block behind them and give theirs
//    to the block in front: an inverter while it gets nothing, a delay block what it got a moment ago,
//    and a latch flips over each time its signal comes on.
import { BLOCKS, FACING_DIRS, DELAYS } from './blocks.js';
import { CHUNK } from './terrain.js';

export const LOGIC_TICK = 0.1; // seconds between steps
const MAX_WIRE = 4096; // the longest line of wire worked out at once
const MAX_QUEUE = 32; // changes a delay block can be holding on to
// where a wire can join another: beside it, above or below it, and up or down a block beside it
const WIRE_STEPS = [[1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1], [0, 1, 0], [0, -1, 0],
  [1, 1, 0], [-1, 1, 0], [0, 1, 1], [0, 1, -1], [1, -1, 0], [-1, -1, 0], [0, -1, 1], [0, -1, -1]];
const SIDES = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];

const key = (x, y, z) => `${x},${y},${z}`;

export class Logic {
  constructor() {
    this.dirty = new Set(); // "x,y,z" of logic blocks to work out at the next step
    this.delays = new Map(); // "x,y,z" -> seconds, for delay blocks not on the usual 1 s
    this.queues = new Map(); // "x,y,z" -> [[time, on], ...]: what a delay block will give out, and when
    this.lastIn = new Map(); // "x,y,z" -> the signal a latch or delay block last got
    this.timer = 0;
    this.time = 0;
  }

  mark(x, y, z) { this.dirty.add(key(x, y, z)); }

  // Something changed at (x, y, z): logic blocks within two blocks of it look again.
  near(world, x, y, z) {
    for (let dy = -2; dy <= 2; dy++) for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) {
      if (BLOCKS[world.get(x + dx, y + dy, z + dz)]?.logic) this.mark(x + dx, y + dy, z + dz);
    }
  }

  delayOf(x, y, z) { return this.delays.get(key(x, y, z)) ?? 1; }

  // Tap a delay block: the next setting. Returns it.
  cycleDelay(x, y, z) {
    const k = key(x, y, z), i = DELAYS.indexOf(this.delayOf(x, y, z));
    const d = DELAYS[(i + 1) % DELAYS.length];
    if (d === 1) this.delays.delete(k); else this.delays.set(k, d);
    return d;
  }

  removed(x, y, z) {
    const k = key(x, y, z);
    this.delays.delete(k); this.queues.delete(k); this.lastIn.delete(k);
  }

  // hooks: { feeds(x, y, z, nx, ny, nz, noWire) -> does that neighbour signal this cell,
  //          set(x, y, z, on) -> switch a logic block on or off }
  update(dt, world, hooks) {
    this.time += dt;
    // a chunk that's just loaded: its logic blocks catch up (a clock saved mid-tick starts again)
    for (const c of world.chunks.values()) {
      if (c.logicSeen) continue;
      c.logicSeen = true;
      for (const li of c.logic) this.mark(c.cx * CHUNK + (li & 15), li >> 8, c.cz * CHUNK + ((li >> 4) & 15));
    }
    if ((this.timer -= dt) > 0) return;
    this.timer = LOGIC_TICK;
    const now = this.time;
    // delay blocks whose moment has come
    for (const [k, q] of this.queues) {
      const [x, y, z] = k.split(',').map(Number);
      if (BLOCKS[world.get(x, y, z)]?.logic !== 'delay') { this.queues.delete(k); continue; }
      while (q.length && q[0][0] <= now) hooks.set(x, y, z, q.shift()[1]);
      if (!q.length) this.queues.delete(k);
    }
    const todo = [...this.dirty];
    this.dirty.clear();
    const done = new Set(); // wires already worked out this step
    for (const k of todo) {
      if (done.has(k)) continue;
      const [x, y, z] = k.split(',').map(Number);
      if (!world.chunkAt(x, z)) continue;
      const d = BLOCKS[world.get(x, y, z)];
      if (!d?.logic) continue;
      if (d.logic === 'wire') { this.wire(world, hooks, x, y, z, done); continue; }
      const [fx, fz] = FACING_DIRS[d.facing];
      const input = hooks.feeds(x, y, z, x - fx, y, z - fz, false);
      if (d.logic === 'inverter') { if (input === d.on) hooks.set(x, y, z, !input); continue; }
      const was = this.lastIn.get(k);
      if (d.logic === 'latch') {
        this.lastIn.set(k, input);
        if (input && was === false) hooks.set(x, y, z, !d.on);
        continue;
      }
      // a delay block: what it gets now, it gives out in a moment
      if (input === (was ?? d.on)) { this.lastIn.set(k, input); continue; }
      this.lastIn.set(k, input);
      const q = this.queues.get(k) ?? [];
      if (q.length < MAX_QUEUE) q.push([now + this.delayOf(x, y, z) - 1e-6, input]);
      this.queues.set(k, q);
    }
  }

  // The line of wire through (x, y, z): all on if anything that isn't wire signals any of it, else all off.
  wire(world, hooks, x, y, z, done) {
    const line = [[x, y, z]];
    done.add(key(x, y, z));
    for (let i = 0; i < line.length && line.length < MAX_WIRE; i++) {
      const [wx, wy, wz] = line[i];
      for (const [dx, dy, dz] of WIRE_STEPS) {
        const nx = wx + dx, ny = wy + dy, nz = wz + dz, k = key(nx, ny, nz);
        if (done.has(k) || BLOCKS[world.get(nx, ny, nz)]?.logic !== 'wire') continue;
        // (up or down a block, only round the edge of a block, not through one)
        if (dy && (dx || dz) && world.isSolid(dy > 0 ? wx : nx, wy + Math.max(dy, 0), dy > 0 ? wz : nz)) continue;
        done.add(k);
        line.push([nx, ny, nz]);
      }
    }
    const on = line.some(([wx, wy, wz]) => SIDES.some(([dx, dy, dz]) => hooks.feeds(wx, wy, wz, wx + dx, wy + dy, wz + dz, true)));
    for (const [wx, wy, wz] of line) if (BLOCKS[world.get(wx, wy, wz)].on !== on) hooks.set(wx, wy, wz, on);
  }

  serialize() { return [...this.delays]; }

  load(list) {
    this.delays.clear(); this.queues.clear(); this.lastIn.clear(); this.dirty.clear();
    for (const [k, d] of Array.isArray(list) ? list : []) if (typeof k === 'string' && DELAYS.includes(d)) this.delays.set(k, d);
  }
}
