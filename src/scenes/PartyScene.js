import Phaser from 'phaser';
import { W, H, C, T, hex, RARITY } from '../ui/theme.js';
import { panel, button, bar, tapToInspect, isTouch } from '../ui/widgets.js';
import { heroKey, portraitKey, idleAnim } from '../art/sprites.js';
import { HERO_BY_ID, BRONX_BOMBERS } from '../data/heroes.js';
import { statLine, STAT_LABEL } from '../data/items.js';
import { G, heroStats, xpToNext, equip, unequip, removeFromBag, healHero, BAG_SIZE } from '../systems/state.js';
import { gearPrice } from './MapScene.js';

export default class PartyScene extends Phaser.Scene {
  constructor() { super('Party'); }

  init(data) {
    this.heroId = data.heroId || this.heroId || 'tom';
    this.selected = null;
    this.flash = '';
  }

  create() {
    // On touch, a skill description stays up until you tap empty space.
    this.input.on('pointerdown', (p, over) => { if (p.wasTouch && !over.length) this.hideTip(); });
    this.add.rectangle(0, 0, W, H, 0x000000, 0.7).setOrigin(0).setInteractive();
    panel(this, 16, 14, W - 32, H - 28, { fill: C.stone, edge: C.gold });
    this.layer = this.add.container(0, 0);
    this.input.keyboard?.on('keydown-ESC', () => this.close());
    this.render();
  }

  close() {
    this.events.emit('closed');
    this.scene.stop();
  }

  hero() { return G.run.party.find((h) => h.id === this.heroId); }

  showTip(x, y, text) {
    this.hideTip();
    const t = this.add.text(x + 10, y + 8, text, { ...T.body, fontSize: '19px', wordWrap: { width: 320 } }).setDepth(101);
    const g = this.add.graphics().setDepth(100);
    g.fillStyle(C.ink, 0.97).fillRect(x, y, t.width + 20, t.height + 16).lineStyle(2, C.gold, 1).strokeRect(x + 1, y + 1, t.width + 18, t.height + 14);
    this.tipObjs = [g, t];
  }

  hideTip() { (this.tipObjs || []).forEach((o) => o.destroy()); this.tipObjs = null; }

  render() {
    this.hideTip();
    this.layer.removeAll(true);
    const L = this.layer;
    const add = (o) => { L.add(o); return o; };

    add(this.add.text(36, 30, 'PARTY & LOOT', { ...T.h2, fontSize: '20px' }));
    add(button(this, W - 150, 26, 110, 36, 'Close', () => this.close(), { color: C.dim }));

    // ---- hero tabs
    G.run.party.forEach((h, i) => {
      const d = HERO_BY_ID[h.id];
      const y = 70 + i * 62;
      const on = h.id === this.heroId;
      const g = add(this.add.graphics());
      g.fillStyle(on ? C.stone3 : C.stone2, 1).fillRect(32, y, 150, 54);
      g.lineStyle(2, on ? C.gold : C.edge, 1).strokeRect(33, y + 1, 148, 52);
      add(this.add.image(60, y + 27, portraitKey(h.id)).setScale(1.1).setTint(h.hp > 0 ? 0xffffff : 0x555555));
      add(this.add.text(90, y + 8, d.name, { ...T.body, fontSize: '21px' }));
      add(this.add.text(90, y + 28, `LV ${h.level}${h.hp <= 0 ? ' · KO' : ''}`, { ...T.small, fontSize: '17px' }));
      const z = add(this.add.zone(32, y, 150, 54).setOrigin(0).setInteractive({ useHandCursor: true }));
      z.on('pointerup', () => { this.heroId = h.id; this.render(); });
    });
    add(this.add.text(32, 326, BRONX_BOMBERS.name.toUpperCase(), { ...T.label, color: hex(C.gold) }));
    add(this.add.text(32, 344, BRONX_BOMBERS.desc, { ...T.small, fontSize: '17px', wordWrap: { width: 150 } }));

    // ---- hero detail
    const h = this.hero();
    const d = HERO_BY_ID[h.id];
    const s = heroStats(h);
    const X = 200;
    add(this.add.sprite(X + 40, 110, heroKey(h.id)).setScale(1).play(idleAnim(heroKey(h.id))));
    add(this.add.text(X + 86, 66, d.name.toUpperCase(), { ...T.h2, fontSize: '20px' }));
    add(this.add.text(X + 86, 92, `${d.title} · Level ${h.level}`, { ...T.body, fontSize: '20px' }));
    const hb = bar(this, X + 86, 118, 250, 14, C.green); hb.set(h.hp, s.maxHp); add(hb.g); add(hb.label);
    const xb = bar(this, X + 86, 138, 250, 10, C.purple, { fmt: (v, m) => `XP ${v}/${m}` }); xb.set(h.xp, xpToNext(h.level)); add(xb.g); add(xb.label);
    xb.label.setFontSize(14);

    const col1 = [['ATK', s.atk], ['DEF', s.def], ['SPD', s.spd], ['CRIT', s.crit ? `+${s.crit}` : '0']];
    const col2 = [['Math', s.math], ['Lore', s.lore], ['Charm', s.charm], ['Grit', s.grit]];
    const fmt = (v) => (typeof v === 'number' && v > 0 ? `+${v}` : `${v}`);
    col1.forEach(([k, v], i) => {
      add(this.add.text(X + 4, 164 + i * 20, k, { ...T.small, fontSize: '19px' }));
      add(this.add.text(X + 64, 164 + i * 20, String(v), { ...T.body, fontSize: '19px' }));
    });
    col2.forEach(([k, v], i) => {
      add(this.add.text(X + 120, 164 + i * 20, k, { ...T.small, fontSize: '19px' }));
      add(this.add.text(X + 186, 164 + i * 20, fmt(v), { ...T.body, fontSize: '19px' }));
    });
    add(this.add.text(X + 236, 164, 'PASSIVE', { ...T.label }));
    add(this.add.text(X + 236, 180, d.passive.name, { ...T.body, fontSize: '19px', color: hex(C.gold), wordWrap: { width: 130 } }));
    add(this.add.text(X + 4, 250, d.passive.desc, { ...T.small, fontSize: '17px', wordWrap: { width: 360 }, lineSpacing: -3 }));

    // skills: name + cooldown; hover for the full description
    add(this.add.text(X + 4, 300, `SKILLS (${isTouch(this) ? 'tap' : 'hover'} for details)`, { ...T.label }));
    d.skills.forEach((sk, i) => {
      const locked = h.level < sk.level;
      const y = 318 + i * 23;
      const t = add(this.add.text(X + 4, y, sk.name, { ...T.body, fontSize: '20px', color: hex(locked ? C.edge : C.parch) }));
      add(this.add.text(X + 356, y + 2, locked ? `unlocks LV ${sk.level}` : sk.cd ? `cooldown ${sk.cd}` : 'basic', { ...T.small, fontSize: '17px', color: hex(locked ? C.edge : C.dim) }).setOrigin(1, 0));
      const z = add(this.add.zone(X, y, 360, 22).setOrigin(0).setInteractive());
      tapToInspect(z, () => this.showTip(X + 20, y + 26, sk.desc), () => this.hideTip());
    });

    // equipment
    add(this.add.text(X + 4, 414, 'EQUIPPED (click to unequip)', { ...T.label }));
    ['weapon', 'trinket'].forEach((slot, i) => {
      const it = h.equip[slot];
      const y = 432 + i * 42;
      const g = add(this.add.graphics());
      g.fillStyle(C.ink, 1).fillRect(X, y, 360, 38).lineStyle(1, C.edge, 1).strokeRect(X, y, 360, 38);
      add(this.add.text(X + 8, y + 3, slot.toUpperCase(), { ...T.label, fontSize: '10px' }));
      if (it) {
        add(this.add.text(X + 8, y + 15, it.name, { ...T.body, fontSize: '18px', color: hex(RARITY[it.rarity].color) }));
        add(this.add.text(X + 352, y + 15, statLine(it.stats, it.owner === h.id ? 2 : 1), { ...T.small, fontSize: '15px' }).setOrigin(1, 0));
        const z = add(this.add.zone(X, y, 360, 38).setOrigin(0).setInteractive({ useHandCursor: true }));
        z.on('pointerup', () => {
          this.flash = unequip(h, slot) ? `Unequipped ${it.name}.` : 'Bag is full.';
          this.render();
        });
      } else add(this.add.text(X + 8, y + 15, '(empty)', { ...T.small, fontSize: '18px' }));
    });

    // ---- bag
    const BX = 584, BW = 340;
    add(this.add.text(BX, 66, `BAG ${G.run.bag.length}/${BAG_SIZE}   ·   ${G.run.gold} GOLD`, { ...T.label, color: hex(C.gold) }));
    G.run.bag.forEach((it, i) => {
      const col = i % 2, row = Math.floor(i / 2);
      const x = BX + col * (BW / 2 + 2), y = 86 + row * 30;
      const on = this.selected === it;
      const g = add(this.add.graphics());
      g.fillStyle(on ? C.stone3 : C.ink, 1).fillRect(x, y, BW / 2 - 4, 26).lineStyle(1, on ? C.gold : C.stone3, 1).strokeRect(x, y, BW / 2 - 4, 26);
      const t = add(this.add.text(x + 6, y + 3, it.name, { ...T.body, fontSize: '17px', color: hex(RARITY[it.rarity]?.color ?? C.dim) }));
      t.setCrop(0, 0, BW / 2 - 16, 24);
      const z = add(this.add.zone(x, y, BW / 2 - 4, 26).setOrigin(0).setInteractive({ useHandCursor: true }));
      z.on('pointerup', () => { this.selected = it; this.flash = ''; this.render(); });
    });
    if (!G.run.bag.length) add(this.add.text(BX, 90, 'Empty. Go find loot.', T.small));

    // ---- selected item details
    const DY = 336;
    const g = add(this.add.graphics());
    g.fillStyle(C.ink, 1).fillRect(BX, DY, BW, 172).lineStyle(1, C.edge, 1).strokeRect(BX, DY, BW, 172);
    const it = this.selected && G.run.bag.includes(this.selected) ? this.selected : null;
    if (!it) {
      add(this.add.text(BX + 10, DY + 10, this.flash || 'Select an item to equip, use, or sell.', { ...T.small, fontSize: '19px', wordWrap: { width: BW - 20 } }));
      return;
    }
    add(this.add.text(BX + 10, DY + 8, it.name, { ...T.body, fontSize: '21px', color: hex(RARITY[it.rarity]?.color ?? C.dim), wordWrap: { width: BW - 20 } }));
    let info;
    if (it.kind === 'gear') {
      info = `${RARITY[it.rarity].name} ${it.slot}\n${statLine(it.stats)}`;
      if (it.owner) info += `\nSignature: doubled for ${HERO_BY_ID[it.owner].name}${it.owner === h.id ? ` (${statLine(it.stats, 2)})` : ''}`;
      if (it.desc) info += `\n"${it.desc}"`;
    } else info = it.desc;
    add(this.add.text(BX + 10, DY + 34, info, { ...T.small, fontSize: '17px', wordWrap: { width: BW - 20 }, lineSpacing: -2 }));

    const bw = 160;
    const by = DY + 124;
    if (it.kind === 'gear') {
      add(button(this, BX + 8, by, bw, 40, `Equip on ${d.name}`, () => { equip(h, it); this.selected = null; this.flash = `${d.name} equipped ${it.name}.`; this.render(); }, { fontSize: '19px' }));
    } else {
      const e = it.effect;
      const canUse = (e === 'heal' || e === 'cleanse') ? h.hp > 0 : e === 'revive' ? h.hp <= 0 : e === 'healAll';
      const label = e === 'healAll' ? 'Use on party' : `Use on ${d.name}`;
      add(button(this, BX + 8, by, bw, 40, e === 'bomb' ? 'Combat only' : label, () => {
        const max = heroStats(h).maxHp;
        if (e === 'heal' || e === 'cleanse') healHero(h, it.value);
        if (e === 'revive') h.hp = Math.round(max * it.value);
        if (e === 'healAll') G.run.party.forEach((p) => p.hp > 0 && healHero(p, it.value));
        removeFromBag(it);
        this.selected = null;
        this.flash = `Used ${it.name}.`;
        this.render();
      }, { disabled: !canUse || e === 'bomb', color: C.green, fontSize: '19px' }));
    }
    const price = Math.round((it.kind === 'gear' ? gearPrice(it) : it.price) * 0.4);
    add(button(this, BX + BW - bw - 8, by, bw, 40, `Sell for ${price}g`, () => {
      removeFromBag(it); G.run.gold += price; this.selected = null; this.flash = `Sold ${it.name} for ${price} gold.`; this.render();
    }, { color: C.gold, fontSize: '19px' }));
  }
}
