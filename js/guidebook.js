// The guidebook: chapters of goals that lead you through the game, from your first log to a nuclear reactor.
// Goals tick themselves off as you reach them (main.js checks them about once a second), and each has a small
// reward to claim. A chapter opens once enough of the one before it is done.
//
// A goal's `check` is one of:
//   { has: id }            have one in your inventory (or [id, ...]: any of them)
//   { count: [id, n] }     have n of it at once
//   { ach: 'id' }          earn that achievement
//   { fn: 'name' }         a test main.js knows (see GOAL_TESTS there)
import * as B from './blocks.js';

const shaft = B.kineticId('shaft', 0), gear = B.kineticId('gear', 0);
const has = (id) => ({ has: id }), count = (id, n) => ({ count: [id, n] }), ach = (id) => ({ ach: id }), fn = (name) => ({ fn: name });

// [id, chapter title, chapter it follows (or -1), [goals]]; a goal is [id, name, check, hint, [reward id, n]]
const CHAPTERS = [
  ['start', 'First Steps', -1, [
    ['log', 'Timber!', has(B.LOG), 'Hold still on a tree trunk to punch out a log.', [B.APPLE, 2]],
    ['planks', 'Planks', count(B.PLANKS, 8), 'Open 🎒 and turn logs into planks: four from each.', [B.STICK, 8]],
    ['table', 'A Place to Work', has(B.TABLE), 'Make a crafting table from planks in 🎒, then put it down and tap it to make tools.', [B.PLANKS, 8]],
    ['woodpick', 'Wooden Pickaxe', has(B.WOOD_PICK), 'Planks and sticks at the table. Now you can dig stone.', [B.TORCH, 4]],
    ['stonepick', 'Stone Age', has(B.STONE_PICK), 'Cobblestone and sticks make a tougher pickaxe that can mine iron.', [B.BREAD, 3]],
    ['torches', 'Light the Way', count(B.TORCH, 8), 'Coal (or charcoal) and sticks make torches. Night creatures avoid the light.', [B.COAL, 6]],
    ['bed', 'Somewhere to Sleep', has(B.BED), 'Wool and planks at the table. Sleep through the night, and wake here if you die.', [B.BREAD, 4]],
  ]],
  ['settle', 'Settling In', 0, [
    ['oven', 'Home Cooking', has(B.OVEN), 'An oven bakes bread and cooks meat and fish. It burns wood or coal.', [B.COAL, 8]],
    ['smelter', 'Smelting', has(B.SMELTER), 'A smelter turns ore into ingots. Feed it coal or charcoal.', [B.COAL, 8]],
    ['iron', 'Iron', has(B.IRON_INGOT), 'Mine iron ore with a stone pickaxe and smelt it.', [B.IRON_INGOT, 2]],
    ['metalpick', 'Metalworker', ach('metalpick'), 'Make a pickaxe from metal: it digs faster, lasts longer and can mine the harder ores.', [B.TORCH, 16]],
    ['chest', 'Storage', has(B.CHEST), 'A chest keeps things safe. Sort and quick-stack from its panel.', [B.PLANKS, 16]],
    ['armour', 'Dressed for Trouble', fn('armour'), 'Make a piece of armour and wear it: tap its slot in 🎒.', [B.HEAL_TEA, 1]],
    ['sleep', 'Sweet Dreams', ach('sleep'), 'Sleep in your bed at night.', [B.BREAD, 4]],
  ]],
  ['farm', 'Farm and Food', 1, [
    ['seeds', 'Seeds', has(B.SEEDS), 'Break tall grass for seeds, and plant them on dirt or grass near water.', [B.SEEDS, 8]],
    ['wheat', 'Harvest', has(B.WHEAT), 'Ripe wheat is golden. Bake three into bread.', [B.FERTILISER, 4]],
    ['bucket', 'Water Carrier', has(B.BUCKET), 'Iron makes a bucket for water, milk or lava.', [B.IRON_INGOT, 2]],
    ['fish', 'Gone Fishing', ach('fish'), 'Make a fishing rod, cast into water and tap when the bobber plunges.', [B.WORM, 6]],
    ['cookpot', 'A Proper Meal', has(B.COOK_POT), 'The cooking pot makes stews and soups that keep you fed for longer.', [B.CARROT, 6]],
    ['eat', 'Square Meal', ach('eat'), 'Eat a hearty meal and feel well fed.', [B.CAKE, 1]],
    ['tame', 'Best Friend', ach('tame'), 'Tame an animal: a wolf with fish, a cat, or a camel with wheat.', [B.RAW_FISH, 4]],
  ]],
  ['deep', 'Into the Deep', 1, [
    ['deep', 'Deep Down', ach('deep'), 'Dig down near the bottom of the world. Take torches.', [B.TORCH, 16]],
    ['copper', 'Copper', has(B.COPPER_INGOT), 'Copper ore is orange-flecked. It makes wire and bronze.', [B.COPPER_INGOT, 4]],
    ['tin', 'Tin', has(B.TIN_INGOT), 'Tin ore is pale grey. Alloy it with copper.', [B.TIN_INGOT, 2]],
    ['bronze', 'Bronze', has(B.BRONZE_INGOT), 'Copper and tin together in the smelter make bronze, for gears and better tools.', [B.BRONZE_INGOT, 2]],
    ['crystal', 'Crystal Clear', has(B.CRYSTAL_SHARD), 'Crystal grows deep underground. It makes the best tools.', [B.CRYSTAL_SHARD, 1]],
    ['map', 'Cartographer', has(B.MAP), 'A map shows the land you have seen. Open it with M.', [B.COMPASS, 1]],
  ]],
  ['wheels', 'Turning Wheels', 3, [
    ['wheel', 'Power from Nature', has([B.WATER_WHEEL, B.WINDMILL]), 'A water wheel in flowing water, or a windmill up high, turns the shafts beside it.', [shaft, 8]],
    ['shaft', 'Shafts', has(shaft), 'Shafts carry turning power along. Gears turn it round corners.', [gear, 2]],
    ['crusher', 'Crusher', has(B.CRUSHER), 'A turned crusher grinds ore into dust: two from each ore.', [B.COAL, 8]],
    ['mill', 'Millstone', has(B.MILLSTONE), 'Grinds wheat into flour and more.', [B.WHEAT, 8]],
    ['saw', 'Sawmill', has(B.SAW), 'A powered saw gets more planks from each log.', [B.LOG, 8]],
    ['belt', 'On the Move', has(B.BELT), 'Belts carry things along. Hoppers drop them into machines.', [B.HOPPER, 2]],
  ]],
  ['steam', 'Steam and Steel', 4, [
    ['steel', 'Steel', has(B.STEEL_INGOT), 'Iron and coal in a blast smelter make steel.', [B.STEEL_INGOT, 2]],
    ['engine', 'Full Steam', ach('engine'), 'A steam engine burns fuel and needs water: more power than any wheel.', [B.COAL, 16]],
    ['drill', 'Mining Drill', has(B.DRILL), 'A turned drill bores out the blocks in front of it.', [B.TORCH, 16]],
    ['crafter', 'Auto-crafter', has(B.AUTO_CRAFTER), 'It crafts by itself from what you feed it. A programmable crafter follows the recipe on its item frame.', [B.STEEL_INGOT, 2]],
    ['washer', 'Ore Washer', has(B.WASHER), 'Wash dirty dust for clean dust and a chance of trace metals. It needs water touching it.', [B.SPEED_UPGRADE, 1]],
    ['trace', 'Hidden Riches', ach('trace'), 'Wash ore until a trace of another metal turns up: silver from lead, gold from copper...', [B.GOLD_INGOT, 2]],
  ]],
  ['rails', 'Rails and Rides', 2, [
    ['rail', 'Railway', count(B.RAIL, 16), 'Rails from iron and sticks. They curve and slope by themselves.', [B.RAIL, 16]],
    ['cart', 'All Aboard', ach('cart'), 'Put a minecart on the rails and tap it to ride.', [B.POWERED_RAIL, 4]],
    ['loco', 'Locomotive', has(B.LOCOMOTIVE), 'It burns coal and pulls the carts coupled behind it. A storage cart right behind is its tender.', [B.COAL, 16]],
    ['boat', 'Afloat', has([B.BOAT, B.CHEST_BOAT]), 'Put a boat on water and row the way you look.', [B.FISH_TRAP, 1]],
    ['horse', 'Giddy-up', ach('horse'), 'Win a wild horse over with apples or carrots, saddle it and ride.', [B.HAY_BALE, 2]],
    ['balloon', 'Up and Away', has(B.BALLOON), 'A hot-air balloon rises on coal: jump to climb, sneak to sink.', [B.COAL, 16]],
  ]],
  ['electric', 'Electricity', 5, [
    ['generator', 'Generator', has(B.GENERATOR), 'Turn a generator with a shaft to make electricity.', [B.WIRE, 16]],
    ['wire', 'Wired Up', count(B.WIRE, 8), 'Wire carries power from generators to machines.', [B.WIRE, 16]],
    ['battery', 'Battery', has(B.GRID_BATTERY), 'Stores power for when the wheels stop.', [B.ELECTRUM_INGOT, 2]],
    ['esmelter', 'Electric Smelter', has(B.E_SMELTER), 'Smelts with no fuel at all.', [B.IRON_INGOT, 4]],
    ['pulverizer', 'Pulverizer', has(B.PULVERIZER), 'Grinds ore faster than a crusher.', [B.YIELD_UPGRADE, 1]],
    ['solar', 'Sunshine', has([B.SOLAR_PANEL, B.WIND_TURBINE]), 'Solar panels and wind turbines make power for free.', [B.GRID_BATTERY, 1]],
    ['jackhammer', 'Jackhammer', has(B.JACKHAMMER), 'A battery tool that breaks stone in a moment. Charge it at a charger.', [B.SPEED_UPGRADE, 1]],
  ]],
  ['logistics', 'Logistics', 7, [
    ['pipes', 'Logistics Pipes', has(B.LP_PIPE), 'Tubes, gold and wire make logistics pipes: a network that sends things where they\'re wanted.', [B.TUBE, 8]],
    ['provider', 'On Offer', has(B.LP_PROVIDER), 'A provider pipe on a chest offers what\'s in it to the network.', [B.CHEST, 2]],
    ['power', 'Power Junction', has(B.LP_POWER), 'Nothing moves without one on the network, wired to the grid.', [B.WIRE, 16]],
    ['table', 'Request Table', has(B.LP_TABLE), 'Order anything the network has, or can make, and it\'s brought to the table.', [B.GLASS_PANE, 4]],
    ['crafting', 'Crafting Pipe', has(B.LP_CRAFTING), 'On an auto-crafter or a machine, it lets the network make things: ingredients first.', [B.AUTO_CRAFTER, 1]],
    ['order', 'Supply Chain', ach('logistics'), 'Order something at a request table.', [B.GOLD_INGOT, 2]],
    ['remote', 'From Afar', has(B.REMOTE_ORDERER), 'Link a remote orderer to a request table and order from anywhere nearby.', [B.CRYSTAL_SHARD, 1]],
    ['sensor', 'Running Low', has(B.LP_SENSOR), 'A stock sensor pipe signals while the network runs short of something: wire it to a lamp, or a machine.', [B.WIRE, 8]],
    ['liquid', 'Liquid Assets', has([B.LP_FPROVIDER, B.LP_FSUPPLIER]), 'Liquid pipes fill tanks, and feed lava to ovens, smelters and engines.', [B.TANK, 1]],
    ['bottler', 'Bottled Up', has(B.BOTTLER), 'A bottler fills buckets from the liquid piped into it, to store in chests.', [B.BUCKET, 4]],
    ['courier', 'Air Mail', ach('courier'), 'Drone pads on the same channel join two networks: couriers fly between them.', [B.CRYSTAL_SHARD, 1]],
  ]],
  ['village', 'Village Life', 2, [
    ['trade', 'Fair Trade', ach('trade'), 'Find a village and trade with a villager, or a wandering trader.', [B.COIN, 4]],
    ['coin', 'Coins', count(B.COIN, 10), 'Sell at a market stall and fill the villages\' daily requests for coins.', [B.COIN, 5]],
    ['stall', 'Market Day', has(B.MARKET_STALL), 'Villagers buy what you put on your stall and pay into it.', [B.COIN, 5]],
    ['wine', 'Winemaker', has([B.WINE, B.CIDER, B.BERRY_WINE]), 'Press grapes, apples or berries, and age the juice in a barrel.', [B.GRAPES, 6]],
    ['cheese', 'Cheesemaker', has(B.CHEESE), 'Press curds in a cheese press and let them age.', [B.MILK_BUCKET, 1]],
    ['fine', 'Prize Grower', ach('fine'), 'Grow crops in good soil until one comes up fine. Show three at a festival.', [B.FERTILISER, 8]],
    ['hero', 'Local Hero', ach('hero'), 'Earn a village\'s highest regard. Heroes get special trades.', [B.COIN, 15]],
  ]],
  ['bees', 'Busy Bees', 2, [
    ['scoop', 'Bee Scoop', has(B.BEE_SCOOP), 'Sticks and wool make a scoop for catching the bees in a wild hive with honey in it.', [B.WOOL, 3]],
    ['catch', 'Caught a Colony', ach('bees'), 'Scoop a wild hive for a princess and drones. The land decides what kind they are.', [B.HONEYCOMB, 2]],
    ['house', 'Bee House', has(B.BEE_HOUSE), 'Put a princess and a drone in a bee house among flowers, and they make combs.', [B.WOODEN_FRAME, 2]],
    ['spinner', 'Comb Centrifuge', has(B.COMB_CENTRIFUGE), 'Turn it with a shaft to spin combs into honey drops, beeswax and more.', [B.HONEYCOMB, 4]],
    ['mutation', 'New Blood', ach('mutation'), 'Mate a princess with a drone of a different kind: some pairs breed a new kind of bee.', [B.WAXED_FRAME, 1]],
    ['mead', 'Mead Hall', has([B.MEAD, B.FINE_MEAD]), 'Press honey drops into must at the wine press and age it in a barrel.', [B.HONEY_DROP, 8]],
  ]],
  ['polymer', 'Rubber and Polymers', 4, [
    ['tap', 'Sticky Fingers', ach('latex'), 'Put a tree tap against a trunk and collect the latex that drips into it.', [B.LATEX, 4]],
    ['rubber', 'Rubber', has(B.RUBBER), 'Cure latex in an oven for rubber.', [B.RUBBER, 2]],
    ['press', 'Polymer Press', has(B.POLYMER_PRESS), 'Turn a polymer press with a shaft: sawdust and hide glue become pellets, then sheets.', [B.HIDE_GLUE, 2]],
    ['inswire', 'Insulated Wire', has(B.INSULATED_WIRE), 'Sheathe electrum wire in rubber: it carries twice the power.', [B.INSULATED_WIRE, 4]],
    ['bounce', 'Bounce Pad', has(B.BOUNCE_PAD), 'Rubber on planks: land on it to bounce back up.', [B.RUBBER, 2]],
    ['boots', 'Soft Landing', has(B.PADDED_BOOTS), 'Padded boots take the harm out of falls.', [B.POLYMER_SHEET, 2]],
    ['boom', 'Controlled Demolition', ach('demolition'), 'Link demolition charges to a detonator, stand well back, and set them off.', [B.DEMO_CHARGE, 2]],
  ]],
  ['cocoa', 'Chocolate', 2, [
    ['pod', 'Cocoa Pods', has(B.COCOA_POD), 'Cocoa trees grow in the warm land by the deserts. Pick their ripe pods.', [B.SUGAR, 4]],
    ['powder', 'Cocoa Powder', has(B.COCOA_POWDER), 'Split pods for beans, roast them in an oven and grind them with the mortar.', [B.GLASS_BOTTLE, 3]],
    ['hotchoc', 'Hot Chocolate', has(B.HOT_CHOC), 'Mix chocolate milk, then heat it in an oven. It keeps the cold out.', [B.BUTTER, 2]],
    ['chocbar', 'Chocolatier', ach('chocolate'), 'Melt chocolate in the cooking pot, pour it into a mould and let it set.', [B.TIN_INGOT, 3]],
    ['chocake', 'Chocolate Cake', has(B.CHOC_CAKE), 'Bake a chocolate cake, set it down and share it out a slice at a time.', [B.EGG, 3]],
  ]],
  ['kitchen', 'Country Kitchen', 12, [
    ['butcher', 'Farm to Table', ach('butcher'), 'Pigs and chickens are farm animals: butcher a grown one with a sword or an axe.', [B.FLOUR, 4]],
    ['icecream', 'Ice Cream', has([B.CHOC_ICE_CREAM, B.CHERRY_ICE_CREAM, B.HONEY_ICE_CREAM]), 'Spin milk into cream in the comb centrifuge, then freeze it with sugar and a flavour.', [B.SUGAR, 4]],
    ['smoke', 'Smokehouse', has([B.SMOKED_FISH, B.SMOKED_HAM, B.SMOKED_CHEESE]), 'Hang fish, pork or cheese in a chimney over a burning fireplace.', [B.COAL, 8]],
    ['coffee', 'Morning Coffee', has(B.COFFEE), 'Coffee bushes grow by the deserts. Roast the cherries, grind them and brew them in the cooking pot.', [B.GLASS_BOTTLE, 3]],
    ['chilli', 'Some Like It Hot', has(B.CHILLI_CON_CARNE), 'Chillies grow in the desert. Cook them with pork, beans and a tomato.', [B.BEANS, 4]],
    ['contest', 'Blue Ribbon', ach('contest'), 'Win first prize in a festival food contest: the judges love their festival favourites.', [B.COIN, 8]],
  ]],
  ['master', 'Mastery', 7, [
    ['enchant', 'Spellbound', ach('enchant'), 'Enchant a tool at an altar. Bookshelves round it help.', [B.BOOK, 3]],
    ['quarry', 'Quarry', has(B.QUARRY), 'Digs out a whole area by itself. Item frames on it pick what it keeps.', [B.YIELD_UPGRADE, 1]],
    ['arc', 'Arc Furnace', has(B.ARC_FURNACE), 'Smelts fast on electricity, and makes invar and starsteel.', [B.EFFICIENCY_UPGRADE, 1]],
    ['starsteel', 'Starsteel', has(B.STARSTEEL_INGOT), 'Meteoric iron from a fallen star, alloyed in the arc furnace.', [B.STARSTEEL_INGOT, 1]],
    ['reactor', 'Splitting Atoms', has(B.REACTOR), 'A reactor runs on fuel rods and must be kept cool. Mind the radiation.', [B.ICE, 16]],
    ['boss', 'Shrine Breaker', ach('boss'), 'Defeat the guardian of a shrine or lair.', [B.GOLD_INGOT, 4]],
    ['treasure', 'X Marks the Spot', ach('treasure'), 'Follow a treasure map and dig where the X is.', [B.PEARL, 2]],
    ['jetpack', 'Lift-off', has(B.JETPACK), 'A battery-powered jetpack. Hold jump to fly.', [B.GOLD_INGOT, 4]],
  ]],
];

export const GUIDE = CHAPTERS.map(([id, name, after, goals]) => ({
  id, name, after,
  goals: goals.map(([gid, gname, check, hint, reward]) => ({ id: `${id}.${gid}`, name: gname, check, hint, reward: reward && reward[0] != null ? reward : null })),
}));
export const GOALS = GUIDE.flatMap((c) => c.goals);

// A chapter opens once half the one it follows is done.
export function chapterOpen(i, done) {
  const after = GUIDE[i].after;
  if (after < 0) return true;
  const prev = GUIDE[after].goals;
  return prev.filter((g) => done.has(g.id)).length >= Math.ceil(prev.length / 2);
}

// The item a goal is about (for its icon and recipe), or 0.
export function goalItem(g) {
  const c = g.check;
  if (c.has != null) return Array.isArray(c.has) ? c.has[0] : c.has;
  if (c.count) return c.count[0];
  return g.reward?.[0] ?? 0;
}
