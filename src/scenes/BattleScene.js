import Phaser from 'phaser';
import { W, H, C, T, hex, RARITY } from '../ui/theme.js';
import { panel, button, bar, floatText, tooltip, holdToInspect, tapToInspect, isTouch } from '../ui/widgets.js';
import { backdrop } from '../ui/backdrop.js';
import { scenery, hasTorches } from '../ui/scenery.js';
import * as fx from '../ui/fx.js';
import { sfx, music, stopMusic } from '../systems/sound.js';
import { buildBaseTextures, heroKey, portraitKey, enemyTexture, frameKey, idleAnim } from '../art/sprites.js';
import { HERO_BY_ID } from '../data/heroes.js';
import { ENEMIES, FLOORS, TUNING, floorDef } from '../data/enemies.js';
import { makeGear, makeConsumable, statLine } from '../data/items.js';
import { G, heroStats, gainXp, addToBag, removeFromBag, pickLine, banterSeen } from '../systems/state.js';
import { pickBanter } from '../data/banter.js';
import { perkMods, perksForSkill } from '../data/perks.js';
import { rng, d20 } from '../systems/rng.js';

const HERO_POS = [[262, 116], [184, 196], [262, 276], [184, 352]];
const ENEMY_POS = { 1: [[745, 225]], 2: [[700, 170], [810, 280]], 3: [[690, 150], [820, 225], [690, 315]] };

const STATUS_TAG = {
  stun: ['STUN', C.gold], sleep: ['ZZZ', C.blue], taunt: ['TAUNT', C.red], atkUp: ['ATK+', C.orange], atkDown: ['ATK-', C.dim],
  defUp: ['DEF+', C.blue], defDown: ['DEF-', C.dim], spdUp: ['SPD+', C.green], poison: ['PSN', C.green], charging: ['...', C.purple],
};

export default class BattleScene extends Phaser.Scene {
  constructor() { super('Battle'); }

  init(data) {
    this.kind = data.kind || 'combat';
    this.roomId = data.roomId;
    this.over = false;
    this.units = [];
    this.logLines = [];
  }

  create() {
    buildBaseTextures(this);
    const fd = floorDef(G.run.floor);
    backdrop(this, fd.tint, { torches: hasTorches(fd.theme) ? [[40, 110], [W - 40, 110]] : false });
    scenery(this, fd.theme);
    music(this.kind === 'boss' ? 'boss' : 'battle');
    // shade the floor strip so fighters' shadows read against it
    const fl = this.add.graphics().setDepth(-5);
    fl.fillStyle(0x000000, 0.2).fillRect(0, 360, W, 40);
    this.tip = tooltip(this);
    this.cameras.main.fadeIn(250, 0, 0, 0);

    this.buildHeroes();
    this.buildEnemies();
    this.buildUi();

    // Sometimes two siblings trade lines as the fight starts; otherwise one speaks.
    const exchange = rng() < 0.3 ? this.banter('battle') : null;
    if (exchange) exchange.forEach((l) => this.log(l));
    else {
      const speaker = rng.pick(this.heroes().filter((u) => u.alive));
      this.log(`${speaker.name}: "${pickLine(speaker.id, 'battle')}"`);
    }
    this.round = 0;
    this.time.delayedCall(450, () => this.startRound());
  }

  // ------------------------------------------------------------------ setup
  heroes() { return this.units.filter((u) => u.side === 'hero'); }
  enemies() { return this.units.filter((u) => u.side === 'enemy'); }
  liveHeroes() { return this.heroes().filter((u) => u.alive); }
  liveEnemies() { return this.enemies().filter((u) => u.alive); }

  buildHeroes() {
    G.run.party.forEach((h, i) => {
      const d = HERO_BY_ID[h.id];
      const s = heroStats(h);
      const [x, y] = HERO_POS[i];
      const u = {
        side: 'hero', id: h.id, name: d.name, ref: h, def0: d,
        hp: h.hp, max: s.maxHp, atk: s.atk, def: s.def, spd: s.spd, crit: s.crit,
        statuses: {}, cds: {}, alive: h.hp > 0, x, y, level: h.level, windsUsed: 0, shield: 0,
        mods: perkMods(h),
      };
      if (u.id === 'andrew' && u.alive) u.shield = 8 + 2 * h.level + (u.mods.buckler || 0);
      this.makeUnitVisual(u, heroKey(h.id), 1, false);
      if (!u.alive) this.koPose(u, true);
      this.units.push(u);
    });
  }

  buildEnemies() {
    const fd = floorDef(G.run.floor);
    let ids;
    if (this.kind === 'boss') ids = fd.boss;
    else if (this.kind === 'mimic') ids = ['taxBox'];
    else {
      const firstFight = G.run.stats.fights === 0;
      const n = firstFight ? 2 : rng() < (G.run.floor === 1 ? 0.45 : 0.65) ? 3 : 2;
      ids = Array.from({ length: n }, () => rng.pick(fd.pool));
    }
    const loop = Math.floor((G.run.floor - 1) / FLOORS.length);
    const sc = 1 + 0.6 * loop;
    const positions = ENEMY_POS[ids.length];
    const counts = {};
    ids.forEach((id, i) => {
      const def = ENEMIES[id];
      const [x, y] = positions[i];
      counts[id] = (counts[id] || 0) + 1;
      const dup = ids.filter((k) => k === id).length > 1;
      const hpMult = this.kind === 'mimic' ? 1.4 * (1 + 0.4 * (G.run.floor - 1)) : 1;
      const u = {
        side: 'enemy', id, spec: def, name: dup ? `${def.name} ${'ABC'[counts[id] - 1]}` : def.name,
        hp: Math.round(def.hp * TUNING.enemyHp * sc * hpMult), max: Math.round(def.hp * TUNING.enemyHp * sc * hpMult),
        atk: Math.round(def.atk * TUNING.enemyAtk * (1 + 0.35 * loop) * (this.kind === 'mimic' ? 1 + 0.2 * (G.run.floor - 1) : 1)),
        def: def.def + loop * 2, spd: def.spd, crit: 0,
        xp: Math.round(def.xp * sc * (this.kind === 'mimic' ? 1.5 : 1)), gold: Math.round(def.gold * sc),
        statuses: {}, alive: true, x, y, boss: !!def.boss, shield: 0,
      };
      this.makeUnitVisual(u, enemyTexture(this, id, def), def.scale || 1, true);
      this.units.push(u);
    });
  }

  makeUnitVisual(u, key, scale, flip) {
    const shadow = this.add.image(u.x, u.y + 40 * scale, 'shadow').setScale(scale);
    const spr = this.add.sprite(u.x, u.y, key).setScale(scale).setFlipX(flip);
    u.spr = spr; u.shadow = shadow; u.baseY = u.y; u.texKey = key;
    // Idle loop (breathing and blinking), started at a random point so nobody moves in unison.
    spr.play({ key: idleAnim(key), startFrame: rng.int(0, 7) });
    // Things with wings or no legs also hover.
    if (['bat', 'ghost'].includes(u.spec?.shape)) {
      this.tweens.add({ targets: spr, y: u.y - 4, duration: 650 + rng.int(0, 300), yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
    if (u.side === 'hero') {
      // Heroes stack tightly, so their labels sit to the left of the sprite.
      const lx = u.x - 40;
      u.nameText = this.add.text(lx, u.y - 26, u.name, { ...T.body, fontSize: '20px' }).setOrigin(1, 0).setStroke('#000', 4);
      u.hpBar = bar(this, lx - 104, u.y - 2, 104, 12, C.green, { fmt: (v, m) => `${Math.max(0, Math.round(v))}/${m}` });
      u.tags = this.add.text(lx, u.y + 14, '', { ...T.label, fontSize: '11px', align: 'right' }).setOrigin(1, 0).setStroke('#000', 3);
    } else {
      const bw = u.boss ? 150 : 104;
      const by = u.y + 44 * scale + 6;
      u.nameText = this.add.text(u.x, by, u.name, { ...T.body, fontSize: '18px', align: 'center', wordWrap: { width: 170 } }).setOrigin(0.5, 0).setStroke('#000', 4);
      u.hpBar = bar(this, u.x - bw / 2, by + u.nameText.height + 1, bw, 10, C.red, { fmt: (v) => `${Math.max(0, Math.round(v))}` });
      u.tags = this.add.text(u.x, u.y - 44 * scale - 4, '', { ...T.label, fontSize: '11px', align: 'center' }).setOrigin(0.5, 1).setStroke('#000', 3);
    }
    u.hpBar.label.setFontSize(15);
    u.hpBar.set(u.hp, u.max);
    u.ring = this.add.ellipse(u.x, u.y + 40 * scale, 76 * scale, 20 * scale).setStrokeStyle(2, C.gold, 1).setVisible(false);
    const zone = this.add.zone(u.x, u.y, 70 * scale, 80 * scale).setInteractive({ useHandCursor: true });
    u.zone = zone;
    const showStats = () => {
      const st = Object.keys(u.statuses).map((k) => STATUS_TAG[k]?.[0]).filter(Boolean).join(' ');
      const lines = [`${u.name}  ${Math.max(0, u.hp)}/${u.max} HP`, `ATK ${u.atk} · DEF ${u.def} · SPD ${u.spd}`];
      if (u.shield) lines.push(`Shield ${u.shield}`);
      if (st) lines.push(st);
      this.tip.show(u.x + 40, u.y - 70, lines.join('\n'));
    };
    // Stats: hover with a mouse, hold with a finger (a plain tap picks a target,
    // or shows the stats when there is nothing to pick).
    const wasHeld = holdToInspect(this, zone, showStats, () => this.tip.hide());
    zone.on('pointerup', (p) => {
      if (wasHeld()) return;
      if (this.targeting) this.onUnitClick(u);
      else if (p.wasTouch) showStats();
    });
    zone.on('pointerover', () => { if (this.targeting && this.targeting.valid.includes(u)) u.spr.setTint(0xfff0a0); });
    zone.on('pointerout', () => { if (u.alive) u.spr.clearTint(); if (this.targeting?.valid.includes(u)) u.spr.setTint(0xffe28a); });
    this.refreshTags(u);
  }

  buildUi() {
    panel(this, 10, 402, 560, 128, { fill: C.stone });
    panel(this, 578, 402, 372, 128, { fill: C.ink, alpha: 0.92 });
    this.logText = this.add.text(592, 412, '', { ...T.body, fontSize: '19px', wordWrap: { width: 348 }, lineSpacing: -3 });
    this.turnLabel = this.add.text(24, 410, '', { ...T.h2, fontSize: '14px' });
    this.actionLayer = this.add.container(0, 0);
    this.orderLayer = this.add.container(0, 0);
    this.roundText = this.add.text(W / 2, 12, '', { ...T.label, color: hex(C.dim) }).setOrigin(0.5, 0).setStroke('#000', 4);
    this.input.keyboard?.on('keydown', (e) => {
      const n = parseInt(e.key, 10);
      if (n >= 1 && n <= 5 && this.hotkeys?.[n - 1]) this.hotkeys[n - 1]();
      if (e.key === 'Escape' && this.targeting) this.cancelTarget();
    });
  }

  log(msg) {
    this.logLines.push(msg);
    if (this.logLines.length > 5) this.logLines.shift();
    this.logText.setText(this.logLines.join('\n'));
    while (this.logText.height > 110 && this.logLines.length > 1) {
      this.logLines.shift();
      this.logText.setText(this.logLines.join('\n'));
    }
  }

  wait(ms) { return new Promise((r) => this.time.delayedCall(ms, r)); }

  // ------------------------------------------------------------------ stats
  effAtk(u) {
    let a = u.atk;
    if (u.statuses.atkUp) a *= 1 + u.statuses.atkUp.val;
    if (u.statuses.atkDown) a *= 1 - u.statuses.atkDown.val;
    if (u.id === 'tom' && u.hp < u.max / 2) a *= 1.4;
    return a;
  }
  effDef(u) {
    let d = u.def;
    if (u.statuses.defUp) d *= 1 + u.statuses.defUp.val;
    if (u.statuses.defDown) d *= 1 - u.statuses.defDown.val;
    if (u.id === 'tom' && u.hp < u.max / 2) d -= 2;
    return Math.max(0, d);
  }
  effSpd(u) { return u.spd + (u.statuses.spdUp?.val || 0); }
  // A skill's cooldown after perks (never below 1).
  skillCd(u, sk) { return Math.max(1, sk.cd - (u.mods?.[`cd_${sk.id}`] || 0)); }

  critOn(u) {
    let t = 20 - (u.crit || 0);
    if ((u.id === 'tom' || u.id === 'chachi') && this.units.filter((x) => (x.id === 'tom' || x.id === 'chachi') && x.alive).length === 2) t -= 1;
    return Math.max(15, t);
  }

  addStatus(u, key, turns, val = 0) {
    const cur = u.statuses[key];
    u.statuses[key] = { turns: Math.max(turns, cur?.turns || 0), val: Math.max(val, cur?.val || 0) };
    this.refreshTags(u);
  }

  refreshTags(u) {
    if (u.alive && u.spr) {
      if (u.statuses.sleep) this.resumeIdle(u);
      else if (u.spr.texture.key === frameKey(u.texKey, 'blink') && !u.spr.anims.isPlaying) this.resumeIdle(u);
    }
    const parts = Object.keys(u.statuses).map((k) => STATUS_TAG[k]?.[0]).filter(Boolean);
    if (u.shield > 0) parts.unshift(`SHLD ${u.shield}`);
    if (u.id === 'tom' && u.alive && u.hp < u.max / 2) parts.push('SPIRALING');
    u.tags.setText(parts.join(' '));
    u.tags.setColor(hex(parts.length ? C.gold : C.dim));
  }

  // ------------------------------------------------------------------ turn loop
  startRound() {
    if (this.over) return;
    this.round += 1;
    this.roundText.setText(`ROUND ${this.round}`);
    this.order = this.units.filter((u) => u.alive)
      .map((u) => ({ u, k: this.effSpd(u) + rng() * 3 }))
      .sort((a, b) => b.k - a.k).map((o) => o.u);
    // A lone boss gets extra actions, slotted into the middle of the round.
    const bosses = this.liveEnemies().filter((e) => e.boss);
    if (bosses.length === 1) {
      for (let i = 1; i < TUNING.soloBossActions; i++) this.order.splice(Math.ceil(this.order.length / 2), 0, bosses[0]);
    }
    this.units.forEach((u) => { u.actedThisRound = false; });
    this.turnIdx = 0;
    this.nextTurn();
  }

  drawOrder(active) {
    this.orderLayer.removeAll(true);
    const upcoming = this.order.slice(this.turnIdx).filter((u) => u.alive);
    let x = W / 2 - (upcoming.length * 64) / 2;
    upcoming.forEach((u, i) => {
      const box = this.add.rectangle(x + 30, 46, 58, 30, u.side === 'hero' ? C.stone2 : 0x3a1a22).setStrokeStyle(2, u === active ? C.gold : C.stone3);
      const label = this.add.text(x + 30, 46, u.side === 'hero' ? u.name : u.spec.short, { ...T.body, fontSize: '16px' }).setOrigin(0.5);
      if (label.width > 54) label.setScale(54 / label.width);
      this.orderLayer.add([box, label]);
      x += 64;
    });
  }

  async nextTurn() {
    if (this.over) return;
    if (this.checkEnd()) return;
    while (this.turnIdx < this.order.length && !this.order[this.turnIdx].alive) this.turnIdx++;
    if (this.turnIdx >= this.order.length) return this.startRound();
    const u = this.order[this.turnIdx];
    this.active = u;
    this.drawOrder(u);
    this.units.forEach((x) => x.ring.setVisible(false));
    u.ring.setVisible(true);

    // start-of-turn effects (only on a unit's first action of the round, so a
    // boss's bonus action doesn't tick poison or shorten statuses twice)
    const bonusAction = u.actedThisRound;
    u.actedThisRound = true;
    if (!bonusAction && u.statuses.poison) {
      const p = u.statuses.poison;
      this.applyRawDamage(u, p.val, C.green);
      this.log(`${u.name} takes ${p.val} from lingering effects.`);
      await this.wait(450);
      if (this.checkEnd()) return;
      if (!u.alive) return this.endTurn(u);
    }
    if (!bonusAction) {
      for (const k of ['atkUp', 'atkDown', 'defUp', 'defDown', 'spdUp', 'taunt', 'poison']) {
        if (u.statuses[k]) { u.statuses[k].turns -= 1; if (u.statuses[k].turns <= 0) delete u.statuses[k]; }
      }
      if (u.cds) for (const k in u.cds) if (u.cds[k] > 0) u.cds[k] -= 1;
    }
    this.refreshTags(u);

    if (u.statuses.stun) {
      delete u.statuses.stun;
      this.refreshTags(u);
      this.log(`${u.name} is stunned and loses the turn.`);
      floatText(this, u.x, u.y - 50, 'STUNNED', C.gold, 22);
      await this.wait(650);
      return this.endTurn(u);
    }
    if (u.statuses.sleep) {
      u.statuses.sleep.turns -= 1;
      if (u.statuses.sleep.turns <= 0) delete u.statuses.sleep;
      this.refreshTags(u);
      this.log(`${u.name} is asleep. Zzz.`);
      floatText(this, u.x, u.y - 50, 'Zzz', C.blue, 26);
      await this.wait(650);
      return this.endTurn(u);
    }

    if (u.side === 'hero') {
      if (u.statuses.charging) return this.releaseLegendary(u);
      this.showActions(u);
    } else {
      this.clearActions(`${u.name.toUpperCase()}'S TURN`);
      await this.wait(420);
      await this.enemyAct(u);
      this.endTurn(u);
    }
  }

  endTurn(u) {
    if (this.over) return;
    this.turnIdx += 1;
    this.time.delayedCall(260, () => this.nextTurn());
  }

  checkEnd() {
    if (this.over) return true;
    if (!this.liveEnemies().length) { this.victory(); return true; }
    if (!this.liveHeroes().length) { this.defeat(); return true; }
    return false;
  }

  // ------------------------------------------------------------------ hero input
  clearActions(label = '') {
    this.actionLayer.removeAll(true);
    this.turnLabel.setText(label);
    this.hotkeys = [];
    this.targeting = null;
  }

  showActions(u) {
    this.clearActions(`${u.name.toUpperCase()}'S TURN`);
    const skills = u.def0.skills;
    const bw = 176, bh = 46;
    const slots = [[22, 432], [204, 432], [386, 432], [22, 482], [204, 482]];
    skills.forEach((sk, i) => {
      const locked = u.level < sk.level;
      const cd = u.cds[sk.id] || 0;
      const sub = locked ? `unlocks at LV ${sk.level}` : cd > 0 ? `ready in ${cd}` : sk.cd ? `cooldown ${this.skillCd(u, sk)}` : 'no cooldown';
      const upgrades = perksForSkill(u.ref, sk.id).map((p) => `Upgraded: ${p.name}. ${p.desc}`);
      const [x, y] = slots[i];
      const b = button(this, x, y, bw, bh, sk.name, () => this.chooseSkill(u, sk), {
        disabled: locked || cd > 0, sub, fontSize: '19px',
        onHover: (on) => on ? this.tip.show(x, y - 70 - upgrades.length * 22, [`${sk.name}`, sk.desc, ...upgrades].join('\n')) : this.tip.hide(),
      });
      this.actionLayer.add(b);
      if (!locked && cd === 0) this.hotkeys[i] = () => this.chooseSkill(u, sk);
    });
    const items = G.run.bag.filter((it) => it.kind === 'consumable');
    const ib = button(this, slots[4][0], slots[4][1], bw, bh, `Items (${items.length})`, () => this.showItems(u), { disabled: !items.length, color: C.green, fontSize: '19px' });
    this.actionLayer.add(ib);
    if (items.length) this.hotkeys[4] = () => this.showItems(u);
    // passive reminder
    const pas = this.add.text(386, 488, `${u.def0.passive.name}`, { ...T.small, fontSize: '17px', wordWrap: { width: 170 } });
    tapToInspect(pas.setInteractive(), () => this.tip.show(386, 400, u.def0.passive.desc), () => this.tip.hide());
    this.actionLayer.add(pas);
  }

  showItems(u) {
    this.clearActions(`${u.name.toUpperCase()}: USE AN ITEM`);
    const items = G.run.bag.filter((it) => it.kind === 'consumable');
    // group by key
    const groups = {};
    items.forEach((it) => { (groups[it.key] ||= []).push(it); });
    const keys = Object.keys(groups).slice(0, 5);
    const slots = [[22, 432], [204, 432], [386, 432], [22, 482], [204, 482]];
    keys.forEach((k, i) => {
      const it = groups[k][0];
      const [x, y] = slots[i];
      const b = button(this, x, y, 176, 46, it.name.length > 18 ? it.name.slice(0, 17) + '…' : it.name, () => this.chooseItem(u, it), {
        sub: `x${groups[k].length}`, fontSize: '18px', color: C.green,
        onHover: (on) => on ? this.tip.show(x, y - 60, `${it.name}\n${it.desc}`) : this.tip.hide(),
      });
      this.actionLayer.add(b);
      this.hotkeys[i] = () => this.chooseItem(u, it);
    });
    const back = button(this, 386, 482, 176, 46, 'Back', () => this.showActions(u), { color: C.dim });
    this.actionLayer.add(back);
  }

  chooseItem(u, it) {
    const e = it.effect;
    if (e === 'healAll' || e === 'bomb') return this.useItem(u, it, null);
    const valid = e === 'revive' ? this.heroes().filter((x) => !x.alive) : this.liveHeroes();
    if (!valid.length) { this.log('Nobody needs that right now.'); return; }
    this.beginTarget(u, valid, (t) => this.useItem(u, it, t), () => this.showItems(u), `${it.name}: pick a sibling`);
  }

  chooseSkill(u, sk) {
    this.tip.hide();
    if (sk.target === 'enemy') {
      this.beginTarget(u, this.liveEnemies(), (t) => this.doSkill(u, sk, t), () => this.showActions(u), `${sk.name}: pick a target`, sk.desc);
    } else if (sk.target === 'ally') {
      this.beginTarget(u, this.liveHeroes(), (t) => this.doSkill(u, sk, t), () => this.showActions(u), `${sk.name}: pick a sibling`, sk.desc);
    } else {
      this.doSkill(u, sk, null);
    }
  }

  beginTarget(u, valid, onPick, onBack, label, desc) {
    this.clearActions(label.toUpperCase());
    this.targeting = { valid, onPick, onBack };
    valid.forEach((v) => { v.spr.setTint(0xffe28a); });
    // Repeat what the skill does while choosing, since phones never saw the hover text.
    const how = `${isTouch(this) ? 'Tap' : 'Click'} a highlighted target.`;
    const hint = this.add.text(22, 432, desc ? `${desc}\n${how}` : how, { ...T.body, fontSize: '18px', wordWrap: { width: 530 }, lineSpacing: -3 });
    const back = button(this, 386, 482, 176, 40, 'Back', () => this.cancelTarget(), { color: C.dim });
    this.actionLayer.add([hint, back]);
    this.hotkeys = [];
    if (valid.length === 1) { /* still require a click so it isn't surprising */ }
  }

  cancelTarget() {
    if (!this.targeting) return;
    const { valid, onBack } = this.targeting;
    valid.forEach((v) => v.alive && v.spr.clearTint());
    this.targeting = null;
    onBack();
  }

  onUnitClick(u) {
    if (!this.targeting || !this.targeting.valid.includes(u)) return;
    const { valid, onPick } = this.targeting;
    valid.forEach((v) => v.alive && v.spr.clearTint());
    this.targeting = null;
    this.tip.hide();
    onPick(u);
  }

  // ------------------------------------------------------------------ hero actions
  async doSkill(u, sk, target) {
    this.clearActions(`${u.name.toUpperCase()}: ${sk.name.toUpperCase()}`);
    if (sk.cd) u.cds[sk.id] = this.skillCd(u, sk);
    const m = u.mods || {};
    const E = () => this.liveEnemies();
    const lvl = u.level;
    switch (sk.id) {
      case 'pivot': case 'footnote': case 'mallet': case 'pole':
        await this.lunge(u, target);
        this.attack(u, target, 1 + (m.basic || 0), { verb: sk.name });
        break;
      case 'numbers':
        this.log(`Tom runs commercial due diligence on ${target.name}.`);
        fx.numberStream(this, u, target);
        await this.wait(300);
        await this.lunge(u, target);
        this.attack(u, target, 1.7 + (m.numbersMult || 0), { ignoreDef: true, verb: sk.name });
        break;
      case 'matrix':
        this.log('Tom plots every enemy in "Low Value / High Effort." Their defenses crumble.');
        this.flashAll(E(), C.blue);
        fx.matrix(this, E());
        sfx('buff');
        E().forEach((e) => { this.addStatus(e, 'defDown', 3, 0.5); floatText(this, e.x, e.y - 40, 'DEF-', C.blue, 22); });
        break;
      case 'bulwark': {
        const amt = 10 + 2 * lvl + (m.bulwark || 0);
        this.log(`Tom snaps together a LEGO wall. Everyone gets a ${amt} shield.`);
        fx.legoWall(this, this.liveHeroes());
        sfx('buff');
        this.liveHeroes().forEach((h) => { h.shield += amt; this.refreshTags(h); floatText(this, h.x, h.y - 40, `+${amt} SHLD`, C.gold, 20); });
        break;
      }
      case 'receipt': {
        const amt = Math.round(target.max * (0.4 + (m.receipt || 0)));
        this.log(`Stephen unfurls a four-foot receipt over ${target.name}.`);
        fx.receipt(this, target);
        this.heal(target, amt);
        break;
      }
      case 'precedent': {
        this.log('Stephen begins: "So, the Peace of Westphalia..."');
        fx.book(this, u);
        await this.wait(250);
        for (const e of E()) {
          const chance = e.boss ? 0.3 + (m.sleep || 0) * 0.75 : 0.65 + (m.sleep || 0);
          if (rng() < chance) { this.addStatus(e, 'sleep', 2); floatText(this, e.x, e.y - 40, 'Zzz', C.blue, 26); }
          else floatText(this, e.x, e.y - 40, 'still awake', C.dim, 18);
        }
        break;
      }
      case 'pharmacy':
        this.log('Stephen makes a pharmacy run. Everyone is patched up.');
        fx.crosses(this, this.heroes());
        for (const h of this.heroes()) {
          if (!h.alive) this.revive(h, 0.2);
          else this.heal(h, Math.round(h.max * 0.25));
          for (const k of ['poison', 'atkDown', 'defDown', 'stun', 'sleep']) delete h.statuses[k];
          this.refreshTags(h);
        }
        break;
      case 'objection':
        this.log('Andrew: "OBJECTION!" Every enemy is now very focused on Andrew.');
        this.cameras.main.shake(120, 0.004);
        fx.gavel(this, u, true);
        sfx('gavel');
        this.addStatus(u, 'taunt', 2 + (m.taunt || 0));
        this.addStatus(u, 'defUp', 2 + (m.taunt || 0), 0.6);
        floatText(this, u.x, u.y - 50, 'OBJECTION!', C.red, 28);
        break;
      case 'order':
        this.log(`Andrew raises a point of order against ${target.name}.`);
        fx.gavel(this, target, false);
        sfx('gavel');
        await this.lunge(u, target);
        if (this.attack(u, target, 0.6, { verb: sk.name }) && target.alive) {
          if (!target.boss || rng() < 0.5 + (m.bossStun || 0)) { this.addStatus(target, 'stun', 1); floatText(this, target.x, target.y - 60, 'STUNNED', C.gold, 20); }
          else this.log(`${target.name} ignores the point of order.`);
        }
        break;
      case 'amendment':
        this.log('Andrew inserts favorable language. Party ATK +35%.');
        fx.amendment(this, this.liveHeroes());
        sfx('buff');
        this.liveHeroes().forEach((h) => { this.addStatus(h, 'atkUp', 3, 0.35 + (m.amend || 0)); floatText(this, h.x, h.y - 40, 'ATK+', C.orange, 20); });
        break;
      case 'kick': {
        this.log('Chachi hits her Mile 26 kick.');
        for (let i = 0; i < 3 + (m.kickHits || 0); i++) {
          const live = E();
          if (!live.length) break;
          const t = rng.pick(live);
          fx.speedLines(this, u);
          await this.lunge(u, t, 120);
          this.attack(u, t, 0.7, { verb: 'Mile 26 Kick', quiet: true });
          await this.wait(120);
        }
        break;
      }
      case 'legendary':
        this.log('Chachi: "This is going to be legen... wait for it..."');
        this.addStatus(u, 'charging', 99);
        fx.chargeAura(this, u);
        sfx('charge');
        u.chargeTarget = target;
        floatText(this, u.x, u.y - 50, 'wait for it...', C.purple, 22);
        break;
      case 'suitup':
        this.log('Chachi: "SUIT UP!" Everyone is faster and hits harder.');
        fx.suitUp(this, this.liveHeroes());
        sfx('buff');
        this.liveHeroes().forEach((h) => { this.addStatus(h, 'spdUp', 3, 4); this.addStatus(h, 'atkUp', 3, 0.2); floatText(this, h.x, h.y - 40, 'SUITED UP', C.green, 18); });
        break;
    }
    await this.wait(550);
    this.endTurn(u);
  }

  async releaseLegendary(u) {
    delete u.statuses.charging;
    this.refreshTags(u);
    let t = u.chargeTarget;
    if (!t || !t.alive) t = rng.pick(this.liveEnemies());
    this.clearActions("CHACHI: ...DARY!");
    this.log('Chachi: "...DARY! LEGENDARY!"');
    await this.lunge(u, t, 260);
    this.cameras.main.shake(220, 0.01);
    fx.legendaryBurst(this, t);
    sfx('boom');
    this.attack(u, t, 3.2 + (u.mods?.legendary || 0), { verb: 'Legendary' });
    await this.wait(650);
    this.endTurn(u);
  }

  async useItem(u, it, target) {
    this.clearActions(`${u.name.toUpperCase()} USES ${it.name.toUpperCase()}`);
    removeFromBag(it);
    switch (it.effect) {
      case 'heal': this.heal(target, it.value); break;
      case 'healAll': this.liveHeroes().forEach((h) => this.heal(h, it.value)); break;
      case 'revive': this.revive(target, it.value); break;
      case 'cleanse':
        this.heal(target, it.value);
        for (const k of ['poison', 'atkDown', 'defDown', 'stun', 'sleep']) delete target.statuses[k];
        this.refreshTags(target);
        break;
      case 'bomb':
        this.log(`${u.name} lobs a Water Balloon of Holding.`);
        this.liveEnemies().forEach((e) => this.applyRawDamage(e, it.value, C.blue));
        break;
    }
    this.log(`${u.name} used ${it.name}.`);
    await this.wait(600);
    this.endTurn(u);
  }

  // ------------------------------------------------------------------ enemy AI
  pickHeroTarget() {
    const live = this.liveHeroes();
    const taunters = live.filter((h) => h.statuses.taunt);
    if (taunters.length) return taunters[0];
    const weights = live.map((h) => (h.id === 'stephen' ? 0.4 : 1) * (h.hp < h.max * 0.35 ? 1.3 : 1));
    let r = rng() * weights.reduce((a, b) => a + b, 0);
    for (let i = 0; i < live.length; i++) { r -= weights[i]; if (r <= 0) return live[i]; }
    return live[live.length - 1];
  }

  async enemyAct(u) {
    const liveAllies = this.liveEnemies();
    let move;
    if (u.statuses.charging) {
      move = u.statuses.charging.move;
      delete u.statuses.charging;
      this.refreshTags(u);
    } else {
      const opts = u.spec.moves.filter((m) => {
        if (m.type === 'heal') return liveAllies.some((a) => a.hp < a.max * 0.6);
        if (m.type === 'buff') return !u.statuses.atkUp;
        return true;
      });
      let r = rng() * opts.reduce((a, m) => a + m.w, 0);
      move = opts[opts.length - 1];
      for (const m of opts) { r -= m.w; if (r <= 0) { move = m; break; } }
    }

    const floor = G.run.floor;
    switch (move.type) {
      case 'hit': case 'drain': case 'stun': case 'debuff': case 'poison': {
        const t = this.pickHeroTarget();
        this.log(`${u.name} uses ${move.name} on ${t.name}.`);
        await this.lunge(u, t);
        const dealt = this.attack(u, t, move.mult ?? 1, { verb: move.name, quiet: true });
        if (dealt && t.alive) {
          if (move.type === 'drain') this.heal(u, Math.round(dealt * 0.5), true);
          if (move.type === 'stun' && rng() < (move.chance ?? 0.4)) { this.addStatus(t, 'stun', 1); floatText(this, t.x, t.y - 60, 'STUNNED', C.gold, 20); }
          if (move.type === 'debuff') { this.addStatus(t, move.status, move.turns, move.status === 'defDown' ? 0.4 : 0.3); floatText(this, t.x, t.y - 60, STATUS_TAG[move.status][0], C.dim, 20); }
          if (move.type === 'poison') { this.addStatus(t, 'poison', move.turns, Math.round(move.dot * (1 + 0.3 * (floor - 1)))); floatText(this, t.x, t.y - 60, 'POISONED', C.green, 20); }
        }
        break;
      }
      case 'aoe': {
        this.log(`${u.name} uses ${move.name}!`);
        await this.lunge(u, null);
        if (move.mult >= 1.4) this.cameras.main.shake(260, 0.012);
        for (const t of this.liveHeroes()) this.attack(u, t, move.mult, { verb: move.name, quiet: true });
        break;
      }
      case 'heal': {
        const t = liveAllies.slice().sort((a, b) => a.hp / a.max - b.hp / b.max)[0];
        this.log(`${u.name} uses ${move.name}.`);
        this.heal(t, Math.round(t.max * move.amount));
        break;
      }
      case 'buff':
        this.log(`${u.name} uses ${move.name}. The enemies are emboldened.`);
        liveAllies.forEach((a) => { this.addStatus(a, move.status, move.turns, 0.3); floatText(this, a.x, a.y - 40, 'ATK+', C.orange, 20); });
        break;
      case 'charge':
        this.log(`${u.name}: ${move.name} Something big is coming.`);
        u.statuses.charging = { turns: 99, move: move.release };
        this.refreshTags(u);
        floatText(this, u.x, u.y - 60, move.name, C.purple, 22);
        break;
    }
    await this.wait(420);
  }

  // ------------------------------------------------------------------ combat math
  // Returns damage dealt (0 on miss).
  attack(src, tgt, mult, opts = {}) {
    const roll = d20();
    if (roll === 1) {
      sfx('miss');
      floatText(this, tgt.x, tgt.y - 30, 'MISS', C.dim, 24);
      if (src.side === 'hero') {
        G.run.stats.nat1 += 1;
        this.log(`Nat 1! ${src.name}: "${pickLine(src.id, 'fumble')}"`);
      } else this.log(`${src.name} whiffs completely.`);
      return 0;
    }
    const crit = roll >= this.critOn(src);
    if (crit && src.side === 'hero') G.run.stats.nat20 += 1;
    let raw = this.effAtk(src) * mult * (0.9 + rng() * 0.2);
    let dmg = opts.ignoreDef ? raw : raw * 12 / (12 + this.effDef(tgt));
    if (crit) dmg *= 1.8;
    dmg = Math.max(1, Math.round(dmg));
    const dealt = this.applyRawDamage(tgt, dmg, crit ? C.gold : C.parch, crit);
    if (!opts.quiet || crit) this.log(`${crit ? 'CRIT! ' : ''}${src.name}'s ${opts.verb} hits ${tgt.name} for ${dealt}.`);
    return dealt || 1;
  }

  applyRawDamage(tgt, dmg, color = C.parch, crit = false) {
    if (!tgt.alive) return 0;
    let absorbed = 0;
    if (tgt.shield > 0) { absorbed = Math.min(tgt.shield, dmg); tgt.shield -= absorbed; dmg -= absorbed; }
    if (tgt.statuses.sleep && dmg > 0) delete tgt.statuses.sleep;
    tgt.hp -= dmg;
    if (tgt.hp <= 0 && tgt.id === 'chachi' && tgt.side === 'hero' && tgt.windsUsed < 1 + (tgt.mods?.secondWind || 0)) {
      tgt.windsUsed += 1;
      tgt.hp = 1;
      this.time.delayedCall(300, () => { floatText(this, tgt.x, tgt.y - 70, 'SECOND WIND', C.green, 22); });
      this.log('Chachi hits the wall... and keeps running. (Second Wind)');
    }
    const shown = dmg + absorbed;
    floatText(this, tgt.x + rng.int(-10, 10), tgt.y - 30, absorbed && !dmg ? `(${absorbed})` : `${crit ? '!' : ''}${shown}`, color, crit ? 36 : 28);
    // hit reaction
    sfx(crit ? 'crit' : 'hit');
    tgt.spr.setTintFill(0xffffff);
    this.time.delayedCall(90, () => { if (tgt.alive) tgt.spr.clearTint(); });
    this.pose(tgt, 'recoil');
    this.time.delayedCall(220, () => this.resumeIdle(tgt));
    this.tweens.add({ targets: tgt.spr, x: tgt.x + (tgt.side === 'hero' ? -8 : 8), duration: 60, yoyo: true, repeat: 1 });
    tgt.hpBar.set(tgt.hp, tgt.max);
    if (tgt.side === 'hero') tgt.ref.hp = Math.max(0, tgt.hp);
    if (tgt.hp <= 0) this.ko(tgt);
    else if (tgt.side === 'hero' && tgt.hp < tgt.max * 0.3 && !tgt.saidLow) {
      tgt.saidLow = true;
      this.time.delayedCall(350, () => this.log(`${tgt.name}: "${pickLine(tgt.id, 'lowHp')}"`));
    }
    this.refreshTags(tgt);
    return shown;
  }

  heal(u, amt, quiet) {
    if (!u.alive) return;
    const before = u.hp;
    u.hp = Math.min(u.max, u.hp + amt);
    const got = u.hp - before;
    u.hpBar.set(u.hp, u.max);
    if (u.side === 'hero') u.ref.hp = u.hp;
    floatText(this, u.x, u.y - 30, `+${got}`, C.green, 26);
    if (!quiet) sfx('heal');
    this.sparkle(u, C.green);
    if (!quiet) this.log(`${u.name} recovers ${got} HP.`);
    this.refreshTags(u);
  }

  revive(u, pct) {
    if (u.alive) return;
    u.alive = true;
    u.hp = Math.max(1, Math.round(u.max * pct));
    u.ref.hp = u.hp;
    u.spr.setAngle(0).clearTint().setAlpha(1);
    u.spr.y = u.baseY;
    this.resumeIdle(u);
    u.hpBar.set(u.hp, u.max);
    u.nameText.setAlpha(1);
    floatText(this, u.x, u.y - 40, 'BACK UP', C.green, 24);
    this.sparkle(u, C.gold);
    this.log(`${u.name} is back on their feet.`);
    this.refreshTags(u);
  }

  ko(u) {
    u.alive = false;
    u.hp = 0;
    u.statuses = {};
    u.shield = 0;
    if (u.side === 'hero') {
      u.ref.hp = 0;
      this.log(`${u.name}: "${pickLine(u.id, 'ko')}"`);
      sfx('ko');
      this.koPose(u);
    } else {
      this.log(`${u.name} is defeated.`);
      sfx('enemyDown');
      this.tweens.killTweensOf(u.spr);
      u.spr.anims.stop();
      u.spr.setTexture(frameKey(u.texKey, 'recoil'));
      this.tweens.add({ targets: [u.spr, u.shadow, u.tags], alpha: 0, y: '+=20', duration: 500 });
      this.tweens.add({ targets: [u.nameText, u.hpBar.g, u.hpBar.label], alpha: 0.25, duration: 400 });
      this.sparkle(u, C.red);
    }
    u.ring.setVisible(false);
    this.refreshTags(u);
  }

  koPose(u, instant) {
    this.tweens.killTweensOf(u.spr);
    u.spr.anims.stop();
    u.spr.setTexture(frameKey(u.texKey, 'blink'));
    const apply = { angle: -90, y: u.baseY + 20 };
    if (instant) { u.spr.setAngle(-90).setY(u.baseY + 20); }
    else this.tweens.add({ targets: u.spr, ...apply, duration: 300 });
    u.spr.setTint(0x666677);
    u.nameText.setAlpha(0.5);
    u.hpBar.set(0, u.max);
  }

  sparkle(u, color) {
    for (let i = 0; i < 8; i++) {
      const s = this.add.image(u.x + rng.int(-24, 24), u.y + rng.int(-20, 30), 'spark').setTint(color).setScale(1.5);
      this.tweens.add({ targets: s, y: s.y - 30 - rng.int(0, 20), alpha: 0, duration: 600 + rng.int(0, 300), onComplete: () => s.destroy() });
    }
  }

  flashAll(list, color) { list.forEach((u) => this.sparkle(u, color)); }

  // A sibling exchange for this moment among whoever is still standing, or null.
  banter(when) {
    return pickBanter(when, { standing: this.liveHeroes().map((h) => h.id), theme: floorDef(G.run.floor).theme, seen: banterSeen() });
  }

  // Hold a single frame ('lean', 'recoil', 'blink') until resumeIdle.
  pose(u, frame) {
    if (!u.alive) return;
    u.spr.anims.stop();
    u.spr.setTexture(frameKey(u.texKey, frame));
  }

  // Back to the idle loop, or eyes shut while asleep. Knocked-out units stay put.
  resumeIdle(u) {
    if (!u.alive) return;
    if (u.statuses.sleep) { u.spr.anims.stop(); u.spr.setTexture(frameKey(u.texKey, 'blink')); return; }
    if (!u.spr.anims.isPlaying) u.spr.play({ key: idleAnim(u.texKey), startFrame: rng.int(0, 7) });
  }

  lunge(u, target, dur = 150) {
    return new Promise((res) => {
      const dir = u.side === 'hero' ? 1 : -1;
      const dx = target ? Math.min(60, Math.abs(target.x - u.x) * 0.25) : 30;
      this.pose(u, 'lean');
      this.tweens.add({
        targets: u.spr, x: u.x + dir * dx, duration: dur, yoyo: true, ease: 'Quad.easeOut',
        onYoyo: () => res(), onComplete: () => { u.spr.setX(u.x); this.resumeIdle(u); },
      });
    });
  }

  // ------------------------------------------------------------------ end states
  victory() {
    this.over = true;
    stopMusic();
    sfx('victory');
    this.clearActions('');
    this.units.forEach((x) => x.ring.setVisible(false));
    // Everyone still standing does a little hop.
    this.liveHeroes().forEach((h, i) => {
      this.tweens.add({ targets: h.spr, y: h.baseY - 18, duration: 160, yoyo: true, repeat: 1, delay: 120 + i * 90, ease: 'Quad.easeOut' });
    });
    G.run.stats.fights += 1;
    const xp = this.enemies().reduce((a, e) => a + e.xp, 0);
    const gold = this.enemies().reduce((a, e) => a + e.gold, 0) + rng.int(0, 6);
    G.run.gold += gold;
    // Downed siblings walk it off after a win.
    for (const h of this.heroes()) {
      h.ref.hp = h.alive ? h.hp : Math.max(1, Math.round(h.max * 0.1));
    }
    const drops = [];
    const floor = G.run.floor;
    const isBoss = this.kind === 'boss';
    if (isBoss) { drops.push(makeGear(floor, 0.45), makeConsumable('salts'), makeConsumable('bigPotion')); }
    else if (this.kind === 'mimic') drops.push(makeGear(floor, 0.3));
    else {
      if (rng() < 0.4) drops.push(makeGear(floor));
      if (rng() < 0.35) drops.push(makeConsumable());
    }
    const kept = drops.filter((d) => addToBag(d));
    const lost = drops.length - kept.length;
    const ups = gainXp(xp);

    const room = G.run.map.rooms[this.roomId];
    if (room) room.cleared = true;

    const speaker = rng.pick(this.liveHeroes());
    const talk = (rng() < 0.35 && this.banter('victory')) || [`${speaker.name}: "${pickLine(speaker.id, 'victory')}"`];
    const lines = [...talk, '', `+${xp} XP   +${gold} gold`];
    const downed = this.heroes().filter((h) => !h.alive);
    if (downed.length) lines.push(`${downed.map((h) => h.name).join(' and ')} walk${downed.length === 1 ? 's' : ''} it off (back at 10% HP).`);
    if (lost) lines.push(`Bag full: ${lost} item(s) left behind.`);

    const finalBoss = isBoss && floor === FLOORS.length;
    this.time.delayedCall(700, () => this.resultPanel(isBoss ? 'BOSS DEFEATED' : 'VICTORY', lines.join('\n'), kept, C.gold, () => {
      if (finalBoss) this.goto('End', { result: 'win' });
      else this.goto('Map', { msg: isBoss ? 'The way down is open. Click the stairs when you are ready.' : 'Room cleared.', levelUps: ups });
    }));
  }

  defeat() {
    this.over = true;
    stopMusic();
    this.clearActions('');
    this.time.delayedCall(700, () => this.goto('End', { result: 'lose' }));
  }

  resultPanel(title, body, items, color, done) {
    let fired = false;
    const onDone = () => { if (!fired) { fired = true; done(); } };
    const L = this.add.container(0, 0).setDepth(70);
    L.add(this.add.rectangle(0, 0, W, H, 0x000000, 0.55).setOrigin(0).setInteractive());
    const mw = 500;
    const content = [];
    content.push(this.add.text(mw / 2, 20, title, { ...T.h1, fontSize: '30px', color: hex(color) }).setOrigin(0.5, 0).setStroke('#000', 6));
    let y = 70;
    const b = this.add.text(28, y, body, { ...T.body, wordWrap: { width: mw - 56 } });
    content.push(b); y += b.height + 12;
    for (const it of items) {
      const col = hex(RARITY[it.rarity]?.color ?? C.dim);
      content.push(this.add.text(28, y, it.name, { ...T.body, color: col }));
      y += 22;
      const sub = it.kind === 'gear' ? `${it.slot} · ${statLine(it.stats)}${it.owner ? ` · signature: ${HERO_BY_ID[it.owner].name}` : ''}` : it.desc;
      const s = this.add.text(28, y, sub, { ...T.small, fontSize: '17px', wordWrap: { width: mw - 56 } });
      content.push(s); y += s.height + 8;
    }
    y += 6;
    content.push(button(this, mw / 2 - 90, y, 180, 44, 'Continue', onDone));
    y += 62;
    const top = Math.max(10, (H - y) / 2);
    L.add(panel(this, (W - mw) / 2, top, mw, y, { edge: color }));
    L.add(this.add.container((W - mw) / 2, top, content));
    L.setAlpha(0);
    this.tweens.add({ targets: L, alpha: 1, duration: 250 });
    this.input.keyboard?.once('keydown-ENTER', onDone);
  }

  goto(key, data) {
    this.cameras.main.fadeOut(260, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start(key, data));
  }
}
