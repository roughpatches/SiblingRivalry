# Sibling Rivalry

A turn-based, procedurally generated dungeon crawl starring Tom, Stephen, Andrew and Chachi.
Built with Phaser 3 + Vite. All art is pixel maps generated in code, so there are no image files.

## Run it

```bash
npm install
npm run dev      # local dev server with hot reload
npm run build    # one self-contained dist/index.html (fonts and Phaser inlined)
```

## Saving and sound

- The run saves automatically in your browser after every room. Reopen the game and pick **Continue**.
  Finishing a run (win or lose) clears the save.
- All music and sound effects are synthesized in code. Click the speaker in the top-right corner,
  or press **M**, to mute; the choice is remembered.

## How a run works

- **Map**: each floor is a random tree of rooms on a 7x5 grid. Click a lit doorway to move.
  Chachi scouts ahead, so neighboring room types are visible while she's standing.
- **Rooms**: monsters, treasure (sometimes a mimic), skill checks, the Pub Trivia Sphinx,
  a rest stop, the Banana Stand shop, and a boss guarding the stairs.
- **Combat**: speed decides turn order each round. Every attack rolls a d20: a 1 whiffs, a 20 crits.
  Skills have cooldowns; the fourth skill unlocks at level 3. Hotkeys 1-5.
- **Perks**: from level 4 on, every level-up offers each sibling two perks (stat boosts or upgrades to
  their own skills) and they keep one.
- **Skill checks**: pick a sibling, roll d20 + their Math / Lore / Charm / Grit, beat the DC.
  The button shows each sibling's odds before you commit.
- **Loot**: gear has a weapon or trinket slot and random stats. Signature legendaries
  double their stats for the matching sibling (Jeter's gloves for Tom, the walnut bowl for Andrew...).
- **Floors**: The Basement → The Corporate Catacombs → Mount Snow (boss: the Snow Groomer)
  → The Thanksgiving Depths (final boss: the Family Group Chat Hydra). After that you can keep descending.

## Where to change things

| File | What's in it |
| --- | --- |
| `src/data/heroes.js` | The four siblings: stats, skills, passives, all their lines |
| `src/data/perks.js` | Level 4+ perks: six per sibling, pick one of two at each level-up |
| `src/data/banter.js` | Sibling-to-sibling exchanges at rest stops, fight starts and wins |
| `src/data/enemies.js` | Monsters, bosses, and floor definitions |
| `src/data/events.js` | Skill-check rooms and trivia questions |
| `src/data/items.js` | Consumables, signature legendaries, random gear names |
| `src/art/sprites.js` | Pixel maps for every character, monster and map icon |
| `src/scenes/BattleScene.js` | Combat rules and skill effects |
| `src/systems/dungeon.js` | Floor generation |
| `src/systems/sound.js` | Sound effects and the music loops for each floor |
| `src/systems/save.js` | Save and continue |
