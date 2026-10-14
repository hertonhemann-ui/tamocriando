/* Sinalização: mostram pro público onde ele está dentro do raciocínio */
(function (root) {
  'use strict';
  var TC = root.TC, E = TC.ease;

  // ------------------------------------------------------------------
  // Trilha do Método — "você está aqui"
  // ------------------------------------------------------------------
  TC.register({
    id: 'metodo-trilha',
    name: 'Trilha do Método',
    category: 'estrutura',
    duration: 5,
    minDur: 2.5,
    thumb: 2.4,
    description: 'Mapa do teu método com a etapa atual acesa: Conhecimento ⮕ Narrativa ⮕ Percepção ⮕ Valor ⮕ Coerência.',
    uso: 'Toda vez que o vídeo fala de UMA etapa. O público vê o todo e sabe onde está. Repetir esse elemento em vários vídeos é o que faz o método virar marca.',
    params: [
      { key: 'rotulo', label: 'Rótulo', type: 'text', default: 'O MÉTODO' },
      { key: 'etapas', label: 'Etapas (separa por vírgula)', type: 'text', default: 'Conhecimento, Narrativa, Percepção, Valor, Coerência' },
      { key: 'ativa', label: 'Etapa atual (número)', type: 'number', min: 1, max: 9, default: 3 },
      { key: 'posicao', label: 'Posição', type: 'select', options: ['topo', 'baixo'], default: 'topo' }
    ],
    draw: function (S, t) {
      var c = S.c, u = S.u, w = S.w, col = S.col, p = S.p, D = S.dur;
      var steps = TC.splitList(p.etapas);
      if (!steps.length) return;
      var n = steps.length;
      var a = TC.clamp(Math.round(Number(p.ativa) || 1), 1, n) - 1;

      var panelW = S.vertical ? w - 120 * u : Math.min(w * 0.74, 1400 * u);
      var pad = 44 * u;
      var px = (w - panelW) / 2;
      var bigSize = S.vertical ? 84 * u : 90 * u;
      var labelSize = S.vertical ? 30 * u : 30 * u;

      // medidas
      S.font('display', bigSize, 400);
      var bigCap = S.capH();
      var rotY = 40 * u + 26 * u;
      var bigBase = rotY + 34 * u + bigCap;
      var trackY = bigBase + 66 * u;
      var labelY = trackY + 62 * u;
      var panelH = labelY + 40 * u;

      var bottom = p.posicao === 'baixo';
      var y0 = bottom ? S.safe.bottom - panelH : S.safe.top + 10 * u;

      var inK = TC.ramp(t, 0, 0.6);
      var outK = TC.ramp(t, D - 0.45, D, E.inExpo);
      var hK = inK * (1 - outK);
      if (hK <= 0) return;

      c.save();
      c.translate(px, y0 + (1 - inK) * (bottom ? 24 : -24) * u);
      // revela o painel de cima pra baixo (ou de baixo pra cima)
      c.beginPath();
      if (bottom) c.rect(-40 * u, panelH * (1 - hK) - 40 * u, panelW + 80 * u, panelH * hK + 80 * u);
      else c.rect(-40 * u, -40 * u, panelW + 80 * u, panelH * hK + 40 * u);
      c.clip();

      c.save();
      S.shadow(0.8);
      S.fillRRect(0, 0, panelW, panelH, 30 * u, TC.rgba(col.panel, 0.95));
      c.restore();

      // rótulo + contador
      var rk = TC.ramp(t, 0.25, 0.65);
      c.save(); S.alpha(rk);
      S.font('mono', 26 * u, 700);
      S.brandIcon(pad + 10 * u, rotY - 9 * u, 28 * u, col.accent);
      S.text(String(p.rotulo).toLocaleUpperCase('pt-BR'), pad + 36 * u, rotY, { color: col.accent2, spacing: 5 * u });
      S.text(' / ' + TC.pad2(n), panelW - pad, rotY, { align: 'right', color: col.muted });
      var totW = S.measure(' / ' + TC.pad2(n));
      S.text(TC.pad2(a + 1), panelW - pad - totW, rotY, { align: 'right', color: col.ink });
      c.restore();

      // nome grande da etapa atual
      var bk = TC.ramp(t, 0.75, 1.4);
      var big = steps[a].toLocaleUpperCase('pt-BR');
      S.fit(big, 'display', 400, panelW - pad * 2, bigSize, 30 * u);
      c.save();
      S.clipRect(0, bigBase - bigCap - 12 * u, panelW, bigCap + 26 * u);
      S.text(big, pad, bigBase + (1 - bk) * bigCap * 1.9, { color: col.ink });
      c.restore();

      // trilha: os rótulos definem o espaçamento (nada se sobrepõe)
      var nodeR = 22 * u;
      var labs = steps.map(function (x) { return x.toLocaleUpperCase('pt-BR'); });
      var lsz = labelSize, lws, x0, x1, spacing;
      for (var g = 0; g < 16; g++) {
        S.font('display', lsz, 400);
        lws = labs.map(function (x) { return S.measure(x, 1 * u); });
        x0 = pad + Math.max(nodeR, lws[0] / 2);
        x1 = panelW - pad - Math.max(nodeR, lws[n - 1] / 2);
        spacing = n > 1 ? (x1 - x0) / (n - 1) : 0;
        var fits = true;
        for (var q = 0; q < n - 1; q++) if ((lws[q] + lws[q + 1]) / 2 + 16 * u > spacing) fits = false;
        if (fits || lsz < 16 * u) break;
        lsz *= 0.93;
      }
      labelSize = lsz;
      var xs = [];
      for (var i = 0; i < n; i++) xs.push(n === 1 ? panelW / 2 : x0 + spacing * i);
      var L = E.outCubic(TC.seg(t, 0.35, 1.3));
      var lineEnd = TC.lerp(x0, x1, L);
      c.lineCap = 'round';
      c.strokeStyle = TC.rgba(col.muted, 0.35); c.lineWidth = 4 * u;
      c.beginPath(); c.moveTo(x0, trackY); c.lineTo(lineEnd, trackY); c.stroke();
      c.strokeStyle = col.accent2; c.lineWidth = 6 * u;
      c.beginPath(); c.moveTo(x0, trackY); c.lineTo(Math.min(lineEnd, xs[a]), trackY); c.stroke();

      for (var j = 0; j < n; j++) {
        var reach = n === 1 ? 1 : TC.clamp((L * (n - 1) - j + 0.35) / 0.45, 0, 1);
        var nk = E.outBack(reach, 2.4);
        if (nk <= 0) continue;
        var x = xs[j];
        if (j < a) {
          c.fillStyle = col.accent2;
          c.beginPath(); c.arc(x, trackY, 11 * u * nk, 0, Math.PI * 2); c.fill();
        } else if (j === a) {
          // pulso contínuo na etapa atual
          var since = t - 1.2;
          if (since > 0) {
            var ph = (since % 1.5) / 1.5;
            c.strokeStyle = TC.rgba(col.accent, 0.6 * (1 - ph)); c.lineWidth = 3 * u;
            c.beginPath(); c.arc(x, trackY, nodeR + ph * 34 * u, 0, Math.PI * 2); c.stroke();
          }
          c.fillStyle = col.accent;
          c.beginPath(); c.arc(x, trackY, nodeR * nk, 0, Math.PI * 2); c.fill();
          S.brandIcon(x, trackY, 26 * u * nk, col.panel);
        } else {
          c.fillStyle = col.panel;
          c.beginPath(); c.arc(x, trackY, 10 * u * nk, 0, Math.PI * 2); c.fill();
          c.strokeStyle = TC.rgba(col.muted, 0.8); c.lineWidth = 3 * u;
          c.beginPath(); c.arc(x, trackY, 10 * u * nk, 0, Math.PI * 2); c.stroke();
        }
        // rótulo embaixo do nó
        var lk = TC.clamp(reach * 1.4 - 0.4, 0, 1);
        if (lk > 0) {
          var lab = steps[j].toLocaleUpperCase('pt-BR');
          S.font('display', labelSize, 400);
          var lx = x, align = 'center';
          c.save(); S.alpha(lk);
          S.text(lab, lx, labelY, { align: align, spacing: 1 * u, color: j === a ? col.accent2 : j < a ? TC.rgba(col.ink, 0.8) : TC.rgba(col.muted, 0.75) });
          c.restore();
        }
      }
      c.restore();
    }
  });

  // ------------------------------------------------------------------
  // Capítulo — divide o vídeo em partes
  // ------------------------------------------------------------------
  function slotNumber(S, str, x, base, cap, t, t0, color) {
    var c = S.c;
    c.save();
    S.clipRect(x - 10 * S.u, base - cap - 20 * S.u, S.w, cap + 40 * S.u);
    c.fillStyle = color; c.textAlign = 'left'; c.textBaseline = 'alphabetic';
    var cx = x, lineH = cap * 1.35;
    for (var i = 0; i < str.length; i++) {
      var ch = str[i];
      var cw = c.measureText(ch).width;
      var k = E.outExpo(TC.seg(t, t0 + i * 0.09, t0 + 0.75 + i * 0.09));
      if (/[0-9]/.test(ch)) {
        var d = Number(ch);
        // coluna de dígitos rolando até parar no número certo
        for (var s = 0; s <= 4; s++) {
          var digit = (d - 4 + s + 20) % 10;
          var y = base + (s - 4 * k) * lineH;
          c.fillText(String(digit), cx, y);
        }
      } else {
        c.fillText(ch, cx, base + (1 - k) * lineH);
      }
      cx += cw;
    }
    c.restore();
  }

  TC.register({
    id: 'capitulo',
    name: 'Capítulo',
    category: 'estrutura',
    duration: 3.5,
    minDur: 2.2,
    thumb: 1.9,
    description: 'Cartela de parte/capítulo com número rolando, entrando e saindo numa varrida diagonal de duas camadas.',
    uso: 'Vídeos com mais de 1 minuto. Dividir em partes avisa o cérebro que tem estrutura — e estrutura segura retenção.',
    params: [
      { key: 'rotulo', label: 'Rótulo', type: 'text', default: 'PARTE' },
      { key: 'numero', label: 'Número', type: 'text', default: '02' },
      { key: 'total', label: 'Total (opcional)', type: 'text', default: '05' },
      { key: 'titulo', label: 'Título', type: 'text', default: 'A NARRATIVA' },
      { key: 'subtitulo', label: 'Subtítulo', type: 'text', default: 'como organizar o que tu sabe' },
      { key: 'modo', label: 'Modo', type: 'select', options: ['cartela', 'faixa'], default: 'cartela' }
    ],
    draw: function (S, t) {
      var c = S.c, u = S.u, w = S.w, h = S.h, col = S.col, p = S.p, D = S.dur;
      var band = p.modo === 'faixa';
      var aTop = 0, aH = h;
      if (band) { aH = S.vertical ? h * 0.26 : h * 0.42; aTop = h * 0.5 - aH / 2; }
      var aBot = aTop + aH;
      var slant = aH * 0.22;

      function layer(lead, trail, color) {
        var Lx = TC.lerp(-slant, w + slant, lead), Tx = TC.lerp(-slant, w + slant, trail);
        if (Lx <= Tx) return null;
        c.beginPath();
        c.moveTo(Tx, aTop); c.lineTo(Lx, aTop); c.lineTo(Lx - slant, aBot); c.lineTo(Tx - slant, aBot);
        c.closePath();
        if (color) { c.fillStyle = color; c.fill(); }
        return true;
      }
      var inA = TC.ramp(t, 0, 0.55), inB = TC.ramp(t, 0.08, 0.68);
      var outB = TC.ramp(t, D - 0.6, D - 0.12, E.inExpo), outA = TC.ramp(t, D - 0.5, D, E.inExpo);
      layer(inA, outA, col.accent);
      c.save();
      if (!layer(inB, outB, col.dark)) { c.restore(); return; }
      c.clip();
      S.grain(0.07, true);

      var row = !S.vertical || band;
      var numStr = String(p.numero || '');
      var label = String(p.rotulo || '').toLocaleUpperCase('pt-BR');

      if (!row) {
        // empilhado (9:16 cartela)
        var mx = 90 * u;
        S.font('display', 440 * u, 400);
        var cap = S.capH();
        var labY = h * 0.32;
        var base = labY + 36 * u + cap;
        var lk = TC.ramp(t, 0.4, 0.85);
        c.save(); S.alpha(lk);
        S.font('mono', 32 * u, 700);
        S.text(label, mx + 6 * u, labY, { color: col.accent2, spacing: 8 * u });
        c.restore();
        S.font('display', 440 * u, 400);
        var nw = S.measure(numStr);
        slotNumber(S, numStr, mx, base, cap, t, 0.3, col.accent);
        if (p.total) {
          c.save(); S.alpha(TC.ramp(t, 0.8, 1.2));
          S.font('mono', 40 * u, 700);
          S.text('/ ' + p.total, mx + nw + 24 * u, base - cap + 40 * u, { color: col.muted });
          c.restore();
        }
        var ty = base + 70 * u;
        var ts = S.fit(p.titulo, 'display', 400, w - mx * 2, 150 * u, 50 * u);
        var tcap = S.capH();
        var tk = TC.ramp(t, 0.6, 1.25);
        c.save();
        S.clipRect(0, ty, w, tcap + 24 * u);
        S.text(p.titulo, mx, ty + tcap + (1 - tk) * tcap * 1.9, { color: col.ink });
        c.restore();
        var lineK = TC.ramp(t, 0.9, 1.5);
        c.fillStyle = col.accent; c.fillRect(mx, ty + tcap + 40 * u, 160 * u * lineK, 8 * u);
        if (p.subtitulo) {
          var sk = TC.ramp(t, 1.0, 1.5);
          c.save(); S.alpha(sk);
          S.font('sans', 48 * u, 600, true);
          var lines = S.wrap(p.subtitulo, w - mx * 2);
          for (var i = 0; i < lines.length; i++) S.text(lines[i], mx, ty + tcap + 120 * u + i * 60 * u + (1 - sk) * 16 * u, { color: col.muted });
          c.restore();
        }
        void ts;
      } else {
        // em linha (16:9, quadrado ou faixa)
        var numSize = 100 * u;
        S.font('display', numSize, 400);
        numSize = numSize * (aH * (band ? 0.56 : 0.42)) / S.capH();
        S.font('display', numSize, 400);
        var cap2 = S.capH();
        var mx2 = band ? w * 0.07 : w * 0.09;
        var nw2 = S.measure(numStr);
        var base2 = aTop + aH / 2 + cap2 / 2;
        slotNumber(S, numStr, mx2, base2, cap2, t, 0.3, col.accent);
        var tx = mx2 + nw2 + (band ? 40 : 70) * u;
        var colW = w - tx - mx2;
        var tSize = S.fit(p.titulo, 'display', 400, colW, band ? cap2 * 0.62 : 150 * u, 36 * u);
        var tcap2 = S.capH();
        var subSize = Math.max(24 * u, tSize * 0.32);
        var labSize = Math.max(20 * u, tSize * 0.22);
        var blockH = labSize + 26 * u + tcap2 + (p.subtitulo ? 30 * u + subSize : 0);
        var by = aTop + aH / 2 - blockH / 2;
        var lk2 = TC.ramp(t, 0.45, 0.9);
        c.save(); S.alpha(lk2);
        S.font('mono', labSize, 700);
        var lab2 = label + (p.total ? '  ' + numStr + ' / ' + p.total : '');
        S.text(lab2, tx, by + labSize * 0.8, { color: col.accent2, spacing: labSize * 0.25 });
        c.restore();
        var tTop = by + labSize + 26 * u;
        var tk2 = TC.ramp(t, 0.6, 1.25);
        S.font('display', tSize, 400);
        c.save();
        S.clipRect(tx - 5 * u, tTop - 6 * u, w, tcap2 + 20 * u);
        S.text(p.titulo, tx, tTop + tcap2 + (1 - tk2) * tcap2 * 1.9, { color: col.ink });
        c.restore();
        if (p.subtitulo) {
          var sk2 = TC.ramp(t, 1.0, 1.5);
          c.save(); S.alpha(sk2);
          S.font('sans', subSize, 600, true);
          S.text(p.subtitulo, tx, tTop + tcap2 + 26 * u + subSize + (1 - sk2) * 12 * u, { color: col.muted });
          c.restore();
        }
      }
      c.restore();
    }
  });

  // ------------------------------------------------------------------
  // Contador — etiqueta de canto "DICA 03 / 07"
  // ------------------------------------------------------------------
  TC.register({
    id: 'contador',
    name: 'Contador de Dicas',
    category: 'estrutura',
    duration: 5,
    minDur: 1.6,
    thumb: 2.0,
    description: 'Etiqueta no canto com "DICA 03 / 07" e barra de progresso. O mesmo 04/08 dos teus carrosséis, em vídeo.',
    uso: 'Listas, dicas, erros, passos. Ver "3 de 7" faz a pessoa ficar até o 7. Coloca no começo de cada item.',
    params: [
      { key: 'rotulo', label: 'Rótulo', type: 'text', default: 'DICA' },
      { key: 'atual', label: 'Número atual', type: 'number', min: 1, max: 99, default: 3 },
      { key: 'total', label: 'Total', type: 'number', min: 1, max: 99, default: 7 },
      { key: 'canto', label: 'Canto', type: 'select', options: ['topo-esq', 'topo-dir', 'baixo-esq', 'baixo-dir'], default: 'topo-esq' }
    ],
    draw: function (S, t) {
      var c = S.c, u = S.u, w = S.w, col = S.col, p = S.p, D = S.dur;
      var total = Math.max(1, Math.round(Number(p.total) || 1));
      var cur = TC.clamp(Math.round(Number(p.atual) || 1), 1, total);
      var z = S.vertical ? 1.3 : 1;
      u = u * z;
      var H = 78 * u, R = H / 2;
      var label = String(p.rotulo || '').toLocaleUpperCase('pt-BR');

      S.font('mono', 26 * u, 700);
      var labW = label ? S.measure(label, 4 * u) + 18 * u : 0;
      S.font('mono', 34 * u, 700);
      var numW = S.measure(TC.pad2(cur));
      S.font('mono', 26 * u, 400);
      var totW = S.measure(' / ' + TC.pad2(total));
      var pillW = H + 18 * u + labW + numW + totW + 34 * u;

      var right = String(p.canto).indexOf('dir') >= 0;
      var bottomPos = String(p.canto).indexOf('baixo') >= 0;
      var x = right ? w - S.safe.side - pillW : S.safe.side;
      var y = bottomPos ? S.safe.bottom - H - 30 * u : S.safe.top + 10 * u;

      var pop = E.outBack(TC.seg(t, 0, 0.4), 2);
      var grow = TC.ramp(t, 0.18, 0.7);
      var shrink = TC.ramp(t, D - 0.55, D - 0.2, E.inExpo);
      var gone = E.inBack(TC.seg(t, D - 0.25, D));
      var wk = grow * (1 - shrink);
      var sc = pop * (1 - gone);
      if (sc <= 0.001) return;

      c.save();
      // círculo do ícone é o ponto de ancoragem
      var ax = right ? x + pillW - R : x + R, ay = y + R;
      c.translate(ax, ay); c.scale(sc, sc); c.translate(-ax, -ay);
      c.save(); S.shadow(0.6);
      var curW = H + (pillW - H) * wk;
      S.fillRRect(right ? x + pillW - curW : x, y, curW, H, R, col.paper);
      c.restore();
      S.fillRRect(right ? x + pillW - H + 8 * u : x + 8 * u, y + 8 * u, H - 16 * u, H - 16 * u, (H - 16 * u) / 2, col.accent);
      S.brandIcon(ax, ay, 32 * u, col.paper);

      // texto
      var tk = TC.ramp(t, 0.45, 0.85) * (1 - TC.ramp(t, D - 0.6, D - 0.4, E.linear));
      if (tk > 0) {
        c.save();
        S.clipRect(right ? x + pillW - curW : x, y, curW, H);
        S.alpha(tk);
        var tx = right ? x + 26 * u : x + H + 10 * u;
        var base = y + H / 2 + 11 * u;
        if (label) { S.font('mono', 26 * u, 700); S.text(label, tx, base - 1 * u, { color: col.body, spacing: 4 * u }); tx += labW; }
        S.font('mono', 34 * u, 700);
        // número rola do anterior pro atual
        var rk = E.outExpo(TC.seg(t, 0.7, 1.2));
        c.save();
        S.clipRect(tx - 4 * u, y + 6 * u, numW + 8 * u, H - 12 * u);
        S.text(TC.pad2(Math.max(0, cur - 1)), tx, base + 1 * u - rk * H, { color: col.inkOnPaper });
        S.text(TC.pad2(cur), tx, base + 1 * u + (1 - rk) * H, { color: col.inkOnPaper });
        c.restore();
        tx += numW;
        S.font('mono', 26 * u, 400);
        S.text(' / ' + TC.pad2(total), tx, base - 1 * u, { color: TC.rgba(col.body, 0.55) });
        c.restore();
      }

      // barra de progresso segmentada
      var bk = TC.ramp(t, 0.6, 1.0) * (1 - shrink);
      if (bk > 0) {
        var gap = 6 * u, segW = (pillW - gap * (total - 1)) / total, by = y + H + 14 * u;
        for (var i = 0; i < total; i++) {
          var sx = x + i * (segW + gap);
          var appear = TC.clamp(bk * total * 1.2 - i * 0.6, 0, 1);
          if (appear <= 0) continue;
          c.save(); S.alpha(appear);
          S.fillRRect(sx, by, segW, 7 * u, 3.5 * u, TC.rgba(col.paper, 0.35));
          var fill = i < cur - 1 ? 1 : i === cur - 1 ? E.outCubic(TC.seg(t, 1.0, 1.6)) : 0;
          if (fill > 0) S.fillRRect(sx, by, segW * fill, 7 * u, 3.5 * u, i === cur - 1 ? col.accent : col.paper);
          c.restore();
        }
      }
      c.restore();
    }
  });
})(typeof window !== 'undefined' ? window : this);
