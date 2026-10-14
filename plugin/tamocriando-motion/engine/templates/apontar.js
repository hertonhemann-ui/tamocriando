/* Apontar: quem fala, o que olhar */
(function (root) {
  'use strict';
  var TC = root.TC;

  // ------------------------------------------------------------------
  // Nome — a chama acende, o nome entra
  // ------------------------------------------------------------------
  TC.register({
    id: 'nome',
    name: 'Nome',
    category: 'apontar',
    duration: 5,
    minDur: 2.6,
    thumb: 2.4,
    description: 'A chama acende ao lado do nome em minúsculas e a frase de posicionamento entra embaixo, com o trecho que importa em brasa. Na saída a chama se apaga.',
    uso: 'Primeiros segundos de quem fala: tu, cliente, convidado. Credencial em uma linha, sem currículo.',
    params: [
      { key: 'chama', label: 'Chama', type: 'select', options: ['stop motion', 'suave'], default: 'stop motion' },
      { key: 'nome', label: 'Nome', type: 'text', fromBrand: 'nome', default: 'herton hemann' },
      { key: 'cargo', label: 'Frase de baixo', type: 'text', fromBrand: 'cargo', default: 'estrategista que elimina o cinza e acende a devoção.' },
      { key: 'destaque', label: 'Trecho em brasa', type: 'text', fromBrand: 'destaqueCargo', default: 'acende a devoção.' },
      { key: 'lado', label: 'Lado', type: 'select', options: ['esq', 'dir'], default: 'esq' },
      { key: 'fundo', label: 'Leitura', type: 'select', options: ['painel', 'sombra'], default: 'painel' }
    ],
    draw: function (S, t) {
      var c = S.c, w = S.w, h = S.h, col = S.col, p = S.p, D = S.dur;
      var u = S.u * (S.vertical ? 1.12 : 1);
      var nameS = (S.vertical ? 68 : 60) * u, cargoS = (S.vertical ? 27 : 24) * u;
      var fh = nameS * 1.25, fw = fh * 0.7;
      var pad = 34 * u, gap = 22 * u;
      var maxText = w - S.safe.side * 2 - pad * 2 - fw - gap;
      S.font('display', nameS, 400);
      var nw = S.measure(p.nome);
      if (nw > maxText) { nameS *= maxText / nw; S.font('display', nameS, 400); nw = S.measure(p.nome); }
      S.font('sans', cargoS, 500);
      var lay = S.flow(p.cargo || '', { maxW: Math.max(nw * 1.25, Math.min(maxText, 640 * u)), lineH: cargoS * 1.35 });
      var textW = Math.max(nw, lay.width);
      var nAsc = nameS * 0.8;
      var blockH = nAsc + 18 * u + (p.cargo ? lay.height : 0);
      var panelH = blockH + pad * 2, panelW = pad * 2 + fw + gap + textW;
      var right = p.lado === 'dir';
      var x = right ? w - S.safe.side - panelW : S.safe.side;
      var cy = S.vertical ? h * 0.72 : h * 0.8;
      var y = cy - panelH / 2;
      var panel = p.fundo !== 'sombra';
      var grow = S.inK(0, 0.55) * (1 - S.outK(D - 0.45, D - 0.05));
      var ign = S.inK(0.1, 0.8) * (1 - S.outK(D - 0.65, D - 0.1));
      var tOut = S.outK(D - 0.65, D - 0.3);

      c.save();
      if (panel && grow > 0) {
        var pw = panelW * grow;
        c.save(); S.shadow(0.8);
        S.fillRRect(right ? x + panelW - pw : x, y, pw, panelH, 26 * u, TC.rgba(col.ink, 0.9));
        c.restore();
      }
      var fx = right ? x + panelW - pad - fw / 2 : x + pad + fw / 2, fy = cy;
      if (ign > 0.005) {
        c.save(); c.globalCompositeOperation = 'lighter';
        var g = c.createRadialGradient(fx, fy, 0, fx, fy, fh);
        g.addColorStop(0, TC.rgba(col.glow, 0.25 * ign)); g.addColorStop(1, TC.rgba(col.glow, 0));
        c.fillStyle = g; c.fillRect(fx - fh, fy - fh, fh * 2, fh * 2);
        c.restore();
        S.flame(fx, fy, fh, col.ember, { flicker: 0.5, height: ign });
      }
      var tx = right ? x + pad : x + pad + fw + gap;
      var sh = panel ? 0 : 0.9;
      var nk = S.inK(0.35, 0.95);
      c.save();
      c.globalAlpha *= nk * (1 - tOut);
      S.blur((1 - nk) * 8 * u + tOut * 8 * u);
      S.shadow(sh);
      S.font('display', nameS, 400);
      S.text(p.nome, right ? x + pad + textW - nw : tx, y + pad + nAsc + (1 - nk) * 16 * u - tOut * 12 * u, { color: col.paper });
      c.restore();
      if (p.cargo) {
        var hi = TC.wordSet(p.destaque);
        S.font('sans', cargoS, 500);
        var by = y + pad + nAsc + 18 * u + cargoS;
        for (var i = 0; i < lay.words.length; i++) {
          var wd = lay.words[i], wk = S.inK(0.55 + i * 0.03, 1.1 + i * 0.03);
          if (wk <= 0) continue;
          c.save();
          c.globalAlpha *= wk * (1 - tOut);
          S.shadow(sh);
          S.text(wd.text, tx + wd.x, by + wd.y - tOut * 12 * u, { color: hi[wd.key] ? col.ember : col.ash });
          c.restore();
        }
      }
      c.restore();
    }
  });

  // ------------------------------------------------------------------
  // Anotação — caneta em brasa riscando por cima do vídeo
  // ------------------------------------------------------------------
  TC.register({
    id: 'anotacao',
    drag: { x: 'x', y: 'y' },
    name: 'Anotação',
    category: 'apontar',
    duration: 3.5,
    minDur: 1.6,
    thumb: 2.0,
    description: 'Traço de caneta em brasa feito à mão: círculo, sublinhado, seta, xis ou colchete, com um rótulo pequeno. A mesma linguagem das tuas thumbnails, em movimento.',
    uso: 'Pra apontar uma coisa no vídeo: um rosto, um número na tela, um print. Posição e tamanho em % do quadro.',
    params: [
      { key: 'tipo', label: 'Tipo', type: 'select', options: ['círculo', 'sublinhado', 'seta', 'xis', 'colchete'], default: 'círculo' },
      { key: 'x', label: 'Centro X (%)', type: 'number', min: 0, max: 100, default: 50 },
      { key: 'y', label: 'Centro Y (%)', type: 'number', min: 0, max: 100, default: 34 },
      { key: 'largura', label: 'Largura (%)', type: 'number', min: 2, max: 100, default: 48 },
      { key: 'altura', label: 'Altura (%)', type: 'number', min: 1, max: 100, default: 16 },
      { key: 'rotulo', label: 'Rótulo (opcional)', type: 'text', default: 'REPARA NISSO' },
      { key: 'cor', label: 'Cor', type: 'select', options: ['brasa', 'papel', 'tinta'], default: 'brasa' },
      { key: 'espessura', label: 'Espessura', type: 'number', min: 2, max: 40, default: 10 }
    ],
    draw: function (S, t) {
      var c = S.c, u = S.u, w = S.w, h = S.h, col = S.col, p = S.p, D = S.dur;
      var color = p.cor === 'papel' ? col.paper : p.cor === 'tinta' ? col.ink : col.ember;
      var cx = w * TC.clamp(Number(p.x), 0, 100) / 100, cy = h * TC.clamp(Number(p.y), 0, 100) / 100;
      var bw = w * TC.clamp(Number(p.largura), 1, 100) / 100, bh = h * TC.clamp(Number(p.altura), 1, 100) / 100;
      var thick = TC.clamp(Number(p.espessura) || 10, 2, 40);
      var r = TC.rng(TC.hashStr(p.tipo + p.x + p.y));
      var out = S.outK(D - 0.4, D);
      var strokes = [];
      var labelAt = [cx - bw / 2, cy - bh / 2 - 26 * u];
      if (p.tipo === 'sublinhado') {
        var pts = [];
        for (var i = 0; i <= 40; i++) {
          var k = i / 40;
          pts.push([cx - bw / 2 + bw * k, cy + Math.sin(k * 5 + r() * 0.2) * 4 * u + k * 6 * u]);
        }
        strokes.push({ pts: pts, a: 0.1, b: 0.65 });
        var pts2 = [];
        for (var j = 0; j <= 30; j++) { var k2 = j / 30; pts2.push([cx - bw * 0.35 + bw * 0.7 * k2, cy + 16 * u + Math.sin(k2 * 4) * 3 * u]); }
        strokes.push({ pts: pts2, a: 0.55, b: 0.95, width: 0.7 });
        labelAt = [cx - bw / 2, cy - 26 * u];
      } else if (p.tipo === 'seta') {
        var s0 = [cx - bw / 2, cy - bh / 2], s1 = [cx, cy];
        var ctrl = [s0[0] + bw * 0.1, s1[1] - bh * 0.05];
        var ap = [];
        for (var m = 0; m <= 40; m++) {
          var q = m / 40, mq = 1 - q;
          ap.push([mq * mq * s0[0] + 2 * mq * q * ctrl[0] + q * q * s1[0], mq * mq * s0[1] + 2 * mq * q * ctrl[1] + q * q * s1[1]]);
        }
        strokes.push({ pts: ap, a: 0.1, b: 0.75 });
        var ang = Math.atan2(s1[1] - ap[36][1], s1[0] - ap[36][0]), hl = 46 * u;
        strokes.push({ pts: [[s1[0] - Math.cos(ang - 0.55) * hl, s1[1] - Math.sin(ang - 0.55) * hl], s1], a: 0.72, b: 0.85 });
        strokes.push({ pts: [s1, [s1[0] - Math.cos(ang + 0.55) * hl, s1[1] - Math.sin(ang + 0.55) * hl]], a: 0.82, b: 0.95 });
        labelAt = [s0[0] - 10 * u, s0[1] - 22 * u];
      } else if (p.tipo === 'xis') {
        strokes.push({ pts: [[cx - bw / 2, cy - bh / 2], [cx + bw / 2, cy + bh / 2]], a: 0.1, b: 0.5 });
        strokes.push({ pts: [[cx + bw / 2, cy - bh / 2], [cx - bw / 2 + 6 * u, cy + bh / 2 + 4 * u]], a: 0.45, b: 0.9 });
      } else if (p.tipo === 'colchete') {
        var L = bw * 0.12;
        strokes.push({ pts: [[cx - bw / 2 + L, cy - bh / 2], [cx - bw / 2, cy - bh / 2 + 4 * u], [cx - bw / 2 + 3 * u, cy + bh / 2], [cx - bw / 2 + L, cy + bh / 2 + 3 * u]], a: 0.1, b: 0.5 });
        strokes.push({ pts: [[cx + bw / 2 - L, cy - bh / 2 + 2 * u], [cx + bw / 2, cy - bh / 2 + 6 * u], [cx + bw / 2 - 2 * u, cy + bh / 2], [cx + bw / 2 - L, cy + bh / 2 + 4 * u]], a: 0.45, b: 0.9 });
      } else {
        // círculo: um pouco mais que uma volta, como feito à mão
        var cp = [], a0 = -2.4 + r() * 0.3, turns = 1.12;
        for (var n = 0; n <= 90; n++) {
          var th = a0 + n / 90 * Math.PI * 2 * turns;
          var grow2 = 1 + 0.06 * n / 90;
          var wob = 1 + 0.035 * Math.sin(th * 3 + r());
          cp.push([cx + Math.cos(th) * bw / 2 * grow2 * wob, cy + Math.sin(th) * bh / 2 * grow2 * wob]);
        }
        strokes.push({ pts: cp, a: 0.1, b: 0.9 });
      }
      c.save();
      c.globalAlpha *= 1 - out;
      for (var s = 0; s < strokes.length; s++) {
        var st = strokes[s], k3 = S.inK(st.a, st.b);
        if (k3 <= 0) continue;
        S.shadow(p.cor === 'papel' ? 0.5 : 0.25);
        S.brush(st.pts, { width: thick * (st.width || 1), progress: k3, color: color, seed: s + 3 });
      }
      if (p.rotulo) {
        var lk = S.inK(0.55, 1.0);
        c.save();
        c.globalAlpha *= lk;
        S.blur((1 - lk) * 6 * u);
        S.shadow(0.7);
        S.label(p.rotulo, labelAt[0], labelAt[1], { size: 26, weight: 700, color: color });
        c.restore();
      }
      c.restore();
    }
  });

  // ------------------------------------------------------------------
  // Símbolo — ícone de papel recortado (stop motion)
  // ------------------------------------------------------------------
  function ell(cx, cy, rx, ry, n, squash) {
    var pts = [];
    n = n || 44;
    for (var i = 0; i < n; i++) {
      var a = i / n * Math.PI * 2, sx = 1;
      if (squash && Math.sin(a) > 0) sx = 1 - squash * Math.sin(a);
      pts.push([cx + Math.cos(a) * rx * sx, cy + Math.sin(a) * ry]);
    }
    return pts;
  }
  function rect(x0, y0, x1, y1) { return [[x0, y0], [x1, y0], [x1, y1], [x0, y1]]; }
  function band(cx, cy, r1, r2, a0, a1, n) {
    var out = [], inn = [];
    n = n || 24;
    for (var i = 0; i <= n; i++) {
      var a = a0 + (a1 - a0) * i / n;
      out.push([cx + Math.cos(a) * r2, cy + Math.sin(a) * r2]);
      inn.unshift([cx + Math.cos(a) * r1, cy + Math.sin(a) * r1]);
    }
    return out.concat(inn);
  }
  function beam(x0, y0, x1, y1, wdt) {
    var dx = x1 - x0, dy = y1 - y0, l = Math.hypot(dx, dy) || 1, nx = -dy / l * wdt / 2, ny = dx / l * wdt / 2;
    return [[x0 + nx, y0 + ny], [x1 + nx, y1 + ny], [x1 - nx, y1 - ny], [x0 - nx, y0 - ny]];
  }

  // cada ícone: lista de formas [cor, contornos..., opcional {stroke}]
  function iconShapes(name, col, t) {
    var P = col.paper, I = col.ink, E = col.ember, A = col.ash, PS = col.paperShade;
    switch (name) {
      case 'máscara': return [
        [E, beam(0.18, 0.28, 0.4, 0.6, 0.07)],
        [P, ell(0, -0.04, 0.34, 0.4, 48, 0.28)],
        [I, ell(-0.13, -0.08, 0.085, 0.05, 20)], [I, ell(0.13, -0.08, 0.085, 0.05, 20)],
        [I, band(0, 0.05, 0.14, 0.19, 0.25 * Math.PI, 0.75 * Math.PI, 16)]
      ];
      case 'espelho': return [
        [E, rect(-0.06, 0.24, 0.06, 0.5)],
        [E, ell(0, -0.1, 0.3, 0.37, 48)],
        [PS, ell(0, -0.1, 0.235, 0.3, 44)],
        [P, [[-0.12, -0.3], [-0.05, -0.33], [0.1, 0.05], [0.03, 0.08]]]
      ];
      case 'ímã': return [
        [E, band(0, 0, 0.15, 0.34, 0, Math.PI, 26)],
        [E, rect(-0.34, -0.3, -0.15, 0.01)], [E, rect(0.15, -0.3, 0.34, 0.01)],
        [P, rect(-0.34, -0.44, -0.15, -0.3)], [P, rect(0.15, -0.44, 0.34, -0.3)]
      ];
      case 'etiqueta': return [
        [P, [[-0.44, 0], [-0.25, -0.21], [0.4, -0.21], [0.4, 0.21], [-0.25, 0.21]], ell(-0.24, 0, 0.045, 0.045, 16)],
        [A, rect(-0.08, -0.07, 0.3, -0.035)], [A, rect(-0.08, 0.02, 0.18, 0.055)],
        [I, null, { stroke: [[-0.24, 0], [-0.32, -0.14], [-0.42, -0.3], [-0.38, -0.42]], w: 0.018 }]
      ];
      case 'digital': {
        var arcs = [];
        for (var k = 1; k <= 6; k++) {
          var rx = 0.04 + k * 0.042, ry = rx * 1.28, pts = [];
          var gapA = 0.6 + k * 0.4;
          for (var i = 0; i <= 30; i++) { var a = gapA + (Math.PI * 2 - 1.1) * i / 30; pts.push([Math.cos(a) * rx, Math.sin(a) * ry + 0.02]); }
          arcs.push([E, null, { stroke: pts, w: 0.022 }]);
        }
        return [[P, ell(0, 0, 0.32, 0.4, 48)]].concat(arcs);
      }
      case 'ampulheta': {
        var lv = (t * 0.12) % 1;
        return [
          [P, [[-0.24, -0.36], [0.24, -0.36], [0.03, 0], [0.24, 0.36], [-0.24, 0.36], [-0.03, 0]]],
          [E, [[-0.2 * (1 - lv * 0.7), -0.32 + 0.3 * lv * 0.7 - 0.02], [0.2 * (1 - lv * 0.7), -0.32 + 0.3 * lv * 0.7 - 0.02], [0.02, -0.02], [-0.02, -0.02]]],
          [E, [[-0.2, 0.33], [0.2, 0.33], [0.06, 0.33 - 0.14 * (0.3 + lv * 0.7)], [-0.06, 0.33 - 0.14 * (0.3 + lv * 0.7)]]],
          [E, rect(-0.008, -0.02, 0.008, 0.3)],
          [I, rect(-0.32, -0.44, 0.32, -0.36)], [I, rect(-0.32, 0.36, 0.32, 0.44)]
        ];
      }
      case 'chave': return [
        [A, ell(-0.24, 0, 0.17, 0.17, 32), ell(-0.24, 0, 0.075, 0.075, 20)],
        [A, rect(-0.09, -0.045, 0.42, 0.045)],
        [A, rect(0.22, 0.04, 0.28, 0.15)], [A, rect(0.33, 0.04, 0.39, 0.12)]
      ];
      case 'lupa': return [
        [I, beam(0.12, 0.12, 0.42, 0.42, 0.1)],
        [I, ell(-0.06, -0.06, 0.29, 0.29, 40), ell(-0.06, -0.06, 0.21, 0.21, 36)],
        [PS, ell(-0.06, -0.06, 0.21, 0.21, 36)],
        [P, [[-0.18, -0.18], [-0.12, -0.21], [0.0, -0.04], [-0.06, -0.01]]]
      ];
      case 'balão': return [
        [P, ell(0, -0.07, 0.4, 0.29, 48).concat([[0.08, 0.2], [-0.12, 0.38], [-0.1, 0.2]])],
        [E, ell(-0.15, -0.07, 0.045, 0.045, 14)], [E, ell(0, -0.07, 0.045, 0.045, 14)], [E, ell(0.15, -0.07, 0.045, 0.045, 14)]
      ];
      default: return null;
    }
  }

  TC.register({
    id: 'simbolo',
    drag: { x: 'x', y: 'y', size: 'tamanho' },
    name: 'Símbolo',
    category: 'apontar',
    duration: 3.5,
    minDur: 1.6,
    thumb: 1.9,
    curves: { entrada: [0.34, 1.5, 0.64, 1] },
    description: 'Ícone de papel recortado que cai na tela e assenta, tremendo de leve como stop motion: máscara, espelho, ímã, etiqueta, digital, ampulheta, chave, lupa, balão, chama, brasa ou cinza.',
    uso: 'Um símbolo pra uma ideia: máscara pra "performar", espelho pra "se reconhecer", etiqueta pra "virar commodity", ímã pra "ser escolhido". Um por vez.',
    params: [
      { key: 'icone', label: 'Ícone', type: 'select', options: ['máscara', 'espelho', 'ímã', 'etiqueta', 'digital', 'ampulheta', 'chave', 'lupa', 'balão', 'chama', 'brasa', 'cinza'], default: 'máscara' },
      { key: 'legenda', label: 'Legenda (opcional)', type: 'text', default: 'uma versão aceitável de si' },
      { key: 'x', label: 'Centro X (%)', type: 'number', min: 0, max: 100, default: 50 },
      { key: 'y', label: 'Centro Y (%)', type: 'number', min: 0, max: 100, default: 40 },
      { key: 'tamanho', label: 'Tamanho (% da largura)', type: 'number', min: 8, max: 90, default: 40 },
      { key: 'rotacao', label: 'Inclinação (graus)', type: 'number', min: -30, max: 30, default: -5 }
    ],
    draw: function (S, t) {
      var c = S.c, u = S.u, w = S.w, h = S.h, col = S.col, p = S.p, D = S.dur;
      var s = w * TC.clamp(Number(p.tamanho) || 40, 8, 90) / 100;
      var cx = w * TC.clamp(Number(p.x), 0, 100) / 100, cy = h * TC.clamp(Number(p.y), 0, 100) / 100;
      var k = S.inK(0, 0.7), out = S.outK(D - 0.45, D);
      var rot = (Number(p.rotacao) || 0) * Math.PI / 180;
      var frame = Math.floor(t * 12);
      var boil = s * 0.004;
      var pad = Math.ceil(s * 0.25);
      var L = S.layer('sym', s + pad * 2, s + pad * 2), lc = L.getContext('2d');
      var o = s / 2 + pad;
      // desenha o ícone no canvas de trabalho
      S.into(L, function () {
        lc.save();
        lc.translate(o, o);
        if (p.icone === 'chama') {
          lc.translate((TC.noise(frame, 1, 3) - 0.5) * boil * 2, (TC.noise(frame, 2, 3) - 0.5) * boil * 2);
          S.flame(0, 0, s * 0.85, col.ember, {});
        } else if (p.icone === 'brasa') {
          S.coal(0, s * 0.05, s * 0.32, { heat: 0.85, seed: 4 });
        } else if (p.icone === 'cinza') {
          S.ashPile(0, s * 0.25, s * 0.9, s * 0.42, { seed: 4 });
        } else {
          var shapes = iconShapes(p.icone, col, t) || iconShapes('máscara', col, t);
          var ri = 0;
          shapes.forEach(function (sh) {
            if (sh[2] && sh[2].stroke) {
              lc.beginPath();
              sh[2].stroke.forEach(function (pt, i) {
                var jx = (TC.noise(frame + i * 0.37, ri, 5) - 0.5) * boil * 2, jy = (TC.noise(frame + i * 0.37, ri + 9, 5) - 0.5) * boil * 2;
                if (i) lc.lineTo(pt[0] * s + jx, pt[1] * s + jy); else lc.moveTo(pt[0] * s + jx, pt[1] * s + jy);
              });
              lc.strokeStyle = sh[0]; lc.lineWidth = sh[2].w * s; lc.lineCap = 'round'; lc.lineJoin = 'round';
              lc.stroke();
              ri++;
              return;
            }
            lc.beginPath();
            for (var ci = 1; ci < sh.length; ci++) {
              var poly = sh[ci];
              if (!poly) continue;
              for (var i = 0; i < poly.length; i++) {
                var jx2 = (TC.noise(frame + i * 0.53, ri, 7) - 0.5) * boil * 2, jy2 = (TC.noise(frame + i * 0.53, ri + 4, 7) - 0.5) * boil * 2;
                var X = poly[i][0] * s + jx2, Y = poly[i][1] * s + jy2;
                if (i) lc.lineTo(X, Y); else lc.moveTo(X, Y);
              }
              lc.closePath();
              ri++;
            }
            lc.fillStyle = sh[0];
            lc.fill('evenodd');
          });
        }
        lc.restore();
        // textura de papel por cima de tudo que foi recortado
        lc.save();
        lc.globalCompositeOperation = 'source-atop';
        S.grain(0.18, false);
        lc.restore();
      });
      c.save();
      c.globalAlpha *= Math.min(1, k * 2) * (1 - out);
      var dy = (1 - k) * -90 * u - out * 50 * u;
      var r = rot + (1 - k) * -0.25 + out * 0.09 + (TC.noise(frame, 3, 11) - 0.5) * 0.012;
      c.translate(cx, cy + dy); c.rotate(r); c.scale(0.92 + 0.08 * k, 0.92 + 0.08 * k);
      c.shadowColor = TC.rgba(col.ink, 0.38); c.shadowBlur = 16 * u; c.shadowOffsetX = 6 * u; c.shadowOffsetY = 9 * u;
      c.drawImage(L, -o, -o);
      c.restore();
      if (p.legenda) {
        var lk = S.inK(0.45, 1.0) * (1 - out);
        c.save();
        c.globalAlpha *= lk;
        S.blur((1 - lk) * 6 * u);
        S.shadow(0.9);
        S.font('sans', (S.vertical ? 38 : 32) * u, 600);
        var lines = S.wrap(p.legenda, w * 0.8);
        for (var j = 0; j < lines.length; j++) S.text(lines[j], cx, cy + s * 0.58 + 40 * u + j * 48 * u + (1 - lk) * 12 * u, { align: 'center', color: col.paper });
        c.restore();
      }
    }
  });
})(typeof window !== 'undefined' ? window : this);
