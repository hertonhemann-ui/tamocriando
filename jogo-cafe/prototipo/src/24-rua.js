/* ================= RUA (vista de cima em perspectiva, estilo Stardew) ================= */
let ruaCv = null, ruaKey = '';
const RUA_Y = 192; // onde o personagem pisa na praça
let RUA_JAN = [], RUA_POSTES = [], RUA_FUMACA = [];
function arvore(x, y, s, noiteMix) {
  // sombra projetada para a direita
  poly([[x - 3 * s, y], [x + 4 * s, y - 2 * s], [x + 24 * s, y + 3 * s], [x + 14 * s, y + 7 * s], [x - 2 * s, y + 4 * s]], 'rgba(10,25,10,.34)');
  r(x - 2 * s, y - 12 * s, 4 * s, 12 * s, '#4a2e1c'); r(x - 2 * s, y - 12 * s, 1 * s, 12 * s, '#6a4428'); r(x + 1 * s, y - 12 * s, 1 * s, 12 * s, '#35200f');
  const blobs = [[0, -26, 15], [-9, -20, 11], [9, -20, 11], [-5, -33, 11], [6, -31, 10], [0, -40, 9]];
  blobs.forEach(([dx, dy, rr]) => elip(x + dx * s, y + dy * s, Math.round(rr * s), Math.round(rr * s * 0.82), '#1f5a2c'));
  blobs.forEach(([dx, dy, rr]) => elip(x + (dx - 1) * s, y + (dy - 2) * s, Math.round(rr * s * 0.82), Math.round(rr * s * 0.66), '#2f8a3c'));
  blobs.forEach(([dx, dy, rr]) => elip(x + (dx - 3) * s, y + (dy - 5) * s, Math.round(rr * s * 0.5), Math.round(rr * s * 0.38), '#58b452'));
  for (let k = 0; k < 16; k++) { const a = rh(Math.round(x), k, 3) * 6.28, d = rh(Math.round(x), k, 4) * 18 * s; r(x + Math.cos(a) * d, y - 28 * s + Math.sin(a) * d * 0.8, 2, 1, k % 2 ? '#7acc66' : '#1a4a24'); }
}
function casaTop(x, w, hF, hR, par, tel, o = {}) {
  const yB = 150, yF = yB - hF, yR = yF - hR;
  poly([[x + w, yB - 6], [x + w + (hF + hR) * 0.75, yB - 3], [x + w + (hF + hR) * 0.75, yB + 9], [x + w, yB + 9]], 'rgba(10,20,10,.38)'); // sombra no chão
  // fachada
  r(x, yF, w, hF, tom(par, -80)); r(x + 1, yF, w - 2, hF - 1, par); r(x + 1, yF, 4, hF - 1, tom(par, 22)); r(x + w - 5, yF, 4, hF - 1, tom(par, -34));
  if (o.tijolo) { for (let yy = yF + 3; yy < yB - 4; yy += 4) { r(x + 1, yy, w - 2, 1, tom(par, -40)); for (let xx = x + 3 + ((yy / 4) % 2) * 3; xx < x + w - 2; xx += 6) r(xx, yy, 1, 4, tom(par, -40)); } }
  else for (let xx = x + 6; xx < x + w - 2; xx += 5) r(xx, yF + 1, 1, hF - 3, tom(par, -26));
  r(x, yB - 4, w, 4, '#6a6a76'); r(x, yB - 4, w, 1, '#9a9aa8'); // base de pedra
  // telhado visto de cima
  poly([[x - 4, yF + 1], [x + w + 4, yF + 1], [x + w - 4, yR], [x + 4, yR]], tom(tel, -55));
  poly([[x - 3, yF], [x + w + 3, yF], [x + w - 4, yR + 1], [x + 4, yR + 1]], tel);
  for (let yy = yR + 3; yy < yF; yy += 3) { const f = (yy - yR) / hR, xl = x + 4 - f * 7, xr = x + w - 4 + f * 7; r(xl, yy, xr - xl, 1, tom(tel, -30)); for (let xx = xl + ((yy / 3) % 2) * 3; xx < xr; xx += 6) r(xx, yy + 1, 1, 2, tom(tel, -30)); }
  poly([[x - 3, yF], [x + 8, yF], [x + 9, yR + 1], [x + 4, yR + 1]], tom(tel, 28));
  r(x - 4, yF, w + 8, 2, tom(tel, -70)); r(x - 4, yF + 2, w + 8, 3, 'rgba(0,0,0,.3)'); // beiral e sombra na fachada
  r(x + 4, yR, w - 8, 2, tom(tel, -70));
  if (o.chamine) { const cx0 = x + w - 12; r(cx0, yR - 8, 7, 12, '#6a5a52'); r(cx0, yR - 8, 2, 12, '#8a7a72'); r(cx0 - 1, yR - 10, 9, 3, '#4a3a34'); RUA_FUMACA.push([cx0 + 3, yR - 11]); }
  // porta e janelas
  const dx = x + (o.portaX !== undefined ? o.portaX : Math.round(w / 2) - 5);
  r(dx - 1, yB - 24, 12, 24, tom(par, -90)); r(dx, yB - 23, 10, 23, '#5a3a24'); r(dx, yB - 23, 3, 23, '#7a5234'); r(dx + 7, yB - 12, 2, 2, '#ffcc4d'); r(dx + 2, yB - 20, 6, 6, '#9fd0ff'); r(dx + 5, yB - 20, 1, 6, '#5a3a24');
  r(dx - 2, yB - 1, 14, 2, '#7a7a88');
  (o.janelas || []).forEach(wx => { const jx = x + wx, jy = yF + 8; r(jx - 1, jy - 1, 12, 12, tom(par, -90)); r(jx, jy, 10, 10, '#9fd0ff'); r(jx, jy, 10, 3, '#cfe8ff'); r(jx + 4, jy, 2, 10, '#5a3a24'); r(jx, jy + 4, 10, 2, '#5a3a24'); r(jx - 2, jy + 10, 14, 2, tom(par, -50)); RUA_JAN.push([jx, jy, 10, 10]); });
  if (o.toldo) { for (let k = 0; k < Math.floor(w / 5); k++) { r(x + k * 5, yF + 18, 5, 8, k % 2 ? '#f3eedc' : o.toldo); r(x + k * 5, yF + 26, 5, 2, k % 2 ? '#d8d0c0' : tom(o.toldo, -40)); } r(x, yF + 18, w, 1, tom(o.toldo, 40)); }
  if (o.placa) { r(x + Math.round(w / 2) - 8, yF + 1, 16, 9, '#3a2418'); r(x + Math.round(w / 2) - 7, yF + 2, 14, 7, '#e8d9b8'); desenhaIcone(cx, o.placa, x + Math.round(w / 2) - 5, yF + 0); }
}
function pedras(x0, y0, x1, y1) {
  for (let yy = y0, row = 0; yy < y1; yy += 7, row++) for (let xx = x0 - (row % 2) * 6; xx < x1; ) {
    const w = 10 + Math.floor(rh(xx, yy, 1) * 6), base = rh(xx, yy, 2) > 0.5 ? '#c6a46c' : '#b8955c', c = tom(base, Math.round((rh(xx, yy, 3) - 0.5) * 14));
    const a = Math.max(xx, x0), b = Math.min(xx + w - 1, x1);
    if (b > a) { r(a, yy, b - a, 6, c); r(a, yy, b - a, 1, tom(c, 22)); r(a, yy + 5, b - a, 1, tom(c, -34)); if (xx >= x0) r(xx, yy, 1, 6, tom(c, -30)); }
    xx += w;
  }
}
function desenhaRuaEstatica() {
  RUA_JAN = []; RUA_FUMACA = []; RUA_POSTES = [];
  // grama texturizada
  r(0, 0, CW, CH, '#4f9a36');
  for (let y = 0; y < CH; y += 2) for (let x = 0; x < CW; x += 2) { const v = rh(x, y, 11); if (v > 0.9) r(x, y, 2, 1, '#62b044'); else if (v < 0.07) r(x, y, 2, 1, '#3d8029'); }
  for (let k = 0; k < 320; k++) { const x = Math.floor(rh(k, 1, 12) * CW), y = Math.floor(rh(k, 2, 12) * CH), c = rh(k, 3, 12) > 0.5 ? '#74c452' : '#357a26'; r(x, y, 1, 3, c); r(x + 2, y + 1, 1, 2, c); r(x - 2, y + 1, 1, 2, c); }
  // colina e cerca ao fundo
  for (let x = 0; x < CW; x += 3) { const h = 38 + Math.sin(x * 0.03) * 6 + rh(x, 1, 13) * 3; r(x, 0, 3, h, '#3f8a2e'); r(x, h - 2, 3, 2, '#58b040'); }
  for (let x = 4; x < CW; x += 14) { r(x, 46, 4, 18, '#5a3a22'); r(x, 46, 1, 18, '#7a5232'); } r(0, 51, CW, 3, '#6a4428'); r(0, 58, CW, 2, '#6a4428'); r(0, 51, CW, 1, '#8a6038');
  // pedras da praça e caminho
  pedras(0, 154, CW, 205);
  r(0, 150, CW, 4, '#7a7a86'); r(0, 150, CW, 1, '#a8a8b6'); r(0, 205, CW, 2, '#5a5a66');
  for (let x = 0; x < CW; x += 12) { r(x, 207, 5, 4, '#4a8a32'); r(x + 5, 206, 3, 5, '#62b044'); }
  // prédios
  casaTop(8, 40, 36, 28, '#d8895a', '#b0382c', { chamine: true, janelas: [6, 24], portaX: 15 });
  casaTop(56, 40, 36, 26, '#6fb0b0', '#4a6a96', { janelas: [4, 26], toldo: '#3a7a8a', placa: 'massa', portaX: 15 });
  casaTop(103, 40, 36, 26, '#e8b86e', '#82509a', { janelas: [4, 26], placa: 'espresso', portaX: 15 });
  casaTop(153, 60, 42, 32, '#c0683f', '#5e3a2a', { tijolo: true, chamine: true, toldo: '#c0392b', placa: 'espresso', portaX: 25, janelas: [6, 44] });
  casaTop(273, 44, 38, 26, '#a0a05e', '#3e5a40', { janelas: [4, 30], portaX: 17, placa: 'cappuccino' });
  casaTop(327, 48, 40, 28, '#42a280', '#1f5e4a', { chamine: true, janelas: [4, 34], toldo: '#e8d9b8', portaX: 19 });
  // letreiro rosa do bar
  r(280, 100, 30, 6, '#2a1424'); r(281, 101, 28, 4, '#ff6b9a'); RUA_JAN.push([281, 101, 28, 4]);
  // praça: fonte, bancos e árvores
  poly([[226, 176], [262, 176], [264, 188], [224, 188]], 'rgba(10,20,10,.3)');
  elip(244, 168, 17, 9, '#6a6a78'); elip(244, 167, 15, 7, '#9a9aa8'); elip(244, 168, 12, 5, '#4f9ad8'); elip(244, 167, 10, 4, '#7fc4f4'); r(243, 158, 3, 10, '#8a8a98'); r(241, 157, 7, 2, '#9a9aa8');
  [[10, 214, 1.2], [356, 218, 1.3], [222, 148, 1.0], [262, 146, 1.1]].forEach(([x, y, s]) => arvore(x, y, s));
  arvore(40, 30, 1.5); arvore(150, 36, 1.4); arvore(300, 34, 1.5); arvore(350, 44, 1.3);
  // bancos e postes
  [[205, 196], [286, 196]].forEach(([x, y]) => { r(x, y - 6, 14, 3, '#7a5232'); r(x, y - 3, 14, 2, '#5a3a22'); r(x + 1, y - 1, 2, 4, '#3a2418'); r(x + 11, y - 1, 2, 4, '#3a2418'); poly([[x + 14, y], [x + 24, y + 1], [x + 20, y + 4], [x + 12, y + 3]], 'rgba(10,20,10,.3)'); });
  [20, 100, 205, 285, 345].forEach(px => { RUA_POSTES.push([px, 172]); poly([[px + 2, 172], [px + 20, 177], [px + 18, 180], [px + 1, 175]], 'rgba(10,20,10,.3)'); r(px, 158, 3, 18, '#2a2340'); r(px - 3, 154, 9, 5, '#2a2340'); r(px - 2, 155, 7, 3, '#fff2b0'); r(px - 1, 176, 5, 2, '#1a1530'); });
  // canteiros e flores
  for (let k = 0; k < 50; k++) { const x = Math.floor(rh(k, 1, 20) * CW), y = 210 + Math.floor(rh(k, 2, 20) * 28); r(x, y, 2, 2, ['#ff93c9', '#ffd84a', '#ffffff', '#c8a0ff'][k % 4]); r(x, y + 2, 1, 2, '#2f7a26'); }
}
function ruaCamada(noite) {
  const key = (noite ? 'n' : 'd') + [S.salao.decor.parede].join('');
  if (ruaCv && ruaKey === key) return ruaCv;
  const c = document.createElement('canvas'); c.width = CW; c.height = CH;
  const prev = cx; cx = c.getContext('2d');
  try { desenhaRuaEstatica(); } finally { cx = prev; }
  ruaCv = c; ruaKey = key; return c;
}
function cenaRua(t) {
  const noite = S.fase === 'noite' || S.fase === 'fechamento';
  cx.drawImage(ruaCamada(noite), 0, 0);
  // sombras de nuvens passando (só de dia)
  if (!noite) { cx.save(); cx.globalAlpha = 0.09; for (let i = 0; i < 3; i++) { const nx = ((t * 6 + i * 150) % (CW + 160)) - 80; elip(nx, 70 + i * 55, 44, 18, '#102010'); elip(nx + 22, 76 + i * 55, 30, 12, '#102010'); } cx.restore(); }
  // jogador no local escolhido
  const lx = LOCAIS[S.local] ? LOCAIS[S.local].x : 183;
  poly([[lx - 3, RUA_Y], [lx + 4, RUA_Y - 1], [lx + 20, RUA_Y + 3], [lx + 13, RUA_Y + 5]], 'rgba(10,12,10,.4)');
  sprite(lx, RUA_Y, PERS.voce, { bob: t * 1.6 });
  // fumaça das chaminés
  RUA_FUMACA.forEach(([fx, fy], i) => { for (let k = 0; k < 4; k++) { const f = ((t * 0.5 + k * 0.25 + i * 0.13) % 1); cx.save(); cx.globalAlpha = (1 - f) * 0.55; elip(fx + f * 12 + Math.sin(t + k) * 2, fy - f * 24, 3 + Math.round(f * 3), 2 + Math.round(f * 2), noite ? '#8a90b0' : '#e8e8ee'); cx.restore(); } });
  // aves
  if (!noite) { const bx = ((t * 18) % (CW + 80)) - 40; for (let b = 0; b < 3; b++) { const x = bx - b * 14, y = 22 + b * 6 + Math.sin(t * 3 + b) * 2; r(x, y, 3, 1, '#2a2a3a'); r(x - 2, y - 1 + (Math.floor(t * 8 + b) % 2), 2, 1, '#2a2a3a'); r(x + 3, y - 1 + (Math.floor(t * 8 + b) % 2), 2, 1, '#2a2a3a'); } }
  // grade de cor e luzes
  const k = noite ? 0.95 : 0.1, [rr, gg, bb] = corGrade(k);
  cx.save(); cx.globalCompositeOperation = 'multiply'; cx.fillStyle = `rgb(${rr},${gg},${bb})`; cx.fillRect(0, 0, CW, CH); cx.restore();
  if (noite) {
    RUA_JAN.forEach(([x, y, w, h]) => { cx.save(); cx.globalCompositeOperation = 'lighter'; cx.fillStyle = 'rgba(255,205,110,.55)'; cx.fillRect(x, y, w, h); cx.restore(); luz(x + w / 2, y + h / 2, 20, 'rgba(255,190,100,A)', 0.30); });
    RUA_POSTES.forEach(([px, py]) => { luz(px + 1, 158, 46, 'rgba(255,224,150,A)', 0.55); cx.save(); cx.globalCompositeOperation = 'lighter'; cx.globalAlpha = 0.34; cx.drawImage(glowSprite(), px - 46, py - 20, 96, 48); cx.restore(); });
  }
  cx.save(); cx.translate(Math.floor(Math.random() * 64), Math.floor(Math.random() * 64)); cx.fillStyle = grao(); cx.globalAlpha = 0.28; cx.fillRect(-64, -64, CW + 64, CH + 64); cx.restore();
  cx.save(); cx.globalAlpha = 0.5; cx.drawImage(vinheta(), 0, 0); cx.restore();
}
