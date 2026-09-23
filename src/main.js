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
import { unlockAudio, soundDebug, music, sfx } from './systems/sound.js';
import { G, descend } from './systems/state.js';

// Console helpers for testing: __party(), __map(), __descend()
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
    scene: [TitleScene, MapScene, BattleScene, EventScene, PartyScene, EndScene, HudScene],
  });
});
