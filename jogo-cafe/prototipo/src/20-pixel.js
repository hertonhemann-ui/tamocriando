/* ================= PIXEL ART ================= */
function r(x, y, w, h, c) { cx.fillStyle = c; cx.fillRect(Math.round(x), Math.round(y), w, h); }
function tom(hex, a) { const n = parseInt(hex.slice(1), 16); const f = v => clamp(Math.round(v + a), 0, 255); return '#' + [f(n >> 16), f((n >> 8) & 255), f(n & 255)].map(v => v.toString(16).padStart(2, '0')).join(''); }
const BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];
const ditherCache = {};
function dither(x, y, w, h, c1, c2, nivelFn, id) {
  // degradê com padrão Bayer; cada combinação é desenhada uma vez e reaproveitada
  const k = [id, x, y, w, h, c1, c2].join('|');
  let c = ditherCache[k];
  if (!c) {
    c = document.createElement('canvas'); c.width = w; c.height = h;
    const g = c.getContext('2d'); g.fillStyle = c1; g.fillRect(0, 0, w, h); g.fillStyle = c2;
    for (let j = 0; j < h; j++) { const n = nivelFn(j / h) * 16; for (let i = 0; i < w; i++) if (BAYER[(y + j) & 3][(x + i) & 3] < n) g.fillRect(i, j, 1, 1); }
    ditherCache[k] = c;
  }
  cx.drawImage(c, x, y);
}
function luz(x, y, raio, cor, forca = 0.35) {
  cx.save(); cx.globalCompositeOperation = 'lighter';
  const g = cx.createRadialGradient(x, y, 0, x, y, raio); g.addColorStop(0, cor.replace('A', forca)); g.addColorStop(1, cor.replace('A', 0));
  cx.fillStyle = g; cx.fillRect(x - raio, y - raio, raio * 2, raio * 2); cx.restore();
}
function sombra(x, y, w, a = 0.35) { r(x - w / 2 + 1, y, w - 2, 1, `rgba(10,5,25,${a})`); r(x - w / 2, y + 1, w, 1, `rgba(10,5,25,${a * 0.7})`); }
function spriteBase(x, y, p, o = {}) {
  // 12x24; (x,y) = pés. Contorno colorido (tom escuro da própria cor), ciclo de caminhada e braços que balançam.
  const ph = o.bob || 0, and = !!o.andando;
  const sw = and ? Math.round(Math.sin(ph)) : 0;
  const up = and ? (Math.abs(Math.sin(ph)) > 0.75 ? 1 : 0) : (o.bob ? Math.round(Math.sin(ph) * 0.6) : 0);
  const X = Math.round(x) - 6, Y = Math.round(y) - 24 - up;
  const pele = p.pele, peS = tom(pele, -34), peO = tom(pele, -100), ro = tom(p.roupa, -90), rL = tom(p.roupa, 34), rS = tom(p.roupa, -44);
  if (!o.semPernas) {
    r(X + 2, Math.round(y) - 1, 9, 1, 'rgba(8,4,22,.30)');
    const calca = p.calca || '#3a3458', calcaS = tom(calca, -30);
    r(X + 3 + sw, Y + 18 + up, 3, 6 - up, calca); r(X + 6 - sw, Y + 18 + up, 3, 6 - up, calcaS);
    r(X + 2 + sw, Y + 23, 4, 1, '#1a1226'); r(X + 6 - sw, Y + 23, 4, 1, '#1a1226');
  }
  r(X + 1, Y + 9, 10, 10, ro); r(X + 2, Y + 10, 8, 9, p.roupa); r(X + 2, Y + 10, 3, 9, rL); r(X + 8, Y + 10, 2, 9, rS);
  r(X + 2, Y + 16, 8, 1, tom(p.roupa, -62));
  if (o.avental) { r(X + 4, Y + 12, 4, 7, o.avental); r(X + 7, Y + 12, 1, 7, tom(o.avental, -42)); r(X + 4, Y + 18, 4, 1, tom(o.avental, -28)); r(X + 5, Y + 14, 2, 1, tom(o.avental, -50)); }
  const a1 = and ? -sw : 0, a2 = and ? sw : 0;
  r(X, Y + 11 + a1, 2, 6, p.roupa); r(X, Y + 11 + a1, 1, 6, ro); r(X + 10, Y + 11 + a2, 2, 6, rS); r(X + 11, Y + 11 + a2, 1, 6, ro);
  r(X, Y + 17 + a1, 2, 2, pele); r(X + 10, Y + 17 + a2, 2, 2, peS);
  r(X + 2, Y + 1, 8, 9, peO); r(X + 3, Y + 2, 6, 7, pele); r(X + 8, Y + 2, 1, 7, peS); r(X + 4, Y + 9, 4, 1, peS);
  const c = p.cabelo, cS = tom(c, -38), cO = tom(c, -80);
  if (p.estilo === 'coque') { r(X + 2, Y, 8, 3, cO); r(X + 3, Y, 6, 3, c); r(X + 4, Y - 3, 4, 3, c); r(X + 5, Y - 3, 2, 1, tom(c, 25)); r(X + 2, Y + 3, 1, 4, cS); r(X + 9, Y + 3, 1, 4, cS); }
  else if (p.estilo === 'rabo') { r(X + 2, Y, 8, 3, cO); r(X + 3, Y, 6, 3, c); r(X + 9, Y + 2, 3, 6, cS); r(X + 3, Y, 4, 1, tom(c, 30)); }
  else if (p.estilo === 'bone') { r(X + 1, Y, 10, 3, '#d23b3b'); r(X + 8, Y + 2, 4, 1, '#a82828'); r(X + 2, Y, 4, 1, '#ff6a5a'); }
  else if (p.estilo === 'topete') { r(X + 2, Y - 1, 8, 4, cO); r(X + 3, Y - 1, 6, 3, c); r(X + 6, Y - 2, 4, 1, c); r(X + 3, Y - 1, 3, 1, tom(c, 40)); }
  else if (p.estilo === 'longo') { r(X + 1, Y, 10, 3, cO); r(X + 2, Y, 8, 3, c); r(X + 1, Y + 3, 2, 8, c); r(X + 9, Y + 3, 2, 8, cS); r(X + 3, Y, 4, 1, tom(c, 35)); }
  else if (p.estilo === 'careca') { r(X + 2, Y + 3, 1, 3, c); r(X + 9, Y + 3, 1, 3, c); r(X + 4, Y + 2, 2, 1, tom(pele, 30)); }
  else { r(X + 2, Y, 8, 3, cO); r(X + 3, Y, 6, 3, c); r(X + 2, Y + 3, 1, 2, cS); r(X + 3, Y, 3, 1, tom(c, 35)); }
  r(X + 4, Y + 5, 1, 2, '#241418'); r(X + 7, Y + 5, 1, 2, '#241418');
  r(X + 3, Y + 7, 1, 1, '#e89a8a'); r(X + 8, Y + 7, 1, 1, '#d48878');
  if (o.feliz) { r(X + 5, Y + 8, 2, 1, '#7a3a3a'); } else if (o.bravo) { r(X + 4, Y + 4, 2, 1, '#241418'); r(X + 6, Y + 4, 2, 1, '#241418'); }
  if (p.oculos) { r(X + 3, Y + 5, 3, 1, '#333'); r(X + 6, Y + 5, 3, 1, '#333'); }
}
const retCache = {};
function retrato(id) {
  if (retCache[id]) return retCache[id];
  const p = PERS[id] || PERS.voce;
  const c = document.createElement('canvas'); c.width = 24; c.height = 24;
  const g = c.getContext('2d');
  const q = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
  for (let j = 0; j < 24; j++) q(0, j, 24, 1, j < 12 ? '#3a3166' : '#2d2650');
  q(3, 17, 18, 7, '#120a1e'); q(4, 18, 16, 6, p.roupa); q(4, 18, 5, 6, tom(p.roupa, 30)); q(16, 18, 4, 6, tom(p.roupa, -40)); q(10, 17, 4, 3, p.pele);
  q(6, 4, 12, 13, '#120a1e'); q(7, 5, 10, 11, p.pele); q(15, 5, 2, 11, tom(p.pele, -35)); q(6, 9, 1, 3, p.pele); q(17, 9, 1, 3, tom(p.pele, -35));
  const h = p.cabelo;
  if (p.estilo === 'coque') { q(6, 3, 12, 4, h); q(9, 0, 6, 3, h); q(10, 0, 3, 1, tom(h, 20)); q(6, 7, 1, 4, h); q(17, 7, 1, 4, tom(h, -30)); }
  else if (p.estilo === 'rabo') { q(6, 3, 12, 4, h); q(17, 5, 3, 9, tom(h, -30)); q(8, 3, 5, 1, tom(h, 30)); }
  else if (p.estilo === 'bone') { q(5, 2, 14, 4, '#d23b3b'); q(14, 5, 7, 2, '#a82828'); q(7, 2, 5, 1, '#ff6a5a'); }
  else if (p.estilo === 'topete') { q(6, 2, 12, 4, h); q(11, 0, 6, 2, h); q(8, 2, 4, 1, tom(h, 40)); }
  else if (p.estilo === 'longo') { q(5, 3, 14, 4, h); q(5, 7, 2, 10, h); q(17, 7, 2, 10, tom(h, -30)); q(8, 3, 5, 1, tom(h, 35)); }
  else if (p.estilo === 'careca') { q(6, 7, 1, 4, h); q(17, 7, 1, 4, h); q(9, 5, 3, 1, tom(p.pele, 30)); }
  else { q(6, 3, 12, 4, h); q(6, 7, 1, 2, h); q(8, 3, 4, 1, tom(h, 35)); }
  q(9, 10, 2, 2, '#120a1e'); q(13, 10, 2, 2, '#120a1e'); q(9, 10, 1, 1, '#fff'); q(13, 10, 1, 1, '#fff'); q(10, 14, 4, 1, '#7a3a3a');
  if (p.oculos) { q(8, 9, 4, 1, '#333'); q(12, 9, 4, 1, '#333'); q(8, 12, 4, 1, '#333'); q(12, 12, 4, 1, '#333'); }
  return (retCache[id] = c.toDataURL());
}
function sprite(x, y, p, o = {}) {
  const fl = o.flip, al = o.alpha !== undefined && o.alpha < 1;
  if (fl || al) { cx.save(); if (al) cx.globalAlpha = clamp(o.alpha, 0, 1); if (fl) { cx.translate(Math.round(x), 0); cx.scale(-1, 1); cx.translate(-Math.round(x), 0); } }
  spriteBase(x, y, p, o);
  if (fl || al) cx.restore();
}
