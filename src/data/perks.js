// Perks: from level 4 on, each level-up offers a sibling two of these and they
// keep one. Half are stat boosts, half upgrade one of that sibling's skills.
//
//   stats  added to the sibling's stats (hp raises max HP)
//   mod    numbers BattleScene reads when using a skill (see perkMods below)
//   skill  the skill a mod upgrades, so its tooltip can mention the perk

export const PERKS = {
  tom: [
    { id: 'expert-network', name: 'Expert Network', skill: 'numbers', desc: 'Due Diligence hits for 2.1x instead of 1.7x.', mod: { numbersMult: 0.4 } },
    { id: 'bigger-set', name: 'Bigger Set', skill: 'bulwark', desc: 'LEGO Bulwark shields 8 more.', mod: { bulwark: 8 } },
    { id: 'framework-refresh', name: 'Framework Refresh', skill: 'matrix', desc: '2x2 Matrix cooldown drops from 3 to 2.', mod: { cd_matrix: 1 } },
    { id: 'spreadsheet-discipline', name: 'Spreadsheet Discipline', desc: '+2 ATK.', stats: { atk: 2 } },
    { id: 'pinstripe-grit', name: 'Pinstripe Grit', desc: '+14 max HP.', stats: { hp: 14 } },
    { id: 'clutch', name: 'Clutch', desc: 'Crits on a 19 or 20.', stats: { crit: 1 } },
  ],
  stephen: [
    { id: 'generic-substitution', name: 'Generic Substitution', skill: 'receipt', desc: 'Extra Care Receipt heals 55% instead of 40%.', mod: { receipt: 0.15 } },
    { id: 'seventeen-thoughts', name: 'Seventeen Quick Thoughts', skill: 'precedent', desc: 'Historical Precedent puts enemies to sleep more often (85%, bosses 45%).', mod: { sleep: 0.2 } },
    { id: 'twenty-four-hour', name: '24-Hour Pharmacy', skill: 'pharmacy', desc: 'Pharmacy Run cooldown drops from 5 to 4.', mod: { cd_pharmacy: 1 } },
    { id: 'annotated', name: 'Heavily Annotated', skill: 'footnote', desc: 'Footnote hits for 1.4x.', mod: { basic: 0.4 } },
    { id: 'tenure', name: 'Tenure', desc: '+2 DEF.', stats: { def: 2 } },
    { id: 'marginal-gains', name: 'Marginal Gains', desc: '+2 ATK.', stats: { atk: 2 } },
  ],
  andrew: [
    { id: 'sustained', name: 'Sustained', skill: 'objection', desc: 'Objection! lasts 3 turns instead of 2.', mod: { taunt: 1 } },
    { id: 'motion-to-compel', name: 'Motion to Compel', skill: 'order', desc: 'Point of Order stuns bosses 85% of the time (was 50%).', mod: { bossStun: 0.35 } },
    { id: 'omnibus', name: 'Omnibus Amendment', skill: 'amendment', desc: 'Floor Amendment gives +50% ATK instead of +35%.', mod: { amend: 0.15 } },
    { id: 'thicker-walnut', name: 'Thicker Walnut', desc: 'Woodshop Buckler starts every fight 8 stronger.', mod: { buckler: 8 } },
    { id: 'laminated-charlie', name: 'Laminated Photo of Charlie', desc: '+15 max HP.', stats: { hp: 15 } },
    { id: 'cross-examination', name: 'Cross-Examination', desc: '+2 ATK.', stats: { atk: 2 } },
  ],
  chachi: [
    { id: 'negative-split', name: 'Negative Split', skill: 'kick', desc: 'Mile 26 Kick hits 4 times instead of 3.', mod: { kickHits: 1 } },
    { id: 'dary', name: 'Legen-DARY', skill: 'legendary', desc: '...DARY! hits for 4x instead of 3.2x.', mod: { legendary: 0.8 } },
    { id: 'tailored', name: 'Tailored Suit', skill: 'suitup', desc: 'Suit Up! cooldown drops from 4 to 3.', mod: { cd_suitup: 1 } },
    { id: 'second-second-wind', name: 'Third Wind', desc: 'Second Wind can save Chachi twice per fight.', mod: { secondWind: 1 } },
    { id: 'altitude', name: 'Altitude Training', desc: '+2 SPD.', stats: { spd: 2 } },
    { id: 'trail-legs', name: 'Trail Legs', desc: '+14 max HP.', stats: { hp: 14 } },
  ],
};

// Once a sibling has taken all six, level-ups keep offering this (it stacks).
export const SEASONED = { id: 'seasoned', name: 'Seasoned', desc: '+6 max HP and +1 ATK.', stats: { hp: 6, atk: 1 } };

export function perkById(heroId, id) {
  return PERKS[heroId]?.find((p) => p.id === id) || (id === SEASONED.id ? SEASONED : null);
}

// Summed skill modifiers for a sibling's chosen perks.
export function perkMods(h) {
  const mods = {};
  for (const id of h.perks || []) {
    for (const [k, v] of Object.entries(perkById(h.id, id)?.mod || {})) mods[k] = (mods[k] || 0) + v;
  }
  return mods;
}

// The perks a sibling has taken that upgrade one skill (for its tooltip).
export function perksForSkill(h, skillId) {
  return (h.perks || []).map((id) => perkById(h.id, id)).filter((p) => p?.skill === skillId);
}

// Two perks the sibling doesn't have yet, or Seasoned when they have them all.
export function rollOffer(h, pick) {
  const left = PERKS[h.id].filter((p) => !(h.perks || []).includes(p.id));
  if (!left.length) return [SEASONED.id];
  const a = pick(left);
  const rest = left.filter((p) => p !== a);
  return rest.length ? [a.id, pick(rest).id] : [a.id];
}
