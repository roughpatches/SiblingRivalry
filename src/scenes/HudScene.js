import Phaser from 'phaser';
import { W, C } from '../ui/theme.js';
import { isMuted, toggleMute } from '../systems/sound.js';

// A thin always-on-top layer for the mute toggle (click the speaker, or press M).
export default class HudScene extends Phaser.Scene {
  constructor() { super('Hud'); }

  create() {
    const x = W - 20, y = 12;
    this.icon = this.add.graphics();
    this.draw(x, y);
    const zone = this.add.zone(x, y, 28, 22).setInteractive({ useHandCursor: true });
    zone.on('pointerup', () => { toggleMute(); this.draw(x, y); });
    this.input.keyboard?.on('keydown-M', () => { toggleMute(); this.draw(x, y); });
  }

  draw(x, y) {
    const g = this.icon.clear();
    const col = isMuted() ? C.dim : C.parch;
    g.fillStyle(0x000000, 0.45).fillRoundedRect(x - 13, y - 9, 26, 18, 4);
    g.fillStyle(col, 1).fillRect(x - 9, y - 3, 4, 6).fillTriangle(x - 5, y - 3, x, y - 7, x, y + 7).fillTriangle(x - 5, y + 3, x, y + 7, x, y - 7);
    if (isMuted()) {
      g.lineStyle(2, C.red, 1).lineBetween(x + 3, y - 4, x + 9, y + 4).lineBetween(x + 9, y - 4, x + 3, y + 4);
    } else {
      g.lineStyle(1, col, 1).beginPath().arc(x + 1, y, 5, -0.8, 0.8).strokePath();
      g.beginPath().arc(x + 1, y, 8, -0.8, 0.8).strokePath();
    }
  }
}
