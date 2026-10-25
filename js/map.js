// A battlefield: the letters of a chapter's map, how far each unit can walk through it (terrain costs, enemies
// in the way), the squares it could then strike, the enemy danger zone, and what can be seen in the fog.
import { terrainAt } from './data/terrain.js';
import { CLASSES } from './data/classes.js';
import { reach, hasSkill, weapons, staves, rangeOf } from './rules.js';

export class Field {
  constructor(rows) { this.rows = rows.map((r) => r.split('')); this.H = rows.length; this.W = Math.max(...rows.map((r) => r.length)); for (const r of this.rows) while (r.length < this.W) r.push('.'); this.visited = new Set(); this.opened = new Set(); }
  tile(x, y) { return x < 0 || y < 0 || x >= this.W || y >= this.H ? '#' : this.rows[y][x]; }
  set(x, y, ch) { if (this.rows[y]) this.rows[y][x] = ch; }
  inside(x, y) { return x >= 0 && y >= 0 && x < this.W && y < this.H; }
  // what it costs this unit to step onto (x, y)
  cost(u, x, y) {
    const t = terrainAt(this.tile(x, y)), k = CLASSES[u.cls]; let m = k.move;
    if (t.snow && hasSkill(u, 'snowstride')) return 1;
    if (m === 'mtn') return t.climb ? t.climb : t.cost.inf;
    if (m === 'sea') return t.cost.sea;
    return t.cost[m] ?? t.cost.inf;
  }
  // every square the unit can reach this turn, with the cheapest cost and where it came from
  moves(u, units, movLeft) {
    const mov = movLeft ?? Math.max(1, u.stats.mov - (this.rain ? 1 : 0)), start = u.y * this.W + u.x, best = new Map([[start, 0]]), from = new Map(), q = [[0, u.x, u.y]];
    const occ = new Map(); for (const o of units) if (!o.dead && o.x != null && o !== u && !o.rescuedBy) occ.set(o.y * this.W + o.x, o);
    const passes = hasSkill(u, 'pass');
    while (q.length) {
      q.sort((a, b) => a[0] - b[0]); const [c, x, y] = q.shift();
      if (c > best.get(y * this.W + x)) continue;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy; if (!this.inside(nx, ny)) continue;
        const k = ny * this.W + nx, o = occ.get(k);
        if (o && !friendly(u, o) && !passes) continue;
        const nc = c + this.cost(u, nx, ny); if (nc > mov) continue;
        if (nc < (best.get(k) ?? 99)) { best.set(k, nc); from.set(k, y * this.W + x); q.push([nc, nx, ny]); }
      }
    }
    // can't stop on a square someone else stands on
    const out = new Map(); for (const [k, c] of best) { const o = occ.get(k); if (!o) out.set(k, c); }
    return { cost: out, all: best, from };
  }
  path(m, x, y) { const out = []; let k = y * this.W + x; while (k != null) { out.unshift([k % this.W, Math.floor(k / this.W)]); k = m.from.get(k); } return out; }
  // squares within [lo, hi] of a square
  ring(x, y, lo, hi) { const out = []; for (let dy = -hi; dy <= hi; dy++) for (let dx = -hi; dx <= hi; dx++) { const d = Math.abs(dx) + Math.abs(dy); if (d >= lo && d <= hi && this.inside(x + dx, y + dy)) out.push([x + dx, y + dy]); } return out; }
  // all the squares this unit threatens this turn (move + any weapon's reach)
  threat(u, units) {
    const m = this.moves(u, units), r = reach(u), set = new Set(); if (!r) return { moves: m, hits: set };
    const stand = [...m.cost.keys(), u.y * this.W + u.x];
    for (const k of stand) { const x = k % this.W, y = Math.floor(k / this.W); for (const [ax, ay] of this.ring(x, y, r[0], r[1])) set.add(ay * this.W + ax); }
    return { moves: m, hits: set };
  }
  staffReach(u, units) { const s = staves(u); if (!s.length) return null; let hi = 0; for (const it of s) hi = Math.max(hi, rangeOf(u, it)[1]); return hi; }
  // what the player can see in fog: three squares around each unit, more with a torch
  vision(units, side, extra = []) {
    const seen = new Set();
    const add = (x, y, r) => { for (const [ax, ay] of this.ring(x, y, 0, r)) seen.add(ay * this.W + ax); };
    for (const u of units) if (!u.dead && u.x != null && (u.side === side || (side === 'player' && u.side === 'ally'))) add(u.x, u.y, 3 + (u.torch || 0) + (hasSkill(u, 'pass') ? 2 : 0));
    for (const [x, y, r] of extra) add(x, y, r);
    return seen;
  }
}
export const friendly = (a, b) => (a.side === 'enemy') === (b.side === 'enemy') && !(a.side === 'other' || b.side === 'other');
export { weapons };
