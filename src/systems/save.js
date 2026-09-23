// Save and continue. The run is written to this browser's localStorage whenever
// the map is drawn (after every room, level-up, shop visit or gear change), so a
// refresh mid-fight resumes just before that room. Finished runs delete the save.
import { G } from './state.js';
import { rng } from './rng.js';

const KEY = 'sibling-rivalry-save';
const VERSION = 1;

// Storage can be missing or throw (private windows, blocked site data), so every
// access is guarded and the game simply plays without saves in that case.
function store() {
  try { return window.localStorage; } catch { return null; }
}

export function saveRun() {
  const s = store();
  if (!s || !G.run) return;
  const run = {
    ...G.run,
    map: {
      ...G.run.map,
      byKey: undefined,
      rooms: G.run.map.rooms.map((r) => ({ ...r, links: [...r.links] })),
    },
  };
  try { s.setItem(KEY, JSON.stringify({ v: VERSION, rng: rng.state(), run })); } catch { /* full or blocked */ }
}

// Returns a short summary of the saved run for the title screen, or null.
export function savedRunInfo() {
  const data = read();
  return data ? { floor: data.run.floor, gold: data.run.gold } : null;
}

export function loadRun() {
  const data = read();
  if (!data) return false;
  const run = data.run;
  run.map.rooms.forEach((r) => { r.links = new Set(r.links); });
  run.map.byKey = new Map(run.map.rooms.map((r) => [`${r.x},${r.y}`, r]));
  G.run = run;
  rng.seed(data.rng);
  return true;
}

export function clearSave() {
  try { store()?.removeItem(KEY); } catch { /* ignore */ }
}

function read() {
  try {
    const raw = store()?.getItem(KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    return data && data.v === VERSION && data.run?.map?.rooms ? data : null;
  } catch {
    return null;
  }
}
