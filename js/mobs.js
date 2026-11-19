// Animals (ducks, buffalo, alpacas, yaks, newts) that wander the world, and the night creatures
// (gloomlings, mossbacks, thornspitters) that come out in the dark and, depending on difficulty, hunt you.
//
// Each animal is a small hierarchy of shaded boxes (legs and heads on pivots so they can move),
// with simple behaviour: stand, wander, graze, and run away when bumped. They follow the same
// physics as the player (gravity, block collisions, stepping up one block) and float in water.
// They aren't saved: they're spawned fresh around wherever you are.
import * as THREE from 'three';
import { AIR, WATER, LEAVES, LOG, GRASS, SAND, DIRT, WOOL, BUCKET, MILK_BUCKET, SLIME_BUCKET, FEATHER, COAL, COBBLE, ARROW, HIDE, SNOW_GRASS, SNOW, KING_CROWN, GOLD_INGOT, MOSSY_BRICKS, RAW_FISH, BAKED_FISH, WHEAT, SALMON, BAKED_SALMON, ICEFISH, BAKED_ICEFISH,
  SUN_SCARAB, FROST_HEART, EMBER_CORE, SUN_MASK, FROST_CIRCLET, EMBER_CROWN, SILVER_INGOT, OBSIDIAN, STRING, BLOCKS, LAVA, SEEDS, BERRIES } from './blocks.js';
import { SEA_LEVEL, H } from './terrain.js';
import { skyBrightness, lightBrightness } from './world.js';
import { THORN_SPEED, THORN_GRAVITY } from './arrows.js';

const GRAVITY = 28;
const MAX_MOBS = 26;
const SPAWN_MIN_DIST = 24;
const SHORN_SECONDS = 150; // how long an alpaca's coat takes to grow back
const FEATHER_SECONDS = 30; // a plucked duck has no feather to spare for a while
const SLIME_SECONDS = 30; // nor a newt more slime
const HIDE_SECONDS = 120; // a buffalo sheds a loose patch of its shaggy hide now and then

// face brightness for box faces (+x, -x, +y, -y, +z, -z), matching the world's block shading
const SHADE = [0.8, 0.8, 1.0, 0.5, 0.65, 0.65].map((v) => Math.pow(v, 2.2));
const rand = (a, b) => a + Math.random() * (b - a);
const pick = (list) => list[Math.floor(Math.random() * list.length)];

// Builds a model from coloured boxes. All boxes of one animal share its material, whose colour
// is set every frame from the light where the animal stands.
class Builder {
  constructor(material, glowMaterial) {
    this.material = material;
    this.glowMaterial = glowMaterial; // for eyes that shine in the dark: never darkened by lighting
    this.geometries = [];
  }

  box(parent, [w, h, d], color, [x, y, z] = [0, 0, 0], glow = false) {
    const g = new THREE.BoxGeometry(w, h, d);
    const c = new THREE.Color(color);
    const col = new Float32Array(24 * 3);
    for (let i = 0; i < 24; i++) {
      const s = SHADE[i >> 2];
      col[i * 3] = c.r * s; col[i * 3 + 1] = c.g * s; col[i * 3 + 2] = c.b * s;
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const m = new THREE.Mesh(g, glow ? this.glowMaterial : this.material);
    m.position.set(x, y, z);
    parent.add(m);
    this.geometries.push(g);
    return m;
  }

  pivot(parent, [x, y, z]) {
    const p = new THREE.Group();
    p.position.set(x, y, z);
    parent.add(p);
    return p;
  }
}

const shade = (c) => { const k = 0.85; return (((c >> 16) & 255) * k) << 16 | (((c >> 8) & 255) * k) << 8 | ((c & 255) * k); };
const VILLAGER_LOOKS = {
  farmer: { robe: 0x7a6a3a, apron: 0x9a7a4a, legs: 0x4a3a2a, hat: 'straw' },
  smith: { robe: 0x5a5a62, apron: 0x2a2a2e, legs: 0x3a3a40, hat: 'cap' },
  fisher: { robe: 0x3a6a8a, apron: 0xc8b88a, legs: 0x2a3a4a, hat: 'cap' },
  cleric: { robe: 0x7a3a8a, apron: 0xd8c050, legs: 0x5a2a6a, hat: 'hood' },
};

// A hulking golem with a sunken head, huge fists and glowing eyes (mossbacks, and the Ember Lord).
function golem(b, root, { stone, dark, moss, eye }) {
  const parts = { legs: [], arms: [] };
  const torso = parts.torso = b.pivot(root, [0, 1.0, 0]);
  b.box(torso, [1.15, 0.95, 0.8], stone, [0, 0.45, 0]);
  b.box(torso, [1.2, 0.22, 0.85], moss, [0, 0.98, -0.02]); // mossy shoulders
  b.box(torso, [0.5, 0.2, 0.06], moss, [0.25, 0.62, 0.41]);
  const head = parts.head = b.pivot(torso, [0, 0.95, 0.28]);
  b.box(head, [0.48, 0.4, 0.42], dark, [0, 0.1, 0.1]);
  b.box(head, [0.52, 0.1, 0.12], moss, [0, 0.3, 0.27]); // mossy brow
  for (const s of [-1, 1]) {
    b.box(head, [0.1, 0.06, 0.03], eye, [s * 0.12, 0.17, 0.32], true);
    const arm = b.pivot(torso, [s * 0.74, 0.85, 0]);
    b.box(arm, [0.36, 1.1, 0.4], stone, [0, -0.5, 0.05]);
    b.box(arm, [0.38, 0.12, 0.42], moss, [0, 0.02, 0.05]);
    b.box(arm, [0.44, 0.34, 0.46], dark, [0, -1.1, 0.08]); // fist
    parts.arms.push(arm);
    const leg = b.pivot(root, [s * 0.3, 1.0, 0]);
    b.box(leg, [0.42, 1.0, 0.46], dark, [0, -0.5, 0]);
    parts.legs.push(leg);
  }
  return parts;
}

// ---------- species ----------
// Models face +z with their feet at y = 0. Sizes are in blocks.
// w/h: collision box; sink: how deep they float in water; stride: leg swing speed.

const SPECIES = {
  duck: {
    w: 0.5, h: 0.65, speed: 1.2, fleeSpeed: 3.2, sink: 0.18, stride: 9, legSwing: 0.7,
    group: [2, 4], cap: 8, avoidWater: false, grazes: false,
    build(b, root) {
      const drake = Math.random() < 0.5;
      const body = drake ? 0x9c958a : 0x8c6b47;
      const parts = { legs: [] };
      const torso = parts.torso = b.pivot(root, [0, 0, 0]);
      b.box(torso, [0.42, 0.3, 0.6], body, [0, 0.3, 0]);
      b.box(torso, [0.4, 0.24, 0.18], drake ? 0x6e3b22 : body, [0, 0.3, 0.26]); // chest
      b.box(torso, [0.28, 0.12, 0.16], drake ? 0x2b2b2b : 0x6e5236, [0, 0.4, -0.34]); // tail
      for (const s of [-1, 1]) {
        b.box(torso, [0.06, 0.2, 0.44], drake ? 0x7c7368 : 0x7a5b3b, [s * 0.22, 0.33, -0.04]); // wing
        b.box(torso, [0.065, 0.06, 0.12], 0x2b55c8, [s * 0.225, 0.3, -0.06]); // blue wing patch
      }
      const head = parts.head = b.pivot(torso, [0, 0.42, 0.24]);
      if (drake) b.box(head, [0.2, 0.05, 0.2], 0xffffff, [0, 0, 0]); // white collar
      b.box(head, [0.22, 0.24, 0.26], drake ? 0x1d6b3c : 0x7f6040, [0, 0.13, 0.02]);
      b.box(head, [0.14, 0.06, 0.16], drake ? 0xe3b52a : 0xc98a2e, [0, 0.08, 0.21]); // bill
      for (const s of [-1, 1]) b.box(head, [0.03, 0.04, 0.04], 0x111111, [s * 0.112, 0.17, 0.08]);
      for (const s of [-1, 1]) {
        const leg = b.pivot(root, [s * 0.1, 0.15, 0.02]);
        b.box(leg, [0.05, 0.14, 0.05], 0xee8a1c, [0, -0.07, 0]);
        b.box(leg, [0.12, 0.02, 0.14], 0xee8a1c, [0, -0.14, 0.04]); // webbed foot
        parts.legs.push(leg);
      }
      return parts;
    },
  },

  buffalo: {
    w: 1.25, h: 1.85, speed: 1.1, fleeSpeed: 4.5, sink: 1.15, stride: 5, legSwing: 0.45,
    group: [2, 4], cap: 6, avoidWater: true, grazes: true,
    build(b, root) {
      const fur = 0x4b3323, mane = 0x3a2617, dark = 0x24170e, horn = 0xd8cdb5;
      const parts = { legs: [] };
      b.box(root, [1.0, 0.85, 1.1], fur, [0, 1.05, -0.4]); // hindquarters
      b.box(root, [1.2, 1.1, 0.95], mane, [0, 1.15, 0.42]); // shaggy shoulders
      b.box(root, [0.9, 0.3, 0.7], mane, [0, 1.82, 0.32]); // hump
      const head = parts.head = b.pivot(root, [0, 1.2, 0.9]);
      b.box(head, [0.66, 0.66, 0.55], dark, [0, -0.18, 0.22]);
      b.box(head, [0.62, 0.2, 0.5], mane, [0, 0.2, 0.18]); // shaggy crown
      b.box(head, [0.46, 0.28, 0.14], 0x1a110a, [0, -0.32, 0.54]); // muzzle
      b.box(head, [0.36, 0.35, 0.3], dark, [0, -0.62, 0.2]); // beard
      for (const s of [-1, 1]) {
        b.box(head, [0.28, 0.12, 0.12], horn, [s * 0.44, 0.04, 0.2]);
        b.box(head, [0.1, 0.2, 0.1], horn, [s * 0.55, 0.18, 0.2]); // upturned horn tip
        b.box(head, [0.04, 0.06, 0.04], 0x0a0a0a, [s * 0.33, -0.08, 0.42]);
      }
      for (const [x, z] of [[-0.33, 0.55], [0.33, 0.55], [-0.33, -0.7], [0.33, -0.7]]) {
        const leg = b.pivot(root, [x, 0.65, z]);
        b.box(leg, [0.28, 0.6, 0.28], 0x2f1e12, [0, -0.3, 0]);
        b.box(leg, [0.3, 0.08, 0.3], 0x151515, [0, -0.6, 0]); // hoof
        parts.legs.push(leg);
      }
      const tail = parts.tail = b.pivot(root, [0, 1.35, -0.95]);
      b.box(tail, [0.1, 0.45, 0.1], dark, [0, -0.22, 0]);
      b.box(tail, [0.16, 0.14, 0.16], mane, [0, -0.48, 0]);
      return parts;
    },
  },

  alpaca: {
    w: 0.8, h: 2.15, speed: 1.3, fleeSpeed: 4.2, sink: 1.35, stride: 6.5, legSwing: 0.5,
    group: [2, 3], cap: 6, avoidWater: true, grazes: true, wool: true,
    build(b, root) {
      const coat = pick([0xf1ece1, 0xf1ece1, 0xdcc09a, 0x8e5d3d, 0xa29c94, 0x3d3530]);
      const legColor = new THREE.Color(coat).multiplyScalar(0.85).getHex();
      const parts = { legs: [], fleece: [], tufts: [] };
      parts.fleece.push(b.box(root, [0.72, 0.66, 1.05], coat, [0, 1.0, 0])); // body
      parts.fleece.push(b.box(root, [0.3, 0.8, 0.3], coat, [0, 1.55, 0.42])); // neck
      const head = parts.head = b.pivot(root, [0, 1.92, 0.46]);
      b.box(head, [0.32, 0.3, 0.4], coat, [0, 0.04, 0.08]);
      parts.tufts.push(b.box(head, [0.36, 0.16, 0.3], coat, [0, 0.22, 0.02])); // fluffy topknot
      b.box(head, [0.2, 0.16, 0.16], 0x5e4c3e, [0, -0.04, 0.32]); // muzzle
      for (const s of [-1, 1]) {
        b.box(head, [0.07, 0.2, 0.06], coat, [s * 0.12, 0.33, -0.04]); // ears
        b.box(head, [0.04, 0.05, 0.04], 0x0a0a0a, [s * 0.163, 0.08, 0.18]);
      }
      for (const [x, z] of [[-0.2, 0.36], [0.2, 0.36], [-0.2, -0.36], [0.2, -0.36]]) {
        const leg = b.pivot(root, [x, 0.72, z]);
        parts.tufts.push(b.box(leg, [0.22, 0.26, 0.22], coat, [0, -0.08, 0])); // woolly thigh
        b.box(leg, [0.14, 0.66, 0.14], legColor, [0, -0.36, 0]);
        b.box(leg, [0.16, 0.06, 0.2], 0x352a22, [0, -0.69, 0.02]);
        parts.legs.push(leg);
      }
      const tail = parts.tail = b.pivot(root, [0, 1.12, -0.55]);
      b.box(tail, [0.18, 0.24, 0.14], coat, [0, -0.1, -0.02]);
      // a sheared alpaca is visibly slimmer until its coat grows back
      parts.shear = (shorn) => {
        parts.fleece[0].scale.set(shorn ? 0.78 : 1, shorn ? 0.82 : 1, shorn ? 0.9 : 1);
        parts.fleece[1].scale.set(shorn ? 0.72 : 1, 1, shorn ? 0.72 : 1);
        for (const t of parts.tufts) t.visible = !shorn;
      };
      return parts;
    },
  },

  yak: {
    w: 1.1, h: 1.75, speed: 1.0, fleeSpeed: 4.0, sink: 1.05, stride: 5.5, legSwing: 0.4,
    group: [2, 3], cap: 5, avoidWater: true, grazes: true, milk: true,
    build(b, root) {
      const coat = pick([0x2e2722, 0x2e2722, 0x4a3628, 0xe6e0d4]);
      const shag = new THREE.Color(coat).multiplyScalar(0.78).getHex();
      const white = coat === 0xe6e0d4;
      const horn = 0xe9e2cf;
      const parts = { legs: [] };
      b.box(root, [1.0, 0.8, 1.5], coat, [0, 1.05, 0]); // body
      b.box(root, [1.12, 0.42, 1.58], shag, [0, 0.62, 0]); // long hair hanging down like a skirt
      b.box(root, [0.9, 0.35, 0.6], coat, [0, 1.58, 0.35]); // shoulder hump
      const head = parts.head = b.pivot(root, [0, 1.15, 0.8]);
      b.box(head, [0.55, 0.5, 0.55], coat, [0, -0.1, 0.25]);
      b.box(head, [0.5, 0.18, 0.3], shag, [0, 0.2, 0.2]); // shaggy forelock
      b.box(head, [0.4, 0.25, 0.15], white ? 0x8a7a6a : 0x1f1a17, [0, -0.22, 0.56]); // muzzle
      for (const s of [-1, 1]) {
        // horns sweep out, up, then back
        b.box(head, [0.3, 0.1, 0.1], horn, [s * 0.38, 0.12, 0.25]);
        b.box(head, [0.1, 0.25, 0.1], horn, [s * 0.52, 0.28, 0.25]);
        b.box(head, [0.1, 0.1, 0.16], horn, [s * 0.52, 0.42, 0.17]);
        b.box(head, [0.04, 0.05, 0.04], 0x0a0a0a, [s * 0.28, -0.02, 0.48]);
      }
      for (const [x, z] of [[-0.32, 0.5], [0.32, 0.5], [-0.32, -0.5], [0.32, -0.5]]) {
        const leg = b.pivot(root, [x, 0.65, z]);
        b.box(leg, [0.24, 0.6, 0.24], shag, [0, -0.3, 0]);
        b.box(leg, [0.26, 0.07, 0.26], 0x161210, [0, -0.6, 0]);
        parts.legs.push(leg);
      }
      const tail = parts.tail = b.pivot(root, [0, 1.3, -0.76]);
      b.box(tail, [0.22, 0.5, 0.18], shag, [0, -0.25, -0.04]); // bushy tail
      return parts;
    },
  },

  // ---------- night creatures ----------
  // hostile: hp, damage (before the difficulty multiplier), reach and attackEvery for melee,
  // or ranged { min, max, every } for keeping a distance and spitting; weight: how often it spawns.

  gloomling: {
    w: 0.6, h: 1.1, speed: 1.2, chaseSpeed: 3.4, fleeSpeed: 3.4, sink: 0.7, stride: 12, legSwing: 0.8,
    avoidWater: true, hostile: true, hp: 10, damage: 3, reach: 1.4, attackEvery: 0.8, weight: 50,
    cause: 'A gloomling got you.',
    drops: () => (Math.random() < 0.5 ? [[COAL, 1]] : []),
    build(b, root) {
      // a small hunched shadow imp with long arms, pointed ears and glowing green eyes
      const skin = 0x2b2342, dark = 0x1a1528, eye = 0xb8ff6a;
      const parts = { legs: [], arms: [] };
      const torso = parts.torso = b.pivot(root, [0, 0.45, 0]);
      b.box(torso, [0.42, 0.42, 0.3], skin, [0, 0.12, -0.02]);
      const head = parts.head = b.pivot(torso, [0, 0.36, 0.08]);
      b.box(head, [0.46, 0.38, 0.4], skin, [0, 0.12, 0.06]);
      b.box(head, [0.22, 0.03, 0.02], 0x0b0910, [0, 0.01, 0.265]); // mouth
      for (const s of [-1, 1]) {
        b.box(head, [0.08, 0.26, 0.06], dark, [s * 0.2, 0.36, 0]); // pointed ears
        b.box(head, [0.1, 0.07, 0.03], eye, [s * 0.11, 0.15, 0.27], true);
        const arm = b.pivot(torso, [s * 0.26, 0.28, 0.02]);
        b.box(arm, [0.09, 0.5, 0.09], skin, [0, -0.25, 0.04]);
        b.box(arm, [0.12, 0.06, 0.12], dark, [0, -0.52, 0.06]); // claws
        parts.arms.push(arm);
        const leg = b.pivot(root, [s * 0.11, 0.42, 0]);
        b.box(leg, [0.12, 0.42, 0.12], dark, [0, -0.21, 0]);
        parts.legs.push(leg);
      }
      return parts;
    },
  },

  mossback: {
    w: 1.25, h: 2.2, speed: 0.8, chaseSpeed: 1.9, fleeSpeed: 1.9, sink: 1.4, stride: 4, legSwing: 0.45,
    avoidWater: true, hostile: true, hp: 30, damage: 7, reach: 1.9, attackEvery: 1.6, weight: 25, heavy: true,
    cause: 'A mossback flattened you.',
    drops: () => [[COBBLE, Math.random() < 0.5 ? 3 : 2]],
    build(b, root) { return golem(b, root, { stone: 0x6f6f69, dark: 0x55554f, moss: 0x4c7a2e, eye: 0xffb02e }); },
  },

  thornspitter: {
    w: 0.8, h: 1.4, speed: 0.9, chaseSpeed: 2.0, fleeSpeed: 2.0, sink: 0.9, stride: 10, legSwing: 0.6,
    avoidWater: true, hostile: true, hp: 12, damage: 4, ranged: { min: 5, max: 11, every: 2.4 }, weight: 25,
    cause: 'A thornspitter shot you full of thorns.',
    drops: () => [[ARROW, Math.random() < 0.5 ? 2 : 1]], // its thorns make good arrows
    build(b, root) {
      // a scuttling plant on four roots, with a bulbous pod head, a spitting mouth and red eyes
      const stem = 0x3b6a2a, pod = 0x6e9a32, dark = 0x24401a, eye = 0xff4a3a, thorn = 0xd9d2a8;
      const parts = { legs: [] };
      for (const [x, z] of [[-0.28, 0.28], [0.28, 0.28], [-0.28, -0.28], [0.28, -0.28]]) {
        const leg = b.pivot(root, [x, 0.4, z]);
        b.box(leg, [0.12, 0.42, 0.12], dark, [0, -0.2, 0]);
        parts.legs.push(leg);
      }
      b.box(root, [0.32, 0.55, 0.32], stem, [0, 0.62, 0]);
      for (const s of [-1, 1]) b.box(root, [0.42, 0.04, 0.18], stem, [s * 0.3, 0.6, 0]); // leaves
      const head = parts.head = b.pivot(root, [0, 0.9, 0]);
      b.box(head, [0.62, 0.5, 0.62], pod, [0, 0.2, 0]);
      b.box(head, [0.3, 0.22, 0.06], dark, [0, 0.16, 0.31]); // mouth
      for (const s of [-1, 1]) {
        b.box(head, [0.1, 0.07, 0.03], eye, [s * 0.18, 0.37, 0.31], true);
        b.box(head, [0.18, 0.06, 0.06], thorn, [s * 0.38, 0.22, 0]);
        b.box(head, [0.06, 0.06, 0.18], thorn, [0, 0.22 + s * 0.12, -0.38]);
      }
      b.box(head, [0.06, 0.18, 0.06], thorn, [0.1, 0.52, 0.05]);
      b.box(head, [0.06, 0.16, 0.06], thorn, [-0.12, 0.5, -0.08]);
      return parts;
    },
  },

  // the guardian of a dungeon shrine: a towering mossback wearing a crown of gold
  mossking: {
    w: 1.8, h: 3.2, speed: 0.7, chaseSpeed: 2.3, fleeSpeed: 2.3, sink: 2, stride: 3.2, legSwing: 0.45,
    avoidWater: true, hostile: true, boss: true, noBurn: true, hp: 140, damage: 9, reach: 2.7, attackEvery: 1.7, weight: 0, heavy: true,
    name: 'The Mossback King', cause: 'The Mossback King crushed you.',
    drops: () => [[KING_CROWN, 1], [GOLD_INGOT, 3 + Math.floor(Math.random() * 3)], [MOSSY_BRICKS, 4]],
    build(b, root) {
      const parts = SPECIES.mossback.build(b, root);
      root.scale.setScalar(1.45);
      const crown = b.pivot(parts.head, [0, 0.36, 0.1]);
      b.box(crown, [0.56, 0.12, 0.5], 0xf0c838, [0, 0, 0]);
      for (const [x, z] of [[-0.22, 0.2], [0, 0.2], [0.22, 0.2], [-0.22, -0.2], [0.22, -0.2]]) b.box(crown, [0.1, 0.16, 0.08], 0xf8d850, [x, 0.13, z]);
      b.box(crown, [0.08, 0.08, 0.04], 0xd02828, [0, 0.03, 0.26], true);
      return parts;
    },
  },

  // cave spiders: quick, low and nasty; their bite poisons you. They only live underground.
  spider: {
    w: 0.9, h: 0.5, speed: 1.4, chaseSpeed: 4.2, fleeSpeed: 4.2, sink: 0.4, stride: 16, legSwing: 0.5,
    avoidWater: true, hostile: true, caveOnly: true, hp: 8, damage: 2, reach: 1.3, attackEvery: 1, weight: 30, poisons: 6,
    cause: 'A cave spider\'s bite was too much for you.',
    drops: () => (Math.random() < 0.5 ? [[STRING, 1]] : []),
    build(b, root) {
      const body = 0x2a2420, dark = 0x16120e, eye = 0xff3030;
      const parts = { legs: [] };
      b.box(root, [0.5, 0.3, 0.55], body, [0, 0.3, -0.2]); // abdomen
      const head = parts.head = b.pivot(root, [0, 0.28, 0.15]);
      b.box(head, [0.34, 0.24, 0.3], dark, [0, 0, 0.1]);
      for (const sx of [-1, 1]) for (const k of [0, 1]) b.box(head, [0.05, 0.05, 0.02], eye, [sx * (0.05 + k * 0.08), 0.06 - k * 0.04, 0.26], true);
      for (const z of [0.2, 0.08, -0.04, -0.16]) for (const sx of [-1, 1]) {
        const leg = b.pivot(root, [sx * 0.18, 0.3, z]);
        b.box(leg, [0.5, 0.05, 0.05], dark, [sx * 0.25, -0.05, 0]);
        b.box(leg, [0.05, 0.3, 0.05], dark, [sx * 0.48, -0.18, 0]);
        parts.legs.push(leg);
      }
      return parts;
    },
  },

  // the guardian of a desert tomb: a towering wrapped figure in a striped headdress that hurls sand
  dunewarden: {
    w: 1.0, h: 2.8, speed: 0.8, chaseSpeed: 2.2, fleeSpeed: 2.2, sink: 2, stride: 4, legSwing: 0.4,
    avoidWater: true, hostile: true, boss: true, noBurn: true, hp: 120, damage: 5, ranged: { min: 3, max: 14, every: 1.3 }, weight: 0,
    name: 'The Dune Warden', cause: 'The Dune Warden buried you in sand.', shot: 'sand',
    drops: () => [[SUN_SCARAB, 1], [SUN_MASK, 1], [GOLD_INGOT, 3 + Math.floor(Math.random() * 3)]],
    build(b, root) {
      const wrap = 0xd8caa0, dark = 0xa89870, blue = 0x2a4aa0, gold = 0xe8b830;
      const parts = { legs: [], arms: [] };
      const torso = parts.torso = b.pivot(root, [0, 1.3, 0]);
      b.box(torso, [0.8, 1.1, 0.5], wrap, [0, 0.55, 0]);
      for (let k = 0; k < 4; k++) b.box(torso, [0.82, 0.05, 0.52], dark, [0, 0.15 + k * 0.28, 0]);
      b.box(torso, [0.86, 0.2, 0.54], gold, [0, 1.0, 0]); // collar
      const head = parts.head = b.pivot(torso, [0, 1.15, 0]);
      b.box(head, [0.5, 0.55, 0.5], wrap, [0, 0.27, 0]);
      for (const sx of [-1, 1]) {
        b.box(head, [0.1, 0.06, 0.03], 0xffd040, [sx * 0.12, 0.32, 0.26], true);
        b.box(head, [0.14, 0.7, 0.5], blue, [sx * 0.32, 0.12, -0.02]); // headdress lappets
        for (let k = 0; k < 4; k++) b.box(head, [0.15, 0.06, 0.51], gold, [sx * 0.32, -0.15 + k * 0.17, -0.02]);
      }
      b.box(head, [0.56, 0.12, 0.56], gold, [0, 0.58, 0]);
      for (const sx of [-1, 1]) {
        const arm = b.pivot(torso, [sx * 0.52, 0.95, 0]);
        b.box(arm, [0.24, 1.0, 0.24], wrap, [0, -0.5, 0]);
        parts.arms.push(arm);
        const leg = b.pivot(root, [sx * 0.2, 1.3, 0]);
        b.box(leg, [0.3, 1.3, 0.32], wrap, [0, -0.65, 0]);
        parts.legs.push(leg);
      }
      return parts;
    },
  },

  // the guardian of an ice crypt: a pale, hooded wraith that flings shards of ice that chill you to the bone
  frostwraith: {
    w: 1.0, h: 2.6, speed: 0.9, chaseSpeed: 2.4, fleeSpeed: 2.4, sink: 2, stride: 3, legSwing: 0.2,
    avoidWater: true, hostile: true, boss: true, noBurn: true, hp: 110, damage: 4, ranged: { min: 5, max: 15, every: 1.5 }, weight: 0,
    name: 'The Frost Wraith', cause: 'The Frost Wraith froze you solid.', shot: 'frost',
    drops: () => [[FROST_HEART, 1], [FROST_CIRCLET, 1], [SILVER_INGOT, 3 + Math.floor(Math.random() * 3)]],
    build(b, root) {
      const robe = 0xb8d8ec, dark = 0x6a8aa8, glow = 0x9ff0ff;
      const parts = { legs: [], arms: [] };
      const torso = parts.torso = b.pivot(root, [0, 0.9, 0]);
      b.box(torso, [1.0, 0.9, 0.7], robe, [0, -0.4, 0]); // the robe's wide hem
      b.box(torso, [0.8, 1.0, 0.55], robe, [0, 0.5, 0]);
      for (const x of [-0.35, -0.1, 0.15, 0.38]) b.box(torso, [0.14, 0.3, 0.14], dark, [x, -0.9, 0.2]); // ragged hem
      const head = parts.head = b.pivot(torso, [0, 1.05, 0]);
      b.box(head, [0.62, 0.62, 0.62], robe, [0, 0.3, -0.04]); // hood
      b.box(head, [0.46, 0.42, 0.04], 0x101828, [0, 0.26, 0.28]); // the dark inside of the hood
      for (const sx of [-1, 1]) b.box(head, [0.08, 0.08, 0.03], glow, [sx * 0.11, 0.3, 0.3], true);
      for (const sx of [-1, 1]) {
        const arm = b.pivot(torso, [sx * 0.52, 0.9, 0]);
        b.box(arm, [0.22, 0.95, 0.22], robe, [0, -0.45, 0]);
        b.box(arm, [0.16, 0.2, 0.16], glow, [0, -0.98, 0], true);
        parts.arms.push(arm);
        const leg = b.pivot(root, [sx * 0.2, 0.4, 0]);
        b.box(leg, [0.2, 0.4, 0.2], dark, [0, -0.2, 0]);
        parts.legs.push(leg);
      }
      return parts;
    },
  },

  // the guardian of a deep fortress: a great golem of black rock with lava in its cracks. Standing close
  // to it burns.
  emberlord: {
    w: 1.8, h: 3.2, speed: 0.75, chaseSpeed: 2.4, fleeSpeed: 2.4, sink: 2, stride: 3.2, legSwing: 0.45,
    avoidWater: true, hostile: true, boss: true, noBurn: true, hp: 170, damage: 10, reach: 2.8, attackEvery: 1.6, weight: 0, heavy: true, burns: true,
    name: 'The Ember Lord', cause: 'The Ember Lord burned you to cinders.',
    drops: () => [[EMBER_CORE, 1], [EMBER_CROWN, 1], [OBSIDIAN, 4], [GOLD_INGOT, 2]],
    build(b, root) {
      const parts = golem(b, root, { stone: 0x3a2e2e, dark: 0x241c1c, moss: 0xff6a1a, eye: 0xffe060 });
      root.scale.setScalar(1.45);
      const crown = b.pivot(parts.head, [0, 0.36, 0.1]);
      b.box(crown, [0.56, 0.12, 0.5], 0x2a2020, [0, 0, 0]);
      for (const [x, z] of [[-0.22, 0.2], [0, 0.2], [0.22, 0.2], [-0.22, -0.2], [0.22, -0.2]]) b.box(crown, [0.1, 0.2, 0.08], 0xff7a20, [x, 0.15, z], true);
      return parts;
    },
  },

  // tundra wolves: tame one with fish and it follows you and fights night creatures
  wolf: {
    w: 0.6, h: 0.85, speed: 1.4, chaseSpeed: 5.2, followSpeed: 5, fleeSpeed: 4.5, sink: 0.6, stride: 11, legSwing: 0.6,
    group: [1, 3], cap: 4, avoidWater: true, grazes: false, fights: true, tames: [RAW_FISH, BAKED_FISH, SALMON, BAKED_SALMON, ICEFISH, BAKED_ICEFISH],
    build(b, root) {
      const fur = pick([0x8a8a8e, 0x9c9a96, 0x6e6c6a, 0xd8d6d2]), pale = 0xd2d0cc, dark = 0x3a3a3c;
      const parts = { legs: [] };
      b.box(root, [0.42, 0.38, 0.86], fur, [0, 0.55, -0.02]);
      b.box(root, [0.5, 0.42, 0.32], fur, [0, 0.6, 0.26]); // shaggy ruff
      const head = parts.head = b.pivot(root, [0, 0.72, 0.44]);
      b.box(head, [0.34, 0.3, 0.3], fur, [0, 0.02, 0.08]);
      b.box(head, [0.18, 0.14, 0.18], pale, [0, -0.06, 0.29]); // muzzle
      b.box(head, [0.06, 0.05, 0.04], 0x111111, [0, -0.01, 0.39]);
      for (const sx of [-1, 1]) {
        b.box(head, [0.08, 0.14, 0.06], dark, [sx * 0.11, 0.22, 0.02]); // ears
        b.box(head, [0.04, 0.04, 0.03], 0x1a1a1a, [sx * 0.09, 0.07, 0.235]);
      }
      parts.collar = b.box(root, [0.44, 0.08, 0.1], 0xc82828, [0, 0.66, 0.38]);
      parts.collar.visible = false;
      for (const [x, z] of [[-0.13, 0.28], [0.13, 0.28], [-0.13, -0.3], [0.13, -0.3]]) {
        const leg = b.pivot(root, [x, 0.38, z]);
        b.box(leg, [0.11, 0.38, 0.11], fur, [0, -0.19, 0]);
        parts.legs.push(leg);
      }
      const tail = parts.tail = b.pivot(root, [0, 0.66, -0.44]);
      b.box(tail, [0.11, 0.11, 0.36], fur, [0, -0.06, -0.16]);
      parts.tame = (on) => { parts.collar.visible = on; };
      return parts;
    },
  },

  // desert camels: tame one with wheat, then ride it
  camel: {
    w: 1.1, h: 2.2, speed: 1.0, followSpeed: 4.5, fleeSpeed: 4.2, sink: 1.3, stride: 4.5, legSwing: 0.45,
    group: [1, 2], cap: 3, avoidWater: true, grazes: true, rideable: true, tames: [WHEAT],
    build(b, root) {
      const coat = 0xc89a5e, dark = 0x9a7040, pale = 0xdcb880;
      const parts = { legs: [] };
      b.box(root, [0.8, 0.6, 1.4], coat, [0, 1.35, 0]);
      b.box(root, [0.62, 0.42, 0.6], dark, [0, 1.82, -0.05]); // hump
      parts.saddle = b.box(root, [0.86, 0.12, 0.62], 0xb02a2a, [0, 1.68, 0.38]);
      parts.saddle.visible = false;
      b.box(root, [0.3, 0.8, 0.32], coat, [0, 1.7, 0.78]); // neck
      const head = parts.head = b.pivot(root, [0, 2.05, 0.9]);
      b.box(head, [0.3, 0.3, 0.55], coat, [0, 0.02, 0.18]);
      b.box(head, [0.26, 0.2, 0.2], pale, [0, -0.06, 0.48]);
      for (const sx of [-1, 1]) { b.box(head, [0.06, 0.1, 0.06], dark, [sx * 0.12, 0.2, -0.02]); b.box(head, [0.04, 0.05, 0.04], 0x111111, [sx * 0.155, 0.08, 0.22]); }
      for (const [x, z] of [[-0.25, 0.5], [0.25, 0.5], [-0.25, -0.5], [0.25, -0.5]]) {
        const leg = b.pivot(root, [x, 1.1, z]);
        b.box(leg, [0.18, 1.1, 0.18], coat, [0, -0.55, 0]);
        b.box(leg, [0.22, 0.08, 0.26], dark, [0, -1.08, 0.02]);
        parts.legs.push(leg);
      }
      const tail = parts.tail = b.pivot(root, [0, 1.5, -0.7]);
      b.box(tail, [0.08, 0.5, 0.08], dark, [0, -0.25, 0]);
      parts.tame = (on) => { parts.saddle.visible = on; };
      return parts;
    },
  },

  // a wandering trader with a big pack, who swaps rare things for what you have plenty of
  trader: {
    w: 0.6, h: 1.85, speed: 0.8, fleeSpeed: 2, sink: 1, stride: 7, legSwing: 0.5,
    avoidWater: true, grazes: false, trader: true,
    build(b, root) {
      const robe = pick([0x2f4f8a, 0x6a2f7a, 0x2f6a4a]), skin = 0xd8a878, trim = 0xe0c050;
      const parts = { legs: [], arms: [] };
      const torso = parts.torso = b.pivot(root, [0, 0.8, 0]);
      b.box(torso, [0.5, 0.7, 0.32], robe, [0, 0.35, 0]);
      b.box(torso, [0.52, 0.08, 0.34], trim, [0, 0.05, 0]); // belt
      b.box(torso, [0.46, 0.6, 0.3], 0x7a5230, [0, 0.4, -0.3]); // pack
      b.box(torso, [0.5, 0.1, 0.34], 0x5c3c22, [0, 0.75, -0.3]);
      const head = parts.head = b.pivot(torso, [0, 0.72, 0]);
      b.box(head, [0.36, 0.36, 0.36], skin, [0, 0.18, 0]);
      b.box(head, [0.38, 0.12, 0.2], 0xe8e2d8, [0, 0.03, 0.1]); // beard
      b.box(head, [0.5, 0.06, 0.5], robe, [0, 0.38, 0]); // hat brim
      b.box(head, [0.3, 0.22, 0.3], robe, [0, 0.5, 0]);
      for (const sx of [-1, 1]) b.box(head, [0.05, 0.05, 0.03], 0x222222, [sx * 0.08, 0.22, 0.18]);
      for (const sx of [-1, 1]) {
        const arm = b.pivot(torso, [sx * 0.32, 0.65, 0]);
        b.box(arm, [0.14, 0.6, 0.14], robe, [0, -0.3, 0]);
        b.box(arm, [0.12, 0.1, 0.12], skin, [0, -0.64, 0]);
        parts.arms.push(arm);
        const leg = b.pivot(root, [sx * 0.12, 0.8, 0]);
        b.box(leg, [0.18, 0.8, 0.2], robe, [0, -0.4, 0]);
        parts.legs.push(leg);
      }
      return parts;
    },
  },

  // villagers live in the villages: each has a trade (farmer, smith, fisher or cleric) and swaps its goods
  villager: {
    w: 0.6, h: 1.8, speed: 0.8, fleeSpeed: 2.2, sink: 1, stride: 7, legSwing: 0.5,
    avoidWater: true, grazes: false, trader: true, villager: true,
    build(b, root, opts = {}) {
      const look = VILLAGER_LOOKS[opts.profession] ?? VILLAGER_LOOKS.farmer;
      const skin = pick([0xd8a878, 0xb07a50, 0x8a5a38, 0xe8c09a]);
      const parts = { legs: [], arms: [] };
      const torso = parts.torso = b.pivot(root, [0, 0.78, 0]);
      b.box(torso, [0.48, 0.68, 0.3], look.robe, [0, 0.34, 0]);
      b.box(torso, [0.5, 0.42, 0.04], look.apron, [0, 0.22, 0.16]); // apron
      const head = parts.head = b.pivot(torso, [0, 0.7, 0]);
      b.box(head, [0.36, 0.38, 0.36], skin, [0, 0.19, 0]);
      b.box(head, [0.08, 0.14, 0.08], shade(skin), [0, 0.13, 0.21]); // nose
      for (const sx of [-1, 1]) b.box(head, [0.05, 0.05, 0.03], 0x222222, [sx * 0.09, 0.24, 0.18]);
      if (look.hat === 'straw') { b.box(head, [0.62, 0.05, 0.62], 0xd8c070, [0, 0.4, 0]); b.box(head, [0.36, 0.14, 0.36], 0xd8c070, [0, 0.48, 0]); }
      else if (look.hat === 'cap') b.box(head, [0.4, 0.1, 0.44], look.apron, [0, 0.42, 0.03]);
      else if (look.hat === 'hood') { b.box(head, [0.42, 0.14, 0.42], look.robe, [0, 0.42, 0]); b.box(head, [0.42, 0.3, 0.06], look.robe, [0, 0.24, -0.2]); }
      else b.box(head, [0.38, 0.1, 0.38], 0x4a3a2a, [0, 0.42, 0]); // hair
      for (const sx of [-1, 1]) {
        const arm = b.pivot(torso, [sx * 0.31, 0.64, 0]);
        b.box(arm, [0.14, 0.58, 0.14], look.robe, [0, -0.29, 0]);
        b.box(arm, [0.12, 0.1, 0.12], skin, [0, -0.62, 0]);
        parts.arms.push(arm);
        const leg = b.pivot(root, [sx * 0.12, 0.78, 0]);
        b.box(leg, [0.18, 0.78, 0.2], look.legs, [0, -0.39, 0]);
        parts.legs.push(leg);
      }
      return parts;
    },
  },

  newt: {
    w: 0.3, h: 0.15, speed: 0.9, fleeSpeed: 2.6, sink: 0.08, stride: 16, legSwing: 0.6,
    group: [1, 2], cap: 5, avoidWater: false, grazes: false,
    build(b, root) {
      const orange = Math.random() < 0.6;
      const skin = orange ? 0xe0641c : 0x6a5233, belly = orange ? 0xf08a2a : 0xe07a20, spot = orange ? 0xb5241a : 0x2a2018;
      const parts = { legs: [], newt: true };
      const torso = parts.torso = b.pivot(root, [0, 0, 0]);
      b.box(torso, [0.16, 0.08, 0.3], skin, [0, 0.07, 0]);
      b.box(torso, [0.14, 0.02, 0.28], belly, [0, 0.03, 0]);
      const head = parts.head = b.pivot(torso, [0, 0.07, 0.15]);
      b.box(head, [0.14, 0.07, 0.12], skin, [0, 0, 0.06]);
      for (const s of [-1, 1]) b.box(head, [0.03, 0.03, 0.03], 0x111111, [s * 0.07, 0.03, 0.07]);
      const tail = b.pivot(torso, [0, 0.07, -0.15]);
      b.box(tail, [0.08, 0.06, 0.18], skin, [0, 0, -0.09]);
      const tip = b.pivot(tail, [0, 0, -0.18]);
      b.box(tip, [0.05, 0.05, 0.16], skin, [0, 0, -0.08]);
      parts.tailSegments = [tail, tip];
      for (const [x, z] of [[0.04, 0.06], [-0.05, -0.04], [0.03, -0.1]]) b.box(torso, [0.035, 0.012, 0.035], spot, [x, 0.116, z]);
      for (const [x, z] of [[-0.1, 0.1], [0.1, 0.1], [-0.1, -0.09], [0.1, -0.09]]) {
        const leg = b.pivot(torso, [x, 0.05, z]);
        b.box(leg, [0.08, 0.03, 0.035], skin, [Math.sign(x) * 0.03, -0.02, 0]);
        parts.legs.push(leg);
      }
      return parts;
    },
  },
};

// Breeding: what each animal can be fed to look for a mate. Two of a kind that have both been fed find each
// other and have a young one, which grows up over GROW_TIME; then they need BREED_REST before they'll breed
// again. They won't when there are already CROWD of their kind close by.
const BREED_FOOD = { duck: [SEEDS], buffalo: [WHEAT], alpaca: [WHEAT], yak: [WHEAT], camel: [WHEAT], newt: [BERRIES] };
for (const [k, f] of Object.entries(BREED_FOOD)) SPECIES[k].breeds = f;
SPECIES.wolf.breeds = SPECIES.wolf.tames;
export const LOVE_TIME = 30, BREED_REST = 300, GROW_TIME = 300, CROWD = 12;
let heartTexture = null;
function heartSprite() {
  if (!heartTexture) {
    const c = document.createElement('canvas');
    c.width = c.height = 16;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#ff4a7a';
    for (const [x, y, w] of [[3, 3, 4], [9, 3, 4], [2, 4, 12], [2, 5, 12], [2, 6, 12], [3, 7, 10], [4, 8, 8], [5, 9, 6], [6, 10, 4], [7, 11, 2]]) ctx.fillRect(x, y, w, 1);
    ctx.fillStyle = '#ffc0d0'; ctx.fillRect(4, 4, 2, 1);
    heartTexture = new THREE.CanvasTexture(c);
    heartTexture.magFilter = THREE.NearestFilter;
  }
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: heartTexture, transparent: true, depthWrite: false }));
  sp.scale.set(0.35, 0.35, 0.35);
  return sp;
}

export const MOB_KINDS = Object.keys(SPECIES);
export { SPECIES };
export const PROFESSIONS = ['farmer', 'smith', 'fisher', 'cleric'];
const HOSTILE_KINDS = MOB_KINDS.filter((k) => SPECIES[k].hostile && !SPECIES[k].boss);
const SURFACE_KINDS = HOSTILE_KINDS.filter((k) => !SPECIES[k].caveOnly);
const ANIMAL_CAP = MAX_MOBS;

// How night creatures behave at each difficulty:
//   cap: most at once; dmg: damage multiplier; sight: how far they notice you (0 = only if you
//   attack them); speed: movement and attack-rate multiplier; minDist: closest they can appear.
export const DIFFICULTY = {
  peaceful: { name: 'Peaceful', cap: 6, dmg: 0.5, sight: 0, speed: 0.9, minDist: 20,
    about: 'Night creatures still roam, but leave you alone unless you attack them.' },
  worrying: { name: 'Worrying', cap: 6, dmg: 0.6, sight: 14, speed: 0.9, minDist: 20,
    about: 'Easy: a few creatures come out at night and only notice you up close.' },
  scary: { name: 'Scary', cap: 12, dmg: 1.2, sight: 22, speed: 1.05, minDist: 16,
    about: 'Hard: more creatures, sharper eyes, harder hits.' },
  terrifying: { name: 'Terrifying', cap: 18, dmg: 1.8, sight: 30, speed: 1.2, minDist: 12,
    about: 'Nightmare: they swarm the dark and hunt you from far away.' },
};
export const DIFFICULTY_ORDER = ['peaceful', 'worrying', 'scary', 'terrifying'];

class Mob {
  constructor(kind, x, y, z, opts = {}) {
    this.profession = opts.profession;
    this.kind = kind;
    this.spec = SPECIES[kind];
    this.pos = new THREE.Vector3(x, y, z);
    this.vel = new THREE.Vector3();
    this.kx = 0; this.kz = 0; // knockback
    this.yaw = rand(0, Math.PI * 2);
    this.heading = this.yaw;
    this.state = 'idle';
    this.timer = rand(0, 2);
    this.phase = 0;
    this.swing = 0; // leg swing amount, eased in and out
    this.headTilt = 0;
    this.onGround = false;
    this.inWater = false;
    this.flash = 0;
    this.soundTimer = rand(4, 20);
    this.shornFor = 0;
    this.featherFor = 0;
    this.slimeFor = 0;
    // night creatures
    this.hp = this.spec.hp ?? 0;
    this.angry = 0; // seconds left of hunting the player after being attacked
    this.attackCD = rand(0.5, 1.5);
    this.swingT = 0; // attack animation
    this.sees = false;
    this.seeTimer = 0;
    this.hunting = false;
    this.burn = 0; // dissolving in daylight
    this.dying = 0;
    this.material = new THREE.MeshBasicMaterial({ vertexColors: true });
    this.glowMaterial = new THREE.MeshBasicMaterial({ vertexColors: true });
    const b = new Builder(this.material, this.glowMaterial);
    this.root = new THREE.Group();
    this.parts = this.spec.build(b, this.root, opts);
    this.baseScale = this.root.scale.x;
    this.geometries = b.geometries;
  }

  dispose(scene) {
    scene.remove(this.root);
    if (this.heart) { scene.remove(this.heart); this.heart.material.dispose(); this.heart = null; }
    for (const g of this.geometries) g.dispose();
    this.material.dispose();
    this.glowMaterial.dispose();
  }
}

export class MobManager {
  constructor(scene, sound) {
    this.scene = scene;
    this.sound = sound;
    this.mobs = [];
    this.world = null;
    this.spawnTimer = 0;
    this.hostileTimer = 0;
    this.onHurtPlayer = null; // (amount, cause, fromPos) when a creature hits the player
    this.onShoot = null; // (origin, dir, damage) when a thornspitter spits
  }

  get animals() { return this.mobs.filter((m) => !m.spec.hostile).length; }
  get creatures() { return this.mobs.filter((m) => m.spec.hostile && !m.spec.boss).length; }

  // After the player respawns, creatures forget the grudge.
  calm() { for (const m of this.mobs) { m.angry = 0; m.hunting = false; } }

  reset(world) {
    for (const m of this.mobs) m.dispose(this.scene);
    this.mobs = [];
    this.world = world;
  }

  count(kind) {
    let n = 0;
    for (const m of this.mobs) if (m.kind === kind) n++;
    return n;
  }

  // ---------- spawning ----------

  // Top block of a column: { y, id }, or null under a tree (no spawning in canopies).
  surface(x, z) {
    const w = this.world;
    for (let y = H - 1; y > 0; y--) {
      const id = w.get(x, y, z);
      if (id === AIR) continue;
      if (id === LEAVES || id === LOG) return null;
      return { y, id };
    }
    return null;
  }

  nearWater(x, y, z, r = 3) {
    for (let dz = -r; dz <= r; dz++) for (let dx = -r; dx <= r; dx++) {
      if (this.world.isWater(x + dx, y, z + dz) || this.world.isWater(x + dx, y + 1, z + dz)) return true;
    }
    return false;
  }

  // Which animal (if any) would live at this column, and where its feet would go.
  habitat(x, z) {
    const s = this.surface(x, z);
    if (!s) return null;
    if (s.id === WATER) return { kinds: ['duck'], y: s.y + 0.875 - SPECIES.duck.sink, water: true };
    const y = s.y + 1;
    if (s.id === SNOW_GRASS || s.id === SNOW) return { kinds: ['alpaca', 'yak', 'wolf'], y }; // the shaggy ones like the cold
    if (s.id !== GRASS && s.id !== SAND && s.id !== DIRT) return null;
    if (s.id === SAND && s.y > SEA_LEVEL + 1 && !this.nearWater(x, s.y, z) && this.world.generator.biomeAt(x, z) === 'desert') return { kinds: ['camel'], y };
    if (this.nearWater(x, s.y, z)) return { kinds: ['duck', 'newt'], y };
    if (s.id !== GRASS) return null;
    if (s.y >= SEA_LEVEL + 12) return { kinds: ['alpaca', 'yak'], y };
    if (s.y >= SEA_LEVEL + 2) return { kinds: ['buffalo'], y };
    return null;
  }

  // Is the animal's whole collision box (centred on (x, z), feet at y) free of solid blocks?
  hasRoom(kind, x, y, z) {
    const w = this.world, hw = SPECIES[kind].w / 2, h = SPECIES[kind].h;
    for (let by = Math.floor(y); by <= Math.floor(y + h - 1e-6); by++)
      for (let bz = Math.floor(z - hw); bz <= Math.floor(z + hw - 1e-6); bz++)
        for (let bx = Math.floor(x - hw); bx <= Math.floor(x + hw - 1e-6); bx++) {
          if (w.isSolid(bx, by, bz)) return false;
        }
    return true;
  }

  trySpawn(player) {
    if (this.animals >= ANIMAL_CAP) return;
    const w = this.world;
    const far = Math.max(SPAWN_MIN_DIST + 8, w.renderDistance * 16 - 8);
    const a = rand(0, Math.PI * 2), d = rand(SPAWN_MIN_DIST, far);
    const x = Math.floor(player.pos.x + Math.cos(a) * d), z = Math.floor(player.pos.z + Math.sin(a) * d);
    if (!w.chunkAt(x, z)) return;
    const hab = this.habitat(x, z);
    if (!hab) return;
    const kind = pick(hab.kinds);
    const spec = SPECIES[kind];
    if (this.count(kind) >= spec.cap) return;
    const n = Math.round(rand(spec.group[0], spec.group[1]));
    for (let i = 0; i < n && this.animals < ANIMAL_CAP && this.count(kind) < spec.cap; i++) {
      const gx = i ? x + Math.round(rand(-3, 3)) : x, gz = i ? z + Math.round(rand(-3, 3)) : z;
      if (!w.chunkAt(gx, gz)) continue;
      const h = i ? this.habitat(gx, gz) : hab;
      if (!h || !h.kinds.includes(kind) || !this.hasRoom(kind, gx + 0.5, h.y, gz + 0.5)) continue;
      const m = new Mob(kind, gx + 0.5, h.y, gz + 0.5);
      this.mobs.push(m);
      this.scene.add(m.root);
    }
  }

  spawnTrader(player) {
    const w = this.world;
    for (let k = 0; k < 12; k++) {
      const a = rand(0, Math.PI * 2), d = rand(10, 18);
      const x = Math.floor(player.pos.x + Math.cos(a) * d), z = Math.floor(player.pos.z + Math.sin(a) * d);
      if (!w.chunkAt(x, z)) continue;
      const s = this.surface(x, z);
      if (!s || s.id === WATER || w.isWater(x, s.y, z) || !this.hasRoom('trader', x + 0.5, s.y + 1, z + 0.5)) continue;
      const m = this.spawn('trader', x + 0.5, s.y + 1, z + 0.5);
      m.leaveIn = 360;
      this.onTraderSpawn?.(m);
      return m;
    }
    return null;
  }

  // Villagers turn up around a village as you come near it, and stay close to home.
  spawnVillagers(player) {
    const w = this.world;
    const v = w.generator.nearestVillage(player.pos.x, player.pos.z, 1);
    if (!v || Math.hypot(v.x - player.pos.x, v.z - player.pos.z) > 80) return;
    const here = this.mobs.filter((m) => m.home === v).length;
    if (here >= Math.min(5, v.houses.length + 1)) return;
    const hs = pick(v.houses);
    const x = hs.x + hs.door[0] * 2 + Math.round(rand(-1, 1)), z = hs.z + hs.door[1] * 2 + Math.round(rand(-1, 1));
    if (!w.chunkAt(x, z)) return;
    const s = this.surface(x, z);
    if (!s || w.isWater(x, s.y, z) || !this.hasRoom('villager', x + 0.5, s.y + 1, z + 0.5)) return;
    const used = this.mobs.filter((m) => m.home === v).map((m) => m.profession);
    const profession = PROFESSIONS.find((p) => !used.includes(p)) ?? pick(PROFESSIONS);
    const m = this.spawn('villager', x + 0.5, s.y + 1, z + 0.5, { profession });
    m.home = v;
    this.onVillagerSpawn?.(m);
    return m;
  }

  // Put a specific animal at (x, y, z), feet at y. Handy for testing from the console.
  spawn(kind, x, y, z, opts) {
    const m = new Mob(kind, x, y, z, opts);
    this.mobs.push(m);
    this.scene.add(m.root);
    return m;
  }

  // A monster spawner at (x, y, z) brings out one of the cave creatures (always the same kind for the same
  // spawner) on open floor near it, unless there are already a few about. Returns the creature, or null.
  spawnNear(x, y, z) {
    const w = this.world;
    const near = this.mobs.filter((m) => m.spec.hostile && !m.dying && Math.hypot(m.pos.x - x - 0.5, m.pos.y - y, m.pos.z - z - 0.5) < 9).length;
    if (near >= 4) return null;
    const kinds = HOSTILE_KINDS.filter((k) => !SPECIES[k].heavy);
    const kind = kinds[Math.abs((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) % kinds.length];
    for (let tries = 0; tries < 8; tries++) {
      const sx = x + Math.floor(rand(-3, 4)), sz = z + Math.floor(rand(-3, 4)), sy = y + Math.floor(rand(-1, 2));
      if (!w.isSolid(sx, sy - 1, sz) || w.isWater(sx, sy, sz) || !this.hasRoom(kind, sx + 0.5, sy, sz + 0.5)) continue;
      const m = this.spawn(kind, sx + 0.5, sy, sz + 0.5);
      this.sound?.poof();
      return m;
    }
    return null;
  }

  // A creature hurt by where it is rather than by you: lava, cactus, or a long fall. It isn't angered or
  // knocked back, and what it drops falls where it dies (so a mob farm's collectors can gather it).
  hurtByWorld(m, amount) {
    if (m.dying || !m.spec.hostile || m.spec.boss) return;
    m.hp -= amount;
    m.flash = 0.25;
    if (m.hp > 0) return;
    m.dying = 0.4;
    this.sound?.poof();
    this.onWorldKill?.(m, m.spec.drops());
  }

  // Night creatures appear in the dark: on the surface at night, or in caves at any time,
  // and never where a torch lights the ground well enough (light level 7 or more).
  trySpawnHostile(player, ctx) {
    const diff = ctx.difficulty, w = this.world;
    if (!diff || this.creatures >= diff.cap) return;
    const far = Math.max(diff.minDist + 8, w.renderDistance * 16 - 8);
    const a = rand(0, Math.PI * 2), d = rand(diff.minDist, far);
    const x = Math.floor(player.pos.x + Math.cos(a) * d), z = Math.floor(player.pos.z + Math.sin(a) * d);
    if (!w.chunkAt(x, z)) return;
    const s = this.surface(x, z);
    let y = -1, surface = false;
    if (s && s.id !== WATER && Math.random() < 0.5) {
      y = s.y + 1; surface = true;
    } else {
      // somewhere in a cave below: a floor with two open blocks above it
      for (let yy = 2 + Math.floor(Math.random() * Math.max(4, (s ? s.y : 40) - 4)); yy > 1; yy--) {
        if (w.isSolid(x, yy - 1, z) && !w.isSolid(x, yy, z) && !w.isSolid(x, yy + 1, z) && !w.isWater(x, yy, z)) { y = yy; break; }
      }
    }
    if (y < 1 || y >= H - 2 || !w.isSolid(x, y - 1, z) || w.isWater(x, y, z) || w.isWater(x, y - 1, z)) return;
    const light = Math.max(w.skyAt(x, y, z) * ctx.daylight, w.lightAt(x, y, z));
    if (light >= 7) return;
    // (cave spiders keep to the dark under a roof of rock)
    const kinds = surface || w.skyAt(x, y, z) > 0 ? SURFACE_KINDS : HOSTILE_KINDS;
    let r = Math.random() * kinds.reduce((t, k) => t + SPECIES[k].weight, 0), kind = kinds[0];
    for (const k of kinds) { r -= SPECIES[k].weight; if (r <= 0) { kind = k; break; } }
    if (!this.hasRoom(kind, x + 0.5, y, z + 0.5)) return;
    this.spawn(kind, x + 0.5, y, z + 0.5);
  }

  // ---------- per-frame update ----------

  // light: { day, flicker, ambient } from the renderer, so animals are lit like the blocks around them.
  // ctx: { difficulty (a DIFFICULTY entry), daylight (0.22 at night .. 1 at noon), playerDead }
  update(dt, player, light, ctx = {}) {
    const w = this.world;
    if (!w) return;
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.spawnTimer = 0.4;
      this.trySpawn(player);
    }
    // now and then, on a fine day, a wandering trader turns up nearby (one at a time)
    this.traderTimer = (this.traderTimer ?? 30) - dt;
    if (this.traderTimer <= 0) {
      this.traderTimer = 30;
      if ((ctx.daylight ?? 0) > 0.8 && !this.mobs.some((m) => m.spec.trader) && Math.random() < (ctx.traderChance ?? 0.12)) this.spawnTrader(player);
    }
    this.villageTimer = (this.villageTimer ?? 0) - dt;
    if (this.villageTimer <= 0) { this.villageTimer = 3; this.spawnVillagers(player); }
    this.hostileTimer -= dt;
    if (this.hostileTimer <= 0) {
      this.hostileTimer = 0.5;
      if (ctx.difficulty) this.trySpawnHostile(player, ctx);
    }
    const despawn = w.renderDistance * 16 + 24;
    for (let i = this.mobs.length - 1; i >= 0; i--) {
      const m = this.mobs[i];
      const dx = m.pos.x - player.pos.x, dz = m.pos.z - player.pos.z;
      const dist = Math.hypot(dx, dz);
      if (m.tame) {
        // a pet: waits where it is while its part of the world is unloaded; one following you that's
        // been left far behind catches up
        if (!m.sitting && dist > 40) { m.pos.set(player.pos.x + Math.sin(player.yaw) * 2, player.pos.y + 0.2, player.pos.z + Math.cos(player.yaw) * 2); m.vel.set(0, 0, 0); }
        if (!w.chunkAt(Math.floor(m.pos.x), Math.floor(m.pos.z))) { m.root.visible = false; continue; }
        m.root.visible = true;
      } else if (dist > despawn || !w.chunkAt(Math.floor(m.pos.x), Math.floor(m.pos.z)) || (m.spec.trader && (m.leaveIn -= dt) <= 0)) {
        if (m.spec.trader && dist < 30) this.sound?.poof();
        m.dispose(this.scene);
        this.mobs.splice(i, 1);
        continue;
      }
      if (m.dying) {
        // defeated: shrink away
        m.dying -= dt;
        const k = Math.max(0.01, m.dying / 0.4);
        m.root.scale.setScalar(k * m.baseScale);
        m.root.rotation.z = (1 - k) * 1.2;
        if (m.dying <= 0) { m.dispose(this.scene); this.mobs.splice(i, 1); }
        continue;
      }
      if (m.spec.hostile) {
        // caught in daylight: dissolve back into shadow
        const head = Math.min(H - 1, Math.floor(m.pos.y + m.spec.h * 0.8));
        if (!m.spec.noBurn && ctx.daylight > 0.55 && w.skyAt(Math.floor(m.pos.x), head, Math.floor(m.pos.z)) >= 12) m.burn += dt;
        else m.burn = Math.max(0, m.burn - dt);
        if (m.burn > 1.5) { this.sound?.poof(); m.dispose(this.scene); this.mobs.splice(i, 1); continue; }
        this.thinkHostile(m, dt, player, ctx);
      } else if (m.ridden) {
        // ridden: goes where the rider steers
        m.state = ctx.ride && Math.abs(ctx.ride.moveZ) + Math.abs(ctx.ride.moveX) > 0.2 ? 'ride' : 'idle';
        if (ctx.ride) {
          const fx = -Math.sin(ctx.ride.yaw), fz = -Math.cos(ctx.ride.yaw), rx = Math.cos(ctx.ride.yaw), rz = -Math.sin(ctx.ride.yaw);
          const vx = fx * ctx.ride.moveZ + rx * ctx.ride.moveX, vz = fz * ctx.ride.moveZ + rz * ctx.ride.moveX;
          m.heading = Math.atan2(vx, vz);
          m.rideSpeed = Math.min(1, Math.hypot(vx, vz)) * 7;
        }
      } else if (m.tame) {
        this.thinkPet(m, dt, player);
        if (m.love > 0) this.seekMate(m);
      } else {
        this.think(m, dt, player);
        if (m.love > 0) this.seekMate(m);
      }
      if (!m.spec.hostile) this.tickBreeding(m, dt);
      this.move(m, dt);
      if (m.spec.hostile) this.worldHarm(m, dt);
      this.animate(m, dt);
      if (m.burn > 0) m.root.scale.setScalar((1 - m.burn * 0.4) * m.baseScale);
      this.light(m, light, dt);
      m.soundTimer -= dt;
      if (m.soundTimer <= 0) {
        m.soundTimer = rand(8, 25);
        if (dist < 22) this.sound?.mob(m.kind, 1 - dist / 22);
      }
      if (m.shornFor > 0 && (m.shornFor -= dt) <= 0) m.parts.shear?.(false);
      if (m.featherFor > 0) m.featherFor -= dt;
      if (m.hideFor > 0) m.hideFor -= dt;
      if (m.slimeFor > 0) m.slimeFor -= dt;
    }
  }

  // Behaviour: idle / graze / walk somewhere / run away from the player after being bumped.
  think(m, dt, player) {
    const spec = m.spec;
    m.timer -= dt;
    // villagers wander back toward the well if they stray too far
    if (m.home && m.state === 'walk' && Math.hypot(m.pos.x - m.home.x, m.pos.z - m.home.z) > 16) m.heading = Math.atan2(m.home.x - m.pos.x, m.home.z - m.pos.z);
    if (m.state === 'flee') {
      m.heading = Math.atan2(m.pos.x - player.pos.x, m.pos.z - player.pos.z) + Math.sin(m.timer * 3) * 0.3;
      if (m.timer <= 0) { m.state = 'idle'; m.timer = rand(1, 3); }
    } else if (m.timer <= 0) {
      const r = Math.random();
      if (m.state !== 'walk' && r < 0.55) {
        m.state = 'walk';
        m.heading = m.yaw + rand(-1.6, 1.6);
        m.timer = spec === SPECIES.newt ? rand(0.4, 1.4) : rand(1.5, 4.5);
      } else if (spec.grazes && r < 0.8) {
        m.state = 'graze';
        m.timer = rand(2, 5);
      } else {
        m.state = 'idle';
        m.timer = rand(1, 4);
      }
    }
  }

  // A tame wolf or camel: follows you (unless told to stay), and a wolf chases night creatures near you.
  thinkPet(m, dt, player) {
    m.attackCD = Math.max(0, (m.attackCD ?? 0) - dt);
    if (m.sitting) { m.state = 'idle'; return; }
    const dp = Math.hypot(player.pos.x - m.pos.x, player.pos.z - m.pos.z);
    if (m.spec.fights) {
      let target = null, best = 12;
      for (const o of this.mobs) {
        if (!o.spec.hostile || o.dying) continue;
        const d = Math.hypot(o.pos.x - m.pos.x, o.pos.z - m.pos.z);
        if (d < best && Math.hypot(o.pos.x - player.pos.x, o.pos.z - player.pos.z) < 16) { best = d; target = o; }
      }
      if (target) {
        m.state = 'chase';
        m.heading = Math.atan2(target.pos.x - m.pos.x, target.pos.z - m.pos.z);
        m.closeEnough = best < 1 + target.spec.w / 2;
        if (best < 1.4 + target.spec.w / 2 && m.attackCD <= 0) {
          m.attackCD = 0.9;
          this.sound?.mob(m.kind, 0.8);
          const drops = this.hurt(target, 5, m.pos);
          if (drops.length) this.onPetKill?.(drops);
        }
        return;
      }
    }
    if (dp > 4) { m.state = 'follow'; m.heading = Math.atan2(player.pos.x - m.pos.x, player.pos.z - m.pos.z); }
    else if (m.state === 'follow' && dp < 2.5) { m.state = 'idle'; m.timer = rand(1, 3); }
    else if (m.state !== 'follow') this.think(m, dt, player);
  }

  // Can the creature see the player (nothing solid between its eyes and theirs)?
  canSee(m, player) {
    const o = new THREE.Vector3(m.pos.x, m.pos.y + m.spec.h * 0.8, m.pos.z);
    const to = new THREE.Vector3(player.pos.x, player.pos.y + 1.5, player.pos.z).sub(o);
    const dist = to.length();
    if (dist < 0.01) return true;
    const hit = this.world.raycast(o, to.divideScalar(dist), dist, true);
    return !hit || hit.t >= dist - 0.3;
  }

  // Night creatures hunt the player when they notice them (or after being attacked);
  // otherwise they wander like animals.
  thinkHostile(m, dt, player, ctx) {
    const spec = m.spec, diff = ctx.difficulty ?? DIFFICULTY.worrying;
    m.speedMul = diff.speed;
    m.attackCD = Math.max(0, m.attackCD - dt);
    m.angry = Math.max(0, m.angry - dt);
    m.swingT = Math.max(0, m.swingT - dt);
    const ex = player.pos.x - m.pos.x, ez = player.pos.z - m.pos.z;
    const ey = (player.pos.y + 0.9) - (m.pos.y + spec.h * 0.5);
    const d = Math.hypot(ex, ez);
    if ((m.seeTimer -= dt) <= 0) { m.seeTimer = 0.4; m.sees = d < 40 && this.canSee(m, player); }
    const range = m.angry > 0 ? 28 : diff.sight;
    const hunting = !ctx.playerDead && range > 0 && d < range && (m.sees || m.angry > 0);
    if (!hunting) {
      if (m.hunting) { m.hunting = false; m.state = 'idle'; m.timer = rand(1, 3); }
      this.think(m, dt, player);
      return;
    }
    if (!m.hunting) { m.hunting = true; this.sound?.mob(m.kind, Math.max(0.3, 1 - d / 30)); } // a warning noise
    const toward = Math.atan2(ex, ez);
    if (spec.ranged) {
      const r = spec.ranged;
      if (d > r.max) { m.state = 'chase'; m.heading = toward; }
      else if (d < r.min) { m.state = 'retreat'; m.heading = toward + Math.PI; }
      else { m.state = 'aim'; m.heading = toward; }
      if (m.sees && d <= r.max + 3 && m.attackCD <= 0) {
        m.attackCD = r.every / diff.speed;
        m.swingT = 0.3;
        const origin = new THREE.Vector3(m.pos.x, m.pos.y + spec.h * 0.75, m.pos.z);
        // aim above the player by how far the thorn will drop on the way (a simple ballistic lead)
        const flight = d / THORN_SPEED;
        const drop = 0.5 * THORN_GRAVITY * flight * flight;
        const aim = new THREE.Vector3(player.pos.x, player.pos.y + 1.2 + drop, player.pos.z).sub(origin).normalize();
        this.sound?.spit();
        this.onShoot?.(origin, aim, spec.damage * diff.dmg, m.kind);
      }
    } else {
      m.state = 'chase';
      m.heading = toward;
      if (d < spec.reach && Math.abs(ey) < 1.6 && m.attackCD <= 0) {
        m.attackCD = spec.attackEvery / diff.speed;
        m.swingT = 0.3;
        this.onHurtPlayer?.(spec.damage * diff.dmg, spec.cause, m.pos.clone(), m.kind);
      }
    }
    m.closeEnough = !spec.ranged && d < spec.reach * 0.6;
  }

  speedOf(m) {
    if (m.state === 'ride') return m.rideSpeed ?? 0;
    if (m.state === 'follow') return m.spec.followSpeed ?? m.spec.speed * 3;
    if (m.state === 'flee') return m.spec.fleeSpeed;
    if (m.state === 'walk') return m.spec.speed * (m.inWater ? 0.6 : 1);
    if (m.state === 'chase') return m.closeEnough ? 0 : m.spec.chaseSpeed * (m.speedMul ?? 1);
    if (m.state === 'retreat') return m.spec.chaseSpeed * 0.7 * (m.speedMul ?? 1);
    return 0;
  }

  // Would stepping forward walk off a cliff (or, for land animals, into water)?
  badAhead(m, dx, dz) {
    const w = this.world, hw = m.spec.w / 2;
    const ax = Math.floor(m.pos.x + dx * (hw + 0.5)), az = Math.floor(m.pos.z + dz * (hw + 0.5));
    const fy = Math.floor(m.pos.y + 0.01);
    if (m.spec.avoidWater && (w.isWater(ax, fy, az) || w.isWater(ax, fy - 1, az))) return true;
    if (w.isSolid(ax, fy, az)) return false; // a wall or step: handled by stepping up or turning
    for (let d = 1; d <= 3; d++) if (w.isSolid(ax, fy - d, az) || w.isWater(ax, fy - d, az)) return false;
    return true;
  }

  // Move along one axis, stopping at the first solid block the leading face moves into.
  // Only newly entered cells are tested, so an animal that somehow overlaps a block can walk free
  // instead of being shoved through it.
  moveAxis(m, axis, delta) {
    if (!delta) return false;
    const w = this.world, p = m.pos, hw = m.spec.w / 2, h = m.spec.h;
    const lo = axis === 'y' ? p.y : p[axis] - hw;
    const hi = axis === 'y' ? p.y + h : p[axis] + hw;
    p[axis] += delta;
    // range of cells (along this axis) entered by the leading face, nearest first
    let first, last, step;
    if (delta > 0) { first = Math.floor(hi - 1e-6) + 1; last = Math.floor(hi + delta - 1e-6); step = 1; }
    else { first = Math.floor(lo) - 1; last = Math.floor(lo + delta); step = -1; }
    if ((last - first) * step < 0) return false;
    // the other two axes' cell ranges
    const r = (c, half) => [Math.floor(c - half), Math.floor(c + half - 1e-6)];
    const [ya, yb] = [Math.floor(p.y), Math.floor(p.y + h - 1e-6)];
    const [xa, xb] = r(p.x, hw), [za, zb] = r(p.z, hw);
    for (let c = first; (last - c) * step >= 0; c += step) {
      let solid = false;
      if (axis === 'x') { for (let y = ya; y <= yb && !solid; y++) for (let z = za; z <= zb; z++) if (w.isSolid(c, y, z)) { solid = true; break; } }
      else if (axis === 'z') { for (let y = ya; y <= yb && !solid; y++) for (let x = xa; x <= xb; x++) if (w.isSolid(x, y, c)) { solid = true; break; } }
      else { for (let z = za; z <= zb && !solid; z++) for (let x = xa; x <= xb; x++) if (w.isSolid(x, c, z)) { solid = true; break; } }
      if (!solid) continue;
      if (axis === 'y') {
        if (delta < 0) { p.y = c + 1; m.onGround = true; } else p.y = c - h - 1e-4;
      } else {
        p[axis] = delta > 0 ? c - hw - 1e-4 : c + 1 + hw + 1e-4;
      }
      return true;
    }
    return false;
  }

  canStepUp(m, dx, dz) {
    const w = this.world, hw = m.spec.w / 2;
    const ax = Math.floor(m.pos.x + Math.sign(dx) * (hw + 0.3)), az = Math.floor(m.pos.z + Math.sign(dz) * (hw + 0.3));
    const fy = Math.floor(m.pos.y + 0.01);
    for (let k = 1; k <= Math.ceil(m.spec.h); k++) if (w.isSolid(ax, fy + k, az)) return false;
    return w.isSolid(ax, fy, az) && !w.isTall(ax, fy, az); // nothing hops a fence
  }

  move(m, dt) {
    const w = this.world, spec = m.spec;
    let speed = this.speedOf(m);
    let dx = Math.sin(m.heading), dz = Math.cos(m.heading);
    const hunting = m.state === 'chase' || m.state === 'retreat' || m.state === 'aim' || m.state === 'follow';
    if (m.state === 'ride') { /* the rider decides */ } else if (speed && hunting && (m.onGround || m.inWater) && this.badAhead(m, dx, dz)) {
      speed = 0; // a hunter waits at the edge rather than wandering off
    } else if (speed && (m.onGround || m.inWater) && this.badAhead(m, dx, dz)) {
      m.heading += m.state === 'flee' ? Math.PI / 2 : rand(Math.PI * 0.6, Math.PI * 1.4);
      dx = Math.sin(m.heading); dz = Math.cos(m.heading);
      speed *= 0.3;
    }
    m.vel.x = dx * speed + m.kx;
    m.vel.z = dz * speed + m.kz;
    const decay = Math.exp(-5 * dt);
    m.kx *= decay; m.kz *= decay;

    // float in water, fall on land
    const fx = Math.floor(m.pos.x), fz = Math.floor(m.pos.z);
    m.inWater = w.isWater(fx, Math.floor(m.pos.y + 0.05), fz) || w.isWater(fx, Math.floor(m.pos.y + spec.h * 0.5), fz);
    if (m.inWater) {
      let wy = Math.floor(m.pos.y + 0.05);
      if (!w.isWater(fx, wy, fz)) wy = Math.floor(m.pos.y + spec.h * 0.5);
      while (wy < H - 1 && w.isWater(fx, wy + 1, fz)) wy++;
      const target = wy + 0.875 - spec.sink;
      m.vel.y += (target - m.pos.y) * 12 * dt;
      m.vel.y *= Math.max(0, 1 - 5 * dt);
    } else {
      m.vel.y = Math.max(m.vel.y - GRAVITY * dt, -30);
    }

    const steps = Math.max(1, Math.ceil((Math.abs(m.vel.y) + Math.abs(m.vel.x) + Math.abs(m.vel.z)) * dt / 0.3));
    const h = dt / steps;
    for (let i = 0; i < steps; i++) {
      const wasGround = m.onGround;
      const bx = this.moveAxis(m, 'x', m.vel.x * h);
      const bz = this.moveAxis(m, 'z', m.vel.z * h);
      m.onGround = false;
      if (this.moveAxis(m, 'y', m.vel.y * h)) m.vel.y = 0;
      if ((bx || bz) && speed) {
        if ((wasGround || m.inWater) && this.canStepUp(m, dx, dz)) m.vel.y = m.inWater ? 6 : 7.5;
        else if (wasGround && !hunting) m.heading += rand(Math.PI * 0.5, Math.PI * 1.5); // a wall: turn away
      }
    }
    // turn smoothly toward the heading
    let diff = m.heading - m.yaw;
    diff = Math.atan2(Math.sin(diff), Math.cos(diff));
    m.yaw += diff * Math.min(1, dt * (m.state === 'flee' || hunting ? 10 : 5));
    m.moving = speed > 0;
  }

  // What hurts a night creature where it is: lava (and it burns), cactus beside it, and falls of more than
  // four blocks.
  worldHarm(m, dt) {
    const w = this.world, fx = Math.floor(m.pos.x), fy = Math.floor(m.pos.y + 0.1), fz = Math.floor(m.pos.z);
    if (m.inWater || m.onGround) {
      const fall = (m.fallTop ?? m.pos.y) - m.pos.y;
      m.fallTop = m.pos.y;
      if (fall > 4 && !m.inWater) this.hurtByWorld(m, Math.round((fall - 3) * 2));
    } else m.fallTop = Math.max(m.fallTop ?? m.pos.y, m.pos.y);
    m.harmT = (m.harmT ?? 0) - dt;
    if (m.harmT > 0) return;
    const at = (x, y, z) => { const id = w.get(x, y, z); return id === LAVA || BLOCKS[id]?.variantOf === LAVA ? 'lava' : BLOCKS[id]?.prickly ? 'prickly' : null; };
    if (at(fx, fy, fz) === 'lava') { m.harmT = 0.5; this.hurtByWorld(m, 4); return; }
    const hw = m.spec.w / 2 + 0.1;
    for (const [dx, dz] of [[hw, 0], [-hw, 0], [0, hw], [0, -hw]]) {
      if (at(Math.floor(m.pos.x + dx), fy, Math.floor(m.pos.z + dz)) === 'prickly' || at(fx, fy - 1, fz) === 'prickly') { m.harmT = 0.5; this.hurtByWorld(m, 2); return; }
    }
  }

  animate(m, dt) {
    const p = m.parts, spec = m.spec;
    m.swing += ((m.moving ? 1 : 0) - m.swing) * Math.min(1, dt * 8);
    m.phase += dt * spec.stride * (m.state === 'flee' ? 1.6 : 1);
    const s = Math.sin(m.phase) * spec.legSwing * m.swing;
    if (p.newt) {
      // newts scurry: legs paddle sideways and the body and tail wiggle
      p.legs.forEach((leg, i) => { leg.rotation.y = (i === 0 || i === 3 ? s : -s); });
      p.torso.rotation.y = Math.sin(m.phase * 0.5) * 0.25 * m.swing;
      p.tailSegments[0].rotation.y = -Math.sin(m.phase * 0.5) * 0.5 * (0.3 + m.swing);
      p.tailSegments[1].rotation.y = -Math.sin(m.phase * 0.5 - 1) * 0.6 * (0.3 + m.swing);
    } else if (p.legs.length === 2 && !p.arms) {
      p.legs[0].rotation.x = s; p.legs[1].rotation.x = -s;
      // ducks waddle on land and bob on water
      p.torso.rotation.z = m.inWater ? Math.sin(m.phase * 0.3) * 0.05 : Math.sin(m.phase) * 0.12 * m.swing;
    } else if (p.arms) {
      // two-legged creatures: legs and arms swing opposite; arms lash out when attacking
      p.legs[0].rotation.x = s; p.legs[1].rotation.x = -s;
      const lash = m.swingT > 0 ? -1.4 * Math.sin((m.swingT / 0.3) * Math.PI) : 0;
      p.arms[0].rotation.x = -s * 0.8 + lash - (m.hunting ? 0.5 : 0);
      p.arms[1].rotation.x = s * 0.8 + lash - (m.hunting ? 0.5 : 0);
    } else {
      p.legs.forEach((leg, i) => { leg.rotation.x = (i === 0 || i === 3 ? s : -s); });
    }
    // a thornspitter rears its head back to spit
    if (m.spec.ranged && p.head) p.head.rotation.x = m.swingT > 0 ? -0.6 * Math.sin((m.swingT / 0.3) * Math.PI) : 0;
    // grazing animals lower their heads to eat
    const tilt = m.state === 'graze' ? 0.95 : m.moving ? Math.sin(m.phase * 2) * 0.05 : 0;
    m.headTilt += (tilt - m.headTilt) * Math.min(1, dt * 4);
    if (p.head && !m.spec.ranged) p.head.rotation.x = m.headTilt;
    if (p.tail) p.tail.rotation.z = Math.sin(m.phase * 0.7 + 1) * 0.15;
    m.root.position.copy(m.pos);
    m.root.rotation.y = m.yaw;
  }

  // Same lighting as the blocks: max(daylight x sunlight, warm torch light, ambient).
  light(m, { day, flicker, ambient }, dt) {
    const w = this.world;
    const x = Math.floor(m.pos.x), y = Math.min(H - 1, Math.floor(m.pos.y + m.spec.h * 0.6)), z = Math.floor(m.pos.z);
    const sun = day * skyBrightness(w.skyAt(x, y, z));
    const t = lightBrightness(w.lightAt(x, y, z)) * flicker;
    let r = Math.max(sun, t, ambient), g = Math.max(sun, t * 0.86, ambient), b = Math.max(sun, t * 0.66, ambient);
    if (m.flash > 0) { // red flash when bumped
      m.flash -= dt;
      r = Math.max(r, 0.35); g *= 0.4; b *= 0.4;
    }
    m.material.color.setRGB(r, g, b);
  }

  // ---------- interaction ----------

  // Nearest animal hit by a ray: { mob, t } or null.
  raycast(o, d, maxDist) {
    let best = null;
    for (const m of this.mobs) {
      if (m.dying) continue;
      const hw = m.spec.w / 2;
      const min = [m.pos.x - hw, m.pos.y, m.pos.z - hw], max = [m.pos.x + hw, m.pos.y + m.spec.h, m.pos.z + hw];
      const oo = [o.x, o.y, o.z], dd = [d.x, d.y, d.z];
      let t0 = 0, t1 = maxDist, hit = true;
      for (let a = 0; a < 3 && hit; a++) {
        if (Math.abs(dd[a]) < 1e-9) {
          if (oo[a] < min[a] || oo[a] > max[a]) hit = false;
          continue;
        }
        let ta = (min[a] - oo[a]) / dd[a], tb = (max[a] - oo[a]) / dd[a];
        if (ta > tb) [ta, tb] = [tb, ta];
        t0 = Math.max(t0, ta); t1 = Math.min(t1, tb);
        if (t0 > t1) hit = false;
      }
      if (hit && (!best || t0 < best.t)) best = { mob: m, t: t0 };
    }
    return best;
  }

  // The player taps an animal while holding `held`. Returns { give, take, said }: items to give the
  // player and to take from them (as [[id, count], ...]), and a short message (or '').
  //   yak + empty bucket  -> milk bucket (the yak stays calm)
  //   newt + empty bucket -> slime bucket
  //   duck                -> a feather (one every so often)
  //   alpaca              -> wool (then its coat needs time to regrow)
  //   anything else just bumps the animal, which hops away and runs off
  interact(m, from, held) {
    const give = [], take = [];
    if (held === BUCKET && m.spec.milk) {
      take.push([BUCKET, 1]); give.push([MILK_BUCKET, 1]);
      this.sound?.mob(m.kind, 0.8);
      this.sound?.splash(false);
      return { give, take, said: '' };
    }
    if (held === BUCKET && m.kind === 'newt') {
      if (m.slimeFor > 0) return { give, take, said: 'This newt needs time to make more slime' };
      m.slimeFor = SLIME_SECONDS;
      take.push([BUCKET, 1]); give.push([SLIME_BUCKET, 1]);
      m.state = 'flee'; m.timer = rand(1.5, 2.5);
      this.sound?.mob(m.kind, 1, true);
      return { give, take, said: '' };
    }
    if (m.spec.trader) return { give, take, said: '', trade: true };
    if (m.spec.breeds?.includes(held) && (!m.spec.tames || m.tame)) {
      const said = this.feed(m);
      if (said) return { give, take, said };
      take.push([held, 1]);
      this.sound?.mob(m.kind, 0.9);
      return { give, take, said: `The ${m.kind} looks around for a mate` };
    }
    if (m.spec.tames) {
      if (m.tame) {
        if (m.spec.rideable) return { give, take, said: '', ride: true };
        m.sitting = !m.sitting;
        m.state = 'idle';
        return { give, take, said: m.sitting ? 'Your wolf sits and waits here' : 'Your wolf follows you again' };
      }
      if (m.spec.tames.includes(held)) {
        take.push([held, 1]);
        this.sound?.mob(m.kind, 0.9);
        if (Math.random() < 0.4) {
          this.setTame(m);
          return { give, take, said: m.spec.rideable ? 'The camel trusts you now: tap it to ride' : 'The wolf is your friend now: it follows you and fights night creatures. Tap it to make it stay.' };
        }
        return { give, take, said: m.spec.rideable ? 'The camel munches the wheat… and wants more' : 'The wolf gulps the fish… and eyes you warily' };
      }
    }
    this.bump(m, from);
    if (m.spec.wool && m.shornFor <= 0) {
      m.shornFor = SHORN_SECONDS;
      m.parts.shear(true);
      give.push([WOOL, Math.random() < 0.5 ? 2 : 1]);
    }
    if (m.kind === 'duck' && m.featherFor <= 0) {
      m.featherFor = FEATHER_SECONDS;
      give.push([FEATHER, 1]);
    }
    if (m.kind === 'buffalo' && !(m.hideFor > 0)) {
      m.hideFor = HIDE_SECONDS;
      give.push([HIDE, 1]);
    }
    return { give, take, said: '' };
  }

  // Breeding timers, the heart over an animal looking for a mate, and a young one growing up.
  tickBreeding(m, dt) {
    if (m.breedFor > 0) m.breedFor -= dt;
    if (m.love > 0) m.love -= dt;
    if (m.love > 0 && !m.heart) { m.heart = heartSprite(); this.scene.add(m.heart); }
    if (m.heart) {
      if (m.love > 0 && !m.dying) m.heart.position.set(m.pos.x, m.pos.y + m.spec.h * (m.baby > 0 ? 0.6 : 1) + 0.3 + Math.sin(m.love * 4) * 0.06, m.pos.z);
      else { this.scene.remove(m.heart); m.heart.material.dispose(); m.heart = null; }
    }
    if (m.baby > 0) {
      m.baby = Math.max(0, m.baby - dt);
      m.root.scale.setScalar(m.baseScale * (1 - 0.5 * m.baby / GROW_TIME));
    }
  }

  // Feed an animal what it breeds on, so it looks for a mate. Returns '' if it took it, or why it wouldn't.
  feed(m) {
    if (m.dying || !m.spec.breeds) return 'It won\'t eat that';
    if (m.baby > 0) return `This ${m.kind} is too young to have young of its own`;
    if (m.breedFor > 0) return `This ${m.kind} isn't ready to have young again yet`;
    if (m.love > 0) return `This ${m.kind} is already looking for a mate`;
    m.love = LOVE_TIME;
    return '';
  }

  // Could this animal be fed to breed now?
  canBreed(m) { return !m.dying && !!m.spec.breeds && !(m.baby > 0) && !(m.breedFor > 0) && !(m.love > 0); }

  // An animal looking for a mate heads for the nearest other of its kind that's looking too; when they meet,
  // a young one is born between them.
  seekMate(m) {
    if (m.sitting || m.state === 'flee') return;
    let best = null, bd = 10;
    for (const o of this.mobs) {
      if (o === m || o.kind !== m.kind || !(o.love > 0) || o.dying) continue;
      const d = Math.hypot(o.pos.x - m.pos.x, o.pos.z - m.pos.z);
      if (d < bd && Math.abs(o.pos.y - m.pos.y) < 3) { bd = d; best = o; }
    }
    if (!best) return;
    if (bd > m.spec.w + 0.4) {
      m.state = 'walk';
      m.timer = 0.5;
      m.heading = Math.atan2(best.pos.x - m.pos.x, best.pos.z - m.pos.z);
      return;
    }
    for (const p of [m, best]) { p.love = 0; p.breedFor = BREED_REST; p.state = 'idle'; p.timer = rand(2, 4); }
    const crowd = this.mobs.filter((o) => o.kind === m.kind && !o.dying && Math.hypot(o.pos.x - m.pos.x, o.pos.z - m.pos.z) < 8).length;
    if (crowd >= CROWD) return;
    const baby = this.spawn(m.kind, (m.pos.x + best.pos.x) / 2, Math.max(m.pos.y, best.pos.y), (m.pos.z + best.pos.z) / 2);
    baby.baby = GROW_TIME;
    baby.root.scale.setScalar(baby.baseScale * 0.5);
    if (m.tame && best.tame) this.setTame(baby);
    this.sound?.mob(m.kind, 1.3);
    this.onBred?.(baby);
  }

  setTame(m) {
    m.tame = true;
    m.state = 'idle';
    m.parts.tame?.(true);
  }

  // Pets to save: [kind, x, y, z, sitting].
  pets() { return this.mobs.filter((m) => m.tame && !m.dying).map((m) => [m.kind, +m.pos.x.toFixed(2), +m.pos.y.toFixed(2), +m.pos.z.toFixed(2), !!m.sitting]); }

  // The player hits a night creature for `amount`. It gets knocked back, flashes, and hunts the
  // player for a while (even on Peaceful). Returns its drops if that hit defeated it.
  hurt(m, amount, from) {
    if (m.dying || !m.spec.hostile) return [];
    m.hp -= amount;
    m.angry = 30;
    m.seeTimer = 0;
    m.flash = 0.25;
    let dx = m.pos.x - from.x, dz = m.pos.z - from.z;
    const len = Math.hypot(dx, dz) || 1;
    const push = m.spec.heavy ? 2 : 6;
    m.kx = (dx / len) * push; m.kz = (dz / len) * push;
    if (m.onGround && !m.spec.heavy) m.vel.y = 4;
    this.sound?.mob(m.kind, 1, true);
    if (m.hp <= 0) {
      m.dying = 0.4;
      this.sound?.poof();
      this.onDefeat?.(m);
      return m.spec.drops();
    }
    return [];
  }

  // Knock an animal back: it flashes red, hops away and runs off for a few seconds.
  bump(m, from) {
    let dx = m.pos.x - from.x, dz = m.pos.z - from.z;
    const len = Math.hypot(dx, dz) || 1;
    dx /= len; dz /= len;
    m.kx = dx * 6; m.kz = dz * 6;
    if (m.onGround || m.inWater) m.vel.y = 5;
    m.state = 'flee';
    m.timer = rand(3, 4.5);
    m.flash = 0.25;
    this.sound?.mob(m.kind, 1, true);
  }
}
