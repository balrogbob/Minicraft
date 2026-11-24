# Minicraft

A small block-building game for the browser, built with [three.js](https://threejs.org/). It is designed for
Android tablets (touch controls) but also plays with keyboard and mouse.

You start in the middle of a 16,384 × 16,384 block world that streams in as you explore. Chop trees, dig for
ore, farm, cook and build, then automate it all: machines driven by water, electricity and signals, item and
liquid logistics, and courier drones. Every texture and sound is made in the browser at startup, so there are no
image or audio files.

## Contents

- [Running it](#running-it) ([fancy graphics](#fancy-graphics), [playing together](#playing-together))
- [Controls](#controls)
- [Getting started](#getting-started)
- [Basics](#basics)
- [The world](#the-world)
- [Food, cooking and fishing](#food-cooking-and-fishing)
- [Farming](#farming)
- [Mining and metals](#mining-and-metals)
- [Tools, weapons and armour](#tools-weapons-and-armour)
- [Furniture, building and home](#furniture-building-and-home)
- [Water power and machines](#water-power-and-machines)
- [Electricity and reactors](#electricity-and-reactors)
- [Signals and automation](#signals-and-automation)
- [Logistics and liquids](#logistics-and-liquids)
- [Transport](#transport)
- [Animals and creatures](#animals-and-creatures)
- [Villages and trade](#villages-and-trade)
- [Survival, dungeons and exploration](#survival-dungeons-and-exploration)
- [Inventory and recipes](#inventory-and-recipes)
- [Guidebook and music](#guidebook-and-music)
- [Worlds, creative mode, the map and achievements](#worlds-creative-mode-the-map-and-achievements)
- [Recent fixes](#recent-fixes)
- [Version history](#version-history)
- [Code layout](#code-layout)

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

### Fancy graphics

The ☰ menu has extra effects for computers with a strong graphics card. They are all **off** to start
with, each has its own switch, and they are remembered between games. Turn on the ones you like, and
turn any off again if the game gets slow (☰ → Performance info shows the frame rate).

- **Sun shadows** (off / low / high): the sun casts soft shadows from blocks, trees, animals and machines within about 44
  blocks of you (and from you, in first person too). They lengthen towards evening, fade under clouds and go at night. (Torch and lamp light
  doesn't need these: it spreads block by block, so it already stops at walls.) **Low** is for mid-range
  machines: a smaller shadow picture over about 32 blocks, harder edges, redrawn every other frame.
  Sunlight through stained glass comes out coloured (see Building). On **high** a shadow's edge is sharp where
  it touches the thing casting it and grows softer the farther away it falls, as real shadows do: the top
  of a tall tower throws a blurry patch, a fence post a crisp one.
- **Torch shadows** (a slider, off or 1 to 50): the nearest few torches, lanterns, lamps and other lights
  cast shadows of their own: pillars, furniture, machines and animals standing in the light throw sharp
  shadows across the floor and walls. Lights out in the daytime sun are skipped (the sun drowns them out),
  so in the day this mostly matters indoors and underground; at night every light counts. With more than
  5 lights it looks 24 blocks around you instead of 16. **Torch shadows redrawn per frame** (1 to 50)
  sets how many lights get their shadows redrawn each frame, in turn (new lights are drawn at once):
  higher keeps shadows of moving animals smooth, lower is faster. **Torch shadows by day** counts the lights
  out in the sun too, so their shadows show in shady places by day (under roofs, in doorways).
- **Torch light shafts** (a slider, off or 1 to 50): the nearest few lights shine through the air around
  them, so you see their light hang in a dark room: beams fan out through iron bars, a doorway or a window,
  and pillars and furniture cut dark gaps through the glow. Each light takes its colour (a blue glow lamp
  gives blue beams), and a light behind stained glass sends out beams in the glass's colours. They use the same shadow pictures as torch shadows (those are drawn for the shafts'
  lights even with torch shadows off), and show best at night and underground. High lights 2, Ultra 6.
- **Traced lighting** (off / shadows and shade / full): the game keeps a 3D copy of the blocks within about
  64 blocks of you on the graphics card and follows light through it block by block. **Shadows and shade**
  gives every block an exact, sharp shadow from the sun (as far as the copy reaches, with no shadow picture
  to run out of; animals and furniture still need Sun shadows for theirs) and soft shade in corners, under
  overhangs and where blocks crowd in. **Full** adds how much of the sky each spot can see (a deep porch or
  a narrow alley is dimmer than open ground) and real reflections: metal blocks, ice, glass, obsidian and
  puddles after rain mirror the blocks around them, or the sky. It fades out towards the edge of the copy.
  This is the heaviest setting: Ultra turns on Full, the other presets leave it off.
- **Path tracing (WebGPU)** (off / on; only in browsers with WebGPU, such as recent Chrome and Edge): all the
  light is traced, the way films are made, instead of the shortcuts above. Sunlight (or moonlight) and its
  shadows, light from the sky, light bounced off the blocks around (a sunlit red wall tints the floor beside
  it, light spills round corners into a doorway) and the light of the nearest 32 torches, lanterns and lamps,
  each with its true shadow, all come from rays followed through the blocks around you. Animals, monsters,
  villagers and you are traced at their real shape, not as boxes: each is rebuilt every frame from its posed
  model as a grid of small cells (a 16th of a block), so a horse's legs cast four thin shadows while it walks,
  and your own body still casts its shadow in first person. Each frame traces every other pixel; the light of
  earlier frames is kept for the same spots and blurred along each surface, so it is grainy for a moment after
  something changes and settles while you look. It takes over the whole picture: the other settings that change
  light (shadows, torch shadows and shafts, traced lighting, colour bleed, bloom, god rays, water effects) have
  no effect while it's on. It needs a strong graphics card. If the browser has no WebGPU, or it fails, it turns
  itself off with a message. Not in any preset. Part blocks (slabs, stairs, fences, walls, panes, plants,
  torches) cast shadows at their real shape; sunlight and torch light pass through glass (stained glass colours
  it), through water (fading and turning blue-green the deeper it goes) and dappled through leaves. Lava and
  the lights within 32 blocks (in the sun or not) all light what's round them: a lava pool lights a whole cave
  orange. Metal blocks, ice, glass, obsidian, wet ground after rain and the surface of water mirror what's round
  them (metal in its own colour; water more the more slanting you look across it). Light hangs in the air:
  sunbeams through a hole in a roof or a window into a dark hall, the glow round lamps and over lava, and murkier
  under water.
- **Distance fog** (on by default): the world fades into the sky towards the edge of what's loaded. Turn it
  off for a clear view all the way out (the edge of the world then shows). Under water it's always murky.
- **Bloom**: bright things glow a little past their edges: lava, lamps, torch flames, the sky behind trees, sun
  glints.

Whatever the settings, the bright parts of things that give off light (a torch's flame, a lantern's glass, a
lamp, glowing mushrooms) glow: brighter than anything lit around them, so a torch looks lit even in full sun.
Only the parts that shine glow: the green flecks in uranium ore, not the stone around them. Blocky white clouds
drift across the sky, warm at sunrise and sunset, dim at night and grey when the weather turns.
Shiny things catch the sun: metal machines, ice, glass and obsidian show a glint where the sun reflects off
them towards you. After rain the ground stays wet for a while, and puddle patches on the open ground glint too.
- **God rays** (off / classic / volumetric): **classic** streams shafts of light out around whatever hides the
  sun when you look towards it (trees, hills, gaps in a wall); it is cheap, good for slower computers.
  **Volumetric** lights the air itself from the sun's shadow picture, so you see beams from any angle: down
  through holes in a roof, through windows into a dark hall, between trees and into cave mouths, coloured
  where they come through stained glass and broken up under passing clouds. It needs Sun shadows (with them
  off it falls back to classic). Both are strongest near sunrise and sunset. High uses classic, Ultra volumetric.
- **Cloud shadows**: the drifting clouds shade the land under them, soft-edged, moving with the wind (on from
  Medium up).
- **Swaying leaves and plants**: leaves stir and flowers, grass and crops bend in the wind (tall plants like
  sugar cane bend as one, from the root).
- **Fancy water**: moving waves, reflections of the sky that get stronger as you look across the water, and
  glints of sunlight.
- **Water reflections**: the water mirrors the hills, trees and buildings above it (the world is drawn a
  second time, upside down, at half size). Works on the water around you at the height most of it is.
- **Live mirrors**: mirror blocks show the world in front of them. Each flat wall of mirrors costs one more
  drawing of the world, at a quarter of the screen's pixels, and only the two nearest walls of mirrors in
  view are drawn. On from Medium up.
- **Colour bleed**: lit surfaces tint those beside them a little, as light bouncing off them would: a white
  floor goes pink beside a red wall, grass greens the bottom of a white house. On in High and Ultra.
- **Water refraction**: you see the bottom through the water, bent by the waves.
- **Water caustics**: rippling lines of light on blocks under sunlit water.
- **Underwater ripple**: the view wobbles gently while your head is under water.

If an effect doesn't work on your device it is switched off by itself, with a message.

**Graphics preset** at the top sets them all at once: **Off**, **Low** (water and swaying only), **Medium**
(low-cost sun shadows, 3 torch shadows, bloom, caustics, live mirrors), **High** (everything, 8 torch shadows) or **Ultra**
(24 torch shadows, more redrawn each frame). **Auto** starts at Medium and steps down a level when the game
drops below 40 frames a second, or up when it stays smooth (and won't climb back to a level that was too
slow). Changing any one effect yourself makes it **Custom**.

**Resolution**, below the preset, is how many pixels the game draws for each point of the screen. **Auto**
(the default) uses 1 on phones and up to 1.5 on computers, and draws fewer while the game is slow: down to
0.75× before the Auto preset turns any effect off, and lower only once everything is off. It goes back up
when the game is smooth again. Or pick a fixed level from 0.5× (blurry, fastest) to 2× (sharpest).

Whatever the settings, the water shows rings spreading round ducks, newts and anything else swimming,
round you as you swim, and round boats sitting still; boats leave a wake when they move; jumping in throws up
spray (more the further you fall), and now and then a duck has a splash about.

### Your character and what you hold

You see your arm and whatever you hold in it: blocks as little cubes, tools, food and everything else as
solid shapes. The arm swings as you dig, place and fight, bobs as you walk, and raises food to your mouth as
you eat. Press **V** (or the gamepad's right-stick click) to see yourself from behind or in front; your character
walks, swims and swings, and holds what you hold. ☰ → **Your character** changes skin, hair, shirt and trousers.


### Playing together

The game comes with a small server for playing in one world with friends. It needs [Node.js](https://nodejs.org)
18 or newer and nothing else (no packages to install):

```sh
node server/server.js
# Minicraft server running. Open http://localhost:8080 (or, on your network, http://192.168.1.20:8080)
```

Everyone opens that address in their browser, then ☰ → **Multiplayer…** → **Join** (the server box is
already filled in when the game comes from the server; otherwise type the server's address). You play the
server's world in a place of its own: your own worlds are left as they are, and **Leave** takes you back.
Everyone sees everyone else's character, with their name above it, walking, swimming and holding what they
hold, and every block anyone places or breaks. Press **T** (or 💬) to chat.

The host can switch **PvP** on in the Multiplayer window (it's off to start with): then players can hit each
other with whatever they hold, as they would a creature, through each other's armour and shields, and a
beating is announced in the chat. The server keeps the choice with its world.

Options: `PORT=9000` (the port), `SEED=1234` (the world's seed, for a new world), `DATA=path/world.json`
(where the world is kept; `server/world.json` by default), `MAX_PLAYERS=16`. The server saves every half
minute and when you stop it (Ctrl+C).

What's shared:

- **The time, the day and the weather.** The first player to join is the *host*: their game keeps the clock
  and the weather for everyone (if they leave, the next player takes over). The server remembers them too.
- **Chests, machines, signs and item frames.** What's in a chest or a machine, how far along it is, the writing
  on a sign and what's in a frame are the same for everyone, and kept by the server.
- **The world running by itself.** Each part of the world is run by the game of the player nearest to it:
  crops grow, leaves fall, fires spread, machines work and creatures roam there, and everyone sees the result.
  As you walk about, the parts nearest you pass to your game.
- **Creatures.** Everyone sees the same animals, villagers and night creatures in the same places. Touching one
  (a hit, feeding, shearing, riding) hands it to your game for a few seconds so what you do sticks. Your pets
  are yours: they follow you, they're saved with you, and other players can't take them.
- **Things on the ground.** Everyone sees what's dropped or thrown, and only one player gets each thing.
- **Sleep.** Lie down in a bed and you wait for the others: the night passes when everyone is in bed (move
  away to get up).

Still each player's own: your inventory, health and hunger, your pets' saved state, and things riding conveyor
belts (only the game that runs that part of the world sees those).

### Gamepad

A gamepad works too (any with the standard layout, in browsers that support them): left stick to walk,
right stick to look, **RT** break, **LT** place or use, **A** jump, **B** crouch (and closes windows),
**X** throw, **Y** inventory, **LB / RB** or the d-pad change the hotbar slot, **Back** the map, **Start** the
menu, right-stick click the view, d-pad up the guidebook, d-pad down fly (creative).

## Controls

| Action | Touch | Keyboard / mouse |
| --- | --- | --- |
| Move | Drag on the left side of the screen (floating joystick) | WASD |
| Look | Drag on the right side | Mouse (click to capture; closing a window with its ✕ captures it again) |
| Break | Double-tap and hold your finger still on the right side | Hold left button |
| Place / use crafting table | Tap on the right side | Right click |
| Tap an animal (bump, shear, pluck, milk…) | Tap it | Left or right click |
| Hit a night creature | Tap it (double-tap and hold to keep swinging) | Left or right click |
| Eat (or drink a slime bucket) | Tap with food in hand | Right click |
| Sleep / open a door or curtain / fuel a lamp | Tap it | Right click |
| Fish (cast / reel in) | Tap with the fishing rod in hand | Right click |
| Fill a bucket / pour water | Tap still water with an empty bucket / tap a block with a full one | Right click |
| Fill a lead bucket / pour lava | Tap lava with an empty lead bucket / tap a block with a full one | Right click |
| Climb a ladder or scaffolding | Walk into it (or ⤒) to go up, back away to go down | W / S |
| Wear armour | Tap with it in hand, or put it in an armour slot in 🎒 | Right click |
| Write on a sign | Tap it (it asks as soon as you place it) | Right click |
| Light a blasting charge | Tap it, then stand well back | Right click |
| Ride a minecart | Tap it to get in, tap again to get out; forward pushes, back brakes; double-tap and hold on it to pick it up | Right click / W / S |
| See how a machine is running | Tap it with nothing (or a tool) in hand | Right click |
| Open or shut a gate or trapdoor / flip a lever / press a button | Tap it | Right click |
| Put something in an item frame / take it out | Tap it with the thing in hand / tap it | Right click |
| Colour wool, carpet, glass, planks or sign writing | Tap it holding a dye | Right click |
| Repair a tool, weapon or armour | Tap an anvil holding it (with its material in your backpack) | Right click |
| Drink a tea | Tap with it in hand | Right click |
| Tame a wolf / camel | Tap it holding fish / wheat (it may take a few) | Right click |
| Ride a camel / tell a wolf to stay | Tap your tame camel (tap again to get off) / tap your wolf | Right click |
| Trade | Tap the wandering trader | Right click |
| Mark a sign or bed on the map | Tap it holding the map | Right click |
| Shoot the bow | Hold to draw, release to shoot (tap: quick shot) | Hold and release left button (right click: quick shot) |
| Jump / swim up | ⤒ button (auto-jump also steps up 1-block ledges) | Space |
| Sprint (a third faster; hungrier work, and not with 3 loaves or fewer) | Push the stick well past its rim | Double-tap W, or hold R (left stick click on a gamepad) |
| Select item | Tap a hotbar slot | 1–9 / mouse wheel |
| Inventory & crafting | 🎒 button | E |
| First / third person view | — | V |
| Chat (multiplayer) | 💬 button | T |
| Throw an item (one / the whole stack) | Hold its hotbar slot (keeps throwing while held) | Q / Shift + Q |
| Put an item on a belt or into a hopper | Tap it with the item in hand | Right click |
| World map | ☰ → World map, or tap the corner map | M |
| Fly on / off (creative) | 🕊 button | F |
| Fly up / down (creative) | ⤒ / ⤓ buttons | Space / Left Shift |
| Undo your last block change (creative) | ↶ button | Ctrl + Z |
| Photo mode (free camera, no HUD) | ☰ → 📷 Photo mode; move and look as usual, ▲ ▼ to rise and sink, 📷 to save the picture, ✕ to leave | F2 (Space / Left Shift to rise and sink, Enter or P to snap, F2 or Esc to leave) |
| Copy and paste a build (creative) | Tap two corners with the copy wand, then tap to paste; double-tap and hold to clear | Right click / hold left button |

On a touch screen, breaking needs a **double tap and hold**, so a finger resting on the look side while you
walk doesn't dig: a single tap still places or uses, a quick double tap counts as one tap, and with the bow
in hand you just hold to draw. (A tap's action waits a third of a second in case a second tap follows.) To go
back to plain hold-to-break, change ☰ → **Touch breaking**.

You aim with the crosshair in the middle of the screen. Volume, look speed, field of view and auto-jump are
in the ☰ menu, and every keyboard key above can be changed under ☰ → **Keyboard keys**.

## Getting started

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

## Basics

- **The land** is hills, lakes and seas, beaches, trees, winding caves, coal and ten metal and mineral ores. You
  start in the middle; the edges are walls. The view distance is adjustable (48–160 blocks; past it, **Distant
  land** in the settings sketches the hills, sea and mountains for another 192 blocks), with a coordinates
  readout on screen.
- **Day and night** last 12 minutes, with sunrise and sunset skies, sun, moon and stars. Open ground is fully lit,
  while overhangs, tunnels and caves fade into darkness even at noon. Leaves and water dim the light a little, so
  it's shadier under trees and deeper in lakes.
- **Water** can be swum in. It flows into holes you dig next to it, as long as they're at or below sea level.
- **Health** is ten hearts. Falls of more than 3 blocks hurt, and you can drown (watch the bubbles underwater). A
  well-fed player slowly heals. If you die you respawn at the world spawn and keep what you were carrying.
- **Hunger** drains as you play (faster when walking and digging). Tap with food in hand to eat. When it runs out
  you're too weak to do more than stagger along.
- **Animals** are around the land: ducks paddle on lakes, buffalo graze the plains in herds, alpacas and yaks roam
  the hills, and newts scurry near water. Tap one to bump it and it runs off. Tapping also gathers **wool**,
  **feathers**, **milk** and **slime** (the last two with an empty wooden bucket in hand). Drinking a slime bucket
  gives you food poisoning.
- **A bow and arrows**: hold to draw, let go to shoot (tap for a quick shot). Arrows stick in blocks and you can
  walk over them to pick them back up.
- **Torches** light up the area around them with a warm, flickering glow. They stand on floors or hang on walls.
- **Sound and look**: the sound effects are synthesised, and the textures are generated in code. Voxel meshes have
  ambient-occlusion lighting.
- **Saving**: the world auto-saves in the browser, in one of three slots. Only chunks you've changed are stored (in
  IndexedDB); everything else regenerates from the world's seed. Worlds from the earlier 128 × 128 version are
  moved, builds and all, into the middle of the big world the first time you open the new version.

## The world

### World height

The world is 128 blocks high. Worlds made since version 43 are **tall worlds**: the sea is at height 56, with
about 56 blocks of rock, caves, ore and (right at the bottom) lava under it, and mountains climb to 116, with snow
on them from height 92. Sky islands float at about 100, and clouds drift at 136.

Worlds made before version 43 are **classic worlds**: their ground stays exactly as it was (sea at 24,
mountains to 50, snow from 46), and they get 64 more blocks of room to build in above. Old save files and
exported world files load into either kind as before. In multiplayer, the server's world is tall if it was
started fresh with version 43 or later.

### Trees

- With any axe in hand, breaking a log brings down every log joined to it above (up to 64), and they all go
  into your inventory. It only works on trees, meaning logs that touch leaves, so log walls and pillars you
  build are safe. By hand, or with any other tool, you only get the one log.
- Leaves need a log within 4 blocks, counting through other leaves. When a tree is cut, its leaves wither
  one by one over a few seconds. Each withered or broken leaf block has about an 8% chance to drop a
  **sapling** and a 12% chance to drop a stick. A fruit tree's leaves drop saplings of that fruit instead of oak.
You collect these if you're within 16 blocks.
- Plant a sapling on top of grass or dirt. It grows into a tree after about 15 minutes on average, but only
  while its chunk is loaded and only if there's room above it for the trunk. If the block under a sapling is
  broken, the sapling goes back to your inventory.

### Biomes, lava and obsidian

Away from the temperate middle lands lie **deserts** and **tundra**. Deserts are deep sand over
sandstone, with cactus (it hurts to touch) and no trees. Tundra is snowy grass with few trees and frozen
lakes and seas: break ice and it melts back into water. Yaks and alpacas graze the snow. Peaks above
height 46 are capped with snow everywhere.

The deepest caves (below height 7) are flooded with **lava**, which glows and burns anyone who falls in.
Water poured onto lava, or lava onto water, cools into **obsidian**: very hard, blast-proof, and only
mined with a stainless steel pickaxe or better.

Worlds saved before version 17 load as they were. Parts of the world you haven't changed are generated
afresh, so new biomes, saltpetre and lava pools can appear there. Likewise, worlds from before version 18
grow flowers, berry bushes and dungeons in the parts you haven't changed.

### Weather

Every so often it rains for a few minutes. In the tundra it snows, and in the desert a sandstorm blows
in and closes the view right down. The sky clouds over and the day dims. Rain makes crops grow half again as fast and fills cauldrons left under the open sky.

### Storms and rainbows

- **Thunderstorms**: dark skies, thunder and **lightning**, which strikes the highest thing about and can set
  wood, leaves and wool **on fire**. Fire spreads, more slowly in the rain, and burns out. Stay under a roof.
- Up in the mountains rain falls as **hail**: it hurts unless you wear a helmet.
- When the rain stops there's often a **rainbow**, across the sky from the sun.

### Seasons, rivers, villages and bees

The year turns through **spring, summer, autumn and winter**, six days each (the season shows beside the
day). Crops grow fastest in summer and barely at all in winter; leaves turn in autumn and fall in winter,
when the grass frosts over and the rain turns to snow.

**Rivers** wind across the land. Fish in a river for **salmon**, in cold water for **icefish**, and in warm
water for **pufferfish** (which poison you if you eat them); now and then you hook junk or treasure. Bake
fish into a **fish pie** (with flour and butter) for a hearty meal.

**Villages** have houses, a well, a wheat field and a **bell** (tap it to hear the village's name).
Villagers are farmers, smiths, fishers and clerics, and each trades its own goods: tap one to trade.

**Bee hives** hang in trees. Bees fill them with honey (faster with flowers around, slower in winter) and
spread new flowers as they go. Tap a full hive holding a **glass bottle** for honey, or break it for
honeycomb. Honeycomb and a bottle in the cauldron make **honey tea**, which keeps out the cold.

Underground there are flooded caverns, caverns lit by **glowcap mushrooms** (cook three with butter in the
oven for mushroom stew) and **geodes** lined with **crystal**: break it for crystal shards.

### The sea

- In tall worlds the open sea, far from land, falls away into **deep ocean**, 40 blocks deep in places.
- Warm, shallow seas have **coral reefs**: mounds of **red, yellow, blue and pink coral** (mine it with a
  pickaxe) with **coral fans** growing on them. Meadows of **sea grass** cover the sandy bottom, and forests of
  **kelp** climb up through deeper and cooler water. Frozen seas have none.
- Coral fans, sea grass and kelp grow **underwater** only: their cell is full of water, so you swim through them
  and break them without letting the water out. Plant them on the sea bed (or kelp on top of kelp). Kelp grows
  slowly upward until it is two blocks short of the surface.
- Dry kelp on a **drying rack** to make **dried kelp**, a salty snack.
- The sea is full of life: **schools of fish** dart round the reefs (bright ones in warm water, silver in cold)
  and scatter when you swim at them; **sea turtles** paddle over warm shallows; **dolphins** swim beside you over
  the deep ocean and leap clear of the water; and **jellyfish** drift in open water, glowing at night. Don't
  touch a jellyfish: it stings.

### Caves

- Big caverns now have **stalactites** hanging from the roof and **stalagmites** rising from the floor. Watch
  out in the dark: a loose stalactite can drop on you (and one falls whenever the rock above it is dug out).
- **Cave beetles** glow softly in the deep. Tap one to collect a **glow shell**; 3 glow shells and a glass make a
  **beetle lamp**. Pale **olms** swim in underground pools, and **glow-worms** twinkle on cave ceilings.

## Food, cooking and fishing

### Food

| Make | From | Where |
| --- | --- | --- |
| Wooden Bucket | 3 planks | crafting table |
| Mortar and Pestle | 3 cobblestone + 1 stick (lasts 96 grindings; mend it at an anvil with cobblestone) | crafting table |
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

### Fishing

Hold a fishing rod and tap while looking at water to cast the bobber (it flies in an arc, so aim a little
high to reach further). After a while a fish bites: the bobber dips under and splashes. Tap within about a
second to reel it in; too slow and it gets away, and you wait for the next one. Tap at any other time to reel
in empty. The line reels itself in if you put the rod away or walk too far off.

### Bait and fish traps

- Carry **worms** when you fish and one goes on the hook. Fish bite twice as fast, and you won't catch junk.
- A **fish trap** (8 sticks, 4 string, a plank) sunk in water and baited with worms catches a fish now and
  then, sometimes a salmon.

### Cauldron and teas

A **cauldron** (5 iron or copper ingots) is filled by tapping it with a water bucket, or by leaving it out
in the rain. Tap it to open it like an oven: put in **glass bottles** (3 glass make 3) and herbs, and fuel
underneath. Every two teas use a level of water.

| Tea | Brewed from | Effect |
| --- | --- | --- |
| Night-Eye Tea | bottle + cornflower | see in the dark for 4 minutes |
| Miner's Tea | bottle + dandelion | dig half as fast again for 3 minutes |
| Fireproof Tea | bottle + poppy + cactus | lava doesn't burn you for 2 minutes |
| Healing Tea | bottle + lavender + daisy, or bottle + 3 berries | heals you quickly |

Active teas show with their time left next to your coordinates. You keep the bottle.

## Farming

### Fruit trees, the cooking pot, greenhouses and scarecrows

- Some trees in the temperate lands are **apple**, **cherry** or **orange** trees. They blossom in spring and
  fruit in summer and autumn: tap a leaf with fruit on it to pick it (apples and oranges are 4 food, cherries 3).
  Fruit leaves sometimes drop a **fruit sapling** to plant your own orchard.
- A **cooking pot** (5 iron, a log; burns fuel like an oven) makes meals that also give you a buff:
  **apple pie** (3 apples, 2 flour, sugar, an egg; warms you through), **cherry pie** (heals you), **fish soup**
  (2 fish, a water bucket; warms you), **truffle soup** (a truffle, 2 glowcaps, a water bucket; see in the dark),
  **berry jam** (6 berries, 2 sugar, a bottle; heals) and **mushroom stew**. At the crafting grid, **fruit salad**
  (one of each fruit) lets you dig faster and **orange juice** (3 oranges, a bottle) lets you run faster.
- A **greenhouse**: crops with glass over them (anywhere above, with nothing but air between) grow as well in
  winter as in spring.
- **Crows** come down by day to eat ripe wheat under the open sky, knocking it back to green shoots. A
  **scarecrow** (3 sticks, 6 wheat, a wool) keeps them off everything within 8 blocks, and they fly off if you come
  near.

### Cocoa and chocolate

**Cocoa trees** grow wild in the warmest green land, where it borders the deserts. Their pods ripen in spring,
summer and autumn (more slowly than orchard fruit) and stay on through winter. Pick them like fruit, or plant a
cocoa sapling (from their leaves) to grow your own.

| Make | From | Where |
| --- | --- | --- |
| 3 Cocoa beans | 1 cocoa pod | anywhere |
| Roasted cocoa beans | cocoa beans | oven |
| Cocoa powder | 2 roasted cocoa beans | mortar |
| 3 Chocolate milk | milk bucket + 2 cocoa powder + 1 sugar + 3 glass bottles | anywhere |
| Hot chocolate | chocolate milk | oven |
| 2 Melted chocolate | 2 cocoa powder + 1 sugar + 1 butter + 2 glass bottles | cooking pot |
| Chocolate mould | 3 tin ingots | crafting table |
| Chocolate cake | 2 chocolate bars + chocolate milk + 2 flour + egg + sugar | crafting table |
| 4 Chocolate cookies | 4 cookies + 1 cocoa powder | anywhere |
| 2 Chocolate cherries | 4 cherries + 1 chocolate bar | anywhere |

- **The chocolate mould.** Set it down and tap it holding melted chocolate to pour it in. It sets in two
  steps of about a minute each: twice as fast somewhere cold (snowy land, winter, or with ice or snow beside
  it) and half as fast beside something hot. Tap it once it's set to knock out 4 chocolate bars.
- **Chocolate bars** give you a short burst of speed. **Hot chocolate** warms you right through (and keeps the
  chill off for longer than tea). **Chocolate cherries** heal you.
- **Chocolate cake** is set down like a block: tap it to eat a slice (4 slices). Each slice fills you up a
  little and heals a heart.

### Pork and chicken

Pigs and chickens are farm animals. Hit a grown one with a sword or an axe to butcher it: a pig gives 2–3 raw
pork, a chicken 1–2 raw chicken and some feathers. Babies and tame animals are safe, and every other animal
is only ever bumped. Raw chicken can give you food poisoning, so cook it first.

| Make | From | Where |
| --- | --- | --- |
| Roast pork (8 food) / roast chicken (7) | raw pork / raw chicken | oven |
| Pork pie (14 food; keeps you full) | 2 raw pork + 2 flour + 1 butter | oven |
| Chicken soup (10 food; heals, cures food poisoning) | raw chicken + carrot + onion + water bucket | cooking pot |
| Pork and beans (12 food; warms you) | raw pork + 3 beans + tomato | cooking pot |

### Dairy and preserving

- **Cream.** Spin a milk bucket in the comb centrifuge for 2 cream. A cream churns into 2 butter.
- **Ice cream and lollies.** The freezer makes **chocolate**, **cherry** and **honey ice cream** (cream with
  sugar and cocoa powder, sugar and 2 cherries, or 2 honey drops) and **ice lollies** (any juice and a stick).
  They cool you down: no heatstroke in the desert while it lasts.
- **Vinegar.** Fruit juice left in an urn sours into vinegar after a day. Make **pickles** (3 onions, beans or
  carrots, a vinegar and a bottle) and **fish and chips** (a fish, 2 potatoes and a vinegar, in the oven).
- **Smoking.** Tap a chimney over a burning fireplace to hang food in it. Fish turns into **smoked fish** in a
  minute, and pork and cheese into **smoked ham** and **smoked cheese** in two.
- **Drying.** A **drying rack** (6 sticks, 2 string) out in the sun dries grapes into **raisins**, fruit and berries
  into **dried fruit**, and pork into **jerky**. It dries twice as fast in the desert, and not at all at night,
  in the rain or under a roof. Raisins, dried fruit, roasted cocoa and a honey drop make 2 **trail mix**, which
  lets you run faster.

### Oven dishes and sweets

Fine crops work in these as well as plain ones.

| Make | From | Where |
| --- | --- | --- |
| Pizza (14 food; keeps you full) | 2 flour + tomato + cheese + herbs | oven |
| Carrot cake (12 food; see in the dark) | 2 carrots + 2 flour + sugar + egg | oven |
| 2 Pumpkin bread (9 food) | pumpkin + 2 flour + sugar | oven |
| Cheesy jacket potato (11 food; warms you) | potato + cheese + butter | oven |
| 2 Melted toffee | 3 sugar + butter + 2 glass bottles | cooking pot |
| 2 Honey syrup | 4 honey drops + 2 glass bottles | cooking pot |
| 3 Candied peel | 2 oranges + 2 sugar | cooking pot |

The chocolate mould takes melted toffee and honey syrup as well as chocolate. They set the same way into 4
**toffees** (a burst of speed) or 4 **honey candies** (heal you a little).

### Coffee, rice and chillies

- **Coffee bushes** grow wild in the warm land by the deserts, where cocoa trees grow. **Chillies** grow wild in
  the desert, and **rice** on temperate river banks and shores.
- Plant coffee cherries or chillies only in that warm land or under glass: anywhere else they won't grow.
  Chillies can go on sand as well as grass and dirt. Rice grows only with water right beside the block it's
  planted on, and can go on sand too.

| Make | From | Where |
| --- | --- | --- |
| Roasted coffee beans | coffee cherries | oven |
| Ground coffee | 2 roasted coffee beans | mortar |
| 3 Coffee (dig faster) | ground coffee + water bucket + 3 glass bottles | cooking pot |
| 2 Mocha (dig faster, for longer) | coffee + chocolate milk | anywhere |
| 2 Rice pudding (9 food; warms you) | 2 rice + milk bucket + sugar | cooking pot |
| Fish and rice (11 food; run faster) | 2 rice + a fish + herbs | cooking pot |
| 2 Hot sauce (warms you for a long time) | 3 chillies + vinegar + 2 glass bottles | cooking pot |
| Chilli con carne (14 food; warms you for a long time) | raw pork + 2 beans + tomato + chilli | cooking pot |

### Treats and the food contest

- **Treats** (chocolate, ice cream, cakes, sweets, mocha, rice pudding and trail mix) sell for 3 coins each at a
  market stall.
- At every festival the village holds a **food contest** as well as its produce show. Tap the bell holding a
  dish: a meal that does something for you, a treat, or one of the festival's favourites. You can enter once a
  day, and it costs you one of the dish.
- The judges like a filling dish, a treat more, and the festival's favourites most of all. First prize pays 16
  coins, second 9 and third 4, and each earns standing in the village.

| Festival | The judges' favourites |
| --- | --- |
| Blossom Fair (spring) | honey candy, candied peel, carrot cake, chocolate cherries, pickles |
| Midsummer Feast | ice creams, ice lollies, pizza, fish and chips |
| Harvest Festival | pumpkin bread, pork pie, roast pork, cheesy jacket potato, trail mix, smoked ham |
| Frost Fair | hot chocolate, mocha, chilli con carne, chicken soup, rice pudding, toffee |

### Crops and crop rotation

- **Carrots** and **potatoes** grow from themselves (village farms have rows of them). Bake a potato in the oven.
- **Pumpkin seeds** (4 from a pumpkin) grow a stem that puts a pumpkin beside it. A pumpkin and a torch make a
  **jack o'lantern**; a pumpkin, sugar and an egg bake a **pumpkin pie**.
- **Grapes** grow on a **trellis** (2 from 6 sticks): plant them at its foot.
- **Crop rotation**: planting the same crop over and over in the same soil tires it, and it grows more slowly
  (down to about a third). Change crops, or leave the soil for six days, and it recovers. Fertiliser freshens it.

### Winery and cheese

- A **wine press** (6 planks, 3 logs, an iron) presses 6 grapes and a bottle into **grape juice**; a **cheese
  press** (the same and a string) presses a milk bucket into **curds**. Neither needs fuel.
- An **oak barrel** (6 planks, an iron) ages what's in it: juice becomes **wine** after a day and **fine wine**
  after three more; curds become **cheese**, and cheese becomes **aged cheese**. Tap a barrel to see how they're
  coming on. Aged things sell for more.

### The distillery

A **distillery** (6 copper ingots, 3 bricks, a glass bottle) is a copper still over a firebox. It burns fuel
like an oven.

| Make | From |
| --- | --- |
| 2 New spirit | 6 wheat or 4 rice + a water bucket + 2 glass bottles (the empty bucket goes in its tray) |
| Rubbing alcohol | 2 new spirit (you get a bottle back) |
| Biofuel bucket | 8 plant matter + an empty bucket |

- **Whisky.** New spirit laid down in an oak barrel becomes **whisky** after two days, and **old whisky** after four
  more. Both warm you through, and old whisky sells for 7 coins at a stall.
- **Rubbing alcohol.** Craft it with a wool into 3 **bandages**. Tap with one in hand to heal 4 hearts and cure
  food poisoning.
- **Biofuel.** Plant matter is seeds, saplings, leaves, sugar cane, cactus, flowers, vegetables, fruit, cocoa
  pods, coffee cherries or sawdust. A biofuel bucket burns six times as long as coal in a stove, an oven or a
  steam engine, and you keep the bucket.

### New crops, cider and berry wine, cellars

- **Onions**, **beans**, **tomatoes** and **herbs** grow from themselves (village farms grow them, and farmers sell
  them). **Beans** never tire the soil: they leave it **rich**, so the next crop grows faster.
- New meals: **vegetable stew** (an onion, carrot, potato and herbs) and **tomato soup** (3 tomatoes, an onion and
  a water bucket) in the cooking pot, and **baked beans** (4 beans, a tomato) in the oven.
- The **wine press** also makes **apple juice** (4 apples) and **berry juice** (8 berries). In an oak barrel
  apple juice becomes **cider** and then **vintage cider**; berry juice becomes **berry wine** and then **fine
  berry wine**.
- A barrel in a **cellar** (no daylight reaching it from any side but below) ages things half as fast again.
  Tap a barrel to see whether it's in one.

### Honey varieties

- Hives and apiaries make honey after the flowers growing thickest around them:
  - **Lavender honey** comes from lavender.
  - **Blossom honey** comes from fruit trees.
  - **Golden honey** comes from dandelions.
  - With none of these, they make plain wildflower honey.
- Brew each in the cauldron with its flower (an apple or cherries for blossom honey). Lavender tea keeps you fed
  for longer, blossom tea makes you swift, and golden tea heals.

### Bee breeding

Wild hives hold colonies you can catch and breed into new kinds of bee.

- **Catching bees.** A **bee scoop** (3 sticks, 3 wool) takes the colony from a wild hive that has some honey in
  it: a **princess**, one or two **drones** and some honeycomb. The kind depends on the land: **woodland** or
  **meadow** bees in the green lands, **frost** bees in the tundra, **dune** bees in the desert. The hive is left
  empty, and new bees move in again in time.
- **The bee house** (6 planks, 2 honeycomb, an iron ingot) takes a princess, a drone and up to two **frames**.
  The princess and drone become a **queen**, who works for a number of spells (about 30 seconds each), filling
  the trays with combs. When her life is over she leaves a new princess and some drones. Each takes after
  one parent or the other, so a princess and drone of the same kind breed true.
- **Mutations.** Some pairs of different kinds now and then breed a new kind instead. Tooltips on a bee show
  what it needs, and the new kind's tooltip names its parents:

  | Parents | New kind |
  | --- | --- |
  | Woodland + Meadow | Common (makes more honeycomb, works faster) |
  | Common + Meadow | Garden (floral combs) |
  | Common + Woodland | Orchard (blossom combs; needs fruit trees) |
  | Frost + Dune | Hardy (needs no flowers, works in the rain) |
  | Common + Garden | Diligent (fast and productive) |
  | Hardy + Diligent | Rocky (mineral combs; works only underground) |
  | Dune + Hardy | Ember (ember combs; needs lava nearby) |
  | Diligent + Orchard | Royal (royal combs) |
  | Garden + Rocky | Glow (glow combs; works at night or in the dark, near glowcaps) |
  | Rocky + Frost | Crystal (crystal combs; underground) |
  | Royal + Rocky | Gilded (gilded combs) |
  | Crystal + Gilded | Starry (starry combs; only at night under the open sky) |

- **What bees need.** A queen stops work if her place doesn't suit her: the wrong climate (frost bees want the
  tundra or winter, dune and ember bees the desert or summer), the wrong time of day, rain falling on the house,
  or none of her flowers within 5 blocks. Most kinds work half as fast in winter. The house's panel says why
  she's idle. Full trays stop her too, so empty them, or put a hopper under the house.
- **Frames** make each spell yield more combs, and wear out: a **wooden frame** (4 sticks, a string; makes 2) adds
  half again, a **waxed frame** (a wooden frame and 2 beeswax) doubles it, and a **proven frame** (a waxed frame
  and 2 propolis) doubles it and lasts much longer.
- **The comb centrifuge** (4 iron, 3 planks, a small wooden gear and a bucket) is turned by a shaft and spins combs
  into honey drops and beeswax, with by-products: ice, sand and **propolis**, **pollen**, dirty iron, copper and
  tin dust, sulphur and coal dust, **royal jelly**, glow shells, crystal shards, dirty gold and silver dust,
  and, now and then, meteoric iron. The electric centrifuge spins combs too.
- **Honey products.** 4 honey drops and a bottle make a bottle of honey. 2 pollen make fertiliser. An apple and 2
  drops make a **honeyed apple**, which makes you swift for a while. The oven bakes a **honey cake** (3 flour,
  4 drops, an egg), and royal jelly is a filling, healing food. 6 drops and a bottle in the wine press make
  **honey must**, which ages in a barrel into **mead** (warms you) and then **fine mead** (heals you).

Example worlds to import from the Worlds screen (tap **Import** on a slot and pick the file):
- `worlds/minicraft-world-v31-showcase.json`: every kind of bee, comb and honey product.
- `worlds/minicraft-world-v31-farm.json`: crops at every growth stage, a farm controller, a scarecrow, an apple
  tree, the cooking pot and oven, the wine and cheese presses, and a barrel ageing wine and cheese.
- `worlds/minicraft-world-v31-logistics.json`: a stock chest with an extractor, a pipe line with a power junction
  on a solar panel, a sink chest taking the stock, an auto-crafter with a crafting pipe, and a sensor.

### Fine crops, shows and special trades

- A ripe crop sometimes comes up **fine**: more often in soil that beans have fed or under glass, less often in
  tired soil, and never in worn-out soil. Fine crops are better eating and sell well at a stall. Craft one back
  into the ordinary kind whenever you like. New achievement: **Prize Grower**.
- On a festival day, tap a village's bell holding fine produce to enter its **show**. Show three for first prize.
- **Friends** of a village are offered a special trade by each villager, and its **Heroes** a second one:
  - farmers: fertiliser and saddlebags
  - smiths: speed and yield upgrades
  - fishers: worms and treasure maps
  - clerics: golden tea and pearls

### Farm machines

- A **tree feller**, driven by a shaft, cuts down the tree in front of it and passes the logs (and a sapling or
  two) to whatever is behind it.
- A **planter** plants a sapling put into it on the grass or dirt in front of it, whenever there's room.
- A **block breaker** breaks the block in front of it each time its signal comes on, passing what it gives
  behind it. A **block placer** puts a block from the chest behind it into the space in front of it.
- An **animal station** shears alpacas, plucks ducks and milks yaks (into empty buckets put into it) within 5
  blocks, passing what it gets out of its back. Wheat put into it is fed to the animals, so coats and
  feathers grow back twice as fast.
- A **fishing net** set in water catches a fish every minute or so; a hopper underneath takes them out.

## Mining and metals

### Ores and metals

Ores sit in small veins in the stone; the deeper you dig, the rarer and more valuable they get.
Without a good enough pickaxe an ore breaks slowly and drops nothing. The heights below are for classic worlds.
In a tall world the layers are spread over the deeper rock: up to sea level, a height here is about 2⅓ times as
high (gold, 1–16 here, is found from about 2 up to 37), and above 24 it's 32 higher.

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
| Tungsten ore | 1–9 (deep) | stainless steel | tungsten ingot (blast smelter or hotter) |
| Nickel ore | 4–36 | copper-class | nickel ingot |
| Uranium ore | 1–14 (deep) | stainless steel | uranium ingot (for fuel rods; blast smelter or hotter) |

Alloys, made in the smelter (coal or charcoal here is an ingredient, not the fuel):

| Alloy | From |
| --- | --- |
| 4 Bronze ingots | 3 copper + 1 tin |
| 4 Aluminium bronze ingots | 1 aluminium + 3 copper |
| 2 Electrum ingots | 1 silver + 1 gold |
| 4 Cupronickel ingots | 3 copper + 1 nickel |
| 1 Steel ingot | 1 iron + 1 coal or charcoal (blast smelter or hotter) |
| 2 Stainless steel ingots | 1 zinc + 1 iron + 1 coal or charcoal (blast smelter or hotter) |

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
| Smelter (8 cobblestone) | cobblestone → stone, sand → glass (flint dust + sand → 2 glass), log → charcoal, ores and ore dust → ingots, alloys (see above; not steel, stainless steel, tungsten or uranium, which need more heat), clay ball → brick, fire clay → fire brick |
| Blast smelter (smelter + 8 fire bricks) | everything the smelter does, twice as fast on the same fuel, and hot enough for steel, stainless steel, tungsten and uranium |
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

### The carpenter and crates

A **carpenter** (4 planks, 2 logs, 2 iron, a gear) is turned by a shaft, like the other machines.
- It makes 2 empty **crates** from 4 planks and 2 sticks.
- It packs 9 of a thing and an empty crate into a **crated** item ("Crated Cobblestone", "Crated Wheat", ...).
  Crated items stack to 64, so one slot holds 9 stacks.
- Put a crated item in to unpack it: you get the 9 back, and the empty crate goes in its tray.
- You can also unpack a crated item by hand at the crafting grid, but the crate breaks.
- Most bulk things can be crated: stone, dirt, sand and gravel, logs and planks, ores, ingots and dusts, coal, crops,
  fruit, flour and sugar, sticks, string, wool and so on. A hopper or a logistics pipe can feed a carpenter, so
  it can pack a farm's harvest as it comes in.

### Rubber and polymers

- **Tree taps** (3 planks, an iron ingot): put one against a tree trunk and latex slowly drips into it (it
  fills faster in good growing weather). Tap it to collect up to 4 latex.
- **The oven** cures 2 latex into a piece of **rubber**, and renders a piece of leather into **hide glue**.
- **The polymer press** (4 iron, 2 stone, a gear, 2 planks) is turned by a shaft, like the other machines. It
  moulds 4 sawdust and a hide glue into 2 **polymer pellets**, and presses 2 pellets into a **polymer sheet**.

| Make | From | Where |
| --- | --- | --- |
| 4 Insulated wire | 4 electrum wire + 1 rubber | crafting table |
| 4 Polymer blocks (10 colours) | 2 polymer sheets + 1 dye | anywhere |
| 2 Lumen panels | 2 polymer sheets + 1 glow shell | anywhere |
| Bounce pad | 4 rubber + 1 plank | crafting table |
| Padded boots | 3 rubber + 2 leather | crafting table |
| Polymer pickaxe, axe, shovel, sword | 3 / 3 / 1 / 2 polymer sheets + sticks | crafting table |
| Polymer boat | 5 polymer sheets + 2 sticks | crafting table |
| Demolition charge | 2 blasting charges + 1 polymer sheet + 1 copper ingot | crafting table |
| Detonator | 2 polymer sheets + 2 insulated wire + 1 copper ingot + 1 rubber | crafting table |

- **Insulated wire** works just like electrum wire, but carries twice the power. Every network of wires
  has a limit set by its weakest wire: electrum wire and cupronickel cable carry 48 units (a full four-rod
  reactor), insulated wire 96. If the machines on a network want more than its wires carry, they all slow
  down to share what gets through, and a power meter tells you so. One plain wire in an insulated run is
  enough to hold the whole network back.
- **Lumen panels** are clear and glow brightly. **Polymer blocks** are smooth, plain colour for building.
- **Bounce pads** throw you back up when you land on them, about three quarters as high as you fell. Hold jump
  to bounce higher, or sneak to stop. They never hurt.
- **Padded boots** take all the harm out of falls.
- **Polymer tools** dig as well as copper or bronze and are quicker than iron, but wear out sooner (350 uses).
  Mend them with polymer sheets.
- **The polymer boat** is half as fast again as a wooden one.
- **Demolition charges** have no fuse. Tap them with a **detonator** to link them (up to 16; a red light
  shows a charge is armed; tap again to unlink), go well away, and use the detonator anywhere else to set
  them all off one after another. Each blows a hole about 7 blocks across, and what it breaks comes to you if
  you're within 24 blocks. The detonator reaches 96 blocks.

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

### Ore washing, trace metals and slag

- Crushers, pulverizers and the jackhammer now give **dirty dust**. Smelt it as it is (4 dirty dust make 3
  ingots, with some slag), or clean it first in an **ore washer** (3 iron, 4 planks, a bucket and a gear, at a
  table). The washer needs turning power and water touching it on some side. Each dirty dust washes into a
  clean dust, sometimes with one more beside it, and some **sludge** (4 sludge make a clay block).
- **Trace metals**: ores carry a little of another metal. Washing iron sometimes gives nickel dust, copper gives
  gold, tin gives zinc, lead gives silver, bauxite gives iron, and so on. The recipe list shows each chance. New
  achievement: **Hidden Riches**.
- What a washer, sieve or smelter makes on the side goes into **by-product slots** to the right of the output.
  Tap one to collect it, or put a hopper underneath.
- Smelting ore sometimes leaves **slag**. 2 slag crush into fertiliser, and 4 slag with a clay ball make 4
  **slag bricks**.
- A **sieve** (4 planks, 4 sticks, 4 string) needs no power. It sifts gravel into sand with flint and now and
  then some dirty ore dust. It sifts dirt for **worms**, seeds, flint and saplings.

### Charcoal piles and cobble generators

- Stack logs, cover them all over with dirt, sand, gravel or stone, and light one log through a gap with a
  torch. A sealed pile smoulders into **charcoal heaps** (2 charcoal each). If air gets in while it burns, it
  flares up. New achievement: **Charcoal Burner**.
- Flowing water that touches lava now makes **cobblestone**, so a cobble generator works.

## Tools, weapons and armour

### Tools and gear

- The **chainsaw** (3 stainless steel, a battery, 2 electrum wire, 2 iron) cuts like the best axe and fells whole
  trees, using 3 charge a log, and gives you **sawdust** as well as the logs.
- 4 sawdust and a water bucket make 4 **paper** (you keep the bucket); 6 paper and a buffalo hide make a **book**,
  which opens the guide.
- **Backpacks** hold things you carry: a backpack (6 leather, 2 string) has 9 slots, an iron-framed one (8 leather,
  4 iron, 2 string) 18, and a stainless steel one (8 leather, 4 stainless steel, 2 hides) 27. Tap with one in hand to
  open it. A backpack can't go in a backpack.
- The **spanner** (3 steel): tap a machine with it to turn it to face the next way; hold it on a machine to pick it
  up with everything in it (and its charge), ready to put down somewhere else just as it was.
- The **grappling hook** (3 iron, 8 string): tap with it in hand to shoot it at a block up to 24 away, and it pulls
  you there and holds you. Jump to climb up onto the block, sneak or tap again to let go.

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

### Shields

| Make | Recipe (crafting table) |
| --- | --- |
| Wooden shield | 6 planks + 1 iron ingot (or 2 leather) |
| Iron shield | 4 iron plates + 1 leather |

Wear a shield in the fifth armour slot. It stops any hit or thorn that comes from in front of you, and
wears by how hard the hit was.

### Wear and repair

Tools, swords, armour and shields wear a little with each use (each block dug with the right tool, each
hit, each blow taken), shown by a bar on their slot. A worn-out one breaks. Wooden things last about
60 uses, stone 130, and metals more and more up to tungsten (1,500). Tap an **anvil** (5 iron ingots +
2 iron plates) holding a worn thing to mend half its wear with one piece of what it's made of: planks,
cobblestone, the metal's ingot, or leather. Wear can be turned off in the ☰ menu.

## Furniture, building and home

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
| Record Player | 4 planks + 1 iron ingot + 1 copper ingot |
| Armour Stand | 6 sticks + 2 planks |

Chairs face you when you place them; doors take two blocks. Beds are two blocks long: the foot goes
where you tap and the head (with the pillow) extends away from you. Tap a bed in the evening or at
night to sleep until morning (not while a creature is lurking nearby); any tap sets it as your respawn point.

Tap a crafting table or butter churn to open crafting there.

A **record player** plays music: tap it to put on a record (Morning Fields, Night Sky, Deep Caves, Under the
Waves, Village Square, Festival Day and First Snow, one tap each) and once more past the last to stop it. While
it plays, its music goes on and on (even with the Music slider at 0), loudest close by and fading out about 24
blocks away. In multiplayer everyone nearby hears it.

An **armour stand** faces you when you place it and needs room above it. Tap it to swap all your armour (and
your shield) with what it holds: hang a set up, put on another, and swap back whenever you like. Wear and
enchantments stay with each piece. Break the stand and its armour drops.

A **mirror** (2 glass and a silver ingot make 2) hangs flat on the side of a block. Mirrors hung side by side in
the same wall join into one big mirror. With **Live mirrors** on (☰ → Graphics) a mirror shows the world in
front of it, you included (in first person too). With it off, a mirror shows a plain silvery sheen.

A **security camera** (2 iron ingots, glass and a copper ingot) hangs on the side of a block or stands on top of
one. On a wall it looks straight out; standing on a block, it looks the way you were looking when you put it
down. Tap it to tilt it down a step (straight ahead, down, well down, then back).

A **monitor** (2 iron ingots, 2 glass and a copper ingot) is a full block whose screen faces you. Tap it to
watch the nearest camera; tap again for the next nearest, and so on, then off after the last. A toast says
which camera it's on and how far away. Monitors side by side or stacked in the same wall join into one big
screen showing one wide picture, so a wall of them makes a control room for a whole factory. Any monitor in
the screen tunes all of it. A camera that's broken, or too far away to be loaded, shows **NO SIGNAL**.
Cameras need no power. Screens you can see are redrawn in turn, one each frame, at a low resolution. In
multiplayer everyone sees what each monitor is tuned to.

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

### Building

| Make | Recipe (crafting table) |
| --- | --- |
| 6 Slabs | 3 planks, cobblestone, stone, stone bricks, bricks or sandstone |
| 4 Stairs | 6 of the same |
| 3 Fences | 4 planks + 2 sticks |
| Fence gate | 2 planks + 4 sticks |
| 16 Glass panes | 6 glass |
| 2 Trapdoors | 6 planks |
| 4 Mossy stone bricks | 4 stone bricks + 2 leaves |

A slab goes in the top or bottom half of a space, depending on where you tap; put a second slab of the
same kind on it to make the full block. Stairs climb away from you, and you walk up stairs and slabs
without jumping. Fences and glass panes join up to each other and to blocks beside them. Fences stand
too tall to jump over, and animals won't cross them, so they make good pens. Gates and trapdoors open
and shut when you tap them. A trapdoor shut over a hole is a floor you can walk on.

### Flowers and colour

Meadows of **poppies**, **dandelions**, **cornflowers**, **lavender** and **daisies** grow in temperate land. Grind
them with the mortar for red, yellow, blue, purple and white **dye**. Coal or charcoal makes black, and
cactus (or 4 leaves) makes green. Mix red + yellow for orange, red + white for pink, and blue + green for cyan.

| Make | From |
| --- | --- |
| 4 Dyed wool | 4 wool + 1 dye |
| 3 Dyed carpets | 2 dyed wool (crafting table) |
| 4 Stained glass | 4 glass + 1 dye |
| 4 Painted planks | 4 planks + 1 dye |

Or tap a placed block of wool, carpet, glass or planks holding a dye to colour it where it stands. Tap
a sign with a dye to colour its writing.

### Walls, pillars, doors, lights and paintings

**Walls** (in six stones) join up with each other, with gates and with solid blocks beside them; **pillars** come in stone and sandstone; and
**stairs** placed beside each other turn inside and outside corners. Dye a **door** or make **stained glass
panes** in any of the ten colours. Light rooms with an iron **lantern** (it hangs when placed under a block),
a gold **chandelier**, or **glow lamps** (crystal shards, stained glass and a torch) that cast light in their
own colour. Hang a **painting** on a wall: it picks the biggest of eight pictures that fits the space.

Light that shines through **stained glass** (blocks or panes) takes on its colour. A torch behind red glass
lights the room beyond it red, and a lamp boxed in blue glass gives blue light. With **Sun shadows** on,
sunlight through a stained-glass window or roof throws patches of its colours across the floor and walls.
The glass's leading (its dark edge) still casts a thin shadow.

### Metal blocks

Every metal that comes as ingots also packs into a solid **block of** that metal: 9 ingots at a crafting
table make one (iron, copper, tin, lead, zinc, aluminium, silver, gold, tungsten, bronze, electrum,
stainless steel, steel, aluminium bronze, nickel, cupronickel, uranium, invar and starsteel). Build with
them (they catch the sun like polished metal), or use them to store a lot of a metal in one slot: a block
breaks back down into 9 ingots anywhere, no table needed. A metal's blocks show in the recipe list once
you have some of that metal.

### Building and decorating

- **Sit** on a chair: tap it with an empty hand (or anything that isn't a block). Move or jump to stand up.
- A **shelf** or a **wooden table** shows an item on top: tap it holding the item to put it there, and tap with an
  empty hand to take it back. Breaking it drops what was on it.
- **Flower pots** (3 bricks): tap one with a flower, a sapling, a glowcap or a cactus to plant it; tap again with
  an empty hand to take it out.
- **Hanging baskets** (a flower pot, 2 string, an iron, 4 leaves) hang under a ceiling; **window boxes** (3 planks,
  dirt, 3 flowers) go on the side of a wall.
- **Iron bars** (16 from 6 iron) join up like glass panes.

### Home comforts

- A **fireplace** (5 bricks, 2 cobblestone, an iron): tap it with logs, planks, sticks or coal to light it. It
  lights and warms the room (you thaw out fast beside it). Build **chimney** blocks (2 from 3 bricks) straight up
  from it for the smoke, or the room fills with it.
- **Pin a recipe** (📌 beside it) to keep it on screen with how many of each thing you have and still need; it
  goes green when you've got everything. Up to three.
- The **mortar and pestle** now wears with use: each thing ground in it counts, and it breaks after 96 (the most
  worn one you carry is used first). Mend it at an anvil with cobblestone.
- **Auto-refill**: when the stack in your hand runs out, or a tool breaks, the next one of the same thing moves
  in from your backpack. Turn it off under ☰ if you'd rather not.

### Bookshelves, the journal and compost

- A **bookshelf** (6 planks, 3 books) near an enchanting altar (within 2 blocks, at the altar's level or one up)
  makes enchanting cheaper: one crystal shard less for every 5 shelves, down to half. Shelves also unlock three
  new enchantments: **Lucky** (4 shelves; a pickaxe gets an extra ore 1 time in 3), **Mending** (8; a tool or armour
  slowly mends itself while you carry it) and **Feather Fall** (12; boots that halve fall damage).
- A **journal** (a book, a feather, coal dust): tap with it in hand to write in it. "Note where I am" adds your
  position. What you write is kept with that journal.
- A **compost bin** (7 planks) rots sawdust, seeds, saplings, wheat, sugar cane and berries into **fertiliser**
  with no fuel or power. Tap a sapling or a crop with fertiliser to make it grow a stage (or a sapling into a tree).

### Kiln, terracotta and pottery

- A **kiln** (5 clay bricks, an iron, at a table) is fired with fuel like a furnace. It bakes clay blocks into
  **terracotta**, clay balls into bricks, an **unfired urn** (6 clay balls) into an **urn** (a 6-slot store), and
  coloured terracotta (4 terracotta and a dye) into shiny **glazed tiles**.
- **Roof tiles** (4 from 4 terracotta) for warm red roofs.

## Water power and machines

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
lines up with it instead, so gears sit side by side; sneak while placing to keep the tapped face's axle
(for a gear at a corner). A water wheel's axle is always level.

**How they connect:**
- Shafts, gears and wheels join end to end along their axles.
- Two small gears side by side (on parallel axles) mesh, at the same speed.
- A large gear meshes with a small gear set **one block diagonally** from it across the axle. The small
  gear turns **twice as fast** as the large one; drive the small one and the large one turns at half speed.
- **Corners:** two small gears side by side with their axles at right angles mesh too, at the same speed,
  so rotation can turn a corner without a gearbox.
- Two large gears on parallel axles mesh with **one empty block** between them, at the same speed.
- Gears that only touch end to end (axle to axle) don't mesh. Look at a lone gear to see these rules.
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

### More power

- A **drive belt** links two shafts or gears on parallel axles up to 8 blocks apart: hold it, tap one, then
  the other. They turn together at the same speed.
- A **flywheel** joins up like a shaft. While the network has power to spare it spins up, and when the
  power drops (a steam engine runs out, say) it keeps the machines going for a while.
- A **tachometer** is driven like a machine but takes no load. Tap it to see the speed and load; it gives a
  signal while its network is stopped or overloaded.
- A **gear shift** joins like a shaft, but while it gets a signal its + end turns twice as fast as the other.

### Observers, gauges, harvesters, steam and switch rails

These build on the machines you already have:

- An **observer** watches the block in front of it and gives a short pulse of signal when that block changes.
  A **storage gauge** reads the chest, machine or cauldron in front of it and gives a steady signal while it
  holds anything (tap it to make it signal only when full). Both work doors, clutches, powered rails and
  switch rails like any other switch.
- A **harvester**, driven by a shaft like the drill, reaps ripe wheat, berries and sugar cane in the 5 × 5 patch
  in front of it, replants them and passes the harvest to whatever is behind it.
- A **steam engine** burns coal (or any fuel), fed by hand or by a hopper, and drives every shaft or gear
  pointing into it with more power than a water wheel. It needs water beside it (a cauldron of water will do).
- **Pumps** set beside lava pump lava through lead pipes, and a spout over a cauldron fills it with water.
- A **switch rail** joins a branch line to a straight one. It runs straight until it gets a signal, then sends
  carts onto the branch. Powered rails that aren't turning still brake carts, so they make station stops.

### Machine upgrades and quarry filters

- **Speed** (steel, electrum and a gear), **efficiency** (cupronickel and fire bricks) and **yield** (stainless
  steel, silver and gold) upgrades: tap a machine with one to fit it, up to two of each.
  - Speed makes it work half as fast again.
  - Efficiency makes a furnace, oven or kiln burn a third less fuel.
  - Yield sometimes gives one more from a crusher, pulverizer, washer, sieve, millstone or saw.
  - The machine's panel lists what's fitted, and a spanner keeps the upgrades in it. New achievement: **Souped Up**.
- Hang **item frames** on a quarry showing the things you want, and it keeps only those.

## Electricity and reactors

### Electricity

- A **generator** (4 iron, 4 copper, 2 electrum wire) makes electricity while a shaft or gear turns it: 4 power
  for each 1x it turns at, taking that much load from the shaft.
- **Electrum wire** (8 from an electrum ingot) lies on top of blocks like copper wire and carries electricity to
  every electric machine it touches. Electric machines set right beside each other join up too. It also carries
  signals, and joins up with copper wire.
- An **electric lamp** (iron, bronze or copper, glass and electrum) is brighter than a filament lamp, and uses 1 power.
- The **electric pulverizer** (4 stainless steel, electrum, flint, a lead pipe and a chest) crushes everything the
  rock crusher does, twice as fast, and gets half as much again: 3 dust from an ore, and a 1 in 4 chance of one
  more. It uses 6 power while it's working.
- A **battery** is 8 lead and a slime bucket (you keep the bucket). It comes flat: a **battery charger** (3 iron,
  2 copper, 4 electrum wire) fills one, or anything that runs on one, using 4 power while it charges.
- When the generators make less than the machines want, everything runs on the share there is: pulverizers and
  chargers slow down, and lamps go out below half. Tap a generator, lamp or wire to see how the network is doing.
- Hoppers, belts, elevators, ejectors, collectors and carts pass things on just as they are: a flat battery stays
  flat, a worn tool stays worn, and enchantments stay put.
- Battery-powered things are made with a battery and keep its charge. When one runs flat it tops itself up from
  any charged battery you carry:
  - The **portable electric lamp** (an electric lamp, a battery and iron): tap with it in hand to switch it on, and
    it lights the way around you from anywhere in your inventory. Its charge lasts about 16 minutes.
  - The **jackhammer** (4 stainless steel, a battery, 2 electrum wire) digs like a stainless steel pickaxe, only
    faster, and now and then shakes a dust off an ore as well as the ore. A charge breaks 200 blocks; flat, it's no
    better than your hands.
  - The **electric jetpack** (4 stainless steel, 2 batteries, 4 electrum wire, 2 leather) is worn in place of a
    chestplate. Hold jump in the air to climb, or to slow a fall. A charge gives 50 seconds of thrust.
  - The **electric drill** (a jackhammer, a tungsten drill bit, 2 cupronickel) digs a 3 × 3 square at a time
    across the face you're digging: the 8 blocks round the one you dig go too, if they're rock or earth that digs
    no slower. 4 charge a block, from 2000.
  - **Hover boots** (a battery, 4 leather, 2 aluminium, 2 electrum wire), worn as boots, let you fall no faster
    than a slow drift, so falls can't hurt you. Hold sneak to drop. 50 seconds of hovering from a charge.
  - **Night-vision goggles** (a battery, 2 glass, 2 leather, a crystal shard), worn as a helmet, let you see in
    the dark like a night tea, for 25 minutes on a charge.
  - The **magnet ring** (a battery, 2 nickel, 2 iron): tap with it in hand to switch it on, and it pulls loose
    things within 8 blocks to you while it's anywhere in your inventory. It only uses charge while it's pulling.

#### Making, storing and using more electricity

- A **solar panel** (3 glass, silver, 2 iron, 2 electrum wire) makes up to 2 power in full sun under open sky,
  less in the morning, evening and rain, and none at night.
- A **wind turbine** (a generator, 3 aluminium, 2 iron) makes 1 power at sea level, a point more every 6 blocks
  higher (up to 6), and half as much again in a storm. It needs the 8 blocks around it clear.
- **Cupronickel cable** (16 from a cupronickel ingot and a wool) carries electricity straight on in any
  direction: up walls, down shafts and across ceilings. It carries no signals, so it can run past levers and
  copper wire without mixing them up.
- A **grid battery** (4 batteries, 4 lead, 2 electrum wire) stores up to 2400 power-seconds. It soaks up whatever
  the generators make that the machines don't need (up to 8 power each) and gives it back when they're short, so
  solar panels can light your lamps at night.
- An **electric motor** (3 iron, 4 copper, 2 electrum wire, an iron gear) turns shafts like a steam engine: 6
  power with all the electricity it wants (it takes 8 while it has something to turn), less when the grid's short.
- A **power meter** (2 copper, glass, electrum wire) gives a signal while its grid is short of power. Tap it to
  have it signal while there's power to spare instead (to switch on an extra machine, say).
- Tap an **electric lamp** to have it come on only while it has a signal: a lever, a button, or a **daylight
  sensor** (3 glass, 2 copper, copper wire), which signals at night (or in the dark under a roof). Tap the sensor
  to have it signal by day instead.
- The **electric smelter** (a smelter, 4 stainless steel, 4 electrum wire) smelts everything the blast smelter does
  (steel, tungsten and uranium too) with no fuel, at twice the speed with all the power it wants (8).

#### Automation

- The **programmable crafter** (an auto-crafter, gold, 2 copper wire) takes up to four item frames: it makes the
  first, and steps on to the next each time it gets a signal.
- An **item counter** (a hopper, 3 copper, copper wire) passes things straight on out of its far side (the way you
  were looking when you put it down) and gives a short pulse after every 8 of them. Tap it to count 1, 2, 4, 8,
  16, 32 or 64.
- **Teleport pads** (2 from 4 crystal shards, 4 electrum, 4 cupronickel, 2 gold) pair up in the order you put them
  down. Each charges up on electricity (6 power, up to 60). Things put into one (by a hopper, belt or ejector)
  come out at the other, into the block under it or onto it, for 1 charge each. Stand on a pad with 40 charge
  (it glows) for a moment and you're sent to the other one, while its part of the world is loaded.
- The **quarry** (6 stainless steel, a tungsten drill bit, a chest, 4 cupronickel) digs out the 9 × 9 area in front
  of it a layer at a time, from its own level down to bedrock, and passes what it digs out of its back into a chest,
  hopper or belt. It takes 10 power, and half a second a block with all of it. It leaves machines, liquids and
  bedrock alone. Tap it to see how far it's got.

#### Geothermal, wireless charging, electric rails and lifts

- A **geothermal generator** (a generator, 4 obsidian, 2 stainless steel, a pipe) makes 2 power for every side of
  it that touches lava, day and night.
- A **wireless charger** (a battery charger, 2 crystal shards, 2 cupronickel, gold) tops up the battery-powered
  things in your inventory while you're within 8 blocks of it, using 6 power while it charges.
- **Electric rails** (6 from 6 powered rails and 2 electrum wire) speed carts along much faster than powered rails,
  using 2 power each while a cart is on them.
- A **lift** (4 stainless steel, an electric motor, 2 cupronickel, a pressure plate) carries you to the next lift
  straight above or below it, up to 48 blocks, through floors. Stand on it and jump to go up, or sneak to go down.
  It takes 4 power while it's carrying you.

#### Uranium and the reactor

**Uranium ore** is found deep down (Y 1–14) and needs a stainless steel pickaxe. Smelt it in a blast smelter (or crush it first) for
uranium ingots: 3 uranium and 2 stainless steel make a **fuel rod**, which lasts 10 minutes in a reactor.

The **reactor** (8 stainless steel, 8 lead, 2 tungsten, 2 generators, 2 glass) holds up to 4 fuel rods and makes
12 power for each. Each rod also heats it up. It cools itself a little, and much more for every side that touches
water: a reactor with water round it runs cool. Tap it to see how hot it is. Above 70 it glows red and an alarm
sounds; give it a signal (a lever, say) to stop it while it cools. Left at 100 it **melts down**: a huge explosion
that leaves a pool of lava where it stood, taking its rods with it.

#### Mob farms

Every new dungeon has a **monster spawner** in a corner. While you're within 20 blocks it brings out a creature
every 8 to 16 seconds (one kind per spawner), unless there are already four about or it has a signal. Night
creatures are now hurt by lava, by cactus beside them and by falls of more than four blocks, and what they drop
falls where they die: walk them off a ledge or into cactus, and catch the drops with a collector. A stainless steel
pickaxe (or better) takes a spawner with it.

Machines make a low hum while they turn, and electric ones a faint buzz, so you can hear a busy workshop.

### Nuclear waste and radiation

- A fuel rod that burns out in a reactor leaves a **spent fuel rod**, which is still radioactive: anywhere within
  6 blocks of one (in a chest, a machine or your inventory) you hear a Geiger counter and slowly lose health.
- A **lead-lined chest** (a chest, 8 lead) keeps the radiation in.
- A **hazmat suit** (four pieces of leather and lead) keeps it off you, and slows lava burns as well.
- The **centrifuge** (6 stainless steel, an electric motor, 2 invar, glass; 10 power) spins 3 uranium (ingots or
  dust) into **enriched uranium**, and spent rods back into uranium dust. 2 enriched uranium and 2 stainless steel
  make an **enriched fuel rod**, which lasts twice as long.

### Tesla coils, electric fences, the arc furnace and the freezer

- A **tesla coil** (3 invar, 6 copper, 4 electrum wire, a crystal shard) zaps night creatures within 7 blocks for
  6 damage every second or so, using 10 power while it has something to zap.
- **Electric fences** (6 from invar, 2 iron, 2 electrum wire) join up like fences and give anything that touches
  them a shock (1 damage to you, and animals run away), using 1 power each.
- The **arc furnace** (an electric smelter, 6 fire bricks, 2 tungsten, 4 electrum wire; 14 power) smelts everything
  twice as fast as a smelter, and makes **invar** (2 iron and a nickel make 3) and **starsteel** (2 meteoric iron,
  a tungsten and a coal).
- The **freezer** (4 stainless steel, an electric motor, 2 pipes, ice; 6 power) makes **ice** from water buckets
  (you get the bucket back) and **packed ice** from 4 ice. Every face of a reactor touching ice cools it twice as
  well as water, and packed ice three times as well. Ice beside a running reactor slowly melts.

## Signals and automation

### Signals and logic

- **Copper wire** (8 from a copper ingot) lies on top of blocks and carries a signal along the whole line it
  makes, side by side or a block up or down. Anything that switches on beside any part of it (a lever, button,
  pressure plate, observer, gauge or logic block) powers the whole line, and the wire powers whatever it
  touches, and the block it lies on, like a switch.
- **Inverters**, **delay blocks** and **latches** sit on top of a block and point away from you as you place
  them. Each takes its signal from the block behind it and gives its own to the block in front. An inverter
  is on while it gets no signal. A delay block passes its signal on after a moment: tap it to set ½, 1, 1½, 2,
  3, 4 or 5 seconds. A latch flips on or off each time its signal comes on (tap it to flip it by hand).
- Logic blocks work out their signal a tenth of a second after what feeds them changes. An inverter whose
  output loops back to its own input through wire flickers on and off; put a delay block in the loop for a
  slower **clock**.
- A **detector rail** gives a signal while a cart is on it.

### Switches, gearboxes and clutches

| Make | Recipe (crafting table) |
| --- | --- |
| Lever | 1 stick + 1 cobblestone |
| 2 Buttons | 1 stone |
| Pressure plate | 2 stone |
| Gearbox | 2 stone small gears + 4 cobblestone |
| Clutch | 2 stone shafts + 1 iron ingot |

A **lever** (on a wall or a floor) flips on and off, a **button** stays on for a moment, and a **pressure
plate** is on while you, an animal or a creature stands on it. A switch turns on whatever is beside it,
and whatever is beside the block it's fixed to:
- doors, fence gates and trapdoors open (and shut again when it goes off);
- a **clutch** (a shaft with an iron collar) only passes power on while it's switched on, so you can turn
  machines on and off without breaking anything;
- a **powered rail** pushes carts along. One that's not switched (or turned by a shaft) brakes and holds a
  cart, so a powered rail with a button beside it makes a station stop.

A **gearbox** takes power in or out of any face, so a shaft can turn a corner (or go up and down).

### Item frames, sorting hoppers and storage carts

| Make | Recipe (crafting table) |
| --- | --- |
| 2 Item frames | 6 sticks + 1 leather |
| 2 Loader rails | 2 rails + 1 hopper |
| Storage cart | 1 minecart + 1 chest |

Hang an **item frame** on the side of a block and tap it with something to show it there (tap again to
take it out). Frames hung on a **hopper** make it a **sorting hopper**: it only takes and passes on things
that match one of its frames. A hopper under a running belt takes things off the belt as they pass over
it (if it can), so a belt over a row of sorting hoppers sends each kind of thing to its own machine or chest.

A **storage cart** carries 18 slots of things: tap it to open it, double-tap and hold on it to pick it up (contents and
all). On a **loader rail** a storage cart stops while hoppers fill it (a hopper pointing at the rail) or
empty it (a hopper under the rail). It waits until nothing has moved for a moment, then rolls on.

### Moving things around

- An **ejector** throws what's in the chest or machine behind it out onto the ground in front: one thing every
  half second while it gets a signal. Tap it to make it throw a whole stack each time the signal comes on.
- A **collector** is a hopper that also pulls in loose things lying within 4 blocks of it.
- A **splitting belt** sends what reaches its end off to its left and right in turn; a **sorting belt** sends
  things matching an item frame hung on it off to the left, and the rest straight on.
- A **bucket elevator** (stack them into a column) is driven by a shaft like a belt. Things put into it by a
  belt, a hopper or dropped onto it are lifted up the column and out of the top, into a chest or hopper there,
  or onto the top.
- An **auto-crafter** makes whatever an item frame on it shows, a second at a time, whenever the ingredients
  are inside. Fill it with hoppers or belts and empty it with a hopper underneath.

## Logistics and liquids

### Liquids

- A **tank** holds 16 buckets of water or lava. Pour buckets in or take them out by hand, or fill it from a
  pump through lead pipes; a pump set beside a tank pumps out of it. A storage gauge reads it.
- A **valve** is a pipe that only lets liquid through while it gets a signal.
- Lava piped to an **oven**, **smelter**, **blast smelter** or **steam engine** burns as its fuel.
- A **sprinkler** on a water pipe makes crops in the 5 × 5 patch around it (and a block or two below) grow
  half again as fast.

### Logistics pipes

A routed item network, after the classic Logistics Pipes mod. Logistics pipes join up into a network. Each pipe
works the chests and machines it touches, according to its job:

- **Logistics pipe** (8 tubes, a gold ingot and a wire make 8): just a link.
- **Provider pipe** (a pipe and a hopper): offers what's in a chest, or what a machine has finished making, to
  the network. Tap it to offer everything except some things, or only some.
- **Crafting pipe** (a pipe and a crafting table): put it on an auto-crafter or a machine and choose one of its
  recipes. The network can then order that thing made: it sends the ingredients in and picks up what comes out.
  Crafting pipes chain together, so ordering a pickaxe with only planks in store first has sticks made.
- **Supplier pipe** (a pipe, 2 copper and a hopper): keeps a chest or machine stocked with what you set, up to
  the amount you set, ordering more (or having it made) as it's used. Fuel goes into a machine's fuel slot.
- **Item sink pipe** (a pipe and an item frame): takes in the things you set. As the **default route** it takes
  anything that has nowhere else to go.
- **Extractor pipe** (a pipe and an ejector): pulls things out of a chest, or a machine's output, and sends them
  to a sink.
- **Request table** (a pipe, a crafting table, 2 glass panes and gold): tap it to see everything the network
  has or can make (✦). Order any amount. If it can't be done, it tells you what's missing. Deliveries wait in the
  table: take them all from the order screen, or open it like a chest.
- **Power junction** (a pipe, a battery block and 4 wires): nothing moves without one on the network, wired to a
  powered grid. It draws 2 units.
- **Remote orderer** (a pipe, a crystal shard and 2 gold): tap a request table with it to link it, then use it
  anywhere the table's part of the world is loaded to order from there.
- Things fly along the pipes as little sprites. If their chest is full when they get there, they go to a sink,
  or drop out onto the floor. New achievement: **Supply Chain**.
- (Classic Logistics Pipes' satellite pipes and chassis modules are left out: a machine here takes all its
  ingredients on one block, and each module is its own pipe instead.)

### Logistics signals, liquid pipes and courier drones

- **Stock sensor pipe** (a logistics pipe and a daylight sensor): tap it to choose a thing (or water or lava),
  an amount, and whether it signals while the network has **less than** that or **at least** that. Wire it to
  lamps, doors, machines or anything else that takes a signal.
- A **power junction** that gets a signal (from a lever, wire or anything but the network's own pipes)
  **pauses** its part of the network.
- **Liquid provider pipe** (a logistics pipe, a pipe and a bucket): offers the water or lava in the tanks it
  touches. Dipped in a still pool of water or lava, it offers as much as you like.
- **Liquid supplier pipe** (a logistics pipe, a pipe and 2 copper): on a tank, tap it to keep the tank filled
  with water or lava up to a level. On an oven, smelter or steam engine, it keeps the fire fed with lava.
- **Liquid sink pipe** (a logistics pipe, a pipe and an item frame): on a tank or a bottler, it takes in liquid that
  has nowhere else to go.
- Liquids go along the pipes as buckets, 4 at a time at most. Whatever doesn't fit where it was sent goes **back
  where it came from**. If there's no room there either, it goes to a liquid sink, and if there's none (or they're
  all full), it's lost.
- **Bottler** (4 iron, a tank, a bucket and a hopper): pipe water or lava into it (with a liquid sink or supplier
  pipe) and put empty buckets in: it fills them, water into buckets and lava into lead buckets. Put an extractor
  pipe on it to send the full buckets off to an item sink and store them in chests.
- **Drone pad** (a logistics pipe, 4 iron, a crystal shard and a battery block): networks with a pad on the same
  channel (1 to 16; tap a pad to set it) work as one network. Anything one has can be ordered at the other's
  request table, crafting pipes on either can be used, and suppliers and sinks reach across. **Courier drones**
  fly things between the pads. Each part needs its own powered junction.
- **Drone pads keep their networks loaded**: every part of a network with a drone pad on it (and the chunks
  around its pipes) stays loaded however far away you go, so distant bases keep working and stay linked. Take
  the pad away and that part unloads as usual. New achievement: **Air Mail**.

### Belts, tubes and farm controller

- A **belt crossing** (2 belts, an iron) passes whatever a belt brings it straight on across, so two lines of belts
  can cross.
- A **farm controller** (2 copper, a copper wire, 4 wheat, 2 planks) watches the wheat within 7 blocks. It gives a
  signal once half of it is ripe (to set harvesters going), and tapping it tells you how the field is doing.
- **Pneumatic tubes** (6 from 4 glass and a copper) carry things from a belt, hopper or ejector, through all the
  tubes joined to them (up, down and round corners), to the nearest chest, machine or belt at the far end that will
  take them. Hang item frames on a tube beside a chest to make it take only those things.
- A **cable car** (4 iron, 2 glass, 3 planks): hold it and tap a zipline post to ride the line in a little gondola
  at an even speed, uphill as well as down. Sneak to get out.

## Transport

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

### The glider

A **glider** (6 sticks, 4 wool, 2 leather, at a crafting table) is worn in place of a chestplate. Jump off
somewhere high, then **jump again in mid-air** to open it. You fly the way you look: level, it carries you along
at about 9 blocks a second, sinking gently (about one block down for every five forward); look down to dive and
pick up speed, look up to slow down and sink less; left and right steer. **Warm air rises** over fire, lava and
lit furnaces and fireplaces (up a chimney too), lifting you strongly, and gently over desert sand on a sunny day.
Sneak, or jump again, to fold it. Landing under it is soft, unless you dive hard into the ground. Other players
see you hanging under it.

### Ziplines, boats, balloons and rail stations

- **Zipline posts** (2 from 2 logs and an iron) and **zipline rope** (2 from 6 string and an iron): with rope in
  hand, tap one post and then another up to 40 blocks away to run a line between them (taking one rope). Tap a
  post with a grappling hook in hand to slide along the line toward the post you're facing (faster downhill).
  Sneak to let go. Breaking a post gives its ropes back.
- A **boat** (5 planks, 2 sticks): tap water with it to put it in, tap the boat to get in. Hold forward to row the
  way you look and back to slow down; tap to get out. Hold on a boat (or balloon) to pick it up.
- A **hot-air balloon** (12 wool, 8 string, 4 planks, 2 iron, a lantern): put it on the ground and get in. Jump to
  rise and sneak to sink; it moves as you walk. Its burner uses a coal or charcoal from your inventory every 45
  seconds of flight, and sinks gently to the ground when it runs out.
- A **rail station** (2 from 2 rails, bricks, copper wire) is a straight rail where carts stop and wait until it
  gets a signal (a button beside it, say) or you push off. A cart that reaches the end of the line turns round.

### Machines and trains

- **Radio transmitter** and **receiver** (3 copper, 2 wire, a glass each): a receiver gives a signal while any
  transmitter on the same channel has one, however far apart they are. Tap either with an empty hand to change its
  channel (1-8).
- A **sorting machine** (3 tubes, 3 iron, an item frame) sends each thing that goes into it down the pneumatic
  tube with a matching item frame on it, or else down a tube with no frames.
- A **locomotive** (a minecart, 6 iron, a steam engine): put it on a rail and tap it with coal or charcoal (one
  coal lasts a minute). It couples on the carts standing behind it and pulls them along, waits a few seconds at
  each rail station and sets off again by itself (or at once on a signal), and stops at the end of the line. Ride
  it and hold back to stop, forward to start. Turning round leaves its train behind.

### Rope ladders and rope bridges

- A **rope ladder** (4 from 4 string and 3 sticks): tap the side of a block with it, or the top of a cliff edge
  looking out over it, and it unrolls straight down to the ground, a piece for each block. Tap the ladder with
  more to make it longer; cut it (or what it hangs from) and it rolls back up into your bag.
- A **rope bridge** (4 from 3 planks and 3 string): tap the edge of a gap looking across it and the bridge lays
  itself out to the far side, with rope rails, as long as you have pieces for it.

### Canal locks

- Build a walled **chamber** of water between two stretches of canal at different heights, with **lock gates**
  (2 from 6 planks and an iron) in its ends, and put a **sluice wheel** (a log, 2 planks, 2 iron) on its bank.
- Turn the wheel: every gate shuts, the chamber fills or drains a layer at a time to the level of the next
  canal, and then that canal's gate swings open. Float a boat in, turn the wheel, and float out at the other
  level. New achievement: **Lock Keeper**.

### Chest boats and tenders

- A **chest boat** (a boat and a chest) carries 18 slots. Open them with 🎒 while you row, or sneak and tap it.
- A storage cart coupled right behind a **locomotive** is its **tender**: the locomotive takes on coal or
  charcoal from it as it runs out.

## Animals and creatures

### Night creatures

Night creatures come out in the dark: on the surface at night, and in caves at any time, but never where torches
light the ground. **Gloomlings** are quick shadow imps, **mossbacks** are slow, hard-hitting stone golems, and
**thornspitters** keep their distance and spit thorns. Fight them by tapping (an axe hits hardest) or with the bow;
they drop coal, cobblestone or arrows. Caught in daylight, they dissolve. Four difficulty levels in the ☰ menu:
**Peaceful** (they roam but only fight back if you attack them), **Worrying** (easy), **Scary** (hard) and
**Terrifying** (nightmare).

### Animal breeding

Feed two animals of the same kind their food and they look for a mate (hearts show over them): seeds for ducks,
wheat for buffalo, alpacas, yaks and camels, berries for newts, seeds for chickens, berries or wheat for pigs, and
a fish for tame wolves and cats. A young one appears,
growing up over 5 minutes, and the pair won't breed again for 5 more. A baby of tame parents is tame. An **animal
station** with 2 or more of a kind's food in it feeds pairs nearby, so a pen keeps itself stocked. Animals won't
breed when there are 12 or more about.

### Cats, chickens, pigs and riding buffalo

- **Cats** wander the plains: tame one with fish and it follows you about (tap it to make it stay).
- **Chickens** lay an **egg** every few minutes: fry it in the oven, or bake a cake with 3 flour, 2 sugar and 2 eggs.
  They breed on seeds.
- **Pigs** root up a **truffle** now and then (a snack, and the trader buys them). They breed on berries or wheat.
- A **saddle** (3 leather, 2 string, an iron): tap a grown buffalo with it, then tap the buffalo to ride it. A
  saddled buffalo waits where you leave it.
- A young animal takes its coat colour from one of its parents (and now and then has a new one), so you can breed
  for the colours you like. Tame animals keep their coats when you come back to a world.
- **Quick-stack**: the button in the backpack puts everything (except your hotbar, tools and backpacks) that a chest
  within 6 blocks already holds into that chest. In a chest, **Stack matching** does the same for just that chest.
- **Splitting stacks**: right-click a stack (or tap it with two fingers) in the backpack or a chest to split off half,
  one, or any number into the next empty slot.

### Creatures

- **Deer** live in the woods and plains. They bolt when you come near, unless you creep up holding sneak. They
  breed on berries.
- At night **owls** come to sit in the treetops and hoot, turning their heads to watch you; they fly off if you get
  close. **Bats** flit about in caves and out over the land at dusk. On warm (spring and summer) nights
  **fireflies** blink over the grass.
- Swat a bat out of the air by hitting it, and no more come for half a minute. Bats leave **bat guano** now and
  then as they fly about under ground, and a swatted one drops some. Guano burns as fuel (a little under half as
  long as coal). Grind 3 with the mortar into saltpetre for gunpowder, or craft 1 into 2 fertiliser.
- An **apiary** (8 planks, 3 honeycomb, a glass) is a bee box that holds more honey than a wild hive (5 levels). When
  it's full, tap it to take 3 honeycomb and 2 **beeswax** (or, holding a bottle, a bottle of honey, 2 honeycomb and
  2 beeswax). Any honeycomb can be made into beeswax too. 2 beeswax and a string make 3 **beeswax candles**.
- Throw a **stick** (the drop key, Q by default) and a tame wolf that isn't staying runs after it and brings it back
  to your feet.
- Now and then of a morning, a tame **cat** nearby leaves you a present: a feather, string, a fish, seeds,
  berries... or an old boot.

### Horses and stables

- Wild **horses** roam the grassland in small herds, in six coats. Feed one apples, carrots or sugar until it
  trusts you (it can take a few), then put a **saddle** on it and ride: steer with the joystick or WASD, jump to
  leap, tap to get off. Every horse has its own **speed** and **jump**, shown when you mount it; feed two tame
  horses to breed them, and the foal takes after its parents.
- A **stable** (6 planks, 2 logs, 6 wheat, at a table): tap it and your tame horses come home to it and wait by
  the manger. It tells you each one's speed and jump.
- New achievement: **Giddy-up**.

### Horse gear and stables

- **Saddlebags** (4 leather, 2 string, a chest): tap your saddled horse with them. While you ride, 🎒 opens
  their nine slots.
- **Horse armour** (6 iron, 2 leather): while you ride, creatures do you half the harm.
- Tap a stable with **wheat** or a **hay bale** (9 wheat) to fill its manger. Horses kept there eat it and come
  out **rested**: 15% faster and jumping higher for five minutes of riding.

### Berries, wolves, camels and the trader

**Berry bushes** grow wild on grass. Tap a ripe one to pick 2–3 berries (2 food each); it grows more.
Break a bush to take it and plant it on grass or dirt.

**Wolves** roam the tundra. Feed one raw or baked fish and it may decide it likes you. A tame wolf
wears a red collar, follows you and chases any night creature that comes near. Tap it to make it stay,
and again to call it. **Camels** wander the desert. Feed one wheat to tame it, then tap it to ride (steer
as you'd walk, tap to get off). Pets are saved with your world and catch up if you leave them behind.

Now and then on a fine day, a **wandering trader** turns up nearby with four offers. Tap the trader to
trade: rare things like tungsten, electrum, gold and stainless steel for things you have plenty of. The
trader moves on after a few minutes.

## Villages and trade

### Village life and market stalls

- Villagers walk home at dusk and stay indoors through the night. Each morning the village **bell** rings
  (tap a bell to hear which village you're in).
- A **market stall** (6 planks, 4 logs, 3 wool) in a village: put things on it and passing villagers buy them for
  silver **coins**. Food, wine, cheese and pearls sell best. Traders take coins too.
- A village you trade with grows: after enough deals the villagers build a new house (up to six).

### Village requests, reputation and festivals

- Each village wants something new every day: tap its **bell** to hear what, and tap it again holding the goods
  to hand them over for coins.
- Trading, selling at a village's stall and filling its requests earn its good opinion. A **Neighbour** is
  welcome; a **Friend** pays a fifth less at its traders, and a **Hero** about a third less. New achievement:
  **Local Hero**.
- On the fourth day of every season each village holds a **festival** (Blossom Fair, Midsummer Feast, Harvest
  Festival, Frost Fair): decorations go up round the well, stalls and requests pay double, the villagers stay up
  late, and **fireworks** go up after dark. Make your own fireworks (3 from a paper and a gunpowder) and tap with
  one in hand to send it up.
- **Snowmen** (3 snow, a carrot, a coal, 2 sticks) face you when you place them, and melt when spring comes.

## Survival, dungeons and exploration

### Enchanting, meals, ailments and lairs

An **enchanting altar** (4 obsidian, 4 crystal shards and a gold ingot) puts enchantments on what you hold:
**Swift** (tools dig 40% faster), **Sturdy** (wears half as fast), **Keen** (weapons hit 3 harder, needs a sun
scarab), **Flame** (sets creatures alight, needs an ember core) and **Warmth** (armour keeps out the cold,
needs a frost heart). Enchanted things glow in the inventory.

A meal worth 6 or more food leaves you **well fed** for a while: hunger drains half as fast, and you heal
quicker. Spiders **poison** you; staying out in the tundra cold (or a winter night) **chills** you, slowing you
down until you warm up by a fire, wrap up or drink honey tea; and the desert sun at midday brings on
**heatstroke**, which makes you hungry fast, until you find shade or water. Healing tea cures all three.

Besides the Mossback King's dungeons there are three **lairs**: desert **tombs** (watch for dart traps on the
pressure plates) guarded by the **Dune Warden**, tundra **crypts** with the **Frost Wraith**, and deep
**fortresses** with the **Ember Lord**. Each guardian drops a treasure for the altar, and the crown it guards
protects you from sun, cold or fire. A bed now lets you sleep through a storm too, by day or night.

### Dungeons and the Mossback King

Rare rooms of mossy stone bricks lie deep underground (about one in forty chunks, between heights 8 and
34), with a glowing **shrine** in the middle and a chest or two of loot: ingots, gunpowder, silver arrows,
teas, sometimes a shield. Come near the shrine and its guardian, the **Mossback King**, rises to meet you.
He's huge, slow and hits very hard, with a health bar at the top of the screen. Beat him for his
**crown** (a helmet worth 5 armour points) and gold, and the shrine falls quiet. Leave and come back
and he's waiting again.

### Volcanoes, ruins, shipwrecks and meteorites

- **Volcanoes** are basalt cones with a lava crater and an obsidian rim; their rock is rich in tungsten and uranium.
- **Ruins** of old stone houses stand on flat grassland, with a loot chest of books, paper, maps, a journal and old
  iron tools, and sometimes a bookshelf.
- **Shipwrecks** lie on the deep sea bed, with a chest of gold, a compass, maps, gunpowder and fish.
- Once on some clear nights a **meteorite** streaks down 30 to 70 blocks away (a message tells you which way). It
  blasts a crater and leaves glowing **meteorite** rock: mine it with a tungsten pickaxe or better for **meteoric
  iron**. The arc furnace makes it into **starsteel**, for the best pickaxe, axe, shovel and sword of all.

### Lighthouses, maps, treasure, mist and snow

- **Lighthouses** stand here and there on the coast: red and white towers with a ladder up inside, a gallery round
  the top and a **lighthouse lamp** whose beams sweep round at night. The keeper's chest at the bottom often holds
  a treasure map. Make your own lamp from a lantern, 4 glass and 2 gold.
- An **explorer's map** (a map, a compass, a gold ingot): while you carry one, the ruins, shipwrecks, lighthouses,
  volcanoes and villages you come near are marked on the world map.
- A **treasure map** (from lighthouse and shipwreck chests): tap with it in hand to read it. It tells you how far
  and which way the treasure is, and marks the spot with an X on the world map. Dig down there for a chest of gold,
  silver, crystal and sometimes starsteel.
- Some mornings a **mist** lies in the valleys, thickest at dawn and gone by mid-morning (thinner up high).
- While it snows, **snow settles** on the ground and on the trees under the open sky, and melts away again when
  winter is over (but not in the tundra).

### Sunken temples and sky islands

- **Sunken temples** lie on the sea bed: a vault with three levers in front. Set the levers right (the lamps over
  them hint which) and the gate opens on a chest of pearls, coins, gold, sea lanterns and sometimes diving gear.
- **Sky islands** float high over the land, with coloured pressure plates round a vault: step on them in the
  right order to open it.
- **Diving gear**: a **diving helmet** (5 copper, 2 glass) makes your air last five times as long, **flippers**
  (4 leather, a slime) make you swim faster, and an **air pump** (4 iron, 2 copper, 2 leather, a pipe) fills your
  air up while you're near it underwater. **Sea lanterns** (2 glass, a pearl) light the deep.
- New achievement: **Open Sesame**, for opening a temple's or an island's vault.

## Inventory and recipes

### Recipes, sorting and the map

Search recipes by name (of what they make, or what goes in) at the top of the crafting list, tap ☆ to
favourite a recipe (favourites come first), and use ★ and ✓ to show only favourites or only what you can
make right now. **Sort backpack** (and **Sort** in a chest) stacks things up and puts them in order.

**Throwing things.** Press Q (Shift + Q for the whole stack), or hold a hotbar slot, to throw what you're
holding. It lies on the ground until you walk over it (things you've just thrown wait a moment first) and
vanishes after five minutes. A thrown item that lands on a running **conveyor belt** rides off along it, and
one that lands on a **hopper** drops in (sorting hoppers still only take what matches their frames). You can
also tap a belt or hopper holding an item to put it straight in. Breaking a chest, oven or machine **spills**
what was inside onto the ground, with enchantments and wear kept.

Tooltips (on by default, ☰ → Tooltips) name what the crosshair is on. In 🎒 they show the name and details of
the item under the mouse or the one you tap. Hover over a crafting recipe's ingredients or result, or a slot in
a chest or machine window, to see the same details.

If something you pick up won't fit in your inventory, it drops at your feet instead of being lost: make room
and walk over it to pick it up (loose items vanish after five minutes).

Holding the map, tap a sign to mark it on the map (named by its first line), or a bed. Tap it again
to take the mark off. Marks off the edge of the map show as arrows pointing toward them.

### The backpack and chests

- **Double-tap** a slot to gather the same things from the rest of your backpack (and the chest, if one is open)
  into that stack.
- **Shift-click** a slot (or **press and hold** it on a touch screen) to send the whole stack across: between the
  hotbar and the backpack, or between your backpack and an open chest or machine.
- Each item's tip says what it's **used in**.
- A **compass** now also shows the way to your nearest map waypoint.
- New achievement: **X Marks the Spot**, for digging up buried treasure.

### Finding things and taking pictures

- **Find in chests nearby**: type in the box under your backpack, and it lists every chest, barrel, urn, stall
  and net within 32 blocks that holds something matching, with how far and which way. **Show** marks it with a
  gold outline and a beam; **Take** (when it's in reach) moves what matched into your backpack.
- **Photo mode** (☰ → 📷 Photo mode, or F2): the HUD goes, the world holds still around you and the camera floats
  free (up to 48 blocks from you) so you can frame a shot. 📷 (or Enter) saves it as a PNG.

## Guidebook and music

### The guidebook

- Press **G** or tap 📖 for the **guidebook**: 11 chapters of goals, from your first log to a reactor and a
  logistics network. Goals tick themselves off as you reach them. Each one shows how its item is made and has a
  small reward to claim. A gold dot on 📖 means a reward is waiting. A chapter opens once half of the one before
  it is done.

### Music

- Quiet music now plays, made as you listen, in a mood to suit where you are: day, night, caves, under water,
  villages, festivals and winter. Set its volume with the **Music** slider in the menu (0 turns it off).

## Worlds, creative mode, the map and achievements

☰ → **Worlds…** holds three worlds. Play any of them, start a new **survival** or **creative** world in a slot,
**Export** a world to a file (to keep it, or move it to another device) and **Import** one into a slot.

In **creative mode** you can't be hurt or get hungry, blocks break at once and are never used up, and 🎒
has a **palette** of every block and item (the recipe search filters it). Press F (or 🕊) to fly. The
**copy wand** (in the palette) copies builds of up to 32,768 blocks: tap one corner, then the opposite corner,
then tap wherever you want copies. Made a mistake? **Ctrl + Z** (or the ↶ button) undoes your last place,
break or paste, up to 64 steps back. Switch a world between survival and creative under ☰ → Game mode.

The **world map** (M, ☰ → World map, or tap the corner map) shows all the land you've explored. Drag to look
around, pinch or scroll to zoom, and tap to put down a waypoint (or tap one to take it away). Waypoints show
on the hand-held map too.

☰ → **Guide & achievements** lists 31 achievements for each world (with a pop-up as you earn them) and a short
guide to how everything works.

## Recent fixes

- Leaves from a fruit tree drop that fruit tree's saplings, not oak saplings.
- Plants grow more slowly: crops take about 10 minutes (most of a 12-minute game day) to ripen, saplings about 15 minutes to grow
  into trees, and fruit about 10 minutes to come back. Rain, bees and sprinklers still speed them up, but less,
  and nothing grows almost at once any more. A night's sleep grows plants the same as the time it skips.

## Version history

- **Version 48** (in progress: speed): the world's shader is built with only the graphics effects that are
  switched on, so with effects off it is much faster again (about 5× in tests, faster than Version 45). With
  every effect off, the sun's shine on metal, ice and wet ground is off too; it's back from Low up. Changing a
  graphics setting can pause the game for a moment while the shader is rebuilt. A **Resolution** setting
  (☰ → Graphics): Auto draws phones at 1 pixel per screen point rather than 1.5 (about half the pixels on a
  sharp phone screen) and draws fewer while the game runs slowly, before the Auto graphics preset turns
  effects off; or pick a fixed level from 0.5× to 2×. Performance info shows the resolution in use.
  Chunks are now built in background workers, so walking into new land no longer stutters while their
  blocks are turned into triangles (browsers without module workers build them as before, twice as fast).
- **Version 47**: **volumetric god rays** (a third God rays setting: sunbeams in the air through roofs,
  windows and trees, from any angle, coloured by stained glass; classic stays for slower computers);
  **Cloud shadows**; path tracing: lava and every nearby light (in the sun too) light what's round them,
  reflections on metal, ice, glass, wet ground and water, and light in the air (sunbeams, the glow round lamps
  and lava).
- **Version 46**: **mirrors** (live reflections, joined across a wall of them; a **Live mirrors** switch in
  ☰ → Graphics), **security cameras** and **monitors** (joined into big screens, each tuned to a camera);
  light through **stained glass** takes on its colour (torch light always, sunlight with sun shadows on);
  softer sun shadow edges the farther a shadow falls (high sun shadows); sun glints on metal, ice and glass,
  and on wet ground after rain; a **Colour bleed** switch in ☰ → Graphics;
  **blocks** of every metal (9 ingots each, and back);
  **Torch light shafts** (a slider in ☰ → Graphics: light hanging in the air around the nearest lights, cut into
  beams by bars, doorways and pillars, and coloured by stained glass they shine through);
  **Traced lighting** (exact block shadows from the sun, shade in corners, sky light and reflections, traced
  through a 3D copy of the blocks around you);
  **Path tracing (WebGPU)** (sun, sky, bounced light and the nearest lights all traced, with animals and you
  traced at your real shape, slabs, stairs and fences casting their true shadows, and light coming through glass,
  stained glass and water);
  placing a gearbox or electric motor no longer turns it into a clutch or solar panel; a metal recipe
  (like the iron-banded chest) shows once you have that metal's plates, or everything it needs, not only its ingots.
- **Version 45**: gears mesh at corners (axles at right angles) and large gears mesh in pairs; a **Distance
  fog** switch in ☰ → Graphics; your own shadow in first person; in survival a short pause after each block
  breaks while you hold on, so you don't dig the one behind it by accident; closing a window with its key
  (E, M, G) takes the mouse back for looking, as its ✕ does; steel, stainless steel, tungsten and uranium need a blast
  smelter (or an electric smelter or arc furnace), not a plain smelter; a torch's flame glows the same on all four sides,
  and the fire in a lit oven, smelter or kiln glows (and blooms) like a flame.
- **Version 44**: the **glider** (wear it, jump in mid-air to open it, ride warm air over fires and lava);
  the sea comes alive: deep ocean in tall worlds, coral reefs, sea grass and kelp, schools of fish, jellyfish,
  sea turtles and dolphins; the **record player**; the **armour stand**; and **undo** in creative mode.
- **Version 43**: a taller world. Worlds are now 128 blocks high. New worlds sit higher, with the sea at 56,
  far deeper rock, caves and ore below it, and mountains to 116; worlds made before keep their ground as it was
  and gain 64 blocks of building room above. Clouds moved up to 136.
- **Version 42**: sprinting (double-tap forward, R, or push the touch stick past its rim); a PvP switch for
  multiplayer, the host's to flip; distant land: a blocky sketch of the world past the loaded chunks, out to
  the horizon.

- **Version 41**: only the shining parts of a light glow (uranium ore's flecks, not its stone); glowing plants
  lose a faint outline; you point at what's really in a cell (a torch's stick, a ladder, a flower), so you can
  aim past it, and the outline fits it; clouds; tall plants sway as one.

- **Version 40**: torch flames, lantern glass, lamps and other lights glow (and bloom), and look lit in
  daylight; a **Torch shadows by day** option; closing a window with its ✕ takes the mouse back for looking.
- **Version 39**: playing together grows up: a host keeps the time and weather for everyone, chests, machines,
  signs and frames are shared, crops, machines and creatures are run by the nearest player's game and seen by
  all, pets stay with their owners, things on the ground are shared (one player gets each), and the night
  passes when everyone's in bed.
- **Version 38**: you see what you hold (and your arm), your own character in a third-person view (V) with
  a choice of looks, working sounds for every machine, graphics presets with an Auto setting, gamepad support,
  ripples, wakes and splashes on the water, and playing together through the new Node.js server.
- **Version 37**: more fancy graphics: a low-cost setting for sun shadows, torch shadows for up to 50 lights
  with a redraw-rate slider, god rays, swaying leaves and plants, water reflections and an underwater ripple.
- **Version 36**: optional fancy graphics in the ☰ menu, all off by default: sun shadows, shadows from the
  nearest 1 to 5 torches and lamps, bloom, a water
  surface with waves, reflections and sun glints, water refraction, and caustics under sunlit water.
- **Version 35**: the carpenter and crates (9 of a thing to a crate, 64 crates to a slot), the distillery (whisky,
  rubbing alcohol and bandages, biofuel), things that don't fit in a full inventory drop at your feet instead of
  vanishing, bats can be swatted, bat guano (fuel, saltpetre, fertiliser), tooltips in crafting lists and machine
  windows, and a fix for the view sometimes spinning round when you move the mouse.
- **Version 34**: pork and chicken from farmed pigs and chickens, cream, ice cream and ice lollies, vinegar and
  pickles, smoking in the chimney, the drying rack, oven dishes (pizza, carrot cake, pumpkin bread, cheesy jacket
  potato), toffee and honey candy in the mould, coffee, rice and chillies and their dishes, treats at the market
  stall, and festival food contests.
- **Version 33**: cocoa trees, cocoa beans and powder, chocolate milk and hot chocolate, melted chocolate and the
  chocolate mould, chocolate bars, chocolate cake (eaten a slice at a time), chocolate cookies and cherries.
- **Version 32**: rubber and polymers (tree taps, latex, rubber, hide glue, the polymer press), insulated wire
  and the wire power limit, coloured polymer blocks, lumen panels, bounce pads, padded boots, polymer tools
  and the polymer boat, and demolition charges with a detonator.
- **Version 31**: bee breeding (bee scoops, bee houses, sixteen kinds of bee and their mutations, frames), the
  comb centrifuge, and honey drops, propolis, pollen, royal jelly, mead, honey cake and honeyed apples.
- **Version 30**: logistics signals (the stock sensor pipe and junctions that pause), liquid pipes, courier
  drones, liquid returns and sinks, bottlers, and drone pads that keep their networks loaded.
- **Version 29**: the guidebook, generated music, and logistics pipes.
- **Version 28**: ore washing, trace metals, slag, sieves, charcoal piles, cobblestone generators, machine
  upgrades, horse gear, honey varieties, fine crops and shows, bait and fish traps, chest boats and tenders.
- **Version 27**: horses and stables, village requests and reputation, festivals, new crops, cider and berry wine,
  cellars, kilns, rope ladders and bridges, canal locks, caves, and photo mode.
- **Version 26**: village life and market stalls, thunderstorms, more crops and crop rotation, the winery and
  cheese press, sunken temples and sky islands, diving gear, radios, a sorting machine, trains, fireplaces,
  pinned recipes and auto-refill.
- **Version 25**: decorating, fruit trees, the cooking pot, greenhouses, scarecrows, lighthouses, explorer and
  treasure maps, mist and snow, deer, owls, bats, fireflies, the apiary, belts, pneumatic tubes, cable cars, and
  inventory shortcuts.
- **Version 24**: bookshelves, the journal and compost, nuclear waste and radiation, tesla coils, electric fences,
  the arc furnace, the freezer, ziplines, boats, balloons, rail stations, volcanoes, ruins, shipwrecks, meteorites,
  cats, chickens, pigs, riding buffalo, and quick-stack.
- **Versions 19–23**: caves, enchanting and survival, signals, item logistics, drive belts, tanks, farms, the
  electricity grid, electric machines and tools, the 32 × 32 atlas, uranium and the reactor, and chainsaws and books.

## Code layout

| File | Purpose |
| --- | --- |
| `js/blocks.js` | Block & item definitions, break times, drops, recipes |
| `js/textures.js` | Procedural texture atlas, item icons, break cracks |
| `js/terrain.js` | Chunk-by-chunk terrain generation (every block is a pure function of seed and position) |
| `js/world.js` | Chunk streaming, sunlight and torch light propagation across chunks, sending chunks to be meshed (in workers) and showing the results, water flow, raycasting |
| `js/mesher.js`, `js/mesh-worker.js` | Chunk meshing (face culling + AO + smooth light, separate water mesh) from a snapshot of a chunk and its border; the shapes of fences, walls, wires, stairs and water surfaces. The worker runs it off the main thread |
| `js/store.js` | Saving edited chunks to IndexedDB, per world slot (16 bits per block; older one-byte chunks are widened as they load) |
| `js/legacy.js` | The old 128 × 128 generator, used once to migrate old saves |
| `js/held.js` | What you hold: blocks and items as solid shapes, your arm (first person) and your character (third person, and other players) |
| `js/ripples.js` | Rings, wakes and spray on the water |
| `js/net.js` | Multiplayer: talking to the server and showing the other players |
| `server/server.js` | The multiplayer server (Node.js, no packages): serves the game and keeps the shared world |
| `js/player.js` | Player physics, collision (with half-height blocks and stepping up stairs) and swimming |
| `js/mobs.js` | Animals, pets, the trader, night creatures and the Mossback King: box models, behaviour and hunting, physics, spawning, difficulty |
| `js/arrows.js` | Arrows and thorns: flight, hits, sticking in blocks, pick-up |
| `js/fishing.js` | Fishing: the bobber's cast, bites and the line |
| `js/stations.js` | Ovens, smelters, blast smelters, chests, the auto-crafter and the shaft-driven machines that make things: their contents, fuel, recipes and cooking |
| `js/kinetics.js` | Water wheels, windmills, shafts, gears, gearboxes, clutches, gear shifts, flywheels and drive belts: power networks, gear ratios, load, and the turning models |
| `js/machines.js` | Pumps, pipes, valves, tanks and sprinklers, drills, filament lamps, hoppers, collectors, ejectors, belts (splitting and sorting), bucket elevators, sensors (observers, gauges, power meters, daylight sensors, item counters), the farm machines, quarries, spawners and teleport pads |
| `js/logic.js` | Copper wire and the logic blocks: inverters, delay blocks and latches |
| `js/electric.js` | Electricity: generators, solar panels, wind turbines, wire and cable, grid batteries, and what runs on it (lamps, pulverizers, smelters, chargers, motors, teleport pads, quarries) |
| `js/carts.js` | Minecarts and storage carts: rolling along rails, slopes, powered and loader rails, rail stations, riding |
| `js/vehicles.js` | Boats and hot-air balloons: floating, rowing, rising on coal, and riding |
| `js/signs.js` | Sign text (and its colour) and the panels that show it |
| `js/frames.js` | Item frames: what each holds, the pictures in them, and hopper filters |
| `js/weather.js` | Rain, snow and sandstorms: when they come, and the falling particles |
| `js/minimap.js` | The map you hold: the land drawn from above |
| `js/drops.js` | Loose items on the ground: throwing, bouncing, pick-up, and riding belts or dropping into hoppers |
| `js/worldmap.js` | The full-screen world map: explored chunks, panning, zoom and waypoints |
| `js/achievements.js` | The list of achievements |
| `js/logistics.js` | Logistics pipes: building networks, providers, crafting chains, suppliers, sinks, extractors, and items in transit |
| `js/guidebook.js` | The guidebook's chapters and goals |
| `js/music.js` | The generated music and its moods |
| `js/bees.js` | Bees buzzing around their hives |
| `js/apiculture.js` | Bee breeding: queens at work in bee houses, combs, young bees and mutations |
| `js/birds.js` | Crows that come down to eat ripe wheat, and the scarecrows that keep them off |
| `js/critters.js` | Owls, bats and fireflies |
| `js/sealife.js` | Fish, jellyfish, sea turtles and dolphins |
| `js/paintings.js` | Paintings: the pictures and the panels that show them |
| `js/sky.js` | Day/night cycle: sky colour, fog, sun, moon, stars, world brightness |
| `js/farland.js` | Distant land: a blocky sketch of the terrain past the loaded chunks, built from the generator a few tiles at a time |
| `js/sound.js` | Web Audio sound effects |
| `js/controls.js` | Touch joystick / look / tap / hold, plus desktop input and key bindings |
| `js/inventory.js` | 36-slot inventory |
| `js/main.js` | Rendering, game loop, HUD, crafting UI, saving |
