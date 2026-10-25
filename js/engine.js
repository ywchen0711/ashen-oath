// A battle: one chapter's field, its people, the turn order and everything that can be done on a turn. The engine
// knows nothing about drawing: it asks its `ui` to show scenes, fights and level-ups and waits for them (in tests
// the ui answers at once). Chapter scripts speak to it through events.
import { Field, friendly } from './map.js';
import { think } from './ai.js';
import { rng, soldier, recruit, fight, forecast, equipped, weapons, staves, rangeOf, canUse, expFor, gainExp, healAmount, staffExp, hasSkill, cls, distance, equip, R100 } from './rules.js';
import { ITEMS } from './data/items.js';
import { CAST } from './data/cast.js';
import { terrainAt } from './data/terrain.js';

const key = (x, y) => x + ',' + y;
export class Battle {
  constructor(ch, army, o = {}) {
    this.ch = ch; this.ui = o.ui; this.mode = o.mode || 'classic'; this.R = rng(o.seed || 12345); this.F = new Field(ch.map); this.F.rain = ch.weather === 'rain'; this.turn = 0; this.phase = 'player';
    this.units = []; this.army = army; this.flags = o.flags || {}; this.supports = o.supports || {}; this.supportPts = o.supportPts || {}; this.log = []; this.fired = new Set(); this.done = null; this.convoyAdd = []; this.gold = 0; this.lost = [];
    this.goal = { ...ch.goal }; this.visited = new Set(); this.escaped = [];
    for (const d of ch.units || []) if (!d.cond || d.cond(this.flags)) this.place(d);
  }
  // put a unit on the field from a chapter's description
  place(d, side) {
    let u;
    if (d.id && CAST[d.id] && CAST[d.id].cls && !d.generic) { u = this.army.find((a) => a.id === d.id) || recruit(d.id); u.side = d.side || side || 'player'; u.ai = d.ai || u.ai; if (u.side !== 'player') { u.drops = d.drop; u.quote = d.quote; } }
    else u = soldier(d.cls, Math.min(20, (d.lv || 1) + ((d.side || side || 'enemy') === 'enemy' ? this.ch.boost || 0 : 0)), d.items || [], { side: d.side || side || 'enemy', ai: d.ai || 'range', boss: d.boss, id: d.id || null, name: d.name || (d.id && CAST[d.id] ? CAST[d.id].name : undefined), hunt: d.hunt, drops: d.drop, talk: d.talk, recruitTo: d.recruit, goal: d.goal, bonus: d.bonus, npc: d.npc, oathbound: d.oathbound, tag: d.tag, hair: d.hair, portrait: d.portrait });
    u.x = d.x; u.y = d.y; u.dead = false; u.moved = false; u.acted = false; u.status = {}; u.miracleUsed = false; u.rescuing = null; u.rescuedBy = null;
    if (d.hp) u.hp = d.hp; if (d.ai) u.ai = d.ai; if (d.npc) u.npc = 1; if (d.quote) u.quote = d.quote; if (d.trial) u.trial = 1; if (d.noEscape) u.noEscape = 1; if (d.deathLines) u.deathLines = d.deathLines;
    if (this.units.includes(u)) return u; this.units.push(u); return u;
  }
  get alive() { return this.units.filter((u) => !u.dead && u.x != null); }
  side(s) { return this.alive.filter((u) => u.side === s); }
  at(x, y) { return this.alive.find((u) => u.x === x && u.y === y && !u.rescuedBy); }
  ctx() { const tac = {}; for (const u of this.alive) if (hasSkill(u, 'tactics')) tac[u.side] = 5; return { map: this.F, units: this.alive, supports: this.supports, tactics: tac }; }
  // deployment: the chosen units go to the chapter's start squares
  deploy(list) { this.ch.deploy.forEach(([x, y], i) => { const u = list[i]; if (!u) return; u.side = 'player'; u.x = x; u.y = y; u.dead = false; u.status = {}; u.moved = u.acted = false; u.miracleUsed = false; u.rescuing = u.rescuedBy = null; if (!this.units.includes(u)) this.units.push(u); }); }

  // ---------------------------------------------------------------- turns
  async beginTurn(side) {
    this.phase = side; if (side === 'player') this.turn++;
    for (const u of this.side(side)) {
      u.moved = u.acted = false;
      const t = terrainAt(this.F.tile(u.x, u.y)); let heal = t.heal ? Math.ceil(u.stats.hp * t.heal / 100) : 0; if (hasSkill(u, 'ember')) heal += 10;
      if (heal && u.hp < u.stats.hp) { u.hp = Math.min(u.stats.hp, u.hp + heal); this.ui.toast?.(u, '+' + heal); }
      for (const s in u.status) { u.status[s]--; if (u.status[s] <= 0) delete u.status[s]; }
      u.torch = Math.max(0, (u.torch || 0) - 1);
    }
    if (side === 'player') { for (const r of this.ch.reinforce || []) if (r.turn === this.turn && (!r.cond || r.cond(this))) { for (const d of r.units) { if (this.at(d.x, d.y)) { const sp = this.free(d.x, d.y); if (!sp) continue; d.x = sp[0]; d.y = sp[1]; } this.place(d); } if (r.lines) await this.ui.say(r.lines); this.ui.refresh?.(); } await this.fire({ turn: this.turn }); }
    await this.fire({ phase: side, turn: this.turn });
  }
  free(x, y) { for (let r = 1; r < 4; r++) for (const [a, b] of this.F.ring(x, y, r, r)) if (!this.at(a, b) && terrainAt(this.F.tile(a, b)).cost.inf < 99) return [a, b]; return null; }
  allActed() { return this.side('player').every((u) => u.acted); }
  // ---------------------------------------------------------------- the menu a unit gets after moving
  options(u) {
    const o = [], F = this.F, here = F.tile(u.x, u.y), C = this.ctx(), adj = this.F.ring(u.x, u.y, 1, 1).map(([x, y]) => this.at(x, y)).filter(Boolean);
    if (this.targets(u).length) o.push('attack');
    if (staves(u).some((s) => this.staffTargets(u, s).length)) o.push('staff');
    if (hasSkill(u, 'sing') && adj.some((a) => a.side === 'player' && a.acted && !hasSkill(a, 'sing'))) o.push('sing');
    if (adj.some((a) => this.talkWith(u, a))) o.push('talk');
    if (here === 'v' && !this.visited.has(key(u.x, u.y))) o.push('visit');
    if ((here === 'k' || here === 'a') && this.ch.shops && this.ch.shops[key(u.x, u.y)]) o.push('shop');
    if (this.goal.type === 'seize' && u.lord && u.x === this.goal.x && u.y === this.goal.y) o.push('seize');
    if (this.goal.type === 'escape' && this.isExit(u.x, u.y) && !u.noEscape) o.push('escape');
    if (here === 'C' && !F.opened.has(u.y * F.W + u.x) && (hasSkill(u, 'lockpick') || u.items.some((i) => i.id === 'chestKey'))) o.push('chest');
    if (this.F.ring(u.x, u.y, 1, 1).some(([x, y]) => F.tile(x, y) === 'D') && (hasSkill(u, 'lockpick') || u.items.some((i) => i.id === 'doorKey'))) o.push('door');
    if (hasSkill(u, 'steal') && adj.some((a) => a.side === 'enemy' && a.stats.spd <= u.stats.spd && a.items.some((i, k) => k > 0 || ITEMS[i.id].kind !== 'weapon'))) o.push('steal');
    if (!u.rescuing && adj.some((a) => friendly(u, a) && a.side !== 'enemy' && !a.rescuing && this.canCarry(u, a))) o.push('rescue');
    if (u.rescuing) o.push('drop');
    if (adj.some((a) => a.side === 'player')) o.push('trade');
    o.push('items', 'wait');
    return o;
  }
  canCarry(u, a) { return !cls(u).tags.includes('armor') || true; }
  targets(u) { const out = []; for (const t of this.alive) { if (friendly(u, t) || t.rescuedBy) continue; for (const w of weapons(u)) { const [lo, hi] = rangeOf(u, w), d = distance(u, t); if (d >= lo && d <= hi) { out.push(t); break; } } } return out; }
  staffTargets(u, s) {
    const it = ITEMS[s.id], [lo, hi] = rangeOf(u, s);
    if (it.torch) return [u];
    return this.alive.filter((t) => { const d = distance(u, t); if (d < lo || d > hi || t === u) return false; if (it.heal) return friendly(u, t) && t.hp < t.stats.hp; if (it.cure) return friendly(u, t) && Object.keys(t.status).some((k) => k !== 'barrier'); if (it.status) return !friendly(u, t) && (u.stats.mag + 5 > t.stats.res || true); if (it.buff) return friendly(u, t); if (it.warp || it.pull) return friendly(u, t) && t.side === 'player'; return false; });
  }
  talkWith(u, a) { return (this.ch.events || []).some((e) => e.talk && !this.fired.has(e) && ((e.talk[0] === u.id && e.talk[1] === a.id) || (e.talk[0] === '*' && e.talk[1] === a.id && u.side === 'player') || (!e.oneway && e.talk[1] === u.id && e.talk[0] === a.id))); }
  isExit(x, y) { return (this.goal.exits || []).some(([a, b]) => a === x && b === y); }

  // ---------------------------------------------------------------- doing things
  async move(u, x, y) { u.from = [u.x, u.y]; u.x = x; u.y = y; u.moved = true; if (u.rescuing) { const r = this.units.find((o) => o.uid === u.rescuing); if (r) { r.x = x; r.y = y; } } await this.fire({ area: [x, y], who: u }); }
  async attack(u, w, t) {
    for (const x of [t, u]) if (x.quote && !x.quoted) { x.quoted = true; const q = typeof x.quote === 'function' ? x.quote(x === t ? u : t, this) : x.quote; if (q && q.length) await this.ui.say(q); }
    equip(u, w); const res = fight(u, w, t, this.ctx(), this.R);
    await this.ui.fight?.(u, t, res);
    await this.afterFight(u, t, res); return res;
  }
  async afterFight(u, t, res) {
    const dealt = (side) => res.strikes.some((s) => s.side === side && s.hit && s.dmg > 0);
    for (const [me, foe, side] of [[u, t, 'A'], [t, u, 'B']]) {
      if (me.hp <= 0) continue;
      if (me.side === 'player' && res.strikes.some((s) => s.side === side)) { const e = expFor(me, foe, dealt(side), foe.hp <= 0); await this.giveExp(me, e); }
    }
    for (const x of [u, t]) if (x.hp <= 0) await this.kill(x, x === t ? u : t);
    u.acted = true;
  }
  async giveExp(u, e) { const before = { lv: u.lv, exp: u.exp }, ups = gainExp(u, e, this.R); await this.ui.exp?.(u, e, before, ups); }
  async kill(u, by) {
    if (u.trial) { u.hp = 0; u.dead = true; u.left = true; u.x = null; await this.ui.note?.(`${u.name}認輸了`); await this.fire({ death: u.id || u.tag || u.uid }); this.ui.refresh?.(); return; }
    u.dead = true; u.hp = 0;
    if (u.rescuing) { const r = this.units.find((o) => o.uid === u.rescuing); if (r) { r.rescuedBy = null; const sp = this.free(u.x, u.y); if (sp) { r.x = sp[0]; r.y = sp[1]; } } }
    if (u.drops && u.items.length) { const it = u.items[u.items.length - 1]; if (by && by.side === 'player') { if (by.items.length < 5) by.items.push(it); else this.convoyAdd.push(it); await this.ui.note?.(`得到了「${ITEMS[it.id].name}」`); } }
    if (u.deathLines) await this.ui.say(typeof u.deathLines === 'function' ? u.deathLines(this) : u.deathLines);
    else if (u.side === 'player' && u.id && CAST[u.id] && CAST[u.id].dying) await this.ui.say(CAST[u.id].dying(this.mode));
    if (u.side === 'player') { this.lost.push(u); if (u.id) await this.fire({ death: u.id }); }
    else await this.fire({ death: u.id || u.tag || u.uid });
    this.ui.refresh?.();
  }
  async staff(u, s, t) {
    const it = ITEMS[s.id]; let e = staffExp(u, s);
    if (it.heal) { const n = Math.min(t.stats.hp - t.hp, healAmount(u, s)); t.hp += n; await this.ui.heal?.(u, t, n); this.bond(u, t, 2); }
    if (it.cure) for (const k of Object.keys(t.status)) if (k !== 'barrier') delete t.status[k];
    if (it.buff) t.status.barrier = 4;
    if (it.torch) u.torch = 5;
    if (it.status) { const hit = Math.max(0, Math.min(100, 30 + (u.stats.mag - t.stats.res) * 5 + u.stats.skl)); if (R100(this.R) < hit) { t.status[it.status] = 3; await this.ui.note?.(`${t.name}${it.status === 'sleep' ? '睡著了' : '被沉默了'}`); } else { await this.ui.note?.('沒有效果'); e = 1; } }
    if (it.pull) { const sp = this.free(u.x, u.y); if (sp) { t.x = sp[0]; t.y = sp[1]; } }
    if (it.warp) t.warpPending = true;
    s.uses--; if (s.uses <= 0) u.items = u.items.filter((i) => i !== s);
    u.acted = true; if (u.side === 'player') await this.giveExp(u, e);
  }
  async sing(u, t) { t.acted = false; t.moved = false; u.acted = true; await this.giveExp(u, 10); }
  async talk(u, a) { const e = (this.ch.events || []).find((e) => e.talk && !this.fired.has(e) && ((e.talk[0] === u.id && e.talk[1] === a.id) || (e.talk[0] === '*' && e.talk[1] === a.id) || (!e.oneway && e.talk[1] === u.id && e.talk[0] === a.id))); if (e) await this.run(e); u.acted = true; }
  async visit(u) { const k = key(u.x, u.y); const v = (this.ch.villages || {})[k];
    if (v && v.stages) { this.stage = this.stage || {}; const n = this.stage[k] || 0; if (this.lastVisit === this.turn) { await this.ui.say(v.again || [['-', '（今天已經拜訪過了。明天再來吧。）']]); return; } this.lastVisit = this.turn; this.stage[k] = n + 1; const st = v.stages[n]; if (st.lines) await this.ui.say(typeof st.lines === 'function' ? st.lines(u, this) : st.lines); for (const d of st.do || []) await this.act(d); u.acted = true; if (n + 1 < v.stages.length) return; this.visited.add(k); this.F.set(u.x, u.y, 'H'); this.ui.repaint?.(); this.check(); return; }
    this.visited.add(k); if (v) { if (v.lines) await this.ui.say(v.lines); if (v.gift) await this.give(u, v.gift); if (v.gold) { this.gold += v.gold; await this.ui.note?.(`得到 ${v.gold} 金`); } if (v.join) await this.join(v.join, u.x, u.y); if (v.flag) this.flags[v.flag] = true; } u.acted = true; this.F.set(u.x, u.y, 'H'); this.ui.repaint?.(); }
  async give(u, id) { const it = { id, uses: ITEMS[id].uses }; if (u.items.length < 5) u.items.push(it); else this.convoyAdd.push(it); await this.ui.note?.(`得到了「${ITEMS[id].name}」`); }
  async join(id, x, y) { const sp = this.at(x, y) ? this.free(x, y) : [x, y]; const u = this.place({ id, x: sp[0], y: sp[1], side: 'player' }); u.acted = true; u.side = 'player'; if (!this.army.includes(u)) this.army.push(u); this.ui.refresh?.(); return u; }
  async chest(u) { const k = u.y * this.F.W + u.x; this.F.opened.add(k); if (!hasSkill(u, 'lockpick')) { const kk = u.items.find((i) => i.id === 'chestKey'); kk.uses--; if (kk.uses <= 0) u.items = u.items.filter((i) => i !== kk); } const c = (this.ch.chests || {})[key(u.x, u.y)]; if (c) { if (c === 'gold') { this.gold += 1500; await this.ui.note?.('得到 1500 金'); } else await this.give(u, c); } u.acted = true; this.ui.repaint?.(); }
  async door(u) { for (const [x, y] of this.F.ring(u.x, u.y, 1, 1)) if (this.F.tile(x, y) === 'D') { this.F.set(x, y, 'l'); await this.fire({ door: [x, y] }); break; } if (!hasSkill(u, 'lockpick')) { const kk = u.items.find((i) => i.id === 'doorKey'); u.items = u.items.filter((i) => i !== kk); } u.acted = true; this.ui.repaint?.(); }
  async steal(u, t, it) { t.items = t.items.filter((i) => i !== it); if (u.items.length < 5) u.items.push(it); else this.convoyAdd.push(it); await this.ui.note?.(`偷到了「${ITEMS[it.id].name}」`); u.acted = true; await this.giveExp(u, 10); }
  rescue(u, a) { u.rescuing = a.uid; a.rescuedBy = u.uid; a.x = u.x; a.y = u.y; u.acted = true; this.bond(u, a, 2); }
  drop(u, x, y) { const a = this.units.find((o) => o.uid === u.rescuing); u.rescuing = null; if (a) { a.rescuedBy = null; a.x = x; a.y = y; } u.acted = true; }
  async seize(u) { this.done = 'win'; }
  async escape(u) { this.escaped.push(u); u.x = null; u.acted = true; await this.fire({ left: u.id }); this.check(); }
  wait(u) { u.acted = true; for (const o of this.side('player')) if (o !== u && distance(o, u) === 1) this.bond(u, o, 1); }
  bond(a, b, n) { if (!a.id || !b.id || a.side !== 'player' || b.side !== 'player') return; const k = [a.id, b.id].sort().join('+'); this.supportPts[k] = (this.supportPts[k] || 0) + n; }
  useItem(u, it) {
    const d = ITEMS[it.id]; let msg = '';
    if (d.use === 'heal') { const n = Math.min(u.stats.hp - u.hp, d.amt); u.hp += n; msg = `HP 回復了 ${n}`; }
    if (d.use === 'boost') { if (d.stat === 'mov') u.stats.mov += d.amt; else { u.stats[d.stat] += d.amt; if (d.stat === 'hp') u.hp += d.amt; } msg = `${{ hp: 'HP', str: '力量', mag: '魔力', skl: '技巧', spd: '速度', lck: '幸運', def: '守備', res: '魔防', mov: '移動' }[d.stat]} +${d.amt}`; }
    if (d.use === 'torch') { u.torch = 5; msg = '點亮了火把'; }
    if (d.use === 'gold') { this.gold += d.amt; msg = `得到 ${d.amt} 金`; }
    it.uses--; if (it.uses <= 0) u.items = u.items.filter((i) => i !== it); u.acted = true; return msg;
  }

  // ---------------------------------------------------------------- the enemy's turn (and green allies)
  async aiPhase(side) {
    const villages = () => { const out = []; for (let y = 0; y < this.F.H; y++) for (let x = 0; x < this.F.W; x++) if (this.F.tile(x, y) === 'v') out.push({ x, y }); return out; };
    const chests = () => { const out = []; for (let y = 0; y < this.F.H; y++) for (let x = 0; x < this.F.W; x++) if (this.F.tile(x, y) === 'C') out.push({ x, y }); return out; };
    const exits = (u) => (u.side === 'enemy' ? this.ch.enemyExits : this.goal.exits) || this.ch.enemyExits || [[0, 0]];
    const order = this.side(side).sort((a, b) => (a.boss ? 1 : 0) - (b.boss ? 1 : 0) || (staves(b).length - staves(a).length));
    for (const u of order) {
      if (u.dead || this.done) continue;
      const a = think(u, { F: this.F, units: this.alive, R: this.R, villages, chests, exits, ...this.ctx() });
      if (a.move && (a.move[0] !== u.x || a.move[1] !== u.y)) { const m = this.F.moves(u, this.alive); const path = this.F.path(m, a.move[0], a.move[1]); await this.ui.walk?.(u, path); u.x = a.move[0]; u.y = a.move[1]; await this.fire({ area: [u.x, u.y], who: u }); }
      if (a.weapon && a.target && !a.target.dead) await this.attack(u, a.weapon, a.target);
      else if (a.staff && a.target) await this.staff(u, a.staff, a.target);
      else if (a.raze) { this.F.set(u.x, u.y, 'V'); this.ui.repaint?.(); await this.ui.note?.('村莊被燒毀了……'); await this.fire({ razed: [u.x, u.y] }); }
      else if (a.loot) { this.F.opened.add(u.y * this.F.W + u.x); u.loot = (this.ch.chests || {})[key(u.x, u.y)] || 'gold'; if (u.loot !== 'gold') u.items.push({ id: u.loot, uses: ITEMS[u.loot].uses }); u.drops = 1; this.ui.repaint?.(); await this.ui.note?.('寶箱被盜賊打開了！'); }
      else if (a.leave) { u.x = null; u.left = true; if (u.side === 'enemy') u.dead = true; await this.fire({ left: u.id || u.tag }); }
      else if (a.seized) { this.done = 'lose'; this.loseWhy = '敵人佔領了目標'; }
      u.acted = true; this.check(); if (this.done) return;
    }
  }
  // ---------------------------------------------------------------- winning and losing
  check() {
    if (this.done) return this.done;
    const lords = this.army.filter((u) => u.lord && this.units.includes(u) && u.x != null || (u.lord && u.dead && this.units.includes(u)));
    for (const u of this.units) if (u.dead && (u.lord && this.units.includes(u) || (u.npc && u.mustLive))) { this.done = 'lose'; this.loseWhy = `${u.name}倒下了`; return this.done; }
    for (const id of this.ch.mustLive || []) { const u = this.units.find((x) => x.id === id || x.tag === id); if (u && u.dead && !u.left) { this.done = 'lose'; this.loseWhy = `${u.name}倒下了`; return this.done; } }
    const g = this.goal;
    if (g.type === 'rout' && !this.side('enemy').length) this.done = 'win';
    if (g.type === 'boss' && !this.units.some((u) => u.boss && !u.dead && u.side === 'enemy')) this.done = 'win';
    if ((g.type === 'defend' || g.type === 'survive') && this.phase === 'enemyEnd' && this.turn >= g.turns) this.done = 'win';
    if (g.type === 'arrive' && this.side('player').some((u) => (g.who ? u.id === g.who : u.lord) && g.area.some(([x, y]) => u.x === x && u.y === y))) this.done = 'win';
    if (g.type === 'escape' && this.escaped.length && (g.need || []).every((id) => this.units.some((u) => (u.id === id || u.tag === id) && (u.left || this.escaped.includes(u)))) && this.army.filter((u) => u.lord && this.units.includes(u)).every((u) => this.escaped.includes(u))) this.done = 'win';
    if (g.type === 'escort' && (g.need || []).every((id) => this.units.some((u) => (u.id === id || u.tag === id) && u.left))) this.done = 'win';
    if (g.flag && this.flags[g.flag]) this.done = 'win';
    if (g.limit && this.turn > g.limit) { this.done = 'lose'; this.loseWhy = '時間到了'; }
    return this.done;
  }
  // ---------------------------------------------------------------- scripts
  async fire(trigger) {
    for (const e of this.ch.events || []) {
      if (this.fired.has(e) && !e.repeat) continue;
      let ok = false;
      if (e.turn != null && trigger.turn === e.turn && trigger.phase === (e.phase || 'player') && (trigger.phase || e.phase)) ok = true;
      if (e.turn != null && trigger.turn === e.turn && !trigger.phase && !e.phase) ok = true;
      if (e.area && trigger.area && e.area.some(([x, y, w = 1, h = 1]) => trigger.area[0] >= x && trigger.area[0] < x + w && trigger.area[1] >= y && trigger.area[1] < y + h) && (!e.who ? trigger.who.side === 'player' : e.who === trigger.who.id || (e.who === 'lord' && trigger.who.lord) || (e.who === 'enemy' && trigger.who.side === 'enemy'))) ok = true;
      if (e.death && trigger.death === e.death) ok = true;
      if (e.razed && trigger.razed) ok = true;
      if (e.left && trigger.left === e.left) ok = true;
      if (e.door && trigger.door && e.door[0] === trigger.door[0] && e.door[1] === trigger.door[1]) ok = true;
      if (!ok || (e.cond && !e.cond(this))) continue;
      await this.run(e);
    }
  }
  async run(e) {
    this.fired.add(e);
    if (e.lines) await this.ui.say(typeof e.lines === 'function' ? e.lines(this) : e.lines);
    for (const d of e.do || []) await this.act(d);
    this.ui.refresh?.(); this.check();
  }
  async act(d) {
    if (d.ifFlag) { if (this.flags[d.ifFlag]) for (const x of d.do) await this.act(x); return; }
    if (d.unlessFlag) { if (!this.flags[d.unlessFlag]) for (const x of d.do) await this.act(x); return; }
    if (d.spawn) { for (const u of d.spawn) { const sp = this.at(u.x, u.y) ? this.free(u.x, u.y) : [u.x, u.y]; if (sp) this.place({ ...u, x: sp[0], y: sp[1] }); } }
    if (d.join) { const u = this.units.find((x) => x.id === d.join && !x.dead); if (u) { u.side = 'player'; u.ai = null; u.acted = true; u.hunt = null; if (!this.army.includes(u)) this.army.push(u); } else if (d.x != null) await this.join(d.join, d.x, d.y); }
    if (d.leave) { const u = this.units.find((x) => x.id === d.leave || x.tag === d.leave); if (u) { u.x = null; u.left = true; } }
    if (d.ai) for (const u of this.alive) if (u.side !== 'player' && (d.ai.who === '*' || u.id === d.ai.who || u.tag === d.ai.who)) { u.ai = d.ai.set; u.awake = true; if (d.ai.hunt) u.hunt = d.ai.hunt; }
    if (d.side) for (const u of this.units.filter((x) => (x.id === d.side[0] || x.tag === d.side[0]) && !x.dead)) { u.side = d.side[1]; if (u.side === 'player') { u.acted = true; u.ai = null; if (CAST[u.id] && CAST[u.id].cls && !this.army.includes(u)) this.army.push(u); } }
    if (d.tile) { this.F.set(d.tile[0], d.tile[1], d.tile[2]); this.ui.repaint?.(); }
    if (d.flag) this.flags[d.flag] = d.value ?? true;
    if (d.goal) this.goal = { ...d.goal };
    if (d.gold) this.gold += d.gold;
    if (d.item) this.convoyAdd.push({ id: d.item, uses: ITEMS[d.item].uses });
    if (d.win) this.done = 'win';
    if (d.lose) { this.done = 'lose'; this.loseWhy = d.lose; }
    if (d.heal) for (const u of this.side('player')) u.hp = u.stats.hp;
    if (d.skillOff) { const u = this.units.find((x) => x.id === d.skillOff[0] || x.tag === d.skillOff[0]); if (u) u.off = [...(u.off || []), d.skillOff[1]]; }
    if (d.boost) { const u = this.units.find((x) => (x.id === d.boost[0] || x.tag === d.boost[0]) && !x.dead); if (u) for (const [k, v] of Object.entries(d.boost[1])) { u.stats[k] = Math.max(0, u.stats[k] + v); if (k === 'hp') u.hp = Math.min(u.stats.hp, u.hp + Math.max(0, v)); } }
    if (d.kill) { const u = this.units.find((x) => (x.id === d.kill || x.tag === d.kill) && !x.dead); if (u) { u.dead = true; u.hp = 0; u.scripted = true; } }
    if (d.hp) { const u = this.units.find((x) => x.id === d.hp[0] || x.tag === d.hp[0]); if (u) u.hp = Math.max(1, d.hp[1]); }
    if (d.move) { const u = this.units.find((x) => x.id === d.move[0] || x.tag === d.move[0]); if (u) { await this.ui.walk?.(u, [[u.x, u.y], [d.move[1], d.move[2]]]); u.x = d.move[1]; u.y = d.move[2]; } }
  }
}
export { forecast, equipped, weapons, staves, rangeOf, canUse };
