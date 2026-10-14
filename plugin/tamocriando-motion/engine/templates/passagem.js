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

  var smoothstep = function (a, b, x) { var k = TC.clamp((x - a) / (b - a), 0, 1); return k * k * (3 - 2 * k); };

  // ------------------------------------------------------------------
  // Clarão — vazamento de luz (light leak) que estoura no corte
  // ------------------------------------------------------------------
  TC.register({
    id: 'clarao',
    name: 'Clarão',
    category: 'passagem',
    duration: 1.0,
    minDur: 0.5,
    thumb: 0.33,
    cut: 0.5,
    curves: { entrada: [0.4, 0, 0.7, 0.3] },
    description: 'Manchas de luz quente entram pelas bordas, crescem e estouram em clarão no meio. Depois a luz se desfaz e o próximo clipe aparece.',
    uso: 'Passagem leve e quente: troca de cena dentro do mesmo assunto, ou um respiro depois de uma frase forte. O estouro cai em cima do corte.',
    params: [
      { key: 'cor', label: 'Cor da luz', type: 'select', options: ['brasa', 'papel'], default: 'brasa' }
    ],
    draw: function (S, t) {
      var c = S.c, u = S.u, w = S.w, h = S.h, col = S.col, p = S.p;
      var tn = t / S.dur, I = Math.pow(Math.sin(TC.clamp(tn, 0, 1) * Math.PI), 1.4);
      var warm = p.cor === 'papel' ? [col.paper, col.paperShade, col.paper] : [col.ember, col.glow, col.hot];
      var r = TC.rng(77), i;
      c.save();
      c.globalCompositeOperation = 'screen';
      for (i = 0; i < 6; i++) {
        var side = i % 4, bx = side === 0 ? -0.05 : side === 1 ? 1.05 : r(), by = side === 2 ? -0.05 : side === 3 ? 1.05 : r();
        var drift = (tn - 0.5) * (r() - 0.5) * 0.5;
        var cx = (bx + drift + (0.5 - bx) * I * 0.5) * w, cy = (by + drift * 0.6 + (0.5 - by) * I * 0.4) * h;
        var rad = (0.35 + r() * 0.5) * Math.max(w, h) * (0.35 + 0.9 * I);
        var g = c.createRadialGradient(cx, cy, 0, cx, cy, rad);
        g.addColorStop(0, TC.rgba(warm[1], 0.75 * I));
        g.addColorStop(0.35, TC.rgba(warm[0], 0.55 * I));
        g.addColorStop(1, TC.rgba(warm[0], 0));
        c.fillStyle = g;
        c.fillRect(0, 0, w, h);
      }
      c.restore();
      // o estouro: cobre tudo só por alguns quadros
      var flash = smoothstep(0.4, 0.5, tn) * (1 - smoothstep(0.5, 0.62, tn));
      if (flash > 0.002) {
        c.save();
        c.globalAlpha = flash;
        c.fillStyle = p.cor === 'papel' ? col.paper : TC.mixHex(col.glow, col.paper, 0.3);
        c.fillRect(0, 0, w, h);
        c.restore();
      }
      // grão de filme por cima da luz
      c.save(); c.globalAlpha = I * 0.6; S.grain(0.12, false); c.restore();
      void u;
    }
  });

  // ------------------------------------------------------------------
  // Varrida — whip pan: a imagem é arrastada de lado, com rastro
  // ------------------------------------------------------------------
  TC.register({
    id: 'varrida',
    name: 'Varrida',
    category: 'passagem',
    duration: 0.9,
    minDur: 0.5,
    thumb: 0.3,
    cut: 0.5,
    curves: { entrada: [0.6, 0, 0.9, 0.5] },
    description: 'Uma cortina de tinta com rastro horizontal atravessa a tela depressa, como um giro de câmera. O meio da passagem é tela cheia, o corte fica escondido ali.',
    uso: 'Troca de cena com energia, de preferência quando o movimento do clipe de saída e o do clipe de entrada vão na mesma direção. Combina com o desfoque de movimento ligado.',
    params: [
      { key: 'direcao', label: 'Direção', type: 'select', options: ['direita→esquerda', 'esquerda→direita'], default: 'direita→esquerda' },
      { key: 'fundo', label: 'Cortina', type: 'select', options: ['tinta', 'papel'], default: 'tinta' }
    ],
    draw: function (S, t) {
      var c = S.c, u = S.u, w = S.w, h = S.h, col = S.col, p = S.p;
      var tn = t / S.dur, cv = cover(S, tn), un = uncover(S, tn);
      var base = p.fundo === 'papel' ? col.paper : col.ink;
      var streak = p.fundo === 'papel' ? col.ash : col.ember;
      var edgeW = w * 0.5;
      c.save();
      if (p.direcao === 'esquerda→direita') { c.translate(w, 0); c.scale(-1, 1); }
      var cvr = tn < 0.5;
      // cobrindo: a borda de ataque anda pra esquerda, corpo sólido à direita dela
      // descobrindo: a borda de saída anda pra esquerda, corpo sólido à esquerda dela
      var xs = (w + edgeW) - (w + 2 * edgeW) * cv;
      var xe = (w + edgeW) - (w + 2 * edgeW) * un;
      var g;
      if (cvr) {
        c.fillStyle = base; c.fillRect(xs, 0, w + edgeW - xs, h);
        g = c.createLinearGradient(xs - edgeW, 0, xs, 0);
        g.addColorStop(0, TC.rgba(base, 0)); g.addColorStop(1, TC.rgba(base, 1));
        c.fillStyle = g; c.fillRect(xs - edgeW, 0, edgeW, h);
      } else {
        c.fillStyle = base; c.fillRect(-edgeW, 0, xe + edgeW, h);
        g = c.createLinearGradient(xe, 0, xe + edgeW, 0);
        g.addColorStop(0, TC.rgba(base, 1)); g.addColorStop(1, TC.rgba(base, 0));
        c.fillStyle = g; c.fillRect(xe, 0, edgeW, h);
      }
      // linhas de velocidade: faixas finas esticadas que correm junto com a borda
      var r = TC.rng(5), n = 30, k = Math.sin(TC.clamp(tn, 0, 1) * Math.PI);
      c.save();
      S.blur(1.5 * u);
      for (var i = 0; i < n; i++) {
        var y = r() * h, hh = (3 + r() * 16) * u, len = (0.3 + r() * 0.7) * w, off = (r() - 0.3) * 0.25 * w;
        var tone = i % 7 === 0 ? streak : (i % 2 ? col.paper : col.ash);
        var x0 = cvr ? xs - len + off : xe + off;
        var g2 = c.createLinearGradient(x0, 0, x0 + len, 0);
        g2.addColorStop(0, TC.rgba(tone, 0));
        g2.addColorStop(cvr ? 0.8 : 0.2, TC.rgba(tone, 0.55 * k));
        g2.addColorStop(1, TC.rgba(tone, 0));
        c.fillStyle = g2;
        c.fillRect(x0, y, len, hh);
      }
      c.restore();
      c.restore();
      void u;
    }
  });

  // ------------------------------------------------------------------
  // Rasgo — papel rasgado puxado pela tela
  // ------------------------------------------------------------------
  TC.register({
    id: 'rasgo',
    name: 'Rasgo',
    category: 'passagem',
    duration: 1.2,
    minDur: 0.7,
    thumb: 0.34,
    cut: 0.5,
    curves: { entrada: [0.5, 0, 0.8, 0.4] },
    description: 'Uma folha de papel é puxada pela tela com a borda rasgada, fibras brancas e sombra, cobre tudo no meio e sai do outro lado.',
    uso: 'Fechar um assunto e abrir outro, ou separar partes de um vídeo mais calmo. Mais físico e menos quente que a queima.',
    params: [
      { key: 'papel', label: 'Papel', type: 'select', options: ['papel', 'tinta'], default: 'papel' },
      { key: 'lado', label: 'Entra por', type: 'select', options: ['esquerda', 'direita', 'baixo'], default: 'esquerda' }
    ],
    draw: function (S, t) {
      var c = S.c, u = S.u, w = S.w, h = S.h, col = S.col, p = S.p;
      var tn = t / S.dur;
      var dir = p.lado === 'direita' ? [-1, 0.05] : p.lado === 'baixo' ? [0.05, -1] : [1, 0.05];
      var dark = p.papel === 'tinta';
      var L = S.layer('rasgo', w, h);
      S.into(L, function () { S.paper(dark ? col.ink : col.paper, { dark: dark }); });
      var opts = { dir: dir, noise: 0.16, scale: 4.5, edge: 0.01, char: 0.03, soft: 0.006, res: 0.4, glowColor: col.paperShade, charColor: dark ? col.ash : '#FFFFFF' };
      var F;
      if (tn < 0.5) {
        F = S.field(Object.assign({}, opts, { P: cover(S, tn) * 1.04 - 0.02, seed: 14 }));
        S.applyKeep(L, F, true);
      } else {
        F = S.field(Object.assign({}, opts, { P: uncover(S, tn) * 1.04 - 0.02, seed: 15 }));
        S.applyKeep(L, F);
      }
      S.applyChar(L, F, 0.95);
      c.save();
      S.shadow(1, 'rgba(10,8,6,0.55)');
      c.drawImage(L, 0, 0);
      c.restore();
      void u;
    }
  });

  // ------------------------------------------------------------------
  // Fatias — faixas que fecham a tela uma depois da outra
  // ------------------------------------------------------------------
  TC.register({
    id: 'fatias',
    name: 'Fatias',
    category: 'passagem',
    duration: 1.0,
    minDur: 0.5,
    thumb: 0.3,
    cut: 0.5,
    curves: { entrada: [0.55, 0, 0.9, 0.4] },
    description: 'Faixas de tinta deslizam uma depois da outra e fecham a tela inteira no meio, depois saem do outro lado na mesma ordem. Só a primeira faixa leva a borda em brasa.',
    uso: 'Troca de cena seca e organizada, tipo corte de pauta: de um ponto pro seguinte, de um tópico pro outro.',
    params: [
      { key: 'faixas', label: 'Quantidade de faixas', type: 'number', min: 3, max: 16, default: 7 },
      { key: 'eixo', label: 'Faixas', type: 'select', options: ['horizontais', 'verticais'], default: 'horizontais' }
    ],
    draw: function (S, t) {
      var c = S.c, u = S.u, w = S.w, h = S.h, col = S.col, p = S.p;
      var tn = t / S.dur, n = Math.max(3, Math.round(Number(p.faixas) || 7));
      var vert = p.eixo === 'verticais';
      var W = vert ? h : w, H = vert ? w : h;
      var bh = H / n;
      c.save();
      if (vert) { c.translate(w, 0); c.rotate(Math.PI / 2); }
      var cv = cover(S, tn), un = uncover(S, tn);
      for (var i = 0; i < n; i++) {
        var d = (i / Math.max(1, n - 1)) * 0.5;
        var y = i * bh - 0.5, hh = bh + 1;
        var x0, x1;
        if (tn < 0.5) { var ki = TC.clamp((cv - d) / 0.5, 0, 1); x0 = 0; x1 = W * ki; }
        else { var ku = TC.clamp((un - d) / 0.5, 0, 1); x0 = W * ku; x1 = W; }
        if (x1 - x0 < 0.5) continue;
        c.fillStyle = col.ink;
        c.fillRect(x0, y, x1 - x0, hh);
        if (i === 0) {
          c.fillStyle = col.ember;
          var ex = tn < 0.5 ? x1 - 5 * u : x0;
          c.fillRect(ex, y, 5 * u, hh);
        }
      }
      c.restore();
      c.save(); c.globalAlpha = 0.5; S.grain(0.08, true); c.restore();
    }
  });
})(typeof window !== 'undefined' ? window : this);
