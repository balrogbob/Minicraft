// Quests (v50 later 2): every village has two jobs going, new every three days, offered by any of its villagers
// (in the trade panel). Take up to three at a time; they're kept in your quest log (J) and marked on the map.
//   deliver  carry a parcel to another village, and hand it to anyone there
//   fetch    find a thing lost at a ruin or a shipwreck nearby, and bring it back
//   gather   a big order: bring a lot of one thing
//   hunt     defeat creatures of one kind (not in peaceful)
// The jobs come from the world's seed, the village and the three days, so they're the same each time you look.
import { CHUNK } from './terrain.js';

export const QUEST_DAYS = 3, MAX_QUESTS = 3;
export const periodOf = (day) => Math.floor((day - 1) / QUEST_DAYS);
const VILLAGE_REGION = 64;

function hashOf(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
// a little generator of numbers in [0, 1), from a seed
function rng(seed) {
  let a = seed | 0;
  return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const pickOf = (r, a) => a[Math.floor(r() * a.length)];

export const HUNT_KINDS = { gloomling: ['gloomling', 'gloomlings', 6], thornspitter: ['thornspitter', 'thornspitters', 4], mossback: ['mossback', 'mossbacks', 2], spider: ['cave spider', 'cave spiders', 5] };
const HUNT_WHY = {
  gloomling: 'Gloomlings have been creeping round the houses at night',
  thornspitter: 'Thornspitters keep shooting at the shepherds',
  mossback: 'A mossback trampled the fences last night',
  spider: 'Cave spiders have been coming up out of the mine',
};
const LOST_WHO = ['grandmother', 'grandfather', 'great-aunt', 'old uncle', 'mother', 'father'];
const DELIVER_WHAT = ['a parcel of letters', 'a bundle of seeds', 'some mended clothes', 'a jar of honey', 'a present for a cousin', 'a sack of tools'];

// Nearby places (ruins and wrecks within about 280 blocks of the village), worked out once per village.
const placeCache = new Map();
function placesNear(g, v) {
  const key = `${v.x},${v.z}`;
  if (placeCache.has(key)) return placeCache.get(key);
  const out = [], cx0 = Math.floor(v.x / CHUNK), cz0 = Math.floor(v.z / CHUNK), R = 17;
  for (let cz = cz0 - R; cz <= cz0 + R; cz++) for (let cx = cx0 - R; cx <= cx0 + R; cx++) {
    const r = g.ruinAt?.(cx, cz);
    if (r) out.push({ place: 'ruin', x: r.x + 3, y: r.y, z: r.z + 3 });
    const w = g.wreckAt?.(cx, cz);
    if (w) out.push({ place: 'wreck', x: w.x + 2, y: w.y, z: w.z });
  }
  const near = out.map((p) => ({ ...p, d: Math.hypot(p.x - v.x, p.z - v.z) })).filter((p) => p.d > 40).sort((a, b) => a.d - b.d);
  placeCache.set(key, near);
  return near;
}
// Other villages 100 to 600 blocks away.
const townCache = new Map();
function villagesNear(g, v) {
  const key = `${v.x},${v.z}`;
  if (townCache.has(key)) return townCache.get(key);
  const out = [], rx0 = Math.floor(v.x / VILLAGE_REGION), rz0 = Math.floor(v.z / VILLAGE_REGION), R = 9;
  for (let rz = rz0 - R; rz <= rz0 + R; rz++) for (let rx = rx0 - R; rx <= rx0 + R; rx++) {
    const h = g.villageHead(rx, rz);
    if (!h) continue;
    const d = Math.hypot(h.x - v.x, h.z - v.z);
    if (d >= 100 && d <= 600) out.push([rx, rz, d]);
  }
  out.sort((a, b) => a[2] - b[2]);
  townCache.set(key, out);
  return out;
}

// The two jobs a village has going in a period. ids: { coin, parcel, heirlooms: [...], gather: [[id, n, coins], ...] }.
export function questOffers(g, v, period, ids, peaceful) {
  const key = `${v.x},${v.z}`, r = rng(hashOf(`${g.seed}:${key}:${period}`));
  const out = [];
  const kinds = ['deliver', 'fetch', 'gather', 'hunt'].filter((k) => !(k === 'hunt' && peaceful));
  for (let k = 0; k < 2; k++) {
    let kind = pickOf(r, kinds);
    if (k === 1 && out[0]?.kind === kind) kind = kinds[(kinds.indexOf(kind) + 1) % kinds.length]; // (two different jobs)
    const q = { id: `${key}:${period}:${k}`, kind, home: { key, name: v.name, x: v.x, z: v.z } };
    if (kind === 'deliver') {
      const towns = villagesNear(g, v);
      if (towns.length) {
        const [rx, rz, d] = towns[Math.floor(r() * Math.min(4, towns.length))];
        const t = g.villageAt(rx, rz);
        if (t && t.name !== v.name) { // (not a village of the same name: that would be confusing)
          q.to = { key: `${t.x},${t.z}`, name: t.name, x: t.x, z: t.z };
          q.item = ids.parcel; q.n = 1;
          q.coins = 3 + Math.round(d / 40);
          q.text = `Take ${pickOf(r, DELIVER_WHAT)} to ${t.name}`;
          out.push(q); continue;
        }
      }
      q.kind = kind = 'gather'; // (no village near enough: a big order instead)
    }
    if (kind === 'fetch') {
      const ps = placesNear(g, v);
      if (ps.length) {
        const p = ps[Math.floor(r() * Math.min(5, ps.length))];
        q.spot = { place: p.place, x: p.x, y: p.y, z: p.z };
        q.item = pickOf(r, ids.heirlooms); q.n = 1;
        q.coins = 5 + Math.round(p.d / 40);
        q.book = true;
        q.who = pickOf(r, LOST_WHO);
        q.text = p.place === 'wreck' ? `Find my ${q.who}'s ${ids.name(q.item).toLowerCase()}: it went down with a ship off the coast`
          : `Find my ${q.who}'s ${ids.name(q.item).toLowerCase()}: it was lost at the old ruin`;
        out.push(q); continue;
      }
      q.kind = kind = 'gather';
    }
    if (kind === 'hunt') {
      const mob = pickOf(r, Object.keys(HUNT_KINDS)), [, many, n] = HUNT_KINDS[mob];
      q.mob = mob; q.n = n;
      q.coins = 4 + n * (mob === 'mossback' ? 4 : 2);
      q.text = `${HUNT_WHY[mob]}: defeat ${n} ${many}`;
      out.push(q); continue;
    }
    const [item, n, coins] = pickOf(r, ids.gather);
    q.kind = 'gather'; q.item = item; q.n = n; q.coins = coins;
    q.text = `We need ${n} × ${ids.name(item)} for the village`;
    out.push(q);
  }
  return out;
}

// Where a quest leads you next: [x, z, what] or null.
export function questTarget(q) {
  if (q.kind === 'deliver') return [q.to.x, q.to.z, q.to.name];
  if (q.kind === 'fetch' && !q.found) return [q.spot.x, q.spot.z, q.spot.place === 'wreck' ? 'the shipwreck' : 'the ruin'];
  if (q.kind === 'hunt' && (q.got ?? 0) < q.n) return null;
  return [q.home.x, q.home.z, q.home.name];
}

// A quest from a save, checked over.
export function loadQuest(q) {
  if (!q || typeof q.id !== 'string' || !['deliver', 'fetch', 'gather', 'hunt'].includes(q.kind) || !q.home || ![q.home.x, q.home.z].every(Number.isFinite)) return null;
  if (q.kind === 'deliver' && !(q.to && [q.to.x, q.to.z].every(Number.isFinite))) return null;
  if (q.kind === 'fetch' && !(q.spot && [q.spot.x, q.spot.y, q.spot.z].every(Number.isFinite))) return null;
  if (!Number.isInteger(q.n) || !Number.isFinite(q.coins)) return null;
  return { ...q, text: String(q.text ?? '').slice(0, 200), got: Number.isInteger(q.got) ? q.got : 0, found: !!q.found };
}
