// The original 128 x 128 world generator, kept only to migrate worlds saved before the
// world became 16k x 16k. It rebuilds the old terrain exactly from the old seed and
// generator version, so the player's saved edits can be applied on top of it.
import { AIR, GRASS, DIRT, STONE, LOG, LEAVES, SAND, COAL_ORE, BEDROCK, WATER } from './blocks.js';
import { mulberry32, makePerlin, SEA_LEVEL } from './terrain.js';

export const LEGACY_W = 128;
const W = LEGACY_W, H = 64;

class LegacyWorld {
  constructor(seed, gen) {
    this.seed = seed;
    this.gen = gen;
    this.data = new Uint8Array(W * W * H);
  }
  idx(x, y, z) { return x + z * W + y * W * W; }
  inBounds(x, y, z) { return x >= 0 && z >= 0 && x < W && z < W && y >= 0 && y < H; }
  get(x, y, z) { return this.inBounds(x, y, z) ? this.data[this.idx(x, y, z)] : AIR; }
  isWater(x, y, z) { return this.get(x, y, z) === WATER; }

  generate() {
    const rand = mulberry32(this.seed);
    const n1 = makePerlin(rand), n2 = makePerlin(rand), n3 = makePerlin(rand);
    const heights = new Int16Array(W * W);
    for (let z = 0; z < W; z++) for (let x = 0; x < W; x++) {
      // "continent" noise decides land vs. lakes/sea; hills and mountains only rise on land
      const cont = n1(x / 70, z / 70, 4);
      const land = cont * 34;
      const detail = n2(x / 18, z / 18, 2) * 3;
      const mountain = Math.max(0, n3(x / 80, z / 80, 3)) * 30 * Math.min(1, Math.max(0, cont * 5));
      let h = Math.round(SEA_LEVEL + 4 + land + detail + mountain);
      h = Math.max(6, Math.min(H - 14, h));
      heights[x + z * W] = h;
      const sandy = h <= SEA_LEVEL + 1;
      for (let y = 0; y <= h; y++) {
        let id;
        if (y === 0) id = BEDROCK;
        else if (y < h - 3) id = rand() < 0.012 && y < h - 5 ? COAL_ORE : STONE;
        else if (sandy) id = SAND;
        else id = y === h ? GRASS : DIRT;
        this.data[this.idx(x, y, z)] = id;
      }
      for (let y = h + 1; y <= SEA_LEVEL; y++) this.data[this.idx(x, y, z)] = WATER;
    }
    if (this.gen >= 2) this.carveCaves();
    // trees
    for (let z = 3; z < W - 3; z++) for (let x = 3; x < W - 3; x++) {
      const h = heights[x + z * W];
      if (this.get(x, h, z) !== GRASS || rand() > 0.014) continue;
      const trunk = 4 + Math.floor(rand() * 3);
      if (h + trunk + 2 >= H) continue;
      this.data[this.idx(x, h, z)] = DIRT;
      for (let y = 1; y <= trunk; y++) this.data[this.idx(x, h + y, z)] = LOG;
      const top = h + trunk;
      for (let y = top - 2; y <= top + 1; y++) {
        const r = y >= top ? 1 : 2;
        for (let dz = -r; dz <= r; dz++) for (let dx = -r; dx <= r; dx++) {
          const corner = Math.abs(dx) === r && Math.abs(dz) === r;
          if (corner && (y === top + 1 || rand() < 0.5)) continue;
          const i = this.idx(x + dx, y, z + dz);
          if (this.data[i] === AIR) this.data[i] = LEAVES;
        }
      }
    }
  }

  // Winding "worm" tunnels: random walks that carve out spheres. They have their own random
  // stream so tree placement is unchanged, and they never cut into water, so lakes don't hang in the air.
  carveCaves() {
    const rand = mulberry32(this.seed ^ 0x2c1b3c6d);
    const touchesWater = (x, y, z) => this.isWater(x, y + 1, z) || this.isWater(x + 1, y, z) ||
      this.isWater(x - 1, y, z) || this.isWater(x, y, z + 1) || this.isWater(x, y, z - 1);
    const carve = (cx, cy, cz, r) => {
      const r2 = r * r;
      for (let y = Math.max(1, Math.floor(cy - r)); y <= Math.ceil(cy + r); y++)
        for (let z = Math.floor(cz - r); z <= Math.ceil(cz + r); z++)
          for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) {
            if (!this.inBounds(x, y, z)) continue;
            const dx = x + 0.5 - cx, dy = (y + 0.5 - cy) * 1.3, dz = z + 0.5 - cz; // squashed: wider than tall
            if (dx * dx + dy * dy + dz * dz > r2) continue;
            const i = this.idx(x, y, z), id = this.data[i];
            if (id === AIR || id === WATER || id === BEDROCK || touchesWater(x, y, z)) continue;
            this.data[i] = AIR;
          }
    };
    for (let w = 0; w < 30; w++) {
      let x = rand() * W, z = rand() * W, y = 6 + rand() * 24;
      let yaw = rand() * Math.PI * 2, pitch = (rand() - 0.5) * 0.6, r = 1.4 + rand() * 0.8;
      const steps = 50 + rand() * 100;
      for (let s = 0; s < steps; s++) {
        carve(x, y, z, r);
        r = Math.max(1.1, Math.min(2.8, r + (rand() - 0.5) * 0.4));
        yaw += (rand() - 0.5) * 0.6;
        pitch = Math.max(-0.8, Math.min(0.8, pitch * 0.85 + (rand() - 0.5) * 0.4));
        x += Math.cos(yaw) * Math.cos(pitch);
        z += Math.sin(yaw) * Math.cos(pitch);
        y += Math.sin(pitch);
        if (y < 3) pitch = Math.abs(pitch);
        if (x < 1 || z < 1 || x >= W - 1 || z >= W - 1) break;
      }
    }
  }

}

// Returns the old world's blocks (index x + z*128 + y*128*128) with the saved edits applied.
export function buildLegacyWorld(save) {
  const w = new LegacyWorld(save.seed, save.gen ?? 1);
  w.generate();
  for (const [i, id] of save.mods ?? []) if (i >= 0 && i < w.data.length) w.data[i] = id;
  return w.data;
}
