import Phaser from 'phaser';
import { W, H, C, T, hex, RARITY } from '../ui/theme.js';
import { panel, button, bar, tooltip } from '../ui/widgets.js';
import { backdrop } from '../ui/backdrop.js';
import { buildBaseTextures, heroKey, portraitKey, iconKey, CHARLIE } from '../art/sprites.js';
import { HERO_BY_ID } from '../data/heroes.js';
import { FLOORS, floorDef } from '../data/enemies.js';
import { mapFloor, fog } from '../ui/mapfloor.js';
import { makeGear, makeConsumable, statLine, CONSUMABLES } from '../data/items.js';
import { G, heroStats, xpToNext, addToBag, healHero, pickLine, descend, alive } from '../systems/state.js';
import { COLS, ROWS, updateVisibility } from '../systems/dungeon.js';
import { rng } from '../systems/rng.js';
import { saveRun } from '../systems/save.js';

const MAP_X = 24, MAP_Y = 78, CELL_W = 82, CELL_H = 78, ROOM = 54;

const LABEL = {
  combat: 'Monsters', treasure: 'Treasure', rest: 'Rest Stop', event: 'Skill Check', trivia: 'Pub Trivia Sphinx',
  boss: 'Boss', shop: 'The Banana Stand', start: 'Entrance', stairs: 'Stairs down', unknown: 'Unknown room',
};

export function gearPrice(it) {
  const base = { common: 30, uncommon: 55, rare: 90, legendary: 150 }[it.rarity] ?? 30;
  return base + (G.run.floor - 1) * 10;
}

export default class MapScene extends Phaser.Scene {
  constructor() { super('Map'); }

  init(data) { this.incoming = data || {}; }

  create() {
    buildBaseTextures(this);
    const run = G.run;
    const fd = floorDef(run.floor);
    backdrop(this, fd.tint, { torches: [[610, 40]] });
    this.tip = tooltip(this);
    this.busy = false;
    this.modalLayer = null;
    this.partyLayer = null;

    const title = this.add.text(MAP_X, 18, fd.name.toUpperCase(), { ...T.h2, fontSize: '22px' }).setStroke('#000', 4);
    this.add.text(MAP_X, 46, fd.sub, { ...T.small, fontSize: '20px' });
    // Progress pips: one per floor, filled up to the current one.
    const lap = (run.floor - 1) % FLOORS.length;
    FLOORS.forEach((_, i) => {
      const px = MAP_X + title.width + 22 + i * 16, py = 31;
      const pip = this.add.circle(px, py, 5, i <= lap ? C.gold : C.stone3).setStrokeStyle(1, 0x000000, 0.8);
      if (i === lap) this.tweens.add({ targets: pip, scale: { from: 1, to: 1.35 }, duration: 700, yoyo: true, repeat: -1 });
    });

    panel(this, MAP_X - 8, MAP_Y - 10, COLS * CELL_W + 16, ROWS * CELL_H + 20, { fill: C.ink, alpha: 0.75 });
    mapFloor(this, fd.theme, MAP_X - 4, MAP_Y - 6, COLS * CELL_W + 8, ROWS * CELL_H + 12);
    this.mapLayer = this.add.container(0, 0);
    this.drawMap();

    this.drawParty();
    this.drawFooter();

    if (this.incoming.msg) this.say(this.incoming.msg);
    else if (this.incoming.intro) this.say(`${fd.name}. ${pickLine(rng.pick(['tom', 'stephen', 'andrew', 'chachi']), 'battle')}`);
    else this.say('Click a lit doorway to move. Rooms you have visited can be revisited freely.');

    if (this.incoming.intro) {
      this.cameras.main.fadeIn(350, 0, 0, 0);
      const banner = this.add.text(W / 2 - 150, H / 2, fd.name.toUpperCase(), { ...T.h1, fontSize: '34px' }).setOrigin(0.5).setStroke('#000', 8).setDepth(80).setAlpha(0);
      this.tweens.add({ targets: banner, alpha: 1, duration: 400, yoyo: true, hold: 900, onComplete: () => banner.destroy() });
    }
    if (this.incoming.levelUps?.length) this.showLevelUps(this.incoming.levelUps);
  }

  // ---------------------------------------------------------------- map
  cellCenter(r) {
    return { x: MAP_X + r.x * CELL_W + CELL_W / 2, y: MAP_Y + r.y * CELL_H + CELL_H / 2 };
  }

  scoutActive() {
    const ch = G.run.party.find((h) => h.id === 'chachi');
    return ch && ch.hp > 0;
  }

  displayType(r) {
    if (r.type === 'boss' && r.cleared) return 'stairs';
    if (r.visited || G.run.map.revealed || this.scoutActive() || r.type === 'boss') return r.type;
    return 'unknown';
  }

  drawMap() {
    this.mapLayer.removeAll(true);
    const map = G.run.map;
    const rooms = map.rooms;
    const cur = rooms[map.current];
    // Fog over every cell that has no room you've seen yet.
    const seenAt = new Set(rooms.filter((r) => r.seen).map((r) => `${r.x},${r.y}`));
    const hidden = [];
    for (let cx = 0; cx < COLS; cx++) for (let cy = 0; cy < ROWS; cy++) {
      if (!seenAt.has(`${cx},${cy}`)) hidden.push({ x: MAP_X + cx * CELL_W, y: MAP_Y + cy * CELL_H });
    }
    this.mapLayer.add(fog(this, hidden, CELL_W, CELL_H));
    const g = this.add.graphics();
    this.mapLayer.add(g);

    // corridors
    for (const r of rooms) {
      if (!r.seen) continue;
      const a = this.cellCenter(r);
      for (const nid of r.links) {
        const n = rooms[nid];
        if (nid < r.id || !n.seen) continue;
        if (!r.visited && !n.visited) continue;
        const b = this.cellCenter(n);
        g.fillStyle(0x000000, 0.6);
        g.fillRect(Math.min(a.x, b.x) - 8, Math.min(a.y, b.y) - 8, Math.abs(a.x - b.x) + 16, Math.abs(a.y - b.y) + 16);
        g.fillStyle(r.visited && n.visited ? C.stone3 : C.stone2, 1);
        g.fillRect(Math.min(a.x, b.x) - 6, Math.min(a.y, b.y) - 6, Math.abs(a.x - b.x) + 12, Math.abs(a.y - b.y) + 12);
      }
    }

    const reachable = this.reachableRooms();
    let popIndex = 0;

    for (const r of rooms) {
      if (!r.seen) continue;
      const { x, y } = this.cellCenter(r);
      const t = this.displayType(r);
      const isCur = r.id === map.current;
      const canGo = reachable.has(r.id) && !isCur;
      const room = this.add.container(x, y);
      const box = this.add.graphics();
      const h = ROOM / 2;
      const fill = r.visited ? (r.type === 'boss' && !r.cleared ? 0x4a1f28 : C.stone2) : C.stone;
      box.fillStyle(0x000000, 0.5).fillRect(-h + 3, -h + 4, ROOM, ROOM);
      box.fillStyle(fill, 1).fillRect(-h, -h, ROOM, ROOM);
      const edgeCol = isCur ? C.gold : canGo ? C.edge : C.stone3;
      box.lineStyle(isCur ? 3 : 2, edgeCol, 1).strokeRect(-h + 1, -h + 1, ROOM - 2, ROOM - 2);
      room.add(box);

      const done = r.cleared && t !== 'stairs' && t !== 'start';
      const icon = this.add.image(0, 0, iconKey(t === 'start' ? 'start' : t)).setAlpha(done ? 0.35 : 1);
      if (t === 'boss') icon.setTint(0xff8a80);
      if (!r.visited && !canGo) icon.setAlpha(0.45);
      room.add(icon);
      // Cleared rooms get a small green check in the corner (not where the party stands).
      if (done && !isCur) {
        const badge = this.add.graphics();
        badge.fillStyle(0x1a3a22, 1).fillCircle(h - 7, -h + 7, 8).lineStyle(1, 0x000000, 0.8).strokeCircle(h - 7, -h + 7, 8);
        badge.lineStyle(2, C.green, 1).lineBetween(h - 11, -h + 7, h - 8, -h + 10).lineBetween(h - 8, -h + 10, h - 3, -h + 3);
        room.add(badge);
      }
      this.mapLayer.add(room);
      // First time a room is seen, it pops in.
      if (!r.shown) {
        r.shown = true;
        room.setScale(0.4).setAlpha(0);
        this.tweens.add({ targets: room, scale: 1, alpha: 1, duration: 260, delay: 120 + popIndex++ * 70, ease: 'Back.easeOut' });
      }

      const zone = this.add.zone(x, y, ROOM, ROOM).setInteractive({ useHandCursor: canGo || (isCur && t === 'stairs') });
      this.mapLayer.add(zone);
      zone.on('pointerover', () => {
        let s = LABEL[t];
        if (r.cleared && t !== 'stairs' && t !== 'start') s += ' (cleared)';
        if (t === 'unknown') s += '\nChachi is down, so nobody is scouting ahead.';
        if (canGo) s += '\nClick to go here.';
        if (isCur && t === 'stairs') s += '\nClick to descend.';
        this.tip.show(x + 30, y - 10, s);
        if (canGo) box.lineStyle(3, C.gold, 1).strokeRect(-h + 1, -h + 1, ROOM - 2, ROOM - 2);
      });
      zone.on('pointerout', () => { this.tip.hide(); if (canGo) { box.lineStyle(2, C.edge, 1).strokeRect(-h + 1, -h + 1, ROOM - 2, ROOM - 2); } });
      zone.on('pointerup', () => {
        if (this.busy) return;
        if (canGo) this.travel(r);
        else if (isCur && t === 'stairs') this.stairsModal();
      });

      if (canGo && !r.visited) {
        const pulse = this.add.rectangle(x, y, ROOM + 6, ROOM + 6).setStrokeStyle(2, C.gold, 0.8);
        this.mapLayer.add(pulse);
        this.tweens.add({ targets: pulse, alpha: { from: 0.9, to: 0.1 }, duration: 900, yoyo: true, repeat: -1 });
      }
    }

    // party token
    const c = this.cellCenter(cur);
    this.token = this.add.container(c.x, c.y);
    const order = ['tom', 'stephen', 'andrew', 'chachi'];
    order.forEach((id, i) => {
      const h = G.run.party.find((p) => p.id === id);
      const img = this.add.image((i % 2 ? 11 : -11), (i < 2 ? -12 : 12), portraitKey(id)).setScale(0.55);
      if (h.hp <= 0) img.setTint(0x555555).setAlpha(0.6);
      this.token.add(img);
    });
    this.mapLayer.add(this.token);
    this.tweens.add({ targets: this.token, y: c.y - 3, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    // The map redraws after every room result, purchase and level-up: a good moment to save.
    saveRun();
  }

  // A few fading footprints along one step of the party's walk.
  footprints(x0, y0, x1, y1) {
    for (let i = 1; i <= 3; i++) {
      const t = i / 4, side = i % 2 ? -4 : 4;
      const vertical = Math.abs(y1 - y0) > Math.abs(x1 - x0);
      const fx = x0 + (x1 - x0) * t + (vertical ? side : 0), fy = y0 + (y1 - y0) * t + (vertical ? 0 : side);
      const step = this.add.ellipse(fx, fy, 5, 7, C.parch, 0.5).setDepth(5);
      this.tweens.add({ targets: step, alpha: 0, duration: 900, delay: i * 40, onComplete: () => step.destroy() });
    }
  }

  // Rooms you can click: neighbors of any visited room reachable through visited rooms.
  reachableRooms() {
    const map = G.run.map;
    const set = new Set();
    for (const r of map.rooms) {
      if (!r.visited) continue;
      set.add(r.id);
      for (const nid of r.links) set.add(nid);
    }
    // Uncleared boss room blocks nothing, but uncleared combat rooms you're standing in can't happen.
    return set;
  }

  pathTo(targetId) {
    const map = G.run.map;
    const prev = new Map([[map.current, null]]);
    const q = [map.current];
    while (q.length) {
      const id = q.shift();
      if (id === targetId) break;
      for (const nid of map.rooms[id].links) {
        if (prev.has(nid)) continue;
        const n = map.rooms[nid];
        if (!n.visited && nid !== targetId) continue;
        prev.set(nid, id);
        q.push(nid);
      }
    }
    if (!prev.has(targetId)) return null;
    const path = [];
    for (let id = targetId; id !== null; id = prev.get(id)) path.unshift(id);
    return path.slice(1);
  }

  travel(room) {
    const path = this.pathTo(room.id);
    if (!path) return;
    this.busy = true;
    this.tip.hide();
    const map = G.run.map;
    this.tweens.killTweensOf(this.token);
    const steps = path.map((id) => this.cellCenter(map.rooms[id]));
    this.tweens.chain({
      targets: this.token,
      tweens: steps.map((p) => ({
        x: p.x, y: p.y, duration: 170, ease: 'Sine.easeInOut',
        onStart: () => this.footprints(this.token.x, this.token.y, p.x, p.y),
      })),
      onComplete: () => {
        map.current = room.id;
        this.enter(room);
      },
    });
  }

  enter(room) {
    const map = G.run.map;
    room.visited = true;
    updateVisibility(map);
    if (room.cleared) {
      this.busy = false;
      this.drawMap();
      if (room.type === 'boss' && room.cleared) this.stairsModal();
      return;
    }
    switch (room.type) {
      case 'combat':
        return this.toBattle({ kind: 'combat', roomId: room.id });
      case 'boss':
        return this.bossIntro(room);
      case 'event':
        return this.toScene('Event', { roomId: room.id, mode: 'check' });
      case 'trivia':
        return this.toScene('Event', { roomId: room.id, mode: 'trivia' });
      case 'treasure':
        return this.openChest(room);
      case 'rest':
        return this.rest(room);
      case 'shop':
        return this.shop(room);
      default:
        room.cleared = true;
        this.busy = false;
        this.drawMap();
    }
  }

  toBattle(data) {
    this.cameras.main.flash(180, 255, 255, 255);
    this.time.delayedCall(180, () => this.toScene('Battle', data));
  }

  toScene(key, data) {
    this.cameras.main.fadeOut(220, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start(key, data));
  }

  bossIntro(room) {
    const fd = floorDef(G.run.floor);
    this.modal({
      title: 'BOSS',
      body: fd.bossIntro,
      buttons: [{ label: 'Fight', onClick: () => this.toBattle({ kind: 'boss', roomId: room.id }) }],
      danger: true,
    });
  }

  // ---------------------------------------------------------------- room types
  openChest(room) {
    if (rng() < 0.15) {
      this.modal({
        title: 'A CHEST!',
        body: 'The chest has teeth. The chest is a Box of Old Tax Returns. It remembers what you claimed in 2019.',
        buttons: [{ label: 'Fight it', onClick: () => this.toBattle({ kind: 'mimic', roomId: room.id }) }],
        danger: true,
      });
      return;
    }
    room.cleared = true;
    const gold = rng.int(10, 22) + G.run.floor * 8;
    G.run.gold += gold;
    const item = makeGear(G.run.floor, 0.1);
    const ok = addToBag(item);
    const extra = rng() < 0.4 ? makeConsumable() : null;
    if (extra) addToBag(extra);
    this.modal({
      title: 'TREASURE',
      body: `+${gold} gold`,
      item,
      extraItem: extra,
      footer: ok ? 'Added to the bag. Equip it from Party & Loot.' : 'The bag is full. You leave it behind (sell or use something first).',
      buttons: [{ label: 'Nice', onClick: () => this.closeModal() }, { label: 'Party & Loot', onClick: () => { this.closeModal(); this.openParty(); } }],
    });
  }

  rest(room) {
    room.cleared = true;
    const lines = [];
    for (const h of G.run.party) {
      const max = heroStats(h).maxHp;
      if (h.hp <= 0) h.hp = Math.round(max * 0.3);
      else healHero(h, max * 0.4);
    }
    const speakers = rng.shuffle(['tom', 'stephen', 'andrew', 'chachi']).slice(0, 2);
    for (const id of speakers) lines.push(`${HERO_BY_ID[id].name}: "${pickLine(id, 'rest')}"`);
    this.modal({
      title: 'REST STOP',
      body: 'A campfire someone else built. Everyone heals 40%. Anyone knocked out gets back up. Charlie is here. Nobody knows how.\n\n' + lines.join('\n'),
      pic: CHARLIE,
      buttons: [{ label: 'Onward', onClick: () => this.closeModal() }],
    });
  }

  shop(room) {
    if (!room.stock) {
      room.stock = [makeConsumable('potion'), makeConsumable(), makeConsumable(), makeGear(G.run.floor, 0.2), makeGear(G.run.floor, 0.35)];
    }
    room.cleared = true;
    this.shopModal(room);
  }

  shopModal(room) {
    const rows = room.stock.map((it) => ({ it, price: it.kind === 'gear' ? gearPrice(it) : it.price }));
    this.modal({
      title: 'THE BANANA STAND',
      body: `"There's always money in the banana stand." You have ${G.run.gold} gold.`,
      shop: rows,
      onBuy: (row) => {
        if (G.run.gold < row.price) return this.say('Not enough gold.');
        if (!addToBag(row.it)) return this.say('The bag is full.');
        G.run.gold -= row.price;
        room.stock.splice(room.stock.indexOf(row.it), 1);
        this.closeModal();
        this.drawParty();
        this.shopModal(room);
        this.say(`Bought ${row.it.name}.`);
      },
      buttons: [{ label: 'Leave', onClick: () => this.closeModal() }],
    });
  }

  stairsModal() {
    const next = G.run.floor + 1;
    const fd = floorDef(next);
    this.modal({
      title: 'STAIRS DOWN',
      body: `The stairs lead to ${fd.name}. Everyone catches their breath on the way (heal 25%).`,
      buttons: [
        { label: 'Descend', onClick: () => {
          G.run.party.forEach((h) => { if (h.hp > 0) healHero(h, heroStats(h).maxHp * 0.25); });
          descend();
          this.toScene('Map', { intro: true });
        } },
        { label: 'Not yet', onClick: () => this.closeModal() },
      ],
    });
  }

  // ---------------------------------------------------------------- modal
  modal(o) {
    this.closeModal(true);
    this.busy = true;
    this.modalButtons = o.buttons.map((b) => ({ ...b, onClick: () => { if (this.modalLayer?.used) return; if (this.modalLayer) this.modalLayer.used = true; b.onClick(); } }));
    const layer = this.add.container(0, 0).setDepth(60);
    this.modalLayer = layer;
    const shade = this.add.rectangle(0, 0, W, H, 0x000000, 0.55).setOrigin(0).setInteractive();
    layer.add(shade);
    const mw = 520;
    const x = (W - mw) / 2;
    const content = [];
    let y = 0;
    const title = this.add.text(mw / 2, 22, o.title, { ...T.h2, fontSize: '22px', color: hex(o.danger ? C.red : C.gold) }).setOrigin(0.5, 0);
    content.push(title); y = 60;
    if (o.pic) content.push(this.add.image(mw - 46, 40, o.pic).setScale(0.7));
    const body = this.add.text(28, y, o.body, { ...T.body, wordWrap: { width: mw - (o.pic ? 110 : 56) }, lineSpacing: 2 });
    content.push(body); y += body.height + 12;
    const itemBlock = (it) => {
      const col = hex(RARITY[it.rarity]?.color ?? C.dim);
      const n = this.add.text(28, y, it.name, { ...T.body, fontSize: '24px', color: col });
      content.push(n); y += 26;
      const sub = it.kind === 'gear'
        ? `${RARITY[it.rarity].name} ${it.slot} · ${statLine(it.stats)}${it.owner ? `\nSignature: doubled for ${HERO_BY_ID[it.owner].name}` : ''}`
        : it.desc;
      const s = this.add.text(28, y, sub, { ...T.small, wordWrap: { width: mw - (it.pic ? 120 : 56) } });
      content.push(s);
      if (it.pic) content.push(this.add.image(mw - 50, y + 4, it.pic).setScale(0.6));
      y += s.height + 10;
    };
    if (o.item) itemBlock(o.item);
    if (o.extraItem) itemBlock(o.extraItem);
    if (o.shop) {
      for (const row of o.shop) {
        const it = row.it;
        const col = hex(RARITY[it.rarity]?.color ?? C.dim);
        const n = this.add.text(28, y + 2, it.name, { ...T.body, fontSize: '21px', color: col });
        const s = this.add.text(28, y + 24, it.kind === 'gear' ? `${it.slot} · ${statLine(it.stats)}${it.owner ? ` · sig: ${HERO_BY_ID[it.owner].name}` : ''}` : it.desc, { ...T.small, fontSize: '17px', wordWrap: { width: mw - 170 } });
        const b = button(this, mw - 128, y + 4, 100, 36, `${row.price}g`, () => o.onBuy(row), { disabled: G.run.gold < row.price });
        content.push(n, s, b);
        y += Math.max(50, s.height + 30);
      }
      if (!o.shop.length) { const t = this.add.text(28, y, 'Sold out.', T.small); content.push(t); y += 30; }
    }
    if (o.footer) {
      const f = this.add.text(28, y, o.footer, { ...T.small, wordWrap: { width: mw - 56 } });
      content.push(f); y += f.height + 10;
    }
    y += 8;
    const bw = 150, gap = 16;
    const total = o.buttons.length * bw + (o.buttons.length - 1) * gap;
    o.buttons.forEach((bd, i) => {
      const once = () => { if (layer.used) return; layer.used = true; bd.onClick(); };
      const b = button(this, (mw - total) / 2 + i * (bw + gap), y, bw, 42, bd.label, once, { color: o.danger && i === 0 ? C.red : C.gold });
      content.push(b);
    });
    y += 60;
    const mh = y;
    const top = Math.max(12, (H - mh) / 2);
    const bg = panel(this, x, top, mw, mh, { fill: C.stone, edge: o.danger ? C.red : C.gold });
    layer.add(bg);
    const inner = this.add.container(x, top, content);
    layer.add(inner);
    inner.setAlpha(0); bg.setAlpha(0);
    this.tweens.add({ targets: [inner, bg], alpha: 1, duration: 160 });
  }

  closeModal(silent) {
    if (this.modalLayer) { this.modalLayer.destroy(); this.modalLayer = null; }
    if (!silent) { this.busy = false; this.drawMap(); this.drawParty(); }
  }

  // ---------------------------------------------------------------- side panel
  drawParty() {
    if (this.partyLayer) this.partyLayer.destroy();
    const L = this.add.container(0, 0);
    this.partyLayer = L;
    const px = 632, pw = 306;
    let y = 18;
    for (const h of G.run.party) {
      const d = HERO_BY_ID[h.id];
      const s = heroStats(h);
      const ch = 92;
      const card = panel(this, px, y, pw, ch, { fill: C.stone });
      L.add(card);
      const portrait = this.add.image(px + 34, y + ch / 2, portraitKey(h.id)).setScale(1.4);
      if (h.hp <= 0) portrait.setTint(0x444444);
      L.add(portrait);
      L.add(this.add.text(px + 70, y + 10, d.name.toUpperCase(), { ...T.h2, fontSize: '15px' }));
      L.add(this.add.text(px + pw - 14, y + 10, `LV ${h.level}`, { ...T.label, fontSize: '13px', color: hex(C.parch) }).setOrigin(1, 0));
      L.add(this.add.text(px + 70, y + 30, d.title, { ...T.small, fontSize: '17px' }));
      const hb = bar(this, px + 70, y + 54, pw - 86, 14, h.hp <= 0 ? C.stone3 : (h.hp / s.maxHp < 0.35 ? C.red : C.green));
      hb.set(h.hp, s.maxHp);
      if (h.hp <= 0) hb.label.setText('KNOCKED OUT');
      L.add([hb.g, hb.label]);
      const xb = bar(this, px + 70, y + 74, pw - 86, 5, C.purple, { label: false });
      xb.set(h.xp, xpToNext(h.level));
      L.add(xb.g);
      const z = this.add.zone(px, y, pw, ch).setOrigin(0).setInteractive({ useHandCursor: true });
      z.on('pointerup', () => { if (!this.busy) this.openParty(h.id); });
      z.on('pointerover', () => this.tip.show(px - 250, y, `${d.passive.name}: ${d.passive.desc}\nClick for gear and skills.`));
      z.on('pointerout', () => this.tip.hide());
      L.add(z);
      y += ch + 6;
    }
    L.add(this.add.image(px + 16, y + 22, iconKey('shop')).setScale(0.9));
    L.add(this.add.text(px + 34, y + 10, `${G.run.gold} gold`, { ...T.body, color: hex(C.gold) }));
    L.add(this.add.text(px + 34, y + 32, `${G.run.bag.length}/16 in bag`, { ...T.small }));
    const b = button(this, px + 150, y + 8, 156, 44, 'Party & Loot', () => { if (!this.busy) this.openParty(); });
    L.add(b);
  }

  drawFooter() {
    panel(this, MAP_X - 8, 484, COLS * CELL_W + 16, 44, { fill: C.ink, alpha: 0.85 });
    this.logText = this.add.text(MAP_X + 6, 506, '', { ...T.body, fontSize: '21px', wordWrap: { width: COLS * CELL_W - 10 } }).setOrigin(0, 0.5);
  }

  say(msg) { if (this.logText) this.logText.setText(msg); }

  openParty(heroId) {
    this.scene.pause();
    this.scene.launch('Party', { from: 'Map', heroId });
    this.scene.get('Party').events.once('closed', () => { this.scene.resume(); this.drawParty(); this.drawMap(); });
  }

  showLevelUps(ups) {
    const names = [...new Set(ups.map((u) => u.hero.id))];
    const text = names.map((id) => {
      const h = G.run.party.find((p) => p.id === id);
      const unlocked = HERO_BY_ID[id].skills.find((s) => s.level === h.level);
      return `${HERO_BY_ID[id].name} reached level ${h.level}.${unlocked ? ` New skill: ${unlocked.name}!` : ''}  "${pickLine(id, 'levelUp')}"`;
    }).join('\n');
    this.modal({ title: 'LEVEL UP', body: text, buttons: [{ label: 'Nice', onClick: () => this.closeModal() }] });
  }
}
