#!/usr/bin/env node
/*
 * Estúdio de shorts: roteiro → plano → vídeo.
 *
 *   node tools/estudio.mjs dirigir  estudio/producoes/<id>/roteiro.json   escolhe animação, tempo e texto (gera plano.json) e valida
 *   node tools/estudio.mjs montar   estudio/producoes/<id> [--scale 1]    renderiza o motor, mistura som e entrega final.mp4 + capa.jpg
 *   node tools/estudio.mjs pauta                                          sorteia a semana a partir da estratégia e da memória
 *
 * A decisão criativa (o que dizer) é do roteiro. O que se resolve com regra (tempo de leitura, colisão,
 * ordem, som, formato de entrega) é daqui.
 */
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import { carregarMotor, carregarSinais, ROOT } from './lib-motor.mjs';
import { validarPlano } from './plano.mjs';

const [, , cmd, alvo, ...rest] = process.argv;
const flag = (k, d) => { const i = rest.indexOf(k); return i >= 0 ? rest[i + 1] : d; };
const nPal = (s) => String(s || '').split(/\s+/).filter(Boolean).length;
const FPS = 30;

// ---------------------------------------------------------------- direção
const MAPA = {
  pergunta: (b) => ({ animacao: 'pergunta', params: { pergunta: b.pergunta, destaque: b.destaque || '', fundo: 'tinta', respiro: 'sim' }, extra: 1.5 }),
  contraste: (b) => ({ animacao: 'cinza-brasa', params: { rotuloA: b.rotuloA, a: b.a, rotuloB: b.rotuloB, b: b.b, frase: '', fundo: 'tinta' } }),
  tese: (b) => ({ animacao: 'tese', params: { rotulo: b.rotulo || '', texto: b.texto, destaque: b.destaque || '', tema: b.tema || 'papel', assinatura: 'não' } }),
  palavra: (b) => ({ animacao: 'palavra-acesa', params: { linha1: b.linha1, destaque: b.destaque, linha2: b.linha2 || '', posicao: 'centro' } }),
  virada: (b) => ({ animacao: 'virada', params: { rotuloA: b.rotuloA, a: b.a, rotuloB: b.rotuloB, b: b.b } }),
  lista: (b) => ({ animacao: 'lista', params: { titulo: b.titulo, itens: (b.itens || []).join('\n') } }),
  marca: (b) => ({ animacao: 'marca', params: { antes: b.antes, palavra: b.palavra, fundo: 'tinta' } }),
  fecho: (b) => ({ animacao: 'assinatura', params: { frase: b.frase, destaque: b.destaque || '', fundo: 'tinta' }, fixo: 4.6 })
};

export function dirigir(TC, sinais, roteiro) {
  const R = sinais.regrasGerais;
  const avisos = [];
  let t = 0.1;
  const cues = roteiro.beats.map((b, i) => {
    const m = MAPA[b.tipo];
    if (!m) throw new Error(`beat ${i + 1}: tipo "${b.tipo}" desconhecido (${Object.keys(MAPA).join(', ')})`);
    const d = m(b);
    const tpl = TC.templates[d.animacao];
    const palavras = Object.entries(d.params).filter(([k, v]) => typeof v === 'string' && !/^rotulo/.test(k) && !['fundo', 'tema', 'posicao', 'respiro', 'assinatura'].includes(k)).reduce((a, [, v]) => a + nPal(v), 0);
    const dur = +(d.fixo || Math.max(tpl.minDur, palavras * R.leituraSegPorPalavra + R.leituraBaseSeg + (d.extra || 0))).toFixed(2);
    const cue = { id: 'c' + String(i + 1).padStart(2, '0'), t: +t.toFixed(2), dur, animacao: d.animacao, params: d.params, fala: '', sinal: b.tipo, porque: b.porque || 'beat ' + b.tipo + ' do roteiro' };
    t += dur + 0.1;
    return cue;
  });
  const fim = cues[cues.length - 1].t + cues[cues.length - 1].dur;
  const plano = { versao: 1, video: { titulo: roteiro.titulo, duracao: +fim.toFixed(2), formato: '9:16', estilo: 'short' }, cenas: [], cues, novas: [] };
  return { plano, avisos };
}

// ---------------------------------------------------------------- som (síntese procedural, sem dependência)
function sintetizarSom(plano, dest) {
  const SR = 44100, N = Math.ceil((plano.video.duracao + 0.6) * SR);
  const L = new Float32Array(N), Rr = new Float32Array(N);
  let seed = 7; const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296) * 2 - 1;
  // drone: duas notas graves levemente desafinadas, respirando devagar
  for (let i = 0; i < N; i++) {
    const s = i / SR, lfo = 0.6 + 0.4 * Math.sin(2 * Math.PI * 0.11 * s);
    const v = (Math.sin(2 * Math.PI * 55 * s) * 0.5 + Math.sin(2 * Math.PI * 82.6 * s) * 0.3 + Math.sin(2 * Math.PI * 110.4 * s) * 0.12) * 0.22 * lfo;
    L[i] += v; Rr[i] += v;
  }
  // crepitar de brasa: estalos curtos e aleatórios
  for (let k = 0; k < plano.video.duracao * 7; k++) {
    const p = Math.floor(Math.abs(rnd()) * (N - 2000)), g = 0.05 + Math.abs(rnd()) * 0.1, pan = rnd();
    for (let j = 0; j < 1400; j++) { const e = Math.exp(-j / 160) * rnd() * g; L[p + j] += e * (1 - pan * 0.5); Rr[p + j] += e * (1 + pan * 0.5); }
  }
  // sopro (ruído filtrado) na entrada de cada animação e batida grave na tese e no fecho
  for (const c of plano.cues) {
    const p = Math.floor(c.t * SR); let lp = 0;
    for (let j = 0; j < SR * 0.7 && p + j < N; j++) { const x = j / (SR * 0.7), env = Math.sin(Math.PI * x) ** 2 * 0.1; lp += (rnd() - lp) * (0.03 + 0.25 * x); L[p + j] += lp * env; Rr[p + j] += lp * env; }
    if (['tese', 'assinatura', 'marca'].includes(c.animacao)) {
      const q = Math.floor((c.t + 0.5) * SR);
      for (let j = 0; j < SR * 0.9 && q + j < N; j++) { const s = j / SR, v = Math.sin(2 * Math.PI * (48 + 40 * Math.exp(-s * 9)) * s) * Math.exp(-s * 4.5) * 0.55; L[q + j] += v; Rr[q + j] += v; }
    }
  }
  const out = Buffer.alloc(N * 4);
  const fade = (i) => Math.min(1, i / (SR * 0.4), (N - i) / (SR * 0.6));
  for (let i = 0; i < N; i++) {
    out.writeInt16LE(Math.max(-32767, Math.min(32767, Math.tanh(L[i] * 1.2) * fade(i) * 32767)), i * 4);
    out.writeInt16LE(Math.max(-32767, Math.min(32767, Math.tanh(Rr[i] * 1.2) * fade(i) * 32767)), i * 4 + 2);
  }
  const h = Buffer.alloc(44);
  h.write('RIFF', 0); h.writeUInt32LE(36 + out.length, 4); h.write('WAVEfmt ', 8); h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(2, 22);
  h.writeUInt32LE(SR, 24); h.writeUInt32LE(SR * 4, 28); h.writeUInt16LE(4, 32); h.writeUInt16LE(16, 34); h.write('data', 36); h.writeUInt32LE(out.length, 40);
  fs.writeFileSync(dest, Buffer.concat([h, out]));
}

// ---------------------------------------------------------------- montagem
const ff = (args) => { const r = spawnSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args], { stdio: 'inherit' }); if (r.status !== 0) throw new Error('ffmpeg falhou'); };

async function montar(dir) {
  const plano = JSON.parse(fs.readFileSync(path.join(dir, 'plano.json'), 'utf8'));
  const escala = Number(flag('--scale', 1));
  const W = Math.round(1080 * escala), H = Math.round(1920 * escala);
  const { chromium } = await import('playwright');
  const srv = http.createServer((req, res) => {
    const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
    if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
    res.writeHead(200); fs.createReadStream(p).pipe(res);
  });
  await new Promise((r) => srv.listen(0, '127.0.0.1', r));
  const browser = await chromium.launch();
  const page = await browser.newPage();
  page.on('pageerror', (e) => console.error('[página]', e.message));
  await page.goto(`http://127.0.0.1:${srv.address().port}/tools/render-page.html`);
  await page.evaluate(() => window.tcReady);
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'estudio-'));
  const render = async (nome, id, params, dur, w, h, fx) => {
    const d = path.join(tmp, nome); fs.mkdirSync(d);
    const n = Math.round(dur * FPS);
    for (let i = 0; i < n; i++) {
      const url = await page.evaluate(({ id, o }) => window.tcFrame(id, o), { id, o: { w, h, t: i / FPS, dur, params, fx: fx ? { ui: { blur: 0.5, aberration: 25, lens: 15, edge: 35, noise: 18, displace: 0, samples: 4 }, fps: FPS } : undefined } });
      fs.writeFileSync(path.join(d, `f_${String(i).padStart(5, '0')}.png`), Buffer.from(url.split(',')[1], 'base64'));
    }
    return d;
  };
  const total = plano.video.duracao + 0.5;
  process.stdout.write('fundo… ');
  const bgDir = await render('bg', 'fundo-vivo', { tema: 'tinta', brilho: 'canto', brasas: 'sim', cinza: 'sim' }, 10, Math.round(W / 2), Math.round(H / 2), false);
  const dirs = [];
  for (const c of plano.cues) { process.stdout.write(`${c.id}(${c.animacao})… `); dirs.push(await render(c.id, c.animacao, c.params, c.dur, W, H, true)); }
  console.log();
  await browser.close(); srv.close();

  sintetizarSom(plano, path.join(tmp, 'som.wav'));
  const inputs = ['-stream_loop', '-1', '-framerate', String(FPS), '-i', path.join(bgDir, 'f_%05d.png')];
  dirs.forEach((d) => inputs.push('-framerate', String(FPS), '-i', path.join(d, 'f_%05d.png')));
  inputs.push('-i', path.join(tmp, 'som.wav'));
  let fc = `[0:v]scale=${W}:${H}:flags=bicubic,format=yuv420p[b0]`;
  plano.cues.forEach((c, i) => { fc += `;[${i + 1}:v]format=rgba,setpts=PTS-STARTPTS+${c.t}/TB[o${i}];[b${i}][o${i}]overlay=eof_action=pass:format=auto[b${i + 1}]`; });
  const n = plano.cues.length;
  fc += `;[b${n}]format=yuv420p[v];[${n + 1}:a]loudnorm=I=-16:TP=-1.5:LRA=11[a]`;
  const final = path.join(dir, 'final.mp4');
  ff([...inputs, '-filter_complex', fc, '-map', '[v]', '-map', '[a]', '-t', String(total), '-r', String(FPS), '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', final]);
  const capa = plano.cues.find((c) => c.animacao === 'tese') || plano.cues[0];
  ff(['-ss', String(capa.t + capa.dur * 0.55), '-i', final, '-frames:v', '1', '-q:v', '2', path.join(dir, 'capa.jpg')]);
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log('pronto:', path.relative(ROOT, final));
}

// ---------------------------------------------------------------- pauta
function pauta() {
  const e = JSON.parse(fs.readFileSync(path.join(ROOT, 'estudio/estrategia.json'), 'utf8'));
  const memPath = path.join(ROOT, 'estudio/memoria.json');
  const mem = fs.existsSync(memPath) ? JSON.parse(fs.readFileSync(memPath, 'utf8')) : { pesos: {} };
  const dias = ['seg', 'qua', 'sex', 'dom'], out = [];
  const pil = e.pilares.map((p) => ({ ...p, peso: mem.pesos?.[p.id] ?? 1 }));
  for (let i = 0; i < e.cadencia.porSemana; i++) {
    const rod = pil.slice().sort((a, b) => (b.peso + (i === 0 ? 0 : 0)) - a.peso);
    const p = rod[i % rod.length];
    out.push({ dia: dias[i], hora: e.cadencia.janelas[i % e.cadencia.janelas.length], pilar: p.id, ancora: p.ancora, funil: i < Math.round(e.cadencia.porSemana * e.funil.mix.topo) ? 'topo' : 'meio' });
  }
  console.log(JSON.stringify({ semana: out, nota: 'O roteiro de cada item é escrito seguindo estudio/estrategia.json (voz, regras, o que nunca inventar).' }, null, 2));
}

async function main() {
  if (cmd === 'pauta') return pauta();
  if (cmd === 'dirigir') {
    const TC = carregarMotor(), sinais = carregarSinais();
    const rot = JSON.parse(fs.readFileSync(alvo, 'utf8'));
    const { plano } = dirigir(TC, sinais, rot);
    const out = path.join(path.dirname(alvo), 'plano.json');
    fs.writeFileSync(out, JSON.stringify(plano, null, 2));
    const res = validarPlano(TC, sinais, plano, null);
    res.forEach((r) => console.log(r.nivel.padEnd(5), r.cue || '-', r.msg));
    const erros = res.filter((r) => r.nivel === 'erro').length;
    console.log(erros ? `${erros} erro(s)` : `plano ok: ${plano.cues.length} animações, ${plano.video.duracao}s`);
    process.exit(erros ? 1 : 0);
  }
  if (cmd === 'montar') return montar(path.resolve(alvo));
  console.log('uso: dirigir <roteiro.json> | montar <pasta> | pauta');
}
if (process.argv[1].endsWith('estudio.mjs')) main().catch((e) => { console.error(e.message || e); process.exit(1); });
