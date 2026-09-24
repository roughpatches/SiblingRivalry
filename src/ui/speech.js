import { W, C, T, hex } from './theme.js';

// A pixel speech bubble. (x, y) is the tip of its tail, just off the speaker's
// mouth; the bubble opens up and to the right, toward the open middle of the
// battlefield. With `beside`, or where it would reach above `minY` (the
// turn-order bar), it sits beside the speaker instead. It pops in, stays for
// `ms`, then fades. Returns {dismiss}.
export function speechBubble(scene, x, y, text, ms, { minY = 4, beside: side = false } = {}) {
  const pad = 7, tail = 10;
  const c = scene.add.container(x, y).setDepth(50);
  const label = scene.add.text(0, 0, text, {
    ...T.body, fontSize: '18px', color: hex(C.ink), wordWrap: { width: 200 }, lineSpacing: -4,
  });
  const w = Math.ceil(label.width) + pad * 2;
  const h = Math.ceil(label.height) + pad * 2 - 2;
  // Box position relative to the tail tip, kept on screen.
  const beside = side || y - tail - h < minY;
  let bx = beside ? 24 : -12;
  if (x + bx + w > W - 6) bx = W - 6 - w - x;
  const top = beside ? Math.max(minY - y, -16) : -tail - h;
  label.setPosition(bx + pad, top + pad - 1);

  const g = scene.add.graphics();
  g.fillStyle(0x000000, 0.35).fillRect(bx + 3, top + 3, w, h);
  g.fillStyle(C.parch, 1).fillRect(bx, top, w, h);
  g.lineStyle(2, C.ink, 1).strokeRect(bx, top, w, h);
  // Tail: a wedge from the box to the speaker (down from above, or left from beside).
  if (beside) {
    g.fillStyle(C.parch, 1).fillTriangle(0, 0, bx + 1, 2, bx + 1, 12);
    g.lineStyle(2, C.ink, 1).lineBetween(0, 0, bx, 2).lineBetween(0, 0, bx, 12);
  } else {
    g.fillStyle(C.parch, 1).fillTriangle(0, 0, 4, top + h - 1, 16, top + h - 1);
    g.lineStyle(2, C.ink, 1).lineBetween(0, 0, 4, top + h).lineBetween(0, 0, 16, top + h);
  }
  c.add([g, label]);

  c.setScale(0.4).setAlpha(0);
  scene.tweens.add({ targets: c, scale: 1, alpha: 1, duration: 140, ease: 'Back.easeOut' });
  let gone = false;
  const dismiss = (fast) => {
    if (gone) return;
    gone = true;
    timer.remove();
    scene.tweens.add({ targets: c, alpha: 0, y: y - 6, duration: fast ? 90 : 260, onComplete: () => c.destroy() });
  };
  const timer = scene.time.delayedCall(ms, () => dismiss(false));
  return { dismiss: () => dismiss(true) };
}
