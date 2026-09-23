import { W, H, C } from './theme.js';
import { bake } from './bake.js';

// Stone-brick wall with flickering torch glow. tint shifts per floor.
export function backdrop(scene, tint = 0x2a2436, opts = {}) {
  // Bricks and vignette are hundreds of rectangles: baked into one image.
  const g = scene.make.graphics({ add: false });
  g.fillStyle(C.ink, 1).fillRect(0, 0, W, H);
  const bw = 48, bh = 24;
  for (let row = 0; row * bh < H; row++) {
    const off = row % 2 ? bw / 2 : 0;
    for (let x = -bw; x < W + bw; x += bw) {
      const shade = ((row * 7 + Math.floor((x + off) / bw) * 13) % 5) * 0.035;
      g.fillStyle(tint, 0.55 + shade);
      g.fillRect(x + off + 1, row * bh + 1, bw - 2, bh - 2);
    }
  }
  // vignette
  for (let i = 0; i < 10; i++) {
    g.fillStyle(0x000000, 0.06);
    g.fillRect(0, 0, W, 18 + i * 10);
    g.fillRect(0, H - 18 - i * 10, W, 18 + i * 10);
  }
  const wall = bake(scene, g, 0, 0, W, H, -10);
  if (opts.torches !== false) {
    const spots = opts.torches || [[40, 70], [W - 40, 70]];
    for (const [x, y] of spots) {
      const glow = scene.add.circle(x, y, 60, C.orange, 0.12).setDepth(-8);
      const glow2 = scene.add.circle(x, y, 26, C.gold, 0.22).setDepth(-8);
      scene.add.rectangle(x, y + 16, 6, 18, 0x5a3b22).setDepth(-7);
      const flame = scene.add.rectangle(x, y, 8, 12, C.gold).setDepth(-7);
      scene.tweens.add({ targets: [glow, glow2], alpha: { from: 0.7, to: 1 }, scale: { from: 0.94, to: 1.06 }, duration: 380, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      scene.tweens.add({ targets: flame, scaleY: { from: 0.8, to: 1.2 }, duration: 160, yoyo: true, repeat: -1 });
    }
  }
  return wall;
}
