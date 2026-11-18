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

export class Sky {
  constructor(scene) {
    this.scene = scene;
    this.time = 0.02; // start just after sunrise
    this.light = 1;
    this.fogNear = 38; // set from the view distance
    this.fogFar = 80;
    this.skyColor = new THREE.Color();

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
  }

  get isNight() { return this.time > 0.53 && this.time < 0.97; }

  // dayUniform: shader uniform holding the linear daylight brightness for world materials
  update(dt, camPos, dayUniform, underwater) {
    this.time = (this.time + dt / DAY_LENGTH) % 1;
    const { sky, light } = sample(this.time);
    this.light = light;
    this.skyColor.setRGB(sky[0], sky[1], sky[2], THREE.SRGBColorSpace);

    if (underwater) {
      const deep = new THREE.Color(0.08, 0.22, 0.55).multiplyScalar(0.4 + 0.6 * light);
      this.scene.background = deep;
      this.scene.fog.color.copy(deep);
      this.scene.fog.near = 1; this.scene.fog.far = 20;
    } else {
      this.scene.background = this.skyColor;
      this.scene.fog.color.copy(this.skyColor);
      this.scene.fog.near = this.fogNear; this.scene.fog.far = this.fogFar;
    }

    const lin = Math.pow(light, 2.2) * 0.85 + 0.15 * light; // keep nights dark but readable
    dayUniform.value = lin;

    // sun rises in +x, sets in -x; the moon is opposite
    const a = this.time * Math.PI * 2;
    const dir = new THREE.Vector3(Math.cos(a), Math.sin(a), 0.25).normalize();
    this.sun.position.copy(camPos).addScaledVector(dir, 120);
    this.sun.lookAt(camPos);
    this.moon.position.copy(camPos).addScaledVector(dir, -120);
    this.moon.lookAt(camPos);

    this.stars.position.copy(camPos);
    this.stars.rotation.z = a;
    const night = Math.max(0, Math.min(1, (0.3 - light) / 0.08 + 0.1));
    this.stars.material.opacity = underwater ? 0 : night;
  }
}
