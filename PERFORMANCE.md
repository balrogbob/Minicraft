# Minicraft performance report

The question was: on mobile, with every graphics option off, the game now runs at about 40 fps. It used to run at 60 fps or more. Where did the frame time go, and what can be done about it?

This report only measures and recommends. It changes no game code.

## Summary

There are three causes, listed from largest to smallest.

1. **The world's fragment shader is the main regression (versions 46 and 47).** Every graphics feature now lives in one large shader. Each feature is switched off by a uniform, so the shader is compiled with all of its code, registers and texture slots, even when every option is off. Two measurements show this:
   - The same scene draws **19 frames** with the current build and **52 frames** with version 45, at 960×540 in the same time window.
   - A build with the dormant code removed draws **69 frames**.

   Phones are limited by fill rate and registers, so this one shader costs the most.
2. **The taller world in version 43 doubled the triangle count.** It went from 118k to 239k chunk triangles at the same view distance. About a quarter of all chunk triangles are cave and underground faces that can never be seen from the surface.
3. **CPU spikes on the main thread.** Chunk meshing takes about 7 ms per chunk on desktop, so about 20–30 ms on a phone. Meshing runs on the main thread, inside a 6 ms budget that a single chunk already exceeds. On top of that, the main loop runs about 40 separate ticks every frame. These cause stutter more than a lower average frame rate.

The biggest win is to **compile shader variants per option set**. Section 4 lists all recommendations in order.

---

## 1. Method

- **Browser:** headless Chromium driven by Playwright, rendering with SwiftShader, which is a software GPU. A software GPU makes fragment cost visible in a way that tracks a weak mobile GPU well.
- **GPU cost:** the number of frames drawn in a fixed 10 s window. A software renderer is much slower than real hardware, so treat the absolute numbers as relative, not as fps.
- **CPU cost:** a `requestAnimationFrame` wrapper times the JS in each frame. The methods on `window.minicraft` objects are wrapped to attribute that time. A CPU profile was not useful, because most of the time showed up as "(program)".
- **Older versions:** exported with `git archive` and served side by side, with the same seed, camera and settings.
- **Settings:** all graphics options off (godrays 0, clouds off, shadows off, path tracer off). The pixel ratio was pinned to 1 unless a test says otherwise. The game was unpaused before timing.

## 2. Findings

### 2.1 The fragment shader (largest cost)

The world material is a `MeshBasicMaterial` patched in `onBeforeCompile` (`addTorchLight` in `js/main.js`), with `GFX_FRAG_HEAD` and `GFX_SUN_TERM` from `js/graphics.js`. Over versions 44–47 the following features were added to it:

- shadow-map sampling
- cloud shadows (`uCloudMap`)
- the PT G-buffer output path and shine encoding (`gfxPTOut`, `gfxPTShine`)
- wet puddles with procedural `sin` noise
- derivative normals (`dFdx` / `dFdy`)
- the hand-light `pow` falloff
- caustics, leaf sway, emissive glow
- a 64-entry light array

All of these are gated with `if (uSomething > 0.)`. The GPU still has to:

- allocate registers for the worst-case path, which lowers occupancy on mobile GPUs;
- bind and declare every sampler and uniform array;
- run the work that sits outside any gate. In the current shader that includes the shine texture fetch, the puddle noise, the derivative normals and the hand-light `pow`.

**A/B frame counts, all options off, same scene:**

| Build | 960×540 | 240×136 |
|---|---|---|
| Current (v47, `10dc0a2`) | **19** | **91** |
| v45 (`ea4f59d`) | 52 | 141 |
| Current, with the PT branch removed | ~20 | – |
| Current, with voxel/shadow sampling removed | ~22 | – |
| Current, with the shaped torch light removed | ~24 | – |
| Current, with misc per-pixel extras removed | ~26 | – |
| **Current, "lean" (all dormant code removed)** | **69** | – |

Removing any one branch gives only 1–7 frames back. Removing all of them gives **3.6×**. That pattern means the cost is mostly **register pressure and occupancy from the shader's size**, not the arithmetic in any single feature.

The low-resolution column (240×136) still loses about 35%, so the per-vertex and per-draw overhead has grown too. That is mainly the larger varyings and uniform set.

### 2.2 Triangle count (version 43 taller world)

The scene metrics at the default view distance are:

| Metric | Value |
|---|---|
| Chunk triangles (solid) | 361,682 |
| …more than 6 blocks below the local surface | **95,956 (26%)** |
| Water triangles | 16,830 |
| Far-land triangles | 75,566 (65 meshes) |
| Triangles drawn in one frame after culling | 272,492 |

When the world became taller in version 43, chunk triangles went from about 118k to 239k for the same area. In that A/B test, frames fell from 154 to 117.

`World.meshChunk` / `buildChunkGeometry` (`js/world.js`) build **one solid mesh and one water mesh per 16×128×16 column**. As a result:

- Frustum culling works per whole column, so a column whose top edge is in view sends all of its cave faces to the GPU too.
- Cave interiors are never occlusion-culled.
- Every block edit re-meshes the whole column.

### 2.3 Draw calls and scene objects

| Metric | Value |
|---|---|
| Scene objects | 667 |
| Meshes | 565 |
| Visible meshes | 475 |
| …inside groups (mobs, furniture, models) | 252 |
| Draw calls per frame | 187–203 |
| Shader programs | 12 |

About 200 draw calls is fine on desktop but noticeable on mobile drivers. Most of the extra calls come from mobs and placed models made of several boxes, each box its own mesh, often with its own material.

### 2.4 CPU on the main thread

These are desktop numbers. Mid-range phones are roughly 3–4× slower.

| Situation | JS per frame |
|---|---|
| Standing still | ~5.0 ms |
| Walking (chunks loading) | 7.7 ms mean, p95 19.5 ms, max 33 ms |
| `renderer.render` | ~3 ms |
| `buildChunkGeometry`, per chunk | **~7.2 ms** |

Observations:

- **Chunk meshing runs on the main thread.** `World.update` has a 6 ms budget, but it always meshes at least one chunk, and one chunk alone takes about 7 ms. So any frame that meshes goes over budget, and on a phone that is a 20–30 ms hitch. The mesher:
  - pushes to plain JS arrays and copies them into `Float32BufferAttribute`;
  - calls `opaque()`, `lightAt()` and `skyAt()` (each a `chunkAt` lookup) up to 12 times per vertex for AO and smooth light;
  - creates new arrays for each face corner.
- **`addChunk` scans the full 16×128×16 volume** of every new chunk, and lighting propagates over the whole column.
- **The main loop runs about 40 subsystem ticks per frame** (`stepGame` and `frame()` around `js/main.js:7869`). Some of them do not need to run at 60 Hz, such as the minimap and the world-map refresh, and some allocate fresh object literals each frame, which adds GC pressure.

### 2.5 Resolution

The renderer uses `setPixelRatio(Math.min(devicePixelRatio, 1.5))`, so a phone with a DPR of 3 renders 2.25× the pixels of the CSS size. With a shader that is fill-rate bound (2.1), this multiplies the cost directly. The "Auto" preset turns features off but never lowers the resolution.

---

## 3. Why mobile went from 60+ to ~40

On a phone GPU, the shader regression in 2.1 (about 2.7× fragment cost at equal resolution) on its own explains a drop from 60 fps to the 40s, even with every option off. The extra triangles from 2.2 and the 1.5× pixel-ratio cap from 2.5 make it worse. The CPU hitches from 2.4 show up as stutter while walking, not as a lower average.

## 4. Recommendations, in priority order

Effort: **S** about a day, **M** a few days, **L** a week or more.

| # | Change | Expected impact | Effort |
|---|---|---|---|
| 1 | **Compile shader variants by defines.** Gate each feature (`USE_SHADOWS`, `USE_CLOUDS`, `USE_PT_OUT`, `USE_WET`, `USE_HAND_LIGHT`, `USE_CAUSTICS`…) with `#ifdef` rather than a uniform. Add the active set to `customProgramCacheKey`, and set `material.needsUpdate` when settings change. Only the variants that are actually used get compiled. | Brings the all-off case back to v45 levels or better: **2.5–3.5×** fragment throughput in testing, which is likely enough on its own for 60 fps on mobile. | M |
| 2 | **Move work that runs in every variant behind those defines.** That covers the shine-texture fetch, the puddle `sin` noise, the `dFdx`/`dFdy` normals and the hand-light `pow`. Shrink the light array (64 → 8–16 for the raster path) and keep 64 only in the PT variant. | Part of #1's gain. It also helps when *some* options are on. | S |
| 3 | **Give the path-tracer G-buffer output its own material** (or `onBeforeRender` swap) instead of a branch in the main world shader. | Removes the largest dormant block; keeps PT code from regressing raster performance again. | S–M |
| 4 | **Lower the pixel ratio on mobile.** Default to 1.0, or use dynamic resolution that scales the render size from measured frame time. Let "Auto" lower the resolution before it turns features off. | Up to about 2× fill rate on high-DPR phones. | S |
| 5 | **Split chunk columns into 16-high sections** (eight per column). Mesh, frustum-cull and re-mesh per section. Skip sections that are completely solid or completely air. | Fewer triangles drawn, from finer culling, and edits re-mesh about one-eighth as much. | M |
| 6 | **Cull caves you can't see.** Do a per-section connectivity flood fill (the usual "which faces of this section can see each other" visibility graph), walked from the camera's section each frame. | Removes most of the 26% underground triangles while on the surface, and the surface while in caves. | M–L |
| 7 | **Move chunk meshing (and generation/lighting) to a Web Worker** using transferable typed arrays. Before that, speed up the mesher: preallocate `Float32Array`s, cache neighbour chunk refs for the 3×3 area instead of calling `chunkAt` per sample, and drop per-face allocations. | Removes the 20–30 ms walking hitches on mobile; a 2–3× faster mesher even without a worker. | M (typed arrays S) |
| 8 | **Scale the main-thread budget to the device.** Use about 3 ms on mobile, and don't force one mesh per frame when the dirty chunk is not near the player. | Smoother frame pacing. | S |
| 9 | **Throttle ticks that don't need 60 Hz.** Run the minimap, world map, ambient sound, mob AI far from the player, and UI text updates at 5–15 Hz, staggered across frames. Remove per-frame object literals and closures from the hot path. | 1–2 ms less CPU per frame; less GC. | S |
| 10 | **Cut draw calls for mobs and models.** Merge each model's boxes into one geometry with a shared atlas material. Instance repeated furniture and decor. Hide mobs and models beyond a distance, or show them at lower detail. | Draw calls from about 200 to under 100. | M |
| 11 | **Lower far-land detail.** Use coarser LOD rings with distance and merge far-land tiles into fewer meshes. | Most of the 75k far-land triangles and about 60 draw calls. | M |
| 12 | **Add a debug perf overlay** (fps, ms, draw calls, triangles, programs from `renderer.info`) behind a key, so regressions like 2.1 get caught when they land. | Prevents a repeat. | S |

**Suggested order:** do 1–4 first. They are mostly confined to `js/graphics.js` and the world-material setup in `js/main.js`, and together they should restore mobile to 60 fps with options off. Then do 7–9 for smoothness, and 5, 6, 10 and 11 to gain headroom for the newer effects.

## 5. Reproducing

The measurement scripts are not part of the repo. To repeat the tests:

1. Serve two builds side by side, one exported with `git archive <rev>` and the current tree.
2. Open each in Playwright with the same seed and camera position and set all graphics options off.
3. Close the menu to unpause, then count `requestAnimationFrame` callbacks over 10 s at 960×540 and 240×136.

For the scene metrics, read the following after a few seconds of loading:

- `renderer.info.render.calls` and `renderer.info.render.triangles`
- `renderer.info.programs.length`
- the scene traversal: object, mesh and visible-mesh counts.
