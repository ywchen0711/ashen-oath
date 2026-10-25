// The battle scene: when two units fight, the map dims and they face each other side-on on a strip of their
// ground — yours on the right. Each strike plays out: the lunge, the arrow, the spell; a flash and a shudder on a
// hit, a hop back on a miss, a white burst and 必殺 for a critical; HP bars drain; the fallen fade away.
import { ITEMS } from './data/items.js';
import { terrainAt } from './data/terrain.js';
import { fighter } from './fighters.js';
import { backdrop } from './bgs.js';

const GROUND = { 平原: ['#8ac0e8', '#7ab050'], 草地: ['#8ac0e8', '#7ab050'], 道路: ['#9ac8e8', '#c8b078'], 森林: ['#6a9a6a', '#3a6a2a'], 山地: ['#a8b8c8', '#8a7a6a'], 丘陵: ['#9ac0d8', '#6a9a4a'], 砦: ['#8a9ab0', '#8a8a90'], 王座: ['#3a2a4a', '#8a2a3a'], 城門: ['#5a5a6a', '#6a6a72'], 石地: ['#3a3a48', '#8a8070'], 雪原: ['#c8d8e8', '#f0f4f8'], 沙地: ['#e8c890', '#e0c888'], 村莊: ['#9ac8e8', '#c8a868'], 橋: ['#7ab0e0', '#a8784a'], 甲板: ['#7a9ac0', '#a8784a'], 蘆葦: ['#9aa890', '#6a8a4a'] };
// where the fight happens: the painted scene behind, and the ground the fighters stand on
const ARENA = { 平原: 'hills', 草地: 'hills', 丘陵: 'hills', 道路: 'hills', 花園: 'village', 樹籬: 'hills', 桃樹: 'village', 森林: 'forest', 山地: 'pass', 高山: 'pass', 懸崖: 'cliff', 砦: 'fort', 城牆: 'fort', 城門: 'fort', 高牆: 'fort', 柵欄: 'fort', 弩車: 'fort', 雪原: 'snow', 冰河: 'snow', 沙地: 'pass', 村莊: 'village', 民房: 'village', 武器店: 'town', 道具店: 'town', 廢村: 'home', 廢墟: 'home', 瓦礫: 'home', 墓碑: 'tomb', 橋: 'bridge', 河流: 'river', 淺灘: 'river', 海: 'sea', 甲板: 'sea', 蘆葦: 'marsh', 街壘: 'barricade', 營帳: 'camp', 舞台: 'theater', 聖火: 'ember' };
const FLOOR = { hills: '#78a850', village: '#8ab060', forest: '#4a7034', pass: '#b09070', cliff: '#7aa050', fort: '#9a968c', snow: '#eef2f8', town: '#a89480', home: '#6a6050', tomb: '#4a4c40', bridge: '#8a6a4a', river: '#6a7a5a', sea: '#9a7048', marsh: '#5a7040', barricade: '#4a3a30', camp: '#4a3a2a', theater: '#8a5a30', ember: '#4a2a1a' };
export class BattleFX {
  constructor() { this.cv = document.createElement('canvas'); this.cv.id = 'fx'; this.cv.hidden = true; document.body.appendChild(this.cv); this.g = this.cv.getContext('2d'); }
  async play(B, att, def, res, opts = {}) {
    const cv = this.cv, g = this.g, dpr = Math.min(2, devicePixelRatio || 1); cv.width = innerWidth * dpr; cv.height = innerHeight * dpr; cv.hidden = false;
    att._wid = res.wA; def._wid = res.wB;
    const W = innerWidth, Hh = innerHeight, S = Math.min(W / 960, Hh / 600), right = att.side === 'player' || (def.side !== 'player' && att.side === 'ally') ? att : def, left = right === att ? def : att;
    const ter = terrainAt(B.F.tile(def.x, def.y)), [skyC, groundC] = GROUND[ter.name] || ['#8ac0e8', '#7ab050'], scene = ARENA[ter.name] || (ter.indoor && B.ch && B.ch.bg) || (ter.indoor ? 'palace' : 'hills'), bd = backdrop(scene), floorC = FLOOR[scene] || (ter.indoor ? '#7a7068' : groundC);
    let slashes = [];
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
      g.save(); g.beginPath(); g.rect(-460, -230, 920, 410); g.clip(); g.drawImage(bd, -460, -300, 920, 518); const dim = g.createLinearGradient(0, -230, 0, 180); dim.addColorStop(0, 'rgba(0,0,0,0.05)'); dim.addColorStop(0.7, 'rgba(0,0,0,0.25)'); dim.addColorStop(1, 'rgba(0,0,0,0.55)'); g.fillStyle = dim; g.fillRect(-460, -230, 920, 410);
      // two platforms of ground, as the old battle screens had: a lit top with some texture, a darker front
      for (const sx of [-1, 1]) { const cx = sx * 175; g.fillStyle = shadeC(floorC, 0.5); g.beginPath(); g.ellipse(cx, 140, 168, 30, 0, 0, Math.PI); g.lineTo(cx - 168, 126); g.ellipse(cx, 126, 168, 30, 0, Math.PI, 0, true); g.fill(); const tg = g.createLinearGradient(0, 96, 0, 156); tg.addColorStop(0, shadeC(floorC, 1.15)); tg.addColorStop(1, shadeC(floorC, 0.85)); g.fillStyle = tg; g.beginPath(); g.ellipse(cx, 126, 168, 30, 0, 0, 7); g.fill(); g.save(); g.beginPath(); g.ellipse(cx, 126, 168, 30, 0, 0, 7); g.clip(); for (let k = 0; k < 70; k++) { const a = (k * 2.399) % 6.283, r = ((k * 37) % 100) / 100; g.fillStyle = k % 3 ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.14)'; g.fillRect(cx + Math.cos(a) * r * 160, 126 + Math.sin(a) * r * 26, 6 - r * 3, 2); } g.restore(); g.strokeStyle = 'rgba(255,255,255,0.25)'; g.lineWidth = 2; g.beginPath(); g.ellipse(cx, 126, 166, 29, 0, Math.PI * 1.1, Math.PI * 1.9); g.stroke(); }
      g.restore(); g.strokeStyle = '#e8d8a0'; g.lineWidth = 4; g.strokeRect(-460, -230, 920, 410);
      g.imageSmoothingEnabled = true;
      for (const u of [left, right]) { const F2 = fig[u.uid], sd = u === right ? 1 : -1; if (F2.alpha <= 0) continue; const img = fighter(u, F2.pose); g.save(); g.globalAlpha = F2.alpha; g.translate(sd * 175 - sd * F2.dx, 132); g.scale(-sd * 0.78, 0.78); g.drawImage(img, -260, -460); if (F2.flash > 0) { g.globalCompositeOperation = 'lighter'; g.globalAlpha = F2.flash * 0.8; g.drawImage(img, -260, -460); } g.restore(); }
      // slashes where a blow lands
      for (const s2 of slashes) { const k = s2.t / 0.3; g.save(); g.translate(s2.x, s2.y); g.rotate(-0.6 * s2.sd); g.globalAlpha = Math.max(0, 1 - k); g.globalCompositeOperation = 'lighter'; g.strokeStyle = s2.crit ? '#ffe070' : '#ffffff'; g.lineWidth = 10 * (1 - k) + 2; g.beginPath(); g.arc(0, 0, 70 + k * 30, -0.9 + k * 0.4, 0.9 + k * 0.4); g.stroke(); g.lineWidth = 3; g.strokeStyle = '#ffffff'; g.beginPath(); g.arc(0, 0, 64 + k * 30, -0.7 + k * 0.4, 0.7 + k * 0.4); g.stroke(); g.restore(); }
      if (proj) drawProj(g, proj);
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
    const wait = (ms, step) => new Promise((resolve) => { const t0 = performance.now(); const loop = (now) => { const dt = Math.min(0.05, (now - last) / 1000); last = now; for (const p of popups) p.t += dt; popups = popups.filter((p) => p.t < 1.2); for (const s2 of slashes) s2.t += dt; slashes = slashes.filter((s2) => s2.t < 0.3); flash = Math.max(0, flash - dt * 3); shakeT = Math.max(0, shakeT - dt * 3); for (const u of [att, def]) { fig[u.uid].flash = Math.max(0, fig[u.uid].flash - dt * 4); shown[u.uid] += (hp[u.uid] - shown[u.uid]) * Math.min(1, dt * 8); } const k = Math.min(1, (now - t0) / ms); if (step) step(k); draw(); if (k < 1 && !skip) requestAnimationFrame(loop); else resolve(); }; requestAnimationFrame(loop); });
    await wait(350);
    for (const s of res.strikes) {
      const u = s.side === 'A' ? att : def, o = u === att ? def : att, F2 = fig[u.uid], FO = fig[o.uid], w = ITEMS[(u === att ? res.wA : res.wB) || ''] || null, sdO = o === right ? 1 : -1;
      const ranged = w && (w.type === 'bow' || w.magic) && (range > 1 || w.type === 'bow');
      if (s.crit) { banner = '必殺！'; F2.pose = 'wind'; flash = 0.6; await wait(420); }
      if (!ranged) { F2.pose = 'wind'; await wait(180, (k) => { F2.dx = -k * 20; }); F2.pose = 'strike'; await wait(140, (k) => { F2.dx = -20 + k * 230; }); }
      else { F2.pose = w.type === 'bow' ? 'shoot' : 'cast'; await wait(220); const x0 = (u === right ? 1 : -1) * 120, x1 = sdO * 160; proj = { x: x0, y: 30, x0, x1, k: 0, kind: w.type === 'bow' ? 'arrow' : w.type === 'dark' ? 'dark' : w.type === 'light' ? 'light' : w.name === '雷擊' || w.name === '雷霆' ? 'thunder' : w.eff && w.eff.includes('fly') ? 'wind' : 'fire', trail: [] }; await wait(w.type === 'bow' ? 220 : 320, (k) => { proj.k = k; proj.x = x0 + (x1 - x0) * k; proj.y = 30 - Math.sin(k * Math.PI) * (w.type === 'bow' ? 30 : 10); proj.trail.push([proj.x, proj.y]); if (proj.trail.length > 14) proj.trail.shift(); }); proj = null; }
      if (s.hit) { hp[o.uid] = Math.max(0, hp[o.uid] - s.dmg); FO.flash = 1; FO.pose = 'hit'; if (!ranged) slashes.push({ x: sdO * 175, y: 30, t: 0, sd: sdO, crit: s.crit }); shakeT = s.crit ? 1 : 0.5; popups.push({ text: s.dmg ? String(s.dmg) : '無效', x: sdO * 170, y: -40, col: s.crit ? '#ffd040' : '#ffffff', big: s.crit, t: 0 }); if (s.lethal) popups.push({ text: '致命', x: sdO * 170, y: -110, col: '#ff6a6a', t: 0 }); if (s.miracle) popups.push({ text: '奇蹟', x: sdO * 170, y: -110, col: '#a0e8ff', t: 0 }); opts.sound?.(s.crit ? 'crit' : 'hit'); }
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
// arrows and spells in flight
function drawProj(g, p) {
  const dir = Math.sign(p.x1 - p.x0) || 1;
  if (p.kind === 'arrow') { g.save(); g.translate(p.x, p.y); g.rotate(dir > 0 ? Math.cos(p.k * Math.PI) * -0.35 : Math.PI + Math.cos(p.k * Math.PI) * 0.35); g.strokeStyle = '#6a4a2a'; g.lineWidth = 3; g.beginPath(); g.moveTo(-34, 0); g.lineTo(10, 0); g.stroke(); g.fillStyle = '#d8dce4'; g.beginPath(); g.moveTo(10, -5); g.lineTo(22, 0); g.lineTo(10, 5); g.fill(); g.fillStyle = '#e8e0d0'; for (const s of [-1, 1]) { g.beginPath(); g.moveTo(-34, 0); g.lineTo(-26, s * 6); g.lineTo(-20, 0); g.fill(); } g.restore(); return; }
  g.save(); g.globalCompositeOperation = 'lighter';
  const col = { fire: ['255,140,50', '255,230,150'], thunder: ['150,190,255', '240,250,255'], light: ['255,240,170', '255,255,240'], dark: ['170,80,230', '230,190,255'], wind: ['120,230,160', '230,255,240'] }[p.kind];
  if (p.kind === 'thunder') { g.strokeStyle = `rgba(${col[1]},0.95)`; g.lineWidth = 5; g.beginPath(); let y = -230; g.moveTo(p.x1, y); while (y < 30) { y += 30; g.lineTo(p.x1 + (Math.random() - 0.5) * 40, y); } g.stroke(); g.strokeStyle = `rgba(${col[0]},0.6)`; g.lineWidth = 14; g.stroke(); }
  if (p.kind === 'light') { const gr = g.createLinearGradient(0, -230, 0, 120); gr.addColorStop(0, `rgba(${col[0]},0)`); gr.addColorStop(1, `rgba(${col[1]},${0.4 + p.k * 0.5})`); g.fillStyle = gr; g.fillRect(p.x1 - 30 - p.k * 20, -230, 60 + p.k * 40, 360); }
  p.trail.forEach(([x, y], i) => { const a = i / p.trail.length; g.fillStyle = `rgba(${col[0]},${a * 0.5})`; g.beginPath(); g.arc(x, y + Math.sin(i) * (p.kind === 'wind' ? 8 : 2), 4 + a * 12, 0, 7); g.fill(); });
  const gr = g.createRadialGradient(p.x, p.y, 0, p.x, p.y, 34); gr.addColorStop(0, `rgba(${col[1]},1)`); gr.addColorStop(0.4, `rgba(${col[0]},0.8)`); gr.addColorStop(1, `rgba(${col[0]},0)`); g.fillStyle = gr; g.beginPath(); g.arc(p.x, p.y, 34, 0, 7); g.fill();
  if (p.kind === 'dark') { g.strokeStyle = `rgba(${col[1]},0.8)`; g.lineWidth = 2; for (let k = 0; k < 3; k++) { g.beginPath(); g.arc(p.x, p.y, 14 + k * 6, p.k * 12 + k * 2, p.k * 12 + k * 2 + 2.4); g.stroke(); } }
  g.restore();
}
function shadeC(hex, k) { const n = parseInt(hex.slice(1), 16), f = (v) => Math.max(0, Math.min(255, Math.round(k > 1 ? v + (255 - v) * (k - 1) : v * k))); return `rgb(${f((n >> 16) & 255)},${f((n >> 8) & 255)},${f(n & 255)})`; }
