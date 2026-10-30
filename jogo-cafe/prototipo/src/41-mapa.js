/* ================= MAPA ================= */
function hotspots() {
  const fase = S.fase, div = $('#hots');
  if (fase !== 'manha' && fase !== 'noite') { div.innerHTML = ''; return; }
  div.innerHTML = Object.entries(LOCAIS).map(([id, L]) => {
    const temAcao = ACOES.some(a => a.local === id && (a.fase === fase || a.fase === 'ambas'));
    const trancado = !temAcao || (id === 'fornecedor' && !liberado('fornecedor')) || (id === 'moveis' && !liberado('moveis')) || (S.dia === 1 && fase === 'manha' && id !== 'cafe');
    const novo = (id === 'fornecedor' && S.dia === 2 && fase === 'manha') || (id === 'moveis' && S.dia === 2 && fase === 'noite') || (id === 'cafe' && S.dia === 3 && fase === 'manha');
    return `<button class="hot ${S.local === id ? 'ativo' : ''}" data-local="${id}" style="left:${L.x / CW * 100}%" ${trancado ? 'disabled' : ''}>${L.nome}${novo ? '<span class="novo">novo</span>' : ''}</button>`;
  }).join('');
  div.querySelectorAll('.hot').forEach(b => { b.onclick = () => { sfx('clique'); S.local = b.dataset.local; mostraLocal(null); }; });
}
function efsHtml(ef) { return `<span class="efs">${ef.map(([k, v]) => `<span class="${v > 0 ? 'ef-up' : v < 0 ? 'ef-dn' : 'ef-nt'}">${ROT_EF[k]} ${v > 0 ? '▲'.repeat(v) : v < 0 ? '▼'.repeat(-v) : '•'}</span>`).join('')}</span>`; }
function painelHoje() {
  if (S.fase === 'manha') {
    const n = previsao(), nec = necessidade(n);
    const falta = (k, v) => S.estoque[k] < v ? ' class="alerta"' : '';
    let h = `<div class="hoje"><h4>Hoje · ${NOME_DIA[S.dia - 1]}</h4>
      <div class="kv"><span>Previsão de clientes</span><b>~${n}</b></div>
      <div class="kv"><span>${img('grao', 'p')} Grão (precisa ~${nec.grao})</span><b${falta('grao', nec.grao)}>${S.estoque.grao}</b></div>
      <div class="kv"><span>${img('leite', 'p')} Leite (precisa ~${nec.leite})</span><b${falta('leite', nec.leite)}>${S.estoque.leite}</b></div>
      <div class="kv"><span>${img('pao', 'p')} Pães (precisa ~${nec.pao})</span><b${S.estoque.massa + S.preassados < nec.pao ? ' class="alerta"' : ''}>${S.preassados} + ${S.estoque.massa} massas</b></div>
      <h4 style="margin-top:6px">Metas de hoje</h4>${S.metas.map(m => `<span>☆ ${esc(m.txt)} <span style="color:var(--ouro)">+${brl(m.rec)}</span></span>`).join('')}`;
    if (!S.flags.parcelaPaga) h += `<span class="${S.caixa >= PARCELA ? 'pos' : 'alerta'}">Parcela de sexta: ${S.caixa >= PARCELA ? 'já tem o dinheiro, cuidado com os gastos' : 'faltam ' + brl(PARCELA - S.caixa)}</span>`;
    const av = [];
    if (S.mods.chuva) av.push('Chovendo: menos gente, mais paciência.');
    if (S.mods.critico) av.push('A blogueira vem hoje. Exigente: só bebida perfeita.');
    if (S.mods.clube) av.push('O grupo de crochê chega à tarde.');
    if (S.mods.showCaio) av.push('Show do Caio: vai lotar.');
    if (S.mods.biaFolga) av.push('A Bia está de folga.');
    if (S.mods.semLeite) av.push('Sem leite hoje: só café puro.');
    if (S.mods.organizado) av.push('Cozinha organizada: 8% mais rápida.');
    if (S.energia < 40) av.push('Tua energia está baixa: as mãos vão ficar lentas.');
    if (S.estoque.grao < nec.grao || S.estoque.leite < nec.leite) av.push(liberado('fornecedor') ? 'Estoque curto para o movimento previsto. Passe no Fornecedor.' : 'A Dona Cida deixou o estoque pronto para hoje.');
    return h + av.map(a => `<span class="alerta">• ${esc(a)}</span>`).join('') + '</div>';
  }
  const am = [];
  if (S.amanha.critico) am.push('A blogueira vem amanhã.');
  if (S.amanha.clube) am.push('O grupo de crochê vem amanhã.');
  if (S.amanha.biaFolga) am.push('A Bia está de folga amanhã.');
  if (S.dia === 4 && S.flags.showCaio) am.push('Sexta tem show do Caio.');
  if (S.flags.promessaCaio) am.push('Tu prometeu ao Caio que ia aparecer hoje.');
  if (S.rafa.acordo) am.push('Amanhã cedo: entrega de 8 pães ao Rafa.');
  if (S.dia === 4) am.push('Amanhã é sexta: dia da parcela de ' + brl(PARCELA) + '.');
  return `<div class="hoje"><h4>Esta noite</h4>
    <div class="kv"><span>${img('raio', 'p')} Energia</span><b>${Math.round(S.energia)}</b></div><div class="kv"><span>${img('coracao', 'p')} Ânimo</span><b>${Math.round(S.animo)}</b></div>
    <span style="color:var(--suave)">Dormir devolve 50 de energia, mais 8 por hora livre que sobrar. O ânimo só sobe com o que tu faz.</span>
    ${am.map(a => `<span class="alerta">• ${esc(a)}</span>`).join('')}</div>`;
}
let ultimaMsg = null;
function mostraLocal(m) {
  if (m !== undefined) ultimaMsg = m;
  hotspots(); hudSig = '';
  const L = LOCAIS[S.local];
  const acs = ACOES.filter(a => a.local === S.local && (a.fase === S.fase || a.fase === 'ambas'));
  const dia1 = S.dia === 1 && S.fase === 'manha';
  let h = `<div class="local"><div><h2>${L.nome}</h2><p class="desc">${L.desc}</p>`;
  if (ultimaMsg) h += `<div class="fala" style="grid-template-columns:44px minmax(0,1fr)"><img class="retrato" src="${retrato('voce')}" alt="" style="width:44px;height:44px"><div>${esc(ultimaMsg)}</div></div>`;
  h += `<p class="rotulo">${S.horas} ${S.horas === 1 ? 'hora livre' : 'horas livres'} antes ${S.fase === 'manha' ? 'de abrir (9h)' : 'de dormir (22h)'}</p>`;
  if (dia1) h += `<p class="desc">Hoje a Dona Cida já preparou tudo. Só abrir.</p>`;
  else if (!acs.length) h += `<p class="desc">Nada para fazer aqui agora.</p>`;
  h += `<div class="acoes-lista">${acs.map(a => { const rq = a.req ? a.req() : { ok: true }; const sem = a.h > S.horas; return `<button class="acao" data-ac="mapa" data-id="${a.id}" ${!rq.ok || sem || dia1 ? 'disabled' : ''}><b>${a.t}</b><span class="hr">${a.h}h</span>${efsHtml(a.ef)}${!rq.ok ? `<span class="req">${esc(rq.motivo)}</span>` : sem ? '<span class="req">Sem tempo</span>' : ''}</button>`; }).join('')}</div>`;
  if (S.local === 'cafe' && S.fase === 'manha' && S.dia > 1) {
    h += `<div class="config"><span class="rotulo" style="margin:0">Ajustes (não gastam tempo)</span>`;
    if (liberado('preco')) h += `<div class="linha-config">Preços <span class="seg">${['baixo', 'normal', 'alto'].map(p => `<button data-ac="preco" data-p="${p}" aria-pressed="${S.preco === p}">${p}</button>`).join('')}</span><span class="nota">Espresso ${brl(preco('espresso'))} · Cappuccino ${brl(preco('cappuccino'))}${S.flags.mocha ? ' · Mocha ' + brl(preco('mocha')) : ''} · Pão ${brl(preco('pao'))}. ${S.preco === 'alto' ? 'Alto: +25% por item, 20% menos clientes, menos paciência.' : S.preco === 'baixo' ? 'Baixo: −20% por item, 20% mais clientes, mais paciência.' : 'Para comparar: o Grão Nobre cobra R$ 8 no espresso.'}</span></div>`;
    else h += `<span class="dica-geral">Preços liberam na quarta, quando tu já souber quanto vende.</span>`;
    if (biaAtiva() && !S.mods.biaFolga) h += `<div class="linha-config">Bia fica no <span class="seg">${[['forno', 'forno'], ['moer', 'moedor'], ['balcao', 'balcão'], ['salao', 'salão']].map(([v, n]) => `<button data-ac="papel" data-v="${v}" aria-pressed="${S.bia.papel === v}">${n}</button>`).join('')}</span><span class="nota">${{ forno: 'Ela assa pão sozinha quando a vitrine baixa.', moer: 'Ela mói para ti (mas o que ela mói não sai no ponto perfeito).', balcao: 'Ela serve o que estiver pronto no balcão, sem tu tocar nos pedidos.', salao: 'Ela anota, serve e limpa as mesas. Tu fica com o balcão.' }[S.bia.papel]}</span></div>`;
    h += `</div>`;
  }
  h += `</div>${painelHoje()}</div>`;
  $('#trabalho').innerHTML = h;
  dicaMapa();
}
function dicaMapa() {
  const d = $('#dica');
  let fala = null;
  if (S.dia === 1 && S.fase === 'manha') fala = 'Bom dia! Hoje eu fico contigo, amanhã o café é teu. Já fiz as compras. A primeira parcela do café é <b>R$ 400 na sexta</b>, então cada real conta. Quando estiver pronto, toca em <b>Abrir o café</b> lá em cima.';
  else if (S.dia === 1 && S.fase === 'noite') fala = 'De noite a vida é tua. Toca nos lugares da rua: cada coisa gasta horas e mexe nas tuas barras. <b>Energia</b> volta dormindo. <b>Ânimo</b> só volta se tu cuidar dele. Quando cansar, toca em <b>Dormir</b>.';
  else if (S.dia === 2 && S.fase === 'manha') fala = 'Bilhete da Dona Cida: "O <b>Fornecedor</b> agora é contigo. Olha no quadro quanto tu vai precisar antes de comprar. E deixei duas mesinhas velhas no salão: quem senta consome mais, mas dá trabalho (anotar, servir e limpar). Lembra da parcela."';
  else if (S.dia === 2 && S.fase === 'noite') fala = 'Bilhete da Dona Cida: "Abriu a <b>Móveis & Cia</b> na esquina, da Dona Nair. Cada mesa e cada cadeira tem um jeito: uma dá conforto, outra dá aconchego, outra dá charme. O estilo que tu escolher vira a cara do teu café."';
  else if (S.dia === 3 && S.fase === 'manha') fala = 'Bilhete da Dona Cida: "No <b>Café</b> dá pra mexer nos <b>preços</b>. E usa meu caderno de receitas. Cuidado com os clientes antigos."';
  if (!fala) { d.hidden = true; return; }
  d.hidden = false;
  d.innerHTML = `<img class="retrato" src="${retrato('cida')}" alt=""><div><div class="quem">Dona Cida</div><p>${fala}</p></div>`;
}
function acaoMapa(b) {
  const ac = b.dataset.ac;
  sfx('clique');
  if (ac === 'preco') { S.preco = b.dataset.p; return mostraLocal(); }
  if (ac === 'papel') { S.bia.papel = b.dataset.v; return mostraLocal(); }
  if (ac !== 'mapa') return;
  const a = ACOES.find(x => x.id === b.dataset.id);
  if (a.abre === 'compras') return mostraCompras();
  if (a.abre === 'moveis') return mostraMoveis();
  S.horas -= a.h;
  const res = a.run(); normaliza();
  mostraLocal(res);
}

