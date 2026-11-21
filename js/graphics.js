// Fancy graphics (v36): optional effects for computers with a strong graphics card.
// All of them are off unless the player turns them on in the menu.
//   shadows    - the sun casts shadows (a depth picture of the world taken from the sun)
//   bloom      - bright things (lava, lamps, sun glints) glow softly
//   water      - a water surface with moving waves, sky reflections and sun glints
//   refraction - you see the bottom through the water, bent by the waves
//   caustics   - rippling light on blocks under sunlit water
// Torch light is already flood-filled block by block, so it never shines through walls;
// it needs no shadow pictures of its own.
import * as THREE from 'three';

export const GFX_DEFAULTS = { shadows: false, bloom: false, water: false, refraction: false, caustics: false };
export const GFX_NAMES = { shadows: 'Sun shadows', bloom: 'Bloom', water: 'Fancy water', refraction: 'Water refraction', caustics: 'Water caustics' };

export const WATER_LAYER = 3; // water meshes: drawn after everything they are looked through
export const LATE_LAYER = 4; // see-through things drawn after the water (rain, snow)
const SHADOW_LAYER = 2;
const SHADOW_RES = 2048;
const SHADOW_RANGE = 44; // blocks around the player that get shadows
const SHADOW_BACK = 150; // how far towards the sun the shadow camera sits

// Uniforms shared with the world materials (main.js merges them into its light uniforms).
export const gfxUniforms = {
  uTime: { value: 0 },
  uSunDir: { value: new THREE.Vector3(0, 1, 0) },
  uSunStr: { value: 0 }, // 0..1: how much direct sun there is (sun height, clouds)
  uShadowMap: { value: null },
  uShadowMat: { value: new THREE.Matrix4() },
  uShadowStr: { value: 0 },
  uShadowTexel: { value: 1 / SHADOW_RES },
  uShadowDepth: { value: SHADOW_BACK * 2 },
  uCaustics: { value: 0 },
  uFancyWater: { value: 0 },
  uRefract: { value: 0 },
  uRefrTex: { value: null },
  uResolution: { value: new THREE.Vector2(1, 1) },
  uSkyCol: { value: new THREE.Color() },
};

// ---------- shader code for the world materials ----------

export const GFX_FRAG_HEAD = `
uniform float uTime;
uniform vec3 uSunDir;
uniform float uSunStr;
uniform sampler2D uShadowMap;
uniform mat4 uShadowMat;
uniform float uShadowStr;
uniform float uShadowTexel;
uniform float uShadowDepth;
uniform float uCaustics;
uniform float uFancyWater;
uniform float uRefract;
uniform sampler2D uRefrTex;
uniform vec2 uResolution;
uniform vec3 uSkyCol;
varying float vWet;
vec3 gfxNormal() {
  vec3 n = normalize(cross(dFdx(vWorldP), dFdy(vWorldP)));
  return dot(n, cameraPosition - vWorldP) < 0.0 ? -n : n;
}
// 1 = in sunlight, 0 = in shadow
float gfxShadow(vec3 n) {
  float ndl = dot(n, uSunDir);
  float facing = smoothstep(-0.02, 0.14, ndl);
  if (facing <= 0.0) return 0.0;
  vec3 p = (uShadowMat * vec4(vWorldP + n * 0.06, 1.0)).xyz;
  vec2 e = min(p.xy, 1.0 - p.xy);
  float edge = smoothstep(0.0, 0.08, min(e.x, e.y));
  if (edge <= 0.0 || p.z >= 1.0) return 1.0;
  float bias = (0.03 + 0.16 * (1.0 - clamp(ndl, 0.0, 1.0))) / uShadowDepth;
  float lit = 0.0;
  for (int i = -1; i <= 1; i++) for (int j = -1; j <= 1; j++)
    lit += step(p.z - bias, texture2D(uShadowMap, p.xy + vec2(float(i), float(j)) * uShadowTexel).r);
  return mix(1.0, min(lit / 9.0, facing), edge);
}
// bright, slowly wandering lines of light, like sun through ripples
float gfxCaustic(vec3 wp) {
  vec2 p = wp.xz + uSunDir.xz * wp.y * 0.4;
  float t = uTime;
  vec2 q = p * 1.25 + vec2(sin(p.y * 1.7 + t * 1.1), cos(p.x * 1.9 - t * 0.9)) * 0.6;
  float a = abs(sin(q.x * 2.1 + t) + sin(q.y * 2.3 - t * 0.8));
  vec2 r = p * 1.05 + vec2(cos(p.y * 1.3 - t * 0.7), sin(p.x * 1.5 + t * 0.6)) * 0.7;
  float b = abs(sin(r.x * 2.7 - t * 0.6) + sin(r.y * 2.5 + t * 1.2));
  return (1.0 - smoothstep(0.0, 0.55, a)) * 0.6 + (1.0 - smoothstep(0.0, 0.55, b)) * 0.6;
}
`;

// replaces the plain "daylight x sunlight" term
export const GFX_SUN_TERM = `
float sunT = uDay * vSky;
if (uShadowStr > 0.0 && sunT > 0.0) sunT *= 1.0 - uShadowStr * (1.0 - gfxShadow(gfxNormal()));
if (uCaustics > 0.0 && vWet > 0.5) sunT *= 1.0 + gfxCaustic(vWorldP) * (0.25 + 0.75 * uSunStr);
`;

// water surface: runs after the light, only in the water material
export const GFX_WATER = `
if (uFancyWater > 0.5 || uRefract > 0.5) {
  vec3 ng = gfxNormal();
  vec3 V = normalize(cameraPosition - vWorldP);
  vec3 N = ng;
  if (abs(ng.y) > 0.5) {
    vec2 p = vWorldP.xz; float t = uTime;
    vec2 g = vec2(0.8, 0.6) * cos(dot(p, vec2(0.8, 0.6)) * 1.3 + t * 1.6) * 0.07
      + vec2(-0.5, 0.86) * cos(dot(p, vec2(-0.5, 0.86)) * 2.1 + t * 2.2) * 0.05
      + vec2(0.95, -0.3) * cos(dot(p, vec2(0.95, -0.3)) * 3.7 + t * 2.9) * 0.03
      + vec2(-0.2, -0.98) * cos(dot(p, vec2(-0.2, -0.98)) * 5.3 + t * 3.4) * 0.02;
    N = normalize(vec3(-g.x, sign(ng.y), -g.y));
  }
  float F = 0.03 + 0.97 * pow(1.0 - max(dot(N, V), 0.0), 5.0);
  vec3 col = diffuseColor.rgb;
  float alpha = diffuseColor.a;
  if (uRefract > 0.5) {
    float dist = length(cameraPosition - vWorldP);
    vec2 suv = gl_FragCoord.xy / uResolution + (N.xz - ng.xz) * 1.1 / (3.0 + dist);
    vec3 under = texture2D(uRefrTex, clamp(suv, vec2(0.002), vec2(0.998))).rgb;
    col = mix(under * vec3(0.45, 0.7, 0.8), col, 0.42);
    alpha = 1.0;
  }
  if (uFancyWater > 0.5) {
    vec3 R = reflect(-V, N);
    vec3 refl = mix(uSkyCol * 0.75, uSkyCol * 1.1 + 0.03, clamp(R.y, 0.0, 1.0)) * mix(0.12, 1.0, vSky);
    float spec = pow(max(dot(R, uSunDir), 0.0), 220.0) * 3.0 * uSunStr * vSky;
    col = mix(col, refl, F * 0.85) + vec3(1.0, 0.94, 0.78) * spec;
    alpha = mix(alpha, 1.0, F);
  }
  diffuseColor.rgb = col;
  diffuseColor.a = alpha;
}
`;

// ---------- full-screen passes ----------

const QUAD_VERT = 'varying vec2 vUv;\nvoid main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }';
const COPY_FRAG = 'uniform sampler2D tSrc;\nvarying vec2 vUv;\nvoid main() { gl_FragColor = texture2D(tSrc, vUv); }';
const BRIGHT_FRAG = `uniform sampler2D tSrc; uniform vec2 uTexel;
varying vec2 vUv;
vec3 pick(vec2 uv) {
  vec3 c = texture2D(tSrc, uv).rgb;
  float l = max(c.r, max(c.g, c.b)); // (brightest channel: lava and lamps glow, not just white things)
  float k = clamp((l - 0.72) / 0.28, 0.0, 1.0);
  return c * k * k;
}
void main() { // 4 taps: halves the picture without flicker
  vec3 c = pick(vUv + uTexel * vec2(-0.5, -0.5)) + pick(vUv + uTexel * vec2(0.5, -0.5))
    + pick(vUv + uTexel * vec2(-0.5, 0.5)) + pick(vUv + uTexel * vec2(0.5, 0.5));
  gl_FragColor = vec4(c * 0.25, 1.0);
}`;
const BLUR_FRAG = `uniform sampler2D tSrc; uniform vec2 uDir;
varying vec2 vUv;
void main() {
  vec3 c = texture2D(tSrc, vUv).rgb * 0.227027;
  c += (texture2D(tSrc, vUv + uDir * 1.3846).rgb + texture2D(tSrc, vUv - uDir * 1.3846).rgb) * 0.316216;
  c += (texture2D(tSrc, vUv + uDir * 3.2308).rgb + texture2D(tSrc, vUv - uDir * 3.2308).rgb) * 0.070270;
  gl_FragColor = vec4(c, 1.0);
}`;
const FINAL_FRAG = `uniform sampler2D tSrc; uniform sampler2D tB1; uniform sampler2D tB2; uniform float uBloom;
varying vec2 vUv;
vec3 toSRGB(vec3 c) {
  c = clamp(c, 0.0, 1.0);
  return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c));
}
void main() {
  vec3 c = texture2D(tSrc, vUv).rgb;
  if (uBloom > 0.0) c += (texture2D(tB1, vUv).rgb * 0.7 + texture2D(tB2, vUv).rgb * 0.9) * uBloom;
  gl_FragColor = vec4(toSRGB(c), 1.0);
}`;

function pass(frag, uniforms) {
  return new THREE.ShaderMaterial({ vertexShader: QUAD_VERT, fragmentShader: frag, uniforms, depthTest: false, depthWrite: false });
}

export class Graphics {
  constructor(renderer, opts = {}) {
    this.renderer = renderer;
    this.opts = { ...GFX_DEFAULTS, ...opts };
    this.sunDir = new THREE.Vector3(0, 1, 0);
    this.overcast = 0;
    this.lastError = null;
    // full-screen quad
    this.quadCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2));
    this.quad.frustumCulled = false;
    this.quadScene = new THREE.Scene();
    this.quadScene.add(this.quad);
    this.copyMat = pass(COPY_FRAG, { tSrc: { value: null } });
    this.brightMat = pass(BRIGHT_FRAG, { tSrc: { value: null }, uTexel: { value: new THREE.Vector2() } });
    this.blurMat = pass(BLUR_FRAG, { tSrc: { value: null }, uDir: { value: new THREE.Vector2() } });
    this.finalMat = pass(FINAL_FRAG, { tSrc: { value: null }, tB1: { value: null }, tB2: { value: null }, uBloom: { value: 0 } });
    // shadow camera: looks along the sunlight at the ground around the player
    this.shadowCam = new THREE.OrthographicCamera(-SHADOW_RANGE, SHADOW_RANGE, SHADOW_RANGE, -SHADOW_RANGE, 1, SHADOW_BACK * 2);
    this.shadowCam.layers.set(SHADOW_LAYER);
    this.depthMats = new WeakMap();
    this.plainDepth = new THREE.MeshDepthMaterial({ side: THREE.DoubleSide });
    this.bias = new THREE.Matrix4().set(0.5, 0, 0, 0.5, 0, 0.5, 0, 0.5, 0, 0, 0.5, 0.5, 0, 0, 0, 1);
    this.size = new THREE.Vector2();
    this.casters = [];
  }

  set(key, on) { this.opts[key] = !!on; if (!this.opts.shadows) this.freeShadows(); if (!this.opts.bloom && !this.opts.refraction) this.freeTargets(); }

  // anything turned on?
  get fancy() { return Object.values(this.opts).some(Boolean); }

  render(scene, camera) {
    const U = gfxUniforms, o = this.opts, r = this.renderer;
    U.uTime.value = (performance.now() / 1000) % 3600;
    U.uSunDir.value.copy(this.sunDir);
    const sun = THREE.MathUtils.smoothstep(this.sunDir.y, 0.02, 0.25) * (1 - 0.9 * this.overcast);
    U.uSunStr.value = sun;
    if (scene.fog) U.uSkyCol.value.copy(scene.fog.color);
    U.uFancyWater.value = o.water ? 1 : 0;
    U.uCaustics.value = o.caustics ? 1 : 0;
    U.uShadowStr.value = 0;
    if (o.shadows && sun > 0.01) {
      try { this.renderShadows(scene, camera); U.uShadowStr.value = 0.5 * sun; } catch (err) { this.fail(err, 'shadows'); }
    }
    U.uRefract.value = 0;
    if (!o.bloom && !o.refraction) { r.render(scene, camera); return; }
    try { this.renderPost(scene, camera); } catch (err) {
      this.fail(err, o.refraction ? 'refraction' : 'bloom');
      r.setRenderTarget(null);
      U.uRefract.value = 0;
      r.render(scene, camera);
    }
  }

  // an effect that breaks on this computer is switched off rather than spoiling every frame
  fail(err, key) {
    this.lastError = err;
    this.opts[key] = false;
    this.onFail?.(key, err);
  }

  // ---------- shadows ----------

  renderShadows(scene, camera) {
    const r = this.renderer;
    if (!this.shadowRT) {
      this.shadowRT = new THREE.WebGLRenderTarget(SHADOW_RES, SHADOW_RES, { depthTexture: new THREE.DepthTexture(SHADOW_RES, SHADOW_RES), generateMipmaps: false });
      gfxUniforms.uShadowMap.value = this.shadowRT.depthTexture;
    }
    // aim along the sunlight; snap to whole shadow texels so edges don't crawl as you walk
    const cam = this.shadowCam, d = this.sunDir;
    const rot = new THREE.Matrix4().lookAt(d, new THREE.Vector3(), new THREE.Vector3(0, 0, 1));
    const inv = rot.clone().transpose();
    const texel = (SHADOW_RANGE * 2) / SHADOW_RES;
    const c = camera.getWorldPosition(new THREE.Vector3()).applyMatrix4(inv);
    c.x = Math.round(c.x / texel) * texel; c.y = Math.round(c.y / texel) * texel;
    c.applyMatrix4(rot);
    cam.position.copy(c).addScaledVector(d, SHADOW_BACK);
    cam.quaternion.setFromRotationMatrix(rot);
    cam.updateMatrixWorld(true);
    gfxUniforms.uShadowMat.value.copy(this.bias).multiply(cam.projectionMatrix).multiply(cam.matrixWorldInverse);
    // everything solid casts: chunk meshes, mobs, carts... (not glass-like or see-through things)
    const casters = this.casters;
    casters.length = 0;
    scene.traverseVisible((obj) => {
      if (!obj.isMesh) return;
      const m = Array.isArray(obj.material) ? obj.material[0] : obj.material;
      if (!m || m.transparent || m.depthWrite === false || obj.userData.noShadow || obj.layers.isEnabled(WATER_LAYER)) { obj.layers.disable(SHADOW_LAYER); return; }
      obj.layers.enable(SHADOW_LAYER);
      let dm = this.depthMats.get(m);
      if (!dm) {
        dm = m.map && m.alphaTest > 0 ? new THREE.MeshDepthMaterial({ map: m.map, alphaTest: m.alphaTest, side: THREE.DoubleSide }) : this.plainDepth;
        this.depthMats.set(m, dm);
      }
      casters.push(obj, obj.material);
      obj.material = dm;
    });
    const bg = scene.background, fog = scene.fog;
    scene.background = null; scene.fog = null;
    const was = r.getRenderTarget();
    try {
      r.setRenderTarget(this.shadowRT);
      r.clear();
      r.render(scene, cam);
    } finally {
      r.setRenderTarget(was);
      scene.background = bg; scene.fog = fog;
      for (let i = 0; i < casters.length; i += 2) casters[i].material = casters[i + 1];
      casters.length = 0;
    }
  }

  freeShadows() {
    if (!this.shadowRT) return;
    this.shadowRT.depthTexture.dispose();
    this.shadowRT.dispose();
    this.shadowRT = null;
    gfxUniforms.uShadowMap.value = null;
  }

  // ---------- refraction and bloom ----------

  ensureTargets() {
    const r = this.renderer;
    r.getDrawingBufferSize(this.size);
    const w = Math.max(1, this.size.x), h = Math.max(1, this.size.y);
    if (this.rtMain && this.rtMain.width === w && this.rtMain.height === h) return;
    this.freeTargets();
    const half = r.extensions.has('EXT_color_buffer_half_float') || r.extensions.has('EXT_color_buffer_float');
    const type = half ? THREE.HalfFloatType : THREE.UnsignedByteType;
    const mk = (tw, th, depth) => new THREE.WebGLRenderTarget(Math.max(1, tw), Math.max(1, th), {
      type, depthBuffer: depth, generateMipmaps: false, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter,
    });
    this.rtMain = mk(w, h, true);
    this.rtRefr = mk(w, h, false);
    this.b1 = [mk(w >> 1, h >> 1, false), mk(w >> 1, h >> 1, false)];
    this.b2 = [mk(w >> 2, h >> 2, false), mk(w >> 2, h >> 2, false)];
    gfxUniforms.uResolution.value.set(w, h);
    gfxUniforms.uRefrTex.value = this.rtRefr.texture;
  }

  freeTargets() {
    for (const t of [this.rtMain, this.rtRefr, ...(this.b1 ?? []), ...(this.b2 ?? [])]) t?.dispose();
    this.rtMain = this.rtRefr = this.b1 = this.b2 = null;
    gfxUniforms.uRefrTex.value = null;
  }

  blit(mat, target) {
    this.quad.material = mat;
    this.renderer.setRenderTarget(target);
    this.renderer.render(this.quadScene, this.quadCam);
  }

  renderPost(scene, camera) {
    const r = this.renderer, o = this.opts, U = gfxUniforms;
    this.ensureTargets();
    r.setRenderTarget(this.rtMain);
    if (o.refraction) {
      // 1: everything except the water (and the rain that falls in front of it)
      const mask = camera.layers.mask;
      camera.layers.disable(WATER_LAYER); camera.layers.disable(LATE_LAYER);
      r.render(scene, camera);
      // 2: keep a copy for the water to look through
      this.copyMat.uniforms.tSrc.value = this.rtMain.texture;
      this.blit(this.copyMat, this.rtRefr);
      // 3: the water and the rain, on top
      r.setRenderTarget(this.rtMain);
      camera.layers.mask = (1 << WATER_LAYER) | (1 << LATE_LAYER);
      U.uRefract.value = 1;
      const ac = r.autoClear, bg = scene.background;
      r.autoClear = false; scene.background = null;
      try { r.render(scene, camera); } finally {
        r.autoClear = ac; scene.background = bg;
        camera.layers.mask = mask;
        U.uRefract.value = 0;
      }
    } else {
      r.render(scene, camera);
    }
    let bloom = 0;
    if (o.bloom) {
      const [a1, a2] = this.b1, [c1, c2] = this.b2;
      this.brightMat.uniforms.tSrc.value = this.rtMain.texture;
      this.brightMat.uniforms.uTexel.value.set(1 / this.rtMain.width, 1 / this.rtMain.height);
      this.blit(this.brightMat, a1);
      const blur = (src, dst, dx, dy) => {
        this.blurMat.uniforms.tSrc.value = src.texture;
        this.blurMat.uniforms.uDir.value.set(dx / src.width, dy / src.height);
        this.blit(this.blurMat, dst);
      };
      blur(a1, a2, 1, 0); blur(a2, a1, 0, 1);
      this.copyMat.uniforms.tSrc.value = a1.texture;
      this.blit(this.copyMat, c1);
      blur(c1, c2, 1, 0); blur(c2, c1, 0, 1);
      blur(c1, c2, 2, 0); blur(c2, c1, 0, 2);
      bloom = 0.65;
    }
    const f = this.finalMat.uniforms;
    f.tSrc.value = this.rtMain.texture;
    f.tB1.value = this.b1[0].texture;
    f.tB2.value = this.b2[0].texture;
    f.uBloom.value = bloom;
    this.blit(this.finalMat, null);
  }
}
