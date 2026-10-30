/* ================= ATORES, TAREFAS E LAÇO DO EXPEDIENTE ================= */
const ZONA_K = y => y < 3.1;
function rotaPara(a, to) {
  const pts = [];
  if (ZONA_K(a.y) !== ZONA_K(to.y)) { if (ZONA_K(a.y)) pts.push({ x: GAP.x, y: GAP.yk }, { x: GAP.x, y: GAP.yd }); else pts.push({ x: GAP.x, y: GAP.yd }, { x: GAP.x, y: GAP.yk }); }
  pts.push({ x: to.x, y: to.y }); return pts;
}
function destino(a, t) {
  if (t.t === 'passo') { const s = R.slots[t.i]; if (!s || !s.rec || s.st !== 'fila') return null; const e = EST[STEP_EST[RECEITAS[s.rec].passos[s.passo].id]]; return { x: e.x, y: e.y, txt: 'Indo ao ' + e.nome.toLowerCase() }; }
  if (t.t === 'assar') return { x: EST.forno.x, y: EST.forno.y, txt: 'Indo ao forno' };
  if (t.t === 'entregar' || t.t === 'anotar') {
    const c = cli(t.cid); if (!c || c.estado === 'saindo') return null;
    if (c.modo === 'balcao') return { x: SPOTS_X[c.spot], y: SERVE_Y, txt: 'Indo até ' + c.nome };
    const g = geoMesa(c.seat.mesa); return { x: g.parada.x, y: g.parada.y, txt: 'Indo à mesa ' + (c.seat.mesa + 1) };
  }
  if (t.t === 'limpar') { const g = geoMesa(t.mesa); return g ? { x: g.parada.x, y: g.parada.y, txt: 'Indo limpar a mesa ' + (t.mesa + 1) } : null; }
  if (t.t === 'volta') return { x: a.ocioX, y: a.ocioY, txt: '' };
  return null;
}
function cancelaTarefa(t) {
  if (t.t === 'passo') { const s = R.slots[t.i]; if (s && s.st === 'fila') s.st = 'espera_mao'; }
  else if (t.t === 'assar') R.forno.fila = false;
  else if (t.t === 'entregar') { const c = cli(t.cid); if (c) devolveRes(c); }
  else if (t.t === 'anotar') { const c = cli(t.cid); if (c) c.anotando = false; }
  else if (t.t === 'limpar') { if (R.mesasRT[t.mesa]) R.mesasRT[t.mesa].limpando = false; }
}
function enfileira(a, t) {
  if (!a.bia && a.fila.length >= 5) { sfx('erro'); msg('Fila cheia. Espera uma tarefa terminar.'); return false; }
  a.fila.push(t); render(); return true;
}
/* pedidos de tarefa (jogador ou Bia) */
function pedirEntrega(a, c) {
  if (!c.pedido || c.estado === 'saindo') return false;
  if (!a.bia && a.fila.length >= 5) { sfx('erro'); msg('Fila cheia. Espera uma tarefa terminar.'); return false; }
  if (!reservaItens(c)) { if (!a.bia) { sfx('erro'); msg(c.traco === 'exigente' ? c.nome + ' é exigente: precisa de bebida no ponto perfeito.' : 'Nada do pedido de ' + c.nome + ' está pronto ainda.'); } return false; }
  a.fila.push({ t: 'entregar', cid: c.id }); sfx('clique'); render(); return true;
}
function pedirAnotar(a, c) {
  if (c.anotando || c.estado !== 'sentado') return false;
  if (!enfileira(a, { t: 'anotar', cid: c.id })) return false;
  c.anotando = true; sfx('clique'); return true;
}
function pedirLimpar(a, mesa) {
  const rt = R.mesasRT[mesa]; if (!rt || rt.limpando || !seatsDe(mesa).some(l => l.estado === 'sujo')) return false;
  if (!enfileira(a, { t: 'limpar', mesa })) return false;
  rt.limpando = true; sfx('clique'); return true;
}
function pedirAssar(a) {
  if (R.forno.st !== 'idle' || R.forno.fila) return false;
  if (S.estoque.massa < S.up.forno) { if (!a.bia) { sfx('erro'); msg(`Falta massa (precisa de ${S.up.forno}).`); } return false; }
  if (!enfileira(a, { t: 'assar' })) return false;
  R.forno.fila = true; sfx('clique'); return true;
}
function agirCliente(a, c) { return c.estado === 'sentado' ? pedirAnotar(a, c) : pedirEntrega(a, c); }
function agirMesa(a, mesa) {
  const ss = seatsDe(mesa).map(l => l.cid && cli(l.cid)).filter(Boolean);
  const c1 = ss.find(c => c.estado === 'sentado' && !c.anotando); if (c1) return pedirAnotar(a, c1);
  const c2 = ss.find(c => podeEntregar(c)); if (c2) return pedirEntrega(a, c2);
  if (seatsDe(mesa).some(l => l.estado === 'sujo')) return pedirLimpar(a, mesa);
  if (ss.some(c => c.estado === 'espera')) { sfx('erro'); msg('Esse pedido ainda não está pronto. Prepare e depois toque na mesa.'); }
  return false;
}
function agirEstacao(a, id) {
  if (id === 'forno') return pedirAssar(a);
  if (id === 'maquina') { msg('A máquina extrai sozinha depois de moer.'); return false; }
  const i = R.slots.findIndex(s => s.rec && s.st === 'espera_mao' && STEP_EST[RECEITAS[s.rec].passos[s.passo].id] === id);
  if (i < 0) { msg('Nada esperando no ' + EST[id].nome.toLowerCase() + ' agora.'); return false; }
  return fazerMao(i);
}
/* etapas de mão nas bancadas */
function fazerMao(i) {
  const s = R.slots[i]; if (!s || !s.rec) return false;
  if (s.st === 'rodando' && s.recurso === 'mao') return acertaPonto(i);
  if (s.st !== 'espera_mao') return false;
  if (!enfileira(R.jog, { t: 'passo', i })) return false;
  s.st = 'fila'; sfx('clique'); render(); return true;
}
function iniciar(i, rec) {
  const s = R.slots[i];
  if (!s || s.rec) return;
  if (rec === 'mocha' && !S.flags.mocha) return;
  if (rec === 'coado' && !S.up.coador) return;
  if (semLeite(rec)) { sfx('erro'); return msg('Sem leite hoje.'); }
  const usa = RECEITAS[rec].usa;
  for (const k in usa) if (S.estoque[k] < usa[k]) { sfx('erro'); return msg(k === 'grao' ? 'Acabou o grão.' : 'Acabou o leite.'); }
  for (const k in usa) { S.estoque[k] -= usa[k]; R.stats.usou[k] += usa[k]; }
  Object.assign(s, { rec, passo: 0, st: null, t: 0, dur: 0, recurso: null, porBia: false, perf: true, marcou: false });
  sfx('clique'); preparaPasso(s); render();
}
function preparaPasso(s) {
  const p = RECEITAS[s.rec].passos[s.passo];
  if (!p) { s.st = 'pronto'; colocaBandeja(s); return; }
  s.st = p.tipo === 'mao' ? 'espera_mao' : 'espera_maq';
}
function acertaPonto(i) {
  const s = R.slots[i]; if (!s || s.recurso !== 'mao' || s.st !== 'rodando' || s.marcou) return false;
  s.marcou = true;
  const k = s.t / s.dur, [a, b] = zona(), x = R.jog.x, y = R.jog.y;
  if (k >= a && k <= b) { s.passoPerf = true; sfx('perfeito'); flutuaEm('PERFEITO!', x, y, '#72e09a'); s.t = s.dur; }
  else { s.passoPerf = false; s.perf = false; sfx('erro'); flutuaEm(k < a ? 'cedo!' : 'passou!', x, y, '#ffa64d'); s.t = Math.max(s.t, s.dur * 0.98); }
  render(); return true;
}
function fimPasso(s) {
  const a = s.recurso === 'mao' ? R.jog : R.bia;
  if (a) { a.fase = 'livre'; a.tarefa = null; a.txt = ''; }
  if (!s.marcou && !s.porBia) s.perf = false;
  s.recurso = null; s.passo++; preparaPasso(s); render();
}
function colocaBandeja(s) {
  const j = R.bandeja.indexOf(null);
  if (j < 0) { s.st = 'pronto'; return false; }
  const perf = !!s.perf && !s.porBia && s.rec !== 'coado';
  R.bandeja[j] = { r: s.rec, p: perf }; const rec = s.rec; s.rec = null; s.st = null;
  if (perf) { R.stats.perfeitos++; progMeta('perfeitos', 1); }
  if (!s.porBia) S.hab.cozXp += perf ? 3 : 2;
  if (rec === 'coado') S.rep += 0.3;
  sfx('pronto'); return true;
}
/* ---- motor do ator ---- */
function iniciaTarefa(a, t) {
  const d = destino(a, t);
  if (!d) { cancelaTarefa(t); return; }
  a.tarefa = t; a.rota = rotaPara(a, d); a.fase = 'indo'; a.txt = d.txt;
  a.carga = t.t === 'entregar' ? (cli(t.cid).res.filter(Boolean).map(x => x.it)) : [];
  if (Math.hypot(a.x - d.x, a.y - d.y) < 0.05 && a.rota.length === 1) { a.rota = []; chegou(a); }
}
function chegou(a) {
  const t = a.tarefa;
  if (t.t === 'passo') {
    const s = R.slots[t.i]; if (!s || !s.rec || s.st !== 'fila') { a.fase = 'livre'; a.tarefa = null; return; }
    const p = RECEITAS[s.rec].passos[s.passo];
    let dur = p.t * (a.bia ? biaMult() * 1.3 : maoMult()); if (p.id === 'moer' && S.up.moedor) dur *= 0.5;
    s.st = 'rodando'; s.recurso = a.bia ? 'bia' : 'mao'; s.t = 0; s.dur = dur; s.marcou = false; if (a.bia) s.porBia = true;
    a.fase = 'agindo'; a.timed = false; a.txt = p.nome + '…';
    if (!a.bia) { S.energia -= 0.4; sfx(p.id === 'vaporizar' ? 'vapor' : p.id === 'moer' ? 'moer' : 'clique'); }
    render(); return;
  }
  a.fase = 'agindo'; a.t = 0; a.timed = true;
  if (t.t === 'entregar') { a.dur = 0.4; a.txt = 'Servindo…'; }
  else if (t.t === 'anotar') { a.dur = 0.8; a.txt = 'Anotando o pedido…'; }
  else if (t.t === 'limpar') { a.dur = 1.5 + 0.4 * (seatsDe(t.mesa).filter(l => l.estado === 'sujo').length - 1); a.txt = 'Limpando a mesa…'; sfx('limpa'); }
  else if (t.t === 'assar') { a.dur = 0.5; a.txt = 'Colocando no forno…'; }
  else { a.dur = 0; a.txt = ''; }
}
function terminaAcao(a) {
  const t = a.tarefa; a.fase = 'livre'; a.tarefa = null; a.carga = []; a.txt = '';
  if (t.t === 'entregar') {
    const c = cli(t.cid);
    if (!c || c.estado === 'saindo') { if (c) devolveRes(c); render(); return; }
    c.ped.forEach((it, k) => { if (c.res[k]) { c.ok[k] = true; c.perf[k] = c.res[k].p; c.res[k] = null; } });
    sfx('clique'); c.fracEnt = c.pac / c.pacMax;
    if (c.ok.every(Boolean)) { if (c.modo === 'balcao') pagar(c); else { c.estado = 'comendo'; c.comerT = tempoComer(c); c.comerMax = c.comerT; flutuaEm('nham!', c.gx, c.gy, '#ff93c9'); } }
  } else if (t.t === 'anotar') {
    const c = cli(t.cid); if (c) c.anotando = false;
    if (c && c.estado === 'sentado') {
      c.pedido = true; c.estado = 'espera'; c.pac = Math.min(c.pacMax, c.pac + 12);
      const A = attrMesa(c.seat.mesa);
      if (Math.random() < 0.12 * A.aconchego) { const it = pick(['pao', 'espresso']); c.ped.push(it); c.ok.push(false); c.perf.push(false); c.res.push(null); flutuaEm('pediu mais!', c.gx, c.gy, '#ff93c9'); }
      sfx('anota'); flutuaEm('anotado', c.gx, c.gy, '#aaf0ff');
    }
  } else if (t.t === 'limpar') {
    if (R.mesasRT[t.mesa]) R.mesasRT[t.mesa].limpando = false;
    let n = 0; seatsDe(t.mesa).forEach(l => { if (l.estado === 'sujo') { l.estado = 'livre'; n++; } });
    if (n) { R.stats.limpas++; progMeta('limpar', 1); const g = geoMesa(t.mesa); flutuaEm('limpo!', g.tx, g.ty, '#aaf0ff'); sfx('pronto'); }
  } else if (t.t === 'assar') {
    R.forno.fila = false;
    if (S.estoque.massa >= S.up.forno && R.forno.st === 'idle') {
      S.estoque.massa -= S.up.forno; R.stats.usou.massa += S.up.forno;
      Object.assign(R.forno, { st: 'assando', t: 0, dur: FORNO_T * (S.mods.organizado ? 0.92 : 1) * (tem('fornoBom') ? 0.7 : 1) * (a.bia ? 1.15 * biaMult() : 1), qtd: S.up.forno, bia: a.bia });
    }
  }
  render();
}
function atualizaAtor(a, dt, vel) {
  if (a.fase === 'indo' && a.tarefa && a.tarefa.t === 'volta' && a.fila.length) { a.fase = 'livre'; a.tarefa = null; }
  if (a.fase === 'livre') {
    if (a.fila.length) iniciaTarefa(a, a.fila.shift());
    else if (a.bia) iaBia(a, dt);
  }
  if (a.fase === 'indo') {
    let resto = vel * dt;
    while (a.rota.length && resto > 0) {
      const w = a.rota[0], dx = w.x - a.x, dy = w.y - a.y, d = Math.hypot(dx, dy);
      const sdx = dx - dy; if (Math.abs(sdx) > 0.05) a.dir = sdx > 0 ? 1 : -1;
      if (d <= resto) { a.x = w.x; a.y = w.y; resto -= d; a.rota.shift(); } else { a.x += dx / d * resto; a.y += dy / d * resto; resto = 0; }
    }
    a.passo += dt;
    if (!a.rota.length) { if (a.tarefa.t === 'volta') { a.fase = 'livre'; a.tarefa = null; } else chegou(a); }
  } else if (a.fase === 'agindo' && a.timed) { a.t += dt; if (a.t >= a.dur) terminaAcao(a); }
}
function iaBia(a, dt) {
  a.ia += dt; if (a.ia < 0.45) return; a.ia = 0;
  const role = S.bia.papel;
  if (role === 'forno') pedirAssar(a) || 0;
  else if (role === 'moer') { const i = R.slots.findIndex(s => s.rec && s.st === 'espera_mao' && RECEITAS[s.rec].passos[s.passo].id === 'moer'); if (i >= 0) { R.slots[i].st = 'fila'; a.fila.push({ t: 'passo', i }); } }
  else if (role === 'balcao') { const c = balcaoLista().find(c => podeEntregar(c)); if (c) pedirEntrega(a, c); }
  else if (role === 'salao') {
    const mesaSuja = R.lugares.find(l => l.estado === 'sujo' && !R.mesasRT[l.mesa].limpando);
    const c1 = ativos().find(c => c.modo === 'mesa' && c.estado === 'sentado' && !c.anotando);
    const c2 = ativos().find(c => c.modo === 'mesa' && podeEntregar(c));
    if (c1) pedirAnotar(a, c1); else if (c2) pedirEntrega(a, c2); else if (mesaSuja) pedirLimpar(a, mesaSuja.mesa);
  }
  if (!a.fila.length && Math.hypot(a.x - a.ocioX, a.y - a.ocioY) > 0.4) a.fila.push({ t: 'volta' });
}
/* ---- laço do expediente ---- */
function atualizar(dt) {
  if (!R || !R.rodando || R.pausa) return;
  const tdt = R.hold ? 0 : dt;
  R.t += tdt;
  while (!R.hold && R.agenda.length && R.agenda[0].t <= R.t) spawn(R.agenda.shift());
  // bancadas
  const usando = () => R.slots.filter(s => s.rec && s.st === 'rodando' && s.recurso === 'maq').length;
  R.slots.forEach(s => {
    if (!s.rec) return;
    if (s.st === 'espera_maq' && usando() < S.up.maquina) { s.st = 'rodando'; s.recurso = 'maq'; s.t = 0; s.dur = RECEITAS[s.rec].passos[s.passo].t; render(); }
    else if (s.st === 'rodando' && s.recurso === 'maq') { s.t += dt; if (s.t >= s.dur) { s.recurso = null; s.passo++; preparaPasso(s); render(); } }
    else if (s.st === 'rodando' && (s.recurso === 'mao' || s.recurso === 'bia')) { s.t += dt; if (s.t >= s.dur) fimPasso(s); }
    else if (s.st === 'pronto') { if (colocaBandeja(s)) render(); }
  });
  const f = R.forno;
  if (f.st === 'assando') { f.t += dt; if (f.t >= f.dur) { f.st = 'idle'; R.vitrine += f.qtd; if (!f.bia) S.hab.cozXp += 2; f.bia = false; sfx('pronto'); render(); } }
  atualizaAtor(R.jog, dt, velJog());
  if (R.bia) { atualizaAtor(R.bia, dt, velBia()); if (S.bia.regime === 'meio' && R.t >= R.len / 2 && R.bia.fase === 'livre' && !R.bia.fila.length) { R.bia = null; render(); } }
  // clientes
  let esperando = 0;
  for (const c of R.clientes) {
    c.idade += dt;
    const dx = c.tx - c.gx, dy = c.ty - c.gy, d = Math.hypot(dx, dy), st = 2.4 * dt;
    if (d > 0.02) { c.dir = (dx - dy) > 0 ? 1 : -1; if (d <= st) { c.gx = c.tx; c.gy = c.ty; } else { c.gx += dx / d * st; c.gy += dy / d * st; } }
    if (d <= st + 0.02 && c.estado === 'andando') {
      if (c.modo === 'balcao') { c.estado = 'balcao'; c.pedido = true; }
      else { c.estado = 'sentado'; c.seat.estado = 'ocupado'; sfx('sentar'); dica('sentado', 'Cliente sentado: toque na mesa (ou no cartão com "?") pra anotar o pedido. Depois prepare e leve até a mesa.'); }
      render();
    }
    if (c.estado === 'balcao' || c.estado === 'sentado' || c.estado === 'espera') {
      if (c.estado === 'balcao' || c.modo === 'mesa') esperando++;
      c.pac -= tdt;
      if (c.pac <= 0) {
        R.stats.irritados++; S.rep -= 1.5; S.animo -= 4; msg(c.nome + ' cansou de esperar e foi embora.'); sfx('erro'); treme();
        flutuaEm('foi embora!', c.gx, c.gy, '#ff6e6e');
        if (tem('escudo') && R.escudo) R.escudo = false; else R.combo = 0;
        if (c.tipo === 'lucia') { S.lucia.afin -= 10; lembra('lucia_esperou', 'a Dona Lúcia foi embora sem ser atendida'); diario('A Dona Lúcia cansou de esperar e foi embora.'); }
        if (c.tipo === 'critico') { S.rep -= 10; diario('A blogueira cansou de esperar. A resenha falou mal do atendimento.'); }
        sair(c, false);
      }
    } else if (c.estado === 'comendo') { c.comerT -= tdt; if (c.comerT <= 0) pagar(c); }
  }
  R.clientes = R.clientes.filter(c => !(c.estado === 'saindo' && Math.hypot(c.tx - c.gx, c.ty - c.gy) < 0.05));
  S.energia -= tdt * 0.1; if (esperando > 3) S.animo -= tdt * 0.06;
  normaliza();
  if (R.tut >= 0) tutChecar();
  if (!R.hold && R.t >= R.len) {
    if ((!ativos().length && !R.agenda.length) || R.t >= R.len + GRACE) { ativos().forEach(c => { R.stats.irritados++; sair(c, false); }); R.agenda = []; fimExpediente(); }
  }
}
