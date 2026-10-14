/* Acender: abrir, fechar e dar fundo */
(function (root) {
  'use strict';
  var TC = root.TC, E = TC.ease;

  // tempo em que uma frente (que anda com a curva de entrada) passa por x
  function passTime(S, a, b, x0, x1, x) {
    var k = TC.clamp((x - x0) / (x1 - x0), 0, 1), lo = a, hi = b;
    for (var i = 0; i < 18; i++) {
      var m = (lo + hi) / 2;
      if (S.ein(TC.seg(m, a, b)) < k) lo = m; else hi = m;
    }
    return (lo + hi) / 2;
  }

  // ------------------------------------------------------------------
  // Acender — o nome coberto de cinza, o sopro, a brasa, a chama
  // ------------------------------------------------------------------
  TC.register({
    id: 'acender',
    name: 'Acender',
    category: 'acender',
    full: true,
    duration: 5.5,
    minDur: 4,
    thumb: 3.7,
    description: 'O nome começa apagado, coberto de cinza. Um sopro leva a cinza embora, a brasa aparece por baixo, a chama acende e a frase entra.',
    uso: 'Abertura de vídeo longo, aula ou série. Em Reels o gancho vem antes de qualquer vinheta: aqui a pessoa ainda não decidiu ficar.',
    params: [
      { key: 'chama', label: 'Chama', type: 'select', options: ['stop motion', 'suave'], default: 'stop motion' },
      { key: 'linha1', label: 'Linha 1', type: 'text', fromBrand: 'primeiro', default: 'herton' },
      { key: 'linha2', label: 'Linha 2 (em brasa)', type: 'text', fromBrand: 'sobrenome', default: 'hemann' },
      { key: 'frase', label: 'Frase', type: 'text', fromBrand: 'cargo', default: 'estrategista que elimina o cinza e acende a devoção.' },
      { key: 'destaque', label: 'Trecho da frase em brasa', type: 'text', fromBrand: 'destaqueCargo', default: 'acende a devoção.' },
      { key: 'fundo', label: 'Fundo', type: 'select', options: ['tinta', 'papel'], default: 'tinta' }
    ],
    draw: function (S, t) {
      var c = S.c, u = S.u, w = S.w, h = S.h, col = S.col, p = S.p, D = S.dur;
      var dark = p.fundo !== 'papel';
      var final1 = dark ? col.paper : col.ink;
      var ashCol = dark ? TC.mixHex(col.ash, col.ink, 0.45) : TC.mixHex(col.ash, col.paper, 0.2);
      var fadeIn = S.lin(0, 0.35), out = S.outK(D - 0.75, D);

      c.save();
      c.globalAlpha = fadeIn * (1 - out);
      S.paper(dark ? col.ink : col.paper, { dark: dark });
      c.restore();
      S.ash({ count: 26, seed: 31, mode: 'float', alpha: 0.4 * fadeIn * (1 - out) });

      // medidas do bloco: duas linhas + chama ao lado da segunda (como na identidade)
      var size = (S.vertical ? 250 : 220) * u;
      var maxBlock = w * (S.vertical ? 0.8 : 0.48);
      var L1, L2, fh, fw, blockW;
      for (var g = 0; g < 12; g++) {
        L1 = S.textLayer(p.linha1, 'display', size, 400, final1);
        L2 = S.textLayer(p.linha2, 'display', size, 400, col.ember);
        fh = L2.asc * 1.12; fw = fh * 0.69;
        blockW = Math.max(L1.w, L2.w + size * 0.1 + fw);
        if (blockW <= maxBlock) break;
        size *= maxBlock / blockW * 0.99;
      }
      var lineGap = size * 0.9;
      var fraseSize = (S.vertical ? 44 : 34) * u;
      S.font('sans', fraseSize, 500);
      var fraseW = Math.max(blockW, w * (S.vertical ? 0.8 : 0.42));
      var fl = p.frase ? S.flow(p.frase, { maxW: fraseW, lineH: fraseSize * 1.35 }) : null;
      var totalH = L1.asc + lineGap + L2.desc + (fl ? 90 * u + fl.height : 0);
      var top = h * (S.vertical ? 0.45 : 0.47) - totalH / 2;
      var bx = (w - blockW) / 2;
      var y1 = top + L1.asc, y2 = y1 + lineGap;

      c.save();
      c.globalAlpha *= 1 - out;
      c.translate(0, -out * 40 * u);
      if (out > 0) S.blur(out * 10 * u);

      // frente do sopro
      var s0 = 1.15, s1 = 2.35;
      var fx0 = bx - w * 0.12, fx1 = bx + blockW + w * 0.12;
      var front = TC.lerp(fx0, fx1, S.inK(s0, s1));
      var band = 180 * u;
      [[L1, y1, 'a'], [L2, y2, 'b']].forEach(function (row) {
        var L = row[0], by = row[1];
        var lx = bx - L.pad, ly = by - L.asc - L.pad;
        var cold = S.textLayer(row[2] === 'a' ? p.linha1 : p.linha2, 'display', L.size, 400, ashCol);
        var hot = S.textLayer(row[2] === 'a' ? p.linha1 : p.linha2, 'display', L.size, 400, col.hot);
        var appear = S.inK(0.15, 0.9);
        c.save();
        c.globalAlpha *= appear;
        // parte ainda fria
        c.save(); S.clipRect(front, 0, w, h); c.drawImage(cold.cv, lx, ly + (1 - appear) * 20 * u); c.restore();
        // parte já acesa
        c.save(); S.clipRect(0, 0, front, h); c.drawImage(L.cv, lx, ly); c.restore();
        // faixa de calor logo atrás da frente
        if (front > fx0 && front < fx1 + band) {
          var tmp = S.layer('heat' + row[2], hot.cv.width, hot.cv.height), tc = tmp.getContext('2d');
          tc.drawImage(hot.cv, 0, 0);
          tc.globalCompositeOperation = 'destination-in';
          var gr = tc.createLinearGradient(front - band - lx, 0, front - lx, 0);
          gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(0.75, 'rgba(0,0,0,0.85)'); gr.addColorStop(1, 'rgba(0,0,0,1)');
          tc.fillStyle = gr; tc.fillRect(0, 0, tmp.width, tmp.height);
          c.save();
          S.clipRect(0, 0, front, h);
          c.globalCompositeOperation = 'lighter';
          S.glow(0.9, col.glow);
          c.drawImage(tmp, lx, ly);
          c.restore();
        }
        c.restore();

        // flocos de cinza em cima das letras, levados pelo sopro
        var pts = S.textPoints(cold, Math.round(L.w * L.asc / (900 * u * u)) + 60, row[2] === 'a' ? 7 : 9);
        c.save();
        var baseA = c.globalAlpha;
        for (var i = 0; i < pts.length; i++) {
          var pt = pts[i], ax = lx + pt[0], ay = ly + pt[1];
          var tp = passTime(S, s0, s1, fx0, fx1, ax);
          var sz = (2 + pt[2] * 4) * u, x = ax, y = ay, a = 0.85 * appear, rot = pt[3] * 6;
          var spark = pt[2] < 0.14;
          if (t > tp) {
            var dt = t - tp;
            x = ax + dt * (260 + pt[3] * 520) * u + Math.sin(dt * 6 + pt[2] * 9) * 14 * u;
            y = ay - dt * (60 + pt[2] * 180) * u - dt * dt * 50 * u;
            a = Math.max(0, 1 - dt / (spark ? 1.3 : 0.9)) * 0.85;
            rot += dt * 8;
          }
          if (a <= 0.01) continue;
          c.globalAlpha = baseA * a;
          if (spark && t > tp) {
            c.globalCompositeOperation = 'lighter';
            c.fillStyle = col.hot;
            c.beginPath(); c.arc(x, y, sz * 0.6, 0, Math.PI * 2); c.fill();
            c.globalCompositeOperation = 'source-over';
          } else {
            c.fillStyle = i % 3 ? ashCol : (dark ? TC.mixHex(col.ash, col.paper, 0.3) : col.ash);
            c.save(); c.translate(x, y); c.rotate(rot);
            c.fillRect(-sz / 2, -sz / 3, sz, sz * 0.66);
            c.restore();
          }
        }
        c.restore();
      });

      // a chama acende ao lado da segunda linha
      var fcx = bx + L2.w + size * 0.1 + fw / 2, fby = y2 + L2.desc * 0.1;
      var ign = S.inK(1.95, 2.9);
      var spark0 = S.lin(1.75, 2.0) * (1 - S.lin(2.1, 2.4));
      if (spark0 > 0) {
        c.save(); c.globalCompositeOperation = 'lighter';
        var sg = c.createRadialGradient(fcx, fby - fh * 0.1, 0, fcx, fby - fh * 0.1, fh * 0.35);
        sg.addColorStop(0, TC.rgba(col.hot, spark0)); sg.addColorStop(1, TC.rgba(col.glow, 0));
        c.fillStyle = sg; c.fillRect(fcx - fh, fby - fh, fh * 2, fh * 1.4);
        c.restore();
      }
      if (ign > 0.001) {
        c.save(); c.globalCompositeOperation = 'lighter';
        var hg = c.createRadialGradient(fcx, fby - fh * 0.35, 0, fcx, fby - fh * 0.35, fh * 1.3);
        hg.addColorStop(0, TC.rgba(col.glow, 0.32 * ign)); hg.addColorStop(1, TC.rgba(col.glow, 0));
        c.fillStyle = hg; c.fillRect(fcx - fh * 1.5, fby - fh * 2, fh * 3, fh * 2.6);
        c.restore();
        S.flame(fcx, fby - fh / 2, fh, col.ember, { flicker: 0.55, height: ign });
        S.sparks({ count: 14, seed: 41, area: { x: fcx - fw * 0.6, y: fby - fh * 2.6, w: fw * 1.2, h: fh * 2.2 }, alpha: ign, scale: 0.9 });
      }

      // traço + frase
      if (fl) {
        var dy = y2 + L2.desc + 46 * u;
        var lk = S.inK(2.45, 3.1);
        c.fillStyle = TC.rgba(col.ash, 0.8);
        c.fillRect(bx, dy, 110 * u * lk, 3 * u);
        var hi = TC.wordSet(p.destaque);
        S.font('sans', fraseSize, 500);
        for (var j = 0; j < fl.words.length; j++) {
          var wd = fl.words[j];
          var wk = S.inK(2.65 + j * 0.035, 3.25 + j * 0.035);
          if (wk <= 0) continue;
          c.save();
          c.globalAlpha *= wk;
          S.blur((1 - wk) * 6 * u);
          S.text(wd.text, bx + wd.x, dy + 44 * u + fraseSize + wd.y + (1 - wk) * 14 * u, { color: hi[wd.key] ? col.ember : (dark ? col.ash : TC.mixHex(col.ink, col.ash, 0.35)) });
          c.restore();
        }
      }
      c.restore();
    }
  });

  // ------------------------------------------------------------------
  // Assinatura — a chama se consome, fica a brasa
  // ------------------------------------------------------------------
  TC.register({
    id: 'assinatura',
    name: 'Assinatura',
    category: 'acender',
    full: true,
    duration: 6,
    minDur: 4,
    thumb: 2.4,
    description: 'A chama acende sobre uma brasa, o nome entra, e no fim a chama se consome sozinha. O que fica na tela é a brasa respirando.',
    uso: 'Fim do vídeo. Sem "segue, salva, comenta": quem chegou até aqui decide sozinho. A última imagem é a brasa, não um pedido.',
    params: [
      { key: 'chama', label: 'Chama', type: 'select', options: ['stop motion', 'suave'], default: 'stop motion' },
      { key: 'nome', label: 'Nome', type: 'text', fromBrand: 'nome', default: 'herton hemann' },
      { key: 'frase', label: 'Frase final (opcional)', type: 'text', default: 'o morno não marca ninguém.' },
      { key: 'destaque', label: 'Palavra da frase em brasa', type: 'text', default: 'marca' },
      { key: 'handle', label: '@ (opcional)', type: 'text', fromBrand: 'handle', default: '' },
      { key: 'fundo', label: 'Fundo', type: 'select', options: ['tinta', 'papel', 'transparente'], default: 'tinta' }
    ],
    draw: function (S, t) {
      var c = S.c, u = S.u, w = S.w, h = S.h, col = S.col, p = S.p, D = S.dur;
      var dark = p.fundo !== 'papel';
      var bgIn = S.lin(0, 0.5);
      if (p.fundo !== 'transparente') {
        c.save(); c.globalAlpha = bgIn;
        S.paper(dark ? col.ink : col.paper, { dark: dark });
        c.restore();
      }
      var fh = S.vertical ? h * 0.2 : h * 0.3;
      var cx = w / 2, base = S.vertical ? h * 0.47 : h * 0.55;
      var up = S.inK(0.35, 1.4);
      var downA = Math.max(2.3, D * 0.42), downB = D - 1.0;
      var down = S.outK(downA, downB);
      var height = up * (1 - down);
      var coalR = fh * 0.2;

      // halo
      c.save(); c.globalCompositeOperation = 'lighter';
      var hg = c.createRadialGradient(cx, base - fh * 0.4 * height, 0, cx, base - fh * 0.4, fh * 1.4);
      hg.addColorStop(0, TC.rgba(col.glow, 0.28 * Math.max(height, 0.35 * up))); hg.addColorStop(1, TC.rgba(col.glow, 0));
      c.fillStyle = hg; c.fillRect(cx - fh * 2, base - fh * 2.4, fh * 4, fh * 3.2);
      c.restore();

      // fumaça quando a chama baixa
      if (down > 0.05) {
        var r = TC.rng(19);
        for (var i = 0; i < 9; i++) {
          var life = 2.2 + r() * 1.6, ph = r();
          var q = ((t - downA) / life + ph) % 1;
          if (t < downA) continue;
          var sx = cx + Math.sin(q * 5 + i) * 30 * u * q, sy = base - coalR - q * fh * 1.8;
          var rad = (20 + q * 90) * u;
          var a = Math.sin(q * Math.PI) * 0.1 * Math.min(1, down * 2);
          var sgd = c.createRadialGradient(sx, sy, 0, sx, sy, rad);
          sgd.addColorStop(0, TC.rgba(dark ? col.ash : col.ink, a)); sgd.addColorStop(1, TC.rgba(dark ? col.ash : col.ink, 0));
          c.fillStyle = sgd; c.fillRect(sx - rad, sy - rad, rad * 2, rad * 2);
        }
      }
      // chama sobre a brasa
      if (height > 0.005) {
        S.flame(cx, base - fh * 0.5 + coalR * 0.15, fh, col.ember, { flicker: 0.6 + 0.6 * down, height: height });
        S.sparks({ count: 16, seed: 23, area: { x: cx - fh * 0.4, y: base - fh * 2.6, w: fh * 0.8, h: fh * 2.2 }, alpha: height });
      }
      var coalK = S.inK(0.1, 0.6);
      if (coalK > 0) S.coal(cx, base + coalR * 0.75, coalR * coalK, { heat: 0.9, seed: 12 });

      // textos
      var txtOut = 1 - S.outK(D - 0.9, D - 0.25);
      var size = S.fit(p.nome, 'display', 400, w * 0.8, (S.vertical ? 140 : 120) * u, 40 * u);
      var asc = S.capH();
      var ny = base + coalR * 1.6 + 80 * u + asc;
      var nk = S.inK(0.8, 1.55);
      c.save();
      c.globalAlpha *= nk * txtOut;
      S.blur((1 - nk) * 10 * u);
      S.text(p.nome, cx, ny + (1 - nk) * 26 * u, { align: 'center', color: dark ? col.paper : col.ink });
      c.restore();
      void size;
      var yNext = ny + 70 * u;
      if (p.frase) {
        var fs = (S.vertical ? 40 : 34) * u, hi = TC.wordSet(p.destaque);
        S.font('sans', fs, 500);
        var lay = S.flow(p.frase, { maxW: w * 0.78, lineH: fs * 1.35, align: 'center' });
        for (var j = 0; j < lay.words.length; j++) {
          var wd = lay.words[j], wk = S.inK(1.35 + j * 0.05, 1.95 + j * 0.05);
          if (wk <= 0) continue;
          c.save(); c.globalAlpha *= wk * txtOut;
          S.blur((1 - wk) * 6 * u);
          S.text(wd.text, (w - w * 0.78) / 2 + wd.x, yNext + fs + wd.y, { color: hi[wd.key] ? col.ember : (dark ? col.ash : TC.mixHex(col.ink, col.ash, 0.4)) });
          c.restore();
        }
        yNext += lay.height + 40 * u;
      }
      if (p.handle) {
        var hk = S.inK(1.8, 2.4);
        c.save(); c.globalAlpha *= hk * txtOut;
        S.label(p.handle, cx, yNext + 30 * u, { size: 24, color: col.ash, align: 'center' });
        c.restore();
      }
    }
  });

  // ------------------------------------------------------------------
  // Fundo vivo — loop de cinza e brasa pra pôr atrás de texto
  // ------------------------------------------------------------------
  TC.register({
    id: 'fundo-vivo',
    name: 'Fundo Vivo',
    category: 'acender',
    full: true,
    noCurves: true,
    duration: 10,
    minDur: 4,
    thumb: 3,
    description: 'Papel ou tinta com cinza flutuando e brasa subindo de leve. Fecha o loop sem emenda: o último frame encaixa no primeiro.',
    uso: 'Fundo de cartela, de citação lida em off, de vídeo só com texto. Dá vida sem roubar a atenção da frase.',
    params: [
      { key: 'tema', label: 'Tema', type: 'select', options: ['tinta', 'papel', 'brasa'], default: 'tinta' },
      { key: 'brilho', label: 'Brilho', type: 'select', options: ['baixo', 'canto', 'nenhum'], default: 'baixo' },
      { key: 'brasas', label: 'Faíscas', type: 'select', options: ['sim', 'não'], default: 'sim' },
      { key: 'cinza', label: 'Cinza no ar', type: 'select', options: ['sim', 'não'], default: 'sim' }
    ],
    draw: function (S, t) {
      var c = S.c, u = S.u, w = S.w, h = S.h, col = S.col, p = S.p, D = S.dur;
      var bg = p.tema === 'papel' ? col.paper : p.tema === 'brasa' ? col.ember : col.ink;
      var dark = p.tema !== 'papel';
      S.paper(bg, { dark: p.tema === 'tinta' });
      var TAU = Math.PI * 2, ph = t / D;
      if (p.brilho !== 'nenhum') {
        var gx = p.brilho === 'canto' ? w * 0.9 : w * 0.5, gy = h * 1.02;
        var breath = 0.8 + 0.2 * Math.sin(ph * TAU * 2);
        c.save(); c.globalCompositeOperation = dark ? 'lighter' : 'multiply';
        var gr = c.createRadialGradient(gx, gy, 0, gx, gy, Math.max(w, h) * 0.6);
        gr.addColorStop(0, TC.rgba(dark ? col.glow : col.ember, (dark ? 0.3 : 0.18) * breath)); gr.addColorStop(1, TC.rgba(col.glow, 0));
        c.fillStyle = gr; c.fillRect(0, 0, w, h);
        c.restore();
      }
      var r = TC.rng(5);
      if (p.cinza !== 'não') {
        for (var i = 0; i < 46; i++) {
          var k = 1 + Math.floor(r() * 2), x0 = r() * w, off = r(), sz = (2 + r() * 4) * u, spin = Math.floor(r() * 3) - 1;
          var q = (ph * k + off) % 1;
          var x = x0 + Math.sin((ph * 2 + off) * TAU) * 30 * u, y = h * 1.05 - q * h * 1.1;
          c.save(); c.globalAlpha = Math.sin(q * Math.PI) * 0.45;
          c.fillStyle = i % 3 ? col.ash : (dark ? col.paper : col.ink);
          c.translate(x, y); c.rotate(off * 6 + ph * TAU * spin);
          c.fillRect(-sz / 2, -sz / 3, sz, sz * 0.6);
          c.restore();
        }
      }
      if (p.brasas !== 'não') {
        c.save(); c.globalCompositeOperation = 'lighter';
        for (var j = 0; j < 22; j++) {
          var kk = 2 + Math.floor(r() * 3), xs = w * (0.15 + r() * 0.7), o2 = r(), s2 = (1.4 + r() * 2.6) * u;
          var q2 = (ph * kk + o2) % 1;
          var sx = xs + Math.sin((ph * kk * 2 + o2) * TAU) * 24 * u * q2, sy = h * 1.02 - q2 * h * 0.75;
          var a = Math.pow(Math.sin(q2 * Math.PI), 0.8) * (dark ? 0.9 : 0.6);
          c.globalAlpha = a * 0.25; c.fillStyle = col.ember;
          c.beginPath(); c.arc(sx, sy, s2 * 3, 0, TAU); c.fill();
          c.globalAlpha = a; c.fillStyle = col.hot;
          c.beginPath(); c.arc(sx, sy, s2, 0, TAU); c.fill();
        }
        c.restore();
      }
      void E;
    }
  });
})(typeof window !== 'undefined' ? window : this);
