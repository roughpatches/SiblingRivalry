// All art is pixel maps turned into textures at boot. No image files needed.
// '.' is transparent; every other character looks up a color in the palette.

const SKIN = 0xf0c8a0, SKIN_D = 0xd9a77e, EYE = 0x1d1a24, MOUTH = 0x9a4a44, SHOE = 0x1b1b22;

const HERO_MAPS = {
  tom: {
    map: [
      '....CCCCCC......',
      '...CCCCCCCC.....',
      '...CCCWWCCC.....',
      '...CCCCCCCCCC...',
      '...HSSSSSSH.....',
      '...SGGSGGGS.....',
      '...SGESGEGS.....',
      '...SSSSSSSS.....',
      '....SMMMMS......',
      '.....SSSS.......',
      '...JJJWWJJJ.....',
      '..JJJJWAJJJJ.RR.',
      '..JJJJWAJJJJ.RR.',
      '..SJJJWAJJJSSRR.',
      '....JJJJJJ......',
      '....PPP.PPP.....',
      '....PPP.PPP.....',
      '...KKKK.KKKK....',
    ],
    pal: { C: 0x1c2c5b, W: 0xffffff, H: 0x3b2a1e, S: SKIN, G: 0x2a2a2a, E: EYE, M: MOUTH, J: 0x3a4152, A: 0xc0392b, P: 0x2a2d38, K: SHOE, R: 0xe03c31 },
  },
  stephen: {
    map: [
      '....LLLLLL......',
      '...LLLLLLLL.....',
      '...LLLWWLLL.....',
      '...LLLLLLLLLL...',
      '...HSSSSSSH.....',
      '...SSESSESS.....',
      '...SSSSSSSS.....',
      '...SSSSSSSS.....',
      '....SSMMSS......',
      '.....SSSS.......',
      '...VVVWWVVV.....',
      '..VVVVVVVVVV....',
      '..VVVVVVVVVVBBB.',
      '..SVVVVVVVVSBYB.',
      '....VVVVVV..BBB.',
      '....PPP.PPP.....',
      '....PPP.PPP.....',
      '...KKKK.KKKK....',
    ],
    pal: { L: 0x134a8e, W: 0xffffff, H: 0x4a3322, S: SKIN, E: EYE, M: MOUTH, V: 0xcc2233, B: 0x7a4a2a, Y: 0xf3e3b0, P: 0x3b4a5a, K: SHOE },
  },
  andrew: {
    map: [
      '................',
      '....HHHHHH......',
      '...HHHHHHHH.....',
      '...HHHHHHHHH....',
      '...HSSSSSSH.....',
      '...SSESSESS.....',
      '...SSSSSSSS.....',
      '...SSSSSSSS.....',
      '....SSMMSS......',
      '.....SSSS...OOO.',
      '...JJJWWJJJ.OOO.',
      '..JJJJWAJJJJ.o..',
      '..JJJJWAJJJJ.o..',
      '..SJJJWAJJJSSo..',
      '....JJJJJJ......',
      '....PPP.PPP.....',
      '....PPP.PPP.....',
      '...KKKK.KKKK....',
    ],
    pal: { H: 0x5a3b22, S: SKIN, E: EYE, M: MOUTH, J: 0x6b6f7a, W: 0xffffff, A: 0x2e5fa8, P: 0x4b4f5a, K: 0x5a3320, O: 0x8a5a2b, o: 0xc49a6c },
  },
  chachi: {
    map: [
      '................',
      '...HHHHHHHH.....',
      '..HHHHHHHHH.....',
      '.HHDDDDDDDD.....',
      '.HHSSSSSSSH.....',
      'HH.SSESSESS.....',
      'H..SSSSSSSS.....',
      '...SSSSSSSS.....',
      '....SSMMSS....Q.',
      '.....SSSS.....Q.',
      '...TTTTTTTT...Q.',
      '..STTTWWTTTS..Q.',
      '..STTTWWTTTS..Q.',
      '..S.TTTTTT.SSQ..',
      '....TTTTTT....Q.',
      '....NNN.NNN.....',
      '....SSS.SSS.....',
      '...KKKK.KKKK....',
    ],
    pal: { H: 0x6b4226, D: 0xff6fa0, S: SKIN, E: EYE, M: MOUTH, T: 0x2bb3a0, W: 0xffffff, N: 0x333a55, K: 0xff7a30, Q: 0xb8c0cc },
  },
};

const ENEMY_MAPS = {
  blob: [
    '................',
    '................',
    '................',
    '................',
    '......XXXX......',
    '....XXXXXXXX....',
    '...XXXXXXXXXX...',
    '..XXXLXXXXXXXX..',
    '..XXLLXXXXXXXX..',
    '.XXXXEXXXXEXXXX.',
    '.XXXXEXXXXEXXXX.',
    '.XXXXXXXXXXXXXX.',
    '.XXXXXMMMMXXXXX.',
    '..XXXXXXXXXXXX..',
    '...DDDDDDDDDD...',
    '................',
  ],
  bat: [
    '................',
    '................',
    '................',
    'X.............X.',
    'XX...X....X..XX.',
    'XXX..XXXXXX.XXX.',
    'XXXXXXXXXXXXXXX.',
    'XXXXXXEXXEXXXXX.',
    '.XXXXXXXXXXXXX..',
    '..XXX.XMMX.XXX..',
    '...X...XX...X...',
    '................',
    '................',
    '................',
    '................',
    '................',
  ],
  ghost: [
    '................',
    '.....XXXXXX.....',
    '....XXXXXXXX....',
    '...XXXXXXXXXX...',
    '...XXEEXXEEXX...',
    '...XXEEXXEEXX...',
    '...XXXXXXXXXX...',
    '...XXXXMMXXXX...',
    '...XXXXMMXXXX...',
    '..XXXXXXXXXXXX..',
    '..XXXXXXXXXXXX..',
    '...XXXXXXXXXX...',
    '...XXXXXXXXXX...',
    '...XX.XXX.XXX...',
    '...X...X...X....',
    '................',
  ],
  golem: [
    '................',
    '.....XXXXXX.....',
    '.....XEXXEX.....',
    '.....XXMMXX.....',
    '..XXXXXXXXXXXX..',
    '.XXLXXLXXLXXLXX.',
    '.XXXXXXXXXXXXXX.',
    '.XXLXXLXXLXXLXX.',
    '.XX.XXXXXXXX.XX.',
    '.XX.XXLXXLXX.XX.',
    '.DD.XXXXXXXX.DD.',
    '....XXX..XXX....',
    '....XXX..XXX....',
    '....XXX..XXX....',
    '...DDDD..DDDD...',
    '................',
  ],
  goblin: [
    '................',
    '....RRRRRR......',
    '...RRRWRRRRRR...',
    '...XXXXXXXX.....',
    '.XXXXEXXEXXXX...',
    '...XXXXXXXX.....',
    '...XXMMMMXX.....',
    '....XXXXXX......',
    '...BBBBBBBB.....',
    '..XBBRRRBBBX....',
    '..XBBBBBBBBX....',
    '....BBBBBB......',
    '....DD..DD......',
    '....DD..DD......',
    '...KKK..KKK.....',
    '................',
  ],
  mimic: [
    '................',
    '................',
    '...XXXXXXXXXX...',
    '..XXLLLLLLLLXX..',
    '..XXXXXXXXXXXX..',
    '..MWMWMWMWMWMM..',
    '..MMMMMMMMMMMM..',
    '..MWMWMWMWMWMM..',
    '..XXXXXXXXXXXX..',
    '..XXXXDDXXXXXX..',
    '..XXXXDDXXXXXX..',
    '..XXLLLLLLLLXX..',
    '..XXXXXXXXXXXX..',
    '...DDDDDDDDDD...',
    '................',
    '................',
  ],
  imp: [
    '................',
    '...X........X...',
    '...XX......XX...',
    '....XXXXXXXX....',
    '...XXEXXXXEXX...',
    '...XXXXXXXXXX...',
    '....XXWMMWXX....',
    '.....XXXXXX.....',
    '..X.XXXXXXXX.X..',
    '..XXXXXXXXXXXX..',
    '....XXXXXXXX....',
    '....XXXXXXXX....',
    '.....XX..XX...X.',
    '.....XX..XXXXX..',
    '....DDD..DDD....',
    '................',
  ],
  hydra: [
    '................',
    '......XXXXX.....',
    '.....XXXXXXXX...',
    '....XXXEEXXXXX..',
    '....XXXEEXXXXXX.',
    '...XXXXXXXXWXWX.',
    '...XXXXXXXXXXXXX',
    '...XXXXXXXMMMMMM',
    '...XXXXXXXXWXWX.',
    '...XLXXXXXXXXX..',
    '...XLLXXX.......',
    '...XXLLXX.......',
    '...XXXLLX.......',
    '....XXXXX.......',
    '....XXXXX.......',
    '....DDDDD.......',
  ],
};

// Charlie, Andrew's cat. Gray tabby: change CHARLIE_PAL to recolor.
const CHARLIE_MAP = [
  '..X.....X.......',
  '..XX...XX.......',
  '..XDXDXDX.......',
  '..XEXXXEX.......',
  '..XXXNXXX.......',
  '...XWWWX........',
  '...XXXXXX.......',
  '..XXXWWXXX......',
  '..XDXWWWXX....X.',
  '..XXDWWXDXX...X.',
  '..XDXXXXXDX..XX.',
  '..XXXXXXXXXXXX..',
  '..XX.XX.XXXX....',
  '..WW.WW.........',
];
const CHARLIE_PAL = { X: 0x8a8f99, D: 0x5c616b, W: 0xf2f2f2, E: 0x7bd36b, N: 0xe99aa8 };
export const CHARLIE = 'charlie';

const ICONS = {
  combat: ['W......W', '.W....W.', '..W..W..', '...WW...', '...WW...', '..G..G..', '.G....G.', 'G......G'],
  treasure: ['........', '.GGGGGG.', 'GBBBBBBG', 'GGGGGGGG', 'GBBYYBBG', 'GBBBBBBG', 'GGGGGGGG', '........'],
  rest: ['...O....', '...OO...', '..OYO...', '..OYYO..', '.OYYYO..', '..OOO...', '.B.B.B..', 'BBBBBBB.'],
  event: ['...WW...', '..WWWW..', '.WW..WW.', 'WW.WW.WW', 'WW.WW.WW', '.WW..WW.', '..WWWW..', '...WW...'],
  trivia: ['..YYYY..', '.YY..YY.', '.....YY.', '....YY..', '...YY...', '...YY...', '........', '...YY...'],
  boss: ['..WWWW..', '.WWWWWW.', 'WWWWWWWW', 'W..WW..W', 'WWWWWWWW', '.WW..WW.', '..W.W.W.', '........'],
  stairs: ['......WW', '......W.', '....WWW.', '....W...', '..WWW...', '..W.....', 'WWW.....', 'W.......'],
  shop: ['...YY...', '..YYYYY.', '.YY.Y...', '..YYYY..', '....Y.YY', '.YYYYYY.', '...YY...', '........'],
  unknown: ['..WWWW..', '.W....W.', '......W.', '....WW..', '...W....', '...W....', '........', '...W....'],
  start: ['...W....', '...WWW..', '...WWWW.', '...W....', '...W....', '...W....', '..WWW...', '.WWWWW..'],
};
const ICON_PAL = { W: 0xefe3c2, G: 0x9d93b0, B: 0x8a5a2b, Y: 0xf2b441, O: 0xe8843a };

function paint(scene, key, rows, pal, scale) {
  if (scene.textures.exists(key)) return;
  const h = rows.length, w = rows[0].length;
  const tex = scene.textures.createCanvas(key, w * scale, h * scale);
  const ctx = tex.getContext();
  ctx.imageSmoothingEnabled = false;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const ch = rows[y][x];
      if (ch === '.' || ch === undefined) continue;
      const col = pal[ch];
      if (col === undefined) continue;
      ctx.fillStyle = '#' + col.toString(16).padStart(6, '0');
      ctx.fillRect(x * scale, y * scale, scale, scale);
    }
  }
  tex.refresh();
}

export function heroKey(id) { return `hero-${id}`; }
export function portraitKey(id) { return `portrait-${id}`; }
export function iconKey(t) { return `icon-${t}`; }

export function buildBaseTextures(scene) {
  for (const [id, { map, pal }] of Object.entries(HERO_MAPS)) {
    paint(scene, heroKey(id), map, pal, 4);
    paint(scene, portraitKey(id), map.slice(0, 10), pal, 3);
  }
  for (const [k, rows] of Object.entries(ICONS)) paint(scene, iconKey(k), rows, ICON_PAL, 3);
  paint(scene, CHARLIE, CHARLIE_MAP, CHARLIE_PAL, 4);

  // A soft shadow ellipse and a sparkle for effects
  if (!scene.textures.exists('shadow')) {
    const g = scene.make.graphics({ add: false });
    g.fillStyle(0x000000, 0.45).fillEllipse(32, 8, 60, 14);
    g.generateTexture('shadow', 64, 16);
    g.destroy();
  }
  if (!scene.textures.exists('spark')) {
    const g = scene.make.graphics({ add: false });
    g.fillStyle(0xffffff, 1).fillRect(3, 0, 2, 8).fillRect(0, 3, 8, 2);
    g.generateTexture('spark', 8, 8);
    g.destroy();
  }
}

// Enemy textures are colored per species, built on demand.
export function enemyTexture(scene, id, def) {
  const key = `enemy-${id}`;
  const pal = { ...def.colors };
  pal.E = pal.E ?? 0x111111; pal.M = pal.M ?? 0x331111; pal.W = pal.W ?? 0xffffff;
  pal.D = pal.D ?? 0x000000; pal.L = pal.L ?? 0xffffff; pal.K = pal.K ?? 0x222222;
  paint(scene, key, ENEMY_MAPS[def.shape], pal, 5);
  return key;
}
