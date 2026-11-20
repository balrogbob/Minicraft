// Fishing: tap with a fishing rod to cast a bobber. If it lands on water, wait for a bite (the bobber
// plunges and splashes), then tap again quickly to reel in a fish. Tap at any other time to reel in empty.
import * as THREE from 'three';

const GRAVITY = 18;
const CAST_SPEED = 11;
const WATER_TOP = 0.875; // the water surface sits a little below the block top (as in world.js)
const MAX_LINE = 28; // walk further away than this and the line snaps back
export const BITE_WINDOW = 1.3; // seconds you have to reel in once a fish bites
const biteDelay = () => 5 + Math.random() * 12; // seconds of waiting before the next bite

export class Fishing {
  constructor(scene, sound) {
    this.scene = scene;
    this.sound = sound;
    this.state = null; // { phase: 'flying' | 'ground' | 'waiting' | 'bite', pos, vel, timer, t }
    this.bobber = new THREE.Group();
    const mat = (c) => new THREE.MeshBasicMaterial({ color: c });
    this.mats = [mat(0xd8382e), mat(0xf4f1ea)];
    const top = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.1, 0.16), this.mats[0]);
    top.position.y = 0.05;
    const bottom = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.1, 0.16), this.mats[1]);
    bottom.position.y = -0.05;
    this.bobber.add(top, bottom);
    this.bobber.visible = false;
    scene.add(this.bobber);
    const SEGS = 12;
    this.lineGeo = new THREE.BufferGeometry();
    this.lineGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array((SEGS + 1) * 3), 3));
    this.lineMat = new THREE.LineBasicMaterial({ color: 0xe8dcb0 });
    this.line = new THREE.Line(this.lineGeo, this.lineMat);
    this.line.frustumCulled = false;
    this.line.visible = false;
    scene.add(this.line);
    this.segs = SEGS;
  }

  get active() { return !!this.state; }
  get biting() { return this.state?.phase === 'bite'; }

  cast(eye, dir, weighted = false, baited = false) {
    this.weighted = weighted;
    this.baited = baited; // (v28: a worm on the hook: bites come twice as fast)
    const pos = eye.clone().addScaledVector(dir, 0.6);
    const vel = dir.clone().multiplyScalar(CAST_SPEED);
    vel.y += 3;
    this.state = { phase: 'flying', pos, vel, timer: 0, t: 0 };
    this.bobber.visible = this.line.visible = true;
    this.sound.swish();
  }

  // Reel in. Returns true if a fish was on the line.
  reel() {
    const caught = this.biting;
    const wet = this.state && this.state.phase !== 'flying' && this.state.phase !== 'ground';
    this.stop();
    if (wet) this.sound.splash(false);
    return caught;
  }

  stop() {
    this.state = null;
    this.bobber.visible = this.line.visible = false;
  }

  // Advance the bobber. tip is where the line leaves the rod; brightness tints it with the day/night light.
  // Returns 'bite' the moment a fish bites and 'escaped' when one gets away, otherwise null.
  update(dt, world, tip, brightness) {
    const s = this.state;
    if (!s) return null;
    s.t += dt;
    let event = null;
    if (s.pos.distanceTo(tip) > MAX_LINE) { this.stop(); return 'snapped'; }
    if (s.phase === 'flying') {
      s.vel.y -= GRAVITY * dt;
      const steps = Math.max(1, Math.ceil(s.vel.length() * dt / 0.2));
      for (let i = 0; i < steps && s.phase === 'flying'; i++) {
        const next = s.pos.clone().addScaledVector(s.vel, dt / steps);
        const bx = Math.floor(next.x), by = Math.floor(next.y), bz = Math.floor(next.z);
        if (world.isWater(bx, by, bz) && next.y <= by + WATER_TOP) {
          // landed on water: float at the surface of this column
          let top = by;
          while (world.isWater(bx, top + 1, bz)) top++;
          s.pos.set(next.x, top + WATER_TOP, next.z);
          s.phase = 'waiting';
          s.timer = biteDelay() * (this.weighted ? 0.5 : 1) * (this.baited ? 0.5 : 1); // a lead sinker gets the bait down where the fish are
          this.sound.splash(false);
        } else if (world.isSolid(bx, by, bz)) {
          s.phase = 'ground'; // came down on land: nothing will bite here
          s.vel.set(0, 0, 0);
        } else s.pos.copy(next);
      }
      if (s.pos.y < -10) { this.stop(); return null; }
    } else if (s.phase === 'waiting') {
      if (!world.isWater(Math.floor(s.pos.x), Math.floor(s.pos.y), Math.floor(s.pos.z))) { s.phase = 'ground'; }
      else if ((s.timer -= dt) <= 0) {
        s.phase = 'bite';
        s.timer = BITE_WINDOW;
        this.sound.splash(false);
        this.sound.tone?.(300, 0.12, 0.15, 'sine', 140); // a "plop"
        event = 'bite';
      }
    } else if (s.phase === 'bite') {
      if ((s.timer -= dt) <= 0) {
        s.phase = 'waiting';
        s.timer = biteDelay() * (this.weighted ? 0.5 : 1) * (this.baited ? 0.5 : 1); // a lead sinker gets the bait down where the fish are
        event = 'escaped';
      }
    }
    // draw the bobber, bobbing gently, or plunging and shaking while a fish bites
    let y = s.pos.y;
    let x = s.pos.x, z = s.pos.z;
    if (s.phase === 'waiting') y += Math.sin(s.t * 2.2) * 0.02;
    if (s.phase === 'bite') {
      y -= 0.06 + Math.sin(s.t * 30) * 0.03; // dips, but the red top stays above the surface
      x += Math.sin(s.t * 23) * 0.03; z += Math.cos(s.t * 19) * 0.03;
    }
    this.bobber.position.set(x, y, z);
    const b = Math.max(0.25, brightness);
    this.mats[0].color.setRGB(0.85 * b, 0.22 * b, 0.18 * b);
    this.mats[1].color.setRGB(0.95 * b, 0.94 * b, 0.9 * b);
    this.lineMat.color.setRGB(0.9 * b, 0.86 * b, 0.69 * b);
    // the line sags between the rod tip and the bobber
    const p = this.lineGeo.attributes.position;
    const len = tip.distanceTo(this.bobber.position);
    const sag = s.phase === 'flying' ? 0 : Math.min(0.7, len * 0.04);
    const end = y + 0.1, floor = Math.min(tip.y, end); // never sag below the bobber (into the water)
    for (let i = 0; i <= this.segs; i++) {
      const f = i / this.segs;
      const ly = Math.max(floor, tip.y + (end - tip.y) * f - sag * 4 * f * (1 - f));
      p.setXYZ(i, tip.x + (x - tip.x) * f, ly, tip.z + (z - tip.z) * f);
    }
    p.needsUpdate = true;
    return event;
  }
}
