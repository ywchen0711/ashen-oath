// Portraits in the manner of Japanese tactics-game art: a three-quarter bust turned toward the middle of the screen,
// a narrow face with a pointed chin, large layered eyes, hair built from pointed locks with a highlight ring, thin
// coloured line art and hard-edged cel shading. A portrait is built from its description (hair style and colour,
// eyes, outfit, extras) and an expression: 平 normal, 笑 smile, 喜 grin, 怒 anger, 悲 sorrow, 驚 surprise, 痛 pain,
// 冷 cold, 羞 shy, 決 resolve, 閉 eyes closed, 哭 tears. Portraits face right; pass flip to face left.
import { watercolor } from './paint.js';
const CACHE = new Map();
const LASH = '#3a1e36';
const shade = (hex, k) => { const n = parseInt(hex.slice(1), 16), r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255, f = (v) => Math.max(0, Math.min(255, Math.round(k > 1 ? v + (255 - v) * (k - 1) : v * k))); return `rgb(${f(r)},${f(g)},${f(b)})`; };
const mix = (hex, hex2, t) => { const a = parseInt(hex.slice(1), 16), b = parseInt(hex2.slice(1), 16), c = (s) => Math.round(((a >> s) & 255) * (1 - t) + ((b >> s) & 255) * t); return `rgb(${c(16)},${c(8)},${c(0)})`; };
const lum = (hex) => { const n = parseInt(hex.slice(1), 16); return (((n >> 16) & 255) * 0.3 + ((n >> 8) & 255) * 0.59 + (n & 255) * 0.11) / 255; };
const line = (hex) => (lum(hex) > 0.7 ? cool(hex, 0.6, 0.25) : lum(hex) < 0.18 ? '#3a2a48' : cool(hex, 0.46, 0.28));
const rgb = (hex) => { if (hex[0] !== '#') { const m = hex.match(/\d+/g); return m.slice(0, 3).map(Number); } const n = parseInt(hex.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const hx = (r, g, b) => '#' + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
const cool = (hex, k = 0.72, t = 0.22) => { const [r, g, b] = rgb(hex); return hx(r * k * (1 - t) + 74 * t, g * k * (1 - t) + 48 * t, b * k * (1 - t) + 128 * t); };
const warm = (hex, k = 1.25) => { const [r, g, b] = rgb(hex); return hx(r + (255 - r) * (k - 1) + 8, g + (255 - g) * (k - 1) + 3, b + (255 - b) * (k - 1) - 6); };
// draw onto a layer of its own, then light it (post paints only where the layer has paint) and lay it down
function layer(g, fn, post) {
  const C = document.createElement('canvas'); C.width = g.canvas.width; C.height = g.canvas.height; const l = C.getContext('2d'); l.setTransform(g.getTransform()); l.lineJoin = l.lineCap = 'round';
  fn(l); if (post) { l.save(); l.globalCompositeOperation = 'source-atop'; post(l); l.restore(); }
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(C, 0, 0); g.restore();
}
// soft light from the upper left, shadow toward the lower right
function lightFall(g, x0, y0, x1, y1, a = 0.2, b = 0.28) { const gr = g.createLinearGradient(x0, y0, x1, y1); gr.addColorStop(0, `rgba(255,244,226,${a})`); gr.addColorStop(0.45, 'rgba(255,255,255,0)'); gr.addColorStop(1, `rgba(40,24,80,${b})`); g.fillStyle = gr; g.fillRect(-60, -60, 320, 320); }
const inkHair = (h) => (lum(h) < 0.2 && Math.max(...rgb(h)) - Math.min(...rgb(h)) < 28 ? hx(...rgb(mix(h, '#3a3a7a', 0.6))) : h);
const EXPR = { '平': 'n', '笑': 'smile', '喜': 'grin', '怒': 'angry', '悲': 'sad', '驚': 'surprise', '痛': 'pain', '冷': 'cold', '羞': 'shy', '決': 'det', '閉': 'closed', '哭': 'cry' };
export const exprOf = (e) => EXPR[e] || e || 'n';
// hair styles: what's behind the head, the fringe, how much volume on top
const HAIR = {
  messy: { back: 'nape', fringe: 'messy', vol: 1.06 }, pony: { back: 'pony', fringe: 'side', vol: 1.02 }, wild: { back: 'mane', fringe: 'spiky', vol: 1.14 }, short: { back: 'nape', fringe: 'short', vol: 1.0 },
  crown: { back: 'long', fringe: 'parted', vol: 1.03, braid: 1 }, long: { back: 'tail', fringe: 'swept', vol: 1.03 }, veil: { back: 'none', fringe: 'parted', vol: 1, veil: 'nun' }, scruffy: { back: 'nape', fringe: 'messy', vol: 1.06 },
  buzz: { back: 'none', fringe: 'buzz', vol: 1.0 }, cap: { back: 'nape', fringe: 'messy', vol: 1.02, cap: 1 }, flow: { back: 'long', fringe: 'swept', vol: 1.05 }, shortf: { back: 'bobshort', fringe: 'side', vol: 1.03 },
  twin: { back: 'twin', fringe: 'straight', vol: 1.03 }, tied: { back: 'tail', fringe: 'parted', vol: 1.02 }, bob: { back: 'bob', fringe: 'straight', vol: 1.04 }, curly: { back: 'nape', fringe: 'curly', vol: 1.1 },
  bandana: { back: 'nape', fringe: 'messy', vol: 1.02, bandana: 1 }, spiky: { back: 'mane', fringe: 'spiky', vol: 1.1 }, tailm: { back: 'tail', fringe: 'spiky', vol: 1.05 }, longwhite: { back: 'long', fringe: 'swept', vol: 1.04 },
  longf: { back: 'long', fringe: 'straight', vol: 1.03 }, braids: { back: 'braids', fringe: 'side', vol: 1.04 }, viking: { back: 'braids', fringe: 'swept', vol: 1.06 }, oldf: { back: 'bun', fringe: 'parted', vol: 1.0 },
  bald: { back: 'none', fringe: 'none', vol: 1.0 }, slick: { back: 'nape', fringe: 'slick', vol: 1.02 }, hood: { back: 'none', fringe: 'messy', vol: 1.0, hood: 1 }, judge: { back: 'wig', fringe: 'slick', vol: 1.08 },
  kid: { back: 'bobshort', fringe: 'straight', vol: 1.05 }, helm: { back: 'none', fringe: 'none', vol: 1.0, helm: 1 }, bun: { back: 'bun', fringe: 'parted', vol: 1.02 },
};
const OUT = { coat: 'coat', hunter: 'hood', vest: 'vest', armor: 'armor', gown: 'gown', knightcoat: 'coat', nun: 'nun', robe: 'robe', worker: 'shirt', rags: 'shirt', actor: 'coat', flight: 'armorlite', scholar: 'robe', xuan: 'robe', noble: 'coat', outlaw: 'vest', bare: 'bare', acrobat: 'vest', count: 'coat', merc: 'armorlite', holy: 'robe', fur: 'fur', shaman: 'fur', royal: 'coat', inquis: 'coat', judge: 'robe', pirate: 'coat', assassin: 'hood', dress: 'gown' };
const FANCY = { knightcoat: 1, royal: 1, inquis: 1, count: 1, noble: 1, pirate: 1 };
// eye shapes: height, slant of the outer corner (up is positive), how round the lid is, iris size
const EYES = {
  round: { h: 1, slant: 0, iris: 1 }, big: { h: 1.15, slant: -0.02, iris: 1.08 }, pretty: { h: 1.08, slant: 0.04, iris: 1.04, lash: 1 }, noble: { h: 0.96, slant: 0.06, iris: 1, lash: 1 },
  sharp: { h: 0.74, slant: 0.2, iris: 0.94 }, cat: { h: 0.84, slant: 0.24, iris: 0.96, lash: 1 }, stern: { h: 0.7, slant: 0.12, iris: 0.9, heavy: 1 }, cold: { h: 0.7, slant: 0.14, iris: 0.92 },
  wild: { h: 0.8, slant: 0.22, iris: 0.82 }, soft: { h: 1.02, slant: -0.1, iris: 1.04 }, kind: { h: 0.92, slant: -0.12, iris: 1 }, warm: { h: 0.95, slant: -0.06, iris: 1 },
  calm: { h: 0.82, slant: -0.02, iris: 0.98, heavy: 1 }, tired: { h: 0.68, slant: -0.08, iris: 0.94, heavy: 1 }, gold: { h: 0.9, slant: 0.1, iris: 1, lash: 1 }, empty: { h: 1, slant: -0.04, iris: 1.04, empty: 1 },
};
let FLIP = false;

export function portrait(p, expr = 'n', size = 192, flip = false) {
  const ex = exprOf(expr), key = JSON.stringify(p) + ex + size + flip; if (CACHE.has(key)) return CACHE.get(key);
  const c = document.createElement('canvas'); c.width = c.height = size; const g = c.getContext('2d');
  g.scale(size / 192, size / 192); if (flip) { g.translate(192, 0); g.scale(-1, 1); } FLIP = flip; g.translate(96, 110); g.scale(1.16, 1.16); g.translate(-96, -110);
  g.lineJoin = 'round'; g.lineCap = 'round';
  draw(g, p, ex);
  g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-atop';
  const fade = g.createLinearGradient(0, size * 0.62, 0, size); fade.addColorStop(0, 'rgba(30,20,50,0)'); fade.addColorStop(1, 'rgba(30,20,50,0.22)'); g.fillStyle = fade; g.fillRect(0, 0, size, size);
  g.globalCompositeOperation = 'source-over'; watercolor(c, { scale: size / 192 }); CACHE.set(key, c); return c;
}
// ---------------------------------------------------------------- small drawing helpers
function path(g, pts, close = true) { g.beginPath(); add(g, pts); if (close) g.closePath(); }
function add(g, pts) { g.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) { const p = pts[i]; if (p.length === 4) g.quadraticCurveTo(p[0], p[1], p[2], p[3]); else if (p.length === 6) g.bezierCurveTo(p[0], p[1], p[2], p[3], p[4], p[5]); else g.lineTo(p[0], p[1]); } }
function ink(g, fill, stroke, w = 1.6) { if (fill) { g.fillStyle = fill; g.fill(); } if (stroke) { g.strokeStyle = stroke; g.lineWidth = w; g.stroke(); } }
function stroke(g, pts, col, w) { path(g, pts, false); g.strokeStyle = col; g.lineWidth = w; g.stroke(); }
// a group of shapes drawn as one: outline the outside only (thick stroke underneath, fill over it)
// (each shape is filled on its own on a separate layer, so overlapping shapes never cancel out; inside() paints shading
// on that layer, where it lands only on the shapes)
function group(g, shapes, fill, col, w = 1.7, inside) {
  g.beginPath(); for (const s of shapes) { add(g, s); g.closePath(); } g.strokeStyle = col; g.lineWidth = w * 2; g.stroke();
  const L = document.createElement('canvas'); L.width = g.canvas.width; L.height = g.canvas.height; const l = L.getContext('2d'); l.setTransform(g.getTransform()); l.lineJoin = l.lineCap = 'round';
  l.fillStyle = fill; for (const s of shapes) { l.beginPath(); add(l, s); l.closePath(); l.fill(); }
  if (inside) { l.globalCompositeOperation = 'source-atop'; inside(l); }
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(L, 0, 0); g.restore();
}
function groupPath(g, shapes) { g.beginPath(); for (const s of shapes) { add(g, s); g.closePath(); } }
// a lock of hair: from a root (width w) to a pointed tip, bowed sideways by b
function lock(rx, ry, tx, ty, w, b) { const dy = ty - ry, dx = tx - rx; return [[rx - w / 2, ry], [rx - w / 2 + dx * 0.35 + b * 0.5, ry + dy * 0.5, tx - w * 0.3 + b * 0.6, ty - dy * 0.22, tx, ty], [tx + w * 0.3 + b * 0.3, ty - dy * 0.3, rx + w / 2 + dx * 0.35 + b * 0.4, ry + dy * 0.45, rx + w / 2, ry]]; }
function blob(x, y, rx, ry) { return [[x - rx, y], [x - rx, y - ry * 1.1, x + rx, y - ry * 1.1, x + rx, y], [x + rx, y + ry * 1.1, x - rx, y + ry * 1.1, x - rx, y]]; }

// ---------------------------------------------------------------- the whole portrait
function draw(g, p, ex) {
  const H = HAIR[p.hair] || HAIR.short, f = p.g === 'f', old = p.age >= 50, kid = p.age <= 13;
  const G = geo(p, f, kid, H), hc = inkHair(p.hc || '#5a3a20'), skin = p.skin || '#f0c8a8';
  G.f = f; G.kid = kid; G.old = old; G.skinLine = mix(skin, '#7a3a5a', 0.55); G.skinShade = mix(skin, '#c0647a', 0.24); G.skinDeep = mix(skin, '#8a4062', 0.4);
  // ---- behind everything: hair falling down the back, hoods and veils
  if (H.hood || p.out === 'hunter' || p.out === 'assassin') hoodBack(g, p, G);
  if (H.veil === 'nun' || p.veil) veilBack(g, p, G, H);
  if (!H.helm && !H.hood && H.veil !== 'nun') backHair(g, H, p, G, hc);
  // ---- neck, body, then the face
  neck(g, p, G, skin);
  layer(g, (l) => body(l, p, OUT[p.out] || 'shirt', G), (l) => { lightFall(l, G.cx - 90, G.ey + 40, G.cx + 70, 210, 0.24, 0.16); rim(l, G); });
  face(g, p, G, skin, H, ex);
  // ---- hair in front, then hats and other things on top
  if (!H.helm && !H.hood) frontHair(g, H, p, G, hc);
  else if (H.hood) { frontHair(g, { ...H, back: 'none' }, p, G, hc, 0.55); }
  extras(g, p, H, G, ex, hc);
  if (H.hood || p.out === 'hunter' || p.out === 'assassin') hoodFront(g, p, G);
}
// a fine line of warm light along the upper-left edges of what's on the layer
function rim(l, G) { l.save(); l.globalCompositeOperation = 'source-atop'; const gr = l.createLinearGradient(G.cx - 80, 0, G.cx + 40, 0); gr.addColorStop(0, 'rgba(255,236,200,0.5)'); gr.addColorStop(1, 'rgba(255,236,200,0)'); l.fillStyle = gr; l.fillRect(-60, -60, 200, 320); l.restore(); }
function geo(p, f, kid, H) {
  const cx = 92, ey = kid ? 100 : 94, fw = kid ? 30 : f ? 30.5 : 31.5, mid = cx + 8;
  const chin = ey + (kid ? 36 : f ? 42 : 46);
  return { cx, ey, fw, mid, chin, hl: ey - 31, top: ey - 68 - (H.vol - 1) * 40, nearEye: mid - (f ? 17.5 : 18), farEye: mid + (f ? 15.5 : 16), mx: mid + 2, my: ey + (kid ? 25 : f ? 29 : 31.5) };
}
function facePath(g, G) {
  const { cx, ey, fw, chin, f, kid } = G, soft = f || kid;
  g.beginPath(); g.moveTo(cx - fw, ey - 36);
  g.bezierCurveTo(cx - fw - 2, ey - 8, cx - fw - 1, ey + 10, cx - fw + (soft ? 6 : 4.5), ey + (soft ? 22 : 25));
  g.bezierCurveTo(cx - fw + 14, ey + (soft ? 34 : 37), cx + 2, chin - 1.5, cx + 7.5, chin);
  g.bezierCurveTo(cx + 12, chin - 1.5, cx + fw - 6, ey + (soft ? 30 : 32), cx + fw - 2, ey + 19);
  g.bezierCurveTo(cx + fw + 1.5, ey + 10, cx + fw + 3, ey - 2, cx + fw + 1, ey - 10);
  g.lineTo(cx + fw, ey - 36); g.bezierCurveTo(cx + fw, ey - 76, cx - fw, ey - 76, cx - fw, ey - 36); g.closePath();
}
// ---------------------------------------------------------------- neck and face
function neck(g, p, G, skin) {
  const { cx, ey } = G, x = cx + 5, w = G.f || G.kid ? 8 : 10;
  path(g, [[x - w - 1, ey + 14], [x - w, ey + 48, x - w - 4, ey + 64], [x + w + 6, ey + 64], [x + w + 2, ey + 46, x + w + 1, ey + 14]]); ink(g, skin, G.skinLine, 1.5);
  g.save(); path(g, [[x - w - 1, ey + 14], [x - w, ey + 48, x - w - 4, ey + 64], [x + w + 6, ey + 64], [x + w + 2, ey + 46, x + w + 1, ey + 14]]); g.clip();
  // the shadow the jaw throws on the neck, and the far side of the neck
  path(g, [[x - 30, ey + 10], [x - 30, ey + 32], [x - 12, ey + 40, x + 4, G.chin + 9], [x + 14, G.chin + 6, x + 30, ey + 26], [x + 30, ey + 10]]); g.fillStyle = G.skinShade; g.fill();
  g.fillRect(x + w - 3, ey + 14, 10, 60);
  if (!G.f && !G.kid) stroke(g, [[x + 1, ey + 44], [x + 3, ey + 50, x + 2, ey + 54]], G.skinLine, 1.1);
  g.restore();
  if (p.brand) { g.save(); g.fillStyle = '#8a3a2a'; g.font = 'bold 7px serif'; g.textAlign = 'center'; g.translate(x - 1, ey + 52); if (FLIP) g.scale(-1, 1); g.fillText('4601', 0, 0); g.restore(); }
}
function face(g, p, G, skin, H, ex) {
  const { cx, ey, fw, chin, mid } = G;
  // the ear on the near side
  path(g, [[cx - fw + 1, ey - 6], [cx - fw - 6.5, ey - 10, cx - fw - 8, ey + 8, cx - fw + 1, ey + 11]]); ink(g, skin, G.skinLine, 1.1);
  stroke(g, [[cx - fw - 1, ey - 3], [cx - fw - 5, ey - 3, cx - fw - 4.5, ey + 5, cx - fw - 0.5, ey + 6]], G.skinShade, 1.3);
  facePath(g, G); ink(g, skin, G.skinLine, 1.25);
  g.save(); facePath(g, G); g.clip(); g.filter = `blur(${1.6 * g.getTransform().a}px)`;
  // cel shading: the far cheek, under the fringe, the nose
  path(g, [[cx + fw - 3, ey - 44], [cx + fw + 0.5, ey - 4, cx + fw - 4, ey + 22, cx + 11, chin + 1], [cx + fw + 12, chin + 2], [cx + fw + 12, ey - 44]]); g.fillStyle = G.skinShade; g.globalAlpha = 0.55; g.fill(); g.globalAlpha = 1;
  path(g, [[cx - 20, chin - 10], [cx + 4, chin - 2, cx + 26, chin - 12], [cx + 26, chin + 4], [cx - 20, chin + 4]]); g.fillStyle = G.skinShade; g.globalAlpha = 0.35; g.fill(); g.globalAlpha = 1;
  if (H.fringe !== 'none' && H.fringe !== 'buzz' && !H.helm) { g.save(); g.translate(2.5, 6); g.beginPath(); for (const s of fringeShapes(H, p, G)) { add(g, s); g.closePath(); } g.fillStyle = G.skinShade; g.fill(); g.restore(); }
  if (H.fringe === 'buzz' || H.fringe === 'slick') { g.fillStyle = G.skinShade; g.fillRect(cx - fw - 4, ey - 50, fw * 2 + 8, 14); }
  
  // a soft glow on the near cheek
  { const fg = g.createLinearGradient(0, ey - 40, 0, G.chin); fg.addColorStop(0, 'rgba(120,60,90,0.06)'); fg.addColorStop(1, 'rgba(255,240,230,0.12)'); g.fillStyle = fg; g.fillRect(cx - 60, ey - 80, 140, 160); }
  const gl = g.createRadialGradient(cx - 14, ey + 10, 1, cx - 14, ey + 10, 18); gl.addColorStop(0, 'rgba(255,255,255,0.26)'); gl.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gl; g.fillRect(cx - 40, ey - 10, 50, 40);
  g.restore();
  // blush: a rosy patch with hatching, stronger when shy
  if (ex !== 'cold' && !p.mask && !G.old) {
    const a = (ex === 'shy' ? 0.5 : ex === 'smile' || ex === 'grin' ? 0.3 : 0.2) * (G.f || G.kid || ex === 'shy' ? 1 : 0.45);
    for (const [x, y, r] of [[G.nearEye - 3, ey + 14, 9], [G.farEye + 4, ey + 13, 6.5]]) { const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(240,100,110,${a})`); gr.addColorStop(1, 'rgba(240,100,110,0)'); g.fillStyle = gr; g.beginPath(); g.ellipse(x, y, r * 1.3, r * 0.75, 0, 0, 7); g.fill(); if (ex === 'shy' || G.f && ex !== 'angry') { g.strokeStyle = `rgba(200,70,80,${ex === 'shy' ? 0.7 : 0.35})`; g.lineWidth = 1; for (let k = -1; k <= 1; k++) { g.beginPath(); g.moveTo(x + k * 4 - 1.5, y + 2.5); g.lineTo(x + k * 4 + 1.5, y - 2.5); g.stroke(); } } }
  }
  if (p.freckles) { g.fillStyle = shade(skin, 0.68); for (const [x, y] of [[-6, 11], [-2, 14], [-9, 15], [4, 12], [-4, 17], [8, 13], [11, 15]]) { g.beginPath(); g.arc(G.nearEye + 8 + x * 1.2, ey + y, 0.9, 0, 7); g.fill(); } }
  if (p.paint) { g.fillStyle = p.paint; for (const x of [G.nearEye, G.farEye]) { path(g, [[x - 8, ey + 12], [x + 6, ey + 10], [x + 5, ey + 13], [x - 7, ey + 15]]); g.fill(); path(g, [[x - 6, ey + 18], [x + 4, ey + 16], [x + 3, ey + 19], [x - 5, ey + 21]]); g.fill(); } }
  if (G.old) { for (const s of [[[G.nearEye - 9, ey + 8], [G.nearEye - 2, ey + 11, G.nearEye + 6, ey + 9]], [[mid - 9, ey + 18], [mid - 13, ey + 24, mid - 9, ey + 30]], [[mid + 13, ey + 17], [mid + 16, ey + 22, mid + 14, ey + 28]], [[G.nearEye - 14, ey - 2], [G.nearEye - 16, ey + 2, G.nearEye - 14, ey + 5]]]) stroke(g, s, G.skinDeep, 1.1); }
  eyes(g, p, ex, G);
  nose(g, G);
  mouth(g, p, ex, G);
  if (p.stubble) { g.save(); facePath(g, G); g.clip(); g.fillStyle = 'rgba(60,40,50,0.07)'; path(g, [[cx - fw, ey + 12], [cx - fw + 6, ey + 30, cx + 8, chin + 2], [cx + fw - 2, ey + 26, cx + fw, ey + 12], [cx + fw - 6, ey + 26, mid + 12, ey + 22], [mid, ey + 20, mid - 12, ey + 22], [cx - fw + 6, ey + 24, cx - fw, ey + 12]]); g.fill(); g.fillStyle = 'rgba(50,30,40,0.3)'; for (let k = 0; k < 70; k++) { const t = k / 40, x = cx - fw + 8 + t * (fw * 2 - 10), y = ey + 22 + Math.sin(t * Math.PI) * 13 + (k * 7 % 9); g.fillRect(x, y, 0.8, 0.8); } g.restore(); }
  if (p.beard) beard(g, p, G);
  scars(g, p, G);
}
function nose(g, G) {
  const { mid, ey } = G;
  g.fillStyle = G.skinShade; g.globalAlpha = 0.7; path(g, [[mid + 1.5, ey + 10], [mid + 4.2, ey + 16.5], [mid + 0.5, ey + 17]]); g.fill(); g.globalAlpha = 1;
  stroke(g, [[mid + 3, ey + 14.5], [mid + 4.4, ey + 16.6, mid + 2, ey + 17.2]], G.skinLine, 1);
}
// ---------------------------------------------------------------- eyes
function eyes(g, p, ex, G) {
  const E = EYES[p.eye] || EYES.round, ec = p.ec || '#5a4a3a', { ey, f, kid } = G;
  const W = (f ? 11.4 : 11.8) * (kid ? 1.04 : 1), H0 = (f ? 13.4 : 10.4) * (kid ? 1.14 : 1) * E.h * (G.old ? 0.85 : 1);
  const open = { closed: 0, grin: 0, surprise: 1.22, smile: 0.78, angry: 0.74, cold: 0.62, det: 0.82, pain: 0.42, sad: 0.86, cry: 0.8, shy: 0.86 }[ex] ?? 1;
  const look = ex === 'cold' || ex === 'shy' ? 1.6 : ex === 'sad' ? 0.4 : 0.8, lift = ex === 'sad' || ex === 'cry' ? -0.1 : ex === 'angry' ? 0.16 : ex === 'det' ? 0.08 : 0;
  for (const [x0, sd, sx] of [[G.nearEye, -1, 1], [G.farEye, 1, 0.84]]) {
    if (p.patch && sd === 1) { patch(g, x0, ey, W, H0, G); continue; }
    const w = W * sx, h = H0 * open, s = E.slant + lift, y = ey;
    if (open === 0 || (ex === 'pain' && sd === 1)) { // shut: happy arcs, or the lids pressed together
      g.strokeStyle = LASH; g.lineWidth = f ? 2.8 : 2.4; g.beginPath();
      if (ex === 'grin' || ex === 'smile') { g.moveTo(x0 - w, y + 2); g.quadraticCurveTo(x0, y - 7, x0 + w, y + 2); }
      else if (ex === 'pain') { g.moveTo(x0 + sd * w, y - 4); g.lineTo(x0 - sd * w * 0.6, y + 1); g.lineTo(x0 + sd * w, y + 4); }
      else { g.moveTo(x0 - w, y - 1); g.quadraticCurveTo(x0, y + 5, x0 + w, y - 1); if (f) { g.moveTo(x0 + sd * w, y - 1); g.lineTo(x0 + sd * (w + 3), y + 1); } }
      g.stroke(); if (ex === 'cry') tears(g, x0, y + 3, sd, w); continue;
    }
    g.save(); g.translate(x0, y);
    // the opening of the eye: high toward the outer corner, a flatter lower lid
    const oy = -h * (0.42 + s + (f ? 0 : 0.06)), iy = h * 0.42;
    const shape = [[-sd * w, iy * 0.6], [-sd * w * 0.7, -h * 0.9, sd * w * 0.4, -h * 1.08, sd * w, oy], [sd * w * 0.9, iy * 0.9, sd * w * 0.2, h * 0.62, -sd * w, iy * 0.6]];
    path(g, shape); g.fillStyle = '#fbfbff'; g.fill();
    g.save(); path(g, shape); g.clip();
    g.fillStyle = 'rgba(120,120,170,0.28)'; g.fillRect(-w - 2, -h * 1.3, w * 2 + 4, h * 0.75);
    // the iris: tall, dark at the top under the lid, light at the bottom, with a ring, a pupil and catchlights
    const ir = (f ? 7.6 : 7.0) * E.iris * (kid ? 1.08 : 1) * (sx < 1 ? 0.92 : 1), irh = ir * (f ? 1.32 : 1.22) * (ex === 'surprise' ? 0.92 : 1), ix = sd * 0.6 + look, icy = h * 0.06;
    const gr = g.createLinearGradient(0, icy - irh, 0, icy + irh); gr.addColorStop(0, cool(ec, 0.3, 0.2)); gr.addColorStop(0.4, cool(ec, 0.85, 0.1)); gr.addColorStop(0.72, warm(ec, 1.25)); gr.addColorStop(1, warm(ec, 1.6));
    g.beginPath(); g.ellipse(ix, icy, ir, irh, 0, 0, 7); g.fillStyle = gr; g.fill(); g.strokeStyle = shade(ec, 0.35); g.lineWidth = 1.1; g.stroke();
    if (!E.empty) {
      g.save(); g.beginPath(); g.ellipse(ix, icy, ir, irh, 0, 0, 7); g.clip(); g.strokeStyle = warm(ec, 1.5); g.globalAlpha = 0.35; g.lineWidth = 0.6; for (let k = 0; k < 14; k++) { const a = k / 14 * Math.PI * 2; g.beginPath(); g.moveTo(ix + Math.cos(a) * ir * 0.3, icy + Math.sin(a) * irh * 0.3); g.lineTo(ix + Math.cos(a) * ir, icy + Math.sin(a) * irh); g.stroke(); }
      g.globalAlpha = 0.55; const gl2 = g.createRadialGradient(ix, icy + irh * 0.7, 0, ix, icy + irh * 0.7, ir * 1.1); gl2.addColorStop(0, warm(ec, 1.9)); gl2.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gl2; g.fillRect(ix - ir, icy - irh, ir * 2, irh * 2); g.globalAlpha = 1; g.restore();
      g.fillStyle = shade(ec, 0.2); g.beginPath(); g.ellipse(ix, icy - irh * 0.05, ir * (ex === 'surprise' ? 0.3 : 0.42), irh * (ex === 'surprise' ? 0.34 : 0.48), 0, 0, 7); g.fill();
      g.strokeStyle = shade(ec, 1.6); g.globalAlpha = 0.7; g.lineWidth = 1.3; g.beginPath(); g.ellipse(ix, icy + irh * 0.15, ir * 0.62, irh * 0.62, 0, 0.35 * Math.PI, 0.75 * Math.PI); g.stroke(); g.globalAlpha = 1;
      g.fillStyle = '#ffffff'; g.beginPath(); g.ellipse(ix - sd * ir * 0.38, icy - irh * 0.42, ir * 0.36, irh * 0.26, -0.5, 0, 7); g.fill();
      g.beginPath(); g.arc(ix + sd * ir * 0.42, icy + irh * 0.42, ir * 0.15, 0, 7); g.fill();
      g.globalAlpha = 0.7; g.beginPath(); g.arc(ix - sd * ir * 0.05, icy - irh * 0.12, ir * 0.1, 0, 7); g.fill(); g.globalAlpha = 1;
    } else { g.fillStyle = 'rgba(255,255,255,0.35)'; g.beginPath(); g.ellipse(ix, icy - irh * 0.4, ir * 0.5, irh * 0.18, 0, 0, 7); g.fill(); }
    g.fillStyle = 'rgba(60,30,90,0.26)'; path(g, [[-w - 2, -h * 1.3], [w + 2, -h * 1.3], [w + 2, -h * 0.35], [0, -h * 0.55, -w - 2, -h * 0.3]]); g.fill();
    g.restore();
    // the upper lash line: a thick tapering stroke, a wing at the outer corner; a short lower lid line
    const lw = (f ? 3.6 : 3.1) * (E.heavy ? 1.12 : 1);
    path(g, [[-sd * (w + 1), iy * 0.6 + 0.5], [-sd * w * 0.7, -h * 0.9 - 0.6, sd * w * 0.4, -h * 1.08 - 0.6, sd * (w + 1.5), oy - 0.5], [sd * (w + (f ? 4 : 2)), oy + (f ? 1.5 : 1)], [sd * w * 0.4, -h * 1.08 + lw, -sd * w * 0.7, -h * 0.9 + lw * 0.7, -sd * (w - 1), iy * 0.6 + 1]]); { const lg = g.createLinearGradient(-sd * w, 0, sd * w, 0); lg.addColorStop(0, LASH); lg.addColorStop(0.6, LASH); lg.addColorStop(1, mix(p.hc || '#3a2a1a', '#3a1418', 0.55)); g.fillStyle = lg; } g.fill();
    if (f || E.lash) { g.strokeStyle = LASH; g.lineWidth = 1.4; for (const [a, b, c2, d] of [[0.75, -0.2, 1.22, -0.45], [0.95, 0.15, 1.34, 0.1]]) { g.beginPath(); g.moveTo(sd * w * a, oy + (b + 0.5) * h * 0.3); g.lineTo(sd * w * c2, oy + d * h * 0.3 - 1); g.stroke(); } }
    g.strokeStyle = mix(p.skin || '#f0c8a8', '#5a2a30', 0.55); g.lineWidth = 1.2; g.beginPath(); g.moveTo(sd * (w - 0.5), oy + h * 0.6); g.quadraticCurveTo(sd * w * 0.5, h * 0.66, -sd * w * 0.15, h * 0.64); g.stroke();
    // the crease of the eyelid above
    if (!E.heavy || f) { g.strokeStyle = G.skinLine; g.globalAlpha = 0.65; g.lineWidth = 1; g.beginPath(); g.moveTo(-sd * w * 0.35, -h * 1.12 - 3); g.quadraticCurveTo(sd * w * 0.35, -h * 1.3 - 3, sd * (w + 1), oy - 4); g.stroke(); g.globalAlpha = 1; }
    if (E.heavy) { g.strokeStyle = G.skinLine; g.lineWidth = 1.1; g.beginPath(); g.moveTo(-sd * w * 0.6, -h - 3.5); g.quadraticCurveTo(0, -h - 5.5, sd * w, oy - 3); g.stroke(); }
    if (G.old) { g.strokeStyle = G.skinDeep; g.lineWidth = 1; g.beginPath(); g.moveTo(-sd * w * 0.5, h * 0.9 + 2); g.quadraticCurveTo(sd * w * 0.2, h * 1.1 + 3, sd * w * 0.8, h * 0.7 + 2); g.stroke(); }
    g.restore();
    if (ex === 'cry' || ex === 'sad' && f) tears(g, x0, y + h * 0.6, sd, w, ex === 'cry');
  }
  // brows: thin and tapering for women, bolder for men, set by the expression
  const bt = { angry: 0.42, det: 0.26, cold: 0.1, sad: -0.36, cry: -0.36, pain: -0.28, surprise: -0.08, shy: -0.2 }[ex] ?? (p.eye === 'stern' || p.eye === 'sharp' || p.eye === 'wild' ? 0.14 : p.eye === 'kind' || p.eye === 'soft' ? -0.1 : 0);
  const by = ey - H0 * (ex === 'surprise' ? 1.25 : 1) - (f ? 9 : 7.5) - (ex === 'surprise' ? 4 : 0), bc = shade(p.hc || '#3a2a1a', lum(p.hc || '#3a2a1a') > 0.7 ? 0.6 : 0.62), bw = f ? 1.8 : 3.4;
  for (const [x, sd, sx] of [[G.nearEye, -1, 1], [G.farEye, 1, 0.82]]) {
    const ix = x - sd * 9 * sx, ox = x + sd * 11 * sx, iyy = by + bt * 7, oyy = by - bt * 3 + (f ? 1 : 0);
    path(g, [[ix, iyy + bw * 0.5], [x, by - 3 - bt * 2, ox, oyy], [x, by - 3 - bt * 2 + bw, ix, iyy - bw * 0.5]]); g.fillStyle = bc; g.fill(); g.strokeStyle = bc; g.lineWidth = 0.8; g.stroke();
  }
}
function tears(g, x, y, sd, w, run) {
  g.fillStyle = 'rgba(170,220,255,0.85)'; g.strokeStyle = 'rgba(90,150,210,0.9)'; g.lineWidth = 0.8;
  path(g, [[x - w * 0.8, y], [x, y + 3, x + w * 0.8, y], [x, y + 1.5, x - w * 0.8, y]]); g.fill();
  if (run) { path(g, [[x + sd * w * 0.5, y + 1], [x + sd * w * 0.7, y + 10, x + sd * w * 0.45, y + 20], [x + sd * w * 0.2, y + 10, x + sd * w * 0.5, y + 1]]); g.fill(); g.stroke(); g.fillStyle = '#ffffff'; g.beginPath(); g.arc(x + sd * w * 0.48, y + 8, 0.8, 0, 7); g.fill(); }
}
function patch(g, x, y, W, H0, G) {
  g.strokeStyle = '#1a1416'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(G.cx - G.fw - 2, y - 22); g.quadraticCurveTo(x - 8, y - 14, x, y - 9); g.moveTo(x + 6, y + 6); g.lineTo(G.cx + G.fw + 1, y + 4); g.stroke();
  path(g, [[x - W - 1, y - 6], [x - W, y - H0 - 2, x + W + 2, y - H0 - 3, x + W + 2, y - 2], [x + W, y + H0 + 3, x - W, y + H0 + 2, x - W - 1, y - 6]]); ink(g, '#221a1c', '#0e0a0c', 1.2);
  g.strokeStyle = 'rgba(255,255,255,0.25)'; g.lineWidth = 1.2; g.beginPath(); g.arc(x, y - 1, W * 0.6, Math.PI * 1.1, Math.PI * 1.5); g.stroke();
}
// ---------------------------------------------------------------- mouth
function mouth(g, p, ex, G) {
  const { mx, my, f } = G, lc = mix(p.skin || '#f0c8a8', '#4a1a22', 0.65), inside = '#7a2a34', tongue = '#d8707a';
  const open = (pts, teeth, tong = true) => { path(g, pts); g.fillStyle = inside; g.fill(); g.save(); path(g, pts); g.clip(); if (tong) { g.fillStyle = tongue; g.beginPath(); g.ellipse(mx + 1, my + 7, 6, 3.5, 0, 0, 7); g.fill(); } if (teeth) { g.fillStyle = '#ffffff'; g.fillRect(mx - 12, my - 6, 24, teeth); } g.restore(); path(g, pts); g.strokeStyle = lc; g.lineWidth = 1.3; g.stroke(); };
  if (ex === 'grin' || p.grin && ex === 'smile') { open([[mx - 7, my - 1.5], [mx, my + 0.2, mx + 7, my - 1.5], [mx + 5, my + 7.5, mx, my + 8], [mx - 5, my + 7.5, mx - 7, my - 1.5]], p.grin ? 5.8 : 4.8); return; }
  if (ex === 'smile') { stroke(g, [[mx - 5, my - 1], [mx, my + 3, mx + 5, my - 1]], lc, 1.3); return; }
  if (ex === 'surprise') { open([[mx - 3, my + 2], [mx - 3, my - 3, mx + 3, my - 3, mx + 3, my + 2], [mx + 3, my + 7, mx - 3, my + 7, mx - 3, my + 2]], 0); return; }
  if (ex === 'angry') { open([[mx - 7, my + 1], [mx, my - 3, mx + 7, my], [mx + 6, my + 6], [mx, my + 4.5, mx - 6, my + 6]], 3, false); g.strokeStyle = lc; g.lineWidth = 0.8; g.beginPath(); g.moveTo(mx - 6, my + 3); g.lineTo(mx + 6, my + 3); g.stroke(); return; }
  if (ex === 'pain') { path(g, [[mx - 7, my - 1], [mx + 7, my - 2], [mx + 6, my + 4], [mx - 6, my + 4]]); g.fillStyle = '#ffffff'; g.fill(); g.strokeStyle = lc; g.lineWidth = 1.2; g.stroke(); g.lineWidth = 0.8; g.beginPath(); g.moveTo(mx - 6.5, my + 1.5); g.lineTo(mx + 6.5, my + 1); for (const x of [-3, 0.5, 4]) { g.moveTo(mx + x, my - 1.5); g.lineTo(mx + x, my + 4); } g.stroke(); return; }
  if (ex === 'sad' || ex === 'cry') { if (ex === 'cry') { open([[mx - 5, my + 2], [mx, my - 1.5, mx + 5, my + 2], [mx, my + 4.5, mx - 5, my + 2]], 0); return; } stroke(g, [[mx - 4, my + 1.2], [mx, my - 1.2, mx + 4, my + 1.2]], lc, 1.2); return; }
  if (ex === 'cold') { stroke(g, [[mx - 4, my], [mx + 4, my]], lc, 1.15); return; }
  if (ex === 'shy') { stroke(g, [[mx - 3.5, my + 0.6], [mx - 1.2, my - 0.8, mx, my + 0.4], [mx + 1.2, my + 1.6, mx + 3.5, my + 0.6]], lc, 1.1); return; }
  if (ex === 'det') { stroke(g, [[mx - 4.6, my + 0.4], [mx, my - 0.6, mx + 4.6, my + 0.4]], lc, 1.35); return; }
  stroke(g, [[mx - (f ? 3.6 : 4.4), my], [mx, my + 1.1, mx + (f ? 3.6 : 4.4), my]], lc, 1.2);
  if (f) { g.fillStyle = 'rgba(220,110,120,0.32)'; g.beginPath(); g.ellipse(mx, my + 2.8, 2.6, 0.9, 0, 0, 7); g.fill(); }
}
function beard(g, p, G) {
  // sideburns down the jaw into a beard hanging from the chin (to a long point for the proud ones), the cheeks left clear
  const b = p.beard, long = p.longBeard || p.braidBeard, { cx, ey, fw, chin, mid, mx, my } = G, bl = line(b), low = long ? chin + 44 : chin + 9;
  const tips = [], n = long ? 8 : 6;
  for (let i = 0; i <= n; i++) { const t = i / n, x = cx - fw + 5 + t * (fw * 2 - 8), d = Math.sin(Math.pow(t, 1.15) * Math.PI); tips.push([x + (i % 2 ? 0 : (t - 0.5) * 3), (i % 2 ? -5 : 0) + chin - 6 + d * (low - chin + 6) + (i === 0 || i === n ? -8 : 0)]); }
  const shape = [[cx - fw - 1, ey - 8], [cx - fw - 1, ey + 12, ...tips[0]], ...tips.slice(1), [cx + fw + 1, ey + 14, cx + fw + 1, ey - 8], [cx + fw - 3, ey - 7], [cx + fw - 4, ey + 14, mid + 11, my + 6], [mid, my + 9, mid - 11, my + 6], [cx - fw + 6, ey + 14, cx - fw + 3, ey - 7]];
  group(g, [shape], b, bl, 1.3, (g) => { const bg2 = g.createLinearGradient(0, ey, 0, low); bg2.addColorStop(0, cool(b, 0.82, 0.16)); bg2.addColorStop(0.5, b); bg2.addColorStop(1, warm(b, 1.18)); g.fillStyle = bg2; g.fillRect(cx - 80, ey - 20, 200, 160); g.fillStyle = cool(b, 0.72, 0.2); g.fillRect(cx + fw - 10, ey - 20, 40, 140);
    for (let k = 0; k < 13; k++) { const t = k / 12, x = cx - fw + 8 + t * (fw * 2 - 14); stroke(g, [[x, my + 4 + Math.abs(t - 0.5) * 10], [x + (cx + 8 - x) * 0.2, (my + low) / 2, x + (cx + 8 - x) * 0.55, low - 6 - Math.abs(t - 0.5) * 24]], k % 3 ? cool(b, 0.68, 0.2) : warm(b, 1.35), k % 3 ? 0.9 : 1.2); } });
  // the moustache, drooping for a long beard, and the mouth showing through
  const dr = long ? 7 : 3;
  path(g, [[mx - 12, my + dr], [mx - 7, my - 6, mx, my - 3.5], [mx + 7, my - 6, mx + 12, my + dr], [mx + 6, my - 0.5, mx, my - 1], [mx - 6, my - 0.5, mx - 12, my + dr]]); ink(g, cool(b, 0.92, 0.1), bl, 1.1);
  stroke(g, [[mx - 8, my - 3], [mx - 3, my - 4.5, mx, my - 3]], warm(b, 1.4), 1);
  g.fillStyle = '#6a2a34'; g.beginPath(); g.ellipse(mx, my + 3, 3.6, 1.3, 0, 0, 7); g.fill();
  if (p.braidBeard) for (let k = 0; k < 4; k++) { g.beginPath(); g.ellipse(cx + 8, low - 2 + k * 7, 5 - k * 0.6, 4, 0, 0, 7); ink(g, shade(b, k % 2 ? 1 : 0.85), bl, 1.1); }
}
function scars(g, p, G) {
  const { ey, nearEye, farEye, mid, chin } = G, c = '#b0605a';
  const s = { cheek: [[nearEye - 10, ey + 6], [nearEye - 1, ey + 17]], brow: [[farEye - 2, ey - 22], [farEye + 6, ey - 8]], chin: [[mid + 2, chin - 6], [mid + 9, chin - 1]], eye: [[farEye - 3, ey - 22], [farEye + 5, ey + 16]] }[p.scar];
  if (!s) return; stroke(g, s, c, 1.8); g.strokeStyle = 'rgba(255,255,255,0.45)'; g.lineWidth = 0.8; g.beginPath(); g.moveTo(s[0][0] + 1, s[0][1]); g.lineTo(s[1][0] + 1, s[1][1]); g.stroke();
  if (p.scar === 'cheek') stroke(g, [[nearEye - 8, ey + 13], [nearEye - 3, ey + 10]], c, 1.2);
  if (p.tattoo) {}
}
// ---------------------------------------------------------------- hair
// the locks that hang over the forehead, for each fringe style: [root x, tip x (in face widths from the middle), tip depth below the hairline, width, bow]
const FRINGE = {
  spiky: [[-1.1, -1.35, 24, 22, -7], [-0.72, -0.86, 30, 22, -5], [-0.36, -0.46, 20, 20, -2], [0, 0.02, 31, 20, 2], [0.36, 0.42, 20, 20, 3], [0.7, 0.84, 28, 22, 5], [1.04, 1.24, 20, 20, 6]],
  messy: [[-1.1, -1.32, 30, 24, -8], [-0.7, -0.78, 22, 22, -5], [-0.32, -0.22, 32, 22, -1], [0.06, 0.2, 24, 20, 3], [0.42, 0.56, 31, 22, 4], [0.78, 0.98, 21, 22, 6], [1.06, 1.26, 28, 20, 6]],
  short: [[-1.1, -1.2, 18, 22, -5], [-0.65, -0.7, 22, 24, -3], [-0.22, -0.12, 17, 22, 0], [0.18, 0.32, 21, 22, 3], [0.6, 0.76, 16, 22, 4], [1.02, 1.18, 18, 20, 5]],
  parted: [[-0.08, -0.82, 24, 30, -10], [-0.42, -1.12, 32, 26, -8], [-0.92, -1.3, 40, 20, -4], [0.06, 0.72, 22, 30, 10], [0.38, 1.04, 30, 26, 8], [0.92, 1.28, 38, 20, 4]],
  side: [[-1.02, -1.24, 34, 22, -2], [-0.8, -0.52, 28, 26, 6], [-0.5, -0.02, 26, 28, 9], [-0.2, 0.44, 24, 26, 9], [0.16, 0.84, 28, 24, 8], [0.6, 1.14, 32, 20, 5], [1.02, 1.26, 28, 18, 3]],
  straight: [[-1.02, -1.12, 28, 20, -2], [-0.68, -0.72, 30, 20, 2], [-0.34, -0.35, 31, 20, -2], [0, 0.02, 31, 20, 2], [0.34, 0.37, 31, 20, -2], [0.68, 0.74, 30, 20, 2], [1.02, 1.14, 28, 20, 2]],
  swept: [[-1.02, -1.22, 38, 22, -3], [-0.72, -0.3, 32, 28, 8], [-0.36, 0.18, 34, 28, 10], [0, 0.68, 28, 26, 10], [0.4, 1.08, 34, 22, 7], [0.9, 1.3, 38, 18, 4]],
  curly: [[-1.1, -1.3, 22, 24, -10], [-0.7, -0.6, 26, 24, 9], [-0.3, -0.36, 20, 22, -9], [0.1, 0.24, 26, 22, 9], [0.5, 0.48, 20, 22, -8], [0.9, 1.12, 24, 22, 9]],
  slick: [[0.5, 0.7, 22, 7, 5], [0.8, 1.0, 14, 6, 4]],
};
function crownPath(H, G) {
  const { cx, ey, fw, hl } = G, rx = (fw + 11) * H.vol, ry = 46 * H.vol, cyh = ey - 24;
  const pts = []; for (let k = 0; k <= 16; k++) { const a = Math.PI * (0.94 + k / 16 * 1.12); pts.push([cx + 2 + Math.cos(a) * rx, cyh + Math.sin(a) * ry]); }
  return [[cx - fw - 3, ey - 8], ...pts, [cx + fw + 3, ey - 10], [cx + fw - 6, hl - 5, cx + 4, hl - 6], [cx - fw + 4, hl - 5, cx - fw - 3, ey - 8]];
}
function fringeShapes(H, p, G) {
  const { cx, ey, fw, hl, f } = G, spec = FRINGE[H.fringe]; if (!spec) return [];
  const top = ey - 24 - 46 * H.vol, short = !f && H.fringe !== 'swept' && H.fringe !== 'parted' ? 0.9 : 1;
  const L = spec.map(([ru, tu, d, w, b]) => lock(cx + 4 + ru * fw * 0.8, top + 14 + Math.abs(ru) * 12, cx + 4 + tu * fw, hl + d * short, w, b));
  if (H.fringe === 'slick') return L;
  // slim locks between the big ones, reaching a little lower, so the fringe falls in fine points
  for (let i = 0; i + 1 < spec.length; i++) { const a = spec[i], c = spec[i + 1], ru = (a[0] + c[0]) / 2, tu = (a[1] + c[1]) / 2 + (i % 2 ? 0.04 : -0.04), d = Math.min(a[2], c[2]) - 3; L.push(lock(cx + 4 + ru * fw * 0.8, top + 16 + Math.abs(ru) * 12, cx + 4 + tu * fw, hl + d * short, 9, (a[4] + c[4]) / 2)); }
  return L;
}
function sideLocks(H, p, G) {
  const { cx, ey, fw, hl, f, kid } = G, longish = f || ['long', 'flow', 'longwhite', 'tied', 'tailm', 'viking'].includes(p.hair);
  if (H.fringe === 'none' || H.fringe === 'buzz' || H.fringe === 'slick') return [];
  const low = longish ? (f && !kid ? 44 : 30) : 6;
  return [lock(cx - fw - 3, hl - 6, cx - fw + 1, ey + low, longish ? 17 : 13, -5), lock(cx - fw + 4, hl - 4, cx - fw + 8, ey + low - 10, 12, -2), lock(cx + fw + 4, hl - 6, cx + fw + 2, ey + low - 4, longish ? 14 : 11, 5)];
}
function frontHair(g, H, p, G, hc, scale = 1) {
  const { cx, ey, fw, hl } = G, outl = line(hc);
  if (H.fringe === 'none') { if (p.hair === 'bald') { g.save(); facePath(g, G); g.clip(); g.fillStyle = G.skinShade; g.beginPath(); g.ellipse(cx + fw + 6, ey - 40, 16, 40, 0, 0, 7); g.fill(); g.restore(); g.fillStyle = 'rgba(255,255,255,0.35)'; g.beginPath(); g.ellipse(cx - 6, ey - 56, 12, 5, -0.25, 0, 7); g.fill(); } return; }
  if (H.fringe === 'buzz') { const cr = crownPath({ vol: 0.98 }, G); group(g, [cr], shade(hc, 0.95), outl, 1.3, (g) => { g.fillStyle = shade(hc, 0.75); g.fillRect(cx + fw * 0.4, ey - 80, 40, 80); g.fillStyle = shade(hc, 1.18); for (let k = 0; k < 160; k++) g.fillRect(cx - fw - 6 + (k * 37 % (fw * 2 + 12)), ey - 70 + (k * 53 % 40), 0.8, 0.8); g.fillStyle = shade(hc, 1.3); g.beginPath(); g.ellipse(cx - 8, ey - 58, 12, 4, -0.3, 0, 7); g.globalAlpha = 0.5; g.fill(); g.globalAlpha = 1; }); return; }
  const crown = crownPath(H, G), locks = scale < 1 ? fringeShapes(H, p, G).filter((_, i) => i % 2) : fringeShapes(H, p, G), sides = scale < 1 ? [] : sideLocks(H, p, G);
  const crest = [];
  if (['spiky', 'messy', 'curly', 'short'].includes(H.fringe) && !H.cap && !H.bandana) { const rx = (fw + 11) * H.vol, ry = 46 * H.vol, n = H.fringe === 'short' ? 3 : 5; for (let k = 0; k < n; k++) { const a = Math.PI * (1.18 + (k + 0.5) / n * 0.74), len = H.fringe === 'short' ? 7 : 12 + (k % 2) * 6, x = cx + 2 + Math.cos(a) * rx * 0.86, y = ey - 24 + Math.sin(a) * ry * 0.86; const t = a - 0.9; crest.push(lock(x, y, x + Math.cos(t) * (rx * 0.12 + len * 0.7), y + Math.sin(t) * (ry * 0.12 + len * 0.7), 18, -3)); } }
  if (p.ahoge) { const x = cx + 6, y = ey - 24 - 46 * H.vol; crest.push([[x - 3, y + 6], [x - 6, y - 14, x + 10, y - 20], [x + 2, y - 10, x + 3, y + 6]]); }
  const all = [crown, ...crest, ...sides, ...locks];
  const topY = ey - 24 - 46 * H.vol;
  group(g, all, hc, outl, 1.15, (g) => {
  g.filter = `blur(${1.5 * g.getTransform().a}px)`;
  const gr = g.createLinearGradient(0, topY - 10, 0, ey + 50); gr.addColorStop(0, warm(hc, 1.1)); gr.addColorStop(0.32, hc); gr.addColorStop(0.62, cool(hc, 0.9, 0.12)); gr.addColorStop(1, warm(hc, 1.12)); g.fillStyle = gr; g.fillRect(cx - 110, topY - 40, 260, 220);
  // shading: the far side, the shade under the crown at the roots of the fringe, and one side of each lock
  g.fillStyle = cool(hc, 0.74); path(g, [[cx + fw + 26, ey - 96], [cx + fw * 0.05, ey - 56, cx + fw * 0.5, hl, cx + fw * 0.7, ey + 60], [cx + fw + 40, ey + 60], [cx + fw + 40, ey - 90]]); g.fill();
  for (const s of [...locks, ...sides]) { const r = s[0], t = [s[1][4], s[1][5]], wdt = Math.abs(s[2][4] - r[0]) || 10; g.save(); g.beginPath(); add(g, s); g.closePath(); g.clip(); g.translate(wdt * 0.45, 2); g.beginPath(); add(g, s); g.closePath(); g.fillStyle = cool(hc, 0.8, 0.18); g.globalAlpha = 0.85; g.fill(); g.restore(); }
  // the ring of light across the crown: a band whose lower edge breaks into points
  const rx = (fw + 11) * H.vol * 0.8, ry = 46 * H.vol * 0.7, cyh = ey - 26, ring = [], a0 = 1.08, a1 = 1.62, n = 8;
  for (let k = 0; k <= n; k++) { const a = Math.PI * (a0 + k / n * (a1 - a0)); ring.push([cx + 2 + Math.cos(a) * rx, cyh + Math.sin(a) * ry]); }
  for (let k = n; k >= 0; k--) { const a = Math.PI * (a0 + k / n * (a1 - a0)), r2 = k % 2 ? 0.66 : 0.86, e = Math.sin(k / n * Math.PI); ring.push([cx + 2 + Math.cos(a) * rx * (1 - (1 - r2) * e), cyh + Math.sin(a) * ry * (1 - (1 - r2) * e)]); }
  // the ring of light: short tapering streaks fanned around the crown, brighter toward the light, a few white glints
  const hiC = lum(hc) < 0.2 ? mix(hc, '#6a72a8', 0.5) : warm(hc, lum(hc) > 0.7 ? 1.25 : 1.42);
  // the ring of light: one band around the crown, its lower edge broken into long and short teeth, brighter toward the light
  { const N = 26, band = []; for (let k = 0; k <= N; k++) { const a = Math.PI * (a0 - 0.05 + k / N * (a1 - a0 + 0.12)); band.push([cx + 2 + Math.cos(a) * rx * 1.06, cyh + Math.sin(a) * ry * 1.06]); }
    for (let k = N; k >= 0; k--) { const t = k / N, a = Math.PI * (a0 - 0.05 + t * (a1 - a0 + 0.12)), e = Math.sin(t * Math.PI), tooth = k % 2 ? 0 : (k % 4 ? 5 : 9) * (0.4 + e * 0.8), r2 = 1.06 - (0.1 + e * 0.1); band.push([cx + 2 + Math.cos(a) * rx * r2, cyh + Math.sin(a) * ry * r2 + tooth]); }
    const bg3 = g.createLinearGradient(cx - fw, 0, cx + fw, 0); bg3.addColorStop(0, hiC); bg3.addColorStop(0.6, hiC); bg3.addColorStop(1, cool(hiC, 0.9, 0.1)); path(g, band); g.fillStyle = bg3; g.globalAlpha = 0.78; g.fill(); }
  g.globalAlpha = 1;
  for (const [t, l2] of [[0.2, 3.5], [0.28, 5], [0.36, 3]]) { const a = Math.PI * (a0 + t * (a1 - a0)), bx = cx + 2 + Math.cos(a) * rx * 1.02, by = cyh + Math.sin(a) * ry * 1.02; g.strokeStyle = 'rgba(255,255,255,0.8)'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(bx, by - 1); g.lineTo(bx - Math.cos(a) * 1.5, by + l2); g.stroke(); }
  // strands: a line down the middle of each lock, and where locks overlap
  for (const s of [...locks, ...sides].filter((_, i) => i % 2 === 0)) { const r = s[0], c1 = [s[1][2], s[1][3]], t = [s[1][4], s[1][5]]; g.strokeStyle = shade(hc, 0.62); g.lineWidth = 0.9; g.beginPath(); g.moveTo((r[0] + t[0] * 2) / 3 + 2, (r[1] + t[1] * 2) / 3 - 6); g.quadraticCurveTo(c1[0] + 4, c1[1] + 6, t[0] + (c1[0] - t[0]) * 0.1, t[1] - 4); g.stroke(); }
  for (const s of locks) { const t = s[1]; g.strokeStyle = outl; g.lineWidth = 1.1; g.beginPath(); g.moveTo(t[4], t[5]); g.quadraticCurveTo(t[2], t[3], (t[2] + t[0]) / 2, (t[3] + t[1]) / 2); g.stroke(); }
  g.filter = 'none';
  // fine strands through the crown, and a light glint near each lock's tip
  g.lineWidth = 0.7; for (let k = 0; k < 16; k++) { const a = Math.PI * (1.0 + k / 15 * 1.0), x0 = cx + 2 + Math.cos(a) * rx * 1.15, y0 = cyh + Math.sin(a) * ry * 1.15; g.strokeStyle = k % 3 ? cool(hc, 0.7, 0.2) : warm(hc, 1.25); g.globalAlpha = 0.3; g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo(x0 + Math.cos(a) * -6, y0 + 10, x0 + Math.cos(a) * -4 + (k % 2 ? 3 : -3), (y0 + hl) / 2 + 4); g.stroke(); }
  g.globalAlpha = 1; for (const s of locks.filter((_, i) => i % 2)) { const t = [s[1][4], s[1][5]], c1 = [s[1][2], s[1][3]]; g.strokeStyle = warm(hc, 1.3); g.globalAlpha = 0.6; g.lineWidth = 1.2; g.beginPath(); g.moveTo((t[0] * 2 + c1[0]) / 3 - 1, (t[1] * 2 + c1[1]) / 3 - 6); g.lineTo(t[0] - 0.5, t[1] - 3); g.stroke(); g.globalAlpha = 1; }
  // rim light
  g.save(); g.strokeStyle = warm(hc, 1.6); g.globalAlpha = 0.4; g.lineWidth = 1.3; g.translate(1.6, 1.2); g.beginPath(); add(g, crown.slice(1, 18)); for (const q of sides) { add(g, q); } g.stroke(); g.restore();
  });
  if (H.fringe === 'curly') { g.strokeStyle = shade(hc, 0.5); g.lineWidth = 1.2; for (let k = 0; k < 8; k++) { g.beginPath(); g.arc(cx - fw + 4 + k * fw / 3.6, ey - 56 + (k % 2) * 7, 4.5, 0.2, Math.PI * 1.4); g.stroke(); } }
  if (H.braid) braidCrown(g, G, hc, outl);
}
function braidCrown(g, G, hc, outl) {
  const { cx, ey, fw } = G;
  for (let k = 0; k < 8; k++) { const a = Math.PI * (1.08 + k / 7 * 0.84), x = cx + 2 + Math.cos(a) * (fw + 4), y = ey - 30 + Math.sin(a) * 36; g.beginPath(); g.ellipse(x, y, 6.5, 4.5, a + Math.PI / 2 + 0.4, 0, 7); ink(g, shade(hc, k % 2 ? 1.08 : 0.92), outl, 1.2); g.strokeStyle = shade(hc, 1.4); g.lineWidth = 1; g.beginPath(); g.ellipse(x, y, 3.5, 2, a + Math.PI / 2 + 0.4, Math.PI, Math.PI * 1.8); g.stroke(); }
}
function backHair(g, H, p, G, hc) {
  const { cx, ey, fw } = G, outl = line(hc), dark = shade(hc, 0.72), R = (fw + 9) * H.vol, top = ey - 24 - 44 * H.vol;
  const skull = (bottom) => [[cx - R, ey - 20], [cx - R, top + 6, cx + 2, top - 2], [cx + R + 4, top + 6, cx + R + 3, ey - 20], [cx + R + 4, bottom, cx + R, bottom], [cx - R, bottom]];
  const tips = (x0, x1, y, n, d, curve = 0) => { const out = []; for (let k = 0; k < n; k++) { const t = (k + 0.5) / n, x = x0 + (x1 - x0) * t; out.push(lock(x, y - 30, x + (t - 0.5) * curve, y + d * (0.7 + (k % 2) * 0.3), (x1 - x0) / n + 6, (t - 0.5) * 6)); } return out; };
  let shapes = [];
  const b = H.back;
  if (b === 'long' || b === 'wig') shapes = [skull(ey + 40), [[cx - R - 2, ey - 10], [cx - R - 12, ey + 40, cx - R - 14, ey + 80], [cx + R + 16, ey + 80], [cx + R + 14, ey + 40, cx + R + 2, ey - 10]], ...tips(cx - R - 14, cx + R + 16, ey + 84, 7, 22, 10)];
  if (b === 'braids') shapes = [skull(ey + 10)];
  if (b === 'mane') shapes = [skull(ey + 6), ...[[-1.25, -0.2, 26, -8], [-1.4, 0.3, 30, -6], [-1.2, 0.7, 24, -4], [1.3, -0.1, 28, 8], [1.45, 0.35, 30, 6], [1.2, 0.75, 22, 4], [-0.8, 0.9, 20, -2], [0.85, 0.95, 20, 2]].map(([u, v, len, bw]) => lock(cx + u * fw * 0.7, ey - 30 + v * 30, cx + u * fw * 1.15, ey - 22 + v * 30 + len, 20, bw))];
  if (b === 'nape' || b === 'bobshort' || b === 'bob') { const d = b === 'bob' ? 34 : b === 'bobshort' ? 22 : 10; shapes = [skull(ey + d - 8), ...tips(cx - R - 2, cx + R + 4, ey + d, b === 'nape' ? 5 : 6, 10, 4)]; if (b !== 'nape') shapes.push(lock(cx - R - 1, ey - 10, cx - R + 8, ey + d + 8, 18, -6), lock(cx + R + 2, ey - 10, cx + R - 6, ey + d + 6, 18, 6)); }
  if (b === 'pony' || b === 'tail') { shapes = [skull(ey + 6), ...tips(cx - R, cx + R + 2, ey + 10, 5, 8)]; const sx = b === 'pony' ? cx + R - 2 : cx + R * 0.4, sy = b === 'pony' ? ey - 52 : ey - 8; shapes.push([[sx - 8, sy], [sx + 34, sy + 10, sx + 30, sy + 80, sx + 14, sy + (b === 'pony' ? 140 : 110)], [sx + 2, sy + 80, sx - 10, sy + 40, sx - 8, sy]], lock(sx + 6, sy + 50, sx + 26, sy + 120, 16, 6), lock(sx + 2, sy + 40, sx - 6, sy + 112, 14, -6)); }
  if (b === 'twin') { shapes = [skull(ey + 4), ...tips(cx - R, cx + R + 2, ey + 8, 5, 8)]; for (const sd of [-1, 1]) { const sx = cx + 2 + sd * (R - 2), sy = ey - 50; shapes.push([[sx - 6, sy], [sx + sd * 36, sy + 6, sx + sd * 32, sy + 70, sx + sd * 18, sy + 132], [sx + sd * 4, sy + 70, sx - sd * 4, sy + 30, sx - 6, sy]], lock(sx + sd * 14, sy + 60, sx + sd * 30, sy + 124, 14, sd * 6)); } }
  if (b === 'bun') { shapes = [skull(ey + 2), ...tips(cx - R, cx + R + 2, ey + 6, 5, 6), blob(cx + R * 0.55, top + 4, 15, 13)]; }
  if (!shapes.length) return;
  group(g, shapes, dark, outl, 1.15, (g) => { const gr = g.createLinearGradient(0, top, 0, ey + 110); gr.addColorStop(0, cool(hc, 0.78, 0.18)); gr.addColorStop(0.6, cool(hc, 0.82, 0.12)); gr.addColorStop(1, warm(hc, 1.05)); g.fillStyle = gr; g.fillRect(cx - 120, top - 40, 260, 260); g.fillStyle = cool(hc, 0.6, 0.24); g.fillRect(cx + fw * 0.4, 0, 120, 200);
  g.strokeStyle = shade(hc, 0.95); g.lineWidth = 1; for (let k = 0; k < 9; k++) { const x = cx - R - 8 + k * (R * 2 + 16) / 8; stroke(g, [[x, ey - 4], [x + 3, ey + 40, x + (k - 4) * 2, ey + 90]], shade(hc, k % 2 ? 0.95 : 0.55), 1); }
  });
  if (b === 'pony' || b === 'twin') { for (const sd of b === 'twin' ? [-1, 1] : [1]) { const x = b === 'pony' ? cx + R - 2 : cx + 2 + sd * (R - 2), y = ey - 50; g.beginPath(); g.ellipse(x, y + 2, 5, 6, 0, 0, 7); ink(g, p.ac || '#c83a3a', shade(p.ac || '#c83a3a', 0.4), 1.2); } }
  if (b === 'wig') for (const sd of [-1, 1]) for (let k = 0; k < 4; k++) { g.beginPath(); g.ellipse(cx + 2 + sd * (R + 4), ey - 18 + k * 13, 9, 6.5, 0, 0, 7); ink(g, shade(hc, k % 2 ? 1 : 0.9), outl, 1.3); g.strokeStyle = shade(hc, 0.7); g.lineWidth = 1; g.beginPath(); g.arc(cx + 2 + sd * (R + 4), ey - 18 + k * 13, 3.5, 0, Math.PI * 1.5); g.stroke(); }
  if (b === 'braids') for (const sd of [-1, 1]) { const x0 = cx + 2 + sd * (R - 2); for (let k = 0; k < 8; k++) { const x = x0 + sd * (2 + k * 0.6), y = ey - 6 + k * 11; g.beginPath(); g.ellipse(x, y, 7 - k * 0.3, 7, sd * 0.3, 0, 7); ink(g, shade(hc, k % 2 ? 0.95 : 0.8), outl, 1.2); g.strokeStyle = shade(hc, 1.2); g.lineWidth = 1; g.beginPath(); g.moveTo(x - 4, y - 3); g.quadraticCurveTo(x, y + 2, x + 4, y - 3); g.stroke(); } g.beginPath(); g.ellipse(x0 + sd * 7, ey + 84, 4, 3, 0, 0, 7); ink(g, p.ac || '#8a5a30', outl, 1); }
}
// ---------------------------------------------------------------- hoods and veils
function hoodBack(g, p, G) {
  const { cx, ey, fw } = G, oc = p.oc || '#4a4a4a', ol = line(oc);
  path(g, [[cx - fw - 20, ey + 64], [cx - fw - 24, ey - 16, cx - fw + 2, ey - 80, cx + 4, ey - 82], [cx + fw + 14, ey - 80, cx + fw + 28, ey - 14, cx + fw + 22, ey + 64]]); ink(g, shade(oc, 0.72), ol, 1.6);
  path(g, [[cx - fw - 10, ey + 50], [cx - fw - 12, ey - 14, cx - fw + 6, ey - 68, cx + 4, ey - 70], [cx + fw + 8, ey - 68, cx + fw + 16, ey - 12, cx + fw + 12, ey + 50]]); ink(g, shade(oc, 0.42));
}
function hoodFront(g, p, G) {
  const { cx, ey, fw } = G, oc = p.oc || '#4a4a4a', ol = line(oc);
  if (!(HAIR[p.hair] || {}).hood && p.out !== 'assassin') return;
  path(g, [[cx - fw - 20, ey + 40], [cx - fw - 22, ey - 18, cx - fw + 2, ey - 82, cx + 4, ey - 84], [cx + fw + 14, ey - 82, cx + fw + 26, ey - 18, cx + fw + 22, ey + 40], [cx + fw + 8, ey + 30], [cx + fw + 12, ey - 10, cx + fw + 4, ey - 58, cx + 4, ey - 60], [cx - fw - 2, ey - 58, cx - fw - 10, ey - 12, cx - fw - 6, ey + 32]]); ink(g, oc, ol, 1.6);
  stroke(g, [[cx - fw - 12, ey - 20], [cx - fw - 2, ey - 66, cx + 4, ey - 72]], shade(oc, 1.25), 1.4); stroke(g, [[cx + fw + 14, ey - 10], [cx + fw + 8, ey - 50, cx + fw - 6, ey - 66]], shade(oc, 0.6), 1.2);
}
function veilBack(g, p, G, H) {
  const { cx, ey, fw } = G, c = p.veil ? '#f4f0ec' : '#2a2a34', ol = line(p.veil ? '#c8c0b8' : '#2a2a34');
  path(g, [[cx - fw - 18, 192], [cx - fw - 20, ey - 20, cx - fw - 2, ey - 76, cx + 4, ey - 78], [cx + fw + 10, ey - 76, cx + fw + 24, ey - 20, cx + fw + 22, 192]]); ink(g, c, ol, 1.6);
  g.save(); g.clip(); g.fillStyle = shade(p.veil ? '#f4f0ec' : '#2a2a34', 0.8); g.fillRect(cx + fw - 2, 0, 60, 192); for (let k = 0; k < 4; k++) stroke(g, [[cx - fw - 10 + k * 6, ey + 10], [cx - fw - 14 + k * 6, ey + 60, cx - fw - 12 + k * 7, 192]], shade(p.veil ? '#e0d8d0' : '#3a3a48', 0.85), 1); g.restore();
}
// ---------------------------------------------------------------- the body
function body(g, p, kind, G) {
  const { cx, ey, f, kid } = G, oc = p.oc || '#5a5a6a', ac = p.ac || '#d8b060', ol = line(oc), al = line(ac), skin = p.skin || '#f0c8a8', y0 = ey + 54;
  const big = p.out === 'bare' || p.out === 'fur' || p.hair === 'wild' && !f, k = (kid ? 0.84 : f ? 0.9 : 1) * (big ? 1.1 : 1), nx = cx + 4;
  const torso = [[nx - 86 * k, 236], [nx - 84 * k, y0 + 20, nx - 64 * k, y0 + 2, nx - 22 * k, y0 - 4], [nx - 10, y0 - 10], [nx + 14, y0 - 10], [nx + 22 * k, y0 - 4], [nx + 56 * k, y0 + 2, nx + 74 * k, y0 + 16, nx + 78 * k, 236]];
  const clip = () => { path(g, torso); g.clip(); };
  const farShade = (c) => { g.fillStyle = c; path(g, [[nx + 26 * k, y0 - 8], [nx + 40 * k, y0 + 20, nx + 36 * k, y0 + 50, nx + 40 * k, 240], [nx + 100, 240], [nx + 100, y0 - 8]]); g.fill(); };
  const folds = (c, xs) => { for (const [x, y, len, bend] of xs) { stroke(g, [[nx + x * k + 2, y0 + y + 2], [nx + (x + bend) * k + 2, y0 + y + len / 2, nx + (x + bend * 0.4) * k + 2, y0 + y + len - 4]], 'rgba(255,248,236,0.22)', 2.2); stroke(g, [[nx + x * k, y0 + y], [nx + (x + bend) * k, y0 + y + len / 2, nx + (x + bend * 0.4) * k, y0 + y + len]], c, 1.1); } };
  const studs = (pts, col, n, r = 1.3) => { for (let i = 0; i <= n; i++) { const t = i / n, a = pts[0], b = pts[1]; const x = a[0] + (b[0] - a[0]) * t, y = a[1] + (b[1] - a[1]) * t; g.fillStyle = col; g.beginPath(); g.moveTo(x, y - r * 1.4); g.lineTo(x + r, y); g.lineTo(x, y + r * 1.4); g.lineTo(x - r, y); g.fill(); } };
  if (kind === 'bare') {
    path(g, torso); ink(g, skin, G.skinLine, 1.6); g.save(); clip(); farShade(G.skinShade);
    stroke(g, [[nx - 30 * k, y0 + 8], [nx - 14, y0 + 12, nx - 3, y0 + 8]], G.skinLine, 1.3); stroke(g, [[nx + 10, y0 + 8], [nx + 20, y0 + 12, nx + 30 * k, y0 + 7]], G.skinLine, 1.3);
    stroke(g, [[nx - 34 * k, y0 + 36], [nx - 14, y0 + 44, nx + 2, y0 + 36]], G.skinShade, 2.2); stroke(g, [[nx + 4, y0 + 36], [nx + 16, y0 + 44, nx + 30 * k, y0 + 34]], G.skinShade, 2.2); stroke(g, [[nx + 2, y0 + 20], [nx + 3, y0 + 40]], G.skinShade, 1.5);
    g.restore(); g.strokeStyle = shade(oc, 0.6); g.lineWidth = 11; g.beginPath(); g.moveTo(nx - 50 * k, y0); g.lineTo(nx + 40 * k, 196); g.stroke(); g.strokeStyle = oc; g.lineWidth = 8; g.stroke(); g.strokeStyle = shade(oc, 1.3); g.lineWidth = 1.2; g.beginPath(); g.moveTo(nx - 48 * k, y0 - 2); g.lineTo(nx + 42 * k, 193); g.stroke();
    g.beginPath(); g.arc(nx - 5, y0 + 44, 4.5, 0, 7); ink(g, ac, al, 1.2); return;
  }
  path(g, torso); ink(g, oc, ol, 1.3);
  g.save(); clip();
  if (kind === 'coat') {
    // the shirt inside, lapels, a standing collar, buttons and trim
    path(g, [[nx - 14, y0 - 8], [nx + 2, y0 + 40], [nx + 18, y0 - 8]]); ink(g, '#f2eee8', '#8a8478', 1.2);
    if (FANCY[p.out]) { path(g, [[nx - 4, y0 + 2], [nx + 2, y0 + 8], [nx + 8, y0 + 2], [nx + 6, y0 + 24], [nx + 2, y0 + 28], [nx - 2, y0 + 24]]); ink(g, shade(ac, 1.1), al, 1); }
    farShade(shade(oc, 0.78));
    for (const [sd, w] of [[-1, 1], [1, 0.8]]) { path(g, [[nx + sd * 12, y0 - 12], [nx + sd * 30 * w, y0 + 34], [nx + sd * 10, 240], [nx + sd * 2, 240], [nx + sd * 4, y0 + 30]]); ink(g, shade(oc, sd < 0 ? 1.14 : 0.9), ol, 1.3); stroke(g, [[nx + sd * 13, y0 - 8], [nx + sd * 28 * w, y0 + 33], [nx + sd * 9, 236]], ac, 1.6); stroke(g, [[nx + sd * 16, y0 - 6], [nx + sd * 31 * w, y0 + 33], [nx + sd * 12, 236]], shade(ac, 0.7), 0.8); studs([[nx + sd * 15, y0 + 2], [nx + sd * 26 * w, y0 + 28]], warm(ac, 1.2), 4); }
    for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(nx + 13, y0 + 46 + i * 13, 2.6, 0, 7); ink(g, ac, al, 0.9); g.fillStyle = 'rgba(255,255,255,0.6)'; g.fillRect(nx + 12, y0 + 45 + i * 13, 1.2, 1.2); }
    folds(shade(oc, 0.6), [[-52, 20, 30, 6], [-40, 34, 24, -4], [44, 26, 30, -6]]);
    stroke(g, [[nx - 60 * k, y0 + 10], [nx - 52 * k, y0 + 30, nx - 56 * k, y0 + 60]], shade(oc, 0.6), 1.1);
    if (FANCY[p.out] || p.out === 'actor') for (const [sd, w] of [[-1, 1], [1, 0.85]]) { const x = nx + sd * 58 * k * w; path(g, [[x - 18 * w, y0 + 4], [x + 18 * w, y0 + 4], [x + 20 * w, y0 + 12], [x - 20 * w, y0 + 12]]); ink(g, ac, al, 1.1); for (let i = 0; i < 6; i++) stroke(g, [[x - 16 * w + i * 6.4 * w, y0 + 12], [x - 16 * w + i * 6.4 * w, y0 + 22]], shade(ac, 0.9), 1.6); }
    g.restore();
    for (const [sd, w] of [[-1, 1], [1, 0.78]]) { path(g, [[nx + sd * 4, y0 - 20], [nx + sd * 24 * w, y0 - 16], [nx + sd * 26 * w, y0 + 2], [nx + sd * 12, y0 + 8]]); ink(g, shade(oc, sd < 0 ? 1.06 : 0.86), ol, 1.4); stroke(g, [[nx + sd * 5, y0 - 18], [nx + sd * 23 * w, y0 - 14]], ac, 1.2); }
  } else if (kind === 'armor' || kind === 'armorlite') {
    const metal = kind === 'armor' ? oc : shade(oc, 0.8), ml = line(metal);
    if (kind === 'armorlite') { path(g, [[nx - 14, y0 - 6], [nx + 4, y0 + 18], [nx + 20, y0 - 6]]); ink(g, shade(ac, 1.2), al, 1); }
    // the cape lining over the shoulders, the breastplate with a ridge and an emblem
    if (kind === 'armor') { g.fillStyle = ac; path(g, [[nx - 90, y0 + 8], [nx - 40, y0 - 2], [nx - 50, 240], [nx - 90, 240]]); g.fill(); path(g, [[nx + 90, y0 + 8], [nx + 40, y0 - 2], [nx + 48, 240], [nx + 90, 240]]); g.fill(); }
    path(g, [[nx - 34 * k, y0 + 6], [nx + 2, y0 - 2], [nx + 32 * k, y0 + 4], [nx + 30 * k, 240], [nx - 34 * k, 240]]); ink(g, shade(metal, 1.06), ml, 1.4);
    farShade(shade(metal, 0.74));
    stroke(g, [[nx + 2, y0 + 2], [nx + 3, y0 + 40, nx + 2, 240]], shade(metal, 1.5), 2); stroke(g, [[nx + 4, y0 + 4], [nx + 5, y0 + 40, nx + 4, 240]], ml, 1);
    stroke(g, [[nx - 30 * k, y0 + 30], [nx, y0 + 38, nx + 28 * k, y0 + 30]], ml, 1.2); stroke(g, [[nx - 30 * k, y0 + 33], [nx, y0 + 41, nx + 28 * k, y0 + 33]], ac, 1.4); stroke(g, [[nx - 26 * k, y0 + 10], [nx - 30 * k, y0 + 60]], 'rgba(255,255,255,0.35)', 2.6);
    if (kind === 'armor') { path(g, [[nx - 9, y0 + 12], [nx + 11, y0 + 12], [nx + 9, y0 + 28], [nx + 1, y0 + 34], [nx - 7, y0 + 28]]); ink(g, ac, al, 1.1); stroke(g, [[nx + 1, y0 + 14], [nx + 1, y0 + 30]], shade(ac, 1.5), 1.6); stroke(g, [[nx - 5, y0 + 20], [nx + 7, y0 + 20]], shade(ac, 1.5), 1.6); }
    else { stroke(g, [[nx - 40 * k, y0 + 4], [nx + 30 * k, 240]], shade(ac, 0.7), 7); stroke(g, [[nx - 40 * k, y0 + 4], [nx + 30 * k, 240]], ac, 4.5); g.beginPath(); g.rect(nx - 9, y0 + 36, 9, 8); ink(g, '#d8c070', '#6a5020', 1); }
    g.fillStyle = 'rgba(255,255,255,0.5)'; for (const [x, y] of [[-26, 14], [24, 12], [-26, 48], [24, 46]]) { g.beginPath(); g.arc(nx + x * k, y0 + y, 1.6, 0, 7); g.fill(); }
    g.restore();
    // a gorget at the throat and pauldrons with layered plates
    path(g, [[nx - 18, y0 - 12], [nx + 22, y0 - 12], [nx + 24, y0 + 2], [nx + 2, y0 + 8], [nx - 20, y0 + 2]]); ink(g, shade(metal, 0.95), ml, 1.4); stroke(g, [[nx - 18, y0 - 5], [nx + 2, y0 - 1, nx + 23, y0 - 5]], ml, 1);
    for (const [sd, s] of [[-1, 1], [1, 0.82]]) { if (kind === 'armorlite' && sd > 0) continue; const x = nx + sd * 58 * k * s, y = y0 + 14; for (let i = 2; i >= 0; i--) { path(g, [[x - 30 * s, y + 10 + i * 9], [x - 28 * s, y - 18 + i * 9, x + 28 * s, y - 18 + i * 9, x + 30 * s, y + 10 + i * 9], [x, y + 4 + i * 9, x - 30 * s, y + 10 + i * 9]]); ink(g, shade(metal, 1.12 - i * 0.08), ml, 1.4); }
      stroke(g, [[x - 20 * s, y - 4], [x - 4 * s, y - 13, x + 14 * s, y - 8]], 'rgba(255,255,255,0.7)', 2.2); stroke(g, [[x - 26 * s, y + 8], [x, y + 3, x + 26 * s, y + 8]], ac, 1.6); }
  } else if (kind === 'hood') {
    path(g, [[nx - 16, y0 - 8], [nx + 4, y0 + 26], [nx + 20, y0 - 8]]); ink(g, shade(oc, 1.25), ol, 1);
    farShade(shade(oc, 0.75));
    stroke(g, [[nx - 60 * k, y0 + 4], [nx + 50 * k, 240]], '#5a3a20', 7); stroke(g, [[nx - 60 * k, y0 + 4], [nx + 50 * k, 240]], '#8a5a30', 4.5); stroke(g, [[nx - 58 * k, y0 + 2], [nx + 52 * k, 198]], '#b08050', 1);
    folds(shade(oc, 0.55), [[-56, 18, 36, 6], [-36, 30, 30, -4], [40, 24, 30, -6], [56, 14, 40, 4]]);
    g.restore();
    path(g, [[nx - 40 * k, y0 - 4], [nx - 30, y0 - 16, nx + 4, y0 - 14], [nx + 34, y0 - 16, nx + 40 * k, y0 - 4], [nx + 28, y0 + 14, nx + 4, y0 + 16], [nx - 26, y0 + 14, nx - 40 * k, y0 - 4]]); ink(g, shade(oc, 0.92), ol, 1.5);
    stroke(g, [[nx - 30, y0 + 2], [nx + 4, y0 + 10, nx + 32, y0 + 2]], shade(oc, 0.6), 1.1);
    g.beginPath(); g.arc(nx + 4, y0 + 14, 4, 0, 7); ink(g, ac, al, 1.1);
  } else if (kind === 'vest' || kind === 'shirt') {
    const shirt = kind === 'vest' ? '#ece4d6' : oc; if (kind === 'vest') { path(g, torso); g.fillStyle = shirt; g.fill(); }
    path(g, [[nx - 12, y0 - 8], [nx + 3, y0 + (kind === 'vest' ? 26 : 20)], [nx + 18, y0 - 8]]); ink(g, skin, G.skinLine, 1.1); stroke(g, [[nx - 9, y0 + 4], [nx - 3, y0 + 6]], G.skinShade, 1.2); stroke(g, [[nx + 9, y0 + 5], [nx + 14, y0 + 3]], G.skinShade, 1.2);
    farShade(kind === 'vest' ? '#c8bca8' : shade(oc, 0.76));
    if (kind === 'shirt') { g.strokeStyle = shade(oc, 0.5); g.lineWidth = 1; for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(nx - 4 + i * 1.5, y0 + 2 + i * 6); g.lineTo(nx + 10 - i * 1.5, y0 + 6 + i * 6); g.moveTo(nx + 10 - i * 1.5, y0 + 2 + i * 6); g.lineTo(nx - 4 + i * 1.5, y0 + 6 + i * 6); g.stroke(); } folds(shade(oc, 0.6), [[-50, 16, 34, 6], [-30, 30, 30, -3], [40, 20, 34, -5]]); if (p.out === 'rags') { path(g, [[nx - 50, y0 + 30], [nx - 30, y0 + 28], [nx - 32, y0 + 46], [nx - 52, y0 + 46]]); ink(g, shade(oc, 1.25), ol, 1); g.setLineDash([2, 2]); stroke(g, [[nx - 49, y0 + 32], [nx - 32, y0 + 31]], ol, 0.8); g.setLineDash([]); } }
    else { for (const [sd, w] of [[-1, 1], [1, 0.8]]) { path(g, [[nx + sd * 14, y0 - 8], [nx + sd * 26 * w, y0 + 40], [nx + sd * 16, 240], [nx + sd * 96, 240], [nx + sd * 96, y0 - 20]]); ink(g, shade(oc, sd < 0 ? 1 : 0.8), ol, 1.4); stroke(g, [[nx + sd * 15, y0 - 6], [nx + sd * 25 * w, y0 + 40], [nx + sd * 15, 236]], ac, 1.8); }
      folds('rgba(0,0,0,0.25)', [[-54, 20, 34, 6], [48, 22, 30, -5]]); stroke(g, [[nx - 30, y0 + 70], [nx + 40, y0 + 58]], shade(ac, 0.6), 6); stroke(g, [[nx - 30, y0 + 70], [nx + 40, y0 + 58]], ac, 3.5); }
    g.restore();
  } else if (kind === 'gown') {
    // a low neckline with collarbones, a necklace, puffed and trimmed shoulders
    path(g, [[nx - 34 * k, y0 + 4], [nx - 20, y0 + 30, nx + 2, y0 + 32], [nx + 22, y0 + 30, nx + 32 * k, y0 + 2], [nx + 20, y0 - 12], [nx - 18, y0 - 12]]); ink(g, skin, G.skinLine, 1.2);
    stroke(g, [[nx - 22, y0 + 4], [nx - 10, y0 + 8, nx - 3, y0 + 6]], G.skinShade, 1.3); stroke(g, [[nx + 8, y0 + 6], [nx + 15, y0 + 8, nx + 24, y0 + 3]], G.skinShade, 1.3);
    farShade(shade(oc, 0.75));
    stroke(g, [[nx - 34 * k, y0 + 6], [nx - 20, y0 + 32, nx + 2, y0 + 34], [nx + 22, y0 + 32, nx + 32 * k, y0 + 4]], ac, 2.4); stroke(g, [[nx - 34 * k, y0 + 10], [nx - 20, y0 + 36, nx + 2, y0 + 38], [nx + 22, y0 + 36, nx + 32 * k, y0 + 8]], shade(ac, 0.6), 1);
    for (let i = 0; i < 9; i++) { const t = i / 8, x = nx - 32 * k + t * (62 * k), y = y0 + 8 + Math.sin(t * Math.PI) * 26; g.beginPath(); g.arc(x, y + 3, 2.4, 0, Math.PI); g.strokeStyle = shade(ac, 1.35); g.lineWidth = 1; g.stroke(); }
    g.strokeStyle = shade(ac, 1.1); g.lineWidth = 1.1; g.beginPath(); g.moveTo(nx - 14, y0 - 4); g.quadraticCurveTo(nx + 2, y0 + 16, nx + 16, y0 - 4); g.stroke();
    path(g, [[nx + 2, y0 + 10], [nx + 6, y0 + 15], [nx + 2, y0 + 21], [nx - 2, y0 + 15]]); ink(g, '#8ad0ff', '#3a6a9a', 1); g.fillStyle = '#ffffff'; g.fillRect(nx + 0.5, y0 + 13, 1.5, 1.5);
    folds(shade(oc, 0.55), [[-46, 40, 34, 4], [-20, 46, 30, -3], [30, 44, 30, -4]]);
    g.restore();
    for (const [sd, s] of [[-1, 1], [1, 0.8]]) { const x = nx + sd * 52 * k * s; path(g, [[x - 22 * s, y0 + 14], [x - 20 * s, y0 - 10, x + 20 * s, y0 - 10, x + 22 * s, y0 + 14], [x, y0 + 8, x - 22 * s, y0 + 14]]); ink(g, shade(oc, sd < 0 ? 1.12 : 0.92), ol, 1.4); for (let i = -1; i <= 1; i++) stroke(g, [[x + i * 10 * s, y0 - 4], [x + i * 12 * s, y0 + 10]], shade(oc, 0.7), 1); stroke(g, [[x - 22 * s, y0 + 14], [x, y0 + 8, x + 22 * s, y0 + 14]], ac, 2); }
  } else if (kind === 'robe' || kind === 'nun') {
    if (kind === 'robe') {
      // crossed collars, an under-layer, a stole
      path(g, [[nx - 16, y0 - 10], [nx + 20, y0 + 46], [nx + 30, y0 + 40], [nx + 18, y0 - 10]]); ink(g, '#f4f0e8', '#8a8478', 1.1);
      farShade(shade(oc, 0.76));
      path(g, [[nx + 18, y0 - 10], [nx + 26, y0 - 6], [nx - 6, y0 + 50], [nx - 16, y0 + 44]]); ink(g, ac, al, 1.2); path(g, [[nx - 16, y0 - 10], [nx - 24, y0 - 6], [nx + 22, y0 + 56], [nx + 30, y0 + 48]]); ink(g, shade(ac, 0.9), al, 1.2);
      stroke(g, [[nx - 18, y0 - 4], [nx + 25, y0 + 52]], shade(ac, 1.4), 1); studs([[nx - 14, y0 + 2], [nx + 20, y0 + 46]], shade(ac, 0.6), 6, 1.5); studs([[nx + 20, y0], [nx - 4, y0 + 40]], warm(ac, 1.3), 5, 1.2);
      if (p.out === 'holy' || p.out === 'judge') { for (const sd of [-1, 1]) { path(g, [[nx + sd * 30, y0 - 6], [nx + sd * 40, y0 - 4], [nx + sd * 36, 240], [nx + sd * 26, 240]]); ink(g, shade(ac, 1.05), al, 1.2); } path(g, [[nx - 36, y0 + 40], [nx - 32, y0 + 34], [nx - 28, y0 + 40], [nx - 32, y0 + 46]]); ink(g, '#f8f0d0', al, 1); }
      g.fillStyle = shade(oc, 0.6); g.fillRect(nx - 90, y0 + 62, 180, 9); stroke(g, [[nx - 90, y0 + 62], [nx + 90, y0 + 62]], shade(oc, 0.4), 1);
      folds(shade(oc, 0.58), [[-60, 16, 40, 6], [-44, 28, 30, -4], [50, 20, 36, -6]]);
    } else {
      farShade(shade(oc, 0.7));
      path(g, [[nx - 40 * k, y0 + 2], [nx - 30, y0 - 14, nx + 4, y0 - 14], [nx + 36, y0 - 14, nx + 40 * k, y0 + 2], [nx + 30, y0 + 22, nx + 4, y0 + 24], [nx - 26, y0 + 22, nx - 40 * k, y0 + 2]]); ink(g, '#f4f0e8', '#8a8478', 1.3);
      stroke(g, [[nx - 30, y0 + 8], [nx + 4, y0 + 16, nx + 34, y0 + 8]], '#c8c0b4', 1);
      stroke(g, [[nx + 4, y0 + 22], [nx + 4, y0 + 40]], '#8a7030', 1.2); path(g, [[nx + 2.5, y0 + 40], [nx + 5.5, y0 + 40], [nx + 5.5, y0 + 46], [nx + 10, y0 + 46], [nx + 10, y0 + 49], [nx + 5.5, y0 + 49], [nx + 5.5, y0 + 60], [nx + 2.5, y0 + 60], [nx + 2.5, y0 + 49], [nx - 2, y0 + 49], [nx - 2, y0 + 46], [nx + 2.5, y0 + 46]]); ink(g, '#e8c860', '#7a5a20', 1);
      folds('rgba(255,255,255,0.12)', [[-56, 30, 40, 6], [46, 30, 40, -6]]);
    }
    g.restore();
  } else if (kind === 'fur') {
    path(g, [[nx - 12, y0 - 6], [nx + 3, y0 + 18], [nx + 18, y0 - 6]]); ink(g, skin, G.skinLine, 1);
    farShade(shade(oc, 0.74)); g.restore();
    // a mantle of pelts: tufts around the shoulders
    const fur = p.out === 'shaman' ? '#9a8a70' : '#d0c8b8', fl = line(fur), tufts = [], sy = (t) => y0 - 10 + Math.pow(Math.abs(t - 0.5) * 2, 1.6) * 26;
    // a rounded pelt over the shoulders, its edge broken into soft curling tufts in two rows
    tufts.push([[nx - 92 * k, sy(0) + 14], [nx - 50 * k, y0 - 24, nx + 4, y0 - 24], [nx + 56 * k, y0 - 24, nx + 86 * k, sy(1) + 12], [nx + 86 * k, sy(1) + 22], [nx - 92 * k, sy(0) + 24]]);
    for (const row of [0, 1]) for (let i = 0; i < 17; i++) { const t = (i + row * 0.5) / 16.5, x = nx - 90 * k + t * 174 * k, y = sy(t) + 10 + row * 9, len = 14 + ((i * 7 + row * 3) % 5) * 3, bend = (t - 0.5) * 14 + (i % 2 ? 3 : -3); tufts.push(lock(x, y - 10, x + bend, y + len, 13, bend * 0.6)); }
    group(g, tufts, fur, fl, 1.2, (g) => { const fg2 = g.createLinearGradient(0, y0 - 24, 0, y0 + 40); fg2.addColorStop(0, warm(fur, 1.18)); fg2.addColorStop(0.5, fur); fg2.addColorStop(1, cool(fur, 0.78, 0.18)); g.fillStyle = fg2; g.fillRect(nx - 120, y0 - 40, 240, 100); g.fillStyle = cool(fur, 0.72, 0.2); g.fillRect(nx + 34, y0 - 30, 90, 80);
      for (let i = 0; i < 46; i++) { const t = i / 45, x = nx - 88 * k + t * 170 * k, y = sy(t) + 2 + (i % 3) * 6; stroke(g, [[x, y], [x + (t - 0.5) * 4, y + 8, x + (t - 0.5) * 8 + (i % 2 ? 2 : -2), y + 15]], i % 3 ? cool(fur, 0.7, 0.2) : warm(fur, 1.3), 0.9); } });
    if (p.bones) {}
  } else g.restore();
  if (p.scarf) {
    const sc = p.scarf, sl = line(sc);
    path(g, [[nx - 30, y0 - 12], [nx - 26, y0 - 22, nx + 4, y0 - 22], [nx + 32, y0 - 22, nx + 34, y0 - 12], [nx + 30, y0 + 6], [nx + 4, y0 + 12, nx - 26, y0 + 6]]); ink(g, sc, sl, 1.5);
    stroke(g, [[nx - 26, y0 - 4], [nx + 4, y0 + 4, nx + 30, y0 - 4]], shade(sc, 0.65), 1.2); stroke(g, [[nx - 22, y0 - 14], [nx + 4, y0 - 10, nx + 26, y0 - 16]], shade(sc, 1.3), 1.4);
    path(g, [[nx - 20, y0 + 4], [nx - 30, y0 + 40, nx - 26, y0 + 60], [nx - 14, y0 + 56], [nx - 12, y0 + 30, nx - 6, y0 + 8]]); ink(g, shade(sc, 0.9), sl, 1.4); stroke(g, [[nx - 18, y0 + 14], [nx - 22, y0 + 34, nx - 20, y0 + 52]], shade(sc, 0.65), 1);
    for (let i = 0; i < 4; i++) stroke(g, [[nx - 26 + i * 3.5, y0 + 59 - i * 1.3], [nx - 27 + i * 3.5, y0 + 64 - i * 1.3]], sl, 1);
  }
  if (p.tattoo) { stroke(g, [[nx + 20, y0 - 2], [nx + 30, y0 + 6, nx + 24, y0 + 14]], '#2a5a6a', 1.5); stroke(g, [[nx + 24, y0 + 14], [nx + 34, y0 + 18, nx + 40, y0 + 12]], '#2a5a6a', 1.5); }
  if (p.bones) for (let i = 0; i < 5; i++) { const x = nx - 26 + i * 13, y = y0 + 6 + Math.abs(i - 2) * -2 + 8; g.beginPath(); g.ellipse(x, y, 3.5, 6.5, 0.3 - i * 0.15, 0, 7); ink(g, '#ece4cc', '#6a5a40', 1.1); stroke(g, [[x - 1, y - 4], [x - 1, y + 3]], '#b8ac90', 1); }
  if (p.fan) { path(g, [[nx + 46, 236], [nx + 34, y0 + 18], [nx + 50, y0 - 16, nx + 82, y0 - 12], [nx + 90, y0 + 20]]); ink(g, '#f6f6f2', '#8a8a80', 1.4); for (let i = 0; i < 7; i++) stroke(g, [[nx + 46, 236], [nx + 36 + i * 8, y0 - 6 + Math.abs(i - 3) * 3]], '#c8c8bc', 1); stroke(g, [[nx + 36, y0 + 14], [nx + 52, y0 - 12, nx + 82, y0 - 8]], '#8a9ab0', 1.6); }
}
// ---------------------------------------------------------------- things on the head and face
function extras(g, p, H, G, ex, hc) {
  const { cx, ey, fw, mid, nearEye, farEye } = G, top = ey - 24 - 44 * H.vol, hl = G.hl;
  if (p.glasses) { for (const [x, s] of [[nearEye, 1], [farEye, 0.85]]) { g.beginPath(); g.ellipse(x, ey + 1, 11.5 * s, 9.5, 0, 0, 7); g.fillStyle = 'rgba(200,230,255,0.15)'; g.fill(); g.strokeStyle = '#5a4a3a'; g.lineWidth = 1.5; g.stroke(); stroke(g, [[x - 7 * s, ey - 4], [x - 2 * s, ey - 7]], 'rgba(255,255,255,0.8)', 1.4); } stroke(g, [[nearEye + 11, ey - 1], [mid, ey - 4, farEye - 9, ey - 1]], '#5a4a3a', 1.4); stroke(g, [[nearEye - 11, ey - 1], [cx - fw - 2, ey - 4]], '#5a4a3a', 1.4); }
  if (p.mask === 1) { // the white half-mask over the far side of the face
    path(g, [[mid - 3, hl + 4], [cx + fw + 6, hl], [cx + fw + 6, ey + 8], [cx + fw - 2, ey + 22], [mid + 6, ey + 20], [mid + 1, ey + 8]]); ink(g, '#f6f6fa', '#8a8a9a', 1.5);
    g.save(); g.clip(); g.fillStyle = '#d8d8e4'; g.fillRect(cx + fw - 6, hl - 4, 20, 40); g.restore();
    path(g, [[farEye - 8, ey], [farEye, ey - 6, farEye + 8, ey - 1], [farEye, ey + 3, farEye - 8, ey]]); g.fillStyle = '#1a1a24'; g.fill();
    stroke(g, [[mid + 4, ey + 14], [farEye + 4, ey + 18, cx + fw, ey + 8]], '#b8b8c8', 1); stroke(g, [[farEye - 6, ey - 12], [farEye + 4, ey - 15, farEye + 10, ey - 10]], '#b8b8c8', 1);
  }
  if (p.mask === 'lower') { const oc = p.oc || '#2a2a2a'; path(g, [[cx - fw, ey + 6], [mid, ey + 2, cx + fw + 2, ey + 4], [cx + fw - 2, ey + 22], [cx + 10, G.chin + 2], [cx - fw + 6, ey + 24]]); ink(g, oc, line(oc), 1.5); stroke(g, [[mid, ey + 6], [mid + 2, ey + 20, mid - 2, ey + 34]], shade(oc, 0.6), 1.1); stroke(g, [[cx - fw + 4, ey + 14], [mid - 6, ey + 18]], shade(oc, 1.3), 1); }
  if (p.circlet) { const c = p.circlet; stroke(g, [[cx - fw - 4, hl + 6], [cx + 4, hl - 8, cx + fw + 4, hl + 4]], shade(c, 0.5), 3.6); stroke(g, [[cx - fw - 4, hl + 6], [cx + 4, hl - 8, cx + fw + 4, hl + 4]], c, 2.2); path(g, [[cx + 5, hl - 9], [cx + 10, hl - 2], [cx + 5, hl + 5], [cx, hl - 2]]); ink(g, '#8ad0ff', '#2a5a8a', 1.1); g.fillStyle = '#ffffff'; g.fillRect(cx + 3.5, hl - 5, 2, 2); }
  if (p.crown) { const y = top + 6; path(g, [[cx - fw + 2, y + 8], [cx - fw, y - 12], [cx - fw / 2, y - 2], [cx + 4, y - 18], [cx + fw / 2 + 4, y - 2], [cx + fw + 2, y - 12], [cx + fw, y + 8], [cx + 4, y + 4]]); ink(g, '#e8c040', '#7a5a10', 1.5); g.save(); g.clip(); g.fillStyle = '#c8961a'; g.fillRect(cx + fw * 0.4, y - 20, 40, 30); g.restore(); for (const [x, c] of [[cx + 4, '#c83a3a'], [cx - fw / 2, '#3a7ac8'], [cx + fw / 2 + 4, '#3a7ac8']]) { g.beginPath(); g.arc(x, y + 1, 2.6, 0, 7); ink(g, c, '#3a1a10', 0.8); } }
  if (p.band) { const c = p.band; path(g, [[cx - fw - 7, hl + 4], [cx + 4, hl - 8, cx + fw + 7, hl + 2], [cx + fw + 7, hl + 9], [cx + 4, hl - 1, cx - fw - 7, hl + 11]]); ink(g, c, line(c), 1.3); path(g, [[cx - fw - 5, hl + 6], [cx - fw - 26, hl + 14], [cx - fw - 22, hl + 22], [cx - fw - 4, hl + 11]]); ink(g, shade(c, 0.85), line(c), 1.3); path(g, [[cx - fw - 5, hl + 8], [cx - fw - 20, hl + 26], [cx - fw - 14, hl + 30], [cx - fw - 3, hl + 12]]); ink(g, shade(c, 0.75), line(c), 1.3); }
  if (H.bandana) { const c = p.ac || '#a83030'; path(g, [[cx - fw - 8, hl + 6], [cx - fw - 4, top + 4, cx + 4, top], [cx + fw + 6, top + 4, cx + fw + 8, hl + 4], [cx + fw + 6, hl + 10], [cx + 4, hl - 2, cx - fw - 6, hl + 12]]); ink(g, c, line(c), 1.4); g.fillStyle = shade(c, 1.4); for (let i = 0; i < 6; i++) { g.beginPath(); g.arc(cx - fw + 4 + i * 11, hl - 6 - Math.sin(i / 5 * Math.PI) * 12, 1.6, 0, 7); g.fill(); } path(g, [[cx - fw - 6, hl + 8], [cx - fw - 26, hl + 22], [cx - fw - 18, hl + 30], [cx - fw - 4, hl + 14]]); ink(g, shade(c, 0.85), line(c), 1.3); }
  if (H.cap) { const c = p.ac || '#3a4a6a'; path(g, [[cx - fw - 7, hl + 6], [cx - fw - 4, top - 6, cx + 4, top - 8], [cx + fw + 6, top - 6, cx + fw + 7, hl + 4], [cx + 4, hl, cx - fw - 7, hl + 6]]); ink(g, c, line(c), 1.5); stroke(g, [[cx + 4, top - 6], [cx + 6, top + 20, cx + 4, hl]], shade(c, 0.6), 1); path(g, [[cx - fw + 4, hl + 2], [cx + 4, hl - 4, cx + fw + 26, hl + 6], [cx + fw + 20, hl + 12], [cx + 4, hl + 4, cx - fw + 2, hl + 8]]); ink(g, shade(c, 0.8), line(c), 1.4); }
  if (p.hat === 'feather') { const c = p.oc; path(g, [[cx - fw - 20, hl + 4], [cx - fw - 6, top - 16, cx + 6, top - 18], [cx + fw + 10, top - 16, cx + fw + 24, hl + 2], [cx + 4, hl - 4, cx - fw - 20, hl + 4]]); ink(g, c, line(c), 1.5); stroke(g, [[cx - fw - 14, hl], [cx + 4, hl - 8, cx + fw + 18, hl - 1]], p.ac || '#d8b060', 2.2); path(g, [[cx + 12, top - 10], [cx + 46, top - 52, cx + 64, top - 34], [cx + 44, top - 22, cx + 16, top - 4]]); ink(g, '#f2eee6', '#8a8478', 1.3); for (let i = 0; i < 5; i++) stroke(g, [[cx + 20 + i * 7, top - 10 - i * 4], [cx + 26 + i * 7, top - 20 - i * 4]], '#c8c0b4', 1); }
  if (p.hat === 'tricorn') { path(g, [[cx - fw - 24, hl + 2], [cx - fw - 2, top - 22, cx + 4, top - 14], [cx + fw + 6, top - 22, cx + fw + 26, hl + 2], [cx + 4, hl - 2]]); ink(g, '#1e1e26', '#000000', 1.5); stroke(g, [[cx - fw - 20, hl + 1], [cx + 4, hl - 4, cx + fw + 22, hl + 1]], p.ac || '#d8c070', 2); stroke(g, [[cx - fw - 8, top - 6], [cx + 4, top - 12, cx + fw + 4, top - 8]], 'rgba(255,255,255,0.25)', 1.5); g.beginPath(); g.arc(cx + 4, hl - 8, 3, 0, 7); ink(g, '#d8c070', '#5a4a10', 1); }
  if (p.mitre) { path(g, [[cx - fw + 2, hl + 2], [cx - fw + 6, top - 34], [cx + 4, top - 52], [cx + fw + 2, top - 34], [cx + fw + 6, hl]]); ink(g, '#f6f2ea', '#8a8478', 1.5); g.fillStyle = '#d8a840'; g.fillRect(cx + 1, top - 44, 6, hl - top + 44); g.fillRect(cx - 9, top - 24, 26, 5); path(g, [[cx - fw + 2, hl + 2], [cx + 4, hl - 6, cx + fw + 6, hl], [cx + fw + 6, hl - 6], [cx + 4, hl - 12, cx - fw + 3, hl - 4]]); ink(g, '#d8a840', '#7a5a20', 1.2); }
  if (p.veil && !H.veil) { path(g, [[cx - fw - 12, hl + 12], [cx - fw - 2, top - 6, cx + 4, top - 8], [cx + fw + 6, top - 6, cx + fw + 12, hl + 10], [cx + fw - 2, hl + 2], [cx + 4, hl - 6, cx - fw + 2, hl + 4]]); ink(g, '#f6f2ee', '#a8a098', 1.4); g.beginPath(); g.arc(cx + 4, hl - 3, 3, 0, 7); ink(g, '#d8a840', '#7a5a20', 1); }
  if (H.veil === 'nun') { path(g, [[cx - fw - 10, hl + 22], [cx - fw - 4, top - 8, cx + 4, top - 10], [cx + fw + 8, top - 8, cx + fw + 12, hl + 20], [cx + fw + 2, hl + 16], [cx + fw, hl - 4, cx + 4, hl - 6], [cx - fw, hl - 4, cx - fw - 1, hl + 18]]); ink(g, '#2a2a34', '#0e0e14', 1.5); stroke(g, [[cx - fw - 4, hl + 10], [cx - fw + 2, top + 6, cx + 4, top + 2]], '#4a4a5a', 1.4); path(g, [[cx - fw - 1, hl + 6], [cx + 4, hl - 8, cx + fw + 2, hl + 4], [cx + fw + 1, hl + 1], [cx + 4, hl - 3, cx - fw, hl + 10]]); ink(g, '#f4f0e8', '#8a8478', 1); }
  if (H.helm) { const c = '#a8acb8', l = line(c); path(g, [[cx - fw - 8, ey + 14], [cx - fw - 12, top - 8, cx + 4, top - 14], [cx + fw + 14, top - 8, cx + fw + 9, ey + 12], [cx + fw - 1, ey + 12], [cx + fw - 2, hl + 8], [cx + 4, hl + 2, cx - fw + 2, hl + 8], [cx - fw + 1, ey + 14]]); ink(g, c, l, 1.5); g.save(); g.clip(); g.fillStyle = shade(c, 0.75); g.fillRect(cx + fw * 0.4, top - 20, 60, 140); g.restore(); stroke(g, [[cx - fw - 2, top + 30], [cx - fw + 8, top + 2, cx + 4, top - 6]], 'rgba(255,255,255,0.7)', 2.4); path(g, [[cx + 1, top - 14], [cx + 7, top - 14], [cx + 7, hl + 4], [cx + 1, hl + 4]]); ink(g, shade(c, 1.2), l, 1.1); stroke(g, [[cx - fw + 2, hl + 8], [cx + 4, hl + 2, cx + fw - 2, hl + 8]], shade(c, 0.5), 1.6); }
}
