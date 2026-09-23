import Phaser from 'phaser';
import { W, H, C, T, hex, RARITY, FONT_DISPLAY } from '../ui/theme.js';
import { panel, button, floatText } from '../ui/widgets.js';
import { backdrop } from '../ui/backdrop.js';
import { buildBaseTextures, heroKey, iconKey, idleAnim } from '../art/sprites.js';
import { picKey } from '../art/pictures.js';
import { sfx, music } from '../systems/sound.js';
import { HERO_BY_ID } from '../data/heroes.js';
import { EVENTS, TRIVIA } from '../data/events.js';
import { floorDef } from '../data/enemies.js';
import { makeGear, makeConsumable, statLine, STAT_LABEL } from '../data/items.js';
import { G, heroStats, gainXp, addToBag, healHero } from '../systems/state.js';
import { rng, d20 } from '../systems/rng.js';

const PX = 110, PW = 740;

export default class EventScene extends Phaser.Scene {
  constructor() { super('Event'); }

  init(data) {
    this.roomId = data.roomId;
    this.mode = data.mode;
    this.room = G.run.map.rooms[this.roomId];
    this.ev = EVENTS.find((e) => e.id === this.room.eventId) || EVENTS[0];
    this.levelUps = [];
  }

  create() {
    buildBaseTextures(this);
    backdrop(this, floorDef(G.run.floor).tint, { torches: [[60, 100], [W - 60, 100]] });
    music(floorDef(G.run.floor).theme || 'basement');
    this.cameras.main.fadeIn(220, 0, 0, 0);
    panel(this, PX, 30, PW, 480, { fill: C.stone });
    this.layer = this.add.container(0, 0);
    if (this.mode === 'trivia') this.triviaIntro(); else this.checkIntro();
  }

  clear() { this.layer.removeAll(true); }

  header(title, body, icon) {
    this.layer.add(this.add.image(PX + 40, 66, iconKey(icon)).setScale(1.3));
    this.layer.add(this.add.text(PX + 70, 52, title.toUpperCase(), { ...T.h2, fontSize: '22px' }));
    // Each room has a picture beside its title (Charlie for the cat room, the sphinx for trivia).
    const art = this.mode === 'trivia' ? picKey('sphinx') : (this.ev?.art || picKey(this.ev?.id));
    const hasArt = this.textures.exists(art);
    if (hasArt) this.layer.add(this.add.image(PX + PW - 60, 62, art));
    const t = this.add.text(PX + 30, 96, body, { ...T.body, fontSize: '23px', wordWrap: { width: PW - (hasArt ? 150 : 60) }, lineSpacing: 2 });
    this.layer.add(t);
    return 96 + t.height + 16;
  }

  // ------------------------------------------------------------ skill check
  checkIntro() {
    const ev = this.ev;
    let y = this.header(ev.title, ev.text, 'event');
    this.layer.add(this.add.text(PX + 30, y, `${STAT_LABEL[ev.stat].toUpperCase()} CHECK · DC ${ev.dc} · roll d20 + modifier, meet or beat the DC`, { ...T.label, fontSize: '13px', color: hex(C.gold) }));
    y += 30;
    this.layer.add(this.add.text(PX + 30, y, 'Who attempts it?', { ...T.body }));
    y += 32;
    const live = G.run.party.filter((h) => h.hp > 0);
    const bw = (PW - 60 - 3 * 12) / 4;
    G.run.party.forEach((h, i) => {
      const d = HERO_BY_ID[h.id];
      const mod = this.modFor(h);
      const x = PX + 30 + i * (bw + 12);
      const card = this.add.container(0, 0);
      card.add(this.add.image(x + bw / 2, y + 44, heroKey(h.id)).setScale(0.9).setTint(h.hp > 0 ? 0xffffff : 0x555555));
      const bonus = ev.bonus?.[h.id] ? ` · +${ev.bonus[h.id]} bonus` : '';
      const b = button(this, x, y + 96, bw, 54, `${d.name} ${mod >= 0 ? '+' : ''}${mod}`, () => this.attempt(h), {
        disabled: h.hp <= 0, sub: h.hp <= 0 ? 'knocked out' : `${this.odds(mod, ev.dc)}% chance${bonus}`, fontSize: '22px',
      });
      card.add(b);
      this.layer.add(card);
    });
    y += 166;
    this.layer.add(button(this, PX + PW - 190, y, 160, 40, 'Walk away', () => this.finish('You leave it alone. Probably wise.'), { color: C.dim }));
    if (!live.length) this.finish('Nobody is conscious enough to try.');
  }

  modFor(h) {
    const s = heroStats(h);
    return (s[this.ev.stat] || 0) + (this.ev.bonus?.[h.id] || 0);
  }

  odds(mod, dc) {
    // nat 20 always succeeds, nat 1 always fails
    let wins = 0;
    for (let r = 1; r <= 20; r++) if (r === 20 || (r !== 1 && r + mod >= dc)) wins++;
    return wins * 5;
  }

  async attempt(h) {
    this.clear();
    const ev = this.ev;
    const d = HERO_BY_ID[h.id];
    const mod = this.modFor(h);
    let y = this.header(ev.title, ev.lines?.[h.id] || `${d.name} steps up.`, 'event');
    this.layer.add(this.add.sprite(PX + 110, y + 90, heroKey(h.id)).setScale(1.3).play(idleAnim(heroKey(h.id))));
    const roll = d20();
    const dice = this.d20Graphic(PX + PW / 2, y + 90);
    sfx('dice');
    await this.rollAnim(dice, roll);
    const total = roll + mod;
    const nat20 = roll === 20, nat1 = roll === 1;
    const success = nat20 || (!nat1 && total >= ev.dc);
    G.run.stats.checks += 1;
    if (success) G.run.stats.checksWon += 1;
    if (nat20) G.run.stats.nat20 += 1;
    if (nat1) G.run.stats.nat1 += 1;

    const verdict = nat20 ? 'NATURAL 20!' : nat1 ? 'NATURAL 1.' : success ? 'SUCCESS' : 'FAILURE';
    this.layer.add(this.add.text(PX + PW - 180, y + 50, `${roll} ${mod >= 0 ? '+' : '-'} ${Math.abs(mod)} = ${total}`, { ...T.body, fontSize: '30px' }).setOrigin(0.5));
    this.layer.add(this.add.text(PX + PW - 180, y + 84, `needed ${ev.dc}`, { ...T.small, fontSize: '20px' }).setOrigin(0.5));
    const vt = this.add.text(PX + PW - 180, y + 124, verdict, { ...T.h2, fontSize: '22px', color: hex(success ? C.green : C.red) }).setOrigin(0.5).setScale(0.3);
    this.layer.add(vt);
    this.tweens.add({ targets: vt, scale: 1, duration: 280, ease: 'Back.easeOut' });
    if (nat20) this.cameras.main.flash(250, 255, 220, 120);
    if (nat1) this.cameras.main.shake(250, 0.01);
    sfx(nat20 ? 'nat20' : success ? 'success' : 'fail');

    const out = success ? ev.success : ev.fail;
    const results = this.applyOutcome(out, h, success);
    if (nat20) { G.run.gold += 20; results.push('+20 gold (nat 20 bonus)'); }
    y += 200;
    const t = this.add.text(PX + 30, y, out.text + (results.length ? '\n' + results.join('   ') : ''), { ...T.body, wordWrap: { width: PW - 60 } });
    this.layer.add(t);
    y += t.height + 12;
    this.layer.add(button(this, PX + PW / 2 - 90, Math.min(y, 452), 180, 44, 'Continue', () => this.finish(null)));
  }

  applyOutcome(o, h, success) {
    const r = [];
    const floor = G.run.floor;
    if (o.gold) { const g = o.gold + (floor - 1) * 10; G.run.gold += g; r.push(`+${g} gold`); }
    if (o.goldLoss) { const g = Math.min(G.run.gold, o.goldLoss); G.run.gold -= g; r.push(`-${g} gold`); }
    if (o.xp) { const x = o.xp + (floor - 1) * 6; this.levelUps.push(...gainXp(x)); r.push(`+${x} XP`); }
    if (o.dmg) { const dmg = o.dmg + (floor - 1) * 4; h.hp = Math.max(1, h.hp - dmg); r.push(`${HERO_BY_ID[h.id].name} -${dmg} HP`); }
    if (o.dmgAll) { const dmg = o.dmgAll + (floor - 1) * 3; G.run.party.forEach((p) => { if (p.hp > 0) p.hp = Math.max(1, p.hp - dmg); }); r.push(`Everyone -${dmg} HP`); }
    if (o.healAll) { G.run.party.forEach((p) => { if (p.hp > 0) healHero(p, heroStats(p).maxHp * o.healAll); }); r.push(`Everyone heals ${Math.round(o.healAll * 100)}%`); }
    if (o.reveal) { G.run.map.revealed = true; r.push('Map revealed'); }
    if (o.permStat) { h.perm[this.ev.stat] = (h.perm[this.ev.stat] || 0) + 1; r.push(`${HERO_BY_ID[h.id].name} +1 ${STAT_LABEL[this.ev.stat]}`); }
    if (o.consumable) { const it = makeConsumable(o.consumable); if (addToBag(it)) r.push(`Got ${it.name}`); }
    if (o.loot !== undefined) {
      const it = makeGear(floor, o.loot);
      if (addToBag(it)) r.push(`Got ${it.name} (${RARITY[it.rarity].name})`);
      else r.push('Bag full, loot left behind');
    }
    return r;
  }

  d20Graphic(x, y) {
    const c = this.add.container(x, y);
    const g = this.add.graphics();
    const R = 58;
    const pts = [];
    for (let i = 0; i < 6; i++) { const a = Math.PI / 6 + i * Math.PI / 3; pts.push(new Phaser.Math.Vector2(Math.cos(a) * R, Math.sin(a) * R)); }
    g.fillStyle(0x000000, 0.4).fillPoints(pts.map((p) => ({ x: p.x + 4, y: p.y + 5 })), true);
    g.fillStyle(C.purple, 1).fillPoints(pts, true);
    g.lineStyle(3, 0xffffff, 0.5).strokePoints(pts, true);
    // inner triangle facets
    const tri = [0, 2, 4].map((i) => pts[i].clone().scale(0.62));
    g.lineStyle(2, 0xffffff, 0.35).strokePoints(tri, true);
    const n = this.add.text(0, 2, '20', { fontFamily: FONT_DISPLAY, fontSize: '30px', color: '#ffffff' }).setOrigin(0.5).setStroke('#2a1640', 6);
    c.add([g, n]);
    c.num = n;
    this.layer.add(c);
    return c;
  }

  rollAnim(dice, final) {
    return new Promise((res) => {
      let ticks = 0;
      this.tweens.add({ targets: dice, angle: 720, duration: 900, ease: 'Cubic.easeOut' });
      const ev = this.time.addEvent({
        delay: 60, repeat: 14, callback: () => {
          ticks++;
          dice.num.setText(ticks >= 15 ? String(final) : String(rng.int(1, 20)));
          dice.num.setAngle(-dice.angle);
          if (ticks >= 15) {
            dice.num.setColor(final === 20 ? hex(C.gold) : final === 1 ? hex(C.red) : '#ffffff');
            this.tweens.add({ targets: dice, scale: { from: 1.25, to: 1 }, duration: 250, ease: 'Back.easeOut' });
            this.time.delayedCall(260, res);
          }
        },
      });
    });
  }

  // ------------------------------------------------------------ trivia
  triviaIntro() {
    let y = this.header('The Pub Trivia Sphinx', 'A sphinx in a quiz-night t-shirt blocks the way. "Answer my question correctly and you may pass... with prizes. Choose your answerer."', 'trivia');
    this.layer.add(this.add.text(PX + 30, y, "Andrew's Trivia Night: if he answers, two wrong choices are crossed out.", { ...T.small, fontSize: '20px', color: hex(C.gold) }));
    y += 36;
    const bw = (PW - 60 - 3 * 12) / 4;
    G.run.party.forEach((h, i) => {
      const x = PX + 30 + i * (bw + 12);
      this.layer.add(this.add.image(x + bw / 2, y + 44, heroKey(h.id)).setScale(0.9).setTint(h.hp > 0 ? 0xffffff : 0x555555));
      this.layer.add(button(this, x, y + 96, bw, 44, HERO_BY_ID[h.id].name, () => this.triviaAsk(h), { disabled: h.hp <= 0 }));
    });
    y += 160;
    this.layer.add(button(this, PX + PW - 190, y, 160, 40, 'Walk away', () => this.finish('The sphinx looks disappointed in you.'), { color: C.dim }));
  }

  triviaAsk(h) {
    this.clear();
    const q = rng.pick(TRIVIA);
    let opts = q.a.map((text, i) => ({ text, right: i === q.correct }));
    if (h.id === 'andrew') {
      const wrong = rng.shuffle(opts.filter((o) => !o.right)).slice(0, 1);
      opts = [opts.find((o) => o.right), ...wrong];
    }
    opts = rng.shuffle(opts);
    let y = this.header('The Pub Trivia Sphinx', `"${q.q}"`, 'trivia');
    if (h.id === 'andrew') {
      this.layer.add(this.add.text(PX + 30, y, 'Andrew: "Oh, I know this one. It\'s one of these two."', { ...T.small, fontSize: '20px', color: hex(C.gold) }));
      y += 32;
    } else {
      this.layer.add(this.add.text(PX + 30, y, `${HERO_BY_ID[h.id].name} is answering. No phones.`, { ...T.small, fontSize: '20px' }));
      y += 32;
    }
    const bw = (PW - 72) / 2;
    opts.forEach((o, i) => {
      const x = PX + 30 + (i % 2) * (bw + 12);
      const by = y + Math.floor(i / 2) * 58;
      this.layer.add(button(this, x, by, bw, 48, o.text, () => this.triviaAnswer(h, o, q), { fontSize: '22px' }));
    });
  }

  triviaAnswer(h, o, q) {
    this.clear();
    G.run.stats.checks += 1;
    let r;
    let text;
    if (o.right) {
      G.run.stats.checksWon += 1;
      text = `"Correct," purrs the sphinx. "${q.a[q.correct]}." It hands over the quiz-night prizes.`;
      r = this.applyOutcome({ gold: 25, xp: 16, loot: 0.2 }, h, true);
      this.cameras.main.flash(200, 255, 220, 120);
      sfx('success');
    } else {
      text = `"Wrong. It was ${q.a[q.correct]}." The sphinx bops ${HERO_BY_ID[h.id].name} on the head.`;
      r = this.applyOutcome({ dmg: 12 }, h, false);
      this.cameras.main.shake(200, 0.008);
      sfx('fail');
    }
    let y = this.header('The Pub Trivia Sphinx', text, 'trivia');
    const t = this.add.text(PX + 30, y, r.join('   '), { ...T.body, color: hex(o.right ? C.green : C.red), wordWrap: { width: PW - 60 } });
    this.layer.add(t);
    this.layer.add(button(this, PX + PW / 2 - 90, y + t.height + 24, 180, 44, 'Continue', () => this.finish(null)));
  }

  finish(msg) {
    this.room.cleared = true;
    this.cameras.main.fadeOut(220, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Map', { msg: msg || `${this.mode === 'trivia' ? 'The sphinx waves you on.' : this.ev.title + ': done.'}`, levelUps: this.levelUps }));
  }
}
