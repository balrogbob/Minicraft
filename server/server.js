#!/usr/bin/env node
// Minicraft multiplayer server (v38, stage 1). No packages needed: just Node.js 18 or newer.
//
//   node server/server.js                 serves the game at http://localhost:8080 and players join it there
//   PORT=9000 SEED=1234 node server/server.js
//
// It does two jobs on one port: it serves the game's files (so friends open http://<your address>:8080),
// and it runs a WebSocket at /mc that the game talks to. The server holds the world's seed and every block
// a player has placed or broken; each game builds the rest of the world itself from the seed. Where players
// are, what they hold and chat are passed between them. The world is saved to server/world.json (or the
// file named by DATA) every half minute and when the server stops.

'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = +process.env.PORT || 8080;
const ROOT = path.resolve(__dirname, '..');
const DATA = path.resolve(process.env.DATA || path.join(__dirname, 'world.json'));
const MAX_PLAYERS = +process.env.MAX_PLAYERS || 16;
const MAX_MESSAGE = 64 * 1024;
const MAX_EDITS = 2_000_000;
const WORLD_H = 256; // (above the game's world height; the game ignores anything out of range)

// ---------- the world: seed + block edits ----------
let world = { seed: Number.isFinite(+process.env.SEED) && process.env.SEED !== undefined ? +process.env.SEED | 0 : (Math.random() * 2 ** 31) | 0, id: crypto.randomBytes(6).toString('hex'), edits: {} };
try {
  const saved = JSON.parse(fs.readFileSync(DATA, 'utf8'));
  if (Number.isFinite(saved.seed) && saved.edits && typeof saved.edits === 'object') world = { ...saved, seed: saved.seed, id: saved.id || world.id, edits: saved.edits };
  console.log(`Loaded ${DATA}: seed ${world.seed}, ${Object.keys(world.edits).length} changed blocks`);
} catch { console.log(`New world, seed ${world.seed} (it will be saved to ${DATA})`); }
let editCount = Object.keys(world.edits).length, dirty = false;
// v39: the contents of things in the world, by channel and "x,y,z": chests and machines (st), sign writing
// (sign) and item frames (frame). Whoever changes one sends it; the server keeps the latest.
const KV_CHANNELS = ['st', 'sign', 'frame'];
const MAX_KV = 200_000, MAX_VALUE = 16 * 1024;
world.kv = Object.fromEntries(KV_CHANNELS.map((c) => [c, world.kv?.[c] && typeof world.kv[c] === 'object' ? world.kv[c] : {}]));
let kvCount = KV_CHANNELS.reduce((n, c) => n + Object.keys(world.kv[c]).length, 0);
function saveWorld() {
  if (!dirty) return;
  dirty = false;
  const tmp = DATA + '.tmp';
  try { fs.writeFileSync(tmp, JSON.stringify(world)); fs.renameSync(tmp, DATA); } catch (err) { console.error('Could not save the world:', err.message); }
}
setInterval(saveWorld, 30_000).unref();
for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => { saveWorld(); process.exit(0); });

// ---------- static files ----------
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.txt': 'text/plain; charset=utf-8', '.md': 'text/plain; charset=utf-8' };
const HIDDEN = [/^\/server\//, /^\/\./, /\/\./];
const server = http.createServer((req, res) => {
  let p;
  try { p = decodeURIComponent(new URL(req.url, 'http://x').pathname); } catch { res.writeHead(400).end(); return; }
  if (p === '/') p = '/index.html';
  const file = path.join(ROOT, p);
  if (!file.startsWith(ROOT + path.sep) || HIDDEN.some((r) => r.test(p))) { res.writeHead(404).end('Not found'); return; }
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) { res.writeHead(404).end('Not found'); return; }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream', 'Content-Length': st.size, 'Cache-Control': 'no-cache' });
    if (req.method === 'HEAD') { res.end(); return; }
    fs.createReadStream(file).pipe(res);
  });
});

// ---------- WebSocket (RFC 6455, just what the game needs) ----------
const GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';
class Socket {
  constructor(sock) {
    this.sock = sock; this.buf = Buffer.alloc(0); this.parts = []; this.open = true;
    this.onmessage = null; this.onclose = null;
    sock.setNoDelay(true);
    sock.on('data', (d) => { this.buf = Buffer.concat([this.buf, d]); try { this.read(); } catch { this.close(1002); } });
    sock.on('close', () => this.closed());
    sock.on('error', () => this.closed());
  }
  read() {
    while (this.buf.length >= 2) {
      const b0 = this.buf[0], b1 = this.buf[1], fin = b0 & 0x80, op = b0 & 0x0f, masked = b1 & 0x80;
      let len = b1 & 0x7f, at = 2;
      if (len === 126) { if (this.buf.length < 4) return; len = this.buf.readUInt16BE(2); at = 4; }
      else if (len === 127) { if (this.buf.length < 10) return; len = Number(this.buf.readBigUInt64BE(2)); at = 10; }
      if (!masked || len > MAX_MESSAGE) { this.close(1009); return; }
      if (this.buf.length < at + 4 + len) return;
      const mask = this.buf.subarray(at, at + 4), data = Buffer.from(this.buf.subarray(at + 4, at + 4 + len));
      for (let i = 0; i < data.length; i++) data[i] ^= mask[i & 3];
      this.buf = this.buf.subarray(at + 4 + len);
      if (op === 0x8) { this.close(1000); return; }
      if (op === 0x9) { this.frame(0xA, data); continue; }
      if (op === 0xA) continue;
      if (op === 0x1 || op === 0x2 || op === 0x0) {
        this.parts.push(data);
        if (this.parts.reduce((n, p) => n + p.length, 0) > MAX_MESSAGE) { this.close(1009); return; }
        if (fin) { const msg = Buffer.concat(this.parts).toString('utf8'); this.parts = []; this.onmessage?.(msg); }
      }
    }
  }
  frame(op, data) {
    if (!this.open) return;
    const n = data.length, head = n < 126 ? Buffer.from([0x80 | op, n]) : n < 65536 ? Buffer.from([0x80 | op, 126, n >> 8, n & 255]) : Buffer.concat([Buffer.from([0x80 | op, 127]), (() => { const b = Buffer.alloc(8); b.writeBigUInt64BE(BigInt(n)); return b; })()]);
    this.sock.write(Buffer.concat([head, data]));
  }
  send(obj) { this.frame(0x1, Buffer.from(JSON.stringify(obj))); }
  close(code = 1000) {
    if (this.open) { const b = Buffer.alloc(2); b.writeUInt16BE(code); this.frame(0x8, b); }
    this.sock.end(); this.closed();
  }
  closed() { if (!this.open) return; this.open = false; this.onclose?.(); }
}
server.on('upgrade', (req, sock) => {
  const key = req.headers['sec-websocket-key'];
  if (new URL(req.url, 'http://x').pathname !== '/mc' || !key || req.headers.upgrade?.toLowerCase() !== 'websocket') { sock.end('HTTP/1.1 400 Bad Request\r\n\r\n'); return; }
  const accept = crypto.createHash('sha1').update(key + GUID).digest('base64');
  sock.write(`HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: ${accept}\r\n\r\n`);
  join(new Socket(sock));
});

// ---------- players ----------
const players = new Map(); // id -> { ws, name, look, state }
let nextId = 1;
const clean = (s, n) => String(s ?? '').replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, n);
const num = (v, lo, hi) => (Number.isFinite(v) ? Math.max(lo, Math.min(hi, v)) : null);
const LOOK_KEYS = ['skin', 'hair', 'shirt', 'trousers'];
const cleanLook = (l) => Object.fromEntries(LOOK_KEYS.map((k) => [k, Math.max(0, Math.min(31, (l?.[k] | 0)))]));
function others(id, msg) { for (const [pid, p] of players) if (pid !== id && p.hello) p.ws.send(msg); }
function everyone(msg) { for (const p of players.values()) if (p.hello) p.ws.send(msg); }
// The host is whoever has been here longest: their game runs the clock, the weather, things growing and the
// creatures, and tells everyone else. When they leave, the next longest takes over.
let hostId = 0;
// v39: things lying on the ground (not kept when the server stops: they'd have vanished by then anyway). Each is
// { u, s: stack, p: [x, y, z], at }. The first player to ask for one gets it.
const drops = new Map();
const DROP_LIFE = 300e3, MAX_DROPS = 600;
function cleanDrops() {
  const old = Date.now() - DROP_LIFE;
  for (const [u, d] of drops) if (d.at < old || drops.size > MAX_DROPS) drops.delete(u); else break;
}
// who's in bed: when everyone is, the night is slept through
function beds(go = false) {
  const all = [...players.values()].filter((p) => p.hello), n = all.filter((p) => p.bed).length;
  if (n && n === all.length) { go = true; for (const p of all) p.bed = false; }
  everyone({ t: 'beds', n, of: all.length, go });
}
function electHost() {
  const ids = [...players].filter(([, p]) => p.hello).map(([id]) => id).sort((a, b) => a - b);
  const next = ids[0] ?? 0;
  if (next === hostId) return;
  hostId = next;
  if (hostId) { everyone({ t: 'host', id: hostId }); console.log(`${players.get(hostId).name} is now the host`); }
}

function join(ws) {
  if (players.size >= MAX_PLAYERS) { ws.send({ t: 'full' }); ws.close(1013); return; }
  const id = nextId++, me = { ws, name: `Player ${id}`, look: cleanLook({}), state: null, hello: false, budget: 1500, last: Date.now() };
  players.set(id, me);
  ws.onmessage = (raw) => {
    // a simple flood limit: about 300 messages a second on average, in bursts of up to 1500 (a busy farm
    // or quarry sends a lot of block changes)
    const now = Date.now();
    me.budget = Math.min(1500, me.budget + (now - me.last) * 0.3); me.last = now;
    if ((me.budget -= 1) < 0) return;
    let m; try { m = JSON.parse(raw); } catch { return; }
    if (!m || typeof m !== 'object') return;
    handle(id, me, m);
  };
  ws.onclose = () => {
    players.delete(id);
    if (me.hello) { others(id, { t: 'leave', id }); console.log(`${me.name} left (${players.size} playing)`); }
    if (id === hostId) { hostId = 0; electHost(); }
    if (me.hello && [...players.values()].some((p) => p.bed)) beds(); // (the one still up may have left)
  };
}

function handle(id, me, m) {
  switch (m.t) {
    case 'hello': {
      if (me.hello) return;
      me.hello = true;
      me.name = clean(m.name, 20) || me.name;
      me.look = cleanLook(m.look);
      const edits = Object.entries(world.edits).map(([k, v]) => { const [x, y, z] = k.split(',').map(Number); return [x, y, z, v]; });
      if (!hostId) hostId = id;
      me.ws.send({ t: 'welcome', id, host: hostId, clock: world.clock ?? null, kv: world.kv, seed: world.seed, world: world.id, edits, drops: (cleanDrops(), [...drops.values()]), players: [...players].filter(([pid, p]) => pid !== id && p.hello).map(([pid, p]) => ({ id: pid, name: p.name, look: p.look, state: p.state })) });
      others(id, { t: 'join', id, name: me.name, look: me.look });
      console.log(`${me.name} joined (${players.size} playing)`);
      break;
    }
    case 'move': {
      if (!me.hello || !Array.isArray(m.p)) return;
      const x = num(m.p[0], -1e6, 1e6), y = num(m.p[1], -64, 512), z = num(m.p[2], -1e6, 1e6);
      if (x === null || y === null || z === null) return;
      me.state = { p: [x, y, z], yaw: num(m.yaw, -1e4, 1e4) ?? 0, pitch: num(m.pitch, -2, 2) ?? 0, held: m.held | 0, sw: !!m.sw, sp: num(m.sp, 0, 50) ?? 0, g: !!m.g };
      others(id, { t: 'move', id, ...me.state });
      break;
    }
    case 'block': {
      if (!me.hello) return;
      const x = m.x | 0, y = m.y | 0, z = m.z | 0, b = m.id | 0;
      if (y < 0 || y >= WORLD_H || Math.abs(x) > 1e6 || Math.abs(z) > 1e6 || b < 0 || b > 65535) return;
      const k = `${x},${y},${z}`;
      if (!(k in world.edits)) { if (editCount >= MAX_EDITS) return; editCount++; }
      world.edits[k] = b; dirty = true;
      others(id, { t: 'block', x, y, z, id: b });
      break;
    }
    case 'chat': {
      if (!me.hello) return;
      const text = clean(m.text, 200);
      if (!text) return;
      console.log(`<${me.name}> ${text}`);
      for (const p of players.values()) if (p.hello) p.ws.send({ t: 'chat', id, name: me.name, text });
      break;
    }
    case 'clock': { // (from the host only) the time of day, the day, the weather
      if (id !== hostId) return;
      const c = { time: num(m.time, 0, 1) ?? 0, day: Math.max(1, m.day | 0), raining: !!m.raining, storm: !!m.storm, timer: num(m.timer, 0, 1e5) ?? 60, at: Date.now() };
      world.clock = c; dirty = true;
      others(id, { t: 'clock', ...c, why: clean(m.why, 12) });
      break;
    }
    case 'kv': {
      if (!me.hello || !KV_CHANNELS.includes(m.ch) || typeof m.k !== 'string' || !/^-?\d{1,7},-?\d{1,3},-?\d{1,7}$/.test(m.k)) return;
      const box = world.kv[m.ch];
      if (m.v === null || m.v === undefined) { if (m.k in box) { delete box[m.k]; kvCount--; } }
      else {
        if (JSON.stringify(m.v).length > MAX_VALUE) return;
        if (!(m.k in box)) { if (kvCount >= MAX_KV) return; kvCount++; }
        box[m.k] = m.v;
      }
      dirty = true;
      others(id, { t: 'kv', ch: m.ch, k: m.k, v: m.v ?? null });
      break;
    }
    case 'drop': { // something put on the ground: { u, s: { id, count, ... }, p: [x, y, z], v: [vx, vy, vz] }
      if (!me.hello || typeof m.u !== 'string' || m.u.length > 24 || drops.has(m.u) || !m.s || !(m.s.id > 0) || !(m.s.count > 0) || m.s.count > 9999) return;
      if (!Array.isArray(m.p) || m.p.length !== 3 || !m.p.every(Number.isFinite) || JSON.stringify(m.s).length > 4000) return;
      const v = Array.isArray(m.v) && m.v.length === 3 && m.v.every(Number.isFinite) ? m.v : [0, 0, 0];
      cleanDrops();
      drops.set(m.u, { u: m.u, s: m.s, p: m.p, at: Date.now() });
      others(id, { t: 'drop', u: m.u, s: m.s, p: m.p, v, d: num(m.d, 0, 5) ?? 0 });
      break;
    }
    case 'take': { // a player (or a machine in their part of the world) picks something up: the first to ask gets it
      if (!me.hello || typeof m.u !== 'string') return;
      if (drops.delete(m.u)) { me.ws.send({ t: 'got', u: m.u }); others(id, { t: 'gone', u: m.u }); }
      else me.ws.send({ t: 'gone', u: m.u });
      break;
    }
    case 'bed': if (me.hello) { me.bed = !!m.on; beds(); } break;
    case 'mobs': { // (the creatures a player's game runs, for the others to draw: passed on, not kept)
      if (!me.hello || !Array.isArray(m.l) || m.l.length > 400 || (m.g != null && (!Array.isArray(m.g) || m.g.length > 400))) return;
      others(id, { t: 'mobs', id, l: m.l, g: m.g ?? [] });
      break;
    }
    case 'swing': if (me.hello) others(id, { t: 'swing', id }); break;
    case 'look': if (me.hello) { me.look = cleanLook(m.look); others(id, { t: 'look', id, look: me.look }); } break;
    default: break;
  }
}

server.listen(PORT, () => {
  const nets = Object.values(require('os').networkInterfaces()).flat().filter((n) => n && n.family === 'IPv4' && !n.internal).map((n) => n.address);
  console.log(`Minicraft server running. Open http://localhost:${PORT}${nets.length ? ` (or, on your network, ${nets.map((a) => `http://${a}:${PORT}`).join(', ')})` : ''}`);
  console.log('In the game: Menu → Multiplayer → Join.');
});
