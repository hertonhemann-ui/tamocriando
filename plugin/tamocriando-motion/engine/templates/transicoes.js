/* Transições: cobrem a tela inteira no meio — o corte fica escondido ali */
(function (root) {
  'use strict';
  var TC = root.TC, E = TC.ease;

  // ------------------------------------------------------------------
  // Varrida Brasa — três camadas diagonais + raio no meio
  // ------------------------------------------------------------------
  TC.register({
    id: 'transicao-brasa',
    name: 'Varrida Brasa',
    category: 'transicao',
    duration: 1.3,
    minDur: 0.8,
    thumb: 0.62,
    cut: 0.46,
    description: 'Três faixas diagonais (ferrugem, brasa, carvão) cruzam a tela, o raio pisca no centro e tudo sai pro outro lado.',
    uso: 'Troca de assunto ou de cena. Coloca a transição de forma que o MEIO dela caia exatamente no corte entre os dois clipes.',
    params: [
      { key: 'direcao', label: 'Direção', type: 'select', options: ['esquerda→direita', 'direita→esquerda'], default: 'esquerda→direita' },
      { key: 'raio', label: 'Raio no meio', type: 'select', options: ['sim', 'não'], default: 'sim' }
    ],
    draw: function (S, t) {
      var c = S.c, w = S.w, h = S.h, col = S.col, p = S.p, D = S.dur;
      var tn = t / D * 1.3;
      var slant = Math.min(h * 0.32, w * 0.5);
      c.save();
      if (p.direcao === 'direita→esquerda') { c.translate(w, 0); c.scale(-1, 1); }
      var colors = [col.inkOnPaper, col.accent, col.dark];
      for (var i = 0; i < 3; i++) {
        var lead = E.inOutCubic(TC.seg(tn, i * 0.1, 0.5 + i * 0.08));
        var trail = E.inOutCubic(TC.seg(tn, 0.6 + (2 - i) * 0.08, 1.06 + (2 - i) * 0.08));
        var Lx = TC.lerp(-slant, w + slant, lead), Tx = TC.lerp(-slant, w + slant, trail);
        if (Lx <= Tx) continue;
        c.beginPath();
        c.moveTo(Tx, 0); c.lineTo(Lx, 0); c.lineTo(Lx - slant, h); c.lineTo(Tx - slant, h); c.closePath();
        c.fillStyle = colors[i]; c.fill();
      }
      c.restore();
      if (p.raio !== 'não') {
        var bk = TC.seg(tn, 0.52, 0.8);
        if (bk > 0 && bk < 1) {
          var s = E.outBack(TC.clamp(bk * 2, 0, 1), 2.5) * (1 - E.inCubic(TC.seg(bk, 0.6, 1)));
          c.save();
          c.shadowColor = TC.rgba(col.accent, 0.9); c.shadowBlur = 50 * S.u;
          S.brandIcon(w / 2, h / 2, 220 * S.u * s, col.accent);
          c.restore();
        }
      }
    }
  });

  // ------------------------------------------------------------------
  // Blocos — fragmentos que se organizam e se desfazem
  // ------------------------------------------------------------------
  TC.register({
    id: 'transicao-blocos',
    name: 'Blocos',
    category: 'transicao',
    duration: 1.3,
    minDur: 0.8,
    thumb: 0.65,
    cut: 0.5,
    description: 'A tela é coberta por blocos em onda diagonal e depois eles somem na mesma ordem. "Organizo o que os outros fragmentam."',
    uso: 'Entre blocos de conteúdo ou antes de uma revelação. Mais calma que a varrida — combina com assunto denso.',
    params: [
      { key: 'origem', label: 'Começa de', type: 'select', options: ['canto', 'centro'], default: 'canto' }
    ],
    draw: function (S, t) {
      var c = S.c, w = S.w, h = S.h, col = S.col, p = S.p, D = S.dur;
      var tn = t / D * 1.3;
      var cols = S.vertical ? 6 : S.wide ? 10 : 7;
      var ts = w / cols;
      var rows = Math.ceil(h / ts);
      var r = TC.rng(13);
      var palette = [col.dark, col.dark, col.dark, col.panel, col.panel, col.accent];
      var maxD = 0.35;
      for (var y = 0; y < rows; y++) {
        for (var x = 0; x < cols; x++) {
          var pick = palette[Math.floor(r() * palette.length)];
          var d;
          if (p.origem === 'centro') {
            var dx = (x + 0.5) / cols - 0.5, dy = (y + 0.5) / rows - 0.5;
            d = Math.min(1, Math.sqrt(dx * dx + dy * dy) / 0.7071) * maxD;
          } else {
            d = ((x / (cols - 1 || 1)) + (y / (rows - 1 || 1))) / 2 * maxD;
          }
          var kin = E.outCubic(TC.seg(tn, d, d + 0.3));
          var kout = E.inCubic(TC.seg(tn, 0.65 + d, 0.95 + d));
          var s = kin * (1 - kout);
          if (s <= 0) continue;
          var cx = x * ts + ts / 2, cy = y * ts + ts / 2;
          var half = ts * 0.51 * s;
          c.fillStyle = pick;
          c.fillRect(cx - half, cy - half, half * 2, half * 2);
        }
      }
    }
  });
})(typeof window !== 'undefined' ? window : this);
