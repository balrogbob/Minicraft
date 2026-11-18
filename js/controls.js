// Touch controls (tablet) + keyboard/mouse (desktop).
//
// Touch:  left side   = floating joystick to walk
//         right side  = drag to look, tap to place/use, double-tap and hold still to break
//                       (just hold, with the bow, or if double-tap breaking is turned off in the menu)
//         buttons     = jump, inventory (wired up in main.js)
// Desktop: click to capture mouse, WASD + space, left hold = break, right click = place,
//          E = inventory, 1-9 / wheel = hotbar.

const TAP_MS = 250;
const HOLD_MS = 280;
const MOVE_SLOP = 12; // px a finger can wander and still count as a tap/hold
const LOOK_SENS = 0.006; // radians per px (touch)
const MOUSE_SENS = 0.0025;
const JOY_RADIUS = 60;
const DOUBLE_MS = 300; // a second touch this soon after a tap (and near it) is a double tap
const DOUBLE_SLOP = 60; // px between the two touches of a double tap

// Keyboard actions and their default keys (KeyboardEvent.code). The player can rebind them from the menu.
export const KEY_ACTIONS = [
  ['forward', 'Walk forward', 'KeyW'], ['back', 'Walk back', 'KeyS'], ['left', 'Step left', 'KeyA'], ['right', 'Step right', 'KeyD'],
  ['jump', 'Jump / swim / fly up', 'Space'], ['down', 'Fly down (creative)', 'ShiftLeft'], ['inventory', 'Inventory', 'KeyE'],
  ['map', 'World map', 'KeyM'], ['fly', 'Fly on/off (creative)', 'KeyF'], ['drop', 'Throw item (Shift: whole stack)', 'KeyQ'],
];
export const DEFAULT_KEYS = Object.fromEntries(KEY_ACTIONS.map(([a, , k]) => [a, k]));
// How a key code is shown: "KeyW" -> "W", "Digit3" -> "3", "ShiftLeft" -> "Left Shift".
export function keyLabel(code) {
  if (!code) return '—';
  if (/^Key[A-Z]$/.test(code)) return code.slice(3);
  if (/^Digit\d$/.test(code)) return code.slice(5);
  const m = /^(Shift|Control|Alt|Meta)(Left|Right)$/.exec(code);
  if (m) return `${m[2]} ${m[1] === 'Control' ? 'Ctrl' : m[1]}`;
  return code.replace(/^Arrow/, 'Arrow ').replace(/^Numpad/, 'Num ');
}

// When the touch actually happened. Event timestamps use the same clock as performance.now(),
// but aren't delayed by slow frames, so a quick tap during a lag spike still counts as a tap.
const eventTime = (e) => (e.timeStamp > 0 && e.timeStamp <= performance.now() ? e.timeStamp : performance.now());

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
    this.binds = { ...DEFAULT_KEYS };
    this.capture = null; // set while waiting for a key to rebind: called with its code
    this.downTouch = false;
    // Double tap and hold to break, so a finger resting on the screen while you walk doesn't dig. A tap's
    // action waits DOUBLE_MS in case a second touch follows; if one does, that touch can break.
    this.doubleTapBreak = true;
    this.lastTap = null; // { time, x, y } of the last quick tap
    this.pendingTap = null; // timer for that tap's action
    this.bindTouch();
    this.bindDesktop();
  }

  get jump() { return this.jumpTouch || this.keys.has(this.binds.jump); }
  get down() { return this.downTouch || this.keys.has(this.binds.down); }

  reset() {
    this.joy = null; this.look = null;
    this.moveX = this.moveZ = 0;
    this.breaking = false; this.jumpTouch = false; this.downTouch = false;
    clearTimeout(this.pendingTap); this.pendingTap = null; this.lastTap = null;
    this.keys.clear();
    this.showJoy(false);
  }

  // Does holding to break need a double tap first? (Not with the bow, which you hold to draw.)
  needsDoubleTap() { return this.doubleTapBreak && !this.hooks.quickHold?.(); }

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
      const now = eventTime(e);
      for (const t of e.changedTouches) {
        if (t.clientX < window.innerWidth * 0.4 && !this.joy) {
          this.joy = { id: t.identifier, ox: t.clientX, oy: t.clientY };
          this.showJoy(true, t.clientX, t.clientY);
        } else if (!this.look) {
          const lt = this.lastTap;
          const second = !!lt && now - lt.time < DOUBLE_MS && Math.hypot(t.clientX - lt.x, t.clientY - lt.y) < DOUBLE_SLOP;
          if (second) { clearTimeout(this.pendingTap); this.pendingTap = null; this.lastTap = null; } // (the first tap's action is dropped)
          this.look = { id: t.identifier, x: t.clientX, y: t.clientY, start: now, stillSince: now, anchorX: t.clientX, anchorY: t.clientY, travel: 0, breaking: false, armed: second };
        }
      }
    }, { passive: false });

    L.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const now = eventTime(e);
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
      const now = eventTime(e);
      for (const t of e.changedTouches) {
        if (this.joy && t.identifier === this.joy.id) {
          this.joy = null; this.moveX = this.moveZ = 0;
          this.showJoy(false);
        } else if (this.look && t.identifier === this.look.id) {
          const lk = this.look;
          // judged by the touch's own timestamps: a short tap still counts even if a slow frame
          // in between already started treating it as a hold (a real hold always outlasts TAP_MS)
          if (now - lk.start < TAP_MS && lk.travel < MOVE_SLOP) {
            if (!this.needsDoubleTap() || lk.armed) this.hooks.place(); // (a double tap does what one tap does)
            else {
              // wait a moment: if a second touch comes, it's a double tap (and may become a hold to break)
              this.lastTap = { time: now, x: t.clientX, y: t.clientY };
              clearTimeout(this.pendingTap);
              this.pendingTap = setTimeout(() => { this.pendingTap = null; this.lastTap = null; if (!this.hooks.isPaused()) this.hooks.place(); }, DOUBLE_MS);
            }
          }
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
    if (lk && !lk.breaking && (lk.armed || !this.needsDoubleTap()) && performance.now() - lk.stillSince > HOLD_MS) {
      lk.breaking = true;
    }
    const keyBreak = this.mouseBreak;
    this.breaking = !!(lk?.breaking || keyBreak);
    if (!this.joy) {
      const k = this.keys, b = this.binds;
      const x = (k.has(b.right) ? 1 : 0) - (k.has(b.left) ? 1 : 0);
      const z = (k.has(b.forward) ? 1 : 0) - (k.has(b.back) ? 1 : 0);
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
      if (this.capture) { e.preventDefault(); const f = this.capture; this.capture = null; f(e.code); return; }
      if (e.target?.tagName === 'TEXTAREA' || e.target?.tagName === 'INPUT') return; // typing on a sign
      if (e.code === this.binds.inventory) { this.hooks.toggleInventory(); return; }
      if (e.code === this.binds.map) { this.hooks.toggleMap?.(); return; }
      if (this.hooks.isPaused()) return;
      if (e.code === this.binds.fly) { this.hooks.toggleFly?.(); return; }
      if (e.code === this.binds.drop) { this.hooks.throwItem?.(e.shiftKey || e.ctrlKey); return; }
      if (/^Digit[1-9]$/.test(e.code)) this.hooks.selectSlot(+e.code.slice(5) - 1);
      this.keys.add(e.code);
      if (e.code === this.binds.jump || e.code === 'Space') e.preventDefault();
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.code));
    window.addEventListener('blur', () => { this.keys.clear(); this.mouseBreak = false; });
  }
}
