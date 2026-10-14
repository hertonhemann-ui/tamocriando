/* Ênfase: fazem a ideia principal ficar na cabeça */
(function (root) {
  'use strict';
  var TC = root.TC, E = TC.ease;

  function posY(S, pos, blockH) {
    if (pos === 'topo') return S.safe.top + blockH / 2 + 40 * S.u;
    if (pos === 'centro') return S.h * 0.5;
    return S.vertical ? S.h * 0.66 : S.h * 0.78;
  }

  // ------------------------------------------------------------------
  // Destaque de Palavra — a legenda de impacto dos teus Reels
  // ------------------------------------------------------------------
  TC.register({
    id: 'destaque-palavra',
    name: 'Destaque de Palavra',
    category: 'enfase',
    duration: 4,
    minDur: 1.6,
    thumb: 1.8,
    description: 'Linha 1 em branco, palavra-chave em caixa ameixa com letra âmbar, linha 2 em itálico. O mesmo estilo dos teus Reels, agora animado.',
    uso: 'A frase que tu quer que a pessoa repita depois. No máximo 2 ou 3 por vídeo — se tudo é destaque, nada é.',
    params: [
      { key: 'linha1', label: 'Linha 1', type: 'text', default: 'ESTÁ' },
      { key: 'destaque', label: 'Palavra destaque', type: 'text', default: 'DESTRUINDO' },
      { key: 'linha2', label: 'Linha 2', type: 'text', default: 'sua autoridade' },
      { key: 'posicao', label: 'Posição', type: 'select', options: ['baixo', 'centro', 'topo'], default: 'baixo' }
    ],
    draw: function (S, t) {
      var c = S.c, u = S.u, w = S.w, col = S.col, p = S.p, D = S.dur;
      var l1 = String(p.linha1 || ''), hl = String(p.destaque || ''), l2 = String(p.linha2 || '');
      var size = (S.vertical ? 92 : 78) * u;
      var maxW = w * (S.vertical ? 0.88 : 0.7);
      var m;
      function measureAll(sz) {
        var gap = sz * 0.24, padX = sz * 0.24;
        S.font('sans', sz, 800); var a = l1 ? S.measure(l1) : 0; var b = hl ? S.measure(hl) : 0;
        S.font('sans', sz, 700, true); var d = l2 ? S.measure(l2) : 0;
        return { w1: a, wH: b, w2: d, gap: gap, padX: padX, row1: a + (l1 && hl ? gap : 0) + (hl ? b + padX * 2 : 0) };
      }
      m = measureAll(size);
      var widest = Math.max(m.row1, m.w2);
      if (widest > maxW) { size *= maxW / widest; m = measureAll(size); }
      S.font('sans', size, 800);
      var cap = S.capH();
      var lineH = size * 1.22;
      var rows = (l1 || hl ? 1 : 0) + (l2 ? 1 : 0);
      var cy = posY(S, p.posicao, rows * lineH);
      var r1c = rows === 2 ? cy - lineH / 2 : cy;
      var r2c = rows === 2 ? cy + lineH / 2 : cy;

      var outK = TC.ramp(t, D - 0.38, D, E.inCubic);
      c.save();
      c.globalAlpha = 1 - outK;
      c.translate(0, outK * 26 * u);

      var x = w / 2 - m.row1 / 2;
      // linha 1
      if (l1) {
        var k1 = TC.ramp(t, 0, 0.5);
        c.save();
        S.clipRect(0, r1c - cap / 2 - 30 * u, w, cap + 60 * u);
        S.shadow(0.9);
        S.font('sans', size, 800);
        S.text(l1, x, r1c + cap / 2 + (1 - k1) * cap * 1.9, { color: '#FFFFFF' });
        c.restore();
        x += m.w1 + m.gap;
      }
      // caixa + palavra
      if (hl) {
        var bw = m.wH + m.padX * 2, bh = cap + size * 0.42;
        var bk = TC.ramp(t, 0.15, 0.6);
        var bOut = TC.ramp(t, D - 0.38, D - 0.05, E.inExpo);
        var bx0 = x + bw * bOut, bw2 = bw * bk * (1 - bOut);
        c.save(); S.shadow(0.5);
        S.fillRRect(bx0, r1c - bh / 2, bw2, bh, size * 0.14, TC.rgba(col.panel, 0.94));
        c.restore();
        var hk = E.outBack(TC.seg(t, 0.3, 0.75), 1.4);
        var punch = 1 + 0.07 * Math.sin(TC.seg(t, 0.55, 0.85) * Math.PI);
        c.save();
        S.clipRect(bx0, r1c - bh / 2, bw2, bh);
        var hx = x + bw / 2, hy = r1c;
        c.translate(hx, hy); c.scale(punch, punch); c.translate(-hx, -hy);
        S.font('sans', size, 800);
        S.text(hl, x + m.padX, r1c + cap / 2 + (1 - hk) * bh * 1.3, { color: col.accent2 });
        c.restore();
      }
      // linha 2 em itálico, palavra a palavra
      if (l2) {
        S.font('sans', size, 700, true);
        var words = l2.split(/\s+/).filter(Boolean);
        var sx = w / 2 - m.w2 / 2, sp = S.measure(' ');
        c.save(); S.shadow(0.9);
        for (var i = 0; i < words.length; i++) {
          var wk = TC.ramp(t, 0.45 + i * 0.08, 1.0 + i * 0.08);
          c.save(); S.alpha(wk);
          S.text(words[i], sx - (1 - wk) * 34 * u, r2c + cap / 2, { color: '#FFFFFF' });
          c.restore();
          sx += S.measure(words[i]) + sp;
        }
        c.restore();
      }
      c.restore();
    }
  });

  // ------------------------------------------------------------------
  // Cartela Tese — o carrossel "A TESE" em movimento
  // ------------------------------------------------------------------
  TC.register({
    id: 'tese',
    name: 'Cartela Tese',
    category: 'enfase',
    full: true,
    duration: 6,
    minDur: 3,
    thumb: 3.4,
    description: 'Chama + rótulo, frase grande em fonte condensada, palavra em brasa e rodapé com a tua assinatura. É o teu carrossel em vídeo.',
    uso: 'Frase-tese, citação ou conclusão. Funciona como respiro visual entre trechos de fala e vira print fácil de compartilhar.',
    params: [
      { key: 'rotulo', label: 'Rótulo', type: 'text', default: 'A TESE' },
      { key: 'texto', label: 'Texto', type: 'textarea', default: 'a brasa é o que está vivo em ti. o oposto da obrigação.' },
      { key: 'destaque', label: 'Palavras em destaque', type: 'text', default: 'brasa vivo' },
      { key: 'autor', label: 'Autor (opcional)', type: 'text', default: '' },
      { key: 'tema', label: 'Tema', type: 'select', options: ['escuro', 'claro'], default: 'escuro' },
      { key: 'rodape', label: 'Rodapé com assinatura', type: 'select', options: ['sim', 'não'], default: 'sim' },
      { key: 'nome', label: 'Nome (rodapé)', type: 'text', fromBrand: 'nome', default: 'HERTON DO NOVO MKT' },
      { key: 'cargo', label: 'Cargo (rodapé)', type: 'text', fromBrand: 'cargo', default: 'ESTRATEGISTA QUE O MERCADO DIGITAL ELIMINOU' }
    ],
    draw: function (S, t) {
      var c = S.c, u = S.u, w = S.w, h = S.h, col = S.col, p = S.p, D = S.dur;
      var dark = p.tema !== 'claro';
      var bg = dark ? col.dark : col.paper;
      var ink = dark ? col.ink : col.inkOnPaper;
      var sub = dark ? col.muted : TC.rgba(col.body, 0.7);

      var inK = TC.ramp(t, 0, 0.55);
      var outK = TC.ramp(t, D - 0.55, D, E.inExpo);
      c.save();
      c.beginPath(); c.rect(0, h * (1 - inK) - h * outK, w, h); c.clip();
      c.translate(0, -h * outK * 0.3);
      c.fillStyle = bg; c.fillRect(0, 0, w, h);
      if (dark) {
        var gr = c.createRadialGradient(w * 0.85, h * 0.85, 0, w * 0.85, h * 0.85, h * 0.6);
        gr.addColorStop(0, TC.rgba(col.accent, 0.28)); gr.addColorStop(1, TC.rgba(col.accent, 0));
        c.fillStyle = gr; c.fillRect(0, 0, w, h);
        S.embers({ count: 26, seed: 31, area: { x: w * 0.55, y: h * 0.45, w: w * 0.45, h: h * 0.55 }, alpha: TC.ramp(t, 0.4, 1.2, E.linear) });
      }
      S.grain(dark ? 0.06 : 0.12, dark);

      var mx = S.vertical ? 84 * u : w * 0.09;
      var top = S.vertical ? h * 0.11 : h * 0.1;

      // chama + rótulo + traço
      var ik = E.outBack(TC.seg(t, 0.3, 0.7), 2);
      if (ik > 0) S.icon(S.brand.badge || 'flame', mx + 26 * u, top, 56 * u * ik, col.accent, { stroke: S.brand.badge === 'hex', lineWidth: 0.14 });
      var label = String(p.rotulo || '');
      if (label) {
        S.font('mono', 28 * u, 700);
        var nC = Math.floor(TC.seg(t, 0.45, 0.45 + label.length * 0.05) * label.length);
        S.text(label.slice(0, nC), mx + 110 * u, top + 10 * u, { color: col.accent, spacing: 4 * u });
      }
      var lk = TC.ramp(t, 0.55, 1.0);
      c.fillStyle = col.accent; c.fillRect(mx, top + 62 * u, 110 * u * lk, 5 * u);

      // texto principal
      var footerH = p.rodape === 'sim' ? (S.vertical ? 0.16 : 0.18) * h : 0.06 * h;
      var areaTop = top + 120 * u, areaBot = h - footerH - (p.autor ? 80 * u : 30 * u);
      var maxW = S.vertical ? w - mx * 2 : w * 0.66;
      var size = (S.vertical ? 160 : 140) * u;
      var lay;
      for (var guard = 0; guard < 30; guard++) {
        S.font('display', size, 400);
        lay = S.flow(p.texto, { maxW: maxW, lineH: size * 1.02 });
        if (lay.height <= areaBot - areaTop || size < 40 * u) break;
        size *= 0.93;
      }
      var cap = S.capH();
      var hi = {};
      String(p.destaque || '').split(/\s+/).forEach(function (x) { if (x) hi[TC.normWord(x)] = 1; });
      var ty = areaTop + Math.max(0, (areaBot - areaTop - lay.height) * (S.vertical ? 0.42 : 0.5));
      var hiK = TC.ramp(t, 1.4 + lay.lines * 0.08, 1.9 + lay.lines * 0.08, E.inOutCubic);
      for (var l = 0; l < lay.lines; l++) {
        var rk = TC.ramp(t, 0.6 + l * 0.1, 1.3 + l * 0.1);
        var base = ty + l * size * 1.02 + cap;
        c.save();
        S.clipRect(0, base - cap - 14 * u, w, cap + size * 0.34);
        for (var i = 0; i < lay.words.length; i++) {
          var wd = lay.words[i];
          if (wd.line !== l) continue;
          var color = hi[wd.key] ? TC.mixHex(dark ? '#F4EDE2' : col.inkOnPaper, col.accent, hiK) : ink;
          S.text(wd.text, mx + wd.x, base + (1 - rk) * cap * 1.9, { color: color });
        }
        c.restore();
      }
      if (p.autor) {
        var ak = TC.ramp(t, 1.5, 2.0);
        c.save(); S.alpha(ak);
        S.font('mono', 28 * u, 700);
        S.text(p.autor, mx, ty + lay.height + 50 * u, { color: sub, spacing: 3 * u });
        c.restore();
      }

      // rodapé
      if (p.rodape === 'sim') {
        var fk = TC.ramp(t, 1.0, 1.6);
        var fy = h - footerH * 0.62 + (1 - fk) * 40 * u;
        c.save(); S.alpha(fk);
        var R = 50 * u;
        c.fillStyle = col.accent; c.beginPath(); c.arc(mx + R, fy, R, 0, Math.PI * 2); c.fill();
        S.icon(S.brand.badge || 'flame', mx + R, fy, 56 * u, dark ? col.dark : col.paper, { stroke: S.brand.badge === 'hex', lineWidth: 0.14 });
        var tx = mx + R * 2 + 26 * u;
        S.font('mono', 30 * u, 700);
        S.text(p.nome, tx, fy - 6 * u, { color: dark ? col.ink : col.body, spacing: 2 * u });
        S.font('mono', 22 * u, 400);
        S.text(p.cargo, tx, fy + 30 * u, { color: sub, spacing: 1.5 * u });
        c.restore();
      }
      c.restore();
    }
  });

  // ------------------------------------------------------------------
  // Lista — itens entrando um a um
  // ------------------------------------------------------------------
  TC.register({
    id: 'lista',
    name: 'Lista em Cascata',
    category: 'enfase',
    duration: 6,
    minDur: 2.5,
    thumb: 3.2,
    description: 'Título + itens que entram um a um com marcador de raio, check ou número.',
    uso: 'Quando a fala enumera coisas. Ler e ouvir ao mesmo tempo dobra a fixação — mas só se o texto for curto.',
    params: [
      { key: 'titulo', label: 'Título', type: 'text', default: 'VALOR É QUANDO ELES:' },
      { key: 'itens', label: 'Itens (um por linha)', type: 'textarea', default: 'Te escolhem\nTe pagam\nTe indicam\nTe respeitam\nTe ouvem' },
      { key: 'marcador', label: 'Marcador', type: 'select', options: ['raio', 'check', 'numero'], default: 'raio' },
      { key: 'fundo', label: 'Fundo', type: 'select', options: ['painel', 'nenhum'], default: 'painel' }
    ],
    draw: function (S, t) {
      var c = S.c, u = S.u, w = S.w, h = S.h, col = S.col, p = S.p, D = S.dur;
      var items = TC.splitList(String(p.itens || '').indexOf('\n') >= 0 ? p.itens : String(p.itens || '').replace(/,/g, '\n'));
      var n = items.length;
      var itemSize = (S.vertical ? 74 : 60) * u;
      var step = itemSize * 1.42;
      var pad = 52 * u;
      var markR = itemSize * 0.36;
      var panelW = S.vertical ? w - 140 * u : Math.max(w * 0.4, 620 * u);
      S.font('sans', itemSize, 800);
      var widest = 0;
      for (var i = 0; i < n; i++) widest = Math.max(widest, S.measure(items[i]));
      var avail = panelW - pad * 2 - markR * 2 - 30 * u;
      if (widest > avail) itemSize *= avail / widest;
      S.font('sans', itemSize, 800);
      var cap = S.capH();
      step = itemSize * 1.42;
      var titleH = p.titulo ? 70 * u : 0;
      var panelH = pad * 2 + titleH + n * step - (step - cap) * 0.4;
      var px = S.vertical ? 70 * u : w * 0.07;
      var py = (S.vertical ? h * 0.46 : h * 0.5) - panelH / 2;

      var inK = TC.ramp(t, 0, 0.55);
      var outK = TC.ramp(t, D - 0.5, D, E.inExpo);
      c.save();
      if (p.fundo !== 'nenhum') {
        var pw = panelW * inK * (1 - outK);
        if (pw <= 0) { c.restore(); return; }
        c.save(); S.shadow(0.8);
        S.fillRRect(px, py, pw, panelH, 30 * u, TC.rgba(col.panel, 0.95));
        c.restore();
        S.clipRect(px, py - 10 * u, pw, panelH + 20 * u);
      } else {
        c.globalAlpha = 1 - outK;
      }
      var x = px + pad, y = py + pad;
      if (p.titulo) {
        var tk = TC.ramp(t, 0.3, 0.8);
        c.save(); S.alpha(tk);
        if (p.fundo === 'nenhum') S.shadow(0.9);
        S.font('mono', 30 * u, 700);
        S.text(String(p.titulo).toLocaleUpperCase('pt-BR'), x, y + 26 * u, { color: col.accent2, spacing: 3 * u });
        c.restore();
        y += titleH;
      }
      for (var j = 0; j < n; j++) {
        var t0 = 0.6 + j * 0.24;
        var k = TC.ramp(t, t0, t0 + 0.6);
        var mk = E.outBack(TC.seg(t, t0 - 0.05, t0 + 0.35), 2.2);
        var base = y + j * step + cap;
        var mcx = x + markR, mcy = base - cap / 2;
        if (mk > 0) {
          if (p.marcador === 'numero') {
            c.fillStyle = col.accent; c.beginPath(); c.arc(mcx, mcy, markR * mk, 0, Math.PI * 2); c.fill();
            S.font('mono', markR * 1.05, 700);
            c.save(); S.alpha(mk);
            S.text(String(j + 1), mcx, mcy + markR * 0.36, { align: 'center', color: col.panel });
            c.restore();
          } else if (p.marcador === 'check') {
            c.fillStyle = col.accent; c.beginPath(); c.arc(mcx, mcy, markR * mk, 0, Math.PI * 2); c.fill();
            S.icon('check', mcx, mcy, markR * 1.3 * mk, col.panel, { lineWidth: 0.16 });
          } else {
            S.brandIcon(mcx, mcy, markR * 2.1 * mk, col.accent);
          }
        }
        if (k > 0) {
          c.save(); S.alpha(k);
          if (p.fundo === 'nenhum') S.shadow(0.9);
          S.font('sans', itemSize, 800);
          S.text(items[j], x + markR * 2 + 30 * u - (1 - k) * 40 * u, base, { color: col.ink });
          c.restore();
        }
      }
      c.restore();
    }
  });

  // ------------------------------------------------------------------
  // Número de Impacto — contador com anel
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
    name: 'Número de Impacto',
    category: 'enfase',
    duration: 4,
    minDur: 2.4,
    thumb: 2.6,
    description: 'Número contando dentro de um anel que se fecha, com rótulo embaixo.',
    uso: 'Resultado de cliente, dado de pesquisa, antes/depois em número. Prova vale mais que adjetivo.',
    params: [
      { key: 'prefixo', label: 'Prefixo', type: 'text', default: '+' },
      { key: 'valor', label: 'Valor', type: 'text', default: '300' },
      { key: 'sufixo', label: 'Sufixo', type: 'text', default: '%' },
      { key: 'casas', label: 'Casas decimais', type: 'number', min: 0, max: 2, default: 0 },
      { key: 'rotulo', label: 'Rótulo', type: 'text', default: 'de alcance depois do rebranding' },
      { key: 'posicao', label: 'Posição', type: 'select', options: ['centro', 'baixo', 'topo'], default: 'centro' }
    ],
    draw: function (S, t) {
      var c = S.c, u = S.u, w = S.w, h = S.h, col = S.col, p = S.p, D = S.dur;
      var R = (S.vertical ? 250 : 210) * u;
      var cx = w / 2;
      var cy = p.posicao === 'topo' ? S.safe.top + R + 30 * u : p.posicao === 'baixo' ? (S.vertical ? h * 0.6 : h * 0.55) : h * (S.vertical ? 0.42 : 0.45);
      var target = parseNum(p.valor), casas = TC.clamp(Math.round(Number(p.casas) || 0), 0, 3);
      var k = E.outCubic(TC.seg(t, 0.35, 1.9));
      var val = target * k;
      var pop = E.outBack(TC.seg(t, 0, 0.5), 1.8);
      var outK = TC.ramp(t, D - 0.4, D, E.inBack);
      var sc = pop * (1 - outK);
      if (sc <= 0.001) return;
      var done = TC.seg(t, 1.9, 2.25);
      var pulse = 1 + 0.06 * Math.sin(done * Math.PI);

      c.save();
      c.translate(cx, cy); c.scale(sc * pulse, sc * pulse); c.translate(-cx, -cy);
      c.save(); S.shadow(0.8);
      c.fillStyle = TC.rgba(col.panel, 0.95); c.beginPath(); c.arc(cx, cy, R, 0, Math.PI * 2); c.fill();
      c.restore();
      c.strokeStyle = TC.rgba(col.muted, 0.25); c.lineWidth = 10 * u;
      c.beginPath(); c.arc(cx, cy, R - 26 * u, 0, Math.PI * 2); c.stroke();
      c.strokeStyle = col.accent; c.lineWidth = 12 * u; c.lineCap = 'round';
      if (k > 0.001) { c.beginPath(); c.arc(cx, cy, R - 26 * u, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * k); c.stroke(); }
      if (done > 0 && done < 1) {
        c.strokeStyle = TC.rgba(col.accent2, 0.7 * (1 - done)); c.lineWidth = 4 * u;
        c.beginPath(); c.arc(cx, cy, R + done * 80 * u, 0, Math.PI * 2); c.stroke();
      }
      // número
      var mid = fmt(val, casas);
      var pre = String(p.prefixo || ''), suf = String(p.sufixo || '');
      var finalStr = pre + fmt(target, casas) + suf;
      var size = S.fit(finalStr, 'display', 400, (R - 50 * u) * 1.6, R * 0.8, 40 * u);
      var cap = S.capH();
      var sfx = size * 0.55;
      S.font('display', size, 400); var midW = S.measure(mid), preW = S.measure(pre);
      S.font('display', sfx, 400); var sufW = S.measure(suf);
      var total = preW + midW + sufW + (pre ? 4 * u : 0) + (suf ? 6 * u : 0);
      var x = cx - total / 2, base = cy + cap / 2;
      S.font('display', size, 400);
      if (pre) { S.text(pre, x, base, { color: col.accent }); x += preW + 4 * u; }
      S.text(mid, x, base, { color: col.ink }); x += midW + 6 * u;
      if (suf) { S.font('display', sfx, 400); S.text(suf, x, base - cap + sfx * 0.72, { color: col.accent }); }
      c.restore();

      // rótulo
      if (p.rotulo) {
        var rk = TC.ramp(t, 1.0, 1.5) * (1 - TC.ramp(t, D - 0.45, D - 0.1, E.inCubic));
        c.save(); S.alpha(rk);
        S.shadow(1);
        S.font('sans', (S.vertical ? 46 : 40) * u, 800);
        var lines = S.wrap(String(p.rotulo), w * 0.8);
        for (var i = 0; i < lines.length; i++) {
          S.text(lines[i], cx, cy + R + 80 * u + i * 56 * u + (1 - rk) * 20 * u, { align: 'center', color: '#FFFFFF' });
        }
        c.restore();
      }
    }
  });
})(typeof window !== 'undefined' ? window : this);
