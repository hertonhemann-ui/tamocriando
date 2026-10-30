/* ================= MODAIS ================= */
function modal(html, monta, classe) { const v = $('#veu'); v.className = 'veu' + (classe ? ' ' + classe : ''); $('#modal').innerHTML = html; v.hidden = false; $('#modal').scrollTop = 0; if (monta) monta($('#modal')); const f = $('#modal').querySelector('button:not(:disabled)'); if (f) f.focus({ preventScroll: true }); }
function fechaModal() { $('#veu').hidden = true; }
function listaDiario(arr) { return `<ul class="diario">${arr.map(d => `<li><span class="dia">dia ${d.dia}</span>${esc(d.txt)}${d.causa ? `<span class="causa">${esc(d.causa)}</span>` : ''}</li>`).join('')}</ul>`; }
function mostraDiario() {
  modal(`<div class="sobre">Diário de causas</div><h2>O que aconteceu até aqui</h2>${S.diario.length ? listaDiario(S.diario.slice().reverse()) : '<p>Nada registrado ainda. As decisões marcantes aparecem aqui, e quando uma delas volta, o diário mostra de onde veio.</p>'}<div class="rodape"><span></span><button class="bt ouro" id="bOk">Fechar</button></div>`, m => { m.querySelector('#bOk').onclick = () => { fechaModal(); if (R && R.rodando) R.pausa = false; }; });
}
function mostraCompras() {
  trava = true;
  const q = { grao: 0, leite: 0, massa: 0 }, ups = new Set();
  const desc = 1 - 0.05 * S.hab.gestao;
  const pp = k => Math.round(PACOTES[k].preco * desc);
  const total = () => Object.keys(q).reduce((a, k) => a + q[k] * pp(k), 0) + [...ups].reduce((a, id) => a + MELHORIAS.find(m => m.id === id).preco, 0);
  const n = previsao(), nec = necessidade(n);
  const draw = () => {
    const disp = MELHORIAS.filter(m => m.req(S));
    const sobra = S.caixa - total();
    modal(`<div class="sobre">Fornecedor · gasta 1 hora</div><h2>Seu Dimas</h2>
      <div class="fala"><img class="retrato" src="${retrato('dimas')}" alt=""><div><div class="quem">Seu Dimas</div>Pra uns ${n} clientes tu vai precisar de uns ${nec.grao} de grão, ${nec.leite} de leite e ${nec.pao} pães.${S.hab.gestao ? ` Pra ti, ${S.hab.gestao * 5}% de desconto.` : ''}</div></div>
      <h4>Ingredientes</h4>
      ${Object.entries(PACOTES).map(([k, p]) => `<div class="compra">${img(p.ico)}<div>${p.nome}<small>${p.qtd} ${p.un} por ${brl(pp(k))} · tens ${S.estoque[k]} · precisa ~${k === 'massa' ? nec.pao : k === 'grao' ? nec.grao : nec.leite}</small></div><div class="qtd"><button class="bt" data-k="${k}" data-d="-1" aria-label="menos">−</button><b>${q[k]}</b><button class="bt" data-k="${k}" data-d="1" aria-label="mais">+</button></div><b>${brl(q[k] * pp(k))}</b></div>`).join('')}
      <h4>Melhorias usadas</h4>
      ${disp.length ? disp.map(m => `<div class="compra"><span></span><div>${m.nome}<small>${m.desc}</small></div><button class="bt ${ups.has(m.id) ? 'verde' : ''}" data-up="${m.id}">${ups.has(m.id) ? 'no carrinho' : 'quero'}</button><b>${brl(m.preco)}</b></div>`).join('') : '<p>Tu já comprou tudo o que ele tinha.</p>'}
      <table class="contas" style="margin-top:10px"><tr><td>Total</td><td>${brl(total())}</td></tr><tr class="total"><td>Caixa depois da compra</td><td class="${sobra < 0 ? 'neg' : sobra < PARCELA && !S.flags.parcelaPaga ? '' : 'pos'}">${brl(sobra)}</td></tr></table>
      ${!S.flags.parcelaPaga && sobra < PARCELA ? `<p class="alerta" style="font-size:14px;margin-top:8px">Depois dessa compra faltam ${brl(PARCELA - sobra)} pra parcela de sexta.</p>` : ''}
      <div class="rodape"><button class="bt" id="bVolta">Voltar sem comprar</button><button class="bt ouro" id="bCompra" ${sobra < 0 || total() === 0 ? 'disabled' : ''}>Comprar (gasta 1h)</button></div>`, m => {
      m.querySelectorAll('[data-k]').forEach(b => { b.onclick = () => { sfx('clique'); q[b.dataset.k] = Math.max(0, q[b.dataset.k] + +b.dataset.d); draw(); }; });
      m.querySelectorAll('[data-up]').forEach(b => { b.onclick = () => { sfx('clique'); const id = b.dataset.up; if (ups.has(id)) ups.delete(id); else ups.add(id); draw(); }; });
      m.querySelector('#bVolta').onclick = () => { trava = false; fechaModal(); mostraLocal(); };
      m.querySelector('#bCompra').onclick = () => {
        const tt = total(); S.caixa -= tt; S.compras += tt; sfx('caixa');
        for (const k in q) S.estoque[k] += q[k] * PACOTES[k].qtd;
        const nomes = []; ups.forEach(id => { const mm = MELHORIAS.find(x => x.id === id); mm.ef(S); nomes.push(mm.nome); });
        if (nomes.length) diario('Comprei: ' + nomes.join(', ') + '.');
        S.horas -= 1; trava = false; fechaModal(); mostraLocal(nomes.length ? 'Instalado: ' + nomes.join(', ') + '.' : 'Compras feitas.');
      };
    });
  };
  draw();
}
function proximoEvento(depois) {
  const id = fila.shift();
  if (!id) { trava = false; return depois(); }
  trava = true;
  const e = EV.find(x => x.id === id); S.vistos[id] = true;
  if (e.pre) e.pre(S);
  const tx = e.texto(S), ops = e.escolhas(S);
  const falas = (tx.falas || []).map(([q, f]) => `<div class="fala"><img class="retrato" src="${retrato(q)}" alt=""><div><div class="quem">${esc(PERS[q].nome)}</div>${esc(f)}</div></div>`).join('');
  modal(`<div class="sobre">Dia ${S.dia} · ${S.fase === 'manha' ? 'manhã' : 'fim do expediente'}</div><h2>${esc(tx.titulo)}</h2>
    ${(tx.corpo || []).map(p => `<p>${esc(p)}</p>`).join('')}${falas}
    ${tx.contexto ? `<p class="contexto">${esc(tx.contexto)}</p>` : ''}
    <div class="escolhas">${ops.map((c, i) => { const rq = c.req ? c.req(S) : { ok: true }; return `<button class="escolha" data-i="${i}" ${rq.ok ? '' : 'disabled'}><b>${esc(c.t)}</b>${c.sub ? `<span>${esc(c.sub)}</span>` : ''}${c.tags ? `<span class="tags">${esc(c.tags)}</span>` : ''}${rq.ok ? '' : `<span class="req">${esc(rq.motivo)}</span>`}</button>`; }).join('')}</div>`, m => m.querySelectorAll('.escolha').forEach(b => { b.onclick = () => {
    sfx('clique');
    const res = ops[+b.dataset.i].ef(S); normaliza(); hudSig = '';
    modal(`<div class="sobre">Consequência</div><h2>${esc(tx.titulo)}</h2><div class="fala"><img class="retrato" src="${retrato(e.quem || 'voce')}" alt=""><div>${esc(res)}</div></div><p style="color:var(--suave);font-size:15px">Registrado no diário. Algumas escolhas voltam dias depois.</p><div class="rodape"><span></span><button class="bt ouro" id="bOk">Continuar</button></div>`, m2 => { m2.querySelector('#bOk').onclick = () => proximoEvento(depois); });
  }; }));
}
function escolhePerks(depois) {
  const chave = S.perkFila.shift();
  if (!chave) return depois();
  trava = true; sfx('nivel');
  const [hab, nv] = [chave.startsWith('coz') ? 'Cozinha' : 'Atendimento', chave.slice(-1)];
  modal(`<div class="sobre">Subiu de nível</div><h2>${hab} nível ${nv}</h2><p>Escolhe uma especialidade. Ela fica contigo o resto da semana.</p>
    <div class="escolhas">${PERKS[chave].map((p, i) => `<button class="escolha" data-i="${i}"><b>★ ${esc(p.nome)}</b><span>${esc(p.desc)}</span></button>`).join('')}</div>`, m => m.querySelectorAll('.escolha').forEach(b => { b.onclick = () => { sfx('meta'); const p = PERKS[chave][+b.dataset.i]; S.perks.push(p.id); diario(`Subi ${hab.toLowerCase()} para o nível ${nv} e virei especialista: ${p.nome}.`); escolhePerks(depois); }; }));
}

