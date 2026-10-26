// The windows: dialogue with portraits (who speaks stands bright, the other listens in shadow, words appear as
// they are spoken), menus, the battle forecast, a unit's status, the phase banners, the level-up.
import { portrait } from './portraits.js';
import { faceOf } from './faces.js';
import { backdrop } from './bgs.js';
import { CAST } from './data/cast.js';
import { CLASSES, STAT_NAME, STATS, SKILLS } from './data/classes.js';
import { ITEMS, WEAPON_NAME } from './data/items.js';
import { equipped, weapons, forecast, canUse, rangeOf, cls } from './rules.js';
import { terrainAt } from './data/terrain.js';

const $ = (id) => document.getElementById(id);
const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
export const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

export class UI {
  constructor() { this.root = $('ui'); this.keys = []; this.skipAll = false; addEventListener('keydown', (e) => { for (const f of [...this.keys]) f(e); }); }
  onKey(f) { this.keys.push(f); return () => { this.keys = this.keys.filter((x) => x !== f); }; }
  clear() { this.root.innerHTML = ''; }
  // ---------------------------------------------------------------- dialogue
  async say(lines, o = {}) {
    if (!lines || !lines.length) return;
    const box = el('div', 'talk' + (o.bg ? ' scene' : '')); this.root.appendChild(box);
    const bg = el('canvas', 'tbg'); bg.width = 960; bg.height = 540; if (o.bg) { bg.getContext('2d').drawImage(backdrop(o.bg), 0, 0); box.appendChild(bg); }
    const stage = el('div', 'stage'), L = el('div', 'por left'), Rr = el('div', 'por right'), panel = el('div', 'tbox'), name = el('div', 'tname'), text = el('div', 'ttext'), next = el('div', 'tnext', '▼'), skip = el('button', 'tskip', '略過 ▶▶');
    stage.append(L, Rr); panel.append(name, text, next); box.append(stage, panel, skip);
    const slot = { left: null, right: null }; let side = 'left';
    let done = false; skip.onclick = (e) => { e.stopPropagation(); done = true; advance(); };
    let advance = () => {}; const tap = () => advance(); box.addEventListener('pointerdown', tap); const off = this.onKey((e) => { if (['Enter', ' ', 'KeyZ'].includes(e.code)) { e.preventDefault(); advance(); } if (e.code === 'Escape' || e.code === 'KeyS') { done = true; advance(); } });
    const queue = [...lines];
    while (queue.length) {
      const ln = queue.shift();
      if (done) break;
      if (!Array.isArray(ln) && ln.choice) { const r = await this.menu(ln.opts.map((o, k) => ({ id: k, label: o[0] })), innerWidth / 2 - 180, innerHeight / 2 - 120, ln.choice); const o = ln.opts[r ?? 0]; if (o[1] && this.flags) this.flags[o[1]] = o[2] ?? true; if (o[3]) queue.unshift(...o[3]); continue; }
      if (!Array.isArray(ln) && ln.if) { const ok = typeof ln.if === 'function' ? ln.if(this.flags || {}) : this.flags && this.flags[ln.if]; const sub = ok ? ln.then : ln.else; if (sub && sub.length) queue.unshift(...sub); continue; }
      if (!Array.isArray(ln)) { if (ln.bg) { bg.getContext('2d').drawImage(backdrop(ln.bg), 0, 0); if (!bg.parentNode) box.prepend(bg); box.classList.add('scene'); } if (ln.clear) { L.innerHTML = ''; Rr.innerHTML = ''; slot.left = slot.right = null; } continue; }
      let [who, ex, words] = ln.length === 2 ? [ln[0], '平', ln[1]] : ln;
      if (who === '-') { L.classList.add('dim'); Rr.classList.add('dim'); name.hidden = true; text.className = 'ttext narr'; }
      else {
        let forced = null; if (who[0] === '>') { forced = 'right'; who = who.slice(1); } else if (who[0] === '<') { forced = 'left'; who = who.slice(1); }
        let shown = null; if (who.includes('|')) [who, shown] = who.split('|');
        const c = CAST[who] || CAST.villager, nm = shown || (c && c.name) || who;
        let at = slot.left === who ? 'left' : slot.right === who ? 'right' : null;
        if (!at) { at = forced || (!slot.left ? 'left' : !slot.right ? 'right' : side === 'left' ? 'right' : 'left'); slot[at] = who; }
        side = at; const holder = at === 'left' ? L : Rr, cv = portrait(c.p, ex, 320, at === 'right'); holder.innerHTML = ''; holder.appendChild(cv);
        L.classList.toggle('dim', at !== 'left'); Rr.classList.toggle('dim', at !== 'right'); holder.classList.remove('pop'); void holder.offsetWidth; holder.classList.add('pop');
        name.hidden = false; name.textContent = nm; name.className = 'tname ' + at; text.className = 'ttext';
      }
      // the words appear one by one; a tap shows the rest, the next tap moves on
      let shownAll = false, i = 0; text.textContent = ''; next.hidden = true;
      await new Promise((res) => { advance = () => { if (!shownAll) { shownAll = true; } else res(); }; const tick = () => { if (shownAll || done) { text.textContent = words; next.hidden = false; shownAll = true; if (done) res(); return; } i += 1; text.textContent = words.slice(0, i); if (i >= words.length) { shownAll = true; next.hidden = false; return; } setTimeout(tick, 28); }; tick(); });
    }
    off(); box.removeEventListener('pointerdown', tap); box.remove();
  }
  async card(top, title, sub) { const c = el('div', 'card', `<div class="ctop">${esc(top)}</div><div class="ctitle">${esc(title)}</div>${sub ? `<div class="csub">${esc(sub)}</div>` : ''}`); this.root.appendChild(c); await new Promise((r) => { const off = this.onKey(() => { off(); r(); }); c.onclick = () => { off(); r(); }; setTimeout(() => { off(); r(); }, 3200); }); c.classList.add('out'); await wait(400); c.remove(); }
  async banner(text, kind) { const b = el('div', 'banner ' + (kind || ''), `<span>${esc(text)}</span>`); this.root.appendChild(b); await wait(1100); b.remove(); }
  note(text) { const n = el('div', 'note', esc(text)); this.root.appendChild(n); return new Promise((r) => setTimeout(() => { n.remove(); r(); }, 1300)); }
  // ---------------------------------------------------------------- menus
  menu(items, x, y, title) {
    return new Promise((res) => {
      const m = el('div', 'menu'); if (title) m.appendChild(el('div', 'mtitle', esc(title)));
      let k = 0; const btns = items.map((it, i) => { const b = el('button', 'mi' + (it.off ? ' off' : ''), esc(it.label) + (it.hint ? `<small>${esc(it.hint)}</small>` : '')); b.onclick = (e) => { e.stopPropagation(); if (!it.off) finish(it.id); }; b.onmouseenter = () => { k = i; mark(); }; m.appendChild(b); return b; });
      const mark = () => btns.forEach((b, i) => b.classList.toggle('sel', i === k)); mark();
      const finish = (v) => { off(); m.remove(); res(v); };
      const off = this.onKey((e) => { if (e.code === 'ArrowDown') { k = (k + 1) % btns.length; mark(); } if (e.code === 'ArrowUp') { k = (k + btns.length - 1) % btns.length; mark(); } if (['Enter', 'KeyZ', 'Space'].includes(e.code)) { e.preventDefault(); if (!items[k].off) finish(items[k].id); } if (['Escape', 'KeyX', 'Backspace'].includes(e.code)) finish(null); });
      m.oncontextmenu = (e) => { e.preventDefault(); finish(null); };
      this.root.appendChild(m); const r = m.getBoundingClientRect(); m.style.left = Math.max(8, Math.min(innerWidth - r.width - 8, x)) + 'px'; m.style.top = Math.max(8, Math.min(innerHeight - r.height - 8, y)) + 'px';
      setTimeout(() => { const outside = (e) => { if (!m.contains(e.target)) { document.removeEventListener('pointerdown', outside, true); if (m.isConnected) { e.stopPropagation(); finish(null); } } }; document.addEventListener('pointerdown', outside, true); }, 30);
    });
  }
  // the forecast: both sides' numbers; ←→ changes weapon; confirm or cancel
  forecast(B, u, t, list) {
    return new Promise((res) => {
      let k = 0; const box = el('div', 'fc'); this.root.appendChild(box);
      const draw = () => { const w = list[k], f = forecast(u, w, t, B.ctx()), A = f.A, Bn = f.B, dw = equipped(t); const tri = A.tri > 0 ? '<b class="up">▲</b>' : A.tri < 0 ? '<b class="dn">▼</b>' : '';
        const col = (who, N, wp, hp) => `<div class="fcs ${who.side}"><div class="fn">${esc(who.name)}</div><div class="fw">${wp ? esc(ITEMS[wp.id].name) : '—'}${who === u ? tri : ''}</div><div class="fr"><span>HP</span><b>${hp}</b></div><div class="fr"><span>威力</span><b>${N ? N.dmg + (N.doubles ? ' ×2' : '') + (N.eff ? ' 特效' : '') : '—'}</b></div><div class="fr"><span>命中</span><b>${N ? N.hit : '—'}</b></div><div class="fr"><span>必殺</span><b>${N ? N.crit : '—'}</b></div></div>`;
        box.innerHTML = `<div class="fct">戰鬥預測 ${list.length > 1 ? `<small>← → 換武器 (${k + 1}/${list.length})</small>` : ''}</div><div class="fcb">${col(u, A, w, u.hp)}${col(t, Bn, dw, t.hp)}</div><div class="fcbtn"><button class="ok">攻擊</button><button class="no">取消</button></div>`;
        box.querySelector('.ok').onclick = () => finish(list[k]); box.querySelector('.no').onclick = () => finish(null); };
      const finish = (v) => { off(); box.remove(); res(v); };
      const off = this.onKey((e) => { if (e.code === 'ArrowLeft') { k = (k + list.length - 1) % list.length; draw(); } if (e.code === 'ArrowRight') { k = (k + 1) % list.length; draw(); } if (['Enter', 'KeyZ', 'Space'].includes(e.code)) { e.preventDefault(); finish(list[k]); } if (['Escape', 'KeyX'].includes(e.code)) finish(null); });
      draw();
    });
  }
  // ---------------------------------------------------------------- a unit's sheet
  sheet(u, B) {
    const k = cls(u), c = CAST[u.id], panel = el('div', 'sheet');
    const port = portrait(faceOf(u), '平', 240);
    const bars = STATS.filter((s) => s !== 'hp').map((s) => `<div class="st"><span>${STAT_NAME[s]}</span><b>${u.stats[s]}</b><i><em style="width:${Math.min(100, u.stats[s] / k.cap[s] * 100)}%"></em></i></div>`).join('');
    const items = u.items.map((i) => { const d = ITEMS[i.id], usable = d.kind === 'item' || canUse(u, i.id); return `<div class="it ${usable ? '' : 'off'} ${equipped(u) === i ? 'eq' : ''}"><span>${d.kind === 'weapon' ? WEAPON_NAME[d.type] : d.kind === 'staff' ? '杖' : '物'}</span>${esc(d.name)}<b>${i.uses}/${d.uses}</b></div>`; }).join('') || '<div class="it off">—</div>';
    const skills = [...k.skills, ...(u.personal && !k.skills.includes(u.personal) ? [u.personal] : [])].map((s) => SKILLS[s] ? `<div class="sk"><b>${SKILLS[s].name}</b> ${esc(SKILLS[s].desc)}</div>` : '').join('');
    const w = equipped(u), ter = u.x != null && B ? terrainAt(B.F.tile(u.x, u.y)) : null;
    panel.innerHTML = `<button class="sx">✕</button><div class="sh"><div class="sp"></div><div><div class="snm">${esc(u.name)}</div><div class="scl">${esc(k.name)} · Lv ${u.lv} <small>EXP ${u.exp}</small></div><div class="shp">HP ${u.hp} / ${u.stats.hp}</div><div class="smv">移動 ${u.stats.mov} · 武器 ${k.weapons.map((x) => WEAPON_NAME[x]).join('、') || '—'}</div>${c && c.bio ? `<p class="bio">${esc(c.bio)}</p>` : ''}</div></div><div class="sgrid"><div>${bars}</div><div>${items}${w ? `<div class="wpn">攻擊 ${(ITEMS[w.id].magic ? u.stats.mag : u.stats.str) + ITEMS[w.id].mt} · 命中 ${ITEMS[w.id].hit + u.stats.skl * 2 + Math.floor(u.stats.lck / 2)} · 必殺 ${ITEMS[w.id].crit + Math.floor(u.stats.skl / 2)} · 射程 ${rangeOf(u, w).join('–')}</div>` : ''}${skills}${ter ? `<div class="sk"><b>${ter.name}</b> 守備 +${ter.def}　迴避 +${ter.avo}${ter.heal ? `　回復 ${ter.heal}%` : ''}</div>` : ''}</div></div>`;
    if (port) panel.querySelector('.sp').appendChild(port);
    this.root.appendChild(panel);
    return new Promise((res) => { const close = () => { off(); panel.remove(); res(); }; panel.querySelector('.sx').onclick = close; panel.onclick = (e) => { if (e.target === panel) close(); }; const off = this.onKey((e) => { if (['Escape', 'KeyX', 'KeyR', 'Enter', 'KeyZ'].includes(e.code)) close(); }); });
  }
  // everyone on the field at once: a tab for each side, a row for each soldier (face, class, level, HP, every stat,
  // the weapon in hand), sorted by any column; a row opens the full sheet or takes the cursor to them
  roster(B, visible = () => true) {
    const SIDES = [['player', '我軍'], ['ally', '友軍'], ['enemy', '敵軍'], ['all', '全部']], COLS = [['name', '名字'], ['lv', 'Lv'], ['hp', 'HP'], ...['str', 'mag', 'skl', 'spd', 'lck', 'def', 'res', 'mov'].map((k) => [k, STAT_NAME[k].slice(0, 2)])];
    let side = 'player', key = 'side', dir = 1, pick = null;
    const panel = el('div', 'roster'); this.root.appendChild(panel);
    const units = () => B.alive.filter((u) => !u.rescuedBy && (side === 'all' || u.side === side || (side === 'ally' && u.side === 'other')) && (u.side !== 'enemy' || visible(u)));
    const val = (u, k) => (k === 'name' ? u.name : k === 'lv' ? u.lv + (cls(u).tier === 2 ? 20 : 0) : k === 'hp' ? u.hp : k === 'side' ? ['player', 'ally', 'other', 'enemy'].indexOf(u.side) * 1000 - (u.lord ? 500 : 0) + (u.boss ? -100 : 0) : u.stats[k]);
    const draw = () => {
      const list = units().sort((a, b) => { const x = val(a, key), y = val(b, key); return (typeof x === 'string' ? x.localeCompare(y) : x - y) * dir || a.uid - b.uid; });
      const count = (s) => B.alive.filter((u) => !u.rescuedBy && (s === 'all' || u.side === s || (s === 'ally' && u.side === 'other')) && (u.side !== 'enemy' || visible(u))).length;
      panel.innerHTML = `<div class="rwin"><div class="rhead"><b>全員資訊</b><span class="rtabs">${SIDES.map(([s, n]) => `<button class="rtab ${s === side ? 'on' : ''} ${s}" data-s="${s}">${n} <small>${count(s)}</small></button>`).join('')}</span><button class="sx">✕</button></div>
        <div class="rtable"><table><thead><tr><th></th>${COLS.map(([k, n]) => `<th data-k="${k}" class="${key === k ? 'on' : ''}">${n}${key === k ? (dir > 0 ? '▲' : '▼') : ''}</th>`).join('')}<th>武器</th></tr></thead><tbody>
        ${list.map((u) => { const w = equipped(u), k = cls(u), hpk = u.hp / u.stats.hp; return `<tr data-u="${u.uid}" class="${u.side} ${u.acted && u.side === 'player' && B.phase === 'player' ? 'done' : ''}"><td class="rf"><i></i></td><td class="rn"><b>${esc(u.name)}${u.boss ? ' <em>將</em>' : ''}${u.lord ? ' <em>主</em>' : ''}</b><small>${esc(k.name)}</small></td><td>${u.lv}</td><td class="rh"><span>${u.hp}/${u.stats.hp}</span><i><em style="width:${hpk * 100}%;background:${hpk > 0.5 ? '#5ad85a' : hpk > 0.25 ? '#e8c840' : '#e84a3a'}"></em></i></td>${['str', 'mag', 'skl', 'spd', 'lck', 'def', 'res', 'mov'].map((s) => `<td>${u.stats[s]}</td>`).join('')}<td class="rw">${w ? esc(ITEMS[w.id].name) : '—'}</td></tr>`; }).join('') || `<tr><td colspan="13" class="rnone">沒有人</td></tr>`}
        </tbody></table></div><div class="rfoot">點一下看詳細資料 · 點欄位排序 · 快捷鍵 L</div></div>`;
      panel.querySelectorAll('tr[data-u]').forEach((tr) => { const u = B.units.find((x) => x.uid === +tr.dataset.u); tr.querySelector('.rf i').appendChild(portrait(faceOf(u), '平', 64, u.side !== 'player')); tr.onclick = () => choose(u); });
      panel.querySelectorAll('[data-s]').forEach((b) => b.onclick = () => { side = b.dataset.s; draw(); });
      panel.querySelectorAll('th[data-k]').forEach((th) => th.onclick = () => { const k = th.dataset.k; if (key === k) dir = -dir; else { key = k; dir = k === 'name' ? 1 : -1; } draw(); });
      panel.querySelector('.sx').onclick = () => done(null);
    };
    let done, busy = false;
    const choose = async (u) => { if (busy) return; busy = true; const a = await this.menu([{ id: 'info', label: '詳細資料' }, { id: 'go', label: '移動游標到這裡' }], innerWidth / 2 - 110, innerHeight / 2 - 60, u.name); busy = false; if (a === 'info') { busy = true; off(); await this.sheet(u, B); busy = false; off = keys(); } if (a === 'go') done(u); };
    const keys = () => this.onKey((e) => { if (busy) return; if (['Escape', 'KeyX', 'KeyL'].includes(e.code)) done(null); if (e.code === 'ArrowRight' || e.code === 'ArrowLeft') { const i = SIDES.findIndex(([s]) => s === side), n = (i + (e.code === 'ArrowRight' ? 1 : SIDES.length - 1)) % SIDES.length; side = SIDES[n][0]; draw(); } });
    let off = keys();
    draw();
    return new Promise((res) => { done = (u) => { off(); panel.remove(); res(u); }; });
  }
  // the little windows in the corners: who is under the cursor, what ground
  hover(u, ter, B) {
    let h = $('hov'); if (!h) { h = el('div', ''); h.id = 'hov'; this.root.appendChild(h); }
    let t = $('ter'); if (!t) { t = el('div', ''); t.id = 'ter'; this.root.appendChild(t); }
    if (u) { const c = CAST[u.id], w = equipped(u); h.className = 'hov ' + u.side; h.innerHTML = `<div class="hpic"></div><div><b>${esc(u.name)}</b><small>${esc(CLASSES[u.cls].name)} Lv${u.lv}</small><div class="hhp">HP ${u.hp}/${u.stats.hp}<i><em style="width:${u.hp / u.stats.hp * 100}%"></em></i></div>${w ? `<small>${esc(ITEMS[w.id].name)}</small>` : ''}</div>`; h.querySelector('.hpic').appendChild(portrait(faceOf(u), '平', 64)); h.hidden = false; } else h.hidden = true;
    if (ter) { t.innerHTML = `<b>${esc(ter.name)}</b><span>守 ${ter.def}</span><span>避 ${ter.avo}</span>${ter.heal ? `<span>回 ${ter.heal}%</span>` : ''}`; t.hidden = false; } else t.hidden = true;
  }
  goalBox(text, turn, extra) { let g = $('goal'); if (!g) { g = el('div', ''); g.id = 'goal'; this.root.appendChild(g); } g.innerHTML = `<b>${esc(text)}</b><span>第 ${turn} 回合${extra ? ' · ' + esc(extra) : ''}</span>`; }
  // ---------------------------------------------------------------- growing
  async exp(u, e, before, ups) {
    const b = el('div', 'expbar', `<span>EXP</span><i><em style="width:${before.exp}%"></em></i><b>${before.exp}</b>`); this.root.appendChild(b); const em = b.querySelector('em'), nb = b.querySelector('b');
    let v = before.exp, lv = before.lv, total = e; await wait(150);
    while (total > 0) { const step = Math.min(total, 100 - v); v += step; total -= step; em.style.width = v + '%'; nb.textContent = Math.min(99, v); await wait(Math.min(600, step * 12 + 80)); if (v >= 100) { v = 0; em.style.transition = 'none'; em.style.width = '0%'; void em.offsetWidth; em.style.transition = ''; } }
    await wait(250); b.remove();
    for (const g of ups) await this.levelUp(u, g, ++lv);
  }
  async levelUp(u, gains, lv) {
    const k = cls(u), c = CAST[u.id], box = el('div', 'lvup');
    box.innerHTML = `<div class="lvt">LEVEL UP!</div><div class="lvh"><div class="lvp"></div><div><b>${esc(u.name)}</b><small>${esc(k.name)} Lv ${lv ?? u.lv}</small></div></div><div class="lvg">${['hp', ...STATS.filter((s) => s !== 'hp')].map((s) => `<div class="lvs" data-s="${s}"><span>${STAT_NAME[s]}</span><b>${u.stats[s] - (gains[s] || 0)}</b><em></em></div>`).join('')}</div>`;
    if (c) box.querySelector('.lvp').appendChild(portrait(c.p, '笑', 96)); this.root.appendChild(box); await wait(400);
    for (const s of Object.keys(gains)) { const row = box.querySelector(`[data-s="${s}"]`); if (!row) continue; row.querySelector('b').textContent = u.stats[s]; row.querySelector('em').textContent = '+' + gains[s]; row.classList.add('up'); await wait(170); }
    await new Promise((r) => { const off = this.onKey(() => { off(); r(); }); box.onclick = () => { off(); r(); }; setTimeout(() => { off(); r(); }, 2600); });
    box.remove();
  }
  async confirm(text, yes = '是', no = '否') { const r = await this.menu([{ id: 1, label: yes }, { id: 0, label: no }], innerWidth / 2 - 80, innerHeight / 2 - 40, text); return r === 1; }
}
export { el, esc as escape, wait };
