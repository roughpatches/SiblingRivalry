// Procedural floor generation: a branching tree of rooms on a grid, with a few loops.
import { rng } from './rng.js';
import { EVENTS } from '../data/events.js';

export const COLS = 7;
export const ROWS = 5;

const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

export function generateFloor(floor) {
  const target = Math.min(18, 13 + floor);
  let rooms, tries = 0;
  do { rooms = carve(target); tries++; } while (rooms.length < target && tries < 20);

  const byKey = new Map(rooms.map((r) => [`${r.x},${r.y}`, r]));
  // BFS distance from start
  const start = rooms[0];
  const dist = new Map([[start.id, 0]]);
  const q = [start];
  while (q.length) {
    const r = q.shift();
    for (const nid of r.links) {
      if (!dist.has(nid)) { dist.set(nid, dist.get(r.id) + 1); q.push(rooms[nid]); }
    }
  }
  rooms.forEach((r) => (r.dist = dist.get(r.id)));

  // Boss: farthest dead-end (ties -> farthest overall)
  const deadEnds = rooms.filter((r) => r.links.size === 1 && r !== start);
  const bossRoom = (deadEnds.length ? deadEnds : rooms.slice(1)).sort((a, b) => b.dist - a.dist)[0];
  bossRoom.type = 'boss';

  start.type = 'start';
  start.visited = true;
  start.cleared = true;

  const rest = rooms.filter((r) => !r.type);
  const plan = [];
  plan.push('rest', 'shop', 'treasure', 'treasure', 'event', 'event');
  if (rng() < 0.7) plan.push('trivia'); else plan.push('event');
  // Rest room should sit away from the start; put it among the deeper rooms.
  const deep = rest.filter((r) => r.dist >= 3 && r !== bossRoom);
  const restRoom = deep.length ? rng.pick(deep) : rng.pick(rest);
  restRoom.type = 'rest';
  plan.shift();
  const remaining = rng.shuffle(rest.filter((r) => !r.type));
  // Rooms adjacent to start should be combat or event, not treasure: keep the first steps interesting.
  remaining.sort((a, b) => (a.dist <= 1) - (b.dist <= 1));
  for (const r of remaining) {
    r.type = plan.length ? plan.shift() : 'combat';
  }
  // Make sure the start's neighbors include at least one combat room.
  const firsts = [...start.links].map((i) => rooms[i]);
  if (!firsts.some((r) => r.type === 'combat')) {
    const swap = rooms.find((r) => r.type === 'combat' && r.dist > 1);
    const f = firsts.find((r) => r.type !== 'boss');
    if (swap && f) { swap.type = f.type; f.type = 'combat'; }
  }

  // Assign event content
  const evs = rng.shuffle(EVENTS);
  rooms.filter((r) => r.type === 'event').forEach((r, i) => (r.eventId = evs[i % evs.length].id));

  const map = { floor, rooms, current: start.id, bossId: bossRoom.id, revealed: false, byKey };
  updateVisibility(map);
  return map;
}

function carve(target) {
  const rooms = [];
  const occupied = new Map();
  const add = (x, y, parent) => {
    const r = { id: rooms.length, x, y, type: null, links: new Set(), visited: false, seen: false, cleared: false };
    rooms.push(r);
    occupied.set(`${x},${y}`, r);
    if (parent) { r.links.add(parent.id); parent.links.add(r.id); }
    return r;
  };
  add(0, rng.int(1, ROWS - 2), null);
  let guard = 0;
  while (rooms.length < target && guard++ < 2000) {
    // Bias toward extending recent rooms so the map stretches rightward.
    const from = rng() < 0.6 ? rooms[Math.max(0, rooms.length - 1 - rng.int(0, 2))] : rng.pick(rooms);
    const [dx, dy] = rng() < 0.35 ? [1, 0] : rng.pick(DIRS);
    const x = from.x + dx, y = from.y + dy;
    if (x < 0 || y < 0 || x >= COLS || y >= ROWS || occupied.has(`${x},${y}`)) continue;
    // Keep it tree-like: new cell may touch at most one other room.
    const touching = DIRS.filter(([ax, ay]) => occupied.has(`${x + ax},${y + ay}`)).length;
    if (touching > 1) continue;
    if (from.links.size >= 3) continue;
    add(x, y, from);
  }
  // A couple of loops so it's not a pure tree
  for (const r of rooms) {
    for (const [dx, dy] of DIRS) {
      const n = occupied.get(`${r.x + dx},${r.y + dy}`);
      if (n && !r.links.has(n.id) && rng() < 0.08) { r.links.add(n.id); n.links.add(r.id); }
    }
  }
  return rooms;
}

// Visited rooms and their neighbors are seen. Room contents of neighbors are
// only identified when Chachi (the scout) is standing.
export function updateVisibility(map) {
  for (const r of map.rooms) {
    if (map.revealed) r.seen = true;
    if (r.visited) {
      r.seen = true;
      for (const nid of r.links) map.rooms[nid].seen = true;
    }
  }
}
