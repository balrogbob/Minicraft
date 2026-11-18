// Achievements: little goals, each announced once per world when you first reach it.
// main.js calls achieve(id) from the place in the game where each one happens.
export const ACHIEVEMENTS = [
  { id: 'log', icon: '🪵', name: 'Getting Wood', about: 'Collect a log from a tree.' },
  { id: 'table', icon: '🛠', name: 'Workbench', about: 'Make a crafting table.' },
  { id: 'stonepick', icon: '⛏', name: 'Stone Age', about: 'Make a stone pickaxe.' },
  { id: 'ingot', icon: '🔥', name: 'Hot Stuff', about: 'Smelt your first metal ingot.' },
  { id: 'metalpick', icon: '⚒', name: 'Metalworker', about: 'Make a pickaxe from metal.' },
  { id: 'eat', icon: '🍞', name: 'Square Meal', about: 'Eat a hearty meal and feel well fed.' },
  { id: 'sleep', icon: '🛏', name: 'Sweet Dreams', about: 'Sleep in a bed.' },
  { id: 'fight', icon: '⚔', name: 'Night Watch', about: 'Defeat a creature of the night.' },
  { id: 'boss', icon: '👑', name: 'Shrine Breaker', about: 'Defeat the guardian of a shrine or lair.' },
  { id: 'tame', icon: '🐺', name: 'Best Friend', about: 'Tame a wolf or a camel.' },
  { id: 'fish', icon: '🐟', name: 'Gone Fishing', about: 'Catch something with a fishing rod.' },
  { id: 'trade', icon: '💰', name: 'Fair Trade', about: 'Trade with a trader or a villager.' },
  { id: 'enchant', icon: '✨', name: 'Spellbound', about: 'Enchant something at an altar.' },
  { id: 'cart', icon: '🛤', name: 'All Aboard', about: 'Ride in a minecart.' },
  { id: 'engine', icon: '♨', name: 'Full Steam', about: 'Get a steam engine running.' },
  { id: 'deep', icon: '🕳', name: 'Deep Down', about: 'Reach the depths, below height 10.' },
  { id: 'peak', icon: '🏔', name: 'Top of the World', about: 'Stand higher than height 50.' },
  { id: 'far', icon: '🧭', name: 'Explorer', about: 'Travel 1000 blocks from where you started.' },
  { id: 'map', icon: '🗺', name: 'Cartographer', about: 'Open the world map and put down a waypoint.' },
  { id: 'paint', icon: '🖼', name: 'Art Lover', about: 'Hang a painting.' },
  { id: 'week', icon: '📅', name: 'Settled In', about: 'Live to see day 7.' },
  { id: 'diamond', icon: '💎', name: 'Crystal Clear', about: 'Mine a crystal cluster or shard deep underground.' },
];

export const ACHIEVEMENT_IDS = new Set(ACHIEVEMENTS.map((a) => a.id));
