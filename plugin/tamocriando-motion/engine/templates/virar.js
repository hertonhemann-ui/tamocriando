/* Virar: mudar a percepção (o que a pessoa larga, o que ela passa a ver) */
(function (root) {
  'use strict';
  var TC = root.TC;

  function invInOutSine(x) { return Math.acos(TC.clamp(1 - 2 * x, -1, 1)) / Math.PI; }

  // fundo comum: tinta, papel ou nada
  function background(S, mode, alpha) {
    if (mode === 'transparente' || mode === 'vídeo' || mode === 'video' || alpha <= 0) return;
    var c = S.c;
    c.save(); c.globalAlpha *= alpha;
    if (mode === 'papel') S.paper(S.col.paper); else S.paper(S.col.ink, { dark: true });
    c.restore();
  }

  // ------------------------------------------------------------------
  // Cinza × Brasa — uma vira pó, a outra acende
  // ------------------------------------------------------------------
  TC.register({
    id: 'cinza-brasa',
    name: 'Cinza × Brasa',
    category: 'virar',
    duration: 7,
    minDur: 5.2,
    thumb: 5.4,
    description: 'Duas palavras. A primeira esfria, vira cinza e se desfaz caindo. A segunda chega coberta de cinza, a cinza sobe e ela acende.',
    uso: 'O que a pessoa larga e o que ela quer ser, no mesmo quadro. Ela vê a primeira virar pó e concorda antes de tu explicar.',
    params: [
      { key: 'rotuloA', label: 'Rótulo de cima', type: 'text', default: 'O QUE TE VENDEM' },
      { key: 'a', label: 'Palavra que vira cinza', type: 'text', default: 'disciplina' },
      { key: 'rotuloB', label: 'Rótulo de baixo', type: 'text', default: 'O QUE TE MOVE' },
      { key: 'b', label: 'Palavra que acende', type: 'text', default: 'devoção' },
      { key: 'frase', label: 'Frase no fim (opcional)', type: 'text', default: 'disciplina forçada é o que sobra quando a devoção foi embora.' },
      { key: 'fundo', label: 'Fundo', type: 'select', options: ['tinta', 'papel', 'transparente'], default: 'tinta' }
    ],
    draw: function (S, t) {
      var c = S.c, u = S.u, w = S.w, h = S.h, col = S.col, p = S.p, D = S.dur;
      var paper = p.fundo === 'papel', over = p.fundo === 'transparente';
      var out = S.outK(D - 0.6, D);
      background(S, p.fundo, S.lin(0, 0.4) * (1 - out));
      var neutral = paper ? col.ink : col.paper;
      var ashC = paper ? col.ash : TC.mixHex(col.ash, col.ink, 0.25);
      var maxW = S.vertical ? w * 0.8 : w * 0.38;
      var size = Math.min(
        S.fit(p.a, 'display', 400, maxW, (S.vertical ? 230 : 190) * u, 40 * u),
        S.fit(p.b, 'display', 400, maxW, (S.vertical ? 230 : 190) * u, 40 * u));
      var LA = S.textLayer(p.a, 'display', size, 400, neutral), LAc = S.textLayer(p.a, 'display', size, 400, ashC);
      var LBc = S.textLayer(p.b, 'display', size, 400, ashC), LBh = S.textLayer(p.b, 'display', size, 400, col.ember);
      var ax, ay, bx, by;
      if (S.vertical) { ax = w / 2; ay = h * 0.34; bx = w / 2; by = h * 0.6; }
      else { ax = w * 0.28; ay = h * 0.47; bx = w * 0.72; by = h * 0.47; }
      var la = { x: ax - LA.w / 2 - LA.pad, y: ay - LA.asc - LA.pad };
      var lb = { x: bx - LBc.w / 2 - LBc.pad, y: by - LBc.asc - LBc.pad };

      c.save();
      c.globalAlpha *= 1 - out;
      c.translate(0, -out * 30 * u);
      if (out > 0) S.blur(out * 10 * u);
      var shadow = over ? 0.9 : 0;

      // rótulos
      function label(str, x, y, a) {
        if (!str || a <= 0) return;
        c.save(); c.globalAlpha *= a; S.shadow(shadow);
        S.label(str, x, y, { size: 24, weight: 600, color: col.ash, align: 'center' });
        c.restore();
      }
      label(p.rotuloA, ax, ay - LA.asc - 40 * u, S.inK(0.3, 0.8) * (1 - S.lin(2.2, 3.0) * 0.6));
      label(p.rotuloB, bx, by - LBc.asc - 40 * u, S.inK(2.7, 3.2));

      // A: aparece neutra, esfria, se desfaz
      var kA = S.inK(0.35, 1.0), cool = S.inK(1.2, 2.0);
      var c0 = 1.9, c1 = 3.4;
      var P = TC.lerp(-0.05, 1.12, TC.ease.inOutSine(S.lin(c0, c1)));
      if (kA > 0) {
        c.save();
        c.globalAlpha *= kA;
        S.blur((1 - kA) * 10 * u);
        S.shadow(shadow);
        if (t < c0) {
          c.save(); c.globalAlpha *= 1 - cool; c.drawImage(LA.cv, la.x, la.y + (1 - kA) * 20 * u); c.restore();
          c.save(); c.globalAlpha *= cool; c.drawImage(LAc.cv, la.x, la.y + (1 - kA) * 20 * u); c.restore();
        } else {
          var F = S.field({ rect: { x: la.x, y: la.y, w: LAc.cv.width, h: LAc.cv.height }, dir: [0.35, 1], noise: 0.55, P: P, res: 0.35, seed: 14, soft: 0.02 });
          S.burnDraw(LAc.cv, F, { glow: false, char: false });
          // poeira caindo de onde a frente passou
          var pts = S.textPoints(LAc, 520, 17);
          c.save();
          var baseA = c.globalAlpha;
          for (var i = 0; i < pts.length; i++) {
            var px = la.x + pts[i][0], py = la.y + pts[i][1];
            var f = S.fieldAt(F, px, py);
            var tp = c0 + invInOutSine((f + 0.05) / 1.17) * (c1 - c0);
            if (t < tp) continue;
            var dt = t - tp, life = 1.1 + pts[i][2] * 0.9;
            if (dt > life) continue;
            var x = px + Math.sin(dt * 3 + pts[i][3] * 9) * 10 * u + dt * (pts[i][3] - 0.3) * 60 * u;
            var y = py + dt * 40 * u + dt * dt * 260 * u;
            var sz = (1.5 + pts[i][2] * 3.5) * u;
            c.globalAlpha = baseA * (1 - dt / life) * 0.9;
            c.fillStyle = pts[i][2] < 0.3 ? TC.mixHex(ashC, neutral, 0.3) : ashC;
            c.fillRect(x, y, sz, sz * 0.7);
          }
          c.restore();
        }
        c.restore();
      }

      // B: chega fria, a cinza sobe, acende
      var kB = S.inK(2.9, 3.5), heat = S.inK(3.6, 4.5);
      var breath = 0.8 + 0.2 * Math.sin(t * 1.7);
      if (kB > 0) {
        c.save();
        c.globalAlpha *= kB;
        S.blur((1 - kB) * 10 * u);
        S.shadow(shadow);
        var yy = lb.y + (1 - kB) * 20 * u;
        c.save(); c.globalAlpha *= 1 - heat; c.drawImage(LBc.cv, lb.x, yy); c.restore();
        c.save(); c.globalAlpha *= heat; c.drawImage(LBh.cv, lb.x, yy); c.restore();
        c.restore();
        if (heat > 0.01) {
          c.save();
          c.globalCompositeOperation = 'lighter';
          c.globalAlpha *= heat * (0.16 + 0.08 * breath);
          S.glow(0.9, col.glow);
          c.drawImage(LBh.cv, lb.x, yy);
          c.restore();
          S.sparks({ count: 14, seed: 52, area: { x: bx - LBh.w / 2, y: by - LBh.asc - 180 * u, w: LBh.w, h: LBh.asc + 180 * u }, alpha: heat * (1 - out) });
        }
        // flocos que cobriam a palavra sobem
        var pb = S.textPoints(LBc, 160, 29);
        c.save();
        var bA = c.globalAlpha;
        for (var j = 0; j < pb.length; j++) {
          var lift = 3.45 + pb[j][2] * 0.7;
          var qx = lb.x + pb[j][0], qy = yy + pb[j][1];
          var d2 = t - lift, a2 = kB * 0.8;
          if (d2 > 0) { qy -= d2 * (80 + pb[j][3] * 160) * u; qx += Math.sin(d2 * 5 + j) * 12 * u; a2 *= Math.max(0, 1 - d2 / 1.2); }
          if (a2 <= 0.01) continue;
          c.globalAlpha = bA * a2;
          c.fillStyle = j % 4 ? ashC : (paper ? col.ink : col.paper);
          var s2 = (2 + pb[j][3] * 3) * u;
          c.fillRect(qx, qy, s2, s2 * 0.6);
        }
        c.restore();
      }

      // frase no fim
      if (p.frase) {
        var fs = (S.vertical ? 40 : 32) * u;
        S.font('sans', fs, 500);
        var fw = S.vertical ? w * 0.8 : w * 0.6;
        var lay = S.flow(p.frase, { maxW: fw, lineH: fs * 1.35, align: 'center' });
        var fy = S.vertical ? h * 0.74 : h * 0.78;
        for (var k = 0; k < lay.words.length; k++) {
          var wd = lay.words[k], wk = S.inK(4.6 + k * 0.04, 5.2 + k * 0.04);
          if (wk <= 0) continue;
          c.save(); c.globalAlpha *= wk;
          S.blur((1 - wk) * 6 * u);
          S.shadow(shadow);
          S.text(wd.text, (w - fw) / 2 + wd.x, fy + wd.y + (1 - wk) * 12 * u, { color: paper ? TC.mixHex(col.ink, col.ash, 0.3) : col.ash });
          c.restore();
        }
      }
      c.restore();
    }
  });

  // ------------------------------------------------------------------
  // Virada — a crença pega fogo e mostra o que tem por baixo
  // ------------------------------------------------------------------
  TC.register({
    id: 'virada',
    name: 'Virada',
    category: 'virar',
    duration: 6.5,
    minDur: 4.6,
    thumb: 2.9,
    description: 'Um cartão de papel com o que te venderam. Ele pega fogo a partir de um canto, a borda acesa avança soltando fagulha e cinza, e por baixo aparece o que é.',
    uso: 'Quebrar uma crença do mercado. O fogo é a virada: sincroniza o começo da queima com o "só que..." da tua fala.',
    params: [
      { key: 'rotuloA', label: 'Rótulo do cartão de cima', type: 'text', default: 'TE VENDERAM' },
      { key: 'a', label: 'O que queima', type: 'textarea', default: 'tu precisa de mais disciplina.' },
      { key: 'rotuloB', label: 'Rótulo do cartão de baixo', type: 'text', default: 'O QUE É' },
      { key: 'b', label: 'O que aparece', type: 'textarea', default: 'disciplina é o que sobra quando o tesão foi embora.' },
      { key: 'origem', label: 'Fogo começa', type: 'select', options: ['canto', 'centro', 'baixo'], default: 'canto' }
    ],
    draw: function (S, t) {
      var c = S.c, u = S.u, w = S.w, h = S.h, col = S.col, p = S.p, D = S.dur;
      var cw = S.vertical ? w - 130 * u : Math.min(w * 0.58, 1100 * u);
      var pad = 56 * u, labH = 64 * u;
      var maxH = S.vertical ? h * 0.32 : h * 0.4;
      var la = S.fitFlow(p.a, 'display', 400, cw - pad * 2, maxH, (S.vertical ? 120 : 100) * u, 1.02, 30 * u);
      var lb = S.fitFlow(p.b, 'display', 400, cw - pad * 2, maxH, (S.vertical ? 120 : 100) * u, 1.02, 30 * u);
      var size = Math.min(la.size, lb.size);
      S.font('display', size, 400);
      la = S.flow(p.a, { maxW: cw - pad * 2, lineH: size * 1.02 });
      lb = S.flow(p.b, { maxW: cw - pad * 2, lineH: size * 1.02 });
      var asc = S.capH();
      var ch = pad * 2 + labH + Math.max(la.height, lb.height) - size * 0.1;
      var cx = w / 2, cy = h * (S.vertical ? 0.47 : 0.5);

      var inK = S.inK(0, 0.75), out = S.outK(D - 0.5, D);
      var rot = (-5 + 3.8 * inK) * Math.PI / 180;
      var saved = S.c;

      function card(ctx, dark, label, lay, textK) {
        S.c = ctx;
        ctx.fillStyle = dark ? col.ink : col.paper;
        ctx.fillRect(0, 0, cw, ch);
        S.mottle(dark ? 0.1 : 0.05, dark ? '#000000' : col.ink);
        S.grain(dark ? 0.08 : 0.13, dark);
        S.label(label, pad, pad + 16 * u, { size: 22, weight: 600, color: col.ember });
        ctx.save();
        ctx.globalAlpha *= textK;
        S.blur((1 - textK) * 8 * u);
        S.font('display', size, 400);
        for (var i = 0; i < lay.words.length; i++) {
          var wd = lay.words[i];
          S.text(wd.text, pad + wd.x, pad + labH + asc + wd.y, { color: dark ? col.paper : col.ink });
        }
        ctx.restore();
        S.c = saved;
      }
      var A = S.layer('vA', cw, ch), B = S.layer('vB', cw, ch), comp = S.layer('vC', cw, ch);
      card(A.getContext('2d'), false, p.rotuloA, la, S.inK(0.4, 1.1));
      card(B.getContext('2d'), true, p.rotuloB, lb, 1);

      var b0 = 1.9, b1 = 3.8;
      var P = TC.lerp(-0.05, 1.12, TC.ease.inOutSine(S.lin(b0, b1)));
      var from = p.origem === 'centro' ? [[0.5, 0.5]] : p.origem === 'baixo' ? [[0.5, 1.05]] : [[1.02, -0.02]];
      var cc = comp.getContext('2d');
      cc.drawImage(B, 0, 0);
      var F = null;
      if (P > -0.05) {
        F = S.field({ rect: { x: 0, y: 0, w: cw, h: ch }, from: from, noise: 0.24, scale: 0.7, P: P, edge: 0.035, char: 0.12, res: 0.4, seed: 8 });
        S.applyKeep(A, F);
        S.applyChar(A, F);
        cc.drawImage(A, 0, 0);
        S.drawGlow(F, 1, cc);
      } else {
        cc.drawImage(A, 0, 0);
      }

      c.save();
      c.globalAlpha *= Math.min(1, inK * 1.4) * (1 - out);
      c.translate(cx, cy + (1 - inK) * 80 * u + out * 40 * u);
      c.rotate(rot);
      S.shadow(0.9);
      c.drawImage(comp, -cw / 2, -ch / 2);
      S.shadow(0);
      // fagulhas e cinza saindo da borda acesa
      if (F) {
        var r = TC.rng(71);
        for (var i = 0; i < 90; i++) {
          var fx = r(), fy = r(), life = 0.7 + r() * 0.7, ash = r() < 0.45;
          var f = S.fieldAt(F, fx * cw, fy * ch);
          var tp = b0 + invInOutSine((f + 0.05) / 1.17) * (b1 - b0);
          var dt = t - tp;
          if (dt < 0 || dt > life) continue;
          var q = dt / life;
          var x = (fx - 0.5) * cw + Math.sin(dt * 6 + i) * 10 * u;
          var y = (fy - 0.5) * ch + (ash ? q * q * 160 * u : -q * (90 + r() * 120) * u);
          c.globalAlpha = (1 - q) * (1 - out);
          if (ash) {
            c.fillStyle = col.ash;
            c.fillRect(x, y, 4 * u, 3 * u);
          } else {
            c.save(); c.globalCompositeOperation = 'lighter';
            c.fillStyle = q < 0.5 ? col.hot : col.glow;
            c.beginPath(); c.arc(x, y, (1.5 + r() * 2) * u, 0, Math.PI * 2); c.fill();
            c.restore();
          }
        }
      }
      c.restore();
    }
  });

  // ------------------------------------------------------------------
  // De → Pra — o calor viaja de uma ponta à outra
  // ------------------------------------------------------------------
  TC.register({
    id: 'fluxo',
    name: 'De → Pra',
    category: 'virar',
    duration: 5.5,
    minDur: 3.4,
    thumb: 3.6,
    description: 'De um lado a palavra fria, do outro a quente. Uma fagulha percorre a curva entre as duas e acende a segunda quando chega.',
    uso: 'Mostrar o caminho, não só o destino: de onde a pessoa sai e pra onde ela vai. A curva é editável (de reta a bem sinuosa).',
    params: [
      { key: 'a', label: 'De', type: 'text', default: 'obrigação' },
      { key: 'legendaA', label: 'Legenda do "de"', type: 'text', default: 'fazer porque tem que.' },
      { key: 'b', label: 'Pra', type: 'text', default: 'devoção' },
      { key: 'legendaB', label: 'Legenda do "pra"', type: 'text', default: 'fazer porque não consegue não fazer.' },
      { key: 'curva', label: 'Curva do caminho (0 a 100)', type: 'number', min: 0, max: 100, default: 60 },
      { key: 'fundo', label: 'Fundo', type: 'select', options: ['painel', 'nenhum'], default: 'painel' }
    ],
    draw: function (S, t) {
      var c = S.c, u = S.u, w = S.w, h = S.h, col = S.col, p = S.p, D = S.dur;
      var out = S.outK(D - 0.5, D);
      var panel = p.fundo !== 'nenhum';
      var box = S.vertical ? { x: 50 * u, y: h * 0.2, w: w - 100 * u, h: h * 0.54 } : { x: w * 0.1, y: h * 0.18, w: w * 0.8, h: h * 0.62 };
      var pad = 60 * u;
      var bend = TC.clamp(Number(p.curva), 0, 100) / 100;
      var size = Math.min(S.fit(p.a, 'display', 400, box.w * (S.vertical ? 0.62 : 0.34), 150 * u, 40 * u), S.fit(p.b, 'display', 400, box.w * (S.vertical ? 0.62 : 0.34), 150 * u, 40 * u));
      var LAc = S.textLayer(p.a, 'display', size, 400, col.ash);
      var LBc = S.textLayer(p.b, 'display', size, 400, col.ash), LBh = S.textLayer(p.b, 'display', size, 400, col.ember);
      var ls = (S.vertical ? 38 : 30) * u;
      var A, B, P0, P3, C1, C2, alignB;
      if (S.vertical) {
        A = { x: box.x + pad, y: box.y + pad + LAc.asc };
        B = { x: box.x + box.w - pad - LBc.w, y: box.y + box.h - pad - LBc.desc - ls * 2.6 - 10 * u };
        P0 = [A.x + LAc.w * 0.5, A.y + LAc.desc + ls * 2.6 + 50 * u];
        P3 = [B.x + LBc.w * 0.5, B.y - LBc.asc - 34 * u];
        var dy = P3[1] - P0[1];
        C1 = [P0[0] - box.w * 0.25 * bend, P0[1] + dy * (0.2 + 0.6 * bend)];
        C2 = [P3[0] + box.w * 0.25 * bend, P3[1] - dy * (0.2 + 0.6 * bend)];
        alignB = 'right';
      } else {
        A = { x: box.x + pad, y: box.y + box.h * 0.45 };
        B = { x: box.x + box.w - pad - LBc.w, y: box.y + box.h * 0.45 };
        P0 = [A.x + LAc.w + 40 * u, A.y - LAc.asc * 0.45];
        P3 = [B.x - 40 * u, B.y - LBc.asc * 0.45];
        var dx = P3[0] - P0[0];
        C1 = [P0[0] + dx * 0.3, P0[1] - box.h * 0.5 * bend];
        C2 = [P3[0] - dx * 0.3, P3[1] + box.h * 0.5 * bend];
        alignB = 'left';
      }
      function bz(q) {
        var m = 1 - q;
        return [m * m * m * P0[0] + 3 * m * m * q * C1[0] + 3 * m * q * q * C2[0] + q * q * q * P3[0],
          m * m * m * P0[1] + 3 * m * m * q * C1[1] + 3 * m * q * q * C2[1] + q * q * q * P3[1]];
      }

      c.save();
      c.globalAlpha *= 1 - out;
      c.translate(0, -out * 24 * u);
      if (out > 0) S.blur(out * 8 * u);
      if (panel) {
        var pk = S.inK(0, 0.6);
        c.save(); c.globalAlpha *= pk; S.shadow(0.9);
        S.fillRRect(box.x, box.y + (1 - pk) * 30 * u, box.w, box.h, 34 * u, TC.rgba(col.ink, 0.92));
        c.restore();
      }
      var sh = panel ? 0 : 0.9;
      function word(L, x, y, k) {
        c.save(); c.globalAlpha *= k; S.blur((1 - k) * 10 * u); S.shadow(sh);
        c.drawImage(L.cv, x - L.pad, y - L.asc - L.pad + (1 - k) * 20 * u);
        c.restore();
      }
      function legend(str, x, y, k, color, align) {
        if (!str) return;
        c.save(); c.globalAlpha *= k; S.blur((1 - k) * 6 * u); S.shadow(sh);
        S.font('sans', ls, 500);
        var lines = S.wrap(str, S.vertical ? box.w * 0.7 : box.w * 0.3);
        for (var i = 0; i < lines.length; i++) S.text(lines[i], x, y + i * ls * 1.3 + (1 - k) * 10 * u, { color: color, align: align });
        c.restore();
      }
      word(LAc, A.x, A.y, S.inK(0.2, 0.8));
      legend(p.legendaA, A.x, A.y + LAc.desc + ls + 18 * u, S.inK(0.5, 1.0), col.ash, 'left');

      // caminho + fagulha
      var k = S.inK(1.0, 2.0);
      if (k > 0) {
        var N = 90;
        c.save();
        c.lineCap = 'round';
        for (var i = 0; i < N * k; i++) {
          var a = bz(i / N), b = bz(Math.min(k, (i + 1) / N));
          var heat = TC.clamp(1 - (k - i / N) * 3, 0, 1);
          c.strokeStyle = TC.mixHex(col.ash, col.ember, heat * (k < 1 ? 1 : 0.4) + (k >= 1 ? 0.4 : 0));
          c.globalAlpha = (0.55 + 0.45 * heat) * (1 - out);
          c.lineWidth = (4 + 2 * heat) * u;
          c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke();
        }
        c.restore();
        if (k < 1) {
          var hp = bz(k);
          c.save(); c.globalCompositeOperation = 'lighter';
          var g = c.createRadialGradient(hp[0], hp[1], 0, hp[0], hp[1], 44 * u);
          g.addColorStop(0, TC.rgba(col.hot, 0.95)); g.addColorStop(0.3, TC.rgba(col.glow, 0.5)); g.addColorStop(1, TC.rgba(col.glow, 0));
          c.fillStyle = g; c.fillRect(hp[0] - 44 * u, hp[1] - 44 * u, 88 * u, 88 * u);
          c.restore();
        }
      }
      // B chega fria e acende quando a fagulha chega
      var kB = S.inK(1.6, 2.1), heatB = S.inK(2.0, 2.7);
      word(LBc, B.x, B.y, kB * (1 - heatB));
      if (heatB > 0) {
        word(LBh, B.x, B.y, kB * heatB);
        c.save(); c.globalCompositeOperation = 'lighter';
        c.globalAlpha *= heatB * (0.16 + 0.08 * Math.sin(t * 1.8));
        S.glow(0.9, col.glow);
        c.drawImage(LBh.cv, B.x - LBh.pad, B.y - LBh.asc - LBh.pad);
        c.restore();
        S.sparks({ count: 10, seed: 81, area: { x: B.x, y: B.y - LBh.asc - 140 * u, w: LBh.w, h: LBh.asc + 140 * u }, alpha: heatB * (1 - S.lin(3.2, 4.4)) });
      }
      legend(p.legendaB, alignB === 'right' ? B.x + LBc.w : B.x, B.y + LBc.desc + ls + 18 * u, S.inK(2.4, 3.0), col.paper, alignB);
      c.restore();
    }
  });

  // ------------------------------------------------------------------
  // Pergunta — e o respiro pra pessoa responder
  // ------------------------------------------------------------------
  TC.register({
    id: 'pergunta',
    name: 'Pergunta',
    category: 'virar',
    duration: 6,
    minDur: 3.5,
    thumb: 3.7,
    description: 'A pergunta entra palavra por palavra e, quando termina, uma brasa pequena fica respirando embaixo. É o tempo da pessoa responder por dentro.',
    uso: 'Pré-compromisso: a pergunta que faz a pessoa se posicionar sozinha. Não corta logo depois: o respiro é onde ela responde.',
    params: [
      { key: 'intro', label: 'Frase de entrada (opcional)', type: 'text', default: '' },
      { key: 'pergunta', label: 'Pergunta', type: 'textarea', default: 'quanto te custa não fazer o que tu ama?' },
      { key: 'destaque', label: 'Palavras em brasa', type: 'text', default: 'te custa' },
      { key: 'fundo', label: 'Fundo', type: 'select', options: ['tinta', 'papel', 'vídeo'], default: 'tinta' },
      { key: 'respiro', label: 'Brasa respirando no fim', type: 'select', options: ['sim', 'não'], default: 'sim' }
    ],
    draw: function (S, t) {
      var c = S.c, u = S.u, w = S.w, h = S.h, col = S.col, p = S.p, D = S.dur;
      var paper = p.fundo === 'papel', over = p.fundo === 'vídeo';
      var out = S.outK(D - 0.6, D);
      background(S, p.fundo, S.lin(0, 0.45) * (1 - out));
      var mx = S.vertical ? 84 * u : w * 0.1;
      var maxW = S.vertical ? w - mx * 2 : w * 0.7;
      var lay = S.fitFlow(p.pergunta, 'display', 400, maxW, S.vertical ? h * 0.42 : h * 0.5, (S.vertical ? 180 : 150) * u, 1.0, 40 * u);
      var size = lay.size;
      S.font('display', size, 400);
      var asc = S.capH();
      var y0 = h * (S.vertical ? 0.44 : 0.46) - lay.height / 2;
      var ink = paper ? col.ink : col.paper;
      var hi = TC.wordSet(p.destaque);
      var n = lay.words.length, per = Math.min(0.12, 1.5 / Math.max(1, n));
      var endT = 0.5 + n * per + 0.5;
      var hk = S.inK(endT, endT + 0.7);
      c.save();
      if (p.intro) {
        var ik = S.inK(0.2, 0.7) * (1 - out);
        c.save(); c.globalAlpha *= ik; S.blur((1 - ik) * 6 * u); if (over) S.shadow(0.9);
        S.font('sans', (S.vertical ? 46 : 38) * u, 500, true);
        S.text(p.intro, mx, y0 - 34 * u, { color: col.ash });
        c.restore();
      }
      S.font('display', size, 400);
      for (var i = 0; i < n; i++) {
        var wd = lay.words[i];
        var k = S.inK(0.5 + i * per, 1.05 + i * per);
        var ko = S.outK(D - 0.7 + (i / n) * 0.2, D - 0.1);
        if (k <= 0) continue;
        c.save();
        c.globalAlpha *= k * (1 - ko);
        S.blur((1 - k) * 10 * u + ko * 10 * u);
        if (over) S.shadow(0.9);
        S.text(wd.text, mx + wd.x, y0 + wd.y + asc + (1 - k) * 22 * u - ko * 20 * u, { color: hi[wd.key] ? TC.mixHex(ink, col.ember, hk) : ink });
        c.restore();
      }
      // respiro
      if (p.respiro !== 'não') {
        var rk = S.inK(endT + 0.3, endT + 0.9) * (1 - out);
        if (rk > 0) {
          var bx = mx + 18 * u, byy = y0 + lay.height + 110 * u;
          var br = 0.6 + 0.4 * Math.sin((t - endT) * 2.2);
          c.save(); c.globalAlpha *= rk;
          var since = t - endT - 0.3;
          var ring = (since % 1.8) / 1.8;
          c.strokeStyle = TC.rgba(col.ember, 0.5 * (1 - ring)); c.lineWidth = 2 * u;
          c.beginPath(); c.arc(bx, byy, 14 * u + ring * 46 * u, 0, Math.PI * 2); c.stroke();
          S.coal(bx, byy, 16 * u, { heat: 0.55 + 0.45 * br, seed: 3 });
          c.restore();
        }
      }
      c.restore();
    }
  });
})(typeof window !== 'undefined' ? window : this);
