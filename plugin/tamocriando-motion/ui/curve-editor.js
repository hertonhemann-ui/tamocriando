/*
 * Editor de curva (cubic-bezier), igual ao graph editor do After Effects:
 * duas alças arrastáveis, atalhos prontos e uma bolinha andando com a curva.
 * Usado no painel do Premiere e na galeria.
 *
 *   var ed = new TC.CurveEditor(divHost, { value: [x1, y1, x2, y2], onChange: function (v) {} });
 *   ed.set([0.2, 1, 0.3, 1]);  ed.destroy();
 */
(function (root) {
  'use strict';
  var TC = root.TC;
  var YMIN = -0.6, YMAX = 1.6;

  var CSS = [
    '.tc-curve{display:flex;flex-direction:column;gap:6px}',
    '.tc-curve canvas{width:100%;display:block;border-radius:8px;touch-action:none;cursor:crosshair}',
    '.tc-curve-presets{display:flex;flex-wrap:wrap;gap:4px}',
    '.tc-curve-presets button{font:inherit;font-size:11px;padding:3px 9px;border-radius:999px;border:1px solid var(--tc-curve-line,#4a433e);background:transparent;color:inherit;cursor:pointer;opacity:.85}',
    '.tc-curve-presets button[aria-pressed="true"]{background:var(--tc-curve-accent,#C8502A);border-color:var(--tc-curve-accent,#C8502A);color:#fff;opacity:1}',
    '.tc-curve-out{font-size:10.5px;opacity:.7;font-variant-numeric:tabular-nums;user-select:text}'
  ].join('');
  var styled = false;

  function CurveEditor(host, opts) {
    opts = opts || {};
    if (!styled && typeof document !== 'undefined') {
      var st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st); styled = true;
    }
    var self = this;
    this.v = (opts.value && opts.value.length === 4 ? opts.value : TC.curvePresets.suave.v).map(Number);
    this.onChange = opts.onChange || function () {};
    this.col = Object.assign({ bg: '#14110f', grid: 'rgba(239,233,223,0.09)', curve: '#C8502A', handle: '#EFE9DF', faint: 'rgba(239,233,223,0.25)' }, opts.colors || {});
    this.wrap = document.createElement('div');
    this.wrap.className = 'tc-curve';
    this.cv = document.createElement('canvas');
    this.cv.setAttribute('aria-label', 'Curva: arraste as alças');
    this.bar = document.createElement('div'); this.bar.className = 'tc-curve-presets';
    this.out = document.createElement('div'); this.out.className = 'tc-curve-out';
    this.wrap.appendChild(this.cv); this.wrap.appendChild(this.bar); this.wrap.appendChild(this.out);
    host.appendChild(this.wrap);

    Object.keys(TC.curvePresets).forEach(function (k) {
      var b = document.createElement('button');
      b.type = 'button'; b.textContent = TC.curvePresets[k].label; b.dataset.k = k;
      b.onclick = function () { self.set(TC.curvePresets[k].v.slice(), true); };
      self.bar.appendChild(b);
    });

    this.drag = -1; this.hover = -1;
    this.cv.addEventListener('pointerdown', function (e) {
      var h = self.pick(e);
      self.drag = h;
      try { self.cv.setPointerCapture(e.pointerId); } catch (err) { /* ok */ }
      self.move(e);
      e.preventDefault();
    });
    this.cv.addEventListener('pointermove', function (e) {
      if (self.drag >= 0) self.move(e);
      else self.hover = self.pick(e, 22);
    });
    var end = function () { self.drag = -1; };
    this.cv.addEventListener('pointerup', end);
    this.cv.addEventListener('pointercancel', end);
    this.cv.addEventListener('pointerleave', function () { self.hover = -1; });

    this.alive = true;
    var loop = function (now) { if (!self.alive) return; self.draw(now); requestAnimationFrame(loop); };
    requestAnimationFrame(loop);
    this.sync();
  }

  var P = CurveEditor.prototype;

  P.geom = function () {
    var dpr = window.devicePixelRatio || 1;
    var W = Math.max(160, this.cv.clientWidth || 240), H = Math.round(Math.min(190, Math.max(110, W * 0.5)));
    if (this.cv.width !== Math.round(W * dpr) || this.cv.height !== Math.round(H * dpr)) {
      this.cv.width = Math.round(W * dpr); this.cv.height = Math.round(H * dpr);
      this.cv.style.height = H + 'px';
    }
    var pad = 16;
    return {
      dpr: dpr, W: W, H: H,
      x: function (v) { return pad + v * (W - pad * 2); },
      y: function (v) { return pad + (YMAX - v) / (YMAX - YMIN) * (H - pad * 2); },
      ix: function (px) { return (px - pad) / (W - pad * 2); },
      iy: function (py) { return YMAX - (py - pad) / (H - pad * 2) * (YMAX - YMIN); }
    };
  };

  P.pick = function (e, maxD) {
    var g = this.geom(), r = this.cv.getBoundingClientRect();
    var mx = e.clientX - r.left, my = e.clientY - r.top;
    var d1 = Math.hypot(mx - g.x(this.v[0]), my - g.y(this.v[1]));
    var d2 = Math.hypot(mx - g.x(this.v[2]), my - g.y(this.v[3]));
    var best = d1 <= d2 ? 0 : 1, d = Math.min(d1, d2);
    if (maxD && d > maxD) return -1;
    return best;
  };

  P.move = function (e) {
    if (this.drag < 0) return;
    var g = this.geom(), r = this.cv.getBoundingClientRect();
    var x = TC.clamp(g.ix(e.clientX - r.left), 0, 1), y = TC.clamp(g.iy(e.clientY - r.top), YMIN, YMAX);
    this.v[this.drag * 2] = Math.round(x * 100) / 100;
    this.v[this.drag * 2 + 1] = Math.round(y * 100) / 100;
    this.sync();
    this.onChange(this.v.slice());
  };

  P.set = function (v, notify) {
    this.v = v.slice().map(Number);
    this.sync();
    if (notify) this.onChange(this.v.slice());
  };

  P.sync = function () {
    var key = this.v.join(',');
    Array.prototype.forEach.call(this.bar.children, function (b) {
      b.setAttribute('aria-pressed', String(TC.curvePresets[b.dataset.k].v.join(',') === key));
    });
    this.out.textContent = 'cubic-bezier(' + this.v.join(', ') + ')';
  };

  P.draw = function (now) {
    var g = this.geom(), c = this.cv.getContext('2d'), col = this.col, v = this.v;
    c.setTransform(g.dpr, 0, 0, g.dpr, 0, 0);
    c.clearRect(0, 0, g.W, g.H);
    c.fillStyle = col.bg; c.fillRect(0, 0, g.W, g.H);
    // grade: 0 e 1 (onde a animação começa e termina)
    c.strokeStyle = col.grid; c.lineWidth = 1;
    c.setLineDash([3, 4]);
    [0, 1].forEach(function (k) {
      c.beginPath(); c.moveTo(g.x(0), g.y(k)); c.lineTo(g.x(1), g.y(k)); c.stroke();
      c.beginPath(); c.moveTo(g.x(k), g.y(YMIN)); c.lineTo(g.x(k), g.y(YMAX)); c.stroke();
    });
    c.setLineDash([]);
    c.strokeStyle = col.grid;
    c.beginPath(); c.moveTo(g.x(0), g.y(0)); c.lineTo(g.x(1), g.y(1)); c.stroke();
    // alças
    c.strokeStyle = col.faint; c.lineWidth = 1.5;
    c.beginPath(); c.moveTo(g.x(0), g.y(0)); c.lineTo(g.x(v[0]), g.y(v[1])); c.stroke();
    c.beginPath(); c.moveTo(g.x(1), g.y(1)); c.lineTo(g.x(v[2]), g.y(v[3])); c.stroke();
    // curva
    c.strokeStyle = col.curve; c.lineWidth = 3; c.lineCap = 'round';
    c.beginPath(); c.moveTo(g.x(0), g.y(0));
    c.bezierCurveTo(g.x(v[0]), g.y(v[1]), g.x(v[2]), g.y(v[3]), g.x(1), g.y(1));
    c.stroke();
    for (var i = 0; i < 2; i++) {
      var hx = g.x(v[i * 2]), hy = g.y(v[i * 2 + 1]), big = this.drag === i || this.hover === i;
      c.fillStyle = col.handle; c.strokeStyle = col.curve; c.lineWidth = 2;
      c.beginPath(); c.arc(hx, hy, big ? 8 : 6, 0, Math.PI * 2); c.fill(); c.stroke();
    }
    // bolinha andando com a curva (1,4 s de movimento, 0,5 s parada)
    var ph = ((now || 0) / 1000) % 1.9, k = Math.min(1, ph / 1.4), e = TC.curve(v)(k);
    c.fillStyle = col.curve;
    c.beginPath(); c.arc(g.x(k), g.y(e), 4, 0, Math.PI * 2); c.fill();
    var by = g.H - 7;
    c.fillStyle = col.grid; c.fillRect(g.x(0), by - 1, g.x(1) - g.x(0), 2);
    c.fillStyle = col.handle;
    c.beginPath(); c.arc(g.x(0) + (g.x(1) - g.x(0)) * TC.clamp(e, -0.1, 1.1), by, 5, 0, Math.PI * 2); c.fill();
  };

  P.destroy = function () { this.alive = false; if (this.wrap.parentNode) this.wrap.parentNode.removeChild(this.wrap); };

  TC.CurveEditor = CurveEditor;
})(typeof window !== 'undefined' ? window : this);
