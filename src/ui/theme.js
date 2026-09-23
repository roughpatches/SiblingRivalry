// Shared look: one palette, two typefaces.
export const W = 960;
export const H = 540;

export const C = {
  ink: 0x14121c,
  stone: 0x231f30,
  stone2: 0x2f2a42,
  stone3: 0x413a5a,
  edge: 0x5b5278,
  parch: 0xefe3c2,
  dim: 0x9d93b0,
  gold: 0xf2b441,
  red: 0xd2463c,
  green: 0x6cc46f,
  blue: 0x5aa0e6,
  purple: 0xa57be0,
  orange: 0xe8843a,
};

export const hex = (n) => '#' + n.toString(16).padStart(6, '0');

export const FONT_BODY = '"VT323", "Courier New", monospace';
export const FONT_DISPLAY = '"Silkscreen", "Courier New", monospace';

export const T = {
  body: { fontFamily: FONT_BODY, fontSize: '22px', color: hex(C.parch) },
  small: { fontFamily: FONT_BODY, fontSize: '18px', color: hex(C.dim) },
  label: { fontFamily: FONT_DISPLAY, fontSize: '12px', color: hex(C.dim) },
  h2: { fontFamily: FONT_DISPLAY, fontSize: '18px', color: hex(C.gold) },
  h1: { fontFamily: FONT_DISPLAY, fontSize: '40px', color: hex(C.gold) },
};

export const RARITY = {
  common: { name: 'Common', color: C.dim },
  uncommon: { name: 'Uncommon', color: C.green },
  rare: { name: 'Rare', color: C.blue },
  legendary: { name: 'Legendary', color: C.orange },
};
