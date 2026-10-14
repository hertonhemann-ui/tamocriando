/* Guiar: mostrar onde a pessoa está dentro do raciocínio */
(function (root) {
  'use strict';
  var TC = root.TC;

  // paleta "fria": tudo que é calor vira cinza (etapas que ainda não chegaram)
  function coldPalette(col) {
    return {
      ember: col.ash, glow: col.ash, hot: TC.mixHex(col.ash, col.paper, 0.2),
      paper: TC.mixHex(col.ash, col.paper, 0.35), ink: col.ink, ash: col.ash,
      crust: TC.mixHex(col.ash, col.ink, 0.45), paperShade: col.ash
    };
  }

  /*
   * Ícones da cinza à brasa (5 estágios):
   *  0 cinza  · 1 sopro · 2 brasa · 3 chama · 4 marca
   * heat 0..1 controla o quanto o estágio está aceso.
   */
  function stageIcon(S, k, x, y, s, heat, cold) {
    var c = S.c, t = S.t, keep = S.col;
    if (cold) S.col = coldPalette(keep);
    var col = S.col;
    try {
      if (k === 0) {
        S.ashPile(x, y + s * 0.32, s * 0.95, s * 0.42, { seed: 4 });
        var r = TC.rng(8);
        for (var i = 0; i < 5; i++) {
          var q = ((t * 0.25 + r()) % 1);
          c.save(); c.globalAlpha *= Math.sin(q * Math.PI) * 0.8;
          c.fillStyle = col.ash;
          c.fillRect(x + (r() - 0.5) * s * 0.7 + Math.sin(t + i) * 4 * S.u, y + s * 0.05 - q * s * 0.45, 3 * S.u, 2.2 * S.u);
          c.restore();
        }
      } else if (k === 1) {
        S.ashPile(x - s * 0.04, y + s * 0.32, s * 0.9, s * 0.4, { seed: 6, glow: 0.65 * heat });
        // o sopro: dois traços de vento levando a cinza
        c.save();
        c.strokeStyle = TC.rgba(col.ash, 0.8); c.lineWidth = 3 * S.u; c.lineCap = 'round';
        for (var j = 0; j < 2; j++) {
          var off = j * s * 0.16, ph = (t * 0.8 + j * 0.4) % 1;
          c.beginPath();
          c.moveTo(x - s * 0.45, y - s * 0.12 + off);
          c.quadraticCurveTo(x, y - s * 0.32 + off, x + s * 0.28 + ph * s * 0.08, y - s * 0.2 + off);
          c.stroke();
        }
        c.restore();
        var r2 = TC.rng(12);
        for (var m = 0; m < 6; m++) {
          var q2 = ((t * 0.6 + r2()) % 1);
          c.save(); c.globalAlpha *= (1 - q2) * 0.9;
          c.fillStyle = m % 2 ? col.ash : col.paper;
          c.fillRect(x - s * 0.1 + q2 * s * 0.55, y + s * 0.02 - q2 * s * 0.28 + r2() * s * 0.1, 3 * S.u, 2.2 * S.u);
          c.restore();
        }
      } else if (k === 2) {
        S.coal(x, y + s * 0.12, s * 0.33, { heat: heat, seed: 7 });
        if (heat > 0.3 && !cold) S.sparks({ count: 4, seed: 9, area: { x: x - s * 0.25, y: y - s * 0.55, w: s * 0.5, h: s * 0.6 }, alpha: heat, scale: 0.8 });
      } else if (k === 3) {
        S.coal(x, y + s * 0.36, s * 0.16, { heat: heat * 0.8, seed: 2 });
        S.flame(x, y - s * 0.06, s * 0.8, col.ember, { flicker: cold ? 0 : 0.4 + 0.6 * heat });
      } else {
        // a marca: a chama gravada no papel
        c.save();
        c.translate(x, y); c.rotate(-0.1);
        S.shadow(0.4);
        S.fillRRect(-s * 0.38, -s * 0.38, s * 0.76, s * 0.76, 4 * S.u, cold ? col.paper : col.paper);
        S.shadow(0);
        c.save(); c.globalAlpha *= 0.4; S.blur(6 * S.u);
        S.flame(0, s * 0.02, s * 0.56, col.crust, {});
        c.restore();
        S.flame(0, s * 0.02, s * 0.5, TC.mixHex(col.crust, col.ink, 0.3), {});
        if (heat > 0.02) {
          c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha *= heat * 0.5;
          S.glow(0.8, col.glow);
          S.flame(0, s * 0.02, s * 0.5, TC.rgba(col.ember, 0.4), {});
          c.restore();
        }
        c.restore();
      }
    } finally {
      S.col = keep;
    }
  }
  TC.stageIcon = stageIcon;

  // curva suave passando por pontos
  function smoothPath(c, P) {
    c.moveTo(P[0][0], P[0][1]);
    for (var i = 0; i < P.length - 1; i++) {
      var p0 = P[Math.max(0, i - 1)], p1 = P[i], p2 = P[i + 1], p3 = P[Math.min(P.length - 1, i + 2)];
      c.bezierCurveTo(p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6, p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6, p2[0], p2[1]);
    }
  }

  // ------------------------------------------------------------------
  // Trilha da Brasa — o processo, da cinza à marca
  // ------------------------------------------------------------------
  TC.register({
    id: 'trilha-brasa',
    name: 'Trilha da Brasa',
    category: 'guiar',
    duration: 5.5,
    minDur: 3,
    thumb: 3.2,
    description: 'As etapas do teu processo num caminho ondulado. Cada etapa tem um ícone da cinza à brasa (cinza, sopro, brasa, chama, marca): a atual acende, as próximas ainda estão frias.',
    uso: 'Sempre que o vídeo fala de uma etapa. A pessoa vê o todo e onde está nele. Repetida em vários vídeos, a trilha vira o desenho do teu método na cabeça de quem assiste.',
    params: [
      { key: 'rotulo', label: 'Rótulo', type: 'text', default: 'O PROCESSO' },
      { key: 'etapas', label: 'Etapas (separa por vírgula)', type: 'text', default: 'raio-x, a frase, o filtro, o eixo, antes e depois' },
      { key: 'ativa', label: 'Etapa atual (número)', type: 'number', min: 1, max: 9, default: 3 },
      { key: 'ondulacao', label: 'Ondulação do caminho (0 a 100)', type: 'number', min: 0, max: 100, default: 45 },
      { key: 'posicao', label: 'Posição', type: 'select', options: ['topo', 'centro', 'baixo'], default: 'topo' },
      { key: 'fundo', label: 'Fundo', type: 'select', options: ['painel', 'nenhum'], default: 'painel' }
    ],
    draw: function (S, t) {
      var c = S.c, u = S.u, w = S.w, h = S.h, col = S.col, p = S.p, D = S.dur;
      var steps = TC.splitList(p.etapas);
      if (!steps.length) return;
      var n = steps.length, a = TC.clamp(Math.round(Number(p.ativa) || 1), 1, n) - 1;
      var panelW = S.vertical ? w - 100 * u : Math.min(w * 0.8, 1500 * u);
      var pad = 46 * u, px = (w - panelW) / 2;
      var amp = TC.clamp(Number(p.ondulacao), 0, 100) / 100 * 30 * u;
      var iconS = Math.min((S.vertical ? 118 : 130) * u, (panelW - pad * 2) / n * 0.78);
      var bigSize = (S.vertical ? 96 : 100) * u;
      S.font('display', bigSize, 400);
      var bigAsc = S.capH();
      var rowY = pad + 26 * u;
      var bigBase = rowY + 34 * u + bigAsc;
      var iconY = bigBase + 70 * u + iconS / 2 + amp;
      var labelY = iconY + iconS / 2 + amp + 44 * u;
      var H = labelY + 30 * u;
      var y0 = p.posicao === 'baixo' ? S.safe.bottom - H : p.posicao === 'centro' ? h * 0.5 - H / 2 : S.safe.top + 10 * u;

      var inK = S.inK(0, 0.6), out = S.outK(D - 0.5, D);
      var vis = inK * (1 - out);
      if (vis <= 0.001) return;
      c.save();
      c.globalAlpha *= Math.min(1, inK * 1.5) * (1 - out);
      c.translate(px, y0 + (1 - inK) * -24 * u + out * -16 * u);
      if (p.fundo !== 'nenhum') {
        c.save(); S.shadow(0.9);
        S.fillRRect(0, 0, panelW, H, 32 * u, TC.rgba(col.ink, 0.94));
        c.restore();
      }
      var sh = p.fundo === 'nenhum' ? 0.9 : 0;

      // rótulo + contador
      var rk = S.inK(0.25, 0.7);
      c.save(); c.globalAlpha *= rk; S.shadow(sh);
      S.flame(pad + 12 * u, rowY - 9 * u, 28 * u, col.ember, { flicker: 0.3 });
      S.label(p.rotulo, pad + 36 * u, rowY, { size: 22, weight: 600, color: col.ash });
      S.font('sans', 26 * u, 500);
      var tot = ' / ' + TC.pad2(n);
      S.text(tot, panelW - pad, rowY, { align: 'right', color: col.ash });
      var tw = S.measure(tot);
      S.font('sans', 26 * u, 700);
      S.text(TC.pad2(a + 1), panelW - pad - tw, rowY, { align: 'right', color: col.paper });
      c.restore();

      // nome grande da etapa atual
      var bk = S.inK(1.0, 1.6);
      c.save(); c.globalAlpha *= bk; S.blur((1 - bk) * 10 * u); S.shadow(sh);
      S.fit(steps[a], 'display', 400, panelW - pad * 2, bigSize, 30 * u);
      S.text(steps[a], pad, bigBase + (1 - bk) * 20 * u, { color: col.paper });
      c.restore();

      // pontos do caminho (os ícones moram nele)
      var x0 = pad + iconS / 2, x1 = panelW - pad - iconS / 2;
      var pts = [];
      for (var i = 0; i < n; i++) {
        var xx = n === 1 ? panelW / 2 : TC.lerp(x0, x1, i / (n - 1));
        pts.push([xx, iconY + (i % 2 ? 1 : -1) * amp]);
      }
      var L = S.inK(0.4, 1.5);
      if (n > 1) {
        // caminho inteiro, frio
        c.save();
        S.clipRect(0, 0, TC.lerp(x0, x1, L) + 2, H);
        c.beginPath(); smoothPath(c, pts);
        c.strokeStyle = TC.rgba(col.ash, 0.4); c.lineWidth = 3 * u; c.setLineDash([2 * u, 9 * u]); c.lineCap = 'round';
        c.stroke();
        c.restore();
        // trecho percorrido, quente
        c.save();
        S.clipRect(0, 0, Math.min(TC.lerp(x0, x1, L), pts[a][0]), H);
        c.beginPath(); smoothPath(c, pts);
        var gr = c.createLinearGradient(x0, 0, pts[a][0] || x0 + 1, 0);
        gr.addColorStop(0, TC.rgba(col.ash, 0.6)); gr.addColorStop(1, col.ember);
        c.strokeStyle = gr; c.lineWidth = 5 * u; c.lineCap = 'round';
        c.stroke();
        c.restore();
      }
      // ícones + rótulos
      var labSize = 24 * u, labs = steps.map(function (s2) { return s2.toLocaleLowerCase('pt-BR'); });
      var spacing = n > 1 ? (x1 - x0) / (n - 1) : panelW;
      for (var g = 0; g < 12; g++) {
        S.font('sans', labSize, 600);
        var ok = true;
        for (var q = 0; q < n - 1; q++) if ((S.measure(labs[q]) + S.measure(labs[q + 1])) / 2 + 14 * u > spacing) ok = false;
        if (n > 1 && (S.measure(labs[0]) / 2 > x0 + pad * 0.4 || S.measure(labs[n - 1]) / 2 > panelW - x1 + pad * 0.4)) ok = false;
        if (ok || labSize < 15 * u) break;
        labSize *= 0.92;
      }
      var heatNow = S.inK(1.4, 2.1), breath = 0.8 + 0.2 * Math.sin(t * 2);
      for (var j = 0; j < n; j++) {
        var reach = n === 1 ? 1 : TC.clamp((L * (n - 1) - j + 0.6) / 0.6, 0, 1);
        var ik = S.ein(reach);
        if (ik <= 0.001) continue;
        var kIcon = n === 1 ? 2 : Math.round(j * 4 / (n - 1));
        var ix = pts[j][0], iy = pts[j][1];
        var current = j === a, past = j < a;
        var heat = current ? heatNow * breath : past ? 0.55 : 0;
        var sc = ik * (current ? 1 + 0.12 * heatNow : 0.9);
        c.save();
        c.globalAlpha *= Math.min(1, ik * 1.4) * (j > a ? 0.55 : 1);
        if (current && heatNow > 0) {
          c.save(); c.globalCompositeOperation = 'lighter';
          var hg = c.createRadialGradient(ix, iy, 0, ix, iy, iconS * 0.9);
          hg.addColorStop(0, TC.rgba(col.glow, 0.32 * heatNow * breath)); hg.addColorStop(1, TC.rgba(col.glow, 0));
          c.fillStyle = hg; c.fillRect(ix - iconS, iy - iconS, iconS * 2, iconS * 2);
          c.restore();
        }
        c.translate(ix, iy); c.scale(sc, sc); c.translate(-ix, -iy);
        stageIcon(S, kIcon, ix, iy, iconS, heat, j > a || (current && heatNow < 0.05));
        c.restore();
        // rótulo
        c.save();
        c.globalAlpha *= Math.min(1, ik * 1.4);
        S.shadow(sh);
        S.font('sans', labSize, current ? 700 : 600);
        S.text(labs[j], ix, labelY, { align: 'center', color: current ? TC.mixHex(col.ash, col.ember, heatNow) : past ? col.paper : col.ash });
        c.restore();
      }
      c.restore();
    }
  });

  // ------------------------------------------------------------------
  // Capítulo — entra subindo com borda acesa, sai do mesmo jeito
  // ------------------------------------------------------------------
  function slotNumber(S, str, x, base, cap, t0, color) {
    var c = S.c;
    c.save();
    S.clipRect(x - 10 * S.u, base - cap - 20 * S.u, S.w, cap + 40 * S.u);
    c.fillStyle = color; c.textAlign = 'left'; c.textBaseline = 'alphabetic';
    var cx = x, lineH = cap * 1.35;
    for (var i = 0; i < str.length; i++) {
      var ch = str[i], cw = c.measureText(ch).width;
      var k = S.inK(t0 + i * 0.09, t0 + 0.8 + i * 0.09);
      if (/[0-9]/.test(ch)) {
        var d = Number(ch);
        for (var s = 0; s <= 4; s++) c.fillText(String((d - 4 + s + 20) % 10), cx, base + (s - 4 * k) * lineH);
      } else c.fillText(ch, cx, base + (1 - k) * lineH);
      cx += cw;
    }
    c.restore();
  }

  TC.register({
    id: 'capitulo',
    name: 'Capítulo',
    category: 'guiar',
    duration: 3.8,
    minDur: 2.4,
    thumb: 1.9,
    description: 'Cartela de parte com número rolando. Ela sobe de baixo com uma borda acesa, como papel pegando fogo ao contrário, e sai do mesmo jeito.',
    uso: 'Vídeo com mais de um minuto. Dividir em partes avisa que tem estrutura, e estrutura é o que faz a pessoa ficar.',
    params: [
      { key: 'rotulo', label: 'Rótulo', type: 'text', default: 'PARTE' },
      { key: 'numero', label: 'Número', type: 'text', default: '02' },
      { key: 'total', label: 'Total (opcional)', type: 'text', default: '05' },
      { key: 'titulo', label: 'Título', type: 'text', default: 'o tesão que virou peso' },
      { key: 'subtitulo', label: 'Subtítulo (opcional)', type: 'text', default: '' },
      { key: 'modo', label: 'Modo', type: 'select', options: ['cartela', 'faixa'], default: 'cartela' },
      { key: 'fundo', label: 'Fundo', type: 'select', options: ['tinta', 'papel'], default: 'tinta' }
    ],
    draw: function (S, t) {
      var c = S.c, u = S.u, w = S.w, h = S.h, col = S.col, p = S.p, D = S.dur;
      var band = p.modo === 'faixa', paper = p.fundo === 'papel';
      var area = band ? (S.vertical ? { x: 0, y: h * 0.37, w: w, h: h * 0.26 } : { x: 0, y: h * 0.29, w: w, h: h * 0.42 }) : { x: 0, y: 0, w: w, h: h };
      var kin = S.inK(0, 1.0), kout = S.outK(D - 0.8, D);
      var ink = paper ? col.ink : col.paper;
      var L = S.layer('cap', w, h);
      var numStr = String(p.numero || ''), label = String(p.rotulo || '');
      S.into(L, function (lc) {
        lc.save();
        lc.beginPath(); lc.rect(area.x, area.y, area.w, area.h); lc.clip();
        S.paper(paper ? col.paper : col.ink, { dark: !paper });
        lc.restore();
        var row = !S.vertical || band;
        if (!row) {
          var mx = 90 * u;
          S.font('display', 440 * u, 400);
          var cap = S.capH(), labY = h * 0.32, base = labY + 40 * u + cap;
          lc.save(); lc.globalAlpha *= S.inK(0.4, 0.9);
          S.label(label, mx + 6 * u, labY, { size: 28, color: col.ash });
          lc.restore();
          S.font('display', 440 * u, 400);
          var nw = S.measure(numStr);
          slotNumber(S, numStr, mx, base, cap, 0.3, col.ember);
          if (p.total) {
            lc.save(); lc.globalAlpha *= S.inK(0.8, 1.2);
            S.font('sans', 40 * u, 500);
            S.text('/ ' + p.total, mx + nw + 24 * u, base - cap + 40 * u, { color: col.ash });
            lc.restore();
          }
          var ty = base + 80 * u;
          S.fit(p.titulo, 'display', 400, w - mx * 2, 150 * u, 50 * u);
          var tcap = S.capH(), tk = S.inK(0.6, 1.3);
          lc.save(); lc.globalAlpha *= tk; S.blur((1 - tk) * 10 * u);
          S.text(p.titulo, mx, ty + tcap + (1 - tk) * 24 * u, { color: ink });
          lc.restore();
          if (p.subtitulo) {
            var sk = S.inK(0.9, 1.5);
            lc.save(); lc.globalAlpha *= sk; S.blur((1 - sk) * 6 * u);
            S.font('sans', 46 * u, 500, true);
            var lines = S.wrap(p.subtitulo, w - mx * 2);
            for (var i = 0; i < lines.length; i++) S.text(lines[i], mx, ty + tcap + 90 * u + i * 60 * u, { color: col.ash });
            lc.restore();
          }
        } else {
          S.font('display', 100 * u, 400);
          var numSize = 100 * u * (area.h * (band ? 0.56 : 0.42)) / S.capH();
          S.font('display', numSize, 400);
          var cap2 = S.capH(), mx2 = band ? w * 0.07 : w * 0.09, nw2 = S.measure(numStr);
          var base2 = area.y + area.h / 2 + cap2 / 2;
          slotNumber(S, numStr, mx2, base2, cap2, 0.3, col.ember);
          var tx = mx2 + nw2 + (band ? 40 : 70) * u, colW = w - tx - mx2;
          var tSize = S.fit(p.titulo, 'display', 400, colW, band ? cap2 * 0.62 : 150 * u, 36 * u);
          var tcap2 = S.capH(), labSize = Math.max(20, tSize / u * 0.2);
          var subSize = Math.max(24 * u, tSize * 0.3);
          var blockH = labSize * u + 26 * u + tcap2 + (p.subtitulo ? 30 * u + subSize : 0);
          var by = area.y + area.h / 2 - blockH / 2;
          lc.save(); lc.globalAlpha *= S.inK(0.45, 0.9);
          S.label(label + (p.total ? '  ' + numStr + ' / ' + p.total : ''), tx, by + labSize * u * 0.8, { size: labSize, color: col.ash });
          lc.restore();
          var tTop = by + labSize * u + 26 * u, tk2 = S.inK(0.6, 1.3);
          lc.save(); lc.globalAlpha *= tk2; S.blur((1 - tk2) * 10 * u);
          S.font('display', tSize, 400);
          S.text(p.titulo, tx, tTop + tcap2 + (1 - tk2) * 20 * u, { color: ink });
          lc.restore();
          if (p.subtitulo) {
            var sk2 = S.inK(1.0, 1.5);
            lc.save(); lc.globalAlpha *= sk2;
            S.font('sans', subSize, 500, true);
            S.text(p.subtitulo, tx, tTop + tcap2 + 26 * u + subSize, { color: col.ash });
            lc.restore();
          }
        }
      });
      var F1 = S.field({ rect: area, dir: [0.15, 1], noise: 0.3, P: 1.1 - 1.2 * kin, edge: 0.03, res: 0.2, seed: 5, soft: 0.01 });
      S.applyKeep(L, F1, false, true);
      var F2 = null;
      if (kout > 0) {
        F2 = S.field({ rect: area, dir: [-0.15, -1], noise: 0.3, P: -0.1 + 1.2 * kout, edge: 0.03, res: 0.2, seed: 6, soft: 0.01 });
        S.applyKeep(L, F2, false, true);
      }
      c.drawImage(L, 0, 0);
      if (kin < 1) S.drawGlow(F1, 0.9);
      if (F2) S.drawGlow(F2, 0.9);
    }
  });

  // ------------------------------------------------------------------
  // Contador — "dica 03 / 07" com brasas de progresso
  // ------------------------------------------------------------------
  TC.register({
    id: 'contador',
    name: 'Contador',
    category: 'guiar',
    duration: 5,
    minDur: 1.6,
    thumb: 2.0,
    description: 'Etiqueta no canto com a chama, "dica 03 / 07" e uma fileira de brasas: as que já foram ficam acesas, a atual respira, as próximas esperam frias.',
    uso: 'Listas e sequências. Ver "3 de 7" faz a pessoa ficar até o 7. Coloca no começo de cada item.',
    params: [
      { key: 'rotulo', label: 'Rótulo', type: 'text', default: 'dica' },
      { key: 'atual', label: 'Número atual', type: 'number', min: 1, max: 99, default: 3 },
      { key: 'total', label: 'Total', type: 'number', min: 1, max: 99, default: 7 },
      { key: 'canto', label: 'Canto', type: 'select', options: ['topo-esq', 'topo-dir', 'baixo-esq', 'baixo-dir'], default: 'topo-esq' }
    ],
    draw: function (S, t) {
      var c = S.c, w = S.w, col = S.col, p = S.p, D = S.dur;
      var u = S.u * (S.vertical ? 1.3 : 1);
      var total = Math.max(1, Math.round(Number(p.total) || 1)), cur = TC.clamp(Math.round(Number(p.atual) || 1), 1, total);
      var H = 76 * u, R = H / 2;
      var label = String(p.rotulo || '');
      S.font('sans', 26 * u, 600); var labW = label ? S.measure(label) + 12 * u : 0;
      S.font('sans', 30 * u, 700); var numW = S.measure(TC.pad2(cur));
      S.font('sans', 26 * u, 500); var totW = S.measure(' / ' + TC.pad2(total));
      var pillW = H + 6 * u + labW + numW + totW + 30 * u;
      var right = String(p.canto).indexOf('dir') >= 0, bottomPos = String(p.canto).indexOf('baixo') >= 0;
      var x = right ? w - S.safe.side - pillW : S.safe.side;
      var y = bottomPos ? S.safe.bottom - H - 40 * u : S.safe.top + 10 * u;
      var pop = S.inK(0, 0.45), grow = S.inK(0.2, 0.75);
      var shrink = S.outK(D - 0.6, D - 0.25), gone = S.outK(D - 0.3, D);
      var wk = grow * (1 - shrink), sc = (0.6 + 0.4 * pop) * (1 - gone);
      if (pop <= 0 || gone >= 1) return;
      var ax = right ? x + pillW - R : x + R, ay = y + R;
      c.save();
      c.globalAlpha *= Math.min(1, pop * 2) * (1 - gone);
      c.translate(ax, ay); c.scale(sc, sc); c.translate(-ax, -ay);
      var curW = H + (pillW - H) * wk;
      c.save(); S.shadow(0.6);
      S.fillRRect(right ? x + pillW - curW : x, y, curW, H, R, TC.rgba(col.ink, 0.92));
      c.restore();
      S.flame(ax, ay, H * 0.52, col.ember, { flicker: 0.5, height: TC.clamp(pop * 1.2, 0, 1) });
      var tk = S.inK(0.45, 0.85) * (1 - S.lin(D - 0.65, D - 0.45));
      if (tk > 0) {
        c.save();
        S.clipRect(right ? x + pillW - curW : x, y, curW, H);
        c.globalAlpha *= tk;
        var tx = right ? x + 26 * u : x + H + 4 * u, base = y + H / 2 + 10 * u;
        if (label) { S.font('sans', 26 * u, 600); S.text(label, tx, base, { color: col.ash }); tx += labW; }
        S.font('sans', 30 * u, 700);
        var rk = S.inK(0.7, 1.2);
        c.save(); S.clipRect(tx - 4 * u, y + 6 * u, numW + 8 * u, H - 12 * u);
        S.text(TC.pad2(Math.max(0, cur - 1)), tx, base + 1 * u - rk * H, { color: col.paper });
        S.text(TC.pad2(cur), tx, base + 1 * u + (1 - rk) * H, { color: col.paper });
        c.restore();
        tx += numW;
        S.font('sans', 26 * u, 500);
        S.text(' / ' + TC.pad2(total), tx, base, { color: col.ash });
        c.restore();
      }
      // brasas de progresso
      var bk = S.inK(0.6, 1.1) * (1 - shrink);
      if (bk > 0) {
        var gap = Math.min(28 * u, (pillW - 16 * u) / Math.max(1, total - 1)), by = y + H + 24 * u;
        var bx0 = right ? x + pillW - 10 * u - gap * (total - 1) : x + 10 * u;
        var ign = S.inK(1.0, 1.6), breath = 0.75 + 0.25 * Math.sin(t * 2.2);
        for (var i = 0; i < total; i++) {
          var appear = TC.clamp(bk * total * 1.2 - i * 0.6, 0, 1);
          if (appear <= 0) continue;
          var cx = bx0 + i * gap;
          c.save(); c.globalAlpha *= appear;
          if (i < cur - 1) {
            c.fillStyle = TC.rgba(col.ember, 0.75); c.beginPath(); c.arc(cx, by, 5 * u, 0, Math.PI * 2); c.fill();
          } else if (i === cur - 1) {
            c.save(); c.globalCompositeOperation = 'lighter';
            var g = c.createRadialGradient(cx, by, 0, cx, by, 22 * u);
            g.addColorStop(0, TC.rgba(col.hot, 0.8 * ign * breath)); g.addColorStop(1, TC.rgba(col.glow, 0));
            c.fillStyle = g; c.fillRect(cx - 22 * u, by - 22 * u, 44 * u, 44 * u);
            c.restore();
            c.fillStyle = TC.mixHex(col.ash, col.ember, ign); c.beginPath(); c.arc(cx, by, 7 * u, 0, Math.PI * 2); c.fill();
          } else {
            c.strokeStyle = TC.rgba(col.ash, 0.8); c.lineWidth = 2 * u;
            c.beginPath(); c.arc(cx, by, 4.5 * u, 0, Math.PI * 2); c.stroke();
          }
          c.restore();
        }
      }
      c.restore();
    }
  });

  // ------------------------------------------------------------------
  // Lista — cada item acende uma brasa
  // ------------------------------------------------------------------
  TC.register({
    id: 'lista',
    name: 'Lista',
    category: 'guiar',
    duration: 6,
    minDur: 2.6,
    thumb: 3.4,
    description: 'Título pequeno e itens em minúsculas entrando um a um. O marcador de cada item é uma brasa que acende quando ele chega.',
    uso: 'Quando a fala enumera. Ler e ouvir ao mesmo tempo fixa mais, desde que o item seja curto (até 4 palavras).',
    params: [
      { key: 'titulo', label: 'Título', type: 'text', default: 'QUEM AMA O QUE FAZ' },
      { key: 'itens', label: 'Itens (um por linha)', type: 'textarea', default: 'não precisa se forçar\nnão performa\nnão busca atalho\ntransborda' },
      { key: 'marcador', label: 'Marcador', type: 'select', options: ['brasa', 'numero', 'traço'], default: 'brasa' },
      { key: 'fundo', label: 'Fundo', type: 'select', options: ['painel', 'nenhum'], default: 'painel' }
    ],
    draw: function (S, t) {
      var c = S.c, u = S.u, w = S.w, h = S.h, col = S.col, p = S.p, D = S.dur;
      var raw = String(p.itens || '');
      var items = TC.splitList(raw.indexOf('\n') >= 0 ? raw : raw.replace(/,/g, '\n'));
      var n = items.length;
      var panelW = S.vertical ? w - 140 * u : Math.max(w * 0.42, 700 * u);
      var pad = 54 * u, markW = 46 * u;
      var size = (S.vertical ? 68 : 56) * u;
      S.font('sans', size, 700);
      var widest = 0;
      for (var i = 0; i < n; i++) widest = Math.max(widest, S.measure(items[i]));
      var avail = panelW - pad * 2 - markW - 20 * u;
      if (widest > avail) size *= avail / widest;
      S.font('sans', size, 700);
      var cap = S.xH() * 1.35, step = size * 1.5;
      var titleH = p.titulo ? 76 * u : 0;
      var panelH = pad * 2 + titleH + n * step - (step - size) * 0.5;
      var px = S.vertical ? 70 * u : w * 0.07, py = (S.vertical ? h * 0.46 : h * 0.5) - panelH / 2;
      var inK = S.inK(0, 0.55), out = S.outK(D - 0.55, D);
      c.save();
      c.globalAlpha *= Math.min(1, inK * 1.5) * (1 - out);
      c.translate((1 - inK) * -30 * u, out * -20 * u);
      var panel = p.fundo !== 'nenhum';
      if (panel) { c.save(); S.shadow(0.9); S.fillRRect(px, py, panelW, panelH, 30 * u, TC.rgba(col.ink, 0.93)); c.restore(); }
      var sh = panel ? 0 : 0.9;
      var x = px + pad, y = py + pad;
      if (p.titulo) {
        var tk = S.inK(0.3, 0.8);
        c.save(); c.globalAlpha *= tk; S.shadow(sh);
        S.label(p.titulo, x, y + 22 * u, { size: 24, weight: 600, color: col.ash });
        c.restore();
        y += titleH;
      }
      var breath = 0.75 + 0.25 * Math.sin(t * 2);
      for (var j = 0; j < n; j++) {
        var t0 = 0.6 + j * 0.3;
        var k = S.inK(t0, t0 + 0.6), heat = S.inK(t0 + 0.1, t0 + 0.6);
        if (k <= 0) continue;
        var base = y + j * step + size * 0.8;
        var mcx = x + 14 * u, mcy = base - cap * 0.5;
        c.save(); c.globalAlpha *= Math.min(1, k * 1.3);
        if (p.marcador === 'numero') {
          S.font('sans', size * 0.5, 700);
          S.text(TC.pad2(j + 1), x, base - cap * 0.08, { color: TC.mixHex(col.ash, col.ember, heat) });
        } else if (p.marcador === 'traço') {
          c.fillStyle = TC.mixHex(col.ash, col.ember, heat);
          c.fillRect(x, mcy - 2 * u, 26 * u * k, 4 * u);
        } else {
          S.coal(mcx, mcy, 11 * u, { heat: heat * (0.55 + 0.45 * breath), seed: 20 + j });
        }
        c.restore();
        c.save();
        c.globalAlpha *= k;
        S.blur((1 - k) * 8 * u);
        S.shadow(sh);
        S.font('sans', size, 700);
        S.text(items[j], x + markW + 20 * u - (1 - k) * 30 * u, base, { color: col.paper });
        c.restore();
      }
      c.restore();
    }
  });
})(typeof window !== 'undefined' ? window : this);
