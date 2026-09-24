import Phaser from 'phaser';
import { W, H, C, T, hex } from '../ui/theme.js';
import { panel, button } from '../ui/widgets.js';
import { backdrop } from '../ui/backdrop.js';
import { heroKey, frameKey } from '../art/sprites.js';
import { HERO_BY_ID } from '../data/heroes.js';
import { G, newRun, descend, heroStats, heroTotals } from '../systems/state.js';
import { recordRun, runMvp } from '../systems/leaderboard.js';
import { clearSave } from '../systems/save.js';
import { sfx, stopMusic } from '../systems/sound.js';

export default class EndScene extends Phaser.Scene {
  constructor() { super('End'); }
  init(data) { this.result = data.result; }

  create() {
    const win = this.result === 'win';
    // The run is over. "Keep descending" saves again as soon as the next map is drawn.
    clearSave();
    stopMusic();
    sfx(win ? 'fanfare' : 'defeat');
    backdrop(this, win ? 0x2e2a18 : 0x2a1820, { torches: [[80, 90], [W - 80, 90]] });
    this.cameras.main.fadeIn(400, 0, 0, 0);
    panel(this, 150, 40, W - 300, H - 80, { edge: win ? C.gold : C.red });

    const title = win ? 'THE HYDRA IS MUTED' : 'THE PARTY WIPES';
    this.add.text(W / 2, 80, title, { ...T.h1, fontSize: '32px', color: hex(win ? C.gold : C.red) }).setOrigin(0.5).setStroke('#000', 6);
    const sub = win
      ? 'The family group chat falls silent. For now. Somewhere, a phone buzzes: "Who wants to do Thanksgiving next year?"'
      : 'Tom calls Mom. Mom calls everyone home for dinner. Nobody mentions the dungeon.';
    this.add.text(W / 2, 128, sub, { ...T.body, align: 'center', wordWrap: { width: W - 360 } }).setOrigin(0.5, 0);

    const party = G.run.party;
    party.forEach((h, i) => {
      const x = W / 2 - 180 + i * 120;
      const img = this.add.image(x, 250, heroKey(h.id));
      if (!win) img.setTexture(frameKey(heroKey(h.id), 'blink')).setAngle(-90).setTint(0x777788);
      else this.tweens.add({ targets: img, y: 238, duration: 300 + i * 60, yoyo: true, repeat: -1, ease: 'Quad.easeOut', delay: i * 90 });
      this.add.text(x, 296, `${HERO_BY_ID[h.id].name} · LV ${h.level}`, { ...T.body, fontSize: '19px' }).setOrigin(0.5);
    });

    const s = G.run.stats;
    const lines = [
      `Reached floor ${G.run.floor}   ·   ${s.fights} fights won   ·   ${G.run.gold} gold`,
      `Skill checks passed: ${s.checksWon}/${s.checks}   ·   Nat 20s: ${s.nat20}   ·   Nat 1s: ${s.nat1}`,
    ];
    this.add.text(W / 2, 318, lines.join('\n'), { ...T.body, align: 'center', color: hex(C.dim) }).setOrigin(0.5, 0);

    // MVP, then the run's place on the leaderboard once it has been recorded.
    const mvp = runMvp();
    if (mvp) {
      const t = heroTotals(mvp);
      const best = [['dealt', 'damage'], ['healed', 'healed'], ['taken', 'soaked up']]
        .sort((a, b) => t[b[0]] - t[a[0]])[0];
      this.add.text(W / 2, 368, `MVP: ${HERO_BY_ID[mvp].name} (${t[best[0]].toLocaleString()} ${best[1]})`, { ...T.body, color: hex(C.gold) }).setOrigin(0.5, 0);
    }
    const rank = this.add.text(W / 2, 394, '', { ...T.small }).setOrigin(0.5, 0);
    this.entry = null;
    recordRun(win).then((r) => {
      this.entry = r.entry;
      if (!this.sys.isActive()) return;
      if (r.rank === 1) rank.setText('New family record!').setColor(hex(C.gold));
      else if (r.rank) rank.setText(`#${r.rank} on the family leaderboard${r.personalBest ? ', and your best run yet' : ''}.`);
      else if (r.personalBest) rank.setText('Your best run yet.');
    });

    if (win) {
      button(this, W / 2 - 315, 424, 200, 46, 'Keep descending', () => {
        G.run.party.forEach((h) => { h.hp = heroStats(h).maxHp; });
        descend();
        this.go('Map', { intro: true });
      });
      button(this, W / 2 - 100, 424, 200, 46, 'New run', () => { newRun(); this.go('Map', { intro: true }); });
    } else {
      button(this, W / 2 - 315, 424, 200, 46, 'Try again', () => { newRun(); this.go('Map', { intro: true }); });
      button(this, W / 2 - 100, 424, 200, 46, 'Title screen', () => this.go('Title', {}), { color: C.dim });
    }
    button(this, W / 2 + 115, 424, 200, 46, 'Leaderboard', () => this.openBoard(), { color: C.blue });
  }

  openBoard() {
    this.scene.pause();
    this.scene.launch('Leaderboard', { from: 'End', highlight: this.entry?.id });
  }

  go(key, data) {
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start(key, data));
  }
}
