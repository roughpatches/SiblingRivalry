// Balance check: an autopilot plays full runs of the real game in headless
// Chromium (fast-forwarded with ?sim) and reports how runs go.
//
//   npm run build
//   node scripts/balance.mjs [runs=40] [parallel=4] [--no-perks] [--casual]
//
// Needs Playwright (npm i --no-save playwright). The autopilot plays like a
// sensible player: explores each floor before the boss, heals when hurt,
// buffs, focuses the weakest enemy, uses items when needed, equips better gear,
// buys potions, sends the best sibling to skill checks and picks random perks.
// It is a stand-in for real players, so treat its numbers as a guide. With
// --casual it plays like someone mashing buttons instead: a random ready skill
// on a random target, and potions only in emergencies. The two bracket real play.
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const RUNS = Number(args[0] || 40);
const PARALLEL = Number(args[1] || 4);
const NO_PERKS = process.argv.includes('--no-perks');
const CASUAL = process.argv.includes('--casual');
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

let chromium;
try { ({ chromium } = await import('playwright')); } catch {
  console.error('Playwright is not installed. Run: npm i --no-save playwright'); process.exit(1);
}

// ------------------------------------------------------------------ autopilot (runs in the page)
function autopilot({ runs, noPerks, casual, stuckMs }) {
  const g = window.__game;
  const results = (window.__results = []);
  const S = (k) => g.scene.getScene(k);
  let run = null, lastSig = '', lastChange = performance.now();

  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const party = () => window.__run().party;
  const partyHp = () => { const p = party(); return p.reduce((a, h) => a + Math.max(0, h.hp), 0); };

  function finishRun(result, extra = {}) {
    const r = window.__run();
    results.push({
      result, floor: r.floor, levels: r.party.map((h) => h.level), perks: r.party.map((h) => (h.perks || []).length),
      fights: r.stats.fights, gold: r.gold, battles: run.battles, bossHp: run.bossHp, ms: Math.round(performance.now() - run.t0), ...extra,
    });
    run = null;
  }

  // Score gear for auto-equip: signature items count double for their owner.
  const score = (h, it) => {
    const m = it.owner === h.id ? 2 : 1, s = it.stats;
    return m * ((s.atk || 0) * 2 + (s.def || 0) * 1.6 + (s.hp || 0) * 0.25 + (s.spd || 0) + (s.crit || 0) * 3);
  };
  function autoEquip() {
    const r = window.__run();
    for (const h of r.party) {
      for (const slot of ['weapon', 'trinket']) {
        const cur = h.equip[slot];
        const best = r.bag.filter((it) => it.kind === 'gear' && it.slot === slot).sort((a, b) => score(h, b) - score(h, a))[0];
        if (best && score(h, best) > (cur ? score(h, cur) : 0)) {
          r.bag.splice(r.bag.indexOf(best), 1);
          if (cur) r.bag.push(cur);
          h.equip[slot] = best;
        }
      }
    }
  }
  function shop(m) {
    const r = window.__run(), map = window.__map(), room = map.rooms[map.current];
    const potions = () => r.bag.filter((it) => it.kind === 'consumable').length;
    for (const it of [...(room.stock || [])].sort((a, b) => (a.kind === 'consumable' ? -1 : 1) - (b.kind === 'consumable' ? -1 : 1))) {
      const price = it.kind === 'gear' ? ({ common: 30, uncommon: 55, rare: 90, legendary: 150 }[it.rarity] ?? 30) + (r.floor - 1) * 10 : it.price;
      const want = it.kind === 'consumable' ? potions() < 7 : r.gold - price > 60;
      if (want && r.gold >= price && r.bag.length < 16) { r.bag.push(it); r.gold -= price; room.stock.splice(room.stock.indexOf(it), 1); }
    }
  }

  function mapTurn(m) {
    const map = window.__map();
    if (m.modalLayer && !m.modalLayer.used) {
      const labels = m.modalButtons.map((b) => b.label);
      const room = map.rooms[map.current];
      const pending = party().find((h) => h.perkOffer && h.perkPicks > 0);
      if (labels.includes('Descend')) { run.floorsEntered.push(window.__run().floor + 1); return m.modalButtons[labels.indexOf('Descend')].onClick(); }
      if (labels.includes('Leave') && room?.type === 'shop') { shop(m); return m.modalButtons[labels.indexOf('Leave')].onClick(); }
      if (pending && labels.length && !labels.includes('Nice')) {
        const i = Math.floor(Math.random() * labels.length);
        m.modalButtons[i].onClick();
        if (noPerks) for (const h of party()) h.perks = [];
        return;
      }
      return m.modalButtons[0].onClick();
    }
    if (m.busy) return;
    autoEquip();
    const reach = m.reachableRooms();
    const cur = map.rooms[map.current];
    const boss = map.rooms[map.bossId];
    if (cur.id === boss.id && boss.cleared) return m.stairsModal();
    const dist = (r) => (m.pathTo(r.id) || []).length || 99;
    const open = map.rooms.filter((r) => reach.has(r.id) && r.id !== cur.id && !r.visited && r.type !== 'boss');
    const hurt = party().reduce((a, h) => a + Math.max(0, h.hp), 0) / party().reduce((a, h) => a + window.__stats(h).maxHp, 0) < 0.5;
    const rest = open.filter((r) => m.displayType(r) === 'rest'); // only rest stops the player can see
    let next = hurt && rest.length ? rest.sort((a, b) => dist(a) - dist(b))[0] : open.sort((a, b) => dist(a) - dist(b))[0];
    if (!next) next = boss;
    if (!run.bossHp[window.__run().floor] && next === boss) run.bossHp[window.__run().floor] = Math.round(100 * party().reduce((a, h) => a + Math.max(0, h.hp), 0) / party().reduce((a, h) => a + window.__stats(h).maxHp, 0));
    m.travel(next);
  }

  function eventTurn(e) {
    if (e.__auto) return;
    e.__auto = true;
    const live = party().filter((h) => h.hp > 0);
    if (!live.length) return e.finish(null);
    if (e.mode === 'trivia') {
      const h = live.find((x) => x.id === 'andrew') || pick(live);
      // A family player knows maybe 60% of these; Andrew's hint halves the guessing.
      const p = h.id === 'andrew' ? 0.8 : 0.7;
      e.triviaAnswer(h, { right: Math.random() < p }, { a: ['(sim)'], correct: 0 });
      return e.finish(null);
    }
    const best = live.sort((a, b) => e.modFor(b) - e.modFor(a))[0];
    e.attempt(best).then(() => e.finish(null));
  }

  function battleTurn(b) {
    if (!b.__rec) {
      b.__rec = { floor: window.__run().floor, kind: b.kind, enemies: b.enemies().map((x) => x.id), startHp: partyHp(), level: party().reduce((a, h) => a + h.level, 0) / 4 };
      run.battles.push(b.__rec);
    }
    if (b.over) {
      if (!b.__closed) {
        b.__closed = true;
        b.__rec.won = b.liveHeroes().length > 0;
        b.__rec.rounds = b.round;
        b.__rec.endHp = b.heroes().reduce((a, h) => a + Math.max(0, h.hp), 0);
        b.__rec.maxHp = b.heroes().reduce((a, h) => a + h.max, 0);
        b.__rec.downed = b.heroes().filter((h) => !h.alive).map((h) => h.id);
      }
      b.input.keyboard?.emit('keydown-ENTER');
      return;
    }
    const u = b.active;
    if (!u || u.side !== 'hero' || !b.hotkeys?.length || b.targeting) return;
    const key = `${b.round}:${b.turnIdx}:${u.id}`;
    if (b.__turn === key) return;
    b.__turn = key;
    const act = decide(b, u);
    if (act.item) {
      b.chooseItem(u, act.item);
      if (b.targeting) b.onUnitClick(act.target);
    } else {
      b.chooseSkill(u, act.skill);
      if (b.targeting) b.onUnitClick(act.target && b.targeting.valid.includes(act.target) ? act.target : b.targeting.valid[0]);
    }
  }

  function decide(b, u) {
    const H = b.liveHeroes(), E = b.liveEnemies(), down = b.heroes().filter((h) => !h.alive);
    const ready = (id) => { const sk = u.def0.skills.find((s) => s.id === id); return sk && u.level >= sk.level && !(u.cds[sk.id] > 0) ? sk : null; };
    const low = H.filter((h) => h.hp < h.max * 0.45).sort((a, c) => a.hp / a.max - c.hp / c.max);
    const boss = E.some((e) => e.boss);
    const weakest = E.slice().sort((a, c) => a.hp - c.hp)[0];
    const biggest = E.slice().sort((a, c) => c.hp - a.hp)[0];
    const stephen = b.heroes().find((h) => h.id === 'stephen');
    const healerReady = stephen?.alive && (!(stephen.cds.receipt > 0) || (stephen.level >= 3 && !(stephen.cds.pharmacy > 0)));
    const bag = window.__run().bag.filter((it) => it.kind === 'consumable');
    const item = (effect) => bag.find((it) => it.effect === effect);
    const S = (id, target) => ({ skill: ready(id), target });

    if (casual) {
      if (u.hp < u.max * 0.2 && item('heal')) return { item: item('heal'), target: u };
      const options = u.def0.skills.map((s) => ready(s.id)).filter(Boolean);
      const sk = options[Math.floor(Math.random() * options.length)];
      return { skill: sk, target: sk.target === 'ally' ? H[Math.floor(Math.random() * H.length)] : E[Math.floor(Math.random() * E.length)] };
    }
    if (down.length && item('revive') && !healerReady) return { item: item('revive'), target: down[0] };
    if (u.hp < u.max * 0.3 && item('heal') && !healerReady) return { item: item('heal'), target: u };
    if (E.length >= 3 && item('bomb')) return { item: item('bomb') };

    switch (u.id) {
      case 'stephen':
        if ((down.length || low.length >= 2) && ready('pharmacy')) return S('pharmacy');
        if (low.length && ready('receipt')) return S('receipt', low[0]);
        if (E.length >= 2 && ready('precedent')) return S('precedent');
        return S('footnote', weakest);
      case 'tom':
        if ((boss || E.length >= 2) && !H.some((h) => h.shield > 0) && ready('bulwark')) return S('bulwark');
        if ((boss || E.length >= 2) && !E.every((e) => e.statuses.defDown) && ready('matrix')) return S('matrix');
        if (ready('numbers')) return S('numbers', boss ? biggest : weakest);
        return S('pivot', weakest);
      case 'andrew':
        if ((boss || low.length) && !u.statuses.taunt && u.hp > u.max * 0.5 && ready('objection')) return S('objection');
        if (!H.every((h) => h.statuses.atkUp) && ready('amendment')) return S('amendment');
        if (ready('order')) return S('order', biggest);
        return S('mallet', weakest);
      case 'chachi':
        if (!H.every((h) => h.statuses.spdUp) && ready('suitup')) return S('suitup');
        if ((boss || biggest.hp > 40) && ready('legendary')) return S('legendary', biggest);
        if (E.length >= 2 && ready('kick')) return S('kick');
        return S('pole', weakest);
    }
    return { skill: u.def0.skills[0], target: weakest };
  }

  function tick() {
    if (results.length >= runs) { clearInterval(iv); window.__done = true; return; }
    const keys = g.scene.getScenes(true).map((s) => s.scene.key).filter((k) => k !== 'Hud');
    const key = keys[0];
    // Stuck detection: nothing about the run changed for too long.
    const r = window.__run?.();
    const sig = [key, r?.floor, r && window.__map()?.current, r && r.party.map((h) => h.hp).join(','), r?.gold,
      key === 'Battle' ? S('Battle').liveEnemies().map((e) => e.hp).join(',') + S('Battle').round : ''].join('|');
    if (sig !== lastSig) { lastSig = sig; lastChange = performance.now(); }
    else if (run && performance.now() - lastChange > stuckMs) {
      finishRun('stuck', { stuckIn: key, modal: S('Map').modalButtons?.map((b) => b.label) });
      g.scene.getScenes(true).filter((s) => s.scene.key !== 'Hud').forEach((s) => g.scene.stop(s.scene.key));
      g.scene.start('Title');
      lastChange = performance.now();
      return;
    }
    try {
      if (key === 'Title') {
        const t = S('Title');
        if (!t.__auto) { t.__auto = true; run = { battles: [], floorsEntered: [1], bossHp: {}, t0: performance.now() }; t.start(); }
      } else if (key === 'Map') { if (run) mapTurn(S('Map')); }
      else if (key === 'Event') eventTurn(S('Event'));
      else if (key === 'Battle') battleTurn(S('Battle'));
      else if (key === 'End') {
        const e = S('End');
        if (!e.__auto) {
          e.__auto = true;
          finishRun(e.result === 'win' ? 'win' : 'lose');
          g.scene.stop('End');
          g.scene.start('Title');
        }
      }
    } catch (err) {
      window.__errors = (window.__errors || []).concat(String(err && err.stack || err));
    }
  }
  // Phaser reuses scene objects, so per-visit marks are cleared when a scene shuts down.
  for (const k of ['Title', 'Map', 'Event', 'Battle', 'End']) {
    S(k).events.on('shutdown', () => { const s = S(k); delete s.__auto; delete s.__rec; delete s.__closed; delete s.__turn; });
  }
  const iv = setInterval(tick, 10);
}

// ------------------------------------------------------------------ driver
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const perPage = Math.ceil(RUNS / PARALLEL);
const url = 'file://' + resolve(root, 'dist/index.html') + '?sim=30';
const t0 = Date.now();
const pages = await Promise.all(Array.from({ length: PARALLEL }, async (_, i) => {
  const ctx = await browser.newContext({ viewport: { width: 480, height: 270 } });
  const p = await ctx.newPage();
  const errors = [];
  p.on('pageerror', (e) => errors.push(e.stack || String(e)));
  await p.goto(url);
  await p.waitForFunction(() => window.__game && window.__game.scene.isActive('Title'), null, { timeout: 30000 });
  await p.evaluate(autopilot, { runs: Math.min(perPage, RUNS - i * perPage), noPerks: NO_PERKS, casual: CASUAL, stuckMs: 20000 });
  return { p, errors };
}));
const all = [];
const mvp = {};
await Promise.all(pages.map(async ({ p, errors }, i) => {
  await p.waitForFunction(() => window.__done, null, { timeout: 0, polling: 2000 });
  const res = await p.evaluate(() => window.__results);
  // Each finished run lands on this browser's local leaderboard, MVP included.
  const board = JSON.parse(await p.evaluate(() => localStorage.getItem('sibling-rivalry-board')) || '{}');
  for (const [id, n] of Object.entries(board.mvp || {})) mvp[id] = (mvp[id] || 0) + n;
  const errs = await p.evaluate(() => window.__errors || []);
  errors.push(...errs);
  all.push(...res.map((r) => ({ ...r, page: i })));
  if (errors.length) console.log(`page ${i} errors:\n` + [...new Set(errors)].slice(0, 5).join('\n---\n'));
}));
await browser.close();

// ------------------------------------------------------------------ report
const pct = (n, d) => (d ? `${Math.round((100 * n) / d)}%` : '-');
const avg = (a) => (a.length ? (a.reduce((x, y) => x + y, 0) / a.length) : 0);
const wins = all.filter((r) => r.result === 'win').length;
const stuck = all.filter((r) => r.result === 'stuck');
console.log(`\n${all.length} runs in ${Math.round((Date.now() - t0) / 1000)}s${NO_PERKS ? ' (perks disabled)' : ''}${CASUAL ? ' (casual player)' : ''}`);
console.log(`Wins: ${wins} (${pct(wins, all.length)})   Losses: ${all.filter((r) => r.result === 'lose').length}   Stuck: ${stuck.length}`);
for (const f of [1, 2, 3, 4]) {
  const reached = all.filter((r) => r.floor >= f).length;
  const died = all.filter((r) => r.result === 'lose' && r.floor === f);
  const bossDeaths = died.filter((r) => r.battles.at(-1)?.kind === 'boss').length;
  const lv = all.map((r) => r.battles.find((b) => b.floor === f)).filter(Boolean);
  const bossB = all.flatMap((r) => r.battles.filter((b) => b.floor === f && b.kind === 'boss'));
  const bossHp = all.map((r) => r.bossHp?.[f]).filter((x) => x != null);
  console.log(`Floor ${f}: reached ${pct(reached, all.length)} | died here ${died.length} (boss ${bossDeaths}) | boss won ${bossB.filter((b) => b.won).length}/${bossB.length} | party HP entering boss ${Math.round(avg(bossHp))}% | avg level at boss ${avg(bossB.map((b) => b.level)).toFixed(1)} | boss rounds ${avg(bossB.map((b) => b.rounds || 0)).toFixed(1)}`);
}
const levels = all.map((r) => avg(r.levels));
console.log(`Final level avg ${avg(levels).toFixed(1)} | perks per sibling avg ${avg(all.map((r) => avg(r.perks))).toFixed(1)} | fights won avg ${avg(all.map((r) => r.fights)).toFixed(1)}`);
console.log('Run MVPs:', Object.entries(mvp).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(', ') || 'none');
const killers = {};
for (const r of all.filter((x) => x.result === 'lose')) { const b = r.battles.at(-1); const k = `F${b.floor} ${b.kind}: ${b.enemies.join(', ')}`; killers[k] = (killers[k] || 0) + 1; }
console.log('Fatal fights:', Object.entries(killers).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k, v]) => `${v}x ${k}`).join(' | ') || 'none');
const hpLoss = {};
for (const b of all.flatMap((r) => r.battles).filter((x) => x.won && x.kind === 'combat')) {
  for (const id of b.enemies) { (hpLoss[id] ||= []).push((b.startHp - b.endHp) / b.maxHp / b.enemies.length); }
}
console.log('Avg party HP lost per enemy (normal fights):', Object.entries(hpLoss).map(([k, v]) => [k, avg(v)]).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${Math.round(v * 100)}%`).join(', '));
if (stuck.length) console.log('Stuck in:', stuck.map((s) => `${s.stuckIn}${s.modal ? ' ' + JSON.stringify(s.modal) : ''}`).join('; '));
const fs = await import('node:fs');
fs.writeFileSync(resolve(root, 'dist/balance-results.json'), JSON.stringify(all, null, 1));
console.log('Raw results: dist/balance-results.json');
