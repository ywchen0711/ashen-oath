// How hard is each chapter, in numbers? For every chapter: an army as it would be by then (who has joined, at the
// levels they'd have reached with average growths, promoted around level 12, with the weapons the shops sell by
// then), set against that chapter's enemies. Reports how many rounds an average enemy needs to kill an average
// unit of yours, and how many rounds you need to kill one of theirs. A healthy tactics game: you need ~1.5–2.5
// rounds, they need ~3–5.
import { CHAPTERS } from '../js/data/story.js';
import { CAST } from '../js/data/cast.js';
import { CLASSES, STATS } from '../js/data/classes.js';
import { ITEMS } from '../js/data/items.js';
import { recruit, soldier, forecast, promote } from '../js/rules.js';

const joined = {}; CHAPTERS.forEach((ch, i) => { const ids = [...(ch.joinBefore || []), ...(ch.joinAfterIntro || [])]; for (const id of ids) if (joined[id] == null) joined[id] = i; for (const e of ch.events || []) for (const d of e.do || []) if (d.join && joined[d.join] == null) joined[d.join] = i; for (const v of Object.values(ch.villages || {})) { if (v.join && joined[v.join] == null) joined[v.join] = i; for (const st of v.stages || []) for (const d of st.do || []) if (d.join && joined[d.join] == null) joined[d.join] = i; } for (const d of ch.after || []) if (d.join && joined[d.join] == null) joined[d.join] = i + 1; });
const tier = (c) => (c < 6 ? 'iron' : c < 14 ? 'steel' : 'silver'), WPN = { sword: ['ironSword', 'steelSword', 'silverSword'], lance: ['ironLance', 'steelLance', 'silverLance'], axe: ['ironAxe', 'steelAxe', 'silverAxe'], bow: ['ironBow', 'steelBow', 'silverBow'], anima: ['fire', 'thunder', 'elfire'], light: ['lightning', 'shine', 'divine'], dark: ['flux', 'flux', 'nosferatu'], staff: ['heal', 'mend', 'physic'] };
function project(id, c) {
  const u = recruit(id), levels = Math.max(0, (c - joined[id]) * (+process.env.RATE || 1.4));
  let left = levels;
  const grow = (n) => { for (const s of STATS) u.stats[s] = Math.min(CLASSES[u.cls].cap[s], u.stats[s] + u.grows[s] * n / 100); u.lv += n; };
  while (left > 0) { const room = (CLASSES[u.cls].tier === 1 ? 12 : 20) - u.lv; const n = Math.min(left, Math.max(0, room)); grow(n); left -= n; if (CLASSES[u.cls].tier === 1 && u.lv >= 12 && CLASSES[u.cls].to.length) promote(u, CLASSES[u.cls].to[0]); else break; }
  for (const s of STATS) u.stats[s] = Math.round(u.stats[s]); u.hp = u.stats.hp;
  const k = CLASSES[u.cls], t = c < 6 ? 0 : c < 14 ? 1 : 2, w = k.weapons.find((x) => x !== 'staff');
  if (w) u.items = [{ id: WPN[w][t], uses: 30 }, ...u.items];
  return u;
}
const pct = (a) => a.sort((x, y) => x - y)[Math.floor(a.length / 2)];
console.log('ch     you-need  they-need  (rounds to kill; median over pairs)  units');
for (const [i, ch] of CHAPTERS.entries()) {
  if (ch.scene) continue;
  const mine = Object.keys(joined).filter((id) => joined[id] <= i && CAST[id].cls && !['owen'].includes(id) || (id === 'owen' && i <= 7)).map((id) => project(id, i));
  const foes = [...(ch.units || []).filter((d) => !d.side || d.side === 'enemy').filter((d) => d.cls && !d.trial), ...(ch.reinforce || []).flatMap((r) => r.units)].map((d) => soldier(d.cls, Math.min(20, d.lv + (ch.boost || 0)), d.items || [], { bonus: d.bonus, oathbound: d.oathbound, side: 'enemy' }));
  if (!foes.length || !mine.length) continue;
  const you = [], they = [];
  for (const a of mine) for (const b of foes) {
    a.x = 0; a.y = 0; b.x = 1; b.y = 0; const ctx = { units: [] };
    const wa = a.items.find((it) => ITEMS[it.id].kind === 'weapon'), wb = b.items.find((it) => ITEMS[it.id].kind === 'weapon');
    if (wa) { const f = forecast(a, wa, b, ctx); if (f.A) { const per = f.A.dmg * f.A.hit / 100 * (f.A.doubles ? 2 : 1); you.push(per > 0 ? b.hp / per : 99); } }
    if (wb) { const f = forecast(b, wb, a, ctx); if (f.A) { const per = f.A.dmg * f.A.hit / 100 * (f.A.doubles ? 2 : 1); they.push(per > 0 ? a.hp / per : 99); } }
  }
  const avgLv = (mine.reduce((s, u) => s + u.lv + (CLASSES[u.cls].tier === 2 ? 10 : 0), 0) / mine.length).toFixed(1), eLv = (foes.reduce((s, u) => s + u.lv + (CLASSES[u.cls].tier === 2 ? 10 : 0), 0) / foes.length).toFixed(1);
  console.log(`${ch.no.padEnd(5, '　')}  ${pct(you).toFixed(1).padStart(5)}     ${pct(they).toFixed(1).padStart(5)}       your lv ${avgLv} vs theirs ${eLv}   ${mine.length} vs ${foes.length}`);
}
