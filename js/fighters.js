// Fighters for the battle scene: side-on figures facing right, drawn as cel-shaded vector art on a jointed
// skeleton (hips, knees, shoulders, elbows) so that each pose — at rest, winding up, striking, casting, drawing a
// bow, reeling from a hit, dodging — bends the body the way a person would. Riders sit on horses, pegasi, wyverns
// and wolves. A fighter's look comes from its class (armour, robes, hoods, capes), its side's colours, and for named
// people their own hair and skin. Returns a 520×520 canvas: 260 units at double resolution, the ground at y = 230.
import { ITEMS } from './data/items.js';
import { CLASSES } from './data/classes.js';
import { CAST } from './data/cast.js';
import { TEAM } from './tiles.js';

const CACHE = new Map();
const LINE = '#1c141c';
const sh = (hex, k) => { const n = parseInt(hex.slice(1), 16), f = (v) => Math.max(0, Math.min(255, Math.round(k > 1 ? v + (255 - v) * (k - 1) : v * k))); return `rgb(${f((n >> 16) & 255)},${f((n >> 8) & 255)},${f(n & 255)})`; };
const v = (a, l = 1) => [Math.sin(a) * l, Math.cos(a) * l]; // a direction measured from straight down, forward is positive
const add = (p, q) => [p[0] + q[0], p[1] + q[1]];
const MOUNT = { cav: 'horse', paladin: 'horse', gk: 'horse', ranger: 'horse', valkyrie: 'horse', darkknight: 'horse', inquisitor: 'horse', gull: 'pegasus', gulllord: 'pegasus', storm: 'pegasus', wyvern: 'wyvern', wyvernlord: 'wyvern', wolf: 'wolf', wolfking: 'wolf' };
const HEAVY = { knight: 1, general: 1, gk: 1, regent: 1 };
const HELM = { knight: 1, general: 1, gk: 1, soldier: 1, halberd: 1, darkknight: 1, wyvern: 1, wyvernlord: 1, regent: 1, warrior: 1 };
const ROBE = { mage: 1, cleric: 1, monk: 1, shaman: 1, sage: 1, bishop: 1, druid: 1, saint: 1, strategist: 1, archbishop: 1, princess: 1, queen: 1, valkyrie: 1, storm: 1, bard: 1, spellblade: 0 };
const HOOD = { thief: 1, assassin: 1, rogue: 1, shaman: 1, druid: 1, archer: 1 };
const BARE = { fighter: 1, brigand: 1, berserker: 1, pirate: 1 };
const CAPE = { sword: 1, oath: 1, hero: 1, paladin: 1, queen: 1, regent: 1, gulllord: 1, wyvernlord: 1, general: 1, sniper: 1, sage: 1, archbishop: 1, darkknight: 1, inquisitor: 1, spellblade: 1, wolfking: 1, gk: 1, sm: 1 };
const FEMALE = { cleric: 1, valkyrie: 1, gull: 1, gulllord: 1, storm: 1, saint: 1, princess: 1, queen: 1 };
const HAIRS = ['#3a2a1a', '#5a3a20', '#8a5a2a', '#2a2426', '#a87a3a', '#6a4a3a', '#4a3a30'];

export function fighter(u, pose) {
  const k = CLASSES[u.cls], look = k.look, wid = u._wid || (u.items && u.items[0] && u.items[0].id) || '', key = [u.id || u.uid, u.cls, u.side, wid, pose].join('|');
  if (CACHE.has(key)) return CACHE.get(key);
  const c = document.createElement('canvas'); c.width = c.height = 520; const g = c.getContext('2d'); g.scale(2, 2); g.translate(130, 230); g.lineJoin = 'round'; g.lineCap = 'round';
  const P = u.id && CAST[u.id] ? CAST[u.id].p : null, T = TEAM[u.side] || TEAM.player, seed = [...String(u.uid || u.id || u.cls)].reduce((s, ch) => s * 31 + ch.charCodeAt(0), 7) >>> 0;
  const w = ITEMS[wid], wt = w ? (w.type === 'anima' || w.type === 'light' || w.type === 'dark' ? 'tome' : w.type) : 'none';
  const own = P && P.oc && u.side !== 'gray' ? [P.oc, sh(P.oc, 0.7), sh(P.oc, 1.3)] : null;
  const L = { look, T: own || T, P, w, wt, pose, mount: MOUNT[look], heavy: HEAVY[look], helm: HELM[look] && !(P && P.hair && P.hair !== 'helm' && !HEAVY[look]), robe: ROBE[look], hood: HOOD[look] && !(P && !['hood', 'veil'].includes(P.hair) && look === 'archer' && P.out !== 'hunter'), bare: BARE[look], cape: CAPE[look] || (P && CAST[u.id].lord),
    hc: (P && P.hc) || HAIRS[seed % HAIRS.length], skin: (P && P.skin) || ['#f0c8a8', '#e0b090', '#d0a078', '#f4d4b8'][seed % 4], f: P ? P.g === 'f' : !!FEMALE[look], longHair: P ? ['pony', 'crown', 'long', 'flow', 'twin', 'tied', 'longwhite', 'longf', 'braids', 'viking', 'tailm'].includes(P.hair) : !!FEMALE[look], beard: P && P.beard, veil: P && (P.hair === 'veil' || P.veil), trim: P && P.ac ? P.ac : k.tier === 2 ? '#e0b858' : sh(T[1], 0.8) };
  draw(g, L);
  CACHE.set(key, c); return c;
}
// ---------------------------------------------------------------- shapes
function seg(g, p, q, w1, w2, fill, hi) {
  const dx = q[0] - p[0], dy = q[1] - p[1], l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l;
  g.beginPath(); g.moveTo(p[0] + nx * w1, p[1] + ny * w1); g.lineTo(q[0] + nx * w2, q[1] + ny * w2); g.arc(q[0], q[1], w2, Math.atan2(ny, nx), Math.atan2(ny, nx) + Math.PI, true); g.lineTo(p[0] - nx * w1, p[1] - ny * w1); g.arc(p[0], p[1], w1, Math.atan2(-ny, -nx), Math.atan2(-ny, -nx) + Math.PI, true); g.closePath();
  g.fillStyle = fill; g.fill(); g.strokeStyle = LINE; g.lineWidth = 1.4; g.stroke();
  if (hi) { const s = nx < 0 ? 1 : -1; g.strokeStyle = hi; g.lineWidth = Math.max(1, Math.min(w1, w2) * 0.55); g.beginPath(); g.moveTo(p[0] + nx * w1 * 0.45 * s, p[1] + ny * w1 * 0.45 * s); g.lineTo(q[0] + nx * w2 * 0.45 * s, q[1] + ny * w2 * 0.45 * s); g.stroke(); }
}
function capsule(g, p, q, w1, w2) { const dx = q[0] - p[0], dy = q[1] - p[1], l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l; g.moveTo(p[0] + nx * w1, p[1] + ny * w1); g.lineTo(q[0] + nx * w2, q[1] + ny * w2); g.arc(q[0], q[1], w2, Math.atan2(ny, nx), Math.atan2(ny, nx) + Math.PI, true); g.lineTo(p[0] - nx * w1, p[1] - ny * w1); g.arc(p[0], p[1], w1, Math.atan2(-ny, -nx), Math.atan2(-ny, -nx) + Math.PI, true); g.closePath(); }
function limb(g, a, b, c, w1, w2, w3, fill, fill2, hi) {
  g.beginPath(); capsule(g, a, b, w1, w2); capsule(g, b, c, w2, w3); g.strokeStyle = LINE; g.lineWidth = 2.8; g.stroke();
  g.fillStyle = fill; g.beginPath(); capsule(g, a, b, w1, w2); g.fill(); g.fillStyle = fill2 || fill; g.beginPath(); capsule(g, b, c, w2 * 0.98, w3); g.fill();
  if (hi) { g.strokeStyle = hi; for (const [p, q, ww] of [[a, b, Math.min(w1, w2)], [b, c, Math.min(w2, w3)]]) { const dx = q[0] - p[0], dy = q[1] - p[1], l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l, s2 = nx < 0 ? 1 : -1; g.lineWidth = Math.max(1, ww * 0.5); g.beginPath(); g.moveTo(p[0] + nx * ww * 0.45 * s2, p[1] + ny * ww * 0.45 * s2); g.lineTo(q[0] + nx * ww * 0.45 * s2, q[1] + ny * ww * 0.45 * s2); g.stroke(); } }
}
function poly(g, pts, fill, line = LINE, lw = 1.4) { g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (const p of pts.slice(1)) { if (p.length === 4) g.quadraticCurveTo(p[0], p[1], p[2], p[3]); else g.lineTo(p[0], p[1]); } g.closePath(); if (fill) { g.fillStyle = fill; g.fill(); } if (line) { g.strokeStyle = line; g.lineWidth = lw; g.stroke(); } }
function ell(g, x, y, rx, ry, rot, fill, line = LINE, lw = 1.4) { g.beginPath(); g.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2); if (fill) { g.fillStyle = fill; g.fill(); } if (line) { g.strokeStyle = line; g.lineWidth = lw; g.stroke(); } }
// ---------------------------------------------------------------- poses
// angles from straight down: torso lean, thighs and shins, upper and lower arms (front = the near arm holding the
// weapon), and the angle the weapon points
const POSE = {
  idle: { lean: 0.06, ft: 0.32, fs: 0.04, bt: -0.3, bs: -0.12, fa: 0.4, ff: 1.55, ba: -0.25, bf: 0.3, wa: 2.25 },
  wind: { lean: -0.14, ft: 0.5, fs: 0.12, bt: -0.42, bs: -0.2, fa: 2.75, ff: 3.5, ba: 0.6, bf: 1.3, wa: 3.95 },
  strike: { lean: 0.36, ft: 0.95, fs: 0.3, bt: -0.8, bs: -0.4, fa: 1.45, ff: 1.62, ba: -0.7, bf: -0.35, wa: 1.72, dx: 8 },
  cast: { lean: 0.1, ft: 0.4, fs: 0.06, bt: -0.36, bs: -0.14, fa: 1.25, ff: 1.85, ba: 0.9, bf: 2.3, wa: 2.6 },
  shoot: { lean: 0.03, ft: 0.38, fs: 0.05, bt: -0.34, bs: -0.12, fa: 1.52, ff: 1.57, ba: -2.0, bf: 1.42, wa: 1.57 },
  hit: { lean: -0.4, ft: 0.15, fs: 0.25, bt: -0.55, bs: -0.1, fa: -0.35, ff: 0.4, ba: -1.0, bf: -0.5, wa: 2.9, dx: -6 },
  dodge: { lean: -0.55, ft: 0.7, fs: -0.25, bt: -0.25, bs: 0.35, fa: 0.1, ff: 1.2, ba: -0.8, bf: -0.2, wa: 2.5, dx: -14, dy: 8 },
};
function poseFor(L) {
  const p = { ...(POSE[L.wt === 'bow' && L.pose === 'wind' ? 'shoot' : L.pose] || POSE.idle) };
  if (L.wt === 'lance') Object.assign(p, { idle: { fa: 0.55, ff: 1.45, wa: 1.85 }, wind: { lean: -0.08, fa: -0.35, ff: 1.25, wa: 1.66 }, strike: { fa: 1.5, ff: 1.58, wa: 1.6 } }[L.pose] || {});
  if (L.wt === 'staff') Object.assign(p, { idle: { fa: 0.3, ff: 1.2, wa: 3.05 }, cast: { fa: 1.7, ff: 2.6, wa: 2.85 } }[L.pose] || {});
  if (L.wt === 'tome' && L.pose === 'idle') Object.assign(p, { fa: 0.5, ff: 1.5 });
  if (L.wt === 'bow' && L.pose === 'idle') Object.assign(p, { fa: 0.7, ff: 1.0, wa: 1.57 });
  return p;
}
// ---------------------------------------------------------------- the figure
function draw(g, L) {
  const p = poseFor(L), m = L.mount;
  const shadowW = m ? 62 : 32; ell(g, 0, -1, shadowW, 6, 0, 'rgba(0,0,0,0.28)', null);
  let hip, legs = true;
  if (m) { const seat = mount(g, L, p, 'back'); hip = seat; legs = false; }
  else hip = [(p.dx || 0) * 0.5, -51 + (p.dy || 0)];
  person(g, L, p, hip, legs);
  if (m) mount(g, L, p, 'front');
}
function person(g, L, p, hip, onFoot) {
  const T = L.T, cloth = L.robe ? (L.look === 'cleric' || L.look === 'saint' || L.look === 'bishop' || L.look === 'archbishop' ? '#ece6dc' : T[0]) : L.heavy ? '#a8acb8' : T[0];
  const dark = L.robe && cloth === '#ece6dc' ? '#c8c0b4' : L.heavy ? '#6e7280' : T[1], light = L.heavy ? '#e0e4ec' : sh(cloth, 1.3), pants = L.heavy ? '#8a8e9a' : L.bare ? '#5a4030' : '#3a3440', boot = L.heavy ? '#7a7e8a' : '#4a3226';
  const lean = p.lean, up = v(Math.PI - lean), sho = add(hip, [up[0] * 33, up[1] * 33]), neck = add(hip, [up[0] * 37, up[1] * 37]), head = add(neck, v(Math.PI - lean * 0.5, 13));
  const legsOf = (t, s, col) => { const knee = add(hip, v(t, 25)), ank = add(knee, v(s, 24)); return [knee, ank]; };
  const [bk, ba] = onFoot ? legsOf(p.bt, p.bs) : [add(hip, v(0.95, 22)), add(add(hip, v(0.95, 22)), v(-0.05, 22))];
  const [fk, fa] = onFoot ? legsOf(p.ft, p.fs) : [add(hip, v(1.05, 23)), add(add(hip, v(1.05, 23)), v(0.05, 22))];
  const foot = (a, col) => { poly(g, [[a[0] - 4, a[1] - 3], [a[0] + 9, a[1] - 1], [a[0] + 10, a[1] + 3], [a[0] - 4, a[1] + 3]], col); };
  // the cape streams behind
  if (L.cape) { const sway = L.pose === 'strike' ? -16 : L.pose === 'hit' ? 6 : -6; poly(g, [[sho[0] - 3, sho[1] - 2], [sho[0] - 16 + sway * 0.3, sho[1] + 20, sho[0] - 26 + sway, hip[1] + 34], [sho[0] - 6 + sway, hip[1] + 40], [sho[0] - 2, hip[1] + 10, sho[0] + 6, sho[1] + 4]], T[1]); poly(g, [[sho[0] - 5, sho[1] + 2], [sho[0] - 15 + sway * 0.3, sho[1] + 22, sho[0] - 23 + sway, hip[1] + 32], [sho[0] - 19 + sway, hip[1] + 35], [sho[0] - 10, sho[1] + 26, sho[0] - 2, sho[1] + 6]], sh(T[1], 0.7), null); g.strokeStyle = L.trim; g.lineWidth = 1.6; g.beginPath(); g.moveTo(sho[0] - 26 + sway, hip[1] + 34); g.lineTo(sho[0] - 6 + sway, hip[1] + 40); g.stroke(); }
  // long hair falls behind the shoulders
  if (L.longHair && !L.helm && !L.veil) poly(g, [[head[0] - 10, head[1] - 4], [head[0] - 20, head[1] + 20, head[0] - 16, head[1] + 40], [head[0] - 4, head[1] + 34], [head[0] + 2, head[1] + 10]], sh(L.hc, 0.8));
  // the far leg and far arm, darker
  limb(g, hip, bk, ba, 6, 5, 4, sh(pants, 0.7), sh(boot, 0.75)); foot(ba, sh(boot, 0.7));
  const be = add(sho, v(p.ba, 18)), bh = add(be, v(p.bf, 17));
  limb(g, sho, be, bh, 4.6, 4, 3.4, sh(L.bare ? L.skin : L.heavy ? '#8a8e9a' : dark, 0.75)); ell(g, bh[0], bh[1], 3.4, 3.4, 0, sh(L.heavy ? '#8a8e9a' : L.skin, 0.8));
  // the near leg
  limb(g, hip, fk, fa, 6.4, 5.4, 4.4, pants, boot, sh(pants, 1.4)); foot(fa, boot);
  if (L.heavy) { seg(g, fk, fa, 5.8, 5, '#a8acb8', '#e0e4ec'); ell(g, fk[0], fk[1], 6, 5, 0, '#c0c4d0'); foot(fa, '#8a8e9a'); }
  // the body: a tunic or a robe, plate or a bare chest
  const nx = Math.cos(lean), ny = Math.sin(lean), at = (o, d) => [o[0] + nx * d, o[1] + ny * d];
  const torso = [at(sho, -11), at(sho, 12), at(hip, 10), at(hip, -10)];
  if (L.robe) { const hem = 2, flare = L.pose === 'strike' ? 10 : L.pose === 'hit' || L.pose === 'dodge' ? -6 : 0; poly(g, [at(hip, -11), at(hip, 11), [hip[0] + 22 + flare, hem - 3], [hip[0] + 4, hem], [hip[0] - 20 + flare * 0.5, hem - 2]], cloth); poly(g, [at(hip, 2), at(hip, 11), [hip[0] + 22 + flare, hem - 3], [hip[0] + 6, hem - 1]], sh(cloth, 0.8), null); for (const dx2 of [-8, 4, 14]) { g.strokeStyle = sh(cloth, 0.65); g.lineWidth = 1; g.beginPath(); g.moveTo(hip[0] + dx2 * 0.5, hip[1] + 6); g.lineTo(hip[0] + dx2 + flare * 0.5, hem - 4); g.stroke(); } g.strokeStyle = L.trim; g.lineWidth = 2; g.beginPath(); g.moveTo(hip[0] - 20 + flare * 0.5, hem - 3); g.lineTo(hip[0] + 4, hem - 1); g.lineTo(hip[0] + 22 + flare, hem - 4); g.stroke(); }
  poly(g, torso, L.bare ? L.skin : cloth); poly(g, [at(sho, 2), at(sho, 12), at(hip, 10), at(hip, 1)], L.bare ? sh(L.skin, 0.82) : sh(cloth, 0.78), null);
  if (L.bare) { poly(g, [at(sho, -11), at(sho, -2), at(hip, -3), at(hip, -10)], T[0]); poly(g, [at(sho, 5), at(sho, 12), at(hip, 10), at(hip, 6)], T[1]); g.strokeStyle = sh(L.skin, 0.65); g.lineWidth = 1; g.beginPath(); g.moveTo(...at(add(sho, [up[0] * -12, up[1] * -12]), -2)); g.lineTo(...at(add(sho, [up[0] * -12, up[1] * -12]), 6)); g.stroke(); }
  if (L.heavy) { poly(g, [at(add(sho, [up[0] * -4, up[1] * -4]), -9), at(add(sho, [up[0] * -4, up[1] * -4]), 10), at(add(hip, [up[0] * 8, up[1] * 8]), 8), at(add(hip, [up[0] * 8, up[1] * 8]), -8)], '#c0c4d0'); g.strokeStyle = '#f4f6fa'; g.lineWidth = 2; g.beginPath(); g.moveTo(...at(add(sho, [up[0] * -6, up[1] * -6]), -5)); g.lineTo(...at(add(hip, [up[0] * 12, up[1] * 12]), -5)); g.stroke(); poly(g, [at(hip, -11), at(hip, 11), at(add(hip, [-up[0] * 10, -up[1] * 10]), 13), at(add(hip, [-up[0] * 10, -up[1] * 10]), -12)], '#9a9eaa'); }
  if (!L.bare && !L.heavy) { g.strokeStyle = L.trim; g.lineWidth = 2; g.beginPath(); g.moveTo(...at(sho, -9)); g.lineTo(...at(add(sho, [-up[0] * 4, -up[1] * 4]), 1)); g.lineTo(...at(sho, 11)); g.stroke(); }
  poly(g, [at(add(hip, [up[0] * 3, up[1] * 3]), -10.5), at(add(hip, [up[0] * 3, up[1] * 3]), 10.5), at(add(hip, [up[0] * -1, up[1] * -1]), 10.5), at(add(hip, [up[0] * -1, up[1] * -1]), -10.5)], L.heavy ? '#5a5e6a' : '#4a3020'); ell(g, ...at(add(hip, [up[0] * 1, up[1] * 1]), 3), 2.4, 2, lean, '#d8b060', null);
  if (L.hood && !L.helm) poly(g, [at(sho, -12), [neck[0] - 8, neck[1] - 6], at(sho, 8), at(add(sho, [-up[0] * 8, -up[1] * 8]), 0)], sh(T[1], 0.9));
  // the head
  headOf(g, L, head, lean);
  // the near arm and the weapon
  const fe = add(sho, v(p.fa, 18)), fh = add(fe, v(p.ff, 17)), sleeve = L.bare ? L.skin : L.heavy ? '#b4b8c4' : L.robe ? cloth : dark;
  const behind = L.wt === 'bow';
  if (!behind) weapon(g, L, p, fh, 'back');
  limb(g, sho, fe, fh, 5, 4.4, 3.8, sleeve, L.robe && !L.bare ? sh(sleeve, 0.95) : sleeve, sh(sleeve, 1.35));
  if (L.heavy || L.helm) ell(g, sho[0], sho[1] + 1, 8, 6.5, lean, L.heavy ? '#c8ccd8' : sh(T[0], 1.1));
  else if (L.cape) ell(g, sho[0], sho[1] + 1, 6.5, 5, lean, T[1]);
  if (L.robe && !L.bare) { poly(g, [add(fe, v(p.ff + 1.57, 5)), add(fe, v(p.ff - 1.57, 5)), add(fh, v(p.ff - 1.8, 7)), add(fh, v(p.ff + 1.8, 7))], cloth); }
  ell(g, fh[0], fh[1], 3.8, 3.8, 0, L.heavy ? '#a8acb8' : L.skin);
  weapon(g, L, p, fh, 'front');
}
function headOf(g, L, h, lean) {
  const [x, y] = h, hc = L.hc, hd = sh(hc, 0.7), hl = sh(hc, 1.4), r = 11.5;
  // face: a rounded skull with the jaw and chin forward
  poly(g, [[x - 9, y - 6], [x - 10, y + 6, x - 4, y + 9], [x + 3, y + 13, x + 8, y + 12.5], [x + 11, y + 9, x + 10.5, y + 4], [x + 12, y - 4, x + 8, y - 10], [x, y - 14, x - 9, y - 6]], L.skin);
  poly(g, [[x - 9, y - 2], [x - 10, y + 6, x - 4, y + 9], [x + 1, y + 12, x + 5, y + 12.5], [x - 2, y + 6, x - 3, y - 1]], sh(L.skin, 0.84), null);
  ell(g, x - 3, y + 1, 2.4, 3.2, 0, L.skin);
  // eye: tall iris under a heavy lash line, a catchlight
  ell(g, x + 5.6, y + 1, 2.1, 3.1, 0, '#2a2030', null); ell(g, x + 5.2, y, 0.8, 1.1, 0, '#ffffff', null); g.strokeStyle = LINE; g.lineWidth = 1.7; g.beginPath(); g.moveTo(x + 3, y - 2.4); g.quadraticCurveTo(x + 6, y - 3.6, x + 8.4, y - 1.6); g.stroke();
  g.strokeStyle = sh(hc, 0.5); g.lineWidth = L.f ? 1 : 1.6; g.beginPath(); g.moveTo(x + 3.4, y - 5.8); g.lineTo(x + 8.6, y - 5.2); g.stroke();
  g.strokeStyle = '#8a3a3a'; g.lineWidth = 1; g.beginPath(); g.moveTo(x + 7.6, y + 8.4); g.lineTo(x + 9.6, y + 8.2); g.stroke();
  if (L.beard) { poly(g, [[x - 4, y + 4], [x + 2, y + 15, x + 10, y + 13], [x + 11, y + 8], [x + 6, y + 9, x + 2, y + 6]], L.beard); }
  if (L.helm) {
    // a steel helm with a brim and a plume of the side's colour
    poly(g, [[x - 11, y + 2], [x - 13, y - 12, x - 2, y - 16], [x + 10, y - 16, x + 12, y - 4], [x + 13, y - 2], [x + 6, y - 3], [x - 3, y - 3], [x - 6, y + 4]], '#b4b8c4'); poly(g, [[x - 9, y - 6], [x - 8, y - 13, x - 1, y - 14.5], [x - 4, y - 12, x - 5, y - 6]], '#eef0f6', null);
    g.strokeStyle = '#6a6e7a'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(x - 1, y - 15.5); g.lineTo(x - 2, y - 3); g.stroke();
    if (L.heavy || L.look === 'general' || L.look === 'darkknight' || L.look === 'wyvernlord') poly(g, [[x - 2, y - 15], [x - 12, y - 26, x - 26, y - 16], [x - 16, y - 18, x - 6, y - 11]], L.T[0]);
    return;
  }
  if (L.veil) { poly(g, [[x - 12, y + 14], [x - 15, y - 10, x - 2, y - 15], [x + 10, y - 15, x + 11, y - 6], [x + 4, y - 9], [x - 4, y - 8, x - 7, y + 2], [x - 6, y + 16]], L.P && L.P.veil ? '#f4f0ec' : '#2a2a34'); return; }
  if (L.hood) { poly(g, [[x - 13, y + 12], [x - 16, y - 12, x - 1, y - 17], [x + 12, y - 16, x + 13, y - 4], [x + 9, y - 7], [x + 1, y - 10, x - 6, y - 4], [x - 6, y + 12]], L.T[1]); poly(g, [[x - 12, y + 8], [x - 14, y - 10, x - 2, y - 15], [x - 8, y - 11, x - 9, y + 6]], sh(L.T[1], 1.25), null); g.fillStyle = hc; g.beginPath(); g.moveTo(x + 9, y - 7); g.lineTo(x + 3, y - 2); g.lineTo(x + 2, y - 8); g.fill(); return; }
  // hair: a cap over the skull, locks over the forehead, a tail if it has one
  const bald = L.P && L.P.hair === 'bald';
  if (bald) { poly(g, [[x - 9, y - 6], [x - 6, y - 14, x + 2, y - 14], [x - 4, y - 10, x - 9, y - 6]], 'rgba(255,255,255,0.3)', null); return; }
  poly(g, [[x - 11, y + 5], [x - 14, y - 10, x - 2, y - 16], [x + 10, y - 17, x + 13, y - 7], [x + 14, y - 3], [x + 10, y - 6], [x + 9, y - 1], [x + 6, y - 6], [x + 4, y - 1], [x + 1, y - 6], [x - 2, y - 2], [x - 5, y + 0], [x - 6, y + 6]], hc);
  poly(g, [[x - 11, y + 4], [x - 13, y - 6, x - 7, y - 12], [x - 9, y - 4, x - 6, y + 5]], hd, null);
  g.strokeStyle = hl; g.lineWidth = 1.6; g.beginPath(); g.arc(x - 1, y - 6, 8, Math.PI * 1.15, Math.PI * 1.55); g.stroke();
  if (L.longHair) poly(g, [[x - 10, y - 2], [x - 18, y + 12, x - 14, y + 26], [x - 8, y + 18], [x - 6, y + 4]], hc);
  if (L.P && (L.P.hair === 'pony' || L.P.hair === 'tailm' || L.P.hair === 'tied')) poly(g, [[x - 10, y - 8], [x - 26, y - 4, x - 24, y + 16], [x - 18, y + 6, x - 10, y - 2]], hc);
  if (L.P && L.P.circlet || L.look === 'princess' || L.look === 'queen') { g.strokeStyle = '#e8c860'; g.lineWidth = 1.8; g.beginPath(); g.moveTo(x - 10, y - 8); g.quadraticCurveTo(x, y - 12, x + 10, y - 8); g.stroke(); }
  if (L.P && L.P.band) { g.strokeStyle = L.P.band; g.lineWidth = 2.6; g.beginPath(); g.moveTo(x - 11, y - 5); g.quadraticCurveTo(x, y - 10, x + 12, y - 6); g.stroke(); poly(g, [[x - 11, y - 5], [x - 22, y - 2], [x - 20, y + 2], [x - 10, y - 2]], L.P.band, null); }
}
function weapon(g, L, p, hand, layer) {
  const a = p.wa, w = L.w, wt = L.wt;
  if (layer === 'back' && wt !== 'lance') return;
  if (layer === 'front' && wt === 'lance') { // the shaft passes behind the hand, the head in front
    const tip = add(hand, v(a, 66)), butt = add(hand, v(a, -36)); g.strokeStyle = LINE; g.lineWidth = 4.4; g.beginPath(); g.moveTo(...butt); g.lineTo(...tip); g.stroke(); g.strokeStyle = '#8a6040'; g.lineWidth = 2.6; g.stroke();
    const t2 = add(tip, v(a, 14)), side = (s) => add(tip, v(a + s * 1.57, 4)); poly(g, [side(1), t2, side(-1), add(tip, v(a, -3))], w && w.price > 1200 ? '#e8eef8' : '#c8ccd8'); g.strokeStyle = '#ffffff'; g.lineWidth = 0.8; g.beginPath(); g.moveTo(...tip); g.lineTo(...t2); g.stroke();
    ell(g, tip[0], tip[1], 3, 3, 0, L.trim); return;
  }
  if (layer === 'back') return;
  if (wt === 'sword') {
    const guard = add(hand, v(a, 4)), tip = add(hand, v(a, 48)), pom = add(hand, v(a, -7)), col = w && /銀|王家|灰鴉|誓火|霜牙/.test(w.name) ? '#f2f6ff' : '#d4d8e4', edge = w && w.name === '誓火' ? '#ffb050' : '#ffffff';
    const s1 = add(guard, v(a + 1.57, 2.6)), s2 = add(guard, v(a - 1.57, 2.6)), t1 = add(tip, v(a + 1.57, 0.6));
    poly(g, [s1, add(tip, v(a, -6)), tip, s2], col); g.strokeStyle = edge; g.lineWidth = 1; g.beginPath(); g.moveTo(...s1); g.lineTo(...t1); g.stroke();
    if (w && w.name === '誓火') { g.save(); g.globalCompositeOperation = 'lighter'; g.strokeStyle = 'rgba(255,150,50,0.6)'; g.lineWidth = 6; g.beginPath(); g.moveTo(...guard); g.lineTo(...tip); g.stroke(); g.restore(); }
    seg(g, add(guard, v(a + 1.57, 7)), add(guard, v(a - 1.57, 7)), 1.8, 1.8, L.trim); seg(g, hand, pom, 1.8, 1.8, '#4a3020'); ell(g, pom[0], pom[1], 2.4, 2.4, 0, L.trim);
  }
  if (wt === 'axe') {
    const top = add(hand, v(a, 34)), butt = add(hand, v(a, -8)); seg(g, butt, top, 2.2, 2.2, '#7a5434'); const b = add(top, v(a, -6)), o = v(a - 1.57, 1);
    poly(g, [add(b, [o[0] * 2, o[1] * 2]), [b[0] + o[0] * 18 + v(a)[0] * 10, b[1] + o[1] * 18 + v(a)[1] * 10, b[0] + o[0] * 20 + v(a)[0] * -2, b[1] + o[1] * 20 + v(a)[1] * -2], [b[0] + o[0] * 18 - v(a)[0] * 14, b[1] + o[1] * 18 - v(a)[1] * 14], add(b, [o[0] * 2 - v(a)[0] * 8, o[1] * 2 - v(a)[1] * 8])], w && w.price > 900 ? '#e4e8f2' : '#b8bcc8');
    g.strokeStyle = '#ffffff'; g.lineWidth = 1; g.beginPath(); g.moveTo(b[0] + o[0] * 18 + v(a)[0] * 9, b[1] + o[1] * 18 + v(a)[1] * 9); g.quadraticCurveTo(b[0] + o[0] * 21, b[1] + o[1] * 21, b[0] + o[0] * 18 - v(a)[0] * 13, b[1] + o[1] * 18 - v(a)[1] * 13); g.stroke();
  }
  if (wt === 'bow') {
    // the bow held out in front, the string drawn back when shooting
    const drawn = L.pose === 'shoot', bend = drawn ? 14 : 6, topP = add(hand, [0, -30]), botP = add(hand, [0, 30]);
    g.strokeStyle = LINE; g.lineWidth = 4.4; g.beginPath(); g.moveTo(...topP); g.quadraticCurveTo(hand[0] + 16, hand[1], ...botP); g.stroke(); g.strokeStyle = '#8a5a2a'; g.lineWidth = 2.6; g.stroke();
    const pull = drawn ? [hand[0] - 26, hand[1]] : [hand[0] - 2, hand[1]]; g.strokeStyle = '#ece4d0'; g.lineWidth = 0.9; g.beginPath(); g.moveTo(...topP); g.lineTo(...pull); g.lineTo(...botP); g.stroke();
    if (drawn) { g.strokeStyle = '#6a4a2a'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(pull[0], pull[1]); g.lineTo(hand[0] + 12, hand[1]); g.stroke(); poly(g, [[hand[0] + 12, hand[1] - 2], [hand[0] + 18, hand[1]], [hand[0] + 12, hand[1] + 2]], '#d8dce4', null); ell(g, pull[0], pull[1], 3.4, 3.4, 0, L.skin); }
    void bend;
  }
  if (wt === 'tome') {
    const col = w.type === 'dark' ? '#4a2a5a' : w.type === 'light' ? '#e8dca0' : w.eff && w.eff.includes('fly') ? '#3a8a5a' : '#a83030';
    if (L.pose === 'cast') { g.save(); g.globalCompositeOperation = 'lighter'; const gl = g.createRadialGradient(hand[0] + 8, hand[1], 0, hand[0] + 8, hand[1], 22); gl.addColorStop(0, w.type === 'dark' ? 'rgba(190,110,255,0.9)' : w.type === 'light' ? 'rgba(255,250,200,0.9)' : 'rgba(255,170,80,0.9)'); gl.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gl; g.fillRect(hand[0] - 20, hand[1] - 28, 56, 56); g.restore(); }
    else { poly(g, [[hand[0] - 2, hand[1] - 9], [hand[0] + 10, hand[1] - 7], [hand[0] + 10, hand[1] + 7], [hand[0] - 2, hand[1] + 9]], col); g.fillStyle = '#f4ecd8'; g.fillRect(hand[0] + 8, hand[1] - 6, 2, 12); g.fillStyle = '#e8c860'; g.fillRect(hand[0] + 2, hand[1] - 2, 4, 4); }
  }
  if (wt === 'staff') {
    const top = add(hand, v(a, 52)), butt = add(hand, v(a, -24)); seg(g, butt, top, 1.8, 1.8, '#c8a060', '#f0d8a0');
    ell(g, top[0], top[1], 5, 5, 0, '#8ad0ff'); g.strokeStyle = '#e8c860'; g.lineWidth = 2; g.beginPath(); g.arc(top[0], top[1], 7.5, Math.PI * 0.2, Math.PI * 1.8); g.stroke();
    if (L.pose === 'cast') { g.save(); g.globalCompositeOperation = 'lighter'; const gl = g.createRadialGradient(top[0], top[1], 0, top[0], top[1], 26); gl.addColorStop(0, 'rgba(200,255,220,0.9)'); gl.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gl; g.fillRect(top[0] - 26, top[1] - 26, 52, 52); g.restore(); }
  }
}
// ---------------------------------------------------------------- mounts
function mount(g, L, p, layer) {
  const m = L.mount, run = L.pose === 'strike' ? 1 : 0, back = L.pose === 'hit' || L.pose === 'dodge' ? 1 : 0, dx = (p.dx || 0) * 0.6;
  if (m === 'horse') {
    const col = L.look === 'darkknight' ? '#2a2428' : L.look === 'valkyrie' || L.look === 'inquisitor' ? '#ece8e0' : L.look === 'gk' ? '#5a4a3a' : '#8a5a34', dk = sh(col, 0.7), lt = sh(col, 1.3), mane = L.look === 'valkyrie' ? '#e8dcc0' : sh(col, 0.4);
    const bx = dx - 4, by = -60 - run * 4 + back * 2, tilt = run ? -0.12 : back ? 0.1 : 0;
    if (layer === 'back') {
      // far legs, tail, body, neck and head; the near legs come after the rider
      leg4(g, [bx - 22, by + 6], run ? -0.6 : back ? 0.3 : -0.1, run ? 0.4 : 0, dk); leg4(g, [bx + 22, by + 6], run ? 0.9 : back ? -0.3 : 0.12, run ? -0.6 : 0, dk);
      poly(g, [[bx - 30, by - 4], [bx - 50, by + 4 - run * 8, bx - 48, by + 34], [bx - 40, by + 22], [bx - 36, by + 6]], mane);
      ell(g, bx, by + 4, 32, 15, tilt, col); ell(g, bx + 4, by + 10, 24, 7, tilt, dk, null); ell(g, bx - 4, by - 3, 22, 5, tilt, lt, null);
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
      wing(g, [bx + 6, by - 8], flap ? 2.4 : 2.0, 54, '#d8dce8');
      leg4(g, [bx - 20, by + 6], -0.9, 1.2, dk, 0.8); leg4(g, [bx + 20, by + 6], 1.2, -1.4, dk, 0.8);
      poly(g, [[bx - 28, by - 2], [bx - 52, by + 2, bx - 50, by + 26], [bx - 40, by + 14], [bx - 34, by + 4]], '#e8e4f0');
      ell(g, bx, by + 4, 30, 14, -0.05, col); ell(g, bx + 4, by + 10, 22, 6, 0, dk, null);
      const nb = [bx + 22, by - 4], hd = [bx + 38 + run * 6, by - 30 + run * 6];
      poly(g, [[nb[0] - 8, nb[1] + 4], [hd[0] - 8, hd[1] - 2], [hd[0] + 2, hd[1] - 6], [nb[0] + 10, nb[1] + 10]], col);
      poly(g, [[hd[0] - 8, hd[1] - 6], [hd[0] + 6, hd[1] - 10], [hd[0] + 18, hd[1] + 3], [hd[0] + 16, hd[1] + 9], [hd[0] + 5, hd[1] + 7], [hd[0] - 4, hd[1] + 4]], col);
      poly(g, [[hd[0] - 2, hd[1] - 8], [hd[0] - 3, hd[1] - 17], [hd[0] + 3, hd[1] - 10]], col); ell(g, hd[0] + 5, hd[1] - 2, 1.6, 1.6, 0, '#3a2a4a', null);
      poly(g, [[nb[0] - 8, nb[1] + 2], [hd[0] - 10, hd[1] - 4], [hd[0] - 6, hd[1] - 10], [nb[0] - 14, nb[1] - 2]], '#c8d8f0');
      poly(g, [[bx - 14, by - 10], [bx + 14, by - 10], [bx + 16, by + 8], [bx - 16, by + 8]], L.T[0]); g.strokeStyle = L.trim; g.lineWidth = 2; g.beginPath(); g.moveTo(bx - 16, by + 7); g.lineTo(bx + 16, by + 7); g.stroke();
      return [bx - 2, by - 12];
    }
    leg4(g, [bx - 16, by + 8], -0.7, 1.4, col, 0.8); leg4(g, [bx + 22, by + 8], 1.0, -1.6, col, 0.8);
    wing(g, [bx - 2, by - 6], flap ? 2.6 : 2.2, 62, '#ffffff');
  }
  if (m === 'wyvern') {
    const col = L.look === 'wyvernlord' ? '#5a6a8a' : '#5a7a4a', dk = sh(col, 0.65), lt = sh(col, 1.3), belly = '#d8c890', bx = dx - 6, by = -70 - run * 6, flap = L.pose === 'strike' || L.pose === 'wind' ? 1 : 0;
    if (layer === 'back') {
      bwing(g, [bx + 4, by - 10], flap ? 2.6 : 2.1, 70, dk);
      poly(g, [[bx - 26, by], [bx - 60, by + 14, bx - 84, by + 6], [bx - 64, by + 22, bx - 28, by + 14]], col);
      ell(g, bx, by + 4, 32, 15, -0.1, col); ell(g, bx + 2, by + 13, 26, 6, -0.05, belly, null); ell(g, bx - 6, by - 4, 22, 5, -0.1, lt, null);
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
      ell(g, bx, by + 2, 30, 13, -0.04, col); ell(g, bx + 2, by + 8, 22, 5, 0, dk, null);
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
  // a bird's wing: the leading edge out to the tip, the trailing edge scalloped into feathers
  const tip = add(root, v(a, len)), back = a - 2.3, edge = [];
  for (let k = 0; k <= 6; k++) { const t = k / 6, base = add(root, v(a, len * (1 - t * 0.85))); edge.push(add(base, v(back + t * 0.5, len * (0.18 + Math.sin(t * Math.PI) * 0.32)))); }
  g.beginPath(); g.moveTo(...root); g.lineTo(...tip); for (let k = 0; k < edge.length; k++) { const prev = k ? edge[k - 1] : tip, e = edge[k]; g.quadraticCurveTo((prev[0] + e[0]) / 2 + 4, (prev[1] + e[1]) / 2 + 4, e[0], e[1]); } g.lineTo(...add(root, v(back, 8))); g.closePath();
  g.fillStyle = col; g.fill(); g.strokeStyle = LINE; g.lineWidth = 1.4; g.stroke();
  g.strokeStyle = sh(col === '#ffffff' ? '#e0e4ee' : col, 0.82); g.lineWidth = 1; for (let k = 1; k < edge.length; k++) { const base = add(root, v(a, len * (1 - (k / 6) * 0.85))); g.beginPath(); g.moveTo(...base); g.lineTo(...edge[k]); g.stroke(); }
  g.strokeStyle = '#ffffff'; g.lineWidth = 2; g.beginPath(); g.moveTo(...root); g.lineTo(...tip); g.stroke();
}
function bwing(g, root, a, len, col) {
  // a bat's wing: bony fingers with skin between
  const tip = add(root, v(a, len)), f = [0.0, 0.5, 0.95].map((t) => add(tip, v(a - 2.2 - t * 0.6, len * (0.7 - t * 0.2))));
  poly(g, [root, tip, f[0], [tip[0] + (f[1][0] - tip[0]) * 0.6, tip[1] + (f[1][1] - tip[1]) * 0.6 + 6], f[1], [tip[0] + (f[2][0] - tip[0]) * 0.7, tip[1] + (f[2][1] - tip[1]) * 0.7 + 8], f[2], add(root, [-10, 10])], sh(col, 0.85));
  seg(g, root, tip, 5, 3, col); for (const q of f) seg(g, tip, q, 2, 1.2, col);
}
