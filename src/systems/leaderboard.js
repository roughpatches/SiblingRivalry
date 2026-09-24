// Family leaderboard. Every finished run is recorded twice:
// - on this device, in localStorage, so the board works anywhere;
// - in the published page's shared database when it has one, so everyone the
//   page is shared with sees each other's runs. Each player owns one document,
//   runs/<their id>, and only they can write it.
// Names are never stored: the page looks each player's name up when it draws.
import { G, heroTotals } from './state.js';
import { HEROES } from '../data/heroes.js';

const LOCAL_KEY = 'sibling-rivalry-board';
const RECENT = 20;
const HERO_IDS = HEROES.map((d) => d.id);

// Deeper is better; beating the Hydra beats dying to it on the same floor.
export const score = (e) => e.floor * 10 + (e.won ? 5 : 0);
const byScore = (a, b) => score(b) - score(a) || a.at - b.at;

// ------------------------------------------------------------------ connection
// Resolves {db, user, uid} inside the published page, or null anywhere else
// (local dev, a saved copy, a viewer who can't use the shared data).
let conn = null;
export function connect() {
  if (!conn) {
    conn = (async () => {
      const claude = window.claude;
      if (!claude?.use) return null;
      const [db, user] = await Promise.all([claude.use('db'), claude.use('user')]);
      if (!db || !user) return null;
      const uid = await user.id();
      return uid ? { db, user, uid } : null;
    })().catch(() => null);
  }
  return conn;
}

// ------------------------------------------------------------------ recording
// Each sibling's usual share of the work (damage dealt + healing done + half the
// hits soaked up), measured with scripts/balance.mjs. Chachi and Tom always deal
// the most damage, so the MVP is whoever beat their own usual output by the most:
// a big healing run from Stephen or a wall-like run from Andrew counts too.
const PAR = { chachi: 1, tom: 0.8, stephen: 0.64, andrew: 0.38 };

export function runMvp() {
  let best = null, bestPts = 0;
  for (const id of HERO_IDS) {
    const t = heroTotals(id);
    const pts = (t.dealt + t.healed + t.taken / 2) / (PAR[id] || 1);
    if (pts > bestPts) { best = id; bestPts = pts; }
  }
  return best;
}

function entryForRun(won) {
  const run = G.run;
  if (!run.id) run.id = 'r' + Date.now().toString(36);
  if (won) run.won = true;
  return {
    id: run.id,
    won: !!run.won,
    floor: run.floor,
    level: Math.max(...run.party.map((h) => h.level)),
    fights: run.stats.fights,
    mvp: runMvp(),
    at: Date.now(),
  };
}

function emptyDoc() {
  return { v: 1, played: 0, wins: 0, mvp: {}, best: null, recent: [] };
}

// Adds (or, for a run that kept descending, replaces) one run in a player's record.
function applyEntry(doc, entry) {
  const prev = doc.recent.find((e) => e.id === entry.id) || (doc.best?.id === entry.id ? doc.best : null);
  if (prev) {
    doc.played -= 1;
    if (prev.won) doc.wins -= 1;
    if (prev.mvp) doc.mvp[prev.mvp] = Math.max(0, (doc.mvp[prev.mvp] || 0) - 1);
  }
  doc.played += 1;
  if (entry.won) doc.wins += 1;
  if (entry.mvp) doc.mvp[entry.mvp] = (doc.mvp[entry.mvp] || 0) + 1;
  doc.recent = [entry, ...doc.recent.filter((e) => e.id !== entry.id)].slice(0, RECENT);
  if (!doc.best || doc.best.id === entry.id || score(entry) > score(doc.best)) doc.best = entry;
  return doc;
}

// Records the finished run. Resolves {entry, personalBest, rank, family}
// (rank is 1-based among everyone's best runs, or null when offline).
export async function recordRun(won) {
  const entry = entryForRun(won);
  const local = applyEntry(readLocal(), entry);
  writeLocal(local);
  const out = { entry, personalBest: local.best?.id === entry.id, rank: null, family: false };

  const c = await connect();
  if (!c) return out;
  try {
    const ref = c.db.doc(`runs/${c.uid}`);
    const snap = await ref.get();
    const doc = applyEntry(snap.exists ? clean(snap.data()) : emptyDoc(), entry);
    await ref.set(doc);
    out.family = true;
    out.personalBest = doc.best?.id === entry.id;
    const board = await loadBoard();
    const i = board.runs.findIndex((r) => r.id === entry.id && r.uid === c.uid);
    out.rank = i >= 0 ? i + 1 : null;
  } catch {
    // A viewer who can only look (or a hiccup) still has the local record.
  }
  return out;
}

// ------------------------------------------------------------------ reading
// Resolves the board: {family, players:[{uid, name, isMe, played, wins, best}],
// runs:[entry + uid, name], mvp:{heroId: count}}.
export async function loadBoard() {
  const c = await connect();
  let players = [];
  let family = false;
  if (c) {
    try {
      const snap = await c.db.collection('runs').limit(200).get();
      players = snap.docs.map((d) => ({ uid: d.id, ...clean(d.data()) })).filter((p) => p.played > 0);
      family = true;
    } catch { /* fall back to this device */ }
  }
  if (family) {
    const ps = await c.user.profiles(players.map((p) => p.uid));
    for (const p of players) {
      p.isMe = p.uid === c.uid;
      p.name = ps[p.uid]?.name || 'Someone';
    }
  } else {
    const local = readLocal();
    players = local.played ? [{ uid: 'local', name: 'This device', isMe: true, ...local }] : [];
  }

  const runs = [];
  for (const p of players) {
    const seen = new Set();
    for (const e of [p.best, ...p.recent]) {
      if (!e || seen.has(e.id)) continue;
      seen.add(e.id);
      runs.push({ ...e, uid: p.uid, name: p.name, isMe: p.isMe });
    }
  }
  runs.sort(byScore);

  const mvp = Object.fromEntries(HERO_IDS.map((id) => [id, 0]));
  for (const p of players) for (const id of HERO_IDS) mvp[id] += p.mvp[id] || 0;

  players.sort((a, b) => (b.best ? score(b.best) : 0) - (a.best ? score(a.best) : 0) || b.played - a.played);
  return { family, players, runs, mvp };
}

// ------------------------------------------------------------------ storage
// Shared documents are written by other people's browsers, so everything read
// back is checked before it is drawn.
const num = (v) => (Number.isFinite(v) && v >= 0 ? Math.floor(v) : 0);

function cleanEntry(e) {
  if (!e || typeof e !== 'object' || typeof e.id !== 'string') return null;
  return {
    id: e.id.slice(0, 40),
    won: e.won === true,
    floor: Math.max(1, num(e.floor)),
    level: Math.max(1, num(e.level)),
    fights: num(e.fights),
    mvp: HERO_IDS.includes(e.mvp) ? e.mvp : null,
    at: num(e.at),
  };
}

function clean(d) {
  const doc = emptyDoc();
  if (!d || typeof d !== 'object') return doc;
  doc.played = num(d.played);
  doc.wins = num(d.wins);
  for (const id of HERO_IDS) if (d.mvp && d.mvp[id]) doc.mvp[id] = num(d.mvp[id]);
  doc.best = cleanEntry(d.best);
  doc.recent = (Array.isArray(d.recent) ? d.recent : []).map(cleanEntry).filter(Boolean).slice(0, RECENT);
  return doc;
}

function readLocal() {
  try {
    const raw = window.localStorage.getItem(LOCAL_KEY);
    return raw ? clean(JSON.parse(raw)) : emptyDoc();
  } catch {
    return emptyDoc();
  }
}

function writeLocal(doc) {
  try { window.localStorage.setItem(LOCAL_KEY, JSON.stringify(doc)); } catch { /* blocked */ }
}
