// Smoke test for the built game: opens dist/index.html in headless Chromium,
// starts a run, and plays one fight with the balance autopilot's fast mode,
// failing on any page error. Run `npm run build` first.
//
//   npm i --no-save playwright && npx playwright install chromium
//   node scripts/smoke.mjs
//
// Set CHROMIUM_PATH to use an already-installed Chromium.
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { existsSync, readFileSync } from 'node:fs';
import { chromium } from 'playwright';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const file = resolve(root, 'dist/index.html');
const fail = (msg) => { console.error(`FAIL: ${msg}`); process.exitCode = 1; };

if (!existsSync(file)) {
  fail('dist/index.html is missing. Run npm run build first.');
  process.exit();
}

// The published page must be one self-contained file.
const html = readFileSync(file, 'utf8');
const external = html.match(/<(script|link)[^>]+(src|href)="(?!data:)[^"]+"/g) || [];
if (external.length) fail(`dist/index.html loads external files: ${external.join(', ')}`);

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.stack || String(e)));

const step = async (name, fn) => {
  try { await fn(); console.log(`ok   ${name}`); } catch (e) { fail(`${name}: ${e.message.split('\n')[0]}`); }
};
const active = (key) => page.waitForFunction((k) => window.__game?.scene.isActive(k), key, { timeout: 30000 });

await page.goto('file://' + file + '?sim=20');
await step('title screen loads', () => active('Title'));
await step('a new run reaches the map', async () => {
  await page.evaluate(() => window.__game.scene.getScene('Title').start());
  await active('Map');
});
await step('a fight starts and ends', async () => {
  // Walk into the nearest room with monsters and use each sibling's first skill.
  await page.evaluate(() => {
    const rooms = window.__map().rooms;
    const room = rooms.find((r) => r.type === 'combat');
    window.__game.scene.getScene('Map').toBattle({ kind: 'combat', roomId: room.id });
  });
  await active('Battle');
  await page.evaluate(() => {
    const iv = setInterval(() => {
      const b = window.__game.scene.getScene('Battle');
      if (!b.sys.isActive()) return clearInterval(iv);
      const u = b.active;
      if (b.over || !u || u.side !== 'hero' || !b.hotkeys?.length || b.targeting) return;
      const key = `${b.round}:${b.turnIdx}`;
      if (b.__smokeTurn === key) return;
      b.__smokeTurn = key;
      b.hotkeys[0]();
      if (b.targeting) b.onUnitClick(b.targeting.valid[0]);
    }, 20);
  });
  await page.waitForFunction(() => window.__game.scene.getScene('Battle').over, null, { timeout: 60000 });
});
await step('leaderboard opens', async () => {
  await page.evaluate(() => {
    const g = window.__game;
    g.scene.getScenes(true).forEach((s) => { if (s.sys.settings.key !== 'Hud') g.scene.stop(s.sys.settings.key); });
    g.scene.start('Title');
  });
  await active('Title');
  await page.evaluate(() => {
    const t = window.__game.scene.getScene('Title');
    t.scene.pause();
    t.scene.launch('Leaderboard', { from: 'Title' });
  });
  await active('Leaderboard');
  await page.waitForTimeout(500);
});

await browser.close();
if (errors.length) fail(`page errors:\n${[...new Set(errors)].slice(0, 5).join('\n---\n')}`);
console.log(process.exitCode ? 'Smoke test failed.' : 'Smoke test passed.');
