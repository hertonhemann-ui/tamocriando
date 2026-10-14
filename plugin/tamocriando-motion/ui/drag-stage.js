/*
 * Arrastar na prévia: clica e arrasta o texto (ou o desenho) pra onde quiser,
 * a roda do mouse muda o tamanho. Funciona com qualquer animação que declare
 *   drag: { x: 'px', y: 'py', size: 'tamanho' }
 * (nomes dos campos de posição em % do quadro; size é opcional).
 *
 *   TC.attachDrag(canvas, {
 *     tpl: function () { return template ou null },
 *     params: function () { return objeto de params },
 *     set: function (key, value) { grava o campo }
 *   });
 */
(function (root) {
  'use strict';
  var TC = root.TC;

  TC.attachDrag = function (cv, o) {
    var st = null;
    function pct(e) {
      var r = cv.getBoundingClientRect();
      return { x: (e.clientX - r.left) / r.width * 100, y: (e.clientY - r.top) / r.height * 100 };
    }
    function round(v) { return Math.round(TC.clamp(v, 0, 100) * 10) / 10; }
    function snap(v) { return Math.abs(v - 50) < 1.2 ? 50 : v; } // imã no centro

    cv.addEventListener('pointerdown', function (e) {
      var tpl = o.tpl();
      if (!tpl || !tpl.drag) return;
      var P = o.params(), q = pct(e);
      st = { dx: (Number(P[tpl.drag.x]) || 50) - q.x, dy: (Number(P[tpl.drag.y]) || 50) - q.y };
      try { cv.setPointerCapture(e.pointerId); } catch (err) { /* ok */ }
      cv.style.cursor = 'grabbing';
      e.preventDefault();
    });
    cv.addEventListener('pointermove', function (e) {
      var tpl = o.tpl();
      if (!tpl || !tpl.drag) { cv.style.cursor = ''; return; }
      if (!st) { cv.style.cursor = 'grab'; return; }
      var q = pct(e);
      o.set(tpl.drag.x, snap(round(q.x + st.dx)));
      o.set(tpl.drag.y, snap(round(q.y + st.dy)));
    });
    function end() { st = null; var tpl = o.tpl(); cv.style.cursor = tpl && tpl.drag ? 'grab' : ''; }
    cv.addEventListener('pointerup', end);
    cv.addEventListener('pointercancel', end);
    cv.addEventListener('wheel', function (e) {
      var tpl = o.tpl();
      if (!tpl || !tpl.drag || !tpl.drag.size) return;
      var cur = Number(o.params()[tpl.drag.size]) || 100;
      o.set(tpl.drag.size, Math.round(TC.clamp(cur * (e.deltaY < 0 ? 1.06 : 1 / 1.06), 30, 300)));
      e.preventDefault();
    }, { passive: false });
  };
})(typeof window !== 'undefined' ? window : this);
