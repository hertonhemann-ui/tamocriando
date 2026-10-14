/*
 * Pós-processamento: o "jeito de câmera" das animações.
 *
 *  desfoque de movimento  vários instantes dentro do obturador, em média
 *                         (0.5 = obturador de 180°, o padrão de cinema)
 *  aberração cromática    vermelho e azul se separam de leve, mais forte
 *                         nas bordas e SÓ onde alguma coisa está se mexendo
 *  lente                  distorção de barril bem sutil
 *
 * Funciona com alpha: o resultado continua transparente onde não tem nada.
 * Se o WebGL não existir, sai só com o desfoque de movimento.
 */
(function (root) {
  'use strict';
  var TC = root.TC;

  var VS = 'attribute vec2 p; varying vec2 v; void main(){ v = vec2(p.x * 0.5 + 0.5, 0.5 - p.y * 0.5); gl_Position = vec4(p, 0.0, 1.0); }';
  var FS = [
    'precision mediump float;',
    'varying vec2 v;',
    'uniform sampler2D uImg; uniform sampler2D uMask;',
    'uniform float uAb; uniform float uLens; uniform float uAsp;',
    'void main(){',
    '  vec2 c = v - 0.5;',
    '  vec2 ca = vec2(c.x * uAsp, c.y);',
    '  float r2 = dot(ca, ca);',
    '  float norm = 1.0 + uLens * (0.25 * uAsp * uAsp + 0.25);',
    '  vec2 uv = 0.5 + c * (1.0 + uLens * r2) / norm;',
    '  float m = texture2D(uMask, uv).r;',
    '  float amt = uAb * (0.15 + 0.85 * m) * (0.35 + 1.3 * sqrt(r2));',
    '  vec2 dir = c / (length(c) + 0.0001);',
    '  vec4 sr = texture2D(uImg, uv + dir * amt);',
    '  vec4 sg = texture2D(uImg, uv);',
    '  vec4 sb = texture2D(uImg, uv - dir * amt);',
    '  float a = max(sg.a, max(sr.a, sb.a));',
    '  gl_FragColor = vec4(sr.r, sg.g, sb.b, a);',
    '}'
  ].join('\n');

  function Renderer() {
    this.acc = TC.makeCanvas(2, 2);
    this.sub = TC.makeCanvas(2, 2);
    this.m1 = TC.makeCanvas(2, 2);
    this.m2 = TC.makeCanvas(2, 2);
    this.mask = TC.makeCanvas(2, 2);
    this.glc = null;
    this.glState = null;
  }

  function size(cv, w, h) { if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; } }

  Renderer.prototype.initGL = function () {
    if (this.glState !== null) return this.glState;
    this.glState = false;
    try {
      var cv = TC.makeCanvas(2, 2);
      var gl = cv.getContext('webgl', { premultipliedAlpha: true, alpha: true, preserveDrawingBuffer: true, antialias: false });
      if (!gl) return false;
      function sh(type, src) {
        var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
        if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
        return s;
      }
      var pr = gl.createProgram();
      gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS));
      gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS));
      gl.linkProgram(pr);
      if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(pr));
      gl.useProgram(pr);
      var buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
      var loc = gl.getAttribLocation(pr, 'p');
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      function tex(unit) {
        var t = gl.createTexture();
        gl.activeTexture(gl.TEXTURE0 + unit);
        gl.bindTexture(gl.TEXTURE_2D, t);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        return t;
      }
      this.glc = cv;
      this.glState = {
        gl: gl, tImg: tex(0), tMask: tex(1),
        uImg: gl.getUniformLocation(pr, 'uImg'), uMask: gl.getUniformLocation(pr, 'uMask'),
        uAb: gl.getUniformLocation(pr, 'uAb'), uLens: gl.getUniformLocation(pr, 'uLens'), uAsp: gl.getUniformLocation(pr, 'uAsp')
      };
      gl.uniform1i(this.glState.uImg, 0);
      gl.uniform1i(this.glState.uMask, 1);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    } catch (e) {
      this.glState = false;
    }
    return this.glState;
  };

  // mapa do que se mexe: diferença entre dois instantes, em baixa resolução
  Renderer.prototype.motionMask = function (id, o, fps) {
    var mw = Math.max(32, Math.round(o.w / 12)), mh = Math.max(32, Math.round(o.h * mw / o.w));
    size(this.m1, mw, mh); size(this.m2, mw, mh); size(this.mask, mw, mh);
    var base = { w: mw, h: mh, dur: o.dur, params: o.params, brand: o.brand };
    TC.renderFrame(this.m1.getContext('2d'), id, Object.assign({}, base, { t: o.t }));
    TC.renderFrame(this.m2.getContext('2d'), id, Object.assign({}, base, { t: Math.max(0, o.t - 1.5 / fps) }));
    var a = this.m1.getContext('2d').getImageData(0, 0, mw, mh), b = this.m2.getContext('2d').getImageData(0, 0, mw, mh);
    var d = a.data, e = b.data;
    for (var i = 0; i < d.length; i += 4) {
      var diff = Math.abs(d[i] - e[i]) + Math.abs(d[i + 1] - e[i + 1]) + Math.abs(d[i + 2] - e[i + 2]) + Math.abs(d[i + 3] - e[i + 3]) * 1.5;
      var v = Math.min(255, diff * 1.6);
      d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255;
    }
    var mc = this.mask.getContext('2d');
    this.m1.getContext('2d').putImageData(a, 0, 0);
    mc.clearRect(0, 0, mw, mh);
    if (typeof mc.filter === 'string') mc.filter = 'blur(1.5px)';
    mc.drawImage(this.m1, 0, 0);
    if (typeof mc.filter === 'string') mc.filter = 'none';
    return this.mask;
  };

  /*
   * Desenha o frame final em ctxOut.
   *  o: os mesmos campos de TC.renderFrame + o.fx:
   *     { blur: 0..1 (fração do frame), samples, fps, aberration: 0..1, lens: 0..1 }
   */
  Renderer.prototype.render = function (ctxOut, id, o) {
    var fx = o.fx || {}, w = o.w, h = o.h, fps = fx.fps || 30;
    var tpl = TC.templates[id];
    var dur = Math.max(tpl.minDur, o.dur || tpl.duration);
    var raw = { w: w, h: h, dur: dur, params: o.params, brand: o.brand };
    size(this.acc, w, h);
    var ac = this.acc.getContext('2d');
    var N = fx.blur > 0 ? Math.max(2, Math.round(fx.samples || 6)) : 1;
    if (N === 1) {
      TC.renderFrame(ac, id, Object.assign({}, raw, { t: o.t }));
    } else {
      size(this.sub, w, h);
      var sc = this.sub.getContext('2d');
      var sh = fx.blur / fps;
      ac.setTransform(1, 0, 0, 1, 0, 0);
      ac.globalCompositeOperation = 'source-over';
      ac.globalAlpha = 1;
      ac.clearRect(0, 0, w, h);
      for (var i = 0; i < N; i++) {
        var ti = o.t + sh * (i / (N - 1) - 0.5);
        TC.renderFrame(sc, id, Object.assign({}, raw, { t: Math.max(0, Math.min(dur, ti)) }));
        ac.globalCompositeOperation = 'lighter';
        ac.globalAlpha = 1 / N;
        ac.drawImage(this.sub, 0, 0);
      }
      ac.globalCompositeOperation = 'source-over';
      ac.globalAlpha = 1;
    }
    var src = this.acc;
    var ab = fx.aberration || 0, lens = fx.lens || 0;
    if ((ab > 0 || lens > 0) && this.initGL()) {
      var G = this.glState, gl = G.gl;
      size(this.glc, w, h);
      gl.viewport(0, 0, w, h);
      var mask = this.motionMask(id, Object.assign({}, raw, { t: o.t }), fps);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, G.tImg);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.acc);
      gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, G.tMask);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, mask);
      gl.uniform1f(G.uAb, ab * 0.009);
      gl.uniform1f(G.uLens, lens * 0.12);
      gl.uniform1f(G.uAsp, w / h);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      src = this.glc;
    }
    ctxOut.save();
    ctxOut.setTransform(1, 0, 0, 1, 0, 0);
    ctxOut.globalAlpha = 1;
    ctxOut.globalCompositeOperation = 'source-over';
    ctxOut.clearRect(0, 0, w, h);
    if (o.preview && o.backdrop !== false) TC.drawBackdrop(ctxOut, w, h, o.backdrop || 'video', o.t);
    ctxOut.drawImage(src, 0, 0);
    ctxOut.restore();
  };

  Renderer.prototype.hasGL = function () { return !!this.initGL(); };

  TC.Renderer = Renderer;
  // ajustes padrão do "jeito de câmera"
  TC.fxDefaults = { blur: 0.5, samples: 6, aberration: 0.35, lens: 0.2 };
})(typeof window !== 'undefined' ? window : this);
