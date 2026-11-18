// Saves edited chunks in IndexedDB (localStorage is far too small for a big world).
// Only chunks the player has changed are stored; everything else regenerates from the seed.
// If IndexedDB is unavailable (e.g. some private modes), edits are kept in memory for the session.

const DB_NAME = 'minicraft';
const STORE = 'chunks';

function request(r) {
  return new Promise((resolve, reject) => {
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}

// Chunks are stored as Uint16Arrays of block ids. Worlds saved before version 17 used one byte per block:
// those are widened as they load (and saved in the new form the next time they change).
export function toBlocks(data) {
  if (data instanceof Uint16Array) return data;
  return Uint16Array.from(data instanceof Uint8Array ? data : new Uint8Array(data));
}

// Each save slot keeps its chunks under its own prefix: slot 0 (the original world) has none, so worlds
// saved before there were slots carry on as slot 0; slot n's chunks are stored as "s<n>:" + key.
const prefixOf = (slot) => (slot ? `s${slot}:` : '');
const slotOfKey = (k) => { const m = /^s(\d+):/.exec(k); return m ? +m[1] : 0; };

export class ChunkStore {
  constructor() {
    this.db = null;
    this.all = new Set(); // every stored key, in every slot
    this.keys = new Set(); // keys of every stored chunk in this slot, so unedited chunks never wait on the database
    this.mem = new Map(); // fallback storage, and a cache of writes still in flight (by full key)
    this.slot = 0;
  }

  // Work in save slot n from now on.
  setSlot(n) {
    this.slot = n;
    const pre = prefixOf(n);
    this.keys = new Set([...this.all].filter((k) => slotOfKey(k) === n).map((k) => (n ? +k.slice(pre.length) : k)));
  }

  // The key a chunk is stored under (world chunk keys are numbers).
  full(key, slot = this.slot) { return slot ? prefixOf(slot) + key : key; }

  async open() {
    try {
      const open = indexedDB.open(DB_NAME, 1);
      open.onupgradeneeded = () => open.result.createObjectStore(STORE);
      this.db = await request(open);
      const keys = await request(this.db.transaction(STORE).objectStore(STORE).getAllKeys());
      this.all = new Set(keys);
      this.setSlot(this.slot);
    } catch {
      this.db = null;
    }
    return !!this.db;
  }

  get persistent() { return !!this.db; }

  has(key) { return this.keys.has(key); }

  async load(key, slot = this.slot) {
    key = this.full(key, slot);
    if (this.mem.has(key)) return toBlocks(this.mem.get(key).slice());
    if (!this.db) return null;
    try {
      const data = await request(this.db.transaction(STORE).objectStore(STORE).get(key));
      return data ? toBlocks(data) : null;
    } catch {
      return null;
    }
  }

  save(key, data) {
    const copy = data.slice();
    this.keys.add(key);
    key = this.full(key);
    this.all.add(key);
    this.mem.set(key, copy);
    if (!this.db) return Promise.resolve();
    return new Promise((resolve) => {
      const tx = this.db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put(copy, key);
      tx.oncomplete = () => { if (this.mem.get(key) === copy) this.mem.delete(key); resolve(); };
      tx.onerror = tx.onabort = () => resolve();
    });
  }

  // Write many chunks in one transaction (used when importing a world).
  saveMany(entries) {
    for (const [key] of entries) this.keys.add(key);
    entries = entries.map(([key, data]) => [this.full(key), data]);
    for (const [key, data] of entries) { this.all.add(key); this.mem.set(key, data); }
    if (!this.db) return Promise.resolve();
    return new Promise((resolve) => {
      const tx = this.db.transaction(STORE, 'readwrite');
      const os = tx.objectStore(STORE);
      for (const [key, data] of entries) os.put(data, key);
      tx.oncomplete = () => { for (const [key] of entries) this.mem.delete(key); resolve(); };
      tx.onerror = tx.onabort = () => resolve();
    });
  }

  // Forget every chunk of a slot (this one unless told otherwise).
  async clear(slot = this.slot) {
    const gone = [...this.all].filter((k) => slotOfKey(k) === slot);
    for (const k of gone) { this.all.delete(k); this.mem.delete(k); }
    if (slot === this.slot) this.keys.clear();
    if (!this.db || !gone.length) return;
    await new Promise((resolve) => {
      const tx = this.db.transaction(STORE, 'readwrite');
      const os = tx.objectStore(STORE);
      for (const k of gone) os.delete(k);
      tx.oncomplete = tx.onerror = tx.onabort = () => resolve();
    });
  }

  // Every stored chunk of a slot, as [[key, Uint16Array], ...] (for exporting a world).
  async dump(slot = this.slot) {
    const pre = prefixOf(slot), out = [];
    for (const k of this.all) {
      if (slotOfKey(k) !== slot) continue;
      const key = slot ? +k.slice(pre.length) : k;
      const data = await this.load(key, slot);
      if (data) out.push([key, data]);
    }
    return out;
  }
}
