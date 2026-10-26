// A watercolour finish for the painted art, after the official Fire Emblem illustrations: colours eased toward
// pastel, a soft bloom where the pigment bleeds, the grain of cold-pressed paper with blooms and blotches of
// uneven wash, and a light tint washed over everything. It works in place on a finished canvas and touches only
// what is painted (transparent pixels stay transparent).
let PAPER = null;
function paper() {
  if (PAPER) return PAPER;
  const N = 512, c = document.createElement('canvas'); c.width = c.height = N; const g = c.getContext('2d');
  let h = 99991; const rnd = () => { h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0; h = Math.imul(h ^ (h >>> 13), 3266489909) >>> 0; return h / 4294967296; };
  g.fillStyle = '#ffffff'; g.fillRect(0, 0, N, N);
  // uneven wash: soft blotches at a few scales
  for (const [n, r0, r1, a] of [[40, 60, 140, 0.05], [140, 16, 50, 0.06], [500, 3, 12, 0.07]]) for (let k = 0; k < n; k++) {
    const x = rnd() * N, y = rnd() * N, r = r0 + rnd() * (r1 - r0);
    for (const [dx, dy] of [[0, 0], [N, 0], [-N, 0], [0, N], [0, -N]]) { const gr = g.createRadialGradient(x + dx, y + dy, 0, x + dx, y + dy, r); gr.addColorStop(0, `rgba(120,90,110,${a * (0.5 + rnd())})`); gr.addColorStop(0.7, `rgba(120,90,110,${a * 0.6})`); gr.addColorStop(1, 'rgba(120,90,110,0)'); g.fillStyle = gr; g.fillRect(x + dx - r, y + dy - r, r * 2, r * 2); }
  }
  // the tooth of the paper: fine grain and short fibres
  const d = g.getImageData(0, 0, N, N), px = d.data;
  for (let i = 0; i < px.length; i += 4) { const v = (rnd() - 0.5) * 34; px[i] += v; px[i + 1] += v; px[i + 2] += v; }
  g.putImageData(d, 0, 0);
  g.strokeStyle = 'rgba(90,70,90,0.08)'; g.lineWidth = 0.8; for (let k = 0; k < 900; k++) { const x = rnd() * N, y = rnd() * N, a = rnd() * 6.28, l = 3 + rnd() * 8; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke(); }
  PAPER = c; return c;
}
const layer = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
export function watercolor(c, o = {}) {
  const { sat = 0.86, bright = 1.04, bloom = 0.32, grain = 0.3, scale = 1, lift = 0.16, wash = ['rgba(255,214,236,0.16)', 'rgba(196,186,255,0.16)'] } = o;
  const w = c.width, h = c.height, src = layer(w, h), s = src.getContext('2d'); s.drawImage(c, 0, 0);
  const g = c.getContext('2d'); g.save(); g.setTransform(1, 0, 0, 1, 0, 0);
  // pastel: a little less saturated, a little lighter
  g.clearRect(0, 0, w, h); g.filter = `saturate(${sat}) brightness(${bright})`; g.drawImage(src, 0, 0); g.filter = 'none';
  // bloom: a blurred copy laid softly over, as wet pigment spreads past the lines
  g.globalCompositeOperation = 'source-atop'; g.globalAlpha = bloom; g.filter = `blur(${Math.max(1.2, w / 260) * scale}px) saturate(${sat}) brightness(1.08)`; g.drawImage(src, 0, 0); g.filter = 'none'; g.globalAlpha = 1;
  // the tint and the paper, only where there is paint
  const L = layer(w, h), l = L.getContext('2d');
  const gr = l.createLinearGradient(0, 0, w, h); gr.addColorStop(0, wash[0]); gr.addColorStop(1, wash[1]); l.fillStyle = gr; l.fillRect(0, 0, w, h);
  l.globalCompositeOperation = 'destination-in'; l.drawImage(src, 0, 0);
  g.globalCompositeOperation = 'soft-light'; g.drawImage(L, 0, 0);
  // the darks lifted toward lavender, as the paintings never go to black
  if (lift) { const K = layer(w, h), k = K.getContext('2d'); k.fillStyle = `rgba(110,92,160,${lift})`; k.fillRect(0, 0, w, h); k.globalCompositeOperation = 'destination-in'; k.drawImage(src, 0, 0); g.globalCompositeOperation = 'screen'; g.drawImage(K, 0, 0); }
  const P = layer(w, h), q = P.getContext('2d'); q.fillStyle = q.createPattern(paper(), 'repeat'); q.save(); q.scale(scale, scale); q.fillRect(0, 0, w / scale + 1, h / scale + 1); q.restore();
  q.globalCompositeOperation = 'destination-in'; q.drawImage(src, 0, 0);
  g.globalCompositeOperation = 'multiply'; g.globalAlpha = grain; g.drawImage(P, 0, 0);
  g.restore();
  return c;
}
