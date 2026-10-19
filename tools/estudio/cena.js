/* Motor de cena 3D: planos com perspectiva, câmera animada, foco (profundidade de campo), obturador (desfoque de movimento por acúmulo de subquadros). */
(function () {
  'use strict';
  var C = { ink: '#1A1714', paper: '#EFE9DF', ember: '#C8502A', glow: '#E06A3E', hot: '#F2A27C', ash: '#9B968E', crust: '#2E2420' };
  var cv = document.getElementById('cv'), gl, W, H, prog, quad, spec, cache = {}, texPool = [], fbo = {};

  // ---------- matemática
  function mul(a, b) { var o = new Float32Array(16); for (var i = 0; i < 4; i++) for (var j = 0; j < 4; j++) { var s = 0; for (var k = 0; k < 4; k++) s += a[k * 4 + j] * b[i * 4 + k]; o[i * 4 + j] = s; } return o; }
  function ident() { return new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]); }
  function tr(x, y, z) { var m = ident(); m[12] = x; m[13] = y; m[14] = z; return m; }
  function sc(x, y, z) { var m = ident(); m[0] = x; m[5] = y; m[10] = z; return m; }
  function rx(a) { var m = ident(), c = Math.cos(a), s = Math.sin(a); m[5] = c; m[6] = s; m[9] = -s; m[10] = c; return m; }
  function ry(a) { var m = ident(), c = Math.cos(a), s = Math.sin(a); m[0] = c; m[2] = -s; m[8] = s; m[10] = c; return m; }
  function rz(a) { var m = ident(), c = Math.cos(a), s = Math.sin(a); m[0] = c; m[1] = s; m[4] = -s; m[5] = c; return m; }
  function persp(fov, asp, n, f) { var t = 1 / Math.tan(fov / 2), m = new Float32Array(16); m[0] = t / asp; m[5] = t; m[10] = (f + n) / (n - f); m[11] = -1; m[14] = 2 * f * n / (n - f); return m; }
  var D2R = Math.PI / 180;

  // ---------- easing e keyframes: valor fixo ou [[t,v,ease],...]
  var EASE = {
    lin: function (x) { return x; }, in: function (x) { return x * x * x; }, out: function (x) { return 1 - Math.pow(1 - x, 3); },
    io: function (x) { return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; },
    back: function (x) { var c = 1.70158; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); },
    expo: function (x) { return x >= 1 ? 1 : 1 - Math.pow(2, -10 * x); }
  };
  function val(v, t, d) {
    if (v === undefined) return d;
    if (typeof v === 'number') return v;
    var i = 0; if (t <= v[0][0]) return v[0][1];
    for (; i < v.length - 1; i++) if (t < v[i + 1][0]) { var a = v[i], b = v[i + 1], p = (t - a[0]) / (b[0] - a[0]); return a[1] + (b[1] - a[1]) * (EASE[b[2] || 'io'](p)); }
    return v[v.length - 1][1];
  }
  function cl(x, a, b) { return Math.max(a, Math.min(b, x)); }
  var seed = 11; function rnd() { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }

  // ---------- textura a partir de canvas 2D
  function mkTex(canvas) {
    var t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return t;
  }
  function c2d(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  var PAD = 40;

  function wordTex(text, size, color, font) {
    var key = 'w|' + text + '|' + size + '|' + color + '|' + font;
    if (cache[key]) return cache[key];
    var m = c2d(8, 8).getContext('2d'); m.font = size + 'px ' + font;
    var w = Math.ceil(m.measureText(text).width), h = Math.ceil(size * 1.25);
    var c = c2d(w + PAD * 2, h + PAD * 2), x = c.getContext('2d');
    x.font = size + 'px ' + font; x.textBaseline = 'middle'; x.textAlign = 'center';
    x.shadowColor = 'rgba(0,0,0,.35)'; x.shadowBlur = size * .06; x.shadowOffsetY = size * .03;
    x.fillStyle = color; x.fillText(text, c.width / 2, c.height / 2 + size * .04);
    return (cache[key] = { tex: mkTex(c), w: c.width, h: c.height, tw: w });
  }

  // ---------- adereços (estilo chapado, paleta da marca). draw(ctx, S, t, hi) em tela S x S
  var P = {};
  function rr(x, a, b, w, h, r, f) { x.beginPath(); x.roundRect(a, b, w, h, r); x.fillStyle = f; x.fill(); }
  function circ(x, a, b, r, f) { x.beginPath(); x.arc(a, b, r, 0, 7); x.fillStyle = f; x.fill(); }
  function pop(t, i, d) { return EASE.back(cl((t - i * (d || .07)) / .35, 0, 1)); }
  function pessoa(x, a, b, s, f) { circ(x, a, b - s * 1.25, s * .42, f); x.beginPath(); x.roundRect(a - s * .55, b - s * .7, s * 1.1, s * 1.5, s * .45); x.fillStyle = f; x.fill(); }
  P.agenda = function (x, S, t, hi) { rr(x, S * .1, S * .12, S * .8, S * .76, 26, C.paper); rr(x, S * .1, S * .12, S * .8, S * .13, 26, C.ember);
    for (var r = 0; r < 5; r++) for (var c = 0; c < 4; c++) { var i = r * 4 + c, on = [0, 3, 9, 14].indexOf(i) >= 0, p = pop(t, i, .05); x.save(); x.translate(S * (.19 + c * .19), S * (.34 + r * .106)); x.scale(p, p); rr(x, -S * .07, -S * .035, S * .14, S * .07, 10, on ? C.ember : '#d6cfc3'); x.restore(); } };
  P.diplomas = function (x, S, t, hi) { for (var i = 0; i < 6; i++) { var p = pop(t, i, .12); x.save(); x.translate(S * .5, S * (.78 - i * .1)); x.rotate((i % 2 ? 1 : -1) * .035); x.scale(p, p); rr(x, -S * .34, -S * .045, S * .68, S * .09, 8, i % 2 ? C.paper : '#e2d9cb'); circ(x, S * .22, 0, S * .028, C.ember); x.restore(); } };
  P.pedra = function (x, S, t, hi) { x.beginPath(); x.moveTo(0, S * .85); x.lineTo(S * .85, S * .25); x.lineTo(S, S * .25); x.lineTo(S, S); x.lineTo(0, S); x.closePath(); x.fillStyle = C.crust; x.fill();
    var u = (t * .35) % 1, e = u < .8 ? EASE.io(u / .8) : 1 - EASE.in((u - .8) / .2), px = S * (.08 + e * .66), py = S * (.8 - e * .56); circ(x, px, py - S * .1, S * .1, hi ? C.ember : C.ash); };
  P.multidao = function (x, S, t, hi) { for (var r = 0; r < 4; r++) for (var c = 0; c < 5; c++) { var i = r * 5 + c, p = pop(t, i, .03), sp = (r === 1 && c === 2); pessoa(x, S * (.12 + c * .19), S * (.3 + r * .2) + (sp ? -8 : 0), S * .06 * p * (sp ? 1.15 : 1), sp ? C.ember : C.ash); } };
  P.contrato = function (x, S, t, hi) { rr(x, S * .2, S * .06, S * .6, S * .88, 12, C.paper);
    for (var i = 0; i < 9; i++) { var on = i === 5, p = EASE.out(cl((t - i * .08) / .3, 0, 1)); rr(x, S * .28, S * (.16 + i * .08), S * .44 * p * (i % 3 === 2 ? .7 : 1), S * .028, 6, on ? C.ember : '#c9c1b4'); }
    circ(x, S * .68, S * .86, S * .05, C.ember); };
  P.etiqueta = function (x, S, t, hi) { x.save(); x.translate(S * .5, S * .5); x.rotate(-.25 + Math.sin(t * 2) * .03); x.beginPath(); x.moveTo(-S * .32, -S * .16); x.lineTo(S * .18, -S * .16); x.lineTo(S * .38, 0); x.lineTo(S * .18, S * .16); x.lineTo(-S * .32, S * .16); x.closePath(); x.fillStyle = C.paper; x.fill(); circ(x, -S * .22, 0, S * .035, C.ink); x.fillStyle = hi ? C.ember : C.ink; x.font = (S * .15) + 'px "TC Display"'; x.textBaseline = 'middle'; x.fillText('R$', -S * .12, 0); x.restore(); };
  P.fila = function (x, S, t, hi) { rr(x, S * .72, S * .22, S * .2, S * .56, 12, C.ember); for (var i = 0; i < 6; i++) { var m = EASE.out(cl((t - i * .1) / .5, 0, 1)); pessoa(x, S * (.64 - i * .11) - (1 - m) * S * .5, S * .7, S * .045, i === 0 ? C.paper : C.ash); } };
  P.prato = function (x, S, t, hi) { circ(x, S * .5, S * .5, S * .4, C.paper); circ(x, S * .5, S * .5, S * .3, '#e2d9cb'); for (var i = 0; i < 26; i++) { var a = i * 2.4, r = S * .22 * Math.sqrt(i / 26), p = pop(t, i, .025); x.save(); x.translate(S * .5 + Math.cos(a) * r, S * .5 + Math.sin(a) * r); x.rotate(a); x.scale(p, p); rr(x, -S * .03, -S * .012, S * .06, S * .024, 6, '#fff'); x.restore(); } };
  P.lupa = function (x, S, t, hi) { var m = Math.sin(t * 1.5) * S * .05; x.lineWidth = S * .05; x.strokeStyle = C.paper; x.beginPath(); x.arc(S * .45 + m, S * .42, S * .27, 0, 7); x.stroke(); x.lineCap = 'round'; x.beginPath(); x.moveTo(S * .64 + m, S * .61); x.lineTo(S * .86, S * .84); x.stroke(); circ(x, S * .45 + m, S * .42, S * .24, 'rgba(200,80,42,.18)'); };
  P.chama = function (x, S, t, hi) { var f = 1 + Math.sin(t * 9) * .04, g = x.createRadialGradient(S / 2, S * .6, 0, S / 2, S * .6, S * .5); g.addColorStop(0, 'rgba(224,106,62,.45)'); g.addColorStop(1, 'rgba(224,106,62,0)'); x.fillStyle = g; x.fillRect(0, 0, S, S);
    x.save(); x.translate(S / 2, S * .85); x.scale(f, f + Math.sin(t * 13) * .05); x.beginPath(); x.moveTo(0, 0); x.bezierCurveTo(-S * .3, -S * .1, -S * .22, -S * .45, -S * .02, -S * .72); x.bezierCurveTo(0, -S * .5, S * .1, -S * .45, S * .14, -S * .3); x.bezierCurveTo(S * .3, -S * .45, S * .3, -S * .1, 0, 0); x.fillStyle = C.glow; x.fill(); x.beginPath(); x.moveTo(0, -S * .04); x.bezierCurveTo(-S * .12, -S * .1, -S * .1, -S * .3, 0, -S * .42); x.bezierCurveTo(S * .1, -S * .3, S * .1, -S * .1, 0, -S * .04); x.fillStyle = C.hot; x.fill(); x.restore(); };
  P.camiseta = function (x, S, t, hi) { x.save(); x.translate(S * .5, S * .5); x.beginPath(); x.moveTo(-S * .2, -S * .36); x.lineTo(-S * .42, -S * .2); x.lineTo(-S * .32, -S * .02); x.lineTo(-S * .2, -S * .08); x.lineTo(-S * .2, S * .38); x.lineTo(S * .2, S * .38); x.lineTo(S * .2, -S * .08); x.lineTo(S * .32, -S * .02); x.lineTo(S * .42, -S * .2); x.lineTo(S * .2, -S * .36); x.quadraticCurveTo(0, -S * .26, -S * .2, -S * .36); x.closePath(); x.clip(); x.fillStyle = C.paper; x.fillRect(-S, -S, S * 2, S * 2); for (var i = -6; i < 6; i += 2) { x.fillStyle = C.ink; x.fillRect(i * S * .07 + Math.sin(t) * 4, -S, S * .07, S * 2); } x.restore(); };
  P.regua = function (x, S, t, hi) { rr(x, S * .04, S * .4, S * .92, S * .2, 10, C.paper); for (var i = 0; i < 24; i++) { var p = pop(t, i, .02); rr(x, S * (.08 + i * .037), S * .4, S * .008, S * (i % 4 ? .06 : .1) * p, 2, C.ink); } };
  P.porta = function (x, S, t, hi) { rr(x, S * .28, S * .1, S * .44, S * .8, 14, C.crust); var o = EASE.io(cl(t / 1.2, 0, 1)); x.fillStyle = 'rgba(242,162,124,' + (.25 + o * .6) + ')'; x.fillRect(S * .31, S * .13, S * .38 * (.1 + o * .9), S * .74); };
  P.olho = function (x, S, t, hi) { x.save(); x.translate(S / 2, S / 2); x.beginPath(); x.moveTo(-S * .42, 0); x.quadraticCurveTo(0, -S * .38, S * .42, 0); x.quadraticCurveTo(0, S * .38, -S * .42, 0); x.fillStyle = C.paper; x.fill(); var m = Math.sin(t * 1.3) * S * .07; circ(x, m, 0, S * .15, hi ? C.ember : C.ink); circ(x, m + S * .04, -S * .04, S * .04, C.paper); x.restore(); };

  function propTex(name, S, t, hi) {
    var key = 'p|' + name + '|' + S, e = cache[key];
    if (!e) { var c = c2d(S + PAD * 2, S + PAD * 2); e = cache[key] = { c: c, x: c.getContext('2d'), tex: null, w: c.width, h: c.height }; }
    e.x.setTransform(1, 0, 0, 1, 0, 0); e.x.clearRect(0, 0, e.w, e.h); e.x.translate(PAD, PAD); P[name](e.x, S, t, hi);
    if (!e.tex) e.tex = mkTex(e.c); else { gl.bindTexture(gl.TEXTURE_2D, e.tex); gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, e.c); }
    return e;
  }
  function flatTex(key, w, h, fn) { if (cache[key]) return cache[key]; var c = c2d(w, h); fn(c.getContext('2d'), w, h); return (cache[key] = { tex: mkTex(c), w: w, h: h }); }
  function texGlow() { return flatTex('glow', 128, 128, function (x, w, h) { var g = x.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.45, 'rgba(255,255,255,.55)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, w, h); }); }
  function texSolid() { return flatTex('solid', 4, 4, function (x) { x.fillStyle = '#fff'; x.fillRect(0, 0, 4, 4); }); }
  function texGrid() { return flatTex('grid', 1024, 1024, function (x, w, h) { x.strokeStyle = 'rgba(200,80,42,.55)'; x.lineWidth = 3; for (var i = 0; i <= 16; i++) { x.beginPath(); x.moveTo(i * 64, 0); x.lineTo(i * 64, h); x.stroke(); x.beginPath(); x.moveTo(0, i * 64); x.lineTo(w, i * 64); x.stroke(); } }); }
  function texPaper(dark) { return flatTex('bg' + dark, 512, 512, function (x, w, h) { x.fillStyle = dark ? C.ink : C.paper; x.fillRect(0, 0, w, h); var q = 3; function r2() { q = (q * 1664525 + 1013904223) >>> 0; return q / 4294967296; } for (var i = 0; i < 2600; i++) { x.fillStyle = 'rgba(' + (dark ? '255,255,255' : '60,40,20') + ',' + (r2() * .035) + ')'; x.fillRect(r2() * w, r2() * h, 1 + r2() * 2, 1 + r2() * 2); } }); }

  // ---------- GL
  var VS = 'attribute vec2 aP;uniform mat4 uM;varying vec2 vU;void main(){vU=aP+.5;vU.y=1.-vU.y;gl_Position=uM*vec4(aP,0.,1.);}';
  var FS = 'precision mediump float;varying vec2 vU;uniform sampler2D uT;uniform float uO;uniform vec2 uR;uniform vec4 uC;' +
    'void main(){vec4 a=vec4(0.);if(uR.x<.0004){a=texture2D(uT,vU);}else{float n=fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5453)*6.2832;for(int i=0;i<18;i++){float f=float(i)+.5;float r=sqrt(f/18.);float th=f*2.39996+n;a+=texture2D(uT,vU+vec2(cos(th),sin(th))*r*uR);}a/=18.;}gl_FragColor=a*uC*uO;}';
  function sh(t, s) { var o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(o)); return o; }
  function mkFbo() { var t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, W, H, 0, gl.RGBA, gl.UNSIGNED_BYTE, null); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); var f = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, f); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0); return { f: f, t: t }; }

  window.cenaInit = function (w, h) {
    W = w; H = h; cv.width = w; cv.height = h; cache = {};
    gl = cv.getContext('webgl', { alpha: false, antialias: false, preserveDrawingBuffer: true });
    prog = gl.createProgram(); gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(prog); gl.useProgram(prog);
    quad = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, quad); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-.5, -.5, .5, -.5, -.5, .5, .5, .5]), gl.STATIC_DRAW);
    var a = gl.getAttribLocation(prog, 'aP'); gl.enableVertexAttribArray(a); gl.vertexAttribPointer(a, 2, gl.FLOAT, false, 0, 0);
    fbo.scene = mkFbo(); fbo.acc = mkFbo(); gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    return document.fonts.load('100px "TC Display"').then(function () { return document.fonts.load('100px "TC Sans"'); });
  };
  window.cenaLoad = function (s) { spec = s; seed = 11; };

  function draw(tex, M, op, rad, color) {
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.uniformMatrix4fv(gl.getUniformLocation(prog, 'uM'), false, M);
    gl.uniform1f(gl.getUniformLocation(prog, 'uO'), op);
    gl.uniform2f(gl.getUniformLocation(prog, 'uR'), rad[0], rad[1]);
    var c = color || [1, 1, 1, 1]; gl.uniform4f(gl.getUniformLocation(prog, 'uC'), c[0], c[1], c[2], c[3]);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }
  function hex(h) { var n = parseInt(h.slice(1), 16); return [(n >> 16) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255, 1]; }

  // câmera de um plano num instante
  function camAt(shot, tl) {
    var k = shot.cam || {};
    return { pos: [val(k.x, tl, 0), val(k.y, tl, 0), val(k.z, tl, 0)], rot: [val(k.rx, tl, 0), val(k.ry, tl, 0), val(k.rz, tl, 0)], fov: val(k.fov, tl, 40), focus: val(k.focus, tl, 2600), ap: val(k.ap, tl, 0.5) };
  }
  function viewProj(cam) {
    var fov = cam.fov * D2R, base = 960 / Math.tan(fov / 2);
    var V = mul(mul(mul(rz(-cam.rot[2] * D2R), rx(-cam.rot[0] * D2R)), ry(-cam.rot[1] * D2R)), tr(-cam.pos[0], -cam.pos[1], -(base + cam.pos[2])));
    return { VP: mul(persp(fov, W / H, 50, 12000), V), base: base, focalPx: (H / 2) / Math.tan(fov / 2) };
  }

  function drawPlane(P0, G, vp, cam, tex, w, h, x, y, z, rxv, ryv, rzv, s, op, color) {
    var M = mul(G, mul(tr(x, y, z), mul(rz(rzv * D2R), mul(ry(ryv * D2R), mul(rx(rxv * D2R), sc(w * s, h * s, 1))))));
    // distância ao plano da câmera (profundidade), pro desfoque de foco
    var wx = M[12], wy = M[13], wz = M[14];
    var dx = wx - cam.pos[0], dy = wy - cam.pos[1], dz = wz - (vp.base + cam.pos[2]);
    var dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
    var coc = Math.min(H * .022, cam.ap * Math.abs(dist - cam.focus) / Math.max(dist, 1) * H * .06);
    var sizePx = Math.max(8, Math.abs(w * s) * vp.focalPx / Math.max(dist, 1));
    var rad = coc < 0.6 ? [0, 0] : [coc / sizePx, coc / (sizePx * h / w)];
    draw(tex, mul(vp.VP, M), op, rad, color);
  }

  function renderShot(shot, t, G) {
    var tl = t - shot.t0, cam = camAt(shot, tl), vp = viewProj(cam);
    var fade = shot.op === undefined ? 1 : val(shot.op, tl, 1);
    if (shot.bg) { var e = texPaper(shot.bg === 'tinta' ? 1 : 0); drawPlane(0, G, vp, cam, e.tex, 1, 1, 0, 0, -1800, 0, 0, 0, 14000, fade, [1, 1, 1, 1]); }
    (shot.planes || []).forEach(function (p) {
      var op = val(p.op, tl, 1) * fade; if (op <= 0.001) return;
      var gx = val(p.x, tl, 0), gy = val(p.y, tl, 0), gz = val(p.z, tl, 0), grx = val(p.rx, tl, 0), gry = val(p.ry, tl, 0), grz = val(p.rz, tl, 0), gs = val(p.s, tl, 1);
      if (p.k === 'bloco') {
        if (!p.words) {
          p.words = []; var lh = p.size * 1.08, gap = p.size * .24;
          if (p.flat) { p.lines = []; var cur = [], cw = 0; p.flat.forEach(function (w) { var tw = wordTex(w.t, p.size, w.hi ? C.ember : (p.color || C.paper), '"TC Display"').tw; if (cur.length && cw + tw + gap > p.maxw) { p.lines.push(cur); cur = []; cw = 0; } cur.push(w); cw += tw + gap; }); if (cur.length) p.lines.push(cur); }
          var n = p.lines.length;
          p.lines.forEach(function (ln, li) {
            var ws = ln.map(function (w) { return wordTex(w.t, p.size, w.hi ? C.ember : (p.color || C.paper), '"TC Display"'); });
            var tot = ws.reduce(function (a, w) { return a + w.tw; }, 0) + gap * (ln.length - 1), x0 = -tot / 2;
            ln.forEach(function (w, wi) { p.words.push({ t: w.t, hi: w.hi, x: x0 + ws[wi].tw / 2, y: ((n - 1) / 2 - li) * lh, z: w.hi ? 90 : 0 }); x0 += ws[wi].tw + gap; });
          });
        }
        var Gb = mul(G, mul(tr(gx, gy, gz), mul(rz(grz * D2R), mul(ry(gry * D2R), mul(rx(grx * D2R), sc(gs, gs, 1))))));
        p.words.forEach(function (w, i) {
          var st = (p.t0 || 0) + i * (p.stagger === undefined ? .09 : p.stagger), q = cl((tl - st) / (p.dw || .4), 0, 1), e = EASE.out(q), bk = EASE.back(q), a = p.anim || 'flip';
          if (q <= 0) return;
          var ox = 0, oy = 0, oz = 0, orx = 0, ory = 0, os = 1;
          if (a === 'flip') { orx = (1 - e) * -75; oz = (1 - e) * 380; oy = (1 - e) * -40; }
          else if (a === 'rise') { oy = (1 - e) * -120; }
          else if (a === 'zoom') { os = 1 + (1 - bk) * 1.8; oz = (1 - e) * 200; }
          else if (a === 'slide') { ox = (1 - e) * (i % 2 ? 700 : -700); ory = (1 - e) * 40; }
          else if (a === 'tilt') { ory = (1 - e) * 70; oz = (1 - e) * 250; ox = (1 - e) * 200; }
          var wt = wordTex(w.t, p.size, w.hi ? C.ember : (p.color || C.paper), w.hi ? '"TC Display"' : (p.font || '"TC Display"'));
          drawPlane(0, Gb, vp, cam, wt.tex, wt.w, wt.h, w.x + ox, w.y + oy, w.z + oz, orx, ory, 0, os * (w.hi ? 1 + .04 * Math.sin(tl * 5) : 1), op * e, null);
        });
      } else if (p.k === 'prop') {
        var S = p.S || 700, e = propTex(p.n, S, tl - (p.t0 || 0), !!p.hi);
        drawPlane(0, G, vp, cam, e.tex, e.w, e.h, gx, gy, gz, grx, gry, grz, gs, op, null);
      } else if (p.k === 'chao') {
        var g = texGrid(); drawPlane(0, G, vp, cam, g.tex, 9000, 9000, gx, gy, gz, p.rx === undefined ? 90 : grx, gry, grz, gs, op, null);
      } else if (p.k === 'forma') {
        var sl = texSolid(); drawPlane(0, G, vp, cam, sl.tex, p.w, p.h, gx, gy, gz, grx, gry, grz, gs, op, hex(p.c || C.ember));
      } else if (p.k === 'brilho') {
        var gt = texGlow(); drawPlane(0, G, vp, cam, gt.tex, p.w || 900, p.w || 900, gx, gy, gz, 0, 0, 0, gs, op, hex(p.c || C.glow));
      }
    });
    // poeira e brasas em profundidade: dão paralaxe e círculos de desfoque
    if (shot.particulas !== false) {
      var gt2 = texGlow(), n = shot.particulas || 46, sdm = seed; seed = 5 + (shot.i || 0) * 13;
      for (var i = 0; i < n; i++) {
        var px = (rnd() - .5) * 2600, py0 = (rnd() - .5) * 4200, pz = -900 + rnd() * 1900, spd = 25 + rnd() * 90, sz = 14 + rnd() * 46, ember = rnd() < .4, ph = rnd() * 6;
        var py = ((py0 + tl * spd + 2100) % 4200) - 2100, pxx = px + Math.sin(tl * .6 + ph) * 40;
        drawPlane(0, G, vp, cam, gt2.tex, 1, 1, pxx, py, pz, 0, 0, 0, sz * 4, (ember ? .55 : .22) * fade, hex(ember ? C.glow : C.ash));
      }
      seed = sdm;
    }
  }

  // um quadro final: N subquadros no tempo (obturador) acumulados
  window.cenaFrame = function (t, nsub) {
    var auto = !nsub;
    var shots = spec.shots.filter(function (s) { return t >= s.t0 && t < s.t0 + s.dur; });
    var shutter = 0.5; shots.forEach(function (s) { shutter = Math.max(shutter, val(s.cam && s.cam.sh, t - s.t0, .5)); });
    if (auto) nsub = shutter > .9 ? 7 : 3;
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo.acc.f); gl.viewport(0, 0, W, H); gl.disable(gl.BLEND); gl.clearColor(0.1, 0.09, 0.08, 1); gl.clear(gl.COLOR_BUFFER_BIT);
    for (var k = 0; k < nsub; k++) {
      var ts = t + (nsub === 1 ? 0 : (k / (nsub - 1) - .5) * shutter / spec.fps);
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo.scene.f); gl.viewport(0, 0, W, H); gl.clearColor(0.1, 0.09, 0.08, 1); gl.clear(gl.COLOR_BUFFER_BIT); gl.enable(gl.BLEND);
      spec.shots.forEach(function (s) { if (ts >= s.t0 - .001 && ts < s.t0 + s.dur) renderShot(s, ts, ident()); });
      // clarão de transição (tela cheia)
      spec.shots.forEach(function (s) { if (s.flash && ts >= s.t0 && ts < s.t0 + s.dur) { var a = val(s.flash.a, ts - s.t0, 0); if (a > .002) { var sl = texSolid(); draw(sl.tex, ident(), a, [0, 0], hex(s.flash.c || C.paper)); } } });
      // acumula: média corrente (alpha 1/(k+1))
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo.acc.f); gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.bindTexture(gl.TEXTURE_2D, fbo.scene.t); var M = ident(); M[0] = 2; M[5] = 2;
      gl.uniformMatrix4fv(gl.getUniformLocation(prog, 'uM'), false, M); gl.uniform1f(gl.getUniformLocation(prog, 'uO'), 1); gl.uniform2f(gl.getUniformLocation(prog, 'uR'), 0, 0); gl.uniform4f(gl.getUniformLocation(prog, 'uC'), 1, 1, 1, 1 / (k + 1));
      // textura do FBO vem de cabeça pra baixo em relação aos adereços: o quad inverte v, então desfaz aqui
      M[5] = -2; gl.uniformMatrix4fv(gl.getUniformLocation(prog, 'uM'), false, M);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    }
    // saída
    gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, W, H); gl.disable(gl.BLEND); gl.clear(gl.COLOR_BUFFER_BIT);
    gl.bindTexture(gl.TEXTURE_2D, fbo.acc.t); var O = ident(); O[0] = 2; O[5] = -2; gl.uniformMatrix4fv(gl.getUniformLocation(prog, 'uM'), false, O); gl.uniform1f(gl.getUniformLocation(prog, 'uO'), 1); gl.uniform2f(gl.getUniformLocation(prog, 'uR'), 0, 0); gl.uniform4f(gl.getUniformLocation(prog, 'uC'), 1, 1, 1, 1);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); gl.enable(gl.BLEND);
    return cv.toDataURL('image/jpeg', 0.93);
  };
  window.cenaDefs = { props: Object.keys(P) };
})();
