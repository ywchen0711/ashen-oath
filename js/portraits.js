// Portraits: anime-style busts painted with curves and two-tone cel shading, in the manner of the tactics games
// but our own. A portrait is built from its description (hair style and colour, eyes, outfit, extras) and an
// expression: 平 normal, 笑 smile, 喜 grin, 怒 anger, 悲 sorrow, 驚 surprise, 痛 pain, 冷 cold, 羞 shy, 決 resolve,
// 閉 eyes closed, 哭 tears.
const CACHE = new Map();
const INK = '#2a1a1a';
const shade = (hex, k) => { const n = parseInt(hex.slice(1), 16), r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255, f = (v) => Math.max(0, Math.min(255, Math.round(k > 1 ? v + (255 - v) * (k - 1) : v * k))); return `rgb(${f(r)},${f(g)},${f(b)})`; };
const EXPR = { '平': 'n', '笑': 'smile', '喜': 'grin', '怒': 'angry', '悲': 'sad', '驚': 'surprise', '痛': 'pain', '冷': 'cold', '羞': 'shy', '決': 'det', '閉': 'closed', '哭': 'cry' };
export const exprOf = (e) => EXPR[e] || e || 'n';
// hair styles: what's behind the head, the fringe, how much volume on top
const HAIR = {
  messy: { back: 'nape', fringe: 'spiky', vol: 1.08 }, pony: { back: 'pony', fringe: 'side', vol: 1.02 }, wild: { back: 'mane', fringe: 'spiky', vol: 1.18 }, short: { back: 'nape', fringe: 'parted', vol: 1.02 },
  crown: { back: 'long', fringe: 'parted', vol: 1.04, braid: 1 }, long: { back: 'tail', fringe: 'swept', vol: 1.04 }, veil: { back: 'none', fringe: 'parted', vol: 1, veil: 'nun' }, scruffy: { back: 'nape', fringe: 'messy', vol: 1.08 },
  buzz: { back: 'none', fringe: 'buzz', vol: 1.0 }, cap: { back: 'nape', fringe: 'messy', vol: 1.03, cap: 1 }, flow: { back: 'long', fringe: 'swept', vol: 1.06 }, shortf: { back: 'bobshort', fringe: 'side', vol: 1.04 },
  twin: { back: 'twin', fringe: 'straight', vol: 1.04 }, tied: { back: 'tail', fringe: 'parted', vol: 1.02 }, bob: { back: 'bob', fringe: 'straight', vol: 1.04 }, curly: { back: 'nape', fringe: 'curly', vol: 1.1 },
  bandana: { back: 'nape', fringe: 'messy', vol: 1.03, bandana: 1 }, spiky: { back: 'mane', fringe: 'spiky', vol: 1.14 }, tailm: { back: 'tail', fringe: 'spiky', vol: 1.06 }, longwhite: { back: 'long', fringe: 'swept', vol: 1.05 },
  longf: { back: 'long', fringe: 'straight', vol: 1.04 }, braids: { back: 'braids', fringe: 'side', vol: 1.06 }, viking: { back: 'braids', fringe: 'swept', vol: 1.08 }, oldf: { back: 'bun', fringe: 'parted', vol: 1.0 },
  bald: { back: 'none', fringe: 'none', vol: 1.0 }, slick: { back: 'nape', fringe: 'slick', vol: 1.02 }, hood: { back: 'none', fringe: 'messy', vol: 1.0, hood: 1 }, judge: { back: 'wig', fringe: 'none', vol: 1.12 },
  kid: { back: 'bobshort', fringe: 'straight', vol: 1.06 }, helm: { back: 'none', fringe: 'none', vol: 1.0, helm: 1 }, bun: { back: 'bun', fringe: 'parted', vol: 1.02 },
};
const OUT = { coat: 'coat', hunter: 'hood', vest: 'vest', armor: 'armor', gown: 'gown', knightcoat: 'coat', nun: 'nun', robe: 'robe', worker: 'shirt', rags: 'shirt', actor: 'coat', flight: 'armorlite', scholar: 'robe', xuan: 'robe', noble: 'coat', outlaw: 'vest', bare: 'bare', acrobat: 'vest', count: 'coat', merc: 'armorlite', holy: 'robe', fur: 'fur', shaman: 'fur', royal: 'coat', inquis: 'coat', judge: 'robe', pirate: 'coat', assassin: 'hood', dress: 'gown' };

export function portrait(p, expr = 'n', size = 192) {
  const ex = exprOf(expr), key = JSON.stringify(p) + ex + size; if (CACHE.has(key)) return CACHE.get(key);
  const c = document.createElement('canvas'); c.width = c.height = size; const g = c.getContext('2d'); g.scale(size / 192, size / 192); g.translate(96, 112); g.scale(1.22, 1.22); g.translate(-96, -112); g.lineJoin = 'round'; g.lineCap = 'round';
  draw(g, p, ex); CACHE.set(key, c); return c;
}
function path(g, pts, close = true) { g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) { const p = pts[i]; if (p.length === 4) g.quadraticCurveTo(p[0], p[1], p[2], p[3]); else if (p.length === 6) g.bezierCurveTo(p[0], p[1], p[2], p[3], p[4], p[5]); else g.lineTo(p[0], p[1]); } if (close) g.closePath(); }
function fillInk(g, fill, w = 2.2) { g.fillStyle = fill; g.fill(); g.strokeStyle = INK; g.lineWidth = w; g.stroke(); }
function draw(g, p, ex) {
  const H = HAIR[p.hair] || HAIR.short, hc = p.hc || '#5a3a20', skin = p.skin || '#f0c8a8', f = p.g === 'f', old = p.age >= 50, kid = p.age <= 13, big = p.out === 'bare' || p.out === 'fur' || p.hair === 'wild' && !f;
  const cx = 96, cy = 82 + (kid ? 8 : 0), fw = (f ? 34 : 36) * (kid ? 0.95 : 1), fh = f ? 42 : 44;
  // ---- hair behind
  if (!H.helm && !H.hood && H.veil !== 'nun') backHair(g, H, hc, cx, cy, fw, fh, f);
  if (H.hood || p.out === 'hunter' || p.out === 'assassin') { path(g, [[cx - fw - 16, cy + 60], [cx - fw - 18, cy - 10, cx - fw + 4, cy - fh - 16, cx, cy - fh - 18], [cx + fw - 4, cy - fh - 16, cx + fw + 18, cy - 10, cx + fw + 16, cy + 60]]); fillInk(g, shade(p.oc, 0.8)); }
  if (H.veil === 'nun' || p.veil) { path(g, [[cx - fw - 14, cy + 74], [cx - fw - 16, cy - 20, cx - fw, cy - fh - 14, cx, cy - fh - 16], [cx + fw, cy - fh - 14, cx + fw + 16, cy - 20, cx + fw + 14, cy + 74]]); fillInk(g, p.veil ? '#f4f0ec' : '#2a2a34'); }
  // ---- neck and body
  const nw = f ? 12 : 15; path(g, [[cx - nw, cy + 28], [cx - nw, cy + 58], [cx + nw, cy + 58], [cx + nw, cy + 28]]); fillInk(g, skin);
  g.fillStyle = shade(skin, 0.82); g.fillRect(cx - nw + 1, cy + 30, nw * 2 - 2, 7);
  if (p.brand) { g.fillStyle = '#7a3a2a'; g.font = 'bold 8px serif'; g.fillText('4601', cx - 9, cy + 46); }
  body(g, p, OUT[p.out] || 'shirt', cx, cy, f, big);
  // ---- the face
  const jaw = f || kid ? 0.9 : 1;
  path(g, [[cx - fw, cy - 14], [cx - fw - 1, cy + 8, cx - fw * 0.75, cy + 22 * jaw], [cx - 10, cy + 36 * jaw, cx, cy + 40 * jaw], [cx + 10, cy + 36 * jaw, cx + fw * 0.75, cy + 22 * jaw], [cx + fw + 1, cy + 8, cx + fw, cy - 14], [cx + fw, cy - fh - 4, cx, cy - fh - 6], [cx - fw, cy - fh - 4, cx - fw, cy - 14]]); fillInk(g, skin);
  for (const sd of [-1, 1]) { path(g, [[cx + sd * (fw - 1), cy - 4], [cx + sd * (fw + 5), cy - 6, cx + sd * (fw + 5), cy + 4], [cx + sd * (fw + 4), cy + 11, cx + sd * (fw - 1), cy + 11]]); fillInk(g, skin, 1.8); g.strokeStyle = shade(skin, 0.7); g.lineWidth = 1.2; g.beginPath(); g.moveTo(cx + sd * (fw + 1), cy - 1); g.quadraticCurveTo(cx + sd * (fw + 3), cy + 3, cx + sd * (fw + 1), cy + 7); g.stroke(); }
  // shadow under the fringe and down one side
  g.save(); path(g, [[cx - fw, cy - 14], [cx - fw - 1, cy + 8, cx - fw * 0.75, cy + 22 * jaw], [cx - 10, cy + 36 * jaw, cx, cy + 40 * jaw], [cx + 10, cy + 36 * jaw, cx + fw * 0.75, cy + 22 * jaw], [cx + fw + 1, cy + 8, cx + fw, cy - 14], [cx + fw, cy - fh - 4, cx, cy - fh - 6], [cx - fw, cy - fh - 4, cx - fw, cy - 14]]); g.clip();
  g.fillStyle = shade(skin, 0.85); g.fillRect(cx - fw - 4, cy - fh - 8, fw * 2 + 8, H.fringe === 'none' || H.fringe === 'buzz' || H.fringe === 'slick' ? 6 : 20); path(g, [[cx + fw * 0.78, cy - 12], [cx + fw + 4, cy - 12], [cx + fw + 4, cy + 24], [cx + 8, cy + 44], [cx + fw * 0.55, cy + 22, cx + fw * 0.82, cy + 4, cx + fw * 0.78, cy - 12]]); g.fill(); g.restore();
  if ((f || kid) && ex !== 'cold') { g.fillStyle = ex === 'shy' ? 'rgba(240,110,120,0.55)' : 'rgba(240,130,130,0.28)'; for (const sd of [-1, 1]) { g.beginPath(); g.ellipse(cx + sd * 21, cy + 16, 8, 4, 0, 0, 7); g.fill(); } }
  if (p.freckles) { g.fillStyle = shade(skin, 0.7); for (let k = 0; k < 7; k++) { const sd = k % 2 ? -1 : 1; g.fillRect(cx + sd * (12 + (k * 3) % 9), cy + 8 + (k % 3) * 2, 1.6, 1.6); } }
  if (p.paint) { g.fillStyle = p.paint; for (const sd of [-1, 1]) { g.fillRect(cx + sd * 14 - 6, cy + 10, 12, 2.5); g.fillRect(cx + sd * 14 - 4, cy + 15, 8, 2.5); } }
  if (old) { g.strokeStyle = shade(skin, 0.72); g.lineWidth = 1.2; for (const sd of [-1, 1]) { g.beginPath(); g.moveTo(cx + sd * 22, cy + 4); g.quadraticCurveTo(cx + sd * 26, cy + 8, cx + sd * 25, cy + 13); g.stroke(); g.beginPath(); g.moveTo(cx + sd * 9, cy + 20); g.quadraticCurveTo(cx + sd * 14, cy + 24, cx + sd * 16, cy + 30); g.stroke(); } g.beginPath(); g.moveTo(cx - 10, cy - 22); g.lineTo(cx + 10, cy - 22); g.stroke(); }
  // ---- eyes, brows, nose, mouth
  eyes(g, p, ex, cx, cy, f, old, kid);
  g.strokeStyle = shade(skin, 0.6); g.lineWidth = 1.6; g.beginPath(); g.moveTo(cx + 1, cy + 12); g.lineTo(cx + 3, cy + 18); g.lineTo(cx, cy + 19); g.stroke();
  mouth(g, p, ex, cx, cy + fh * 0.62 * jaw, f);
  if (p.stubble) { g.fillStyle = 'rgba(40,30,30,0.22)'; path(g, [[cx - fw + 4, cy + 10], [cx - 10, cy + 38], [cx + 10, cy + 38], [cx + fw - 4, cy + 10], [cx + fw - 6, cy + 24], [cx, cy + 30], [cx - fw + 6, cy + 24]]); g.fill(); }
  if (p.beard) beard(g, p, cx, cy, fw, jaw);
  if (p.scar === 'cheek') { g.strokeStyle = '#b86a5a'; g.lineWidth = 2; g.beginPath(); g.moveTo(cx - 24, cy + 2); g.lineTo(cx - 14, cy + 16); g.stroke(); g.lineWidth = 1; g.beginPath(); g.moveTo(cx - 22, cy + 8); g.lineTo(cx - 18, cy + 6); g.stroke(); }
  if (p.scar === 'brow') { g.strokeStyle = '#b86a5a'; g.lineWidth = 2; g.beginPath(); g.moveTo(cx + 12, cy - 18); g.lineTo(cx + 20, cy - 2); g.stroke(); }
  if (p.scar === 'chin') { g.strokeStyle = '#a85a4a'; g.lineWidth = 2; g.beginPath(); g.moveTo(cx + 6, cy + 30); g.lineTo(cx + 14, cy + 36); g.stroke(); }
  if (p.scar === 'eye') { g.strokeStyle = '#a85a4a'; g.lineWidth = 2.4; g.beginPath(); g.moveTo(cx + 12, cy - 22); g.lineTo(cx + 22, cy + 14); g.stroke(); }
  if (p.tattoo) { g.strokeStyle = '#2a5a6a'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(cx + fw - 4, cy + 34); g.bezierCurveTo(cx + fw + 6, cy + 44, cx + fw - 2, cy + 52, cx + fw + 10, cy + 58); g.stroke(); }
  // ---- hair in front
  if (!H.helm) frontHair(g, H, hc, cx, cy, fw, fh, f, p);
  if (H.braid) { g.strokeStyle = INK; g.lineWidth = 2; for (let k = 0; k < 7; k++) { const a = Math.PI + k / 6 * Math.PI, x = cx + Math.cos(a) * (fw + 2), y = cy - 16 + Math.sin(a) * (fh - 2); g.beginPath(); g.ellipse(x, y, 6, 4.5, a + Math.PI / 2, 0, 7); g.fillStyle = shade(hc, k % 2 ? 1.05 : 0.9); g.fill(); g.stroke(); } }
  extras(g, p, H, cx, cy, fw, fh, f, ex, hc);
}
function backHair(g, H, hc, cx, cy, fw, fh, f) {
  const fill = (pts) => { path(g, pts); fillInk(g, shade(hc, 0.85)); };
  const top = cy - fh - 8;
  if (H.back === 'long' || H.back === 'braids' || H.back === 'wig') fill([[cx - fw - 10, cy - 10], [cx - fw - 14, cy + 40, cx - fw - 20, cy + 80, cx - fw - 8, cy + 110], [cx - 20, cy + 112], [cx, cy + 60], [cx + 20, cy + 112], [cx + fw + 8, cy + 110], [cx + fw + 20, cy + 80, cx + fw + 14, cy + 40, cx + fw + 10, cy - 10], [cx + fw + 6, top, cx, top - 2], [cx - fw - 6, top, cx - fw - 10, cy - 10]]);
  if (H.back === 'mane') fill([[cx - fw - 14, cy - 8], [cx - fw - 22, cy + 10], [cx - fw - 10, cy + 20], [cx - fw - 16, cy + 36], [cx - fw + 2, cy + 30], [cx + fw - 2, cy + 30], [cx + fw + 16, cy + 36], [cx + fw + 10, cy + 20], [cx + fw + 22, cy + 10], [cx + fw + 14, cy - 8], [cx + fw + 8, top - 6, cx, top - 8], [cx - fw - 8, top - 6, cx - fw - 14, cy - 8]]);
  if (H.back === 'nape' || H.back === 'bobshort' || H.back === 'bob') { const d = H.back === 'bob' ? 34 : H.back === 'bobshort' ? 22 : 12; fill([[cx - fw - 7, cy - 10], [cx - fw - 9, cy + d], [cx - fw + 6, cy + d + 4], [cx + fw - 6, cy + d + 4], [cx + fw + 9, cy + d], [cx + fw + 7, cy - 10], [cx + fw + 4, top, cx, top - 2], [cx - fw - 4, top, cx - fw - 7, cy - 10]]); }
  if (H.back === 'pony' || H.back === 'tail') { fill([[cx - fw - 6, cy - 12], [cx - fw - 8, cy + 10], [cx + fw + 8, cy + 10], [cx + fw + 6, cy - 12], [cx + fw + 4, top, cx, top - 2], [cx - fw - 4, top, cx - fw - 6, cy - 12]]); const sx = H.back === 'pony' ? cx + fw + 6 : cx; fill([[sx - 8, cy - 26], [sx + 26, cy - 10, sx + 24, cy + 50, sx + 10, cy + 96], [sx - 2, cy + 60, sx - 14, cy + 10, sx - 8, cy - 26]]); }
  if (H.back === 'twin') { fill([[cx - fw - 6, cy - 12], [cx - fw - 8, cy + 10], [cx + fw + 8, cy + 10], [cx + fw + 6, cy - 12], [cx + fw + 4, top, cx, top - 2], [cx - fw - 4, top, cx - fw - 6, cy - 12]]); for (const sd of [-1, 1]) fill([[cx + sd * (fw + 2), cy - 30], [cx + sd * (fw + 30), cy - 20, cx + sd * (fw + 26), cy + 40, cx + sd * (fw + 16), cy + 80], [cx + sd * (fw + 8), cy + 40, cx + sd * (fw + 4), cy, cx + sd * (fw + 2), cy - 30]]); }
  if (H.back === 'bun') { fill([[cx - fw - 6, cy - 12], [cx - fw - 8, cy + 6], [cx + fw + 8, cy + 6], [cx + fw + 6, cy - 12], [cx + fw + 4, top, cx, top - 2], [cx - fw - 4, top, cx - fw - 6, cy - 12]]); g.beginPath(); g.arc(cx, top - 4, 14, 0, 7); fillInk(g, shade(hc, 0.9)); }
  if (H.back === 'braids') for (const sd of [-1, 1]) for (let k = 0; k < 6; k++) { g.beginPath(); g.ellipse(cx + sd * (fw + 8), cy + 20 + k * 13, 7, 8, 0, 0, 7); fillInk(g, shade(hc, k % 2 ? 0.95 : 0.8), 1.6); }
}
function frontHair(g, H, hc, cx, cy, fw, fh, f, p) {
  const top = cy - fh - 8 - (H.vol - 1) * 40, mid = cy - 16;
  const cap = (pts) => { path(g, pts); fillInk(g, hc); };
  if (H.fringe === 'none') { if (p.hair === 'bald') { g.fillStyle = 'rgba(255,255,255,0.25)'; g.beginPath(); g.ellipse(cx - 8, cy - fh + 4, 10, 5, -0.3, 0, 7); g.fill(); } return; }
  if (H.fringe === 'buzz') { path(g, [[cx - fw, mid], [cx - fw, cy - fh - 2, cx, cy - fh - 4], [cx + fw, cy - fh - 2, cx + fw, mid], [cx + fw - 4, cy - fh + 6, cx, cy - fh + 4], [cx - fw + 4, cy - fh + 6, cx - fw, mid]]); fillInk(g, shade(hc, 0.95), 1.6); return; }
  // the crown of the head
  const crown = [[cx - fw - 6, cy - 4], [cx - fw - 8, top + 20, cx - fw + 6, top + 2, cx, top], [cx + fw - 6, top + 2, cx + fw + 8, top + 20, cx + fw + 6, cy - 4]];
  if (H.fringe === 'slick') { cap([...crown, [cx + fw - 2, cy - fh + 6], [cx + 10, cy - fh], [cx - fw + 2, cy - fh + 6]]); highlight(g, hc, cx, top, fw); return; }
  // strands of the fringe hanging over the forehead
  const tips = { spiky: [[-1, 4, -0.2], [-0.6, 14, -0.1], [-0.15, 8, 0.1], [0.3, 16, 0.2], [0.75, 6, 0.3], [1.05, 10, 0.2]], messy: [[-1, 10, -0.2], [-0.55, 18, 0], [-0.1, 12, 0.1], [0.35, 20, 0.2], [0.8, 12, 0.2], [1.05, 16, 0]],
    parted: [[-1.05, 18, -0.1], [-0.6, 10, -0.3], [-0.08, 0, 0], [0.08, 0, 0], [0.6, 10, 0.3], [1.05, 18, 0.1]], side: [[-1.05, 20, -0.1], [-0.5, 24, 0.2], [0, 18, 0.4], [0.45, 10, 0.5], [0.85, 4, 0.4], [1.05, 14, 0.2]],
    straight: [[-1.05, 22, 0], [-0.6, 24, 0], [-0.2, 24, 0], [0.2, 24, 0], [0.6, 24, 0], [1.05, 22, 0]], swept: [[-1.05, 16, 0.2], [-0.4, 22, 0.5], [0.1, 18, 0.6], [0.55, 12, 0.6], [0.9, 6, 0.5], [1.05, 12, 0.3]],
    curly: [[-1.05, 14, 0], [-0.65, 20, 0], [-0.25, 14, 0], [0.15, 20, 0], [0.55, 14, 0], [1.05, 16, 0]] }[H.fringe] || [[-1, 16, 0], [0, 20, 0], [1, 16, 0]];
  const pts = [...crown];
  const base = cy - fh + 2; let prev = [cx + fw + 6, cy - 4];
  for (let k = tips.length - 1; k >= 0; k--) { const [u, d, lean] = tips[k], x = cx + u * fw, y = base + d + (H.fringe === 'spiky' || H.fringe === 'messy' ? 6 : 8); const valley = [cx + (u + (tips[k - 1] ? tips[k - 1][0] : u - 0.4)) / 2 * fw, base + 2 + (f ? 4 : 0)]; pts.push([x + lean * 10 + (prev[0] - x) * 0.2, (prev[1] + y) / 2 - 4, x + lean * 8, y]); pts.push([x, y - 6, valley[0], valley[1]]); prev = valley; }
  pts.push([cx - fw - 6, cy - 4]);
  if (H.fringe === 'curly') { cap(pts); g.strokeStyle = shade(hc, 0.7); g.lineWidth = 1.6; for (let k = 0; k < 9; k++) { g.beginPath(); g.arc(cx - fw + 6 + k * (fw / 4.2), top + 12 + (k % 2) * 6, 5, 0, Math.PI * 1.5); g.stroke(); } }
  else cap(pts);
  // side locks down past the ears
  if (f || H.fringe === 'swept' || p.hair === 'long' || p.hair === 'flow' || p.hair === 'longwhite') for (const sd of [-1, 1]) { path(g, [[cx + sd * (fw + 6), cy - 10], [cx + sd * (fw + 10), cy + 16, cx + sd * (fw + 4), cy + (f ? 38 : 26)], [cx + sd * (fw - 2), cy + 12, cx + sd * (fw - 2), cy - 8]]); fillInk(g, shade(hc, 0.95), 1.8); }
  highlight(g, hc, cx, top, fw);
}
function highlight(g, hc, cx, top, fw) { g.strokeStyle = shade(hc, 1.45); g.lineWidth = 3; g.beginPath(); g.arc(cx - 4, top + 26, fw * 0.75, Math.PI * 1.15, Math.PI * 1.55); g.stroke(); g.lineWidth = 2; g.beginPath(); g.arc(cx + 4, top + 26, fw * 0.75, Math.PI * 1.65, Math.PI * 1.8); g.stroke(); }
function eyes(g, p, ex, cx, cy, f, old, kid) {
  const style = p.eye || 'round', ec = p.ec || '#4a3a2a', ey = cy, sep = f ? 17 : 17.5;
  const w = (f ? 12.5 : 11) * (kid ? 1.1 : 1) * (style === 'big' ? 1.1 : 1), h0 = (f ? 11.5 : 8.5) * (style === 'sharp' || style === 'cold' || style === 'cat' ? 0.82 : 1) * (style === 'big' ? 1.2 : 1) * (style === 'tired' || old ? 0.78 : 1);
  const open = ex === 'closed' ? 0 : ex === 'surprise' ? 1.3 : ex === 'smile' || ex === 'grin' ? 0.55 : ex === 'angry' || ex === 'cold' || ex === 'det' ? 0.8 : ex === 'pain' ? 0.45 : ex === 'sad' || ex === 'cry' ? 0.8 : 1;
  for (const sd of [-1, 1]) {
    const x = cx + sd * sep, h = h0 * open, tilt = (style === 'sharp' || style === 'cat' ? 0.18 : style === 'kind' || style === 'soft' ? -0.08 : 0) + (ex === 'angry' || ex === 'det' ? 0.15 : 0) + (ex === 'sad' || ex === 'cry' ? -0.2 : 0);
    if (h < 1.5) { g.strokeStyle = INK; g.lineWidth = 2.6; g.beginPath(); if (ex === 'smile' || ex === 'grin' || ex === 'closed' && !p.mask) { g.moveTo(x - w, ey + 1); g.quadraticCurveTo(x, ey - 5, x + w, ey + 1); } else { g.moveTo(x - w, ey); g.quadraticCurveTo(x, ey + 4, x + w, ey); } g.stroke(); continue; }
    if (p.patch && sd === 1) { g.fillStyle = '#1a1a1a'; g.beginPath(); g.ellipse(x, ey, w + 2, h0 + 3, 0, 0, 7); g.fill(); g.strokeStyle = '#1a1a1a'; g.lineWidth = 2; g.beginPath(); g.moveTo(x - w - 2, ey - 4); g.lineTo(cx - 40, cy - 22); g.moveTo(x + w + 2, ey - 4); g.lineTo(cx + 40, cy - 26); g.stroke(); continue; }
    g.save(); g.translate(x, ey); g.rotate(sd * -tilt);
    // the white, then the iris and pupil, clipped to the eye's shape
    path(g, [[-w, 1], [-w * 0.6, -h, w * 0.6, -h, w, -1], [w * 0.5, h * 0.9, -w * 0.5, h * 0.9, -w, 1]]); g.fillStyle = '#ffffff'; g.fill(); g.save(); g.clip();
    const ir = (f ? 7.4 : 6.2) * (style === 'big' ? 1.12 : 1) * (ex === 'surprise' ? 0.85 : 1), ix = sd * (ex === 'cold' ? -1 : 0.5), iy = 1;
    if (style !== 'empty') { const gr = g.createLinearGradient(0, -ir, 0, ir); gr.addColorStop(0, shade(ec, 0.6)); gr.addColorStop(1, shade(ec, 1.25)); g.fillStyle = gr; g.beginPath(); g.ellipse(ix, iy, ir * 0.9, ir * 1.1, 0, 0, 7); g.fill(); g.fillStyle = shade(ec, 0.4); g.beginPath(); g.ellipse(ix, iy, ir * 0.42, ir * 0.55, 0, 0, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,0.95)'; g.beginPath(); g.arc(ix - ir * 0.35, iy - ir * 0.45, ir * 0.28, 0, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,0.6)'; g.beginPath(); g.arc(ix + ir * 0.35, iy + ir * 0.4, ir * 0.14, 0, 7); g.fill(); }
    else { g.fillStyle = shade(ec, 0.9); g.beginPath(); g.ellipse(ix, iy, ir * 0.9, ir * 1.1, 0, 0, 7); g.fill(); }
    g.fillStyle = 'rgba(40,30,60,0.18)'; g.fillRect(-w, -h, w * 2, h * 0.5);
    g.restore();
    // the upper lid line (thick, with a lash flick for women), the lower lid
    g.strokeStyle = INK; g.lineWidth = f ? 3.2 : 2.6; g.beginPath(); g.moveTo(-w - 1, 1.5); g.bezierCurveTo(-w * 0.6, -h - 1, w * 0.6, -h - 1, w + 1, -1); g.stroke();
    if (f) { g.lineWidth = 2; g.beginPath(); g.moveTo(sd * (w + 1), -1); g.lineTo(sd * (w + 4), -4); g.stroke(); }
    g.lineWidth = 1.2; g.strokeStyle = shade('#8a5a4a', 1); g.beginPath(); g.moveTo(-w * 0.6, h * 0.85); g.quadraticCurveTo(0, h * 1.05, w * 0.7, h * 0.7); g.stroke();
    g.restore();
    if (ex === 'cry' || ex === 'sad' && p.g === 'f') { g.fillStyle = 'rgba(140,200,255,0.8)'; g.beginPath(); g.ellipse(x + sd * 2, ey + h0 + 4, 2, 3.5, 0, 0, 7); g.fill(); if (ex === 'cry') { g.fillRect(x + sd * 2 - 1, ey + h0 + 4, 2, 12); } }
  }
  // brows
  const bt = { angry: 0.38, det: 0.25, cold: 0.12, sad: -0.32, cry: -0.32, pain: -0.25, surprise: -0.05, shy: -0.15 }[ex] ?? (p.eye === 'stern' || p.eye === 'sharp' ? 0.12 : 0), by = ey - (f ? 15 : 13) - (ex === 'surprise' ? 5 : 0);
  g.strokeStyle = shade(p.hc || '#3a2a1a', 0.6); g.lineWidth = f ? 2.4 : 3.6;
  for (const sd of [-1, 1]) { const x = cx + sd * sep; g.beginPath(); g.moveTo(x - sd * 10, by + 1 - bt * 6 * -1 * 0); g.moveTo(x + sd * -9, by + bt * -8 + 2); g.quadraticCurveTo(x, by - 3 + bt * -2, x + sd * 10, by + bt * 6 - 1); g.stroke(); }
}
function mouth(g, p, ex, cx, my, f) {
  g.strokeStyle = INK; g.lineWidth = 2; const red = '#a83a3a';
  if (ex === 'grin' || p.grin && ex === 'smile') { path(g, [[cx - 10, my - 2], [cx, my + 2, cx + 10, my - 2], [cx + 6, my + 8, cx, my + 9], [cx - 6, my + 8, cx - 10, my - 2]]); g.fillStyle = '#7a2a2a'; g.fill(); g.stroke(); g.fillStyle = '#ffffff'; g.fillRect(cx - 7, my - 1, 14, 2.5); return; }
  if (ex === 'smile') { g.beginPath(); g.moveTo(cx - 7, my - 1); g.quadraticCurveTo(cx, my + 5, cx + 7, my - 1); g.stroke(); return; }
  if (ex === 'surprise') { g.beginPath(); g.ellipse(cx, my + 2, 4, 5, 0, 0, 7); g.fillStyle = '#6a2a2a'; g.fill(); g.stroke(); return; }
  if (ex === 'angry') { path(g, [[cx - 8, my + 2], [cx, my - 3, cx + 8, my + 2], [cx, my + 5, cx - 8, my + 2]]); g.fillStyle = '#7a2a2a'; g.fill(); g.stroke(); g.fillStyle = '#ffffff'; g.fillRect(cx - 5, my - 0.5, 10, 2); return; }
  if (ex === 'pain') { g.beginPath(); g.moveTo(cx - 8, my + 2); g.lineTo(cx - 3, my - 1); g.lineTo(cx + 2, my + 2); g.lineTo(cx + 8, my - 1); g.stroke(); return; }
  if (ex === 'sad' || ex === 'cry') { g.beginPath(); g.moveTo(cx - 6, my + 3); g.quadraticCurveTo(cx, my - 2, cx + 6, my + 3); g.stroke(); return; }
  if (ex === 'cold') { g.beginPath(); g.moveTo(cx - 6, my + 1); g.lineTo(cx + 7, my); g.stroke(); return; }
  if (ex === 'shy') { g.beginPath(); g.moveTo(cx - 4, my + 1); g.quadraticCurveTo(cx, my + 3, cx + 4, my + 1); g.stroke(); return; }
  g.beginPath(); g.moveTo(cx - 6, my); g.quadraticCurveTo(cx, my + (ex === 'det' ? 0 : 2), cx + 6, my); g.stroke();
  if (f) { g.strokeStyle = 'rgba(200,90,90,0.45)'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(cx - 3, my + 3); g.lineTo(cx + 3, my + 3); g.stroke(); }
}
function beard(g, p, cx, cy, fw, jaw) {
  const b = p.beard, long = p.longBeard || p.braidBeard;
  path(g, [[cx - fw + 2, cy + 8], [cx - fw + 2, cy + 26, cx - 12, cy + (long ? 64 : 44)], [cx, cy + (long ? 78 : 50), cx + 12, cy + (long ? 64 : 44)], [cx + fw - 2, cy + 26, cx + fw - 2, cy + 8], [cx + fw - 8, cy + 22, cx + 8, cy + 24], [cx, cy + 22, cx - 8, cy + 24], [cx - fw + 8, cy + 22, cx - fw + 2, cy + 8]]); fillInk(g, b, 2);
  // a moustache and the mouth showing through
  path(g, [[cx - 14, cy + 22], [cx - 6, cy + 17, cx, cy + 19], [cx + 6, cy + 17, cx + 14, cy + 22], [cx + 6, cy + 23, cx, cy + 22], [cx - 6, cy + 23, cx - 14, cy + 22]]); fillInk(g, shade(b, 0.85), 1.6);
  g.strokeStyle = INK; g.lineWidth = 1.8; g.beginPath(); g.moveTo(cx - 5, cy + 28); g.quadraticCurveTo(cx, cy + 30, cx + 5, cy + 28); g.stroke();
  g.strokeStyle = shade(b, 1.35); g.lineWidth = 1.2; for (let k = 0; k < 6; k++) { g.beginPath(); g.moveTo(cx - 14 + k * 5, cy + 32); g.lineTo(cx - 13 + k * 5, cy + (long ? 56 : 40)); g.stroke(); }
  if (p.braidBeard) for (let k = 0; k < 3; k++) { g.beginPath(); g.ellipse(cx, cy + 66 + k * 8, 5, 4, 0, 0, 7); g.fillStyle = shade(b, k % 2 ? 1 : 0.85); g.fill(); g.strokeStyle = INK; g.stroke(); }
}
function body(g, p, kind, cx, cy, f, big) {
  const oc = p.oc || '#5a5a6a', ac = p.ac || '#d8b060', top = cy + 52, sw = (f ? 62 : 70) + (big ? 10 : 0);
  // the shoulders and chest
  path(g, [[cx - sw, 192], [cx - sw + 2, top + 22, cx - 30, top + 6], [cx - 12, top], [cx + 12, top], [cx + 30, top + 6, cx + sw - 2, top + 22, cx + sw, 192]]);
  fillInk(g, kind === 'bare' ? p.skin : oc);
  g.save(); path(g, [[cx - sw, 192], [cx - sw + 2, top + 22, cx - 30, top + 6], [cx - 12, top], [cx + 12, top], [cx + 30, top + 6, cx + sw - 2, top + 22, cx + sw, 192]]); g.clip();
  g.fillStyle = shade(kind === 'bare' ? p.skin : oc, 0.78); g.fillRect(cx + 18, top, sw, 100);
  if (kind === 'armor' || kind === 'armorlite') {
    for (const sd of [-1, 1]) { g.beginPath(); g.ellipse(cx + sd * (sw - 18), top + 26, 26, 20, sd * 0.3, 0, 7); g.fillStyle = shade(oc, 1.15); g.fill(); g.strokeStyle = INK; g.lineWidth = 2; g.stroke(); g.strokeStyle = 'rgba(255,255,255,0.5)'; g.lineWidth = 3; g.beginPath(); g.ellipse(cx + sd * (sw - 22), top + 22, 16, 9, sd * 0.3, Math.PI * 1.1, Math.PI * 1.7); g.stroke(); }
    path(g, [[cx - 26, top + 20], [cx - 22, 192], [cx + 22, 192], [cx + 26, top + 20], [cx, top + 12]]); g.fillStyle = shade(oc, 1.05); g.fill(); g.strokeStyle = INK; g.stroke();
    g.fillStyle = ac; g.fillRect(cx - 3, top + 22, 6, 40); g.fillRect(cx - 12, top + 34, 24, 5);
  }
  if (kind === 'coat') { for (const sd of [-1, 1]) { path(g, [[cx + sd * 12, top], [cx + sd * 28, top + 40], [cx + sd * 8, 192], [cx, 192], [cx + sd * 2, top + 16]]); g.fillStyle = shade(oc, 1.12); g.fill(); g.strokeStyle = INK; g.lineWidth = 2; g.stroke(); } g.fillStyle = ac; for (let k = 0; k < 3; k++) { g.beginPath(); g.arc(cx + 10, top + 50 + k * 14, 3, 0, 7); g.fill(); } g.fillStyle = shade('#ffffff', 0.92); path(g, [[cx - 10, top + 2], [cx, top + 26], [cx + 10, top + 2]]); g.fill(); }
  if (kind === 'vest' || kind === 'shirt') { g.fillStyle = kind === 'vest' ? shade(oc, 0.7) : shade(oc, 1.1); path(g, [[cx - 14, top + 2], [cx, top + 30], [cx + 14, top + 2]]); g.fill(); g.fillStyle = p.skin; path(g, [[cx - 9, top + 2], [cx, top + 22], [cx + 9, top + 2]]); g.fill(); if (kind === 'vest') { g.strokeStyle = ac; g.lineWidth = 3; g.beginPath(); g.moveTo(cx - 36, top + 30); g.lineTo(cx + 34, 192); g.stroke(); } }
  if (kind === 'gown') { g.fillStyle = p.skin; path(g, [[cx - 30, top + 4], [cx - 18, top + 30, cx, top + 32], [cx + 18, top + 30, cx + 30, top + 4]]); g.fill(); g.strokeStyle = ac; g.lineWidth = 3; g.beginPath(); g.moveTo(cx - 32, top + 6); g.quadraticCurveTo(cx, top + 40, cx + 32, top + 6); g.stroke(); g.fillStyle = ac; g.beginPath(); g.arc(cx, top + 30, 4, 0, 7); g.fill(); }
  if (kind === 'robe' || kind === 'nun') { for (const sd of [-1, 1]) { path(g, [[cx + sd * 10, top], [cx + sd * 4, 192], [cx + sd * 18, 192], [cx + sd * 26, top + 8]]); g.fillStyle = ac; g.fill(); } if (kind === 'nun') { g.fillStyle = '#f0ece4'; path(g, [[cx - 24, top + 2], [cx, top + 30], [cx + 24, top + 2]]); g.fill(); } }
  if (kind === 'hood') { g.fillStyle = shade(oc, 0.85); path(g, [[cx - 34, top + 2], [cx, top + 36], [cx + 34, top + 2], [cx + 30, top + 18], [cx, top + 44], [cx - 30, top + 18]]); g.fill(); }
  if (kind === 'bare') { g.strokeStyle = shade(p.skin, 0.75); g.lineWidth = 2; g.beginPath(); g.moveTo(cx - 20, top + 30); g.quadraticCurveTo(cx - 8, top + 38, cx, top + 30); g.quadraticCurveTo(cx + 8, top + 38, cx + 20, top + 30); g.stroke(); g.strokeStyle = oc; g.lineWidth = 8; g.beginPath(); g.moveTo(cx - 40, top + 10); g.lineTo(cx + 30, 192); g.stroke(); }
  if (kind === 'fur') { g.fillStyle = shade(ac, 1.1); for (let k = 0; k < 14; k++) { const a = Math.PI + k / 13 * Math.PI; g.beginPath(); g.ellipse(cx + Math.cos(a) * 44, top + 14 + Math.sin(a) * -8 + (k % 2) * 4, 12, 9, a, 0, 7); g.fillStyle = k % 2 ? '#d8d0c0' : '#b8b0a0'; g.fill(); } }
  g.restore();
  if (p.scarf) { path(g, [[cx - 26, top - 2], [cx, top + 12, cx + 26, top - 2], [cx + 22, top + 12], [cx, top + 22, cx - 22, top + 12]]); fillInk(g, p.scarf, 2); path(g, [[cx - 16, top + 12], [cx - 22, top + 46], [cx - 10, top + 44], [cx - 6, top + 16]]); fillInk(g, shade(p.scarf, 0.85), 2); }
}
function extras(g, p, H, cx, cy, fw, fh, f, ex, hc) {
  const top = cy - fh - 6;
  if (p.glasses) { g.strokeStyle = '#3a3a3a'; g.lineWidth = 2; for (const sd of [-1, 1]) { g.beginPath(); g.ellipse(cx + sd * 15, cy - 2, 11, 9, 0, 0, 7); g.stroke(); } g.beginPath(); g.moveTo(cx - 4, cy - 4); g.lineTo(cx + 4, cy - 4); g.stroke(); g.strokeStyle = 'rgba(255,255,255,0.6)'; g.beginPath(); g.moveTo(cx - 20, cy - 6); g.lineTo(cx - 14, cy - 9); g.stroke(); }
  if (p.mask === 1) { path(g, [[cx - 2, cy - fh + 2], [cx + fw + 4, cy - fh + 4], [cx + fw + 6, cy + 6], [cx + 18, cy + 24], [cx + 2, cy + 18]]); fillInk(g, '#f4f4f8', 2); g.fillStyle = '#1a1a22'; g.beginPath(); g.ellipse(cx + 15, cy - 3, 8, 4, -0.15, 0, 7); g.fill(); g.strokeStyle = '#c8c8d8'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(cx + 6, cy + 10); g.quadraticCurveTo(cx + 20, cy + 14, cx + 26, cy + 4); g.stroke(); }
  if (p.mask === 'lower') { path(g, [[cx - fw, cy + 6], [cx + fw, cy + 6], [cx + fw * 0.75, cy + 26], [cx, cy + 40], [cx - fw * 0.75, cy + 26]]); fillInk(g, shade(p.oc || '#2a2a2a', 1), 2); }
  if (p.circlet) { g.strokeStyle = p.circlet; g.lineWidth = 3; g.beginPath(); g.ellipse(cx, cy - fh + 4, fw + 2, 6, 0, Math.PI * 0.05, Math.PI * 0.95, true); g.stroke(); g.fillStyle = '#8ad0ff'; g.beginPath(); g.moveTo(cx, cy - fh - 6); g.lineTo(cx + 4, cy - fh); g.lineTo(cx, cy - fh + 5); g.lineTo(cx - 4, cy - fh); g.fill(); g.strokeStyle = INK; g.lineWidth = 1; g.stroke(); }
  if (p.crown) { path(g, [[cx - fw + 4, top + 6], [cx - fw + 2, top - 14], [cx - fw / 2, top - 4], [cx, top - 20], [cx + fw / 2, top - 4], [cx + fw - 2, top - 14], [cx + fw - 4, top + 6]]); fillInk(g, '#e8c040', 2); g.fillStyle = '#c83a3a'; g.beginPath(); g.arc(cx, top - 2, 3.5, 0, 7); g.fill(); }
  if (p.band) { g.fillStyle = p.band; path(g, [[cx - fw - 6, cy - fh + 10], [cx, cy - fh + 4, cx + fw + 6, cy - fh + 10], [cx + fw + 6, cy - fh + 18], [cx, cy - fh + 12, cx - fw - 6, cy - fh + 18]]); fillInk(g, p.band, 1.6); path(g, [[cx + fw + 4, cy - fh + 12], [cx + fw + 24, cy - fh + 22], [cx + fw + 18, cy - fh + 28], [cx + fw + 2, cy - fh + 18]]); fillInk(g, p.band, 1.6); }
  if (H.bandana) { path(g, [[cx - fw - 8, cy - fh + 8], [cx, top - 6, cx + fw + 8, cy - fh + 8], [cx + fw + 6, cy - fh + 16], [cx, cy - fh + 10, cx - fw - 6, cy - fh + 16]]); fillInk(g, p.ac || '#a83030', 2); path(g, [[cx - fw - 6, cy - fh + 12], [cx - fw - 26, cy - fh + 26], [cx - fw - 18, cy - fh + 32], [cx - fw - 4, cy - fh + 18]]); fillInk(g, shade(p.ac || '#a83030', 0.85), 2); }
  if (H.cap) { path(g, [[cx - fw - 6, cy - fh + 10], [cx - fw - 4, top - 10, cx, top - 12], [cx + fw + 4, top - 10, cx + fw + 6, cy - fh + 10]]); fillInk(g, p.ac || '#3a4a6a', 2); path(g, [[cx - fw - 2, cy - fh + 10], [cx + fw + 20, cy - fh + 12], [cx + fw + 16, cy - fh + 18], [cx - fw, cy - fh + 16]]); fillInk(g, shade(p.ac || '#3a4a6a', 0.8), 2); }
  if (p.hat === 'feather') { path(g, [[cx - fw - 18, cy - fh + 6], [cx - fw - 8, top - 20, cx + 4, top - 22], [cx + fw + 8, top - 20, cx + fw + 22, cy - fh + 4], [cx, cy - fh, cx - fw - 18, cy - fh + 6]]); fillInk(g, p.oc, 2); path(g, [[cx + 10, top - 16], [cx + 50, top - 50, cx + 60, top - 30], [cx + 40, top - 20, cx + 14, top - 10]]); fillInk(g, '#f0ece4', 1.6); }
  if (p.hat === 'tricorn') { path(g, [[cx - fw - 22, cy - fh + 4], [cx - fw, top - 22, cx, top - 16], [cx + fw, top - 22, cx + fw + 22, cy - fh + 4], [cx, cy - fh + 2]]); fillInk(g, '#1a1a22', 2); g.strokeStyle = p.ac || '#d8c070'; g.lineWidth = 2; g.beginPath(); g.moveTo(cx - fw - 18, cy - fh + 3); g.quadraticCurveTo(cx, cy - fh - 2, cx + fw + 18, cy - fh + 3); g.stroke(); }
  if (p.mitre) { path(g, [[cx - fw + 2, cy - fh + 4], [cx - fw + 6, top - 40], [cx, top - 54], [cx + fw - 6, top - 40], [cx + fw - 2, cy - fh + 4]]); fillInk(g, '#f4f0e8', 2); g.fillStyle = '#d8a840'; g.fillRect(cx - 3, top - 46, 6, 40); g.fillRect(cx - 12, top - 30, 24, 5); }
  if (p.veil && !H.veil) { path(g, [[cx - fw - 10, cy - fh + 10], [cx - fw, top - 8, cx, top - 10], [cx + fw, top - 8, cx + fw + 10, cy - fh + 10], [cx + fw - 2, cy - fh + 4], [cx, cy - fh - 2, cx - fw + 2, cy - fh + 4]]); fillInk(g, '#f4f0ec', 1.8); g.fillStyle = '#d8a840'; g.beginPath(); g.arc(cx, cy - fh + 2, 3, 0, 7); g.fill(); }
  if (H.veil === 'nun') { path(g, [[cx - fw - 8, cy - fh + 14], [cx - fw - 2, top - 10, cx, top - 12], [cx + fw + 2, top - 10, cx + fw + 8, cy - fh + 14], [cx, cy - fh + 4]]); fillInk(g, '#2a2a34', 2); g.fillStyle = '#f0ece4'; path(g, [[cx - fw - 4, cy - fh + 12], [cx, cy - fh + 2, cx + fw + 4, cy - fh + 12], [cx + fw + 2, cy - fh + 18], [cx, cy - fh + 8, cx - fw - 2, cy - fh + 18]]); g.fill(); }
  if (H.helm) { path(g, [[cx - fw - 8, cy + 10], [cx - fw - 10, top - 10, cx, top - 14], [cx + fw + 10, top - 10, cx + fw + 8, cy + 10], [cx + fw - 2, cy + 10], [cx + fw - 2, cy - fh + 12], [cx - fw + 2, cy - fh + 12], [cx - fw + 2, cy + 10]]); fillInk(g, '#a8a8b4', 2); g.fillStyle = '#d8d8e0'; g.fillRect(cx - 3, top - 12, 6, 30); }
  if (p.bones) { for (let k = 0; k < 5; k++) { g.fillStyle = '#e8e0c8'; g.beginPath(); g.ellipse(cx - 28 + k * 14, cy + 64, 4, 7, 0.3, 0, 7); g.fill(); g.strokeStyle = INK; g.lineWidth = 1.2; g.stroke(); } }
  if (p.fan) { path(g, [[cx + 40, 192], [cx + 30, cy + 66], [cx + 76, cy + 40], [cx + 84, cy + 74]]); fillInk(g, '#f4f4f0', 1.8); g.strokeStyle = '#c8c8c0'; g.lineWidth = 1; for (let k = 0; k < 5; k++) { g.beginPath(); g.moveTo(cx + 40, 192); g.lineTo(cx + 34 + k * 12, cy + 48 + k * 4); g.stroke(); } }
}
