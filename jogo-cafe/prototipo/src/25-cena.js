/* ================= CENA DO CAFÉ (2.5D) ================= */
let glowCv = null, vigCv = null;
function glowSprite() {
  if (glowCv) return glowCv;
  const c = document.createElement('canvas'); c.width = 96; c.height = 48; const g = c.getContext('2d');
  g.save(); g.translate(48, 24); g.scale(1, 0.5);
  const gr = g.createRadialGradient(0, 0, 0, 0, 0, 48); gr.addColorStop(0, 'rgba(255,190,110,.55)'); gr.addColorStop(1, 'rgba(255,190,110,0)');
  g.fillStyle = gr; g.fillRect(-48, -48, 96, 96); g.restore(); return (glowCv = c);
}
function vinheta() {
  if (vigCv) return vigCv;
  const c = document.createElement('canvas'); c.width = CW; c.height = CH; const g = c.getContext('2d');
  const gr = g.createRadialGradient(CW / 2, CH / 2, CH * 0.38, CW / 2, CH / 2, CW * 0.62); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(5,0,15,.5)');
  g.fillStyle = gr; g.fillRect(0, 0, CW, CH); return (vigCv = c);
}
const LAMPADAS = [[2.2, 3.4], [5.4, 3.4], [8.6, 3.4], [4.0, 6.4], [8.0, 6.4]];
const MESA_COR = { t: '#e8d8bc', l: '#8a5734', r: '#6a4024' };

function balaoPedido(x, y, itens, tipo) {
  const w = Math.max(1, itens.length) * 13 + 3, bx = Math.round(x - w / 2);
  r(bx - 1, y - 1, w + 2, 15, '#120a1e'); r(bx, y, w, 13, '#fbf6e6'); r(Math.round(x) - 1, y + 13, 3, 2, '#fbf6e6');
  if (tipo === '?') { r(bx + w / 2 - 3, y + 2, 6, 2, '#c0392b'); r(bx + w / 2 + 1, y + 4, 2, 3, '#c0392b'); r(bx + w / 2 - 1, y + 6, 3, 2, '#c0392b'); r(bx + w / 2 - 1, y + 10, 2, 2, '#c0392b'); }
  else itens.forEach((it, i) => desenhaIcone(cx, it, bx + 2 + i * 13, y + 1));
}
function barraPeq(x, y, k, cor) { r(x - 8, y, 16, 3, '#120a1e'); r(x - 7, y + 1, Math.round(14 * clamp(k, 0, 1)), 1, cor); }
function desenhaCliente(c, t) {
  const p = c.pers || { pele: c.pele, cabelo: c.cabelo, roupa: c.cor, estilo: c.estilo };
  const x = isoX(c.gx, c.gy), y = isoY(c.gx, c.gy);
  const sentado = c.estado === 'sentado' || c.estado === 'espera' || c.estado === 'comendo';
  let alpha = 1; if (c.idade < 0.35) alpha = c.idade / 0.35; if (c.estado === 'saindo') alpha = clamp(Math.hypot(c.gx - PORTA.x, c.gy - PORTA.y) / 1.0, 0, 1);
  const k2 = c.pacMax > 900 ? 1 : clamp(c.pac / c.pacMax, 0, 1);
  const andando = c.estado === 'andando' || c.estado === 'saindo';
  sprite(x, y, p, { andando, bob: andando ? t * 12 : t * 1.6, semPernas: sentado, feliz: (c.estado === 'saindo' && c.feliz) || c.estado === 'comendo', bravo: !andando && c.estado !== 'comendo' && k2 < 0.3, flip: c.dir < 0, alpha });
  if (c.estado === 'saindo' || c.estado === 'andando') return;
  const by = y - 46;
  if (c.estado === 'sentado') { balaoPedido(x, by, [], '?'); barraPeq(x, by - 6, k2, k2 > 0.5 ? '#72e09a' : k2 > 0.25 ? '#ffcc4d' : '#ff6e6e'); }
  else if (c.estado === 'balcao' || c.estado === 'espera') {
    const falta = c.ped.filter((_, i) => !c.ok[i]); balaoPedido(x, by, falta, 'itens');
    barraPeq(x, by - 6, k2, k2 > 0.5 ? '#72e09a' : k2 > 0.25 ? '#ffcc4d' : '#ff6e6e');
    if (podeEntregar(c)) r(x - 1, by - 12 + Math.round(Math.sin(t * 8) * 1.5), 3, 3, '#72e09a');
  } else if (c.estado === 'comendo') barraPeq(x, y - 30, 1 - c.comerT / c.comerMax, '#ff93c9');
}
function desenhaAtor(a, p, t, extra = {}) {
  const x = isoX(a.x, a.y), y = isoY(a.x, a.y);
  const mov = a.fase === 'indo';
  sprite(x, y, p, Object.assign({ avental: '#f3eedc', andando: mov, bob: mov ? a.passo * 13 : a.fase === 'agindo' ? t * 16 : t * 1.6, flip: a.dir < 0 }, extra));
  if (a.carga && a.carga.length) { const w = a.carga.length * 13 + 3, bx = Math.round(x - w / 2); r(bx - 1, y - 51, w + 2, 15, '#120a1e'); r(bx, y - 50, w, 13, '#fff'); a.carga.forEach((it, i) => desenhaIcone(cx, it, bx + 2 + i * 13, y - 49)); }
  if (a.fase === 'agindo' && a.timed && a.dur > 0) barraPeq(x, y - 31, a.t / a.dur, '#aaf0ff');
}
function desenhaMesaCompleta(g, t) {
  desenhaMesa(g);
  const zTop = g.modelo === 'alta' ? 19 : 13;
  seatsDe(g.i).forEach(l => {
    const px = g.tx + (l.gx - g.tx) * 0.55, py = g.ty + (l.gy - g.ty) * 0.55, p = PT(px, py, zTop);
    const c = l.cid && cli(l.cid);
    if (l.estado === 'sujo') { desenhaIcone(cx, 'espresso', p[0] - 6, p[1] - 11); r(p[0] - 4, p[1] - 1, 7, 1, 'rgba(90,50,20,.7)'); }
    else if (c && c.estado === 'comendo') desenhaIcone(cx, c.ped[0] === 'pao' ? 'pao' : c.ped[0], p[0] - 6, p[1] - 11);
  });
  if (seatsDe(g.i).some(l => l.estado === 'sujo') && Math.floor(t * 2) % 2) { const p = PT(g.tx, g.ty, 34); r(p[0] - 2, p[1] - 6, 4, 8, '#ffa64d'); r(p[0] - 2, p[1] + 4, 4, 3, '#ffa64d'); }
}
let grainCv = null;
function grao() {
  if (grainCv) return grainCv;
  const c = document.createElement('canvas'); c.width = 64; c.height = 64; const g = c.getContext('2d');
  for (let i = 0; i < 64 * 64 * 0.55; i++) { g.fillStyle = Math.random() > 0.5 ? 'rgba(255,255,255,.10)' : 'rgba(0,0,0,.12)'; g.fillRect(Math.random() * 64 | 0, Math.random() * 64 | 0, 1, 1); }
  return (grainCv = cx.createPattern(c, 'repeat'));
}
const GRADE = [[0, [255, 247, 230]], [0.5, [255, 232, 196]], [0.8, [255, 196, 168]], [1, [146, 156, 222]]];
function corGrade(k) {
  for (let i = 1; i < GRADE.length; i++) if (k <= GRADE[i][0]) { const [k0, c0] = GRADE[i - 1], [k1, c1] = GRADE[i], f = (k - k0) / (k1 - k0); return c0.map((v, j) => Math.round(v + (c1[j] - v) * f)); }
  return GRADE[GRADE.length - 1][1];
}
const GATO = { gx: 1.2, gy: 8.2 };
function desenhaGato(t) {
  const x = Math.round(isoX(GATO.gx, GATO.gy)), y = Math.round(isoY(GATO.gx, GATO.gy));
  const rabo = Math.round(Math.sin(t * 2.2) * 2), pisca = (Math.floor(t * 0.7) % 5 === 0) && (t % 1.4 < 0.15);
  const laranja = '#e8913a', escuro = '#a85a1c', claro = '#f8c070', ol = '#5a2e10';
  r(x - 6, y - 1, 13, 1, 'rgba(8,4,22,.3)');
  r(x - 5, y - 8, 10, 8, ol); r(x - 4, y - 7, 8, 7, laranja); r(x - 4, y - 7, 3, 7, claro); r(x + 2, y - 7, 2, 7, escuro);
  r(x - 2, y - 5, 1, 4, escuro); r(x + 0, y - 6, 1, 5, escuro);
  r(x + 5 + (rabo > 0 ? 1 : 0), y - 5 + rabo, 3, 2, laranja); r(x + 7 + (rabo > 0 ? 1 : 0), y - 7 + rabo, 1, 3, escuro);
  r(x - 4, y - 13, 8, 7, ol); r(x - 3, y - 12, 6, 6, laranja); r(x - 4, y - 15, 2, 3, ol); r(x + 2, y - 15, 2, 3, ol); r(x - 3, y - 14, 1, 2, '#e89a8a'); r(x + 2, y - 14, 1, 2, '#e89a8a');
  if (pisca) { r(x - 2, y - 9, 2, 1, ol); r(x + 1, y - 9, 2, 1, ol); } else { r(x - 2, y - 10, 1, 2, '#3a8a3a'); r(x + 1, y - 10, 1, 2, '#3a8a3a'); r(x - 2, y - 10, 1, 1, '#0a0a0a'); r(x + 1, y - 10, 1, 1, '#0a0a0a'); }
  r(x - 1, y - 8, 2, 1, '#e08a8a');
}
function cenaCafe(t) {
  const emExp = S.fase === 'expediente' && R;
  const tarde = emExp ? clamp(R.t / R.len, 0, 1) : (S.fase === 'pos' ? 1 : 0.15);
  const bucket = tarde < 0.5 ? 0 : tarde < 0.85 ? 1 : 2;
  cx.drawImage(fundo(bucket), 0, 0);
  // luz da janela no chão
  cx.save(); cx.globalCompositeOperation = 'lighter';
  const aj = 0.13 * (1 - tarde * 0.75);
  [[1.0, 3.0], [3.7, 5.3]].forEach(([v0, v1]) => poly([PT(0, v0), PT(0, v1), PT(3.4, v1 + 1.8), PT(3.4, v0 + 1.8)], `rgba(255,236,190,${aj})`));
  cx.restore();
  // sombras projetadas de tudo que se mexe ou fica no salão (um só passe, sem escurecer duas vezes)
  comSombras(() => {
    for (let j = 0; j < 8; j++) sombraVolume(BALCAO.x0 + j, BALCAO.y0, 1, BALCAO.d, BALCAO.h);
    S.salao.mesas.forEach((m, i) => { const g = geoMesa(i); if (!g) return; sombraLaje(g.tx - g.w / 2, g.ty - g.d / 2, g.w, g.d, g.modelo === 'alta' ? 18 : 12); g.seats.forEach(s0 => sombraVolume(s0.gx - 0.32, s0.gy - 0.32, 0.64, 0.64, g.cad.tipo === 'poltrona' ? 14 : 9)); });
    if (R) { R.clientes.forEach(c => sombraPessoa(c.gx, c.gy, c.estado === 'sentado' || c.estado === 'espera' || c.estado === 'comendo' ? 14 : 22)); sombraPessoa(R.jog.x, R.jog.y); if (R.bia) sombraPessoa(R.bia.x, R.bia.y); if (S.dia === 1 && S.fase === 'expediente') sombraPessoa(7.4, 2.1); }
    else sombraPessoa(4.6, 2.0);
    sombraVolume(GATO.gx - 0.25, GATO.gy - 0.25, 0.5, 0.5, 9);
  }, 0.42);
  const ents = [];
  ents.push({ k: GATO.gx + GATO.gy, f: () => desenhaGato(t) });
  // balcão da frente em segmentos (para ordenar com clientes e com quem fica atrás)
  for (let j = 0; j < 8; j++) {
    const gx = BALCAO.x0 + j;
    ents.push({ k: gx + 0.5 + BALCAO.y0 + BALCAO.d / 2, f: () => {
      caixa(gx, BALCAO.y0, 1, BALCAO.d, BALCAO.h, 0, { t: '#ecdcc0', l: '#8a5734', r: '#6a4024' });
      const a = PT(gx + 0.5, BALCAO.y0 + BALCAO.d, BALCAO.h - 2), b = PT(gx + 0.5, BALCAO.y0 + BALCAO.d, 1); lin(a[0], a[1], b[0], b[1], '#5a3218');
      const top = PT(gx + 0.5, BALCAO.y0 + BALCAO.d / 2, BALCAO.h);
      if (j === 0) { r(top[0] - 7, top[1] - 8, 12, 7, '#120a1e'); r(top[0] - 6, top[1] - 7, 10, 6, '#4a4a56'); r(top[0] - 5, top[1] - 6, 6, 2, '#72e09a'); }
      else if (R && R.bandeja[j - 1]) { const it = R.bandeja[j - 1]; elip(top[0], top[1], 8, 3, 'rgba(10,5,25,.3)'); desenhaIcone(cx, it.r, top[0] - 6, top[1] - 11); if (it.p) { r(top[0] + 3, top[1] - 12, 3, 3, '#ffcc4d'); r(top[0] + 4, top[1] - 13, 1, 5, '#ffcc4d'); } }
    } });
  }
  // mesas, cadeiras e clientes
  const mesasG = S.salao.mesas.map((m, i) => geoMesa(i)).filter(Boolean);
  mesasG.forEach(g => {
    ents.push({ k: g.tx + g.ty, f: () => desenhaMesaCompleta(g, t) });
    g.seats.forEach(s => ents.push({ k: s.gx + s.gy - 0.12, f: () => desenhaCadeira(g.cad, s.gx, s.gy, s.lado) }));
  });
  if (R) R.clientes.forEach(c => {
    const sent = c.estado === 'sentado' || c.estado === 'espera' || c.estado === 'comendo';
    ents.push({ k: c.gx + c.gy + (sent ? 0.06 : 0.02), f: () => desenhaCliente(c, t) });
  });
  if (R) {
    ents.push({ k: R.jog.x + R.jog.y + 0.03, f: () => desenhaAtor(R.jog, PERS.voce, t) });
    if (R.bia) ents.push({ k: R.bia.x + R.bia.y + 0.03, f: () => desenhaAtor(R.bia, PERS.bia, t) });
    if (S.dia === 1 && S.fase === 'expediente') ents.push({ k: 7.4 + 2.1, f: () => sprite(isoX(7.4, 2.1), isoY(7.4, 2.1), PERS.cida, { avental: '#f3eedc', bob: t * 1.5, feliz: true }) });
  } else ents.push({ k: 4.6 + 2.0, f: () => sprite(isoX(4.6, 2.0), isoY(4.6, 2.0), PERS.voce, { avental: '#f3eedc', bob: t * 2 }) });
  ents.sort((a, b) => a.k - b.k).forEach(e => e.f());
  // fumaça da máquina e do forno
  if (R) {
    if (R.slots.some(s => s.rec && s.st === 'rodando' && s.recurso === 'maq')) { const p = PT(3.8, 0.9, 30); for (let i = 0; i < 4; i++) r(p[0] - 5 + i * 3 + Math.round(Math.sin(t * 4 + i) * 1.5), p[1] - ((t * 22 + i * 5) % 20), 2, 2, 'rgba(255,255,255,.75)'); }
    if (R.forno.st === 'assando') { const p = PT(9.3, 1.1, 24); luz(p[0], p[1], 34, 'rgba(255,140,50,A)', 0.4); }
  }
  // correção de cor (multiplica: sombras ficam frias, luzes por cima ficam quentes)
  { const [rr, gg, bb] = corGrade(tarde); cx.save(); cx.globalCompositeOperation = 'multiply'; cx.fillStyle = `rgb(${rr},${gg},${bb})`; cx.fillRect(0, 0, CW, CH); cx.restore(); }
  // luzes aditivas: lâmpadas, pisca-pisca, forno
  const forca = 0.3 + 0.55 * tarde;
  LAMPADAS.forEach(([gx, gy]) => {
    const p = PT(gx, gy, 44), top = PT(gx, gy, 62), chao = PT(gx, gy, 0);
    lin(p[0], p[1], top[0], top[1], '#1a0e18'); r(p[0] - 5, p[1], 10, 3, '#2a1424'); r(p[0] - 3, p[1] - 3, 6, 3, '#3a2034'); r(p[0] - 2, p[1] + 3, 4, 2, '#fff2b0');
    cx.save(); cx.globalCompositeOperation = 'lighter'; cx.globalAlpha = forca; cx.drawImage(glowSprite(), chao[0] - 48, chao[1] - 24); cx.restore();
    luz(p[0], p[1] + 4, 22, 'rgba(255,214,140,A)', 0.30 + 0.3 * tarde);
  });
  fioPontos().forEach((p, i) => { if (i % 3 === 0) luz(p[0], p[1] + 2, 13, 'rgba(255,224,150,A)', 0.22 + 0.4 * tarde); });
  if (R && R.forno.st === 'assando') { const p = PT(9.3, 1.1, 24); luz(p[0], p[1], 38, 'rgba(255,140,50,A)', 0.45); }
  if (tarde > 0.85) { const p = PT(5.0, 4.0, 30); cx.save(); cx.globalCompositeOperation = 'lighter'; cx.globalAlpha = 0.2; cx.drawImage(glowSprite(), p[0] - 48, p[1] - 24); cx.restore(); }
  cx.save(); cx.translate(Math.floor(Math.random() * 64), Math.floor(Math.random() * 64)); cx.fillStyle = grao(); cx.globalAlpha = 0.32; cx.fillRect(-64, -64, CW + 64, CH + 64); cx.restore();
  cx.save(); cx.globalAlpha = 0.65; cx.drawImage(vinheta(), 0, 0); cx.restore();
  if (R && R.hover) desenhaHover(R.hover, t);
}
function desenhaHover(h, t) {
  const pulso = 0.6 + 0.4 * Math.sin(t * 8), col = `rgba(255,236,120,${pulso})`;
  if (h.tipo === 'mesa') { const g = geoMesa(h.i); if (!g) return; const x0 = g.tx - g.w / 2 - 0.1, y0 = g.ty - g.d / 2 - 0.1, A = PT(x0, y0), B = PT(x0 + g.w + 0.2, y0), C = PT(x0 + g.w + 0.2, y0 + g.d + 0.2), D = PT(x0, y0 + g.d + 0.2); [[A, B], [B, C], [C, D], [D, A]].forEach(([p, q]) => lin(p[0], p[1], q[0], q[1], col)); }
  else if (h.tipo === 'est') { const e = EST[h.id], p = PT(e.cx, e.cy, 22), w = h.id === 'forno' ? 24 : h.id === 'maquina' ? 22 : 14; [[-w, -16], [w - 3, -16], [-w, 12], [w - 3, 12]].forEach(([dx, dy]) => { r(p[0] + dx, p[1] + dy, 3, 1, col); r(p[0] + dx, p[1] + dy, 1, 3, col); }); }
  else if (h.tipo === 'cliente') { const c = cli(h.id); if (!c) return; const x = isoX(c.gx, c.gy), y = isoY(c.gx, c.gy) - 66; r(x - 3, y, 7, 1, col); r(x - 2, y + 1, 5, 1, col); r(x - 1, y + 2, 3, 1, col); r(x, y + 3, 1, 1, col); }
}
/* ---- clique e passagem do mouse na cena ---- */
function hitCena(px, py) {
  if (!R || !R.rodando) return null;
  for (const c of balcaoLista()) { const x = isoX(c.gx, c.gy), y = isoY(c.gx, c.gy); if (px >= x - 10 && px <= x + 10 && py >= y - 54 && py <= y + 2) return { tipo: 'cliente', id: c.id }; }
  for (let i = 0; i < S.salao.mesas.length; i++) {
    const g = geoMesa(i); if (!g) continue;
    const x = isoX(g.tx, g.ty), y = isoY(g.tx, g.ty, 12) - 6, rx = g.def.lugares === 4 ? 56 : 38, ry = g.def.lugares === 4 ? 34 : 32;
    if (((px - x) / rx) ** 2 + ((py - y) / ry) ** 2 <= 1) return { tipo: 'mesa', i };
  }
  for (const id in EST) { if (id === 'coador' && !S.up.coador) continue; const e = EST[id], x = isoX(e.cx, e.cy), y = isoY(e.cx, e.cy, 26), w = id === 'forno' || id === 'maquina' ? 24 : 16; if (Math.abs(px - x) <= w && Math.abs(py - y) <= 18) return { tipo: 'est', id }; }
  return null;
}
function ptCena(e) { const b = cv.getBoundingClientRect(); return [(e.clientX - b.left) * CW / b.width, (e.clientY - b.top) * CH / b.height]; }
cv.addEventListener('pointermove', e => { if (!R || !R.rodando) { cv.style.cursor = 'default'; return; } const h = hitCena(...ptCena(e)); R.hover = h; cv.style.cursor = h ? 'pointer' : 'default'; });
cv.addEventListener('pointerleave', () => { if (R) R.hover = null; cv.style.cursor = 'default'; });
cv.addEventListener('pointerdown', e => {
  if (!R || !R.rodando || R.pausa) return;
  const pt = ptCena(e), gxp = isoX(GATO.gx, GATO.gy), gyp = isoY(GATO.gx, GATO.gy);
  if (Math.abs(pt[0] - gxp) < 10 && pt[1] > gyp - 18 && pt[1] < gyp + 2) { if (!R.gatoT || performance.now() - R.gatoT > 2500) { R.gatoT = performance.now(); S.animo += 1.5; flutuaEm('♥ miau', GATO.gx, GATO.gy - 0.4, '#ff93c9'); sfx('miau'); } return; }
  const h = hitCena(...pt); if (!h) return;
  if (h.tipo === 'cliente') { const c = cli(h.id); if (c) agirCliente(R.jog, c); }
  else if (h.tipo === 'mesa') agirMesa(R.jog, h.i);
  else agirEstacao(R.jog, h.id);
});
