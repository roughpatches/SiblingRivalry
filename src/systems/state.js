// Run state: the party, the bag, the gold, the current floor.
import { HEROES, HERO_BY_ID } from '../data/heroes.js';
import { makeConsumable } from '../data/items.js';
import { rng } from './rng.js';
import { generateFloor } from './dungeon.js';

export const BAG_SIZE = 16;
export const xpToNext = (lvl) => 24 + lvl * 18;

export const G = { run: null };

export function newRun(seed = Math.floor(Math.random() * 1e9)) {
  rng.seed(seed);
  const party = HEROES.map((d) => ({
    id: d.id, level: 1, xp: 0, hp: 0, equip: { weapon: null, trinket: null }, perm: {},
  }));
  G.run = {
    seed, party, gold: 20, floor: 1,
    bag: [makeConsumable('potion'), makeConsumable('potion'), makeConsumable('trailMix')],
    stats: { fights: 0, checks: 0, checksWon: 0, nat20: 0, nat1: 0, loot: 0 },
    log: [],
  };
  party.forEach((h) => (h.hp = heroStats(h).maxHp));
  G.run.map = generateFloor(1);
  return G.run;
}

export function heroStats(h) {
  const d = HERO_BY_ID[h.id];
  const L = h.level - 1;
  const s = {
    maxHp: d.base.hp + d.growth.hp * L,
    atk: d.base.atk + d.growth.atk * L,
    def: d.base.def + d.growth.def * L,
    spd: d.base.spd + d.growth.spd * L,
    crit: 0,
    math: d.checks.math, lore: d.checks.lore, charm: d.checks.charm, grit: d.checks.grit,
  };
  for (const [k, v] of Object.entries(h.perm)) s[k] = (s[k] || 0) + v;
  for (const it of Object.values(h.equip)) {
    if (!it) continue;
    const mult = it.owner === h.id ? 2 : 1;
    for (const [k, v] of Object.entries(it.stats)) {
      if (k === 'hp') s.maxHp += v * mult;
      else s[k] = (s[k] || 0) + v * mult;
    }
  }
  return s;
}

export function heroDef(h) { return HERO_BY_ID[h.id]; }

export function alive() { return G.run.party.filter((h) => h.hp > 0); }

// Shared party XP. Returns [{hero, level}] for each level gained.
export function gainXp(amount) {
  const ups = [];
  for (const h of G.run.party) {
    const gain = h.hp > 0 ? amount : Math.floor(amount / 2);
    h.xp += gain;
    while (h.xp >= xpToNext(h.level)) {
      h.xp -= xpToNext(h.level);
      const before = heroStats(h).maxHp;
      h.level += 1;
      const after = heroStats(h).maxHp;
      if (h.hp > 0) h.hp = Math.min(after, h.hp + (after - before) + Math.round(after * 0.25));
      ups.push({ hero: h, level: h.level });
    }
  }
  return ups;
}

export function addToBag(item) {
  if (G.run.bag.length >= BAG_SIZE) return false;
  G.run.bag.push(item);
  G.run.stats.loot += 1;
  return true;
}

export function removeFromBag(item) {
  const i = G.run.bag.indexOf(item);
  if (i >= 0) G.run.bag.splice(i, 1);
}

export function equip(hero, item) {
  const prev = hero.equip[item.slot];
  const oldMax = heroStats(hero).maxHp;
  removeFromBag(item);
  hero.equip[item.slot] = item;
  if (prev) G.run.bag.push(prev);
  const newMax = heroStats(hero).maxHp;
  if (hero.hp > 0) hero.hp = Math.max(1, Math.min(newMax, hero.hp + (newMax - oldMax)));
}

export function unequip(hero, slot) {
  const it = hero.equip[slot];
  if (!it || G.run.bag.length >= BAG_SIZE) return false;
  hero.equip[slot] = null;
  G.run.bag.push(it);
  const max = heroStats(hero).maxHp;
  hero.hp = Math.min(hero.hp, max);
  return true;
}

export function healHero(h, amt) {
  const max = heroStats(h).maxHp;
  const before = h.hp;
  h.hp = Math.min(max, h.hp + Math.round(amt));
  return h.hp - before;
}

export function pickLine(heroId, kind) {
  const lines = HERO_BY_ID[heroId].lines[kind];
  return lines ? rng.pick(lines) : '';
}

export function descend() {
  G.run.floor += 1;
  G.run.map = generateFloor(G.run.floor);
}
