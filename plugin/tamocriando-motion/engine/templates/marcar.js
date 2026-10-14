/* Marcar: o que tem que ficar no outro */
(function (root) {
  'use strict';
  var TC = root.TC;

  function posY(S, pos, blockH) {
    if (pos === 'topo') return S.safe.top + blockH / 2 + 30 * S.u;
    if (pos === 'centro') return S.h * 0.5;
    return S.vertical ? S.h * 0.64 : S.h * 0.72;
  }

  // ------------------------------------------------------------------
  // Marca — ferro em brasa
  // ------------------------------------------------------------------
  TC.register({
    id: 'marca',
    name: 'Marca',
    category: 'marcar',
    duration: 4.5,
    minDur: 3,
    thumb: 2.9,
    curves: { entrada: [0.7, 0, 0.84, 0] },
    description: 'A palavra desce quente como ferro em brasa, bate, chamusca o papel e esfria. O que fica é a marca, com um resto de brasa por dentro.',
    uso: 'A palavra que tu quer que o outro leve embora. Uma por vídeo. Deixa a fala respirar em volta: o silêncio depois do impacto é o que grava.',
    params: [
      { key: 'antes', label: 'Texto pequeno antes (opcional)', type: 'text', default: 'o que fica é a' },
      { key: 'palavra', label: 'Palavra', type: 'text', default: 'marca' },
      { key: 'fundo', label: 'Fundo', type: 'select', options: ['papel', 'tinta', 'transparente'], default: 'papel' }
    ],
    draw: function (S, t) {
      var c = S.c, u = S.u, w = S.w, h = S.h, col = S.col, p = S.p, D = S.dur;
      var out = S.outK(D - 0.5, D);
      var bgMode = p.fundo;
      c.save();
      c.globalAlpha = 1 - out;
      if (bgMode === 'papel') S.paper(col.paper);
      else if (bgMode === 'tinta') S.paper(col.ink, { dark: true });
      var T0 = 0.42;
      var size = S.fit(p.palavra, 'display', 400, w * 0.8, (S.vertical ? 380 : 320) * u, 60 * u);
      var m = c.measureText(p.palavra), asc = m.actualBoundingBoxAscent || size * 0.75, desc = m.actualBoundingBoxDescent || 0;
      var tw = m.width;
      var cx = w / 2, cy = h * (S.vertical ? 0.48 : 0.5);
      var base = cy + (asc - desc) / 2;
      var sh = S.shake(T0, 0.32, 10);
      c.translate(sh.x, sh.y);

      var k = S.inK(0, T0);
      var cool = TC.ease.outCubic(S.lin(T0, T0 + 1.7));
      var finalCol = bgMode === 'papel' ? TC.mixHex(col.crust, col.ink, 0.25) : bgMode === 'tinta' ? TC.mixHex(col.ember, col.ink, 0.15) : col.paper;
      var color = cool < 0.35 ? TC.mixHex(col.hot, col.ember, cool / 0.35) : TC.mixHex(col.ember, finalCol, (cool - 0.35) / 0.65);
      if (t < T0) color = col.hot;
      var breath = 0.75 + 0.25 * Math.sin(t * 1.6);

      // halo chamuscado (o papel queimado em volta das letras)
      var scorch = S.lin(T0, T0 + 0.3);
      if (scorch > 0) {
        c.save();
        c.globalAlpha *= scorch * (bgMode === 'tinta' ? 0.5 : 0.42);
        S.blur(22 * u);
        S.text(p.palavra, cx, base, { align: 'center', color: bgMode === 'tinta' ? col.ember : col.crust });
        c.restore();
      }
      // a palavra
      c.save();
      var sc = 1.35 - 0.35 * k;
      c.translate(cx, cy); c.scale(sc, sc); c.translate(-cx, -cy);
      c.globalAlpha *= Math.min(1, k * 3 + (t >= T0 ? 1 : 0));
      S.blur((1 - k) * 14 * u);
      S.text(p.palavra, cx, base, { align: 'center', color: color });
      c.restore();
      // brilho: forte no impacto, depois só um resto de brasa respirando
      var glowA = (1 - cool) * 0.95 + 0.14 * breath * (bgMode === 'papel' ? 1 : 1.4);
      if (t < T0) glowA = k;
      c.save();
      c.globalCompositeOperation = 'lighter';
      c.globalAlpha *= glowA * (bgMode === 'papel' ? 0.55 : 0.8);
      S.glow(0.9, col.glow);
      S.text(p.palavra, cx, base, { align: 'center', color: TC.rgba(col.ember, 0.6) });
      c.restore();

      // clarão + fumaça + faíscas do impacto
      var fk = S.lin(T0, T0 + 0.28);
      if (fk > 0 && fk < 1) {
        c.save(); c.globalCompositeOperation = 'lighter';
        var fg = c.createRadialGradient(cx, cy, 0, cx, cy, tw * 0.8);
        fg.addColorStop(0, TC.rgba(col.hot, 0.5 * (1 - fk))); fg.addColorStop(1, TC.rgba(col.glow, 0));
        c.fillStyle = fg; c.fillRect(0, 0, w, h);
        c.restore();
      }
      if (t > T0) {
        var r = TC.rng(33), dt = t - T0;
        for (var i = 0; i < 12; i++) {
          var px = cx + (r() - 0.5) * tw, life = 1.4 + r() * 0.8, q = dt / life;
          if (q >= 1) continue;
          var rad = (30 + q * 120) * u * (0.6 + r() * 0.6);
          var sx = px + (r() - 0.5) * 60 * u * q, sy = base - asc * 0.3 - q * (120 + r() * 160) * u;
          var g = c.createRadialGradient(sx, sy, 0, sx, sy, rad);
          var smoke = bgMode === 'papel' ? col.ink : col.ash;
          g.addColorStop(0, TC.rgba(smoke, 0.14 * Math.sin(q * Math.PI))); g.addColorStop(1, TC.rgba(smoke, 0));
          c.fillStyle = g; c.fillRect(sx - rad, sy - rad, rad * 2, rad * 2);
        }
        c.save(); c.globalCompositeOperation = 'lighter';
        for (var j = 0; j < 22; j++) {
          var ang = r() * Math.PI * 2, spd = (200 + r() * 520) * u, q2 = dt / (0.5 + r() * 0.5);
          if (q2 >= 1) continue;
          var dd = spd * (1 - Math.pow(1 - q2, 3)) * 0.6;
          c.globalAlpha = (1 - q2) * 0.9;
          c.fillStyle = r() < 0.5 ? col.hot : col.glow;
          c.beginPath();
          c.arc(cx + Math.cos(ang) * (tw * 0.35 + dd), cy + Math.sin(ang) * (asc * 0.4 + dd * 0.6) + q2 * q2 * 60 * u, (1.5 + r() * 2.5) * u, 0, Math.PI * 2);
          c.fill();
        }
        c.restore();
      }

      // texto pequeno antes
      if (p.antes) {
        var ak = S.inK(T0 + 0.7, T0 + 1.4);
        c.save();
        c.globalAlpha *= ak;
        S.blur((1 - ak) * 8 * u);
        S.font('sans', (S.vertical ? 56 : 44) * u, 500);
        S.text(p.antes, cx - tw / 2 + 6 * u, base - asc - 46 * u + (1 - ak) * 14 * u, { color: bgMode === 'papel' ? TC.mixHex(col.ink, col.ash, 0.35) : col.ash });
        c.restore();
      }
      c.restore();
    }
  });

  // ------------------------------------------------------------------
  // Palavra Acesa — sai do morno e acende
  // ------------------------------------------------------------------
  TC.register({
    id: 'palavra-acesa',
    name: 'Palavra Acesa',
    category: 'marcar',
    duration: 4,
    minDur: 2,
    thumb: 2.3,
    description: 'Duas linhas em minúsculas e, no meio, a palavra-chave grande. Ela entra cinza, esquenta até virar brasa e fica respirando.',
    uso: 'A frase central de um Reels de rosto. A pessoa vê a palavra mudar de temperatura e entende sem tu explicar o que importa ali.',
    params: [
      { key: 'linha1', label: 'Linha de cima', type: 'text', default: 'o morno' },
      { key: 'destaque', label: 'Palavra que acende', type: 'text', default: 'não marca' },
      { key: 'linha2', label: 'Linha de baixo', type: 'text', default: 'ninguém.' },
      { key: 'posicao', label: 'Posição', type: 'select', options: ['baixo', 'centro', 'topo'], default: 'baixo' },
      { key: 'fundo', label: 'Leitura', type: 'select', options: ['sombra', 'faixa'], default: 'sombra' }
    ],
    draw: function (S, t) {
      var c = S.c, u = S.u, w = S.w, col = S.col, p = S.p, D = S.dur;
      var maxW = w * (S.vertical ? 0.86 : 0.6);
      var sD = S.fit(p.destaque, 'display', 400, maxW, (S.vertical ? 170 : 130) * u, 40 * u);
      var mD = c.measureText(p.destaque), ascD = mD.actualBoundingBoxAscent || sD * 0.75, descD = mD.actualBoundingBoxDescent || 0;
      var s1 = (S.vertical ? 68 : 52) * u;
      S.font('sans', s1, 700);
      var wl = Math.max(p.linha1 ? S.measure(p.linha1) : 0, p.linha2 ? S.measure(p.linha2) : 0);
      if (wl > maxW) { s1 *= maxW / wl; }
      var r1 = p.linha1 ? s1 * 1.35 : 0, r2 = p.linha2 ? s1 * 1.35 : 0;
      var rD = ascD + descD + 24 * u;
      var blockH = r1 + rD + r2;
      var cy = posY(S, p.posicao, blockH);
      var top = cy - blockH / 2;
      var out = S.outK(D - 0.55, D);
      var cx = w / 2;
      var dark = p.fundo === 'faixa';

      c.save();
      c.globalAlpha *= 1 - out;
      c.translate(0, -out * 24 * u);
      if (out > 0) S.blur(out * 10 * u);
      if (dark) {
        var fk = S.inK(0, 0.5);
        S.font('display', sD, 400);
        var bw = Math.max(c.measureText(p.destaque).width, wl) + 110 * u;
        c.save(); c.globalAlpha *= fk;
        S.fillRRect(cx - bw / 2, top - 30 * u, bw, blockH + 60 * u, 26 * u, TC.rgba(col.ink, 0.86));
        c.restore();
      }
      function line(str, y, a, b) {
        if (!str) return;
        var k = S.inK(a, b);
        c.save();
        c.globalAlpha *= k;
        S.blur((1 - k) * 8 * u);
        if (!dark) S.shadow(0.9);
        S.font('sans', s1, 700);
        S.text(str, cx, y + (1 - k) * 24 * u, { align: 'center', color: col.paper });
        c.restore();
      }
      line(p.linha1, top + s1 * 1.02, 0, 0.6);
      // a palavra: entra fria, esquenta
      var dy = top + r1 + 12 * u + ascD;
      var kd = S.inK(0.25, 0.85);
      var heat = S.inK(0.95, 1.6);
      var cooling = out;
      var breath = 0.8 + 0.2 * Math.sin(t * 1.8);
      var color = TC.mixHex(col.ash, col.ember, heat * (1 - cooling));
      var layer = S.layer('pa', w, Math.ceil(ascD + descD + 80 * u)), lc = layer.getContext('2d');
      lc.font = '400 ' + sD + 'px ' + S.fonts.display;
      lc.textAlign = 'center'; lc.textBaseline = 'alphabetic';
      lc.fillStyle = color;
      lc.fillText(p.destaque, cx, 40 * u + ascD);
      c.save();
      c.globalAlpha *= kd;
      S.blur((1 - kd) * 10 * u);
      if (!dark) S.shadow(0.7);
      var shim = heat > 0 && heat < 1 ? Math.sin(heat * Math.PI) * 5 : 0;
      S.shimmer(layer, 0, dy - ascD - 40 * u + (1 - kd) * 20 * u, shim);
      c.restore();
      if (heat > 0.01) {
        c.save();
        c.globalCompositeOperation = 'lighter';
        c.globalAlpha *= heat * (0.22 + 0.14 * breath) * (1 - cooling);
        S.glow(0.9, col.glow);
        c.drawImage(layer, 0, dy - ascD - 40 * u);
        c.restore();
        S.font('display', sD, 400);
        var tw = c.measureText(p.destaque).width;
        S.sparks({ count: 12, seed: 61, area: { x: cx - tw / 2, y: dy - ascD - 160 * u, w: tw, h: ascD + 160 * u }, alpha: heat * (1 - S.lin(1.8, 3)) * (1 - cooling) });
      }
      line(p.linha2, top + r1 + rD + s1 * 1.02, 0.6, 1.2);
      c.restore();
    }
  });

  // ------------------------------------------------------------------
  // Cartela Tese — o carrossel em movimento
  // ------------------------------------------------------------------
  TC.register({
    id: 'tese',
    name: 'Cartela Tese',
    category: 'marcar',
    full: true,
    duration: 6,
    minDur: 3,
    thumb: 3.4,
    description: 'Chama e rótulo no canto, frase grande em minúsculas, textura de papel. As linhas sobem como calor e entram em foco. É o "O DESTINO" dos teus carrosséis, em vídeo.',
    uso: 'A frase que o outro vai printar. Funciona como respiro entre trechos de fala: a pessoa lê no ritmo dela.',
    params: [
      { key: 'rotulo', label: 'Rótulo', type: 'text', default: 'O DESTINO' },
      { key: 'texto', label: 'Texto', type: 'textarea', default: 'a brasa é o que tu não consegue não mostrar.' },
      { key: 'destaque', label: 'Palavras em destaque', type: 'text', default: '' },
      { key: 'tema', label: 'Tema', type: 'select', options: ['brasa', 'papel', 'tinta'], default: 'brasa' },
      { key: 'assinatura', label: 'Assinatura embaixo', type: 'select', options: ['não', 'sim'], default: 'não' },
      { key: 'nome', label: 'Nome (assinatura)', type: 'text', fromBrand: 'nome', default: 'herton hemann' }
    ],
    draw: function (S, t) {
      var c = S.c, u = S.u, w = S.w, h = S.h, col = S.col, p = S.p, D = S.dur;
      var th = {
        brasa: { bg: col.ember, ink: col.paper, sub: TC.rgba(col.paper, 0.85), hi: col.ink, icon: col.paper, dark: false },
        papel: { bg: col.paper, ink: col.ink, sub: col.ember, hi: col.ember, icon: col.ember, dark: false },
        tinta: { bg: col.ink, ink: col.paper, sub: col.ash, hi: col.ember, icon: col.ember, dark: true }
      }[p.tema] || null;
      if (!th) th = { bg: col.ember, ink: col.paper, sub: col.paper, hi: col.ink, icon: col.paper, dark: false };
      var bgIn = S.inK(0, 0.9), out = S.outK(D - 0.6, D);
      c.save();
      c.globalAlpha = S.lin(0, 0.35) * (1 - out);
      var sc = 1.04 - 0.04 * bgIn;
      c.translate(w / 2, h / 2); c.scale(sc, sc); c.translate(-w / 2, -h / 2);
      S.paper(th.bg, { dark: th.dark, mottle: p.tema === 'brasa' ? 0.08 : undefined });
      c.restore();

      var mx = S.vertical ? 84 * u : w * 0.08, top = h * (S.vertical ? 0.11 : 0.11);
      c.save();
      c.globalAlpha *= 1 - out;
      // chama + rótulo + traço
      var ik = S.inK(0.25, 0.9);
      if (ik > 0) S.flame(mx + 20 * u, top - 4 * u, 52 * u, th.icon, { height: ik, flicker: 0.25 });
      if (p.rotulo) {
        var lab = String(p.rotulo).toLocaleUpperCase('pt-BR');
        var n = Math.floor(S.lin(0.4, 0.4 + lab.length * 0.04) * lab.length);
        S.label(lab.slice(0, n), mx + 62 * u, top + 9 * u, { size: 24, weight: 500, color: th.sub });
      }
      var lk = S.inK(0.5, 1.0);
      c.fillStyle = th.sub;
      c.fillRect(mx, top + 46 * u, 96 * u * lk, 3 * u);

      // frase
      var sig = p.assinatura === 'sim';
      var areaTop = top + 120 * u, areaBot = h * (sig ? 0.8 : 0.86);
      var maxW = S.vertical ? w - mx * 2 : w * 0.66;
      var lay = S.fitFlow(p.texto, 'display', 400, maxW, areaBot - areaTop, (S.vertical ? 230 : 180) * u, 1.0, 40 * u);
      var size = lay.size;
      S.font('display', size, 400);
      var asc = S.capH();
      var y0 = areaTop + Math.max(0, (areaBot - areaTop - lay.height) * 0.35);
      var hi = TC.wordSet(p.destaque);
      var hk = S.inK(1.5 + lay.lines * 0.12, 2.2 + lay.lines * 0.12);
      for (var l = 0; l < lay.lines; l++) {
        var k = S.inK(0.5 + l * 0.12, 1.3 + l * 0.12);
        var ko = S.outK(D - 0.75 + l * 0.04, D - 0.15);
        if (k <= 0) continue;
        c.save();
        c.globalAlpha *= k * (1 - ko);
        S.blur((1 - k) * 12 * u + ko * 10 * u);
        var yy = y0 + l * size + asc + (1 - k) * size * 0.3 - ko * size * 0.2;
        for (var i = 0; i < lay.words.length; i++) {
          var wd = lay.words[i];
          if (wd.line !== l) continue;
          S.text(wd.text, mx + wd.x, yy, { color: hi[wd.key] ? TC.mixHex(th.ink, th.hi, hk) : th.ink });
        }
        c.restore();
      }
      if (sig) {
        var sk = S.inK(1.2, 1.8);
        c.save(); c.globalAlpha *= sk;
        S.flame(mx + 18 * u, h * 0.9 - 18 * u, 40 * u, th.icon, { flicker: 0.3 });
        S.font('display', 44 * u, 400);
        S.text(p.nome, mx + 50 * u, h * 0.9, { color: th.ink });
        c.restore();
      }
      c.restore();
    }
  });

  // ------------------------------------------------------------------
  // Número — o anel esquenta enquanto conta
  // ------------------------------------------------------------------
  function parseNum(v) {
    var s = String(v).trim().replace(/\s/g, '');
    if (s.indexOf(',') >= 0) s = s.replace(/\./g, '').replace(',', '.');
    var n = parseFloat(s);
    return isNaN(n) ? 0 : n;
  }
  function fmt(n, casas) {
    try { return n.toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas }); }
    catch (e) { return n.toFixed(casas); }
  }

  TC.register({
    id: 'numero',
    name: 'Número',
    category: 'marcar',
    duration: 4.5,
    minDur: 2.6,
    thumb: 2.8,
    description: 'Número contando dentro de um anel que esquenta do cinza à brasa. Com "total", o anel mostra a proporção (4 de 5 fecha 80% da volta).',
    uso: 'Prova: resultado de cliente, a régua da garantia, um dado. Número sem contexto é enfeite, então a legenda diz de onde ele vem.',
    params: [
      { key: 'prefixo', label: 'Antes do número', type: 'text', default: '' },
      { key: 'valor', label: 'Valor', type: 'text', default: '4' },
      { key: 'sufixo', label: 'Depois do número', type: 'text', default: '' },
      { key: 'total', label: 'Total (opcional)', type: 'text', default: '5' },
      { key: 'casas', label: 'Casas decimais', type: 'number', min: 0, max: 2, default: 0 },
      { key: 'rotulo', label: 'Legenda', type: 'text', default: 'de cada 5 pessoas entendem o que tu faz, na hora.' },
      { key: 'posicao', label: 'Posição', type: 'select', options: ['centro', 'baixo', 'topo'], default: 'centro' }
    ],
    draw: function (S, t) {
      var c = S.c, u = S.u, w = S.w, h = S.h, col = S.col, p = S.p, D = S.dur;
      var R = (S.vertical ? 250 : 210) * u, cx = w / 2;
      var cy = p.posicao === 'topo' ? S.safe.top + R + 30 * u : p.posicao === 'baixo' ? (S.vertical ? h * 0.58 : h * 0.55) : h * (S.vertical ? 0.42 : 0.44);
      var target = parseNum(p.valor), total = parseNum(p.total), casas = TC.clamp(Math.round(Number(p.casas) || 0), 0, 3);
      var frac = total > 0 ? TC.clamp(target / total, 0, 1) : 1;
      var k = S.inK(0.35, 2.0), pop = S.inK(0, 0.55), out = S.outK(D - 0.45, D);
      var sc = (0.85 + 0.15 * pop) * (1 - 0.15 * out);
      var done = S.lin(2.0, 2.4), pulse = 1 + 0.04 * Math.sin(done * Math.PI);
      c.save();
      c.globalAlpha *= Math.min(1, pop * 1.5) * (1 - out);
      c.translate(cx, cy); c.scale(sc * pulse, sc * pulse); c.translate(-cx, -cy);
      c.save(); S.shadow(0.9);
      c.fillStyle = TC.rgba(col.ink, 0.95); c.beginPath(); c.arc(cx, cy, R, 0, Math.PI * 2); c.fill();
      c.restore();
      var rr = R - 28 * u;
      c.strokeStyle = TC.rgba(col.ash, 0.22); c.lineWidth = 10 * u;
      c.beginPath(); c.arc(cx, cy, rr, 0, Math.PI * 2); c.stroke();
      var arc = frac * k, segs = 48;
      c.lineCap = 'round'; c.lineWidth = 12 * u;
      for (var i = 0; i < segs; i++) {
        var a0 = i / segs, a1 = (i + 1) / segs;
        if (a0 >= arc) break;
        c.strokeStyle = TC.mixHex(col.ash, col.ember, Math.pow(a0 / Math.max(arc, 0.001), 0.7) * Math.min(1, k * 1.3));
        c.beginPath();
        c.arc(cx, cy, rr, -Math.PI / 2 + a0 * Math.PI * 2, -Math.PI / 2 + Math.min(a1, arc) * Math.PI * 2 + 0.01);
        c.stroke();
      }
      if (arc > 0.01) {
        var ha = -Math.PI / 2 + arc * Math.PI * 2, hx = cx + Math.cos(ha) * rr, hy = cy + Math.sin(ha) * rr;
        c.save(); c.globalCompositeOperation = 'lighter';
        var hg = c.createRadialGradient(hx, hy, 0, hx, hy, 40 * u);
        hg.addColorStop(0, TC.rgba(col.hot, 0.9)); hg.addColorStop(1, TC.rgba(col.glow, 0));
        c.fillStyle = hg; c.fillRect(hx - 40 * u, hy - 40 * u, 80 * u, 80 * u);
        c.restore();
      }
      var pre = String(p.prefixo || ''), suf = String(p.sufixo || ''), tot = total > 0 ? '/' + fmt(total, 0) : '';
      var mid = fmt(target * k, casas);
      var size = S.fit(pre + fmt(target, casas) + suf, 'display', 400, rr * 1.35, R * 0.85, 40 * u);
      var asc = S.capH(), sfx = size * 0.42;
      var midW = S.measure(pre + mid + suf);
      S.font('display', sfx, 400);
      var totW = tot ? S.measure(tot) + 8 * u : 0;
      var x = cx - (midW + totW) / 2, base = cy + asc / 2;
      S.font('display', size, 400);
      S.text(pre + mid + suf, x, base, { color: col.paper });
      if (tot) { S.font('display', sfx, 400); S.text(tot, x + midW + 8 * u, base, { color: col.ash }); }
      c.restore();
      if (p.rotulo) {
        var lk = S.inK(1.0, 1.6) * (1 - S.outK(D - 0.5, D - 0.1));
        c.save();
        c.globalAlpha *= lk;
        S.blur((1 - lk) * 6 * u);
        S.shadow(1);
        S.font('sans', (S.vertical ? 44 : 38) * u, 600);
        var lines = S.wrap(String(p.rotulo), w * 0.78);
        for (var j = 0; j < lines.length; j++) {
          S.text(lines[j], cx, cy + R + 80 * u + j * 56 * u + (1 - lk) * 16 * u, { align: 'center', color: col.paper });
        }
        c.restore();
      }
    }
  });
})(typeof window !== 'undefined' ? window : this);
