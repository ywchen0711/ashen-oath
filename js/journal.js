// The journal: who you have met so far, the story so far chapter by chapter, and the scenes of each finished chapter
// to watch again. Only what has already happened is shown.
import { CAST } from './data/cast.js';
import { CHAPTERS } from './data/story.js';
import { CLASSES } from './data/classes.js';
import { portrait } from './portraits.js';

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
// what each chapter was about, told without giving away what comes after it
export const SYNOPSIS = {
  p: '薩爾凡王國，國王已經七天沒有露面。灰鴉傭兵團——從不立誓的團長黎恩、獵人米拉、鬥士巴爾特與老騎士歐文——接下討伐白石丘山賊「獨眼葛魯」的委託。勝利之後，他們在葛魯身上找到一封蓋著王家火漆的信：有人下令封鎖所有離開王都的消息。',
  c1: '紅狐鎮的旅店裡，一名斗篷少女找上灰鴉。她是王女艾希莉亞，親眼看見父王被戴著攝政王戒指的手下毒。她出五千金，要一個不會對聖火發誓、不會在半夜把她交出去的人，護送她北上投靠父王最信任的騎士。追兵當夜就到了。',
  c2: '北上途經櫻谷，稅吏打著「服喪稅」的名義燒村。艾希莉亞第一次看見叔叔的告示如何落在百姓身上。灰鴉趕走稅吏，在櫻樹下結識了溫柔的修女葛蕾絲，以及重義的遊俠騎士卡蘭。',
  c3: '十年前大火燒毀的聖瓦倫汀修道院，盜墓賊正在翻找一本值一萬金的書。躲在書庫深處的王立書記官艾德溫，抱著那本不該讀的書——《灰燼編年史》被燒掉的殘頁——加入了灰鴉。',
  c4: '鐵橋鎮貼滿通緝囚號四六〇一的告示。扒手提姆偷了巴爾特的錢袋，也帶他們找到了那個逃犯：為一條麵包坐了十九年牢的瓦爾，和他拚命保護的小女孩柯拉。',
  c5: '攝政王的告示比他們先到空谷砦：灰鴉成了「綁架王女、弒君共犯」，賞金一萬。先王的近衛蓋文追上艾希莉亞，發誓保護她到最後一刻。',
  c6: '大雨中的灰河渡口，審判官卡洛斯封鎖了去路，要把四六〇一「依法處置」。艾希莉亞第一次當面質問：所謂的法，是誰定的法？',
  c7: '北境大橋，黑犬傭兵團追到了橋頭。騎兵比他們快，全員過橋之前一定會被追上——老騎士歐文決定一個人留下來，守住橋頭。',
  c8: '進入石牙要塞前，葛蕾絲在所有人面前坦白：她是教會派來的「眼睛」，每一次追兵都是因為她的信。邊境指揮官瓦倫的城門，是開還是關？',
  c9: '越過邊境，來到沒有國王、只有商會的七港聯盟。金錨港燈火通明，首富葛蘭的勢力無所不在；他們要找的神秘「白面伯爵」，據說就藏在這座城市裡。',
  c10: '白崖燈塔，海鷗騎士隊長瑟琳正與海盜紅鬍子對峙，見習騎士菲兒偷偷跟上了戰場。燈塔是給迷路的船看的，不是給海盜收錢的。',
  c11: '白面伯爵的宅邸晚宴。席恩把王女介紹給七港議員，宴席上的笑容底下藏著刀——而葛蘭的名字，從刺客嘴裡說了出來。',
  c12: '臥鶴谷住著玄國隱士司徒鶴，曾以三千兵擋三十萬大軍。三次登門，請他出山。劍客千夜寸步不離地守在他身旁。',
  c13: '七港議會投票決定是否支持王女，七票之中，最後一票落在葛蘭的兒子莫里斯手上。一個相信世界上沒有壞人的年輕人，要對自己的父親投下這一票。',
  c14: '七港與王國交界的蘆葦澤，住著一百零八個被逼上絕路的人。首領雷克斯、黑旋風鐵牛、浪子燕子——「替天行道」的大旗，會為王女而揚起嗎？',
  c15: '黑礁監獄。白面伯爵說出自己的過去：十五年前，他是海軍上尉席恩·瓦雷，因為一封要交給艾德蒙王子的信，被關在這裡十四年。',
  c16: '黑礁外海，葛蘭的船隊擋住了回薩爾凡的航道。十五年前被偷走的那封信、那十四年和那場婚禮，在這片海上算總帳。莫里斯就在船上。',
  c17: '回到霜原邊界，教會的朝聖隊護送「聖女」北上，讓部落首領們在聖火前立誓。馬車裡的白髮少女莉雅，從出生就被說成神的使者。',
  c18: '冰湖營地，柯拉在夜裡被帶走。審判官卡洛斯留下字條：「四六〇一，日出，冰湖北岸，一個人來。」瓦爾決定一個人去。',
  c19: '霜狼族的營地，數百頭白狼盯著這群南方人。三十年前，王國用誓言奪走了他們的土地。族長赫洛夫、他的女兒娜塔與兒子托爾，要南方的王女先通過試煉。',
  c20: '司徒鶴借北風燒了霍克將軍的糧草，三萬大軍從狹窄的狼牙峽撤退。這裡是設伏的地方——也是要決定放不放人的地方。',
  c21: '霜原最北端的冰層之下，烏爾婆婆帶他們走進灰王的墓。壁畫上是《灰燼編年史》被燒掉的真相：三百年前，鐵匠艾許與教會一起點燃了那團火。',
  c22: '回到薩爾凡，黎恩的故鄉灰石村。十年前，叛國者羅蘭的家被燒毀；黎恩埋下的那口空棺材，墓前的雪被挖開了。',
  c23: '王都琉璃城，攝政王宣布三天後舉行「聖火大祭」，全城重新立誓。聖安德烈街的人們搬出桌椅門板，築起了一道街壘。',
  c24: '聖火大祭前夜，白鴿劇團入宮演出奧菲連夜寫成的新戲《王的耳朵》：一位國王午睡時，被弟弟把毒藥倒進了耳朵裡。',
  c25: '攝政王逃進王宮，大法官貝爾特朗下令就地審判所有「叛黨」。白面伯爵卻不見了——大審判廳燃起了大火。十五年前燒掉那封信的人，就在裡面。',
  c26: '琉璃城王宮，攝政王莫德雷帶著最後的近衛退守王座之間。艾希莉亞要親眼看著他，問他為什麼。',
  c27: '加冕前夜，七港的水手、霜狼族的戰士、蘆葦澤的好漢、黑礁的囚犯和聖安德烈街的人們，一千兩百人學會了灰王的歌：「我的心是我自己的。」',
  c28: '大聖堂的石橋上，一個戴著面甲的影誓騎士擋住去路。他臉上的疤，和黎恩臉上的一樣。',
  c29: '大聖堂內殿，樞機卿塞維林在迴廊盡頭等著他們——他稱莉雅為「我做過最好的奇蹟」。要熄滅聖火，得有人付出代價。',
  c30: '聖火之間，四根刻滿名字的石柱圍著一團白金色的火焰。大主教奧蕾莉亞說起她七歲那年，兩個國王為了一條河打仗。',
};
const lineSpeakers = (lines) => (Array.isArray(lines) ? lines : []).filter((l) => Array.isArray(l) && l[0] !== '-').map((l) => String(l[0]).split('|')[0]);
const resolve = (x, S) => { try { return typeof x === 'function' ? x(S, { lost: [], flags: S.flags || {}, units: [] }) : x || []; } catch (e) { return []; } };

export async function journal(ui, S, el) {
  const done = CHAPTERS.slice(0, S.ch + 1), finished = CHAPTERS.slice(0, S.ch);
  // everyone met: those in the army, the fallen, and anyone who has spoken in a scene so far
  const met = new Set([...S.army.map((u) => u.id), ...(S.dead || [])].filter(Boolean));
  for (const ch of done) for (const id of [...lineSpeakers(resolve(ch.intro, S)), ...(finished.includes(ch) ? lineSpeakers(resolve(ch.outro, S)) : [])]) if (CAST[id]) met.add(id);
  let tab = 'people';
  const panel = el('div', 'journal'); ui.root.appendChild(panel);
  return new Promise((resolveP) => {
    const close = () => { off(); panel.remove(); resolveP(); };
    const draw = () => {
      let body = '';
      if (tab === 'people') {
        const ids = Object.keys(CAST).filter((id) => met.has(id)), mine = ids.filter((id) => CAST[id].bases), others = ids.filter((id) => !CAST[id].bases);
        const card = (id) => { const c = CAST[id], u = S.army.find((x) => x.id === id), dead = (S.dead || []).includes(id);
          return `<div class="jc ${dead ? 'dead' : ''}" data-id="${id}"><i></i><div><b>${esc(c.name)}</b>${c.title ? `<small>${esc(c.title)}</small>` : ''}${u ? `<em>${esc(CLASSES[u.cls].name)} Lv${u.lv}</em>` : dead ? '<em class="gone">已離去</em>' : ''}<p>${esc(c.bio || '')}</p></div></div>`; };
        body = `<h4>同伴 <small>${mine.length}</small></h4><div class="jgrid">${mine.map(card).join('')}</div>${others.length ? `<h4>相關人物 <small>${others.length}</small></h4><div class="jgrid">${others.map(card).join('')}</div>` : ''}`;
      } else if (tab === 'story') {
        body = done.map((ch, i) => `<div class="js ${i === S.ch ? 'now' : ''}"><div class="jh"><b>${esc(ch.no)}</b> ${esc(ch.title)} <small>${esc(ch.sub || '')}</small>${i === S.ch ? '<em>進行中</em>' : ''}</div><p>${esc(SYNOPSIS[ch.id] || '')}</p></div>`).join('');
      } else {
        body = finished.length ? finished.map((ch, i) => `<div class="jr"><span><b>${esc(ch.no)}</b> ${esc(ch.title)}</span><span class="sp"></span>${ch.intro ? `<button data-r="${i}" data-w="intro">開場</button>` : ''}${ch.mapIntro ? `<button data-r="${i}" data-w="mapIntro">戰前</button>` : ''}${ch.outro ? `<button data-r="${i}" data-w="outro">結局</button>` : ''}</div>`).join('') : '<p class="jnone">完成第一個章節之後，就能在這裡重看當時的對話。</p>';
      }
      panel.innerHTML = `<div class="jwin"><div class="jtop"><b>紀錄</b><span class="jtabs">${[['people', '人物介紹'], ['story', '劇情大綱'], ['replay', '重要對話']].map(([k, n]) => `<button class="${k === tab ? 'on' : ''}" data-t="${k}">${n}</button>`).join('')}</span><button class="sx">✕</button></div><div class="jbody">${body}</div></div>`;
      panel.querySelectorAll('[data-t]').forEach((b) => b.onclick = () => { tab = b.dataset.t; draw(); });
      panel.querySelector('.sx').onclick = close;
      panel.querySelectorAll('.jc').forEach((d) => { d.querySelector('i').appendChild(portrait(CAST[d.dataset.id].p, '平', 96)); });
      panel.querySelectorAll('[data-r]').forEach((b) => b.onclick = async () => { const ch = finished[+b.dataset.r]; panel.hidden = true; off(); await ui.say(resolve(ch[b.dataset.w], S), { bg: b.dataset.w === 'outro' ? ch.outroBg || ch.bg || 'black' : ch.bg || 'black' }); panel.hidden = false; off = keys(); });
    };
    const keys = () => ui.onKey((e) => { if (['Escape', 'KeyX', 'KeyJ'].includes(e.code)) close(); });
    let off = keys(); draw();
  });
}
