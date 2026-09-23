import Phaser from 'phaser';
import { W, H, C, T, hex } from '../ui/theme.js';
import { panel, button } from '../ui/widgets.js';
import { backdrop } from '../ui/backdrop.js';
import { buildBaseTextures, heroKey } from '../art/sprites.js';
import { HEROES } from '../data/heroes.js';
import { newRun } from '../systems/state.js';

export default class TitleScene extends Phaser.Scene {
  constructor() { super('Title'); }

  create() {
    buildBaseTextures(this);
    backdrop(this, 0x2a2436, { torches: [[70, 90], [W - 70, 90]] });

    const title = this.add.text(W / 2, 74, 'SIBLING RIVALRY', { ...T.h1, fontSize: '52px' }).setOrigin(0.5).setStroke('#000000', 8);
    title.setShadow(0, 5, '#000000', 0, true, true);
    this.add.text(W / 2, 138, 'Four siblings. One procedurally generated dungeon.\nZero agreement on strategy.', { ...T.body, fontSize: '24px', color: hex(C.dim), align: 'center' }).setOrigin(0.5);

    // The party lineup
    const info = this.add.text(W / 2, 400, 'Hover a sibling to meet them.', { ...T.body, align: 'center', wordWrap: { width: 640 } }).setOrigin(0.5, 0);
    const spacing = 170;
    const x0 = W / 2 - spacing * 1.5;
    HEROES.forEach((d, i) => {
      const x = x0 + i * spacing, y = 270;
      this.add.image(x, y + 38, 'shadow').setScale(1.1);
      const s = this.add.image(x, y, heroKey(d.id)).setScale(1.25).setInteractive({ useHandCursor: false });
      this.tweens.add({ targets: s, y: y - 5, duration: 700 + i * 90, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: i * 120 });
      this.add.text(x, y + 60, d.name.toUpperCase(), { ...T.h2, fontSize: '16px' }).setOrigin(0.5);
      this.add.text(x, y + 80, d.title, { ...T.small, align: 'center', wordWrap: { width: 150 } }).setOrigin(0.5, 0);
      s.on('pointerover', () => { info.setText(`${d.name}: ${d.blurb}`); s.setTint(0xfff3d0); });
      s.on('pointerout', () => { s.clearTint(); });
    });

    const b = button(this, W / 2 - 120, 440 + 4, 240, 44, 'Enter the dungeon', () => this.start(), { fontSize: '26px' });
    this.add.text(W / 2, 510, 'Click rooms to explore  ·  Turn-based fights  ·  d20 skill checks  ·  Press 1-5 for skills in battle', { ...T.small }).setOrigin(0.5);
    this.input.keyboard?.once('keydown-ENTER', () => this.start());
    b.setDepth(2);
  }

  start() {
    newRun();
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Map', { intro: true }));
  }
}
