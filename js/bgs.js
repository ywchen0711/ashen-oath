// Backdrops for the story scenes, painted in the manner of visual-novel backgrounds: a sky with lit clouds, faceted
// mountains fading into haze, trees built from lit and shaded leaf clusters, timber-framed houses and stone keeps,
// rooms with perspective floors, light falling through windows, and a colour grade over it all. 960×540, painted
// once from a fixed seed and kept.
const CACHE = {};
const W = 960, H = 540;
let g, R;
function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const rr = (a, b) => a + R() * (b - a);
const hx = (h) => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const sh = (h, k, a = 1) => { const c = hx(h).map((v) => Math.max(0, Math.min(255, k > 1 ? v + (255 - v) * (k - 1) : v * k)) | 0); return `rgba(${c[0]},${c[1]},${c[2]},${a})`; };
const mix = (h1, h2, t, a = 1) => { const a1 = hx(h1), b = hx(h2); return `rgba(${a1.map((v, i) => (v * (1 - t) + b[i] * t) | 0).join(',')},${a})`; };
const circle = (x, y, r) => { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); };
const poly = (pts, fill) => { g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (const p of pts.slice(1)) g.lineTo(p[0], p[1]); g.closePath(); if (fill) { g.fillStyle = fill; g.fill(); } };
const rect = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
const lineS = (x1, y1, x2, y2, col, w = 1) => { g.strokeStyle = col; g.lineWidth = w; g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke(); };
const blur = (px, fn) => { g.save(); g.filter = `blur(${px}px)`; fn(); g.restore(); };
const lighter = (fn, a = 1) => { g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = a; fn(); g.restore(); };

// ---------------------------------------------------------------- sky
function sky(stops, y1 = H) { const gr = g.createLinearGradient(0, 0, 0, y1); for (const [o, c] of stops) gr.addColorStop(o, c); g.fillStyle = gr; g.fillRect(0, 0, W, y1); }
function glow(x, y, r, col, a = 1, add = false) { const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, col); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.save(); if (add) g.globalCompositeOperation = 'lighter'; g.globalAlpha = a; g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); g.restore(); }
function sun(x, y, r, col = '#fff0c0') { glow(x, y, r * 9, sh(col, 1, 0.35), 1, true); glow(x, y, r * 3, sh(col, 1.1, 0.7), 1, true); lighter(() => { g.fillStyle = '#fffcf0'; circle(x, y, r); }); }
function moon(x, y, r) { glow(x, y, r * 7, 'rgba(190,210,255,0.22)', 1, true); g.fillStyle = '#f6f2e2'; circle(x, y, r); g.fillStyle = 'rgba(180,180,170,0.35)'; for (const [a, b, c] of [[-0.3, -0.2, 0.25], [0.3, 0.2, 0.18], [0.05, 0.45, 0.12]]) circle(x + a * r, y + b * r, c * r); }
function stars(n, y1, milky) {
  if (milky) blur(14, () => { g.save(); g.translate(W * 0.55, y1 * 0.45); g.rotate(-0.35); const gr = g.createLinearGradient(0, -60, 0, 60); gr.addColorStop(0, 'rgba(150,160,255,0)'); gr.addColorStop(0.5, 'rgba(190,190,255,0.16)'); gr.addColorStop(1, 'rgba(150,160,255,0)'); g.fillStyle = gr; g.fillRect(-700, -60, 1400, 120); g.restore(); });
  for (let k = 0; k < n; k++) { const x = R() * W, y = Math.pow(R(), 1.3) * y1, b = R(), s = b > 0.97 ? 2.2 : b > 0.85 ? 1.5 : 1; g.fillStyle = `rgba(255,${235 + R() * 20},${210 + R() * 45},${0.35 + R() * 0.65})`; g.fillRect(x, y, s, s); if (b > 0.97) { g.globalAlpha = 0.5; lineS(x - 4, y + 1, x + 6, y + 1, '#ffffff', 0.6); lineS(x + 1, y - 4, x + 1, y + 6, '#ffffff', 0.6); g.globalAlpha = 1; } }
}
// a cloud: puffs with a shaded underside and a lit top, the lit side toward the light
function cloud(x, y, s, lit, dark, a = 1, rim) {
  // puffs heaped into a cumulus with a flat base: lit on top, shaded toward the base, a bright rim on the top edge
  const n = 7 + (R() * 5) | 0, puffs = [], wide = s * rr(2.2, 3.2);
  for (let i = 0; i < n; i++) { const t = i / (n - 1), hgt = Math.sin(t * Math.PI); puffs.push([x + (t - 0.5) * wide + rr(-0.1, 0.1) * s, y - hgt * s * rr(0.45, 0.8) + s * 0.1, s * (0.28 + hgt * rr(0.22, 0.38))]); }
  const top = y - s * 1.3, base = y + s * 0.2;
  g.save(); g.globalAlpha = a; g.beginPath(); g.rect(x - wide, top - s, wide * 2, base - top + s); g.clip();
  const gr = g.createLinearGradient(0, top, 0, base); gr.addColorStop(0, lit); gr.addColorStop(0.55, lit); gr.addColorStop(1, dark); g.fillStyle = gr;
  g.beginPath(); for (const [px, py, pr] of puffs) { g.moveTo(px + pr, py); g.arc(px, py, pr, 0, Math.PI * 2); } g.fill();
  g.fillStyle = dark; g.globalAlpha = a * 0.55; g.beginPath(); for (const [px, py, pr] of puffs) { g.moveTo(px + pr * 0.7, py + pr * 0.5); g.arc(px + pr * 0.1, py + pr * 0.5, pr * 0.62, 0, Math.PI * 2); } g.fill();
  if (rim) { g.globalAlpha = a * 0.8; g.strokeStyle = rim; g.lineWidth = Math.max(1.5, s * 0.06); for (const [px, py, pr] of puffs) { g.beginPath(); g.arc(px, py, pr * 0.96, Math.PI * 1.1, Math.PI * 1.55); g.stroke(); } }
  g.restore();
}
function clouds(n, y0, y1, s0, s1, lit, dark, a = 1, rim, soft = 1.2) { blur(soft, () => { for (let k = 0; k < n; k++) { const y = rr(y0, y1), sc = s0 + (s1 - s0) * ((y - y0) / Math.max(1, y1 - y0)); cloud(rr(-40, W + 40), y, sc * rr(0.7, 1.2), lit, dark, a, rim); } }); }
// ---------------------------------------------------------------- land
function ridge(y, amp, seed, rough = 0.5) {
  // a few real peaks first, then smaller and smaller wobbles between them
  const n = 3 + (R() * 3) | 0, sp = (W + 40) / n; let pts = [[-20, y - amp * rr(0.1, 0.4)]];
  for (let k = 0; k < n; k++) { const x = (k + rr(0.35, 0.65)) * sp - 20; pts.push([x - sp * rr(0.42, 0.5), y - amp * rr(0.05, 0.3)], [x + rr(-8, 8), y - amp * rr(0.6, 1)]); }
  pts.push([W + 20, y - amp * rr(0.1, 0.4)]);
  for (let it = 0, d = amp * 0.1; it < 6; it++, d *= rough) { const np = []; for (let i = 0; i < pts.length - 1; i++) { const [a, b] = [pts[i], pts[i + 1]]; np.push(a, [(a[0] + b[0]) / 2 + rr(-3, 3), (a[1] + b[1]) / 2 + rr(-d, d)]); } np.push(pts[pts.length - 1]); pts = np; }
  return pts;
}
function mountains(y, amp, light, dark, o = {}) {
  const pts = ridge(y, amp, 0, o.rough || 0.55), base = o.base || H;
  poly([...pts, [W + 20, base], [-20, base]], dark);
  // lit faces: from each peak down its left slope
  for (let i = 2; i < pts.length - 2; i++) {
    const p = pts[i]; if (!(p[1] < pts[i - 1][1] && p[1] < pts[i + 1][1] && p[1] < pts[i - 2][1] && p[1] < pts[i + 2][1])) continue;
    let j = i; while (j > 0 && pts[j - 1][1] >= pts[j][1] - 2) j--; const v = pts[j], mid = [p[0] + rr(4, 16), p[1] + (base - p[1]) * rr(0.3, 0.5)], foot = [p[0] - (p[0] - v[0]) * rr(0.1, 0.3), base];
    poly([...pts.slice(j, i + 1), mid, foot, [v[0] + (p[0] - v[0]) * 0.1, base]], light);
    g.globalAlpha = 0.5; for (let q = 0; q < 3; q++) { const x0 = p[0] + rr(-30, 30); lineS(x0, p[1] + rr(10, 30), x0 + rr(-20, 20), p[1] + rr(40, 90), dark, rr(1, 2.5)); } g.globalAlpha = 1;
    if (o.snow && p[1] < o.snow) { const cap = Math.min(o.snow, p[1] + 34), sn = pts.slice(Math.max(0, i - 8), i + 9).filter((q) => q[1] < cap); if (sn.length > 2) { const bottom = sn.slice().reverse().map(([x, yy]) => [x + rr(-3, 3), Math.min(cap + 6, yy + rr(6, 20))]); poly([...sn, ...bottom], o.snowCol || '#f4f6fa'); poly([...sn.filter((q) => q[0] > p[0]), ...bottom.filter((q) => q[0] > p[0])], 'rgba(150,170,210,0.45)'); } }
  }
  if (o.haze) { const gr = g.createLinearGradient(0, y - amp, 0, base); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, o.haze); g.fillStyle = gr; poly([...pts, [W + 20, base], [-20, base]]); g.fill(); }
  return pts;
}
function hills(y, amp, col, lit, n = 4, o = {}) {
  const pts = []; const ph = rr(0, 6); for (let x = -20; x <= W + 20; x += 12) pts.push([x, y - Math.sin(x / W * Math.PI * n + ph) * amp - Math.sin(x / 70 + ph * 2) * amp * 0.12]);
  poly([...pts, [W + 20, H], [-20, H]], col);
  if (lit) { const gr = g.createLinearGradient(0, y - amp, 0, y + amp * 2); gr.addColorStop(0, lit); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; poly([...pts, [W + 20, H], [-20, H]]); g.fill(); }
  if (o.haze) { const gr = g.createLinearGradient(0, y - amp, 0, y + 60); gr.addColorStop(0, o.haze); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; poly([...pts, [W + 20, H], [-20, H]]); g.fill(); }
  return pts;
}
// a line of distant trees: canopies with a lit rim
function treeline(y, h, col, lit, o = {}) {
  const pts = []; for (let x = -30; x < W + 30; x += rr(h * 0.25, h * 0.45)) pts.push([x, y - rr(h * 0.55, h), rr(h * 0.3, h * 0.5)]);
  g.fillStyle = col; rect(-30, y - h * 0.3, W + 60, H - y + h * 0.3, col);
  for (const [x, ty, r] of pts) { g.fillStyle = col; if (o.conifer) { for (let k = 0; k < 3; k++) poly([[x, ty + k * r * 0.5], [x - r * (0.55 + k * 0.2), ty + r * (0.9 + k * 0.6)], [x + r * (0.55 + k * 0.2), ty + r * (0.9 + k * 0.6)]], col); rect(x - r * 0.6, ty + r * 1.6, r * 1.2, y - ty, col); } else { circle(x, ty + r, r); circle(x - r * 0.6, ty + r * 1.4, r * 0.8); circle(x + r * 0.6, ty + r * 1.3, r * 0.85); rect(x - r * 1.2, ty + r * 1.4, r * 2.4, y - ty, col); } }
  if (lit) { g.fillStyle = lit; for (const [x, ty, r] of pts) { if (o.conifer) { poly([[x, ty], [x - r * 0.5, ty + r * 0.85], [x - r * 0.2, ty + r * 0.75]], lit); } else { g.beginPath(); g.arc(x, ty + r, r, Math.PI * 1.05, Math.PI * 1.6); g.arc(x - r * 0.1, ty + r * 1.15, r * 0.8, Math.PI * 1.6, Math.PI * 1.05, true); g.fill(); } } }
}
// a tree near the viewer: a tapering trunk with branches, a crown of leaf clusters each shaded dark, mid and light
function tree(x, y, s, pal = {}) {
  const bark = pal.bark || '#5a4030', dk = pal.dark || '#2a4a28', md = pal.mid || '#3f6e34', lt = pal.light || '#7aa850', hl = pal.hi || '#b0d070';
  const tw = s * 0.09; poly([[x - tw, y], [x - tw * 0.55, y - s * 0.55], [x + tw * 0.45, y - s * 0.55], [x + tw, y]], bark); poly([[x + tw * 0.1, y], [x + tw * 0.1, y - s * 0.55], [x + tw * 0.45, y - s * 0.55], [x + tw, y]], sh(bark, 0.65));
  for (let k = 0; k < 5; k++) lineS(x + rr(-tw * 0.5, tw * 0.3), y - rr(0, s * 0.5), x + rr(-tw * 0.4, tw * 0.3), y - rr(0, s * 0.5), sh(bark, 0.6), 1);
  g.strokeStyle = bark; g.lineWidth = tw * 0.5; for (const sd of [-1, 1]) { g.beginPath(); g.moveTo(x, y - s * 0.45); g.quadraticCurveTo(x + sd * s * 0.15, y - s * 0.55, x + sd * s * 0.28, y - s * 0.72); g.stroke(); }
  const blobs = []; for (let k = 0; k < 9; k++) { const a = rr(Math.PI * 0.95, Math.PI * 2.05), d = rr(0.1, 0.42) * s; blobs.push([x + Math.cos(a) * d * 1.15, y - s * 0.78 + Math.sin(a) * d * 0.75, s * rr(0.16, 0.26)]); }
  blobs.sort((a, b) => a[1] - b[1]);
  g.fillStyle = dk; for (const [bx, by, r] of blobs) circle(bx, by + r * 0.15, r * 1.05);
  g.fillStyle = md; for (const [bx, by, r] of blobs) circle(bx - r * 0.1, by - r * 0.08, r * 0.86);
  g.fillStyle = lt; for (const [bx, by, r] of blobs) { circle(bx - r * 0.28, by - r * 0.3, r * 0.5); }
  g.fillStyle = hl; for (const [bx, by, r] of blobs) for (let q = 0; q < 4; q++) circle(bx - r * 0.35 + rr(-r * 0.25, r * 0.25), by - r * 0.4 + rr(-r * 0.2, r * 0.2), r * 0.1);
  g.fillStyle = mix(dk, md, 0.5); for (const [bx, by, r] of blobs) for (let q = 0; q < 3; q++) circle(bx + r * 0.3 + rr(-r * 0.2, r * 0.3), by + r * 0.3 + rr(-0.1, 0.2) * r, r * 0.2);
}
function sakura(x, y, s) { tree(x, y, s, { bark: '#4a3030', dark: '#c0607a', mid: '#e48aa4', light: '#f6b8ca', hi: '#fde6ee' }); }
function conifer(x, y, s, pal = {}) {
  const dk = pal.dark || '#1e3a2e', lt = pal.light || '#3a6a4a', snow = pal.snow;
  rect(x - s * 0.04, y - s * 0.2, s * 0.08, s * 0.2, '#3a2a20');
  for (let k = 0; k < 5; k++) { const ty = y - s + k * s * 0.17, w = s * (0.12 + k * 0.08); poly([[x, ty], [x - w, ty + s * 0.26], [x + w, ty + s * 0.26]], dk); poly([[x, ty], [x - w, ty + s * 0.26], [x - w * 0.2, ty + s * 0.22]], lt); if (snow) poly([[x, ty + 1], [x - w * 0.8, ty + s * 0.2], [x - w * 0.3, ty + s * 0.16], [x + w * 0.5, ty + s * 0.19]], snow); }
}
function grass(y0, y1, n, cols, len = 8) { for (let k = 0; k < n; k++) { const x = R() * W, y = rr(y0, y1), l = len * (0.5 + (y - y0) / Math.max(1, y1 - y0)) * rr(0.6, 1.3); g.strokeStyle = cols[(R() * cols.length) | 0]; g.lineWidth = rr(1, 2); g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + rr(-2, 2), y - l * 0.6, x + rr(-l * 0.4, l * 0.4), y - l); g.stroke(); } }
function flowers(n, y0, y1, cols) { for (let k = 0; k < n; k++) { const y = rr(y0, y1), s = 1 + (y - y0) / Math.max(1, y1 - y0) * 2.5; g.fillStyle = cols[(R() * cols.length) | 0]; const x = R() * W; for (let p = 0; p < 4; p++) circle(x + Math.cos(p * 1.57) * s, y + Math.sin(p * 1.57) * s * 0.6, s * 0.8); g.fillStyle = '#f8e070'; circle(x, y, s * 0.5); } }
function road(xTop, wTop, xBot, wBot, yTop, col, edge) {
  poly([[xTop - wTop / 2, yTop], [xTop + wTop / 2, yTop], [xBot + wBot / 2, H], [xBot - wBot / 2, H]], col);
  for (let k = 0; k < 60; k++) { const t = Math.pow(R(), 0.7), y = yTop + (H - yTop) * t, cx = xTop + (xBot - xTop) * t, w = wTop + (wBot - wTop) * t, x = cx + rr(-0.45, 0.45) * w, s = 1 + t * 5; g.fillStyle = sh(col, rr(0.78, 1.15)); g.beginPath(); g.ellipse(x, y, s * 1.4, s * 0.6, 0, 0, 7); g.fill(); }
  if (edge) { g.globalAlpha = 0.5; lineS(xTop - wTop / 2, yTop, xBot - wBot / 2, H, edge, 3); lineS(xTop + wTop / 2, yTop, xBot + wBot / 2, H, edge, 3); g.globalAlpha = 1; }
}
// ---------------------------------------------------------------- water
function water(y0, top, bottom, o = {}) {
  const gr = g.createLinearGradient(0, y0, 0, H); gr.addColorStop(0, top); gr.addColorStop(1, bottom); g.fillStyle = gr; g.fillRect(0, y0, W, H - y0);
  for (let k = 0; k < (o.n || 260); k++) { const t = Math.pow(R(), 1.6), y = y0 + 2 + t * (H - y0), w = 6 + t * 60; g.strokeStyle = R() < 0.5 ? (o.light || 'rgba(255,255,255,0.22)') : (o.dark || 'rgba(0,0,30,0.25)'); g.lineWidth = 0.6 + t * 2; const x = R() * W; g.beginPath(); g.moveTo(x - w / 2, y); g.quadraticCurveTo(x, y - 1 - t * 2, x + w / 2, y); g.stroke(); }
  if (o.glint) { const [gx, col] = o.glint; lighter(() => { for (let k = 0; k < 70; k++) { const t = Math.pow(R(), 1.2), y = y0 + t * (H - y0), w = (8 + t * 90) * rr(0.3, 1); g.fillStyle = col; g.globalAlpha = (1 - t * 0.6) * rr(0.3, 0.9); g.fillRect(gx + rr(-1, 1) * (20 + t * 120) - w / 2, y, w, 1 + t * 2.5); } }); }
}
function ship(x, y, s, o = {}) {
  const hull = o.hull || '#4a3020', sail = o.sail || '#ece4d0', dark = o.dark;
  poly([[x - s, y - s * 0.25], [x + s * 1.1, y - s * 0.3], [x + s * 0.8, y + s * 0.05], [x - s * 0.75, y + s * 0.05]], hull);
  rect(x - s, y - s * 0.27, s * 2.1, s * 0.05, sh(hull, 1.5)); for (let k = 0; k < 6; k++) rect(x - s * 0.7 + k * s * 0.28, y - s * 0.17, s * 0.08, s * 0.06, '#1a1008');
  for (const [mx, mh, sw] of [[-0.35, 1.1, 0.42], [0.35, 1.3, 0.5]]) { rect(x + mx * s - 2, y - s * 0.3 - mh * s, 4, mh * s, sh(hull, 0.8)); for (let q = 0; q < 2; q++) { const sy = y - s * 0.3 - mh * s * (0.95 - q * 0.45), sh2 = mh * s * 0.38; g.beginPath(); g.moveTo(x + mx * s - sw * s, sy); g.quadraticCurveTo(x + mx * s, sy + sh2 * 0.25, x + mx * s + sw * s, sy); g.lineTo(x + mx * s + sw * s * 0.9, sy + sh2); g.quadraticCurveTo(x + mx * s + s * 0.1, sy + sh2 * 1.25, x + mx * s - sw * s * 0.9, sy + sh2); g.closePath(); g.fillStyle = dark ? sh(sail, 0.35) : sail; g.fill(); if (!dark) { g.fillStyle = 'rgba(0,0,0,0.15)'; g.fillRect(x + mx * s + s * 0.05, sy, sw * s, sh2 * 1.1); } } }
  g.globalAlpha = 0.6; lineS(x - s, y - s * 0.3, x - s * 0.35, y - s * 1.4, sh(hull, 0.6), 1); lineS(x + s * 1.1, y - s * 0.3, x + s * 0.35, y - s * 1.6, sh(hull, 0.6), 1); g.globalAlpha = 1;
  if (o.flag) poly([[x + s * 0.35, y - s * 1.6], [x + s * 0.6, y - s * 1.53], [x + s * 0.35, y - s * 1.46]], o.flag);
}
// ---------------------------------------------------------------- buildings
function house(x, y, w, h, o = {}) {
  const wall = o.wall || '#e8dcc4', roof = o.roof || '#a8503a', wood = o.wood || '#5a3a24', side = o.side ?? w * 0.32, lift = side * 0.35, rh = w * 0.5;
  poly([[x + w, y], [x + w + side, y - lift], [x + w + side, y - h - lift], [x + w, y - h]], sh(wall, 0.7));
  rect(x, y - h, w, h, wall); for (let k = 0; k < w * h / 60; k++) rect(x + R() * w, y - R() * h, 1.5, 1.5, sh(wall, rr(0.85, 0.95), 0.6));
  const tim = (x1, y1, x2, y2, t = 4) => lineS(x1, y1, x2, y2, wood, t);
  if (o.timber !== false) { tim(x + 2, y, x + 2, y - h); tim(x + w - 2, y, x + w - 2, y - h); tim(x, y - h * 0.5, x + w, y - h * 0.5, 3.5); tim(x, y - h + 2, x + w, y - h + 2); tim(x + 2, y - h * 0.5, x + w * 0.3, y - h); tim(x + w - 2, y - h * 0.5, x + w * 0.7, y - h); tim(x + w + side * 0.5, y - lift * 0.5, x + w + side * 0.5, y - h - lift * 0.5, 3); }
  // the roof: the gable over the front, the long slope going back
  const peak = [x + w / 2, y - h - rh];
  poly([[peak[0], peak[1]], [peak[0] + side, peak[1] - lift], [x + w + side + 6, y - h - lift + 2], [x + w + 6, y - h + 2]], sh(roof, 0.82));
  for (let k = 1; k < 7; k++) { const t = k / 7; lineS(peak[0] + (x + w + 6 - peak[0]) * t, peak[1] + (y - h + 2 - peak[1]) * t, peak[0] + side + (x + w + side + 6 - peak[0] - side) * t, peak[1] - lift + (y - h - lift + 2 - peak[1] + lift) * t, sh(roof, 0.6), 1.2); }
  poly([[x - 6, y - h + 2], peak, [x + w + 6, y - h + 2]], wall); tim(x - 6, y - h + 2, peak[0], peak[1], 5); tim(peak[0], peak[1], x + w + 6, y - h + 2, 5); lineS(peak[0], peak[1], peak[0] + side, peak[1] - lift, sh(roof, 0.5), 3);
  if (o.roofFront) poly([[x - 8, y - h + 4], peak, [x + w + 8, y - h + 4], [x + w + 8, y - h + 10], peak.map((v, i) => v + (i ? 6 : 0)), [x - 8, y - h + 10]], roof);
  if (o.chimney) { const cx2 = x + w + side * 0.55; rect(cx2, y - h - rh * 0.8 - lift, 10, rh * 0.6, sh(o.stone || '#8a8078', 1)); rect(cx2 - 2, y - h - rh * 0.8 - lift, 14, 4, sh(o.stone || '#8a8078', 0.7)); if (o.smoke) blur(4, () => { for (let k = 0; k < 6; k++) { g.fillStyle = `rgba(200,200,210,${0.25 - k * 0.03})`; circle(cx2 + 5 + k * 8, y - h - rh * 0.9 - lift - k * 16, 6 + k * 3); } }); }
  // windows and a door
  const win = (wx, wy, ww, wh) => { rect(wx - 2, wy - 2, ww + 4, wh + 4, wood); if (o.lit) { const gr = g.createLinearGradient(0, wy, 0, wy + wh); gr.addColorStop(0, '#ffe8a0'); gr.addColorStop(1, '#f0a040'); g.fillStyle = gr; g.fillRect(wx, wy, ww, wh); glow(wx + ww / 2, wy + wh / 2, ww * 2, 'rgba(255,190,90,0.35)', 1, true); } else rect(wx, wy, ww, wh, o.glass || '#3a4a5a'); if (!o.lit) rect(wx, wy, ww * 0.4, wh, 'rgba(255,255,255,0.12)'); lineS(wx + ww / 2, wy, wx + ww / 2, wy + wh, wood, 2); lineS(wx, wy + wh / 2, wx + ww, wy + wh / 2, wood, 2); rect(wx - 4, wy + wh + 1, ww + 8, 3, sh(wood, 1.2)); if (o.flowers) for (let q = 0; q < 4; q++) { g.fillStyle = ['#e85a6a', '#f8c040', '#f0f0f0'][q % 3]; circle(wx + q * ww / 3, wy + wh, 2.6); } };
  const ww = Math.max(10, w * 0.16), wh = Math.max(12, h * 0.22);
  win(x + w * 0.16, y - h * 0.86, ww, wh); win(x + w * 0.84 - ww, y - h * 0.86, ww, wh); win(x + w * 0.16, y - h * 0.38, ww, wh);
  if (h > 40) { const dw = w * 0.2, dh = h * 0.36; rect(x + w * 0.62 - 2, y - dh - 2, dw + 4, dh + 2, wood); rect(x + w * 0.62, y - dh, dw, dh, sh(wood, 1.3)); for (let k = 1; k < 3; k++) lineS(x + w * 0.62 + dw * k / 3, y - dh, x + w * 0.62 + dw * k / 3, y, sh(wood, 0.8), 1); circle(x + w * 0.62 + dw * 0.8, y - dh * 0.5, 1.4); }
  if (o.burnt) { g.fillStyle = 'rgba(20,10,8,0.6)'; poly([[x, y], [x, y - h * rr(0.4, 0.9)], [x + w * 0.3, y - h * rr(0.6, 1)], [x + w * 0.7, y - h * rr(0.3, 0.8)], [x + w + side, y - h * 0.5], [x + w + side, y]]); g.fill(); }
}
function stoneWall(x, y, w, h, col, o = {}) {
  rect(x, y, w, h, col); const bh = o.bh || 14, bw = o.bw || 30;
  for (let r = 0; r * bh < h; r++) for (let c = -1; c * bw < w; c++) { const bx = x + c * bw + (r % 2 ? bw / 2 : 0), by = y + r * bh; if (bx > x + w) continue; g.fillStyle = sh(col, rr(0.85, 1.12)); g.fillRect(Math.max(x, bx) + 1, by + 1, Math.min(bw - 2, x + w - Math.max(x, bx) - 1), bh - 2); }
  g.globalAlpha = 0.5; for (let r = 0; r * bh < h; r++) lineS(x, y + r * bh, x + w, y + r * bh, sh(col, 0.55), 1); g.globalAlpha = 1;
  if (o.cren) for (let c = 0; c * 26 < w; c++) { rect(x + c * 26, y - 14, 16, 14, col); rect(x + c * 26 + 12, y - 14, 4, 14, sh(col, 0.7)); }
  if (o.shade) { const gr = g.createLinearGradient(0, y, 0, y + h); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, o.shade); g.fillStyle = gr; g.fillRect(x, y, w, h); }
}
function tower(x, y, w, h, col, roof, o = {}) {
  const gr = g.createLinearGradient(x, 0, x + w, 0); gr.addColorStop(0, sh(col, 1.15)); gr.addColorStop(0.45, col); gr.addColorStop(1, sh(col, 0.6)); g.fillStyle = gr; g.fillRect(x, y - h, w, h);
  g.globalAlpha = 0.35; for (let r = 0; r < h / 12; r++) lineS(x, y - r * 12, x + w, y - r * 12, sh(col, 0.5), 1); g.globalAlpha = 1;
  for (let k = 0; k < 3; k++) { const wy = y - h * (0.3 + k * 0.22); rect(x + w * 0.42, wy, w * 0.16, h * 0.08, o.lit ? '#ffc870' : '#1a1a22'); if (o.lit) glow(x + w / 2, wy + 4, 18, 'rgba(255,190,90,0.3)', 1, true); }
  if (roof) { poly([[x - w * 0.15, y - h], [x + w / 2, y - h - w * 1.3], [x + w * 1.15, y - h]], roof); poly([[x + w / 2, y - h - w * 1.3], [x + w * 1.15, y - h], [x + w * 0.6, y - h]], sh(roof, 0.7)); if (o.flag) { lineS(x + w / 2, y - h - w * 1.3, x + w / 2, y - h - w * 1.3 - 26, '#3a3030', 2); poly([[x + w / 2, y - h - w * 1.3 - 26], [x + w / 2 + 22, y - h - w * 1.3 - 20], [x + w / 2, y - h - w * 1.3 - 14]], o.flag); } }
  else for (let c = 0; c < 4; c++) rect(x + c * w / 3.5, y - h - 10, w / 7, 10, c === 3 ? sh(col, 0.6) : col);
}
function skyline(y, col, n, o = {}) { for (let k = 0; k < n; k++) { const w = rr(40, 90), x = k * (W / n) + rr(-10, 10), h = rr(60, 160); rect(x, y - h, w, h + 400, col); if (R() < 0.6) poly([[x - 4, y - h], [x + w / 2, y - h - rr(20, 50)], [x + w + 4, y - h]], col); else if (R() < 0.4) { rect(x + w * 0.35, y - h - 50, w * 0.3, 50, col); poly([[x + w * 0.3, y - h - 50], [x + w / 2, y - h - 90], [x + w * 0.7, y - h - 50]], col); } if (o.lit) for (let r = 0; r < 6; r++) for (let q = 0; q < 3; q++) if (R() < o.lit) { rect(x + 8 + q * (w - 16) / 3, y - h + 16 + r * 24, 6, 9, o.win || '#ffc870'); } } }
// ---------------------------------------------------------------- rooms
function room(o) {
  const hz = o.hz ?? 360, vp = o.vp || [480, 300];
  // the back wall
  rect(0, 0, W, hz, o.wall);
  if (o.tex === 'stone') stoneWall(0, 0, W, hz, o.wall, { bh: 26, bw: 54 });
  if (o.tex === 'wood') for (let x = 0; x < W; x += rr(28, 44)) { rect(x, 0, 2, hz, sh(o.wall, 0.65)); rect(x + 2, 0, 2, hz, sh(o.wall, 1.12, 0.5)); for (let k = 0; k < 4; k++) { g.globalAlpha = 0.25; lineS(x + rr(6, 24), rr(0, hz), x + rr(6, 24), rr(0, hz), sh(o.wall, 0.7), 1); g.globalAlpha = 1; } }
  if (o.tex === 'plaster') for (let k = 0; k < 1500; k++) rect(R() * W, R() * hz, 2, 2, sh(o.wall, rr(0.9, 1.08), 0.5));
  if (o.panel) { rect(0, hz - 110, W, 110, o.panel); for (let x = 10; x < W; x += 120) { g.strokeStyle = sh(o.panel, 0.65); g.lineWidth = 2; g.strokeRect(x, hz - 96, 100, 80); g.strokeStyle = sh(o.panel, 1.25, 0.6); g.strokeRect(x + 2, hz - 94, 100, 80); } rect(0, hz - 114, W, 8, sh(o.panel, 1.2)); }
  const wg = g.createLinearGradient(0, 0, 0, hz); wg.addColorStop(0, 'rgba(0,0,0,0.45)'); wg.addColorStop(0.5, 'rgba(0,0,0,0)'); wg.addColorStop(1, 'rgba(0,0,0,0.25)'); g.fillStyle = wg; g.fillRect(0, 0, W, hz);
  // the floor going back to the wall
  const fg = g.createLinearGradient(0, hz, 0, H); fg.addColorStop(0, sh(o.floor, 0.6)); fg.addColorStop(1, o.floor); g.fillStyle = fg; g.fillRect(0, hz, W, H - hz);
  if (o.ftex === 'boards' || !o.ftex) { for (let k = -14; k <= 14; k++) { const xb = vp[0] + k * 90; g.globalAlpha = 0.5; lineS(vp[0] + (xb - vp[0]) * (hz - vp[1]) / (H - vp[1]), hz, xb, H, sh(o.floor, 0.5), 1.5); g.globalAlpha = 1; } for (let k = 0; k < 9; k++) { const t = Math.pow(k / 9, 1.8), y = hz + t * (H - hz); g.globalAlpha = 0.25; lineS(0, y, W, y, sh(o.floor, 0.5), 1); g.globalAlpha = 1; } }
  if (o.ftex === 'tiles') { for (let k = -12; k <= 12; k++) { const xb = vp[0] + k * 110; lineS(vp[0] + (xb - vp[0]) * (hz - vp[1]) / (H - vp[1]), hz, xb, H, sh(o.floor, 0.55), 1.2); } for (let k = 0; k < 8; k++) { const t = Math.pow(k / 8, 1.7), y = hz + t * (H - hz); lineS(0, y, W, y, sh(o.floor, 0.55), 1.2); } g.globalAlpha = 0.25; g.fillStyle = '#ffffff'; g.fillRect(0, hz, W, 3); g.globalAlpha = 1; }
  if (o.carpet) { const [cw, col] = o.carpet; poly([[vp[0] - cw * (hz - vp[1]) / (H - vp[1]), hz], [vp[0] + cw * (hz - vp[1]) / (H - vp[1]), hz], [vp[0] + cw, H], [vp[0] - cw, H]], col); poly([[vp[0] - cw * (hz - vp[1]) / (H - vp[1]) + 4, hz], [vp[0] - cw * (hz - vp[1]) / (H - vp[1]) + 8, hz], [vp[0] - cw + 18, H], [vp[0] - cw + 10, H]], o.carpetTrim || '#d8b060'); poly([[vp[0] + cw * (hz - vp[1]) / (H - vp[1]) - 8, hz], [vp[0] + cw * (hz - vp[1]) / (H - vp[1]) - 4, hz], [vp[0] + cw - 10, H], [vp[0] + cw - 18, H]], o.carpetTrim || '#d8b060'); }
  rect(0, hz - 6, W, 8, sh(o.trim || o.wall, 0.55)); rect(0, hz - 8, W, 2, sh(o.trim || o.wall, 1.2));
  if (o.beams) for (let k = 0; k < 5; k++) { const x = 60 + k * 210; rect(x, 0, 26, hz, o.beams); rect(x, 0, 6, hz, sh(o.beams, 1.3)); rect(x + 20, 0, 6, hz, sh(o.beams, 0.6)); }
  if (o.ceiling) { rect(0, 0, W, 50, o.ceiling); rect(0, 44, W, 8, sh(o.ceiling, 0.6)); for (let x = 0; x < W; x += 80) rect(x, 0, 14, 50, sh(o.ceiling, 0.75)); }
}
function windowLight(x, y, w, h, o = {}) {
  const frame = o.frame || '#3a2a1e', arch = o.arch;
  const shape = () => { g.beginPath(); if (arch) { g.moveTo(x, y + h); g.lineTo(x, y + w / 2); g.arc(x + w / 2, y + w / 2, w / 2, Math.PI, 0); g.lineTo(x + w, y + h); } else g.rect(x, y, w, h); g.closePath(); };
  g.save(); shape(); g.clip(); const gr = g.createLinearGradient(0, y, 0, y + h); for (const [t, c] of o.sky || [[0, '#9ac8f0'], [1, '#e8f4ff']]) gr.addColorStop(t, c); g.fillStyle = gr; g.fillRect(x, y, w, h);
  if (o.night) stars(30, y + h); if (o.scene) o.scene(x, y, w, h);
  if (o.stained) { const cols = o.stained; for (let r = 0; r < 6; r++) for (let c = 0; c < 4; c++) { g.fillStyle = sh(cols[(r * 4 + c + r) % cols.length], rr(0.9, 1.2), 0.85); g.fillRect(x + c * w / 4, y + r * h / 6, w / 4, h / 6); } g.fillStyle = 'rgba(255,255,230,0.25)'; g.beginPath(); g.arc(x + w / 2, y + w * 0.55, w * 0.28, 0, 7); g.fill(); }
  g.restore();
  shape(); g.strokeStyle = frame; g.lineWidth = 7; g.stroke(); g.lineWidth = 3; lineS(x + w / 2, y + (arch ? 0 : 0), x + w / 2, y + h, frame, 4); for (let k = 1; k < 3; k++) lineS(x, y + h * k / 3, x + w, y + h * k / 3, frame, 3);
  rect(x - 10, y + h, w + 20, 8, sh(frame, 1.3)); rect(x - 10, y + h + 8, w + 20, 3, sh(frame, 0.6));
  if (o.rays) lighter(() => { blur(6, () => { const [dx, len, col] = o.rays; const gr2 = g.createLinearGradient(x, y, x + dx, y + len); gr2.addColorStop(0, col); gr2.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr2; poly([[x + 4, y + 8], [x + w - 4, y + 8], [x + w + dx + w * 0.4, y + len], [x + dx - w * 0.4, y + len]]); g.fill(); }); });
}
function bookshelf(x, y, w, h, wood = '#4a2e1c') {
  rect(x, y, w, h, wood); rect(x + w - 8, y, 8, h, sh(wood, 0.65)); const rows = Math.round(h / 52);
  for (let r = 0; r < rows; r++) { const sy = y + 8 + r * (h - 10) / rows, sh2 = (h - 10) / rows - 10; rect(x + 6, sy, w - 14, sh2, sh(wood, 0.4)); let bx = x + 8; while (bx < x + w - 14) { const bw = rr(5, 11), bh = sh2 * rr(0.65, 0.98), col = ['#8a2a2a', '#2a4a7a', '#3a6a3a', '#7a5a2a', '#5a2a5a', '#a87a3a', '#2a2a2a', '#6a6a5a'][(R() * 8) | 0]; if (R() < 0.08) { poly([[bx, sy + sh2], [bx + bh * 0.5, sy + sh2 - bh * 0.85], [bx + bh * 0.5 + bw, sy + sh2 - bh * 0.85], [bx + bw, sy + sh2]], col); bx += bh * 0.5 + bw + 2; continue; } rect(bx, sy + sh2 - bh, bw, bh, col); rect(bx, sy + sh2 - bh, 1.5, bh, sh(col, 1.4)); rect(bx + 1, sy + sh2 - bh * 0.75, bw - 2, 2, sh(col, 1.6, 0.8)); bx += bw + 0.5; } rect(x + 4, sy + sh2, w - 10, 6, sh(wood, 1.15)); }
}
function candle(x, y, s = 1, glowA = 1) { rect(x - 3 * s, y - 16 * s, 6 * s, 16 * s, '#f0e8d0'); rect(x + 1 * s, y - 16 * s, 2 * s, 16 * s, '#d0c4a8'); glow(x, y - 22 * s, 70 * s, 'rgba(255,180,80,0.5)', glowA, true); g.fillStyle = '#ffd070'; g.beginPath(); g.moveTo(x, y - 32 * s); g.quadraticCurveTo(x + 5 * s, y - 20 * s, x, y - 17 * s); g.quadraticCurveTo(x - 5 * s, y - 20 * s, x, y - 32 * s); g.fill(); g.fillStyle = '#fff8e0'; circle(x, y - 21 * s, 1.6 * s); }
function pillar(x, y0, y1, w, col) { const gr = g.createLinearGradient(x - w / 2, 0, x + w / 2, 0); gr.addColorStop(0, sh(col, 0.7)); gr.addColorStop(0.3, sh(col, 1.2)); gr.addColorStop(0.6, col); gr.addColorStop(1, sh(col, 0.45)); g.fillStyle = gr; g.fillRect(x - w / 2, y0, w, y1 - y0); for (let k = 1; k < 5; k++) { g.globalAlpha = 0.3; lineS(x - w / 2 + k * w / 5, y0 + 20, x - w / 2 + k * w / 5, y1 - 20, sh(col, 0.5), 1.5); g.globalAlpha = 1; } rect(x - w * 0.7, y0, w * 1.4, 20, sh(col, 1.05)); rect(x - w * 0.7, y0 + 16, w * 1.4, 4, sh(col, 0.6)); rect(x - w * 0.7, y1 - 22, w * 1.4, 22, sh(col, 0.95)); rect(x - w * 0.7, y1 - 22, w * 1.4, 3, sh(col, 1.3)); }
function banner(x, y, w, h, col, emblem) { rect(x - 6, y - 4, w + 12, 6, '#8a6a30'); g.beginPath(); g.moveTo(x, y); g.lineTo(x + w, y); g.lineTo(x + w, y + h); g.lineTo(x + w / 2, y + h - w * 0.35); g.lineTo(x, y + h); g.closePath(); g.fillStyle = col; g.fill(); const gr = g.createLinearGradient(x, 0, x + w, 0); gr.addColorStop(0, 'rgba(255,255,255,0.15)'); gr.addColorStop(0.3, 'rgba(0,0,0,0)'); gr.addColorStop(0.7, 'rgba(0,0,0,0.1)'); gr.addColorStop(1, 'rgba(0,0,0,0.35)'); g.fillStyle = gr; g.fill(); rect(x, y + 6, w, 4, '#d8b060'); if (emblem) emblem(x + w / 2, y + h * 0.42, w * 0.3); }
function flame(x, y, s) { glow(x, y - s, s * 5, 'rgba(255,140,40,0.55)', 1, true); for (const [c, k] of [['#c83a10', 1], ['#f08020', 0.75], ['#ffd060', 0.48], ['#fff4c0', 0.24]]) { g.fillStyle = c; g.beginPath(); g.moveTo(x - s * k, y); g.quadraticCurveTo(x - s * k * 1.1, y - s * k * 1.6, x + s * k * 0.1, y - s * k * 3); g.quadraticCurveTo(x + s * k * 0.4, y - s * k * 1.8, x + s * k, y); g.closePath(); g.fill(); } }
function crest(x, y, s, col = '#e8c860') { g.fillStyle = col; g.beginPath(); g.moveTo(x, y - s); g.quadraticCurveTo(x + s * 0.6, y - s * 0.3, x, y + s); g.quadraticCurveTo(x - s * 0.6, y - s * 0.3, x, y - s); g.fill(); g.fillStyle = sh(col, 1.4); g.beginPath(); g.moveTo(x, y - s * 0.6); g.quadraticCurveTo(x + s * 0.25, y - s * 0.1, x, y + s * 0.4); g.quadraticCurveTo(x - s * 0.15, y - s * 0.1, x, y - s * 0.6); g.fill(); }
function table(x, y, w, d, wood = '#5a3a24') { poly([[x - w / 2, y], [x + w / 2, y], [x + w / 2 + d * 0.3, y + d], [x - w / 2 - d * 0.3, y + d]], sh(wood, 1.15)); rect(x - w / 2 - d * 0.3, y + d, w + d * 0.6, 8, sh(wood, 0.7)); for (const lx of [x - w / 2 - d * 0.2, x + w / 2 + d * 0.2 - 8]) rect(lx, y + d + 8, 8, 50, sh(wood, 0.55)); }
// ---------------------------------------------------------------- weather and light
function particles(kind, n, o = {}) {
  for (let k = 0; k < n; k++) { const x = R() * W, y = R() * H, s = rr(0.6, 1.6) * (o.s || 1);
    if (kind === 'petal') { g.save(); g.translate(x, y); g.rotate(rr(0, 6)); g.fillStyle = ['#fbd0dc', '#f6b0c4', '#fff0f4'][(R() * 3) | 0]; g.beginPath(); g.ellipse(0, 0, 4 * s, 2 * s, 0, 0, 7); g.fill(); g.restore(); }
    if (kind === 'snow') { g.fillStyle = `rgba(255,255,255,${rr(0.5, 0.95)})`; circle(x, y, s * 1.6); }
    if (kind === 'ember') { lighter(() => { g.fillStyle = `rgba(255,${(120 + R() * 110) | 0},40,${rr(0.4, 1)})`; circle(x, y, s * 1.4); glow(x, y, s * 8, 'rgba(255,120,30,0.3)'); }); }
    if (kind === 'dust') { lighter(() => { g.fillStyle = `rgba(255,240,200,${rr(0.15, 0.5)})`; circle(x, y, s); }); }
    if (kind === 'firefly') { lighter(() => { glow(x, y, 10 * s, 'rgba(200,255,120,0.5)'); g.fillStyle = '#f0ffc0'; circle(x, y, 1.2 * s); }); }
    if (kind === 'rain') { g.globalAlpha = rr(0.2, 0.5); lineS(x, y, x - 6, y + 26 * s, '#c8d4e8', 1); g.globalAlpha = 1; }
  }
}
function rays(x, y, ang, n, len, col, spread = 0.6) { lighter(() => blur(10, () => { for (let k = 0; k < n; k++) { const a = ang + (k / Math.max(1, n - 1) - 0.5) * spread, w = rr(0.02, 0.06); const gr = g.createRadialGradient(x, y, 0, x, y, len); gr.addColorStop(0, col); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; poly([[x, y], [x + Math.cos(a - w) * len, y + Math.sin(a - w) * len], [x + Math.cos(a + w) * len, y + Math.sin(a + w) * len]]); g.fill(); } })); }
function mist(y, h, col) { blur(18, () => { for (let k = 0; k < 14; k++) { g.fillStyle = col; g.beginPath(); g.ellipse(rr(0, W), y + rr(-h / 2, h / 2), rr(120, 260), rr(14, 30), 0, 0, 7); g.fill(); } }); }
function grade(col, mode = 'soft-light', a = 0.5) { g.save(); g.globalCompositeOperation = mode; g.globalAlpha = a; g.fillStyle = col; g.fillRect(0, 0, W, H); g.restore(); }
function vignette(a = 0.55) { const v = g.createRadialGradient(480, 270, 220, 480, 270, 620); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, `rgba(0,0,0,${a})`); g.fillStyle = v; g.fillRect(0, 0, W, H); }

// ---------------------------------------------------------------- the scenes
const SCENES = {
  forest() {
    sky([[0, '#8ab8d8'], [0.5, '#c8e0d8']]); blur(3, () => { for (let k = 0; k < 14; k++) tree(rr(0, W), rr(330, 360), rr(160, 220), { dark: '#4a6a58', mid: '#5a7a64', light: '#7a9a7a', hi: '#9ab89a' }); });
    rect(0, 360, W, 180, '#3e5a2e'); for (let k = 0; k < 10; k++) tree(rr(0, W), rr(380, 420), rr(220, 300));
    rays(620, -40, Math.PI * 0.56, 7, 600, 'rgba(255,250,200,0.28)', 0.8);
    grass(400, 540, 800, ['#3a5a2a', '#4a6a30', '#5a7a38'], 12); flowers(30, 430, 540, ['#ffffff', '#f8e070']);
    tree(60, 600, 420, { dark: '#1e3a20', mid: '#2e5a2e', light: '#5a8a40' }); tree(920, 620, 460, { dark: '#1e3a20', mid: '#2e5a2e', light: '#5a8a40' }); particles('dust', 50); grade('#a0d090', 'soft-light', 0.3);
  },
  hills() {
    sky([[0, '#5a9ad8'], [0.45, '#a8d0f0'], [0.62, '#e8f0f0']]); sun(800, 90, 22); clouds(9, 70, 220, 40, 70, '#ffffff', '#c8d4e8', 0.95, null, 1);
    mountains(300, 90, '#9ab0cc', '#7890b0', { snow: 250, haze: 'rgba(220,235,245,0.75)', base: 420 });
    hills(350, 26, '#7aa860', 'rgba(220,240,160,0.5)', 3, { haze: 'rgba(210,230,230,0.6)' }); treeline(372, 34, '#4a7a40', '#7aa858');
    hills(400, 22, '#6a9a48', 'rgba(230,250,150,0.45)', 5); road(560, 10, 380, 300, 392, '#c8b080', '#8a7050');
    grass(400, 540, 900, ['#5a8a38', '#7aaa48', '#8ab858', '#4a7a30'], 10); flowers(90, 420, 540, ['#ffffff', '#f8e070', '#e0a0e8']);
    tree(120, 470, 230); tree(860, 500, 280, { dark: '#24452a', mid: '#38683a', light: '#6ea24a' }); grade('#ffe8b0', 'soft-light', 0.35);
  },
  inn() {
    room({ wall: '#6a4630', floor: '#4a3020', tex: 'wood', beams: '#3a2416', hz: 370, trim: '#3a2416' });
    windowLight(400, 90, 130, 160, { sky: [[0, '#0a1430'], [1, '#2a3a6a']], night: 1, frame: '#2a1a10' });
    rect(70, 180, 220, 190, '#5a5048'); stoneWall(70, 180, 220, 190, '#6a6058', { bh: 16, bw: 34 }); rect(110, 250, 140, 120, '#1a0c06'); flame(180, 360, 22); rect(56, 170, 248, 16, '#4a3020');
    for (let k = 0; k < 4; k++) { rect(660 + k * 60, 140, 40, 6, '#3a2416'); g.fillStyle = ['#c8a050', '#7a8a9a', '#9a5a3a', '#e0d0b0'][k]; g.beginPath(); g.ellipse(680 + k * 60, 128, 12, 14, 0, 0, 7); g.fill(); }
    rect(620, 180, 300, 8, '#3a2416'); for (let k = 0; k < 7; k++) { g.fillStyle = ['#5a3a2a', '#8a6a3a', '#3a5a3a'][k % 3]; rect(632 + k * 40, 150, 22, 30, g.fillStyle); rect(632 + k * 40, 150, 22, 5, '#d8c8a0'); }
    table(380, 420, 300, 40); candle(330, 422, 1); candle(470, 422, 0.9); rect(400, 405, 30, 18, '#c8a060'); rect(400, 405, 30, 4, '#f0e0b0');
    glow(180, 320, 340, 'rgba(255,140,50,0.4)', 1, true); glow(400, 400, 200, 'rgba(255,180,90,0.2)', 1, true); grade('#ffb060', 'soft-light', 0.45); particles('dust', 60);
  },
  village() {
    sky([[0, '#f0b0b8'], [0.4, '#f8d8d0'], [0.62, '#fff4e8']]); sun(240, 110, 26, '#fff0d8'); clouds(7, 60, 200, 40, 70, '#fff6f4', '#e8c0c8', 0.9);
    mountains(290, 70, '#d0b4c8', '#b098b4', { haze: 'rgba(250,230,230,0.7)', base: 400 });
    hills(345, 22, '#9ac070', 'rgba(250,250,200,0.5)', 3, { haze: 'rgba(250,235,230,0.5)' });
    for (const [x, s] of [[60, 100], [190, 130], [760, 120], [880, 90]]) sakura(x, 380, s);
    house(300, 400, 120, 70, { roof: '#b05a40', chimney: 1, smoke: 1, flowers: 1 }); house(470, 395, 100, 60, { roof: '#7a5a8a', flowers: 1 }); house(620, 405, 130, 76, { roof: '#a8503a', chimney: 1 });
    hills(420, 14, '#88b860', 'rgba(255,250,200,0.4)', 4); road(500, 24, 460, 340, 405, '#d8c098', '#a08060');
    grass(420, 540, 900, ['#6a9a48', '#8ab858', '#a8c868', '#5a8a3a'], 10); flowers(120, 430, 540, ['#ffffff', '#fbd0dc', '#f8e070']);
    sakura(110, 560, 360); sakura(900, 560, 300); particles('petal', 90); grade('#ffd0d8', 'soft-light', 0.4);
  },
  abbey() {
    room({ wall: '#4a4450', floor: '#3a3438', tex: 'stone', ftex: 'tiles', hz: 380 });
    for (const x of [30, 250, 590, 810]) bookshelf(x, 60, 130, 320, '#3a2616');
    windowLight(410, 40, 140, 230, { arch: 1, sky: [[0, '#b8d0f0'], [1, '#e8f0ff']], frame: '#2a2830', rays: [140, 420, 'rgba(220,235,255,0.35)'] });
    pillar(200, 20, 380, 40, '#6a6470'); pillar(760, 20, 380, 40, '#6a6470');
    table(480, 430, 260, 34, '#4a2e1c'); for (let k = 0; k < 5; k++) { const x = 380 + k * 45; rect(x, 410 - k % 2 * 10, 34, 14 + k % 2 * 10, ['#7a2a2a', '#2a4a6a', '#5a4a2a'][k % 3]); } candle(600, 432, 1); rect(430, 424, 60, 8, '#f0e8d0'); lineS(445, 428, 480, 428, '#4a3a2a', 1);
    particles('dust', 80); grade('#a0b8e0', 'soft-light', 0.35);
  },
  town() {
    sky([[0, '#e8a070'], [0.5, '#f8d0a0'], [0.7, '#fff0d0']]); sun(480, 300, 30, '#fff0c0'); clouds(8, 60, 220, 40, 70, '#ffe0b8', '#c88878', 0.9, '#fff4d8');
    skyline(330, '#9a6a5a', 14, {}); tower(440, 330, 50, 190, '#a8786a', '#7a4a4a', { flag: '#c83a3a' });
    house(-20, 420, 150, 130, { wall: '#e0c8a8', roof: '#8a4a3a', lit: 1 }); house(170, 410, 120, 110, { wall: '#d8c0a0', roof: '#6a5a7a', lit: 1, flowers: 1 }); house(600, 410, 130, 120, { wall: '#e0d0b0', roof: '#8a4a3a', lit: 1 }); house(790, 430, 160, 150, { wall: '#d0b898', roof: '#7a4a3a', lit: 1, chimney: 1, smoke: 1 });
    road(480, 120, 480, 900, 400, '#a89078'); for (let r = 0; r < 12; r++) { const t = Math.pow(r / 12, 1.4), y = 400 + t * 140; g.globalAlpha = 0.35; lineS(0, y, W, y, '#6a5848', 1); g.globalAlpha = 1; }
    for (const x of [140, 820]) { rect(x - 3, 300, 6, 160, '#2a2a2a'); rect(x - 10, 290, 20, 18, '#2a2a2a'); rect(x - 7, 293, 14, 12, '#ffd080'); glow(x, 299, 80, 'rgba(255,190,90,0.45)', 1, true); }
    grade('#ff9a60', 'soft-light', 0.4); particles('dust', 40);
  },
  fort() {
    sky([[0, '#4a5a80'], [0.5, '#9aa0b8'], [0.7, '#d8c8b8']]); clouds(10, 50, 240, 50, 80, '#d8d8e4', '#8088a0', 0.95, '#f0e8e0');
    mountains(300, 80, '#7a8090', '#5a6070', { haze: 'rgba(200,200,210,0.6)', base: 420 });
    stoneWall(140, 230, 680, 200, '#7a7880', { cren: 1, shade: 'rgba(20,20,30,0.5)' }); tower(100, 430, 90, 280, '#868490', '#4a3a4a', { flag: '#3a5a9a' }); tower(770, 430, 90, 280, '#868490', '#4a3a4a', { flag: '#3a5a9a' });
    rect(420, 300, 120, 130, '#2a1e16'); g.fillStyle = '#2a1e16'; circle(480, 300, 60); for (let k = 0; k < 6; k++) lineS(430 + k * 20, 260, 430 + k * 20, 430, '#4a3a2a', 3); for (let k = 0; k < 6; k++) lineS(420, 310 + k * 20, 540, 310 + k * 20, '#4a3a2a', 2);
    for (const x of [280, 660]) banner(x, 250, 50, 110, '#3a5a9a', (cx, cy, s) => crest(cx, cy, s));
    hills(440, 8, '#5a6a3a', 'rgba(200,220,150,0.3)', 3); road(480, 120, 480, 600, 430, '#8a7a60'); grass(440, 540, 700, ['#4a5a30', '#6a7a40', '#5a6a38'], 9);
    grade('#8090c0', 'soft-light', 0.35);
  },
  river() {
    sky([[0, '#3a4450'], [0.5, '#6a7480'], [0.65, '#8a929a']]); clouds(12, 40, 220, 60, 100, '#7a8290', '#4a5260', 1, null, 3);
    mountains(290, 50, '#4a5458', '#3a4448', { haze: 'rgba(130,140,150,0.7)', base: 340 }); treeline(330, 40, '#2e3a34', '#4a5a50', { conifer: 1 });
    water(330, '#5a6a78', '#2a3a4a', { n: 400, light: 'rgba(200,210,230,0.28)' });
    for (let k = 0; k < 8; k++) { const x = 60 + k * 120; rect(x, 320, 5, 30, '#3a2a20'); }
    poly([[0, 400], [260, 380], [340, 420], [380, 540], [0, 540]], '#3a4030'); grass(390, 540, 300, ['#4a5a3a', '#3a4a2a', '#5a6a40'], 18);
    mist(330, 40, 'rgba(180,190,200,0.35)'); particles('rain', 500, { s: 1.2 }); grade('#5a7090', 'soft-light', 0.45);
  },
  bridge() {
    sky([[0, '#5a4a8a'], [0.35, '#e88a6a'], [0.55, '#f8c890'], [0.62, '#fff0c0']]); sun(700, 300, 34, '#ffe0a0'); clouds(8, 60, 230, 40, 80, '#f8b088', '#8a5a7a', 0.95, '#ffe0b0');
    mountains(310, 50, '#8a6a8a', '#6a4a6a', { haze: 'rgba(250,180,140,0.6)', base: 360 });
    water(330, '#d8906a', '#3a3a5a', { glint: [700, '#ffe0a0'], light: 'rgba(255,220,180,0.3)' });
    // the bridge: a deck on stone piers, railings
    for (let k = 0; k < 6; k++) { const x = 40 + k * 180; stoneWall(x, 300, 40, 240, '#5a4a48', { bh: 12, bw: 20 }); rect(x + 30, 300, 10, 240, 'rgba(0,0,0,0.35)'); }
    rect(0, 286, W, 22, '#3a2a22'); rect(0, 284, W, 4, '#8a6a52'); for (let x = 0; x < W; x += 24) rect(x, 250, 5, 36, '#3a2a22'); rect(0, 248, W, 6, '#4a3428');
    glow(700, 300, 300, 'rgba(255,190,120,0.35)', 1, true); grade('#ff9070', 'soft-light', 0.4);
  },
  border() {
    sky([[0, '#7a8aa0'], [0.55, '#c0c4c8'], [0.7, '#d8d4c8']]); clouds(10, 50, 220, 50, 90, '#e4e4e8', '#9aa0b0', 0.95);
    mountains(260, 110, '#8a8e98', '#6a6e7a', { snow: 200, haze: 'rgba(200,205,210,0.6)', base: 400 });
    stoneWall(0, 250, W, 190, '#6e6c70', { cren: 1, shade: 'rgba(20,20,20,0.5)' }); tower(380, 440, 200, 260, '#7a7880'); rect(420, 300, 120, 140, '#2a1e16'); g.fillStyle = '#2a1e16'; circle(480, 300, 60); for (let k = 0; k < 5; k++) lineS(430 + k * 25, 250, 430 + k * 25, 440, '#5a4a3a', 4);
    for (const x of [200, 720]) banner(x, 270, 46, 100, '#7a2a2a', (cx, cy, s) => crest(cx, cy, s, '#d8c070'));
    hills(450, 6, '#7a7a5a', null, 2); road(480, 120, 480, 700, 440, '#9a8a6a'); grass(450, 540, 500, ['#6a6a4a', '#8a8a5a'], 8); grade('#9090a8', 'soft-light', 0.35);
  },
  harbor() {
    sky([[0, '#0a0e26'], [0.5, '#1e2a5a'], [0.65, '#3a3a6a']]); stars(160, 300, 1); moon(760, 90, 26);
    skyline(330, '#141630', 16, { lit: 0.35 }); tower(120, 330, 46, 200, '#1a1c34', '#141428', { lit: 1 });
    water(330, '#1e2850', '#060a1a', { glint: [760, '#d8e0ff'], light: 'rgba(200,210,255,0.18)' });
    lighter(() => { for (let k = 0; k < 40; k++) { g.fillStyle = 'rgba(255,190,90,0.5)'; const x = R() * W; g.fillRect(x, 334 + R() * 30, rr(10, 30), 1.5); } });
    ship(300, 380, 70, { hull: '#1a1210', sail: '#c8c0b0', dark: 1 }); ship(640, 400, 90, { hull: '#1e1612', sail: '#c8c0b0', dark: 1 });
    rect(0, 450, W, 90, '#1a1410'); for (let x = 0; x < W; x += 40) { rect(x, 450, 38, 90, sh('#2a2018', rr(0.8, 1.2))); } for (const x of [80, 400, 820]) { rect(x, 400, 10, 50, '#1a1410'); rect(x - 4, 396, 18, 6, '#2a2018'); }
    for (const x of [200, 560]) { rect(x - 2, 380, 4, 70, '#1a1410'); rect(x - 7, 372, 14, 12, '#ffc870'); glow(x, 378, 70, 'rgba(255,180,80,0.5)', 1, true); }
    grade('#3a4a9a', 'soft-light', 0.4);
  },
  cliff() {
    sky([[0, '#3a78c0'], [0.5, '#8ac0e8'], [0.62, '#d0e8f4']]); sun(700, 80, 20); clouds(9, 60, 220, 40, 70, '#ffffff', '#b0c8e0', 0.95);
    water(330, '#3a7ab8', '#0e3a6a', { glint: [700, '#ffffff'], light: 'rgba(255,255,255,0.35)', n: 400 });
    // the cliff with its lighthouse
    poly([[0, 540], [0, 200], [120, 190], [260, 214], [360, 250], [410, 330], [440, 540]], '#7a6a58'); poly([[0, 200], [120, 190], [200, 205], [150, 260], [80, 380], [0, 420]], '#9a8a70'); for (let k = 0; k < 10; k++) lineS(rr(200, 420), rr(240, 520), rr(200, 420), rr(240, 540), '#5a4a3c', 2);
    poly([[0, 200], [120, 186], [260, 210], [360, 246], [330, 236], [240, 200], [120, 178], [0, 190]], '#6a9a48'); grass(180, 250, 200, ['#5a8a3a', '#7aaa48'], 8);
    tower(180, 200, 50, 150, '#ece6dc', '#c83a3a'); rect(176, 30, 58, 8, '#3a3030'); glow(205, 56, 120, 'rgba(255,240,180,0.5)', 1, true);
    lighter(() => { for (let k = 0; k < 14; k++) { const x = rr(500, 900), y = rr(380, 540); g.fillStyle = 'rgba(255,255,255,0.5)'; g.beginPath(); g.ellipse(x, y, rr(20, 50), 2, 0, 0, 7); g.fill(); } });
    for (let k = 0; k < 10; k++) { const x = rr(480, 900), y = rr(110, 260), s = rr(6, 12); g.strokeStyle = '#ffffff'; g.lineWidth = 2; g.beginPath(); g.moveTo(x - s, y); g.quadraticCurveTo(x - s / 2, y - s * 0.5, x, y); g.quadraticCurveTo(x + s / 2, y - s * 0.5, x + s, y); g.stroke(); }
    grade('#a0d0ff', 'soft-light', 0.3);
  },
  mansion() {
    room({ wall: '#6a2a30', floor: '#3a2224', tex: 'plaster', panel: '#4a2a1e', ftex: 'tiles', hz: 380, carpet: [160, '#7a1a24'], carpetTrim: '#d8b060' });
    for (const x of [150, 810]) windowLight(x - 60, 70, 120, 200, { arch: 1, sky: [[0, '#1a2448'], [1, '#3a4a7a']], night: 1, frame: '#3a2418' });
    for (const x of [300, 660]) { rect(x - 40, 110, 80, 110, '#d8b060'); rect(x - 34, 116, 68, 98, ['#3a4a3a', '#4a3a3a'][x > 400 ? 1 : 0]); g.fillStyle = 'rgba(240,220,190,0.6)'; g.beginPath(); g.ellipse(x, 150, 14, 18, 0, 0, 7); g.fill(); rect(x - 20, 168, 40, 40, 'rgba(60,40,40,0.8)'); }
    for (const x of [300, 660]) { lineS(x, 0, x, 40, '#c8a050', 2); g.strokeStyle = '#d8b060'; g.lineWidth = 3; g.beginPath(); g.ellipse(x, 52, 50, 10, 0, 0, 7); g.stroke(); for (let k = -2; k <= 2; k++) candle(x + k * 22, 52, 0.6, 0.8); }
    pillar(40, 30, 380, 40, '#8a6a5a'); pillar(920, 30, 380, 40, '#8a6a5a'); rect(380, 300, 200, 80, '#4a2a1e'); rect(380, 296, 200, 8, '#d8b060'); candle(430, 300, 0.8); candle(530, 300, 0.8);
    grade('#ffb080', 'soft-light', 0.35); vignette(0.3);
  },
  bamboo() {
    sky([[0, '#d8ecd0'], [0.6, '#f0f8e8']]); blur(4, () => { for (let k = 0; k < 40; k++) { const x = R() * W, w = rr(6, 12); rect(x, 0, w, H, 'rgba(120,170,110,0.5)'); } });
    mist(300, 80, 'rgba(240,250,240,0.6)');
    // a thatched hut in a clearing
    house(330, 420, 220, 110, { wall: '#c8b48a', roof: '#a8905a', wood: '#5a4428', timber: false, roofFront: 1, side: 60 }); for (let k = 0; k < 30; k++) lineS(rr(320, 620), rr(250, 310), rr(320, 620), rr(250, 310) + 10, '#8a7040', 1);
    hills(430, 4, '#6a8a4a', 'rgba(230,250,180,0.4)', 2); road(440, 40, 440, 260, 420, '#b8a070'); grass(430, 540, 600, ['#5a8a3a', '#7aaa4a', '#4a7a30'], 10);
    for (let k = 0; k < 26; k++) { const x = R() < 0.5 ? rr(-20, 300) : rr(660, 980), w = rr(12, 26), near = w > 20; const gr = g.createLinearGradient(x, 0, x + w, 0); gr.addColorStop(0, near ? '#5a9a4a' : '#7aaa60'); gr.addColorStop(0.4, near ? '#8ac860' : '#9ac878'); gr.addColorStop(1, near ? '#3a6a30' : '#5a8a48'); g.fillStyle = gr; g.fillRect(x, 0, w, H); for (let y = rr(20, 80); y < H; y += rr(60, 100)) { rect(x - 1, y, w + 2, 4, near ? '#3a6a2a' : '#5a8a48'); rect(x, y + 4, w, 2, 'rgba(255,255,255,0.3)'); } for (let q = 0; q < 3; q++) { const ly = rr(0, 400); g.fillStyle = near ? '#4a8a3a' : '#6aa050'; g.save(); g.translate(x + w / 2, ly); g.rotate(rr(-0.8, 0.8) + (x < 480 ? 0.6 : -0.6)); g.beginPath(); g.ellipse(30, 0, 34, 5, 0, 0, 7); g.fill(); g.restore(); } }
    rays(480, -40, Math.PI / 2, 6, 520, 'rgba(255,255,220,0.25)', 0.7); grade('#c8f0b0', 'soft-light', 0.3);
  },
  council() {
    room({ wall: '#2e3a5a', floor: '#2a2a36', tex: 'plaster', panel: '#3a2a20', ftex: 'tiles', hz: 360, ceiling: '#1e2438' });
    for (const x of [100, 330, 630, 860]) pillar(x, 50, 360, 46, '#8a8e9a');
    for (const x of [215, 745]) windowLight(x - 50, 90, 100, 190, { arch: 1, sky: [[0, '#c8d8f0'], [1, '#f0f4ff']], frame: '#2a2a3a', rays: [60, 400, 'rgba(210,225,255,0.3)'] });
    banner(450, 70, 60, 150, '#2a4a8a', (cx, cy, s) => { g.fillStyle = '#e8c860'; for (let k = 0; k < 7; k++) { const a = k / 7 * Math.PI * 2; circle(cx + Math.cos(a) * s * 0.7, cy + Math.sin(a) * s * 0.7, s * 0.2); } });
    g.fillStyle = '#4a2e1c'; g.beginPath(); g.ellipse(480, 440, 330, 62, 0, 0, 7); g.fill(); g.fillStyle = '#6a4228'; g.beginPath(); g.ellipse(480, 432, 320, 56, 0, 0, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,0.08)'; g.beginPath(); g.ellipse(430, 420, 200, 20, 0, 0, 7); g.fill();
    for (let k = 0; k < 7; k++) { const a = Math.PI * (1.08 + k / 6 * 0.84), x = 480 + Math.cos(a) * 300, y = 430 + Math.sin(a) * 70; rect(x - 18, y - 60, 36, 60, '#3a2214'); rect(x - 18, y - 60, 36, 6, '#d8b060'); }
    for (let k = 0; k < 5; k++) { rect(330 + k * 70, 425, 26, 16, '#f0e8d0'); } candle(380, 432, 0.8); candle(600, 432, 0.8);
    grade('#8090d0', 'soft-light', 0.3);
  },
  marsh() {
    sky([[0, '#7a8a80'], [0.5, '#a8b4a8'], [0.65, '#c8d0c4']]); clouds(8, 40, 200, 60, 100, '#b8c0b8', '#8a948a', 0.9, null, 4);
    treeline(320, 46, '#4a5a48', '#6a7a60'); mist(320, 50, 'rgba(210,220,210,0.6)');
    water(330, '#7a8a80', '#3a4a40', { n: 200, light: 'rgba(230,240,230,0.25)' });
    for (let k = 0; k < 6; k++) { const x = rr(0, W), y = rr(360, 460); g.fillStyle = '#4a5a38'; g.beginPath(); g.ellipse(x, y, rr(60, 140), rr(8, 16), 0, 0, 7); g.fill(); }
    for (let k = 0; k < 340; k++) { const x = R() * W, base = rr(380, 560), h = rr(60, 200) * (base / 540); g.strokeStyle = `rgba(${(80 + R() * 70) | 0},${(95 + R() * 60) | 0},${(50 + R() * 20) | 0},0.9)`; g.lineWidth = rr(1, 2.5); g.beginPath(); g.moveTo(x, base); g.quadraticCurveTo(x + rr(-6, 6), base - h / 2, x + rr(-20, 20), base - h); g.stroke(); if (R() < 0.12) { g.fillStyle = '#6a4a2a'; g.beginPath(); g.ellipse(x + rr(-10, 10), base - h * 0.9, 3, 10, 0, 0, 7); g.fill(); } }
    rect(560, 360, 160, 40, '#4a3a28'); poly([[540, 362], [740, 362], [700, 330], [580, 330]], '#6a5a3a'); for (let k = 0; k < 6; k++) rect(570 + k * 28, 396, 5, 40, '#3a2a1a');
    mist(440, 60, 'rgba(220,230,220,0.35)'); particles('firefly', 18); grade('#90a890', 'soft-light', 0.4);
  },
  prison() {
    room({ wall: '#3a3a40', floor: '#24242a', tex: 'stone', ftex: 'tiles', hz: 400 });
    windowLight(440, 50, 80, 70, { sky: [[0, '#5a6a9a'], [1, '#9aaad0']], frame: '#1a1a20', rays: [-60, 420, 'rgba(190,210,255,0.4)'] });
    for (let k = 0; k < 6; k++) lineS(450 + k * 12, 50, 450 + k * 12, 120, '#1a1a20', 4);
    for (const x of [140, 820]) { lineS(x, 120, x + rr(-6, 6), 200, '#5a5a60', 2); g.strokeStyle = '#6a6a70'; g.lineWidth = 3; g.beginPath(); g.arc(x, 210, 10, 0, 7); g.stroke(); }
    rect(80, 360, 200, 40, '#5a4a38'); for (let k = 0; k < 40; k++) lineS(rr(80, 280), rr(360, 400), rr(80, 280), rr(360, 400), '#8a7a58', 1);
    for (let x = -10; x < W; x += 52) { const gr = g.createLinearGradient(x, 0, x + 12, 0); gr.addColorStop(0, '#2a2a30'); gr.addColorStop(0.4, '#7a7a84'); gr.addColorStop(1, '#1a1a20'); g.fillStyle = gr; g.fillRect(x, 0, 12, H); } rect(0, 40, W, 16, '#4a4a52'); rect(0, 470, W, 16, '#4a4a52');
    particles('dust', 50); grade('#6070a0', 'soft-light', 0.45); vignette(0.4);
  },
  sea() {
    sky([[0, '#4a5a80'], [0.5, '#9aa8c0'], [0.6, '#c8ccd4']]); clouds(12, 40, 240, 50, 100, '#c0c8d8', '#6a7890', 1, '#e8ecf4', 2);
    water(300, '#4a6a90', '#0e2440', { n: 420, light: 'rgba(230,240,255,0.3)', dark: 'rgba(0,10,40,0.35)' });
    for (let k = 0; k < 30; k++) { const x = rr(0, W), y = rr(310, 540); g.fillStyle = 'rgba(255,255,255,0.6)'; g.beginPath(); g.ellipse(x, y, rr(8, 30) * (y / 400), 2, 0, 0, 7); g.fill(); }
    ship(180, 330, 50, { hull: '#3a2a20', flag: '#3a5a9a' }); ship(520, 360, 80, { hull: '#4a3020', flag: '#c83a3a' }); ship(820, 340, 60, { hull: '#3a2a1a', flag: '#2a2a2a' });
    for (let k = 0; k < 8; k++) { const x = rr(420, 640); g.fillStyle = 'rgba(255,255,255,0.7)'; g.beginPath(); g.ellipse(x, 365 + rr(0, 8), rr(10, 24), 3, 0, 0, 7); g.fill(); }
    grade('#7090c0', 'soft-light', 0.35);
  },
  snow() {
    sky([[0, '#8a9ac0'], [0.5, '#c8d4e8'], [0.65, '#e8eef6']]); clouds(8, 40, 200, 60, 100, '#e8ecf4', '#a8b4cc', 0.9, null, 3);
    mountains(290, 120, '#e4eaf4', '#a8b8d0', { snow: 330, snowCol: '#f4f8fc', haze: 'rgba(230,236,246,0.7)', base: 420 });
    hills(360, 24, '#e8eef6', 'rgba(255,255,255,0.7)', 3); for (let k = 0; k < 30; k++) conifer(rr(0, W), rr(360, 390), rr(40, 70), { dark: '#2a3a4a', light: '#4a5a6a', snow: '#f4f8fc' });
    hills(420, 16, '#f0f4fa', 'rgba(255,255,255,0.8)', 4); for (let k = 0; k < 60; k++) { g.fillStyle = 'rgba(160,180,210,0.35)'; g.beginPath(); g.ellipse(R() * W, rr(420, 540), rr(20, 60), rr(2, 5), 0, 0, 7); g.fill(); }
    conifer(80, 560, 300, { dark: '#1e2e3a', light: '#3a4e5e', snow: '#f8fafe' }); conifer(900, 580, 340, { dark: '#1e2e3a', light: '#3a4e5e', snow: '#f8fafe' });
    particles('snow', 260); grade('#a0b8e8', 'soft-light', 0.35);
  },
  camp() {
    sky([[0, '#070a1c'], [0.5, '#141a34'], [0.62, '#24223a']]); stars(260, 330, 1); moon(820, 80, 18);
    mountains(330, 60, '#1a1c2a', '#12141e', { base: 400 }); treeline(380, 60, '#0e1016', '#1e2030', { conifer: 1 });
    rect(0, 380, W, 160, '#14120e'); grass(390, 540, 400, ['#1e1c14', '#26241a', '#2e2a1e'], 10);
    for (const [x, s, c] of [[200, 1, '#5a4430'], [740, 1.2, '#4a3a2a']]) { poly([[x - 120 * s, 440], [x, 300 - 20 * s], [x + 120 * s, 440]], c); poly([[x, 300 - 20 * s], [x + 120 * s, 440], [x + 20 * s, 440]], sh(c, 0.6)); poly([[x - 26 * s, 440], [x, 380], [x + 22 * s, 440]], '#120c08'); lineS(x, 300 - 20 * s, x, 286 - 20 * s, '#2a2018', 3); }
    for (let k = 0; k < 9; k++) { const a = k / 9 * Math.PI * 2; g.fillStyle = '#4a4a4e'; g.beginPath(); g.ellipse(480 + Math.cos(a) * 46, 448 + Math.sin(a) * 12, 12, 7, 0, 0, 7); g.fill(); }
    for (const [a, b] of [[-30, 20], [30, -20]]) lineS(480 + a, 450, 480 + b, 420, '#3a2414', 6); flame(480, 448, 22);
    glow(480, 420, 380, 'rgba(255,140,50,0.4)', 1, true); lighter(() => { g.fillStyle = 'rgba(255,140,60,0.35)'; poly([[200 - 120, 440], [200, 280], [200 + 20, 440]]); g.fill(); poly([[740 - 144, 440], [740, 276], [740 - 20, 440]]); g.fill(); });
    for (const [x, y] of [[360, 470], [600, 480]]) { g.fillStyle = '#3a2a1e'; g.beginPath(); g.ellipse(x, y, 50, 10, 0, 0, 7); g.fill(); }
    particles('ember', 40); grade('#3040a0', 'soft-light', 0.3);
  },
  pass() {
    sky([[0, '#c88a5a'], [0.4, '#e8b880'], [0.6, '#f8e0b0']]); sun(480, 160, 24, '#fff0c0'); clouds(5, 60, 160, 30, 50, '#ffe0b0', '#c08060', 0.8);
    mountains(330, 60, '#a8806a', '#8a6a5a', { haze: 'rgba(240,200,160,0.6)', base: 420 });
    for (const sd of [-1, 1]) { const pts = []; for (let y = -10; y <= H + 10; y += 24) { const d = 250 + y * 0.18 + rr(-26, 26); pts.push([sd < 0 ? d : W - d, y]); } const edge = sd < 0 ? 0 : W; poly([[edge, -10], ...pts, [edge, H + 10]], sd < 0 ? '#7a5640' : '#5a3e2e'); for (let k = 0; k < 6; k++) { const q = pts.slice(k * 4, k * 4 + 5); if (q.length < 2) continue; poly([...q, ...q.slice().reverse().map(([x, y]) => [x - sd * rr(30, 70), y])], sd < 0 ? '#9a7458' : '#4a3226'); } for (let k = 0; k < 16; k++) { const y = rr(10, 530), x = sd < 0 ? rr(0, 230) : rr(730, 960); lineS(x, y, x + rr(30, 80) * -sd, y + rr(-8, 8), sd < 0 ? '#5a3e2c' : '#2e2018', rr(2, 4)); } }
    road(480, 30, 480, 300, 420, '#b0906a'); for (let k = 0; k < 20; k++) { g.fillStyle = sh('#7a5a42', rr(0.8, 1.2)); g.beginPath(); g.ellipse(rr(260, 700), rr(430, 540), rr(8, 24), rr(5, 12), 0, 0, 7); g.fill(); }
    rays(480, 160, Math.PI / 2, 5, 420, 'rgba(255,230,180,0.25)', 0.5); grade('#ffb070', 'soft-light', 0.35);
  },
  tomb() {
    room({ wall: '#2e3028', floor: '#1a1c16', tex: 'stone', ftex: 'tiles', hz: 380 });
    for (const x of [70, 250, 710, 890]) pillar(x, 30, 380, 46, '#4a4c40');
    g.fillStyle = '#1a1c14'; g.beginPath(); g.moveTo(380, 380); g.lineTo(380, 180); g.arc(480, 180, 100, Math.PI, 0); g.lineTo(580, 380); g.fill();
    glow(480, 240, 260, 'rgba(110,220,170,0.4)', 1, true); rect(400, 300, 160, 80, '#5a5c4c'); rect(392, 292, 176, 12, '#6e705e'); for (let k = 0; k < 6; k++) lineS(410 + k * 26, 320, 420 + k * 26, 360, '#3a3c30', 1);
    g.fillStyle = 'rgba(160,255,200,0.6)'; g.font = '20px serif'; g.textAlign = 'center'; g.fillText('ᚱ ᛟ ᚦ ᛁ ᚾ', 480, 345);
    for (const x of [340, 620]) { rect(x - 3, 330, 6, 50, '#3a3a30'); flame(x, 330, 10); g.save(); g.filter = 'hue-rotate(110deg)'; glow(x, 320, 90, 'rgba(120,255,180,0.3)', 1, true); g.restore(); }
    particles('dust', 70); mist(380, 30, 'rgba(120,180,150,0.25)'); grade('#60c0a0', 'soft-light', 0.35); vignette(0.45);
  },
  home() {
    sky([[0, '#3a3040'], [0.5, '#8a6a6a'], [0.65, '#c89a80']]); clouds(10, 40, 230, 50, 90, '#9a7a7a', '#4a3a44', 1, '#d8a888', 3);
    hills(340, 20, '#5a5040', null, 3); for (const [x, w, h] of [[60, 140, 100], [260, 120, 90], [560, 140, 110], [760, 160, 120]]) house(x, 420, w, h, { wall: '#8a7a6a', roof: '#4a3a34', wood: '#2a1e18', burnt: 1 });
    rect(0, 420, W, 120, '#3a3428'); grass(420, 540, 500, ['#4a4434', '#3a3428', '#5a5040'], 10);
    blur(6, () => { for (let k = 0; k < 14; k++) { g.fillStyle = `rgba(60,50,50,${rr(0.2, 0.4)})`; circle(rr(0, W), rr(100, 380), rr(30, 80)); } });
    glow(300, 400, 200, 'rgba(255,110,50,0.3)', 1, true); particles('ember', 25); grade('#c07050', 'soft-light', 0.4);
  },
  barricade() {
    sky([[0, '#0e0a1e'], [0.5, '#2a1e34'], [0.62, '#4a2a30']]); stars(60, 200);
    skyline(380, '#16101c', 12, { lit: 0.3, win: '#e0a060' }); house(-30, 430, 170, 160, { wall: '#3a3038', roof: '#1e1820', wood: '#120e12', lit: 1 }); house(790, 440, 170, 170, { wall: '#3a3038', roof: '#1e1820', wood: '#120e12', lit: 1 });
    rect(0, 430, W, 110, '#1a1416');
    // the barricade: furniture, carts, barrels and paving stones heaped across the street
    const pile = []; for (let x = 140; x <= 820; x += 30) pile.push([x, 430 - Math.sin((x - 140) / 680 * Math.PI) * rr(90, 130)]); poly([[140, 470], ...pile, [820, 470]], '#2e2018');
    for (let k = 0; k < 30; k++) { const x = rr(160, 800), y = rr(360, 460), w = rr(20, 60), h = rr(8, 20); g.save(); g.translate(x, y); g.rotate(rr(-0.5, 0.5)); rect(-w / 2, -h / 2, w, h, sh(['#5a3a24', '#4a3020', '#6a4a2e', '#3a3a3a'][(R() * 4) | 0], rr(0.8, 1.2))); rect(-w / 2, -h / 2, w, 2, 'rgba(255,190,120,0.25)'); g.restore(); }
    g.strokeStyle = '#3a2a1a'; g.lineWidth = 5; g.beginPath(); g.arc(300, 400, 34, 0, 7); g.stroke(); for (let k = 0; k < 6; k++) lineS(300, 400, 300 + Math.cos(k) * 34, 400 + Math.sin(k) * 34, '#3a2a1a', 3);
    lineS(480, 430, 480, 230, '#2a1e14', 5); g.fillStyle = '#b8282a'; g.beginPath(); g.moveTo(482, 232); g.quadraticCurveTo(540, 220, 590, 250); g.quadraticCurveTo(540, 270, 482, 282); g.fill(); g.fillStyle = 'rgba(255,255,255,0.15)'; g.beginPath(); g.moveTo(482, 232); g.quadraticCurveTo(520, 228, 560, 240); g.lineTo(482, 250); g.fill();
    for (const x of [240, 700]) flame(x, 436, 12); glow(480, 420, 400, 'rgba(255,120,50,0.35)', 1, true); particles('ember', 40); grade('#a04040', 'soft-light', 0.35);
  },
  theater() {
    room({ wall: '#3a141c', floor: '#2a1410', tex: 'plaster', hz: 400 });
    // the stage: a proscenium, curtains in folds, footlights
    rect(100, 60, 760, 300, '#1a0a0e'); rays(480, 0, Math.PI / 2, 3, 420, 'rgba(255,230,180,0.35)', 0.4); glow(480, 300, 260, 'rgba(255,220,150,0.35)', 1, true);
    for (const sd of [-1, 1]) for (let k = 0; k < 9; k++) { const x = sd < 0 ? 100 + k * 18 : 860 - (k + 1) * 18, gr = g.createLinearGradient(x, 0, x + 18, 0); gr.addColorStop(0, '#5a0a16'); gr.addColorStop(0.5, '#b8243a'); gr.addColorStop(1, '#4a0812'); g.fillStyle = gr; g.fillRect(x, 60, 18, 300); }
    for (let k = 0; k < 38; k++) { const x = 100 + k * 20, gr = g.createLinearGradient(x, 0, x + 20, 0); gr.addColorStop(0, '#6a0e1a'); gr.addColorStop(0.5, '#c8304a'); gr.addColorStop(1, '#5a0a16'); g.fillStyle = gr; g.beginPath(); g.moveTo(x, 60); g.lineTo(x + 20, 60); g.lineTo(x + 20, 120 + Math.sin(k / 37 * Math.PI) * -30 + 30); g.quadraticCurveTo(x + 10, 130 + Math.sin(k / 37 * Math.PI) * -30 + 30, x, 120 + Math.sin(k / 37 * Math.PI) * -30 + 30); g.fill(); }
    rect(80, 30, 800, 34, '#b8883a'); rect(80, 30, 800, 6, '#f0d080'); rect(80, 58, 800, 6, '#6a4a1a'); crest(480, 46, 12, '#f8e8a0');
    rect(80, 360, 800, 40, '#6a3a1a'); rect(80, 360, 800, 5, '#c89050'); for (let x = 120; x < 860; x += 60) { g.fillStyle = '#ffe8a0'; circle(x, 366, 4); glow(x, 360, 50, 'rgba(255,220,140,0.4)', 1, true); }
    for (let r = 0; r < 3; r++) for (let x = -20; x < W; x += 54) { g.fillStyle = '#2a0e10'; g.beginPath(); g.ellipse(x + r * 27, 460 + r * 34, 24, 22, 0, Math.PI, 0); g.fill(); rect(x + r * 27 - 24, 460 + r * 34, 48, 14, '#3a1418'); }
    grade('#ff9070', 'soft-light', 0.3);
  },
  court() {
    room({ wall: '#4a3a2c', floor: '#2a2018', tex: 'wood', panel: '#3a2a1c', hz: 380, ceiling: '#2a2018' });
    windowLight(140, 80, 100, 200, { arch: 1, frame: '#2a1e14', rays: [120, 400, 'rgba(255,240,210,0.3)'] }); windowLight(720, 80, 100, 200, { arch: 1, frame: '#2a1e14', rays: [120, 400, 'rgba(255,240,210,0.3)'] });
    // the judge's bench high in the middle, the scales above
    rect(300, 230, 360, 150, '#4a2e1a'); rect(300, 226, 360, 10, '#7a5030'); for (let k = 0; k < 4; k++) { g.strokeStyle = '#2e1c10'; g.lineWidth = 2; g.strokeRect(316 + k * 86, 250, 72, 110); }
    rect(440, 170, 80, 60, '#3a2414'); rect(430, 164, 100, 8, '#6a4428');
    g.strokeStyle = '#d8b860'; g.lineWidth = 3; lineS(480, 70, 480, 150, '#d8b860', 3); lineS(420, 84, 540, 84, '#d8b860', 3); for (const sd of [-1, 1]) { lineS(480 + sd * 60, 84, 480 + sd * 46, 120, '#d8b860', 1.5); lineS(480 + sd * 60, 84, 480 + sd * 74, 120, '#d8b860', 1.5); g.fillStyle = '#d8b860'; g.beginPath(); g.ellipse(480 + sd * 60, 122, 18, 5, 0, 0, Math.PI); g.fill(); } g.fillStyle = '#d8b860'; circle(480, 68, 6);
    for (const x of [140, 820]) { rect(x - 80, 420, 160, 20, '#3a2414'); rect(x - 80, 416, 160, 6, '#6a4428'); } table(480, 430, 160, 30);
    grade('#d0a070', 'soft-light', 0.35);
  },
  palace() {
    room({ wall: '#3e3260', floor: '#28203e', tex: 'plaster', ftex: 'tiles', hz: 380, carpet: [120, '#9a1e2e'], ceiling: '#241c3a' });
    for (const x of [60, 220, 740, 900]) pillar(x, 50, 380, 54, '#a8a0b8');
    for (const x of [140, 820]) banner(x - 28, 80, 56, 200, '#7a1a2a', (cx, cy, s) => crest(cx, cy, s));
    // the throne on its dais, under a canopy
    for (let k = 0; k < 3; k++) rect(330 - k * 30, 330 + k * 16, 300 + k * 60, 16, sh('#6a5a7a', 1 - k * 0.1));
    g.fillStyle = '#8a1a2a'; g.beginPath(); g.moveTo(370, 70); g.quadraticCurveTo(480, 40, 590, 70); g.lineTo(600, 300); g.lineTo(360, 300); g.fill(); g.fillStyle = 'rgba(0,0,0,0.3)'; for (let k = 0; k < 8; k++) g.fillRect(370 + k * 30, 70, 10, 230);
    rect(430, 150, 100, 180, '#c8a040'); rect(442, 166, 76, 120, '#9a1e2e'); poly([[430, 150], [480, 100], [530, 150]], '#d8b050'); crest(480, 130, 12, '#fff0b0'); rect(420, 280, 120, 50, '#c8a040'); rect(420, 280, 120, 6, '#f0d880');
    glow(480, 200, 300, 'rgba(255,230,170,0.3)', 1, true); rays(480, -40, Math.PI / 2, 5, 520, 'rgba(255,240,200,0.2)', 0.5); grade('#c0a0ff', 'soft-light', 0.3);
  },
  cathedral() {
    sky([[0, '#d8d0c4'], [0.7, '#b8b0a4'], [1, '#6a6458']]);
    room({ wall: '#b8b0a2', floor: '#8a8276', tex: 'stone', ftex: 'tiles', hz: 400, carpet: [90, '#7a2a2a'] });
    const cols = ['#c83a3a', '#3a6ac8', '#e8c040', '#3a9a5a', '#8a3ac8', '#e87a2a'];
    windowLight(400, 30, 160, 300, { arch: 1, stained: cols, frame: '#3a3430', rays: [0, 480, 'rgba(255,240,200,0.35)'] });
    for (const x of [130, 690]) windowLight(x, 80, 120, 240, { arch: 1, stained: cols, frame: '#3a3430', rays: [x < 400 ? 160 : -160, 420, 'rgba(255,220,200,0.25)'] });
    for (const x of [40, 330, 630, 920]) pillar(x, 0, 400, 56, '#c8c0b0');
    rect(400, 340, 160, 60, '#d8d0c0'); rect(392, 334, 176, 10, '#f0e8d8'); for (const x of [420, 540]) candle(x, 336, 0.9); rect(474, 290, 12, 50, '#d8b050'); rect(460, 300, 40, 8, '#d8b050');
    for (let r = 0; r < 3; r++) for (const sd of [-1, 1]) { const x = 480 + sd * (180 + r * 40), y = 440 + r * 34; rect(x - 90, y, 180, 12, '#5a3a24'); rect(x - 90, y + 12, 180, 20, '#3a2414'); }
    particles('dust', 90); grade('#ffe0c0', 'soft-light', 0.35);
  },
  ember() {
    sky([[0, '#140604'], [0.5, '#3a1006'], [1, '#0a0302']]);
    for (const x of [100, 300, 660, 860]) pillar(x, 0, 540, 60, '#3a2018');
    glow(480, 300, 460, 'rgba(255,120,30,0.6)', 1, true); glow(480, 300, 200, 'rgba(255,220,140,0.8)', 1, true);
    rect(380, 400, 200, 140, '#2a1410'); rect(370, 396, 220, 10, '#5a2a18');
    flame(480, 400, 60); rays(480, 300, -Math.PI / 2, 9, 520, 'rgba(255,170,80,0.3)', 2.6);
    particles('ember', 120); grade('#ff6020', 'soft-light', 0.35); vignette(0.5);
  },
  dawn() {
    sky([[0, '#2a3a7a'], [0.3, '#8a7ab0'], [0.5, '#f0a890'], [0.62, '#ffe8c0']]); sun(480, 340, 34, '#fff4d8'); clouds(10, 60, 260, 40, 80, '#f8c0a0', '#8a6a9a', 0.95, '#fff0d0');
    mountains(320, 60, '#8a7aa0', '#6a5a80', { haze: 'rgba(255,210,180,0.6)', base: 400 });
    hills(370, 24, '#5a7a5a', 'rgba(255,220,160,0.5)', 3, { haze: 'rgba(255,220,190,0.5)' }); treeline(386, 30, '#3a5a40', '#7a9a60');
    hills(420, 14, '#4a6a40', 'rgba(255,220,150,0.4)', 4); grass(420, 540, 800, ['#4a6a38', '#5a7a40', '#6a8a48'], 10); flowers(60, 440, 540, ['#ffffff', '#f8e070']);
    rays(480, 340, -Math.PI / 2, 12, 600, 'rgba(255,230,180,0.25)', 3); grade('#ffc890', 'soft-light', 0.35);
  },
  tent() {
    room({ wall: '#7a6440', floor: '#4a3a24', hz: 370 });
    for (let k = 0; k < 8; k++) { const x = k * 120, gr = g.createLinearGradient(x, 0, x + 120, 0); gr.addColorStop(0, 'rgba(0,0,0,0.25)'); gr.addColorStop(0.5, 'rgba(255,240,200,0.08)'); gr.addColorStop(1, 'rgba(0,0,0,0.25)'); g.fillStyle = gr; g.fillRect(x, 0, 120, 370); lineS(x, 0, x, 370, '#4a3a20', 2); }
    poly([[0, 0], [W, 0], [W, 60], [480, 20], [0, 60]], '#5a4a2e'); lineS(480, 0, 480, 370, '#3a2a18', 8);
    banner(700, 60, 70, 180, '#2a4a8a', (cx, cy, s) => crest(cx, cy, s));
    table(480, 400, 380, 50, '#5a3a20'); rect(360, 398, 240, 40, '#d8c8a0'); g.globalAlpha = 0.6; for (let k = 0; k < 8; k++) lineS(rr(370, 590), rr(402, 434), rr(370, 590), rr(402, 434), '#6a5a3a', 1.2); g.globalAlpha = 1; for (const [x, c] of [[420, '#3a5a9a'], [470, '#3a5a9a'], [540, '#c83a3a'], [560, '#c83a3a']]) { g.fillStyle = c; circle(x, 418, 4); }
    candle(330, 402, 1); candle(640, 402, 1); glow(480, 380, 320, 'rgba(255,190,110,0.35)', 1, true);
    rect(80, 200, 60, 170, '#4a4a52'); rect(70, 190, 80, 20, '#6a6a72'); grade('#ffb060', 'soft-light', 0.4);
  },
};
export function backdrop(id) {
  if (CACHE[id]) return CACHE[id];
  const c = document.createElement('canvas'); c.width = W; c.height = H; g = c.getContext('2d'); g.lineCap = 'round'; g.lineJoin = 'round';
  let seed = 7; for (const ch of String(id)) seed = (seed * 31 + ch.charCodeAt(0)) >>> 0; R = rng(seed);
  (SCENES[id] || (() => sky([[0, '#14141a'], [1, '#050508']])))();
  vignette(0.5);
  CACHE[id] = c; return c;
}
