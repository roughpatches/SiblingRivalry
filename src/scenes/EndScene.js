import Phaser from 'phaser';
import { W, H, C, T, hex } from '../ui/theme.js';
import { panel, button } from '../ui/widgets.js';
import { backdrop } from '../ui/backdrop.js';
import { heroKey, frameKey } from '../art/sprites.js';
import { HERO_BY_ID } from '../data/heroes.js';
import { G, newRun, descend, heroStats } from '../systems/state.js';

export default class EndScene extends Phaser.Scene {
  constructor() { super('End'); }
  init(data) { this.result = data.result; }

  create() {
    const win = this.result === 'win';
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
    this.add.text(W / 2, 330, lines.join('\n'), { ...T.body, align: 'center', color: hex(C.dim) }).setOrigin(0.5, 0);

    if (win) {
      button(this, W / 2 - 230, 410, 220, 46, 'Keep descending', () => {
        G.run.party.forEach((h) => { h.hp = heroStats(h).maxHp; });
        descend();
        this.go('Map', { intro: true });
      });
      button(this, W / 2 + 10, 410, 220, 46, 'New run', () => { newRun(); this.go('Map', { intro: true }); });
    } else {
      button(this, W / 2 - 230, 410, 220, 46, 'Try again', () => { newRun(); this.go('Map', { intro: true }); });
      button(this, W / 2 + 10, 410, 220, 46, 'Title screen', () => this.go('Title', {}), { color: C.dim });
    }
  }

  go(key, data) {
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start(key, data));
  }
}
