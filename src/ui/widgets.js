import { C, T, hex, FONT_BODY } from './theme.js';

// Bevelled stone panel.
export function panel(scene, x, y, w, h, opts = {}) {
  const g = scene.add.graphics();
  const fill = opts.fill ?? C.stone;
  g.fillStyle(0x000000, 0.35).fillRect(x + 3, y + 3, w, h);
  g.fillStyle(fill, opts.alpha ?? 1).fillRect(x, y, w, h);
  g.lineStyle(2, opts.edge ?? C.edge, 1).strokeRect(x + 1, y + 1, w - 2, h - 2);
  g.lineStyle(1, 0x000000, 0.5).strokeRect(x + 4, y + 4, w - 8, h - 8);
  return g;
}

// Clickable button. Returns a container with setEnabled / setLabel.
export function button(scene, x, y, w, h, label, onClick, opts = {}) {
  const c = scene.add.container(x, y);
  const bg = scene.add.graphics();
  const txt = scene.add.text(w / 2, h / 2 - (opts.sub ? 8 : 0), label, {
    ...T.body,
    fontSize: opts.fontSize ?? '22px',
    align: 'center',
  }).setOrigin(0.5);
  const sub = opts.sub
    ? scene.add.text(w / 2, h / 2 + 11, opts.sub, { ...T.small, fontSize: '16px', align: 'center' }).setOrigin(0.5)
    : null;
  c.add(sub ? [bg, txt, sub] : [bg, txt]);
  let enabled = opts.disabled ? false : true;
  let hover = false;
  const accent = opts.color ?? C.gold;
  const draw = () => {
    bg.clear();
    const base = enabled ? (hover ? C.stone3 : C.stone2) : C.stone;
    bg.fillStyle(0x000000, 0.4).fillRect(2, 3, w, h);
    bg.fillStyle(base, 1).fillRect(0, 0, w, h);
    bg.lineStyle(2, enabled ? (hover ? accent : C.edge) : C.stone2, 1).strokeRect(1, 1, w - 2, h - 2);
    if (enabled && opts.stripe !== false) bg.fillStyle(accent, hover ? 1 : 0.7).fillRect(0, 0, 4, h);
    txt.setColor(enabled ? hex(C.parch) : hex(C.edge));
    if (sub) sub.setColor(enabled ? hex(C.dim) : hex(C.edge));
  };
  draw();
  const zone = scene.add.zone(0, 0, w, h).setOrigin(0).setInteractive({ useHandCursor: true });
  c.add(zone);
  zone.on('pointerover', () => { hover = true; draw(); if (opts.onHover) opts.onHover(true); });
  zone.on('pointerout', () => { hover = false; draw(); if (opts.onHover) opts.onHover(false); });
  zone.on('pointerup', () => { if (enabled) onClick(); });
  c.setEnabled = (v) => { enabled = v; draw(); return c; };
  c.setLabel = (s) => { txt.setText(s); return c; };
  c.w = w; c.h = h;
  return c;
}

// Horizontal bar with numeric label.
export function bar(scene, x, y, w, h, color, opts = {}) {
  const g = scene.add.graphics();
  const label = opts.label === false ? null
    : scene.add.text(x + w / 2, y + h / 2, '', { fontFamily: FONT_BODY, fontSize: `${Math.max(14, h + 4)}px`, color: '#ffffff' })
        .setOrigin(0.5).setStroke('#000000', 3);
  const api = {
    g, label,
    set(v, max) {
      const pct = Math.max(0, Math.min(1, max ? v / max : 0));
      g.clear();
      g.fillStyle(0x000000, 0.6).fillRect(x, y, w, h);
      g.fillStyle(color, 1).fillRect(x + 1, y + 1, Math.round((w - 2) * pct), h - 2);
      g.fillStyle(0xffffff, 0.18).fillRect(x + 1, y + 1, Math.round((w - 2) * pct), Math.max(1, Math.floor(h / 3)));
      if (label) label.setText(opts.fmt ? opts.fmt(v, max) : `${Math.max(0, Math.round(v))}/${max}`);
      return api;
    },
    destroy() { g.destroy(); if (label) label.destroy(); },
    setVisible(v) { g.setVisible(v); if (label) label.setVisible(v); },
  };
  return api;
}

// Text that floats up and fades (damage numbers, etc).
export function floatText(scene, x, y, msg, color = C.parch, size = 28) {
  const t = scene.add.text(x, y, msg, { fontFamily: FONT_BODY, fontSize: `${size}px`, color: hex(color) })
    .setOrigin(0.5).setStroke('#000000', 4).setDepth(50);
  scene.tweens.add({ targets: t, y: y - 42, alpha: 0, duration: 1100, ease: 'Cubic.easeOut', onComplete: () => t.destroy() });
  return t;
}

// Small hover tooltip anchored to the pointer area.
export function tooltip(scene) {
  const c = scene.add.container(0, 0).setDepth(100).setVisible(false);
  const bg = scene.add.graphics();
  const txt = scene.add.text(10, 8, '', { ...T.body, fontSize: '19px', wordWrap: { width: 300 }, lineSpacing: -2 });
  c.add([bg, txt]);
  return {
    show(x, y, s) {
      txt.setText(s);
      const w = Math.min(320, txt.width + 20), h = txt.height + 16;
      bg.clear().fillStyle(C.ink, 0.96).fillRect(0, 0, w, h).lineStyle(2, C.gold, 1).strokeRect(1, 1, w - 2, h - 2);
      c.setPosition(Math.min(x, 960 - w - 6), Math.max(6, Math.min(y, 540 - h - 6)));
      c.setVisible(true);
    },
    hide() { c.setVisible(false); },
  };
}
