// Skill-check rooms. Pick a sibling, roll d20 + their stat, beat the DC.
// bonus: extra modifier for a specific sibling. lines: flavor when that sibling attempts.

export const EVENTS = [
  {
    id: 'sudoku', title: 'The Sudoku Door', stat: 'math', dc: 12,
    text: 'A stone door with a half-finished sudoku carved into it. Someone has written a 7 in pen. Wrong. In pen.',
    lines: { tom: 'Tom has already solved it. He is now solving the sudoku on the other side of the door.' },
    success: { text: 'The door grinds open onto a small vault.', loot: 0.1, xp: 10 },
    fail: { text: 'The door sighs, disappointed. Psychic damage.', dmg: 10 },
  },
  {
    id: 'troll', title: 'The Bridge Troll', stat: 'charm', dc: 13,
    text: 'A troll blocks a rickety bridge. "Toll is 40 gold. Or convince me you\'re worth it."',
    lines: {
      tom: 'Tom explains, at length, why the troll\'s pricing model is inefficient. The troll looks hurt.',
      andrew: 'Andrew notes the bridge lacks a posted fee schedule, which is arguably a notice problem.',
      chachi: 'Chachi opens with "Okay so have you ever seen How I Met Your Mother?"',
    },
    success: { text: 'The troll waves you through and tips you for the conversation.', gold: 35, xp: 10 },
    fail: { text: 'The troll is unmoved. You pay the toll.', goldLoss: 40 },
  },
  {
    id: 'inscription', title: 'The Ancient Inscription', stat: 'lore', dc: 13,
    text: 'Runes cover the wall. They might be a map. They might be a very old grocery list.',
    lines: { stephen: 'Stephen recognizes the dialect. He read a book about it. On vacation. For fun.' },
    success: { text: 'It IS a map. The whole floor is revealed.', reveal: true, xp: 14 },
    fail: { text: 'It was a grocery list. A cursed one. Everyone loses a little HP.', dmgAll: 6 },
  },
  {
    id: 'chasm', title: 'The Chasm', stat: 'grit', dc: 12,
    text: 'A gap in the floor, about eight feet across. A rope hangs from the far side.',
    lines: { chachi: 'Chachi clears it without breaking stride and asks why everyone else is still standing there.', tom: 'Tom calculates the jump perfectly. His legs did not read the memo.' },
    success: { text: 'Across! There\'s a stash on the ledge.', gold: 30, xp: 10, consumable: 'trailMix' },
    fail: { text: 'Not quite. You climb out bruised.', dmg: 14 },
  },
  {
    id: 'bricks', title: 'The Brick Lock', stat: 'math', dc: 14, bonus: { tom: 3 },
    text: 'A lock made of interlocking plastic bricks. The instructions are missing. Page 47 is just a picture of a duck.',
    lines: { tom: 'Tom\'s hands move on their own. He is at peace for the first time in years.' },
    success: { text: 'Click. A rare chest pops open.', loot: 0.3, xp: 12 },
    fail: { text: 'Someone steps on a loose brick. Barefoot. Somehow.', dmg: 12 },
  },
  {
    id: 'switchback', title: 'The Switchbacks', stat: 'grit', dc: 14,
    text: 'A staircase that goes up, then down, then up. It is a hike. It is definitely a hike.',
    lines: { chachi: 'Chachi calls this "a nice little warm-up."' },
    success: { text: 'At the top there is, somehow, a view. Everyone feels better.', healAll: 0.3, xp: 12 },
    fail: { text: 'Everyone is winded. Chachi is not. Chachi is annoying about it.', dmgAll: 7 },
  },
  {
    id: 'library', title: 'The Library of Unread Nonfiction', stat: 'lore', dc: 12, bonus: { stephen: 2 },
    text: 'Floor-to-ceiling books, all 600+ pages, all "you really should read this."',
    lines: { stephen: 'Stephen has read all of them. He has notes. He has opinions about the translations.', andrew: 'Andrew finds a treatise on 19th-century land law and forgets where he is.' },
    success: { text: 'Hidden inside a hollowed-out biography: treasure. The reader grows wiser (+1 to that stat, permanently).', loot: 0.15, xp: 12, permStat: true },
    fail: { text: 'Your chosen reader falls asleep on page 3. Time passes. Nothing else.', xp: 4 },
  },
  {
    id: 'pitch', title: 'The Opportunity', stat: 'charm', dc: 12,
    text: 'A goblin in a quarter-zip vest offers you "a ground-floor opportunity." There is a pitch deck.',
    lines: {
      tom: 'Tom asks for the unit economics. The goblin does not have unit economics.',
      stephen: 'Stephen quietly asks one question. The goblin sweats.',
      andrew: 'Andrew requests the term sheet and redlines it on the spot.',
    },
    success: { text: 'You talk him into giving you the "sample product" for free.', loot: 0.15, xp: 10 },
    fail: { text: 'You leave having somehow invested. Synergy fee: 25 gold.', goldLoss: 25 },
  },
  {
    id: 'slapbet', title: 'The Slap Bet Commissioner', stat: 'grit', dc: 13, bonus: { chachi: 3 },
    text: 'A tiny figure in a robe offers a bet. Loser takes a slap, to be administered at any time.',
    lines: { chachi: 'Chachi has been waiting her entire life for this moment.' },
    success: { text: 'You win. You save the slap for later. The Commissioner pays out in potions.', consumable: 'bigPotion', xp: 12 },
    fail: { text: 'You lose. The slap is administered immediately. It echoes.', dmg: 12 },
  },
  {
    id: 'draft', title: 'The Fantasy Draft Board', stat: 'lore', dc: 13, bonus: { stephen: 2, tom: 1 },
    text: 'A board of dungeon monsters, ranked. You get one pick. Get it right and the league pays out.',
    lines: {
      tom: 'Tom drafts a Yankee. It is not a monster. He does not care.',
      stephen: 'Stephen drafts a Patriot out of loyalty and a Blue Jay out of hope.',
    },
    success: { text: 'League champions. The trophy is full of gold.', gold: 45, xp: 10 },
    fail: { text: 'Your pick tears an ACL in week one. Morale damage.', dmgAll: 5 },
  },
  {
    id: 'spreadsheet', title: 'The Unbalanced Ledger', stat: 'math', dc: 13,
    text: 'An ancient ledger that is off by exactly $0.03. A spectral accountant weeps beside it.',
    lines: { tom: 'Tom finds it in eleven seconds and then keeps going. He finds four more errors. The accountant weeps harder.' },
    success: { text: 'The ledger balances. The accountant pays a finder\'s fee.', gold: 40, xp: 12 },
    fail: { text: 'You make it worse. It is now off by $0.04. The accountant bites.', dmg: 10 },
  },
  {
    id: 'fountain', title: 'The Suspicious Fountain', stat: 'grit', dc: 10,
    text: 'A fountain of glowing liquid. A sign reads "PROBABLY FINE."',
    lines: { stephen: 'Stephen checks for a USP seal. There is none.' },
    success: { text: 'It was fine! Great, even. Everyone heals.', healAll: 0.4, xp: 6 },
    fail: { text: 'It was not fine.', dmg: 9 },
  },
];

// The Pub Trivia Sphinx asks a real question. Andrew's Trivia Night removes two wrong answers.
export const TRIVIA = [
  { q: 'Which team won the first World Series, in 1903?', a: ['Boston Americans', 'Pittsburgh Pirates', 'New York Highlanders', 'Chicago Cubs'], correct: 0 },
  { q: 'The Treaty of Westphalia (1648) ended which war?', a: ['The Thirty Years\' War', 'The Hundred Years\' War', 'The War of the Roses', 'The Seven Years\' War'], correct: 0 },
  { q: 'How long is a marathon, in miles?', a: ['26.2', '24.8', '26.8', '25.0'], correct: 0 },
  { q: 'In "How I Met Your Mother," what color is the umbrella?', a: ['Yellow', 'Red', 'Blue', 'Green'], correct: 0 },
  { q: 'Which Yankee wore #2 for his entire 20-year career?', a: ['Derek Jeter', 'Mariano Rivera', 'Bernie Williams', 'Jorge Posada'], correct: 0 },
  { q: 'In "Arrested Development," what is there always money in?', a: ['The banana stand', 'The model home', 'The frozen banana freezer', 'The Bluth yacht'], correct: 0 },
  { q: 'LEGO bricks were first made in which country?', a: ['Denmark', 'Sweden', 'Germany', 'Norway'], correct: 0 },
  { q: 'Who was the first Chief Justice of the United States?', a: ['John Jay', 'John Marshall', 'Roger Taney', 'Oliver Ellsworth'], correct: 0 },
  { q: 'The Blue Jays won back-to-back World Series in which years?', a: ['1992 and 1993', '1985 and 1986', '1993 and 1994', '1991 and 1992'], correct: 0 },
  { q: 'Which wood is traditionally used for a woodworker\'s mallet head because it\'s so dense?', a: ['Lignum vitae', 'Basswood', 'Balsa', 'White pine'], correct: 0 },
  { q: 'How many Super Bowls did Tom Brady win with the Patriots?', a: ['Six', 'Five', 'Seven', 'Four'], correct: 0 },
  { q: 'The Appalachian Trail runs from Georgia to which state?', a: ['Maine', 'Vermont', 'New Hampshire', 'New York'], correct: 0 },
];
