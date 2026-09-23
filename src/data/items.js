// Loot: procedural gear, signature legendaries, and consumables.
import { rng } from '../systems/rng.js';

export const CONSUMABLES = {
  potion: { name: 'CVS-Brand Healing Potion', desc: 'Heals one sibling for 45 HP.', effect: 'heal', value: 45, price: 30 },
  bigPotion: { name: 'Extra Strength Everything', desc: 'Heals the whole party for 30 HP.', effect: 'healAll', value: 30, price: 60 },
  salts: { name: 'Smelling Salts', desc: 'Revives a KO\'d sibling at 40% HP.', effect: 'revive', value: 0.4, price: 55 },
  trailMix: { name: 'Emergency Trail Mix', desc: 'Heals 25 HP and clears bad effects.', effect: 'cleanse', value: 25, price: 25 },
  balloon: { name: 'Water Balloon of Holding', desc: 'Deals 25 damage to every enemy.', effect: 'bomb', value: 25, price: 45 },
};

// Signature legendaries: stats double when the right sibling equips them.
export const UNIQUES = [
  { name: "Derek Jeter's Batting Gloves", slot: 'weapon', owner: 'tom', stats: { atk: 5, crit: 1 }, desc: 'Still smells like 1996.' },
  { name: 'UCS LEGO Millennium Falcon', slot: 'trinket', owner: 'tom', stats: { def: 3, math: 2, hp: 10 }, desc: '7,541 pieces. Tom counted.' },
  { name: 'Doorstop History Tome (Annotated)', slot: 'weapon', owner: 'stephen', stats: { atk: 4, lore: 2 }, desc: '1,100 pages. Hits like it.' },
  { name: 'The Wealth of Nations (1776, Annotated)', slot: 'trinket', owner: 'stephen', stats: { hp: 20, lore: 1, def: 2 }, desc: 'The invisible hand also blocks.' },
  { name: 'Carver\'s Mallet of Due Process', slot: 'weapon', owner: 'andrew', stats: { atk: 4, def: 2 }, desc: 'Lignum vitae head. Procedurally sound.' },
  { name: 'Hand-Turned Walnut Bowl', slot: 'trinket', owner: 'andrew', stats: { hp: 20, def: 3 }, desc: 'Food-safe finish. Also a shield.' },
  { name: 'Wallet Photo of Charlie the Cat', slot: 'trinket', owner: 'andrew', stats: { hp: 10, charm: 2, def: 2 }, desc: 'One of four hundred. Andrew will show you the rest.', pic: 'charlie' },
  { name: 'The Yellow Umbrella', slot: 'weapon', owner: 'chachi', stats: { atk: 5, spd: 2 }, desc: 'It means something. It\'s a long story.' },
  { name: '26.2 Finisher Medal', slot: 'trinket', owner: 'chachi', stats: { spd: 3, grit: 2, hp: 10 }, desc: 'Earned, not given. Worn to brunch anyway.' },
];

const BASES = {
  weapon: ['Rusty Stapler', 'Foam Finger', 'Rolled-Up Newspaper', 'Pickleball Paddle', 'Umbrella', 'Laser Pointer', 'Selfie Stick', 'Day-Old Baguette', 'Rubber Chicken', 'Garden Trowel'],
  trinket: ['Lanyard', 'Fitness Tracker', 'Company Mug', 'Fanny Pack', 'Travel Pillow', 'Carabiner Keychain', 'Cufflinks', 'Canvas Tote', 'Scented Candle', 'Novelty Socks'],
};

const PREFIX = {
  atk: ['Pointy', 'Aggressive', 'Menacing'],
  def: ['Sturdy', 'Bubble-Wrapped', 'Laminated'],
  hp: ['Hearty', 'Well-Rested', 'Hydrated'],
  spd: ['Caffeinated', 'Aerodynamic', 'Speedy'],
  crit: ['Lucky', 'Clutch'],
  math: ['Quantitative', 'Spreadsheet-Adjacent'],
  lore: ['Annotated', 'Footnoted'],
  charm: ['Charming', 'Well-Spoken'],
  grit: ['Gritty', 'Weatherproof'],
};

const RARITY_ORDER = ['common', 'uncommon', 'rare', 'legendary'];
const STAT_WEIGHT = { atk: 1, def: 1, hp: 0.2, spd: 1, crit: 2, math: 1, lore: 1, charm: 1, grit: 1 };

function rollRarity(floor, boost = 0) {
  const r = rng() + boost + (floor - 1) * 0.05;
  if (r > 1.0) return 'legendary';
  if (r > 0.82) return 'rare';
  if (r > 0.5) return 'uncommon';
  return 'common';
}

let uid = 1;
export const newId = () => `i${Date.now().toString(36)}${uid++}`;

export function makeGear(floor, boost = 0) {
  const rarity = rollRarity(floor, boost);
  if (rarity === 'legendary' && rng() < 0.75) {
    const u = UNIQUES[Math.floor(rng() * UNIQUES.length)];
    return { id: newId(), kind: 'gear', rarity, ...u, stats: { ...u.stats } };
  }
  const slot = rng() < 0.5 ? 'weapon' : 'trinket';
  const budget = (2 + RARITY_ORDER.indexOf(rarity) * 2 + floor) ;
  const primaryPool = slot === 'weapon' ? ['atk', 'atk', 'spd', 'crit'] : ['def', 'hp', 'math', 'lore', 'charm', 'grit', 'spd'];
  const primary = primaryPool[Math.floor(rng() * primaryPool.length)];
  const stats = {};
  let left = budget;
  const add = (k, pts) => {
    const v = Math.max(1, Math.round(pts / STAT_WEIGHT[k]));
    stats[k] = (stats[k] || 0) + v;
  };
  const firstPts = Math.max(1, Math.round(left * (rarity === 'common' ? 1 : 0.6)));
  add(primary, Math.min(firstPts, primary === 'crit' ? 2 : firstPts));
  left -= firstPts;
  const extras = ['atk', 'def', 'hp', 'spd', 'math', 'lore', 'charm', 'grit'];
  while (left > 0) {
    const k = extras[Math.floor(rng() * extras.length)];
    const pts = Math.min(left, 1 + Math.floor(rng() * 2));
    add(k, pts);
    left -= pts;
  }
  const base = BASES[slot][Math.floor(rng() * BASES[slot].length)];
  const pre = PREFIX[primary][Math.floor(rng() * PREFIX[primary].length)];
  return { id: newId(), kind: 'gear', slot, rarity: rarity === 'legendary' ? 'rare' : rarity, name: `${pre} ${base}`, stats };
}

export function makeConsumable(key) {
  const k = key ?? rng.pick(['potion', 'potion', 'trailMix', 'bigPotion', 'salts', 'balloon']);
  return { id: newId(), kind: 'consumable', key: k, rarity: 'common', ...CONSUMABLES[k] };
}

export const STAT_LABEL = {
  hp: 'HP', atk: 'ATK', def: 'DEF', spd: 'SPD', crit: 'CRIT', math: 'Math', lore: 'Lore', charm: 'Charm', grit: 'Grit',
};

export function statLine(stats, mult = 1) {
  return Object.entries(stats).map(([k, v]) => `+${v * mult} ${STAT_LABEL[k]}`).join('  ');
}
