/* ================= SALA (camada estática em cache) ================= */
// Estações: onde o equipamento está (cx, cy) e onde o personagem fica em pé para usar (x, y)
const EST = {
  moedor: { cx: 1.65, cy: 0.6, x: 1.65, y: 2.0, nome: 'Moedor' },
  maquina: { cx: 4.0, cy: 0.6, x: 4.0, y: 2.0, nome: 'Máquina' },
  vapor: { cx: 5.8, cy: 0.6, x: 5.8, y: 2.0, nome: 'Vaporizador' },
  coador: { cx: 7.35, cy: 0.6, x: 7.35, y: 2.0, nome: 'Coador' },
  forno: { cx: 9.2, cy: 0.6, x: 9.2, y: 2.0, nome: 'Forno' },
};
const BALCAO = { x0: 0.4, x1: 8.6, y0: 3.0, d: 0.7, h: 15 };
const SPOTS_X = [1.4, 3.1, 4.8, 6.5, 8.2], SPOT_Y = 4.35, SERVE_Y = 2.45;
const PORTA = { x: 0.25, y: 6.6 };
const GAP = { x: 10.0, yk: 2.7, yd: 4.3 };
const RW = (u, z) => PT(u, 0, z), LW = (v, z) => PT(0, v, z);
let fundoCv = null, fundoKey = '';

function parede(plano, u0, u1, z0, z1, col) { // retângulo sobre a parede (plano 'R' = direita, 'L' = esquerda)
  const f = plano === 'R' ? RW : LW;
  poly([f(u0, z0), f(u1, z0), f(u1, z1), f(u0, z1)], col);
}
function linhaParede(plano, u0, z0, u1, z1, col) { const f = plano === 'R' ? RW : LW, a = f(u0, z0), b = f(u1, z1); lin(a[0], a[1], b[0], b[1], col); }

function desenhaSala(bucket) {
  const pint = DECOR.parede.opc[S.salao.decor.parede], pisoId = S.salao.decor.piso;
  r(0, 0, CW, CH, '#0e0a1c');
  // ---- piso ----
  for (let gy = 0; gy < ROWS; gy++) for (let gx = 0; gx < COLS; gx++) {
    let c;
    if (gy < 3) c = (gx + gy) % 2 ? '#c8ccd6' : '#aeb4c2';                       // cozinha: azulejo cinza
    else if (pisoId === 'xadrez') c = (gx + gy) % 2 ? '#ece4d8' : '#2a2430';
    else if (pisoId === 'concreto') c = ((gx * 7 + gy * 3) % 5 === 0) ? '#6c6c78' : '#7a7a86';
    else if (pisoId === 'ladrilho') c = (gx + gy) % 2 ? '#5f9a6a' : '#4a8456';
    else c = gy % 2 ? '#6c4830' : '#7a5238';                                       // tábua corrida
    poly([PT(gx, gy), PT(gx + 1, gy), PT(gx + 1, gy + 1), PT(gx, gy + 1)], c);
    if (gy >= 3 && pisoId === 'padrao') { const a = PT(gx, gy), b = PT(gx, gy + 1); lin(a[0], a[1], b[0], b[1], 'rgba(30,14,8,.35)'); }
  }
  // oclusão ambiente junto às paredes
  for (let gx = 0; gx < COLS; gx++) poly([PT(gx, 0), PT(gx + 1, 0), PT(gx + 1, 0.7), PT(gx, 0.7)], 'rgba(10,5,25,.20)');
  for (let gy = 0; gy < ROWS; gy++) poly([PT(0, gy), PT(0.7, gy), PT(0.7, gy + 1), PT(0, gy + 1)], 'rgba(10,5,25,.20)');
  // ---- paredes ----
  parede('R', 0, COLS, 0, WH, pint.d); parede('L', 0, ROWS, 0, WH, pint.e);
  if (pint.tijolo) {
    ['R', 'L'].forEach(pl => { const n = pl === 'R' ? COLS : ROWS; for (let z = 4; z < WH; z += 4) { linhaParede(pl, 0, z, n, z, 'rgba(60,24,14,.55)'); for (let u = (z / 4) % 2 ? 0.5 : 0; u < n; u += 1) linhaParede(pl, u, z, u, z + 4, 'rgba(60,24,14,.45)'); } });
  } else {
    ['R', 'L'].forEach(pl => { const n = pl === 'R' ? COLS : ROWS; for (let u = 0.5; u < n; u += 1) linhaParede(pl, u, 20, u, WH, 'rgba(255,255,255,.05)'); });
  }
  parede('R', 0, COLS, 0, 18, pint.f); parede('L', 0, ROWS, 0, 18, tom(pint.f, -14));
  linhaParede('R', 0, 18, COLS, 18, pint.tr); linhaParede('L', 0, 18, ROWS, 18, tom(pint.tr, -25));
  linhaParede('R', 0, WH - 1, COLS, WH - 1, tom(pint.tr, -20)); linhaParede('L', 0, WH - 1, ROWS, WH - 1, tom(pint.tr, -35));
  { const a = PT(0, 0, 0), b = PT(0, 0, WH); lin(a[0], a[1], b[0], b[1], tom(pint.d, -50)); }
  // ---- janelas e porta (parede esquerda) ----
  const ceu = bucket === 0 ? ['#cfe8ff', '#9fd0ff', '#7fb8f0'] : bucket === 1 ? ['#ffe0b0', '#ffc58a', '#f09a6a'] : ['#6a4a8a', '#4a3a78', '#2a2860'];
  [[1.0, 3.0], [3.7, 5.3]].forEach(([v0, v1]) => {
    parede('L', v0 - 0.12, v1 + 0.12, 15, 45, '#2a1424');
    for (let k = 0; k < 3; k++) parede('L', v0, v1, 17 + k * 9, 26 + k * 9, ceu[k]);
    linhaParede('L', (v0 + v1) / 2, 17, (v0 + v1) / 2, 44, '#2a1424'); linhaParede('L', v0, 31, v1, 31, '#2a1424');
    parede('L', v0 - 0.12, v1 + 0.12, 13, 15, '#d8c8b0');
  });
  parede('L', 6.0, 7.2, 0, 38, '#2a1424'); parede('L', 6.1, 7.1, 0, 36, '#6a4a3a'); parede('L', 6.25, 6.95, 20, 33, ceu[0]);
  { const p = LW(6.95, 16); r(p[0] - 1, p[1], 2, 2, '#ffcc4d'); }
  // ---- parede direita: prateleira, quadro, cardápio, relógio, coifa ----
  parede('R', 0.7, 2.7, 33, 35, '#5a3a20');
  [[0.9, '#c97b63'], [1.2, '#e8d9b8'], [1.5, '#7a5a3a'], [1.8, '#7aa0a8'], [2.1, '#c97b63']].forEach(([u, c]) => { const p = RW(u, 35); r(p[0] - 2, p[1] - 8, 5, 8, c); r(p[0] - 2, p[1] - 8, 1, 8, tom(c, 30)); });
  const q = S.salao.decor.quadro;
  if (q !== 'nenhum') {
    parede('R', 2.95, 4.15, 24, 44, '#2a1424'); parede('R', 3.05, 4.05, 26, 42, q === 'cartaz' ? '#f2d89a' : q === 'abstrato' ? '#e8e4f0' : q === 'botanico' ? '#eaf0e0' : '#e8d0b0');
    const c = RW(3.55, 34);
    if (q === 'cartaz') { r(c[0] - 6, c[1] - 6, 12, 3, '#c0392b'); desenhaIcone(cx, 'espresso', c[0] - 6, c[1] - 3); }
    else if (q === 'abstrato') { r(c[0] - 6, c[1] - 6, 5, 8, '#2f6f88'); r(c[0] - 1, c[1] - 3, 6, 6, '#ffcc4d'); r(c[0] + 2, c[1] - 7, 3, 5, '#c0392b'); }
    else if (q === 'botanico') { r(c[0] - 1, c[1] - 7, 2, 12, '#3f7a4a'); r(c[0] - 5, c[1] - 5, 5, 3, '#52a860'); r(c[0] + 1, c[1] - 2, 5, 3, '#52a860'); r(c[0] - 4, c[1] + 1, 4, 2, '#52a860'); }
    else { r(c[0] - 4, c[1] - 6, 3, 3, '#5a3218'); r(c[0] + 1, c[1] - 6, 3, 3, '#5a3218'); r(c[0] - 5, c[1] - 2, 11, 7, '#a8384a'); }
  }
  parede('R', 4.5, 7.1, 22, 46, '#5a3a20'); parede('R', 4.65, 6.95, 24, 44, '#1e2a24');
  const itens = ['espresso', 'cappuccino'].concat(S.flags.mocha ? ['mocha'] : [], S.up.coador ? ['coado'] : [], ['pao']);
  itens.forEach((it, i) => { const p = RW(4.75, 41 - i * 4.4); desenhaIcone(cx, it, p[0] + 1, p[1] - 7); const l = RW(5.8, 41 - i * 4.4); r(l[0] - 2, l[1] - 3, 12 - (i % 2) * 4, 1, '#e8e4d4'); const pr = RW(6.8, 41 - i * 4.4); r(pr[0] - 3, pr[1] - 3, 5, 1, '#ffcc4d'); });
  { const p = RW(7.75, 40); elip(p[0], p[1], 6, 6, '#120a1e'); elip(p[0], p[1], 5, 5, '#f6f1e6'); lin(p[0], p[1], p[0], p[1] - 3, '#120a1e'); lin(p[0], p[1], p[0] + 2, p[1], '#120a1e'); }
  parede('R', 8.2, 10.3, 36, 51, '#8a92a4'); parede('R', 8.3, 10.2, 37, 49, '#a8b0c0');
  // ---- bancada de trás e equipamentos ----
  const MD = { t: '#d8c4a0', l: '#8a5a34', r: '#6a4226' };
  caixa(0.1, 0.0, 10.7, 1.15, 14, 0, MD);
  for (let u = 0.6; u < 10.5; u += 1.3) { const a = PT(0.1 + u, 1.15, 12), b = PT(0.1 + u, 1.15, 1); lin(a[0], a[1], b[0], b[1], '#5a3a20'); }
  sombraIso(1.2, 0.2, 0.9, 0.7, 20, 0.2);
  // moedor
  if (S.up.moedor) { caixa(1.3, 0.25, 0.8, 0.7, 11, 14, { t: '#a8b0c0', l: '#7a8498', r: '#5a6478' }); caixa(1.42, 0.37, 0.56, 0.46, 6, 25, { t: '#f0d8a8', l: '#c8a870', r: '#a08850' }); r(PT(1.7, 0.95, 20)[0], PT(1.7, 0.95, 20)[1], 3, 2, '#ff6e6e'); }
  else { caixa(1.3, 0.3, 0.7, 0.6, 9, 14, MAT.madeira); caixa(1.4, 0.4, 0.5, 0.4, 5, 23, { t: '#f0d8a8', l: '#c8a870', r: '#a08850' }); caixa(1.6, 0.5, 0.12, 0.12, 5, 28, MAT.preto, { ol: false }); }
  // máquina de espresso
  const mq = S.up.maquina > 1;
  caixa(3.0, 0.2, mq ? 2.2 : 1.8, 0.85, 14, 14, { t: '#d0d8e0', l: '#9aa4b0', r: '#6a7480' });
  caixa(3.1, 0.3, mq ? 2.0 : 1.6, 0.3, 4, 28, { t: '#e8eef4', l: '#b8c4d0', r: '#8a96a4' });
  { const a = PT(3.5, 1.05, 22); r(a[0] - 2, a[1], 4, 4, '#3a3a40'); if (mq) { const b = PT(4.6, 1.05, 22); r(b[0] - 2, b[1], 4, 4, '#3a3a40'); } const c = PT(3.5, 1.05, 18); r(c[0] - 2, c[1], 4, 3, '#f6f1e6'); }
  // vaporizador + chocolate
  caixa(5.3, 0.25, 1.0, 0.7, 9, 14, { t: '#c8d4e0', l: '#7a92ac', r: '#5a7490' });
  { const a = PT(5.8, 1.0, 22); r(a[0] - 1, a[1], 2, 8, '#aab4c0'); r(a[0] - 4, a[1] + 8, 8, 6, '#d8dee8'); r(a[0] - 4, a[1] + 8, 8, 1, '#f6f1e6'); const c = PT(5.55, 0.5, 23); r(c[0], c[1] - 5, 5, 5, '#5a2c14'); r(c[0], c[1] - 6, 5, 1, '#8a4a24'); }
  // coador artesanal
  if (S.up.coador) { caixa(7.0, 0.3, 0.7, 0.6, 5, 14, MAT.madeira); const a = PT(7.35, 0.6, 27); r(a[0] - 4, a[1] - 4, 8, 3, '#e8dcc0'); r(a[0] - 3, a[1] - 1, 6, 3, '#e8dcc0'); r(a[0] - 1, a[1] + 2, 2, 3, '#e8dcc0'); const k = PT(7.7, 0.45, 22); r(k[0], k[1] - 6, 6, 6, '#6a7088'); r(k[0] + 5, k[1] - 5, 3, 1, '#6a7088'); }
  // forno
  caixa(8.35, 0.1, 1.9, 1.0, 20, 14, { t: '#60606e', l: '#44444e', r: '#2e2e36' });
  { const a = PT(8.55, 1.1, 30), b = PT(10.0, 1.1, 30), c = PT(10.0, 1.1, 18), d = PT(8.55, 1.1, 18); poly([a, b, c, d], '#1c1c24'); const a2 = PT(8.65, 1.1, 28), b2 = PT(9.9, 1.1, 28), c2 = PT(9.9, 1.1, 20), d2 = PT(8.65, 1.1, 20); poly([a2, b2, c2, d2], '#3a2a2a'); }
  // plantas do canto
  const pl = S.salao.decor.planta;
  if (pl !== 'nenhuma') {
    const p = PT(0.9, 8.2, 0), x = p[0], y = p[1];
    sombraIso(0.55, 7.9, 0.7, 0.7, 14, 0.25);
    if (pl === 'cacto') { caixa(0.6, 7.95, 0.6, 0.6, 7, 0, { t: '#d8d8e0', l: '#aaaab8', r: '#80808e' }); r(x - 2, y - 22, 5, 15, '#3f9a5a'); r(x - 6, y - 17, 4, 3, '#3f9a5a'); r(x - 6, y - 20, 3, 6, '#3f9a5a'); r(x + 3, y - 15, 4, 3, '#3f9a5a'); r(x + 5, y - 19, 3, 6, '#3f9a5a'); }
    else { caixa(0.55, 7.9, 0.7, 0.7, 9, 0, { t: '#c8705a', l: '#a8564a', r: '#843e36' }); const gde = pl === 'monstera'; [[-8, -20, 6], [3, -24, 7], [-3, -30, 7], [7, -16, 6], [-11, -13, 5]].forEach(([dx, dy, n]) => { r(x + dx, y + dy - (gde ? 6 : 0), n + 2, n, gde ? '#2f8a4a' : '#46a852'); r(x + dx, y + dy - (gde ? 6 : 0), n + 2, 1, gde ? '#52b868' : '#6cc872'); }); r(x - 1, y - 28, 2, 18, '#2f7a3a'); }
  }
}
function fundo(bucket) {
  const key = [S.salao.decor.parede, S.salao.decor.piso, S.salao.decor.quadro, S.salao.decor.planta, S.up.coador, S.up.moedor, S.up.maquina, S.flags.mocha, bucket].join('|');
  if (fundoCv && fundoKey === key) return fundoCv;
  const c = document.createElement('canvas'); c.width = CW; c.height = CH;
  const prev = cx; cx = c.getContext('2d');
  try { desenhaSala(bucket); } finally { cx = prev; }
  fundoCv = c; fundoKey = key; return c;
}
