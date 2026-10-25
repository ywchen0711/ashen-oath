// Ashen Oath: the whole game. The title, saving, the chapters in order (card, story, preparation, battle, what
// follows), the player's turn (pick a unit, move, act), the enemy's turn, support conversations, the ending.
import { MapView } from './view.js';
import { UI, el, esc, wait } from './ui.js';
import { BattleFX } from './battlefx.js';
import { Battle } from './engine.js';
import { CHAPTERS } from './data/story.js';
import { SUPPORTS, SUPPORT_LEVELS } from './data/supports.js';
import { ENDINGS } from './data/endings.js';
import { CAST } from './data/cast.js';
import { CLASSES } from './data/classes.js';
import { ITEMS } from './data/items.js';
import { terrainAt } from './data/terrain.js';
import { recruit, equipped, weapons, staves, rangeOf, canUse, canPromote, promote, setUid, distance, hasSkill, cls, equip } from './rules.js';
import { portrait } from './portraits.js';
import { sound } from './sound.js';

const $ = (id) => document.getElementById(id);
const KEY = 'ashenoath.v1', GAME = 'ashenoath';
const ui = new UI(), fx = new BattleFX(), view = new MapView($('map'));
let S = null, B = null, cloud = null, opt = loadOpt();
function loadOpt() { try { return { anim: true, speed: 1, ...JSON.parse(localStorage.getItem('ashenoath.opt') || '{}') }; } catch (e) { return { anim: true, speed: 1 }; } }
const saveOpt = () => { try { localStorage.setItem('ashenoath.opt', JSON.stringify(opt)); } catch (e) { /* */ } };
// ---------------------------------------------------------------- saves
const fresh = (mode) => ({ v: 1, mode, ch: 0, army: [], convoy: [], gold: 0, supports: {}, supportPts: {}, seenSup: {}, flags: {}, dead: [], time: 0, seed: Math.floor(Math.random() * 1e9), slot: 0 });
const strip = (u) => { const { x, y, ax, ay, anim, bump, flash, from, moved, acted, rescuing, rescuedBy, look, status, torch, miracleUsed, flip, warpPending, talkMark, dead, left, _wid, quoted, off, ...keep } = u; return keep; };
function snapshot() { return { ...S, army: S.army.map(strip) }; }
function readSlots() { try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) { return {}; } }
function writeSlot(n, data) { const all = readSlots(); all[n] = data; try { localStorage.setItem(KEY, JSON.stringify(all)); } catch (e) { /* full */ } if (cloud) cloud.touch(GAME, KEY); }
function save(n = S.slot) { S.slot = n; writeSlot(n, { ...snapshot(), savedAt: Date.now(), chName: CHAPTERS[S.ch] ? `${CHAPTERS[S.ch].no}　${CHAPTERS[S.ch].title}` : '終章' }); }
function load(data) { S = { ...fresh(data.mode), ...data, army: data.army.map((u) => ({ ...u })) }; setUid(Math.max(1, ...S.army.map((u) => u.uid || 0)) + 1); }
// ---------------------------------------------------------------- the title
async function title() {
  B = null; $('map').hidden = true; ui.clear(); sound.music('title');
  const slots = readSlots(), any = Object.values(slots).some(Boolean), t = el('div', 'title');
  t.innerHTML = `<canvas class="tbgc" width="960" height="540"></canvas><div class="tlogo"><div class="tzh">灰燼誓約</div><div class="ten">ASHEN OATH</div></div><div class="tmenu"><button data-a="new">新的旅程</button><button data-a="load" ${any ? '' : 'disabled'}>繼續</button><button data-a="opt">設定</button></div><div class="tfoot">一個關於誓言、謊言與選擇的故事</div>`;
  ui.root.appendChild(t); const g = t.querySelector('canvas').getContext('2d'); g.drawImage((await import('./bgs.js')).backdrop('ember'), 0, 0);
  const a = await new Promise((r) => t.querySelectorAll('[data-a]').forEach((b) => b.onclick = () => { sound.init(); sound.play('ok'); r(b.dataset.a); }));
  t.remove();
  if (a === 'new') return newGame();
  if (a === 'load') return loadMenu();
  if (a === 'opt') { await options(); return title(); }
}
async function newGame() {
  const m = await ui.menu([{ id: 'casual', label: '普通模式', hint: '倒下的同伴會撤退，下一章回來' }, { id: 'classic', label: '經典模式', hint: '倒下的同伴就此離去。每一個決定都有代價' }], innerWidth / 2 - 160, innerHeight / 2 - 80, '選擇模式');
  if (!m) return title();
  const slot = await slotMenu('存檔位置'); if (slot == null) return title();
  S = fresh(m); S.slot = slot; await play();
}
async function slotMenu(head, loadOnly) {
  const slots = readSlots(); const items = [0, 1, 2].map((n) => { const s = slots[n]; return { id: n, label: `檔案 ${n + 1}　${s ? esc(s.chName || '') : '（空）'}`, hint: s ? `${s.mode === 'classic' ? '經典' : '普通'} · ${new Date(s.savedAt).toLocaleString()}` : '', off: loadOnly && !s }; });
  if (slots.suspend && loadOnly) items.unshift({ id: 'suspend', label: '中斷的戰鬥', hint: slots.suspend.chName });
  return ui.menu(items, innerWidth / 2 - 180, innerHeight / 2 - 120, head);
}
async function loadMenu() { const n = await slotMenu('讀取', true); if (n == null) return title(); const data = readSlots()[n]; if (!data) return title(); load(data); if (n === 'suspend') return resumeSuspend(data); await play(); }
async function options() { const r = await ui.menu([{ id: 'anim', label: `戰鬥動畫：${opt.anim ? '開' : '關'}` }, { id: 'speed', label: `敵方速度：${['', '一般', '快', '最快'][opt.speed]}` }, { id: 'snd', label: `聲音：${sound.on ? '開' : '關'}` }, { id: 'back', label: '返回' }], innerWidth / 2 - 150, innerHeight / 2 - 100, '設定'); if (r === 'anim') opt.anim = !opt.anim; if (r === 'speed') opt.speed = opt.speed % 3 + 1; if (r === 'snd') sound.on = !sound.on; saveOpt(); if (r && r !== 'back') return options(); }
// ---------------------------------------------------------------- the chapters
async function play() {
  ui.flags = S.flags;
  while (S.ch < CHAPTERS.length) { const r = await chapter(CHAPTERS[S.ch]); if (r === 'title') return title(); }
  await ending(); return title();
}
const has = (id) => S.army.some((u) => u.id === id) || S.dead.includes(id);
function joinArmy(id) { if (has(id)) return null; const u = recruit(id); S.army.push(u); return u; }
async function chapter(ch, resume) {
  sound.music(ch.music || 'story');
  if (!resume) {
    await ui.card(ch.no, ch.title, ch.sub);
    for (const id of ch.joinBefore || []) joinArmy(id);
    if (ch.intro) await ui.say(typeof ch.intro === 'function' ? ch.intro(S) : ch.intro, { bg: ch.bg || 'black' });
    for (const id of ch.joinAfterIntro || []) joinArmy(id);
    if (ch.afterIntroFn) ch.afterIntroFn(S);
  }
  if (ch.scene) { await afterChapter(ch); return; } // a chapter that is only story
  for (;;) {
    let chosen;
    if (!resume) { chosen = await prep(ch); if (chosen === 'title') return 'title'; }
    const r = await battle(ch, chosen, resume); resume = null;
    if (r === 'win') { await afterChapter(ch); return; }
    if (r === 'title') return 'title';
    // lost: try again from the preparation
    const a = await ui.menu([{ id: 'retry', label: '重新挑戰這一章' }, { id: 'title', label: '回到標題' }], innerWidth / 2 - 130, innerHeight / 2 - 60, B.loseWhy ? `${B.loseWhy}……` : '戰敗');
    restoreArmy(); if (a !== 'retry') return 'title';
  }
}
let armyBefore = null;
function restoreArmy() { if (armyBefore) { S.army = armyBefore.army.map((u) => ({ ...u, items: u.items.map((i) => ({ ...i })), stats: { ...u.stats } })); S.convoy = armyBefore.convoy.map((i) => ({ ...i })); S.gold = armyBefore.gold; S.supportPts = { ...armyBefore.supportPts }; } }
async function afterChapter(ch) {
  sound.music('story');
  if (ch.outro) await ui.say(typeof ch.outro === 'function' ? ch.outro(S, B) : ch.outro, { bg: ch.outroBg || ch.bg || 'black' });
  for (const d of ch.after || []) { if (d.join) joinArmy(d.join); if (d.leave) S.army = S.army.filter((u) => u.id !== d.leave); if (d.promote) { const u = S.army.find((x) => x.id === d.promote[0]); if (u && cls(u).tier === 1) { const gains = promote(u, d.promote[1]); await ui.levelUp(u, gains, u.lv); } } if (d.item) S.convoy.push({ id: d.item, uses: ITEMS[d.item].uses }); if (d.gold) S.gold += d.gold; if (d.flag) S.flags[d.flag] = true; if (d.give) { const u = S.army.find((x) => x.id === d.give[0]); if (u) u.items.unshift({ id: d.give[1], uses: ITEMS[d.give[1]].uses }); } }
  if (ch.afterFn) ch.afterFn(S, B);
  for (const u of S.army) { u.hp = u.stats.hp; }
  S.ch++; const sv = await ui.confirm('要存檔嗎？', '存檔', '不存'); if (sv) save(); writeSlot('suspend', null);
}
// ---------------------------------------------------------------- preparation
async function prep(ch) {
  armyBefore = { army: S.army.map((u) => ({ ...u, items: u.items.map((i) => ({ ...i })), stats: { ...u.stats } })), convoy: S.convoy.map((i) => ({ ...i })), gold: S.gold, supportPts: { ...S.supportPts } };
  const slots = ch.deploy.length, forced = new Set([...(ch.forced || []), ...S.army.filter((u) => u.lord).map((u) => u.id)].filter((id) => S.army.some((u) => u.id === id)));
  const avail = S.army.filter((u) => !S.dead.includes(u.id) && !(ch.absent || []).includes(u.id));
  let pick = [...avail.filter((u) => forced.has(u.id)), ...avail.filter((u) => !forced.has(u.id))].slice(0, slots).map((u) => u.uid);
  if (ch.noPrep || avail.length <= slots && !ch.shop) return avail.filter((u) => pick.includes(u.uid));
  for (;;) {
    const p = el('div', 'prep'); ui.root.appendChild(p);
    const sup = availableSupports();
    p.innerHTML = `<div class="ph"><b>${esc(ch.no)}　${esc(ch.title)}</b><span>出擊 <em id="pc">${pick.length}</em> / ${slots}</span><span class="gold">💰 ${S.gold}</span></div><div class="pgoal">勝利條件：${esc(ch.goal.text)}</div><div class="plist"></div><div class="pbtns"><button data-a="start" class="hot">開始戰鬥</button><button data-a="items">道具與倉庫</button>${ch.shop ? '<button data-a="shop">商店</button>' : ''}<button data-a="sup">支援對話${sup.length ? ` <em>${sup.length}</em>` : ''}</button><button data-a="save">存檔</button><button data-a="title">標題</button></div>`;
    const list = p.querySelector('.plist');
    for (const u of avail) { const c = CAST[u.id], d = el('button', 'pu' + (pick.includes(u.uid) ? ' on' : '') + (forced.has(u.id) ? ' lock' : '')); d.innerHTML = `<div class="pp"></div><b>${esc(u.name)}</b><small>${esc(CLASSES[u.cls].name)} Lv${u.lv}</small>`; if (c) d.querySelector('.pp').appendChild(portrait(c.p, '平', 72)); d.onclick = () => { if (forced.has(u.id)) return; if (pick.includes(u.uid)) pick = pick.filter((x) => x !== u.uid); else if (pick.length < slots) pick.push(u.uid); d.classList.toggle('on', pick.includes(u.uid)); p.querySelector('#pc').textContent = pick.length; }; d.oncontextmenu = (e) => { e.preventDefault(); ui.sheet(u); }; list.appendChild(d); }
    const a = await new Promise((r) => p.querySelectorAll('[data-a]').forEach((b) => b.onclick = () => r(b.dataset.a)));
    p.remove();
    if (a === 'start') return pick.map((uid) => S.army.find((u) => u.uid === uid));
    if (a === 'items') await itemsScreen();
    if (a === 'shop') await shopScreen(ch.shop);
    if (a === 'sup') await supportScreen();
    if (a === 'save') { const n = await slotMenu('存檔到'); if (n != null) { save(n); await ui.note('已存檔'); } }
    if (a === 'title') { if (await ui.confirm('回到標題？未存檔的進度會遺失。')) return 'title'; }
  }
}
async function itemsScreen() {
  for (;;) {
    const r = await ui.menu([...S.army.filter((u) => !S.dead.includes(u.id)).map((u) => ({ id: u.uid, label: `${u.name}　${u.items.map((i) => ITEMS[i.id].name).join('、') || '—'}` })), { id: 'convoy', label: `倉庫（${S.convoy.length} 件）` }, { id: null, label: '返回' }], 40, 40, '道具');
    if (r == null) return; if (r === 'convoy') { await convoyScreen(null); continue; }
    await unitItems(S.army.find((u) => u.uid === r));
  }
}
async function unitItems(u) {
  for (;;) {
    const items = u.items.map((it, k) => ({ id: k, label: `${ITEMS[it.id].name} ${it.uses}/${ITEMS[it.id].uses}${equipped(u) === it ? '　（裝備中）' : ''}` }));
    const r = await ui.menu([...items, { id: 'take', label: '從倉庫拿', off: u.items.length >= 5 || !S.convoy.length }, { id: 'sheet', label: '能力' }, { id: null, label: '返回' }], 60, 60, `${u.name}的道具`);
    if (r == null) return; if (r === 'sheet') { await ui.sheet(u); continue; } if (r === 'take') { await convoyScreen(u); continue; }
    const it = u.items[r], d = ITEMS[it.id];
    const acts = [{ id: 'eq', label: '裝備', off: !(d.kind === 'weapon' && canUse(u, it.id)) }, { id: 'use', label: '使用', off: !(d.use === 'boost' || (d.use === 'promote' && canPromote(u))) }, { id: 'store', label: '放進倉庫' }, { id: 'drop', label: '丟棄' }, { id: null, label: '返回' }];
    const a = await ui.menu(acts, 120, 120, d.name + (d.desc ? '：' + d.desc : ''));
    if (a === 'eq') equip(u, it);
    if (a === 'store') { u.items.splice(r, 1); S.convoy.push(it); }
    if (a === 'drop' && await ui.confirm(`丟掉「${d.name}」？`)) u.items.splice(r, 1);
    if (a === 'use' && d.use === 'boost') { if (d.stat === 'mov') u.stats.mov += d.amt; else { u.stats[d.stat] += d.amt; if (d.stat === 'hp') u.hp += d.amt; } u.items.splice(r, 1); await ui.note(`${u.name}的能力提升了`); }
    if (a === 'use' && d.use === 'promote') { const to = await ui.menu(cls(u).to.map((c) => ({ id: c, label: CLASSES[c].name, hint: CLASSES[c].desc + '　武器：' + CLASSES[c].weapons.map((w) => ({ sword: '劍', lance: '槍', axe: '斧', bow: '弓', anima: '理', light: '光', dark: '闇', staff: '杖' }[w])).join('、') })), 140, 120, '轉職為'); if (to) { u.items.splice(r, 1); const gains = promote(u, to); sound.play('level'); await ui.levelUp(u, gains, 1); } }
  }
}
async function convoyScreen(u) {
  const r = await ui.menu([...S.convoy.map((it, k) => ({ id: k, label: `${ITEMS[it.id].name} ${it.uses}/${ITEMS[it.id].uses}`, off: !u })), { id: null, label: '返回' }], 80, 60, u ? `給${u.name}` : '倉庫');
  if (r == null || !u) return; u.items.push(S.convoy.splice(r, 1)[0]);
}
async function shopScreen(list) {
  for (;;) { const r = await ui.menu([...list.map((id) => ({ id, label: `${ITEMS[id].name}　${ITEMS[id].price} 金`, off: S.gold < ITEMS[id].price })), { id: 'sell', label: '賣出' }, { id: null, label: '離開' }], 60, 60, `商店　💰 ${S.gold}`); if (r == null) return; if (r === 'sell') { await sellScreen(); continue; } S.gold -= ITEMS[r].price; S.convoy.push({ id: r, uses: ITEMS[r].uses }); sound.play('coin'); }
}
async function sellScreen() { const r = await ui.menu([...S.convoy.map((it, k) => ({ id: k, label: `${ITEMS[it.id].name}　${Math.floor(ITEMS[it.id].price / 2 * it.uses / ITEMS[it.id].uses)} 金`, off: !ITEMS[it.id].price })), { id: null, label: '返回' }], 80, 60, '賣出倉庫的東西'); if (r == null) return; const it = S.convoy.splice(r, 1)[0]; S.gold += Math.floor(ITEMS[it.id].price / 2 * it.uses / ITEMS[it.id].uses); sound.play('coin'); }
// ---------------------------------------------------------------- supports
function availableSupports() {
  const out = [];
  for (const [k, sup] of Object.entries(SUPPORTS)) { const [a, b] = k.split('+'); if (!S.army.some((u) => u.id === a) || !S.army.some((u) => u.id === b) || S.dead.includes(a) || S.dead.includes(b)) continue; const lvl = S.supports[k] || 0, next = ['C', 'B', 'A'][lvl]; if (!next || !sup[next]) continue; if ((S.supportPts[k] || 0) >= SUPPORT_LEVELS[lvl]) out.push({ k, a, b, next }); }
  return out;
}
async function supportScreen() {
  for (;;) {
    const av = availableSupports(), seen = Object.entries(S.supports).filter(([, v]) => v > 0);
    const r = await ui.menu([...av.map((s) => ({ id: 'n:' + s.k, label: `★ ${CAST[s.a].name} × ${CAST[s.b].name}　支援 ${s.next}` })), ...seen.map(([k, v]) => ({ id: 'r:' + k, label: `${CAST[k.split('+')[0]].name} × ${CAST[k.split('+')[1]].name}　${'CBA'.slice(0, v)}`, hint: '重看' })), { id: null, label: '返回' }], 60, 60, av.length ? '支援對話' : '支援對話（並肩作戰、互相治療，就會累積羈絆）');
    if (r == null) return;
    const [t, k] = [r.slice(0, 1), r.slice(2)];
    if (t === 'n') { const lvl = S.supports[k] || 0, next = 'CBA'[lvl]; await ui.say(SUPPORTS[k][next], { bg: SUPPORTS[k].bg || 'camp' }); S.supports[k] = lvl + 1; await ui.note(`支援等級提升到 ${next}：一起出擊時命中、迴避、必殺提升`); }
    else { const v = S.supports[k]; const which = await ui.menu('CBA'.slice(0, v).split('').map((x) => ({ id: x, label: '支援 ' + x })), 80, 80); if (which) await ui.say(SUPPORTS[k][which], { bg: SUPPORTS[k].bg || 'camp' }); }
  }
}
// ---------------------------------------------------------------- the battle
const adapter = {
  say: (lines) => ui.say(lines),
  fight: async (a, d, res) => { if (opt.anim && (a.side === 'player' || d.side === 'player' || a.side === 'ally')) await fx.play(B, a, d, res, { sound: (s) => sound.play(s) }); else { a.bump = { dx: Math.sign(d.x - a.x), dy: Math.sign(d.y - a.y), t: 0 }; await wait(220); for (const s of res.strikes) { const o = s.side === 'A' ? d : a; if (s.hit) { o.flash = 1; view.float(o.x, o.y, String(s.dmg), s.crit ? '#ffd040' : '#fff'); sound.play(s.crit ? 'crit' : 'hit'); } else { view.float(o.x, o.y, 'MISS', '#a8c8ff'); sound.play('miss'); } await wait(260 / opt.speed); } } },
  exp: (u, e, before, ups) => { sound.play('exp'); if (ups.length) sound.play('level'); return ui.exp(u, e, before, ups); },
  heal: async (u, t, n) => { view.float(t.x, t.y, '+' + n, '#7aff8a'); sound.play('heal'); await wait(500); },
  note: (t) => ui.note(t), walk: (u, path) => view.walk(u, path), refresh: () => refreshHud(), repaint: () => view.repaint(), toast: (u, t) => view.float(u.x, u.y, t, '#7aff8a'),
};
let input = null;
async function battle(ch, chosen, resume) {
  $('map').hidden = false; ui.clear();
  if (resume) { B = resume; B.ui = adapter; }
  else { B = new Battle(ch, S.army, { ui: adapter, mode: S.mode, seed: S.seed + S.ch * 101, flags: S.flags, supports: S.supports, supportPts: S.supportPts }); B.deploy(chosen); }
  view.setBattle(B); refreshHud(); sound.music(ch.battleMusic || 'battle');
  loop();
  if (!resume) { if (ch.mapIntro) await ui.say(ch.mapIntro); }
  for (;;) {
    if (!resume || resume.phase === 'player') { if (!resume || !B.turn) await B.beginTurn('player'); else B.phase = 'player'; resume = null; if (B.done) break; sound.play('phase'); await ui.banner('玩家回合', 'blue'); refreshHud(); const r = await playerPhase(); if (r === 'title') return 'title'; if (B.check()) break; }
    if (B.side('ally').length) { await B.beginTurn('ally'); await ui.banner('友軍回合', 'green'); await B.aiPhase('ally'); if (B.check()) break; }
    await B.beginTurn('enemy'); sound.play('phase'); await ui.banner('敵方回合', 'red'); await B.aiPhase('enemy'); if (B.done) break;
    B.phase = 'enemyEnd'; if (B.check()) break;
    suspend();
  }
  stopLoop();
  const won = B.done === 'win';
  if (won) {
    // the fallen
    for (const u of B.lost) if (u.side === 'player' && u.id && !u.lord) { if (S.mode === 'classic') { S.dead.push(u.id); S.army = S.army.filter((x) => x !== u); } }
    for (const it of B.convoyAdd) S.convoy.push(it); S.gold += B.gold; S.flags = B.flags;
    for (const u of S.army) { u.dead = false; u.x = null; }
    sound.play('win'); await ui.banner('勝利', 'gold');
    writeSlot('suspend', null);
  }
  $('map').hidden = true; ui.clear();
  return won ? 'win' : 'lose';
}
function suspend() { try { writeSlot('suspend', { ...snapshot(), savedAt: Date.now(), chName: `${B.ch.no}　${B.ch.title} · 第 ${B.turn} 回合`, battle: { turn: B.turn, units: B.units.map((u) => ({ ...strip(u), x: u.x, y: u.y, dead: u.dead, side: u.side, ai: u.ai, status: u.status, rescuing: u.rescuing, rescuedBy: u.rescuedBy, left: u.left, awake: u.awake, loot: u.loot })), rows: B.F.rows.map((r) => r.join('')), opened: [...B.F.opened], visited: [...B.visited], fired: (B.ch.events || []).map((e, i) => (B.fired.has(e) ? i : -1)).filter((i) => i >= 0), flags: B.flags, goal: B.goal, gold: B.gold, convoyAdd: B.convoyAdd, lost: B.lost.map((u) => u.uid), rng: B.R.state() } }); } catch (e) { /* */ } }
async function resumeSuspend(data) {
  const bd = data.battle, ch = CHAPTERS[S.ch]; if (!bd || !ch) return play();
  const nb = new Battle(ch, S.army, { ui: adapter, mode: S.mode, seed: 1, flags: bd.flags, supports: S.supports, supportPts: S.supportPts });
  nb.units = bd.units.map((d) => { const u = S.army.find((a) => a.uid === d.uid) || {}; return Object.assign(u, d); }); nb.F.rows = bd.rows.map((r) => r.split('')); nb.F.opened = new Set(bd.opened); nb.visited = new Set(bd.visited); nb.fired = new Set(bd.fired.map((i) => ch.events[i])); nb.goal = bd.goal; nb.gold = bd.gold; nb.convoyAdd = bd.convoyAdd; nb.turn = bd.turn; nb.R.set(bd.rng); nb.lost = nb.units.filter((u) => bd.lost.includes(u.uid)); nb.phase = 'player';
  setUid(Math.max(...nb.units.map((u) => u.uid)) + 1);
  for (;;) { const r = await chapter(ch, nb); if (r === 'title') return title(); break; }
  return play();
}
// the drawing loop
let raf = 0, last = 0;
function loop() { cancelAnimationFrame(raf); const step = (now) => { raf = requestAnimationFrame(step); const dt = Math.min(0.05, (now - (last || now)) / 1000); last = now; if (B) { if (B.ch.fog) view.vision = B.F.vision(B.alive, 'player', []); view.draw(now / 1000, dt); } }; raf = requestAnimationFrame(step); }
function stopLoop() { cancelAnimationFrame(raf); }
function refreshHud() { if (!B) return; ui.goalBox(B.goal.text, B.turn, B.goal.turns ? `${Math.max(0, B.goal.turns - B.turn + (B.phase === 'player' ? 1 : 0))} 回合後` : B.goal.limit ? `限 ${B.goal.limit} 回合` : ''); for (const u of B.alive) u.talkMark = B.side('player').some((p) => B.talkWith(p, u)) && u.side !== 'player'; }
// ---------------------------------------------------------------- the player's turn
function playerPhase() {
  return new Promise((done) => {
    let mode = 'free', sel = null, moves = null, origin = null, busy = false, showEnemy = new Set();
    const F = B.F, cv = $('map');
    const sets = () => { const o = {}; if (view.dangerOn) o.danger = danger(); if (showEnemy.size) { o.enemy = new Set(); for (const u of showEnemy) if (!u.dead) for (const k of F.threat(u, B.alive).hits) o.enemy.add(k); } return o; };
    const reset = () => { mode = 'free'; sel = null; moves = null; view.over = sets(); view.path = null; refreshHud(); };
    const hover = () => { const { x, y } = view.cursor, u = B.at(x, y); ui.hover(u && (!B.ch.fog || u.side !== 'enemy' || (view.vision && view.vision.has(y * F.W + x))) ? u : null, F.inside(x, y) ? terrainAt(F.tile(x, y)) : null, B); if (mode === 'move' && moves) { const k = y * F.W + x; view.path = moves.cost.has(k) || (x === sel.x && y === sel.y) ? F.path(moves, x, y) : view.path; } };
    const pick = (u) => { sel = u; origin = [u.x, u.y]; moves = F.moves(u, B.alive); const atk = new Set(), stf = new Set(), r = reachOf(u), sr = F.staffReach(u, B.alive); const cells = [...moves.cost.keys(), u.y * F.W + u.x]; for (const k of cells) { const x = k % F.W, y = Math.floor(k / F.W); if (r) for (const [ax, ay] of F.ring(x, y, r[0], r[1])) atk.add(ay * F.W + ax); if (sr) for (const [ax, ay] of F.ring(x, y, 1, sr)) stf.add(ay * F.W + ax); } for (const k of cells) { atk.delete(k); stf.delete(k); } view.over = { ...sets(), move: new Set(cells), atk, staff: stf }; mode = 'move'; sound.play('select'); hover(); };
    const reachOf = (u) => { let lo = 99, hi = 0; for (const w of weapons(u)) { const [a, b] = rangeOf(u, w); lo = Math.min(lo, a); hi = Math.max(hi, b); } return hi ? [lo, hi] : null; };
    const finish = async () => { // end of this unit's action
      view.over = sets(); refreshHud(); if (B.check()) return end(); if (B.allActed()) { await wait(250); return end(); } reset(); };
    const end = () => { cleanup(); done(); };
    const act = async (u) => {
      // the action menu
      for (;;) {
        const opts = B.options(u), L = { attack: '攻擊', staff: '杖', sing: '歌唱', talk: '對話', visit: '拜訪', shop: '商店', seize: '壓制', escape: '脫離', chest: '寶箱', door: '開門', steal: '偷竊', rescue: '救出', drop: '放下', trade: '交換', items: '道具', wait: '待機' };
        const sp = view.toScreen(u.x, u.y), a = await ui.menu(opts.map((o) => ({ id: o, label: L[o] })), sp.x + view.TS + 10, sp.y - 10);
        if (a == null) { if (u.moved && !u.acted) { u.x = origin[0]; u.y = origin[1]; u.moved = false; } return 'cancel'; }
        if (a === 'wait') { B.wait(u); return 'done'; }
        if (a === 'attack') { const t = await chooseTarget(u, B.targets(u), 'atk'); if (!t) continue; const list = weapons(u).filter((w) => { const [lo, hi] = rangeOf(u, w), d = distance(u, t); return d >= lo && d <= hi; }); const w = await ui.forecast(B, u, t, list); if (!w) continue; await B.attack(u, w, t); refreshHud(); return 'done'; }
        if (a === 'staff') { const ss = staves(u).filter((s) => B.staffTargets(u, s).length); const s = ss.length === 1 ? ss[0] : ss[await ui.menu(ss.map((x, k) => ({ id: k, label: ITEMS[x.id].name })), sp.x + view.TS + 10, sp.y)]; if (!s) continue; const ts = B.staffTargets(u, s); const t = ts.length === 1 && ts[0] === u ? u : await chooseTarget(u, ts, 'staff'); if (!t) continue; if (ITEMS[s.id].warp) { const spot = await chooseSquare(u, (x, y) => !B.at(x, y) && terrainAt(F.tile(x, y)).cost.inf < 99); if (!spot) continue; t.x = spot[0]; t.y = spot[1]; } await B.staff(u, s, t); return 'done'; }
        if (a === 'sing') { const t = await chooseTarget(u, F.ring(u.x, u.y, 1, 1).map(([x, y]) => B.at(x, y)).filter((o) => o && o.side === 'player' && o.acted), 'staff'); if (!t) continue; sound.play('heal'); await B.sing(u, t); return 'done'; }
        if (a === 'talk') { const t = await chooseTarget(u, F.ring(u.x, u.y, 1, 1).map(([x, y]) => B.at(x, y)).filter((o) => o && B.talkWith(u, o)), 'pick'); if (!t) continue; await B.talk(u, t); return 'done'; }
        if (a === 'visit') { await B.visit(u); return 'done'; }
        if (a === 'shop') { await shopScreen(B.ch.shops[u.x + ',' + u.y]); continue; }
        if (a === 'seize') { sound.play('win'); await B.seize(u); return 'done'; }
        if (a === 'escape') { await B.escape(u); return 'done'; }
        if (a === 'chest') { await B.chest(u); return 'done'; }
        if (a === 'door') { await B.door(u); return 'done'; }
        if (a === 'steal') { const t = await chooseTarget(u, F.ring(u.x, u.y, 1, 1).map(([x, y]) => B.at(x, y)).filter((o) => o && o.side === 'enemy' && o.stats.spd <= u.stats.spd), 'pick'); if (!t) continue; const can = t.items.filter((i) => i !== equipped(t)); const k = await ui.menu(can.map((i, n) => ({ id: n, label: ITEMS[i.id].name })), sp.x + view.TS + 10, sp.y, '偷什麼'); if (k == null) continue; await B.steal(u, t, can[k]); return 'done'; }
        if (a === 'rescue') { const t = await chooseTarget(u, F.ring(u.x, u.y, 1, 1).map(([x, y]) => B.at(x, y)).filter((o) => o && o.side !== 'enemy' && !o.rescuing && o !== u), 'pick'); if (!t) continue; B.rescue(u, t); return 'done'; }
        if (a === 'drop') { const spot = await chooseSquare(u, (x, y) => distance(u, { x, y }) === 1 && !B.at(x, y) && terrainAt(F.tile(x, y)).cost.inf < 99); if (!spot) continue; B.drop(u, spot[0], spot[1]); return 'done'; }
        if (a === 'trade') { const t = await chooseTarget(u, F.ring(u.x, u.y, 1, 1).map(([x, y]) => B.at(x, y)).filter((o) => o && o.side === 'player'), 'pick'); if (!t) continue; await trade(u, t); continue; }
        if (a === 'items') { const r = await itemMenu(u); if (r === 'acted') return 'done'; continue; }
      }
    };
    const chooseTarget = (u, list, kind) => new Promise((res) => {
      if (!list.length) return res(null); let k = 0; mode = 'target'; view.over = { [kind]: new Set(list.map((t) => t.y * F.W + t.x)) }; const go = () => { view.cursor = { x: list[k].x, y: list[k].y }; view.follow(list[k].x, list[k].y); hover(); }; go();
      targetPick = (x, y) => { const t = list.find((o) => o.x === x && o.y === y); if (t) { cleanupT(); res(t); } else { k = list.findIndex((o) => o.x === x && o.y === y); } };
      const off = ui.onKey((e) => { if (['ArrowRight', 'ArrowDown'].includes(e.code)) { k = (k + 1) % list.length; go(); } if (['ArrowLeft', 'ArrowUp'].includes(e.code)) { k = (k + list.length - 1) % list.length; go(); } if (['Enter', 'KeyZ', 'Space'].includes(e.code)) { e.preventDefault(); cleanupT(); res(list[k]); } if (['Escape', 'KeyX'].includes(e.code)) { cleanupT(); res(null); } });
      targetCancel = () => { cleanupT(); res(null); };
      const cleanupT = () => { off(); targetPick = null; targetCancel = null; mode = 'act'; view.over = sets(); view.cursor = { x: u.x, y: u.y }; };
    });
    const chooseSquare = (u, ok) => new Promise((res) => { const cells = new Set(); for (let y = 0; y < F.H; y++) for (let x = 0; x < F.W; x++) if (ok(x, y)) cells.add(y * F.W + x); view.over = { pick: cells }; mode = 'target'; targetPick = (x, y) => { if (cells.has(y * F.W + x)) { targetPick = null; targetCancel = null; view.over = sets(); res([x, y]); } }; targetCancel = () => { targetPick = null; targetCancel = null; view.over = sets(); res(null); }; });
    let targetPick = null, targetCancel = null;
    const trade = async (u, t) => { for (;;) { const r = await ui.menu([...u.items.map((i, k) => ({ id: 'a' + k, label: `${u.name}：${ITEMS[i.id].name}` })), ...t.items.map((i, k) => ({ id: 'b' + k, label: `${t.name}：${ITEMS[i.id].name}` })), { id: null, label: '完成' }], innerWidth / 2 - 150, 80, '交換（選一件給對方）'); if (r == null) return; const from = r[0] === 'a' ? u : t, to = from === u ? t : u, k = +r.slice(1); if (to.items.length >= 5) { await ui.note('對方拿不下了'); continue; } to.items.push(from.items.splice(k, 1)[0]); } };
    const itemMenu = async (u) => { const r = await ui.menu([...u.items.map((i, k) => ({ id: k, label: `${ITEMS[i.id].name} ${i.uses}/${ITEMS[i.id].uses}${equipped(u) === i ? '　E' : ''}` })), { id: null, label: '返回' }], innerWidth / 2 - 140, 100, '道具'); if (r == null) return; const it = u.items[r], d = ITEMS[it.id]; const a = await ui.menu([{ id: 'eq', label: '裝備', off: !(d.kind === 'weapon' && canUse(u, it.id)) }, { id: 'use', label: '使用', off: !(d.use === 'heal' && u.hp < u.stats.hp || d.use === 'boost' || d.use === 'torch' || d.use === 'gold') }, { id: 'drop', label: '丟棄' }, { id: null, label: '返回' }], innerWidth / 2 - 100, 140, d.name); if (a === 'eq') equip(u, it); if (a === 'use') { const msg = B.useItem(u, it); sound.play('heal'); await ui.note(msg); return 'acted'; } if (a === 'drop' && await ui.confirm(`丟掉「${d.name}」？`)) u.items.splice(r, 1); };
    const mapMenu = async () => { const r = await ui.menu([{ id: 'end', label: '結束回合' }, { id: 'units', label: '部隊' }, { id: 'danger', label: `危險範圍：${view.dangerOn ? '開' : '關'}` }, { id: 'goal', label: '勝利條件' }, { id: 'opt', label: '設定' }, { id: 'title', label: '中斷並回到標題' }], innerWidth / 2 - 120, innerHeight / 2 - 120); if (r === 'end') { if (B.side('player').some((u) => !u.acted) && !(await ui.confirm('還有人沒行動，要結束回合嗎？'))) return; for (const u of B.side('player')) B.wait(u); return end(); } if (r === 'danger') { view.dangerOn = !view.dangerOn; view.over = sets(); } if (r === 'goal') await ui.say([['-', `勝利條件：${B.goal.text}`], ['-', `敗北條件：${B.ch.loseText || '主角倒下'}`]]); if (r === 'units') { const u = await ui.menu(B.side('player').map((x) => ({ id: x.uid, label: `${x.acted ? '・' : '▶'} ${x.name}　HP ${x.hp}/${x.stats.hp}` })), 40, 40, '部隊'); const t = B.units.find((x) => x.uid === u); if (t) { view.cursor = { x: t.x, y: t.y }; view.follow(t.x, t.y); hover(); } } if (r === 'opt') await options(); if (r === 'title') { if (await ui.confirm('中斷戰鬥並回到標題？（下次可從這回合開始繼續）')) { suspend(); cleanup(); stopLoop(); title(); } } };
    const danger = () => { const s = new Set(); for (const u of B.side('enemy')) for (const k of F.threat(u, B.alive).hits) s.add(k); return s; };
    // clicking a square
    const click = async (x, y, right) => {
      if (busy) return; if (targetPick) { if (right) targetCancel(); else targetPick(x, y); return; }
      if (right) { if (mode === 'move') reset(); else { const u = B.at(x, y); if (u) { busy = true; await ui.sheet(u, B); busy = false; } } return; }
      const u = B.at(x, y);
      if (mode === 'free') {
        if (u && u.side === 'player' && !u.acted) return pick(u);
        if (u && u.side !== 'player') { if (showEnemy.has(u)) showEnemy.delete(u); else showEnemy.add(u); view.over = sets(); sound.play('select'); return; }
        if (u && u.side === 'player' && u.acted) { busy = true; await ui.sheet(u, B); busy = false; return; }
        busy = true; await mapMenu(); busy = false; return;
      }
      if (mode === 'move') {
        const k = y * F.W + x;
        if (x === sel.x && y === sel.y || moves.cost.has(k)) {
          busy = true; mode = 'act'; const path = F.path(moves, x, y); view.over = sets(); view.path = null; if (path.length > 1) { sound.play('walk'); await view.walk(sel, path); } await B.move(sel, x, y);
          const r = await act(sel); busy = false;
          if (r === 'cancel') { view.cursor = { x: sel.x, y: sel.y }; pick(sel); return; }
          // horses and wings move again after acting
          if (hasSkill(sel, 'canto') && !B.done && sel.acted) { const used = moves.cost.get(k) || 0, left = sel.stats.mov - used; if (left > 0 && !B.done) { const m2 = F.moves(sel, B.alive, left); if (m2.cost.size) { view.over = { ...sets(), move: new Set([...m2.cost.keys(), sel.y * F.W + sel.x]) }; mode = 'canto'; canto = { u: sel, m: m2 }; return; } } }
          return finish();
        }
        if (u && u.side === 'player' && !u.acted) return pick(u);
        return reset();
      }
      if (mode === 'canto') { const k = y * F.W + x; if (canto.m.cost.has(k) || (x === canto.u.x && y === canto.u.y)) { busy = true; const p = F.path(canto.m, x, y); if (p.length > 1) await view.walk(canto.u, p); canto.u.x = x; canto.u.y = y; await B.fire({ area: [x, y], who: canto.u }); busy = false; } canto = null; return finish(); }
    };
    let canto = null;
    const pos = (e) => { const r = cv.getBoundingClientRect(); return view.toTile(e.clientX - r.left, e.clientY - r.top); };
    const onMove = (e) => { if (e.pointerType !== 'mouse') return; const p = pos(e); if (p.x !== view.cursor.x || p.y !== view.cursor.y) { view.cursor = p; hover(); } };
    let downAt = null; const onDown = (e) => { downAt = { x: e.clientX, y: e.clientY, cam: { ...view.cam }, t: performance.now(), moved: false }; if (e.button === 2) { e.preventDefault(); click(...Object.values(pos(e)), true); downAt = null; } };
    const onDrag = (e) => { if (!downAt || e.pointerType === 'mouse' && !(e.buttons & 1)) return; const dx = e.clientX - downAt.x, dy = e.clientY - downAt.y; if (Math.hypot(dx, dy) > 12) { downAt.moved = true; view.camT = { x: downAt.cam.x - dx / view.TS, y: downAt.cam.y - dy / view.TS }; view.cam = { ...view.camT }; } };
    const onUp = (e) => { if (!downAt) return; const moved = downAt.moved; downAt = null; if (moved) return; const p = pos(e); view.cursor = p; hover(); click(p.x, p.y, false); };
    const onCtx = (e) => e.preventDefault();
    const offKey = ui.onKey((e) => {
      if (busy || document.querySelector('.menu,.sheet,.fc,.talk')) return;
      const c = view.cursor; let moved = false;
      if (e.code === 'ArrowLeft' && c.x > 0) { c.x--; moved = true; } if (e.code === 'ArrowRight' && c.x < F.W - 1) { c.x++; moved = true; } if (e.code === 'ArrowUp' && c.y > 0) { c.y--; moved = true; } if (e.code === 'ArrowDown' && c.y < F.H - 1) { c.y++; moved = true; }
      if (moved) { e.preventDefault(); view.follow(c.x, c.y); hover(); sound.play('tick'); }
      if (['Enter', 'KeyZ', 'Space'].includes(e.code)) { e.preventDefault(); click(c.x, c.y, false); }
      if (['Escape', 'KeyX'].includes(e.code)) click(c.x, c.y, true);
      if (e.code === 'KeyR') { const u = B.at(c.x, c.y); if (u) { busy = true; ui.sheet(u, B).then(() => { busy = false; }); } }
      if (e.code === 'KeyD') { view.dangerOn = !view.dangerOn; view.over = { ...view.over, ...sets() }; if (!view.dangerOn) delete view.over.danger; }
      if (e.code === 'KeyA' || e.code === 'Tab') { e.preventDefault(); const list = B.side('player').filter((u) => !u.acted); if (list.length) { const i = (list.findIndex((u) => u.x === c.x && u.y === c.y) + 1) % list.length; view.cursor = { x: list[i].x, y: list[i].y }; view.follow(list[i].x, list[i].y); hover(); } }
    });
    cv.addEventListener('pointermove', onMove); cv.addEventListener('pointerdown', onDown); addEventListener('pointermove', onDrag); addEventListener('pointerup', onUp); cv.addEventListener('contextmenu', onCtx);
    const cleanup = () => { offKey(); cv.removeEventListener('pointermove', onMove); cv.removeEventListener('pointerdown', onDown); removeEventListener('pointermove', onDrag); removeEventListener('pointerup', onUp); cv.removeEventListener('contextmenu', onCtx); view.over = {}; view.path = null; ui.hover(null, null); };
    window.AO_click = click; // for tests
    reset(); const first = B.side('player').find((u) => u.lord) || B.side('player')[0]; if (first) { view.cursor = { x: first.x, y: first.y }; view.follow(first.x, first.y); } hover();
  });
}
// ---------------------------------------------------------------- the end
async function ending() {
  sound.music('ending');
  const alive = (id) => S.army.some((u) => u.id === id) && !S.dead.includes(id);
  await ui.say(ENDINGS.epilogue(S), { bg: 'dawn' });
  const lines = []; for (const [id, f] of Object.entries(ENDINGS.people)) if (alive(id)) lines.push(['-', `【${CAST[id].name}】${f(S)}`]);
  await ui.say(lines, { bg: 'dawn' });
  await ui.card('完', '灰燼誓約', `遊玩時間 ${Math.floor(S.time / 3600)} 小時 ${Math.floor(S.time / 60) % 60} 分`);
  writeSlot(S.slot, { ...snapshot(), cleared: true, savedAt: Date.now(), chName: '通關' });
}
// play time
setInterval(() => { if (S) S.time += 1; }, 1000);
(async () => { try { cloud = await import('/save.js'); await cloud.pull(GAME, KEY); } catch (e) { cloud = null; } })();
window.AO = { get S() { return S; }, get B() { return B; }, CHAPTERS, ui, view, save, load, play, joinArmy, chapter };
title();
