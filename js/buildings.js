// Village buildings (v50, villages stage 2): houses with beds, a church, a smithy, a railsmith's, a machine shop,
// guard towers and market stalls, in the materials of the land and the size of the place.
//
// Each building stands on a plot by a road (see villages.js) and is drawn through `put(x, y, z, id)`, so the same
// code builds it into a chunk as the world is made (`put` keeps to the chunk) and into the loaded world when a
// village grows. A building is { kind, x, y, z, face, style, ... }: (x, z) the middle of its plot, y its floor,
// `face` the way out to the road.
//
// Inside a building, positions are local: i runs along the road (-3..3) and k back from it (-3 is the plot's front
// row, by the road, and 3 its back row); dy is the height above the floor.
import {
  AIR, PLANKS, LOG, COBBLE, BRICKS, CLAY_BRICKS, SANDSTONE, CUT_SANDSTONE, FIRE_BRICKS, GRAVEL, GLASS_PANE, STAINED_PANE,
  FURN_TABLE, CHEST, CHAIR, BED, BED_FOOT, TORCH_WALL_W, LADDER, LANTERN, CANDLE_BLOCK, DYED_CARPET, WALL,
  SMELTER, ANVIL, BARREL, CRUSHER, SAW, MILLSTONE, GEARBOX, MARKET_STALL, HAY_BALE, WINDOW_BOX,
  FACING_DIRS, doorId, slabId, stairId, railId,
} from './blocks.js';

// Shape materials (slabs and stairs): see SHAPE_MATS in blocks.js
const M_PLANKS = 0, M_BRICKS = 3, M_CLAY = 4, M_SAND = 5;
// Wall materials (wall posts): see WALL_MATS
const W_COBBLE = 0, W_BRICKS = 1, W_SAND = 3;

const facingOf = (dx, dz) => FACING_DIRS.findIndex(([a, b]) => a === dx && b === dz);
// stairs whose tall side is toward (dx, dz)
const STAIR_UP = { '0,-1': 0, '1,0': 1, '0,1': 2, '-1,0': 3 };
const stairUp = (mat, dx, dz) => stairId(mat, STAIR_UP[`${dx},${dz}`]);
// a torch fixed to the wall toward (dx, dz)
const torchOn = (dx, dz) => TORCH_WALL_W + (dx < 0 ? 0 : dx > 0 ? 1 : dz < 0 ? 2 : 3);

// What a place's houses are built of. The desert builds in sandstone with flat roofs; elsewhere hamlets and villages
// build in wood, towns in wood, brick and stone, and cities in brick and stone brick. `roof`: the stairs' material
// (null: flat).
const STYLES = {
  timber: { wall: PLANKS, corner: LOG, floor: PLANKS, base: COBBLE, roof: M_PLANKS, cap: M_PLANKS },
  brick: { wall: CLAY_BRICKS, corner: LOG, floor: PLANKS, base: COBBLE, roof: M_PLANKS, cap: M_PLANKS },
  stone: { wall: COBBLE, corner: LOG, floor: PLANKS, base: COBBLE, roof: M_CLAY, cap: M_CLAY },
  tiled: { wall: PLANKS, corner: LOG, floor: PLANKS, base: COBBLE, roof: M_CLAY, cap: M_CLAY },
  manor: { wall: BRICKS, corner: COBBLE, floor: PLANKS, base: COBBLE, roof: M_CLAY, cap: M_CLAY },
  redbrick: { wall: CLAY_BRICKS, corner: BRICKS, floor: PLANKS, base: BRICKS, roof: M_BRICKS, cap: M_BRICKS },
  desert: { wall: SANDSTONE, corner: CUT_SANDSTONE, floor: CUT_SANDSTONE, base: SANDSTONE, roof: null, cap: M_SAND },
  church: { wall: BRICKS, corner: COBBLE, floor: BRICKS, base: COBBLE, roof: M_BRICKS, cap: M_BRICKS },
  sandchurch: { wall: CUT_SANDSTONE, corner: SANDSTONE, floor: CUT_SANDSTONE, base: SANDSTONE, roof: M_SAND, cap: M_SAND },
};
const STYLE_CHOICES = {
  hamlet: ['timber'], village: ['timber', 'timber', 'tiled'], town: ['timber', 'brick', 'stone', 'tiled'], city: ['brick', 'manor', 'redbrick', 'tiled'],
};
export function houseStyle(size, biome, roll) {
  if (biome === 'desert') return 'desert';
  const c = STYLE_CHOICES[size] ?? STYLE_CHOICES.village;
  return c[Math.floor(roll * c.length) % c.length];
}

// Local placement for a building: put(i, dy, k, id) and the world directions of its front, back and sides.
function frame(put, b) {
  const [fx, fz] = b.face, ax = -fz, az = fx; // `a`: along the road, toward +i
  const wx = (i, k) => b.x + ax * i - fx * k, wz = (i, k) => b.z + az * i - fz * k;
  return {
    put: (i, dy, k, id) => put(wx(i, k), b.y + dy, wz(i, k), id),
    at: (i, k) => [wx(i, k), wz(i, k)],
    front: [fx, fz], back: [-fx, -fz], right: [ax, az], left: [-ax, -az],
  };
}
// Floor, walls (with corners), windows and a roof over a w x d box (half-widths hw, hd, centred at i = 0, k = k0).
// Returns the top of the walls (dy).
function shell(F, st, { hw, hd, k0 = 0, height = 3, windows = [], door = true, roofAlong = 'i', floorAt = [] }) {
  const P = F.put;
  for (let k = -hd; k <= hd; k++) for (let i = -hw; i <= hw; i++) {
    const kk = k + k0, edge = Math.abs(i) === hw || Math.abs(k) === hd, corner = Math.abs(i) === hw && Math.abs(k) === hd;
    P(i, 0, kk, edge ? st.base : st.floor);
    for (let dy = 1; dy <= height; dy++) P(i, dy, kk, corner ? st.corner : edge ? st.wall : floorAt.includes(dy) ? st.floor : AIR);
  }
  for (const [i, dy, k] of windows) P(i, dy, k + k0, GLASS_PANE);
  if (door) {
    const f = F.front[1] ? 0 : 1;
    P(0, 1, -hd + k0, doorId(f, false, false));
    P(0, 2, -hd + k0, doorId(f, false, true));
  }
  roof(F, st, { hw, hd, k0, top: height, along: roofAlong });
  return height;
}

// A roof on walls whose top is at `top`: a gable with its ridge along i (or along k), or flat with a low parapet.
function roof(F, st, { hw, hd, k0 = 0, top, along = 'i', open = false }) {
  const P = F.put;
  if (st.roof === null) {
    for (let k = -hd; k <= hd; k++) for (let i = -hw; i <= hw; i++) {
      P(i, top + 1, k + k0, st.wall);
      if (Math.abs(i) === hw || Math.abs(k) === hd) P(i, top + 2, k + k0, slabId(st.cap));
    }
    return;
  }
  // across: the half-width the roof slopes over; run: the half-length of the ridge
  const across = along === 'i' ? hd : hw, run = along === 'i' ? hw : hd;
  const cell = (u, r) => (along === 'i' ? [r, u] : [u, r]); // u: across the slope, r: along the ridge -> (i, k)
  const up = (s) => { const d = along === 'i' ? (s < 0 ? F.back : F.front) : (s < 0 ? F.right : F.left); return d; };
  for (let L = 0; L <= across; L++) {
    const dy = top + 1 + L, edge = across - L;
    for (let r = -run; r <= run; r++) {
      if (edge === 0) { const [i, k] = cell(0, r); P(i, dy, k + k0, slabId(st.cap)); continue; }
      for (const s of [-1, 1]) {
        const [i, k] = cell(s * edge, r), d = up(s);
        P(i, dy, k + k0, stairUp(st.roof, d[0], d[1]));
      }
      for (let u = -edge + 1; u <= edge - 1; u++) {
        const [i, k] = cell(u, r), gable = Math.abs(r) === run;
        P(i, dy, k + k0, gable ? st.wall : L === 0 && !open ? st.floor : AIR);
      }
    }
  }
}

// A bed: its head at (i, k), its foot one step toward `dir`.
function bed(F, i, dy, k, dir, beds) {
  const d = F[dir], f = facingOf(d[0], d[1]);
  const [di, dk] = dir === 'front' ? [0, -1] : dir === 'back' ? [0, 1] : dir === 'right' ? [1, 0] : [-1, 0];
  F.put(i, dy, k, BED + f);
  F.put(i + di, dy, k + dk, BED_FOOT + f);
  beds?.push(F.at(i, k).concat(dy));
}
const torch = (F, i, dy, k, wall) => F.put(i, dy, k, torchOn(...F[wall]));
const path = (F, st) => F.put(0, 0, -3, st.roof === null ? CUT_SANDSTONE : GRAVEL);

// ---------- the buildings ----------

// A home. `size` 'small' (5 x 5, one bed), 'long' (7 x 5, two beds) or 'tall' (5 x 5 on two floors, two beds).
function house(F, st, b, out) {
  const beds = [];
  if (b.size === 'long') {
    shell(F, st, { hw: 3, hd: 2, windows: [[-2, 2, -2], [2, 2, -2], [-3, 2, 0], [3, 2, 0], [-1, 2, 2], [1, 2, 2]] });
    bed(F, -2, 1, 1, 'front', beds); bed(F, 2, 1, 1, 'front', beds);
    F.put(0, 1, 1, FURN_TABLE); F.put(-1, 1, 1, CHEST); F.put(1, 1, 1, BARREL);
    torch(F, 0, 2, 1, 'back'); torch(F, -2, 3, -1, 'front'); torch(F, 2, 3, -1, 'front');
  } else if (b.size === 'tall') {
    shell(F, st, { hw: 2, hd: 2, height: 7, floorAt: [4], windows: [[-1, 2, -2], [1, 2, -2], [-2, 2, 0], [2, 2, 0], [-1, 6, -2], [1, 6, -2], [-2, 6, 0], [2, 6, 0], [0, 6, 2]] });
    const lf = facingOf(...F.front); // (a ladder faces away from its wall)
    for (let dy = 1; dy <= 4; dy++) F.put(1, dy, 1, LADDER + lf);
    F.put(-1, 1, 1, FURN_TABLE); F.put(-1, 1, 0, CHEST); F.put(-1, 1, -1, CHAIR + facingOf(...F.back));
    torch(F, 0, 2, 1, 'back');
    bed(F, -1, 5, 1, 'front', beds); bed(F, 1, 5, -1, 'left', beds);
    torch(F, 0, 6, 1, 'back');
  } else {
    shell(F, st, { hw: 2, hd: 2, windows: [[-1, 2, -2], [1, 2, -2], [-2, 2, 0], [2, 2, 0], [0, 2, 2]] });
    bed(F, -1, 1, 1, 'front', beds);
    F.put(1, 1, 0, FURN_TABLE); F.put(1, 1, 1, CHEST);
    torch(F, 0, 2, 1, 'back');
  }
  // a window box of flowers under a front window, now and then
  if (b.flowers) F.put(b.size === 'long' ? -2 : -1, 1, -3, WINDOW_BOX + facingOf(...F.back));
  path(F, st);
  if (out) { out.beds = beds; out.door = [F.front[0] * 2, F.front[1] * 2]; }
}

// The church: a nave with a steep roof open to the rafters, pews, an altar with candles, coloured windows, and a
// square tower over the door with a lantern at the top.
function church(F, st, b) {
  const P = F.put;
  // the nave: 7 wide, 6 deep (k -2..3), walls 4 high, roof ridge front to back
  for (let k = -2; k <= 3; k++) for (let i = -3; i <= 3; i++) {
    const edge = Math.abs(i) === 3 || k === -2 || k === 3, corner = Math.abs(i) === 3 && (k === -2 || k === 3);
    P(i, 0, k, edge ? st.base : st.floor);
    for (let dy = 1; dy <= 4; dy++) P(i, dy, k, corner ? st.corner : edge ? st.wall : AIR);
  }
  for (const s of [-3, 3]) for (const k of [0, 2]) for (const dy of [2, 3]) P(s, dy, k, STAINED_PANE + (b.glass ?? 3));
  for (const dy of [2, 3]) P(0, dy, 3, STAINED_PANE + (b.glass2 ?? 4));
  // roof: ridge along k, sloping over i, open inside; a lantern hangs from it
  for (let L = 0; L <= 3; L++) {
    const dy = 5 + L, edge = 3 - L;
    for (let k = -2; k <= 3; k++) {
      if (edge === 0) { P(0, dy, k, slabId(st.cap)); continue; }
      P(-edge, dy, k, stairUp(st.roof, ...F.right)); P(edge, dy, k, stairUp(st.roof, ...F.left));
      for (let i = -edge + 1; i <= edge - 1; i++) P(i, dy, k, k === -2 || k === 3 ? st.wall : AIR);
    }
  }
  // pews facing the altar, a carpet up the aisle, the altar and candles
  const pew = stairUp(M_PLANKS, ...F.front);
  for (const i of [-2, -1, 1, 2]) P(i, 1, 1, pew);
  for (const i of [-2, 2]) P(i, 1, 0, pew);
  for (let k = -1; k <= 2; k++) P(0, 1, k, DYED_CARPET + 2);
  P(0, 1, 2, slabId(M_BRICKS, true)); P(0, 2, 2, CANDLE_BLOCK);
  P(-1, 1, 2, CANDLE_BLOCK); P(1, 1, 2, CANDLE_BLOCK);
  torch(F, -2, 3, 1, 'left'); torch(F, 2, 3, 1, 'right');
  // the tower: 3 x 3 over the door (k -2..0), up to dy 10, open into the nave
  for (let k = -2; k <= 0; k++) for (let i = -1; i <= 1; i++) {
    const wall = Math.abs(i) === 1 || k !== -1;
    for (let dy = 1; dy <= 10; dy++) {
      if (k === 0 && i === 0 && dy <= 3) { P(i, dy, k, AIR); continue; }
      P(i, dy, k, wall ? (Math.abs(i) === 1 && k !== -1 ? st.corner : st.wall) : AIR);
    }
  }
  for (const [i, k] of [[0, -2], [-1, -1], [1, -1]]) P(i, 8, k, GLASS_PANE); // the belfry's openings
  P(0, 8, -2, AIR); P(0, 9, -2, GLASS_PANE);
  for (let k = -2; k <= 0; k++) for (let i = -1; i <= 1; i++) P(i, 11, k, Math.abs(i) === 1 && k !== -1 ? WALL + (st.roof === M_SAND ? W_SAND : W_BRICKS) : k === -1 && i === 0 ? LANTERN : slabId(st.cap));
  const f = F.front[1] ? 0 : 1;
  P(0, 1, -2, doorId(f, false, false)); P(0, 2, -2, doorId(f, false, true));
  path(F, st);
}

// The smithy: open to the street, with smelters by a fire-brick chimney, an anvil, a work table and a chest.
function smithy(F, st, b) {
  const P = F.put;
  for (let k = -2; k <= 2; k++) for (let i = -3; i <= 3; i++) {
    const back = k === 2, side = Math.abs(i) === 3 && k >= 0, post = Math.abs(i) === 3 && (k === -2 || k === 2);
    P(i, 0, k, COBBLE);
    for (let dy = 1; dy <= 3; dy++) P(i, dy, k, post ? st.corner : back || side ? st.wall : AIR);
  }
  roof(F, st, { hw: 3, hd: 2, top: 3 });
  const sf = facingOf(...F.front);
  P(-2, 1, 1, SMELTER + sf); P(-1, 1, 1, SMELTER + sf);
  for (let dy = 1; dy <= 7; dy++) P(-2, dy, 2, FIRE_BRICKS); // the chimney
  P(1, 1, 0, ANVIL); P(2, 1, 1, CHEST); P(2, 1, 0, FURN_TABLE); P(1, 1, 1, BARREL);
  torch(F, 0, 2, 1, 'back');
  for (const i of [-1, 0, 1]) P(i, 0, -3, COBBLE);
  b.spot = F.at(0, 0);
}

// The railsmith's: a workshop with a length of track along the back, a minecart's worth of work on the bench.
function railsmith(F, st, b) {
  shell(F, st, { hw: 3, hd: 2, windows: [[-2, 2, -2], [2, 2, -2], [-3, 2, 0], [3, 2, 0]] });
  const P = F.put, r = F.right[0] ? railId([1, 3]) : railId([0, 2]);
  for (let i = -2; i <= 2; i++) P(i, 1, 1, r);
  P(-2, 1, -1, ANVIL); P(2, 1, -1, CHEST); P(-2, 1, 0, FURN_TABLE); P(2, 1, 0, BARREL);
  torch(F, -1, 3, 1, 'back'); torch(F, 1, 3, 1, 'back');
  path(F, st);
  b.spot = F.at(0, 0);
}

// The machine shop: stone brick, with a crusher, a mill, a saw and a gearbox, and a bench and chest by the door.
function machineShop(F, st, b) {
  const s2 = { ...st, wall: BRICKS, corner: COBBLE, floor: COBBLE, base: COBBLE };
  shell(F, s2, { hw: 3, hd: 2, windows: [[-2, 2, -2], [2, 2, -2], [-3, 2, 0], [3, 2, 0], [0, 2, 2]] });
  const P = F.put, mf = facingOf(...F.front);
  P(-2, 1, 1, CRUSHER + mf); P(-1, 1, 1, GEARBOX); P(1, 1, 1, MILLSTONE); P(2, 1, 1, SAW + mf);
  P(-2, 1, -1, FURN_TABLE); P(2, 1, -1, CHEST);
  torch(F, 0, 3, 1, 'back');
  path(F, st);
  b.spot = F.at(0, 0);
}

// A guard tower: stone, 5 x 5, a ladder up the back wall to a lookout with battlements and a lantern.
function tower(F, st, b) {
  const P = F.put, stone = st.roof === null ? SANDSTONE : COBBLE, post = WALL + (st.roof === null ? W_SAND : W_COBBLE);
  for (let k = -2; k <= 2; k++) for (let i = -2; i <= 2; i++) {
    const edge = Math.abs(i) === 2 || Math.abs(k) === 2;
    P(i, 0, k, stone);
    for (let dy = 1; dy <= 8; dy++) P(i, dy, k, edge ? stone : dy === 8 ? PLANKS : AIR);
    P(i, 9, k, edge ? ((i + k) % 2 === 0 ? post : AIR) : AIR);
    for (let dy = 10; dy <= 11; dy++) P(i, dy, k, AIR);
  }
  for (const [i, k] of [[-2, 0], [2, 0], [0, 2]]) P(i, 6, k, AIR); // arrow slits
  const lf = facingOf(...F.front);
  for (let dy = 1; dy <= 8; dy++) P(0, dy, 1, LADDER + lf);
  P(1, 9, -1, LANTERN);
  const f = F.front[1] ? 0 : 1;
  P(0, 1, -2, doorId(f, false, false)); P(0, 2, -2, doorId(f, false, true));
  torch(F, 0, 3, -1, 'front');
  path(F, st);
}

const BUILD = { house, church, smithy, railsmith, machine: machineShop, tower };

// Build `b` through put(x, y, z, id). Returns what it learnt (a house's beds and door).
export function buildBuilding(put, b) {
  const st = STYLES[b.style] ?? STYLES.timber, out = {};
  BUILD[b.kind]?.(frame(put, b), st, b, out);
  return out;
}

// A market stall on the square, facing `face`, with a barrel or a bale of hay beside it.
export function buildStall(put, s) {
  put(s.x, s.y + 1, s.z, MARKET_STALL + facingOf(s.face[0], s.face[1]));
  if (s.side) put(s.x + s.side[0], s.y + 1, s.z + s.side[1], s.hay ? HAY_BALE : BARREL);
}
