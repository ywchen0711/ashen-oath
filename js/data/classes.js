// Classes. Stats in the order HP 力量 魔力 技巧 速度 幸運 守備 魔防. base: what a level-1 soldier of the class has;
// grow: growth rates (%) for soldiers of the class; cap: the most a unit can reach; promo: what promotion adds.
// move: inf (on foot), arm (heavy armour), cav (horse / wolf), fly (wings), mtn (climbers), sea (pirates).
// tags make some weapons deal triple damage: armor, cav, fly.
export const STATS = ['hp', 'str', 'mag', 'skl', 'spd', 'lck', 'def', 'res'];
export const STAT_NAME = { hp: 'HP', str: '力量', mag: '魔力', skl: '技巧', spd: '速度', lck: '幸運', def: '守備', res: '魔防', mov: '移動' };
const S = (a) => Object.fromEntries(STATS.map((k, i) => [k, a[i]]));
const C = (name, o) => ({ name, tier: 1, move: 'inf', mov: 5, skills: [], tags: [], promo: S([3, 2, 2, 2, 2, 0, 2, 2]), cap: S([60, 25, 25, 25, 25, 30, 25, 25]), ...o, base: S(o.base), grow: S(o.grow) });
export const CLASSES = {
  // ---- first classes
  sellsword: C('傭劍士', { weapons: ['sword'], base: [18, 5, 1, 6, 7, 5, 4, 1], grow: [75, 45, 10, 50, 55, 45, 30, 20], to: ['oathblade'], look: 'sword', desc: '流浪的劍士，什麼都能做一點。' }),
  princess: C('王女', { weapons: ['sword', 'staff'], base: [16, 3, 4, 5, 7, 7, 2, 5], grow: [65, 35, 40, 45, 55, 60, 20, 40], to: ['queen'], look: 'princess', desc: '王族之女。細劍與治療之杖。' }),
  myrmidon: C('劍士', { weapons: ['sword'], base: [16, 4, 0, 8, 9, 2, 3, 1], grow: [70, 35, 5, 55, 60, 30, 20, 20], to: ['swordmaster', 'assassin'], look: 'myrm', desc: '速度與技巧見長的劍客。' }),
  mercenary: C('傭兵', { weapons: ['sword'], base: [19, 5, 0, 7, 6, 2, 5, 0], grow: [80, 45, 5, 50, 45, 25, 30, 15], to: ['hero', 'swordmaster'], look: 'merc', desc: '為錢而戰的老練劍士。' }),
  fighter: C('鬥士', { weapons: ['axe'], base: [22, 6, 0, 3, 4, 2, 3, 0], grow: [90, 55, 5, 35, 35, 25, 25, 10], to: ['warrior', 'berserker'], look: 'fighter', desc: '用斧頭說話的壯漢。' }),
  brigand: C('山賊', { weapons: ['axe'], move: 'mtn', base: [21, 6, 0, 2, 4, 0, 3, 0], grow: [85, 50, 0, 30, 35, 15, 20, 5], to: ['berserker'], look: 'brigand', desc: '能攀山越嶺的盜匪。' }),
  soldier: C('槍兵', { weapons: ['lance'], base: [20, 5, 0, 4, 4, 2, 5, 0], grow: [80, 40, 0, 40, 35, 25, 35, 10], to: ['halberdier', 'general'], look: 'soldier', desc: '軍隊的骨幹。' }),
  knight: C('重甲兵', { weapons: ['lance'], move: 'arm', mov: 4, tags: ['armor'], base: [20, 6, 0, 3, 1, 1, 9, 0], grow: [85, 45, 0, 35, 20, 20, 55, 10], to: ['general', 'greatknight'], look: 'knight', desc: '移動緩慢，守備無比。' }),
  cavalier: C('騎士', { weapons: ['sword', 'lance'], move: 'cav', mov: 7, tags: ['cav'], skills: ['canto'], base: [20, 5, 0, 5, 5, 2, 6, 0], grow: [80, 40, 0, 40, 40, 30, 30, 15], to: ['paladin', 'greatknight'], look: 'cav', desc: '騎馬的戰士，行動後還能再移動。' }),
  archer: C('弓手', { weapons: ['bow'], base: [18, 5, 0, 6, 5, 2, 4, 1], grow: [75, 40, 0, 50, 40, 30, 20, 15], to: ['sniper', 'ranger'], look: 'archer', desc: '只能遠距離攻擊，對飛行兵有三倍傷害。' }),
  gull: C('海鷗騎士', { weapons: ['lance'], move: 'fly', mov: 7, tags: ['fly'], skills: ['canto'], base: [15, 3, 2, 6, 8, 5, 3, 7], grow: [65, 35, 15, 45, 60, 45, 15, 45], to: ['gulllord', 'stormrider'], look: 'gull', desc: '騎乘巨鷗翱翔，怕弓箭與風魔法。' }),
  wyvern: C('飛龍騎士', { weapons: ['axe', 'lance'], move: 'fly', mov: 7, tags: ['fly'], skills: ['canto'], base: [20, 7, 0, 4, 4, 1, 8, 0], grow: [80, 50, 0, 35, 30, 20, 40, 5], to: ['wyvernlord'], look: 'wyvern', desc: '堅硬而強壯的飛行兵，魔防低落。' }),
  mage: C('魔道士', { weapons: ['anima'], base: [16, 1, 5, 4, 4, 2, 2, 4], grow: [60, 10, 55, 40, 40, 25, 15, 40], to: ['sage', 'spellblade'], look: 'mage', desc: '操縱火、雷、風的理魔法。' }),
  cleric: C('修士', { weapons: ['staff'], base: [16, 0, 4, 3, 5, 5, 1, 6], grow: [55, 5, 50, 35, 45, 50, 10, 55], to: ['bishop', 'valkyrie'], look: 'cleric', desc: '用杖治療同伴，自己不能攻擊。' }),
  monk: C('祭司', { weapons: ['light'], base: [16, 1, 4, 5, 5, 3, 2, 5], grow: [60, 10, 45, 45, 45, 35, 15, 45], to: ['bishop'], look: 'monk', desc: '光魔法的修行者。' }),
  shaman: C('咒術士', { weapons: ['dark'], base: [17, 1, 5, 3, 3, 1, 3, 4], grow: [65, 10, 55, 35, 30, 15, 20, 35], to: ['druid'], look: 'shaman', desc: '禁忌的闇魔法。' }),
  thief: C('盜賊', { weapons: ['sword'], mov: 6, skills: ['steal', 'lockpick', 'pass'], base: [16, 3, 0, 3, 9, 4, 2, 1], grow: [60, 25, 5, 40, 65, 45, 15, 20], to: ['assassin', 'rogue'], look: 'thief', desc: '開鎖、偷竊、穿過敵陣。' }),
  bard: C('詩人', { weapons: [], skills: ['sing'], base: [14, 1, 1, 2, 7, 6, 1, 3], grow: [55, 15, 15, 30, 55, 55, 10, 30], to: [], look: 'bard', desc: '歌聲讓已行動的同伴再動一次。' }),
  wolfrider: C('霜狼騎', { weapons: ['lance', 'axe'], move: 'cav', mov: 7, tags: ['cav'], skills: ['canto', 'snowstride'], base: [19, 5, 0, 5, 6, 2, 5, 1], grow: [80, 45, 0, 40, 45, 25, 25, 15], to: ['wolfking'], look: 'wolf', desc: '騎著霜狼，雪地如履平地。' }),
  pirate: C('海盜', { weapons: ['axe'], move: 'sea', base: [21, 6, 0, 3, 5, 1, 3, 0], grow: [85, 50, 0, 30, 40, 15, 20, 5], to: ['berserker'], look: 'pirate', desc: '能在淺海中行動的匪徒。' }),
  // ---- promoted
  oathblade: C('誓約劍士', { tier: 2, weapons: ['sword', 'lance'], mov: 6, skills: ['oath'], base: [24, 8, 2, 10, 11, 7, 7, 4], grow: [75, 45, 10, 50, 55, 45, 30, 20], promo: S([4, 2, 1, 2, 2, 0, 3, 3]), cap: S([60, 27, 22, 29, 29, 30, 26, 24]), look: 'oath', desc: '不向聖火、只向同伴立誓的劍士。' }),
  queen: C('女王', { tier: 2, weapons: ['sword', 'staff', 'light'], mov: 6, base: [21, 5, 8, 8, 10, 10, 5, 9], grow: [65, 35, 40, 45, 55, 60, 20, 40], promo: S([4, 2, 3, 2, 2, 0, 2, 3]), cap: S([60, 24, 27, 27, 28, 30, 23, 28]), look: 'queen', desc: '劍、杖與光。' }),
  swordmaster: C('劍聖', { tier: 2, weapons: ['sword'], mov: 6, skills: ['crit15'], base: [22, 7, 2, 12, 13, 4, 5, 3], grow: [70, 35, 5, 55, 60, 30, 20, 20], cap: S([60, 24, 22, 29, 30, 30, 22, 23]), look: 'sm', desc: '必殺率 +15。' }),
  assassin: C('刺客', { tier: 2, weapons: ['sword'], mov: 6, skills: ['pass', 'lockpick', 'silent'], base: [21, 7, 0, 11, 13, 4, 5, 3], grow: [65, 35, 5, 50, 65, 40, 15, 20], cap: S([60, 24, 20, 29, 30, 30, 22, 23]), look: 'assassin', desc: '必殺一擊有機會直接致死。' }),
  hero: C('英雄', { tier: 2, weapons: ['sword', 'axe'], mov: 6, base: [25, 8, 1, 10, 9, 3, 8, 2], grow: [80, 45, 5, 50, 45, 25, 30, 15], cap: S([60, 26, 22, 28, 26, 30, 25, 23]), look: 'hero', desc: '劍與斧的大師。' }),
  warrior: C('戰士', { tier: 2, weapons: ['axe', 'bow'], mov: 6, base: [28, 10, 0, 6, 7, 3, 6, 1], grow: [90, 55, 5, 35, 35, 25, 25, 10], cap: S([60, 30, 20, 26, 24, 30, 24, 20]), look: 'warrior', desc: '斧與弓。' }),
  berserker: C('狂戰士', { tier: 2, weapons: ['axe'], move: 'mtn', mov: 6, skills: ['crit15'], base: [27, 11, 0, 6, 8, 1, 5, 0], grow: [90, 55, 0, 30, 40, 15, 20, 5], cap: S([60, 30, 20, 26, 26, 30, 22, 20]), look: 'berserker', desc: '必殺率 +15，能翻山越海。' }),
  halberdier: C('鐵戟兵', { tier: 2, weapons: ['lance'], mov: 6, skills: ['brace'], base: [25, 8, 0, 8, 7, 3, 9, 2], grow: [80, 40, 0, 40, 35, 25, 35, 10], cap: S([60, 26, 20, 28, 26, 30, 27, 22]), look: 'halberd', desc: '面對騎兵時守備 +5。' }),
  general: C('將軍', { tier: 2, weapons: ['lance', 'axe'], move: 'arm', mov: 5, tags: ['armor'], skills: ['guard'], base: [28, 9, 0, 6, 3, 2, 13, 3], grow: [85, 45, 0, 35, 20, 20, 55, 10], cap: S([60, 29, 20, 27, 22, 30, 30, 25]), look: 'general', desc: '鄰接的同伴守備 +2。' }),
  greatknight: C('大騎士', { tier: 2, weapons: ['sword', 'lance', 'axe'], move: 'cav', mov: 6, tags: ['armor', 'cav'], skills: ['canto'], base: [27, 9, 0, 6, 5, 2, 11, 2], grow: [85, 45, 0, 35, 25, 25, 45, 10], cap: S([60, 28, 20, 26, 24, 30, 29, 23]), look: 'gk', desc: '穿著重甲騎馬的騎士。' }),
  paladin: C('聖騎士', { tier: 2, weapons: ['sword', 'lance'], move: 'cav', mov: 8, tags: ['cav'], skills: ['canto'], base: [25, 8, 1, 8, 8, 4, 8, 4], grow: [80, 40, 0, 40, 40, 30, 30, 15], cap: S([60, 25, 22, 26, 25, 30, 25, 25]), look: 'paladin', desc: '騎士的頂點。' }),
  sniper: C('狙擊手', { tier: 2, weapons: ['bow'], mov: 6, skills: ['longshot'], base: [23, 8, 0, 11, 9, 3, 7, 3], grow: [75, 40, 0, 50, 40, 30, 20, 15], cap: S([60, 26, 20, 30, 27, 30, 24, 23]), look: 'sniper', desc: '弓的射程 +1。' }),
  ranger: C('弓騎兵', { tier: 2, weapons: ['bow', 'sword'], move: 'cav', mov: 8, tags: ['cav'], skills: ['canto'], base: [23, 7, 0, 9, 10, 4, 6, 3], grow: [75, 40, 0, 50, 45, 30, 20, 15], cap: S([60, 24, 20, 28, 28, 30, 22, 23]), look: 'ranger', desc: '騎馬的弓手。' }),
  gulllord: C('海鷗將', { tier: 2, weapons: ['lance', 'sword'], move: 'fly', mov: 8, tags: ['fly'], skills: ['canto'], base: [20, 6, 3, 9, 12, 6, 6, 9], grow: [65, 35, 15, 45, 60, 45, 15, 45], cap: S([60, 24, 23, 27, 29, 30, 22, 28]), look: 'gulllord', desc: '迅捷的天空騎士。' }),
  stormrider: C('風暴騎士', { tier: 2, weapons: ['lance', 'anima'], move: 'fly', mov: 7, tags: ['fly'], skills: ['canto'], base: [19, 5, 6, 8, 11, 6, 5, 10], grow: [65, 30, 35, 45, 55, 45, 15, 45], cap: S([60, 23, 26, 26, 28, 30, 21, 29]), look: 'storm', desc: '槍與風雷的天空騎士。' }),
  wyvernlord: C('龍騎將', { tier: 2, weapons: ['axe', 'lance'], move: 'fly', mov: 8, tags: ['fly'], skills: ['canto'], base: [27, 10, 0, 7, 7, 2, 11, 2], grow: [80, 50, 0, 35, 30, 20, 40, 5], cap: S([60, 28, 20, 26, 24, 30, 28, 20]), look: 'wyvernlord', desc: '天空的霸主。' }),
  sage: C('賢者', { tier: 2, weapons: ['anima', 'staff'], mov: 6, base: [21, 3, 9, 7, 7, 3, 5, 7], grow: [60, 10, 55, 40, 40, 25, 15, 40], cap: S([60, 20, 29, 27, 25, 30, 22, 27]), look: 'sage', desc: '理魔法與杖。' }),
  spellblade: C('魔劍士', { tier: 2, weapons: ['anima', 'sword'], mov: 6, base: [22, 6, 7, 8, 8, 3, 6, 5], grow: [65, 30, 45, 45, 45, 25, 20, 30], cap: S([60, 25, 26, 27, 27, 30, 23, 25]), look: 'spellblade', desc: '劍與魔法。' }),
  bishop: C('主教', { tier: 2, weapons: ['staff', 'light'], mov: 6, skills: ['slayer'], base: [20, 2, 8, 6, 7, 6, 4, 9], grow: [55, 5, 50, 40, 45, 50, 10, 55], cap: S([60, 20, 27, 26, 25, 30, 21, 30]), look: 'bishop', desc: '光與杖，對影誓者有特效。' }),
  valkyrie: C('女武神', { tier: 2, weapons: ['staff', 'anima'], move: 'cav', mov: 8, tags: ['cav'], skills: ['canto'], base: [20, 1, 7, 6, 8, 7, 4, 9], grow: [55, 5, 50, 35, 45, 50, 10, 55], cap: S([60, 20, 26, 25, 26, 30, 21, 29]), look: 'valkyrie', desc: '騎馬的治療者。' }),
  druid: C('咒術師', { tier: 2, weapons: ['dark', 'staff'], mov: 6, base: [22, 2, 9, 6, 6, 2, 6, 7], grow: [65, 10, 55, 35, 30, 15, 20, 35], cap: S([60, 20, 29, 26, 25, 30, 23, 27]), look: 'druid', desc: '闇魔法與杖。' }),
  rogue: C('遊俠', { tier: 2, weapons: ['sword', 'bow'], mov: 7, skills: ['steal', 'lockpick', 'pass'], base: [21, 6, 0, 8, 12, 6, 5, 3], grow: [60, 30, 5, 45, 60, 45, 15, 20], cap: S([60, 23, 20, 28, 30, 30, 22, 23]), look: 'rogue', desc: '劍與弓、偷竊與開鎖。' }),
  wolfking: C('狼王', { tier: 2, weapons: ['lance', 'axe'], move: 'cav', mov: 8, tags: ['cav'], skills: ['canto', 'snowstride'], base: [25, 9, 0, 8, 9, 3, 8, 3], grow: [80, 45, 0, 40, 45, 25, 25, 15], cap: S([60, 27, 20, 26, 27, 30, 24, 23]), look: 'wolfking', desc: '霜原的戰王。' }),
  // ---- one of a kind
  saint: C('聖女', { tier: 2, weapons: ['light', 'staff'], mov: 6, skills: ['slayer', 'miracle'], base: [19, 1, 9, 6, 8, 10, 3, 11], grow: [55, 5, 60, 40, 45, 70, 10, 60], cap: S([60, 20, 30, 26, 26, 30, 20, 30]), look: 'saint', desc: '教會的「破曉之子」。' }),
  darkknight: C('暗騎士', { tier: 2, weapons: ['sword', 'dark'], move: 'cav', mov: 7, tags: ['cav'], skills: ['canto'], base: [27, 10, 9, 10, 9, 4, 9, 8], grow: [70, 40, 35, 40, 35, 20, 30, 30], cap: S([60, 26, 26, 27, 25, 30, 26, 26]), look: 'darkknight', desc: '白面伯爵。' }),
  strategist: C('謀士', { tier: 2, weapons: ['anima', 'staff'], mov: 5, skills: ['tactics'], base: [22, 2, 10, 11, 7, 6, 4, 9], grow: [55, 5, 50, 55, 35, 40, 15, 45], cap: S([60, 20, 28, 30, 25, 30, 21, 28]), look: 'strategist', desc: '全軍命中 +5、迴避 +5。' }),
  inquisitor: C('審判官', { tier: 2, weapons: ['lance', 'light'], move: 'cav', mov: 7, tags: ['cav'], skills: ['canto', 'slayer'], base: [30, 11, 6, 10, 9, 4, 10, 8], grow: [80, 45, 25, 40, 35, 20, 35, 30], cap: S([60, 27, 24, 27, 26, 30, 27, 26]), look: 'inquisitor', desc: '教會的追獵者。' }),
  regent: C('攝政王', { tier: 2, weapons: ['sword', 'lance'], move: 'arm', mov: 5, tags: ['armor'], base: [34, 12, 3, 11, 7, 6, 13, 7], grow: [80, 45, 10, 40, 30, 30, 45, 25], cap: S([60, 28, 22, 28, 25, 30, 30, 26]), look: 'regent', desc: '' }),
  archbishop: C('大主教', { tier: 2, weapons: ['light', 'staff'], mov: 5, skills: ['ember'], base: [42, 4, 15, 13, 9, 10, 9, 15], grow: [70, 10, 50, 40, 30, 40, 30, 50], cap: S([80, 22, 30, 28, 26, 30, 26, 30]), look: 'archbishop', desc: '' }),
};
// what each of these does in a fight or on the map
export const SKILLS = {
  canto: { name: '再移動', desc: '行動後可以用剩下的移動力再走。' },
  steal: { name: '偷竊', desc: '偷走速度不比自己快的敵人身上的道具（不能偷裝備中的武器）。' },
  lockpick: { name: '開鎖', desc: '不用鑰匙就能打開門和寶箱。' },
  pass: { name: '穿越', desc: '可以穿過敵人所在的格子。' },
  sing: { name: '歌唱', desc: '讓鄰接已行動的同伴再行動一次。' },
  crit15: { name: '必殺', desc: '必殺率 +15。' },
  silent: { name: '致命', desc: '必殺時有一半機會直接擊倒對手（頭目除外）。' },
  brace: { name: '拒馬', desc: '面對騎兵時守備 +5。' },
  guard: { name: '守護', desc: '鄰接的同伴守備 +2。' },
  longshot: { name: '遠射', desc: '弓的射程 +1。' },
  slayer: { name: '破誓', desc: '對影誓者造成三倍傷害。' },
  miracle: { name: '奇蹟', desc: 'HP 一半以上時，致命一擊會留下 1 點 HP（每章一次）。' },
  snowstride: { name: '踏雪', desc: '在雪原和冰河上移動消耗為 1。' },
  tactics: { name: '軍略', desc: '出擊中時全軍命中與迴避 +5。' },
  oath: { name: '同誓', desc: '鄰接同伴時命中、迴避 +10。' },
  ember: { name: '聖火', desc: '每回合回復 10 HP。' },
};
