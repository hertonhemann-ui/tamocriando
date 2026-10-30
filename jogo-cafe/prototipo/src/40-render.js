/* ================= RENDER ================= */
let assinatura = '';
function render() { assinatura = ''; }
function horaTxt() {
  if (S.fase === 'expediente' && R) { const k = clamp(R.t / R.len, 0, 1); const ini = S.mods.meioDia ? 13 : 9; const tot = (S.mods.meioDia ? 4 : 8) * 60 * k; return `${ini + Math.floor(tot / 60)}h${String(Math.floor(tot % 60 / 10) * 10).padStart(2, '0')}`; }
  if (S.fase === 'manha') return `${9 - S.horas}h`;
  if (S.fase === 'noite') return `${22 - S.horas}h`;
  return '—';
}
let hudSig = '';
function hud() {
  const sig = [S.dia, S.fase, horaTxt(), Math.round(S.caixa), Math.round(S.rep), Math.round(S.energia), Math.round(S.animo), S.horas, trava].join('|');
  if (sig === hudSig) return; hudSig = sig;
  $('#hDia').textContent = S.fase === 'titulo' ? '—' : `${S.dia}/5 ${NOME_DIA[S.dia - 1].slice(0, 3)}`;
  $('#hHora').textContent = horaTxt();
  $('#hCaixa').textContent = brl(S.caixa); $('#hCaixa').className = S.caixa < 60 ? 'neg' : '';
  $('#hRep').textContent = Math.round(S.rep);
  const falta = PARCELA - S.caixa;
  $('#hParcela').textContent = S.fase === 'titulo' ? '—' : S.flags.parcelaPaga ? 'paga' : falta > 0 ? `faltam ${brl(falta)}` : 'no caixa';
  $('#hParcela').className = S.flags.parcelaPaga || falta <= 0 ? 'pos' : S.dia >= 4 ? 'neg' : '';
  const be = $('#bEnergia'); be.style.width = S.energia + '%'; be.style.background = S.energia < 30 ? 'var(--vermelho)' : 'var(--ouro)';
  const ba = $('#bAnimo'); ba.style.width = S.animo + '%'; ba.style.background = S.animo < 25 ? 'var(--vermelho)' : 'var(--rosa)';
  const jogo = ['manha', 'noite', 'expediente', 'pos', 'fechamento'].includes(S.fase);
  $('#app').classList.toggle('jogo', jogo); $('#bFicha').hidden = !jogo;
  const bf = $('#bFase');
  if (S.fase === 'manha') { bf.hidden = false; bf.textContent = 'Abrir o café →'; }
  else if (S.fase === 'noite') { bf.hidden = false; bf.textContent = 'Dormir →'; }
  else bf.hidden = true;
  ficha();
}
function estiloHtml() {
  const e = estiloCafe();
  if (e.total < 4) return '<p class="dica-estilo">Ainda sem identidade. Móveis e decoração com o mesmo estilo dão bônus.</p>';
  if (e.eclet) return `<div class="est neutro" style="display:inline-block">Eclético</div><p class="dica-estilo">Mistura de estilos: 5% mais clientes curiosos, mas nenhum bônus de marca.</p>`;
  const E = ESTILOS[e.dom];
  return `<div>${tagEstilo(e.dom)} <small>${Math.round(e.pct * 100)}%</small></div><p class="dica-estilo"><b>${E.frase}.</b> ${E.efeito}</p>`;
}
let fichaSig = '', fichaHtml = '';
function ficha() {
  const hab = (nome, xp, por, nv, nota) => `<div class="hab"><span>${nome}</span><b>nv ${nv}</b><div class="mini"><i style="width:${nv >= 3 ? 100 : (xp % por) / por * 100}%"></i></div><small>${nota}</small></div>`;
  const pessoa = (id, txt, sub) => `<div class="pessoa"><img src="${retrato(id)}" alt=""><div>${txt}<small>${sub}</small></div></div>`;
  const perks = S.perks.map(id => Object.values(PERKS).flat().find(p => p.id === id)).filter(Boolean);
  let h = `<div><h3>Habilidades</h3>${hab('Cozinha', S.hab.cozXp, 60, nCoz(), 'Mãos mais rápidas')}${hab('Atendimento', S.hab.atendXp, 50, nAtend(), 'Clientes mais pacientes')}<div class="hab"><span>Gestão</span><b>nv ${S.hab.gestao}</b><small>Compras mais baratas, negociação</small></div>${perks.map(p => `<div class="perk">★ ${esc(p.nome)}: ${esc(p.desc)}</div>`).join('')}</div>
    <div><h3>Estoque</h3><div class="kv"><span>${img('grao', 'p')} Grão</span><b class="${S.estoque.grao < 6 ? 'neg' : ''}">${S.estoque.grao}</b></div><div class="kv"><span>${img('leite', 'p')} Leite</span><b class="${S.estoque.leite < 3 ? 'neg' : ''}">${S.estoque.leite}</b></div><div class="kv"><span>${img('massa', 'p')} Massa</span><b class="${S.estoque.massa < S.up.forno ? 'neg' : ''}">${S.estoque.massa}</b></div></div>
    <div><h3>Estilo do café</h3>${estiloHtml()}</div>
    <div><h3>Pessoas</h3>`;
  if (S.dia === 1 && S.fase !== 'noite') h += pessoa('cida', 'Dona Cida', 'antiga dona, te ensinando');
  if (biaAtiva()) h += pessoa('bia', 'Bia', `funcionária · cansaço ${Math.round(S.bia.estresse)}`);
  else if (S.bia.foiRafa || (S.mem.bia_recusada && S.vistos.bia_no_rival)) h += pessoa('bia', 'Bia', 'agora no Grão Nobre');
  if (S.flags.luciaAtendida) h += pessoa('lucia', 'Dona Lúcia', 'cliente fiel · ' + relacao(S.lucia.afin));
  h += pessoa('caio', 'Caio', 'amigo · ' + relacao(S.caio.afin));
  h += pessoa('rafa', 'Rafa', 'rival · ' + relacao(S.rafa.afin));
  h += `</div><div><h3>Semana</h3><div class="kv"><span>${img('estrela', 'p')} Estrelas</span><b>${S.estrelas}</b></div></div><p class="dica-geral">Energia abaixo de 30 deixa as mãos lentas. Ânimo quase zerado te derruba na manhã seguinte.</p>`;
  fichaHtml = h;
  if (h === fichaSig) return; fichaSig = h;
  $('#ficha').innerHTML = h;
}
function sigExpediente() {
  const ja = a => a ? [a.fase, a.tarefa && a.tarefa.t, a.fila.length, a.carga.length] : 0;
  return JSON.stringify([R.slots.map(s => [s.rec, s.passo, s.st, s.marcou]), ja(R.jog), ja(R.bia), R.bandeja, R.vitrine, R.forno.st, R.forno.fila,
    cartoes().map(c => [c.id, c.ok, c.estado, c.pedido, c.res.map(Boolean)]), R.lugares.map(l => l.estado), R.tut, S.estoque, R.msg && R.msg.t, R.dicaTemp && 1, S.energia < 30, R.combo, S.metas.map(m => m.prog + (m.ok ? 'k' : ''))]);
}
function textoTarefa(t) {
  if (t.t === 'passo') { const s = R.slots[t.i]; return s && s.rec ? `${RECEITAS[s.rec].passos[s.passo].nome} (${RECEITAS[s.rec].nome})` : 'etapa'; }
  if (t.t === 'assar') return 'Assar pães';
  if (t.t === 'entregar') { const c = cli(t.cid); return c ? 'Servir ' + c.nome : 'Servir'; }
  if (t.t === 'anotar') { const c = cli(t.cid); return c ? 'Anotar ' + c.nome : 'Anotar'; }
  if (t.t === 'limpar') return 'Limpar mesa ' + (t.mesa + 1);
  return 'Voltar';
}
function renderExpediente() {
  const sig = sigExpediente();
  if (sig !== assinatura) {
    assinatura = sig;
    const fino = matchMedia('(pointer:fine)').matches;
    const cs = cartoes(), mostra = cs.slice(0, 10), extra = cs.length - mostra.length;
    const recs = ['espresso', 'cappuccino'].concat(S.flags.mocha ? ['mocha'] : [], S.up.coador ? ['coado'] : []);
    const tec = { espresso: 'Q', cappuccino: 'W', mocha: 'E', coado: 'T' };
    const quente = R.combo >= 6, J = R.jog;
    let h = `<div class="trab"><div class="topo-exp"><div class="metas">${S.metas.map(m => `<div class="meta ${m.ok ? 'ok' : ''}" title="${esc(m.txt)}">${m.ok ? '★' : '☆'} <b>${m.fim ? (m.ok ? '✓' : '…') : Math.min(m.prog, m.alvo) + '/' + m.alvo}</b> ${esc(m.txt)}</div>`).join('')}</div>
      <div class="combo ${quente ? 'quente' : ''}">${img('fogo')}<div><b>x${R.combo}</b><br><small>combo · gorjeta x${String(multCombo(R.combo)).replace('.', ',')}</small></div></div></div>`;
    h += `<div><div class="rotulo"><span>Pedidos · toque no cartão, no cliente ou na mesa</span><span>${extra > 0 ? `+${extra} pedidos` : ''}</span></div><div class="tickets">`;
    const nCel = Math.max(5, Math.ceil(mostra.length / 5) * 5);
    for (let i = 0; i < nCel; i++) {
      const c = mostra[i];
      if (!c) { h += `<div class="ticket vazio">${i === 0 && !cs.length ? 'ninguém ainda' : ''}</div>`; continue; }
      const ex = c.traco === 'exigente', tag = { lucia: 'fiel', critico: 'blog', clube: 'crochê' }[c.tipo];
      const onde = c.modo === 'mesa' ? ` · Mesa ${c.seat.mesa + 1}` : '';
      const tk = fino && i < 5 ? `<span class="tecla">${'ZXCVB'[i]}</span>` : '';
      if (c.estado === 'sentado') h += `<button class="ticket ${c.anotando ? '' : 'pronto'}" data-ac="anotar" data-id="${c.id}">${tag ? `<span class="tag">${tag}</span>` : ''}<span class="nome">${esc(c.nome)}${onde}${tk}</span><span class="itens" style="font-family:var(--f-tit);font-size:22px;color:#c0392b">?</span><span class="traco">${c.anotando ? 'a caminho…' : 'Anotar pedido'}</span><span class="pac"><i data-pac="${c.id}"></i></span></button>`;
      else {
        const itens = c.ped.map((it, k) => `<span class="it ${c.ok[k] ? 'ok' : c.res[k] ? 'tem' : (it === 'pao' ? (R.vitrine > 0 ? 'tem' : '') : (itemNaBandeja(it, ex) >= 0 ? 'tem' : ''))}" title="${NOME_ITEM[it]}">${img(it)}</span>`).join('');
        h += `<button class="ticket ${podeEntregar(c) ? 'pronto' : ''}" data-ac="entregar" data-id="${c.id}">${tag ? `<span class="tag">${tag}</span>` : ''}<span class="nome">${esc(c.nome)}${onde}${tk}</span><span class="itens">${itens}</span>${c.traco ? `<span class="traco" title="${TRACOS[c.traco].desc}">${TRACOS[c.traco].nome}</span>` : ''}<span class="pac"><i data-pac="${c.id}"></i></span></button>`;
      }
    }
    h += `</div></div><div class="bancada"><div><div class="rotulo"><span>Bancada · ${R.slots.length} espaços</span><span>Máquina: ${S.up.maquina} ${S.up.maquina > 1 ? 'grupos' : 'grupo'}</span></div><div class="slots">`;
    R.slots.forEach((s, i) => {
      h += `<div class="slot" data-slot="${i}"><h5><span>Preparo ${i + 1}</span>${fino ? `<span class="tecla">${i + 1}</span>` : ''}</h5>`;
      if (!s.rec) {
        h += `<span class="estado">Livre. O que vai fazer?</span><div class="receitas">${recs.map(rc => `<button class="bt" data-ac="iniciar" data-i="${i}" data-rec="${rc}" ${semLeite(rc) ? 'disabled' : ''}>${img(rc)}<span>${RECEITAS[rc].nome}</span>${fino ? `<span class="tecla">${tec[rc]}</span>` : ''}</button>`).join('')}</div>`;
      } else {
        const ps = RECEITAS[s.rec].passos, p = ps[s.passo], z = zona();
        const comZona = s.st === 'rodando' && s.recurso === 'mao';
        h += `<span class="rec">${img(s.rec)} ${RECEITAS[s.rec].nome}${s.perf && !s.porBia && s.passo > 0 && s.rec !== 'coado' ? ' <span style="color:var(--ouro)">★</span>' : ''}</span><div class="etapas">${ps.map((pp, k) => `<span class="etapa ${k < s.passo ? 'feita' : k === s.passo ? 'atual' : ''}">${k < s.passo ? '✓ ' : ''}${pp.nome}</span>`).join('')}</div>`;
        h += `<div class="prog">${comZona ? `<span class="zona" style="left:${z[0] * 100}%;width:${(z[1] - z[0]) * 100}%"></span><span class="cursor" data-cur="${i}"></span>` : `<i data-prog="${i}"></i>`}</div>`;
        if (s.st === 'espera_mao') h += `<button class="bt ouro slotbt" data-ac="mao" data-i="${i}"><span>${p.nome}</span><span class="tecla">${STEP_EST[p.id] ? 'no ' + EST[STEP_EST[p.id]].nome.toLowerCase() : ''}</span></button>`;
        else if (s.st === 'fila') h += `<span class="estado">${J.tarefa && J.tarefa.t === 'passo' && J.tarefa.i === i ? esc(J.txt) : R.bia && R.bia.tarefa && R.bia.tarefa.t === 'passo' && R.bia.tarefa.i === i ? 'A Bia está a caminho…' : 'Na fila de tarefas…'}</span>`;
        else if (comZona) h += `<button class="bt verde slotbt" data-ac="mao" data-i="${i}" ${s.marcou ? 'disabled' : ''}><span>${s.marcou ? (s.passoPerf ? 'No ponto!' : 'Feito') : 'Toque no verde!'}</span><span class="tecla">${fino ? 'espaço' : ''}</span></button>`;
        else if (s.st === 'espera_maq') h += `<span class="estado">Esperando a máquina liberar…</span>`;
        else if (s.st === 'rodando') h += `<span class="estado">${s.recurso === 'bia' ? 'A Bia está trabalhando…' : 'A máquina está extraindo…'}</span>`;
        else if (s.st === 'pronto') h += `<span class="estado neg">Bandeja cheia! Sirva ou jogue algo fora.</span>`;
      }
      h += `</div>`;
    });
    h += `</div></div><div class="lado">
      <div class="caixa-lado"><div class="rotulo" style="margin:0"><span>Tu</span><span>${J.fila.length ? J.fila.length + ' na fila' : 'livre'}</span></div>
        <div class="fila"><div class="chipfila ${J.fase !== 'livre' ? 'atual' : ''}"><span>${J.fase === 'livre' ? 'Parado, esperando ordens' : esc(J.txt || 'Trabalhando')}</span></div>${J.fila.map((t, k) => `<div class="chipfila"><span>${esc(textoTarefa(t))}</span><button data-ac="cancela" data-k="${k}" aria-label="Cancelar">×</button></div>`).join('')}</div>${S.energia < 30 ? '<span class="estado neg">Cansado: andando e trabalhando devagar</span>' : ''}</div>
      <div class="caixa-lado"><div class="rotulo" style="margin:0"><span>Forno</span><span>${img('pao', 'p')} vitrine: ${R.vitrine}</span></div>
        ${R.forno.st === 'assando' ? `<div class="prog"><i data-forno-prog style="background:var(--laranja)"></i></div><span class="estado">${R.forno.bia ? 'A Bia está assando' : 'Assando'} ${R.forno.qtd} pães…</span>` : `<button class="bt slotbt" data-ac="assar" ${S.estoque.massa < S.up.forno || R.forno.fila ? 'disabled' : ''}><span>${R.forno.fila ? 'Na fila…' : 'Assar ' + S.up.forno}</span><span class="tecla">${S.up.forno} massas${fino ? ' · F' : ''}</span></button>`}</div>
      <div class="caixa-lado"><div class="rotulo" style="margin:0"><span>Salão</span></div><div class="salao">${!R.lugares.length ? '<span class="estado">Fechado hoje. As mesas abrem amanhã.</span>' : S.salao.mesas.map((m, i) => { if (!m) return ''; const ss = seatsDe(i), oc = ss.filter(l => l.estado !== 'livre' && l.estado !== 'sujo').length, su = ss.filter(l => l.estado === 'sujo').length; return `<div class="mesachip ${su ? 'suja' : ''}"><span>Mesa ${i + 1} · ${oc}/${ss.length}${su ? ' · suja' : ''}</span>${su ? `<button class="bt" data-ac="limpar" data-m="${i}" ${R.mesasRT[i].limpando ? 'disabled' : ''}>${R.mesasRT[i].limpando ? 'indo…' : 'Limpar'}</button>` : ''}</div>`; }).join('')}</div></div>
</div></div>
    <div><div class="rotulo"><span>Bandeja ${R.bandeja.filter(Boolean).length}/${R.bandeja.length} · ★ perfeito</span><span class="estoque-inline"><span>${img('grao', 'p')} <b class="${S.estoque.grao < 4 ? 'neg' : ''}">${S.estoque.grao}</b></span><span>${img('leite', 'p')} <b class="${S.estoque.leite < 2 ? 'neg' : ''}">${S.estoque.leite}</b></span><span>${img('massa', 'p')} <b class="${S.estoque.massa < S.up.forno ? 'neg' : ''}">${S.estoque.massa}</b></span></span></div><div class="bandeja">`;
    R.bandeja.forEach((it, j) => { const novo = it && !R.bandejaAntes[j]; h += it ? `<div class="cel ${novo ? 'novo' : ''}">${it.p ? '<span class="estrela">★</span>' : ''}${img(it.r)}<b>${RECEITAS[it.r].nome}</b><button class="x" data-ac="descartar" data-j="${j}" aria-label="Jogar fora">×</button></div>` : `<div class="cel vazia">vazio</div>`; });
    R.bandejaAntes = R.bandeja.slice();
    h += `</div></div>${R.msg && performance.now() < R.msg.ate ? `<div class="estado" style="color:var(--laranja);font-size:15px">${esc(R.msg.t)}</div>` : ''}</div>`;
    $('#trabalho').innerHTML = h;
    const dc = $('#dica');
    if (R.tut >= 0) {
      const p = TUT[R.tut];
      dc.hidden = false;
      dc.innerHTML = `<img class="retrato" src="${retrato('cida')}" alt=""><div><div class="quem">Dona Cida <span class="tecla">passo ${R.tut + 1} de ${TUT.length}</span></div><p>${p.fala}</p>${p.botao ? `<div class="acoes"><button class="bt ouro" id="bTut">${p.botao}</button></div>` : ''}</div>`;
      const bt = $('#bTut'); if (bt) bt.onclick = tutBotao;
      if (p.alvo) { const el = $('#trabalho').querySelector(p.alvo); if (el) el.classList.add('alvo'); }
    } else if (R.dicaTemp && performance.now() < R.dicaTemp.ate) {
      dc.hidden = false;
      dc.innerHTML = `<img class="retrato" src="${retrato('voce')}" alt=""><div><div class="quem">Dica</div><p>${esc(R.dicaTemp.txt)}</p></div>`;
    } else if (S.dia === 1 && R.cidaDica && R.t < 30) {
      dc.hidden = false;
      dc.innerHTML = `<img class="retrato" src="${retrato('cida')}" alt=""><div><div class="quem">Dona Cida</div><p>Pedido com borda verde piscando já pode ser servido. Tu pode enfileirar tarefas: toca em várias coisas e o personagem faz uma depois da outra.</p></div>`;
    } else dc.hidden = true;
  }
  R.slots.forEach((s, i) => {
    if (!s.rec) return;
    const el = document.querySelector(`[data-prog="${i}"]`); if (el) { const k = s.st === 'rodando' ? s.t / s.dur : 0; el.style.width = clamp((s.passo + k) / RECEITAS[s.rec].passos.length * 100, 0, 100) + '%'; }
    const cur = document.querySelector(`[data-cur="${i}"]`); if (cur) cur.style.left = `calc(${clamp(s.t / s.dur, 0, 1) * 100}% - 2px)`;
  });
  const fp = document.querySelector('[data-forno-prog]'); if (fp) fp.style.width = clamp(R.forno.t / R.forno.dur * 100, 0, 100) + '%';
  cartoes().forEach(c => { const el = document.querySelector(`[data-pac="${c.id}"]`); if (el) { const k = c.pacMax > 900 ? 1 : clamp(c.pac / c.pacMax, 0, 1); el.style.width = k * 100 + '%'; el.style.background = k > 0.5 ? '#3aa860' : k > 0.25 ? '#d9a520' : '#d44'; } });
  if (R.msg && performance.now() >= R.msg.ate) { R.msg = null; render(); }
  if (R.dicaTemp && performance.now() >= R.dicaTemp.ate) { R.dicaTemp = null; render(); }
  if (R.cidaDica && R.t >= 30) { R.cidaDica = false; render(); }
}
$('#trabalho').addEventListener('click', e => {
  const b = e.target.closest('[data-ac]'); if (!b || b.disabled) return;
  const ac = b.dataset.ac;
  if (S.fase === 'expediente' && R && !R.pausa) {
    if (ac === 'iniciar') iniciar(+b.dataset.i, b.dataset.rec);
    else if (ac === 'mao') fazerMao(+b.dataset.i);
    else if (ac === 'assar') pedirAssar(R.jog);
    else if (ac === 'descartar') { const j = +b.dataset.j; if (R.bandeja[j]) { R.bandeja[j] = null; sfx('clique'); render(); } }
    else if (ac === 'entregar') { const c = cli(+b.dataset.id); if (c) pedirEntrega(R.jog, c); }
    else if (ac === 'anotar') { const c = cli(+b.dataset.id); if (c) pedirAnotar(R.jog, c); }
    else if (ac === 'limpar') pedirLimpar(R.jog, +b.dataset.m);
    else if (ac === 'cancela') { const t = R.jog.fila.splice(+b.dataset.k, 1)[0]; if (t) { cancelaTarefa(t); sfx('clique'); render(); } }
  } else if (S.fase === 'manha' || S.fase === 'noite') acaoMapa(b);
});
addEventListener('keydown', e => {
  const k = e.key.toLowerCase();
  if (k === 'escape') { if (!$('#veu').hidden) { if (menuAberto) fechaMenu(); return; } if (['manha', 'noite', 'expediente'].includes(S.fase)) abreMenu(); return; }
  if (!$('#veu').hidden || S.fase !== 'expediente' || !R || R.pausa) return;
  if (k === 'p') { abreMenu(); return; }
  if (k === ' ') { e.preventDefault(); const i = R.slots.findIndex(s => s.recurso === 'mao' && s.st === 'rodando'); if (i >= 0) acertaPonto(i); return; }
  if (/^[1-4]$/.test(k)) { const i = +k - 1; if (R.slots[i] && R.slots[i].rec) fazerMao(i); return; }
  const rc = { q: 'espresso', w: 'cappuccino', e: 'mocha', t: 'coado' }[k];
  if (rc) { const i = R.slots.findIndex(s => !s.rec); if (i >= 0) iniciar(i, rc); return; }
  if (k === 'f') { pedirAssar(R.jog); return; }
  const ti = 'zxcvb'.indexOf(k); if (ti >= 0) { const c = cartoes()[ti]; if (c) agirCliente(R.jog, c); }
});
$('#bDiario').onclick = () => { if (trava || S.fase === 'titulo') return; sfx('clique'); if (R && R.rodando) R.pausa = true; mostraDiario(); };
$('#bMenu').onclick = () => { if (trava || S.fase === 'titulo') return; sfx('clique'); abreMenu(); };
$('#bFase').onclick = () => { if (trava) return; sfx('clique'); if (S.fase === 'manha') abrirCafe(); else if (S.fase === 'noite') dormir(); };


$('#bFicha').onclick = () => { if (trava) return; sfx('clique'); if (R && R.rodando) R.pausa = true; modal(`<div class="sobre">Personagem</div><h2>Ficha</h2><div class="ficha" style="padding:0;gap:12px">${fichaHtml}</div><div class="rodape"><span></span><button class="bt ouro" id="bOk">Fechar</button></div>`, m => { m.querySelector('#bOk').onclick = () => { fechaModal(); if (R && R.rodando) R.pausa = false; }; }); };
