/* ================= ESTADO ================= */
function novoEstado() {
  return {
    v: 4, dia: 1, fase: 'titulo', caixa: 300, rep: 30, preco: 'normal',
    estoque: { grao: 20, leite: 10, massa: 12 }, preassados: 0, energia: 85, animo: 70,
    hab: { cozXp: 0, atendXp: 0, gestao: 0 }, perks: [], perkFila: [],
    padrao: { cozinha: 0, social: 0, gestao: 0, descanso: 0 },
    up: { slots: 2, maquina: 1, moedor: false, coador: false, bandeja: 4, forno: 4 },
    salao: { mesas: [{ mesa: 'ferro', cad: 'plastico' }, { mesa: 'ferro', cad: 'plastico' }, null, null, null, null], decor: { parede: 'padrao', piso: 'padrao', quadro: 'nenhum', planta: 'nenhuma' } },
    bia: { contratada: false, regime: null, papel: 'forno', estresse: 20, moral: 50, saiu: false, aumento: 0 },
    lucia: { afin: 20 }, caio: { afin: 45, semVer: 0, viuHoje: false }, rafa: { afin: 0, forca: 1, acordo: null, valor: 0 },
    flags: {}, mem: {}, diario: [], agenda: [], vistos: {}, tensao: 0,
    mods: {}, amanha: {}, horas: 0, local: 'cafe', ontem: null, ultimo: null, snap: null, compras: 0,
    metas: [], estrelas: 0, estrelasDia: [], recorde: 0,
  };
}
let S = novoEstado();
let R = null, fila = [], trava = false;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const brl = n => (n < 0 ? '−' : '') + 'R$ ' + Math.abs(Math.round(n)).toLocaleString('pt-BR');
const rnd = (a, b) => a + Math.random() * (b - a);
const pick = a => a[Math.floor(Math.random() * a.length)];
const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const nivel = (xp, por) => Math.min(3, Math.floor(xp / por));
const nCoz = () => nivel(S.hab.cozXp, 60);
const nAtend = () => nivel(S.hab.atendXp, 50);
const tem = p => S.perks.includes(p);
function lembra(k, txt) { S.mem[k] = { dia: S.dia, txt }; }
function diario(txt, causa) { const m = causa && S.mem[causa]; S.diario.push({ dia: S.dia, txt, causa: m ? `dia ${m.dia}, ${m.txt}` : null }); }
function agendar(dia, id) { S.agenda.push({ dia, id }); }
function temAgenda(id) { return S.agenda.some(a => a.id === id && a.dia <= S.dia); }
function tiraAgenda(id) { S.agenda = S.agenda.filter(a => a.id !== id); }
function biaAtiva() { return S.bia.contratada && !S.bia.saiu; }
function salarioBia() { return biaAtiva() ? SAL[S.bia.regime] + S.bia.aumento : 0; }
function preco(item, normal) { return Math.round(PRECO_BASE[item] * (normal ? 1 : PRECO_MULT[S.preco])); }
function relacao(a) { return a < 0 ? 'fria' : a < 25 ? 'distante' : a < 50 ? 'cordial' : a < 75 ? 'próxima' : 'muito próxima'; }
function liberado(o) { return { fornecedor: S.dia >= 2, preco: S.dia >= 3, moveis: S.dia >= 3 || (S.dia === 2 && S.fase === 'noite'), salao: S.dia >= 2 }[o]; }
function demanda() {
  let d = (0.6 + S.rep / 100) * DEMANDA_PRECO[S.preco] * (1 - 0.06 * S.rafa.forca);
  if (S.mods.chuva) d *= 0.75; if (S.mods.showCaio) d *= 1.4; if (S.mods.caioNoRafa) d *= 0.85;
  return d;
}
function previsao() { return Math.max(6, Math.round(18 * demanda() * (1 + bonusEstilo().vol) * (1 + 0.03 * totalLugares()) * (S.mods.meioDia ? 0.5 : 1) * (S.dia === 1 ? 0.55 : 1))); }

/* ---- Salão, atributos e estilo do café ---- */
function totalLugares() { return liberado('salao') ? S.salao.mesas.reduce((a, m) => a + (m ? MESAS[m.mesa].lugares : 0), 0) : 0; }
function somaAttr(...fontes) { const o = { conforto: 0, aconchego: 0, charme: 0, giro: 0 }; fontes.forEach(f => { if (f) for (const k in f) o[k] += f[k]; }); return o; }
function attrMesa(i) { const m = S.salao.mesas[i]; return m ? somaAttr(MESAS[m.mesa].attr, CADEIRAS[m.cad].attr) : somaAttr(); }
function attrDecor() { return somaAttr(...Object.keys(S.salao.decor).map(c => (DECOR[c].opc[S.salao.decor[c]] || {}).attr)); }
function estiloCafe() {
  const cont = { rustico: 0, moderno: 0, vintage: 0, verde: 0 }; let total = 0;
  S.salao.mesas.forEach(m => { if (m) [MESAS[m.mesa], CADEIRAS[m.cad]].forEach(it => { if (it.estilo) { cont[it.estilo]++; total++; } }); });
  for (const c in S.salao.decor) { const o = DECOR[c].opc[S.salao.decor[c]]; if (o && o.estilo) { cont[o.estilo] += 2; total += 2; } }
  MELHORIAS.forEach(m => { if (m.estilo && m.tem && m.tem(S)) { cont[m.estilo]++; total++; } });
  let dom = null, max = 0; for (const k in cont) if (cont[k] > max) { max = cont[k]; dom = k; }
  const pct = total ? max / total : 0;
  return { cont, total, dom, pct, ativo: total >= 4 && pct >= 0.5, eclet: total >= 4 && pct < 0.5 };
}
function bonusEstilo() {
  const e = estiloCafe(), b = { pac: 0, vol: 0, comer: 0, fama: 0, gorj: 0, animo: 0 };
  if (e.ativo) {
    if (e.dom === 'rustico') { b.pac = 0.15; b.gorj = 1; }
    if (e.dom === 'moderno') { b.vol = 0.10; b.comer = -0.15; }
    if (e.dom === 'vintage') b.fama = 0.30;
    if (e.dom === 'verde') { b.pac = 0.10; b.animo = 6; }
  } else if (e.eclet) b.vol = 0.05;
  return b;
}
function chipsAttr(a) {
  const o = Object.entries(a).filter(([, v]) => v !== 0).map(([k, v]) => `<span class="attr ${v > 0 ? 'up' : 'dn'}" title="${esc(ATR_DESC[k])}">${ATR_NOME[k]} ${v > 0 ? '▲'.repeat(v) : '▼'.repeat(-v)}</span>`).join('');
  return o || '<span class="attr">sem atributos</span>';
}
function tagEstilo(e) { return `<span class="est ${e || 'neutro'}">${e ? ESTILOS[e].nome : 'neutro'}</span>`; }
function necessidade(n) { return { grao: Math.ceil(n * 1.0), leite: Math.ceil(n * (S.flags.mocha ? 0.6 : 0.46)), pao: Math.ceil(n * 0.42) }; }
function normaliza() {
  S.energia = clamp(S.energia, 0, 100); S.animo = clamp(S.animo, 0, 100); S.rep = clamp(S.rep, 0, 100);
  S.bia.estresse = clamp(S.bia.estresse, 0, 100); S.bia.moral = clamp(S.bia.moral, 0, 100);
  for (const k of ['lucia', 'caio', 'rafa']) S[k].afin = clamp(S[k].afin, -50, 100);
}

