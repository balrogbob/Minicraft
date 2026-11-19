// The world map: a full-screen view of everywhere you've been, opened with M (or from the menu, or by
// tapping the corner map). Each 16 x 16 chunk you've visited is kept as a little picture: drawn from the
// real blocks while that chunk is loaded, and otherwise (after a reload) from the terrain generator, so
// it shows the lie of the land even where the blocks themselves aren't in memory.
// Drag to pan, pinch or scroll (or use + and -) to zoom, and tap to put down a waypoint or take one away.
import { AIR, isWaterId, GRASS, SAND, SNOW, SNOW_GRASS, ICE, WATER } from './blocks.js';
import { CHUNK, H, SEA_LEVEL, WORLD_CHUNKS } from './terrain.js';
import { chunkKey } from './world.js';

const SNOW_LINE = 46; // (as in terrain.js)

const MAX_EXPLORED = 40000; // chunks remembered (about 10 x 10 km)
const NEW_TILES_PER_FRAME = 80;
const MARK_COLORS = ['#ffd84a', '#5ad1ff', '#ff7ad9', '#7dff6a', '#ff9a3c', '#b28cff'];
const UNEXPLORED = '#2b2620';

export class WorldMap {
  // hooks: { marks(), places(), toggleMark(x, z, near), home(), onClose() }
  constructor(overlay, canvas, minimap, hooks) {
    this.overlay = overlay;
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.mini = minimap; // for its block colours
    this.hooks = hooks;
    this.explored = new Set(); // chunk keys
    this.tiles = new Map(); // chunk key -> { canvas, real }
    this.open = false;
    this.cx = 0; this.cz = 0; // the block at the middle of the screen
    this.scale = 2; // screen pixels per block
    this.pointers = new Map();
    this.bind();
  }

  // Remember every chunk that's loaded now (called every second or so while playing).
  record(world) {
    for (const c of world.chunks.values()) {
      if (this.explored.has(c.key)) continue;
      if (this.explored.size >= MAX_EXPLORED) return;
      this.explored.add(c.key);
    }
  }

  load(keys) {
    this.explored = new Set(Array.isArray(keys) ? keys.filter(Number.isFinite).slice(0, MAX_EXPLORED) : []);
    this.tiles.clear();
  }

  serialize() { return [...this.explored]; }

  show(on, world, player) {
    this.open = on;
    this.overlay.classList.toggle('hidden', !on);
    if (on) {
      this.world = world; this.player = player;
      this.cx = player.pos.x; this.cz = player.pos.z;
      // loaded chunks may have changed since they were last drawn: redraw them from their blocks
      for (const c of world.chunks.values()) this.tiles.delete(c.key);
      this.resize();
    } else this.hooks.onClose?.();
  }

  resize() {
    this.canvas.width = this.canvas.clientWidth;
    this.canvas.height = this.canvas.clientHeight;
  }

  zoom(k, sx = this.canvas.width / 2, sy = this.canvas.height / 2) {
    const before = this.toBlock(sx, sy);
    this.scale = Math.max(0.25, Math.min(8, this.scale * k));
    const after = this.toBlock(sx, sy);
    this.cx += before[0] - after[0]; this.cz += before[1] - after[1];
  }

  centre() { this.cx = this.player.pos.x; this.cz = this.player.pos.z; }

  toBlock(sx, sy) { return [this.cx + (sx - this.canvas.width / 2) / this.scale, this.cz + (sy - this.canvas.height / 2) / this.scale]; }
  toScreen(x, z) { return [(x - this.cx) * this.scale + this.canvas.width / 2, (z - this.cz) * this.scale + this.canvas.height / 2]; }

  bind() {
    const cv = this.canvas;
    cv.addEventListener('pointerdown', (e) => {
      cv.setPointerCapture?.(e.pointerId);
      this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, t: performance.now() });
      if (this.pointers.size === 2) this.pinch = this.spread();
    });
    cv.addEventListener('pointermove', (e) => {
      const p = this.pointers.get(e.pointerId);
      if (!p) return;
      const dx = e.clientX - p.x, dy = e.clientY - p.y;
      p.x = e.clientX; p.y = e.clientY;
      if (this.pointers.size >= 2) {
        const s = this.spread();
        if (this.pinch) this.zoom(s / this.pinch);
        this.pinch = s;
        p.moved = true;
      } else {
        this.cx -= dx / this.scale; this.cz -= dy / this.scale;
        if (Math.hypot(e.clientX - p.sx, e.clientY - p.sy) > 8) p.moved = true;
      }
    });
    const up = (e) => {
      const p = this.pointers.get(e.pointerId);
      if (!p) return;
      this.pointers.delete(e.pointerId);
      if (this.pointers.size < 2) this.pinch = null;
      if (e.type === 'pointerup' && !p.moved && performance.now() - p.t < 400 && this.pointers.size === 0) {
        const r = cv.getBoundingClientRect();
        this.tap(e.clientX - r.left, e.clientY - r.top);
      }
    };
    cv.addEventListener('pointerup', up);
    cv.addEventListener('pointercancel', up);
    cv.addEventListener('wheel', (e) => {
      e.preventDefault();
      const r = cv.getBoundingClientRect();
      this.zoom(e.deltaY < 0 ? 1.2 : 1 / 1.2, e.clientX - r.left, e.clientY - r.top);
    }, { passive: false });
  }

  spread() {
    const [a, b] = [...this.pointers.values()];
    return Math.hypot(a.x - b.x, a.y - b.y) || 1;
  }

  // A tap takes away a waypoint under your finger, or else puts one down there.
  tap(sx, sy) {
    const near = this.hooks.marks().find((w) => { const [mx, my] = this.toScreen(w.x + 0.5, w.z + 0.5); return Math.hypot(mx - sx, my - sy) < 14; });
    const [x, z] = this.toBlock(sx, sy);
    this.hooks.toggleMark(Math.floor(x), Math.floor(z), near);
  }

  // The picture of one chunk, 16 x 16 pixels.
  tile(key, cx, cz) {
    const c = this.world.chunks.get(key);
    const have = this.tiles.get(key);
    if (have && (have.real || !c)) return have;
    if (this.budget-- <= 0) return have ?? null;
    const canvas = have?.canvas ?? document.createElement('canvas');
    canvas.width = canvas.height = CHUNK;
    const ctx = canvas.getContext('2d');
    const img = ctx.createImageData(CHUNK, CHUNK), d = img.data;
    const gen = this.world.generator;
    for (let lz = 0; lz < CHUNK; lz++) {
      let prev = -1;
      for (let lx = 0; lx < CHUNK; lx++) {
        const x = cx * CHUNK + lx, z = cz * CHUNK + lz, i = (lz * CHUNK + lx) * 4;
        let id, y;
        if (c) {
          for (y = H - 1; y >= 0; y--) { id = c.data[lx | (lz << 4) | (y << 8)]; if (id !== AIR) break; }
        } else {
          // from the generator: the ground (or the water over it) as it was first made
          y = gen.height(x, z);
          const biome = gen.biomeAt(x, z);
          // (the same choices as Generator.generateChunk: water below sea level, beaches, deserts, snow)
          if (y < SEA_LEVEL) { id = biome === 'tundra' ? ICE : WATER; y = SEA_LEVEL; } else id = y <= SEA_LEVEL + 1 || biome === 'desert' ? SAND : y >= SNOW_LINE ? SNOW : biome === 'tundra' ? SNOW_GRASS : GRASS;
        }
        let rgb;
        if (isWaterId(id)) rgb = [52, 104, 210];
        else {
          const base = this.mini.colorOf(id);
          let k = 0.8 + (y - SEA_LEVEL) * 0.012;
          if (prev >= 0) k += Math.sign(y - prev) * 0.12;
          k = Math.min(1.35, Math.max(0.55, k));
          rgb = base.map((v) => v * k);
        }
        prev = y;
        d[i] = Math.min(255, rgb[0]); d[i + 1] = Math.min(255, rgb[1]); d[i + 2] = Math.min(255, rgb[2]); d[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    const t = { canvas, real: !!c };
    this.tiles.set(key, t);
    return t;
  }

  draw() {
    if (!this.open) return;
    const cv = this.canvas, ctx = this.ctx;
    if (cv.width !== cv.clientWidth || cv.height !== cv.clientHeight) this.resize();
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = UNEXPLORED;
    ctx.fillRect(0, 0, cv.width, cv.height);
    this.budget = NEW_TILES_PER_FRAME;
    const [x0, z0] = this.toBlock(0, 0), [x1, z1] = this.toBlock(cv.width, cv.height);
    const s = this.scale * CHUNK;
    for (let cz = Math.floor(z0 / CHUNK); cz <= Math.floor(z1 / CHUNK); cz++) {
      for (let cx = Math.floor(x0 / CHUNK); cx <= Math.floor(x1 / CHUNK); cx++) {
        if (cx < 0 || cz < 0 || cx >= WORLD_CHUNKS || cz >= WORLD_CHUNKS) continue;
        const key = chunkKey(cx, cz);
        if (!this.explored.has(key)) continue;
        const t = this.tile(key, cx, cz);
        if (!t) continue;
        const [sx, sy] = this.toScreen(cx * CHUNK, cz * CHUNK);
        ctx.drawImage(t.canvas, Math.floor(sx), Math.floor(sy), Math.ceil(s) + 1, Math.ceil(s) + 1);
      }
    }
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    // home
    const home = this.hooks.home();
    if (home) {
      const [hx, hy] = this.toScreen(home.x + 0.5, home.z + 0.5);
      ctx.fillStyle = '#000'; ctx.fillRect(hx - 5, hy - 5, 10, 10);
      ctx.fillStyle = '#d82020'; ctx.fillRect(hx - 4, hy - 4, 8, 8);
      label(ctx, 'Home', hx, hy - 9);
    }
    // places found with an explorer's map, and buried treasure
    const ICON = { ruin: ['🏛', '#c8b98a'], wreck: ['⚓', '#7fb0d8'], lighthouse: ['🗼', '#ff6060'], volcano: ['🌋', '#ff9040'], village: ['🏠', '#ffd060'], treasure: ['✖', '#e02020'] };
    for (const q of this.hooks.places?.() ?? []) {
      const [qx, qy] = this.toScreen(q.x + 0.5, q.z + 0.5);
      const [ic, col] = ICON[q.kind] ?? ['•', '#fff'];
      if (q.kind === 'treasure') {
        ctx.font = 'bold 20px sans-serif'; ctx.lineWidth = 4; ctx.strokeStyle = '#000'; ctx.strokeText(ic, qx, qy + 7);
        ctx.fillStyle = col; ctx.fillText(ic, qx, qy + 7);
      } else {
        ctx.font = '15px sans-serif'; ctx.fillStyle = col; ctx.fillText(ic, qx, qy + 5);
        ctx.font = 'bold 11px sans-serif'; label(ctx, q.name, qx, qy - 10);
      }
      ctx.font = 'bold 13px sans-serif';
    }
    // waypoints
    this.hooks.marks().forEach((w, i) => {
      const [mx, my] = this.toScreen(w.x + 0.5, w.z + 0.5);
      ctx.beginPath(); ctx.arc(mx, my, 6, 0, Math.PI * 2);
      ctx.fillStyle = MARK_COLORS[i % MARK_COLORS.length]; ctx.fill();
      ctx.lineWidth = 2; ctx.strokeStyle = '#000'; ctx.stroke();
      label(ctx, w.name, mx, my - 10);
    });
    // you
    const p = this.player;
    const [px, py] = this.toScreen(p.pos.x, p.pos.z);
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(Math.atan2(-Math.cos(p.yaw), -Math.sin(p.yaw)));
    ctx.beginPath(); ctx.moveTo(10, 0); ctx.lineTo(-8, -7); ctx.lineTo(-4, 0); ctx.lineTo(-8, 7); ctx.closePath();
    ctx.fillStyle = '#fff'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = '#000'; ctx.stroke();
    ctx.restore();
    // scale bar
    const blocks = [16, 32, 64, 128, 256, 512, 1024, 2048].find((b) => b * this.scale >= 60) ?? 2048;
    ctx.fillStyle = '#fff';
    ctx.fillRect(12, cv.height - 18, blocks * this.scale, 4);
    ctx.textAlign = 'left';
    label(ctx, `${blocks} blocks`, 12, cv.height - 24);
  }
}

function label(ctx, text, x, y) {
  ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,0.75)';
  ctx.strokeText(text, x, y);
  ctx.fillStyle = '#fff'; ctx.fillText(text, x, y);
}
