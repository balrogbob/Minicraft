// 36-slot inventory (slots 0-8 are the hotbar).
import { maxStack } from './blocks.js';

export const SLOTS = 36;

export class Inventory {
  constructor() {
    this.slots = new Array(SLOTS).fill(null); // { id, count } | null
    this.selected = 0;
    this.onChange = () => {};
  }

  held() { return this.slots[this.selected]; }
  heldId() { return this.slots[this.selected]?.id ?? 0; }

  count(id) {
    let n = 0;
    for (const s of this.slots) if (s && s.id === id) n += s.count;
    return n;
  }

  // How many of `id` could be added.
  room(id) {
    const max = maxStack(id);
    let r = 0;
    for (const s of this.slots) {
      if (!s) r += max;
      else if (s.id === id) r += max - s.count;
    }
    return r;
  }

  // Adds items, returns how many did not fit. Prefers stacking, then hotbar, then backpack.
  add(id, n) {
    const max = maxStack(id);
    for (const s of this.slots) {
      if (n <= 0) break;
      if (s && s.id === id && s.count < max) {
        const k = Math.min(n, max - s.count);
        s.count += k; n -= k;
      }
    }
    for (let i = 0; i < SLOTS && n > 0; i++) {
      if (!this.slots[i]) {
        const k = Math.min(n, max);
        this.slots[i] = { id, count: k }; n -= k;
      }
    }
    this.onChange();
    return n;
  }

  remove(id, n) {
    for (let i = SLOTS - 1; i >= 0 && n > 0; i--) {
      const s = this.slots[i];
      if (s && s.id === id) {
        const k = Math.min(n, s.count);
        s.count -= k; n -= k;
        if (!s.count) this.slots[i] = null;
      }
    }
    this.onChange();
  }

  consumeHeld() {
    const s = this.held();
    if (!s) return;
    if (--s.count <= 0) this.slots[this.selected] = null;
    this.onChange();
  }

  // Move/merge/swap slot a into slot b (tap-to-pick, tap-to-drop UI).
  moveSlot(a, b) {
    if (a === b) return;
    const A = this.slots[a], B = this.slots[b];
    if (A && B && A.id === B.id) {
      const k = Math.min(A.count, maxStack(A.id) - B.count);
      B.count += k; A.count -= k;
      if (!A.count) this.slots[a] = null;
    } else {
      this.slots[a] = B; this.slots[b] = A;
    }
    this.onChange();
  }

  serialize() { return { slots: this.slots, selected: this.selected }; }

  load(o) {
    if (!o || !Array.isArray(o.slots)) return;
    for (let i = 0; i < SLOTS; i++) {
      const s = o.slots[i];
      this.slots[i] = s && s.id && s.count > 0 ? { id: s.id, count: s.count } : null;
    }
    this.selected = Math.min(8, Math.max(0, o.selected | 0));
    this.onChange();
  }
}
