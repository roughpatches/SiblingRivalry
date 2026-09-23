import { C, T, hex } from './theme.js';

// Per-skill battle effects. Each one is fire-and-forget: it animates, then
// cleans up after itself. Callers pass units ({ x, y }) from BattleScene.

const rnd = (a, b) => a + Math.random() * (b - a);
const LEGO = [0xd2463c, 0x3a78c8, 0xf2b441, 0x6cc46f];

// Tom: LEGO Bulwark. Bricks drop in and snap into a small wall in front of each sibling.
export function legoWall(scene, heroes) {
  heroes.forEach((h, hi) => {
    const bricks = [];
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 2; col++) {
        const x = h.x + 34 + col * 16 + (row % 2) * 8;
        const y = h.y + 26 - row * 10;
        const color = LEGO[(row + col + hi) % LEGO.length];
        const brick = scene.add.container(x, y - 120, [
          scene.add.rectangle(0, 0, 15, 9, color).setStrokeStyle(1, 0x000000, 0.4),
          scene.add.rectangle(-4, -6, 4, 3, color),
          scene.add.rectangle(4, -6, 4, 3, color),
        ]).setDepth(5).setAlpha(0);
        scene.tweens.add({ targets: brick, y, alpha: 1, duration: 260, delay: hi * 60 + (row * 2 + col) * 55, ease: 'Bounce.easeOut' });
        bricks.push(brick);
      }
    }
    scene.tweens.add({ targets: bricks, alpha: 0, delay: 1300, duration: 400, onComplete: () => bricks.forEach((b) => b.destroy()) });
  });
}

// Tom: Run the Numbers / Due Diligence. Figures stream from Tom into the target.
export function numberStream(scene, from, to) {
  const glyphs = ['$', '%', '7', '3', '0', 'Σ', '9', '+', '1'];
  for (let i = 0; i < 12; i++) {
    const t = scene.add.text(from.x + 20, from.y - 10 + rnd(-20, 20), glyphs[i % glyphs.length], { ...T.body, fontSize: '22px', color: hex(C.blue) })
      .setOrigin(0.5).setDepth(6).setStroke('#000', 3);
    scene.tweens.add({
      targets: t, x: to.x + rnd(-14, 14), y: to.y + rnd(-20, 20), alpha: { from: 1, to: 0.2 },
      duration: 380, delay: i * 30, ease: 'Quad.easeIn', onComplete: () => t.destroy(),
    });
  }
}

// Tom: 2x2 Matrix. A consulting grid drops over the enemy side; the bad quadrant lights up.
export function matrix(scene, enemies) {
  if (!enemies.length) return;
  const xs = enemies.map((e) => e.x), ys = enemies.map((e) => e.y);
  const x0 = Math.min(...xs) - 80, x1 = Math.max(...xs) + 80;
  const y0 = Math.min(...ys) - 70, y1 = Math.max(...ys) + 70;
  const mx = (x0 + x1) / 2, my = (y0 + y1) / 2;
  const g = scene.add.graphics().setDepth(4);
  g.fillStyle(C.blue, 0.16).fillRect(mx, my, x1 - mx, y1 - my);
  g.lineStyle(3, C.parch, 0.9).strokeRect(x0, y0, x1 - x0, y1 - y0);
  g.lineBetween(mx, y0, mx, y1).lineBetween(x0, my, x1, my);
  const lab = (x, y, s, o, bg) => scene.add.text(x, y, s, { ...T.label, fontSize: '10px', color: hex(C.parch), backgroundColor: bg, padding: bg ? { x: 4, y: 2 } : undefined })
    .setOrigin(...o).setDepth(8).setStroke('#000', bg ? 0 : 3);
  // Axes: value runs up the left edge, effort along the bottom. The bad quadrant gets a tag.
  const labels = [
    lab(x0 + 4, y0 + 4, 'HIGH VALUE', [0, 0]), lab(x0 + 4, y1 - 4, 'LOW VALUE', [0, 1]),
    lab(x1 - 4, y1 + 4, 'HIGH EFFORT →', [1, 0]),
    lab(x1 - 4, my + 4, 'LOW VALUE / HIGH EFFORT', [1, 0], '#2a4f8acc'),
  ];
  const all = [g, ...labels];
  all.forEach((o) => o.setAlpha(0));
  scene.tweens.add({ targets: all, alpha: 1, duration: 200 });
  scene.tweens.add({ targets: all, alpha: 0, delay: 1200, duration: 350, onComplete: () => all.forEach((o) => o.destroy()) });
}

// Stephen: Extra Care Receipt. A very long receipt unrolls over the target, then fades.
export function receipt(scene, target) {
  // Keep clear of the turn-order strip along the top of the screen.
  const top = Math.max(72, target.y - 80);
  const paper = scene.add.container(target.x + 34, top).setDepth(6);
  paper.add(scene.add.rectangle(0, 0, 22, 116, 0xfbfaf4).setOrigin(0.5, 0).setStrokeStyle(1, 0x999999, 0.6));
  paper.add(scene.add.rectangle(0, 3, 16, 4, 0xcc2233).setOrigin(0.5, 0));
  for (let y = 12; y < 112; y += 6) paper.add(scene.add.rectangle(rnd(-3, 1), y, rnd(8, 15), 2, 0x9a9a9a).setOrigin(0.5, 0));
  paper.setScale(1, 0);
  scene.tweens.add({ targets: paper, scaleY: 1, duration: 450, ease: 'Quad.easeOut' });
  scene.tweens.add({ targets: paper, alpha: 0, y: top + 12, delay: 1100, duration: 400, onComplete: () => paper.destroy() });
}

// Stephen: Historical Precedent. A heavy book thumps open beside Stephen.
export function book(scene, u) {
  // Beside him rather than above, so it doesn't cover the label of the sibling above.
  const b = scene.add.container(u.x + 62, u.y - 18, [
    scene.add.rectangle(-13, 0, 24, 30, 0x6b2a2a).setStrokeStyle(1, 0x000000, 0.6),
    scene.add.rectangle(13, 0, 24, 30, 0x6b2a2a).setStrokeStyle(1, 0x000000, 0.6),
    scene.add.rectangle(-12, 0, 20, 26, 0xefe3c2),
    scene.add.rectangle(12, 0, 20, 26, 0xefe3c2),
  ]).setDepth(6).setScale(0.3, 1).setAlpha(0);
  for (let i = 0; i < 4; i++) b.add(scene.add.rectangle(-12, -8 + i * 6, 14, 2, 0x777777));
  scene.tweens.add({ targets: b, scaleX: 1, alpha: 1, duration: 280, ease: 'Back.easeOut' });
  scene.tweens.add({ targets: b, alpha: 0, y: b.y - 16, delay: 1100, duration: 350, onComplete: () => b.destroy() });
}

// Stephen: Pharmacy Run. Green crosses rise off every sibling.
export function crosses(scene, heroes) {
  heroes.forEach((h, hi) => {
    for (let i = 0; i < 4; i++) {
      const c = scene.add.container(h.x + rnd(-22, 22), h.y + rnd(0, 30), [
        scene.add.rectangle(0, 0, 12, 4, C.green), scene.add.rectangle(0, 0, 4, 12, C.green),
      ]).setDepth(6).setAlpha(0);
      scene.tweens.add({
        targets: c, y: c.y - 50, alpha: { from: 1, to: 0 }, duration: 900, delay: hi * 80 + i * 120,
        onComplete: () => c.destroy(),
      });
    }
  });
}

// Andrew: Objection! / Point of Order. A gavel swings down; a shockwave rolls out.
export function gavel(scene, at, big = true) {
  const s = big ? 1.4 : 1;
  const hx = at.x + (big ? 0 : 10), hy = at.y - (big ? 64 : 50);
  const gv = scene.add.container(hx + 18 * s, hy, [
    scene.add.rectangle(0, 14 * s, 5 * s, 30 * s, 0x8a5a36),
    scene.add.rectangle(0, 0, 28 * s, 13 * s, 0x5a3b22).setStrokeStyle(1, 0x000000, 0.6),
    scene.add.rectangle(-10 * s, 0, 3 * s, 13 * s, 0xf2b441),
    scene.add.rectangle(10 * s, 0, 3 * s, 13 * s, 0xf2b441),
  ]).setDepth(7).setAngle(-70);
  scene.tweens.add({
    targets: gv, angle: 20, duration: 180, ease: 'Quad.easeIn',
    onComplete: () => {
      const ring = scene.add.circle(at.x, at.y, 10, C.red, 0).setStrokeStyle(3, big ? C.red : C.gold, 1).setDepth(6);
      scene.tweens.add({ targets: ring, radius: big ? 90 : 45, alpha: 0, duration: 450, onComplete: () => ring.destroy() });
      scene.tweens.add({ targets: gv, alpha: 0, delay: 300, duration: 250, onComplete: () => gv.destroy() });
    },
  });
}

// Andrew: Floor Amendment. A small signed page floats up off each sibling.
export function amendment(scene, heroes) {
  heroes.forEach((h, i) => {
    const p = scene.add.container(h.x + 30, h.y - 10, [
      scene.add.rectangle(0, 0, 20, 26, C.parch).setStrokeStyle(1, 0x8a7a5a),
      scene.add.rectangle(0, -6, 12, 2, 0x777777), scene.add.rectangle(0, -1, 12, 2, 0x777777),
      scene.add.rectangle(-2, 6, 8, 2, C.red),
    ]).setDepth(6).setAlpha(0);
    scene.tweens.add({ targets: p, y: p.y - 40, alpha: { from: 1, to: 0 }, angle: rnd(-12, 12), duration: 1000, delay: i * 90, onComplete: () => p.destroy() });
  });
}

// Chachi: Mile 26 Kick. Speed lines streak behind her on each pass.
export function speedLines(scene, u) {
  for (let i = 0; i < 6; i++) {
    const y = u.y - 30 + i * 12;
    const l = scene.add.rectangle(u.x - 10, y, rnd(30, 60), 2, 0xffffff, 0.8).setOrigin(1, 0.5).setDepth(4);
    scene.tweens.add({ targets: l, x: u.x - 70, scaleX: 0.2, alpha: 0, duration: 260, delay: i * 15, onComplete: () => l.destroy() });
  }
}

// Chachi: Wait For It... A pulsing aura that stays until the charge is spent or she goes down.
export function chargeAura(scene, u) {
  const ring = scene.add.ellipse(u.x, u.y + 10, 70, 90).setStrokeStyle(3, C.purple, 0.9).setDepth(3);
  const fill = scene.add.ellipse(u.x, u.y + 10, 70, 90, C.purple, 0.12).setDepth(3);
  scene.tweens.add({ targets: [ring, fill], scale: { from: 0.9, to: 1.12 }, alpha: { from: 0.6, to: 1 }, duration: 420, yoyo: true, repeat: -1 });
  const orbit = scene.time.addEvent({
    delay: 120, loop: true,
    callback: () => {
      if (!u.alive || !u.statuses.charging) { ring.destroy(); fill.destroy(); orbit.remove(); return; }
      const a = Math.random() * Math.PI * 2;
      const s = scene.add.image(u.x + Math.cos(a) * 44, u.y + 10 + Math.sin(a) * 52, 'spark').setTint(C.purple).setDepth(4);
      scene.tweens.add({ targets: s, x: u.x, y: u.y, alpha: 0, duration: 400, onComplete: () => s.destroy() });
    },
  });
}

// Chachi: ...DARY! A big star burst on the target.
export function legendaryBurst(scene, target) {
  scene.cameras.main.flash(160, 255, 240, 200);
  const colors = [C.purple, C.gold, C.parch];
  for (let i = 0; i < 28; i++) {
    const a = (i / 28) * Math.PI * 2;
    const s = scene.add.image(target.x, target.y, 'spark').setTint(colors[i % 3]).setScale(2.2).setDepth(7);
    scene.tweens.add({
      targets: s, x: target.x + Math.cos(a) * rnd(70, 120), y: target.y + Math.sin(a) * rnd(60, 100),
      alpha: 0, scale: 0.5, duration: 650, ease: 'Quad.easeOut', onComplete: () => s.destroy(),
    });
  }
}

// Chachi: Suit Up! A quick gold shimmer and a tie on every sibling.
export function suitUp(scene, heroes) {
  heroes.forEach((h, i) => {
    const tie = scene.add.container(h.x, h.y + 4, [
      scene.add.triangle(0, 0, -5, 0, 5, 0, 0, 6, C.red),
      scene.add.rectangle(0, 12, 6, 14, C.red),
    ]).setDepth(6).setScale(0).setAlpha(1);
    scene.tweens.add({ targets: tie, scale: 1.4, duration: 220, delay: i * 70, ease: 'Back.easeOut' });
    scene.tweens.add({ targets: tie, alpha: 0, y: tie.y - 20, delay: 900 + i * 70, duration: 300, onComplete: () => tie.destroy() });
  });
}
