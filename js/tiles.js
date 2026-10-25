// The look of the battlefield, in the spirit of the handheld tactics games: every square is painted pixel by pixel
// (16×16) from a warm palette, shores and rivers and roads join up with their neighbours, forests are clumps of
// round trees, mountains have a lit side and a shadow side, forts and villages are little buildings.
import { terrainAt } from './data/terrain.js';

const PAL = {
  grass: ['#78b048', '#88c058', '#6aa040', '#98d068'], dirt: ['#c8a868', '#b89858', '#d8b878'], road: ['#d8c088', '#c8b078', '#e0cc98'],
  tree: ['#2a6a2a', '#3a8a32', '#4aa040', '#1a4a1a'], trunk: '#6a4a2a', rock: ['#9a8a78', '#7a6a5a', '#b8a890', '#5a4a3a'], snowrock: ['#e8eef4', '#b8c8d8', '#8898a8'],
  water: ['#3a78c8', '#4a88d8', '#2a68b8', '#78b0e8'], deep: ['#2a58a8', '#3a68b8', '#1a4898'], sand: ['#e8d098', '#d8c088', '#f0dca8'], snow: ['#f0f4f8', '#dce4ec', '#c8d4e0'],
  wall: ['#8a8a90', '#a8a8b0', '#6a6a72', '#4a4a52'], floor: ['#b8a890', '#a89880', '#c8b8a0'], roof: ['#c84a3a', '#a83a2a', '#e06a4a'], roofB: ['#4a6ab8', '#3a5aa8'], wood: ['#a8784a', '#8a5a32', '#c8945a'],
};
// a tiny deterministic noise per square
const hash = (x, y, k = 0) => { let h = (x * 374761393 + y * 668265263 + k * 1442695041) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };

export function paintMap(F, fog) {
  const c = document.createElement('canvas'); c.width = F.W * 16; c.height = F.H * 16; const g = c.getContext('2d');
  for (let y = 0; y < F.H; y++) for (let x = 0; x < F.W; x++) paintTile(g, F, x, y);
  return c;
}
const isWater = (ch) => 'wr~'.includes(ch), isWall = (ch) => '#WDG'.includes(ch), isRoad = (ch) => 'Rbl'.includes(ch);
export function paintTile(g, F, x, y) {
  const ch = F.tile(x, y), ox = x * 16, oy = y * 16, P = (px, py, w, h, col) => { g.fillStyle = col; g.fillRect(ox + px, oy + py, w, h); }, n = (k) => hash(x, y, k);
  const grass = () => { P(0, 0, 16, 16, PAL.grass[0]); for (let k = 0; k < 10; k++) P(Math.floor(n(k) * 15), Math.floor(n(k + 20) * 15), 1, 1, PAL.grass[k % 3 + 1]); for (let k = 0; k < 3; k++) { const tx = Math.floor(n(k + 30) * 13) + 1, ty = Math.floor(n(k + 33) * 12) + 2; P(tx, ty, 1, 2, '#5a8a34'); P(tx + 2, ty, 1, 2, '#5a8a34'); P(tx + 1, ty + 1, 1, 2, '#4e7e2e'); P(tx + 1, ty - 1, 1, 1, PAL.grass[3]); } if (n(97) < 0.5) P(Math.floor(n(44) * 12) + 2, Math.floor(n(45) * 12) + 2, 2, 1, '#a8dc7a'); if (n(99) < 0.3) { P(Math.floor(n(41) * 12) + 2, Math.floor(n(42) * 12) + 2, 1, 1, ['#f0e060', '#f0a0c0', '#ffffff'][Math.floor(n(43) * 3)]); } };
  const snowG = () => { P(0, 0, 16, 16, PAL.snow[0]); for (let k = 0; k < 8; k++) P(Math.floor(n(k) * 15), Math.floor(n(k + 20) * 15), 2, 1, PAL.snow[1 + k % 2]); };
  const floorG = (pal = PAL.floor) => { P(0, 0, 16, 16, pal[0]); P(0, 0, 16, 1, pal[1]); P(0, 0, 1, 16, pal[1]); P(8, 0, 1, 8, pal[1]); P(0, 8, 16, 1, pal[1]); P(4, 8, 1, 8, pal[1]); for (let k = 0; k < 4; k++) P(Math.floor(n(k) * 14) + 1, Math.floor(n(k + 9) * 14) + 1, 1, 1, pal[2]); };
  const base = () => { const near = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([a, b]) => F.tile(x + a, y + b)); if (near.filter((t) => 'Szi'.includes(t)).length >= 2 || ch === 'S' || ch === 'z') snowG(); else if (near.filter((t) => 'lpqCTeOQ'.includes(t)).length >= 2) floorG(); else if (near.filter((t) => t === 's').length >= 2) sandG(); else grass(); };
  const sandG = () => { P(0, 0, 16, 16, PAL.sand[0]); for (let k = 0; k < 6; k++) P(Math.floor(n(k) * 14), Math.floor(n(k + 7) * 15), 3, 1, PAL.sand[1]); P(Math.floor(n(50) * 10), Math.floor(n(51) * 12), 4, 1, PAL.sand[2]); };
  const tree = (cx, cy, s = 1, pal = PAL.tree) => { g.fillStyle = 'rgba(20,40,10,0.32)'; g.beginPath(); g.ellipse(ox + cx + 1, oy + cy + 5, 5.5, 2, 0, 0, 7); g.fill(); P(cx - 1, cy + 2, 2, 3, PAL.trunk); P(cx, cy + 2, 1, 3, '#4a3018'); P(cx - 5, cy - 2, 1, 4, pal[3]); P(cx + 4, cy - 2, 1, 4, pal[3]); P(cx - 4, cy - 4, 1, 2, pal[3]); P(cx + 3, cy - 4, 1, 2, pal[3]); P(cx - 3, cy - 6, 6, 1, pal[3]); P(cx - 4, cy + 3, 8, 1, pal[3]); P(cx - 4, cy - 3, 8, 6, pal[1]); P(cx - 3, cy - 5, 6, 2, pal[1]); P(cx - 3, cy + 3, 6, 1, pal[0]); P(cx - 4, cy + 1, 8, 2, pal[0]); P(cx - 2, cy - 4, 3, 2, pal[2]); P(cx - 3, cy - 2, 1, 1, pal[2]); P(cx + 3, cy - 2, 1, 3, pal[0]); P(cx - 2, cy - 5, 2, 1, pal[2]); P(cx - 3, cy - 3, 1, 1, '#8ad070'); P(cx - 1, cy - 4, 1, 1, '#a8e488'); P(cx + 1, cy + 1, 2, 1, pal[3]); P(cx + 2, cy - 1, 1, 1, pal[0]); };
  const mountain = (pal) => { g.fillStyle = 'rgba(30,20,10,0.25)'; g.beginPath(); g.ellipse(ox + 9, oy + 14.5, 8, 2, 0, 0, 7); g.fill(); for (let r = 0; r < 12; r++) { const w = Math.floor(r * 0.75) + 1; P(8 - w, 3 + r, w, 1, pal[0]); P(8, 3 + r, w, 1, pal[1]); } P(7, 3, 2, 1, pal[2]); P(6, 4, 2, 1, pal[2]); P(5, 6, 1, 2, pal[2]); P(10, 8, 2, 1, pal[3] || pal[1]); P(3, 13, 2, 1, pal[3] || pal[1]); P(9, 5, 1, 3, pal[3] || pal[1]); P(11, 11, 2, 1, pal[3] || pal[1]); P(4, 10, 1, 1, pal[2]); P(6, 12, 2, 1, pal[2]); P(13, 14, 2, 1, pal[1]); P(1, 14, 2, 1, pal[0]); };
  switch (ch) {
    case '.': case ',': grass(); if (ch === ',') for (let k = 0; k < 5; k++) P(Math.floor(n(k + 60) * 14), Math.floor(n(k + 70) * 13) + 2, 1, 2, PAL.grass[2]); break;
    case 'R': base(); paintPath(g, F, x, y, PAL.road, isRoad); break;
    case 'f': base(); tree(5, 6); tree(11, 9); if (n(5) < 0.6) tree(6, 12); break;
    case 'K': base(); tree(6, 7, 1, ['#c86a8a', '#f09ab8', '#ffd0e0', '#a85a70']); tree(11, 10, 1, ['#c86a8a', '#f09ab8', '#ffd0e0', '#a85a70']); for (let k = 0; k < 4; k++) P(Math.floor(n(k + 3) * 15), 13 + Math.floor(n(k + 8) * 3), 1, 1, '#f8b8d0'); break;
    case 'm': base(); mountain(F.tile(x, y + 1) === 'S' || F.tile(x - 1, y) === 'S' ? PAL.snowrock : PAL.rock); break;
    case 'M': base(); mountain(PAL.rock); P(6, 3, 4, 3, '#f0f4f8'); P(5, 5, 2, 1, '#e8eef4'); P(9, 5, 2, 2, '#dce4ec'); break;
    case 'h': base(); g.fillStyle = PAL.grass[2]; g.beginPath(); g.ellipse(ox + 8, oy + 11, 7, 5, 0, Math.PI, 0); g.fill(); P(3, 9, 5, 1, PAL.grass[3]); P(9, 12, 4, 1, PAL.grass[0]); break;
    case 'w': case 'r': case '~': paintWater(g, F, x, y, ch); break;
    case 'b': paintWater(g, F, x, y, 'r'); { const horiz = isWater(F.tile(x, y - 1)) || isWater(F.tile(x, y + 1)); if (horiz) { P(0, 3, 16, 10, PAL.wood[0]); for (let k = 0; k < 16; k += 3) P(k, 3, 1, 10, PAL.wood[1]); P(0, 2, 16, 1, PAL.wood[1]); P(0, 13, 16, 1, PAL.wood[1]); } else { P(3, 0, 10, 16, PAL.wood[0]); for (let k = 0; k < 16; k += 3) P(3, k, 10, 1, PAL.wood[1]); P(2, 0, 1, 16, PAL.wood[1]); P(13, 0, 1, 16, PAL.wood[1]); } } break;
    case 'v': case 'H': case 'V': case 'k': case 'a': { base(); const ruin = ch === 'V'; const roof = ch === 'k' ? PAL.roofB : ch === 'a' ? ['#8a6a3a', '#6a4a2a', '#a8844a'] : PAL.roof;
      P(2, 7, 12, 8, ruin ? '#8a7a68' : '#e8dcc0'); P(2, 14, 12, 1, '#a89878');
      if (!ruin) { for (let r = 0; r < 5; r++) P(1 + r, 7 - r, 14 - r * 2, 1, roof[r % 2]); P(3, 3, 10, 1, roof[2]); } else { P(2, 5, 4, 2, '#4a3a2a'); P(9, 6, 5, 1, '#3a2a1a'); }
      P(7, 10, 3, 5, ruin ? '#2a1a10' : '#6a4a2a'); P(3, 9, 2, 2, ruin ? '#2a1a10' : '#5aa0d0'); P(11, 9, 2, 2, ruin ? '#2a1a10' : '#5aa0d0');
      if (ch === 'k') { P(11, 1, 4, 3, '#f0e0a0'); P(12, 2, 2, 1, '#8a4a2a'); } if (ch === 'a') { P(12, 0, 1, 5, '#c8c8d0'); P(11, 3, 3, 1, '#8a6a3a'); }
      if (ch === 'v') { P(13, 5, 2, 3, '#8a7a6a'); P(13, 4, 2, 1, '#6a5a4a'); } break; }
    case 'F': base(); P(2, 5, 12, 10, PAL.wall[1]); P(2, 4, 2, 2, PAL.wall[1]); P(6, 4, 2, 2, PAL.wall[1]); P(10, 4, 2, 2, PAL.wall[1]); P(12, 4, 2, 2, PAL.wall[1]); P(2, 14, 12, 1, PAL.wall[3]); P(6, 9, 4, 6, '#4a3a2a'); P(13, 5, 1, 10, PAL.wall[2]); P(7, 1, 1, 4, '#5a4a3a'); P(8, 1, 3, 2, '#c83a3a'); break;
    case 'T': floorG(); P(2, 0, 12, 16, '#a82a3a'); P(3, 0, 10, 16, '#c83a4a'); P(4, 1, 8, 9, '#d8a840'); P(5, 2, 6, 6, '#a82a3a'); P(4, 10, 8, 2, '#d8a840'); P(4, 12, 2, 3, '#b88a30'); P(10, 12, 2, 3, '#b88a30'); P(7, 0, 2, 1, '#f0d070'); break;
    case 'G': floorG(); P(0, 0, 16, 16, PAL.wall[2]); P(3, 2, 10, 14, '#5a3a20'); P(4, 3, 8, 13, '#7a5030'); P(7, 3, 2, 13, '#5a3a20'); for (let k = 4; k < 16; k += 4) P(4, k, 8, 1, '#3a2a18'); P(3, 2, 10, 1, '#d8b060'); break;
    case '#': case 'W': paintWall(g, F, x, y, ch === 'W'); break;
    case 'D': floorG(); P(1, 0, 14, 16, '#5a3a20'); P(2, 1, 12, 15, '#8a5a30'); P(7, 1, 2, 15, '#5a3a20'); P(10, 8, 2, 2, '#e8c860'); for (let k = 3; k < 16; k += 5) P(2, k, 12, 1, '#4a2a10'); break;
    case 'C': floorG(); { const open = F.opened.has(y * F.W + x); P(3, 6, 10, 8, '#8a5a2a'); P(3, 6, 10, 2, open ? '#2a1a0a' : '#a8743a'); P(3, 13, 10, 1, '#5a3a18'); P(7, 8, 2, 3, open ? '#5a3a18' : '#e8c860'); P(3, 9, 10, 1, '#c8a040'); if (open) P(4, 3, 8, 3, '#6a4220'); } break;
    case 'l': case 'q': floorG(); if (ch === 'q') for (let k = 0; k < 16; k += 4) { P(0, k, 16, 2, PAL.floor[2]); P(0, k + 2, 16, 1, '#7a6a58'); } break;
    case 'p': floorG(); P(4, 0, 8, 16, '#c8c0b8'); P(4, 0, 2, 16, '#e0d8d0'); P(10, 0, 2, 16, '#9a928a'); P(3, 0, 10, 2, '#a8a098'); P(3, 14, 10, 2, '#a8a098'); break;
    case 'e': floorG(); P(2, 4, 12, 10, '#d8d0c0'); P(2, 4, 12, 2, '#f0e8d8'); P(5, 1, 6, 4, '#e8c860'); P(7, 0, 2, 2, '#ff8a3a'); P(2, 13, 12, 1, '#9a9080'); break;
    case 'E': floorG(); P(3, 8, 10, 7, '#d8b060'); P(4, 9, 8, 5, '#a88a40'); P(5, 2, 6, 7, '#ffb040'); P(6, 0, 4, 4, '#fff0a0'); P(7, 4, 2, 4, '#ffffff'); break;
    case 's': sandG(); break;
    case 'S': snowG(); break;
    case 'z': snowG(); P(0, 0, 16, 16, '#c8e0f0'); P(2, 3, 6, 1, '#ffffff'); P(8, 10, 5, 1, '#ffffff'); P(4, 7, 1, 4, '#a8c8e0'); break;
    case 'c': base(); P(0, 0, 16, 16, '#8a7a6a'); for (let k = 0; k < 16; k += 4) { P(0, k, 16, 2, '#7a6a5a'); P(Math.floor(n(k) * 12), k + 2, 4, 1, '#a89a88'); } P(0, 0, 16, 2, '#5a8a3a'); break;
    case 'x': base(); for (let k = 1; k < 16; k += 5) P(k, 4, 2, 10, PAL.wood[1]); P(0, 6, 16, 2, PAL.wood[0]); P(0, 10, 16, 2, PAL.wood[0]); break;
    case 'n': base(); for (let k = 0; k < 3; k++) { g.fillStyle = PAL.tree[k % 2 + 1]; g.beginPath(); g.arc(ox + 3 + k * 5, oy + 9, 4, 0, 7); g.fill(); } P(0, 12, 16, 2, PAL.tree[0]); break;
    case 'B': base(); P(3, 9, 10, 4, PAL.wood[1]); P(2, 7, 12, 2, PAL.wood[0]); P(7, 2, 2, 8, PAL.wood[1]); P(4, 12, 2, 3, '#4a3a2a'); P(10, 12, 2, 3, '#4a3a2a'); P(1, 6, 14, 1, '#c8c8d0'); break;
    case 'P': P(0, 0, 16, 16, PAL.wood[0]); for (let k = 0; k < 16; k += 4) P(0, k, 16, 1, PAL.wood[1]); P(Math.floor(n(1) * 12), Math.floor(n(2) * 3) * 4 + 1, 4, 1, PAL.wood[2]); break;
    case 'L': paintWater(g, F, x, y, '~'); for (let k = 0; k < 7; k++) { const rx = Math.floor(n(k) * 14) + 1, h = 5 + Math.floor(n(k + 9) * 6); P(rx, 16 - h, 1, h, '#8aa848'); P(rx, 16 - h - 1, 1, 2, '#c8a858'); } break;
    case 'y': base(); P(2, 8, 4, 6, PAL.wall[1]); P(2, 8, 4, 1, PAL.wall[0]); P(9, 5, 5, 9, PAL.wall[1]); P(9, 5, 2, 1, PAL.wall[0]); P(11, 4, 2, 2, PAL.wall[2]); P(6, 13, 3, 2, PAL.wall[2]); break;
    case 'u': base(); for (let k = 0; k < 6; k++) P(Math.floor(n(k) * 12) + 1, Math.floor(n(k + 4) * 10) + 4, 3 + Math.floor(n(k + 8) * 3), 2, PAL.rock[k % 3]); break;
    case 'o': base(); P(2, 14, 12, 1, '#6a5a3a'); for (let r = 0; r < 9; r++) P(8 - r * 0.7, 5 + r, r * 1.4 + 1, 1, r % 2 ? '#d8c8a0' : '#c8b890'); P(7, 10, 2, 5, '#4a3a20'); P(7, 2, 1, 4, '#5a4a3a'); P(8, 2, 3, 2, '#c83a3a'); break;
    case '=': base(); P(1, 6, 14, 8, '#8a6a4a'); for (let k = 0; k < 4; k++) P(1 + k * 4, 4 + (k % 2), 3, 3, ['#6a5a4a', '#a8783a', '#5a4a3a', '#8a8a8a'][k]); P(2, 9, 12, 1, '#5a4030'); P(4, 11, 3, 3, '#3a2a1a'); break;
    case 't': base(); for (const [tx, ty] of [[3, 7], [10, 4]]) { P(tx, ty, 4, 7, '#a8a8a8'); P(tx, ty, 4, 1, '#c8c8c8'); P(tx + 1, ty - 1, 2, 1, '#a8a8a8'); P(tx + 1, ty + 2, 2, 1, '#6a6a6a'); } break;
    case 'g': grass(); for (let k = 0; k < 8; k++) P(Math.floor(n(k) * 14) + 1, Math.floor(n(k + 3) * 14) + 1, 2, 2, ['#f06a8a', '#f0e060', '#ffffff', '#a86ae8'][k % 4]); break;
    case 'Q': floorG(['#7a3a2a', '#5a2a1a', '#8a4a3a']); P(2, 4, 12, 8, '#8a2a2a'); P(2, 4, 12, 2, '#a83a3a'); P(3, 12, 2, 3, '#5a3a20'); P(11, 12, 2, 3, '#5a3a20'); break;
    case 'O': P(0, 0, 16, 16, '#a8783a'); for (let k = 0; k < 16; k += 4) P(k, 0, 1, 16, '#8a5a2a'); P(0, 0, 16, 1, '#d8a85a'); break;
    default: grass();
  }
}
function paintPath(g, F, x, y, pal, conn) {
  const ox = x * 16, oy = y * 16, P = (px, py, w, h, c) => { g.fillStyle = c; g.fillRect(ox + px, oy + py, w, h); };
  const c = (a, b) => conn(F.tile(x + a, y + b)) || 'vFGTkaHo'.includes(F.tile(x + a, y + b));
  const m = new Uint8Array(256), fill = (x0, y0, w, h) => { for (let yy = y0; yy < y0 + h; yy++) for (let xx = x0; xx < x0 + w; xx++) m[yy * 16 + xx] = 1; };
  fill(4, 4, 8, 8); if (c(0, -1)) fill(4, 0, 8, 4); if (c(0, 1)) fill(4, 12, 8, 4); if (c(-1, 0)) fill(0, 4, 4, 8); if (c(1, 0)) fill(12, 4, 4, 8);
  const edge = '#a88a58', shade2 = '#b89a68', grassC = '#6aa040';
  for (let yy = 0; yy < 16; yy++) for (let xx = 0; xx < 16; xx++) { if (!m[yy * 16 + xx]) continue; const out = (a, b) => { const X = xx + a, Y = yy + b; return X >= 0 && Y >= 0 && X < 16 && Y < 16 && !m[Y * 16 + X]; }; const e = out(-1, 0) || out(1, 0) || out(0, -1) || out(0, 1); const below = out(0, -1); P(xx, yy, 1, 1, e ? (below ? shade2 : edge) : pal[0]); if (e && hash(x * 16 + xx, y * 16 + yy, 3) < 0.25) P(xx, yy, 1, 1, grassC); }
  for (let k = 0; k < 6; k++) { const px = Math.floor(hash(x, y, k) * 14) + 1, py = Math.floor(hash(x, y, k + 5) * 14) + 1; if (m[py * 16 + px] && m[py * 16 + px + 1]) { P(px, py, 2, 1, pal[1]); P(px, py - 1, 1, 1, pal[2]); } }
}
function paintWater(g, F, x, y, ch) {
  const ox = x * 16, oy = y * 16, P = (px, py, w, h, c) => { g.fillStyle = c; g.fillRect(ox + px, oy + py, w, h); };
  const pal = ch === 'w' ? PAL.deep : PAL.water; P(0, 0, 16, 16, ch === '~' ? '#5a98d8' : pal[0]);
  for (let k = 0; k < 4; k++) { const wx = Math.floor(hash(x, y, k) * 12), wy = Math.floor(hash(x, y, k + 4) * 14); P(wx, wy, 3, 1, pal[1]); P(wx + 1, wy - 1, 2, 1, PAL.water[3]); } for (let k = 0; k < 3; k++) P(Math.floor(hash(x, y, k + 11) * 15), Math.floor(hash(x, y, k + 14) * 15), 2, 1, pal[2]); if (hash(x, y, 19) < 0.35) P(Math.floor(hash(x, y, 20) * 13) + 1, Math.floor(hash(x, y, 21) * 13) + 1, 1, 1, '#ffffff');
  // shores where the land is
  const land = (a, b) => { const t = F.tile(x + a, y + b); return !(isWater(t) || t === 'b' || t === 'L' || t === 'P'); };
  const sand = '#e8d098', foam = '#e8f4fc';
  if (land(0, -1)) { P(0, 0, 16, 2, sand); P(0, 2, 16, 1, foam); } if (land(0, 1)) { P(0, 14, 16, 2, sand); P(0, 13, 16, 1, foam); }
  if (land(-1, 0)) { P(0, 0, 2, 16, sand); P(2, 0, 1, 16, foam); } if (land(1, 0)) { P(14, 0, 2, 16, sand); P(13, 0, 1, 16, foam); }
}
function paintWall(g, F, x, y, high) {
  const ox = x * 16, oy = y * 16, P = (px, py, w, h, c) => { g.fillStyle = c; g.fillRect(ox + px, oy + py, w, h); };
  const top = !isWall(F.tile(x, y + 1));
  P(0, 0, 16, 16, PAL.wall[0]); for (let r = 0; r < 4; r++) for (let k = 0; k < 3; k++) { const bx = (r % 2) * 3 + k * 6 - 1; P(bx, r * 4, 5, 3, PAL.wall[1]); P(bx, r * 4 + 3, 5, 1, PAL.wall[2]); }
  if (top) { P(0, 12, 16, 4, PAL.wall[3]); P(0, 11, 16, 1, PAL.wall[2]); }
  if (!isWall(F.tile(x, y - 1))) { P(0, 0, 16, 2, '#c8c8d0'); for (let k = 0; k < 16; k += 4) P(k, 0, 2, 1, PAL.wall[2]); }
  if (high) { P(0, 0, 16, 1, '#d8d8e0'); }
}

// ---------------------------------------------------------------- the soldiers on the map (20×20 pixel sprites)
// look: from the class; team colours: blue yours, red the enemy, green allies, gold others
export const TEAM = { player: ['#3a6ad8', '#2a4aa8', '#7aa0f0'], enemy: ['#c83a3a', '#982a2a', '#f07a6a'], ally: ['#3a9a4a', '#2a7a3a', '#7ac87a'], other: ['#c8a030', '#987818', '#f0d070'], gray: ['#7a7a80', '#5a5a60', '#a8a8b0'] };
const LOOKS = {
  sword: { w: 'sword' }, princess: { w: 'rapier', dress: 1, long: 1 }, myrm: { w: 'sword', lean: 1 }, merc: { w: 'sword', cape: 1 }, fighter: { w: 'axe', bulk: 1 }, brigand: { w: 'axe', bulk: 1, bare: 1 },
  soldier: { w: 'lance', helm: 1 }, knight: { w: 'lance', armor: 1, helm: 1 }, cav: { w: 'lance', mount: 'horse' }, archer: { w: 'bow' }, gull: { w: 'lance', mount: 'gull' }, wyvern: { w: 'axe', mount: 'wyvern', helm: 1 },
  mage: { w: 'tome', robe: 1, hat: 'point' }, cleric: { w: 'staff', robe: 1, hood: 1 }, monk: { w: 'tome', robe: 1 }, shaman: { w: 'tome', robe: 1, hood: 1, dark: 1 }, thief: { w: 'dagger', hood: 1, lean: 1 }, bard: { w: 'lute', cape: 1, hat: 'feather' },
  wolf: { w: 'lance', mount: 'wolf' }, pirate: { w: 'axe', bulk: 1, bandana: 1 },
  oath: { w: 'sword', cape: 1, crest: 1 }, queen: { w: 'rapier', dress: 1, long: 1, crown: 1, cape: 1 }, sm: { w: 'katana', lean: 1 }, assassin: { w: 'dagger', hood: 1, lean: 1, dark: 1 }, hero: { w: 'sword', cape: 1, bulk: 1 }, warrior: { w: 'axe', bulk: 1, helm: 1 },
  berserker: { w: 'axe', bulk: 1, bare: 1, horns: 1 }, halberd: { w: 'halberd', helm: 1, armorLite: 1 }, general: { w: 'lance', armor: 1, helm: 1, cape: 1, big: 1 }, gk: { w: 'lance', mount: 'horse', armor: 1, helm: 1 }, paladin: { w: 'lance', mount: 'horse', cape: 1, barding: 1 },
  sniper: { w: 'bow', hood: 1, cape: 1 }, ranger: { w: 'bow', mount: 'horse' }, gulllord: { w: 'lance', mount: 'gull', cape: 1 }, storm: { w: 'lance', mount: 'gull', robe: 1 }, wyvernlord: { w: 'lance', mount: 'wyvern', helm: 1, cape: 1 },
  sage: { w: 'tome', robe: 1, cape: 1 }, spellblade: { w: 'sword', robe: 1 }, bishop: { w: 'staff', robe: 1, hat: 'mitre' }, valkyrie: { w: 'staff', mount: 'horse', robe: 1 }, druid: { w: 'tome', robe: 1, hood: 1, dark: 1, cape: 1 }, rogue: { w: 'dagger', hood: 1, cape: 1 },
  wolfking: { w: 'axe', mount: 'wolf', cape: 1, horns: 1 }, saint: { w: 'staff', robe: 1, veil: 1, long: 1 }, darkknight: { w: 'sword', mount: 'horse', cape: 1, helm: 1, dark: 1 }, strategist: { w: 'fan', robe: 1, long: 1 }, inquisitor: { w: 'lance', mount: 'horse', hat: 'tri', cape: 1, dark: 1 },
  regent: { w: 'sword', armor: 1, cape: 1, crown: 1, big: 1 }, archbishop: { w: 'staff', robe: 1, hat: 'mitre', cape: 1, big: 1 },
};
const MOUNT = { horse: ['#8a5a32', '#6a4222', '#a87442'], horseW: ['#e8e4dc', '#b8b4ac', '#ffffff'], gull: ['#f0f0f4', '#c0c4cc', '#ffffff'], wyvern: ['#5a7a5a', '#3a5a3a', '#7a9a6a'], wolf: ['#a8b0b8', '#7a8088', '#d8dce0'] };
// draw one frame. face: 'down' | 'up' | 'side' (facing right; flip for left). frame 0..3
export function sprite(lookId, team, hair, frame = 0, face = 'down', gray = false) {
  const L = LOOKS[lookId] || LOOKS.sword, T = TEAM[gray ? 'gray' : team] || TEAM.player, c = document.createElement('canvas'); c.width = c.height = 20; const g = c.getContext('2d');
  const P = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); }, skin = '#f0c8a0', skinS = '#d8a080', hc = hair || (L.dark ? '#3a3a44' : '#8a5a30'), ink = '#1a1420', lite = (h, k) => { const v = parseInt(h.slice(1), 16), f = (q) => Math.min(255, Math.round(q + (255 - q) * k)); return `rgb(${f((v >> 16) & 255)},${f((v >> 8) & 255)},${f(v & 255)})`; };
  const bob = frame % 2 ? 1 : 0, walk = face !== 'down' || frame > 1 ? (frame % 2 ? 1 : -1) : 0;
  g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(4, 18, 12, 2);
  const side = face === 'side', back = face === 'up';
  let by = 6 + bob, bx = 7; // body origin
  if (L.mount) {
    const M = MOUNT[L.mount === 'horse' && L.barding ? 'horseW' : L.mount];
    if (L.mount === 'horse' || L.mount === 'wolf') { const wolf = L.mount === 'wolf'; P(3, 11 + bob, 14, 5, M[0]); P(3, 11 + bob, 14, 1, M[2]); P(side ? 15 : 13, wolf ? 9 + bob : 7 + bob, 4, 6, M[0]); P(side ? 17 : 15, wolf ? 9 + bob : 8 + bob, 2, 2, M[1]); P(side ? 16 : 14, 7 + bob, 1, wolf ? 3 : 2, M[1]); for (const lx of [4, 7, 12, 15]) P(lx, 16 + (lx % 2 && walk ? 0 : bob), 2, 3 - (walk && lx % 2 ? 1 : 0), M[1]); P(2, 11 + bob, 2, wolf ? 3 : 5, M[1]); if (L.barding) P(5, 12 + bob, 9, 3, T[0]); by = 2 + bob; bx = 7; }
    if (L.mount === 'gull') { const wf = frame % 2; P(5, 11 + bob, 10, 5, M[0]); P(14, 9 + bob, 4, 4, M[0]); P(18, 10 + bob, 2, 1, '#f0a020'); P(16, 10 + bob, 1, 1, ink); P(1, 9 - wf * 3 + bob, 6, 3, M[1]); P(0, 8 - wf * 4 + bob, 4, 2, M[0]); P(13, 9 - wf * 3 + bob, 0, 0, M[0]); P(3, 14 + bob, 3, 2, M[1]); by = 3 + bob; }
    if (L.mount === 'wyvern') { const wf = frame % 2; P(4, 11 + bob, 11, 5, M[0]); P(14, 7 + bob, 4, 5, M[0]); P(17, 8 + bob, 3, 2, M[1]); P(16, 8 + bob, 1, 1, '#f0d040'); P(0, 6 - wf * 3 + bob, 7, 5, M[1]); P(1, 5 - wf * 3 + bob, 5, 1, M[2]); P(1, 14 + bob, 4, 2, M[1]); P(5, 16 + bob, 2, 3, M[1]); P(11, 16 + bob, 2, 3, M[1]); by = 2 + bob; }
  } else {
    // legs
    const ly = by + 8; P(bx, ly, 2, 4 - (walk > 0 ? 1 : 0), L.armor ? T[1] : '#4a3a30'); P(bx + 4, ly, 2, 4 - (walk < 0 ? 1 : 0), L.armor ? T[1] : '#4a3a30'); P(bx, ly + 2, 2, 1, L.armor ? '#9a9aa8' : '#6a4a2a'); P(bx + 4, ly + 2, 2, 1, L.armor ? '#9a9aa8' : '#6a4a2a'); P(bx, ly + 3, 2, 1, ink); P(bx + 4, ly + 3, 2, 1, ink); P(bx + 1, ly, 1, 2, L.armor ? '#d8d8e0' : '#5a4a40');
    if (L.robe || L.dress) { P(bx - 1, by + 5, 8, 6, L.robe ? T[1] : T[0]); P(bx - 1, by + 10, 8, 1, T[2]); }
  }
  // torso
  const tw = L.bulk || L.armor || L.big ? 8 : 6, tx = bx + 3 - tw / 2;
  if (L.cape) P(tx - 1, by + 1, tw + 2, 8, back ? T[1] : T[1]);
  P(tx, by + 2, tw, 6, L.bare ? skin : T[0]); P(tx, by + 2, tw, 1, T[2]); if (!back) P(tx + tw - 1, by + 3, 1, 5, L.bare ? skinS : T[1]); if (!L.bare && !back) P(tx + 1, by + 3, 1, 2, lite(T[0], 0.35)); if (L.armor || L.armorLite) { P(tx, by + 2, tw, 2, '#c8c8d0'); P(tx + 1, by + 4, tw - 2, 1, '#9a9aa8'); }
  if (!L.armor && !L.bare) { P(tx, by + 6, tw, 1, '#5a4030'); if (!back) P(tx + tw / 2 - 0.5, by + 6, 1, 1, '#e8c860'); }
  // arms
  P(tx - 1, by + 3, 1, 4, L.bare ? skin : T[1]); P(tx + tw, by + 3, 1, 4, L.bare ? skin : T[1]);
  // head
  const hx = bx + 1, hy = by - 4;
  if (L.helm || L.armor) { P(hx - 1, hy, 6, 5, '#b8b8c0'); P(hx - 1, hy, 6, 1, '#d8d8e0'); if (!back) { P(hx, hy + 2, 4, 2, skin); P(hx + 1, hy + 3, 1, 1, ink); P(hx + 3, hy + 3, 1, 1, ink); } if (L.horns) { P(hx - 2, hy - 1, 1, 2, '#e8dcc0'); P(hx + 5, hy - 1, 1, 2, '#e8dcc0'); } }
  else {
    P(hx, hy + 1, 4, 4, skin); if (!back) { P(hx + 3, hy + 2, 1, 3, skinS); P(hx, hy + 4, 4, 1, skinS); } P(hx - 1, hy, 6, 2, hc); P(hx - 1, hy + 1, 1, 3, hc); P(hx + 4, hy + 1, 1, 3, hc); P(hx, hy - 1, 4, 1, hc); P(hx, hy, 3, 1, lite(hc, 0.35)); if (back) P(hx, hy + 1, 4, 3, hc); if (!back) P(hx + 1, hy + 2, 2, 1, hc);
    if (L.long) { P(hx - 1, hy + 3, 1, 4, hc); P(hx + 4, hy + 3, 1, 4, hc); }
    if (!back) { P(side ? hx + 2 : hx + 1, hy + 3, 1, 1, ink); if (!side) P(hx + 3, hy + 3, 1, 1, ink); }
    if (L.hood || L.veil) { P(hx - 1, hy - 1, 6, 3, L.veil ? '#f0ece4' : T[1]); P(hx - 1, hy + 1, 1, 4, L.veil ? '#f0ece4' : T[1]); P(hx + 4, hy + 1, 1, 4, L.veil ? '#f0ece4' : T[1]); }
    if (L.hat === 'point') { P(hx - 2, hy, 8, 1, T[1]); P(hx, hy - 2, 4, 2, T[1]); P(hx + 1, hy - 4, 2, 2, T[1]); }
    if (L.hat === 'mitre') { P(hx, hy - 3, 4, 3, '#f0ece4'); P(hx + 1, hy - 4, 2, 1, '#f0ece4'); P(hx + 1, hy - 2, 2, 1, '#d8a840'); }
    if (L.hat === 'feather') { P(hx - 1, hy - 1, 6, 1, T[1]); P(hx + 4, hy - 4, 1, 3, '#f0f0f0'); }
    if (L.hat === 'tri') { P(hx - 2, hy - 1, 8, 2, '#1a1a22'); P(hx, hy - 2, 4, 1, '#1a1a22'); }
    if (L.bandana) P(hx - 1, hy, 6, 1, T[0]);
    if (L.crown) { P(hx, hy - 1, 4, 1, '#e8c860'); P(hx, hy - 2, 1, 1, '#e8c860'); P(hx + 3, hy - 2, 1, 1, '#e8c860'); }
  }
  if (L.crest) P(tx + tw / 2 - 1, by + 3, 2, 2, '#e8e8f0');
  // the weapon, held on the right
  const wx = tx + tw + 1, wy = by + 2;
  const W = { sword: () => { P(wx, wy - 4, 1, 7, '#e0e4ec'); P(wx - 1, wy + 2, 3, 1, '#c8a040'); }, rapier: () => { P(wx, wy - 4, 1, 7, '#f0f4fc'); P(wx - 1, wy + 2, 3, 1, '#e8c860'); }, katana: () => { P(wx, wy - 5, 1, 7, '#f0f4fc'); P(wx + 1, wy - 5, 1, 1, '#f0f4fc'); P(wx, wy + 2, 1, 2, '#3a1a1a'); },
    dagger: () => { P(wx, wy, 1, 3, '#e0e4ec'); }, lance: () => { P(wx, wy - 7, 1, 13, '#8a6a4a'); P(wx, wy - 9, 1, 2, '#e0e4ec'); P(wx - 1, wy - 8, 3, 1, '#c8c8d0'); }, halberd: () => { P(wx, wy - 7, 1, 13, '#8a6a4a'); P(wx, wy - 8, 3, 3, '#c8c8d0'); },
    axe: () => { P(wx, wy - 3, 1, 9, '#8a6a4a'); P(wx, wy - 4, 3, 4, '#c8c8d0'); P(wx + 2, wy - 5, 1, 6, '#a8a8b0'); }, bow: () => { P(wx, wy - 3, 1, 8, '#8a5a2a'); P(wx + 1, wy - 4, 1, 1, '#8a5a2a'); P(wx + 1, wy + 5, 1, 1, '#8a5a2a'); P(wx - 1, wy - 3, 1, 8, '#e8e0d0'); },
    tome: () => { P(wx - 1, wy + 2, 3, 3, L.dark ? '#5a2a6a' : '#c83a3a'); P(wx - 1, wy + 2, 3, 1, '#e8c860'); }, staff: () => { P(wx, wy - 6, 1, 12, '#c8a060'); P(wx - 1, wy - 8, 3, 3, '#e8e0a0'); P(wx, wy - 7, 1, 1, '#ffffff'); },
    lute: () => { P(wx - 1, wy + 1, 3, 4, '#c8945a'); P(wx, wy - 3, 1, 4, '#8a5a2a'); }, fan: () => { P(wx - 1, wy - 2, 4, 3, '#f0f0f0'); P(wx, wy + 1, 1, 2, '#8a6a4a'); } };
  (W[L.w] || W.sword)();
  // outline: a dark rim around everything drawn, like a hand-pixelled sprite
  const img = g.getImageData(0, 0, 20, 20), d = img.data, out = g.createImageData(20, 20), o = out.data;
  for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) { const k = (y * 20 + x) * 4; if (d[k + 3] > 200 || (d[k + 3] > 0 && y >= 18)) continue; const nb = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => { const xx = x + a, yy = y + b; return xx >= 0 && yy >= 0 && xx < 20 && yy < 18 && d[(yy * 20 + xx) * 4 + 3] > 200; }); if (nb && y < 18) { o[k] = 26; o[k + 1] = 20; o[k + 2] = 32; o[k + 3] = 255; } }
  const oc = document.createElement('canvas'); oc.width = oc.height = 20; const og = oc.getContext('2d'); og.putImageData(out, 0, 0); og.drawImage(c, 0, 0);
  if (face === 'side' && frame >= 100) return oc;
  return oc;
}
// cache: one canvas per look / team / hair / frame / facing
const CACHE = new Map();
export function spriteOf(u, frame, face = 'down', gray = false) { const key = [u.look, u.side, u.hair, frame, face, gray].join('|'); let c = CACHE.get(key); if (!c) { c = sprite(u.look, u.side, u.hair, frame, face, gray); CACHE.set(key, c); } return c; }
export { hash };
