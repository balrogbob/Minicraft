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

export class ChunkStore {
  constructor() {
    this.db = null;
    this.keys = new Set(); // keys of every stored chunk, so unedited chunks never wait on the database
    this.mem = new Map(); // fallback storage, and a cache of writes still in flight
  }

  async open() {
    try {
      const open = indexedDB.open(DB_NAME, 1);
      open.onupgradeneeded = () => open.result.createObjectStore(STORE);
      this.db = await request(open);
      const keys = await request(this.db.transaction(STORE).objectStore(STORE).getAllKeys());
      this.keys = new Set(keys);
    } catch {
      this.db = null;
    }
    return !!this.db;
  }

  get persistent() { return !!this.db; }

  has(key) { return this.keys.has(key); }

  async load(key) {
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
    this.mem.set(key, copy);
    if (!this.db) return Promise.resolve();
    return new Promise((resolve) => {
      const tx = this.db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put(copy, key);
      tx.oncomplete = () => { if (this.mem.get(key) === copy) this.mem.delete(key); resolve(); };
      tx.onerror = tx.onabort = () => resolve();
    });
  }

  // Write many chunks in one transaction (used when importing an old world).
  saveMany(entries) {
    for (const [key, data] of entries) { this.keys.add(key); this.mem.set(key, data); }
    if (!this.db) return Promise.resolve();
    return new Promise((resolve) => {
      const tx = this.db.transaction(STORE, 'readwrite');
      const os = tx.objectStore(STORE);
      for (const [key, data] of entries) os.put(data, key);
      tx.oncomplete = () => { for (const [key] of entries) this.mem.delete(key); resolve(); };
      tx.onerror = tx.onabort = () => resolve();
    });
  }

  async clear() {
    this.keys.clear();
    this.mem.clear();
    if (!this.db) return;
    try { await request(this.db.transaction(STORE, 'readwrite').objectStore(STORE).clear()); } catch { /* ignore */ }
  }
}
