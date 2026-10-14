/* Argumento: estruturas de raciocínio (comparar, desmontar, sequenciar, perguntar) */
(function (root) {
  'use strict';
  var TC = root.TC, E = TC.ease;

  function itemsOf(str) {
    var s = String(str || '');
    return TC.splitList(s.indexOf('\n') >= 0 ? s : s.replace(/,/g, '\n'));
  }

  // fundo de cartela que entra subindo e sai empurrando pra cima
  function cardBg(S, t, color, dark) {
    var c = S.c, h = S.h, D = S.dur;
    var inK = TC.ramp(t, 0, 0.55), outK = TC.ramp(t, D - 0.55, D, E.inExpo);
    c.beginPath(); c.rect(0, h * (1 - inK) - h * outK, S.w, h); c.clip();
    c.translate(0, -h * outK * 0.3);
    c.fillStyle = color; c.fillRect(0, 0, S.w, h);
    S.grain(dark ? 0.06 : 0.12, dark);
  }

  // ------------------------------------------------------------------
  // Eu ≠ Mercado — comparativo que risca um lado
  // ------------------------------------------------------------------
  TC.register({
    id: 'comparativo',
    name: 'Eu ≠ Mercado',
    category: 'argumento',
    duration: 7,
    minDur: 4.5,
    thumb: 5.0,
    description: 'Título com ≠ desenhado, o lado do mercado entra e é riscado, o teu lado entra com raios.',
    uso: 'Posicionamento por contraste. Mostrar o que tu NÃO é deixa claro o que tu é — sem precisar falar mal de ninguém.',
    params: [
      { key: 'titulo', label: 'Título (use ≠)', type: 'text', default: 'eu ≠ mercado' },
      { key: 'ladoA', label: 'Lado A (riscado)', type: 'text', default: 'MERCADO FALA DE:' },
      { key: 'itensA', label: 'Itens do lado A (um por linha)', type: 'textarea', default: 'Marketing\nConteúdo\nRedes sociais' },
      { key: 'ladoB', label: 'Lado B (o teu)', type: 'text', default: 'EU FALO DE:' },
      { key: 'itensB', label: 'Itens do lado B (um por linha)', type: 'textarea', default: 'Comunicação estratégica\nClareza como ativo\nPosicionamento como estrutura' },
      { key: 'fundo', label: 'Fundo', type: 'select', options: ['cartela', 'painel'], default: 'cartela' }
    ],
    draw: function (S, t) {
      var c = S.c, u = S.u, w = S.w, h = S.h, col = S.col, p = S.p, D = S.dur;
      var A = itemsOf(p.itensA), B = itemsOf(p.itensB);
      c.save();
      var box;
      if (p.fundo === 'painel') {
        var inK = TC.ramp(t, 0, 0.55), outK = TC.ramp(t, D - 0.45, D, E.inCubic);
        box = S.vertical ? { x: 50 * u, y: h * 0.13, w: w - 100 * u, h: h * 0.66 } : { x: w * 0.08, y: h * 0.1, w: w * 0.84, h: h * 0.8 };
        c.globalAlpha = 1 - outK;
        c.translate(0, (1 - inK) * 60 * u + outK * 30 * u);
        c.save(); S.alpha(inK); S.shadow(0.9);
        S.fillRRect(box.x, box.y, box.w, box.h, 34 * u, TC.rgba(col.panel, 0.96));
        c.restore();
      } else {
        cardBg(S, t, col.dark, true);
        box = S.vertical ? { x: 0, y: h * 0.1, w: w, h: h * 0.74 } : { x: 0, y: h * 0.06, w: w, h: h * 0.88 };
      }

      // título com ≠
      var parts = String(p.titulo || '').split('≠');
      var tSize = S.vertical ? 170 * u : 130 * u;
      S.font('display', tSize, 400);
      var neqW = parts.length > 1 ? tSize * 1.0 : 0;
      var pw = parts.map(function (x) { return S.measure(x.trim()); });
      var totalW = pw.reduce(function (a, b) { return a + b; }, 0) + neqW;
      var maxTW = box.w * 0.84;
      if (totalW > maxTW) { tSize *= maxTW / totalW; S.font('display', tSize, 400); pw = parts.map(function (x) { return S.measure(x.trim()); }); neqW = parts.length > 1 ? tSize * 1.0 : 0; totalW = pw.reduce(function (a, b) { return a + b; }, 0) + neqW; }
      var cap = S.capH();
      var wide = !S.vertical;
      var pad = wide ? box.w * 0.06 : 80 * u;
      var colW = wide ? (box.w - pad * 3) / 2 : box.w - pad * 2;
      function sizeFor(list, weight, base) {
        S.font('sans', base, weight);
        var mw = 0;
        for (var j = 0; j < list.length; j++) mw = Math.max(mw, S.measure(list[j]));
        var avail = colW - (weight === 800 ? 60 * u : 0);
        return mw > avail ? base * avail / mw : base;
      }
      var sA = sizeFor(A, 600, wide ? 46 * u : 64 * u);
      var sB = sizeFor(B, 800, wide ? 48 * u : 64 * u);
      var stepA = sA * 1.45, stepB = sB * 1.5;
      var labSize = wide ? 26 * u : 32 * u;
      var gapT = (wide ? 110 : 130) * u;
      var blockA = 30 * u + A.length * stepA;
      var blockB = 30 * u + B.length * stepB;
      var contentH = cap + gapT + (wide ? Math.max(blockA, blockB) : blockA + 140 * u + blockB);
      var tBase = box.y + Math.max(50 * u, (box.h - contentH) / 2) + cap;
      S.font('display', tSize, 400);
      var tx = w / 2 - totalW / 2;
      for (var i = 0; i < parts.length && i < 2; i++) {
        var k = TC.ramp(t, 0.3 + i * 0.25, 0.95 + i * 0.25);
        c.save();
        S.clipRect(tx - 10 * u, tBase - cap - 20 * u, pw[i] + 20 * u, cap + 50 * u);
        S.text(parts[i].trim(), tx, tBase + (1 - k) * cap * 1.9, { color: col.ink });
        c.restore();
        tx += pw[i];
        if (i === 0 && parts.length > 1) {
          S.notEqual(tx + neqW / 2, tBase - cap * 0.45, tSize * 0.85, col.accent, E.outCubic(TC.seg(t, 0.55, 1.25)));
          tx += neqW;
        }
      }

      var aX = box.x + pad, bX = wide ? box.x + pad * 2 + colW : aX;
      var aTop = tBase + gapT;

      // lado A
      var la = TC.ramp(t, 0.9, 1.3);
      c.save(); S.alpha(la);
      S.font('mono', labSize, 700);
      S.text(String(p.ladoA || '').toLocaleUpperCase('pt-BR'), aX, aTop, { color: col.muted, spacing: 3 * u });
      c.restore();
      S.font('sans', sA, 600);
      var capA = S.capH();
      for (var a = 0; a < A.length; a++) {
        var ka = TC.ramp(t, 1.05 + a * 0.15, 1.6 + a * 0.15);
        var strike = E.inOutCubic(TC.seg(t, 2.1 + a * 0.18, 2.5 + a * 0.18));
        var yA = aTop + 30 * u + (a + 1) * stepA;
        c.save(); S.alpha(ka * (1 - 0.5 * strike));
        S.font('sans', sA, 600);
        S.text(A[a], aX, yA + (1 - ka) * 18 * u, { color: col.ink });
        c.restore();
        if (strike > 0) {
          var iw = (S.font('sans', sA, 600), S.measure(A[a]));
          c.fillStyle = col.accent;
          c.fillRect(aX - 8 * u, yA - capA * 0.42, (iw + 16 * u) * strike, 6 * u);
        }
      }

      // divisor
      var dk = TC.ramp(t, 2.4, 3.0, E.inOutCubic);
      c.strokeStyle = TC.rgba(col.accent2, 0.45); c.lineWidth = 3 * u;
      var bTop;
      if (wide) {
        var dx = box.x + pad * 1.5 + colW, d0 = aTop - 30 * u, d1 = box.y + box.h - 40 * u;
        c.beginPath(); c.moveTo(dx, d0); c.lineTo(dx, TC.lerp(d0, d1, dk)); c.stroke();
        bTop = aTop;
      } else {
        var dy = aTop + 30 * u + A.length * stepA + 60 * u;
        c.beginPath(); c.moveTo(aX, dy); c.lineTo(TC.lerp(aX, aX + colW, dk), dy); c.stroke();
        bTop = dy + 80 * u;
      }

      // lado B
      var lb = TC.ramp(t, 2.7, 3.1);
      c.save(); S.alpha(lb);
      S.font('mono', labSize, 700);
      S.text(String(p.ladoB || '').toLocaleUpperCase('pt-BR'), bX, bTop, { color: col.accent, spacing: 3 * u });
      c.restore();
      S.font('sans', sB, 800);
      var capB = S.capH();
      for (var b = 0; b < B.length; b++) {
        var t0 = 2.95 + b * 0.22;
        var kb = TC.ramp(t, t0, t0 + 0.55);
        var mk = E.outBack(TC.seg(t, t0 - 0.05, t0 + 0.3), 2.2);
        var yB = bTop + 30 * u + (b + 1) * stepB;
        if (mk > 0) S.brandIcon(bX + 18 * u, yB - capB / 2, sB * 0.85 * mk, col.accent);
        c.save(); S.alpha(kb);
        S.font('sans', sB, 800);
        S.text(B[b], bX + 56 * u - (1 - kb) * 30 * u, yB, { color: col.ink });
        c.restore();
      }
      c.restore();
    }
  });

  // ------------------------------------------------------------------
  // Mito × Verdade — riscar e virar a carta
  // ------------------------------------------------------------------
  TC.register({
    id: 'mito-verdade',
    name: 'Mito × Verdade',
    category: 'argumento',
    duration: 6,
    minDur: 4,
    thumb: 4.2,
    description: 'Carta clara com o MITO, que é riscado e vira (giro 3D) mostrando a VERDADE no lado escuro.',
    uso: 'Quebrar crença do mercado. O risco é o momento de virada — sincroniza com o "só que..." da tua fala.',
    params: [
      { key: 'rotuloMito', label: 'Rótulo do mito', type: 'text', default: 'MITO' },
      { key: 'mito', label: 'Mito', type: 'textarea', default: 'Postar todo dia garante resultado.' },
      { key: 'rotuloVerdade', label: 'Rótulo da verdade', type: 'text', default: 'VERDADE' },
      { key: 'verdade', label: 'Verdade', type: 'textarea', default: 'Coerência ao longo do tempo é o que gera valor percebido.' }
    ],
    draw: function (S, t, extra) {
      var c = S.c, u = S.u, w = S.w, h = S.h, col = S.col, p = S.p, D = S.dur;
      var cardW = S.vertical ? w - 140 * u : Math.min(w * 0.56, 1040 * u);
      var pad = 56 * u;
      var size = S.vertical ? 70 * u : 56 * u;
      var lineH = size * 1.25;
      S.font('sans', size, 800);
      var cap = S.capH();
      var layA = S.flow(p.mito, { maxW: cardW - pad * 2, lineH: lineH });
      var layB = S.flow(p.verdade, { maxW: cardW - pad * 2, lineH: lineH });
      var lines = Math.max(layA.lines, layB.lines);
      var tagH = 64 * u;
      var cardH = pad * 2 + tagH + 44 * u + lines * lineH - (lineH - cap) * 0.6;
      var cx = w / 2, cy = h * (S.vertical ? 0.47 : 0.5);
      var x0 = cx - cardW / 2, y0 = cy - cardH / 2;

      var inK = TC.ramp(t, 0, 0.6);
      var outK = TC.ramp(t, D - 0.45, D, E.inCubic);
      var f1 = E.inCubic(TC.seg(t, 2.6, 2.85));
      var f2 = E.outBack(TC.seg(t, 2.85, 3.25), 1.6);
      var back = t >= 2.85;
      var sx = back ? f2 : 1 - f1;

      c.save();
      c.globalAlpha = inK * (1 - outK);
      c.translate(cx, cy + (1 - inK) * 80 * u + outK * 50 * u);
      var sIn = 0.94 + 0.06 * inK;
      c.scale(Math.max(0.001, sx) * sIn, sIn);
      c.translate(-cx, -cy);

      c.save(); S.shadow(0.9);
      S.fillRRect(x0, y0, cardW, cardH, 30 * u, back ? col.dark : col.paper);
      c.restore();

      // etiqueta
      var tag = String(back ? p.rotuloVerdade : p.rotuloMito).toLocaleUpperCase('pt-BR');
      S.font('mono', 28 * u, 700);
      var tagW = S.measure(tag, 4 * u) + 100 * u;
      var tk = back ? 1 : E.outBack(TC.seg(t, 0.3, 0.7), 2);
      var wig = !back ? Math.sin(t * 40) * 0.05 * Math.sin(TC.seg(t, 2.0, 2.5) * Math.PI) : 0;
      c.save();
      c.translate(x0 + pad + tagW / 2, y0 + pad + tagH / 2); c.rotate(wig); c.scale(tk, tk);
      if (back) {
        S.fillRRect(-tagW / 2, -tagH / 2, tagW, tagH, tagH / 2, col.accent);
        S.text(tag, 18 * u, 10 * u, { align: 'center', color: col.dark, spacing: 4 * u });
        S.brandIcon(-tagW / 2 + 34 * u, 0, 28 * u, col.dark);
      } else {
        c.strokeStyle = col.inkOnPaper; c.lineWidth = 3 * u;
        S.rrect(-tagW / 2, -tagH / 2, tagW, tagH, tagH / 2); c.stroke();
        S.text(tag, 18 * u, 10 * u, { align: 'center', color: col.inkOnPaper, spacing: 4 * u });
        // x pequeno
        c.lineCap = 'round';
        c.beginPath(); c.moveTo(-tagW / 2 + 26 * u, -9 * u); c.lineTo(-tagW / 2 + 44 * u, 9 * u);
        c.moveTo(-tagW / 2 + 44 * u, -9 * u); c.lineTo(-tagW / 2 + 26 * u, 9 * u); c.stroke();
      }
      c.restore();

      // texto
      var lay = back ? layB : layA;
      var tx = x0 + pad, ty = y0 + pad + tagH + 44 * u + cap;
      var startT = back ? 3.0 : 0.5;
      var strike = back ? 0 : 1;
      S.font('sans', size, 800);
      for (var i = 0; i < lay.words.length; i++) {
        var wd = lay.words[i];
        var wk = TC.ramp(t, startT + i * 0.05, startT + 0.4 + i * 0.05);
        var dim = back ? 1 : 1 - 0.55 * E.inOutCubic(TC.seg(t, 1.9, 2.4));
        c.save(); S.alpha(wk * dim);
        S.text(wd.text, tx + wd.x, ty + wd.y + (1 - wk) * 16 * u, { color: back ? col.ink : col.body });
        c.restore();
      }
      if (strike) {
        var lw = S.flow(p.mito, { maxW: cardW - pad * 2, lineH: lineH }).lineWidths;
        for (var l = 0; l < lw.length; l++) {
          var sk = E.inOutCubic(TC.seg(t, 1.85 + l * 0.15, 2.25 + l * 0.15));
          if (sk <= 0) continue;
          c.fillStyle = col.accent;
          c.fillRect(tx - 6 * u, ty + l * lineH - cap * 0.42, (lw[l] + 12 * u) * sk, 8 * u);
        }
      }
      c.restore();
    }
  });

  // ------------------------------------------------------------------
  // Fluxo A ⮕ B — o que vem antes do quê
  // ------------------------------------------------------------------
  TC.register({
    id: 'fluxo',
    name: 'Fluxo A ⮕ B',
    category: 'argumento',
    duration: 5,
    minDur: 3,
    thumb: 2.8,
    description: 'CLAREZA → depois → MARKETING, com legenda embaixo de cada lado. Igual ao teu story, animado.',
    uso: 'Mostrar ordem/causa: o que vem antes, o que vem depois. Organiza o raciocínio em 2 blocos que a pessoa lembra.',
    params: [
      { key: 'a', label: 'Lado A', type: 'text', default: 'CLAREZA' },
      { key: 'conector', label: 'Conector', type: 'text', default: 'depois' },
      { key: 'b', label: 'Lado B', type: 'text', default: 'MARKETING' },
      { key: 'legendaA', label: 'Legenda A', type: 'text', default: 'decidir o que deve ser visto' },
      { key: 'legendaB', label: 'Legenda B', type: 'text', default: 'mostrar isso para os outros' },
      { key: 'fundo', label: 'Fundo', type: 'select', options: ['painel', 'nenhum'], default: 'painel' }
    ],
    draw: function (S, t) {
      var c = S.c, u = S.u, w = S.w, h = S.h, col = S.col, p = S.p, D = S.dur;
      var panelW = S.vertical ? w - 100 * u : Math.min(w * 0.7, 1300 * u);
      var pad = 44 * u;
      var arrowW = (S.vertical ? 140 : 220) * u;
      var colW = (panelW - pad * 2 - arrowW) / 2;
      var size = Math.min(S.fit(p.a, 'display', 400, colW, (S.vertical ? 110 : 120) * u, 30 * u), S.fit(p.b, 'display', 400, colW, (S.vertical ? 110 : 120) * u, 30 * u));
      S.font('display', size, 400);
      var cap = S.capH();
      var legSize = (S.vertical ? 40 : 36) * u;
      S.font('sans', legSize, 600);
      var legA = S.wrap(p.legendaA || '', colW), legB = S.wrap(p.legendaB || '', colW);
      var legLines = Math.max(p.legendaA ? legA.length : 0, p.legendaB ? legB.length : 0);
      var legLH = legSize * 1.3;
      var panelH = pad * 2 + cap + (legLines ? 70 * u + legLines * legLH : 20 * u);
      var px = (w - panelW) / 2;
      var py = (S.vertical ? h * 0.45 : h * 0.5) - panelH / 2;

      var inK = TC.ramp(t, 0, 0.55);
      var outK = TC.ramp(t, D - 0.4, D, E.inCubic);
      c.save();
      c.globalAlpha = 1 - outK;
      c.translate(0, outK * 30 * u);
      if (p.fundo !== 'nenhum') {
        c.save(); S.shadow(0.9);
        var ph = panelH * inK;
        S.fillRRect(px, py + (panelH - ph) / 2, panelW, ph, 30 * u, TC.rgba(col.panel, 0.95));
        c.restore();
      }
      var shadowTxt = p.fundo === 'nenhum' ? 0.9 : 0;
      var aCx = px + pad + colW / 2, bCx = px + panelW - pad - colW / 2;
      var base = py + pad + cap;

      // A
      var ka = TC.ramp(t, 0.3, 0.9);
      c.save(); S.shadow(shadowTxt);
      S.clipRect(px, base - cap - 20 * u, panelW / 2, cap + 50 * u);
      S.alpha(ka);
      S.font('display', size, 400);
      S.text(p.a, aCx - (1 - ka) * 60 * u, base, { align: 'center', color: col.accent2 });
      c.restore();
      // B
      var kb = TC.ramp(t, 1.1, 1.7);
      c.save(); S.shadow(shadowTxt);
      S.clipRect(px + panelW / 2, base - cap - 20 * u, panelW / 2, cap + 50 * u);
      S.alpha(kb);
      S.font('display', size, 400);
      S.text(p.b, bCx + (1 - kb) * 60 * u, base, { align: 'center', color: col.ink });
      c.restore();

      // seta curva desenhada
      var ak = E.inOutCubic(TC.seg(t, 0.65, 1.2));
      var ax0 = px + pad + colW + 22 * u, ax1 = px + panelW - pad - colW - 22 * u, ay = base - cap * 0.55;
      var ctrlY = ay - 34 * u;
      if (ak > 0) {
        c.strokeStyle = col.ink; c.lineWidth = 6 * u; c.lineCap = 'round'; c.lineJoin = 'round';
        c.beginPath();
        var steps = 24, lastX = ax0, lastY = ay, prevX = ax0, prevY = ay;
        for (var s = 0; s <= steps * ak; s++) {
          var q = s / steps;
          var bx = (1 - q) * (1 - q) * ax0 + 2 * (1 - q) * q * ((ax0 + ax1) / 2) + q * q * ax1;
          var by = (1 - q) * (1 - q) * ay + 2 * (1 - q) * q * ctrlY + q * q * ay;
          if (s === 0) c.moveTo(bx, by); else c.lineTo(bx, by);
          prevX = lastX; prevY = lastY; lastX = bx; lastY = by;
        }
        c.stroke();
        if (ak > 0.85) {
          var hk = TC.seg(ak, 0.85, 1);
          var ang = Math.atan2(lastY - prevY, lastX - prevX), hl = 22 * u * hk;
          c.beginPath();
          c.moveTo(lastX - Math.cos(ang - 0.6) * hl, lastY - Math.sin(ang - 0.6) * hl);
          c.lineTo(lastX, lastY);
          c.lineTo(lastX - Math.cos(ang + 0.6) * hl, lastY - Math.sin(ang + 0.6) * hl);
          c.stroke();
        }
      }
      if (p.conector) {
        var ck = TC.ramp(t, 0.95, 1.35);
        c.save(); S.alpha(ck); S.shadow(shadowTxt);
        S.font('sans', (S.vertical ? 30 : 30) * u, 600, true);
        S.text(p.conector, (ax0 + ax1) / 2, ay + 46 * u, { align: 'center', color: col.muted });
        c.restore();
      }

      // divisor + legendas
      if (legLines) {
        var ly = base + 70 * u;
        var dk = TC.ramp(t, 1.4, 1.95, E.inOutCubic);
        c.strokeStyle = col.accent2; c.lineWidth = 4 * u;
        c.beginPath(); c.moveTo(px + panelW / 2, ly - 10 * u); c.lineTo(px + panelW / 2, ly - 10 * u + (legLines * legLH + 20 * u) * dk); c.stroke();
        S.font('sans', legSize, 600);
        var la = TC.ramp(t, 1.6, 2.1), lb = TC.ramp(t, 1.85, 2.35);
        c.save(); S.shadow(shadowTxt);
        for (var i = 0; i < legA.length; i++) { c.save(); S.alpha(la); S.text(legA[i], aCx, ly + legSize + i * legLH + (1 - la) * 14 * u, { align: 'center', color: col.accent2 }); c.restore(); }
        for (var j = 0; j < legB.length; j++) { c.save(); S.alpha(lb); S.text(legB[j], bCx, ly + legSize + j * legLH + (1 - lb) * 14 * u, { align: 'center', color: TC.rgba(col.ink, 0.9) }); c.restore(); }
        c.restore();
      }
      c.restore();
    }
  });

  // ------------------------------------------------------------------
  // Pergunta — a pergunta que trava o scroll
  // ------------------------------------------------------------------
  TC.register({
    id: 'pergunta',
    name: 'Pergunta',
    category: 'argumento',
    duration: 5,
    minDur: 3,
    thumb: 3.2,
    description: 'Fundo ameixa com padrão de raios (dos teus stories), aspas grandes e a pergunta entrando palavra a palavra.',
    uso: 'Gancho no começo ou virada no meio. Uma pergunta bem feita faz a pessoa responder mentalmente — e quem responde, fica.',
    params: [
      { key: 'intro', label: 'Frase de entrada', type: 'text', default: 'Antes de tudo...' },
      { key: 'pergunta', label: 'Pergunta', type: 'textarea', default: 'o que tu quer que a pessoa entenda sobre ti?' },
      { key: 'destaque', label: 'Palavras em destaque', type: 'text', default: 'entenda' },
      { key: 'modo', label: 'Modo', type: 'select', options: ['cartela', 'sobreposto'], default: 'cartela' }
    ],
    draw: function (S, t) {
      var c = S.c, u = S.u, w = S.w, h = S.h, col = S.col, p = S.p, D = S.dur;
      var full = p.modo !== 'sobreposto';
      var cx = w / 2, cy = h * (S.vertical ? 0.46 : 0.5);
      var diag = Math.sqrt(w * w + h * h);
      var irisIn = E.outExpo(TC.seg(t, 0, 0.7)), irisOut = E.inExpo(TC.seg(t, D - 0.55, D));
      c.save();
      if (full) {
        var r = diag * 0.6 * irisIn * (1 - irisOut);
        if (r <= 0.5) { c.restore(); return; }
        c.beginPath(); c.arc(cx, cy, r, 0, Math.PI * 2); c.clip();
        c.fillStyle = col.panel; c.fillRect(0, 0, w, h);
        S.iconPattern(col.accent2, 0.07, 34 * u, 10);
        S.grain(0.05, true);
      } else {
        c.globalAlpha = 1 - TC.ramp(t, D - 0.4, D, E.inCubic);
      }
      var maxW = w * (S.vertical ? 0.82 : 0.66);
      var size = (S.vertical ? 100 : 84) * u;
      var lay;
      for (var g = 0; g < 20; g++) {
        S.font('sans', size, 800);
        lay = S.flow(p.pergunta, { maxW: maxW, lineH: size * 1.16 });
        if (lay.height < h * (full ? 0.42 : 0.3) || size < 40 * u) break;
        size *= 0.92;
      }
      var cap = S.capH();
      var bx = (w - maxW) / 2;
      var by = full ? cy - lay.height / 2 + 40 * u : (S.vertical ? h * 0.62 : h * 0.66) - lay.height / 2;
      var shadow = full ? 0 : 0.9;

      // aspas
      if (full) {
        var qk = TC.ramp(t, 0.3, 0.9);
        c.save(); S.alpha(qk * 0.9);
        S.font('display', 300 * u, 400);
        var qm = c.measureText('“');
        var qDesc = qm.actualBoundingBoxDescent !== undefined ? qm.actualBoundingBoxDescent : -150 * u;
        var qBottom = by - size * 0.62 - size * 0.56 - 30 * u;
        S.text('“', bx - 10 * u - (1 - qk) * 40 * u, qBottom - qDesc, { color: TC.rgba(col.accent, 0.7) });
        c.restore();
      }
      // entrada
      if (p.intro) {
        var ik = TC.ramp(t, 0.4, 0.9);
        c.save(); S.alpha(ik); S.shadow(shadow);
        S.font('sans', size * 0.56, 700, true);
        S.text(p.intro, bx, by - size * 0.62 + (1 - ik) * 16 * u, { color: col.accent2 });
        c.restore();
      }
      var hi = {};
      String(p.destaque || '').split(/\s+/).forEach(function (x) { if (x) hi[TC.normWord(x)] = 1; });
      var startT = 0.8, per = Math.min(0.11, 1.6 / Math.max(1, lay.words.length));
      S.font('sans', size, 800);
      c.save(); S.shadow(shadow);
      for (var i = 0; i < lay.words.length; i++) {
        var wd = lay.words[i];
        var k = E.outBack(TC.seg(t, startT + i * per, startT + 0.35 + i * per), 2);
        if (k <= 0) continue;
        var x = bx + wd.x, y = by + wd.y + cap;
        c.save();
        c.globalAlpha *= TC.clamp(k, 0, 1);
        c.translate(x + wd.w / 2, y - cap / 2); c.scale(0.7 + 0.3 * k, 0.7 + 0.3 * k); c.translate(-(x + wd.w / 2), -(y - cap / 2));
        S.text(wd.text, x, y, { color: hi[wd.key] ? col.accent2 : '#FFFFFF' });
        c.restore();
        if (hi[wd.key]) {
          var uk = E.outCubic(TC.seg(t, startT + lay.words.length * per + 0.3, startT + lay.words.length * per + 0.8));
          c.fillStyle = col.accent;
          c.fillRect(x, y + 16 * u, wd.w * uk, 7 * u);
        }
      }
      c.restore();
      c.restore();
    }
  });
})(typeof window !== 'undefined' ? window : this);
