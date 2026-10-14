/*
 * Tamo Criando Motion — motor de animação
 *
 * Tudo é desenhado em <canvas> 2D, frame a frame, a partir do tempo `t`.
 * Nada depende do frame anterior: o frame 87 sai igual no preview, no
 * Premiere e no render em lote. Isso é o que permite gerar PNG com alpha
 * em qualquer resolução e frame rate.
 */
(function (root) {
  'use strict';

  var TC = root.TC || (root.TC = {});
  TC.version = '1.0.0';

  // ------------------------------------------------------------------
  // Matemática e easing
  // ------------------------------------------------------------------
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, k) { return a + (b - a) * k; }
  // progresso linear 0..1 entre os instantes a e b
  function seg(t, a, b) { return b <= a ? (t >= b ? 1 : 0) : clamp((t - a) / (b - a), 0, 1); }

  var ease = {
    linear: function (k) { return k; },
    inQuad: function (k) { return k * k; },
    outQuad: function (k) { return k * (2 - k); },
    inOutQuad: function (k) { return k < 0.5 ? 2 * k * k : -1 + (4 - 2 * k) * k; },
    inCubic: function (k) { return k * k * k; },
    outCubic: function (k) { var m = k - 1; return m * m * m + 1; },
    inOutCubic: function (k) { return k < 0.5 ? 4 * k * k * k : (k - 1) * (2 * k - 2) * (2 * k - 2) + 1; },
    inQuart: function (k) { return k * k * k * k; },
    outQuart: function (k) { var m = k - 1; return 1 - m * m * m * m; },
    inOutQuart: function (k) { var m = k - 1; return k < 0.5 ? 8 * k * k * k * k : 1 - 8 * m * m * m * m; },
    inExpo: function (k) { return k === 0 ? 0 : Math.pow(2, 10 * (k - 1)); },
    outExpo: function (k) { return k === 1 ? 1 : 1 - Math.pow(2, -10 * k); },
    inOutExpo: function (k) {
      if (k === 0 || k === 1) return k;
      return k < 0.5 ? Math.pow(2, 20 * k - 10) / 2 : (2 - Math.pow(2, -20 * k + 10)) / 2;
    },
    outBack: function (k, s) { s = s === undefined ? 1.70158 : s; var m = k - 1; return m * m * ((s + 1) * m + s) + 1; },
    inBack: function (k, s) { s = s === undefined ? 1.70158 : s; return k * k * ((s + 1) * k - s); },
    outElastic: function (k) {
      if (k === 0 || k === 1) return k;
      return Math.pow(2, -10 * k) * Math.sin((k * 10 - 0.75) * (2 * Math.PI / 3)) + 1;
    }
  };

  // progresso com easing entre a e b
  function ramp(t, a, b, fn) { return (fn || ease.outExpo)(seg(t, a, b)); }

  // gerador pseudo-aleatório determinístico (mulberry32)
  function rng(seed) {
    var s = (seed >>> 0) || 1;
    return function () {
      s = (s + 0x6D2B79F5) >>> 0;
      var r = Math.imul(s ^ (s >>> 15), 1 | s);
      r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
  }
  function hashStr(str) {
    var h = 2166136261;
    for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }

  function hexToRgb(hex) {
    var h = String(hex).replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    var n = parseInt(h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function rgba(hex, a) {
    if (String(hex).indexOf('rgb') === 0) return hex;
    var c = hexToRgb(hex);
    return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + (a === undefined ? 1 : a) + ')';
  }
  function mixHex(h1, h2, k) {
    var a = hexToRgb(h1), b = hexToRgb(h2);
    return 'rgb(' + Math.round(lerp(a[0], b[0], k)) + ',' + Math.round(lerp(a[1], b[1], k)) + ',' + Math.round(lerp(a[2], b[2], k)) + ')';
  }

  function makeCanvas(w, h) {
    if (typeof document !== 'undefined') {
      var c = document.createElement('canvas'); c.width = w; c.height = h; return c;
    }
    return new OffscreenCanvas(w, h);
  }

  // listas digitadas pelo usuário: "a, b, c" ou uma por linha
  function splitList(str) {
    var s = String(str || '');
    var parts = s.indexOf('\n') >= 0 ? s.split('\n') : s.split(',');
    var out = [];
    for (var i = 0; i < parts.length; i++) { var p = parts[i].trim(); if (p) out.push(p); }
    return out;
  }
  function normWord(w) {
    return String(w).toLocaleLowerCase('pt-BR').replace(/[.,;:!?…"“”'()\[\]]/g, '');
  }
  function pad2(n) { n = String(n); return n.length < 2 ? '0' + n : n; }

  TC.clamp = clamp; TC.lerp = lerp; TC.seg = seg; TC.ramp = ramp; TC.ease = ease;
  TC.rng = rng; TC.hashStr = hashStr; TC.rgba = rgba; TC.mixHex = mixHex;
  TC.makeCanvas = makeCanvas; TC.splitList = splitList; TC.normWord = normWord; TC.pad2 = pad2;

  // ------------------------------------------------------------------
  // Ícones vetoriais (caixa unitária centrada em 0,0)
  // ------------------------------------------------------------------
  var ICONS = {
    bolt: function (c) {
      c.moveTo(0.10, -0.50); c.lineTo(-0.38, 0.08); c.lineTo(-0.04, 0.08); c.lineTo(-0.14, 0.50);
      c.lineTo(0.38, -0.10); c.lineTo(0.04, -0.10); c.lineTo(0.18, -0.50); c.closePath();
    },
    flame: function (c) {
      c.moveTo(0.02, -0.50);
      c.bezierCurveTo(0.12, -0.30, 0.42, -0.14, 0.38, 0.14);
      c.bezierCurveTo(0.35, 0.38, 0.18, 0.50, 0.00, 0.50);
      c.bezierCurveTo(-0.18, 0.50, -0.37, 0.38, -0.38, 0.14);
      c.bezierCurveTo(-0.39, -0.06, -0.26, -0.18, -0.20, -0.32);
      c.bezierCurveTo(-0.12, -0.16, -0.06, -0.12, -0.02, -0.16);
      c.bezierCurveTo(0.04, -0.28, 0.00, -0.40, 0.02, -0.50);
      c.closePath();
    },
    flameInner: function (c) {
      c.moveTo(0.00, 0.00);
      c.bezierCurveTo(0.06, 0.10, 0.19, 0.18, 0.18, 0.30);
      c.bezierCurveTo(0.17, 0.41, 0.08, 0.46, 0.00, 0.46);
      c.bezierCurveTo(-0.08, 0.46, -0.18, 0.41, -0.18, 0.30);
      c.bezierCurveTo(-0.18, 0.18, -0.06, 0.10, 0.00, 0.00);
      c.closePath();
    },
    hex: function (c) {
      for (var i = 0; i < 6; i++) {
        var a = Math.PI / 6 + i * Math.PI / 3;
        var x = Math.cos(a) * 0.5, y = Math.sin(a) * 0.5;
        if (i === 0) c.moveTo(x, y); else c.lineTo(x, y);
      }
      c.closePath();
    },
    check: function (c) {
      c.moveTo(-0.36, 0.02); c.lineTo(-0.10, 0.28); c.lineTo(0.38, -0.24);
    }
  };
  TC.icons = ICONS;

  // ------------------------------------------------------------------
  // Stage: o "palco" que cada template recebe para desenhar
  // ------------------------------------------------------------------
  function Stage(ctx, w, h, opts) {
    this.c = ctx;
    this.w = w; this.h = h;
    this.u = Math.min(w, h) / 1080;          // 1u = 1px em 1080p
    this.ratio = w / h;
    this.vertical = this.ratio < 0.8;
    this.wide = this.ratio > 1.25;
    this.square = !this.vertical && !this.wide;
    this.t = opts.t;
    this.dur = opts.dur;
    this.p = opts.params;
    this.brand = opts.brand;
    this.col = opts.brand.colors;
    this.fonts = opts.brand.fonts;
    this.seed = opts.seed || 7;
    this.preview = !!opts.preview;
    // margens seguras: no 9:16 a interface do Reels/TikTok come o topo e a base
    this.safe = this.vertical
      ? { top: h * 0.12, bottom: h * 0.80, side: 70 * this.u }
      : { top: h * 0.08, bottom: h * 0.92, side: w * 0.06 };
  }
  var SP = Stage.prototype;

  SP.font = function (kind, size, weight, italic) {
    var fam = this.fonts[kind] || this.fonts.sans;
    this.c.font = (italic ? 'italic ' : '') + (weight || 400) + ' ' + Math.max(1, Math.round(size * 100) / 100) + 'px ' + fam;
    this._fontSize = size;
  };

  // largura de texto com espaçamento entre letras (em px)
  SP.measure = function (str, spacing) {
    str = String(str);
    if (!spacing) return this.c.measureText(str).width;
    var w = 0;
    for (var i = 0; i < str.length; i++) w += this.c.measureText(str[i]).width;
    return w + spacing * Math.max(0, str.length - 1);
  };

  // altura de caixa-alta da fonte atual (para centralizar verticalmente)
  SP.capH = function () {
    var m = this.c.measureText('H');
    if (m.actualBoundingBoxAscent) return m.actualBoundingBoxAscent;
    return (this._fontSize || 10) * 0.72;
  };

  SP.text = function (str, x, y, o) {
    o = o || {};
    var c = this.c;
    str = String(str);
    c.textBaseline = o.base || 'alphabetic';
    if (o.color) c.fillStyle = o.color;
    var sp = o.spacing || 0;
    var align = o.align || 'left';
    if (!sp) {
      c.textAlign = align;
      c.fillText(str, x, y);
      return;
    }
    var w = this.measure(str, sp);
    var cx = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x;
    c.textAlign = 'left';
    for (var i = 0; i < str.length; i++) {
      c.fillText(str[i], cx, y);
      cx += c.measureText(str[i]).width + sp;
    }
  };

  // quebra de linha simples respeitando \n
  SP.wrap = function (str, maxW, spacing) {
    var out = [];
    var paras = String(str).split('\n');
    for (var p = 0; p < paras.length; p++) {
      var words = paras[p].split(/\s+/).filter(Boolean);
      var line = '';
      for (var i = 0; i < words.length; i++) {
        var test = line ? line + ' ' + words[i] : words[i];
        if (line && this.measure(test, spacing) > maxW) { out.push(line); line = words[i]; }
        else line = test;
      }
      out.push(line);
    }
    return out;
  };

  // maior tamanho de fonte (entre min e max) que faz o texto caber em maxW
  SP.fit = function (str, kind, weight, maxW, maxSize, minSize, italic) {
    var size = maxSize;
    this.font(kind, size, weight, italic);
    var w = this.measure(str);
    if (w > maxW) size = Math.max(minSize || 1, size * maxW / w);
    this.font(kind, size, weight, italic);
    return size;
  };

  // layout palavra a palavra (para destacar palavras e animar uma a uma)
  SP.flow = function (str, o) {
    var maxW = o.maxW, lineH = o.lineH;
    var lines = [];
    var paras = String(str).split('\n');
    var spaceW = this.measure(' ');
    for (var p = 0; p < paras.length; p++) {
      var words = paras[p].split(/\s+/).filter(Boolean);
      var cur = { words: [], w: 0 };
      for (var i = 0; i < words.length; i++) {
        var ww = this.measure(words[i]);
        var add = cur.words.length ? spaceW + ww : ww;
        if (cur.words.length && cur.w + add > maxW) { lines.push(cur); cur = { words: [], w: 0 }; add = ww; }
        cur.words.push({ text: words[i], w: ww, x: cur.w + (cur.words.length ? spaceW : 0) });
        cur.w += add;
      }
      lines.push(cur);
    }
    var out = [], idx = 0, maxLine = 0;
    for (var l = 0; l < lines.length; l++) {
      var ln = lines[l];
      maxLine = Math.max(maxLine, ln.w);
      var off = o.align === 'center' ? (maxW - ln.w) / 2 : o.align === 'right' ? maxW - ln.w : 0;
      for (var k = 0; k < ln.words.length; k++) {
        var wd = ln.words[k];
        out.push({ text: wd.text, w: wd.w, x: off + wd.x, y: l * lineH, line: l, i: idx++, key: normWord(wd.text) });
      }
    }
    return { words: out, lines: lines.length, width: maxLine, height: lines.length * lineH, lineWidths: lines.map(function (x) { return x.w; }) };
  };

  SP.rrect = function (x, y, w, h, r) {
    var c = this.c;
    r = Math.max(0, Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2));
    c.beginPath();
    c.moveTo(x + r, y);
    c.lineTo(x + w - r, y); c.arcTo(x + w, y, x + w, y + r, r);
    c.lineTo(x + w, y + h - r); c.arcTo(x + w, y + h, x + w - r, y + h, r);
    c.lineTo(x + r, y + h); c.arcTo(x, y + h, x, y + h - r, r);
    c.lineTo(x, y + r); c.arcTo(x, y, x + r, y, r);
    c.closePath();
  };
  SP.fillRRect = function (x, y, w, h, r, color) {
    if (w <= 0 || h <= 0) return;
    this.rrect(x, y, w, h, r); this.c.fillStyle = color; this.c.fill();
  };

  SP.clipRect = function (x, y, w, h) {
    this.c.beginPath(); this.c.rect(x, y, w, h); this.c.clip();
  };

  SP.push = function () { this.c.save(); };
  SP.pop = function () { this.c.restore(); };
  SP.alpha = function (a) { this.c.globalAlpha *= clamp(a, 0, 1); };

  SP.shadow = function (strength) {
    var c = this.c;
    if (!strength) { c.shadowColor = 'transparent'; c.shadowBlur = 0; c.shadowOffsetY = 0; return; }
    c.shadowColor = 'rgba(0,0,0,' + (0.45 * strength) + ')';
    c.shadowBlur = 22 * this.u * strength;
    c.shadowOffsetY = 4 * this.u * strength;
  };

  // desenha ícone na posição (x,y) centro, tamanho em px
  SP.icon = function (name, x, y, size, color, o) {
    o = o || {};
    var c = this.c, fn = ICONS[name];
    if (!fn) return;
    c.save();
    c.translate(x, y);
    if (o.rot) c.rotate(o.rot);
    c.scale(size * (o.sx || 1), size * (o.sy || 1));
    c.beginPath(); fn(c);
    if (name === 'check' || o.stroke) {
      c.lineWidth = (o.lineWidth || 0.12);
      c.lineCap = 'round'; c.lineJoin = 'round';
      c.strokeStyle = color; c.stroke();
    } else {
      c.fillStyle = color; c.fill();
      if (name === 'flame' && o.inner) { c.beginPath(); ICONS.flameInner(c); c.fillStyle = o.inner; c.fill(); }
    }
    c.restore();
  };

  // ícone da marca (raio no Novo MKT, hexágono no universe...)
  SP.brandIcon = function (x, y, size, color, which) {
    var name = which === 'badge' ? (this.brand.badge || 'flame') : (this.brand.icon || 'bolt');
    this.icon(name, x, y, size, color, name === 'hex' ? { stroke: true, lineWidth: 0.14 } : null);
  };

  // brasas subindo (determinístico a partir de t)
  SP.embers = function (o) {
    var c = this.c, u = this.u, t = this.t;
    var r = rng(o.seed || 11);
    var n = o.count || 40;
    var area = o.area || { x: 0, y: 0, w: this.w, h: this.h };
    var fade = o.alpha === undefined ? 1 : o.alpha;
    if (fade <= 0) return;
    c.save();
    c.globalCompositeOperation = 'lighter';
    for (var i = 0; i < n; i++) {
      var x0 = area.x + r() * area.w;
      var life = 2.2 + r() * 3.2;
      var ph = r();
      var travel = area.h * (0.35 + r() * 0.65);
      var size = (1.6 + r() * 4.2) * u * (o.scale || 1);
      var sway = (8 + r() * 30) * u;
      var fr = 0.6 + r() * 1.6;
      var q = ((t / life) + ph) % 1;
      var x = x0 + Math.sin(t * fr + ph * 6.28) * sway;
      var y = area.y + area.h - q * travel;
      var a = Math.sin(q * Math.PI) * (0.55 + 0.45 * Math.sin(t * (9 + i % 5) + i)) * fade;
      if (a <= 0.01) continue;
      var col = r() < 0.55 ? this.col.accent : this.col.accent2;
      c.globalAlpha = a * 0.22;
      c.fillStyle = col;
      c.beginPath(); c.arc(x, y, size * 3.2, 0, Math.PI * 2); c.fill();
      c.globalAlpha = a;
      c.beginPath(); c.arc(x, y, size, 0, Math.PI * 2); c.fill();
    }
    c.restore();
  };

  // granulado de papel/filme (12 fps, como película)
  var grainCache = {};
  SP.grain = function (alpha, dark) {
    if (alpha <= 0) return;
    var key = dark ? 'd' : 'l';
    if (!grainCache[key]) {
      var g = makeCanvas(256, 256), gc = g.getContext('2d');
      var img = gc.createImageData(256, 256), r = rng(dark ? 99 : 42);
      for (var i = 0; i < img.data.length; i += 4) {
        var v = dark ? 255 : 0;
        img.data[i] = v; img.data[i + 1] = v; img.data[i + 2] = v;
        img.data[i + 3] = Math.floor(r() * r() * 255);
      }
      gc.putImageData(img, 0, 0);
      grainCache[key] = g;
    }
    var c = this.c;
    var f = Math.floor(this.t * 12);
    var rr = rng(f + 3);
    c.save();
    c.globalAlpha *= alpha;
    var pat = c.createPattern(grainCache[key], 'repeat');
    c.translate(-Math.floor(rr() * 256), -Math.floor(rr() * 256));
    c.fillStyle = pat;
    c.fillRect(0, 0, this.w + 256, this.h + 256);
    c.restore();
  };

  // padrão de raios ao fundo (como nos stories)
  SP.iconPattern = function (color, alpha, size, drift) {
    var c = this.c, u = this.u;
    var step = size * 2.6;
    var off = (this.t * (drift || 14) * u) % step;
    c.save();
    c.globalAlpha *= alpha;
    for (var y = -step; y < this.h + step; y += step) {
      var row = Math.round(y / step);
      for (var x = -step; x < this.w + step; x += step) {
        var xx = x + (row % 2 ? step / 2 : 0) + off;
        this.brandIcon(xx, y + off * 0.6, size, color);
      }
    }
    c.restore();
  };

  // símbolo ≠ desenhado à mão (garante o visual em qualquer fonte)
  SP.notEqual = function (x, y, size, color, k) {
    var c = this.c;
    k = k === undefined ? 1 : k;
    var w = size * 0.62, gap = size * 0.13, lw = size * 0.085;
    c.save();
    c.strokeStyle = color; c.lineWidth = lw; c.lineCap = 'round';
    var a = seg(k, 0, 0.5), b = seg(k, 0.25, 0.75), s = seg(k, 0.5, 1);
    c.beginPath(); c.moveTo(x - w / 2, y - gap); c.lineTo(x - w / 2 + w * a, y - gap); c.stroke();
    c.beginPath(); c.moveTo(x - w / 2, y + gap); c.lineTo(x - w / 2 + w * b, y + gap); c.stroke();
    if (s > 0) {
      var x1 = x - size * 0.17, y1 = y + size * 0.36, x2 = x + size * 0.17, y2 = y - size * 0.36;
      c.beginPath(); c.moveTo(x1, y1); c.lineTo(lerp(x1, x2, s), lerp(y1, y2, s)); c.stroke();
    }
    c.restore();
  };

  // ------------------------------------------------------------------
  // Registro de templates
  // ------------------------------------------------------------------
  TC.templates = {};
  TC.order = [];
  TC.categories = [
    { id: 'abertura', name: 'Abertura e fim' },
    { id: 'estrutura', name: 'Sinalização' },
    { id: 'enfase', name: 'Ênfase' },
    { id: 'argumento', name: 'Argumento' },
    { id: 'identidade', name: 'Identidade' },
    { id: 'transicao', name: 'Transições' }
  ];

  TC.register = function (def) {
    def.duration = def.duration || 4;
    def.minDur = def.minDur || Math.min(def.duration, 2);
    def.params = def.params || [];
    def.thumb = def.thumb === undefined ? def.duration * 0.6 : def.thumb;
    TC.templates[def.id] = def;
    TC.order.push(def.id);
  };

  TC.list = function () {
    var cats = TC.categories.map(function (c) { return c.id; });
    return TC.order.map(function (id) { return TC.templates[id]; }).sort(function (a, b) {
      return cats.indexOf(a.category) - cats.indexOf(b.category);
    });
  };

  // valores padrão: o que o template define, sobrescrito pela assinatura da marca
  TC.defaults = function (id, brand) {
    var tpl = TC.templates[id], out = {};
    brand = brand || TC.brands[TC.defaultBrand];
    for (var i = 0; i < tpl.params.length; i++) {
      var p = tpl.params[i];
      var v = p.default;
      if (p.fromBrand && brand.sign && brand.sign[p.fromBrand] !== undefined) v = brand.sign[p.fromBrand];
      out[p.key] = v;
    }
    return out;
  };

  /**
   * Desenha um frame.
   *  ctx     CanvasRenderingContext2D
   *  id      id do template
   *  o.w,o.h tamanho em px
   *  o.t     tempo em segundos
   *  o.dur   duração total (s) — padrão do template se omitido
   *  o.params  valores dos campos (mesclados com os padrões)
   *  o.brand   id ou objeto da marca
   *  o.preview  true = desenha um fundo de vídeo fictício atrás dos overlays
   */
  TC.renderFrame = function (ctx, id, o) {
    var tpl = TC.templates[id];
    if (!tpl) throw new Error('Template não encontrado: ' + id);
    var brand = typeof o.brand === 'object' ? o.brand : (TC.brands[o.brand] || TC.brands[TC.defaultBrand]);
    var params = TC.defaults(id, brand);
    if (o.params) for (var k in o.params) if (o.params[k] !== undefined && o.params[k] !== null) params[k] = o.params[k];
    var dur = Math.max(tpl.minDur, o.dur || tpl.duration);
    var t = clamp(o.t, 0, dur);

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    ctx.clearRect(0, 0, o.w, o.h);
    if (o.preview && o.backdrop !== false) TC.drawBackdrop(ctx, o.w, o.h, o.backdrop || 'video', t);
    var S = new Stage(ctx, o.w, o.h, { t: t, dur: dur, params: params, brand: brand, preview: o.preview, seed: hashStr(id) });
    tpl.draw(S, t);
    ctx.restore();
  };

  // fundo de "vídeo" fictício para pré-visualizar overlays
  TC.drawBackdrop = function (ctx, w, h, kind, t) {
    if (kind === 'checker') {
      var sz = Math.max(8, Math.round(Math.min(w, h) / 40));
      for (var y = 0; y < h; y += sz) for (var x = 0; x < w; x += sz) {
        ctx.fillStyle = ((x / sz + y / sz) % 2) ? '#cfcfcf' : '#f2f2f2';
        ctx.fillRect(x, y, sz, sz);
      }
      return;
    }
    var g = ctx.createLinearGradient(0, 0, w * 0.3, h);
    g.addColorStop(0, '#2d3a42'); g.addColorStop(0.55, '#4a4038'); g.addColorStop(1, '#1d1f22');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    // "pessoa" desfocada no centro, pra lembrar um vídeo de rosto
    var u = Math.min(w, h) / 1080;
    var cx = w * 0.5 + Math.sin(t * 0.8) * 6 * u, cy = h * (h > w ? 0.42 : 0.5);
    var r1 = ctx.createRadialGradient(cx, cy - 120 * u, 10 * u, cx, cy - 120 * u, 260 * u);
    r1.addColorStop(0, 'rgba(214,170,140,0.55)'); r1.addColorStop(1, 'rgba(214,170,140,0)');
    ctx.fillStyle = r1; ctx.fillRect(0, 0, w, h);
    var r2 = ctx.createRadialGradient(cx, cy + 420 * u, 40 * u, cx, cy + 420 * u, 520 * u);
    r2.addColorStop(0, 'rgba(70,95,130,0.6)'); r2.addColorStop(1, 'rgba(70,95,130,0)');
    ctx.fillStyle = r2; ctx.fillRect(0, 0, w, h);
    var r3 = ctx.createRadialGradient(w * 0.85, h * 0.15, 10, w * 0.85, h * 0.15, 400 * u);
    r3.addColorStop(0, 'rgba(255,200,140,0.25)'); r3.addColorStop(1, 'rgba(255,200,140,0)');
    ctx.fillStyle = r3; ctx.fillRect(0, 0, w, h);
  };

  // formatos
  TC.formats = {
    '9:16': { w: 1080, h: 1920, label: 'Vertical 9:16 (Reels, TikTok, Shorts)' },
    '16:9': { w: 1920, h: 1080, label: 'Horizontal 16:9 (YouTube, institucional)' },
    '1:1': { w: 1080, h: 1080, label: 'Quadrado 1:1' },
    '4:5': { w: 1080, h: 1350, label: 'Retrato 4:5 (feed)' }
  };

  // carrega as fontes antes de desenhar (senão o primeiro frame sai com fonte do sistema)
  TC.loadFonts = function (brand) {
    if (typeof document === 'undefined' || !document.fonts) return Promise.resolve();
    brand = brand || TC.brands[TC.defaultBrand];
    var f = brand.fonts;
    var specs = [
      '400 40px ' + f.display, '400 40px ' + f.sans, '600 40px ' + f.sans, '700 40px ' + f.sans,
      '800 40px ' + f.sans, '900 40px ' + f.sans, 'italic 700 40px ' + f.sans, 'italic 800 40px ' + f.sans,
      '400 40px ' + f.mono, '700 40px ' + f.mono
    ];
    return Promise.all(specs.map(function (s) {
      return document.fonts.load(s, 'AÇÃÉÍ≠aç').catch(function () { return null; });
    })).then(function () { return document.fonts.ready; });
  };

  TC.Stage = Stage;
})(typeof window !== 'undefined' ? window : this);
