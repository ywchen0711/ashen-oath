// The battlefield on screen: the painted map, scrolled to follow the cursor; blue squares where a unit can go, red
// where it can strike, green for staves, a purple danger zone, the path arrow, fog, the soldiers (bobbing while
// they wait, walking square to square, grey once they've acted), little HP bars and floating numbers.
import { paintMap, spriteOf } from './tiles.js';
import { CLASSES } from './data/classes.js';
import { CAST } from './data/cast.js';

export class MapView {
  constructor(canvas) { this.cv = canvas; this.g = canvas.getContext('2d'); this.Z = 3; this.cam = { x: 0, y: 0 }; this.cursor = { x: 0, y: 0 }; this.over = {}; this.floats = []; this.path = null; this.shake = 0; this.resize(); addEventListener('resize', () => this.resize()); }
  resize() { const dpr = Math.min(2, devicePixelRatio || 1); this.cv.width = innerWidth * dpr; this.cv.height = innerHeight * dpr; this.cv.style.width = innerWidth + 'px'; this.cv.style.height = innerHeight + 'px'; this.dpr = dpr; this.Z = innerWidth < 700 ? 2 : innerWidth > 1700 && innerHeight > 1000 ? 4 : 3; this.TS = 16 * this.Z; }
  setBattle(B) { this.B = B; this.repaint(); this.cursor = { x: B.ch.deploy[0][0], y: B.ch.deploy[0][1] }; this.center(this.cursor.x, this.cursor.y, true); }
  repaint() { this.img = paintMap(this.B.F); }
  look(u) { u.look = u.look || CLASSES[u.cls].look; if (u.id && CAST[u.id] && !u.hair) u.hair = CAST[u.id].p.hc; return u; }
  // the camera: keep the cursor away from the edges
  // the camera: a map smaller than the screen sits in the middle; a bigger one scrolls
  clampCam(tx, ty) { const vw = innerWidth / this.TS, vh = innerHeight / this.TS, F = this.B.F; tx = F.W <= vw ? (F.W - vw) / 2 : Math.max(0, Math.min(F.W - vw, tx)); ty = F.H + 2 <= vh ? (F.H - vh) / 2 : Math.max(-1, Math.min(F.H - vh + 1, ty)); return { x: tx, y: ty }; }
  center(x, y, now) { const vw = innerWidth / this.TS, vh = innerHeight / this.TS; this.camT = this.clampCam(x + 0.5 - vw / 2, y + 0.5 - vh / 2); if (now) this.cam = { ...this.camT }; }
  follow(x, y) { const vw = innerWidth / this.TS, vh = innerHeight / this.TS, m = 2.5, c = this.camT || this.cam; let tx = c.x, ty = c.y; if (x < tx + m) tx = x - m; if (x > tx + vw - m - 1) tx = x - vw + m + 1; if (y < ty + m) ty = y - m; if (y > ty + vh - m - 1) ty = y - vh + m + 1; const F = this.B.F; this.camT = this.clampCam(tx, ty); }
  toTile(px, py) { return { x: Math.floor(px / this.TS + this.cam.x), y: Math.floor(py / this.TS + this.cam.y) }; }
  toScreen(x, y) { return { x: (x - this.cam.x) * this.TS, y: (y - this.cam.y) * this.TS }; }
  float(x, y, text, color = '#fff') { this.floats.push({ x, y, text, color, t: 0 }); }
  draw(t, dt) {
    const g = this.g, B = this.B, TS = this.TS, F = B.F; g.setTransform(this.dpr, 0, 0, this.dpr, 0, 0); g.imageSmoothingEnabled = false;
    if (this.camT) { this.cam.x += (this.camT.x - this.cam.x) * Math.min(1, dt * 12); this.cam.y += (this.camT.y - this.cam.y) * Math.min(1, dt * 12); }
    const sx = this.shake > 0 ? (Math.random() - 0.5) * this.shake * 10 : 0; this.shake = Math.max(0, this.shake - dt * 2);
    g.fillStyle = '#101018'; g.fillRect(0, 0, innerWidth, innerHeight);
    g.save(); g.translate(Math.round(-this.cam.x * TS + sx), Math.round(-this.cam.y * TS));
    g.drawImage(this.img, 0, 0, F.W * TS, F.H * TS);
    // fog
    const fog = B.ch.fog ? (this.vision || new Set()) : null;
    if (fog) { g.fillStyle = 'rgba(10,12,30,0.62)'; for (let y = 0; y < F.H; y++) for (let x = 0; x < F.W; x++) if (!fog.has(y * F.W + x)) g.fillRect(x * TS, y * TS, TS, TS); }
    // the coloured squares
    const pulse = 0.55 + Math.sin(t * 4) * 0.1;
    const paint = (set, fill, line) => { if (!set) return; g.fillStyle = fill; for (const k of set) { const x = k % F.W, y = Math.floor(k / F.W); g.fillRect(x * TS + 1, y * TS + 1, TS - 2, TS - 2); } if (line) { g.strokeStyle = line; g.lineWidth = 1; for (const k of set) { const x = k % F.W, y = Math.floor(k / F.W); g.strokeRect(x * TS + 1.5, y * TS + 1.5, TS - 3, TS - 3); } } };
    paint(this.over.danger, 'rgba(160,40,200,0.28)');
    paint(this.over.enemy, `rgba(230,60,60,${0.32 * pulse})`);
    paint(this.over.atk, `rgba(230,50,50,${0.42 * pulse})`, 'rgba(255,120,120,0.6)');
    paint(this.over.staff, `rgba(60,200,90,${0.42 * pulse})`, 'rgba(140,255,160,0.6)');
    paint(this.over.move, `rgba(60,120,240,${0.45 * pulse})`, 'rgba(150,190,255,0.7)');
    paint(this.over.pick, `rgba(255,220,80,${0.35 * pulse})`, 'rgba(255,240,160,0.8)');
    // the path arrow
    if (this.path && this.path.length > 1) { g.strokeStyle = 'rgba(255,240,140,0.95)'; g.lineWidth = TS * 0.2; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); this.path.forEach(([x, y], i) => (i ? g.lineTo : g.moveTo).call(g, x * TS + TS / 2, y * TS + TS / 2)); g.stroke(); const [ex, ey] = this.path[this.path.length - 1]; g.fillStyle = '#fff0a0'; g.beginPath(); g.arc(ex * TS + TS / 2, ey * TS + TS / 2, TS * 0.18, 0, 7); g.fill(); }
    // the soldiers, top to bottom
    const list = B.units.filter((u) => !u.dead && u.x != null && !u.rescuedBy && (!fog || u.side === 'player' || u.side === 'ally' || fog.has(u.y * F.W + u.x))).sort((a, b) => (a.ay ?? a.y) - (b.ay ?? b.y));
    for (const u of list) {
      this.look(u); let x = u.x, y = u.y, face = 'down', frame = Math.floor(t * 3 + u.uid * 0.7) % 3;
      if (u.anim) { const A = u.anim; A.t += dt * 9; const i = Math.min(A.path.length - 1, Math.floor(A.t)), j = Math.min(A.path.length - 1, i + 1), k = A.t - i, [x0, y0] = A.path[i], [x1, y1] = A.path[j]; x = x0 + (x1 - x0) * k; y = y0 + (y1 - y0) * k; face = x1 !== x0 ? 'side' : y1 < y0 ? 'up' : 'down'; frame = Math.floor(A.t * 2) % 4; u.flip = x1 < x0; if (A.t >= A.path.length - 1) { u.anim = null; A.done(); } }
      if (u.bump) { u.bump.t += dt * 6; const k = Math.sin(Math.min(1, u.bump.t) * Math.PI) * 0.35; x += u.bump.dx * k; y += u.bump.dy * k; if (u.bump.t >= 1) u.bump = null; }
      u.ay = y; const s = spriteOf(u, frame === 2 ? 0 : frame, face, u.side === 'player' && u.acted && B.phase === 'player');
      g.save(); g.translate(x * TS + TS / 2, y * TS + TS); if (u.flip && face === 'side') g.scale(-1, 1); g.drawImage(s, -10 * this.Z, -19 * this.Z - 2, 20 * this.Z, 20 * this.Z); g.restore();
      if (u.flash) { u.flash -= dt * 3; g.fillStyle = `rgba(255,255,255,${Math.max(0, u.flash)})`; g.fillRect(x * TS, y * TS, TS, TS); }
      if (u.hp < u.stats.hp) { const w = TS * 0.7, bx = x * TS + (TS - w) / 2, by = y * TS + TS - 4; g.fillStyle = '#1a1a1a'; g.fillRect(bx - 1, by - 1, w + 2, 4); g.fillStyle = u.hp / u.stats.hp > 0.5 ? '#5ad85a' : u.hp / u.stats.hp > 0.25 ? '#e8c840' : '#e84a3a'; g.fillRect(bx, by, w * u.hp / u.stats.hp, 2); }
      if (u.boss) { g.fillStyle = '#e8c040'; g.font = `bold ${8 * this.Z}px serif`; g.fillText('♛', x * TS + 1, y * TS + 9 * this.Z); }
      if (u.rescuing) { g.fillStyle = '#5aa0ff'; g.fillRect(x * TS + TS - 10, y * TS + 2, 8, 8); }
      if (u.status && u.status.sleep) { g.fillStyle = '#c8d8ff'; g.font = `bold ${6 * this.Z}px sans-serif`; g.fillText('Zz', x * TS + TS - 6 * this.Z, y * TS + 6 * this.Z); }
      if (u.talkMark) { g.fillStyle = '#ffe070'; g.font = `bold ${7 * this.Z}px sans-serif`; g.fillText('💬', x * TS + TS - 7 * this.Z, y * TS + 7 * this.Z); }
    }
    // the cursor: four corners that breathe
    if (this.showCursor !== false) { const { x, y } = this.cursor, k = 2 + Math.sin(t * 6) * 2, L = TS * 0.32; g.strokeStyle = '#fff8c0'; g.lineWidth = 3; g.shadowColor = '#000'; g.shadowBlur = 3; const X0 = x * TS - k, Y0 = y * TS - k, X1 = x * TS + TS + k, Y1 = y * TS + TS + k; g.beginPath(); g.moveTo(X0, Y0 + L); g.lineTo(X0, Y0); g.lineTo(X0 + L, Y0); g.moveTo(X1 - L, Y0); g.lineTo(X1, Y0); g.lineTo(X1, Y0 + L); g.moveTo(X1, Y1 - L); g.lineTo(X1, Y1); g.lineTo(X1 - L, Y1); g.moveTo(X0 + L, Y1); g.lineTo(X0, Y1); g.lineTo(X0, Y1 - L); g.stroke(); g.shadowBlur = 0; }
    // floating numbers
    for (const f of this.floats) { f.t += dt; g.globalAlpha = Math.max(0, 1 - f.t); g.fillStyle = f.color; g.strokeStyle = '#000'; g.lineWidth = 3; g.font = `bold ${8 * this.Z}px sans-serif`; g.textAlign = 'center'; const px = f.x * TS + TS / 2, py = f.y * TS - f.t * TS * 0.6; g.strokeText(f.text, px, py); g.fillText(f.text, px, py); g.textAlign = 'left'; g.globalAlpha = 1; }
    this.floats = this.floats.filter((f) => f.t < 1);
    g.restore();
  }
  walk(u, path) { return new Promise((res) => { if (!path || path.length < 2) return res(); u.anim = { path, t: 0, done: res }; this.follow(path[path.length - 1][0], path[path.length - 1][1]); }); }
}
