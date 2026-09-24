import '@fontsource/vt323/latin-400.css';
import '@fontsource/silkscreen/latin-400.css';
import Phaser from 'phaser';
import { W, H, C } from './ui/theme.js';
import TitleScene from './scenes/TitleScene.js';
import MapScene from './scenes/MapScene.js';
import BattleScene from './scenes/BattleScene.js';
import EventScene from './scenes/EventScene.js';
import PartyScene from './scenes/PartyScene.js';
import EndScene from './scenes/EndScene.js';
import HudScene from './scenes/HudScene.js';
import LeaderboardScene from './scenes/LeaderboardScene.js';
import { connect } from './systems/leaderboard.js';
import { unlockAudio, soundDebug, music, sfx } from './systems/sound.js';
import { G, descend, heroStats } from './systems/state.js';

// Console helpers for testing: __run(), __stats(hero), __party(), __map(), __descend()
window.__run = () => G.run;
window.__stats = (h) => heroStats(h);
window.__party = () => G.run?.party;
window.__map = () => G.run?.map;
window.__descend = () => descend();
window.__sound = { debug: soundDebug, music, sfx };

async function fontsReady() {
  if (!document.fonts) return;
  try {
    await Promise.race([
      Promise.all([document.fonts.load('22px "VT323"'), document.fonts.load('18px "Silkscreen"')]),
      new Promise((r) => setTimeout(r, 2500)),
    ]);
  } catch (e) { /* fall back to monospace */ }
}

// Browsers only allow audio after a user gesture.
for (const ev of ['pointerdown', 'keydown']) window.addEventListener(ev, unlockAudio);

// Dev-only fast mode for the balance autopilot (scripts/balance.mjs): open the
// game with ?sim (or ?sim=40 for a custom speed) to skip drawing and run the game
// clock many times faster. The published page never receives a query string.
const SIM = new URLSearchParams(location.search).get('sim');

function enableSim(game, speed) {
  // Every timer, tween and fade runs on game time, so scaling each frame's
  // delta fast-forwards the whole game through the real code.
  game.step = function (time, delta) { return Phaser.Game.prototype.step.call(this, time, delta * speed); };
  game.events.once('ready', () => { game.scene.render = () => {}; });
}

// Start reaching the shared leaderboard early, so it's ready by the first run's end.
connect();

fontsReady().then(() => {
  document.getElementById('boot')?.remove();
  window.__game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'game',
    width: W,
    height: H,
    backgroundColor: C.ink,
    pixelArt: true,
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    // Hud is last so it draws above every other scene.
    scene: [TitleScene, MapScene, BattleScene, EventScene, PartyScene, EndScene, LeaderboardScene, HudScene],
  });
  if (SIM !== null) enableSim(window.__game, Number(SIM) || 25);
});
