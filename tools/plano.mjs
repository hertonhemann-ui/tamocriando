#!/usr/bin/env node
/*
 * Plano de animações a partir da transcrição de um vídeo.
 *
 *   node tools/plano.mjs ler <transcricao.srt|vtt|txt> [--duracao 62] [--out transcricao.json]
 *       normaliza a transcrição (frases com tempo de cada palavra)
 *   node tools/plano.mjs prompt <transcricao.json|.srt> [--out prompt.md]
 *       monta o pedido completo (regras + catálogo + sinais + transcrição) pra colar em qualquer Claude
 *   node tools/plano.mjs validar <plano.json> [--transcricao transcricao.json]
 *       confere o plano contra o motor: ids, campos, tempo de leitura, colisões, brasa, cortes
 *   node tools/plano.mjs storyboard <plano.json> [--out storyboard.html]
 *       desenha cada animação do plano num quadro e monta a linha do tempo
 *
 * Quem lê a transcrição e decide as animações é o Claude (skill planejar-animacoes ou o prompt
 * gerado aqui). Esta ferramenta cuida do que dá pra checar sem opinião.
 */
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { pathToFileURL } from 'node:url';
import { carregarMotor, carregarSinais, ROOT } from './lib-motor.mjs';

const [, , cmd, ...rest] = process.argv;
const flag = (k) => { const i = rest.indexOf(k); return i >= 0 ? rest[i + 1] : undefined; };
const posArgs = rest.filter((a, i) => !a.startsWith('--') && !(i > 0 && rest[i - 1].startsWith('--')));

const fmtT = (s) => { const m = Math.floor(s / 60), r = s - m * 60; return String(m).padStart(2, '0') + ':' + r.toFixed(1).padStart(4, '0'); };
const nWords = (s) => String(s || '').split(/\s+/).filter(Boolean).length;
const norm = (w) => String(w).toLocaleLowerCase('pt-BR').replace(/[.,;:!?…"“”'()\[\]]/g, '');

// ---------------------------------------------------------------- transcrição
function parseTime(str, fps = 30) {
  const p = String(str).replace(',', '.').split(':');
  if (p.length === 4) return (+p[0]) * 3600 + (+p[1]) * 60 + (+p[2]) + (+p[3]) / fps;
  if (p.length === 3) return (+p[0]) * 3600 + (+p[1]) * 60 + (+p[2]);
  return (+p[0]) * 60 + (+p[1]);
}

export function lerTranscricao(raw, duracaoTotal) {
  const txt = raw.replace(/^﻿/, '').replace(/\r\n?/g, '\n');
  let seg = [];
  if (txt.includes('-->')) {
    const re = /((?:\d+:)?\d{1,2}:\d{2}[.,]\d{1,3})\s*-->\s*((?:\d+:)?\d{1,2}:\d{2}[.,]\d{1,3})[^\n]*\n([\s\S]*?)(?=\n\s*\n|$)/g;
    let m;
    while ((m = re.exec(txt))) {
      const texto = m[3].replace(/<[^>]+>/g, '').replace(/\s*\n\s*/g, ' ').trim();
      if (texto) seg.push({ t: parseTime(m[1]), fim: parseTime(m[2]), texto });
    }
  } else {
    const lines = txt.split('\n').map((l) => l.trim()).filter(Boolean);
    const re = /^\[?((?:\d+:)?\d{1,2}:\d{2}(?:[.,:]\d+)?)\]?\s*[-–:]?\s*(.*)$/;
    const stamped = lines.map((l) => re.exec(l)).filter(Boolean);
    if (stamped.length >= Math.max(2, lines.length * 0.6)) {
      stamped.forEach((m, i) => { seg.push({ t: parseTime(m[1]), texto: m[2].trim() }); });
      seg = seg.filter((s) => s.texto);
      seg.forEach((s, i) => { s.fim = i + 1 < seg.length ? seg[i + 1].t : s.t + nWords(s.texto) * 0.4; });
    } else {
      // texto corrido sem tempos: reparte pela duração informada
      if (!duracaoTotal) throw new Error('A transcrição não tem tempos. Passa --duracao <segundos> pra eu distribuir o texto.');
      const frases = txt.replace(/\s+/g, ' ').split(/(?<=[.?!…])\s+/).filter(Boolean);
      const tot = frases.reduce((a, f) => a + f.length, 0);
      let acc = 0;
      frases.forEach((f) => { const d = duracaoTotal * f.length / tot; seg.push({ t: acc, fim: acc + d, texto: f }); acc += d; });
    }
  }
  if (!seg.length) throw new Error('Não achei nenhuma fala na transcrição (SRT, VTT ou linhas "00:12 texto").');
  seg.sort((a, b) => a.t - b.t);
  seg.forEach((s, i) => { s.i = i + 1; if (!(s.fim > s.t)) s.fim = s.t + nWords(s.texto) * 0.4; });

  // tempo de cada palavra: proporcional ao tamanho dentro do trecho (estimativa)
  const palavras = [];
  seg.forEach((s) => {
    const ws = s.texto.split(/\s+/).filter(Boolean), wt = ws.map((w) => w.length + 2), tot = wt.reduce((a, b) => a + b, 0);
    let acc = s.t;
    ws.forEach((w, k) => { palavras.push({ p: w, t: +acc.toFixed(2), fim: +(acc + (s.fim - s.t) * wt[k] / tot).toFixed(2) }); acc += (s.fim - s.t) * wt[k] / tot; });
  });
  // frases: termina em . ? ! … ou quando tem pausa grande ou fica comprida
  const frases = [];
  let cur = [];
  palavras.forEach((w, i) => {
    cur.push(w);
    const prox = palavras[i + 1];
    if (/[.?!…]$/.test(w.p) || !prox || prox.t - w.fim > 0.9 || cur.length >= 32) {
      frases.push({ i: frases.length + 1, t: cur[0].t, fim: cur[cur.length - 1].fim, texto: cur.map((x) => x.p).join(' '), palavras: cur.map((x) => ({ p: x.p, t: x.t })) });
      cur = [];
    }
  });
  const dur = Math.max(duracaoTotal || 0, seg[seg.length - 1].fim);
  return { duracao: +dur.toFixed(2), palavrasTotal: palavras.length, palavrasPorSegundo: +(palavras.length / dur).toFixed(2), segmentos: seg, frases };
}

// ---------------------------------------------------------------- catálogo e prompt
function catalogo(TC) {
  const linhas = [];
  for (const t of TC.list()) {
    const campos = t.params.filter((p) => p.type !== 'curve').map((p) => {
      let d = p.key + ' (' + (p.type === 'select' ? p.options.join(' | ') : p.type + (p.min !== undefined ? ' ' + p.min + '–' + p.max : '')) + ')';
      if (p.default !== '' && p.default !== undefined && p.type !== 'select') d += ' = ' + JSON.stringify(p.default);
      else if (p.type === 'select') d += ' = ' + p.default;
      return d;
    });
    linhas.push(`### ${t.id} — ${t.name} (${t.category})\n- duração padrão ${t.duration} s, mínima ${t.minDur} s${t.cut ? ', o corte fica em ' + t.cut * 100 + '% da duração' : ''}${t.full ? ', ocupa a tela toda' : ''}\n- ${t.description}\n- Uso: ${t.uso}\n- Campos: ${campos.join('; ')}`);
  }
  return linhas.join('\n\n');
}

function montarPrompt(TC, sinais, tr) {
  const instr = fs.readFileSync(path.join(ROOT, 'tools/plano-instrucoes.md'), 'utf8');
  const sin = Object.entries(sinais.animacoes).map(([id, s]) => `- **${id}** (${s.momento}): sinais: ${s.sinais.join('; ')}. Evita: ${s.evita.join('; ')}. Dica: ${s.dica}`).join('\n');
  const mom = Object.entries(sinais.momentos).map(([k, v]) => `- ${k}: ${v}`).join('\n');
  const frases = tr.frases.map((f) => `[${fmtT(f.t)} – ${fmtT(f.fim)}] ${f.texto}`).join('\n');
  const palavras = tr.frases.map((f) => `${f.i}: ` + f.palavras.map((w) => w.t.toFixed(2)).join(',')).join('\n');
  return `${instr}\n\n---\n\n## Momentos de quem assiste\n${mom}\n\n## Regras gerais\n${JSON.stringify(sinais.regrasGerais)}\n\n## Sinais de cada animação\n${sin}\n\n## Catálogo (gerado do motor, os campos valem exatamente como estão)\n\n${catalogo(TC)}\n\n---\n\n## Transcrição\nDuração: ${tr.duracao} s · ${tr.palavrasTotal} palavras · ${tr.palavrasPorSegundo} palavras por segundo\n\n${frases}\n\n### Início de cada palavra (pra preencher "tempos" da Legenda), por frase\n${palavras}\n`;
}

// ---------------------------------------------------------------- validação
const TEXTO_CENTRAL = new Set(['legenda', 'destaque', 'manchete', 'palavra-acesa', 'tese', 'pergunta', 'marca', 'cinza-brasa', 'fluxo', 'lista', 'numero', 'virada', 'capitulo']);
const NAO_CHAMATIVAS = new Set(['legenda', 'fundo-vivo', 'queima', 'sopro', 'clarao', 'varrida', 'rasgo', 'fatias', 'contador']);

export function validarPlano(TC, sinais, plano, tr) {
  const out = [];
  const add = (nivel, cue, msg) => out.push({ nivel, cue, msg });
  const R = sinais.regrasGerais;
  const V = plano.video || {};
  const cues = plano.cues || [];
  if (plano.versao !== 1) add('aviso', null, 'versao deveria ser 1');
  if (!cues.length) add('erro', null, 'o plano não tem nenhuma cue');
  const ids = new Set();
  const iv = [];
  cues.forEach((c) => {
    const id = c.id || '?';
    if (ids.has(id)) add('erro', id, 'id repetido'); ids.add(id);
    const tpl = TC.templates[c.animacao];
    if (!tpl) { add('erro', id, `animação "${c.animacao}" não existe no banco (ids válidos: ${Object.keys(TC.templates).join(', ')})`); return; }
    if (typeof c.t !== 'number' || c.t < 0) { add('erro', id, 't precisa ser um número ≥ 0'); return; }
    const dur = typeof c.dur === 'number' ? c.dur : tpl.duration;
    if (dur < tpl.minDur) add('erro', id, `dur ${dur}s é menor que o mínimo de ${tpl.name} (${tpl.minDur}s)`);
    if (V.duracao && c.t + dur > V.duracao + 0.5) add('aviso', id, `termina em ${fmtT(c.t + dur)}, depois do fim do vídeo (${fmtT(V.duracao)})`);
    if (!c.porque) add('aviso', id, 'sem "porque": diz em uma linha por que essa animação entra aí');
    // campos
    const params = c.params || {};
    for (const [k, v] of Object.entries(params)) {
      const def = tpl.params.find((p) => p.key === k);
      if (!def) { add('aviso', id, `campo "${k}" não existe em ${tpl.id} (campos: ${tpl.params.filter((p) => p.type !== 'curve').map((p) => p.key).join(', ')})`); continue; }
      if (def.type === 'select' && !def.options.includes(v)) add('erro', id, `campo "${k}" = "${v}" não é uma opção (${def.options.join(' | ')})`);
      if (def.type === 'number' && typeof v !== 'number') add('erro', id, `campo "${k}" precisa ser número`);
      if (def.type === 'number' && typeof v === 'number' && ((def.min !== undefined && v < def.min) || (def.max !== undefined && v > def.max))) add('aviso', id, `campo "${k}" = ${v} fora de ${def.min}–${def.max}`);
      if ((def.type === 'text' || def.type === 'textarea') && typeof v !== 'string') add('erro', id, `campo "${k}" precisa ser texto`);
      if (def.type === 'curve') { if (!Array.isArray(v) || v.length !== 4) add('erro', id, `campo "${k}" precisa ser [x1,y1,x2,y2]`); }
    }
    // leitura
    // rótulos pequenos em caixa alta (TE VENDERAM, O PROCESSO...) não entram na conta de leitura
    const ehRotulo = (p) => typeof p.default === 'string' && /[A-ZÀ-Ú]/.test(p.default) && p.default === p.default.toLocaleUpperCase('pt-BR');
    const textos = tpl.params.filter((p) => (p.type === 'text' || p.type === 'textarea') && !ehRotulo(p)).map((p) => (params[p.key] !== undefined ? params[p.key] : p.default)).filter((s) => typeof s === 'string');
    if (c.animacao === 'legenda') {
      const txt = params.texto !== undefined ? params.texto : '';
      const n = nWords(txt);
      if (n && n / dur > 4.2) add('aviso', id, `${n} palavras em ${dur}s (${(n / dur).toFixed(1)}/s): rápido demais pra ler`);
      if (params.tempos) { const ts = String(params.tempos).split(/[\s,;]+/).filter(Boolean); if (ts.length !== n) add('erro', id, `"tempos" tem ${ts.length} valores e o texto tem ${n} palavras`); }
      if (!params.tempos) add('info', id, 'sem "tempos": a legenda vai distribuir as palavras por igual, e pode não casar com a voz');
    } else if (c.animacao !== 'fundo-vivo' && textos.length) {
      const n = textos.reduce((a, s) => a + nWords(s), 0);
      const preciso = n * R.leituraSegPorPalavra + R.leituraBaseSeg;
      if (n > 3 && dur < preciso * 0.85) add('aviso', id, `${n} palavras pedem ~${preciso.toFixed(1)}s de leitura e a animação dura ${dur}s`);
    }
    if (c.animacao === 'pergunta' && tr) {
      const prox = tr.frases.find((f) => f.t > c.t + 0.2 && f.t >= c.t + dur * 0.5);
      if (prox && prox.t - (c.t + dur) < -0.01 && false) add('aviso', id, 'pergunta cortada antes do respiro');
    }
    // fala x legenda
    if (c.animacao === 'legenda' && tr && params.texto) {
      const janela = tr.frases.flatMap((f) => f.palavras).filter((w) => w.t >= c.t - 0.3 && w.t <= c.t + dur + 0.3).map((w) => norm(w.p));
      const mine = String(params.texto).split(/\s+/).map(norm).filter(Boolean);
      const set = new Set(janela);
      const hit = mine.filter((w) => set.has(w)).length;
      if (mine.length && hit / mine.length < 0.6) add('aviso', id, `só ${Math.round(100 * hit / mine.length)}% das palavras da legenda aparecem na fala desse trecho`);
    }
    // passagem
    if (tpl.cut) {
      const corte = c.t + dur * tpl.cut;
      add('info', id, `o corte tem que cair em ${fmtT(corte)} (${tpl.name}, ${Math.round(tpl.cut * 100)}% da duração)`);
      if (Array.isArray(V.cortes) && V.cortes.length) {
        const perto = V.cortes.reduce((a, b) => (Math.abs(b - corte) < Math.abs(a - corte) ? b : a));
        if (Math.abs(perto - corte) > 0.25) add('aviso', id, `o corte mais próximo é ${fmtT(perto)}, a ${(perto - corte).toFixed(2)}s do meio da passagem: ajusta t pra ${(perto - dur * tpl.cut).toFixed(2)}`);
      }
    }
    if (V.estilo && /reels/i.test(V.estilo) && c.animacao === 'acender') add('aviso', id, 'Acender é abertura de vídeo longo: em Reels o gancho vem antes de qualquer vinheta');
    iv.push({ id, a: tpl.id, t: c.t, fim: c.t + dur, tpl });
  });

  // colisões
  for (let i = 0; i < iv.length; i++) for (let j = i + 1; j < iv.length; j++) {
    const A = iv[i], B = iv[j], ov = Math.min(A.fim, B.fim) - Math.max(A.t, B.t);
    if (ov <= 0.05) continue;
    const fullA = A.tpl.full || A.tpl.category === 'passagem', fullB = B.tpl.full || B.tpl.category === 'passagem';
    if (fullA && fullB) add('erro', A.id + '+' + B.id, `${A.a} e ${B.a} ocupam a tela toda ao mesmo tempo (${ov.toFixed(1)}s)`);
    else if (TEXTO_CENTRAL.has(A.a) && TEXTO_CENTRAL.has(B.a) && ov > 0.4) add('aviso', A.id + '+' + B.id, `${A.a} e ${B.a} disputam o centro por ${ov.toFixed(1)}s (uma brasa por tela): afasta no tempo ou muda "py"`);
  }
  // simultâneas
  const pts = [...new Set(iv.flatMap((x) => [x.t + 0.01]))];
  pts.forEach((p) => {
    const vivos = iv.filter((x) => x.t <= p && x.fim > p && x.a !== 'fundo-vivo');
    if (vivos.length > R.maxSimultaneas) add('aviso', vivos.map((x) => x.id).join('+'), `${vivos.length} animações ao mesmo tempo em ${fmtT(p)} (máximo recomendado: ${R.maxSimultaneas})`);
  });
  // densidade
  const dTot = V.duracao || (iv.length ? Math.max(...iv.map((x) => x.fim)) : 0);
  const chamativas = iv.filter((x) => !NAO_CHAMATIVAS.has(x.a)).length;
  if (dTot > 0) {
    const porMin = chamativas / (dTot / 60);
    if (porMin > R.maxChamativasPorMinuto) add('aviso', null, `${chamativas} animações chamativas em ${dTot.toFixed(0)}s (${porMin.toFixed(1)} por minuto, recomendado até ${R.maxChamativasPorMinuto})`);
    else add('info', null, `${chamativas} animações chamativas em ${dTot.toFixed(0)}s (${porMin.toFixed(1)} por minuto)`);
  }
  // fechamento
  const ass = iv.filter((x) => x.a === 'assinatura');
  if (ass.length > 1) add('aviso', null, 'mais de uma Assinatura no mesmo vídeo');
  if (ass.length === 1) {
    if (iv.some((x) => x.t > ass[0].t + 0.5 && x.a !== 'assinatura')) add('aviso', ass[0].id, 'tem animação depois da Assinatura: ela é o fechamento');
    if (tr) {
      const ult = tr.frases[tr.frases.length - 1].texto;
      if (/\b(segue|segue\s|salva|comenta|compartilha|se inscreve)\b/i.test(ult)) add('aviso', ass[0].id, 'a última fala pede ação (segue/salva/comenta) e a Assinatura fecha sem pedido: ou tira o pedido da fala ou troca o fechamento');
    }
  }
  // novas
  (plano.novas || []).forEach((n) => {
    ['id', 'nome', 'porque', 'descricao'].forEach((k) => { if (!n[k]) add('aviso', n.id || '?', `proposta nova sem "${k}"`); });
    if (n.baseEm && !TC.templates[n.baseEm]) add('aviso', n.id || '?', `baseEm "${n.baseEm}" não existe no banco`);
    add('info', n.id || '?', `proposta nova: ${n.nome} (${n.prioridade || 'sem prioridade'})`);
  });
  return out;
}

// ---------------------------------------------------------------- storyboard
function servir() {
  const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.ttf': 'font/ttf', '.png': 'image/png' };
  return new Promise((res) => {
    const srv = http.createServer((req, rsp) => {
      const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
      if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { rsp.writeHead(404); rsp.end(); return; }
      rsp.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' });
      fs.createReadStream(p).pipe(rsp);
    });
    srv.listen(0, '127.0.0.1', () => res(srv));
  });
}

async function storyboard(TC, plano, avisos, outFile) {
  const { chromium } = await import('playwright');
  const srv = await servir();
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(`http://127.0.0.1:${srv.address().port}/tools/render-page.html`);
  await page.evaluate(() => window.tcReady);
  const cues = (plano.cues || []).slice().sort((a, b) => a.t - b.t);
  const cards = [];
  for (const c of cues) {
    const tpl = TC.templates[c.animacao];
    if (!tpl) continue;
    const dur = c.dur || tpl.duration;
    const t = tpl.cut ? dur * tpl.cut : Math.min(dur, Math.max(tpl.thumb || 0, dur * 0.55));
    const url = await page.evaluate(async ({ id, o }) => {
      const png = window.tcFrame(id, o);
      const im = await new Promise((ok) => { const e = new Image(); e.onload = () => ok(e); e.src = png; });
      const cv = document.createElement('canvas'); cv.width = im.width; cv.height = im.height;
      cv.getContext('2d').drawImage(im, 0, 0);
      return cv.toDataURL('image/jpeg', 0.8);
    }, { id: c.animacao, o: { w: 270, h: 480, t, dur, params: c.params || {}, preview: true } });
    cards.push({ c, tpl, dur, img: url });
  }
  await browser.close(); srv.close();
  const tot = plano.video && plano.video.duracao || Math.max(...cues.map((c) => c.t + (c.dur || 4)));
  const COR = { acender: '#C8502A', marcar: '#E06A3E', virar: '#9B968E', guiar: '#EFE9DF', apontar: '#B9B3AA', texto: '#F2A27C', passagem: '#5F5952' };
  // faixas da linha do tempo (guloso)
  const lanes = [];
  const blocks = cards.map((k) => {
    let l = lanes.findIndex((end) => end <= k.c.t + 0.01);
    if (l < 0) { l = lanes.length; lanes.push(0); }
    lanes[l] = k.c.t + k.dur;
    return `<div class="blk" style="left:${(k.c.t / tot * 100).toFixed(2)}%;width:${Math.max(0.6, k.dur / tot * 100).toFixed(2)}%;top:${l * 26}px;background:${COR[k.tpl.category] || '#999'}" title="${esc(k.tpl.name)} ${fmtT(k.c.t)}">${esc(k.tpl.name)}</div>`;
  }).join('');
  const novasBlk = (plano.novas || []).map((n) => `<div class="blk nova" style="left:${((n.t || 0) / tot * 100).toFixed(2)}%;width:${Math.max(0.6, (n.dur || 3) / tot * 100).toFixed(2)}%;top:${lanes.length * 26}px" title="${esc(n.nome)}">${esc(n.nome)}</div>`).join('');
  const marcas = (plano.cenas || []).map((s) => `<div class="cena" style="left:${(s.t / tot * 100).toFixed(2)}%;width:${((s.fim - s.t) / tot * 100).toFixed(2)}%"><span>${esc(({ alivio: 'alívio', indignacao: 'indignação', esperanca: 'esperança', determinacao: 'determinação' })[s.momento] || s.momento)}</span></div>`).join('');
  const porCue = {};
  avisos.filter((a) => a.nivel !== 'info').forEach((a) => String(a.cue || '').split('+').forEach((id) => { (porCue[id] = porCue[id] || []).push(a); }));
  const cardsHtml = cards.map((k) => {
    const fl = (porCue[k.c.id] || []).map((a) => `<li class="${a.nivel}">${esc(a.msg)}</li>`).join('');
    return `<article class="card"><img src="${k.img}" alt=""><div class="meta"><div class="t">${fmtT(k.c.t)} → ${fmtT(k.c.t + k.dur)} <b>${esc(k.tpl.name)}</b></div>${k.c.fala ? `<p class="fala">“${esc(k.c.fala)}”</p>` : ''}<p>${esc(k.c.porque || '')}</p><p class="sin">${esc(k.c.sinal || '')}${k.c.confianca ? ' · confiança ' + Math.round(k.c.confianca * 100) + '%' : ''}${(k.c.alternativas || []).length ? ' · ou ' + k.c.alternativas.map(esc).join(', ') : ''}</p>${fl ? `<ul class="fl">${fl}</ul>` : ''}</div></article>`;
  }).join('');
  const novasHtml = (plano.novas || []).map((n) => `<article class="card nova"><div class="ph">nova</div><div class="meta"><div class="t">${fmtT(n.t || 0)} <b>${esc(n.nome)}</b> · ${esc(n.prioridade || '')}</div>${n.fala ? `<p class="fala">“${esc(n.fala)}”</p>` : ''}<p>${esc(n.porque || '')}</p><p>${esc(n.descricao || '')}</p><p class="sin">base: ${esc(n.baseEm || '—')}${n.campos ? ' · campos: ' + n.campos.map(esc).join(', ') : ''}</p></div></article>`).join('');
  const resumo = avisos.filter((a) => a.nivel !== 'info' && !a.cue);
  const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Plano de animações</title><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Anton&family=Inter:wght@400;600&display=swap"><style>
:root{--bg:#1A1714;--fg:#EFE9DF;--soft:#9B968E;--line:#36312C;--ember:#C8502A;--surf:#24201C}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--fg);font:14px/1.5 Inter,system-ui,sans-serif;padding:24px max(16px,env(safe-area-inset-left))}
h1{font:400 44px/1 Anton,Impact,sans-serif;text-transform:lowercase;margin:0 0 6px}.sub{color:var(--soft);margin:0 0 22px}
.tl{position:relative;border:1px solid var(--line);border-radius:6px;background:var(--surf);padding:30px 8px 8px;margin-bottom:26px;overflow:hidden}
.tl .pista{position:relative;height:${(lanes.length + (plano.novas || []).length ? lanes.length + 1 : lanes.length) * 26 + 6}px}
.blk{position:absolute;height:22px;border-radius:4px;color:#1A1714;font:600 11px/22px Inter,sans-serif;padding:0 6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.blk.nova{background:transparent;border:1px dashed var(--ember);color:var(--ember)}
.cena{position:absolute;top:0;height:100%;border-left:1px solid var(--line)}.cena span{position:absolute;top:4px;left:6px;font:600 10px Inter;letter-spacing:.14em;text-transform:uppercase;color:var(--soft)}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:18px}.card{background:var(--surf);border:1px solid var(--line);border-radius:6px;overflow:hidden;display:flex;flex-direction:column}
.card img{width:100%;display:block;aspect-ratio:9/16;object-fit:cover}.card.nova{border-style:dashed;border-color:var(--ember)}.ph{aspect-ratio:9/16;display:grid;place-items:center;color:var(--ember);font:400 42px Anton,Impact;text-transform:lowercase}
.meta{padding:10px 12px 12px;display:flex;flex-direction:column;gap:6px}.meta p{margin:0;color:var(--soft)}.meta .fala{color:var(--fg)}.t{font-variant-numeric:tabular-nums;color:var(--soft)}.t b{color:var(--fg);margin-left:6px}
.sin{font-size:12px}.fl{margin:4px 0 0;padding:0;list-style:none;display:flex;flex-direction:column;gap:4px}.fl li{font-size:12px;border-left:3px solid var(--soft);padding-left:8px}.fl .aviso{border-color:#E06A3E}.fl .erro{border-color:#ff5a3c;color:#ff9a86}
h2{font:400 28px Anton,Impact;text-transform:lowercase;margin:30px 0 12px}.res li{margin:4px 0}
</style></head><body>
<h1>${esc((plano.video && plano.video.titulo) || 'plano de animações')}</h1>
<p class="sub">${cards.length} animações${(plano.novas || []).length ? ' · ' + plano.novas.length + ' propostas novas' : ''} · ${fmtT(tot)} de vídeo${plano.video && plano.video.estilo ? ' · ' + esc(plano.video.estilo) : ''}</p>
<div class="tl">${marcas}<div class="pista">${blocks}${novasBlk}</div></div>
${resumo.length ? `<ul class="res fl">${resumo.map((a) => `<li class="${a.nivel}">${esc(a.msg)}</li>`).join('')}</ul>` : ''}
<h2>na ordem do vídeo</h2><div class="grid">${cardsHtml}</div>
${novasHtml ? `<h2>o que o banco ainda não tem</h2><div class="grid">${novasHtml}</div>` : ''}
</body></html>`;
  fs.writeFileSync(outFile, html);
}
const esc = (s) => String(s === undefined || s === null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// ---------------------------------------------------------------- main
function carregarTr(p, dur) {
  if (/\.json$/i.test(p)) return JSON.parse(fs.readFileSync(p, 'utf8'));
  return lerTranscricao(fs.readFileSync(p, 'utf8'), dur);
}

async function main() {
  if (!cmd || cmd === '-h' || cmd === '--help') { console.log(fs.readFileSync(new URL(import.meta.url), 'utf8').split('*/')[0]); return; }
  if (cmd === 'ler') {
    if (!posArgs[0]) throw new Error('uso: node tools/plano.mjs ler <transcricao>');
    const tr = carregarTr(path.resolve(posArgs[0]), Number(flag('--duracao')) || undefined);
    const out = path.resolve(flag('--out') || posArgs[0].replace(/\.[^.]+$/, '') + '.transcricao.json');
    fs.writeFileSync(out, JSON.stringify(tr, null, 2));
    console.log(`ok: ${tr.frases.length} frases, ${tr.palavrasTotal} palavras, ${tr.duracao}s (${tr.palavrasPorSegundo} palavras/s) -> ${out}`);
    return;
  }
  const TC = carregarMotor(), sinais = carregarSinais();
  if (cmd === 'prompt') {
    if (!posArgs[0]) throw new Error('uso: node tools/plano.mjs prompt <transcricao>');
    const tr = carregarTr(path.resolve(posArgs[0]), Number(flag('--duracao')) || undefined);
    const out = path.resolve(flag('--out') || 'prompt-plano.md');
    fs.writeFileSync(out, montarPrompt(TC, sinais, tr));
    console.log(`ok: pedido completo em ${out} (${(fs.statSync(out).size / 1024).toFixed(0)} KB). Cola num chat com o Claude e salva a resposta (só o JSON) como plano.json.`);
    return;
  }
  if (cmd === 'validar' || cmd === 'storyboard') {
    if (!posArgs[0]) throw new Error(`uso: node tools/plano.mjs ${cmd} <plano.json>`);
    const plano = JSON.parse(fs.readFileSync(path.resolve(posArgs[0]), 'utf8'));
    const trp = flag('--transcricao');
    const tr = trp ? carregarTr(path.resolve(trp)) : null;
    const av = validarPlano(TC, sinais, plano, tr);
    if (cmd === 'validar') {
      const ico = { erro: 'ERRO ', aviso: 'aviso', info: 'info ' };
      av.forEach((a) => console.log(`  ${ico[a.nivel]}  ${a.cue ? '[' + a.cue + '] ' : ''}${a.msg}`));
      const e = av.filter((a) => a.nivel === 'erro').length, w = av.filter((a) => a.nivel === 'aviso').length;
      console.log(`\n${e} erro(s), ${w} aviso(s), ${(plano.cues || []).length} animações, ${(plano.novas || []).length} propostas novas`);
      process.exit(e ? 1 : 0);
    }
    const out = path.resolve(flag('--out') || posArgs[0].replace(/\.json$/i, '') + '.storyboard.html');
    await storyboard(TC, plano, av, out);
    console.log('ok: storyboard em ' + out);
    return;
  }
  throw new Error('comando desconhecido: ' + cmd + ' (ler, prompt, validar, storyboard)');
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) main().catch((e) => { console.error(e.message || e); process.exit(1); });
