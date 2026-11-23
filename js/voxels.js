// v46: the world around you as a 3D picture, for tracing light through it (see "Traced lighting" in graphics.js).
//
// The picture holds the block ids of the 8 x 8 chunks around you (128 x 128 blocks, the full 128 high). It is
// addressed by world position wrapped round (x & 127, z & 127), so as you walk only the chunk columns that come
// into range get copied in, one 16 x 16 x 128 column at a time, straight from the chunk's own array (which is
// laid out the same way: x fastest, then z, then y). A column is copied again after its chunk is remeshed.
//
// A second, small picture (the palette) gives each block id its average colour and whether light passes it:
// rgb = the colour (linear), a = 128 if it blocks light + 8 x the light it gives off (0-15).
import * as THREE from 'three';
import { BLOCKS } from './blocks.js';
import { CHUNK, H } from './terrain.js';
import { chunkKey } from './world.js';
import { TILE, ATLAS_COLS } from './textures.js';

export const VOX = 128; // blocks across (and the world is H = 128 high)
const COLS = VOX / CHUNK; // chunk columns across
const PER_FRAME = 6; // chunk columns copied in each frame, nearest first

// does light stop at this block, for tracing? Full cubes do (and leaves); see-through, shaped and part blocks don't
// (the sun's shadow picture still catches those)
function blocksLight(d) {
  if (!d || d.liquid || d.model || d.shape !== 'cube' || d.slab || d.stair || d.solid === false) return false;
  return !d.transparent || d.sound === 'leaves';
}

export function makePalette(atlasCanvas) {
  const px = atlasCanvas.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, atlasCanvas.width, atlasCanvas.height).data;
  const lin = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
  const avg = new Map();
  const tileAvg = (t) => {
    if (avg.has(t)) return avg.get(t);
    const x0 = (t % ATLAS_COLS) * TILE, y0 = Math.floor(t / ATLAS_COLS) * TILE;
    let r = 0, g = 0, b = 0, n = 0;
    for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) {
      const i = ((y0 + y) * atlasCanvas.width + x0 + x) * 4;
      if (px[i + 3] < 128) continue;
      r += lin(px[i]); g += lin(px[i + 1]); b += lin(px[i + 2]); n++;
    }
    const c = n ? [r / n, g / n, b / n] : [0.5, 0.5, 0.5];
    avg.set(t, c);
    return c;
  };
  const W = 64, data = new Uint8Array(W * W * 4);
  for (let id = 1; id < Math.min(BLOCKS.length, W * W); id++) {
    const d = BLOCKS[id];
    if (!d) continue;
    const top = tileAvg(d.top), side = tileAvg(d.side);
    for (let k = 0; k < 3; k++) data[id * 4 + k] = Math.round(Math.min(1, top[k] * 0.5 + side[k] * 0.5) ** (1 / 2.2) * 255); // (stored gamma'd: 8 bits, see the shader)
    data[id * 4 + 3] = (blocksLight(d) ? 128 : 0) + Math.min(15, d.light | 0) * 8;
  }
  const tex = new THREE.DataTexture(data, W, W, THREE.RGBAFormat, THREE.UnsignedByteType);
  tex.magFilter = tex.minFilter = THREE.NearestFilter; tex.generateMipmaps = false;
  tex.needsUpdate = true;
  return tex;
}

// a 1 x 1 x 1 stand-in, so the shader's sampler always has an integer picture bound to it
export function emptyVolume() {
  const t = new THREE.Data3DTexture(new Uint16Array(1), 1, 1, 1);
  setup(t);
  return t;
}

function setup(t) {
  t.format = THREE.RedIntegerFormat; t.type = THREE.UnsignedShortType; t.internalFormat = 'R16UI';
  t.magFilter = t.minFilter = THREE.NearestFilter; t.generateMipmaps = false; t.unpackAlignment = 2;
  t.needsUpdate = true;
}

export class VoxelVolume {
  constructor(renderer) {
    this.renderer = renderer;
    this.tex = new THREE.Data3DTexture(new Uint16Array(VOX * VOX * H), VOX, VOX, H); // (x, z, y)
    setup(this.tex);
    this.tags = new Array(COLS * COLS).fill(null); // what each column of the picture holds now: 'key:rev'
    this.origin = new THREE.Vector3(); // the corner of the 8 x 8 chunks around you (x, 0, z)
    this.zero = new Uint16Array(CHUNK * CHUNK * H);
    this.ready = false;
  }

  // copy in the columns that changed, nearest first (a few each frame)
  update(world, px, pz) {
    const r = this.renderer, gl = r.getContext();
    if (!this.ready) { r.initTexture(this.tex); this.ready = true; }
    const pcx = Math.floor(px / CHUNK), pcz = Math.floor(pz / CHUNK), ocx = pcx - COLS / 2, ocz = pcz - COLS / 2;
    this.origin.set(ocx * CHUNK, 0, ocz * CHUNK);
    const todo = [];
    for (let cx = ocx; cx < ocx + COLS; cx++) for (let cz = ocz; cz < ocz + COLS; cz++) {
      const slot = (cx & (COLS - 1)) + (cz & (COLS - 1)) * COLS, c = world.chunks.get(chunkKey(cx, cz));
      const tag = c ? `${cx},${cz}:${c.rev ?? 0}` : `${cx},${cz}:-`;
      if (this.tags[slot] !== tag) todo.push([(cx - pcx) ** 2 + (cz - pcz) ** 2, slot, tag, c, cx, cz]);
    }
    if (!todo.length) return;
    todo.sort((a, b) => a[0] - b[0]);
    const glTex = r.properties.get(this.tex).__webglTexture;
    if (!glTex) return;
    r.state.activeTexture(gl.TEXTURE0);
    r.state.bindTexture(gl.TEXTURE_3D, glTex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false); gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 2); gl.pixelStorei(gl.UNPACK_ROW_LENGTH, 0); gl.pixelStorei(gl.UNPACK_IMAGE_HEIGHT, 0);
    gl.pixelStorei(gl.UNPACK_SKIP_PIXELS, 0); gl.pixelStorei(gl.UNPACK_SKIP_ROWS, 0); gl.pixelStorei(gl.UNPACK_SKIP_IMAGES, 0);
    for (const [, slot, tag, c, cx, cz] of todo.slice(0, PER_FRAME)) {
      gl.texSubImage3D(gl.TEXTURE_3D, 0, (cx & (COLS - 1)) * CHUNK, (cz & (COLS - 1)) * CHUNK, 0, CHUNK, CHUNK, H,
        gl.RED_INTEGER, gl.UNSIGNED_SHORT, c ? c.data : this.zero);
      this.tags[slot] = tag;
    }
    r.state.bindTexture(gl.TEXTURE_3D, null);
  }

  dispose() { this.tex.dispose(); }
}
