// The battle scene: when two units fight, the map dims and they face each other side-on on a strip of their
// ground — yours on the right. Each strike plays out: the lunge, the arrow, the spell; a flash and a shudder on a
// hit, a hop back on a miss, a white burst and 必殺 for a critical; HP bars drain; the fallen fade away.
import { ITEMS } from './data/items.js';
import { terrainAt } from './data/terrain.js';
import { fighter } from './fighters.js';
import { backdrop } from './bgs.js';
import { watercolor, brushify } from './paint.js';
import { portrait } from './portraits.js';
import { faceOf } from './faces.js';
import { CLASSES } from './data/classes.js';
// the painted scene behind a fight, a touch out of focus and brighter, so the fighters stand out against it
const SOFT = new Map();
function softBackdrop(scene) {
  if (SOFT.has(scene)) return SOFT.get(scene);
  const bd = backdrop(scene), c = document.createElement('canvas'); c.width = 920; c.height = 518; const g = c.getContext('2d');
  g.filter = 'blur(1.6px) saturate(1.3) brightness(1.06) contrast(1.04)'; g.drawImage(bd, -6, -6, 932, 530); g.filter = 'none';
  const haze = g.createLinearGradient(0, 0, 0, 518); haze.addColorStop(0, 'rgba(255,236,210,0.10)'); haze.addColorStop(0.55, 'rgba(255,255,255,0)'); haze.addColorStop(1, 'rgba(30,20,60,0.32)'); g.fillStyle = haze; g.fillRect(0, 0, 920, 518);
  SOFT.set(scene, c); return c;
}
// a platform of ground for each side: a lit top with grass or stones, a rim of light, the cut earth below
const PLAT = new Map();
function platform(col, scene) {
  const key = col + scene; if (PLAT.has(key)) return PLAT.get(key);
  const c = document.createElement('canvas'); c.width = 720; c.height = 200; const g = c.getContext('2d'); g.scale(2, 2); g.translate(180, 40);
  const green = /hills|village|forest|cliff|marsh|river/.test(scene), snow = scene === 'snow', stone = !green && !snow;
  let h = 2166136261; const rnd = () => { h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0; h = Math.imul(h ^ (h >>> 13), 3266489909) >>> 0; return (h >>> 0) / 4294967296; };
  // the side: earth in bands, darker toward the bottom, roots and pebbles
  const side = g.createLinearGradient(0, 0, 0, 34); side.addColorStop(0, shadeC(green ? '#7a5a3a' : col, green ? 1 : 0.6)); side.addColorStop(1, shadeC(green ? '#3a2818' : col, green ? 1 : 0.32)); g.fillStyle = side;
  g.beginPath(); g.ellipse(0, 14, 168, 30, 0, 0, Math.PI); g.lineTo(-168, 0); g.ellipse(0, 0, 168, 30, 0, Math.PI, 0, true); g.fill();
  g.save(); g.beginPath(); g.ellipse(0, 14, 168, 30, 0, 0, Math.PI); g.lineTo(-168, 0); g.ellipse(0, 0, 168, 30, 0, Math.PI, 0, true); g.clip();
  for (let k = 0; k < 40; k++) { const x = -160 + rnd() * 320, y = 18 + rnd() * 22; g.fillStyle = `rgba(0,0,0,${0.1 + rnd() * 0.15})`; g.beginPath(); g.ellipse(x, y, 2 + rnd() * 4, 1 + rnd() * 2, 0, 0, 7); g.fill(); }
  g.restore();
  // the top
  const tg = g.createLinearGradient(0, -30, 0, 30); tg.addColorStop(0, shadeC(col, 1.22)); tg.addColorStop(0.6, col); tg.addColorStop(1, shadeC(col, 0.82)); g.fillStyle = tg; g.beginPath(); g.ellipse(0, 0, 168, 30, 0, 0, 7); g.fill();
  g.save(); g.beginPath(); g.ellipse(0, 0, 168, 30, 0, 0, 7); g.clip();
  // dappled light and shade
  for (let k = 0; k < 26; k++) { const x = -160 + rnd() * 320, y = -26 + rnd() * 52, r = 10 + rnd() * 26; const gr = g.createRadialGradient(x, y, 0, x, y, r); const lit = rnd() < 0.5; gr.addColorStop(0, lit ? 'rgba(255,250,210,0.16)' : 'rgba(20,30,40,0.12)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); }
  if (green) for (let k = 0; k < 260; k++) { const x = -165 + rnd() * 330, y = -28 + rnd() * 58; if ((x * x) / (168 * 168) + (y * y) / (30 * 30) > 0.95) continue; const len = 3 + rnd() * 5, lean = (rnd() - 0.5) * 3; g.strokeStyle = rnd() < 0.35 ? shadeC(col, 1.45) : rnd() < 0.5 ? shadeC(col, 0.7) : shadeC(col, 1.1); g.lineWidth = 1; g.beginPath(); g.moveTo(x, y); g.lineTo(x + lean, y - len); g.stroke(); }
  if (green) for (let k = 0; k < 16; k++) { const x = -150 + rnd() * 300, y = -22 + rnd() * 44; g.fillStyle = ['#fff4f8', '#ffd860', '#f8a0c0', '#c8d8ff'][k % 4]; for (let q = 0; q < 4; q++) { g.beginPath(); g.arc(x + Math.cos(q * 1.57) * 1.4, y + Math.sin(q * 1.57) * 1.4, 1.2, 0, 7); g.fill(); } g.fillStyle = '#ffd040'; g.fillRect(x - 0.6, y - 0.6, 1.2, 1.2); }
  if (snow) for (let k = 0; k < 60; k++) { const x = -160 + rnd() * 320, y = -26 + rnd() * 52; g.fillStyle = rnd() < 0.5 ? 'rgba(255,255,255,0.8)' : 'rgba(160,180,220,0.35)'; g.beginPath(); g.ellipse(x, y, 3 + rnd() * 8, 1 + rnd() * 2, 0, 0, 7); g.fill(); }
  if (stone) { g.strokeStyle = shadeC(col, 0.7); g.lineWidth = 1; for (let r = -24; r < 30; r += 10) { g.beginPath(); g.moveTo(-170, r); g.lineTo(170, r); g.stroke(); for (let x = -170 + ((r / 10) % 2) * 14; x < 170; x += 28) { g.beginPath(); g.moveTo(x, r); g.lineTo(x, r + 10); g.stroke(); g.fillStyle = 'rgba(255,255,255,0.08)'; g.fillRect(x + 1, r + 1, 26, 2); } } }
  for (let k = 0; k < 14; k++) { const x = -150 + rnd() * 300, y = -20 + rnd() * 40; g.fillStyle = shadeC(stone ? col : '#8a8478', 0.8 + rnd() * 0.4); g.beginPath(); g.ellipse(x, y, 2 + rnd() * 3, 1.2 + rnd() * 1.4, 0, 0, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(x - 1, y - 1.2, 2, 0.8); }
  g.restore();
  // a rim of light along the far edge, a dark line where the top meets the side
  g.strokeStyle = 'rgba(255,250,220,0.5)'; g.lineWidth = 2; g.beginPath(); g.ellipse(0, 0, 166, 29, 0, Math.PI * 1.08, Math.PI * 1.92); g.stroke();
  g.strokeStyle = 'rgba(20,10,20,0.35)'; g.lineWidth = 1.5; g.beginPath(); g.ellipse(0, 0, 168, 30, 0, 0.05, Math.PI - 0.05); g.stroke();
  if (green) { g.fillStyle = shadeC(col, 0.85); for (let k = 0; k < 50; k++) { const a = 0.08 + k / 49 * (Math.PI - 0.16), x = Math.cos(a) * 168, y = Math.sin(a) * 30; g.beginPath(); g.moveTo(x - 3, y - 1); g.lineTo(x + (rnd() - 0.5) * 2, y + 3 + rnd() * 6); g.lineTo(x + 3, y - 1); g.fill(); } }
  brushify(c, { n: 9000, len: 8, width: 2, alpha: 0.35, seed: 11 }); watercolor(c, { bloom: 0.3, grain: 0.35, scale: 1 }); PLAT.set(key, c); return c;
}
// a small mark for each kind of weapon
function wIcon(g, type, x, y) {
  g.save(); g.translate(x, y); g.lineCap = 'round'; g.lineJoin = 'round';
  const steel = '#dce2ee', dk = '#1a1420';
  const st = (pts, c, w) => { g.strokeStyle = dk; g.lineWidth = w + 2.5; g.beginPath(); g.moveTo(...pts[0]); for (const q of pts.slice(1)) g.lineTo(...q); g.stroke(); g.strokeStyle = c; g.lineWidth = w; g.stroke(); };
  if (type === 'sword') { st([[-8, 8], [8, -8]], steel, 3); st([[-9, 3], [-3, 9]], '#e8c060', 2.5); }
  else if (type === 'lance') { st([[-9, 9], [9, -9]], '#a87a48', 2.2); g.fillStyle = steel; g.strokeStyle = dk; g.lineWidth = 1.2; g.beginPath(); g.moveTo(10, -10); g.lineTo(3, -7); g.lineTo(7, -3); g.closePath(); g.fill(); g.stroke(); }
  else if (type === 'axe') { st([[-8, 9], [6, -7]], '#a87a48', 2.2); g.fillStyle = steel; g.strokeStyle = dk; g.lineWidth = 1.2; g.beginPath(); g.moveTo(2, -10); g.quadraticCurveTo(12, -8, 10, 2); g.lineTo(4, -4); g.closePath(); g.fill(); g.stroke(); }
  else if (type === 'bow') { g.strokeStyle = dk; g.lineWidth = 4.5; g.beginPath(); g.arc(-4, 0, 11, -1.1, 1.1); g.stroke(); g.strokeStyle = '#c08a48'; g.lineWidth = 2.2; g.stroke(); g.strokeStyle = '#f4ecd8'; g.lineWidth = 0.8; g.beginPath(); g.moveTo(1, -10); g.lineTo(1, 10); g.stroke(); }
  else if (type === 'staff') { st([[-8, 9], [5, -5]], '#e8c870', 2); g.fillStyle = '#8ad8ff'; g.strokeStyle = dk; g.beginPath(); g.arc(7, -7, 3.6, 0, 7); g.fill(); g.stroke(); }
  else if (type) { const c = type === 'dark' ? '#6a3a9a' : type === 'light' ? '#f0e4a0' : '#c83a3a'; g.fillStyle = c; g.strokeStyle = dk; g.lineWidth = 1.4; g.beginPath(); g.rect(-8, -9, 15, 18); g.fill(); g.stroke(); g.fillStyle = '#f4ecd8'; g.fillRect(5, -7, 2, 14); g.fillStyle = '#e8c860'; g.fillRect(-4, -3, 6, 6); }
  g.restore();
}

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
    let popups = [], flash = 0, shakeT = 0, proj = null, banner = '', sparks = [], critFx = 0, critSeed = 0;
    const range = Math.abs(att.x - def.x) + Math.abs(att.y - def.y);
    const draw = () => {
      g.setTransform(dpr, 0, 0, dpr, 0, 0); g.fillStyle = 'rgba(0,0,0,0.55)'; g.fillRect(0, 0, W, Hh);
      g.save(); g.translate(W / 2 + (shakeT > 0 ? (Math.random() - 0.5) * 14 * shakeT : 0), Hh / 2 - 40 * S); g.scale(S, S);
      // the arena
      g.save(); g.beginPath(); g.rect(-460, -230, 920, 410); g.clip(); g.drawImage(softBackdrop(scene), -460, -300, 920, 518); const dim = g.createLinearGradient(0, -230, 0, 180); dim.addColorStop(0, 'rgba(0,0,0,0)'); dim.addColorStop(0.75, 'rgba(10,0,30,0.08)'); dim.addColorStop(1, 'rgba(10,0,30,0.4)'); g.fillStyle = dim; g.fillRect(-460, -230, 920, 410);
      if (critFx > 0) { g.save(); g.globalAlpha = Math.min(1, critFx * 1.4); const cg = g.createRadialGradient(0, 20, 30, 0, 20, 520); cg.addColorStop(0, 'rgba(255,240,200,0.0)'); cg.addColorStop(1, 'rgba(120,20,60,0.55)'); g.fillStyle = cg; g.fillRect(-460, -230, 920, 410); g.strokeStyle = 'rgba(255,255,255,0.85)'; for (let k = 0; k < 46; k++) { const a = k / 46 * Math.PI * 2 + critSeed, r0 = 180 + ((k * 53) % 90); g.lineWidth = 1 + (k % 3); g.beginPath(); g.moveTo(Math.cos(a) * r0, 20 + Math.sin(a) * r0 * 0.7); g.lineTo(Math.cos(a) * 700, 20 + Math.sin(a) * 490); g.stroke(); } g.restore(); }
      // two platforms of ground, as the old battle screens had: a lit top with some texture, a darker front
      for (const sx of [-1, 1]) g.drawImage(platform(floorC, scene), sx * 175 - 180, 86, 360, 100);
      g.restore(); g.strokeStyle = '#3a2a10'; g.lineWidth = 7; g.strokeRect(-460, -230, 920, 410); g.strokeStyle = '#e8c870'; g.lineWidth = 3; g.strokeRect(-460, -230, 920, 410); g.strokeStyle = 'rgba(255,240,200,0.6)'; g.lineWidth = 1; g.strokeRect(-455, -225, 910, 400);
      g.imageSmoothingEnabled = true;
      for (const u of [left, right]) { const F2 = fig[u.uid], sd = u === right ? 1 : -1; if (F2.alpha <= 0) continue; const img = fighter(u, F2.pose); if (F2.pose === 'strike' && F2.dx > 30) for (const [o, a] of [[70, 0.14], [36, 0.26]]) { g.save(); g.globalAlpha = a * F2.alpha; g.translate(sd * 175 - sd * (F2.dx - o), 132); g.scale(-sd * 0.86, 0.86); g.drawImage(img, -260, -460); g.restore(); } g.save(); g.globalAlpha = F2.alpha; g.translate(sd * 175 - sd * F2.dx, 132); g.scale(-sd * 0.86, 0.86); g.drawImage(img, -260, -460); if (F2.flash > 0) { g.globalCompositeOperation = 'lighter'; g.globalAlpha = F2.flash * 0.8; g.drawImage(img, -260, -460); } g.restore(); }
      // slashes where a blow lands
      for (const s2 of slashes) { const k = s2.t / 0.3; g.save(); g.translate(s2.x, s2.y); g.rotate(-0.6 * s2.sd); g.globalAlpha = Math.max(0, 1 - k); g.globalCompositeOperation = 'lighter'; g.strokeStyle = s2.crit ? '#ffe070' : '#ffffff'; g.lineWidth = 10 * (1 - k) + 2; g.beginPath(); g.arc(0, 0, 70 + k * 30, -0.9 + k * 0.4, 0.9 + k * 0.4); g.stroke(); g.lineWidth = 3; g.strokeStyle = '#ffffff'; g.beginPath(); g.arc(0, 0, 64 + k * 30, -0.7 + k * 0.4, 0.7 + k * 0.4); g.stroke(); g.restore(); }
      for (const sp of sparks) { const k = sp.t / 0.35; g.save(); g.translate(sp.x, sp.y); g.globalCompositeOperation = 'lighter'; g.globalAlpha = Math.max(0, 1 - k); const c1 = sp.crit ? '255,220,120' : '255,255,255', c2 = sp.crit ? '255,120,40' : '140,200,255'; const gr = g.createRadialGradient(0, 0, 0, 0, 0, 60 + k * 40); gr.addColorStop(0, `rgba(${c1},0.9)`); gr.addColorStop(0.3, `rgba(${c2},0.5)`); gr.addColorStop(1, `rgba(${c2},0)`); g.fillStyle = gr; g.beginPath(); g.arc(0, 0, 60 + k * 40, 0, 7); g.fill(); g.fillStyle = `rgba(${c1},1)`; g.beginPath(); for (let q = 0; q < 16; q++) { const a = q / 16 * Math.PI * 2 + sp.r, r = q % 2 ? 10 + k * 10 : (q % 4 ? 40 : 70) * (0.6 + k * 0.8); g.lineTo(Math.cos(a) * r, Math.sin(a) * r); } g.closePath(); g.fill(); g.strokeStyle = `rgba(${c2},0.9)`; g.lineWidth = 3 * (1 - k); g.beginPath(); g.arc(0, 0, 20 + k * 70, 0, 7); g.stroke(); g.restore(); }
      if (proj) drawProj(g, proj);
      for (const p of popups) { const sz = p.big ? 70 : 50, y = p.y - Math.min(p.t, 0.25) * 120 + Math.max(0, p.t - 0.25) * -20 + (p.t < 0.35 ? Math.sin(p.t / 0.35 * Math.PI) * -14 : 0); g.font = `900 ${sz}px "Noto Serif TC", serif`; g.textAlign = 'center'; g.lineJoin = 'round'; g.globalAlpha = Math.max(0, Math.min(1, (1.2 - p.t) / 0.4)); g.lineWidth = 9; g.strokeStyle = '#1a0a1a'; g.strokeText(p.text, p.x, y); const gr = g.createLinearGradient(0, y - sz * 0.8, 0, y); gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.55, p.col); gr.addColorStop(1, shadeC(p.col[0] === '#' && p.col.length === 7 ? p.col : '#ffffff', 0.7)); g.fillStyle = gr; g.fillText(p.text, p.x, y); g.globalAlpha = 1; }
      if (banner) { g.save(); g.font = '900 64px "Noto Serif TC", serif'; g.textAlign = 'center'; g.lineJoin = 'round'; g.lineWidth = 12; g.strokeStyle = '#3a0a0a'; g.strokeText(banner, 0, -140); const bg = g.createLinearGradient(0, -190, 0, -140); bg.addColorStop(0, '#fffbe0'); bg.addColorStop(0.5, '#ffd040'); bg.addColorStop(1, '#e06a10'); g.fillStyle = bg; g.fillText(banner, 0, -140); g.restore(); }
      // the bars: name, weapon, HP, and the numbers
      for (const u of [left, right]) { const sd = u === right ? 1 : -1, x0 = sd > 0 ? 20 : -460, y0 = 190, f = res.f, N = u === att ? f.A : f.B, F2 = fig[u.uid];
        const base = u.side === 'player' ? ['#2a4ab0', '#142466', '#6a90f0'] : u.side === 'ally' ? ['#2a8a44', '#0e4a20', '#70c880'] : ['#b02a34', '#5a0e18', '#f07070'];
        const pg = g.createLinearGradient(0, y0, 0, y0 + 110); pg.addColorStop(0, base[0]); pg.addColorStop(1, base[1]); g.fillStyle = pg; g.fillRect(x0, y0, 440, 110);
        const sheen = g.createLinearGradient(0, y0, 0, y0 + 40); sheen.addColorStop(0, 'rgba(255,255,255,0.22)'); sheen.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = sheen; g.fillRect(x0, y0, 440, 40);
        g.strokeStyle = '#3a2a10'; g.lineWidth = 6; g.strokeRect(x0, y0, 440, 110); g.strokeStyle = '#e8c870'; g.lineWidth = 2.5; g.strokeRect(x0, y0, 440, 110); g.strokeStyle = 'rgba(255,240,200,0.45)'; g.lineWidth = 1; g.strokeRect(x0 + 5, y0 + 5, 430, 100);
        for (const [cx2, cy2] of [[x0, y0], [x0 + 440, y0], [x0, y0 + 110], [x0 + 440, y0 + 110]]) { g.fillStyle = '#e8c870'; g.beginPath(); g.moveTo(cx2, cy2 - 7); g.lineTo(cx2 + 7, cy2); g.lineTo(cx2, cy2 + 7); g.lineTo(cx2 - 7, cy2); g.closePath(); g.fill(); g.strokeStyle = '#3a2a10'; g.lineWidth = 1.5; g.stroke(); }
        // the face, its expression following the fight
        const face = faceOf(u), px = x0 + 58, py = y0 + 55;
        g.save(); g.beginPath(); g.arc(px, py, 44, 0, 7); const fg = g.createRadialGradient(px, py - 10, 4, px, py, 46); fg.addColorStop(0, base[2]); fg.addColorStop(1, base[1]); g.fillStyle = fg; g.fill(); g.clip();
        { const ex = hp[u.uid] <= 0 ? '閉' : F2.pose === 'hit' ? '痛' : F2.pose === 'strike' || F2.pose === 'wind' || F2.pose === 'cast' || F2.pose === 'shoot' ? '決' : '平'; g.drawImage(portrait(face, ex, 192, sd > 0), px - 52, py - 52, 104, 104); }
        g.restore(); g.strokeStyle = '#3a2a10'; g.lineWidth = 5; g.beginPath(); g.arc(px, py, 44, 0, 7); g.stroke(); g.strokeStyle = '#e8c870'; g.lineWidth = 2; g.stroke();
        // name and weapon
        g.textAlign = 'left'; g.font = 'bold 28px "Noto Serif TC", serif'; g.lineWidth = 4; g.strokeStyle = 'rgba(10,5,20,0.6)'; g.strokeText(u.name, x0 + 114, y0 + 36); g.fillStyle = '#ffffff'; g.fillText(u.name, x0 + 114, y0 + 36);
        const wid = u === att ? res.wA : res.wB, W = wid ? ITEMS[wid] : null; wIcon(g, W ? W.type : '', x0 + 124, y0 + 58); g.font = '19px "Noto Serif TC", serif'; g.fillStyle = '#f4ecd0'; g.fillText(W ? W.name : '—', x0 + 142, y0 + 65);
        // the three numbers in boxes
        const cells = N ? [['威力', N.dmg + (N.eff ? '!' : '')], ['命中', N.hit], ['必殺', N.crit]] : [['', '—'], ['', '無法'], ['', '反擊']];
        cells.forEach(([lab, val], i) => { const bx = x0 + 262 + i * 58, by = y0 + 14; g.fillStyle = 'rgba(0,0,20,0.35)'; g.fillRect(bx, by, 52, 52); g.strokeStyle = 'rgba(232,200,112,0.7)'; g.lineWidth = 1; g.strokeRect(bx + 0.5, by + 0.5, 51, 51); g.textAlign = 'center'; g.fillStyle = '#c8d8ff'; g.font = '13px "Noto Serif TC", serif'; g.fillText(lab, bx + 26, by + 17); g.fillStyle = '#ffffff'; g.font = 'bold 24px sans-serif'; g.fillText(String(val), bx + 26, by + 44); });
        // HP: the number and a glossy bar in segments
        const v = shown[u.uid], m = u.stats.hp, fr = Math.max(0, v) / m, bx = x0 + 168, by = y0 + 80, bw = 258;
        g.textAlign = 'left'; g.font = 'bold 15px sans-serif'; g.fillStyle = '#ffe8a0'; g.fillText('HP', x0 + 114, by + 13); g.font = 'bold 22px sans-serif'; g.fillStyle = '#ffffff'; g.fillText(String(Math.max(0, Math.round(v))), x0 + 136, by + 15);
        g.fillStyle = '#100810'; g.fillRect(bx - 2, by - 2, bw + 4, 18); const hc2 = fr > 0.5 ? ['#a8f870', '#3a9a2a'] : fr > 0.25 ? ['#fff070', '#c89a10'] : ['#ff9a80', '#c82a1a']; const hg = g.createLinearGradient(0, by, 0, by + 14); hg.addColorStop(0, hc2[0]); hg.addColorStop(1, hc2[1]); g.fillStyle = hg; g.fillRect(bx, by, bw * fr, 14); g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(bx, by + 1, bw * fr, 4);
        g.fillStyle = '#100810'; for (let q = 1; q < m; q++) { if (m > 40 && q % 2) continue; g.fillRect(bx + bw * q / m - 0.5, by, 1, 14); }
      }
      g.restore();
      if (flash > 0) { g.fillStyle = `rgba(255,255,255,${flash})`; g.fillRect(0, 0, W, Hh); }
    };
    let last = performance.now(), skip = false; const onKey = () => { skip = true; }; addEventListener('keydown', onKey); cv.addEventListener('pointerdown', onKey);
    const wait = (ms, step) => new Promise((resolve) => { const t0 = performance.now(); const loop = (now) => { const dt = Math.min(0.05, (now - last) / 1000); last = now; for (const p of popups) p.t += dt; popups = popups.filter((p) => p.t < 1.2); for (const s2 of slashes) s2.t += dt; slashes = slashes.filter((s2) => s2.t < 0.3); for (const sp of sparks) sp.t += dt; sparks = sparks.filter((sp) => sp.t < 0.35); critFx = Math.max(0, critFx - dt * 1.6); flash = Math.max(0, flash - dt * 3); shakeT = Math.max(0, shakeT - dt * 3); for (const u of [att, def]) { fig[u.uid].flash = Math.max(0, fig[u.uid].flash - dt * 4); shown[u.uid] += (hp[u.uid] - shown[u.uid]) * Math.min(1, dt * 8); } const k = Math.min(1, (now - t0) / ms); if (step) step(k); draw(); if (k < 1 && !skip) requestAnimationFrame(loop); else resolve(); }; requestAnimationFrame(loop); });
    await wait(350);
    for (const s of res.strikes) {
      const u = s.side === 'A' ? att : def, o = u === att ? def : att, F2 = fig[u.uid], FO = fig[o.uid], w = ITEMS[(u === att ? res.wA : res.wB) || ''] || null, sdO = o === right ? 1 : -1;
      const ranged = w && (w.type === 'bow' || w.magic) && (range > 1 || w.type === 'bow');
      if (s.crit) { banner = '必殺！'; F2.pose = 'wind'; flash = 0.6; critFx = 1; critSeed = Math.random() * 6; await wait(420); }
      if (!ranged) { F2.pose = 'wind'; await wait(180, (k) => { F2.dx = -k * 20; }); F2.pose = 'strike'; await wait(140, (k) => { F2.dx = -20 + k * 230; }); }
      else { F2.pose = w.type === 'bow' ? 'shoot' : 'cast'; await wait(220); const x0 = (u === right ? 1 : -1) * 120, x1 = sdO * 160; proj = { x: x0, y: 30, x0, x1, k: 0, kind: w.type === 'bow' ? 'arrow' : w.type === 'dark' ? 'dark' : w.type === 'light' ? 'light' : w.name === '雷擊' || w.name === '雷霆' ? 'thunder' : w.eff && w.eff.includes('fly') ? 'wind' : 'fire', trail: [] }; await wait(w.type === 'bow' ? 220 : 320, (k) => { proj.k = k; proj.x = x0 + (x1 - x0) * k; proj.y = 30 - Math.sin(k * Math.PI) * (w.type === 'bow' ? 30 : 10); proj.trail.push([proj.x, proj.y]); if (proj.trail.length > 14) proj.trail.shift(); }); proj = null; }
      if (s.hit) { hp[o.uid] = Math.max(0, hp[o.uid] - s.dmg); FO.flash = 1; FO.pose = 'hit'; sparks.push({ x: sdO * 165, y: 10, t: 0, crit: s.crit, r: Math.random() * 3 }); if (s.crit) critFx = Math.max(critFx, 0.8); if (!ranged) slashes.push({ x: sdO * 175, y: 30, t: 0, sd: sdO, crit: s.crit }); shakeT = s.crit ? 1 : 0.5; popups.push({ text: s.dmg ? String(s.dmg) : '無效', x: sdO * 170, y: -40, col: s.crit ? '#ffd040' : '#ffffff', big: s.crit, t: 0 }); if (s.lethal) popups.push({ text: '致命', x: sdO * 170, y: -110, col: '#ff6a6a', t: 0 }); if (s.miracle) popups.push({ text: '奇蹟', x: sdO * 170, y: -110, col: '#a0e8ff', t: 0 }); opts.sound?.(s.crit ? 'crit' : 'hit'); }
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
