// Fancy graphics (v36-37): optional effects for computers with a strong graphics card.
// All of them are off unless the player turns them on in the menu.
//   shadows    - the sun casts shadows (a depth picture of the world taken from the sun): 0 off, 1 low, 2 high
//   bloom      - bright things (lava, lamps, sun glints) glow softly
//   water      - a water surface with moving waves, sky reflections and sun glints
//   refraction - you see the bottom through the water, bent by the waves
//   caustics   - rippling light on blocks under sunlit water
//   torch shadows (0-50) - the nearest lights that aren't in sunlight cast shadows too
//   torchDay   - (v40) ...and the ones in sunlight as well (their shadows show in shade: under roofs, in doorways)
//   godrays    - shafts of sunlight around things that hide the sun
//   sway       - leaves and plants move in the wind
//   reflections - water mirrors the world above it (the scene drawn again, upside down)
//   ripple     - the view wobbles while your head is under water
//   bounce     - (v46) colour bleed: lit surfaces tint the darker ones beside them a little
//   shafts (0-50) - (v46) the nearest lights shine through the air: beams through windows, gaps and bars,
//                 shadows of pillars cut through the glow (marched through the torch shadow pictures)
//   mirrors    - (v46) mirror blocks show the world live (the scene drawn again from your eye's mirror image)
// Torch light itself is flood-filled block by block, so it never shines through walls; torch shadows
// only add the sharper shadows of things standing in the light (pillars, mobs, machines, furniture).
import * as THREE from 'three';

export const GFX_DEFAULTS = {
  shadows: 0, torches: 0, torchRate: 2, bloom: false, water: false, reflections: false, refraction: false, caustics: false,
  godrays: false, sway: false, ripple: false, torchDay: false, mirrors: false, bounce: false, shafts: 0,
};
export const MAX_TORCH_SHADOWS = 50;
export const GFX_TOGGLES = ['torchDay', 'bloom', 'godrays', 'sway', 'water', 'reflections', 'mirrors', 'bounce', 'refraction', 'caustics', 'ripple'];
export const GFX_NAMES = {
  shadows: 'Sun shadows', torches: 'Torch shadows', bloom: 'Bloom', water: 'Fancy water', refraction: 'Water refraction', caustics: 'Water caustics',
  godrays: 'God rays', sway: 'Swaying leaves and plants', reflections: 'Water reflections', ripple: 'Underwater ripple',
  torchDay: 'Torch shadows by day', mirrors: 'Live mirrors', bounce: 'Colour bleed', shafts: 'Torch light shafts',
};
export const SHADOW_LEVELS = ['off', 'low', 'high'];
// v38: quick presets for the fancy graphics. 'auto' starts at medium and steps up or down to keep the game
// smooth; changing any single setting makes it 'custom'.
export const GFX_PRESETS = {
  off: { ...GFX_DEFAULTS },
  low: { ...GFX_DEFAULTS, water: true, sway: true, ripple: true },
  medium: { ...GFX_DEFAULTS, shadows: 1, torches: 3, torchRate: 1, bloom: true, water: true, caustics: true, sway: true, ripple: true, mirrors: true },
  high: { shadows: 2, torches: 8, torchRate: 2, shafts: 2, bloom: true, water: true, reflections: true, refraction: true, caustics: true, godrays: true, sway: true, ripple: true, mirrors: true, bounce: true },
  ultra: { shadows: 2, torches: 24, torchRate: 6, shafts: 6, bloom: true, water: true, reflections: true, refraction: true, caustics: true, godrays: true, sway: true, ripple: true, mirrors: true, bounce: true },
};
export const PRESET_ORDER = ['off', 'low', 'medium', 'high', 'ultra'];
export const PRESET_NAMES = { off: 'Off', low: 'Low', medium: 'Medium', high: 'High', ultra: 'Ultra', auto: 'Auto', custom: 'Custom' };

export const WATER_LAYER = 3; // water meshes: drawn after everything they are looked through
export const LATE_LAYER = 4; // see-through things drawn after the water (rain, snow)
const SHADOW_LAYER = 2;
// sun shadow quality: picture size, blocks around the player covered, soft edges, redraw every n frames
const SHADOW_Q = [null, { res: 1024, range: 32, soft: 0, every: 2 }, { res: 2048, range: 44, soft: 1, every: 1 }];
const SHADOW_BACK = 150; // how far towards the sun the shadow camera sits
// each light gets 6 tiles (one per cube face) in one shared picture, TORCH_ROW lights to a row;
// the more lights, the smaller the tiles
const TORCH_ROW = 4;
// (and never so big the whole picture is wider or taller than this device can make one: many phones and tablets
// stop at 4096, and a picture too big for them leaves each light just a small circle with no shadows)
const torchTile = (n, max = 4096) => Math.min(n <= 5 ? 256 : n <= 16 ? 192 : 128,
  Math.floor(max / (6 * Math.min(n, TORCH_ROW))), Math.floor(max / Math.ceil(n / TORCH_ROW)));
const TORCH_FOV = 96; // a little over 90 degrees, so neighbouring faces overlap at the seams
const TORCH_SCAN = 0.4; // seconds between looks for the nearest lights
// the six cube faces: direction to look in, and which way is up
const FACES = [[1, 0, 0, 0, 1, 0], [-1, 0, 0, 0, 1, 0], [0, 1, 0, 0, 0, 1], [0, -1, 0, 0, 0, 1], [0, 0, 1, 0, 1, 0], [0, 0, -1, 0, 1, 0]];

// Uniforms shared with the world materials (main.js merges them into its light uniforms).
export const gfxUniforms = {
  uTime: { value: 0 },
  uSunDir: { value: new THREE.Vector3(0, 1, 0) },
  uSunStr: { value: 0 }, // 0..1: how much direct sun there is (sun height, clouds)
  uShadowMap: { value: null },
  uGlassMap: { value: null }, uGlassOn: { value: 0 }, // (v46) the colour of the stained glass the sunlight comes through
  uShadowMat: { value: new THREE.Matrix4() },
  uShadowStr: { value: 0 },
  uShadowTexel: { value: 1 / 2048 },
  uShadowSoft: { value: 1 },
  uShadowRange: { value: 44 }, // (v46) how many blocks the shadow picture reaches either side of you
  uShadowDepth: { value: SHADOW_BACK * 2 },
  uCaustics: { value: 0 },
  uFancyWater: { value: 0 },
  uRefract: { value: 0 },
  uRefrTex: { value: null },
  uResolution: { value: new THREE.Vector2(1, 1) },
  uSkyCol: { value: new THREE.Color() },
  uTorchCount: { value: 0 },
  uTorchL: { value: Array.from({ length: MAX_TORCH_SHADOWS }, () => new THREE.Vector4()) }, // xyz, slot * 32 + reach
  uTorchMap: { value: null },
  uTorchTexel: { value: new THREE.Vector2(1, 1) },
  uTorchTile: { value: new THREE.Vector2(1, 1) },
  uFaceRot: { value: FACES.map(() => new THREE.Matrix3()) },
  uFaceScale: { value: 1 / Math.tan((TORCH_FOV / 2) * Math.PI / 180) },
  uSway: { value: 0 },
  uReflect: { value: 0 },
  uReflH: { value: 0 },
  uReflMat: { value: new THREE.Matrix4() },
  uReflTex: { value: null },
};

// vertex shader: decode the flags packed into the sky attribute (sky + 2 x by-water + 4 x sway + 16 x glows
// + 32 x how many blocks up a plant this point is), and sway
// (1 = leaves: the whole block wobbles a little; 2 = the top of a plant: it bends)
export const GFX_VERT_HEAD = `
uniform float uTime;
uniform float uSway;
varying float vWet;
varying float vGlow;
`;
export const GFX_VERT_DECODE = `
float plantH = floor(sky / 32.0);
float skyG = sky - plantH * 32.0;
vGlow = floor(skyG / 16.0);
float skyS = skyG - vGlow * 16.0;
float swayK = floor(skyS / 4.0);
float skyR = skyS - swayK * 4.0;
vWet = step(1.5, skyR);
vSky = skyR - vWet * 2.0;
`;
export const GFX_VERT_SWAY = `
if (uSway > 0.5 && swayK > 0.5) {
  vec3 swp = (modelMatrix * vec4(position, 1.0)).xyz;
  // (a plant bends as one piece from its root: every block of a tall one keeps time with the rest, by its
  // column, and sways more the higher up it is: plantH is how many blocks up from the root this point is)
  float ph = swayK > 1.5 ? floor(swp.x) * 0.7 + floor(swp.z) * 0.6 : swp.x * 0.7 + swp.z * 0.6 + swp.y * 0.3;
  float amp = swayK > 1.5 ? 0.08 * pow(max(plantH, 1.0), 0.8) : 0.03;
  transformed.x += (sin(uTime * 1.7 + ph) + 0.4 * sin(uTime * 2.9 + ph * 1.3)) * amp;
  transformed.z += cos(uTime * 1.3 + ph * 0.8) * amp * 0.8;
  if (swayK < 1.5) transformed.y += sin(uTime * 2.1 + ph) * amp * 0.3;
}
`;

// ---------- shader code for the world materials ----------

export const GFX_FRAG_HEAD = `
uniform float uTime;
uniform vec3 uSunDir;
uniform float uSunStr;
uniform sampler2D uShadowMap;
uniform sampler2D uGlassMap;
uniform float uGlassOn;
uniform mat4 uShadowMat;
uniform float uShadowStr;
uniform float uShadowTexel;
uniform float uShadowSoft;
uniform float uShadowRange;
uniform float uShadowDepth;
uniform float uCaustics;
uniform float uFancyWater;
uniform float uRefract;
uniform sampler2D uRefrTex;
uniform vec2 uResolution;
uniform vec3 uSkyCol;
uniform int uTorchCount;
uniform vec4 uTorchL[${MAX_TORCH_SHADOWS}];
uniform sampler2D uTorchMap;
uniform vec2 uTorchTexel;
uniform vec2 uTorchTile;
uniform mat3 uFaceRot[6];
uniform float uFaceScale;
uniform float uReflect;
uniform float uReflH;
uniform mat4 uReflMat;
uniform sampler2D uReflTex;
varying float vWet;
vec3 gfxNormal() {
  vec3 n = normalize(cross(dFdx(vWorldP), dFdy(vWorldP)));
  return dot(n, cameraPosition - vWorldP) < 0.0 ? -n : n;
}
// points spread over a disc (for soft shadow edges)
const vec2 GFX_DISC[16] = vec2[](
  vec2(-0.94, -0.40), vec2(0.95, -0.77), vec2(-0.09, -0.93), vec2(0.34, 0.29), vec2(-0.92, 0.46), vec2(-0.82, 0.15),
  vec2(-0.38, -0.88), vec2(-0.20, 0.32), vec2(0.97, 0.76), vec2(0.44, -0.97), vec2(0.54, 0.75), vec2(-0.26, 0.97),
  vec2(0.79, 0.20), vec2(-0.20, -0.27), vec2(-0.55, -0.43), vec2(0.18, -0.48));
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
  if (uShadowSoft > 0.5) {
    // (v46) soft edges that widen with distance: find how far the things casting the shadow are from this spot
    // (the average depth of the blockers around it), then blur the edge by that much: a tree's shadow is soft at
    // its far end and sharp where the trunk meets the ground
    float a = fract(sin(dot(floor(gl_FragCoord.xy), vec2(12.9898, 78.233))) * 43758.5453) * 6.2832;
    mat2 rot = mat2(cos(a), sin(a), -sin(a), cos(a));
    float uvPerBlock = 0.5 / uShadowRange, zsum = 0.0, nb = 0.0;
    for (int i = 0; i < 8; i++) {
      float z = texture2D(uShadowMap, p.xy + rot * GFX_DISC[i * 2] * 1.6 * uvPerBlock).r;
      if (z < p.z - bias) { zsum += z; nb += 1.0; }
    }
    if (nb < 0.5) return mix(1.0, facing, edge);
    float dz = (p.z - zsum / nb) * uShadowDepth; // blocks from the blockers to here
    float pen = max(clamp(dz * 0.035, 0.0, 1.3) * uvPerBlock, 1.5 * uShadowTexel);
    for (int i = 0; i < 16; i++) lit += step(p.z - bias, texture2D(uShadowMap, p.xy + rot * GFX_DISC[i] * pen).r);
    lit /= 16.0;
  } else { // (low quality: 4 taps)
    for (int i = 0; i < 4; i++)
      lit += step(p.z - bias, texture2D(uShadowMap, p.xy + (vec2(float(i - (i / 2) * 2), float(i / 2)) - 0.5) * uShadowTexel).r);
    lit *= 0.25;
  }
  return mix(1.0, min(lit, facing), edge);
}
// (v46) sunlight that came through stained glass on its way here takes on the glass's colour: the glass picture
// holds the colour of the nearest stained glass along each ray of sunlight, and how far along the ray it is
vec3 gfxGlass(vec3 n) {
  vec3 p = (uShadowMat * vec4(vWorldP + n * 0.06, 1.0)).xyz;
  if (p.x <= 0.0 || p.y <= 0.0 || p.x >= 1.0 || p.y >= 1.0 || p.z >= 1.0) return vec3(1.0);
  vec4 g = texture2D(uGlassMap, p.xy);
  return p.z - 0.004 > g.a ? g.rgb : vec3(1.0);
}
// how much of one light reaches this spot: 1 = all, 0 = blocked (4 taps in its cube picture)
float gfxTorchVis(float slot, vec3 L, float d, float reach, float bias) {
  vec3 a = abs(L);
  int f = a.x >= a.y && a.x >= a.z ? (L.x > 0.0 ? 0 : 1) : a.y >= a.z ? (L.y > 0.0 ? 2 : 3) : (L.z > 0.0 ? 4 : 5);
  vec3 p = uFaceRot[f] * L;
  vec2 uv = clamp(p.xy / -p.z * uFaceScale * 0.5 + 0.5, 0.0, 1.0);
  vec2 tile = uTorchTile;
  float row = floor(slot / ${TORCH_ROW}.0);
  vec2 lo = vec2((slot - row * ${TORCH_ROW}.0) * 6.0 + float(f), row) * tile;
  vec2 c = lo + uv * tile, hi = lo + tile - uTorchTexel;
  lo += uTorchTexel;
  float lit = 0.0;
  d = (d - bias) / reach; // (the picture holds distance / reach)
  lit += step(d, texture2D(uTorchMap, clamp(c + vec2(-0.75, -0.75) * uTorchTexel, lo, hi)).r);
  lit += step(d, texture2D(uTorchMap, clamp(c + vec2(0.75, -0.75) * uTorchTexel, lo, hi)).r);
  lit += step(d, texture2D(uTorchMap, clamp(c + vec2(-0.75, 0.75) * uTorchTexel, lo, hi)).r);
  lit += step(d, texture2D(uTorchMap, clamp(c + vec2(0.75, 0.75) * uTorchTexel, lo, hi)).r);
  return lit * 0.25;
}
// torch light at this spot is shaded by the nearby shadow-casting lights, weighted by how close each is
float gfxTorchShadow(vec3 n) {
  float sw = 0.0, sv = 0.0;
  float texA = 2.2214 * uTorchTexel.x / uTorchTile.x; // how wide one texel of a light's picture is, per block away
  for (int i = 0; i < ${MAX_TORCH_SHADOWS}; i++) {
    if (i >= uTorchCount) break;
    vec4 l = uTorchL[i];
    float slot = floor(l.w / 32.0), reach = l.w - slot * 32.0;
    vec3 L0 = vWorldP - l.xyz;
    float d0 = length(L0);
    if (d0 >= reach) continue;
    float ndl = dot(n, -L0 / max(d0, 0.001));
    // (v40) look up the picture from just off the surface, about a texel or two out (more where the light
    // skims across it), with only a hair of depth allowance: a big allowance let light in along the foot of
    // whatever casts the shadow, a line of light a texel or two wide at the edge of every block
    float texW = d0 * texA;
    vec3 L = L0 + n * texW * (1.0 + 1.5 * (1.0 - clamp(ndl, 0.0, 1.0)));
    float d = length(L);
    float w = 1.0 - d0 / reach; w *= w;
    // the light's own block (a lantern's glass, a torch's stick, and the faces it touches) is always lit: the
    // light sits 0.55 up its block. (Not everything within a block of the light: that left a round patch of light
    // with a hard edge, lighting faces that turn away from it.)
    vec3 own = abs(vWorldP - l.xyz + vec3(0.0, 0.05, 0.0));
    float v = max(own.x, max(own.y, own.z)) < 0.52 ? 1.0 : ndl <= -0.05 ? 0.0 : gfxTorchVis(slot, L, d, reach, 0.01 + texW * 0.5);
    sw += w; sv += w * v;
  }
  if (sw < 0.001) return 1.0;
  return mix(1.0, mix(0.22, 1.0, sv / sw), clamp(sw * 4.0, 0.0, 1.0));
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
vec3 sunC = vec3(1.0);
if (uGlassOn > 0.5 && sunT > 0.0) sunC = gfxGlass(gfxNormal());
if (uCaustics > 0.0 && vWet > 0.5) sunT *= 1.0 + gfxCaustic(vWorldP) * (0.25 + 0.75 * uSunStr);
vec3 torchT = vTorchC * uFlicker;
if (uTorchCount > 0 && torchT.r + torchT.g + torchT.b > 0.03) torchT *= gfxTorchShadow(gfxNormal());
`;

// water surface: runs after the light, only in the water material
export const GFX_WATER = `
if (uFancyWater > 0.5 || uRefract > 0.5 || uReflect > 0.5) {
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
  vec3 R = reflect(-V, N);
  vec3 refl = vec3(0.0);
  float mirror = 0.0;
  if (uFancyWater > 0.5) {
    refl = mix(uSkyCol * 0.75, uSkyCol * 1.1 + 0.03, clamp(R.y, 0.0, 1.0)) * mix(0.12, 1.0, vSky);
    mirror = 1.0;
  }
  // the world above, mirrored: only on the water surface the mirror picture was taken for
  if (uReflect > 0.5 && ng.y > 0.5 && abs(vWorldP.y - uReflH) < 0.3) {
    vec4 rp = uReflMat * vec4(vWorldP, 1.0);
    vec2 ruv = rp.xy / rp.w + (N.xz - ng.xz) * 0.18;
    refl = texture2D(uReflTex, clamp(ruv, vec2(0.002), vec2(0.998))).rgb;
    mirror = 1.0;
    F = max(F, 0.06);
  }
  if (mirror > 0.0) {
    col = mix(col, refl, F * 0.85);
    alpha = mix(alpha, 1.0, F);
  }
  if (uFancyWater > 0.5) col += vec3(1.0, 0.94, 0.78) * pow(max(dot(R, uSunDir), 0.0), 220.0) * 3.0 * uSunStr * vSky;
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
// god rays: march from each pixel towards the sun, adding up the bright open sky near the sun that
// is not hidden behind anything (from the depth picture: nothing drawn there)
// (v46) colour bleed: the colour of the surfaces round each spot (within a block or two, and at about the same
// depth, so nothing far behind counts), gathered at half size; the final picture adds a little of it to darker spots,
// so a shaded corner by a sunlit red wall picks up some red
const BOUNCE_FRAG = `uniform sampler2D tSrc; uniform sampler2D tDepth; uniform float uNear; uniform float uFar; uniform float uProj; uniform float uAspect;
varying vec2 vUv;
float lin(float d) { float z = d * 2.0 - 1.0; return 2.0 * uNear * uFar / (uFar + uNear - z * (uFar - uNear)); }
void main() {
  float d0 = lin(texture2D(tDepth, vUv).r);
  if (d0 > uFar * 0.95) { gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0); return; }
  float rad = clamp(1.8 * uProj / d0, 0.003, 0.12);
  float rnd = fract(sin(dot(floor(gl_FragCoord.xy), vec2(12.9898, 78.233))) * 43758.5453) * 6.2832;
  vec3 acc = vec3(0.0); float wsum = 0.0;
  for (int i = 0; i < 12; i++) {
    float a = float(i) * 2.39996 + rnd, r = sqrt((float(i) + 0.5) / 12.0) * rad;
    vec2 uv = clamp(vUv + vec2(cos(a) / uAspect, sin(a)) * r, vec2(0.001), vec2(0.999));
    float d = lin(texture2D(tDepth, uv).r);
    float w = max(0.0, 1.0 - abs(d - d0) / 1.8);
    acc += texture2D(tSrc, uv).rgb * w; wsum += w;
  }
  gl_FragColor = vec4(wsum > 0.0 ? acc / wsum : vec3(0.0), 1.0);
}`;
const GOD_FRAG = `uniform sampler2D tDepth; uniform vec2 uSun; uniform float uAspect;
varying vec2 vUv;
float glow(vec2 uv) {
  if (uv.x < 0.0 || uv.y < 0.0 || uv.x > 1.0 || uv.y > 1.0) return 0.0;
  float sky = step(0.99999, texture2D(tDepth, uv).r);
  float k = max(0.0, 1.0 - length((uv - uSun) * vec2(uAspect, 1.0)) / 0.32);
  return sky * k * k;
}
void main() {
  vec2 step1 = (uSun - vUv) / 40.0, uv = vUv;
  float w = 1.0, acc = 0.0;
  for (int i = 0; i < 40; i++) { acc += glow(uv) * w; w *= 0.96; uv += step1; }
  gl_FragColor = vec4(vec3(acc / 40.0), 1.0);
}`;
// (v46) light shafts: march the view ray through the air near the nearest lights, adding the light each
// step gets from them (looked up in their shadow pictures, so walls, bars and pillars cut beams out of it)
const SHAFT_FRAG = `uniform sampler2D tDepth; uniform mat4 uInvProj; uniform mat4 uCamWorld; uniform vec3 uCamPos;
uniform vec4 uTorchL[${MAX_TORCH_SHADOWS}]; uniform vec3 uShaftC[${MAX_TORCH_SHADOWS}]; uniform int uShaftCount;
uniform sampler2D uTorchMap; uniform vec2 uTorchTexel; uniform vec2 uTorchTile; uniform mat3 uFaceRot[6]; uniform float uFaceScale;
varying vec2 vUv;
float vis(float slot, vec3 L, float d, float reach) {
  vec3 a = abs(L);
  int f = a.x >= a.y && a.x >= a.z ? (L.x > 0.0 ? 0 : 1) : a.y >= a.z ? (L.y > 0.0 ? 2 : 3) : (L.z > 0.0 ? 4 : 5);
  vec3 p = uFaceRot[f] * L;
  vec2 uv = clamp(p.xy / -p.z * uFaceScale * 0.5 + 0.5, 0.0, 1.0);
  float row = floor(slot / ${TORCH_ROW}.0);
  vec2 lo = vec2((slot - row * ${TORCH_ROW}.0) * 6.0 + float(f), row) * uTorchTile;
  vec2 c = clamp(lo + uv * uTorchTile, lo + uTorchTexel, lo + uTorchTile - uTorchTexel);
  return step((d - 0.05) / reach, texture2D(uTorchMap, c).r);
}
void main() {
  float z = texture2D(tDepth, vUv).r;
  vec4 v = uInvProj * vec4(vUv * 2.0 - 1.0, z * 2.0 - 1.0, 1.0);
  vec3 wp = (uCamWorld * vec4(v.xyz / v.w, 1.0)).xyz;
  vec3 ray = wp - uCamPos;
  float len = min(length(ray), 40.0);
  vec3 dir = ray / max(length(ray), 0.0001);
  float stepL = len / 28.0;
  // (a fixed per-pixel offset along the ray, so the steps don't show as rings; the blur after smooths it)
  float jit = fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715))));
  vec3 acc = vec3(0.0);
  for (int s = 0; s < 28; s++) {
    vec3 p = uCamPos + dir * ((float(s) + jit) * stepL);
    for (int i = 0; i < ${MAX_TORCH_SHADOWS}; i++) {
      if (i >= uShaftCount) break;
      vec4 l = uTorchL[i];
      float slot = floor(l.w / 32.0), reach = l.w - slot * 32.0;
      vec3 L = p - l.xyz;
      float d = length(L);
      if (d >= reach) continue;
      float k = 1.0 - d / reach;
      acc += uShaftC[i] * (k * k * k / (1.0 + d * d * 0.25)) * vis(slot, L, d, reach);
    }
  }
  gl_FragColor = vec4(acc * stepL * 0.035, 1.0);
}`;
const FINAL_FRAG = `uniform sampler2D tSrc; uniform sampler2D tB1; uniform sampler2D tB2; uniform float uBloom;
uniform sampler2D tGod; uniform float uGod; uniform vec3 uGodCol; uniform float uRipple; uniform float uTime;
uniform sampler2D tBounce; uniform float uBounce; uniform sampler2D tShaft; uniform float uShaft;
varying vec2 vUv;
vec3 toSRGB(vec3 c) {
  c = clamp(c, 0.0, 1.0);
  return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c));
}
void main() {
  vec2 uv = vUv;
  if (uRipple > 0.0) uv += vec2(sin(uv.y * 23.0 + uTime * 2.1) + 0.5 * sin(uv.y * 41.0 - uTime * 3.3),
    cos(uv.x * 19.0 + uTime * 1.7) + 0.5 * cos(uv.x * 37.0 + uTime * 2.6)) * 0.0035 * uRipple;
  uv = clamp(uv, vec2(0.001), vec2(0.999));
  vec3 c = texture2D(tSrc, uv).rgb;
  if (uBounce > 0.0) { // (v46: colour bleed, mostly into the darker parts)
    vec3 b = texture2D(tBounce, uv).rgb;
    float l = dot(c, vec3(0.2126, 0.7152, 0.0722)), lb = dot(b, vec3(0.2126, 0.7152, 0.0722));
    vec3 tint = min(b / max(lb, 0.02), vec3(2.0)); // (the neighbours' hue, brightness taken out)
    c *= mix(vec3(1.0), tint, 0.3 * uBounce * (1.0 - 0.4 * smoothstep(0.3, 0.9, l))); // (tints, never washes out: a red wall stays red, the floor by it goes pink)
  }
  if (uShaft > 0.0) c += texture2D(tShaft, uv).rgb * uShaft; // (v46: torch light shafts)
  if (uBloom > 0.0) c += (texture2D(tB1, uv).rgb * 0.7 + texture2D(tB2, uv).rgb * 0.9) * uBloom;
  if (uGod > 0.0) c += texture2D(tGod, uv).r * uGod * uGodCol;
  gl_FragColor = vec4(toSRGB(c), 1.0);
}`;

// distance-from-the-light pictures for torch shadows
const DIST_VERT = `varying vec3 vWP;
varying vec2 vUv;
void main() {
  vUv = uv;
  vec4 p = vec4(position, 1.0);
#ifdef USE_INSTANCING
  p = instanceMatrix * p;
#endif
  vec4 wp = modelMatrix * p;
  vWP = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const DIST_FRAG = `uniform vec4 uLight;
uniform float uCols;
uniform float uFirst;
uniform float uCount;
uniform sampler2D map;
uniform float alphaTest;
varying vec3 vWP;
varying vec2 vUv;
void main() {
#ifdef CUT_OUT
  if (texture2D(map, vUv).a < alphaTest) discard;
#endif
#ifdef GLASS
  { vec2 t = vec2(vUv.x, 1.0 - vUv.y) * uCols; vec2 tc = floor(t); float tile = tc.x + tc.y * uCols; vec2 f = fract(t) * 16.0;
    if (tile >= uFirst && tile < uFirst + uCount && f.x > 1.0 && f.x < 15.0 && f.y > 1.0 && f.y < 15.0) discard; } // (v46: stained glass colours torch light instead)
#endif
  float d = length(vWP - uLight.xyz);
  if (d < 0.9) discard; // the light's own block (a torch's stick, a lantern's glass) casts nothing
  gl_FragColor = vec4(d / uLight.w, 0.0, 0.0, 1.0); // (cleared to 1: nothing in the way)
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
    this.finalMat = pass(FINAL_FRAG, {
      tSrc: { value: null }, tB1: { value: null }, tB2: { value: null }, uBloom: { value: 0 },
      tGod: { value: null }, uGod: { value: 0 }, tBounce: { value: null }, uBounce: { value: 0 }, tShaft: { value: null }, uShaft: { value: 0 }, uGodCol: { value: new THREE.Color(1, 0.88, 0.62) }, uRipple: { value: 0 }, uTime: gfxUniforms.uTime,
    });
    this.bounceMat = pass(BOUNCE_FRAG, { tSrc: { value: null }, tDepth: { value: null }, uNear: { value: 0.1 }, uFar: { value: 100 }, uProj: { value: 1 }, uAspect: { value: 1 } });
    const G = gfxUniforms;
    this.shaftC = Array.from({ length: MAX_TORCH_SHADOWS }, () => new THREE.Vector3());
    this.shaftMat = pass(SHAFT_FRAG, {
      tDepth: { value: null }, uInvProj: { value: new THREE.Matrix4() }, uCamWorld: { value: new THREE.Matrix4() }, uCamPos: { value: new THREE.Vector3() },
      uTorchL: G.uTorchL, uShaftC: { value: this.shaftC }, uShaftCount: { value: 0 }, uTorchMap: G.uTorchMap, uTorchTexel: G.uTorchTexel,
      uTorchTile: G.uTorchTile, uFaceRot: G.uFaceRot, uFaceScale: G.uFaceScale,
    });
    this.shaftCount = 0;
    this.sunNow = 0;
    this.godMat = pass(GOD_FRAG, { tDepth: { value: null }, uSun: { value: new THREE.Vector2() }, uAspect: { value: 1 } });
    this.underwater = false;
    this.waterY = null; // set by the game: height of the water surface around the player, for reflections
    this.frame = 0;
    // shadow camera: looks along the sunlight at the ground around the player
    this.shadowCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 1, SHADOW_BACK * 2);
    this.shadowCam.layers.set(SHADOW_LAYER);
    this.depthMats = new WeakMap();
    this.plainDepth = new THREE.MeshDepthMaterial({ side: THREE.DoubleSide });
    this.bias = new THREE.Matrix4().set(0.5, 0, 0, 0.5, 0, 0.5, 0, 0.5, 0, 0, 0.5, 0.5, 0, 0, 0, 1);
    this.size = new THREE.Vector2();
    this.casters = [];
    this.shadowOnly = []; // (objects hidden from view but still drawn into shadows)
    // torch shadows
    this.lightU = { value: new THREE.Vector4() };
    this.distMats = new WeakMap();
    this.plainDist = this.distMat(null);
    this.faceCam = new THREE.PerspectiveCamera(TORCH_FOV, 1, 0.05, 16);
    this.faceCam.layers.set(SHADOW_LAYER);
    gfxUniforms.uFaceRot.value.forEach((m, f) => {
      const [dx, dy, dz, ux, uy, uz] = FACES[f];
      const cam = new THREE.PerspectiveCamera(TORCH_FOV, 1, 0.05, 16);
      cam.up.set(ux, uy, uz); cam.lookAt(dx, dy, dz); cam.updateMatrixWorld(true);
      m.setFromMatrix4(cam.matrixWorldInverse);
    });
    this.slots = []; // [{ x, y, z, r, row, ready }] (row: the light's place in the shared picture)
    // reflections: a camera mirrored in the water surface, clipped to what is above it
    this.mirrorCam = new THREE.PerspectiveCamera();
    this.mirrorCam.layers.set(0);
    this.clipPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    this.scanT = 0;
    this.rr = 0;
    this.findLights = null; // set by the game: (n) => nearest lights not in sunlight, [{ x, y, z, r }]
  }

  distMat(m) {
    const cut = !!(m?.map && m.alphaTest > 0), glass = !!m && m === this.glass?.material;
    return new THREE.ShaderMaterial({
      vertexShader: DIST_VERT, fragmentShader: DIST_FRAG, side: THREE.DoubleSide, defines: { ...(cut ? { CUT_OUT: '' } : {}), ...(glass ? { GLASS: '' } : {}) },
      uniforms: { uLight: this.lightU, map: { value: cut ? m.map : null }, alphaTest: { value: cut ? m.alphaTest : 0 }, ...(glass ? this.glassUniforms() : {}) },
    });
  }

  set(key, on) {
    const o = this.opts, was = o[key];
    const lightsWas = this.torchN();
    if (key === 'torches' || key === 'shafts') o[key] = Math.max(0, Math.min(MAX_TORCH_SHADOWS, on | 0));
    else if (key === 'torchRate') o.torchRate = Math.max(1, Math.min(MAX_TORCH_SHADOWS, on | 0));
    else if (key === 'shadows') o.shadows = Math.max(0, Math.min(2, on === true ? 2 : on | 0));
    else o[key] = !!on;
    if (key === 'shadows' && o.shadows !== was) this.freeShadows();
    if (this.torchN() !== lightsWas) this.freeTorches(); // (the picture is sized for the count)
    if (!o.bloom && !o.refraction && !o.godrays && !o.ripple && !o.bounce && !o.shafts) this.freeTargets();
    if (!o.reflections) this.freeReflections();
    this.scanT = 0;
  }

  // anything turned on?
  get fancy() { return Object.values(this.opts).some(Boolean); }

  render(scene, camera) {
    const U = gfxUniforms, o = this.opts, r = this.renderer;
    U.uTime.value = (performance.now() / 1000) % 3600;
    U.uSunDir.value.copy(this.sunDir);
    const sun = THREE.MathUtils.smoothstep(this.sunDir.y, 0.02, 0.25) * (1 - 0.9 * this.overcast);
    this.sunNow = sun;
    U.uSunStr.value = sun;
    if (scene.fog) U.uSkyCol.value.copy(scene.fog.color);
    U.uFancyWater.value = o.water ? 1 : 0;
    U.uCaustics.value = o.caustics ? 1 : 0;
    U.uSway.value = o.sway ? 1 : 0;
    this.frame++;
    U.uShadowStr.value = 0;
    U.uGlassOn.value = 0;
    if (o.shadows && sun > 0.01) {
      try { this.renderShadows(scene, camera); U.uShadowStr.value = 0.5 * sun; U.uGlassOn.value = this.glassRT ? 1 : 0; } catch (err) { this.fail(err, 'shadows'); this.freeShadows(); }
    }
    U.uTorchCount.value = 0;
    this.shaftCount = 0;
    if (this.torchN() > 0) {
      try { this.renderTorches(scene, camera); } catch (err) { this.fail(err, o.torches ? 'torches' : 'shafts'); this.freeTorches(); }
    }
    U.uReflect.value = 0;
    if (o.reflections && this.waterY !== null && !this.underwater && camera.position.y > this.waterY + 0.3) { // (v38: not with your eye at the surface: the mirror view went wrong there)
      try { this.renderReflection(scene, camera); } catch (err) { this.fail(err, 'reflections'); this.freeReflections(); }
    }
    U.uRefract.value = 0;
    const godrays = this.godStrength(camera);
    if (this.underwater) this.shaftCount = 0;
    if (!o.bloom && !o.refraction && !godrays && !o.bounce && !this.shaftCount && !(o.ripple && this.underwater)) { r.render(scene, camera); return; }
    try { this.renderPost(scene, camera, godrays); } catch (err) {
      this.fail(err, o.refraction ? 'refraction' : o.bloom ? 'bloom' : o.godrays ? 'godrays' : 'ripple');
      r.setRenderTarget(null);
      U.uRefract.value = 0;
      r.render(scene, camera);
    }
  }

  // an effect that breaks on this computer is switched off rather than spoiling every frame
  fail(err, key) {
    this.lastError = err;
    this.opts[key] = key === 'torches' || key === 'shadows' || key === 'shafts' ? 0 : false;
    this.onFail?.(key, err);
  }

  // how strong the god rays are this frame (0 = none): the sun must be up and in front of you
  godStrength(camera) {
    if (!this.opts.godrays || this.underwater) return 0;
    const fwd = camera.getWorldDirection(new THREE.Vector3());
    const facing = THREE.MathUtils.smoothstep(fwd.dot(this.sunDir), 0.2, 0.75);
    const up = THREE.MathUtils.smoothstep(this.sunDir.y, -0.04, 0.12) * (1 - 0.85 * this.overcast);
    const low = 1 + 0.6 * (1 - THREE.MathUtils.smoothstep(this.sunDir.y, 0.1, 0.6)); // stronger near sunrise and sunset
    return facing * up * low * 0.9;
  }

  // ---------- shadows ----------

  renderShadows(scene, camera) {
    const r = this.renderer, q = SHADOW_Q[this.opts.shadows];
    if (!this.shadowRT) {
      this.shadowRT = new THREE.WebGLRenderTarget(q.res, q.res, { depthTexture: new THREE.DepthTexture(q.res, q.res), generateMipmaps: false });
      gfxUniforms.uShadowMap.value = this.shadowRT.depthTexture;
      gfxUniforms.uShadowTexel.value = 1 / q.res;
      gfxUniforms.uShadowSoft.value = q.soft;
      gfxUniforms.uShadowRange.value = q.range;
      const sc = this.shadowCam;
      sc.left = sc.bottom = -q.range; sc.right = sc.top = q.range; sc.updateProjectionMatrix();
      this.shadowFrame = -1;
    }
    // (low quality redraws every other frame; the picture keeps its own matrix, so it still lines up)
    if (q.every > 1 && this.frame - this.shadowFrame < q.every) return;
    this.shadowFrame = this.frame;
    const SHADOW_RES = q.res, SHADOW_RANGE = q.range;
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
    const glass = this.glass;
    this.withCasters(scene, this.depthMats, (m) => (m === glass?.material ? this.glassDepth(m) : m.map && m.alphaTest > 0 ? new THREE.MeshDepthMaterial({ map: m.map, alphaTest: m.alphaTest, side: THREE.DoubleSide }) : this.plainDepth), () => {
      r.setRenderTarget(this.shadowRT);
      r.clear();
      r.render(scene, cam);
    });
    if (glass) this.renderGlass(scene, cam, SHADOW_RES);
  }

  // ---------- (v46) stained glass ----------
  // The game sets this.glass = { material, first, count, cols, colours }: the world's block material, and which
  // atlas tiles are stained glass (first .. first + count - 1, in an atlas cols tiles wide) and the colour of each.
  // A stained glass tile's coloured middle lets the sun through (coloured); its leading round the edge doesn't.
  glassUniforms() {
    const g = this.glass;
    return { uCols: { value: g.cols }, uFirst: { value: g.first }, uCount: { value: g.count }, uCol: { value: g.colours } };
  }

  glassDepth(m) {
    const mat = new THREE.MeshDepthMaterial({ map: m.map, alphaTest: m.alphaTest, side: THREE.DoubleSide });
    const u = this.glassUniforms();
    mat.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, u);
      shader.fragmentShader = 'uniform float uCols;\nuniform float uFirst;\nuniform float uCount;\n' + shader.fragmentShader.replace('#include <alphatest_fragment>', `#include <alphatest_fragment>
{ vec2 t = vec2(vMapUv.x, 1.0 - vMapUv.y) * uCols; vec2 tc = floor(t); float tile = tc.x + tc.y * uCols;
  vec2 f = fract(t) * 16.0;
  if (tile >= uFirst && tile < uFirst + uCount && f.x > 1.0 && f.x < 15.0 && f.y > 1.0 && f.y < 15.0) discard; }`);
    };
    mat.customProgramCacheKey = () => 'glass-depth';
    return mat;
  }

  renderGlass(scene, cam, res) {
    const r = this.renderer;
    if (!this.glassRT || this.glassRT.width !== res) {
      this.glassRT?.dispose();
      const half = r.extensions.has('EXT_color_buffer_half_float') || r.extensions.has('EXT_color_buffer_float');
      this.glassRT = new THREE.WebGLRenderTarget(res, res, { type: half ? THREE.HalfFloatType : THREE.UnsignedByteType, minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, generateMipmaps: false });
      gfxUniforms.uGlassMap.value = this.glassRT.texture;
    }
    if (!this.glassColourMat) {
      this.glassColourMat = new THREE.ShaderMaterial({
        uniforms: this.glassUniforms(), side: THREE.DoubleSide,
        vertexShader: 'varying vec2 vUv;\nvoid main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
        fragmentShader: `uniform float uCols;
uniform float uFirst;
uniform float uCount;
uniform vec3 uCol[${this.glass.count}];
varying vec2 vUv;
void main() {
  vec2 t = vec2(vUv.x, 1.0 - vUv.y) * uCols; vec2 tc = floor(t);
  float k = tc.x + tc.y * uCols - uFirst;
  vec2 f = fract(t) * 16.0;
  if (k < 0.0 || k >= uCount || f.x < 1.0 || f.x > 15.0 || f.y < 1.0 || f.y > 15.0) discard;
  vec3 c = uCol[0];
  for (int i = 1; i < ${this.glass.count}; i++) if (float(i) == floor(k)) c = uCol[i];
  gl_FragColor = vec4(c, gl_FragCoord.z);
}`,
      });
      this.glassNone = new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false, depthTest: false });
    }
    const glass = this.glass, cache = this.glassMats ??= new WeakMap();
    const clear = r.getClearColor(new THREE.Color()), alpha = r.getClearAlpha();
    this.withCasters(scene, cache, (m) => (m === glass.material ? this.glassColourMat : this.glassNone), () => {
      r.setRenderTarget(this.glassRT);
      r.setClearColor(0xffffff, 1);
      r.clear();
      r.render(scene, cam);
    });
    r.setClearColor(clear, alpha);
  }

  // Swap every solid thing's material for a shadow-picture one while draw() runs: chunk meshes, mobs,
  // carts, machines... (not glass-like or see-through things), then put them all back.
  withCasters(scene, cache, make, draw) {
    const r = this.renderer, casters = this.casters;
    casters.length = 0;
    // things drawn only into shadows (v45: your own body in first person, so you see your shadow)
    const shown = this.shadowOnly.filter((o) => !o.visible);
    for (const o of shown) o.visible = true;
    scene.traverseVisible((obj) => {
      if (!obj.isMesh) return;
      const m = Array.isArray(obj.material) ? obj.material[0] : obj.material;
      if (!m || m.transparent || m.depthWrite === false || obj.userData.noShadow || obj.layers.isEnabled(WATER_LAYER)) { obj.layers.disable(SHADOW_LAYER); return; }
      obj.layers.enable(SHADOW_LAYER);
      let sm = cache.get(m);
      if (!sm) { sm = make(m); cache.set(m, sm); }
      casters.push(obj, obj.material);
      obj.material = sm;
    });
    const bg = scene.background, fog = scene.fog;
    scene.background = null; scene.fog = null;
    const was = r.getRenderTarget();
    try { draw(); } finally {
      r.setRenderTarget(was);
      scene.background = bg; scene.fog = fog;
      for (let i = 0; i < casters.length; i += 2) casters[i].material = casters[i + 1];
      casters.length = 0;
      for (const o of shown) o.visible = false;
    }
  }

  // ---------- torch shadows ----------

  // how many lights get shadow pictures: enough for the torch shadows and the light shafts
  torchN() { return Math.max(this.opts.torches, this.opts.shafts); }

  renderTorches(scene, camera) {
    const r = this.renderer, n = this.torchN(), U = gfxUniforms;
    const now = performance.now() / 1000;
    // every so often, look for the nearest lights; keep the ones we already have where possible
    if (now >= this.scanT && this.findLights) {
      this.scanT = now + TORCH_SCAN;
      const want = this.findLights(n).slice(0, n);
      const key = (l) => `${l.x},${l.y},${l.z}`;
      const keep = this.slots.filter((s) => want.some((l) => key(l) === key(s)));
      const used = new Set(keep.map((s) => s.row));
      for (const l of want) {
        if (keep.some((s) => key(s) === key(l))) continue;
        let row = 0; while (used.has(row)) row++;
        used.add(row);
        keep.push({ ...l, row, ready: false });
      }
      this.slots = keep;
    }
    if (!this.slots.length) return;
    if (!this.maxTex) {
      const gl = r.getContext();
      this.maxTex = Math.min(r.capabilities.maxTextureSize, gl.getParameter(gl.MAX_RENDERBUFFER_SIZE) || 4096, gl.getParameter(gl.MAX_VIEWPORT_DIMS)?.[0] || 4096);
    }
    const T = torchTile(n, this.maxTex);
    if (!this.torchRT) {
      const half = r.extensions.has('EXT_color_buffer_half_float') || r.extensions.has('EXT_color_buffer_float');
      this.torchRT = new THREE.WebGLRenderTarget(T * 6 * Math.min(n, TORCH_ROW), T * Math.ceil(n / TORCH_ROW), {
        type: half ? THREE.HalfFloatType : THREE.UnsignedByteType, generateMipmaps: false, minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter,
      });
      U.uTorchMap.value = this.torchRT.texture;
      U.uTorchTexel.value.set(1 / this.torchRT.width, 1 / this.torchRT.height);
      U.uTorchTile.value.set(T / this.torchRT.width, T / this.torchRT.height);
    }
    // redraw the new lights, and some of the others in turn (things move about in the light)
    const todo = this.slots.filter((s) => !s.ready);
    for (let k = 0; k < Math.min(this.opts.torchRate, this.slots.length) && todo.length < this.slots.length; k++) {
      const s = this.slots[(this.rr++) % this.slots.length];
      if (!todo.includes(s)) todo.push(s);
    }
    if (todo.length) {
      const rt = this.torchRT, cam = this.faceCam, cc = new THREE.Color();
      r.getClearColor(cc);
      const ca = r.getClearAlpha();
      this.withCasters(scene, this.distMats, (m) => this.distMat(m), () => {
        r.setClearColor(0xffffff, 1);
        r.setRenderTarget(rt);
        rt.scissorTest = true;
        try {
          for (const s of todo) {
            this.lightU.value.set(s.x, s.y, s.z, s.r);
            cam.far = s.r + 1; cam.updateProjectionMatrix();
            for (let f = 0; f < 6; f++) {
              const [dx, dy, dz, ux, uy, uz] = FACES[f];
              cam.position.set(s.x, s.y, s.z); cam.up.set(ux, uy, uz); cam.lookAt(s.x + dx, s.y + dy, s.z + dz);
              cam.updateMatrixWorld(true);
              rt.viewport.set(((s.row % TORCH_ROW) * 6 + f) * T, Math.floor(s.row / TORCH_ROW) * T, T, T);
              rt.scissor.copy(rt.viewport);
              r.setRenderTarget(rt); // (applies the new viewport)
              r.setClearColor(0xffffff, 1);
              r.clear();
              r.render(scene, cam);
            }
            s.ready = true;
          }
        } finally {
          rt.scissorTest = false;
          rt.viewport.set(0, 0, rt.width, rt.height); rt.scissor.copy(rt.viewport);
          r.setClearColor(cc, ca);
        }
      });
    }
    // hand the ready lights to the shaders, nearest first: the world shader shades with the nearest few (torch
    // shadows), the light shafts shine from the nearest few (shafts)
    const cp = camera.position;
    const ready = this.slots.filter((s) => s.ready).sort((a, b) => ((a.x - cp.x) ** 2 + (a.y - cp.y) ** 2 + (a.z - cp.z) ** 2) - ((b.x - cp.x) ** 2 + (b.y - cp.y) ** 2 + (b.z - cp.z) ** 2));
    let c = 0;
    for (const s of ready) {
      if (c >= MAX_TORCH_SHADOWS) break;
      U.uTorchL.value[c].set(s.x, s.y, s.z, s.row * 32 + s.r);
      const col = s.c ?? [1, 0.86, 0.66];
      this.shaftC[c].set(col[0], col[1], col[2]);
      c++;
    }
    U.uTorchCount.value = Math.min(c, this.opts.torches);
    this.shaftCount = Math.min(c, this.opts.shafts);
  }

  freeTorches() {
    this.slots = [];
    gfxUniforms.uTorchCount.value = 0;
    if (!this.torchRT) return;
    this.torchRT.dispose();
    this.torchRT = null;
    gfxUniforms.uTorchMap.value = null;
  }

  // ---------- reflections ----------

  renderReflection(scene, camera) {
    const r = this.renderer, U = gfxUniforms, h = this.waterY;
    r.getDrawingBufferSize(this.size);
    const w = Math.max(1, this.size.x >> 1), ht = Math.max(1, this.size.y >> 1);
    if (!this.reflRT || this.reflRT.width !== w || this.reflRT.height !== ht) {
      this.freeReflections();
      const half = r.extensions.has('EXT_color_buffer_half_float') || r.extensions.has('EXT_color_buffer_float');
      this.reflRT = new THREE.WebGLRenderTarget(w, ht, { type: half ? THREE.HalfFloatType : THREE.UnsignedByteType, generateMipmaps: false });
    }
    // the camera's mirror image below the water, looking up at the mirrored view
    const mc = this.mirrorCam;
    mc.fov = camera.fov; mc.aspect = camera.aspect; mc.near = camera.near; mc.far = camera.far;
    mc.updateProjectionMatrix();
    const pos = camera.getWorldPosition(new THREE.Vector3());
    const fwd = camera.getWorldDirection(new THREE.Vector3());
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.getWorldQuaternion(new THREE.Quaternion()));
    const target = pos.clone().add(fwd);
    pos.y = 2 * h - pos.y; target.y = 2 * h - target.y; up.y = -up.y;
    mc.position.copy(pos); mc.up.copy(up); mc.lookAt(target);
    mc.updateMatrixWorld(true);
    U.uReflMat.value.copy(this.bias).multiply(mc.projectionMatrix).multiply(mc.matrixWorldInverse);
    // draw only what is above the water (not the water itself, nor what is under it)
    this.clipPlane.constant = -(h - 0.05);
    const was = r.getRenderTarget(), planes = r.clippingPlanes;
    r.clippingPlanes = [this.clipPlane];
    try {
      r.setRenderTarget(this.reflRT);
      r.render(scene, mc);
    } finally {
      r.clippingPlanes = planes;
      r.setRenderTarget(was);
    }
    U.uReflTex.value = this.reflRT.texture;
    U.uReflH.value = h;
    U.uReflect.value = 1;
  }

  freeReflections() {
    gfxUniforms.uReflect.value = 0;
    gfxUniforms.uReflTex.value = null;
    this.reflRT?.dispose();
    this.reflRT = null;
  }

  freeShadows() {
    this.glassRT?.dispose(); this.glassRT = null;
    gfxUniforms.uGlassMap.value = null; gfxUniforms.uGlassOn.value = 0;
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
    this.rtMain.depthTexture = new THREE.DepthTexture(w, h); // (god rays look for open sky in it)
    this.rtRefr = mk(w, h, false);
    this.god = mk(w >> 1, h >> 1, false);
    this.bounce = [mk(w >> 1, h >> 1, false), mk(w >> 1, h >> 1, false)];
    this.shaft = [mk(w >> 1, h >> 1, false), mk(w >> 1, h >> 1, false)];
    this.b1 = [mk(w >> 1, h >> 1, false), mk(w >> 1, h >> 1, false)];
    this.b2 = [mk(w >> 2, h >> 2, false), mk(w >> 2, h >> 2, false)];
    gfxUniforms.uResolution.value.set(w, h);
    gfxUniforms.uRefrTex.value = this.rtRefr.texture;
  }

  freeTargets() {
    this.rtMain?.depthTexture?.dispose();
    for (const t of [this.rtMain, this.rtRefr, this.god, ...(this.b1 ?? []), ...(this.b2 ?? []), ...(this.bounce ?? []), ...(this.shaft ?? [])]) t?.dispose();
    this.rtMain = this.rtRefr = this.god = this.b1 = this.b2 = this.bounce = this.shaft = null;
    gfxUniforms.uRefrTex.value = null;
  }

  blit(mat, target) {
    this.quad.material = mat;
    this.renderer.setRenderTarget(target);
    this.renderer.render(this.quadScene, this.quadCam);
  }

  renderPost(scene, camera, godrays = 0) {
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
    if (godrays > 0) {
      const sp = this.sunDir.clone().multiplyScalar(100).add(camera.getWorldPosition(new THREE.Vector3())).project(camera);
      this.godMat.uniforms.tDepth.value = this.rtMain.depthTexture;
      this.godMat.uniforms.uSun.value.set(sp.x * 0.5 + 0.5, sp.y * 0.5 + 0.5);
      this.godMat.uniforms.uAspect.value = this.rtMain.width / this.rtMain.height;
      this.blit(this.godMat, this.god);
    }
    let bounce = 0;
    if (o.bounce) {
      const bm = this.bounceMat.uniforms, [p1, p2] = this.bounce;
      bm.tSrc.value = this.rtMain.texture; bm.tDepth.value = this.rtMain.depthTexture;
      bm.uNear.value = camera.near; bm.uFar.value = camera.far;
      bm.uProj.value = 1 / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2));
      bm.uAspect.value = this.rtMain.width / this.rtMain.height;
      this.blit(this.bounceMat, p1);
      this.blurMat.uniforms.tSrc.value = p1.texture; this.blurMat.uniforms.uDir.value.set(1 / p1.width, 0); this.blit(this.blurMat, p2);
      this.blurMat.uniforms.tSrc.value = p2.texture; this.blurMat.uniforms.uDir.value.set(0, 1 / p1.height); this.blit(this.blurMat, p1);
      bounce = 1;
    }
    let shaft = 0;
    if (this.shaftCount > 0) {
      const sm = this.shaftMat.uniforms, [s1, s2] = this.shaft;
      sm.tDepth.value = this.rtMain.depthTexture;
      sm.uInvProj.value.copy(camera.projectionMatrixInverse);
      sm.uCamWorld.value.copy(camera.matrixWorld);
      sm.uCamPos.value.setFromMatrixPosition(camera.matrixWorld);
      sm.uShaftCount.value = this.shaftCount;
      this.blit(this.shaftMat, s1);
      this.blurMat.uniforms.tSrc.value = s1.texture; this.blurMat.uniforms.uDir.value.set(1 / s1.width, 0); this.blit(this.blurMat, s2);
      this.blurMat.uniforms.tSrc.value = s2.texture; this.blurMat.uniforms.uDir.value.set(0, 1 / s1.height); this.blit(this.blurMat, s1);
      shaft = 1 - 0.75 * this.sunNow; // (they show best in the dark)
    }
    const f = this.finalMat.uniforms;
    f.tShaft.value = this.shaft[0].texture;
    f.uShaft.value = shaft;
    f.tBounce.value = this.bounce[0].texture;
    f.uBounce.value = bounce;
    f.tSrc.value = this.rtMain.texture;
    f.tB1.value = this.b1[0].texture;
    f.tB2.value = this.b2[0].texture;
    f.uBloom.value = bloom;
    f.tGod.value = this.god.texture;
    f.uGod.value = godrays;
    f.uRipple.value = o.ripple && this.underwater ? 1 : 0;
    this.blit(this.finalMat, null);
  }
}
