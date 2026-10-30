/* ================= METAS DO DIA ================= */
function gerarMetas() {
  if (S.dia === 1) return [
    { id: 'atender', txt: 'Atender 8 clientes', alvo: 8, rec: 15 },
    { id: 'perfeitos', txt: 'Fazer 3 itens no ponto perfeito', alvo: 3, rec: 15 },
    { id: 'combo', txt: 'Combo de 4', alvo: 4, rec: 15 },
  ].map(m => ({ ...m, prog: 0, ok: false }));
  const n = previsao(), d = S.dia;
  const pool = [
    { id: 'atender', txt: `Atender ${Math.round(n * 0.8)} clientes`, alvo: Math.round(n * 0.8), rec: 20 },
    { id: 'perfeitos', txt: `${3 + d * 2} itens no ponto perfeito`, alvo: 3 + d * 2, rec: 20 },
    { id: 'combo', txt: `Combo de ${3 + d * 2}`, alvo: 3 + d * 2, rec: 25 },
    { id: 'semIrritado', txt: 'Ninguém ir embora irritado', alvo: 1, rec: 30, fim: true },
    { id: 'gorjeta', txt: `R$ ${15 + d * 6} em gorjetas`, alvo: 15 + d * 6, rec: 20 },
    { id: 'capps', txt: `Servir ${2 + d} cappuccinos`, alvo: 2 + d, rec: 15 },
  ];
  if (liberado('salao') && totalLugares() > 0) { pool.push({ id: 'sentados', txt: `Servir ${2 + Math.floor(d / 2)} clientes sentados`, alvo: 2 + Math.floor(d / 2), rec: 25 }, { id: 'limpar', txt: `Limpar ${2 + Math.floor(d / 2)} mesas`, alvo: 2 + Math.floor(d / 2), rec: 15 }); }
  if (S.flags.mocha) pool.push({ id: 'mochas', txt: `Servir ${1 + Math.floor(d / 2)} mochas`, alvo: 1 + Math.floor(d / 2), rec: 25 });
  const out = [];
  while (out.length < 3) { const m = pick(pool); if (!out.some(o => o.id === m.id)) out.push({ ...m, prog: 0, ok: false }); }
  return out;
}
function progMeta(id, valor, absoluto) {
  for (const m of S.metas) {
    if (m.id !== id || m.ok) continue;
    m.prog = absoluto ? Math.max(m.prog, valor) : m.prog + valor;
    if (m.prog >= m.alvo && !m.fim) concluiMeta(m);
  }
}
function concluiMeta(m) {
  m.ok = true; m.prog = m.alvo; S.caixa += m.rec; S.estrelas++;
  sfx('meta'); flutua('META! +' + brl(m.rec), 50, '#ffcc4d', true);
  if (R) render();
}

