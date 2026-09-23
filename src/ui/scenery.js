import { W, T } from './theme.js';

// Floor-specific props drawn over the brick backdrop in battle.
// Everything sits in the gaps between the party (left) and the enemies (right),
// or along the ceiling and far-right edge, so it never hides a fighter.
// The fight area ends at y 360; the strip from 360 to 400 is the floor.

const FLOOR_Y = 360, FLOOR_H = 40;

export function scenery(scene, theme) {
  const g = scene.add.graphics().setDepth(-6);
  if (theme === 'office') office(scene, g);
  else if (theme === 'dining') dining(scene, g);
  else if (theme === 'snow') snow(scene, g);
  else basement(scene, g);
  return g;
}

// Whether the floor keeps the dungeon's wall torches.
export const hasTorches = (theme) => theme !== 'office' && theme !== 'snow';

// ------------------------------------------------------------ The Basement
function basement(scene, g) {
  // concrete floor with a few cracks and a drain
  g.fillStyle(0x4a4750, 1).fillRect(0, FLOOR_Y, W, FLOOR_H);
  g.fillStyle(0x3a3740, 1);
  for (let x = 0; x < W; x += 120) g.fillRect(x, FLOOR_Y, 2, FLOOR_H);
  g.lineStyle(1, 0x2c2a31, 1).lineBetween(420, 366, 452, 380).lineBetween(452, 380, 470, 377);
  g.fillStyle(0x2a282e, 1).fillCircle(520, 382, 7);
  g.fillStyle(0x1a181d, 1).fillRect(515, 381, 10, 2);

  // ceiling joists and pipes
  g.fillStyle(0x3b2a1e, 1);
  for (let x = 0; x < W; x += 96) g.fillRect(x, 0, 18, 10);
  g.fillStyle(0x8a5a36, 1).fillRect(0, 14, W, 5);
  g.fillStyle(0x6d7178, 1).fillRect(0, 24, W, 4);
  g.fillStyle(0x5a3b22, 1);
  for (let x = 60; x < W; x += 180) g.fillRect(x, 13, 6, 7);

  // stacked cardboard boxes, far right
  const box = (x, y, w, h, label) => {
    g.fillStyle(0xa87c48, 1).fillRect(x, y, w, h);
    g.fillStyle(0x8a6236, 1).fillRect(x, y, w, 4);
    g.fillStyle(0xd8c49a, 1).fillRect(x + w / 2 - 3, y, 6, h);
    if (label) scene.add.text(x + 4, y + h - 16, label, { ...T.small, fontSize: '12px', color: '#3a2a18' }).setDepth(-5);
  };
  box(884, 300, 66, 60, 'MISC');
  box(890, 250, 56, 50, 'XMAS');
  box(898, 210, 42, 40);

  // washer and dryer, center
  const machine = (x, label) => {
    g.fillStyle(0xd9d6cf, 1).fillRect(x, 262, 76, 98);
    g.fillStyle(0xbdb9b0, 1).fillRect(x, 262, 76, 16);
    g.fillStyle(0x6b6f78, 1).fillCircle(x + 38, 318, 25);
    g.fillStyle(0x2d3a4a, 1).fillCircle(x + 38, 318, 19);
    g.fillStyle(0x4a6a8a, 0.6).fillCircle(x + 32, 312, 7);
    g.fillStyle(0x3a3a3a, 1).fillCircle(x + 60, 270, 4);
    g.fillStyle(label, 1).fillRect(x + 8, 268, 20, 4);
  };
  machine(392, 0x6cc46f);
  machine(478, 0xd2463c);
  // a sock on top of the dryer, naturally
  g.fillStyle(0xefe3c2, 1).fillRect(500, 254, 16, 8).fillRect(510, 246, 6, 10);

  // bare bulb and its light
  g.lineStyle(2, 0x222222, 1).lineBetween(470, 28, 470, 150);
  const cone = scene.add.triangle(0, 0, 470, 156, 360, FLOOR_Y + 20, 580, FLOOR_Y + 20, 0xfff2b0, 0.06).setOrigin(0, 0).setDepth(-7);
  scene.add.circle(470, 158, 8, 0xfff2b0, 1).setDepth(-5);
  const glow = scene.add.circle(470, 158, 26, 0xfff2b0, 0.18).setDepth(-5);
  scene.tweens.add({ targets: [glow, cone], alpha: { from: 0.6, to: 1 }, duration: 1800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
}

// ------------------------------------------------------ The Corporate Catacombs
function office(scene, g) {
  // speckled grey-blue carpet
  g.fillStyle(0x3d4656, 1).fillRect(0, FLOOR_Y, W, FLOOR_H);
  g.fillStyle(0x4b5568, 1);
  for (let i = 0; i < 160; i++) g.fillRect((i * 97) % W, FLOOR_Y + ((i * 37) % FLOOR_H), 2, 2);

  // drop-ceiling tiles and fluorescent panels (one of them flickers)
  g.fillStyle(0xcfd2d6, 0.18).fillRect(0, 0, W, 22);
  g.lineStyle(1, 0x000000, 0.35);
  for (let x = 0; x < W; x += 80) g.lineBetween(x, 0, x, 22);
  [120, 360, 600, 840].forEach((x, i) => {
    const panelG = scene.add.rectangle(x, 11, 90, 10, 0xf4fbff, 1).setDepth(-5);
    const wash = scene.add.rectangle(x, 60, 150, 90, 0xe8f6ff, 0.05).setDepth(-7);
    if (i === 2) {
      scene.time.addEvent({
        delay: 140, loop: true,
        callback: () => { const on = Math.random() > 0.12; panelG.setAlpha(on ? 1 : 0.25); wash.setAlpha(on ? 1 : 0); },
      });
    }
  });

  // whiteboard with this quarter's priorities
  g.fillStyle(0x9aa0a8, 1).fillRect(386, 118, 188, 104);
  g.fillStyle(0xf4f6f8, 1).fillRect(390, 122, 180, 96);
  g.lineStyle(2, 0x3a78c8, 1).lineBetween(404, 200, 440, 186).lineBetween(440, 186, 470, 194).lineBetween(470, 194, 520, 150);
  g.lineStyle(2, 0xd2463c, 1).strokeCircle(520, 150, 8);
  scene.add.text(398, 124, 'Q3 SYNERGY', { ...T.small, fontSize: '16px', color: '#2a4f8a' }).setDepth(-5);
  g.fillStyle(0x333333, 1).fillRect(430, 222, 100, 4);

  // cubicle wall with a monitor peeking over
  g.fillStyle(0x6f7a8c, 1).fillRect(350, 282, 260, 78);
  g.fillStyle(0x59637a, 1).fillRect(350, 278, 260, 6);
  g.fillStyle(0x7d889a, 1);
  for (let x = 352; x < 610; x += 65) g.fillRect(x, 286, 2, 72);
  g.fillStyle(0x222428, 1).fillRect(430, 252, 56, 30);
  g.fillStyle(0x3b6db3, 1).fillRect(434, 256, 48, 22);
  g.fillStyle(0xefe3c2, 1).fillRect(560, 268, 12, 12);
  g.fillStyle(0x6b3a2a, 1).fillRect(572, 271, 3, 6);

  // potted plant and water cooler
  g.fillStyle(0x8a5a36, 1).fillRect(612, 332, 26, 28);
  g.fillStyle(0x3f8a4a, 1).fillCircle(625, 318, 14).fillCircle(615, 308, 9).fillCircle(636, 306, 9);
  g.fillStyle(0xd9dde2, 1).fillRect(896, 290, 44, 70);
  g.fillStyle(0x7fb8e8, 0.85).fillRect(900, 236, 36, 54);
  g.fillStyle(0x5aa0e6, 0.9).fillRect(900, 256, 36, 34);
  g.fillStyle(0x3a3a3a, 1).fillRect(908, 304, 8, 6);
}

// ------------------------------------------------------ The Thanksgiving Depths
function dining(scene, g) {
  // hardwood floor
  g.fillStyle(0x6b4424, 1).fillRect(0, FLOOR_Y, W, FLOOR_H);
  g.fillStyle(0x5a381c, 1);
  for (let y = FLOOR_Y + 9; y < FLOOR_Y + FLOOR_H; y += 10) g.fillRect(0, y, W, 1);
  for (let i = 0; i < 24; i++) g.fillRect(((i * 173) % W), FLOOR_Y + 10 * (i % 4), 1, 9);

  // striped wallpaper and wainscoting over the stone
  for (let x = 0; x < W; x += 24) g.fillStyle(x % 48 ? 0x5a3a2a : 0x6b4632, 0.55).fillRect(x, 0, 24, 300);
  g.fillStyle(0x4a2e1c, 1).fillRect(0, 300, W, 60);
  g.fillStyle(0x6b4424, 1).fillRect(0, 298, W, 6);
  g.lineStyle(2, 0x3a2414, 1);
  for (let x = 330; x < 640; x += 78) g.strokeRect(x, 312, 64, 38);

  // window onto a cold November night
  g.fillStyle(0x3a2414, 1).fillRect(410, 96, 140, 124);
  g.fillStyle(0x1a2344, 1).fillRect(418, 104, 124, 108);
  g.fillStyle(0xefe3c2, 0.9).fillCircle(512, 124, 9);
  g.fillStyle(0x3a2414, 1).fillRect(477, 104, 6, 108).fillRect(418, 155, 124, 6);
  g.fillStyle(0x8a2f2a, 1).fillRect(398, 92, 18, 136).fillRect(544, 92, 18, 136);

  // the family portrait: four siblings, one tuxedo cat
  g.fillStyle(0xb88a3a, 1).fillRect(326, 124, 64, 50);
  g.fillStyle(0x2a2438, 1).fillRect(331, 129, 54, 40);
  [[0x1c2c5b, 339], [0x2a5bb8, 351], [0x6b4226, 363], [0xff6fa0, 375]].forEach(([hat, x]) => {
    g.fillStyle(0xf0c8a0, 1).fillRect(x - 3, 146, 7, 7);
    g.fillStyle(hat, 1).fillRect(x - 3, 143, 7, 3);
    g.fillStyle(0x444a5a, 1).fillRect(x - 3, 154, 7, 10);
  });
  g.fillStyle(0x1c1c22, 1).fillRect(380, 160, 5, 4);
  g.fillStyle(0xf4f4f4, 1).fillRect(381, 162, 2, 2);

  // sideboard with the pie and two candles
  g.fillStyle(0x3a2414, 1).fillRect(600, 262, 40, 98);
  g.fillStyle(0xefe3c2, 1).fillRect(596, 256, 48, 8);
  g.fillStyle(0xc9803a, 1).fillEllipse(620, 250, 30, 10);
  g.fillStyle(0xa8612a, 1).fillEllipse(620, 248, 22, 6);
  [340, 364].forEach((x) => {
    g.fillStyle(0xefe3c2, 1).fillRect(x, 270, 6, 28);
    const flame = scene.add.ellipse(x + 3, 264, 6, 10, 0xf2b441, 1).setDepth(-5);
    const halo = scene.add.circle(x + 3, 264, 14, 0xf2b441, 0.18).setDepth(-5);
    scene.tweens.add({ targets: [flame, halo], scaleY: { from: 0.85, to: 1.15 }, alpha: { from: 0.8, to: 1 }, duration: 220 + x, yoyo: true, repeat: -1 });
  });
  g.fillStyle(0x3a2414, 1).fillRect(330, 298, 50, 4);
}

// ------------------------------------------------------------ Mount Snow
function snow(scene, g) {
  // Night sky over the whole wall, fading lighter toward the horizon.
  const bands = [0x0e1528, 0x121b33, 0x17223d, 0x1c2947, 0x223152];
  bands.forEach((c, i) => g.fillStyle(c, 1).fillRect(0, i * 48, W, 48));
  g.fillStyle(0x223152, 1).fillRect(0, 240, W, 60);
  g.fillStyle(0xefe3c2, 0.9);
  [[70, 40], [210, 70], [330, 30], [520, 55], [610, 22], [760, 48], [880, 30], [430, 90], [300, 110]].forEach(([x, y]) => g.fillRect(x, y, 2, 2));
  g.fillStyle(0xefe3c2, 1).fillCircle(860, 70, 16);
  g.fillStyle(0x0e1528, 1).fillCircle(853, 65, 14);

  // Mountains: far range, then the near ridge with snowcaps.
  g.fillStyle(0x2c3a5c, 1).fillTriangle(-40, 280, 160, 120, 360, 280).fillTriangle(260, 280, 470, 100, 700, 280).fillTriangle(600, 280, 820, 140, 1040, 280);
  g.fillStyle(0xdfe8f2, 0.9).fillTriangle(130, 142, 160, 120, 190, 142).fillTriangle(440, 124, 470, 100, 500, 124).fillTriangle(790, 162, 820, 140, 850, 162);
  g.fillStyle(0x3a4a70, 1).fillTriangle(-80, 320, 240, 200, 560, 320).fillTriangle(400, 320, 700, 190, 1020, 320);

  // The slope itself, and snow on the ground strip.
  g.fillStyle(0xc9d6e6, 1).fillRect(0, 300, W, 60);
  g.fillStyle(0xb4c4d8, 1);
  for (let x = 0; x < W; x += 16) g.fillRect(x, 318 + ((x * 7) % 9), 10, 1);
  g.fillStyle(0xdfe8f2, 1).fillRect(0, FLOOR_Y, W, 40);
  g.fillStyle(0xc9d6e6, 1);
  for (let x = 0; x < W; x += 6) g.fillRect(x, FLOOR_Y + 12 + (x % 18 === 0 ? 8 : 0), 3, 1);

  // Pines along the ridge (kept to the middle and far right).
  const pine = (x, y, h) => {
    g.fillStyle(0x1b3a2c, 1).fillTriangle(x - h * 0.35, y, x, y - h, x + h * 0.35, y);
    g.fillStyle(0xdfe8f2, 0.85).fillTriangle(x - h * 0.12, y - h * 0.62, x, y - h, x + h * 0.12, y - h * 0.62);
    g.fillStyle(0x3b2a1e, 1).fillRect(x - 2, y, 4, 6);
  };
  [[350, 300, 44], [372, 304, 30], [612, 302, 40], [636, 306, 28], [900, 300, 50], [930, 306, 34]].forEach(([x, y, h]) => pine(x, y, h));

  // The ski house on Overlook Drive, windows lit.
  g.fillStyle(0x5a3b22, 1).fillRect(440, 244, 84, 56);
  g.fillStyle(0xdfe8f2, 1).fillTriangle(428, 248, 482, 206, 536, 248);
  g.fillStyle(0x3b2a1e, 1).fillTriangle(436, 246, 482, 212, 528, 246);
  g.fillStyle(0xf2b441, 1).fillRect(452, 258, 14, 12).fillRect(498, 258, 14, 12).fillRect(476, 276, 12, 24);
  g.fillStyle(0x3b2a1e, 1).fillRect(504, 214, 8, 18);
  scene.add.text(482, 302, 'OVERLOOK DR.', { ...T.label, fontSize: '9px', color: '#3a4a70' }).setOrigin(0.5, 0).setDepth(-5);
  const smoke = scene.add.circle(508, 206, 5, 0xdfe8f2, 0.5).setDepth(-5);
  scene.tweens.add({ targets: smoke, y: 180, alpha: 0, scale: 2, duration: 1800, repeat: -1 });

  // Chairlift: a cable across the sky, two towers, chairs sliding along it.
  g.lineStyle(1, 0x0b0f1a, 1).lineBetween(0, 150, W, 116);
  [[400, 138], [596, 130]].forEach(([x, y]) => { g.fillStyle(0x0b0f1a, 1).fillRect(x - 2, y, 4, 300 - y).fillRect(x - 10, y, 20, 3); });
  for (let i = 0; i < 4; i++) {
    const chair = scene.add.container(0, 0, [
      scene.add.rectangle(0, 0, 1, 14, 0x0b0f1a).setOrigin(0.5, 0),
      scene.add.rectangle(0, 14, 16, 3, 0x0b0f1a),
      scene.add.rectangle(-7, 10, 2, 6, 0x0b0f1a),
    ]).setDepth(-5);
    const place = (t) => chair.setPosition(t * W, 150 - 34 * t);
    const state = { t: i / 4 };
    place(state.t);
    scene.tweens.add({ targets: state, t: state.t + 1, duration: 36000, repeat: -1, onUpdate: () => place(state.t % 1) });
  }

  // Falling snow, in front of the scenery but behind the fighters.
  const flakes = Array.from({ length: 90 }, () => {
    const big = Math.random() < 0.3;
    return {
      o: scene.add.rectangle(Math.random() * W, Math.random() * 400, big ? 3 : 2, big ? 3 : 2, 0xffffff, big ? 0.9 : 0.6).setDepth(-4),
      vy: big ? 0.9 : 0.5, drift: Math.random() * Math.PI * 2,
    };
  });
  const fall = (time, delta) => {
    const k = delta / 16.7;
    for (const f of flakes) {
      f.o.y += f.vy * k;
      f.o.x += Math.sin(time / 900 + f.drift) * 0.35 * k;
      if (f.o.y > 400) { f.o.y = -4; f.o.x = Math.random() * W; }
    }
  };
  scene.events.on('update', fall);
  scene.events.once('shutdown', () => scene.events.off('update', fall));
}
