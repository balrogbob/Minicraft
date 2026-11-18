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
- Animals: ducks paddle on lakes and waddle along shores, buffalo graze the plains in herds, alpacas and
  yaks roam the hills, and little newts scurry around near water. Tap one to bump it and it runs off.
  Tapping also gathers from them: **wool** from alpacas, **feathers** from ducks, **milk** from yaks and
  **slime** from newts (the last two with an empty wooden bucket in hand)
- Health (ten hearts): falls of more than 3 blocks hurt, you can drown (watch the bubbles underwater),
  and an empty hunger bar wears you down. A well-fed player slowly heals. If you die you respawn at
  the world spawn and keep what you were carrying. Drinking a slime bucket gives you food poisoning
- Night creatures come out in the dark — on the surface at night and in caves any time, but never where
  torches light the ground. **Gloomlings** are quick shadow imps, **mossbacks** are slow, hard-hitting
  stone golems, and **thornspitters** keep their distance and spit thorns. Fight them by tapping (an axe
  hits hardest) or with the bow; they drop coal, cobblestone or arrows. Caught in daylight, they dissolve.
  Four difficulty levels in the ☰ menu: **Peaceful** (they roam but only fight back if you attack them),
  **Worrying** (easy), **Scary** (hard) and **Terrifying** (nightmare)
- Furniture for your home: beds (sleep through the night, and respawn there), tables, chairs,
  shelves, alpaca-wool carpets and curtains (tap to open or close), doors (tap to open or close), and
  lamps that burn slime fuel: each holds up to 3 units and each unit lasts a full in-game day.
  Lamps shine brighter than torches, so a lit home keeps the night creatures out
- A bow and arrows: hold to draw, let go to shoot (tap for a quick shot). Arrows stick in blocks and
  you can walk over them to pick them back up; animals they hit get bumped away
- A day counter and a hunger bar. Hunger drains as you play (faster when walking and digging);
  tap with food in hand to eat. If it runs out you're too weak to do more than stagger along
- Farming: wild wheat grows on the plains and sugar cane on shores. Ripe wheat gives seeds to replant on
  grass or dirt; sugar cane can be replanted next to water. Both grow over time
- Cooking: grind wheat into flour and sugar cane into sugar with a mortar and pestle, churn yak milk into
  butter, then bake bread, cookies and cake
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
| Tap an animal (bump, shear, pluck, milk…) | Tap it | Left or right click |
| Hit a night creature | Tap it (hold to keep swinging) | Left or right click |
| Eat (or drink a slime bucket) | Tap with food in hand | Right click |
| Sleep / open a door or curtain / fuel a lamp | Tap it | Right click |
| Shoot the bow | Hold to draw, release to shoot (tap: quick shot) | Hold and release left button (right click: quick shot) |
| Jump / swim up | ⤒ button (auto-jump also steps up 1-block ledges) | Space |
| Select item | Tap a hotbar slot | 1–9 / mouse wheel |
| Inventory & crafting | 🎒 button | E |

You aim with the crosshair in the middle of the screen. Volume, look speed and auto-jump are in the ☰ menu.

## How to progress

1. Hold on a tree trunk to collect **logs**.
2. Open 🎒 and craft **planks**, then **sticks** and a **crafting table**.
3. Place the table. With a table nearby (or after tapping one), you can craft wooden tools.
4. Stone needs a **pickaxe** to drop cobblestone. Use cobblestone to craft stone tools and stone bricks.
5. Mine **coal ore** for coal, or smelt logs into **charcoal**, which works anywhere coal does.
6. Build a **smelter** (8 cobblestone) to make **glass** from sand and **stone** from cobblestone, and an
   **oven** (6 cobblestone + 2 sand) to bake. Both burn sticks, planks, logs, coal or charcoal.
   Until you have an oven, raw **sugar cane** keeps you going: a heart of health and half a food point
   each, but eat five or more in a day and you'll get food poisoning.
7. Craft **torches** from 1 coal or charcoal + 1 stick (no table needed). Tap the top of a block to stand one up,
   or the side of a block to hang it on the wall. If the block a torch sits on is broken, the torch goes back to your inventory.

### Food

| Make | From | Where |
| --- | --- | --- |
| Wooden Bucket | 3 planks | crafting table |
| Mortar and Pestle | 3 cobblestone + 1 stick | crafting table |
| Butter Churn (placeable) | 7 planks | crafting table |
| Flour | 1 wheat, with the mortar (not used up) | anywhere |
| Sugar | 1 sugar cane, with the mortar (not used up) | anywhere |
| Milk Bucket | tap a yak holding an empty bucket | — |
| Butter | 1 milk bucket (you get the bucket back) | next to a butter churn |
| Bread (5 food) | 3 flour | oven |
| 9 Cookies (2 food each) | 3 flour + 3 sugar + 1 butter, with a milk bucket (not used up) | oven |
| Cake (12 food) | 3 flour + 3 sugar + 3 butter | oven |
| Wheat String | 1 slime bucket + 3 wheat (you get the bucket back) | anywhere |
| Arrow | 1 feather + 1 cobblestone + 1 stick | crafting table |
| Bow | 3 sticks + 3 wheat string | crafting table |
| Coal Dust | 1 coal or charcoal, with the mortar (not used up) | anywhere |
| Slime Fuel | 3 coal dust + 1 slime bucket (the fuel stays in the bucket) | anywhere |

Tap a lamp holding slime fuel to pour in one unit (you keep the empty bucket). A lamp holds 3 units,
each burning for one in-game day while that part of the world is loaded.

### Furniture (all at a crafting table)

| Make | From |
| --- | --- |
| Bed | 3 wool + 3 planks |
| Wooden Table | 3 planks + 4 sticks |
| Chair | 2 planks + 3 sticks |
| Shelf | 5 planks |
| Lamp | 1 glass + 2 cobblestone |
| 3 Carpets | 2 wool |
| Curtain | 2 wool + 1 stick |
| Door | 4 planks |

Chairs face you when you place them; doors take two blocks. Beds are two blocks long: the foot goes
where you tap and the head (with the pillow) extends away from you. Tap a bed in the evening or at
night to sleep until morning (not while a creature is lurking nearby); any tap sets it as your respawn point.

Tap a crafting table or butter churn to open crafting there.

### Oven and smelter

Tap one to open it, then move ingredients and fuel in from your inventory (tap a slot, then another).
While it has fuel and ingredients it keeps cooking, a batch at a time; tap the result to collect it.
Fuel lasts: stick 3 s, planks 8 s, log 15 s, coal or charcoal 40 s, and only burns while something's cooking.

| Station | Makes |
| --- | --- |
| Oven (6 cobblestone + 2 sand) | bread, cookies, cake (see Food above) |
| Smelter (8 cobblestone) | cobblestone → stone, sand → glass, log → charcoal |
 The hunger bar holds 20 points (ten loaves).

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
| `js/mobs.js` | Animals and night creatures: box models, behaviour and hunting, physics, spawning, difficulty |
| `js/arrows.js` | Arrows and thorns: flight, hits, sticking in blocks, pick-up |
| `js/stations.js` | Ovens and smelters: their contents, fuel, recipes and cooking |
| `js/sky.js` | Day/night cycle: sky colour, fog, sun, moon, stars, world brightness |
| `js/sound.js` | Web Audio sound effects |
| `js/controls.js` | Touch joystick / look / tap / hold, plus desktop input |
| `js/inventory.js` | 36-slot inventory |
| `js/main.js` | Rendering, game loop, HUD, crafting UI, saving |
