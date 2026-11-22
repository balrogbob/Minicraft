// Day/night cycle: sky and fog colour, sun, moon, stars and overall world brightness.
import * as THREE from 'three';

export const DAY_LENGTH = 12 * 60; // seconds for a full day + night

// Key colours through the day. `t` is time of day: 0 = sunrise, 0.25 = noon, 0.5 = sunset, 0.75 = midnight.
const KEYS = [
  { t: 0.0, sky: [0.98, 0.62, 0.42], light: 0.6 },
  { t: 0.05, sky: [0.53, 0.77, 0.96], light: 1.0 },
  { t: 0.45, sky: [0.53, 0.77, 0.96], light: 1.0 },
  { t: 0.5, sky: [0.95, 0.52, 0.32], light: 0.6 },
  { t: 0.56, sky: [0.04, 0.06, 0.14], light: 0.22 },
  { t: 0.94, sky: [0.04, 0.06, 0.14], light: 0.22 },
  { t: 1.0, sky: [0.98, 0.62, 0.42], light: 0.6 },
];

function sample(t) {
  for (let i = 0; i < KEYS.length - 1; i++) {
    const a = KEYS[i], b = KEYS[i + 1];
    if (t >= a.t && t <= b.t) {
      const f = (t - a.t) / (b.t - a.t || 1);
      return {
        sky: a.sky.map((v, k) => v + (b.sky[k] - v) * f),
        light: a.light + (b.light - a.light) * f,
      };
    }
  }
  return KEYS[0];
}

function discTexture(draw) {
  const c = document.createElement('canvas');
  c.width = c.height = 32;
  draw(c.getContext('2d'));
  const t = new THREE.CanvasTexture(c);
  t.magFilter = THREE.NearestFilter;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// Clouds (v41): a flat layer of blocky clouds above the world, drifting with the wind, that follows you.
// The pattern is a seamless 64 x 64 map of cover, each pixel CLOUD_PX blocks across.
const CLOUD_Y = 84, CLOUD_PX = 8, CLOUD_N = 64, CLOUD_SIZE = 300;
function cloudTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = CLOUD_N;
  const g = c.getContext('2d'), img = g.createImageData(CLOUD_N, CLOUD_N);
  let seed = 9173;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  // smooth noise that wraps: random values on coarse grids, eased in between, at two scales
  const layer = (n) => {
    const v = Array.from({ length: n * n }, rnd);
    return (x, y) => {
      const fx = (x / CLOUD_N) * n, fy = (y / CLOUD_N) * n, x0 = Math.floor(fx), y0 = Math.floor(fy);
      const tx = fx - x0, ty = fy - y0, sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty);
      const at = (i, j) => v[((j % n) * n + (i % n))];
      const a = at(x0, y0) + (at(x0 + 1, y0) - at(x0, y0)) * sx, b = at(x0, y0 + 1) + (at(x0 + 1, y0 + 1) - at(x0, y0 + 1)) * sx;
      return a + (b - a) * sy;
    };
  };
  const big = layer(8), small = layer(16);
  for (let y = 0; y < CLOUD_N; y++) for (let x = 0; x < CLOUD_N; x++) {
    const k = big(x, y) * 0.7 + small(x, y) * 0.3, i = (y * CLOUD_N + x) * 4;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = 255;
    img.data[i + 3] = k > 0.56 ? 235 : 0; // (cloud or clear sky: hard edges, like the world)
  }
  g.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.magFilter = t.minFilter = THREE.NearestFilter; t.generateMipmaps = false;
  t.repeat.set(CLOUD_SIZE / (CLOUD_N * CLOUD_PX), CLOUD_SIZE / (CLOUD_N * CLOUD_PX));
  return t;
}
// fades the layer out toward its edge, so you never see where it ends
function cloudFade() {
  const n = 64, c = document.createElement('canvas');
  c.width = c.height = n;
  const g = c.getContext('2d'), img = g.createImageData(n, n);
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const d = Math.hypot(x + 0.5 - n / 2, y + 0.5 - n / 2) / (n / 2), k = Math.max(0, Math.min(1, (1 - d) / 0.45)), i = (y * n + x) * 4;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = Math.round(k * k * 255); img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.NoColorSpace;
  return t;
}

export class Sky {
  constructor(scene) {
    this.scene = scene;
    this.time = 0.02; // start just after sunrise
    this.light = 1;
    this.fogNear = 38; // set from the view distance
    this.fogFar = 80;
    this.skyColor = new THREE.Color();
    this.sunDir = new THREE.Vector3(0, 1, 0); // towards the sun (for shadows and water glints)

    const sunTex = discTexture((g) => {
      g.fillStyle = 'rgba(255,240,170,0.35)'; g.fillRect(0, 0, 32, 32);
      g.fillStyle = '#fff6c8'; g.fillRect(6, 6, 20, 20);
      g.fillStyle = '#ffe680'; g.fillRect(8, 8, 16, 16);
    });
    const moonTex = discTexture((g) => {
      g.fillStyle = '#dfe4ee'; g.fillRect(8, 8, 16, 16);
      g.fillStyle = '#b9c0cf'; g.fillRect(11, 11, 4, 4); g.fillRect(18, 17, 3, 3); g.fillRect(13, 19, 2, 2);
    });
    const disc = (map, size) => {
      const m = new THREE.Mesh(
        new THREE.PlaneGeometry(size, size),
        new THREE.MeshBasicMaterial({ map, transparent: true, fog: false, depthWrite: false }),
      );
      m.renderOrder = -1;
      scene.add(m);
      return m;
    };
    this.sun = disc(sunTex, 22);
    this.moon = disc(moonTex, 16);

    // stars: random points on a sphere, faded in at night
    const pts = [];
    for (let i = 0; i < 700; i++) {
      const v = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize().multiplyScalar(130);
      pts.push(v.x, v.y, v.z);
    }
    const sg = new THREE.BufferGeometry();
    sg.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    this.stars = new THREE.Points(sg, new THREE.PointsMaterial({
      color: 0xffffff, size: 2, sizeAttenuation: false, transparent: true, opacity: 0, fog: false, depthWrite: false,
    }));
    this.stars.renderOrder = -2;
    scene.add(this.stars);

    this.cloudDrift = 0;
    this.clouds = new THREE.Mesh(new THREE.PlaneGeometry(CLOUD_SIZE, CLOUD_SIZE), new THREE.MeshBasicMaterial({
      map: cloudTexture(), alphaMap: cloudFade(), transparent: true, depthWrite: false, fog: false, side: THREE.DoubleSide,
    }));
    this.clouds.rotation.x = -Math.PI / 2;
    this.clouds.renderOrder = -1;
    scene.add(this.clouds);
  }

  get isNight() { return this.time > 0.53 && this.time < 0.97; }

  // dayUniform: shader uniform holding the linear daylight brightness for world materials
  update(dt, camPos, dayUniform, underwater) {
    this.time = (this.time + dt / DAY_LENGTH) % 1;
    let { sky, light } = sample(this.time);
    // weather: clouds grey the sky and dim the day; a sandstorm turns everything tan and close
    const w = this.weather ?? { overcast: 0, level: 0, kind: 'rain' };
    if (w.overcast > 0) {
      const sand = w.kind === 'sand' && w.level > 0.05;
      const grey = sand ? [0.8, 0.68, 0.48] : [0.56, 0.6, 0.66];
      const k = w.overcast * (sand ? 0.85 * w.level : 0.7);
      sky = sky.map((v, i) => v + (grey[i] * Math.max(light, 0.25) - v) * k);
      light *= 1 - 0.3 * w.overcast;
    }
    this.light = light;
    this.skyColor.setRGB(sky[0], sky[1], sky[2], THREE.SRGBColorSpace);

    if (underwater) {
      const deep = new THREE.Color(0.08, 0.22, 0.55).multiplyScalar(0.4 + 0.6 * light);
      this.scene.background = deep;
      this.scene.fog.color.copy(deep);
      this.scene.fog.near = 1; this.scene.fog.far = this.diving ? 44 : 20; // (a diving helmet's glass helps you see)
    } else {
      this.scene.background = this.skyColor;
      this.scene.fog.color.copy(this.skyColor);
      const close = w.kind === 'sand' ? w.level * 0.75 : w.level * 0.3; // rain and snow shorten the view a little
      this.scene.fog.near = this.fogNear * (1 - close); this.scene.fog.far = this.fogFar * (1 - close * 0.8);
      // morning valley mist (set by the game, 0..1): pale, and close in
      this.mistLevel = (this.mistLevel ?? 0) + ((this.mist ?? 0) - (this.mistLevel ?? 0)) * Math.min(1, dt * 0.5);
      const m = this.mistLevel;
      if (m > 0.01) {
        const pale = new THREE.Color(0.82, 0.85, 0.88).multiplyScalar(Math.max(light, 0.3));
        this.scene.fog.color.lerp(pale, m * 0.8);
        this.scene.background = this.scene.fog.color.clone();
        this.scene.fog.near *= 1 - m * 0.9; this.scene.fog.far *= 1 - m * 0.6;
      }
    }

    const lin = Math.pow(light, 2.2) * 0.85 + 0.15 * light; // keep nights dark but readable
    dayUniform.value = lin;

    // sun rises in +x, sets in -x; the moon is opposite
    const a = this.time * Math.PI * 2;
    const dir = this.sunDir.set(Math.cos(a), Math.sin(a), 0.25).normalize();
    this.sun.position.copy(camPos).addScaledVector(dir, 120);
    this.sun.lookAt(camPos);
    this.moon.position.copy(camPos).addScaledVector(dir, -120);
    this.moon.lookAt(camPos);

    this.stars.position.copy(camPos);
    this.stars.rotation.z = a;
    const night = Math.max(0, Math.min(1, (0.3 - light) / 0.08 + 0.1));
    this.stars.material.opacity = underwater ? 0 : night * (1 - (w.overcast ?? 0));
    this.sun.visible = this.moon.visible = (w.overcast ?? 0) < 0.6;

    // clouds: white by day, warm at sunrise and sunset, dim at night, grey and thicker when it's overcast
    const oc = w.overcast ?? 0;
    this.cloudDrift += dt * (0.8 + 1.6 * oc); // (blocks a second, east: faster in a storm)
    const cl = this.clouds, tex = cl.material.map, span = CLOUD_N * CLOUD_PX;
    cl.visible = !underwater && (this.mistLevel ?? 0) < 0.3;
    cl.position.set(camPos.x, CLOUD_Y, camPos.z);
    tex.offset.set((camPos.x - this.cloudDrift - CLOUD_SIZE / 2) / span, -(camPos.z + CLOUD_SIZE / 2) / span);
    const warm = Math.max(0, 1 - Math.abs(light - 0.6) / 0.25) * (light < 0.95 ? 1 : 0);
    // (clamped before the power: a stormy night is darker than a clear one, and a negative number to a
    // fractional power is NaN, which turned the clouds black)
    const day = Math.max(0.035, Math.max(0, Math.min(1, (light - 0.22) / 0.6)) ** 1.6);
    const cc = cl.material.color.setRGB(1, 1, 1).lerp(this.skyColor, 0.15 + 0.35 * warm).multiplyScalar(day * (1 - 0.45 * oc));
    // and never darker than the sky behind them: at night or in a storm they're a shade lighter than it
    const sk = this.skyColor;
    if (light < 0.5) cc.setRGB(Math.max(cc.r, sk.r * 1.25 + 0.004), Math.max(cc.g, sk.g * 1.25 + 0.004), Math.max(cc.b, sk.b * 1.2 + 0.004));
    cl.material.opacity = 0.85 + 0.15 * oc;
  }
}
