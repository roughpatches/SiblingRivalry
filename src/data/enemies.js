// Monsters, grouped by floor. Stats are floor-1 values; deeper floors scale them.
// shape = which pixel template to draw; colors = palette for that template.
//
// Move types: hit, aoe, drain, poison, stun, debuff, heal, buff, charge (then 'release').

export const ENEMIES = {
  // ---------- Floor 1: The Basement ----------
  dustBunny: {
    short: 'Bunny', name: 'Dust Bunny', shape: 'blob', colors: { X: 0x9a93a6, L: 0xc9c3d3, D: 0x5d566b, E: 0x1a1522, M: 0x3b3346 },
    hp: 24, atk: 7, def: 2, spd: 6, xp: 8, gold: 6,
    moves: [{ name: 'Sneeze Cloud', type: 'hit', mult: 1, w: 3 }, { name: 'Allergen Burst', type: 'debuff', mult: 0.5, status: 'atkDown', turns: 2, w: 1 }],
  },
  taxBox: {
    short: 'Box', name: 'Box of Old Tax Returns', shape: 'mimic', colors: { X: 0xb08850, L: 0xd8b57a, D: 0x6e5230, W: 0xf3eee0, M: 0x3a1f16 },
    hp: 34, atk: 8, def: 5, spd: 3, xp: 11, gold: 12,
    moves: [{ name: 'Paper Cut', type: 'hit', mult: 1, w: 3 }, { name: 'Audit', type: 'stun', mult: 0.6, chance: 0.4, w: 1 }],
  },
  soxGoblin: {
    short: 'Goblin', name: 'Red Sox Fan Goblin', shape: 'goblin', colors: { X: 0x7fae5a, R: 0xbd3039, W: 0xffffff, B: 0x0c2340, D: 0x3a3f4f, K: 0x222222, E: 0x111111, M: 0x5a1e1e },
    hp: 28, atk: 9, def: 3, spd: 8, xp: 10, gold: 9,
    moves: [{ name: 'Heckle', type: 'hit', mult: 1, w: 3 }, { name: '"Yankees Suck" Chant', type: 'aoe', mult: 0.5, w: 1 }],
  },
  replyBat: {
    short: 'Bat', name: 'Reply-All Bat', shape: 'bat', colors: { X: 0x4a3a66, E: 0xffd84a, M: 0xffffff },
    hp: 18, atk: 7, def: 1, spd: 11, xp: 7, gold: 5,
    moves: [{ name: 'Bite', type: 'hit', mult: 1, w: 2 }, { name: 'Reply All', type: 'aoe', mult: 0.55, w: 2 }],
  },
  leafBat: {
    short: 'Bat?', name: 'Probably a Bat (Leaves)', shape: 'bat', colors: { X: 0x6b8a3a, E: 0xc9a14a, M: 0x3b2a14 },
    hp: 16, atk: 6, def: 1, spd: 10, xp: 7, gold: 5,
    moves: [{ name: 'Rustle Menacingly', type: 'hit', mult: 1, w: 3 }, { name: '"BATS!"', type: 'debuff', mult: 0.4, status: 'atkDown', turns: 2, w: 1 }],
  },
  laundryGolem: {
    short: 'Laundry', name: 'The Unfolded Laundry Golem', shape: 'golem', boss: true, scale: 1.5,
    colors: { X: 0xd7d2c4, L: 0x7aa7d6, D: 0x8c8676, E: 0x222222, M: 0x553333 },
    hp: 120, atk: 11, def: 5, spd: 5, xp: 45, gold: 50,
    moves: [
      { name: 'Sock Slam', type: 'hit', mult: 1.2, w: 3 },
      { name: 'Static Cling', type: 'stun', mult: 0.6, chance: 0.5, w: 1 },
      { name: 'Fitted Sheet Unfurl', type: 'aoe', mult: 0.7, w: 2 },
    ],
  },

  // ---------- Floor 2: The Corporate Catacombs ----------
  managerSlime: {
    short: 'Slime', name: 'Middle Manager Slime', shape: 'blob', colors: { X: 0x5fa35a, L: 0x9cd48f, D: 0x2f5f33, E: 0x10200f, M: 0x1d3a1c },
    hp: 40, atk: 10, def: 4, spd: 5, xp: 14, gold: 12,
    moves: [{ name: 'Quick Sync', type: 'hit', mult: 1, w: 3 }, { name: 'Circle Back', type: 'debuff', mult: 0.5, status: 'defDown', turns: 2, w: 1 }, { name: 'Delegate', type: 'heal', amount: 0.25, w: 1 }],
  },
  spreadsheetGolem: {
    short: 'Golem', name: 'Spreadsheet Golem', shape: 'golem', colors: { X: 0x2d8a4e, L: 0xd9f2df, D: 0x1b5530, E: 0xffffff, M: 0x0d2a18 },
    hp: 52, atk: 11, def: 7, spd: 3, xp: 17, gold: 15,
    moves: [{ name: 'VLOOKUP', type: 'hit', mult: 1.1, w: 3 }, { name: '#REF! Error', type: 'stun', mult: 0.6, chance: 0.4, w: 1 }],
  },
  synergySpecter: {
    short: 'Specter', name: 'Synergy Specter', shape: 'ghost', colors: { X: 0xbfd7ff, E: 0x1c2b55, M: 0x1c2b55 },
    hp: 34, atk: 11, def: 2, spd: 9, xp: 14, gold: 11,
    moves: [{ name: 'Leverage', type: 'drain', mult: 1, w: 3 }, { name: 'Paradigm Shift', type: 'debuff', mult: 0.4, status: 'atkDown', turns: 2, w: 1 }],
  },
  calendarImp: {
    short: 'Imp', name: 'Calendar Invite Imp', shape: 'imp', colors: { X: 0xd9573c, E: 0xfff1a8, W: 0xffffff, M: 0x3a0d05, D: 0x7c2a1a },
    hp: 30, atk: 12, def: 2, spd: 12, xp: 13, gold: 10,
    moves: [{ name: 'Double-Book', type: 'hit', mult: 1, w: 3 }, { name: 'Recurring Meeting', type: 'poison', mult: 0.5, dot: 4, turns: 3, w: 2 }],
  },
  quarterlyReview: {
    short: 'Review', name: 'The Quarterly Review', shape: 'golem', boss: true, scale: 1.5,
    colors: { X: 0x8e2d3a, L: 0xf2b441, D: 0x4f1820, E: 0xffffff, M: 0x000000 },
    hp: 190, atk: 14, def: 7, spd: 6, xp: 80, gold: 90,
    moves: [
      { name: 'Needs Improvement', type: 'hit', mult: 1.2, w: 3 },
      { name: 'Performance Plan', type: 'debuff', mult: 0.6, status: 'defDown', turns: 3, w: 1 },
      { name: 'Begins Calibrating...', type: 'charge', w: 1, release: { name: 'Stack Ranking', type: 'aoe', mult: 1.5 } },
    ],
  },

  // ---------- Floor 3: The Thanksgiving Depths ----------
  casseroleOoze: {
    short: 'Ooze', name: 'Green Bean Casserole Ooze', shape: 'blob', colors: { X: 0x9bb05a, L: 0xe6d9a8, D: 0x5d6b30, E: 0x2a2a12, M: 0x2a2a12 },
    hp: 56, atk: 12, def: 5, spd: 5, xp: 20, gold: 16,
    moves: [{ name: 'Gloop', type: 'hit', mult: 1, w: 3 }, { name: 'Crispy Onion Shrapnel', type: 'aoe', mult: 0.55, w: 1 }, { name: 'Second Helping', type: 'heal', amount: 0.25, w: 1 }],
  },
  adviceImp: {
    short: 'Imp', name: 'Unsolicited Advice Imp', shape: 'imp', colors: { X: 0x7d5ab5, E: 0xfff1a8, W: 0xffffff, M: 0x1f1233, D: 0x3f2a60 },
    hp: 42, atk: 14, def: 3, spd: 12, xp: 19, gold: 14,
    moves: [{ name: '"Have You Tried..."', type: 'hit', mult: 1, w: 3 }, { name: '"When Are You Getting Married?"', type: 'stun', mult: 0.4, chance: 0.5, w: 1 }],
  },
  seatingWraith: {
    short: 'Wraith', name: 'Seating Chart Wraith', shape: 'ghost', colors: { X: 0xe7d8b8, E: 0x5a1e1e, M: 0x5a1e1e },
    hp: 46, atk: 14, def: 3, spd: 9, xp: 19, gold: 15,
    moves: [{ name: 'Kids Table', type: 'debuff', mult: 0.6, status: 'atkDown', turns: 2, w: 2 }, { name: 'Haunt', type: 'drain', mult: 1, w: 3 }],
  },
  dryTurkey: {
    short: 'Turkey', name: 'Dry Turkey Golem', shape: 'golem', colors: { X: 0xb5773a, L: 0xe8c38e, D: 0x6b421c, E: 0x1a0f05, M: 0x1a0f05 },
    hp: 72, atk: 15, def: 8, spd: 3, xp: 24, gold: 20,
    moves: [{ name: 'Drumstick', type: 'hit', mult: 1.15, w: 3 }, { name: 'Tryptophan Wave', type: 'stun', mult: 0.3, chance: 0.5, w: 1 }],
  },

  // ---------- Boss: The Family Group Chat Hydra (three heads) ----------
  headTyping: {
    short: 'Mom', name: 'Head: "Mom is typing..."', shape: 'hydra', boss: true, scale: 1.2,
    colors: { X: 0x3f7fd9, L: 0x9cc3ff, D: 0x1f4585, E: 0xffffff, W: 0xffffff, M: 0x0b1a33 },
    hp: 150, atk: 15, def: 6, spd: 4, xp: 60, gold: 60,
    moves: [
      { name: 'Voice Memo (4 min)', type: 'hit', mult: 1.2, w: 2 },
      { name: 'Typing...', type: 'charge', w: 2, release: { name: 'WALL OF TEXT', type: 'aoe', mult: 1.6 } },
    ],
  },
  headReplyAll: {
    short: 'ReplyAll', name: 'Head: Reply-All', shape: 'hydra', boss: true, scale: 1.2,
    colors: { X: 0x48a868, L: 0xa9e3b8, D: 0x22603a, E: 0xffffff, W: 0xffffff, M: 0x0a2414 },
    hp: 130, atk: 14, def: 5, spd: 8, xp: 60, gold: 60,
    moves: [
      { name: 'Forwarded Chain Letter', type: 'aoe', mult: 0.7, w: 3 },
      { name: '"Did Everyone See This?"', type: 'poison', mult: 0.5, dot: 6, turns: 3, w: 1 },
    ],
  },
  headMeme: {
    short: 'Meme', name: 'Head: Minion Meme', shape: 'hydra', boss: true, scale: 1.2,
    colors: { X: 0xe8c63a, L: 0xfff09a, D: 0x8a6f12, E: 0x333333, W: 0xffffff, M: 0x3a2a05 },
    hp: 110, atk: 13, def: 4, spd: 10, xp: 60, gold: 60,
    moves: [
      { name: 'Reacts with Laughing Face', type: 'heal', amount: 0.2, w: 2 },
      { name: 'Blurry Screenshot', type: 'debuff', mult: 0.6, status: 'defDown', turns: 2, w: 2 },
      { name: '"Thoughts??"', type: 'buff', status: 'atkUp', turns: 3, w: 1 },
    ],
  },
};

export const FLOORS = [
  {
    name: 'The Basement',
    theme: 'basement',
    sub: 'Floor 1 · Beneath the family home',
    tint: 0x2a2436,
    pool: ['dustBunny', 'taxBox', 'soxGoblin', 'replyBat', 'leafBat'],
    boss: ['laundryGolem'],
    bossIntro: 'A mountain of unfolded laundry rises from the dryer. It has been waiting since 2011.',
  },
  {
    name: 'The Corporate Catacombs',
    theme: 'office',
    sub: 'Floor 2 · Where synergies go to die',
    tint: 0x1f2a2a,
    pool: ['managerSlime', 'spreadsheetGolem', 'synergySpecter', 'calendarImp'],
    boss: ['quarterlyReview'],
    bossIntro: 'The Quarterly Review blocks the stairwell. "Let\'s talk about your year."',
  },
  {
    name: 'The Thanksgiving Depths',
    theme: 'dining',
    sub: 'Floor 3 · Every relative, all at once',
    tint: 0x2e2218,
    pool: ['casseroleOoze', 'adviceImp', 'seatingWraith', 'dryTurkey'],
    boss: ['headTyping', 'headReplyAll', 'headMeme'],
    bossIntro: 'The Family Group Chat Hydra rears three heads. 147 unread messages.',
  },
];

// Floors past 3 cycle the pools with harder scaling ("Keep descending").
export function floorDef(n) {
  const base = FLOORS[(n - 1) % FLOORS.length];
  if (n <= FLOORS.length) return base;
  return { ...base, name: `${base.name} (Again?)`, sub: `Floor ${n} · It keeps going down` };
}
