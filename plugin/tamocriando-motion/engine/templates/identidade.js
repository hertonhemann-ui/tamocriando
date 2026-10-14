/* Identidade: quem está falando */
(function (root) {
  'use strict';
  var TC = root.TC, E = TC.ease;

  TC.register({
    id: 'lower-third',
    name: 'Nome e Cargo',
    category: 'identidade',
    duration: 5,
    minDur: 2.5,
    thumb: 2.4,
    description: 'Círculo em brasa com a chama + nome, cargo e slogan em fonte mono. O rodapé do teu carrossel virado lower third.',
    uso: 'Primeiros 5 segundos de quem fala (tu, cliente, convidado). Em entrevista de cliente, vira prova social com nome e cara.',
    params: [
      { key: 'nome', label: 'Nome', type: 'text', fromBrand: 'nome', default: 'HERTON DO NOVO MKT' },
      { key: 'cargo', label: 'Cargo', type: 'text', fromBrand: 'cargo', default: 'ESTRATEGISTA QUE O MERCADO DIGITAL ELIMINOU' },
      { key: 'slogan', label: 'Slogan (opcional)', type: 'text', fromBrand: 'slogan', default: 'O NOVO MKT É SER REAL.' },
      { key: 'lado', label: 'Lado', type: 'select', options: ['esq', 'dir'], default: 'esq' }
    ],
    draw: function (S, t) {
      var c = S.c, w = S.w, h = S.h, col = S.col, p = S.p, D = S.dur;
      var u = S.u * (S.vertical ? 1.15 : 1.1);
      var R = 58 * u;
      var nameS = 36 * u, cargoS = 22 * u, sloS = 22 * u;
      S.font('mono', nameS, 700); var nW = S.measure(p.nome, 2 * u);
      S.font('mono', cargoS, 400); var cW = S.measure(p.cargo, 1.5 * u);
      S.font('mono', sloS, 700); var sW = p.slogan ? S.measure(p.slogan, 1.5 * u) + 34 * u : 0;
      var textW = Math.max(nW, cW, sW);
      var maxText = w - S.safe.side * 2 - R * 2 - 80 * u;
      if (textW > maxText) {
        var k = maxText / textW;
        nameS *= k; cargoS *= k; sloS *= k; textW = maxText;
      }
      var panelH = R * 2 + 24 * u;
      var panelW = R * 2 + 30 * u + textW + 48 * u;
      var right = p.lado === 'dir';
      var x = right ? w - S.safe.side - panelW : S.safe.side;
      var cy = S.vertical ? h * 0.72 : h * 0.82;
      var y = cy - panelH / 2;
      var ccx = right ? x + panelW - panelH / 2 : x + panelH / 2;

      var circIn = E.outBack(TC.seg(t, 0, 0.45), 2);
      var circOut = E.inBack(TC.seg(t, D - 0.22, D));
      var grow = TC.ramp(t, 0.2, 0.75) * (1 - TC.ramp(t, D - 0.48, D - 0.15, E.inExpo));
      var curW = panelH + (panelW - panelH) * grow;

      c.save();
      if (grow > 0) {
        c.save(); S.shadow(0.7);
        S.fillRRect(right ? x + panelW - curW : x, y, curW, panelH, panelH / 2, TC.rgba(col.panel, 0.94));
        c.restore();
      }
      var cs = circIn * (1 - circOut);
      if (cs > 0) {
        c.save();
        c.translate(ccx, cy); c.scale(cs, cs);
        c.fillStyle = col.accent; c.beginPath(); c.arc(0, 0, R, 0, Math.PI * 2); c.fill();
        // chama "viva"
        var fl = 1 + 0.05 * Math.sin(t * 11) + 0.03 * Math.sin(t * 23 + 1);
        var badge = S.brand.badge || 'flame';
        S.icon(badge, 0, 4 * u, R * 1.1, col.dark, { sy: badge === 'flame' ? fl : 1, sx: badge === 'flame' ? 2 - fl : 1, inner: badge === 'flame' ? col.accent2 : null, stroke: badge === 'hex', lineWidth: 0.14 });
        c.restore();
      }

      // textos com wipe
      var tx = right ? x + 40 * u : x + panelH + 22 * u;
      var lines = [
        { s: p.nome, size: nameS, wgt: 700, sp: 2 * u, col: col.ink, y: p.slogan ? cy - 18 * u : cy - 4 * u, t0: 0.45 },
        { s: p.cargo, size: cargoS, wgt: 400, sp: 1.5 * u, col: col.muted, y: p.slogan ? cy + 18 * u : cy + 30 * u, t0: 0.55 }
      ];
      if (p.slogan) lines.push({ s: p.slogan, size: sloS, wgt: 700, sp: 1.5 * u, col: col.accent2, y: cy + 52 * u, t0: 0.65, icon: true });
      lines[0].y -= 6 * u;
      for (var i = 0; i < lines.length; i++) {
        var L = lines[i];
        if (!L.s) continue;
        var kin = TC.ramp(t, L.t0, L.t0 + 0.5);
        var kout = TC.ramp(t, D - 0.62 + i * 0.04, D - 0.4 + i * 0.04, E.inCubic);
        var vis = kin * (1 - kout);
        if (vis <= 0) continue;
        S.font('mono', L.size, L.wgt);
        var lw = S.measure(L.s, L.sp) + (L.icon ? 34 * u : 0);
        c.save();
        S.clipRect(tx - 4 * u, L.y - L.size - 6 * u, (lw + 10 * u) * vis, L.size * 1.6);
        var lx = tx;
        if (L.icon) { S.brandIcon(lx + 11 * u, L.y - L.size * 0.36, L.size * 1.05, col.accent); lx += 34 * u; }
        S.text(L.s, lx, L.y, { color: L.col, spacing: L.sp });
        c.restore();
      }
      c.restore();
    }
  });
})(typeof window !== 'undefined' ? window : this);
