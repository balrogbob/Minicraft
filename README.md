# Minicraft

A small block-building game for the browser, built with [three.js](https://threejs.org/).
It is designed for Android tablets (touch controls) but also plays with keyboard and mouse.

- Procedurally generated 128×128×64 world with hills, sand flats, trees and coal ore
- Break and place blocks, with break times that depend on the tool you hold
- Recipe-based crafting: some recipes need a crafting table nearby
- Pixel-art textures are all generated in code at startup, with no image files
- Ambient-occlusion lighting on the voxel meshes
- The world auto-saves to the browser's local storage

## Running it

It is a static site, so there is no build step. Serve the folder over HTTP (ES modules don't load from `file://`):

```sh
python3 -m http.server 8000
# then open http://<your-computer's-ip>:8000 on the tablet (same Wi-Fi)
```

To play anywhere, host it on any static host, for example GitHub Pages
(Settings → Pages → deploy from a branch). three.js is vendored in `js/lib/`, so the game needs no CDN.

On Android Chrome, use **⋮ → Add to Home screen** to get a fullscreen, landscape app icon.

## Controls

| Action | Touch | Keyboard / mouse |
| --- | --- | --- |
| Move | Drag on the left side of the screen (floating joystick) | WASD |
| Look | Drag on the right side | Mouse (click to capture) |
| Break | Hold your finger still on the right side | Hold left button |
| Place / use crafting table | Tap on the right side | Right click |
| Jump | ⤒ button (auto-jump also steps up 1-block ledges) | Space |
| Select item | Tap a hotbar slot | 1–9 / mouse wheel |
| Inventory & crafting | 🎒 button | E |

You aim with the crosshair in the middle of the screen.

## How to progress

1. Hold on a tree trunk to collect **logs**.
2. Open 🎒 and craft **planks**, then **sticks** and a **crafting table**.
3. Place the table. With a table nearby (or after tapping one), you can craft wooden tools.
4. Stone needs a **pickaxe** to drop cobblestone. Use cobblestone to craft stone tools and stone bricks.
5. Mine **coal ore** for coal. Combine it with sand at a table to make **glass**.

## Code layout

| File | Purpose |
| --- | --- |
| `js/blocks.js` | Block & item definitions, break times, drops, recipes |
| `js/textures.js` | Procedural texture atlas, item icons, break cracks |
| `js/world.js` | Terrain generation, chunk meshing (face culling + AO), raycasting |
| `js/player.js` | Player physics and collision |
| `js/controls.js` | Touch joystick / look / tap / hold, plus desktop input |
| `js/inventory.js` | 36-slot inventory |
| `js/main.js` | Rendering, game loop, HUD, crafting UI, saving |
