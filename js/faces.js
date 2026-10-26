// A face for everyone: named people have their own portrait; the rank and file get one made up from their class,
// their side's colours and a number taken from the unit, so the same soldier keeps the same face all battle long.
import { CAST } from './data/cast.js';
import { CLASSES } from './data/classes.js';
import { TEAM } from './tiles.js';

const SKIN = ['#f2cdb0', '#e8bc98', '#d8a880', '#f6dcc4', '#c89470'];
const HC = ['#3a2a1a', '#5a3a20', '#8a5a2a', '#2a2426', '#a87a3a', '#6a4a3a', '#1a1a20', '#7a3a24', '#9a9aa0'];
const EC = ['#4a6a9a', '#5a4a3a', '#3a7a5a', '#6a4a2a', '#5a5a7a', '#7a3a2a'];
// by class look: outfit, hair styles to choose from, whether women serve in it, extras
const KIT = {
  sword: { out: 'merc', hair: ['messy', 'short', 'spiky'] }, myrm: { out: 'xuan', hair: ['tied', 'bob', 'short'], f: 0.4 }, merc: { out: 'merc', hair: ['short', 'scruffy', 'tailm'], rough: 1 },
  hero: { out: 'merc', hair: ['short', 'messy', 'long'] }, sm: { out: 'xuan', hair: ['tied', 'long', 'tailm'], f: 0.3 }, assassin: { out: 'assassin', hair: ['hood'], f: 0.3 },
  fighter: { out: 'bare', hair: ['wild', 'buzz', 'bandana'], rough: 2 }, brigand: { out: 'bare', hair: ['wild', 'bald', 'bandana', 'buzz'], rough: 3 }, berserker: { out: 'fur', hair: ['wild', 'viking'], rough: 3 },
  pirate: { out: 'outlaw', hair: ['bandana', 'scruffy'], rough: 3 }, warrior: { out: 'fur', hair: ['short', 'viking', 'buzz'], rough: 2 },
  soldier: { out: 'armor', hair: ['helm'] }, halberd: { out: 'armor', hair: ['helm'] }, knight: { out: 'armor', hair: ['helm'] }, general: { out: 'armor', hair: ['helm', 'short'], rough: 1 },
  cav: { out: 'armorlite', hair: ['short', 'messy', 'slick'] }, paladin: { out: 'armorlite', hair: ['short', 'flow'], f: 0.3 }, gk: { out: 'armor', hair: ['helm'] }, ranger: { out: 'hunter', hair: ['short', 'pony'], f: 0.4 },
  archer: { out: 'hunter', hair: ['short', 'messy', 'pony'], f: 0.3 }, sniper: { out: 'hunter', hair: ['short', 'tied'], f: 0.3 },
  gull: { out: 'flight', hair: ['shortf', 'pony', 'twin'], f: 1 }, gulllord: { out: 'flight', hair: ['shortf', 'long'], f: 1 }, storm: { out: 'flight', hair: ['long', 'shortf'], f: 1 },
  wyvern: { out: 'merc', hair: ['helm', 'short'], rough: 1 }, wyvernlord: { out: 'armor', hair: ['helm', 'slick'] },
  mage: { out: 'robe', hair: ['scruffy', 'short', 'long'], f: 0.4 }, sage: { out: 'robe', hair: ['long', 'flow'], f: 0.3, old: 1 }, spellblade: { out: 'coat', hair: ['messy', 'tied'], f: 0.3 },
  cleric: { out: 'nun', hair: ['veil'], f: 1 }, bishop: { out: 'holy', hair: ['short', 'slick'], old: 1 }, monk: { out: 'robe', hair: ['short', 'curly'] }, saint: { out: 'holy', hair: ['longf'], f: 1 },
  shaman: { out: 'shaman', hair: ['hood', 'long'], f: 0.3 }, druid: { out: 'shaman', hair: ['hood', 'oldf'], old: 1 },
  thief: { out: 'hood', hair: ['hood', 'scruffy'], f: 0.2, rough: 1 }, rogue: { out: 'outlaw', hair: ['scruffy', 'tailm'], f: 0.3 },
  wolf: { out: 'fur', hair: ['braids', 'wild'], f: 0.5 }, wolfking: { out: 'fur', hair: ['viking', 'braids'] },
  darkknight: { out: 'count', hair: ['helm'] }, inquisitor: { out: 'inquis', hair: ['slick'], old: 1 }, regent: { out: 'royal', hair: ['slick'], old: 1 }, archbishop: { out: 'holy', hair: ['veil'], f: 1, old: 1 },
  princess: { out: 'gown', hair: ['crown', 'long'], f: 1 }, queen: { out: 'gown', hair: ['crown'], f: 1 }, valkyrie: { out: 'armorlite', hair: ['long', 'pony'], f: 1 }, bard: { out: 'actor', hair: ['flow'] }, strategist: { out: 'scholar', hair: ['tied'] },
};
const FEM = { messy: 'long', short: 'shortf', spiky: 'pony', scruffy: 'bob', wild: 'braids', buzz: 'shortf', bandana: 'long', tailm: 'pony', slick: 'bun', helm: 'helm', bald: 'long', viking: 'braids', curly: 'bob', hood: 'hood', tied: 'tied', flow: 'flow', oldf: 'oldf', veil: 'veil' };
const CACHE = new Map();
export function faceOf(u) {
  if (u.id && CAST[u.id] && CAST[u.id].p) return CAST[u.id].p;
  if (u.portrait) return u.portrait;
  const key = (u.uid || '') + u.cls + u.side; if (CACHE.has(key)) return CACHE.get(key);
  let h = [...key].reduce((s, ch) => Math.imul(s ^ ch.charCodeAt(0), 16777619) >>> 0, 2166136261); const r = (n) => { h = Math.imul(h ^ (h >>> 13), 2246822507) >>> 0; return h % n; };
  const look = CLASSES[u.cls].look, K = KIT[look] || KIT.sword, T = TEAM[u.side] || TEAM.enemy;
  const f = r(100) < (K.f || 0) * 100, age = K.old ? 40 + r(25) : 18 + r(22);
  let hair = K.hair[r(K.hair.length)]; if (f) hair = FEM[hair] || 'long';
  const rough = (K.rough || 0) + (u.side === 'enemy' ? 1 : 0);
  const p = { g: f ? 'f' : 'm', age, skin: SKIN[r(SKIN.length)], hair, hc: age > 50 && r(2) ? '#b8b8b8' : HC[r(HC.length)], eye: f ? ['pretty', 'cat', 'soft', 'sharp'][r(4)] : rough > 2 ? ['wild', 'sharp', 'stern'][r(3)] : ['sharp', 'stern', 'round', 'calm', 'cold'][r(5)], ec: EC[r(EC.length)], out: K.out, oc: T[1], ac: T[2] };
  if (!f && rough >= 2) { const k = r(6); if (k < 2) p.stubble = 1; else if (k < 4) p.beard = p.hc; if (r(3) === 0) p.scar = ['cheek', 'brow', 'chin', 'eye'][r(4)]; if (r(5) === 0) p.patch = 1; }
  if (hair === 'bandana') p.ac = T[0];
  if (u.boss && !f && !p.beard && r(2)) p.beard = p.hc;
  CACHE.set(key, p); return p;
}
