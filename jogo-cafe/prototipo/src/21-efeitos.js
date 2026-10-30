/* ================= EFEITOS ================= */
function flutua(txt, xPct, cor, grande, yPct) {
  const el = document.createElement('div');
  el.className = 'flut' + (grande ? ' grande' : ''); el.textContent = txt; el.style.color = cor;
  el.style.left = clamp(xPct, 8, 92) + '%'; el.style.top = (yPct !== undefined ? clamp(yPct, 4, 90) : grande ? 14 : 40) + '%';
  $('#cenaWrap').appendChild(el); setTimeout(() => el.remove(), 1300);
}
function flutuaEm(txt, gx, gy, cor, grande) { flutua(txt, isoX(gx, gy) / CW * 100, cor, grande, (isoY(gx, gy, 34) - (grande ? 8 : 0)) / CH * 100); }
function treme() { const w = $('#cenaWrap'); w.classList.remove('treme'); void w.offsetWidth; w.classList.add('treme'); }
