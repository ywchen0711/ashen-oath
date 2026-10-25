// Sound and music, made in the browser. The music is a little sequencer: a bass line, chords and a melody for
// each mood (the title's hymn, the story's quiet strings, the player phase march, the boss, the ending), played
// with soft synthesised instruments. Effects: the cursor tick, menus, steel on steel, a critical, a miss, a level up.
let ctx = null, master = null, musicGain = null, song = null, timer = 0;
const N = (n) => 440 * Math.pow(2, (n - 69) / 12);
const SONGS = {
  title: { bpm: 72, len: 16, chords: [[57, 60, 64], [53, 57, 60], [55, 59, 62], [52, 55, 59]], mel: [76, 0, 74, 72, 71, 0, 72, 74, 72, 0, 69, 0, 71, 72, 69, 0], wave: 'triangle', pad: 1 },
  story: { bpm: 66, len: 16, chords: [[50, 57, 62], [55, 59, 62], [52, 57, 60], [57, 61, 64]], mel: [69, 0, 0, 67, 66, 0, 64, 0, 66, 0, 67, 69, 67, 0, 0, 0], wave: 'sine', pad: 1 },
  battle: { bpm: 120, len: 16, chords: [[57, 60, 64], [55, 59, 62], [53, 57, 60], [52, 56, 59]], mel: [69, 72, 76, 74, 72, 71, 72, 69, 67, 71, 74, 72, 71, 69, 68, 64], wave: 'square', drums: 1 },
  boss: { bpm: 132, len: 16, chords: [[52, 55, 59], [53, 56, 60], [52, 55, 59], [50, 53, 57]], mel: [64, 0, 67, 64, 70, 0, 69, 67, 65, 0, 64, 62, 64, 0, 0, 59], wave: 'sawtooth', drums: 1 },
  ending: { bpm: 70, len: 16, chords: [[48, 55, 64], [53, 57, 64], [55, 59, 62], [48, 52, 60]], mel: [72, 0, 74, 76, 79, 0, 77, 76, 74, 0, 72, 74, 76, 0, 0, 0], wave: 'triangle', pad: 1 },
};
export const sound = {
  on: true,
  init() { if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; } try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; } master = ctx.createGain(); master.gain.value = 0.5; master.connect(ctx.destination); musicGain = ctx.createGain(); musicGain.gain.value = 0.22; musicGain.connect(master); if (song) this.music(song, true); },
  music(name, force) {
    if (song === name && !force) return; song = name; clearInterval(timer); if (!ctx) return;
    const S = SONGS[name] || SONGS.story, step = 60 / S.bpm / 2; let i = 0, t0 = ctx.currentTime + 0.1;
    const play = () => { if (!this.on) return; const now = ctx.currentTime; while (t0 < now + 0.4) { const ch = S.chords[Math.floor(i / 4) % S.chords.length], k = i % S.len, t = t0;
      if (i % 4 === 0) { tone(N(ch[0] - 12), step * 3.6, 'triangle', 0.32, t, musicGain); if (S.pad) for (const n of ch) tone(N(n), step * 4, 'sine', 0.06, t, musicGain); }
      if (!S.pad || i % 2 === 0) tone(N(ch[(i / (S.pad ? 2 : 1)) % 3 | 0] + 12), step * 0.9, S.pad ? 'sine' : 'triangle', 0.05, t, musicGain);
      if (S.mel[k]) tone(N(S.mel[k]), step * (S.pad ? 1.8 : 0.95), S.wave, S.wave === 'square' || S.wave === 'sawtooth' ? 0.05 : 0.11, t, musicGain);
      if (S.drums) { if (i % 4 === 0) kick(t); if (i % 4 === 2) snare(t); if (i % 2 === 1) hat(t); }
      i++; t0 += step; } };
    play(); timer = setInterval(play, 150);
  },
  play(name) {
    if (!ctx || !this.on) return; const t = ctx.currentTime;
    switch (name) {
      case 'tick': tone(1200, 0.03, 'square', 0.03, t); break;
      case 'select': tone(880, 0.06, 'square', 0.05, t); tone(1320, 0.06, 'square', 0.04, t + 0.05); break;
      case 'ok': tone(660, 0.08, 'triangle', 0.1, t); tone(990, 0.12, 'triangle', 0.1, t + 0.07); break;
      case 'walk': for (let k = 0; k < 3; k++) noise(0.03, 900, t + k * 0.09, 0.08); break;
      case 'hit': noise(0.12, 2400, t, 0.35); tone(140, 0.12, 'square', 0.15, t, null, 60); break;
      case 'crit': noise(0.25, 3000, t, 0.4); tone(220, 0.3, 'sawtooth', 0.2, t, null, 50); tone(1760, 0.2, 'square', 0.06, t); break;
      case 'miss': noise(0.18, 600, t, 0.15, 3000); break;
      case 'death': tone(330, 0.5, 'sawtooth', 0.12, t, null, 80); break;
      case 'heal': [784, 988, 1175, 1568].forEach((f, k) => tone(f, 0.25, 'sine', 0.08, t + k * 0.06)); break;
      case 'exp': tone(1046, 0.05, 'square', 0.03, t); break;
      case 'level': [523, 659, 784, 1046, 1318].forEach((f, k) => tone(f, 0.3, 'triangle', 0.12, t + k * 0.08)); break;
      case 'phase': [392, 523, 659].forEach((f, k) => tone(f, 0.4, 'triangle', 0.1, t + k * 0.08)); break;
      case 'win': [523, 659, 784, 1046].forEach((f, k) => tone(f, 0.6, 'triangle', 0.14, t + k * 0.12)); break;
      case 'coin': tone(1568, 0.08, 'sine', 0.1, t); tone(2093, 0.15, 'sine', 0.08, t + 0.06); break;
    }
  },
};
function tone(f, d, type, g0, t, dest, f1) { const o = ctx.createOscillator(), g = ctx.createGain(); o.type = type; o.frequency.setValueAtTime(f, t); if (f1) o.frequency.exponentialRampToValueAtTime(f1, t + d); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(g0, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + d); o.connect(g); g.connect(dest || master); o.start(t); o.stop(t + d + 0.05); }
let NB = null;
function noise(d, f, t, g0, f1) { if (!NB) { NB = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate); const a = NB.getChannelData(0); for (let i = 0; i < a.length; i++) a[i] = Math.random() * 2 - 1; } const s = ctx.createBufferSource(); s.buffer = NB; const fl = ctx.createBiquadFilter(); fl.type = 'bandpass'; fl.frequency.setValueAtTime(f, t); if (f1) fl.frequency.exponentialRampToValueAtTime(f1, t + d); const g = ctx.createGain(); g.gain.setValueAtTime(g0, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d); s.connect(fl); fl.connect(g); g.connect(master); s.start(t); s.stop(t + d + 0.05); }
const kick = (t) => tone(110, 0.15, 'sine', 0.35, t, musicGain, 40), snare = (t) => { const s = ctx.createBufferSource(); if (!NB) noise(0.01, 1000, t, 0.0001); s.buffer = NB; const g = ctx.createGain(); g.gain.setValueAtTime(0.12, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12); const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 1500; s.connect(f); f.connect(g); g.connect(musicGain); s.start(t); s.stop(t + 0.15); }, hat = (t) => { const s = ctx.createBufferSource(); if (!NB) return; s.buffer = NB; const g = ctx.createGain(); g.gain.setValueAtTime(0.04, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.04); const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 7000; s.connect(f); f.connect(g); g.connect(musicGain); s.start(t); s.stop(t + 0.05); };
