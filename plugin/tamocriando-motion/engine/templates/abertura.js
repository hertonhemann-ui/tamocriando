/* Abertura e fim: vinhetas que abrem e fecham o vídeo */
(function (root) {
  'use strict';
  var TC = root.TC, E = TC.ease;

  // ------------------------------------------------------------------
  // Intro Brasa — a faísca que acende a marca
  // ------------------------------------------------------------------
  TC.register({
    id: 'intro-brasa',
    name: 'Intro Brasa',
    category: 'abertura',
    full: true,
    duration: 4,
    minDur: 3,
    thumb: 3.0,
    description: 'Uma faísca sobe, explode em brasa, acende o raio e a marca entra. A frase é digitada embaixo.',
    uso: 'Abertura de vídeo longo, aula, live ou série fixa. Em Reels curto, prefere entrar direto no gancho.',
    params: [
      { key: 'pre', label: 'Texto pequeno (em cima)', type: 'text', fromBrand: 'pre', default: 'HERTON DO' },
      { key: 'titulo', label: 'Título', type: 'text', fromBrand: 'marca', default: 'NOVO MKT' },
      { key: 'tagline', label: 'Frase digitada', type: 'text', fromBrand: 'slogan', default: 'O NOVO MKT É SER REAL.' }
    ],
    draw: function (S, t) {
      var c = S.c, u = S.u, w = S.w, h = S.h, col = S.col, p = S.p, D = S.dur;
      var out = TC.ramp(t, D - 0.6, D - 0.2, E.inCubic);
      var bgOut = TC.ramp(t, D - 0.4, D, E.inOutCubic);
      var cx = w / 2, cy = h * 0.5;

      c.save();
      c.globalAlpha = 1 - bgOut;
      c.fillStyle = col.dark; c.fillRect(0, 0, w, h);
      var glowK = TC.ramp(t, 0.6, 1.9, E.outCubic) * (1 - out);
      var gr = c.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h) * 0.6);
      gr.addColorStop(0, TC.rgba(col.accent, 0.22 * glowK));
      gr.addColorStop(1, TC.rgba(col.accent, 0));
      c.fillStyle = gr; c.fillRect(0, 0, w, h);
      S.embers({ count: 46, seed: 5, alpha: TC.ramp(t, 0.8, 2.2, E.linear) * (1 - out) * 0.9 });
      S.grain(0.07, true);
      c.restore();

      c.save();
      c.globalAlpha = 1 - out;
      var sc = 1 + 0.05 * out;
      c.translate(cx, cy); c.scale(sc, sc); c.translate(-cx, -cy);

      var titleSize = S.fit(p.titulo, 'display', 400, w * (S.vertical ? 0.84 : 0.6), S.vertical ? 300 * u : 270 * u, 60 * u);
      var capH = S.capH();
      var titleBase = cy + capH * 0.5;
      var titleTop = titleBase - capH;
      var titleW = S.measure(p.titulo);
      var boltSize = 140 * u;
      var boltY = titleTop - 150 * u - boltSize / 2;

      // faísca subindo com rastro
      if (t < 0.85) {
        c.save();
        c.globalCompositeOperation = 'lighter';
        var fadeS = t < 0.72 ? 1 : 1 - TC.seg(t, 0.72, 0.85);
        for (var j = 26; j >= 0; j--) {
          var tj = t - j * 0.009;
          if (tj < 0) continue;
          var k = E.outCubic(TC.seg(tj, 0, 0.72));
          var sy = TC.lerp(h * 1.03, boltY, k);
          var sx = cx + Math.sin(tj * 9) * 10 * u * (1 - k);
          var a = Math.pow(1 - j / 27, 1.6) * fadeS;
          c.globalAlpha = a * 0.16; c.fillStyle = col.accent;
          c.beginPath(); c.arc(sx, sy, (24 - j * 0.6) * u, 0, Math.PI * 2); c.fill();
          c.globalAlpha = a * 0.9; c.fillStyle = col.accent2;
          c.beginPath(); c.arc(sx, sy, Math.max(1.2, 7 - j * 0.22) * u, 0, Math.PI * 2); c.fill();
        }
        c.restore();
      }

      // explosão de brasas + onda
      var bk = TC.seg(t, 0.72, 2.0);
      if (bk > 0 && bk < 1) {
        var r = TC.rng(77);
        c.save();
        c.globalCompositeOperation = 'lighter';
        for (var i = 0; i < 40; i++) {
          var ang = r() * Math.PI * 2, spd = (240 + r() * 700) * u, sz = (2 + r() * 4) * u;
          var d = spd * E.outExpo(bk) * 0.9;
          var px = cx + Math.cos(ang) * d, py = boltY + Math.sin(ang) * d + 120 * u * bk * bk;
          var a2 = (1 - bk) * (0.6 + 0.4 * r());
          c.globalAlpha = a2; c.fillStyle = r() < 0.5 ? col.accent : col.accent2;
          c.beginPath(); c.arc(px, py, sz, 0, Math.PI * 2); c.fill();
        }
        var rk = TC.seg(t, 0.72, 1.5);
        if (rk < 1) {
          c.globalAlpha = 0.5 * (1 - rk);
          c.strokeStyle = col.accent2; c.lineWidth = 3 * u;
          c.beginPath(); c.arc(cx, boltY, E.outExpo(rk) * 560 * u, 0, Math.PI * 2); c.stroke();
        }
        c.restore();
      }

      // raio
      var bK = E.outBack(TC.seg(t, 0.74, 1.15), 2.2);
      if (bK > 0) {
        c.save();
        c.shadowColor = TC.rgba(col.accent, 0.8); c.shadowBlur = 40 * u;
        S.brandIcon(cx, boltY, boltSize * bK, col.accent);
        c.restore();
      }

      // texto pequeno
      var preK = TC.ramp(t, 0.95, 1.5, E.outCubic);
      if (preK > 0) {
        c.save(); S.alpha(preK);
        S.font('mono', 34 * u, 700);
        S.text(p.pre, cx, titleTop - 44 * u + (1 - preK) * 20 * u, { align: 'center', color: col.muted, spacing: 10 * u });
        c.restore();
      }

      // título letra a letra subindo da máscara
      S.font('display', titleSize, 400);
      c.save();
      S.clipRect(0, titleTop - 20 * u, w, capH + 40 * u);
      var x = cx - titleW / 2;
      c.fillStyle = col.ink; c.textBaseline = 'alphabetic'; c.textAlign = 'left';
      for (var n = 0; n < p.titulo.length; n++) {
        var ch = p.titulo[n];
        var ck = E.outExpo(TC.seg(t, 1.0 + n * 0.045, 1.7 + n * 0.045));
        c.fillText(ch, x, titleBase + (1 - ck) * capH * 1.9);
        x += c.measureText(ch).width;
      }
      c.restore();

      // linha
      var lk = TC.ramp(t, 1.55, 2.2);
      if (lk > 0) {
        var lw = titleW * 0.42 * lk;
        c.fillStyle = col.accent;
        c.fillRect(cx - lw / 2, titleBase + 40 * u, lw, 7 * u);
      }

      // frase digitada
      var tag = String(p.tagline || '');
      if (tag) {
        S.font('mono', (S.vertical ? 32 : 30) * u, 400);
        var sp = 3 * u;
        var full = S.measure(tag, sp);
        var maxW = w * 0.86;
        if (full > maxW) { S.font('mono', (S.vertical ? 32 : 30) * u * maxW / full, 400); full = S.measure(tag, sp); }
        var nChars = Math.floor(TC.seg(t, 1.9, 1.9 + tag.length * 0.035) * tag.length);
        var ty = titleBase + 125 * u;
        var shown = tag.slice(0, nChars);
        if (nChars > 0) S.text(shown, cx - full / 2, ty, { color: col.accent2, spacing: sp });
        if (t > 1.85 && Math.floor(t * 2.6) % 2 === 0) {
          var cxp = cx - full / 2 + S.measure(shown, sp) + (nChars ? sp : 0);
          c.fillStyle = col.accent2;
          c.fillRect(cxp, ty - S._fontSize * 0.78, S._fontSize * 0.55, S._fontSize * 0.9);
        }
      }
      c.restore();
    }
  });

  // ------------------------------------------------------------------
  // Intro Clareza — o que está fragmentado se organiza na tese
  // ------------------------------------------------------------------
  var sliceCache = {};
  function wordCanvas(S, text, size, color) {
    var key = text + '|' + size + '|' + color + '|' + S.fonts.display;
    if (sliceCache[key]) return sliceCache[key];
    var c = S.c;
    c.save(); S.font('display', size, 400);
    var tw = Math.ceil(S.measure(text)), cap = S.capH();
    c.restore();
    var pad = Math.ceil(size * 0.2);
    var cv = TC.makeCanvas(tw + pad * 2, Math.ceil(cap + pad * 2));
    var cc = cv.getContext('2d');
    cc.font = '400 ' + size + 'px ' + S.fonts.display;
    cc.fillStyle = color; cc.textBaseline = 'alphabetic';
    cc.fillText(text, pad, pad + cap);
    var out = { cv: cv, tw: tw, cap: cap, pad: pad };
    var keys = Object.keys(sliceCache);
    if (keys.length > 12) delete sliceCache[keys[0]];
    sliceCache[key] = out;
    return out;
  }

  TC.register({
    id: 'intro-clareza',
    name: 'Intro Clareza',
    category: 'abertura',
    full: true,
    duration: 5,
    minDur: 3.6,
    thumb: 3.6,
    description: 'Palavras soltas do mercado (post, tráfego, copy...) se juntam e viram a tua tese. Sai empurrando pra cima e revela o vídeo.',
    uso: 'Abertura de conteúdo manifesto. É a tua tese em 5 segundos: o que os outros fragmentam, tu organiza.',
    params: [
      { key: 'palavra', label: 'Palavra principal', type: 'text', default: 'CLAREZA' },
      { key: 'ponte', label: 'Frase do meio', type: 'text', default: 'vem antes do' },
      { key: 'palavra2', label: 'Palavra final', type: 'text', default: 'MARKETING.' },
      { key: 'fragmentos', label: 'Fragmentos (separa por vírgula)', type: 'text', default: 'post, tráfego, copy, reels, anúncio, trend, algoritmo, stories, hook, funil, frequência, engajamento' }
    ],
    draw: function (S, t) {
      var c = S.c, u = S.u, w = S.w, h = S.h, col = S.col, p = S.p, D = S.dur;
      var out = TC.ramp(t, D - 0.6, D, E.inExpo);
      c.save();
      c.translate(0, -h * 1.02 * out);
      c.fillStyle = col.paper; c.fillRect(0, 0, w, h);
      S.grain(0.12, false);

      var cx = w / 2, cy = h * (S.vertical ? 0.45 : 0.44);

      // fragmentos caóticos
      var frags = TC.splitList(p.fragmentos);
      if (frags.length) {
        var r = TC.rng(21);
        var count = Math.max(frags.length, 10);
        S.font('mono', (S.vertical ? 30 : 28) * u, 700);
        for (var i = 0; i < count; i++) {
          var word = frags[i % frags.length].toLocaleUpperCase('pt-BR');
          var x0 = w * (0.1 + r() * 0.8), y0 = h * (0.1 + r() * 0.8), rot = (r() - 0.5) * 0.5;
          var delay = r() * 0.3;
          var appear = E.outBack(TC.seg(t, 0.05 + i * 0.045, 0.45 + i * 0.045));
          var pull = E.inOutCubic(TC.seg(t, 0.95 + delay, 1.75 + delay));
          var a = Math.min(1, appear) * (1 - pull);
          if (a <= 0.01) continue;
          var px = TC.lerp(x0 + Math.sin(t * 1.3 + i) * 16 * u, cx, pull);
          var py = TC.lerp(y0 + Math.cos(t * 1.1 + i * 2) * 12 * u, cy, pull);
          var tw = S.measure(word);
          c.save();
          c.globalAlpha = a * 0.9;
          c.translate(px, py); c.rotate(rot * (1 - pull) + Math.sin(t * 2 + i) * 0.03);
          var sc = (0.6 + 0.4 * appear) * (1 - pull * 0.6);
          c.scale(sc, sc);
          c.strokeStyle = TC.rgba(col.inkOnPaper, 0.7); c.lineWidth = 2.5 * u;
          S.rrect(-tw / 2 - 22 * u, -32 * u, tw + 44 * u, 60 * u, 30 * u); c.stroke();
          S.text(word, 0, 10 * u, { align: 'center', color: col.inkOnPaper });
          c.restore();
        }
      }

      // palavra principal montada em fatias
      var size = S.fit(p.palavra, 'display', 400, w * (S.vertical ? 0.86 : 0.62), 340 * u, 80 * u);
      var wc = wordCanvas(S, p.palavra, size, col.inkOnPaper);
      var wx = cx - wc.tw / 2, wTop = cy - wc.cap / 2;
      var N = 12, rr = TC.rng(9);
      var snap = TC.seg(t, 2.15, 2.5);
      var pulse = 1 + 0.035 * Math.sin(snap * Math.PI);
      c.save();
      c.translate(cx, cy); c.scale(pulse, pulse); c.translate(-cx, -cy);
      for (var s = 0; s < N; s++) {
        var sx = (wc.tw / N) * s;
        var sw = wc.tw / N + 1;
        var d = rr() * 0.4;
        var dx = (rr() - 0.5) * w * 0.9, dy = (rr() - 0.5) * h * 0.5, rot2 = (rr() - 0.5) * 1.4;
        var k = E.outExpo(TC.seg(t, 1.0 + d, 1.95 + d));
        if (k <= 0) continue;
        c.save();
        c.globalAlpha = Math.min(1, k * 2.5);
        c.translate(wx + sx + sw / 2 + dx * (1 - k), wTop + wc.cap / 2 + dy * (1 - k));
        c.rotate(rot2 * (1 - k));
        c.drawImage(wc.cv, wc.pad + sx, 0, sw, wc.cap + wc.pad * 2, -sw / 2, -wc.cap / 2 - wc.pad, sw, wc.cap + wc.pad * 2);
        c.restore();
      }
      c.restore();

      // traço de destaque
      var lk = TC.ramp(t, 2.2, 2.8);
      if (lk > 0) {
        c.fillStyle = col.accent;
        c.fillRect(wx, wTop + wc.cap + 34 * u, wc.tw * 0.28 * lk, 10 * u);
      }

      // frase do meio
      var pk = TC.ramp(t, 2.35, 2.95);
      var bY = wTop + wc.cap + 34 * u;
      if (pk > 0 && p.ponte) {
        c.save(); S.alpha(pk);
        S.font('sans', (S.vertical ? 58 : 52) * u, 600, true);
        S.text(p.ponte, cx, bY + 92 * u + (1 - pk) * 24 * u, { align: 'center', color: TC.rgba(col.body, 0.85) });
        c.restore();
      }

      // palavra final
      if (p.palavra2) {
        var fk = TC.ramp(t, 2.65, 3.3);
        var size2 = S.fit(p.palavra2, 'display', 400, w * 0.8, size * 0.46, 40 * u);
        var cap2 = S.capH();
        var y2 = bY + 92 * u + 40 * u + cap2;
        c.save();
        S.clipRect(0, y2 - cap2 - 10 * u, w, cap2 + 30 * u);
        S.text(p.palavra2, cx, y2 + (1 - fk) * cap2 * 1.9, { align: 'center', color: col.body });
        c.restore();
      }
      c.restore();
    }
  });

  // ------------------------------------------------------------------
  // Fechamento — CTA com a assinatura
  // ------------------------------------------------------------------
  TC.register({
    id: 'outro-cta',
    name: 'Fechamento CTA',
    category: 'abertura',
    full: true,
    duration: 5,
    minDur: 3,
    thumb: 3.2,
    description: 'Fundo escuro com brasa, frase de fechamento com palavra em destaque e o teu @ numa etiqueta.',
    uso: 'Últimos segundos do vídeo. Uma ação só: salvar, mandar, seguir ou comentar. Duas ações dividem a atenção.',
    params: [
      { key: 'linha1', label: 'Linha 1', type: 'text', default: 'SE ISSO FEZ SENTIDO,' },
      { key: 'linha2', label: 'Linha 2', type: 'text', default: 'MANDA PRA QUEM PRECISA OUVIR.' },
      { key: 'destaque', label: 'Palavras em destaque', type: 'text', default: 'PRECISA OUVIR' },
      { key: 'cta', label: 'Chamada', type: 'text', default: 'SEGUE PRA MAIS CLAREZA' },
      { key: 'handle', label: '@ do perfil', type: 'text', fromBrand: 'handle', default: '@seuperfil' },
      { key: 'assinatura', label: 'Assinatura', type: 'text', fromBrand: 'slogan', default: 'O NOVO MKT É SER REAL.' }
    ],
    draw: function (S, t) {
      var c = S.c, u = S.u, w = S.w, h = S.h, col = S.col, p = S.p, D = S.dur;
      var bgIn = TC.ramp(t, 0, 0.45, E.outCubic);
      var out = TC.ramp(t, D - 0.4, D, E.inCubic);
      c.save(); c.globalAlpha = bgIn;
      c.fillStyle = col.dark; c.fillRect(0, 0, w, h);
      var gr = c.createRadialGradient(w / 2, h, 0, w / 2, h, h * 0.8);
      gr.addColorStop(0, TC.rgba(col.accent, 0.22)); gr.addColorStop(1, TC.rgba(col.accent, 0));
      c.fillStyle = gr; c.fillRect(0, 0, w, h);
      c.restore();
      S.embers({ count: 34, seed: 8, alpha: bgIn * 0.85 });
      S.grain(0.06 * bgIn, true);

      c.save();
      c.globalAlpha = 1 - out;
      var maxW = w * (S.vertical ? 0.84 : 0.7);
      var text = [p.linha1, p.linha2].filter(Boolean).join('\n');
      var size = (S.vertical ? 124 : 112) * u;
      S.font('display', size, 400);
      var lay = S.flow(text, { maxW: maxW, lineH: size * 1.04, align: 'center' });
      while ((lay.height > h * 0.42 || lay.lines > 5) && size > 50 * u) {
        size *= 0.92; S.font('display', size, 400);
        lay = S.flow(text, { maxW: maxW, lineH: size * 1.04, align: 'center' });
      }
      var cap = S.capH();
      var hi = {};
      String(p.destaque || '').split(/\s+/).forEach(function (x) { if (x) hi[TC.normWord(x)] = 1; });
      var blockTop = h * (S.vertical ? 0.36 : 0.36) - lay.height / 2;
      var bx = (w - maxW) / 2;
      for (var l = 0; l < lay.lines; l++) {
        var lk = E.outExpo(TC.seg(t, 0.35 + l * 0.12, 1.05 + l * 0.12));
        var base = blockTop + l * size * 1.04 + cap;
        c.save();
        S.clipRect(0, base - cap - 12 * u, w, cap + 30 * u);
        for (var i = 0; i < lay.words.length; i++) {
          var wd = lay.words[i];
          if (wd.line !== l) continue;
          S.text(wd.text, bx + wd.x, base + (1 - lk) * cap * 1.9, { color: hi[wd.key] ? col.accent : col.ink });
        }
        c.restore();
      }
      var yAfter = blockTop + lay.height;

      // chamada
      var ck = TC.ramp(t, 1.25, 1.75);
      if (p.cta && ck > 0) {
        c.save(); S.alpha(ck);
        S.font('mono', 30 * u, 700);
        S.text(p.cta, w / 2, yAfter + 70 * u + (1 - ck) * 14 * u, { align: 'center', color: col.accent2, spacing: 6 * u });
        c.restore();
      }

      // etiqueta com @
      if (p.handle) {
        var hk = E.outBack(TC.seg(t, 1.5, 2.0), 1.6);
        S.font('mono', 44 * u, 700);
        var hw = S.measure(p.handle);
        var pillW = hw + 140 * u, pillH = 96 * u;
        var py = yAfter + 110 * u;
        if (hk > 0) {
          c.save();
          c.translate(w / 2, py + pillH / 2); c.scale(hk, hk); c.translate(-w / 2, -(py + pillH / 2));
          S.fillRRect(w / 2 - pillW / 2, py, pillW, pillH, pillH / 2, col.paper);
          S.brandIcon(w / 2 - pillW / 2 + 52 * u, py + pillH / 2, 44 * u, col.accent);
          var nC = Math.floor(TC.seg(t, 1.75, 1.75 + p.handle.length * 0.035) * p.handle.length);
          S.font('mono', 44 * u, 700);
          S.text(p.handle.slice(0, nC), w / 2 - pillW / 2 + 92 * u, py + pillH / 2 + 15 * u, { color: col.inkOnPaper });
          c.restore();
        }
      }

      // assinatura
      var ak = TC.ramp(t, 2.1, 2.7);
      if (p.assinatura && ak > 0) {
        c.save(); S.alpha(ak * 0.9);
        S.font('mono', 24 * u, 400);
        var sy = S.vertical ? h * 0.84 : h * 0.9;
        var sw2 = S.measure(p.assinatura, 3 * u);
        S.icon(S.brand.badge || 'flame', w / 2 - sw2 / 2 - 30 * u, sy - 9 * u, 30 * u, col.accent);
        S.text(p.assinatura, w / 2 + 10 * u, sy, { align: 'center', color: col.muted, spacing: 3 * u });
        c.restore();
      }
      c.restore();
    }
  });
})(typeof window !== 'undefined' ? window : this);
