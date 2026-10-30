/* ================= FLUXO DO DIA ================= */
function iniciarDia() {
  fechaModal();
  S.mods = S.amanha || {}; S.amanha = {};
  if (S.dia === 5 && S.flags.showCaio) S.mods.showCaio = true;
  if (S.dia === 5 && S.flags.caioNoRafa) S.mods.caioNoRafa = true;
  S.fase = 'manha'; S.horas = 3; S.local = 'cafe'; ultimaMsg = null;
  S.agenda = S.agenda.filter(a => { if (a.dia > S.dia) return true; if (a.id === 'bia_demissao' && !(biaAtiva() && S.bia.estresse >= 45)) { diario('A Bia aguentou até o fim da semana.', 'bia_aguenta'); return false; } return a.dia === S.dia; });
  S.snap = { rep: S.rep, caixa: S.caixa, lucia: S.lucia.afin, caio: S.caio.afin, bia: S.bia.estresse, rafa: S.rafa.afin, an: S.animo, nd: S.diario.length };
  S.caio.viuHoje = false; S.compras = 0; S.flags.entregouRafa = false;
  R = null;
  if (S.rafa.acordo) {
    if (S.estoque.massa >= 8) { S.estoque.massa -= 8; S.horas -= 1; S.flags.entregouRafa = true; }
    else { S.rafa.acordo = null; S.rafa.afin -= 15; diario('Faltou massa para a entrega do Rafa. Ele cancelou o acordo.', 'acordo_rafa'); }
  }
  fila = diretor('manha');
  hudSig = '';
  mostraLocal(S.flags.entregouRafa ? 'Uma hora já foi: entreguei os 8 pães do Rafa.' : null);
  proximoEvento(() => { S.metas = gerarMetas(); fechaModal(); autosave(); mostraLocal(); });
}
function fimExpediente() {
  R.rodando = false; S.fase = 'pos'; trava = true; normaliza(); hudSig = '';
  const st = R.stats; S.ultimo = { ...st, biaTrab: R.biaTrab, maxCombo: R.maxCombo };
  R.clientes = []; R.jog.fila = []; R.jog.fase = 'livre'; R.jog.carga = []; if (R.bia) { R.bia.fila = []; R.bia.fase = 'livre'; }
  S.ontem = { ...st.usou };
  for (const m of S.metas) if (m.fim && !m.ok && m.id === 'semIrritado' && st.irritados === 0) concluiMeta(m);
  const estrelas = S.metas.filter(m => m.ok).length;
  S.estrelasDia[S.dia - 1] = estrelas;
  const sobra = R.vitrine;
  if (sobra > 0) diario(`Sobraram ${sobra} pães de queijo na vitrine. Foram para o lixo.`);
  const [c0, a0] = R.nivIni;
  if (nCoz() > c0) for (let n = c0 + 1; n <= nCoz(); n++) if (n <= 2) S.perkFila.push('coz' + n);
  if (nAtend() > a0) for (let n = a0 + 1; n <= nAtend(); n++) if (n <= 2) S.perkFila.push('at' + n);
  const dRep = S.rep - S.snap.rep;
  $('#dica').hidden = true;
  sfx(estrelas >= 2 ? 'meta' : 'pronto');
  modal(`<div class="sobre">Dia ${S.dia} · 17h</div><h2>Placa virada</h2>
    <div class="estrelas">${[0, 1, 2].map(i => `<span class="${i < estrelas ? 'on' : 'off'}">★</span>`).join('')}</div>
    <table class="contas">
      ${S.metas.map(m => `<tr><td>${m.ok ? '★' : '☆'} ${esc(m.txt)}</td><td class="${m.ok ? 'pos' : ''}">${m.ok ? '+' + brl(m.rec) : '—'}</td></tr>`).join('')}
      <tr><td>Clientes atendidos</td><td>${st.atendidos}</td></tr>
      <tr><td>Foram embora irritados</td><td class="${st.irritados ? 'neg' : ''}">${st.irritados}</td></tr>
      <tr><td>Itens no ponto perfeito</td><td>${st.perfeitos}</td></tr>
      ${R.lugares.length ? `<tr><td>Servidos sentados · mesas limpas</td><td>${st.sentados} · ${st.limpas}</td></tr>` : ''}
      <tr><td>Maior combo</td><td>x${R.maxCombo}</td></tr>
      <tr><td>Vendas</td><td class="pos">${brl(st.receita)}</td></tr>
      <tr><td>Gorjetas</td><td class="pos">${brl(st.gorjeta)}</td></tr>
      ${sobra ? `<tr><td>Pães que sobraram</td><td class="neg">${sobra}</td></tr>` : ''}
      <tr class="total"><td>Fama</td><td class="${dRep >= 0 ? 'pos' : 'neg'}">${Math.round(S.rep)} (${dRep >= 0 ? '+' : ''}${dRep.toFixed(1)})</td></tr>
    </table>
    ${S.dia === 1 ? `<div class="fala"><img class="retrato" src="${retrato('cida')}" alt=""><div><div class="quem">Dona Cida</div>${estrelas >= 2 ? 'Olha só, levou jeito!' : 'Primeiro dia é assim mesmo.'} Toma a chave. Amanhã é contigo.</div></div>` : ''}
    <div class="rodape"><span style="color:var(--suave)">Energia ${Math.round(S.energia)} · Ânimo ${Math.round(S.animo)}</span><button class="bt ouro" id="bOk">Continuar</button></div>`, m => { m.querySelector('#bOk').onclick = () => {
    sfx('clique');
    if (S.dia === 1) diario('A Dona Cida me passou a chave do café.');
    escolhePerks(() => {
      fila = diretor('pos');
      proximoEvento(() => { fechaModal(); S.fase = 'noite'; S.horas = 4; S.local = 'casa'; R = null; ultimaMsg = null; hudSig = ''; autosave(); mostraLocal(); });
    });
  }; });
}
function dormir() {
  trava = true; S.fase = 'fechamento'; $('#hots').innerHTML = ''; $('#dica').hidden = true;
  const sobraH = S.horas;
  if (S.caio.viuHoje) S.caio.semVer = 0; else { S.caio.semVer++; S.caio.afin -= 3; }
  if (S.flags.promessaCaio === S.dia) { S.flags.promessaCaio = false; S.caio.afin -= 20; S.flags.caioNoRafa = true; lembra('promessa_quebrada', 'tu prometeu ao Caio e não apareceu'); diario('Prometi ao Caio que ia aparecer e não fui. Ele aceitou tocar no Grão Nobre na sexta.', 'promessa_caio'); }
  const sal = S.ultimo && S.ultimo.biaTrab ? salarioBia() : 0;
  const rafa = S.rafa.acordo && S.flags.entregouRafa ? S.rafa.valor : 0;
  S.caixa -= ALUGUEL + sal; S.caixa += rafa;
  const ultimo = S.dia >= DIAS;
  let parcela = 0;
  if (ultimo && S.caixa >= PARCELA) { parcela = PARCELA; S.caixa -= PARCELA; S.flags.parcelaPaga = true; diario('Paguei a primeira parcela à Dona Cida. O café é um pouco mais meu.'); }
  S.energia += 50 + 8 * sobraH; S.animo += bonusEstilo().animo;
  if (biaAtiva()) { if (S.mods.biaFolga) S.bia.estresse -= 35; else if (S.ultimo && S.ultimo.biaTrab) S.bia.estresse += S.bia.regime === 'integral' ? 16 : 8; }
  S.tensao = Math.max(0, S.tensao - 1);
  normaliza(); hudSig = '';
  const st = S.ultimo || { receita: 0, gorjeta: 0 }, sn = S.snap;
  const dl = (a, b) => { const d = Math.round(a - b); return d ? `<span class="${d > 0 ? 'pos' : 'neg'}">${d > 0 ? '+' : ''}${d}</span>` : '<span style="color:var(--suave)">=</span>'; };
  const hoje = S.diario.slice(sn.nd);
  const metasRec = S.metas.filter(m => m.ok).reduce((a, m) => a + m.rec, 0);
  const falido = S.caixa < 0 || (ultimo && !S.flags.parcelaPaga);
  modal(`<div class="sobre">Dia ${S.dia} · fechamento</div><h2>${falido ? 'O caixa não fechou' : 'As contas do dia'}</h2>
    <table class="contas">
      <tr><td>Compras e melhorias</td><td class="${S.compras ? 'neg' : ''}">${S.compras ? '−' + brl(S.compras) : brl(0)}</td></tr>
      <tr><td>Vendas e gorjetas</td><td class="pos">+${brl(st.receita + st.gorjeta)}</td></tr>
      ${metasRec ? `<tr><td>Bônus das metas</td><td class="pos">+${brl(metasRec)}</td></tr>` : ''}
      <tr><td>Aluguel</td><td class="neg">−${brl(ALUGUEL)}</td></tr>
      ${sal ? `<tr><td>Salário da Bia</td><td class="neg">−${brl(sal)}</td></tr>` : ''}
      ${rafa ? `<tr><td>Pães para o Grão Nobre</td><td class="pos">+${brl(rafa)}</td></tr>` : ''}
      ${parcela ? `<tr><td>Parcela da Dona Cida</td><td class="neg">−${brl(parcela)}</td></tr>` : ''}
      <tr class="total"><td>Caixa agora</td><td class="${S.caixa < 0 ? 'neg' : ''}">${brl(S.caixa)} ${dl(S.caixa, sn.caixa)}</td></tr>
    </table>
    ${!ultimo && !S.flags.parcelaPaga ? `<p class="${S.caixa >= PARCELA ? 'pos' : 'alerta'}" style="margin-top:8px">${S.caixa >= PARCELA ? 'O dinheiro da parcela já está no caixa.' : `Faltam ${brl(PARCELA - S.caixa)} para a parcela de sexta.`}</p>` : ''}
    <h4>O que mudou hoje</h4>
    <table class="contas">
      <tr><td>Fama</td><td>${Math.round(S.rep)} ${dl(S.rep, sn.rep)}</td></tr>
      <tr><td>Ânimo</td><td>${Math.round(S.animo)} ${dl(S.animo, sn.an)}</td></tr>
      <tr><td>Energia depois de dormir</td><td>${Math.round(S.energia)}</td></tr>
      ${S.flags.luciaAtendida ? `<tr><td>Dona Lúcia</td><td>${relacao(S.lucia.afin)} ${dl(S.lucia.afin, sn.lucia)}</td></tr>` : ''}
      <tr><td>Caio</td><td>${relacao(S.caio.afin)} ${dl(S.caio.afin, sn.caio)}</td></tr>
      ${biaAtiva() ? `<tr><td>Cansaço da Bia</td><td>${Math.round(S.bia.estresse)} ${dl(S.bia.estresse, sn.bia)}</td></tr>` : ''}
      <tr><td>Rafa</td><td>${relacao(S.rafa.afin)} ${dl(S.rafa.afin, sn.rafa)}</td></tr>
    </table>
    ${hoje.length ? `<h4>Diário de hoje</h4>${listaDiario(hoje)}` : ''}
    <div class="rodape"><span></span><button class="bt ouro" id="bOk">${falido ? 'Ver o que acontece' : ultimo ? 'Ver como a semana terminou' : 'Dormir até ' + NOME_DIA[S.dia]}</button></div>`, m => { m.querySelector('#bOk').onclick = () => {
    sfx('clique');
    if (falido) return epilogo(true);
    if (ultimo) return epilogo(false);
    S.dia++; iniciarDia();
  }; });
}
function epilogo(falencia) {
  trava = true; S.fase = 'fim'; hudSig = ''; $('#trabalho').innerHTML = ''; $('#dica').hidden = true; hotspots();
  try { localStorage.removeItem(AUTO_KEY); } catch (e) { /* ok */ }
  sfx(falencia ? 'erro' : 'nivel');
  const id = Object.entries(S.padrao).sort((a, b) => b[1] - a[1])[0];
  const txtId = id[1] === 0 ? 'Tu passou a semana inteira atrás do balcão. Ainda não sabe quem é fora dele.' : { cozinha: 'Tu virou alguém que resolve tudo na bancada. O café tem a tua mão.', social: 'Tu conhece o bairro pelo nome. O café virou ponto de encontro antes de virar negócio.', gestao: 'Tu pensa o café como empresa: margem, processo, concorrência. Falta saber se ele ainda é teu.', descanso: 'Tu aprendeu a parar antes de quebrar. O café cresce devagar, e tu junto.' }[id[0]];
  const L = [];
  if (falencia) L.push(S.caixa < 0 ? `O caixa fechou em ${brl(S.caixa)}. O dono do imóvel não esperou.` : `Na sexta à noite, a Dona Cida veio buscar a parcela. Tinha ${brl(S.caixa)} no caixa. Ela olha a cozinha, as melhorias novas, e suspira: "Assim não dá, meu filho."`);
  else L.push(`Tu pagou a parcela. O café termina a semana com ${brl(S.caixa)} e fama ${Math.round(S.rep)}: ${S.rep >= 60 ? 'virou assunto no bairro' : S.rep >= 40 ? 'já tem gente que volta' : 'ainda é um segredo da rua'}.`);
  if (S.bia.foiRafa || (S.mem.bia_recusada && !S.bia.contratada)) L.push('A Bia serve café do outro lado da rua, no Grão Nobre.');
  else if (biaAtiva()) L.push(S.bia.moral >= 55 ? 'A Bia já fala em "nosso café".' : 'A Bia continua, mas conta as horas.');
  if (S.flags.luciaSumiu) L.push('A Dona Lúcia agora toma café na padaria nova.');
  else if (S.flags.luciaAtendida) L.push(S.lucia.afin >= 45 ? 'A Dona Lúcia tem cadeira cativa perto da janela e fala de ti para meio bairro.' : 'A Dona Lúcia ainda aparece, mas não demora mais no balcão.');
  if (S.flags.showCaio) L.push('O show do Caio lotou o café. Alguém filmou e o vídeo rodou no grupo do bairro.');
  else if (S.flags.caioNoRafa) L.push('O Caio tocou sexta no Grão Nobre. Tu ouviu da calçada.');
  else L.push(S.caio.afin >= 50 ? 'O Caio continua sendo quem tu chama quando o dia dá errado.' : 'O Caio e tu se falam menos. Ninguém decidiu isso.');
  if (S.rafa.acordo) L.push('O Rafa virou cliente e concorrente ao mesmo tempo.');
  const est = estiloCafe(); if (est.ativo) L.push(`O salão ficou com cara de ${ESTILOS[est.dom].nome.toLowerCase()}: ${ESTILOS[est.dom].frase.toLowerCase()}.`); else if (est.eclet) L.push('O salão ainda não decidiu quem é: tem de tudo um pouco.');
  const nm = S.salao.mesas.filter(Boolean).length; if (nm > 2) L.push(`O salão fechou a semana com ${nm} mesas e ${totalLugares()} lugares.`);
  const total = S.estrelas, max = DIAS * 3;
  modal(`<div class="sobre">${falencia ? 'Fim, por enquanto' : 'Fim da semana'}</div><h2>${falencia ? 'Não deu desta vez' : 'Sexta, 22h'}</h2>
    <div class="estrelas" style="font-size:22px">${S.estrelasDia.map(e => '★'.repeat(e || 0) + '☆'.repeat(3 - (e || 0))).join(' ')}</div>
    <p style="text-align:center;font-family:var(--f-px);font-size:18px">${total} de ${max} estrelas · maior combo da semana: x${Math.max(S.recorde, S.ultimo ? S.ultimo.maxCombo : 0)}</p>
    ${L.map(l => `<p>${esc(l)}</p>`).join('')}<p><b>${esc(txtId)}</b></p>
    ${falencia ? '<p style="color:var(--suave)">No jogo completo, isso abre o capítulo "Recomeçar": a Dona Cida renegocia, ou o Rafa oferece comprar o ponto.</p>' : '<p style="color:var(--suave)">No jogo completo, aqui começa o capítulo 2: o bairro começa a te conhecer.</p>'}
    <h4>Teu diário</h4>${S.diario.length ? listaDiario(S.diario) : '<p>Nada registrado.</p>'}
    <div class="rodape"><button class="bt" id="bMenuF">Menu principal</button><button class="bt ouro" id="bDeNovo">Jogar de novo</button></div>`, m => {
    m.querySelector('#bDeNovo').onclick = () => { S = novoEstado(); iniciarDia(); };
    m.querySelector('#bMenuF').onclick = mostraTitulo;
  });
}

