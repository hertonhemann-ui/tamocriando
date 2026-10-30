/* ================= LAÇO ================= */
['icoRel:relogio', 'icoMoeda:moeda', 'icoEstrela:estrela', 'icoRaio:raio', 'icoCor:coracao'].forEach(p => { const [id, n] = p.split(':'); $('#' + id).src = icone(n); });
let ult = performance.now();
function laco(t) {
  const dt = Math.min(0.05, (t - ult) / 1000); ult = t;
  atualizar(dt);
  const ts = t / 1000;
  if (S.fase === 'expediente' && R) { cenaCafe(ts); renderExpediente(); }
  else if (S.fase === 'pos' || S.fase === 'titulo') cenaCafe(ts);
  else cenaRua(ts);
  if (R) S.recorde = Math.max(S.recorde, R.maxCombo || 0);
  hud();
  requestAnimationFrame(laco);
}
if (/[?&#]debug/.test(location.href)) window.__cafe = code => eval(code);
mostraTitulo();
requestAnimationFrame(laco);
})();
</script>

