// Skills: get better at what you do. Mining, chopping, farming, building, forging, smelting, cooking,
// processing and fighting each have a level (1 to 20), raised by doing that thing. Every level gives a little
// (faster digging, a better chance of extra products...), and some levels unlock a perk.
//
// This file is just the rules: main.js keeps the levels, hands out experience and asks `perk` what applies.

export const MAX_LEVEL = 20;

// Experience from one level to the next: 10 to get to level 2, about 870 for the last one; about 6,300 in all.
export const xpToNext = (level) => (level >= MAX_LEVEL ? Infinity : Math.round(10 * level ** 1.5));

// A skill's perks: { lv, name, text, key, value }. The perk's `key` is what main.js asks for; a later perk with
// the same key replaces an earlier one (Prospector II takes over from Prospector).
// `every` is what each level gives: { key, per, text } (per level from level 2, so level 1 gives nothing).
export const SKILLS = [
  {
    id: 'mining', name: 'Mining', icon: '⛏', how: 'Dig stone, ore and earth with a pickaxe or shovel.',
    every: { key: 'digSpeed', per: 0.03, text: 'digging speed' },
    perks: [
      { lv: 5, name: 'Prospector', text: '15% chance of an extra ore', key: 'extraOre', value: 0.15 },
      { lv: 10, name: 'Steady Hands', text: 'digging makes you half as hungry', key: 'digHunger', value: 0.5 },
      { lv: 15, name: 'Prospector II', text: '30% chance of an extra ore', key: 'extraOre', value: 0.3 },
      { lv: 20, name: 'Prospector III', text: '45% chance of an extra ore', key: 'extraOre', value: 0.45 },
    ],
  },
  {
    id: 'wood', name: 'Woodcutting', icon: '🪓', how: 'Chop logs and wooden things with an axe.',
    every: { key: 'chopSpeed', per: 0.03, text: 'chopping speed' },
    perks: [
      { lv: 5, name: 'Lumberjack', text: '15% chance of an extra log for each log', key: 'extraLog', value: 0.15 },
      { lv: 10, name: 'Forester', text: 'a felled tree leaves you a sapling', key: 'sapling', value: 1 },
      { lv: 15, name: 'Lumberjack II', text: '30% chance of an extra log', key: 'extraLog', value: 0.3 },
      { lv: 20, name: 'Lumberjack III', text: '45% chance of an extra log', key: 'extraLog', value: 0.45 },
    ],
  },
  {
    id: 'farming', name: 'Farming', icon: '🌾', how: 'Harvest ripe crops, and butcher farm animals.',
    every: { key: 'extraCrop', per: 0.02, text: 'chance of an extra crop' },
    perks: [
      { lv: 5, name: 'Green Thumb', text: 'fine crops come up half as often again', key: 'fine', value: 1.5 },
      { lv: 10, name: 'Butcher', text: 'farm animals give an extra cut of meat', key: 'butcher', value: 1 },
      { lv: 15, name: 'Green Thumb II', text: 'fine crops come up twice as often', key: 'fine', value: 2 },
      { lv: 20, name: 'Bumper Crop', text: 'another 20% chance of an extra crop', key: 'bumper', value: 0.2 },
    ],
  },
  {
    id: 'building', name: 'Building', icon: '🧱', how: 'Place blocks.',
    every: { key: 'spare', per: 0.015, text: 'chance a block isn\'t used up' },
    perks: [
      { lv: 5, name: 'Long Arms', text: 'reach a block further', key: 'reach', value: 1 },
      { lv: 10, name: 'Sure-footed', text: 'falls hurt half as much', key: 'fall', value: 0.5 },
      { lv: 15, name: 'Long Arms II', text: 'reach two blocks further', key: 'reach', value: 2 },
      { lv: 20, name: 'Cat\'s Feet', text: 'falls hurt a quarter as much', key: 'fall', value: 0.25 },
    ],
  },
  {
    id: 'forging', name: 'Forging', icon: '🔨', how: 'Craft things in 🎒, at a crafting table or not.',
    every: { key: 'keepIng', per: 0.015, text: 'chance of keeping an ingredient' },
    perks: [
      { lv: 5, name: 'Well Made', text: 'tools and armour wear 15% slower', key: 'wear', value: 0.15 },
      { lv: 10, name: 'Thrifty', text: 'another 10% chance of keeping an ingredient', key: 'thrifty', value: 0.1 },
      { lv: 15, name: 'Well Made II', text: 'tools and armour wear 30% slower', key: 'wear', value: 0.3 },
      { lv: 20, name: 'Master Smith', text: 'armour blocks 10% more of a hit', key: 'armour', value: 0.1 },
    ],
  },
  {
    id: 'smelting', name: 'Smelting', icon: '🔥', how: 'Smelt and fire things in smelters and kilns while you\'re near.',
    every: { key: 'smeltSpeed', per: 0.02, text: 'speed of smelters and kilns near you' },
    perks: [
      { lv: 5, name: 'Good Yield', text: '10% chance of an extra ingot or brick', key: 'smeltExtra', value: 0.1 },
      { lv: 10, name: 'Banked Fire', text: 'fuel lasts 25% longer', key: 'fuel', value: 0.25 },
      { lv: 15, name: 'Good Yield II', text: '20% chance of an extra one', key: 'smeltExtra', value: 0.2 },
      { lv: 20, name: 'Good Yield III', text: '30% chance of an extra one', key: 'smeltExtra', value: 0.3 },
    ],
  },
  {
    id: 'cooking', name: 'Cooking', icon: '🍳', how: 'Cook, brew, press, smoke and dry food while you\'re near.',
    every: { key: 'cookSpeed', per: 0.02, text: 'speed of ovens, pots and presses near you' },
    perks: [
      { lv: 5, name: 'Generous Helpings', text: '10% chance of an extra portion', key: 'cookExtra', value: 0.1 },
      { lv: 10, name: 'Gourmet', text: 'food fills you 20% more', key: 'filling', value: 0.2 },
      { lv: 15, name: 'Generous Helpings II', text: '20% chance of an extra portion', key: 'cookExtra', value: 0.2 },
      { lv: 20, name: 'Gourmet II', text: 'food fills you 40% more', key: 'filling', value: 0.4 },
    ],
  },
  {
    id: 'processing', name: 'Processing', icon: '⚙', how: 'Run crushers, mills, saws, washers and other machines while you\'re near.',
    every: { key: 'procSpeed', per: 0.02, text: 'speed of machines near you' },
    perks: [
      { lv: 5, name: 'Efficient', text: '10% chance of an extra product', key: 'procExtra', value: 0.1 },
      { lv: 10, name: 'Keen Eye', text: 'by-products (trace metals, slag...) half as likely again', key: 'byproduct', value: 1.5 },
      { lv: 15, name: 'Efficient II', text: '20% chance of an extra product', key: 'procExtra', value: 0.2 },
      { lv: 20, name: 'Efficient III', text: '30% chance of an extra product', key: 'procExtra', value: 0.3 },
    ],
  },
  {
    id: 'melee', name: 'Melee', icon: '⚔', how: 'Fight creatures up close.',
    every: { key: 'meleeDmg', per: 0.04, text: 'damage up close' },
    perks: [
      { lv: 5, name: 'Quick Strikes', text: 'swing 15% faster', key: 'swing', value: 0.15 },
      { lv: 10, name: 'Thick Skin', text: 'creatures hurt you 10% less', key: 'skin', value: 0.1 },
      { lv: 15, name: 'Quick Strikes II', text: 'swing 30% faster', key: 'swing', value: 0.3 },
      { lv: 20, name: 'Second Wind', text: 'defeating a creature up close heals you a heart', key: 'heal', value: 2 },
    ],
  },
  {
    id: 'ranged', name: 'Archery', icon: '🏹', how: 'Hit creatures with arrows.',
    every: { key: 'arrowDmg', per: 0.04, text: 'arrow damage' },
    perks: [
      { lv: 5, name: 'Quick Draw', text: 'draw the bow 20% faster', key: 'draw', value: 0.2 },
      { lv: 10, name: 'Fletcher', text: '25% chance an arrow isn\'t used up', key: 'saveArrow', value: 0.25 },
      { lv: 15, name: 'Quick Draw II', text: 'draw the bow 40% faster', key: 'draw', value: 0.4 },
      { lv: 20, name: 'Fletcher II', text: '50% chance an arrow isn\'t used up', key: 'saveArrow', value: 0.5 },
    ],
  },
];
export const SKILL = Object.fromEntries(SKILLS.map((s) => [s.id, s]));

// Across all skills: you tire less as you get better at things. Hunger drains this much slower (up to 30%).
export const HUNGER_PER_LEVEL = 0.004, HUNGER_CAP = 0.3;
export function hungerSaving(levels) {
  const total = SKILLS.reduce((t, s) => t + (levels[s.id] ?? 1) - 1, 0);
  return Math.min(HUNGER_CAP, total * HUNGER_PER_LEVEL);
}

// What a skill at `level` gives for `key`: its per-level bonus, or the value of the best perk unlocked (0 if none).
export function perk(id, key, level) {
  const s = SKILL[id];
  if (!s) return 0;
  if (s.every.key === key) return s.every.per * (Math.max(1, level) - 1);
  let v = 0;
  for (const p of s.perks) if (p.key === key && level >= p.lv) v = p.value;
  return v;
}

// Add experience to a skill's { level, xp }. Returns the levels reached (each one, in order), for the news.
export function gain(st, amount) {
  const reached = [];
  if (!(amount > 0) || st.level >= MAX_LEVEL) return reached;
  st.xp += amount;
  while (st.level < MAX_LEVEL && st.xp >= xpToNext(st.level)) {
    st.xp -= xpToNext(st.level);
    st.level++;
    reached.push(st.level);
  }
  if (st.level >= MAX_LEVEL) st.xp = 0;
  return reached;
}

// Which skill a station's work trains (smelting, cooking, processing), or null for stations that don't
// (chests, auto-crafters, barrels, bee houses...).
export const STATION_SKILL = {
  smelter: 'smelting', blast: 'smelting', esmelter: 'smelting', arc: 'smelting', kiln: 'smelting',
  oven: 'cooking', cookpot: 'cooking', cauldron: 'cooking', freezer: 'cooking', winepress: 'cooking', cheesepress: 'cooking',
  smokehouse: 'cooking', dryrack: 'cooking', distillery: 'cooking',
  crusher: 'processing', mill: 'processing', saw: 'processing', hammer: 'processing', pulverizer: 'processing',
  washer: 'processing', sieve: 'processing', centrifuge: 'processing', combspin: 'processing', polypress: 'processing', carpenter: 'processing',
};
// The per-level speed and the extra-product perk for each of those skills.
export const STATION_PERKS = {
  smelting: { speed: 'smeltSpeed', extra: 'smeltExtra' },
  cooking: { speed: 'cookSpeed', extra: 'cookExtra' },
  processing: { speed: 'procSpeed', extra: 'procExtra' },
};

// Saved levels: { id: { level, xp } } for every skill, filling in any that are missing or broken.
export function loadSkills(saved) {
  const out = {};
  for (const s of SKILLS) {
    const v = saved?.[s.id];
    const level = Number.isFinite(v?.level) ? Math.max(1, Math.min(MAX_LEVEL, Math.floor(v.level))) : 1;
    const xp = Number.isFinite(v?.xp) && level < MAX_LEVEL ? Math.max(0, Math.min(xpToNext(level) - 1e-6, v.xp)) : 0;
    out[s.id] = { level, xp };
  }
  return out;
}
