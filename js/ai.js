// How the enemy (and green allies) think. Every unit has a way of fighting:
//   charge     comes at you from anywhere on the map
//   range      waits until you step into its reach this turn, then strikes (most soldiers)
//   hold       never moves; strikes whatever comes within its weapon's range (archers on walls, bosses on thrones)
//   guard:N    stands still until one of yours comes within N squares, then charges
//   raid       goes for the villages to burn them, fighting only what blocks the way
//   thief      runs for the chests, takes what is inside and runs for the exit
//   seize      makes for a target square (defend maps: if it gets there, you lose)
//   flee       a civilian running for an exit
//   heal       (any staff user) mends the most hurt of its friends first
// Choosing whom to hit: the most damage it can expect to deal, a big pull toward kills, a push away from heavy
// counter-attacks, and a liking for the people it was told to hunt.
import { forecast, equipped, weapons, staves, rangeOf, canUse, healAmount, cls } from './rules.js';
import { ITEMS } from './data/items.js';
import { terrainAt } from './data/terrain.js';
import { friendly } from './map.js';

// walking distance from every square to the nearest of some goal squares, for this unit (ignoring how far it can go this turn)
export function distanceField(F, u, goals, units) {
  const W = F.W, d = new Float32Array(F.W * F.H).fill(1e9), q = [];
  const blocked = new Set(); for (const o of units) if (!o.dead && o.x != null && !friendly(u, o) && o !== u) blocked.add(o.y * W + o.x);
  for (const [x, y] of goals) { d[y * W + x] = 0; q.push([0, x, y]); }
  while (q.length) {
    q.sort((a, b) => a[0] - b[0]); const [c, x, y] = q.shift(); if (c > d[y * W + x]) continue;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy; if (!F.inside(nx, ny)) continue; const step = F.cost(u, x, y); if (step >= 99) continue; const nc = c + step + (blocked.has(ny * W + nx) ? 2 : 0); if (nc < d[ny * W + nx]) { d[ny * W + nx] = nc; q.push([nc, nx, ny]); } }
  }
  return d;
}
function score(u, w, t, ctx, ownCounter) {
  const f = forecast(u, w, t, ctx); if (!f.A) return null;
  const strikes = f.A.doubles ? 2 : 1, exp = Math.min(t.hp, f.A.dmg * strikes * f.A.hit / 100);
  const kill = f.A.dmg * strikes >= t.hp ? 40 + f.A.hit * 0.5 : 0;
  const back = f.B ? f.B.dmg * (f.B.doubles ? 2 : 1) * f.B.hit / 100 : 0;
  let s = exp * 3 + kill - back * 1.2 + (f.B ? 0 : 6);
  if (u.hunt && (u.hunt.includes(t.id) || u.hunt.includes(t.uid) || (u.hunt.includes('lord') && t.lord))) s += 25;
  if (t.npc) s += 8; if (f.A.hit < 30) s -= 15;
  return { s, f };
}
export function think(u, ctx) {
  const { F, units, R } = ctx; const ai = u.ai || 'range';
  if (u.status && u.status.sleep) return { wait: true };
  const foes = units.filter((o) => !o.dead && o.x != null && !friendly(u, o) && !o.rescuedBy && (!ctx.seen || u.side !== 'enemy' || true));
  const friends = units.filter((o) => !o.dead && o.x != null && friendly(u, o) && o !== u);
  const stay = ai === 'hold' || ai === 'boss' || (ai.startsWith('guard') && !u.awake);
  const m = stay ? { cost: new Map([[u.y * F.W + u.x, 0]]), from: new Map() } : F.moves(u, units);
  if (!m.cost.has(u.y * F.W + u.x)) m.cost.set(u.y * F.W + u.x, 0);
  const stands = [...m.cost.keys()].map((k) => [k % F.W, Math.floor(k / F.W)]);
  const ox = u.x, oy = u.y;
  // 1. a healer heals
  const st = staves(u).filter((s) => ITEMS[s.id].heal);
  if (st.length) {
    const hurt = friends.filter((o) => o.hp < o.stats.hp * 0.75).sort((a, b) => a.hp / a.stats.hp - b.hp / b.stats.hp);
    for (const t of hurt) for (const [x, y] of stands) { const [lo, hi] = rangeOf(u, st[0]); const d = Math.abs(x - t.x) + Math.abs(y - t.y); if (d >= lo && d <= hi) return { move: [x, y], staff: st[0], target: t }; }
  }
  // 2. a status staff on the most dangerous of yours in reach
  const bad = staves(u).filter((s) => ITEMS[s.id].status);
  if (bad.length && R() < 0.7) for (const [x, y] of stands) { const [lo, hi] = rangeOf(u, bad[0]); const t = foes.filter((o) => !o.status?.sleep && !o.status?.silence).find((o) => { const d = Math.abs(x - o.x) + Math.abs(y - o.y); return d >= lo && d <= hi; }); if (t) return { move: [x, y], staff: bad[0], target: t }; }
  // 3. the best strike it can make from anywhere it can reach
  let best = null;
  if (ai !== 'flee' && ai !== 'thief' && !(ai.startsWith('guard') && !u.awake && !stay)) {
    for (const [x, y] of stands) {
      u.x = x; u.y = y; const ter = terrainAt(F.tile(x, y));
      for (const t of foes) for (const w of weapons(u)) { const [lo, hi] = rangeOf(u, w), d = Math.abs(x - t.x) + Math.abs(y - t.y); if (d < lo || d > hi) continue; const sc = score(u, w, t, ctx); if (!sc) continue; const s = sc.s + ter.def * 2 + ter.avo * 0.1 + (ai === 'raid' ? -5 : 0); if (!best || s > best.s) best = { s, move: [x, y], weapon: w, target: t }; }
    }
    u.x = ox; u.y = oy;
  }
  if (best && (ai !== 'raid' || best.s > 25)) return { move: best.move, weapon: best.weapon, target: best.target };
  // 4. no strike this turn: walk toward what it wants
  if (stay) { if (ai.startsWith('guard')) { const n = +ai.split(':')[1] || 3; if (foes.some((o) => Math.abs(o.x - u.x) + Math.abs(o.y - u.y) <= n)) u.awake = true; } return { wait: true }; }
  let goals = null;
  if (ai === 'raid') goals = ctx.villages().map((v) => [v.x, v.y]);
  if (ai === 'thief') { const ch = ctx.chests().filter((c) => !F.opened.has(c.y * F.W + c.x)); goals = ch.length && !u.loot ? ch.map((c) => [c.x, c.y]) : ctx.exits(u); }
  if (ai === 'flee' || ai === 'escape') goals = ctx.exits(u);
  if (ai === 'seize' && u.goal) goals = [u.goal];
  if (ai === 'charge' || (ai.startsWith('guard') && u.awake) || (ai === 'raid' && (!goals || !goals.length))) goals = foes.map((o) => [o.x, o.y]);
  if (!goals || !goals.length) return { wait: true };
  const d = distanceField(F, u, goals, units); let pick = [u.x, u.y], pd = d[u.y * F.W + u.x];
  for (const [x, y] of stands) { const v = d[y * F.W + x]; if (v < pd) { pd = v; pick = [x, y]; } }
  const on = (g) => g.some(([gx, gy]) => gx === pick[0] && gy === pick[1]);
  if (ai === 'raid' && on(goals) && ctx.villages().some((v) => v.x === pick[0] && v.y === pick[1])) return { move: pick, raze: true };
  if (ai === 'thief' && !u.loot && ctx.chests().some((c) => c.x === pick[0] && c.y === pick[1])) return { move: pick, loot: true };
  if ((ai === 'thief' && u.loot) || ai === 'flee' || ai === 'escape') { if (on(ctx.exits(u))) return { move: pick, leave: true }; }
  if (ai === 'seize' && u.goal && pick[0] === u.goal[0] && pick[1] === u.goal[1]) return { move: pick, seized: true };
  return { move: pick };
}
