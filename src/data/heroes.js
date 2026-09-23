// The four siblings. Everything personal about the game lives in this file:
// names, stats, skills, passives and banter. Edit freely.
//
// Check stats (used by skill-check events, d20 + stat vs DC):
//   math  – puzzles, numbers, locks, anything quantitative
//   lore  – history, reading, trivia, inscriptions
//   charm – talking, negotiating, reading the room
//   grit  – climbing, running, enduring, hauling

export const HEROES = [
  {
    id: 'tom',
    name: 'Tom',
    title: 'The Consultant',
    blurb: 'Oldest. Runs the numbers on everything, including feelings (badly).',
    base: { hp: 72, atk: 11, def: 4, spd: 8 },
    growth: { hp: 8, atk: 2, def: 1, spd: 1 },
    checks: { math: 6, lore: 1, charm: -2, grit: 0 },
    passive: {
      name: 'Spiral',
      desc: 'Below half HP, Tom overthinks everything: +40% ATK, -2 DEF.',
    },
    skills: [
      { id: 'pivot', name: 'Pivot Table', desc: 'Hit one enemy.', cd: 0, target: 'enemy', level: 1 },
      { id: 'numbers', name: 'Run the Numbers', desc: 'Calculated strike: 1.7x damage that ignores DEF.', cd: 2, target: 'enemy', level: 1 },
      { id: 'matrix', name: '2x2 Matrix', desc: 'Plot every enemy in "Low Value / High Effort". All enemies -50% DEF for 3 turns.', cd: 3, target: 'allEnemies', level: 1 },
      { id: 'bulwark', name: 'LEGO Bulwark', desc: 'Snaps together a wall. Whole party gains a shield (10 + 2/level).', cd: 4, target: 'allAllies', level: 3 },
    ],
    look: 'tom',
    lines: {
      battle: [
        "I've modeled this. 62% chance we win. Maybe 58.",
        'Nobody panic. I am panicking, but nobody else.',
        "Let's align on a framework before we... okay, they're attacking.",
      ],
      victory: [
        'Per my analysis, we won.',
        'Exactly as I predicted, in the version of the model I did not share.',
        'Great work, team. Does anyone want feedback? I have feedback.',
      ],
      lowHp: ['This is fine. This is statistically fine.', 'I would like to formally escalate.'],
      ko: ['Tell the Yankees... I believed...'],
      levelUp: ["Level up. I'd like that in writing."],
      rest: [
        'I brought a LEGO set for downtime. 3,000 pieces. We have twenty minutes.',
        'Has anyone considered we could be optimizing this rest?',
        'Stephen, you look sad. Is it the Blue Jays? It is always the Blue Jays.',
      ],
      fumble: ['That was a rounding error.'],
    },
  },
  {
    id: 'stephen',
    name: 'Stephen',
    title: 'The Pharmacist-Historian',
    blurb: 'Quiet. Has read a book about whatever is happening right now.',
    base: { hp: 76, atk: 8, def: 5, spd: 6 },
    growth: { hp: 8, atk: 1, def: 1, spd: 1 },
    checks: { math: 2, lore: 6, charm: 1, grit: 0 },
    passive: {
      name: 'Quiet Presence',
      desc: 'Enemies forget Stephen is there. Much less likely to be targeted.',
    },
    skills: [
      { id: 'footnote', name: 'Footnote', desc: 'Hit one enemy with a pointed citation.', cd: 0, target: 'enemy', level: 1 },
      { id: 'receipt', name: 'Extra Care Receipt', desc: 'Unfurls a four-foot receipt. Heals one ally for 40% max HP.', cd: 2, target: 'ally', level: 1 },
      { id: 'precedent', name: 'Historical Precedent', desc: 'A long lecture on the Peace of Westphalia. Each enemy has a 65% chance to fall asleep for 2 turns.', cd: 4, target: 'allEnemies', level: 1 },
      { id: 'pharmacy', name: 'Pharmacy Run', desc: 'Heals the whole party 25% and clears bad effects. Revives KO\'d siblings at 20%.', cd: 5, target: 'allAllies', level: 3 },
    ],
    look: 'stephen',
    lines: {
      battle: [
        '...',
        'Historically, this is where the army overextends.',
        'I read a book about this. It did not end well for them.',
      ],
      victory: ['Heh. Nice.', 'That was a lot like Agincourt. Nobody asked, I know.', 'Can I go back to my book now?'],
      lowHp: ["I'd like to go home and read now."],
      ko: ['I had... one more chapter...'],
      levelUp: ['Oh. Neat.'],
      rest: [
        "Did you know the Blue Jays won back-to-back in '92 and '93? Anyway.",
        'Quiet reading time. Finally.',
        "Nobody's going to watch Arrested Development with me, are they.",
      ],
      fumble: ["I've made a huge mistake."],
    },
  },
  {
    id: 'andrew',
    name: 'Andrew',
    title: 'The Counsel',
    blurb: 'Drafts the rules of engagement. Carves a spoon between fights.',
    base: { hp: 96, atk: 9, def: 8, spd: 5 },
    growth: { hp: 11, atk: 1, def: 2, spd: 0 },
    checks: { math: 1, lore: 4, charm: 4, grit: 2 },
    passive: {
      name: 'Woodshop Buckler',
      desc: 'Starts every fight behind a hand-carved shield (8 + 2/level).',
    },
    skills: [
      { id: 'mallet', name: "Carver's Mallet", desc: 'Hit one enemy with a woodworking mallet.', cd: 0, target: 'enemy', level: 1 },
      { id: 'objection', name: 'Objection!', desc: 'All enemies must target Andrew for 2 turns. +60% DEF while it lasts.', cd: 3, target: 'self', level: 1 },
      { id: 'order', name: 'Point of Order', desc: 'Small hit that stuns one enemy for its next turn.', cd: 3, target: 'enemy', level: 1 },
      { id: 'amendment', name: 'Floor Amendment', desc: 'Inserts favorable language: whole party +35% ATK for 3 turns.', cd: 4, target: 'allAllies', level: 3 },
    ],
    look: 'andrew',
    lines: {
      battle: [
        'Let the record reflect that they started it.',
        'I move that we win. Is there a second?',
        'Objection. To all of this.',
      ],
      victory: ['The motion carries.', 'So ordered.', 'Clean. Like a well-sanded walnut bowl.'],
      lowHp: ["I'd like to request a recess."],
      ko: ['I yield... the balance of my time...'],
      levelUp: ['Amended and improved.'],
      rest: [
        'Fun fact about this dungeon\'s zoning... no? Okay.',
        "I'm going to whittle a spoon. Don't talk to me.",
        'This rest stop is legally a "temporary structure." I checked.',
      ],
      fumble: ['Strike that from the record.'],
    },
  },
  {
    id: 'chachi',
    name: 'Chachi',
    title: 'The Ultramarathoner',
    blurb: 'Youngest. Fastest. Has a pop-culture quote for every occasion.',
    base: { hp: 82, atk: 12, def: 4, spd: 12 },
    growth: { hp: 9, atk: 2, def: 1, spd: 1 },
    checks: { math: 0, lore: 0, charm: 3, grit: 6 },
    passive: {
      name: 'Second Wind',
      desc: 'Once per fight, survives a knockout blow with 1 HP. Also scouts ahead: reveals nearby rooms on the map.',
    },
    skills: [
      { id: 'pole', name: 'Trekking Pole', desc: 'Hit one enemy.', cd: 0, target: 'enemy', level: 1 },
      { id: 'kick', name: 'Mile 26 Kick', desc: 'Sprints through: hits 3 random enemies for 0.7x each.', cd: 2, target: 'randomEnemies', level: 1 },
      { id: 'legendary', name: 'Wait For It...', desc: '"This is going to be legen... wait for it..." Winds up this turn. Next turn: "...DARY!" for 3.2x damage.', cd: 4, target: 'enemy', level: 1 },
      { id: 'suitup', name: 'Suit Up!', desc: 'Whole party +4 SPD and +20% ATK for 3 turns.', cd: 4, target: 'allAllies', level: 3 },
    ],
    look: 'chachi',
    lines: {
      battle: ['Challenge accepted!', 'Suit up!', 'Mile one. Easy pace. Then we destroy them.', "Whatever you do, don't say it'll be easy."],
      victory: ['Easy. That was a warm-up lap.', 'High five! Tom. Tom, it is a high five, put your hand up.', 'And that, kids, is how we cleared that room.'],
      lowHp: ["I've hit the wall. I've hit walls before."],
      ko: ['Save me... a finisher medal...'],
      levelUp: ['New PR!'],
      rest: [
        'Hear me out: next floor, trail run.',
        'Kids, I am going to tell you an incredible story.',
        'Tom. Yankees in six. Say it back.',
      ],
      fumble: ['Haaave you met my aim? Neither have I.'],
    },
  },
];

export const HERO_BY_ID = Object.fromEntries(HEROES.map((h) => [h.id, h]));

// Pair bonus shown in the party screen and applied in combat.
export const BRONX_BOMBERS = {
  name: 'Bronx Bombers',
  desc: 'While Tom and Chachi are both standing, they crit on a 19 or 20.',
};
