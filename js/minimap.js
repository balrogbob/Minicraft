// The map: while you hold one, the land around you (64 blocks each way) is drawn from above in the
// corner of the screen, one pixel per block, shaded by height, with you as an arrow in the middle.
// It is redrawn a few rows at a time, so it costs little each frame.
import { BLOCKS, AIR, isWaterId } from './blocks.js';
import { TILE, ATLAS_COLS } from './textures.js';
import { H, SEA_LEVEL } from './terrain.js';

const R = 64, SIZE = R * 2;
const ROWS_PER_FRAME = 16;
const MARK_COLORS = ['#ffd84a', '#5ad1ff', '#ff7ad9', '#7dff6a', '#ff9a3c', '#b28cff'];

export class MiniMap {
  constructor(canvas, atlas) {
    this.canvas = canvas;
    canvas.width = canvas.height = SIZE;
    this.ctx = canvas.getContext('2d');
    this.img = this.ctx.createImageData(SIZE, SIZE);
    this.row = 0;
    this.visible = false;
    // the average colour of each atlas tile, for the tops of blocks
    const data = atlas.getContext('2d').getImageData(0, 0, atlas.width, atlas.height).data;
    this.tileColor = [];
    for (let t = 0; t < ATLAS_COLS * ATLAS_COLS; t++) {
      const x0 = (t % ATLAS_COLS) * TILE, y0 = Math.floor(t / ATLAS_COLS) * TILE;
      let r = 0, g = 0, b = 0, n = 0;
      for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) {
        const i = ((y0 + y) * atlas.width + x0 + x) * 4;
        if (data[i + 3] < 128) continue;
        r += data[i]; g += data[i + 1]; b += data[i + 2]; n++;
      }
      this.tileColor[t] = n ? [r / n, g / n, b / n] : [0, 0, 0];
    }
    this.blockColor = new Map();
  }

  colorOf(id) {
    let c = this.blockColor.get(id);
    if (!c) {
      const def = BLOCKS[id];
      c = this.tileColor[def.shape === 'cross' ? def.side : def.top] ?? [128, 128, 128];
      if (def.model) {
        const tiles = def.model[0][6];
        c = this.tileColor[typeof tiles === 'number' ? tiles : tiles.top] ?? c;
      }
      this.blockColor.set(id, c);
    }
    return c;
  }

  show(on) {
    if (on === this.visible) return;
    this.visible = on;
    this.canvas.classList.toggle('hidden', !on);
    if (on) { this.row = 0; this.fresh = true; }
  }

  update(world, player, home, marks = []) {
    if (!this.visible) return;
    this.world = world; this.player = player;
    // the whole map at once when it's first shown, then a few rows each frame
    const rows = this.fresh ? SIZE : ROWS_PER_FRAME;
    this.fresh = false;
    for (let k = 0; k < rows; k++) { this.drawRow(this.row); this.row = (this.row + 1) % SIZE; }
    this.ctx.putImageData(this.img, 0, 0);
    // home (your bed, or the start) as a red dot if it's on the map
    const ox = Math.floor(player.pos.x) - R, oz = Math.floor(player.pos.z) - R;
    if (home && home.x - ox >= 0 && home.x - ox < SIZE && home.z - oz >= 0 && home.z - oz < SIZE) {
      this.ctx.fillStyle = '#d82020';
      this.ctx.fillRect(home.x - ox - 1, home.z - oz - 1, 3, 3);
    }
    // marks from signs and beds: a coloured pin and its name, or an arrow at the edge toward one off the map
    const ctx0 = this.ctx;
    ctx0.font = 'bold 8px sans-serif';
    ctx0.textAlign = 'center';
    marks.forEach((w, i) => {
      const color = MARK_COLORS[i % MARK_COLORS.length];
      let mx = w.x - ox, mz = w.z - oz;
      const inside = mx >= 2 && mx < SIZE - 2 && mz >= 2 && mz < SIZE - 2;
      if (!inside) {
        // squash onto the edge, along the line from you
        const dx = mx - R, dz = mz - R, k = (R - 4) / Math.max(Math.abs(dx), Math.abs(dz));
        mx = R + dx * k; mz = R + dz * k;
        ctx0.save();
        ctx0.translate(mx, mz);
        ctx0.rotate(Math.atan2(dz, dx));
        ctx0.beginPath(); ctx0.moveTo(4, 0); ctx0.lineTo(-3, -3); ctx0.lineTo(-3, 3); ctx0.closePath();
        ctx0.fillStyle = color; ctx0.fill(); ctx0.strokeStyle = '#000'; ctx0.lineWidth = 1; ctx0.stroke();
        ctx0.restore();
        return;
      }
      ctx0.fillStyle = '#000'; ctx0.fillRect(mx - 2, mz - 2, 5, 5);
      ctx0.fillStyle = color; ctx0.fillRect(mx - 1, mz - 1, 3, 3);
      ctx0.lineWidth = 2; ctx0.strokeStyle = 'rgba(0,0,0,0.7)';
      const ty = mz > 10 ? mz - 4 : mz + 11;
      ctx0.strokeText(w.name, Math.min(SIZE - 20, Math.max(20, mx)), ty);
      ctx0.fillStyle = '#fff'; ctx0.fillText(w.name, Math.min(SIZE - 20, Math.max(20, mx)), ty);
    });
    // you: an arrow pointing the way you face (north, -z, is up)
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(R + 0.5, R + 0.5);
    ctx.rotate(Math.atan2(-Math.cos(player.yaw), -Math.sin(player.yaw))); // the look direction, x right and z down
    ctx.beginPath(); ctx.moveTo(5, 0); ctx.lineTo(-4, -3.5); ctx.lineTo(-2, 0); ctx.lineTo(-4, 3.5); ctx.closePath();
    ctx.fillStyle = '#fff'; ctx.fill(); ctx.lineWidth = 1; ctx.strokeStyle = '#000'; ctx.stroke();
    ctx.restore();
  }

  drawRow(row) {
    const world = this.world, player = this.player;
    if (!world || !player) return;
    const d = this.img.data;
    const z = Math.floor(player.pos.z) - R + row, x0 = Math.floor(player.pos.x) - R;
    let prevTop = -1;
    for (let col = 0; col < SIZE; col++) {
      const x = x0 + col, i = (row * SIZE + col) * 4;
      const c = world.chunkAt(x, z);
      if (!c) { d[i] = 214; d[i + 1] = 200; d[i + 2] = 160; d[i + 3] = 255; prevTop = -1; continue; } // unexplored parchment
      const lx = x & 15, lz = z & 15;
      let y = H - 1, id = AIR;
      for (; y >= 0; y--) { id = c.data[lx | (lz << 4) | (y << 8)]; if (id !== AIR) break; }
      let rgb;
      if (isWaterId(id)) {
        let depth = 0;
        while (y - depth > 0 && isWaterId(c.data[lx | (lz << 4) | ((y - depth) << 8)])) depth++;
        const k = Math.max(0.45, 1 - depth * 0.07);
        rgb = [52 * k, 104 * k, 210 * k];
      } else {
        const base = this.colorOf(id);
        // higher ground is lighter; a rise from the west gets a highlight, a drop a shadow
        let k = 0.8 + (y - SEA_LEVEL) * 0.012;
        if (prevTop >= 0) k += Math.sign(y - prevTop) * 0.12;
        k = Math.min(1.35, Math.max(0.55, k));
        rgb = [base[0] * k, base[1] * k, base[2] * k];
      }
      prevTop = y;
      d[i] = Math.min(255, rgb[0]); d[i + 1] = Math.min(255, rgb[1]); d[i + 2] = Math.min(255, rgb[2]); d[i + 3] = 255;
    }
  }
}
