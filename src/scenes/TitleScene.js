import Phaser from 'phaser';
import { W, H, C, T, hex } from '../ui/theme.js';
import { panel, button, isTouch } from '../ui/widgets.js';
import { backdrop } from '../ui/backdrop.js';
import { buildBaseTextures, heroKey, idleAnim, CHARLIE } from '../art/sprites.js';
import { HEROES } from '../data/heroes.js';
import { newRun } from '../systems/state.js';
import { savedRunInfo, loadRun } from '../systems/save.js';
import { music } from '../systems/sound.js';

export default class TitleScene extends Phaser.Scene {
  constructor() { super('Title'); }

  create() {
    buildBaseTextures(this);
    if (!this.scene.isActive('Hud')) this.scene.launch('Hud');
    music('title');
    backdrop(this, 0x2a2436, { torches: [[70, 90], [W - 70, 90]] });

    const title = this.add.text(W / 2, 74, 'SIBLING RIVALRY', { ...T.h1, fontSize: '52px' }).setOrigin(0.5).setStroke('#000000', 8);
    title.setShadow(0, 5, '#000000', 0, true, true);
    this.add.text(W / 2, 138, 'Four siblings. One procedurally generated dungeon.\nZero agreement on strategy.', { ...T.body, fontSize: '24px', color: hex(C.dim), align: 'center' }).setOrigin(0.5);

    // The party lineup
    const info = this.add.text(W / 2, 400, `${isTouch(this) ? 'Tap' : 'Hover'} a sibling to meet them.`, { ...T.body, align: 'center', wordWrap: { width: 640 } }).setOrigin(0.5, 0);
    const spacing = 170;
    const x0 = W / 2 - spacing * 1.5;
    HEROES.forEach((d, i) => {
      const x = x0 + i * spacing, y = 270;
      this.add.image(x, y + 38, 'shadow').setScale(1.1);
      const s = this.add.sprite(x, y, heroKey(d.id)).setScale(1.25).setInteractive({ useHandCursor: false });
      s.play({ key: idleAnim(heroKey(d.id)), startFrame: i * 2 });
      this.add.text(x, y + 60, d.name.toUpperCase(), { ...T.h2, fontSize: '16px' }).setOrigin(0.5);
      this.add.text(x, y + 80, d.title, { ...T.small, align: 'center', wordWrap: { width: 150 } }).setOrigin(0.5, 0);
      s.on('pointerover', () => { info.setText(`${d.name}: ${d.blurb}`); s.setTint(0xfff3d0); });
      s.on('pointerout', () => { s.clearTint(); });
      if (d.id === 'andrew') {
        const cat = this.add.image(x + 56, y + 24, CHARLIE).setScale(0.8).setInteractive();
        this.tweens.add({ targets: cat, scaleY: 0.77, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        cat.on('pointerover', () => { info.setText("Charlie: Andrew's cat. Not playable. Emotionally load-bearing."); cat.setTint(0xfff3d0); });
        cat.on('pointerout', () => cat.clearTint());
      }
    });

    // With a saved run, offer Continue alongside a fresh start. Enter continues.
    const saved = savedRunInfo();
    let b;
    if (saved) {
      b = button(this, W / 2 - 250, 444, 240, 44, `Continue (floor ${saved.floor})`, () => this.resume(), { fontSize: '24px' });
      button(this, W / 2 + 10, 444, 240, 44, 'New run', () => this.start(), { fontSize: '24px', color: C.dim }).setDepth(2);
    } else {
      b = button(this, W / 2 - 120, 444, 240, 44, 'Enter the dungeon', () => this.start(), { fontSize: '26px' });
    }
    this.add.text(W / 2, 510, isTouch(this)
      ? 'Tap rooms to explore  ·  Turn-based fights  ·  d20 skill checks  ·  Hold a skill or room to read about it'
      : 'Click rooms to explore  ·  Turn-based fights  ·  d20 skill checks  ·  Press 1-5 for skills in battle', { ...T.small }).setOrigin(0.5);
    button(this, 16, 12, 150, 32, 'Leaderboard', () => {
      this.scene.pause();
      this.scene.launch('Leaderboard', { from: 'Title' });
    }, { fontSize: '20px', color: C.blue });
    this.input.keyboard?.once('keydown-ENTER', () => (saved ? this.resume() : this.start()));
    b.setDepth(2);
  }

  resume() {
    if (!loadRun()) return this.start();
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Map', { intro: true }));
  }

  start() {
    newRun();
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Map', { intro: true }));
  }
}
