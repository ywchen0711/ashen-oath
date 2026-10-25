// Weapons, staves and other things to carry. Each weapon wears out (uses). mt: might, hit, crit, wt: weight
// (slows those not strong enough), rng: [min, max] range, eff: tags it deals triple damage to, price per full item.
// The triangles: sword beats axe beats lance beats sword; anima beats light beats dark beats anima.
const W = (name, type, uses, mt, hit, crit, wt, rng, price, o = {}) => ({ name, type, uses, mt, hit, crit, wt, rng, price, kind: 'weapon', ...o });
const ST = (name, uses, price, o) => ({ name, type: 'staff', uses, price, kind: 'staff', wt: 3, ...o });
const IT = (name, uses, price, o) => ({ name, uses, price, kind: 'item', ...o });
export const ITEMS = {
  // ---- swords
  ironSword: W('鐵劍', 'sword', 46, 5, 90, 0, 5, [1, 1], 460),
  slimSword: W('細劍', 'sword', 30, 3, 100, 5, 2, [1, 1], 480),
  rapier: W('王家細劍', 'sword', 40, 7, 95, 10, 4, [1, 1], 0, { eff: ['armor', 'cav'], only: ['ashelia'], desc: '對重甲與騎兵特效。艾希莉亞專用。' }),
  steelSword: W('鋼劍', 'sword', 30, 8, 75, 0, 10, [1, 1], 600),
  silverSword: W('銀劍', 'sword', 20, 13, 80, 0, 8, [1, 1], 1500),
  killingEdge: W('殺劍', 'sword', 20, 9, 75, 30, 7, [1, 1], 1300),
  armorslayer: W('斬甲劍', 'sword', 18, 8, 80, 0, 11, [1, 1], 1260, { eff: ['armor'] }),
  windSword: W('風之劍', 'sword', 25, 9, 75, 0, 9, [1, 2], 1600, { magic: 1, desc: '可以遠距離攻擊，以魔力計算傷害。' }),
  ravenEdge: W('灰鴉', 'sword', 45, 9, 90, 10, 6, [1, 1], 0, { only: ['lian'], desc: '父親留下的劍。黎恩專用。' }),
  emberOath: W('誓火', 'sword', 99, 15, 90, 15, 7, [1, 2], 0, { only: ['lian'], eff: ['oathbound'], desc: '用同伴的誓言重鑄的劍。' }),
  wolfFang: W('霜牙', 'sword', 30, 11, 85, 20, 6, [1, 1], 0, { only: ['chiya'], desc: '玄國名刀。' }),
  // ---- lances
  ironLance: W('鐵槍', 'lance', 45, 7, 80, 0, 8, [1, 1], 360),
  slimLance: W('細槍', 'lance', 30, 4, 85, 5, 4, [1, 1], 450),
  steelLance: W('鋼槍', 'lance', 30, 10, 70, 0, 13, [1, 1], 480),
  silverLance: W('銀槍', 'lance', 20, 14, 75, 0, 10, [1, 1], 1200),
  javelin: W('標槍', 'lance', 20, 6, 65, 0, 11, [1, 2], 400),
  spear: W('投槍', 'lance', 15, 12, 70, 5, 10, [1, 2], 1500),
  horseslayer: W('斬馬槍', 'lance', 16, 7, 70, 0, 13, [1, 1], 1040, { eff: ['cav'] }),
  killerLance: W('殺槍', 'lance', 20, 10, 70, 30, 9, [1, 1], 1200),
  guanDao: W('青龍偃月', 'lance', 30, 13, 80, 10, 12, [1, 1], 0, { only: ['kalan'], desc: '卡蘭的長柄刀。' }),
  // ---- axes
  ironAxe: W('鐵斧', 'axe', 45, 8, 75, 0, 10, [1, 1], 270),
  steelAxe: W('鋼斧', 'axe', 30, 11, 65, 0, 15, [1, 1], 360),
  silverAxe: W('銀斧', 'axe', 20, 15, 70, 0, 12, [1, 1], 1000),
  handAxe: W('手斧', 'axe', 20, 7, 60, 0, 9, [1, 2], 300),
  tomahawk: W('戰斧', 'axe', 15, 13, 65, 0, 14, [1, 2], 1500),
  hammer: W('戰鎚', 'axe', 20, 10, 55, 0, 15, [1, 1], 800, { eff: ['armor'] }),
  killerAxe: W('殺斧', 'axe', 20, 11, 65, 30, 11, [1, 1], 1000),
  serpentSpear: W('蛇矛', 'lance', 30, 12, 75, 15, 11, [1, 1], 0, { only: ['bart'], desc: '巴爾特的丈八蛇矛（他堅持說是斧）。' }),
  // ---- bows
  ironBow: W('鐵弓', 'bow', 45, 6, 85, 0, 5, [2, 2], 540, { eff: ['fly'] }),
  steelBow: W('鋼弓', 'bow', 30, 9, 70, 0, 9, [2, 2], 720, { eff: ['fly'] }),
  silverBow: W('銀弓', 'bow', 20, 13, 75, 0, 6, [2, 2], 1600, { eff: ['fly'] }),
  killerBow: W('殺弓', 'bow', 20, 9, 75, 30, 7, [2, 2], 1400, { eff: ['fly'] }),
  longbow: W('長弓', 'bow', 20, 5, 65, 0, 10, [2, 3], 2000, { eff: ['fly'] }),
  huntersBow: W('獵人之弓', 'bow', 40, 8, 90, 10, 5, [2, 2], 0, { eff: ['fly'], only: ['mira'], desc: '米拉父親的弓。' }),
  // ---- anima
  fire: W('火球', 'anima', 40, 5, 90, 0, 4, [1, 2], 560, { magic: 1 }),
  thunder: W('雷擊', 'anima', 35, 8, 80, 5, 6, [1, 2], 700, { magic: 1 }),
  wind: W('風刃', 'anima', 40, 4, 100, 0, 3, [1, 2], 600, { magic: 1, eff: ['fly'] }),
  elfire: W('爆炎', 'anima', 30, 10, 85, 0, 10, [1, 2], 1200, { magic: 1 }),
  bolting: W('雷霆', 'anima', 5, 12, 60, 0, 20, [3, 10], 2500, { magic: 1, siege: 1 }),
  crane: W('鶴羽扇', 'anima', 40, 10, 95, 10, 4, [1, 2], 0, { magic: 1, eff: ['fly'], only: ['situ'], desc: '司徒鶴的羽扇，起風。' }),
  // ---- light
  lightning: W('光', 'light', 35, 4, 95, 5, 6, [1, 2], 630, { magic: 1, eff: ['oathbound'] }),
  shine: W('閃光', 'light', 30, 7, 85, 8, 8, [1, 2], 900, { magic: 1, eff: ['oathbound'] }),
  divine: W('聖光', 'light', 25, 10, 85, 10, 12, [1, 2], 1500, { magic: 1, eff: ['oathbound'] }),
  dawn: W('破曉', 'light', 30, 14, 90, 10, 8, [1, 2], 0, { magic: 1, eff: ['oathbound'], only: ['lia'], desc: '莉雅的光。' }),
  // ---- dark
  flux: W('暗', 'dark', 45, 7, 80, 0, 8, [1, 2], 680, { magic: 1 }),
  nosferatu: W('吸魂', 'dark', 20, 10, 70, 0, 14, [1, 2], 2000, { magic: 1, drain: 1, desc: '回復造成傷害的 HP。' }),
  whiteVeil: W('白幕', 'dark', 30, 13, 85, 5, 9, [1, 2], 0, { magic: 1, drain: 1, only: ['sion'], desc: '伯爵十四年的黑暗。' }),
  // ---- staves (heal: base + magic)
  heal: ST('治療', 30, 600, { heal: 10, rng: [1, 1] }),
  mend: ST('痊癒', 20, 1000, { heal: 20, rng: [1, 1] }),
  recover: ST('恢復', 15, 2250, { heal: 99, rng: [1, 1] }),
  physic: ST('遠療', 15, 3750, { heal: 10, rng: [1, 'mag'] }),
  restore: ST('淨化', 10, 2000, { cure: 1, rng: [1, 1], desc: '解除狀態異常。' }),
  sleep: ST('睡眠', 3, 0, { status: 'sleep', rng: [1, 'mag'], desc: '讓敵人睡著三回合（無法行動）。' }),
  silence: ST('沉默', 3, 0, { status: 'silence', rng: [1, 'mag'], desc: '讓敵人無法使用魔法三回合。' }),
  barrier: ST('守護', 15, 1500, { buff: 'res', rng: [1, 1], desc: '魔防 +7，持續數回合。' }),
  warp: ST('傳送', 5, 0, { warp: 1, rng: [1, 1], desc: '把同伴送到遠處。' }),
  rescueSt: ST('救出', 3, 0, { pull: 1, rng: [1, 'mag'], desc: '把遠處的同伴拉到身邊。' }),
  torch: ST('照明', 10, 1000, { torch: 1, rng: [0, 0], desc: '在霧中照亮周圍。' }),
  // ---- things
  vulnerary: IT('傷藥', 3, 300, { use: 'heal', amt: 10 }),
  elixir: IT('靈藥', 3, 3000, { use: 'heal', amt: 99 }),
  doorKey: IT('門鑰匙', 1, 50, { use: 'door' }),
  chestKey: IT('寶箱鑰匙', 1, 60, { use: 'chest' }),
  seal: IT('晉升之印', 1, 2500, { use: 'promote', desc: '等級 10 以上可以轉職。' }),
  angelRobe: IT('天使之衣', 1, 0, { use: 'boost', stat: 'hp', amt: 7 }),
  energyRing: IT('力之戒', 1, 0, { use: 'boost', stat: 'str', amt: 2 }),
  spiritDust: IT('魔之粉', 1, 0, { use: 'boost', stat: 'mag', amt: 2 }),
  secretBook: IT('秘傳書', 1, 0, { use: 'boost', stat: 'skl', amt: 2 }),
  speedwing: IT('疾風之羽', 1, 0, { use: 'boost', stat: 'spd', amt: 2 }),
  goddessIcon: IT('女神像', 1, 0, { use: 'boost', stat: 'lck', amt: 2 }),
  dragonShield: IT('龍之盾', 1, 0, { use: 'boost', stat: 'def', amt: 2 }),
  talisman: IT('護符', 1, 0, { use: 'boost', stat: 'res', amt: 2 }),
  bootsItem: IT('飛靴', 1, 0, { use: 'boost', stat: 'mov', amt: 1 }),
  torchItem: IT('火把', 5, 200, { use: 'torch' }),
  goldBag: IT('金袋', 1, 0, { use: 'gold', amt: 3000 }),
};
export const WEAPON_NAME = { sword: '劍', lance: '槍', axe: '斧', bow: '弓', anima: '理', light: '光', dark: '闇', staff: '杖' };
export const TRIANGLE = { sword: 'axe', axe: 'lance', lance: 'sword', anima: 'light', light: 'dark', dark: 'anima' };
// an item in someone's hands: which item, how many uses are left
export const item = (id, uses) => ({ id, uses: uses ?? ITEMS[id].uses });
