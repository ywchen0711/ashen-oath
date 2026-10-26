// Fighters for the battle scene: side-on figures facing right, drawn in the manner of the Japanese tactics games —
// slim, long-legged figures with cel shading (a hard-edged shadow on the side away from the light, shadows tinted
// toward violet, a warm rim of light), line art in a deep tone of each colour, and detailed gear: coat-tails and
// tabards, belts and buckles, pauldrons with trim, gloves, folded boots, capes with a coloured lining, scarves that
// stream behind. They stand on a jointed skeleton (hips, knees, shoulders, elbows) so each pose — at rest, winding
// up, striking, casting, drawing a bow, reeling from a hit, dodging — bends the body the way a person would. Riders
// sit on horses, pegasi, wyverns and wolves. A fighter's look comes from its class, its side's colours, and for
// named people their own hair, eyes, skin and clothes. Returns a 520×520 canvas: 260 units at double resolution,
// the ground at y = 230.
import { ITEMS } from './data/items.js';
import { CLASSES } from './data/classes.js';
import { CAST } from './data/cast.js';
import { TEAM } from './tiles.js';
import { faceOf } from './faces.js';

import { watercolor } from './paint.js';
const CACHE = new Map();
const LASH = '#3a1e36';
const LINE = '#2a1a2e';
const rgb = (c) => { if (c[0] !== '#') return c.match(/\d+/g).slice(0, 3).map(Number); const n = parseInt(c.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const hx = (r, g, b) => '#' + [r, g, b].map((x) => Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, '0')).join('');
const sh = (c, k) => { const [r, g, b] = rgb(c), f = (x) => (k > 1 ? x + (255 - x) * (k - 1) : x * k); return hx(f(r), f(g), f(b)); };
const cool = (c, k = 0.72, t = 0.24) => { const [r, g, b] = rgb(c); return hx(r * k * (1 - t) + 70 * t, g * k * (1 - t) + 44 * t, b * k * (1 - t) + 120 * t); };
const warm = (c, k = 1.3) => { const [r, g, b] = rgb(c); return hx(r + (255 - r) * (k - 1) + 8, g + (255 - g) * (k - 1) + 3, b + (255 - b) * (k - 1) - 6); };
const inkOf = (c) => (typeof c === 'string' && (c[0] === '#' || c.startsWith('rgb(')) ? cool(c, 0.48, 0.3) : '#3a2a48');
const v = (a, l = 1) => [Math.sin(a) * l, Math.cos(a) * l]; // a direction measured from straight down, forward is positive
const add = (p, q) => [p[0] + q[0], p[1] + q[1]];
const lerp = (p, q, t) => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t];
const MOUNT = { cav: 'horse', paladin: 'horse', gk: 'horse', ranger: 'horse', valkyrie: 'horse', darkknight: 'horse', inquisitor: 'horse', gull: 'pegasus', gulllord: 'pegasus', storm: 'pegasus', wyvern: 'wyvern', wyvernlord: 'wyvern', wolf: 'wolf', wolfking: 'wolf' };
const HEAVY = { knight: 1, general: 1, gk: 1, regent: 1 };
const HELM = { knight: 1, general: 1, gk: 1, soldier: 1, halberd: 1, darkknight: 1, wyvern: 1, wyvernlord: 1, regent: 1, warrior: 1 };
const ROBE = { mage: 1, cleric: 1, monk: 1, shaman: 1, sage: 1, bishop: 1, druid: 1, saint: 1, strategist: 1, archbishop: 1, princess: 1, queen: 1, valkyrie: 1, storm: 1, bard: 1, spellblade: 0 };
const HOOD = { thief: 1, assassin: 1, rogue: 1, shaman: 1, druid: 1, archer: 1 };
const BARE = { fighter: 1, brigand: 1, berserker: 1, pirate: 1 };
const CAPE = { sword: 1, oath: 1, hero: 1, paladin: 1, queen: 1, regent: 1, gulllord: 1, wyvernlord: 1, general: 1, sniper: 1, sage: 1, archbishop: 1, darkknight: 1, inquisitor: 1, spellblade: 1, wolfking: 1, gk: 1, sm: 1 };
const FEMALE = { cleric: 1, valkyrie: 1, gull: 1, gulllord: 1, storm: 1, saint: 1, princess: 1, queen: 1 };
const HAT = { mage: 1, sage: 1 };
const HAIRS = ['#3a2a1a', '#5a3a20', '#8a5a2a', '#2a2426', '#a87a3a', '#6a4a3a', '#4a3a30', '#7a3a24'];
const EYES = ['#4a6a9a', '#5a4a3a', '#3a7a5a', '#6a4a2a', '#5a5a7a'];
const HOLY = { cleric: 1, saint: 1, bishop: 1, archbishop: 1 };

export function fighter(u, pose) {
  const k = CLASSES[u.cls], look = k.look, wid = u._wid || (u.items && u.items[0] && u.items[0].id) || '', key = [u.id || u.uid, u.cls, u.side, wid, pose].join('|');
  if (CACHE.has(key)) return CACHE.get(key);
  const c = document.createElement('canvas'); c.width = c.height = 520; const g = c.getContext('2d'); g.scale(2, 2); g.translate(130, 230); g.lineJoin = 'round'; g.lineCap = 'round';
  const named = u.id && CAST[u.id] && CAST[u.id].p, P = named ? CAST[u.id].p : faceOf(u), T = TEAM[u.side] || TEAM.player, seed = [...String(u.uid || u.id || u.cls)].reduce((s, ch) => s * 31 + ch.charCodeAt(0), 7) >>> 0;
  const w = ITEMS[wid], wt = w ? (w.type === 'anima' || w.type === 'light' || w.type === 'dark' ? 'tome' : w.type) : 'none';
  const own = named && P.oc && u.side !== 'gray' ? [P.oc, sh(P.oc, 0.7), sh(P.oc, 1.3)] : null;
  const hair = P ? P.hair : '';
  const L = { look, T: own || T, P, w, wt, pose, seed, mount: MOUNT[look], heavy: HEAVY[look], helm: HELM[look] && !(P && P.hair && P.hair !== 'helm' && !HEAVY[look]), robe: ROBE[look], hood: HOOD[look] && !(P && !['hood', 'veil'].includes(P.hair) && look === 'archer' && P.out !== 'hunter'), bare: BARE[look] || (P && P.out === 'bare'), cape: CAPE[look] || (named && CAST[u.id].lord),
    hc: inkHair((P && P.hc) || HAIRS[seed % HAIRS.length]), ec: (P && P.ec) || EYES[(seed >> 3) % EYES.length], skin: (P && P.skin) || ['#f2cdb0', '#e8bc98', '#d8a880', '#f6dcc4'][seed % 4], f: P ? P.g === 'f' : !!FEMALE[look],
    hair: hair || (FEMALE[look] ? ['long', 'pony', 'bob'][seed % 3] : ['short', 'spiky', 'messy', 'short'][seed % 4]),
    beard: P && P.beard, longBeard: P && (P.longBeard || P.braidBeard), veil: P && (P.hair === 'veil' || P.veil), scarf: P && P.scarf, hat: !named && HAT[look] && P.g !== 'f',
    trim: P && P.ac ? P.ac : k.tier === 2 ? '#e8c060' : sh(T[1], 0.8), tier: k.tier || 1 };
  // a pose can be a blend of two, 'wind>strike@0.5', for the frames in between
  if (pose.includes('>')) { const [a, rest] = pose.split('>'), [b, ts] = rest.split('@'), t = +ts, A = poseFor({ ...L, pose: a }), B2 = poseFor({ ...L, pose: b }), M = {}; for (const k of new Set([...Object.keys(A), ...Object.keys(B2)])) M[k] = (A[k] || 0) + ((B2[k] || 0) - (A[k] || 0)) * t; L.pose = t < 0.5 ? a : b; L.params = M; }
  draw(g, L);
  // the light over the whole figure: warm from above and in front, violet shade low down
  g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-atop';
  const lt = g.createLinearGradient(0, 120, 0, 470); lt.addColorStop(0, 'rgba(255,240,220,0.14)'); lt.addColorStop(0.5, 'rgba(255,255,255,0)'); lt.addColorStop(1, 'rgba(50,24,90,0.22)'); g.fillStyle = lt; g.fillRect(0, 0, 520, 520);
  const fr = g.createLinearGradient(140, 0, 380, 0); fr.addColorStop(0, 'rgba(40,20,80,0.12)'); fr.addColorStop(0.6, 'rgba(255,255,255,0)'); fr.addColorStop(1, 'rgba(255,236,200,0.14)'); g.fillStyle = fr; g.fillRect(0, 0, 520, 520);
  g.globalCompositeOperation = 'source-over';
  watercolor(c, { sat: 1, bright: 1.02, bloom: 0.2, grain: 0.2, lift: 0.07, scale: 1 }); CACHE.set(key, c); return c;
}
// ---------------------------------------------------------------- shapes
function pathOf(g, pts) { g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (const p of pts.slice(1)) { if (p.length === 4) g.quadraticCurveTo(p[0], p[1], p[2], p[3]); else if (p.length === 6) g.bezierCurveTo(p[0], p[1], p[2], p[3], p[4], p[5]); else g.lineTo(p[0], p[1]); } g.closePath(); }
function poly(g, pts, fill, line, lw = 1.1) { pathOf(g, pts); if (fill) { g.fillStyle = fill; g.fill(); } if (line === undefined) line = inkOf(fill); if (line) { g.strokeStyle = line; g.lineWidth = lw; g.stroke(); } }
function ell(g, x, y, rx, ry, rot, fill, line, lw = 1.1) { g.beginPath(); g.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2); if (fill) { g.fillStyle = fill; g.fill(); } if (line === undefined) line = inkOf(fill); if (line) { g.strokeStyle = line; g.lineWidth = lw; g.stroke(); } }
// a shape with a hard-edged shadow on the side away from the light (behind and below): the shadow colour fills it,
// then the base colour fills it again shifted toward the light
function cel(g, build, base, d = 3, shadow, line, lw = 1.1, deco) {
  g.save(); build(g); g.fillStyle = shadow || cool(base); g.fill(); g.clip(); g.save(); g.translate(d, -d * 0.6); build(g); g.fillStyle = base; g.fill(); g.restore(); if (deco) deco(g); g.restore();
  build(g); if (line !== null) { g.strokeStyle = line || inkOf(base); g.lineWidth = lw; g.stroke(); }
}
const celPoly = (g, pts, base, d, shadow, line, lw, deco) => cel(g, (g) => pathOf(g, pts), base, d, shadow, line, lw, deco);
const celEll = (g, x, y, rx, ry, rot, base, d, shadow, line, lw, deco) => cel(g, (g) => { g.beginPath(); g.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2); }, base, d, shadow, line, lw, deco);
function capsule(g, p, q, w1, w2) { const dx = q[0] - p[0], dy = q[1] - p[1], l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l; g.moveTo(p[0] + nx * w1, p[1] + ny * w1); g.lineTo(q[0] + nx * w2, q[1] + ny * w2); g.arc(q[0], q[1], w2, Math.atan2(ny, nx), Math.atan2(ny, nx) + Math.PI, true); g.lineTo(p[0] - nx * w1, p[1] - ny * w1); g.arc(p[0], p[1], w1, Math.atan2(-ny, -nx), Math.atan2(-ny, -nx) + Math.PI, true); g.closePath(); }
function seg(g, p, q, w1, w2, fill, hi) {
  cel(g, (g) => { g.beginPath(); capsule(g, p, q, w1, w2); }, fill, Math.min(w1, w2) * 0.7);
  if (hi) litEdge(g, p, q, Math.min(w1, w2), hi);
}
function litEdge(g, p, q, ww, col) { const dx = q[0] - p[0], dy = q[1] - p[1], l = Math.hypot(dx, dy) || 1; let nx = -dy / l, ny = dx / l; if (nx - ny < 0) { nx = -nx; ny = -ny; } g.strokeStyle = col; g.lineWidth = Math.max(0.8, ww * 0.32); g.beginPath(); g.moveTo(p[0] + nx * ww * 0.5, p[1] + ny * ww * 0.5); g.lineTo(q[0] + nx * ww * 0.5, q[1] + ny * ww * 0.5); g.stroke(); }
// a two-part limb: one outline round both parts, each part cel-shaded
function limb(g, a, b, c, w1, w2, w3, fill, fill2, hi) {
  g.beginPath(); capsule(g, a, b, w1, w2); capsule(g, b, c, w2, w3); g.strokeStyle = inkOf(fill2 || fill); g.lineWidth = 2.2; g.stroke();
  cel(g, (g) => { g.beginPath(); capsule(g, a, b, w1, w2); }, fill, Math.min(w1, w2) * 0.75, undefined, null);
  cel(g, (g) => { g.beginPath(); capsule(g, b, c, w2 * 0.98, w3); }, fill2 || fill, Math.min(w2, w3) * 0.75, undefined, null);
  if (hi) { litEdge(g, a, b, Math.min(w1, w2), hi); litEdge(g, b, c, Math.min(w2, w3), hi); }
}
// ---------------------------------------------------------------- poses
// angles from straight down: torso lean, thighs and shins, upper and lower arms (front = the near arm holding the
// weapon), and the angle the weapon points
const POSE = {
  // on guard: knees soft, weight back, the weapon up and forward
  idle: { lean: 0.1, ft: 0.4, fs: -0.06, bt: -0.3, bs: -0.2, fa: 0.55, ff: 1.35, ba: -0.2, bf: 0.45, wa: 2.35 },
  // raised: the weapon drawn up and back over the shoulder, the body coiled back, the free arm out for balance
  wind: { lean: -0.12, ft: 0.48, fs: 0.02, bt: -0.4, bs: -0.28, fa: 2.75, ff: 3.45, ba: 0.75, bf: 1.35, wa: 3.9 },
  // the blow lands: lunging, the arm sweeping forward, the blade angled down through the target
  strike: { lean: 0.34, ft: 0.95, fs: 0.12, bt: -0.72, bs: -0.5, fa: 1.5, ff: 1.3, ba: -0.6, bf: -0.2, wa: 1.05, dx: 8 },
  // through and down: the blade carried on low, the weight over the front foot
  follow: { lean: 0.42, ft: 0.95, fs: 0.2, bt: -0.8, bs: -0.55, fa: 0.85, ff: 0.5, ba: -0.85, bf: -0.45, wa: 0.15, dx: 10, dy: 2 },
  cast: { lean: 0.1, ft: 0.4, fs: 0.06, bt: -0.36, bs: -0.14, fa: 1.25, ff: 1.85, ba: 0.9, bf: 2.3, wa: 2.6 },
  shoot: { lean: 0.03, ft: 0.38, fs: 0.05, bt: -0.34, bs: -0.12, fa: 1.52, ff: 1.57, ba: -2.0, bf: 1.42, wa: 1.57 },
  // struck: the body thrown back from the chest, head and arms trailing
  hit: { lean: -0.32, ft: 0.25, fs: 0.2, bt: -0.45, bs: -0.05, fa: 0.1, ff: 0.9, ba: -0.7, bf: -0.2, wa: 2.7, dx: -4 },
  dodge: { lean: -0.42, ft: 0.62, fs: -0.15, bt: -0.3, bs: 0.2, fa: 0.35, ff: 1.3, ba: -0.7, bf: -0.1, wa: 2.5, dx: -10, dy: 4 },
  // running in: two frames, the legs passing, the weapon carried low and ready
  run: { lean: 0.32, ft: 0.85, fs: 0.05, bt: -0.55, bs: -1.05, fa: 0.25, ff: 1.0, ba: 0.6, bf: 1.4, wa: 2.0, dy: -2 },
  run2: { lean: 0.3, ft: -0.2, fs: -0.75, bt: 0.55, bs: 0.15, fa: 0.4, ff: 1.15, ba: -0.4, bf: 0.4, wa: 2.1, dy: 2 },
  land: { lean: 0.18, ft: 0.62, fs: -0.3, bt: -0.48, bs: -0.62, fa: 0.55, ff: 1.35, ba: -0.3, bf: 0.45, wa: 2.25, dy: 5 },
};
function poseFor(L) {
  const p = { ...(POSE[L.wt === 'bow' && L.pose === 'wind' ? 'shoot' : L.pose] || POSE.idle) };
  if (L.wt === 'lance') Object.assign(p, { idle: { fa: 0.55, ff: 1.45, wa: 1.85 }, wind: { lean: -0.08, fa: -0.35, ff: 1.25, wa: 1.66 }, strike: { fa: 1.5, ff: 1.58, wa: 1.6 }, run: { fa: 0.35, ff: 1.3, wa: 1.75 }, run2: { fa: 0.4, ff: 1.35, wa: 1.75 }, follow: { fa: 1.35, ff: 1.5, wa: 1.5 } }[L.pose] || {});
  if (L.wt === 'staff') Object.assign(p, { idle: { fa: 0.3, ff: 1.2, wa: 3.05 }, cast: { fa: 1.7, ff: 2.6, wa: 2.85 } }[L.pose] || {});
  if (L.wt === 'tome' && L.pose === 'idle') Object.assign(p, { fa: 0.5, ff: 1.5 });
  if (L.wt === 'bow' && L.pose === 'idle') Object.assign(p, { fa: 0.7, ff: 1.0, wa: 1.57 });
  return p;
}
// ---------------------------------------------------------------- the figure
function draw(g, L) {
  const p = L.params || poseFor(L), m = L.mount;
  const shadowW = m ? 64 : 30; ell(g, 0, -1, shadowW, 6, 0, 'rgba(0,0,0,0.3)', null);
  if (L.pose === 'cast' && (L.wt === 'tome' || L.wt === 'staff')) magicCircle(g, L);
  let hip, legs = true;
  if (m) { const seat = mount(g, L, p, 'back'); hip = seat; legs = false; }
  else hip = [(p.dx || 0) * 0.5, -58 + (p.dy || 0)];
  person(g, L, p, hip, legs);
  if (m) mount(g, L, p, 'front');
}
function tomeColour(L) { const w = L.w; if (!w) return ['200,240,220', '120,220,170']; return w.type === 'dark' ? ['220,170,255', '150,70,220'] : w.type === 'light' ? ['255,250,210', '255,210,90'] : L.wt === 'staff' ? ['210,255,230', '110,220,160'] : w.name === '雷擊' || w.name === '雷霆' ? ['230,240,255', '120,160,255'] : w.eff && w.eff.includes('fly') ? ['220,255,230', '90,210,140'] : ['255,230,170', '255,120,40']; }
// a ring of light on the ground under a caster, written with signs
function magicCircle(g, L) {
  const [hi, lo] = tomeColour(L); g.save(); g.globalCompositeOperation = 'lighter'; g.translate(L.mount ? 10 : 4, -2); g.scale(1, 0.24);
  const gl = g.createRadialGradient(0, 0, 0, 0, 0, 60); gl.addColorStop(0, `rgba(${lo},0.5)`); gl.addColorStop(1, `rgba(${lo},0)`); g.fillStyle = gl; g.beginPath(); g.arc(0, 0, 60, 0, 7); g.fill();
  g.strokeStyle = `rgba(${hi},0.95)`; for (const [r, w] of [[54, 2.4], [46, 1.2], [30, 1.6]]) { g.lineWidth = w; g.beginPath(); g.arc(0, 0, r, 0, 7); g.stroke(); }
  g.lineWidth = 1.4; g.beginPath(); for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2 + 0.3, b = a + Math.PI * 2 / 3; g.moveTo(Math.cos(a) * 46, Math.sin(a) * 46); g.lineTo(Math.cos(b) * 46, Math.sin(b) * 46); } g.stroke();
  g.fillStyle = `rgba(${hi},0.9)`; for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2; g.fillRect(Math.cos(a) * 50 - 1.2, Math.sin(a) * 50 - 1.2, 2.4, 2.4); }
  g.restore();
  // motes rising
  g.save(); g.globalCompositeOperation = 'lighter'; for (let k = 0; k < 9; k++) { const x = ((L.seed * (k + 3)) % 90) - 45, y = -8 - ((L.seed >> k) % 70); g.fillStyle = `rgba(${hi},${0.4 + (k % 3) * 0.2})`; g.beginPath(); g.arc(x, y, 1.2 + (k % 2), 0, 7); g.fill(); } g.restore();
}
function person(g, L, p, hip, onFoot) {
  const T = L.T, holy = HOLY[L.look], skin = L.skin, trim = L.trim;
  const cloth = L.robe ? (holy ? '#f4eee4' : T[0]) : L.heavy ? '#b4bccc' : T[0];
  const cloth2 = L.robe ? (holy ? T[0] : sh(T[0], 0.7)) : T[1];
  const pants = L.heavy ? '#8e96a8' : L.bare ? '#5a4232' : '#433a4e', boot = L.heavy ? '#a2aabc' : '#6a4630', glove = L.heavy ? '#a8b0c0' : '#7a5034';
  const lean = p.lean, up = v(Math.PI - lean), U = (o, d) => add(o, [up[0] * d, up[1] * d]);
  const nx = Math.cos(lean), ny = Math.sin(lean), at = (o, d) => [o[0] + nx * d, o[1] + ny * d];
  const waist = U(hip, 13), chest = U(hip, 27), sho = U(hip, 36), neck = U(hip, 39), head = add(neck, v(Math.PI - lean * 0.4, 12));
  const wind = L.pose === 'strike' || L.pose === 'follow' ? -0.85 : L.pose === 'run' || L.pose === 'run2' ? -1 : L.pose === 'hit' || L.pose === 'dodge' ? 0.55 : L.pose === 'wind' ? -0.25 : -0.4;
  const legsOf = (a1, a2) => { const knee = add(hip, v(a1, 28)), ank = add(knee, v(a2, 27)); return [knee, ank]; };
  const [bk, ba] = onFoot ? legsOf(p.bt, p.bs) : [add(hip, v(0.95, 23)), add(add(hip, v(0.95, 23)), v(-0.05, 23))];
  const [fk, fa] = onFoot ? legsOf(p.ft, p.fs) : [add(hip, v(1.05, 24)), add(add(hip, v(1.05, 24)), v(0.05, 23))];
  // ---- behind the body: the cape, long hair, the back coat-tail
  if (L.cape) cape(g, L, at(sho, -5), at(sho, 5), hip, wind, onFoot);
  headBack(g, L, head, lean, wind);
  const tails = !L.robe && !L.bare && !L.heavy;
  if (tails) celPoly(g, [at(hip, -9), at(hip, 0), [hip[0] - 4 + wind * 4, hip[1] + 18, hip[0] - 8 + wind * 10, hip[1] + 30], [hip[0] - 14 + wind * 10, hip[1] + 26, hip[0] - 12 + wind * 6, hip[1] + 20]], cool(cloth2, 0.85, 0.1), 2);
  // ---- the far leg and far arm, in shade
  leg(g, hip, bk, ba, cool(pants, 0.72, 0.2), cool(boot, 0.72, 0.2), L, true);
  const be = add(sho, v(p.ba, 19)), bh = add(be, v(p.bf, 18));
  const sleeveFar = L.bare ? cool(skin, 0.8, 0.16) : L.heavy ? '#7e8698' : cool(L.robe ? cloth : cloth2, 0.78, 0.18);
  limb(g, sho, be, bh, 4.6, 3.5, 2.9, sleeveFar, L.bare ? cool(skin, 0.8, 0.16) : sleeveFar); ell(g, bh[0], bh[1], 3.3, 3.3, 0, cool(L.heavy ? '#a8b0c0' : glove, 0.75, 0.2));
  // ---- the near leg
  leg(g, hip, fk, fa, pants, boot, L, false);
  // ---- the skirt of the coat, a robe, or plates over the hips
  if (L.robe) robe(g, L, hip, waist, at, cloth, cloth2, trim, wind, onFoot);
  if (tails) { celPoly(g, [at(hip, -2), at(hip, 10), [fk[0] + 6, fk[1] - 8, fk[0] + 4 + wind * 2, fk[1] - 2], [fk[0] - 4, fk[1] - 2, fk[0] - 6 + wind * 3, fk[1] - 6]], cloth2, 2); g.strokeStyle = trim; g.lineWidth = 1.6; g.beginPath(); g.moveTo(fk[0] - 5 + wind * 3, fk[1] - 5); g.quadraticCurveTo(fk[0], fk[1] - 1, fk[0] + 4 + wind * 2, fk[1] - 2); g.stroke(); }
  if (L.heavy) for (const [k1, s] of [[bk, 0.8], [fk, 1]]) { const a = lerp(hip, k1, 0.1), b = lerp(hip, k1, 0.62); seg(g, a, b, 7.5 * s, 6.5 * s, s < 1 ? '#8890a2' : '#c4ccdc', s < 1 ? null : '#f4f6fc'); g.strokeStyle = trim; g.lineWidth = 1.4; g.beginPath(); g.moveTo(...add(b, [-6, 3])); g.lineTo(...add(b, [6, 3])); g.stroke(); }
  if (L.bare && !L.robe) celPoly(g, [at(hip, -10), at(hip, 10), [hip[0] + 12, hip[1] + 14], [hip[0] - 2, hip[1] + 18], [hip[0] - 12, hip[1] + 12]], '#6a4a34', 2);
  // ---- the body
  const torso = [at(sho, -12), at(sho, 10.5), [...at(chest, 12.5), ...at(waist, 7.6)], at(hip, 9.6), at(hip, -9.6), [...at(waist, -8), ...at(chest, -12)]];
  const tc = L.bare ? skin : cloth;
  celPoly(g, torso, tc, 4, L.bare ? cool(skin, 0.82, 0.18) : cool(tc), undefined, 1.2, (g) => {
    if (L.bare) { // the chest and stomach muscles, a strap across
      g.strokeStyle = cool(skin, 0.62, 0.2); g.lineWidth = 0.9; g.beginPath(); g.moveTo(...at(U(hip, 22), 1)); g.quadraticCurveTo(...at(U(hip, 20), 8), ...at(U(hip, 23), 13)); g.moveTo(...at(U(hip, 12), 4)); g.lineTo(...at(U(hip, 4), 4)); g.moveTo(...at(U(hip, 9), 1)); g.lineTo(...at(U(hip, 9), 8)); g.stroke();
      g.strokeStyle = '#5a3a24'; g.lineWidth = 3.4; g.beginPath(); g.moveTo(...at(sho, 6)); g.lineTo(...at(hip, -8)); g.stroke(); g.strokeStyle = '#8a6040'; g.lineWidth = 1; g.stroke();
    } else if (L.heavy) { // the breastplate: a lit ridge, a gilded edge
      g.fillStyle = '#e8ecf4'; g.beginPath(); g.moveTo(...at(U(hip, 33), 2)); g.quadraticCurveTo(...at(chest, 10), ...at(U(hip, 14), 4)); g.lineTo(...at(U(hip, 14), 0)); g.quadraticCurveTo(...at(chest, 4), ...at(U(hip, 33), -2)); g.fill();
      g.strokeStyle = trim; g.lineWidth = 1.6; g.beginPath(); g.moveTo(...at(U(hip, 14), -10)); g.quadraticCurveTo(...at(U(hip, 11), 0), ...at(U(hip, 14), 9)); g.stroke();
      g.fillStyle = trim; g.beginPath(); g.arc(...at(U(hip, 24), 6), 2.2, 0, 7); g.fill();
    } else { // the collar opening, a line of trim down the front, a sash for the officers
      g.fillStyle = L.robe ? (holy ? '#ffffff' : '#ece4d4') : '#ece4d4'; g.beginPath(); g.moveTo(...at(sho, -2)); g.lineTo(...at(sho, 8)); g.lineTo(...at(U(hip, 26), 6)); g.closePath(); g.fill();
      g.strokeStyle = trim; g.lineWidth = 1.5; g.beginPath(); g.moveTo(...at(sho, 8)); g.lineTo(...at(U(hip, 26), 6)); g.lineTo(...at(U(hip, 4), 8.5)); g.stroke();
      g.fillStyle = warm(trim, 1.2); for (const d of [20, 14, 8]) { g.beginPath(); g.arc(...at(U(hip, d), 7), 1, 0, 7); g.fill(); }
      if (L.tier === 2 || L.cape) { g.strokeStyle = sh(trim, 0.8); g.lineWidth = 3; g.beginPath(); g.moveTo(...at(sho, -8)); g.lineTo(...at(U(hip, 8), 8)); g.stroke(); g.strokeStyle = warm(trim, 1.3); g.lineWidth = 0.8; g.stroke(); }
      g.strokeStyle = cool(cloth, 0.6, 0.2); g.lineWidth = 0.8; g.beginPath(); g.moveTo(...at(U(hip, 20), -6)); g.quadraticCurveTo(...at(U(hip, 14), -3), ...at(U(hip, 8), -6)); g.stroke();
    }
  });
  // the belt: leather, a gold buckle, a pouch at the back
  if (!L.heavy) { const b1 = U(hip, 4), b2 = U(hip, -1); poly(g, [at(b1, -10.5), at(b1, 10), at(b2, 10.2), at(b2, -10.5)], L.robe ? sh(trim, 0.85) : '#4a3022', undefined, 1); poly(g, [at(U(hip, 3.4), 3.5), at(U(hip, 3.4), 8), at(U(hip, -0.4), 8), at(U(hip, -0.4), 3.5)], '#e8c868', '#6a4a14', 0.8); if (!L.robe) poly(g, [at(b2, -9), at(b2, -3), at(U(hip, -7), -3.5), at(U(hip, -7), -8.5)], '#6a4630', undefined, 0.9); }
  else poly(g, [at(U(hip, 4), -11), at(U(hip, 4), 11), at(U(hip, -2), 11), at(U(hip, -2), -11)], '#6a7284', undefined, 1);
  if (L.hood && !L.helm) celPoly(g, [at(sho, -13), [...at(U(sho, 3), -6), ...[neck[0] - 4, neck[1] - 4]], at(sho, 9), [...at(U(sho, -12), 10), ...at(U(sho, -14), 0)], [...at(U(sho, -14), -10), ...at(U(sho, -8), -14)]], cloth2, 3);
  if (L.scarf) scarf(g, L, neck, at, U, sho, wind);
  // ---- the head
  headOf(g, L, head, lean);
  // ---- the near arm and the weapon
  const fe = add(sho, v(p.fa, 19)), fh = add(fe, v(p.ff, 18)), sleeve = L.bare ? skin : L.heavy ? '#b4bccc' : L.robe ? cloth : cloth2;
  if (L.wt !== 'bow') weapon(g, L, p, fh, 'back');
  limb(g, sho, fe, fh, 5, 3.8, 3.2, sleeve, L.bare ? skin : L.heavy ? '#c4ccdc' : sleeve, warm(sleeve, 1.35));
  if (!L.bare && !L.heavy) { const cuff = lerp(fe, fh, 0.78); seg(g, cuff, lerp(fe, fh, 0.95), 3.9, 3.7, L.robe ? trim : glove); }
  if (L.robe && !L.bare) poly(g, [add(fe, v(p.ff + 1.57, 4.8)), add(fe, v(p.ff - 1.57, 4.8)), add(fh, v(p.ff - 1.8, 8)), add(fh, v(p.ff + 1.8, 8))], cloth, undefined, 1);
  pauldron(g, L, sho, lean, trim);
  ell(g, fh[0], fh[1], 3.8, 3.8, 0, L.bare ? skin : L.heavy ? '#b4bccc' : glove);
  weapon(g, L, p, fh, 'front');
}
function leg(g, hip, k, a, pants, boot, L, far) {
  // trousers to the knee, a tall boot below with a folded cuff, a shaped foot
  const cuffT = lerp(k, a, 0.12), up2 = lerp(k, a, -0.05);
  limb(g, hip, k, a, 7, 4.8, 3.8, pants, boot, far ? null : warm(pants, 1.4));
  seg(g, up2, cuffT, 5.6, 5.4, far ? cool(boot, 0.85, 0.1) : warm(boot, 1.15));
  const foot = [[a[0] - 4.5, a[1] - 4], [a[0] + 3, a[1] - 4.5], [a[0] + 10, a[1] - 0.5], [a[0] + 11, a[1] + 3], [a[0] - 4.5, a[1] + 3]];
  celPoly(g, foot, boot, 1.6); g.fillStyle = '#2a1a16'; g.fillRect(a[0] - 4.5, a[1] + 1.8, 15.5, 1.4);
  if (L.heavy) { ell(g, k[0], k[1], 5.6, 4.8, 0, far ? '#8890a2' : '#d0d6e4'); }
}
function cape(g, L, s0, s1, hip, wind, onFoot) {
  const sw = wind * 16, bot = hip[1] + (onFoot ? 48 : 30), T = L.T, out = T[1], lining = L.trim === '#e8c060' ? sh(T[0], 0.8) : L.trim;
  const shape = [s0, [s0[0] - 14 + sw * 0.3, (s0[1] + bot) / 2, s0[0] - 22 + sw, bot], [s0[0] - 17 + sw, bot + 5, s0[0] - 11 + sw, bot - 1], [s0[0] - 5 + sw, bot + 6, s0[0] + 1 + sw * 0.8, bot], [s0[0] + 6 + sw * 0.2, hip[1] + 12, s1[0], s1[1]]];
  cel(g, (g) => pathOf(g, shape), out, 4, cool(out, 0.65, 0.24), undefined, 1.2, (g) => {
    // the lining shows along the inside edge as it lifts, folds run down from the shoulder
    g.fillStyle = lining; g.beginPath(); g.moveTo(s1[0], s1[1]); g.quadraticCurveTo(s0[0] + 8 + sw * 0.2, hip[1] + 10, s0[0] + 1 + sw * 0.8, bot); g.lineTo(s0[0] - 4 + sw * 0.8, bot); g.quadraticCurveTo(s0[0] + 2 + sw * 0.2, hip[1] + 8, s1[0] - 4, s1[1] + 4); g.fill();
    g.strokeStyle = cool(out, 0.5, 0.26); g.lineWidth = 1; for (const k of [0.3, 0.6]) { g.beginPath(); g.moveTo(s0[0] - 2, s0[1] + 6); g.quadraticCurveTo(s0[0] - 10 * k + sw * 0.3 * k, (s0[1] + bot) / 2, s0[0] - 18 * k + sw * (0.4 + k * 0.5), bot); g.stroke(); }
    g.strokeStyle = warm(out, 1.35); g.lineWidth = 1.2; g.beginPath(); g.moveTo(s0[0] + 1, s0[1] + 4); g.quadraticCurveTo(s0[0] - 6, (s0[1] + bot) / 2 - 6, s0[0] - 10 + sw * 0.6, bot - 12); g.stroke();
  });
  g.strokeStyle = L.trim; g.lineWidth = 2; g.beginPath(); g.moveTo(s0[0] - 22 + sw, bot); g.quadraticCurveTo(s0[0] - 17 + sw, bot + 5, s0[0] - 11 + sw, bot - 1); g.quadraticCurveTo(s0[0] - 5 + sw, bot + 6, s0[0] + 1 + sw * 0.8, bot); g.stroke();
}
function robe(g, L, hip, waist, at, cloth, cloth2, trim, wind, onFoot) {
  // a long skirt flaring to the ankles, a front panel in the second colour, a trimmed hem, folds
  const fl = L.pose === 'strike' ? 10 : L.pose === 'hit' || L.pose === 'dodge' ? -6 : 0, hem = onFoot ? 1 : hip[1] + 26;
  const sk = [at(waist, -10), at(waist, 9), [hip[0] + 18 + fl, hip[1] + 26, hip[0] + 24 + fl, hem - 3], [hip[0] + 8, hem + 2, hip[0] - 4 + fl * 0.5, hem], [hip[0] - 14, hem + 1, hip[0] - 22 + fl * 0.5 + wind * 6, hem - 2], [hip[0] - 16, hip[1] + 20, ...at(waist, -10)]];
  celPoly(g, sk, cloth, 5, undefined, undefined, 1.2, (g) => {
    g.fillStyle = cloth2; g.beginPath(); g.moveTo(...at(waist, 1)); g.lineTo(...at(waist, 7)); g.lineTo(hip[0] + 16 + fl, hem); g.lineTo(hip[0] + 4 + fl * 0.6, hem); g.closePath(); g.fill();
    g.strokeStyle = trim; g.lineWidth = 1.4; g.beginPath(); g.moveTo(...at(waist, 1)); g.lineTo(hip[0] + 4 + fl * 0.6, hem); g.moveTo(...at(waist, 7)); g.lineTo(hip[0] + 16 + fl, hem); g.stroke();
    g.strokeStyle = cool(cloth, 0.55, 0.24); g.lineWidth = 0.9; for (const d of [-14, -6, 22]) { g.beginPath(); g.moveTo(hip[0] + d * 0.3, hip[1] + 8); g.quadraticCurveTo(hip[0] + d * 0.7, hip[1] + 30, hip[0] + d + fl * 0.5, hem - 3); g.stroke(); }
    g.strokeStyle = trim; g.lineWidth = 2.4; g.beginPath(); g.moveTo(hip[0] - 22 + fl * 0.5 + wind * 6, hem - 3); g.quadraticCurveTo(hip[0] - 14, hem, hip[0] - 4 + fl * 0.5, hem - 1); g.quadraticCurveTo(hip[0] + 8, hem + 1, hip[0] + 24 + fl, hem - 4); g.stroke();
    g.fillStyle = warm(trim, 1.3); for (let k = 0; k < 7; k++) { const x = hip[0] - 18 + k * 6.5 + fl * 0.5; g.beginPath(); g.arc(x, hem - 2.5 - Math.sin(k / 6 * Math.PI) * 0.8, 0.9, 0, 7); g.fill(); }
  });
  // a sash with hanging ends
  poly(g, [at(waist, -9), at(waist, 9), at(add(waist, [0, 4]), 9.5), at(add(waist, [0, 4]), -9.5)], trim, undefined, 1);
  poly(g, [at(add(waist, [0, 3]), -8), [hip[0] - 12 + wind * 6, hip[1] + 14], [hip[0] - 8 + wind * 6, hip[1] + 16], at(add(waist, [0, 4]), -4)], sh(trim, 0.85), undefined, 1);
}
function scarf(g, L, neck, at, U, sho, wind) {
  const c = L.scarf, t0 = at(U(sho, 2), -6), sw = wind * 14;
  // the ends stream back, rippling
  celPoly(g, [t0, [t0[0] - 10, t0[1] - 2 + sw * 0.1, t0[0] - 20 + sw, t0[1] + 4], [t0[0] - 28 + sw * 1.3, t0[1] + 10, t0[0] - 34 + sw * 1.5, t0[1] + 6], [t0[0] - 30 + sw * 1.3, t0[1] + 15], [t0[0] - 20 + sw, t0[1] + 14, t0[0] - 10 + sw * 0.4, t0[1] + 10], [t0[0] - 4, t0[1] + 8]], sh(c, 0.92), 2.5);
  celPoly(g, [add(t0, [0, 3]), [t0[0] - 8, t0[1] + 10, t0[0] - 16 + sw * 0.8, t0[1] + 16], [t0[0] - 22 + sw, t0[1] + 22], [t0[0] - 12 + sw * 0.5, t0[1] + 20, t0[0] - 3, t0[1] + 10]], cool(c, 0.82, 0.14), 2);
  // wound round the neck
  celPoly(g, [at(U(sho, 6), -8), [...at(U(sho, 9), 0), ...at(U(sho, 6), 8)], at(U(sho, 0), 9), [...at(U(sho, -2), 0), ...at(U(sho, 0), -9)]], c, 3, undefined, undefined, 1.1, (g) => { g.strokeStyle = cool(c, 0.6, 0.2); g.lineWidth = 0.8; g.beginPath(); g.moveTo(...at(U(sho, 4), -7)); g.quadraticCurveTo(...at(U(sho, 6), 0), ...at(U(sho, 3), 8)); g.stroke(); });
}
function pauldron(g, L, sho, lean, trim) {
  if (L.bare && !L.cape) return;
  const r = L.heavy || L.helm ? 8.5 : L.cape ? 7 : L.robe ? 0 : 5.5; if (!r) return;
  const base = L.heavy || L.helm ? '#c4ccdc' : L.T[1];
  g.save(); g.translate(sho[0], sho[1]); g.rotate(lean);
  // layered plates (or a leather cap), a trim along the edge, a gleam
  if (L.heavy || L.helm) celPoly(g, [[-r - 1, 4], [-r - 1, -4, -r * 0.2, -r], [r * 0.9, -r + 1, r + 1, 3], [r * 0.4, r * 0.8], [-r * 0.5, r * 0.9]], cool(base, 0.92, 0.08), 3);
  celPoly(g, [[-r, 2], [-r, -5, 0, -r + 0.5], [r, -r + 1, r, 1.5], [0, -1.5, -r, 2]], base, 3, undefined, undefined, 1.2, (g) => { g.strokeStyle = 'rgba(255,255,255,0.75)'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(-r * 0.4, -r * 0.65); g.quadraticCurveTo(r * 0.2, -r * 0.9, r * 0.6, -r * 0.55); g.stroke(); });
  g.strokeStyle = trim; g.lineWidth = 1.5; g.beginPath(); g.moveTo(-r + 0.5, 1.5); g.quadraticCurveTo(0, -2, r - 0.5, 1); g.stroke();
  if (L.cape) { ell(g, r * 0.2, 1, 2.2, 2.2, 0, '#e8c868', '#6a4a14', 0.8); g.fillStyle = '#ffffff'; g.fillRect(r * 0.2 - 1, 0, 1, 1); }
  g.restore();
}
// ---------------------------------------------------------------- the head: hair behind, then face, eye, hair and headgear
function headBack(g, L, h, lean, wind) {
  if (L.helm || L.hood || (L.veil && !(L.P && L.P.veil))) return;
  const hc = L.hc, hair = L.hair, long = ['pony', 'crown', 'long', 'flow', 'twin', 'tied', 'longwhite', 'longf', 'braids', 'viking', 'tailm', 'bob'].includes(hair) || (L.P && L.P.veil);
  if (!long) return;
  g.save(); g.translate(h[0], h[1]); g.rotate(lean * 0.4); const sw = wind * 5;
  if (hair === 'pony' || hair === 'tailm' || hair === 'tied') celPoly(g, [[-6, -14], [-20 + sw * 0.4, -16, -24 + sw, -4], [-26 + sw * 1.4, 8, -22 + sw * 1.6, 24], [-19 + sw, 14], [-17 + sw * 1.2, 20], [-15 + sw * 0.6, 6, -6, -6]], hc, 3, cool(hc, 0.66, 0.24));
  else if (hair === 'twin') celPoly(g, [[-6, -15], [-22 + sw * 0.5, -16, -22 + sw, 4], [-21 + sw * 1.4, 18, -16 + sw * 1.4, 32], [-14 + sw, 22], [-12 + sw * 0.6, 6, -4, -8]], hc, 3, cool(hc, 0.66, 0.24));
  else if (hair === 'bob') celPoly(g, [[-4, -14], [-16, -12, -15, 6], [-13, 10], [-10, 7], [-7, 11], [-4, 2]], cool(hc, 0.85, 0.12), 2);
  else if (hair === 'braids') { for (let k = 0; k < 6; k++) ell(g, -8 + sw * k * 0.2, 6 + k * 5.5, 3.4 - k * 0.15, 3, 0.2, k % 2 ? hc : cool(hc, 0.8, 0.14)); }
  else celPoly(g, [[-4, -15], [-16, -12, -16 + sw * 0.4, 4], [-17 + sw, 18, -14 + sw * 1.2, 30], [-11 + sw, 24], [-8 + sw, 30], [-6 + sw * 0.6, 22], [-3, 26], [-2, 12, 2, 0]], hc, 3, cool(hc, 0.66, 0.24), undefined, 1.1, (g) => { g.strokeStyle = warm(hc, 1.3); g.lineWidth = 0.8; for (const x of [-12, -8]) { g.beginPath(); g.moveTo(x + 2, 0); g.quadraticCurveTo(x - 1, 14, x + sw, 24); g.stroke(); } });
  g.restore();
}
function headOf(g, L, h, lean) {
  const skin = L.skin, hc = L.hc, P = L.P || {}, pose = L.pose, sl = cool(skin, 0.42, 0.3), sk2 = cool(skin, 0.8, 0.22);
  g.save(); g.translate(h[0], h[1]); g.rotate(lean * 0.3); g.scale(1.06, 1.06);
  // ---- the neck, in the shade of the jaw
  celPoly(g, [[-4.5, 5], [3, 8], [2.4, 16], [-5.4, 15]], sk2, 1.4, cool(skin, 0.68, 0.26), sl, 1);
  // ---- the face, three-quarters toward the foe as the old battle sprites drew it: the far cheek makes the front
  // edge, a firm jaw running to a narrow chin, the side of the head in shade
  const face = [[-7, 7], [-13, 1, -12, -12, -2, -13.5], [5, -14.5, 10, -9, 10.4, -4.5], [10.1, -1.6], [10.9, 1.4], [10.7, 4.6, 9.3, 8.4], [8, 10.6], [6.8, 11.2], [5.2, 11, 2.6, 9.2], [-0.8, 6.8]];
  cel(g, (g) => pathOf(g, face), skin, 1.6, sk2, sl, 1.1, (g) => {
    g.fillStyle = sk2; g.beginPath(); g.moveTo(-14, -6); g.lineTo(1.4, -5); g.quadraticCurveTo(2.6, 1, 3.6, 3.4); g.quadraticCurveTo(4.2, 7, 5.2, 11.6); g.lineTo(-14, 12); g.closePath(); g.fill();
    g.fillStyle = cool(skin, 0.7, 0.26); g.beginPath(); g.moveTo(2.4, 9.6); g.quadraticCurveTo(5.4, 11.4, 8, 10.6); g.lineTo(8.2, 12.5); g.lineTo(2, 12); g.fill();
    g.fillStyle = 'rgba(255,250,240,0.35)'; g.beginPath(); g.ellipse(7.6, 3.2, 1.8, 1.1, -0.3, 0, 7); g.fill();
  });
  ell(g, -2.2, 0.8, 2, 3, 0.15, sk2, sl, 0.9); g.strokeStyle = cool(skin, 0.55, 0.26); g.lineWidth = 0.7; g.beginPath(); g.arc(-1.9, 0.8, 1.1, -1.3, 1.5); g.stroke();
  // the nose: a small wedge breaking the edge of the face, its shadow
  poly(g, [[9.8, -0.6], [11.7, 3.1], [10.1, 3.8]], skin, null); g.strokeStyle = sl; g.lineWidth = 0.8; g.beginPath(); g.moveTo(10.2, -0.4); g.lineTo(11.7, 3.1); g.lineTo(10.1, 3.8); g.stroke(); g.fillStyle = sk2; g.beginPath(); g.moveTo(8.8, 2.2); g.lineTo(10, 3.8); g.lineTo(8.6, 3.6); g.fill();
  // ---- the eyes: the near one keen and narrow under a heavy lash line, the far one a sliver at the edge
  const ec = L.ec, angry = pose === 'strike' || pose === 'wind', hurt = pose === 'hit', nar = angry ? 0.78 : 1;
  if (hurt) { g.strokeStyle = LASH; g.lineWidth = 1.2; g.beginPath(); g.moveTo(3.2, -1.4); g.lineTo(7.8, -0.2); g.lineTo(3.6, 1.2); g.stroke(); }
  else if (P.patch) { poly(g, [[3, -2.6], [8.2, -2.8], [8, 2], [3.4, 2]], '#221a1c', '#0e0a0c', 0.8); g.strokeStyle = '#1a1416'; g.lineWidth = 0.9; g.beginPath(); g.moveTo(3, -2.2); g.lineTo(-4, -6.4); g.stroke(); }
  else {
    const white = [[3.2, -1.7 * nar], [5.8, -2.6 * nar], [7.9, -1.7 * nar], [7.6, 1.3], [5, 1.8], [3.4, 0.6]];
    poly(g, white, '#f8f8fc', null);
    g.save(); pathOf(g, white); g.clip(); const ig = g.createLinearGradient(0, -2.4, 0, 2); ig.addColorStop(0, cool(ec, 0.28, 0.2)); ig.addColorStop(0.55, ec); ig.addColorStop(1, warm(ec, 1.45)); g.fillStyle = ig; g.beginPath(); g.ellipse(6.1, 0, 1.6, 2.2, 0, 0, 7); g.fill();
    g.fillStyle = cool(ec, 0.2, 0.2); g.beginPath(); g.ellipse(6.25, -0.1, 0.7, 1.1, 0, 0, 7); g.fill(); g.fillStyle = '#ffffff'; g.beginPath(); g.ellipse(5.6, -0.8, 0.55, 0.7, 0, 0, 7); g.fill();
    g.fillStyle = 'rgba(60,30,80,0.3)'; g.fillRect(2, -3.4, 7, 1.6); g.restore();
    g.fillStyle = LASH; g.beginPath(); g.moveTo(2.2, -0.4); g.lineTo(3.1, -1.9 * nar); g.quadraticCurveTo(5.6, -3.3 * nar, 8.3, -2 * nar); g.lineTo(8, -1.1 * nar); g.quadraticCurveTo(5.6, -2.2 * nar, 3.5, -1); g.closePath(); g.fill();
    if (L.f) { g.lineWidth = 0.7; g.strokeStyle = LASH; g.beginPath(); g.moveTo(2.6, -1); g.lineTo(1.4, -2); g.stroke(); }
    g.strokeStyle = sl; g.lineWidth = 0.6; g.beginPath(); g.moveTo(3.8, 1.6); g.lineTo(7.2, 1.4); g.stroke();
    // the far eye
    poly(g, [[9.1, -1.4 * nar], [10.1, -1.7 * nar], [10.15, 1], [9.2, 1.1]], '#f0f0f6', null); g.fillStyle = cool(ec, 0.35, 0.2); g.beginPath(); g.ellipse(9.75, -0.1, 0.55, 1.5, 0, 0, 7); g.fill(); g.strokeStyle = LASH; g.lineWidth = 0.9; g.beginPath(); g.moveTo(8.9, -1.6 * nar); g.lineTo(10.3, -1.9 * nar); g.stroke();
  }
  // brows: straight and strong, drawn down in a fight, lifted in pain
  g.strokeStyle = cool(hc, 0.5, 0.2); g.lineWidth = L.f ? 0.8 : 1.3; g.beginPath(); g.moveTo(2.4, angry ? -4.8 : hurt ? -3.4 : -4.2); g.quadraticCurveTo(5.4, angry ? -4.8 : -5.2, 8.2, angry ? -3.4 : hurt ? -5 : -4.4); g.moveTo(9, angry ? -3.4 : -4.4); g.lineTo(10.4, angry ? -3.8 : -4.8); g.stroke();
  // the mouth: a short line, open in a shout
  if (angry || hurt) { g.fillStyle = '#4a1a22'; g.beginPath(); g.moveTo(7.3, 6.2); g.lineTo(9.6, 5.9); g.lineTo(9.1, 7.9); g.lineTo(7.8, 7.6); g.closePath(); g.fill(); g.fillStyle = '#f4f0f0'; g.fillRect(7.8, 6.1, 1.6, 0.6); }
  else { g.strokeStyle = sl; g.lineWidth = 0.8; g.beginPath(); g.moveTo(7.2, 6.6); g.lineTo(9.4, 6.3); g.stroke(); if (L.f) { g.fillStyle = 'rgba(200,90,100,0.35)'; g.fillRect(7.6, 6.7, 1.6, 0.7); } }
  if (P.glasses) { g.strokeStyle = '#5a4a3a'; g.lineWidth = 0.8; g.beginPath(); g.ellipse(5.7, 0, 2.9, 2.5, 0, 0, 7); g.stroke(); g.beginPath(); g.moveTo(8.6, -0.3); g.lineTo(10.2, -0.5); g.moveTo(2.8, -0.4); g.lineTo(-2, -1); g.stroke(); }
  if (P.mask === 1) { poly(g, [[6.2, -8], [10.6, -7], [11.2, 1], [10.8, 4.4], [7.4, 4], [6.6, -2]], '#f6f6fa', '#8a8a9a', 0.8); g.fillStyle = '#1a1a24'; g.beginPath(); g.ellipse(9, -0.6, 1.2, 0.8, 0, 0, 7); g.fill(); }
  if (P.mask === 'lower') poly(g, [[0.6, 2.6], [11.4, 1.6], [9.6, 10.2], [5.2, 11.8], [-1.2, 7]], L.T[1]);
  if (L.beard) beardOf(g, L);
  // ---- hair and what goes on the head
  if (L.helm) { helm(g, L); g.restore(); return; }
  if (L.hood) { hood(g, L, L.T[1]); g.restore(); return; }
  if (L.veil) { hood(g, L, P.veil ? '#f6f2ec' : '#2a2a34', true); g.restore(); return; }
  if (L.hair === 'bald') { g.fillStyle = 'rgba(255,255,255,0.4)'; g.beginPath(); g.ellipse(0, -10, 5, 2, -0.3, 0, 7); g.fill(); g.restore(); return; }
  hairOf(g, L);
  if (L.hat) wizardHat(g, L);
  if (P.band || P.hair === 'bandana') { const c = P.band || P.ac || '#a83030'; g.strokeStyle = inkOf(c); g.lineWidth = 3.6; g.beginPath(); g.moveTo(-12, -6); g.quadraticCurveTo(0, -12, 11, -7); g.stroke(); g.strokeStyle = c; g.lineWidth = 2.4; g.stroke(); celPoly(g, [[-12, -6], [-22 - (pose === 'strike' ? 6 : 0), -6, -26 - (pose === 'strike' ? 8 : 0), -1], [-20, 0], [-11, -3]], c, 1.5); }
  if (P.hair === 'cap') { celPoly(g, [[-13, -4], [-14, -16, 0, -17], [10, -17, 11, -8], [18, -6], [17, -4.5], [10, -5], [-4, -6, -13, -4]], P.ac || '#3a4a6a', 3); }
  if (P.circlet || L.look === 'princess' || L.look === 'queen') { g.strokeStyle = '#7a5a14'; g.lineWidth = 2.4; g.beginPath(); g.moveTo(-11, -8); g.quadraticCurveTo(0, -13, 10.6, -8); g.stroke(); g.strokeStyle = '#f0d070'; g.lineWidth = 1.4; g.stroke(); poly(g, [[9.6, -11.5], [11.4, -9], [9.6, -6.6], [7.8, -9]], '#8ad0ff', '#2a5a8a', 0.7); }
  if (P.crown) { poly(g, [[-8, -12], [-9, -21], [-4, -16], [0, -23], [4, -16], [8, -21], [7.4, -12]], '#e8c040', '#7a5a10', 1); ell(g, 0, -14.5, 1.4, 1.4, 0, '#c83a3a', null); }
  if (P.hat === 'feather') { celPoly(g, [[-16, -8], [-12, -20, 0, -20], [12, -20, 16, -8], [6, -11, -16, -8]], L.T[0], 3); celPoly(g, [[-4, -18], [-18, -30, -30, -26], [-18, -22, -4, -15]], '#f4f0e8', 2); }
  if (P.hat === 'tricorn') celPoly(g, [[-17, -7], [-12, -22, 0, -20], [12, -22, 17, -7], [0, -11]], '#22222c', 3);
  if (P.mitre) celPoly(g, [[-9, -9], [-8, -26], [0, -32], [8, -26], [9, -9]], '#f6f2ea', 3);
  g.restore();
}
function beardOf(g, L) {
  const b = L.beard, lng = L.longBeard;
  celPoly(g, lng ? [[-1.2, 3], [0, 9, 4.6, 11.8], [8.4, 10.8], [9.8, 7.6], [10, 16, 7.4, 26], [4.4, 33], [4, 24], [0.4, 28], [0.4, 17, -1.8, 9]] : [[-1.2, 3], [0, 9, 4.4, 12.2], [8.4, 11.4], [9.9, 7.6], [8.6, 8.6, 7, 8], [4, 8.6, 1.6, 5]], b, 1.6, cool(b, 0.68, 0.22), undefined, 0.9, (g) => { g.strokeStyle = warm(b, 1.35); g.lineWidth = 0.6; for (const x of [2, 4.6, 7]) { g.beginPath(); g.moveTo(x, 9); g.quadraticCurveTo(x + 0.6, lng ? 18 : 11, x - 1, lng ? 28 : 12); g.stroke(); } });
  poly(g, [[6.8, 5.3], [9.8, 4.9], [10.1, 6.6], [8, 6]], b, undefined, 0.7);
}
// a lock of hair: from a root w wide to a point, bowed sideways by b
const lk = (rx, ry, tx, ty, w, b = 0) => { const dx = tx - rx, dy = ty - ry, l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l, mx = (rx + tx) / 2 + nx * b, my = (ry + ty) / 2 + ny * b; return [[rx + nx * w / 2, ry + ny * w / 2], [mx + nx * w * 0.42, my + ny * w * 0.42, tx, ty], [mx - nx * w * 0.42, my - ny * w * 0.42, rx - nx * w / 2, ry - ny * w / 2]]; };
// shapes drawn as one mass: one outline round them all, filled on a layer of their own where deco can shade them
function group(g, shapes, base, line, deco) {
  g.strokeStyle = line; g.lineWidth = 2; for (const s of shapes) { pathOf(g, s); g.stroke(); }
  const C = document.createElement('canvas'); C.width = g.canvas.width; C.height = g.canvas.height; const l = C.getContext('2d'); l.setTransform(g.getTransform()); l.lineJoin = l.lineCap = 'round';
  l.fillStyle = base; for (const s of shapes) { pathOf(l, s); l.fill(); }
  if (deco) { l.globalCompositeOperation = 'source-atop'; deco(l); }
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(C, 0, 0); g.restore();
}
function hairOf(g, L) {
  // hair built from locks the way the old battle sprites drew it: a crown over the skull, pointed locks falling over
  // the brow and in front of the ear, more sweeping back behind; base, shadow and a band of light
  const hc = L.hc, s = L.hair, sw = L.pose === 'strike' ? -2 : L.pose === 'hit' ? 1.5 : 0, f = L.f;
  const crown = [[-12, 6], [-16, -6, -10, -17, 0, -17.5], [8, -18, 12.4, -12, 11.4, -6.4], [6, -7.6, 0, -6.6], [-2.4, -2, -3, 6]];
  const slick = s === 'slick' || s === 'judge', buzz = s === 'buzz';
  const fringe = slick ? [lk(8, -12, 10.8, -6.6, 3.6, 0.4)] : buzz ? [] : f
    ? [lk(9, -12.5, 12, -2.6, 4.4, 0.8), lk(6.6, -13, 9.2, -1, 4.4, 0.7), lk(4, -13, 6, -3, 4.2, 0.5), lk(1.6, -12, 2.6, -1.6, 4.2, 0.2)]
    : [lk(9, -12.5, 12.4, -3.8, 4.4, 0.9), lk(6.6, -13, 9.4, -2.4, 4.2, 0.7), lk(4.2, -13, 6.2, -4.6, 4, 0.5), lk(1.8, -12, 2.8, -3, 4, 0.2)];
  const side = buzz || slick ? [] : [lk(-0.4, -9, 0.6, f ? 9 : 5.4, f ? 4.2 : 3.6, -0.5)];
  let back;
  if (buzz) back = [];
  else if (slick) back = [lk(6, -13.5, -13 + sw, -11, 5.4, -1.6), lk(3, -10, -15 + sw, -5, 5.2, -1.2), lk(0, -6, -13 + sw, 1, 4.6, -0.8)];
  else if (['wild', 'spiky', 'tailm', 'viking'].includes(s)) back = [lk(-1, -15, -4 + sw, -23.5, 5, -1.2), lk(-4, -14, -14 + sw, -19.5, 5.4, -1.4), lk(-6, -11, -19 + sw, -9, 5.6, -1.2), lk(-7, -6, -18 + sw, 1, 5.4, -0.8), lk(-6, -1, -14 + sw, 8.5, 5, -0.4), lk(3, -15.5, 4 + sw, -22, 4.6, 0.8)];
  else if (['messy', 'scruffy', 'curly', 'cap', 'bandana'].includes(s)) back = [lk(-3, -15, -12 + sw, -17, 5.2, -1.2), lk(-6, -10, -17 + sw, -6, 5.4, -1), lk(-6, -4, -16 + sw, 4, 5, -0.6), lk(-5, 1, -11 + sw, 9, 4.6, -0.3), lk(2, -15.5, 1 + sw, -20.5, 4.4, -0.6)];
  else if (f) back = [lk(-4, -13, -13 + sw, -6, 5.2, -1), lk(-6, -6, -14 + sw, 5, 5, -0.6), lk(-5, 0, -9 + sw, 10, 4.6, -0.3)];
  else back = [lk(-4, -14, -13 + sw, -10, 5.2, -1), lk(-6, -8, -15 + sw, -1, 5.2, -0.8), lk(-6, -2, -12.5 + sw, 6.5, 4.8, -0.4)];
  const all = [...back, crown, ...side, ...fringe];
  group(g, all, hc, inkOf(hc), (l) => {
    // shadow on the underside of every lock (the mass shifted toward the light leaves its shaded edge), the back of the head darker
    l.fillStyle = cool(hc, 0.62, 0.26); l.fillRect(-40, -40, 80, 80);
    l.save(); l.translate(1.3, -1.1); l.fillStyle = hc; for (const q of all) { pathOf(l, q); l.fill(); } l.restore();
    l.fillStyle = cool(hc, 0.72, 0.2); l.globalAlpha = 0.7; l.beginPath(); l.ellipse(-10, -2, 8, 10, 0, 0, 7); l.fill(); l.globalAlpha = 1;
    // the band of light round the crown, broken into points along its lower edge
    const hi = warm(hc, lum(hc) < 0.2 ? 1.55 : 1.4); l.fillStyle = hi; l.globalAlpha = 0.85; l.beginPath(); l.moveTo(-9.5, -12); l.quadraticCurveTo(-1, -18.2, 8.4, -13.6); for (let k = 0; k <= 9; k++) { const t = 1 - k / 9, x = -9.5 + t * 17.9, y = -12.6 - Math.sin(t * Math.PI) * 3.2 + (k % 2 ? 3.2 : 1); l.lineTo(x, y); } l.closePath(); l.fill(); l.globalAlpha = 1;
    l.fillStyle = 'rgba(255,255,255,0.85)'; l.fillRect(-2.4, -16.4, 0.9, 2); l.fillRect(-0.6, -16.8, 0.9, 1.6);
    // strands down the locks
    l.strokeStyle = cool(hc, 0.55, 0.26); l.lineWidth = 0.55; for (const q of [...fringe, ...back]) { const r = [(q[0][0] + q[2][4]) / 2, (q[0][1] + q[2][5]) / 2], t = [q[1][2], q[1][3]]; l.beginPath(); l.moveTo(...lerp(r, t, 0.15)); l.quadraticCurveTo(q[1][0], q[1][1], ...lerp(r, t, 0.8)); l.stroke(); }
    l.strokeStyle = warm(hc, 1.3); l.lineWidth = 0.6; for (const q of fringe) { const t = [q[1][2], q[1][3]]; l.beginPath(); l.moveTo(t[0] - 1.6, t[1] - 5); l.lineTo(t[0] - 0.4, t[1] - 1.6); l.stroke(); }
  });
  if (L.P && L.P.ahoge) { g.strokeStyle = inkOf(hc); g.lineWidth = 1.6; g.beginPath(); g.moveTo(1, -17); g.quadraticCurveTo(4, -26, 10, -24); g.stroke(); }
}
const inkHair = (h) => (lum(h) < 0.2 && Math.max(...rgb(h)) - Math.min(...rgb(h)) < 28 ? hx(...rgb(h).map((v, i) => v * 0.4 + [58, 58, 122][i] * 0.6)) : h);
const lum = (c) => { const [r, g, b] = rgb(c); return (r * 0.3 + g * 0.59 + b * 0.11) / 255; };
function helm(g, L) {
  // an open-faced helm: a lit dome, a brim over the brow, a cheek guard, rivets, a crest and a plume for officers
  const m = '#b8c0d0', officer = L.heavy || L.look === 'general' || L.look === 'darkknight' || L.look === 'wyvernlord' || L.tier === 2;
  if (officer) celPoly(g, [[-2, -18], [-14, -30, -30, -20], [-24, -18], [-30, -12], [-18, -14, -6, -13]], L.T[0], 3);
  celPoly(g, [[-12, 8], [-16, -8, -8, -19, 1, -19], [10, -19, 14, -11, 13.6, -5], [11.6, -4.2], [4, -5], [2.4, -2], [2.2, 9], [-6, 10]], m, 3.4, cool(m, 0.62, 0.2), undefined, 1.2, (g) => {
    g.strokeStyle = 'rgba(255,255,255,0.85)'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(-9, -10); g.quadraticCurveTo(-4, -17, 4, -16.6); g.stroke();
    g.fillStyle = '#e8ecf4'; for (const [x, y] of [[-8, 4], [-9, -2], [0, 6]]) { g.beginPath(); g.arc(x, y, 0.8, 0, 7); g.fill(); }
  });
  g.strokeStyle = L.trim; g.lineWidth = 1.6; g.beginPath(); g.moveTo(-13, -3); g.quadraticCurveTo(0, -8, 13, -4.8); g.stroke();
  celPoly(g, [[0, -20], [2, -20], [3, -5], [1, -5]], warm(m, 1.15), 0.6);
}
function hood(g, L, c, veil) {
  const P = L.P || {};
  celPoly(g, [[-14, 12], [-18, -8, -10, -18, 1, -18], [10, -18, 14, -10, 13.6, -3], [11.4, -4.4], [8, -9, 3, -7], [-1, -4, -2, 6], [-4, 13]], c, 3.4, cool(c, 0.6, 0.24), undefined, 1.2, (g) => { g.strokeStyle = warm(c, 1.3); g.lineWidth = 1.1; g.beginPath(); g.moveTo(-12, 4); g.quadraticCurveTo(-12, -12, 0, -16); g.stroke(); });
  if (veil) { g.strokeStyle = veil && P.veil ? '#d8a840' : '#f4f0e8'; g.lineWidth = 1.8; g.beginPath(); g.moveTo(11.8, -4.4); g.quadraticCurveTo(7, -9.4, 2.4, -6.4); g.stroke(); }
  else { g.fillStyle = L.hc; g.beginPath(); g.moveTo(11, -4.6); g.lineTo(6, -1.6); g.lineTo(6.6, -6.4); g.closePath(); g.fill(); }
}
function wizardHat(g, L) {
  const c = L.T[1];
  celPoly(g, [[-16, -6], [-6, -9, 4, -9], [14, -9, 18, -6], [6, -3.6, -16, -6]], c, 2);
  celPoly(g, [[-9, -8], [-10, -20, -18, -30], [-22, -34], [-6, -26, 2, -24], [7, -20, 9, -8]], c, 3, undefined, undefined, 1.1, (g) => { g.fillStyle = L.trim; g.fillRect(-12, -12, 26, 2.6); });
}
function weapon(g, L, p, hand, layer) {
  const a = p.wa, w = L.w, wt = L.wt, fine = w && w.price > 1200;
  if (layer === 'back' && wt !== 'lance') return;
  if (layer === 'front' && wt === 'lance') { // the shaft passes behind the hand, the head in front, a pennant below it
    const tip = add(hand, v(a, 66)), butt = add(hand, v(a, -36)), o = v(a + 1.57, 1), sw = L.pose === 'strike' ? -6 : 0;
    seg(g, butt, tip, 1.7, 1.5, '#9a6a40', '#d0a070'); for (const t of [0.08, 0.14]) { const q = lerp(butt, tip, 0.36 + t); seg(g, add(q, v(a, -1.5)), add(q, v(a, 1.5)), 2.1, 2.1, '#4a3020'); }
    const pen = add(tip, v(a, -6)); celPoly(g, [pen, add(pen, v(a, -16)), add(add(pen, v(a, -14)), [o[0] * -12 + sw, o[1] * -12 + 4]), add(add(pen, v(a, -4)), [o[0] * -16 + sw, o[1] * -16 + 3])], L.T[0], 2);
    const t2 = add(tip, v(a, 17)), side = (s) => add(add(tip, v(a, 5)), [o[0] * s * 4.2, o[1] * s * 4.2]);
    celPoly(g, [add(tip, v(a, -2)), side(1), t2, side(-1)], fine ? '#eef2fa' : '#c8d0dc', 1.6, '#8a92a8', undefined, 1, (g) => { g.strokeStyle = '#ffffff'; g.lineWidth = 0.9; g.beginPath(); g.moveTo(...add(tip, v(a, 1))); g.lineTo(...t2); g.stroke(); });
    seg(g, add(tip, v(a, -3)), add(tip, v(a, 1)), 2.4, 2.4, L.trim); return;
  }
  if (layer === 'back') return;
  if (wt === 'sword') {
    const guard = add(hand, v(a, 4)), tip = add(hand, v(a, 50)), pom = add(hand, v(a, -7)), o = v(a + 1.57, 1), special = w && /銀|王家|灰鴉|誓火|霜牙|白/.test(w.name), col = special ? '#f4f8ff' : '#d4dae6', fire = w && w.name === '誓火';
    const s1 = add(guard, [o[0] * 2.8, o[1] * 2.8]), s2 = add(guard, [o[0] * -2.8, o[1] * -2.8]);
    if (fire || special) { g.save(); g.globalCompositeOperation = 'lighter'; g.strokeStyle = fire ? 'rgba(255,150,50,0.5)' : 'rgba(170,200,255,0.35)'; g.lineWidth = 8; g.beginPath(); g.moveTo(...guard); g.lineTo(...tip); g.stroke(); g.restore(); }
    // the blade: a lit edge and a shaded one meeting at the ridge, a fuller down the middle
    poly(g, [s1, add(tip, v(a, -7)), tip, s2], '#8a92a8', '#3a3e50', 1); poly(g, [s1, add(tip, v(a, -7)), tip, guard], col, null);
    g.strokeStyle = fire ? '#ffb050' : '#ffffff'; g.lineWidth = 0.9; g.beginPath(); g.moveTo(...s1); g.lineTo(...add(tip, v(a, -7))); g.stroke();
    g.strokeStyle = 'rgba(90,100,130,0.7)'; g.lineWidth = 0.8; g.beginPath(); g.moveTo(...add(guard, v(a, 3))); g.lineTo(...add(guard, v(a, 32))); g.stroke();
    // a curved guard with a stone, a wrapped grip, a pommel
    celPoly(g, [add(guard, [o[0] * 8, o[1] * 8]), add(add(guard, v(a, 2.4)), [o[0] * 3, o[1] * 3]), add(add(guard, v(a, 2.4)), [o[0] * -3, o[1] * -3]), add(guard, [o[0] * -8, o[1] * -8]), add(add(guard, v(a, -1.8)), [o[0] * -3, o[1] * -3]), add(add(guard, v(a, -1.8)), [o[0] * 3, o[1] * 3])], L.trim, 1);
    ell(g, guard[0], guard[1], 1.6, 1.6, 0, special ? '#5ab0ff' : '#c83a3a', null);
    seg(g, hand, pom, 1.7, 1.7, '#3a2a24'); ell(g, pom[0], pom[1], 2.4, 2.4, 0, L.trim);
  }
  if (wt === 'axe') {
    const top = add(hand, v(a, 36)), butt = add(hand, v(a, -10)); seg(g, butt, top, 2.1, 2, '#8a5a34', '#c08a5a'); seg(g, add(hand, v(a, 4)), add(hand, v(a, 9)), 2.5, 2.5, '#3a2a20');
    const b = add(top, v(a, -6)), o = v(a - 1.57, 1), f = v(a), P2 = (x, y) => [b[0] + o[0] * x + f[0] * y, b[1] + o[1] * x + f[1] * y];
    const blade = [P2(2, 6), [...P2(14, 13), ...P2(21, 8)], [...P2(24, -3), ...P2(20, -14)], [...P2(12, -12), ...P2(2, -9)]];
    celPoly(g, blade, fine ? '#e8ecf6' : '#bcc4d2', 2, '#7a8296', undefined, 1.1, (g) => { g.strokeStyle = '#ffffff'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(...P2(20, 7)); g.quadraticCurveTo(...P2(23, -3), ...P2(19, -12)); g.stroke(); });
    poly(g, [P2(-1, 3), P2(-9, -1), P2(-1, -6)], '#a8b0c0', undefined, 1); ell(g, ...P2(3, -2), 1.6, 1.6, 0, L.trim, null);
  }
  if (wt === 'bow') {
    // a recurved bow held out in front, the string drawn back when shooting
    const drawn = L.pose === 'shoot', topP = add(hand, [-3, -32]), botP = add(hand, [-3, 32]);
    g.strokeStyle = '#2a1a12'; g.lineWidth = 4.2; g.beginPath(); g.moveTo(topP[0] - 4, topP[1] - 3); g.quadraticCurveTo(topP[0] + 1, topP[1] + 2, topP[0], topP[1]); g.quadraticCurveTo(hand[0] + 18, hand[1] - 10, hand[0], hand[1]); g.quadraticCurveTo(hand[0] + 18, hand[1] + 10, botP[0], botP[1]); g.quadraticCurveTo(botP[0] + 1, botP[1] - 2, botP[0] - 4, botP[1] + 3); g.stroke(); g.strokeStyle = '#a06a34'; g.lineWidth = 2.4; g.stroke(); g.strokeStyle = '#e0a868'; g.lineWidth = 0.8; g.stroke();
    seg(g, add(hand, [0, -4]), add(hand, [0, 4]), 2.4, 2.4, L.trim);
    const pull = drawn ? [hand[0] - 28, hand[1]] : [hand[0] - 4, hand[1]]; g.strokeStyle = '#f4ecd8'; g.lineWidth = 0.8; g.beginPath(); g.moveTo(...topP); g.lineTo(...pull); g.lineTo(...botP); g.stroke();
    if (drawn) { g.strokeStyle = '#6a4a2a'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(pull[0], pull[1]); g.lineTo(hand[0] + 14, hand[1]); g.stroke(); poly(g, [[hand[0] + 13, hand[1] - 2.4], [hand[0] + 20, hand[1]], [hand[0] + 13, hand[1] + 2.4]], '#dce0ea', undefined, 0.8); poly(g, [[pull[0] - 1, pull[1]], [pull[0] + 5, pull[1] - 3.4], [pull[0] + 8, pull[1] - 3.4], [pull[0] + 3, pull[1]], [pull[0] + 8, pull[1] + 3.4], [pull[0] + 5, pull[1] + 3.4]], '#f0f0f0', undefined, 0.6); ell(g, pull[0], pull[1], 3.4, 3.4, 0, '#7a5034'); }
  }
  if (wt === 'tome') {
    const [hi, lo] = tomeColour(L), col = w.type === 'dark' ? '#4a2a6a' : w.type === 'light' ? '#e8dca0' : w.eff && w.eff.includes('fly') ? '#2a7a5a' : '#a83030';
    if (L.pose === 'cast') { // the book held open, its pages blazing
      celPoly(g, [[hand[0] - 1, hand[1] - 10], [hand[0] + 9, hand[1] - 6], [hand[0] + 10, hand[1] + 7], [hand[0], hand[1] + 9]], col, 1.5); poly(g, [[hand[0] + 1, hand[1] - 8], [hand[0] + 12, hand[1] - 12], [hand[0] + 13, hand[1] + 2], [hand[0] + 2, hand[1] + 7]], '#fbf4e0', undefined, 0.8);
      g.save(); g.globalCompositeOperation = 'lighter'; const gl = g.createRadialGradient(hand[0] + 10, hand[1] - 4, 0, hand[0] + 10, hand[1] - 4, 26); gl.addColorStop(0, `rgba(${hi},0.95)`); gl.addColorStop(0.4, `rgba(${lo},0.6)`); gl.addColorStop(1, `rgba(${lo},0)`); g.fillStyle = gl; g.fillRect(hand[0] - 18, hand[1] - 32, 56, 56);
      g.strokeStyle = `rgba(${hi},0.9)`; g.lineWidth = 0.9; for (let k = 0; k < 3; k++) { g.beginPath(); g.arc(hand[0] + 10, hand[1] - 4, 9 + k * 5, k, k + 2.2); g.stroke(); } g.restore();
    } else { celPoly(g, [[hand[0] - 2, hand[1] - 9], [hand[0] + 10, hand[1] - 7], [hand[0] + 10, hand[1] + 7], [hand[0] - 2, hand[1] + 9]], col, 2, undefined, undefined, 1, (g) => { g.fillStyle = '#f4ecd8'; g.fillRect(hand[0] + 8, hand[1] - 6, 2, 12); g.fillStyle = '#e8c860'; g.fillRect(hand[0] + 1.5, hand[1] - 2.5, 4.5, 4.5); g.fillRect(hand[0] - 2, hand[1] - 9, 3, 3); g.fillRect(hand[0] - 2, hand[1] + 6, 3, 3); }); }
  }
  if (wt === 'staff') {
    const top = add(hand, v(a, 54)), butt = add(hand, v(a, -24)); seg(g, butt, top, 1.7, 1.7, '#c8a060', '#f4dca8');
    // a ring with a stone in it, a pair of small wings
    for (const s of [-1, 1]) celPoly(g, [add(top, [0, 6]), add(top, [s * 12, -2]), add(top, [s * 9, 4]), add(top, [s * 5, 6])], '#f4f0e8', 1.5);
    g.strokeStyle = '#7a5a14'; g.lineWidth = 3; g.beginPath(); g.arc(top[0], top[1], 7, 0, 7); g.stroke(); g.strokeStyle = '#f0d070'; g.lineWidth = 1.8; g.stroke();
    ell(g, top[0], top[1], 3.6, 3.6, 0, '#8ad8ff', '#2a5a8a', 0.8); g.fillStyle = '#ffffff'; g.fillRect(top[0] - 1.6, top[1] - 1.6, 1.4, 1.4);
    if (L.pose === 'cast') { g.save(); g.globalCompositeOperation = 'lighter'; const gl = g.createRadialGradient(top[0], top[1], 0, top[0], top[1], 30); gl.addColorStop(0, 'rgba(220,255,235,0.95)'); gl.addColorStop(1, 'rgba(80,220,150,0)'); g.fillStyle = gl; g.fillRect(top[0] - 30, top[1] - 30, 60, 60); g.restore(); }
  }
}
// ---------------------------------------------------------------- mounts
function mount(g, L, p, layer) {
  const m = L.mount, run = ['strike', 'run', 'run2', 'follow'].includes(L.pose) ? 1 : 0, back = L.pose === 'hit' || L.pose === 'dodge' ? 1 : 0, dx = (p.dx || 0) * 0.6;
  if (m === 'horse') {
    const col = L.look === 'darkknight' ? '#2a2428' : L.look === 'valkyrie' || L.look === 'inquisitor' ? '#ece8e0' : L.look === 'gk' ? '#5a4a3a' : '#8a5a34', dk = sh(col, 0.7), lt = sh(col, 1.3), mane = L.look === 'valkyrie' ? '#e8dcc0' : sh(col, 0.4);
    const bx = dx - 4, by = -60 - run * 4 + back * 2, tilt = run ? -0.12 : back ? 0.1 : 0;
    if (layer === 'back') {
      // far legs, tail, body, neck and head; the near legs come after the rider
      leg4(g, [bx - 22, by + 6], run ? -0.6 : back ? 0.3 : -0.1, run ? 0.4 : 0, dk); leg4(g, [bx + 22, by + 6], run ? 0.9 : back ? -0.3 : 0.12, run ? -0.6 : 0, dk);
      poly(g, [[bx - 30, by - 4], [bx - 50, by + 4 - run * 8, bx - 48, by + 34], [bx - 40, by + 22], [bx - 36, by + 6]], mane);
      celEll(g, bx, by + 4, 32, 15, tilt, col, 5, dk); ell(g, bx - 4, by - 4, 20, 3.6, tilt, lt, null);
      const nb = [bx + 24, by - 4], hd = [bx + 40 + run * 6, by - 30 + run * 6 + back * 4];
      poly(g, [[nb[0] - 8, nb[1] + 4], [hd[0] - 8, hd[1] - 2], [hd[0] + 2, hd[1] - 6], [nb[0] + 10, nb[1] + 10]], col);
      poly(g, [[hd[0] - 8, hd[1] - 6], [hd[0] + 6, hd[1] - 10], [hd[0] + 20, hd[1] + 4], [hd[0] + 18, hd[1] + 10], [hd[0] + 6, hd[1] + 8], [hd[0] - 4, hd[1] + 4]], col);
      poly(g, [[hd[0] - 2, hd[1] - 8], [hd[0] - 4, hd[1] - 18], [hd[0] + 3, hd[1] - 10]], col); ell(g, hd[0] + 5, hd[1] - 2, 1.6, 1.6, 0, '#1a1010', null); ell(g, hd[0] + 17, hd[1] + 6, 1.4, 1, 0, '#1a1010', null);
      poly(g, [[nb[0] - 8, nb[1] + 2], [hd[0] - 10, hd[1] - 4], [hd[0] - 6, hd[1] - 10], [nb[0] - 14, nb[1] - 2]], mane);
      g.strokeStyle = '#3a2a1a'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(hd[0] + 14, hd[1] + 6); g.lineTo(bx + 14, by - 12); g.stroke();
      // a caparison in the side's colours, the saddle
      poly(g, [[bx - 18, by - 10], [bx + 16, by - 10], [bx + 20, by + 14], [bx - 22, by + 14]], L.T[0]); poly(g, [[bx + 2, by - 10], [bx + 16, by - 10], [bx + 20, by + 14], [bx + 4, by + 14]], L.T[1], null); g.strokeStyle = L.trim; g.lineWidth = 2; g.beginPath(); g.moveTo(bx - 22, by + 13); g.lineTo(bx + 20, by + 13); g.stroke();
      if (L.heavy) { poly(g, [[nb[0] - 6, nb[1] - 2], [hd[0] - 4, hd[1] - 4], [hd[0] + 12, hd[1] - 2], [nb[0] + 12, nb[1] + 8]], '#a8acb8'); }
      poly(g, [[bx - 10, by - 14], [bx + 10, by - 14], [bx + 8, by - 8], [bx - 12, by - 8]], '#5a3a22');
      return [bx - 2, by - 14];
    }
    leg4(g, [bx - 18, by + 8], run ? 0.7 : back ? -0.2 : 0.05, run ? -0.3 : 0, col); leg4(g, [bx + 24, by + 8], run ? -0.5 : back ? 0.4 : -0.08, run ? 0.9 : 0, col);
  }
  if (m === 'pegasus') {
    const col = '#f4f4f8', dk = '#c8ccd8', bx = dx - 2, by = -74 - run * 4 + Math.sin(run) * 2, flap = L.pose === 'strike' || L.pose === 'wind' ? 1 : 0;
    if (layer === 'back') {
      wing(g, [bx + 8, by - 8], flap ? 3.0 : 3.75, 54, '#d8dce8');
      leg4(g, [bx - 20, by + 6], -0.9, 1.2, dk, 0.8); leg4(g, [bx + 20, by + 6], 1.2, -1.4, dk, 0.8);
      poly(g, [[bx - 28, by - 2], [bx - 52, by + 2, bx - 50, by + 26], [bx - 40, by + 14], [bx - 34, by + 4]], '#e8e4f0');
      celEll(g, bx, by + 4, 30, 14, -0.05, col, 5, '#c4c8e0'); ell(g, bx - 4, by - 4, 18, 3, -0.05, '#ffffff', null);
      const nb = [bx + 22, by - 4], hd = [bx + 38 + run * 6, by - 30 + run * 6];
      poly(g, [[nb[0] - 8, nb[1] + 4], [hd[0] - 8, hd[1] - 2], [hd[0] + 2, hd[1] - 6], [nb[0] + 10, nb[1] + 10]], col);
      poly(g, [[hd[0] - 8, hd[1] - 6], [hd[0] + 6, hd[1] - 10], [hd[0] + 18, hd[1] + 3], [hd[0] + 16, hd[1] + 9], [hd[0] + 5, hd[1] + 7], [hd[0] - 4, hd[1] + 4]], col);
      poly(g, [[hd[0] - 2, hd[1] - 8], [hd[0] - 3, hd[1] - 17], [hd[0] + 3, hd[1] - 10]], col); ell(g, hd[0] + 5, hd[1] - 2, 1.6, 1.6, 0, '#3a2a4a', null);
      poly(g, [[nb[0] - 8, nb[1] + 2], [hd[0] - 10, hd[1] - 4], [hd[0] - 6, hd[1] - 10], [nb[0] - 14, nb[1] - 2]], '#c8d8f0');
      poly(g, [[bx - 14, by - 10], [bx + 14, by - 10], [bx + 16, by + 8], [bx - 16, by + 8]], L.T[0]); g.strokeStyle = L.trim; g.lineWidth = 2; g.beginPath(); g.moveTo(bx - 16, by + 7); g.lineTo(bx + 16, by + 7); g.stroke();
      return [bx - 2, by - 12];
    }
    leg4(g, [bx - 16, by + 8], -0.7, 1.4, col, 0.8); leg4(g, [bx + 22, by + 8], 1.0, -1.6, col, 0.8);
    wing(g, [bx, by - 6], flap ? 2.9 : 3.6, 62, '#ffffff');
  }
  if (m === 'wyvern') {
    const col = L.look === 'wyvernlord' ? '#5a6a8a' : '#5a7a4a', dk = sh(col, 0.65), lt = sh(col, 1.3), belly = '#d8c890', bx = dx - 6, by = -70 - run * 6, flap = L.pose === 'strike' || L.pose === 'wind' ? 1 : 0;
    if (layer === 'back') {
      bwing(g, [bx + 4, by - 10], flap ? 2.6 : 2.1, 70, dk);
      poly(g, [[bx - 26, by], [bx - 60, by + 14, bx - 84, by + 6], [bx - 64, by + 22, bx - 28, by + 14]], col);
      celEll(g, bx, by + 4, 32, 15, -0.1, col, 5, dk, undefined, 1.1, (g) => { g.fillStyle = belly; g.beginPath(); g.ellipse(bx + 2, by + 14, 26, 6, -0.05, 0, 7); g.fill(); g.strokeStyle = sh(belly, 0.75); g.lineWidth = 0.8; for (let k = -3; k <= 3; k++) { g.beginPath(); g.moveTo(bx + k * 7, by + 9); g.lineTo(bx + k * 7 + 1, by + 19); g.stroke(); } }); ell(g, bx - 6, by - 4, 20, 3.4, -0.1, lt, null);
      for (const lx of [-14, 10]) { const k1 = [bx + lx, by + 16], k2 = add(k1, v(run ? 0.8 : 0.2, 18)); seg(g, k1, k2, 6, 4, dk); poly(g, [[k2[0] - 4, k2[1]], [k2[0] + 8, k2[1] + 2], [k2[0] - 2, k2[1] + 5]], '#e8e0c8'); }
      const nb = [bx + 24, by - 4], hd = [bx + 48 + run * 8, by - 34 + run * 8];
      seg(g, nb, [bx + 36, by - 20], 8, 6, col, lt); seg(g, [bx + 36, by - 20], hd, 6, 5, col, lt);
      poly(g, [[hd[0] - 6, hd[1] - 6], [hd[0] + 8, hd[1] - 8], [hd[0] + 24, hd[1] - 1], [hd[0] + 22, hd[1] + 4], [hd[0] + 10, hd[1] + 3], [hd[0] + 22, hd[1] + 8], [hd[0] + 6, hd[1] + 9], [hd[0] - 6, hd[1] + 4]], col);
      poly(g, [[hd[0] - 4, hd[1] - 6], [hd[0] - 16, hd[1] - 16], [hd[0] + 2, hd[1] - 9]], '#e8e0c8'); ell(g, hd[0] + 8, hd[1] - 3, 2, 1.6, 0, '#f0c020', null); ell(g, hd[0] + 8.4, hd[1] - 3, 0.6, 1.4, 0, '#1a1010', null);
      poly(g, [[bx - 12, by - 12], [bx + 10, by - 12], [bx + 8, by - 4], [bx - 14, by - 4]], L.T[0]);
      return [bx - 2, by - 14];
    }
    bwing(g, [bx - 4, by - 8], flap ? 2.8 : 2.3, 80, col);
  }
  if (m === 'wolf') {
    const col = L.look === 'wolfking' ? '#e8eaee' : '#a8b0b8', dk = sh(col, 0.7), lt = sh(col, 1.2), bx = dx - 4, by = -46 - run * 3;
    if (layer === 'back') {
      leg4(g, [bx - 20, by + 4], run ? -0.7 : -0.1, run ? 0.5 : 0, dk, 0.75); leg4(g, [bx + 20, by + 4], run ? 0.9 : 0.1, run ? -0.5 : 0, dk, 0.75);
      poly(g, [[bx - 26, by - 4], [bx - 52, by - 14 - run * 6, bx - 56, by + 4], [bx - 44, by + 8, bx - 28, by + 6]], col);
      celEll(g, bx, by + 2, 30, 13, -0.04, col, 5, dk, undefined, 1.1, (g) => { g.strokeStyle = dk; g.lineWidth = 0.8; for (let k = 0; k < 10; k++) { const x = bx - 24 + k * 5; g.beginPath(); g.moveTo(x, by - 8); g.lineTo(x - 3, by - 2); g.stroke(); } });
      poly(g, [[bx + 14, by - 12], [bx + 30, by - 18], [bx + 34, by - 4], [bx + 20, by + 12]], lt);
      const hd = [bx + 38 + run * 6, by - 16 + run * 4];
      poly(g, [[hd[0] - 10, hd[1] - 4], [hd[0] - 2, hd[1] - 10], [hd[0] + 8, hd[1] - 6], [hd[0] + 22, hd[1] + 1], [hd[0] + 20, hd[1] + 6], [hd[0] + 8, hd[1] + 7], [hd[0] - 6, hd[1] + 8]], col);
      for (const ex of [-6, 0]) poly(g, [[hd[0] + ex - 2, hd[1] - 7], [hd[0] + ex, hd[1] - 18], [hd[0] + ex + 5, hd[1] - 8]], col);
      ell(g, hd[0] + 6, hd[1] - 2, 1.8, 1.3, 0, '#f0c040', null); ell(g, hd[0] + 21, hd[1] + 2, 1.6, 1.4, 0, '#1a1414', null); if (run) poly(g, [[hd[0] + 10, hd[1] + 6], [hd[0] + 20, hd[1] + 6], [hd[0] + 12, hd[1] + 10]], '#a83a3a', null);
      poly(g, [[bx - 12, by - 12], [bx + 10, by - 12], [bx + 8, by - 4], [bx - 14, by - 4]], L.T[0]);
      return [bx - 2, by - 14];
    }
    leg4(g, [bx - 16, by + 6], run ? 0.8 : 0.05, run ? -0.4 : 0, col, 0.75); leg4(g, [bx + 22, by + 6], run ? -0.6 : -0.05, run ? 0.8 : 0, col, 0.75);
  }
}
function leg4(g, top, a1, a2, col, s = 1) { const knee = add(top, v(a1, 26 * s)), hoof = add(knee, v(a1 + a2, 24 * s)); seg(g, top, knee, 6 * s, 4 * s, col); seg(g, knee, hoof, 4 * s, 3 * s, col); poly(g, [[hoof[0] - 4 * s, hoof[1] - 1], [hoof[0] + 5 * s, hoof[1] - 1], [hoof[0] + 5 * s, hoof[1] + 4 * s], [hoof[0] - 4 * s, hoof[1] + 4 * s]], '#2a2020'); }
function wing(g, root, a, len, col) {
  // a bird's wing: long flight feathers fanned out behind the leading edge, a covert of short rounded feathers over them
  const tip = add(root, v(a, len)), back = a + 1.75, base = col, shd = cool(base, 0.84, 0.22);
  for (let k = 0; k <= 8; k++) { const t = k / 8, b0 = add(root, v(a, len * (0.22 + t * 0.78))), dir = back - 0.1 - t * 1.35, fl = len * (0.34 + Math.sin(t * Math.PI * 0.8) * 0.3), e = add(b0, v(dir, fl)), o = v(dir + 1.57, 3.4);
    celPoly(g, [add(b0, o), [...add(lerp(b0, e, 0.6), [o[0] * 1.3, o[1] * 1.3]), ...e], [...add(lerp(b0, e, 0.6), [-o[0] * 1.2, -o[1] * 1.2]), ...add(b0, [-o[0], -o[1]])]], k % 2 ? base : sh(base, 0.97), 1.6, shd, undefined, 0.9, (g) => { g.strokeStyle = shd; g.lineWidth = 0.6; g.beginPath(); g.moveTo(...b0); g.lineTo(...lerp(b0, e, 0.85)); g.stroke(); }); }
  const cov = [root]; for (let k = 0; k <= 6; k++) { const t = k / 6; cov.push(add(add(root, v(a, len * (0.9 - t * 0.8))), v(back - 0.3, 6 + Math.sin(t * Math.PI) * 9))); }
  const edge = [root, tip, ...cov.slice(1).map((q, k) => k % 2 ? q : add(q, v(back - 0.3, 3)))];
  celPoly(g, edge, base, 2, shd, undefined, 1, (g) => { g.strokeStyle = 'rgba(255,255,255,0.9)'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(...root); g.lineTo(...lerp(root, tip, 0.9)); g.stroke(); });
}
function bwing(g, root, a, len, col) {
  // a bat's wing: bony fingers with skin between
  const tip = add(root, v(a, len)), f = [0.0, 0.5, 0.95].map((t) => add(tip, v(a - 2.2 - t * 0.6, len * (0.7 - t * 0.2))));
  poly(g, [root, tip, f[0], [tip[0] + (f[1][0] - tip[0]) * 0.6, tip[1] + (f[1][1] - tip[1]) * 0.6 + 6], f[1], [tip[0] + (f[2][0] - tip[0]) * 0.7, tip[1] + (f[2][1] - tip[1]) * 0.7 + 8], f[2], add(root, [-10, 10])], sh(col, 0.85));
  seg(g, root, tip, 5, 3, col); for (const q of f) seg(g, tip, q, 2, 1.2, col);
}
