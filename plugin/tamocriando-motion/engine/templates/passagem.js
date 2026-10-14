/* Passagens: cobrem a tela inteira no meio, o corte fica escondido ali */
(function (root) {
  'use strict';
  var TC = root.TC;

  // cobre acelerando até o corte e descobre desacelerando (espelho da mesma curva)
  function cover(S, tn) { return S.ein(TC.seg(tn, 0, 0.5)); }
  function uncover(S, tn) { return 1 - S.ein(1 - TC.seg(tn, 0.5, 1)); }

  // ------------------------------------------------------------------
  // Queima — a tela vira carvão e depois se desfaz em cinza
  // ------------------------------------------------------------------
  TC.register({
    id: 'queima',
    name: 'Queima',
    category: 'passagem',
    duration: 1.6,
    minDur: 0.9,
    thumb: 0.62,
    cut: 0.5,
    curves: { entrada: [0.55, 0, 0.9, 0.45] },
    description: 'A imagem pega fogo a partir de dois cantos, a borda acesa avança até tudo virar carvão, e o carvão se desfaz em cinza revelando o próximo clipe.',
    uso: 'Virada forte de assunto, ou o fim de uma ideia que tu quer deixar pra trás. O meio da passagem cai em cima do corte.',
    params: [
      { key: 'origem', label: 'Fogo começa', type: 'select', options: ['cantos', 'centro', 'baixo'], default: 'cantos' }
    ],
    draw: function (S, t) {
      var c = S.c, u = S.u, w = S.w, h = S.h, col = S.col, p = S.p, D = S.dur;
      var tn = t / D;
      var from1 = p.origem === 'centro' ? [[0.5, 0.5]] : p.origem === 'baixo' ? [[0.5, 1.05]] : [[0.05, 0.95], [0.95, 0.08]];
      var L = S.layer('queima', w, h);
      S.into(L, function () { S.paper(col.ink, { dark: true }); });
      var F, P2;
      // borda de papel queimando: halo largo e borrado + faixa acesa (nada de linha fina)
      function edgeGlow(F, a) {
        c.save();
        S.blur(18 * u);
        S.drawGlow(F, a);
        S.drawGlow(F, a * 0.7);
        c.restore();
        S.drawGlow(F, a * 0.9);
      }
      if (tn < 0.5) {
        F = S.field({ from: from1, noise: 0.32, scale: 0.75, P: cover(S, tn) * 1.03, edge: 0.03, res: 0.3, seed: 21 });
        S.applyKeep(L, F, true);
        c.drawImage(L, 0, 0);
        edgeGlow(F, 0.9);
      } else {
        P2 = uncover(S, tn) * 1.1 - 0.02;
        F = S.field({ from: [[0.5, 0.45]], noise: 0.38, scale: 0.8, P: P2, edge: 0.028, char: 0.12, res: 0.3, seed: 22 });
        S.applyKeep(L, F);
        S.applyChar(L, F, 0.9);
        c.drawImage(L, 0, 0);
        edgeGlow(F, 0.6);
        // cinza caindo da borda que se desfaz
        var r = TC.rng(9);
        c.save();
        for (var i = 0; i < 160; i++) {
          var fx = r() * w, fy = r() * h;
          var f = S.fieldAt(F, fx, fy);
          if (f > P2) continue;
          var age = (P2 - f) * D * 0.9;
          if (age > 0.6) continue;
          c.globalAlpha = (1 - age / 0.6) * 0.85;
          c.fillStyle = i % 3 ? col.ash : TC.mixHex(col.ash, col.ink, 0.4);
          c.fillRect(fx + Math.sin(i) * age * 30 * u, fy + age * age * 500 * u, 5 * u, 3.5 * u);
        }
        c.restore();
      }
    }
  });

  // ------------------------------------------------------------------
  // Sopro — uma rajada de cinza atravessa a tela
  // ------------------------------------------------------------------
  TC.register({
    id: 'sopro',
    name: 'Sopro',
    category: 'passagem',
    duration: 1.4,
    minDur: 0.8,
    thumb: 0.7,
    cut: 0.5,
    curves: { entrada: [0.55, 0, 0.9, 0.45] },
    description: 'Uma rajada de fumaça e cinza entra por um lado, cobre a tela e sai pelo outro, com algumas fagulhas no meio.',
    uso: 'Passagem mais leve que a queima: troca de cena dentro do mesmo assunto, ou antes de revelar algo que estava escondido.',
    params: [
      { key: 'direcao', label: 'Direção', type: 'select', options: ['esquerda→direita', 'direita→esquerda', 'baixo→cima'], default: 'esquerda→direita' }
    ],
    draw: function (S, t) {
      var c = S.c, u = S.u, w = S.w, h = S.h, col = S.col, p = S.p, D = S.dur;
      var tn = t / D;
      var dir = p.direcao === 'direita→esquerda' ? [-1, 0.15] : p.direcao === 'baixo→cima' ? [0.1, -1] : [1, -0.15];
      var F1 = S.field({ dir: dir, noise: 0.5, scale: 0.7, P: cover(S, tn) * 1.12 - 0.04, soft: 0.07, res: 0.15, seed: 31 });
      var L = S.layer('sopro', w, h);
      S.into(L, function (lc) {
        lc.fillStyle = col.ink; lc.fillRect(0, 0, w, h);
        S.mottle(0.55, col.ash);
        S.grain(0.12, true);
      });
      S.applyKeep(L, F1, true);
      if (tn > 0.5) {
        var F2 = S.field({ dir: dir, noise: 0.5, scale: 0.7, P: uncover(S, tn) * 1.12 - 0.04, soft: 0.07, res: 0.15, seed: 32 });
        S.applyKeep(L, F2);
      }
      c.drawImage(L, 0, 0);
      var gust = Math.sin(TC.clamp(tn, 0, 1) * Math.PI);
      S.ash({ count: 90, seed: 41, mode: 'blow', wind: (dir[0] >= 0 ? 1 : -1) * 1400, alpha: gust, scale: 1.2, area: { x: dir[0] >= 0 ? -w * 0.6 : w * 0.1, y: 0, w: w * 1.5, h: h } });
      S.sparks({ count: 10, seed: 43, alpha: gust * 0.8 });
      void u;
    }
  });
})(typeof window !== 'undefined' ? window : this);
