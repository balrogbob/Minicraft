// Touch controls (tablet) + keyboard/mouse (desktop).
//
// Touch:  left side   = floating joystick to walk
//         right side  = drag to look, tap to place/use, hold still to break
//         buttons     = jump, inventory (wired up in main.js)
// Desktop: click to capture mouse, WASD + space, left hold = break, right click = place,
//          E = inventory, 1-9 / wheel = hotbar.

const TAP_MS = 250;
const HOLD_MS = 280;
const MOVE_SLOP = 12; // px a finger can wander and still count as a tap/hold
const LOOK_SENS = 0.006; // radians per px (touch)
const MOUSE_SENS = 0.0025;
const JOY_RADIUS = 60;

export class Controls {
  constructor(layer, player, hooks) {
    this.layer = layer;
    this.player = player;
    this.hooks = hooks; // { place(), selectSlot(i), scrollSlot(d), toggleInventory(), isPaused() }
    this.moveX = 0; this.moveZ = 0;
    this.jumpTouch = false;
    this.breaking = false;
    this.keys = new Set();
    this.joy = null; // { id, ox, oy }
    this.look = null; // { id, x, y, start, still, stillSince, travel, breaking }
    this.joyBase = document.getElementById('joy-base');
    this.joyKnob = document.getElementById('joy-knob');
    this.lookSens = LOOK_SENS;
    this.bindTouch();
    this.bindDesktop();
  }

  get jump() { return this.jumpTouch || this.keys.has('Space'); }

  reset() {
    this.joy = null; this.look = null;
    this.moveX = this.moveZ = 0;
    this.breaking = false; this.jumpTouch = false;
    this.keys.clear();
    this.showJoy(false);
  }

  rotate(dx, dy, sens) {
    const p = this.player;
    p.yaw -= dx * sens;
    p.pitch = Math.max(-1.55, Math.min(1.55, p.pitch - dy * sens));
  }

  showJoy(on, x, y) {
    this.joyBase.classList.toggle('active', on);
    this.joyKnob.style.transform = 'translate(-50%, -50%)';
    if (on) {
      this.joyBase.style.left = x + 'px';
      this.joyBase.style.top = y + 'px';
    }
  }

  bindTouch() {
    const L = this.layer;
    L.addEventListener('touchstart', (e) => {
      e.preventDefault();
      if (this.hooks.isPaused()) return;
      const now = performance.now();
      for (const t of e.changedTouches) {
        if (t.clientX < window.innerWidth * 0.4 && !this.joy) {
          this.joy = { id: t.identifier, ox: t.clientX, oy: t.clientY };
          this.showJoy(true, t.clientX, t.clientY);
        } else if (!this.look) {
          this.look = { id: t.identifier, x: t.clientX, y: t.clientY, start: now, stillSince: now, anchorX: t.clientX, anchorY: t.clientY, travel: 0, breaking: false };
        }
      }
    }, { passive: false });

    L.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const now = performance.now();
      for (const t of e.changedTouches) {
        if (this.joy && t.identifier === this.joy.id) {
          let dx = t.clientX - this.joy.ox, dy = t.clientY - this.joy.oy;
          const d = Math.hypot(dx, dy);
          if (d > JOY_RADIUS) { dx *= JOY_RADIUS / d; dy *= JOY_RADIUS / d; }
          this.moveX = dx / JOY_RADIUS;
          this.moveZ = -dy / JOY_RADIUS;
          this.joyKnob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
        } else if (this.look && t.identifier === this.look.id) {
          const lk = this.look;
          const dx = t.clientX - lk.x, dy = t.clientY - lk.y;
          lk.x = t.clientX; lk.y = t.clientY;
          lk.travel += Math.hypot(dx, dy);
          this.rotate(dx, dy, this.lookSens);
          // restart the "hold still" timer whenever the finger wanders off its anchor
          if (Math.hypot(t.clientX - lk.anchorX, t.clientY - lk.anchorY) > MOVE_SLOP) {
            lk.anchorX = t.clientX; lk.anchorY = t.clientY; lk.stillSince = now;
          }
        }
      }
    }, { passive: false });

    const end = (e) => {
      e.preventDefault();
      const now = performance.now();
      for (const t of e.changedTouches) {
        if (this.joy && t.identifier === this.joy.id) {
          this.joy = null; this.moveX = this.moveZ = 0;
          this.showJoy(false);
        } else if (this.look && t.identifier === this.look.id) {
          const lk = this.look;
          if (!lk.breaking && now - lk.start < TAP_MS && lk.travel < MOVE_SLOP) this.hooks.place();
          this.look = null;
          this.breaking = false;
        }
      }
    };
    L.addEventListener('touchend', end, { passive: false });
    L.addEventListener('touchcancel', end, { passive: false });
  }

  // Called every frame: turns a still, held finger into "breaking".
  update() {
    const lk = this.look;
    if (lk && !lk.breaking && performance.now() - lk.stillSince > HOLD_MS) {
      lk.breaking = true;
    }
    const keyBreak = this.mouseBreak;
    this.breaking = !!(lk?.breaking || keyBreak);
    if (!this.joy) {
      const k = this.keys;
      const x = (k.has('KeyD') ? 1 : 0) - (k.has('KeyA') ? 1 : 0);
      const z = (k.has('KeyW') ? 1 : 0) - (k.has('KeyS') ? 1 : 0);
      if (x || z || this.usingKeys) { this.moveX = x; this.moveZ = z; this.usingKeys = !!(x || z); }
    }
  }

  bindDesktop() {
    const L = this.layer;
    this.mouseBreak = false;
    L.addEventListener('mousedown', (e) => {
      if (this.hooks.isPaused()) return;
      if (document.pointerLockElement !== L) {
        L.requestPointerLock?.();
        return;
      }
      if (e.button === 0) this.mouseBreak = true;
      if (e.button === 2) this.hooks.place();
    });
    window.addEventListener('mouseup', (e) => { if (e.button === 0) this.mouseBreak = false; });
    L.addEventListener('contextmenu', (e) => e.preventDefault());
    document.addEventListener('mousemove', (e) => {
      if (document.pointerLockElement === L) this.rotate(e.movementX, e.movementY, MOUSE_SENS);
    });
    L.addEventListener('wheel', (e) => {
      if (document.pointerLockElement === L) this.hooks.scrollSlot(Math.sign(e.deltaY));
    }, { passive: true });
    window.addEventListener('keydown', (e) => {
      if (e.code === 'KeyE') { this.hooks.toggleInventory(); return; }
      if (this.hooks.isPaused()) return;
      if (/^Digit[1-9]$/.test(e.code)) this.hooks.selectSlot(+e.code.slice(5) - 1);
      this.keys.add(e.code);
      if (e.code === 'Space') e.preventDefault();
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.code));
    window.addEventListener('blur', () => { this.keys.clear(); this.mouseBreak = false; });
  }
}
