/*
 * Texto: legenda de Reels e destaque de um trecho do vídeo.
 *
 * Tudo aqui é só tipografia. Cada template aceita uma fonte ou um par
 * (principal + complemento) e um efeito de entrada:
 *
 *   pop        escala de 70% a 100% com um leve estouro (legenda viral)
 *   foco       sai de foco: desfoque + opacidade + escala, como puxar o foco da lente
 *   tracking   as letras começam abertas e fecham até o espaçamento normal
 *   subida     o texto sobe de dentro de uma máscara (linha cortada)
 *   obturador  entra deslizando com rastro, como foto de obturador lento
 *   cinema     fade lento com desfoque e subida de poucos pixels
 *
 * A posição vem de px/py (% do quadro): dá pra arrastar na prévia.
 */
(function (root) {
  'use strict';
  var TC = root.TC;
  var clamp = TC.clamp;

  var EFEITOS = ['pop', 'foco', 'tracking', 'subida', 'obturador', 'cinema'];
  // quanto tempo cada efeito leva pra "assentar" (s)
  var EFEITO_DUR = { pop: 0.22, foco: 0.34, tracking: 0.38, subida: 0.28, obturador: 0.32, cinema: 0.55 };

  function caseFix(str, mode) {
    str = String(str || '');
    if (mode === 'MAIÚSCULAS') return str.toLocaleUpperCase('pt-BR');
    if (mode === 'minúsculas') return str.toLocaleLowerCase('pt-BR');
    return str;
  }

  // estado do efeito em cada instante: k vai de 0 (fora) a 1 (assentado); pode passar de 1 (estouro)
  function effect(mode, k, size) {
    var kc = clamp(k, 0, 1);
    var e = { alpha: kc, blur: 0, dx: 0, dy: 0, sc: 1, sp: 0, clip: false, smear: 0 };
    switch (mode) {
      case 'pop': e.alpha = clamp(k * 4, 0, 1); e.sc = 0.72 + 0.28 * k; e.dy = (1 - kc) * 0.12 * size; break;
      case 'foco': e.alpha = clamp(k * 1.5, 0, 1); e.blur = (1 - kc) * 0.28 * size; e.sc = 1.06 - 0.06 * kc; break;
      case 'tracking': e.alpha = clamp(k * 1.4, 0, 1); e.sp = (1 - kc) * 0.28 * size; e.blur = (1 - kc) * 0.08 * size; break;
      case 'subida': e.alpha = 1; e.clip = true; e.dy = (1 - kc) * size * 0.95; break;
      case 'obturador': e.alpha = clamp(k * 2, 0, 1); e.dx = -(1 - kc) * size * 3.2; e.smear = 1 - kc; break;
      case 'cinema': e.alpha = kc * kc * (3 - 2 * kc); e.blur = (1 - kc) * 0.14 * size; e.dy = (1 - kc) * 0.16 * size; e.sp = (1 - kc) * 0.1 * size; break;
    }
    return e;
  }

  /*
   * Desenha um pedaço de texto com o efeito.
   *  o: font ('main'|'comp'), size, weight, italic, color, align ('center'|'left'),
   *     mode, k, spacing, out (0..1 saída), shadow
   * Devolve a largura.
   */
  function put(S, str, x, y, o) {
    var c = S.c, size = o.size, out = o.out || 0;
    var e = effect(o.mode || 'foco', o.k === undefined ? 1 : o.k, size);
    var a = e.alpha * (1 - out);
    S.font(o.font, size, o.weight, o.italic);
    var sp = (o.spacing || 0) + e.sp;
    var w = S.measure(str, sp);
    if (a < 0.004) return w;
    var left = o.align === 'left' ? x : x - w / 2;
    var base = c.globalAlpha;
    c.save();
    if (e.clip) { c.beginPath(); c.rect(left - size * 0.25, y - size * 1.0, w + size * 0.5, size * 1.4); c.clip(); }
    var bl = e.blur + out * 0.12 * size;
    if (bl > 0.3) S.blur(bl);
    if (o.shadow) S.shadow(0.85);
    c.fillStyle = o.color;
    c.translate(left + w / 2 + e.dx, y - size * 0.3 + e.dy - out * 0.1 * size);
    c.scale(e.sc, e.sc);
    S.font(o.font, size, o.weight, o.italic);
    if (e.smear > 0.02) {
      for (var j = 7; j >= 1; j--) {
        c.globalAlpha = base * a * 0.34 * (1 - j / 8);
        S.text(str, -w / 2 - j * size * 0.2 * e.smear, size * 0.3, { align: 'left', spacing: sp });
      }
    }
    c.globalAlpha = base * a;
    S.text(str, -w / 2, size * 0.3, { align: 'left', spacing: sp });
    c.restore();
    return w;
  }

  // quebra uma lista de palavras (cada uma com sua fonte) em linhas
  function layout(S, items, size, maxW, lhK) {
    var space = size * 0.27, lines = [], cur = { items: [], w: 0 };
    items.forEach(function (it) {
      S.font(it.font, size, it.weight, it.italic);
      it.w = S.measure(it.str);
      var add = (cur.items.length ? space : 0) + it.w;
      if (cur.items.length && cur.w + add > maxW) { lines.push(cur); cur = { items: [], w: 0 }; add = it.w; }
      it.dx = cur.items.length ? cur.w + space : 0;
      cur.items.push(it); cur.w += add;
    });
    if (cur.items.length) lines.push(cur);
    var bw = 0; lines.forEach(function (l) { bw = Math.max(bw, l.w); });
    var lh = size * lhK;
    return { lines: lines, w: bw, lh: lh, h: lh * lines.length };
  }

  function lineHeightK(pr) { return pr.main === 'anton' || pr.main === 'bebas' ? 1.06 : 1.16; }

  // quando cada palavra aparece: tempos dados (um por palavra) ou proporcional ao tamanho da palavra
  function wordTimes(words, dur, tempos) {
    var n = words.length, given = String(tempos || '').split(/[\s,;]+/).filter(Boolean).map(Number);
    if (given.length === n && given.every(function (v, i) { return isFinite(v) && (i === 0 || v >= given[i - 1]); })) return given;
    var lead = 0.12, tail = Math.min(0.8, dur * 0.2), span = Math.max(0.3, dur - lead - tail), tot = 0, wt = [];
    words.forEach(function (w) { var v = w.length + 2; wt.push(v); tot += v; });
    var out = [], acc = lead;
    wt.forEach(function (v) { out.push(acc); acc += span * v / tot; });
    return out;
  }

  function faixa(S, cx, cy, w, h, alpha) {
    var u = S.u, pad = 30 * u;
    S.fillRRect(cx - w / 2 - pad, cy - h / 2 - pad * 0.6, w + pad * 2, h + pad * 1.2, 22 * u, TC.rgba(S.col.ink, 0.82 * alpha));
  }

  var COMUNS = [
    { key: 'fonte', label: 'Fonte (uma só ou par)', type: 'select', options: TC.fontPairNames, default: 'Anton + Inter' },
    { key: 'caixa', label: 'Letras', type: 'select', options: ['minúsculas', 'MAIÚSCULAS', 'como digitei'], default: 'minúsculas' },
    { key: 'tamanho', label: 'Tamanho (%)', type: 'number', min: 30, max: 300, default: 100 },
    { key: 'px', label: 'Posição X (%)', type: 'number', min: 0, max: 100, default: 50 },
    { key: 'py', label: 'Posição Y (%)', type: 'number', min: 0, max: 100, default: 64 }
  ];
  function withDefaults(list, over) {
    return COMUNS.map(function (p) { var q = {}; for (var k in p) q[k] = p[k]; if (over && over[p.key] !== undefined) q.default = over[p.key]; return q; }).concat(list);
  }

  // ------------------------------------------------------------------
  // Legenda — palavra por palavra, no ritmo da fala
  // ------------------------------------------------------------------
  TC.register({
    id: 'legenda',
    name: 'Legenda',
    category: 'texto',
    duration: 5,
    minDur: 1.5,
    thumb: 2.2,
    drag: { x: 'px', y: 'py', size: 'tamanho' },
    description: 'Legenda de Reels: cada palavra entra no tempo da fala, a que importa fica em brasa e a atual dá um pop. Funciona em modo frase (3 palavras por tela, por exemplo) ou uma palavra por vez.',
    uso: 'Legenda corrida de vídeo viral ou trecho que tu quer que a pessoa leia junto com a fala. Pra casar com o áudio, preenche "Tempo de cada palavra" (o plano a partir da transcrição já faz isso).',
    params: withDefaults([
      { key: 'texto', label: 'Texto', type: 'textarea', default: 'o que te move é devoção. o resto é obrigação.' },
      { key: 'estilo', label: 'Modo', type: 'select', options: ['frase', 'palavra'], default: 'frase' },
      { key: 'porTela', label: 'Palavras por tela (modo frase)', type: 'number', min: 1, max: 8, default: 3 },
      { key: 'destaque', label: 'Palavras em brasa', type: 'text', default: 'devoção' },
      { key: 'destaqueEm', label: 'Destaque usa', type: 'select', options: ['cor', 'complemento', 'cor + complemento'], default: 'cor' },
      { key: 'atual', label: 'Palavra falada agora', type: 'select', options: ['pop', 'brasa', 'nenhum'], default: 'pop' },
      { key: 'efeito', label: 'Efeito de entrada', type: 'select', options: EFEITOS, default: 'pop' },
      { key: 'fundo', label: 'Leitura', type: 'select', options: ['sombra', 'faixa', 'nenhum'], default: 'sombra' },
      { key: 'tempos', label: 'Tempo de cada palavra (s, opcional)', type: 'text', default: '' }
    ]),
    draw: function (S, t) {
      var c = S.c, u = S.u, w = S.w, h = S.h, col = S.col, p = S.p, D = S.dur;
      var pr = TC.applyFontPair(S, p.fonte);
      var words = caseFix(p.texto, p.caixa).split(/\s+/).filter(Boolean);
      if (!words.length) return;
      var starts = wordTimes(words, D, p.tempos), cur = -1, i;
      for (i = 0; i < words.length; i++) if (t >= starts[i]) cur = i;
      if (cur < 0) return;
      var hi = TC.wordSet(p.destaque);
      var size = (S.vertical ? 122 : 94) * u * (Number(p.tamanho) || 100) / 100;
      var maxW = w * (S.vertical ? 0.86 : 0.7);
      var cx = w * (Number(p.px) || 50) / 100, cy = h * (Number(p.py) || 64) / 100;
      var out = S.outK(D - 0.35, D);
      var dur = EFEITO_DUR[p.efeito] || 0.3;
      var useComp = p.destaqueEm !== 'cor', useCor = p.destaqueEm !== 'complemento';

      function itemFor(idx) {
        var isHi = !!hi[TC.normWord(words[idx])];
        var comp = isHi && useComp;
        return {
          idx: idx, str: words[idx], hi: isHi,
          font: comp ? 'comp' : 'main', weight: comp ? pr.cw : pr.mw, italic: comp ? !!pr.ci : !!pr.mi,
          color: isHi && useCor ? col.ember : col.paper
        };
      }

      if (p.estilo === 'palavra') {
        var it = itemFor(cur);
        var sz = size * 1.5, ww;
        S.font(it.font, sz, it.weight, it.italic);
        ww = S.measure(it.str);
        if (ww > maxW) { sz *= maxW / ww; ww = maxW; }
        var kk = TC.ramp(t, starts[cur], starts[cur] + dur, S.ein);
        var color = it.color;
        if (!it.hi && p.atual === 'brasa') color = col.ember;
        if (p.fundo === 'faixa') faixa(S, cx, cy, ww, sz * 0.9, (1 - out));
        put(S, it.str, cx, cy + sz * 0.34, { font: it.font, size: sz, weight: it.weight, italic: it.italic, color: color, mode: p.efeito, k: kk, out: out, shadow: p.fundo === 'sombra' });
        return;
      }

      // modo frase: o grupo inteiro é medido de uma vez, então as palavras não pulam de lugar
      var n = Math.max(1, Math.round(Number(p.porTela) || 3));
      var chunk = Math.floor(cur / n), first = chunk * n, last = Math.min(words.length, first + n);
      var items = [];
      for (i = first; i < last; i++) items.push(itemFor(i));
      var L = layout(S, items, size, maxW, lineHeightK(pr));
      var top = cy - L.h / 2;
      if (p.fundo === 'faixa') faixa(S, cx, cy, L.w, L.h, (1 - out) * clamp((t - starts[first]) / 0.15, 0, 1));
      L.lines.forEach(function (ln, j) {
        var base = top + j * L.lh + size * 0.86;
        ln.items.forEach(function (it) {
          if (it.idx > cur) return;
          var kk2 = TC.ramp(t, starts[it.idx], starts[it.idx] + dur, S.ein);
          var color2 = it.color;
          var pop = 1;
          if (it.idx === cur) {
            if (!it.hi && p.atual === 'brasa') color2 = col.ember;
            if (p.atual === 'pop') pop = 1 + 0.1 * Math.sin(clamp(kk2, 0, 1) * Math.PI);
          }
          var xw = cx - L.w / 2 + (L.w - ln.w) / 2 + it.dx;
          var yy = base;
          if (pop !== 1) { c.save(); c.translate(xw + it.w / 2, yy - size * 0.3); c.scale(pop, pop); c.translate(-(xw + it.w / 2), -(yy - size * 0.3)); }
          put(S, it.str, xw, yy, { font: it.font, size: size, weight: it.weight, italic: it.italic, color: color2, align: 'left', mode: p.efeito, k: kk2, out: out, shadow: p.fundo === 'sombra' });
          if (pop !== 1) c.restore();
        });
      });
    }
  });

  // ------------------------------------------------------------------
  // Destaque — um trecho que merece ser lido com calma
  // ------------------------------------------------------------------
  TC.register({
    id: 'destaque',
    name: 'Destaque',
    category: 'texto',
    duration: 4.5,
    minDur: 2,
    thumb: 2.6,
    drag: { x: 'px', y: 'py', size: 'tamanho' },
    description: 'Uma frase grande entra linha por linha (foco, tracking, subida, obturador...) e o trecho que importa troca de cor e de fonte. Com um par de fontes, o trecho vira o complemento: itálico serifado no meio de letras condensadas, por exemplo.',
    uso: 'Pra grifar uma coisa interessante que alguém disse no vídeo, uma definição ou uma frase pra print. Fica no ar o tempo de ler duas vezes.',
    params: withDefaults([
      { key: 'rotulo', label: 'Rótulo pequeno (opcional)', type: 'text', default: 'repara nisso' },
      { key: 'texto', label: 'Frase', type: 'textarea', default: 'o morno não marca ninguém.' },
      { key: 'trecho', label: 'Trecho que se destaca', type: 'text', default: 'não marca' },
      { key: 'trechoEm', label: 'Destaque usa', type: 'select', options: ['cor + complemento', 'complemento', 'cor'], default: 'cor + complemento' },
      { key: 'efeito', label: 'Efeito de entrada', type: 'select', options: ['foco', 'tracking', 'subida', 'obturador', 'cinema', 'pop'], default: 'foco' },
      { key: 'alinhamento', label: 'Alinhamento', type: 'select', options: ['centro', 'esquerda'], default: 'centro' },
      { key: 'fundo', label: 'Leitura', type: 'select', options: ['sombra', 'faixa', 'nenhum'], default: 'sombra' }
    ], { fonte: 'Bebas + Instrument itálico', py: 52, tamanho: 100 }),
    draw: function (S, t) {
      var c = S.c, u = S.u, w = S.w, h = S.h, col = S.col, p = S.p, D = S.dur;
      var pr = TC.applyFontPair(S, p.fonte);
      var words = caseFix(p.texto, p.caixa).split(/\s+/).filter(Boolean);
      if (!words.length) return;
      var hi = TC.wordSet(caseFix(p.trecho, p.caixa));
      var useComp = p.trechoEm !== 'cor', useCor = p.trechoEm !== 'complemento';
      var size = (S.vertical ? 118 : 92) * u * (Number(p.tamanho) || 100) / 100;
      var maxW = w * (S.vertical ? 0.84 : 0.66);
      var items = words.map(function (wd, i) {
        var isHi = !!hi[TC.normWord(wd)], comp = isHi && useComp;
        return { idx: i, str: wd, font: comp ? 'comp' : 'main', weight: comp ? pr.cw : pr.mw, italic: comp ? !!pr.ci : !!pr.mi,
          color: isHi && useCor ? col.ember : col.paper };
      });
      var L = layout(S, items, size, maxW, lineHeightK(pr));
      var cx = w * (Number(p.px) || 50) / 100, cy = h * (Number(p.py) || 52) / 100;
      var top = cy - L.h / 2;
      var out = S.outK(D - 0.45, D);
      var dur = EFEITO_DUR[p.efeito] || 0.34;
      var left = p.alinhamento === 'esquerda';
      if (p.fundo === 'faixa') faixa(S, cx, cy, L.w, L.h, (1 - out) * clamp(t / 0.25, 0, 1));
      // rótulo
      if (p.rotulo) {
        var ka = TC.ramp(t, 0, 0.5, S.ein), ls = 30 * u * (Number(p.tamanho) || 100) / 100;
        c.save();
        c.globalAlpha *= clamp(ka, 0, 1) * (1 - out);
        if (p.fundo === 'sombra') S.shadow(0.8);
        S.label(p.rotulo, left ? cx - L.w / 2 : cx, top - ls * 1.4, { size: ls / u, color: col.ember, align: left ? 'left' : 'center' });
        c.restore();
      }
      L.lines.forEach(function (ln, j) {
        var base = top + j * L.lh + size * 0.86;
        ln.items.forEach(function (it, m) {
          var a0 = 0.15 + j * 0.16 + m * 0.035;
          var k = TC.ramp(t, a0, a0 + dur, S.ein);
          var xw = (left ? cx - L.w / 2 : cx - ln.w / 2) + it.dx;
          put(S, it.str, xw, base, { font: it.font, size: size, weight: it.weight, italic: it.italic, color: it.color, align: 'left', mode: p.efeito, k: k, out: out, shadow: p.fundo === 'sombra' });
        });
      });
    }
  });

  // ------------------------------------------------------------------
  // Manchete — palavra grande com linhas pequenas de complemento
  // ------------------------------------------------------------------
  TC.register({
    id: 'manchete',
    name: 'Manchete',
    category: 'texto',
    duration: 5,
    minDur: 2.5,
    thumb: 3,
    drag: { x: 'px', y: 'py', size: 'tamanho' },
    description: 'Três camadas de tipografia: uma linha pequena em cima, a palavra grande no meio e outra linha pequena embaixo. A palavra grande usa a fonte principal e as pequenas usam o complemento, cada camada com o seu tempo.',
    uso: 'A palavra do vídeo, a que tu quer que fique. Funciona como capa de capítulo, de citação ou de ideia.',
    params: withDefaults([
      { key: 'linha1', label: 'Linha de cima', type: 'text', default: 'o que fica é a' },
      { key: 'linha2', label: 'Palavra grande', type: 'text', default: 'marca' },
      { key: 'linha3', label: 'Linha de baixo', type: 'text', default: 'não o barulho.' },
      { key: 'corGrande', label: 'Cor da palavra grande', type: 'select', options: ['brasa', 'papel'], default: 'papel' },
      { key: 'efeito', label: 'Efeito da palavra grande', type: 'select', options: EFEITOS, default: 'obturador' },
      { key: 'fundo', label: 'Leitura', type: 'select', options: ['sombra', 'faixa', 'nenhum'], default: 'sombra' }
    ], { fonte: 'Bebas + Instrument itálico', py: 50, tamanho: 100 }),
    draw: function (S, t) {
      var c = S.c, u = S.u, w = S.w, h = S.h, col = S.col, p = S.p, D = S.dur;
      var pr = TC.applyFontPair(S, p.fonte);
      var l1 = caseFix(p.linha1, p.caixa === 'MAIÚSCULAS' ? p.caixa : 'minúsculas'), l2 = caseFix(p.linha2, p.caixa), l3 = caseFix(p.linha3, p.caixa === 'MAIÚSCULAS' ? p.caixa : 'minúsculas');
      var k100 = (Number(p.tamanho) || 100) / 100;
      var maxW = w * (S.vertical ? 0.88 : 0.7);
      var big = (S.vertical ? 300 : 230) * u * k100;
      S.font('main', big, pr.mw);
      var bw = S.measure(l2);
      if (bw > maxW) big *= maxW / bw;
      var small = (S.vertical ? 74 : 58) * u * k100;
      S.font('comp', small, pr.cw, !!pr.ci);
      var sw = Math.max(l1 ? S.measure(l1) : 0, l3 ? S.measure(l3) : 0);
      if (sw > maxW) small *= maxW / sw;
      var gap = 14 * u;
      var hh = (l1 ? small * 1.2 + gap : 0) + big * 0.82 + (l3 ? small * 1.2 + gap : 0);
      var cx = w * (Number(p.px) || 50) / 100, cy = h * (Number(p.py) || 50) / 100;
      var top = cy - hh / 2;
      var out = S.outK(D - 0.5, D);
      if (p.fundo === 'faixa') faixa(S, cx, cy, Math.max(Math.min(bw, maxW), sw), hh, (1 - out) * clamp(t / 0.25, 0, 1));
      var sh = p.fundo === 'sombra';
      var y = top;
      if (l1) {
        y += small * 1.0;
        put(S, l1, cx, y, { font: 'comp', size: small, weight: pr.cw, italic: !!pr.ci, color: col.paper, mode: 'cinema', k: TC.ramp(t, 0.1, 0.8, S.ein), out: out, shadow: sh });
        y += small * 0.2 + gap;
      }
      y += big * 0.82;
      put(S, l2, cx, y, { font: 'main', size: big, weight: pr.mw, italic: !!pr.mi, color: p.corGrande === 'brasa' ? col.ember : col.paper, mode: p.efeito, k: TC.ramp(t, 0.35, 0.35 + (EFEITO_DUR[p.efeito] || 0.3) + 0.2, S.ein), out: out, shadow: sh });
      if (l3) {
        y += small * 1.0 + gap * 0.4;
        put(S, l3, cx, y, { font: 'comp', size: small, weight: pr.cw, italic: !!pr.ci, color: col.ash, mode: 'cinema', k: TC.ramp(t, 1.0, 1.8, S.ein), out: out, shadow: sh });
      }
    }
  });
})(typeof window !== 'undefined' ? window : this);
