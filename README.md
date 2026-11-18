# Minicraft

A small block-building game for the browser, built with [three.js](https://threejs.org/).
It is designed for Android tablets (touch controls) but also plays with keyboard and mouse.

- A 16,384 × 16,384 block world (64 high) that streams in around you as you explore: hills, lakes and seas,
  beaches, trees, winding caves, coal and ten metal and mineral ores. You start in the middle; the edges are walls
- Trees: chop the bottom of a trunk with an axe and the whole tree comes down (by hand you only get one log).
  Leaves with no trunk nearby wither away over a few seconds, sometimes dropping **saplings** and sticks.
  Plant a sapling on grass or dirt and it grows into a new tree in a few minutes
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
- Fishing: cast a fishing rod onto a lake or the sea and wait. When the bobber plunges and splashes,
  tap quickly to reel in a fish. Raw fish is a small snack; bake it in the oven for a proper meal
- Cooking: grind wheat into flour and sugar cane into sugar with a mortar and pestle, churn yak milk into
  butter, then bake bread, cookies and cake
- Mining and metalwork: iron, copper, tin, lead, zinc, sulphur, bauxite (aluminium), silver, gold and,
  deep down, tungsten. Smelt ores into ingots and alloys (bronze, aluminium bronze, steel, stainless steel,
  electrum), and make better tools as you go. Each tier of pickaxe opens up the next ores
- Water power: pour water from a bucket so it runs downhill, and set a **water wheel** in the flow. Shafts
  and gears carry its turning to a **rock crusher**, which crushes ore into dust that smelts into twice the
  metal. Gear up for more speed, add wheels for more power, and use stone or stainless steel parts for big
  networks
- Gravel (with flint) and clay on lake and sea beds: fire clay bricks, a faster **blast smelter**, flint arrows
- More machines for the water-power network: a **millstone**, **mechanical saw**, **trip hammer**, **bellows**,
  a **pump** with lead pipes and spouts, a tunnelling **drill**, **filament lamps**, and **conveyor belts** and
  **hoppers** to carry things between them. **Windmills** give power anywhere high up
- Chests, ladders, scaffolding and signs; swords and four pieces of armour in five materials
- Gunpowder from cave saltpetre, and **blasting charges** that blow out a room-sized hole
- Uses for every metal: lead sinkers and lava buckets, a gold clock and compass on the HUD, silver arrows,
  an electrum mirror lamp, tungsten drill bits and filaments
- **Rails** and **minecarts** (with slopes, curves and powered rails), and a **map** of the land around you
- **Deserts** (sand, sandstone, cactus) and snowy **tundra** (frozen water, snowy grass, yaks and alpacas),
  snow-capped peaks, and lava pools at the bottom of the deepest caves (water turns lava into obsidian)
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
| Fish (cast / reel in) | Tap with the fishing rod in hand | Right click |
| Fill a bucket / pour water | Tap still water with an empty bucket / tap a block with a full one | Right click |
| Fill a lead bucket / pour lava | Tap lava with an empty lead bucket / tap a block with a full one | Right click |
| Climb a ladder or scaffolding | Walk into it (or ⤒) to go up, back away to go down | W / S |
| Wear armour | Tap with it in hand, or put it in an armour slot in 🎒 | Right click |
| Write on a sign | Tap it (it asks as soon as you place it) | Right click |
| Light a blasting charge | Tap it, then stand well back | Right click |
| Ride a minecart | Tap it to get in, tap again to get out; forward pushes, back brakes; hold on it to pick it up | Right click / W / S |
| See how a machine is running | Tap it with nothing (or a tool) in hand | Right click |
| Shoot the bow | Hold to draw, release to shoot (tap: quick shot) | Hold and release left button (right click: quick shot) |
| Jump / swim up | ⤒ button (auto-jump also steps up 1-block ledges) | Space |
| Select item | Tap a hotbar slot | 1–9 / mouse wheel |
| Inventory & crafting | 🎒 button | E |

You aim with the crosshair in the middle of the screen. Volume, look speed and auto-jump are in the ☰ menu.

## How to progress

1. Hold on a tree trunk to collect **logs**. Once you have an axe, cutting the bottom log fells the whole tree.
2. Open 🎒 and craft **planks**, then **sticks** and a **crafting table**.
3. Place the table. With a table nearby (or after tapping one), you can craft wooden tools.
4. Stone needs a **pickaxe** to drop cobblestone. Use cobblestone to craft stone tools and stone bricks.
5. Mine **coal ore** for coal, or smelt logs into **charcoal**, which works anywhere coal does.
   Copper, tin, zinc, bauxite, lead and sulphur can be mined with a stone pickaxe; see **Ores and metals** below.
6. Build a **smelter** (8 cobblestone) to make **glass** from sand and **stone** from cobblestone, and an
   **oven** (6 cobblestone + 2 sand) to bake. Both burn logs, planks, sticks, coal, charcoal or slime fuel.
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
| Fishing Rod | 3 sticks + 2 wheat string | crafting table |
| Raw Fish (2 food) | catch with the fishing rod | — |
| Baked Fish (6 food) | 1 raw fish | oven |
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

### Trees

- With any axe in hand, breaking a log brings down every log joined to it above (up to 64), and they all go
  into your inventory. It only works on trees, meaning logs that touch leaves, so log walls and pillars you
  build are safe. By hand, or with any other tool, you only get the one log.
- Leaves need a log within 4 blocks, counting through other leaves. When a tree is cut, its leaves wither
  one by one over a few seconds. Each withered or broken leaf block has about an 8% chance to drop a
  **sapling** and a 12% chance to drop a stick. You collect these if you're within 16 blocks.
- Plant a sapling on top of grass or dirt. It grows into a tree after about 2½ minutes on average, but only
  while its chunk is loaded and only if there's room above it for the trunk. If the block under a sapling is
  broken, the sapling goes back to your inventory.

### Fishing

Hold a fishing rod and tap while looking at water to cast the bobber (it flies in an arc, so aim a little
high to reach further). After a while a fish bites: the bobber dips under and splashes. Tap within about a
second to reel it in; too slow and it gets away, and you wait for the next one. Tap at any other time to reel
in empty. The line reels itself in if you put the rod away or walk too far off.

### Ores and metals

Ores sit in small veins in the stone; the deeper you dig, the rarer and more valuable they get.
Without a good enough pickaxe an ore breaks slowly and drops nothing.

| Ore | Found at (Y) | Pickaxe needed | Smelts into |
| --- | --- | --- | --- |
| Bauxite | 16–56 | stone | aluminium ingot |
| Copper ore | 8–50 | stone | copper ingot |
| Tin ore | 6–40 | stone | tin ingot |
| Zinc ore | 6–40 | stone | zinc ingot |
| Lead ore | 4–34 | stone | lead ingot |
| Sulphur ore | 2–26 | stone | crush it for 2 sulphur (it can't be smelted) |
| Iron ore | 4–44 | copper-class | iron ingot |
| Silver ore | 2–22 | iron-class | silver ingot |
| Gold ore | 1–16 | iron-class | gold ingot |
| Tungsten ore | 1–9 (deep) | stainless steel | tungsten ingot |

Alloys, made in the smelter (coal or charcoal here is an ingredient, not the fuel):

| Alloy | From |
| --- | --- |
| 4 Bronze ingots | 3 copper + 1 tin |
| 4 Aluminium bronze ingots | 1 aluminium + 3 copper |
| 2 Electrum ingots | 1 silver + 1 gold |
| 1 Steel ingot | 1 iron + 1 coal or charcoal |
| 2 Stainless steel ingots | 1 zinc + 1 iron + 1 coal or charcoal |

Metal tools are made at a crafting table like stone ones: pickaxe or axe = 3 ingots + 2 sticks,
shovel = 1 ingot + 2 sticks. Their recipes show up once you carry that metal.

| Tier | Materials | Mines |
| --- | --- | --- |
| Wood | planks | stone, coal |
| Stone | cobblestone | + copper, tin, zinc, bauxite, lead, sulphur |
| Copper-class | copper, tin, zinc, aluminium (a little better than stone); bronze, aluminium bronze (better still) | + iron |
| Iron-class | iron; steel (better) | + silver, gold |
| Stainless steel | stainless steel | + tungsten |
| Tungsten | tungsten (the fastest) | anything |

Better tools also dig faster and hit night creatures harder.

### Oven and smelter

Tap one to open it, then move ingredients and fuel in from your inventory (tap a slot, then another).
While it has fuel and ingredients it keeps cooking, a batch at a time; tap the result to collect it.
Each piece of fuel cooks a set number of items (an oven batch counts as one): log or planks 1, stick ½,
coal or charcoal 10, slime fuel 40, lava bucket 100 (their empty buckets are left in the fuel slot). Fuel is only used while
something is cooking, so whatever's left of a piece waits for the next job.

| Station | Makes |
| --- | --- |
| Oven (6 cobblestone + 2 sand) | bread, cookies, cake, baked fish (see Food above), clay ball → brick, buffalo hide → leather |
| Smelter (8 cobblestone) | cobblestone → stone, sand → glass (flint dust + sand → 2 glass), log → charcoal, ores and ore dust → ingots, alloys (see above), clay ball → brick, fire clay → fire brick |
| Blast smelter (smelter + 8 fire bricks) | everything the smelter does, twice as fast on the same fuel |
| Rock crusher | see **Water power and the rock crusher** below; no fuel, it's driven by a water wheel |
| Millstone, saw, trip hammer | see **More machines** below |

Bellows turned by a shaft and blowing into an oven, smelter or blast smelter make it work 1.5x as fast.
 The hunger bar holds 20 points (ten loaves).

### Gravel, flint and clay

**Gravel** lies in patches on lake and sea beds and in pockets in the rock; **clay** lies in the shallows.
Both need a shovel. Gravel sometimes drops **flint** instead (about 1 in 10), and clay breaks into 4
**clay balls**.

| Recipe | Where | Makes |
| --- | --- | --- |
| 3 gravel | 🎒 | 1 flint |
| 1 flint + 1 stick + 1 feather | crafting table | 4 arrows |
| 4 clay balls | 🎒 | 1 clay block |
| 1 clay ball | oven or smelter | 1 brick |
| 4 bricks | crafting table | 1 bricks block |
| 2 clay dust + 2 flint dust | 🎒 | 4 fire clay |
| 1 fire clay | smelter | 1 fire brick |
| 4 fire bricks | crafting table | 1 fire bricks block |
| 1 smelter + 8 fire bricks | crafting table | 1 blast smelter |
| 4 clay dust + 1 water bucket | 🎒 | 4 clay balls (and the bucket back) |

Flint dust and clay dust come from the rock crusher (below).

### Water power and the rock crusher

**Flowing water.** Fill a wooden bucket from still water (the sea refills behind it) and tap a block to
pour it out. Poured above sea level, it's a source: it falls straight down over edges, and on a floor
spreads out up to 7 blocks, lower the further it runs. Take the source back up with a bucket and the flow
drains away. Water at or below sea level just fills the hole, as before.

**Parts** (all at a crafting table):

| Part | Recipe |
| --- | --- |
| Water wheel | 8 planks + 4 sticks |
| Shaft (×4) | 2 planks / 2 stone / 2 stainless steel ingots |
| Small gear | 1 shaft + 4 planks / stone / stainless steel ingots (same material) |
| Large gear | 1 small gear + 4 more of the same material |
| Rock crusher | 3 bronze ingots + 4 cobblestone + 1 wooden large gear + 1 wooden small gear |

**Placing.** A part's axle points out of the face you tap. Tap the side of another part and the new one
lines up with it instead, so gears sit side by side. A water wheel's axle is always level.

**How they connect:**
- Shafts, gears and wheels join end to end along their axles.
- Two small gears side by side (on parallel axles) mesh, at the same speed.
- A large gear meshes with a small gear set **one block diagonally** from it across the axle. The small
  gear turns **twice as fast** as the large one; drive the small one and the large one turns at half speed.
- A shaft, gear or wheel whose axle points into a face of the rock crusher drives it.

**Power.** A water wheel turns at 1x while flowing (not still) water touches it above, below or at the
sides of its rim, and gives 8 power. The crusher takes 4 power for each 1x of speed. So:

| Setup | Crusher speed | Time per ore |
| --- | --- | --- |
| 1 wheel, no gearing (or 2 crushers at 1x) | 1x | 8 s |
| 1 wheel, geared up once | 2x | 4 s |
| 2 wheels, geared up twice | 4x | 2 s |
| 4 wheels, geared up three times | 8x | 1 s |

One network can drive several crushers if there's enough power. Wheels in one network must turn at the
same speed relative to each other.

**Materials.** Each shaft and gear can carry a limited load: wooden 16, stone 64, stainless steel 256.
The weakest part sets the limit for its whole network. Too much load (more than the wheels give, or more
than the weakest part can carry) and the whole network stops. The crusher's panel says why.

**What it crushes** (times at 1x):

| Input | Output |
| --- | --- |
| Any metal ore | 2 ore dust (12 s for tungsten), each of which smelts into 1 ingot |
| Sulphur ore | 2 sulphur |
| Cobblestone | 1 gravel |
| Gravel | 1 sand |
| Flint | 2 flint dust |
| Brick | 2 clay dust |
| 2 sandstone | 1 saltpetre (6 s) |

### More machines

Machines are driven like the crusher, by a shaft, gear or wheel whose axle points into any face. Each
one adds a load for each 1x of its speed. Tap one (with nothing in your hand, or a tool) to see how
it's running.

| Machine | Recipe (crafting table) | Load | What it does |
| --- | --- | --- | --- |
| Millstone | 4 stone + 1 stone small gear | 2 | wheat → flour (3 s), sugar cane → 2 sugar, coal or charcoal → 2 coal dust |
| Mechanical saw | 1 iron plate + 3 planks + 1 wooden small gear | 3 | log → 6 planks (3 s), plank → 3 sticks (2 s) |
| Trip hammer | 3 iron ingots + 3 logs + 1 wooden large gear | 4 | ingot → plate (6 s; bronze, iron, steel, stainless, copper), tungsten ingot → 4 filaments (10 s) |
| Bellows | 4 planks + 2 leather + 1 wooden shaft | 2 | the oven or smelter it blows into works 1.5x as fast |
| Pump | 4 lead ingots + 1 stone small gear + 1 lead pipe | 6 | beside still water, sends it through lead pipes; each spout joined to them pours a water source below it (stop the pump and the water goes back) |
| Drill | 1 tungsten drill bit + 3 steel ingots + 1 stone small gear | 6 | digs out the first block in front of it (or below, if placed looking down), up to 32 blocks away, and passes what it digs into whatever is behind it |
| Filament lamp | 1 glass + 1 tungsten filament + 2 copper ingots | 1 | glows brighter than any lamp while it's turning, with no fuel |
| Conveyor belt (×6) | 3 leather + 2 wooden shafts | ½ each | carries things along to what its end points at; a line of belts runs off one drive |

Lead pipes (1 lead ingot → 4) join up whichever way they touch; a spout is 2 pipes. A **hopper**
(3 iron plates + 1 chest) needs no power. It takes things one at a time out of the chest above it, or the
output of the machine above it, and passes them on to the chest, machine, belt or hopper it points at.
Pointing down into a machine, it fills the ingredients; from the side, it fills the fuel. Drills and
belts hand things on the same way.

A **windmill** (4 wool + 6 planks + 4 sticks) is a power source like a water wheel. It needs the eight
cells around its hub clear. It gives 1 power at sea level, a point more for every 5 blocks higher, up to 6.

### Storage, ladders and signs

| Make | Recipe (crafting table) |
| --- | --- |
| Chest (18 slots) | 8 planks |
| Iron-banded chest (36 slots) | 2 chests + 2 iron plates |
| 3 Ladders | 7 sticks |
| 4 Scaffolding | 6 sticks + 1 wheat string |
| 3 Signs | 6 planks + 1 stick |

A chest's panel has buttons to put your whole backpack in (not the hotbar) or take everything out.
Ladders hang on the side of a block. Tap a ladder with more ladders, or scaffolding with more scaffolding,
to build the column higher. Breaking a scaffold brings down the whole tower above it. You don't take fall
damage while climbing. Signs go on a wall or on top of a block; tap one to rewrite it.

### Weapons and armour

Swords are 2 of the material + 1 stick: wooden (5 damage), stone (7), and every metal (8 plus the metal's
bonus, up to 13 for tungsten). They swing faster than other tools.

Armour comes in four pieces. Each point of armour takes 4% off the damage creatures (and blasts) do,
up to 80%. **Leather** is buffalo hide (tap a buffalo now and then) cured in the oven. **Plates** are
2 ingots at a crafting table, or 1 ingot in the trip hammer.

| Piece | Leather | Metal | Points: leather / bronze / iron / steel / stainless |
| --- | --- | --- | --- |
| Helmet | 5 leather | 3 plates + 1 wool | 1 / 2 / 2 / 3 / 3 |
| Chestplate | 8 leather | 5 plates + 2 wool | 3 / 4 / 6 / 7 / 8 |
| Leggings | 7 leather | 4 plates + 2 wool | 2 / 3 / 5 / 6 / 6 |
| Boots | 4 leather | 2 plates + 1 wool | 1 / 1 / 2 / 3 / 3 |

### Gunpowder and blasting

**Saltpetre** crusts the stone where caves (and cliffs) open up: mine it with a stone pickaxe. The rock
crusher also gets a little out of desert sandstone.

| Make | From | Where |
| --- | --- | --- |
| 4 Gunpowder | 2 saltpetre + 1 sulphur + 1 coal or charcoal, with the mortar | anywhere |
| 2 Blasting charges | 4 gunpowder + 1 clay ball + 1 wheat string | crafting table |

Place a charge and tap it to light the fuse: 3 seconds later it blows a round hole about 5 blocks across.
Three quarters of what it breaks comes to you (as if dug with an iron pickaxe) if you're within 24 blocks.
Charges in the blast go off too. Chests, machines, furniture, obsidian and bedrock are blast-proof. Stand
well back: the blast hurts anyone within about 5 blocks.

### Lead, gold, silver, electrum and tungsten

| Make | Recipe (crafting table) | Use |
| --- | --- | --- |
| 4 Lead sinkers | 1 lead ingot | add one to a fishing rod (anywhere) for a **weighted rod**: fish bite twice as often |
| Lead bucket | 3 lead ingots | scoops up lava. A lava bucket burns for 100 in a smelter and gives the bucket back |
| Gold clock | 4 gold ingots + 1 glass | carried anywhere, the time shows next to your coordinates |
| Compass | 2 iron + 2 copper ingots + 1 glass | carried anywhere, shows which way you face and how far home is |
| 4 Silver arrows | 4 arrows + 1 silver ingot | twice the damage to night creatures; the bow uses them first |
| Mirror lamp | 1 lamp + 2 electrum ingots | burns slime fuel like a lamp, but lights a much wider area |
| Tungsten drill bit | 2 tungsten ingots + 1 steel ingot | for the drill |

### Rails, minecarts and maps

| Make | Recipe (crafting table) |
| --- | --- |
| 16 Rails | 6 iron ingots + 1 stick |
| 6 Powered rails | 4 gold + 2 iron ingots + 1 stick |
| Minecart | 5 iron ingots |
| 3 Paper | 3 sugar cane |
| Map | 4 paper + 1 compass |

Rails lie on top of blocks and bend to join the rails beside them, so lay them in the order you want them
joined. A rail placed beside a rail one block higher (or lower) becomes a slope. Tap a rail holding a
minecart to set one down, tap the cart to get in, and hold forward to push off. Carts roll on by
themselves, slow gently, speed up downhill and roll back if they can't make it up a slope. A
**powered rail** turned by a shaft (from below or from the side) pushes carts along at up to 10 blocks a
second. One that isn't turning is a brake. Hold on a cart to pick it up.

Hold a **map** to see the land 64 blocks around you from above, with you as an arrow (north is up) and
home as a red dot.

### Biomes, lava and obsidian

Away from the temperate middle lands lie **deserts** and **tundra**. Deserts are deep sand over
sandstone, with cactus (it hurts to touch) and no trees. Tundra is snowy grass with few trees and frozen
lakes and seas: break ice and it melts back into water. Yaks and alpacas graze the snow. Peaks above
height 46 are capped with snow everywhere.

The deepest caves (below height 7) are flooded with **lava**, which glows and burns anyone who falls in.
Water poured onto lava, or lava onto water, cools into **obsidian**: very hard, blast-proof, and only
mined with a stainless steel pickaxe or better.

Worlds saved before version 17 load as they were. Parts of the world you haven't changed are generated
afresh, so new biomes, saltpetre and lava pools can appear there.

## Code layout

| File | Purpose |
| --- | --- |
| `js/blocks.js` | Block & item definitions, break times, drops, recipes |
| `js/textures.js` | Procedural texture atlas, item icons, break cracks |
| `js/terrain.js` | Chunk-by-chunk terrain generation (every block is a pure function of seed and position) |
| `js/world.js` | Chunk streaming, sunlight and torch light propagation across chunks, chunk meshing (face culling + AO + smooth light, separate water mesh), water flow, raycasting |
| `js/store.js` | Saving edited chunks to IndexedDB (16 bits per block; older one-byte chunks are widened as they load) |
| `js/legacy.js` | The old 128 × 128 generator, used once to migrate old saves |
| `js/player.js` | Player physics, collision and swimming |
| `js/mobs.js` | Animals and night creatures: box models, behaviour and hunting, physics, spawning, difficulty |
| `js/arrows.js` | Arrows and thorns: flight, hits, sticking in blocks, pick-up |
| `js/fishing.js` | Fishing: the bobber's cast, bites and the line |
| `js/stations.js` | Ovens, smelters, blast smelters, chests and the shaft-driven machines that make things: their contents, fuel, recipes and cooking |
| `js/kinetics.js` | Water wheels, windmills, shafts and gears: power networks, gear ratios, load, and the turning models |
| `js/machines.js` | Pumps and pipes, drills, filament lamps, hoppers and conveyor belts |
| `js/carts.js` | Minecarts: rolling along rails, slopes and powered rails, riding |
| `js/signs.js` | Sign text and the panels that show it |
| `js/minimap.js` | The map you hold: the land drawn from above |
| `js/sky.js` | Day/night cycle: sky colour, fog, sun, moon, stars, world brightness |
| `js/sound.js` | Web Audio sound effects |
| `js/controls.js` | Touch joystick / look / tap / hold, plus desktop input |
| `js/inventory.js` | 36-slot inventory |
| `js/main.js` | Rendering, game loop, HUD, crafting UI, saving |
