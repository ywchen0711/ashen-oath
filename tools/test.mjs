// Checks every chapter: the map is rectangular; units, start squares, villages, chests, shops and exits sit where
// they should; the seize square and the exits can be reached; every speaker has a face. Then each chapter is
// fought headless (the player's side played by the same AI as the enemy) to make sure the scripts run to an end.
import { CHAPTERS } from '../js/data/story.js';
import { CAST } from '../js/data/cast.js';
import { CLASSES } from '../js/data/classes.js';
import { ITEMS } from '../js/data/items.js';
import { TERRAIN } from '../js/data/terrain.js';
import { Field } from '../js/map.js';
import { Battle } from '../js/engine.js';
import { recruit, soldier } from '../js/rules.js';
import { think } from '../js/ai.js';
import { SUPPORTS } from '../js/data/supports.js';

let fail = 0, warn = 0; const bad = (m) => { fail++; console.log('  FAIL', m); }, note = (m) => { warn++; console.log('  warn', m); };
const speakers = (lines, where) => { if (!lines) return; if (typeof lines === 'function') return; for (const ln of lines) { if (Array.isArray(ln)) { let w = ln[0]; if (w === '-') continue; w = w.replace(/^[<>]/, '').split('|')[0]; if (!CAST[w]) bad(`${where}: unknown speaker ${w}`); if (ln.length === 3 && !'平笑喜怒悲驚痛冷羞決閉哭'.includes(ln[1])) bad(`${where}: bad expression ${ln[1]}`); } else { if (ln.then) speakers(ln.then, where); if (ln.else) speakers(ln.else, where); if (ln.opts) for (const o of ln.opts) if (o[3]) speakers(o[3], where); } } };
const army = Object.keys(CAST).filter((id) => CAST[id].cls).map((id) => recruit(id));
for (const ch of CHAPTERS) {
  console.log(`${ch.no} ${ch.title}`);
  speakers(typeof ch.intro === 'function' ? null : ch.intro, ch.no + ' intro'); speakers(ch.mapIntro, ch.no + ' map'); speakers(typeof ch.outro === 'function' ? null : ch.outro, ch.no + ' outro');
  for (const e of ch.events || []) speakers(typeof e.lines === 'function' ? null : e.lines, ch.no + ' event');
  for (const v of Object.values(ch.villages || {})) { speakers(v.lines, ch.no + ' village'); if (v.gift && !ITEMS[v.gift]) bad('village gift ' + v.gift); }
  for (const r of ch.reinforce || []) speakers(r.lines, ch.no + ' reinforce');
  if (ch.scene) continue;
  const widths = new Set(ch.map.map((r) => r.length)); if (widths.size > 1) bad(`map rows have widths ${[...widths].join(',')}: ` + ch.map.map((r, i) => `${i}:${r.length}`).filter((s) => !s.endsWith(':' + ch.map[0].length)).join(' '));
  for (const r of ch.map) for (const c of r) if (!TERRAIN[c]) bad('unknown terrain ' + c);
  const F = new Field(ch.map), taken = new Set();
  const passable = (cls, x, y) => { const u = { cls, stats: { mov: 9 } }; return F.inside(x, y) && F.cost(u, x, y) < 99; };
  for (const [x, y] of ch.deploy) { if (!passable('sellsword', x, y)) bad(`deploy ${x},${y} on ${F.tile(x, y)}`); taken.add(x + ',' + y); }
  const allUnits = [...(ch.units || []), ...(ch.reinforce || []).flatMap((r) => r.units)];
  for (const d of ch.units || []) { const cls = d.cls || (CAST[d.id] && CAST[d.id].cls); if (!CLASSES[cls]) { bad(`unit ${d.id || d.cls} has no class`); continue; } if (!passable(cls, d.x, d.y)) bad(`${d.id || d.cls} at ${d.x},${d.y} on '${F.tile(d.x, d.y)}'`); if (taken.has(d.x + ',' + d.y)) bad(`two units at ${d.x},${d.y}`); taken.add(d.x + ',' + d.y); for (const i of d.items || []) if (!ITEMS[i]) bad('item ' + i); }
  for (const r of ch.reinforce || []) for (const d of r.units) { if (!CLASSES[d.cls]) bad('reinforce class ' + d.cls); if (!passable(d.cls, d.x, d.y)) bad(`reinforce ${d.cls} at ${d.x},${d.y} on '${F.tile(d.x, d.y)}'`); for (const i of d.items || []) if (!ITEMS[i]) bad('item ' + i); }
  for (const k of Object.keys(ch.villages || {})) { const [x, y] = k.split(',').map(Number); if (F.tile(x, y) !== 'v') bad(`village ${k} is '${F.tile(x, y)}'`); }
  for (const [k, v] of Object.entries(ch.chests || {})) { const [x, y] = k.split(',').map(Number); if (F.tile(x, y) !== 'C') bad(`chest ${k} is '${F.tile(x, y)}'`); if (v !== 'gold' && !ITEMS[v]) bad('chest item ' + v); }
  for (const k of Object.keys(ch.shops || {})) { const [x, y] = k.split(',').map(Number); if (!'ka'.includes(F.tile(x, y))) bad(`shop ${k} is '${F.tile(x, y)}'`); }
  // reachability from the start, on foot, ignoring people
  const u = { cls: 'sellsword', x: ch.deploy[0][0], y: ch.deploy[0][1], stats: { mov: 999 }, side: 'player' }, m = F.moves(u, []); const reach = (x, y) => (x === u.x && y === u.y) || m.cost.has(y * F.W + x);
  const g = ch.goal; if (g.type === 'seize' && !reach(g.x, g.y)) bad(`seize square ${g.x},${g.y} can't be reached`);
  for (const [x, y] of g.exits || []) { if (!passable('sellsword', x, y)) bad(`exit ${x},${y} blocked`); }
  if (g.exits && !g.exits.some(([x, y]) => reach(x, y))) bad('no exit can be reached');
  for (const d of ch.units || []) if (d.side !== 'enemy' && d.side !== undefined && d.side !== 'other') { if (!reach(d.x, d.y)) note(`ally ${d.id} can't be walked to`); }
}
// talk events and supports name real people
for (const ch of CHAPTERS) for (const e of ch.events || []) if (e.talk) for (const id of e.talk) if (id !== '*' && !CAST[id]) bad(`${ch.no}: talk with unknown ${id}`);
for (const [k, s] of Object.entries(SUPPORTS)) { for (const id of k.split('+')) if (!CAST[id]) bad('support ' + k); for (const lv of ['C', 'B', 'A']) if (s[lv]) speakers(s[lv], 'support ' + k + lv); }
// fight each chapter headless
console.log('\nsimulated battles (both sides played by the AI):');
const ui = { say: async () => {}, fight: async () => {}, exp: async () => {}, heal: async () => {}, note: async () => {}, walk: async () => {}, refresh() {}, repaint() {}, toast() {}, levelUp: async () => {} };
for (const ch of CHAPTERS) {
  if (ch.scene) continue;
  const arm = army.map((u) => JSON.parse(JSON.stringify(u))).filter((u) => ['lian', 'ashelia', 'mira', 'bart', 'owen', 'kalan', 'grace', 'edwin', 'varl', 'tim', 'gavin'].includes(u.id));
  for (const u of arm) { u.lv = Math.min(20, u.lv + CHAPTERS.indexOf(ch)); }
  try {
    const B = new Battle(ch, arm, { ui, seed: 7 });
    const lords = arm.filter((u) => u.lord), rest = arm.filter((u) => !u.lord && !(ch.units || []).some((d) => d.id === u.id));
    B.deploy([...lords, ...rest].slice(0, ch.deploy.length));
    let t = 0;
    while (!B.done && t < 40) {
      await B.beginTurn('player'); if (B.done) break;
      for (const p of B.side('player')) { if (B.done) break; const a = think({ ...p, ai: 'charge' }, { F: B.F, units: B.alive, R: B.R, villages: () => [], chests: () => [], exits: () => B.goal.exits || [[0, 0]], ...B.ctx() }); if (a.move) { const [x, y] = a.move; if (!B.at(x, y) || B.at(x, y) === p) { p.x = x; p.y = y; } } if (a.weapon && a.target && !a.target.dead) await B.attack(p, a.weapon, a.target); else if (a.staff && a.target) await B.staff(p, a.staff, a.target); p.acted = true; if (B.goal.type === 'seize' && p.lord && p.x === B.goal.x && p.y === B.goal.y) B.done = 'win'; if (B.goal.exits && B.isExit(p.x, p.y)) await B.escape(p); B.check(); }
      if (B.done) break;
      if (B.side('ally').length) { await B.beginTurn('ally'); await B.aiPhase('ally'); }
      if (B.done) break;
      await B.beginTurn('enemy'); await B.aiPhase('enemy'); B.phase = 'enemyEnd'; B.check(); t++;
    }
    const lost = B.units.filter((u) => u.side === 'player' && u.dead).map((u) => u.name);
    console.log(`  ${ch.no}: ${B.done || 'unfinished'} after ${B.turn} turns${B.loseWhy ? ' (' + B.loseWhy + ')' : ''}; fell: ${lost.join('、') || 'none'}; enemies left ${B.side('enemy').length}`);
  } catch (e) { bad(`${ch.no} crashed: ${e.stack.split('\n').slice(0, 3).join(' | ')}`); }
}
console.log(fail ? `\n${fail} failed, ${warn} warnings` : `\nall ok (${warn} warnings)`); process.exit(fail ? 1 : 0);
