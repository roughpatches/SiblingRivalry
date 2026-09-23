// All sound is synthesized with the Web Audio API: no audio files, so the
// single-file build still works. Browsers only allow audio after the first
// click or key press; unlockAudio() is wired to that in main.js, and anything
// requested before then is simply silent.

let ctx = null, master = null, sfxBus = null, musicBus = null, noiseBuf = null;
let muted = readMuted();

function readMuted() {
  try { return window.localStorage.getItem('sibling-rivalry-muted') === '1'; } catch { return false; }
}

function audio() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 1;
    master.connect(ctx.destination);
    sfxBus = ctx.createGain();
    sfxBus.gain.value = 1;
    sfxBus.connect(master);
    // Music runs through a gentle low-pass so the square waves don't grate.
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 2600;
    lp.connect(master);
    musicBus = ctx.createGain();
    musicBus.gain.value = 0.32;
    musicBus.connect(lp);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  return ctx;
}

export function unlockAudio() {
  const c = audio();
  if (c && c.state === 'suspended') c.resume();
}

export const isMuted = () => muted;
// For testing from the console: the live context and master output.
export const soundDebug = () => ({ ctx, master, track: current });
export function toggleMute() {
  muted = !muted;
  try { window.localStorage.setItem('sibling-rivalry-muted', muted ? '1' : '0'); } catch { /* ignore */ }
  if (master) master.gain.setTargetAtTime(muted ? 0 : 1, ctx.currentTime, 0.02);
  return muted;
}

const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);

// One enveloped oscillator note. `to` slides the pitch; `at` is seconds from now (or absolute with abs).
function tone(freq, dur, { type = 'square', vol = 0.2, to, at = 0, abs, bus } = {}) {
  const c = audio();
  if (!c || c.state !== 'running') return;
  const t0 = abs ?? c.currentTime + at;
  const o = c.createOscillator(), g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t0);
  if (to) o.frequency.exponentialRampToValueAtTime(Math.max(20, to), t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(bus || sfxBus);
  o.start(t0);
  o.stop(t0 + dur + 0.02);
}

function noise(dur, { vol = 0.2, freq = 2000, at = 0 } = {}) {
  const c = audio();
  if (!c || c.state !== 'running') return;
  const t0 = c.currentTime + at;
  const src = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
  src.buffer = noiseBuf;
  f.type = 'bandpass';
  f.frequency.value = freq;
  g.gain.setValueAtTime(vol, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(f).connect(g).connect(sfxBus);
  src.start(t0);
  src.stop(t0 + dur + 0.02);
}

const arp = (notes, step, opts) => notes.forEach((n, i) => tone(midi(n), step * 1.6, { ...opts, at: i * step }));

const SFX = {
  click: () => tone(1320, 0.04, { vol: 0.08 }),
  step: () => noise(0.04, { vol: 0.06, freq: 900 }),
  hit: () => { noise(0.08, { vol: 0.25, freq: 1500 }); tone(190, 0.12, { to: 80, vol: 0.18 }); },
  crit: () => { noise(0.14, { vol: 0.3, freq: 2500 }); tone(220, 0.18, { to: 60, vol: 0.22 }); arp([84, 88], 0.05, { vol: 0.1 }); },
  miss: () => tone(520, 0.16, { type: 'triangle', to: 240, vol: 0.12 }),
  heal: () => arp([72, 76, 79, 84], 0.06, { type: 'triangle', vol: 0.14 }),
  buff: () => arp([69, 73, 76, 81], 0.05, { vol: 0.08 }),
  charge: () => tone(200, 0.6, { type: 'sawtooth', to: 700, vol: 0.07 }),
  boom: () => { noise(0.5, { vol: 0.35, freq: 400 }); tone(160, 0.5, { to: 40, vol: 0.25 }); },
  gavel: () => { noise(0.05, { vol: 0.35, freq: 700 }); tone(110, 0.2, { type: 'triangle', to: 70, vol: 0.3 }); },
  ko: () => tone(330, 0.45, { to: 70, vol: 0.16 }),
  enemyDown: () => { noise(0.18, { vol: 0.15, freq: 1200 }); tone(600, 0.25, { type: 'triangle', to: 120, vol: 0.12 }); },
  coin: () => { tone(988, 0.07, { vol: 0.1 }); tone(1319, 0.18, { vol: 0.1, at: 0.07 }); },
  dice: () => { for (let i = 0; i < 9; i++) noise(0.03, { vol: 0.12, freq: 3000 + Math.random() * 2000, at: i * 0.07 + Math.random() * 0.02 }); },
  success: () => arp([72, 79], 0.09, { vol: 0.12 }),
  fail: () => arp([67, 60], 0.12, { type: 'triangle', vol: 0.14 }),
  nat20: () => arp([72, 76, 79, 84, 88, 91], 0.05, { vol: 0.12 }),
  levelUp: () => arp([60, 64, 67, 72, 76, 79, 84], 0.06, { vol: 0.11 }),
  stairs: () => arp([79, 76, 72, 67, 64, 60], 0.06, { type: 'triangle', vol: 0.14 }),
  victory: () => { arp([72, 72, 72, 76], 0.1, { vol: 0.12 }); tone(midi(79), 0.5, { vol: 0.12, at: 0.45 }); tone(midi(67), 0.5, { type: 'triangle', vol: 0.12, at: 0.45 }); },
  defeat: () => { arp([67, 63, 60], 0.22, { type: 'triangle', vol: 0.16 }); tone(midi(48), 0.9, { type: 'triangle', vol: 0.16, at: 0.66 }); },
  fanfare: () => { arp([60, 64, 67, 72, 67, 72], 0.12, { vol: 0.12 }); tone(midi(76), 0.9, { vol: 0.12, at: 0.72 }); tone(midi(64), 0.9, { type: 'triangle', vol: 0.12, at: 0.72 }); },
};

export function sfx(name) {
  try { SFX[name]?.(); } catch { /* never let sound break the game */ }
}

// ------------------------------------------------------------------ music
// Each loop is a chord progression plus a bass style and an arpeggio style.
// Chords are [root midi note, 'maj' | 'min'].
const TRACKS = {
  title:    { bpm: 92,  per: 8, chords: [[48, 'min'], [44, 'maj'], [51, 'maj'], [46, 'maj']], bass: 'long',  lead: 'slow', wave: 'triangle' },
  basement: { bpm: 104, per: 8, chords: [[45, 'min'], [41, 'maj'], [43, 'maj'], [40, 'maj']], bass: 'pulse', lead: 'arp',  wave: 'square' },
  office:   { bpm: 126, per: 8, chords: [[41, 'maj'], [38, 'min'], [46, 'maj'], [48, 'maj']], bass: 'bounce', lead: 'arp', wave: 'square' },
  snow:     { bpm: 80,  per: 8, chords: [[38, 'maj'], [47, 'min'], [43, 'maj'], [45, 'maj']], bass: 'long',  lead: 'slow', wave: 'triangle', bell: true },
  dining:   { bpm: 116, per: 6, chords: [[43, 'maj'], [48, 'maj'], [50, 'maj'], [43, 'maj']], bass: 'waltz', lead: 'waltz', wave: 'triangle' },
  battle:   { bpm: 148, per: 8, chords: [[40, 'min'], [36, 'maj'], [38, 'maj'], [35, 'maj']], bass: 'drive', lead: 'arp',  wave: 'square' },
  boss:     { bpm: 160, per: 8, chords: [[36, 'min'], [36, 'min'], [44, 'maj'], [43, 'maj']], bass: 'drive', lead: 'arp',  wave: 'sawtooth' },
};

let current = null, stepIdx = 0, nextTime = 0, timer = null;

export function music(name) {
  if (current === name) return;
  current = name;
  stepIdx = 0;
  const c = audio();
  if (!c) return;
  nextTime = c.currentTime + 0.08;
  if (!timer) timer = setInterval(schedule, 30);
}

export function stopMusic() { current = null; }

function schedule() {
  const t = TRACKS[current];
  if (!t || !ctx || ctx.state !== 'running') { if (ctx) nextTime = Math.max(nextTime, ctx.currentTime + 0.05); return; }
  const dur = 60 / t.bpm / 2; // eighth notes
  while (nextTime < ctx.currentTime + 0.15) {
    playStep(t, stepIdx, nextTime, dur);
    nextTime += dur;
    stepIdx = (stepIdx + 1) % (t.per * t.chords.length);
  }
}

function playStep(t, i, at, dur) {
  const [root, q] = t.chords[Math.floor(i / t.per)];
  const s = i % t.per;
  const third = q === 'min' ? 3 : 4;
  const triad = [root + 24, root + 24 + third, root + 31, root + 36];
  const note = (n, len, opts) => tone(midi(n), len, { ...opts, abs: at, bus: musicBus });

  // bass
  if (t.bass === 'long' && s === 0) note(root, dur * t.per * 0.95, { type: 'triangle', vol: 0.32 });
  if (t.bass === 'pulse' && s % 2 === 0) note(root, dur * 1.6, { type: 'triangle', vol: 0.3 });
  if (t.bass === 'bounce') note(s % 2 ? root + 7 : root, dur * 0.9, { type: 'triangle', vol: 0.3 });
  if (t.bass === 'drive') note(s % 4 === 3 ? root + 12 : root, dur * 0.8, { type: 'triangle', vol: 0.34 });
  if (t.bass === 'waltz' && s % 3 === 0) note(root, dur * 2.5, { type: 'triangle', vol: 0.32 });

  // lead
  if (t.lead === 'arp') note(triad[s % 4], dur * 0.7, { type: t.wave, vol: 0.07 });
  if (t.lead === 'slow' && s % 2 === 0) note(triad[(s / 2) % 4], dur * 1.8, { type: t.wave, vol: 0.12 });
  if (t.lead === 'waltz' && s % 3) note(triad[1 + (s % 3)], dur * 0.9, { type: t.wave, vol: 0.1 });
  if (t.bell && s === 0) note(root + 48, dur * 3, { type: 'sine', vol: 0.08 });
}
