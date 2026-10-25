// The rules of war: a unit's numbers, the weapon it holds, what a fight between two units looks like before it
// happens (the forecast) and how it plays out, experience and levels, promotion. Pure logic, tested in Node.
import { CLASSES, STATS, SKILLS } from './data/classes.js';
import { ITEMS, TRIANGLE } from './data/items.js';
import { CAST } from './data/cast.js';
import { terrainAt } from './data/terrain.js';

// a seeded random number generator, so a suspended chapter resumes exactly
export function rng(seed) { let s = seed >>> 0 || 1; const f = () => { s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; f.state = () => s; f.set = (v) => { s = v; }; return f; }
export const R100 = (R) => Math.floor(R() * 100);

let UID = 1;
export const cls = (u) => CLASSES[u.cls];
export const isPromoted = (u) => cls(u).tier === 2;
export const hasSkill = (u, s) => !(u.off || []).includes(s) && (cls(u).skills.includes(s) || u.personal === s || (u.extraSkills || []).includes(s));
// a named person joins: their own bases and growths
export function recruit(id, over = {}) {
  const c = CAST[id], k = CLASSES[c.cls];
  const u = { uid: UID++, id, name: c.name, cls: c.cls, lv: c.lv, exp: 0, stats: { ...c.bases, mov: k.mov }, grows: { ...c.grows }, items: c.items.map((i) => ({ id: i, uses: ITEMS[i].uses })), side: 'player', personal: c.personal, lord: !!c.lord, ...over };
  u.hp = u.stats.hp; return u;
}
// a nameless soldier of a class at a level (average growths, so the same map is the same every time)
export function soldier(clsId, lv, items, o = {}) {
  const k = CLASSES[clsId], st = { mov: k.mov };
  for (const s of STATS) st[s] = Math.min(k.cap[s], k.base[s] + Math.floor(k.grow[s] * (lv - 1) / 100 + 0.5));
  const u = { uid: UID++, id: o.id || null, name: o.name || k.name, cls: clsId, lv, exp: 0, stats: st, grows: { ...k.grow }, items: items.map((i) => (typeof i === 'string' ? { id: i, uses: ITEMS[i].uses } : i)), side: 'enemy', ...o };
  if (!u.name) u.name = k.name;
  if (o.bonus) for (const [s, v] of Object.entries(o.bonus)) u.stats[s] += v;
  u.hp = u.stats.hp; return u;
}
export const setUid = (n) => { UID = Math.max(UID, n); };

// ---------------------------------------------------------------- weapons
export function canUse(u, id) {
  const it = ITEMS[id]; if (!it || (it.kind !== 'weapon' && it.kind !== 'staff')) return false;
  if (it.only && !it.only.includes(u.id)) return false;
  return cls(u).weapons.includes(it.type);
}
export function equipped(u) { const w = u.items.find((i) => ITEMS[i.id].kind === 'weapon' && canUse(u, i.id)); return w || null; }
export function weapons(u) { return u.items.filter((i) => ITEMS[i.id].kind === 'weapon' && canUse(u, i.id)); }
export function staves(u) { return u.items.filter((i) => ITEMS[i.id].kind === 'staff' && canUse(u, i.id)); }
export function equip(u, it) { const k = u.items.indexOf(it); if (k > 0) { u.items.splice(k, 1); u.items.unshift(it); } }
export function rangeOf(u, it) {
  const w = ITEMS[it.id]; let [a, b] = w.rng;
  if (b === 'mag') b = Math.max(1, Math.floor(u.stats.mag / 2));
  if (w.type === 'bow' && hasSkill(u, 'longshot')) b += 1;
  return [a, b];
}
// every range this unit can strike at with any weapon it carries
export function reach(u) { let lo = 99, hi = 0; for (const it of weapons(u)) { const [a, b] = rangeOf(u, it); lo = Math.min(lo, a); hi = Math.max(hi, b); } return hi ? [lo, hi] : null; }
const triangle = (a, b) => { if (!a || !b) return 0; if (TRIANGLE[a] === b) return 1; if (TRIANGLE[b] === a) return -1; return 0; };

// ---------------------------------------------------------------- the numbers of a fight
// ctx: { map (to read terrain), units (to find neighbours for supports / guard / oath), tactics (side → bonus) }
export function attackSpeed(u, it) { const w = it ? ITEMS[it.id] : null; return u.stats.spd - Math.max(0, (w ? w.wt : 0) - u.stats.str); }
const tagsOf = (u) => [...cls(u).tags, ...(u.oathbound ? ['oathbound'] : [])];
function neighbours(ctx, u) { return (ctx.units || []).filter((o) => o !== u && o.side === u.side && !o.dead && o.x != null && Math.abs(o.x - u.x) + Math.abs(o.y - u.y) === 1); }
export function supportBonus(ctx, u) {
  // allies within three squares with a support with this unit lend hit and avoid
  let hit = 0, avo = 0, crit = 0; const sup = (ctx.supports || {});
  for (const o of (ctx.units || [])) { if (o === u || o.side !== u.side || o.dead || o.x == null || !u.id || !o.id) continue; const lvl = sup[[u.id, o.id].sort().join('+')] || 0; if (!lvl) continue; if (Math.abs(o.x - u.x) + Math.abs(o.y - u.y) <= 3) { hit += lvl * 5; avo += lvl * 5; crit += lvl * 2; } }
  return { hit, avo, crit };
}
export function numbers(att, aw, def, dw, ctx, dist) {
  // aw / dw: the weapon items in hand (or null). Returns att's might against def at this distance.
  const w = aw ? ITEMS[aw.id] : null; if (!w) return null;
  const [lo, hi] = rangeOf(att, aw); if (dist < lo || dist > hi) return null;
  const magic = !!w.magic, power = magic ? att.stats.mag : att.stats.str;
  const tri = triangle(w.type, dw ? ITEMS[dw.id].type : null);
  const eff = w.eff && w.eff.some((t) => tagsOf(def).includes(t)) || (hasSkill(att, 'slayer') && def.oathbound);
  let mt = w.mt + tri; if (eff) mt *= 3;
  const ter = ctx.map ? terrainAt(ctx.map.tile(def.x, def.y)) : { def: 0, avo: 0 }, terA = ctx.map ? terrainAt(ctx.map.tile(att.x, att.y)) : { def: 0, avo: 0 };
  const flyer = (u) => cls(u).move === 'fly';
  const guard = neighbours(ctx, def).some((o) => hasSkill(o, 'guard')) ? 2 : 0;
  const brace = hasSkill(def, 'brace') && cls(att).tags.includes('cav') ? 5 : 0;
  const barrier = def.status && def.status.barrier ? 7 : 0;
  const defense = (magic ? def.stats.res + barrier : def.stats.def + brace) + guard + (flyer(def) ? 0 : ter.def);
  const dmg = Math.max(0, power + mt - defense);
  const sa = supportBonus(ctx, att), sd = supportBonus(ctx, def);
  const tacA = (ctx.tactics && ctx.tactics[att.side]) || 0, tacD = (ctx.tactics && ctx.tactics[def.side]) || 0;
  const oathA = hasSkill(att, 'oath') && neighbours(ctx, att).length ? 10 : 0, oathD = hasSkill(def, 'oath') && neighbours(ctx, def).length ? 10 : 0;
  const hitRate = w.hit + att.stats.skl * 2 + Math.floor(att.stats.lck / 2) + tri * 15 + sa.hit + tacA + oathA;
  const avoid = attackSpeed(def, dw) * 2 + def.stats.lck + (flyer(def) ? 0 : ter.avo) + sd.avo + tacD + oathD;
  const hit = Math.max(0, Math.min(100, hitRate - avoid));
  const critRate = w.crit + Math.floor(att.stats.skl / 2) + (hasSkill(att, 'crit15') ? 15 : 0) + sa.crit;
  const crit = Math.max(0, Math.min(100, critRate - def.stats.lck - sd.crit));
  const doubles = attackSpeed(att, aw) - attackSpeed(def, dw) >= 4;
  return { dmg, hit, crit, doubles, eff, tri, mt: w.mt, power, weapon: w };
}
export const distance = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
// what will happen if att strikes def with aw from where it stands (the forecast)
export function forecast(att, aw, def, ctx) {
  const d = distance(att, def), dw = equipped(def);
  const A = numbers(att, aw, def, dw, ctx, d), B = dw ? numbers(def, dw, att, aw, ctx, d) : null;
  const asleep = def.status && def.status.sleep;
  return { A, B: asleep ? null : B, d };
}
// play a fight out. Returns the strikes in order, so the battle scene can show them.
export function fight(att, aw, def, ctx, R) {
  const f = forecast(att, aw, def, ctx), strikes = [], dw = equipped(def), hp0 = { A: att.hp, B: def.hp }, wA = aw && aw.id, wB = dw && dw.id;
  const order = [['A', att, aw, def, f.A]]; if (f.B) order.push(['B', def, dw, att, f.B]);
  if (f.A && f.A.doubles) order.push(['A', att, aw, def, f.A]); else if (f.B && f.B.doubles) order.push(['B', def, dw, att, f.B]);
  for (const [side, u, w, o, N] of order) {
    if (!N || u.hp <= 0 || o.hp <= 0 || w.uses <= 0) continue;
    const hit = (R100(R) + R100(R)) / 2 < N.hit; let crit = false, dmg = 0, lethal = false, miracle = false;
    if (hit) {
      crit = R100(R) < N.crit; dmg = N.dmg * (crit ? 3 : 1);
      if (crit && hasSkill(u, 'silent') && !o.boss && R() < 0.5) { lethal = true; dmg = o.hp; }
      if (dmg >= o.hp && hasSkill(o, 'miracle') && !o.miracleUsed && o.hp > 1 && o.hp >= o.stats.hp / 2) { dmg = o.hp - 1; o.miracleUsed = true; miracle = true; }
      o.hp = Math.max(0, o.hp - dmg);
      if (ITEMS[w.id].drain) u.hp = Math.min(u.stats.hp, u.hp + dmg);
    }
    if (!ITEMS[w.id].infinite) w.uses -= 1;
    strikes.push({ side, hit, crit, dmg, lethal, miracle, hpA: att.hp, hpB: def.hp, broke: w.uses <= 0 });
    if (w.uses <= 0) u.items = u.items.filter((i) => i !== w);
  }
  return { strikes, f, hp0, wA, wB };
}

// ---------------------------------------------------------------- experience and levels
const levelValue = (u) => u.lv + (isPromoted(u) ? 20 : 0);
export function expFor(me, foe, dealt, killed) {
  const d = levelValue(foe) - levelValue(me);
  if (!dealt && !killed) return 1;
  let e = Math.max(1, Math.floor((31 + d) / 3));
  if (killed) e += Math.max(0, d * 3 + 20 + (foe.boss ? 40 : 0) + (isPromoted(foe) ? 20 : 0));
  if (isPromoted(me)) e = Math.floor(e * 0.7);
  return Math.max(1, Math.min(100, e));
}
// grow one level: each stat rises by its growth chance (never past the class cap)
export function levelUp(u, R) {
  const k = cls(u), gains = {}; let any = 0;
  for (const s of STATS) { const g = u.grows[s] || 0; let n = Math.floor(g / 100); if (R100(R) < g % 100) n++; const room = k.cap[s] - u.stats[s]; n = Math.max(0, Math.min(n, room)); if (n) { gains[s] = n; u.stats[s] += n; any++; } }
  // a level with nothing at all is cruel: give the best-growing stat with room
  if (!any) { const s = STATS.filter((x) => u.stats[x] < k.cap[x]).sort((a, b) => (u.grows[b] || 0) - (u.grows[a] || 0))[0]; if (s) { gains[s] = 1; u.stats[s]++; } }
  if (gains.hp) u.hp += gains.hp;
  u.lv++; return gains;
}
export function gainExp(u, e, R) { const ups = []; if (u.lv >= 20) return ups; u.exp += e; while (u.exp >= 100 && u.lv < 20) { u.exp -= 100; ups.push(levelUp(u, R)); } if (u.lv >= 20) u.exp = 0; return ups; }
export function canPromote(u) { return cls(u).tier === 1 && u.lv >= 10 && cls(u).to.length > 0; }
export function promote(u, to) {
  const k = CLASSES[to], gains = {};
  for (const s of STATS) { const n = Math.min(k.cap[s], Math.max(u.stats[s] + k.promo[s], k.base[s])) - u.stats[s]; if (n > 0) { gains[s] = n; u.stats[s] += n; } }
  const mv = k.mov - u.stats.mov; if (mv > 0) gains.mov = mv; u.stats.mov = Math.max(u.stats.mov, k.mov);
  u.hp = Math.min(u.stats.hp, u.hp + (gains.hp || 0)); u.cls = to; u.lv = 1; u.exp = 0; return gains;
}
// a staff's healing
export function healAmount(u, it) { const s = ITEMS[it.id]; return s.heal >= 99 ? 99 : s.heal + u.stats.mag; }
export function staffExp(u, it) { const s = ITEMS[it.id]; return s.status ? 25 : s.warp || s.pull ? 25 : s.heal >= 99 ? 22 : 12; }
export { SKILLS };
