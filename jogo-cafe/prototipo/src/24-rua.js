/* ================= RUA ================= */
function cenaRua(t) {
  const noite = S.fase === 'noite' || S.fase === 'fechamento';
  const oy = 60; // empurra a rua para baixo: o céu ocupa o topo
  const faixas = noite ? ['#090a22', '#100f34', '#1b1748', '#2a2060', '#3a2a74'] : ['#6aa8e8', '#8fc4f4', '#bfe2ff', '#ffe0b0', '#ffc58a'];
  faixas.forEach((c, i) => { const y0 = Math.round(i * 130 / 5); r(0, y0, CW, 27, c); if (i) dither(0, y0 - 5, CW, 10, faixas[i - 1], c, k => k, 'faixa' + i + (noite ? 'n' : 'd')); });
  r(0, 130, CW, CH - 130, noite ? '#25213a' : '#5a5560');
  if (noite) { for (let i = 0; i < 60; i++) { const sx = (i * 73) % CW, sy = (i * 37) % 110; if ((Math.floor(t * 2) + i) % 9) r(sx, sy, 1, 1, i % 5 ? '#fff' : '#ffe08a'); } r(330, 18, 10, 10, '#f3eedc'); r(333, 18, 7, 7, '#0e1030'); luz(334, 23, 30, 'rgba(200,210,255,A)', 0.15); }
  else { r(48, 26, 14, 14, '#fff3b0'); r(50, 24, 10, 18, '#fff3b0'); r(46, 28, 18, 10, '#fff3b0'); luz(55, 33, 40, 'rgba(255,240,180,A)', 0.4); const nx = (t * 4) % (CW + 60) - 60; r(nx, 34, 30, 6, '#ffffff'); r(nx + 6, 30, 16, 4, '#ffffff'); r(nx + 120 > CW ? nx - 240 : nx + 120, 50, 24, 5, '#fff5ea'); }
  cx.save(); cx.translate(0, oy);
  for (let i = 0; i < 14; i++) r(i * 28, 40 + (i * 13) % 16, 26, 60, noite ? '#1e1844' : '#d79c86');
  const jan = noite ? '#ffd56b' : '#8fb7d8';
  const predio = (x, w, h, cor, telhado) => {
    r(x, 128 - h, w, h, cor); r(x + w - 4, 128 - h, 4, h, tom(cor, -30)); r(x - 2, 128 - h - 4, w + 4, 4, telhado);
    for (let yy = 128 - h + 6; yy < 114; yy += 11) for (let xx = x + 5; xx < x + w - 8; xx += 11) { const acesa = noite ? (xx * 7 + yy) % 5 > 1 : true; r(xx, yy, 6, 6, '#120a1e'); r(xx + 1, yy + 1, 4, 4, acesa ? jan : '#3a3260'); if (noite && acesa) luz(xx + 3, yy + 3, 9, 'rgba(255,200,100,A)', 0.18); }
  };
  predio(4, 46, 62, noite ? '#5a3f6a' : '#c97b63', '#3b2a40');                        // casa
  predio(52, 46, 54, noite ? '#4a5a6a' : '#7aa0a8', '#2c3a44'); r(56, 92, 38, 6, '#e8d9b8'); // fornecedor
  predio(99, 46, 50, noite ? '#6a4a70' : '#c88a5a', '#3b2a40');                       // móveis
  r(103, 94, 38, 22, '#120a1e'); r(104, 95, 36, 20, noite ? '#ffd56b' : '#bfe2ff');
  r(110, 104, 10, 3, '#a8723e'); r(110, 107, 2, 8, '#a8723e'); r(118, 107, 2, 8, '#a8723e'); r(122, 98, 12, 4, '#a8384a'); r(124, 102, 8, 12, '#a8384a');
  predio(150, 66, 70, noite ? '#7a4a3a' : '#b5653f', '#4a2a1a');                      // café
  for (let i = 0; i < 11; i++) r(150 + i * 6, 76, 6, 7, i % 2 ? '#f3eedc' : '#c0392b');
  r(166, 92, 34, 20, noite ? '#ffd56b' : '#e8d9b8'); r(180, 96, 10, 32, '#4a2a1a'); if (noite) luz(184, 102, 40, 'rgba(255,190,90,A)', 0.4);
  r(222, 102, 44, 26, '#3f7a3a'); r(228, 80, 12, 22, '#2f6a2a'); r(224, 84, 22, 12, '#4f9a44'); r(250, 82, 14, 18, '#4f9a44'); r(254, 100, 3, 10, '#5a3a20'); r(233, 100, 3, 10, '#5a3a20'); r(236, 114, 20, 3, '#7a5a3a');
  predio(272, 46, 52, noite ? '#3a4a3a' : '#9a8a5a', '#2a2a1a'); r(276, 86, 38, 7, noite ? '#ff6b9a' : '#d24a6a'); if (noite) luz(295, 90, 30, 'rgba(255,90,150,A)', 0.3);
  predio(324, 58, 66, noite ? '#1f3f34' : '#2f7a5f', '#173027'); r(328, 74, 48, 7, '#e8d9b8');
  r(0, 128, CW, 7, noite ? '#4a4466' : '#b8aaa0'); r(0, 135, CW, 25, noite ? '#211d36' : '#5a5560');
  for (let x = 4; x < CW; x += 28) r(x, 146, 14, 2, noite ? '#6a6488' : '#e8e0d0');
  [60, 140, 262, 330].forEach(px => { r(px, 98, 2, 30, '#2a2340'); r(px - 3, 96, 8, 3, '#2a2340'); r(px - 2, 99, 6, 2, noite ? '#fff2b0' : '#bbb'); if (noite) { luz(px + 1, 102, 34, 'rgba(255,230,150,A)', 0.35); cx.save(); cx.globalAlpha = 0.12; cx.fillStyle = '#ffe9a0'; cx.beginPath(); cx.moveTo(px - 2, 101); cx.lineTo(px + 4, 101); cx.lineTo(px + 18, 135); cx.lineTo(px - 16, 135); cx.fill(); cx.restore(); } });
  const lx = LOCAIS[S.local] ? LOCAIS[S.local].x : 183;
  sprite(lx, 134, PERS.voce, { bob: t * 3 });
  cx.restore();
  if (noite) { cx.save(); cx.globalAlpha = 0.2; cx.fillStyle = '#1a1050'; cx.fillRect(0, 0, CW, CH); cx.restore(); }
}
