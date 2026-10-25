// The battle scene: when two units fight, the map dims and they face each other side-on on a strip of their
// ground — yours on the right. Each strike plays out: the lunge, the arrow, the spell; a flash and a shudder on a
// hit, a hop back on a miss, a white burst and 必殺 for a critical; HP bars drain; the fallen fade away.
import { ITEMS } from './data/items.js';
import { CLASSES } from './data/classes.js';
import { CAST } from './data/cast.js';
import { TEAM } from './tiles.js';
import { terrainAt } from './data/terrain.js';

const LOOKW = { sword: 'sword', rapier: 'sword', katana: 'sword', dagger: 'sword', lance: 'lance', halberd: 'lance', axe: 'axe', bow: 'bow', tome: 'tome', staff: 'staff', fan: 'tome', lute: 'none' };
// a side-on fighter, 40×40 pixels, facing right. pose: idle | wind | strike | cast | shoot | hit | dodge
function figure(u, pose) {
  const c = document.createElement('canvas'); c.width = c.height = 40; const g = c.getContext('2d'), P = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
  const k = CLASSES[u.cls], look = k.look, T = TEAM[u.side] || TEAM.player, hc = u.hair || (u.id && CAST[u.id] && CAST[u.id].p.hc) || '#5a3a24', skin = (u.id && CAST[u.id] && CAST[u.id].p.skin) || '#f0c8a0', ink = '#1a1420';
  const wid = u._wid || (u.items[0] && u.items[0].id), w = wid ? ITEMS[wid] : null, wt = w ? w.type : 'none';
  const mounted = ['cav', 'paladin', 'gk', 'ranger', 'valkyrie', 'darkknight', 'inquisitor'].includes(look) ? 'horse' : ['gull', 'gulllord', 'storm'].includes(look) ? 'gull' : ['wyvern', 'wyvernlord'].includes(look) ? 'wyvern' : ['wolf', 'wolfking'].includes(look) ? 'wolf' : null;
  const armor = ['knight', 'general', 'gk', 'regent'].includes(look), robe = ['mage', 'cleric', 'monk', 'shaman', 'sage', 'bishop', 'druid', 'saint', 'strategist', 'archbishop', 'princess', 'queen', 'valkyrie', 'storm'].includes(look);
  let ox = 14, oy = 10; const lean = pose === 'strike' ? 3 : pose === 'wind' ? -2 : pose === 'hit' ? -3 : pose === 'dodge' ? -5 : 0;
  if (mounted) {
    const M = mounted === 'horse' ? ['#8a5a32', '#6a4222', '#a87442'] : mounted === 'gull' ? ['#f0f0f4', '#c0c4cc', '#ffffff'] : mounted === 'wyvern' ? ['#5a7a5a', '#3a5a3a', '#7a9a6a'] : ['#a8b0b8', '#7a8088', '#d8dce0'];
    const run = pose === 'strike' ? 1 : 0;
    if (mounted === 'gull' || mounted === 'wyvern') { P(6, 24, 22, 7, M[0]); P(26, 20, 7, 6, M[0]); P(33, 22, 4, 2, mounted === 'gull' ? '#f0a020' : M[1]); P(30, 21, 1, 1, ink); P(4, 12 - run * 4, 16, 8, M[1]); P(2, 10 - run * 5, 10, 3, M[2]); P(2, 27, 6, 3, M[1]); if (mounted === 'wyvern') { P(10, 31, 3, 6, M[1]); P(20, 31, 3, 6, M[1]); } }
    else { P(6, 24, 24, 8, M[0]); P(6, 24, 24, 2, M[2]); P(28, 17 + (mounted === 'wolf' ? 4 : 0), 6, 10, M[0]); P(32, 18 + (mounted === 'wolf' ? 4 : 0), 5, 4, M[1]); P(29, 15 + (mounted === 'wolf' ? 4 : 0), 2, 3, M[1]); for (const [lx, ph] of [[8, 0], [12, 1], [23, 0], [27, 1]]) P(lx, 32, 3, 7 - ((ph + run) % 2) * 2, M[1]); P(3, 24, 4, mounted === 'wolf' ? 4 : 9, M[1]); }
    oy = 4; ox = 15;
  }
  ox += lean;
  // legs
  if (!mounted) { P(ox + 1, oy + 20, 3, 9, armor ? T[1] : '#4a3a30'); P(ox + 6, oy + 20, 3, 9, armor ? T[1] : '#3a2a22'); P(ox, oy + 28, 4, 2, ink); P(ox + 6, oy + 28, 5, 2, ink); if (robe) { P(ox - 1, oy + 12, 12, 16, T[1]); P(ox - 1, oy + 27, 12, 1, T[2]); } }
  // body
  P(ox, oy + 9, 10, 12, armor ? '#a8a8b4' : T[0]); P(ox, oy + 9, 10, 2, T[2]); if (armor) { P(ox + 1, oy + 12, 8, 3, '#d8d8e0'); P(ox, oy + 19, 10, 2, T[1]); }
  if (['merc', 'hero', 'oath', 'paladin', 'sage', 'sniper', 'general', 'darkknight', 'queen', 'regent', 'archbishop', 'wolfking', 'gulllord', 'wyvernlord', 'rogue', 'druid', 'inquisitor'].includes(look)) P(ox - 4, oy + 9, 4, 13, T[1]);
  // head
  const hx = ox + 1, hy = oy;
  P(hx, hy + 2, 8, 7, skin); P(hx + 6, hy + 4, 1, 2, ink); P(hx + 8, hy + 5, 1, 1, skin);
  if (armor || ['soldier', 'wyvern', 'warrior', 'halberd', 'darkknight'].includes(look)) { P(hx - 1, hy, 10, 5, '#b8b8c4'); P(hx - 1, hy, 10, 1, '#e0e0e8'); P(hx + 5, hy + 4, 4, 1, ink); }
  else { P(hx - 1, hy, 10, 3, hc); P(hx - 1, hy, 3, 7, hc); if (['princess', 'queen', 'saint', 'strategist'].includes(look)) P(hx - 2, hy + 2, 3, 10, hc); if (['mage'].includes(look)) { P(hx - 2, hy, 12, 2, T[1]); P(hx, hy - 4, 6, 4, T[1]); } if (['cleric', 'shaman', 'thief', 'assassin', 'druid', 'sniper'].includes(look)) { P(hx - 1, hy - 1, 10, 4, T[1]); P(hx - 1, hy, 3, 9, T[1]); } if (['bishop', 'archbishop'].includes(look)) { P(hx + 1, hy - 5, 6, 5, '#f0ece4'); P(hx + 3, hy - 4, 2, 4, '#d8a840'); } if (look === 'saint') { P(hx - 1, hy - 1, 10, 3, '#f4f0ec'); P(hx - 2, hy, 3, 12, '#f4f0ec'); } }
  // arms and the weapon
  const ax = ox + 4, ay = oy + 11, wpose = pose;
  const arm = (x1, y1) => { g.strokeStyle = armor ? '#9a9aa8' : T[1]; g.lineWidth = 3; g.beginPath(); g.moveTo(ax, ay); g.lineTo(x1, y1); g.stroke(); P(x1 - 1, y1 - 1, 3, 3, skin); };
  const WT = LOOKW[w ? ({ sword: 'sword', lance: 'lance', axe: 'axe', bow: 'bow', anima: 'tome', light: 'tome', dark: 'tome', staff: 'staff' }[wt]) : 'none'] || 'none';
  if (WT === 'sword') { const [hx2, hy2] = wpose === 'wind' ? [ax - 2, ay - 8] : wpose === 'strike' ? [ax + 9, ay + 1] : [ax + 5, ay + 4]; arm(hx2, hy2); g.strokeStyle = '#e8ecf4'; g.lineWidth = 2; g.beginPath(); const a = wpose === 'wind' ? -2.2 : wpose === 'strike' ? 0.2 : -1.1; g.moveTo(hx2, hy2); g.lineTo(hx2 + Math.cos(a) * 14, hy2 + Math.sin(a) * 14); g.stroke(); P(hx2 - 1, hy2 - 1, 3, 2, '#c8a040'); }
  if (WT === 'lance') { const [hx2, hy2] = wpose === 'strike' ? [ax + 10, ay] : wpose === 'wind' ? [ax - 3, ay - 1] : [ax + 4, ay + 2]; arm(hx2, hy2); g.strokeStyle = '#8a6a4a'; g.lineWidth = 2; g.beginPath(); g.moveTo(hx2 - 14, hy2 + 2); g.lineTo(hx2 + 12, hy2 - 2); g.stroke(); P(hx2 + 11, hy2 - 4, 5, 3, '#e0e4ec'); }
  if (WT === 'axe') { const [hx2, hy2] = wpose === 'wind' ? [ax - 1, ay - 9] : wpose === 'strike' ? [ax + 9, ay + 4] : [ax + 5, ay + 3]; arm(hx2, hy2); const a = wpose === 'wind' ? -2.0 : wpose === 'strike' ? 0.6 : -1.2; g.strokeStyle = '#8a6a4a'; g.lineWidth = 2; g.beginPath(); g.moveTo(hx2, hy2); const ex = hx2 + Math.cos(a) * 11, ey = hy2 + Math.sin(a) * 11; g.lineTo(ex, ey); g.stroke(); P(ex - 2, ey - 3, 5, 6, '#c8c8d0'); }
  if (WT === 'bow') { arm(ax + 8, ay); g.strokeStyle = '#8a5a2a'; g.lineWidth = 2; g.beginPath(); g.arc(ax + 6, ay, 9, -1.2, 1.2); g.stroke(); g.strokeStyle = '#e8e0d0'; g.lineWidth = 1; g.beginPath(); g.moveTo(ax + 9.5, ay - 8.5); g.lineTo(wpose === 'wind' || wpose === 'shoot' ? ax - 2 : ax + 3, ay); g.lineTo(ax + 9.5, ay + 8.5); g.stroke(); }
  if (WT === 'tome') { arm(wpose === 'cast' ? ax + 9 : ax + 5, wpose === 'cast' ? ay - 4 : ay + 3); P(ax + 3, ay + 3, 5, 6, w && w.type === 'dark' ? '#5a2a6a' : w && w.type === 'light' ? '#e8e0b0' : '#c83a3a'); }
  if (WT === 'staff') { const [hx2, hy2] = wpose === 'cast' ? [ax + 7, ay - 6] : [ax + 5, ay + 2]; arm(hx2, hy2); g.strokeStyle = '#c8a060'; g.lineWidth = 2; g.beginPath(); g.moveTo(hx2, hy2 + 10); g.lineTo(hx2 + 2, hy2 - 10); g.stroke(); P(hx2, hy2 - 13, 5, 4, '#f0e8a0'); }
  if (WT === 'none') arm(ax + 5, ay + 4);
  // outline
  const img = g.getImageData(0, 0, 40, 40), d = img.data, out = g.createImageData(40, 40), o = out.data;
  for (let y = 0; y < 40; y++) for (let x = 0; x < 40; x++) { const kk = (y * 40 + x) * 4; if (d[kk + 3] > 160) continue; if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => { const X = x + a, Y = y + b; return X >= 0 && Y >= 0 && X < 40 && Y < 40 && d[(Y * 40 + X) * 4 + 3] > 160; })) { o[kk] = 26; o[kk + 1] = 20; o[kk + 2] = 32; o[kk + 3] = 255; } }
  const oc = document.createElement('canvas'); oc.width = oc.height = 40; const og = oc.getContext('2d'); og.putImageData(out, 0, 0); og.drawImage(c, 0, 0); return oc;
}
const GROUND = { 平原: ['#8ac0e8', '#7ab050'], 草地: ['#8ac0e8', '#7ab050'], 道路: ['#9ac8e8', '#c8b078'], 森林: ['#6a9a6a', '#3a6a2a'], 山地: ['#a8b8c8', '#8a7a6a'], 丘陵: ['#9ac0d8', '#6a9a4a'], 砦: ['#8a9ab0', '#8a8a90'], 王座: ['#3a2a4a', '#8a2a3a'], 城門: ['#5a5a6a', '#6a6a72'], 石地: ['#3a3a48', '#8a8070'], 雪原: ['#c8d8e8', '#f0f4f8'], 沙地: ['#e8c890', '#e0c888'], 村莊: ['#9ac8e8', '#c8a868'], 橋: ['#7ab0e0', '#a8784a'], 甲板: ['#7a9ac0', '#a8784a'], 蘆葦: ['#9aa890', '#6a8a4a'] };
export class BattleFX {
  constructor() { this.cv = document.createElement('canvas'); this.cv.id = 'fx'; this.cv.hidden = true; document.body.appendChild(this.cv); this.g = this.cv.getContext('2d'); }
  async play(B, att, def, res, opts = {}) {
    const cv = this.cv, g = this.g, dpr = Math.min(2, devicePixelRatio || 1); cv.width = innerWidth * dpr; cv.height = innerHeight * dpr; cv.hidden = false;
    att._wid = res.wA; def._wid = res.wB;
    const W = innerWidth, Hh = innerHeight, S = Math.min(W / 960, Hh / 600), right = att.side === 'player' || (def.side !== 'player' && att.side === 'ally') ? att : def, left = right === att ? def : att;
    const ter = terrainAt(B.F.tile(def.x, def.y)), [skyC, groundC] = GROUND[ter.name] || ['#8ac0e8', '#7ab050'];
    const st = { [att.uid]: { hp: res.hp0A ?? null }, [def.uid]: {} };
    // recover the HP each side had before, from the strikes
    const hpA = res.hp0 ? res.hp0.A : att.hp, hpB = res.hp0 ? res.hp0.B : def.hp;
    const hp = { [att.uid]: hpA, [def.uid]: hpB }, shown = { [att.uid]: hpA, [def.uid]: hpB };
    const fig = { [att.uid]: { pose: 'idle', dx: 0, alpha: 1, flash: 0 }, [def.uid]: { pose: 'idle', dx: 0, alpha: 1, flash: 0 } };
    let popups = [], flash = 0, shakeT = 0, proj = null, banner = '';
    const range = Math.abs(att.x - def.x) + Math.abs(att.y - def.y);
    const draw = () => {
      g.setTransform(dpr, 0, 0, dpr, 0, 0); g.fillStyle = 'rgba(0,0,0,0.55)'; g.fillRect(0, 0, W, Hh);
      g.save(); g.translate(W / 2 + (shakeT > 0 ? (Math.random() - 0.5) * 14 * shakeT : 0), Hh / 2 - 40 * S); g.scale(S, S);
      // the arena
      const gr = g.createLinearGradient(0, -230, 0, 180); gr.addColorStop(0, skyC); gr.addColorStop(0.62, shadeC(skyC, 1.2)); gr.addColorStop(0.63, groundC); gr.addColorStop(1, shadeC(groundC, 0.6)); g.fillStyle = gr; g.fillRect(-460, -230, 920, 410); g.strokeStyle = '#e8d8a0'; g.lineWidth = 4; g.strokeRect(-460, -230, 920, 410);
      g.fillStyle = 'rgba(0,0,0,0.25)'; for (const sx of [-1, 1]) { g.beginPath(); g.ellipse(sx * 170, 124, 110, 16, 0, 0, 7); g.fill(); }
      g.imageSmoothingEnabled = false;
      for (const u of [left, right]) { const F2 = fig[u.uid], sd = u === right ? 1 : -1; if (F2.alpha <= 0) continue; const img = figure(u, F2.pose); g.save(); g.globalAlpha = F2.alpha; g.translate(sd * 170 - sd * F2.dx, 130); g.scale(-sd * 6, 6); g.drawImage(img, -20, -40); if (F2.flash > 0) { g.globalCompositeOperation = 'lighter'; g.globalAlpha = F2.flash; g.drawImage(img, -20, -40); } g.restore(); }
      if (proj) { g.fillStyle = proj.col; g.shadowColor = proj.col; g.shadowBlur = 20; g.beginPath(); g.arc(proj.x, proj.y, proj.r, 0, 7); g.fill(); g.shadowBlur = 0; }
      for (const p of popups) { g.font = `bold ${p.big ? 64 : 46}px serif`; g.textAlign = 'center'; g.lineWidth = 6; g.strokeStyle = '#000'; g.fillStyle = p.col; g.globalAlpha = Math.max(0, 1 - p.t / 1.2); g.strokeText(p.text, p.x, p.y - p.t * 60); g.fillText(p.text, p.x, p.y - p.t * 60); g.globalAlpha = 1; }
      if (banner) { g.font = 'bold 54px serif'; g.textAlign = 'center'; g.lineWidth = 8; g.strokeStyle = '#3a0a0a'; g.fillStyle = '#ffe070'; g.strokeText(banner, 0, -150); g.fillText(banner, 0, -150); }
      // the bars: name, weapon, HP, and the numbers
      for (const u of [left, right]) { const sd = u === right ? 1 : -1, x0 = sd > 0 ? 20 : -460, f = res.f, N = u === att ? f.A : f.B;
        g.fillStyle = u.side === 'player' ? 'rgba(30,50,120,0.92)' : u.side === 'ally' ? 'rgba(30,90,40,0.92)' : 'rgba(120,30,30,0.92)'; g.fillRect(x0, 190, 440, 110); g.strokeStyle = '#e8d8a0'; g.lineWidth = 3; g.strokeRect(x0, 190, 440, 110);
        g.fillStyle = '#fff'; g.textAlign = 'left'; g.font = 'bold 28px "Noto Serif TC", serif'; g.fillText(u.name, x0 + 16, 226); g.font = '20px "Noto Serif TC", serif'; g.fillStyle = '#e8e0c8'; const wid = u === att ? res.wA : res.wB; g.fillText(wid ? ITEMS[wid].name : '—', x0 + 200, 224);
        g.font = '18px sans-serif'; g.fillStyle = '#c8d8ff'; g.fillText(N ? `威力 ${N.dmg}${N.eff ? '!' : ''}  命中 ${N.hit}  必殺 ${N.crit}` : '無法反擊', x0 + 16, 256);
        const v = shown[u.uid], m = u.stats.hp; g.fillStyle = '#fff'; g.font = 'bold 26px sans-serif'; g.fillText(Math.max(0, Math.round(v)), x0 + 16, 290); g.fillStyle = '#1a1a1a'; g.fillRect(x0 + 70, 272, 350, 16); g.fillStyle = v / m > 0.5 ? '#5ad85a' : v / m > 0.25 ? '#e8c840' : '#e84a3a'; g.fillRect(x0 + 70, 272, 350 * Math.max(0, v) / m, 16); }
      g.restore();
      if (flash > 0) { g.fillStyle = `rgba(255,255,255,${flash})`; g.fillRect(0, 0, W, Hh); }
    };
    let last = performance.now(), skip = false; const onKey = () => { skip = true; }; addEventListener('keydown', onKey); cv.addEventListener('pointerdown', onKey);
    const wait = (ms, step) => new Promise((resolve) => { const t0 = performance.now(); const loop = (now) => { const dt = Math.min(0.05, (now - last) / 1000); last = now; for (const p of popups) p.t += dt; popups = popups.filter((p) => p.t < 1.2); flash = Math.max(0, flash - dt * 3); shakeT = Math.max(0, shakeT - dt * 3); for (const u of [att, def]) { fig[u.uid].flash = Math.max(0, fig[u.uid].flash - dt * 4); shown[u.uid] += (hp[u.uid] - shown[u.uid]) * Math.min(1, dt * 8); } const k = Math.min(1, (now - t0) / ms); if (step) step(k); draw(); if (k < 1 && !skip) requestAnimationFrame(loop); else resolve(); }; requestAnimationFrame(loop); });
    await wait(350);
    for (const s of res.strikes) {
      const u = s.side === 'A' ? att : def, o = u === att ? def : att, F2 = fig[u.uid], FO = fig[o.uid], w = ITEMS[(u === att ? res.wA : res.wB) || ''] || null, sdO = o === right ? 1 : -1;
      const ranged = w && (w.type === 'bow' || w.magic) && (range > 1 || w.type === 'bow');
      if (s.crit) { banner = '必殺！'; F2.pose = 'wind'; flash = 0.6; await wait(420); }
      if (!ranged) { F2.pose = 'wind'; await wait(180, (k) => { F2.dx = -k * 20; }); F2.pose = 'strike'; await wait(140, (k) => { F2.dx = -20 + k * 230; }); }
      else { F2.pose = w.type === 'bow' ? 'shoot' : 'cast'; await wait(220); const x0 = (u === right ? 1 : -1) * 120, x1 = sdO * 160; proj = { x: x0, y: 40, r: w.type === 'bow' ? 4 : 16, col: w.type === 'bow' ? '#e8e0c8' : w.type === 'dark' ? '#a04ad8' : w.type === 'light' ? '#fff8c0' : '#ff8a3a' }; await wait(240, (k) => { proj.x = x0 + (x1 - x0) * k; proj.y = 40 - Math.sin(k * Math.PI) * (w.type === 'bow' ? 30 : 10); }); proj = null; }
      if (s.hit) { hp[o.uid] = Math.max(0, hp[o.uid] - s.dmg); FO.flash = 1; FO.pose = 'hit'; shakeT = s.crit ? 1 : 0.5; popups.push({ text: s.dmg ? String(s.dmg) : '無效', x: sdO * 170, y: -40, col: s.crit ? '#ffd040' : '#ffffff', big: s.crit, t: 0 }); if (s.lethal) popups.push({ text: '致命', x: sdO * 170, y: -110, col: '#ff6a6a', t: 0 }); if (s.miracle) popups.push({ text: '奇蹟', x: sdO * 170, y: -110, col: '#a0e8ff', t: 0 }); opts.sound?.(s.crit ? 'crit' : 'hit'); }
      else { FO.pose = 'dodge'; popups.push({ text: 'MISS', x: sdO * 170, y: -40, col: '#a8c8ff', t: 0 }); opts.sound?.('miss'); await wait(200, (k) => { FO.dx = -Math.sin(k * Math.PI) * 50; }); }
      await wait(260, (k) => { if (!ranged) F2.dx = 210 * (1 - k); });
      F2.pose = 'idle'; F2.dx = 0; FO.pose = 'idle'; FO.dx = 0; banner = '';
      if (hp[o.uid] <= 0) { opts.sound?.('death'); await wait(700, (k) => { FO.alpha = (1 - k) * (Math.floor(k * 12) % 2 ? 0.4 : 1); }); FO.alpha = 0; break; }
      if (s.broke) popups.push({ text: '武器損壞', x: (u === right ? 1 : -1) * 170, y: -120, col: '#ffb0a0', t: 0 });
      await wait(180);
    }
    await wait(450);
    removeEventListener('keydown', onKey); cv.removeEventListener('pointerdown', onKey); cv.hidden = true;
  }
}
function shadeC(hex, k) { const n = parseInt(hex.slice(1), 16), f = (v) => Math.max(0, Math.min(255, Math.round(k > 1 ? v + (255 - v) * (k - 1) : v * k))); return `rgb(${f((n >> 16) & 255)},${f((n >> 8) & 255)},${f(n & 255)})`; }
