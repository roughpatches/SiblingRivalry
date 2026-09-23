import { C } from './theme.js';

// A dim, floor-themed ground for the map panel, drawn under the rooms so the
// empty space reads as the floor you're exploring rather than a black box.
export function mapFloor(scene, theme, x, y, w, h) {
  const g = scene.add.graphics();
  const r = mulberry((theme || 'basement').length * 97 + w);
  if (theme === 'office') office(g, r, x, y, w, h);
  else if (theme === 'snow') snow(g, r, x, y, w, h);
  else if (theme === 'dining') dining(g, r, x, y, w, h);
  else basement(g, r, x, y, w, h);
  return g;
}

// Small seeded random so the pattern doesn't change every time the map redraws.
function mulberry(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function basement(g, r, x, y, w, h) {
  // concrete slabs, a few cracks and stains
  g.fillStyle(0x2a2830, 0.8).fillRect(x, y, w, h);
  g.lineStyle(1, 0x1a181f, 0.9);
  for (let cx = x; cx <= x + w; cx += 82) g.lineBetween(cx, y, cx, y + h);
  for (let cy = y; cy <= y + h; cy += 78) g.lineBetween(x, cy, x + w, cy);
  g.fillStyle(0x3a3642, 0.35);
  for (let i = 0; i < 7; i++) g.fillEllipse(x + r() * w, y + r() * h, 30 + r() * 40, 14 + r() * 16);
  g.lineStyle(1, 0x15131a, 0.8);
  for (let i = 0; i < 6; i++) {
    let px = x + r() * w, py = y + r() * h;
    for (let s = 0; s < 4; s++) { const nx = px + (r() - 0.3) * 22, ny = py + (r() - 0.5) * 16; g.lineBetween(px, py, nx, ny); px = nx; py = ny; }
  }
}

function office(g, r, x, y, w, h) {
  // carpet tiles in two alternating tones
  const s = 41;
  for (let cx = 0; cx * s < w; cx++) for (let cy = 0; cy * s < h; cy++) {
    g.fillStyle((cx + cy) % 2 ? 0x2a303c : 0x252a35, 0.85).fillRect(x + cx * s, y + cy * s, Math.min(s, w - cx * s), Math.min(s, h - cy * s));
  }
  g.fillStyle(0x363d4b, 0.5);
  for (let i = 0; i < 260; i++) g.fillRect(x + r() * w, y + r() * h, 1, 1);
  // a coffee stain, naturally
  g.fillStyle(0x3b2a1e, 0.35).fillCircle(x + w * 0.72, y + h * 0.3, 9);
}

function snow(g, r, x, y, w, h) {
  // night snow, a pair of ski tracks, a few pines
  g.fillStyle(0x1e2a42, 0.9).fillRect(x, y, w, h);
  g.fillStyle(0x2a3858, 0.5);
  for (let i = 0; i < 10; i++) g.fillEllipse(x + r() * w, y + r() * h, 60 + r() * 60, 20 + r() * 20);
  for (const off of [0, 7]) {
    g.lineStyle(1, 0x3e5078, 0.8).beginPath();
    for (let i = 0; i <= 40; i++) {
      const t = i / 40;
      const px = x + t * w, py = y + h * 0.2 + t * h * 0.6 + Math.sin(t * 9) * 18 + off;
      if (i === 0) g.moveTo(px, py); else g.lineTo(px, py);
    }
    g.strokePath();
  }
  for (let i = 0; i < 9; i++) {
    const px = x + 20 + r() * (w - 40), py = y + 20 + r() * (h - 30);
    g.fillStyle(0x1a3328, 0.8).fillTriangle(px - 6, py, px, py - 16, px + 6, py);
    g.fillStyle(0x6e84a8, 0.6).fillTriangle(px - 2, py - 10, px, py - 16, px + 2, py - 10);
  }
  g.fillStyle(0x8fa6c8, 0.35);
  for (let i = 0; i < 80; i++) g.fillRect(x + r() * w, y + r() * h, 2, 2);
}

function dining(g, r, x, y, w, h) {
  // long wood planks with staggered seams
  const ph = 20;
  for (let row = 0; row * ph < h; row++) {
    g.fillStyle(row % 2 ? 0x3a2618 : 0x33211a, 0.85).fillRect(x, y + row * ph, w, Math.min(ph, h - row * ph));
    g.fillStyle(0x24160e, 0.9).fillRect(x, y + row * ph, w, 1);
    const off = (row * 53) % 120;
    for (let sx = x + off; sx < x + w; sx += 120) g.fillRect(sx, y + row * ph, 1, ph);
  }
  // a rug in the middle
  g.fillStyle(0x5a1e1e, 0.35).fillRect(x + w * 0.25, y + h * 0.25, w * 0.5, h * 0.5);
  g.lineStyle(2, C.gold, 0.18).strokeRect(x + w * 0.25 + 6, y + h * 0.25 + 6, w * 0.5 - 12, h * 0.5 - 12);
}

// Soft drifting fog over cells nobody has seen yet. Each hidden cell gets a few
// stacked, slightly oversized translucent rounded rectangles, so neighboring
// hidden cells blend into one haze and the edge next to explored rooms stays soft.
export function fog(scene, cells, cellW, cellH) {
  const g = scene.add.graphics();
  for (const { x, y } of cells) {
    for (let i = 0; i < 5; i++) {
      const pad = 12 - i * 3;
      g.fillStyle(0x0b0a10, 0.13).fillRoundedRect(x - pad, y - pad, cellW + pad * 2, cellH + pad * 2, 18);
    }
  }
  scene.tweens.add({ targets: g, alpha: { from: 0.82, to: 1 }, duration: 2600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  return g;
}
