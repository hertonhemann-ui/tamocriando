/* ================= MENU, SALVAR E CARREGAR ================= */
const AUTO_KEY = 'cafe-cantinho-v4-auto';
const slotKey = i => 'cafe-cantinho-v4-slot' + i;
function lerSave(key) { try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch (e) { return null; } }
function podeSalvar() { return S.fase === 'manha' || S.fase === 'noite'; }
function gravar(key) {
  if (!podeSalvar()) return false;
  try { localStorage.setItem(key, JSON.stringify({ S, quando: Date.now(), resumo: `Dia ${S.dia} · ${NOME_DIA[S.dia - 1]} · ${S.fase === 'manha' ? 'manhã' : 'noite'} · ${brl(S.caixa)}` })); return true; } catch (e) { return false; }
}
function autosave() { gravar(AUTO_KEY); }
function quandoTxt(ms) { const d = new Date(ms); return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }); }
function maisRecente() { return [AUTO_KEY, slotKey(1), slotKey(2), slotKey(3)].map(k => ({ k, d: lerSave(k) })).filter(x => x.d).sort((a, b) => b.d.quando - a.d.quando)[0]; }
function carregar(key) {
  const d = lerSave(key); if (!d) return;
  S = Object.assign(novoEstado(), d.S); R = null; trava = false; fila = []; menuAberto = false;
  fechaModal(); sfx('porta'); hudSig = ''; fichaSig = '';
  if (S.fase !== 'noite') S.fase = 'manha';
  mostraLocal(null);
}
let menuAberto = false;
function abreMenu() {
  menuAberto = true;
  if (R && R.rodando) R.pausa = true;
  const noExp = S.fase === 'expediente';
  modal(`<div class="sobre">${noExp ? 'Pausado' : 'Menu'}</div><h2>Café Cantinho</h2>
    <div class="menu-botoes">
      <button class="bt ouro grande" id="mVolta">${noExp ? 'Voltar ao expediente' : 'Voltar ao jogo'}</button>
      <button class="bt" id="mSalvar" ${podeSalvar() ? '' : 'disabled'}>Salvar</button>
      ${podeSalvar() ? '' : '<p class="dica-geral" style="text-align:center">Dá pra salvar de manhã ou à noite. O jogo também salva sozinho no começo de cada manhã e de cada noite.</p>'}
      <button class="bt" id="mCarregar">Carregar</button>
      <button class="bt" id="mSom">Som: ${prefs.som ? 'ligado' : 'desligado'}</button>
      <button class="bt" id="mSair">Sair para o menu principal</button>
      <button class="bt verm" id="mFechar">Fechar o jogo</button>
    </div>`, m => {
    m.querySelector('#mVolta').onclick = fechaMenu;
    m.querySelector('#mSalvar').onclick = () => telaSlots('salvar', abreMenu);
    m.querySelector('#mCarregar').onclick = () => telaSlots('carregar', abreMenu);
    m.querySelector('#mSom').onclick = () => { prefs.som = !prefs.som; salvaPrefs(); sfx('clique'); abreMenu(); };
    m.querySelector('#mSair').onclick = () => confirma('Sair para o menu principal?', podeSalvar() ? 'O que não foi salvo desde o último salvamento se perde. Quer salvar antes?' : 'O expediente de hoje não fica salvo. Tu volta ao último salvamento.', podeSalvar() ? [['Salvar e sair', () => { autosave(); mostraTitulo(); }], ['Sair sem salvar', mostraTitulo]] : [['Sair', mostraTitulo]], abreMenu);
    m.querySelector('#mFechar').onclick = () => confirma('Fechar o jogo?', podeSalvar() ? 'O jogo salva automaticamente antes de fechar.' : 'O expediente de hoje não fica salvo.', [['Fechar', () => { if (podeSalvar()) autosave(); telaFechado(); }]], abreMenu);
  });
}
function fechaMenu() { menuAberto = false; fechaModal(); if (R && R.rodando) R.pausa = false; sfx('clique'); }
function confirma(titulo, texto, opcoes, voltar) {
  modal(`<div class="sobre">Confirmar</div><h2>${esc(titulo)}</h2><p>${esc(texto)}</p><div class="menu-botoes">${opcoes.map((o, i) => `<button class="bt ${i === 0 ? 'ouro' : ''}" data-i="${i}">${esc(o[0])}</button>`).join('')}<button class="bt" id="cVolta">Voltar</button></div>`, m => {
    m.querySelectorAll('[data-i]').forEach(b => { b.onclick = () => { sfx('clique'); opcoes[+b.dataset.i][1](); }; });
    m.querySelector('#cVolta').onclick = () => { sfx('clique'); voltar(); };
  });
}
function telaSlots(modo, voltar) {
  const linhas = (modo === 'carregar' ? [[AUTO_KEY, 'Automático']] : []).concat([1, 2, 3].map(i => [slotKey(i), 'Espaço ' + i]));
  let pendente = null;
  const draw = () => modal(`<div class="sobre">${modo === 'salvar' ? 'Salvar' : 'Carregar'}</div><h2>${modo === 'salvar' ? 'Onde salvar?' : 'Qual jogo abrir?'}</h2><div class="slotsave">${linhas.map(([k, nome]) => { const d = lerSave(k); const conf = pendente === k; return `<button class="bt ${conf ? 'ouro' : ''}" data-k="${k}" ${modo === 'carregar' && !d ? 'disabled' : ''}><span>${nome}<br><small>${d ? esc(d.resumo) : 'vazio'}</small></span><small>${conf ? 'tocar de novo para sobrescrever' : d ? quandoTxt(d.quando) : ''}</small></button>`; }).join('')}</div><div class="rodape"><span></span><button class="bt" id="sVolta">Voltar</button></div>`, m => {
    m.querySelectorAll('[data-k]').forEach(b => { b.onclick = () => {
      const k = b.dataset.k; sfx('clique');
      if (modo === 'carregar') return carregar(k);
      if (lerSave(k) && pendente !== k) { pendente = k; return draw(); }
      if (gravar(k)) { sfx('meta'); modal(`<div class="sobre">Salvo</div><h2>Jogo salvo</h2><p>${esc(lerSave(k).resumo)}</p><div class="rodape"><span></span><button class="bt ouro" id="okS">Continuar</button></div>`, m2 => { m2.querySelector('#okS').onclick = voltar; }); }
      else modal(`<div class="sobre">Erro</div><h2>Não deu para salvar</h2><p>Este navegador não está deixando guardar dados (janela anônima ou armazenamento bloqueado).</p><div class="rodape"><span></span><button class="bt" id="okS">Voltar</button></div>`, m2 => { m2.querySelector('#okS').onclick = voltar; });
    }; });
    m.querySelector('#sVolta').onclick = () => { sfx('clique'); voltar(); };
  });
  draw();
}
function telaFechado() {
  S = novoEstado(); R = null; menuAberto = false; trava = true; hudSig = '';
  $('#trabalho').innerHTML = ''; $('#dica').hidden = true; hotspots();
  modal(`<div class="menu-titulo" style="font-size:22px">ATÉ A PRÓXIMA</div><p class="menu-sub">O Café Cantinho fechou as portas por hoje.</p><div class="menu-botoes"><button class="bt ouro" id="fAbre">Abrir o jogo de novo</button></div>`, m => { m.querySelector('#fAbre').onclick = mostraTitulo; });
}
function mostraTitulo() {
  S = novoEstado(); S.fase = 'titulo'; trava = false; R = null; hudSig = ''; menuAberto = false; fila = [];
  $('#trabalho').innerHTML = ''; $('#dica').hidden = true; hotspots();
  const ult = maisRecente();
  modal(`<div class="menu-titulo">CAFÉ<br>CANTINHO</div><p class="menu-sub">Um café pequeno. Uma semana. Uma vida inteira pela frente.</p>
    <div class="menu-botoes">
      ${ult ? `<button class="bt ouro grande" id="tCont">Continuar<br><small style="font-family:var(--f-txt);font-size:13px;font-weight:400">${esc(ult.d.resumo)}</small></button>` : ''}
      <button class="bt ${ult ? '' : 'ouro grande'}" id="tNovo">Novo jogo</button>
      <button class="bt" id="tCarregar" ${ult ? '' : 'disabled'}>Carregar</button>
      <button class="bt" id="tSom">Som: ${prefs.som ? 'ligado' : 'desligado'}</button>
      <button class="bt verm" id="tFechar">Fechar</button>
    </div>`, m => {
    const c = m.querySelector('#tCont'); if (c) c.onclick = () => carregar(ult.k);
    m.querySelector('#tNovo').onclick = () => { sfx('porta'); introNovo(); };
    m.querySelector('#tCarregar').onclick = () => telaSlots('carregar', mostraTitulo);
    m.querySelector('#tSom').onclick = () => { prefs.som = !prefs.som; salvaPrefs(); sfx('clique'); mostraTitulo(); };
    m.querySelector('#tFechar').onclick = telaFechado;
  }, 'titulo');
}
function introNovo() {
  modal(`<div class="sobre">Novo jogo</div><h2>A chave do café</h2>
    <div class="fala"><img class="retrato" src="${retrato('cida')}" alt=""><div><div class="quem">Dona Cida</div>Trinta anos atrás desse balcão. Agora é tua vez. Tu me pagou a entrada, e a primeira parcela de <b style="color:var(--ouro)">R$ 400</b> fica pra sexta. Amanhã eu fico contigo e te mostro tudo.</div></div>
    <p>Tu comprou o café da Dona Cida com quase tudo o que tinha. Sobraram R$ 300. Cinco dias para pagar a parcela, conquistar o bairro e não perder a própria vida no processo.</p>
    <div class="rodape"><button class="bt" id="iVolta">Voltar</button><button class="bt ouro grande" id="iBora">Começar</button></div>`, m => {
    m.querySelector('#iVolta').onclick = mostraTitulo;
    m.querySelector('#iBora').onclick = () => { S = novoEstado(); iniciarDia(); };
  });
}

