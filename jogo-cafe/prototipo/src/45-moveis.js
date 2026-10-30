/* ================= MÓVEIS & CIA ================= */
function falaNair() {
  const e = estiloCafe();
  if (e.total < 4) return 'Cada peça diz uma coisa sobre o teu café. Escolhe um estilo e repete: três ou quatro peças do mesmo jeito já viram marca.';
  if (e.eclet) return 'Tá meio de tudo um pouco, hein? Tem charme de brechó, mas cliente não decora a tua identidade. Escolhe um caminho e eu te dou desconto de consultora.';
  return { rustico: 'Que cheiro de casa de vó. Madeira, poltrona e quadro de família: o povo senta e esquece da hora.', moderno: 'Linha reta, metal e vidro. Aqui ninguém se demora, mas a casa roda.', vintage: 'Retrô de verdade! Esse teu café vai aparecer em foto de todo mundo.', verde: 'Que respiro bom. Planta, vime e luz natural: a gente chega e solta o ombro.' }[e.dom];
}
function mostraMoveis() {
  trava = true;
  let aba = 'mesas', sel = null, pagou = false, aviso = '';
  const reemb = p => Math.round(p * 0.5);
  const livre = () => S.salao.mesas.findIndex(m => !m);
  const compra = (custo, aplica, diarioTxt, avisoTxt) => {
    if (S.caixa < custo) { aviso = 'Sem dinheiro no caixa pra isso.'; sfx('erro'); return draw(); }
    if (!pagou && S.horas < 1) { aviso = 'Sem tempo: a loja gasta 1 hora na primeira compra.'; sfx('erro'); return draw(); }
    S.caixa -= custo; S.compras += Math.max(0, custo); if (!pagou) { S.horas -= 1; pagou = true; }
    aplica(); if (diarioTxt) diario(diarioTxt); sfx('caixa'); aviso = avisoTxt; sel = null; hudSig = ''; fichaSig = ''; draw();
  };
  const preco$ = n => n > 0 ? brl(n) : n < 0 ? 'ganha ' + brl(-n) : 'grátis';
  const draw = () => {
    const mesas = S.salao.mesas;
    let corpo = '';
    if (aba === 'mesas') {
      if (sel) {
        const m = mesas[sel.slot], cat = sel.tipo === 'mesa' ? MESAS : CADEIRAS, atual = m ? (sel.tipo === 'mesa' ? m.mesa : m.cad) : null;
        corpo += `<h4>${sel.tipo === 'mesa' ? 'Escolhe a mesa' : 'Escolhe a cadeira'} · Posição ${sel.slot + 1}</h4>`;
        corpo += Object.entries(cat).filter(([id]) => id !== atual).map(([id, it]) => {
          const custo = it.preco - (atual ? reemb(cat[atual].preco) : 0);
          return `<div class="itemloja"><div><b>${esc(it.nome)}</b> ${tagEstilo(it.estilo)}${it.lugares ? ` <span class="attr">${it.lugares} lugares</span>` : ''}<br><small style="color:var(--suave)">${esc(it.desc || (it.tipo === 'poltrona' ? 'Estofada e larga: o cliente afunda e fica.' : it.tipo === 'banco' ? 'Alto e firme: bom pra quem tem pressa.' : 'Cadeira de uso diário.'))}</small></div><button class="bt ouro" data-mv="aplica" data-id="${id}" ${S.caixa < custo ? 'disabled' : ''}>${preco$(custo)}</button><div class="atrs">${chipsAttr(it.attr)}</div></div>`;
        }).join('');
        corpo += `<div class="rodape"><button class="bt" data-mv="cancelaSel">Voltar</button><span></span></div>`;
      } else {
        corpo += mesas.map((m, i) => {
          if (!m) return `<div class="cardslot"><h5><span>Posição ${i + 1}</span><span class="attr">vazia</span></h5><div class="botoes"><button class="bt ouro" data-mv="montar" data-i="${i}">Montar uma mesa</button></div></div>`;
          const md = MESAS[m.mesa], cd = CADEIRAS[m.cad], A = attrMesa(i);
          return `<div class="cardslot"><h5><span>Posição ${i + 1} · ${md.lugares} lugares</span><span>${tagEstilo(md.estilo)} ${tagEstilo(cd.estilo)}</span></h5><div>${esc(md.nome)} <small style="color:var(--suave)">+</small> ${esc(cd.nome)}</div><div class="atrs" style="display:flex;gap:4px;flex-wrap:wrap">${chipsAttr(A)}</div><div class="botoes"><button class="bt" data-mv="trocaMesa" data-i="${i}">Trocar mesa</button><button class="bt" data-mv="trocaCad" data-i="${i}">Trocar cadeira</button><button class="bt verm" data-mv="remove" data-i="${i}">Remover (+${brl(reemb(md.preco) + reemb(cd.preco))})</button></div></div>`;
        }).join('');
      }
    } else {
      corpo += Object.entries(DECOR).map(([cat, def]) => `<h4>${esc(def.nome)}</h4>` + Object.entries(def.opc).map(([id, o]) => {
        const atual = S.salao.decor[cat] === id, custo = o.preco - reemb(def.opc[S.salao.decor[cat]].preco);
        return `<div class="itemloja ${atual ? 'atual' : ''}"><div><b>${esc(o.nome)}</b> ${tagEstilo(o.estilo)}</div>${atual ? '<span class="attr up">em uso</span>' : `<button class="bt ouro" data-mv="decor" data-cat="${cat}" data-id="${id}" ${S.caixa < custo ? 'disabled' : ''}>${preco$(custo)}</button>`}<div class="atrs">${chipsAttr(o.attr)}</div></div>`;
      }).join('')).join('');
    }
    modal(`<div class="sobre">Móveis & Cia · a primeira compra gasta 1 hora</div><h2>Dona Nair</h2>
      <div class="fala"><img class="retrato" src="${retrato('nair')}" alt=""><div><div class="quem">Dona Nair</div>${esc(falaNair())}</div></div>
      <div class="cardslot"><h5><span>Estilo do teu café</span><span>Caixa ${brl(S.caixa)}</span></h5>${estiloHtml()}</div>
      <div class="abas"><button class="bt" data-mv="aba" data-a="mesas" aria-pressed="${aba === 'mesas'}">Mesas e cadeiras</button><button class="bt" data-mv="aba" data-a="decor" aria-pressed="${aba === 'decor'}">Decoração</button></div>
      ${aviso ? `<p class="alerta">${esc(aviso)}</p>` : ''}${corpo}
      <div class="rodape"><button class="bt ouro" data-mv="sai">Sair da loja</button><span style="color:var(--suave)">${S.horas} h livres</span></div>`, m => {
      m.querySelectorAll('[data-mv]').forEach(b => { b.onclick = () => {
        const mv = b.dataset.mv; sfx('clique'); const i = +b.dataset.i;
        if (mv === 'aba') { aba = b.dataset.a; sel = null; aviso = ''; return draw(); }
        if (mv === 'cancelaSel') { sel = null; return draw(); }
        if (mv === 'sai') { trava = false; fechaModal(); return mostraLocal(pagou ? 'Saí da Móveis & Cia com o salão mais a minha cara.' : undefined); }
        if (mv === 'montar') { sel = { slot: i, tipo: 'mesa' }; aviso = ''; return draw(); }
        if (mv === 'trocaMesa') { sel = { slot: i, tipo: 'mesa' }; aviso = ''; return draw(); }
        if (mv === 'trocaCad') { sel = { slot: i, tipo: 'cad' }; aviso = ''; return draw(); }
        if (mv === 'remove') { const m0 = mesas[i], v = reemb(MESAS[m0.mesa].preco) + reemb(CADEIRAS[m0.cad].preco); return compra(-v, () => { mesas[i] = null; }, `Tirei a ${MESAS[m0.mesa].nome.toLowerCase()} da posição ${i + 1}.`, 'Peça removida. Devolveram metade do valor.'); }
        if (mv === 'decor') { const cat = b.dataset.cat, id = b.dataset.id, def = DECOR[cat], custo = def.opc[id].preco - reemb(def.opc[S.salao.decor[cat]].preco); return compra(custo, () => { S.salao.decor[cat] = id; }, id === 'nenhum' || id === 'nenhuma' || id === 'padrao' ? null : `Troquei ${def.nome.toLowerCase()} por: ${def.opc[id].nome}.`, `${def.opc[id].nome} instalado.`); }
        if (mv === 'aplica') {
          const id = b.dataset.id, m0 = mesas[sel.slot];
          if (sel.tipo === 'mesa') { const custo = MESAS[id].preco - (m0 ? reemb(MESAS[m0.mesa].preco) : 0); return compra(custo, () => { mesas[sel.slot] = { mesa: id, cad: m0 ? m0.cad : 'plastico' }; }, `Coloquei ${MESAS[id].nome.toLowerCase()} na posição ${sel.slot + 1}.`, `${MESAS[id].nome} instalada.`); }
          const custo = CADEIRAS[id].preco - reemb(CADEIRAS[m0.cad].preco); return compra(custo, () => { m0.cad = id; }, `Troquei as cadeiras da posição ${sel.slot + 1} por: ${CADEIRAS[id].nome.toLowerCase()}.`, `${CADEIRAS[id].nome} instaladas.`);
        }
      }; });
    });
  };
  draw();
}
