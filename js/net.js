// v38: playing together through a Minicraft server (server/server.js). This side connects, says who you
// are, passes on where you are and the blocks you place and break, and shows the other players: each one is
// a character like yours, with their name over their head, gliding smoothly between the updates.

import * as THREE from 'three';
import { Avatar } from './held.js';

function nameTag(text) {
  const c = document.createElement('canvas');
  const g = c.getContext('2d');
  g.font = 'bold 28px system-ui, sans-serif';
  const w = Math.ceil(g.measureText(text).width) + 24;
  c.width = w; c.height = 44;
  g.font = 'bold 28px system-ui, sans-serif';
  g.fillStyle = 'rgba(0,0,0,0.45)';
  g.beginPath(); g.roundRect?.(0, 0, w, 44, 10); if (!g.roundRect) g.rect(0, 0, w, 44); g.fill();
  g.fillStyle = '#fff'; g.textBaseline = 'middle'; g.textAlign = 'center';
  g.fillText(text, w / 2, 23);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthWrite: false, transparent: true }));
  s.scale.set(w / 44 * 0.32, 0.32, 1);
  s.renderOrder = 7;
  s.userData.noShadow = true;
  return s;
}

export class Net {
  // deps: { scene, atlas, icons, ITEMS, on: { welcome, block, chat, join, leave, status } }
  constructor(deps) {
    this.d = deps;
    this.ws = null;
    this.live = false; // connected and welcomed
    this.id = 0;
    this.worldId = null;
    this.host = 0; // the player whose game runs the clock, the weather, growth and creatures
    this.pvp = false; // (v41: players can hurt each other: the host's choice)
    this.url = '';
    this.remotes = new Map(); // id -> { name, look, avatar, tag, pos, target, yaw, pitch, held, sw, sp, g }
    this.capture = 0; // > 0 while you're placing or breaking: the blocks that change are sent on
    this.sendTimer = 0; this.lastSent = '';
  }

  connect(url, name, look) {
    this.leave(true);
    this.url = url;
    let ws;
    try { ws = new WebSocket(url); } catch (err) { this.d.on.status?.('error', err.message); return; }
    this.ws = ws;
    this.d.on.status?.('connecting');
    ws.onopen = () => { this.send({ t: 'hello', name, look }); };
    ws.onmessage = (e) => { let m; try { m = JSON.parse(e.data); } catch { return; } this.handle(m); };
    ws.onclose = () => {
      if (this.ws !== ws) return;
      const was = this.live;
      this.ws = null; this.live = false;
      this.clearRemotes();
      this.d.on.status?.(was ? 'lost' : 'failed');
    };
    ws.onerror = () => {};
  }

  leave(quiet = false) {
    const ws = this.ws;
    this.ws = null; this.live = false; this.id = 0; this.host = 0;
    if (ws) { try { ws.close(); } catch { /* already gone */ } }
    this.clearRemotes();
    if (!quiet) this.d.on.status?.('left');
  }

  get isHost() { return this.live && this.host === this.id; }

  send(obj) { if (this.ws?.readyState === 1) this.ws.send(JSON.stringify(obj)); }

  handle(m) {
    switch (m.t) {
      case 'welcome':
        this.live = true; this.id = m.id; this.worldId = m.world; this.host = m.host; this.pvp = !!m.pvp;
        for (const p of m.players ?? []) this.addRemote(p.id, p.name, p.look, p.state);
        this.d.on.welcome?.(m);
        this.d.on.status?.('open');
        break;
      case 'host': this.host = m.id; this.d.on.host?.(m.id === this.id, this.remotes.get(m.id)?.name); break;
      case 'clock': this.d.on.clock?.(m); break;
      case 'kv': this.d.on.kv?.(m.ch, m.k, m.v); break;
      case 'mobs': this.d.on.mobs?.(m.id, m.l, m.g); break;
      case 'drop': this.d.on.drop?.(m); break;
      case 'got': this.d.on.got?.(m.u); break;
      case 'gone': this.d.on.gone?.(m.u); break;
      case 'beds': this.d.on.beds?.(m.n, m.of, m.go); break;
      case 'full': this.d.on.status?.('full'); break;
      case 'join': this.addRemote(m.id, m.name, m.look); this.d.on.join?.(m.name); break;
      case 'leave': { const r = this.remotes.get(m.id); if (r) { this.d.on.leave?.(r.name); this.removeRemote(m.id); } break; }
      case 'move': { const r = this.remotes.get(m.id); if (r) this.setState(r, m); break; }
      case 'swing': this.remotes.get(m.id)?.avatar.swing(); break;
      case 'look': { const r = this.remotes.get(m.id); if (r) { r.look = m.look; r.avatar.setLook(m.look); } break; }
      case 'block': this.d.on.block?.(m.x, m.y, m.z, m.id); break;
      case 'chat': this.d.on.chat?.(m.name, m.text, m.id === this.id); break;
      case 'pvp': this.pvp = !!m.on; this.d.on.pvp?.(this.pvp, m.by); break;
      case 'hit': if (this.pvp) this.d.on.hit?.(m, this.remotes.get(m.id)); break;
      case 'note': this.d.on.chat?.(null, m.text, false); break;
      default: break;
    }
  }

  addRemote(id, name, look, state) {
    if (this.remotes.has(id)) return;
    const avatar = new Avatar(look ?? {}, this.d.atlas, this.d.icons, this.d.ITEMS);
    const tag = nameTag(name);
    avatar.root.add(tag);
    tag.position.set(0, 2.2, 0);
    avatar.root.visible = false;
    this.d.scene.add(avatar.root);
    const r = { name, look, avatar, tag, pos: null, target: new THREE.Vector3(), yaw: 0, pitch: 0, held: 0, sw: false, sp: 0, g: true };
    this.remotes.set(id, r);
    if (state) this.setState(r, state);
  }

  setState(r, s) {
    if (!Array.isArray(s.p)) return;
    r.target.set(s.p[0], s.p[1], s.p[2]);
    if (!r.pos || r.pos.distanceToSquared(r.target) > 64) r.pos = r.target.clone(); // (a jump: just go there)
    r.yaw = s.yaw; r.pitch = s.pitch; r.held = s.held | 0; r.sw = !!s.sw; r.sp = s.sp ?? 0; r.g = s.g !== false;
  }

  removeRemote(id) {
    const r = this.remotes.get(id);
    if (!r) return;
    this.d.scene.remove(r.avatar.root);
    r.tag.material.map.dispose(); r.tag.material.dispose();
    r.avatar.dispose();
    this.remotes.delete(id);
  }

  // The other player the ray (origin, unit dir) first meets within maxDist: { id, r, t }, or null.
  raycast(o, d, maxDist) {
    let best = null;
    for (const [id, r] of this.remotes) {
      if (!r.pos) continue;
      const min = [r.pos.x - 0.35, r.pos.y, r.pos.z - 0.35], max = [r.pos.x + 0.35, r.pos.y + 1.8, r.pos.z + 0.35];
      const oo = [o.x, o.y, o.z], dd = [d.x, d.y, d.z];
      let t0 = 0, t1 = maxDist, ok = true;
      for (let a = 0; a < 3 && ok; a++) {
        if (Math.abs(dd[a]) < 1e-9) { if (oo[a] < min[a] || oo[a] > max[a]) ok = false; continue; }
        let ta = (min[a] - oo[a]) / dd[a], tb = (max[a] - oo[a]) / dd[a];
        if (ta > tb) [ta, tb] = [tb, ta];
        t0 = Math.max(t0, ta); t1 = Math.min(t1, tb);
        if (t0 > t1) ok = false;
      }
      if (ok && (!best || t0 < best.t)) best = { id, r, t: t0 };
    }
    return best;
  }

  clearRemotes() { for (const id of [...this.remotes.keys()]) this.removeRemote(id); }

  // every frame: move the others smoothly, and (ten times a second) tell the server where you are.
  // me: { pos, yaw, pitch, held, swimming, speed, onGround }; lightAt(pos) -> { sun, torch, ambient }
  update(dt, me, lightAt) {
    const k = 1 - Math.exp(-12 * dt);
    for (const r of this.remotes.values()) {
      if (!r.pos) continue;
      r.pos.lerp(r.target, k);
      r.avatar.root.visible = true;
      r.avatar.setHeld(r.held);
      r.avatar.update(dt, { pos: r.pos, yaw: r.yaw, pitch: r.pitch, speed: r.sp, swimming: r.sw, onGround: r.g, light: lightAt(r.pos) });
    }
    if (!this.live || !me) return;
    const now = performance.now(); // (real time: ten a second however slowly the game runs)
    if (now < this.sendTimer) return;
    this.sendTimer = now + 100;
    const msg = { t: 'move', p: [+me.pos.x.toFixed(2), +me.pos.y.toFixed(2), +me.pos.z.toFixed(2)], yaw: +me.yaw.toFixed(3), pitch: +me.pitch.toFixed(3), held: me.held, sw: me.swimming, sp: +me.speed.toFixed(1), g: me.onGround };
    const s = JSON.stringify(msg);
    if (s === this.lastSent && (this.quiet = (this.quiet ?? 0) + 1) % 10) return; // (standing still: once a second)
    this.lastSent = s;
    this.send(msg);
  }
}
