// Seeded RNG (mulberry32) so a dungeon can be regenerated from its seed.
let s = (Date.now() ^ 0x9e3779b9) >>> 0;

export function rng() {
  s = (s + 0x6d2b79f5) >>> 0;
  let t = s;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
rng.seed = (n) => { s = n >>> 0; };
rng.state = () => s;
rng.int = (a, b) => a + Math.floor(rng() * (b - a + 1));
rng.pick = (arr) => arr[Math.floor(rng() * arr.length)];
rng.shuffle = (arr) => {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
export const d20 = () => rng.int(1, 20);
