/*
 * Tamo Criando Motion — motor de animação
 *
 * Tudo é desenhado em <canvas> 2D, frame a frame, a partir do tempo `t`.
 * Nada depende do frame anterior: o frame 87 sai igual na prévia, no
 * Premiere e no render em lote. Por isso dá pra gerar PNG com alpha em
 * qualquer resolução, e por isso o desfoque de movimento (fx.js) funciona:
 * ele só pede vários instantes vizinhos e tira a média.
 */
(function (root) {
  'use strict';

  var TC = root.TC || (root.TC = {});
  TC.version = '2.0.0';

  // ------------------------------------------------------------------
  // Matemática e easing
  // ------------------------------------------------------------------
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, k) { return a + (b - a) * k; }
  function seg(t, a, b) { return b <= a ? (t >= b ? 1 : 0) : clamp((t - a) / (b - a), 0, 1); }
  function smooth(a, b, x) { var k = clamp((x - a) / (b - a), 0, 1); return k * k * (3 - 2 * k); }

  var ease = {
    linear: function (k) { return k; },
    inQuad: function (k) { return k * k; },
    outQuad: function (k) { return k * (2 - k); },
    inOutSine: function (k) { return -(Math.cos(Math.PI * k) - 1) / 2; },
    outSine: function (k) { return Math.sin(k * Math.PI / 2); },
    inSine: function (k) { return 1 - Math.cos(k * Math.PI / 2); },
    inCubic: function (k) { return k * k * k; },
    outCubic: function (k) { var m = k - 1; return m * m * m + 1; },
    inOutCubic: function (k) { return k < 0.5 ? 4 * k * k * k : (k - 1) * (2 * k - 2) * (2 * k - 2) + 1; },
    outQuint: function (k) { var m = k - 1; return 1 + m * m * m * m * m; },
    inQuint: function (k) { return k * k * k * k * k; },
    inExpo: function (k) { return k === 0 ? 0 : Math.pow(2, 10 * (k - 1)); },
    outExpo: function (k) { return k === 1 ? 1 : 1 - Math.pow(2, -10 * k); },
    outBack: function (k, s) { s = s === undefined ? 1.70158 : s; var m = k - 1; return m * m * ((s + 1) * m + s) + 1; },
    inBack: function (k, s) { s = s === undefined ? 1.70158 : s; return k * k * ((s + 1) * k - s); }
  };
  function ramp(t, a, b, fn) { return (fn || ease.outQuint)(seg(t, a, b)); }

  // cubic-bezier igual ao do CSS / After Effects (x1, y1, x2, y2)
  function bezier(x1, y1, x2, y2) {
    var cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
    var cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
    function sx(t) { return ((ax * t + bx) * t + cx) * t; }
    function sy(t) { return ((ay * t + by) * t + cy) * t; }
    function dsx(t) { return (3 * ax * t + 2 * bx) * t + cx; }
    function solve(x) {
      var t = x, i;
      for (i = 0; i < 8; i++) {
        var e = sx(t) - x;
        if (Math.abs(e) < 1e-6) return t;
        var d = dsx(t);
        if (Math.abs(d) < 1e-6) break;
        t -= e / d;
      }
      var lo = 0, hi = 1; t = x;
      for (i = 0; i < 40; i++) {
        var v = sx(t);
        if (Math.abs(v - x) < 1e-6) return t;
        if (x > v) lo = t; else hi = t;
        t = (lo + hi) / 2;
      }
      return t;
    }
    return function (k) { if (k <= 0) return 0; if (k >= 1) return 1; return sy(solve(k)); };
  }
  var curveCache = {};
  function curve(v) {
    if (typeof v === 'function') return v;
    if (!v || v.length !== 4) v = TC.curvePresets.suave.v;
    var key = v.join(',');
    if (!curveCache[key]) curveCache[key] = bezier(+v[0], +v[1], +v[2], +v[3]);
    return curveCache[key];
  }

  // curvas prontas (aparecem como atalhos no editor de curva)
  TC.curvePresets = {
    suave: { label: 'suave', v: [0.25, 0.9, 0.3, 1] },
    brasa: { label: 'brasa', v: [0.16, 1, 0.3, 1] },
    faisca: { label: 'faísca', v: [0.34, 1.5, 0.64, 1] },
    folego: { label: 'fôlego', v: [0.65, 0, 0.35, 1] },
    apagar: { label: 'apagar', v: [0.55, 0, 0.8, 0.3] },
    linear: { label: 'linear', v: [0, 0, 1, 1] }
  };

  // aleatório determinístico
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
    str = String(str);
    for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function hash2(x, y, seed) {
    var h = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(seed | 0, 2246822519);
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  }
  // ruído de valor 2D + fbm (pra máscaras orgânicas: queima, erosão, fumaça)
  function vnoise(x, y, seed) {
    var xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    var u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    var a = hash2(xi, yi, seed), b = hash2(xi + 1, yi, seed), c = hash2(xi, yi + 1, seed), d = hash2(xi + 1, yi + 1, seed);
    return lerp(lerp(a, b, u), lerp(c, d, u), v);
  }
  function fbm(x, y, seed) {
    var s = 0, amp = 0.5, f = 1, n = 0;
    for (var o = 0; o < 4; o++) { s += vnoise(x * f, y * f, seed + o * 17) * amp; n += amp; amp *= 0.5; f *= 2.03; }
    return s / n;
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
    k = clamp(k, 0, 1);
    return '#' + [0, 1, 2].map(function (i) {
      var v = Math.round(lerp(a[i], b[i], k)).toString(16);
      return v.length < 2 ? '0' + v : v;
    }).join('');
  }

  function makeCanvas(w, h) {
    w = Math.max(1, Math.round(w)); h = Math.max(1, Math.round(h));
    if (typeof document !== 'undefined') { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
    return new OffscreenCanvas(w, h);
  }

  function splitList(str) {
    var s = String(str || '');
    var parts = s.indexOf('\n') >= 0 ? s.split('\n') : s.split(',');
    var out = [];
    for (var i = 0; i < parts.length; i++) { var p = parts[i].trim(); if (p) out.push(p); }
    return out;
  }
  function normWord(w) { return String(w).toLocaleLowerCase('pt-BR').replace(/[.,;:!?…"“”'()\[\]]/g, ''); }
  function pad2(n) { n = String(n); return n.length < 2 ? '0' + n : n; }
  function wordSet(str) { var o = {}; String(str || '').split(/\s+/).forEach(function (x) { if (x) o[normWord(x)] = 1; }); return o; }

  TC.clamp = clamp; TC.lerp = lerp; TC.seg = seg; TC.smooth = smooth; TC.ramp = ramp; TC.ease = ease;
  TC.bezier = bezier; TC.curve = curve; TC.rng = rng; TC.hashStr = hashStr; TC.noise = vnoise; TC.fbm = fbm;
  TC.rgba = rgba; TC.mixHex = mixHex; TC.makeCanvas = makeCanvas;
  TC.splitList = splitList; TC.normWord = normWord; TC.pad2 = pad2; TC.wordSet = wordSet;

  // ------------------------------------------------------------------
  // A chama da marca (vetorizada a partir do símbolo original)
  // pontos normalizados: altura 1, centro em (0,0), ponta em y = -0.5
  // ------------------------------------------------------------------
  var FLAME = [-0.074,  -0.497,  -0.035,  -0.468,  0.016,  -0.414,  0.066,  -0.347,  0.103,  -0.282,  0.133,  -0.209,  0.152,  -0.139,  0.165,  -0.065,  0.169,  0.005,  0.185,  -0.013,  0.205,  -0.055,  0.214,  -0.086,  0.218,  -0.135,  0.267,  -0.075,  0.295,  -0.025,  0.321,  0.035,  0.338,  0.096,  0.346,  0.162,  0.344,  0.218,  0.329,  0.286,  0.305,  0.341,  0.273,  0.389,  0.226,  0.437,  0.17,  0.476,  0.116,  0.498,  0.142,  0.447,  0.16,  0.391,  0.164,  0.35,  0.158,  0.307,  0.153,  0.289,  0.141,  0.267,  0.071,  0.186,  0.041,  0.142,  0.017,  0.093,  -0.009,  0.015,  -0.026,  0.099,  -0.049,  0.162,  -0.086,  0.223,  -0.145,  0.291,  -0.156,  0.311,  -0.163,  0.333,  -0.167,  0.384,  -0.163,  0.422,  -0.15,  0.462,  -0.131,  0.498,  -0.156,  0.489,  -0.206,  0.461,  -0.244,  0.433,  -0.277,  0.401,  -0.299,  0.372,  -0.317,  0.34,  -0.332,  0.302,  -0.341,  0.264,  -0.346,  0.224,  -0.346,  0.187,  -0.34,  0.134,  -0.324,  0.077,  -0.292,  -0.003,  -0.252,  -0.077,  -0.214,  -0.134,  -0.208,  -0.09,  -0.2,  -0.058,  -0.187,  -0.029,  -0.117,  -0.214,  -0.066,  -0.326,  -0.061,  -0.363,  -0.061,  -0.398,  -0.064,  -0.435];
  var FLAME_CORNERS = [0,  8,  12,  24,  34,  44,  59,  62];

  // curva suave dentro de cada trecho, cantos vivos nas pontas
  function catmullSegment(c, P) {
    for (var i = 0; i < P.length - 1; i++) {
      var p0 = P[Math.max(0, i - 1)], p1 = P[i], p2 = P[i + 1], p3 = P[Math.min(P.length - 1, i + 2)];
      c.bezierCurveTo(
        p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6,
        p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6,
        p2[0], p2[1]);
    }
  }

  /*
   * Caminho da chama.
   *  o.t        tempo (pra tremular)
   *  o.flicker  0..1 intensidade do tremor (0 = logo estático)
   *  o.height   0..1 altura (1 = inteira; baixando = chama se apagando)
   */
  function flamePath(c, o) {
    o = o || {};
    var t = o.t || 0, fl = o.flicker || 0, hgt = o.height === undefined ? 1 : o.height;
    var n = FLAME.length / 2, P = [];
    for (var i = 0; i < n; i++) {
      var x = FLAME[i * 2], y = FLAME[i * 2 + 1];
      if (fl) {
        var wgt = Math.pow(clamp(0.5 - y, 0, 1), 1.5);
        var ph = x > 0.12 ? 1.7 : x < -0.12 ? 3.1 : 0;
        x += (Math.sin(t * 8.3 + y * 7 + ph) * 0.02 + Math.sin(t * 13.7 + y * 13 + ph * 2) * 0.008) * fl * wgt;
        y += (Math.sin(t * 6.1 + x * 5 + ph) * 0.012 - Math.abs(Math.sin(t * 4.3 + ph)) * 0.02) * fl * wgt;
      }
      if (hgt !== 1) { y = 0.5 - (0.5 - y) * hgt; x = x * (0.55 + 0.45 * hgt); }
      P.push([x, y]);
    }
    c.moveTo(P[0][0], P[0][1]);
    for (var k = 0; k < FLAME_CORNERS.length; k++) {
      var a = FLAME_CORNERS[k], b = FLAME_CORNERS[(k + 1) % FLAME_CORNERS.length];
      var pts = [];
      for (var j = a; ; j = (j + 1) % n) { pts.push(P[j]); if (j === b) break; }
      catmullSegment(c, pts);
    }
    c.closePath();
  }
  TC.flamePath = flamePath;

  // ------------------------------------------------------------------
  // caches de texto e campos (máscaras)
  // ------------------------------------------------------------------
  var LRU = function (max) { this.max = max; this.map = {}; this.keys = []; };
  LRU.prototype.get = function (k) { return this.map[k]; };
  LRU.prototype.set = function (k, v) {
    if (!(k in this.map)) { this.keys.push(k); if (this.keys.length > this.max) delete this.map[this.keys.shift()]; }
    this.map[k] = v; return v;
  };
  var textCache = new LRU(40), fieldCache = new LRU(16), pointCache = new LRU(20), mottleCache = {}, grainCache = {};
  // texto desenhado antes da fonte carregar sairia com a fonte reserva pra sempre: limpa quando ela chega
  function clearTextCache() { textCache = new LRU(40); pointCache = new LRU(20); }
  TC.clearTextCache = clearTextCache;
  if (typeof document !== 'undefined' && document.fonts && document.fonts.addEventListener) {
    document.fonts.addEventListener('loadingdone', clearTextCache);
  }

  // ------------------------------------------------------------------
  // Stage: o "palco" que cada template recebe
  // ------------------------------------------------------------------
  function Stage(ctx, w, h, opts) {
    this.c = ctx;
    this.w = w; this.h = h;
    this.u = Math.min(w, h) / 1080;
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
    this.ein = curve(opts.params.entrada);
    this.eout = curve(opts.params.saida);
    this.safe = this.vertical
      ? { top: h * 0.12, bottom: h * 0.80, side: 70 * this.u }
      : { top: h * 0.08, bottom: h * 0.92, side: w * 0.06 };
  }
  var SP = Stage.prototype;

  // progresso de entrada / saída com as curvas editáveis
  SP.inK = function (a, b) { return ramp(this.t, a, b, this.ein); };
  SP.outK = function (a, b) { return ramp(this.t, a, b, this.eout); };
  SP.lin = function (a, b) { return seg(this.t, a, b); };

  SP.font = function (kind, size, weight, italic) {
    var fam = this.fonts[kind] || this.fonts.sans;
    this.c.font = (italic ? 'italic ' : '') + (weight || 400) + ' ' + Math.max(1, Math.round(size * 100) / 100) + 'px ' + fam;
    this._fontSize = size;
  };
  SP.measure = function (str, spacing) {
    str = String(str);
    if (!spacing) return this.c.measureText(str).width;
    var w = 0;
    for (var i = 0; i < str.length; i++) w += this.c.measureText(str[i]).width;
    return w + spacing * Math.max(0, str.length - 1);
  };
  SP.capH = function () {
    var m = this.c.measureText('H');
    return m.actualBoundingBoxAscent || (this._fontSize || 10) * 0.72;
  };
  SP.xH = function () {
    var m = this.c.measureText('x');
    return m.actualBoundingBoxAscent || (this._fontSize || 10) * 0.52;
  };
  SP.text = function (str, x, y, o) {
    o = o || {};
    var c = this.c;
    str = String(str);
    c.textBaseline = o.base || 'alphabetic';
    if (o.color) c.fillStyle = o.color;
    var sp = o.spacing || 0, align = o.align || 'left';
    if (!sp) { c.textAlign = align; c.fillText(str, x, y); return; }
    var w = this.measure(str, sp);
    var cx = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x;
    c.textAlign = 'left';
    for (var i = 0; i < str.length; i++) { c.fillText(str[i], cx, y); cx += c.measureText(str[i]).width + sp; }
  };
  // rótulo pequeno em caixa alta espaçada (o "O DESTINO" dos carrosséis)
  SP.label = function (str, x, y, o) {
    o = o || {};
    var size = (o.size || 24) * this.u;
    this.font('sans', size, o.weight || 600);
    this.text(String(str).toLocaleUpperCase('pt-BR'), x, y, { color: o.color || this.col.ash, spacing: size * 0.22, align: o.align });
    return this.measure(String(str).toLocaleUpperCase('pt-BR'), size * 0.22);
  };
  SP.wrap = function (str, maxW, spacing) {
    var out = [], paras = String(str).split('\n');
    for (var p = 0; p < paras.length; p++) {
      var words = paras[p].split(/\s+/).filter(Boolean), line = '';
      for (var i = 0; i < words.length; i++) {
        var test = line ? line + ' ' + words[i] : words[i];
        if (line && this.measure(test, spacing) > maxW) { out.push(line); line = words[i]; } else line = test;
      }
      out.push(line);
    }
    return out;
  };
  SP.fit = function (str, kind, weight, maxW, maxSize, minSize, italic) {
    var size = maxSize;
    this.font(kind, size, weight, italic);
    var w = this.measure(str);
    if (w > maxW) size = Math.max(minSize || 1, size * maxW / w);
    this.font(kind, size, weight, italic);
    return size;
  };
  SP.flow = function (str, o) {
    var maxW = o.maxW, lineH = o.lineH, lines = [], paras = String(str).split('\n');
    var spaceW = this.measure(' ');
    for (var p = 0; p < paras.length; p++) {
      var words = paras[p].split(/\s+/).filter(Boolean), cur = { words: [], w: 0 };
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
  // tamanho que faz um bloco caber em largura e altura
  SP.fitFlow = function (str, kind, weight, maxW, maxH, startSize, lineK, minSize) {
    var size = startSize, lay;
    for (var g = 0; g < 40; g++) {
      this.font(kind, size, weight);
      lay = this.flow(str, { maxW: maxW, lineH: size * lineK });
      var widest = 0;
      for (var i = 0; i < lay.words.length; i++) widest = Math.max(widest, lay.words[i].w);
      if ((lay.height <= maxH && widest <= maxW) || size <= (minSize || 20 * this.u)) break;
      size *= 0.94;
    }
    lay.size = size;
    return lay;
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
  SP.clipRect = function (x, y, w, h) { this.c.beginPath(); this.c.rect(x, y, w, h); this.c.clip(); };
  SP.alpha = function (a) { this.c.globalAlpha *= clamp(a, 0, 1); };
  SP.shadow = function (strength, color) {
    var c = this.c;
    if (!strength) { c.shadowColor = 'transparent'; c.shadowBlur = 0; c.shadowOffsetY = 0; return; }
    c.shadowColor = color || 'rgba(15,12,10,' + (0.5 * strength) + ')';
    c.shadowBlur = 26 * this.u * strength;
    c.shadowOffsetY = 4 * this.u * strength;
  };
  SP.glow = function (strength, color) {
    var c = this.c;
    if (!strength) { c.shadowColor = 'transparent'; c.shadowBlur = 0; c.shadowOffsetY = 0; return; }
    c.shadowColor = rgba(color || this.col.glow, clamp(strength, 0, 1));
    c.shadowBlur = 40 * this.u * (0.4 + strength);
    c.shadowOffsetY = 0;
  };
  // foco: desfoque que some quando o elemento assenta
  var FILTER_OK = null;
  SP.blur = function (px) {
    var c = this.c;
    if (FILTER_OK === null) FILTER_OK = typeof c.filter === 'string';
    if (!FILTER_OK) return;
    c.filter = px > 0.35 ? 'blur(' + px.toFixed(2) + 'px)' : 'none';
  };
  // tremida curta (impacto)
  SP.shake = function (t0, dur, amp) {
    var k = seg(this.t, t0, t0 + dur);
    if (k <= 0 || k >= 1) return { x: 0, y: 0 };
    var d = (1 - k) * (1 - k) * amp * this.u, f = Math.floor(this.t * 60);
    return { x: (hash2(f, 1, 3) - 0.5) * 2 * d, y: (hash2(f, 2, 3) - 0.5) * 2 * d };
  };

  // a chama da marca
  SP.flame = function (x, y, size, color, o) {
    o = o || {};
    var c = this.c;
    c.save();
    c.translate(x, y);
    if (o.rot) c.rotate(o.rot);
    c.scale(size * (o.sx || 1), size * (o.sy || 1));
    c.beginPath();
    flamePath(c, { t: o.t === undefined ? this.t : o.t, flicker: o.flicker || 0, height: o.height });
    c.fillStyle = color;
    c.fill();
    c.restore();
  };

  // brasa (carvão aceso): miolo que respira, rachaduras, halo
  SP.coal = function (x, y, r, o) {
    o = o || {};
    var c = this.c, col = this.col, t = this.t;
    var heat = clamp(o.heat === undefined ? 1 : o.heat, 0, 1);
    var seed = o.seed || 5, rr = rng(seed);
    var breath = 0.78 + 0.22 * Math.sin(t * 1.7 + seed) + 0.06 * Math.sin(t * 5.3 + seed * 2);
    var N = 16, pts = [];
    for (var i = 0; i < N; i++) {
      var a = i / N * Math.PI * 2;
      var rad = r * (0.8 + 0.2 * rr()) * (i % 2 ? 0.96 : 1);
      pts.push([x + Math.cos(a) * rad * 1.12, y + Math.sin(a) * rad * 0.82]);
    }
    function shape() {
      c.beginPath();
      for (var j = 0; j < N; j++) {
        var p = pts[j], q = pts[(j + 1) % N];
        var mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2;
        if (j === 0) c.moveTo(mx, my); else c.quadraticCurveTo(p[0], p[1], mx, my);
      }
      var p0 = pts[0], q0 = pts[1];
      c.quadraticCurveTo(p0[0], p0[1], (p0[0] + q0[0]) / 2, (p0[1] + q0[1]) / 2);
      c.closePath();
    }
    // halo
    if (heat > 0.02) {
      c.save();
      c.globalCompositeOperation = 'lighter';
      var g = c.createRadialGradient(x, y, r * 0.2, x, y, r * 2.6);
      g.addColorStop(0, rgba(col.glow, 0.45 * heat * breath));
      g.addColorStop(1, rgba(col.glow, 0));
      c.fillStyle = g;
      c.fillRect(x - r * 3, y - r * 3, r * 6, r * 6);
      c.restore();
    }
    // corpo
    c.save();
    shape();
    c.fillStyle = mixHex(col.ash, col.crust, clamp(heat * 1.6, 0, 1));
    c.fill();
    c.clip();
    if (heat > 0.02) {
      var gi = c.createRadialGradient(x - r * 0.1, y + r * 0.15, 0, x, y, r * 1.1);
      gi.addColorStop(0, rgba(col.hot, heat * breath));
      gi.addColorStop(0.45, rgba(col.ember, 0.85 * heat * breath));
      gi.addColorStop(1, rgba(col.ember, 0));
      c.globalCompositeOperation = 'lighter';
      c.fillStyle = gi;
      c.fillRect(x - r * 1.3, y - r * 1.3, r * 2.6, r * 2.6);
      c.globalCompositeOperation = 'source-over';
      // crosta: manchas escuras; a luz aparece nas frestas entre elas
      var cr = rng(seed + 9);
      for (var k = 0; k < 9; k++) {
        var px = x + (cr() - 0.5) * r * 1.9, py = y + (cr() - 0.5) * r * 1.3;
        var rx = r * (0.22 + cr() * 0.3), ry = rx * (0.6 + cr() * 0.3);
        var cg = c.createRadialGradient(px, py, 0, px, py, rx);
        cg.addColorStop(0, rgba(col.crust, 0.92 - heat * 0.25));
        cg.addColorStop(0.7, rgba(col.crust, 0.75 - heat * 0.3));
        cg.addColorStop(1, rgba(col.crust, 0));
        c.fillStyle = cg;
        c.beginPath(); c.ellipse(px, py, rx, ry, cr() * 3, 0, Math.PI * 2); c.fill();
      }
      // borda de baixo mais quente
      c.globalCompositeOperation = 'lighter';
      var gb = c.createLinearGradient(x, y + r * 0.9, x, y - r * 0.2);
      gb.addColorStop(0, rgba(col.glow, 0.55 * heat * breath)); gb.addColorStop(1, rgba(col.glow, 0));
      c.fillStyle = gb; c.fillRect(x - r * 1.3, y - r, r * 2.6, r * 2);
      c.globalCompositeOperation = 'source-over';
    }
    // poeira de cinza quando está fria
    var dust = rng(seed + 3);
    c.shadowBlur = 0;
    for (var d = 0; d < 26; d++) {
      c.fillStyle = rgba(d % 3 ? col.ash : col.paper, (1 - heat) * 0.5 + 0.12);
      c.fillRect(x + (dust() - 0.5) * r * 2, y + (dust() - 0.5) * r * 1.6, r * 0.07, r * 0.07);
    }
    c.restore();
  };

  // monte de cinza
  SP.ashPile = function (x, y, w, h, o) {
    o = o || {};
    var c = this.c, col = this.col, seed = o.seed || 4, r = rng(seed);
    var color = o.color || col.ash;
    var bumps = [r(), r(), r(), r()];
    c.save();
    c.beginPath();
    c.moveTo(x - w / 2, y);
    for (var i = 0; i <= 24; i++) {
      var k = i / 24, px = x - w / 2 + w * k;
      var top = Math.sin(k * Math.PI);
      top = Math.pow(top, 0.85) * (1 + 0.08 * Math.sin(k * 17 + bumps[0] * 6) + 0.05 * Math.sin(k * 31 + bumps[1] * 6));
      c.lineTo(px, y - top * h);
    }
    c.closePath();
    c.fillStyle = color;
    c.fill();
    c.clip();
    // brilho escondido (a brasa debaixo da cinza)
    if (o.glow) {
      c.globalCompositeOperation = 'lighter';
      var g = c.createRadialGradient(x, y - h * 0.25, 0, x, y - h * 0.25, w * 0.4);
      g.addColorStop(0, rgba(col.hot, o.glow * 0.9));
      g.addColorStop(0.4, rgba(col.ember, o.glow * 0.6));
      g.addColorStop(1, rgba(col.ember, 0));
      c.fillStyle = g; c.fillRect(x - w, y - h * 2, w * 2, h * 3);
      c.globalCompositeOperation = 'source-over';
    }
    for (var d = 0; d < 70; d++) {
      var dx = x + (r() - 0.5) * w, dy = y - r() * h;
      c.fillStyle = r() < 0.5 ? rgba(col.ink, 0.18) : rgba(col.paper, 0.35);
      var s = (1 + r() * 2.5) * this.u * (w / (120 * this.u));
      c.fillRect(dx, dy, s, s);
    }
    c.restore();
  };

  // faíscas subindo
  SP.sparks = function (o) {
    var c = this.c, u = this.u, t = o.t === undefined ? this.t : o.t, col = this.col;
    var r = rng(o.seed || 11), n = o.count || 30;
    var area = o.area || { x: 0, y: 0, w: this.w, h: this.h };
    var fade = o.alpha === undefined ? 1 : o.alpha;
    if (fade <= 0) return;
    c.save();
    c.globalCompositeOperation = 'lighter';
    for (var i = 0; i < n; i++) {
      var x0 = area.x + r() * area.w, life = 1.6 + r() * 2.6, ph = r();
      var travel = area.h * (0.4 + r() * 0.6), size = (1.2 + r() * 3) * u * (o.scale || 1);
      var sway = (6 + r() * 26) * u, fr = 0.7 + r() * 1.8;
      var q = ((t / life) + ph) % 1;
      var x = x0 + Math.sin(t * fr + ph * 6.28) * sway * q;
      var y = area.y + area.h - q * travel;
      var a = Math.pow(Math.sin(q * Math.PI), 0.7) * (0.55 + 0.45 * Math.sin(t * (9 + i % 5) + i)) * fade;
      if (a <= 0.01) continue;
      var cc = r() < 0.6 ? col.glow : col.hot;
      c.globalAlpha = a * 0.25; c.fillStyle = col.ember;
      c.beginPath(); c.arc(x, y, size * 3, 0, Math.PI * 2); c.fill();
      c.globalAlpha = a; c.fillStyle = cc;
      c.beginPath(); c.arc(x, y, size, 0, Math.PI * 2); c.fill();
    }
    c.restore();
  };

  // flocos de cinza (flutuando, caindo ou sopro)
  SP.ash = function (o) {
    var c = this.c, u = this.u, t = o.t === undefined ? this.t : o.t, col = this.col;
    var r = rng(o.seed || 21), n = o.count || 40;
    var area = o.area || { x: 0, y: 0, w: this.w, h: this.h };
    var fade = o.alpha === undefined ? 1 : o.alpha;
    if (fade <= 0) return;
    var mode = o.mode || 'float', wind = o.wind || 0;
    c.save();
    for (var i = 0; i < n; i++) {
      var x0 = area.x + r() * area.w, y0 = area.y + r() * area.h;
      var size = (2 + r() * 5) * u * (o.scale || 1), ph = r() * 6.28, spin = (r() - 0.5) * 4;
      var life = 3 + r() * 4, q = ((t / life) + r()) % 1;
      var x, y;
      if (mode === 'fall') {
        y = area.y + ((y0 - area.y + t * (18 + r() * 30) * u) % area.h);
        x = x0 + Math.sin(t * 0.9 + ph) * 18 * u + wind * t * u;
      } else if (mode === 'blow') {
        x = x0 + wind * u * (t + r()) + Math.sin(t * 2 + ph) * 10 * u;
        y = y0 - t * (6 + r() * 20) * u + Math.sin(t * 3 + ph) * 8 * u;
      } else {
        x = x0 + Math.sin(t * 0.6 + ph) * 22 * u;
        y = y0 - ((t * (8 + r() * 16) * u) % area.h);
        if (y < area.y) y += area.h;
      }
      var a = (mode === 'float' ? Math.sin(q * Math.PI) : 1) * (0.35 + 0.5 * r()) * fade;
      if (a <= 0.01) continue;
      c.globalAlpha = a;
      c.fillStyle = r() < 0.3 ? col.paper : r() < 0.5 ? mixHex(col.ash, col.ink, 0.4) : col.ash;
      c.save();
      c.translate(x, y); c.rotate(ph + t * spin);
      c.beginPath();
      c.moveTo(-size, -size * 0.4); c.lineTo(size * 0.7, -size * 0.6); c.lineTo(size, size * 0.3); c.lineTo(-size * 0.4, size * 0.7);
      c.closePath(); c.fill();
      c.restore();
    }
    c.restore();
  };

  // granulado (12 fps, como película) e manchas de papel
  SP.grain = function (alpha, dark) {
    if (alpha <= 0) return;
    var key = dark ? 'd' : 'l';
    if (!grainCache[key]) {
      var g = makeCanvas(256, 256), gc = g.getContext('2d');
      var img = gc.createImageData(256, 256), r = rng(dark ? 99 : 42);
      for (var i = 0; i < img.data.length; i += 4) {
        var v = dark ? 255 : 20;
        img.data[i] = v; img.data[i + 1] = v; img.data[i + 2] = v;
        img.data[i + 3] = Math.floor(r() * r() * 255);
      }
      gc.putImageData(img, 0, 0);
      grainCache[key] = g;
    }
    var c = this.c, rr = rng(Math.floor(this.t * 12) + 3);
    c.save();
    c.globalAlpha *= alpha;
    c.fillStyle = c.createPattern(grainCache[key], 'repeat');
    c.translate(-Math.floor(rr() * 256), -Math.floor(rr() * 256));
    c.fillRect(0, 0, this.w + 256, this.h + 256);
    c.restore();
  };
  SP.mottle = function (alpha, color) {
    if (alpha <= 0) return;
    if (!mottleCache.cv) {
      var n = 96, cv = makeCanvas(n, n), cc = cv.getContext('2d'), img = cc.createImageData(n, n);
      for (var y = 0; y < n; y++) for (var x = 0; x < n; x++) {
        var v = fbm(x / 14, y / 14, 77), i = (y * n + x) * 4;
        img.data[i] = img.data[i + 1] = img.data[i + 2] = 0;
        img.data[i + 3] = Math.floor(clamp((v - 0.35) * 2.2, 0, 1) * 255);
      }
      cc.putImageData(img, 0, 0);
      mottleCache.cv = cv;
    }
    var c = this.c, key = color || this.col.ink;
    if (!mottleCache[key]) {
      var tmp = makeCanvas(96, 96), tc = tmp.getContext('2d');
      tc.drawImage(mottleCache.cv, 0, 0);
      tc.globalCompositeOperation = 'source-in';
      tc.fillStyle = key;
      tc.fillRect(0, 0, 96, 96);
      mottleCache[key] = tmp;
    }
    var tmp2 = mottleCache[key];
    c.save();
    c.globalAlpha *= alpha;
    c.imageSmoothingEnabled = true;
    var s = Math.max(this.w, this.h);
    c.drawImage(tmp2, (this.w - s) / 2, (this.h - s) / 2, s, s);
    c.restore();
  };
  // fundo de papel (ou tinta, ou brasa) com textura
  SP.paper = function (color, o) {
    o = o || {};
    var c = this.c, dark = o.dark;
    c.fillStyle = color;
    c.fillRect(0, 0, this.w, this.h);
    this.mottle(o.mottle === undefined ? (dark ? 0.12 : 0.05) : o.mottle, dark ? '#000000' : this.col.ink);
    this.grain(o.grain === undefined ? (dark ? 0.07 : 0.11) : o.grain, dark);
  };

  // texto renderizado num canvas à parte (pra máscaras, partículas, calor)
  SP.textLayer = function (str, kind, size, weight, color, italic) {
    var key = [str, kind, Math.round(size * 10), weight, color, italic ? 1 : 0, this.fonts[kind]].join('|');
    var hit = textCache.get(key);
    if (hit) return hit;
    var c = this.c;
    c.save();
    this.font(kind, size, weight, italic);
    var m = c.measureText(str);
    var asc = m.actualBoundingBoxAscent || size * 0.8, desc = m.actualBoundingBoxDescent || size * 0.25;
    var tw = m.width;
    c.restore();
    var pad = Math.ceil(size * 0.3);
    var cv = makeCanvas(tw + pad * 2, asc + desc + pad * 2), cc = cv.getContext('2d');
    cc.font = (italic ? 'italic ' : '') + (weight || 400) + ' ' + size + 'px ' + this.fonts[kind];
    cc.fillStyle = color; cc.textBaseline = 'alphabetic';
    cc.fillText(str, pad, pad + asc);
    return textCache.set(key, { cv: cv, w: tw, asc: asc, desc: desc, pad: pad, size: size });
  };
  // pontos aleatórios dentro das letras (pra desfazer texto em cinza)
  SP.textPoints = function (layer, count, seed) {
    var key = layer.cv.width + 'x' + layer.cv.height + '|' + count + '|' + seed + '|' + (layer.key || '');
    var hit = pointCache.get(key);
    if (hit && hit.cv === layer.cv) return hit.pts;
    var cc = layer.cv.getContext('2d'), W = layer.cv.width, H = layer.cv.height;
    var data = cc.getImageData(0, 0, W, H).data, r = rng(seed), pts = [];
    for (var g = 0; g < count * 40 && pts.length < count; g++) {
      var x = Math.floor(r() * W), y = Math.floor(r() * H);
      if (data[(y * W + x) * 4 + 3] > 140) pts.push([x, y, r(), r()]);
    }
    pointCache.set(key, { cv: layer.cv, pts: pts });
    return pts;
  };
  // ondulação de calor: desenha o canvas em faixas deslocadas
  SP.shimmer = function (cv, x, y, amp, o) {
    o = o || {};
    var c = this.c, u = this.u, t = this.t;
    if (amp <= 0.05) { c.drawImage(cv, x, y); return; }
    var hs = Math.max(2, Math.round(3 * u)), H = cv.height, W = cv.width;
    for (var yy = 0; yy < H; yy += hs) {
      var k = 1 - yy / H;
      var off = (Math.sin(yy / (14 * u) + t * 11) * 0.7 + Math.sin(yy / (31 * u) - t * 7) * 0.3) * amp * u * (0.4 + 0.6 * k);
      c.drawImage(cv, 0, yy, W, Math.min(hs, H - yy), x + off, y + yy, W, Math.min(hs, H - yy));
    }
  };

  /*
   * Campo orgânico pra máscaras (queima, erosão, varrida com borda viva).
   *  o.rect    área {x,y,w,h} em px (padrão: o quadro todo)
   *  o.res     resolução do campo (0.25 = 1/4)
   *  o.from    [[x,y],...] pontos de origem (0..1 dentro da área) — modo radial
   *  o.dir     [dx,dy] — modo direcional (quando não tem from)
   *  o.noise   quanto o ruído deforma a frente (0..1)
   *  o.P       progresso da frente (0 = nada, ~1.1 = tudo)
   *  o.edge    largura da borda acesa     o.char  faixa chamuscada
   *  o.soft    suavidade da borda do que sobra
   * Retorna canvases pequenos: keep (alpha do que sobra), char e glow.
   * "Sobra" onde o campo é maior que P.
   */
  SP.field = function (o) {
    var res = o.res || 0.25, rect = o.rect || { x: 0, y: 0, w: this.w, h: this.h };
    var mw = Math.max(24, Math.round(rect.w * res)), mh = Math.max(24, Math.round(rect.h * res));
    var key = [mw, mh, JSON.stringify(o.from || null), JSON.stringify(o.dir || null), o.noise, o.seed, o.scale || 1].join('|');
    var F = fieldCache.get(key);
    if (!F) {
      F = { f: new Float32Array(mw * mh), mw: mw, mh: mh };
      var asp = rect.w / rect.h, nz = o.noise === undefined ? 0.35 : o.noise, sc = (o.scale || 1) * 5;
      var maxD = 0, minD = 1e9, i, x, y;
      for (y = 0; y < mh; y++) for (x = 0; x < mw; x++) {
        var px = x / (mw - 1), py = y / (mh - 1), base;
        if (o.from) {
          base = 1e9;
          for (var k = 0; k < o.from.length; k++) {
            var dx = (px - o.from[k][0]) * asp, dy = py - o.from[k][1];
            base = Math.min(base, Math.sqrt(dx * dx + dy * dy));
          }
        } else {
          var d = o.dir || [1, 0];
          base = (px - 0.5) * d[0] * asp + (py - 0.5) * d[1];
        }
        F.f[y * mw + x] = base;
        if (base > maxD) maxD = base;
        if (base < minD) minD = base;
      }
      for (i = 0; i < F.f.length; i++) {
        x = i % mw; y = (i / mw) | 0;
        var b0 = (F.f[i] - minD) / ((maxD - minD) || 1);
        F.f[i] = b0 * (1 - nz) + fbm(x / mw * sc * asp, y / mh * sc, o.seed || 3) * nz;
      }
      fieldCache.set(key, F);
    }
    if (!F.keep) {
      F.keep = makeCanvas(mw, mh); F.char = makeCanvas(mw, mh); F.glow = makeCanvas(mw, mh);
      F.ik = F.keep.getContext('2d').createImageData(mw, mh);
      F.ic = F.char.getContext('2d').createImageData(mw, mh);
      F.ig = F.glow.getContext('2d').createImageData(mw, mh);
    }
    F.rect = rect;
    var P = o.P, edge = o.edge || 0.05, chr = o.char || 0.08, soft = o.soft || 0.012;
    var gc = hexToRgb(o.glowColor || this.col.glow), hc = hexToRgb(this.col.hot), cc = hexToRgb(o.charColor || this.col.crust);
    var K = F.ik.data, C = F.ic.data, G = F.ig.data, f = F.f;
    for (var j = 0; j < f.length; j++) {
      var dd = f[j] - P, o4 = j * 4;
      var keep = dd <= 0 ? 0 : dd >= soft ? 1 : dd / soft;
      K[o4 + 3] = keep * 255;
      var ch = dd > 0 && dd < chr ? 1 - dd / chr : 0;
      C[o4] = cc[0]; C[o4 + 1] = cc[1]; C[o4 + 2] = cc[2]; C[o4 + 3] = ch * ch * 235;
      var g = Math.abs(dd) < edge ? 1 - Math.abs(dd) / edge : 0;
      g = g * g;
      var hot = g * g;
      G[o4] = gc[0] + (hc[0] - gc[0]) * hot; G[o4 + 1] = gc[1] + (hc[1] - gc[1]) * hot; G[o4 + 2] = gc[2] + (hc[2] - gc[2]) * hot;
      G[o4 + 3] = g * 255;
    }
    F.keep.getContext('2d').putImageData(F.ik, 0, 0);
    F.char.getContext('2d').putImageData(F.ic, 0, 0);
    F.glow.getContext('2d').putImageData(F.ig, 0, 0);
    return F;
  };
  // valor do campo num ponto da área (0..1), pra sincronizar partículas com a frente
  SP.fieldAt = function (F, x, y) {
    var r = F.rect, gx = Math.round(clamp((x - r.x) / r.w, 0, 1) * (F.mw - 1)), gy = Math.round(clamp((y - r.y) / r.h, 0, 1) * (F.mh - 1));
    return F.f[gy * F.mw + gx];
  };

  // canvas de trabalho do tamanho pedido (reaproveitado entre frames)
  var scratch = {};
  SP.layer = function (name, w, h) {
    w = Math.max(1, Math.round(w || this.w)); h = Math.max(1, Math.round(h || this.h));
    var k = name + '|' + w + 'x' + h;
    var cv = scratch[k] || (scratch[k] = makeCanvas(w, h));
    var c = cv.getContext('2d');
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
    if (typeof c.filter === 'string') c.filter = 'none';
    c.clearRect(0, 0, w, h);
    return cv;
  };
  // mantém (ou, com invert, apaga) o conteúdo do canvas conforme o campo
  // atRect: o canvas é do tamanho do quadro e o campo vale só na área F.rect
  SP.applyKeep = function (cv, F, invert, atRect) {
    var c = cv.getContext('2d'), r = atRect ? F.rect : { x: 0, y: 0, w: cv.width, h: cv.height };
    c.save();
    c.imageSmoothingEnabled = true;
    c.globalCompositeOperation = invert ? 'destination-out' : 'destination-in';
    c.drawImage(F.keep, r.x, r.y, r.w, r.h);
    c.restore();
  };
  SP.applyChar = function (cv, F, alpha, atRect) {
    var c = cv.getContext('2d'), r = atRect ? F.rect : { x: 0, y: 0, w: cv.width, h: cv.height };
    c.save();
    c.globalAlpha = alpha === undefined ? 1 : alpha;
    c.globalCompositeOperation = 'source-atop';
    c.drawImage(F.char, r.x, r.y, r.w, r.h);
    c.restore();
  };
  // desenha algo num canvas de trabalho usando os mesmos métodos do palco
  SP.into = function (cv, fn) {
    var saved = this.c;
    this.c = cv.getContext('2d');
    try { fn(this.c); } finally { this.c = saved; }
  };
  SP.drawGlow = function (F, alpha, ctx) {
    var c = ctx || this.c, r = F.rect;
    c.save();
    c.globalCompositeOperation = 'lighter';
    c.globalAlpha *= alpha === undefined ? 1 : alpha;
    c.drawImage(F.glow, r.x, r.y, r.w, r.h);
    c.restore();
  };
  // conteúdo queimando: o que sobra + chamuscado + borda acesa
  SP.burnDraw = function (content, F, o) {
    o = o || {};
    var r = F.rect;
    var tmp = this.layer('burn', content.width, content.height);
    tmp.getContext('2d').drawImage(content, 0, 0);
    this.applyKeep(tmp, F);
    if (o.char !== false) this.applyChar(tmp, F);
    this.c.drawImage(tmp, r.x, r.y, r.w, r.h);
    if (o.glow !== false) this.drawGlow(F, o.glowAlpha);
  };

  // traço de pincel/caneta (anotações à mão)
  SP.brush = function (pts, o) {
    o = o || {};
    var c = this.c, u = this.u, n = pts.length;
    if (n < 2) return;
    var prog = clamp(o.progress === undefined ? 1 : o.progress, 0, 1);
    var lens = [0], total = 0;
    for (var i = 1; i < n; i++) { total += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); lens.push(total); }
    var end = total * prog, width = (o.width || 10) * u, r = rng(o.seed || 9);
    c.save();
    c.lineCap = 'round'; c.lineJoin = 'round';
    c.strokeStyle = o.color || this.col.ember;
    for (var pass = 0; pass < 3; pass++) {
      var off = pass === 0 ? 0 : (pass === 1 ? 0.22 : -0.25) * width;
      c.globalAlpha = (pass === 0 ? 1 : 0.55) * (o.alpha === undefined ? 1 : o.alpha);
      for (var k = 1; k < n && lens[k - 1] < end; k++) {
        var a = pts[k - 1], b = pts[k];
        var s = lens[k] / total;
        var taper = Math.min(1, s * 6, (1 - s) * 5 + 0.25);
        var lw = width * (0.55 + 0.45 * taper) * (0.88 + 0.12 * Math.sin(k * 0.7 + (o.seed || 0))) * (pass ? 0.35 : 1);
        var bx = b[0], by = b[1];
        if (lens[k] > end) { var kk = (end - lens[k - 1]) / (lens[k] - lens[k - 1]); bx = lerp(a[0], b[0], kk); by = lerp(a[1], b[1], kk); }
        var nx = -(by - a[1]), ny = bx - a[0], nl = Math.hypot(nx, ny) || 1;
        c.lineWidth = lw;
        c.beginPath();
        c.moveTo(a[0] + nx / nl * off, a[1] + ny / nl * off);
        c.lineTo(bx + nx / nl * off, by + ny / nl * off);
        c.stroke();
      }
    }
    void r;
    c.restore();
  };

  // ------------------------------------------------------------------
  // Registro de templates
  // ------------------------------------------------------------------
  TC.templates = {};
  TC.order = [];
  TC.categories = [
    { id: 'acender', name: 'Acender', hint: 'abrir, fechar e dar fundo' },
    { id: 'marcar', name: 'Marcar', hint: 'o que tem que ficar no outro' },
    { id: 'virar', name: 'Virar', hint: 'mudar a percepção' },
    { id: 'guiar', name: 'Guiar', hint: 'mostrar onde a pessoa está' },
    { id: 'apontar', name: 'Apontar', hint: 'quem fala, o que olhar' },
    { id: 'passagem', name: 'Passagens', hint: 'esconder o corte' }
  ];
  var MOTION_PARAMS = [
    { key: 'entrada', label: 'Curva de entrada', type: 'curve', group: 'movimento', default: TC.curvePresets.suave.v },
    { key: 'saida', label: 'Curva de saída', type: 'curve', group: 'movimento', default: TC.curvePresets.apagar.v }
  ];

  TC.register = function (def) {
    def.duration = def.duration || 4;
    def.minDur = def.minDur || Math.min(def.duration, 2);
    var motion = def.noCurves ? [] : MOTION_PARAMS.map(function (p) {
      var q = {}; for (var k in p) q[k] = p[k];
      if (def.curves && def.curves[p.key]) q.default = def.curves[p.key];
      return q;
    });
    def.params = (def.params || []).concat(motion);
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

  TC.defaults = function (id, brand) {
    var tpl = TC.templates[id], out = {};
    brand = brand || TC.brands[TC.defaultBrand];
    for (var i = 0; i < tpl.params.length; i++) {
      var p = tpl.params[i], v = p.default;
      if (p.fromBrand && brand.sign && brand.sign[p.fromBrand] !== undefined) v = brand.sign[p.fromBrand];
      out[p.key] = v && v.slice ? v.slice() : v;
    }
    return out;
  };

  /*
   * Desenha um frame (sem pós-processamento; o fx.js cuida disso).
   *  o.w,o.h  tamanho em px   o.t tempo   o.dur duração
   *  o.params valores dos campos   o.brand id ou objeto da marca
   *  o.preview true = fundo de vídeo fictício atrás dos overlays
   */
  TC.renderFrame = function (ctx, id, o) {
    var tpl = TC.templates[id];
    if (!tpl) throw new Error('Template não encontrado: ' + id);
    var brand = typeof o.brand === 'object' ? o.brand : (TC.brands[o.brand] || TC.brands[TC.defaultBrand]);
    var params = TC.defaults(id, brand);
    if (o.params) for (var k in o.params) if (o.params[k] !== undefined && o.params[k] !== null && k in params) params[k] = o.params[k];
    var dur = Math.max(tpl.minDur, o.dur || tpl.duration);
    var t = clamp(o.t, 0, dur);
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    if (typeof ctx.filter === 'string') ctx.filter = 'none';
    ctx.clearRect(0, 0, o.w, o.h);
    if (o.preview && o.backdrop !== false) TC.drawBackdrop(ctx, o.w, o.h, o.backdrop || 'video', t);
    var S = new Stage(ctx, o.w, o.h, { t: t, dur: dur, params: params, brand: brand, seed: hashStr(id) });
    tpl.draw(S, t);
    ctx.restore();
  };

  TC.drawBackdrop = function (ctx, w, h, kind, t) {
    if (kind === 'checker') {
      var sz = Math.max(8, Math.round(Math.min(w, h) / 40));
      for (var y = 0; y < h; y += sz) for (var x = 0; x < w; x += sz) {
        ctx.fillStyle = ((x / sz + y / sz) % 2) ? '#cfcac2' : '#efebe4';
        ctx.fillRect(x, y, sz, sz);
      }
      return;
    }
    var g = ctx.createLinearGradient(0, 0, w * 0.3, h);
    g.addColorStop(0, '#39342f'); g.addColorStop(0.55, '#4b4038'); g.addColorStop(1, '#1f1c1a');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    var u = Math.min(w, h) / 1080;
    var cx = w * 0.5 + Math.sin(t * 0.8) * 6 * u, cy = h * (h > w ? 0.42 : 0.5);
    var r1 = ctx.createRadialGradient(cx, cy - 120 * u, 10 * u, cx, cy - 120 * u, 260 * u);
    r1.addColorStop(0, 'rgba(214,170,140,0.5)'); r1.addColorStop(1, 'rgba(214,170,140,0)');
    ctx.fillStyle = r1; ctx.fillRect(0, 0, w, h);
    var r2 = ctx.createRadialGradient(cx, cy + 420 * u, 40 * u, cx, cy + 420 * u, 520 * u);
    r2.addColorStop(0, 'rgba(90,96,104,0.55)'); r2.addColorStop(1, 'rgba(90,96,104,0)');
    ctx.fillStyle = r2; ctx.fillRect(0, 0, w, h);
  };

  TC.formats = {
    '9:16': { w: 1080, h: 1920, label: 'Vertical 9:16 (Reels, TikTok, Shorts)' },
    '16:9': { w: 1920, h: 1080, label: 'Horizontal 16:9 (YouTube)' },
    '1:1': { w: 1080, h: 1080, label: 'Quadrado 1:1' },
    '4:5': { w: 1080, h: 1350, label: 'Retrato 4:5 (feed)' }
  };

  TC.loadFonts = function (brand) {
    if (typeof document === 'undefined' || !document.fonts) return Promise.resolve();
    brand = brand || TC.brands[TC.defaultBrand];
    var f = brand.fonts;
    var specs = ['400 40px ' + f.display, '400 40px ' + f.sans, '500 40px ' + f.sans, '600 40px ' + f.sans,
      '700 40px ' + f.sans, '800 40px ' + f.sans, 'italic 500 40px ' + f.sans, 'italic 700 40px ' + f.sans];
    return Promise.all(specs.map(function (s) {
      return document.fonts.load(s, 'aãçéíóú AÇÃ').catch(function () { return null; });
    })).then(function () { return document.fonts.ready; }).then(function () { clearTextCache(); });
  };

  TC.Stage = Stage;
})(typeof window !== 'undefined' ? window : this);
