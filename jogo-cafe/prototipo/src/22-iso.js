/* ================= ISOMÉTRICO 2:1 ================= */
const TW = 32, TH = 16, COLS = 11, ROWS = 9, OX = 184, OY = 66, WH = 52;
const isoX = (gx, gy) => OX + (gx - gy) * TW / 2;
const isoY = (gx, gy, gz = 0) => OY + (gx + gy) * TH / 2 - gz;
const PT = (gx, gy, gz = 0) => [Math.round(isoX(gx, gy)), Math.round(isoY(gx, gy, gz))];

/* polígono convexo preenchido linha a linha, sem suavização (pixel nítido) */
function poly(pts, col) {
  cx.fillStyle = col;
  let y0 = Infinity, y1 = -Infinity;
  for (const p of pts) { if (p[1] < y0) y0 = p[1]; if (p[1] > y1) y1 = p[1]; }
  y0 = Math.floor(y0); y1 = Math.ceil(y1);
  const n = pts.length;
  for (let y = y0; y < y1; y++) {
    const yy = y + 0.5; let xmin = Infinity, xmax = -Infinity;
    for (let i = 0; i < n; i++) {
      const a = pts[i], b = pts[(i + 1) % n];
      if ((a[1] <= yy && b[1] > yy) || (b[1] <= yy && a[1] > yy)) { const x = a[0] + (yy - a[1]) * (b[0] - a[0]) / (b[1] - a[1]); if (x < xmin) xmin = x; if (x > xmax) xmax = x; }
    }
    if (xmax > xmin) { const xa = Math.round(xmin), xb = Math.round(xmax); if (xb > xa) cx.fillRect(xa, y, xb - xa, 1); }
  }
}
function lin(x0, y0, x1, y1, col) {
  cx.fillStyle = col; x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
  const dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1; let e = dx - dy;
  for (let k = 0; k < 400; k++) { cx.fillRect(x0, y0, 1, 1); if (x0 === x1 && y0 === y1) break; const e2 = 2 * e; if (e2 > -dy) { e -= dy; x0 += sx; } if (e2 < dx) { e += dx; y0 += sy; } }
}
function elip(x, y, rx, ry, col) {
  cx.fillStyle = col; x = Math.round(x); y = Math.round(y);
  for (let j = -ry; j <= ry; j++) { const w = Math.round(rx * Math.sqrt(Math.max(0, 1 - (j * j) / (ry * ry + 0.0001)))); if (w > 0) cx.fillRect(x - w, y + j, w * 2, 1); }
}
/* caixa isométrica: luz vem de cima à esquerda (topo claro, lado esquerdo médio, lado direito escuro) */
function caixa(gx, gy, w, d, h, z0, c, o = {}) {
  const cor = typeof c === 'string' ? { t: tom(c, 30), l: c, r: tom(c, -40) } : c;
  const z1 = z0 + h;
  const A = PT(gx, gy, z1), B = PT(gx + w, gy, z1), C = PT(gx + w, gy + d, z1), D = PT(gx, gy + d, z1);
  const Cb = PT(gx + w, gy + d, z0), Db = PT(gx, gy + d, z0), Bb = PT(gx + w, gy, z0);
  if (h > 0) { poly([D, C, Cb, Db], cor.l); poly([C, B, Bb, Cb], cor.r); }
  poly([A, B, C, D], cor.t);
  if (o.ol !== false) {
    const ol = o.olc || tom(cor.l, -75);
    lin(A[0], A[1], B[0], B[1], ol); lin(A[0], A[1], D[0], D[1], ol);
    if (h > 0) { lin(D[0], D[1], Db[0], Db[1], ol); lin(B[0], B[1], Bb[0], Bb[1], ol); lin(Db[0], Db[1], Cb[0], Cb[1], ol); lin(Cb[0], Cb[1], Bb[0], Bb[1], ol); lin(C[0], C[1], Cb[0], Cb[1], tom(cor.l, -40)); }
    lin(D[0], D[1], C[0], C[1], tom(cor.t, 18)); lin(C[0], C[1], B[0], B[1], tom(cor.t, 8));
  }
}
/* sombra no chão (rombo achatado deslocado para a direita, longe da luz) */
function sombraIso(gx, gy, w, d, h, a = 0.28) {
  const dx = h * 0.07, dy = h * 0.03;
  poly([PT(gx + dx, gy - dy), PT(gx + w + dx, gy - dy), PT(gx + w + dx, gy + d - dy), PT(gx + dx, gy + d - dy)], `rgba(8,4,22,${a})`);
}
function discoIso(gx, gy, z, rx, ry, c, esp = 2) { // tampo redondo com espessura
  const x = isoX(gx, gy), y = isoY(gx, gy, z);
  elip(x, y + esp, rx, ry, tom(c, -55)); elip(x, y, rx, ry, c); elip(x - 2, y - 1, Math.max(2, rx - 6), Math.max(1, ry - 3), tom(c, 14));
}

/* ---- mesas ---- */
const SLOT_POS = [[2.4, 5.7], [5.6, 5.7], [8.8, 5.7], [2.4, 7.85], [5.6, 7.85], [8.8, 7.85]];
function geoMesa(i) {
  const m = S.salao.mesas[i]; if (!m) return null;
  const def = MESAS[m.mesa], cad = CADEIRAS[m.cad], [tx, ty] = SLOT_POS[i];
  const grande = def.lugares === 4, w = grande ? 2.6 : 1.2, d = 1.2;
  const seats = []; const xs = grande ? [-0.6, 0.6] : [0];
  [-1, 1].forEach(lado => xs.forEach(dx => seats.push({ gx: tx + dx, gy: ty + lado * 0.95, lado })));
  return { i, tx, ty, w, d, def, cad, modelo: m.mesa, seats, parada: { x: Math.min(tx + w / 2 + 0.95, 10.4), y: ty } };
}
const MAT = {
  madeira: { t: '#c89a60', l: '#a8723e', r: '#7a5028' },
  madeiraEsc: { t: '#a8723e', l: '#865a30', r: '#654220' },
  metal: { t: '#9aa0b4', l: '#6a7088', r: '#4a5068' },
  preto: { t: '#4a4a58', l: '#34343f', r: '#24242c' },
  vidro: { t: '#c8eefc', l: '#8cc4d8', r: '#6aa4bc' },
  cromo: { t: '#f0f4fa', l: '#b8c4d4', r: '#8a98ac' },
  formica: { t: '#f08a98', l: '#c8566a', r: '#a03e50' },
};
function desenhaMesa(g) {
  const { tx, ty, w, d } = g, x0 = tx - w / 2, y0 = ty - d / 2;
  sombraIso(x0, y0, w, d, 12);
  switch (g.modelo) {
    case 'ferro':
      caixa(tx - 0.4, ty - 0.4, 0.8, 0.8, 1, 0, MAT.preto, { ol: false }); caixa(tx - 0.1, ty - 0.1, 0.2, 0.2, 10, 1, MAT.preto, { ol: false });
      caixa(tx - 0.58, ty - 0.58, 1.16, 1.16, 2, 10, MAT.metal); break;
    case 'redonda':
      caixa(tx - 0.12, ty - 0.12, 0.24, 0.24, 10, 0, MAT.madeiraEsc, { ol: false }); caixa(tx - 0.4, ty - 0.4, 0.8, 0.8, 1, 0, MAT.madeiraEsc, { ol: false });
      discoIso(tx, ty, 11, 20, 10, '#c89a60', 3); break;
    case 'comprida':
      [[0.1, 0.1], [w - 0.3, 0.1], [0.1, d - 0.3], [w - 0.3, d - 0.3]].forEach(([a, b]) => caixa(x0 + a, y0 + b, 0.2, 0.2, 11, 0, MAT.madeiraEsc, { ol: false }));
      caixa(x0, y0, w, d, 3, 11, MAT.madeira); break;
    case 'alta':
      caixa(tx - 0.4, ty - 0.4, 0.8, 0.8, 1, 0, MAT.preto, { ol: false }); caixa(tx - 0.1, ty - 0.1, 0.2, 0.2, 17, 1, MAT.metal, { ol: false });
      caixa(tx - 0.58, ty - 0.58, 1.16, 1.16, 2, 17, MAT.preto); break;
    case 'vidro':
      [[0.08, 0.08], [1.0, 0.08], [0.08, 1.0], [1.0, 1.0]].forEach(([a, b]) => caixa(x0 + a, y0 + b, 0.12, 0.12, 11, 0, MAT.cromo, { ol: false }));
      cx.save(); cx.globalAlpha = 0.85; caixa(x0, y0, 1.2, 1.2, 1.5, 11, MAT.vidro); cx.restore(); break;
    case 'retro':
      caixa(tx - 0.9, ty - 0.12, 0.24, 0.24, 11, 0, MAT.cromo, { ol: false }); caixa(tx + 0.66, ty - 0.12, 0.24, 0.24, 11, 0, MAT.cromo, { ol: false });
      caixa(x0, y0, w, d, 2.5, 11, MAT.formica, { olc: '#f4f8ff' }); break;
    case 'vaso':
      caixa(tx - 0.12, ty - 0.12, 0.24, 0.24, 10, 0, MAT.madeiraEsc, { ol: false }); caixa(tx - 0.4, ty - 0.4, 0.8, 0.8, 1, 0, MAT.madeiraEsc, { ol: false });
      caixa(tx - 0.58, ty - 0.58, 1.16, 1.16, 2, 10, MAT.madeira);
      { const x = isoX(tx, ty), y = isoY(tx, ty, 12); r(x - 3, y - 4, 7, 5, '#a8564a'); r(x - 2, y - 5, 5, 1, '#c8705a'); r(x - 5, y - 10, 3, 6, '#3f9a4a'); r(x + 3, y - 11, 3, 7, '#52b85c'); r(x - 1, y - 13, 3, 8, '#46a852'); r(x - 4, y - 8, 1, 3, '#2f7a3a'); }
      break;
  }
}
function desenhaCadeira(cad, gx, gy, lado) {
  const cor = { t: tom(cad.cor[0], 24), l: cad.cor[0], r: cad.cor[1] }, esc = { t: tom(cad.cor[1], 8), l: cad.cor[1], r: tom(cad.cor[1], -35) };
  sombraIso(gx - 0.35, gy - 0.35, 0.7, 0.7, 8, 0.22);
  const bk = lado < 0 ? -0.34 : 0.3; // encosto do lado oposto à mesa
  if (cad.tipo === 'banco') {
    caixa(gx - 0.08, gy - 0.08, 0.16, 0.16, 10, 0, MAT.cromo, { ol: false }); caixa(gx - 0.3, gy - 0.3, 0.6, 0.6, 1, 0, MAT.cromo, { ol: false });
    discoIso(gx, gy, 12, 8, 4, cad.cor[0], 2);
  } else if (cad.tipo === 'poltrona') {
    caixa(gx - 0.4, gy - 0.4, 0.8, 0.8, 3, 0, esc, { ol: false });
    caixa(gx - 0.45, gy - 0.45, 0.9, 0.9, 4, 3, cor);
    caixa(gx - 0.45, gy + (lado < 0 ? -0.5 : 0.3), 0.9, 0.2, 11, 7, esc);
    caixa(gx - 0.55, gy - 0.4, 0.15, 0.8, 5, 6, esc); caixa(gx + 0.4, gy - 0.4, 0.15, 0.8, 5, 6, esc);
  } else {
    [[-0.28, -0.28], [0.18, -0.28], [-0.28, 0.18], [0.18, 0.18]].forEach(([a, b]) => caixa(gx + a, gy + b, 0.1, 0.1, 6, 0, esc, { ol: false }));
    caixa(gx - 0.32, gy - 0.32, 0.64, 0.64, 2, 6, cor);
    caixa(gx - 0.32, gy + bk, 0.64, 0.1, 8, 8, esc);
  }
}
