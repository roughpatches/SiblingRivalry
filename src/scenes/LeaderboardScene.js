import Phaser from 'phaser';
import { W, H, C, T, hex } from '../ui/theme.js';
import { panel, button } from '../ui/widgets.js';
import { portraitKey } from '../art/sprites.js';
import { HEROES } from '../data/heroes.js';
import { FLOORS } from '../data/enemies.js';
import { loadBoard } from '../systems/leaderboard.js';

// An overlay opened from the title or end screen. The scene that opened it is
// paused until it closes.
export default class LeaderboardScene extends Phaser.Scene {
  constructor() { super('Leaderboard'); }

  init(data) { this.from = data.from; this.highlight = data.highlight || null; }

  create() {
    this.add.rectangle(0, 0, W, H, 0x000000, 0.75).setOrigin(0).setInteractive();
    panel(this, 16, 14, W - 32, H - 28, { fill: C.stone, edge: C.gold });
    this.titleText = this.add.text(W / 2, 44, 'FAMILY LEADERBOARD', { ...T.h1, fontSize: '28px' }).setOrigin(0.5).setStroke('#000', 5);
    this.status = this.add.text(W / 2, H / 2, 'Checking the family group chat...', { ...T.body, color: hex(C.dim) }).setOrigin(0.5);
    button(this, W - 176, H - 70, 140, 40, 'Back', () => this.close(), { color: C.dim });
    this.input.keyboard?.on('keydown-ESC', () => this.close());

    loadBoard().then((b) => { if (this.sys.isActive()) this.draw(b); })
      .catch(() => { if (this.sys.isActive()) this.status.setText('The leaderboard is unavailable right now.'); });
  }

  close() {
    if (this.from) this.scene.resume(this.from);
    this.scene.stop();
  }

  draw(b) {
    this.status.destroy();
    if (!b.family) this.titleText.setText('LEADERBOARD: THIS DEVICE');
    if (!b.runs.length) {
      this.add.text(W / 2, H / 2 - 10, 'No finished runs yet.\nBeat the Hydra (or lose to anything) to get on the board.', { ...T.body, align: 'center', color: hex(C.dim) }).setOrigin(0.5);
      this.footer(b);
      return;
    }

    // Left: the deepest runs.
    const lx = 44;
    this.add.text(lx, 76, 'DEEPEST RUNS', T.h2);
    this.add.text(lx + 470, 80, 'MVP', { ...T.label }).setOrigin(0.5, 0);
    b.runs.slice(0, 9).forEach((r, i) => {
      const y = 106 + i * 40;
      const mine = this.highlight ? r.id === this.highlight && r.isMe : false;
      const g = this.add.graphics();
      g.fillStyle(mine ? C.stone3 : (i % 2 ? C.stone : C.stone2), mine ? 1 : 0.7).fillRect(lx - 6, y - 4, 528, 36);
      if (mine) g.lineStyle(2, C.gold, 1).strokeRect(lx - 6, y - 4, 528, 36);
      const medal = [C.gold, 0xc9ccd6, 0xc98a4a][i];
      this.add.text(lx + 12, y + 14, `${i + 1}`, { ...T.h2, fontSize: '16px', color: hex(medal ?? C.dim) }).setOrigin(0.5);
      this.add.text(lx + 34, y, this.who(r), { ...T.body, fontSize: '21px' }).setFixedSize(170, 0).setCrop(0, 0, 170, 30);
      this.add.text(lx + 210, y, this.result(r), { ...T.body, fontSize: '19px', color: hex(r.won ? C.gold : C.parch) });
      this.add.text(lx + 210, y + 16, `${this.when(r.at)}  ·  LV ${r.level}  ·  ${r.fights} fights`, { ...T.small, fontSize: '15px' });
      if (r.mvp) this.add.image(lx + 470, y + 14, portraitKey(r.mvp)).setScale(0.6);
    });

    // Right: which sibling carries the family, and who has played.
    const rx = 600;
    this.add.text(rx, 76, 'SIBLING MVPS', T.h2);
    const most = Math.max(1, ...Object.values(b.mvp));
    HEROES.forEach((d, i) => {
      const y = 108 + i * 42;
      this.add.image(rx + 18, y + 14, portraitKey(d.id)).setScale(0.7);
      this.add.text(rx + 44, y - 2, d.name, { ...T.body, fontSize: '20px' });
      const n = b.mvp[d.id];
      const g = this.add.graphics();
      g.fillStyle(C.ink, 1).fillRect(rx + 44, y + 20, 220, 8);
      g.fillStyle(n === most && n > 0 ? C.gold : C.edge, 1).fillRect(rx + 44, y + 20, Math.round(220 * n / most), 8);
      this.add.text(rx + 300, y + 4, `${n}`, { ...T.body, fontSize: '22px' }).setOrigin(1, 0);
    });

    if (b.family) {
      this.add.text(rx, 290, 'PLAYERS', T.h2);
      b.players.slice(0, 4).forEach((p, i) => {
        const y = 318 + i * 26;
        this.add.text(rx, y, p.isMe ? `${p.name} (you)` : p.name, { ...T.body, fontSize: '20px' }).setFixedSize(170, 0).setCrop(0, 0, 170, 26);
        this.add.text(rx + 320, y, `${p.played} run${p.played === 1 ? '' : 's'} · ${p.wins} win${p.wins === 1 ? '' : 's'}`, { ...T.small }).setOrigin(1, 0);
      });
    }
    this.footer(b);
  }

  footer(b) {
    const note = b.family
      ? 'Every finished run by anyone this page is shared with lands here.'
      : 'Runs on this device only. Play from the shared link to compete with the family.';
    this.add.text(44, H - 62, note, { ...T.small, wordWrap: { width: 700 } });
  }

  who(r) { return r.isMe && r.uid !== 'local' ? `${r.name} (you)` : r.name; }

  result(r) {
    const past = r.floor - FLOORS.length;
    if (r.won && past > 0) return `Beat the Hydra, +${past} floor${past === 1 ? '' : 's'}`;
    if (r.won) return 'Beat the Hydra';
    return `Fell on floor ${r.floor}`;
  }

  when(t) {
    if (!t) return '';
    const d = new Date(t);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }
}
