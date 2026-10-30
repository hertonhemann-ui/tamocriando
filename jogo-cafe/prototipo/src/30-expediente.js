/* ================= EXPEDIENTE: ESTADO, CLIENTES, MESAS ================= */
function novoAtor(id, x, y, bia) { return { id, x, y, bia: !!bia, rota: [], fila: [], tarefa: null, fase: 'livre', t: 0, dur: 0, timed: false, carga: [], txt: '', dir: 1, passo: 0, ocioX: x, ocioY: y, ia: 0 }; }
function novoRuntime() {
  return {
    t: 0, len: DAY_LEN, rodando: false, pausa: false, tut: -1, hold: false,
    slots: [], jog: novoAtor('jog', 4.6, 2.0), bia: null, combo: 0, maxCombo: 0, escudo: true,
    forno: { st: 'idle', t: 0, dur: 0, qtd: 0, bia: false, fila: false }, vitrine: 0, bandeja: [], bandejaAntes: [],
    clientes: [], spots: [null, null, null, null, null], lugares: [], mesasRT: [], agenda: [], nid: 1, msg: null, dicaTemp: null, hover: null,
    nivIni: [nCoz(), nAtend()],
    stats: { receita: 0, gorjeta: 0, atendidos: 0, sentados: 0, limpas: 0, irritados: 0, recusados: 0, perfeitos: 0, usou: { grao: 0, leite: 0, massa: 0 }, clube: 0 },
  };
}
function maoMult() { let m = 1 - 0.08 * nCoz(); if (tem('maoRapida')) m *= 0.8; if (S.energia < 30) m *= 1.4; if (S.mods.organizado) m *= 0.92; return m; }
function zona() { return tem('pulso') ? [0.58, 0.95] : [0.68, 0.92]; }
function biaMult() { return 1 + Math.max(0, S.bia.estresse - 50) / 80; }
function velJog() { return 4.2 * (S.energia < 30 ? 0.75 : 1); }
function velBia() { return 3.4 / biaMult(); }
function msg(t) { if (R) R.msg = { t, ate: performance.now() + 2400 }; }
function dica(chave, txt) { if (R && !S.flags['dica_' + chave]) { S.flags['dica_' + chave] = true; R.dicaTemp = { txt, ate: performance.now() + 15000 }; render(); } }
function semLeite(rec) { return S.mods.semLeite && (rec === 'cappuccino' || rec === 'mocha'); }
function montaLugares() {
  const out = [];
  if (!liberado('salao')) return out;
  S.salao.mesas.forEach((m, i) => { const g = geoMesa(i); if (g) g.seats.forEach((s, k) => out.push({ mesa: i, k, gx: s.gx, gy: s.gy, lado: s.lado, estado: 'livre', cid: null })); });
  return out;
}
const seatsDe = i => R ? R.lugares.filter(l => l.mesa === i) : [];
function ativos() { return R.clientes.filter(c => c.estado !== 'saindo'); }
function cli(id) { return R ? R.clientes.find(c => c.id === id) : undefined; }
function balcaoLista() { return ativos().filter(c => c.modo === 'balcao' && c.estado === 'balcao').sort((a, b) => a.spot - b.spot); }
function cartoes() {
  const mes = ativos().filter(c => c.modo === 'mesa' && (c.estado === 'sentado' || c.estado === 'espera')).sort((a, b) => a.id - b.id);
  return balcaoLista().concat(mes);
}

function abrirCafe() {
  R = novoRuntime(); R.rodando = true;
  R.len = S.mods.meioDia ? DAY_LEN / 2 : DAY_LEN;
  R.slots = Array.from({ length: S.up.slots }, () => ({ rec: null }));
  R.bandeja = Array(S.up.bandeja).fill(null);
  R.vitrine = S.preassados; S.preassados = 0;
  R.lugares = montaLugares(); R.mesasRT = S.salao.mesas.map(() => ({ limpando: false }));
  R.biaTrab = biaAtiva() && !S.mods.biaFolga;
  if (R.biaTrab) { const pos = { forno: [EST.forno.x, EST.forno.y], moer: [EST.moedor.x, EST.moedor.y], balcao: [4.8, 2.0], salao: [9.6, 3.6] }[S.bia.papel]; R.bia = novoAtor('bia', pos[0], pos[1], true); }
  S.fase = 'expediente'; S.flags.luciaPagouAlto = false; $('#hots').innerHTML = '';
  hudSig = ''; sfx('porta');
  if (S.dia === 1) { R.tut = 0; R.hold = true; tutEntra(); } else agendarClientes(0);
  render();
}
function agendarClientes(t0) {
  const n = previsao(), span = R.len - t0 - 28;
  for (let i = 0; i < n; i++) R.agenda.push({ t: t0 + 3 + span * (i + Math.random() * 0.85) / n, tipo: 'normal' });
  if (S.lucia.afin > 5) R.agenda.push({ t: t0 + span * 0.25, tipo: 'lucia' });
  else if (!S.flags.luciaSumiu && S.flags.luciaAtendida) { S.flags.luciaSumiu = true; diario('A Dona Lúcia não veio. Disseram que ela agora toma café na padaria nova.', S.mem.lucia_preco ? 'lucia_preco' : 'lucia_esperou'); }
  if (S.mods.critico) R.agenda.push({ t: t0 + span * rnd(0.3, 0.65), tipo: 'critico' });
  if (S.mods.clube) for (let i = 0; i < 5; i++) R.agenda.push({ t: t0 + span * 0.55 + i * 1.5, tipo: 'clube' });
  R.agenda.sort((a, b) => a.t - b.t);
}
function sorteio(opts) { const tot = opts.reduce((a, o) => a + o[1], 0); let x = Math.random() * tot; for (const [i, w] of opts) if ((x -= w) <= 0) return i; return opts[0][0]; }
function gerarPedido(modo) {
  const opts = modo === 'mesa'
    ? [['espresso', 0.24], ['cappuccino', 0.24], ['pao', 0.26]].concat(S.flags.mocha ? [['mocha', 0.14]] : [], S.up.coador ? [['coado', 0.2]] : [])
    : [['espresso', 0.38], ['cappuccino', 0.32], ['pao', 0.24]].concat(S.flags.mocha ? [['mocha', 0.16]] : [], S.up.coador ? [['coado', 0.1]] : []);
  const n = modo === 'mesa' ? (Math.random() < 0.5 ? 1 : Math.random() < 0.8 ? 2 : 3) : (Math.random() < 0.7 ? 1 : 2);
  const ped = []; for (let k = 0; k < n; k++) ped.push(sorteio(opts));
  return ped.map(i => (semLeite(i) ? 'espresso' : i));
}
const PELES = ['#f1c9a5', '#e0a878', '#c98a5e', '#8d5a3b', '#6a4028'];
const CABELOS = ['#1c1c1c', '#3a2416', '#7a4a2a', '#d2a040', '#888888', '#a83a2a'];
const ROUPAS = ['#c0675a', '#5a8fc0', '#7cae6a', '#b98bd0', '#d39a4a', '#5fb3a8', '#e0e0e0', '#c77fa0', '#e07a3a'];
function spawn(a, forcado) {
  const livres = R.lugares.filter(l => l.estado === 'livre'), spot = R.spots.indexOf(null);
  let modo = a.modo;
  if (!modo) {
    const pref = { lucia: 0.7, critico: 0.85, clube: 1 }[a.tipo];
    const p = !R.lugares.length ? 0 : pref !== undefined ? pref : clamp(0.2 + 0.04 * totalLugares(), 0.2, 0.55);
    modo = Math.random() < p ? 'mesa' : 'balcao';
  }
  if (modo === 'mesa' && !livres.length) modo = 'balcao';
  if (modo === 'balcao' && spot < 0) modo = livres.length && !forcado ? 'mesa' : null;
  if (!modo) { R.stats.recusados++; S.rep -= 0.5; msg('Casa cheia: um cliente desistiu na porta.'); return; }
  const b = bonusEstilo();
  const c = { id: R.nid++, tipo: a.tipo, modo, nome: a.nome || pick(NOMES), ped: a.ped || gerarPedido(modo), pele: pick(PELES), cabelo: pick(CABELOS), cor: pick(ROUPAS), estilo: pick(['curto', 'longo', 'curto', 'rabo', 'careca', 'bone', 'topete']), traco: null, gx: PORTA.x, gy: PORTA.y, estado: 'andando', spot: -1, seat: null, pedido: false, res: [], idade: 0, anotando: false };
  let pac = 45 * PAC_PRECO[S.preco] * (S.mods.chuva ? 1.3 : 1) * (1 + 0.07 * nAtend()) * (tem('papo') ? 1.15 : 1) * (1 + b.pac);
  if (a.tipo === 'normal' && S.dia >= 2 && Math.random() < 0.3) c.traco = pick(['apressado', 'exigente', 'generoso']);
  if (c.traco === 'apressado') pac *= 0.6;
  if (a.tipo === 'lucia') { c.ped = [semLeite('cappuccino') ? 'espresso' : 'cappuccino']; c.nome = 'Dona Lúcia'; c.pers = PERS.lucia; pac = 55 * (1 + b.pac); }
  if (a.tipo === 'critico') { c.ped = ['espresso', 'pao']; c.nome = 'Blogueira'; c.pers = PERS.blog; pac = 34; c.traco = 'exigente'; }
  if (a.tipo === 'clube') { c.ped = [Math.random() < 0.6 ? (semLeite('cappuccino') ? 'espresso' : 'cappuccino') : 'pao']; c.nome = 'Crochê'; c.pele = '#efc6a6'; c.cabelo = '#cccccc'; pac = 70; }
  if (modo === 'balcao') { c.spot = spot; R.spots[spot] = c.id; c.tx = SPOTS_X[spot]; c.ty = SPOT_Y; }
  else {
    let seat;
    if (a.tipo === 'lucia') seat = livres.slice().sort((x, y) => attrMesa(y.mesa).conforto - attrMesa(x.mesa).conforto)[0];
    else if (a.tipo === 'clube') seat = livres.slice().sort((x, y) => seatsDe(y.mesa).filter(l => l.estado === 'livre').length - seatsDe(x.mesa).filter(l => l.estado === 'livre').length)[0];
    else seat = pick(livres);
    seat.estado = 'reservado'; seat.cid = c.id; c.seat = seat; c.tx = seat.gx; c.ty = seat.gy;
    const A = attrMesa(seat.mesa), D = attrDecor();
    pac = pac * 1.35 * (1 + 0.10 * (A.conforto + D.conforto) + 0.04 * A.aconchego);
  }
  if (R.tut >= 0) pac = 999;
  c.ok = c.ped.map(() => false); c.perf = c.ped.map(() => false); c.res = c.ped.map(() => null); c.pac = pac; c.pacMax = pac;
  R.clientes.push(c); sfx('porta'); render();
}
function sair(c, comeu) {
  if (c.estado === 'saindo') return;
  devolveRes(c);
  c.estado = 'saindo'; c.tx = PORTA.x; c.ty = PORTA.y; c.comeu = !!comeu;
  if (c.spot >= 0 && R.spots[c.spot] === c.id) R.spots[c.spot] = null;
  if (c.seat && c.seat.cid === c.id) { c.seat.cid = null; c.seat.estado = comeu ? 'sujo' : 'livre'; if (comeu) dica('suja', 'Mesa suja! Toque nela pra limpar. Ninguém senta enquanto estiver suja.'); }
  render();
}
/* ---- bandeja e vitrine ---- */
function itemNaBandeja(it, exigente) {
  let j = R.bandeja.findIndex(b => b && b.r === it && b.p);
  if (j < 0 && !exigente) j = R.bandeja.findIndex(b => b && b.r === it);
  return j;
}
function devolveRes(c) {
  (c.res || []).forEach((x, k) => { if (!x) return; if (x.it === 'pao') R.vitrine++; else { const j = R.bandeja.indexOf(null); if (j >= 0) R.bandeja[j] = { r: x.it, p: x.p }; } c.res[k] = null; });
}
function podeEntregar(c) { return c.pedido && (c.estado === 'balcao' || c.estado === 'espera') && c.ped.some((it, k) => !c.ok[k] && !c.res[k] && (it === 'pao' ? R.vitrine > 0 : itemNaBandeja(it, c.traco === 'exigente') >= 0)); }
function reservaItens(c) {
  let n = 0;
  c.ped.forEach((it, k) => {
    if (c.ok[k] || c.res[k]) return;
    if (it === 'pao') { if (R.vitrine > 0) { R.vitrine--; c.res[k] = { it, p: true }; n++; } }
    else { const j = itemNaBandeja(it, c.traco === 'exigente'); if (j >= 0) { c.res[k] = { it, p: R.bandeja[j].p }; R.bandeja[j] = null; n++; } }
  });
  return n;
}
/* ---- pagamento ---- */
function tempoComer(c) {
  const A = attrMesa(c.seat.mesa), b = bonusEstilo();
  return clamp(7 * (1 - 0.12 * A.giro) * (1 + 0.12 * A.aconchego) * (1 + b.comer), 3, 16);
}
function pagar(c) {
  const normal = c.tipo === 'lucia' && S.flags.luciaPrecoAntigo, b = bonusEstilo();
  let total = c.ped.reduce((a, i) => a + preco(i, normal), 0) + (c.traco === 'apressado' ? 2 : 0);
  const frac = c.pacMax > 900 ? 1 : (c.fracEnt !== undefined ? c.fracEnt : c.pac / c.pacMax);
  const bom = frac > 0.35;
  if (bom) { R.combo++; R.maxCombo = Math.max(R.maxCombo, R.combo); progMeta('combo', R.combo, true); } else R.combo = 0;
  const mult = multCombo(R.combo);
  const nPerf = c.ped.filter((it, k) => it !== 'pao' && it !== 'coado' && c.perf[k]).length;
  const A = c.seat ? attrMesa(c.seat.mesa) : somaAttr(), D = attrDecor();
  let gorj = frac > 0.6 ? Math.round(rnd(0, 2)) : 0;
  gorj += nPerf * (tem('caprichoso') ? 2 : 1);
  if (gorj > 0 && tem('sorriso')) gorj += 1;
  if (c.modo === 'mesa') gorj += Math.round((A.conforto + D.conforto) * 0.6) + b.gorj;
  if (c.traco === 'generoso') gorj = Math.max(2, gorj * 2);
  gorj = Math.round(gorj * mult);
  let extra = 0;
  if (c.modo === 'mesa' && A.aconchego > 0 && Math.random() < 0.12 * A.aconchego) { extra = 3; }
  S.caixa += total + gorj + extra; R.stats.receita += total + extra; R.stats.gorjeta += gorj; R.stats.atendidos++;
  const famaMult = (1 + b.fama) * (tem('bocaBoca') ? 1.5 : 1) * (1 + 0.1 * (A.charme + D.charme * 0.5));
  S.rep += (bom ? 0.45 : 0.15) * famaMult; S.animo += bom ? 1 : 0; S.hab.atendXp += 4;
  c.feliz = bom;
  progMeta('atender', 1); progMeta('gorjeta', gorj);
  if (c.modo === 'mesa') { R.stats.sentados++; progMeta('sentados', 1); }
  c.ped.forEach(it => { if (it === 'cappuccino') progMeta('capps', 1); if (it === 'mocha') progMeta('mochas', 1); });
  const gx = c.gx, gy = c.gy;
  flutuaEm('+' + brl(total + gorj + extra), gx, gy, '#ffcc4d');
  if (extra) setTimeout(() => flutuaEm('sobremesa!', gx, gy + 0.3, '#ff93c9'), 250);
  if (bom && R.combo >= 3 && (R.combo % 3 === 0 || R.combo >= 10)) { flutuaEm('COMBO x' + R.combo, gx, gy - 0.6, '#ff7a3a', true); sfx('combo', R.combo); } else sfx('caixa');
  if (c.tipo === 'lucia') {
    S.lucia.afin += frac > 0.5 ? 6 : 2;
    if (!S.flags.luciaAtendida) { S.flags.luciaAtendida = true; diario('Conheci a Dona Lúcia, cliente da época da Dona Cida. Pede cappuccino no meio da manhã.'); }
    if (S.preco === 'alto' && !normal) S.flags.luciaPagouAlto = true;
    if (S.mods.semLeite) S.lucia.afin -= 3;
    if (c.seat && A.conforto >= 3) { S.lucia.afin += 4; if (!S.flags.luciaPoltrona) { S.flags.luciaPoltrona = true; diario('A Dona Lúcia sentou numa poltrona e disse que agora essa é a cadeira dela.'); } }
  }
  if (c.tipo === 'critico') { S.rep += frac > 0.4 ? 10 : 3; diario(frac > 0.4 ? 'A blogueira foi atendida rápido e com tudo no ponto. A resenha elogiou o café.' : 'A blogueira esperou. A resenha saiu morna.'); }
  if (c.tipo === 'clube') { S.lucia.afin += 2; R.stats.clube++; }
  sair(c, c.modo === 'mesa');
}
function multCombo(n) { return n >= 10 ? 2 : n >= 6 ? 1.5 : n >= 3 ? 1.25 : 1; }
