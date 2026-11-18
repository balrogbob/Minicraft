# Minicraft

A small block-building game for the browser, built with [three.js](https://threejs.org/).
It is designed for Android tablets (touch controls) but also plays with keyboard and mouse.

- A 16,384 × 16,384 block world (64 high) that streams in around you as you explore: hills, lakes and seas,
  beaches, trees, winding caves and coal ore. You start in the middle; the edges are walls
- Adjustable view distance (48–160 blocks) and an on-screen coordinates readout
- Water you can swim in. It flows into holes you dig next to it, as long as they're at or below sea level
- Day/night cycle (12 minutes) with sunrise and sunset skies, sun, moon and stars
- Sunlight: open ground is fully lit, while overhangs, tunnels and caves fade into darkness even at noon.
  Leaves and water dim the light a little, so it's shadier under trees and deeper in lakes
- Animals: ducks paddle on lakes and waddle along shores, buffalo graze the plains in herds, alpacas
  roam the hills, and little newts scurry around near water. Tap one to bump it and it runs off;
  bumping an alpaca shears it for **wool** (its coat grows back after a couple of minutes)
- Torches that light up the area around them with a warm, flickering glow. They stand on floors or hang on walls
- Synthesised sound effects for digging, breaking, placing, footsteps and splashing, with no audio files
- Break and place blocks, with break times that depend on the tool you hold
- Recipe-based crafting: some recipes need a crafting table nearby
- Pixel-art textures are all generated in code at startup, with no image files
- Ambient-occlusion lighting on the voxel meshes
- The world auto-saves in the browser. Only chunks you've changed are stored (in IndexedDB); everything
  else regenerates from the world's seed. Worlds from the earlier 128 × 128 version are moved,
  builds and all, into the middle of the big world the first time you open the new version

## Running it

It is a static site, so there is no build step. Serve the folder over HTTP (ES modules don't load from `file://`):

```sh
python3 -m http.server 8000
# then open http://<your-computer's-ip>:8000 on the tablet (same Wi-Fi)
```

To play anywhere, host it on any static host, for example GitHub Pages
(Settings → Pages → deploy from a branch). three.js is vendored in `js/lib/`, so the game needs no CDN.

On Android Chrome, use **⋮ → Add to Home screen** to get a fullscreen, landscape app icon.

When hosted over https, a small service worker (`sw.js`) makes the browser fetch the latest game files
every time you're online (so updates aren't hidden by the browser cache) and lets the game load offline.
The version number is shown at the bottom of the ☰ menu; bump `GAME_VERSION` in `js/main.js` with each release.
☰ → **Performance info** shows FPS and how many chunks are loaded, drawn and waiting to be drawn.

## Controls

| Action | Touch | Keyboard / mouse |
| --- | --- | --- |
| Move | Drag on the left side of the screen (floating joystick) | WASD |
| Look | Drag on the right side | Mouse (click to capture) |
| Break | Hold your finger still on the right side | Hold left button |
| Place / use crafting table | Tap on the right side | Right click |
| Bump an animal (shear an alpaca) | Tap it | Left or right click |
| Jump / swim up | ⤒ button (auto-jump also steps up 1-block ledges) | Space |
| Select item | Tap a hotbar slot | 1–9 / mouse wheel |
| Inventory & crafting | 🎒 button | E |

You aim with the crosshair in the middle of the screen. Volume, look speed and auto-jump are in the ☰ menu.

## How to progress

1. Hold on a tree trunk to collect **logs**.
2. Open 🎒 and craft **planks**, then **sticks** and a **crafting table**.
3. Place the table. With a table nearby (or after tapping one), you can craft wooden tools.
4. Stone needs a **pickaxe** to drop cobblestone. Use cobblestone to craft stone tools and stone bricks.
5. Mine **coal ore** for coal. Combine it with sand at a table to make **glass**.
6. Craft **torches** from 1 coal + 1 stick (no table needed). Tap the top of a block to stand one up,
   or the side of a block to hang it on the wall. If the block a torch sits on is broken, the torch goes back to your inventory.

## Code layout

| File | Purpose |
| --- | --- |
| `js/blocks.js` | Block & item definitions, break times, drops, recipes |
| `js/textures.js` | Procedural texture atlas, item icons, break cracks |
| `js/terrain.js` | Chunk-by-chunk terrain generation (every block is a pure function of seed and position) |
| `js/world.js` | Chunk streaming, sunlight and torch light propagation across chunks, chunk meshing (face culling + AO + smooth light, separate water mesh), water flow, raycasting |
| `js/store.js` | Saving edited chunks to IndexedDB |
| `js/legacy.js` | The old 128 × 128 generator, used once to migrate old saves |
| `js/player.js` | Player physics, collision and swimming |
| `js/mobs.js` | Animals: box models, behaviour, physics, spawning by habitat |
| `js/sky.js` | Day/night cycle: sky colour, fog, sun, moon, stars, world brightness |
| `js/sound.js` | Web Audio sound effects |
| `js/controls.js` | Touch joystick / look / tap / hold, plus desktop input |
| `js/inventory.js` | 36-slot inventory |
| `js/main.js` | Rendering, game loop, HUD, crafting UI, saving |
